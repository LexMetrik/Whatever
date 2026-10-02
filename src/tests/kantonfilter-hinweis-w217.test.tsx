// W2·17-UI-BEFUNDE · Kantonfilter zeigt, wenn die Wahl am Artikel nicht wirkt
// (Entscheid David 2.10.2026, Variante A: Verhalten bleibt, der Chip sagt es).
//
// ROT ZU BEKOMMEN (§6.7), je Mutation:
//  · `kantonenOhneWirkung`: `wirksameKantone` durch die rohe Wahl ersetzen
//    ⇒ ZH an OR 41 (Artikel führt nur BS) fehlt im Satz bzw. BS an StPO 5 steht fälschlich darin.
//  · `PanelEntscheide`: die Zeile `data-v3-panel-kanton-hinweis` weglassen ⇒ die SSR-Fälle rot.
//  · `BezugFacettenWahl`: `kantonOhneWirkung` ignorieren ⇒ der Chip-Fall rot.
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Bezug } from '../lib/rechtsprechung/bezuege';
import type { BezugStatus } from '../lib/verzahnung/facetten';
import { BezugFacettenWahl } from '../components/verzahnung/BezugFacettenWahl';
import { kantonenOhneWirkung } from '../pages/gesetz-leser/bezugAuswahl';
import { PanelEntscheide } from '../pages/gesetz-leser/v3/PanelEntscheide';
import { kantonOhneWirkungSatz } from '../pages/gesetz-leser/v3/entscheideOrdnung';

function kante(key: string, kanton: string): Bezug {
  const kantonal = kanton !== 'CH';
  return {
    key, zitierung: key, regesteKurz: null, datum: '2024-01-15', gewicht: null,
    facetten: {
      status: kantonal ? 'kantonal' : 'bge', ebene: kantonal ? 'kanton' : 'bund', kanton,
      gericht: kantonal ? `${kanton.toLowerCase()}_gericht` : 'bge', quelltyp: 'rechtsprechung',
    },
  } as unknown as Bezug;
}

const KL: BezugStatus[] = ['bge', 'bger', 'eidg', 'kantonal'];
// Wie am Korpus gemessen (2.10.2026): OR 250 führt AG/GR/BS, OR 41 und StPO 5 nur BS, BGG nur BGE.
const or250 = [kante('b1', 'CH'), kante('ag1', 'AG'), kante('gr1', 'GR'), kante('bs1', 'BS')];
const nurBS = [kante('b1', 'CH'), kante('bs1', 'BS'), kante('bs2', 'BS')];
const nurBGE = [kante('b1', 'CH'), kante('b2', 'CH')];

describe('kantonenOhneWirkung · dieselbe Quelle wie `wirksameKantone` (§5)', () => {
  it('Wahl ohne Kante am Artikel ⇒ genannt; mit Kante ⇒ nicht; keine Wahl ⇒ leer', () => {
    expect(kantonenOhneWirkung(or250, ['BE'])).toEqual(['BE']);
    expect(kantonenOhneWirkung(or250, ['BS'])).toEqual([]);
    expect(kantonenOhneWirkung(or250, [])).toEqual([]);
    expect(kantonenOhneWirkung(or250, ['BE', 'GR', 'ZH'])).toEqual(['BE', 'ZH']);
    expect(kantonenOhneWirkung(nurBGE, ['BS'])).toEqual(['BS']);
  });
});

describe('kantonOhneWirkungSatz · Sonden-Matrix (Wahl keiner/BE/ZH/BS/gemischt)', () => {
  const satz = (alle: Bezug[] | undefined, kantone: string[], o: { klassen?: BezugStatus[]; geladen?: boolean; label?: string | null } = {}) =>
    kantonOhneWirkungSatz({
      artikelLabel: o.label === undefined ? 'Art. 250' : o.label, alle, klassen: o.klassen ?? KL, kantone, geladen: o.geladen ?? true,
    });

  it('der Auftragssatz: BE an OR 250 (AG/GR/BS) ⇒ «Kein Entscheid aus BE … alle Kantone»', () => {
    expect(satz(or250, ['BE'])).toBe('Kein Entscheid aus BE zu Art. 250 – angezeigt sind alle Kantone.');
    expect(satz(or250, ['BE'], { label: null })).toBe('Kein Entscheid aus BE zu diesem Artikel – angezeigt sind alle Kantone.');
  });

  it('keine Wahl ⇒ kein Satz; Wahl mit Kante ⇒ kein Satz (auch wenn sie nichts ausblendet: StPO 5 / ZGB 8 mit BS)', () => {
    expect(satz(or250, [])).toBeNull();
    expect(satz(or250, ['BS'])).toBeNull();
    expect(satz(nurBS, ['BS'])).toBeNull();
  });

  it('ZH an einem nur-BS-Artikel (OR 41) ⇒ ZH genannt, alle Kantone angezeigt', () => {
    expect(satz(nurBS, ['ZH'])).toBe('Kein Entscheid aus ZH zu Art. 250 – angezeigt sind alle Kantone.');
  });

  it('gemischt: nur ein Teil wirkt ⇒ der Satz nennt NUR die wirkungslosen und sagt, was gilt', () => {
    expect(satz(or250, ['BE', 'GR'])).toBe('Kein Entscheid aus BE zu Art. 250 – angezeigt ist nur GR.');
    expect(satz(or250, ['BE', 'BS', 'GR', 'ZH'])).toBe('Kein Entscheid aus BE oder ZH zu Art. 250 – angezeigt sind nur BS, GR.');
    expect(satz(or250, ['BE', 'ZH'])).toBe('Kein Entscheid aus BE oder ZH zu Art. 250 – angezeigt sind alle Kantone.');
    expect(satz(or250, ['AG', 'BE', 'ZH'])).toBe('Kein Entscheid aus BE oder ZH zu Art. 250 – angezeigt ist nur AG.');
  });

  it('Artikel ohne kantonale Kante (BGG) ⇒ Satz ohne die leere Behauptung «alle Kantone angezeigt»', () => {
    expect(satz(nurBGE, ['BS'])).toBe('Kein Entscheid aus BS zu Art. 250.');
  });

  it('Klasse «kantonal» aus, nicht geladen oder nichts bekannt ⇒ nie ein Satz (§8)', () => {
    expect(satz(or250, ['BE'], { klassen: ['bge'] })).toBeNull();
    expect(satz(or250, ['BE'], { geladen: false })).toBeNull();
    expect(satz(undefined, ['BE'])).toBeNull();
    expect(satz([], ['BE'])).toBeNull();
  });
});

