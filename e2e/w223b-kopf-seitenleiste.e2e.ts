// @shard-gruppe: nacht
// ── Kopf- und Seitenleiste nach W2·23-STARTSEITE-V4 §6 (Arbeitspaket B) ──────
//
// Drei Zusagen, je mit Gegenprobe (§6.7 — ein Fall, der nicht rot werden kann,
// ist keiner):
//   §6.1  Der Streifen trägt auf JEDER Route dasselbe Suchfeld — auch auf «/».
//         «/» und ⌘K fokussieren es, und der Streifen springt beim
//         Routenwechsel nicht.
//         ── DEKLARIERTE TEST-ÄNDERUNG (§6.3, W2·24-R5-F1C, David D18,
//         6.9.2026): «insgesamt braucht es auf der startseite keine suche. nur
//         oben reicht». §6.1 hiess bis hierher das Gegenteil (auf «/» KEIN
//         Kopf-Feld, der Hero trug die Suche). Gedreht ist die Richtung, nicht
//         der Umfang: dieselben vier Fälle, dieselben Zusagen — genau EIN
//         Suchfeld auf «/», die Kürzel treffen es, der Streifen springt nicht.
//         D17 kommt dazu: die Seitenleiste steht jetzt auch auf «/».
//   §6.2  Der Schriftregler «Ganze Seite» steht auf /einstellungen und wirkt
//         dort — im Streifen steht er nicht mehr.
//   §6.3  Die Seitenleiste trägt den Korpus-Stand-Fuss, auf Desktop wie in der
//         mobilen Schublade.
import { test, expect, type Page } from '@playwright/test'
import { seitenleisteOeffnen, seitenleistenSchalter } from './helpers/seitenleiste'

const kopfFeld = (page: Page) => page.locator('header.sticky input[type="search"]')

test.describe('§6.1 · Der Streifen trägt die eine Suche — auf jeder Route', () => {
  // ROT ZU BEKOMMEN: in `Topbar.tsx` die HeaderSuche wieder hinter
  // `{!aufStartseite && …}` legen ⇒ «/» trägt kein Kopf-Feld mehr.
  test('«/» und /gesetze tragen dasselbe eine Kopf-Feld', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header.sticky')).toBeVisible({ timeout: 20_000 })
    await expect(kopfFeld(page)).toHaveCount(1)
    // Und kein zweites daneben — die Startseite hat seit D18 keine eigene Suche.
    await expect(page.locator('[role="search"] input')).toHaveCount(1)

    await page.goto('/gesetze')
    await expect(kopfFeld(page)).toHaveCount(1)
  })

  test('«/» und ⌘K fokussieren auf «/» das Kopf-Feld', async ({ page }) => {
    await page.goto('/')
    const feld = kopfFeld(page)
    await expect(feld).toBeVisible({ timeout: 20_000 })

    await page.keyboard.press('/')
    await expect(feld).toBeFocused()
    expect(await feld.evaluate((el) => el.closest('header') !== null)).toBe(true)

    // Feld verlassen, dann Ctrl-K — beide Kürzel führen zum selben Feld.
    await page.getByRole('link', { name: 'Zum Inhalt springen' }).focus()
    await page.keyboard.press('Control+k')
    await expect(feld).toBeFocused()
  })

  // Der Alltagsweg ist der SPA-Wechsel (Klick auf «Start»), nicht das Neuladen.
  // ROT ZU BEKOMMEN: s. o. — nach dem Wechsel stünde auf «/» kein Feld mehr.
  test('Auch nach dem SPA-Wechsel auf «/» steht das Feld', async ({ page }) => {
    await page.goto('/gesetze')
    await expect(kopfFeld(page)).toHaveCount(1)
    // D25 (deklariert, §6.3): die Leiste startet eingeklappt — der SPA-Wechsel
    // über ihren «Start»-Eintrag verlangt darum, sie zuerst einzublenden.
    await seitenleisteOeffnen(page)
    await page.locator('aside[data-app-seitenleiste]').getByRole('link', { name: 'Start', exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(kopfFeld(page)).toHaveCount(1)
    await page.keyboard.press('/')
    await expect(kopfFeld(page)).toBeFocused()
  })

  // §6.1 «Layout darf nicht springen»: die Werkzeug-Gruppe endet rechts auf «/»
  // an derselben Kante wie auf /gesetze.
  // ROT ZU BEKOMMEN: in `Shell.tsx` die Seitenleiste auf «/» wieder weglassen
  // ⇒ die rechte Spalte ist dort breiter und die Kante wandert.
  test('Der Streifen springt beim Routenwechsel nicht', async ({ page }) => {
    const kante = async () => {
      const box = await page.locator('header.sticky button[aria-label^="Farbschema"]').first().boundingBox()
      return Math.round(box!.x)
    }
    await page.goto('/gesetze')
    await expect(page.locator('header.sticky')).toBeVisible({ timeout: 20_000 })
    const mitFeld = await kante()
    await page.goto('/')
    await expect(page.locator('header.sticky')).toBeVisible({ timeout: 20_000 })
    expect(Math.abs((await kante()) - mitFeld)).toBeLessThanOrEqual(2)
  })

  // ── D17 (David 6.9.2026): «ich mochte die seitenleiste. können wir die
  // behalten. und das oben entfernen?» ─────────────────────────────────────
  // ROT ZU BEKOMMEN: in `Shell.tsx` `pathname === '/'` wieder von der
  // Seitenleiste ausnehmen bzw. den Bereichs-Nav in `Topbar.tsx` zurückholen.
  // ── D25-NACHZUG (deklariert, §6.3) ───────────────────────────────────────
  // Die Leiste steht seit D25 nicht mehr von selbst offen; sie ist ÜBERALL
  // erreichbar — auch auf «/». Genau das prüft der Fall jetzt: erst ist sie
  // weg (Vorgabe), nach dem Schalter steht sie. D17 verlangte «auf / gibt es
  // sie», nicht «auf / steht sie offen»; die Zusage wird damit nicht
  // abgeschwächt, sondern um die neue Vorgabe ergänzt.
  test('D17 · Die Seitenleiste steht auch auf «/», und das Titelblatt trägt keine Bereichs-Reiter', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    // D25 · Vorgabe: eingeklappt, auch auf «/».
    await expect(seitenleistenSchalter(page)).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('aside[data-app-seitenleiste]')).toHaveCount(0)
    await seitenleisteOeffnen(page)
    await expect(page.locator('aside[data-app-seitenleiste]')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('banner').getByRole('navigation', { name: 'Bereiche' })).toHaveCount(0)
    // Der Bereichs-Reiter «Sammlung» ist ersatzlos weg — die Marke ist der Weg
    // zur Startseite (David D13/D17).
    await expect(page.getByRole('banner').getByRole('link', { name: 'Sammlung', exact: true })).toHaveCount(0)
    await expect(page.getByRole('banner').getByRole('link', { name: /LexMetrik – Startseite/ })).toHaveCount(1)
  })
})

