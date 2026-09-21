// @shard-gruppe: 1
// LESER-SCHRIFTSKALA — David-Anmerkung 16.8.2026, Punkt 4:
// «Schriftgrössen-Regler wirkt auf die ganze Seite.»
//
// BEFUND (gemessen 16.8.2026 im Leser der StPO, Vite-Dev, 1440×900): der Regler
// im V3-Optionsmenü bediente den GLOBALEN App-Steller, der `font-size` am
// `<html>` setzt. Drei Klicks «A+» hoben `<html>` von 16 px auf 20.8 px — und
// mit ihm die Kopfzeile (16 px → 20.8 px), weil alle Typo-Tokens rem-basiert
// sind. Der Nutzer wollte den Gesetzestext grösser, bekam die ganze Anwendung.
//
// Diese Spec ist der Abnahmetest der Umkehr: der Regler schreibt jetzt in die
// leser-eigene Stufe (`schrift` im geteilten Store `lm.leser.optionen`,
// leserOptionen.ts), und die einzige CSS-Regel, die sie auswertet, ist auf den
// Normtext der Lesespalte gescopt (`.lc-leser .nt-art-cv`, index.css).
//
// WARUM IM BROWSER: dass NUR der Normtext wächst, ist eine Aussage über
// gerechnete Schriftgrössen im echten Kaskaden-Kontext. Ein Unit-Test kann den
// Store prüfen (`src/tests/leser-schriftskala.test.ts`), aber nie, ob die Regel
// die Kopfzeile mit erwischt. Darum wird hier `getComputedStyle(...).fontSize`
// an einem NORMTEXT-Element UND an Kopfzeile/Seitenleiste vorher/nachher
// gemessen — genau die Grössen, die der Befund auseinanderhält.
//
// ROT ZU BEKOMMEN (§6.7): in `index.css` den Scope der Regel von
// `.lc-leser[data-leser-v3="rahmen"] .nt-art-cv [data-lese]` auf `html` verkürzen
// (Fall a und b werden rot: Kopf und Seitenleiste wachsen mit) oder in
// `leserSchrift.ts` `setzeLeserSchrift` aus `groesser` entfernen (Fall a rot:
// nichts wächst).
//
// ── S2 · DEKLARIERTE FACHLICHE ÄNDERUNG (§6.3, kein Refactoring) ─────────────
// Zwei Dinge sind mit S2 nachgezogen, beide als Folge von Entscheiden:
//  ① DER SELEKTOR. Der Normtext wurde über die Utility-Klasse `.text-body-l`
//     gegriffen. F3 = V2 (David 17.8.2026 am Bildbogen) tauscht die
//     Fliesstext-Stufe auf `text-leser-text` — die Spec wartete danach 90 s auf
//     ein Element, das es nicht mehr gibt (genau so gesehen, dreimal:
//     «Test timeout … waiting for locator('#art-1 .text-body-l')»). Sie greift
//     jetzt `[data-lese]`, dasselbe Daten-Attribut, an dem auch die CSS-Regel
//     hängt — ein Vertrag statt eines Utility-Namens, die Lehre des A-1-Wurzelfix.
//  ② DIE STUFENWERTE. Die Skala lag auf 18/20/22/24 px (absolute rem-Werte);
//     A-1 zieht sie auf die Faktoren der Design-Grundlage Kap. 2.3
//     ([1.0, 1.08, 1.18, 1.3], Entscheid D-A) über der Basis `leser-text`
//     (S2: 1.0625 rem; seit R6c 1.125 rem). Erwartet sind darum die vier Werte
//     in `STUFEN_PX` unten. Dass
//     diese Werte zu `SCHRIFT_REM` und zu `tailwind.config.js` passen, bewacht
//     `src/tests/leser-schriftskala.test.ts` — hier zählt die gerenderte Wirkung.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

/**
 * Die vier Stufen in gerechneten Pixeln bei 16-px-Wurzel (S2 · A-1):
 * 1.125 · 1.215 · 1.3275 · 1.4625 rem. Bruchwerte sind gewollt — sie sind das
 * Produkt der Grundlagen-FAKTOREN, nicht handgesetzte Rundwerte.
 */
// §6.3-DEKLARATION (W2·24-R6c, 6.9.2026): die vier Zahlen wandern von
// 17 / 18.36 / 20.06 / 22.1 auf 18 / 19.44 / 21.24 / 23.4 px. Nicht der Regler
// hat sich geändert, sondern seine BASIS — D20 (c) hebt `leser-text` auf
// 1.125 rem. Die Faktoren [1.0, 1.08, 1.18, 1.3] und damit die Anzeigewerte
// 100 · 108 · 118 · 130 % sind unverändert; die Zusage dieses Falls («die
// Treppe trifft exakt diese vier Werte, und Kopf/Leiste rühren sich nie»)
// bleibt Wort für Wort dieselbe.
const STUFEN_PX = [18, 19.44, 21.24, 23.4] as const

/** Der Normtext selbst — der Fliesstext-Container von Art. 1, nicht die
 *  Überschrift und nicht der Fussnoten-Apparat. */
