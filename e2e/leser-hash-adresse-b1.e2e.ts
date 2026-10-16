// @shard-gruppe: 4
// ─── LESER-NAV Paket B1 · Adresse und Hash folgen der Navigation ───
//
//  O-67  «Art. N» im zweiten Fenster ändert die Haupt-Adresse (native Fragment-Navigation).
//        GEMESSEN 16.10.2026 (Dev-Server, headless Chromium 1600×900, visibilityState visible):
//        `/gesetze/bund/ZGB?p=%2Fgesetze%2Fbund%2FOR#art-5`, Klick auf «Art. 9» im Pane ⇒
//        Adresse `/gesetze/bund/ZGB#art-9`.
//        ROT ZU BEKOMMEN: in `parts/ArtikelLeser.tsx` das `onClick` des Kopf-Ankers streichen.
//  O-68  `document.title` bei `/rechner/zustaendigkeit#schkg|#straf` blieb «Zuständigkeit Zivilprozess».
//        ROT ZU BEKOMMEN: in `lib/seo.metaFuerPfad` `splitKarte(pfad, hash) ??` streichen.
//  O-69a /rechner/kuendigung schrieb den Hash beim inneren Reiterwechsel nicht nach.
//        ROT ZU BEKOMMEN: in `pages/RechnerKuendigung` `onChange={tabWechsel}` wieder auf `setTab`.
//  O-69b `usePaneLayout` nahm `?p=` am Router vorbei aus der Adresse ⇒ der Reiter (und «Adresse kopieren»)
//        trug den alten Layout-Link.
//        ROT ZU BEKOMMEN: in `layout/Shell.tsx` den Aufruf `usePaneLayout()` ohne Funktion.
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const SPLIT = `/gesetze/bund/ZGB?p=${encodeURIComponent('/gesetze/bund/OR')}#art-5`

