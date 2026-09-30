/**
 * W2·27-BUND-FERTIG (30.9.2026) · Nachzug Prüfer-Auflagen A1–A3 zu PR #1201 («…»-Anzeige).
 *
 * A1 — der amtliche WORTLAUT «Aufgehoben» (kein «…»-Platzhalter, kein Feld) bleibt «aufgehoben»
 *      (Quelle, nicht Platzhalter; davon hängen 340 Kantonsartikel ab). Nur der «…»-Platzhalter
 *      eines ganz unbelegten Artikels wird zu «kein Text im Snapshot».
 * A2 — Label in Name (WCAG 2.5.3): das sichtbare Wort «gegenstandslos» am Baum-Zweig steht auch
 *      im zugänglichen Namen (title/aria-label) — wie im Artikel-Index. Die Kette
 *      Datenfeld → Baum-Zeile (`gliederungsArtikel`) → Sichtbar + Name ist je einzeln gebunden.
 * A3 — SynopseKarte trifft dieselbe Entscheidung wie ArtikelBody (EIN Helfer, `leerstellenAnzeige.ts`).
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import { SynopseKarte } from '../components/entstehung/SynopseKarte';
import { SektionBaumTOC } from '../pages/gesetz-leser/parts/SektionBaumTOC';
import { artikelSchluessel } from '../pages/gesetz-leser/klappKarte';
import { haengeArtikelZeilen } from '../pages/gesetz-leser/gliederungsArtikel';
import type { DirektArtikel } from '../pages/gesetz-leser/gliederungsArtikel';
import type { GliederungsKnoten } from '../pages/gesetz-leser/gliederungsTypen';
import type { LeerstellenStatus } from '../lib/normtext/darstellung';
import type { SynopseLage } from '../lib/entstehung/synopse-diff';
import type { SynopseShard } from '../lib/entstehung/synopse';
import type { NormSnapshot } from '../lib/normtext/typen';

const KURZ = 'kein Text im Snapshot';

const koerperWorte = (html: string) =>
  [...html.matchAll(/<span[^>]*class="italic text-ink-500"[^>]*>([^<]*)<\/span>/g)].map((m) => m[1]);

const body = (bloecke: NormSnapshot['bloecke']) =>
  renderToStaticMarkup(<ArtikelBody bloecke={bloecke} artikel="2" passus={{ absatz: null }} />);

describe('A1 — ArtikelBody: amtlicher Wortlaut «Aufgehoben» ist Quelle, kein Platzhalter', () => {
  it('Einzelblock «Aufgehoben», kein Feld ⇒ «aufgehoben» (nicht «kein Text im Snapshot»)', () => {
    const out = body([{ absatz: null, text: 'Aufgehoben' }]);
    expect(koerperWorte(out)).toEqual(['aufgehoben']);
    expect(out).not.toContain(KURZ);
  });

  it('Varianten des Wortlauts («Aufgehoben.», «aufgehoben») bleiben «aufgehoben»', () => {
    for (const t of ['Aufgehoben.', 'aufgehoben', '  Aufgehoben  ']) {
      const out = body([{ absatz: null, text: t }]);
      expect(koerperWorte(out), t).toEqual(['aufgehoben']);
    }
  });

  it('gemischt ohne Feld: «…» ⇒ kein Text im Snapshot, «Aufgehoben» ⇒ aufgehoben (je Block)', () => {
    const out = body([{ absatz: '1', text: '…' }, { absatz: '2', text: 'Aufgehoben' }]);
    expect(koerperWorte(out)).toEqual([KURZ, 'aufgehoben']);
  });
});

describe('A3 — SynopseKarte: dieselbe Wortlaut-Sperre wie ArtikelBody', () => {
  const shard = {
    erlass: 'EPV', eli: 'cc/x', normProfil: 'p/1', erzeugt: '2026-09-30', fensterAb: '2021-01-01',
    kuenftigeStaende: [], staende: [], schritte: [],
  } as unknown as SynopseShard;
  type Bl = [absatz: string, num: string, text: string];
  const lage = (neuBloecke: Bl[], altBloecke: Bl[] = [['', '', 'Früherer Wortlaut des Artikels.']]) => ({
    art: 'vergleich',
    treffer: {
      schritt: { von: '2021-01-01', bis: '2024-01-01', artikel: [] },
      artikel: {
        eId: 'art_2', token: '2', label: 'Art. 2', art: 'geaendert', zustand: 'ereignis', shaNorm: 'a'.repeat(64),
        alt: altBloecke,
      },
      neu: neuBloecke,
      neuHerkunft: 'geltend',
      mehrdeutig: false,
    },
  } as unknown as SynopseLage);
  const einzeln = (texte: string[]): Bl[] => texte.map((t) => ['', '', t]);
  const karte = (neuText: string[], zustand: LeerstellenStatus) => renderToStaticMarkup(
    <SynopseKarte lage={lage(einzeln(neuText))} shard={shard} geltend={{ stand: '2026-06-12' }} zustand={zustand} id="x" />);

  it('rechte Spalte «Aufgehoben» (Wortlaut), Zustand leer-ungeklaert ⇒ «aufgehoben», nie «kein Text im Snapshot»', () => {
    const out = karte(['Aufgehoben'], 'leer-ungeklaert');
    expect(out).toContain('— aufgehoben');
    expect(out).toContain('>aufgehoben<');
    expect(out).not.toContain(`>${KURZ}<`);
    expect(out).not.toContain(`— ${KURZ}`);
  });

  it('Gegenprobe: «…» bleibt «kein Text im Snapshot» (PR #1201 unverändert)', () => {
    const out = karte(['…'], 'leer-ungeklaert');
    expect(out).toContain(`— ${KURZ}`);
    expect(out).toContain(`>${KURZ}<`);
  });

  /** Die Entfall-Wörter je `entfernt`-Zeile (Zeilenmarke) — der Prüfer-Repro (B1) braucht ECHTE Entfall-Zeilen. */
  const zeilenWorte = (html: string) =>
    [...html.matchAll(/data-synopse-zeile="entfernt"[\s\S]*?<span class="text-ink-500">([^<]*)<\/span>/g)].map((m) => m[1]);
  const karteMit = (alt: Bl[], neu: Bl[], zustand: LeerstellenStatus) => renderToStaticMarkup(
    <SynopseKarte lage={lage(neu, alt)} shard={shard} geltend={{ stand: '2026-06-12' }} zustand={zustand} id="x" />);

  it('B1: gemischt «…» + «Aufgehoben» ⇒ BEIDE Entfall-Zeilen «aufgehoben» (vorsichtig; die Zeile kennt ihren Block nicht)', () => {
    const out = karteMit(
      [['1', '', 'Wortlaut eins.'], ['2', '', 'Wortlaut zwei.']],
      [['1', '', '…'], ['2', '', 'Aufgehoben']],
      'leer-ungeklaert');
    expect(zeilenWorte(out)).toEqual(['aufgehoben', 'aufgehoben']);
    expect(out).not.toContain(KURZ);
  });

  it('B1: Kontrolle — beide rechts «…» ⇒ BEIDE Entfall-Zeilen «kein Text im Snapshot»', () => {
    const out = karteMit(
      [['1', '', 'Wortlaut eins.'], ['2', '', 'Wortlaut zwei.']],
      [['1', '', '…'], ['2', '', '…']],
      'leer-ungeklaert');
    expect(zeilenWorte(out)).toEqual([KURZ, KURZ]);
  });

  it('B1: rechte Seite leer (neu = []), geltend ⇒ «kein Text im Snapshot» (every über leere Liste)', () => {
    const out = karteMit([['', '', 'Früherer Wortlaut des Artikels.']], [], 'leer-ungeklaert');
    expect(zeilenWorte(out)).toEqual([KURZ]);
    expect(out).not.toContain('>aufgehoben<');
  });
});

