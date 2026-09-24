// RL-13 PR 1 (W2·30-RL-W1) — Rückfall derselben Krankheit aus dem Restkontingent.
//
// Befunde: UI-06 (Prüfung Rechtslogik 23.9.2026, Zweitprüfung V10: BESTÄTIGT, HOCH)
// und S3f-3. Entscheid David 24.9.2026 (W-04 «Rechnen + offenlegen»).
//
// Norm (Fedlex SR 220, Konsolidierung 20260101, in Kraft 1.1.–30.9.2026 laut
// SPARQL dateApplicability, abgerufen 24.9.2026,
// https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_336_c):
//   Art. 336c Abs. 1 lit. b OR — Kündigungsverbot «während der Arbeitnehmer …
//   durch Krankheit oder durch Unfall … verhindert ist, und zwar im ersten
//   Dienstjahr während 30 Tagen, ab zweitem bis und mit fünftem Dienstjahr während
//   90 Tagen und ab sechstem Dienstjahr während 180 Tagen». Abs. 2: Kündigung in
//   der Sperrfrist nichtig; vorher erklärte Kündigung → Fristablauf unterbrochen.
// Lesart (W-04): Die Tageszahl ist Obergrenze je Verhinderungsgrund. Ein Rückfall
// derselben Ursache ist erneutes Verhindertsein aus DEMSELBEN Grund → kein neues
// Kontingent, aber der Rest des ursprünglichen Kontingents schützt weiter.
// BGE 120 II 124 E. 3d/e (entscheidsuche CH_BGE_004_BGE-120-II-124_1994, gelesen
// 24.9.2026) entscheidet nur: Ereignisse «n'ayant aucun lien entre eux» lösen je
// eine NEUE Sperrfrist aus — zum Rückfall sagt er nichts; die Restkontingent-
// Lesart ist gerichtlich nicht bestätigt und wird darum offengelegt.
//
// Zählweise (Engine-Konvention §1.2): Beim Ersteintritt zählt der Anfangstag
// nicht (Art. 77 OR, beansprucht = Tage nach dem Anfangstag). Im Rückfall läuft
// dieselbe Sperrfrist weiter — jeder Tag der erneuten Verhinderung zählt gegen
// den Rest (kein zweiter ausgenommener Anfangstag). So ergibt eine zweigeteilte
// Krankheit nie mehr Schutztage als dieselbe Krankheit am Stück.
import { describe, it, expect } from 'vitest';
import { berechneSperrfristen } from '../lib/sperrfristen';
import type { SperrfristenInput } from '../types/legal';

// V10-Messfall: 1. Dienstjahr, Vertragsbeginn 1.3.2025, Frist 1 Monat auf Monatsende.
// Ersterkrankung 20.–29.8.2025: beansprucht 9 (Art. 77), Rest 30 − 9 = 21.
const V10: Omit<SperrfristenInput, 'zugangKuendigung'> = {
  vertragsbeginn: '2025-03-01',
  kuendigendePartei: 'arbeitgeber',
  probezeitMonate: 1,
  kuendigungsterminMonatsende: true,
  sperrereignisse: [
    { typ: 'krankheit_unfall', von: '2025-08-20', bis: '2025-08-29' },
    { typ: 'krankheit_unfall', von: '2025-09-15', bis: '2025-10-31', gleicheUrsacheWieEreignis: 0 },
  ],
};

