// @shard-gruppe: 7
// ─── Ä19 (LESER-V3 H2b) · JE PANE EIN ZUGREIFBARES SUCHFELD ──────────────────
//
// DER GEWICHTIGSTE BEFUND des Ästhetik-Reviews H1, gemessen 17.8.2026 im Split
// @1440 unter `?leser=v3`: `[data-v3-suchsprung] input` **count === 0**. Die
// Panes waren 590 px breit, unterschritten also die xl-Schwelle; die
// Seitenleiste ist dort ein Bottom-Sheet, und das Such-/Sprungfeld lebte
// ausschliesslich darin. Wer im Split suchen wollte, musste ein Blatt öffnen, das
// das Pane vollständig verdeckt — man suchte im Text, den man dabei nicht mehr
// sah. V1 hat je Pane ein Feld; V3 hatte keines. Derselbe Mangel traf das Handy
// und, unbemerkt, den Desktop mit EINGEKLAPPTER Gliederung.
//
// DIE GEPRÜFTE REGEL: das Feld ist auf JEDER Breite das oberste Element des
// klebenden Blocks. WELCHER Block das ist, war bis 6.9.2026 breitenabhängig (in
// der Spalte deren Sockel, sonst der Kopf-Block); seit D28 ist es IMMER der
// Kopf-Block (`v3/SuchZone.tsx`) — David wörtlich: «die suchleiste im gesetz,
// welche sich oben an der gliederung befindet, will ich oben am gesetz — dann
// verschiebt sie sich auch nicht, wenn gliederung eingeklappt ist». Fall (c)
// unten ist danach neu gefasst (§6.3-Deklaration dort). Es ist ohne jede Geste
// erreichbar und verdeckt den Lesetext nicht.
//
// WARUM IM BROWSER: «existiert das Feld in dieser Breite überhaupt» und «liegt an
// seiner Stelle auch das Feld» sind Aussagen über die gerechnete Breiten-Weiche
// (ResizeObserver auf der Pane-Wurzel) und über die Stapelung. Kein Unit-Test
// sieht das.
//
// ROT ZU BEKOMMEN (§6.7): in `src/pages/gesetz-leser/v3/LeserRahmenV3.tsx` die
// Prop `suchZone={suchZone}` am `<LeserKopf>` entfernen — dann fällt Fall (a) auf
// 0 Felder zurück (der Vorzustand), (b) und (c) verlieren ihr Feld ebenfalls.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

/** Zu welchem Pane gehört jedes gefundene Suchfeld? Über die Vorfahrenkette, weil
 *  das Feld im Kopf-Block liegt und ein Blatt per Portal auch AUSSERHALB von
 *  `[data-pane]` landen kann (Befund H2, `leser-v3-highlight-split`). */
async function paneRollen(page: Page): Promise<string[]> {
  return page.locator('[data-v3-suchsprung] input').evaluateAll((els) => els.map((el) => {
    let n: HTMLElement | null = el as HTMLElement
    while (n) {
      const v = n.getAttribute('data-v3-pane') ?? n.getAttribute('data-pane')
      if (v) return v
      n = n.parentElement
    }
    return '(ohne Pane-Rolle)'
  }))
}

