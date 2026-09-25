// RL-16 (W2·30-RL-W2A) — Probezeit: Verlängerung (Warnung, Stufe 1),
// Anzeige-Ende, Höchstdauer, halber Monat.
//
// Befunde (Prüfung Rechtslogik 23.9.2026): F4-02 = S3c-b (Art. 335b Abs. 3 OR
// fehlt), F4-03 = VB-05 (Rechenweg zeigt Probezeitende +1 Tag), F4-04
// (Probezeit > 3 Monate still gekappt), S3b-a (addMonths(…, 0.5) verschluckt
// den GAV-Halbmonat). Entscheid David 24.9.2026 W-08 (a): Warnung sofort.
// Nachtrag RL-16b (25.9.2026, W-08 (b)): Stufe 2 RECHNET die Verlängerung
// (BGE 148 III 126 E. 5.2.6/5.2.7); die F4-02-Fälle unten erwarten seither das
// gerechnete Ergebnis statt der Stufe-1-Warnung (deklarierte Fachänderung).
//
// Norm (Fedlex SR 220, Konsolidierung 20260101, in Kraft 1.1.–30.9.2026 laut
// SPARQL dateApplicability; Wortlaut in 20261001 unverändert; abgerufen
// 24.9.2026 über den Filestore-XML-Pfad
// https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/27/317_321_377/20260101/de/xml/fedlex-data-admin-ch-eli-cc-27-317_321_377-20260101-de-xml-12.xml):
//   Art. 335b Abs. 2 OR — Probezeit «darf jedoch auf höchstens drei Monate
//   verlängert werden». Abs. 3 — «Bei einer effektiven Verkürzung der
//   Probezeit infolge Krankheit, Unfall oder Erfüllung einer nicht freiwillig
//   übernommenen gesetzlichen Pflicht erfolgt eine entsprechende Verlängerung
//   der Probezeit.»
//   Art. 77 Abs. 1 Ziff. 3 Satz 2 OR — «halber Monat» = 15 Tage, die bei einer
//   Frist von Monaten und einem halben Monat zuletzt zu zählen sind.
import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import { berechneKuendigungsfrist } from '../lib/kuendigungsfrist';
import { berechneSperrfristen } from '../lib/sperrfristen';
import type { SperrfristenInput } from '../types/legal';

const ds = (d: Date | undefined) => (d ? format(d, 'yyyy-MM-dd') : undefined);

const PZ_FALL: SperrfristenInput = {
  vertragsbeginn: '2025-01-01',
  zugangKuendigung: '2025-02-05',
  kuendigendePartei: 'arbeitgeber',
  probezeitMonate: 1,
  kuendigungsterminMonatsende: true,
  sperrereignisse: [{ typ: 'krankheit_unfall', von: '2025-01-10', bis: '2025-01-19' }],
};

const hatPzWarnung = (w: string[]) => w.some((x) => x.includes('Art. 335b Abs. 3 OR'));

describe('F4-03 / VB-05 — Rechenweg zeigt dasselbe Probezeitende wie die Logik', () => {
  // Nachtrag RL-16b (25.9.2026, deklarierte Fachänderung): Das Ende selbst
  // folgt seither BGE 144 III 152 E. 4.4.3 (gleichnamiger Tag, 01.02.) statt
  // der Vortags-Regel (31.01.); geprüft bleibt, dass Rechenweg und Logik
  // dasselbe Ende zeigen.
  it('VB 1.1.2025, 1 Monat → Ende 01.02.2025 (BGE 144 III 152), Rechenweg = Logik', () => {
    const r = berechneKuendigungsfrist({
      vertragsbeginn: '2025-01-01', zugangKuendigung: '2025-09-10', kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1, kuendigungsterminMonatsende: true,
    });
    const s1 = r.ergebnis.rechenweg[0].zwischenergebnis;
    expect(s1).toContain('Ende 01.02.2025');
    expect(s1).not.toContain('31.01.2025');
  });

  it('Zugang in der Probezeit: VB 1.1.2026, Zugang 20.1.2026 → Ende 01.02.2026', () => {
    const r = berechneKuendigungsfrist({
      vertragsbeginn: '2026-01-01', zugangKuendigung: '2026-01-20', kuendigendePartei: 'arbeitgeber',
      probezeitMonate: 1, kuendigungsterminMonatsende: true,
    });
    expect(r.istProbezeit).toBe(true);
    expect(r.ergebnis.rechenweg[0].zwischenergebnis).toContain('Ende 01.02.2026');
  });
});

