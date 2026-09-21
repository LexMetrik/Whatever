// @shard-gruppe: 6
// D36 (David 7.9.2026) — «können diese felder wieder unten an die
// seitenleiste? Einstellungen · Methodik · Über LexMetrik · Kontakt ·
// Datenschutzerklärung» — präzisiert auf «also einstellungen separat» / «oder
// nur einstellungen». D26 (6.9.2026) hatte alle fünf Meta-Ziele aus der
// Seitenleiste in den Footer verlegt (`w223b-kopf-seitenleiste.e2e.ts` §6.3
// prüft dort weiterhin den Korpus-Stand-Fuss). Dieser Fall belegt die
// EINGESCHRÄNKTE Rückkehr: NUR «Einstellungen» steht wieder unten in der
// Seitenleiste (Desktop UND mobile Schublade), abgesetzt durch eine Haarlinie
// und als letzter Eintrag verankert; Methodik/Über/Kontakt/Datenschutz
// bleiben im Footer, und der Footer führt «Einstellungen» nicht mehr doppelt
// (D4: jede Angabe einmal — die Seitenleiste ist der nähere Ort).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { seitenleisteOeffnen } from './helpers/seitenleiste'

const leiste = (page: Page) => page.locator('aside[data-app-seitenleiste] nav')

test.describe('D36 · «Einstellungen» wieder unten in der Seitenleiste, abgesetzt', () => {
  // ROT ZU BEKOMMEN: den `<Blatt k={EINSTELLUNGEN} …/>`-Eintrag im Fuss von
  // `Sidebar.tsx` wieder entfernen — die Sonde scheitert dann daran, dass die
  // Leiste keinen Link «Einstellungen» mehr führt.
  test('Desktop @1440: «Einstellungen» ist der letzte Leisten-Eintrag, unterhalb aller Inhalts-Rubriken, mit Linie oben', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze')
    await seitenleisteOeffnen(page) // D25 (deklariert, §6.3): Vorbedingung — Leiste startet eingeklappt.

    const nav = leiste(page)
    const einstellungen = nav.getByRole('link', { name: 'Einstellungen', exact: true })
    await expect(einstellungen).toBeVisible({ timeout: 20_000 })

    // Letzter Link der ganzen Leiste — kein Inhalts-Eintrag steht darunter.
    const alleLinks = nav.getByRole('link')
    const anzahl = await alleLinks.count()
    await expect(alleLinks.nth(anzahl - 1)).toHaveText('Einstellungen')

    // Unterhalb ALLER Inhaltseinträge (z. B. «Alle Bundeserlasse») — Positions-Beleg
    // statt nur DOM-Reihenfolge, da CSS die Reihenfolge theoretisch drehen
    // könnte (§6.7: die Gegenprobe muss eine echte Layout-Aussage treffen).
    const inhaltsEintrag = nav.getByRole('link', { name: 'Alle Bundeserlasse', exact: true }).first()
    const [yEinstellungen, yInhalt] = await Promise.all([
      einstellungen.boundingBox().then((b) => b!.y),
      inhaltsEintrag.boundingBox().then((b) => b!.y),
    ])
    expect(yEinstellungen).toBeGreaterThan(yInhalt)

    // Haarlinie oben am umschliessenden Fuss-Block (Linien statt Flächen, F0.6)
    // — der direkte Elternknoten des Links trägt den `border-t`.
    const fussBlock = einstellungen.locator('xpath=..')
    const randbreite = await fussBlock.evaluate((el) => getComputedStyle(el).borderTopWidth)
    expect(parseFloat(randbreite)).toBeGreaterThan(0)

    // Aktiver Zustand wie jeder andere Leisten-Eintrag (aria-current).
    await einstellungen.click()
    await expect(page).toHaveURL(/\/einstellungen$/)
    await expect(nav.getByRole('link', { name: 'Einstellungen', exact: true })).toHaveAttribute('aria-current', 'page')

    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('Mobile Schublade @390: «Einstellungen» steht ebenfalls unten', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze')
    await page.getByRole('button', { name: 'Navigation öffnen' }).click()
    const schublade = page.getByRole('dialog', { name: 'Navigation' })
    await expect(schublade).toBeVisible({ timeout: 20_000 })

    const einstellungen = schublade.getByRole('link', { name: 'Einstellungen', exact: true })
    await expect(einstellungen).toBeVisible()
    const alleLinks = schublade.getByRole('link')
    const anzahl = await alleLinks.count()
    await expect(alleLinks.nth(anzahl - 1)).toHaveText('Einstellungen')
  })

  // ROT ZU BEKOMMEN: die Einstellungen-Filterung in `Footer.tsx` wieder
  // entfernen — der Footer zeigte «Einstellungen» dann ein zweites Mal.
  test('Footer führt «Einstellungen» NICHT mehr doppelt, die übrigen vier Meta-Ziele bleiben', async ({ page }) => {
    await page.goto('/')
    const footerNav = page.getByRole('navigation', { name: 'Footer-Navigation' })
    await expect(footerNav).toBeVisible()
    await expect(footerNav.getByRole('link', { name: 'Einstellungen', exact: true })).toHaveCount(0)
    await expect(footerNav.getByRole('link', { name: 'Methodik', exact: true })).toHaveCount(1)
    await expect(footerNav.getByRole('link', { name: 'Über LexMetrik', exact: true })).toHaveCount(1)
    await expect(footerNav.getByRole('link', { name: 'Kontakt', exact: true })).toHaveCount(1)
    await expect(footerNav.getByRole('link', { name: 'Datenschutzerklärung', exact: true })).toHaveCount(1)
  })
})
