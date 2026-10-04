// HN-05-Auflage (W2·27-BUND-FERTIG P6): Fussnoten an einer Ziffer-Überschrift (BV Art. 197 fn 162
// «2.¹⁶² Übergangsbestimmung …»). ArtikelBody rendert an einem titel-Block keinen Marker-Slot —
// ein Marker, der über `absatzIndex` auf die Überschrift geroutet würde, verschwände ersatzlos.
// Er bleibt wie vor P6 auf der Artikelebene (sichtbar, §1/§8).
import { describe, expect, it } from 'vitest';
import { verteileFussnoten } from '../pages/gesetz-leser/parts/ArtikelLeser.fussnoten';
import type { NormSnapshot } from '../lib/normtext/typen';

const bloecke: NormSnapshot['bloecke'] = [
  { absatz: null, text: '2. Übergangsbestimmung zu Art. 62 (Schulwesen)', titel: 3, ziffer: '2' },
  { absatz: null, text: 'Die Kantone übernehmen die Leistungen.', ziffer: '2' },
];

describe('verteileFussnoten — Fussnote an der Ziffer-Überschrift', () => {
  it('geht NICHT an den titel-Block (kein Marker-Slot), sondern auf die Artikelebene', () => {
    const v = verteileFussnoten(
      [{ nr: '162', text: 'Angenommen in der Volksabstimmung.', links: [], absatz: null, absatzIndex: 0, pos: { b: 0, o: 2, l: 46 } }],
      bloecke,
    );
    expect(v.fnProAbsatz[0]).toBeUndefined();
    expect(v.fnInlineAbsatz[0]).toBeUndefined();
    expect(v.fnArtikelEbene).toEqual(['162']);
  });

  it('eine Fussnote im Inhaltsblock der Ziffer wird weiter am Block verteilt', () => {
    const v = verteileFussnoten([{ nr: '163', text: 'AS 2007 5765', links: [], absatz: null, absatzIndex: 1 }], bloecke);
    expect(v.fnProAbsatz[1]).toEqual(['163']);
    expect(v.fnArtikelEbene).toEqual([]);
  });
});
