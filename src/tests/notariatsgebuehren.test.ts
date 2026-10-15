import { describe, it, expect } from 'vitest';
import { notariatsGebuehrGruendung } from '../lib/notariatsgebuehrenGruendung';

// ─── Goldwerte Notariatsgebühren Gründung (P11, 7.6.2026) ────────────────────
// Handgerechnet aus den amtlichen Tarifen (Dossier bibliothek/kosten/
// notariatstarife-gruendung-kantone.md, Staffeln verbatim). Status
// Erstrecherche — fachliche Abnahme David ausstehend.

const betrag = (kt: string, k: number) => {
  const t = notariatsGebuehrGruendung(kt, k);
  expect(t, `${kt} fehlt`).not.toBeNull();
  expect(t!.ergebnis.typ).toBe('betrag');
  return (t!.ergebnis as { typ: 'betrag'; chf: number }).chf;
};

describe('Notariatsgebühren Gründung — Goldwerte je Kanton', () => {
  it('ZH (NotGebV Ziff. 4.4.3.1, Nachtrag 123 @ 1.1.2024): 1‰ im Rahmen 500–4000', () => {
    // Deklarierte Korrektur 7.6.2026: Rahmen am amtlichen PDF verifiziert —
    // die früheren 5'000 (Nachtrag 066/095) waren überholt.
    expect(betrag('ZH', 100_000)).toBe(500);        // 1‰ = 100 → Min 500
    expect(betrag('ZH', 600_000)).toBe(600);        // 1‰ über Min
    expect(betrag('ZH', 6_000_000)).toBe(4_000);    // Cap übrige Gesellschaften (123!)
  });

  it('BE (GebVN Anhang 4): Staffel-Rahmen Min/Mittel/Max', () => {
    const t = notariatsGebuehrGruendung('BE', 100_000)!;
    expect(t.ergebnis).toEqual({ typ: 'rahmen', vonChf: 1_000, bisChf: 1_600, mittelChf: 1_300 });
    const t2 = notariatsGebuehrGruendung('BE', 950_000)!;   // Stufe bis 1 Mio.
    expect(t2.ergebnis).toEqual({ typ: 'rahmen', vonChf: 2_200, bisChf: 3_600, mittelChf: 2_900 });
    // > Anhang-Ende: GebVN Anhang 4, letzte Zeile (20 Mio.) trägt die Marke «Maximum»
    // → Höchststufe gilt weiter (RL-36, §3 Nr. 16): Rahmen 16'450–27'350, Mittel 21'900.
    expect(notariatsGebuehrGruendung('BE', 25_000_000)!.ergebnis)
      .toEqual({ typ: 'rahmen', vonChf: 16_450, bisChf: 27_350, mittelChf: 21_900 });
  });

  it('LU (§ 37 BeurkGebV): progressive Staffel, min 1000 / max 11750', () => {
    expect(betrag('LU', 100_000)).toBe(1_000);      // 3‰ = 300 → Min
    expect(betrag('LU', 500_000)).toBe(1_500);      // 3‰ exakt
    // 500k×3‰ + 500k×2.5‰ + 1M×2‰ + 3M×1.5‰ + 5M×0.5‰ = 1500+1250+2000+4500+2500 = 11750 (Cap exakt)
    expect(betrag('LU', 10_000_000)).toBe(11_750);
    expect(betrag('LU', 20_000_000)).toBe(11_750);  // über 10 Mio. gebührenfrei
  });

  it('SG (GebT Nr. 60.13): 385 + 80 je weitere VOLLE 100k, max 15000', () => {
    expect(betrag('SG', 100_000)).toBe(385);
    expect(betrag('SG', 200_000)).toBe(465);
    // Deklarierte fachliche Änderung 7.6.2026: «volle» Stufen = floor —
    // systematisch belegt (Nr. 52.03 sagt ausdrücklich «ganze oder
    // angebrochene», wo aufgerundet werden soll); vorher ceil → 545.
    expect(betrag('SG', 250_000)).toBe(465);        // angebrochene Stufe zählt NICHT
    expect(betrag('SG', 150_000)).toBe(385);
    expect(betrag('SG', 100_000_000)).toBe(15_000); // Cap
  });

  it('BS (Ziff. 33 lit. a): Sockel 2000 + Marginal-Prozente; < 100k Rahmen', () => {
    expect(betrag('BS', 100_000)).toBe(2_000);
    expect(betrag('BS', 200_000)).toBe(2_240);      // + 100k × 0.24 %
    expect(betrag('BS', 1_000_000)).toBe(4_000);    // 2000 + 240 + 800k×0.22 %
    expect(notariatsGebuehrGruendung('BS', 50_000)!.ergebnis).toEqual({ typ: 'rahmen', vonChf: 750, bisChf: 2_000 });
  });

  it('AG/UR: nicht beziffert (Aufwand bzw. kein amtlicher Tarif), nie ein Schein-Wert', () => {
    expect(notariatsGebuehrGruendung('AG', 100_000)!.ergebnis.typ).toBe('nicht_beziffert');
    expect(notariatsGebuehrGruendung('UR', 100_000)!.ergebnis.typ).toBe('nicht_beziffert');
  });

  it('VD/GE/TI: Engine-Werte aus SONDERTARIFE.ag_gruendung statt null (RL-36, B2-10)', () => {
    expect(notariatsGebuehrGruendung('VD', 100_000)!.ergebnis).toEqual({ typ: 'rahmen', vonChf: 500, bisChf: 2_300 });
    expect(notariatsGebuehrGruendung('GE', 100_000)!.ergebnis).toEqual({ typ: 'rahmen', vonChf: 1_150, bisChf: 2_650 });
    expect(betrag('TI', 100_000)).toBe(500);        // Art. 3 lit. l: 0,5 % auf 100'000
  });

  it('BE-Mittel = arithmetisches Mittel von Min/Max (Anhang 4, alle Zeilen am amtlichen PDF gelesen)', () => {
    for (const [kap, mittel] of [[200_000, 1_300], [1_000_000, 2_900], [5_000_000, 6_900], [20_000_000, 21_900]] as const) {
      const e = notariatsGebuehrGruendung('BE', kap)!.ergebnis;
      expect(e.typ === 'rahmen' && e.mittelChf).toBe(mittel);
    }
  });

  it('Eingangs-Guard (S3c-c): negativ/NaN/unendlich → klarer Fehler, kein Clamp', () => {
    expect(() => notariatsGebuehrGruendung('ZH', -100_000)).toThrow(RangeError);
    expect(() => notariatsGebuehrGruendung('ZH', -100_000)).toThrow(/Kapital/);
    expect(() => notariatsGebuehrGruendung('BE', Number.NaN)).toThrow(RangeError);
    expect(() => notariatsGebuehrGruendung('SG', Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it('Unbekannter Kantonscode → null (kein Kanton, keine Auskunft)', () => {
    expect(notariatsGebuehrGruendung('XX', 100_000)).toBeNull();
  });
});
