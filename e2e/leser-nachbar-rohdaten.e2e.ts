// @shard-gruppe: 7
// ═══ W2·5m · NACHBAR-ARTIKEL-PFEILE UND ROHDATEN-LINK IM BROWSER ════════════
//
// Was die Vitest-Sonden NICHT sagen können und diese Spec darum misst:
//  · ob die Pfeile am ECHTEN Erlass die richtigen Nachbarn treffen — mit den
//    Token, die der ausgelieferte Snapshot wirklich führt, nicht mit einer
//    Fixture (OR 337c → 337b/337d ist genau die «a»/Buchstaben-Nachbarschaft,
//    an der eine selbstgebaute Sortierung scheitern würde);
//  · ob der Anker beim Klick tatsächlich zum Nachbarn springt;
//  · ob ein Kantonserlass unverändert rendert (S4-Probe des Fahrplans);
//  · ob der Rohdaten-Link auf eine Adresse zeigt, die auch WIRKLICH einen
//    Snapshot ausliefert (HTTP 200 + JSON) — ein Link, dessen Ziel 404 ist,
//    besteht jede DOM-Sonde und keine einzige Nutzung.
//
// ── ROT ZU BEKOMMEN (§6.7), je Fall ─────────────────────────────────────────
//  (a) In `v3/nachbarArtikel.ts` `vor`/`nach` vertauschen ⇒ «337c hat 337b
//      davor» wird rot.
//
// ZUR SCHREIBWEISE DER ANKER: der Snapshot führt Art. 337c als Token `337_c`
// (Label «Art. 337c»), der Anker heisst also `#art-337_c`. Diese Spec benutzt
// bewusst die ECHTEN Token des ausgelieferten Artefakts — genau daran wäre
// eine aus dem Label geratene Anker-Bildung aufgefallen.
//  (b) In `parts/ArtikelNachbarn.tsx` `href` auf `#` setzen ⇒ der Klick landet
//      nicht am Nachbarn.
//  (c) In `v3/rohdatenZeiger.ts` `/normtext/` durch `/rohdaten/` ersetzen ⇒ das
//      Ziel antwortet 404.
// Alle drei so gemessen (14.9.2026, chromium, Projekt `leser-v3`).
//
// ── ERGÄNZUNG 14.9.2026 (W2·5m E1/E2) · DER ORT DER PFEILE HAT GEWECHSELT ───
// Die Sätze oben bleiben Wort für Wort stehen: sie beschreiben ihren Stand, und
// ein datierter Beleg wird ergänzt, nicht nachgeführt (§0 Ziff. 2b). Was sich
// geändert hat, ist eine FACHLICHE Entscheidung Davids vom selben Tag (D-E1,
// wörtlich): «das bringt aber nur etwas wenn man einzeln einen artikel hat.
// wenn man einfach scrollen kann dann bringt das ja nichts.»
//
// Die Pfeile stehen seither NUR im Einzelmodus (`?ansicht=artikel`). Diese Spec
// misst darum dort weiter, was sie vorher in der Gesamtansicht mass — Sache,
// Nachbarschaft und Anker-Integrität sind unverändert, nur die Adresse ist eine
// andere. Das ist keine Anpassung eines Tests an den Code (§6.3), sondern der
// deklarierte Nachvollzug einer Verhaltens-Änderung: dass in der Gesamtansicht
// KEIN Pfeil mehr steht, ist eigens gesondert bewacht
// (`e2e/leser-einzelmodus.e2e.ts`, Fall «D-E1 · Rückbau #854»).
//
// Der zweite Block dieser Datei (Rohdaten-Link) ist unberührt: er hängt an der
// Übersichtsbox des Erlasses, nicht am Artikel.
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const OR = '/gesetze/bund/OR'
/** S4-Probe: ein Kantonserlass muss unverändert rendern (Fokus Bund, nichts bricht). */
const KANTON = '/gesetze/kanton/BS-640.100'
/** W2·5m · die Pfeile leben seit D-E1 im Einzelmodus (s. Kopf). Die Adresse
 *  trägt ihn; der Anker `#art-…` ist unverändert derselbe wie zuvor. */
