// scripts/datenhaltung/turso-sync.ts
// QS-DATA E2: synchronisiert die HOT-Replika in die Turso-DB (FAHRPLAN-DATENHALTUNG §5 E2 + §6).
//
// VOLL-REBUILD-Semantik (Weiche C, §10(7)): jede Synchronisation baut die Ziel-Tabellen
// komplett neu — determinismus-beweisbar, kein Delta-Drift. Quelle sind die lokalen
// Doktyp-Artefakte (daten/normtext.db + daten/rechtsprechung.db, ihrerseits aus den
// committeten JSONs reproduzierbar) — die amtliche Quelle bleibt Arbiter, Turso ist reine
// Serving-Kopie (§0 selbst-gehostet-Prinzip: portabel, Anbieterwechsel = andere URL).
//
// SCHATTEN-TABELLEN statt DROP-zuerst (Reparatur 20.7.2026). Der frühere Ablauf war
// DROP → CREATE → Bulk-Load: jeder Abbruch mittendrin (CI-Timeout!) liess die Prod-Replika
// HALB LEER zurück — genau das ist am 19./20.7.2026 passiert (remote artikel 16'400 von
// 55'822, fts_entscheide_schaufenster gar nicht vorhanden), und api/suche hat tagelang
// einen verstümmelten Index serviert, ohne rot zu werden. Jetzt wird in `<tabelle>_neu`
// geladen, VOR dem Tausch verifiziert und erst dann getauscht — der Tausch selbst läuft als
// echte Transaktion über zwei Requests (`transaktion()`, BEGIN und COMMIT getrennt über den
// Hrana-`baton`). Ein Abbruch während des Ladens lässt den alten, vollständigen Stand
// unangetastet; ein Fehler im Tausch rollt zurück, statt einen Teilzustand festzuschreiben.
//
// TRANSPORT-ÖKONOMIE (Reparatur 20.7.2026, gemessen). Der frühere Weg schickte je Zeile ein
// eigenes `execute` in die Pipeline. Jedes `execute` ist bei Hrana eine EIGENE implizite
// Transaktion → ein durabler Commit samt Replikation PRO ZEILE. Gemessen (aws-eu-west-1):
//   400 Einzel-Statements ohne Transaktion ....  12'131 ms →    33 Zeilen/s
//   400 Einzel-Statements mit BEGIN/COMMIT ....     525 ms →   762 Zeilen/s
//   400 Zeilen als Mehrzeilen-INSERT ..........     280 ms →  1429 Zeilen/s
// Bei 61k Zeilen sind das 46 min gegen ~1 min — der 20-min-Job-Timeout war die Folge, nicht
// die Ursache. Darum: Mehrzeilen-`INSERT ... VALUES (…),(…),…`, mehrere Statements je
// Request, das Ganze in BEGIN/COMMIT geklammert. Die Schranken (Bind-Parameter, Statement-
// und Request-Grösse) rechnen Argument-Nutzlast UND SQL-Gerüst in der Hrana-Kodierung —
// `zeilenBytes()` erklärt, warum eine pauschale Schätzung hier zweimal danebenlag, und
// `ladeWerte()`, warum das SQL mitgezählt werden muss. Kompression wurde geprüft und
// VERWORFEN: der Endpunkt lehnt `Content-Encoding: gzip` mit HTTP 400 ab (empirisch).
//
// DER INDEX WANDERT, NICHT DIE ZEILEN (QS-CODE-TURSO, 4.8.2026 — Wurzel-Fix des Engpasses,
// den die Fassung vom 20.7. noch als «verbleibend» stehen lassen musste).
//
// Der Befund damals: die Entscheid-Phase brauchte 22,3 der 32,8 Minuten (CI-Lauf
// 29757068566) — 5093 Zeilen / 157 MiB bei ~120 KiB/s. Die Bandbreiten-Hypothese war schon
// widerlegt (lokal identisch langsam), die Ursache aber nur vermutet. Sie ist jetzt gemessen,
// mit einer NULLPROBE über dieselbe Nutzlast (200 Zeilen / 7,07 MiB, je n=3, Median):
//   Zeilen → standalone FTS5 (der bisherige Pfad) .... 19,9 s →  364 KiB/s
//   Zeilen → GEWÖHNLICHE Tabelle (Nullprobe) .........  7,8 s →  946 KiB/s
// Der Aufschlag steckt also NICHT im Transport, sondern im FTS5-Schreibpfad der Gegenseite:
// sie tokenisiert und indexiert denselben Text ein zweites Mal und zahlt obendrein den
// LSM-Preis (jede Transaktion ein neues Segment, `automerge` schreibt sie wieder um).
//
// Und dieser Anteil ist SUPERLINEAR — das ist der eigentliche Grund für den Umbau. Derselbe
// Pfad, drei Korpus-Grössen: 364 KiB/s bei 200 Zeilen · 437 KiB/s bei 500 · 120 KiB/s über
// den vollen Korpus. Ein Budget, das an einer superlinearen Kurve hängt, wird nicht langsam,
// es REISST.
//
// Die Wurzel: der Index EXISTIERT lokal bereits. `fts.ts` baut ihn bei jedem
// `datenhaltung:build` deterministisch (empirisch geprüft: zwei Läufe → byte-gleiche
// Shadow-Tabellen). Ihn auf der Gegenseite neu abzuleiten war Doppelarbeit im Sinn von §5 —
// die Replika ist eine Projektion des lokalen Artefakts, keine zweite Quelle. Übertragen
// werden darum die FTS5-Shadow-Tabellen (`_data`, `_idx`, `_docsize`, `_config`, bei
// standalone zusätzlich `_content`); das sind gewöhnliche SQLite-Tabellen und laufen mit
// Plain-Durchsatz. Detail und Messreihen: `turso-fts-index.ts`.
//
// PREIS, ehrlich benannt (§8) — und er fällt je Tabelle verschieden aus (exakt gerechnet mit
// `zeilenBytes()` über den Korpus-Stand 21.7.2026):
//   fts_entscheide_schaufenster ... 165,3 → 253,8 MiB (+54 %), weil `_content` denselben Text
//                                   trägt wie bisher und der Index (base64, +33 %) dazukommt.
//   fts_artikel .................... 32,6 →  18,8 MiB (−42 %), weil das Ziel CONTENTLESS ist:
//                                   der Index ist kompakter als der Volltext, den der alte
//                                   Pfad schicken musste, um ihn dort neu zu indexieren.
// Wo mehr Bytes fliessen, lohnt es trotzdem: sie laufen mit Plain-Durchsatz, und die
// superlineare Indexarbeit der Gegenseite entfällt ganz.
//
// RESTRISIKO und wie es entdeckt wird: der Transport setzt voraus, dass die Gegenseite (a)
// Schreibzugriff auf Shadow-Tabellen zulässt und (b) dasselbe FTS5-Format liest, das lokal
// geschrieben wurde (`_config.version` = 4). Beides ist empirisch geprüft, aber keine
// Zusicherung von Turso — `node:sqlite` etwa verbietet (a) standardmässig
// (SQLITE_DBCONFIG_DEFENSIVE), der libsql-Server nicht. Darum läuft VOR dem Tausch der
// FTS5-eigene `integrity-check` über beide Indizes: er rechnet den Index gegen den Inhalt
// nach, und was ihn nicht besteht, geht nie live. Eine Zeilenzahl könnte das nicht leisten —
// sie bliebe bei fehlenden Index-Seiten RICHTIG, während die Suche still Treffer verlöre.
//
// HOT-Inhalt (§11.5): erlasse + erlass_fassungen + artikel + fts_artikel (contentless FTS5,
// lokal als external content über `artikel` gebaut — die Index-Shadowtabellen beider
// Bauarten sind byte-gleich, festgehalten in turso-fts-index.test.ts) und
// fts_entscheide_schaufenster (standalone, ALLE Schaufenster-Entscheide der
// rechtsprechung.db; der Bau filtert bewusst nicht, siehe fts.ts).
//
// Transport: Hrana-HTTP-Pipeline (/v2/pipeline), dependency-frei via fetch — derselbe
// Endpunkt, den api/suche.ts liest. Secrets: TURSO_AUTH_TOKEN aus Env oder
// daten/turso-token.txt (gitignored); NIE loggen.
//
// Aufruf: npm run datenhaltung:turso-sync   (vorher: npm run datenhaltung:build)
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { manifestDb } from './manifest';
import { parseDatenManifest } from './validierung';
import { ddlFtsArtikel, ddlFtsEntscheide } from './fts';
import { leseFtsSchatten, ftsDokumente } from './turso-fts-index';
import {
  zeilenBytes,
  MAX_PARAM_JE_STMT,
  MAX_BYTES_JE_STMT,
  MAX_BYTES_JE_REQUEST,
  STMT_OVERHEAD,
  TUPEL_TRENNER,
  REQUEST_OVERHEAD,
  type Wert,
} from './turso-transport';
import {
  BASIS, DDL_BASIS, SPALTEN_BASIS, EXIT_SPERRE, SQL_SIG_MARKEN,
  istSchreibsperre, planeSkip, pruefeKopplung, sigMarkenAusText, signaturenLokal, sperrMeldung,
} from './turso-skip';

