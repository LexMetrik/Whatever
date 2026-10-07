// scripts/datenhaltung/turso-transport.ts
// Schranken + Nutzlast-Schätzung des Turso-Mehrzeilen-Transports (aus turso-sync.ts
// herausgelöst 20.7.2026).
//
// WARUM EIN EIGENES MODUL: `turso-sync.ts` ist ein ausführbares Skript — es startet beim
// Import sofort den echten Prod-Sync. Ein Unit-Test, der die Schätzfunktion prüfen will,
// darf es darum nicht importieren. Der erste Versuch, das über eine `process.argv[1]`-Weiche
// zu lösen, ging nach hinten los: unter `vite-node` ist `argv[1]` der vite-node-Binary und
// nicht das Skript — die Weiche war immer falsch und der Sync wurde zum stillen No-op
// (Exit 0, keine Ausgabe). Genau die Sorte lautloses Versagen, gegen die dieser PR antritt.
// Reine Rechenlogik gehört deshalb in ein importierbares Modul ohne Seiteneffekte.
/** `Uint8Array` seit QS-CODE-TURSO: der Sync überträgt die FTS5-Shadow-Tabellen, und deren
 *  `block`/`term`/`sz`-Spalten sind BLOBs (Hrana kodiert sie base64). */
export type Wert = string | number | null | Uint8Array;

/** Ein Hrana-Statement (SQL + positionelle Argumente) — die eine Form, die Sync und Delta
 *  gemeinsam nutzen. */
export interface Stmt {
  sql: string;
  args?: Wert[];
}

/** SQLite-Bind-Parameter je Statement. Hartes Limit ist SQLITE_MAX_VARIABLE_NUMBER (32766);
 *  8000 lässt Faktor 4 Luft und deckt jede Spaltenzahl unserer Tabellen ab. */
export const MAX_PARAM_JE_STMT = 8000;
/** Nutzlast je Statement. Grosse Entscheid-Volltexte sprengen sonst einzelne Statements. */
export const MAX_BYTES_JE_STMT = 512 * 1024;
/** Nutzlast je HTTP-Request. Gemessen: 2,5 MiB laufen glatt, 7 MiB werden spürbar zäher.
 *  Gegen den realen Korpus nachgerechnet (20.7.2026, Schranken-Rechnung inkl. SQL-Gerüst):
 *  grösster real gesendeter Request 2,871 MiB (artikel) · 2,962 (fts_artikel) ·
 *  2,976 (entscheide) — KEIN Request überschreitet seine Schranke.
 *
 *  Bei den STATEMENTS gibt es genau eine dokumentierte Ausnahme: eine Einzelzeile, die für
 *  sich schon grösser als MAX_BYTES_JE_STMT ist, geht über die Notluke in `ladeWerte()`
 *  trotzdem raus — sonst käme sie nie durch. Real betrifft das eine Zeile im Korpus
 *  (BS-Entscheid SB.2018.46, 783'689 Zeichen → 0,76 MiB gegen 512 KiB). Gewollt, weil eine
 *  übersprungene Zeile stiller Datenverlust wäre. Die Request-Schranke bleibt trotzdem
 *  eingehalten — aber NICHT, weil die Zeile allein führe (real fährt sie mit weiteren
 *  Statements in einem 2,57-MiB-Request): sondern weil `ladeWerte()` den laufenden Request
 *  ABSENDET, bevor ein nicht mehr passendes Statement angehängt wird, und danach für jedes
 *  weitere Statement erneut prüft. (Die frühere Begründung war unbelegt — Runde 5, L1.)
 *
 *  GRENZE, ehrlich benannt: auf Statement-Ebene gibt es die Notluke, auf REQUEST-Ebene nicht.
 *  Eine künftige Einzelzeile über MAX_BYTES_JE_REQUEST würde die Request-Schranke reissen.
 *  Heute unerreichbar (grösste Zeile 0,76 MiB gegen 3 MiB), aber die Aussage gilt für den
 *  Korpus-Stand 20.7.2026, nicht unbegrenzt. */
export const MAX_BYTES_JE_REQUEST = 3 * 1024 * 1024;

