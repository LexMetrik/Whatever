// @shard-gruppe: 8
// E6a M2 · Content-Release-DoD (§7c Playwright-Beweis): eine SECO-DB-Material-Karte rendert
// den SICHTBAREN amtlichen Live-Link; die Materialien-Übersicht listet die neuen Einträge und
// bleibt bei 390 px ohne horizontalen Overflow (§15 gefühlte Last / Lesbarkeit).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

test('MaterialLeser einer neuen SECO-DB-Karte zeigt den sichtbaren amtlichen Live-Link (§7c)', async ({ page }) => {
  const fehler = fehlerSammeln(page)
  await page.goto('/materialien/SECO-WL-ARG-ART-3A')

  // Titel verbatim aus der amtlichen Download-Bezeichnung. Strikter Locator
  // (Test-Präzisierung, keine fachliche Änderung): der Titel steht doppelt —
  // Breadcrumb + h1 — getByText allein ist eine strict-mode-violation.
  await expect(page.getByRole('heading', { name: /ArG Artikel 3a/ })).toBeVisible()

  // Prominenter, sichtbarer Live-Link zur amtlichen Fassung (§7c) mit der DAM-PDF-URL.
  const link = page.getByRole('link', { name: /Amtliche Fassung ↗/ })
  await expect(link).toBeVisible()
  const href = await link.getAttribute('href')
  expect(href).toContain('seco.admin.ch/dam/')
  expect(href).toContain('ArG-Artikel-03a')

  // Die URL steht zusätzlich als sichtbarer Text (Transparenz §7c/§8).
  await expect(page.getByText(/seco\.admin\.ch\/dam\/.*ArG-Artikel-03a/)).toBeVisible()

  expect(fehler, `Konsolen-/Seitenfehler:\n${fehler.join('\n')}`).toEqual([])
})

test('Materialien-Übersicht listet die neuen SECO-Einträge, 390px ohne Overflow (§15)', async ({ page }) => {
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/materialien')

  // register.json wird async gefetcht → auf einen neuen SECO-Wegleitungs-Titel warten.
  await expect(page.getByText('ArGV 1 Artikel 32a', { exact: false }).first()).toBeVisible({ timeout: 15000 })

  // Kein horizontaler Overflow trotz der zusätzlichen ~150 Karten (Lesbarkeit/§15).
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, `horizontaler Overflow ${overflow}px bei 390px`).toBeLessThanOrEqual(1)

  expect(fehler, `Konsolen-/Seitenfehler:\n${fehler.join('\n')}`).toEqual([])
})
