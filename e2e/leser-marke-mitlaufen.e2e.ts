// @shard-gruppe: 6
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
import { linienOrakelInstallieren } from './helpers/bezugslinie'

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

/** ZWEITE, ORDINALE MESSUNG derselben Lesestrecke (Schärfung 18.9.2026).
 *
 *  WARUM ES SIE BRAUCHT — die Lücke, die eine Gegenprüfung KONSTRUIERT hat:
 *  Die drei Proben oben fragen «schnell genug?» (erste Marke ≤ 1500 ms, Lücke
 *  ≤ 500 ms, ≥ 5 Etiketten). Wer die Sofort-Zuweisung durch eine kurze
 *  Trailing-Entprellung ersetzt — gemessen: 120 ms, also deutlich unter den
 *  kaputten 200 ms —, bleibt in allen dreien GRÜN. Ein Rückfall auf eine kurze
 *  Entprellung rutscht damit durch, und «die Marke friert beim Lesen ein» ist
 *  genau der Defekt vom 18.9.2026, nur langsamer.
 *
 *  DAS KRITERIUM HÄNGT DARUM NICHT AN DER WANDUHR, sondern an der ORDNUNG des
 *  Dokuments: gemessen wird der RÜCKSTAND DER MARKE IN GLIEDERUNGS-EINTRÄGEN.
 *  Je Probe stehen zwei Zahlen nebeneinander, beide im selben synchronen Block
 *  gelesen:
 *   SOLL  — der letzte gerenderte Gliederungs-Eintrag, dessen Abschnitt bei
 *           oder vor dem Artikel an der Bezugslinie beginnt. Jeder Eintrag
 *           verlinkt den ersten Artikel seines Abschnitts (`href="#art-14"`),
 *           die Artikel-Reihenfolge im DOM ist die Dokumentordnung — die
 *           Zuordnung ist also GELESEN, nicht nachgebaut. Welcher Artikel an
 *           der Linie liegt, entscheidet dasselbe Orakel wie in
 *           `e2e/leser-spy-w25d.e2e.ts` (`messen`); dort steht die Herleitung
 *           der Linie (`scroll-margin-top` + 8) und der Zwischenraum-Regel.
 *           Seit W2·29 S3 (23.9.2026) ist es EINE Funktion für beide Sonden
 *           (`helpers/bezugslinie.ts`, FAHRPLAN-LESER-V3 §16).
 *   IST   — der Eintrag, der `[data-toc-aktiv]` trägt.
 *  Rückstand = SOLL − IST, in Einträgen. Bei echter Sofort-Zuweisung ist er 0:
 *  die Marke zeigt den Abschnitt, in dem der Leser steht. JEDE Trailing-
 *  Entprellung zeigt systematisch einen FRÜHEREN — und zwar umso mehr, je
 *  dichter die Artikelgrenzen kommen, weil ihr Timer dann neu angesetzt statt
 *  ausgelöst wird.
 *
 *  WARUM DAS DIE RUNNER-GESCHWINDIGKEIT NICHT MITMISST: eine Ordnungszahl hat
 *  keine Einheit. Wird der Runner langsamer, wandern SOLL und IST gemeinsam
 *  langsamer durch dieselbe Liste; der Abstand zwischen ihnen ist davon
 *  unberührt. Ein langsamer Runner macht die Probe darum nicht rot, sondern
 *  höchstens milder (eine feste ms-Entprellung feuert zwischen zwei trägen
 *  Frames irgendwann doch) — sie tauscht die Lücke nicht gegen Flackern.
 *  GEMESSEN (dist/, vite preview, 1440×900, /gesetze/bund/OR, 3 × 20 × 400 px,
 *  je Zeile die VERTEILUNG über mehrere Läufe, nicht ein Einzelwert — §0 Nr. 3):
 *    Ist-Stand      3 Läufe  je 60/60 treu, kein Rückstand, 8 Einträge
 *    4× Drossel     1 Lauf      60/60 treu, kein Rückstand, 14 Einträge
 *    6× Drossel     4 Läufe  3× 60/60 treu, 1× 59/60 (ein Eintrag Rückstand
 *                            in EINER Probe), 29–31 Einträge
 *    10× Drossel    2 Läufe  je 58/59 treu, ein Eintrag Rückstand in einer
 *                            Probe, 29–30 Einträge
 *    120-ms-Entprellung       27/58 treu, 22/58 Proben ≥ 2 Einträge zurück,
 *                            max 4 (Histogramm {0:27, 1:9, 2:4, 3:3, 4:15})
 *    Original-Defekt (200 ms, Marke im Akkordeon-Timer)
 *                             0/40 treu, 39/40 Proben ≥ 2 zurück, max 4
 *                            (Histogramm {1:1, 2:10, 3:11, 4:18})
 *  DARUM STEHT DIE SCHRANKE AUF DEM ANTEIL, NICHT AUF DEM MAXIMUM: der
 *  Ist-Stand leistet sich unter schwerer Drossel EINE Probe mit einem Eintrag
 *  Rückstand (React committet einen Frame später). Ein `rueckMax ≤ 0` wäre
 *  darum ein Tor, das per Rerun grün wird, und ein `rueckMax ≤ 1` läge exakt
 *  auf dem gemessenen Rand. Geprüft wird stattdessen (a) ≥ 90 % treu und (b)
 *  höchstens 5 % der Proben ≥ 2 Einträge zurück — beides mit vollem Abstand
 *  zum Ist-Stand (0 %) UND zu beiden Defekt-Ständen (38 % / 98 %).
 *
 *  EMPFINDLICHKEITSGRENZE, damit sie niemand raten muss: eine auf 60 ms
 *  verkürzte Entprellung wurde mitgemessen und liegt bei 51/59 = 86 % treu
 *  (2 Läufe, Histogramme {0:51, 1:7, 2:1} und {0:51, 1:6, 2:2}). Sie reisst
 *  damit die 90-%-Schranke, aber knapp — und die 5-%-Schranke gar nicht. Wer
 *  hier künftig noch feiner unterscheiden will, verschiebt die 90 % nicht
 *  blind nach oben: der Ist-Stand liegt unter 10× Drossel bei 98 %, die Luft
 *  zwischen «schärfer» und «flackrig» ist genau diese Spanne.
 *
 *  Der Rückstand wird IM STOSS gemessen, nicht in der Pause: gelesen wird
 *  jeweils 60 ms nach dem Scroll-Schritt und damit vor dem nächsten. Hat
 *  dieser Schritt eine Artikelgrenze überquert — beim OR der Regelfall, die
 *  Artikel sind im Mittel ~485 px hoch —, dann wurde eine Trailing-Entprellung
 *  dabei NEU ANGESETZT und kann bis zur Messung nicht gefeuert haben, während
 *  die Sofort-Zuweisung längst committet ist. Nur ein Schritt ohne
 *  Artikelwechsel lässt die Entprellung durch; das sind die 27 treuen Proben
 *  in der Messreihe oben. Die Pausen bleiben trotzdem nötig — ohne
 *  sie hält das Ruhe-Tor den Baum zu, die Gliederung zeigt nur ihre oberste
 *  Ebene und die Messung hätte keine Auflösung (gemessen: 1 Eintrag über
 *  24'000 px statt 8 — ein Tor, das nicht scheitern kann, §6.7; genau darum
 *  steht `distinktSoll` unten als Aussagekraft-Schranke im Test). */
