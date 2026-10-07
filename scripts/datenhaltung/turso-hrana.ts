// scripts/datenhaltung/turso-hrana.ts
// Hrana-HTTP-Transport des Turso-Syncs (aus turso-sync.ts herausgeloest, E0-BRANDSCHUTZ
// 7.10.2026, §6.6: das Skript wuchs mit dem Delta ueber die 800-Zeilen-Schwelle). Die
// Funktionen sind UNVERAENDERT verschoben — nur `export` ist neu, und `pipelineRoh` liefert
// zusaetzlich die Ergebnis-Zeilen (fuer das Lesen innerhalb der Delta-Transaktion).
//
// Seiteneffektfrei beim Import (kein Sync-Start, kein process.exit) — anders als turso-sync.ts.
// Secrets: Der Aufrufer reicht `token` herein; hier wird nichts geloggt ausser SQL-Anfaengen.
import type { Stmt, Wert } from './turso-transport';
import { CommitUnklarFehler, type Fern, type FernTx } from './turso-delta';

/** fetch mit Retry (transienten Netz-/5xx-Fehlern gewachsen — der Lauf ist lang). */
export async function fetchRetry(input: string, init: RequestInit, versuche = 4): Promise<Response> {
  let letzter: unknown;
  for (let i = 0; i < versuche; i++) {
    try {
      const res = await fetch(input, init);
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      letzter = e;
      // Nach dem LETZTEN Versuch nicht mehr schlafen — der Fehler fliegt ohnehin
      // (Gegenprüfungs-Befund B10: bis zu 15 s sinnlose Wartezeit vor dem Werfen).
      if (i === versuche - 1) break;
      const wartezeit = [1000, 4000, 10000][i] ?? 15000;
      process.stdout.write(`\n  retry ${i + 1}/${versuche - 1} in ${wartezeit / 1000}s (${e instanceof Error ? e.message : e})\n`);
      await new Promise((r) => setTimeout(r, wartezeit));
    }
  }
  throw letzter;
}

export function kodiereArg(v: Wert) {
  if (v === null) return { type: 'null' as const, value: null };
  if (typeof v === 'number') return { type: 'integer' as const, value: String(v) };
  // BLOB (FTS5-Shadow-Spalten `block`/`term`/`sz`): Hrana erwartet `base64`, NICHT `value`.
  if (v instanceof Uint8Array) return { type: 'blob' as const, base64: Buffer.from(v).toString('base64') };
  return { type: 'text' as const, value: v };
}

/** Ein Hrana-Request. `close: false` hält den Stream offen und liefert einen `baton`,
 *  mit dem ein Folge-Request auf DERSELBEN Verbindung (und damit in derselben
 *  Transaktion) weitermacht. Fehler werden zurückgegeben, nicht geworfen — der Aufrufer
 *  entscheidet, ob er COMMIT oder ROLLBACK schickt. */
