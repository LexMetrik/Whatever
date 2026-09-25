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

// ─── Nachzug (Gegenprüfung 26.9.2026) ────────────────────────────────────────
//  (4) B1 Fehlerzustand @1920: ohne Ergebnis steht die Eingabefehler-Box
//      (`data-fehlerbox`, role="alert") rechts am Ergebnisplatz statt links,
//      und wo keine Box erscheint (Ergebnis `null`), hält der leere Rahmen
//      (`::after` der Wurzel) Spalte 2. Vorher: rechte Spur leer auf 13 von
//      18 Rechnern (Sonde, je ein Feld geleert).
//  (5) B2 @1920: die Datums-Kachel «TT.MM.JJJJ · 24.00 Uhr» steht einzeilig
//      (vorher Kachel 205 px bei 221 px Bedarf → zweizeilig).
//  (6) B3 @1920: die Phasen-Leisten von ZPO (684/640 px) und SchKG
//      (1088/640 px) laufen nicht mehr in einen Querscroll — sie brechen um.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): (4) in index.css die beiden
// `[data-fehlerbox]`-/`::after`-Regeln streichen; (5) `.lc-kachelraster` auf
// `grid-template-columns: repeat(3, minmax(0, 1fr))` setzen; (6) in ui/Tabs.tsx
// die `@[72rem]/rechnerkarte:`-Klassen streichen.

// Erstes Text-/Datumsfeld der Formularwurzel (Datumsfelder sind Textfelder, `DatumInput`).
const ERSTES_FELD = '.lc-rechner-spalten input:is([type=text],[type=date],:not([type])):visible';

const FEHLERFAELLE = [
  { slug: 'gerichtszitat', leeren: async (page: Page) => {
    await page.getByLabel('Band', { exact: true }).fill('140');
    await page.getByLabel('Seite', { exact: true }).fill('');
    await page.getByLabel('Band', { exact: true }).press('Tab');
  } },
  { slug: 'zpo-fristen', leeren: async (page: Page) => {
    const f = page.getByLabel('Auslösendes Ereignis (Datum)');
    await f.fill(''); await f.blur();
  } },
  { slug: 'erbteilung', leeren: async (page: Page) => {
    const f = page.locator(ERSTES_FELD).first();
    await f.fill(''); await f.blur();
  } },
] as const;

for (const { slug, leeren } of FEHLERFAELLE) {
  test(`/rechner/${slug} @1920 Fehlerzustand: Eingabefehler-Box am Ergebnisplatz rechts`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/rechner/${slug}`);
    await leeren(page);
    const box = page.locator('.lc-rechner-spalten > [data-fehlerbox]');
    await expect(box).toBeVisible();
    await expect(box).toHaveAttribute('role', 'alert');
    await expect(page.locator(PLATZ)).toHaveCount(0);
    const m = await box.evaluate((el) => {
      const w = (el.parentElement as HTMLElement).getBoundingClientRect();
      return { links: el.getBoundingClientRect().left, wurzel40: w.left + w.width * 0.4 };
    });
    expect(m.links).toBeGreaterThanOrEqual(m.wurzel40);
  });
}

test('/rechner/verjaehrung @1920 ohne Ergebnis und ohne Meldung: leerer Rahmen hält Spalte 2', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/rechner/verjaehrung');
  const f = page.locator(ERSTES_FELD).first();
  await f.fill(''); await f.blur();
  await expect(page.locator(PLATZ)).toHaveCount(0);
  const rahmen = await page.locator('.lc-rechner-spalten').first().evaluate((el) => {
    const n = getComputedStyle(el, '::after');
    return { content: n.content, spalte: n.gridColumnStart, hoehe: n.minHeight };
  });
  expect(rahmen).toEqual({ content: '""', spalte: '2', hoehe: '160px' });
});

for (const slug of ['verjaehrung', 'zpo-fristen']) {
  test(`/rechner/${slug} @1920: Datums-Kachel einzeilig`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/rechner/${slug}`);
    const wert = page.locator('[data-ergebnisplatz] .lc-tile p', { hasText: /\d{2}\.\d{2}\.\d{4} · 24\.00 Uhr/ }).first();
    await expect(wert).toBeVisible();
    const { hoehe, zeile } = await wert.evaluate((p) => ({
      hoehe: p.getBoundingClientRect().height, zeile: parseFloat(getComputedStyle(p).lineHeight),
    }));
    expect(hoehe).toBeLessThan(zeile * 1.5);
  });
}

for (const slug of ['zpo-fristen', 'schkg-fristen']) {
  test(`/rechner/${slug} @1920: Phasen-Leiste ohne Querscroll in der Eingabespalte`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/rechner/${slug}`);
    const leiste = page.getByRole('group', { name: 'Verfahrensphase' });
    await expect(leiste).toBeVisible();
    const m = await leiste.evaluate((l) => ({
      scroll: l.scrollWidth, sicht: l.clientWidth,
      knopf: Math.min(...[...l.children].map((k) => k.getBoundingClientRect().height)),
    }));
    expect(m.scroll).toBeLessThanOrEqual(m.sicht);
    expect(m.knopf).toBeGreaterThanOrEqual(36);
  });
}
