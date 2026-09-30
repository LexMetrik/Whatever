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
//      (1088/640 px) laufen nicht mehr in einen Querscroll — sie brechen um,
//      und die Leiste umschliesst ihre Zeilen (kein Überlappen des Folgefelds).
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): (4) in index.css die beiden
// `[data-fehlerbox]`-/`::after`-Regeln streichen; (5) `.lc-kachelraster` auf
// `grid-template-columns: repeat(3, minmax(0, 1fr))` setzen; (6) in index.css
// die `.lc-reiterleiste`-Regeln streichen.

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
    return { content: n.content, spalte: n.gridColumnStart, hoehe: n.height };
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
      // Umbruch ohne Überlappung: die Leiste umschliesst alle Reiterzeilen
      // (mit fester Höhe ragte die zweite Zeile ins nächste Feld).
      ueberstand: Math.max(...[...l.children].map((k) => k.getBoundingClientRect().bottom)) - l.getBoundingClientRect().bottom,
    }));
    expect(m.scroll).toBeLessThanOrEqual(m.sicht);
    expect(m.knopf).toBeGreaterThanOrEqual(36);
    expect(m.ueberstand).toBeLessThanOrEqual(1);
  });
}

// ─── Folgeposten (29.9.2026) ─────────────────────────────────────────────────
//  (7) SchKG-Phasenleiste @1280/1535 (Stufe `content`, GESTAPELT — unter der
//      72rem-Karten-Schwelle von B3, das Formular liegt einspaltig): 1088 px
//      Inhalt in einer 1008–1072 px breiten Karte scrollte quer, vorbestehend
//      (nicht erst durch B3 verursacht). ZPO (684 px) passte in diesem Bereich
//      immer schon — bleibt zur Kontrolle unberührt (kein Umbruch nötig).
//  (8) Sprungmarke «↓ Ergebnis» @1920: `useZielSichtbar` wertete nur die
//      oberen 55 % des Fensters — im zweispaltigen Layout (B3) steht das
//      Ergebnis als eigene, schmale Spalte NEBEN der Eingabe und damit oft
//      unterhalb dieser Marke, obwohl es sichtbar ist. Gestapelt (1280, 375)
//      bleibt das Verhalten unverändert: die Marke zeigt weiter, solange das
//      Ergebnis wirklich ausserhalb des ersten Bildschirms liegt.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): (7) in index.css die neue,
// unbedingte `.lc-rechner-spalten .lc-reiterleiste`-Regel (ausserhalb der
// 72rem-Container-Query) streichen; (8) in `useZielSichtbar.ts` die
// Spalten-Erkennung (`spalte`/`beliebig`) entfernen und wieder nur die
// −45-%-Marge auswerten.
//
// Nachbesserung Gegenprüfung PR #1154 (29.9.2026, Befund 1+2 [HOCH/MITTEL]):
// die Regel unter (7) war UNBEDINGT (kein `@container`) und hob damit auch
// UNTERHALB der Stufe content (Handy, 401–1535 px) die feste Reiterhöhe
// (`h-11`/`sm:h-9`) auf `height:auto` auf — 44/36 px → 23 px Inhaltshöhe,
// ausserdem verlor das Handy (401–600 px) die gewollte einzeilige
// Scroll-Leiste (Umbruch statt Schieben). Die Tests unten prüften bisher nur
// eine OBERGRENZE (`toBeLessThanOrEqual(36)`), die 23 px ebenfalls erfüllt —
// blind für genau diesen Rückgang. Jetzt: Untergrenze UND die Handy-Breiten
// 412/430/600 (einzeilig + Höhe), gemessen gegen den PR-Kopf 1d0132f10 rot
// (`npx playwright test e2e/rechner-breite.e2e.ts -g "einzeilig"`, 8/8 rot:
// Höhe 23 statt 36/44, teils mehrzeilig).

for (const breite of [1280, 1535]) {
  test(`/rechner/schkg-fristen @${breite}: Phasen-Leiste ohne Querscroll (Stufe content, gestapelt)`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 900 });
    await page.goto('/rechner/schkg-fristen');
    const leiste = page.getByRole('group', { name: 'Verfahrensphase' });
    await expect(leiste).toBeVisible();
    const m = await leiste.evaluate((l) => ({
      scroll: l.scrollWidth, sicht: l.clientWidth,
      ueberstand: Math.max(...[...l.children].map((k) => k.getBoundingClientRect().bottom)) - l.getBoundingClientRect().bottom,
    }));
    expect(m.scroll).toBeLessThanOrEqual(m.sicht);
    expect(m.ueberstand).toBeLessThanOrEqual(1);
  });

  test(`/rechner/zpo-fristen @${breite}: Phasen-Leiste unverändert einzeilig (passte schon vorher)`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 900 });
    await page.goto('/rechner/zpo-fristen');
    const leiste = page.getByRole('group', { name: 'Verfahrensphase' });
    await expect(leiste).toBeVisible();
    const { hoehe } = await leiste.evaluate((l) => ({ hoehe: l.getBoundingClientRect().height }));
    expect(hoehe).toBeLessThanOrEqual(36); // eine Zeile (h-9 = 2.25rem = 36px), kein Umbruch
    expect(hoehe).toBeGreaterThanOrEqual(34); // Untergrenze: nicht auf Inhaltshöhe (23 px) zusammengefallen
  });
}

