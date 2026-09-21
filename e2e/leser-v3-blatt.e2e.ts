// @shard-gruppe: 2
// ═══ H2b-NACHZUG · DAS BLATT UND DAS KÜRZEL (A2 · A3 · Ä32 · B11) ═══════════
//
// Diese Spec deckt die Befunde, die nur im echten Browser sichtbar sind, weil sie
// an FOKUS und OVERLAY hängen — genau das, was ein Screenshot nicht zeigt.
//
//  A2  Bei offenem Treffer-Blatt @390 fokussierte Ctrl+K das VERDECKTE Kopf-Feld
//      (`sheet.contains(activeElement) === false`), Tippen landete unsichtbar
//      («KostenX» im Feld hinter dem Overlay), und Esc leerte das Feld statt das
//      Blatt zu schliessen (`blattOffen: true`, `feldWert: ''`). Zugleich war im
//      Blatt gar kein Feld erreichbar (`felderImBlatt: 0`) — vor H2b lag eines
//      darin. Gemessen 17.8.2026, StPO, Suche «Kosten».
//  A3  Im Split @1600 registriert jedes Pane seit Ä19 einen ⌘K-Listener am
//      Fenster; der zuletzt registrierte gewann. Gemessen: Fokus im primären
//      Pane, Ctrl+K ⇒ Fokus im SEKUNDÄREN (`imPrimaer:false, imSekundaer:true`),
//      und ebenso in der anderen Richtung. Das Kürzel bediente nie das Pane, in
//      dem der Leser arbeitet.
//  Ä32 Im TREFFER-Blatt standen «Sie sind hier — Noch keine Leseposition
//      erfasst.» und die Erlass-Übersichtszeile, und die Knopfgruppe «⌄ alles auf
//      ↑ Anfang» hing etikettlos rechts.
//  B11 Der ✕ des Blatts hiess immer «Gliederung schliessen» — auch wenn über ihm
//      «Treffer» stand.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

/**
 * Suche starten UND das Bottom-Sheet öffnen (@390, Feld im klebenden Kopf).
 *
 * §6.3-UMSTELLUNG D38 (7.9.2026): der Helfer hiess `trefferBlattOeffnen` und
 * zog das Sheet über die Zähler-Zeile auf, weil DORT die Trefferliste lag. Seit
 * D38 liegt sie über der Lesespalte und das Sheet zeigt in jedem Zustand die
 * Gliederung — geöffnet wird es darum über ☰, wie ohne Suche auch. Was diese
 * Spec prüft, ist davon unberührt: A2 (Fokus und Esc gehören dem offenen
 * Overlay) und A3 (⌘K bedient das eigene Pane) sind Aussagen über den DIALOG,
 * nicht über seinen Inhalt.
 */
async function sheetBeiSucheOeffnen(page: Page, begriff: string): Promise<void> {
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await page.locator('[data-v3-such-zone] input').fill(begriff)
  await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 20_000 })
  await page.locator('[data-v3-gliederung-auf]').first().click()
  await expect(page.locator('[data-gliederung-sheet]')).toBeVisible({ timeout: 15_000 })
}

