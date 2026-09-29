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
//      Bild wie an der Gesetzes-Titel-Spur, `.tb-link`/index.css). Deckel:
//      30rem (480 px), derselbe Wert wie dort — EIN Mass für dieselbe
//      Anatomie (§5/§10), über `<colgroup>` + Leerspalte (`max-width` allein
//      auf der `<th>` genügte im Test nicht, automatisches Tabellen-Layout
//      dehnte trotzdem auf 569/739 px).
//
//      Nachbesserung Gegenprüfung (30.9.2026, Prüferbefund 1 «HOCH»): der
//      Deckel griff ab `sm` (640 px) IMMER — `width` auf `<col>` ist in
//      automatischem Tabellen-Layout keine Obergrenze, sondern eine
//      MINDESTBREITE. GEMESSEN (PR-Kopf vs. `main`): verdeckte Zahlen-Pixel
//      @640 88→314, @768 0→186, Schriftskala 1.4 @1024 0→284, @1280 0→28.
//      Jetzt wirkt der 30-rem-Deckel erst ab `2xl` (1536 px, derselbe Rahmen
//      wie der `weit`-Token) — darunter exakt wie `main` (`<th>`
//      `sm:max-w-[16rem]`, `<col>` ohne Breite). Die Spalte ist ab 1536 px
//      480 px breit, darunter wächst sie mit dem Rahmen wie vor Bündel C.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): (1) in Materialien.tsx das `lg:`
// vor `@[78rem]/raster:grid-cols-4` streichen → 3 statt 4 Spalten @1920
// (Container-Regel verliert die CSS-Reihenfolge gegen `lg:grid-cols-3`);
// (2) `w-px` an den Zahlenzellen entfernen → 31 %; (3) die `<colgroup>` in
// MaterialienDeckung.tsx entfernen → die Erlass-Spalte dehnt wieder auf
// 648/968 px (Beleg oben); (4) `2xl:` an `<col>`/`<th>` zurück auf `sm:` →
// verdeckte Pixel wie oben (Prüferbefund 1).

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

test('/materialien/deckung @1920: Erlass-Spalte deckelt bei 30rem, Rest an die Leerspalte', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto('/materialien/deckung');
  await expect(page.locator('[data-deckung-zeile]').first()).toBeVisible();
  const m = await page.locator('[data-deckung-tabelle]').evaluate((t) => {
    const erlass = t.querySelector('thead th') as HTMLElement;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return { erlassRem: erlass.getBoundingClientRect().width / rem, tabelle: t.getBoundingClientRect().width };
  });
  // Bündel C (29.9.2026): fester Deckel statt Anteil an der Tabellenbreite —
  // die Spalte bleibt 30rem (vorher > 50 %, s. Kopfkommentar). Nachbesserung
  // Gegenprüfung (30.9.2026): der Deckel wirkt erst ab `2xl` (1536 px) — @1920
  // ist das erfüllt, s. die eigene Sonde für @1280 weiter unten.
  expect(m.erlassRem).toBeCloseTo(30, 1);
});

test('/materialien/deckung @1280: Erlass-Spalte deckelt NICHT mehr (Nachbesserung Befund 1) — wächst wie main', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/materialien/deckung');
  await expect(page.locator('[data-deckung-zeile]').first()).toBeVisible();
  const erlassRem = await page.locator('[data-deckung-tabelle]').evaluate((t) => {
    const erlass = t.querySelector('thead th') as HTMLElement;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return erlass.getBoundingClientRect().width / rem;
  });
  // Rot-Beweis (§6.7): mit `sm:w-[30rem]` (Stand vor der Nachbesserung) wäre
  // dies exakt 30 — GEMESSEN (PR-Kopf vor der Nachbesserung) 30.0. Jetzt
  // unverändert wie `main`: 648 px = 40.5rem (GEMESSEN, main UND Nachbesserung
  // identisch). Untergrenze 35rem trennt sauber vom alten 30rem-Deckel.
  expect(erlassRem).toBeGreaterThan(35);
});

test('/materialien/deckung @1920: Lücke Titel→Zahlenspalte bleibt klein (Blickfeld-Deckel)', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto('/materialien/deckung');
  await expect(page.locator('[data-deckung-zeile]').first()).toBeVisible();
  // Rot-Beweis (§6.7): vor dem Deckel lag die Median-Lücke bei 584 px (@1920)
  // — GEMESSEN, s. Kopfkommentar.
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
  // Untergrenze (Prüferbefund 5, Symmetrie): GEMESSEN ~95 px.
  expect(medianGap).toBeGreaterThan(50);
  expect(medianGap).toBeLessThan(150);
});

