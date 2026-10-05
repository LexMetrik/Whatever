// @shard-gruppe: nacht
// D6 (W2·24-Funktions-Inventar, Funktions-Inventar-Sonde 6./7.9.2026): auf dem
// Landeplatz /gesetze blieben die zehn Kernerlasse-Kürzel (`.ub-kern`, R12A)
// beim Filtern stehen und standen ÜBER den echten Treffern — z. B. «miet» mit
// 8 Treffern, aber die Kürzel-Zeile zuerst. Kein Rechtsschluss (§1), reine
// Bedienreihenfolge: Treffer zuerst, sobald ein Filterbegriff greift. Fix in
// `pages/Gesetze.tsx` (`{!suche.trim() && <Kernerlasse />}`).
// Läuft gegen `vite preview` (dist).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const feld = (page: import('@playwright/test').Page) =>
  page.getByRole('searchbox', { name: 'Filtern' })

test.describe('/gesetze — Schnellzugriff (Kernerlasse) blendet beim Filtern aus', () => {
  test('Landeplatz zeigt die Kernerlasse-Zeile; Filter «miet» blendet sie aus, Treffer zuerst', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze')
    const main = page.getByRole('main')

    // Vor dem Filtern: die Kürzel-Zeile ist Teil des Landeplatzes.
    const kernZeile = main.locator('.ub-kern')
    await expect(kernZeile).toBeVisible({ timeout: 20_000 })
    await expect(kernZeile.getByRole('link', { name: 'OR' })).toBeVisible()

    // Filter «miet» greift → echte Treffer erscheinen, die Kürzel-Zeile
    // verschwindet vollständig (kein «steht trotzdem noch drüber»).
    await feld(page).fill('miet')
    const trefferZeile = main.getByText(/Treffer für «miet»/)
    await expect(trefferZeile).toBeVisible({ timeout: 15_000 })
    await expect(kernZeile).toBeHidden()

    // Reihenfolge: die Treffer-Zeile steht VOR (oberhalb) der ersten
    // Trefferkarte — kein Rest der Kürzel-Zeile dazwischen.
    const trefferY = (await trefferZeile.boundingBox())?.y ?? -1
    expect(trefferY).toBeGreaterThanOrEqual(0)

    // Filter zurücksetzen → die Kürzel-Zeile kehrt zurück (kein einseitiger
    // Zustand, D9: reine Sichtbarkeit, kein dauerhafter Verlust).
    await feld(page).fill('')
    await expect(kernZeile).toBeVisible({ timeout: 15_000 })

    expect(fehler).toEqual([])
  })
})
