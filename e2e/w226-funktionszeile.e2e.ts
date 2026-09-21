// @shard-gruppe: 3
// ═══ W2·26 · DIE FUNKTIONSZEILE AM ARTIKELENDE, ÜBERARBEITET ════════════════
//
// MANDAT David 11.9.2026, wörtlich: «überarbeite insgesamt die Funktionszeile am
// Artikelende; Fassung soll nur ‹gilt seit XXX› zeigen, erst beim Aufklappen
// erscheinen die Angaben; Fussnoten, die z. B. nur eine SR-Nummer enthalten,
// müssen ebenfalls weg sein, wenn Fussnoten abgewählt sind; alles sauberer,
// übersichtlicher, besser bedienbar.»
//
// SECHS ZUSAGEN, je einzeln messbar:
//
//  (a) Z2 · ZUGEKLAPPT NUR DER STAND. Die Rubrik «Fassung» liest «Gilt seit
//      …  ›» und sonst nichts; aufgeklappt steht die ZAHL («7 Fassungen») und
//      darunter die Zeitleiste.
//  (b) Z4 · AKKORDEON. Höchstens eine Rubrik offen; das Öffnen einer zweiten
//      schliesst die erste; `aria-expanded`/`aria-controls` sagen den Zustand;
//      Escape schliesst und gibt den Fokus an den Griff zurück.
//  (c) Z6 · DIE AKTIONEN STEHEN NICHT IM LEERLAUF IM DOM. Ohne Hover und ohne
//      offene Rubrik ist kein «Zitat»/«Link» gerendert; Hover bringt sie, eine
//      offene Rubrik hält sie. Auf einem Gerät OHNE Hover stehen sie IMMER.
//  (d) Z8 · «FUSSNOTEN ABGEWÄHLT» HEISST ALLE. In der Vorgabestellung
//      («Fassung») ist im OR-Leser KEIN Fussnoten-Marker und KEIN Apparat
//      sichtbar; die Stellung «Fussnoten» stellt beides vollständig her.
//  (e) Z5 · D45 · Ein Klick auf einen Entscheid in der offenen Rubrik öffnet
//      ihn DANEBEN; der Artikel bleibt stehen.
//  (f) Z1 · Das Wort «Bezüge» steht nicht mehr in der Zeile.
//
// ROT ZU BEKOMMEN (§6.7) — je einzeln gefahren, Ausgaben im PR zu W2·26:
//  · in `parts/ArtikelLeser.bezuegeFuss.tsx` `etikett:` an der Marke `f`
//    löschen                                                        ⇒ (a) rot
//  · in `parts/Funktionszeile.tsx` `useState<… | null>(null)` durch die alte
//    Menge ersetzen (mehrere Rubriken gleichzeitig offen)            ⇒ (b) rot
//  · dort `zeigeAktionen` auf `true` festnageln                     ⇒ (c) rot
//  · in `src/index.css` die W2·26/Z8-Regel auf `[data-fn-klasse="A"]`
//    zurückstellen (der Stand vor dem 11.9.2026)                    ⇒ (d) rot
//    — GEFAHREN am 11.9.2026, Ausgabe im PR-Text festgehalten.
//  · in `v3/LeserLesespalte.tsx` `.lr7-bez-block[data-reg="r"]` aus dem
//    `closest`-Selektor streichen                                   ⇒ (e) rot
import { test, expect, type Page } from '@playwright/test';
import { warteLeserBereit } from './helpers/leserBereit';
import { F_BLOCK, F_MARKE } from './helpers/fassungsRubrik';

// ZPO Art. 198 führt sieben Fassungs-Ereignisse UND daneben Entscheide und
// Verweise (gemessen 11.9.2026) — eine Zeile, in der die Rubriken nebeneinander
// stehen und das Akkordeon etwas zu tun hat.
const ORT = '/gesetze/bund/ZPO';
const ART = '198';
const ZEILE = `#art-${ART} .lr7-bez`;

async function oeffneArtikel(page: Page): Promise<void> {
  await page.goto(`${ORT}#art-${ART}`);
  await warteLeserBereit(page);
  await page.locator(`#art-${ART}`).scrollIntoViewIfNeeded();
  await expect(page.locator(`${ZEILE} ${F_MARKE}`)).toBeVisible({ timeout: 20_000 });
}

