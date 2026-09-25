// ── QS-KORPUS 25.9.2026 · vom Bundesgericht selbst definierte Kürzel ─────────
//
// Anlass: CI-Lauf 36124134898, check:normkeys rot — «CV» (Wiener Übereinkommen
// über das Recht der Verträge, SR 0.111, Register-Key VRK) in 20 BGE, ohne
// amtliches Fedlex-Kurzzeichen und darum von der Alias-Ebene nicht erfasst.
// Zusagen dieser Tests (entscheide-mapping.ts, GERICHTS_KUERZEL):
//   (1) CV → VRK in Bundesgerichts-Snapshots (statutes, Fliesstext, Artikel-Schlüssel),
//   (2) keine Wirkung ausserhalb des Bundesgerichts und im datumsfreien
//       `normKeyFuerAbk` (den auch der kantonale Resolver nutzt),
//   (3) «CVRD» (Wiener Übereinkommen über diplomatische Beziehungen, SR 0.191.01)
//       wird nicht zu CV/VRK,
//   (4) die Tabelle ist sauber (keine verworfenen Einträge).
// ROT ZU BEKOMMEN (§6.7): den CV-Eintrag aus GERICHTS_KUERZEL streichen (1 reisst)
// oder in `gerichtsKuerzelKey` die gerichtstyp-Prüfung entfernen (2 reisst).
import { describe, it, expect } from 'vitest';
import {
  GERICHTS_KUERZEL, GERICHTS_KUERZEL_NOTIZEN, gerichtsKuerzelKey, normKeyImSnapshot,
  normKeyFuerAbk, normKeysVonSnapshot, statutesZuNormKeys, artikelSchluesselVonSnapshot,
} from '../../scripts/normtext/entscheide-mapping';
import { ERLASS_REGISTER } from '../lib/normtext/register';
import type { EntscheidSnapshot } from '../lib/rechtsprechung/typen';

function snap(o: Partial<EntscheidSnapshot> = {}): EntscheidSnapshot {
  return {
    id: 'bund/bge/152_II_233', gericht: 'bge', gerichtName: 'Bundesgericht',
    gerichtstyp: 'bundesgericht', kanton: 'CH', abteilung: null, nummer: '152 II 233',
    bgeReferenz: '152 II 233', zitierung: 'BGE 152 II 233', datum: '2025-08-01',
    sprache: 'fr', leitcharakter: 'leitentscheid', sachgebiet: 'oeffentlich', legalArea: null,
    rubrum: null, regeste: null, regesteAmtlich: true,
    abschnitte: [], dispositivOrders: [], zitierteNormen: [], normKeys: [],
    zitierteEntscheide: [], bestand: 'snapshot', kuratierung: 'maschinell',
    quelle: 'opencaselaw', quelleUrl: 'https://search.bger.ch', abgerufen: '2026-09-25',
    fassungsToken: 'h', sha: 's',
    ...o,
  };
}

const erw = (text: string): EntscheidSnapshot['abschnitte'] =>
  [{ typ: 'erwaegung', bloecke: [{ marke: 'E. 3', text }] }];

describe('GERICHTS_KUERZEL — CV → VRK (SR 0.111)', () => {
  it('Register führt SR 0.111 als VRK, der Eintrag verweist darauf', () => {
    expect(ERLASS_REGISTER.find((e) => e.sr === '0.111')?.key).toBe('VRK');
    expect(GERICHTS_KUERZEL.find((g) => g.abk === 'CV')?.sr).toBe('0.111');
    expect(GERICHTS_KUERZEL_NOTIZEN).toEqual([]);
  });

  it('(1) Bundesgericht: CV → VRK über Fliesstext, statutes und Artikel-Schlüssel', () => {
    expect(gerichtsKuerzelKey('CV', 'bundesgericht')).toBe('VRK');
    expect(normKeyImSnapshot('CV', 'bundesgericht', '2025-08-01')).toBe('VRK');
    expect(statutesZuNormKeys(['Art. 31 CV'], '2025-08-01', 'bundesgericht')).toEqual(['VRK']);
    const s = snap({
      zitierteNormen: ['Art. 31 CV'],
      abschnitte: erw("Selon l'art. 31 par. 1 CV, un traité doit être interprété de bonne foi."),
    });
    expect(normKeysVonSnapshot(s)).toContain('VRK');
    expect(artikelSchluesselVonSnapshot(s).has('VRK/31')).toBe(true);
  });

  it('(2) keine Wirkung ausserhalb des Bundesgerichts und im datumsfreien Resolver', () => {
    expect(normKeyFuerAbk('CV')).toBeNull();
    expect(gerichtsKuerzelKey('CV', 'kantonal')).toBeNull();
    expect(gerichtsKuerzelKey('CV', 'bundesverwaltungsgericht')).toBeNull();
    expect(statutesZuNormKeys(['Art. 31 CV'])).toEqual([]);
    const kanton = snap({
      id: 'kanton/BS/bs_appellationsgericht/X.2025.1', gericht: 'bs_appellationsgericht',
      gerichtstyp: 'kantonal', kanton: 'BS', bgeReferenz: null, leitcharakter: 'routine',
      zitierteNormen: ['Art. 31 CV'], abschnitte: erw('gemäss Art. 31 CV'),
    });
    expect(normKeysVonSnapshot(kanton)).not.toContain('VRK');
    expect(artikelSchluesselVonSnapshot(kanton).has('VRK/31')).toBe(false);
  });

  it('(3) CVRD (SR 0.191.01) wird nicht zu CV/VRK', () => {
    expect(gerichtsKuerzelKey('CVRD', 'bundesgericht')).toBeNull();
    const s = snap({
      abschnitte: erw(
        "L'art. 31 par. 1 let. c CVRD règle l'immunité de juridiction civile de l'agent diplomatique.",
      ),
    });
    expect(normKeysVonSnapshot(s)).not.toContain('VRK');
    expect([...artikelSchluesselVonSnapshot(s)].some((k) => k.startsWith('VRK/'))).toBe(false);
  });
});
