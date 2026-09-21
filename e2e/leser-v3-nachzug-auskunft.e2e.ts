// @shard-gruppe: 5
// ═══ H2b-NACHZUG · AUSKUNFT UND FLÄCHE (A1 · A5 · Ä27 · Ä28 · Ä30 · Ä31) ════
//
// Fünf Befunde der drei Prüfer, alle GEMESSEN am gebauten H2b-Stand 17.8.2026:
//
//  A1  Die Ä1c-Vorgabe «App-Leiste im Leser eingeklappt» griff nur in
//      fabrikneuen Profilen. Der Stand vor H2b schrieb bei JEDEM Mount
//      `lexmetrik-seitenleiste-eingeklappt='0'`; H2b las das als Nutzerwahl.
//      Gemessen mit vorbelegtem `'0'`: App-Leiste 256 px offen (fabrikneu 0 px).
//  A5  LugÜ, Suche «Gericht»: das Anhang-Etikett «Protokoll 1 über bestimmte
//      Zuständigkeits-, Verfahrens- und Vollstreckungsfragen» (80 Zeichen) trug
//      `shrink-0` und riss den Leisten-Scroller auf `scrollWidth` 699 px in
//      `clientWidth` 280 px auf (im Blatt @390: 699/366).
//  Ä27 `details > summary::after {content:'  ▸'}` hängte an JEDE Übersichtszeile
//      ein zweites Glyph ans Ende, obwohl die Box vorn eines setzt (gemessen:
//      `::after` = `"  ▸"` UND Textknoten «▸»).
//  Ä28 Die Warnung «nicht konsolidiert» stand in der aufgeklappten Übersicht
//      ZWEIMAL, in zwei Wortlauten.
//  Ä30 Der Trefferzähler brach mitten in einer Aussage um («15 Paragraphen» /
//      «· 62 Fundstellen» über zwei Zeilen, an langen Wörtern dreizeilig).
//  Ä31 Das Suchfeld trug im Fokus outline 2 px brass + border 1 px brass +
//      offset 1 px = wieder zwei Ringe (Ä14 war nur «teilweise» erledigt).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const APP_LEISTE = '[data-app-seitenleiste]'

async function appLeisteBreite(page: Page): Promise<number> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    return el ? Math.round(el.getBoundingClientRect().width) : 0
  }, APP_LEISTE)
}

