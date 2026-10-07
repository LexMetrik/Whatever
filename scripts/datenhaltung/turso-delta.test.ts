// scripts/datenhaltung/turso-delta.test.ts
// Beweist das zeilengenaue Nachfuehren (E0-BRANDSCHUTZ): Delta-Remote == Vollneubau-Remote,
// gegen eine SQLite-Attrappe der Turso-Gegenseite — KEIN Netz, KEIN Token, nie Prod.
//
// Die Attrappe hat dieselbe Form wie die Replika: Basis-Tabellen aus DDL_BASIS, die
// contentless FTS5-Tabelle aus ddlFtsArtikel, der Index per Shadow-Transport (derselbe Weg wie
// `ladeFtsIndex` in turso-sync.ts), `sync_meta` mit den Marken. Der Vollneubau-Helfer unten
// stellt nach, was der Sync-Vollpfad auf der Gegenseite hinterlaesst.
import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { ddlFtsArtikel } from './fts';
import { BM25_GEWICHTE, FTS_ARTIKEL_SPALTEN } from './suche-kern';
import { BASIS, DDL_BASIS, type Signatur } from './turso-skip';
import { leseFtsSchatten } from './turso-fts-index';
import {
  versucheNormtextDelta,
  zeilenHash,
  ladeZeilenBasis,
  NORMTEXT_GRUPPE,
  type Fern,
  type FernTx,
  type DeltaEingabe,
} from './turso-delta';
import { hranaFern } from './turso-hrana';
import { buendeleStatements, gruppiereInserts, stmtBytes } from './turso-stmts';
import { MAX_BYTES_JE_REQUEST, MAX_BYTES_JE_STMT, MAX_PARAM_JE_STMT, type Stmt, type Wert } from './turso-transport';

// ─── Korpus-Generator ─────────────────────────────────────────────────────────────────
const WOERTER = ['Verjährung', 'Kündigung', 'Miete', 'Pfand', 'Schuld', 'Frist', 'Gläubiger', 'Rechtsöffnung', 'und', 'der',
  'Vertrag', 'Haftung', 'Zahlung', 'Gericht', 'Ǆudi', 'Straße', 'co-op', '41bis', 'naïve', 'İstanbul', 'ﬁnal'];

interface Opt {
  erlasse?: number;
  proErlass?: number;
  /** globaler Artikel-Index → angehaengter Text (Inhalt aendert sich, rowid bleibt). */
  text?: Record<number, string>;
  titel?: Record<number, string>;
  /** Erlass-Index → neuer sha der Fassung (UPDATE ueber zusammengesetzten Schluessel). */
  fassungSha?: Record<number, string>;
  ohneLetzte?: number;
  plus?: number;
  /** ganzer Erlass VORNE eingefuegt → verschiebt die rowid aller Folgezeilen. */
  erlassVorn?: boolean;
  /** Anteil 0..1 der Artikel, deren Text sich aendert. */
  alleAendern?: number;
}
interface ArtZeile { erlass: string; artId: string; ord: number; text: string; marg: string; titel: string }

function korpus(o: Opt = {}) {
  const nE = o.erlasse ?? 6;
  const pro = o.proErlass ?? 40;
  const keys = Array.from({ length: nE }, (_, e) => `E${e}`);
  if (o.erlassVorn) keys.unshift('EA');
  const erlasse = keys.map((k, e) => [k, 'bund', null, `SR ${e}`, `ABK${e}`, o.titel?.[e] ?? `Erlass ${e}`, 'zivilrecht', 'in-kraft']);
  const fassungen = keys.map((k, e) => [k, 'F1', '2020-01-01', null, '2026-01-01', `https://fedlex.invalid/${k}`, 'AS 1', '2026-10-01', o.fassungSha?.[e] ?? `sha-${k}`]);
  const art: ArtZeile[] = [];
  let i = 0;
  for (const k of keys) {
    for (let a = 0; a < pro; a++, i++) {
      const w = [0, 1, 2, 3, 4, 5, 6, 7].map((j) => WOERTER[(i * 7 + a * 3 + j * 5) % WOERTER.length]).join(' ');
      const extra = o.text?.[i] ?? (o.alleAendern && i % Math.round(1 / o.alleAendern) === 0 ? 'geaendert Zusatz' : '');
      art.push({ erlass: k, artId: `art_${a}`, ord: a, text: `${w} ${extra}`.trim(), marg: `Randtitel ${a} ${WOERTER[a % WOERTER.length]}`, titel: erlasse.find((e) => e[0] === k)?.[5] as string });
    }
  }
  if (o.ohneLetzte) art.splice(art.length - o.ohneLetzte, o.ohneLetzte);
  for (let p = 0; p < (o.plus ?? 0); p++) {
    art.push({ erlass: keys[keys.length - 1], artId: `art_neu${p}`, ord: 900 + p, text: `Neu ${p} Verjährung Gericht`, marg: `Neu ${p}`, titel: 'x' });
  }
  return { erlasse, fassungen, art };
}

