// scripts/datenhaltung/turso-fts-index.ts
// Liest den FERTIGEN lokalen FTS5-Index als Shadow-Tabellen aus, damit `turso-sync` ihn
// überträgt, statt ihn auf der Gegenseite ein zweites Mal bauen zu lassen (QS-CODE-TURSO).
//
// WARUM ÜBERHAUPT (gemessen 4.8.2026, Wurzel des 22-Minuten-Engpasses). Der Sync schickte
// bisher die ZEILEN in eine remote FTS5-Tabelle. Damit tokenisiert und indexiert die
// Gegenseite denselben Text noch einmal, den `fts.ts` lokal längst indexiert hat — und
// bezahlt zusätzlich den LSM-Preis von FTS5: jede Transaktion legt ein neues Segment an,
// `automerge` schreibt die Segmente danach wieder und wieder um. Nullprobe über dieselbe
// Nutzlast (200 Zeilen / 7,07 MiB, je n=3, Median):
//   Zeilen → standalone FTS5 (heutiger Pfad) .... 19,9 s →  364 KiB/s
//   Zeilen → GEWÖHNLICHE Tabelle (Nullprobe) ....  7,8 s →  946 KiB/s
// Der Aufschlag ist also nicht der Transport, sondern der Schreibpfad von FTS5 — und er
// wächst mit dem Index: dieselbe Messung ergab 437 KiB/s bei 500 Zeilen, aber nur 120 KiB/s
// über den vollen Korpus (CI-Lauf 29757068566). Genau diese Superlinearität ist der Grund,
// warum das Budget mit dem Korpus reisst und nicht bloss langsam wird.
//
// PAARMESSUNG über den VOLLEN Korpus (5093 Entscheide, gleiche Maschine und Leitung,
// unmittelbar nacheinander, in Wegwerf-Tabellen `qsct_mess_*`):
//   alter Pfad (Zeilen → FTS5) ..... 872,7 s / 165,4 MiB / 59 Requests   (n=1)
//   neuer Pfad (Index-Transfer) .... 388,1 · 428,5 s / 254,3 MiB / 92 Req (n=2, Median 408 s)
// Faktor ~2,1x — trotz 1,54x der Bytes, also ~3,3x je Byte. Und entscheidend für §6:
// Trefferzahlen (beschwerde 4704 · verjahrung 250 · kundigung 322 · bundesgericht 4673),
// bm25-Rangfolge und Snippets waren zwischen beiden Pfaden BYTE-IDENTISCH.
//
// DIE WURZEL: der Index EXISTIERT bereits. `fts.ts` baut ihn beim `datenhaltung:build`
// deterministisch in `daten/*.db`. Ihn auf der Gegenseite neu abzuleiten ist Doppelarbeit im
// Sinn von §5 — die Replika ist eine Projektion des lokalen Artefakts, keine zweite Quelle.
// Übertragen werden darum die Shadow-Tabellen (`_data`, `_idx`, `_docsize`, `_config` und bei
// standalone zusätzlich `_content`). Das sind GEWÖHNLICHE SQLite-Tabellen; sie laufen mit
// Plain-Tabellen-Durchsatz und die Gegenseite tokenisiert nichts mehr.
//
// PREIS, ehrlich benannt: es gehen MEHR Bytes über den Draht (der Index kommt zur Nutzlast
// hinzu, Blobs zudem base64-kodiert, +33 %). Für die Entscheide sind das ~251 statt ~165 MiB.
// Der Tausch lohnt, weil die zusätzlichen Bytes mit Plain-Durchsatz laufen und die
// superlineare Indexarbeit ganz entfällt — Messwerte im Kopf von `turso-sync.ts`.
//
// FORMAT-TREUE ist kein Vertrauensakt (§7): der Sync prüft die geladene Tabelle vor dem
// Tausch mit dem FTS5-eigenen `integrity-check`, der den Index gegen den Inhalt rechnet.
// Was hier falsch ankäme, ginge nie live.
import type { DatabaseSync } from 'node:sqlite';
import type { Wert } from './turso-transport';

/** Eine zu übertragende Shadow-Tabelle: Namens-Suffix, Spalten, fertige Wert-Tupel. */
export interface SchattenLadung {
  suffix: string;
  spalten: string[];
  werte: Wert[][];
}

/** Shadow-Tabellen einer FTS5-Tabelle in LADE-Reihenfolge.
 *  `_content` fehlt bei contentless-Tabellen (`content=''`) — dort trägt der Index keinen
 *  Text, und die Tabelle wird von SQLite gar nicht erst angelegt. */
const SCHATTEN_SPALTEN: Array<{
  suffix: string;
  spalten: string[];
  nurStandalone?: true;
  /** Spalten, die in der Quelle ZERO-LENGTH-BLOBs tragen können (empirische Inventur
   *  4./5.8.2026: nur der erste `term` je Segment in `_idx`; `block`/`sz` nie leer).
   *  Für sie läuft `typeof()` mit, und ein vom Treiber genulltes Feld wird als
   *  `Uint8Array(0)` restauriert — DEFENSIV: ein Lese-null wurde auf Node
   *  22.23.1/22.23.2/24.16 NICHT beobachtet (Gegenprüfung, Probe 9; die tatsächliche
   *  Node-22-Wurzel des CI-Rots vom 4.8.2026 sass auf der BIND-Seite der
   *  Test-Rekonstruktion, s. turso-fts-index.test.ts). Die Schicht bleibt, weil sie
   *  nachweislich treu ist (feuert nur bei SQLite-typeof 'blob') und eine etwaige
   *  Lese-Variante anderer Runtimes lautlos-korrekt decken würde. */
  blobSpalten?: string[];
}> = [
  { suffix: '_config', spalten: ['k', 'v'] },
  { suffix: '_data', spalten: ['id', 'block'], blobSpalten: ['block'] },
  { suffix: '_idx', spalten: ['segid', 'term', 'pgno'], blobSpalten: ['term'] },
  { suffix: '_docsize', spalten: ['id', 'sz'] },
  { suffix: '_content', spalten: ['id', 'c0', 'c1', 'c2', 'c3', 'c4'], nurStandalone: true },
];