describe('Rückfall aus Restkontingent (Art. 336c Abs. 1 lit. b, Abs. 2 OR) — UI-06', () => {
  it('V10: Zugang 10.8.2025, Rückfall 15.9.–31.10. hemmt 21 Resttage → Beendigung 31.10.2025', () => {
    // Ordentliches Ende 30.9.2025; rückgerechnete Frist 31.8.–30.9. → E1 (bis 29.8.)
    // hemmt nicht. Rückfall-Sperrfrist 15.9.–5.10. (21 Tage) schneidet die Frist:
    // 30.9. + 21 = 21.10. → Endtermin Monatsende (Art. 336c Abs. 3) = 31.10.2025.
    const r = berechneSperrfristen({ ...V10, zugangKuendigung: '2025-08-10' });
    expect(r.status).toBe('ok');
    expect(r.gehemmtTage).toBe(21);
    expect(r.beendigungISO).toBe('2025-10-31');
  });

  it('V10-Zusatz: Zugang 18.9.2025 mitten im Rückfall (Rest offen) → NICHTIG (Abs. 2 Satz 1)', () => {
    const r = berechneSperrfristen({ ...V10, zugangKuendigung: '2025-09-18' });
    expect(r.status).toBe('nichtig');
    expect(r.beendigungISO).toBeUndefined();
    expect(r.sperrfristEndeISO).toBe('2025-10-05');          // 15.9. + 21 Tage − 1 (jeder Tag zählt)
    expect(r.fruehesteNeueKuendigungISO).toBe('2025-10-06');
  });

  it('V10: Sperrtage-Zähler des Rückfalls — 21 von 21 Resttagen, Kontingent des Ursprungs', () => {
    const r = berechneSperrfristen({ ...V10, zugangKuendigung: '2025-08-10' });
    const z = r.sperrtage![1];
    expect(z.rueckfall).toBe(true);
    expect(z.vonISO).toBe('2025-09-15');
    expect(z.bisISO).toBe('2025-10-05');
    expect(z.beansprucht).toBe(21);
    expect(z.kontingent).toBe(30);
    expect(z.verbleibend).toBe(0);
    expect(r.sperrIntervalle).toContainEqual({ von: '2025-09-15', bis: '2025-10-05', typ: 'krankheit_unfall' });
  });

  it('UI-06-Beispiel (rekonstruiert): 2. DJ, E1 1.–20.4., Rückfall 10.5.–10.6.2025 → 52 Hemmungstage, Ende 31.07.2025', () => {
    // VB 1.1.2024 (2. DJ → 90 Tage, Frist 2 Monate), Zugang 15.3.2025 → ordentlich 31.5.2025,
    // rückgerechnete Frist 1.4.–31.5. E1 hemmt 20 Kalendertage (1.–20.4.), beansprucht 19 → Rest 71.
    // Rückfall 10.5.–10.6. liegt ganz im Rest → 32 Tage. 31.5. + 52 = 22.7. → 31.7.2025.
    const r = berechneSperrfristen({
      vertragsbeginn: '2024-01-01', zugangKuendigung: '2025-03-15', kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1, kuendigungsterminMonatsende: true,
      sperrereignisse: [
        { typ: 'krankheit_unfall', von: '2025-04-01', bis: '2025-04-20' },
        { typ: 'krankheit_unfall', von: '2025-05-10', bis: '2025-06-10', gleicheUrsacheWieEreignis: 0 },
      ],
    });
    expect(r.status).toBe('ok');
    expect(r.gehemmtTage).toBe(52);
    expect(r.beendigungISO).toBe('2025-07-31');
  });

  it('Kontingent erschöpft: Rückfall ohne Resttage schützt nicht (keine Mehrgewährung)', () => {
    // E1 20.8.–10.10.2025 im 1. DJ: Sperrfrist 20.8.–19.9. (30 Tage), Rest 0.
    const r = berechneSperrfristen({
      ...V10,
      zugangKuendigung: '2025-08-10',
      sperrereignisse: [
        { typ: 'krankheit_unfall', von: '2025-08-20', bis: '2025-10-10' },
        { typ: 'krankheit_unfall', von: '2025-10-15', bis: '2025-10-31', gleicheUrsacheWieEreignis: 0 },
      ],
    });
    expect(r.status).toBe('ok');
    // Rückgerechnete Frist 31.8.–30.9. (dies a quo 30.8., Art. 77 Abs. 1 Ziff. 3 OR):
    // E1 hemmt 31.8.–19.9. = 20 Tage → 30.9. + 20 = 20.10. → Monatsende 31.10.2025.
    expect(r.beendigungISO).toBe('2025-10-31');
    expect(r.gehemmtTage).toBe(20);
    const z = r.sperrtage![1];
    expect(z.rueckfall).toBe(true);
    expect(z.beansprucht).toBe(0);
    expect(z.verbleibend).toBe(0);
    expect(r.sperrIntervalle).toHaveLength(1);
  });

  it('Zweiter Rückfall (auch über einen Rückfall verkettet) zehrt vom selben Rest', () => {
    // Rest 21 nach E1; Rückfall 1: 1.–10.9. (10 Tage) → Rest 11; Rückfall 2 ab 20.9. → 20.–30.9.
    const r = berechneSperrfristen({
      ...V10,
      zugangKuendigung: '2025-08-10',
      sperrereignisse: [
        { typ: 'krankheit_unfall', von: '2025-08-20', bis: '2025-08-29' },
        { typ: 'krankheit_unfall', von: '2025-09-01', bis: '2025-09-10', gleicheUrsacheWieEreignis: 0 },
        { typ: 'krankheit_unfall', von: '2025-09-20', bis: '2025-10-31', gleicheUrsacheWieEreignis: 1 },
      ],
    });
    const [, r1, r2] = r.sperrtage!;
    expect(r1.beansprucht).toBe(10);
    expect(r1.verbleibend).toBe(11);
    expect(r2.bisISO).toBe('2025-09-30');
    expect(r2.beansprucht).toBe(11);
    expect(r2.verbleibend).toBe(0);
    expect(r2.kontingent).toBe(30);
  });

  it('Offenlegung (W-04): Ergebnis und Hinweise nennen die gerichtlich nicht bestätigte Lesart', () => {
    for (const zugang of ['2025-08-10', '2025-09-18']) {
      const r = berechneSperrfristen({ ...V10, zugangKuendigung: zugang });
      expect(r.ergebnis).toContain('Rückfall aus dem Restkontingent gerechnet');
      expect(r.ergebnis).toContain('nicht gerichtlich bestätigt');
      const w = r.warnungen.find((x) => x.startsWith('Rückfall (Ereignis 2, gleiche Ursache wie Ereignis 1)'));
      expect(w, 'Offenlegungs-Hinweis fehlt').toBeDefined();
      expect(w).toContain('Art. 336c Abs. 1 lit. b OR');
      expect(w).toContain('BGE 120 II 124');
    }
  });

  it('Ohne Rückfall: keine Rückfall-Offenlegung im Ergebnis', () => {
    const r = berechneSperrfristen({ ...V10, zugangKuendigung: '2025-08-10', sperrereignisse: [V10.sperrereignisse![0]] });
    expect(r.ergebnis).not.toContain('Restkontingent');
  });

  it('Dienstjahreswechsel zwischen Ersterkrankung und Rückfall wird offengelegt', () => {
    // E1 im 1. DJ (30 Tage), Rückfall nach dem Jahrestag 1.3.2026 (2. DJ).
    const r = berechneSperrfristen({
      vertragsbeginn: '2025-03-01', zugangKuendigung: '2026-03-10', kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1, kuendigungsterminMonatsende: true,
      sperrereignisse: [
        { typ: 'krankheit_unfall', von: '2025-08-20', bis: '2025-08-29' },
        { typ: 'krankheit_unfall', von: '2026-04-01', bis: '2026-04-30', gleicheUrsacheWieEreignis: 0 },
      ],
    });
    expect(r.sperrtage![1].kontingent).toBe(30);
    expect(r.warnungen.some((w) => w.includes('Dienstjahr') && w.includes('Rückfall'))).toBe(true);
  });

  it('Bezug auf ein Ereignis, das keine Krankheit/kein Unfall ist → eigenständige Sperrfrist + Hinweis', () => {
    const r = berechneSperrfristen({
      ...V10,
      zugangKuendigung: '2025-08-10',
      sperrereignisse: [
        { typ: 'militaer_zivil', von: '2025-08-20', bis: '2025-08-25' },
        { typ: 'krankheit_unfall', von: '2025-09-15', bis: '2025-09-24', gleicheUrsacheWieEreignis: 0 },
      ],
    });
    const z = r.sperrtage![1];
    expect(z.rueckfall).toBeUndefined();
    expect(z.kontingent).toBe(30);
    expect(r.warnungen.some((w) => w.includes('als eigenständige Ursache gerechnet'))).toBe(true);
  });

  it('Rückfall-Bezug an einem Nicht-Krankheits-Ereignis (Typ nachträglich gewechselt) wird ignoriert', () => {
    // Das Formular behält gleicheUrsacheWieEreignis beim Typwechsel; eine Schwangerschaft
    // darf dadurch nicht als «Rückfall» ihren Schutz (lit. c) verlieren.
    const r = berechneSperrfristen({
      ...V10,
      zugangKuendigung: '2025-09-18',
      sperrereignisse: [
        { typ: 'krankheit_unfall', von: '2025-08-20', bis: '2025-08-29' },
        { typ: 'schwangerschaft', von: '2025-09-01', bis: '2026-03-31', gleicheUrsacheWieEreignis: 0 },
      ],
    });
    expect(r.status).toBe('nichtig');
    expect(r.sperrtage![1].rueckfall).toBeUndefined();
  });
});

describe('Stütze für PR 2 (UI-05): Engine-Soll Urlaub des andern Elternteils', () => {
  it('Vaterschafts-Resttage 10 (Art. 335c Abs. 3 OR) → Beendigung 10.06.2025 statt 31.05.2025', () => {
    // 1. DJ (VB 1.9.2024), Zugang 20.4.2025 → ordentlich 31.5.2025, + 10 Resttage taggenau.
    const r = berechneSperrfristen({
      vertragsbeginn: '2024-09-01', zugangKuendigung: '2025-04-20', kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1, kuendigungsterminMonatsende: true, vaterschaftsurlaubResttage: 10,
      sperrereignisse: [],
    });
    expect(r.beendigungISO).toBe('2025-06-10');
  });
});
