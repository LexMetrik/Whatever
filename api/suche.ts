// api/suche.ts — QS-DATA E2 Edge-Suche über die HOT-FTS (read-only).
//
// AKTIVIERUNG = David-Handschritt: Turso provisionieren + 2 Env-Vars in Vercel setzen
// (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN). Detail: FAHRPLAN-DATENHALTUNG §5 E2 + §10.3.
// Solange die Vars FEHLEN, liefert die Funktion einen ehrlichen 503 (§8) — der statische
// Client-Suchindex (src/lib/suche) bleibt der Fallback, es wird nichts vorgetäuscht.
//
// Read-only + dependency-frei: KEIN @libsql/client, sondern der Turso-HTTP-Endpunkt
// (/v2/pipeline) über das globale fetch. KEIN Import aus src/ (Client bleibt unberührt);
// KEIN Cross-DB-Zugriff (die check:datenhaltung-Invariante über api/** bleibt grün). Die
// Query-Logik (Match-Bau, Pagination by design, SQL, Zeilen-Formung) ist mit dem Build-Zeit-
// Modul GETEILT (§5) — sie lebt IMPORT-FREI in scripts/datenhaltung/suche-kern.ts (Unit-Tests
// laufen via suche.ts dagegen). Vercel-Fix 3.7.2026: NUR das Kern-Modul importieren — Vercel
// kompiliert api/** mit eigener nodenext-tsconfig ohne Node-Typen; eine node:sqlite-Import-
// Kette (suche.ts → fts.ts) bricht den Function-Build. `.js`-Spezifizierer, weil nodenext
// explizite Endungen verlangt und sie auf die .ts-Quelle mappt.
import {
  baueFtsMatch,
  baueFtsSpaltenMatch,
  FTS_SPALTEN_HAUPT,
  FTS_SPALTEN_NEBEN,
  klemmeFenster,
  naechsterOffset,
  formeArtikelTreffer,
  formeEntscheidTreffer,
  SQL_ARTIKEL_COUNT,
  SQL_ARTIKEL_TREFFER,
  SQL_ENTSCHEIDE_COUNT,
  SQL_ENTSCHEIDE_TREFFER,
  type ArtikelRohzeile,
  type EntscheidRohzeile,
  type ArtikelTreffer,
  type EntscheidTreffer,
  type SucheAntwort,
} from '../scripts/datenhaltung/suche-kern.js';

export const config = { runtime: 'edge' };

// Edge-Runtime stellt process.env bereit; lokale Deklaration statt @types/node, damit
// Vercels Function-Compile (ohne Node-Typen) sauber bleibt (TS2591-Fix 3.7.2026).
declare const process: { env: Record<string, string | undefined> };

type Wert = string | number | null;
type Zeilen = Array<Record<string, string | null>>;

/** Eine Anweisung der Pipeline. `optional`: ein Fehler dieser Anweisung ist KEIN
 *  Suchfehler (z. B. die Stand-Marke) — ihr Ergebnis ist dann `null`. */
interface Anfrage {
  sql: string;
  args: Wert[];
  optional?: boolean;
}

/** Minimaler Turso-HTTP-Client (Hrana /v2/pipeline) — dependency-frei über fetch.
 *
 *  EHRLICHKEIT (§8, E0-BRANDSCHUTZ 7.10.2026): Turso meldet einen SQL-Fehler einer
 *  EINZELNEN Anweisung als `{type:'error'}` INNERHALB einer HTTP-200-Antwort. Früher
 *  wurde so ein Ergebnis zu «0 Zeilen» — die Suche behauptete «0 Treffer», obwohl sie
 *  gar nicht gelaufen war. Jetzt wirft jede Pflicht-Anweisung ohne Ergebnis; nur eine
 *  als `optional` markierte liefert `null`. */
