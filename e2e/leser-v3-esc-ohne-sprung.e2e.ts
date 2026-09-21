// @shard-gruppe: 1
// FAHRPLAN-LESER-V3, Etappe H2 · Position 14 (Kap. 4h) — «Esc leert das Feld,
// schliesst die Trefferliste, SPRINGT ABER NICHT: die Scrollposition bleibt
// exakt stehen» («recover from mistakes»).
//
// DER BEFUND, den dieser Test festhält. Die Ist-Hülle scrollt an ZWEI Punkten
// ungefragt: beim Beginn der Suche an den Anfang des Erlasses, und beim Leeren
// des Feldes wieder zurück auf die gemerkte Position (`inhalt-sprung.tsx`).
// Beides stammt aus der Zeit, als die Suche die Lesespalte FILTERTE und der
// sticky-Block mit dem geschrumpften Inhalt aus dem Bild rutschte. Seit S8
// bleibt die Lesespalte vollständig, und in V3 steht die Trefferliste in der
// Seitenleiste — der Anlass ist weg, die Bewegung war geblieben.
//
// GEMESSEN WIRD IN PIXELN, nicht an einem Artikel-Anker: «bleibt exakt stehen»
// ist eine Aussage über den Scroll-Offset, und nur die Zahl kann sie belegen.
// Ein Anker-Vergleich («noch bei Art. 429») liesse eine Verschiebung um eine
// halbe Bildschirmhöhe durchgehen.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const suchFeld = (page: Page) => page.locator('[data-v3-suchsprung] input')

/** Scroll-Offset der Einzelansicht (kein Pane ⇒ das Fenster scrollt). */
const scrollY = (page: Page) => page.evaluate(() => Math.round(window.scrollY))

async function oeffneUndScrolle(page: Page): Promise<{ fehler: string[]; y: number }> {
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/STPO')
  await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
  await expect(suchFeld(page)).toBeVisible({ timeout: 20_000 })

  // Mitten in den Erlass scrollen — nur von dort ist ein Rücksprung überhaupt
  // messbar. Danach ausruhen lassen, damit der Scroll-Spy fertig ist und die
  // Ausgangszahl stabil steht.
  await page.evaluate(() => window.scrollTo(0, 6000))
  await page.waitForTimeout(1200)
  const y = await scrollY(page)
  expect(y, 'Ausgangsposition ist nicht tief genug für die Messung').toBeGreaterThan(3000)
  return { fehler, y }
}

test.describe('H2 / Pos. 14 — Suche verlassen bewegt den Lesetext um 0 px', () => {
  test('(a) Esc im Feld: Feld leer, Scrollposition unverändert', async ({ page }) => {
    test.slow()
    const { fehler, y } = await oeffneUndScrolle(page)

    // Ein Artikel im Bild als Zeuge — er misst, was der LESER sieht.
    const zeuge = page.locator('#lc-lesespalte [id^="art-"]').first()
    const lage = () => zeuge.evaluate((el) => Math.round(el.getBoundingClientRect().top))
    const lageVorher = await lage()

    await suchFeld(page).fill('Entschädigung')
    await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 30_000 })
    // Schon das BEGINNEN der Suche darf nichts bewegen — in der Ist-Hülle
    // sprang der Text hier an den Anfang (scrollY 0).
    //
    // ── §6.3-UMSTELLUNG D38 (7.9.2026) · GEMESSEN WIRD DIE BILDLAGE ──────────
    // Hier stand `expect(await scrollY(page)).toBe(y)`. Das galt, solange die
    // Such-Zone bei STEHENDER Gliederungs-Spalte nicht wachsen konnte
    // (`zoneHoch: … && !zweiSpalten`). Seit D38 wird die Zeile für die ganze
    // Dauer einer Eingabe reserviert — die Zone wächst um 24 px, Chromes
    // Scroll-Anchoring zieht `scrollY` um dieselben 24 px nach, und genau
    // dadurch sieht der Leser nichts wandern. Eine Zusicherung auf konstantes
    // `scrollY` verlangte hier also das Gegenteil dessen, was Pos. 14
    // verspricht. Dieselbe Umstellung und dieselbe Begründung wie in
    // `leser-v3-suche-ohne-gliederung` (d) und `leser-d38-treffer-lesespalte`
    // (c) — eine Messart für eine Frage (§5).
    expect(Math.abs(await lage() - lageVorher),
      'die Suche selbst hat den Text bewegt').toBeLessThanOrEqual(2)

    await suchFeld(page).focus()
    await page.keyboard.press('Escape')
    await expect(suchFeld(page)).toHaveValue('')
    // Kurz nachlaufen lassen: der Rücksprung der Ist-Hülle lief über einen
    // requestAnimationFrame, ein sofortiges Messen hätte ihn verpasst.
    await page.waitForTimeout(1200)
    // Nach dem Leeren ist die Geometrie wieder die des Ruhezustands — hier ist
    // `scrollY` wieder der schärfere Zeuge und bleibt unverändert geprüft.
    expect(await scrollY(page), 'Esc hat den Text bewegt').toBe(y)
    expect(Math.abs(await lage() - lageVorher), 'Esc hat den Text im Bild bewegt')
      .toBeLessThanOrEqual(2)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(b) ✕-Knopf: leert, bewegt nicht, und der Fokus bleibt im Feld', async ({ page }) => {
    test.slow()
    const { fehler, y } = await oeffneUndScrolle(page)

    await suchFeld(page).fill('Entschädigung')
    await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 30_000 })

    const leeren = page.locator('[data-v3-such-leeren]')
    await expect(leeren).toBeVisible()
    await leeren.click()
    await expect(suchFeld(page)).toHaveValue('')
    await page.waitForTimeout(1200)
    expect(await scrollY(page), '✕ hat den Text bewegt').toBe(y)
    // Der Fokus bleibt, damit die nächste Eingabe ohne Umweg beginnt.
    await expect(suchFeld(page)).toBeFocused()

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(c) ✕ ist erst da, wenn es etwas zu leeren gibt (§8)', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await expect(suchFeld(page)).toBeVisible({ timeout: 20_000 })

    await expect(page.locator('[data-v3-such-leeren]')).toHaveCount(0)
    await suchFeld(page).fill('x')
    await expect(page.locator('[data-v3-such-leeren]')).toBeVisible()

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})

