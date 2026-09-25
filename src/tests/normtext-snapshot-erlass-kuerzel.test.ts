/**
 * HN-04 (QS-KORPUS, 25.9.2026) — Erlass-Kürzel aus dem Register statt aus der
 * gestrichenen `ERLASS_MAP`.
 *
 * ANLASS. Befund VS-01 (`pruefung-herz-nieren-2026-09-24`): `normtext-snapshot.ts`
 * führte eine eigene `ERLASS_MAP` (171 Einträge, deckungsgleich mit dem Register
 * `src/lib/normtext/register.ts`, §5-Verstoss — zweite Pflegestelle für denselben
 * Fachinhalt); für ~60 nicht gepflegte Namen griff ein Rückfall `toUpperCase()`,
 * der bei 37 Bundeserlassen ein amtlich FALSCHES Kürzel erzeugte («DESG» statt
 * «DesG»). Fix: das Kürzel kommt jetzt ausschliesslich aus `ERLASS_REGISTER`
 * (`bundKuerzelNachschlagen`); ein Name ohne Register-Eintrag ist ein Build-Fehler
 * statt eines geratenen Kürzels (§2/§8).
 *
 * ROT-BEWEIS (§6.7): Test 1 zeigt, dass die alte Verhaltensweise (stiller
 * toUpperCase-Rückfall statt Fehler) durch diesen Test durchgefallen wäre.
 */
import { describe, it, expect } from 'vitest';
import { bundKuerzelNachschlagen } from '../../scripts/normtext-snapshot';
import { ERLASS_REGISTER } from '../lib/normtext/register';

