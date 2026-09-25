// @shard-gruppe: 3
import { test, expect } from '@playwright/test';

// ─── /gesetze auf Stufe `weit` (W2·31-BILDSCHIRMBREITE B4, 25.9.2026) ────────
//
// `e2e/seitenbreite.e2e.ts` prüft den RAHMEN der Seitenart (1440 px ab 2xl).
// Was die Breite dort NUTZT, prüft nur dieser Wächter:
//  (1) Das Erlass-Register der Rechtsgebiet-Übersicht bleibt zweispaltig —
//      die Breite geht an die Titel-Spur, nicht an eine dritte Spalte
//      (Begründung am `.tb-raster-2` in index.css). Gemessen (dev, 25.9.2026):
//      @1920 zwei Spalten à 660 px, 20 von 241 Titeln gekappt; vorher 500 px
//      und 93 gekappt; eine dritte Spalte (CSS-Probe) kappte 156. Schwelle:
//      Spalten ≥ 600 px und höchstens ein Fünftel der Titel gekappt (vorher
//      39 %). Anteil statt Zahl, damit der wachsende Korpus nicht pinnt.
//  (2) @1440 (Stufe content) wie vor B4: zwei Spalten unter 520 px.
//  (3) @1536 mit offener Seitenleiste (460 px): die Liste hängt an ihrem
//      Container (`.tb-huelle`), nicht am Viewport — weiter zwei Spalten.
//  (4) Das Filterfeld läuft nicht über die weite Breite: ≤ 70rem.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): (1) `gesetze` in seitenbreite.ts
// zurück auf `content` → 500 px / 39 % gekappt; (4) `max-w-content` an
// `.ub-filter` in Gesetze.tsx streichen → 1392 px.

const LISTE = '#rechtsgebiete-uebersicht .tb-raster';

async function messe(page: import('@playwright/test').Page) {
  await expect(page.locator(`${LISTE} .tb-zeile`).first()).toBeVisible();
  return page.evaluate((sel) => {
    const ul = document.querySelector(sel) as HTMLElement;
    const cols = getComputedStyle(ul).gridTemplateColumns.split(' ').map(parseFloat);
    const titel = [...document.querySelectorAll('#rechtsgebiete-uebersicht .tb-titel')] as HTMLElement[];
    const gekappt = titel.filter((t) => t.scrollHeight > t.clientHeight + 1).length;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const filter = (document.querySelector('.ub-filter') as HTMLElement).getBoundingClientRect().width;
    return { cols, anteil: gekappt / titel.length, filterRem: filter / rem };
  }, LISTE);
}

test('/gesetze @1920 (weit): Register zweispaltig mit breiter Titel-Spur, Filterfeld ≤ 70rem', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/gesetze');
  const m = await messe(page);
  expect(m.cols).toHaveLength(2);
  for (const c of m.cols) expect(c).toBeGreaterThanOrEqual(600);
  expect(m.anteil).toBeLessThanOrEqual(0.2);
  expect(m.filterRem).toBeLessThanOrEqual(70 + 0.1);
});

test('/gesetze @1440 (content): Register wie vor B4 — zwei Spalten unter 520 px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/gesetze');
  const m = await messe(page);
  expect(m.cols).toHaveLength(2);
  for (const c of m.cols) expect(c).toBeLessThan(520);
});

test('/gesetze @1536 mit Seitenleiste 460 px: Register folgt dem Container, zwei Spalten', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lexmetrik-seitenleiste-eingeklappt.v2', '0');
    localStorage.setItem('lexmetrik-seitenleiste-breite', '460');
  });
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.goto('/gesetze');
  const m = await messe(page);
  expect(m.cols).toHaveLength(2);
  for (const c of m.cols) expect(c).toBeGreaterThanOrEqual(440);
});
