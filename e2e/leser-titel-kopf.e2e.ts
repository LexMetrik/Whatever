import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

// ═══ W2·17-UI-BEFUNDE (1.10.2026) · Erlass-Titel im Kopf und im Reiter ═══════
//
// Browser-Seite zu `src/tests/leser-titel-kopf.test.ts` (die Regeln selbst sind
// dort unit-bewiesen, auch über alle 1580 Register-Einträge). Hier steht, was nur
// gerendert prüfbar ist: kein horizontaler Seitenüberlauf, der Titel steht EINMAL.
//
//  · E-D16-B01 — AR-822.111 @390 hatte documentElement.scrollWidth 1434 (nicht
//    umbrechende «Kennung» = der ganze Titel, danach noch einmal der Titel);
//    BS-390.760 trug ein Satzfragment als Kennung vor dem Titel; BS-410.130 @390
//    eine 35 Zeichen lange Kennung, 452 px in 318 px.
//  · PA-6-B04/B05 — ArGV 3: «… (ArGV 3) (ArGV 3)» statt des Sachtitels; RBÜ ohne
//    Revisionsangabe.
//  · PA-6-B06 — Reiter «RBÜ (revidiert in Paris am 24. Juli 1971, RBÜ)».
//
// ROT ZU BEKOMMEN (§6.7): in `src/pages/gesetz-leser/v3/erlassWortlaut.ts` den
// Deckel `KENNUNG_MAX_ZEICHEN` aus `titelKennung` streichen — dann steht an
// AR-822.111/BS-390.760 wieder eine Kennung vor dem Titel.

async function oeffne(page: Page, pfad: string, breite: number) {
  await page.setViewportSize({ width: breite, height: 900 })
  await page.goto(pfad)
  const h1 = page.locator('h1').first()
  await expect(h1).toBeVisible({ timeout: 20_000 })
  return h1
}

const seitenBreite = (page: Page) => page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth, fenster: window.innerWidth,
}))

test.describe('W2·17-UI-BEFUNDE — Erlass-Titel im Kopf', () => {
  test('E-D16-B01 · AR-822.111 @390: der Titel steht einmal, die Seite läuft nicht über', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    const h1 = await oeffne(page, '/gesetze/kanton/AR-822.111', 390)
    const text = ((await h1.textContent()) ?? '').replace(/\s+/g, ' ').trim()
    expect(text.split('Gebührentarif zum Bundesgesetz').length - 1, `Titel doppelt: «${text}»`).toBe(1)
    await expect(page.locator('[data-kopf-kennung]')).toHaveCount(0)
    const b = await seitenBreite(page)
    expect(b.scroll, `Seitenüberlauf: scrollWidth ${b.scroll} > ${b.fenster}`).toBeLessThanOrEqual(b.fenster)
    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('E-D16-B01 · BS-390.760: kein Satzfragment als Kennung vor dem Titel', async ({ page }) => {
    const h1 = await oeffne(page, '/gesetze/kanton/BS-390.760', 390)
    await expect(page.locator('[data-kopf-kennung]')).toHaveCount(0)
    const text = ((await h1.textContent()) ?? '').trim()
    expect(text.startsWith('Vertrag betreffend die Kremation'), `H1 beginnt mit «${text.slice(0, 40)}»`).toBe(true)
    const b = await seitenBreite(page)
    expect(b.scroll).toBeLessThanOrEqual(b.fenster)
  })

  test('E-D16-B01 · BS-410.130 @390: die 35 Zeichen lange Kennung umbricht statt zu überlaufen', async ({ page }) => {
    await oeffne(page, '/gesetze/kanton/BS-410.130', 390)
    const kennung = page.locator('[data-kopf-kennung]')
    await expect(kennung).toHaveText('Absenzen- und Disziplinarverordnung')
    const b = await seitenBreite(page)
    expect(b.scroll, `Seitenüberlauf: scrollWidth ${b.scroll} > ${b.fenster}`).toBeLessThanOrEqual(b.fenster)
  })

  test('Gegenprobe: LugÜ behält die kurze, unteilbare Kennung', async ({ page }) => {
    await oeffne(page, '/gesetze/international/LUGUE', 390)
    const kennung = page.locator('[data-kopf-kennung]')
    await expect(kennung).toHaveText('LugÜ')
    await expect(kennung).toHaveClass(/whitespace-nowrap/)
  })

  test('PA-6-B04 · ArGV 3: der amtliche Sachtitel steht in der H1, das Kürzel einmal; der Reiter ebenso', async ({ page }) => {
    const h1 = await oeffne(page, '/gesetze/bund/ARGV3', 1440)
    const text = ((await h1.textContent()) ?? '').replace(/\s+/g, ' ').trim()
    expect(text).toBe('Verordnung 3 zum Arbeitsgesetz (ArGV 3) (Gesundheitsschutz)')
    await expect(page).toHaveTitle(/^ArGV 3 \(Gesundheitsschutz\) — LexMetrik/)
  })

  test('PA-6-B05/B06 · RBÜ: die Revisionsangabe bleibt im Titel, der Reiter nennt das Kürzel einmal', async ({ page }) => {
    const h1 = await oeffne(page, '/gesetze/international/RBUE', 1440)
    const text = ((await h1.textContent()) ?? '').replace(/\s+/g, ' ').trim()
    expect(text).toContain('revidiert in Paris am 24. Juli 1971')
    await expect(page).toHaveTitle(/^RBÜ \(revidiert in Paris am 24\. Juli 1971\) — LexMetrik/)
  })
})
