// @shard-gruppe: 3
// Browser-Beweis der «Verweis-Präzision» am Referenzfall BGE 151 III 377:
//  · Teil 1: i.V.m.-Ketten-Glied «Art. 679» ist verlinkt (nicht nur «Art. 684 ZGB»).
//  · Teil 2a: Deep-Link #e-2-4 scrollt nach on-demand-Laden zur Erwägung.
//  · Teil 2b: «Art. 679 ZGB»-Chip springt zur Immissions-Passage E. 2.3.1.
// Läuft gegen `vite preview` (dist).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const FALL = '/rechtsprechung/bge_151_III_377'

test.describe('Verweis-Präzision — BGE 151 III 377', () => {
  test('Teil 1: i.V.m.-Ketten-Glied «Art. 679» ist verlinkt (Bug behoben)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto(FALL)
    await expect(page.getByRole('heading', { level: 1, name: /151 III 377/ })).toBeVisible()
    // E. 2.4 nennt «Art. 679 i.V.m. Art. 684 ZGB» — beide Glieder müssen als Link
    // auf ihren Artikel-Anker aufgelöst sein (679 war vor dem Fix unverlinkt).
    const erw = page.locator('#e-2-4')
    await expect(erw).toBeAttached()
    await expect(erw.locator('a[href*="#art_679"]').first()).toHaveCount(1)
    await expect(erw.locator('a[href*="#art_684"]').first()).toHaveCount(1)
    // Die Anzeige des Glieds bleibt zeichenidentisch «Art. 679» (kein «ZGB» drangehängt).
    await expect(erw.locator('a[href*="#art_679"]').first()).toHaveText(/^Art\.\s*679$/)
    expect(fehler).toEqual([])
  })

  test('Teil 2a: Deep-Link #e-2-4 scrollt nach on-demand-Laden zur Erwägung', async ({ page }) => {
    await page.goto(`${FALL}#e-2-4`)
    await expect(page.getByRole('heading', { level: 1, name: /151 III 377/ })).toBeVisible()
    await expect(page.locator('#e-2-4')).toBeInViewport({ timeout: 10_000 })
  })

  test('Teil 2b: «Art. 679 ZGB»-Chip springt zur Immissions-Passage E. 2.3.1', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto(FALL)
    // V1.3 (W2·7-VZUI §2.2, deklarierte Änderung): die «Zitierte Normen»-Gruppe
    // lebt jetzt am Dokumentfuss im Kontext-Panel (§0-1d — Regeste bleibt oben);
    // der Fundstellen-Sprung selbst ist unverändert.
    const kontext = page.locator('section[aria-labelledby="kontext-titel"]')
    const chip = kontext.getByRole('button', { name: /^Art\.\s*679 ZGB$/ })
    await chip.scrollIntoViewIfNeeded()
    await expect(chip).toBeVisible()
    await chip.click()
    // E. 2.3.1 (erste Nennung von Art. 679, via «Art. 684 i.V.m. Art. 679 ZGB»)
    // muss nach dem Sprung im Viewport sein.
    await expect(page.locator('#e-2-3-1')).toBeInViewport({ timeout: 10_000 })
    await page.screenshot({ path: 'e2e-shots/verweis-praezision-fundstelle.png', fullPage: false })
    expect(fehler).toEqual([])
  })
})
