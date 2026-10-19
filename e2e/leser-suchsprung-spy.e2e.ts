// @shard-gruppe: 6
// ═══ LESER-NAV · FB O-36 (c) · NACH DEM SUCHSPRUNG MELDET DER SPY DAS ZIEL ═══
//
// BEFUND (#1278, am Stand 15.10.2026 neu gemessen: headless Chromium,
// `document.visibilityState === 'visible'`, 1440×900, `/gesetze/bund/OR` mit
// «Kündigung», Enter-Folge): ein Sprung zur Fundstelle stellte sie in die Mitte
// des Fensters. Bei KURZEN Artikeln lag deren Oberkante dann unter der Bezugslinie
// des Scroll-Spys, die Linie fiel in den Vorgänger — Reiter-Anker, Gliederung und
// Bezüge-Panel meldeten den Artikel DARÜBER. 11 von 13 Sprüngen mit gemalter
// Stelle (Art. 130 → «129», 255 → «254», 264 → «263», 266 → «265» …).
//
// ZUSAGE: nach einem Sprung (Enter) meldet der Spy den Artikel, in dem die
// aktive Fundstelle liegt. Gemessen am Reiter-Anker (`lexmetrik-tabs`), den der
// Spy schreibt — also an der Meldung selbst, nicht an einer Nachrechnung.
//
// Stop-and-go (webseiten-pruefung.md): die Wartezeit ist das Entprell-Fenster des
// Spys (150/200 ms), kein Scrollen mit Pausen; gesprungen wird ohne Zwischenscroll.
//
// ROT ZU BEKOMMEN (§6.7): in `inhalt-suchtreffer.tsx` den Block «LESER-NAV, FB O-36
// (c)» (die Zeile `art.scrollIntoView({ block: 'start' … })`) streichen ⇒ der
// Reiter-Anker zeigt nach dem 2. Sprung den Vorgänger (gemessen 15.10.2026).
import { test, expect, type Page } from '@playwright/test'

/** Der Artikel, den der Spy im Reiter-Anker des OR führt (`…/gesetze/bund/OR…#art-<token>`). */
async function spyArtikel(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const roh = localStorage.getItem('lexmetrik-tabs')
    if (!roh) return null
    try {
      const tabs = JSON.parse(roh) as Array<{ path?: string }>
      for (const t of tabs) {
        const m = (t.path ?? '').match(/gesetze\/bund\/OR[^#]*#(art-[^&]+)/)
        if (m) return m[1]
      }
    } catch { /* kein Reiter-Stand */ }
    return null
  })
}

async function aktiverArtikel(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const reg = (globalThis as { CSS?: { highlights?: Map<string, Iterable<Range>> } }).CSS?.highlights
    const r = [...(reg?.get('lc-such-aktiv') ?? [])][0]
    return r ? (r.startContainer.parentElement?.closest('article[id^="art-"]')?.id ?? null) : null
  })
}

test('nach dem Suchsprung meldet der Scroll-Spy den Zielartikel, nicht den Vorgänger', async ({ page }) => {
  test.slow() // ganzer OR, mehrere Sprünge
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/OR')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000 })
  const feld = page.locator('[data-v3-suchsprung] input').first()
  await expect(feld).toBeVisible({ timeout: 20000 })
  await page.evaluate(() => document.fonts?.ready)
  expect(await page.evaluate(() => document.visibilityState), 'Spy-Messung braucht einen sichtbaren Tab').toBe('visible')
  await feld.click()
  await feld.fill('Kündigung')
  await expect(page.locator('[data-treffer-liste]').first()).toBeVisible({ timeout: 20000 })
  await feld.press('Enter')

  // Die ersten Treffer liegen in den kurzen Artikeln 130 / 181 / 255 / 264 / 266.
  let geprueft = 0
  const abweichungen: string[] = []
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(900) // Entprellung des Spys + Reiter-Schreiber
    const aktiv = await aktiverArtikel(page)
    if (!aktiv) continue // Fundstelle ohne gemalten Text (Randtitel): kein Zielartikel messbar
    geprueft++
    await expect.poll(() => spyArtikel(page), { timeout: 5000, message: `Spy meldet nicht ${aktiv}` })
      .toBe(aktiv)
      .catch(async () => { abweichungen.push(`Sprung ${i + 1}: aktiv ${aktiv}, Spy ${await spyArtikel(page)}`) })
  }
  expect(geprueft, 'keine Sprünge mit gemalter Stelle — Vorbedingung fehlt (§6.7)').toBeGreaterThanOrEqual(4)
  expect(abweichungen, 'Spy meldet nach dem Sprung einen anderen Artikel als den Zielartikel').toEqual([])
})
