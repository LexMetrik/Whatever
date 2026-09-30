// Gesperrte Haus-Knöpfe sind EINFACH gedämpft (W2·19 Kleinaufräumen 2,
// 30.9.2026; Fund aus #1191 «DK-11-Rest»): `.lc-btn-primary/-outline/-ghost`
// tragen die Sperre über ihre Anatomie (index.css: versenkte Fläche, ink-600,
// `opacity: 1`). Eine zusätzliche `disabled:opacity-*`-Utility am selben Knopf
// dämpft doppelt — die Fläche ist dann durchscheinend statt versenkt.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_WURZEL, alleTsx, liesOhneKommentare, rel } from './appDateien';

/** Ein Element-Start mit Haus-Knopf-Klasse UND `disabled:opacity-…` im selben Tag. */
const DOPPELT = /<(?:button|a)\b(?:=>|[^>])*?lc-btn(?:-primary|-outline|-ghost)?(?![\w-])(?:=>|[^>])*?disabled:opacity-\d+/s;
const DOPPELT_RUECKWAERTS = /<(?:button|a)\b(?:=>|[^>])*?disabled:opacity-\d+(?:=>|[^>])*?lc-btn(?:-primary|-outline|-ghost)?(?![\w-])/s;
const doppelt = (q: string): boolean => DOPPELT.test(q) || DOPPELT_RUECKWAERTS.test(q);

describe('gesperrte lc-btn: keine zweite Dämpfung per disabled:opacity-*', () => {
  it('kein Haus-Knopf der App trägt zusätzlich disabled:opacity-*', () => {
    const funde = alleTsx().filter((p) => doppelt(liesOhneKommentare(p))).map(rel);
    expect(funde, 'die Anatomie `.lc-btn*:disabled` dämpft schon — `disabled:opacity-*` daneben ist doppelt').toEqual([]);
  });

  it('ROT-BEWEIS: die Probe erkennt die Vorher-Form (MappenDialog vor Kleinaufräumen 2)', () => {
    const vorher = '<button type="button" disabled={!name.trim()} className="lc-btn-primary lc-btn-sm disabled:opacity-40">X</button>';
    expect(doppelt(vorher)).toBe(true);
    // Pfeilfunktion im Tag (`=>` enthält ein `>`) darf die Probe nicht abschneiden.
    expect(doppelt('<button onClick={() => x()} className="lc-btn-ghost disabled:opacity-50">X</button>')).toBe(true);
    // Negativ-Kontrollen: einfache Sperre, und ein Nicht-Haus-Knopf mit eigener Dämpfung.
    expect(doppelt('<button className="lc-btn-primary lc-btn-sm">X</button>')).toBe(false);
    expect(doppelt('<button className="rounded text-ink-500 disabled:opacity-30">X</button>')).toBe(false);
  });

  it('die Sperre des MappenDialog-Speichern-Knopfs steht weiter auf `disabled` (Bedienlogik unberührt)', () => {
    const q = readFileSync(join(APP_WURZEL, 'components/layout/reiterleiste/MappenDialog.tsx'), 'utf8');
    expect(q).toMatch(/disabled=\{!name\.trim\(\)\}/);
  });
});
