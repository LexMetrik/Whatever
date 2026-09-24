// @shard-gruppe: 5
// ═══ W2·24 · D35-F2 — DER KOPF ZÄHLT NICHT MEHR, DAS MENÜ WÄHLT AB ══════════
//
// ENTSCHEID David 7.9.2026: Variante A des D35-Vorschlags, mit dem Nachtrag
// «man soll mittels ansicht alles einzelne abwählen können».
//
// ZWEI ZUSAGEN, je einzeln messbar:
//
//  (a) GENAU EIN ORT NENNT DIE ENTSCHEID-ZAHL JE ARTIKEL. Das ist die Dopplung
//      D-1 der D35-Untersuchung, gemessen 7.9.2026 auf EINEM Bildschirm: ZPO
//      Art. 271 trug im Kopf «⚖ Rechtsprechung 24» und zwei Zentimeter darunter
//      «24 Entscheide» — dieselbe Zahl aus derselben Quelle an zwei Orten
//      (§5/§8). Die Sonde ZÄHLT die Orte, statt eine Beschriftung zu
//      vergleichen: `[data-v3-panel-anzahl]` (Kopf) + die sichtbare Rubrik-Marke
//      `.lr7-bez-marke[data-reg="r"]` des gelesenen Artikels müssen zusammen
//      GENAU EINS ergeben. Damit ist die Zusage auch dann geprüft, wenn eine
//      künftige Fassung die Zahl an einen dritten Ort schriebe — «genau einer»
//      ist die Aussage, nicht «nicht im Kopf».
//
//  (b) JEDE RUBRIK EINZELN ABWÄHLBAR. Zähler UND Inhalt verschwinden (eine
//      Rubrik ohne Griff, deren Block bliebe, wäre ein Block ohne Weg zurück;
//      ein Griff ohne Block wäre die Zusage einer Liste, die nicht kommt —
//      genau der M-6-Mangel vom 7.9.2026). Sind ALLE abgewählt, geht die Zeile
//      selbst samt Trennlinie. Die Wahl überlebt einen Reload, und «Alles
//      zeigen» ist der Rückweg auf derselben Menü-Zeile.
//
// ROT ZU BEKOMMEN (§6.7), je einzeln gefahren und in
// `abnahme/design-identitaet/D35-F2-KOPF.md` protokolliert:
//  · in `v3/LeserPanelOeffner.tsx` dem Griff wieder ein
//    `data-v3-panel-anzahl={11}` geben (= der Kopf-Zähler vor D35-F2) ⇒ (a) rot
//  · in `src/index.css` den Regelblock `html[data-fuss-aus*="…"]` löschen
//    (= die Wahl im Menü ohne Wirkung)                              ⇒ (b) rot
//  · in `leserOptionen.ts` `fussAusWert` das Komplement weglassen und
//    `gewaehlt.join('')` zurückgeben (= vertauschte Polarität)      ⇒ (b) rot
// ═══ §6.3-DEKLARATION · S6 W1f (Entscheid David 24.9.2026) ═════════════════
// Wörtlich: «also blatt teil soll raus. verweise soll auch in blatt. und die
// zeile soll ganz weg. infos sollen alle im blatt erscheinen.» Die
// Funktionszeile und mit ihr die Rubriken-Wahl im Ansicht-Menü sind gefallen.
//  (a) bleibt und wird enger: die Entscheid-Zahl steht an KEINEM Ort am
//      Artikel und nicht im Kopf — die Entscheide dieses Artikels stehen im
//      Reiter «Entscheide» des Blatts (dort zählt der Gruppenkopf). Der Griff
//      öffnet weiterhin das Blatt.
//  (b) ist gestrichen — alle sieben Fälle prüften die Rubriken-Wahl oder den
//      Neben-Griff «im Erlass-Blatt öffnen ›» der Zeile; beides gibt es nicht
//      mehr. Dass das Menü keine Rubriken-Schalter mehr trägt, prüfen
//      `leser-optionen.e2e.ts` und `w224-d35-f3-vermerke.e2e.ts`.
import { test, expect, type Page } from '@playwright/test';
import { blattFuerArtikel, blattReiter } from './helpers/fassungsRubrik';

// ZPO 271 ist der Artikel, an dem die Dopplung gemessen wurde (D35-Untersuchung
// Teil 1d, Screenshot `d35-f-dopplung-kopf-bezuege.jpg`: 24 gegen 24).
const ORT = '/gesetze/bund/ZPO#art-271';
const ART = '271';

/** Der Erlass steht. */
async function oeffne(page: Page): Promise<void> {
  await page.goto(ORT);
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(`#art-${ART}`)).toBeVisible({ timeout: 20_000 });
}

test.describe('D35-F2 · Kopf-Entlastung (seit S6 W1f: die Zahl steht im Blatt)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(a) weder Kopf noch Artikel nennen die Entscheid-Zahl — das Blatt zeigt die Entscheide', async ({ page }) => {
    await oeffne(page);
    // Der Kopf-Griff steht — sonst prüfte die Summe unten eine leere Kopfzeile
    // (Positiv-Sonde §6.7).
    await expect(page.locator('[data-v3-panel-zaehler]')).toHaveCount(1);
    await page.waitForTimeout(800);

    const imKopf = await page.locator('[data-v3-panel-anzahl]').count();
    const amArtikel = await page.locator(`#art-${ART} .lr7-bez-marke, #art-${ART} [data-bez-marken]`).count();
    expect(imKopf, 'der Kopf nennt wieder eine Entscheid-Zahl').toBe(0);
    expect(amArtikel, 'am Artikel steht wieder eine Rubrik (Funktionszeile)').toBe(0);

    // Der Kopf-Griff nennt auch SICHTBAR keine Zahl, und sein Accessible Name
    // ebenso wenig — eine Zahl, die nur ein Screenreader hört, wäre dieselbe
    // Dopplung eine Ebene tiefer (§8).
    const griff = page.locator('[data-v3-panel-zaehler]');
    expect(await griff.innerText(), 'der Kopf-Griff trägt wieder eine Zahl').not.toMatch(/\d/);
    expect(await griff.getAttribute('aria-label')).not.toMatch(/\d/);
    await expect(griff).toHaveText(/Erlass/);

    // Positiv (§6.7): das Blatt folgt Art. 271 und zeigt seine Entscheide.
    await blattFuerArtikel(page.locator(`#art-${ART}`), 20_000);
    await blattReiter(page, 'entscheide');
    await expect(page.locator('[data-v3-panel] [role="tabpanel"] a[href^="/rechtsprechung/"]').first())
      .toBeVisible({ timeout: 30_000 });
  });

  test('(a) er öffnet weiterhin das Blatt — die Fläche ist nicht verloren', async ({ page }) => {
    await oeffne(page);
    await page.locator('[data-v3-panel-zaehler]').click();
    await expect(page.locator('[data-v3-panel]').first()).toBeVisible({ timeout: 20_000 });
    // S6 (23.9.2026, deklariert §6.3): fünf Reiter nach Entscheid David AN-11.
    for (const reiter of ['entscheide', 'aenderungen', 'materialien', 'erlaeuterungen', 'werkzeuge']) {
      await expect(page.locator(`[data-v3-panel-reiter="${reiter}"]`)).toHaveCount(1);
    }
  });
});
