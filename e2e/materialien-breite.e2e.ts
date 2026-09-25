// @shard-gruppe: 1
import { test, expect } from '@playwright/test';

// ─── Materialien auf Stufe `weit` (W2·31-BILDSCHIRMBREITE B2, 25.9.2026) ─────
//
// `e2e/seitenbreite.e2e.ts` prüft den RAHMEN der beiden Seitenarten (1440 px
// ab 2xl). Was die Breite dort NUTZT, prüft nur dieser Wächter:
//  (1) /materialien: ab 2xl vier Rasterspalten, jede ≥ 300 px, Kartentitel
//      auf vier Zeilen gekappt; darunter (1440, Stufe content) drei Spalten
//      und drei Zeilen wie vor B2.
//  (2) /materialien/deckung: die freie Breite fällt an die Erlass-Spalte
//      (Zahlenspalten `w-px`). Vorher 328 von 1072 px (31 %); nachher 648
//      von 1072 (60 %) bzw. 968 von 1392 (70 %). Schwelle 50 %.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): (1) `2xl:grid-cols-4` aus
// Materialien.tsx entfernen → 3 statt 4; (2) `w-px` an den Zahlenzellen
// entfernen → 31 %.

const RASTER = 'section[id^="b-"] .grid';

for (const [breite, spalten, zeilen] of [[1920, 4, '4'], [1440, 3, '3']] as const) {
  test(`/materialien @${breite}: ${spalten} Rasterspalten, Titel auf ${zeilen} Zeilen`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 1000 });
    await page.goto('/materialien');
    await expect(page.locator(RASTER).first()).toBeVisible();
    const m = await page.locator(RASTER).first().evaluate((g) => {
      const cols = getComputedStyle(g).gridTemplateColumns.split(' ').map(parseFloat);
      const titel = g.querySelector('a p.font-medium') as HTMLElement;
      return { cols, clamp: getComputedStyle(titel).webkitLineClamp };
    });
    expect(m.cols).toHaveLength(spalten);
    for (const c of m.cols) expect(c).toBeGreaterThanOrEqual(300);
    expect(m.clamp).toBe(zeilen);
  });
}

for (const breite of [1920, 1280]) {
  test(`/materialien/deckung @${breite}: Erlass-Spalte trägt mehr als die halbe Tabellenbreite`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 900 });
    await page.goto('/materialien/deckung');
    await expect(page.locator('[data-deckung-zeile]').first()).toBeVisible();
    const anteil = await page.locator('[data-deckung-tabelle]').evaluate((t) => {
      const erlass = t.querySelector('thead th') as HTMLElement;
      return erlass.getBoundingClientRect().width / t.getBoundingClientRect().width;
    });
    expect(anteil).toBeGreaterThan(0.5);
  });
}
