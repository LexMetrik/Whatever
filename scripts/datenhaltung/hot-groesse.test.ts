// scripts/datenhaltung/hot-groesse.test.ts
// Beweist die HOT-Groessen-Messung (A1-FUNDAMENT, 16.10.2026): gezaehlt werden NUR die nach Turso
// replizierten B-Baeume, die Summe ist die dbstat-Seitensumme, und die Liste der replizierten
// Tabellen ist die eine, die turso-sync.ts liest.
// §6.7 Rot-Probe: in hot-groesse.ts `replizierteTabelle()` so aendern, dass auch `eintrag`
// zugeordnet wird (z. B. `if (tblName === 'eintrag') return tblName;`) → die Tests «zaehlt nur …»
// und «Summe == Seitensumme der erwarteten B-Baeume» schlagen fehl (Ausgabe im Bericht).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { ddlFtsArtikel, ddlFtsEntscheide, FTS_ENTSCHEIDE_SPALTEN } from './fts';
import { FTS_ARTIKEL_SPALTEN } from './suche-kern';
import {
  SCHATTEN,
  TURSO_FREE_SPEICHER_BYTES,
  messeReplizierteBaeume,
  pruefeAbdeckung,
  bewerteHotBudget,
} from './hot-groesse';

/** Spaltennamen ohne den UNINDEXED-Zusatz der DDL-Liste. */
const ENTSCHEIDE_NAMEN = FTS_ENTSCHEIDE_SPALTEN.map((s) => s.split(' ')[0]);

