// @shard-gruppe: 6
// ═══ LESER-NAV · FB O-36 (d) · OFFENE TREFFERLISTE UND FUSSZEILE ═════════════
//
// BEFUND (Nachzug #1262, am heutigen Stand 15.10.2026 neu gemessen, headless
// Chromium, `document.visibilityState === 'visible'`, `/gesetze/bund/OR` mit
// «Kündigung», Liste OFFEN, ans Dokument-Ende gescrollt, 1440×900):
// 7 von 8 Fusszeilen-Links lagen unter der Trefferliste. Der Scroller der Liste
// hängt seit PE-C5-D01 an einem Anker ohne Höhe und ragt deshalb frei unter die
// Lese-Zelle; am Dokument-Ende lag er über der Fusszeile.
//
// ZUSAGE: die Fusszeile steht über der Liste — jeder ihrer Links ist am
// Dokument-Ende trefferfähig (`elementFromPoint` liefert den Link selbst).
//
// NICHT Teil der Zusage (bewusst, gemessen 15.10.2026): @375 steht die Liste am
// Dokument-Ende nicht mehr im Bild (Leiste bei −131 px). Dort ist die Fusszeile
// höher als das Fenster; die Liste wandert mit dem Ende der Lese-Zelle aus dem
// Bild, wie der Text, den sie vertritt. Scrollen zurück bringt sie wieder.
//
// ROT ZU BEKOMMEN (§6.7): in `components/layout/Footer.tsx` `relative z-sticky`
// vom `<footer>` streichen ⇒ 7 von 8 Links werden von der Liste verdeckt
// (gemessen 15.10.2026).
//
// ZWEITER FALL (Nachzug zur Gegenprüfung 15.10.2026, M1): die Fusszeile steht
// über der Liste, ABER sie darf die Treffer-Landkarte nicht verdecken. Die
// Landkarte ist `fixed` am Fensterrand und steht nur bei GESCHLOSSENER Liste.
// Gemessen vorher (1440×900, OR/«Kündigung», Liste zu, Dokument-Ende): Fusszeile
// ab y=565, Landkarte 174–876 ⇒ 311 von 702 px (44 %) der Marken lagen unter der
// Fusszeile, Klicks dort trafen die Fusszeile. Ursache: beide `z-sticky`, die
// Fusszeile steht später im DOM. Jetzt trägt die Landkarte `z-entscheid-sticky`.
// ROT ZU BEKOMMEN (§6.7): in `components/leser/TrefferLandkarte.tsx`
// `z-entscheid-sticky` wieder auf `z-sticky` setzen.
import { test, expect, type Page } from '@playwright/test'

// Ans Dokument-Ende und dort bleiben: die Seite ist lang und wächst beim
// Scrollen (content-visibility). Statt fester Pausen wird gepollt, bis die
// Dokumenthöhe zwischen zwei Messungen gleich ist und der Rest-Abstand 0 beträgt.
async function ansDokumentEnde(page: Page) {
  let vorher = -1
  await expect.poll(async () => {
    const [h, rest] = await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight)
      return [document.documentElement.scrollHeight,
        Math.round(document.documentElement.scrollHeight - window.scrollY - window.innerHeight)]
    })
    const stabil = h === vorher && rest <= 1
    vorher = h
    return stabil
  }, { message: 'Dokument-Ende erreicht und Höhe stabil', timeout: 30000, intervals: [150, 250] }).toBe(true)
}

test('offene Trefferliste verdeckt am Dokument-Ende keinen Fusszeilen-Link', async ({ page }) => {
  test.slow() // ganzer OR mit Suche
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/OR')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000 })
  const feld = page.locator('[data-v3-suchsprung] input').first()
  await expect(feld).toBeVisible({ timeout: 20000 })
  await page.evaluate(() => document.fonts?.ready)
  await feld.click()
  await feld.fill('Kündigung')
  await expect(page.locator('[data-treffer-liste]').first()).toBeVisible({ timeout: 20000 })
  // Die Liste bleibt offen (kein Enter, kein Esc).
  await ansDokumentEnde(page)
  expect(await page.evaluate(() => document.visibilityState), 'Scroll-Messung braucht einen sichtbaren Tab').toBe('visible')
  await expect(page.locator('[data-v3-treffer-spalte-scroller]')).toBeVisible()

  const r = await page.evaluate(() => {
    const links = [...document.querySelectorAll('footer a')]
    let treffbar = 0
    const verdeckt: string[] = []
    for (const a of links) {
      const b = a.getBoundingClientRect()
      const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
      if (el && (a === el || a.contains(el))) treffbar++
      else verdeckt.push(`${(a.textContent ?? '').trim().slice(0, 30)} unter ${el?.tagName ?? 'null'}`)
    }
    return { gesamt: links.length, treffbar, verdeckt }
  })
  expect(r.gesamt, 'keine Fusszeilen-Links — Vorbedingung fehlt (§6.7)').toBeGreaterThanOrEqual(6)
  expect(r.verdeckt, `${r.verdeckt.length} von ${r.gesamt} Fusszeilen-Links liegen unter der Trefferliste`).toEqual([])
})

for (const breite of [1280, 1440]) {
  test(`Fusszeile verdeckt am Dokument-Ende die Treffer-Landkarte nicht (${breite} px)`, async ({ page }) => {
    test.slow() // ganzer OR mit Suche
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: breite, height: 900 })
    await page.goto('/gesetze/bund/OR')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000 })
    const feld = page.locator('[data-v3-suchsprung] input').first()
    await expect(feld).toBeVisible({ timeout: 20000 })
    await page.evaluate(() => document.fonts?.ready)
    await feld.click()
    await feld.fill('Kündigung')
    await expect(page.locator('[data-treffer-liste]').first()).toBeVisible({ timeout: 20000 })
    await feld.press('Enter') // Liste zu ⇒ die Landkarte steht
    await expect(page.locator('[data-treffer-liste]')).toHaveCount(0)
    await expect(page.locator('[data-treffer-landkarte]')).toBeVisible()
    await ansDokumentEnde(page)
    expect(await page.evaluate(() => document.visibilityState), 'Scroll-Messung braucht einen sichtbaren Tab').toBe('visible')

    const r = await page.evaluate(() => {
      const k = document.querySelector('[data-treffer-landkarte]')!
      const kb = k.getBoundingClientRect()
      const fuss = document.querySelector('footer')!.getBoundingClientRect()
      const proben = 12
      const verdeckt: string[] = []
      for (let i = 0; i < proben; i++) {
        const y = kb.top + 4 + ((kb.height - 8) * i) / (proben - 1)
        const el = document.elementFromPoint(kb.left + kb.width / 2, y)
        if (!(el && k.contains(el))) verdeckt.push(`y=${Math.round(y)} unter ${el?.tagName ?? 'null'}`)
      }
      return { proben, verdeckt, kartenfuss: Math.round(kb.bottom), fussTop: Math.round(fuss.top) }
    })
    expect(r.fussTop, 'Vorbedingung: die Fusszeile reicht in den Bereich der Landkarte (§6.7)').toBeLessThan(r.kartenfuss)
    expect(r.verdeckt, `${r.verdeckt.length} von ${r.proben} Landkarten-Punkten liegen unter der Fusszeile`).toEqual([])
  })
}
