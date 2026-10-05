// @shard-gruppe: 4
// ═══ H4-NACHZUG (18.8.2026) · ZWEI WEGE IN DIE GLIEDERUNG, BEIDE GEMESSEN ════
//
// Zwei Befunde aus dem Klick-Test vom 18.8.2026 (Protokoll
// `docs/ux-audit-2026-07/reader/leser-v3-h4/`), die dieselbe Frage stellen wie
// die Kopfweg-Spec nebenan: **führt der sichtbare Weg wirklich dorthin, wo er
// hinzuführen behauptet?**
//
//   B1  @390 blieb das Gliederungs-BLATT nach dem Tap auf einen ARTIKEL offen.
//       Der Tap auf eine SEKTION schloss es. Zwei Einträge derselben Liste, zwei
//       Ausgänge — der Leser stand auf dem Zielartikel und sah ihn nicht, weil
//       das Blatt darüber lag. Gemessen an der VMWG, «Art. 1 — Geltungsbereich»:
//       `[data-gliederung-sheet]` 1 → **1**.
//   B7  Die Taste «t» soll den Fokus «in die Gliederung» setzen. Sie suchte im
//       ganzen `[data-toc]`-Scroller, und dort steht seit H2b ZUOBERST der
//       Erlass-Steckbrief. Gemessen @1440 an der StPO traf sie damit den Link
//       «↗ geltende Fassung» — einen externen Verweis auf Fedlex statt einer
//       Baumzeile.
//
// ROT ZU BEKOMMEN (§6.7, beide Beweise am 18.8.2026 gefahren):
//   · B1 in `v3/leserV3Modell.ts` das `setTocAuf(false)` aus `springeZuArtikel`
//     entfernen (dort sitzt der V3-Sprung; `inhalt.tsx` trägt den von V1) —
//     gemessen: Blatt bleibt 1 → 1;
//   · B7 in `parts/LeserTastatur.tsx` wieder in `[data-toc]` statt in
//     `[data-toc-baum]` suchen — gemessen: Fokus auf «↗ geltende Fassung».
import { test, expect, type Page } from '@playwright/test'

async function warteLeser(page: Page): Promise<void> {
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
}

test.describe('H4-Nachzug — die Gliederung führt dorthin, wo sie hinzeigt', () => {
  test('(a) B1 · @390: der Tap auf einen Artikel schliesst das Gliederungs-Blatt', async ({ page }) => {
    const fehler: string[] = []
    page.on('pageerror', (e) => fehler.push(e.message))
    await page.setViewportSize({ width: 390, height: 844 })
    // VMWG: kleiner Erlass, dessen Gliederung ARTIKEL-Einträge direkt zeigt —
    // genau die Zeilen, an denen der Befund hängt (die StPO zeigt auf oberster
    // Ebene nur Titel, der Fall wäre dort nicht reproduzierbar).
    await page.goto('/gesetze/bund/VMWG')
    await warteLeser(page)
    await page.waitForTimeout(400)

    await page.locator('[data-v3-gliederung-auf]').click()
    const blatt = page.locator('[data-gliederung-sheet]')
    await expect(blatt).toBeVisible({ timeout: 10_000 })

    // Die ARTIKEL-Zeile, nicht irgendeine: gefasst am amtlichen Etikett.
    const artikelZeile = page.locator('[data-gliederung-sheet] button[aria-label^="Art. "]').first()
    await expect(artikelZeile).toBeVisible()
    await artikelZeile.click()

    await expect(blatt, 'das Gliederungs-Blatt liegt nach dem Artikel-Tap über dem Ziel')
      .toHaveCount(0, { timeout: 10_000 })
    // Und der Sprung hat wirklich stattgefunden — sonst prüfte der Fall nur,
    // dass sich irgendetwas schliesst (§6.7 b).
    await expect(page).toHaveURL(/#art-/, { timeout: 10_000 })
    expect(fehler, fehler.join(' | ')).toEqual([])
  })

  test('(b) B1-Gegenprobe · @390: die Sektions-Zeile schliesst es weiterhin', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await warteLeser(page)
    await page.waitForTimeout(400)
    await page.locator('[data-v3-gliederung-auf]').click()
    const blatt = page.locator('[data-gliederung-sheet]')
    await expect(blatt).toBeVisible({ timeout: 10_000 })
    // Erste Zeile, die KEIN Artikel-Etikett trägt (bei der StPO ein Titel).
    // §6.3-DEKLARATION (W2·24, 6.9.2026): die Gliederungs-ZEILE ist seit P8 ein
    // Link (`a[href="#art-…"]`, neue Spec `leser-gliederung-p8`); `button`
    // trägt jetzt nur noch das Klapp-Chevron daneben, und dessen Etikett heisst
    // ««1. Titel: …» auf- und zuklappen» — der alte Selektor traf also nichts
    // mehr (gemessen im Blatt @390, StPO). Geprüft wird unverändert die
    // SEKTIONS-Zeile und dass ihr Tap das Blatt schliesst; nur ihr Element hat
    // sich geändert. Ein Klick auf das Chevron wäre der falsche Fall: es
    // klappt auf, es springt nicht.
    const sektion = page.locator('[data-gliederung-sheet] a[aria-label^="1. Titel"]').first()
    await expect(sektion).toBeVisible()
    await sektion.click()
    await expect(blatt).toHaveCount(0, { timeout: 10_000 })
  })

  test('(c) B7 · «t» setzt den Fokus in den GLIEDERUNGSBAUM, nicht in den Steckbrief', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await warteLeser(page)
    await expect(page.locator('[data-v3-aside]')).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(400)

    // Der Steckbrief steht wirklich ÜBER dem Baum — sonst wäre der Fall grundlos
    // grün (§6.7 b): genau diese Reihenfolge war die Ursache.
    const lage = await page.evaluate(() => {
      const toc = document.querySelector('[data-toc]')!
      const box = toc.querySelector('[data-v3-leiste-uebersicht]')
      const baum = toc.querySelector('[data-toc-baum]')
      return {
        boxVorBaum: !!(box && baum
          && (box.compareDocumentPosition(baum) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0),
        // Was der ALTE Selektor getroffen hätte — der Rot-Beweis, am selben DOM.
        altesZiel: (() => {
          const z = toc.querySelector<HTMLElement>('a[href], button:not([disabled])')
          return z ? (z.getAttribute('aria-label') ?? z.textContent ?? '').trim() : null
        })(),
      }
    })
    expect(lage.boxVorBaum, 'der Steckbrief steht nicht mehr über dem Baum — Fall wirkungslos').toBe(true)
    expect(lage.altesZiel, 'der alte Selektor trifft schon von sich aus den Baum').not.toBeNull()

    await page.locator('#lc-lesespalte').click({ position: { x: 20, y: 20 } })
    await page.keyboard.press('t')
    const fokus = await page.evaluate(() => {
      const a = document.activeElement as HTMLElement | null
      return {
        imBaum: !!a?.closest('[data-toc-baum]'),
        imSteckbrief: !!a?.closest('[data-v3-leiste-uebersicht]'),
        name: (a?.getAttribute('aria-label') ?? a?.textContent ?? '').trim().slice(0, 40),
      }
    })
    expect(fokus.imSteckbrief, `«t» landete im Steckbrief: «${fokus.name}»`).toBe(false)
    expect(fokus.imBaum, `«t» landete nicht im Gliederungsbaum: «${fokus.name}»`).toBe(true)
  })
})
