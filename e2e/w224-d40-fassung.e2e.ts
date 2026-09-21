// @shard-gruppe: 5
// ═══ W2·24 · D40 — DIE FASSUNG STEHT UNTEN AM ARTIKEL ═══════════════════════
//
// AUFTRAG David 7.9.2026, wörtlich: «und wieso ist fassung nicht auch unten am
// artikel?». Die Frage trifft einen echten Bruch: seit D34/D35 stand JEDE
// artikelbezogene Auskunft in der Funktionszeile am Artikelende — nur die
// Fassungshistorie hing weiter am Artikelkopf, in einem eigenen Slot mit eigener
// Reserve und eigenem Klapp-Knopf.
//
// FÜNF ZUSAGEN, je einzeln messbar:
//
//  (a) DIE RUBRIK STEHT UNTEN UND ZÄHLT ECHT. «n Fassungen ›» in der
//      Funktionszeile, die Zahl deckungsgleich mit der Zahl der Einträge, die
//      die Zeitleiste darunter auflistet (§8: gezählt, nie geschätzt). Und der
//      KOPF trägt die Auskunft nirgends mehr — `[data-hist-slot]` existiert im
//      ganzen Dokument nicht mehr.
//
//  (b) ZU BEIM LADEN, AUF KLICK AUF. Eine zugeklappte Rubrik rendert ihren
//      Inhalt GAR NICHT (D35-F1) — das ist schärfer als «versteckt» und der
//      Grund, warum sie nichts kosten kann, solange niemand klickt.
//
//  (c) ABWÄHLBAR wie jede andere Rubrik: der Schalter «Fassung» im Ansicht-Menü
//      nimmt Zähler UND Block, und er übersteht den Reload.
//
//  (d) DIE DREIER-WAHL BLEIBT DIE OBERE INSTANZ. «Fussnoten» und «aus» nehmen
//      die Rubrik ganz — auch wenn der Rubriken-Schalter auf «an» steht. Zwei
//      Fragen, zwei Schalter, keine zweite Wahrheit (§5).
//
//  (e) KEIN SPRUNG BEIM EINWUCHS. Die Marke trifft mit dem idle geladenen
//      Historie-Shard ein und darf die Zeile nicht umbrechen lassen.
//      Gemessen 7.9.2026 @1440 (BGBM · ZPO · OR · StPO · ZGB): 0 verschobene
//      Artikel, CLS 0.00000.
//
// ROT ZU BEKOMMEN (§6.7) — je einzeln gefahren, protokolliert in
// `abnahme/design-identitaet/D40-FASSUNG-RUBRIK.md`:
//  · in `parts/ArtikelLeser.bezuegeFuss.tsx` die Marke `reg: 'f'` aus
//    `bezugsMarken` entfernen                                     ⇒ (a) rot
//  · dort `anzahl: 1` statt der Ereignis-Länge setzen             ⇒ (a) rot
//  · in `parts/Funktionszeile.tsx` `useState` mit `{ f: true }` vorbelegen
//    (= die Rubrik steht beim Laden offen)                        ⇒ (b) rot
//  · in `src/index.css` die vier `data-fuss-aus*="f"`-Zeilen löschen ⇒ (c) rot
//  · in `src/index.css` die `data-vermerke`-Zeilen für `[data-reg="f"]`
//    löschen                                                      ⇒ (d) rot
import { test, expect, type Page } from '@playwright/test';
import { F_BLOCK, F_MARKE } from './helpers/fassungsRubrik';

// ZPO Art. 198 führt sieben Fassungs-Ereignisse (Shard `ZPO.json`, gemessen
// 7.9.2026) UND daneben Entscheide und Verweise — also eine Zeile, in der die
// neue Rubrik neben den alten steht und nicht allein.
const ORT = '/gesetze/bund/ZPO';
const ART = '198';
const MARKE = `#art-${ART} ${F_MARKE}`;
const BLOCK = `#art-${ART} ${F_BLOCK}`;

async function oeffne(page: Page): Promise<void> {
  await page.goto(ORT);
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
  await page.locator(`#art-${ART}`).scrollIntoViewIfNeeded();
  await expect(page.locator(MARKE)).toBeVisible({ timeout: 20_000 });
}

/** Das «Ansicht ▾»-Menü aufziehen (es schliesst bei Aussenklick). */
async function menueAuf(page: Page): Promise<void> {
  await page.locator('[data-v3-ansicht]').first().click();
  await expect(page.locator('[data-v3-ansicht-menue]')).toBeVisible({ timeout: 10_000 });
}