/** Lokales Artefakt (wie daten/normtext.db): Basis-Tabellen + contentless fts_artikel. */
function lokalDb(k: ReturnType<typeof korpus>): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE erlasse (key TEXT PRIMARY KEY, ebene TEXT, kanton TEXT, sr TEXT, abkuerzung TEXT, titel TEXT, rechtsgebiet TEXT, status TEXT);
    CREATE TABLE erlass_fassungen (erlass_key TEXT, fassungs_token TEXT, gueltig_von TEXT, gueltig_bis TEXT, stand TEXT, quelle_url TEXT, as_fundstelle TEXT, abgerufen TEXT, sha TEXT, PRIMARY KEY (erlass_key, fassungs_token));
    CREATE TABLE artikel (erlass_key TEXT, fassungs_token TEXT, art_id TEXT, ord INTEGER, artikel TEXT, artikel_label TEXT, marg TEXT, grundlage TEXT, quelle_url TEXT, bloecke_json TEXT, sha TEXT, PRIMARY KEY (erlass_key, fassungs_token, art_id));`);
  for (const r of k.erlasse) db.prepare(`INSERT INTO erlasse VALUES (${r.map(() => '?').join(',')})`).run(...(r as Array<string | null>));
  for (const r of k.fassungen) db.prepare(`INSERT INTO erlass_fassungen VALUES (${r.map(() => '?').join(',')})`).run(...(r as Array<string | null>));
  db.exec(ddlFtsArtikel('fts_artikel'));
  const insA = db.prepare('INSERT INTO artikel VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  const insF = db.prepare(`INSERT INTO fts_artikel(rowid, ${FTS_ARTIKEL_SPALTEN.join(',')}) VALUES (?,?,?,?,?,?,?)`);
  let rid = 0;
  for (const a of k.art) {
    rid++;
    insA.run(a.erlass, 'F1', a.artId, a.ord, String(a.ord), `Art. ${a.ord}`, a.marg, null, `https://fedlex.invalid/${a.erlass}#${a.artId}`, JSON.stringify([{ t: 'p', text: a.text }]), `s-${a.text.length}`);
    insF.run(rid, a.text, a.marg, '', a.titel, '', `fn${a.ord % 5}`);
  }
  return db;
}

// ─── Attrappe der Gegenseite ──────────────────────────────────────────────────────────
// Eine DATEI statt :memory:, und JEDE Lese-Anfrage / jede Transaktion auf einer EIGENEN
// Verbindung — wie Hrana (jeder Request ein Stream). Grund: FTS5 haelt je Verbindung
// Struktur-Caches; direkte Shadow-Schreibungen sind fuer die schreibende Verbindung selbst
// unsichtbar bzw. «corruption» (Probe 7.10.2026), fuer jede ANDERE nach COMMIT korrekt.
const ARBEITSORDNER = mkdtempSync(join(tmpdir(), 'turso-delta-'));
let zaehler = 0;
function oeffne(pfad: string): DatabaseSync {
  const db = new DatabaseSync(pfad);
  if (typeof db.enableDefensive === 'function') db.enableDefensive(false);
  return db;
}
function neuerPfad(): string {
  return join(ARBEITSORDNER, `remote-${++zaehler}.db`);
}
const alsWerte = (rows: unknown[]): Wert[][] => (rows as Array<Record<string, Wert>>).map((r) => Object.values(r));

