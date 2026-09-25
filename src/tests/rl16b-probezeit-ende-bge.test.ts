// RL-16b Nachzug (Gegenprüfung 25.9.2026, Befund hoch): Ende der
// UNVERLÄNGERTEN Probezeit nach der Rechtsprechung des Bundesgerichts.
//
// BGE 144 III 152 E. 4.4.3 (4A_3/2017, Volltext entscheidsuche.ch
// CH_BGE_005_BGE-144-III-152_2018, abgerufen 25.9.2026): Wird der Arbeitsvertrag
// am Tag des Stellenantritts geschlossen, «steht dieser Tag nicht voll zur
// Verfügung. Er wird daher entsprechend dem Prinzip der Zivilkomputation nicht
// mitgezählt. Art. 77 Abs. 1 Ziff. 3 OR ist ohne Weiteres anwendbar.» Antritt
// 15.7.2015, 1 Monat → Ende «grundsätzlich am 15. August 2015». Offen gelassen:
// Vertragsschluss VOR dem Stellenantritt.
//
// 8C_317/2021 vom 8.3.2022 (= BGE 148 III 126, Volltext entscheidsuche.ch
// CH_BGer_008_8C-317-2021_2022-03-08): Antritt und Vertrag 16.3.2020, Probezeit
// 3 Monate; E. 5.2.3.1: «der vorinstanzlich festgestellte Beginn der
// Probezeit am 16. März 2020 und damit auch ihres grundsätzlichen Endes nach
// Ablauf von drei Monaten am 16. Juni 2020 [lässt sich] nicht beanstanden»;
// krank 15.–19.6.2020 → Ausfalltage «15. und 16. Juni 2020» (E. 5.2.7), Ende
// 23.6.2020 (E. 5.2.9), Kündigung 22.6. in der Probezeit, siebentägige Frist
// bis 29.6.2020 (E. 4.1).
//
// Art. 77 Abs. 1 Ziff. 3 OR (Fedlex SR 220, Filestore 20260101): fehlt der
// gleichnamige Tag im letzten Monat, «auf den letzten Tag dieses Monates».
import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import { berechneKuendigungsfrist } from '../lib/kuendigungsfrist';
import type { SperrfristenInput } from '../types/legal';

const ds = (d: Date | undefined) => (d ? format(d, 'yyyy-MM-dd') : undefined);
const rw = (r: ReturnType<typeof berechneKuendigungsfrist>) =>
  r.ergebnis.rechenweg.map((s) => s.zwischenergebnis).join(' | ');

const BGE148: SperrfristenInput = {
  vertragsbeginn: '2020-03-16',
  zugangKuendigung: '2020-06-22',
  kuendigendePartei: 'arbeitgeber',
  probezeitMonate: 3,
  kuendigungsterminMonatsende: true,
  arbeitstageWoche: [1, 2, 3, 4, 5],
  sperrereignisse: [{ typ: 'krankheit_unfall', von: '2020-06-15', bis: '2020-06-19' }],
};

describe('BGE 148 III 126 (8C_317/2021) — Sachverhalt nachgerechnet', () => {
  it('unverlängertes Ende 16.06.2020, 2 Ausfalltage (15./16.6.), Ende 23.06.2020; Zugang 22.6. → 29.06.2020', () => {
    const r = berechneKuendigungsfrist(BGE148);
    expect(r.istProbezeit).toBe(true);
    expect(ds(r.beendigungsdatum)).toBe('2020-06-29');
    const t = rw(r);
    expect(t).toContain('Ende 16.06.2020');
    expect(t).toContain('2 Arbeitstag');
    expect(t).toContain('bis 23.06.2020');
  });

  it('Zugang 24.6.2020 (nach dem 23.6.) → ausserhalb der Probezeit', () => {
    expect(berechneKuendigungsfrist({ ...BGE148, zugangKuendigung: '2020-06-24' }).istProbezeit).toBe(false);
  });
});

