// @shard-gruppe: 5
// PLZ-Mehrdeutigkeit als Auswahl (TODO 5 betreibungskreise-kantone.md,
// 10.6.2026): bei PLZ mit mehreren Gemeinden erscheinen klickbare Kacheln
// (PlzGemeindeWahl); der Klick setzt Gemeinde UND Kanton. Geprüft im
// SchKG-Teil (Feld 3b, immer sichtbar) und im Zivil-Schritt «Örtliche
// Anknüpfung» (Randgebiets-Fall 4052: Default bleibt, Umschalten möglich).
import { test, expect } from '@playwright/test'

test.describe('SchKG 3b · Betreibungsort lokalisieren', () => {
  test('PLZ 1041: vier Gemeinde-Kacheln; Klick setzt Gemeinde + Kanton', async ({ page }) => {
    await page.goto('/rechner/zustaendigkeit#schkg')
    await page.getByLabel('Postleitzahl des Betreibungsortes').fill('1041')
    for (const g of ['Bottens', 'Jorat-Menthue', 'Montilliez', 'Poliez-Pittet']) {
      await expect(page.getByRole('button', { name: new RegExp(g) })).toBeVisible()
    }
    // Echt mehrdeutig (4 × 100 %): nichts vorbefüllt, keine Kachel aktiv.
    await expect(page.getByLabel('Politische Gemeinde des Betreibungsortes')).toHaveValue('')
    await page.getByRole('button', { name: /Bottens/ }).click()
    await expect(page.getByLabel('Politische Gemeinde des Betreibungsortes')).toHaveValue('Bottens')
    await expect(page.getByLabel('Kanton', { exact: true })).toHaveValue('VD')
    await expect(page.getByRole('button', { name: /Bottens/ })).toHaveAttribute('aria-pressed', 'true')
  })

  test('PLZ 1410 (kantonsübergreifend VD/FR): die Wahl setzt auch den Kanton', async ({ page }) => {
    await page.goto('/rechner/zustaendigkeit#schkg')
    await page.getByLabel('Postleitzahl des Betreibungsortes').fill('1410')
    await page.getByRole('button', { name: /Prévondavaux/ }).click()
    await expect(page.getByLabel('Politische Gemeinde des Betreibungsortes')).toHaveValue('Prévondavaux')
    await expect(page.getByLabel('Kanton', { exact: true })).toHaveValue('FR')
  })
})

test.describe('Zivil · Schritt «Örtliche Anknüpfung»', () => {
  test('PLZ 4052: Hauptgemeinde Basel vorbefüllt (aktiv), Randgebiet Münchenstein umschaltbar', async ({ page }) => {
    await page.goto('/rechner/zustaendigkeit')
    // Defaults (Geldforderung, Einleitung) sind gültig → zweimal Weiter bis «ort».
    await page.getByRole('button', { name: 'Weiter →' }).click()
    await page.getByRole('button', { name: 'Weiter →' }).click()
    await page.getByLabel('Postleitzahl', { exact: true }).fill('4052')
    // Auto-Fill (Leer-Guard) setzt die Hauptgemeinde; ihre Kachel ist aktiv.
    await expect(page.getByPlaceholder('z. B. Basel')).toHaveValue('Basel')
    await expect(page.getByRole('button', { name: /^Basel/ })).toHaveAttribute('aria-pressed', 'true')
    // Umschalten auf das Randgebiet: explizite Wahl überschreibt beide Felder.
    await page.getByRole('button', { name: /Münchenstein/ }).click()
    await expect(page.getByPlaceholder('z. B. Basel')).toHaveValue('Münchenstein')
    await expect(page.getByLabel('Kanton (Forum)')).toHaveValue('BL')
    await expect(page.getByRole('button', { name: /Münchenstein/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
