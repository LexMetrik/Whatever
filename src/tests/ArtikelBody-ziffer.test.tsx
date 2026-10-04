// HN-05-Auflage (W2·27-BUND-FERTIG P6): Zitierform und Hervorhebung der Ziffer-Ebene.
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import type { NormSnapshot } from '../lib/normtext/typen';

const bv: NormSnapshot['bloecke'] = [
  { absatz: null, text: '1. Beitritt der Schweiz zur UNO', titel: 3, ziffer: '1' },
  { absatz: '1', text: 'Die Schweiz tritt der UNO bei.', ziffer: '1' },
  { absatz: null, text: '9. Übergangsbestimmungen zu Art. 75b', titel: 3, ziffer: '9' },
  { absatz: '1', text: 'Tritt die Gesetzgebung nicht in Kraft, erlässt der Bundesrat Verordnungen.', ziffer: '9' },
  {
    absatz: '2', text: 'Baubewilligungen sind nichtig:', ziffer: '9',
    items: [{ marke: 'a', text: 'erste Voraussetzung;' }, { marke: 'b', text: 'zweite Voraussetzung.' }],
  },
];
const zk = { artikelLabel: 'Art. 197', kuerzel: 'BV' };
const render = (ziff: string) =>
  renderToString(<ArtikelBody bloecke={bv} artikel="197" passus={{ absatz: null, ziff }} zitierKontext={zk} />);

describe('ArtikelBody — Ziffer-Ebene', () => {
  it('Zitat der Absatz-Marke trägt die Ziffer: «Art. 197 Ziff. 9 Abs. 1 BV» statt des mehrdeutigen «Abs. 1»', () => {
    const o = render('9');
    expect(o).toContain('Art. 197 Ziff. 9 Abs. 1 BV');
    expect(o).toContain('Art. 197 Ziff. 1 Abs. 1 BV');
    expect(o).not.toContain('Art. 197 Abs. 1 BV');
  });

  it('Zitat einer lit. trägt Ziffer und Absatz: «Art. 197 Ziff. 9 Abs. 2 lit. b BV»', () => {
    expect(render('9')).toContain('Art. 197 Ziff. 9 Abs. 2 lit. b BV');
  });

  it('Ziffer 9 zitiert: nur ihre beiden Absatz-Blöcke sind markiert, der Absatz 1 der Ziffer 1 nicht', () => {
    const o = render('9');
    expect((o.match(/data-passus="true"/g) ?? []).length).toBe(2);
  });
});
