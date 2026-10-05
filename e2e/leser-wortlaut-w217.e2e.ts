// @shard-gruppe: 2
import { test, expect } from '@playwright/test'

// W2·17-UI-BEFUNDE (1.10.2026) — Wortlaut und Gliederung im Gesetzesleser folgen dem
// Snapshot. Vier Befunde, die nur im Browser (Layout) bzw. am gerenderten Gesamtbild
// sichtbar sind; die Zeichenketten-Logik hat ihre Unit-Tests (leser-wortlaut-*.test.*).
//
// Rot gesehen 1.10.2026 gegen den Stand vor dem Fix (Dev-Server main 04c4ebf6c):
//  (a) HAÜ-Anhang-Anker 2357 px bei 335 px Artikelbreite (abgeschnitten, kein Umbruch);
//  (b) ERV Anhang 1: 103 Zellen «31.01.2'022»;
//  (c) AR-822.111 Art. 1: Zitat «Art. 1 Abs. 1 lit. c Ziff. 2» (Bestimmung existiert nicht);
//  (d) NE-16631 Art. 14: 45× «:.» (erfundener Punkt hinter dem Doppelpunkt der Marke).

async function oeffne(page: import('@playwright/test').Page, pfad: string, selektor: string, breite = 1280) {
  await page.setViewportSize({ width: breite, height: 900 })
  await page.goto(pfad)
  const art = page.locator(selektor)
  await expect(art).toBeAttached({ timeout: 30_000 })
  await page.evaluate(() => document.fonts?.ready)
  return art
}

test.describe('W2·17 — Wortlaut-Darstellung', () => {
  test('(a) E-D5-B01: ein langer Anhang-Titel bricht um statt abgeschnitten zu werden (@375)', async ({ page }) => {
    const art = await oeffne(page, '/gesetze/international/HAUE#art-annex_u1', 'article[id="art-annex_u1"]', 375)
    const m = await art.evaluate((el) => {
      const a = el.querySelector('a[href="#art-annex_u1"]')!
      return { anker: Math.round(a.getBoundingClientRect().width), artikel: Math.round(el.getBoundingClientRect().width), zeichen: (a.textContent ?? '').length }
    })
    expect(m.zeichen, 'der amtliche Titel ist lang (243 Zeichen)').toBeGreaterThan(100)
    expect(m.anker, `Anker ${m.anker} px in ${m.artikel} px breitem Artikel — der Titel läuft wieder quer`).toBeLessThanOrEqual(m.artikel)
  })

  test('(b) E-D4-B03: ERV Anhang 1 — Referenzdatum ohne Tausender-Apostroph im Jahr', async ({ page }) => {
    const art = await oeffne(page, '/gesetze/bund/ERV#art-annex_1', 'article[id="art-annex_1"]')
    const zellen = await art.locator('[role="cell"]').allTextContents()
    const daten = zellen.filter((z) => /^\d\d\.\d\d\.\d/.test(z))
    expect(daten.length, 'Datums-Zellen vorhanden').toBeGreaterThan(50)
    expect(daten.filter((z) => /'/.test(z)), 'Daten mit Apostroph').toEqual([])
    expect(daten).toContain('31.01.2022')
  })

  test('(c) E-D2-B01: AR-822.111 Art. 1 — lit. unter Ziff., Zitat nennt existierende Bestimmung', async ({ page }) => {
    const art = await oeffne(page, '/gesetze/kanton/AR-822.111#art-1', 'article[id="art-1"]')
    const zitate = await art.locator('button[aria-label$="kopieren"]').evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-label') ?? ''))
    expect(zitate.some((z) => /^Art\. 1 Abs\. 1 Ziff\. 1 lit\. a /.test(z)), 'lit. a steht unter Ziff. 1').toBe(true)
    expect(zitate.some((z) => /^Art\. 1 Abs\. 1 Ziff\. 2 /.test(z)), 'Ziff. 2 ist eine eigene Ziffer').toBe(true)
    expect(zitate.filter((z) => /lit\. c Ziff\. /.test(z)), 'keine «lit. c Ziff. N»-Fehlzitate').toEqual([])
  })

  test('(d) E-D2-B02: NE-16631 Art. 14 — kein erfundener Punkt hinter dem Doppelpunkt der Marke', async ({ page }) => {
    const art = await oeffne(page, '/gesetze/kanton/NE-16631#art-14', 'article[id="art-14"]')
    const text = (await art.textContent()) ?? ''
    expect(text, 'Marke «Légalisation de signature:» vorhanden').toContain('Légalisation de signature:')
    expect(text.match(/:\.\S/g) ?? [], '«:.»-Folgen').toEqual([])
  })
})