const normtext = (page: Page) => page.locator('#art-1 [data-lese]').first()
const kopf = (page: Page) => page.locator('[data-v3-kopf]')
const leiste = (page: Page) => page.locator('[data-v3-aside]')
// Ä9 (Ästhetik-Review H1) BISS HIER — mit H2b ist die Ursache behoben.
// VORGESCHICHTE: «Schrift vergrössern»/«Schrift verkleinern» gab es ZWEIMAL mit
// identischem Namen — in der App-Leiste (`components/layout/Topbar.tsx`, global,
// WCAG 1.4.4) und im Ansicht-Menü des Lesers (`v3/LeserAnsichtV3.tsx`, nur
// Normtext). Ein `getByRole`-Treffer ohne Bezugsraum erwischte @1440 den
// APP-Regler; der Rückweg dieser Spec bediente dann einen anderen Steller als der
// Hinweg und schrieb den Fehlschlag dem falschen zu (gefunden 16.8.2026, als der
// Hinweg zum ersten Mal überhaupt bis zum Rückweg durchlief).
// H2b: der Leser-Regler heisst «Gesetzestext vergrössern/verkleinern» — beide
// Namen kommen im Dokument je genau einmal vor (gemessen 17.8.2026:
// `[role=group][aria-label="Schriftgrösse"]` bleibt bei 1, auch mit offenem
// Panel; vorher 2).
// NACHGEFÜHRT 29.8.2026 (Entscheid David 5B, Design-Review C4): die
// GRUPPEN-Namen heissen seither «Grösse nur des Gesetzestexts» (Leser) und
// «Schriftgrösse der ganzen Seite» (Topbar), und beide Regler tragen ihren
// Scope zusätzlich SICHTBAR («Nur Gesetzestext» / «Ganze Seite»). Die
// KNOPF-Namen, an denen diese Spec hängt, sind unverändert — die Zusicherung
// hier ist dieselbe geblieben (§6.3), nur ihr Umfeld ist eindeutiger geworden.
// DER PANEL-SCOPE BLEIBT: er sagt zusätzlich aus, dass der Regler DORT steht
// (Ä9: «im Leser nur EIN Regler, und zwar im Ansicht-Menü»). Ein eindeutiger Name
// allein bewiese den Ort nicht — der Test ist damit schärfer, nicht lockerer.
const panel = (page: Page) => page.locator('[data-v3-ansicht-panel]')
const groesser = (page: Page) => panel(page).getByRole('button', { name: 'Gesetzestext vergrössern' })
const kleiner = (page: Page) => panel(page).getByRole('button', { name: 'Gesetzestext verkleinern' })

async function schriftgroesse(wahl: ReturnType<typeof normtext>): Promise<number> {
  return wahl.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
}

/** Schriftgrösse des Wurzelelements — der direkte Zeuge des Befunds: genau hier
 *  griff der alte Regler, und genau hier darf sich jetzt nichts mehr rühren. */
async function wurzelGroesse(page: Page): Promise<number> {
  return page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))
}

async function oeffneStPO(page: Page): Promise<string[]> {
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/STPO')
  await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
  // Das Optionsmenü steht im Ist-Stand offen; sollte es zugeklappt starten,
  // wird es über den Ansicht-Knopf aufgezogen. Bewusst defensiv statt fest
  // verdrahtet — die Menü-Mechanik gehört nicht zum Prüfgegenstand.
  // Immer öffnen: der Leser-Regler lebt ausschliesslich im Panel, und die
  // frühere Bedingung «nur öffnen, wenn kein A+ sichtbar ist» griff nie, weil
  // die App-Leiste ihr eigenes A+ zeigt (Ä9).
  if (!(await groesser(page).isVisible().catch(() => false))) {
    await page.locator('[data-v3-ansicht]').click()
  }
  await expect(groesser(page)).toBeVisible({ timeout: 10_000 })
  return fehler
}

