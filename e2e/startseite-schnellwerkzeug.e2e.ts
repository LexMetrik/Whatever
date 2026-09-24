// @shard-gruppe: 4
// W2·29-WERKBANK-START-UEBERARBEITUNG U2 · Schnellwerkzeug wählbar (24.9.2026)
import { test, expect, type Page } from '@playwright/test'

// David 24.9.2026: «ich möchte dass man bei den schnellwerkzeugen auswählen
// kann» — Frist · Verzugszins · Verjährung, die Wahl merkt sich der Browser
// (FAHRPLAN-WERKBANK-UMBAU §5d-bis U2). Geprüft gegen den gebauten Stand:
//   (a) Wechsel per Klick und Tastatur, Überschrift folgt, Rechnen live;
//   (b) Neuladen behält die Wahl;
//   (c) §15: Verzugszins/Verjährung laden erst bei Bedarf (kein Chunk im
//       Erstaufruf), und die Fläche ist in allen drei Varianten gleich hoch —
//       das per subgrid gebundene Kachelfeld springt beim Wechsel nicht;
//   (d) §15: Stammnutzer mit gespeicherter Wahl — kein Layout-Shift ohne
//       Eingabe beim Laden (CLS-Beitrag < 0.01; gemessen 24.9.2026 s. Bericht).

const KEY = 'lexmetrik.start.schnellwerkzeug'
const flaeche = (page: Page) => page.locator('section:has([role=tabpanel])')
const reiter = (page: Page, name: string) => page.getByRole('tab', { name, exact: true })

async function hoehe(page: Page) {
  return Math.round((await flaeche(page).boundingBox())!.height)
}