describe('A2 — Baum-Zweig «gegenstandslos»: sichtbar UND im zugänglichen Namen (WCAG 2.5.3)', () => {
  const eintrag = (artikel: string, extra: Partial<NormSnapshot> = {}): NormSnapshot => ({
    id: `bund/STGB/art_${artikel}`, ebene: 'bund', quelle: 'STGB', erlass: 'StGB',
    artikel, artikelLabel: `Art. ${artikel}`, bloecke: [{ absatz: null, text: '…' }],
    stand: '2026-06-12', quelleUrl: `https://x#art_${artikel}`, abgerufen: '2026-09-30',
    fassungsToken: '20260612', sha: artikel, ...extra,
  });

  /** Eine Sektion mit den Artikeln 1 (lebt), 2 (aufgehoben), 3 (gegenstandslos). */
  const baum = (): GliederungsKnoten[] => {
    const sektion: GliederungsKnoten = {
      id: 'sek-1', art: 'sektion', ids: ['sek-1'], labelKette: ['1. Titel'], label: '1. Titel',
      ebene: 0, tiefe: 0, randtitel: false, kinder: [], artikelAnzahl: 3, eigeneArtikel: 3,
      gemischt: false, aufgehoben: false, anhang: false, startOffen: true,
    };
    const arts = [eintrag('1'), eintrag('2', { aufgehoben: true }), eintrag('3', { gegenstandslos: true })];
    const direkt = new Map<string, DirektArtikel>([['sek-1', { arts, randtitelBlatt: false, ohneKinder: true }]]);
    const artPos = new Map(arts.map((e, i) => [e.artikel, i]));
    const artNach = new Map(arts.map((e) => [e.artikel, e]));
    haengeArtikelZeilen([sektion], direkt, artPos, artNach, null, 'voll');
    return [sektion];
  };

  it('M6: die Artikel-Zeile trägt das Feld `gegenstandslos` aus dem Datenfeld — aufgehoben schliesst es aus', () => {
    const z = baum()[0].kinder;
    expect(z.map((k) => [k.ersterArtikel, k.aufgehoben, k.gegenstandslos === true])).toEqual([
      ['1', false, false], ['2', true, false], ['3', false, true],
    ]);
  });

  const html = () => renderToStaticMarkup(
    <SektionBaumTOC knoten={baum()} aktivPfad={[]} offen={{ 'sek-1': true, [artikelSchluessel('sek-1')]: true }} startOffeneTiefe={3}
      onToggle={() => {}} onSprung={() => {}} onSprungArtikel={() => {}} />);
  const zeile = (out: string, t: string) =>
    out.split('<li').find((s) => s.includes(`Art. ${t}</span>`)) ?? '';

  it('M4: sichtbar «gegenstandslos» am Zweig (aufgehoben: «aufgehoben»; lebend: kein Wort)', () => {
    const out = html();
    expect(zeile(out, '3')).toContain('>gegenstandslos<');
    expect(zeile(out, '2')).toContain('>aufgehoben<');
    expect(zeile(out, '1')).not.toMatch(/>(gegenstandslos|aufgehoben)</);
  });

  it('Label in Name: title UND aria-label tragen dasselbe Wort wie die Sichtbarkeit', () => {
    const z3 = zeile(html(), '3');
    expect(z3).toContain('title="Art. 3 — gegenstandslos"');
    expect(z3).toContain('aria-label="Art. 3 — gegenstandslos"');
    const z2 = zeile(html(), '2');
    expect(z2).toContain('aria-label="Art. 2 — aufgehoben"');
    const z1 = zeile(html(), '1');
    expect(z1).toContain('aria-label="Art. 1"');
    expect(z1).not.toContain('gegenstandslos');
  });
});
