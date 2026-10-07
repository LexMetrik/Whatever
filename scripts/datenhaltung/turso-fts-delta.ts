// scripts/datenhaltung/turso-fts-delta.ts
// FTS5-Delta fuer die contentless-Tabelle `fts_artikel` (E0-BRANDSCHUTZ, 7.10.2026).
//
// PROBLEM. Bis hierher wanderte bei jeder Aenderung der FERTIGE lokale Index komplett ueber
// den Draht (`turso-fts-index.ts`) — Schatten-Tabellen `_data`/`_idx`/`_docsize`/`_config`,
// ~70 000 Zeilen, auch wenn sich drei Artikel geaendert hatten. Ein Delta auf Block-Ebene
// scheidet aus: FTS5 packt den Index in Seiten, eine Aenderung verschiebt die Seitengrenzen
// ab der Stelle fast aller Folge-Seiten.
//
// DER KNIFF, UND WARUM ER NOETIG IST. Eine contentless-Tabelle speichert keinen Text. Ein
// Loeschen (`INSERT INTO t(t, rowid, …) VALUES('delete', …)`) verlangt aber die ALTEN
// Feldwerte, damit FTS5 dieselben Terme austraegt. Auf der Gegenseite liegen sie nicht (die
// Erinnerung des Index sind nur Terme + Positionen); lokal auch nicht — der lokale Index ist
// ebenfalls contentless, und die Recall-Felder (marginalie/gliederung/…) stammen aus
// Struktur-Sidecars, die auf der Replika fehlen. Also werden sie aus dem Index selbst
// rekonstruiert: `fts5vocab(…, 'instance')` liefert zu jedem Dokument alle (Term, Spalte,
// Position). Aus den Termen einer Spalte in Positionsreihenfolge, durch Leerzeichen getrennt,
// laesst sich ein Ersatztext bilden, der beim Tokenisieren EXAKT dieselben Terme an
// denselben Positionen ergibt (Terme sind bereits gefaltet; Falten ist idempotent). Fuer das
// Austragen reicht das — der Index kennt den Originaltext nie.
//
// ABLAUF (alles lokal, in einer In-Memory-DB; die Gegenseite wird nur GELESEN):
//   1. Remote-Schatten-Tabellen lesen (Lesen ist im Gratisplan reichlich, s. turso-delta.ts)
//      und in eine FTS5-Tabelle `alt` einspielen — eine exakte Kopie des Remote-Index.
//   2. Den neuen lokalen Index als `neu` daneben einspielen.
//   3. Geaenderte Dokumente = Mengendifferenz der Instanzen (Term, Dokument, Spalte, Position)
//      in beide Richtungen, plus Differenz der Dokument-Laengen (`_docsize`). Exakt, nicht
//      per Hash: kein Kollisionsrisiko.
//   4. Auf `alt` die echten FTS5-Operationen: je geaendertem/entferntem Dokument `'delete'`
//      mit dem Ersatztext des ALTEN Zustands, je geaendertem/neuem Dokument ein normaler
//      INSERT mit dem Ersatztext des NEUEN Zustands.
//   5. SELBSTPRUEFUNG, bevor irgendetwas hochgeladen wird: Instanzen und `_docsize` von `alt`
//      muessen jetzt exakt denen von `neu` entsprechen (beide Richtungen), die
//      Durchschnitts-Zeile (`_data` id 1) gleich sein, und `integrity-check` bestehen. Stimmt
//      etwas nicht, wirft die Funktion — der Aufrufer faellt auf den Vollneubau zurueck.
//   6. Hochgeladen wird die DIFFERENZ der Schatten-Tabellen von `alt` vor/nach den
//      Operationen: neue Segment-Seiten, geaenderte Struktur-/Durchschnitts-Zeile, geaenderte
//      `_docsize`-Zeilen. Das sind Zeilen, wie FTS5 selbst sie schreibt — dieselbe
//      Transport-Mechanik wie bisher (INSERT in Shadow-Tabellen), nur fuer weniger Zeilen.
//
// WAS DER REMOTE-INDEX DANACH IST. Semantisch gleich dem Vollneubau (gleiche Terme, Positionen,
// Dokumentlaengen → gleiche Treffer, gleiche bm25-Werte), NICHT byte-gleich: die Segment-
// Struktur unterscheidet sich (ein zusaetzliches kleines Segment, das FTS5 spaeter selbst
// zusammenfuehrt). Der Vollneubau bleibt der Rueckfall und stellt Byte-Gleichheit her.
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import type { Wert } from './turso-transport';
import { schreibeWert } from './turso-skip';
import { leseFtsSchatten, schattenDefinitionen, type SchattenLadung } from './turso-fts-index';

export type Schatten = SchattenLadung[];

