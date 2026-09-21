// @shard-gruppe: 7
// Live-Brücke des Fristenrechners (Auftrag David 1.9.2026: «der Rechenweg
// aktualisiert sich nicht automatisch»): Eingaben im einfachen Rechner OBEN
// fliessen in das Voll-Formular UNTEN — dessen Rechenweg rechnet damit
// automatisch mit den Werten mit, die die nutzende Person tatsächlich
// eingegeben hat (vorher zeigte er die eigenen Formular-Defaults, z. B.
// 15.01.2025/30 Tage im ZPO-Teil, egal was oben stand).
import { test, expect } from '@playwright/test'

test.describe('Fristenrechner: Rechenweg folgt den Eingaben oben', () => {
  test('Frist-Änderung oben erreicht Voll-Form und Rechenweg (ZPO-Standard)', async ({ page }) => {
    await page.goto('/rechner/tagerechner')
    // Oben: einfacher Rechner, Standard-Regime «Gerichtsferien (ZPO)».
    const fristOben = page.locator('input[type="number"]').first()
    await fristOben.fill('8')
    // Unten: der Verfahrens-Tab folgt dem Regime …
    await expect(page.getByRole('tab', { name: 'Zivilprozess (ZPO)' }))
      .toHaveAttribute('aria-selected', 'true')
    // … und die Voll-Form trägt dieselbe Fristlänge (nicht mehr ihren Default 30).
    await expect(page.locator('input[type="number"]').nth(1)).toHaveValue('8')
    // Der Rechenweg unten rechnet mit der oben eingegebenen Länge.
    await page.getByRole('button', { name: /Rechenweg/ }).click()
    await expect(page.getByText(/Tagesfrist von 8 Tagen/)).toBeVisible()
  })

  test('Regime-Wechsel oben schaltet den Voll-Tab («Keine Ferien» → Allgemein)', async ({ page }) => {
    await page.goto('/rechner/tagerechner#zpo')
    await page.getByRole('radio', { name: 'Keine Ferien' }).check()
    await expect(page.getByRole('tab', { name: 'Allgemein (Vertrag/OR)' }))
      .toHaveAttribute('aria-selected', 'true')
  })

  test('Hash folgt dem Regime — Reload rechnet im richtigen Regime weiter (GP-Befund B1)', async ({ page }) => {
    // Vorher schrieb der Live-URL-Sync eine ZPO-Query OHNE #zpo (bzw. unter
    // einem alten #schkg): nach Reload interpretierte das falsche Regime die
    // Werte (§1). Jetzt navigiert der Regime-Wechsel der Brücke mit.
    await page.goto('/rechner/tagerechner')
    await page.locator('input[type="number"]').first().fill('8')
    await expect(page).toHaveURL(/#zpo$/)
    // Der Live-URL-Sync der Voll-Form trägt die Länge in die Query …
    await expect(page).toHaveURL(/l=8/)
    // … und nach dem Reload steht dieselbe Rechnung im selben Regime.
    await page.reload()
    await expect(page.getByRole('tab', { name: 'Zivilprozess (ZPO)' }))
      .toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('input[type="number"]').nth(1)).toHaveValue('8')
  })

  test('Unberührtes oben stampft keine Permalink-Werte unten (GP-Befund B2)', async ({ page }) => {
    // Geteilter ZPO-Link mit 20 Tagen; oben wird NUR der Kanton gewechselt —
    // die Länge unten muss 20 bleiben (vorher fiel sie still auf den
    // 10-Tage-Default des einfachen Rechners), der Kanton zieht mit.
    await page.goto('/rechner/tagerechner?e=2025-03-03&u=tage&l=20&v=ordentlich&k=BE&n=gesetzlich#zpo')
    await expect(page.locator('input[type="number"]').nth(1)).toHaveValue('20')
    await page.getByLabel('Kanton (Feiertage)').first().selectOption('AG')
    await expect(page.locator('input[type="number"]').nth(1)).toHaveValue('20')
    // Das per Link geteilte Ereignis-Datum bleibt ebenfalls stehen.
    await expect(page.locator('input[placeholder="TT.MM.JJJJ"]').nth(1)).toHaveValue('03.03.2025')
  })

  test('Preset-Klick gewinnt gegen frühere Live-Werte (Stomp-Loch, Bug-Check 1.9.2026)', async ({ page }) => {
    await page.goto('/rechner/tagerechner')
    // Oben ändern → Live-Brücke aktiv (Voll-Form trägt 8).
    await page.locator('input[type="number"]').first().fill('8')
    await expect(page.locator('input[type="number"]').nth(1)).toHaveValue('8')
    // Danach ein Preset wählen: dessen Werte müssen stehen bleiben —
    // der Render-Sync darf die frisch hydratisierte Form nicht mit den
    // alten Live-Werten überschreiben.
    await page.locator('#preset-suche').fill('Berufung')
    await page.getByRole('button', { name: /Berufung \(ordentlich\)/ }).click()
    await expect(page.locator('input[type="number"]').nth(1)).toHaveValue('30')
  })

  test('Preset-Link bleibt unangetastet, solange oben nichts geändert wird', async ({ page }) => {
    // Hydrations-Schutz: die Brücke meldet erst ab der ersten NUTZER-Änderung —
    // ein geteilter ZPO-Link (eigene Werte in der Query) darf beim Laden nicht
    // von den Defaults des einfachen Rechners überschrieben werden.
    await page.goto('/rechner/tagerechner?e=2025-03-03&u=tage&l=20&v=ordentlich&k=BE&n=gesetzlich#zpo')
    await expect(page.getByRole('tab', { name: 'Zivilprozess (ZPO)' }))
      .toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('input[type="number"]').nth(1)).toHaveValue('20')
  })
})
