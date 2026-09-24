import { describe, it, expect } from 'vitest';
import { berechneLohnfortzahlung } from '../lib/lohnfortzahlung';

describe('Lohnfortzahlung (Art. 324a OR)', () => {
  // LA1 – Basler Skala, 1. DJ, 100%, ab 01.01.2026 → letzter bezahlter Tag 21.01.2026
  it('LA1: BS 1.DJ 100% ab 01.01.2026 → letzter bezahlter Tag 21.01.2026', () => {
    const result = berechneLohnfortzahlung({
      vertragsbeginn: '2025-09-01',          // > 3 Monate, 1. DJ
      verhinderungBeginn: '2026-01-01',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
    });
    expect(result.status).toBe('ok');
    expect(result.ergebnis).toContain('21.01.2026');
  });

  // LA2 – Basler Skala, 3. DJ, 100% → 2 Monate
  it('LA2: BS 3.DJ 100% → Basler Skala 2 Monate', () => {
    const result = berechneLohnfortzahlung({
      vertragsbeginn: '2024-01-01',          // 3. DJ in 2026
      verhinderungBeginn: '2026-01-15',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
    });
    expect(result.status).toBe('ok');
    expect(result.ergebnis).toContain('Monat');
    // Letzter bezahlter Tag: 15.01.2026 + 2 Monate - 1 = 14.03.2026
    expect(result.ergebnis).toContain('14.03.2026');
  });

  // LA3 – Basler Skala, 1. DJ, 50% ab 17.06.2026 → 6 Wochen (Budget-Modell)
  it('LA3: BS 1.DJ 50% ab 17.06.2026 → 6 Wochen Budget-Modell', () => {
    const result = berechneLohnfortzahlung({
      vertragsbeginn: '2026-01-01',          // 1. DJ, > 3 Monate bis Jun
      verhinderungBeginn: '2026-06-17',
      arbeitsunfaehigkeitProzent: 50,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
    });
    expect(result.status).toBe('ok');
    expect(result.ergebnis).toContain('6 Wochen');
  });

  // LA4 – AV-Dauer < 3 Monate → kein_anspruch
  // RL-25b (rechtslogik-rest-01, Fachänderung): die Karenzfrist verschiebt den
  // Anspruch auf den ersten Tag des vierten Monats (BGE 131 III 623 E. 2.4),
  // sie verneint ihn nicht. Ohne Ende der Verhinderung wird Andauern angenommen;
  // der Fall «Verhinderung endet in der Karenzfrist» steht in rl25b-lohnfortzahlung.test.ts.
  it('LA4: AV-Dauer < 3 Monate → Karenzfrist, Anspruch erst ab 1. Tag des 4. Monats', () => {
    const result = berechneLohnfortzahlung({
      vertragsbeginn: '2026-01-01',
      verhinderungBeginn: '2026-03-01',       // 2 Monate, keine vollen 3 Monate
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'ZH',
      ktgGleichwertigVorhanden: false,
    });
    expect(result.status).toBe('ok');
    expect(result.zeitraumVonISO).toBe('2026-04-01');
    expect(result.letzterTagISO).toBe('2026-04-21');
  });

  // LA5 – KTG gleichwertig → ktg_regime, keine Skala
  it('LA5: ktgGleichwertigVorhanden=true → ktg_regime, keine Skalen-Berechnung', () => {
    const result = berechneLohnfortzahlung({
      vertragsbeginn: '2024-01-01',
      verhinderungBeginn: '2026-01-01',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'ZH',
      ktgGleichwertigVorhanden: true,
    });
    expect(result.status).toBe('ktg_regime');
    expect(result.ergebnis).toContain('KTG');
    // Kein Skalaeintrag im Rechenweg
    expect(result.rechenweg.some((s) => s.beschreibung.includes('Skala-Dauer ablesen'))).toBe(false);
  });

  // Edge case: Kanton ZH, Zürcher Skala, 2. DJ → 8 Wochen
  it('ZH 2.DJ → 8 Wochen', () => {
    const result = berechneLohnfortzahlung({
      vertragsbeginn: '2025-01-01',
      verhinderungBeginn: '2026-01-15',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'ZH',
      ktgGleichwertigVorhanden: false,
    });
    expect(result.status).toBe('ok');
    expect(result.ergebnis).toContain('8 Wochen');
  });

  // Edge case: Kanton BE, 5. DJ → 3 Monate
  it('BE 5.DJ → 3 Monate Berner Skala', () => {
    const result = berechneLohnfortzahlung({
      vertragsbeginn: '2021-01-01',
      verhinderungBeginn: '2026-01-15',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BE',
      ktgGleichwertigVorhanden: false,
    });
    expect(result.status).toBe('ok');
    expect(result.ergebnis).toContain('3 Monate');
  });
});

