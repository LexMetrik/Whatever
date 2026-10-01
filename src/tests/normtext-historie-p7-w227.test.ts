/**
 * W2·27-BUND-FERTIG · Paket P7 — Historie-Parser und Aufhebungs-Daten (1.10.2026).
 *
 * Eine Datei je Paket, damit die Risiko-Tests der Vorgänger (normtext-historie*, normtext-aufhebung-*) unberührt
 * bleiben (§6.3). Fixtures stammen wörtlich aus den gepinnten Fedlex-Konsolidierungen (Pins: scripts/fedlex-cache.sh;
 * Abruf der Caches 1.10.2026) bzw. aus den Struktur-Sidecars `public/normtext/struktur/bund/*.json`.
 */
import { describe, it, expect } from 'vitest';
import { fussnoteDiesenArtGegenstandslos } from '../../scripts/normtext/aufhebung-signal';

// ── #47 · «ist dieser Art. gegenstandslos» nur UNBEDINGT (GP T2, 1.10.2026) ──────────────────────────────────────
describe('P7 #47 · fussnoteDiesenArtGegenstandslos — bedingte Formen sind kein Ganz-Vermerk', () => {
  it('Bestand bleibt: AsylG Art. 122 (unbedingt) trifft weiterhin', () => {
    expect(fussnoteDiesenArtGegenstandslos(
      'AS 1998 1582 Ziff. III. Aufgrund der Annahme dieses BB in der Volksabstimmung vom 13. Juni 1999 ist dieser Art. gegenstandslos.',
    )).toBe(true);
  });

  it('«… ist dieser Art. gegenstandslos, soweit …» / «, sofern …» / «, wenn …» trifft NICHT (Teil-Gegenstandslosigkeit, §1/§8)', () => {
    for (const t of [
      'AS 2001 1 Ziff. III. Aufgrund der Annahme des BB ist dieser Art. gegenstandslos, soweit er sich auf Abs. 3 bezieht.',
      'Aufgrund des BRB ist dieser Art. gegenstandslos, sofern keine Ausnahme besteht.',
      'Aufgrund des BRB ist dieser Artikel gegenstandslos; soweit der Bund Kosten trägt, gilt er weiter.',
      'Aufgrund des BRB ist dieser Art. gegenstandslos wenn das Gesetz in Kraft tritt.',
      'Aufgrund des BRB ist dieser Art. gegenstandslos, ausgenommen Abs. 2.',
    ]) {
      expect(fussnoteDiesenArtGegenstandslos(t), t).toBe(false);
    }
  });

  it('ein Folgesatz, der zufällig mit «Soweit» beginnt, entkräftet den Vermerk nicht', () => {
    // «… ist dieser Art. gegenstandslos. Soweit …» — der Punkt beendet die Aussage (Satzgrenze), nicht ein Bedingungssatz.
    expect(fussnoteDiesenArtGegenstandslos('Aufgrund des BRB ist dieser Art. gegenstandslos. Soweit nötig, siehe Art. 5.')).toBe(true);
  });
});
