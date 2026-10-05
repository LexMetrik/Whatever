// @shard-gruppe: 5
// W2·27-BUND-FERTIG E2 · Ziffer-Fragment `#art-197-ziff-12` (Form A, Entscheid David 2.10.2026).
//
//  Der Anker `art-<token>-ziff-<z>` steht am ersten Block jeder Ziffer (BV Art. 196/197,
//  ParlG 173: Überschrift-Ziffern; StGB, MStG …: Absatz-Ziffern). Aufruf der Adresse landet
//  auf der ZIFFER (nicht am Artikelanfang — BV Art. 197 hat 16 Ziffern); unbekannte
//  Ziffer landet auf dem Artikel; Gesamt- wie Einzelansicht; Sprung innerhalb der Seite.
import { test, expect, type Page } from '@playwright/test';
import { panelAufziehen } from './helpers/panelOeffnen';

const lage = (page: Page, id: string) =>
  page.evaluate((i) => document.getElementById(i)?.getBoundingClientRect().top ?? null, id);

/** Das Ziel steht im ersten Bild: oberhalb des Falzes und nicht unter der klebenden Krone. */
async function stehtImBild(page: Page, id: string) {
  await expect(page.locator(`#${id}`)).toBeAttached({ timeout: 30_000 });
  await expect.poll(async () => {
    const t = await lage(page, id);
    return t !== null && t >= 60 && t < 450;
  }, { timeout: 30_000, message: `${id} steht im ersten Bild` }).toBe(true);
}

test.describe('Ziffer-Fragment (W2·27 E2)', () => {
  test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1440, height: 900 }); });

  test('Überschrift-Ziffer: BV#art-197-ziff-12 landet auf der Ziffer, nicht am Artikelanfang', async ({ page }) => {
    await page.goto('/gesetze/bund/BV#art-197-ziff-12');
    await stehtImBild(page, 'art-197-ziff-12');
    // Der Artikelanfang liegt weit oberhalb (gemessen ~2 700 px bei Ziffer 12) — die Ziffer, nicht der Artikel, ist gelandet.
    expect(await lage(page, 'art-197')).toBeLessThan(-1500);
    // Die Adresse behält die Ziffer, der Reiter steht auf dem ARTIKEL.
    expect(page.url()).toContain('#art-197-ziff-12');
    await expect(page.locator('[aria-current="page"]').first()).toContainText('Art. 197');
  });

  test('Absatz-Ziffer mit Suffix: StGB#art-187-ziff-1bis', async ({ page }) => {
    await page.goto('/gesetze/bund/StGB#art-187-ziff-1bis');
    await stehtImBild(page, 'art-187-ziff-1bis');
  });

  test('Sammel-Ziffer: «Ziff. 3» trifft den Block «2. und 3. …» (MStG Art. 122, id …-ziff-2_3)', async ({ page }) => {
    await page.goto('/gesetze/bund/MStG#art-122-ziff-3');
    await stehtImBild(page, 'art-122-ziff-2_3');
  });

  test('Sammel-Ziffer per eigener id: MStG#art-122-ziff-2_3 landet auf der Ziffer, nicht auf dem Artikel', async ({ page }) => {
    await page.goto('/gesetze/bund/MStG#art-122-ziff-2_3');
    await stehtImBild(page, 'art-122-ziff-2_3');
    // Gelandet ist die ZIFFER: sie sitzt am Sprung-Slot (~154 px unter der Krone). Landete der Sprung auf dem
    // Artikel (Fehlerbild: `data-ziffer~="2_3"` trifft «2 3» nie), stünde der Artikel dort und die Ziffer bei ~360 px.
    await expect.poll(async () => (await lage(page, 'art-122-ziff-2_3')) ?? 9999, { timeout: 15_000 }).toBeLessThan(250);
    expect(await lage(page, 'art-122')).toBeLessThan(100);
    expect(page.url()).toContain('#art-122-ziff-2_3');
  });

  test('unbekannte Ziffer: Fallback auf den Artikel, kein weisser Bildschirm', async ({ page }) => {
    const fehler: string[] = [];
    page.on('pageerror', (e) => fehler.push(String(e)));
    await page.goto('/gesetze/bund/BV#art-197-ziff-99');
    await stehtImBild(page, 'art-197');
    await expect(page.locator('header').first()).toBeVisible();
    expect(fehler, `Seitenfehler: ${fehler.join(' | ')}`).toEqual([]);
  });

  test('ungültige Prozent-Kodierung im Ziffer-Anker: kein Absturz', async ({ page }) => {
    const fehler: string[] = [];
    page.on('pageerror', (e) => fehler.push(String(e)));
    await page.goto('/gesetze/bund/BV#art-197-ziff-1%');
    await expect(page.locator('article[id^="art-"]').first()).toBeAttached({ timeout: 30_000 });
    await expect(page.locator('header').first()).toBeVisible();
    expect(fehler, `Seitenfehler: ${fehler.join(' | ')}`).toEqual([]);
  });

  test('Einzelansicht: BV?ansicht=artikel#art-197-ziff-12 zeigt Art. 197 und landet auf der Ziffer', async ({ page }) => {
    await page.goto('/gesetze/bund/BV?ansicht=artikel#art-197-ziff-12');
    await stehtImBild(page, 'art-197-ziff-12');
    await expect(page.locator('article[id^="art-"]')).toHaveCount(1);
    await expect(page.locator('article#art-197')).toBeAttached();
  });

  test('Sprung innerhalb der Seite: Adresszeile von #art-1 auf #art-187-ziff-1bis (StGB)', async ({ page }) => {
    await page.goto('/gesetze/bund/StGB#art-1');
    await stehtImBild(page, 'art-1');
    await page.evaluate(() => { window.location.hash = '#art-187-ziff-1bis'; });
    await stehtImBild(page, 'art-187-ziff-1bis');
    expect(page.url()).toContain('#art-187-ziff-1bis');
  });

  test('Ziffer-Anker sind keine Artikel: Reiter und Beiwerk führen weiter Art. 197 (Folgenwache; Selektor-Wache: ziffer-anker.test)', async ({ page }) => {
    await page.goto('/gesetze/bund/BV#art-197-ziff-12');
    await stehtImBild(page, 'art-197-ziff-12');
    // Ziffer-Anker sind keine <article>: der Beobachter (nur `article[id^="art-"]`) sieht nur Artikel.
    const nichtArtikelMitArtId = await page.evaluate(
      () => [...document.querySelectorAll('[id^="art-"]')].filter((e) => e.tagName !== 'ARTICLE').length,
    );
    expect(nichtArtikelMitArtId).toBeGreaterThan(10); // BV 196/197 tragen viele Ziffern
    await panelAufziehen(page); // das Beiwerk (Blatt) folgt dem aktiven Artikel
    await page.mouse.wheel(0, 40); // der Spy wertet nur bei einem Scroll-Ereignis aus
    await expect(page.locator('[aria-current="page"]').first()).toContainText('Art. 197');
    // Der aktive Artikel ist der TOKEN «197»: ein Ziffer-Anker als «Artikel» gemeldet hätte kein Label,
    // und das Beiwerk fiele auf den ersten Artikel des Erlasses zurück (`panelBezug`).
    await expect.poll(
      () => page.locator('[data-v3-panel-artikel]').first().getAttribute('data-v3-panel-artikel'),
      { timeout: 10_000, message: 'das Beiwerk führt Art. 197, nicht den ersten Artikel' },
    ).toBe('197');
  });
});