test.describe('§6.2 · Der Schriftregler steht auf /einstellungen', () => {
  const regler = (page: Page) => page.getByRole('group', { name: 'Schriftgrösse der ganzen Seite' })

  // ROT ZU BEKOMMEN: den Regler-Block in `pages/Einstellungen.tsx` entfernen.
  test('/einstellungen trägt ihn und er skaliert die Wurzel-Schrift', async ({ page }) => {
    await page.goto('/einstellungen')
    await expect(regler(page)).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Ganze Seite vergrössern' })).toBeVisible()
    await page.getByRole('button', { name: 'Ganze Seite vergrössern' }).click()
    // 100 % → 110 %: sichtbarer Wert UND Wurzel-Schriftgrösse ziehen mit.
    await expect(regler(page)).toContainText('110 %')
    expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('110%')
  })

  // ROT ZU BEKOMMEN: den Block wieder in `Topbar.tsx` einsetzen.
  test('Der Streifen trägt ihn nicht mehr (auch nicht auf breitem Schirm)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze')
    await expect(page.locator('header.sticky')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('banner').getByRole('group', { name: 'Schriftgrösse der ganzen Seite' })).toHaveCount(0)
  })
})

test.describe('§6.3 · Die Seitenleiste nennt den Stand des Korpus', () => {
  // ROT ZU BEKOMMEN: den <KorpusStand>-Fuss in `Sidebar.tsx` entfernen.
  //
  // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3, W2·24-R5-F1, David-Befund D8) ─────────
  // Der Fuss nannte drei Mal das BUILD-Datum unter der Überschrift «Register
  // erzeugt» — David 6.9.2026: irreführend, das ist nicht das Alter der
  // Inhalte. `ui/KorpusStand` führt seither zuerst «Jüngster Eintrag: Gesetze
  // Stand … · Entscheide … · Materialien …» (buildseitig aus denselben
  // Registern, `gen:zaehler`) und das Build-Datum klein als «Register erzeugt
  // am …». Damit heisst die mittlere Sammlung in dieser Zeile «Entscheide»
  // (das Datum ist ein Entscheiddatum, kein Stand der Rechtsprechung als
  // Ganzes) — die Erwartung «Rechtsprechung» wird deshalb nachgeführt, und die
  // §8-Gegenprobe wird SCHÄRFER statt schwächer: die Zeile muss beide
  // Angaben führen und die Vermischung weiterhin ausschliessen.
  test('Desktop-Leiste: Fuss nennt jüngsten Eintrag UND Erzeugungsdatum', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze')
    await seitenleisteOeffnen(page) // D25 (deklariert, §6.3): Vorbedingung
    const fuss = page.locator('aside[data-app-seitenleiste] nav p', { hasText: 'Register erzeugt' })
    await expect(fuss).toBeVisible({ timeout: 20_000 })
    await expect(fuss).toContainText('Jüngster Eintrag')
    await expect(fuss).toContainText('Gesetze')
    await expect(fuss).toContainText('Entscheide')
    await expect(fuss).toContainText('Materialien')
    // §8: das Build-Datum bleibt sichtbar, aber als das benannt, was es ist.
    await expect(fuss).toContainText('Register erzeugt am')
    await expect(fuss).not.toContainText('Stand der Rechtsprechung')
  })

  test('Mobile Schublade @390 trägt denselben Fuss', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze')
    await page.getByRole('button', { name: 'Navigation öffnen' }).click()
    const schublade = page.getByRole('dialog', { name: 'Navigation' })
    await expect(schublade).toBeVisible({ timeout: 20_000 })
    await expect(schublade.locator('p', { hasText: 'Register erzeugt' })).toBeVisible()
  })
})
