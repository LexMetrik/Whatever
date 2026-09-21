// @shard-gruppe: 6
// ═══ W2·24 · LESER-NACHZÜGE DER GESAMTPRÜFUNG (G11 · G14 · D4) ══════════════
//
// Drei Befunde der Gesamtprüfung vom 7.9.2026, drei Wächter. Alle drei sind am
// Vorstand `72b39d50c` GEMESSEN worden, bevor gebaut wurde; die Messwerte stehen
// als Erwartung im Test und werden nie nachgeführt (§0 Ziff. 2b).
//
// ROT ZU BEKOMMEN (§6.7 — je Wächter einmal gegen den Vorstand gefahren):
//   G11  `LeserPanel.tsx`: `flex-wrap` an der Reiterzeile entfernen ⇒ @1440
//        `scrollWidth 379 > clientWidth 334`, «Anwendung» endet 39 px hinter der
//        Kante der Zeile.
//   G14  `LeserPanelOeffner.tsx` / `LeserRahmenV3.tsx` / `LeserAnsichtV3.tsx`:
//        die drei Wörter wieder hinter die `kompakt`/`mini`-Bedingung stellen ⇒
//        @390 stehen «⚖ 163» · «☰» · «···», also drei Griffe ohne ein Wort.
//   D4   `LeserAnsichtV3.tsx`: `role="menu"` wieder auf `"group"` ⇒
//        `[role=menu]` = 0, `[role=menuitemcheckbox]` = 0, ↓ bewegt den Fokus
//        nicht. ZWEITE Rot-Probe, im Bau selbst gefahren: `role="menu"` auf die
//        ganze Schwebefläche legen (erster Bau) ⇒ axe critical
//        `aria-required-children`, «children which are not allowed:
//        span[aria-live]» — die Prozent-Anzeige des Schriftreglers.
import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe.configure({ timeout: 120_000 })

const ERLASS = '/gesetze/bund/OR#art-336_c'

async function leser(page: Page, w: number, h: number, url = ERLASS): Promise<void> {
  await page.setViewportSize({ width: w, height: h })
  await page.goto(url)
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 45_000 })
  await expect(page.locator('[data-v3-kopf-griffe] button').first()).toBeVisible({ timeout: 45_000 })
  // Die Zahl am Öffner kommt aus der Zähl-Datei und trifft im Leerlauf ein;
  // erst danach steht die Breite der Griff-Zone.
  await page.waitForTimeout(1200)
}

// ═══ G11 · DAS PANEL SCHNEIDET SEINE REITERZEILE NICHT AN ═══════════════════
//
// GEMESSEN am Vorstand (OR #art-336_c, hell): @1440 UND @1024 steht das Panel
// als `'rechts'`-Blatt 336×389 px, seine Reiterzeile misst `scrollWidth 379`
// gegen `clientWidth 334`; die vier Fächer enden bei 1006 · 1103 · 1192 · 1286,
// die Zeile bei 1247 — «Anwendung» liegt also 39 px draussen, und der
// Scrollbalken ist per `[scrollbar-width:none]` unsichtbar. @390 (Bottom-Sheet)
// passte dieselbe Zeile ganz: 388/388.
test.describe('G11 — die Kontext-Reiter des Panels passen ins Blatt', () => {
  for (const [w, h] of [[1440, 900], [1024, 800], [390, 844]] as const) {
    test(`@${w}: kein Fach steht hinter der Kante`, async ({ page }) => {
      await leser(page, w, h)
      await page.locator('[data-v3-panel-oeffner]').first().click()
      await expect(page.locator('[data-v3-panel]')).toBeVisible({ timeout: 30_000 })
      const m = await page.evaluate(() => {
        const tl = document.querySelector<HTMLElement>('[role="tablist"][aria-label="Kontext-Reiter"]')!
        const kante = tl.getBoundingClientRect().right
        return {
          sw: tl.scrollWidth,
          cw: tl.clientWidth,
          kante: Math.round(kante),
          faecher: [...tl.querySelectorAll<HTMLElement>('[role="tab"]')].map((t) => ({
            l: (t.textContent ?? '').trim(),
            r: Math.round(t.getBoundingClientRect().right),
          })),
        }
      })
      expect(m.faecher.length, 'vier Kontext-Reiter').toBe(4)
      expect(m.sw, `@${w} Reiterzeile läuft über (Vorstand @1440: 379 > 334)`)
        .toBeLessThanOrEqual(m.cw + 1)
      for (const f of m.faecher) {
        expect(f.r, `«${f.l}» endet bei ${f.r}, die Zeile bei ${m.kante}`)
          .toBeLessThanOrEqual(m.kante + 1)
      }
    })
  }
})

