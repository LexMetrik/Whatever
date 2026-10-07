// scripts/datenhaltung/stabile-rowid.test.ts
// Beweist die stabile rowid der Tabelle `artikel` (E0-BRANDSCHUTZ, Befund M-1 der Gegenpruefung
// zu PR #1343) ueber den ECHTEN Schreibpfad `schreibeErlass` (erlass-rows.ts) — nicht ueber einen
// nachgebauten Helfer. §6.7: Rot-Probe = in erlass-rows.ts die rowid wieder implizit vergeben
// (Einfuegereihenfolge) → die beiden Stabilitaets-Tests schlagen fehl (Ausgabe im PR-Body).
import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { frischesSchema } from './schema';
import { schreibeErlass } from './erlass-rows';
import { artikelRowid, istGueltigeRowid, ROWID_BITS, rowidFingerabdruckSql } from './stabile-rowid';
import type { NormSnapshot } from '../../src/lib/normtext/typen';

interface ErlassSpec {
  key: string;
  artIds: string[];
  /** Zusatz im Text (Inhalt aendert sich, rowid darf es nicht). */
  text?: string;
}

function snapshots(e: ErlassSpec): NormSnapshot[] {
  return e.artIds.map(
    (id, i) =>
      ({
        id: `bund/${e.key}/${id}`,
        ebene: 'bund',
        quelle: e.key,
        erlass: e.key,
        artikel: String(i + 1),
        artikelLabel: `Art. ${i + 1}`,
        bloecke: [{ typ: 'absatz', text: `Verjährung ${id} ${e.text ?? ''}`.trim() }],
        stand: '2026-01-01',
        quelleUrl: `https://fedlex.invalid/${e.key}#${id}`,
        abgerufen: '2026-10-01',
        fassungsToken: 'F1',
        sha: `sha-${e.key}-${id}-${e.text ?? ''}`,
      }) as unknown as NormSnapshot,
  );
}

/** Echter Schreibpfad: Erlasse in GEGEBENER Reihenfolge (wie `ingestNormtextZiel`, nach Pfad sortiert). */
function echteDb(spec: ErlassSpec[]): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  frischesSchema(db, 'normtext');
  for (const e of spec) {
    schreibeErlass(db, { key: e.key, ebene: 'bund', kanton: null, sr: null, abkuerzung: e.key, titel: e.key, rechtsgebiet: 'x', status: 'snapshot' }, snapshots(e));
  }
  return db;
}

const arts = (n: number, praefix = 'art_') => Array.from({ length: n }, (_, i) => `${praefix}${i + 1}`);
const rowids = (db: DatabaseSync): Map<string, number> =>
  new Map(
    (db.prepare('SELECT rowid AS rid, erlass_key, art_id FROM artikel').all() as Array<{ rid: number; erlass_key: string; art_id: string }>).map((r) => [
      `${r.erlass_key}|${r.art_id}`,
      Number(r.rid),
    ]),
  );

describe('artikelRowid — reine Funktion des Schluessels', () => {
  it('deterministisch, im sicheren Zahlenbereich, schluesseltrennend', () => {
    expect(artikelRowid('OR', 'art_41')).toBe(artikelRowid('OR', 'art_41'));
    expect(istGueltigeRowid(artikelRowid('OR', 'art_41'))).toBe(true);
    // «ab|c» und «a|bc» duerfen nicht zusammenfallen (Trenner NUL).
    expect(artikelRowid('ab', 'c')).not.toBe(artikelRowid('a', 'bc'));
    // Feste Werte: eine stille Regelaenderung (anderer Hash, andere Bitzahl) faellt hier auf —
    // sie wuerde jede rowid der Replika aendern und muss an ROWID_REGEL haengen.
    expect(ROWID_BITS).toBe(52);
    expect(artikelRowid('OR', 'art_41')).toBe(3091961619467020);
    expect(artikelRowid('ZH-242.26', '242.26/art_14')).toBe(4069958121891406);
  });

  it('50 000 Schluessel kollidieren nicht (Geburtstagsschranke ≈ 3·10⁻⁷)', () => {
    const gesehen = new Set<number>();
    for (let e = 0; e < 500; e++) for (let a = 0; a < 100; a++) gesehen.add(artikelRowid(`ERL-${e}`, `art_${a}`));
    expect(gesehen.size).toBe(50_000);
  });
});

