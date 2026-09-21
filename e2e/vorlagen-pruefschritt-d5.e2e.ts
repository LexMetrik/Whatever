// @shard-gruppe: 1
// ─── D5 (W2·24) · «Prüfen & Download» prüft — an einer echten Vorlage ────────
//
// Der SSR-Wächter `src/tests/wizard-pruefschritt-d5.test.tsx` hält den Rahmen
// fest; hier läuft die Strecke, die ein Mensch geht: Mahnung ausfüllen, Ort
// weglassen, Prüfen-Schritt erreichen. Geprüft wird genau das, was der Befund
// D5 vermisst hat — dass der Schritt SAGT, was fehlt, dass man von dort
// zurückspringen kann, und dass der Export nicht sperrt, sondern EINMAL
// nachfragt (§8 · Daueranweisung David 12.6.2026: jede Vorlage bleibt
// jederzeit herunterladbar).
import { test, expect } from '@playwright/test'

const PARTEIEN: [string, string][] = [
  ['Ihr Name', 'A. Muster'],
  ['Ihre Adresse', 'Weg 1, 4000 Basel'],
  ['Schuldnerin / Schuldner', 'B. Beispiel'],
  ['Adresse der Schuldnerseite', 'Gasse 2, 3000 Bern'],
]

test.describe('D5 — Prüfen-Schritt der Vorlagen', () => {
  test('meldet offene Pflichtangaben, springt zurück und fragt vor dem Export einmal nach', async ({ page }) => {
    await page.goto('/vorlagen/mahnung')
    // Die Mahnung sichert ihren Stand in localStorage — ein Rest aus einem
    // früheren Lauf würde den Ausgangszustand verfälschen.
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    const weiter = page.getByRole('button', { name: /^Weiter/ })
    await weiter.click() // Schritt 1 «Was mahnen Sie an?» → Parteien
    for (const [label, wert] of PARTEIEN) await page.getByLabel(label, { exact: true }).fill(wert)
    await weiter.click() // → Forderung & Frist
    await page.getByLabel('Forderungsbetrag (CHF)', { exact: true }).fill('1200')
    await page.getByLabel('Rechtsgrund / Rechnung', { exact: true }).fill('Rechnung 4711')
    await weiter.click() // → Prüfen & Unterzeichnen

    // ── Der Schritt prüft: Ort ist offen und wird benannt ───────────────────
    const befund = page.locator('[data-pruefbefund="offen"]')
    await expect(befund).toBeVisible()
    await expect(befund).toHaveAttribute('role', 'alert')
    await expect(befund).toContainText('Ort angeben.')
    await expect(befund).toContainText('Datum der Erklärung angeben.')
    await expect(befund).toContainText('Es fehlen')
    // Das Feld selbst sagt es auch — vor D5 trug im Wizard NIE ein Feld
    // `aria-invalid` (gemessen 7.9.2026).
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(1)

    // ── Sprungliste führt in den Schritt mit der Lücke ──────────────────────
    // Hier ist die Lücke im Prüfen-Schritt selbst (Ort/Datum); der Sprung
    // landet also auf demselben Schritt — geprüft wird, dass der Knopf da ist
    // und die Beschriftung des Ziel-Schritts trägt.
    await expect(befund.getByRole('button', { name: /Prüfen & Unterzeichnen/ })).toBeVisible()

    // ── Export sperrt nicht, sondern fragt einmal ───────────────────────────
    const karte = page.locator('[data-formular-karte]')
    await karte.getByRole('checkbox').first().check()
    // Bewusst die ExportLeiste IM Schritt, nicht der Direkt-Export unter der
    // Vorschau: der bleibt unbefragt (Daueranweisung David 12.6.2026).
    const pdf = karte.getByRole('button', { name: 'Mahnung als PDF' })
    await expect(pdf).toBeEnabled()
    await pdf.click()
    const rueckfrage = page.locator('[data-export-rueckfrage]')
    await expect(rueckfrage).toBeVisible()
    await expect(rueckfrage).toContainText('trotzdem exportieren')
    await rueckfrage.getByRole('button', { name: 'Abbrechen' }).click()
    await expect(rueckfrage).toHaveCount(0)

    // ── Lücke geschlossen ⇒ Quittung statt Alarm ────────────────────────────
    // Der Ort steht mit dem Datum in EINEM `Field` (zweispaltiges Raster) —
    // dieses Feld trägt darum keinen eigenen Label-Bezug; angesprochen wird es
    // über seinen Platzhalter. (Der fehlende Zugangsname dieses Paares ist ein
    // eigener, in D5-VORLAGEN.md vermerkter Befund, kein Teil dieses Baus.)
    await page.getByPlaceholder('z. B. Basel').fill('Basel')
    await page.getByPlaceholder('TT.MM.JJJJ').fill('01.06.2026')
    await expect(page.locator('[data-pruefbefund="vollstaendig"]')).toBeVisible()
    await expect(page.locator('[data-pruefbefund="offen"]')).toHaveCount(0)
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0)
  })
})
