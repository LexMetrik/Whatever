// @shard-gruppe: 1
// ═══ W2·6c-E3 · DIE ENTSTEHUNG AM ARTIKEL ═══════════════════════════════════
//
// AUFTRAG David 6.9.2026, wörtlich: «Materialien und Wegleitungen maximal
// sinnvoll verzahnen … dass jemand noch besser versteht, wie ein Gesetz
// zustande gekommen ist» — mit der Auflage «das Gesetz nicht überladen, nur auf
// Wunsch sichtbar». Go zum Bau 11.9.2026.
//
// FÜNF ZUSAGEN, je einzeln messbar:
//
//  (a) NICHTS LÄDT VOR DEM KLICK. Zugeklappt: NULL Abrufe unter
//      `/materialien/entstehung/`. Aufgeklappt: GENAU EINER, und zwar der des
//      geöffneten Erlasses. Das 2,1-MB-Register (`/materialien/register.json`)
//      wird in beiden Fällen nie angefasst — es ist der Kanal der
//      Materialien-Übersicht, nicht der einer Artikel-Karte (§15).
//
//  (b) DIE KARTE SAGT, WARUM — UND BENENNT DIE LÜCKE. Wo eine Botschaft erfasst
//      ist, steht sie mit Titel, Nummer und Live-Link; wo nur eine
//      AS-Fundstelle erfasst ist, steht der Chip «Botschaft nicht erfasst»
//      (§8 — gemessen trifft nur rund ein Drittel der Ereignisse eine erfasste
//      Botschaft, Kritik A3/C8). Beides am SELBEN Artikel: ZPO 176 führt einen
//      Punkt mit Botschaft und zwei ohne (gemessen 11.9.2026).
//
//  (c) OHNE DATEN SAGT SIE DAS. Ein Erlass ohne Projektion (BGBM — Historie ja,
//      erfasste Änderung nein) zeigt die Zeitleiste wie bisher und darunter
//      einen Satz, der die Lücke benennt, statt zu schweigen (§8).
//
//  (d) KEIN SPRUNG, KEIN ÜBERLAUF. Deep-Link @320 px: die aufgeklappte Karte
//      erzeugt kein CLS (Klick = echter Input, aber die Sonde misst zusätzlich
//      die Geometrie der Artikel darunter) und nichts ragt aus dem Viewport.
//
//  (e) TASTATUR. Der Griff «Warum?» ist ein echter Knopf (Enter), trägt
//      `aria-expanded` und `aria-controls`; Escape schliesst die Rubrik und
//      gibt den Fokus an ihren Griff zurück (W2·26/Z4, unverändert gültig).
//
// ROT ZU BEKOMMEN (§6.7) — je einzeln gefahren, Protokoll im PR-Body:
//  · in `components/entstehung/EntstehungsBlock.tsx` den Abruf aus dem Effekt in
//    den Modulkopf ziehen (lädt dann für jeden Artikel sofort)      ⇒ (a) rot
//  · dort den Zweig `b ? (…)` auf `false ? (…)` setzen              ⇒ (b) rot
//  · dort den Satz «Zu den Änderungen … keine Entstehung erfasst» leeren ⇒ (c) rot
//  · in `src/index.css` `.lr8-entst-zeile` fest auf zwei Spalten zwingen
//    (Media-Query löschen)                                          ⇒ (d) rot
//  · am Griff `aria-expanded` weglassen                             ⇒ (e) rot
import { test, expect, type Page } from '@playwright/test';
import { F_BLOCK, F_MARKE } from './helpers/fassungsRubrik';

const ORT = '/gesetze/bund/ZPO';
// ZPO 176 führt drei Änderungsstände: einen mit erfasster Botschaft und zwei
// mit blosser AS-Fundstelle — beide Zustände der Karte an EINEM Artikel
// (gemessen 11.9.2026 gegen `public/materialien/entstehung/ZPO.json`).
const ART = '176';
const MARKE = `#art-${ART} ${F_MARKE}`;
const BLOCK = `#art-${ART} ${F_BLOCK}`;
const GRIFF = `${BLOCK} [data-entstehung-griff]`;
const KARTE = `${BLOCK} [data-entstehung-karte]`;

async function oeffneArtikel(page: Page, ort = ORT, art = ART): Promise<void> {
  await page.goto(ort);
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
  await page.locator(`#art-${art}`).scrollIntoViewIfNeeded();
  await expect(page.locator(`#art-${art} ${F_MARKE}`)).toBeVisible({ timeout: 20_000 });
}