describe('Lohnfortzahlung P1/P2 (Art. 324a OR)', () => {
  // §7.10 – Verhinderung über Dienstjahreswechsel → beide Kredite
  it('§7.10: Verhinderung über DJ-Wechsel → zwei Kredite', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2024-01-01',
      verhinderungBeginn: '2025-12-01',  // dj2 (Basler: 2 Monate)
      verhinderungEnde: '2026-06-01',    // reicht über Jahrestag 01.01.2026
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
    });
    expect(r.status).toBe('ok');
    expect(r.ergebnis).toContain('2. Kredit');
    expect(r.ergebnis).toContain('28.02.2026'); // 2. Kredit (dj3, 2 Monate) ab 01.01.2026
  });

  // Schaltjahr-Regression: Vertragsbeginn 29.2. → Jahrestag 28.2. (addYears, konsistent
  // mit differenceInYears in berechneDienstjahr), NICHT 1.3. (Date-Konstruktor-Überlauf).
  it('Schaltjahr: Vertragsbeginn 29.02.2020 → 2.-Kredit-Grenze 28.02.2021, nicht 01.03.2021', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2020-02-29',
      verhinderungBeginn: '2021-02-01',  // 1. DJ (Basler: 3 Wochen, endet 21.02.2021)
      verhinderungEnde: '2021-06-01',    // reicht über den Jahrestag hinaus
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
    });
    expect(r.status).toBe('ok');
    expect(r.ergebnis).toContain('2. Kredit');
    const txt = r.ergebnis + '\n' + r.rechenweg.map((s) => s.zwischenergebnis).join('\n');
    expect(txt).toContain('Jahrestag 28.02.2021');
    expect(txt).not.toContain('01.03.2021');
  });

  // §7.11 – Kredit im Vorjahr verbraucht → Anspruch lebt im neuen DJ wieder auf
  it('§7.11: Kredit verbraucht, neues DJ → Anspruch lebt auf', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2024-01-01',
      verhinderungBeginn: '2025-09-01',  // 1. Kredit endet 31.10.2025 (vor Jahrestag)
      verhinderungEnde: '2026-06-01',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
    });
    expect(r.status).toBe('ok');
    expect(r.ergebnis).toContain('01.01.2026'); // 2. Kredit ab Jahrestag
    expect(r.ergebnis).toContain('28.02.2026');
  });

  // §7.12 – Unbefristet, KF ≤ 3 Monate, Verhinderung in Monat 2 → kein Lohn bis Ablauf 3 Monate
  // RL-25b (rechtslogik-rest-01, Fachänderung): Karenzfrist statt absolutem «kein Anspruch».
  it('§7.12: Kündigungsfrist ≤ 3 Monate, Verhinderung in Monat 2 → Anspruch erst ab 1. Tag des 4. Monats', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2026-01-01',
      verhinderungBeginn: '2026-02-15',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
      vereinbarteKuendigungsfristMonate: 2, // ≤ 3
    });
    expect(r.status).toBe('ok');
    expect(r.zeitraumVonISO).toBe('2026-04-01');
    expect(r.letzterTagISO).toBe('2026-04-21');
  });

  // §7.13 – Befristet fest > 3 Monate, Verhinderung in Woche 2 → Anspruch ab Tag 1
  it('§7.13: Befristet fest > 3 Monate, Verhinderung in Woche 2 → Anspruch', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2026-01-01',
      verhinderungBeginn: '2026-01-08',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
      befristetFest: true,
    });
    expect(r.status).toBe('ok');
  });

  // §7.14 – Teil-AUF 50 % → doppelte Kalenderdauer, gleicher CHF-Kredit (Geldminimum)
  it('§7.14: Teil-AUF 50 % → doppelte Kalenderdauer (Geldminimum)', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2024-01-01',
      verhinderungBeginn: '2026-01-15',   // BS dj3 → 2 Monate
      arbeitsunfaehigkeitProzent: 50,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
      monatslohnBrutto: 6000,
    });
    expect(r.status).toBe('ok');
    expect(r.ergebnis).toContain('4 Monate'); // 2 Monate ÷ 0.5
    expect(r.rechenweg.some((s) => s.beschreibung.includes('Geld- statt Zeitminimum'))).toBe(true);
  });

  // §7.15 – Teilzeit 60 % + AUF 50 % → Pensum und AUF getrennt
  it('§7.15: Teilzeit 60 % + AUF 50 % → getrennte Grössen im Rechenweg', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2024-01-01',
      verhinderungBeginn: '2026-01-15',
      arbeitsunfaehigkeitProzent: 50,
      pensumProzent: 60,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
    });
    expect(r.status).toBe('ok');
    expect(r.rechenweg.some((s) => s.zwischenergebnis.includes('Beschäftigungsgrad 60'))).toBe(true);
  });

  // §7.16 – DJ > 11 → verifiziert: false, Fortschreibung markiert
  it('§7.16: DJ > 11 → Warnung «nicht belegt»', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2010-01-01',
      verhinderungBeginn: '2026-01-15',  // 17. DJ
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
    });
    expect(r.status).toBe('ok');
    expect(r.warnungen.some((w) => w.includes('nicht belegt'))).toBe(true);
  });
});