function sqlFern(pfad: string, huelle?: (s: Stmt[]) => Stmt[]): Fern {
  const lese = async (sql: string, args: Wert[] = []): Promise<Wert[][]> => {
    const db = oeffne(pfad);
    try {
      return alsWerte(db.prepare(sql).all(...(args as Array<string | number | null | Uint8Array>)));
    } finally {
      db.close();
    }
  };
  return {
    lese,
    async transaktion<T>(fn: (tx: FernTx) => Promise<T>): Promise<T> {
      const db = oeffne(pfad);
      db.exec('BEGIN');
      try {
        const aus = await fn({
          lese: async (sql, args = []) => alsWerte(db.prepare(sql).all(...(args as Array<string | number | null | Uint8Array>))),
          async ausfuehren(stmts: Stmt[]) {
            for (const s of huelle ? huelle(stmts) : stmts) {
              const args = (s.args ?? []).map((v) => (v instanceof Uint8Array ? new Uint8Array(v) : v));
              db.prepare(s.sql).run(...(args as Array<string | number | null | Uint8Array>));
            }
          },
        });
        db.exec('COMMIT');
        return aus;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      } finally {
        db.close();
      }
    },
  };
}

function sigVon(db: DatabaseSync, tag: string): Map<string, Signatur> {
  const m = new Map<string, Signatur>();
  for (const t of NORMTEXT_GRUPPE) {
    const n = t === 'fts_artikel' ? (db.prepare('SELECT count(*) AS n FROM fts_artikel_docsize').get() as { n: number }).n : (db.prepare(`SELECT count(*) AS n FROM ${t}`).get() as { n: number }).n;
    m.set(t, { signatur: `${tag}-${t}-${zeilenHash([n])}`, sollZeilen: n });
  }
  return m;
}

/** Stellt nach, was der Sync-VOLLPFAD auf der Gegenseite hinterlaesst. */
function vollLaden(lokal: DatabaseSync, tag: string): { remote: string; sig: Map<string, Signatur> } {
  const pfad = neuerPfad();
  const remote = oeffne(pfad);
  for (const t of BASIS) {
    remote.exec(DDL_BASIS[t](t));
    // Derselbe Weg wie der Vollneubau in turso-sync.ts (`ladeTabelle` → `ladeZeilenBasis`).
    const { spalten, werte } = ladeZeilenBasis(lokal, t);
    const ins = remote.prepare(`INSERT INTO ${t} (${spalten.join(', ')}) VALUES (${spalten.map(() => '?').join(',')})`);
    for (const w of werte) ins.run(...(w as Array<string | number | null>));
  }
  remote.exec('CREATE INDEX ix_artikel_erlass ON artikel(erlass_key)');
  remote.exec(ddlFtsArtikel('fts_artikel'));
  remote.exec('DELETE FROM fts_artikel_data; DELETE FROM fts_artikel_config');
  for (const l of leseFtsSchatten(lokal, 'fts_artikel', false)) {
    const ins = remote.prepare(`INSERT INTO fts_artikel${l.suffix} (${l.spalten.join(', ')}) VALUES (${l.spalten.map(() => '?').join(',')})`);
    for (const w of l.werte) ins.run(...(w.map((v) => (v instanceof Uint8Array ? new Uint8Array(v) : v)) as Array<string | number | null | Uint8Array>));
  }
  const sig = sigVon(lokal, tag);
  remote.exec('CREATE TABLE sync_meta (schluessel TEXT PRIMARY KEY, wert TEXT NOT NULL)');
  for (const [t, s] of sig) {
    remote.prepare('INSERT INTO sync_meta VALUES (?, ?)').run(`sig_${t}`, s.signatur);
    remote.prepare('INSERT INTO sync_meta VALUES (?, ?)').run(`zeilen_${t}`, String(s.sollZeilen));
  }
  remote.close();
  return { remote: pfad, sig };
}

