// @shard-gruppe: 5
// ─── W2·17-UI-BEFUNDE · Zwei-Fenster-Ansicht (Split-Pane) des Gesetzeslesers ───
//
// Fünf Befunde, die nur im echten Browser sichtbar sind (Fokus, Tastatur,
// gemessene Geometrie). Die rein rechnenden Teile stehen in
// `src/tests/leser-split-w217.test.ts`.
//
//  F1-B01  «r» im Split bedient das Pane, in dem der Leser arbeitet — nicht blind
//          das primäre. GEMESSEN am gebauten Stand (@1600, Blatt des sekundären
//          Panes offen, Fokus darin, «r»): das primäre Blatt ging ZUSÄTZLICH auf.
//          Ursache: das Blatt liegt per Portal in der Overlay-Schicht und damit
//          ausserhalb von `[data-pane]`; die Auflösung sah «kein Pane» ⇒ primär.
//  F1-B02  Esc schliesst nur das Blatt des aktiven Panes. GEMESSEN: bei zwei
//          offenen Blättern nahm EIN Esc beide weg, der Fokus landete danach im
//          Öffner des zuerst geöffneten (falsches Fenster).
//  F1-B03  «Hauptfenster schliessen» lässt den Fokus nicht auf `<body>` fallen.
//          GEMESSEN: `BODY#` nach dem Klick; die Geschwister-Wege (sekundäres ✕,
//          «zum Hauptfenster») geben ihn längst an `#inhalt` zurück.
//  F9-B02  «Daneben öffnen» erhält `?ansicht=` (Einzelmodus) in der neuen Instanz.
//  G1-B02  `--nt-stick` im breiten Pane (≥ 1024 px, Gliederung als Spalte) ist die
//          Höhe des klebenden Kopf-Blocks. GEMESSEN @2300: 100 px gegen 56 px.
//
// Aufbau des Splits über den teilbaren Layout-Link `?p=` (usePaneLayout, B-5) —
// derselbe Weg wie `leser-v3-highlight-split.e2e.ts`.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const SPLIT = `/gesetze/bund/ZGB?p=${encodeURIComponent('/gesetze/bund/OR')}#art-5`

async function oeffneSplit(page: Page, breite = 1600): Promise<void> {
  await page.setViewportSize({ width: breite, height: 900 })
  await page.goto(SPLIT)
  await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('[data-pane="primaer"] [data-v3-kopf]')).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('[data-pane="sekundaer"] [data-v3-kopf]')).toBeVisible({ timeout: 30_000 })
}

/** Blätter (Erlass-Blatt = `[data-v3-panel]`) je Pane — die Rolle steht am Portal-Wurzelelement. */
const blatt = (page: Page, rolle: 'primaer' | 'sekundaer') =>
  page.locator(`[data-v3-pane="${rolle}"] [data-v3-panel]`)

const oeffnerIn = (page: Page, rolle: 'primaer' | 'sekundaer') =>
  page.locator(`[data-pane="${rolle}"]`).getByRole('button', { name: /Erlass-Blatt/ }).first()