/** Mini-Replika: replizierte Tabellen mit Index + eine grosse, NICHT replizierte Tabelle. */
function baueProbe(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE erlasse (key TEXT PRIMARY KEY, titel TEXT NOT NULL);
    CREATE TABLE erlass_fassungen (erlass_key TEXT NOT NULL, fassungs_token TEXT NOT NULL, PRIMARY KEY (erlass_key, fassungs_token));
    CREATE TABLE artikel (erlass_key TEXT NOT NULL, art_id TEXT NOT NULL, bloecke_json TEXT NOT NULL, PRIMARY KEY (erlass_key, art_id));
    CREATE INDEX ix_artikel_erlass ON artikel(erlass_key);
    CREATE TABLE eintrag (pfad TEXT NOT NULL, idx INTEGER NOT NULL, blob TEXT NOT NULL, PRIMARY KEY (pfad, idx));
    CREATE INDEX idx_eintrag_pfad ON eintrag(blob);
  `);
  db.exec(ddlFtsArtikel('fts_artikel'));
  db.exec(ddlFtsEntscheide('fts_entscheide_schaufenster'));
  const text = 'Die Verjährung beginnt mit der Fälligkeit der Forderung. '.repeat(20);
  for (let i = 1; i <= 60; i++) {
    db.prepare('INSERT INTO erlasse VALUES (?, ?)').run(`e${i}`, `Erlass ${i}`);
    db.prepare('INSERT INTO erlass_fassungen VALUES (?, ?)').run(`e${i}`, 'f1');
    db.prepare('INSERT INTO artikel VALUES (?, ?, ?)').run(`e${i % 6}`, `art_${i}`, text + i);
    db.prepare(`INSERT INTO fts_artikel(rowid, ${FTS_ARTIKEL_SPALTEN.join(', ')}) VALUES (?, ${FTS_ARTIKEL_SPALTEN.map(() => '?').join(', ')})`)
      .run(i, text + i, '', '', '', '', '');
    db.prepare(
      `INSERT INTO fts_entscheide_schaufenster(${ENTSCHEIDE_NAMEN.join(', ')}) VALUES (${ENTSCHEIDE_NAMEN.map(() => '?').join(', ')})`,
    ).run(...ENTSCHEIDE_NAMEN.map((s) => `${s} ${text} ${i}`));
  }
  // Die NICHT replizierte Tabelle ist absichtlich viel groesser als alles Replizierte zusammen.
  for (let i = 0; i < 600; i++) {
    db.prepare('INSERT INTO eintrag VALUES (?, ?, ?)').run('datei', i, `${i} ` + 'x'.repeat(3000));
  }
  return db;
}

function seitenSumme(db: DatabaseSync, namen: string[]): number {
  const alle = db.prepare('SELECT name, SUM(pgsize) AS b FROM dbstat GROUP BY name').all() as Array<{ name: string; b: number }>;
  return alle.filter((r) => namen.includes(r.name)).reduce((n, r) => n + Number(r.b), 0);
}

describe('messeReplizierteBaeume', () => {
  it('zaehlt nur replizierte Tabellen samt Indizes und FTS-Schattentabellen, nicht eintrag', () => {
    const db = baueProbe();
    const m = messeReplizierteBaeume(db);
    const namen = m.baeume.map((b) => b.name);
    expect(namen).toEqual(
      [
        'artikel',
        'erlass_fassungen',
        'erlasse',
        'fts_artikel_config',
        'fts_artikel_data',
        'fts_artikel_docsize',
        'fts_artikel_idx',
        'fts_entscheide_schaufenster_config',
        'fts_entscheide_schaufenster_content',
        'fts_entscheide_schaufenster_data',
        'fts_entscheide_schaufenster_docsize',
        'fts_entscheide_schaufenster_idx',
        'ix_artikel_erlass',
        'sqlite_autoindex_artikel_1',
        'sqlite_autoindex_erlass_fassungen_1',
        'sqlite_autoindex_erlasse_1',
      ].sort((a, b) => a.localeCompare(b)),
    );
    expect(namen.some((n) => n.includes('eintrag'))).toBe(false);
    expect(namen).not.toContain('sqlite_schema');
    // contentless legt kein `_content` an — und wird auch nicht gezaehlt
    expect(namen).not.toContain('fts_artikel_content');
    expect(m.gefunden).toEqual([...SCHATTEN]);
  });

  it('Summe == dbstat-Seitensumme genau der erwarteten B-Baeume (und deutlich < Datei)', () => {
    const db = baueProbe();
    const m = messeReplizierteBaeume(db);
    expect(m.bytes).toBe(m.baeume.reduce((n, b) => n + b.bytes, 0));
    expect(m.bytes).toBe(seitenSumme(db, m.baeume.map((b) => b.name)));
    // unabhaengige Gegenrechnung: alles ausser eintrag-Baeumen und dem Schema
    const alle = db.prepare('SELECT name, SUM(pgsize) AS b FROM dbstat GROUP BY name').all() as Array<{ name: string; b: number }>;
    const fremd = alle.filter((r) => /eintrag/.test(r.name) || r.name === 'sqlite_schema').reduce((n, r) => n + Number(r.b), 0);
    const gesamt = alle.reduce((n, r) => n + Number(r.b), 0);
    expect(m.bytes).toBe(gesamt - fremd);
    // Randdaten: die nicht replizierte Tabelle ist gross genug, dass das Mitzaehlen auffiele
    expect(fremd).toBeGreaterThan(m.bytes);
    // ... und die Seitensumme liegt im Bereich der Datei (dbstat zaehlt ganze Seiten)
    const pageCount = Number((db.prepare('PRAGMA page_count').get() as { page_count: number }).page_count);
    const pageSize = Number((db.prepare('PRAGMA page_size').get() as { page_size: number }).page_size);
    expect(gesamt).toBe(pageCount * pageSize);
  });

  it('leere DB: 0 Bytes, nichts gefunden', () => {
    const m = messeReplizierteBaeume(new DatabaseSync(':memory:'));
    expect(m).toEqual({ bytes: 0, baeume: [], gefunden: [] });
  });

  it('Tabelle mit Praefix-Namen (artikel_x, fts_artikel_extra) wird nicht mitgezaehlt', () => {
    const db = baueProbe();
    db.exec('CREATE TABLE artikel_x (a TEXT PRIMARY KEY); CREATE TABLE fts_artikel_extra (a INTEGER PRIMARY KEY, b TEXT)');
    const namen = messeReplizierteBaeume(db).baeume.map((b) => b.name);
    expect(namen.some((n) => n.includes('artikel_x') || n.includes('fts_artikel_extra'))).toBe(false);
  });
});

describe('SCHATTEN — eine Liste', () => {
  it('ist die Replika-Menge von turso-sync und wird dort nicht ein zweites Mal definiert', () => {
    expect([...SCHATTEN]).toEqual(['erlasse', 'erlass_fassungen', 'artikel', 'fts_artikel', 'fts_entscheide_schaufenster']);
    const sync = readFileSync('scripts/datenhaltung/turso-sync.ts', 'utf8');
    expect(sync).toMatch(/import \{ SCHATTEN \} from '\.\/hot-groesse'/);
    expect(sync).not.toMatch(/const SCHATTEN\b/);
  });
});

describe('pruefeAbdeckung', () => {
  it('ok, wenn jede Tabelle in genau einem Artefakt liegt', () => {
    expect(pruefeAbdeckung([['erlasse', 'erlass_fassungen', 'artikel', 'fts_artikel'], ['fts_entscheide_schaufenster'], []])).toEqual([]);
  });
  it('meldet fehlende und doppelte Tabellen', () => {
    const m = pruefeAbdeckung([['erlasse', 'erlass_fassungen', 'artikel', 'fts_artikel'], ['artikel']]);
    expect(m).toContain('fts_entscheide_schaufenster: in keinem Artefakt gefunden');
    expect(m).toContain('artikel: in 2 Artefakten gefunden');
  });
});

describe('bewerteHotBudget', () => {
  it('Grenze Turso Free = 5 GB dezimal, ≈ 4768 MiB', () => {
    expect(TURSO_FREE_SPEICHER_BYTES).toBe(5_000_000_000);
    expect(bewerteHotBudget(0).zeile).toContain('(≈ 4768 MiB)');
  });
  it('OK knapp unter, ÜBERSCHRITTEN ab der Grenze', () => {
    expect(bewerteHotBudget(TURSO_FREE_SPEICHER_BYTES - 1).ok).toBe(true);
    expect(bewerteHotBudget(TURSO_FREE_SPEICHER_BYTES).ok).toBe(false);
    const z = bewerteHotBudget(360 * 1024 * 1024).zeile;
    expect(z).toBe('HOT-Replika (nach Turso repliziert) = 360.00 MiB / Grenze Turso Free 5 GB (≈ 4768 MiB) → OK');
    expect(bewerteHotBudget(TURSO_FREE_SPEICHER_BYTES + 1).zeile).toMatch(/→ ÜBERSCHRITTEN$/);
  });
});
