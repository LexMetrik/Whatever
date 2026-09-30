// Facetten-Schalter: der Tastatur-Fokus bleibt auch am gedrückten Schalter einer
// Registerzeile sichtbar (W2·19 Kleinaufräumen 30.9.2026; Posten aus Bau DK-A #1170).
// Befund: `.fc-zeile[data-reg="x"] .fc-schalter[aria-pressed="true"]` (0,4,0)
// überschrieb `.fc-schalter:focus-visible` (0,2,0) — gedrückt + fokussiert sah
// aus wie gedrückt. Gemessen im Browser (/rechtsprechung): border-bottom-color
// blieb reg-r. Die Sonde liest das Blatt als Text (Spezifität + Reihenfolge).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_WURZEL, ohneKommentare } from './appDateien';

const CSS = ohneKommentare(readFileSync(join(APP_WURZEL, 'index.css'), 'utf8'));

/** Spezifität (Klassen + Attribute + Pseudo-Klassen) eines einfachen Selektors ohne :where/:not. */
const spez = (sel: string): number =>
  (sel.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) ?? []).length;

const REG_ZEILEN = ['g', 'r', 'm', 'w'].map((r) => `.fc-zeile[data-reg="${r}"] .fc-schalter[aria-pressed="true"]`);
const FOKUS = '.fc-zeile[data-reg] .fc-schalter:focus-visible';

describe('fc-schalter: Fokus gegen Registerkante', () => {
  it('die Fokus-Regel für Registerzeilen existiert und setzt die Fokusfarbe', () => {
    expect(CSS).toContain(`${FOKUS} { border-bottom-color: var(--focus); }`);
  });

  it('sie steht NACH den vier Registerkanten und hat mindestens deren Spezifität', () => {
    const fokusPos = CSS.indexOf(FOKUS);
    for (const sel of REG_ZEILEN) {
      expect(CSS.indexOf(sel), `${sel} im Blatt`).toBeGreaterThan(-1);
      expect(fokusPos, `Fokus nach ${sel}`).toBeGreaterThan(CSS.indexOf(sel));
      expect(spez(FOKUS), `Spezifität gegen ${sel}`).toBeGreaterThanOrEqual(spez(sel));
    }
  });

  it('Sonde: die Spezifitäts-Zählung unterscheidet (Vorher-Zustand wäre rot)', () => {
    expect(spez('.fc-schalter:focus-visible')).toBe(2);
    expect(spez(REG_ZEILEN[0])).toBe(4);
    expect(spez('.fc-schalter:focus-visible')).toBeLessThan(spez(REG_ZEILEN[0]));
  });
});