test.describe('W2·17 Split — Tastatur, Esc, Fokus', () => {
  test('F1-B01: «r» aus dem Blatt des sekundären Panes öffnet NICHT zusätzlich das primäre', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await oeffneSplit(page)
    await oeffnerIn(page, 'sekundaer').click()
    await expect(blatt(page, 'sekundaer')).toHaveCount(1)
    await expect(blatt(page, 'primaer')).toHaveCount(0)
    await page.keyboard.press('r')
    await page.waitForTimeout(600)
    await expect(blatt(page, 'primaer'), 'das primäre Pane hat den Tastendruck beansprucht').toHaveCount(0)
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('F1-B01: nach dem Schliessen (Fokus verloren) wirkt «r» weiter im zuletzt benutzten Pane', async ({ page }) => {
    test.slow()
    await oeffneSplit(page)
    // Im sekundären Pane arbeiten: Klick in den Text, dann Fokus fallen lassen
    // (ein Knopf verschwindet, Esc schliesst etwas — beides endet auf `<body>`).
    const sek = page.locator('[data-pane="sekundaer"]')
    const box = (await sek.boundingBox())!
    await page.mouse.click(box.x + box.width / 2, box.y + 400)
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true)
    await page.keyboard.press('r')
    await page.waitForTimeout(600)
    await expect(blatt(page, 'primaer'), '«r» wirkte im falschen (primären) Pane').toHaveCount(0)
    await expect(blatt(page, 'sekundaer'), '«r» wirkte nicht im zuletzt benutzten Pane').toHaveCount(1)
  })

  test('F1-B02: Esc schliesst nur das Blatt des aktiven Panes, der Fokus bleibt in diesem Pane', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await oeffneSplit(page)
    await oeffnerIn(page, 'primaer').click()
    await expect(blatt(page, 'primaer')).toHaveCount(1)
    await oeffnerIn(page, 'sekundaer').click()
    await expect(blatt(page, 'sekundaer')).toHaveCount(1)
    await expect(blatt(page, 'primaer'), 'das primäre Blatt muss neben dem sekundären stehen bleiben').toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(blatt(page, 'sekundaer'), 'Esc schloss das Blatt des aktiven Panes nicht').toHaveCount(0)
    await page.waitForTimeout(500)
    await expect(blatt(page, 'primaer'), 'ein Esc schloss BEIDE Blätter').toHaveCount(1)
    const fokusPane = await page.evaluate(() => {
      const a = document.activeElement
      return a?.closest('[data-pane]')?.getAttribute('data-pane') ?? a?.closest('[data-v3-pane]')?.getAttribute('data-v3-pane') ?? null
    })
    expect(fokusPane, 'der Fokus landete nicht im Pane, dessen Blatt zuging').toBe('sekundaer')
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('F1-B03: «Hauptfenster schliessen» gibt den Fokus an den Hauptinhalt, nicht an <body>', async ({ page }) => {
    test.slow()
    await oeffneSplit(page)
    await page.getByRole('button', { name: 'Hauptfenster schliessen' }).click()
    await expect(page.locator('[data-pane]')).toHaveCount(0) // ein Fenster übrig ⇒ Einzelansicht
    await expect.poll(
      () => page.evaluate(() => document.activeElement?.id ?? document.activeElement?.tagName),
      { message: 'Fokus nach «Hauptfenster schliessen»', timeout: 5_000 },
    ).toBe('inhalt')
  })
})

test.describe('W2·17 Split — «Daneben öffnen» erhält die Ansicht', () => {
  test('F9-B02: aus dem Einzelmodus (?ansicht=artikel) bleibt der Parameter in der zweiten Instanz', async ({ page }) => {
    test.slow()
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto('/gesetze/bund/OR?ansicht=artikel#art-5')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: /«OR» daneben öffnen/ }).click()
    await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 30_000 })
    const panes = await page.evaluate(() => localStorage.getItem('lexmetrik-panes') ?? '')
    expect(panes, 'die zweite Instanz verlor ?ansicht=artikel').toContain('ansicht=artikel')
    expect(panes).toContain('r=2')
  })
})

test.describe('W2·17 Split — Geometrie im breiten Pane', () => {
  test('G1-B02: --nt-stick = Höhe des klebenden Kopf-Blocks (Panes ≥ 1024 px, Gliederung als Spalte)', async ({ page }) => {
    test.slow()
    await oeffneSplit(page, 2300)
    for (const rolle of ['primaer', 'sekundaer'] as const) {
      const m = await page.evaluate((r) => {
        const pane = document.querySelector(`[data-pane="${r}"]`) as HTMLElement
        const wurzel = pane.querySelector('[data-leser-v3="rahmen"]') as HTMLElement
        const sonde = document.createElement('div')
        sonde.style.cssText = 'position:absolute;visibility:hidden;height:var(--nt-stick)'
        wurzel.appendChild(sonde)
        const stick = sonde.getBoundingClientRect().height
        sonde.remove()
        return {
          stick: Math.round(stick),
          kopf: Math.round(pane.querySelector('[data-v3-kopf]')!.getBoundingClientRect().height),
          paneBreite: Math.round(pane.getBoundingClientRect().width),
          spalte: pane.querySelector('[data-toc]') != null,
        }
      }, rolle)
      expect(m.paneBreite, `Pane ${rolle} muss breit genug für die Gliederungs-Spalte sein`).toBeGreaterThanOrEqual(1024)
      expect(m.spalte, `Pane ${rolle}: Gliederung als Spalte (Such-Zone steht in der Kopfzeile)`).toBe(true)
      expect(m.stick, `Pane ${rolle}: --nt-stick ${m.stick} px, klebender Kopf ${m.kopf} px`).toBe(m.kopf)
    }
  })
})
