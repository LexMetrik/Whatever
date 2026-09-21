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
import { test, expect, type Page } from '@playwright/test';

// ZPO 271 ist der Artikel, an dem die Dopplung gemessen wurde (D35-Untersuchung
// Teil 1d, Screenshot `d35-f-dopplung-kopf-bezuege.jpg`: 24 gegen 24) — und er
// führt neben den Entscheiden auch Verweise, also zwei unabhängig schaltbare
// Rubriken in EINER Zeile.
const ORT = '/gesetze/bund/ZPO#art-271';
const ART = '271';
const ZEILE = `#art-${ART} .lr7-bez`;

/** Der Erlass steht, und die Zähl-Datei hat die Funktionszeile gefüllt. */
async function oeffne(page: Page): Promise<void> {
  await page.goto(ORT);
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]`))
    .toHaveText(/\d+\s*Entscheide?/, { timeout: 20_000 });
}

/** Das «Ansicht ▾»-Menü aufziehen (es schliesst bei Aussenklick). */
async function menueAuf(page: Page): Promise<void> {
  await page.locator('[data-v3-ansicht]').first().click();
  await expect(page.locator('[data-v3-ansicht-menue]')).toBeVisible({ timeout: 10_000 });
}

test.describe('D35-F2 · Kopf-Entlastung und Rubriken-Wahl', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(a) genau EIN Ort nennt die Entscheid-Zahl dieses Artikels', async ({ page }) => {
    await oeffne(page);
    // Der Kopf-Griff steht — sonst prüfte die Summe unten eine leere Kopfzeile
    // (Positiv-Sonde §6.7).
    await expect(page.locator('[data-v3-panel-zaehler]')).toHaveCount(1);

    const imKopf = await page.locator('[data-v3-panel-anzahl]').count();
    const inDerZeile = await page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]:visible`).count();
    expect(imKopf + inDerZeile,
      `Entscheid-Zahl an ${imKopf + inDerZeile} Orten (Kopf ${imKopf}, Zeile ${inDerZeile}) — genau einer ist die Zusage`)
      .toBe(1);
    // … und der eine Ort ist die Zeile am Artikelende, nicht der Kopf.
    expect(inDerZeile, 'die Zahl steht nicht mehr am Artikel').toBe(1);

    // Der Kopf-Griff nennt auch SICHTBAR keine Zahl, und sein Accessible Name
    // ebenso wenig — eine Zahl, die nur ein Screenreader hört, wäre dieselbe
    // Dopplung eine Ebene tiefer (§8).
    const griff = page.locator('[data-v3-panel-zaehler]');
    expect(await griff.innerText(), 'der Kopf-Griff trägt wieder eine Zahl').not.toMatch(/\d/);
    expect(await griff.getAttribute('aria-label')).not.toMatch(/\d/);
    // Er heisst nach seiner Bezugsgrösse (Variante A: Kopf = Erlass).
    await expect(griff).toHaveText(/Erlass/);
  });

  test('(a) er öffnet weiterhin das Blatt — die Fläche ist nicht verloren', async ({ page }) => {
    await oeffne(page);
    await page.locator('[data-v3-panel-zaehler]').click();
    await expect(page.locator('[data-v3-panel]').first()).toBeVisible({ timeout: 20_000 });
    // Die drei ERLASS-weiten Reiter stehen, und «Entscheide» bleibt als Ziel.
    for (const reiter of ['entscheide', 'aenderungen', 'materialien', 'anwendung']) {
      await expect(page.locator(`[data-v3-panel-reiter="${reiter}"]`)).toHaveCount(1);
    }
  });

  test('(b) «im Blatt öffnen ›» in der aufgeklappten Rubrik führt zum Reiter Entscheide', async ({ page }) => {
    await oeffne(page);
    // Die Rubrik klappt weiterhin auf UND armiert (Entscheid: beides) …
    await page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]`).click();
    await expect(page.locator(`#art-${ART} .lr7-bez-block[data-reg="r"]`)).toBeVisible();
    // … und trägt zusätzlich den Sekundär-Griff.
    const nebenGriff = page.locator(`#art-${ART} [data-v3-bez-imblatt]`);
    await expect(nebenGriff).toHaveCount(1);
    await nebenGriff.click();
    await expect(page.locator('[data-v3-panel]').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-v3-panel-reiter="entscheide"]'))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('(b) eine einzeln abgewählte Rubrik verliert Zähler UND Inhalt', async ({ page }) => {
    await oeffne(page);
    // Vorher: beide Rubriken stehen (Positiv-Sonde — sonst prüfte der Fall nichts).
    await expect(page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]`)).toBeVisible();
    await expect(page.locator(`#art-${ART} .lr7-bez-marke[data-reg="g"]`)).toBeVisible();
    // Die Rubrik «Entscheide» aufklappen, damit auch ihr BLOCK im Bild ist.
    await page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]`).click();
    await expect(page.locator(`#art-${ART} .lr7-bez-block[data-reg="r"]`)).toBeVisible();

    await menueAuf(page);
    const schalter = page.locator('[data-v3-fussrubrik="r"]');
    await expect(schalter, 'der Schalter steht nicht als «an» da').toHaveAttribute('aria-checked', 'true');
    await schalter.click();
    await expect(schalter).toHaveAttribute('aria-checked', 'false');

    // Zähler weg UND Inhalt weg — beides, nicht eines von beiden (M-6).
    await expect(page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]`)).toBeHidden();
    await expect(page.locator(`#art-${ART} .lr7-bez-block[data-reg="r"]`)).toBeHidden();
    // Die NACHBARN bleiben unberührt — «alles einzelne» heisst einzeln.
    await expect(page.locator(`#art-${ART} .lr7-bez-marke[data-reg="g"]`)).toBeVisible();
    await expect(page.locator(`#art-${ART} .lr7-bez-aktionen`).first()).toBeVisible();
  });

  // ── §6.3-DEKLARATION (W2·26/Z1, Mandat David 11.9.2026) ───────────────────
  // Hier stand «das Wort ‹Bezüge› steht nur, solange es etwas benennt» — die
  // Sonde zum BEFUND vom 7.9.2026 (Bild `d35-f2-c`): ZPO Art. 272 führt genau
  // eine Rubrik, und nach deren Abwahl stand «Bezüge» allein neben den
  // Aktionen, eine Überschrift über nichts (§8). Der Befund und die Regel, die
  // er erzwang, waren richtig — für ihren Stand (§0 Ziff. 2b).
  //
  // DAS WORT GIBT ES SEIT W2·26 NICHT MEHR: es benannte vier Marken, die ihren
  // Gegenstand schon im Wort tragen. Mit dem Wort fällt die Regel, und mit der
  // Regel diese Sonde — was nicht mehr scheitern kann, wird gestrichen statt
  // bewacht (§17-Gegengewicht). An ihre Stelle tritt die UMGEKEHRTE Zusage: das
  // Wort ist wirklich weg, und die Auskunft, die es gebraucht hat, steht weiter
  // maschinenlesbar am Element.
  test('(b) W2·26/Z1: das Wort «Bezüge» ist fort, `data-bez-marken` bleibt', async ({ page }) => {
    await oeffne(page);
    // Nirgends im Leser, nicht nur an diesem Artikel — eine verbliebene Stelle
    // wäre die zweite Wahrheit, die Z1 gerade abräumt (§5).
    await expect(page.locator('.lc-leser .lr7-bez-wort')).toHaveCount(0);
    await expect(page.locator(ZEILE)).not.toContainText('Bezüge');
    // Die Auskunft «welche Rubriken führt dieser Artikel» bleibt: ZPO Art. 272
    // führt genau eine, und es ist «Entscheide» (dieselbe Vorbedingung, die der
    // gestrichene Fall benutzt hat).
    await expect(page.locator('#art-272 .lr7-bez')).toHaveAttribute('data-bez-marken', 'r');
  });

  test('(b) auch die Aktionsgruppe ist eine Rubrik', async ({ page }) => {
    await oeffne(page);
    // W2·26/Z6 (§6.3, fachlich): die Aktionen werden erst gerendert, wenn der
    // Artikel Hover/Fokus hat oder eine Rubrik offen ist. Hier wird eine Rubrik
    // GEÖFFNET statt gehovert — der Zustand überlebt den Weg zum Ansicht-Menü,
    // eine Mausposition nicht, und ein `toBeHidden()` auf ein Element, das
    // inzwischen aus einem anderen Grund fehlt, wäre ein Tor ohne Aussage
    // (§6.7). Die ZUSAGE des Falls ist unverändert: der Schalter «Aktionen»
    // nimmt die Gruppe, die Rubrik-Griffe bleiben.
    await page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]`).click();
    await expect(page.locator(`#art-${ART} .lr7-bez-aktionen`).first()).toBeVisible();
    await menueAuf(page);
    await page.locator('[data-v3-fussrubrik="a"]').click();
    await expect(page.locator(`#art-${ART} .lr7-bez-aktionen`).first()).toBeHidden();
    // Die Rubriken-Griffe stehen weiter — die Zeile ist nicht mitgegangen.
    await expect(page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]`)).toBeVisible();
  });

  test('(b) alles abgewählt ⇒ die Zeile verschwindet ganz; «Alles zeigen» holt sie zurück', async ({ page }) => {
    await oeffne(page);
    await expect(page.locator(ZEILE)).toBeVisible();
    await menueAuf(page);
    const alle = page.locator('[data-v3-fussrubriken-alle]');
    await expect(alle).toHaveAttribute('data-v3-fussrubriken-alle', 'aus');
    await alle.click();

    // Die Zeile selbst ist weg — samt Trennlinie und Abstand.
    await expect(page.locator(ZEILE)).toBeHidden();
    // Und der Gesetzestext steht unverändert da (§1: die Wahl ist Darstellung,
    // kein Inhaltsverlust).
    await expect(page.locator(`#art-${ART}`)).toBeVisible();

    // Der Rückweg ist dieselbe Zeile — sie heisst jetzt anders.
    await expect(page.locator('[data-v3-fussrubriken-alle]'))
      .toHaveAttribute('data-v3-fussrubriken-alle', 'an');
    await page.locator('[data-v3-fussrubriken-alle]').click();
    await expect(page.locator(ZEILE)).toBeVisible();
    await expect(page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]`)).toBeVisible();
  });

  test('(b) die Wahl überlebt den Reload — sie ist eine Einstellung, keine Laune', async ({ page }) => {
    await oeffne(page);
    await menueAuf(page);
    await page.locator('[data-v3-fussrubrik="g"]').click();
    await expect(page.locator(`#art-${ART} .lr7-bez-marke[data-reg="g"]`)).toBeHidden();

    await page.reload();
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]`))
      .toBeVisible({ timeout: 20_000 });
    // Die abgewählte Rubrik bleibt abgewählt, und zwar OHNE Flackern: das
    // Attribut steht vor dem ersten Paint (`wendeLeserOptionenAn` in main.tsx).
    await expect(page.locator(`#art-${ART} .lr7-bez-marke[data-reg="g"]`)).toBeHidden();
    expect(await page.locator('html').getAttribute('data-fuss-aus')).toBe('g');
    // Und das Menü zeigt denselben Stand — sonst wären es zwei Wahrheiten (§5).
    await menueAuf(page);
    await expect(page.locator('[data-v3-fussrubrik="g"]')).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator('[data-v3-fussrubrik="r"]')).toHaveAttribute('aria-checked', 'true');
  });

  test('(b) der Grundzustand emittiert kein Attribut mit Inhalt (byte-gleicher Ist-Stand)', async ({ page }) => {
    await oeffne(page);
    // Leerer Wert = «nichts abgewählt» ⇒ keine einzige CSS-Regel greift.
    expect(await page.locator('html').getAttribute('data-fuss-aus')).toBe('');
  });
});