describe('Stabilitaet ueber den echten Schreibpfad (schreibeErlass)', () => {
  const basis: ErlassSpec[] = [
    { key: 'B', artIds: arts(30) },
    { key: 'C', artIds: arts(30) },
    { key: 'D', artIds: arts(30) },
  ];

  it('Erlass alphabetisch VORN + Artikel aus der Mitte entfernt: keine fremde rowid aendert sich', () => {
    const vorher = rowids(echteDb(basis));
    const ohneMitte = arts(30).filter((id) => id !== 'art_15');
    const nachher = rowids(echteDb([{ key: 'A', artIds: arts(12) }, basis[0], { key: 'C', artIds: ohneMitte }, basis[2]]));
    // Jede vorher vorhandene, nachher noch vorhandene Zeile traegt DIESELBE rowid.
    let verglichen = 0;
    for (const [schluessel, rid] of vorher) {
      if (schluessel === 'C|art_15') continue;
      expect(nachher.get(schluessel), schluessel).toBe(rid);
      verglichen++;
    }
    expect(verglichen).toBe(89); // 90 − der entfernte Artikel: der Test prueft wirklich alle uebrigen
    expect(nachher.has('C|art_15')).toBe(false);
    expect(nachher.size).toBe(90 + 12 - 1);
  });

  it('die rowid haengt nicht an der Einfuegereihenfolge (Reihenfolge vertauscht → gleiche rowids)', () => {
    const a = rowids(echteDb(basis));
    const b = rowids(echteDb([...basis].reverse()));
    expect([...a].sort()).toEqual([...b].sort());
  });

  it('Inhaltsaenderung laesst die rowid unberuehrt', () => {
    const a = rowids(echteDb(basis));
    const b = rowids(echteDb([basis[0], { ...basis[1], text: 'neuer Zusatz' }, basis[2]]));
    expect([...a].sort()).toEqual([...b].sort());
  });
});

describe('Kollisions-Riegel', () => {
  const meta = (key: string) => ({ key, ebene: 'bund' as const, kanton: null, sr: null, abkuerzung: key, titel: key, rechtsgebiet: 'x', status: 'snapshot' });

  it('belegt eine ANDERE Zeile schon dieselbe rowid → Bau bricht ab und nennt beide Schluessel', () => {
    const db = echteDb([{ key: 'ALT', artIds: ['art_1'] }]);
    // Erzwungene Kollision: die vorhandene Zeile traegt die rowid, die «NEU|art_1» bekaeme.
    db.prepare('UPDATE artikel SET rowid = ? WHERE erlass_key = ?').run(artikelRowid('NEU', 'art_1'), 'ALT');
    expect(() => schreibeErlass(db, meta('NEU'), snapshots({ key: 'NEU', artIds: ['art_1'] }))).toThrow(/Kollision.*«ALT\|art_1».*«NEU\|art_1»/);
  });

  it('derselbe Schluessel zweimal (zwei Fassungen je Erlass) → Bau bricht laut ab, kein stilles Ueberschreiben', () => {
    const db = echteDb([{ key: 'X', artIds: ['art_1'] }]);
    expect(() => schreibeErlass(db, meta('X'), snapshots({ key: 'X', artIds: ['art_1'] }))).toThrow();
  });
});

describe('Mengen-Fingerabdruck der rowid-Kopplung', () => {
  const fingerabdruck = (db: DatabaseSync): string => String(Object.values(db.prepare(rowidFingerabdruckSql('t', 'id')).get() as Record<string, unknown>)[0]);
  const mitIds = (ids: number[]): DatabaseSync => {
    const db = new DatabaseSync(':memory:');
    db.exec('CREATE TABLE t (id INTEGER)');
    for (const id of ids) db.prepare('INSERT INTO t VALUES (?)').run(id);
    return db;
  };

  it('faengt eine Menge mit gleicher Zahl und gleichen Extremen, die die alte min/max-Probe passierte', () => {
    const a = mitIds([5, 1_000_000_123_456, 77_777_777_777, 9_000_000_000_000]);
    const b = mitIds([5, 1_000_000_123_456, 77_777_777_778, 9_000_000_000_000]); // eine rowid daneben
    const spanne = (db: DatabaseSync) => JSON.stringify(db.prepare("SELECT min(id) AS a, max(id) AS b, count(*) AS n FROM t").get());
    expect(spanne(a)).toBe(spanne(b)); // die alte Probe haette beide fuer gleich gehalten
    expect(fingerabdruck(a)).not.toBe(fingerabdruck(b));
    expect(fingerabdruck(a)).toBe(fingerabdruck(mitIds([9_000_000_000_000, 77_777_777_777, 1_000_000_123_456, 5]))); // reihenfolgeunabhaengig
  });
});
