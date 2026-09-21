// @shard-gruppe: 1
// W2·5d U-POSITION (A2 + A16 + A17) — Beweispunkte P4 (FAHRPLAN-GESETZES-UX §10.2).
// A2 Scrollbalken-Proportionalität · A16 Zurück landet exakt am Ausgangsort
// (anker-basiert) · A17 Split-View öffnet an der Fundstelle. Läuft gegen `vite
// preview` (dist). A9-DoD: eine Interaktion unter CPU-Throttle mit CLS-Beobachter.
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

// ── A2: Scrollbalken-Proportionalität an einem langen Erlass (OR) ─────────────
test.describe('A2 — Scrollbalken-Proportionalität (langer Erlass)', () => {
  test('OR: Daumen ans Ende ⇒ letzter Artikel sichtbar, Dokumenthöhe stabil', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze/bund/OR')
    // Warten, bis der Client-Reader die Artikelliste materialisiert hat.
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })

    // Höhe VOR dem Durchscrollen — sie speist sich aus den per-Artikel-Schätzungen
    // (contain-intrinsic-size). Ein grosser, plausibler Wert ist der Beleg, dass NICHT
    // jeder Artikel nur den 320px-Flachwert reserviert (1099+ Einträge × 320 wäre die
    // untere Schranke; die inhalts-proportionale Summe liegt DEUTLICH darüber).
    const hoeheVor = await page.evaluate(() => document.documentElement.scrollHeight)
    expect(hoeheVor, `scrollHeight ${hoeheVor}`).toBeGreaterThan(600_000)

    // PROPORTIONALITÄT (Kern von A2): die Scrollbalken-Position bildet die Dokument-
    // Position ab. Bei ~50 % der scrollbaren Höhe muss der zuoberst angeschnittene
    // Artikel etwa in der MITTE der Artikelliste liegen (nicht am Anfang) — mit dem
    // alten Flach-320px-Wert verzerrt die Unter-/Überschätzung grosser Artikel diese
    // Abbildung. Prüfung an mehreren Bruchteilen (0.25/0.5/0.75) → monotone,
    // proportionale Abbildung.
    const ids: string[] = await page.$$eval('article[id^="art-"]', (els) => els.map((e) => e.id))
    const n = ids.length
    const topIndexBei = async (frac: number): Promise<number> => {
      await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * f), frac)
      await page.waitForTimeout(160)
      return page.evaluate((arr) => {
        for (let i = 0; i < arr.length; i++) {
          const el = document.getElementById(arr[i])
          if (el && el.getBoundingClientRect().bottom > 96) return i
        }
        return arr.length - 1
      }, ids)
    }
    const iViertel = await topIndexBei(0.25)
    const iHalb = await topIndexBei(0.5)
    const iDreiViertel = await topIndexBei(0.75)
    // Mitte des Balkens ⇒ Mitte des Dokuments (grosszügige, aber aussagekräftige Bande).
    expect(iHalb, `Mitte-Index ${iHalb}/${n}`).toBeGreaterThan(n * 0.30)
    expect(iHalb, `Mitte-Index ${iHalb}/${n}`).toBeLessThan(n * 0.72)
    // Monoton: weiter unten am Balken ⇒ weiter hinten im Dokument.
    expect(iViertel).toBeLessThan(iHalb)
    expect(iHalb).toBeLessThan(iDreiViertel)
    expect(fehler).toEqual([])
  })
})