/** Zahl der fuehrenden Schluesselspalten je Shadow-Tabelle (Rest = Wertspalten). */
const SCHLUESSEL_ANZAHL: Record<string, number> = { _config: 1, _data: 1, _idx: 2, _docsize: 1, _content: 1 };

function schluesselText(v: Wert): string {
  if (v === null) return 'n';
  if (typeof v === 'number') return `i${v}`;
  if (v instanceof Uint8Array) return `b${Buffer.from(v).toString('hex')}`;
  return `t${v}`;
}

function werteGleich(a: Wert[], b: Wert[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x instanceof Uint8Array && y instanceof Uint8Array) {
      if (Buffer.compare(x, y) !== 0) return false;
    } else if (x !== y) return false;
  }
  return true;
}

/** Zeilen einer Ladung nach Schluessel (Text) → Wert-Tupel. */
function nachSchluessel(l: SchattenLadung): Map<string, Wert[]> {
  const n = SCHLUESSEL_ANZAHL[l.suffix] ?? 1;
  return new Map(l.werte.map((w) => [w.slice(0, n).map(schluesselText).join('|'), w]));
}

/** Fingerabdruck ALLER Shadow-Zeilen (Suffix, Schluessel-sortiert) — beweist, dass die Remote-
 *  Tabellen nach dem Delta exakt dem lokal berechneten Zielzustand entsprechen. */
export function schattenFingerprint(s: Schatten): string {
  const h = createHash('sha256');
  for (const l of [...s].sort((a, b) => (a.suffix < b.suffix ? -1 : 1))) {
    h.update(`|${l.suffix}|${l.werte.length}|`);
    for (const [, w] of [...nachSchluessel(l)].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))) {
      for (const x of w) schreibeWert(h, x);
    }
  }
  return h.digest('hex');
}

export function schattenZeilen(s: Schatten): number {
  return s.reduce((n, l) => n + l.werte.length, 0);
}

/** Spielt Shadow-Ladungen in eine frisch angelegte FTS5-Tabelle ein (wie der Sync remote). */
function ladeSchatten(db: DatabaseSync, name: string, ladungen: Schatten): void {
  // Eine frisch angelegte FTS5-Tabelle traegt schon averages/structure und die Formatversion.
  db.exec(`DELETE FROM ${name}_data`);
  db.exec(`DELETE FROM ${name}_config`);
  for (const l of ladungen) {
    const ins = db.prepare(
      `INSERT INTO ${name}${l.suffix} (${l.spalten.join(', ')}) VALUES (${l.spalten.map(() => '?').join(', ')})`,
    );
    for (const w of l.werte) {
      // KOPIE der BLOBs: ein gelesenes Uint8Array(0) bindet auf Node 22 als NULL (Probe 9,
      // turso-fts-index.test.ts); eine frische Kopie bindet korrekt.
      ins.run(...(w.map((v) => (v instanceof Uint8Array ? new Uint8Array(v) : v)) as Array<string | number | null | Uint8Array>));
    }
  }
}

/** Ersatztexte eines Dokuments aus den Vocab-Instanzen: je Spalte die Terme nach Position. */
function ersatzTexte(
  db: DatabaseSync,
  vocab: string,
  spalten: readonly string[],
): Map<number, string[]> {
  const roh = new Map<number, Array<Array<[number, string]>>>();
  const q = db.prepare(`SELECT doc, col, "offset" AS pos, term FROM ${vocab} WHERE doc IN (SELECT rid FROM chg)`);
  for (const r of q.all() as Array<{ doc: number; col: string; pos: number; term: string }>) {
    let d = roh.get(r.doc);
    if (!d) roh.set(r.doc, (d = spalten.map(() => [])));
    const c = spalten.indexOf(r.col);
    if (c < 0) throw new Error(`Vocab liefert unbekannte Spalte «${r.col}»`);
    d[c].push([r.pos, r.term]);
  }
  const aus = new Map<number, string[]>();
  for (const [doc, cols] of roh) {
    aus.set(doc, cols.map((c) => c.sort((a, b) => a[0] - b[0]).map((x) => x[1]).join(' ')));
  }
  return aus;
}

export interface FtsDelta {
  /** Geaenderte/neue Shadow-Zeilen je Suffix (INSERT OR REPLACE auf der Gegenseite). */
  upserts: Schatten;
  /** Entfallene Shadow-Zeilen je Suffix (Schluessel-Tupel). */
  loeschungen: Array<{ suffix: string; schluesselSpalten: string[]; schluessel: Wert[][] }>;
  /** Zielzustand der Shadow-Tabellen nach dem Delta — Soll fuer die Remote-Verifikation. */
  nachher: Schatten;
  /** Dokumente, deren Terme/Laenge sich geaendert haben, die neu sind oder entfallen. */
  geaenderteDokumente: number;
  /** Shadow-Zeilen, die das Delta schreibt (Upserts + Loeschungen). */
  deltaZeilen: number;
  /** Shadow-Zeilen der Remote-Tabellen VOR dem Delta (Bezugsgroesse der Schwelle). */
  remoteZeilen: number;
}