// ── §6.3-NACHZUG (A2, H2b-Nachzug 17.8.2026) · WEM GEHÖRT `Esc` IM BLATT? ───
// Dieser Block prüfte bis hierher: «Esc im Sheet-Feld leert nur, das Sheet steht
// noch». Die Zusage ist BEWUSST UMGEDREHT, und das ist eine fachliche Änderung,
// keine Lockerung — Grund und Messung:
//  · Das Blatt trägt `role="dialog"`. Im ARIA-Dialog-Muster schliesst Esc den
//    Dialog (WCAG 2.1.2); jede App, jeder Browser tut das. Ein Dialog, der auf
//    Esc etwas anderes macht, ist eine Falle.
//  · Der alte Fall war zudem nur SCHEINBAR ein Sheet-Fall: `[data-v3-suchsprung]
//    input` traf seit Ä19 das Feld im KOPF-Block, nicht im Blatt — das Blatt hatte
//    gar keines. Gemessen 17.8.2026 @390 bei offenem Treffer-Blatt: Ctrl+K
//    fokussierte das VERDECKTE Kopf-Feld, Tippen landete unsichtbar. Der Test war
//    grün, während die Bedienung unerreichbar war.
//  · WAS BLEIBT, ist der Kern von Pos. 14: Esc SPRINGT NICHT. Genau das prüft
//    dieser Fall jetzt zusätzlich — der Scroll-Offset bleibt beim Schliessen
//    stehen, und der Suchbegriff geht nicht verloren.
//  · Das Leeren per Esc bleibt geprüft, wo das Feld NICHT in einem Dialog steht:
//    Fälle (a)–(c) oben @1440 und `e2e/leser-v3-blatt.e2e.ts` (b) am Schluss.
// ROT ZU BEKOMMEN (§6.7): in `v3/LeserRahmenV3.tsx` `escLeert={!blattOffen}` auf
// `escLeert` setzen ⇒ das Blatt bleibt offen und der Begriff ist gelöscht.
test.describe('A2 / Pos. 14 — im Blatt schliesst Esc den Dialog, ohne zu springen', () => {
  test('(d) @390: Esc im Blatt-Feld schliesst das Blatt, Begriff und Scrollposition bleiben', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 780 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })

    // ☰ öffnet die Gliederung als Blatt — und mit ihr das Such-/Sprungfeld, das
    // dort seit A2 zuoberst steht (Ä18: eine Reihenfolge auf allen Breiten).
    const oeffner = page.locator('[data-v3-gliederung-auf]').first()
    await expect(oeffner).toBeVisible({ timeout: 20_000 })
    await oeffner.click()
    const blatt = page.locator('[data-gliederung-sheet]')
    await expect(blatt).toBeVisible({ timeout: 20_000 })
    const feld = blatt.locator('[data-v3-suchsprung] input')
    await expect(feld, 'im Blatt steht kein Suchfeld — der Fokus müsste es verlassen')
      .toHaveCount(1, { timeout: 20_000 })

    await feld.fill('Entschädigung')
    await feld.focus()
    const vorher = await scrollY(page)

    await page.keyboard.press('Escape')

    // Der Dialog ist zu …
    await expect(blatt, 'Esc hat das Blatt nicht geschlossen').toHaveCount(0, { timeout: 10_000 })
    // … der Begriff steht weiterhin (Esc im Dialog schliesst, es löscht nicht) …
    await expect(suchFeld(page).first()).toHaveValue('Entschädigung')
    // … und NICHTS ist gesprungen (Kern von Pos. 14).
    expect(await scrollY(page), 'das Schliessen hat gescrollt').toBe(vorher)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})
