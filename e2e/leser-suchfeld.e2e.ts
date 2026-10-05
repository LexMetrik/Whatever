// @shard-gruppe: nacht
// W2·17-UI-BEFUNDE · Suchfeld des Gesetzesleser (2.10.2026), drei Befunde:
//
//  C1-B01  Enter sucht mit dem AKTUELLEN Feldinhalt. Die Trefferliste hängt an
//          einem 200-ms-entprellten Begriff; Enter, bevor die Entprellung
//          durch ist, lief gegen den ALTEN Begriff (oder, bei leerem alten
//          Begriff, gegen nichts — die Taste tat dann gar nichts).
//  C2-B01  ⌘K/Ctrl+K und «/» ziehen den Fokus nicht aus einem offenen modalen
//          Dialog in ein Feld dahinter (WCAG 2.4.3; dasselbe Prinzip wie F6 in
//          `Shell.tsx` und Guard 3 in `LeserTastatur`).
//  C2-B02  dasselbe beim ZWEITEN Empfänger des Kürzels, dem Feld der Kopfleiste
//          (`HeaderSuche`): hinter der Navigations-Schublade nahm es den Fokus.
//
// «Tippen + Enter» geschieht in EINEM Browser-Task (`tippeUndEnter`): Playwrights
// `fill` und `press` sind zwei Protokoll-Schritte, dazwischen verstreicht die
// Zeit, die der Befund ausmacht, bei einer schnellen Maschine gerade nicht.
//
// ROT ZU BEKOMMEN (§6.7, gemessen 2.10.2026 am Stand vor dem Fix): (a) scrollY
// bleibt 0 — Enter war wirkungslos; (b) das Ziel-Blink-Element ist ein Artikel
// des ALTEN Begriffs; (c) und (d) der Fokus liegt auf dem Feld hinter dem Dialog.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const suchFeld = (page: Page) => page.locator('[data-v3-suchsprung] input')

async function oeffneStPO(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/STPO')
  await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
  await expect(suchFeld(page)).toBeVisible({ timeout: 20_000 })
}

/** Setzt den Feldwert und drückt Enter im SELBEN Task — kein 200-ms-Fenster. */
async function tippeUndEnter(page: Page, wort: string) {
  await page.evaluate((w) => {
    const i = document.querySelector<HTMLInputElement>('[data-v3-suchsprung] input')!
    i.focus()
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(i, w)
    i.dispatchEvent(new Event('input', { bubbles: true }))
    i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  }, wort)
}

test.describe('C1-B01 — Enter sucht mit dem aktuellen Feldinhalt', () => {
  test('(a) Enter VOR Ablauf der Entprellung springt trotzdem zur ersten Fundstelle', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await oeffneStPO(page)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)

    await tippeUndEnter(page, 'Entschädigung')

    // Vorher: kein Sprung, nie (die Liste kannte den Begriff noch nicht, `hatTreffer`
    // war false, Enter tat nichts).
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeGreaterThan(200)
    await expect(page.locator('.lc-ziel-blink')).toHaveCount(1)
    expect(fehler).toEqual([])
  })

  test('(b) Enter nach Begriffswechsel springt in eine Fundstelle des NEUEN Begriffs', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await oeffneStPO(page)

    // Erster Begriff: sitzt (entprellt durch, die Liste steht), Enter springt.
    await suchFeld(page).fill('Entschädigung')
    await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(500)
    await suchFeld(page).press('Enter')
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeGreaterThan(200)
    await page.waitForTimeout(500)
    await page.evaluate(() => window.scrollTo(0, 0))

    // Zweiter Begriff und Enter im selben Task: der alte Begriff ist noch der
    // entprellte. Das Ziel muss ein Artikel mit dem NEUEN Begriff sein.
    await tippeUndEnter(page, 'Verteidigung')
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeGreaterThan(200)
    const ziel = await page.evaluate(() => {
      const art = document.querySelector('.lc-ziel-blink')
      return { id: art?.id ?? null, text: art?.textContent ?? '' }
    })
    expect(ziel.id, 'kein Ziel-Artikel markiert').not.toBeNull()
    expect(ziel.text, `Ziel ${ziel.id} enthält den NEUEN Begriff nicht — Enter suchte mit dem alten`)
      .toMatch(/Verteidigung/i)
    expect(fehler).toEqual([])
  })
})

