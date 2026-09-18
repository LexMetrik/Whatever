// @shard-gruppe: 3
// W2·5m-LESER-V3 — «Mitlaufen beim Lesen»: die Gliederung zeigt JEDERZEIT genau
// einen Standort, und er folgt dem Scrollen.
//
// WARUM ES DIESE SPEC BRAUCHT, obwohl `leser-gliederung-a33.e2e.ts` (F1) den
// Scroll-Spy längst bewacht: F1 wartet nach JEDEM 120-px-Schritt 260 ms. Genau
// dieses Stop-and-go hat den Defekt vom 18.9.2026 verdeckt — Marke und
// Auto-Akkordeon lagen in EINEM 200-ms-Trailing-Timer, den jeder Artikelwechsel
// neu ansetzt. Wer anhält, lässt ihn feuern; wer LIEST, nicht: beim
// durchgehenden Lese-Scrollen kommen die Artikelgrenzen schneller als alle
// 200 ms, der Timer verhungerte und die Leiste markierte über 24'000 px hinweg
// gar nichts (gemessen: 76/113 Proben ohne Marke lokal, 113/113 auf
// lexmetrik.vercel.app). F1 blieb dabei grün.
// DARUM SCROLLT DIESE SPEC DURCHGEHEND und misst nicht den Endzustand, sondern
// eine ZEITREIHE über die ganze Lesestrecke. Der Endzustand war auch vorher
// richtig — er entstand erst nach dem Anhalten.
//
// GEGEN DEN PRODUKTIONS-BUILD: `playwright.config.ts` fährt `webServer` lokal
// als `npm run build && npm run preview` und in CI gegen das im Job «bau»
// erzeugte `dist/`. Beides ist der Prod-Pfad — ein Test gegen `npm run dev`
// hätte den Defekt nicht gefangen (dort rendert jeder Frame teurer, die
// Artikelgrenzen kommen langsamer als 200 ms, und der Timer feuert).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

/** Lese-Scrollen + Zeitreihe der Standort-Marke, page-seitig in EINER
 *  evaluate-Reise (unter Runner-Last keine CDP-Roundtrips pro Probe).
 *
 *  `stoesse` × `schritte` à 400 px, dazwischen 800 ms Pause: echtes Lesen, nicht
 *  Stop-and-go im 260-ms-Takt (a33/F1) und nicht ein einziger Dauerzug. Beides
 *  wird gebraucht — die STÖSSE decken den verhungerten Timer auf (drin markiert
 *  die Leiste sonst gar nichts), die PAUSEN lassen das Auto-Akkordeon durch sein
 *  Ruhe-Tor und die Marke damit auf Abschnitts-/Artikeltiefe wandern. Ohne Pause
 *  bleiben die Äste zu (so gewollt: der Aufklapp-Reflow während des Scrollens war
 *  die a33-CLS-Wurzel) und die Marke steht gröber auf der obersten Ebene. */
