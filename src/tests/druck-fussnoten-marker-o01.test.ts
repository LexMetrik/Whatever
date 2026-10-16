// ─── Druck: Fussnoten-Marker bleiben stehen (O-01) ──────────────────────────
//
// Der Marker einer Fussnote ist ein `<button data-fn-ref>`; die Pauschalregel des
// Druckblocks (`button { display: none !important }`) warf ihn aus jedem
// Ausdruck, während die Fussnoten-Texte druckten. Gemessen 15.10.2026 (STPO,
// Playwright `emulateMedia('print')`): 285 Marker im DOM, 0 sichtbar; mit der
// Ausnahme 285 sichtbar, Bildschirm unverändert.
//
// Dieser Wächter sichert die Kopplung, die die Messung voraussetzt: (1) der
// Marker ist weiterhin ein `<button>` mit `data-fn-ref` (sonst greift die
// Ausnahme nicht oder die Pauschalregel trifft ihn anders), (2) im Druckblock
// steht die Ausnahme `button[data-fn-ref]` mit sichtbarer Anzeige, (3) sie
// steht hinter der Pauschalregel und trägt mindestens deren Gewicht (!important).
// Das Verhalten im Druckmedium prüft die Messung im PR (headless Chromium).
//
// ROT ZU BEKOMMEN: die Zeile `button[data-fn-ref] { display: inline-block … }`
// aus dem Druckblock von `src/index.css` streichen → (2) und (3) rot.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const CSS = readFileSync('src/index.css', 'utf8');
const BODY = readFileSync('src/components/normtext/ArtikelBody.tsx', 'utf8');

/** Der Rumpf des ersten `@media print { … }`-Blocks, der die Pauschalregel führt. */
function druckBlockMitPauschalregel(): string {
  const re = /@media print\s*\{/g;
  for (let m = re.exec(CSS); m; m = re.exec(CSS)) {
    let tiefe = 1;
    let i = m.index + m[0].length;
    const start = i;
    for (; i < CSS.length && tiefe > 0; i++) {
      if (CSS[i] === '{') tiefe++;
      else if (CSS[i] === '}') tiefe--;
    }
    const rumpf = CSS.slice(start, i - 1);
    if (/header\.lc-glass,[^{]*\bbutton\b[^{]*\{\s*display:\s*none\s*!important/.test(rumpf)) return rumpf;
  }
  throw new Error('Druckblock mit der Pauschalregel für Bedienelemente nicht gefunden');
}

describe('O-01 · Fussnoten-Marker im Druck', () => {
  const druck = druckBlockMitPauschalregel();

  it('der Marker ist ein <button> mit data-fn-ref (Voraussetzung der Ausnahme)', () => {
    expect(BODY).toMatch(/<button type="button" data-fn-ref\b/);
  });

  it('der Druckblock nimmt `button[data-fn-ref]` von der Pauschalregel aus', () => {
    expect(druck).toMatch(/button\[data-fn-ref\]\s*\{\s*display:\s*inline-block\s*!important\s*;?\s*\}/);
  });

  it('die Ausnahme steht NACH der Pauschalregel und trägt !important', () => {
    const pauschal = druck.search(/header\.lc-glass,[^{]*\bbutton\b[^{]*\{/);
    const ausnahme = druck.search(/button\[data-fn-ref\]\s*\{/);
    expect(pauschal).toBeGreaterThanOrEqual(0);
    expect(ausnahme).toBeGreaterThan(pauschal);
  });

  it('die Pauschalregel selbst bleibt (andere Bedienelemente fallen weiter aus dem Druck)', () => {
    expect(druck).toMatch(/header\.lc-glass,[^{]*\bbutton\b[^{]*\{\s*display:\s*none\s*!important/);
  });
});
