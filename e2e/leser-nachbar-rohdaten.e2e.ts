// @shard-gruppe: 4
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