describe('F4-04 — vereinbarte Probezeit über drei Monate wird offengelegt (Art. 335b Abs. 2 OR)', () => {
  const eingabe = {
    vertragsbeginn: '2025-01-01', zugangKuendigung: '2025-04-15', kuendigendePartei: 'arbeitgeber' as const,
    probezeitMonate: 4, kuendigungsterminMonatsende: true,
  };

  it('Kündigungsfrist: gerechnet mit 3 Monaten + Warnung', () => {
    const r = berechneKuendigungsfrist(eingabe);
    // 3 Monate ab 1.1. enden am 31.3. → Zugang 15.4. ausserhalb der Probezeit.
    expect(r.istProbezeit).toBe(false);
    expect(r.ergebnis.warnungen.some((w) => w.includes('Art. 335b Abs. 2 OR') && w.includes('4 Monate'))).toBe(true);
  });

  it('Sperrfristen-Rechner (Formular) reicht die Warnung durch — ohne und mit Ereignis', () => {
    const ohne = berechneSperrfristen(eingabe);
    expect(ohne.warnungen.some((w) => w.includes('Art. 335b Abs. 2 OR'))).toBe(true);
    const mit = berechneSperrfristen({
      ...eingabe, sperrereignisse: [{ typ: 'krankheit_unfall', von: '2025-04-20', bis: '2025-04-25' }],
    });
    expect(mit.warnungen.some((w) => w.includes('Art. 335b Abs. 2 OR'))).toBe(true);
  });

  it('bis 3 Monate: keine Warnung', () => {
    const r = berechneKuendigungsfrist({ ...eingabe, probezeitMonate: 3 });
    expect(r.ergebnis.warnungen.some((w) => w.includes('Art. 335b Abs. 2 OR'))).toBe(false);
  });
});

describe('S3b-a — halber Monat = 15 Tage, zuletzt gezählt (Art. 77 Abs. 1 Ziff. 3 OR)', () => {
  const gav = {
    vertragsbeginn: '2025-01-01', zugangKuendigung: '2025-02-20', kuendigendePartei: 'arbeitgeber' as const,
    probezeitMonate: 1, abweichendeFristFormGueltig: true, abweichendeFristQuelleGAV: true,
  };

  it('GAV, 1. DJ, 0,5 Monate, freier Termin: Zugang 20.2.2025 → 07.03.2025', () => {
    const r = berechneKuendigungsfrist({ ...gav, abweichendeFristMonate: 0.5, kuendigungsterminMonatsende: false });
    expect(r.fristMonate).toBe(0.5);
    expect(ds(r.beendigungsdatum)).toBe('2025-03-07');
  });

  it('GAV, 1. DJ, 0,5 Monate, Monatsende: Zugang 20.2.2025 → 31.03.2025 (nicht 28.02.)', () => {
    const r = berechneKuendigungsfrist({ ...gav, abweichendeFristMonate: 0.5, kuendigungsterminMonatsende: true });
    expect(ds(r.beendigungsdatum)).toBe('2025-03-31');
  });

  it('1,5 Monate (schriftlich): Zugang 20.2.2025 → 20.3. + 15 Tage = 04.04.2025', () => {
    const r = berechneKuendigungsfrist({
      ...gav, abweichendeFristQuelleGAV: false, abweichendeFristMonate: 1.5, kuendigungsterminMonatsende: false,
    });
    expect(ds(r.beendigungsdatum)).toBe('2025-04-04');
  });

  it('Rückrechnung (Sperrfristen): Endtermin 31.3. − 15 Tage → Fenster ab 16.3.; Krankheit 3.–5.3. hemmt nicht', () => {
    const r = berechneSperrfristen({
      ...gav, abweichendeFristMonate: 0.5, kuendigungsterminMonatsende: true,
      sperrereignisse: [{ typ: 'krankheit_unfall', von: '2025-03-03', bis: '2025-03-05' }],
    });
    expect(r.status).not.toBe('nichtig');
    expect(r.beendigungISO).toBe('2025-03-31');
    expect(r.gehemmtTage ?? 0).toBe(0);
  });

  it('andere Bruchteile als ein halber Monat werden offengelegt', () => {
    const r = berechneKuendigungsfrist({ ...gav, abweichendeFristMonate: 0.3, kuendigungsterminMonatsende: false });
    expect(r.ergebnis.warnungen.some((w) => w.includes('Art. 77'))).toBe(true);
  });
});

