// @shard-gruppe: 1
// Klickbare Besetzung im Entscheid-Leser (Richter:in → ihre übrigen Entscheide).
//
// Prüft gegen den ECHTEN Korpus, dass der amtliche Besetzungs-Freitext eines
// Entscheids die RICHTERLICHEN Mitwirkenden als Links auf `?richter=<slug>`
// führt, den Wortlaut dabei nicht verändert, und Gerichtsschreiber:innen NICHT
// verlinkt (die Facette trifft nur richterliche Mitwirkung — ein GS-Link liefe
// ins Leere).
//
// Fixture (am Korpus verifiziert 20.7.2026, `public/rechtsprechung/register.json`
// + `richter.json`): Appellationsgericht BS VD.2025.147
//   «Dr. Stephan Wullschleger, Dr. Claudius Gelzer, Prof. Dr. Daniela Thurnherr
//    Keller und Gerichtsschreiber MLaw Damian Wyss»
//   → Richter: wullschleger-stephan (692 Entscheide) · gelzer-claudius (486) ·
//     thurnherr-keller-daniela (169); Gerichtsschreiber: wyss-damian (0 als
//     Richter → im Register geführt, in der Facette NICHT filterbar).
import { test, expect, type Page, type TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { clsBeobachtenInstallieren, clsAuslesen } from './helpers/cls'

const ENTSCHEID = '/rechtsprechung/bs_appellationsgericht_VD.2025.147'
const FREITEXT =
  'Dr. Stephan Wullschleger, Dr. Claudius Gelzer, Prof. Dr. Daniela Thurnherr Keller und Gerichtsschreiber MLaw Damian Wyss'

/** Die <dd>-Zelle der Rubrum-Zeile «Besetzung». */
function besetzungZelle(page: Page) {
  return page.locator('dt', { hasText: /^Besetzung$/ }).first().locator('+ dd')
}

async function oeffne(page: Page) {
  await page.goto(ENTSCHEID)
  await expect(besetzungZelle(page)).toBeVisible({ timeout: 20000 })
}

test.describe('Entscheid-Leser — klickbare Besetzung', () => {
  test('zeigt die Richter:innen als Links und führt zu ihren übrigen Entscheiden', async ({ page }) => {
    await oeffne(page)
    const zelle = besetzungZelle(page)

    // (1) Der amtliche Wortlaut steht UNVERÄNDERT und ungekürzt da (§8).
    expect((await zelle.innerText()).replace(/\s+/g, ' ').trim()).toBe(FREITEXT)

    // (2) Genau die drei richterlichen Mitwirkenden sind Links, mit dem Kanon-Slug.
    const linkTexte = await zelle.locator('a').allInnerTexts()
    expect(linkTexte.map((t) => t.trim())).toEqual([
      'Stephan Wullschleger', 'Claudius Gelzer', 'Daniela Thurnherr Keller',
    ])
    await expect(zelle.getByRole('link', { name: 'Stephan Wullschleger' }))
      .toHaveAttribute('href', '/rechtsprechung?richter=wullschleger-stephan')
    await expect(zelle.getByRole('link', { name: 'Claudius Gelzer' }))
      .toHaveAttribute('href', '/rechtsprechung?richter=gelzer-claudius')
    await expect(zelle.getByRole('link', { name: 'Daniela Thurnherr Keller' }))
      .toHaveAttribute('href', '/rechtsprechung?richter=thurnherr-keller-daniela')

    // (3) Der Klick landet auf der Facette, und die Liste zeigt WIRKLICH die
    //     Entscheide dieser Person (Aktiv-Chip + echter Ergebnis-Zähler).
    await zelle.getByRole('link', { name: 'Claudius Gelzer' }).click()
    await expect(page).toHaveURL(/\/rechtsprechung\?richter=gelzer-claudius/)
    await expect(page.getByRole('button', { name: /Richter-Filter .*Gelzer.* entfernen/ })).toBeVisible()
    const treffer = Number(
      (await page.getByText(/^[\d'’\u00A0\u202F]+\s+Entscheide?$/).first().innerText()).replace(/\D+/g, ''),
    )
    expect(treffer).toBeGreaterThan(100)

    // Und der erste Treffer führt die Person tatsächlich in seiner Besetzung.
    await page.locator('a[href^="/rechtsprechung/"]').first().click()
    await expect(besetzungZelle(page)).toContainText('Gelzer', { timeout: 20000 })
  })

  test('verlinkt Gerichtsschreiber:innen NICHT (Facette führt sie nicht)', async ({ page }) => {
    await oeffne(page)
    const zelle = besetzungZelle(page)
    // Der Name steht im Wortlaut …
    await expect(zelle).toContainText('Damian Wyss')
    // … aber er ist KEIN Link — die Achse ?richter= trifft nur richterliche
    // Mitwirkung, ein Link auf einen reinen Gerichtsschreiber-Slug führte auf
    // eine leere Liste (§8: lieber Text als ein Link ins Leere).
    await expect(zelle.getByRole('link', { name: /Wyss/ })).toHaveCount(0)
    await expect(zelle.locator('a')).toHaveCount(3)
    // Auch die Rollen-/Titel-Wörter selbst sind nie Links.
    await expect(zelle.getByRole('link', { name: /Gerichtsschreiber|MLaw|Prof\.|Dr\./ })).toHaveCount(0)
  })

  test('a11y: keine critical/serious-Verstösse im Rubrum', async ({ page }, testInfo: TestInfo) => {
    // Theme deterministisch pinnen (sonst misst axe je nach Uhrzeit hell/dunkel).
    await page.addInitScript(() => {
      try { localStorage.setItem('lexmetrik-thema', 'hell') } catch { /* privater Modus */ }
    })
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
    await oeffne(page)
    const ergebnis = await new AxeBuilder({ page })
      .include('dl')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // `link-in-text-block` gatet mit (damals abgeschaltet als Markenentscheid B-2;
      // seit R3-Nachzug 6.9.2026 sind Inline-Links unterstrichen, DESIGN-REGLEMENT F0.8).
      .analyze()
    const schwer = ergebnis.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    if (ergebnis.violations.length > 0) {
      await testInfo.attach('besetzung-links-befunde.json', {
        body: JSON.stringify(ergebnis.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help })), null, 2),
        contentType: 'application/json',
      })
    }
    expect(schwer.map((v) => `${v.id} (${v.impact}): ${v.help}`),
      'axe Rubrum mit Besetzungs-Links: keine critical/serious-Verstösse').toEqual([])

    // F3: der Fokus ist sichtbar (globaler :focus-visible-Outline greift auch hier).
    const ersterLink = besetzungZelle(page).locator('a').first()
    await ersterLink.focus()
    const outline = await ersterLink.evaluate((el) => getComputedStyle(el).outlineWidth)
    expect(parseFloat(outline)).toBeGreaterThan(0)
  })

  test('kein Lade-Shift: die Besetzungs-Links wachsen nicht nach (§15.2)', async ({ page }) => {
    // Die Slugs kommen aus dem Manifest-Eintrag, der im SELBEN Lade-Schritt wie der
    // Snapshot gesetzt wird — das Rubrum erscheint also fertig verlinkt, nie erst
    // als Text und dann als Link. Unter 6×-Drossel gemessen.
    await clsBeobachtenInstallieren(page, true)
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 6 })
    await page.goto(ENTSCHEID)
    await expect(besetzungZelle(page).locator('a')).toHaveCount(3, { timeout: 30000 })
    await page.waitForTimeout(1200)
    const { cls, bericht } = await clsAuslesen(page)
    expect(cls, `CLS ${cls} — ${bericht}`).toBeLessThan(0.05)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  })

  test('mobil @390: kein horizontaler Overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await oeffne(page)
    await expect(besetzungZelle(page).locator('a')).toHaveCount(3)
    const ueber = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(ueber, 'kein horizontaler Overflow @390').toBeLessThanOrEqual(1)
  })
})
