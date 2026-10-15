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
import { test, expect } from '@playwright/test'

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
  // Die Liste bleibt offen (kein Enter, kein Esc). Mehrfach ans Ende: die Seite
  // ist lang und wächst beim Scrollen (content-visibility).
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(400)
  }
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
