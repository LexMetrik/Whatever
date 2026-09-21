// @shard-gruppe: 5
// E6a M1 · Content-Release-DoD (§7c Playwright-Beweis): eine ESTV-MWST-DB-Material-Karte rendert
// den SICHTBAREN amtlichen Live-Link (stabile Kurz-URL des MWST-Portals); die Materialien-Übersicht
// listet die neuen MWST-Infos/Branchen-Infos und bleibt bei 390 px ohne horizontalen Overflow (§15).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

test('MaterialLeser einer neuen ESTV-MWST-DB-Karte zeigt den sichtbaren amtlichen Live-Link (§7c)', async ({ page }) => {
  const fehler = fehlerSammeln(page)
  await page.goto('/materialien/ESTV-MWST-INFO-02')

  // Titel verbatim aus dem amtlichen ToC-Cover («MWST-Info 02 Steuerpflicht»).
  await expect(page.getByRole('heading', { name: /MWST-Info 02 Steuerpflicht/ })).toBeVisible()

  // Prominenter, sichtbarer Live-Link zur amtlichen Fassung (§7c) — stabile Portal-Kurz-URL.
  const link = page.getByRole('link', { name: /Amtliche Fassung ↗/ })
  await expect(link).toBeVisible()
  const href = await link.getAttribute('href')
  expect(href).toContain('gate.estv.admin.ch/mwst-webpublikationen/public/MI/02')

  expect(fehler, `Konsolen-/Seitenfehler:\n${fehler.join('\n')}`).toEqual([])
})

test('Materialien-Übersicht listet die neuen MWST-Publikationen, 390px ohne Overflow (§15)', async ({ page }) => {
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/materialien')

  // register.json wird async gefetcht → auf einen neuen Branchen-Info-Titel warten.
  await expect(page.getByText('MWST-Branchen-Info 18 Rechtsanwälte und Notare', { exact: false }).first()).toBeVisible({ timeout: 15000 })

  // Kein horizontaler Overflow trotz der zusätzlichen ~48 MWST-Karten (Lesbarkeit/§15).
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, `horizontaler Overflow ${overflow}px bei 390px`).toBeLessThanOrEqual(1)

  expect(fehler, `Konsolen-/Seitenfehler:\n${fehler.join('\n')}`).toEqual([])
})
