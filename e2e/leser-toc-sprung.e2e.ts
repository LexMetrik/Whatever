// @shard-gruppe: 7
// W2·19-GLIEDERUNG — «Der Sprung landet im Abschnitt DAVOR» (Befund David
// 9.8.2026, live an /gesetze/bund/OR: Klick auf «Dritte Abteilung: Die
// Handelsgesellschaften und die Genossenschaft» landete eine Stufe zu früh).
//
// ─── WAS HIER BEWIESEN WIRD ──────────────────────────────────────────────────
// Ein Klick auf eine Gliederungszeile hat GENAU ZWEI sichtbare Zusagen, und der
// Befund riss beide:
//   (1) Der angeklickte Abschnittskopf steht danach OBEN im Sichtfeld — unter
//       dem klebenden Reader-Kopf, nicht dahinter. Gemessen gegen den
//       `.nt-anker`-scroll-margin (= die reale Sticky-Höhe `--nt-stick`), also
//       gegen dieselbe Zahl, die den Landepunkt definiert (§5, eine Quelle).
//   (2) Die EINE Positionsmarke der Leiste (`[data-toc-aktiv]`, F5) steht danach
//       in genau dieser Zeile oder in einem ihrer Kinder — nie im Nachbarast.
//
// ─── DIE ZWEI URSACHEN, gegen die die Fälle gerichtet sind (Diagnose 9.8.2026) ─
//   M1 DRIFT. `springeZuSektion` scrollte EIN einziges Mal, zwei Frames nach dem
//      Aufklappen. Unter `content-visibility:auto` (1686 OR-Artikel, Platzhalter-
//      höhen aus `schaetzeArtikelHoehe`) materialisieren die echten Höhen ERST
//      danach; gemessen wanderte der Abschnittskopf anschliessend von 100 px auf
//      16 px hoch — vollständig hinter den 100 px hohen Sticky-Kopf. Der
//      Artikel-Sprung (`springeZuArtikel`) hatte den Korrektur-Scroll nach dem
//      Einschwingen seit je, der Sektions-Sprung nicht.
//   M2 BEZUGSLINIE. Der Scroll-Spy mass an `5rem + 8` = 88 px, der Landepunkt
//      liegt aber bei `--nt-stick` = 100 px. Beide Code-Stellen behaupteten,
//      die Zahlen seien deckungsgleich; sie waren es um 12 px nicht. Folge am
//      Abschnittskopf: die Linie lag NOCH IM letzten Artikel des VORIGEN
//      Abschnitts (Art. 551, Unterkante 92 px), also meldete der Spy nach dem
//      Lösen des Sprung-Locks den Vorgänger — die Marke sprang sichtbar zurück
//      auf «IV. Haftung gegenüber Dritten».
//
// Beide Fälle laufen bewusst am OR: die Drift ist eine Funktion der Menge
// geschätzter Platzhalterhöhen VOR dem Ziel, und nur der schwerste Erlass des
// Korpus stellt sie verlässlich her. Ein leichter Erlass wäre grün, ohne etwas
// zu belegen (§6.7 — ein Tor, das nicht scheitern kann).
import { test, expect, type Page } from '@playwright/test'

test.describe.configure({ timeout: 120_000 })

/** Sektions-Ids der OR-Fixture (Sonde gegen den committeten Snapshot 9.8.2026). */
const DRITTE_ABTEILUNG = 'sek-1052' // «Dritte Abteilung: Die Handelsgesellschaften …», Art. 552–926
const AG_TITEL = 'sek-1140'         // «Sechsundzwanzigster Titel: Die Aktiengesellschaft», Art. 620–763

/**
 * Deterministischer Warte-Anker statt fester Sleeps: der Fenster-Scroll gilt als
 * eingeschwungen, wenn `scrollY` `ruheMs` lang unverändert bleibt. Läuft
 * page-seitig in EINER evaluate-Reise (Muster leser-gliederung-a33.e2e.ts).
 */
async function scrollSettle(page: Page, ruheMs = 400, deadlineMs = 15_000): Promise<void> {
  await page.evaluate(
    async ({ ruheMs, deadlineMs }) => {
      const start = Date.now()
      let letzter = window.scrollY
      let ruhigSeit = Date.now()
      for (;;) {
        await new Promise((r) => setTimeout(r, 60))
        if (window.scrollY !== letzter) { letzter = window.scrollY; ruhigSeit = Date.now() }
        else if (Date.now() - ruhigSeit >= ruheMs) return
        if (Date.now() - start >= deadlineMs) return
      }
    },
    { ruheMs, deadlineMs },
  )
}

