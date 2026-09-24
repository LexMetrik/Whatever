// @shard-gruppe: 5
// ═══ W2·29-WERKBANK-LESER S6 W1f · DIE FUNKTIONSZEILE IST AUFGELÖST ══════════
//
// Entscheid David 24.9.2026, wörtlich: «also blatt teil soll raus. verweise
// soll auch in blatt. und die zeile soll ganz weg. infos sollen alle im blatt
// erscheinen. einzige ausnahme sind wenn fussnoten aktiviert sind die sollen
// unten am artikel erschienen». Dazu: Aktionen «Klein am Artikel», Verweise
// «Oben im Blatt» (kein sechster Reiter), Einzelmodus «so lassen». Nachtrag
// desselben Tages: «nicht zu viele infos resp. darauf achten dass es
// übersichtlich erscheint» — Verweise und Fassung stehen je als EINE
// Klappzeile (Board «Fliesstext-Blatt»).
//
// Diese Spec ersetzt die Sonden der gefallenen Zeile (w226-funktionszeile,
// leser-d35-f1-funktionszeile, leser-funktionszeile-zaehler, w224-d40-fassung)
// dort, wo ihre Aussage fachlich weiterlebt — jetzt am neuen Ort:
//
//  (a) KEINE ZEILE AM ARTIKEL, Aktionen am Artikel: kein Rubrik-Griff, keine
//      Zeile; «Zitat · Link · Amtliche Fassung ↗» als ruhige Textzeile
//      (Knopf-Baustein ohne sichtbare Haarlinie), LINKSBÜNDIG an der
//      Artikelkante. §6.3-DEKLARATION (Wunsch David 24.9.2026, «vorallem diese
//      leiste muss überarbeitet werden»): mit Maus ruht die Zeile unsichtbar
//      (opacity 0) und erscheint bei Hover und Fokus; vorher
//      stand hier «ohne Hover sichtbar». Die Zusage «per Tastatur erreichbar»
//      bleibt und ist jetzt ausdrücklich geprüft (Fokus ⇒ sichtbar).
//      (a2) Touch (pointer: coarse, kein Hover): immer sichtbar.
//      ROT ZU BEKOMMEN: in `src/index.css` Block (d) «ARTIKEL-AKTIONEN» die
//      `opacity: 0`-Zeile entfernen ⇒ (a) rot («ruht nicht»); die Zeile
//      `article:focus-within …` entfernen ⇒ (a) rot («Fokus»); die
//      Media-Query-Klammer entfernen ⇒ (a2) rot.
//  (b) VERWEISE OBEN IM BLATT: zugeklappt EINE Zeile mit der Zahl, Inhalt erst
//      auf Klick; dieselbe Zahl wie Chips; über JEDEM Reiter.
//  (c) FASSUNG IM REITER «ÄNDERUNGEN»: zugeklappt Stand («Gilt seit …»),
//      aufgeklappt die Zeitleiste — deren Punkte zählen die Änderungsstände.
//  (d) ARTIKELSCHARF IN «WERKZEUGE»: die Werkzeuge DIESES Artikels oben, vor
//      der erlassweiten Liste (sonst verlöre die Auflösung eine Auskunft, §8).
//  (e) DAS BLATT FOLGT DEM ARTIKEL: ein anderer Artikel am Kopf ⇒ andere
//      Verweise-Zeile.
//  (f) EINZELMODUS UNVERÄNDERT: das Dossier steht, samt Knopf-Aktionen.
//  (g) SPLIT × EINZELMODUS × BLATT (Auflage aus der Nachprüfung von #1040,
//      24.9.2026): im Zweit-Pane-Bild (⧉) wechselt das Hauptpane in den
//      Einzelmodus — das Blatt (Sheet) geht zu, kein Griff, keine Schiene,
//      «r» öffnet nichts, die Pane-Grenzen bleiben stehen (keine tote Spur);
//      das Nachbar-Pane bleibt unberührt; zurück gilt der gemerkte Zustand.
//      GEMESSEN 24.9.2026 @1440 OR|BGBM: Panes 2–720 / 723–1440, Rahmen
//      26–696; das Blatt steht als Sheet ausserhalb der Panes (Portal),
//      waagrecht 2–720 = genau über dem Hauptpane.
//      ROT ZU BEKOMMEN (§6.7): in `v3/LeserRahmenV3.tsx` `einzelModus: imEinzel`
//      → `einzelModus: false` ⇒ (g) rot — so gefahren 24.9.2026 gegen dist:
//      «Einzelmodus: das Blatt steht noch», Expected 0 · Received 1.
//
// ROT ZU BEKOMMEN (§6.7) — die drei Eingriffe GEMEINSAM gefahren 24.9.2026
// gegen den gebauten Stand: (a), (b), (c), (e) rot; (d), (f) grün (nicht
// getroffen, wie erwartet):
//  · in `parts/ArtikelLeser.tsx` die Weiche auf `fussForm === 'dossier'`
//    entfernen (= Bezüge-Fuss wieder in der Gesamtansicht)     ⇒ (a) rot
//  · in `v3/LeserPanel.tsx` `{verweise}` nicht rendern          ⇒ (b), (e) rot
//  · in `v3/BlattArtikel.tsx` `{auf && …}` durch `{…}` ersetzen
//    (= Inhalt immer gerendert)                                   ⇒ (b), (c) rot
import { test, expect, type Page } from '@playwright/test';
import { blattFuerArtikel, blattReiter, fassungsMarke } from './helpers/fassungsRubrik';

