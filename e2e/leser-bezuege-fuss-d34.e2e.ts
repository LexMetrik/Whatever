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
// ═══ §6.3-DEKLARATION · S6 W1f (Entscheid David 24.9.2026) ══════════════════
// Wörtlich: «die zeile soll ganz weg. infos sollen alle im blatt erscheinen».
// Die Fälle (a)–(d) prüften Ort und Linie der Bezüge-Zeile am Artikelende —
// die Zeile ist gefallen, die Fälle mit ihr (am Artikel steht nur noch die
// ruhige Aktionszeile, ihre Lage prüft `leser-breite-a37.e2e.ts`). Der Block
// D34/2 (Nachzug des Tieflink-Sprungs) bleibt: er bewacht den Sprung, nicht
// die Zeile; nur sein Leer-Treffer-Schutz in (f) zeigt jetzt auf die
// Aktionszeile, die als einziges Beiwerk nachrendert.
import { test, expect } from '@playwright/test';

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
        // S6 W1f: bis 24.9.2026 `.lr7-bez` (Bezüge-Zeile) — gefallen.
        beiwerk: document.querySelectorAll('[data-artikel-aktionen]').length,
      };
    });
    expect(m.beiwerk, 'keine Aktionszeile im Dokument — der Fall ist gar nicht eingetreten')
      .toBeGreaterThan(0);
    expect(Math.abs(m.oben - m.landepunkt),
      `Art. 8 steht bei y=${m.oben}, Landepunkt ist ${m.landepunkt} — der Nachzug hat nicht gegriffen`)
      .toBeLessThanOrEqual(2);
  });
});
