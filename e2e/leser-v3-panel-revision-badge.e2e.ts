// @shard-gruppe: 4
// ─── §7b-Deckungslücke geschlossen (21.8.2026, Kontaktbogen H4 §7b Pos. 3) ───
//
// Deckt `normrevision-badge.e2e.ts` (a)/(b) — der ↻-Marker («Norm seit dem
// Entscheid revidiert») kam bis hierhin nur am Ist-KontextPanel vor. Er trägt
// jetzt den V3-Panel-Chip: Klassifikation via `lib/verzahnung/
// artikel-revisionen.ts` (unverändert, §5), Shard-Ladung via die neue
// `useArtikelRevisionShard` (`panelKontextLaden.ts`, gleicher Rhythmus wie
// `useRevisionen`). ROT GESEHEN (§6.7) VOR der `PanelEntscheide.tsx`-Änderung:
// `[role=img][aria-label]` blieb an Art. 5 AIG leer — kein ↻ trotz einer
// Norm, die nach dem Entscheid revidiert wurde.
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { panelAufziehen } from './helpers/panelOeffnen'

test.describe('V3-Panel · Normrevisions-Badge am Entscheid-Chip (AIG)', () => {
  test('(a) Entscheid VOR der Revision → ↻-Badge mit Revisionsdatum + AS-Fundstelle', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze/bund/AIG#art-5')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await panelAufziehen(page)
    const panel = page.locator('[data-v3-panel]')
    // Derselbe Leitfall wie am alten Standort: BGE 151 I 248 (Urteil
    // 30.10.2024) hängt an Art. 5 AIG, seither revidiert (kons 20260612, AS
    // 2026 231, Eurodac/Schengen — Herleitung in `normrevision-badge.e2e.ts`).
    await expect(panel.getByRole('link', { name: /BGE 151 I 248/ })).toBeVisible({ timeout: 20_000 })
    const badge = panel.locator('[data-v3-panel-entscheid]', { has: page.getByText('BGE 151 I 248') })
      .getByRole('img', { name: /Norm seit dem Entscheid revidiert/ })
    await expect(badge).toBeVisible()
    await expect(badge).toHaveAttribute('aria-label', /in Kraft seit 12\.06\.2026/)
    await expect(badge).toHaveAttribute('aria-label', /AS 2026 231/)
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('(b) Entscheid NACH der Revision → kein Badge (gleich, UI-still)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze/bund/AIG#art-34')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await panelAufziehen(page)
    const panel = page.locator('[data-v3-panel]')

    // Wie am alten Standort (§6.3-Deklaration dort, 28.7.2026): der Anker
    // 2C_1060/2020 liegt hinter der Facette «übrige BGer» (kein amtlich
    // publizierter BGE) — im Panel steht der Schalter IM Filter, nicht im
    // Kopf-Dropdown (Kap. 4d, `leser-v3-panel-facetten` (a)).
    const filter = panel.locator('[data-v3-panel-filter]')
    await filter.locator('[data-v3-panel-klappe]').first().click()
    await filter.locator('[data-bezug-klasse="bger"]').click()
    await filter.locator('[data-v3-panel-klappe]').first().click()

    await expect(panel.getByRole('link', { name: /2C_1060\/2020/ })).toBeVisible({ timeout: 20_000 })
    await expect(
      panel.locator('[data-v3-panel-entscheid]', { has: page.getByText('2C_1060/2020') })
        .getByRole('img', { name: /Norm seit dem Entscheid revidiert/ }),
    ).toHaveCount(0)
    expect(fehler, fehler.join('\n')).toEqual([])
  })
})