/**
 * Rechnet das Delta, siehe Kopf. Wirft bei jeder Unstimmigkeit — der Aufrufer faellt dann auf
 * den Vollneubau zurueck, es wird nichts hochgeladen.
 *
 * @param ddl     DDL-Funktion der Tabelle (`ddlFtsArtikel`)
 * @param spalten Spalten des Index in Reihenfolge (`FTS_ARTIKEL_SPALTEN`)
 * @param remote  Shadow-Tabellen der Replika (gelesen)
 * @param neu     Shadow-Tabellen des neuen lokalen Index
 */
export function berechneFtsDelta(a: {
  ddl: (name: string) => string;
  spalten: readonly string[];
  remote: Schatten;
  neu: Schatten;
}): FtsDelta {
  const { spalten } = a;
  const db = new DatabaseSync(':memory:');
  try {
    // Shadow-Schreibzugriff nur auf Node >= 23 loesbar/noetig (vgl. turso-fts-index.test.ts).
    if (typeof db.enableDefensive === 'function') db.enableDefensive(false);
    db.exec(a.ddl('alt'));
    db.exec(a.ddl('neu'));
    // Die Config-Zeilen (Formatversion, Konfiguration) muessen identisch sein — sonst ist die
    // Remote-Tabelle nicht mit demselben Format gebaut und ein Delta waere ungedeckt.
    const cfgR = a.remote.find((l) => l.suffix === '_config');
    const cfgN = a.neu.find((l) => l.suffix === '_config');
    if (!cfgR || !cfgN || schattenFingerprint([cfgR]) !== schattenFingerprint([cfgN])) {
      throw new Error('FTS5-_config der Replika weicht vom lokalen Index ab — Delta nicht belegt');
    }
    ladeSchatten(db, 'alt', a.remote);
    ladeSchatten(db, 'neu', a.neu);
    db.exec(`CREATE VIRTUAL TABLE va USING fts5vocab(alt, 'instance')`);
    db.exec(`CREATE VIRTUAL TABLE vn USING fts5vocab(neu, 'instance')`);

    const instanzen = (v: string) => `SELECT term, doc, col, "offset" FROM ${v}`;
    db.exec('CREATE TEMP TABLE chg (rid INTEGER PRIMARY KEY)');
    for (const [x, y] of [
      [instanzen('va'), instanzen('vn')],
      [instanzen('vn'), instanzen('va')],
    ]) {
      db.exec(`INSERT OR IGNORE INTO chg SELECT doc FROM (${x} EXCEPT ${y})`);
    }
    for (const [x, y] of [
      ['alt', 'neu'],
      ['neu', 'alt'],
    ]) {
      db.exec(`INSERT OR IGNORE INTO chg SELECT id FROM (SELECT id, sz FROM ${x}_docsize EXCEPT SELECT id, sz FROM ${y}_docsize)`);
    }
    const geaendert = (db.prepare('SELECT rid FROM chg ORDER BY rid').all() as Array<{ rid: number }>).map((r) => r.rid);

    const alteTexte = ersatzTexte(db, 'va', spalten);
    const neueTexte = ersatzTexte(db, 'vn', spalten);
    const imAlt = new Set((db.prepare('SELECT id FROM alt_docsize').all() as Array<{ id: number }>).map((r) => r.id));
    const imNeu = new Set((db.prepare('SELECT id FROM neu_docsize').all() as Array<{ id: number }>).map((r) => r.id));
    const leer = spalten.map(() => '');

    const cols = spalten.join(', ');
    const platz = spalten.map(() => '?').join(', ');
    const del = db.prepare(`INSERT INTO alt(alt, rowid, ${cols}) VALUES('delete', ?, ${platz})`);
    const ins = db.prepare(`INSERT INTO alt(rowid, ${cols}) VALUES (?, ${platz})`);
    db.exec('BEGIN');
    // Erst ALLE Loeschungen, dann alle Einfuegungen: ein geaendertes Dokument gleicher rowid
    // wird so nie «eingefuegt, bevor es geloescht ist».
    for (const rid of geaendert) if (imAlt.has(rid)) del.run(rid, ...(alteTexte.get(rid) ?? leer));
    for (const rid of geaendert) if (imNeu.has(rid)) ins.run(rid, ...(neueTexte.get(rid) ?? leer));
    db.exec('COMMIT');

    // SELBSTPRUEFUNG (Schritt 5): ohne sie waere ein verfehlter Ersatztext ein stiller
    // Index-Fehler — der contentless integrity-check ist inhaltsblind.
    for (const [x, y] of [
      ['va', 'vn'],
      ['vn', 'va'],
    ]) {
      const n = (db.prepare(`SELECT count(*) AS n FROM (${instanzen(x)} EXCEPT ${instanzen(y)})`).get() as { n: number }).n;
      if (n !== 0) throw new Error(`Delta-Selbstpruefung: ${n} Index-Instanzen weichen vom neuen lokalen Index ab`);
    }
    for (const [x, y] of [
      ['alt', 'neu'],
      ['neu', 'alt'],
    ]) {
      const n = (
        db.prepare(`SELECT count(*) AS n FROM (SELECT id, sz FROM ${x}_docsize EXCEPT SELECT id, sz FROM ${y}_docsize)`).get() as { n: number }
      ).n;
      if (n !== 0) throw new Error(`Delta-Selbstpruefung: ${n} _docsize-Zeilen weichen vom neuen lokalen Index ab`);
    }
    const mittel = (t: string) => db.prepare(`SELECT block FROM ${t}_data WHERE id = 1`).get() as { block: Uint8Array } | undefined;
    const mA = mittel('alt');
    const mN = mittel('neu');
    if (!mA || !mN || Buffer.compare(mA.block, mN.block) !== 0) {
      throw new Error('Delta-Selbstpruefung: Durchschnitts-Zeile (_data id 1) weicht ab');
    }
    db.exec(`INSERT INTO alt(alt) VALUES('integrity-check')`);

    // Schritt 6: Differenz der Shadow-Tabellen von `alt` vor/nach den Operationen.
    const nachher = [...leseFtsSchatten(db, 'alt', false)];
    const upserts: Schatten = [];
    const loeschungen: FtsDelta['loeschungen'] = [];
    let remoteZeilen = 0;
    for (const def of schattenDefinitionen(false)) {
      const vor = a.remote.find((l) => l.suffix === def.suffix);
      const nach = nachher.find((l) => l.suffix === def.suffix);
      if (!vor || !nach) throw new Error(`Shadow-Tabelle ${def.suffix} fehlt auf einer Seite`);
      remoteZeilen += vor.werte.length;
      const mv = nachSchluessel(vor);
      const mn = nachSchluessel(nach);
      const neueZeilen = [...mn].filter(([k, w]) => !mv.has(k) || !werteGleich(mv.get(k) as Wert[], w)).map(([, w]) => w);
      if (neueZeilen.length > 0) upserts.push({ suffix: def.suffix, spalten: def.spalten, werte: neueZeilen });
      const n = SCHLUESSEL_ANZAHL[def.suffix] ?? 1;
      const weg = [...mv].filter(([k]) => !mn.has(k)).map(([, w]) => w.slice(0, n));
      if (weg.length > 0) loeschungen.push({ suffix: def.suffix, schluesselSpalten: def.spalten.slice(0, n), schluessel: weg });
    }
    const deltaZeilen = schattenZeilen(upserts) + loeschungen.reduce((s, l) => s + l.schluessel.length, 0);
    return { upserts, loeschungen, nachher, geaenderteDokumente: geaendert.length, deltaZeilen, remoteZeilen };
  } finally {
    db.close();
  }
}