async function leser(page: Page, pfad: string, artId: string): Promise<void> {
  await page.goto(pfad);
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 });
  await expect(page.locator(`#${artId}`)).toBeVisible({ timeout: 20_000 });
}

test.describe('S6 W1f · Funktionszeile aufgelöst, alles im Erlass-Blatt', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('(a) kein Rubrik-Griff am Artikel — die Aktionen ruhen bis Hover/Fokus, linksbündig', async ({ page }) => {
    await leser(page, '/gesetze/bund/OR#art-336_c', 'art-336_c');
    await page.waitForTimeout(1_500); // Zähl-Datei und Historie-Shard kommen im Leerlauf
    const art = page.locator('#art-336_c');
    await expect(page.locator('.lc-leser .lr7-bez, .lc-leser .lr7-bez-marke, .lc-leser [data-bez-marken]'))
      .toHaveCount(0);
    await expect(page.locator('.lc-leser [data-artikel-dossier]')).toHaveCount(0);
    await page.mouse.move(0, 0);
    const aktionen = art.locator('[data-artikel-aktionen]');
    const deckkraft = (loc: typeof aktionen) =>
      loc.locator('.lr7-bez-aktionen').evaluate((el) => getComputedStyle(el).opacity);
    await expect(aktionen).toBeVisible(); // Platz reserviert, im Fokus-Weg
    const zitat = aktionen.getByRole('button', { name: /^Zitat kopieren:/ });
    await expect(zitat).toBeVisible();
    await expect(aktionen.getByRole('button', { name: 'Permalink kopieren' })).toBeVisible();
    // Ruhig: der Knopf-Baustein ohne sichtbare Haarlinie (Textzeile, keine Knopfreihe).
    const rand = await zitat.evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(rand, 'die Aktion trägt wieder eine sichtbare Knopf-Kante').toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    // Linksbündig: die Zeile beginnt an der Artikelkante, nicht rechts aussen.
    const [zx, tx] = await art.evaluate((el) => [
      el.querySelector('.lr7-bez-aktionen')!.getBoundingClientRect().left,
      el.querySelector('.lr-text')!.getBoundingClientRect().left,
    ]);
    expect(Math.abs(zx - tx), 'die Aktionen stehen nicht an der Artikelkante').toBeLessThanOrEqual(8);
    // Nachbar ohne Hover/Fokus/Ziel: die Zeile ruht (unsichtbar, Platz bleibt).
    const nachbar = page.locator('#art-336_d');
    await nachbar.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const nAkt = nachbar.locator('[data-artikel-aktionen]');
    await expect.poll(() => deckkraft(nAkt), { message: 'die Zeile ruht nicht' }).toBe('0');
    // Hover am Artikel ⇒ sichtbar.
    await nachbar.locator('.lr-text').hover();
    await expect.poll(() => deckkraft(nAkt), { message: 'Hover' }).toBe('1');
    // Tastatur: Fokus auf «Zitat» ⇒ sichtbar (WCAG 2.1.1/2.4.7).
    await page.mouse.move(0, 0);
    await expect.poll(() => deckkraft(nAkt)).toBe('0');
    await nAkt.getByRole('button', { name: /^Zitat kopieren:/ }).focus();
    await expect.poll(() => deckkraft(nAkt), { message: 'Fokus' }).toBe('1');
  });

  test('(b) Verweise: zugeklappt eine Zeile mit Zahl, Chips erst auf Klick, über jedem Reiter', async ({ page }) => {
    await leser(page, '/gesetze/bund/SCHKG#art-312', 'art-312');
    await blattFuerArtikel(page.locator('#art-312'), 20_000);
    const zeile = page.locator('[data-v3-blatt-verweise="312"]');
    await expect(zeile).toBeVisible();
    const griff = zeile.locator('> button');
    await expect(griff).toHaveAttribute('aria-expanded', 'false');
    // Zugeklappt ist der Inhalt NICHT gerendert (nicht bloss versteckt).
    await expect(zeile.locator('a[href]')).toHaveCount(0);
    const zahl = Number(((await griff.textContent()) ?? '').match(/(\d+)\s*$/)?.[1] ?? '0');
    expect(zahl, 'die Verweise-Zeile nennt keine Zahl').toBeGreaterThan(0);
    await griff.click();
    await expect(griff).toHaveAttribute('aria-expanded', 'true');
    await expect(zeile.getByRole('link', { name: /^Art\. 20 OR$/ })).toBeVisible();
    await expect(zeile.locator('a[href]'), 'Zahl und Chips laufen auseinander').toHaveCount(zahl);
    // Über JEDEM Reiter — der Abschnitt gehört dem Blatt, nicht einer Tafel.
    for (const reiter of ['entscheide', 'aenderungen', 'materialien', 'erlaeuterungen', 'werkzeuge']) {
      await blattReiter(page, reiter);
      await expect(zeile, `Reiter «${reiter}»: die Verweise-Zeile fehlt`).toBeVisible();
      expect(await zeile.evaluate((el) => !!el.closest('[role="tabpanel"]')),
        'die Verweise-Zeile steht in einer Tafel statt über den Reitern').toBe(false);
    }
  });

  test('(c) Fassung: zugeklappt der Stand, aufgeklappt die Zeitleiste', async ({ page }) => {
    await leser(page, '/gesetze/bund/BGBM#art-2', 'art-2');
    const griff = await fassungsMarke(page.locator('#art-2'), 20_000);
    const block = page.locator('[data-v3-blatt-fassung="2"]');
    await expect(griff).toHaveAttribute('aria-expanded', 'false');
    await expect(griff).toContainText(/Gilt seit\s+01\.01\.2025/);
    await expect(block.locator('[data-historie-zeile]'), 'zugeklappt steht schon Inhalt').toHaveCount(0);
    await griff.click();
    await expect(block.locator('[data-historie-zeile]')).toHaveCount(1);
    await expect(block.locator('ol > li').first()).toBeVisible();
    // Der Druck behält den Stand am Artikel (§8, `[data-hist-druck]`).
    await expect(page.locator('#art-2 [data-hist-druck] [data-historie-zeile]')).toHaveCount(1);
  });

  test('(d) Werkzeuge: die dieses Artikels stehen oben, vor der erlassweiten Liste', async ({ page }) => {
    await leser(page, '/gesetze/bund/OR#art-336_c', 'art-336_c');
    await blattFuerArtikel(page.locator('#art-336_c'), 20_000);
    await blattReiter(page, 'werkzeuge');
    const gruppe = page.locator('[data-v3-blatt-artikelgruppe="werkzeuge"][data-v3-blatt-artikel="336_c"]');
    await expect(gruppe).toBeVisible();
    await expect(gruppe.getByRole('link').first()).toBeVisible();
    await expect(gruppe).toContainText('Zu Art. 336c');
    // Die erlassweite Liste bleibt darunter — seit dem Auftrag 24.9.2026
    // («Standard ist nur der Artikelteil offen») zugeklappt, auf Klick da.
    const griff = page.locator('[data-v3-blatt-erlassteil="werkzeuge"] > button');
    await expect(griff).toHaveAttribute('aria-expanded', 'false');
    await griff.click();
    const erlass = page.locator('[data-v3-panel-reiter-inhalt="werkzeuge"]');
    await expect(erlass).toBeVisible();
    const vorher = await gruppe.evaluate((g) => {
      const e = document.querySelector('[data-v3-panel-reiter-inhalt="werkzeuge"]');
      return !!e && !!(g.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(vorher, 'die Artikelgruppe steht nicht VOR der erlassweiten Liste').toBe(true);
  });

  test('(e) das Blatt folgt dem Artikel am Kopf', async ({ page }) => {
    await leser(page, '/gesetze/bund/SCHKG#art-312', 'art-312');
    await blattFuerArtikel(page.locator('#art-312'), 20_000);
    await expect(page.locator('[data-v3-blatt-verweise="312"]')).toBeVisible();
    // Ein anderer Artikel am Kopf ⇒ das Blatt nennt ihn, die Zeile von 312 geht.
    await blattFuerArtikel(page.locator('#art-1'), 20_000);
    await expect(page.locator('[data-v3-blatt-verweise="312"]')).toHaveCount(0);
  });
});

test.describe('S6 W1f · Einzelmodus unverändert (D-E4)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('(f) das Dossier steht, samt Knopf-Aktionen — keine Textzeile, kein Blatt', async ({ page }) => {
    await page.goto('/gesetze/bund/OR?ansicht=artikel#art-336_c');
    await expect(page.locator('[data-artikel-dossier]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-artikel-aktionen]')).toHaveCount(0);
    const zitat = page.getByRole('button', { name: /^Zitat kopieren:/ }).first();
    await expect(zitat).toBeVisible();
    const rand = await zitat.evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(rand, 'im Dossier stehen die Aktionen wieder als Textzeile').not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    await expect(page.locator('[data-v3-panel]')).toHaveCount(0);
  });
});

