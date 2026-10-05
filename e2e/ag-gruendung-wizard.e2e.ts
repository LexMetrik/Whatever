// @shard-gruppe: 2
// §6-Refactor-Sicherheitsnetz (19.6.2026): klickt den AG-Gründungs-Wizard durch
// ALLE Schritte und prüft, dass jeder Schritt ohne Render-/Console-Fehler rendert.
// So fängt eine spätere verhaltensneutrale Datei-Schlankheit (JSX-Extraktion in
// Geschwister-Komponenten) eine kaputte Extraktion in einem der Schritte.
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

test.describe('AG-Gründung Wizard', () => {
  test('rendert jeden Schritt bis «Checkliste & Dokumente» ohne Fehler', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/vorlagen/ag-gruendung')
    await expect(page.locator('h1').first()).toBeVisible()

    // 6 Schritte: Konstellation → Gesellschaft → Kapital → Personen → Domizil → Dokumente.
    // Über «Weiter →» vorwärts (der Stepper springt nur rückwärts).
    for (let i = 0; i < 5; i++) {
      const weiter = page.getByRole('button', { name: 'Weiter →' })
      await expect(weiter, `Weiter im Schritt ${i + 1}`).toBeEnabled()
      await weiter.click()
    }

    // Letzter Schritt rendert die HRegV-Checkliste.
    await expect(page.getByText(/HRegV/).first()).toBeVisible()
    expect(fehler, `Render-/Console-Fehler:\n${fehler.join('\n')}`).toEqual([])
  })
})
