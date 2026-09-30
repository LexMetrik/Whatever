// Farbwelt-Tor: Kategorie «durch Rolle ausgeschlossen» (W2·19 Kleinaufräumen 30.9.2026).
// Sie zählt nicht als beratende Warnung und hat keinen Baseline-Guard; echte
// Risse behalten beides. Die Auswertung ist rein (scripts/farbwelt-risse.ts).
import { describe, expect, it } from 'vitest';
import { werteRisseAus, type Riss } from '../../scripts/farbwelt-risse';

const RISS: Riss = { fg: 'a', bg: 'b', mode: 'hell', schwelle: 3, ist: 2.72, tag: 'Echt' };
const ROLLE: Riss = { fg: 'c', bg: 'd', mode: 'dunkel', schwelle: 4.5, ist: 4.24, tag: 'Rolle' };
const TOL = 0.03;
const feste = (k: number) => () => k;

describe('werteRisseAus: Kategorien', () => {
  it('ein echter Riss ist Warnung; ein Rollen-Paar unter der Schwelle nicht', () => {
    const r = werteRisseAus([RISS], [ROLLE], feste(2.8), TOL);
    expect(r.warnungen).toHaveLength(1);
    expect(r.warnungen[0]).toContain('[RISS] a/b hell');
    expect(r.ausgeschlossen).toHaveLength(1);
    expect(r.ausgeschlossen[0]).toContain('[durch Rolle ausgeschlossen] c/d dunkel');
  });

  it('Verschlechterung eines echten Risses ist Fehler, bei einem Rollen-Paar nie (auch weit unter Baseline)', () => {
    expect(werteRisseAus([RISS], [], feste(2.5), TOL).fehler).toHaveLength(1);
    expect(werteRisseAus([], [ROLLE], feste(3.0), TOL).fehler).toEqual([]);
    // Toleranzrand: Baseline − tol ist noch erlaubt (Randwert ≠ Glücksfall).
    expect(werteRisseAus([RISS], [], feste(2.72 - TOL + 0.001), TOL).fehler).toEqual([]);
  });

  it('ein Rollen-Paar über der Schwelle meldet «Rolle überflüssig» (Rückbau-Signal), keine Warnung', () => {
    const r = werteRisseAus([], [ROLLE], feste(4.6), TOL);
    expect(r.ausgeschlossen[0]).toContain('[Rolle überflüssig]');
    expect(r.warnungen).toEqual([]);
  });

  it('die Zählung: leere Kategorien liefern leere Listen', () => {
    expect(werteRisseAus([], [], feste(1), TOL)).toEqual({ warnungen: [], fehler: [], ausgeschlossen: [] });
  });
});