describe('BGE 144 III 152 — Stellenantritt zählt nicht, Ende am gleichnamigen Tag (VB ≠ Monatserster)', () => {
  const basis = {
    vertragsbeginn: '2015-07-15', kuendigendePartei: 'arbeitgeber' as const,
    probezeitMonate: 1, kuendigungsterminMonatsende: true, arbeitstageWoche: [1, 2, 3, 4, 5],
  };

  it('ohne Verhinderung: Zugang 15.8.2015 noch in der Probezeit, 16.8. nicht mehr', () => {
    expect(berechneKuendigungsfrist({ ...basis, zugangKuendigung: '2015-08-15' }).istProbezeit).toBe(true);
    expect(berechneKuendigungsfrist({ ...basis, zugangKuendigung: '2015-08-16' }).istProbezeit).toBe(false);
  });

  it('ein Krankheitstag (Mo 20.7.2015): Zugang So 16.8.2015 in der verlängerten Probezeit (bis Mo 17.8.)', () => {
    const r = berechneKuendigungsfrist({
      ...basis, zugangKuendigung: '2015-08-16',
      sperrereignisse: [{ typ: 'krankheit_unfall', von: '2015-07-20', bis: '2015-07-20' }],
    });
    expect(r.istProbezeit).toBe(true);
    expect(ds(r.beendigungsdatum)).toBe('2015-08-23');
    expect(rw(r)).toContain('bis 17.08.2015');
  });
});

describe('Gegenprüfungsfall VB Fr 25.7.2025, 1 Monat, krank 28.7.–1.8.2025', () => {
  // Ende unverlängert 25.8.; Ausfall 28.–31.7. = 4 (1.8. Bundesfeiertag,
  // Art. 110 Abs. 3 BV); abgearbeitet 26.–29.8. → Ende Fr 29.8.2025.
  it('Zugang 29.8.2025 → in der Probezeit → 05.09.2025', () => {
    const r = berechneKuendigungsfrist({
      vertragsbeginn: '2025-07-25', zugangKuendigung: '2025-08-29', kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1, kuendigungsterminMonatsende: true, arbeitstageWoche: [1, 2, 3, 4, 5],
      sperrereignisse: [{ typ: 'krankheit_unfall', von: '2025-07-28', bis: '2025-08-01' }],
    });
    expect(r.istProbezeit).toBe(true);
    expect(ds(r.beendigungsdatum)).toBe('2025-09-05');
    expect(rw(r)).toContain('Ende 25.08.2025');
  });
});

describe('Art. 77 Abs. 1 Ziff. 3 OR — gleichnamiger Tag fehlt → letzter Tag des Monats', () => {
  const basis = { kuendigendePartei: 'arbeitgeber' as const, probezeitMonate: 1, kuendigungsterminMonatsende: true };

  it('VB 31.1.2025 → Ende 28.02.2025 (nicht 27.02.); Zugang 28.2. in, 1.3. ausserhalb', () => {
    const drin = berechneKuendigungsfrist({ ...basis, vertragsbeginn: '2025-01-31', zugangKuendigung: '2025-02-28' });
    expect(drin.istProbezeit).toBe(true);
    expect(rw(drin)).toContain('Ende 28.02.2025');
    expect(berechneKuendigungsfrist({ ...basis, vertragsbeginn: '2025-01-31', zugangKuendigung: '2025-03-01' }).istProbezeit).toBe(false);
  });

  it('VB 30.1.2025 → Ende 28.02.2025', () => {
    const r = berechneKuendigungsfrist({ ...basis, vertragsbeginn: '2025-01-30', zugangKuendigung: '2025-02-10' });
    expect(rw(r)).toContain('Ende 28.02.2025');
  });
});

describe('Offene Frage (BGE 144 III 152 E. 4.4.3): Vertragsschluss vor dem Stellenantritt', () => {
  const basis = {
    vertragsbeginn: '2025-01-01', kuendigendePartei: 'arbeitgeber' as const,
    probezeitMonate: 1, kuendigungsterminMonatsende: true,
  };

  it('Zugang am gleichnamigen Tag (1.2.2025): in der Probezeit, Warnung nennt das Vortags-Ende 31.01.2025', () => {
    const r = berechneKuendigungsfrist({ ...basis, zugangKuendigung: '2025-02-01' });
    expect(r.istProbezeit).toBe(true);
    const w = r.ergebnis.warnungen.find((x) => x.includes('BGE 144 III 152'));
    expect(w).toBeDefined();
    expect(w).toContain('31.01.2025');
  });

  it('Zugang mitten in der Probezeit (20.1.2025): keine solche Warnung', () => {
    const r = berechneKuendigungsfrist({ ...basis, zugangKuendigung: '2025-01-20' });
    expect(r.ergebnis.warnungen.some((x) => x.includes('BGE 144 III 152'))).toBe(false);
  });
});