/** JSON-Gerüst EINES Hrana-Arguments ohne den Wert selbst.
 *  `{"type":"text","value":` = 23 B · `}` + `,` = 2 B → 25 B;
 *  `{"type":"null","value":null},` = 29 B;
 *  `{"type":"integer","value":"` = 27 B + `"}` + `,` = 3 B → 30 B;
 *  `{"type":"blob","base64":"` = 25 B + `"}` + `,` = 3 B → 28 B (Base64-Nutzlast zählt
 *  `zeilenBytes()` über ceil(n/3)*4 exakt mit). 32 deckt alle vier. */
const ARG_OVERHEAD = 32;
/** JSON-Gerüst EINES `execute`-Schritts: `{"type":"execute","stmt":{"sql":"","args":[]}},`
 *  real ausgezählt 47 B. 64 lässt Reserve für Feld-Reihenfolge-Varianten. */
export const STMT_OVERHEAD = 64;
/** Zusatz je Wert-Tupel im Mehrzeilen-`VALUES`: Trenn-Komma und Leerzeichen (real 2 B). */
export const TUPEL_TRENNER = 2;
/** Rahmen EINES Requests, den die Statement-Summe nicht enthält: `{"requests":[…]}` plus die
 *  Schritte `BEGIN`, `COMMIT` und `close` — real ~136 B. 256 gibt Reserve. */
export const REQUEST_OVERHEAD = 256;

/**
 * Nutzlast einer Zeile in der Hrana-JSON-Kodierung — EXAKT gerechnet, nicht geschätzt.
 *
 * Zwei Irrwege liegen hinter dieser Funktion, beide von der Gegenprüfung aufgedeckt:
 *
 * 1. Erst zählte sie `v.length + 8`: UTF-16-Code-Units, ohne Argument-Overhead, ohne
 *    Escaping. Ein «4 MiB»-Request wurde real 6,03 MiB (Faktor 1,34).
 * 2. Dann UTF-8-Bytes × einem pauschalen Escape-Faktor 1,25. Das ist eine STATISTISCHE
 *    Annahme, keine Schranke — sie kippt, sobald über 25 % der Zeichen escape-pflichtig
 *    sind. Gemessen: Zeilen mit vielen `"`/`\`/`\n` erreichen Faktor 1,60, Steuerzeichen
 *    (U+0001 → ``) sogar 4,79. Im realen Korpus liegt die höchste Escape-Dichte einer
 *    `bloecke_json`-Zeile bei 44,88 % — solche Zeilen wurden um Faktor 1,16 UNTERSCHÄTZT.
 *    Dass die Request-Summen trotzdem passten, war Mittelung über den Batch, also Glück.
 *
 * Jetzt wird der Wert so kodiert, wie er tatsächlich im Body landet (`JSON.stringify`
 * liefert die gequotete, escapte Form) und in UTF-8-Bytes gemessen — für Strings UND für
 * Zahlen. Die Zahlen fehlten zunächst: sie wurden pauschal mit 32 B veranschlagt, während
 * `{"type":"integer","value":"55822"},` real 34 B braucht. Ausgerechnet die `rowid`-Spalte
 * liegt in diesem Bereich, wurde also bei jeder Zeile unterschätzt (Gegenprüfung Runde 3).
 *
 * Das Ergebnis ist eine strukturelle OBERgrenze für jeden Eingabewert — unabhängig von
 * Zeichenverteilung, Steuerzeichen, Surrogatpaaren oder Zahlenlänge.
 * `turso-transport.test.ts` hält das an genau den Fällen fest, die die Vorfassungen gekippt
 * haben. ACHTUNG: die Funktion deckt nur die ARGUMENTE ab — das SQL-Gerüst (Statement-Kopf,
 * Wert-Tupel, `execute`-Rahmen) rechnet `ladeWerte()` zusätzlich dazu.
 */
export function zeilenBytes(werte: Wert[]): number {
  let n = 0;
  for (const v of werte) {
    if (typeof v === 'string') n += Buffer.byteLength(JSON.stringify(v), 'utf8') + ARG_OVERHEAD;
    else if (typeof v === 'number') n += Buffer.byteLength(String(v), 'utf8') + ARG_OVERHEAD;
    // BLOB: Hrana kodiert base64, das sind exakt ceil(n/3)*4 ASCII-Bytes — keine Schätzung,
    // sondern die geschlossene Formel. Escaping entfällt (base64 ist JSON-sicher).
    else if (v instanceof Uint8Array) n += Math.ceil(v.length / 3) * 4 + ARG_OVERHEAD;
    else n += ARG_OVERHEAD;
  }
  return n;
}
