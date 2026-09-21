// @shard-gruppe: 4
// IA-4 · Scope-Chip lokale Suche (FAHRPLAN-GESETZES-UX §11.5, O5-Rest):
// Jedes lokale Browse-Filterfeld trägt ein ehrliches Scope-Label (§8), und wo
// der Default-Scope die aktive Ebene ist, weitet der Chip «auf alle Ebenen
// erweitern» mit EINEM Klick. Beweise dieser Spec:
//   – Scope-Label je Ebene (Landeplatz «alle Ebenen» / Säule / Kanton XX),
//     programmatisch mit dem Input verknüpft (aria-describedby → id).
//   – Chip-Klick weitet die Ergebnisliste NACHWEISBAR (ZH-Scope ohne Treffer
//     → alle Ebenen: Bund-Treffer erscheinen); zweiter Klick engt zurück.
//   – KEIN dritter Suchpfad (O5/A5): der Chip ändert nur den Scope des
//     bestehenden Filters; §11.6.5 CLS 0 unter CPU-Throttle 6×.
// J3-Säuberung (Cowork-Befund 18, 18.8.2026): das A–Z-Register trug hier ein
// eigenes, redundantes Filterfeld (bereits «alle Ebenen», kein Chip nötig) —
// entfernt, siehe gesetze-az-register.e2e.ts.
// Läuft gegen `vite preview` (dist).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const scopeZeile = (page: Page) => page.locator('#gesetze-filter-scope')
const chip = (page: Page) => page.getByRole('button', { name: 'auf alle Ebenen erweitern' })
// DEKLARIERTE ANPASSUNG (R12A/D22, 6.9.2026): das Filterfeld auf /gesetze trägt
// jetzt das sichtbare Label «Filtern» — und damit auch den zugänglichen Namen
// (WCAG 2.5.3: sichtbarer Text IST der Name; das frühere `aria-label`
// «Gesetze durchsuchen …» sagte etwas anderes als das Bild). Nur der Locator
// zieht nach, die Zusicherung bleibt Wort für Wort dieselbe.
const feld = (page: Page) => page.getByRole('searchbox', { name: 'Filtern' })

test.describe('IA-4 · Scope-Label je Ebene + programmatische Verknüpfung', () => {
  test('Landeplatz: «alle Ebenen», kein Chip; Label per aria-describedby am Input', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze')
    await expect(scopeZeile(page)).toContainText('Filtert: alle Ebenen (Bund, Kantone, International)')
    // Kein enger Default-Scope ⇒ kein Chip (er wäre wirkungslos, §3.1).
    await expect(chip(page)).toHaveCount(0)
    // Programmatische Verknüpfung: aria-describedby des Feldes zeigt auf das Label.
    await expect(feld(page)).toHaveAttribute('aria-describedby', 'gesetze-filter-scope')
    expect(fehler).toEqual([])
  })

  test('Säule Bund: «Filtert: Bund» + Chip (nicht gedrückt); Kanton ZH: «Filtert: Kanton Zürich»', async ({ page }) => {
    await page.goto('/gesetze?ebene=bund')
    await expect(scopeZeile(page)).toContainText('Filtert: Bund')
    await expect(chip(page)).toHaveAttribute('aria-pressed', 'false')

    await page.goto('/gesetze?ebene=kanton&kt=ZH')
    await expect(scopeZeile(page)).toContainText('Filtert: Kanton Zürich')
    await expect(chip(page)).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('IA-4 · Chip weitet die Ergebnisliste nachweisbar', () => {
  test('ZH-Scope ohne Treffer → 1 Klick → Bund-Treffer sichtbar; 2. Klick engt zurück', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze?ebene=kanton&kt=ZH')
    const main = page.getByRole('main')

    // Default-Scope = aktive Ebene (Kanton ZH): «Obligationenrecht» trifft dort
    // nichts → Abdeckungslücke (IA-2, bleibt), KEIN Bund-Abschnitt.
    await feld(page).fill('Obligationenrecht')
    await expect(main.getByText(/in diesem Kanton erfasst/)).toBeVisible()
    await expect(main.getByRole('heading', { name: /^Bund/ })).toHaveCount(0)

    // EIN Klick weitet auf alle Ebenen: Bund-Treffer (OR) erscheinen.
    await chip(page).click()
    await expect(chip(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(scopeZeile(page)).toContainText('Filtert: alle Ebenen')
    await expect(main.getByRole('heading', { name: /^Bund/ })).toBeVisible()
    await expect(main.getByRole('link', { name: /Obligationenrecht/ }).first()).toBeVisible()

    // Zurück-Engen (Toggle, aria-pressed): wieder Kanton-Scope + Lücken-Hinweis.
    await chip(page).click()
    await expect(chip(page)).toHaveAttribute('aria-pressed', 'false')
    await expect(scopeZeile(page)).toContainText('Filtert: Kanton Zürich')
    await expect(main.getByText(/in diesem Kanton erfasst/)).toBeVisible()
    expect(fehler).toEqual([])
  })
})

test.describe('IA-4 · Perf/CLS (§11.6.5) + Mobil (§11.6.9)', () => {
  test('CLS 0 unter CPU-Throttle 6× — Chip-Toggle (weiten + engen) ist shift-frei', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 6 })

    await page.goto('/gesetze?ebene=kanton&kt=ZH')
    await expect(scopeZeile(page)).toBeVisible({ timeout: 20_000 })

    // Beobachter NACH der eingeschwungenen Ergebnisliste installieren — gemessen
    // werden die CHIP-Interaktionen (IA-4-Fläche). Der Ergebnis-Einschwung des
    // TIPPENS selbst shiftet den Footer unter Throttle 6× auch OHNE IA-4
    // identisch (Nullprobe 25.7.2026 gegen den Vorher-Build: FOOTER 0.0496
    // vorher vs. 0.0463 nachher, Quelle = Ergebnis-Swap der Suche, nicht
    // Label/Chip) — diese vorbestehende Fläche gehört nicht zu dieser Einheit.
    await feld(page).fill('Obligationenrecht')
    await expect(page.getByRole('main').getByText(/in diesem Kanton erfasst/)).toBeVisible({ timeout: 15_000 })
    await page.evaluate(() => {
      (window as unknown as { __cls: number }).__cls = 0
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as PerformanceEntry[]) {
          const s = e as unknown as { value: number; hadRecentInput: boolean }
          if (!s.hadRecentInput) (window as unknown as { __cls: number }).__cls += s.value
        }
      }).observe({ type: 'layout-shift' })
    })

    await chip(page).click()
    await expect(page.getByRole('main').getByRole('heading', { name: /^Bund/ })).toBeVisible({ timeout: 15_000 })
    await chip(page).click()
    await expect(page.getByRole('main').getByText(/in diesem Kanton erfasst/)).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(600)

    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
    expect(cls, 'Layout-Shift (input-frei) am Scope-Feld').toBe(0)

    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    expect(fehler).toEqual([])
  })

  test('Mobil @390: Label + Chip im Layout, kein H-Overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze?ebene=kanton&kt=ZH')
    await expect(scopeZeile(page)).toContainText('Filtert: Kanton Zürich')
    await expect(chip(page)).toBeVisible()
    const b = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    expect(b.scroll, `scrollWidth ${b.scroll} > ${b.client}`).toBeLessThanOrEqual(b.client + 1)
  })
})