const URL_STD = 'libsql://lexmetrik-ravedave.aws-eu-west-1.turso.io';
const TOKEN_DATEI = 'daten/turso-token.txt';
/** Committete Projektions-Signatur — Grundlage der Frische-Marke (§8-Wächter) UND des
 *  Quell-Riegels. Über `LEXMETRIK_MANIFEST` überschreibbar, damit der Riegel (positiv wie
 *  negativ) prüfbar ist, ohne die committete Datei anzufassen. */
export const MANIFEST_DATEI = process.env.LEXMETRIK_MANIFEST ?? 'daten-manifest.json';

/** Live-Tabellen der HOT-Replika, in Abhängigkeits-Reihenfolge (Basis zuerst).
 *  Der Tausch läuft sie vorwärts (RENAME) und rückwärts (DROP) ab. */
const SCHATTEN = ['erlasse', 'erlass_fassungen', 'artikel', 'fts_artikel', 'fts_entscheide_schaufenster'] as const;
/** FTS5-Teilmenge (eigener Bau- und Pruefweg: Index-Transfer statt Zeilen). */
const FTS_TABELLEN = ['fts_artikel', 'fts_entscheide_schaufenster'] as const;
/** Zugang, sobald geladen — der Sperr-Ausgang unten braucht ihn, um den Stand der Replika
 *  zu LESEN (Lesen ist bei erschoepftem Schreibkontingent nicht gesperrt). */
let zugang: { url: string; token: string } | null = null;

interface Stmt {
  sql: string;
  args?: Wert[];
}