async function leseZeitreihe(
  page: import('@playwright/test').Page, schritte: number, stoesse = 3,
) {
  return page.evaluate(async ({ schritte, stoesse }) => {
    const marken = () => document.querySelectorAll('[data-toc] [data-toc-aktiv]')
    const label = () => {
      const e = marken()[0] as HTMLElement | undefined
      return e ? (e.textContent ?? '').trim() : ''
    }
    const proben: { t: number; n: number }[] = []
    const etiketten = new Set<string>()
    const t0 = performance.now()
    let ersteMarkeMs: number | null = null
    const takt = window.setInterval(() => {
      const n = marken().length
      if (n > 0) {
        if (ersteMarkeMs === null) ersteMarkeMs = Math.round(performance.now() - t0)
        etiketten.add(label())
      }
      proben.push({ t: Math.round(performance.now() - t0), n })
    }, 50)
    // Innerhalb eines Stosses: 400 px alle 60 ms. Die OR-Artikel sind im Mittel
    // ~485 px hoch — die Bezugslinie überquert also rund alle 70 ms eine
    // Artikelgrenze und damit deutlich dichter als die 200-ms-Entprellung.
    for (let b = 0; b < stoesse; b++) {
      for (let i = 0; i < schritte; i++) {
        window.scrollBy(0, 400)
        await new Promise((r) => setTimeout(r, 60))
      }
      await new Promise((r) => setTimeout(r, 800))
    }
    window.clearInterval(takt)

    // Lücken NACH der ersten Marke: vorher ist «keine Marke» richtig (der Leser
    // steht noch über dem ersten Artikel, im Erlass-Kopf — dort etwas zu
    // markieren, behauptete einen Standort, den er nicht hat, §8).
    const abErster = ersteMarkeMs === null ? [] : proben.filter((p) => p.t >= (ersteMarkeMs as number))
    let laengsteLuecke = 0
    let offen: number | null = null
    for (const p of abErster) {
      if (p.n === 0 && offen === null) offen = p.t
      if (p.n > 0 && offen !== null) { laengsteLuecke = Math.max(laengsteLuecke, p.t - offen); offen = null }
    }
    if (offen !== null) laengsteLuecke = Math.max(laengsteLuecke, abErster[abErster.length - 1].t - offen)

    return {
      // Die Zuweisung steht im setInterval-Rückruf; TypeScript verengt den Wert
      // an dieser Stelle sonst auf `null` und die Schranke unten wäre nicht
      // formulierbar.
      ersteMarkeMs: ersteMarkeMs as number | null,
      proben: proben.length,
      abErster: abErster.length,
      ohneMarke: abErster.filter((p) => p.n === 0).length,
      mehrfach: proben.filter((p) => p.n > 1).length,
      laengsteLuecke,
      etiketten: etiketten.size,
      y: Math.round(window.scrollY),
    }
  }, { schritte, stoesse })
}