test.describe('Leser-Schriftskala — der Regler bewegt NUR den Normtext', () => {
  test('(a) «A+» vergrössert den Normtext; Kopfzeile, Seitenleiste und Wurzel bleiben gleich', async ({ page }) => {
    test.slow() // grosser Erlass (StPO, 480 Art.)
    const fehler = await oeffneStPO(page)

    const vorher = {
      norm: await schriftgroesse(normtext(page)),
      kopf: await schriftgroesse(kopf(page)),
      leiste: await schriftgroesse(leiste(page)),
      wurzel: await wurzelGroesse(page),
    }

    await groesser(page).click()
    // Auf die WIRKUNG warten, nicht auf eine Zeitspanne: erst wenn der Normtext
    // gewachsen ist, sind die anderen Messwerte überhaupt aussagekräftig.
    await expect
      .poll(() => schriftgroesse(normtext(page)), { timeout: 5_000 })
      .toBeGreaterThan(vorher.norm)

    const nachher = {
      norm: await schriftgroesse(normtext(page)),
      kopf: await schriftgroesse(kopf(page)),
      leiste: await schriftgroesse(leiste(page)),
      wurzel: await wurzelGroesse(page),
    }

    // DAS ist der gemeldete Fehler, in Zahlen: vor der Umkehr wuchsen alle vier
    // Werte gemeinsam. Jetzt darf sich exakt einer bewegen.
    expect(nachher.kopf, `Kopfzeile ${vorher.kopf} → ${nachher.kopf} px (Normtext ${vorher.norm} → ${nachher.norm} px)`)
      .toBe(vorher.kopf)
    expect(nachher.leiste, `Seitenleiste ${vorher.leiste} → ${nachher.leiste} px`).toBe(vorher.leiste)
    expect(nachher.wurzel, `<html> ${vorher.wurzel} → ${nachher.wurzel} px — der Regler wirkt wieder global`)
      .toBe(vorher.wurzel)

    expect(fehler).toEqual([])
  })

  test('(b) über alle vier Stufen hinauf und zurück: Kopf und Leiste rühren sich nie', async ({ page }) => {
    test.slow()
    const fehler = await oeffneStPO(page)

    const start = await schriftgroesse(normtext(page))
    const kopfStart = await schriftgroesse(kopf(page))
    const leisteStart = await schriftgroesse(leiste(page))
    // Die Vorgabestufe IST die Fliesstext-Stufe des Lesers (S2: `leser-text` =
    // R6c: `leser-text` = 1.125 rem bei 16-px-Wurzel = 18 px). Wäre das
    // nicht so, verschöbe der REGLER die Grundeinstellung — und der
    // Pixelvergleich der V3-Paritätsspecs wäre hinfällig.
    expect(start, 'Vorgabestufe verschiebt die Normtext-Grösse').toBe(STUFEN_PX[0])

    const treppe: number[] = [start]
    // Vier Stufen ⇒ DREI wirksame Klicks. Der Anschlag wird danach an der
    // Bedienbarkeit des Knopfes geprüft, nicht an einem vierten Klick:
    // `kannGroesser` schaltet den Knopf auf `disabled` (LeserAnsichtV3.tsx), und
    // Playwright wartet auf einem deaktivierten Knopf bis zum Test-Timeout,
    // statt folgenlos zu klicken — genau daran starb diese Spec (gemessen
    // 16.8.2026: «element is not enabled», 90 s).
    //
    // KEINE LOCKERUNG, SONDERN DIE SCHÄRFERE PROBE. «Der vierte Klick bleibt
    // folgenlos» wäre auch dann erfüllt, wenn ein Fehler den Klick verschluckt.
    // «Der Knopf ist am Anschlag deaktiviert» ist die Zusage, die der Nutzer
    // tatsächlich sieht, und sie schliesst das Überlaufen des Vokabulars
    // genauso aus.
    for (let i = 0; i < 3; i++) {
      await groesser(page).click()
      await page.waitForTimeout(120)
      treppe.push(await schriftgroesse(normtext(page)))
    }
    expect(treppe, `Treppe ${treppe.join(' → ')} px`).toEqual([...STUFEN_PX])
    await expect(groesser(page), 'oberer Anschlag ist nicht gesperrt — die Skala kann über ihr Vokabular hinauslaufen')
      .toBeDisabled()

    // Zurück bis zum unteren Anschlag — die Vorgabestufe muss exakt wieder
    // erreicht werden, nicht ein Wert daneben.
    for (let i = 0; i < 3; i++) {
      await kleiner(page).click()
      await page.waitForTimeout(120)
    }
    expect(await schriftgroesse(normtext(page)), 'Rückweg landet nicht auf der Vorgabestufe').toBe(start)
    await expect(kleiner(page), 'unterer Anschlag ist nicht gesperrt').toBeDisabled()

    expect(await schriftgroesse(kopf(page)), 'Kopfzeile hat sich unterwegs verstellt').toBe(kopfStart)
    expect(await schriftgroesse(leiste(page)), 'Seitenleiste hat sich unterwegs verstellt').toBe(leisteStart)

    expect(fehler).toEqual([])
  })

  test('(c) die Stufe überlebt den Reload — und bleibt auch dann auf den Normtext beschränkt', async ({ page }) => {
    test.slow()
    const fehler = await oeffneStPO(page)

    const kopfVorher = await schriftgroesse(kopf(page))
    await groesser(page).click()
    await groesser(page).click()
    await expect.poll(() => schriftgroesse(normtext(page)), { timeout: 5_000 }).toBe(STUFEN_PX[2])

    await page.reload()
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
    // Nach dem Reload trägt der Normtext die gewählte Stufe bereits beim ersten
    // Paint (`wendeLeserOptionenAn` setzt `data-leserschrift` vor dem Render) —
    // und die Kopfzeile steht unverändert da.
    expect(await schriftgroesse(normtext(page)), 'Stufe hat den Reload nicht überlebt').toBe(STUFEN_PX[2])
    expect(await schriftgroesse(kopf(page)), 'Kopfzeile nach Reload verstellt').toBe(kopfVorher)

    expect(fehler).toEqual([])
  })
})
