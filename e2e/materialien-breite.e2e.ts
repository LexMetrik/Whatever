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
//  (2) /materialien/deckung: die Erlass-Spalte HATTE einen festen Breiten-
//      Deckel (Bündel C, 29.9.2026 → Nachbesserung Gegenprüfung 30.9.2026,
//      `<colgroup>` + Leerspalte, 30rem ab `2xl`). Neuansatz 30.9.2026
//      (Entscheid Orchestrator, Gegenprüfung PR #1156): derselbe Deckel traf
//      kurze und lange Erlass-Titel in DERSELBEN Spalte gegenläufig — er
//      hielt die Lücke Titelende→Zahlenspalte klein, kappte dafür
//      zwangsläufig MEHR Titel (GEMESSEN main→Deckel @1920: 2→74 von 221).
//      Lesbarkeit hat Vorrang (§8) — der Deckel ist VOLLSTÄNDIG zurück-
//      genommen (`<colgroup>`/`max-width`/Leerspalte weg, `MaterialienDeckung
//      .tsx` wieder wie `main`). Statt die Spalte zu verengen, überbrückt ein
//      gepunkteter Leader (`[data-deckung-erlasstitel]`, dieselbe Background-
//      Image-Technik wie `.tb-titel` in index.css, Schweizer-Fahrplan-Vorbild)
//      die Lücke rein dekorativ — KEINE Breiten-/Kappungs-Änderung, nur ab
//      `2xl`-Viewport (1536 px, derselbe Rahmen wie der `weit`-Token; kein
//      `@container`, die Tabelle steckt in keinem Inline-Size-Container).
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

test('/materialien/deckung @1920 und @1280: Erlass-Spalte deckelt NICHT mehr — wächst wie main auf beiden Breiten', async ({ page }) => {
  for (const breite of [1920, 1280]) {
    await page.setViewportSize({ width: breite, height: 900 });
    await page.goto('/materialien/deckung');
    await expect(page.locator('[data-deckung-zeile]').first()).toBeVisible();
    const erlassRem = await page.locator('[data-deckung-tabelle]').evaluate((t) => {
      const erlass = t.querySelector('thead th') as HTMLElement;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      return erlass.getBoundingClientRect().width / rem;
    });
    // Rot-Beweis (§6.7): mit dem 30-rem-Deckel (Stand vor diesem Neuansatz)
    // wäre dies ab `2xl` exakt 30 — GEMESSEN (PR-Kopf 50ec54c) @1920 30.0.
    // Jetzt unverändert wie `main` auf BEIDEN Breiten: @1280 40.5rem (648 px),
    // @1920 60.5rem (968 px) — GEMESSEN, main und dieser Stand identisch.
    // Untergrenze 35rem trennt sauber vom alten 30rem-Deckel auf jeder Breite.
    expect(erlassRem, `@${breite}`).toBeGreaterThan(35);
  }
});

// Blickfeld-Führung statt Deckel: gepunkteter Leader auf der Erlass-Titel-
// Zeile (`[data-deckung-erlasstitel]`, `@media (min-width: 1536px)` in
// index.css), sichtbar ab `2xl`, darunter (auch @1280) unverändert aus.
// ROT ZU BEKOMMEN (§6.7, gemessen gegen `origin/main` 30.9.2026): main kennt
// die Führung nie — `backgroundImage` bleibt dort bei jeder Breite `none`.
test('/materialien/deckung: Leader-Führung ab 2xl (1536 px) sichtbar, bei @1280 aus', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto('/materialien/deckung');
  const titel = page.locator('[data-deckung-erlasstitel]').first();
  await expect(titel).toBeVisible();
  await expect(titel).toHaveCSS('background-image', /repeating-linear-gradient/);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(titel).toHaveCSS('background-image', 'none');
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

// Kappungs-Anzahl ≤ main — Referenzwerte aus `main` GEMESSEN 30.9.2026
// (headless Playwright, eigener Worktree-Build von `origin/main`): @640 178,
// @768 161, @1024 56, @1280 30, @1920 2 (alle Skala 1.0). Neuansatz 30.9.2026
// (Entscheid Orchestrator): der frühere Deckel-Kompromiss bei @1920 (main 2 →
// Deckel 74, Prüferbefund 2) entfällt mit der Rücknahme des Deckels — @1920
// ist jetzt exakt wie main (2), darum hier mitgepinnt statt ausgespart.
const KAPP_MAIN: Record<number, number> = { 640: 178, 768: 161, 1024: 56, 1280: 30, 1920: 2 };
for (const breite of [640, 768, 1024, 1280, 1920] as const) {
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
