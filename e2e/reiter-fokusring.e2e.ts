// @shard-gruppe: 6
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
