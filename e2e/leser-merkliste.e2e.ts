// @shard-gruppe: 1
// ═══ LESER-NAV R-2 · MERKLISTE IM BROWSER (Entscheid David 19.9.2026) ═══════
//
// Was die Vitest-Sonden NICHT sagen können und diese Spec darum misst:
//  · ob «Merken» an einem echten Artikel im Leser sitzt, den Zustand per aria-pressed meldet und die
//    Stelle in die lokale Liste legt, die die Startseite dann zeigt (EINE Quelle, kein zweiter Speicher);
//  · ob «Als Link teilen» eine Adresse in die ZWISCHENABLAGE legt, deren Payload ein anderer Browser
//    (leerer Speicher) als Vorschau zeigt, ohne etwas zu übernehmen;
//  · ob «Übernehmen» die Stelle erst dann in die Liste legt, den Parameter aus der Adresse nimmt und die
//    Zahlen ansagt;
//  · ob «Entfernen» der letzten Zeile den Fokus auf der Statusmeldung lässt statt auf <body> (WCAG 2.4.3).
// Die Logik (Obergrenze, Härtung, Zähler) decken `merkliste*.test.ts(x)` ab; hier läuft der ganze Weg.
//
// ── ROT ZU BEKOMMEN (§6.7), je Fall ─────────────────────────────────────────
//  (a) In `components/merkliste/MerkenKnopf.tsx` den `onClick` leeren ⇒ «Merken legt die Stelle auf die
//      Startseite» wird rot (aria-pressed bleibt false).
//  (b) In `lib/merkliste.ts` `uebernimmMerkliste` die Zeile `speichere(...)` ausser Kraft setzen ⇒ «Übernehmen
//      legt die Stelle an» wird rot (die Vorschau zeigt sie, die Liste bleibt leer).
//  (c) In `MerklisteFlaeche.tsx` in `entferne` die Zeile `fokusStatus.current = true` streichen ⇒ der
//      Fokus-Fall wird rot (activeElement ist <body>).
import { test, expect, type Browser, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

/** BGFA: kleiner Erlass (40 Artikel), der Leser lädt in Sekunden. */
const PFAD = '/gesetze/bund/BGFA'
const ROUTE = `${PFAD}#art-1`

async function ansicht(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  const page = await context.newPage()
  return { context, page }
}

const merkflaeche = (page: Page) => page.getByRole('region', { name: 'Merkliste' })

test.describe('Merkliste — Merken, Teilen, Übernehmen', () => {
  test.describe.configure({ timeout: 120_000 })

  test('Merken im Artikel → Startseite zeigt den Eintrag → Link teilen → Vorschau im leeren Browser → Übernehmen → Entfernen mit Fokus', async ({ browser }) => {
    const a = await ansicht(browser)
    const fehler = fehlerSammeln(a.page)

    // ── 1 · Merken im Artikel ────────────────────────────────────────────────
    await a.page.goto(PFAD)
    await expect(a.page.locator('#art-1')).toBeVisible({ timeout: 30_000 })
    const knopf = a.page.locator('#art-1').getByRole('button', { name: /^Merken: / })
    await expect(knopf).toHaveAttribute('aria-pressed', 'false')
    const name = await knopf.getAttribute('aria-label')
    await knopf.click()
    await expect(knopf).toHaveAttribute('aria-pressed', 'true')
    // WCAG 2.5.3: der Name ändert sich nicht, der sichtbare Text enthält «Merken».
    await expect(knopf).toHaveAttribute('aria-label', name!)
    await expect(knopf).toContainText('Merken')
    await expect(a.page.locator('#lm-kopier-ansage')).toContainText('gemerkt')

    // ── 2 · Startseite zeigt die Stelle (frisches Laden) ──
    await a.page.goto('/')
    const flaeche = merkflaeche(a.page)
    await expect(flaeche).toBeVisible({ timeout: 30_000 })
    const zeile = flaeche.getByRole('link').first()
    const titel = (await zeile.getAttribute('title'))!
    expect(titel).toMatch(/Art\. 1/)
    await expect(zeile).toHaveAttribute('href', ROUTE)
    await expect(flaeche.getByText('Nur auf diesem Gerät')).toBeVisible()

    // ── 3 · Als Link teilen: die Adresse trägt die Liste ─────────────────────
    await flaeche.getByRole('button', { name: 'Als Link teilen' }).click()
    await expect(flaeche.getByRole('button', { name: /Link kopiert/ })).toBeVisible()
    const link = await a.page.evaluate(() => navigator.clipboard.readText())
    expect(link).toMatch(/\/\?merkliste=[A-Za-z0-9_-]+$/)

    // ── 4 · Anderer Browser (leerer Speicher): Vorschau, noch nichts übernommen ──
    const b = await ansicht(browser)
    const fehlerB = fehlerSammeln(b.page)
    await b.page.goto(new URL(link).pathname + new URL(link).search)
    const flaecheB = merkflaeche(b.page)
    await expect(flaecheB.getByText(/Geteilte Merkliste mit 1 Stelle/)).toBeVisible({ timeout: 30_000 })
    await expect(flaecheB.getByText('Noch nichts übernommen', { exact: false })).toBeVisible()
    await expect(flaecheB.getByText(ROUTE)).toBeVisible()
    // Die Vorschau ist KEIN Verweis (ein fremder Link führt nicht per Klick ins Ungeprüfte).
    await expect(flaecheB.getByRole('link')).toHaveCount(0)
    expect(await b.page.evaluate(() => localStorage.getItem('lexmetrik-merkliste'))).toBeNull()

    // ── 5 · Übernehmen legt die Stelle an, der Parameter verschwindet, die Zahl wird gesagt ──
    await flaecheB.getByRole('button', { name: 'Übernehmen' }).click()
    await expect(flaecheB.getByRole('status')).toHaveText('1 Stelle übernommen.')
    await expect(b.page).not.toHaveURL(/merkliste=/)
    await expect(flaecheB.getByRole('link').first()).toHaveAttribute('href', ROUTE)
    expect(await b.page.evaluate(() => JSON.parse(localStorage.getItem('lexmetrik-merkliste')!).map((e: { route: string }) => e.route))).toEqual([ROUTE])

    // ── 6 · Entfernen der letzten Zeile: Fokus bleibt auf der Seite (Statusmeldung), nicht <body> ──
    await flaecheB.getByRole('button', { name: /aus der Merkliste entfernen$/ }).click()
    await expect(flaecheB.getByRole('status')).toHaveText('Merkliste ist jetzt leer.')
    await expect(flaecheB.getByRole('status')).toBeFocused()
    expect(await b.page.evaluate(() => localStorage.getItem('lexmetrik-merkliste'))).toBeNull()

    expect(fehler, fehler.join('\n')).toEqual([])
    expect(fehlerB, fehlerB.join('\n')).toEqual([])
    await a.context.close()
    await b.context.close()
  })

  test('Link mit unbrauchbarer Nutzlast: Hinweis, nichts wird übernommen; ein Artikel-Merken überlebt Neuladen', async ({ browser }) => {
    const a = await ansicht(browser)
    const fehler = fehlerSammeln(a.page)
    await a.page.goto('/?merkliste=abc')
    await expect(merkflaeche(a.page).getByText('Dieser Link enthält keine gültige Merkliste.')).toBeVisible({ timeout: 30_000 })
    await expect(merkflaeche(a.page).getByRole('button', { name: 'Übernehmen' })).toHaveCount(0)
    await merkflaeche(a.page).getByRole('button', { name: 'Schliessen' }).click()
    await expect(a.page).not.toHaveURL(/merkliste=/)

    await a.page.goto(PFAD)
    const knopf = a.page.locator('#art-1').getByRole('button', { name: /^Merken: / })
    await expect(knopf).toBeVisible({ timeout: 30_000 })
    await knopf.click()
    await expect(knopf).toHaveAttribute('aria-pressed', 'true')
    await a.page.reload()
    await expect(a.page.locator('#art-1').getByRole('button', { name: /^Merken: / })).toHaveAttribute('aria-pressed', 'true', { timeout: 30_000 })
    expect(fehler, fehler.join('\n')).toEqual([])
    await a.context.close()
  })
})

// ═══ Merkliste im Leerzustand der Schnellsuche (⌘K) — Entscheid David 15.10.2026 «Ja, in ⌘K zeigen» ═══
//
// Die Vitest-Sonde `suche-leerzustand-merkliste.test.tsx` deckt Markup, Obergrenze und die Gleichheit von
// Tastatur-Liste und Optionen ab; hier läuft der Weg im echten Browser, bei 1440 UND bei 375 px (dort fehlt
// der Verlauf-/Merkliste-Knopf der Topbar, die Schnellsuche ist der Zugang): Liste seeden, Suche öffnen,
// Zeilen sind Optionen, Pfeil + Enter navigiert; leere Liste zeigt keinen Abschnitt; über der Obergrenze
// führt «Alle N auf der Startseite» zur Fläche.
//
// ROT ZU BEKOMMEN (§6.7), je Fall:
//  (d) In `HeaderSuche.tsx` `merkliste` aus `leerOptionen(...)` streichen ⇒ ArrowDown wählt keine
//      Merkliste-Zeile, Enter navigiert nicht (der Fall «Pfeil + Enter» wird rot).
//  (e) In `SucheLeerzustand.tsx` `merkliste.length > 0 && (` auf `true && (` ⇒ bei leerer Liste steht ein
//      leerer Abschnitt «Merkliste» (der Leerfall wird rot).
const SEED = (n: number) => Array.from({ length: n }, (_, i) => {
  const rechner = ['/rechner/verjaehrung', '/rechner/tagerechner']
  const route = i < rechner.length ? rechner[i] : `/gesetze/bund/BGFA#art-${i}`
  return { route, titel: i === 0 ? 'Verjährung (Test)' : i === 1 ? 'Tagerechner (Test)' : `Art. ${i} BGFA (Test)`, typ: i < rechner.length ? 'rechner' : 'gesetz', zeit: i }
})

async function seedeUndOeffneSuche(page: Page, n: number, breite: number) {
  await page.setViewportSize({ width: breite, height: 800 })
  await page.addInitScript((liste) => { if (liste.length > 0) localStorage.setItem('lexmetrik-merkliste', JSON.stringify(liste)) }, SEED(n))
  await page.goto('/kontakt')
  await expect(page.locator('h1').first()).toBeVisible()
  if (breite < 481) {
    // Unter 481 px fehlt der Topbar-Knopf «Verlauf und Merkliste» — die Schnellsuche ist der Weg zur Liste.
    await expect(page.getByRole('button', { name: /Verlauf – zuletzt geöffnet/ })).toBeHidden()
    await page.locator('[data-suche-lupe]').click()
  } else {
    // Gegenprobe zur Aussage oben: ab 481 px GIBT es den Knopf (sonst bewiese das Fehlen unten nichts).
    if (n > 0) await expect(page.getByRole('button', { name: /Verlauf – zuletzt geöffnet/ })).toBeVisible()
    await page.keyboard.press('Control+k')
  }
}

test.describe('Merkliste — Schnellsuche (⌘K)', () => {
  for (const breite of [1440, 375]) {
    test(`@${breite}: Einträge als Optionen unter «Merkliste», Pfeil + Enter navigiert`, async ({ page }) => {
      const fehler = fehlerSammeln(page)
      await seedeUndOeffneSuche(page, 3, breite)
      const liste = page.getByRole('listbox', { name: /Merkliste/ })
      await expect(liste).toBeVisible()
      const gruppe = liste.getByRole('group', { name: 'Merkliste' })
      await expect(gruppe.getByRole('option')).toHaveText([/Verjährung \(Test\)/, /Tagerechner \(Test\)/, /Art\. 2 BGFA \(Test\)/])
      // Fokus bleibt im Feld (kein Tab-Stopp in den Zeilen); die Auswahl läuft über aria-activedescendant.
      const feld = page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })
      await expect(feld).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(gruppe.getByRole('option').first()).toHaveAttribute('aria-selected', 'true')
      await expect(feld).toHaveAttribute('aria-activedescendant', (await gruppe.getByRole('option').first().getAttribute('id'))!)
      await page.keyboard.press('ArrowDown')
      await expect(gruppe.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true')
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/rechner\/verjaehrung$/)
      expect(fehler, fehler.join('\n')).toEqual([])
    })
  }

  test('Klick auf eine Zeile navigiert zur Stelle und schliesst die Suche', async ({ page }) => {
    await seedeUndOeffneSuche(page, 3, 375)
    await page.getByRole('option', { name: /Tagerechner \(Test\)/ }).click()
    await expect(page).toHaveURL(/\/rechner\/tagerechner$/)
    await expect(page.getByRole('listbox')).toHaveCount(0)
  })

  test('leere Merkliste: kein Abschnitt, Panel wie bisher', async ({ page }) => {
    await seedeUndOeffneSuche(page, 0, 1440)
    await expect(page.getByRole('listbox', { name: /zuletzt geöffnet/i })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Merkliste' })).toHaveCount(0)
    await expect(page.getByRole('listbox', { name: /Merkliste/ })).toHaveCount(0)
  })

  test('über der Obergrenze: «Alle 7 auf der Startseite» führt zur Merkliste-Fläche', async ({ page }) => {
    await seedeUndOeffneSuche(page, 7, 1440)
    const gruppe = page.getByRole('group', { name: 'Merkliste' })
    await expect(gruppe.getByRole('option')).toHaveCount(6) // 5 Stellen + «Alle 7»
    await gruppe.getByRole('option', { name: 'Alle 7 auf der Startseite' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('region', { name: 'Merkliste' })).toBeVisible({ timeout: 30_000 })
  })
})
