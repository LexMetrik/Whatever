// @shard-gruppe: 2
// ── W2·24-D34 · DIE BEZÜGE-ZEILE STEHT AM ARTIKELENDE ───────────────────────
//
// AUFTRAG David 7.9.2026, wörtlich: «das mit den bezügen soll unten an den
// artikel und nicht direkt nach der artikel nummer».
//
// Bis D33 sass die Zeile «Bezüge · 11 Entscheide · 1 Rechner ›» in der
// Breitform DIREKT unter der Artikelnummer — zwischen der Überschrift und dem
// Wortlaut, den sie überschreibt. Sie steht jetzt am FUSS: unter dem letzten
// Absatz und unter dem Fussnoten-Apparat, vor dem nächsten Artikel.
//
// VIER ZUSAGEN, je einzeln messbar:
//  (a) ORT — die Zeile liegt UNTER dem letzten Absatz des Artikels (und unter
//      dem Fussnoten-Apparat, wo einer steht) und noch INNERHALB des Artikels,
//      also VOR dem nächsten. Das ist Davids Satz, in Pixeln.
//  (b) NICHT MEHR AM KOPF — zwischen Artikelnummer und erstem Absatz liegt
//      keine Bezüge-Zeile mehr. Ohne (b) wäre (a) auch mit einer ZWEITEN Zeile
//      am Fuss erfüllt.
//  (c) EIN BAUSTEIN FÜR BEIDE FORMEN — @390 (Zeilenform) steht dieselbe EINE
//      Zeile am selben Ort. Bis D33 hatte die schmale Form einen eigenen,
//      anders gestalteten Artikelfuss (offene Verweis-Chips + unbedingte
//      Rechtsprechungs-Zeile): zwei Gestalten für einen Fachinhalt (§5).
//  (d) DIE TRENNLINIE — die Zeile trägt oben eine feine Linie (Linien statt
//      Flächen, F0.6). Am Kopf brauchte sie keine, am Fuss klebte sie ohne sie
//      am Fliesstext, den sie nicht fortsetzt.
//
// ROT ZU BEKOMMEN (§6.7), belegt in `abnahme/design-identitaet/R6J-BEZUEGE-FUSS.md`:
//  · in `parts/ArtikelLeser.tsx` den `<ArtikelBezuegeFuss …>` wieder VOR den
//    `{artOffen && (…)}`-Block ziehen (= die Kopf-Position von D33)
//        ⇒ (a) rot @1440 und @390, (b) rot
//  · in `src/index.css` `border-top` an `.lr7-bez` löschen ⇒ (d) rot
import { test, expect, type Page } from '@playwright/test';

const ART = '336_c';

/** Unterkante des letzten sichtbaren Wortlaut-Absatzes dieses Artikels. */
async function fussDesWortlauts(page: Page): Promise<number> {
  return page.evaluate((art) => {
    const a = document.querySelector(`#art-${art}`);
    if (!a) throw new Error(`Artikel ${art} nicht im DOM`);
    // Der Wortlaut steht in der Lesespalte (`.max-w-normtext`); der
    // Fussnoten-Apparat (`[data-fn-apparat]`) und die Beiwerk-Zone folgen ihm.
    // Gemessen wird die UNTERSTE Kante von beidem — die Bezüge-Zeile muss unter
    // ALLEM liegen, was zum Artikel gehört, nicht nur unter dem Fliesstext.
    const teile = [...a.querySelectorAll('.max-w-normtext, [data-fn-apparat], [data-beiwerk]')];
    const unten = teile
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.height > 0)
      .map((r) => r.bottom);
    if (unten.length === 0) throw new Error(`Artikel ${art} zeigt keinen Wortlaut`);
    return Math.max(...unten);
  }, ART);
}

/** Geometrie der Bezüge-Zeile + der Artikelnummer + des nächsten Artikels. */
async function lage(page: Page) {
  return page.evaluate((art) => {
    const a = document.querySelector(`#art-${art}`)!;
    const bez = a.querySelector('.lr7-bez');
    if (!bez) throw new Error(`keine Bezüge-Zeile an Art. ${art}`);
    const artikel = [...document.querySelectorAll('article[id^="art-"]')];
    const idx = artikel.indexOf(a as HTMLElement);
    const naechster = artikel[idx + 1]?.getBoundingClientRect().top ?? Infinity;
    // Die Artikelnummer selbst («Art. 336c») — Anker ODER Treffer-Knopf.
    const nummer = a.querySelector(`a[href$="#art-${art}"], button`)!.getBoundingClientRect();
    const stil = getComputedStyle(bez);
    return {
      anzahl: a.querySelectorAll('.lr7-bez').length,
      bezOben: bez.getBoundingClientRect().top,
      bezUnten: bez.getBoundingClientRect().bottom,
      nummerUnten: nummer.bottom,
      naechsterOben: naechster,
      linieOben: stil.borderTopWidth,
      linieFarbe: stil.borderTopColor,
    };
  }, ART);
}

