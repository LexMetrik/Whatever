// @shard-gruppe: 6
// Browser-Beweis des Fremdgesetz-Verweis-Bugs (Live-Report David 4.7.2026):
// AIG Art. 5 Abs. 1 lit. d — «… nach Artikel 66a oder 66abis des Strafgesetzbuchs
// (StGB) oder Artikel 49a oder 49abis des Militärstrafgesetzes vom 13. Juni 1927
// (MStG) …». Vor dem Fix: «Artikel 49a» self-verlinkte AIG art_49_a (falsch),
// «Artikel 66a» link-los, «66abis»/«49abis» nie verlinkt. Nach dem Fix: alle vier
// Nummern zeigen auf StGB bzw. MStG. Läuft gegen `vite preview` (dist).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

// ELI-Diskriminatoren (aus src/lib/fedlex.ts FEDLEX):
const STGB = '54/757_781_799' // SR 311.0
const MSTG = '43/359_375_369' // SR 321.0
const AIG = '2007/758'        // SR 142.20 (eigener Erlass — darf NIE Ziel sein)

test.describe('Fremdgesetz-Verweis-Routing — AIG Art. 5 Abs. 1 lit. d', () => {
  test('alle 4 Nummern → StGB/MStG, kein AIG-Self-Link', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze/bund/AIG#art-5')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('AIG')
    const art5 = page.locator('#art-5')
    await expect(art5).toBeAttached()
    // Die Inline-Verweise rendern nach dem clientseitigen Snapshot-Render.
    const stgb66a = art5.locator(`a[href*="${STGB}"][href*="#art_66_a"]:not([href*="66_a_bis"])`)
    await expect(stgb66a.first()).toBeVisible({ timeout: 10_000 })

    // 66a → StGB art_66_a, Anzeige «Artikel 66a».
    await expect(stgb66a.first()).toHaveText(/Artikel\s*66a/)
    // 66abis → StGB art_66_a_bis, Anzeige «66abis».
    const stgb66abis = art5.locator(`a[href*="${STGB}"][href*="#art_66_a_bis"]`)
    await expect(stgb66abis.first()).toHaveCount(1)
    await expect(stgb66abis.first()).toHaveText(/^66abis$/)
    // 49a → MStG art_49_a, Anzeige «Artikel 49a».
    const mstg49a = art5.locator(`a[href*="${MSTG}"][href*="#art_49_a"]:not([href*="49_a_bis"])`)
    await expect(mstg49a.first()).toHaveCount(1)
    await expect(mstg49a.first()).toHaveText(/Artikel\s*49a/)
    // 49abis → MStG art_49_a_bis, Anzeige «49abis».
    const mstg49abis = art5.locator(`a[href*="${MSTG}"][href*="#art_49_a_bis"]`)
    await expect(mstg49abis.first()).toHaveCount(1)
    await expect(mstg49abis.first()).toHaveText(/^49abis$/)

    // KERN des Bugs: NIE ein interner AIG-Self-Sprung auf art-49_a und kein
    // Fedlex-Deep-Link auf den eigenen Erlass (AIG-ELI) für art_49.
    await expect(art5.locator('a[href*="#art-49_a"]')).toHaveCount(0)
    await expect(art5.locator(`a[href*="${AIG}"][href*="#art_49"]`)).toHaveCount(0)
    await expect(art5.locator(`a[href*="${AIG}"][href*="#art_66"]`)).toHaveCount(0)

    await page.screenshot({ path: 'e2e-shots/fremdgesetz-verweis-aig.png', fullPage: false })
    expect(fehler).toEqual([])
  })
})
