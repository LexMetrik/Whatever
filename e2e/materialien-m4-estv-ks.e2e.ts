// @shard-gruppe: 4
// E6a M4 · Content-Release-DoD (§7c Playwright-Beweis): eine ESTV-KS-DB-Material-Karte rendert
// den SICHTBAREN amtlichen Live-Link (DAM-PDF-URL); die Materialien-Übersicht listet die neuen
// ESTV-Einträge und bleibt bei 390 px ohne horizontalen Overflow (§15 gefühlte Last / Lesbarkeit).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

test('MaterialLeser einer neuen ESTV-KS-DB-Karte zeigt den sichtbaren amtlichen Live-Link (§7c)', async ({ page }) => {
  const fehler = fehlerSammeln(page)
  await page.goto('/materialien/ESTV-KS-DBG-49')

  // Titel verbatim aus der amtlichen Download-Bezeichnung (Breadcrumb + h1 → role-Locator).
  await expect(page.getByRole('heading', { name: /Kreisschreiben Nr\. 49/ })).toBeVisible()

  // Prominenter, sichtbarer Live-Link zur amtlichen Fassung (§7c) mit der DAM-PDF-URL.
  const link = page.getByRole('link', { name: /Amtliche Fassung ↗/ })
  await expect(link).toBeVisible()
  const href = await link.getAttribute('href')
  expect(href).toContain('estv.admin.ch/dam/')
  expect(href).toContain('049-dv')

  expect(fehler, `Konsolen-/Seitenfehler:\n${fehler.join('\n')}`).toEqual([])
})

test('Materialien-Übersicht listet die neuen ESTV-KS-Einträge, 390px ohne Overflow (§15)', async ({ page }) => {
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/materialien')

  // register.json wird async gefetcht → auf einen neuen ESTV-KS-Titel warten (Stempel-Serie).
  await expect(page.getByText('Kreisschreiben Nr. 12: Umsatzabgabe', { exact: false }).first()).toBeVisible({ timeout: 15000 })

  // Kein horizontaler Overflow trotz der zusätzlichen ~90 ESTV-Karten (Lesbarkeit/§15).
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, `horizontaler Overflow ${overflow}px bei 390px`).toBeLessThanOrEqual(1)

  expect(fehler, `Konsolen-/Seitenfehler:\n${fehler.join('\n')}`).toEqual([])
})