const einzel = (pfad: string, token: string) => `${pfad}?ansicht=artikel#art-${token}`

test.describe('W2·5m — Nachbar-Artikel-Pfeile', () => {
  test('OR Art. 337c: der Vorgänger ist 337b, der Nachfolger 337d', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto(einzel(OR, '337_c'))
    await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 30_000 })
    const kopf = page.locator('#art-337_c [data-artikel-nachbarn]').first()
    await expect(kopf).toBeVisible({ timeout: 20_000 })

    // Die Buchstaben-Kette 337a/b/c/d ist der Fall, an dem eine nummern-
    // vergleichende Sortierung auseinanderfiele. Gemessen wird die ADRESSE,
    // nicht die Beschriftung: sie ist das, was der Klick benutzt.
    //
    // W2·5m: sie ist seit D-E1 die VOLLE Adresse und kein blosser In-Page-Anker
    // — im Einzelmodus ist der Nachbar die nächste Seite, nicht eine Stelle im
    // selben Dokument, und die Lesart muss mitwandern. Der Anker `#art-…`
    // darin ist unverändert derselbe wie zuvor (§5, `v3/einzelModus.ts`).
    await expect(kopf.locator('[data-nachbar="vor"]'))
      .toHaveAttribute('href', `${OR}?ansicht=artikel#art-337_b`)
    await expect(kopf.locator('[data-nachbar="nach"]'))
      .toHaveAttribute('href', `${OR}?ansicht=artikel#art-337_d`)
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('der Klick springt wirklich zum Nachbarn (echter Anker, keine Attrappe)', async ({ page }) => {
    await page.goto(einzel(OR, '337_c'))
    await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('#art-337_c [data-artikel-nachbarn]').first()).toBeVisible({ timeout: 20_000 })

    await page.locator('#art-337_c [data-nachbar="nach"]').first().click()
    await expect.poll(() => page.evaluate(() => location.hash), { timeout: 10_000 })
      .toBe('#art-337_d')
    // Und der Zielartikel steht danach im Bild — die Adresse wirkt, sie steht
    // nicht nur im Browserfeld. Im Einzelmodus heisst das: er ist der EINE
    // gezeigte Artikel (vorher: er war an die richtige Stelle gescrollt).
    await expect(page.locator('[data-einzel-artikel="337_d"]')).toBeVisible({ timeout: 20_000 })
    const sichtbar = await page.evaluate(() => {
      const el = document.getElementById('art-337_d')
      if (!el) return null
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight && r.bottom > 0
    })
    expect(sichtbar).toBe(true)
  })

  test('der erste Artikel des Erlasses trägt keinen Vorgänger-Pfeil (§8, kein totes Ziel)', async ({ page }) => {
    await page.goto(einzel(OR, '1'))
    await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 30_000 })
    const kopf = page.locator('#art-1 [data-artikel-nachbarn]').first()
    await expect(kopf).toBeVisible({ timeout: 20_000 })
    await expect(kopf.locator('[data-nachbar="vor"]')).toHaveCount(0)
    await expect(kopf.locator('[data-nachbar="nach"]')).toHaveCount(1)
  })

  test('kein Pfeil zeigt auf ein Ziel, das die Seite nicht hat (Anker-Integrität)', async ({ page }) => {
    await page.goto(einzel(OR, '337_c'))
    await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('#art-337_c [data-artikel-nachbarn]').first()).toBeVisible({ timeout: 20_000 })
    // ── W2·5m · DIE INTEGRITÄTS-FRAGE HAT SICH VERSCHOBEN ──────────────────
    // Vorher zeigten die Pfeile in DASSELBE Dokument, und «tot» hiess: keine
    // Element-id dazu. Im Einzelmodus steht nur EIN Artikel im DOM, der Pfeil
    // führt auf eine andere Seite — die id-Prüfung könnte dort gar nicht mehr
    // gelten. Tot heisst jetzt: eine Adresse, die keinen Artikel benennt (leerer
    // Token, verlorener Modus, falscher Erlass). DASS das Ziel den Artikel
    // wirklich führt, prüft `nachbarToken` an der amtlichen Reihung
    // (`src/tests/leser-einzelmodus.test.ts`) und der Blätter-Fall in
    // `e2e/leser-einzelmodus.e2e.ts` am echten Korpus.
    const tot = await page.evaluate(() => [...document.querySelectorAll('[data-nachbar]')]
      .map((a) => (a as HTMLAnchorElement).getAttribute('href') ?? '')
      .filter((h) => !/\?ansicht=artikel#art-.+$/.test(h)))
    expect(tot).toEqual([])
  })

  test('S4-Probe: der Kantonserlass rendert mit denselben Pfeilen, ohne Sonderweg', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto(`${KANTON}?ansicht=artikel`)
    await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-artikel-nachbarn]').first()).toBeVisible({ timeout: 20_000 })
    const anzahl = await page.locator('[data-nachbar]').count()
    expect(anzahl).toBeGreaterThan(0)
    expect(fehler, fehler.join('\n')).toEqual([])
  })
})

