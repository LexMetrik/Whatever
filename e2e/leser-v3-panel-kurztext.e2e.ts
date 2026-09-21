// @shard-gruppe: 4
// ─── §7b-Deckungslücke geschlossen (21.8.2026, Kontaktbogen H4 §7b Pos. 3) ───
//
// Deckt `leitfaelle-chips.e2e.ts` Fall (d) («V3: Chip zeigt den Kurztext auf
// Hover + Tastatur, Esc schliesst») — die alte Auflistung am Artikelfuss ist
// mit Pos. 12 aufgegeben, ihr Kurztext-Popover-Verhalten trägt jetzt
// `KanteMitVorschau` an der Panel-Zeile (V3-Reiter «Entscheide»). Rot gesehen
// (§6.7) VOR `PanelEntscheide.tsx`s Umbau auf `KanteMitVorschau`: der Chip war
// ein blosser `<Link>`, `[data-regeste-popover]` blieb bei jedem Schritt hier
// mit Count 0 — kein Popover, kein ⧉, keine `aria-expanded`/`aria-controls`.
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { panelAufziehen } from './helpers/panelOeffnen'

test.describe('V3-Panel · Kurztext-Popover am Entscheid-Chip', () => {
  test('Chip zeigt den Kurztext auf Hover + Tastatur, Esc schliesst', async ({ page }) => {
    test.slow() // OR-Volltext + Shard-Resolve — dasselbe Budget wie leitfaelle-chips.e2e.ts (a)/(d)
    const fehler = fehlerSammeln(page)
    // ≥ lg, damit «Daneben öffnen» überhaupt angeboten wird (Pane-Gating).
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/OR#art-41')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await panelAufziehen(page)

    const panel = page.locator('[data-v3-panel]')
    await expect(panel.locator('[data-v3-panel-entscheid]').first()).toBeVisible({ timeout: 30_000 })

    // Kein Popover, solange niemand etwas tut (§15: der Kasten ist lazy).
    await expect(page.locator('[data-regeste-popover]')).toHaveCount(0)

    const chip = panel.locator('[data-v3-panel-entscheid] a.lc-chip').first()
    await expect(chip).toBeVisible()
    await chip.hover()
    // Dieselbe bewusste Verzögerung wie an der alten Leitfall-Zeile (450 ms) —
    // ein Vorbeifahren reisst keinen Kasten auf.
    await page.waitForTimeout(800)
    const popover = page.locator('[data-regeste-popover]')
    await expect(popover).toBeVisible({ timeout: 10_000 })
    await expect(popover).toContainText('Kurztext')
    await expect(popover.getByRole('link', { name: /Öffnen/ })).toBeVisible()
    await expect(popover.getByRole('button', { name: /Daneben öffnen/ })).toBeVisible()

    // Hover-Fläche, kein modaler Dialog (dieselbe Rollen-Ehrlichkeit wie am
    // alten Standort, §9-Bug-Check B2).
    await expect(popover).toHaveAttribute('role', 'group')
    await expect(popover).not.toHaveAttribute('aria-modal', /.*/)
    await expect(chip).toHaveAttribute('aria-expanded', 'true')
    const kastenId = (await popover.getAttribute('id'))!
    expect(kastenId).toBeTruthy()
    await expect(chip).toHaveAttribute('aria-controls', kastenId)

    // Tastatur (WCAG 2.1.1).
    await page.keyboard.press('Escape')
    await expect(popover).toHaveCount(0)
    await expect(chip).toHaveAttribute('aria-expanded', 'false')
    await expect(chip).not.toHaveAttribute('aria-controls', /.*/)

    await chip.focus()
    await expect(popover).toBeVisible({ timeout: 10_000 })
    await page.keyboard.press('ArrowDown')
    await expect(popover.getByRole('link', { name: /Öffnen/ })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(popover).toHaveCount(0)
    // WCAG 2.4.3: der Fokus fällt nach dem Schliessen NICHT auf <body>.
    await expect(chip).toBeFocused()
    expect(fehler, fehler.join('\n')).toEqual([])
  })
})
