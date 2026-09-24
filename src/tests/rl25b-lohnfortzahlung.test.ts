// RL-25b (W2·30-RL-W2A) — Herz-und-Nieren-Prüfung 24.9.2026, Befunde
// rechtslogik-rest-01 (Karenzfrist), -03 (nur «schriftlich»), -04 (13. ML),
// -05 (Unfall/Dienst-Kopfzeile). Norm-Stand: OR SR 220 Fassung 1.1.2026
// (Fedlex-Filestore 20260101), UVG SR 832.20 Fassung 1.1.2026, BGE 131 III 623
// E. 2.4 (search.bger.ch, abgerufen 25.9.2026).
import { describe, it, expect } from 'vitest';
import { berechneLohnfortzahlung } from '../lib/lohnfortzahlung';
import type { LohnfortzahlungInput } from '../types/legal';

const basis = (over: Partial<LohnfortzahlungInput>): LohnfortzahlungInput => ({
  vertragsbeginn: '2026-01-01',
  verhinderungBeginn: '2026-02-15',
  arbeitsunfaehigkeitProzent: 100,
  kanton: 'BE',
  ktgGleichwertigVorhanden: false,
  ...over,
});

const alleTexte = (r: ReturnType<typeof berechneLohnfortzahlung>) =>
  [r.ergebnis, ...r.warnungen, ...r.annahmen, ...r.rechenweg.map((s) => s.zwischenergebnis)].join('\n');

describe('rechtslogik-rest-01: Anspruch beginnt nach Ablauf der Karenzfrist (Art. 324a Abs. 1 OR; BGE 131 III 623 E. 2.4)', () => {
  it('LF-01 BE: Beginn 1.1.2026 unbefristet, krank 15.2.–31.5.2026 → Anspruch ab 1.4.2026, 1. DJ 3 Wochen bis 21.4.2026', () => {
    const r = berechneLohnfortzahlung(basis({ verhinderungEnde: '2026-05-31' }));
    expect(r.status).toBe('ok');
    expect(r.zeitraumVonISO).toBe('2026-04-01');
    expect(r.letzterTagISO).toBe('2026-04-21');
    expect(r.ergebnis).toContain('01.04.2026');
    expect(r.ergebnis).toContain('21.04.2026');
    expect(r.ergebnis).not.toContain('zu verifizieren');
  });

  it('LF-24: Kündigungsfrist 3 Monate (≤ 3) → gleiches Ergebnis wie ohne Angabe', () => {
    const r = berechneLohnfortzahlung(basis({ verhinderungEnde: '2026-05-31', vereinbarteKuendigungsfristMonate: 3 }));
    expect(r.status).toBe('ok');
    expect(r.zeitraumVonISO).toBe('2026-04-01');
    expect(r.letzterTagISO).toBe('2026-04-21');
  });

  it('Zweitprüfer-Fall SG: Beginn 1.2.2026, KF 2 Mt, krank 20.3.–15.7.2026 → ab 1.5.2026 bis 21.5.2026', () => {
    const r = berechneLohnfortzahlung(basis({
      vertragsbeginn: '2026-02-01', verhinderungBeginn: '2026-03-20', verhinderungEnde: '2026-07-15',
      vereinbarteKuendigungsfristMonate: 2, kanton: 'SG',
    }));
    expect(r.status).toBe('ok');
    expect(r.zeitraumVonISO).toBe('2026-05-01');
    expect(r.letzterTagISO).toBe('2026-05-21');
  });

  it('Verhinderung endet vor dem ersten Tag des vierten Monats → kein Anspruch, BGE-Beleg ohne «zu verifizieren»', () => {
    const r = berechneLohnfortzahlung(basis({ verhinderungEnde: '2026-03-31' }));
    expect(r.status).toBe('kein_anspruch');
    expect(r.ergebnis).toContain('BGE 131 III 623');
    expect(r.ergebnis).toContain('01.04.2026');
    expect(r.ergebnis).not.toContain('zu verifizieren');
    expect(r.zeitraumVonISO).toBeUndefined();
  });

  it('Verhinderung endet genau am ersten Tag des vierten Monats → ein bezahlter Tag', () => {
    const r = berechneLohnfortzahlung(basis({ verhinderungEnde: '2026-04-01' }));
    expect(r.status).toBe('ok');
    expect(r.zeitraumVonISO).toBe('2026-04-01');
    expect(r.letzterTagISO).toBe('2026-04-01');
  });

  it('ohne Ende der Verhinderung: Anspruch ab 1.4.2026 unter offengelegter Annahme des Andauerns', () => {
    const r = berechneLohnfortzahlung(basis({ verhinderungBeginn: '2026-03-01', kanton: 'ZH' }));
    expect(r.status).toBe('ok');
    expect(r.zeitraumVonISO).toBe('2026-04-01');
    expect(r.letzterTagISO).toBe('2026-04-21');
    expect(r.warnungen.join('\n')).toContain('vor dem 01.04.2026');
  });

  it('Arbeitsverhältnis endet noch in der Karenzfrist → kein Anspruch (kein negativer Zeitraum)', () => {
    const r = berechneLohnfortzahlung(basis({ verhinderungEnde: '2026-05-31', arbeitsverhaeltnisEnde: '2026-03-31' }));
    expect(r.status).toBe('kein_anspruch');
    expect(r.zeitraumVonISO).toBeUndefined();
    expect(r.letzterTagISO).toBeUndefined();
  });

  it('Kontrolle: Verhinderung beginnt nach der Karenzfrist → Zeitraum ab Verhinderungsbeginn (unverändert)', () => {
    const r = berechneLohnfortzahlung(basis({ verhinderungBeginn: '2026-04-10', verhinderungEnde: '2026-06-30' }));
    expect(r.status).toBe('ok');
    expect(r.zeitraumVonISO).toBe('2026-04-10');
    expect(r.letzterTagISO).toBe('2026-04-30');
  });
});