test.describe('Ä19 — das Such-/Sprungfeld ist in jeder Breite erreichbar', () => {
  test('(a) Split-View: JE Pane genau ein sichtbares Feld, ohne eine Geste', async ({ page }) => {
    test.slow() // zwei volle Leser-Instanzen samt Idle-Shards
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/BGFA?leser=v3&p=/gesetze/bund/BGBM%3Fleser%3Dv3')
    await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 20_000 })

    // KEIN Klick, kein ☰: genau das ist der Prüfgegenstand. Vorher stand hier 0.
    const felder = page.locator('[data-v3-suchsprung] input')
    await expect(felder, 'im Split fehlt je Pane ein Suchfeld (Ä19)').toHaveCount(2, { timeout: 20_000 })
    await expect(felder.nth(0)).toBeVisible()
    await expect(felder.nth(1)).toBeVisible()

    // Und es sind wirklich ZWEI Panes, nicht zweimal dasselbe Feld.
    const rollen = await paneRollen(page)
    expect(rollen.slice().sort(), `Pane-Rollen der Felder: ${rollen.join(', ')}`)
      .toEqual(['primaer', 'sekundaer'])

    // Der Text bleibt sichtbar: das Feld ist Chrome, kein Overlay über dem Pane.
    await expect(page.locator('[data-pane="sekundaer"] article').first()).toBeVisible()

    // Suchen in Pane A markiert nur in Pane A — die Markierung ist eine Zusage
    // JE Instanz (Buchführung: `suchHighlight.ts`, Nachweis in
    // `leser-v3-highlight-split`). Hier genügt: die Eingabe wirkt, ohne dass
    // irgendetwas geöffnet werden musste, und das Nachbar-Feld bleibt leer.
    await felder.nth(0).fill('Anwalt')
    await expect(felder.nth(0)).toHaveValue('Anwalt')
    await expect(felder.nth(1)).toHaveValue('')

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(b) Handy @390: das Feld steht im klebenden Kopf-Block, nicht im Blatt', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/BGFA')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })

    const feld = page.locator('[data-v3-suchsprung] input')
    await expect(feld, 'auf dem Handy gibt es genau EIN Feld').toHaveCount(1, { timeout: 20_000 })
    await expect(feld).toBeVisible()

    // Es liegt IM Kopf-Block (nicht im Gliederungs-Blatt) — sonst wäre es wieder
    // eine Geste entfernt, und im Blatt gäbe es die zweite Eingabe (§5, K2).
    const imKopf = await feld.evaluate((el) => !!el.closest('[data-v3-kopf]'))
    expect(imKopf, 'das Feld liegt nicht im klebenden Kopf-Block').toBe(true)

    // ── §6.3-NACHZUG (A2, H2b-Nachzug) · DIE ZUSAGE IST GESCHÄRFT, NICHT GELOCKERT
    // Bis hierher stand hier «im Blatt steht KEIN Feld» (`count === 0`). Das war
    // die richtige Antwort auf K2 (zwei Eingaben für eine Absicht) und die falsche
    // auf WCAG: das Blatt ist ein `role=dialog`, und ohne Feld darin gab es bei
    // offener Trefferliste @390 überhaupt kein erreichbares Eingabefeld mehr —
    // gemessen 17.8.2026 zog Ctrl+K den Fokus auf das VERDECKTE Kopf-Feld
    // (`sheet.contains(activeElement) === false`), Tippen landete unsichtbar.
    // NEUE ZUSAGE, strenger als die alte: es gibt weiterhin GENAU EIN Feld im
    // ganzen Dokument — es steht nur dort, wo der Fokus hin darf. Solange das
    // Blatt offen ist, IM Blatt; sonst im Kopf-Block.
    await page.locator('[data-v3-gliederung-auf]').first().click()
    await expect(page.locator('[data-gliederung-sheet]')).toBeVisible({ timeout: 15_000 })
    await expect(feld, 'bei offenem Blatt gibt es nicht mehr genau EIN Feld (K2)').toHaveCount(1)
    expect(await page.locator('[data-gliederung-sheet] [data-v3-suchsprung]').count(),
      'im offenen Blatt fehlt das Feld — der Fokus müsste den Dialog verlassen').toBe(1)
    expect(await feld.evaluate((el) => !!el.closest('[data-v3-kopf]')),
      'das Feld steht bei offenem Blatt noch im (verdeckten) Kopf-Block').toBe(false)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  // ── §6.3-DEKLARATION (D28, David 6.9.2026) ─────────────────────────────────
  // Der Fall prüfte bis hierher, dass das Feld MIT Spalte in deren Sockel steht
  // und beim Einklappen in den Kopf-Block WANDERT. Genau dieses Wandern ist der
  // Mangel, den D28 behebt («dann verschiebt sie sich auch nicht»). Die tragende
  // Zusage des Falls («nach dem Einklappen ist das Feld noch da, genau eines,
  // bedienbar») bleibt Wort für Wort; die Lage-Aussage wird umgedreht: das Feld
  // steht VORHER UND NACHHER im Kopf-Block. Der Vorzustand hätte diesen Fall rot
  // gemacht (mit Spalte lag das Feld in `[data-toc-zone-a]`).
  test('(c) Desktop @1440: das Feld steht im Kopf-Block — mit UND ohne Gliederung', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/BGFA')
    await expect(page.locator('[data-v3-aside]')).toBeVisible({ timeout: 20_000 })

    // Mit Spalte: das Feld gehört in den Kopf-Block, NICHT in den Sockel (D28).
    const feld = page.locator('[data-v3-suchsprung] input')
    await expect(feld).toHaveCount(1)
    expect(await feld.evaluate((el) => !!el.closest('[data-v3-kopf]')),
      'mit Spalte steht das Feld nicht im Kopf-Block (D28)').toBe(true)
    expect(await feld.evaluate((el) => !!el.closest('[data-toc-zone-a]')),
      'das Feld ist wieder in den Sockel der Gliederung gerutscht (D28)').toBe(false)

    // Gliederung einklappen — vor H2b verschwand das Feld hier ersatzlos.
    await page.locator('[data-v3-gliederung-zu]').first().click()
    await expect(page.locator('[data-v3-aside]')).toHaveCount(0)
    await expect(feld, 'nach dem Einklappen fehlt das Suchfeld').toHaveCount(1)
    await expect(feld).toBeVisible()
    expect(await feld.evaluate((el) => !!el.closest('[data-v3-kopf]')),
      'ohne Spalte muss das Feld im Kopf-Block stehen').toBe(true)

    // Und es ist bedienbar, nicht nur sichtbar.
    await feld.click()
    await expect(feld).toBeFocused()

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  // ── B9 (H2b-Nachzug) · DIE AUSGELEGTE HÖHE DECKT DAS MARKUP ───────────────
  // `--leser-v3-such-h` speist `--nt-stick`, also den Sprung-Offset JEDES
  // Artikel-Ankers. Die zwei Werte standen als rem-Literale im Rahmen, das
  // Markup in `SuchZone.tsx` — ohne Wächter dazwischen (Klasse LM-003).
  //
  // WAS HIER GEMESSEN WIRD, und was NICHT: die Zone trägt `height: var(--leser-v3
  // -such-h)` im Style. Ihre gemessene Höhe ist der Variable darum IMMER gleich —
  // ein Vergleich der beiden wäre eine Tautologie und könnte nicht scheitern
  // (§6.7; genau so gebaut, im Sabotage-Lauf als blind ERKANNT und ersetzt).
  // Geprüft wird stattdessen die NATÜRLICHE Höhe des Markups: die Spec setzt
  // `height: auto`, misst, und stellt zurück. Gemessen 17.8.2026 @390 (BGFA):
  // Ruhe natürlich 40 px gegen ausgelegt 44 px · mit Suche 64 gegen 68 — die
  // Auslegung trägt konstant 4 px Reserve (halbe Zeile), damit ein Umbruch im
  // Zähler die Zone nicht sprengt. Die Schranke lässt genau das zu und nicht mehr.
  // ROT ZU BEKOMMEN (§6.7): `SUCH_H_RUHE` in `v3/SuchZone.tsx` auf `'3.5rem'`
  // setzen ⇒ ausgelegt 56 px, natürlich 40 px, Reserve 16 px > 4;
  // auf `'2rem'` ⇒ ausgelegt 32 px < natürlich 40 px (Inhalt läuft heraus).
  const RESERVE_MAX = 4

  test('(e) die ausgelegte Höhe der Such-Zone deckt ihr Markup — ohne Luft', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/BGFA')
    await expect(page.locator('[data-v3-such-zone]')).toBeVisible({ timeout: 20_000 })

    const mass = async () => page.evaluate(() => {
      const zone = document.querySelector('[data-v3-such-zone]') as HTMLElement | null
      const wurzel = document.querySelector('[data-leser-v3="rahmen"]') as HTMLElement | null
      if (!zone || !wurzel) return null
      const roh = getComputedStyle(wurzel).getPropertyValue('--leser-v3-such-h').trim()
      const ausgelegt = Math.round(zone.getBoundingClientRect().height)
      // Natürliche Höhe: kurz freigeben, messen, zurückstellen.
      const vorher = zone.style.height
      zone.style.height = 'auto'
      const natuerlich = Math.round(zone.getBoundingClientRect().height)
      zone.style.height = vorher
      return { roh, ausgelegt, natuerlich }
    })

    const ruhe = await mass()
    expect(ruhe, 'Zone oder Rahmen nicht gefunden').not.toBe(null)
    expect(ruhe!.ausgelegt,
      `Ruhe: ausgelegt ${ruhe!.roh} = ${ruhe!.ausgelegt} px deckt die natürlichen ${ruhe!.natuerlich} px nicht`)
      .toBeGreaterThanOrEqual(ruhe!.natuerlich)
    expect(ruhe!.ausgelegt - ruhe!.natuerlich,
      `Ruhe: ${ruhe!.ausgelegt - ruhe!.natuerlich} px Reserve über dem Markup (erlaubt ${RESERVE_MAX})`)
      .toBeLessThanOrEqual(RESERVE_MAX)

    // Mit laufender Suche wächst die Zone um die Zähler-Zeile — der zweite Wert.
    //
    // ── §6.3-NACHZUG D38 (7.9.2026) · ZWEI ZUSTÄNDE STATT EINEM ──────────────
    // Seit D38 liegt die Trefferliste über der Lesespalte, und solange sie dort
    // liegt, SCHWEIGT die Zähler-Zeile (ihre Zahlen stehen im Listenkopf, §5).
    // Die Zone behält ihre Höhe trotzdem: der Platz wird für die ganze Dauer
    // einer Eingabe RESERVIERT, sonst spränge sie bei jedem Wechsel
    // Text↔Treffer um 24 px (`v3/LeserRahmenV3.tsx`, `zoneHoch`).
    // Beide Zustände werden geprüft, statt einen wegzudefinieren (§8):
    //  · Liste steht  ⇒ die Höhe ist dieselbe wie mit Zeile (reserviert).
    //  · Liste weg    ⇒ die Zeile füllt sie, und zwar ohne Luft (≤ RESERVE_MAX).
    await page.locator('[data-v3-such-zone] input').fill('Anwalt')
    await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 20_000 })
    const reserviert = await mass()
    // ↵ ist die Wahl (D38): die Liste gibt die Lesefläche frei, die Zeile kommt.
    await page.locator('[data-v3-such-zone] input').press('Enter')
    await expect(page.locator('[data-v3-treffer-weg]')).toBeVisible({ timeout: 15_000 })
    const aktiv = await mass()
    expect(reserviert!.ausgelegt,
      `die Zone springt beim Umschalten: ${reserviert!.ausgelegt} → ${aktiv!.ausgelegt} px`)
      .toBe(aktiv!.ausgelegt)
    expect(aktiv!.ausgelegt,
      `mit Suche: ausgelegt ${aktiv!.roh} = ${aktiv!.ausgelegt} px deckt die natürlichen ${aktiv!.natuerlich} px nicht`)
      .toBeGreaterThanOrEqual(aktiv!.natuerlich)
    expect(aktiv!.ausgelegt - aktiv!.natuerlich,
      `mit Suche: ${aktiv!.ausgelegt - aktiv!.natuerlich} px Reserve (erlaubt ${RESERVE_MAX})`)
      .toBeLessThanOrEqual(RESERVE_MAX)
    // Positiv-Sonde: die Zone wächst überhaupt — sonst prüften beide Fälle dasselbe.
    expect(aktiv!.ausgelegt, 'die Zone wächst mit der Suche gar nicht — Fall untauglich')
      .toBeGreaterThan(ruhe!.ausgelegt)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})
