// @shard-gruppe: 6
import { test, expect, type Page } from '@playwright/test';

// ─── Rubrik-Übersichten /rechner und /vorlagen auf Stufe `weit` (W2·31 B10) ──
//
// `e2e/seitenbreite.e2e.ts` prüft den RAHMEN der Seitenart `rubrik` (am
// Beispiel /rechner). Was die Breite dort NUTZT, prüft nur dieser Wächter
// (Messung Preview 26.9.2026, Tabelle im Commit):
//  (1) /vorlagen: @1920 (weit, Raster 1392 px) DREI Spalten ≥ 380 px; @1440
//      (content, 1072 px) zwei wie vor B10.
//  (2) /rechner: neben der Themenleiste GENAU zwei Spalten — @1920 (1116 px)
//      nicht drei (lange Untertitel, Herleitung an der Regel in index.css),
//      @1536 mit offener Seitenleiste (752 px) nicht EINE wie vor B10.
//  (3) Das Filterfeld bleibt auf `content` (≤ 70 rem), wie auf /gesetze und
//      /materialien (B2/B4).
//  (4) Katalogtext im Lesemass: in keinem p/li unter `main` (alle `<details>`
//      geöffnet) steht eine Zeile mit mehr als 80 Zeichen (WCAG 1.4.8) — hier
//      auch für /vorlagen, das `seitenbreite.e2e.ts` nicht als Beispiel führt.
// ROT ZU BEKOMMEN (§6.7, beide Proben 26.9.2026 gegen src/, neu gebaut):
// Probe 1 — (a) `rubrik` in seitenbreite.ts auf 'content' → /vorlagen @1920
// [523, 523] statt drei Spalten; (b) die Regel `.kt-werkbank:has(>
// .kt-einstieg) .kt-raster` in index.css ausser Kraft → /rechner @1536+Leiste
// [752], eine Spalte. Probe 2 — (c) `max-w-content` an der `.ub-filter` in
// Katalog.tsx streichen → /vorlagen 87 rem; (d) in derselben Regel den
// Zwei-Spalten-Deckel durch `minmax(min(350px, 100%), 1fr)` ersetzen →
// /rechner @1920 [355, 355, 355], drei Spalten.

const FAELLE = [
  { pfad: '/vorlagen', breite: 1920, leiste: 0, spalten: 3, minPx: 380 },
  { pfad: '/vorlagen', breite: 1440, leiste: 0, spalten: 2, minPx: 380 },
  { pfad: '/vorlagen', breite: 1536, leiste: 460, spalten: 2, minPx: 380 },
  { pfad: '/rechner', breite: 1920, leiste: 0, spalten: 2, minPx: 350 },
  { pfad: '/rechner', breite: 1440, leiste: 0, spalten: 2, minPx: 350 },
  { pfad: '/rechner', breite: 1536, leiste: 460, spalten: 2, minPx: 350 },
] as const;

async function oeffne(page: Page, pfad: string, breite: number, leiste: number) {
  if (leiste) {
    await page.addInitScript((b) => {
      localStorage.setItem('lexmetrik-seitenleiste-eingeklappt.v2', '0');
      localStorage.setItem('lexmetrik-seitenleiste-breite', String(b));
    }, leiste);
  }
  await page.setViewportSize({ width: breite, height: 1000 });
  await page.goto(pfad);
  await expect(page.locator('.kt-raster').first()).toBeVisible();
}

for (const { pfad, breite, leiste, spalten, minPx } of FAELLE) {
  test(`${pfad} @${breite}${leiste ? ` mit Seitenleiste ${leiste} px` : ''}: ${spalten} Rasterspalten ≥ ${minPx} px, Filter ≤ 70 rem`, async ({ page }) => {
    await oeffne(page, pfad, breite, leiste);
    const m = await page.evaluate(() => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      // Nur gerenderte Raster (zugeklappte «In Vorbereitung» haben keine Spuren).
      const raster = [...document.querySelectorAll('.kt-raster')].filter((g) => g.getClientRects().length > 0).map((g) =>
        getComputedStyle(g).gridTemplateColumns.split(' ').map(parseFloat));
      const filter = (document.querySelector('.ub-filter') as HTMLElement).getBoundingClientRect().width;
      return { raster, filterRem: filter / rem };
    });
    expect(m.filterRem).toBeLessThanOrEqual(70 + 0.1);
    expect(m.raster.length).toBeGreaterThan(0);
    for (const cols of m.raster) {
      expect(cols).toHaveLength(spalten);
      for (const c of cols) expect(c).toBeGreaterThanOrEqual(minPx);
    }
  });
}

for (const pfad of ['/rechner', '/vorlagen']) {
  test(`${pfad} @1920: Katalogtext (auch zugeklappt) höchstens 80 Zeichen je Zeile`, async ({ page }) => {
    await oeffne(page, pfad, 1920, 0);
    const funde = await page.evaluate(() => {
      document.querySelectorAll('main#inhalt details').forEach((d) => { (d as HTMLDetailsElement).open = true; });
      const range = document.createRange();
      const aus: string[] = [];
      // Zeilen je ABSATZ-BLOCK (nächster nicht-inline Vorfahr) wie in
      // seitenbreite.e2e.ts — zwei Flex-Kinder einer Fusszeile sind zwei Stücke.
      const blockVon = (e: Element): Element => {
        const d = getComputedStyle(e).display;
        return (d.startsWith('inline') || d === 'contents') && e.parentElement ? blockVon(e.parentElement) : e;
      };
      for (const el of document.querySelectorAll('main#inhalt p, main#inhalt li')) {
        const zeilen = new Map<string, string[]>();
        const bloecke = new Map<Element, number>();
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const block = blockVon(n.parentElement!);
          if (!bloecke.has(block)) bloecke.set(block, bloecke.size);
          for (const w of (n.textContent ?? '').matchAll(/\S+/g)) {
            range.setStart(n, w.index!);
            range.setEnd(n, w.index! + w[0].length);
            const r = [...range.getClientRects()].find((q) => q.width > 0);
            if (!r) continue;
            const k = `${bloecke.get(block)}:${Math.round(r.top / 4)}`;
            zeilen.set(k, [...(zeilen.get(k) ?? []), w[0]]);
          }
        }
        for (const woerter of zeilen.values()) {
          const zeile = woerter.join(' ');
          if (zeile.length > 80) aus.push(`${zeile.length} ch: ${zeile}`);
        }
      }
      return aus;
    });
    expect(funde).toEqual([]);
  });
}