test.describe('W2·5m — Standort-Marke läuft beim Lesen mit', () => {
  // Reflow-schwerste Seite des Korpus (1686 Artikel, content-visibility) auf
  // einem 2-vCPU-Runner — dasselbe Notdach-Argument wie in a33/F1.
  test.setTimeout(240_000)

  // DER DEFEKT HAT ZWEI GESICHTER, und sie brauchen zwei verschiedene Proben —
  // beide einzeln am ungefixten Stand rot gezeigt (§6.7):
  //  (i)  Wer OHNE Pause liest, bekommt gar keine Marke: `aktivIds` startet leer
  //       und der verhungerte Timer füllt es nie.
  //  (ii) Wer MIT Pausen liest, bekommt eine Marke — aber sie friert zwischen den
  //       Pausen ein. Sie verschwindet nicht (der alte Wert bleibt stehen), sie
  //       zeigt nur den falschen Ort. Eine Lücken-Messung sieht das NICHT; nur
  //       die Zahl der distinkten Etiketten.
  test('OR — durchgehendes Lesen: die Marke erscheint sofort und bleibt', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/OR')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('[data-toc]')).toBeVisible({ timeout: 10000 })

    const m = await leseZeitreihe(page, 60, 1)

    // (1) Sie erscheint überhaupt — und zwar beim ERSTEN Artikel an der
    //     Bezugslinie, nicht erst beim Anhalten. Gemessen nach dem Fix:
    //     88 ms (OR) bzw. 52 ms (BV); ungefixt 3891 ms lokal und über dieselbe
    //     Strecke auf lexmetrik.vercel.app überhaupt keine. 1500 ms hält
    //     17-fache Marge zum Ist und bleibt eine Grössenordnung unter dem Defekt.
    expect(m.ersteMarkeMs, `erste Marke nach ${m.ersteMarkeMs} ms (Strecke ${m.y} px)`).not.toBeNull()
    expect(m.ersteMarkeMs as number, `erste Marke nach ${m.ersteMarkeMs} ms`).toBeLessThanOrEqual(1500)
    // (2) Und sie BLEIBT. Gemessen nach dem Fix: 0 von 114 Proben ohne Marke.
    //     Die Schranke lässt einen React-Commit-Verzug auf langsamen Runnern zu.
    expect(m.laengsteLuecke, `längste Lücke ohne Marke ${m.laengsteLuecke} ms`).toBeLessThanOrEqual(500)
    expect(m.ohneMarke / Math.max(1, m.abErster), `Anteil Proben ohne Marke ${m.ohneMarke}/${m.abErster}`)
      .toBeLessThanOrEqual(0.2)
    // (3) GENAU EINE (F5-Invariante, W2·19-GLIEDERUNG/S4): nie zwei Standorte.
    expect(m.mehrfach, `Proben mit mehr als einer Marke ${m.mehrfach}`).toBe(0)
    expect(fehler).toEqual([])
  })

  test('OR — die Marke wandert mit und friert nicht ein', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/OR')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('[data-toc]')).toBeVisible({ timeout: 10000 })

    const m = await leseZeitreihe(page, 20, 3)

    // Gemessen am gefixten Stand, 3 deterministisch gleiche Läufe: 11 distinkte
    // Etiketten (BV: 10). Ungefixt sind es 3 — genau die drei Pausen, in denen
    // der Timer einmal feuern durfte. Die Schranke liegt zwischen beiden und
    // hält zum Ist die Hälfte Marge.
    expect(m.etiketten, `distinkte Marken-Etiketten ${m.etiketten}`).toBeGreaterThanOrEqual(5)
    expect(m.mehrfach, `Proben mit mehr als einer Marke ${m.mehrfach}`).toBe(0)
    expect(fehler).toEqual([])
  })

  test('OR — der markierte Eintrag bleibt im Sichtfeld der Gliederung', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/OR')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('[data-toc]')).toBeVisible({ timeout: 10000 })

    // 3 × 30 Schritte ≙ 36'000 px. Die Strecke ist GEMESSEN, nicht gegriffen:
    // mit abgeschaltetem Mitscroll-Nudge (Sabotage-Probe §6.7) liegt die Marke
    // bei 2 × 20 noch zufällig im Sichtfeld (unter = −165 px) und der Wächter
    // wäre einer, der nicht scheitern kann. Ab 3 × 30 läuft sie ohne Nudge klar
    // heraus (unter = +592 px, [data-toc].scrollTop bleibt 0).
    await leseZeitreihe(page, 30, 3)
    // Nach dem Anhalten einschwingen lassen (F3-Entprellung 200 ms + Ruhe-Tor
    // AUTO_AUF_RUHE_MS 200 ms + Mitscroll-Nudge).
    await page.waitForTimeout(1200)

    const lage = await page.evaluate(() => {
      const cont = document.querySelector('[data-toc]') as HTMLElement | null
      const el = cont?.querySelector('[data-toc-aktiv]') as HTMLElement | null
      if (!cont || !el) return null
      const cr = cont.getBoundingClientRect()
      const er = el.getBoundingClientRect()
      // Zone A (Standort-Pfad/Quickjump) klebt INNERHALB des Scrollers und
      // verdeckt dessen oberste Pixel — dieselbe Messung wie der Nudge
      // (inhalt-hooks.tsx: `--toc-deckel`), sonst gälte als «sichtbar», was
      // unter dem Sockel liegt.
      const marke = parseFloat(getComputedStyle(cont).getPropertyValue('--toc-deckel'))
      const zoneA = cont.querySelector('[data-toc-zone-a]') as HTMLElement | null
      const deckel = Number.isFinite(marke) && marke > 0 ? marke : (zoneA?.getBoundingClientRect().height ?? 0)
      return {
        ueber: Math.round((cr.top + deckel) - er.top), // > 0 ⇒ oben verdeckt
        unter: Math.round(er.bottom - cr.bottom),      // > 0 ⇒ unten abgeschnitten
        label: (el.textContent ?? '').trim().slice(0, 60),
      }
    })
    expect(lage, 'keine Marke im [data-toc] gefunden').not.toBeNull()
    expect(lage!.ueber, `Marke «${lage!.label}» ${lage!.ueber} px über dem Sichtfeld`).toBeLessThanOrEqual(0)
    expect(lage!.unter, `Marke «${lage!.label}» ${lage!.unter} px unter dem Sichtfeld`).toBeLessThanOrEqual(0)
    expect(fehler).toEqual([])
  })
})
