// @shard-gruppe: 1
// ─── W2·19 · Fokus beim Schrittwechsel des Vorlagen-Wizards ─────────────────
//
// Gemessen 30.9.2026 auf /vorlagen/mahnung: nach «Weiter →»/«← Zurück» lag
// `document.activeElement` auf BODY (der Knopf verschwindet bzw. wird
// ausgegraut, die Schrittinhalte werden neu eingehängt) — nur der Sprung aus
// dem Prüf-Befund setzte den Fokus auf den Schritttitel. Jetzt landet er bei
// JEDEM Schrittwechsel per Knopf auf dem Titel des neuen Schritts, beim
// ersten Rendern dagegen nicht (kein Fokus-Klau beim Laden).
import { test, expect } from '@playwright/test'
import { weiterKnopf } from './helpers/weiterKnopf'

const PARTEIEN: [string, string][] = [
  ['Ihr Name', 'A. Muster'],
  ['Ihre Adresse', 'Weg 1, 4000 Basel'],
  ['Schuldnerin / Schuldner', 'B. Beispiel'],
  ['Adresse der Schuldnerseite', 'Gasse 2, 3000 Bern'],
]

for (const breite of [375, 1280]) {
  test.describe(`Wizard-Fokus @${breite}`, () => {
    test.use({ viewport: { width: breite, height: breite === 375 ? 812 : 800 } })

    test('«Weiter» und «Zurück» setzen den Fokus auf den Schritttitel, das Laden nicht', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/vorlagen/mahnung')
      await page.evaluate(() => localStorage.clear())
      await page.reload()

      const titel = page.locator('[data-formular-karte] h2').first()
      await expect(titel).toBeVisible()
      // Erstes Rendern: kein Fokus-Klau.
      await expect(titel).not.toBeFocused()

      // Fokussieren scrollt den Titel ins Bild — aber nicht unter die klebende
      // Krone (64 px) + Arbeitsleiste (34 px): `lc-sprungziel` am Titel.
      const nichtVerdeckt = async () => {
        const oben = await titel.evaluate((e) => e.getBoundingClientRect().top)
        expect(oben, 'Titel-Oberkante unter Krone + Arbeitsleiste').toBeGreaterThanOrEqual(98)
      }
      const weiter = weiterKnopf(page)
      await weiter.click() // → Parteien
      await expect(titel).toHaveText(/Parteien/i)
      await expect(titel).toBeFocused()
      await nichtVerdeckt()
      // Der Titel ist Fokus-Ziel, keine Tab-Station.
      await expect(titel).toHaveAttribute('tabindex', '-1')

      for (const [label, wert] of PARTEIEN) await page.getByLabel(label, { exact: true }).fill(wert)
      await weiter.click() // → Forderung & Frist
      await expect(titel).toBeFocused()
      await page.getByLabel('Forderungsbetrag (CHF)', { exact: true }).fill('1200')
      await page.getByLabel('Rechtsgrund / Rechnung', { exact: true }).fill('Rechnung 4711')
      await weiter.click() // → Prüfen & Unterzeichnen (letzter Schritt, kein «Weiter» mehr)
      await expect(titel).toHaveText(/Prüfen/)
      await expect(titel).toBeFocused()
      await nichtVerdeckt()

      // Zurück bis zum ersten Schritt — auch dort, wo der Knopf danach ausgegraut ist.
      const zurueck = page.getByRole('button', { name: '← Zurück' })
      await zurueck.click()
      await expect(titel).toHaveText(/Forderung/)
      await expect(titel).toBeFocused()
      await nichtVerdeckt()
      await zurueck.click()
      await expect(titel).toBeFocused()
      await zurueck.click()
      await expect(zurueck).toBeDisabled()
      await expect(titel).toBeFocused()
      await nichtVerdeckt()
    })
  })
}
