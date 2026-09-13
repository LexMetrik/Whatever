import { describe, it, expect } from 'vitest';
import { nachfolgerReiter, type TabEintrag } from '../lib/tabs';

// ── W2·18 Punkt 3 (Fahrplan §4.R) · NACH DEM ✕ RÜCKT DER RECHTE NACH ────────
//
// BELEG 13.9.2026: `Reiterleiste.schliessen` wählte `ordnung[idx - 1] ??
// ordnung[idx + 1]` — also den LINKEN Nachbarn zuerst. Chrome, Firefox und
// Safari aktivieren nach dem Schliessen den rechten; der linke ist nur der
// Rückfall am Ende der Leiste. Der Unterschied ist nicht kosmetisch: wer eine
// Reihe von links nach rechts abarbeitet und jeden erledigten Reiter
// schliesst, wurde bei jedem ✕ an den Anfang zurückgeworfen.
//
// ROT ZU BEKOMMEN (§6.7, so gefahren): in `lib/tabs.nachfolgerReiter` die
// Reihenfolge wieder umdrehen (`ordnung[idx - 1] ?? ordnung[idx + 1]`) ⇒ der
// erste Fall wird rot. Er ist auch der einzige, der die Regel unterscheidet:
// an den beiden Rändern und beim einzigen Reiter geben alte und neue Regel
// dieselbe Antwort — genau darum prüfen die anderen Fälle den RÜCKFALL, den
// der Fix nicht kosten darf.

const reihe = (...pfade: string[]): TabEintrag[] => pfade.map((path) => ({ path }));

describe('nachfolgerReiter — wer nach dem Schliessen aktiv wird (W2·18 Punkt 3)', () => {
  const drei = reihe('/gesetze/bund/OR', '/gesetze/bund/ZGB', '/rechner/zpo-fristen');

  it('mitten in der Reihe: der RECHTE Nachbar', () => {
    expect(nachfolgerReiter(drei, 1)?.path).toBe('/rechner/zpo-fristen');
  });

  it('am linken Rand: ebenfalls der rechte Nachbar', () => {
    expect(nachfolgerReiter(drei, 0)?.path).toBe('/gesetze/bund/ZGB');
  });

  it('am rechten Rand: der linke, weil rechts keiner mehr steht', () => {
    expect(nachfolgerReiter(drei, 2)?.path).toBe('/gesetze/bund/ZGB');
  });

  it('der einzige Reiter hat keinen Nachfolger (die Leiste geht zur Sammlung)', () => {
    expect(nachfolgerReiter(reihe('/gesetze/bund/OR'), 0)).toBeUndefined();
  });

  it('unbekannter Reiter und leere Liste ergeben keinen Nachfolger', () => {
    expect(nachfolgerReiter(drei, -1)).toBeUndefined();
    expect(nachfolgerReiter([], 0)).toBeUndefined();
  });
});