test.describe('A1 — die Leser-Vorgabe wirkt auch für Bestandsnutzer', () => {
  // ROT ZU BEKOMMEN (§6.7): in `components/layout/useSeitenleiste.ts` `EIN_KEY`
  // auf den Alt-Namen ohne `.v2` zurücksetzen ⇒ Fall (a) misst 256 px statt 0.
  test('(a) mit dem Alt-Wert «0» im Speicher startet der Leser eingeklappt', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    // Genau der Zustand, den JEDER Bestandsnutzer trägt: der Alt-Schlüssel steht
    // auf '0', weil der Stand vor H2b ihn bei jedem Mount schrieb.
    await page.addInitScript(() => {
      localStorage.setItem('lexmetrik-seitenleiste-eingeklappt', '0')
    })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })

    expect(await appLeisteBreite(page),
      'die App-Seitenleiste steht im Leser offen — die Ä1c-Vorgabe greift nicht').toBe(0)
    // Und der Alt-Schlüssel wird NICHT angetastet: kein Schreiben ohne Handlung.
    expect(await page.evaluate(() => ({
      alt: localStorage.getItem('lexmetrik-seitenleiste-eingeklappt'),
      v2: localStorage.getItem('lexmetrik-seitenleiste-eingeklappt.v2'),
    }))).toEqual({ alt: '0', v2: null })

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(b) der Alt-Wert «1» bleibt eine Wahl und gilt überall', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem('lexmetrik-seitenleiste-eingeklappt', '1')
    })
    // «Eingeklappt» war nie die Vorgabe — wer '1' im Speicher hat, hat gewählt.
    await page.goto('/')
    await expect(page.locator('main')).toBeVisible({ timeout: 20_000 })
    expect(await appLeisteBreite(page), 'die gewählte Einklappung wurde verworfen').toBe(0)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(c) ausserhalb des Lesers gilt dieselbe Vorgabe und nichts wird geschrieben', async ({ page }) => {
    // ── §6.3-DEKLARATION (W2·24-D25, 6.9.2026) · DIE VORGABE GILT ÜBERALL ────
    // Der Fall verlangte «> 200 px», also eine OFFENE App-Leiste ausserhalb des
    // Lesers. Das war die Ä1c-Regel vom 17.8.2026 («nur im Gesetz-Leser
    // eingeklappt»). D25 hat sie durch einen ausdrücklichen Entscheid David
    // 6.9.2026 abgelöst — «seitenleiste soll als default zuerst eingeklappt
    // sein» —, nachzulesen im Kopf von `components/layout/useSeitenleiste.ts`
    // (`VORGABE_EINGEKLAPPT = true`, kein bereichsabhängiger Vorgabewert mehr).
    // Der Fall behält seine EIGENTLICHE Aussage, die von D25 unberührt ist und
    // die den «Alt-Fehler» bewacht: ohne Nutzerhandlung wird NICHTS gespeichert.
    // Die Breiten-Zeile prüft ab jetzt die neue Zusage — dass die Vorgabe
    // wirklich für jede Route gilt und nicht nur für den Leser. Käme ein
    // bereichsabhängiger Vorgabewert zurück, wäre der Fall wieder rot.
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze')
    await expect(page.locator('main')).toBeVisible({ timeout: 20_000 })

    expect(await appLeisteBreite(page),
      'die Übersicht startet mit offener Seitenleiste — die D25-Vorgabe greift nur im Leser').toBe(0)
    expect(await page.evaluate(() => localStorage.getItem('lexmetrik-seitenleiste-eingeklappt.v2')),
      'ohne Nutzerhandlung wurde eine Wahl gespeichert — genau der Alt-Fehler').toBe(null)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})

test.describe('A5 — die Trefferliste sprengt ihre Leiste nicht', () => {
  // ROT ZU BEKOMMEN (§6.7): in `v3/LeserTrefferListe.tsx` am Etikett-Span
  // `min-w-0 truncate` wieder auf `shrink-0` setzen ⇒ 699 px in 280 px.
  test('(d) LugÜ, Suche «Gericht»: kein horizontaler Überlauf, Zähler sichtbar', async ({ page }) => {
    test.slow() // Staatsvertrag mit Anhängen + Volltextsuche
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/international/LUGUE')
    await expect(page.locator('[data-v3-aside]')).toBeVisible({ timeout: 20_000 })
    await page.locator('[data-v3-suchsprung] input').fill('Gericht')
    await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 20_000 })

    const mass = await page.evaluate(() => {
      const liste = document.querySelector('[data-treffer-liste]') as HTMLElement
      const scroller = liste.closest('[data-toc]') as HTMLElement | null
      const zeilen = [...liste.querySelectorAll('[data-treffer-artikel] button')] as HTMLElement[]
      const ueber = zeilen
        .map((b) => ({ t: (b.textContent ?? '').slice(0, 34), sw: b.scrollWidth, cw: b.clientWidth }))
        .filter((z) => z.sw > z.cw)
      // Die Positiv-Sonde: das lange Anhang-Etikett ist wirklich da — sonst
      // prüfte der Fall einen Erlass ohne den Befund (§6.7 b).
      const langes = zeilen.some((b) => (b.textContent ?? '').includes('Protokoll 1'))
      return {
        listeSW: liste.scrollWidth, listeCW: liste.clientWidth,
        scrollerSW: scroller?.scrollWidth ?? -1, scrollerCW: scroller?.clientWidth ?? -1,
        ueber, langes, zaehler: zeilen.length,
      }
    })
    expect(mass.langes, 'der Anhang «Protokoll 1» fehlt — Fall untauglich').toBe(true)
    expect(mass.ueber, `Zeilen mit Überlauf: ${JSON.stringify(mass.ueber)}`).toEqual([])
    expect(mass.listeSW, `Liste ${mass.listeSW} px in ${mass.listeCW} px (war 699 in 280)`)
      .toBeLessThanOrEqual(mass.listeCW)
    expect(mass.scrollerSW, `Leisten-Scroller ${mass.scrollerSW} px in ${mass.scrollerCW} px`)
      .toBeLessThanOrEqual(mass.scrollerCW)

    // Der Fundstellen-Zähler jeder Zeile liegt INNERHALB der Leiste — er ist die
    // Auskunft, um die es hier geht (§8).
    const zaehlerDrin = await page.evaluate(() => {
      const scroller = document.querySelector('[data-toc]') as HTMLElement
      const rechts = scroller.getBoundingClientRect().right
      return [...scroller.querySelectorAll('[data-treffer-artikel] button > span > span:last-child')]
        .every((s) => s.getBoundingClientRect().right <= rechts + 1)
    })
    expect(zaehlerDrin, 'ein Fundstellen-Zähler liegt aus der Leiste heraus').toBe(true)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})