describe('Lohnfortzahlung – Koordination Art. 324b OR (Verhinderungsgrund)', () => {
  const ok = (over: object) => berechneLohnfortzahlung({
    vertragsbeginn: '2024-01-01', verhinderungBeginn: '2026-01-01',
    arbeitsunfaehigkeitProzent: 100, kanton: 'BS', ktgGleichwertigVorhanden: false, ...over,
  });

  it('Unfall → UVG-Koordination (80%, 2 Karenztage), Art. 324b im Rechenweg', () => {
    const r = ok({ verhinderungsgrund: 'unfall' });
    expect(r.status).toBe('ok');
    expect(r.ergebnis).toContain('Karenztage');
    expect(r.rechenweg.some((s) => s.beschreibung.includes('Koordination Unfall'))).toBe(true);
    expect(r.normverweise.some((n) => n.artikel === 'Art. 324b Abs. 1 OR')).toBe(true);
  });

  it('Dienst → EO-Koordination (Differenz zu 80%), Art. 324b', () => {
    const r = ok({ verhinderungsgrund: 'dienst' });
    expect(r.rechenweg.some((s) => s.beschreibung.includes('Koordination Dienst'))).toBe(true);
    expect(r.normverweise.some((n) => n.artikel === 'Art. 324b Abs. 2 OR')).toBe(true);
  });

  it('Schwangerschaft → Art. 324a Abs. 3 + EOG-Hinweis', () => {
    const r = ok({ verhinderungsgrund: 'schwangerschaft' });
    expect(r.ergebnis).toContain('EOG');
    expect(r.rechenweg.some((s) => s.normen.some((n) => n.artikel === 'Art. 324a Abs. 3 OR'))).toBe(true);
  });

  it('Krankheit (Default) → keine 324b-Koordination, Basis-Ergebnis unverändert', () => {
    const r = ok({ verhinderungsgrund: 'krankheit' });
    expect(r.ergebnis).toContain('Lohnfortzahlung bis und mit');
    expect(r.normverweise.some((n) => n.artikel.startsWith('Art. 324b'))).toBe(false);
  });
});

describe('Engine-Guard (Bug-Check)', () => {
  it('AUF 0 % oder negativ → unzulässig statt RangeError', () => {
    const basis = { vertragsbeginn: '2020-01-01', verhinderungBeginn: '2024-06-01', kanton: 'BE' as const, ktgGleichwertigVorhanden: false };
    expect(berechneLohnfortzahlung({ ...basis, arbeitsunfaehigkeitProzent: 0 }).status).toBe('unzulaessig');
    expect(berechneLohnfortzahlung({ ...basis, arbeitsunfaehigkeitProzent: -10 }).status).toBe('unzulaessig');
    expect(berechneLohnfortzahlung({ ...basis, arbeitsunfaehigkeitProzent: 150 }).status).toBe('unzulaessig');
  });
});

// ─── Coverage-Audit 6.6.2026 ─────────────────────────────────────────────────

describe('Coverage-Fix – verhinderungsgrund \'amt\' (Art. 324a Abs. 1 OR)', () => {
  it('öffentliches Amt: Skala läuft, Amtsentschädigung wird zur Anrechnung ausgewiesen', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2024-01-01', verhinderungBeginn: '2026-01-15',
      arbeitsunfaehigkeitProzent: 100, kanton: 'BS',
      ktgGleichwertigVorhanden: false, verhinderungsgrund: 'amt',
    });
    expect(r.status).toBe('ok');
    expect(r.ergebnis).toContain('14.03.2026'); // BS 3. DJ → 2 Monate
    const txt = r.rechenweg.map((s) => s.beschreibung + ' ' + s.zwischenergebnis).join('\n');
    expect(txt).toContain('Öffentliches Amt');
    expect(txt).toContain('anzurechnen');
  });
});

