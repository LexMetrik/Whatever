import { describe, it, expect } from 'vitest';
import { berechneMietkuendigung } from '../lib/mietrecht';
import type { MietInput } from '../types/mietrecht';

const base = (over: Partial<MietInput>): MietInput => ({
  kuendigungsart: 'ordentlich',
  objekt: 'wohnung',
  zugang: '2025-01-10',
  kanton: 'AG',
  partei: 'mieter',
  ...over,
});

describe('Mietrecht – ordentliche Kündigung (Art. 266a–f OR)', () => {
  // Konzept §A, Beispiel: Geschäftsraum, 6 Monate, Termine Ende März/September,
  // Kündigung am 23. Juni auf Ende September → verschiebt sich auf Ende März des Folgejahres.
  it('Doc-Beispiel: Geschäftsraum, Zugang 23.6., Termine März/Sept → 31.3. des Folgejahres', () => {
    const r = berechneMietkuendigung(base({
      objekt: 'geschaeftsraum', zugang: '2025-06-23',
      terminQuelle: 'vertraglich_monate', vertragsTermineMonate: [3, 9],
    }));
    expect(r.endtermin).toBe('31.03.2026');
    expect(r.verfehlterTermin).toBe('30.09.2025');
  });

  // Konzept §E: Wohnung, 3 Monate, Termin 31.12. → Zugang spätestens 30.9.
  it('Doc-Beispiel: Wohnung, Termin 31.12. – Zugang 30.9. rechtzeitig, 1.10. verfehlt', () => {
    const rechtzeitig = berechneMietkuendigung(base({ zugang: '2025-09-30', terminQuelle: 'vertraglich_monate', vertragsTermineMonate: [12] }));
    expect(rechtzeitig.endtermin).toBe('31.12.2025');
    expect(rechtzeitig.spaetesterZugang).toBe('30.09.2025');
    const verfehlt = berechneMietkuendigung(base({ zugang: '2025-10-01', terminQuelle: 'vertraglich_monate', vertragsTermineMonate: [12] }));
    expect(verfehlt.endtermin).toBe('31.12.2026');
  });

  it('Ortsüblich AG (März/Juni/Sept): Zugang 10.1. → 30.6.', () => {
    const r = berechneMietkuendigung(base({}));
    expect(r.endtermin).toBe('30.06.2025');
    expect(r.verfehlterTermin).toBe('31.03.2025');
    // spätester Zugang für 30.6.: 31.3.2025 (drei volle Monate April–Juni)
    expect(r.spaetesterZugang).toBe('31.03.2025');
  });

  it('Genf: keine ortsüblichen Termine → gesetzliche Auffangregel + Warnung', () => {
    const r = berechneMietkuendigung(base({ kanton: 'GE', mietbeginn: '2020-04-01' }));
    expect(r.endtermin).toBe('30.06.2025'); // Ende einer 3-Monats-Mietdauer ab 1.4.
    expect(r.warnungen.some((w) => w.includes('Auffangregel'))).toBe(true);
  });

  it('«Jedes Monatsende ausser Dezember»: Zugang 15.8. → 30.11. (Dez übersprungen wäre erst bei 31.12.)', () => {
    const r = berechneMietkuendigung(base({ zugang: '2025-08-15', terminQuelle: 'jedes_monatsende', dezemberAusgeschlossen: true }));
    expect(r.endtermin).toBe('30.11.2025'); // 15.8 + 3M = spätester Zugang 31.8 für 30.11
  });

  it('Verkürzte Frist (1 Monat) ist nichtig → Minimum 3 Monate + Warnung', () => {
    const r = berechneMietkuendigung(base({ vereinbarteFristMonate: 1, terminQuelle: 'jedes_monatsende' }));
    expect(r.warnungen.some((w) => w.includes('NICHTIG') || w.includes('unterschreitet'))).toBe(true);
    expect(r.endtermin).toBe('30.04.2025'); // 10.1 +3M → 30.4 (31.1: zu spät? spätester Zugang 31.1 ≥ 10.1 ✓ → 30.4)
  });

  it('Längere vereinbarte Frist (6 Monate Wohnung) ist zulässig', () => {
    const r = berechneMietkuendigung(base({ vereinbarteFristMonate: 6, terminQuelle: 'vertraglich_monate', vertragsTermineMonate: [12] }));
    expect(r.endtermin).toBe('31.12.2025'); // Zugang 10.1 ≤ 30.6
    expect(r.annahmen.some((a) => a.includes('längere'))).toBe(true);
  });

  it('Möbliertes Zimmer: 2 Wochen auf Ende einer einmonatigen Mietdauer', () => {
    const r = berechneMietkuendigung(base({ objekt: 'moebliertes_zimmer', mietbeginn: '2024-11-15', zugang: '2025-01-02' }));
    expect(r.endtermin).toBe('14.02.2025'); // 14.1. verfehlt (spätester Zugang 31.12.)
  });

  it('Bewegliche Sache: 3 Tage auf beliebigen Zeitpunkt', () => {
    const r = berechneMietkuendigung(base({ objekt: 'bewegliche_sache', zugang: '2025-05-12' }));
    expect(r.endtermin).toBe('15.05.2025');
  });

  // Regression (Sanity-Check): Monatsfrist auf Monatsende-Termin in kürzerem Monat –
  // drei VOLLE Monate (April–Juni) → spätester Zugang 31.3., nicht 30.3.
  it('Monatsfrist-Rückrechnung: Termin 30.6., 3 Monate → Zugang spätestens 31.3. (keine addMonths-Klemmung)', () => {
    const r = berechneMietkuendigung(base({ zugang: '2026-03-31', terminQuelle: 'vertraglich_monate', vertragsTermineMonate: [6] }));
    expect(r.endtermin).toBe('30.06.2026'); // 31.3.2026 ist Dienstag – kein Art.-78-Maskeneffekt
    expect(r.spaetesterZugang).toBe('31.03.2026');
    const zuSpaet = berechneMietkuendigung(base({ zugang: '2026-04-01', terminQuelle: 'vertraglich_monate', vertragsTermineMonate: [6] }));
    expect(zuSpaet.endtermin).toBe('30.06.2027');
  });

  // Regression (Sanity-Check): Auffangregel bei Mietbeginn am Monatsletzten –
  // Periodenende ist das Monatsende (30.4.), nicht der 29.4. (addMonths-Drift).
  it('Auffangregel: Mietbeginn 31.1. → Perioden enden am Monatsende (30.4., 31.7., …)', () => {
    const r = berechneMietkuendigung(base({ zugang: '2025-02-10', terminQuelle: 'gesetzlich', mietbeginn: '2025-01-31' }));
    expect(r.verfehlterTermin).toBe('30.04.2025'); // nicht 29.04.
    expect(r.endtermin).toBe('31.07.2025');
  });
});