test.describe('O-67 — Normlinks im Pane navigieren im Pane', () => {
  test('«Art. 9» im zweiten Fenster: Haupt-Hash bleibt, das Pane scrollt, der Layout-Link trägt die Stelle', async ({ page, context }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto(SPLIT)
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible')
    const pane = page.locator('[data-pane="sekundaer"]')
    await expect(pane.locator('[data-v3-kopf]')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-pane="primaer"] [data-v3-kopf]')).toBeVisible({ timeout: 30_000 })

    await pane.getByRole('link', { name: 'Art. 9', exact: true }).first().click()

    // Das Pane steht an Art. 9 (Oberkante im Pane-Rand), die Haupt-Adresse ist unberührt.
    await expect.poll(() => pane.evaluate((sec) => {
      const t = sec.querySelector('article#art-9') as HTMLElement | null
      if (!t) return null
      return Math.round(t.getBoundingClientRect().top - sec.getBoundingClientRect().top)
    }), { timeout: 10_000 }).toBeLessThan(300)
    expect(await pane.evaluate((sec) => {
      const t = sec.querySelector('article#art-9') as HTMLElement
      return t.getBoundingClientRect().top - sec.getBoundingClientRect().top
    })).toBeGreaterThanOrEqual(-2)
    expect(new URL(page.url()).hash, 'Haupt-Hash').toBe('#art-5')
    expect(new URL(page.url()).pathname).toBe('/gesetze/bund/ZGB')

    // Der Pane-Zustand liegt in der Pane-Location: «Layout-Link kopieren» nennt Art. 9.
    await page.getByRole('button', { name: 'Layout-Link kopieren' }).click()
    await expect(page.getByRole('button', { name: 'Layout-Link kopiert' })).toBeVisible()
    const link = new URL(await page.evaluate(() => navigator.clipboard.readText()))
    expect(link.searchParams.get('p')).toBe('/gesetze/bund/OR#art-9')
    expect(link.hash, 'Haupt-Hash im Layout-Link').toBe('#art-5')
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('Gegenprobe: im Hauptfenster bleibt der native Anker (Hash folgt dem Klick)', async ({ page }) => {
    test.slow()
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/OR#art-5')
    await expect(page.locator('article#art-5')).toBeVisible({ timeout: 30_000 })
    await page.getByRole('link', { name: 'Art. 9', exact: true }).first().click()
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#art-9')
  })
})

test.describe('O-68 — document.title folgt der Zuständigkeits-Weiche', () => {
  test('Adresse mit Hash und Wechsel von Hand', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/rechner/zustaendigkeit#schkg')
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible')
    await expect(page.locator('h1')).toContainText('Vollstreckung', { timeout: 30_000 })
    await expect(page).toHaveTitle('Zuständigkeit Vollstreckung (SchKG) — LexMetrik')
    await page.getByRole('group', { name: 'Rechtsweg' }).getByRole('button', { name: /^Straf/ }).click()
    await expect(page.locator('h1')).toContainText('Strafverfahren')
    await expect(page).toHaveTitle('Zuständigkeit Strafverfahren — LexMetrik')
    await page.getByRole('group', { name: 'Rechtsweg' }).getByRole('button', { name: /^Zivil/ }).click()
    await expect(page.locator('h1')).toContainText('Zivilprozess')
    await expect(page).toHaveTitle('Zuständigkeit Zivilprozess — LexMetrik')
    expect(fehler, fehler.join('\n')).toEqual([])
  })
})

test.describe('O-69a — /rechner/kuendigung: innerer Reiter und Hash', () => {
  const reiterWahl = (page: import('@playwright/test').Page, name: RegExp) =>
    page.getByRole('tablist', { name: 'Berechnungs-Variante' }).getByRole('tab', { name })

  test('Reiterwechsel schreibt den Hash (replace), Neuladen öffnet denselben Reiter', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/rechner/kuendigung')
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible')
    const laenge = await page.evaluate(() => history.length)
    await reiterWahl(page, /Kombiniert/).click()
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#kombiniert')
    await reiterWahl(page, /B\+C/).click()
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#kuendigung')
    await reiterWahl(page, /Lohnfortzahlung/).click()
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#lohnfortzahlung')
    expect(await page.evaluate(() => history.length), 'replace: kein History-Eintrag je Klick').toBe(laenge)

    // Der gespeicherte Reiter trägt den Hash; Neuladen und Direktaufruf öffnen den richtigen Reiter.
    await reiterWahl(page, /Kombiniert/).click()
    await expect.poll(() => page.evaluate(() => (localStorage.getItem('lexmetrik-tabs') ?? '').includes('#kombiniert'))).toBe(true)
    await page.reload()
    await expect(reiterWahl(page, /Kombiniert/)).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 })
    await page.goto('/rechner/kuendigung#kuendigung')
    await expect(reiterWahl(page, /B\+C/)).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 })
    expect(fehler, fehler.join('\n')).toEqual([])
  })
})

test.describe('O-69b — ?p= verlässt die Adresse über den Router', () => {
  test('der Reiter und «Adresse kopieren» tragen kein ?p= mehr', async ({ page, context }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto(SPLIT)
    await expect(page.locator('[data-pane="sekundaer"] [data-v3-kopf]')).toBeVisible({ timeout: 30_000 })
    expect(new URL(page.url()).search, 'Adressleiste').toBe('')
    const reiter = page.locator('[data-reiter-schluessel="/gesetze/bund/ZGB"]').first()
    await expect(reiter).toBeVisible()
    await expect.poll(async () => {
      const roh = await page.evaluate(() => localStorage.getItem('lexmetrik-tabs'))
      const eintrag = (JSON.parse(roh ?? '[]') as { path: string }[]).find((t) => t.path.startsWith('/gesetze/bund/ZGB'))
      return eintrag?.path ?? null
    }).toBe('/gesetze/bund/ZGB#art-5')
    await reiter.click({ button: 'right' })
    await page.getByRole('menuitem', { name: /Adresse kopieren/ }).click()
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(new URL('/gesetze/bund/ZGB#art-5', page.url()).href)
    expect(fehler, fehler.join('\n')).toEqual([])
  })
})
