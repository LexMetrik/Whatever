// W2·17-UI-BEFUNDE E-D1-B04 (1.10.2026): «abgerufen am» im kopierten Zitat ist das
// Datum des Nutzers (Ortszeit), nicht das UTC-Datum — sonst trägt die Kopie
// zwischen 00:00 und 01:00/02:00 Schweizer Zeit den Vortag.
import { afterEach, describe, expect, it } from 'vitest';
import { heuteIso } from '../lib/format';

const TZ_VORHER = process.env.TZ;
afterEach(() => {
  if (TZ_VORHER === undefined) delete process.env.TZ;
  else process.env.TZ = TZ_VORHER;
});

describe('E-D1-B04 heuteIso — lokales Kalenderdatum', () => {
  it('Fr 02.10.2026 01:30 CEST (= 01.10. 23:30 UTC) → 2026-10-02', () => {
    process.env.TZ = 'Europe/Zurich';
    expect(heuteIso(new Date('2026-10-01T23:30:00Z'))).toBe('2026-10-02');
  });

  it('Winterzeit: 01.01.2027 00:30 MEZ (= 31.12. 23:30 UTC) → 2027-01-01', () => {
    process.env.TZ = 'Europe/Zurich';
    expect(heuteIso(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
  });

  it('Tagesmitte und Zeitzone UTC unverändert', () => {
    process.env.TZ = 'Europe/Zurich';
    expect(heuteIso(new Date('2026-10-01T12:00:00Z'))).toBe('2026-10-01');
    process.env.TZ = 'UTC';
    expect(heuteIso(new Date('2026-10-01T23:30:00Z'))).toBe('2026-10-01');
  });

  it('Monats- und Jahresgrenze: einstellige Teile bleiben zweistellig', () => {
    process.env.TZ = 'Europe/Zurich';
    expect(heuteIso(new Date('2026-02-28T23:10:00Z'))).toBe('2026-03-01');
    expect(heuteIso(new Date(2026, 0, 5, 9, 0))).toBe('2026-01-05');
  });
});
