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
//  O-25  (Nachzug #1387) Der Reiter folgt der Zuständigkeits-Weiche auch zurück nach Zivil und lässt
//        `/rechner/kuendigung#lohnfortzahlung` bei der H1 («Kündigung & Fristen …»).
//        ROT ZU BEKOMMEN: in `lib/tabs.eintragAus` jeden Hash erben lassen bzw. in
//        `lib/verlaufLabel.karteMitHash` die Seiten-Einschränkung `HASH_FOLGT_H1` streichen.
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

// ─── O-27 · Link-Layout wird nicht gespeichert: die Leiste sagt es ───────────────────────────
//  GEMESSEN 15.10.2026 (Dev-Server, Chromium 1440×900): im Tab mit geteiltem `?p=`-Link und
//  gespeicherter Eigen-Ordnung blieb das Schliessen/Umbauen ohne jede Rückmeldung; der Reload
//  brachte die Eigen-Ordnung zurück, das Umgebaute war weg.
//  ROT ZU BEKOMMEN: in `usePaneLayout.ts` `zeigeLayoutHinweis()` im `schutz.current`-Zweig streichen.
test.describe('O-27 — Link-Layout nur für diese Sitzung', () => {
  test('Umbau im Link-Tab zeigt den Hinweis, die Eigen-Ordnung kommt beim Neuladen zurück', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      if (!localStorage.getItem('lexmetrik-panes')) localStorage.setItem('lexmetrik-panes', JSON.stringify(['/gesetze/bund/ZGB']))
    })
    await page.goto('/gesetze/bund/MWSTG?p=' + encodeURIComponent('/gesetze/bund/BV'))
    const pane = page.locator('[data-pane="sekundaer"]')
    await expect(pane).toBeVisible({ timeout: 30000 })
    await expect(page.locator('[data-layout-nur-sitzung]'), 'Hinweis schon beim Öffnen').toHaveCount(0)
    await page.getByRole('button', { name: /^«.+» schliessen$/ }).first().click()
    const hinweis = page.locator('[data-layout-nur-sitzung]')
    await expect(hinweis).toBeVisible()
    await expect(hinweis).toContainText('nicht gespeichert')
    // Neu laden: die gespeicherte Eigen-Ordnung ist unversehrt zurück.
    await page.goto('/gesetze/bund/MWSTG')
    await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 30000 })
    expect(await page.evaluate(() => localStorage.getItem('lexmetrik-panes'))).toBe(JSON.stringify(['/gesetze/bund/ZGB']))
    expect(fehler).toEqual([])
  })
})

// ─── O-28(c) · Fokus nach Klick auf «Artikel N» steht am Ziel, nicht auf <body> ──────────────
//  GEMESSEN 15.10.2026 (Dev-Server, Chromium 1440×900, visibilityState visible): OR Einzelansicht
//  Art. 336b, Klick auf den internen Verweis «Artikel 336» ⇒ der Router tauscht den Artikel, der Verweis
//  verschwindet, `document.activeElement` = BODY (nach 100, 700 und 1500 ms). Im zweiten Fenster
//  (Gesamtansicht) blieb der Fokus auf dem Verweis, ohne zum Ziel zu wandern.
//  ROT ZU BEKOMMEN: in `inhalt-sprung.tsx` den Aufruf `fokussiereArtikel(…)` in `springeZuRef` streichen.
test.describe('O-28(c) — Fokus am Sprungziel', () => {
  test('Einzelansicht: der Fokus folgt dem Verweis auf den neuen Artikel', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/OR?ansicht=artikel#art-336_b')
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible')
    await expect(page.locator('#art-336_b')).toBeVisible({ timeout: 30000 })
    await page.locator('article a[href="/gesetze/bund/OR#art-336"]').first().click()
    await expect(page.locator('#art-336')).toBeFocused({ timeout: 5000 })
    expect(fehler).toEqual([])
  })

  test('zweites Fenster: der Fokus wandert vom Verweis zum Ziel-Artikel DES Panes', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/MWSTG?p=' + encodeURIComponent('/gesetze/bund/OR#art-336_b'))
    const pane = page.locator('[data-pane="sekundaer"]')
    await expect(pane.locator('#art-336_b')).toBeVisible({ timeout: 30000 })
    await pane.locator('article a[href="/gesetze/bund/OR#art-336"]').first().click()
    await expect(pane.locator('#art-336')).toBeFocused({ timeout: 5000 })
    expect(fehler).toEqual([])
  })
})

// ─── O-25 (Nachzug #1387) · Reiter folgt der Weiche in beide Richtungen ─────────────────────
test.describe('O-25 — Reiter-Titel und Weiche', () => {
  test('#straf → Weiche «Zivil»: H1, Adresse und Reiter zeigen Zivilprozess', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/rechner/zustaendigkeit#straf')
    const reiter = page.locator('[data-reiter-schluessel="/rechner/zustaendigkeit"]').first()
    await expect(page.locator('h1')).toContainText('Strafverfahren', { timeout: 30000 })
    await expect(reiter).toContainText('Strafverfahren')
    await page.getByRole('group', { name: 'Rechtsweg' }).getByRole('button', { name: /^Zivil/ }).click()
    await expect(page.locator('h1')).toContainText('Zivilprozess')
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('')
    await expect(reiter).toContainText('Zivilprozess')
    await expect(reiter).not.toContainText('Strafverfahren')
    expect(fehler).toEqual([])
  })

  test('/rechner/kuendigung#lohnfortzahlung: der Reiter heisst wie die H1, nicht «Lohnfortzahlung»', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/rechner/kuendigung#lohnfortzahlung')
    const reiter = page.locator('[data-reiter-schluessel="/rechner/kuendigung"]').first()
    await expect(page.locator('h1')).toContainText('Kündigung', { timeout: 30000 })
    await expect(reiter).toBeVisible()
    await expect(reiter).not.toContainText('Lohnfortzahlung')
    expect(fehler).toEqual([])
  })
})
