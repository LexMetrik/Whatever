import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parseFussnoteHistorie,
  baueArtikelHistorie,
  type FnEingang,
  type ArtikelHistorie,
} from '../lib/normtext/historie-parse';
import { fassungsMarkeEtikett, fassungsSchild } from '../pages/gesetz-leser/fassungsEtikett';
import { tokenAusId } from '../../scripts/normtext/historie-aufgehoben-lebend';

// W2·27-BUND-FERTIG (1.10.2026) · «Gegenstandslos» ist ein EIGENES Historie-Ereignis.
// Befund Gegenprüfung #1183 (§8): StGB Art. 67f zeigte «Fassung · Gilt seit 01.01.2018 · In Kraft», obwohl
// der Normtext seit #1183 «gegenstandslos» sagt. Die Fussnote «Gegenstandslos gemäss …» trug keinen
// Verb-Kopf und fiel auf das generische `inkraft`-Ereignis zurück. Fixtures WÖRTLICH aus der amtlichen
// Fedlex-Konsolidierung (Filestore StGB 20260612 html-4 bzw. OR 20260101 html-12, abgerufen 1.10.2026).

const fn = (text: string, extra: Partial<FnEingang> = {}): FnEingang => ({ text, links: [], absatz: null, item: null, ...extra });

const STGB_67F = 'Gegenstandslos gemäss Ziff. IV 1 des BG vom 19. Juni 2015 (Änderung des Sanktionenrechts), mit Wirkung seit 1. Jan. 2018 (AS 2016 1249; BBl 2012 4721).';

describe('«Gegenstandslos» — eigenes Ereignis statt «In Kraft» (§1/§8, W2·27)', () => {
  it('StGB Art. 67f: «Gegenstandslos gemäss …, mit Wirkung seit …» → typ gegenstandslos, Datum aus der amtlichen Klausel', () => {
    const r = parseFussnoteHistorie(fn(STGB_67F));
    expect(r.klasse).toBe('ereignis');
    expect(r.ereignisse).toHaveLength(1);
    expect(r.ereignisse[0].typ).toBe('gegenstandslos');
    expect(r.ereignisse[0].datum).toBe('2018-01-01');
    expect(r.ereignisse[0].wirkung).toBe(true);
    expect(r.ereignisse[0].quellen.map((q) => q.label)).toEqual(['AS 2016 1249', 'BBl 2012 4721']);
  });

  it('OR SchlT Art. 6: «Gegenstandslos.» → Ereignis ohne Datum (nie geschätzt, §2)', () => {
    const r = parseFussnoteHistorie(fn('Gegenstandslos.'));
    expect(r.klasse).toBe('ereignis');
    expect(r.ereignisse[0].typ).toBe('gegenstandslos');
    expect(r.ereignisse[0].datum).toBeNull();
  });

  it('FINMAG Art. 15 Abs. 2 lit. a: Absatz-/lit.-Skopus bleibt am Ereignis, die Verweis-Prosa erzeugt kein Datum', () => {
    const r = parseFussnoteHistorie(fn('Gegenstandslos. Siehe Art. 75 Abs. 5 des Finanzinstitutsgesetzes vom 15. Juni 2018 (SR 954.1).', { absatz: '2', item: 'a' }));
    expect(r.ereignisse).toHaveLength(1);
    expect(r.ereignisse[0]).toMatchObject({ typ: 'gegenstandslos', datum: null, absatz: '2', item: 'a' });
  });

  it('Gegenproben: «Gegenstandslose UeB.» (Adjektiv), «Dritter Satz gegenstandslos», «… ist heute gegenstandslos» sind KEIN Ganz-Vermerk', () => {
    for (const t of [
      'Gegenstandslose UeB.',
      'Dritter Satz gegenstandslos (AS 2021 673 Ziff. II; BBl 2020 4705).',
      'Art. 61 Abs. 2 Bst. b ist heute gegenstandslos. Stundungs-, Konkurs- und Nachlassverfahren über Banken sind seit 1. Juli 2004 in den Art. 33–37g des Bankengesetzes (SR 952.0) geregelt.',
    ]) {
      expect(parseFussnoteHistorie(fn(t)).ereignisse.some((e) => e.typ === 'gegenstandslos')).toBe(false);
    }
  });

  it('Artikelebene (StGB 67f): gegenstandslos = { seit }, NICHT aufgehobenSeit und NICHT giltSeit «In Kraft»', () => {
    const { historie } = baueArtikelHistorie([fn(STGB_67F)]);
    expect(historie?.gegenstandslos).toEqual({ seit: '2018-01-01' });
    expect(historie?.aufgehobenSeit).toBeUndefined();
    expect(historie?.giltSeit).toBeNull();
  });

  it('Artikelebene undatiert (OR SchlT 6): gegenstandslos = { seit: null }', () => {
    expect(baueArtikelHistorie([fn('Gegenstandslos.')]).historie?.gegenstandslos).toEqual({ seit: null });
  });

  it('Teil-Skopus (Absatz/lit.) macht den Artikel NICHT gegenstandslos', () => {
    const { historie } = baueArtikelHistorie([fn('Gegenstandslos. Siehe Art. 75 Abs. 5 des Finanzinstitutsgesetzes vom 15. Juni 2018 (SR 954.1).', { absatz: '2', item: 'a' })]);
    expect(historie?.gegenstandslos).toBeUndefined();
    expect(historie?.ereignisse).toHaveLength(1);
  });

  it('Körper lebend (Kopf-Anker mehrdeutig) oder spätere Textänderung widerlegt die Ganz-Aussage (wie bei aufgehobenSeit)', () => {
    expect(baueArtikelHistorie([fn(STGB_67F)], { koerperLebend: true }).historie?.gegenstandslos).toBeUndefined();
    const spaeter = baueArtikelHistorie([fn(STGB_67F), fn('Fassung gemäss Ziff. I des BG vom 1. Jan. 2020, in Kraft seit 1. Jan. 2021 (AS 2020 1).')]);
    expect(spaeter.historie?.gegenstandslos).toBeUndefined();
  });

  it('Aufhebung bleibt Aufhebung: «Aufgehoben durch …» setzt aufgehobenSeit, nie gegenstandslos (§1: zwei Fälle, keine Abstraktion)', () => {
    const { historie } = baueArtikelHistorie([fn('Aufgehoben durch Ziff. I des BG vom 16. Dez. 2005, mit Wirkung seit 1. Jan. 2008 (AS 2006 2197).')]);
    expect(historie?.aufgehobenSeit).toBe('2008-01-01');
    expect(historie?.gegenstandslos).toBeUndefined();
  });
});