test.describe('A2 — bei offenem Blatt bleibt die Bedienung im Blatt', () => {
  // ROT ZU BEKOMMEN (§6.7): in `v3/LeserRahmenV3.tsx` `sprungFeld={suchFeld}` am
  // `GliederungSheet` entfernen ⇒ (a) `imDialog` false, `felderImBlatt` 0;
  // `escLeert={!blattOffen}` auf `escLeert` (also true) ⇒ (b) Blatt bleibt offen
  // und das Feld ist geleert. Beide Fälle so gemessen (Ist-Stand vor dem Nachzug).
  test('(a) ⌘K fokussiert das Feld IM Blatt, und Tippen ist sichtbar', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await sheetBeiSucheOeffnen(page, 'Kosten')

    await page.keyboard.press('Control+k')

    const lage = await page.evaluate(() => {
      const sheet = document.querySelector('[data-gliederung-sheet]')
      const ae = document.activeElement as HTMLElement | null
      const r = ae?.getBoundingClientRect()
      return {
        tag: ae?.tagName ?? null,
        imDialog: sheet ? sheet.contains(ae) : false,
        felderImBlatt: sheet ? sheet.querySelectorAll('input').length : 0,
        // «Sichtbar» heisst hier: das fokussierte Feld liegt im Viewport und ist
        // nicht durch das Overlay verdeckt — genau der Punkt des Befunds.
        obenLiegend: r
          ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === ae
          : false,
      }
    })
    expect(lage.tag, 'Ctrl+K hat kein Eingabefeld fokussiert').toBe('INPUT')
    expect(lage.imDialog, 'der Fokus hat den Dialog verlassen (WCAG 2.4.3)').toBe(true)
    expect(lage.felderImBlatt, 'im Blatt steht kein Suchfeld (Bug-Check 6)').toBe(1)
    expect(lage.obenLiegend, 'das fokussierte Feld ist verdeckt — Tippen wäre unsichtbar').toBe(true)

    // Und die Suche ist im Blatt wirklich VERFEINERBAR: das getippte Zeichen
    // landet im Feld, das obenauf liegt, und die Trefferzahl reagiert.
    await page.keyboard.type('X')
    await expect(page.locator('[data-gliederung-sheet] [data-v3-suchsprung] input'))
      .toHaveValue('KostenX')

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(b) Esc schliesst das Blatt und behält den Suchbegriff', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await sheetBeiSucheOeffnen(page, 'Kosten')
    await page.keyboard.press('Control+k')
    await expect(page.locator('[data-gliederung-sheet] [data-v3-suchsprung] input')).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(page.locator('[data-gliederung-sheet]'),
      'Esc hat das Blatt nicht geschlossen (es leerte das Feld)').toHaveCount(0, { timeout: 10_000 })
    // Der Begriff steht weiterhin — Esc im Dialog schliesst, es löscht nicht.
    await expect(page.locator('[data-v3-such-zone] input')).toHaveValue('Kosten')

    // Ausserhalb eines Blatts leert Esc weiterhin das Feld (Pos. 14 unverändert).
    await page.locator('[data-v3-such-zone] input').focus()
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-v3-such-zone] input')).toHaveValue('')

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})

