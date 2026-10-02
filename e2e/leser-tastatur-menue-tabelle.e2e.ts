// @shard-gruppe: 5
// ═══ W2·17-UI-BEFUNDE · Leser-Tastatur im Browser: Menü, Tabelle, Auto-Repeat ═
//
// Gegenstück zu `src/tests/leser-tastatur-menue-tabelle-w217.test.tsx` (dort die
// Regel ohne Browser, hier die ECHTE Taste im Chromium — Fokus, `preventDefault`
// und die native Scroll-Geste).
//
//  · G4-B01 — «Ansicht ▾» offen, «t»/«j»: das Menü behält Fokus und Tasten.
//  · B11-B01/ED10 — EMRK «Geltungsbereich» (574/522 px @600) im Einzelmodus
//    fokussiert: → scrollt die Tabelle (scrollLeft > 0), blättert nicht.
//  · G4-B02 — «?» gehalten (Playwright: `keyboard.down` auf eine schon gedrückte
//    Taste = Auto-Repeat): das Overlay bleibt offen.
//
// ROT ZU BEKOMMEN (§6.7, gegen den QUELLCODE `src/`): in `parts/LeserTastatur.tsx`
// `menueOffen()` / `inWaagrechtemScroller(e.target)` / `e.repeat && UMSCHALTER`
// entfernen — je der Test (a)/(b)/(c) fällt.
import { test, expect, type Page } from '@playwright/test'

const OR = '/gesetze/bund/OR'
const EMRK_TABELLE = '/gesetze/international/EMRK?ansicht=artikel#art-scope_u1'

async function rahmenBereit(page: Page) {
  await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 30_000 })
}

test.describe('Leser-Tastatur — Menü, Tabelle, Auto-Repeat', () => {
  test('(a) G4-B01 · offenes «Ansicht»-Menü: «t» und «j» greifen nicht, Pfeil/Esc gehören dem Menü', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(OR)
    await rahmenBereit(page)
    await page.locator('[data-v3-ansicht]').first().click()
    const panel = page.locator('[data-v3-ansicht-panel]')
    await expect(panel).toBeVisible()
    const imMenue = () => page.evaluate(() => {
      const p = document.querySelector('[data-v3-ansicht-panel]')
      return !!p && p.contains(document.activeElement)
    })
    expect(await imMenue(), 'der Fokus steht nach dem Öffnen im Menü').toBe(true)

    const y0 = await page.evaluate(() => window.scrollY)
    await page.keyboard.press('t')
    await page.keyboard.press('j')
    await page.waitForTimeout(500) // dem fälschlichen Sprung Zeit geben
    expect(await imMenue(), '«t» schiebt den Fokus nicht aus dem Menü').toBe(true)
    await expect(panel, 'das Menü bleibt offen').toBeVisible()
    expect(await page.evaluate(() => window.scrollY), '«j» springt nicht zum nächsten Artikel').toBe(y0)

    // Die Menü-Tasten gehören dem Menü: ↓ bewegt den Fokus zwischen den Zeilen.
    await page.keyboard.press('ArrowDown')
    expect(await page.evaluate(() => document.activeElement?.getAttribute('role'))).toMatch(/^menuitem/)
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()

    // Gegenprobe: bei geschlossenem Menü wirkt «t» wieder (Fokus in die Gliederung).
    await page.keyboard.press('t')
    await expect.poll(() => page.evaluate(() => !!document.querySelector('[data-toc]')?.contains(document.activeElement)))
      .toBe(true)
  })

  test('(b) B11-B01/ED10 · → in der fokussierten Tabelle scrollt sie, statt zu blättern', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 })
    await page.goto(EMRK_TABELLE)
    await rahmenBereit(page)
    const tabelle = page.locator('[data-mehrspaltig]').first()
    await expect(tabelle).toBeAttached({ timeout: 20_000 })
    await tabelle.focus()
    const m = await tabelle.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }))
    expect(m.sw, 'Voraussetzung: die Tabelle läuft @600 seitlich über').toBeGreaterThan(m.cw)
    const hash = await page.evaluate(() => location.hash)
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => tabelle.evaluate((el) => el.scrollLeft), { timeout: 5_000 }).toBeGreaterThan(0)
    expect(await page.evaluate(() => location.hash), 'die Adresse (= der gezeigte Artikel) bleibt').toBe(hash)
    await page.keyboard.press('ArrowLeft')
    await expect.poll(() => tabelle.evaluate((el) => el.scrollLeft), { timeout: 5_000 }).toBe(0)
    expect(await page.evaluate(() => location.hash)).toBe(hash)
  })

  test('(c) G4-B02 · «?» gehalten: das Overlay bleibt offen statt zu flackern', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(OR)
    await rahmenBereit(page)
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    const dialog = page.getByRole('dialog', { name: 'Tastatur-Kurzbefehle' })
    await page.keyboard.down('?')
    await expect(dialog).toBeVisible()
    await page.keyboard.down('?') // Auto-Repeat (die Taste ist schon unten)
    await page.keyboard.down('?')
    await page.keyboard.down('?')
    await page.waitForTimeout(300)
    await expect(dialog, 'bei 1 + 3 Wiederholungen bleibt das Overlay offen').toBeVisible()
    await page.keyboard.up('?')
    await expect(dialog).toContainText('Strg+K')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})
