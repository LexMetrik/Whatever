import { describe, it, expect } from 'vitest';
import { fremdesAktenzeichenImKopf, kopfZurueckhalten, type Zurueckgehalten } from '../../scripts/normtext/entscheid-kantonsdatum';

// QS-KORPUS, Wochen-Nachzug 28.9.2026 (PR #1149) — Befund «Aktenzeichen nicht im PDF-Text»:
// OCL führt für zwei AG-Urteile ein Aktenzeichen, das der amtliche Urteilskopf NICHT trägt.
// Echte Kopf-Auszüge (OCL full_text = amtliches decwork-PDF, abgerufen 30.9.2026, gemeinfrei Art. 5 URG).
//  · decwork decrees/11417: OCL «HOR.2025.3», amtlich «HOR.2021.17» (Urteil vom 21. August 2025)
//  · decwork decrees/10249: OCL «ST.2024.216», amtlich «SST.2024.216 (ST.2023.91; STA.2022.8227)»
//    — «ST.2024.216» steht als Wortteil in «SST.2024.216», nie als eigenes Wort (Wortgrenze, §7).
const KOPF_HOR = 'Handelsgericht 2. Kammer HOR.2021.17 / as / as Urteil vom 21. August 2025 Besetzung Oberrichter Vetter, Präsident Ersatzrichter Wyss';
const KOPF_ST = 'Obergericht Strafgericht, 3. Kammer SST.2024.216 (ST.2023.91; STA.2022.8227) Urteil vom 20. Dezember 2024 Besetzung Oberrichter Six, Präsident';
// Positivkontrolle: Kopf, der das EIGENE Aktenzeichen trägt (AG, decwork decrees/10313, Kopf wörtlich gekürzt um den Rest nach «Vizepräsidentin»).
const KOPF_OK = 'Obergericht Beschwerdekammer in Strafsachen SBE.2024.32 (ST.2023.59; STA.2022.4626) Art. 5 Entscheid vom 9. Januar 2025 Besetzung Oberrichterin Schär, Vizepräsidentin';

const ag = (docket: string, full_text: string) => ({
  decision_id: `ag_gerichte_${docket}`, court: 'ag_gerichte', canton: 'AG', docket_number: docket, decision_date: '2025-08-21', full_text,
});

describe('fremdesAktenzeichenImKopf — Aktenzeichen-Identität des eigenen Urteilskopfs', () => {
  it('HOR.2025.3: Kopf nennt HOR.2021.17 ⇒ fremdes Aktenzeichen', () => {
    expect(fremdesAktenzeichenImKopf(ag('HOR.2025.3', KOPF_HOR))).toBe('HOR.2021.17');
  });
  it('ST.2024.216: Kopf nennt SST.2024.216 ⇒ kein Substring-Treffer, fremdes Aktenzeichen', () => {
    expect(fremdesAktenzeichenImKopf(ag('ST.2024.216', KOPF_ST))).toBe('SST.2024.216');
  });
  it('eigenes Aktenzeichen im Kopf ⇒ null (auch mit Vorinstanz-Aktenzeichen daneben)', () => {
    expect(fremdesAktenzeichenImKopf(ag('SBE.2024.32', KOPF_OK))).toBeNull();
    expect(fremdesAktenzeichenImKopf(ag('SST.2024.216', KOPF_ST))).toBeNull();
  });
  it('Kopf ganz ohne Aktenzeichen belegt nichts ⇒ null; andere Aktenzeichen-Formen ⇒ null', () => {
    expect(fremdesAktenzeichenImKopf(ag('HOR.2025.3', 'Handelsgericht 2. Kammer Urteil vom 21. August 2025 Besetzung'))).toBeNull();
    expect(fremdesAktenzeichenImKopf({ docket_number: 'UV 2025/14', full_text: 'Versicherungsgericht UV 2025/13 Entscheid vom 21. Oktober 2025' })).toBeNull();
    expect(fremdesAktenzeichenImKopf({ docket_number: 'HOR.2025.3', full_text: null })).toBeNull();
  });
});

describe('kopfZurueckhalten — Aktenzeichen-Widerspruch hält den Neuabruf zurück', () => {
  const opts = (log: Zurueckgehalten[]) => ({ nurMitAmtlichemKopf: true, zurueckgehalten: (z: Zurueckgehalten) => { log.push(z); } });
  it('hält HOR.2025.3 und ST.2024.216 zurück, meldet den Grund; SBE.2024.32 bleibt', () => {
    const log: Zurueckgehalten[] = [];
    expect(kopfZurueckhalten(ag('HOR.2025.3', KOPF_HOR), null, opts(log))).toBe(true);
    expect(kopfZurueckhalten(ag('ST.2024.216', KOPF_ST), null, opts(log))).toBe(true);
    expect(kopfZurueckhalten(ag('SBE.2024.32', KOPF_OK), null, opts(log))).toBe(false);
    expect(log.map((z) => z.nummer)).toEqual(['HOR.2025.3', 'ST.2024.216']);
    expect(log[0].grund).toContain('HOR.2021.17');
    expect(log[1].grund).toContain('SST.2024.216');
  });
  it('ohne nurMitAmtlichemKopf und für Bund (canton CH) unverändert: nie zurückhalten', () => {
    expect(kopfZurueckhalten(ag('HOR.2025.3', KOPF_HOR), null, {})).toBe(false);
    expect(kopfZurueckhalten({ ...ag('BB.2026.87', 'Strafkammer BB.2025.1 Urteil vom 18. August 2026'), canton: 'CH' }, null, { nurMitAmtlichemKopf: true })).toBe(false);
  });
});
