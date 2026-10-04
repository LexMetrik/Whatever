// W2·17-UI-BEFUNDE E-D4-B03/B04 (1.10.2026): Tabellenzellen bekommen den Tausender-
// Apostroph nur auf Mengen — nie auf Jahre, Daten, Rechtsakt-Nummern, Nachkommastellen.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import { gruppiereZelle, istJahrSpalte } from '../components/normtext/tarifText';
import type { NormSnapshot } from '../lib/normtext/typen';

const zellen = (html: string): string[] =>
  [...html.matchAll(/role="cell"[^>]*>([^<]*)</g)].map((m) => m[1].replace(/&#x27;/g, "'"));

function rendere(mehrspaltig: unknown): string[] {
  const bloecke = [{ absatz: null, text: '', mehrspaltig }] as unknown as NormSnapshot['bloecke'];
  return zellen(renderToStaticMarkup(<ArtikelBody bloecke={bloecke} artikel="4" passus={{ absatz: null }} />));
}

describe('gruppiereZelle — Jahre/Daten/Nummern geschützt, Mengen weiter gruppiert', () => {
  it('Daten und Monatsangaben behalten das Jahr', () => {
    expect(gruppiereZelle('31.01.2022')).toBe('31.01.2022');
    expect(gruppiereZelle('8. März 1960')).toBe('8. März 1960');
    expect(gruppiereZelle('Convention de La Haye du 5 octobre 1961)')).toBe('Convention de La Haye du 5 octobre 1961)');
    expect(gruppiereZelle('gemäss Beschluss vom Juli 2003')).toBe('gemäss Beschluss vom Juli 2003');
  });

  it('Rechtsakt-Nummern «2003/37/EG», «Nr. 167/2013»', () => {
    expect(gruppiereZelle('Richtlinie 2003/37/EG')).toBe('Richtlinie 2003/37/EG');
    expect(gruppiereZelle('Verordnung (EU) Nr. 167/2013')).toBe('Verordnung (EU) Nr. 167/2013');
  });

  it('Nachkommastellen werden nie gruppiert (BL-331 § 27ter)', () => {
    expect(gruppiereZelle('0,192963 %')).toBe('0,192963 %');
    expect(gruppiereZelle('51,65 %')).toBe('51,65 %');
  });

  it('Mengen bleiben gruppiert (Verhalten unverändert)', () => {
    expect(gruppiereZelle('22 050')).toBe("22'050");
    expect(gruppiereZelle('bis 5000')).toBe("bis 5'000");
    expect(gruppiereZelle('1000–2000')).toBe("1'000–2'000");
    expect(gruppiereZelle('Fr. 5000 vom 8. März 1960')).toBe("Fr. 5'000 vom 8. März 1960");
    expect(gruppiereZelle('110 818 636')).toBe("110'818'636");
  });

  it('istJahrSpalte: nur Spalten, deren Zellen alle Jahre sind', () => {
    expect(istJahrSpalte(['1994', '1993', '', '2003 B'])).toBe(true);
    expect(istJahrSpalte(['2000', '5000'])).toBe(false);
    expect(istJahrSpalte(['2000'])).toBe(false);
  });
});

describe('KanonischeTabelle (spalten-Modell) — E-D4-B03', () => {
  it('ERV Anhang 1: Referenzdatum «31.01.2022» ohne Apostroph im Jahr', () => {
    const z = rendere({
      spalten: [{ typ: 'text', titel: 'Name' }, { typ: 'zahl', titel: 'Referenzdatum' }],
      zeilen: [['Alpha', '31.01.2022'], ['Beta', '30.06.2021']],
    });
    expect(z).toContain('31.01.2022');
    expect(z).toContain('30.06.2021');
  });

  it('EAUE: Jahres-Spalten ohne Titel «1994» bleiben «1994»', () => {
    const z = rendere({
      spalten: [{ typ: 'text', titel: 'Staaten' }, { typ: 'zahl', titel: '' }],
      zeilen: [['Dänemark', '1994'], ['Frankreich', '1993']],
    });
    expect(z).toEqual(['Dänemark', '1994', 'Frankreich', '1993']);
  });

  it('BVV 2 Art. 62c: «Jahrgang 1942» bleibt, Beträge in Nachbarspalte bleiben gruppiert', () => {
    const z = rendere({
      spalten: [{ typ: 'zahl', titel: 'Jahrgang' }, { typ: 'zahl', titel: 'Franken' }],
      zeilen: [['1942', '22 050'], ['1943', '22 680']],
    });
    expect(z).toEqual(['1942', "22'050", '1943', "22'680"]);
  });

  it('VVEA: Kennzahl-Spalte «Code» wird nie gruppiert, Mengen in anderer Spalte schon', () => {
    const z = rendere({
      spalten: [{ typ: 'zahl', titel: 'Code' }, { typ: 'zahl', titel: 'Grenzwert in mg/kg' }],
      zeilen: [['1101', '1000'], ['1102', '5000']],
    });
    expect(z).toEqual(['1101', "1'000", '1102', "5'000"]);
  });
});

describe('LegacyMehrspaltigeTabelle (kopf/zeilen) — E-D4-B04', () => {
  it('Geltungsbereich: Jahres-Spalte «1996 B», «2003» bleibt ohne Apostroph', () => {
    const z = rendere({
      kopf: ['Staat', 'Ratifikation'],
      zeilen: [['Albanien', '2003 B'], ['Andorra', '1996'], ['Belgien', '1985 N']],
    });
    expect(z).toEqual(['Albanien', '2003 B', 'Andorra', '1996', 'Belgien', '1985 N']);
  });

  it('Prosa-Zelle mit Datum: «8. März 1960» bleibt, Betrag daneben gruppiert', () => {
    const z = rendere({
      kopf: ['Text', 'Betrag'],
      zeilen: [['Übereinkommen vom 8. März 1960', '5000'], ['Übrige', '1250']],
    });
    expect(z).toEqual(['Übereinkommen vom 8. März 1960', "5'000", 'Übrige', "1'250"]);
  });

  it('Tarif-Spalte mit zufälligem «2000» wird weiter gruppiert (kein Jahres-Fehlalarm)', () => {
    const z = rendere({
      kopf: ['Streitwert', 'Gebühr'],
      zeilen: [['bis 1000', '2000'], ['bis 5000', '5000']],
    });
    expect(z).toEqual(['bis 1' + "'" + '000', "2'000", 'bis 5' + "'" + '000', "5'000"]);
  });
});
