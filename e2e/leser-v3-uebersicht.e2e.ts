// @shard-gruppe: 8
// ═══ Ä70–Ä74 · DIE ÜBERSICHTSBOX IM BROWSER (David 17.8.2026) ════════════════
//
// «Das Übersichtfeld ist sehr unästhetisch. Insbesondere wenn es aufgeklappt
//  ist. Mach das schöner und orientiere dich an Fedlex.» — Wortlaut David.
//
// Was der Vitest NICHT sagen kann und diese Spec darum misst: ob der Text
// wirklich in die Spalte passt statt gekappt oder überzulaufen, ob die Box eine
// einzige Schriftstimme führt, ob im Handy-Blatt nichts über den Rand tritt und
// ob die Warnung auf der Seite GENAU EINMAL steht. Die Auswahl der Zeilen prüft
// `src/tests/leser-v3-uebersicht.test.ts` — hier geht es um Geometrie.
//
// ── ROT ZU BEKOMMEN (§6.7), je Fall ─────────────────────────────────────────
//  (a) In `v3/uebersichtAngaben.ts` `ruheZeile` wieder `Stand …` anhängen
//      ⇒ die Ruhezeile braucht drei Zeilen statt einer.
//  (b) In `src/index.css` an `.lc-v3-steckbrief dd` `white-space: nowrap;
//      overflow: hidden; text-overflow: ellipsis` setzen (der Ist-Zustand vor
//      Ä70) ⇒ gekappte Werte, gemessen an `scrollWidth > clientWidth`.
//  (c) In `v3/LeserUebersicht.tsx` die Warnung zusätzlich an eine zweite Stelle
//      geben ⇒ zwei Warnsätze auf der Seite.
//  (d) In `v3/UebersichtBox.tsx` den §8-Block wieder in ein `<details>` legen
//      ⇒ zwei Klappen.
//  (e) `.lc-v3-steckbrief > dl { grid-template-columns: 5rem 1fr }` auf `auto
//      1fr` stellen ⇒ die Werte stehen nicht mehr auf einer Kante.
// Alle fünf so gemessen (17.8.2026, chromium, Projekt `leser-v3`).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

/** Die fünf Erlassarten der Neutralitätsprobe (Fahrplan Kap. 7). */
const ERLASSE = [
  { name: 'StPO (Bund, mit Warnung)', pfad: '/gesetze/bund/STPO' },
  { name: 'VMWG (Verordnung)', pfad: '/gesetze/bund/VMWG' },
  { name: 'LugÜ (Staatsvertrag)', pfad: '/gesetze/international/LUGUE' },
  { name: 'BS-640.100 (Kanton, §)', pfad: '/gesetze/kanton/BS-640.100' },
  { name: 'ZH-211.11 (Kanton, §)', pfad: '/gesetze/kanton/ZH-211.11' },
]

async function boxOeffnen(page: Page, pfad: string): Promise<void> {
  await page.goto(pfad)
  await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('[data-v3-uebersicht]')).toBeVisible({ timeout: 20_000 })
  await page.locator('[data-v3-uebersicht-zeile]').first().click()
  await expect(page.locator('[data-v3-uebersicht-inhalt]').first()).toBeVisible({ timeout: 10_000 })
  // Die Sidecars (Struktur, Currency, Revisionen) wachsen nach — erst wenn der
  // Erlassgeber steht, ist die längste Zeile da und die Messung aussagekräftig.
  await page.waitForTimeout(1200)
}