async function oeffne(page: Page): Promise<void> {
  await page.goto(`/gesetze/bund/OR#art-${ART}`);
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
  // Die Zähl-Datei kommt im Leerlauf; erst mit ihr steht die Zeile überhaupt da.
  await expect(page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]`))
    .toHaveText(/\d+\s*Entscheide?/, { timeout: 20_000 });
}

test.describe('D34 · die Bezüge-Zeile steht am Artikelende', () => {
  test('(a)+(b)+(d) @1440: unter dem letzten Absatz, nicht unter der Artikelnummer', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await oeffne(page);
    const wortlautUnten = await fussDesWortlauts(page);
    const l = await lage(page);

    // (b) GENAU EINE Zeile am Artikel — kein zweiter Ort daneben (§5).
    expect(l.anzahl, `Art. ${ART} trägt ${l.anzahl} Bezüge-Zeilen`).toBe(1);

    // (a) UNTER dem Wortlaut. `-1` als Rundungs-Spielraum der Sub-Pixel-Kanten;
    // der Ist-Fehler (Kopf-Position) liegt hunderte Pixel darüber, nicht eines.
    expect(l.bezOben, `Bezüge-Zeile bei y=${l.bezOben}, Wortlaut endet bei y=${wortlautUnten}`)
      .toBeGreaterThanOrEqual(wortlautUnten - 1);

    // (a) und NOCH IM ARTIKEL — vor dem nächsten.
    expect(l.bezUnten, `Bezüge-Zeile endet bei y=${l.bezUnten}, nächster Artikel beginnt bei y=${l.naechsterOben}`)
      .toBeLessThanOrEqual(l.naechsterOben + 1);

    // (b) NICHT direkt nach der Artikelnummer — Davids Satz, negativ gemessen.
    // Zwischen Nummer und Zeile MUSS der Wortlaut liegen; die Zeile sitzt damit
    // deutlich tiefer als eine Zeilenhöhe unter der Nummer.
    expect(l.bezOben - l.nummerUnten,
      `nur ${Math.round(l.bezOben - l.nummerUnten)} px zwischen Artikelnummer und Bezüge-Zeile — sie klebt wieder am Kopf`)
      .toBeGreaterThan(48);

    // (d) Die feine Trennlinie über der Zeile.
    expect(l.linieOben, 'die Bezüge-Zeile trägt keine Trennlinie nach oben').not.toBe('0px');
    expect(l.linieFarbe, 'die Trennlinie ist unsichtbar (transparent)').not.toMatch(/rgba\(0, 0, 0, 0\)/);
  });

  test('(c) @390: dieselbe EINE Zeile am selben Ort — ein Fuss-Baustein für beide Formen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await oeffne(page);
    const wortlautUnten = await fussDesWortlauts(page);
    const l = await lage(page);
    expect(l.anzahl, `Art. ${ART} trägt @390 ${l.anzahl} Bezüge-Zeilen`).toBe(1);
    expect(l.bezOben, `@390 Bezüge-Zeile bei y=${l.bezOben}, Wortlaut endet bei y=${wortlautUnten}`)
      .toBeGreaterThanOrEqual(wortlautUnten - 1);
    expect(l.bezUnten, `@390 Bezüge-Zeile endet bei y=${l.bezUnten}, nächster Artikel beginnt bei y=${l.naechsterOben}`)
      .toBeLessThanOrEqual(l.naechsterOben + 1);
    // Und die Zeile ist dieselbe: Registerfarben-Marken statt der alten,
    // offenen Chip-Reihe der Zeilenform (die es nicht mehr gibt).
    await expect(page.locator(`#art-${ART} .lr7-bez-marke`).first()).toBeVisible();
  });
});

