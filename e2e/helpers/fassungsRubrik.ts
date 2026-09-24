// ═══ W2·24-D40 · WO DIE FASSUNGS-AUSKUNFT SEIT DEM 7.9.2026 STEHT ═══════════
//
// David, wörtlich: «und wieso ist fassung nicht auch unten am artikel?». Bis D40
// stand «Gilt seit … ▸» in einem eigenen Slot am ARTIKELKOPF (`[data-hist-slot]`,
// `mt-4 min-h-beiwerk`); seither ist sie die erste Rubrik der Funktionszeile am
// Artikelende — Marke mit Zahl, Block auf Klick.
//
// DIESER HELFER IST DER EINE ORT, an dem die Sonden das wissen. Ohne ihn stünde
// derselbe Griff in sechs Specs sechsmal (§5), und die nächste Ortsverschiebung
// wäre wieder eine Sammel-Änderung. Er misst nichts und behauptet nichts — er
// benennt Selektoren und klappt auf.
//
// ═══ S6 W1f (Entscheid David 24.9.2026) · DIE NÄCHSTE ORTSVERSCHIEBUNG ═══════
// Wörtlich: «die zeile soll ganz weg. infos sollen alle im blatt erscheinen».
// Die Fassung steht seither als Klappzeile «Fassung dieses Artikels» oben im
// Reiter «Änderungen» des Erlass-Blatts (`v3/BlattArtikel.tsx`) — für den
// Artikel, dem das Blatt gerade folgt. Genau dafür existiert dieser Helfer: die
// Specs rufen weiter `fassungAufklappen(art)`, nur der Weg dahinter ist neu
// (Artikel an den Kopf scrollen → Blatt auf → Reiter → Klappzeile).
import { expect, type Locator, type Page } from '@playwright/test';
import { panelAufziehen } from './panelOeffnen';

/** Die Klappzeile «Fassung dieses Artikels» im Blatt (Reiter «Änderungen»). */
export const F_BLOCK = '[data-v3-blatt-fassung]';

/** Token eines Artikel-Elements (`#art-336_c` ⇒ `336_c`). */
async function tokenVon(art: Locator): Promise<string> {
  const id = await art.getAttribute('id');
  if (!id?.startsWith('art-')) throw new Error(`kein Artikel-Element: id=${id}`);
  return id.slice(4);
}

/**
 * Macht `art` zum Artikel, dem das Blatt folgt: an den Kopf der Lesespalte
 * scrollen (dort liest der Scroll-Spy), Blatt öffnen, warten, bis es den
 * Artikel nennt (`data-v3-panel-artikel`).
 */
export async function blattFuerArtikel(art: Locator, timeout = 15_000): Promise<{ page: Page; token: string }> {
  const page = art.page();
  const token = await tokenVon(art);
  await expect(art).toBeAttached({ timeout });
  // Erst scrollen, dann öffnen: als Bottom-Sheet (@390) ist das Blatt modal,
  // dahinter scrollt dann nichts mehr.
  await art.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  await panelAufziehen(page);
  const flaeche = page.locator('[data-v3-panel-artikel]').first();
  // Das Blatt kann die Lesespalte verschieben (Spur ab 1024 px) — darum erst
  // NACH dem Öffnen an den Kopf scrollen, und so lange, bis der Scroll-Spy folgt.
  // Der Scroll-Spy wertet nur bei einem Scroll-EREIGNIS aus: steht der Artikel
  // schon am Kopf, löst `scrollIntoView` keines aus — darum ein Zupfen um 1 px.
  await expect(async () => {
    await art.evaluate(async (el) => {
      el.scrollIntoView({ block: 'start' });
      await new Promise((r) => requestAnimationFrame(r));
      const sc = el.closest('[data-pane]') ?? document.scrollingElement ?? document.documentElement;
      (sc as Element).scrollBy?.(0, 1);
    });
    await expect(flaeche).toHaveAttribute('data-v3-panel-artikel', token, { timeout: 1_500 });
  }).toPass({ timeout });
  return { page, token };
}

/** Wählt einen Reiter des offenen Blatts. */
export async function blattReiter(page: Page, reiter: string): Promise<void> {
  const tab = page.locator(`[data-v3-panel-reiter="${reiter}"]`).first();
  if (await tab.getAttribute('aria-selected') !== 'true') await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
}

/**
 * S6 W1f (Auftrag 24.9.2026): jeder Reiter zeigt oben den Artikelteil, der
 * erlassweite Teil steht darunter ZUGEKLAPPT («Alle … des Erlasses · N»).
 * Klappt ihn auf, falls er als Klappzeile steht — bei Null im ganzen Erlass
 * steht die Tafel ohne Klappzeile (dann ist nichts zu tun).
 */
export async function erlassTeilAuf(page: Page, reiter: string): Promise<void> {
  const griff = page.locator(`[data-v3-blatt-erlassteil="${reiter}"] > button`).first();
  // Die Zahl kommt mit der Tafel-Quelle; bis dahin kann die Klappzeile fehlen.
  await expect.poll(async () => (await griff.count()) > 0
    || (await page.locator(`[data-v3-panel-reiter-inhalt="${reiter}"]`).count()) > 0, { timeout: 20_000 }).toBe(true);
  if ((await griff.count()) && (await griff.getAttribute('aria-expanded')) !== 'true') await griff.click();
}

/**
 * Wartet, bis der Historie-Shard die Fassungs-Zeile dieses Artikels im Blatt
 * gefüllt hat, und liefert ihren Klapp-Griff (noch zu).
 */
export async function fassungsMarke(art: Locator, timeout = 15_000): Promise<Locator> {
  const { page, token } = await blattFuerArtikel(art, timeout);
  await blattReiter(page, 'aenderungen');
  const zeile = page.locator(`[data-v3-blatt-fassung="${token}"]`);
  await expect(zeile).toBeVisible({ timeout });
  return zeile.locator('button[aria-expanded]').first();
}

/**
 * Klappt die Fassung auf und liefert die Zeile «Gilt seit …» samt Zeitleiste —
 * das, was bis D40 der Kopf-Slot und bis W1f die Rubrik «Fassung» zeigte.
 */
export async function fassungAufklappen(art: Locator, timeout = 15_000): Promise<Locator> {
  const griff = await fassungsMarke(art, timeout);
  if ((await griff.getAttribute('aria-expanded')) !== 'true') await griff.click();
  const token = await tokenVon(art);
  const block = art.page().locator(`[data-v3-blatt-fassung="${token}"]`);
  return block.locator('[data-historie-zeile]');
}