test.describe('D40 · Fassung als Rubrik der Funktionszeile', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(a) die Rubrik steht unten, zählt echt — und der Kopf trägt sie nirgends mehr', async ({ page }) => {
    await oeffne(page);

    // Der Kopf-Slot ist ERSATZLOS weg, im GANZEN Dokument (nicht nur an diesem
    // Artikel): eine verbliebene Stelle wäre die zweite Wahrheit, die D40
    // gerade abräumt (§5).
    await expect(page.locator('[data-hist-slot]')).toHaveCount(0);
    // Auch der Artikelkopf der Breitform trägt nichts Fassungsartiges mehr.
    await expect(page.locator(`#art-${ART} .lr7-fassung`)).toHaveCount(0);

    // Die Marke steht ZUERST: «Fassung» ist die Auskunft über DIESEN Artikel,
    // die vier danach zeigen von ihm weg (§8).
    //
    // §6.3-DEKLARATION (W2·26/Z1, 11.9.2026): hier stand zusätzlich
    // `expect(reihenfolge[1]).toBe('lr7-bez-wort')` — das Wort «Bezüge» stand
    // zwischen der Fassung und den Bezugs-Rubriken. Es ist mit Z1 ersatzlos
    // gestrichen; die REIHENFOLGE-Zusage bleibt Wort für Wort, nur ohne das
    // Wort dazwischen (der Satz oben ist ergänzt, nicht nachgeführt).
    const reihenfolge = await page.locator(`#art-${ART} .lr7-bez-zeile`).evaluate((z) => (
      [...z.children].map((c) => (c as HTMLElement).dataset.reg ?? c.className.split(' ').pop() ?? '')
    ));
    expect(reihenfolge[0], `Reihenfolge der Zeile: ${reihenfolge.join(' · ')}`).toBe('f');
    expect(reihenfolge[1], 'nach der Fassung kommen sofort die Bezugs-Rubriken').toBe('r');

    // §6.3-DEKLARATION (W2·26/Z2): ZUGEKLAPPT liest die Marke seit dem Mandat
    // vom 11.9.2026 den STAND («Gilt seit 01.01.2025»), nicht die Zahl — David:
    // «Fassung soll nur ‹gilt seit XXX› zeigen, erst beim Aufklappen erscheinen
    // die Angaben». Die ZUSAGE dieses Falls («die Zahl ist gezählt und deckt
    // sich mit der Zeitleiste») ist unverändert; sie wird jetzt am
    // AUFGEKLAPPTEN Zustand gemessen, weil dort die Zahl steht.
    await expect(page.locator(MARKE)).toHaveText(/^Gilt seit \d{2}\.\d{2}\.\d{4}\s*›$/);
    await page.locator(MARKE).click();
    await expect(page.locator(MARKE)).toHaveAttribute('aria-expanded', 'true');

    // Die ZAHL ist gezählt: sie deckt sich mit den Einträgen der Zeitleiste.
    const text = (await page.locator(MARKE).innerText()).trim();
    const zahl = Number(text.match(/(\d+)/)?.[1]);
    expect(zahl, `Marke ohne Zahl: «${text}»`).toBeGreaterThan(0);
    expect(text, 'Ein-/Mehrzahl stimmt nicht').toMatch(zahl === 1 ? /1\s*Fassung\b/ : /\d+\s*Fassungen/);
    // WCAG 4.1.2 · der Name nennt Rubrik UND Artikel (1686 Artikel auf einer
    // Seite) — mit derselben Ein-/Mehrzahl wie der sichtbare Text, nicht mit
    // einer hier festgeschriebenen (sonst prüfte die Zeile die Sonde, nicht die
    // Seite).
    expect(await page.locator(MARKE).getAttribute('aria-label'))
      .toBe(`${zahl} ${zahl === 1 ? 'Fassung' : 'Fassungen'} zu Art. ${ART} ZPO`);

    await expect(page.locator(BLOCK)).toBeVisible();
    await expect(page.locator(`${BLOCK} ol > li`)).toHaveCount(zahl);
    // Und es ist DIESELBE Auskunft wie bisher: Overline «Fassung» + «Gilt seit …».
    await expect(page.locator(`${BLOCK} [data-historie-zeile]`)).toHaveCount(1);
    await expect(page.locator(`${BLOCK} [data-historie-zeile]`)).toContainText(/Gilt seit\s+\d{2}\.\d{2}\.\d{4}/);
  });

  test('(b) zu beim Laden; der Inhalt wird erst auf Klick überhaupt gerendert', async ({ page }) => {
    await oeffne(page);
    await expect(page.locator(MARKE)).toHaveAttribute('aria-expanded', 'false');
    // GAR NICHT gerendert — nicht bloss versteckt (D35-F1).
    await expect(page.locator(BLOCK)).toHaveCount(0);

    await page.locator(MARKE).click();
    await expect(page.locator(MARKE)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator(BLOCK)).toBeVisible();

    await page.locator(MARKE).click();
    await expect(page.locator(MARKE)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator(BLOCK)).toHaveCount(0);
  });

  test('(c) im Ansicht-Menü abwählbar — Zähler UND Block, über den Reload hinweg', async ({ page }) => {
    await oeffne(page);
    // Aufgeklappt, damit auch der BLOCK im Bild ist (ein Griff ohne Block wäre
    // die Zusage einer Liste, die nicht kommt — M-6 der D35-Untersuchung).
    await page.locator(MARKE).click();
    await expect(page.locator(BLOCK)).toBeVisible();

    await menueAuf(page);
    const schalter = page.locator('[data-v3-fussrubrik="f"]');
    await expect(schalter, 'kein Menü-Schalter für die Fassung').toHaveCount(1);
    await expect(schalter).toHaveAttribute('aria-checked', 'true');
    await schalter.click();
    await expect(page.locator('html')).toHaveAttribute('data-fuss-aus', /f/);
    await page.keyboard.press('Escape');

    await expect(page.locator(MARKE)).toBeHidden();
    await expect(page.locator(BLOCK)).toBeHidden();
    // Die ANDEREN Rubriken bleiben — abgewählt wird eine, nicht die Zeile.
    await expect(page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]`)).toBeVisible();

    // Die Wahl übersteht den Reload und steht VOR dem ersten Paint (Pre-Paint
    // in `main.tsx`, sonst flackerte die Rubrik einmal auf).
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-fuss-aus', /f/);
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
    await page.locator(`#art-${ART}`).scrollIntoViewIfNeeded();
    await expect(page.locator(MARKE)).toBeHidden();

    // Rückweg auf derselben Zeile.
    await menueAuf(page);
    await page.locator('[data-v3-fussrubrik="f"]').click();
    await page.keyboard.press('Escape');
    await expect(page.locator(MARKE)).toBeVisible();
  });

  test('(d) die Dreier-Wahl bleibt die obere Instanz: «Fussnoten» nimmt die Rubrik', async ({ page }) => {
    await oeffne(page);
    await page.locator(MARKE).click();
    await expect(page.locator(BLOCK)).toBeVisible();

    await menueAuf(page);
    // Der Rubriken-Schalter steht auf «an» — genau darum ist der Fall scharf:
    // die Wahl oben muss ihn überstimmen können (§5).
    await expect(page.locator('[data-v3-fussrubrik="f"]')).toHaveAttribute('aria-checked', 'true');
    await page.locator('[data-v3-vermerke="fussnoten"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'fussnoten');
    await page.keyboard.press('Escape');

    await expect(page.locator(MARKE), '«Fussnoten» lässt die Fassungs-Rubrik stehen').toBeHidden();
    await expect(page.locator(BLOCK)).toBeHidden();
    // Der Rubriken-Schalter ist unberührt geblieben — die Wahl oben schaltet
    // die Sache, nicht das Häkchen (keine stille Nebenwirkung, §8).
    await menueAuf(page);
    await expect(page.locator('[data-v3-fussrubrik="f"]')).toHaveAttribute('aria-checked', 'true');
    await page.locator('[data-v3-vermerke="fassung"]').click();
    await page.keyboard.press('Escape');
    await expect(page.locator(MARKE)).toBeVisible();
  });

  test('(e) der Marken-Einwuchs verschiebt keinen Artikel und erzeugt kein CLS', async ({ page }) => {
    // Der Shard wird angehalten, damit der Einwuchs ein KONTROLLIERTES Ereignis
    // ist und nicht ein Rennen gegen den Seitenaufbau (Muster und Herleitung:
    // `e2e/gesetze-historie-badge`).
    let freigabe: () => void = () => {};
    const angehalten = new Promise<void>((res) => { freigabe = res; });
    await page.route('**/normtext/historie/*.json', async (route) => {
      await angehalten;
      await route.continue();
    });

    await page.goto(ORT);
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForLoadState('networkidle', { timeout: 3000 })
      .catch(() => { /* der Shard hängt absichtlich — erwarteter Fall */ });
    await page.waitForTimeout(700);

    // NOCH KEINE Marke — sonst prüfte der Test einen abgeschlossenen Einwuchs.
    await expect(page.locator(F_MARKE)).toHaveCount(0);

    const geometrie = () => page.evaluate(() => {
      const o: Record<string, number> = {};
      for (const a of [...document.querySelectorAll('article[id^="art-"]')].slice(0, 10)) {
        o[a.id] = Math.round(a.getBoundingClientRect().y);
      }
      o.__hoehe = Math.round(document.body.scrollHeight);
      return o;
    });
    const vorher = await geometrie();
    await page.evaluate(() => {
      const w = window as unknown as { __d40cls: number };
      w.__d40cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as unknown as Array<{ hadRecentInput: boolean; value: number }>) {
          if (!e.hadRecentInput) w.__d40cls += e.value;
        }
      }).observe({ type: 'layout-shift', buffered: false });
    });

    freigabe();
    // POSITIV: der Einwuchs hat wirklich stattgefunden (sonst messen wir Stillstand).
    await expect(page.locator(F_MARKE).first()).toBeAttached({ timeout: 15_000 });
    await page.waitForTimeout(700);

    const nachher = await geometrie();
    for (const [id, y] of Object.entries(vorher)) {
      expect(nachher[id], `${id} verschoben: ${y} → ${nachher[id]}`).toBe(y);
    }
    const cls = await page.evaluate(() => (window as unknown as { __d40cls: number }).__d40cls);
    expect(cls, 'der Marken-Einwuchs erzeugt einen sichtbaren Sprung').toBe(0);
  });
});