test.describe('Aktive Fundstelle — eigener Highlight', () => {
  const aktivLage = (page: Page) => page.evaluate(() => {
    const reg = (globalThis as unknown as { CSS: { highlights: Map<string, Iterable<Range>> } }).CSS.highlights
    const aktiv = [...(reg.get('lc-such-aktiv') ?? [])]
    const treffer = [...(reg.get('lc-such-treffer') ?? [])]
    const a = aktiv[0]
    const im = a ? treffer.some((t) => t.compareBoundaryPoints(Range.START_TO_START, a) === 0
      && t.compareBoundaryPoints(Range.END_TO_END, a) === 0) : false
    return { anzahl: aktiv.length, text: a?.toString() ?? null, trefferAnzahl: treffer.length, ImTrefferSatz: im,
      y: a ? Math.round(a.getBoundingClientRect().top + window.scrollY) : null }
  })

  test('(e) Enter markiert genau EINE aktive Stelle, Weiter wechselt sie, ein neuer Begriff räumt sie', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await oeffneStPO(page)
    await suchFeld(page).fill('Verteidigung')
    await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 15_000 })
    await suchFeld(page).press('Enter')
    await expect.poll(async () => (await aktivLage(page)).anzahl, { timeout: 10_000 }).toBe(1)
    const eins = await aktivLage(page)
    expect(eins.text?.toLowerCase()).toBe('verteidigung')
    expect(eins.ImTrefferSatz, 'die aktive Stelle ist eine Stelle der normalen Treffer-Menge (nur umgefärbt)').toBe(true)
    expect(eins.trefferAnzahl, 'die Treffer-Menge bleibt gemalt').toBeGreaterThanOrEqual(1)

    await suchFeld(page).press('Enter')
    await expect.poll(async () => (await aktivLage(page)).y, { timeout: 10_000 }).not.toBe(eins.y)
    expect((await aktivLage(page)).anzahl).toBe(1)

    await suchFeld(page).fill('Entschädigung')
    await expect.poll(async () => (await aktivLage(page)).anzahl, { timeout: 10_000 }).toBe(0)
    expect(fehler).toEqual([])
  })
})

/** Fokus-Lage: liegt der Fokus noch im offenen modalen Dialog? */
const fokusImDialog = (page: Page) => page.evaluate(() => {
  const dlg = document.querySelector('[role="dialog"][aria-modal="true"]')
  const a = document.activeElement
  return { dialog: dlg?.getAttribute('aria-label') ?? null, drin: !!(dlg && a && dlg.contains(a)) }
})

test.describe('C2-B01 / C2-B02 — das Such-Kürzel respektiert den modalen Dialog', () => {
  test('(c) Leser: Ctrl+K und «/» lassen den Fokus im offenen Kurzbefehle-Dialog', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await oeffneStPO(page)
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('?')
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible()
    expect((await fokusImDialog(page)).drin, 'Ausgangslage: Fokus im Dialog').toBe(true)

    await page.keyboard.press('Control+k')
    await page.keyboard.press('/')

    const lage = await fokusImDialog(page)
    expect(lage.drin, `Fokus hat den Dialog «${lage.dialog}» verlassen (hinter dem Dialog liegt das Suchfeld)`).toBe(true)
    await expect(suchFeld(page)).not.toBeFocused()

    // Gegenprobe: ohne Dialog gilt das Kürzel weiter.
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0)
    await page.keyboard.press('Control+k')
    await expect(suchFeld(page)).toBeFocused()
    expect(fehler).toEqual([])
  })

  test('(d) Kopfleisten-Suche: Ctrl+K lässt den Fokus in der Navigations-Schublade', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/gesetze')
    await expect(page.getByRole('button', { name: /Navigation|Menü/i }).first()).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: /Navigation|Menü/i }).first().click()
    await expect(page.locator('[role="dialog"][aria-modal="true"][aria-label="Navigation"]')).toBeVisible()

    await page.keyboard.press('Control+k')
    await page.keyboard.press('/')

    const lage = await fokusImDialog(page)
    expect(lage.drin, `Fokus hat den Dialog «${lage.dialog}» verlassen`).toBe(true)
    expect(fehler).toEqual([])
  })
})
