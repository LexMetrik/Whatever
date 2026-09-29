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
//  (2) /materialien/deckung: die Erlass-Spalte trägt einen FESTEN Deckel
//      (Zahlenspalten bleiben `w-px`). Bündel C (W2·31-BILDSCHIRMBREITE,
//      29.9.2026, Prüferbefund B2 «niedrig») löst die alte B2-Zusage «> 50 %»
//      ab: GEMESSEN vorher (headless Playwright) trug die volle Restbreite
//      648 px @1280/1440 und 968 px ab 1536 die Erlass-Spalte, während Titel
//      median nur 384 px brauchen — Median-Lücke Titelende→Spaltenrand 264 px
//      @1280, 584 px @1920 (das Auge verlor die Erlass↔Zahlen-Zeile, dasselbe
//      Bild wie an der Gesetzes-Titel-Spur, `.tb-link`/index.css). Neuer
//      Deckel: 30rem (480 px), derselbe Wert wie dort — EIN Mass für dieselbe
//      Anatomie (§5/§10), über `<colgroup>` + Leerspalte (`max-width` allein
//      auf der `<th>` genügte im Test nicht, automatisches Tabellen-Layout
//      dehnte trotzdem auf 569/739 px). Die Spalte ist jetzt auf JEDER Breite
//      480 px breit, nicht mehr «mehr als die Hälfte».
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): (1) in Materialien.tsx das `lg:`
// vor `@[78rem]/raster:grid-cols-4` streichen → 3 statt 4 Spalten @1920
// (Container-Regel verliert die CSS-Reihenfolge gegen `lg:grid-cols-3`);
// (2) `w-px` an den Zahlenzellen entfernen → 31 %; (3) die `<colgroup>` in
// MaterialienDeckung.tsx entfernen → die Erlass-Spalte dehnt wieder auf
// 648/968 px (Beleg oben).

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
      // Nachzug B2 (25.9.2026): das Filterfeld bleibt auf `content` (70 rem),
      // auch wenn die Seite `weit` steht — Rot-Probe: `max-w-content` an
      // `.ub-filter` in Materialien.tsx streichen → 87 rem @1920.
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const filter = (document.querySelector('.ub-filter') as HTMLElement).getBoundingClientRect().width;
      return { cols, clamp: getComputedStyle(titel).webkitLineClamp, filterRem: filter / rem };
    });
    expect(m.filterRem).toBeLessThanOrEqual(70 + 0.1);
    expect(m.cols).toHaveLength(spalten);
    for (const c of m.cols) expect(c).toBeGreaterThanOrEqual(300);
    expect(m.clamp).toBe(zeilen);
  });
}

for (const breite of [1920, 1280]) {
  test(`/materialien/deckung @${breite}: Erlass-Spalte deckelt bei 30rem, Rest an die Leerspalte`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 900 });
    await page.goto('/materialien/deckung');
    await expect(page.locator('[data-deckung-zeile]').first()).toBeVisible();
    const m = await page.locator('[data-deckung-tabelle]').evaluate((t) => {
      const erlass = t.querySelector('thead th') as HTMLElement;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      return { erlassRem: erlass.getBoundingClientRect().width / rem, tabelle: t.getBoundingClientRect().width };
    });
    // Bündel C (29.9.2026): fester Deckel statt Anteil an der Tabellenbreite
    // — die Spalte bleibt 30rem, unabhängig davon, wie breit die Tabelle ist
    // (vorher > 50 %, s. Kopfkommentar).
    expect(m.erlassRem).toBeCloseTo(30, 1);
  });

  test(`/materialien/deckung @${breite}: Lücke Titel→Zahlenspalte bleibt klein (Blickfeld-Deckel)`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 900 });
    await page.goto('/materialien/deckung');
    await expect(page.locator('[data-deckung-zeile]').first()).toBeVisible();
    // Rot-Beweis (§6.7): vor dem Deckel lag die Median-Lücke bei 264 px
    // (@1280) bzw. 584 px (@1920) — GEMESSEN, s. Kopfkommentar.
    const medianGap = await page.locator('[data-deckung-tabelle]').evaluate((t) => {
      const rows = [...t.querySelectorAll('tbody tr')];
      const gaps = rows.map((r) => {
        const th = r.querySelector('th') as HTMLElement;
        const span = th.querySelector('span.text-xs') as HTMLElement | null;
        if (!span || getComputedStyle(span).display === 'none') return null;
        const range = document.createRange();
        range.selectNodeContents(span);
        const rects = [...range.getClientRects()];
        if (!rects.length) return null;
        const textRight = Math.max(...rects.map((x) => x.right));
        return th.getBoundingClientRect().right - textRight;
      }).filter((x): x is number => x !== null).sort((a, b) => a - b);
      return gaps[Math.floor(gaps.length / 2)];
    });
    expect(medianGap).toBeLessThan(150);
  });
}
