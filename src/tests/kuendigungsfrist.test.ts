import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import { berechneKuendigungsfrist } from '../lib/kuendigungsfrist';
import { berechneSperrfristen } from '../lib/sperrfristen';

// Local-time date string to avoid UTC offset issues with toISOString()
function ds(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

describe('Kündigungsfrist (Art. 335c OR)', () => {
  // T1 – Probezeit: Beginn 01.01.2026, 1 Monat, Zugang 20.01.2026 → 27.01.2026
  it('T1: Probezeit 1 Monat, Zugang 20.01.2026 → Beendigung 27.01.2026', () => {
    const result = berechneKuendigungsfrist({
      vertragsbeginn: '2026-01-01',
      zugangKuendigung: '2026-01-20',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
    });
    expect(result.istProbezeit).toBe(true);
    expect(result.ergebnis.status).toBe('ok');
    expect(result.beendigungsdatum).toBeDefined();
    expect(ds(result.beendigungsdatum!)).toBe('2026-01-27');
  });

  // T2 – 1. DJ: Beginn 01.03.2025, Zugang 15.04.2025, AG → 31.05.2025
  it('T2: 1.DJ AG Zugang 15.04.2025 → Beendigung 31.05.2025', () => {
    const result = berechneKuendigungsfrist({
      vertragsbeginn: '2025-03-01',
      zugangKuendigung: '2025-04-15',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
    });
    expect(result.istProbezeit).toBe(false);
    expect(result.fristMonate).toBe(1);
    expect(ds(result.beendigungsdatum!)).toBe('2025-05-31');
  });

  // T3 – 3. DJ: Beginn 01.01.2023, Zugang 15.04.2025, AG → 30.06.2025
  it('T3: 3.DJ AG Zugang 15.04.2025 → Beendigung 30.06.2025', () => {
    const result = berechneKuendigungsfrist({
      vertragsbeginn: '2023-01-01',
      zugangKuendigung: '2025-04-15',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
    });
    expect(result.fristMonate).toBe(2);
    expect(ds(result.beendigungsdatum!)).toBe('2025-06-30');
  });

  // Edge case: 10. DJ → 3 Monate
  it('10.DJ → 3 Monate Frist', () => {
    const result = berechneKuendigungsfrist({
      vertragsbeginn: '2015-01-01',
      zugangKuendigung: '2025-04-15',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
    });
    expect(result.fristMonate).toBe(3);
    expect(ds(result.beendigungsdatum!)).toBe('2025-07-31');
  });

  // Parität: abweichende Frist kürzer als gesetzlich → gesetzliche gilt
  it('Abweichende Frist kürzer als gesetzlich → gesetzliche gilt + Warnung', () => {
    const result = berechneKuendigungsfrist({
      vertragsbeginn: '2023-01-01',
      zugangKuendigung: '2025-04-15',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      abweichendeFristMonate: 1,      // kürzer als gesetzlich (2 Monate für 3.DJ)
      kuendigungsterminMonatsende: true,
    });
    expect(result.fristMonate).toBe(2); // gesetzliche gilt
    expect(result.ergebnis.warnungen.some((w) => w.includes('unterschreitet'))).toBe(true);
  });

  // Letzter Tag des Monats als Zugangsdatum
  it('Zugang am 31.03.2025 (Monatsende) → Frist läuft korrekt', () => {
    const result = berechneKuendigungsfrist({
      vertragsbeginn: '2020-01-01',
      zugangKuendigung: '2025-03-31',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
    });
    expect(result.fristMonate).toBe(2);
    // addMonths(31.03.2025, 2) = 31.05.2025 → Monatsende = 31.05.2025
    expect(ds(result.beendigungsdatum!)).toBe('2025-05-31');
  });

  // Februar-Edge: Zugang 31.01 + 1 Monat → Monatsende Feb
  it('Zugang 31.01.2025 + 1 Monat → 28.02.2025', () => {
    const result = berechneKuendigungsfrist({
      vertragsbeginn: '2025-01-01',
      zugangKuendigung: '2025-01-31',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 0,
      kuendigungsterminMonatsende: true,
    });
    expect(result.fristMonate).toBe(1);
    expect(ds(result.beendigungsdatum!)).toBe('2025-02-28');
  });

  // §7.17 – Vertraglich kürzere Frist (≥ 1 Monat, schriftlich) → gilt, nicht angehoben
  it('§7.17: Gültig vereinbarte kürzere Frist (1 Monat, schriftlich) gilt', () => {
    const result = berechneKuendigungsfrist({
      vertragsbeginn: '2023-01-01',
      zugangKuendigung: '2025-04-15',     // dj3 → gesetzlich 2 Monate
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      abweichendeFristMonate: 1,
      abweichendeFristFormGueltig: true,
      kuendigungsterminMonatsende: true,
    });
    expect(result.fristMonate).toBe(1); // NICHT auf 2 angehoben
  });

  // §7.18 – Verkürzung < 1 Monat ohne GAV → unzulässig, gesetzliche Frist + Warnung
  it('§7.18: Verkürzung < 1 Monat ohne GAV → gesetzliche Frist + Warnung', () => {
    const result = berechneKuendigungsfrist({
      vertragsbeginn: '2023-01-01',
      zugangKuendigung: '2025-04-15',     // dj3 → gesetzlich 2 Monate
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      abweichendeFristMonate: 0.5,
      abweichendeFristFormGueltig: true,
      abweichendeFristQuelleGAV: false,
      kuendigungsterminMonatsende: true,
    });
    expect(result.fristMonate).toBe(2);
    expect(result.ergebnis.warnungen.some((w) => w.includes('Verkürzung unter 1 Monat'))).toBe(true);
  });

  // §7.19 – Probezeit → 7 Tage ab Zugang (vorwärts)
  it('§7.19: Probezeit → 7 Tage ab Zugang', () => {
    const result = berechneKuendigungsfrist({
      vertragsbeginn: '2026-01-01',
      zugangKuendigung: '2026-01-20',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
    });
    expect(result.istProbezeit).toBe(true);
    expect(ds(result.beendigungsdatum!)).toBe('2026-01-27');
  });

  // §7.20 – Frist endet im höheren DJ → bleibt bei Frist des Zugangs-DJ
  it('§7.20: Frist läuft in höheres DJ → Frist des Zugangs-DJ', () => {
    const result = berechneKuendigungsfrist({
      vertragsbeginn: '2025-01-01',
      zugangKuendigung: '2025-12-15',     // dj1 → 1 Monat, endet im dj2 (2026)
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 0,
      kuendigungsterminMonatsende: true,
    });
    expect(result.fristMonate).toBe(1);
    expect(ds(result.beendigungsdatum!)).toBe('2026-01-31');
  });
});

describe('Sperrfristen (Art. 336c OR)', () => {
  // T4 – Nichtig: Beginn 01.01.2020, Zugang 10.05.2025, Krankheit 01.05.–30.06.2025
  it('T4: Kündigung während Sperrfrist → nichtig', () => {
    const result = berechneSperrfristen({
      vertragsbeginn: '2020-01-01',
      zugangKuendigung: '2025-05-10',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
      sperrereignisse: [
        { typ: 'krankheit_unfall', von: '2025-05-01', bis: '2025-06-30' },
      ],
    });
    expect(result.status).toBe('nichtig');
  });

  // T5 – Hemmung+Erstreckung: Beginn 01.01.2020, Zugang 31.03.2025, 2 Monate,
  //      Krankheit 10.04.–20.05.2025 (41 Tage) → 31.07.2025
  it('T5: Hemmung 41 Tage → Erstreckung auf 31.07.2025', () => {
    const result = berechneSperrfristen({
      vertragsbeginn: '2020-01-01',
      zugangKuendigung: '2025-03-31',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
      sperrereignisse: [
        { typ: 'krankheit_unfall', von: '2025-04-10', bis: '2025-05-20' },
      ],
    });
    expect(result.status).toBe('ok');
    expect(result.ergebnis).toContain('31.07.2025');
  });

  // T6 – AN-Kündigung trotz Krankheit → gültig, Art. 336c greift nicht
  it('T6: Arbeitnehmerkündigung trotz Krankheit → gültig, kein Sperrereignis-Effekt', () => {
    const result = berechneSperrfristen({
      vertragsbeginn: '2020-01-01',
      zugangKuendigung: '2025-05-10',
      kuendigendePartei: 'arbeitnehmer',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
      sperrereignisse: [
        { typ: 'krankheit_unfall', von: '2025-05-01', bis: '2025-06-30' },
      ],
    });
    expect(result.status).toBe('ok');
    expect(result.status).not.toBe('nichtig');
  });

  // Militär > 11 Tage → 4 Wochen davor/danach (Zugang vor der erweiterten Sperrfrist)
  it('Militär > 11 Tage → Zugang vor erweiterter Sperrfrist → ok', () => {
    const result = berechneSperrfristen({
      vertragsbeginn: '2020-01-01',
      zugangKuendigung: '2025-05-01',   // Zugang vor der erweiterten Sperrfrist
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
      sperrereignisse: [
        { typ: 'militaer_zivil', von: '2025-06-01', bis: '2025-06-21' }, // 21 Tage
      ],
    });
    // 4 Wochen vor 2025-06-01 = 2025-05-04; Zugang 01.05 < 04.05 → NICHT in Sperrfrist
    expect(result.status).toBe('ok');
  });

  // Keine Sperrereignisse → Normales Ergebnis
  it('Keine Sperrereignisse → normales Beendigungsdatum', () => {
    const result = berechneSperrfristen({
      vertragsbeginn: '2023-01-01',
      zugangKuendigung: '2025-04-15',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
      sperrereignisse: [],
    });
    expect(result.status).toBe('ok');
    expect(result.ergebnis).toContain('30.06.2025');
  });
});

describe('Bug-Check-Fix 10.6.2026: Probezeit-Ende (Art. 335b OR) — seit RL-16b nach BGE 144 III 152', () => {
  // Bis 25.9.2026: «erster Arbeitstag zählt mit, 1 Monat ab 1.4. endet am 30.4.».
  // Seit RL-16b (Gegenprüfung, deklarierte Fachänderung): BGE 144 III 152
  // E. 4.4.3 — der Tag des Stellenantritts zählt nicht (Vertragsschluss am
  // Antrittstag), Art. 77 Abs. 1 Ziff. 3 OR → Ende am gleichnamigen Tag 1.5.
  it('1 Monat Probezeit ab 1.4. endet am 1.5. — Zugang 2.5. ist ORDENTLICHE Kündigung', () => {
    const inProbe = berechneKuendigungsfrist({ vertragsbeginn: '2026-04-01', zugangKuendigung: '2026-05-01', kuendigendePartei: 'arbeitgeber', kuendigungsterminMonatsende: true, probezeitMonate: 1 });
    expect(inProbe.istProbezeit).toBe(true);
    const danach = berechneKuendigungsfrist({ vertragsbeginn: '2026-04-01', zugangKuendigung: '2026-05-02', kuendigendePartei: 'arbeitgeber', kuendigungsterminMonatsende: true, probezeitMonate: 1 });
    expect(danach.istProbezeit).toBe(false);
    expect(ds(danach.beendigungsdatum!)).toBe('2026-06-30');
  });
});

describe('SHK-Abgleich-Fix 10.6.2026 (B1): Art. 335c Abs. 3 OR — Vaterschafts-Resttage laufen taggenau ÜBER den Endtermin hinaus', () => {
  // Soll-Regel (normen/arbeitsrecht-shk-abgleich.md B1, SHK 335c N 16): erst
  // ordentlicher Endtermin (Monatsende), DANN + Resttage taggenau. Vorher wurden
  // die Resttage vor der Monatsende-Erstreckung addiert und vom Rounding
  // verschluckt (Verlängerung blieb wirkungslos — Abs. 3 ist teilzwingend).
  it('Zugang 15.03., 1 Monat, Monatsende, 10 Resttage → 10.05. (nicht 30.04.)', () => {
    const r = berechneKuendigungsfrist({
      vertragsbeginn: '2025-06-01',
      zugangKuendigung: '2026-03-15',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
      vaterschaftsurlaubResttage: 10,
    });
    expect(r.fristMonate).toBe(1);
    expect(ds(r.beendigungsdatum!)).toBe('2026-05-10'); // 30.04. + 10 Tage
  });

  it('ohne Monatsendtermin: taggenau 15.04. + 10 Resttage → 25.04.', () => {
    const r = berechneKuendigungsfrist({
      vertragsbeginn: '2025-06-01',
      zugangKuendigung: '2026-03-15',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: false,
      vaterschaftsurlaubResttage: 10,
    });
    expect(ds(r.beendigungsdatum!)).toBe('2026-04-25');
  });

  it('Resttage über den Monatswechsel: 35 Resttage ab 30.04. → 04.06.', () => {
    const r = berechneKuendigungsfrist({
      vertragsbeginn: '2025-06-01',
      zugangKuendigung: '2026-03-15',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
      vaterschaftsurlaubResttage: 35,
    });
    expect(ds(r.beendigungsdatum!)).toBe('2026-06-04');
  });

  it('Arbeitnehmerkündigung: Resttage ohne Wirkung (Abs. 3 nur bei AG-Kündigung)', () => {
    const r = berechneKuendigungsfrist({
      vertragsbeginn: '2025-06-01',
      zugangKuendigung: '2026-03-15',
      kuendigendePartei: 'arbeitnehmer',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
      vaterschaftsurlaubResttage: 10,
    });
    expect(ds(r.beendigungsdatum!)).toBe('2026-04-30');
  });

  it('Sperrfristen-Rückrechnung bleibt am ORDENTLICHEN Endtermin verankert (Fenster nicht durch Resttage verschoben)', () => {
    // Sperrgrund 02.04.–10.04. liegt in der rückgerechneten Frist (30.03.–30.04.);
    // würde das Fenster um die Resttage nach hinten rutschen (09.04.–10.05.),
    // gingen Hemmungstage verloren.
    const r = berechneSperrfristen({
      vertragsbeginn: '2025-06-01',
      zugangKuendigung: '2026-03-15',
      kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1,
      kuendigungsterminMonatsende: true,
      vaterschaftsurlaubResttage: 10,
      sperrereignisse: [
        { typ: 'krankheit_unfall', von: '2026-04-02', bis: '2026-04-10' },
      ],
    });
    expect(r.status).toBe('ok');
    expect(r.gehemmtTage).toBeGreaterThan(0);
  });
});
