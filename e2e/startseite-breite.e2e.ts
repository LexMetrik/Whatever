// @shard-gruppe: 8
import { test, expect, type Page } from '@playwright/test';

// ─── W2·29-WERKBANK-REST-BREITE (25.9.2026) ──────────────────────────────────
//
// Posten `2026-09-24-startseite-ab-1280-auf-allen-breiten-identisch-1680-1920-
// nut.md`, Entscheid David 25.9.2026 «ja das soll optimiert werden»: ab 1280
// war der Inhalt auf `max-w-content` (70rem = 1120px) gedeckelt — 1680 und
// 1920 sahen darum identisch aus wie 1280/1440. Fix (Vorgänger-Commit
// fee2577c2): `tailwind.config.js` bekommt die Stufe `weit` (90rem), `Shell.tsx`
// (`inhaltsbreiteFuer`) wendet sie NUR auf der Startseite (`/`) ab `2xl`
// (1536px) an — jede andere Route bleibt byte-gleich auf `content`.
//
// GEWÄHLTE VARIANTE (a) — Begründung und volle Messreihe im Kopfkommentar von
// `pages/Startseite.tsx` (Abschnitt «W2·29-WERKBANK-REST-BREITE»): NUR die
// Kachelspalte (`minmax(0,1fr)`) wächst automatisch mit dem breiteren
// Container — keine Änderung an den Grid-Klassen in `Startseite.tsx` nötig,
// die 20rem-Spalte rechts (Schnellwerkzeug/Zuletzt) bleibt unverändert.
//
// ABWEICHUNG VOM AUFTRAG, OFFENGELEGT (§7): der Auftrag verlangte zusätzlich
// «das Suchblock-Intro bleibt auf max-w-reading» / «höchstens 640px breit
// @1920». Das ist bereits VOR diesem Posten falsch: U6 (David 24.9.2026
// «Kopfzeile ruhig», Commentar in `SuchBlock.tsx`) hat den früheren Deckel
// `max-w-[54rem]` ausdrücklich GESTRICHEN («die Linie darunter über die volle
// Inhaltsbreite … liess sie über den Kacheln enden und ist darum gestrichen»)
// — der Begrüssungs-Streifen läuft seither bewusst über die volle
// Inhaltsbreite, nicht auf einer Lesespalte. Ein neuer 640px-Deckel wäre eine
// stille Rücknahme von U6 ohne Auftrag dazu; dieser Wächter prüft darum NICHT
// die Suchblock-Breite, sondern (unten, Fall «Kachel-Zeilen») das eigentliche
// Schutzziel dahinter — keine Fliesstext-Zeile der Startseite läuft bei mehr
// Platz auf eine unlesbare Länge aus.
//
// (i) + (ii): Shell-Inhaltsbreite `main > div` — Golden-Beweis, dass NUR `/`
// ab `2xl` wächst und jede andere Route byte-gleich bleibt.
// (iii): keine Kachel-Textzeile (Nutzen-/Teile-Zeile) über ~75 Zeichen — Methode
// wie `e2e/leser-lesemass.e2e.ts` (Textlänge / Zeilenkästen über
// `Range.getClientRects()`), aber mit `textContent` statt `innerText`: Text in
// einem zugeklappten `<details>` (z. B. «In Vorbereitung» im Werkzeuge-Blatt)
// liefert `innerText` leer, `textContent` nicht (Auftrags-Hinweis).

async function inhaltsbreite(page: Page): Promise<number> {
  return page.evaluate(() => Math.round(document.querySelector('main > div')!.getBoundingClientRect().width));
}

interface ZeilenBefund { text: string; ch: number }

async function messeMaxCharsProZeile(page: Page, selector: string): Promise<ZeilenBefund | null> {
  return page.evaluate((sel: string): ZeilenBefund | null => {
    let best: ZeilenBefund | null = null;
    document.querySelectorAll(sel).forEach((el) => {
      const text = (el.textContent ?? '').trim();
      if (text.length < 8) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = range.getClientRects();
      if (!rects.length) return;
      const ch = text.length / rects.length;
      if (!best || ch > best.ch) best = { text: text.slice(0, 90), ch };
    });
    return best;
  }, selector);
}

