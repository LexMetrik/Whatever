// @shard-gruppe: 1
// W2·17-UI-BEFUNDE · Tieflink-Robustheit im Gesetzes-Leser.
//
//  PA-1-B01 (hoch)  `/gesetze/bund/OR#art-97%` — ein kaputtes %-Escape im Anker
//                   warf `URIError` in `ScrollZuHash` (App.tsx, ausserhalb der
//                   ErrorBoundary) und liess die GANZE App weiss.
//  PA-4-B01         Erlasse OHNE Gliederung: der Tieflink sprang nicht, die Seite
//                   blieb bei scrollY 0 (`!sektionen.length`-Wache). Nachgestellt
//                   mit verzögerter Erlass-Datei: auf schneller Leitung rettet der
//                   30-Frame-Retry in `ScrollZuHash` den Fall zufällig.
//  B7               Artikel vor dem ersten Abschnitt: die Gliederungszeile
//                   «Ohne Abschnitt» blieb zu, obwohl der Leser in ihr stand.
import { test, expect } from '@playwright/test';

test.describe('Tieflink — Robustheit (W2·17-UI-BEFUNDE)', () => {
  test('PA-1-B01 · kaputtes %-Escape im Anker: kein Absturz, der Leser steht', async ({ page }) => {
    const fehler: string[] = [];
    page.on('pageerror', (e) => fehler.push(String(e)));
    await page.goto('/gesetze/bund/OR#art-97%');
    // Der Leser rendert: Artikel stehen im DOM und die App-Hülle ist da.
    await expect(page.locator('[id^="art-"]').first()).toBeAttached({ timeout: 20_000 });
    await expect(page.locator('header').first()).toBeVisible();
    expect(fehler, `Seitenfehler: ${fehler.join(' | ')}`).toEqual([]);
  });

  test('PA-1-B01 · kaputtes %-Escape im Anker eines Kantonserlasses: kein Absturz', async ({ page }) => {
    const fehler: string[] = [];
    page.on('pageerror', (e) => fehler.push(String(e)));
    await page.goto('/gesetze/kanton/ZH-230#art-%E0');
    await expect(page.locator('[id^="art-"]').first()).toBeAttached({ timeout: 20_000 });
    expect(fehler, `Seitenfehler: ${fehler.join(' | ')}`).toEqual([]);
  });

  for (const [pfad, token] of [
    ['/gesetze/kanton/BS-190.510', 'art-39'],
    ['/gesetze/kanton/ZH-211.23', 'art-15'],
  ] as const) {
    test(`PA-4-B01 · Tieflink ohne Gliederung springt (${pfad.split('/').pop()}#${token}, Erlass-Datei verzögert)`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      // Die Erlass-Datei später liefern als die 30 Frames des App-Retry (~0,5 s).
      await page.route('**/normtext/**', async (route) => {
        await new Promise((r) => setTimeout(r, 1200));
        await route.continue();
      });
      await page.goto(`${pfad}#${token}`);
      const ziel = page.locator(`#${token}`);
      await expect(ziel).toBeAttached({ timeout: 30_000 });
      // Der Sprung steht: das Ziel liegt im ersten Bild, die Seite ist gescrollt.
      await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeGreaterThan(0);
      const lage = await ziel.evaluate((el) => el.getBoundingClientRect().top);
      expect(lage).toBeGreaterThanOrEqual(0);
      expect(lage).toBeLessThan(900);
    });
  }

  test('B7 · Tieflink auf einen Artikel vor dem ersten Abschnitt öffnet «Ohne Abschnitt» (ZH-230#art-5)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/gesetze/kanton/ZH-230#art-5');
    await expect(page.locator('#art-5')).toBeAttached({ timeout: 20_000 });
    const zeile = page.locator('[data-toc] button[aria-label^="«Ohne Abschnitt»"]').first();
    await expect(zeile).toHaveAttribute('aria-expanded', 'true', { timeout: 10_000 });
  });
});
