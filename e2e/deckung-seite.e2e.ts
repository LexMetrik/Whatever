// @shard-gruppe: 1
// ═══ W2·6c-DECKUNGS-SEITE · «WAS WIR NICHT HABEN» ═══════════════════════════
//
// §11.5 FAHRPLAN-MATERIALIEN-VERZAHNUNG (Muster Lex /coverage), ausgelöst durch
// den ROADMAP-Befund vom 11.9.2026: rund ein Viertel der Synopse-Alt-Blöcke
// trägt kein Fussnoten-Ereignis. Die Seite zeigt diese und die übrigen Lücken.
//
// FÜNF ZUSAGEN, je einzeln messbar:
//
//  (a) EIN LADEKANAL, UND ZWAR NUR DIESER. Die Seite holt genau
//      `/materialien/deckungs-sicht.json` (78 KB). Die grossen Register —
//      `/materialien/register.json` (1,4 MB), `/normtext/register.json`
//      (1,5 MB), `/materialien/register-provenienz.json` (540 KB) — und die
//      Shard-Ordner `/materialien/synopse/` und `/materialien/entstehung/`
//      werden NIE angefasst (§15). Sonst wäre die Projektion sinnlos.
//
//  (b) DIE ZAHLEN SIND ECHT UND > 0. Ebenen-Block und Erlass-Liste tragen
//      Zahlen aus dem Artefakt; die Liste hat so viele Zeilen wie das Artefakt
//      Erlasse führt.
//
//  (c) SORTIERUNG WIRKT UND SAGT ES. Ein Klick auf einen Spaltenkopf dreht die
//      Reihenfolge und setzt `aria-sort` — auf- und absteigend, mit
//      Tastatur erreichbar (echter Knopf).
//
//  (d) 0-%-FÄLLE SIND SICHTBAR. Der Erlass mit dem tiefsten Deckungsgrad steht
//      bei aufsteigender Sortierung zuoberst und zeigt «0.0 %» — die Seite
//      versteckt ihre schlechtesten Werte nicht (§8).
//
//  (e) KEIN SPRUNG, KEIN ÜBERLAUF. @320 px ragt nichts aus dem Viewport, ausser
//      es sitzt in einem AFFORDANZIERTEN Scroller (`overflow-x` +
//      `lc-scrollrand-x`) — dieselbe Bedingung wie `e2e/kein-abschnitt`
//      Kategorie a. Die Seite selbst scrollt nie waagrecht, und nach dem Laden
//      verschiebt sich der Seitenkopf nicht (CLS 0, §15).
//
// ROT ZU BEKOMMEN (§6.7) — je einzeln gefahren, Protokoll im PR-Body:
//  · in `src/pages/MaterialienDeckung.tsx` zusätzlich
//    `fetch('/materialien/register.json')` im Effekt                ⇒ (a) rot
//  · in `src/lib/materialien/deckung.ts` `summiere()` alle Summen auf 0 ⇒ (b) rot
//  · dort `sortiere()` die Liste unverändert zurückgeben lassen     ⇒ (c) rot
//  · in der Seite die 0-%-Zeilen herausfiltern                      ⇒ (d) rot
//  · an der Tabelle `lc-scrollrand-x` ODER `overflow-x-auto` entfernen ⇒ (e) rot
import { test, expect, type Page } from '@playwright/test';

const ORT = '/materialien/deckung';
const TABELLE = '[data-deckung-tabelle]';
const ZEILE = '[data-deckung-zeile]';

/** Zählt die Abrufe, die diese Seite auslösen darf — und die, die sie nicht darf. */
function abrufe(page: Page): { sicht: string[]; schwer: string[] } {
  const g = { sicht: [] as string[], schwer: [] as string[] };
  page.on('request', (r) => {
    const u = r.url();
    if (u.includes('/materialien/deckungs-sicht.json')) g.sicht.push(u);
    else if (
      u.includes('/materialien/register.json')
      || u.includes('/materialien/register-provenienz.json')
      || u.includes('/materialien/register-i18n.json')
      || u.includes('/normtext/register.json')
      || u.includes('/materialien/synopse/')
      || u.includes('/materialien/entstehung/')
      || u.includes('/materialien/curia/')
    ) g.schwer.push(u);
  });
  return g;
}

