// @shard-gruppe: 3
import { test, expect, type Page } from '@playwright/test';

// ─── /suche: Lesespalte + klebende Filterspalte (W2·31-BILDSCHIRMBREITE B9, 25.9.2026) ─
//
// `pages/Suche.tsx` stellt ab 62 rem Seitenbreite (Container-Query
// `@container/suche`) Suchfeld und Treffer in die Lesespalte (40 rem) und den
// Inhaltstyp-Filter als senkrechte, klebende Liste in die Randspalte; darunter
// einspaltig in der bisherigen Reihenfolge Feld → Filter → Treffer.
// `e2e/seitenbreite.e2e.ts` misst /suche nur OHNE Suchbegriff (kein Filter, keine
// Treffer) — diese Anordnung wäre dort unbewacht.
//
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit-Bericht B9): `@[62rem]/suche:grid`
// entfernen → @1280/@1920 steht der Filter unter dem Feld statt daneben;
// `@[62rem]/suche:sticky` entfernen → nach dem Scrollen ist der Filter weg;
// `max-w-reading` an `[data-suche-lesespalte]` entfernen → einspaltig
// @1000 (Seitenbreite < 62 rem) laufen die Trefferzeilen über 40 rem.

async function box(page: Page, sel: string) {
  const b = await page.locator(sel).first().boundingBox();
  expect(b, `${sel} sichtbar`).not.toBeNull();
  return b!;
}

async function laden(page: Page, breite: number) {
  await page.setViewportSize({ width: breite, height: 900 });
  await page.goto('/suche?q=miete');
  await expect(page.getByRole('group', { name: /Nach Inhaltstyp filtern/ })).toBeVisible();
  await expect(page.locator('[data-suche-lesespalte] li').first()).toBeVisible();
  return page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
}

for (const breite of [1280, 1920]) {
  test(`@${breite}: Filter rechts neben der Lesespalte, obenbündig mit dem Feld; Treffer ≤ 40 rem; klebt beim Scrollen`, async ({ page }) => {
    const rem = await laden(page, breite);
    const feld = await box(page, 'main [role="search"]');
    const lese = await box(page, '[data-suche-lesespalte]');
    const filter = await box(page, '[data-suche-filter]');
    expect(filter.x, 'Filter rechts der Lesespalte').toBeGreaterThanOrEqual(lese.x + lese.width + rem);
    expect(Math.abs(filter.y - feld.y), 'obenbündig mit dem Suchfeld').toBeLessThanOrEqual(1);
    expect(lese.width, 'Lesespalte = max-w-reading').toBeLessThanOrEqual(40 * rem + 1);
    const zeile = await box(page, '[data-suche-lesespalte] li');
    expect(zeile.width, 'Trefferzeile im Lesemass').toBeLessThanOrEqual(40 * rem + 1);
    // Senkrechte Liste: die Schalter stehen untereinander (gleiche linke Kante).
    const xs = await page.locator('[data-suche-filter] button').evaluateAll((bs) => bs.map((b) => Math.round(b.getBoundingClientRect().x)));
    expect(new Set(xs).size, 'Filter-Schalter untereinander').toBe(1);
    await page.evaluate(() => window.scrollTo(0, 3000));
    await expect.poll(async () => (await page.locator('[data-suche-filter]').boundingBox())?.y ?? -1,
      { message: 'Filter klebt im Bild' }).toBeGreaterThanOrEqual(0);
    const nachher = (await page.locator('[data-suche-filter]').boundingBox())!;
    expect(nachher.y + nachher.height).toBeLessThanOrEqual(900);
  });
}

test('@1000 (< 62 rem): einspaltig, Treffer trotzdem im Lesemass', async ({ page }) => {
  const rem = await laden(page, 1000);
  const feld = await box(page, 'main [role="search"]');
  const filter = await box(page, '[data-suche-filter]');
  expect(filter.y, 'Filter unter dem Feld').toBeGreaterThanOrEqual(feld.y + feld.height);
  const zeile = await box(page, '[data-suche-lesespalte] li');
  expect(zeile.width).toBeLessThanOrEqual(40 * rem + 1);
});

test('@390: Feld → Filter → Treffer untereinander, kein Querscroll', async ({ page }) => {
  await laden(page, 390);
  const feld = await box(page, 'main [role="search"]');
  const filter = await box(page, '[data-suche-filter]');
  const lese = await box(page, '[data-suche-lesespalte]');
  expect(filter.y).toBeGreaterThanOrEqual(feld.y + feld.height);
  expect(lese.y).toBeGreaterThanOrEqual(filter.y + filter.height);
  const quer = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(quer).toBeLessThanOrEqual(0);
});
