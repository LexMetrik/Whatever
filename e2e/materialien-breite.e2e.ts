// @shard-gruppe: 1
import { test, expect } from '@playwright/test';

// ─── Materialien auf Stufe `weit` (W2·31-BILDSCHIRMBREITE B2, 25.9.2026) ─────
//
// `e2e/seitenbreite.e2e.ts` prüft den RAHMEN der beiden Seitenarten (1440 px
// ab 2xl). Was die Breite dort NUTZT, prüft nur dieser Wächter:
//  (1) /materialien: ab 78rem Rasterbreite (`@container/raster`, Stufe weit
//      @1920 = 1392 px) vier Spalten, jede ≥ 300 px, Kartentitel auf vier
//      Zeilen gekappt; bei 1440 (Stufe content, 1072 px) drei Spalten und
//      drei Zeilen wie vor B2. Die Schwelle hängt am Raster, nicht am
//      Viewport: @1536 mit offener Seitenleiste (460 px) bleiben es drei
//      Spalten — eine Viewport-Stufe `2xl:grid-cols-4` gab dort 4 × 248 px.
//  (2) /materialien/deckung: die freie Breite fällt an die Erlass-Spalte
//      (Zahlenspalten `w-px`). Vorher 328 von 1072 px (31 %); nachher 648
//      von 1072 (60 %) bzw. 968 von 1392 (70 %). Schwelle 50 %.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): (1) in Materialien.tsx das `lg:`
// vor `@[78rem]/raster:grid-cols-4` streichen → 3 statt 4 Spalten @1920
// (Container-Regel verliert die CSS-Reihenfolge gegen `lg:grid-cols-3`);
// (2) `w-px` an den Zahlenzellen entfernen → 31 %.

const RASTER = 'section[id^="b-"] .grid';

const FAELLE = [
  { breite: 1920, leiste: 0, spalten: 4, zeilen: '4' },
  { breite: 1440, leiste: 0, spalten: 3, zeilen: '3' },
  { breite: 1536, leiste: 460, spalten: 3, zeilen: '3' },
] as const;

for (const { breite, leiste, spalten, zeilen } of FAELLE) {
  test(`/materialien @${breite}${leiste ? ` mit Seitenleiste ${leiste} px` : ''}: ${spalten} Rasterspalten, Titel auf ${zeilen} Zeilen`, async ({ page }) => {
    if (leiste) {
      await page.addInitScript((b) => {
        localStorage.setItem('lexmetrik-seitenleiste-eingeklappt.v2', '0');
        localStorage.setItem('lexmetrik-seitenleiste-breite', String(b));
      }, leiste);
    }
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
