// @shard-gruppe: 2
// Browser-Smoke der Normrevisions-Ehrlichkeit (FAHRPLAN-VERZAHNUNG-UI §V1c).
// Läuft gegen `vite preview` (dist).
//
// GELÖSCHT 21.8.2026 (H5): (a) «Entscheid VOR der Revision → ↻-Badge» und
// (b) «Entscheid NACH der Revision → kein Badge» prüften den Leitfall-Link an
// der Ist-Hüllen-Zeile unter dem Artikel. V3-Deckung:
// e2e/leser-v3-panel-revision-badge.e2e.ts (a)/(b) (21.8.2026, §7b Pos. 3);
// die Temporal-Regel selbst deckt `src/tests` DOM-frei. Verbleibt: (c),
// hüllenneutral.
import { test, expect } from '@playwright/test'

test.describe('Normrevisions-Badge im ArtikelLeser (AIG)', () => {
  test('(c) vollständiger Normtext bleibt im DOM (Ctrl+F / §15.1)', async ({ page }) => {
    await page.goto('/gesetze/bund/AIG')
    await expect(page.locator('#art-1')).toBeVisible()
    const artikelZahl = await page.locator('article[id^="art-"]').count()
    expect(artikelZahl).toBeGreaterThan(100)
  })
})
