// @shard-gruppe: 4
// ─── §7b-Deckungslücke geschlossen (21.8.2026, Kontaktbogen H4 §7b Pos. 4) ───
//
// Deckt `verzahnung.e2e.ts` «Fundstelle A (Gesetz-Chip)» — REINE Deckungs-
// lücke, kein Funktionsfehler: `PanelEntscheide.tsx`s `Fundstelle`-Komponente
// baute den Link `.../rechtsprechung/<key>?norm=<Norm>` bereits seit H3
// unverändert (§5, dieselbe Konstruktion wie am alten Standort) — nur stand
// dafür keine `leser-v3-*`-Spec. Die Landung selbst (`ersteFundstelle`/
// `EntscheidLeser.tsx`) ist hüllenneutral und lief bereits vorher grün gegen
// Projekt `leser-v1`. Diese Spec macht die Zusage für V3 erstmals SICHTBAR
// und wächterhaft, sie repariert nichts.
import { test, expect } from '@playwright/test'
import { panelAufziehen } from './helpers/panelOeffnen'

test('V3-Panel: ZGB Art. 684 → BGE 151 III 377 landet auf der Erwägung', async ({ page }) => {
  await page.goto('/gesetze/bund/ZGB#art-684')
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await panelAufziehen(page)
  const panel = page.locator('[data-v3-panel]')
  const chip = panel.locator('a[href*="bge_151_III_377"]').first()
  await expect(chip).toBeVisible({ timeout: 20_000 })
  await expect(chip).toHaveAttribute('href', /norm=Art\.(%20|\+| )684(%20|\+| )ZGB/)
  await chip.click()
  // Referenzfall (David, 3.7.2026): die massgebliche Erwägung E. 2.3.1
  // («Art. 684 i.V.m. Art. 679 ZGB») steht nach dem on-demand-Laden im
  // Viewport — dieselbe Zusage wie am alten Standort.
  await expect(page.locator('#e-2-3-1')).toBeInViewport({ timeout: 15_000 })
})