/** Alle Abrufe zählen, die diese Karte auslösen könnte. */
function abrufe(page: Page): { entstehung: string[]; register: string[]; kanten: string[] } {
  const gezaehlt = { entstehung: [] as string[], register: [] as string[], kanten: [] as string[] };
  page.on('request', (r) => {
    const u = r.url();
    if (u.includes('/materialien/entstehung/')) gezaehlt.entstehung.push(u);
    if (u.includes('/materialien/register.json')) gezaehlt.register.push(u);
    if (u.includes('/materialien/kanten/')) gezaehlt.kanten.push(u);
  });
  return gezaehlt;
}

test.describe('W2·6c-E3 · Entstehung am Artikel', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(a) zugeklappt null Abrufe, aufgeklappt genau einer — und nie das Register', async ({ page }) => {
    const gezaehlt = abrufe(page);
    await oeffneArtikel(page);
    // Der Leser ist vollständig da (Historie-Shard eingetroffen, sonst stünde die
    // Marke nicht) — und trotzdem hat die Entstehung nichts geholt.
    await page.waitForTimeout(1200);
    expect(gezaehlt.entstehung, `vor dem Klick geladen: ${gezaehlt.entstehung.join(' · ')}`).toHaveLength(0);
    expect(gezaehlt.register, `Register im Lesefluss geladen: ${gezaehlt.register.join(' · ')}`).toHaveLength(0);
    expect(gezaehlt.kanten, `Kanten im Lesefluss geladen: ${gezaehlt.kanten.join(' · ')}`).toHaveLength(0);

    await page.locator(MARKE).click();
    await expect(page.locator(BLOCK)).toBeVisible();
    await expect(page.locator(`${BLOCK} [data-entstehung-stand]`)).toBeVisible();
    await expect
      .poll(() => gezaehlt.entstehung.length, { timeout: 10_000, message: 'die Projektion wurde nie geholt' })
      .toBeGreaterThan(0);
    await page.waitForTimeout(600);

    // GENAU die Projektion DIESES Erlasses, und genau einmal (gecachte Promise).
    expect(gezaehlt.entstehung).toHaveLength(1);
    expect(gezaehlt.entstehung[0]).toContain('/materialien/entstehung/ZPO.json');
    // Das 2,1-MB-Register ist NICHT der Kanal dieser Karte. Diese Zeile war
    // einmal rot (11.9.2026): der bestehende Aufklapp-Ladepfad `weckeDaten`
    // zieht es mit, und die Praxis-Zeile rief ihn. Sie liest seither den
    // erlass-lokalen Kanten-Shard (Herleitung in `EntstehungsBlock.tsx`).
    expect(gezaehlt.register, 'das 2,1-MB-Register ist nicht der Kanal dieser Karte').toHaveLength(0);
    // Der Praxis-Zähler holt höchstens den Shard DIESES Erlasses (ZPO hat
    // keinen ⇒ ein 404, gemessen 11.9.2026) — nie einen fremden.
    expect(gezaehlt.kanten.length).toBeLessThanOrEqual(1);
    for (const u of gezaehlt.kanten) expect(u).toContain('/materialien/kanten/ZPO');

    // Ein zweiter Artikel desselben Erlasses holt NICHTS nach.
    await page.locator('#art-177').scrollIntoViewIfNeeded();
    await page.locator(`#art-177 ${F_MARKE}`).click();
    await expect(page.locator(`#art-177 ${F_BLOCK}`)).toBeVisible();
    await page.waitForTimeout(600);
    expect(gezaehlt.entstehung).toHaveLength(1);
  });

  test('(b) die Karte nennt die Botschaft — und benennt die Lücke, wo keine erfasst ist', async ({ page }) => {
    await oeffneArtikel(page);
    await page.locator(MARKE).click();
    await expect(page.locator(BLOCK)).toBeVisible();

    // Die Fassungsleiste IST die Zeitleiste (§5): kein zweiter Punkte-Apparat.
    await expect(page.locator(`${BLOCK} [data-historie-zeile]`)).toHaveCount(1);
    const punkte = page.locator(`${BLOCK} ol > li`);
    await expect(punkte).toHaveCount(3);

    // Der Stand ist GEZÄHLT und deckt sich mit den Griffen (§8: nie geschätzt).
    const griffe = page.locator(GRIFF);
    await expect(griffe).toHaveCount(3);
    await expect(page.locator(`${BLOCK} [data-entstehung-stand]`))
      .toContainText(/3 von 3 Änderungen mit erfasstem Änderungserlass, davon 1 mit erfasster Botschaft/);

    // Playwright-Falle (Auflage): den Griff EINMAL auflösen und festhalten —
    // nicht in jeder Assertion neu filtern.
    const ersterGriff = griffe.nth(0);
    await ersterGriff.click();
    const karte = page.locator(KARTE);
    await expect(karte).toHaveCount(1);
    await expect(karte).toContainText('Betrifft');
    await expect(karte).toContainText('Geändert durch');
    await expect(karte).toContainText('Begründung');
    // Provenienz in JEDER Karte (§7 a/c): Herkunft, Abrufdatum, Vorbehalt.
    await expect(karte).toContainText('amtlich · aus der Fedlex-Fussnote');
    await expect(karte).toContainText(/Abruf\s+\d{2}\.\d{2}\.\d{4}/);

    // GENAU EINE Karte auf einmal (die Punkte sind ein Akkordeon wie die Rubriken).
    await griffe.nth(1).click();
    await expect(page.locator(KARTE)).toHaveCount(1);

    // Der eine Punkt MIT Botschaft nennt sie; die zwei ohne benennen die Lücke.
    // Beides wird über die ganze Rubrik gemessen, ohne die Reihenfolge der
    // Punkte festzuschreiben (sie ist die des amtlichen Shards, nicht unsere).
    let mitBotschaft = 0;
    let mitLuecke = 0;
    for (let i = 0; i < 3; i += 1) {
      await griffe.nth(i).click();
      const text = await page.locator(KARTE).innerText();
      if (/Botschaft \d{2}\.\d{3}/.test(text)) mitBotschaft += 1;
      if (text.includes('Botschaft nicht erfasst')) mitLuecke += 1;
      await griffe.nth(i).click();
    }
    expect(mitBotschaft, 'kein Punkt nennt eine erfasste Botschaft').toBe(1);
    expect(mitLuecke, 'die Lücke wird nicht benannt (§8)').toBe(2);
  });

  test('(c) ohne erfasste Entstehung sagt die Karte genau das', async ({ page }) => {
    // BGBM führt eine Fassungshistorie, aber keine erfasste Änderung
    // (`public/materialien/entstehung/BGBM.json` existiert nicht, 11.9.2026).
    // Fixture-Wechsel 23.9.2026 (PR #1001, Fedlex-Rechtsanalyse der
    // Änderungsliste): BGBM.json existiert jetzt — Art. 2 trifft mit
    // AS 2024 376 (oc/2024/376) eine erfasste Änderung und zeigt «1 von 5».
    // Eine Bundes-Historie OHNE Entstehungsdatei gibt es nicht mehr (gemessen
    // 23.9.2026: `comm -23` historie/ vs. entstehung/ = EAUE, HEUE, HKSUE96,
    // UNO_BRK — alle ohne Artikel mit Ereignis). Geprüft wird deshalb derselbe
    // Satz über den zweiten Zweig derselben Bedingung (`mitAenderung === 0`):
    // BGBM Art. 3 trägt ein einziges Ereignis (AS 2006 2363, Fussnote ohne
    // oc-URI), das keine erfasste Änderung trifft — der Artikel hat also eine
    // Fassungshistorie, aber keine erfasste Entstehung.
    await oeffneArtikel(page, '/gesetze/bund/BGBM', '3');
    await page.locator(`#art-3 ${F_MARKE}`).click();
    const block = page.locator(`#art-3 ${F_BLOCK}`);
    await expect(block).toBeVisible();
    // Die Zeitleiste steht unverändert — nur die Entstehung fehlt.
    await expect(block.locator('[data-historie-zeile]')).toHaveCount(1);
    await expect(block.locator('ol > li').first()).toBeVisible();
    await expect(block.locator('[data-entstehung-stand]'))
      .toContainText('keine Entstehung erfasst');
    await expect(block.locator('[data-entstehung-griff]')).toHaveCount(0);
    // Und die Praxis-Zeile sagt «keine Wegleitung erfasst, die diesen Artikel
    // nennt» — nie «keine Wegleitung» (§11.5 (4)).
    await expect(block.locator('[data-entstehung-praxis]')).toContainText(/Wegleitung/);
  });

  test('(d) @320 px: kein Überlauf, und der Aufbau verschiebt keinen Artikel', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(`${ORT}#art-${ART}`);
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(MARKE)).toBeVisible({ timeout: 20_000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(600);

    const geometrie = () => page.evaluate(() => {
      const o: Record<string, number> = {};
      for (const a of [...document.querySelectorAll('article[id^="art-"]')].slice(0, 8)) {
        o[a.id] = Math.round(a.getBoundingClientRect().y);
      }
      return o;
    });

    await page.locator(MARKE).click();
    await expect(page.locator(BLOCK)).toBeVisible();
    await expect(page.locator(GRIFF).first()).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(400);
    // Die Karte wächst NACH UNTEN in den offenen Block hinein — die Artikel
    // ÜBER dem geöffneten dürfen sich dabei nicht bewegen.
    const vorher = await geometrie();
    await page.locator(GRIFF).first().click();
    await expect(page.locator(KARTE)).toHaveCount(1);
    await page.waitForTimeout(400);
    expect(await geometrie()).toEqual(vorher);

    // Nichts ragt heraus — weder die Seite noch die Karte selbst.
    const ueberlauf = await page.evaluate(() => {
      const breite = document.documentElement.clientWidth;
      const k = document.querySelector('[data-entstehung-karte]');
      // DREI Messungen, weil zwei davon einen echten Überlauf verschlucken
      // können: eine Seite mit `overflow-x: hidden` scrollt nicht, und ein
      // Grid-Kind behält seine Kastenbreite, auch wenn sein INHALT hinausragt
      // (gemessen 11.9.2026 am Rot-Beweis `white-space: nowrap`: Seite 0,
      // Kastenrand 0 — und trotzdem 143 px Inhalt daneben).
      let innen = 0;
      let schuldig = '';
      for (const el of k ? [k, ...k.querySelectorAll('*')] : []) {
        const d = el.scrollWidth - el.clientWidth;
        if (d > innen) { innen = d; schuldig = el.className || el.tagName; }
      }
      return {
        seite: document.documentElement.scrollWidth - breite,
        karte: k ? Math.round(k.getBoundingClientRect().right - breite) : -1,
        innen, schuldig,
      };
    });
    expect(ueberlauf.seite, 'die Seite scrollt waagrecht').toBeLessThanOrEqual(1);
    expect(ueberlauf.karte, 'die Karte ragt aus dem Viewport').toBeLessThanOrEqual(1);
    expect(ueberlauf.innen, `Inhalt ragt aus «${ueberlauf.schuldig}»`).toBeLessThanOrEqual(1);
  });

  test('(e) Tastatur: Enter öffnet, aria sagt den Zustand, Escape schliesst die Rubrik', async ({ page }) => {
    await oeffneArtikel(page);
    await page.locator(MARKE).click();
    await expect(page.locator(BLOCK)).toBeVisible();

    const griff = page.locator(GRIFF).nth(0);
    await expect(griff).toBeVisible({ timeout: 10_000 });
    await expect(griff).toHaveAttribute('aria-expanded', 'false');
    await griff.focus();
    await page.keyboard.press('Enter');
    await expect(griff).toHaveAttribute('aria-expanded', 'true');

    // `aria-controls` zeigt auf die Karte, die wirklich im DOM steht (WCAG 4.1.2).
    const ziel = await griff.getAttribute('aria-controls');
    expect(ziel, 'kein aria-controls am geöffneten Griff').toBeTruthy();
    // Attribut-Selektor statt `#id`: React vergibt über `useId()` Namen mit
    // Doppelpunkten (`:r7:-0`), die als CSS-Id-Selektor ohne Maskierung gar
    // nicht parsen — und `CSS.escape` gibt es im Node-Prozess der Sonde nicht.
    await expect(page.locator(`[id="${ziel}"] [data-entstehung-karte]`)).toHaveCount(1);

    await page.keyboard.press('Enter');
    await expect(griff).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator(KARTE)).toHaveCount(0);

    // Escape schliesst die RUBRIK (W2·26/Z4) und gibt den Fokus an ihren Griff.
    await page.keyboard.press('Escape');
    await expect(page.locator(BLOCK)).toHaveCount(0);
    await expect(page.locator(MARKE)).toBeFocused();
  });
});