// Nachbesserung Gegenprüfung (Bündel C, 30.9.2026, Prüferbefund 1 «HOCH»):
// `sm:w-[30rem]` auf `<col>` wirkte als Mindestbreite statt als Deckel — die
// Tabelle wurde ab 640 px breiter als ihr Scroll-Rahmen, Zahlenspalten
// standen ausserhalb des sichtbaren Bereichs. ROT ZU BEKOMMEN (§6.7): diese
// Sonde auf den PR-Kopf VOR der Nachbesserung angewendet meldet @640 314 px,
// @768 186 px, @1024 (Skala 1.4) 284 px, @1280 (Skala 1.4) 28 px verdeckt —
// alle vier Fälle unten schlagen fehl (Referenz-Obergrenzen wären dann
// überschritten). GEMESSEN NACHHER (headless Playwright, 30.9.2026): exakt
// wie `main` — @640 88 px (die Tabelle scrollt dort auch auf `main` in ihrem
// affordanzierten Kasten, `lc-scrollrand-x`, s. `e2e/deckung-seite.e2e.ts`
// (e); DAS ist nicht Befund 1), @768/@1024/@1280 0 px. Massstab ist «nicht
// mehr als main», nicht «absolut 0» — 320/375 px scrollen bei jeder Breite
// bewusst (Kopfkommentar `MaterialienDeckung.tsx`).
const VERDECKT_MAIN: Record<string, number> = { '640-1': 88, '768-1': 0, '1024-1.4': 0, '1280-1.4': 0 };
for (const [breite, skala] of [[640, 1], [768, 1], [1024, 1.4], [1280, 1.4]] as const) {
  test(`/materialien/deckung @${breite} Skala ${skala}: nicht mehr verdeckte Zahlen-Pixel als main`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 900 });
    await page.goto('/materialien/deckung');
    await expect(page.locator('[data-deckung-zeile]').first()).toBeVisible();
    if (skala !== 1) await page.evaluate((f) => { document.documentElement.style.fontSize = `${f * 100}%`; }, skala);
    const m = await page.locator('[data-deckung-tabelle]').evaluate((t) => {
      const rahmen = t.parentElement as HTMLElement;
      return {
        tabelle: t.getBoundingClientRect().width,
        rahmen: rahmen.clientWidth,
        verdeckt: Math.max(0, Math.round(t.getBoundingClientRect().width - rahmen.clientWidth)),
      };
    });
    expect(m.verdeckt, `Tabelle ${m.tabelle}px vs. Rahmen ${m.rahmen}px`).toBeLessThanOrEqual(VERDECKT_MAIN[`${breite}-${skala}`]);
  });
}

// Kappungs-Anzahl ≤ main (Prüferbefund 2, Kriterium b) — Referenzwerte aus
// `main` GEMESSEN 30.9.2026 (headless Playwright, `git archive origin/main`):
// @640 178, @768 161, @1024 56, @1280 30 (alle Skala 1.0, unverändert von der
// Nachbesserung, da der Deckel dort nicht mehr greift). @1920 bleibt der
// Kompromiss aus Prüferbefund 2 bestehen (main 2 → PR-Kopf 74) — bewusst
// NICHT hier gepinnt, s. Kopfkommentar-Nachbesserung und PR-Bericht.
const KAPP_MAIN: Record<number, number> = { 640: 178, 768: 161, 1024: 56, 1280: 30 };
for (const breite of [640, 768, 1024, 1280] as const) {
  test(`/materialien/deckung @${breite}: nicht mehr gekappte Titel als main`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 900 });
    await page.goto('/materialien/deckung');
    await expect(page.locator('[data-deckung-zeile]').first()).toBeVisible();
    const kapp = await page.locator('[data-deckung-tabelle]').evaluate((t) => {
      let n = 0;
      for (const row of t.querySelectorAll('tbody tr')) {
        const th = row.querySelector('th') as HTMLElement;
        const span = th.querySelector('span.text-xs') as HTMLElement | null;
        if (span && span.scrollWidth > span.clientWidth + 1) n += 1;
      }
      return n;
    });
    expect(kapp).toBeLessThanOrEqual(KAPP_MAIN[breite]);
  });
}
