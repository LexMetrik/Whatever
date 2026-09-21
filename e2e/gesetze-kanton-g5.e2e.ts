// @shard-gruppe: 1
// Gesetzes-UX G5 (§4.3) — Kantons-Seite entrümpelt: Kontext-Zeile, Karte default,
// Sortierung (Alphabet/Erlass-Zahl/Region), Roh-Code→Klartext, Mobil-Vollnamen.
// Reine Darstellung (§3); läuft gegen `vite preview` (dist).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

async function keinOverflow(page: Page) {
  const b = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  expect(b.scroll, `scrollWidth ${b.scroll} > ${b.client}`).toBeLessThanOrEqual(b.client + 1)
}

test.describe('Kantons-Übersicht (G5 · §4.3)', () => {
  test('§4.3.1 Kontext-Zeile erklärt die Mengen-Asymmetrie (§8)', async ({ page }) => {
    await page.goto('/gesetze?ebene=kanton')
    await expect(page.getByText(/nicht die\s+vollständige kantonale Gesetzessammlung/i)).toBeVisible()
  })

  test('§4.3.3 Karte ist default sichtbar; Liste ist der gleichwertige Einstieg', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze?ebene=kanton')
    const main = page.getByRole('main')
    // Karte ohne Klick sichtbar (früher zugeklapptes <details>).
    await expect(main.getByRole('group', { name: /Karte der Schweizer Kantone/ })).toBeVisible()
    // Umschalten auf «Liste» → Auswahlraster.
    await main.getByRole('group', { name: 'Ansicht' }).getByRole('button', { name: 'Liste' }).click()
    await expect(main.getByRole('button', { name: /Zürich/ })).toBeVisible()
    // Zurück auf «Karte».
    await main.getByRole('group', { name: 'Ansicht' }).getByRole('button', { name: 'Karte' }).click()
    await expect(main.getByRole('group', { name: /Karte der Schweizer Kantone/ })).toBeVisible()
    expect(fehler).toEqual([])
  })

  // Fehlerbuch-Befund 41 (Prüfung 29.8.2026): «Karte/Umschalter weg nach Wahl».
  // Der Umschalter lebt naturgemäss nur in der Übersicht — sie unmountet, sobald
  // ein Kanton gewählt ist. Was daran wirklich stört, ist der Verlust der WAHL:
  // Wer über die Liste einstieg, landete auf dem Rückweg «← Alle Kantone» wieder
  // auf der Karte. Rot-Beweis 29.8.2026 vor dem Fix (Playwright, dev-Server):
  // «nach Rückweg — Karte gedrückt: true | Liste gedrückt: false».
  test('§4.3.3 Die Ansicht-Wahl überlebt die Kantons-Wahl (Fehlerbuch 41)', async ({ page }) => {
    await page.goto('/gesetze?ebene=kanton')
    const main = page.getByRole('main')
    const ansicht = () => main.getByRole('group', { name: 'Ansicht' })
    await ansicht().getByRole('button', { name: 'Liste' }).click()
    await expect(ansicht().getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'true')
    // Kanton wählen → Detailsicht, Übersicht (samt Umschalter) unmountet.
    await main.getByRole('button', { name: /Zürich/ }).first().click()
    await expect(main.getByRole('button', { name: /Alle Kantone/ })).toBeVisible()
    await expect(ansicht()).toHaveCount(0)
    // Rückweg: die zuvor gewählte Sicht steht wieder da, nicht der Default.
    await main.getByRole('button', { name: /Alle Kantone/ }).click()
    await expect(ansicht().getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'true')
    await expect(ansicht().getByRole('button', { name: 'Karte' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('§4.3.2 Sortierung Alphabet/Erlass-Zahl/Region; Region gruppiert nach Grossregion', async ({ page }) => {
    await page.goto('/gesetze?ebene=kanton')
    const main = page.getByRole('main')
    await main.getByRole('group', { name: 'Ansicht' }).getByRole('button', { name: 'Liste' }).click()
    const sort = main.getByRole('group', { name: 'Sortierung' })
    await expect(sort.getByRole('button', { name: 'Alphabet' })).toBeVisible()
    await expect(sort.getByRole('button', { name: 'Erlass-Zahl' })).toBeVisible()
    await expect(sort.getByRole('button', { name: 'Region' })).toBeVisible()
    // Region → BFS-Grossregionen als Zwischenüberschriften.
    await sort.getByRole('button', { name: 'Region' }).click()
    await expect(main.getByRole('heading', { name: 'Ostschweiz' })).toBeVisible()
    await expect(main.getByRole('heading', { name: 'Genferseeregion' })).toBeVisible()
  })

  test('§4.3.5 Roh-Code→Klartext: ZH zeigt amtliche Ordner-Namen, nicht «Bereich LS»', async ({ page }) => {
    // Fachliche Aenderung 1.9.2026 (§6.3, deklariert): Die ZH-Kern-Tranche
    // liefert den amtlichen 14-Ordner-Baum (zh-systematik.ts) — der ehrliche
    // Zustand ist seither der Ordner-Name, nicht mehr «Nicht systematisiert».
    // Die AUSSAGE des Tests (kein Sammlungs-Kuerzel als vermeintliches
    // Sachgebiet + Roh-Code je Erlass sichtbar, §8) ist unveraendert.
    await page.goto('/gesetze?ebene=kanton&kt=ZH')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/Gerichtsorganisation - Zivilrecht/).first()).toBeVisible()
    // Kein Sammlungs-Kürzel als vermeintliches Sachgebiet.
    await expect(page.getByText(/Bereich LS/)).toHaveCount(0)
    // Der Roh-Code bleibt je Erlass an der systematischen Nummer sichtbar (§8) —
    // nach dem Aufklappen der Kategorie.
    await page.getByRole('button', { name: 'Alle aufklappen' }).click()
    await expect(page.getByText(/LS\s*243|LS\s*211/).first()).toBeVisible()
  })

  test('§4.3.5 AR: kein «Bereich bGS»-Leck (amtliche Sachgebiete bleiben benannt)', async ({ page }) => {
    await page.goto('/gesetze?ebene=kanton&kt=AR')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/Bereich bGS/)).toHaveCount(0)
  })

  test('§4.3.6 Mobil 390: kein H-Overflow, Karte- und Listen-Sicht', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze?ebene=kanton')
    const main = page.getByRole('main')
    await expect(main.getByRole('group', { name: /Karte der Schweizer Kantone/ })).toBeVisible()
    await keinOverflow(page)
    await main.getByRole('group', { name: 'Ansicht' }).getByRole('button', { name: 'Liste' }).click()
    await expect(main.getByRole('button', { name: /Basel-Landschaft/ })).toBeVisible()
    await keinOverflow(page)
  })
})