/** Shadow-Definitionen einer FTS5-Tabelle (Suffix + Spalten), ohne Daten — das Delta liest
 *  dieselben Tabellen aus der REMOTE-Replika und braucht dazu dieselbe Liste (§5). */
export function schattenDefinitionen(
  mitContent: boolean,
): Array<{ suffix: string; spalten: string[]; blobSpalten?: string[] }> {
  return SCHATTEN_SPALTEN.filter((d) => mitContent || !d.nurStandalone).map(({ suffix, spalten, blobSpalten }) => ({
    suffix,
    spalten,
    blobSpalten,
  }));
}

/**
 * Liest die Shadow-Tabellen des lokal gebauten FTS5-Index.
 *
 * @param lokal      Quell-DB (daten/normtext.db bzw. daten/rechtsprechung.db)
 * @param tabelle    Name der lokalen FTS5-Tabelle
 * @param mitContent `true` für standalone (Text physisch gespeichert, `_content` wandert mit),
 *                   `false`, wenn die ZIEL-Tabelle contentless ist.
 *
 * `mitContent` beschreibt bewusst das ZIEL, nicht die Quelle. `fts_artikel` liegt lokal als
 * external-content-Tabelle über `artikel` und remote als contentless — beide tragen denselben
 * Index. Empirisch geprüft (4.8.2026): über denselben Text und dieselben rowids sind `_data`,
 * `_idx`, `_docsize` und `_config` beider Bauarten BYTE-GLEICH; sie unterscheiden sich nur
 * darin, ob eine `_content`-Tabelle daneben liegt. `turso-fts-index.test.ts` hält das fest.
 */
export function* leseFtsSchatten(
  lokal: DatabaseSync,
  tabelle: string,
  mitContent: boolean,
): Generator<SchattenLadung> {
  // GENERATOR, nicht Array: `_content` trägt bei den Entscheiden ~157 MiB Text und `_data`
  // ~64 MiB Blobs. Würden alle Ladungen zugleich aufgebaut, lägen sie auch alle zugleich im
  // Heap. So ist immer nur EINE Shadow-Tabelle materialisiert — dieselbe Grössenordnung, die
  // der Sync schon vorher hielt.
  for (const { suffix, spalten, nurStandalone, blobSpalten } of SCHATTEN_SPALTEN) {
    if (nurStandalone && !mitContent) continue;
    // `ORDER BY rowid` scheidet bei WITHOUT ROWID (`_idx`, `_config`) aus; die Reihenfolge
    // ist für die Ziel-Tabelle ohnehin unerheblich (gewöhnliche Tabellen mit eigenem
    // PRIMARY KEY). Sortiert wird trotzdem — nach dem Schlüssel —, damit der Lauf
    // deterministisch ist und zwei Sync-Läufe dieselben Requests erzeugen (§2).
    const ordnung = spalten[0] === 'segid' ? 'segid, term' : spalten[0];
    // Für Leer-BLOB-Kandidaten läuft `typeof()` mit: nur wenn SQLite selbst 'blob' sagt,
    // wird ein vom Treiber genulltes Feld als Uint8Array(0) restauriert — ein ECHTES
    // SQL-NULL bliebe NULL und schlüge remote weiter laut fehl (kein stilles Glätten).
    const typSpalten = (blobSpalten ?? [])
      .map((s) => `, typeof(${s}) AS __typ_${s}`)
      .join('');
    const rows = lokal
      .prepare(`SELECT ${spalten.join(', ')}${typSpalten} FROM ${tabelle}${suffix} ORDER BY ${ordnung}`)
      .all() as Array<Record<string, Wert>>;
    yield {
      suffix,
      spalten,
      werte: rows.map((r) =>
        spalten.map((s) => {
          const wert = r[s] ?? null;
          if (wert === null && blobSpalten?.includes(s) && r[`__typ_${s}`] === 'blob') {
            return new Uint8Array(0);
          }
          return wert;
        }),
      ),
    };
  }
}

/** Dokumentzahl des lokalen Index — `_docsize` trägt genau eine Zeile je indexiertem
 *  Dokument und ist damit die Soll-Zahl, gegen die der Sync die geladene Tabelle prüft.
 *
 *  Fehlt der Index ganz, ist die nackte SQLite-Meldung («no such table:
 *  fts_artikel_docsize») zwar korrekt, aber sie nennt die Abhilfe nicht — und sie fiele
 *  ausgerechnet dem in die Hände, der die DB von Hand zusammengesucht hat. Darum übersetzt. */
export function ftsDokumente(lokal: DatabaseSync, tabelle: string): number {
  try {
    return (lokal.prepare(`SELECT count(*) AS n FROM ${tabelle}_docsize`).get() as { n: number }).n;
  } catch {
    throw new Error(
      `FTS-Index «${tabelle}» fehlt in der lokalen DB. Der Sync überträgt den fertigen Index; ` +
        'er entsteht in `npm run datenhaltung:build` (fts.ts). Erst bauen, dann synchronisieren.',
    );
  }
}