// ═══ G14 · JEDER KOPF-GRIFF TRÄGT EIN WORT ══════════════════════════════════
//
// GEMESSEN am Vorstand @390 (STPO #art-429): «⚖ 163» · «☰» · «···» — drei
// 44-px-Zellen, keine mit einem Wort. Der Fahrplan führte das seit 18.8.2026
// selbst als offenen Punkt («≤ 2 reine Icons bleibt @390 … gerissen»).
// @320 kommt dazu, weil dort das Budget am engsten ist: die Kopfzeile misst
// innen ~280 px, die drei beschrifteten Griffe zusammen 229 px.
test.describe('G14 — die Kopfzeile @320/@390 spricht, sie zeichnet nicht', () => {
  for (const [w, h] of [[320, 800], [390, 844]] as const) {
    test(`@${w}: drei Griffe, drei Wörter, kein Anschnitt`, async ({ page }) => {
      await leser(page, w, h, '/gesetze/bund/STPO#art-429')
      const m = await page.evaluate(() => {
        const zeile = document.querySelector('[data-v3-kopf]')!.firstElementChild as HTMLElement
        const zone = document.querySelector<HTMLElement>('[data-v3-kopf-griffe]')!
        const kante = zeile.getBoundingClientRect().right
        return {
          ueberlauf: zeile.scrollWidth - zeile.clientWidth,
          kante: Math.round(kante),
          griffe: [...zone.querySelectorAll<HTMLElement>('button')].map((b) => ({
            t: (b.textContent ?? '').replace(/\s+/g, ' ').trim(),
            r: Math.round(b.getBoundingClientRect().right),
            w: Math.round(b.getBoundingClientRect().width),
          })),
        }
      })
      expect(m.griffe.length, `Griffe @${w}: ${JSON.stringify(m.griffe)}`).toBe(3)
      // DIE ZUSAGE: mindestens ein Wort je Knopf — drei Buchstaben am Stück
      // sind das Mass, an dem «···», «☰» und «⚖ 163» scheitern.
      for (const g of m.griffe) {
        expect(/[A-Za-zÄÖÜäöüß]{3,}/.test(g.t), `Griff «${g.t}» trägt kein Wort`).toBe(true)
      }
      // Und die drei Wörter stehen in EINER Zeile, ganz im Bild.
      expect(m.ueberlauf, `Kopfzeile @${w} läuft über (${m.ueberlauf} px)`).toBeLessThanOrEqual(0)
      for (const g of m.griffe) {
        expect(g.r, `Griff «${g.t}» endet bei ${g.r}, die Zeile bei ${m.kante}`)
          .toBeLessThanOrEqual(m.kante + 1)
      }
      // Kein Umbruch: alle drei stehen auf derselben Höhe.
      const hoehen = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>(
        '[data-v3-kopf-griffe] button')].map((b) => Math.round(b.getBoundingClientRect().y)))
      expect(new Set(hoehen).size, `Griff-Oberkanten: ${hoehen.join(' | ')}`).toBe(1)
    })
  }
})

