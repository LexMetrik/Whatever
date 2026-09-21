// @shard-gruppe: 3
// E6a M3 · Content-Release-DoD (§7c Playwright-Beweis): eine EDÖB-DB-Material-Karte rendert
// den SICHTBAREN amtlichen Live-Link (DAM-PDF-URL); die Materialien-Übersicht listet die neuen
// EDÖB-Einträge und bleibt bei 390 px ohne horizontalen Overflow (§15 gefühlte Last / Lesbarkeit).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

test('MaterialLeser einer neuen EDÖB-DB-Karte zeigt den sichtbaren amtlichen Live-Link (§7c)', async ({ page }) => {
  const fehler = fehlerSammeln(page)
  await page.goto('/materialien/EDOEB-MERKBLATT-ANMELDEFORMULARE-MIETWOHNUNGEN')

  // Titel verbatim aus der amtlichen Download-Bezeichnung (Breadcrumb + h1 → role-Locator).
  await expect(page.getByRole('heading', { name: /Merkblatt Anmeldeformulare für Mietwohnungen/ })).toBeVisible()

  // Prominenter, sichtbarer Live-Link zur amtlichen Fassung (§7c) mit der DAM-PDF-URL.
  const link = page.getByRole('link', { name: /Amtliche Fassung ↗/ })
  await expect(link).toBeVisible()
  const href = await link.getAttribute('href')
  expect(href).toContain('edoeb.admin.ch/dam/')
  expect(href).toContain('Anmeldeformularen')

  expect(fehler, `Konsolen-/Seitenfehler:\n${fehler.join('\n')}`).toEqual([])
})

test('Materialien-Übersicht listet die neuen EDÖB-Einträge, 390px ohne Overflow (§15)', async ({ page }) => {
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/materialien')

  // register.json wird async gefetcht → auf einen neuen EDÖB-Titel warten (BGÖ-Sektion).
  await expect(page.getByText('Leitfaden Gesuchsbeurteilung', { exact: false }).first()).toBeVisible({ timeout: 15000 })

  // Kein horizontaler Overflow trotz der zusätzlichen EDÖB-Karten (Lesbarkeit/§15).
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, `horizontaler Overflow ${overflow}px bei 390px`).toBeLessThanOrEqual(1)

  expect(fehler, `Konsolen-/Seitenfehler:\n${fehler.join('\n')}`).toEqual([])
})
