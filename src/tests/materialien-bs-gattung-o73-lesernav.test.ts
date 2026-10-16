// LESER-NAV O-73 (16.10.2026) · Jede Geschäftsart der Grundmenge des Grossen Rates BS ist
// Gesetzgebungsmaterial (Reiter «Materialien»), keine Behördenpublikation (Reiter «Erläuterungen»).
//
// Beleg: `scripts/materialien/bs-materialien.ts` führt als Grundmenge «die Geschäftsarten, die
// überhaupt Materialien sind» (`GESCHAEFTSARTEN`: Ratschlag, Bericht, Ausgabenbericht), und
// `GESCHAEFTSART_DOKTYP` bildet jede auf einen eigenen Doktyp ab. `KANTONALE_GESETZGEBUNG`
// (src/lib/materialien/gattung.ts) führte nur zwei der drei (+ Initiative): ein künftiger
// Ausgabenbericht (heute 0 Einträge im Register, gezählt 16.10.2026) wäre als Behördenpublikation
// in «Erläuterungen» gelandet. Die Prüfung läuft über die Grundmenge, nicht über eine zweite Liste:
// ein neuer BS-Doktyp ohne Gattungs-Zuordnung wird so rot.
import { describe, expect, it } from 'vitest';
import { DOKTYP_BS } from '../../scripts/materialien/bs-materialien';
import { KANTONALE_GESETZGEBUNG, gattungVon } from '../lib/materialien/gattung';

describe('O-73 · BS-Grossrat-Doktypen sind Gesetzgebungsmaterial', () => {
  it('jeder Doktyp der BS-Grundmenge gehört zur kantonalen Gesetzgebung und in den Reiter «Materialien»', () => {
    // Nulltest (§6.7): die Grundmenge ist nicht leer und enthält den Ausgabenbericht.
    expect(DOKTYP_BS).toContain('gr-ausgabenbericht');
    for (const d of DOKTYP_BS) {
      expect(KANTONALE_GESETZGEBUNG.has(d), d).toBe(true);
      expect(gattungVon(d), d).toBe('materialien');
    }
  });

  it('Gegenprobe: eine Behördenpublikation bleibt in «Erläuterungen»', () => {
    expect(gattungVon('wegleitung')).toBe('erlaeuterungen');
    expect(gattungVon('mitteilung')).toBe('erlaeuterungen');
  });
});
