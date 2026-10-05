// @shard-gruppe: nacht
import { test, expect, type Page } from '@playwright/test';

// ─── Gegenprüfung PR #1153 (mittel) · Fokusring in der Themenleiste beschnitten ─
//
// BEFUND: `.kt-werkbank > .kt-einstieg` (index.css, W2·31 B) bekam
// `overflow-y: auto`. Nach CSS-Spezifikation berechnet sich `overflow-x` dann
// NICHT mehr zu `visible`, sondern implizit zu `auto` (beide Achsen clippen,
// sobald eine von beiden einen scrollenden Wert trägt) — die Leiste wurde
// damit zu einem `data-v3-leiste-scroller`-artigen Clip-Behälter, ohne dass
// eine eigene Zeile das ausdrückt. `padding-left: 0` (kein horizontales
// Innenmass in `.kt-einstieg`/`.kt-gebiete`) setzt jedes `summary`/`a` direkt
// an die linke Innenkante des Scrollers — der `:focus-visible`-Ring
// (`outline: 2px solid`, `outline-offset: 2px`, index.css ~Z. 1350) ragt 4 px
// über die Elementkante hinaus und wird links vom eigenen Scroller
// abgeschnitten. Dieselbe Fehlerklasse wie Ä67 (index.css ~Z. 2446,
// `e2e/leser-v3-fokusring-suchfeld.e2e.ts`): ein Ring, der aus seinem Element
// herausragt, ist in jedem scrollenden Behälter angreifbar. FIX hier im
// selben Muster: der Ring wird für fokussierte Elemente INNERHALB von
// `.kt-einstieg` nach innen gezogen (`outline-offset: -2px`), unabhängig von
// der Kante — betrifft alle 65 fokussierbaren `summary`/`a` der Leiste
// (33 `summary` je Rechtsgebiet + 32 Karten-Links, Stand 29.9.2026).
//
// ROT ZU BEKOMMEN (§6.7): in `src/index.css` die neue Regel
// `.kt-einstieg :focus-visible { outline-offset: -2px; }` entfernen — Test
// (a) meldet dann eine negative Distanz zwischen Ring und Scroller-Innenkante
// (abgeschnitten).

async function ringUeberstandLinks(page: Page, selector: string): Promise<{ ueberstand: number; ow: number; clipMarke: string }> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) throw new Error(`Element nicht gefunden: ${sel}`);
    const cs = getComputedStyle(el);
    const fb = el.getBoundingClientRect();
    const ow = parseFloat(cs.outlineWidth) || 0;
    const oo = parseFloat(cs.outlineOffset) || 0;
    const ringLinks = fb.left - oo - ow;
    let vorfahre = el.parentElement;
    let clip: { l: number; marke: string } | null = null;
    while (vorfahre && vorfahre !== document.documentElement) {
      const s = getComputedStyle(vorfahre);
      const clippt = [s.overflow, s.overflowX, s.overflowY].some(
        (v) => v === 'hidden' || v === 'clip' || v === 'auto' || v === 'scroll',
      );
      if (clippt) {
        const b = vorfahre.getBoundingClientRect();
        clip = { l: b.left, marke: vorfahre.className || vorfahre.tagName.toLowerCase() };
        break;
      }
      vorfahre = vorfahre.parentElement;
    }
    if (!clip) return { ueberstand: 0, ow, clipMarke: '(keiner)' };
    // Positiv = Ring liegt links VOM Clip entfernt (nicht beschnitten).
    return { ueberstand: +(ringLinks - clip.l).toFixed(1), ow, clipMarke: clip.marke };
  }, selector);
}

async function oeffneMitLeiste(page: Page, breite: number): Promise<void> {
  await page.setViewportSize({ width: breite, height: 900 });
  await page.goto('/rechner');
  await expect(page.locator('.kt-einstieg')).toBeVisible();
}

for (const schema of ['light', 'dark'] as const) {
  test(`(a) /rechner @1280 (${schema}): Fokusring der ersten Rechtsgebiet-Zeile nicht links beschnitten`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: schema, reducedMotion: 'reduce' });
    await oeffneMitLeiste(page, 1280);
    const summary = page.locator('.kt-einstieg summary').first();
    await summary.focus();
    await expect(summary).toBeFocused();
    const m = await ringUeberstandLinks(page, '.kt-einstieg summary');
    expect(m.ow, `${schema}: kein Fokusring gemessen (outline-width 0)`).toBeGreaterThanOrEqual(2);
    expect(
      m.ueberstand,
      `${schema}: Ring ${Math.abs(m.ueberstand)} px links vom Clip «${m.clipMarke}» beschnitten`,
    ).toBeGreaterThanOrEqual(0);
  });
}

test('(b) /rechner @1440: Karten-Link per echter Tab-Navigation erreicht, Ring bleibt innen (rechts/oben/unten)', async ({ page }) => {
  await oeffneMitLeiste(page, 1440);
  // Erste Karten-Verknüpfung per ECHTER Tastatur-Navigation fokussieren (nicht
  // `.focus()` auf ein Element nach einem Maus-Klick — Chromium markiert ein
  // per Skript fokussiertes `<a>` nach vorangehender Zeigerinteraktion NICHT
  // als `:focus-visible`, gemessen: `outlineStyle: 'none'`,
  // `el.matches(':focus-visible') === false`. Reale Tastatur-Bedienung, wie im
  // Befund («Tab-Fokus»), triggert `:focus-visible` zuverlässig — das ist auch
  // die Prüfung, die zählt: der Ring soll für Tastatur-Nutzer nicht
  // abgeschnitten sein.) Muster Ä67: alle vier Kanten gegen den engsten Clip.
  const summary = page.locator('.kt-einstieg summary').first();
  await summary.focus();
  await page.keyboard.press('Enter'); // öffnet <details> per Tastatur, wie ein echter Nutzer
  const link = page.locator('.kt-einstieg a').first();
  await expect(link).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();

  const kanten = await page.evaluate(() => {
    const el = document.querySelector('.kt-einstieg a') as HTMLElement | null;
    if (!el) throw new Error('kein Link');
    const cs = getComputedStyle(el);
    const fb = el.getBoundingClientRect();
    const ow = parseFloat(cs.outlineWidth) || 0;
    const oo = parseFloat(cs.outlineOffset) || 0;
    const ring = { l: fb.left - oo - ow, t: fb.top - oo - ow, r: fb.right + oo + ow, b: fb.bottom + oo + ow };
    const scroller = document.querySelector('.kt-einstieg') as HTMLElement;
    const c = scroller.getBoundingClientRect();
    return {
      links: +(ring.l - c.left).toFixed(1),
      oben: +(ring.t - c.top).toFixed(1),
      rechts: +(c.right - ring.r).toFixed(1),
      unten: +(c.bottom - ring.b).toFixed(1),
      ow,
    };
  });
  expect(kanten.ow, 'kein Fokusring gemessen').toBeGreaterThanOrEqual(2);
  for (const kante of ['links', 'oben', 'rechts', 'unten'] as const) {
    expect(kanten[kante], `Ring ${kante} um ${kanten[kante]} px beschnitten`).toBeGreaterThanOrEqual(-0.5);
  }
});
