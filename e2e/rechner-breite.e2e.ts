// @shard-gruppe: 8
import { test, expect, type Page } from '@playwright/test';

// ─── Rechner: Eingabe ‖ Ergebnis (W2·31-BILDSCHIRMBREITE B3, 25.9.2026) ─────
//
// `e2e/seitenbreite.e2e.ts` prüft den RAHMEN der Seitenart `rechner` (Stufe
// weit, 1440 px ab 2xl). Was die Breite NUTZT, prüft dieser Wächter: ab 72rem
// Kartenbreite (`@container/rechnerkarte`, ui/Card) stellt `.lc-rechner-spalten`
// (index.css) den Ergebnisplatz rechts neben die Eingaben.
//  (1) @1920×1080: der Ergebnisplatz (ErgebnisBlock bzw. ErgebnisPlatzhalter)
//      beginnt rechts von 40 % der Formularbreite (halb/halb; Erbteilung
//      912 statt 960 px, weil die rechte Spur ihre Mindestbreite hält) und beginnt im ersten Bildschirm
//      (Oberkante + 120 px ≤ 1080). Vorher (Stufe content, gestapelt):
//      Oberkante 1034–1264 px bzw. Platzhalter unter dem Formular auf diesen
//      sechs Rechnern. Die Formularwurzel hat höchstens 24 Kinder (Zeilenvorrat
//      der Rasterregel), und das erste Eingabefeld steht im DOM VOR dem
//      Ergebnis (Lese-/Tab-Reihenfolge).
//  (2) Erbteilung @1920: die Erben-Tabelle (`min-w-[42rem]`) läuft nicht in
//      einen Querscroll — die rechte Spur behält ihre Mindestbreite.
//  (3) Gestapelt wie vor B3: 1280 (Stufe content), 1536 mit offener
//      Seitenleiste (460 px) und 390 — Ergebnisplatz links bündig mit der
//      Formularwurzel.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): (1) in ui/Card.tsx die Klasse
// `@container/rechnerkarte` streichen → kein Container, die Regel greift nie,
// Ergebnis gestapelt; (2) in index.css die rechte Spur auf `minmax(0, 1fr)`
// setzen → Erben-Tabelle 712/640 px im Querscroll.

const PLATZ = '.lc-rechner-spalten > :is([data-ergebnisplatz], [data-platzhalter])';

async function messe(page: Page) {
  const platz = page.locator(PLATZ).first();
  await expect(platz).toBeVisible();
  return platz.evaluate((el) => {
    const wurzel = el.parentElement as HTMLElement;
    const w = wurzel.getBoundingClientRect();
    const p = el.getBoundingClientRect();
    const feld = wurzel.querySelector('input, select, textarea, [role="tab"]');
    return {
      oben: p.top + scrollY,
      platzLinks: p.left,
      wurzelLinks: w.left,
      wurzel40: w.left + w.width * 0.4,
      kinder: [...wurzel.children].filter((c) => getComputedStyle(c).position !== 'fixed').length,
      feldDavor: !!feld && !!(feld.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING),
      hoehe: innerHeight,
    };
  });
}

const NEBENEINANDER = ['verjaehrung', 'kuendigung', 'zpo-fristen', 'erbteilung', 'streitwert', 'mietrecht'];

for (const slug of NEBENEINANDER) {
  test(`/rechner/${slug} @1920: Ergebnisplatz rechts neben der Eingabe, im ersten Bildschirm`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/rechner/${slug}`);
    const m = await messe(page);
    expect(m.platzLinks).toBeGreaterThanOrEqual(m.wurzel40);
    expect(m.oben + 120).toBeLessThanOrEqual(m.hoehe);
    expect(m.kinder).toBeLessThanOrEqual(24);
    expect(m.feldDavor).toBe(true);
  });
}

test('/rechner/erbteilung @1920: Erben-Tabelle ohne Querscroll in der Ergebnisspalte', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/rechner/erbteilung');
  const tabelle = page.locator('[data-ansicht="erben-tabelle"]');
  await expect(tabelle).toBeVisible();
  const { scroll, sicht } = await tabelle.evaluate((t) => ({ scroll: t.scrollWidth, sicht: t.clientWidth }));
  expect(scroll).toBeLessThanOrEqual(sicht);
});

const GESTAPELT = [
  { breite: 1280, hoehe: 800, leiste: 0 },
  { breite: 1536, hoehe: 864, leiste: 460 },
  { breite: 390, hoehe: 844, leiste: 0 },
] as const;

for (const { breite, hoehe, leiste } of GESTAPELT) {
  test(`/rechner/verjaehrung @${breite}${leiste ? ` mit Seitenleiste ${leiste} px` : ''}: gestapelt wie vor B3`, async ({ page }) => {
    if (leiste) {
      await page.addInitScript((b) => {
        localStorage.setItem('lexmetrik-seitenleiste-eingeklappt.v2', '0');
        localStorage.setItem('lexmetrik-seitenleiste-breite', String(b));
      }, leiste);
    }
    await page.setViewportSize({ width: breite, height: hoehe });
    await page.goto('/rechner/verjaehrung');
    const m = await messe(page);
    expect(Math.abs(m.platzLinks - m.wurzelLinks)).toBeLessThanOrEqual(1);
    expect(m.feldDavor).toBe(true);
  });
}