test.describe('W2·26 · Funktionszeile am Artikelende', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(a) Z2 · Fassung zeigt zugeklappt nur den Stand, aufgeklappt Zahl und Zeitleiste', async ({ page }) => {
    await oeffneArtikel(page);
    const marke = page.locator(`${ZEILE} ${F_MARKE}`);

    // ZUGEKLAPPT: der Stand, und ausdrücklich NICHT die Zahl der Fassungen.
    await expect(marke).toHaveAttribute('aria-expanded', 'false');
    await expect(marke).toHaveText(/^Gilt seit \d{2}\.\d{2}\.\d{4}\s*›$/);
    // Der Accessible Name trägt die Zahl weiterhin (WCAG 4.1.2, Z2): die Zeile
    // verschweigt sie dem Auge, nicht dem Screenreader.
    await expect(marke).toHaveAttribute('aria-label', /\d+ Fassung(en)? zu /);

    // AUFGEKLAPPT: die Zahl steht in der Marke, die Zeitleiste im Block.
    await marke.click();
    await expect(marke).toHaveAttribute('aria-expanded', 'true');
    // `\s` deckt das geschützte Leerzeichen (\u00A0) zwischen Zahl und Wort mit ab.
    await expect(marke).toHaveText(/^\d+\s*Fassung(en)?\s*›$/);
    const block = page.locator(`#art-${ART} ${F_BLOCK}`);
    await expect(block).toBeVisible();
    // Die Zeitleiste ist eine `<ol>` mit so vielen Einträgen, wie die Marke sagt.
    const gesagt = Number(/^(\d+)/.exec((await marke.textContent()) ?? '')?.[1]);
    expect(gesagt, 'die Marke nennt eine Zahl').toBeGreaterThan(0);
    await expect(block.locator('ol > li')).toHaveCount(gesagt);
    // Und das Schild im Block nennt DENSELBEN Stand wie die Marke zuvor (§5).
    await expect(block.locator('.lc-chip')).toHaveText(/^Gilt seit \d{2}\.\d{2}\.\d{4}$/);
  });

  test('(b) Z4 · Akkordeon: höchstens eine Rubrik offen, Escape schliesst und gibt den Fokus zurück', async ({ page }) => {
    await oeffneArtikel(page);
    const fassung = page.locator(`${ZEILE} ${F_MARKE}`);
    const entscheide = page.locator(`${ZEILE} .lr7-bez-marke[data-reg="r"]`);
    await expect(entscheide).toBeVisible({ timeout: 20_000 });

    await fassung.click();
    await expect(fassung).toHaveAttribute('aria-expanded', 'true');
    // `aria-controls` zeigt auf den Block, der wirklich da ist.
    const blockId = await fassung.getAttribute('aria-controls');
    expect(blockId, 'aria-controls fehlt an der offenen Marke').toBeTruthy();
    await expect(page.locator(`#art-${ART} [id="${blockId}"]`)).toBeVisible();

    // Die zweite Rubrik schliesst die erste — genau EIN Block im Artikel.
    await entscheide.click();
    await expect(entscheide).toHaveAttribute('aria-expanded', 'true');
    await expect(fassung).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator(`#art-${ART} .lr7-bez-block`)).toHaveCount(1);

    // Escape schliesst und gibt den Fokus an den Griff zurück.
    await page.keyboard.press('Escape');
    await expect(entscheide).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator(`#art-${ART} .lr7-bez-block`)).toHaveCount(0);
    await expect(entscheide).toBeFocused();
  });

  test('(c) Z6 · die Aktionen stehen erst bei Hover oder offener Rubrik im DOM', async ({ page }) => {
    await oeffneArtikel(page);
    // Playwright-Falle (Auftrag): `filter({ has })` EINMAL auflösen und den
    // Index festhalten — ein zweiter Aufruf derselben Kette rechnet neu und
    // kann nach einem Re-Render auf ein anderes Element zeigen.
    const zeile = page.locator(ZEILE);
    const aktionen = zeile.locator('.lr7-bez-aktionen');

    await expect(aktionen, 'ohne Hover steht die Aktions-Gruppe nicht im DOM').toHaveCount(0);
    // Die Rubrik-Griffe bleiben IMMER da (Z6): sie tragen die Zahlen.
    await expect(zeile.locator('.lr7-bez-marke').first()).toBeVisible();

    await zeile.hover();
    await expect(aktionen).toHaveCount(1);
    await expect(aktionen.getByRole('button', { name: /Zitat kopieren/ })).toBeVisible();
    await expect(aktionen.getByRole('button', { name: /Permalink kopieren/ })).toBeVisible();

    // Weg mit der Maus ⇒ wieder weg; eine OFFENE Rubrik hält sie aber.
    await page.mouse.move(5, 5);
    await expect(aktionen).toHaveCount(0);
    await page.locator(`${ZEILE} ${F_MARKE}`).click();
    await expect(aktionen, 'offene Rubrik hält die Aktionen').toHaveCount(1);
  });

  test('(d) Z8 · «Fussnoten abgewählt» nimmt ALLE Fussnoten — auch die reinen SR-Verweise', async ({ page }) => {
    // Der OR-Leser ist der Ort des Befunds: 847 Marker, davon standen in der
    // Vorgabestellung 215 sichtbar da (Nullprobe 11.9.2026), 75 davon zu
    // Fussnoten, die nur «SR 943.03» tragen.
    await page.goto('/gesetze/bund/OR');
    await warteLeserBereit(page);
    await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'fassung');

    // Es gibt sie IM DOM (A1-Mechanik: nichts geht verloren) …
    const marker = page.locator('.lc-leser [data-fn-ref]');
    expect(await marker.count(), 'der OR-Leser trägt Fussnoten-Marker im DOM').toBeGreaterThan(0);
    // … und KEINER ist sichtbar.
    const sichtbar = async (sel: string) => page.evaluate((s) => [...document.querySelectorAll(s)]
      .filter((el) => (el as HTMLElement).getClientRects().length > 0
        && getComputedStyle(el).display !== 'none').length, sel);
    expect(await sichtbar('.lc-leser [data-fn-ref]'), 'sichtbare Fussnoten-Marker').toBe(0);
    expect(await sichtbar('.lc-leser [data-fn-marker]'), 'sichtbare Marker-Träger').toBe(0);
    expect(await sichtbar('.lc-leser [data-fn-apparat]'), 'sichtbare Apparat-Kästen').toBe(0);

    // Die Stellung «Fussnoten» stellt beides vollständig her.
    await page.locator('[data-v3-ansicht]').first().click();
    await expect(page.locator('[data-v3-ansicht-menue]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-v3-vermerke="fussnoten"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'fussnoten');
    expect(await sichtbar('.lc-leser [data-fn-apparat]'), 'Apparat nach «Fussnoten»').toBeGreaterThan(0);
    expect(await sichtbar('.lc-leser [data-fn-ref]'), 'Marker nach «Fussnoten»').toBeGreaterThan(0);
  });

  test('(e) Z5 · D45 · ein Entscheid aus der offenen Rubrik öffnet daneben', async ({ page }) => {
    test.slow(); // Split-View + nachgeladener Bezugs-Shard
    await oeffneArtikel(page);
    const entscheide = page.locator(`${ZEILE} .lr7-bez-marke[data-reg="r"]`);
    await expect(entscheide).toBeVisible({ timeout: 20_000 });
    await entscheide.click();

    // Playwright-Falle: die Kette EINMAL auflösen und den Treffer festhalten.
    const block = page.locator(`#art-${ART} .lr7-bez-block[data-reg="r"]`);
    await expect(block).toBeVisible();
    const ziel = block.locator('a[href^="/rechtsprechung/"]').nth(0);
    await expect(ziel).toBeVisible({ timeout: 20_000 });

    await ziel.click();
    await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 15_000 });
    // Der Artikel bleibt stehen — das ist der ganze Punkt (R6: geprüft, nicht besucht).
    await expect(page.locator(`#art-${ART}`)).toHaveCount(1);
  });

  test('(f) Z1 · das Wort «Bezüge» steht nicht mehr in der Zeile', async ({ page }) => {
    await oeffneArtikel(page);
    await expect(page.locator('.lc-leser .lr7-bez-wort')).toHaveCount(0);
    await expect(page.locator(ZEILE)).not.toContainText('Bezüge');
  });
});