test.describe('W2·5m — Rohdaten-Link je Erlass', () => {
  test('der Link steht in der Übersichtsbox und sein Ziel liefert wirklich JSON', async ({ page, request }) => {
    await page.goto(OR)
    await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-v3-uebersicht]')).toBeVisible({ timeout: 20_000 })
    await page.locator('[data-v3-uebersicht-zeile]').first().click()
    const zeile = page.locator('[data-v3-uebersicht-rohdaten]').first()
    await expect(zeile).toBeVisible({ timeout: 10_000 })

    const ziel = await zeile.locator('a').first().getAttribute('href')
    expect(ziel).toBe('/normtext/bund/OR.json')
    // Der Stand steht daneben — ein Artefakt ohne Datum ist kein Zitat (§7 a).
    await expect(zeile).toContainText(/Fassung \d{2}\.\d{2}\.\d{4}/)

    // DER PUNKT DIESER SONDE: das Ziel wird abgerufen. Ein toter Link besteht
    // jede DOM-Prüfung und keine einzige Nutzung.
    const antwort = await request.get(new URL(ziel as string, page.url()).toString())
    expect(antwort.status()).toBe(200)
    const daten = await antwort.json() as { eintraege?: unknown[] }
    expect(Array.isArray(daten.eintraege)).toBe(true)
  })

  test('der Rohdaten-Link steht NEBEN der amtlichen Fassung, nicht in ihrer Reihe (§7/§8)', async ({ page }) => {
    await page.goto(OR)
    await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 30_000 })
    await page.locator('[data-v3-uebersicht-zeile]').first().click()
    await expect(page.locator('[data-v3-uebersicht-rohdaten]').first()).toBeVisible({ timeout: 10_000 })
    // Die amtliche Zeile trägt weiterhin nur amtliche Ziele: kein `/normtext/`
    // darin — sonst stünde unsere Kopie neben der massgeblichen Fassung.
    const amtliche = await page.locator('[data-v3-uebersicht-quellen] a')
      .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href') ?? ''))
    expect(amtliche.some((h) => h.startsWith('/normtext/'))).toBe(false)
    expect(amtliche.length).toBeGreaterThan(0)
  })
})

