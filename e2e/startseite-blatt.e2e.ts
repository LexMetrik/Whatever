// @shard-gruppe: 3
import { test, expect, type Page } from '@playwright/test'

// ─── W2·29-WERKBANK-START S1 · Startseite: Kachelfeld, das vor Ort aufklappt ──
//
// Ersetzt `startseite-pult-r10.e2e.ts` (der Modul-Baukasten ist gestrichen,
// Auswahlfrage David 23.9.2026). Geprüft wird die ECHTE Aktionsfolge
// (`.claude/rules/webseiten-pruefung.md` «Zustand ist eine Folge»): aufklappen,
// Stufe tiefer, Browser-Zurück = eine Stufe, «← Zurück», Escape schliesst ganz
// und gibt den Fokus an die Kachel zurück; Deep-Link öffnet die Stufe direkt.
// Soll aus Davids Wortlaut: FAHRPLAN-WERKBANK-UMBAU §5d.

const feld = (page: Page) => page.getByRole('navigation', { name: 'Bereiche der Sammlung' })
const blatt = (page: Page) => page.locator('#lm-start-blatt')
const gesetzeKachel = (page: Page) => feld(page).getByRole('button', { name: /Gesetze/ })

test.describe('Startseite · Kachelfeld', () => {
  for (const breite of [1280, 390]) {
    test(`@${breite}: vier Kacheln im 2×2-Feld, ohne Querscroll`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: 900 })
      await page.goto('/')
      const zellen = page.locator('.lc-start-zelle')
      await expect(zellen).toHaveCount(4)
      const lage = await zellen.evaluateAll((els) => els.map((e) => {
        const r = e.getBoundingClientRect()
        return { x: Math.round(r.left), y: Math.round(r.top) }
      }))
      expect(new Set(lage.map((l) => l.x)).size, `Spalten: ${JSON.stringify(lage)}`).toBe(2)
      expect(new Set(lage.map((l) => l.y)).size, `Reihen: ${JSON.stringify(lage)}`).toBe(2)
      const weite = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(weite).toBeLessThanOrEqual(breite)
      // §8: jede Kachel trägt eine echte Zahl.
      for (const t of await zellen.allInnerTexts()) expect(t.replace(/’|'/g, '')).toMatch(/\d/)
    })
  }
})

test.describe('Startseite · Blatt der Gesetze-Kachel', () => {
  test('Stufenfolge mit Browser-Zurück, «← Zurück» und Escape', async ({ page }) => {
    await page.goto('/')
    const kachel = gesetzeKachel(page)
    await expect(kachel).toHaveAttribute('aria-expanded', 'false')
    await kachel.click()
    await expect(page).toHaveURL(/\?blatt=gesetze$/)
    await expect(kachel).toHaveAttribute('aria-expanded', 'true')
    await expect(blatt(page)).toBeFocused()

    await blatt(page).getByRole('button', { name: /Bund/ }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze\/bund$/)
    await blatt(page).getByRole('button', { name: /Privatrecht/ }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze\/bund\/02$/)
    // Letzte Stufe: echte Links in den Leser.
    await expect(blatt(page).locator('a[href="/gesetze/bund/OR"]').first()).toBeVisible()

    await page.goBack()
    await expect(page).toHaveURL(/\?blatt=gesetze\/bund$/)
    await blatt(page).getByRole('button', { name: '← Zurück' }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze$/)

    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/$/)
    await expect(blatt(page)).toHaveCount(0)
    await expect(kachel).toBeFocused()
  })

  test('Kantone: Landeskarte und Liste der 26, dann Erlassliste', async ({ page }) => {
    await page.goto('/?blatt=gesetze/kantone')
    await expect(blatt(page).locator('svg').first()).toBeVisible()
    const liste = blatt(page).getByRole('list', { name: 'Kantone' }).getByRole('button')
    await expect(liste).toHaveCount(26)
    await liste.filter({ hasText: 'Basel-Stadt' }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze\/kantone\/BS$/)
    await expect(blatt(page).locator('a[href^="/gesetze/kanton/"]').first()).toBeAttached()
  })

  test('Deep-Link öffnet die Stufe direkt; ✕ schliesst ganz', async ({ page }) => {
    await page.goto('/?blatt=gesetze/international')
    await expect(blatt(page)).toBeVisible()
    await expect(blatt(page).getByText('International', { exact: true })).toBeVisible()
    await blatt(page).getByRole('button', { name: 'Gesetze schliessen' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(blatt(page)).toHaveCount(0)
  })

  test('Telefon: Vollbild-Blatt über der ganzen Seite', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await gesetzeKachel(page).click()
    await expect(blatt(page)).toHaveAttribute('data-phase', 'offen')
    // Die Einfahrt (450 ms, transform) abwarten: gemessen wird die Endlage.
    await expect.poll(async () => {
      const r = await blatt(page).boundingBox()
      return r && [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]
    }).toEqual([0, 0, 390, 844])
    // Das Blatt liegt oben: der Mittelpunkt trifft das Blatt, nicht die Seite dahinter.
    const oben = await page.evaluate(() => document.elementFromPoint(195, 600)?.closest('#lm-start-blatt') !== null)
    expect(oben).toBe(true)
  })
})
