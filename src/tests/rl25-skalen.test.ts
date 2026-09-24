// RL-25 (W2·30-RL-W2A) — Lohnfortzahlungs-Skalen: Befunde Q6/S3b-b, F4-05,
// S3f-10; Entscheid W-13 (David 24.9.2026 «nach Empfehlung»).
//
// Soll-Werte Berner Skala, 1.–19. Dienstjahr: Obergericht des Kantons Bern,
// Themenseite «Krankheit» (undatiert), abgerufen 24.9.2026:
// https://www.zsg.justice.be.ch/de/start/themen/zivilrecht/arbeitsrecht/krankheit.html
//   1. DJ 3 Wochen · 2. DJ 1 Monat · 3.–4. DJ 2 Monate · 5.–9. DJ 3 Monate ·
//   10.–14. DJ 4 Monate · 15.–19. DJ 5 Monate (Tabelle endet beim 19. DJ).
// 20.–24. DJ = 6 Monate: Fortschreibung nach Behördenangaben, abgerufen 24.9.2026:
//   Arbeitsamt AI https://www.ai.ch/themen/wirtschaft-und-arbeit/arbeit/arbeitsvertragsrecht
//   («20. bis 24. Dienstjahr - 6 Monate», «danach alle 5 Dienstjahre - 1 Monat zusätzlich»),
//   DGEM VD FAQ (PDF 24.6.2026) S. 17 («20e à 24e année six mois etc.»),
//   Kanton NE https://www.ne.ch/themes/economie-et-emploi/chomage/licenciement-ou-perte-dun-emploi
//   («6 mois après 20 ans», keine weitere Stufe).
// NW: Merkblatt Lohnzahlung Arbeitsamt NW vom 7.4.2017
//   https://www.nw.ch/_docn/91122/Merkblatt_Lohnzahlung_.pdf — nennt «Berner Skala»,
//   Tabelle zeigt Basler Werte (2.–3. DJ 2 Mt, 4.–10. 3 Mt, 11.–15. 4 Mt, 16.–20. 5 Mt, ab 21. 6 Mt).
import { describe, it, expect } from 'vitest';
import { berechneLohnfortzahlung } from '../lib/lohnfortzahlung';
import { skaleFuerKanton, dauerAusSkala } from '../data/lohnfortzahlungSkalen';
import type { Kanton, LohnfortzahlungInput } from '../types/legal';

// Dienstjahr n am Stichtag 1.6.2025: Vertragsbeginn 1.1.(2025 − (n − 1)).
function imDienstjahr(n: number, kanton: Kanton, over: Partial<LohnfortzahlungInput> = {}) {
  return berechneLohnfortzahlung({
    vertragsbeginn: `${2025 - (n - 1)}-01-01`,
    verhinderungBeginn: '2025-06-01',
    arbeitsunfaehigkeitProzent: 100,
    kanton,
    ktgGleichwertigVorhanden: false,
    ...over,
  });
}

const schritt4 = (r: ReturnType<typeof berechneLohnfortzahlung>) =>
  r.rechenweg.find((s) => s.beschreibung.startsWith('Schritt 4'))?.zwischenergebnis ?? '';

// Identität mit Wortgrenze: «4 Monate» darf nicht in «14 Monate» treffen.
const monate = (n: number) => new RegExp(`(^|[^0-9])${n} Monate?\\b`);

const OG_BE: [number, string][] = [
  [1, '3 wochen'], [2, '1 monate'], [3, '2 monate'], [4, '2 monate'],
  ...[5, 6, 7, 8, 9].map((d) => [d, '3 monate'] as [number, string]),
  ...[10, 11, 12, 13, 14].map((d) => [d, '4 monate'] as [number, string]),
  ...[15, 16, 17, 18, 19].map((d) => [d, '5 monate'] as [number, string]),
];

describe('RL-25 · Berner Skala = Tabelle Obergericht BE (DJ 1–19), Fortschreibung 6 Mt ab DJ 20', () => {
  const { skala } = skaleFuerKanton('BE');

  it.each(OG_BE)('DJ %i → %s (OG BE)', (dj, soll) => {
    const e = dauerAusSkala(skala, dj);
    expect(e && `${e.dauer.anzahl} ${e.dauer.typ}`).toBe(soll);
  });

  it.each([20, 21, 24, 25, 30, 45])('DJ %i → 6 Monate (Fortschreibung, W-13: ab DJ 25 fest 6)', (dj) => {
    const e = dauerAusSkala(skala, dj);
    expect(e && `${e.dauer.anzahl} ${e.dauer.typ}`).toBe('6 monate');
  });

  it('BE DJ 12 → 4 Monate (bisher 5)', () => {
    const r = imDienstjahr(12, 'BE');
    expect(r.status).toBe('ok');
    expect(schritt4(r)).toMatch(/Regelmass laut Gerichtspraxis: 4 Monate\./);
    expect(r.ergebnis).toMatch(monate(4));
  });

  it('BE DJ 17 → 5 Monate (bisher 6)', () => {
    const r = imDienstjahr(17, 'BE');
    expect(schritt4(r)).toMatch(/Regelmass laut Gerichtspraxis: 5 Monate\./);
    expect(r.ergebnis).toMatch(monate(5));
  });

  it('Quellenhinweis der Berner Skala nennt Obergericht BE und Abrufdatum', () => {
    expect(skala.quellenhinweis).toContain('Obergericht des Kantons Bern');
    expect(skala.quellenhinweis).toContain('24.9.2026');
  });
});