// ── W2·24-D34/2 · DER NACHZUG GIBT DEN SCROLL AB ────────────────────────────
//
// Der Bezüge-Fuss (oben) hat einen zweiten Bau nach sich gezogen: weil die
// Zeile am Artikel-ENDE zwischen Scroll-Anker und Tieflink-Ziel wächst, zieht
// der Tieflink-Sprung nach, wenn sie nachrendert (`inhalt-hooks-tieflink.tsx`).
// Dieser Nachzug ist die Kehrseite derselben Design-Entscheidung und wird
// darum hier bewacht, nicht in einer eigenen Datei.
//
// ZWEI ZUSAGEN, gegenläufig — die eine ohne die andere ist wertlos:
//  (e) ABGABE — sobald ein FREMDER Scroll das Ziel aus dem Bild trägt, hört der
//      Nachzug auf. Sonst reisst er die Leseposition zurück, und jeder Weg, der
//      von einem Tieflink wegführt, endet wieder am Tieflink.
//  (f) UND ER GREIFT WEITERHIN — ein frischer Tieflink steht nach dem
//      Nachrendern der Bezüge-Zeilen immer noch am Landepunkt. Ohne (f) wäre
//      (e) auch mit einem komplett abgeschalteten Nachzug erfüllt.
//
// ROT ZU BEKOMMEN (§6.7):
//  · in `inhalt-hooks-tieflink.tsx` die Abgabe-Zeile («Ziel ausserhalb des
//    Bildes ⇒ der Scroll gehört jemand anderem») löschen ⇒ (e) 3/3 rot
//    (= Stand c79e8e067; Art. 5 nach dem Wegscrollen wieder ausserhalb)
//  · dort in `nachziehen` ein `if (aufgedeckt) { beende(); return; }` an den
//    Kopf setzen (= Stand VOR c79e8e067, ohne Nachzug) ⇒ (f) 3/3 rot,
//    Art. 8 bei y=203 statt am Landepunkt 154 — die 49 px der Bezüge-Zeile
// Beide Proben je einzeln gemessen, Protokoll `R6J-BEZUEGE-FUSS.md` §10.
//
// Der Rückweg per Browser-Zurück mit stehendem #hash braucht hier KEINE eigene
// Sonde: dort läuft der Effekt gar nicht erst an (`istHashVerbraucht()`), und
// `e2e/leser-history-hash.e2e.ts` (LM-199) misst genau diesen Fall.
test.describe('W2·24-D34/2 — Nachzug des Tieflink-Sprungs', () => {
  test('(e) fremder Scroll gewinnt: nach dem Wegscrollen bleibt man weg', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 900 });
    // AIG#art-90 ist der Tieflink der LM-199-Sonde — ~92'000 px vom Art. 5 weg,
    // die Bewegung ist also unverwechselbar.
    await page.goto('/gesetze/bund/AIG#art-90');
    await expect(page.locator('#art-90')).toBeInViewport({ timeout: 20000 });
    // PROGRAMMATISCH wegscrollen — kein wheel/keydown/pointerdown. Genau das
    // ist der Fall, den die vier Übernahme-Ereignisse nicht sehen: derselbe
    // Weg, den Playwright, die A16-Konvergenzschleife und jedes `scrollTo`
    // eines anderen Bausteins nehmen.
    await page.locator('#art-5').scrollIntoViewIfNeeded();
    // Länger als der Nachzug-Deckel (NACHZUG_MS 4000): war die Abgabe nicht da,
    // steht man in diesem Fenster längst wieder an Art. 90.
    await page.waitForTimeout(1500);
    await expect(page.locator('#art-5')).toBeInViewport();
    await expect(page.locator('#art-90')).not.toBeInViewport();
  });

  test('(f) frischer Tieflink: das Ziel steht nach dem Nachrendern am Landepunkt', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 900 });
    // BV#art-8 ist der Fall aus dem D34-Befund: vor dem Eintreffen der
    // Zähl-Datei führt bei der BV kein Artikel eine Bezüge-Zeile, danach 145 —
    // sieben davon oberhalb des Ziels.
    await page.goto('/gesetze/bund/BV#art-8');
    await expect(page.locator('#art-8')).toBeInViewport({ timeout: 20000 });
    // Nach dem Nachrendern messen, nicht davor: der gemessene Verzug lag bei
    // 1053 bzw. 1665 ms nach dem Aufdecken.
    await page.waitForTimeout(2500);
    const m = await page.evaluate(() => {
      const el = document.getElementById('art-8')!;
      return {
        oben: Math.round(el.getBoundingClientRect().top),
        landepunkt: Math.round(parseFloat(getComputedStyle(el).scrollMarginTop)),
        bezuege: document.querySelectorAll('.lr7-bez').length,
      };
    });
    expect(m.bezuege, 'keine Bezüge-Zeile im Dokument — der Fall ist gar nicht eingetreten')
      .toBeGreaterThan(0);
    expect(Math.abs(m.oben - m.landepunkt),
      `Art. 8 steht bei y=${m.oben}, Landepunkt ist ${m.landepunkt} — der Nachzug hat nicht gegriffen`)
      .toBeLessThanOrEqual(2);
  });
});
