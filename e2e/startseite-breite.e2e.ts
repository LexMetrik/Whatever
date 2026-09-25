// @shard-gruppe: 8
import { test, expect, type Page } from '@playwright/test';

// ─── Startseite auf Stufe `weit` (W2·31-BILDSCHIRMBREITE, 25.9.2026) ─────────
//
// Entscheid David 25.9.2026 «ja das soll optimiert werden» (Posten
// `2026-09-24-startseite-ab-1280-…`): die Startseite steht in `SEITENBREITE`
// auf `weit`. Den RAHMEN (1440 px ab 2xl, Footer-Flucht, Lesemass der
// Fliesstexte) prüft `e2e/seitenbreite.e2e.ts`. Was die Breite NUTZT, prüft
// nur dieser Wächter (Idee aus dem abgelegten Entwurf
// `archiv/w2-29-werkbank-rest-breite-voll-2026-09-25`, auf B1 übertragen):
//  (1) Die Kachelspalte wächst: @1920 Kachel ≥ 480 px (gemessen 508), die
//      Spalte rechts bleibt 320 px; @1440 unverändert 348 px.
//  (2) «Häufig gebraucht» ab 52rem Flächenbreite dreispaltig — nur auf dem
//      `weit`-Rahmen; @1440 und @1536 mit offener Seitenleiste zwei Spalten,
//      @390 eine.
//  (3) U13 GILT AUCH BREITER: `e2e/startseite-blatt.e2e.ts` prüft «kein
//      Scroll beim Aufklappen» nur @1440×900/@1280×800 (Prämisse dort: ab 1280
//      gleiche Breite — seit `weit` nicht mehr wahr). Hier @1536×864 (kleinste
//      2xl-Höhe), @1680×1050, @1920×1080 und @1536 mit Seitenleiste: jedes
//      Blatt ganz im Fenster, Seite unverschoben; Gesetze- und Werkzeuge-Wahl
//      ohne Überlauf (Rechtsprechung/Materialien tragen Listen, die im Blatt
//      scrollen dürfen — Auftrag U13).
//  (4) Nichts läuft bei mehr Breite auf eine unlesbare Länge aus: Kachel-
//      texte, «Häufig gebraucht» und die offenen Blätter Gesetze/Werkzeuge
//      höchstens 80 Zeichen je Zeile (wortgenau, Methode wie seitenbreite);
//      der Gruss (h1) bleibt ≤ 40rem.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit):
//  (1) `startseite` in seitenbreite.ts zurück auf `content` → Kachel 348 px.
//  (2) `@[52rem]:grid-cols-3` in HaeufigGebraucht.tsx streichen → 2 Spalten.
//  (3) `2xl:max-w-[15.5rem]` an der Kantone-Karte (GesetzeBlatt.tsx)
//      streichen → Gesetze-Wahl läuft ab 2xl über.

const LEISTE = 460;

async function mitLeiste(page: Page, breite: number) {
  await page.addInitScript((b) => {
    localStorage.setItem('lexmetrik-seitenleiste-eingeklappt.v2', '0');
    localStorage.setItem('lexmetrik-seitenleiste-breite', String(b));
  }, breite);
}

async function start(page: Page, breite: number, hoehe: number, pfad = '/') {
  await page.setViewportSize({ width: breite, height: hoehe });
  await page.goto(pfad);
  await expect(page.locator('.lc-start-zelle').first()).toBeVisible();
}

/** Längste sichtbare Zeile (Zeichen) in den Elementen des Selektors —
 *  wortgenau: Wort-Rects nach Zeilen-y gruppiert. */
async function laengsteZeile(page: Page, selektor: string): Promise<{ ch: number; text: string }> {
  return page.evaluate((sel) => {
    let best = { ch: 0, text: '' };
    document.querySelectorAll(sel).forEach((el) => {
      const zeilen = new Map<number, string>();
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = w.nextNode())) {
        const t = (n as Text).data;
        const re = /\S+/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(t))) {
          const r = document.createRange();
          r.setStart(n, m.index);
          r.setEnd(n, m.index + m[0].length);
          const rc = r.getClientRects()[0];
          if (!rc || !rc.width) continue;
          const y = Math.round(rc.top / 4);
          zeilen.set(y, `${zeilen.get(y) ?? ''}${m[0]} `);
        }
      }
      for (const z of zeilen.values()) if (z.trim().length > best.ch) best = { ch: z.trim().length, text: z.trim() };
    });
    return best;
  }, selektor);
}

const HAEUFIG = 'ul:has(> li > a.lc-menu-zeile)';

