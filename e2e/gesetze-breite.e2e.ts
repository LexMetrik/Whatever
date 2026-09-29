// @shard-gruppe: 3
import { test, expect } from '@playwright/test';

// ─── /gesetze auf Stufe `weit` (W2·31-BILDSCHIRMBREITE B4, 25.9.2026) ────────
//
// `e2e/seitenbreite.e2e.ts` prüft den RAHMEN der Seitenart (1440 px ab 2xl).
// Was die Breite dort NUTZT, prüft nur dieser Wächter:
//  (1) Das Erlass-Register der Rechtsgebiet-Übersicht bleibt zweispaltig —
//      die Breite geht an die Titel-Spur, nicht an eine dritte Spalte
//      (Begründung am `.tb-raster-2` in index.css). Gemessen (dev, 25.9.2026):
//      @1920 zwei Spalten à 660 px, 20 von 241 Titeln gekappt; vorher 500 px
//      und 93 gekappt; eine dritte Spalte (CSS-Probe) kappte 156. Schwelle:
//      Spalten ≥ 600 px und höchstens ein Fünftel der Titel gekappt (vorher
//      39 %). Anteil statt Zahl, damit der wachsende Korpus nicht pinnt.
//  (2) @1440 (Stufe content) wie vor B4: zwei Spalten unter 520 px.
//  (3) @1536 mit offener Seitenleiste (460 px): die Liste hängt an ihrem
//      Container (`.tb-huelle`), nicht am Viewport — weiter zwei Spalten.
//  (4) Das Filterfeld läuft nicht über die weite Breite: ≤ 70rem.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): (1) `gesetze` in seitenbreite.ts
// zurück auf `content` → 500 px / 39 % gekappt; (4) `max-w-content` an
// `.ub-filter` in Gesetze.tsx streichen → 1392 px.

const LISTE = '#rechtsgebiete-uebersicht .tb-raster';

async function messe(page: import('@playwright/test').Page) {
  await expect(page.locator(`${LISTE} .tb-zeile`).first()).toBeVisible();
  return page.evaluate((sel) => {
    const ul = document.querySelector(sel) as HTMLElement;
    const cols = getComputedStyle(ul).gridTemplateColumns.split(' ').map(parseFloat);
    const titel = [...document.querySelectorAll('#rechtsgebiete-uebersicht .tb-titel')] as HTMLElement[];
    const gekappt = titel.filter((t) => t.scrollHeight > t.clientHeight + 1).length;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const filter = (document.querySelector('.ub-filter') as HTMLElement).getBoundingClientRect().width;
    return { cols, anteil: gekappt / titel.length, filterRem: filter / rem };
  }, LISTE);
}

test('/gesetze @1920 (weit): Register zweispaltig mit breiter Titel-Spur, Filterfeld ≤ 70rem', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/gesetze');
  const m = await messe(page);
  expect(m.cols).toHaveLength(2);
  for (const c of m.cols) expect(c).toBeGreaterThanOrEqual(600);
  expect(m.anteil).toBeLessThanOrEqual(0.2);
  expect(m.filterRem).toBeLessThanOrEqual(70 + 0.1);
});

test('/gesetze @1440 (content): Register wie vor B4 — zwei Spalten unter 520 px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/gesetze');
  const m = await messe(page);
  expect(m.cols).toHaveLength(2);
  for (const c of m.cols) expect(c).toBeLessThan(520);
});

test('/gesetze @1536 mit Seitenleiste 460 px: Register folgt dem Container, zwei Spalten', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lexmetrik-seitenleiste-eingeklappt.v2', '0');
    localStorage.setItem('lexmetrik-seitenleiste-breite', '460');
  });
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.goto('/gesetze');
  const m = await messe(page);
  expect(m.cols).toHaveLength(2);
  for (const c of m.cols) expect(c).toBeGreaterThanOrEqual(440);
});

// ─── Bündel C (W2·31-BILDSCHIRMBREITE, 29.9.2026, Prüferbefund B4) ───────────
//
// Die Rubriken/Rechtsgebiets-Sichten unter `?ebene=international`/`?ebene=
// bund` bleiben EINSPALTIG (wenige Zeilen je Gruppe, `spaltig={false}`) — dort
// griff die B4-Zweispalten-Bremse nicht, die Titel-Spur wuchs auf den vollen
// Container (`minmax(0,1fr)`): GEMESSEN vorher (headless Playwright) Median-
// Lücke Titelende→Zahl 260 px / Max 516 px (International @1920), 223 px /
// 827 px (Bund @1920). Ursache und Deckel (30rem, derselbe Wert wie
// `reading-s`) stehen bei `.tb-link`/`.tb-voll .tb-link` in index.css.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): in index.css bei den beiden
// `@container`-Regeln `minmax(0, 30rem) auto 1fr` zurück auf `minmax(0, 1fr)
// auto` (ohne Leerspalte) → Lücken wie oben.

