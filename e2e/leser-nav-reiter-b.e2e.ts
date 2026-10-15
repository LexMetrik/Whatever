// @shard-gruppe: 4
// ─── LESER-NAV Paket B · Navigation/Reiter — Befunde, die nur im Browser sichtbar sind ───
//
//  O-41  Tieflink-Nachzug im Pane misst gegen den Pane-Rand, nicht gegen das Fenster.
//        GEMESSEN 15.10.2026 (Dev-Server, headless Chromium 1440×900,
//        visibilityState visible, MWSTG + `?p=` ZGB#art-5, Pane-Rand bei 165 px):
//        ein fremder Scroll schob das Ziel auf y 125 (über den Pane-Rand, noch im
//        Fenster), der Nachzug stellte es auf 257 zurück.
//        ROT ZU BEKOMMEN: in `inhalt-hooks-tieflink.tsx` `oben`/`unten` wieder auf
//        `0`/`window.innerHeight` stellen.
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

test.describe('O-41 — Tieflink-Nachzug im Pane', () => {
  test('ein fremder Scroll über den Pane-Rand wird nicht zurückgezogen', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/MWSTG?p=%2Fgesetze%2Fbund%2FZGB%23art-5')
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible')
    const pane = page.locator('[data-pane="sekundaer"]')
    await expect(pane.locator('#art-5')).toBeVisible({ timeout: 30000 })
    // Lage steht (eingeschwungen), der Nachzug läuft noch (Fenster 4 s).
    await page.waitForTimeout(900)
    const lagen = await pane.evaluate(async (sec) => {
      const t = sec.querySelector('#art-5') as HTMLElement
      const paneTop = sec.getBoundingClientRect().top
      // Ziel 40 px ÜBER den Pane-Rand schieben: im Fenster (> 0), im Pane verdeckt.
      sec.scrollTop += t.getBoundingClientRect().top - (paneTop - 40)
      const gesetzt = t.getBoundingClientRect().top
      await new Promise((r) => setTimeout(r, 600))
      return { paneTop, gesetzt, danach: t.getBoundingClientRect().top }
    })
    expect(lagen.gesetzt, 'Voraussetzung: Ziel liegt über dem Pane-Rand, im Fenster')
      .toBeGreaterThan(0)
    expect(lagen.gesetzt).toBeLessThan(lagen.paneTop)
    expect(Math.abs(lagen.danach - lagen.gesetzt), `danach ${lagen.danach}, gesetzt ${lagen.gesetzt}`)
      .toBeLessThanOrEqual(2)
    expect(fehler).toEqual([])
  })
})
