// @shard-gruppe: 8
// e2e/w229-blatt-runde2.e2e.ts —Erlass-Blatt Runde 2 (W2·29-WERKBANK-LESER, 24.9.2026).
//
// Vier Befunde, je vorher gemessen (Build, OR, Chromium headless):
//  (a) Blatt mobil sprang beim Laden: @390×844 oben 527 → 380 px (+147 px),
//      weil `maxHeight` ein Deckel war und die Höhe der Liste folgte.
//      Rot zu bekommen: in `v3/blattFlaeche` `height` wieder zu `maxHeight`.
//  (b) «r» schloss das modale Blatt nicht (Guard 3 in `parts/LeserTastatur`).
//      Rot zu bekommen: die «r»-Selbst-Ausnahme vor Guard 3 entfernen.
//  (c) `?ansicht=artikel#art-336c` fiel auf die Gesamtansicht (scrollY 220'968).
//      Rot zu bekommen: in `v3/useEinzelModus` `kanonischerAnkerToken` entfernen.
//  (d) «Entwurf» stand an 8 verschiedenen x-Lagen (68…297 px @390).
//      Rot zu bekommen: `WerkzeugKopf` wieder als flex-wrap-Zeile.
import { test, expect, type Page } from '@playwright/test';

async function blattAuf(page: Page) {
  const z = page.locator('[data-v3-panel-zaehler]').first();
  await expect(z).toBeVisible({ timeout: 20_000 });
  await z.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  if ((await z.getAttribute('aria-expanded')) !== 'true') await z.click();
  await expect(page.locator('[data-v3-panel]').first()).toBeVisible({ timeout: 20_000 });
}

test.describe('W2·29 Runde 2 · Erlass-Blatt mobil', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('(a) das Blatt hat seine Höhe ab dem ersten Bild — kein Sprung, wenn die Liste kommt', async ({ page }) => {
    await page.goto('/gesetze/bund/OR#art-336_c');
    await blattAuf(page);
    const blatt = page.locator('[data-v3-panel-form="unten"]');
    const vorher = (await blatt.boundingBox())!;
    // Produkt-Signal statt Wartezeit: die Entscheid-Liste ist da.
    await expect(page.locator('[data-v3-panel-entscheid]').first()).toBeVisible({ timeout: 30_000 });
    const nachher = (await blatt.boundingBox())!;
    expect(Math.abs(nachher.y - vorher.y), `Blatt sprang: ${vorher.y} → ${nachher.y}`).toBeLessThanOrEqual(1);
    // Anteil: höher als der alte 55-%-Deckel (464 px), Kopfzeile des Artikels bleibt frei.
    expect(nachher.height, `Blatt ${nachher.height} px`).toBeGreaterThan(844 * 0.6);
    expect(nachher.y + nachher.height).toBeCloseTo(844, 0);
  });

  test('(b) «r» schliesst das offene Blatt und öffnet es wieder', async ({ page }) => {
    await page.goto('/gesetze/bund/OR#art-336_c');
    await blattAuf(page);
    await page.locator('[data-v3-panel-reiter]').first().focus();
    await page.keyboard.press('r');
    await expect(page.locator('[data-v3-panel]')).toHaveCount(0);
    await page.keyboard.press('r');
    await expect(page.locator('[data-v3-panel]').first()).toBeVisible();
  });

  test('(d) «Entwurf» steht an jeder Werkzeug-Zeile, in EINER Spalte', async ({ page }) => {
    await page.goto('/gesetze/bund/OR#art-336_c');
    await blattAuf(page);
    await page.locator('[data-v3-panel-reiter="werkzeuge"]').click();
    await page.locator('[data-v3-blatt-erlassteil="werkzeuge"] summary, [data-v3-blatt-erlassteil="werkzeuge"] button').first().click();
    const zeilen = page.locator('[data-v3-werkzeug]');
    await expect(zeilen.first()).toBeVisible();
    const lagen = await page.$$eval('[data-v3-werkzeug] [data-v3-werkzeug-status="entwurf"]',
      (els) => els.map((e) => Math.round(e.getBoundingClientRect().right)));
    // §8: das Etikett ist da (nicht entfernt) …
    expect(lagen.length).toBeGreaterThan(0);
    // … und steht bündig in einer Spalte.
    expect(new Set(lagen).size, `x-Lagen ${lagen.join(',')}`).toBe(1);
  });
});

test.describe('W2·29 Runde 2 · Einzelmodus-Anker', () => {
  for (const [w, h] of [[390, 844], [1440, 900]] as const) {
    test(`(c) @${w}: #art-336c zeigt im Einzelmodus Art. 336c`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/gesetze/bund/OR?ansicht=artikel#art-336c');
      await expect(page.locator('#art-336_c')).toBeVisible({ timeout: 20_000 });
      // Einzelmodus = nur dieser Artikel im DOM, nicht der ganze Erlass.
      await expect(page.locator('#art-336_b')).toHaveCount(0);
    });
  }
});