test.describe('Ä27/Ä28/Ä30/Ä31 — jede Auskunft genau einmal, jeder Ring genau einer', () => {
  // ROT ZU BEKOMMEN (§6.7), je Fall:
  //  Ä27 in `src/index.css` die Regel `details[data-v3-uebersicht] > summary::after
  //      { content: none; }` entfernen ⇒ `::after` misst wieder `"  ▸"`.
  //  Ä28/Ä81 in `v3/UebersichtBox.tsx` die `warnung`-Zeile wieder in die
  //      Warn-Zelle setzen ⇒ der Sachverhalt steht zweimal auf der Seite.
  //  Ä30 in `v3/LeserTrefferListe.tsx` die zwei `whitespace-nowrap`-Spans
  //      entfernen ⇒ der Umbruch trennt Zahl und Einheit.
  //  Ä31 in `src/index.css` `.lc-input.lc-v3-feld:focus` auf `border-color:
  //      var(--focus)` + `outline-offset: 1px` zurückstellen ⇒ zwei Ringe.
  test('(e) StPO: EIN Disclosure-Glyph und EINE Konsolidierungs-Warnung', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-uebersicht]')).toBeVisible({ timeout: 20_000 })

    const glyph = await page.evaluate(() => {
      const s = document.querySelector('[data-v3-uebersicht-zeile]') as HTMLElement
      const nach = getComputedStyle(s, '::after').content
      const eigen = (s.querySelector('span[aria-hidden]')?.textContent ?? '').trim()
      // Positiv-Sonde: die App-weite Regel lebt weiter — an einem <details>
      // ausserhalb der V3-Box muss das Glyph noch erscheinen, sonst hätte die
      // Scopierung zu viel gestrichen.
      const probe = document.createElement('details')
      probe.innerHTML = '<summary>Probe</summary><p>x</p>'
      document.body.appendChild(probe)
      const fremd = getComputedStyle(probe.querySelector('summary')!, '::after').content
      probe.remove()
      return { nach, eigen, fremd }
    })
    expect(glyph.eigen, 'die Box setzt ihr eigenes ▸ nicht mehr').toBe('▸')
    expect(['none', 'normal', '""']).toContain(glyph.nach)
    expect(glyph.fremd, 'die App-weite Disclosure-Regel ist mitgestrichen worden').toContain('▸')

    // ── Ä81 (H4-Nachzug 18.8.2026) · DER SACHVERHALT STEHT EINMAL AUF DER
    //    SEITE — UND ZWAR IM KOPF ────────────────────────────────────────────
    // §6.3-DEKLARATION, zweite Stufe. Ä28 hatte hier «genau einmal IN DER BOX»
    // gesichert und die Seiten-Summe damit auf zwei festgeschrieben. Gemessen
    // 18.8.2026 (StPO, D 1440, Box zu wie aufgeklappt) standen beide Vorkommen
    // GLEICHZEITIG SICHTBAR: `div[data-v3-uebersicht-warnung]` in der Leiste und
    // `p < div < header` im Erlass-Kopf. Die Box zieht ihre Grenze selbst anders
    // (Kopf = wie aktuell · Box = woher und wie gebaut), und eine offene
    // Konsolidierung ist «wie aktuell».
    // Die geprüfte SACHE bleibt: der Sachverhalt steht genau EINMAL — nur ist
    // die Zählfläche jetzt die SEITE statt der Box, und der Ort ist benannt.
    // Nichts ist gelockert: aus einer Zahl («1 in der Box») werden drei
    // Bedingungen (1 auf der Seite · 0 in der Box · 1 im Kopf).
    // ROT ZU BEKOMMEN (§6.7): in `v3/UebersichtBox.tsx` die `warnung`-Zeile
    // wieder in die Warn-Zelle setzen ⇒ aufDerSeite 2, inDerBox 1.
    await page.locator('[data-v3-uebersicht-zeile]').click()
    await expect(page.locator('[data-v3-uebersicht-inhalt]')).toBeVisible({ timeout: 10_000 })
    const warn = await page.evaluate(() => {
      // Nur BLATT-Absätze zählen, sonst zählt jede Hülle den Satz mit.
      const alle = [...document.querySelectorAll('p, li, dd')]
        .filter((el) => /Änderung noch nicht in den Text eingearbeitet/i.test(el.textContent ?? ''))
        .filter((el) => !el.querySelector('p, li, dd'))
      const box = document.querySelector('[data-v3-uebersicht]') as HTMLElement
      const imKopf = alle.filter((el) => el.closest('header') !== null)
      const p = imKopf[0] ?? null
      const marke = p?.querySelector('[aria-hidden]')
      return {
        aufDerSeite: alle.length,
        inDerBox: alle.filter((el) => box.contains(el)).length,
        imKopf: imKopf.length,
        satzKopf: (p?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        marke: (marke?.textContent ?? '').trim(),
        // Der Satz selbst — also das, was ein Screenreader vorliest.
        vorgelesen: [...(p?.childNodes ?? [])]
          .filter((n) => !(n instanceof Element) || !n.hasAttribute('aria-hidden'))
          .map((n) => n.textContent ?? '').join('').replace(/\s+/g, ' ').trim(),
      }
    })
    expect(warn.aufDerSeite, `Warnsätze auf der Seite: ${warn.aufDerSeite}`).toBe(1)
    expect(warn.inDerBox, 'die Box warnt ein zweites Mal (Ä81)').toBe(0)
    expect(warn.imKopf, 'der Erlass-Kopf warnt nicht mehr').toBe(1)
    // Positiv-Sonde: der eine Satz ist der GETEILTE aus `erlassKopfText.ts` —
    // mit Zeitbezug und mit dem Verweis auf die amtliche Fassung.
    expect(warn.satzKopf).toMatch(/Fedlex hat eine seit \d{2}\.\d{2}\.\d{4} geltende Änderung/)
    expect(warn.satzKopf).toContain('massgeblich ist die amtliche Fassung')
    // Das «⚠» ist redundante Verstärkung und darf nie alleiniger
    // Bedeutungsträger sein (DESIGN-REGLEMENT B3): es steht in einem EIGENEN
    // `aria-hidden`-Element vor dem Satz, nicht im Satz. Geprüft wird darum die
    // TRENNUNG, nicht die Abwesenheit im `textContent` des Absatzes — dort
    // erscheint das Zeichen selbstverständlich mit (erster Anlauf 17.8.2026
    // prüfte genau das Falsche und wurde zu Recht rot).
    expect(warn.marke, 'das ⚠ steht nicht in einem eigenen aria-hidden-Element').toBe('⚠')
    expect(warn.vorgelesen, 'das ⚠ steckt im vorgelesenen Satz').not.toContain('⚠')
    expect(warn.vorgelesen).toContain('massgeblich ist die amtliche Fassung')

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(f) BS-Paragrafenerlass: der Zähler bricht nur am Trenner, der Fokus zeigt EINEN Ring', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/kanton/BS-154.125')
    await expect(page.locator('[data-v3-aside]')).toBeVisible({ timeout: 20_000 })
    const feld = page.locator('[data-v3-suchsprung] input')
    await feld.fill('Gericht')
    await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 20_000 })

    // Ä30: jedes Segment «Zahl + Einheit» liegt in EINER Zeile. Gemessen an der
    // Höhe der nicht-umbrechbaren Spans: mehr als eine Zeilenhöhe = umgebrochen.
    const zaehler = await page.evaluate(() => {
      const p = document.querySelector('[data-treffer-liste] [data-treffer-leiste] p') as HTMLElement
      const lh = parseFloat(getComputedStyle(p).lineHeight)
      const teile = [...p.querySelectorAll(':scope > span.whitespace-nowrap')] as HTMLElement[]
      return {
        text: (p.textContent ?? '').replace(/\s+/g, ' ').trim(),
        lh: Math.round(lh),
        teile: teile.map((t) => ({
          t: (t.textContent ?? '').trim(),
          zeilen: Math.round(t.getBoundingClientRect().height / lh),
        })),
      }
    })
    expect(zaehler.teile.length, 'die Segmente tragen kein whitespace-nowrap').toBe(2)
    expect(zaehler.text, 'der Zähler nennt nicht «Paragraphen» — Fall untauglich').toContain('Paragraphen')
    for (const t of zaehler.teile) {
      expect(t.zeilen, `«${t.t}» ist über ${t.zeilen} Zeilen gebrochen (Zeilenhöhe ${zaehler.lh} px)`).toBe(1)
    }

    // Ä31: EIN Ring. Der Feldrahmen bleibt im Fokus neutral, das Outline sitzt
    // ohne Spalt — sonst sind es zwei messingfarbene Kanten.
    //
    // Ä67-NACHZUG (17.8.2026, deklariert §6.3): die Offset-Zusicherung lautete
    // `=== '0px'` und wurde rot, als der Ring nach INNEN wanderte
    // (`outline-offset: -2px`, David-Befund «abgeschnitten»). Sie prüfte den
    // Buchstaben, gemeint war die Sache: ein POSITIVER Offset reisst einen Spalt
    // zwischen Feldrahmen und Ring, und aus einer Kante werden zwei. Ein
    // negativer Offset erzeugt keinen Spalt — er legt den Ring auf den Rahmen.
    // Die Zusicherung sagt jetzt, was Ä31 meinte: **kein Spalt nach aussen**.
    // Dass der Ring auch nirgends beschnitten wird, prüft
    // `e2e/leser-v3-fokusring-suchfeld.e2e.ts` an allen vier Kanten.
    await feld.focus()
    const ring = await feld.evaluate((el) => {
      const s = getComputedStyle(el)
      const ruhe = getComputedStyle(el.cloneNode() as HTMLElement)
      return {
        outlineBreite: s.outlineWidth, outlineFarbe: s.outlineColor,
        offset: s.outlineOffset, rahmenFarbe: s.borderTopColor,
        rahmenRuhe: ruhe.borderTopColor, schatten: s.boxShadow,
      }
    })
    expect(ring.outlineBreite, 'der Fokusring fehlt').toBe('2px')
    expect(ring.schatten, 'der box-shadow-Doppelring ist zurück').toBe('none')
    expect(
      parseFloat(ring.offset),
      `ein Spalt nach aussen (outline-offset ${ring.offset}) macht aus einer Kante zwei Ringe`,
    ).toBeLessThanOrEqual(0)
    expect(ring.rahmenFarbe, 'der Feldrahmen färbt sich im Fokus mit — zweite Messing-Kante')
      .not.toBe(ring.outlineFarbe)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})