test.describe('S6 W1f · Split × Einzelmodus × Blatt (Auflage Nachprüfung #1040)', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('(g) Hauptpane im Einzelmodus: kein Blatt, kein Griff, keine tote Spur — das Nachbar-Pane unberührt', async ({ page }) => {
    test.slow(); // zwei volle Leser-Instanzen
    await page.goto('/gesetze/bund/OR?p=/gesetze/bund/BGBM#art-337_c');
    const prim = page.locator('[data-pane="primaer"]');
    const sek = page.locator('[data-pane="sekundaer"]');
    await expect(sek.locator('[data-v3-kopf]')).toBeVisible({ timeout: 25_000 });
    const grenzen = () => page.evaluate(() => {
      const x = (s: string) => {
        const b = document.querySelector(s)?.getBoundingClientRect();
        return b ? [Math.round(b.left), Math.round(b.right)] : null;
      };
      return {
        primaer: x('[data-pane="primaer"]'), sekundaer: x('[data-pane="sekundaer"]'),
        rahmen: x('[data-pane="primaer"] [data-leser-v3="rahmen"]'),
      };
    });
    const blatt = page.locator('[data-v3-panel]');
    // Positiv-Sonde: in der Gesamtansicht hat das Hauptpane seinen Griff, und das
    // Blatt öffnet als Sheet genau über dem Hauptpane — nicht über dem Nachbarn.
    const griff = prim.locator('[data-v3-panel-oeffner]');
    await expect(griff).toHaveCount(1, { timeout: 20_000 });
    await griff.click();
    await expect(blatt.first()).toBeVisible({ timeout: 20_000 });
    const vorher = await grenzen();
    const sheet = await blatt.first().evaluate((e) => {
      const b = e.getBoundingClientRect();
      return [Math.round(b.left), Math.round(b.right)];
    });
    expect(sheet[1], 'das Blatt ragt ins Nachbar-Pane').toBeLessThanOrEqual(vorher.sekundaer![0]);

    // Hauptpane → Einzelmodus (über SEIN Ansicht-Menü).
    await prim.locator('[data-v3-ansicht]').click();
    await prim.locator('[data-v3-modus="artikel"]').click();
    await expect(prim.locator('[data-einzel-artikel]')).toBeVisible({ timeout: 20_000 });
    // Menü zu (es bleibt nach der Wahl offen) — sonst schluckte es Taste und Klick.
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await expect(prim.locator('[data-v3-modus="artikel"]')).toBeHidden();
    const pruefeKeinBlatt = async (wann: string) => {
      await expect(blatt, `${wann}: das Blatt steht noch`).toHaveCount(0);
      await expect(prim.locator('[data-v3-panel-oeffner]'), `${wann}: Griff steht`).toHaveCount(0);
      await expect(prim.locator('[data-v3-blatt-schiene]'), `${wann}: Schiene steht`).toHaveCount(0);
      await expect(prim.locator('[data-v3-blatt-zu]'), `${wann}: «Erlass-Blatt ausblenden» steht`).toHaveCount(0);
      expect(await grenzen(), `${wann}: Pane- oder Rahmengrenzen verschoben (tote Spur)`).toEqual(vorher);
    };
    await pruefeKeinBlatt('Einzelmodus');
    await prim.locator('[data-v3-ansicht]').focus();
    await page.keyboard.press('r');
    await page.waitForTimeout(300);
    await pruefeKeinBlatt('nach «r»');
    // Das Nachbar-Pane bleibt in der Gesamtansicht, mit Griff.
    await expect(sek.locator('[data-einzel-artikel]')).toHaveCount(0);
    await expect(sek.locator('[data-v3-panel-oeffner]')).toHaveCount(1);

    // Zurück: der gemerkte Zustand (Blatt offen) gilt wieder, «r» wirkt wieder.
    await prim.locator('[data-v3-ansicht]').click();
    await prim.locator('[data-v3-modus="erlass"]').click();
    await expect(prim.locator('[data-einzel-artikel]')).toHaveCount(0, { timeout: 20_000 });
    await expect(blatt.first()).toBeVisible({ timeout: 20_000 });
    await prim.locator('[data-v3-ansicht]').focus();
    await page.keyboard.press('r');
    await expect(blatt).toHaveCount(0);
  });
});

test.describe('S6 W1f · Aktionen auf Touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('(a2) ohne Hover (pointer: coarse) stehen die Aktionen immer', async ({ page }) => {
    await leser(page, '/gesetze/bund/OR#art-336_c', 'art-336_c');
    const nachbar = page.locator('#art-336_d');
    await nachbar.scrollIntoViewIfNeeded();
    const zeile = nachbar.locator('[data-artikel-aktionen] .lr7-bez-aktionen');
    await expect(zeile).toBeVisible();
    expect(await zeile.evaluate((el) => getComputedStyle(el).opacity), 'Touch: die Zeile ruht').toBe('1');
  });
});