describe('Audit-Fix B5 – KTG-Kriterium «alle Risiken abgedeckt» wirkt', () => {
  it('alleRisikenAbgedeckt:false → Checkliste meldet Gleichwertigkeit fraglich', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2024-01-01', verhinderungBeginn: '2026-01-15',
      arbeitsunfaehigkeitProzent: 100, kanton: 'BS',
      ktgGleichwertigVorhanden: true,
      ktgKriterien: { alleRisikenAbgedeckt: false },
    });
    const alle = [r.ergebnis, ...r.warnungen, ...r.rechenweg.map((s) => s.zwischenergebnis)].join('\n');
    expect(alle).toContain('Gleichwertigkeit fraglich');
    expect(alle).toContain('Nicht alle relevanten Risiken abgedeckt');
  });
});

describe('Bug-Check-Fix 10.6.2026: Anspruch ab dem ERSTEN Tag des vierten Monats (Art. 324a Abs. 1 OR)', () => {
  it('Vertragsbeginn 1.1., Verhinderung ab 1.4.: Anspruch besteht (vorher kein_anspruch)', () => {
    const r = berechneLohnfortzahlung({ vertragsbeginn: '2026-01-01', verhinderungBeginn: '2026-04-01', verhinderungEnde: '2026-04-10', arbeitsunfaehigkeitProzent: 100, kanton: 'ZH', ktgGleichwertigVorhanden: false });
    expect(r.status).not.toBe('kein_anspruch');
  });
});

// ─── SHK-Abgleich-Fixes B3/B4 10.6.2026 (normen/arbeitsrecht-shk-abgleich.md) ─

describe('B3: frühere Absenzen im selben Dienstjahr verbrauchen das Kontingent (SHK 324a N 52)', () => {
  // 3. DJ Basler Skala = 9 Wochen? — bewusst 1. DJ (3 Wochen = 21 Tage), BS.
  it('1. DJ BS, 10 von 21 Tagen bezogen → letzter bezahlter Tag = Beginn + 11 − 1', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2026-01-01',
      verhinderungBeginn: '2026-06-01',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
      bereitsBezogeneTageImDienstjahr: 10,
    });
    expect(r.status).toBe('ok');
    expect(r.letzterTagISO).toBe('2026-06-11'); // 21 − 10 = 11 Tage ab 1.6. inkl.
  });

  it('Kontingent aufgebraucht (21 von 21) → kein Anspruch, ehrlicher Text', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2026-01-01',
      verhinderungBeginn: '2026-06-01',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
      bereitsBezogeneTageImDienstjahr: 21,
    });
    expect(r.status).toBe('kein_anspruch');
    expect(r.ergebnis).toContain('aufgebraucht');
    expect(r.letzterTagISO).toBeUndefined();
  });

  it('aufgebrauchter 1. Kredit + DJ-übergreifende Verhinderung → 2. Kredit lebt am Jahrestag frisch auf', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2025-02-01',          // Jahrestag 01.02.2026
      verhinderungBeginn: '2026-01-15',
      verhinderungEnde: '2026-06-01',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
      bereitsBezogeneTageImDienstjahr: 21,   // 1. DJ (3 Wochen) aufgebraucht
    });
    expect(r.status).toBe('ok');
    expect(r.ergebnis).toContain('2. Kredit');
    expect(r.ergebnis).toContain('aufgebraucht');
  });

  it('ohne Eingabe: Verhalten unverändert (voller Kredit)', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2026-01-01',
      verhinderungBeginn: '2026-06-01',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
    });
    expect(r.letzterTagISO).toBe('2026-06-21'); // 1.6. + 21 Tage − 1
  });
});

describe('B4: Kappung auf das Ende des Arbeitsverhältnisses (SHK 324a N 55, BGE 127 III 318)', () => {
  it('AV endet vor Skala-Ende → letzter bezahlter Tag = AV-Ende + KTG-Nachdeckungs-Warnung', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2026-01-01',
      verhinderungBeginn: '2026-06-01',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
      arbeitsverhaeltnisEnde: '2026-06-10',
    });
    expect(r.letzterTagISO).toBe('2026-06-10');
    expect(r.warnungen.some((w) => w.includes('Krankentaggeld'))).toBe(true);
  });

  it('AV endet nach Skala-Ende → keine Wirkung', () => {
    const r = berechneLohnfortzahlung({
      vertragsbeginn: '2026-01-01',
      verhinderungBeginn: '2026-06-01',
      arbeitsunfaehigkeitProzent: 100,
      kanton: 'BS',
      ktgGleichwertigVorhanden: false,
      arbeitsverhaeltnisEnde: '2026-12-31',
    });
    expect(r.letzterTagISO).toBe('2026-06-21');
    expect(r.warnungen.some((w) => w.includes('Krankentaggeld'))).toBe(false);
  });
});