// ═══ D4 · «ANSICHT» IST EIN MENÜ UND VERHÄLT SICH AUCH SO ═══════════════════
//
// GEMESSEN am Vorstand @1440: die aufgezogene Fläche trug `role="group"`,
// `[role=menu]` = 0 und `[role=menuitem*]` = 0; die Pfeiltasten bewegten den
// Fokus nicht. Vorbild und Massstab ist das Reiter-Kontextmenü (M4,
// `components/layout/ReiterMenue.tsx`), das die Rolle seit 6.9.2026 trägt UND
// einlöst.
test.describe('D4 — das Ansicht-Menü trägt seine Rolle und löst sie ein', () => {
  test('@1440: role=menu, Einträge als menuitem*, ↓ wandert, Esc schliesst', async ({ page }) => {
    await leser(page, 1440, 900)
    await page.locator('[data-v3-ansicht]').click()
    await expect(page.locator('[data-v3-ansicht-panel]')).toBeVisible()
    // Das MENÜ ist der innere Block: die Schalter und die Panel-Zeile. Der
    // Schriftregler steht daneben in derselben Fläche und ist bewusst kein
    // Menü-Eintrag (Herleitung in `v3/LeserAnsichtV3.tsx` am `role="menu"`;
    // axe meldete den ersten Bau, der ihn einschloss, als critical).
    const flaeche = page.locator('[data-v3-ansicht-menue]')
    await expect(flaeche).toBeVisible()
    await expect(flaeche).toHaveAttribute('role', 'menu')
    await expect(flaeche).toHaveAttribute('aria-label', 'Ansicht')
    // Die Schalter tragen ihren Zustand weiterhin selbst — als
    // `menuitemcheckbox`/`menuitemradio` mit `aria-checked`, nicht als `switch`.
    // D35-F3 (§6.3, Entscheid David 7.9.2026): «Fussnoten» und «Fassung» sind
    // Stellungen EINER Radiogruppe geworden; im Menü stehen seither eine
    // Checkbox und drei Radios statt dreier Checkboxen.
    const schalter = flaeche.locator('[role="menuitemcheckbox"], [role="menuitemradio"]')
    expect(await schalter.count(), 'Schalter im Menü').toBeGreaterThanOrEqual(2)
    await expect(schalter.first()).toHaveAttribute('aria-checked', /true|false/)
    // Und NICHTS im Menü, das keine Menü-Rolle trägt: die Kinder sind
    // vollzählig `menuitemcheckbox`/`menuitem`/`group`. Genau das ist die
    // Bedingung, an der axe den ersten Bau gekippt hat — `group` ist nach ARIA
    // ein erlaubtes Kind von `menu` und trägt die Radiogruppe samt ihrem Titel.
    const ERLAUBT = ['menuitem', 'menuitemcheckbox', 'menuitemradio', 'group']
    expect(await page.evaluate((erlaubt) => [...document.querySelectorAll(
      '[data-v3-ansicht-menue] > *')].map((e) => e.getAttribute('role') ?? '(ohne)')
      .filter((r) => !erlaubt.includes(r)), ERLAUBT), 'Fremdkinder im Menü')
      .toEqual([])

    // ── DAS EINGELÖSTE VERSPRECHEN: ↓ wandert von Eintrag zu Eintrag ────────
    const eintraege = flaeche.locator('[role="menuitemcheckbox"], [role="menuitemradio"], [role="menuitem"]')
    await eintraege.first().focus()
    const vorher = await page.evaluate(() => document.activeElement?.getAttribute('aria-label')
      ?? document.activeElement?.textContent ?? '')
    await page.keyboard.press('ArrowDown')
    const nachher = await page.evaluate(() => document.activeElement?.getAttribute('aria-label')
      ?? document.activeElement?.textContent ?? '')
    expect(nachher, `↓ bewegte den Fokus nicht (blieb auf «${vorher}»)`).not.toBe(vorher)
    // ↑ führt zurück — sonst wäre die Bedienung eine Einbahn.
    await page.keyboard.press('ArrowUp')
    expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')
      ?? document.activeElement?.textContent ?? '')).toBe(vorher)

    await page.keyboard.press('Escape')
    await expect(flaeche).toBeHidden()
  })

  test('@1440: axe findet am aufgezogenen Menü keinen schweren Verstoss', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
    await leser(page, 1440, 900)
    await page.locator('[data-v3-ansicht]').click()
    await expect(page.locator('[data-v3-ansicht-menue]')).toBeVisible()
    // Nur die Fläche selbst — die Seite darum hat ihr eigenes Tor in
    // `e2e/a11y.e2e.ts`, und ein zweites Gesamt-Scan wäre dessen Doppel (§5).
    const ergebnis = await new AxeBuilder({ page })
      .include('[data-v3-ansicht-panel]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const schwer = ergebnis.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious')
    expect(schwer.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes[0]?.target.join(' ')}`))
      .toEqual([])
  })
})
