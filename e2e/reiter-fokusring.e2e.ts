// @shard-gruppe: nacht
import { test, expect, type Page } from '@playwright/test';

// ─── W2·19 DK-A · Reiter (`.lc-tab`) zeigen den Tastatur-Fokus (F3) ──────────
//
// BEFUND (Posten «Startseite: Frist-Tab ohne sichtbaren Fokusindikator»,
// gemessen 30.9.2026): `.lc-tab:focus-visible` setzte `outline: none` und legte
// den Fokus allein als `border-bottom-color: var(--focus)` auf den Zustands-
// strich. Der AKTIVE Reiter trägt aber schon `border-bottom-color: var(--ink-900)`
// (gleiche Spezifität, später im Quelltext) — die Fokus-Farbe verlor. Bei
// ARIA-Tabs (roving tabindex) ist genau der aktive Reiter der einzige per Tab
// erreichbare: Startseite «Frist», Tagerechner, ZPO-Fristen, Kündigung zeigten
// fokussiert ein Bild ohne Outline (`outline-style: none`), ohne Schatten und
// mit unveränderter Randfarbe — hell UND dunkel.
//
// ROT ZU BEKOMMEN (§6.7): in `src/index.css` bei `.lc-tab:focus-visible` wieder
// `outline: none` setzen — dann meldet jeder Fall `outline-style: none`.
//
// NACHBESSERUNG (Gegenprüfung 30.9.2026): der Ring stand auf `outline-offset:
// -2px` und überdeckte den 2-px-Zustandsstrich des aktiven Reiters (Pixelprobe
// dunkel: Strich 230,185,90 → Ring 148,144,136) — fokussiert-gewählt und
// fokussiert-ungewählt unterschieden sich nur noch durch die Schriftstärke. Die
// zweite Zusicherung unten liest darum die Pixel der Unterkante (Mitte, unterste
// Zeile) und verlangt die Strichfarbe, nicht die Ringfarbe. ROT ZU BEKOMMEN:
// `outline-offset: -2px` — dann trägt die Unterkante die Ringfarbe.

type Fokus = { text: string; fv: boolean; stil: string; breite: number; farbe: string; versatz: number; schatten: string };

/** Per echter Tastatur zum ersten `.lc-tab` tabben (nur so greift `:focus-visible`). */
async function tabZumReiter(page: Page): Promise<Fokus> {
  for (let n = 0; n < 80; n++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate((): Fokus | null => {
      const el = document.activeElement;
      if (!el || !el.classList.contains('lc-tab')) return null;
      const cs = getComputedStyle(el);
      return {
        text: (el.textContent ?? '').trim().slice(0, 30),
        fv: el.matches(':focus-visible'),
        stil: cs.outlineStyle,
        breite: parseFloat(cs.outlineWidth) || 0,
        farbe: cs.outlineColor,
        versatz: parseFloat(cs.outlineOffset) || 0,
        schatten: cs.boxShadow,
      };
    });
    if (f) return f;
  }
  throw new Error('kein `.lc-tab` per Tab erreichbar');
}

/** Liest die Pixel-Farbe (rgb) der untersten Zeile des fokussierten Reiters, horizontale Mitte (echter Screenshot). */
async function unterkantePixel(page: Page): Promise<{ pixel: [number, number, number]; strich: string; ring: string }> {
  const box = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { x: r.left, y: r.top, w: r.width, h: r.height, strich: cs.borderBottomColor, ring: cs.outlineColor };
  });
  // Ein 1-px-Streifen am unteren Rand, horizontale Mitte (Schriftspitzen liegen weit darüber).
  const png = await page.screenshot({
    clip: { x: Math.floor(box.x + box.w / 2), y: Math.floor(box.y + box.h) - 1, width: 1, height: 1 },
  });
  const pixel = await page.evaluate(async (b64): Promise<[number, number, number]> => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  }, png.toString('base64'));
  return { pixel, strich: box.strich, ring: box.ring };
}

const rgb = (c: string): [number, number, number] => {
  const m = c.match(/\d+(?:\.\d+)?/g) ?? [];
  return [Number(m[0]), Number(m[1]), Number(m[2])];
};
const abstand = (a: readonly number[], b: readonly number[]) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));

const FAELLE = [
  { route: '/', name: 'Startseite «Frist»', erwartet: /Frist/ },
  { route: '/rechner/tagerechner', name: 'Tagerechner', erwartet: /Allgemein/ },
  { route: '/rechner/zpo-fristen', name: 'ZPO-Fristen', erwartet: /Rechtsmittel/ },
] as const;

for (const schema of ['light', 'dark'] as const) {
  for (const f of FAELLE) {
    test(`${f.name} (${schema}): fokussierter Reiter trägt eine sichtbare Outline (F3)`, async ({ page }) => {
      await page.addInitScript((t) => {
        try { localStorage.setItem('lexmetrik-thema', t); } catch { /* privater Modus */ }
      }, schema === 'dark' ? 'dunkel' : 'hell');
      await page.emulateMedia({ colorScheme: schema, reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(f.route);
      await expect(page.locator('.lc-tab').first()).toBeVisible();
      const m = await tabZumReiter(page);
      expect(m.text, 'der erreichte Reiter ist der erwartete (aktive) Reiter').toMatch(f.erwartet);
      expect(m.fv, 'Tastatur-Fokus → :focus-visible').toBe(true);
      expect(m.stil, `${schema}: outline-style ${m.stil} (F3: kein Fokus ohne Outline)`).not.toBe('none');
      expect(m.breite, `${schema}: outline-width`).toBeGreaterThanOrEqual(2);
      expect(m.farbe, `${schema}: Outline-Farbe darf nicht transparent sein`).not.toMatch(/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)|transparent/);
      // Der Ring liegt INNEN (der Reiter-Behälter ist `overflow-x: auto`, aussen würde er beschnitten).
      expect(m.versatz, 'Ring nach innen gezogen').toBeLessThan(0);
    });
  }
}

// Zweite Zusicherung: der Ring verdeckt den Zustandsstrich des AKTIVEN Reiters nicht.
// Dunkel trennt die Farben (Strich Messing, Ring hellgrau); hell sind Strich und
// Ring beide Tinte — dort prüft die Probe nur, dass die Unterkante nicht leer ist.
for (const schema of ['light', 'dark'] as const) {
  for (const f of FAELLE) {
    test(`${f.name} (${schema}): Ring überdeckt den Zustandsstrich des aktiven Reiters nicht`, async ({ page }) => {
      await page.addInitScript((t) => {
        try { localStorage.setItem('lexmetrik-thema', t); } catch { /* privater Modus */ }
      }, schema === 'dark' ? 'dunkel' : 'hell');
      await page.emulateMedia({ colorScheme: schema, reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(f.route);
      await expect(page.locator('.lc-tab').first()).toBeVisible();
      const m = await tabZumReiter(page);
      expect(m.text).toMatch(f.erwartet);
      await page.waitForTimeout(400); // Farb-Übergang (.15s) abwarten
      const u = await unterkantePixel(page);
      const zuStrich = abstand(u.pixel, rgb(u.strich));
      const zuRing = abstand(u.pixel, rgb(u.ring));
      const ringUnterscheidbar = abstand(rgb(u.strich), rgb(u.ring)) > 24;
      expect(zuStrich, `${schema}: Unterkante ${u.pixel} statt Strichfarbe ${u.strich} (Ring ${u.ring})`).toBeLessThanOrEqual(8);
      if (ringUnterscheidbar) expect(zuRing, `${schema}: Unterkante trägt die Ringfarbe`).toBeGreaterThan(8);
    });
  }
}