// ═══ W2·17-UI-BEFUNDE · NACHBAR-PFEILE: LANGE BESCHRIFTUNG, TREFFERFLÄCHE, GRUPPE ═
//
// Vier Befunde der Gesamtprüfung, je am gebauten Stand im Browser belegt
// (2.10.2026) und hier festgehalten. Sie ERGÄNZEN die Fälle oben (§6.3).
//
//  (D01) B11-D01 · HAÜ Art. 48: der Nachbar ist ein Anhang mit 244 Zeichen
//        Beschriftung. `white-space: nowrap` machte den Pfeil 1261 px breit — die
//        Seite war @1440 1870 px, @375 1337 px breit (waagrechter Bildlauf).
//  (D02) B11-D02 · der Pfeil im Artikelkopf war 13 px hoch (11 px Schrift), unter
//        dem 24-px-Mindestmass der Trefferfläche (DESIGN-REGLEMENT F9).
//  (D03) B11-D03 · am ersten Artikel stand «Art. 2 ›» im Fuss-Paar LINKS, am
//        zweiten rechts — dieselbe Bedienung sprang von Seite zu Seite.
//  (D04) B11-D04 · OR Art. 1186 → «Art. 1 ›»: der Nachbar ist Art. 1 der
//        Schlussbestimmungen von 1962, nicht der Hauptartikel.
//
// ROT ZU BEKOMMEN (§6.7), am Bau gesehen:
//  (D01) `parts/ArtikelNachbarn.tsx`: `whitespace-nowrap` wieder an `PFEIL_KLASSEN`
//        und `min-w-0 max-w-full` streichen ⇒ Seite breiter als das Fenster.
//  (D02) `after:absolute after:inset-x-0 after:-inset-y-1.5` streichen ⇒ der
//        Treffer-Test 5 px über dem Pfeil liefert die Kopfzeile.
//  (D03) `ml-auto` am Nachfolger streichen ⇒ der Pfeil steht links.
//  (D04) in `v3/nachbarArtikel.ts` `gruppeWechsel` auf `false` setzen ⇒ der
//        zugängliche Name nennt keine Gruppe.
test.describe('W2·17-UI-BEFUNDE — Nachbar-Pfeile: Darstellung', () => {
  const HAUE = '/gesetze/international/HAUE'

  for (const [w, h] of [[375, 800], [1024, 800], [1440, 900]] as const) {
    test(`(D01) HAÜ Art. 48 @${w}: die lange Beschriftung des Nachbarn sprengt weder Spalte noch Seite`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h })
      await page.goto(einzel(HAUE, '48'))
      await expect(page.locator('[data-nachbar="nach"]').first()).toBeVisible({ timeout: 30_000 })
      // Vorbedingung (§6.7): der Nachbar ist wirklich der lange Anhang, sonst ist «passt» trivial wahr.
      const name = await page.locator('[data-nachbar="nach"]').first().getAttribute('aria-label')
      expect(name, 'Nachbar ist nicht der Anhang — Vorbedingung fehlt').toContain('Verzeichnis der zentralen')

      const mass = await page.evaluate(() => {
        const paare = [...document.querySelectorAll('[data-artikel-nachbarn]')]
        return {
          seite: document.documentElement.scrollWidth, fenster: innerWidth,
          paare: paare.length,
          draussen: paare.flatMap((p) => {
            const pr = p.getBoundingClientRect()
            return [...p.querySelectorAll('[data-nachbar]')].map((a) => {
              const r = a.getBoundingClientRect()
              return { art: a.getAttribute('data-nachbar'), links: Math.round(r.left - pr.left), rechts: Math.round(r.right - pr.right), hoch: Math.round(r.height), breit: Math.round(r.width), bis: Math.round(r.right) }
            })
          }),
        }
      })
      expect(mass.paare, 'Kopf- und Fuss-Paar erwartet').toBe(2)
      expect(mass.seite, `Seite ${mass.seite} px breit bei ${mass.fenster} px Fenster`).toBeLessThanOrEqual(mass.fenster)
      for (const k of mass.draussen) {
        expect(k.rechts, `Pfeil «${k.art}» ragt ${k.rechts} px aus seinem Paar`).toBeLessThanOrEqual(1)
        expect(k.links, `Pfeil «${k.art}» ragt ${-k.links} px links aus seinem Paar`).toBeGreaterThanOrEqual(-1)
        expect(k.breit, `Pfeil «${k.art}» ${k.breit} px breit bei ${mass.fenster} px Fenster`).toBeLessThanOrEqual(mass.fenster)
        // Auch dort, wo ein Vorfahr den Überlauf abschneidet und `scrollWidth` ihn nicht meldet (@1440 gemessen).
        expect(k.bis, `Pfeil «${k.art}» endet bei ${k.bis} px, das Fenster bei ${mass.fenster} px`).toBeLessThanOrEqual(mass.fenster)
      }
      // Die Auskunft geht nicht verloren: der VOLLE Wortlaut steht am Pfeil (title), nur die Darstellung kürzt.
      const titel = await page.locator('[data-nachbar="nach"]').first().getAttribute('title')
      expect(titel ?? '').toContain('Verzeichnis der zentralen und der zuständigen Behörden')
      // Im Fuss höchstens zwei Zeilen (11 px · 1.5 ≈ 17 px je Zeile) — kein Textblock von 20 Zeilen.
      const fuss = page.locator('[data-artikel-nachbarn] [data-nachbar="nach"]').last()
      expect((await fuss.boundingBox())!.height, 'Fuss-Pfeil höher als zwei Zeilen').toBeLessThanOrEqual(80)
    })
  }

  test('(D02) @375 der Pfeil im Artikelkopf trifft auch 5 px über und unter seiner Schrift', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto(einzel(OR, '337_c'))
    const pfeil = page.locator('#art-337_c [data-artikel-nachbarn] [data-nachbar="nach"]').first()
    await expect(pfeil).toBeVisible({ timeout: 30_000 })
    const treffer = await pfeil.evaluate((a) => {
      const r = a.getBoundingClientRect()
      const x = r.left + r.width / 2
      const wer = (y: number) => !!document.elementFromPoint(x, y)?.closest('[data-nachbar]')
      return { hoch: r.height, oben: wer(r.top - 5), mitte: wer(r.top + r.height / 2), unten: wer(r.bottom + 5) }
    })
    expect(treffer.mitte, 'Vorbedingung: die Mitte trifft den Pfeil').toBe(true)
    expect(treffer.oben, `Pfeil ${treffer.hoch} px hoch: 5 px darüber trifft ihn nicht`).toBe(true)
    expect(treffer.unten, `Pfeil ${treffer.hoch} px hoch: 5 px darunter trifft ihn nicht`).toBe(true)
  })

  test('(D03) am ersten Artikel steht der Nachfolger im Fuss rechts — wie überall sonst', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(einzel(OR, '1'))
    const paar = page.locator('[data-artikel-nachbarn]').last()
    await expect(paar.locator('[data-nachbar="nach"]')).toBeVisible({ timeout: 30_000 })
    await expect(paar.locator('[data-nachbar="vor"]'), 'Vorbedingung: am ersten Artikel gibt es keinen Vorgänger').toHaveCount(0)
    const abstand = await paar.evaluate((p) => {
      const a = p.querySelector('[data-nachbar="nach"]')!.getBoundingClientRect()
      return Math.round(p.getBoundingClientRect().right - a.right)
    })
    expect(abstand, `«Art. 2 ›» steht ${abstand} px links vom rechten Rand des Paars`).toBeLessThanOrEqual(1)
  })

  test('(D04) OR Art. 1186 → der Nachfolger ist Art. 1 der Schlussbestimmungen und sagt es (Kopf UND Fuss)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(einzel(OR, '1186'))
    const nach = page.locator('[data-artikel-nachbarn] [data-nachbar="nach"]')
    await expect(nach).toHaveCount(2, { timeout: 30_000 })
    // Die Gliederung (Sidecar) lädt nach — der Name wird danach eindeutig.
    for (const i of [0, 1]) {
      await expect(nach.nth(i), 'der zugängliche Name nennt die Gruppe nicht')
        .toHaveAttribute('aria-label', /Schlussbestimmungen der Änderung vom 23\. März 1962/, { timeout: 20_000 })
    }
    await expect(nach.nth(1).locator('[data-nachbar-gruppe]')).toHaveText('Schlussbestimmungen der Änderung vom 23. März 1962')
    await expect(nach.nth(1).locator('[data-nachbar-label]')).toHaveText('Art. 1')
  })

  test('(D04) innerhalb einer Gruppe bleibt der Pfeil kurz: kein Gruppenname unter jedem Artikel', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(einzel(OR, 'disp_u2_art_2'))
    await expect(page.locator('[data-nachbar="nach"]').first()).toBeVisible({ timeout: 30_000 })
    await page.waitForTimeout(1500) // das Sidecar hätte die Gruppe inzwischen nachgeladen
    await expect(page.locator('[data-nachbar-gruppe]')).toHaveCount(0)
  })
})
