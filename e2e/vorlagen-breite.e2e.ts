// @shard-gruppe: 6
import { test, expect, type Page } from '@playwright/test';
import { ROUTEN_MANIFEST } from '../src/routesManifest';

// ─── Vorlagen: grösseres Papier auf breiten Bildschirmen (W2·31-BILDSCHIRMBREITE B5, 26.9.2026) ──
//
// `e2e/seitenbreite.e2e.ts` prüft den RAHMEN der Seitenart `vorlage` (Stufe
// weit, 1440 px ab 2xl). Was die Breite NUTZT, prüft dieser Wächter
// (Regeln: `src/index.css`, Block «Vorlagen: grösseres Papier»):
//  (1) @1920, ALLE Vorlagen-Routen aus `ROUTEN_MANIFEST` (§5 — keine
//      abgeschriebene Liste): das Papier (`[data-vorschau-panel] >
//      [data-dokument]`) ist um 1.4 vergrössert, seine Satzbreite bleibt in
//      Papier-Einheiten 446 px (= 27.875rem, die Breite bei 1280 px); die
//      Formularspalte bleibt ≤ 520 px (32.5rem) und alles unter dem Papier
//      bzw. eine Ersatz-Vorschau ≤ 520 px — so kann keine Zeile länger werden
//      als bei 1280 px (Grundsatz David 25.9.2026: Fliesstext wächst nie).
//      Wizard: das Blatt schliesst rechts mit dem Raster ab. Keine
//      horizontale Scrollbar.
//  (1b) Mappen (GmbH-Gründung, Kapitalerhöhung) mit Musterdaten: dasselbe
//      Blatt (Zoom, Satzbreite, Protokoll-Deckel) statt der Bahn über die
//      ganze Rahmenbreite.
//  (2) Zeilenfall: Testament und Mietvertrag (Musterdaten) haben @1920
//      genau so viele Papierzeilen wie @1280 — der Beweis, dass nur das Blatt
//      wächst, nicht die Zeile.
//  (3) Unverändert wie vor B5: 1280 (Stufe content), 1536 mit offener
//      Seitenleiste 460 px — Formular und Vorschau je halb, kein Zoom; 390 —
//      Desktop-Vorschau aus, Klappblock ohne Zoom; Druck @1920 — kein Zoom.
//  (4) Zwischenband (Arbeitsfläche über 67rem, unter 80rem; 1536 mit
//      Seitenleiste 300 px): beide Spalten höchstens 520 px, kein Zoom.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): (a) in wizard.tsx die Klasse
// `@container/vorlagenflaeche` streichen → Formularspalte 680 px, kein Zoom:
// (1) rot auf allen Wizard-Routen; (b) in index.css den Deckel
// `[data-vorschau-panel] > :not([data-dokument]) { max-width: 32.5rem }`
// streichen → Beiwerk unter dem Papier 698 px: (1) rot; (c) in index.css die
// Regel `[data-vorschau-panel] { container: … }` streichen → kein Zoom:
// (1) rot auf den Mappen und den Wizard-Routen.

const VORLAGEN = ROUTEN_MANIFEST.map((r) => r.pfad).filter((p) => p.startsWith('/vorlagen/'));
const ZOOM = 1.4;
const SATZ = 446; // 27.875rem
const SPALTE = 520; // 32.5rem

interface Messung {
  wizard: boolean; grid: number | null; form: number | null; zelle: number | null;
  papier: number | null; zoom: number | null; satz: number | null; papierRechts: number | null;
  gridRechts: number | null; beiwerk: number; zeilen: number | null; querscroll: boolean;
}

async function bereit(page: Page, pfad: string, muster = false): Promise<void> {
  await page.goto(pfad);
  await expect(page.locator('main#inhalt h1').first()).toBeVisible();
  await page.waitForLoadState('networkidle');
  if (muster) {
    await page.getByRole('button', { name: 'Mit Musterdaten füllen' }).click();
    await expect(page.locator('[data-papier]').first()).toBeAttached();
  }
  await page.evaluate(() => document.fonts?.ready);
}