const basis = {
  aktArtikel: '250', revisionShard: null, normZitat: 'Art. 250 OR', artikelLabel: 'Art. 250',
  bestimmungsWort: 'Artikel' as const, klassen: KL,
  kantone: [] as string[], kantoneVerfuegbar: ['AG', 'BS', 'GR'],
  histogramm: { balken: [], ohneJahr: 0 }, bereich: { von: '', bis: '' },
  onKlassen: () => {}, onKantone: () => {}, onBereich: () => {},
};
type Props = Partial<Parameters<typeof PanelEntscheide>[0]>;
const html = (p: Props) =>
  renderToString(<MemoryRouter><PanelEntscheide {...basis} geladen {...p} /></MemoryRouter>);
const text = (h: string) => h.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');

describe('Panel «Entscheide» · der Satz steht unter der Filterzeile, ohne die Klappe zu öffnen', () => {
  it('BE gewählt, OR 250 führt AG/GR/BS ⇒ Satz da, Liste zeigt weiter alle drei', () => {
    const h = html({ kanten: or250, alleKanten: or250, kantone: ['BE'] });
    expect(h).toContain('data-v3-panel-kanton-hinweis');
    expect(text(h)).toContain('Kein Entscheid aus BE zu Art. 250 – angezeigt sind alle Kantone.');
    // der Satz steht VOR der Abdeckungszeile, also direkt unter der Filterzeile
    expect(h.indexOf('data-v3-panel-kanton-hinweis')).toBeGreaterThan(h.indexOf('data-v3-panel-filter'));
    expect(h.indexOf('data-v3-panel-kanton-hinweis')).toBeLessThan(h.indexOf('data-v3-panel-abdeckung-zeile'));
  });

  it('BS gewählt (wirkt) oder keine Wahl ⇒ kein Satz', () => {
    expect(html({ kanten: or250, alleKanten: or250, kantone: ['BS'] })).not.toContain('data-v3-panel-kanton-hinweis');
    expect(html({ kanten: or250, alleKanten: or250, kantone: [] })).not.toContain('data-v3-panel-kanton-hinweis');
  });

  it('noch nicht geladen ⇒ kein Satz (keine Aussage über einen unbekannten Bestand)', () => {
    expect(html({ kanten: undefined, alleKanten: undefined, kantone: ['BE'], geladen: false })).not.toContain('data-v3-panel-kanton-hinweis');
  });
});

describe('BezugFacettenWahl · der Chip trägt «gewählt, hier ohne Wirkung» sichtbar (§8)', () => {
  const chips = (kantoneOhneWirkung: string[]) => renderToString(
    <BezugFacettenWahl klassen={KL} kantone={['BE', 'BS']} kantoneVerfuegbar={['AG', 'BS', 'GR']}
      zahlOrt="an Art. 250" kantoneOhneWirkung={kantoneOhneWirkung} onKlassen={() => {}} onKantone={() => {}} />,
  );
  const chip = (h: string, k: string) => new RegExp(`<button[^>]*data-bezug-kanton="${k}"[^>]*>`).exec(h)?.[0] ?? '';

  it('BE ohne Wirkung ⇒ eigener Zustand mit Durchstreichung UND Wort im Titel; BS bleibt normal gewählt', () => {
    const h = chips(['BE']);
    expect(chip(h, 'BE')).toContain('data-bezug-kanton-wirkung="keine"');
    expect(chip(h, 'BE')).toContain('line-through');
    expect(chip(h, 'BE')).toContain('aria-pressed="true"');
    expect(chip(h, 'BE')).toMatch(/ohne Wirkung/);
    expect(chip(h, 'BS')).not.toContain('data-bezug-kanton-wirkung');
    expect(chip(h, 'BS')).not.toContain('line-through');
    expect(chip(h, 'AG')).not.toContain('line-through');
  });

  it('keine Kantone ohne Wirkung ⇒ kein Chip trägt den Zustand', () => {
    expect(chips([])).not.toContain('data-bezug-kanton-wirkung');
  });
});
