// @shard-gruppe: 5
// ═══ S6 W1f · DAS BLATT SCROLLT MIT DEM ARTIKEL (Meldung David 24.9.2026) ════
//
// Wörtlich: «erlass blatt scrollt nicht mit wenn sich artikel verändert».
// Gemessen von der Haupt-Session auf Prod (OR @1440, Stand #1040): Kopf und
// Inhalt des Blatts folgten dem Scroll-Spy (Art. 41 → 44), die innere
// Scrollfläche behielt aber ihre Lage — innen auf 600 gescrollt, an Art. 44
// dann scrollTop 153 (am Anschlag): die Liste des neuen Artikels begann mitten
// drin, Kopfteil und Filter weggescrollt.
//
// SOLL: wechselt der Bezugsartikel (`panelBezug`) oder der Reiter, steht die
// Scrollfläche oben (`LeserPanel`, Layout-Effekt, ohne Animation).
//
// ROT ZU BEKOMMEN (§6.7): in `v3/LeserPanel.tsx` den Layout-Effekt mit
// `scrollTo({ top: 0 … })` entfernen ⇒ (a) und (b) rot — so gefahren 24.9.2026
// gegen dist: (a) «… Artikelwechsel …» Received 138 (vgl. Prod 153), (b)
// «… Reiterwechsel …» Received 600.
import { test, expect, type Page } from '@playwright/test';
import { blattFuerArtikel, blattReiter } from './helpers/fassungsRubrik';

const scroller = (page: Page) => page.locator('[data-v3-panel] [data-v3-panel-scroller]').first();

/** Scrollt die Blatt-Fläche innen so weit wie möglich (höchstens 600) und gibt
 *  die erreichte Lage zurück — eine Lage > 0 ist die Vorbedingung des Falls. */
async function innenScrollen(page: Page): Promise<number> {
  const s = scroller(page);
  await expect.poll(() => s.evaluate((el) => el.scrollHeight - el.clientHeight), {
    message: 'die Blatt-Fläche hat nichts zu scrollen — der Fall prüfte nichts', timeout: 20_000,
  }).toBeGreaterThan(100);
  return s.evaluate((el) => { el.scrollTop = 600; return el.scrollTop; });
}

test.describe('S6 W1f · Scroll-Reset des Erlass-Blatts', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(a) Artikelwechsel: die Blatt-Fläche steht wieder oben', async ({ page }) => {
    await page.goto('/gesetze/bund/OR#art-41');
    await expect(page.locator('#art-41')).toBeVisible({ timeout: 20_000 });
    await blattFuerArtikel(page.locator('#art-41'), 20_000);
    await expect(page.locator('[data-v3-panel-entscheid]').first()).toBeVisible({ timeout: 20_000 });
    const vorher = await innenScrollen(page);
    expect(vorher, 'Vorbedingung: innen gescrollt').toBeGreaterThan(50);
    await blattFuerArtikel(page.locator('#art-44'), 20_000);
    await expect.poll(() => scroller(page).evaluate((el) => el.scrollTop),
      { message: 'nach dem Artikelwechsel steht die Blatt-Fläche nicht oben' }).toBe(0);
  });

  test('(b) Reiterwechsel: die Blatt-Fläche steht wieder oben', async ({ page }) => {
    await page.goto('/gesetze/bund/OR#art-41');
    await expect(page.locator('#art-41')).toBeVisible({ timeout: 20_000 });
    await blattFuerArtikel(page.locator('#art-41'), 20_000);
    // Zwei LANGE Tafeln, sonst kappte schon die Höhe die Lage auf 0 und der Fall
    // prüfte nichts: die aufgeklappte Erlass-Liste in «Änderungen», dann zurück
    // zu «Entscheide» (Art. 41 OR trägt eine lange Liste).
    await blattReiter(page, 'aenderungen');
    await page.locator('[data-v3-blatt-erlassteil="aenderungen"] > button').click();
    await expect(page.locator('[data-v3-panel-aenderung]').first()).toBeVisible({ timeout: 20_000 });
    expect(await innenScrollen(page)).toBeGreaterThan(50);
    await blattReiter(page, 'entscheide');
    await expect(page.locator('[data-v3-panel-entscheid]').first()).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => scroller(page).evaluate((el) => el.scrollTop),
      { message: 'nach dem Reiterwechsel steht die Blatt-Fläche nicht oben' }).toBe(0);
  });
});