async function messe(page: Page): Promise<Messung> {
  return page.evaluate(() => {
    const sicht = (el: Element | null | undefined): el is HTMLElement => !!el && el.getBoundingClientRect().width > 0;
    const w = (el: Element | null | undefined) => (sicht(el) ? el.getBoundingClientRect().width : null);
    const grid = document.querySelector('[data-wizard-grid]');
    const zelle = document.querySelector('[data-vorschau-spalte]');
    // Das SICHTBARE Panel: Wizard-Spalte, Mappen-Reiter oder mobiler Klappblock.
    const panel = [...document.querySelectorAll('[data-vorschau-panel]')].find(sicht) ?? null;
    const papier = panel?.querySelector(':scope > [data-dokument]') ?? null;
    const koerper = papier?.querySelector(':scope > [data-papier]') ?? null;
    const zoom = sicht(koerper) ? Number(getComputedStyle(koerper).zoom) : null;
    // Beiwerk: Panel-Kinder ausser dem Papier; Ersatz-Vorschau im Kasten.
    const beiwerk = [
      ...(panel ? [...panel.children].filter((c) => !c.matches('[data-dokument]')) : []),
      ...[...document.querySelectorAll('[data-vorschau-kasten] > *')]
        .filter((c) => !c.matches('[data-vorschau-panel]') && !c.querySelector('[data-vorschau-panel]')),
    ].filter(sicht).map((c) => c.getBoundingClientRect().width);
    // Zeilenfall: verschiedene Zeilen im Satzspiegel (Wort-Rects, Mitte-y).
    let zeilen: number | null = null;
    if (sicht(koerper)) {
      const mitten: number[] = [];
      const walker = document.createTreeWalker(koerper, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        for (const m of (n.textContent ?? '').matchAll(/\S+/g)) {
          range.setStart(n, m.index!); range.setEnd(n, m.index! + m[0].length);
          for (const r of range.getClientRects()) if (r.width > 0) mitten.push((r.top + r.bottom) / 2);
        }
      }
      mitten.sort((a, b) => a - b);
      zeilen = mitten.filter((y, i) => i === 0 || y - mitten[i - 1] > 4).length;
    }
    return {
      wizard: sicht(grid),
      grid: w(grid),
      form: sicht(grid) ? w(grid.firstElementChild) : null,
      zelle: w(zelle),
      papier: w(papier),
      zoom,
      satz: sicht(koerper) && zoom ? koerper.getBoundingClientRect().width / zoom : null,
      papierRechts: sicht(papier) ? papier.getBoundingClientRect().right : null,
      gridRechts: sicht(grid) ? grid.getBoundingClientRect().right : null,
      beiwerk: Math.max(0, ...beiwerk),
      zeilen,
      querscroll: document.documentElement.scrollWidth > innerWidth,
    };
  });
}

test('Routenliste: alle Vorlagen aus dem Manifest', () => {
  // Ratsche gegen eine still leere Liste (Filter auf den Pfad-Präfix).
  expect(VORLAGEN.length).toBeGreaterThanOrEqual(30);
});

for (const pfad of VORLAGEN) {
  test(`${pfad} @1920: Papier ×${ZOOM} bei gleicher Satzbreite, Formular und Beiwerk ≤ ${SPALTE} px`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await bereit(page, pfad);
    const m = await messe(page);
    const ort = `${pfad} @1920 ${JSON.stringify(m)}`;
    expect(m.querscroll, ort).toBe(false);
    expect(m.beiwerk, ort).toBeLessThanOrEqual(SPALTE + 0.5);
    if (m.wizard) {
      expect(m.form, ort).toBeLessThanOrEqual(SPALTE + 0.5);
    }
    // Seiten ohne Papier (Checkliste Kündigung Vermieter; Mappen und
    // AG-Gründung ohne Dokument: Leerzustand) prüfen nur Rahmen und Beiwerk.
    if (m.papier == null) return;
    if (m.wizard) expect(Math.abs(m.papierRechts! - m.gridRechts!), ort).toBeLessThanOrEqual(1);
    expect(m.zoom, ort).toBeCloseTo(ZOOM, 5);
    expect(Math.abs(m.satz! - SATZ), ort).toBeLessThanOrEqual(1);
  });
}

