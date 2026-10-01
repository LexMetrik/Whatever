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

// ─── Nachzug (W2·19, 1.10.2026): die drei Stellen, die #1210 offenliess ──────
// Gemessen 1.10.2026 gegen den Stand von #1210:
//   · AG-Gründung, Klick auf einen Blocker im Dokumente-Schritt → BODY
//     (die Seite ruft ihr eigenes `setSchritt`, der Knopf verschwindet im Remount);
//   · Zuständigkeitsrechner «← Zurück» in den ersten Schritt und das letzte
//     «Weiter →» → BODY (Knopf ausgegraut bzw. entfernt);
//   · Stepper-Reiter: Fokus blieb auf dem Reiter (kein BODY) — er geht jetzt wie
//     bei Weiter/Zurück auf den Schritttitel, der Klick auf den AKTIVEN Reiter
//     stiehlt nichts.
test.describe('Wizard-Fokus — Stepper, AG-Blocker, Zuständigkeit', () => {
  test('Stepper-Reiter @1280: Fokus auf den Titel des Ziel-Schritts, aktiver Reiter stiehlt nichts', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/vorlagen/mahnung')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    const titel = page.locator('[data-formular-karte] h2').first()
    const weiter = weiterKnopf(page)
    await weiter.click() // → Parteien
    for (const [label, wert] of PARTEIEN) await page.getByLabel(label, { exact: true }).fill(wert)
    await weiter.click() // → Forderung & Frist
    await expect(titel).toHaveText(/Forderung/)

    const reiter = page.locator('nav[aria-label="Schritte"] button')
    await reiter.nth(0).click() // zurück zu Schritt 1
    await expect(titel).toHaveText(/Was mahnen Sie an/)
    await expect(titel).toBeFocused()
    // Klick auf den aktiven Reiter: bleibt auf dem Reiter, kein Remount, keine liegende Marke.
    await reiter.nth(0).click()
    await expect(reiter.nth(0)).toBeFocused()
    await expect(titel).not.toBeFocused()
  })

  // W2·19 Wurzel-Nachzug P18 (1.10.2026): künftige Reiter (`aria-disabled`, Klick tut
  // nichts) waren Tab-Stationen — Tab ab dem letzten erreichbaren Reiter landete auf
  // toten Zielen. Sie stehen weiter im DOM (Schrittliste lesbar), nur ausserhalb der
  // Tab-Reihenfolge; besuchte und aktiver Reiter bleiben erreichbar.
  test('Stepper-Reiter @1280: künftige Reiter liegen nicht in der Tab-Reihenfolge', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/vorlagen/mahnung')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    const reiter = page.locator('nav[aria-label="Schritte"] button')
    await expect(reiter).toHaveCount(4)
    await weiterKnopf(page).click() // → Parteien (Schritt 2 aktiv)
    await expect(page.locator('[data-formular-karte] h2').first()).toHaveText(/Parteien/i)

    // Reiter 1 (besucht) und 2 (aktiv) erreichbar, 3 und 4 (künftig) nicht — aber im DOM.
    await expect(reiter.nth(0)).not.toHaveAttribute('tabindex', '-1')
    await expect(reiter.nth(1)).not.toHaveAttribute('tabindex', '-1')
    await expect(reiter.nth(2)).toHaveAttribute('tabindex', '-1')
    await expect(reiter.nth(3)).toHaveAttribute('tabindex', '-1')
    await expect(reiter.nth(2)).toHaveAttribute('aria-disabled', 'true')

    // Verhalten: ab dem aktiven Reiter springt Tab NICHT auf einen künftigen.
    await reiter.nth(1).focus()
    await page.keyboard.press('Tab')
    const aufKuenftigem = await page.evaluate(() =>
      !!document.activeElement?.closest('nav[aria-label="Schritte"] button[aria-disabled="true"]'))
    expect(aufKuenftigem, 'Tab vom aktiven Reiter landete auf einem künftigen Reiter').toBe(false)
    // Umgekehrt: Shift+Tab vom Folgeelement führt zurück auf den aktiven Reiter.
    await page.keyboard.press('Shift+Tab')
    await expect(reiter.nth(1)).toBeFocused()
  })

  for (const breite of [375, 1280]) {
    test(`AG-Gründung @${breite}: Sprung über einen Blocker landet auf dem Schritttitel`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: breite === 375 ? 812 : 800 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/vorlagen/ag-gruendung')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      const titel = page.locator('[data-formular-karte] h2').first()
      await expect(titel).toBeVisible()
      await expect(titel).not.toBeFocused() // kein Fokus-Klau beim Laden
      for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Weiter →' }).click()
      const blocker = page.locator('div[role="alert"] button').first()
      const ziel = (await blocker.locator('span[aria-hidden]').textContent())!.replace(/^\s*→\s*/, '').trim()
      await blocker.click()
      await expect(titel).toHaveText(ziel)
      await expect(titel).toBeFocused()
    })

    test(`Zuständigkeit @${breite}: Fokus → Überschrift nur an den Rändern, im mittleren Schritt bleibt er auf «Weiter»`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: breite === 375 ? 812 : 800 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/rechner/zustaendigkeit')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      const titel = page.locator('h2[tabindex="-1"]')
      await expect(page.locator('h1').first()).toBeVisible()
      await expect(titel).not.toBeFocused() // kein Fokus-Klau beim Laden

      const weiter = page.getByRole('button', { name: 'Weiter →' })
      const zurueck = page.getByRole('button', { name: '← Zurück' })
      // MITTLERER Schritt (Nachzug Prüfer-Auflage P16b): Der Knopf bleibt sichtbar
      // und aktiv — der Fokus bleibt auf ihm, nicht auf der sr-only-Überschrift
      // (1×1, clip): sehende Tastaturnutzer behalten ihre Fokusanzeige.
      await weiter.click() // Rechtsweg → Streitsache
      await expect(weiter).toBeFocused()
      await expect(titel).not.toBeFocused()
      await zurueck.click() // → erster Schritt, «Zurück» danach ausgegraut
      await expect(zurueck).toBeDisabled()
      await expect(titel).toBeFocused()

      // Bis zum letzten Schritt: dort verschwindet «Weiter →».
      await weiter.click()
      await weiter.click()
      await expect(weiter).toBeFocused()
      await page.getByLabel('Postleitzahl', { exact: true }).fill('4001')
      await expect(weiter).toBeEnabled()
      await weiter.click() // → Streitwert: «Weiter» dort gesperrt (leerer Streitwert)
      await expect(weiter).toBeDisabled()
      await expect(titel).toBeFocused() // ausgegrauter Knopf kann den Fokus nicht halten
      await page.getByLabel('Streitwert in Franken', { exact: true }).fill('20000')
      await expect(weiter).toBeEnabled()
      await weiter.click() // → weitere Schritte bis zum Fahrplan (letzter Schritt)
      for (let i = 0; i < 4 && (await weiter.count()) > 0; i++) await weiter.click()
      await expect(weiter).toHaveCount(0)
      await expect(titel).toBeFocused()
    })
  }
})
