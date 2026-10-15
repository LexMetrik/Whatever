// @shard-gruppe: 6
// ═══ LESER-NAV · FB O-36 (e) · TIEFLINK AUF EINEN ANHANG-ZWISCHENTITEL ═══════
//
// ZUSAGE: `/gesetze/bund/ASYLV1#anh-annex_2-1` landet mit dem Zwischentitel UNTER
// dem klebenden Kopf (Klasse `nt-anker` ⇒ `scroll-margin-top`), nicht dahinter.
// Gemessen 15.10.2026 (headless, `document.visibilityState === 'visible'`,
// 1440×900): mit Klasse liegt die Oberkante bei y=153 (Rand 154 px), ohne Klasse
// bei y=0 — unter dem Kopf (Unterkante 64 px).
//
// ROT ZU BEKOMMEN (§6.7): in `components/normtext/ArtikelBody.tsx` bei den
// Anhang-Zwischentiteln `zitierKontext` aus der `nt-anker`-Bedingung streichen.
import { test, expect } from '@playwright/test'

test('Tieflink auf einen Anhang-Zwischentitel landet unter dem klebenden Kopf', async ({ page }) => {
  test.slow() // ganzer Erlass
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/ASYLV1#anh-annex_2-1')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000 })
  const ziel = page.locator('#anh-annex_2-1')
  await expect(ziel).toHaveCount(1)
  expect(await page.evaluate(() => document.visibilityState), 'Scroll-Messung braucht einen sichtbaren Tab').toBe('visible')
  // Poll bis der Sprung gelandet ist (Ziel im Bild, nicht mehr weit darunter) UND
  // das Ziel zwischen zwei Messungen still steht (content-visibility lädt nach).
  // Ohne die Bild-Bedingung misst der Poll die Ruhe VOR dem Sprung und das Tor
  // bliebe auch ohne Klasse grün (§6.7, gemessen 15.10.2026).
  let vorher = Number.NaN
  await expect.poll(async () => {
    const y = await ziel.evaluate((el) => Math.round(el.getBoundingClientRect().top))
    const gelandet = y >= 0 && y < 900
    const ruhig = gelandet && y === vorher
    vorher = y
    return ruhig
  }, { message: 'Sprung gelandet und Ziel steht still', timeout: 20000, intervals: [200, 300] }).toBe(true)

  const r = await ziel.evaluate((el) => {
    const kopfUnten = Math.max(0, ...[...document.querySelectorAll('header, [class*="sticky"]')].map((e) => {
      const p = getComputedStyle(e).position
      const b = e.getBoundingClientRect()
      return (p === 'sticky' || p === 'fixed') && b.top <= 1 && b.height < 300 ? b.bottom : 0
    }))
    return { top: Math.round(el.getBoundingClientRect().top), kopfUnten: Math.round(kopfUnten) }
  })
  expect(r.kopfUnten, 'Vorbedingung: es gibt einen klebenden Kopf (§6.7)').toBeGreaterThan(0)
  expect(r.top, `Zwischentitel liegt bei y=${r.top} hinter dem Kopf (Unterkante ${r.kopfUnten})`).toBeGreaterThanOrEqual(r.kopfUnten)
})