test.describe('Ä70 — aufgeklappt: nichts gekappt, nichts über den Rand', () => {
  for (const e of ERLASSE) {
    test(`${e.name}: kein Wert gekappt, kein Überlauf, keine leere Zeile`, async ({ page }) => {
      const fehler = fehlerSammeln(page)
      await page.setViewportSize({ width: 1440, height: 900 })
      await boxOeffnen(page, e.pfad)

      const befund = await page.evaluate(() => {
        const box = document.querySelector('[data-v3-uebersicht]') as HTMLElement
        const rect = box.getBoundingClientRect()
        const werte = [...box.querySelectorAll('dd')] as HTMLElement[]
        const labels = [...box.querySelectorAll('dt')] as HTMLElement[]
        return {
          zeilen: werte.length,
          // Die EINE Zeile, die jeder Erlass trägt (`kopfOverline` liefert immer
          // einen Wert) — sie ist die Positiv-Sonde dafür, dass hier überhaupt
          // eine Liste steht.
          hatArt: !!box.querySelector('[data-v3-uebersicht-zeile-id="art"] dd'),
          // Ist-Befund vor Ä70: bis 284 px Text lagen ausserhalb und waren nur
          // im `title` erreichbar — ein Tooltip ist keine Auskunft (§8).
          gekappt: werte
            .map((w, i) => ({
              label: labels[i]?.textContent ?? '?',
              verloren: w.scrollWidth - w.clientWidth,
            }))
            .filter((o) => o.verloren > 1),
          // Nichts tritt seitlich aus der Box heraus.
          ueberlauf: [...box.querySelectorAll('dd, dt, a, li, p')]
            .filter((el) => el.getBoundingClientRect().right > rect.right + 1)
            .map((el) => (el.textContent ?? '').trim().slice(0, 40)),
          // §8: kein Label ohne Wert.
          leereWerte: werte
            .map((w, i) => ({ label: labels[i]?.textContent ?? '?', t: (w.textContent ?? '').trim() }))
            .filter((o) => o.t.length === 0),
          // Fedlex-Rhythmus: ALLE Werte beginnen auf derselben senkrechten Kante.
          wertKanten: [...new Set(werte.map((w) => Math.round(w.getBoundingClientRect().left)))],
        }
      })

      // POSITIV-SONDE, erlassneutral kalibriert: die Zeilenzahl ist KEINE feste
      // Zahl — sie hängt am Datenmodell, und das ist der Punkt. ZH-211.11 trägt
      // genau zwei Zeilen (Art · Stand), weil der Kanton ZH keinen
      // Struktur-Sidecar hat (0 von 1193 unter `public/normtext/struktur/kanton/`,
      // gezählt 17.8.2026) und damit weder Erlassgeber noch Erlassdatum, und
      // weil ohne verifizierte Systematik kein Sachgebiet behauptet wird (§8).
      // Geprüft wird darum das, was IMMER gilt: die Liste steht, und sie trägt
      // die Art-Zeile.
      expect(befund.hatArt, 'die Art-Zeile fehlt — die Messung prüfte nichts').toBe(true)
      expect(befund.zeilen, 'die Box zeigt keine Werte — die Messung prüfte nichts')
        .toBeGreaterThanOrEqual(2)
      expect(befund.gekappt, `gekappte Werte: ${JSON.stringify(befund.gekappt)}`).toEqual([])
      expect(befund.ueberlauf, `tritt aus der Box: ${JSON.stringify(befund.ueberlauf)}`).toEqual([])
      expect(befund.leereWerte, `Label ohne Wert: ${JSON.stringify(befund.leereWerte)}`).toEqual([])
      expect(befund.wertKanten.length,
        `die Werte beginnen an ${befund.wertKanten.length} verschiedenen Kanten (${befund.wertKanten}) — kein Raster`)
        .toBe(1)

      expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
    })
  }
})

