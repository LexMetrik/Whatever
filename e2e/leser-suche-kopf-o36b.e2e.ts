// @shard-gruppe: 1
// LESER-NAV · FB O-36 b (Entscheid David 15.10.2026 «Ja, markieren») — der
// Zählvertrag «gezählt = gemalt» für Sektionsköpfe, im echten Browser.
//
// BEFUND (gemessen 15.10.2026, OR, headless Chromium): «Vertrag» zählte 1607
// Fundstellen, 1104 davon ohne gemalte Stelle; Enter auf einer Kopf-Fundstelle
// sprang zur Überschrift, ohne dass etwas leuchtete. Ursache: der Gliederungspfad
// stand an jedem Artikel als nie gemalter Baustein; der Kopf steht im DOM nur
// einmal, über dem ersten seiner Artikel.
//
// WAS HIER GEPRÜFT WIRD: (1) der Enter-/Weiter-Durchlauf über ALLE Fundstellen —
// jede aktive Stelle (`lc-such-aktiv`) existiert, trägt den Suchbegriff und liegt
// im Bild; (2) mindestens eine davon steht in einem Sektionskopf (sonst trägt der
// Fall nicht); (3) je Treffer-Artikel gilt gezählt = gemalt, wenn man den Kopf über
// ihm mitrechnet. BGFA statt OR: kleiner Erlass, alle Artikel im Sichtfeld
// erreichbar, kein zweiter schwerer Reader.
import { test, expect, type Page } from '@playwright/test'
import { LESER_SUCHFELD_NAME } from './helpers/leserBeschriftung'

test.describe.configure({ timeout: 120_000 })

const suchfeld = (page: Page) => page.getByRole('searchbox', { name: LESER_SUCHFELD_NAME })

async function oeffne(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/BGFA')
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 })
  await page.locator('#lc-lesespalte [data-sek]').first().waitFor({ timeout: 20_000 })
}

test.describe('O-36 b — Köpfe zählen einmal und leuchten', () => {
  for (const begriff of ['Disziplin', 'Anwältinnen']) {
    test(`Durchlauf «${begriff}»: jede aktive Stelle leuchtet, mindestens eine steht im Kopf`, async ({ page }) => {
      await oeffne(page)
      await suchfeld(page).fill(begriff)
      await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 20_000 })
      const vor = page.locator('[data-treffer-vor]')
      await expect(vor).toBeVisible({ timeout: 20_000 })
      const zahl = await page.locator('[data-treffer-artikel]').evaluateAll(
        (els) => els.reduce((s, el) => s + Number(el.getAttribute('data-fundstellen-zahl')), 0))
      expect(zahl, 'Testfall trägt nicht — keine Fundstellen').toBeGreaterThan(2)

      let imKopf = 0
      for (let i = 0; i < zahl; i++) {
        await vor.click()
        await expect.poll(async () => page.evaluate(() =>
          (globalThis as unknown as { CSS: { highlights: Map<string, Set<Range>> } }).CSS.highlights.get('lc-such-aktiv')?.size ?? 0),
        { message: `Schritt ${i + 1}/${zahl}: aktive Stelle`, timeout: 10_000 }).toBe(1)
        const info = await page.evaluate(() => {
          const hl = (globalThis as unknown as { CSS: { highlights: Map<string, Set<Range>> } }).CSS.highlights.get('lc-such-aktiv')!
          const r = [...hl][0]
          const k = r.startContainer
          const el = (k.nodeType === 1 ? k : k.parentElement) as Element
          const rect = r.getBoundingClientRect()
          return {
            text: r.toString().toLowerCase(),
            imKopf: el.closest('[data-sek]') !== null && el.closest('article') === null,
            sichtbar: rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight,
          }
        })
        expect(info.text, `Schritt ${i + 1}: die aktive Stelle ist der Suchbegriff`).toBe(begriff.toLowerCase())
        expect(info.sichtbar, `Schritt ${i + 1}: die aktive Stelle liegt im Bild`).toBe(true)
        if (info.imKopf) imKopf++
      }
      expect(imKopf, `«${begriff}»: keine Fundstelle im Sektionskopf — Testfall trägt nicht`).toBeGreaterThan(0)
    })
  }

  test('je Treffer-Artikel: gezählt = gemalt (Wortlaut + der Kopf über ihm)', async ({ page }) => {
    await oeffne(page)
    await suchfeld(page).fill('Disziplin')
    await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 20_000 })
    // Die Lesespalte wird nur im Sichtband gemalt (§4.5) — also jeden Treffer-Artikel
    // erst ins Bild holen, dann zählen. Die Köpfe liegen unmittelbar davor.
    const zeilen = await page.locator('[data-treffer-artikel]').evaluateAll(
      (els) => els.map((el) => [el.getAttribute('data-treffer-artikel') ?? '', Number(el.getAttribute('data-fundstellen-zahl'))] as const))
    expect(zeilen.length, 'Testfall trägt nicht').toBeGreaterThan(3)
    for (const [token, gezaehlt] of zeilen) {
      await page.locator(`#art-${token}`).scrollIntoViewIfNeeded()
      await page.waitForTimeout(150)
      const gemalt = await page.evaluate((tok) => {
        const reg = (globalThis as unknown as { CSS: { highlights: Map<string, Set<Range>> } }).CSS.highlights.get('lc-such-treffer')
        const art = document.getElementById(`art-${tok}`)!
        // Köpfe, die zwischen dem vorigen Artikel und diesem stehen
        const alle = [...document.querySelectorAll('#lc-lesespalte article[id^="art-"], #lc-lesespalte [data-sek]')]
        const i = alle.indexOf(art)
        const koepfe: Element[] = []
        for (let j = i - 1; j >= 0 && alle[j].hasAttribute('data-sek'); j--) koepfe.push(alle[j])
        let n = 0
        for (const r of reg ?? []) {
          const k = r.startContainer
          const el = k.nodeType === 1 ? (k as Element) : k.parentElement
          if (el && (art.contains(el) || koepfe.some((h) => h.contains(el)))) n++
        }
        return n
      }, token)
      expect(gemalt, `Art. ${token}: gezählt ${gezaehlt}, gemalt ${gemalt}`).toBe(gezaehlt)
    }
  })
})