function eingabe(remote: string, neuLokal: DatabaseSync, tag: string, nichtSkip?: string[], huelle?: (s: Stmt[]) => Stmt[]): DeltaEingabe {
  const sig = sigVon(neuLokal, tag);
  const rdb = oeffne(remote);
  const marken = new Map(
    (rdb.prepare("SELECT schluessel, wert FROM sync_meta WHERE schluessel LIKE 'sig\\_%' ESCAPE '\\'").all() as Array<{ schluessel: string; wert: string }>).map((r) => [r.schluessel.slice(4), r.wert]),
  );
  rdb.close();
  return {
    fern: sqlFern(remote, huelle),
    normtext: neuLokal,
    nichtSkip: new Set(nichtSkip ?? NORMTEXT_GRUPPE),
    lokaleSig: sig,
    remoteSigMarken: marken,
    sollZeilen: Object.fromEntries([...sig].map(([t, s]) => [t, s.sollZeilen])),
    ftsDdl: ddlFtsArtikel,
    ftsSpalten: FTS_ARTIKEL_SPALTEN,
    matchProben: ['verjahrung'],
    log: () => undefined,
  };
}

function momentaufnahme(pfad: string): string {
  const db = oeffne(pfad);
  const teile: string[] = [];
  for (const t of ['erlasse', 'erlass_fassungen', 'artikel', 'sync_meta', 'fts_artikel_data', 'fts_artikel_idx', 'fts_artikel_docsize', 'fts_artikel_config']) {
    const rows = db.prepare(`SELECT * FROM ${t}`).all() as Array<Record<string, Wert>>;
    teile.push(t + JSON.stringify(rows.map((r) => Object.values(r).map((v) => (v instanceof Uint8Array ? Buffer.from(v).toString('hex') : v)))));
  }
  db.close();
  return teile.join('\n');
}

/** Einmal-SQL auf der Attrappe (eigene Verbindung). */
function sql(pfad: string, text: string): void {
  const db = oeffne(pfad);
  db.exec(text);
  db.close();
}
function marke(pfad: string, k: string): string {
  const db = oeffne(pfad);
  const r = (db.prepare('SELECT wert FROM sync_meta WHERE schluessel = ?').get(k) as { wert: string }).wert;
  db.close();
  return r;
}

const SUCHEN = ['"verjahrung"', '"kundigung"', '"miete"', '"und"', '"geaendert"', '"neu"', 'marginalie : "randtitel"', '"co" "op"', '"istanbul"', '"strasse"', '"41bis"'];
function sucheBefund(pfad: string) {
  const db = oeffne(pfad);
  const w = BM25_GEWICHTE.join(', ');
  const aus = {
    n: (db.prepare('SELECT count(*) AS n FROM fts_artikel').get() as { n: number }).n,
    treffer: SUCHEN.map((q) =>
      db.prepare(`SELECT rowid AS rid, bm25(fts_artikel, ${w}) AS bm FROM fts_artikel WHERE fts_artikel MATCH ? ORDER BY bm, rowid`).all(q),
    ),
  };
  db.close();
  return aus;
}
function basisBefund(pfad: string) {
  const db = oeffne(pfad);
  const aus = BASIS.map((t) => db.prepare(`SELECT rowid AS rid, * FROM ${t} ORDER BY rowid`).all());
  db.close();
  return aus;
}