describe('Form und Nichtigkeit (Art. 266l–266o OR)', () => {
  it('Vermieterkündigung ohne amtliches Formular → NICHTIG', () => {
    const r = berechneMietkuendigung(base({ partei: 'vermieter', amtlichesFormular: false }));
    expect(r.status).toBe('nichtig');
    expect(r.endtermin).toBeUndefined();
  });

  it('Familienwohnung ohne separate Zustellung (Vermieter) → NICHTIG', () => {
    const r = berechneMietkuendigung(base({ partei: 'vermieter', amtlichesFormular: true, familienwohnung: true, separateZustellung: false }));
    expect(r.status).toBe('nichtig');
  });

  it('Mieterkündigung der Familienwohnung ohne Zustimmung des Ehegatten → NICHTIG', () => {
    const r = berechneMietkuendigung(base({ familienwohnung: true, zustimmungEhegatte: false }));
    expect(r.status).toBe('nichtig');
  });
});

describe('Ausserordentliche Kündigungen', () => {
  it('Zahlungsverzug (Art. 257d): Zahlungsfrist 30 Tage; Kündigung 30 Tage auf Monatsende; Erstreckung ausgeschlossen', () => {
    const r = berechneMietkuendigung(base({
      kuendigungsart: 'zahlungsverzug', partei: 'vermieter', amtlichesFormular: true,
      zahlungsaufforderungZugang: '2025-03-01', zugang: '2025-04-05',
    }));
    expect(r.zahlungsfristEnde).toBe('31.03.2025');
    expect(r.endtermin).toBe('31.05.2025'); // 5.4 + 30 Tage = 5.5 → Ende Mai
    expect(r.erstreckungBis).toBeUndefined();
    expect(r.anfechtungBis).toBe('05.05.2025');
    expect(r.warnungen.some((w) => w.includes('272a'))).toBe(true);
  });

  // Bug-Audit 19.6.2026 (H4): Art. 257d Abs. 1 OR — Zahlungsfrist «mindestens zehn
  // Tage, bei Wohn- und Geschäftsräumen mindestens 30 Tage». Für Nicht-Wohn/Geschäfts-
  // räume (bewegliche/unbewegliche Sache, möbliertes Zimmer/Einstellplatz) gelten 10 Tage.
  it('Zahlungsverzug (Art. 257d Abs. 1): Nicht-Raum-Objekt → Zahlungsfrist 10 Tage', () => {
    const r = berechneMietkuendigung(base({
      kuendigungsart: 'zahlungsverzug', partei: 'vermieter', objekt: 'bewegliche_sache',
      zahlungsaufforderungZugang: '2025-03-01', zugang: '2025-04-05',
    }));
    expect(r.zahlungsfristEnde).toBe('11.03.2025'); // 01.03. + 10 Tage
  });

  it('Wichtige Gründe (Art. 266g): gesetzliche Frist auf beliebigen Zeitpunkt', () => {
    const r = berechneMietkuendigung(base({ kuendigungsart: 'wichtige_gruende', zugang: '2025-04-15' }));
    expect(r.endtermin).toBe('15.07.2025'); // 3 Monate, gleichbezeichneter Tag
  });

  it('Tod des Mieters (Art. 266i): gesetzliche Frist auf nächsten GESETZLICHEN Termin (Vertragstermine unbeachtlich)', () => {
    const r = berechneMietkuendigung(base({
      kuendigungsart: 'tod_mieter', zugang: '2025-01-10',
      terminQuelle: 'vertraglich_monate', vertragsTermineMonate: [12], // wird ignoriert
    }));
    expect(r.endtermin).toBe('30.06.2025'); // ortsüblich AG
  });

  it('Konsumgütermiete (Art. 266k): 30 Tage auf Ende einer dreimonatigen Mietdauer', () => {
    const r = berechneMietkuendigung(base({
      kuendigungsart: 'konsumgueter', objekt: 'bewegliche_sache',
      mietbeginn: '2025-01-10', zugang: '2025-02-01',
    }));
    expect(r.endtermin).toBe('09.04.2025');
  });
});