test.describe('Startseite · Schnellwerkzeug wählbar', () => {
  test('Wechsel, Überschrift, Rechnen und Neuladen behält die Wahl', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(flaeche(page).getByRole('heading', { level: 2 })).toHaveText('Schnellwerkzeug · Frist berechnen')
    await expect(reiter(page, 'Frist')).toHaveAttribute('aria-selected', 'true')

    // Verzugszins: Default 10'000 CHF zu 5 % vom 1.1.2024 bis 1.1.2025 (366 Tage, act/365).
    await reiter(page, 'Verzugszins').click()
    await expect(flaeche(page).getByRole('heading', { level: 2 })).toHaveText('Schnellwerkzeug · Verzugszins berechnen')
    const panel = page.getByRole('tabpanel')
    await expect(panel).toContainText("CHF 501.37")
    // Betrag verdoppeln → Zins verdoppelt (20'000 × 5 % × 366/365 = 1'002.74), live.
    const betrag = panel.getByLabel('Betrag (CHF)')
    await betrag.fill('20000')
    await expect(panel).toContainText("CHF 1'002.74")
    // Normbezüge als Links, Weiterweg trägt die Werte.
    await expect(panel.getByRole('link', { name: 'Art. 104 Abs. 1 OR' })).toHaveAttribute('href', /fedlex\.admin\.ch/)
    await expect(panel.getByRole('link', { name: 'Verzugszinsrechner' })).toHaveAttribute('href', /\/rechner\/verzugszins\?.*c=20000/)

    // Verjährung: Anspruchstyp wechseln → Fristlänge in der Detailzeile, Ergebnis neu.
    await reiter(page, 'Verjährung').click()
    await expect(flaeche(page).getByRole('heading', { level: 2 })).toHaveText('Schnellwerkzeug · Verjährung prüfen')
    await expect(page.getByRole('tabpanel')).toContainText('10 Jahre (Art. 127 OR)')
    await page.getByRole('tabpanel').getByLabel('Anspruchstyp').selectOption('kurz')
    await expect(page.getByRole('tabpanel')).toContainText('5 Jahre (Art. 128 OR)')
    await expect(page.getByRole('tabpanel')).toContainText('2029')

    await page.reload()
    await expect(reiter(page, 'Verjährung')).toHaveAttribute('aria-selected', 'true')
    await expect(flaeche(page).getByRole('heading', { level: 2 })).toHaveText('Schnellwerkzeug · Verjährung prüfen')
    await expect(page.getByRole('tabpanel')).toContainText('Verjährungseintritt')
  })

  test('Tastatur: Pfeiltasten wechseln den Reiter und behalten den Fokus', async ({ page }) => {
    await page.goto('/')
    await reiter(page, 'Frist').focus()
    await page.keyboard.press('ArrowRight')
    await expect(reiter(page, 'Verzugszins')).toHaveAttribute('aria-selected', 'true')
    await expect(reiter(page, 'Verzugszins')).toBeFocused()
    await page.keyboard.press('End')
    await expect(reiter(page, 'Verjährung')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(reiter(page, 'Frist')).toHaveAttribute('aria-selected', 'true')
    // Wandernder tabindex: genau ein Reiter ist per Tab erreichbar.
    await expect(page.locator('[role=tab][tabindex="0"]')).toHaveCount(1)
  })

  test('§15: Erstaufruf lädt keine Schnellform-Chunks; Nachladen erst bei Wahl', async ({ page }) => {
    const chunks: string[] = []
    page.on('request', (r) => { if (/(Verzugszins|Verjaehrung)SchnellForm/.test(r.url())) chunks.push(r.url()) })
    await page.goto('/')
    await expect(reiter(page, 'Frist')).toHaveAttribute('aria-selected', 'true')
    await page.waitForLoadState('networkidle')
    expect(chunks, 'Schnellform-Chunk im Erstaufruf').toEqual([])
    await reiter(page, 'Verzugszins').click()
    await expect(page.getByRole('tabpanel')).toContainText('Verzugszins (gesamt)')
    expect(chunks.some((u) => u.includes('VerzugszinsSchnellForm'))).toBe(true)
  })

  for (const breite of [1440, 390] as const) {
    test(`@${breite}: Fläche in allen drei Varianten gleich hoch — kein Sprung beim Wechsel`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: 900 })
      await page.goto('/')
      const hFrist = await hoehe(page)
      await reiter(page, 'Verzugszins').click()
      await expect(page.getByRole('tabpanel')).toContainText('Verzugszins (gesamt)')
      const hVz = await hoehe(page)
      await reiter(page, 'Verjährung').click()
      await expect(page.getByRole('tabpanel')).toContainText('Verjährungseintritt')
      const hVj = await hoehe(page)
      expect([hVz, hVj], `Frist ${hFrist} px`).toEqual([hFrist, hFrist])
      // Kein Inhalt ragt über die reservierte Bühne hinaus (sonst wüchse die Fläche doch).
      const ueber = await page.getByRole('tabpanel').evaluate((p) => p.scrollHeight - p.clientHeight)
      expect(ueber).toBeLessThanOrEqual(0)
    })
  }

  for (const [wahl, text] of [['verzugszins', 'Verzugszins (gesamt)'], ['verjaehrung', 'Verjährungseintritt']] as const) {
    test(`§15 Stammnutzer «${wahl}»: Laden ohne Layout-Shift (CLS < 0.01)`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.addInitScript(([k, w]) => {
        try { localStorage.setItem(k, w) } catch { /* s. Produktcode */ }
        ;(window as unknown as { __cls: number }).__cls = 0
        new PerformanceObserver((l) => {
          for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
            if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value
          }
        }).observe({ type: 'layout-shift', buffered: true })
      }, [KEY, wahl] as const)
      await page.goto('/')
      await expect(page.getByRole('tabpanel')).toContainText(text)
      await page.waitForTimeout(800)
      const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
      console.log(`CLS Stammnutzer ${wahl} @1440: ${cls.toFixed(4)}`)
      expect(cls).toBeLessThan(0.01)
    })
  }
})