async function leseRueckstand(
  page: import('@playwright/test').Page, schritte: number, stoesse = 3,
) {
  await linienOrakelInstallieren(page)
  return page.evaluate(async ({ schritte, stoesse }) => {
    const artEls = [...document.querySelectorAll('[id^="art-"]')]
    const artIdx = new Map(artEls.map((el, i) => [el.id.replace(/^art-/, ''), i] as const))
    // Artikel an der Bezugslinie — das EINE Orakel (`helpers/bezugslinie.ts`).
    const orakel = (window as unknown as { __lmLinie: () => { token: string | null } }).__lmLinie
    const linienArtikel = (): string | null => orakel().token
    const messung = () => {
      const eintraege = [...document.querySelectorAll('[data-toc] a[href^="#art-"]')]
      const token = linienArtikel()
      const iLinie = token === null ? -1 : (artIdx.get(token) ?? -1)
      let soll = -1
      let marke = -1
      let monoton = true
      let letzter = -1
      for (let k = 0; k < eintraege.length; k++) {
        const i = artIdx.get(decodeURIComponent((eintraege[k].getAttribute('href') ?? '').slice(5)))
        if (i === undefined) continue
        if (i < letzter) monoton = false
        letzter = i
        if (i <= iLinie) soll = k
        if (eintraege[k].hasAttribute('data-toc-aktiv')) marke = k
      }
      return { soll, marke, monoton }
    }

    const proben: { soll: number; marke: number; monoton: boolean }[] = []
    for (let b = 0; b < stoesse; b++) {
      for (let i = 0; i < schritte; i++) {
        window.scrollBy(0, 400)
        await new Promise((r) => setTimeout(r, 60))
        proben.push(messung())
      }
      await new Promise((r) => setTimeout(r, 800))
    }

    // Vor der ERSTEN Marke ist «keine Marke» richtig (Erlass-Kopf, §8) —
    // dieselbe Abgrenzung wie in `leseZeitreihe` oben.
    const erste = proben.findIndex((p) => p.marke >= 0)
    const abErster = erste < 0 ? [] : proben.slice(erste)
    const gueltig = abErster.filter((p) => p.marke >= 0 && p.soll >= 0)
    const rueck = gueltig.map((p) => p.soll - p.marke)
    const hist: Record<string, number> = {}
    for (const r of rueck) hist[String(r)] = (hist[String(r)] ?? 0) + 1
    return {
      vis: document.visibilityState,
      proben: proben.length,
      abErster: abErster.length,
      gueltig: gueltig.length,
      treu: rueck.filter((r) => r === 0).length,
      abZwei: rueck.filter((r) => r >= 2).length,
      rueckMax: rueck.length > 0 ? Math.max(...rueck) : -1,
      rueckMin: rueck.length > 0 ? Math.min(...rueck) : -1,
      hist: JSON.stringify(hist),
      distinktSoll: new Set(gueltig.map((p) => p.soll)).size,
      distinktMarken: new Set(gueltig.map((p) => p.marke)).size,
      monotonVerletzt: proben.filter((p) => !p.monoton).length,
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

  // DIE SCHÄRFE DIESER SPEC (18.9.2026): «synchron» statt «schnell genug».
  // Herleitung, Messreihen und der konstruierte 120-ms-Halb-Fix stehen bei
  // `leseRueckstand` oben. Die drei ms-Proben bleiben daneben stehen — sie
  // decken die zwei GESICHTER des Defekts (gar keine Marke / eingefrorene
  // Marke) an einem Stand ab, an dem es noch gar keinen Rückstand zu messen
  // gäbe, weil es keine Marke gibt.
  test('OR — die Marke deckt die Bezugslinie ab (Rückstand in Gliederungs-Einträgen)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    // Opt-in-Drossel wie A33_CPU_DROSSEL in `leser-gliederung-a33.e2e.ts`:
    // belegt lokal, dass die Probe unter Last mild wird statt flackrig
    // (gemessen 4× und 6×: unverändert 60/60 treu). In CI unset → kein Effekt.
    const drossel = Number(process.env.MITLAUFEN_CPU_DROSSEL ?? '0')
    if (drossel > 1) {
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: drossel })
    }
    await page.goto('/gesetze/bund/OR')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('[data-toc]')).toBeVisible({ timeout: 10000 })

    const m = await leseRueckstand(page, 20, 3)

    // (0) MESSBEDINGUNG. Ohne `visible` läuft kein rAF-Kranz, der Spy ist tot
    //     und die ganze Messung sagt nichts (`.claude/rules/webseiten-pruefung.md`).
    expect(m.vis, `document.visibilityState war «${m.vis}» — ohne rAF misst diese Probe nichts`)
      .toBe('visible')
    // (1) PRÄMISSE DES ORAKELS: die Gliederungs-Einträge stehen in Dokument-
    //     ordnung. Wäre das verletzt, wäre «der letzte Eintrag vor der Linie»
    //     keine gültige Soll-Aussage — dann ist die Probe kaputt, nicht mild.
    expect(m.monotonVerletzt, `Gliederungs-Einträge nicht in Dokumentordnung (${m.monotonVerletzt} Proben)`).toBe(0)
    // (2) AUSSAGEKRAFT (§6.7): die Strecke muss wirklich Einträge überquert
    //     haben. Ohne diese Schranke wäre die Probe an einem zugeklappten Baum
    //     trivial grün — gemessen: 1 Eintrag über 24'000 px ohne Pausen, 8 mit.
    expect(m.distinktSoll, `nur ${m.distinktSoll} Gliederungs-Einträge überquert (${m.y} px) — Probe ohne Aussage`)
      .toBeGreaterThanOrEqual(5)
    expect(m.gueltig / Math.max(1, m.abErster), `nur ${m.gueltig}/${m.abErster} Proben messbar`)
      .toBeGreaterThanOrEqual(0.9)
    // (3) DAS KRITERIUM. Rückstand 0 = die Marke steht im Abschnitt, in dem der
    //     Leser liest. EIN Eintrag Verzug bleibt in Einzelproben erlaubt (React
    //     committet den Zustand einen Frame später, unter 6×/10× Drossel je
    //     einmal gemessen); ab ZWEI ist es eine Entprellung. Beide Schranken
    //     stehen auf Anteilen — Herleitung und Verteilungen oben.
    expect(m.treu / Math.max(1, m.gueltig), `nur ${m.treu}/${m.gueltig} Proben am richtigen Eintrag (Histogramm ${m.hist}, min ${m.rueckMin})`)
      .toBeGreaterThanOrEqual(0.9)
    expect(m.abZwei / Math.max(1, m.gueltig), `${m.abZwei}/${m.gueltig} Proben ≥ 2 Gliederungs-Einträge zurück (max ${m.rueckMax}, Histogramm ${m.hist}) — das ist eine Entprellung, keine Sofort-Zuweisung`)
      .toBeLessThanOrEqual(0.05)
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