function textRechtsAbstand() {
  function textEnd(el: HTMLElement): number {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let maxRight = -Infinity;
    let node: Node | null;
    // eslint-disable-next-line no-cond-assign
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim()) continue;
      const r = document.createRange();
      r.selectNodeContents(node);
      for (const rect of Array.from(r.getClientRects())) {
        if (rect.width > 0 && rect.right > maxRight) maxRight = rect.right;
      }
    }
    return maxRight;
  }
  const rows = [...document.querySelectorAll('.tb-zeile')];
  const gaps = rows.map((row) => {
    const t = row.querySelector('.tb-titel') as HTMLElement | null;
    const m = row.querySelector('.tb-meta') as HTMLElement | null;
    if (!t || !m) return null;
    return Math.round(m.getBoundingClientRect().left - textEnd(t));
  }).filter((x): x is number => x !== null).sort((a, b) => a - b);
  return { medianGap: gaps[Math.floor(gaps.length / 2)], maxGap: gaps[gaps.length - 1] };
}

// Nachbesserung Gegenprüfung (Bündel C, 30.9.2026, Prüferbefund 5 «NIEDRIG»):
// die Gap-Sonden trugen nur Obergrenzen — ein Deckel, der zu eng wird oder
// verschwindet (Titel und Zahl überlappen/verschmelzen), blieb grün. Jetzt je
// eine Untergrenze knapp unter dem GEMESSENEN Ist-Wert (PR-Kopf, 30.9.2026):
// international med 37/max 111, bund med 94/max 377.
for (const [ebene, minMedian, maxMedian, minMax, maxMax] of [
  ['international', 15, 120, 50, 250],
  ['bund', 40, 150, 200, 500],
] as const) {
  test(`/gesetze?ebene=${ebene} @1920: Blickfeld-Deckel hält die Lücke Titel→Zahl klein`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/gesetze?ebene=${ebene}`);
    if (ebene === 'bund') {
      // Bund-Systematik steht standardmässig eingeklappt (Auftrag David
      // 25.6.2026) — «Alle aufklappen» macht die Zeilen sichtbar.
      await page.getByRole('button', { name: 'Alle aufklappen' }).click();
    }
    await expect(page.locator('.tb-zeile').first()).toBeVisible();
    const m = await page.evaluate(textRechtsAbstand);
    expect(m.medianGap).toBeGreaterThan(minMedian);
    expect(m.medianGap).toBeLessThan(maxMedian);
    expect(m.maxGap).toBeGreaterThan(minMax);
    expect(m.maxGap).toBeLessThan(maxMax);
  });
}

test('/gesetze @1280 unter Schriftskala 1.4: Register-Titel bleibt unter 70 Zeichen/Zeile', async ({ page }) => {
  // Posten «Register-Titel .tb-titel unter Schriftskala 1.4 @1280 ~89 Zeichen/
  // Zeile» — GEMESSEN vorher (headless) 79.1 ch (single-column, Container
  // wächst über die 60-rem-Zweispalten-Schwelle hinaus, s. `useSchriftskala`),
  // nachher mit dem 30rem-Deckel 59.8 ch.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/gesetze');
  await page.evaluate(() => { document.documentElement.style.fontSize = '140%'; });
  await expect(page.locator(`${LISTE} .tb-zeile`).first()).toBeVisible();
  const chPerLine = await page.evaluate(() => {
    const sample = document.querySelector('#rechtsgebiete-uebersicht .tb-titel') as HTMLElement;
    const cs = getComputedStyle(sample);
    const probe = document.createElement('span');
    probe.textContent = '0';
    probe.style.cssText = `position:absolute; visibility:hidden; font-family:${cs.fontFamily}; font-size:${cs.fontSize};`;
    document.body.appendChild(probe);
    const chW = probe.getBoundingClientRect().width;
    probe.remove();
    return sample.getBoundingClientRect().width / chW;
  });
  // Nachbesserung Gegenprüfung (Prüferbefund 5 «NIEDRIG», 30.9.2026): nur
  // eine Obergrenze liess einen zu eng gewordenen Deckel (Titel bricht auf
  // fast jedem Wort) grün durch. GEMESSEN (PR-Kopf) ~59.8 ch — Untergrenze
  // knapp darunter.
  expect(chPerLine).toBeGreaterThan(40);
  expect(chPerLine).toBeLessThan(70);
});