describe('Delta == Vollneubau (zeilengenau nachfuehren statt Vollneubau)', () => {
  it('geaenderte Texte + Titel + Anhang am Ende: Remote nach Delta == Remote nach Vollneubau', async () => {
    const alt = lokalDb(korpus());
    const neu = lokalDb(korpus({ text: { 3: 'Verjährung Gläubiger Zusatz', 77: 'neuer Text Miete', 151: 'Kündigung' }, titel: { 2: 'Neuer Titel' }, fassungSha: { 1: 'sha-neu', 4: 'sha-neu2' }, ohneLetzte: 1, plus: 2 }));
    const { remote } = vollLaden(alt, 'alt');
    const { remote: soll } = vollLaden(neu, 'neu');

    const e = eingabe(remote, neu, 'neu');
    const r = await versucheNormtextDelta(e);
    expect(r).toMatchObject({ ok: true });
    if (!r.ok) return;

    // Basis-Tabellen: Zeile fuer Zeile gleich (inkl. rowid und Hash-Spalte).
    expect(basisBefund(remote)).toEqual(basisBefund(soll));
    // Index: gleiche Treffer, gleiche bm25-Werte, gleiche Reihenfolge — fuer jede Probe.
    expect(sucheBefund(remote)).toEqual(sucheBefund(soll));
    // Marken: die Signatur des NEUEN Stands steht in sync_meta, atomar mit den Daten.
    for (const t of NORMTEXT_GRUPPE) {
      expect(marke(remote, `sig_${t}`)).toBe(marke(soll, `sig_${t}`));
      expect(marke(remote, `zeilen_${t}`)).toBe(marke(soll, `zeilen_${t}`));
    }
    // FTS5-eigener Konsistenz-Check auf dem Ergebnis.
    expect(() => sql(remote, "INSERT INTO fts_artikel(fts_artikel) VALUES('integrity-check')")).not.toThrow();
    // Der Test ist wertlos, wenn die Proben nichts fanden oder das Delta alles schrieb (§6.7).
    const s = sucheBefund(soll);
    expect(s.treffer.slice(0, 4).every((t) => t.length > 0)).toBe(true);
    const voll = 240 * 3 + 6 * 2 + 6 * 2 + 240 * 1; // grobe Untergrenze Vollneubau-Schreibzeilen
    expect(r.schreib.basis + r.schreib.fts).toBeLessThan(voll * 0.25);
    expect(r.schreib.basis).toBeGreaterThan(0);
    expect(r.schreib.fts).toBeGreaterThan(0);
  });

  it('nur der Index aendert sich (artikel uebersprungen): Delta nur fuer fts_artikel', async () => {
    const alt = lokalDb(korpus());
    // gleiche artikel-Zeilen, aber anderer Index-Inhalt (z. B. Struktur-Sidecar gliederung)
    const neu = lokalDb(korpus({ titel: { 1: 'Gliederung neu' } }));
    const { remote } = vollLaden(alt, 'alt');
    const { remote: soll } = vollLaden(neu, 'neu');
    const e = eingabe(remote, neu, 'neu', ['erlasse', 'fts_artikel']);
    const r = await versucheNormtextDelta(e);
    expect(r).toMatchObject({ ok: true });
    expect(sucheBefund(remote)).toEqual(sucheBefund(soll));
    expect(basisBefund(remote)).toEqual(basisBefund(soll));
  });

  it('unveraenderter Stand: nichts zu tun, schreibt nur Marken', async () => {
    const alt = lokalDb(korpus());
    const { remote } = vollLaden(alt, 'alt');
    const r = await versucheNormtextDelta(eingabe(remote, alt, 'alt'));
    expect(r).toMatchObject({ ok: true });
    if (r.ok) expect(r.schreib.basis + r.schreib.fts).toBe(0);
  });
});

