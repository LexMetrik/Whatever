import { describe, it, expect } from 'vitest';
import {
  normKeysVonSnapshot, sperrEntfernteNormKeys, KANTONAL_ABK_SPERRE, normKeyFuerAbk,
} from '../../scripts/normtext/entscheide-mapping';
import type { EntscheidSnapshot } from '../lib/rechtsprechung/typen';

// ─── Kantonale Namensvetter (QS-KORPUS 25.9.2026, Stichproben-Nachzug) ─────────
//
// Befund der Inhaltsprüfung: zwei neue St. Galler Urteile trugen Bundes-normKeys,
// obwohl der Text kantonale Erlasse gleichen Kürzels zitiert —
//  · VerwGer SG B 2023/207: «Art. 15-17 EntG SG» = Enteignungsgesetz SG (sGS 735.1),
//    NICHT das eidg. EntG (SR 711) → trug ENTG.
//  · VerwGer SG B 2025/70: «Art. 1 Abs. 1 lit. d Ziff. 2 WAG» = Gesetz über Wahlen und
//    Abstimmungen SG (sGS 125.3), NICHT das Waldgesetz WaG (SR 921.0) → trug WAG.
// Amtsquelle: gesetzessammlung.sg.ch/api/de/texts_of_law/{735.1,125.3}, Abruf 25.9.2026.

function snap(o: Partial<EntscheidSnapshot> = {}): EntscheidSnapshot {
  return {
    id: 'kanton/SG/sg_gerichte/B2025_70', gericht: 'sg_gerichte', gerichtName: 'Verwaltungs-/Versicherungsgericht SG',
    gerichtstyp: 'kantonal', kanton: 'SG', abteilung: null, nummer: 'B 2025/70',
    bgeReferenz: null, zitierung: 'VerwGer SG B 2025/70', datum: '2026-01-06',
    sprache: 'de', leitcharakter: 'routine', sachgebiet: 'oeffentlich', legalArea: null,
    rubrum: null, regeste: null, regesteAmtlich: false,
    abschnitte: [], dispositivOrders: [], zitierteNormen: [], normKeys: [],
    zitierteEntscheide: [], bestand: 'snapshot', kuratierung: 'maschinell',
    quelle: 'opencaselaw', quelleUrl: 'https://www.gerichte.sg.ch', abgerufen: '2026-09-25',
    fassungsToken: 'h', sha: 's',
    ...o,
  };
}
const erw = (text: string): EntscheidSnapshot['abschnitte'] =>
  [{ typ: 'erwaegung', bloecke: [{ marke: '1', text }] }];

const WAHL = 'Wahl- und Abstimmungsfreiheit, Art. 40 Abs. 1 KV, Art. 1 Abs. 1 lit. d Ziff. 2 WAG';
const ENTEIGNUNG = 'Enteignungsrecht, Art. 15-17 EntG SG. Streitig war die Bemessung der Entschädigung.';

describe('kantonale Namensvetter: EntG/WAG in kantonalen Urteilen nicht auf Bundesrecht', () => {
  it('die Sperre führt genau die belegten Kürzel mit Begründung', () => {
    expect([...KANTONAL_ABK_SPERRE.keys()].sort()).toEqual(['ENTG', 'WAG']);
    for (const [k, grund] of KANTONAL_ABK_SPERRE) expect(grund.length, k).toBeGreaterThan(40);
  });

  it('SG B 2025/70: «WAG» (Wahlen und Abstimmungen, sGS 125.3) ist nicht das Waldgesetz', () => {
    expect(normKeysVonSnapshot(snap({ abschnitte: erw(WAHL) }))).not.toContain('WAG');
  });

  it('SG B 2023/207: «EntG SG» (sGS 735.1) ist nicht das eidg. EntG', () => {
    expect(normKeysVonSnapshot(snap({ abschnitte: erw(ENTEIGNUNG) }))).not.toContain('ENTG');
  });

  it('auch über die statutes-Liste (zitierteNormen) kein Bundes-Key im kantonalen Urteil', () => {
    expect(normKeysVonSnapshot(snap({ zitierteNormen: ['Art. 1 WAG', 'Art. 15 EntG'] }))).toEqual([]);
  });

  it('Bundesgerichts-Urteile bleiben unberührt: WaG/EntG lösen dort weiter auf', () => {
    expect(normKeyFuerAbk('WaG')).toBe('WAG');
    expect(normKeyFuerAbk('EntG')).toBe('ENTG');
    const bge = snap({ gerichtstyp: 'bundesgericht', kanton: 'CH', abschnitte: erw('Art. 5 WaG; Art. 19 EntG') });
    expect(normKeysVonSnapshot(bge)).toEqual(['ENTG', 'WAG']);
  });

  it('Bewahr-Ratsche: sperrEntfernteNormKeys belegt die Entfernung des Alt-Keys mechanisch', () => {
    expect(sperrEntfernteNormKeys(snap({ normKeys: ['WAG'], abschnitte: erw(WAHL) }))).toEqual(['WAG']);
    expect(sperrEntfernteNormKeys(snap({ normKeys: ['ENTG'], abschnitte: erw(ENTEIGNUNG) }))).toEqual(['ENTG']);
    const bge = snap({ gerichtstyp: 'bundesgericht', kanton: 'CH', normKeys: ['ENTG'], abschnitte: erw('Art. 19 EntG') });
    expect(sperrEntfernteNormKeys(bge)).toEqual([]);
  });
});
