/**
 * W2·27 — «Fünf-Artefakte-Klammer» (Fahrplan BUND-FERTIG §1.1).
 *
 * Ein Erlass liegt bei uns in mehreren getrennt alternden Dateien; zusammengehalten
 * werden sie allein durch die Fassungs-Marke (`stand` + `fassungsToken`) und das Tor
 * `check:struktur-konsistenz`.
 *
 * ROT-BEWEIS (§6.7): `standDriftBefund` prüfte nur, wenn BEIDE Seiten die Marke tragen
 * — am 14.9.2026 traf das auf 12 von 228 Bund-Sidecars zu, 216 liefen also durch ein
 * Tor, das für sie nicht scheitern KONNTE. Test 1 und 2 unten reproduzieren beide
 * Freibriefe: mit `standDriftBefund` sind sie `null` (grün), mit `versionsKlammerBefund`
 * ein Befund.
 *
 * KEIN NETZ, KEIN ECHTES public/-Verzeichnis (istCliLauf-Guard, s.
 * normtext-struktur-konsistenz-stand.test.ts).
 */
import { describe, it, expect } from 'vitest';
import {
  standDriftBefund,
  versionsKlammerBefund,
  uneinheitlicheSnapshotVersion,
} from '../../scripts/normtext/check-struktur-konsistenz';

const V = { stand: '2026-09-01', fassungsToken: '20260901' };

describe('versionsKlammerBefund (W2·27-Riegel)', () => {
  it('ROT-BEWEIS 1: Sidecar OHNE Fassungs-Marke — der alte Ast war blind (null), der Riegel meldet', () => {
    expect(standDriftBefund(V, null)).toBeNull(); // Vorzustand: 216/228 liefen hier durch
    const befund = versionsKlammerBefund(V, null);
    expect(befund).toContain('Struktur-Sidecar ohne stand/fassungsToken');
    expect(befund).toContain('20260901');
  });

  it('ROT-BEWEIS 2: Snapshot OHNE Fassungs-Marke — undeklarierte Fassung ist selbst ein Befund (§7)', () => {
    expect(standDriftBefund(null, V)).toBeNull();
    expect(versionsKlammerBefund(null, V)).toContain('Snapshot ohne stand/fassungsToken');
  });

  it('beide Seiten gleich ⇒ Klammer geschlossen, kein Befund', () => {
    expect(versionsKlammerBefund(V, { ...V })).toBeNull();
  });

  it('beide Seiten vorhanden, aber verschieden ⇒ unverändert der Drift-Befund von standDriftBefund', () => {
    const alt = { stand: '2025-01-01', fassungsToken: '20250101' };
    expect(versionsKlammerBefund(V, alt)).toBe(standDriftBefund(V, alt));
    expect(versionsKlammerBefund(V, alt)).toContain('≠');
  });
});

describe('uneinheitlicheSnapshotVersion', () => {
  it('alle Einträge dieselbe Fassung ⇒ kein Befund (Messung 14.9.2026: 228/228)', () => {
    expect(uneinheitlicheSnapshotVersion([V, { ...V }, { ...V }])).toBeNull();
  });

  it('leerer Snapshot ⇒ kein Befund (kein Messpunkt, aber auch kein Widerspruch)', () => {
    expect(uneinheitlicheSnapshotVersion([])).toBeNull();
  });

  it('ROT-BEWEIS 3: zwei Fassungen in EINER Datei ⇒ die Klammer misst am ersten Eintrag vorbei', () => {
    const befund = uneinheitlicheSnapshotVersion([V, { stand: '2024-03-03', fassungsToken: '20240303' }]);
    expect(befund).toContain('2 verschiedene Fassungen');
  });
});
