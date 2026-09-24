// ─── RL-18 · SchKG Ferienzustellung (Befunde F2-03, F2-04; Bündel A-B3b) ─────
//
// Prüfung Rechtslogik 23.9.2026, W2·30-RL-W2A.
//
// F2-03: Eine während der Betreibungsferien vorgenommene Betreibungshandlung
// (hier: Zustellung des Zahlungsbefehls) ist weder nichtig noch anfechtbar,
// sondern entfaltet ihre Wirkung erst am ersten Tag nach Ablauf der Ferien;
// die Fristen beginnen an diesem Tag zu laufen (BGE 121 III 284 E. 2b/c;
// Art. 56 Abs. 1 Ziff. 2 SchKG, Fedlex SR 281.1, Fassung 1.1.2026).
//
// F2-04: Die Zustellung eines Zahlungsbefehls während eines Rechtsstillstands
// wegen Militär-, Zivil- oder Schutzdienstes (Art. 57 SchKG) ist nichtig
// (BGE 127 III 173 E. 3) → Warnung.
//
// Soll-Fälle (per Skript gegen den Betreibungsferien-Kalender nachgerechnet,
// Osterferien 2026 = 29.3.–12.4.2026):
//   ZB zugestellt 8.4.2026 → Wirkung/Fristbeginn 13.4.2026
//     Rechtsvorschlag 10 Tage       → 22.04.2026 (Mi)
//     Fortsetzung frühestens (20 T.) → Ablauf Sa 2.5., Folgetag So 3.5. → 04.05.2026 (Mo)
//     Fortsetzung spätestens (1 J.)  → 12.04.2027 (Mo; Kalenderkonvention der
//                                      Engine: Referenztag = letzter Ferientag,
//                                      analog Art. 146 Abs. 1 ZPO im ZPO-Pfad)
import { describe, expect, it } from 'vitest';
import { berechneSchkgFrist, BETREIBUNGSURKUNDEN_AUSLOESER } from '../lib/schkgFristen';
import { berechneZahlungsbefehlsSpiegel } from '../lib/fristenspiegel/zahlungsbefehl';
import { PRESETS_SCHKG } from '../lib/schkgPresets';
import type { SchkgInput } from '../types/schkg';

const ZB = 'Zustellung Zahlungsbefehl';

const base = (over: Partial<SchkgInput>): SchkgInput => ({
  ereignis: '2026-04-08',
  einheit: 'tage',
  laenge: 10,
  modus: 'schkg_betreibungsferien',
  fristnatur: 'frist',
  kanton: 'ZH',
  ausloeser: ZB,
  ...over,
});

describe('RL-18 / F2-03 — Zustellung in den Betreibungsferien wirkt erst am ersten Tag danach', () => {
  it('Rechtsvorschlag: ZB 8.4.2026 → Fristbeginn 13.4., Ende 22.04.2026', () => {
    const r = berechneSchkgFrist(base({}));
    expect(r.massgeblicherEreignistag).toBe('13.04.2026');
    expect(r.diesAQuo).toBe('13.04.2026');
    expect(r.diesAdQuem).toBe('22.04.2026');
    // Die tatsächliche Zustellung bleibt als Ereignis sichtbar (Kalender-Markierung).
    expect(r.ereignisISO).toBe('2026-04-08');
    const schritt = r.rechenweg.find((s) => s.beschreibung.includes('Zustellung in den Betreibungsferien'));
    expect(schritt, 'Rechenweg-Schritt zur Ferienzustellung fehlt').toBeDefined();
    expect(schritt!.zwischenergebnis).toContain('BGE 121 III 284');
    expect(schritt!.normen?.map((n) => n.artikel)).toContain('Art. 56 Abs. 1 Ziff. 2 SchKG');
  });

  it('Fortsetzungsbegehren frühestens (Wartefrist 20 Tage): ZB 8.4.2026 → 04.05.2026', () => {
    const r = berechneSchkgFrist(base({ laenge: 20, fristnatur: 'wartefrist' }));
    expect(r.diesAQuo).toBe('13.04.2026');
    expect(r.diesAdQuem).toBe('04.05.2026');
  });

  it('Fortsetzungsbegehren spätestens (1 Jahr, Verwirkung): ZB 8.4.2026 → 12.04.2027', () => {
    const r = berechneSchkgFrist(base({ einheit: 'jahre', laenge: 1, fristnatur: 'verwirkung' }));
    expect(r.diesAdQuem).toBe('12.04.2027');
  });

  it('Q-10: die Gegenlesart (Wirkung 13.4., Fristbeginn erst 14.4.) wird mit ihrem Datum offengelegt', () => {
    const r = berechneSchkgFrist(base({}));
    const offen = r.warnungen.find((w) => w.includes('BGE 121 III 284'));
    expect(offen, 'Offenlegung der Zählweise fehlt').toBeDefined();
    expect(offen).toContain('23.04.2026');
  });

  it('Weihnachtsferien: ZB 20.12.2025 → Fristbeginn 2.1.2026, Rechtsvorschlag bis 12.01.2026', () => {
    const r = berechneSchkgFrist(base({ ereignis: '2025-12-20' }));
    expect(r.massgeblicherEreignistag).toBe('02.01.2026');
    expect(r.diesAQuo).toBe('02.01.2026');
    expect(r.diesAdQuem).toBe('12.01.2026'); // 10. Tag So 11.1. → Mo 12.1.
  });

  it('Konkursandrohung in den Sommerferien: 20.7.2026 → Konkursbegehren frühestens 21.08.2026', () => {
    const r = berechneSchkgFrist(base({ ereignis: '2026-07-20', laenge: 20, fristnatur: 'wartefrist', ausloeser: 'Zustellung Konkursandrohung' }));
    expect(r.diesAQuo).toBe('01.08.2026');
    expect(r.diesAdQuem).toBe('21.08.2026');
  });

  it('Fristenspiegel A.2 erbt die Regel: ZB 8.4.2026 → RV 22.4., Fortsetzung frühestens 4.5.2026', () => {
    const e = berechneZahlungsbefehlsSpiegel({ zustellung: '2026-04-08', kanton: 'ZH' });
    expect(e.zeilen.find((z) => z.key === 'rechtsvorschlag')!.endeISO).toBe('2026-04-22');
    expect(e.zeilen.find((z) => z.key === 'fortsetzung_warte')!.endeISO).toBe('2026-05-04');
    expect(e.zeilen.find((z) => z.key === 'fortsetzung_verwirkung')!.endeISO).toBe('2027-04-12');
    // Die drei Zählweise-Offenlegungen müssen je ihrer Frist zuordenbar sein.
    const offen = e.warnungen.filter((w) => w.startsWith('Zählweise'));
    expect(offen).toHaveLength(3);
    expect(offen.some((w) => w.includes('(10 Tage)') && w.includes('23.04.2026'))).toBe(true);
    expect(offen.some((w) => w.includes('(20 Tage)') && w.includes('04.05.2026'))).toBe(true);
    expect(offen.some((w) => w.includes('(1 Jahr)') && w.includes('13.04.2027'))).toBe(true);
  });
});