/** Liest die Shadow-Tabellen einer FTS5-Tabelle ueber eine beliebige Lese-Funktion (Hrana
 *  remote oder SQLite-Attrappe im Test). Blockweise nach `id`, damit keine Antwort riesig wird. */
export async function leseSchattenUeber(
  lese: (sql: string, args?: Wert[]) => Promise<Wert[][]>,
  tabelle: string,
): Promise<Schatten> {
  const aus: Schatten = [];
  for (const def of schattenDefinitionen(false)) {
    const t = `${tabelle}${def.suffix}`;
    const spaltenListe = def.spalten.join(', ');
    const werte: Wert[][] = [];
    if (def.spalten[0] === 'id') {
      const seite = def.suffix === '_data' ? 1000 : 20000;
      let ab = -1;
      for (;;) {
        const rows = await lese(`SELECT ${spaltenListe} FROM ${t} WHERE id > ? ORDER BY id LIMIT ${seite}`, [ab]);
        werte.push(...rows);
        if (rows.length < seite) break;
        ab = rows[rows.length - 1][0] as number;
      }
    } else {
      // _config (k) und _idx (segid, term): klein — eine Abfrage, deterministisch sortiert.
      const ordnung = def.spalten[0] === 'segid' ? 'segid, term' : def.spalten[0];
      werte.push(...(await lese(`SELECT ${spaltenListe} FROM ${t} ORDER BY ${ordnung}`)));
    }
    aus.push({ suffix: def.suffix, spalten: def.spalten, werte });
  }
  return aus;
}