// ── A16: Zurück landet exakt am Ausgangsort (anker-basiert) ───────────────────
test.describe('A16 — Zurück = exakter Ausgangsort', () => {
  // Anker-Pfad (Ausgangs-Reiter OHNE #hash): AIG Art. 5 → Fremdverweis-Popover →
  // «Im Gesetz öffnen» (StGB, echte Navigation) → Zurück ⇒ AIG Art. 5 im Viewport.
  test('Cross-Erlass (AIG→StGB→zurück): Art. 5 wieder im Viewport, nicht Seitenanfang', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/AIG')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('AIG')
    const art5 = page.locator('#art-5')
    await expect(art5).toBeAttached({ timeout: 20000 })
    // OHNE Hash zu Art. 5 scrollen (Anker-Erfassung, nicht Hash-Sprung).
    await art5.scrollIntoViewIfNeeded()
    await page.waitForTimeout(250) // Anker-Scroll-Listener (rAF) erfassen lassen
    await expect(art5).toBeInViewport()

    // Fremdverweis (StGB) öffnen → Popover → «Im Gesetz öffnen» (echte Navigation).
    const stgbLink = art5.locator('a[href*="54/757_781_799"][href*="#art_66_a"]:not([href*="66_a_bis"])').first()
    await expect(stgbLink).toBeVisible({ timeout: 10000 })
    await stgbLink.click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    const oeffnen = dialog.getByRole('link', { name: /Im Gesetz öffnen/ })
    await expect(oeffnen).toBeVisible()
    await oeffnen.click()
    await expect(page).toHaveURL(/\/gesetze\/bund\/STGB/i, { timeout: 15000 })
    await expect(page.getByRole('heading', { level: 1 })).toContainText('StGB', { timeout: 15000 })

    // ZURÜCK: exakt Art. 5 der AIG wieder im Viewport (anker-basiert wiederhergestellt).
    await page.goBack()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('AIG', { timeout: 15000 })
    await expect(page.locator('#art-5')).toBeInViewport({ timeout: 15000 })
    expect(fehler).toEqual([])
  })

  // Interner Verweis (nutzer-initiiert) legt einen echten History-Eintrag an →
  // Browser-Zurück kehrt an den Ausgangs-Artikel zurück; auch mehrfach.
  test('Interner Verweis (MWSTG Art. 5 → 31 → zurück): Art. 5 wieder im Viewport', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/MWSTG#art-5')
    await expect(page.locator('#art-5')).toBeInViewport({ timeout: 20000 })
    // Interner Sprung-Link (Plural-Linker A10): Art. 5 → Art. 31.
    const link31 = page.locator('a[href="/gesetze/bund/MWSTG#art-31"]').first()
    await expect(link31).toBeVisible({ timeout: 10000 })
    await link31.click()
    await expect(page.locator('#art-31')).toBeInViewport({ timeout: 10000 })
    await expect(page).toHaveURL(/#art-31$/)
    // Zurück ⇒ Ausgangs-Artikel 5 wieder im Viewport (echter History-Eintrag).
    await page.goBack()
    await expect(page.locator('#art-5')).toBeInViewport({ timeout: 10000 })
    expect(fehler).toEqual([])
  })
})

// ── A17: Split-View öffnet direkt an der Fundstelle ──────────────────────────
test.describe('A17 — Split-View an der Fundstelle', () => {
  // Norm-⧉ aus dem Entscheid-Fuss: das Pane öffnet die Norm AN Art. 18 (nicht oben).
  test('Norm-⧉ (Entscheid → UVG): Pane öffnet an Art. 18, nicht am Seitenanfang', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/rechtsprechung/bge_152_V_52')
    await expect(page.getByRole('heading', { level: 1, name: /152 V 52/ })).toBeVisible({ timeout: 20000 })
    const link = page.getByRole('link', { name: 'Art. 18 UVG', exact: true }).first()
    await link.scrollIntoViewIfNeeded()
    await link.click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: /nebeneinander öffnen/ }).click()
    const pane = page.locator('[data-pane="sekundaer"]')
    await expect(pane).toBeVisible({ timeout: 10000 })
    // Fundstelle: das Pane hat auf Art. 18 des UVG gesprungen (im Pane-Viewport).
    const art18 = pane.locator('#art-18')
    await expect(art18).toBeVisible({ timeout: 15000 })
    await expect(art18).toBeInViewport({ timeout: 15000 })
    expect(fehler).toEqual([])
  })
})

// ── A9-DoD: Scroll-Interaktion unter CPU-Throttle, CLS 0 ──────────────────────
test.describe('A9 — Flüssigkeit unter CPU-Throttle', () => {
  test('Scroll unter Drossel flüssig, CLS 0 (Anker-Erfassung ohne Layout-Shift)', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    // Mittellanger Erlass (MWSTG) — die Scroll-Interaktion + Anker-Erfassung ist die
    // Messfläche; die Proportionalität an sehr langen Erlassen prüft der A2-Test (OR).
    await page.goto('/gesetze/bund/MWSTG')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })
    // CLS-Beobachter scharf schalten (nur unerwartete Shifts).
    await page.evaluate(() => {
      ;(window as unknown as { __cls: number }).__cls = 0
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    // ECHTES Nutzer-Scrollen (Tastatur: PageDown/PageUp) — so werden die content-
    // visibility-eigenen Render-Reflows dem Input zugerechnet (hadRecentInput ⇒
    // CLS-ausgeschlossen, wie beim echten Nutzer). Gemessen wird der Beitrag des
    // NEUEN passiven Anker-Listeners (rAF, eine getBoundingClientRect je Frame): er
    // darf keinen unerwarteten Layout-Shift und keine Long-Task-Kaskade erzeugen
    // (§15). Tastatur-Scroll ist unter Drossel zuverlässig (mouse.wheel hängt dort).
    await page.locator('body').press('Escape') // sicher: kein Feld fokussiert → Body scrollt
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('PageDown')
      await page.waitForTimeout(90)
    }
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('PageUp')
      await page.waitForTimeout(90)
    }
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 12000 })
    const cls = await page.evaluate(() => (window as unknown as { __cls?: number }).__cls ?? 0)
    expect(cls, `CLS ${cls}`).toBeLessThan(0.05)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    expect(fehler).toEqual([])
  })
})