describe('RL-18 / F2-03 — Abgrenzung: keine Fiktion ohne Betreibungshandlung', () => {
  it('ohne Auslöser (Ereignisart unbekannt) bleibt das Ereignis unverändert (Golden schkg:weihnachten)', () => {
    const r = berechneSchkgFrist(base({ ereignis: '2025-12-20', ausloeser: undefined, fristnatur: 'verwirkung' }));
    expect(r.massgeblicherEreignistag).toBe('20.12.2025');
    expect(r.diesAQuo).toBe('21.12.2025');
  });

  it('Wechselbetreibung (keine Betreibungsferien, Art. 56 Abs. 1 Ziff. 2 SchKG): keine Fiktion', () => {
    const r = berechneSchkgFrist(base({ laenge: 5, modus: 'kein' }));
    expect(r.massgeblicherEreignistag).toBe('08.04.2026');
    expect(r.diesAQuo).toBe('09.04.2026');
  });

  it('Arrestverfahren (Art. 56 Abs. 1 SchKG «ausser im Arrestverfahren»): keine Fiktion', () => {
    const r = berechneSchkgFrist(base({ ausloeser: 'Zustellung Arresturkunde' }));
    expect(r.massgeblicherEreignistag).toBe('08.04.2026');
    expect(r.diesAQuo).toBe('09.04.2026');
  });

  it('Zustellung ausserhalb der Ferien: unverändert', () => {
    const r = berechneSchkgFrist(base({ ereignis: '2026-04-13' }));
    expect(r.massgeblicherEreignistag).toBe('13.04.2026');
    expect(r.diesAQuo).toBe('14.04.2026');
  });

  it('jeder gebundene Auslöser existiert wörtlich in den SchKG-Presets (Umbenennung macht rot)', () => {
    const presetAusloeser = new Set(PRESETS_SCHKG.map((p) => p.ausloeser));
    expect(BETREIBUNGSURKUNDEN_AUSLOESER.length).toBeGreaterThan(0);
    for (const a of BETREIBUNGSURKUNDEN_AUSLOESER) {
      expect(presetAusloeser.has(a), `Auslöser «${a}» fehlt in PRESETS_SCHKG`).toBe(true);
    }
    expect(BETREIBUNGSURKUNDEN_AUSLOESER).not.toContain('Zustellung Arresturkunde');
  });
});

describe('RL-18 / F2-04 — Zustellung während Rechtsstillstand', () => {
  it('ZB 20.3.2026, Rechtsstillstand 18.–27.3.2026 → Warnung Nichtigkeit (Art. 57 SchKG, BGE 127 III 173 E. 3)', () => {
    const r = berechneSchkgFrist(base({ ereignis: '2026-03-20', rechtsstillstandVon: '2026-03-18', rechtsstillstandBis: '2026-03-27' }));
    const w = r.warnungen.find((x) => x.includes('BGE 127 III 173'));
    expect(w, 'Rechtsstillstand-Warnung fehlt').toBeDefined();
    expect(w).toContain('nichtig');
    expect(w).toContain('Art. 57');
  });

  it('Zustellung ausserhalb des Rechtsstillstands → keine Nichtigkeits-Warnung', () => {
    const r = berechneSchkgFrist(base({ ereignis: '2026-03-17', rechtsstillstandVon: '2026-03-18', rechtsstillstandBis: '2026-03-27' }));
    expect(r.warnungen.some((x) => x.includes('BGE 127 III 173'))).toBe(false);
  });

  it('ohne Betreibungshandlung als Auslöser → keine Nichtigkeits-Warnung', () => {
    const r = berechneSchkgFrist(base({ ereignis: '2026-03-20', ausloeser: undefined, rechtsstillstandVon: '2026-03-18', rechtsstillstandBis: '2026-03-27' }));
    expect(r.warnungen.some((x) => x.includes('BGE 127 III 173'))).toBe(false);
  });
});