test.describe('Startseite · Inhaltsbreite ab 2xl (W2·29-WERKBANK-REST-BREITE)', () => {
  // (i) Nur «/» wächst ab 2xl (1536px) auf `weit` (90rem = 1440px); darunter
  // bleibt jede Breite auf `content` (70rem = 1120px) — wie vor diesem Posten.
  for (const [breite, erwartet] of [[1280, 1120], [1440, 1120], [1680, 1440], [1920, 1440]] as const) {
    test(`«/» @${breite}: Inhaltsbreite ${erwartet}px`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: 900 });
      await page.goto('/');
      await page.waitForSelector('.lc-start-zelle');
      expect(await inhaltsbreite(page)).toBe(erwartet);
    });
  }

  // (ii) Jede andere Route bleibt @1920 byte-gleich auf `content` (1120px) —
  // die Golden-Zusage aus dem Kopfkommentar von `tailwind.config.js`
  // («Alle anderen Routen bleiben byte-gleich auf `content`»).
  for (const pfad of ['/ueber', '/rechner/zpo-fristen']) {
    test(`${pfad} @1920: Inhaltsbreite bleibt 1120px (kein Opt-in)`, async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(pfad);
      await page.waitForLoadState('domcontentloaded');
      expect(await inhaltsbreite(page)).toBe(1120);
    });
  }

  // U13 GILT AUCH BREITER: der Kopfkommentar von `e2e/startseite-blatt.e2e.ts`
  // (Test «U13 kein Scroll beim Aufklappen») deckt bewusst nur @1440×900 und
  // @1280×800 ab — Begründung dort: «ab 1280 ist der Inhalt auf `max-w-content`
  // gedeckelt … beide [1680/1920] haben mehr Höhe». Mit `weit` ab 2xl stimmt die
  // Breiten-Prämisse dort nicht mehr; dieser Fall schliesst genau diese Lücke,
  // für alle vier Kacheln (nicht nur Gesetze). ROT ZU BEKOMMEN (§6.7): den
  // `2xl:max-w-[13.5rem]`-Deckel an der Kantone-Karte (`GesetzeBlatt.tsx`)
  // entfernen — dann reisst «Gesetze» ab 1536px mit 38px Überlauf.
  for (const [breite, hoehe] of [[1680, 1050], [1920, 1080]] as const) {
    test(`@${breite}×${hoehe}: alle vier Blätter ohne Scroll im Fenster`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: hoehe });
      for (const name of ['Gesetze', 'Rechtsprechung', 'Materialien', 'Werkzeuge']) {
        await page.goto('/');
        await page.getByRole('navigation', { name: 'Bereiche der Sammlung' })
          .getByRole('button', { name: new RegExp(name) }).click();
        await expect(page.locator('#lm-start-blatt')).toHaveAttribute('data-phase', 'offen');
        const m = await page.evaluate(() => {
          const i = document.querySelector('.lc-start-blatt-inhalt')!;
          const b = document.querySelector('#lm-start-blatt')!.getBoundingClientRect();
          return { ueber: i.scrollHeight - i.clientHeight, unten: Math.round(b.bottom), vh: innerHeight, sy: Math.round(scrollY) };
        });
        expect(m.unten, `${name}: Blatt-Unterkante im Fenster (${JSON.stringify(m)})`).toBeLessThanOrEqual(m.vh);
        expect(m.sy, `${name}: Seite unverschoben`).toBe(0);
        expect(m.ueber, `${name}: kein Überlauf im Blatt-Inhalt (${JSON.stringify(m)})`).toBeLessThanOrEqual(1);
      }
    });
  }

  // (iii) Mit mehr Platz dürfen Kachel-Zeilen (Nutzen-/Teile-Zeile) nicht auf
  // eine unlesbare Länge auslaufen — Kachelbreite wächst @1680/@1920 von
  // 348px auf 508px (Messreihe im Kopfkommentar `Startseite.tsx`).
  // ROT ZU BEKOMMEN (§6.7): in `RubrikKachel.tsx` den `nutzen`-/`extra`-Slot
  // aus dem `flex-col` der Kachel lösen und ohne Breitendeckel neben die Zahl
  // stellen — dann läuft die «teile»-Zeile der Materialien-Kachel (aktuell
  // 72 ch @1920) über die Kachelbreite hinaus in eine einzige, sehr lange Zeile.
  test('@1920: keine Kachel-Textzeile über 75 Zeichen', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('.lc-start-zelle');
    const m = await messeMaxCharsProZeile(page, '.lc-start-zelle .text-body-s');
    expect(m, 'mindestens eine Nutzen-/Teile-Zeile gemessen').not.toBeNull();
    expect(m!.ch, `«${m!.text}»: ${m!.ch.toFixed(1)} ch`).toBeLessThanOrEqual(75);
  });

  // Häufig gebraucht liegt in derselben wachsenden Spalte (Auftrags-Bedingung
  // 3) — dieselbe Messmethode auf den Titel-Zeilen der Links.
  test('@1920: keine Zeile in «Häufig gebraucht» über 75 Zeichen', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('.lc-start-zelle');
    const m = await messeMaxCharsProZeile(page, 'a.lc-menu-zeile span.line-clamp-2');
    expect(m, 'mindestens eine Titel-Zeile gemessen').not.toBeNull();
    expect(m!.ch, `«${m!.text}»: ${m!.ch.toFixed(1)} ch`).toBeLessThanOrEqual(75);
  });
});