test.describe('Ä70/Ä72 — eine Stimme, eine Klappe, eine Warnung', () => {
  test('StPO: EINE Schriftfamilie in der Box, EINE Klappe, die Warnung genau einmal', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await boxOeffnen(page, '/gesetze/bund/STPO')

    const befund = await page.evaluate(() => {
      const box = document.querySelector('[data-v3-uebersicht]') as HTMLElement
      const fam = (el: Element) => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '')
      const texte = [...box.querySelectorAll('dt, dd, summary, li, a')]
      return {
        // Ist-Befund: die Ruhezeile lief in `Geist Mono Variable`, die Liste in
        // der Sans — zwei Stimmen in einem Bauteil (Grundlage Kap. 2.1 begrenzt
        // Mono «auf SR-Nr./Aktenzeichen»).
        familien: [...new Set(texte.map(fam))],
        // Ist-Befund: ein zweites `<details>` «Mehr zu diesem Erlass», und
        // dahinter die §8-Sätze — ein Hinweis hinter zwei Klicks ist keiner.
        klappenInnen: box.querySelectorAll('details').length,
        // Ist-Befund: ein zweites Etikett «Erlass-Übersicht» IN einer Box, die
        // schon «Übersicht» heisst.
        ueberschriften: [...box.querySelectorAll('h1,h2,h3,h4,h5,h6')]
          .map((h) => (h.textContent ?? '').trim()),
        // Höhe der Ruhezeile in Zeilen — sie war an allen fünf Erlassen dreizeilig.
        ruheZeilen: (() => {
          const s = box.querySelector('summary') as HTMLElement
          return Math.round(s.getBoundingClientRect().height / parseFloat(getComputedStyle(s).lineHeight))
        })(),
      }
    })
    expect(befund.familien.length,
      `zwei Schriftstimmen in der Box: ${befund.familien.join(' + ')}`).toBe(1)
    expect(befund.klappenInnen, 'die Box trägt eine ZWEITE Klappe').toBe(0)
    expect(befund.ueberschriften,
      `zweite Überschrift in der Box: ${JSON.stringify(befund.ueberschriften)}`).toEqual([])
    expect(befund.ruheZeilen, 'die Ruhezeile ist mehrzeilig').toBe(1)

    // Ä28-Erbe, verschärft: der Sachverhalt steht auf der GANZEN SEITE genau
    // zweimal — einmal im Erlass-Kopf, einmal in der Box —, und in der Box
    // genau einmal. Bis Ä70 stand er in der Box zweimal (Warnung + Grundhinweis
    // mit demselben Schluss-Halbsatz).
    // ── Ä81 (H4-Nachzug 18.8.2026) · NUR DER KOPF WARNT ─────────────────────
    // Der Absatz oben war Ä28s ZWISCHENSTAND: die Doppelung INNERHALB der Box war
    // abgeräumt, die auf der Seite blieb — und wurde hier sogar festgeschrieben.
    // GEMESSEN 18.8.2026 (StPO, D 1440, Box zu wie aufgeklappt): beide Vorkommen
    // sind GLEICHZEITIG SICHTBAR — `div[data-v3-uebersicht-warnung]` in der
    // Leiste und `p < div < header` im Erlass-Kopf. Die Box zieht ihre Grenze
    // selbst anders (Kopf = wie aktuell · Box = woher und wie gebaut), und eine
    // offene Konsolidierung ist «wie aktuell». Also: genau EINMAL auf der Seite,
    // und zwar im Kopf.
    // ROT ZU BEKOMMEN (§6.7): in `v3/UebersichtBox.tsx` die `warnung`-Zeile
    // wieder in die Warn-Zelle setzen ⇒ (inDerBox 1, aufDerSeite 2) rot.
    const warnungen = await page.evaluate(() => {
      // Nur die BLATT-Absätze zählen — sonst zählt jede Hülle den Satz mit.
      const alle = [...document.querySelectorAll('p, li, dd')]
        .filter((p) => /noch nicht in den Text eingearbeitet/.test(p.textContent ?? ''))
        .filter((p) => !p.querySelector('p, li, dd'))
      const box = document.querySelector('[data-v3-uebersicht]') as HTMLElement
      return {
        aufDerSeite: alle.length,
        inDerBox: alle.filter((p) => box.contains(p)).length,
        imKopf: alle.filter((p) => p.closest('header') !== null).length,
      }
    })
    expect(warnungen.inDerBox, 'die Box warnt ein zweites Mal (Ä81)').toBe(0)
    expect(warnungen.imKopf, 'der Erlass-Kopf warnt nicht mehr').toBe(1)
    expect(warnungen.aufDerSeite, 'die Warnung steht nicht genau einmal auf der Seite').toBe(1)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})