describe('RL-25 · F4-05 Warntexte deutsch, Beleggrenze je Skala', () => {
  it.each<[Kanton, number]>([['BE', 30], ['BS', 17], ['ZH', 20], ['BE', 20]])(
    '%s DJ %i: kein englischer Warntext', (k, dj) => {
      const r = imDienstjahr(dj, k);
      expect(r.warnungen.join(' ')).not.toMatch(/Insufficient|\bdata\b/i);
    },
  );

  it.each([12, 15, 19])('BE DJ %i: vom OG BE belegt → keine «nicht belegt»-Warnung', (dj) => {
    const r = imDienstjahr(dj, 'BE');
    expect(r.warnungen.some((w) => /nicht belegt/.test(w))).toBe(false);
    expect(schritt4(r)).not.toMatch(/nicht belegt/);
  });

  it('BE DJ 20: Fortschreibung offengelegt (nicht vom OG BE belegt)', () => {
    const r = imDienstjahr(20, 'BE');
    const w = r.warnungen.find((x) => x.includes('Obergericht'));
    expect(w).toBeDefined();
    expect(w).toMatch(/Fortschreibung/);
    expect(w).toMatch(/19\. Dienstjahr/);
  });

  it('BS DJ 12: Basler Fortschreibung bleibt als «nicht belegt» markiert', () => {
    const r = imDienstjahr(12, 'BS');
    expect(r.warnungen.some((w) => /nicht belegt/.test(w))).toBe(true);
  });
});

describe('RL-25 · W-13 DJ 25+: 6 Monate fest, Alternative (+1 Mt je 5 DJ) offengelegt', () => {
  it('BE DJ 25: rechnet 6 Monate, legt 7 Monate (Arbeitsamt AI) offen', () => {
    const r = imDienstjahr(25, 'BE');
    expect(schritt4(r)).toMatch(/Regelmass laut Gerichtspraxis: 6 Monate\./);
    expect(r.ergebnis).toMatch(monate(6));
    const w = r.warnungen.find((x) => x.includes('Arbeitsamt AI'));
    expect(w).toBeDefined();
    expect(w).toMatch(monate(7));
    expect(schritt4(r)).toMatch(monate(7));
  });

  it('BE DJ 30: Alternative 8 Monate', () => {
    const r = imDienstjahr(30, 'BE');
    expect(r.warnungen.find((x) => x.includes('Arbeitsamt AI'))).toMatch(monate(8));
  });

  it('BE DJ 24: keine DJ-25+-Alternative', () => {
    const r = imDienstjahr(24, 'BE');
    expect(r.warnungen.some((x) => x.includes('Arbeitsamt AI') && /je weitere 5 Dienstjahre|alle 5 Dienstjahre/.test(x))).toBe(false);
  });
});

describe('RL-25 · W-13 Nidwalden: Warnung bis Klärung durch Arbeitsamt NW', () => {
  it('NW DJ 2: Berner Wert 1 Monat gerechnet, Basler Wert 2 Monate laut Merkblatt NW offengelegt', () => {
    const r = imDienstjahr(2, 'NW');
    expect(schritt4(r)).toMatch(/Regelmass laut Gerichtspraxis: 1 Monat\./);
    const w = r.warnungen.find((x) => x.includes('Nidwalden'));
    expect(w).toBeDefined();
    expect(w).toMatch(/7\.4\.2017/);
    expect(w).toMatch(monate(2));
  });

  it('BE: keine NW-Warnung', () => {
    expect(imDienstjahr(2, 'BE').warnungen.some((x) => x.includes('Nidwalden'))).toBe(false);
  });
});

describe('RL-25 · S3f-10 zweiter Kredit: Darstellung sequenziell statt überlappend', () => {
  // vb 1.1.2024, Verhinderung ab 1.12.2025 (2. DJ, Basler 2 Monate → rechnerisch bis 31.1.2026),
  // Jahrestag 1.1.2026: der 1. Kredit deckt nur bis 31.12.2025, ab 1.1.2026 der 2. Kredit.
  const r = berechneLohnfortzahlung({
    vertragsbeginn: '2024-01-01',
    verhinderungBeginn: '2025-12-01',
    verhinderungEnde: '2026-06-01',
    arbeitsunfaehigkeitProzent: 100,
    kanton: 'BS',
    ktgGleichwertigVorhanden: false,
  });
  const s6b = r.rechenweg.find((s) => s.beschreibung.startsWith('Schritt 6b'))?.zwischenergebnis ?? '';

  it('Rechenweg 6b: 1. Kredit bis Vortag des Jahrestags, keine Überlappung', () => {
    expect(s6b).toMatch(/1\. Kredit \(2\. DJ\) bis 31\.12\.2025/);
    expect(s6b).not.toContain('31.01.2026');
  });

  it('Ergebnis: 1. Kredit bis 31.12.2025, 2. Kredit ab 01.01.2026 bis 28.02.2026', () => {
    expect(r.ergebnis).toMatch(/1\. Kredit \(2\. DJ\) bis 31\.12\.2025/);
    expect(r.ergebnis).toContain('2. Kredit (3. DJ) ab 01.01.2026 bis und mit 28.02.2026');
    expect(r.letzterTagISO).toBe('2026-02-28');
  });

  it('1. Kredit vor dem Jahrestag aufgebraucht: Enddatum unverändert (31.10.2025)', () => {
    const r2 = berechneLohnfortzahlung({
      vertragsbeginn: '2024-01-01', verhinderungBeginn: '2025-09-01', verhinderungEnde: '2026-06-01',
      arbeitsunfaehigkeitProzent: 100, kanton: 'BS', ktgGleichwertigVorhanden: false,
    });
    expect(r2.ergebnis).toMatch(/1\. Kredit \(2\. DJ\) bis 31\.10\.2025/);
  });
});
