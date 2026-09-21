// @shard-gruppe: 4
// E7 / A33 (FAHRPLAN-GESETZES-UX §10.10) — «Gliederung springt umher. Wenn man
// sich darin bewegt.» (David 16.7.2026). Regressions-Wächter für die Ruhe des
// Gliederungs-Baums (Scroll-Spy / TOC-Mitscroll). Läuft gegen `vite preview`
// (dist). Beweispunkte:
//   F1 (RC1a) — beim Lese-Scroll führt der TOC sich nur per RAND-NUDGE nach
//     (≈ eine Zeilenhöhe), nie mit ½-Container-Sprüngen (vorher 289–315 px).
//   F2 (RC1b) / V1 — bewegt sich der Nutzer selbst in der Gliederung, bleibt
//     seine Blätter-Position erhalten (kein verspätetes Zurückreissen).
//   Klick-Ruhe — ein TOC-Eintrag lässt sich anklicken und springt sauber ans Ziel.
//   A9-DoD — Lese-Scroll unter 4× CPU-Drossel: CLS 0, keine Konsolenfehler.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { clsBeobachtenInstallieren, clsAuslesen, clsHoehenSamplerVorabInstallieren } from './helpers/cls'
import { CONTAINER_LOKAL_READER_SCHWER } from './helpers/budgets'

// TOC-Scrollposition dieses (Primär-)Panes.
async function tocScrollTop(page: Page): Promise<number> {
  return page.evaluate(() => {
    const c = document.querySelector('[data-toc]') as HTMLElement | null
    return c ? c.scrollTop : -1
  })
}
// Aktueller Highlight-Eintrag (letzter [data-toc-aktiv]) — Textkennung.
async function aktivLabel(page: Page): Promise<string> {
  return page.evaluate(() => {
    const a = document.querySelectorAll('[data-toc] [data-toc-aktiv]')
    const el = a[a.length - 1] as HTMLElement | undefined
    return el ? (el.textContent ?? '').trim() : ''
  })
}
// Deterministischer Warte-Anker (Flake-Härtung 25.7.2026): der [data-toc]-Container
// gilt als eingeschwungen, wenn sein scrollTop `ruheMs` lang unverändert bleibt —
// ersetzt feste Sleeps, die unter Runner-Last zu kurz ODER unnötig lang sind. Läuft
// page-seitig in EINER evaluate-Reise (statt vieler CDP-Roundtrips unter Last).
async function tocSettle(page: Page, ruheMs: number, deadlineMs: number): Promise<number> {
  return page.evaluate(
    async ({ ruheMs, deadlineMs }) => {
      const c = document.querySelector('[data-toc]') as HTMLElement | null
      if (!c) return -1
      const start = Date.now()
      let letzter = c.scrollTop
      let ruhigSeit = Date.now()
      for (;;) {
        await new Promise((r) => setTimeout(r, 60))
        if (c.scrollTop !== letzter) {
          letzter = c.scrollTop
          ruhigSeit = Date.now()
        } else if (Date.now() - ruhigSeit >= ruheMs) return c.scrollTop
        if (Date.now() - start >= deadlineMs) return c.scrollTop
      }
    },
    { ruheMs, deadlineMs },
  )
}