describe('HN-04: bundKuerzelNachschlagen — Register statt ERLASS_MAP', () => {
  it('Rot-Beweis: Name ohne Register-Kürzel wirft einen Fehler statt zu raten', () => {
    const leeresRegister = new Map<string, string>();
    // Die alte Logik hätte hier still 'UNBEKANNTER_ERLASS' (toUpperCase-Rückfall)
    // zurückgegeben; die neue Logik MUSS werfen (§2/§8: nie raten).
    expect(() => bundKuerzelNachschlagen('UNBEKANNTER_ERLASS', leeresRegister)).toThrow(
      /Kein Register-Kürzel für "UNBEKANNTER_ERLASS"/,
    );
  });

  it('liefert das Kürzel aus einem injizierten Register (reine Funktion, kein Datei-/Netzzugriff)', () => {
    const fakeRegister = new Map([['TESTG', 'TestG']]);
    expect(bundKuerzelNachschlagen('TESTG', fakeRegister)).toBe('TestG');
  });

  it('nutzt ohne zweites Argument das reale ERLASS_REGISTER (ebene bund)', () => {
    // OR ist sowohl key als auch amtliches Kürzel — deckt den häufigen Fall ab,
    // in dem key.toUpperCase() zufällig bereits korrekt wäre.
    expect(bundKuerzelNachschlagen('OR')).toBe('OR');
  });

  // Alle 37 durch HN-04 geänderten Bundeserlasse (Spec-Beispiele +
  // Ergänzung), gegen das ECHTE ERLASS_REGISTER — belegt zugleich, dass die
  // Fachänderung im Snapshot-Generator ankommt, nicht nur in der Testdouble.
  // Herkunft je Kürzel (Gegenprüfung HN-04, 25.9.2026, Fedlex-HTML + SPARQL titleShort):
  // «amtlich» = Fedlex führt die Abkürzung (titleShort, Erlass-Kurztitel oder Ingress
  // eines Ausführungsgesetzes: HKÜ/HEsÜ über BG-KKE, HAÜ über BG-HAÜ SR 211.221.31);
  // «Hand-Kürzel» = Fedlex führt keine Abkürzung, das Register-Kürzel ist
  // Hauskonvention (bibliothek/recherche/fedlex-abkuerzungen-titleshort.md).
  type Herkunft = 'amtlich' | 'Hand-Kürzel';
  const stichprobe: ReadonlyArray<[gesetzKey: string, altRueckfall: string, neuRegister: string, herkunft: Herkunft]> = [
    ['DESG', 'DESG', 'DesG', 'amtlich'],
    ['BOEB', 'BOEB', 'BöB', 'amtlich'],
    ['FINFRAG', 'FINFRAG', 'FinfraG', 'amtlich'],
    ['APOSTILLE', 'APOSTILLE', 'Apostille-Übk.', 'Hand-Kürzel'],
    ['HAUE', 'HAUE', 'HAÜ', 'amtlich'],
    ['VSTG', 'VSTG', 'VStG', 'amtlich'],
    ['FUSG', 'FUSG', 'FusG', 'amtlich'],
    ['MSCHG', 'MSCHG', 'MSchG', 'amtlich'],
    ['PATG', 'PATG', 'PatG', 'amtlich'],
    ['BUEG', 'BUEG', 'BüG', 'amtlich'],
    ['BGOE', 'BGOE', 'BGÖ', 'amtlich'],
    ['PUBLG', 'PUBLG', 'PublG', 'amtlich'],
    ['PARLG', 'PARLG', 'ParlG', 'amtlich'],
    ['STBOG', 'STBOG', 'StBOG', 'amtlich'],
    ['ENTG', 'ENTG', 'EntG', 'amtlich'],
    ['GSCHG', 'GSCHG', 'GSchG', 'amtlich'],
    ['ENTSG', 'ENTSG', 'EntsG', 'amtlich'],
    ['WAG', 'WAG', 'WaG', 'amtlich'],
    ['PUEG', 'PUEG', 'PüG', 'amtlich'],
    ['LUGUE', 'LUGUE', 'LugÜ', 'amtlich'],
    ['HZUE', 'HZUE', 'HZÜ', 'Hand-Kürzel'],
    ['HBEWUE', 'HBEWUE', 'HBewÜ', 'Hand-Kürzel'],
    ['HKUE', 'HKUE', 'HKÜ', 'amtlich'],
    ['UNO_PAKT_II', 'UNO_PAKT_II', 'UNO-Pakt II', 'Hand-Kürzel'],
    ['UNO_PAKT_I', 'UNO_PAKT_I', 'UNO-Pakt I', 'Hand-Kürzel'],
    ['UNO_ANTIFOLTER', 'UNO_ANTIFOLTER', 'UN-Antifolterkonvention', 'Hand-Kürzel'],
    ['HEUE', 'HEUE', 'HEsÜ', 'amtlich'],
    ['PVUE', 'PVUE', 'PVÜ', 'Hand-Kürzel'],
    ['ICAO', 'ICAO', 'ICAO-Übk.', 'Hand-Kürzel'],
    ['STAATENLOSE', 'STAATENLOSE', 'Staatenlose', 'Hand-Kürzel'],
    ['HKSUE96', 'HKSUE96', 'HKsÜ', 'amtlich'],
    ['HUVUE', 'HUVUE', 'HUVÜ', 'Hand-Kürzel'],
    ['EAUE', 'EAUE', 'EAUe', 'Hand-Kürzel'],
    ['MONTREAL', 'MONTREAL', 'Montrealer Übk.', 'Hand-Kürzel'],
    ['RBUE', 'RBUE', 'RBÜ', 'Hand-Kürzel'],
    ['UNO_BRK', 'UNO_BRK', 'UNO-BRK', 'Hand-Kürzel'],
    ['ISTANBUL', 'ISTANBUL', 'Istanbul-Konv.', 'Hand-Kürzel'],
  ];

  it.each(stichprobe)(
    '%s: alter toUpperCase-Rückfall "%s" → Register-Kürzel "%s" (%s)',
    (gesetzKey, altRueckfall, neuRegister) => {
      const kuerzel = bundKuerzelNachschlagen(gesetzKey);
      expect(kuerzel).toBe(neuRegister);
      expect(kuerzel).not.toBe(altRueckfall);
    },
  );

  it('Aufschlüsselung der 37: 22 amtlich, 15 Hand-Kürzel (Gegenprüfung HN-04)', () => {
    expect(stichprobe).toHaveLength(37);
    expect(stichprobe.filter((z) => z[3] === 'amtlich')).toHaveLength(22);
    expect(stichprobe.filter((z) => z[3] === 'Hand-Kürzel')).toHaveLength(15);
  });

  it('jeder Bund-Eintrag im ERLASS_REGISTER ist über bundKuerzelNachschlagen erreichbar (keine Lücke)', () => {
    const bundEintraege = ERLASS_REGISTER.filter((e) => e.ebene === 'bund');
    expect(bundEintraege.length).toBeGreaterThan(0);
    for (const e of bundEintraege) {
      expect(bundKuerzelNachschlagen(e.key)).toBe(e.kuerzel);
    }
  });
});
