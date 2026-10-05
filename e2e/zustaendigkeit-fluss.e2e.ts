// @shard-gruppe: 2
// §6-Refactor-Sicherheitsnetz (19.6.2026): führt den Zuständigkeits-Rechner durch
// die Zivil-Schritte bis zum Ergebnis und prüft den SchKG-Pfad — so fängt eine
// spätere verhaltensneutrale Datei-Schlankheit (JSX-Extraktion) eine kaputte
// Extraktion in einem Schritt- oder Ergebnis-Render. (plz-wahl.e2e.ts deckt den
// Ort-Schritt mit PLZ-Kacheln bereits ab.)
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

test.describe('Zuständigkeit — Zivil-Fluss + SchKG', () => {
  test('Zivil (Geldforderung): durch die Schritte bis zum Behörden-Ergebnis', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/rechner/zustaendigkeit')
    await expect(page.locator('h1').first()).toBeVisible()
    // rechtsweg(=zivil default) → streitsache → ort
    await page.getByRole('button', { name: 'Weiter →' }).click()
    await page.getByRole('button', { name: 'Weiter →' }).click()
    await page.getByLabel('Postleitzahl', { exact: true }).fill('4001')
    // ggf. weiter zum Streitwert-Schritt
    const weiter = page.getByRole('button', { name: 'Weiter →' })
    if (await weiter.isEnabled().catch(() => false)) await weiter.click()
    // Das Behörden-/Ergebnis-Render erscheint (Schlichtung/Gericht/zuständig).
    await expect(page.getByText(/Schlichtung|Gericht|zuständig/i).first()).toBeVisible()
    expect(fehler, `Fehler:\n${fehler.join('\n')}`).toEqual([])
  })

  test('SchKG-Teil rendert (eigener Pfad #schkg)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/rechner/zustaendigkeit#schkg')
    await expect(page.getByLabel('Postleitzahl des Betreibungsortes')).toBeVisible()
    expect(fehler, `Fehler:\n${fehler.join('\n')}`).toEqual([])
  })
})