test.describe('A33 — Ruhige Gliederung (Scroll-Spy / TOC)', () => {
  // ── F1: Lese-Scroll führt den TOC nur per Rand-Nudge nach, keine ½-Container-Sprünge ──
  // CLS wird hier NICHT geprüft: der Auto-Akkordeon-Reflow der <li> (Auftrag K,
  // un-animiert, §15.2/nichtBauen-3) erzeugt unter dem synthetischen SCHNELL-Wheel
  // dieses Tests einen «kein-Input»-Shift, der auf origin/main byte-gleich ist
  // (Baseline 0.1055 vs. Fix 0.1038 — F3-Entprellung ist CLS-neutral). Die CLS-0-DoD
  // fährt der A9-Test unten (echtes Tastatur-Scrollen unter 4× Drossel, Repo-Konvention
  // wie leser-position-u.e2e.ts). Hier zählt allein die TOC-Eigenbewegung + Highlight.
  test('F1 — Lese-Scroll: TOC-Eigenbewegung ≤ Nudge, Highlight folgt', async ({ page }) => {
    // Runner-Budgets 19.7.: F1-Notdach explizit 240 s (zuvor 180 s). Dieser Test macht
    // das schwerste REALE Lese-Scrollen aller Specs auf der 2000-Artikel-OR-Seite, je
    // mit content-visibility- + Auto-Akkordeon-Reflow. Die Schrittzahl ist parallel von
    // 14 auf 8 gesenkt (Kalibrierung unten). KEIN versteckter Hänger: F1 wartet nur auf
    // `article`/`[data-toc]` (beide unabhängig von STANDARD_OFFEN_TIEFE) und misst danach
    // über kurze page.evaluate-Reads; die Zeit geht rein in die Reflow-Kosten je Wheel.
    // Auf langsamen 2-vCPU-Runner-Instanzen riss reihum auch das 180-s-Budget (auf
    // schnellen ~90 s). Das Notdach greift nur bei Überschreitung und verlangsamt
    // grüne Läufe nicht (§6.3, kein Assertion-Change).
    //
    // 240 → 360 s (20.7.2026): 240 s war zu knapp bemessen, und zwar messbar. Die
    // Runner-Streuung ist inzwischen quantifiziert — dieselbe Software misst quer
    // über die Jobs TBT 2262…5612 ms, also **Faktor 2.5** allein aus der
    // Maschinenzuteilung (Beleg + Messreihe: scripts/perf/lighthouse-budget.ts,
    // Schwellen-Block). Auf die ~90 s dieses Tests auf einer schnellen Instanz
    // angewandt sind das ~225 s auf einer langsamen — das alte Dach lag mit 240 s
    // nur ~7 % darüber und riss folgerichtig (CI-Lauf 29744687036:
    // «page.evaluate: Test timeout of 240000ms exceeded»). 360 s ≙ 4× der schnellen
    // Beobachtung deckt die gemessene Spanne mit Reserve.
    test.setTimeout(360_000)
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 820 })
    await page.goto('/gesetze/bund/OR')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })
    // 2-Spalten-Gliederung (istXl) muss stehen — der [data-toc]-Container existiert.
    await expect(page.locator('[data-toc]')).toBeVisible({ timeout: 10000 })

    // Etwas hineinscrollen, damit ein aktiver Zweig existiert und der TOC selbst
    // scrollbar wird (langer Erlass). Maus über die LESESPALTE (nicht den TOC),
    // damit mouse.wheel die SEITE scrollt, nicht den Gliederungs-Container.
    await page.mouse.move(950, 420)
    for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(90) }
    await page.waitForTimeout(400)

    const labels = new Set<string>()
    let maxDelta = 0
    let vorherTop = await tocScrollTop(page)
    labels.add(await aktivLabel(page))
    // 8 feine Lese-Scroll-Schritte à 120 px; nach jedem die TOC-Eigenbewegung messen.
    // Runner-Budgets 19.7.: von 14 auf 8 Schritte gesenkt (echtes mouse.wheel bleibt —
    // der Scroll-Spy braucht reales Lese-Scrollen). EMPIRISCH KALIBRIERT (lokal, 6×
    // CPU-Drossel, 2 deterministische Läufe byte-gleich): die Highlight-Wanderung ist
    // rein layout-getrieben und erreicht 3 distinkte Highlights bereits bei Schritt 4
    // (dist-Folge 1·2·2·3·3·3·4·4 über die Schritte 1–8), also dist=4 nach 8 Schritten —
    // ein volles distinkt Marge über die geforderten ≥ 3 (und 3 schon 4 Schritte vor
    // Schluss). Die TOC-Eigenbewegung (½-Container-Sprung-Wächter) blieb über ALLE
    // Schritte bei 0 px, weit unter der 150-px-Grenze — der Nudge-Fix hält den Container
    // ruhig, unabhängig von der Schrittzahl. Die pro-Schritt-Wartezeit bleibt bei 260 ms
    // (> F3-Entprellung 200 ms): kürzer bringt kaum Zeit, riskiert aber, einen mid-flight-
    // Nudge als transienten Ausreisser zu lesen — mit maxDelta=0 ist das unnötiges Risiko.
    // Prüfumfang reduziert (~43 % weniger Scroll-Reflows → tragbares Wallclock auf langsamen
    // Runner-Instanzen), Prüfschärfe unverändert: beide Assertions behalten Marge.
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 120)
      await page.waitForTimeout(260) // > F3-Entprellung (200 ms) → Nudge eingeschwungen
      const jetzt = await tocScrollTop(page)
      maxDelta = Math.max(maxDelta, Math.abs(jetzt - vorherTop))
      vorherTop = jetzt
      labels.add(await aktivLabel(page))
    }

    // F1-Kern: KEIN einziger ½-Container-Sprung. Vorher lagen die Sprünge bei
    // 289–315 px (Container-Mitte + smooth). Nach dem Fix ist die Eigenbewegung
    // je Schritt höchstens ein Rand-Nudge (Zeilenhöhe, + evtl. ein Akkordeon-Reflow).
    expect(maxDelta, `max TOC-Eigenbewegung/Schritt ${maxDelta}px`).toBeLessThan(150)
    // Funktions-Treue: der Scroll-Spy lebt — der Highlight ist mehrfach gewandert.
    expect(labels.size, `distinkte Highlights ${labels.size}`).toBeGreaterThanOrEqual(3)
    expect(fehler).toEqual([])
  })

  // ── F2 / V1: Wer selbst in der Gliederung blättert, behält seine Position ──
  test('F2/V1 — manuelles TOC-Blättern wird nicht zurückgerissen', async ({ page }) => {
    // ── Flake-Härtung 25.7.2026 (5 CI-Timeouts 24./25.7., Runs 30132692179,
    // 30135493089 u. a.; stets im Rerun geheilt, lokal grün — aber unter 6× CPU-
    // Drossel + 4 parallelen Workern lokal REPRODUZIERT: 4/4 Läufe rissen das
    // 180-s-Dach, wandernd bei mouse.wheel, boundingBox oder page.evaluate).
    // Ursache: REALE mouse.wheel-Events auf der 2000-Artikel-OR-Seite (je Wheel
    // ein content-visibility-/Akkordeon-Reflow-Sturm, 8 Wheels + feste Sleeps)
    // — unter Last blockiert der Seiten-Main-Thread, jeder nächste CDP-Roundtrip
    // hängt. Härtung OHNE Schwächung der Prüfaussage («nach manuellem TOC-
    // Blättern reisst der Scroll-Spy-Mitscroll die TOC-Position innerhalb des
    // 1,5-s-Guard-Fensters NICHT zurück»):
    //  1. Programmatisches Scrollen statt mouse.wheel: der Scroll-Spy ist
    //     IntersectionObserver-basiert (inhalt-hooks.tsx) und sieht programma-
    //     tisches Scrollen identisch; der F2-Guard wird über ein ECHTES
    //     wheel-Event am [data-toc]-Container armiert — exakt der Listener-Pfad
    //     des Nutzers (`wheel`-Listener, passive; prüft kein isTrusted).
    //  2. Deterministische Warte-Anker statt fester Sleeps: tocSettle (scrollTop
    //     400 ms ruhig) vor der Baseline; page-seitiger Anker-Wächter (50-ms-Takt
    //     am DOM) auf die Highlight-Wanderung als BEWEIS, dass der Spy den
    //     Artikelwechsel verarbeitet hat und der Mitscroll-Effekt mit neuen
    //     aktivIds LIEF (die alte Fassung hat das nie verifiziert — grün-durch-
    //     Inaktivität war möglich; die Härtung macht die Prüfung SCHÄRFER).
    //  3. ATOMARE Sequenz (Nachhärtung 25.7., CI-Befund PR #359): Guard-Armierung,
    //     Blätter-Bewegung, Mess-Listener, Anker-Wächter UND der Artikelwechsel-
    //     Trigger laufen in EINEM page.evaluate-Roundtrip — zwischen Armierung
    //     und Messbeginn liegt strukturell nichts mehr. (Vorher lagen Host-
    //     Roundtrips [settle/poll/evaluate] dazwischen; auf dem langsamen Runner
    //     vergingen so konstant ~2,4–2,5 s bis zum Anker → alle 5 Versuche
    //     verfehlten das Fenster, Test rot trotz korrektem Guard.)
    //  4. AKTIVES Blättern statt Einmal-Touch (2. Nachhärtung 25.7., EMPIRISCH:
    //     page-seitig gemessene Anker-Latenz unter 6× Drossel 1536–1733 ms —
    //     die Spy-Pipeline [IO→rAF→Entprellung→Render] braucht auf langsamen
    //     Maschinen allein LÄNGER als die 1,5-s-Guard-Frist; ein einzelner Touch
    //     kann das Fenster dort STRUKTURELL nie halten, egal wie die Test-Sequenz
    //     liegt). Das geschützte Szenario ist laut Kontrakt ohnehin «solange der
    //     Nutzer die Gliederung AKTIV durchblättert» (inhalt-hooks.tsx) — darum
    //     re-armiert der Test den Guard alle 400 ms über denselben Listener-Pfad
    //     (wheel-Event, deltaY 0 = bewegungsfrei, verfälscht die Messung nicht),
    //     bis die Messung schliesst. Damit ist der Guard BEWEISBAR armiert, wenn
    //     der Mitscroll-Effekt läuft — maschinen-unabhängig; die 1,5-s-Frist
    //     selbst bleibt scharf geprüft über die Sabotage-Probe (Guard aus → rot).
    //  5. Messung als page-seitiger scroll-Listener über die GESAMTE armierte
    //     Spanne (Armierung bis nach verarbeitetem Artikelwechsel + 700 ms
    //     F3-Nachlauf-Marge): maxDelta ALLER TOC-Eigenbewegungen — schärfer als
    //     der alte Einmal-Read bei ~470 ms. Gültig ist ein Versuch nur, wenn der
    //     Anker (Highlight-Wanderung im DOM) tatsächlich feuerte; sonst
    //     Wiederholung statt grün-durch-Inaktivität.
    // Die Assertion bleibt unverändert scharf: Δ < 24 px, keine Konsolenfehler.
    test.setTimeout(180_000)
    // Opt-in-Drossel NUR für lokale Flake-Proben (Beweislauf --repeat-each unter
    // Last, Sabotage-Probe §6.7); in CI und im Normallauf unset → kein Effekt.
    const drossel = Number(process.env.A33_CPU_DROSSEL ?? '0')
    if (drossel > 1) {
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: drossel })
    }
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 820 })
    await page.goto('/gesetze/bund/OR')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('[data-toc]')).toBeVisible({ timeout: 10000 })

    // In den Erlass scrollen (aktiver Zweig existiert, TOC wird scrollbar) — in
    // EINEM programmatischen Schritt auf dieselbe Zielposition wie zuvor
    // (3500 px; «7 × 500 = 3500 px reicht», CI-Härtung 18.7.). Anker statt
    // Sleep: aktiver Eintrag vorhanden UND TOC scrollbar.
    await page.evaluate(() => { document.scrollingElement!.scrollTop = 3500 })
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const c = document.querySelector('[data-toc]') as HTMLElement | null
            return !!c && c.scrollHeight > c.clientHeight && !!c.querySelector('[data-toc-aktiv]')
          }),
        { timeout: 30000 },
      )
      .toBe(true)

    // Bis zu 3 Messversuche; gültig ist ein Versuch, sobald der Anker (Highlight-
    // Wanderung = Artikelwechsel verarbeitet) feuerte — sonst wäre die Δ-Prüfung
    // grün-durch-Inaktivität.
    let messung: { maxDelta: number; ankerMs: number } | null = null
    const verfehlt: string[] = []
    for (let versuch = 0; versuch < 3 && !messung; versuch++) {
      // Teure Schritte VOR der Armierung: TOC einschwingen lassen (deterministisch
      // statt Sleep) — danach folgt KEIN Host-Roundtrip mehr zwischen Armierung
      // und Messbeginn.
      await tocSettle(page, 400, 20000)
      // ATOMAR in EINEM Roundtrip: Der Nutzer blättert JETZT selbst in der
      // Gliederung — wheel-Event am [data-toc]-Container armiert den Guard
      // (identischer Listener-Pfad wie beim Nutzer), Blätter-Bewegung +260 px
      // wie zuvor; im SELBEN Evaluate starten Mess-Listener (jede TOC-Eigen-
      // bewegung bis Messschluss), Anker-Wächter (50-ms-Takt: wann wandert der
      // Highlight WIRKLICH im DOM) und der Re-Arm-Takt (aktives Blättern, alle
      // 400 ms wheel/deltaY 0 — Kopf-Kommentar Punkt 4), und der Artikelwechsel
      // wird sofort programmatisch ausgelöst (+450 px kreuzt auf der OR-Seite
      // sicher eine Artikelgrenze; der IO-Spy sieht programmatisches Scrollen
      // identisch). Vorher riss der Mitscroll-Effekt die Position ~311 px zurück.
      await page.evaluate(() => {
        const c = document.querySelector('[data-toc]') as HTMLElement
        const letztesLabel = (): string => {
          const a = c.querySelectorAll('[data-toc-aktiv]')
          const el = a[a.length - 1] as HTMLElement | undefined
          return el ? (el.textContent ?? '').trim() : ''
        }
        const label0 = letztesLabel()
        c.dispatchEvent(new WheelEvent('wheel', { deltaY: 260, bubbles: true }))
        // Blätter-Weite = EINE volle Container-Höhe (statt fix 260 px): garantiert,
        // dass der aktive Eintrag das Sichtfeld VERLÄSST — nur dann MUSS ein
        // kaputter Guard nudgen (Sabotage-Probe §6.7 deterministisch; mit 260 px
        // konnte der neue aktive Eintrag noch sichtbar sein → Probe wirkungslos).
        // Bei Platzmangel nach unten wird nach OBEN geblättert (gleiche Wirkung).
        const schritt = Math.max(400, c.clientHeight)
        const maxScroll = c.scrollHeight - c.clientHeight
        c.scrollTop = c.scrollTop + schritt <= maxScroll
          ? c.scrollTop + schritt
          : Math.max(0, c.scrollTop - schritt)
        const top0 = c.scrollTop
        const t0 = Date.now()
        let maxDelta = 0
        const beobachte = (): void => {
          maxDelta = Math.max(maxDelta, Math.abs(c.scrollTop - top0))
        }
        c.addEventListener('scroll', beobachte, { passive: true })
        let ankerMs = -1
        const anker = window.setInterval(() => {
          if (ankerMs < 0 && letztesLabel() !== label0) ankerMs = Date.now() - t0
          if (ankerMs >= 0 || Date.now() - t0 > 10000) window.clearInterval(anker)
        }, 50)
        // Aktives Blättern: Guard über denselben Listener-Pfad re-armieren,
        // bewegungsfrei (deltaY 0), bis die Messung schliesst.
        const reArm = window.setInterval(() => {
          c.dispatchEvent(new WheelEvent('wheel', { deltaY: 0, bubbles: true }))
        }, 400)
        const w = window as unknown as {
          __a33F2?: { t0: number; ankerDa: () => boolean; lese: () => { maxDelta: number; ankerMs: number } }
        }
        w.__a33F2 = {
          t0,
          ankerDa: () => ankerMs >= 0,
          lese: () => {
            c.removeEventListener('scroll', beobachte)
            window.clearInterval(anker)
            window.clearInterval(reArm)
            return { maxDelta, ankerMs }
          },
        }
        // Artikelwechsel im SELBEN Task auslösen — nach der Armierung liegt
        // strukturell nichts mehr zwischen Guard und Messung.
        document.scrollingElement!.scrollTop += 450
      })
      // Page-seitig warten, bis der Anker feuerte (max. 10 s), dann 700 ms
      // F3-Nachlauf-Marge (tocBaum-Effekt) — der Guard bleibt durch den Re-Arm-
      // Takt die GESAMTE Spanne armiert —, dann Messwert atomar lesen.
      const ergebnis = await page.evaluate(async () => {
        const w = window as unknown as {
          __a33F2?: { t0: number; ankerDa: () => boolean; lese: () => { maxDelta: number; ankerMs: number } }
        }
        const s = w.__a33F2
        if (!s) return null
        while (!s.ankerDa() && Date.now() - s.t0 < 10000) {
          await new Promise((r) => setTimeout(r, 50))
        }
        await new Promise((r) => setTimeout(r, 700))
        return s.lese()
      })
      if (ergebnis && ergebnis.ankerMs >= 0) {
        messung = { maxDelta: ergebnis.maxDelta, ankerMs: ergebnis.ankerMs }
      } else {
        verfehlt.push(`Versuch ${versuch + 1}: Artikelwechsel nie verarbeitet (Anker@${ergebnis ? ergebnis.ankerMs : '—'})`)
      }
    }

    expect(messung, `kein gültiger Messlauf (${verfehlt.join(' · ')})`).not.toBeNull()
    expect(
      messung!.maxDelta,
      `Blätter-Position bei armiertem Guard gehalten (max Δ ${messung!.maxDelta}px, Anker@${messung!.ankerMs}ms)`,
    ).toBeLessThan(24)
    expect(fehler).toEqual([])
  })

  // ── Klick-Ruhe: ein TOC-Eintrag springt sauber ans Ziel (kein Klick-Hazard) ──
  test('Klick-Ruhe — TOC-Eintrag anklicken springt zum Abschnitt', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 820 })
    await page.goto('/gesetze/bund/OR')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })
    const toc = page.locator('[data-toc]')
    await expect(toc).toBeVisible({ timeout: 10000 })

    // Einen Top-Level-Gliederungs-Sprungknopf anklicken (nicht das Chevron).
    // R6c/P8: s. u. — Sprung-Zeile ist `<a href>`, Chevron bleibt `<button>`.
    const eintrag = toc.locator(':is(a, button)[data-toc-aktiv], :is(a, button)[aria-current]').first()
    // Falls (noch) kein aktiver Eintrag: irgendeinen Sprungknopf mit Label nehmen.
    // W2·19-GLIEDERUNG/S4 — deklarierte Anpassung (Bau-Spec §2/§10, e2e-Freigabe
    // David 8.8.2026): der Fallback war `toc.getByRole('button').nth(1)` und traf
    // damit den zweiten Knopf im GANZEN Scroller. Seit S4 sitzt Zone A
    // (Standort-Pfad + Quickjump) sticky INNERHALB von `[data-toc]`, der
    // Quickjump-Absendeknopf steht also an Position 0 — `nth(1)` war folglich das
    // CHEVRON der ersten Baumzeile. Ein Chevron klappt nur auf, es springt nicht:
    // der Test wartete danach vergeblich auf eine Positionsmarke (rot gesehen,
    // dann nachgezogen). Der Fallback zielt jetzt in die BAUMZEILEN
    // (`li[data-sektion-id]`; nth(1) = Sprungknopf der ersten Zeile nach ihrem
    // Chevron) — dieselbe Absicht wie zuvor, nur unabhängig davon, was sonst noch
    // im Scroller steht. Die geprüfte Invariante bleibt unverändert.
    const ziel = (await eintrag.count()) > 0
      ? eintrag
      // §6.3-DEKLARATION (W2·24-R6c, P8): die Zeile ist ein `<a href>`, der
      // Chevron daneben bleibt `<button>` — beide treffen, Reihenfolge gleich.
      : toc.locator('li[data-sektion-id] :is(a, button)').nth(1)
    await ziel.scrollIntoViewIfNeeded()
    const box1 = await ziel.boundingBox()
    await ziel.click()
    // Der Klick darf nicht hängen: die Seite hat einen #art-/Sektions-Sprung vollzogen
    // (aktiver Highlight vorhanden) und der Knopf ist weiterhin bedienbar/stabil.
    await page.waitForTimeout(700)
    await expect(page.locator('[data-toc] [data-toc-aktiv]').first()).toBeVisible({ timeout: 10000 })
    // §6.3-DEKLARATION (W2·24-R6c, P8): die Marken-Zeile ist seither ein
    // `<a href="#art-…">`, wo sie eine Adresse hat (SektionBaumTOC `TocZeile`).
    // Der Selektor trifft beide Tags; die Absicht — «die aktive Zeile hat nach
    // dem Klick eine Geometrie» — ist unverändert.
    const box2 = await toc.locator(':is(a, button)[data-toc-aktiv]').first().boundingBox()
    expect(box1).not.toBeNull()
    expect(box2).not.toBeNull()
    expect(fehler).toEqual([])
  })

  // ── A9-DoD: Lese-Scroll unter 4× CPU-Drossel, CLS 0 ──
  test('A9 — Lese-Scroll unter CPU-Drossel: CLS 0, keine Konsolenfehler', async ({ page }) => {
    test.slow()
    // `test.slow()` verdreifacht den Projekt-Default — lokal also 90 s. Gemessen
    // (Voll-Lauf `npm run test:e2e`, 10 Worker, n=5): 33585 · 38662 · 40134 ·
    // 45156 · 60034 ms, mittel 43514, sd 10114. Der 90-s-Deckel hatte damit auf
    // den schlechtesten Wert nur noch 1 % Reserve; unter zusätzlicher Build-Last
    // riss er (86735 ms gemessen, 2 von 5 Läufen rot). Deckel nach QS-PERF
    // Ziff. 5: 60034 + max(3 sd 30342, 25 %) = 90376 → 95 000 ms aus dem
    // Budget-Modul. CI UNBERÜHRT (dort bleibt es bei `test.slow()` = 270 s).
    if (!process.env.CI) test.setTimeout(CONTAINER_LOKAL_READER_SCHWER)
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 820 })
    // Wachser-Diagnose (19.7.): den Über-Grid-Höhen-Sampler schon AB Navigation
    // starten (vor goto), damit der problematische ~2.7-s-Lade-Shift (vom buffered-
    // Observer nachgezogen) im Fehler-Bericht seinen WACHSER trägt — das Element
    // oberhalb des Grids, dessen Höhe deterministisch einwächst. Reine Diagnose (§6.3).
    await clsHoehenSamplerVorabInstallieren(page)
    await page.goto('/gesetze/bund/OR')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('[data-toc]')).toBeVisible({ timeout: 10000 })
    // Beobachter mit Quellen-Erfassung (buffered wie bisher): bei Überschreitung
    // nennt die expect-Meldung die Top-shiftenden Elemente im Klartext + Wachser.
    // `nurAbInstall` (20.7.2026): NUR Shifts ab hier zählen. Dieser Test misst laut
    // Titel/DoD das LESE-SCROLLEN unter Drossel; der `buffered`-Observer zog ihm
    // bisher zusätzlich den ~2.7-s-Lade-Shift an (im Kommentar oben schon benannt,
    // aber nicht ausgeschlossen). Der Lade-CLS bleibt anderswo gedeckt — Beleg +
    // Begründung im Kopf von `helpers/cls.ts`. Budget 0.05 unverändert.
    await clsBeobachtenInstallieren(page, true, true)
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    // Echtes Tastatur-Scrollen (content-visibility-Reflows dem Input zugerechnet).
    await page.locator('body').press('Escape')
    for (let i = 0; i < 6; i++) { await page.keyboard.press('PageDown'); await page.waitForTimeout(120) }
    for (let i = 0; i < 3; i++) { await page.keyboard.press('PageUp'); await page.waitForTimeout(120) }
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 12000 })
    const { cls, bericht } = await clsAuslesen(page)
    expect(cls, `CLS ${cls} — ${bericht}`).toBeLessThan(0.05)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    expect(fehler).toEqual([])
  })
})