describe('Fassungs-Etikett: «Gegenstandslos seit …» statt «Gilt seit …» (Leser-Wort, §5)', () => {
  const h = (extra: Partial<ArtikelHistorie>): ArtikelHistorie => ({ giltSeit: null, ereignisse: [], ...extra });

  it('datiert → «Gegenstandslos seit 1. Jan. 2018»-Form in Marke UND Schild', () => {
    const hist = h({ gegenstandslos: { seit: '2018-01-01' } });
    expect(fassungsMarkeEtikett(hist)).toMatch(/^Gegenstandslos seit /);
    expect(fassungsSchild(hist)).toMatch(/^Gegenstandslos seit /);
    expect(fassungsSchild(hist)).not.toMatch(/Gilt seit/);
  });

  it('undatiert → «Gegenstandslos» ohne erfundenes Datum', () => {
    const hist = h({ gegenstandslos: { seit: null } });
    expect(fassungsMarkeEtikett(hist)).toBe('Gegenstandslos');
    expect(fassungsSchild(hist)).toBe('Gegenstandslos');
  });

  it('Rangfolge: «Gegenstandslos seit …» geht vor «Gilt seit …» (giltSeit 2011 + gegenstandslos 2018), in Marke UND Schild', () => {
    const hist = h({ giltSeit: '2011-01-01', gegenstandslos: { seit: '2018-01-01' } });
    expect(fassungsMarkeEtikett(hist)).toMatch(/^Gegenstandslos seit .*2018/);
    expect(fassungsSchild(hist)).toMatch(/^Gegenstandslos seit .*2018/);
    expect(fassungsSchild(hist)).not.toMatch(/Gilt seit/);
    // undatiert gegenstandslos schlägt ein vorhandenes giltSeit ebenso (kein «Gilt seit» für einen gegenstandslosen Artikel)
    expect(fassungsSchild(h({ giltSeit: '2011-01-01', gegenstandslos: { seit: null } }))).toBe('Gegenstandslos');
  });

  it('aufgehoben geht vor gegenstandslos; ohne beides bleibt «Gilt seit …»', () => {
    expect(fassungsSchild(h({ aufgehobenSeit: '2008-01-01', gegenstandslos: { seit: '2018-01-01' } }))).toMatch(/^Aufgehoben seit /);
    expect(fassungsSchild(h({ giltSeit: '2017-01-01' }))).toMatch(/^Gilt seit /);
  });
});

describe('Korpus-Konsistenz (§5): Historie-Shard ⇔ Normtext-Flag «gegenstandslos»', () => {
  const wurzel = resolve(__dirname, '../..');
  const TEXT = resolve(wurzel, 'public/normtext/bund');
  const HIST = resolve(wurzel, 'public/normtext/historie');

  it('jeder Artikel mit Snapshot-Flag `gegenstandslos` trägt im Historie-Shard `gegenstandslos`, und umgekehrt', () => {
    const snapshot = new Set<string>();
    for (const f of readdirSync(TEXT).filter((x) => x.endsWith('.json'))) {
      const doc = JSON.parse(readFileSync(resolve(TEXT, f), 'utf8')) as { eintraege?: Array<{ id: string; gegenstandslos?: true }> };
      for (const e of doc.eintraege ?? []) if (e.gegenstandslos === true) snapshot.add(`${f.replace(/\.json$/, '')}:${tokenAusId(e.id)}`);
    }
    const historie = new Set<string>();
    for (const f of readdirSync(HIST).filter((x) => x.endsWith('.json'))) {
      const doc = JSON.parse(readFileSync(resolve(HIST, f), 'utf8')) as { artikel?: Record<string, ArtikelHistorie> };
      for (const [token, a] of Object.entries(doc.artikel ?? {})) if (a.gegenstandslos) historie.add(`${f.replace(/\.json$/, '')}:${token}`);
    }
    expect([...snapshot].sort()).toEqual([...historie].sort());
    expect(snapshot.size).toBeGreaterThan(0);
  });
});