// ── Z6, die zweite Hälfte der Zusage: DAS TELEFON VERLIERT NICHTS ───────────
// D35-F1 (1) hat die Aktionen aus einer `opacity-0`-Hover-Kette geholt, weil es
// sie auf dem Telefon praktisch nicht gab. Z6 darf das nicht rückgängig machen:
// wo es KEINEN Hover gibt, stehen sie dauerhaft. Eigener Block, weil das eine
// Geräte-Eigenschaft ist und keine Interaktion — `isMobile` schaltet in Chromium
// die echte Mobil-Emulation ein (Touch-Punkte, `(hover: none)`, `(pointer:
// coarse)`), und nur die trifft `window.matchMedia` so, wie ein Telefon es täte.
// (`Emulation.setEmulatedMedia` über CDP taugt dafür NICHT: seine Feature-Liste
// kennt `prefers-*`, nicht `hover` — nachgemessen 11.9.2026, die Aktionen blieben
// dort bei 0.)
test.describe('W2·26/Z6 · Gerät ohne Hover', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('(c2) die Aktionen stehen ohne Hover-Gerät dauerhaft im DOM', async ({ page }) => {
    await page.goto(`${ORT}#art-${ART}`);
    await warteLeserBereit(page);
    await page.locator(`#art-${ART}`).scrollIntoViewIfNeeded();
    await expect(page.locator(`${ZEILE} ${F_MARKE}`)).toBeVisible({ timeout: 20_000 });
    await expect(
      page.locator(`${ZEILE} .lr7-bez-aktionen`),
      'ohne Hover-Gerät müssen die Aktionen dauerhaft dastehen (D35-F1 (1))',
    ).toHaveCount(1);
  });
});