describe('Rueckfall auf den Vollneubau — Remote bleibt unberuehrt', () => {
  const grundlage = () => {
    const alt = lokalDb(korpus());
    return { alt, ...vollLaden(alt, 'alt') };
  };

  it('fehlende sig-Marke', async () => {
    const { remote } = grundlage();
    const neu = lokalDb(korpus({ text: { 3: 'x' } }));
    sql(remote, "DELETE FROM sync_meta WHERE schluessel = 'sig_artikel'");
    const vor = momentaufnahme(remote);
    const r = await versucheNormtextDelta(eingabe(remote, neu, 'neu'));
    expect(r).toMatchObject({ ok: false, grund: expect.stringContaining('keine sig-Marke fuer artikel') });
    expect(momentaufnahme(remote)).toBe(vor);
  });

  it('DDL-Abweichung (Schema-Aenderung)', async () => {
    const { remote } = grundlage();
    sql(remote, 'ALTER TABLE artikel ADD COLUMN extra TEXT');
    const neu = lokalDb(korpus({ text: { 3: 'x' } }));
    const vor = momentaufnahme(remote);
    const r = await versucheNormtextDelta(eingabe(remote, neu, 'neu'));
    expect(r).toMatchObject({ ok: false, grund: expect.stringContaining('DDL von artikel weicht ab') });
    expect(momentaufnahme(remote)).toBe(vor);
  });

  it('fehlender Index ix_artikel_erlass', async () => {
    const { remote } = grundlage();
    sql(remote, 'DROP INDEX ix_artikel_erlass');
    const r = await versucheNormtextDelta(eingabe(remote, lokalDb(korpus({ text: { 3: 'x' } })), 'neu'));
    expect(r).toMatchObject({ ok: false, grund: expect.stringContaining('ix_artikel_erlass') });
  });

  it('Zeilenzahl-Inkonsistenz (verstuemmelte Replika)', async () => {
    const { remote } = grundlage();
    sql(remote, 'DELETE FROM artikel WHERE rowid > 200');
    const vor = momentaufnahme(remote);
    const r = await versucheNormtextDelta(eingabe(remote, lokalDb(korpus({ text: { 3: 'x' } })), 'neu'));
    expect(r).toMatchObject({ ok: false, grund: expect.stringContaining('Zeilen-Inkonsistenz artikel') });
    expect(momentaufnahme(remote)).toBe(vor);
  });

  it('Delta ueber Schwelle (hier absichtlich auf 0,01 % gesenkt) → Vollneubau', async () => {
    const { remote } = grundlage();
    const vor = momentaufnahme(remote);
    const e = eingabe(remote, lokalDb(korpus({ text: { 3: 'x' } })), 'neu');
    e.schwelle = 0.0001;
    const r = await versucheNormtextDelta(e);
    expect(r).toMatchObject({ ok: false, grund: expect.stringContaining('des Vollneubaus') });
    expect(momentaufnahme(remote)).toBe(vor);
  });

  it('50 % geaenderte Texte bleiben ein Delta (UPDATE = 1 Schreibzeile statt 3) — und stimmen', async () => {
    const { remote } = grundlage();
    const neu = lokalDb(korpus({ alleAendern: 0.5 }));
    const { remote: soll } = vollLaden(neu, 'neu');
    const r = await versucheNormtextDelta(eingabe(remote, neu, 'neu'));
    expect(r).toMatchObject({ ok: true });
    expect(basisBefund(remote)).toEqual(basisBefund(soll));
    expect(sucheBefund(remote)).toEqual(sucheBefund(soll));
  });

  it('neuer Erlass VORNE verschiebt alle rowids → Schwelle → Vollneubau', async () => {
    const { remote } = grundlage();
    const vor = momentaufnahme(remote);
    const r = await versucheNormtextDelta(eingabe(remote, lokalDb(korpus({ erlassVorn: true })), 'neu'));
    expect(r).toMatchObject({ ok: false, grund: expect.stringContaining('des Vollneubaus') });
    expect(momentaufnahme(remote)).toBe(vor);
  });

  it('Verifikation scheitert (UPDATE geht verloren) → Rollback, Remote unveraendert', async () => {
    const { remote } = grundlage();
    const vor = momentaufnahme(remote);
    const neu = lokalDb(korpus({ text: { 3: 'Zusatz Miete', 9: 'noch einer' } }));
    const ohneUpdate = (s: Stmt[]) => s.filter((x) => !x.sql.startsWith('UPDATE artikel'));
    const r = await versucheNormtextDelta(eingabe(remote, neu, 'neu', undefined, ohneUpdate));
    expect(r).toMatchObject({ ok: false, grund: expect.stringContaining('Abweichungen gegen das lokale Artefakt') });
    expect(momentaufnahme(remote)).toBe(vor);
  });

  it('Hash stimmt, Inhalt nicht (UPDATE laesst bloecke_json aus) → Inhalts-Rueckles faengt es → Rollback', async () => {
    const { remote } = grundlage();
    const vor = momentaufnahme(remote);
    const neu = lokalDb(korpus({ text: { 3: 'Zusatz Miete' } }));
    const ohneInhalt = (s: Stmt[]) =>
      s.map((x) => {
        if (!x.sql.startsWith('UPDATE artikel')) return x;
        const args = [...(x.args ?? [])];
        args.splice(6, 1); // Position von bloecke_json in der SET-Liste
        return { sql: x.sql.replace('bloecke_json = ?', 'bloecke_json = bloecke_json'), args };
      });
    const r = await versucheNormtextDelta(eingabe(remote, neu, 'neu', undefined, ohneInhalt));
    expect(r).toMatchObject({ ok: false, grund: expect.stringContaining('im Inhalt vom lokalen Artefakt ab') });
    expect(momentaufnahme(remote)).toBe(vor);
  });

  it('Index-Verifikation scheitert (Shadow-Zeile geht verloren) → Rollback', async () => {
    const { remote } = grundlage();
    const vor = momentaufnahme(remote);
    const neu = lokalDb(korpus({ text: { 3: 'Zusatz Miete' } }));
    const ohneDocsize = (s: Stmt[]) => s.filter((x) => !x.sql.includes('fts_artikel_docsize'));
    const r = await versucheNormtextDelta(eingabe(remote, neu, 'neu', undefined, ohneDocsize));
    expect(r).toMatchObject({ ok: false });
    expect(momentaufnahme(remote)).toBe(vor);
  });

  it('Turso-Schreibsperre wird NICHT verschluckt (Exit 3 bleibt wirksam)', async () => {
    const { remote } = grundlage();
    const e = eingabe(remote, lokalDb(korpus({ text: { 3: 'x' } })), 'neu');
    e.fern = {
      lese: e.fern.lese,
      transaktion: async () => {
        throw new Error('Transaktion zurueckgerollt: SQL write operations are forbidden (do you need to upgrade your plan?)');
      },
    };
    await expect(versucheNormtextDelta(e)).rejects.toThrow('SQL write operations are forbidden');
  });
});

