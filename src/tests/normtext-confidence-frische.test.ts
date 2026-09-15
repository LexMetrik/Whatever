/**
 * Tests für die reine Frische-Vergleichslogik von `check:confidence-frische`
 * (§17, Prüfer-Befund #848, 15.9.2026). Synthetische Fälle ohne FS — §2-konform.
 */

import { describe, it, expect } from 'vitest';
import { pruefeFrische, type FrischeEingabe } from '../../scripts/normtext/confidence-frische-logik.ts';

function basis(): FrischeEingabe {
  return {
    gemeldeterKorpusSha: 'abc123',
    aktuellerManifestSha: 'abc123',
    gemeldeteErlasse: 10,
    aktuelleDateianzahl: 10,
    erzeugt: '2026-09-15',
  };
}

describe('pruefeFrische', () => {
  it('ist frisch, wenn sha und Dateianzahl übereinstimmen', () => {
    const befund = pruefeFrische(basis());
    expect(befund.frisch).toBe(true);
    expect(befund.gruende).toEqual([]);
  });

  it('meldet sha-fehlt bei einer Alt-Datei ohne korpus-Feld', () => {
    const befund = pruefeFrische({ ...basis(), gemeldeterKorpusSha: undefined });
    expect(befund.frisch).toBe(false);
    expect(befund.gruende).toHaveLength(1);
    expect(befund.gruende[0].klasse).toBe('sha-fehlt');
  });

  it('meldet sha-abweichung, wenn korpus.sha vom aktuellen Manifest-Wert abweicht', () => {
    const befund = pruefeFrische({ ...basis(), gemeldeterKorpusSha: 'alt-sha' });
    expect(befund.frisch).toBe(false);
    expect(befund.gruende).toHaveLength(1);
    expect(befund.gruende[0].klasse).toBe('sha-abweichung');
  });

  it('meldet anzahl-abweichung, wenn zusammenfassung.erlasse von der Dateianzahl abweicht', () => {
    const befund = pruefeFrische({ ...basis(), gemeldeteErlasse: 9 });
    expect(befund.frisch).toBe(false);
    expect(befund.gruende).toHaveLength(1);
    expect(befund.gruende[0].klasse).toBe('anzahl-abweichung');
  });

  it('meldet BEIDE Gründe gleichzeitig, wenn sha und Anzahl abweichen', () => {
    const befund = pruefeFrische({ ...basis(), gemeldeterKorpusSha: 'alt-sha', gemeldeteErlasse: 9 });
    expect(befund.frisch).toBe(false);
    expect(befund.gruende).toHaveLength(2);
    expect(befund.gruende.map((g) => g.klasse).sort()).toEqual(['anzahl-abweichung', 'sha-abweichung']);
  });
});
