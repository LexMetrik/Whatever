// @shard-gruppe: 8
import { test, expect, type Page } from '@playwright/test'

// W2·31-BILDSCHIRMBREITE B11 (26.9.2026) — breite Legacy-Tabellen im Gesetz-Leser.
//
// Befund am Build 7b13d9de8, `/gesetze/international/EMRK` (Geltungsbereichs-
// Tabelle, 5 Spalten, 64 Rasterzeilen + 11 Fussnoten): der Scroller war 3'558 px
// breit, sichtbar 603 px @1280–1920 und 312 px @390 — die Beschriftungsspalte
// allein 3'118 px, weil die Einzelzellen-Fussnoten in Spalte 1 standen und
// `w-max` jede Zelle einzeilig hielt. Seit B11 (`ArtikelTabellen.tsx`,
// `LegacyMehrspaltigeTabelle`): die Fussnoten stehen als Nachspann unter dem
// Raster, nur Spalte 1 bricht um. Gemessen nachher: @1280 603/603 (kein
// Querscroll), @390 312/584.
//
// Rot gesehen 26.9.2026 gegen den Quellcode vor B11 (src/ zurückgesetzt, Build
// durch playwright): (a) «Scroller 3558 px bei 603 px sichtbar»; (b) kein
// Nachspann im DOM (TypeError beim Messen).

const ERLASS = '/gesetze/international/EMRK'

async function tabelle(page: Page, breite: number) {
  await page.setViewportSize({ width: breite, height: 900 })
  await page.goto(ERLASS)
  const t = page.locator('[data-mehrspaltig]').first()
  await expect(t).toBeAttached({ timeout: 20_000 })
  await page.evaluate(() => document.fonts?.ready)
  await t.scrollIntoViewIfNeeded()
  return t
}

test.describe('B11 — die EMRK-Geltungsbereichs-Tabelle', () => {
  test('(a) @1280: kein Querscroll, Fussnoten als Nachspann, keine Zeile verloren', async ({ page }) => {
    const t = await tabelle(page, 1280)
    const m = await t.evaluate((el) => ({
      cw: el.clientWidth,
      sw: el.scrollWidth,
      zeilen: el.querySelectorAll('[role="row"]').length,
      nachspann: [...el.querySelectorAll('[data-tabelle-nachspann] > span')].map((s) => (s.textContent ?? '').trim()),
      seite: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }))
    expect(m.sw, `Scroller ${m.sw} px bei ${m.cw} px sichtbar — die Tabelle läuft wieder quer`).toBeLessThanOrEqual(m.cw + 1)
    // Kopf + 64 Zeilen im Raster, 11 Fussnoten darunter = alle 75 Quellzeilen (Node-Zählung über public/normtext/bund/EMRK.json, Eintrag scope_u1).
    expect(m.zeilen, 'Raster: Kopf + 64 Zeilen').toBe(65)
    expect(m.nachspann.length, 'Nachspann: 11 Fussnoten').toBe(11)
    expect(m.nachspann[0]).toMatch(/^\* Vorbehalte und Erklärungen\./)
    expect(m.nachspann[10]).toMatch(/^j /)
    expect(m.seite, 'die Seite selbst läuft quer').toBeLessThanOrEqual(0)
  })

  test('(b) @390: Querscroll bleibt, aber kurz — und der Nachspann scrollt nicht weg', async ({ page }) => {
    const t = await tabelle(page, 390)
    const m = await t.evaluate((el) => {
      el.scrollLeft = el.scrollWidth
      const s = el.getBoundingClientRect()
      const n = el.querySelector('[data-tabelle-nachspann]')!.getBoundingClientRect()
      return { cw: el.clientWidth, sw: el.scrollWidth, sx: Math.round(s.left), nx: Math.round(n.left), nr: Math.round(n.right), sr: Math.round(s.right) }
    })
    // Vorher 3'558 px (11-fache Sichtbreite); nachher 584. Die Schwelle lässt
    // Schriftwechsel zu, nicht die Rückkehr der einzeiligen Fussnoten.
    expect(m.sw, `Scroller ${m.sw} px bei ${m.cw} px sichtbar`).toBeLessThan(3 * m.cw)
    expect(Math.abs(m.nx - m.sx), 'der Nachspann ist beim Querscrollen aus dem Bild gewandert').toBeLessThanOrEqual(2)
    expect(m.nr, 'der Nachspann ragt über den Scroller hinaus').toBeLessThanOrEqual(m.sr)
  })
})
