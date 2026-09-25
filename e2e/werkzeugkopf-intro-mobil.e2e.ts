// @shard-gruppe: 1
// ═══ WERKZEUGKOPF-EINLEITUNG MOBIL (W2·29-WERKBANK-REST S3, 25.9.2026) ══════
//
// Posten «WerkzeugKopf-Intro serif text-body-l ist mobil (390) sehr hoch»: der
// Katalog-Beschrieb (Tagerechner 382 Zeichen, Notariat 580) füllte @390 den
// ersten Bildschirm, bevor ein Feld kam. Soll: drei Zeilen + «Weiterlesen»
// unter 640 px, KEIN Textverlust (der volle Text bleibt im DOM), ab 640 px
// unverändert (`layout/WerkzeugKopf`).
//
// ROT ZU BEKOMMEN (§6.7, gefahren 25.9.2026 gegen dist/): in
// `WerkzeugKopf.tsx` die Klasse `max-sm:line-clamp-3` streichen ⇒ Fall
// «@390» rot (Einleitung höher als drei Zeilen, erstes Feld unter dem
// ersten Bildschirm). Messwerte im Commit-Text.
import { test, expect } from '@playwright/test'

const ROUTE = '/rechner/tagerechner'
const INTRO = 'main [data-werkzeug-intro]'

test('@390: drei Zeilen, «Weiterlesen» klappt den vollen Text auf', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(ROUTE)
  const intro = page.locator(INTRO).first()
  await expect(intro).toHaveAttribute('data-werkzeug-intro', 'gekuerzt', { timeout: 30_000 })
  const knopf = page.getByRole('button', { name: 'Weiterlesen' })
  await expect(knopf).toBeVisible()
  await expect(knopf).toHaveAttribute('aria-expanded', 'false')

  const mass = () => intro.evaluate((e) => {
    const zeile = parseFloat(getComputedStyle(e).lineHeight)
    return { hoehe: e.getBoundingClientRect().height, zeile, zeichen: (e.textContent ?? '').length }
  })
  const zu = await mass()
  // Kein Textverlust: der ganze Beschrieb steht im DOM (> 300 Zeichen).
  expect(zu.zeichen, 'voller Beschrieb im DOM').toBeGreaterThan(300)
  expect(zu.hoehe, `gekürzt ${zu.hoehe} px bei Zeile ${zu.zeile} px`).toBeLessThanOrEqual(3 * zu.zeile + 2)
  // Wirkung: das erste Eingabefeld steht im ersten Bildschirm.
  const feldTop = await page.locator('main input').first().evaluate((e) => e.getBoundingClientRect().top + window.scrollY)
  console.log(`@390 Einleitung ${Math.round(zu.hoehe)} px, erstes Feld y=${Math.round(feldTop)}`)
  expect(feldTop, 'erstes Feld im ersten Bildschirm (844 px)').toBeLessThan(844)

  await knopf.click()
  await expect(intro).toHaveAttribute('data-werkzeug-intro', 'offen')
  await expect(page.getByRole('button', { name: 'Einklappen' })).toHaveAttribute('aria-expanded', 'true')
  const auf = await mass()
  expect(auf.hoehe, 'aufgeklappt länger als drei Zeilen').toBeGreaterThan(3 * auf.zeile + 2)
  expect(auf.zeichen).toBe(zu.zeichen)
})

test('@1440: keine Kürzung, kein Knopf', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(ROUTE)
  const intro = page.locator(INTRO).first()
  await expect(intro).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: 'Weiterlesen' })).toBeHidden()
  const gekappt = await intro.evaluate((e) => e.scrollHeight > e.clientHeight + 1)
  expect(gekappt, 'ab 640 px steht der volle Beschrieb').toBe(false)
})
