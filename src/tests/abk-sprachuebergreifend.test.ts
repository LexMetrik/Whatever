// ── QS-KORPUS 25.9.2026 · sprachübergreifend mehrdeutige Fedlex-Kürzel ──────
//
// Anlass: Nach-Verdikt «widerlegt» zu e3f874779. Das generierte Alias-Artefakt
// bildet ein Kürzel SPRACHUNGEBUNDEN ab; Fedlex selbst vergibt dieselbe
// Buchstabenfolge in verschiedenen Sprachen an verschiedene Erlasse (SPARQL
// 25.9.2026, jolux:titleShort):
//   AIMP — ITA SR 351.1 (IRSG) · FRA SR 172.056.5 (IVöB, Beschaffung)
//   OCP  — FRA SR 832.104 (VKL) · ITA SR 922.01 (JSV, Jagd)
//   OS   — FRA/ITA SR 961.011 (AVO) · FRA/ITA SR 961.05; im Korpus aber
//          ausschliesslich «OS LCart» = SVKG (SR 251.5), Kartellsanktionen
// Folge vorher: IRSG an Beschaffungs-BGE (152 II 211, 152 II 325, 151 II 81 …),
// VKL an einem Jagd-BGE (152 II 196) und am V-StGB-MStGB-Zitat «OCP-CPM»
// (150 IV 425), AVO an Kartell-BGE (147 II 72, 148 II 25 …).
// ROT ZU BEKOMMEN (§6.7): die drei Einträge aus ABK_AUSSCHLUSS streichen.
import { describe, it, expect } from 'vitest';
import {
  ABK_AUSSCHLUSS, normKeyFuerAbk, normKeysVonSnapshot, artikelSchluesselVonSnapshot,
  sperrEntfernteNormKeys,
} from '../../scripts/normtext/entscheide-mapping';
import type { EntscheidSnapshot } from '../lib/rechtsprechung/typen';

function snap(o: Partial<EntscheidSnapshot> = {}): EntscheidSnapshot {
  return {
    id: 'bund/bge/152_II_211', gericht: 'bge', gerichtName: 'Bundesgericht',
    gerichtstyp: 'bundesgericht', kanton: 'CH', abteilung: null, nummer: '152 II 211',
    bgeReferenz: '152 II 211', zitierung: 'BGE 152 II 211', datum: '2025-10-01',
    sprache: 'de', leitcharakter: 'leitentscheid', sachgebiet: 'oeffentlich', legalArea: null,
    rubrum: null, regeste: null, regesteAmtlich: true,
    abschnitte: [], dispositivOrders: [], zitierteNormen: [], normKeys: [],
    zitierteEntscheide: [], bestand: 'snapshot', kuratierung: 'maschinell',
    quelle: 'opencaselaw', quelleUrl: 'https://search.bger.ch', abgerufen: '2026-09-25',
    fassungsToken: 'h', sha: 's',
    ...o,
  };
}
const erw = (text: string): EntscheidSnapshot['abschnitte'] =>
  [{ typ: 'erwaegung', bloecke: [{ marke: 'E. 5', text }] }];

describe('sprachübergreifend mehrdeutige Kürzel sind gesperrt (§1/§8)', () => {
  it('AIMP, OCP, OS stehen in ABK_AUSSCHLUSS und lösen nicht mehr auf', () => {
    for (const t of ['AIMP', 'OCP', 'OS']) {
      expect(ABK_AUSSCHLUSS.has(t), t).toBe(true);
      expect(normKeyFuerAbk(t), t).toBeNull();
    }
  });

  it('AIMP im Beschaffungs-BGE ist IVöB, nicht IRSG', () => {
    const s = snap({ abschnitte: erw('Art. 39 al. 1 et 2 et art. 44 al. 1 let. b AIMP; négociations') });
    expect(normKeysVonSnapshot(s)).not.toContain('IRSG');
    expect([...artikelSchluesselVonSnapshot(s)].some((k) => k.startsWith('IRSG/'))).toBe(false);
  });

  it('AIMP im Rechtshilfe-BGE: IRSG bleibt über IRSG/EIMP erhalten', () => {
    const s = snap({ abschnitte: erw('Art. 80h lit. b IRSG; art. 80h let. b EIMP; art. 80h lett. b AIMP') });
    expect(normKeysVonSnapshot(s)).toContain('IRSG');
  });

  it('OCP ist nicht VKL (Jagd-BGE 152 II 196, «OCP-CPM» in 150 IV 425)', () => {
    const jagd = snap({ abschnitte: erw('art. 10quinquies cpv. 1 lett. a OCP (versione del 1° luglio 2023)') });
    const vstgb = snap({ abschnitte: erw('art. 4 e 5 OCP-CPM; liberazione condizionale') });
    expect(normKeysVonSnapshot(jagd)).not.toContain('VKL');
    expect(normKeysVonSnapshot(vstgb)).not.toContain('VKL');
  });

  it('«OS LCart» (SVKG) ist nicht AVO', () => {
    const s = snap({ abschnitte: erw('art. 3 al. 2 OS LCart; art. 49a LCart') });
    expect(normKeysVonSnapshot(s)).not.toContain('AVO');
  });

  it('sperrEntfernteNormKeys belegt die Ursache je Snapshot mechanisch', () => {
    const beschaffung = snap({ normKeys: ['BGG', 'IRSG'], abschnitte: erw('art. 44 al. 1 let. b AIMP') });
    expect(sperrEntfernteNormKeys(beschaffung)).toEqual(['IRSG']);
    const rechtshilfe = snap({ normKeys: ['IRSG'], abschnitte: erw('Art. 80h IRSG; art. 80h lett. b AIMP') });
    expect(sperrEntfernteNormKeys(rechtshilfe)).toEqual([]);   // IRSG weiter belegt
  });
});
