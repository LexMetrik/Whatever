// W2·17-UI-BEFUNDE E-D4-B01/B02 + E-D1-B03/E-D4-B05 (1.10.2026): Tarif-Aufbereitung
// im Gesetzesleser darf Wortlaut und Gliederung nicht verschieben.
import { describe, expect, it } from 'vitest';
import { normalisiereTarifText, staffelZeilen } from '../components/normtext/tarifText';

// BS-952.200 § 22 (gekürzt, Wortlaut unverändert): Tabellenzeilen stehen als
// « — »-getrennte Gliederungsabschnitte («— ab) …») im EINEN Fliesstext.
const BS_952_200_P22 =
  '2. Gebühren für Übermasse: — a) Länge: — aa) bis 30,00 m · Einzelbewilligung CHF: 30 · Dauerbewilligung CHF: 300 — ' +
  'ab) über 30,00 m · Einzelbewilligung CHF: 50 · Dauerbewilligung CHF: - — ' +
  'ac) vorderer Überhang über 3,00 m · Einzelbewilligung CHF: 50 · Dauerbewilligung CHF: 500 — ' +
  'ad) hinterer Überhang über 5,00 m · Einzelbewilligung CHF: 50 · Dauerbewilligung CHF: 500 — ' +
  'b) Breite: — ba) bis 3,50 m · Einzelbewilligung CHF: 50 — bb) 3,51 bis 4,00 m · Einzelbewilligung CHF: 80 — ' +
  '1. a) Grundgebühr für Ausnahmefahrzeuge · Einzelbewilligung CHF: 50';

describe('E-D4-B01 staffelZeilen Regel 1 — keine Litera in der falschen Zeile', () => {
  it('Text mit eigenen Gliederungsmarken «— ab) …» wird NICHT an «über N» zerschnitten', () => {
    expect(staffelZeilen(BS_952_200_P22)).toBeNull();
  });

  it('Regression: echte Gerichtsgebühren-Staffel (ZH GebV OG) wird weiter zeilenweise getrennt', () => {
    const zh = 'Die Gebühren betragen bei einem Streitwert bis 1000 25 % über 1000 bis 5000 250 über 5000 bis 10000 400';
    const z = staffelZeilen(zh);
    expect(z).not.toBeNull();
    expect(z!.length).toBeGreaterThanOrEqual(3);
    expect(z!.join(' ')).toBe(zh);
  });
});

describe('E-D4-B02 staffelZeilen Regel 3 — «plus N ‰ vom Mehrbetrag über» ist EIN Band', () => {
  it('OW-213.61 § 6 Abs. 1: ein einziges Band → keine Tabelle (nicht in «plus 1 ‰» | «vom Mehrbetrag …» zerrissen)', () => {
    const t = 'Für die Übertragung des Eigentums beträgt die Gebühr 1,5 ‰ bis Fr. 1 000 000.–, plus 1 ‰ vom Mehrbetrag über Fr. 1 000 000.– der Vertragssumme, pro Handänderung aber mindestens Fr. 100.–.';
    expect(staffelZeilen(t)).toBeNull();
  });

  it('LU-3870 § 29 lit. d: «* plus 0,5 ‰ vom Mehrbetrag …» wie die Geschwister lit. b/c — keine Tabelle', () => {
    expect(staffelZeilen('* plus 0,5 ‰ vom Mehrbetrag über Fr. 5 000 000.– bis Fr. 10 000 000.–')).toBeNull();
    expect(staffelZeilen('plus 1,25 ‰ vom Mehrbetrag über Fr. 500 000.– bis Fr. 1 000 000.–')).toBeNull();
  });

  it('mehrere «plus N ‰ vom Mehrbetrag über»-Bänder: je Band EINE Zeile, Wortlaut vollständig', () => {
    const t = 'Gebühr 2 ‰ bis Fr. 500 000.–, plus 1,25 ‰ vom Mehrbetrag über Fr. 500 000.–, plus 0,75 ‰ vom Mehrbetrag über Fr. 1 000 000.–';
    const z = staffelZeilen(t);
    expect(z).toEqual([
      'Gebühr 2 ‰ bis Fr. 500 000.–,',
      'plus 1,25 ‰ vom Mehrbetrag über Fr. 500 000.–,',
      'plus 0,75 ‰ vom Mehrbetrag über Fr. 1 000 000.–',
    ]);
  });

  it('Regression BS-292.400 § 11: reine «vom Mehrbetrag über»-Staffel teilt weiter', () => {
    const t = 'Gebühr bis CHF 2 Mio. 0,25 %, vom Mehrbetrag über CHF 2 Mio. 0,2 %, vom Mehrbetrag über CHF 5 Mio. 0,1 %';
    expect(staffelZeilen(t)).toEqual([
      'Gebühr bis CHF 2 Mio. 0,25 %,',
      'vom Mehrbetrag über CHF 2 Mio. 0,2 %,',
      'vom Mehrbetrag über CHF 5 Mio. 0,1 %',
    ]);
  });
});

describe('E-D1-B03 / E-D4-B05 normalisiereTarifText — chemische Formeln und Einheiten bleiben', () => {
  it('«CO2-Emissionsrechte» (BS-786.310 § 4.2.2) bleibt wortgleich', () => {
    expect(normalisiereTarifText('Handel mit CO2-Emissionsrechten und PM10 in m2')).toBe('Handel mit CO2-Emissionsrechten und PM10 in m2');
  });

  it('verschmolzene PDF-Tarifzahlen werden weiter getrennt', () => {
    expect(normalisiereTarifText('Allgemeinen1.1.1 Verkehrswert1‰4.1 mindestens100')).toBe('Allgemeinen 1.1.1 Verkehrswert 1‰ 4.1 mindestens 100');
  });
});