function httpUrl(basis: string): string {
  return basis.replace(/^libsql:\/\//, 'https://').replace(/\/$/, '');
}

function ladeZugang(): { url: string; token: string } {
  const url = process.env.TURSO_DATABASE_URL ?? URL_STD;
  const token =
    process.env.TURSO_AUTH_TOKEN ??
    (existsSync(TOKEN_DATEI) ? readFileSync(TOKEN_DATEI, 'utf8').trim() : '');
  if (!token) {
    console.error(`turso-sync ROT: kein Token (Env TURSO_AUTH_TOKEN oder ${TOKEN_DATEI}).`);
    process.exit(1);
  }
  return { url: httpUrl(url), token };
}

/** fetch mit Retry (transienten Netz-/5xx-Fehlern gewachsen — der Lauf ist lang). */
async function fetchRetry(input: string, init: RequestInit, versuche = 4): Promise<Response> {
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

function kodiereArg(v: Wert) {
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
async function pipelineRoh(
  url: string,
  token: string,
  stmts: Stmt[],
  opt: { baton?: string | null; close: boolean },
): Promise<{ baton: string | null; fehler: string[] }> {
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
    results: Array<{ type: string; error?: { message: string } }>;
  };
  const fehler = daten.results
    .map((r, i) => (r.type === 'error' ? `«${stmts[i]?.sql.slice(0, 60)}…» → ${r.error?.message}` : null))
    .filter((x): x is string => x !== null);
  return { baton: daten.baton ?? null, fehler };
}

async function pipeline(url: string, token: string, stmts: Stmt[]): Promise<void> {
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
async function transaktion(url: string, token: string, stmts: Stmt[]): Promise<void> {
  const phase1 = await pipelineRoh(url, token, [{ sql: 'BEGIN' }, ...stmts], { close: false });
  if (phase1.fehler.length > 0) {
    await pipelineRoh(url, token, [{ sql: 'ROLLBACK' }], { baton: phase1.baton, close: true }).catch(() => undefined);
    throw new Error(`Transaktion zurückgerollt (Live-Stand unverändert): ${phase1.fehler.join(' · ')}`);
  }
  const phase2 = await pipelineRoh(url, token, [{ sql: 'COMMIT' }], { baton: phase1.baton, close: true });
  if (phase2.fehler.length > 0) throw new Error(`COMMIT fehlgeschlagen: ${phase2.fehler.join(' · ')}`);
}

async function abfrage(url: string, token: string, sql: string): Promise<string | null> {
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

// Schranken + Nutzlast-Schätzung leben in einem seiteneffekt-freien Nachbarmodul, damit
// Unit-Tests sie prüfen können, ohne dieses Skript (und damit den Sync) zu starten.
export { zeilenBytes, MAX_PARAM_JE_STMT, MAX_BYTES_JE_STMT, MAX_BYTES_JE_REQUEST };

/**
 * Bulk-Load einer Tabelle über Mehrzeilen-INSERTs.
 *
 * Zwei Ebenen der Bündelung, beide daten-getrieben gedeckelt:
 *   1. Zeilen → Statement: `INSERT … VALUES (…),(…),…` bis MAX_PARAM_JE_STMT oder
 *      MAX_BYTES_JE_STMT erreicht ist (mindestens eine Zeile, auch wenn sie allein
 *      übergross ist — sonst käme sie nie durch).
 *   2. Statements → Request: bis MAX_BYTES_JE_REQUEST, geklammert in BEGIN/COMMIT, damit
 *      der Request EINEN durablen Commit auslöst statt einen je Zeile (43× schneller, s. o.).
 *
 * Reihenfolge bleibt `ORDER BY rowid` — der Ziel-rowid-Lauf ist damit identisch zur lokalen
 * DB, was `fts_artikel` (contentless, rowid == artikel.rowid) überhaupt erst tragfähig macht.
 */
async function ladeTabelle(
  url: string,
  token: string,
  lokal: DatabaseSync,
  quellTabelle: string,
  zielTabelle: string,
  spalten: string[],
): Promise<number> {
  const rows = lokal
    .prepare(`SELECT ${spalten.join(', ')} FROM ${quellTabelle} ORDER BY rowid`)
    .all() as Array<Record<string, Wert>>;
  const werteJeZeile = rows.map((r) => spalten.map((s) => r[s] ?? null));
  return ladeWerte(url, token, zielTabelle, spalten, werteJeZeile);
}

/** Kern des Mehrzeilen-Transports — nimmt fertige Wert-Tupel (auch berechnete wie fts_artikel). */
async function ladeWerte(
  url: string,
  token: string,
  zielTabelle: string,
  spalten: string[],
  werteJeZeile: Wert[][],
): Promise<number> {
  const kopf = `INSERT INTO ${zielTabelle} (${spalten.join(', ')}) VALUES `;
  const tupel = `(${spalten.map(() => '?').join(', ')})`;
  const tupelBytes = Buffer.byteLength(tupel, 'utf8') + TUPEL_TRENNER;
  const beginn = Date.now();

  let stmts: Stmt[] = [];
  // Startwert = Rahmen des Requests selbst (`{"requests":[…]}` + BEGIN/COMMIT/close). Die
  // Statement-Summe allein liess ihn aussen vor; real lag der Body dadurch konstant ~107 B
  // über der Schätzung (Gegenprüfung Runde 4, B5 — heute unerreichbar, aber die Schranke
  // soll eine Schranke sein und nicht knapp danebenliegen).
  let requestBytes = REQUEST_OVERHEAD;
  let gesendet = 0;

  const absenden = async (): Promise<void> => {
    if (stmts.length === 0) return;
    // BEGIN/COMMIT klammert den ganzen Request zu EINER Transaktion (der eigentliche Hebel).
    await pipeline(url, token, [{ sql: 'BEGIN' }, ...stmts, { sql: 'COMMIT' }]);
    stmts = [];
    requestBytes = REQUEST_OVERHEAD;
    const sek = (Date.now() - beginn) / 1000;
    process.stdout.write(
      `  ${zielTabelle}: ${gesendet}/${werteJeZeile.length} (${(gesendet / Math.max(sek, 0.001)).toFixed(0)} Zeilen/s)\r`,
    );
  };

  let i = 0;
  while (i < werteJeZeile.length) {
    // Ebene 1: so viele Zeilen in EIN Statement, wie Parameter- und Byte-Schranke zulassen.
    // Mitgezählt wird nicht nur die Argument-Nutzlast, sondern auch das SQL-GERÜST: der
    // Statement-Kopf, je Zeile das `(?, ?, …)`-Tupel und der `execute`-Rahmen. Ohne das
    // unterschätzte die Schranke schmale Tabellen massiv — `fts_artikel` hat nur zwei
    // Spalten und packte bis zu 4000 Tupel in ein Statement, deren SQL-Text allein die
    // Reserve auffrass: real 3,023 MiB gegen eine 3,00-MiB-Schranke (Gegenprüfung Runde 3).
    const gruppe: Wert[][] = [];
    let stmtBytes = STMT_OVERHEAD + Buffer.byteLength(kopf, 'utf8');
    while (i < werteJeZeile.length) {
      const b = zeilenBytes(werteJeZeile[i]) + tupelBytes;
      const passt =
        gruppe.length === 0 ||
        ((gruppe.length + 1) * spalten.length <= MAX_PARAM_JE_STMT && stmtBytes + b <= MAX_BYTES_JE_STMT);
      if (!passt) break;
      gruppe.push(werteJeZeile[i]);
      stmtBytes += b;
      i++;
    }
    // Ebene 2: Passt das Statement NICHT mehr in den laufenden Request, wird ZUERST
    // abgesendet. (Vorher wurde erst angehängt und danach geprüft — eine übergrosse
    // Einzelzeile konnte so auf einen bereits fast vollen Request draufsatteln;
    // Gegenprüfungs-Befund B7, real: BS-Entscheid SB.2018.46 mit 777 KiB.)
    if (stmts.length > 0 && requestBytes + stmtBytes > MAX_BYTES_JE_REQUEST) await absenden();
    stmts.push({ sql: kopf + gruppe.map(() => tupel).join(', '), args: gruppe.flat() });
    gesendet += gruppe.length;
    requestBytes += stmtBytes;
  }
  await absenden();

  const sek = (Date.now() - beginn) / 1000;
  process.stdout.write(
    `  ${zielTabelle}: ${werteJeZeile.length}/${werteJeZeile.length} in ${sek.toFixed(1)}s (${(werteJeZeile.length / Math.max(sek, 0.001)).toFixed(0)} Zeilen/s)\n`,
  );
  return werteJeZeile.length;
}

/**
 * Überträgt den FERTIGEN lokalen FTS5-Index in die (soeben angelegte, leere) Ziel-Tabelle,
 * statt die Zeilen hineinzuschreiben und die Gegenseite neu indexieren zu lassen.
 *
 * Warum das der Wurzel-Fix des Durchsatzes ist, steht im Kopf von `turso-fts-index.ts`
 * samt Nullprobe. Kurz: der Aufschlag lag nie am Transport, sondern am FTS5-Schreibpfad
 * der Gegenseite — und der wächst mit dem Index, weshalb das Zeit-Budget mit dem Korpus
 * REISST statt bloss langsamer zu werden.
 *
 * `mitContent` beschreibt die ZIEL-Tabelle: standalone (Text physisch gespeichert, native
 * `snippet()`) trägt `_content` mit, contentless nicht.
 * @returns Dokumentzahl des übertragenen Index (aus `_docsize` der lokalen Quelle).
 */
async function ladeFtsIndex(
  url: string,
  token: string,
  lokal: DatabaseSync,
  quellTabelle: string,
  zielTabelle: string,
  mitContent: boolean,
): Promise<number> {
  // Eine frisch per CREATE VIRTUAL TABLE angelegte FTS5-Tabelle ist NICHT leer: `_data` trägt
  // die averages- und structure-Zeile, `_config` die Formatversion. Ohne dieses Leeren
  // kollidierte das Laden an deren PRIMARY KEYs — und zwar erst mitten im Lauf.
  await pipeline(url, token, [
    { sql: `DELETE FROM ${zielTabelle}_data` },
    { sql: `DELETE FROM ${zielTabelle}_config` },
  ]);
  for (const ladung of leseFtsSchatten(lokal, quellTabelle, mitContent)) {
    await ladeWerte(url, token, `${zielTabelle}${ladung.suffix}`, ladung.spalten, ladung.werte);
  }
  return ftsDokumente(lokal, quellTabelle);
}

/**
 * FTS5-eigener `integrity-check`: rechnet den Index gegen den gespeicherten Inhalt nach und
 * schlägt fehl, wenn auch nur eine Index-Seite fehlt oder nicht zum Inhalt passt.
 *
 * Das ist die eigentliche Absicherung des Shadow-Transports — eine Zeilenzahl bewiese hier
 * nichts: fehlte eine `_data`-Seite, blieben `count(*)` und die Dokumentzahl unverändert
 * RICHTIG, während die Suche still Treffer verlöre. Genau diesen Fall zeigt
 * `turso-fts-index.test.ts` einmal rot (§6.7).
 */
async function integritaet(url: string, token: string, tabelle: string): Promise<void> {
  await pipeline(url, token, [{ sql: `INSERT INTO ${tabelle}(${tabelle}) VALUES('integrity-check')` }]);
}

// Die REMOTE-DDLs kommen ausnahmslos aus fts.ts (`ddlFtsArtikel`, `ddlFtsEntscheide`) —
// derselben Quelle, die die lokalen Tabellen anlegt (§5). Eine lokale Kopie, und sei es
// nur des TOKENIZER-Strings, wäre ein stiller Bruchvektor: bei Drift ginge der lokal
// gebaute Index in eine Remote-Tabelle mit anderem Query-Tokenizer, contentless
// integrity-check und Sync-Smoke blieben grün, jede Diakritik-Suche verlöre still alle
// Treffer (Gegenprüfung 4.8.2026, Befund F1 mit empirischer Probe). Seit dem 31.8.2026
// gilt das auch für die Entscheide-Tabelle, deren Spaltenliste hier bis dahin ein zweites
// Mal von Hand stand.

async function main(): Promise<void> {
  zugang = ladeZugang();
  const { url, token } = zugang;
  const normtext = new DatabaseSync('daten/normtext.db');
  const rspr = new DatabaseSync('daten/rechtsprechung.db');

  console.log('turso-sync: Rebuild der Hot-Replika beginnt (Weiche C, tabellenweise).');

  // 0a) QUELL-RIEGEL gegen das committete Manifest — die einzige UNABHÄNGIGE Zahl.
  //
  //     Ohne diesen Riegel validiert sich die ganze Kette gegen sich selbst: der Sync zählt,
  //     was er geladen hat, verifiziert diese Zahl gegen sich selbst, schreibt sie als Soll
  //     in `sync_meta`, und der Wächter vergleicht später Ist gegen genau dieses Soll. Ein
  //     verstümmelter lokaler Build (etwa `daten/normtext.db` mit 100 statt 55'822 Artikeln)
  //     liefe damit sauber durch, ginge live und wäre in ALLEN Toren grün — exakt der stille
  //     Fehlmodus, dessentwegen dieser Sync überhaupt repariert wurde (Gegenprüfung Runde 4).
  //     `daten-manifest.json` ist committet, wird vom Tor `check:datenhaltung` gegen den
  //     Generator gehalten und ist damit unabhängig von dem, was hier gerade geladen wird.
  //     Verglichen werden Zeilenzahl UND Inhalts-`sha` je Tabelle. Die Zeilenzahl allein
  //     genügt nicht: ein Build mit richtiger Anzahl und falschem Inhalt liefe durch
  //     (Gegenprüfung Runde 5, M1) — dieselbe Lücke, die im Wächter schon als «‹nicht leer›
  //     reicht nicht» erkannt worden war. Der sha kommt aus `manifestDb()`, also aus exakt
  //     derselben Kanonisierung, die `daten-manifest.json` erzeugt hat.
  // V6 (QS-VERWENDEN): Formprüfung an der Grenze statt ungeprüftem Typ-Cast —
  // ein verstümmeltes Manifest bricht hier klar ab, statt als `undefined`
  // stillschweigend durch den Quell-Riegel unten zu rutschen.
  const manifest = parseDatenManifest(JSON.parse(readFileSync(MANIFEST_DATEI, 'utf8')), MANIFEST_DATEI);
  const istNormtext = manifestDb(normtext);
  const istRspr = manifestDb(rspr);
  const zuPruefen: Array<[string, { zeilen: number; sha: string } | undefined, { zeilen: number; sha: string } | undefined]> = [
    ['erlasse', istNormtext['erlasse'], manifest['normtext.db']?.erlasse],
    ['erlass_fassungen', istNormtext['erlass_fassungen'], manifest['normtext.db']?.erlass_fassungen],
    ['artikel', istNormtext['artikel'], manifest['normtext.db']?.artikel],
    ['eintrag (Entscheide)', istRspr['eintrag'], manifest['rechtsprechung.db']?.eintrag],
  ];
  const quellFehler = zuPruefen.filter(
    ([, ist, soll]) => !ist || !soll || ist.zeilen !== soll.zeilen || ist.sha !== soll.sha,
  );
  if (quellFehler.length > 0) {
    console.error('turso-sync ROT: lokaler Build weicht vom committeten daten-manifest.json ab —');
    for (const [name, ist, soll] of quellFehler) {
      console.error(
        `  ${name}: lokal ${ist ? `${ist.zeilen} Zeilen / sha ${ist.sha.slice(0, 12)}…` : '(Tabelle fehlt)'}` +
          ` · Manifest ${soll ? `${soll.zeilen} Zeilen / sha ${soll.sha.slice(0, 12)}…` : '(Eintrag fehlt)'}`,
      );
    }
    console.error('Es wird NICHTS an die Live-Replika geschickt. Zuerst `npm run datenhaltung:build`');
    console.error('neu fahren (und `npm run check:datenhaltung` grün bekommen).');
    process.exit(1);
  }
  console.log(
    `  Quell-Riegel: lokaler Build == daten-manifest.json in Zeilenzahl UND sha (${zuPruefen
      .map(([n, ist]) => `${n} ${ist?.zeilen}`)
      .join(' · ')}).`,
  );

  // 0a') INDEX-RIEGEL. Seit QS-CODE-TURSO wandert der FERTIGE lokale FTS5-Index über den
  //      Draht statt der Zeilen. Damit gilt der Quell-Riegel oben nur noch für die halbe
  //      Ladung: er prüft die BASIS-Tabellen gegen das Manifest, sagt aber nichts über den
  //      Index, der aus ihnen abgeleitet wurde. Das Manifest kann ihn auch nicht abdecken —
  //      `manifest.ts/tabellen()` klammert die FTS-Tabellen bewusst aus (rebuildbare
  //      Ableitung). Ein Index aus einem ÄLTEREN Build läge also unbemerkt daneben und ginge
  //      live: gleiche Zeilenzahl, falsche Treffer. Darum hier hart gegen die Basis-Zahlen.
  //      GRENZE (Gegenprüfung 4.8.2026, F2): Der Riegel prüft ZAHLEN, keine Inhalte — ein
  //      veralteter Index mit gleicher Dokumentzahl passiert ihn, und für contentless ist
  //      auch der Remote-integrity-check inhaltsblind. Real eng mitigiert, weil build.ts
  //      Basis+Index in einem Zug baut und der Quell-Riegel die Basis per sha ans Manifest
  //      bindet; das Restfenster ist eine handgebastelte DB.
  const nFtsArtikel = ftsDokumente(normtext, 'fts_artikel');
  const nEntscheide = ftsDokumente(rspr, 'fts_entscheide_schaufenster');
  const indexRiegel: Array<[string, number, number]> = [
    ['fts_artikel', nFtsArtikel, istNormtext['artikel']?.zeilen ?? -1],
    ['fts_entscheide_schaufenster', nEntscheide, istRspr['eintrag']?.zeilen ?? -1],
  ];
  const indexFehler = indexRiegel.filter(([, ist, soll]) => ist !== soll);
  if (indexFehler.length > 0) {
    console.error('turso-sync ROT: lokaler FTS-Index passt nicht zu den lokalen Basis-Tabellen —');
    for (const [name, ist, soll] of indexFehler) {
      console.error(`  ${name}: Index ${ist} Dokumente · Basis ${soll} Zeilen`);
    }
    console.error('`npm run datenhaltung:build` neu fahren (er baut Basis UND Index in einem Zug).');
    process.exit(1);
  }
  console.log(
    `  Index-Riegel: lokaler FTS-Index deckt die Basis-Tabellen (${indexRiegel
      .map(([n, ist]) => `${n} ${ist}`)
      .join(' · ')}).`,
  );

  // 0) Schatten-Reste eines abgebrochenen Vorlaufs wegräumen (idempotenter Start).
  await pipeline(url, token, SCHATTEN.map((t) => ({ sql: `DROP TABLE IF EXISTS ${t}_neu` })));

  // 0aa) SKIP-PLAN (QS-TURSO-SCHREIBVOLUMEN, §17). Bis zum 15.9.2026 baute JEDER Lauf alle
  //      fünf Tabellen neu — 171 065 Zeilen, ×39 Läufe im September; das Schreibkontingent
  //      des Gratisplans war damit aufgebraucht. Jetzt bleibt eine Tabelle stehen, wenn ihre
  //      Signatur (Ziel-DDL + Inhalt) UND ihre Remote-Zeilenzahl passen. Herleitung, Grenzen
  //      und Tests: `turso-skip.ts`.
  const sollZeilen: Record<string, number> = {
    erlasse: istNormtext['erlasse']?.zeilen ?? -1,
    erlass_fassungen: istNormtext['erlass_fassungen']?.zeilen ?? -1,
    artikel: istNormtext['artikel']?.zeilen ?? -1,
    fts_artikel: nFtsArtikel,
    fts_entscheide_schaufenster: nEntscheide,
  };
  const lokaleSig = signaturenLokal(manifest['normtext.db'] ?? {}, sollZeilen, [
    ['fts_artikel', ddlFtsArtikel('fts_artikel'), leseFtsSchatten(normtext, 'fts_artikel', false)],
    ['fts_entscheide_schaufenster', ddlFtsEntscheide('fts_entscheide_schaufenster'),
      leseFtsSchatten(rspr, 'fts_entscheide_schaufenster', true)],
  ]);
  const plan = await planeSkip(
    lokaleSig,
    async () => sigMarkenAusText(await abfrage(url, token, SQL_SIG_MARKEN)),
    async (t) => {
      const n = Number(await abfrage(url, token, `SELECT count(*) FROM ${t}`));
      return Number.isFinite(n) ? n : null;
    },
  );
  /** Wird diese Tabelle in DIESEM Lauf neu gebaut? */
  const baue = (t: string): boolean => plan.get(t)?.skip !== true;
  for (const t of SCHATTEN) console.log(`  Skip-Plan ${t}: ${plan.get(t)?.grund ?? 'kein Befund — Neuaufbau'}`);

  // 0b) KORRESPONDENZ-RIEGEL fuer den TEILBAU (Gegenpruefungs-Befund B1, schwerster Befund).
  //     Wird `fts_artikel` neu gebaut, `artikel` aber uebersprungen, zeigt der contentless
  //     Index auf eine LIVE-Tabelle, die dieser Lauf nicht angefasst hat. Passt sie nicht zur
  //     lokalen DB, liefert die Suche systematisch den FALSCHEN Artikel — und Schritt 8
  //     schriebe trotzdem die volle Frische-Marke. Bis zum 15.9.2026 hing dieser Riegel am
  //     Handschalter `--nur-fts`; den gibt es nicht mehr (der Skip-Plan leistet dasselbe
  //     automatisch und signatur-belegt), die Gefahr aber sehr wohl. Herleitung: turso-skip.ts.
  if (baue('fts_artikel') && !baue('artikel')) {
    const stelle = normtext.prepare('SELECT rowid AS rid, erlass_key, art_id FROM artikel ORDER BY rowid LIMIT 1 OFFSET ?');
    const befunde = await pruefeKopplung({
      lokalZeilen: (t) => (normtext.prepare(`SELECT count(*) AS n FROM ${t}`).get() as { n: number }).n,
      remoteZeilen: async (t) => Number(await abfrage(url, token, `SELECT count(*) FROM ${t}`)),
      lokaleProbe: (i) => {
        const p = stelle.get(i) as { rid: number; erlass_key: string; art_id: string } | undefined;
        return p && { rid: p.rid, schluessel: `${p.erlass_key}|${p.art_id}` };
      },
      remoteProbe: (rid) => abfrage(url, token, `SELECT erlass_key || '|' || art_id FROM artikel WHERE rowid = ${rid}`),
    });
    if (befunde.length > 0) {
      console.error('turso-sync ROT: Teilbau unzulaessig — die uebersprungenen Basistabellen passen nicht zum lokalen Index:');
      for (const b of befunde) console.error(`  · ${b}`);
      console.error('Abhilfe: sync_meta-Signaturen verwerfen (DELETE FROM sync_meta) und voll neu bauen.');
      process.exit(1);
    }
    console.log('  Teilbau-Korrespondenz: Basistabellen zeilengleich, gestreute rowid-Proben deckungsgleich.');
  }

  // 1+2) DDL auf den SCHATTEN-Tabellen, dann laden. Die LIVE-Tabellen bleiben unangetastet,
  //    bis der Tausch in Schritt 6 gelingt. Gebaut wird nur, was `baue()` freigibt.
  const zahl: Record<string, number> = {};
  const basisNeu = BASIS.filter(baue);
  if (basisNeu.length > 0) {
    await pipeline(url, token, basisNeu.map((t) => ({ sql: DDL_BASIS[t](`${t}_neu`) })));
    for (const t of basisNeu) zahl[t] = await ladeTabelle(url, token, normtext, t, `${t}_neu`, SPALTEN_BASIS[t]);
  }

  // 3) FTS artikel: CONTENTLESS (content=''), rowid == artikel.rowid. Übertragen wird
  //    der FERTIGE lokale Index (fts.ts/baueFtsArtikel hat ihn beim `datenhaltung:build`
  //    gebaut) — es geht weder eine zweite Textkopie über den Draht noch tokenisiert die
  //    Gegenseite noch einmal.
  //
  //    SECHS SPALTEN seit QS-BASIS (d) K1 (31.8.2026): text · marginalie · marginalie_n ·
  //    gliederung · tabelle · fussnote. Die DDL kommt aus `ddlFtsArtikel()` in fts.ts —
  //    DERSELBEN Funktion, die die lokale Tabelle anlegt (§5). Hier eine zweite
  //    Spaltenliste von Hand zu führen wäre die klassische stille Falle: eine Abweichung
  //    in Zahl oder Reihenfolge der Spalten liesse den Shadow-Transport NICHT scheitern,
  //    sondern legte die bm25-Gewichte auf das falsche Feld.
  //
  //    Lokal ist die Tabelle seit K1 ebenfalls contentless (vorher: external content über
  //    `artikel` — eine Deklaration, die eine dort nie existierende Spalte `text`
  //    behauptete). Die frühere Bauart-Divergenz lokal/remote entfällt damit; die
  //    Byte-Gleichheit beider Bauarten bleibt in turso-fts-index.test.ts dokumentiert,
  //    wird vom Produktionspfad aber nicht mehr vorausgesetzt.
  if (baue('fts_artikel')) {
    await pipeline(url, token, [{ sql: ddlFtsArtikel('fts_artikel_neu') }]);
    await ladeFtsIndex(url, token, normtext, 'fts_artikel', 'fts_artikel_neu', false);
  }

  // 4) FTS Schaufenster-Entscheide: standalone (Text physisch gespeichert, native snippet()).
  //    Umfang = ALLE Einträge der rechtsprechung.db (Stand 20.7.2026: 5093) — kein Filter,
  //    damit die Suche denselben Korpus kennt, den der Reader zeigt (§8: keine stille Teilmenge).
  //
  //    Die DDL kommt seit dem 31.8.2026 aus `ddlFtsEntscheide()` in fts.ts — DERSELBEN
  //    Funktion, die die lokale Tabelle anlegt. Vorher stand die Spaltenliste hier ein
  //    zweites Mal von Hand: genau die stille Falle, vor der der Kommentar zu `fts_artikel`
  //    drei Absätze weiter oben warnt, nur für die Entscheide nie eingelöst.
  //    Auch hier wandert der FERTIGE Index (inkl. `_content`, weil standalone) statt der
  //    Zeilen. Das war die teuerste Phase des Syncs — 22,3 der 32,8 Minuten des CI-Laufs
  //    29757068566 — und der Grund für diesen Umbau.
  if (baue('fts_entscheide_schaufenster')) {
    await pipeline(url, token, [{ sql: ddlFtsEntscheide('fts_entscheide_schaufenster_neu') }]);
    await ladeFtsIndex(url, token, rspr, 'fts_entscheide_schaufenster', 'fts_entscheide_schaufenster_neu', true);
  }

  // 5) Verifikation VOR dem Tausch — auf den Schatten-Tabellen. Was hier rot ist, geht nie
  //    live; die alte, vollständige Replika bleibt in dem Fall unverändert stehen.
  console.log('  — Verifikation der Schatten-Tabellen (vor dem Tausch) —');
  // Geprüft wird, was GEBAUT wurde — eine übersprungene Tabelle hat gar keine
  // `_neu`-Schattentabelle; ihr Ist steht in der Nachkontrolle auf dem LIVE-Namen.
  const vorChecks: Array<[string, string, number]> = [];
  for (const t of basisNeu) vorChecks.push([`${t}_neu`, `SELECT count(*) FROM ${t}_neu`, zahl[t]]);
  if (baue('fts_artikel')) vorChecks.push(
    // ZEILENGLEICHHEIT fts_artikel == artikel ist die Invariante, an der der Such-Join
    // hängt — sie war bisher als einzige nirgends geprüft (Gegenprüfungs-Befund B5);
    // getestet wurde nur „MATCH liefert irgendwas". Jetzt hart gegen die Artikel-Zahl.
    ['fts_artikel_neu (zeilengleich artikel)', 'SELECT count(*) FROM fts_artikel_neu', nFtsArtikel],
    ['fts_artikel_neu MATCH "und"', "SELECT count(*) FROM fts_artikel_neu WHERE fts_artikel_neu MATCH '\"und\"'", -1],
    [
      'smoke "verjahrung" (diakritik-gefaltet)',
      `SELECT count(*) FROM fts_artikel_neu WHERE fts_artikel_neu MATCH '"verjahrung"'`,
      -1,
    ],
  );
  if (baue('fts_entscheide_schaufenster')) vorChecks.push(
    ['fts_entscheide_schaufenster_neu', 'SELECT count(*) FROM fts_entscheide_schaufenster_neu', nEntscheide],
    // Inhaltliche Probe der Entscheide MUSS hier stehen, nicht erst nach dem Tausch.
    // Vorher gab es für `fts_entscheide_schaufenster` nur die (selbstbezügliche) Zeilenzahl;
    // die einzige MATCH-Probe lief in der Nachkontrolle — also erst, NACHDEM der DROP die
    // intakte Live-Tabelle schon vernichtet hatte. Ein degenerierter Entscheid-Build hätte
    // den guten Stand zerstört und wäre erst danach rot geworden (Gegenprüfung Runde 4, B2).
    [
      'smoke Entscheide MATCH "beschwerde"',
      `SELECT count(*) FROM fts_entscheide_schaufenster_neu WHERE fts_entscheide_schaufenster_neu MATCH '"beschwerde"'`,
      -1,
    ],
  );
  let rot = false;
  for (const [name, sql, soll] of vorChecks) {
    const ist = Number(await abfrage(url, token, sql));
    const ok = soll === -1 ? ist > 0 : ist === soll;
    if (!ok) rot = true;
    console.log(`  verify ${name}: remote=${ist}${soll >= 0 ? ` soll=${soll}` : ''} ${ok ? 'OK' : 'ROT'}`);
  }
  // FTS5-INTEGRITÄT der übertragenen Indizes. Zählungen und MATCH-Proben oben zeigen nur,
  // DASS etwas ankam — sie könnten einen Index mit fehlenden Seiten nicht von einem
  // vollständigen unterscheiden, weil `count(*)` aus `_docsize` kommt und eine MATCH-Probe
  // schon bei einem einzigen Treffer grün wird. Erst `integrity-check` rechnet den Index
  // gegen den Inhalt nach. Steht bewusst VOR dem Tausch: was hier reisst, geht nie live.
  for (const t of FTS_TABELLEN.filter(baue).map((n) => `${n}_neu`)) {
    try {
      await integritaet(url, token, t);
      console.log(`  verify ${t} integrity-check: OK`);
    } catch (e) {
      rot = true;
      console.log(`  verify ${t} integrity-check: ROT (${e instanceof Error ? e.message : e})`);
    }
  }
  if (rot) {
    console.error('turso-sync ROT: Schatten-Tabellen unvollständig — KEIN Tausch, Live-Stand bleibt unverändert.');
    process.exit(1);
  }

  // 6) TAUSCH in EINER TRANSAKTION: alte Tabellen fallen lassen, Schatten umbenennen,
  //    Index neu. `ALTER TABLE … RENAME TO` trägt auf Turso für normale, standalone- UND
  //    contentless-FTS5-Tabellen (empirisch geprüft 20.7.2026, inkl. rowid-Erhalt).
  //
  //    Der Tausch läuft über `transaktion()` — BEGIN und COMMIT in GETRENNTEN Requests über
  //    den Hrana-`baton`. Ein einzelner Request mit BEGIN/…/COMMIT wäre NICHT atomar: die
  //    Pipeline bricht bei einem fehlgeschlagenen Statement nicht ab, das COMMIT gelingt
  //    trotzdem und schreibt den Teilzustand fest (Gegenprüfung Runde 2 hat genau damit eine
  //    Live-Tabelle dauerhaft verschwinden lassen). Siehe `transaktion()`.
  //
  //    Getauscht wird NUR, was gebaut wurde; Uebersprungenes bleibt unberuehrt stehen (der
  //    Skip-Plan hat Signatur UND Zeilenzahl geprueft). Bei einem VOLLSKIP entfaellt der
  //    Tausch ganz — der Lauf schreibt dann nur die Marken aus Schritt 8.
  const gebaut = SCHATTEN.filter(baue);
  if (gebaut.length === 0) {
    console.log('  Tausch entfaellt: keine Tabelle geaendert (Vollskip) — Live-Stand bleibt, wie er ist.');
  } else {
    const tausch: Stmt[] = [];
    for (const t of [...gebaut].reverse()) tausch.push({ sql: `DROP TABLE IF EXISTS ${t}` });
    for (const t of gebaut) tausch.push({ sql: `ALTER TABLE ${t}_neu RENAME TO ${t}` });
    // Der Index faellt mit `DROP TABLE artikel` — er wird darum genau dann neu angelegt,
    // wenn `artikel` selbst neu gebaut wurde (frueher: immer, weil immer gedroppt wurde).
    if (gebaut.includes('artikel')) tausch.push({ sql: 'CREATE INDEX ix_artikel_erlass ON artikel(erlass_key)' });
    await transaktion(url, token, tausch);
    console.log(`  Tausch vollzogen (${gebaut.length} Tabellen, atomar über baton-Transaktion).`);
  }

  // 7) Nachkontrolle auf den LIVE-Namen (doppelt verifiziert): der Tausch selbst könnte
  //    schiefgegangen sein, ohne dass ein Statement gefehlt hätte.
  console.log('  — Nachkontrolle auf den Live-Tabellen —');
  let nachRot = false;
  const nachChecks: Array<[string, string, number]> = [
    // Soll aus dem lokalen Artefakt (Manifest-gebunden) statt aus den Lade-Zaehlern — so
    // traegt die Nachkontrolle auch fuer UEBERSPRUNGENE Tabellen eine echte Zahl.
    ['artikel', 'SELECT count(*) FROM artikel', sollZeilen['artikel']],
    ['fts_artikel (zeilengleich artikel)', 'SELECT count(*) FROM fts_artikel', nFtsArtikel],
    ['fts_entscheide_schaufenster', 'SELECT count(*) FROM fts_entscheide_schaufenster', nEntscheide],
    ['fts_artikel MATCH "verjahrung"', `SELECT count(*) FROM fts_artikel WHERE fts_artikel MATCH '"verjahrung"'`, -1],
    [
      'fts_entscheide MATCH "beschwerde"',
      `SELECT count(*) FROM fts_entscheide_schaufenster WHERE fts_entscheide_schaufenster MATCH '"beschwerde"'`,
      -1,
    ],
  ];
  for (const [name, sql, soll] of nachChecks) {
    const ist = Number(await abfrage(url, token, sql));
    const ok = soll === -1 ? ist > 0 : ist === soll;
    if (!ok) nachRot = true;
    console.log(`  verify ${name}: remote=${ist}${soll >= 0 ? ` soll=${soll}` : ''} ${ok ? 'OK' : 'ROT'}`);
  }
  // Kopplungs-Nachweis über die rowid-Spannweite (billige Aggregate statt LEFT JOIN — der
  // Join über 55'822 Zeilen braucht auf der Replika Minuten). Beweist zusammen mit der
  // Zeilengleichheit oben, dass fts_artikel.rowid und artikel.rowid denselben Bereich decken.
  const spanneArtikel = await abfrage(url, token, "SELECT min(rowid) || '-' || max(rowid) FROM artikel");
  const spanneFts = await abfrage(url, token, "SELECT min(rowid) || '-' || max(rowid) FROM fts_artikel");
  // `null` heisst «nicht ermittelbar», nicht «gleich». Ohne diese Prüfung wären zwei
  // fehlgeschlagene Abfragen beide null, damit gleich — und der Vergleich meldete grün.
  // (Dieselbe Falle wurde im Wächter gehärtet; hier stand sie noch offen, Runde 3.)
  if (spanneArtikel === null || spanneFts === null) {
    nachRot = true;
    console.log(`  verify rowid-Spannweite: nicht ermittelbar (artikel=${spanneArtikel} fts_artikel=${spanneFts}) ROT`);
  } else if (spanneArtikel !== spanneFts) {
    nachRot = true;
    console.log(`  verify rowid-Spannweite: artikel=${spanneArtikel} fts_artikel=${spanneFts} ROT`);
  } else {
    console.log(`  verify rowid-Spannweite artikel == fts_artikel (${spanneArtikel}) OK`);
  }
  if (nachRot) {
    console.error('turso-sync ROT: Live-Nachkontrolle fehlgeschlagen — Frische-Marke wird NICHT gesetzt.');
    process.exit(1);
  }

  // 8) Frische-Marke schreiben (§8) — ERST JETZT, nach bestandener Nachkontrolle.
  //    Reihenfolge ist tragend: stünde die Marke vor Schritt 7, würde ein Sync, der die
  //    Nachkontrolle NICHT besteht, eine kaputte Replika mit selbst-bestätigenden Soll-Zahlen
  //    und korrektem manifest_sha hinterlassen — `check:turso-frische` wäre danach DAUERHAFT
  //    grün auf kaputten Daten (Gegenprüfung Runde 2, Befund 3). Die Marke ist eine Quittung
  //    über einen verifizierten Stand, keine Absichtserklärung.
  //    Die Zahlen kommen aus der Live-DB, nicht aus den Lade-Zählern: festgehalten wird, was
  //    TATSÄCHLICH liegt, damit der Wächter die Ist-Zahlen später dagegen prüfen kann.
  const manifestSha = createHash('sha256').update(readFileSync(MANIFEST_DATEI)).digest('hex');
  const istZahlen: Record<string, string> = {};
  for (const t of SCHATTEN) istZahlen[`zeilen_${t}`] = String(Number(await abfrage(url, token, `SELECT count(*) FROM ${t}`)));
  // `sig_<tabelle>` ist die Grundlage des Skip-Plans im NAECHSTEN Lauf. Sie wird erst hier
  // gesetzt — nach bestandener Nachkontrolle —, aus demselben Grund wie die Frische-Marke:
  // eine Signatur ueber einen unverifizierten Stand wuerde den naechsten Lauf dazu bringen,
  // eine kaputte Tabelle als «unveraendert» stehenzulassen.
  const marken: Array<[string, string]> = [
    ['manifest_sha', manifestSha],
    ['stand', new Date().toISOString()],
    ...Object.entries(istZahlen),
    ...[...lokaleSig].map(([t, sig]): [string, string] => [`sig_${t}`, sig.signatur]),
  ];
  // UPSERT statt «alles loeschen, alles neu schreiben»: das pauschale `DELETE FROM sync_meta`
  // kostete an jedem Tag ohne Korpus-Aenderung die doppelte Zeilenzahl, ohne etwas zu
  // beweisen. Der gezielte DELETE raeumt fremde Schluessel weiter weg (eingeschwungen: null
  // Zeilen) — die Garantie «keine Marken-Leiche» bleibt, nur ohne Aufschlag (§17).
  await pipeline(url, token, [
    { sql: 'CREATE TABLE IF NOT EXISTS sync_meta (schluessel TEXT PRIMARY KEY, wert TEXT NOT NULL)' },
    {
      sql: `DELETE FROM sync_meta WHERE schluessel NOT IN (${marken.map(() => '?').join(', ')})`,
      args: marken.map(([k]) => k),
    },
    {
      sql: `INSERT INTO sync_meta (schluessel, wert) VALUES ${marken.map(() => '(?, ?)').join(', ')}
            ON CONFLICT(schluessel) DO UPDATE SET wert = excluded.wert`,
      args: marken.flat(),
    },
  ]);
  console.log(`turso-sync grün: Hot-Replika vollständig + verifiziert (manifest_sha ${manifestSha.slice(0, 12)}…).`);
}

// SPERR-AUSGANG (§17/3). Bei aufgebrauchtem Monatskontingent scheitert JEDES Schreib-
// Statement als stmt-Fehler INNERHALB einer HTTP-200-Antwort; ohne eigene Erkennung suchte
// der Betreiber im Korpus nach einer Ursache, die im Abrechnungsmodell liegt. Exit 3
// (Datenfehler bleiben 1); der Stand wird noch GELESEN — Lesen ist nicht gesperrt.
main().catch(async (e) => {
  const m = e instanceof Error ? e.message : String(e);
  if (istSchreibsperre(m) && zugang) {
    const stand = await abfrage(zugang.url, zugang.token, "SELECT wert FROM sync_meta WHERE schluessel = 'stand'").catch(
      () => null,
    );
    console.error(sperrMeldung(stand));
    process.exit(EXIT_SPERRE);
  }
  console.error('turso-sync ROT:', m);
  process.exit(1);
});