describe('Anfechtung und Erstreckung (Art. 273 OR)', () => {
  it('Vermieterkündigung Wohnung: Anfechtung/Erstreckung innert 30 Tagen ab Empfang', () => {
    const r = berechneMietkuendigung(base({ partei: 'vermieter', amtlichesFormular: true, zugang: '2025-09-30', terminQuelle: 'jedes_monatsende' }));
    expect(r.anfechtungBis).toBe('30.10.2025');
    expect(r.erstreckungBis).toBe('30.10.2025');
  });

  it('Mieterkündigung: keine Anfechtungs-/Erstreckungsdaten', () => {
    const r = berechneMietkuendigung(base({ terminQuelle: 'jedes_monatsende' }));
    expect(r.anfechtungBis).toBeUndefined();
  });
});

// F4-01 (Prüfung Rechtslogik 23.9.2026, W2·30-RL-W1): Art. 78 Abs. 1 OR
// verschiebt nur den «Zeitpunkt der Erfüllung oder den letzten Tag einer
// Frist». Der späteste Zugangstag liegt VOR Beginn der Kündigungsfrist und ist
// kein Fristende (die Frist endet am Termin, Art. 266a Abs. 1, 266c/266e OR).
// Fällt er auf Sa/So/Feiertag, gilt NICHT der nächste Werktag — ein Zugang
// danach verfehlt den Termin (Art. 266a Abs. 2 OR: nächstmöglicher Termin).
// Normtext: https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de (Stand 1.1.2026).
describe('Zustelltag vor Fristbeginn: keine Art.-78-Verschiebung (F4-01)', () => {
  it('Wohnung, jedes Monatsende, Zugang Mo 1.9.2025 → 31.12.2025 (31.8.2025 war Sonntag)', () => {
    const r = berechneMietkuendigung(base({ zugang: '2025-09-01', kanton: 'ZH', terminQuelle: 'jedes_monatsende' }));
    expect(r.endtermin).toBe('31.12.2025');
    expect(r.verfehlterTermin).toBe('30.11.2025');
    expect(r.spaetesterZugang).toBe('30.09.2025');
    // Kontrolle: Zugang am (Sonntag) 31.8.2025 selbst wahrt den 30.11.2025.
    const amSonntag = berechneMietkuendigung(base({ zugang: '2025-08-31', kanton: 'ZH', terminQuelle: 'jedes_monatsende' }));
    expect(amSonntag.endtermin).toBe('30.11.2025');
    expect(amSonntag.spaetesterZugang).toBe('31.08.2025');
  });

  it('Wohnung, Termin nur Ende Dezember, Zugang Mo 2.10.2023 → 31.12.2024 (30.9.2023 war Samstag)', () => {
    const r = berechneMietkuendigung(base({ zugang: '2023-10-02', kanton: 'ZH', terminQuelle: 'vertraglich_monate', vertragsTermineMonate: [12] }));
    expect(r.endtermin).toBe('31.12.2024');
    expect(r.verfehlterTermin).toBe('31.12.2023');
  });

  it('Möbliertes Zimmer (Art. 266e OR), Mietbeginn 1.1.2025, Zugang Mo 18.8.2025 → 30.09.2025 (17.8.2025 war Sonntag)', () => {
    const r = berechneMietkuendigung(base({ objekt: 'moebliertes_zimmer', zugang: '2025-08-18', kanton: 'ZH', mietbeginn: '2025-01-01' }));
    expect(r.endtermin).toBe('30.09.2025');
    expect(r.verfehlterTermin).toBe('31.08.2025');
  });

  it('Rechenweg stellt keine Werktagsverschiebung des Zugangstags als Recht dar', () => {
    const r = berechneMietkuendigung(base({ zugang: '2025-09-01', kanton: 'ZH', terminQuelle: 'jedes_monatsende' }));
    const text = r.rechenweg.map((s) => s.zwischenergebnis).join('\n');
    expect(text).not.toMatch(/Verschiebung auf den nächsten Werktag, Art\. 78 OR/);
  });
});