/** Lage des Abschnittskopfs im Sichtfeld + der Landepunkt, gegen den sie zählt. */
async function kopfLage(page: Page, sekId: string): Promise<{ top: number; landepunkt: number }> {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-sek="${id}"]`) as HTMLElement | null
    if (!el) return { top: Number.NaN, landepunkt: Number.NaN }
    // Der Landepunkt eines Sprungs IST der scroll-margin-top des `.nt-anker`
    // (index.css: `var(--nt-stick)`). Nie hier nachrechnen — sonst zweite Wahrheit.
    return { top: el.getBoundingClientRect().top, landepunkt: parseFloat(getComputedStyle(el).scrollMarginTop) }
  }, sekId)
}

/** Trägt die Zeile `sekId` (oder eines ihrer Kinder) die EINE Positionsmarke? */
async function markeImAst(page: Page, sekId: string): Promise<{ imAst: boolean; text: string }> {
  return page.evaluate((id) => {
    const marke = document.querySelector('[data-toc] [data-toc-aktiv]') as HTMLElement | null
    const ast = document.querySelector(`[data-toc] [data-sektion-id="${id}"]`)
    return {
      imAst: !!marke && !!ast && ast.contains(marke),
      text: marke ? (marke.textContent ?? '').trim().slice(0, 60) : '(keine Marke)',
    }
  }, sekId)
}

/** Die anklickbare Sprung-Schaltfläche der Gliederungszeile (nicht das Chevron). */
function zeile(page: Page, sekId: string) {
  // §6.3-DEKLARATION (W2·24-R6c, P8): Sprung-Zeile = `<a href="#art-…">`,
  // sonst `<button>` (SektionBaumTOC `TocZeile`). Beide treffen, Absicht gleich.
  return page.locator(`[data-toc] [data-sektion-id="${sekId}"] :is(a, button)[title]`).first()
}

test.describe('TOC-Sprung — der Klick landet AUF dem Abschnitt, nicht davor', () => {
  test('Oberste Stufe (OR, «Dritte Abteilung»): Kopf unter dem Sticky-Kopf, Marke im eigenen Ast', async ({ page }) => {
    await page.goto('/gesetze/bund/OR')
    await page.waitForSelector('article[id^="art-"]')
    await page.waitForSelector('[data-toc] [data-sektion-id]')

    await zeile(page, DRITTE_ABTEILUNG).click()
    await scrollSettle(page)

    // (1) M1 — kein Abdriften hinter den Sticky-Kopf. Vor dem Fix: 16 px bei
    // einem Landepunkt von 100 px, der Abschnittskopf war unsichtbar.
    const lage = await kopfLage(page, DRITTE_ABTEILUNG)
    expect(lage.landepunkt).toBeGreaterThan(0)
    expect(lage.top).toBeGreaterThanOrEqual(lage.landepunkt - 4)
    expect(lage.top).toBeLessThanOrEqual(lage.landepunkt + 40)

    // (2) M2 — die Marke bleibt im gesprungenen Ast, auch NACHDEM der
    // Sprung-Lock gelöst und der Spy einmal nachgewertet hat (500 ms + Nachlauf).
    await page.waitForTimeout(1200)
    await expect.poll(async () => (await markeImAst(page, DRITTE_ABTEILUNG)).text, { timeout: 10_000 })
      .not.toBe('(keine Marke)')
    const marke = await markeImAst(page, DRITTE_ABTEILUNG)
    expect(marke.imAst, `Marke steht ausserhalb des gesprungenen Astes: «${marke.text}»`).toBe(true)
  })

  test('Tiefe Stufe (OR, «Die Aktiengesellschaft»): derselbe Vertrag eine Ebene tiefer', async ({ page }) => {
    await page.goto('/gesetze/bund/OR')
    await page.waitForSelector('article[id^="art-"]')
    await page.waitForSelector('[data-toc] [data-sektion-id]')

    // Der Baum startet beim OR ganz zugeklappt (Entscheid David 5.8.2026) — die
    // tiefe Zeile entsteht erst durch den Sprung auf ihren Elternast.
    await zeile(page, DRITTE_ABTEILUNG).click()
    await scrollSettle(page)
    await expect(zeile(page, AG_TITEL)).toBeVisible()

    await zeile(page, AG_TITEL).click()
    await scrollSettle(page)

    const lage = await kopfLage(page, AG_TITEL)
    expect(lage.landepunkt).toBeGreaterThan(0)
    expect(lage.top).toBeGreaterThanOrEqual(lage.landepunkt - 4)
    expect(lage.top).toBeLessThanOrEqual(lage.landepunkt + 40)

    await page.waitForTimeout(1200)
    const marke = await markeImAst(page, AG_TITEL)
    expect(marke.imAst, `Marke steht ausserhalb des gesprungenen Astes: «${marke.text}»`).toBe(true)
  })
})