// Nachbesserung Gegenprüfung PR #1154 (Befund 2, 29.9.2026): Handy-Breiten
// unterhalb der Stufe content (401–600 px) bleiben von den Umbruch-Regeln
// oben UNBERÜHRT — «genau wie vor dem PR», einzeilige Scroll-Leiste, feste
// Trefferhöhe `h-11` (44 px). Geprüft an ZPO (passt in den Rahmen, reine
// Höhenfrage) UND SchKG (1088 px Inhalt, muss auch hier scrollen statt
// umbrechen — Umbruch ist erst ab der Stufe content, ≥ 640 px, vorgesehen).
for (const breite of [412, 430, 600]) {
  for (const slug of ['zpo-fristen', 'schkg-fristen']) {
    test(`/rechner/${slug} @${breite}: Handy — einzeilige Scroll-Leiste, 44 px Trefferhöhe (unverändert)`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: 900 });
      await page.goto(`/rechner/${slug}`);
      const leiste = page.getByRole('group', { name: 'Verfahrensphase' });
      await expect(leiste).toBeVisible();
      const m = await leiste.evaluate((l) => {
        const tops = new Set([...l.querySelectorAll('.lc-tab')].map((k) => Math.round(k.getBoundingClientRect().top)));
        return { hoehe: Math.round(l.getBoundingClientRect().height), zeilen: tops.size };
      });
      expect(m.zeilen).toBe(1); // einzeilig, kein Umbruch unterhalb der Stufe content
      expect(m.hoehe).toBeGreaterThanOrEqual(40); // h-11 = 44 px, nicht auf Inhaltshöhe (23 px) geschrumpft
      expect(m.hoehe).toBeLessThanOrEqual(44);
    });
  }
}

for (const slug of ['verjaehrung', 'zpo-fristen', 'erbteilung']) {
  test(`/rechner/${slug} @1920: Sprungmarke bleibt aus — Ergebnis steht als Spalte im Bild`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto(`/rechner/${slug}`);
    await expect(page.locator('[data-ergebnisplatz], [data-platzhalter]').first()).toBeVisible();
    await expect(page.locator('[data-verdikt-sprung]')).toHaveCount(0);
  });

  test(`/rechner/${slug} @1280: Sprungmarke unverändert sichtbar — Ergebnis liegt gestapelt unter dem Falz`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/rechner/${slug}`);
    await expect(page.locator('[data-verdikt-sprung]')).toBeVisible();
  });
}

// Nachbesserung Gegenprüfung PR #1154 (Befund 3, 29.9.2026): im Spalten-Fall
// zählte bisher jede Überschneidung (`isIntersecting`), auch 1 px — bei
// niedrigem Fenster (548 px) stand vom 1057 px hohen Ergebnisplatz auf
// /rechner/verjaehrung nur die obersten 7 px im Bild (0.7 %), die Marke
// verschwand trotzdem. `useZielSichtbar.ts` verlangt jetzt mindestens 20 %
// der Zielhöhe (Herleitung dort). ROT ZU BEKOMMEN: in `useZielSichtbar.ts`
// den `MINDEST_SICHTBARKEIT`-Schwellenwert auf 0 zurücksetzen.
test('/rechner/verjaehrung @1920×548: Sprungmarke bleibt sichtbar — nur 7 px des Ergebnisses im Bild', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 548 });
  await page.goto('/rechner/verjaehrung');
  await expect(page.locator('[data-ergebnisplatz], [data-platzhalter]').first()).toBeVisible();
  await expect(page.locator('[data-verdikt-sprung]')).toBeVisible();
});

// W2·31 Bündel I (30.9.2026, Posten «useZielSichtbar: Schwelle 20 % unerreichbar
// bei Ziel > 5 Fensterhöhen»): kein echtes Ergebnis ist so hoch (Maximum heute
// 1596 px), darum wird das Ziel im Browser künstlich auf 9000 px gestreckt
// (10 Fensterhöhen, Anteil ≤ 10 % — die alte 20-%-Schwelle war unerreichbar).
// Vorher (dist, gemessen @1920×900): Marke AN bei 900 px sichtbarem Ergebnis,
// also über einem das ganze Fenster füllenden Ziel. Jetzt: unter einer halben
// Fensterhöhe sichtbar (400 px) bleibt die Marke, ab einer halben (500 px)
// verschwindet sie. Der IntersectionObserver feuert nur an Schwellen — dieser
// Test läuft im echten Chromium und beweist damit, dass die Pixel-Schwelle
// tatsächlich in der Schwellenliste steht (das Vitest-Gegenstück mockt ihn).
// ROT ZU BEKOMMEN: in `useZielSichtbar.ts` `zielSchwellen` auf
// `[0, MINDEST_SICHTBARKEIT]` zurücksetzen.
test('/rechner/verjaehrung @1920: sehr hohes Ergebnis — Sprungmarke weicht ab halber Fensterhöhe im Bild', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto('/rechner/verjaehrung');
  const ziel = page.locator('[data-ergebnisplatz], [data-platzhalter]').first();
  await expect(ziel).toBeVisible();
  await page.addStyleTag({ content: '[data-ergebnisplatz], [data-platzhalter] { min-height: 9000px !important; }' });
  const oberkanteImDokument = await ziel.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  expect(await ziel.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(9000);

  // Oberkante des Ziels bei Fenster-y = 500 → 400 px (44 %) im Bild: Marke bleibt.
  await page.evaluate((t) => window.scrollTo(0, t - 500), oberkanteImDokument);
  await expect(page.locator('[data-verdikt-sprung]')).toBeVisible();
  // Oberkante bei y = 400 → 500 px (56 %) im Bild: Marke weg (Anteil nur 5.6 %).
  await page.evaluate((t) => window.scrollTo(0, t - 400), oberkanteImDokument);
  await expect(page.locator('[data-verdikt-sprung]')).toHaveCount(0);
  // Fenster voll Ergebnis: bleibt weg.
  await page.evaluate((t) => window.scrollTo(0, t + 3000), oberkanteImDokument);
  await expect(page.locator('[data-verdikt-sprung]')).toHaveCount(0);
});