describe('F4-02 / S3c-b — Probezeitverlängerung Art. 335b Abs. 3 OR: gerechnet (W-08 Stufe 2, RL-16b)', () => {
  // Stufe 1 (RL-16, 24.9.2026) erwartete hier die Warnung «nicht gerechnet»
  // und die ordentliche Frist. Stufe 2: 6 Arbeitstage Mo–Fr (10., 13.–17.1.)
  // → Probezeit bis 10.2.2025 → Zugang 5.2. in der Probezeit → 12.2.2025.
  const stufe1Warnung = (w: string[]) => w.some((x) => x.includes('nicht gerechnet'));

  it('VB 1.1.2025, PZ 1 Mt, krank 10.–19.1., Zugang 5.2. → verlängerte Probezeit, Beendigung 12.02.2025', () => {
    const r = berechneSperrfristen(PZ_FALL);
    expect(r.beendigungISO).toBe('2025-02-12');
    expect(stufe1Warnung(r.warnungen)).toBe(false);
  });

  it('Folgefall: zusätzlich krank ab 3.2. — Zugang liegt in der verlängerten Probezeit, keine Sperrfrist', () => {
    const r = berechneSperrfristen({
      ...PZ_FALL,
      sperrereignisse: [...PZ_FALL.sperrereignisse!, { typ: 'krankheit_unfall', von: '2025-02-03', bis: '2025-02-20' }],
    });
    expect(r.status).not.toBe('nichtig');
    expect(r.beendigungISO).toBe('2025-02-12');
  });

  it('Militär-/Zivildienst in der Probezeit (gesetzliche Pflicht) → verlängert (5 Tage, Ende 7.2.) → 12.02.2025', () => {
    const r = berechneSperrfristen({
      ...PZ_FALL, sperrereignisse: [{ typ: 'militaer_zivil', von: '2025-01-13', bis: '2025-01-17' }],
    });
    expect(r.beendigungISO).toBe('2025-02-12');
  });

  it('Arbeitnehmerkündigung: 7-Tage-Frist in der verlängerten Probezeit', () => {
    const r = berechneSperrfristen({ ...PZ_FALL, kuendigendePartei: 'arbeitnehmer' });
    expect(r.beendigungISO).toBe('2025-02-12');
    expect(stufe1Warnung(r.warnungen)).toBe(false);
  });

  it('Ereignis nur nach der Probezeit → keine Warnung', () => {
    const r = berechneSperrfristen({
      ...PZ_FALL, sperrereignisse: [{ typ: 'krankheit_unfall', von: '2025-02-03', bis: '2025-02-10' }],
    });
    expect(hatPzWarnung(r.warnungen)).toBe(false);
  });

  it('Zugang ohnehin in der Probezeit → keine Warnung (Verlängerung ändert nichts)', () => {
    const r = berechneSperrfristen({ ...PZ_FALL, zugangKuendigung: '2025-01-25' });
    expect(r.warnungen.some((w) => w.includes('Art. 335b Abs. 3 OR'))).toBe(false);
  });

  it('Schwangerschaft ist kein Verlängerungsgrund nach Abs. 3 → keine Warnung', () => {
    const r = berechneSperrfristen({
      ...PZ_FALL, sperrereignisse: [{ typ: 'schwangerschaft', von: '2025-01-10', bis: '2025-09-30' }],
    });
    expect(hatPzWarnung(r.warnungen)).toBe(false);
  });
});