export async function pipelineRoh(
  url: string,
  token: string,
  stmts: Stmt[],
  opt: { baton?: string | null; close: boolean },
): Promise<{ baton: string | null; fehler: string[]; ergebnisse: Wert[][][] }> {
  const body: Record<string, unknown> = {
    requests: [
      ...stmts.map((s) => ({
        type: 'execute' as const,
        stmt: { sql: s.sql, args: (s.args ?? []).map(kodiereArg) },
      })),
      ...(opt.close ? [{ type: 'close' as const }] : []),
    ],
  };
  if (opt.baton) body.baton = opt.baton;
  const res = await fetchRetry(`${url}/v2/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Turso HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const daten = (await res.json()) as {
    baton?: string | null;
    results: Array<{ type: string; error?: { message: string }; response?: { result?: { rows?: HranaZelle[][] } } }>;
  };
  const fehler = daten.results
    .map((r, i) => (r.type === 'error' ? `«${stmts[i]?.sql.slice(0, 60)}…» → ${r.error?.message}` : null))
    .filter((x): x is string => x !== null);
  // Ergebnis-Zeilen je Statement (leer bei Schreib-Statements) — das Delta liest damit INNERHALB
  // der offenen Transaktion. Die `close`-Antwort am Ende wird nicht ausgewertet.
  const ergebnisse = stmts.map((_, i) => (daten.results[i]?.response?.result?.rows ?? []).map((z) => z.map(dekodiereZelle)));
  return { baton: daten.baton ?? null, fehler, ergebnisse };
}

/** Eine Hrana-Ergebnis-Zelle. */
interface HranaZelle {
  type: string;
  value?: string | number | null;
  base64?: string;
}

/** Hrana → Wert. Ganzzahlen ausserhalb von ±2^53 wuerden als `number` still verfaelscht — das
 *  wird hier laut abgelehnt (FTS5-Block-IDs liegen bei segid·2^37, weit darunter). */
function dekodiereZelle(z: HranaZelle): Wert {
  switch (z.type) {
    case 'null':
      return null;
    case 'integer': {
      const n = Number(z.value);
      if (!Number.isSafeInteger(n)) throw new Error(`Hrana-Ganzzahl ${z.value} ausserhalb des sicheren Bereichs`);
      return n;
    }
    case 'float':
      return Number(z.value);
    case 'blob':
      return new Uint8Array(Buffer.from(z.base64 ?? '', 'base64'));
    default:
      return String(z.value ?? '');
  }
}

export async function pipeline(url: string, token: string, stmts: Stmt[]): Promise<void> {
  const { fehler } = await pipelineRoh(url, token, stmts, { close: true });
  if (fehler.length > 0) throw new Error(`Turso stmt-Fehler: ${fehler.join(' · ')}`);
}

/**
 * Führt `stmts` als ECHTE Transaktion aus: BEGIN + Statements in Request 1 (Stream bleibt
 * offen), Ergebnisse prüfen, dann COMMIT — oder bei jedem Fehler ROLLBACK.
 *
 * Warum nicht einfach BEGIN/…/COMMIT in EINEM Request: die Hrana-Pipeline bricht bei einem
 * fehlgeschlagenen Statement NICHT ab. Die Folge-Statements laufen weiter und das
 * mitgeschickte COMMIT gelingt — der Teilzustand wird also festgeschrieben. Empirisch
 * belegt (Gegenprüfung Runde 2): `BEGIN · DROP a · DROP b · RENAME a_neu→a ·
 * RENAME b_neu→b (Fehler) · COMMIT` liess Tabelle `b` DAUERHAFT verschwinden — exakt der
 * Zustand des Vorfalls vom 19.7. Mit getrenntem COMMIT über den `baton` überlebt der alte
 * Stand denselben Fehler unversehrt (ebenfalls empirisch belegt).
 *
 * Stirbt der Prozess zwischen den beiden Requests, wird nie committet — Turso verwirft den
 * offenen Stream, der alte Stand bleibt stehen. Genau das ist hier die gewünschte Semantik.
 */
export async function transaktion(url: string, token: string, stmts: Stmt[]): Promise<void> {
  const phase1 = await pipelineRoh(url, token, [{ sql: 'BEGIN' }, ...stmts], { close: false });
  if (phase1.fehler.length > 0) {
    await pipelineRoh(url, token, [{ sql: 'ROLLBACK' }], { baton: phase1.baton, close: true }).catch(() => undefined);
    throw new Error(`Transaktion zurückgerollt (Live-Stand unverändert): ${phase1.fehler.join(' · ')}`);
  }
  const phase2 = await pipelineRoh(url, token, [{ sql: 'COMMIT' }], { baton: phase1.baton, close: true });
  if (phase2.fehler.length > 0) throw new Error(`COMMIT fehlgeschlagen: ${phase2.fehler.join(' · ')}`);
}

/**
 * Die Gegenseite als `Fern` (turso-delta.ts): einzelne Lese-Requests und eine Transaktion
 * ueber mehrere Requests auf EINEM Hrana-Stream (`baton`) — BEGIN im ersten, COMMIT im
 * letzten. Wirft die Funktion oder meldet ein Statement einen Fehler, folgt ROLLBACK; der
 * Teilzustand wird nie festgeschrieben (Lehre von `transaktion()` oben, 19.7.2026).
 */
export function hranaFern(url: string, token: string): Fern {
  const lese = async (sql: string, args: Wert[] = []): Promise<Wert[][]> => {
    const r = await pipelineRoh(url, token, [{ sql, args }], { close: true });
    if (r.fehler.length > 0) throw new Error(`Turso stmt-Fehler: ${r.fehler.join(' · ')}`);
    return r.ergebnisse[0];
  };
  return {
    lese,
    async transaktion<T>(fn: (tx: FernTx) => Promise<T>): Promise<T> {
      let baton: string | null = null;
      let begonnen = false;
      const sende = async (stmts: Stmt[]): Promise<Wert[][][]> => {
        const mitBegin = !begonnen;
        const r = await pipelineRoh(url, token, mitBegin ? [{ sql: 'BEGIN' }, ...stmts] : stmts, { baton, close: false });
        begonnen = true;
        baton = r.baton;
        if (r.fehler.length > 0) throw new Error(`Turso stmt-Fehler: ${r.fehler.join(' · ')}`);
        if (!baton) throw new Error('Turso lieferte keinen baton — Transaktion nicht fortsetzbar');
        return mitBegin ? r.ergebnisse.slice(1) : r.ergebnisse;
      };
      const tx: FernTx = {
        ausfuehren: async (stmts) => {
          await sende(stmts);
        },
        lese: async (sql, args = []) => (await sende([{ sql, args }]))[0],
      };
      try {
        await sende([]);
        const aus = await fn(tx);
        // Wirft der COMMIT-REQUEST selbst (Netz, 5xx nach den Wiederholungen, HTTP-Fehler eines
        // Wiederholungsversuchs mit schon verbrauchtem baton), ist der Ausgang UNKLAR: der Server
        // kann festgeschrieben haben, nur die Antwort ging verloren. Das ist etwas anderes als eine
        // Fehlerantwort (`c.fehler`): die weist das COMMIT eindeutig ab.
        let c: Awaited<ReturnType<typeof pipelineRoh>>;
        try {
          c = await pipelineRoh(url, token, [{ sql: 'COMMIT' }], { baton, close: true });
        } catch (ce) {
          baton = null; // kein ROLLBACK auf einen moeglicherweise schon beendeten Stream
          throw new CommitUnklarFehler(ce instanceof Error ? ce.message : String(ce));
        }
        if (c.fehler.length > 0) throw new Error(`COMMIT fehlgeschlagen: ${c.fehler.join(' · ')}`);
        baton = null;
        return aus;
      } catch (e) {
        if (baton) await pipelineRoh(url, token, [{ sql: 'ROLLBACK' }], { baton, close: true }).catch(() => undefined);
        throw e;
      }
    },
  };
}

export async function abfrage(url: string, token: string, sql: string): Promise<string | null> {
  const res = await fetchRetry(`${url}/v2/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql } }, { type: 'close' }] }),
  });
  if (!res.ok) throw new Error(`Turso HTTP ${res.status}`);
  const daten = (await res.json()) as {
    results: Array<{ response?: { result?: { rows: Array<Array<{ value: string | null }>> } } }>;
  };
  return daten.results[0]?.response?.result?.rows[0]?.[0]?.value ?? null;
}