test.describe('A3 — ⌘K bedient das Pane, in dem der Fokus steht', () => {
  // ROT ZU BEKOMMEN (§6.7): in `v3/suchKuerzel.ts` die Zeile
  // `if (!tastendruckGehoertMir(imSekundaerenPane)) return;` entfernen ⇒ beide
  // Richtungen landen im sekundären Pane (so gemessen 17.8.2026).
  test('(c) im Split trifft das Kürzel nie das fremde Pane', async ({ page }) => {
    test.slow() // zwei volle Leser-Instanzen
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto('/gesetze/bund/BGFA?leser=v3&p=/gesetze/bund/BGBM%3Fleser%3Dv3')
    await expect(page.locator('[data-pane="sekundaer"] [data-v3-kopf]')).toBeVisible({ timeout: 25_000 })
    // Positiv-Sonde: es gibt wirklich zwei Felder — sonst prüfte die Zuordnung
    // unten eine Menge mit einem Element und wäre grundlos grün (§6.7 b).
    await expect(page.locator('[data-v3-suchsprung] input')).toHaveCount(2, { timeout: 20_000 })

    for (const start of ['primaer', 'sekundaer'] as const) {
      await page.locator(`[data-pane="${start}"] [data-v3-suchsprung] input`).focus()
      await expect(page.locator(`[data-pane="${start}"] [data-v3-suchsprung] input`)).toBeFocused()
      // Fokus vom Feld nehmen, ohne das Pane zu verlassen: der Kopf des Panes
      // trägt einen echten Knopf. So ist der Fall der ECHTE — «⌘K aus dem Pane,
      // aber nicht aus dem Feld».
      // Ä46 (H4-II, 17./18.8.2026): das war bis dahin `[data-v3-kopf-schliessen]`;
      // im Pane gibt es dieses ✕ nicht mehr (zweites Kreuz je Pane, Duplikat des
      // Rücksprungs). Der «Ansicht»-Öffner steht dort unverändert und ist
      // ebenso ein echter, fokussierbarer Knopf im Kopf DIESES Panes — die
      // Aussage des Tests (⌘K trifft das Pane, in dem der Fokus steht) ist
      // unberührt (§6.3).
      await page.locator(`[data-pane="${start}"] [data-v3-ansicht]`).focus()

      await page.keyboard.press('Control+k')

      const wo = await page.evaluate(() => {
        const ae = document.activeElement
        return {
          primaer: document.querySelector('[data-pane="primaer"]')?.contains(ae) ?? false,
          sekundaer: document.querySelector('[data-pane="sekundaer"]')?.contains(ae) ?? false,
        }
      })
      expect(wo[start], `Fokus stand im Pane «${start}», ⌘K landete woanders`).toBe(true)
      const anderes = start === 'primaer' ? 'sekundaer' : 'primaer'
      expect(wo[anderes], `⌘K hat den Fokus ins fremde Pane «${anderes}» gezogen`).toBe(false)
    }

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})

test.describe('Ä32/B11 — das Blatt zeigt und benennt, was es zeigt', () => {
  // ── §6.3-UMSTELLUNG D38 (David 7.9.2026) · DIE FRAGE HAT SICH GEDREHT ─────
  // Ä32/B11 fragten: «zeigt und benennt das Blatt, was es zeigt?» — und die
  // Antwort war, dass im TREFFER-Blatt weder «Sie sind hier» noch die Übersicht
  // noch «alles auf/zu» etwas verloren haben, weil dort kein Baum stand. Seit
  // D38 steht dort IMMER der Baum: die Treffer liegen über der Lesespalte
  // («die suchresultate … sollen nicht in der gliederung erscheinen»). Damit
  // hat der Fall keinen Gegenstand mehr — und die Zusage, die er trug, wird
  // wertvoller, nicht kleiner: das Sheet muss die Gliederung auch WÄHREND einer
  // Suche vollständig hergeben. Genau das prüft er jetzt.
  // ROT ZU BEKOMMEN (§6.7): in `v3/leisteAufbau.tsx` `titel="Gliederung"` gegen
  // die alte Weiche `titel={m.sucheAktiv ? 'Treffer' : 'Gliederung'}` tauschen
  // bzw. `ortAnzeigen` wieder auf `!m.sucheAktiv` setzen ⇒ (d) rot.
  test('(d) mit laufender Suche zeigt das Sheet die vollständige Gliederung', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await sheetBeiSucheOeffnen(page, 'Kosten')

    const blatt = page.locator('[data-gliederung-sheet]')
    // Positiv-Sonde: die Suche läuft wirklich — die Liste steht über der
    // Lesespalte, nur eben nicht hier (sonst prüfte alles Weitere den
    // Ruhezustand und wäre grundlos grün, §6.7 b).
    await expect(page.locator('[data-v3-treffer-spalte] [data-treffer-liste]'))
      .toHaveCount(1, { timeout: 15_000 })
    expect(await blatt.locator('[data-treffer-liste]').count(),
      'die Trefferliste steckt im Gliederungs-Sheet').toBe(0)

    await expect(blatt.locator('[data-sie-sind-hier]'),
      '«Sie sind hier» fehlt während der Suche').toHaveCount(1)
    await expect(blatt.locator('[data-v3-uebersicht]'),
      'die Erlass-Übersicht fehlt während der Suche').toHaveCount(1)
    await expect(blatt.locator('[data-v3-alle]'),
      '«alles auf/zu» fehlt während der Suche').toHaveCount(1)
    // Pos. 15 unverändert: «↑ Anfang» steht GENAU EINMAL auf der Seite.
    await expect(page.locator('[data-v3-anfang]')).toHaveCount(1)

    // B11: Dialog UND ✕ heissen «Gliederung» — und meinen es jetzt auch.
    await expect(blatt).toHaveAttribute('aria-label', 'Gliederung')
    expect(await blatt.locator('button[aria-label="Gliederung schliessen"]').count(),
      'der ✕ heisst nicht «Gliederung schliessen»').toBe(1)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(e) im GLIEDERUNGS-Blatt bleibt alles, was dort hingehört', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.locator('[data-v3-gliederung-auf]').first().click()
    const blatt = page.locator('[data-gliederung-sheet]')
    await expect(blatt).toBeVisible({ timeout: 15_000 })

    await expect(blatt).toHaveAttribute('aria-label', 'Gliederung')
    expect(await blatt.locator('button[aria-label="Gliederung schliessen"]').count()).toBe(1)
    await expect(blatt.locator('[data-sie-sind-hier]'),
      'ohne Suche gehört die Ortsangabe ins Blatt').toHaveCount(1)
    await expect(blatt.locator('[data-v3-alle]'),
      'ohne Suche gehört «alles auf» ins Blatt').toHaveCount(1)
    // Ä18: das Feld ist das oberste Element unter der Titelleiste — dieselbe
    // Regel wie in Spalte und Kopf-Block.
    const reihenfolge = await blatt.evaluate((el) => {
      const feld = el.querySelector('[data-v3-blatt-feld]')
      const ort = el.querySelector('[data-sie-sind-hier]')
      if (!feld || !ort) return null
      return feld.compareDocumentPosition(ort) & Node.DOCUMENT_POSITION_FOLLOWING ? 'feld-zuerst' : 'ort-zuerst'
    })
    expect(reihenfolge, 'das Feld steht nicht zuoberst (Ä18)').toBe('feld-zuerst')

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})

// ═══ Ä94/Ä96 (H4-Nachzug 18.8.2026) · KEIN LEERER BALKEN, KEIN GESCHNITTENER
//     RANDTITEL ══════════════════════════════════════════════════════════════
//
// Ä94 (gemessen 18.8.2026, `vite preview`, StPO/«Entschädigung», 390×844):
//   Zone A (`data-v3-leiste-baumkopf`)  358 × 34 px, Inhalt «↑ Anfang» (62 px)
//                                       → 246 px leer, eigene klebende Schicht
//   Segment (`data-v3-suchbereich`)     288 px im 358-Kasten → 70 px Stummel
// Zwei klebende Balken übereinander, der obere zu 69 % leer, der untere mit
// einem Loch neben dem Segment. Der eine Befund löst den anderen: die Leiste gibt
// «↑ Anfang» ab (`v3/anfangSlot.ts`), es füllt den Stummel (288 + 8 + 62 = 358),
// und die halbleere Zeile entfällt. Nachher: Zone A 0 px hoch, Trefferliste
// beginnt 34 px höher (y 261 → 227), Blatt-Inhalt 4052 → 3738 px.
// Ä32 bleibt unangetastet: «↑ Anfang» ist weiterhin GENAU EINMAL im Blatt (Fall
// (d) oben prüft das unverändert) — es hat nur den Platz gewechselt.
//
// Ä96 (gemessen 18.8.2026, StPO/«Kosten», D 1440, Spalte 280 px, erste acht
// Trefferzeilen): DREI Randtitel liefen in die Ellipse (244/198/206 px in 178),
// während die Kontext-Schnipsel zwei bis drei Zeilen hoch waren (30–45 px).
// Nachher: kein Randtitel mehr angeschnitten, jeder Schnipsel einzeilig (15 px).
//
// ── §6.3-UMSTELLUNG D38 (David 7.9.2026) · Ä94 HAT KEINEN GEGENSTAND MEHR ───
// Die zwei klebenden Balken übereinander gab es genau in EINER Lage: Sheet mit
// TREFFERLISTE. Seit D38 zeigt das Sheet die Gliederung und die Liste liegt über
// der Lesespalte — es gibt keine Zone A über einer Trefferliste mehr, also auch
// keine leere. (f) prüft darum, was die Lage HEUTE zusagt und was Ä94 mit dem
// Weiterreichen des Knopfes sichern wollte: «↑ Anfang» steht GENAU EINMAL auf
// der Seite (Pos. 15), und keine klebende Zeile steht leer da.
// Der Slot selbst (`v3/anfangSlot.ts`) ist damit unbesetzt; sein Rückbau berührt
// die Seitenleiste, an der am 7.9.2026 zwei parallele Einheiten bauen, und ist
// als Nachzug übergeben (Herleitung in der Datei).
//
// ROT ZU BEKOMMEN (§6.7): in `v3/leisteAufbau.tsx` `baumKnoepfe={false}` an der
// `<LeserSeitenleiste>` setzen ⇒ Zone A trägt im Sheet nur noch «↑ Anfang»,
// gibt ihn an die Trefferliste ab — die steht dort nicht mehr, also verschwindet
// der Knopf ganz: (f) meldet 0 statt 1. In `v3/LeserTrefferListe.tsx` am
// Randtitel `line-clamp-2` gegen `truncate` tauschen bzw. `einzeilig` am
// Kopf-Schnipsel weglassen ⇒ (g) rot. So gemessen.
test.describe('Ä94/Ä96 — die Werkzeugzeile trägt etwas, der Randtitel bleibt ganz', () => {
  test('(f) @390: «↑ Anfang» steht genau einmal, und keine klebende Zeile steht leer', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await sheetBeiSucheOeffnen(page, 'Entschädigung')

    const blatt = page.locator('[data-gliederung-sheet]')
    // Vorbedingung: die Suche läuft (Liste über der Lesespalte), das Sheet
    // trägt den Baum.
    await expect(page.locator('[data-v3-treffer-spalte] [data-treffer-liste]'))
      .toHaveCount(1, { timeout: 15_000 })
    await expect(blatt.locator('[data-v3-leiste-baum] button').first()).toBeVisible()

    // Pos. 15: EIN Knopf pro Seite — im Sheet, nicht zusätzlich in der Liste.
    await expect(page.locator('[data-v3-anfang]'), '«↑ Anfang» steht nicht genau einmal')
      .toHaveCount(1)
    await expect(blatt.locator('[data-v3-anfang]'), '«↑ Anfang» steht nicht im Sheet')
      .toHaveCount(1)

    // Und Zone A steht nicht leer da: sie trägt «alles auf/zu» UND den Knopf —
    // das war Ä94s eigentliche Sorge (34 px klebende Fläche für 62 px Inhalt).
    const zoneA = await blatt.locator('[data-v3-leiste-baumkopf]').boundingBox()
    expect(zoneA, 'Zone A nicht messbar').toBeTruthy()
    const inhalt = await blatt.locator('[data-v3-leiste-baumkopf] button').count()
    expect(inhalt, `Zone A ist ${zoneA!.height} px hoch und trägt ${inhalt} Knöpfe`)
      .toBeGreaterThanOrEqual(2)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(g) @1440: kein Randtitel wird angeschnitten, jeder Schnipsel ist einzeilig', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.locator('[data-v3-such-zone] input, [data-v3-leiste-feld] input').first().fill('Kosten')
    await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-treffer-artikel]').first()).toBeVisible({ timeout: 15_000 })

    const mass = await page.locator('[data-treffer-artikel]').evaluateAll((els) => els.slice(0, 8).map((el) => {
      const rt = el.querySelector('[data-treffer-randtitel]') as HTMLElement | null
      const sn = el.querySelector('[data-treffer-schnipsel] .lc-such-ausschnitt') as HTMLElement | null
      const zeilen = (e: HTMLElement) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight))
      return {
        titel: rt ? { text: rt.textContent ?? '', breit: rt.scrollWidth > rt.clientWidth + 1, zeilen: zeilen(rt) } : null,
        schnipselZeilen: sn ? zeilen(sn) : null,
      }
    }))
    expect(mass.length, 'keine Trefferzeilen gemessen').toBeGreaterThan(3)
    for (const z of mass) {
      if (z.titel) {
        expect(z.titel.breit, `Randtitel angeschnitten: «${z.titel.text}»`).toBe(false)
        expect(z.titel.zeilen, `Randtitel über zwei Zeilen: «${z.titel.text}»`).toBeLessThanOrEqual(2)
      }
      if (z.schnipselZeilen !== null) {
        expect(z.schnipselZeilen, 'Kopf-Schnipsel ist nicht einzeilig').toBe(1)
      }
    }

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})