test.describe('Startseite · Stufe weit (W2·31-BILDSCHIRMBREITE)', () => {
  for (const [breite, kachelMin, kachelMax] of [[1920, 480, 9999], [1440, 347, 349]] as const) {
    test(`(1) @${breite}: Kachel ${kachelMin > 400 ? '≥ 480 px' : '348 px'}, Spalte rechts 320 px`, async ({ page }) => {
      await start(page, breite, 1000);
      const m = await page.evaluate(() => ({
        kachel: Math.round(document.querySelector('.lc-start-zelle')!.getBoundingClientRect().width),
        aside: Math.round(document.querySelector('aside[aria-label="Arbeitsplatz"]')!.getBoundingClientRect().width),
      }));
      expect(m.kachel, JSON.stringify(m)).toBeGreaterThanOrEqual(kachelMin);
      expect(m.kachel, JSON.stringify(m)).toBeLessThanOrEqual(kachelMax);
      expect(m.aside).toBe(320);
    });
  }

  for (const { breite, leiste, spalten } of [
    { breite: 1920, leiste: 0, spalten: 3 },
    { breite: 1440, leiste: 0, spalten: 2 },
    { breite: 1536, leiste: LEISTE, spalten: 2 },
    { breite: 390, leiste: 0, spalten: 1 },
  ]) {
    test(`(2) @${breite}${leiste ? ` mit Seitenleiste ${leiste} px` : ''}: «Häufig gebraucht» ${spalten}-spaltig`, async ({ page }) => {
      if (leiste) await mitLeiste(page, leiste);
      await start(page, breite, 1000);
      const cols = await page.locator(HAEUFIG).evaluate((ul) => getComputedStyle(ul).gridTemplateColumns.split(' ').length);
      expect(cols).toBe(spalten);
    });
  }

  for (const { breite, hoehe, leiste } of [
    { breite: 1536, hoehe: 864, leiste: 0 },
    { breite: 1680, hoehe: 1050, leiste: 0 },
    { breite: 1920, hoehe: 1080, leiste: 0 },
    { breite: 1536, hoehe: 864, leiste: LEISTE },
  ]) {
    test(`(3) U13 @${breite}×${hoehe}${leiste ? ' mit Seitenleiste' : ''}: alle vier Blätter ganz im Fenster`, async ({ page }) => {
      if (leiste) await mitLeiste(page, leiste);
      await page.setViewportSize({ width: breite, height: hoehe });
      for (const name of ['Gesetze', 'Rechtsprechung', 'Materialien', 'Werkzeuge']) {
        await page.goto('/');
        await page.getByRole('navigation', { name: 'Bereiche der Sammlung' })
          .getByRole('button', { name: new RegExp(name) }).click();
        await expect(page.locator('#lm-start-blatt')).toHaveAttribute('data-phase', 'offen');
        if (name === 'Gesetze') await expect(page.getByRole('button', { name: 'Alle 26 Kantone' })).toBeVisible();
        if (name === 'Werkzeuge') await expect(page.getByRole('list', { name: 'Vorlagen nach Rechtsgebiet' })).toBeVisible();
        const m = await page.evaluate(() => {
          const i = document.querySelector('.lc-start-blatt-inhalt')!;
          const b = document.querySelector('#lm-start-blatt')!.getBoundingClientRect();
          return { ueber: i.scrollHeight - i.clientHeight, unten: Math.round(b.bottom), vh: innerHeight, sy: Math.round(scrollY) };
        });
        test.info().annotations.push({ type: `U13 ${name} @${breite}×${hoehe}`, description: JSON.stringify(m) });
        expect(m.unten, `${name}: Blatt-Unterkante im Fenster (${JSON.stringify(m)})`).toBeLessThanOrEqual(m.vh);
        expect(m.sy, `${name}: Seite unverschoben`).toBe(0);
        if (name === 'Gesetze' || name === 'Werkzeuge') {
          expect(m.ueber, `${name}-Wahl ohne Überlauf (${JSON.stringify(m)})`).toBeLessThanOrEqual(1);
        }
      }
    });
  }

  test('(4) @1920: Kacheltexte, «Häufig gebraucht» und Gruss bleiben im Lesemass', async ({ page }) => {
    await start(page, 1920, 1080);
    for (const sel of ['.lc-start-zelle', `${HAEUFIG} li`]) {
      const z = await laengsteZeile(page, sel);
      expect(z.ch, `${sel}: mindestens eine Zeile gemessen`).toBeGreaterThan(0);
      expect(z.ch, `${sel}: «${z.text}»`).toBeLessThanOrEqual(80);
    }
    const h1 = await page.locator('h1').evaluate((e) => e.getBoundingClientRect().width / parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(h1, 'Gruss ≤ 40rem').toBeLessThanOrEqual(40);
  });

  for (const blatt of ['gesetze', 'werkzeuge']) {
    test(`(4) @1920: offenes Blatt ${blatt} ohne Zeile über 80 Zeichen`, async ({ page }) => {
      await start(page, 1920, 1080, `/?blatt=${blatt}`);
      await expect(page.locator('#lm-start-blatt')).toHaveAttribute('data-phase', 'offen');
      const z = await laengsteZeile(page, '.lc-start-blatt-inhalt li, .lc-start-blatt-inhalt p');
      expect(z.ch, 'mindestens eine Zeile gemessen').toBeGreaterThan(0);
      expect(z.ch, `«${z.text}»`).toBeLessThanOrEqual(80);
    });
  }
});
