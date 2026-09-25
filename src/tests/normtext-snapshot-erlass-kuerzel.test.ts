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

  // Stichprobe der 37 durch HN-04 korrigierten Bundeserlasse (Spec-Beispiele +
  // Ergänzung), gegen das ECHTE ERLASS_REGISTER — belegt zugleich, dass die
  // Fachänderung im Snapshot-Generator ankommt, nicht nur in der Testdouble.
  const stichprobe: ReadonlyArray<[gesetzKey: string, altFalsch: string, neuAmtlich: string]> = [
    ['DESG', 'DESG', 'DesG'],
    ['BOEB', 'BOEB', 'BöB'],
    ['FINFRAG', 'FINFRAG', 'FinfraG'],
    ['APOSTILLE', 'APOSTILLE', 'Apostille-Übk.'],
    ['HAUE', 'HAUE', 'HAÜ'],
    ['VSTG', 'VSTG', 'VStG'],
    ['FUSG', 'FUSG', 'FusG'],
    ['MSCHG', 'MSCHG', 'MSchG'],
    ['PATG', 'PATG', 'PatG'],
    ['BUEG', 'BUEG', 'BüG'],
    ['BGOE', 'BGOE', 'BGÖ'],
    ['PUBLG', 'PUBLG', 'PublG'],
    ['PARLG', 'PARLG', 'ParlG'],
    ['STBOG', 'STBOG', 'StBOG'],
    ['ENTG', 'ENTG', 'EntG'],
    ['GSCHG', 'GSCHG', 'GSchG'],
    ['ENTSG', 'ENTSG', 'EntsG'],
    ['WAG', 'WAG', 'WaG'],
    ['PUEG', 'PUEG', 'PüG'],
    ['LUGUE', 'LUGUE', 'LugÜ'],
    ['HZUE', 'HZUE', 'HZÜ'],
    ['HBEWUE', 'HBEWUE', 'HBewÜ'],
    ['HKUE', 'HKUE', 'HKÜ'],
    ['UNO_PAKT_II', 'UNO_PAKT_II', 'UNO-Pakt II'],
    ['UNO_PAKT_I', 'UNO_PAKT_I', 'UNO-Pakt I'],
    ['UNO_ANTIFOLTER', 'UNO_ANTIFOLTER', 'UN-Antifolterkonvention'],
    ['HEUE', 'HEUE', 'HEsÜ'],
    ['PVUE', 'PVUE', 'PVÜ'],
    ['ICAO', 'ICAO', 'ICAO-Übk.'],
    ['STAATENLOSE', 'STAATENLOSE', 'Staatenlose'],
    ['HKSUE96', 'HKSUE96', 'HKsÜ'],
    ['HUVUE', 'HUVUE', 'HUVÜ'],
    ['EAUE', 'EAUE', 'EAUe'],
    ['MONTREAL', 'MONTREAL', 'Montrealer Übk.'],
    ['RBUE', 'RBUE', 'RBÜ'],
    ['UNO_BRK', 'UNO_BRK', 'UNO-BRK'],
    ['ISTANBUL', 'ISTANBUL', 'Istanbul-Konv.'],
  ];

  it.each(stichprobe)(
    '%s: Register-Kürzel "%s" ist amtlich korrekt, NICHT mehr der alte toUpperCase-Wert "%s"',
    (gesetzKey, altFalsch, neuAmtlich) => {
      const kuerzel = bundKuerzelNachschlagen(gesetzKey);
      expect(kuerzel).toBe(neuAmtlich);
      expect(kuerzel).not.toBe(altFalsch);
    },
  );

  it('jeder Bund-Eintrag im ERLASS_REGISTER ist über bundKuerzelNachschlagen erreichbar (keine Lücke)', () => {
    const bundEintraege = ERLASS_REGISTER.filter((e) => e.ebene === 'bund');
    expect(bundEintraege.length).toBeGreaterThan(0);
    for (const e of bundEintraege) {
      expect(bundKuerzelNachschlagen(e.key)).toBe(e.kuerzel);
    }
  });
});