describe('Statement-Bau haelt die Transport-Schranken', () => {
  it('Inserts und Requests ueberschreiten weder Parameter-, Statement- noch Request-Schranke', () => {
    const gross = 'x'.repeat(100_000);
    const werte: Wert[][] = Array.from({ length: 300 }, (_, i) => [i, gross, null, new Uint8Array(1000)]);
    const stmts = gruppiereInserts('INSERT INTO t (a, b, c, d)', 4, werte);
    for (const s of stmts) {
      expect((s.args ?? []).length).toBeLessThanOrEqual(MAX_PARAM_JE_STMT);
      if ((s.args ?? []).length > 4) expect(stmtBytes(s)).toBeLessThanOrEqual(MAX_BYTES_JE_STMT);
    }
    expect(stmts.flatMap((s) => s.args ?? []).length).toBe(300 * 4);
    for (const req of buendeleStatements(stmts)) {
      if (req.length > 1) expect(req.reduce((n, s) => n + stmtBytes(s), 0)).toBeLessThanOrEqual(MAX_BYTES_JE_REQUEST);
    }
  });
});

// ─── Gegen den ECHTEN Hrana-Transport (turso-hrana.ts) ueber lokales HTTP ────────────────
// Ein Mini-Hrana-Server auf der SQLite-Attrappe: Streams per `baton`, typisierte Zellen,
// stmt-Fehler INNERHALB einer HTTP-200-Antwort (wie Turso) — damit laufen Delta UND Vollpfad-
// Bausteine durch denselben Code wie in Produktion (BEGIN/COMMIT ueber baton, Rollback).
interface HranaServer {
  url: string;
  schliesse: () => Promise<void>;
}
async function starteHrana(pfad: string): Promise<HranaServer> {
  const streams = new Map<string, DatabaseSync>();
  let zaehl = 0;
  const dekodiere = (a: { type: string; value?: string; base64?: string }): Wert =>
    a.type === 'null'
      ? null
      : a.type === 'integer' || a.type === 'float'
        ? Number(a.value)
        : a.type === 'blob'
          ? new Uint8Array(Buffer.from(a.base64 ?? '', 'base64'))
          : (a.value ?? '');
  const kodiere = (v: Wert) =>
    v === null
      ? { type: 'null' }
      : typeof v === 'number'
        ? Number.isInteger(v)
          ? { type: 'integer', value: String(v) }
          : { type: 'float', value: v }
        : v instanceof Uint8Array
          ? { type: 'blob', base64: Buffer.from(v).toString('base64') }
          : { type: 'text', value: v };
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const anfrage = JSON.parse(body) as {
        baton?: string;
        requests: Array<{ type: string; stmt?: { sql: string; args?: Array<{ type: string; value?: string; base64?: string }> } }>;
      };
      let baton = anfrage.baton ?? null;
      let db = baton ? streams.get(baton) : undefined;
      if (baton && !db) {
        res.writeHead(400).end('{"error":"baton unbekannt"}');
        return;
      }
      if (!db) db = oeffne(pfad);
      let offen = true;
      const results = anfrage.requests.map((r) => {
        if (r.type === 'close') {
          offen = false;
          return { type: 'ok', response: { type: 'close' } };
        }
        try {
          const st = (db as DatabaseSync).prepare((r.stmt as { sql: string }).sql);
          const args = (r.stmt?.args ?? []).map(dekodiere).map((v) => (v instanceof Uint8Array ? new Uint8Array(v) : v));
          if (st.columns().length > 0) {
            const rows = st.all(...(args as Array<string | number | null | Uint8Array>)) as Array<Record<string, Wert>>;
            return { type: 'ok', response: { type: 'execute', result: { cols: [], rows: rows.map((x) => Object.values(x).map(kodiere)) } } };
          }
          st.run(...(args as Array<string | number | null | Uint8Array>));
          return { type: 'ok', response: { type: 'execute', result: { cols: [], rows: [] } } };
        } catch (e) {
          return { type: 'error', error: { message: e instanceof Error ? e.message : String(e) } };
        }
      });
      if (offen) {
        baton = baton ?? `b${++zaehl}`;
        streams.set(baton, db);
      } else {
        if (baton) streams.delete(baton);
        db.close();
        baton = null;
      }
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ baton, results }));
    });
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  const port = (server.address() as { port: number }).port;
  return {
    url: `http://127.0.0.1:${port}`,
    schliesse: async () => {
      for (const d of streams.values()) d.close();
      await new Promise<void>((ok) => server.close(() => ok()));
    },
  };
}

