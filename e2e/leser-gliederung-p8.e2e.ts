// @shard-gruppe: 4
// ── P8 · DIE GLIEDERUNG IST ADRESSIERBAR ────────────────────────────────────
//
// BEFUND (Prüfer R6, 6.9.2026): der Gliederungsbaum des Gesetzeslesers bestand
// aus 39 `button` und 2 `a`. Ein Knopf hat keine Adresse — ⌘-/Strg-Klick öffnete
// keinen neuen Reiter, der Mittelklick tat nichts, «Link-Adresse kopieren» fehlte
// im Kontextmenü. Seit W2·24-R6c trägt jede Zeile mit einem Sprungziel
// `href="#art-<token>"` (SektionBaumTOC `TocZeile`).
//
// DREI ZUSAGEN, die einander decken:
//  (a) FORM — die Sprung-Zeilen sind `<a href="#art-…">`, und zwar die grosse
//      Mehrheit (nicht bloss eine).
//  (b) FUNKTION UNVERÄNDERT — der schlichte Linksklick springt weiterhin an die
//      Stelle im Text; er navigiert NICHT (die Adresse in der Zeile bleibt, wie
//      sie war: der TOC-Sprung erzeugt bewusst keinen History-Eintrag, LM-202).
//  (c) NEUE FUNKTION — ⌘-/Strg-Klick öffnet einen zweiten Reiter auf derselben
//      Seite mit dem Anker der Zeile, statt den Sprung auszulösen.
//
// Ohne (b) wäre (a) mit einem toten Link erfüllbar; ohne (c) hätte die
// Umstellung keinen Zweck; ohne (a) wären (b)/(c) nicht der Rede wert.
//
// ROT ZU BEKOMMEN (§6.7): in `SektionBaumTOC.tsx` `href={sprungZiel}` entfernen
// — (a) und (c) reissen. Oder das `if (sprungZiel && !istSchlichterKlick(ev))
// return;` streichen — dann springt auch der ⌘-Klick und (c) reisst.
import { test, expect } from '@playwright/test';

const ERLASS = '/gesetze/bund/OR';
const zeilen = '[data-toc] li[data-sektion-id] :is(a, button)[title]';

test.describe('P8 · Gliederungszeilen sind Links', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(a) die Sprung-Zeilen tragen eine `#art-…`-Adresse', async ({ page }) => {
    await page.goto(ERLASS);
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20000 });
    await page.waitForSelector('[data-toc] [data-sektion-id]');
    const m = await page.evaluate(() => {
      const zs = [...document.querySelectorAll('[data-toc] li[data-sektion-id] :is(a, button)[title]')];
      const links = zs.filter((e) => e.tagName === 'A');
      return {
        gesamt: zs.length,
        links: links.length,
        mitArtAnker: links.filter((a) => /#art-/.test((a as HTMLAnchorElement).getAttribute('href') ?? '')).length,
      };
    });
    // Leer-Treffer-Schutz: der Baum muss überhaupt Zeilen gerendert haben.
    expect(m.gesamt, 'keine Gliederungszeile gemessen').toBeGreaterThan(10);
    // Der Baum darf Zeilen ohne Adresse führen (§8: keine erfinden) — aber die
    // Regel ist der Link, nicht die Ausnahme.
    expect(m.links, `nur ${m.links} von ${m.gesamt} Zeilen sind Links`).toBeGreaterThan(m.gesamt * 0.8);
    expect(m.mitArtAnker, 'ein Link ohne `#art-`-Anker — die Adresse zeigt woandershin').toBe(m.links);
  });

  test('(b) der schlichte Klick springt weiter und navigiert nicht', async ({ page }) => {
    await page.goto(ERLASS);
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20000 });
    await page.waitForSelector('[data-toc] [data-sektion-id]');
    const vorher = page.url();
    const vorherY = await page.evaluate(() => window.scrollY);
    // Eine Zeile weiter unten im Baum, damit der Sprung eine Strecke hat.
    await page.locator(zeilen).nth(6).click();
    await page.waitForTimeout(700);
    const nachher = await page.evaluate(() => ({ url: location.href, y: window.scrollY }));
    expect(nachher.url, 'der Klick hat navigiert statt zu springen (LM-202: kein History-Eintrag)').toBe(vorher);
    expect(Math.abs(nachher.y - vorherY), 'der Klick hat den Lesetext nicht bewegt — der Sprung ist verloren')
      .toBeGreaterThan(100);
  });

  test('(c) ⌘/Strg-Klick öffnet einen zweiten Reiter mit dem Anker der Zeile', async ({ page, context }) => {
    await page.goto(ERLASS);
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20000 });
    await page.waitForSelector('[data-toc] [data-sektion-id]');
    const zeile = page.locator(`${zeilen}[href]`).nth(6);
    const href = await zeile.getAttribute('href');
    expect(href, 'die geprüfte Zeile hat keine Adresse').toMatch(/^#art-/);
    const vorherY = await page.evaluate(() => window.scrollY);

    const neuerReiter = context.waitForEvent('page', { timeout: 10000 });
    await zeile.click({ modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'] });
    const seite2 = await neuerReiter;
    // ── §6.3-DEKLARATION (W2·24-CI, 6.9.2026) · AUF DIE ADRESSE WARTEN ──────
    // `waitForLoadState('domcontentloaded')` beantwortet die falsche Frage: ein
    // im HINTERGRUND geöffneter Reiter existiert zuerst als `about:blank` und
    // bekommt seine Adresse erst, wenn die Navigation festgeschrieben ist —
    // das leere Dokument ist zu diesem Zeitpunkt bereits «domcontentloaded».
    // Lokal (macOS/Meta) gewann das Rennen die Navigation, auf dem CI-Runner
    // (Linux/Control, Lauf 34054880415 Shard 4/8) das leere Dokument: gemeldet
    // wurde «about:blank». Geprüft wird unverändert DASSELBE — dass der neue
    // Reiter den Anker der Zeile trägt —, nur wartet der Fall jetzt auf genau
    // dieses Ereignis statt auf ein früheres, das nichts darüber aussagt.
    await seite2.waitForURL((u) => u.hash === href, { timeout: 15_000 })
      .catch(() => { /* die Prüfung unten meldet die Ist-Adresse verständlich */ });
    expect(seite2.url(), 'der neue Reiter zeigt nicht den Anker der Zeile').toContain(href!);
    // Und die ERSTE Seite ist stehengeblieben — der Modifikator-Klick darf nicht
    // ZUSÄTZLICH springen (sonst verliert der Leser seine Stelle).
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY),
      '⌘-Klick hat zusätzlich gesprungen — die Ausgangsstelle ist verloren').toBe(vorherY);
    await seite2.close();
  });
});