for (const slug of ['gmbh-gruendung', 'kapitalerhoehung']) {
  test(`/vorlagen/${slug} (Mappe, Musterdaten) @1920: Blatt statt Bahn — Papier ×${ZOOM}, Satzbreite ${SATZ} px, Protokoll ≤ ${SPALTE} px`, async ({ page }) => {
    // Vorher lief das Mappen-Papier über die ganze Rahmenbreite (Satzbreite
    // 998 px @1280, bis 163 Zeichen je Zeile im Bausteinprotokoll).
    await page.setViewportSize({ width: 1920, height: 1080 });
    await bereit(page, `/vorlagen/${slug}`, true);
    const m = await messe(page);
    const ort = JSON.stringify(m);
    expect(m.papier, ort).not.toBeNull();
    expect(m.zoom, ort).toBeCloseTo(ZOOM, 5);
    expect(Math.abs(m.satz! - SATZ), ort).toBeLessThanOrEqual(1);
    expect(m.beiwerk, ort).toBeLessThanOrEqual(SPALTE + 0.5);
  });
}

for (const slug of ['testament', 'mietvertrag']) {
  test(`/vorlagen/${slug}: Zeilenfall @1920 gleich wie @1280 (Musterdaten)`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await bereit(page, `/vorlagen/${slug}`, true);
    const schmal = await messe(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect.poll(async () => (await messe(page)).zoom).toBeCloseTo(ZOOM, 5);
    const breit = await messe(page);
    expect(schmal.zoom).toBe(1);
    expect(Math.abs(schmal.satz! - SATZ)).toBeLessThanOrEqual(1);
    expect(schmal.zeilen).toBeGreaterThan(20);
    expect(breit.zeilen, `Zeilen @1280 ${schmal.zeilen} / @1920 ${breit.zeilen}`).toBe(schmal.zeilen);
  });
}

const UNVERAENDERT = [
  { breite: 1280, hoehe: 800, leiste: 0 },
  { breite: 1536, hoehe: 864, leiste: 460 },
] as const;

for (const { breite, hoehe, leiste } of UNVERAENDERT) {
  test(`/vorlagen/testament @${breite}${leiste ? ` mit Seitenleiste ${leiste} px` : ''}: halb/halb, kein Zoom (wie vor B5)`, async ({ page }) => {
    if (leiste) {
      await page.addInitScript((b) => {
        localStorage.setItem('lexmetrik-seitenleiste-eingeklappt.v2', '0');
        localStorage.setItem('lexmetrik-seitenleiste-breite', String(b));
      }, leiste);
    }
    await page.setViewportSize({ width: breite, height: hoehe });
    await bereit(page, '/vorlagen/testament');
    const m = await messe(page);
    const ort = JSON.stringify(m);
    expect(m.grid!, ort).toBeLessThanOrEqual(1072.5);
    expect(Math.abs(m.form! - m.zelle!), ort).toBeLessThanOrEqual(1);
    expect(m.zoom, ort).toBe(1);
    expect(Math.abs(m.papier! - m.zelle!), ort).toBeLessThanOrEqual(1);
  });
}

test('/vorlagen/testament @1536 mit Seitenleiste 300 px (Zwischenband): beide Spalten ≤ 520 px, kein Zoom', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lexmetrik-seitenleiste-eingeklappt.v2', '0');
    localStorage.setItem('lexmetrik-seitenleiste-breite', '300');
  });
  await page.setViewportSize({ width: 1536, height: 864 });
  await bereit(page, '/vorlagen/testament');
  const m = await messe(page);
  const ort = JSON.stringify(m);
  // Vorbedingung: die Arbeitsfläche liegt wirklich im Band 67rem < b < 80rem.
  expect(m.grid!, ort).toBeGreaterThan(1072.5);
  expect(m.grid!, ort).toBeLessThan(1280);
  expect(m.form!, ort).toBeLessThanOrEqual(SPALTE + 0.5);
  expect(m.zelle!, ort).toBeLessThanOrEqual(SPALTE + 0.5);
  expect(m.zoom, ort).toBe(1);
});

test('/vorlagen/testament @390: Desktop-Vorschau aus, Klappblock ohne Zoom', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await bereit(page, '/vorlagen/testament');
  await page.locator('#wizard-vorschau > summary').click();
  const m = await messe(page);
  expect(m.zelle, JSON.stringify(m)).toBeNull();
  expect(m.zoom, JSON.stringify(m)).toBe(1);
});

test('/vorlagen/testament @1920 im Druck: kein Zoom (Ausdruck unverändert)', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await bereit(page, '/vorlagen/testament');
  await page.emulateMedia({ media: 'print' });
  const zoom = await page.locator('[data-vorschau-spalte] [data-papier]').evaluate((el) => getComputedStyle(el).zoom);
  expect(Number(zoom)).toBe(1);
});