async function oeffne(page: Page): Promise<void> {
  await page.goto(ORT);
  await expect(page.locator(TABELLE)).toBeVisible({ timeout: 20_000 });
}

test.describe('Deckungs-Seite «was wir nicht haben»', () => {
  test('(a) holt genau die Deckungs-Sicht und kein grosses Register', async ({ page }) => {
    const g = abrufe(page);
    await oeffne(page);
    await expect(page.locator(ZEILE).first()).toBeVisible();
    expect(g.sicht.length, 'die Sicht wird genau einmal geholt').toBe(1);
    expect(g.schwer, 'kein grosses Register und kein Shard-Ordner').toEqual([]);
  });

  test('(b) zeigt Zahlen aus dem Artefakt: Ebenen > 0 und eine Zeile je Erlass', async ({ page }) => {
    await oeffne(page);
    const artefakt = await page.evaluate(async () => {
      const r = await fetch('/materialien/deckungs-sicht.json');
      const j = await r.json() as {
        erlasse: Record<string, { ocFussnoten: number; ocGetroffen: number; altBloecke?: number }>;
      };
      const z = Object.values(j.erlasse);
      return {
        anzahl: z.length,
        ocFussnoten: z.reduce((a, x) => a + x.ocFussnoten, 0),
        altBloecke: z.reduce((a, x) => a + (x.altBloecke ?? 0), 0),
      };
    });
    expect(artefakt.anzahl).toBeGreaterThan(0);
    expect(artefakt.ocFussnoten).toBeGreaterThan(0);
    expect(artefakt.altBloecke).toBeGreaterThan(0);
    await expect(page.locator(ZEILE)).toHaveCount(artefakt.anzahl);

    // Der Ebenen-Block nennt die Fundstellen-Summe im Satz, nicht irgendeine Zahl.
    const ebenen = await page.locator('[data-deckung-ebenen]').innerText();
    expect(ebenen.replace(/’/g, "'")).toContain(
      `von ${artefakt.ocFussnoten.toLocaleString('de-CH').replace(/’/g, "'")} Fundstellen`,
    );
    // Der Synopse-Abschnitt nennt die Alt-Block-Summe.
    const ohne = await page.locator('[data-deckung-ohne]').innerText();
    expect(ohne.replace(/’/g, "'")).toContain(
      artefakt.altBloecke.toLocaleString('de-CH').replace(/’/g, "'"),
    );
  });

  test('(c) sortiert auf Klick und auf Tastatur, mit aria-sort', async ({ page }) => {
    await oeffne(page);
    const kopf = page.locator('th:has([data-deckung-sort="quote"])');
    await expect(kopf).toHaveAttribute('aria-sort', 'ascending');
    const ersteAuf = await page.locator(ZEILE).first().getAttribute('data-deckung-zeile');

    await page.locator('[data-deckung-sort="quote"]').click();
    await expect(kopf).toHaveAttribute('aria-sort', 'descending');
    const ersteAb = await page.locator(ZEILE).first().getAttribute('data-deckung-zeile');
    expect(ersteAb).not.toBe(ersteAuf);

    // Tastatur: der Kopf ist ein echter Knopf, Enter dreht zurück.
    await page.locator('[data-deckung-sort="quote"]').focus();
    await page.keyboard.press('Enter');
    await expect(kopf).toHaveAttribute('aria-sort', 'ascending');
    await expect(page.locator(ZEILE).first()).toHaveAttribute('data-deckung-zeile', ersteAuf!);

    // Eine andere Spalte übernimmt die Sortierung, die alte fällt auf «none».
    await page.locator('[data-deckung-sort="altBloecke"]').click();
    await expect(kopf).toHaveAttribute('aria-sort', 'none');
    await expect(page.locator('th:has([data-deckung-sort="altBloecke"])')).toHaveAttribute('aria-sort', 'descending');
  });

  test('(d) stellt die 0-%-Fälle zuoberst statt sie zu verstecken', async ({ page }) => {
    await oeffne(page);
    const ersteZelle = page.locator(`${ZEILE} td`).first();
    await expect(ersteZelle).toHaveText('0.0 %');
  });

  test('(e) @320 px: nichts ragt heraus, der Kopf springt nicht', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(ORT);
    const kopf = page.locator('h1');
    await expect(kopf).toBeVisible({ timeout: 20_000 });
    const vorher = await kopf.boundingBox();
    await expect(page.locator(ZEILE).first()).toBeVisible({ timeout: 20_000 });
    const nachher = await kopf.boundingBox();
    expect(nachher!.y, 'der Seitenkopf verschiebt sich beim Nachladen nicht').toBe(vorher!.y);

    // Die SEITE darf nicht waagrecht scrollen — das ist der Massstab, nicht
    // «kein Element ist breiter als der Schirm»: die Zahlentabelle IST breiter,
    // sie scrollt aber in ihrem eigenen Kasten (Prüfung direkt darunter).
    //
    // GESCHÄRFT (CI-Befund R8, 12.9.2026): die erste Fassung liess JEDEN
    // `overflow-x`-Vorfahren durchgehen und war damit blind für genau den
    // Fehler, der dann in Shard 2/4 auffiel — ein Scroller OHNE Affordanz
    // (`lc-scrollrand-x`) schneidet die letzte Spalte ab, ohne dass irgendetwas
    // sagt, dass dort noch Inhalt liegt. Die Sonde misst jetzt dieselbe
    // Bedingung wie `e2e/kein-abschnitt` Kategorie a: nur ein AFFORDANZIERTER
    // Scroller entschuldigt den Überlauf. `hidden`/`clip` entschuldigen ihn
    // nicht mehr — was geklippt wird, ist unerreichbar, nicht geschoben.
    const ueberlauf = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      const imAffordanziertenKasten = (e: Element): boolean => {
        for (let a: Element | null = e.parentElement; a; a = a.parentElement) {
          const ox = getComputedStyle(a).overflowX;
          if ((ox === 'auto' || ox === 'scroll') && a.classList.contains('lc-scrollrand-x')) return true;
        }
        return false;
      };
      return [...document.querySelectorAll('body *')]
        .filter((e) => e.getBoundingClientRect().right > w + 1 && !imAffordanziertenKasten(e))
        .map((e) => `${e.tagName}.${(e.className || '').toString().slice(0, 40)}`)
        .slice(0, 5);
    });
    expect(ueberlauf, 'kein Element ragt ohne affordanzierten Scroller über den Viewport').toEqual([]);
    const seiteScrollt = await page.evaluate(
      () => document.scrollingElement!.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(seiteScrollt, 'die Seite selbst scrollt nie waagrecht').toBe(false);
    // Die Tabelle selbst darf breiter sein — sie scrollt in ihrem eigenen
    // Kasten, UND der Kasten sagt es (Scrollstand-Affordanz `lc-scrollrand-x`,
    // B8/LM-063): ohne sie endet die letzte Spalte ohne jedes Zeichen.
    const kasten = await page.locator(TABELLE).evaluate((t) => {
      const k = t.parentElement!;
      return {
        scrollt: k.scrollWidth > k.clientWidth,
        overflowX: getComputedStyle(k).overflowX,
        affordanz: k.classList.contains('lc-scrollrand-x'),
      };
    });
    expect(kasten.scrollt, 'die breite Tabelle scrollt in ihrem Kasten').toBe(true);
    expect(['auto', 'scroll'], 'der Kasten ist wirklich scrollbar').toContain(kasten.overflowX);
    expect(kasten.affordanz, 'der Kasten trägt die Scrollstand-Affordanz lc-scrollrand-x').toBe(true);
  });
});