test.describe('Ä74 — der Stand steht nicht zweimal untereinander', () => {
  test('BS-640.100: das Erlassdatum trägt den Stand-Zusatz nicht mehr', async ({ page }) => {
    // Gemessen 17.8.2026 am gebauten Ä70-Stand: «Erlassdatum · Vom 12. April
    // 2000 (Stand 1. Januar 2026)» und direkt darunter «Stand · 01.01.2026».
    // Ursache war das «am» im Muster von `nurErlassdatum` — Fedlex schreibt
    // «(Stand am …)», die Kantone «(Stand …)»; 1182 von 1420 Sidecars.
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await boxOeffnen(page, '/gesetze/kanton/BS-640.100')

    const datum = await page.evaluate(() => {
      const z = document.querySelector('[data-v3-uebersicht-zeile-id="datum"] dd')
      return (z?.textContent ?? '').trim()
    })
    expect(datum, 'die Erlassdatum-Zeile fehlt — die Messung prüfte nichts').not.toBe('')
    expect(datum, `Erlassdatum trägt den Stand doppelt: «${datum}»`).not.toMatch(/\(Stand/)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})

test.describe('Ä10-Erbe — im Handy-Blatt kein Überlauf', () => {
  test('StPO @390: die Box im Gliederungs-Blatt bleibt in ihrer Breite', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    // Das GLIEDERUNGS-Blatt; im TREFFER-Blatt ist die Box per Ä32/B11-Weiche
    // bewusst abwesend (e2e/leser-v3-blatt (d)).
    await page.locator('[data-v3-gliederung-auf]').first().click()
    const blatt = page.locator('[data-gliederung-sheet]')
    await expect(blatt).toBeVisible({ timeout: 15_000 })
    await blatt.locator('[data-v3-uebersicht-zeile]').click()
    await expect(blatt.locator('[data-v3-uebersicht-inhalt]')).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(1200)

    const befund = await page.evaluate(() => {
      const blatt = document.querySelector('[data-gliederung-sheet]') as HTMLElement
      const box = blatt.querySelector('[data-v3-uebersicht]') as HTMLElement
      const r = box.getBoundingClientRect()
      return {
        breiter: box.scrollWidth - box.clientWidth,
        ausserhalb: [...box.querySelectorAll('dd, dt, a, li, p')]
          .filter((el) => {
            const b = el.getBoundingClientRect()
            return b.right > r.right + 1 || b.left < r.left - 1
          })
          .map((el) => (el.textContent ?? '').trim().slice(0, 40)),
        // Die Box darf das Blatt nicht seitlich aufreissen.
        blattBreiter: blatt.scrollWidth - blatt.clientWidth,
      }
    })
    expect(befund.breiter, 'die Box selbst scrollt waagrecht').toBeLessThanOrEqual(1)
    expect(befund.ausserhalb, `tritt aus der Box: ${JSON.stringify(befund.ausserhalb)}`).toEqual([])
    expect(befund.blattBreiter, 'das Blatt scrollt wegen der Box waagrecht').toBeLessThanOrEqual(1)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})

// ═══ STECKBRIEF-ERREICHBARKEIT (Integrations-Fund 17.8., H4-Vorbereitung II) ══
//
// BEFUND, vor dem Bau reproduziert (chromium, `?leser=v3`, StPO):
//
//   @1440 Gliederung OFFEN      `[data-v3-uebersicht]` 1  — 0 Klicks
//   @1440 Gliederung EINGEKLAPPT `[data-v3-uebersicht]` 0  ← nicht im DOM
//   @720  Start                  `[data-v3-uebersicht]` 0, nach ☰ 1 — 2 Klicks
//   @390  Start                  `[data-v3-uebersicht]` 0, nach ☰ 1 — 2 Klicks
//
// Der Defekt ist damit EINER, nicht drei: unter der Spaltenschwelle trägt das
// Gliederungs-Blatt den Steckbrief bereits (☰ + ▸ = zwei Schritte). Weg ist er
// genau dort, wo man die Gliederung EINKLAPPT — der Geste, mit der man Breite
// für den Text gewinnt. Und er ist dann nicht bloss unsichtbar, sondern aus dem
// Dokument: weder Ctrl+F noch Screenreader finden ihn, obwohl §8 an dieser Box
// ausdrücklich zusagt, dass die Angaben im DOM BLEIBEN.
//
// DIE GEPRÜFTE REGEL: **Auf jeder Breite höchstens zwei Bedienschritte bis zum
// Wert «Stand» — auf dem kürzesten Weg, den es dort gibt.** Welcher Weg das ist,
// unterscheidet sich (Panel-Reiter oben, Gliederungs-Blatt unten); die ZAHL nicht.
//
// ROT ZU BEKOMMEN (§6.7): in `LeserRahmenV3.tsx` die Prop `steckbrief={…}` an der
// `<LeserPanelZone>` entfernen ⇒ (a) findet die Klappe im Panel nicht. Umgekehrt
// die Weiche `zweiSpalten || blattOffen ? null : …` auf `…` verkürzen ⇒ (c)
// meldet zwei Steckbriefe auf einer Seite.
// So gemessen am Ist-Stand (Basis `6ca1609b3`, dist vor dem Bau): (a) und (c)
// rot, (b) grün — der Befund lag nicht unterhalb der Spaltenschwelle.
test.describe('Steckbrief — auf jeder Breite in höchstens zwei Schritten', () => {
  test('(a) @1440 mit EINGEKLAPPTER Gliederung: Panel-Öffner + Klappe im Panel', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-uebersicht]')).toBeVisible({ timeout: 20_000 })

    // VORBEDINGUNG — der Zustand, in dem der Befund entstand. Kein Bedienschritt
    // der Messung: er stellt die Lage her, statt zum Ziel zu führen.
    await page.locator('[data-v3-gliederung-zu]').click()
    await expect(page.locator('[data-v3-aside]')).toHaveCount(0)
    // POSITIV-Sonde: die Leisten-Box ist wirklich fort — sonst prüfte alles
    // Weitere nur, dass irgendwo ein Steckbrief steht (§6.7).
    await expect(page.locator('[data-v3-uebersicht]')).toHaveCount(0)

    // Schritt 1 — Panel aufziehen. @1440 ist der Zuschnitt «voll», dort ist der
    // Zähler in der Kopfzeile der eine Öffner (`helpers/panelOeffnen`).
    await page.locator('[data-v3-panel-zaehler]').first().click()
    await expect(page.locator('[data-v3-panel]').first()).toBeVisible({ timeout: 20_000 })

    // Schritt 2 — die Klappe über der Tafel.
    const klappe = page.locator('[data-v3-panel-steckbrief] [data-v3-uebersicht-zeile]')
    await expect(klappe, 'Steckbrief-Klappe im Panel nicht gefunden').toHaveCount(1)
    // Zugeklappt trägt sie bereits die Ruhezeile — sie kostet EINE Zeile, nicht
    // eine Tafel (dieselbe Zusage wie in der Leiste).
    await expect(klappe).toContainText('SR 312.0')
    await klappe.click()

    const stand = page.locator('[data-v3-panel] [data-v3-uebersicht-zeile-id="stand"] dd')
    await expect(stand).toBeVisible({ timeout: 10_000 })
    await expect(stand).toHaveText(/^\d{2}\.\d{2}\.\d{4}$/)
    // Und die Kette steht in der Ä80-Ordnung, auch hier — es ist dieselbe
    // Ableitung, nicht eine zweite (§5).
    const ids = await page.evaluate(() => [...document.querySelectorAll('[data-v3-panel] [data-v3-uebersicht-zeile-id]')]
      .map((d) => d.getAttribute('data-v3-uebersicht-zeile-id'))
      .filter((id) => ['datum', 'inkraft', 'stand'].includes(id ?? '')))
    expect(ids).toEqual(['datum', 'inkraft', 'stand'])

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  for (const breite of [720, 390]) {
    test(`(b) @${breite}: ☰ + ▸ — zwei Schritte bis zum Wert «Stand»`, async ({ page }) => {
      const fehler = fehlerSammeln(page)
      await page.setViewportSize({ width: breite, height: 844 })
      await page.goto('/gesetze/bund/STPO')
      await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
      // Ohne Spalte startet die Seite ohne Steckbrief — die Vorbedingung des Falls.
      await expect(page.locator('[data-v3-uebersicht]')).toHaveCount(0)

      await page.locator('[data-v3-gliederung-auf]').first().click()      // 1
      const blatt = page.locator('[data-gliederung-sheet]')
      await expect(blatt).toBeVisible({ timeout: 15_000 })
      await blatt.locator('[data-v3-uebersicht-zeile]').first().click()   // 2
      const stand = blatt.locator('[data-v3-uebersicht-zeile-id="stand"] dd')
      await expect(stand).toBeVisible({ timeout: 10_000 })
      await expect(stand).toHaveText(/^\d{2}\.\d{2}\.\d{4}$/)

      expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
    })
  }

  test('(c) keine Doppelanzeige: steht die Box in der Leiste, schweigt das Panel', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-uebersicht]')).toBeVisible({ timeout: 20_000 })

    await page.locator('[data-v3-panel-zaehler]').first().click()
    await expect(page.locator('[data-v3-panel]').first()).toBeVisible({ timeout: 20_000 })

    // Mit stehender Spalte trägt die Leiste den Steckbrief — das Panel wiederholt
    // ihn nicht. Daran hängt die Ä28-Zusage: die Warnung «massgeblich ist …» darf
    // auf der Seite nicht zweimal stehen, und sie steht in der Box.
    await expect(page.locator('[data-v3-panel-steckbrief]')).toHaveCount(0)
    await expect(page.locator('[data-v3-uebersicht]')).toHaveCount(1)
    await expect(page.locator('[data-v3-uebersicht-liste]')).toHaveCount(1)

    // ── GEGENPROBE in derselben Sitzung (§6.7) ────────────────────────────────
    // Ohne sie prüfte der Fall nur, dass die Klappe NIE erscheint. Die Gliederung
    // wird darum eingeklappt — dann trägt die Leiste den Steckbrief nicht mehr,
    // und das Panel muss ihn übernehmen.
    //
    // §6.3-ANPASSUNG, DEKLARIERT (Ä60 (c), David-Entscheid 17.8.2026): hier stand
    // «einklappen ⇒ `[data-v3-uebersicht]` 0 ⇒ Panel NEU aufziehen», weil ein
    // Klick neben das Panel es schloss. Beides gilt @1440 nicht mehr: das Panel
    // ist dort eine eigene SPUR (Layout, kein Blatt) und kennt keinen
    // Aussenklick, es bleibt also offen — und der Steckbrief wandert im selben
    // Augenblick hinein, weshalb `[data-v3-uebersicht]` gar nie auf 0 fällt.
    // Die geprüfte Zusage ist unverändert und sogar strenger: der Steckbrief ist
    // UMGEZOGEN, nicht verdoppelt (Ä28) — und der Umzug geschieht ohne zweite
    // Bedienhandlung.
    await page.locator('[data-v3-gliederung-zu]').click()
    await expect(page.locator('[data-v3-panel]').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-v3-aside]')).toHaveCount(0)

    await expect(page.locator('[data-v3-panel-steckbrief]')).toHaveCount(1)
    // Weiterhin genau EINE Label/Wert-Liste auf der Seite — der Steckbrief ist
    // umgezogen, nicht verdoppelt.
    await expect(page.locator('[data-v3-uebersicht-liste]')).toHaveCount(1)
    // Und er überlebt den Reiter-Wechsel: er gehört zum Panel, nicht zur Tafel.
    await page.locator('[data-v3-panel-reiter="materialien"]').click()
    await expect(page.locator('[data-v3-panel-steckbrief]')).toHaveCount(1)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  // ── (c2) Ä89 · die Klappe steht ÜBER den Reitern, nicht in einer Tafel ─────
  // BEFUND (Ästhetik-Prüfung, @1440 nachgemessen 18.8.2026): die Zeile lag bei
  // y = 245, die Reiter-Leiste bei y = 208 — also UNTER den Reitern, und
  // `[role=tabpanel]` enthielt sie (`imTabpanel: true`). Sie gehört aber zum
  // PANEL: ein Screenreader las sie als Teil von «Entscheide», und beim
  // Reiterwechsel wurde sie ab- und wieder aufgebaut.
  //
  // ROT ZU BEKOMMEN (§6.7, gefahren 18.8.2026): in `v3/LeserPanelZone.tsx` die
  // Zeile wieder um die Tafeln wickeln, statt sie als `steckbrief`-Prop an
  // `LeserPanel` zu geben.
  test('(c2) Ä89 · @1440: die Steckbrief-Zeile liegt über der Reiter-Leiste und ausserhalb der Tafel', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-uebersicht]')).toBeVisible({ timeout: 20_000 })
    await page.locator('[data-v3-gliederung-zu]').click()
    await page.locator('[data-v3-panel-zaehler]').first().click()
    await expect(page.locator('[data-v3-panel]').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-v3-panel-steckbrief]')).toHaveCount(1)

    const lage = await page.evaluate(() => {
      const sb = document.querySelector('[data-v3-panel-steckbrief]')!
      const tl = document.querySelector('[data-v3-panel] [role=tablist]')!
      const tp = document.querySelector('[data-v3-panel] [role=tabpanel]')!
      return {
        sbY: Math.round(sb.getBoundingClientRect().y),
        tablistY: Math.round(tl.getBoundingClientRect().y),
        imTabpanel: tp.contains(sb),
        // Und die Reiter-Leiste kann seit dem Nachzug waagrecht scrollen — ohne
        // das ist ein vierter Reiter (Kap. 14) unmöglich, er würde am Rand
        // abgeschnitten (gemessen: scrollWidth 369 gegen clientWidth 334).
        ovx: getComputedStyle(tl).overflowX,
      }
    })
    expect(lage.imTabpanel, 'die Steckbrief-Zeile liegt im tabpanel eines Reiters').toBe(false)
    expect(lage.sbY, `Steckbrief y=${lage.sbY} liegt nicht über der Reiter-Leiste y=${lage.tablistY}`)
      .toBeLessThan(lage.tablistY)
    expect(lage.ovx, 'die Reiter-Leiste kann nicht waagrecht scrollen').toBe('auto')
  })

  // ── (c3) P3 (3c) · @390 steht die Warnung genau EINMAL — auch mit beidem ───
  // Der Kommentar am Bau sagte bis 18.8.2026, der Defekt «sitze auf dem Desktop
  // mit eingeklappter Gliederung»; montiert wurde die Zeile aber in JEDER Lage
  // ohne stehende Leiste, also auch @390. Das ist richtig so — geprüft wird
  // darum die Zusage selbst (Ä28): in allen drei erreichbaren Kombinationen
  // steht die Warnung genau einmal.
  //
  // ── Ä81-NACHZUG (Integration A×B, 18.8.2026) · WORAN GEZÄHLT WIRD ─────────
  // Dieser Fall entstand im H4-Nachzug A und zählte `[data-v3-uebersicht-warnung]`
  // — das Warn-Fach der Box. Parallel entschied Nachzug B mit Ä81 «NUR DER KOPF
  // WARNT» und nahm der Box die `warnung`-Ausgabe (`v3/UebersichtBox.tsx`; das
  // Fach trägt seither nur noch den `vorbehalt`). Beide Zweige waren für sich
  // grün; erst zusammengeführt war der Fall ROT — gemessen im Integrationslauf
  // 18.8.2026: erwartet 1, vorhanden 0.
  // §6.3-DEKLARATION: die geprüfte SACHE bleibt Ä28 («der Sachverhalt steht
  // genau einmal, in jeder der drei Lagen»), die ZÄHLFLÄCHE wandert mit Ä81 vom
  // Box-Fach auf die SEITE — dieselbe Bewegung, die B in den beiden anderen
  // Fällen dieser Datei und in `leser-v3-nachzug-auskunft` schon vollzogen hat.
  // Gelockert wird nichts: aus EINER Zahl («1 im Box-Fach») werden DREI
  // Bedingungen je Lage (1 auf der Seite · 1 im Kopf · 0 im Box-Fach).
  // GEMESSEN 18.8.2026 @390 (StPO), {Steckbrief, Seite, Kopf, Box-Fach}:
  //   Grundzustand 0/1/1/0 · nur Panel 1/1/1/0 · nur Blatt 0/1/1/0 ·
  //   Blatt UND Panel 0/1/1/0.
  // ROT ZU BEKOMMEN (§6.7): in `v3/UebersichtBox.tsx` die `warnung`-Zeile wieder
  // in die Warn-Zelle setzen ⇒ Seite 2, Box-Fach 1 in den Lagen (2) und (3).
  test('(c3) @390: Warnung genau einmal — mit Panel, mit Blatt, mit beidem', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(400)

    // Nur BLATT-Absätze zählen, sonst zählt jede Hülle den Satz mit — dieselbe
    // Zählweise wie in den beiden Ä81-Fällen oben und in `nachzug-auskunft`.
    const warnLage = () => page.evaluate(() => {
      const blatt = [...document.querySelectorAll('p, li, dd')]
        .filter((el) => /noch nicht in den Text eingearbeitet/.test(el.textContent ?? ''))
        .filter((el) => !el.querySelector('p, li, dd'))
      return {
        aufDerSeite: blatt.length,
        imKopf: blatt.filter((el) => el.closest('header') !== null).length,
        imBoxFach: document.querySelectorAll('[data-v3-uebersicht-warnung]').length,
      }
    })
    const einmalImKopf = { aufDerSeite: 1, imKopf: 1, imBoxFach: 0 }

    // (1) nur das Panel: die Leiste steht nirgends, das Panel trägt den Steckbrief.
    await page.locator('[data-v3-panel-zaehler]').first().click()
    await expect(page.locator('[data-v3-panel]').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-v3-panel-steckbrief]')).toHaveCount(1)
    expect(await warnLage(), 'nur Panel: die Warnung steht nicht genau einmal im Kopf')
      .toEqual(einmalImKopf)
    await page.locator('[data-v3-panel-zu]').click()
    await expect(page.locator('[data-v3-panel]')).toHaveCount(0)

    // (2) nur das Gliederungs-Blatt: dort steht die Box, das Panel schweigt.
    await page.locator('[data-v3-gliederung-auf]').click()
    await expect(page.locator('[data-gliederung-sheet]')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('[data-v3-panel-steckbrief]')).toHaveCount(0)
    expect(await warnLage(), 'nur Blatt: die Box warnt neben dem Kopf ein zweites Mal (Ä81)')
      .toEqual(einmalImKopf)

    // (3) BEIDES offen. Der Scrim des modalen Blatts fängt echte Zeiger ab —
    // der Chip wird darum per DOM-Klick betätigt; erreichbar ist die Lage über
    // die Taste «r», sobald der Fokus die Blatt-Falle verlässt.
    await page.locator('[data-v3-panel-zaehler]').first().evaluate((e: HTMLElement) => e.click())
    await expect(page.locator('[data-v3-panel]').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-gliederung-sheet]')).toBeVisible()
    await expect(page.locator('[data-v3-panel-steckbrief]'),
      'mit stehendem Blatt trägt das Panel den Steckbrief ein zweites Mal').toHaveCount(0)
    expect(await warnLage(), 'Ä28/Ä81: die Warnung steht @390 mit Blatt UND Panel doppelt')
      .toEqual(einmalImKopf)
  })

  test('(d) BS-640.100 @390 und @1440: die Kantons-Zeilen bleiben sinnvoll (Ä80-Probe)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    for (const [w, h] of [[1440, 900], [390, 844]] as const) {
      await page.setViewportSize({ width: w, height: h })
      await boxOeffnenIrgendwo(page, '/gesetze/kanton/BS-640.100', w)
      const zeilen = await page.evaluate(() => [...document.querySelectorAll('[data-v3-uebersicht-liste] > div')]
        .map((d) => ({
          id: d.getAttribute('data-v3-uebersicht-zeile-id'),
          dt: (d.querySelector('dt')?.textContent ?? '').trim(),
          dd: (d.querySelector('dd')?.textContent ?? '').trim(),
        })))
      expect(zeilen.length, `@${w}: keine Steckbrief-Zeile — die Messung prüfte nichts`).toBeGreaterThan(0)
      // Keine leere Zusage (§8) und kein Wert, der mit der Präposition beginnt (Ä80).
      for (const z of zeilen) {
        expect(z.dd, `@${w}: leerer Wert an «${z.dt}»`).not.toBe('')
        if (['datum', 'inkraft', 'stand'].includes(z.id ?? '')) {
          expect(z.dd, `@${w}: «${z.dt}» trägt die Präposition im Wert: «${z.dd}»`).toMatch(/^\d/)
        }
      }
      if (zeilen.some((z) => z.id === 'datum')) {
        expect(zeilen.find((z) => z.id === 'datum')?.dt).toBe('Erlass vom')
      }
    }
    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})

/** Öffnet den Steckbrief auf dem kürzesten Weg der jeweiligen Breite. */
async function boxOeffnenIrgendwo(page: Page, pfad: string, breite: number): Promise<void> {
  await page.goto(pfad)
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  if (breite >= 1024) {
    await boxOeffnen(page, pfad)
    return
  }
  await page.locator('[data-v3-gliederung-auf]').first().click()
  const blatt = page.locator('[data-gliederung-sheet]')
  await expect(blatt).toBeVisible({ timeout: 15_000 })
  await blatt.locator('[data-v3-uebersicht-zeile]').first().click()
  await expect(blatt.locator('[data-v3-uebersicht-inhalt]')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(1200)
}

test.describe('a11y — die Klappe hat einen Namen und sagt ihren Zustand', () => {
  test('StPO: `summary` trägt einen Namen, `details` meldet auf/zu', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-uebersicht]')).toBeVisible({ timeout: 20_000 })

    const zeile = page.locator('[data-v3-uebersicht-zeile]').first()
    // Der zugängliche Name kommt aus dem Textinhalt — «Übersicht» plus die
    // Zusammenfassung, die im DOM steht, auch wenn die Box zu ist (§8).
    await expect(zeile).toContainText('Übersicht')
    await expect(zeile).toContainText('SR 312.0')

    const box = page.locator('[data-v3-uebersicht]').first()
    // `<details>`/`<summary>` bringen `aria-expanded` vom Browser mit — es steht
    // nicht im Markup, sondern im Barrierefreiheits-Baum. Geprüft wird darum
    // das `open`-Attribut, das ihn steuert, UND die vom Browser gemeldete Rolle.
    await expect(box).not.toHaveAttribute('open', /.*/)
    await zeile.click()
    await expect(box).toHaveAttribute('open', /.*/)
    const rolle = await zeile.evaluate((el) => (el as HTMLElement).tagName.toLowerCase())
    expect(rolle, 'die Klappe ist kein natives <summary> mehr').toBe('summary')

    // Tastatur: Enter auf dem fokussierten summary schliesst wieder.
    await zeile.focus()
    await page.keyboard.press('Enter')
    await expect(box).not.toHaveAttribute('open', /.*/)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})