describe('rechtslogik-rest-03 (nur «schriftlich»): formungültige KTG-Abrede → gesetzliche Skala (Art. 324a Abs. 4 OR)', () => {
  const ktg = { vertragsbeginn: '2024-01-01', verhinderungBeginn: '2026-01-01', kanton: 'ZH' as const };

  it('schriftlichVereinbart:false → Skala als Mindestanspruch, nicht KTG-Regime', () => {
    const r = berechneLohnfortzahlung(basis({ ...ktg, ktgGleichwertigVorhanden: true, ktgKriterien: { schriftlichVereinbart: false } }));
    const ohneKtg = berechneLohnfortzahlung(basis({ ...ktg }));
    expect(r.status).toBe('ok');
    expect(r.letzterTagISO).toBe(ohneKtg.letzterTagISO);
    expect(r.rechenweg.some((s) => s.beschreibung.includes('Skala-Dauer ablesen'))).toBe(true);
    expect(r.rechenweg[0].zwischenergebnis).toContain('Art. 324a Abs. 4 OR');
    expect(r.warnungen.join('\n')).toContain('schriftlich');
  });

  it('schriftlichVereinbart:true → KTG-Regime bleibt', () => {
    const r = berechneLohnfortzahlung(basis({ ...ktg, ktgGleichwertigVorhanden: true, ktgKriterien: { schriftlichVereinbart: true } }));
    expect(r.status).toBe('ktg_regime');
  });

  it('schriftlich nicht angegeben, andere Kriterien fraglich → KTG-Regime mit Indikation (nur «schriftlich» ist Gültigkeitsvoraussetzung)', () => {
    const r = berechneLohnfortzahlung(basis({ ...ktg, ktgGleichwertigVorhanden: true, ktgKriterien: { taggeldProzent: 60 } }));
    expect(r.status).toBe('ktg_regime');
    expect(alleTexte(r)).toContain('Gleichwertigkeit fraglich');
  });
});

describe('rechtslogik-rest-04: 13. Monatslohn wirkt auf den Geldbetrag (Art. 324a Abs. 1 OR, Lohnausfallprinzip)', () => {
  const lf22 = { vertragsbeginn: '2025-06-01', verhinderungBeginn: '2026-01-05', kanton: 'ZH' as const, monatslohnBrutto: 6000 };
  const schritt7 = (r: ReturnType<typeof berechneLohnfortzahlung>) =>
    r.rechenweg.find((s) => s.beschreibung.startsWith('Schritt 7'))?.zwischenergebnis ?? '';

  it('LF-22 ZH 1. DJ, 6000/Mt ohne 13. ML → 21 × 200 = ~CHF 4200.00', () => {
    expect(schritt7(berechneLohnfortzahlung(basis(lf22)))).toContain('~CHF 4200.00');
  });

  it('LF-22 mit 13. ML → Tagesansatz × 13/12: 21 × 216.67 = ~CHF 4550.00', () => {
    const t = schritt7(berechneLohnfortzahlung(basis({ ...lf22, dreizehnterMonatslohn: true })));
    expect(t).toContain('~CHF 4550.00');
    expect(t).not.toContain('~CHF 4200.00');
  });
});

describe('rechtslogik-rest-05: Unfall/Dienst — Kopfzeile nennt Wartezeit bzw. Befreiung, nicht die Skala als Lohnfortzahlung (Art. 324b OR)', () => {
  const k = { vertragsbeginn: '2024-01-01', verhinderungBeginn: '2026-01-01', kanton: 'BS' as const };

  it('Unfall: Kopf nennt Wartezeit bis UVG-Taggeld (3. Tag nach Unfalltag = 04.01.2026), Skala-Dauer nur als Differenzpflicht', () => {
    const r = berechneLohnfortzahlung(basis({ ...k, verhinderungsgrund: 'unfall' }));
    expect(r.ergebnis.startsWith('Lohnfortzahlung bis und mit')).toBe(false);
    expect(r.ergebnis).toContain('04.01.2026');
    expect(r.ergebnis).toContain('Art. 324b Abs. 3');
    expect(r.ergebnis).toContain('Art. 324b Abs. 2');
    expect(r.ergebnis).toContain('Karenztage');
  });

  it('Dienst: Kopf nennt Befreiung bei EO ≥ 80 % und Differenzpflicht, nicht «Lohnfortzahlung bis und mit»', () => {
    const r = berechneLohnfortzahlung(basis({ ...k, verhinderungsgrund: 'dienst' }));
    expect(r.ergebnis.startsWith('Lohnfortzahlung bis und mit')).toBe(false);
    expect(r.ergebnis).toContain('Art. 324b Abs. 1');
    expect(r.ergebnis).toContain('Art. 324b Abs. 2');
  });

  it('Krankheit: Kopf unverändert «Lohnfortzahlung bis und mit …»', () => {
    const r = berechneLohnfortzahlung(basis({ ...k }));
    expect(r.ergebnis.startsWith('Lohnfortzahlung bis und mit')).toBe(true);
  });
});