describe('Delta ueber den echten Hrana-Transport (baton-Transaktion, typisierte Zellen)', () => {
  it('Delta per HTTP == Vollneubau; Fehler im Stream rollt die ganze Transaktion zurueck', async () => {
    const alt = lokalDb(korpus());
    const neu = lokalDb(korpus({ text: { 5: 'Zusatz Verjährung', 101: 'Miete Kündigung' }, plus: 1 }));
    const { remote } = vollLaden(alt, 'alt');
    const { remote: soll } = vollLaden(neu, 'neu');
    const srv = await starteHrana(remote);
    try {
      const fern = hranaFern(srv.url, 'test-token-ohne-bedeutung');
      // Rollback-Beweis: ein Statement mit Fehler mitten in der Transaktion → NICHTS bleibt.
      const vor = momentaufnahme(remote);
      await expect(
        fern.transaktion(async (tx) => {
          await tx.ausfuehren([{ sql: "UPDATE artikel SET marg = 'kaputt'" }, { sql: 'INSERT INTO gibt_es_nicht VALUES (1)' }]);
        }),
      ).rejects.toThrow('stmt-Fehler');
      expect(momentaufnahme(remote)).toBe(vor);
      // Lesen in der offenen Transaktion sieht die eigenen Schreibungen (Verifikations-Grundlage).
      await fern
        .transaktion(async (tx) => {
          await tx.ausfuehren([{ sql: "UPDATE artikel SET marg = 'x' WHERE rowid = 1" }]);
          expect((await tx.lese('SELECT marg FROM artikel WHERE rowid = 1'))[0][0]).toBe('x');
          throw new Error('absichtlich');
        })
        .catch(() => undefined);
      expect(momentaufnahme(remote)).toBe(vor);

      const e = eingabe(remote, neu, 'neu');
      e.fern = fern;
      const r = await versucheNormtextDelta(e);
      expect(r).toMatchObject({ ok: true });
      expect(basisBefund(remote)).toEqual(basisBefund(soll));
      expect(sucheBefund(remote)).toEqual(sucheBefund(soll));
    } finally {
      await srv.schliesse();
    }
  });
});
