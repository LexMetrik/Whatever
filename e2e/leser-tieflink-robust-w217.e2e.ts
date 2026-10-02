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
//  PA-4-B02         `OR#art-336c` (ohne «_»): der Gliederungszweig öffnete erst NACH
//                   dem Sprung — CLS 0.0975 @1440 gegen 0.0004 bei `#art-336_c`.
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

  test('PA-4-B02 · OR#art-336c verschiebt die Gliederung nicht nach dem ersten Bild (CLS @1440)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((liste) => {
        for (const e of liste.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('/gesetze/bund/OR#art-336c');
    await expect(page.locator('#art-336_c')).toBeAttached({ timeout: 30_000 });
    await page.waitForTimeout(3500); // der Spy-Nachlauf (~1,8 s) fällt in dieses Fenster
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    // Schwelle weit unter dem Befund (0.0975), weit über dem Gutfall (0.0004).
    expect(cls, `CLS ${cls}`).toBeLessThan(0.03);
  });
});

// ── BG-01…BG-04 (Finder-Bug-Check G, 2.10.2026) ──────────────────────────────
//  BG-01 (hoch)   gesperrter Browserspeicher (Cookies blockiert: schon das LESEN
//                 von `window.localStorage` wirft) → die ganze App blieb weiss.
//  BG-02/03       ein Netz-Aussetzer bei `currency.json` / `kanton-luecken.json`
//                 löschte «nächste Fassung ab …» bzw. den Lücken-Hinweis für die
//                 ganze Sitzung, ohne Spur.
//  BG-04          fällt das Struktur-Sidecar aus, verschwanden Gliederung und
//                 Überschriften still. Jetzt: ehrliche Zeile im Titelblatt mit
//                 «Erneut laden» (Hausbaustein `AbrufFehler`).
test.describe('Gesperrter Speicher und Sidecar-Ausfall (W2·17-UI-BEFUNDE BG-01…04)', () => {
  test('BG-01 · Speicher gesperrt: Startseite und OR rendern und funktionieren', async ({ page }) => {
    const fehler: string[] = [];
    page.on('pageerror', (e) => fehler.push(String(e)));
    await page.addInitScript(() => {
      for (const name of ['localStorage', 'sessionStorage']) {
        Object.defineProperty(window, name, {
          configurable: true,
          get() { throw new DOMException(`Failed to read the '${name}' property from 'Window': Access is denied`, 'SecurityError'); },
        });
      }
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('header').first()).toBeVisible({ timeout: 20_000 });
    await expect.poll(async () => (await page.locator('body').innerText()).trim().length, { timeout: 10_000 }).toBeGreaterThan(200);

    await page.goto('/gesetze/bund/OR#art-41');
    await expect(page.locator('#art-41')).toBeAttached({ timeout: 30_000 });
    await expect(page.locator('header').first()).toBeVisible();
    // Die Seite lebt: Scrollen und Tastatur werfen nichts.
    await page.keyboard.press('End');
    expect(fehler, `Seitenfehler: ${fehler.join(' | ')}`).toEqual([]);
  });

  test('BG-02 · currency.json bricht einmal ab: Hinweis «Fassungsangaben …» mit «Erneut laden», danach «nächste Fassung ab»', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    let ruf = 0;
    await page.route('**/normtext/currency.json', (route) => (++ruf === 1 ? route.abort() : route.continue()));
    await page.goto('/gesetze/bund/AHVG');
    const hinweis = page.locator('[data-leser-teilausfall~="fassung"]');
    await expect(hinweis).toBeVisible({ timeout: 30_000 });
    await expect(hinweis).toContainText('Fassungsangaben konnten nicht geladen werden');
    await expect(page.getByText(/nächste Fassung ab/)).toHaveCount(0);
    await hinweis.getByRole('button', { name: 'Erneut laden' }).click();
    await expect(page.getByText(/nächste Fassung ab/).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-leser-teilausfall]')).toHaveCount(0);
    expect(ruf).toBe(2);
  });

  test('BG-03 · kanton-luecken.json bricht einmal ab: Hinweis, «Erneut laden» bringt «Nicht vollständig erfasst»', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    let ruf = 0;
    await page.route('**/normtext/kanton-luecken.json', (route) => (++ruf === 1 ? route.abort() : route.continue()));
    await page.goto('/gesetze/kanton/ZH-101');
    const hinweis = page.locator('[data-leser-teilausfall~="luecken"]');
    await expect(hinweis).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Nicht vollständig erfasst')).toHaveCount(0);
    await hinweis.getByRole('button', { name: 'Erneut laden' }).click();
    await expect(page.getByText('Nicht vollständig erfasst').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-leser-teilausfall]')).toHaveCount(0);
  });

  test('BG-04 · Struktur-Sidecar fällt aus: Hinweis, Tieflink hängt nicht, «Erneut laden» bringt die Gliederung zurück', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    let ruf = 0;
    await page.route('**/normtext/struktur/**', (route) => (++ruf <= 2 ? route.abort() : route.continue()));
    await page.goto('/gesetze/bund/ZGB#art-30');
    const hinweis = page.locator('[data-leser-teilausfall~="struktur"]');
    await expect(hinweis).toBeVisible({ timeout: 40_000 });
    await expect(hinweis).toContainText('Gliederung und Überschriften konnten nicht geladen werden');
    // Wechselwirkung #1267: `null` gilt für den Tieflink als «entschieden» — der Sprung feuert trotzdem.
    const ziel = page.locator('#art-30');
    await expect(ziel).toBeAttached({ timeout: 30_000 });
    await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 15_000 }).toBeGreaterThan(0);
    const lage = await ziel.evaluate((el) => el.getBoundingClientRect().top);
    expect(lage).toBeGreaterThanOrEqual(0);
    expect(lage).toBeLessThan(900);
    await hinweis.getByRole('button', { name: 'Erneut laden' }).click();
    await expect(page.locator('[data-leser-teilausfall]')).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByText('Das Personenrecht').first()).toBeAttached({ timeout: 20_000 });
  });
});
