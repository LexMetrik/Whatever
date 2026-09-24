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
//
// DEKLARIERTE ANPASSUNG (U9, Nachtrag David 24.9.2026 abends, §5d-bis, §6.3):
// «zuletzt geöffnet auf startseite soll nicht extra platz einnehmen sonder
// schnellwerkzeug soll kleiner werden». (c) zweiter Teil ist damit AUFGEHOBEN:
// die Bühne reserviert nur noch die Frist-Höhe (Prerender-Variante), Verzugszins
// und Verjährung dürfen die Fläche wachsen lassen (Trade-off bewusst, s.
// `start/Schnellwerkzeug.tsx`). Geprüft wird jetzt:
//   (c') Frist steht ohne Leerfläche in der Bühne (Reserve ≤ 16 px); die höheren
//        Varianten sind mindestens so hoch und ragen nie über die Bühne hinaus;
//   (e)  «Zuletzt geöffnet» nimmt keine eigene Rasterzeile ein: ab `lg` steht es
//        in der Spalte unter dem Schnellwerkzeug und endet nicht unter «Häufig
//        gebraucht»; höchstens fünf Einträge, je eine Zeile; sein Erscheinen
//        nach dem Laden verschiebt nichts (CLS < 0.01, Frist). Einspaltig bleibt
//        die Reihenfolge Kacheln · Häufig · Schnellwerkzeug · Zuletzt.
// (d) bleibt unverändert grün (gemessen U9: verzugszins 0.0000, verjaehrung 0.0001).

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
    test(`@${breite}: Bühne = Frist-Höhe (U9), höhere Varianten wachsen ohne Überlauf`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: 900 })
      await page.goto('/')
      const panel = page.getByRole('tabpanel')
      // Reserve = Bühne minus natürliche Höhe des Frist-Inhalts (Mindesthöhe kurz aufgehoben).
      const reserve = await panel.evaluate((p) => {
        const h = p.getBoundingClientRect().height
        p.style.setProperty('min-height', '0px', 'important')
        const natur = p.getBoundingClientRect().height
        p.style.removeProperty('min-height')
        return Math.round(h - natur)
      })
      // ≤ 16 px: die Token-Höhe gilt der schmalsten zweispaltigen Fläche (20rem-Spalte,
      // Frist 514 px); breiter (@390: 506 px) bricht der Hinweis kürzer. Vor U9: 182 px.
      expect(reserve, 'Bühne reserviert nur die Frist-Höhe').toBeLessThanOrEqual(16)
      const hFrist = await hoehe(page)
      for (const [name, text] of [['Verzugszins', 'Verzugszins (gesamt)'], ['Verjährung', 'Verjährungseintritt']] as const) {
        await reiter(page, name).click()
        await expect(panel).toContainText(text)
        expect(await hoehe(page), `${name} ≥ Frist ${hFrist} px`).toBeGreaterThanOrEqual(hFrist)
        // Kein Inhalt ragt über die Bühne hinaus — sie wächst mit, statt abzuschneiden.
        expect(await panel.evaluate((p) => p.scrollHeight - p.clientHeight)).toBeLessThanOrEqual(0)
      }
    })
  }

  test('U9: «Zuletzt geöffnet» ohne eigene Zeile — fünf einzeilige Einträge, kein Sprung', async ({ page }) => {
    const titel = ['Bundesgesetz betreffend die Ergänzung des Schweizerischen Zivilgesetzbuches (Fünfter Teil: Obligationenrecht)',
      'BGE 152 V 52', 'Verzugszinsrechner', 'Schweizerisches Zivilgesetzbuch', 'Bundesgesetz über Schuldbetreibung und Konkurs',
      'Kreisschreiben Nr. 24', 'Arbeitsvertrag', 'Schweizerische Strafprozessordnung', 'Urteil 4A_123/2025', 'Fristenrechner',
      'Bundesverfassung der Schweizerischen Eidgenossenschaft', 'Mietvertrag']
    const eintraege = titel.map((t, i) => ({ route: `/gesetze/bund/U9-${i}`, titel: t, typ: 'gesetz', zeit: 12 - i }))
    await page.addInitScript((e) => {
      try { localStorage.setItem('lexmetrik-zuletzt', JSON.stringify(e)) } catch { /* s. Produktcode */ }
      ;(window as unknown as { __cls: number }).__cls = 0
      new PerformanceObserver((l) => {
        for (const x of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!x.hadRecentInput) (window as unknown as { __cls: number }).__cls += x.value
        }
      }).observe({ type: 'layout-shift', buffered: true })
    }, eintraege)
    const zuletzt = page.locator('section', { has: page.getByRole('heading', { name: 'Zuletzt geöffnet' }) })
    const haeufig = page.locator('section', { has: page.getByRole('heading', { name: 'Häufig gebraucht' }) })
    const kacheln = page.locator('.lc-start-feld')
    const box = async (l: typeof zuletzt) => (await l.boundingBox())!

    for (const breite of [1440, 1024] as const) {
      await page.setViewportSize({ width: breite, height: 1000 })
      await page.goto('/')
      await expect(zuletzt.getByRole('link')).toHaveCount(5)
      await expect(zuletzt.getByRole('link').first()).toHaveAttribute('title', titel[0])
      await page.waitForTimeout(600)
      const [s, z, h] = [await box(flaeche(page)), await box(zuletzt), await box(haeufig)]
      expect(Math.round(z.x), 'Zuletzt in der Spalte des Schnellwerkzeugs').toBe(Math.round(s.x))
      expect(z.y, 'Zuletzt unter dem Schnellwerkzeug').toBeGreaterThan(s.y + s.height)
      expect(z.y + z.height, `@${breite}: keine eigene Zeile — endet nicht unter «Häufig gebraucht»`).toBeLessThanOrEqual(h.y + h.height + 1)
      // Eine Zeile je Eintrag: jeder Verweis höchstens so hoch wie ein kurzer Eintrag.
      const hoehen = await zuletzt.getByRole('link').evaluateAll((as) => as.map((a) => Math.round(a.getBoundingClientRect().height)))
      expect(Math.max(...hoehen), `Verweishöhen ${hoehen.join('/')}`).toBeLessThanOrEqual(Math.min(...hoehen) + 1)
      const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
      console.log(`U9 CLS mit Zuletzt @${breite}: ${cls.toFixed(4)}`)
      expect(cls).toBeLessThan(0.01)
    }

    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto('/')
    await expect(zuletzt.getByRole('link')).toHaveCount(5)
    const ys = [await box(kacheln), await box(haeufig), await box(flaeche(page)), await box(zuletzt)].map((b) => b.y)
    expect(ys, 'einspaltig: Kacheln · Häufig · Schnellwerkzeug · Zuletzt').toEqual([...ys].sort((a, b) => a - b))
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  })

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