async function tursoAbfrage(basisUrl: string, token: string, anfragen: Anfrage[]): Promise<Array<Zeilen | null>> {
  const httpUrl = basisUrl.replace(/^libsql:\/\//, 'https://').replace(/\/$/, '');
  const body = {
    requests: [
      ...anfragen.map((a) => ({
        type: 'execute' as const,
        stmt: {
          sql: a.sql,
          args: a.args.map((v) =>
            v === null
              ? { type: 'null' as const, value: null }
              : typeof v === 'number'
                ? { type: 'integer' as const, value: String(v) }
                : { type: 'text' as const, value: v },
          ),
        },
      })),
      { type: 'close' as const },
    ],
  };
  const res = await fetch(`${httpUrl}/v2/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Turso HTTP ${res.status}`);
  const daten = (await res.json()) as {
    results?: Array<{
      type: string;
      response?: { result?: { cols: Array<{ name: string }>; rows: Array<Array<{ value: string | null }>> } };
      error?: { message?: string };
    }>;
  };
  if (!Array.isArray(daten.results)) throw new Error('Turso-Antwort ohne results');
  return anfragen.map((a, i) => {
    const r = daten.results?.[i];
    const result = r?.type === 'ok' ? r.response?.result : undefined;
    if (!result) {
      if (a.optional) return null;
      throw new Error(`Turso-Anweisung ${i} ohne Ergebnis (${r?.type ?? 'fehlt'}): ${r?.error?.message ?? ''}`);
    }
    const namen = result.cols.map((c) => c.name);
    return result.rows.map((zeile) => {
      const obj: Record<string, string | null> = {};
      namen.forEach((n, j) => (obj[n] = zeile[j]?.value ?? null));
      return obj;
    });
  });
}

/** Stand der Replika: `sync_meta.stand` = ISO-Zeitstempel des letzten erfolgreichen
 *  Sync-Laufs (geschrieben von scripts/datenhaltung/turso-sync.ts). Läuft in der
 *  SELBEN Pipeline-Anfrage wie die Suche — keine Zusatzlatenz. OPTIONAL: fehlt die
 *  Tabelle/Marke oder ist sie kein Datum, fehlt der Stand in der Antwort (§8: nichts
 *  erfunden), die Suche selbst scheitert deshalb nie. */
const STAND_ANFRAGE: Anfrage = {
  sql: "SELECT wert FROM sync_meta WHERE schluessel = 'stand'",
  args: [],
  optional: true,
};

function leseStand(zeilen: Zeilen | null | undefined): string | null {
  const wert = zeilen?.[0]?.wert;
  if (!wert) return null;
  const ms = Date.parse(wert);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

interface Teilergebnis<T> {
  antwort: SucheAntwort<T>;
  /** Nur gesetzt, wenn diese Pipeline-Anfrage den Stand mitgelesen hat. */
  stand: string | null;
}

/** Zeilen einer Pflicht-Anweisung (tursoAbfrage wirft bei Fehler; `null` kann hier
 *  nur durch einen Programmierfehler auftreten — dann ebenfalls Fehler statt «leer»). */
function pflicht(zeilen: Zeilen | null | undefined): Zeilen {
  if (!zeilen) throw new Error('Pflicht-Anweisung ohne Zeilen');
  return zeilen;
}

async function sucheArtikelEdge(
  url: string,
  token: string,
  query: string,
  match: string,
  limit: number,
  offset: number,
  mitStand: boolean,
): Promise<Teilergebnis<ArtikelTreffer>> {
  // Topische Stufung (QS-BASIS (d) K2): zwei zusätzliche, spalten-eingeschränkte
  // MATCH-Ausdrücke über dieselben Terme. Sie ordnen den Artikel, der dem Thema
  // GEWIDMET ist, vor den blossen Texttreffer. bm25 allein legte OR 253 bei «Miete»
  // auf Rang 128 von 165 — ausserhalb jedes Fensters, das die Antwort je zurückgibt.
  const haupt = baueFtsSpaltenMatch(query, FTS_SPALTEN_HAUPT) ?? match;
  const neben = baueFtsSpaltenMatch(query, FTS_SPALTEN_NEBEN) ?? match;
  const [countRows, treffRows, standRows] = await tursoAbfrage(url, token, [
    { sql: SQL_ARTIKEL_COUNT, args: [match] },
    { sql: SQL_ARTIKEL_TREFFER, args: [match, haupt, neben, limit, offset] },
    ...(mitStand ? [STAND_ANFRAGE] : []),
  ]);
  const gesamt = Number(pflicht(countRows)[0]?.n ?? 0);
  // Snippet-Bau braucht den ORIGINAL-Query (nicht den FTS-Match) — explizit durchgereicht.
  const treffer = (pflicht(treffRows) as unknown as ArtikelRohzeile[]).map((r) => formeArtikelTreffer(r, query));
  return {
    antwort: { treffer, gesamt, naechsteSeite: naechsterOffset(gesamt, offset, limit) },
    stand: leseStand(standRows),
  };
}

async function sucheEntscheideEdge(
  url: string,
  token: string,
  match: string,
  limit: number,
  offset: number,
  mitStand: boolean,
): Promise<Teilergebnis<EntscheidTreffer>> {
  const [countRows, treffRows, standRows] = await tursoAbfrage(url, token, [
    { sql: SQL_ENTSCHEIDE_COUNT, args: [match] },
    { sql: SQL_ENTSCHEIDE_TREFFER, args: [match, limit, offset] },
    ...(mitStand ? [STAND_ANFRAGE] : []),
  ]);
  const gesamt = Number(pflicht(countRows)[0]?.n ?? 0);
  const treffer = (pflicht(treffRows) as unknown as EntscheidRohzeile[]).map(formeEntscheidTreffer);
  return {
    antwort: { treffer, gesamt, naechsteSeite: naechsterOffset(gesamt, offset, limit) },
    stand: leseStand(standRows),
  };
}

const LEER: SucheAntwort<never> = { treffer: [], gesamt: 0, naechsteSeite: null };

/** Fehlertext für das Server-Log: Token geschwärzt, Steuerzeichen (CR/LF …) zu Leerzeichen,
 *  Länge gedeckelt. */
function fuerLog(e: unknown, token: string): string {
  const roh = e instanceof Error ? e.message : String(e);
  const ohneToken = token ? roh.split(token).join('[token]') : roh;
  // eslint-disable-next-line no-control-regex
  return ohneToken.replace(/[\u0000-\u001f\u007f]+/g, ' ').slice(0, 500);
}

export default async function handler(req: Request): Promise<Response> {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  // §8: ohne provisioniertes Turso NICHT vortäuschen — ehrlicher 503, Client-Index bleibt Fallback.
  if (!url || !token) {
    return new Response(JSON.stringify({ fehler: 'Suche über die Masse noch nicht aktiviert' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  const params = new URL(req.url).searchParams;
  const q = params.get('q') ?? '';
  const typ = params.get('typ') ?? 'alle'; // 'artikel' | 'entscheide' | 'alle'
  const { limit, offset } = klemmeFenster({
    limit: params.has('limit') ? Number(params.get('limit')) : undefined,
    offset: params.has('offset') ? Number(params.get('offset')) : undefined,
  });
  const match = baueFtsMatch(q);

  const antwort: {
    artikel?: SucheAntwort<ArtikelTreffer>;
    entscheide?: SucheAntwort<EntscheidTreffer>;
    /** ISO-Zeitstempel des letzten erfolgreichen Sync-Laufs der Replika (§8) — nur gesetzt,
     *  wenn die Marke gelesen wurde und ein Datum ist; sonst fehlt der Schlüssel. */
    stand?: string;
  } = {};
  try {
    if (!match) {
      if (typ !== 'entscheide') antwort.artikel = LEER;
      if (typ !== 'artikel') antwort.entscheide = LEER;
    } else {
      // Der Stand reist in der ERSTEN Pipeline-Anfrage mit (keine Zusatzlatenz).
      let standOffen = true;
      if (typ !== 'entscheide') {
        const t = await sucheArtikelEdge(url, token, q, match, limit, offset, standOffen);
        antwort.artikel = t.antwort;
        if (t.stand) antwort.stand = t.stand;
        standOffen = false;
      }
      if (typ !== 'artikel') {
        const t = await sucheEntscheideEdge(url, token, match, limit, offset, standOffen);
        antwort.entscheide = t.antwort;
        if (t.stand) antwort.stand = t.stand;
      }
    }
  } catch (e) {
    // KEINE Fehlerdetails an anonyme Aufrufer (HN-11, SA-05): Turso-Meldungen können SQL,
    // Hostnamen und — bei einem Token mit Steuerzeichen — den Token selbst enthalten.
    // Die einzige Diagnosespur bleibt das serverseitige Log; dort wird der Token
    // geschwärzt und Zeilenumbrüche werden geglättet (kein Log-Injection).
    console.error(`api/suche: Abfrage fehlgeschlagen — ${fuerLog(e, token)}`);
    return new Response(JSON.stringify({ fehler: 'Suche vorübergehend nicht verfügbar', code: 'suche-nicht-verfuegbar' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  return new Response(JSON.stringify(antwort), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
