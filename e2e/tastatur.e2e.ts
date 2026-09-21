// @shard-gruppe: 4
// Tastatur-Protokoll (FAHRPLAN-DESIGN 3.7) — automatisierter Teil.
// Prüft das DatumsFeld-Kalender-Popover (grösster A11y-Einzelposten, auf
// jeder Rechner-Seite) gegen das APG-Grid-/Dialog-Muster und sichert die
// Bug-Check-Befunde vom 7.6.2026 als Regression (roving tabindex
// monats-robust, kein Fokus-Klau beim Maus-Blättern).
//
// NICHT automatisierbar (offene Manuell-Posten, siehe
// abnahme/design-2026-06/BERICHT.md): Screenreader-Ansagen (aria-live),
// visuelle Wahrnehmbarkeit der focus-visible-Stile, fachliches Urteil zur
// Tab-REIHENFOLGE.
import { test, expect } from '@playwright/test'
import { appGebootet } from './helpers/appGebootet'

const aktivesIso = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset?.iso ?? null)

test('Kalender-Popover: Dialog-/Grid-Rollen, Pfeil-Navigation, Enter wählt, Escape kehrt zum Auslöser zurück', async ({ page }) => {
  await page.goto('/rechner/tagerechner')
  const trigger = page.getByRole('button', { name: 'Kalender öffnen' }).first()
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Kalender' })
  await expect(dialog).toBeVisible()

  // Roving tabindex: genau EINE Rasterzelle ist tabbar; der Fokus liegt
  // beim Öffnen im Raster (data-iso des aktiven Elements gesetzt).
  await expect(dialog.locator('button[role="gridcell"][tabindex="0"]')).toHaveCount(1)
  const start = await aktivesIso(page)
  expect(start, 'Fokus liegt nach dem Öffnen auf einer Tageszelle').toMatch(/^\d{4}-\d{2}-\d{2}$/)

  // Pfeiltasten bewegen den Fokus tagweise (rechts +1, runter +7).
  await page.keyboard.press('ArrowRight')
  const rechts = await aktivesIso(page)
  expect(rechts).not.toBe(start)
  await page.keyboard.press('ArrowDown')
  const runter = await aktivesIso(page)
  expect(runter).not.toBe(rechts)

  // Enter wählt den fokussierten Tag: Popover schliesst, Wert steht im Feld —
  // im Eingabefeld DESSELBEN DatumsFelds (Wrapper des Triggers, nicht das
  // erste Feld der Seite).
  await page.keyboard.press('Enter')
  await expect(dialog).not.toBeVisible()
  await expect(trigger.locator('..').locator('input[placeholder="TT.MM.JJJJ"]')).toHaveValue(/^\d{2}\.\d{2}\.\d{4}$/)

  // Escape schliesst und gibt den Fokus an den Auslöser zurück (Dialog-Muster).
  await trigger.click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('Monatsblättern ‹/›: Raster bleibt tabbar (Monatserster), kein Fokus-Klau; Pfeil startet beim Monatsersten', async ({ page }) => {
  // Regression Bug-Check §9 Agent 2 (7.6.2026), Befund 1: nach ‹/›-Blättern
  // zeigte fokusIso auf einen nicht gerenderten Monat — das Raster war
  // untabbar und der Fokus sprang beim Maus-Blättern zurück.
  await page.goto('/rechner/tagerechner')
  await page.getByRole('button', { name: 'Kalender öffnen' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Kalender' })
  await expect(dialog).toBeVisible()

  const blaettern = page.getByRole('button', { name: 'Ein Monat vor' })
  await blaettern.click()
  // Kein Fokus-Klau: der Fokus bleibt auf dem Blättern-Button.
  await expect(blaettern).toBeFocused()
  // Genau eine tabbare Zelle, und zwar der Monatserste.
  const tabbar = dialog.locator('button[role="gridcell"][tabindex="0"]')
  await expect(tabbar).toHaveCount(1)
  await expect(tabbar).toHaveAttribute('data-iso', /-01$/)

  // Pfeil-Navigation nach dem Blättern startet beim Monatsersten.
  await tabbar.focus()
  await page.keyboard.press('ArrowRight')
  const iso = await aktivesIso(page)
  expect(iso, 'Erster Pfeildruck landet auf dem Monatsersten').toMatch(/-01$/)
})

// ── W2.3: Erweiterung über das Kalender-Popover hinaus (Skip-Link, «/»-Suche,
//    SchweizKarte-Tastaturbedienung — letztere sichert den W1.6-Fokus-Fix). ──

test('Skip-Link: erstes Tab fokussiert «Zum Inhalt springen» und springt in den Inhalt', async ({ page }) => {
  await page.goto('/')
  // MESSBEDINGUNG, kein Prüfschritt (§6.3): erst hochfahren lassen, dann tabben.
  // Ein Tastendruck in das Startfenster hinein bewegt den Fokus gar nicht —
  // gemessen 12/12 rot unter CPU-Drossel 20×, 0/12 mit diesem Helfer
  // (Herleitung und Rot-Rezept: `helpers/appGebootet.ts`). Geprüft wird
  // unverändert die TAB-REIHENFOLGE: der Skip-Link ist der erste Halt.
  await appGebootet(page)
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Zum Inhalt springen' })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#inhalt$/)
})

// ── §6.3-DEKLARATION (W2·23-STARTSEITE-V4 §6.1, 5.9.2026) ────────────────────
// Die beiden folgenden Fälle prüfen die Kürzel-Mechanik der KOPF-Suche. Auf «/»
// gibt es sie seit diesem Schritt nicht mehr — dort trägt der Hero die eine
// Suche, und der Streifen leitet «/»/⌘K dorthin um. Die Fälle ziehen darum auf
// eine Route um, auf der die Kopf-Suche steht (/gesetze); Assertion, Umfang und
// Wortlaut bleiben unverändert. Der «/»-Fall (Umleitung auf die Hero-Suche)
// wird NEU in `w223b-kopf-seitenleiste.e2e.ts` geprüft — kein Prüfpunkt geht
// verloren, keiner steht doppelt.
test('«/» fokussiert die Suche (Tastatur-Shortcut)', async ({ page }) => {
  await page.goto('/gesetze')
  await page.keyboard.press('/')
  // Die Header-Suche ist eine ARIA-Combobox (Vorschlags-Listbox), kein reiner
  // searchbox — der «/»-Shortcut fokussiert sie weiterhin.
  await expect(page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })).toBeFocused()
})

// A5 (David 5.7.2026): ⌘K/Ctrl-K fokussiert dieselbe HeaderSuche (die frühere
// Palette ist entfallen). Koexistenz zu «/» — beide fokussieren dasselbe Feld,
// keiner öffnet ein Overlay. Sichert den KA4-Akzeptanzpunkt («/»-Koexistenz).
test('⌘K/Ctrl-K und «/» koexistieren: beide fokussieren die HeaderSuche, kein Overlay', async ({ page }) => {
  await page.goto('/gesetze')
  const feld = page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })
  // Ctrl-K fokussiert das Feld.
  await page.keyboard.press('Control+k')
  await expect(feld).toBeFocused()
  // Kein Dialog/Overlay entstanden (keine ⌘K-Palette mehr).
  await expect(page.getByRole('dialog', { name: /Sprung zum Artikel/ })).toHaveCount(0)
  // Feld verlassen, dann «/» fokussiert es erneut (Koexistenz).
  await page.getByRole('link', { name: 'Zum Inhalt springen' }).focus()
  await page.keyboard.press('/')
  await expect(feld).toBeFocused()
})

test('SchweizKarte: Kanton-Fläche ist tastatur-fokussierbar und mit Enter wählbar (W1.6)', async ({ page }) => {
  await page.goto('/gesetze?ebene=kanton')
  // Gesetzes-UX G5 · §4.3.3: die Karte ist der Default-Einstieg der Kantons-
  // Übersicht (direkt sichtbar, kein zugeklapptes <details> mehr).
  await expect(page.getByRole('group', { name: /Karte der Schweizer Kantone/ })).toBeVisible()
  // Eine wählbare Fläche ist tastatur-fokussierbar (tabindex=0 + role=button —
  // die Fokus-SICHTBARKEIT selbst ist in W1.6 per Screenshot belegt) und reagiert
  // auf Enter (onKeyDown → Auswahl). Wir prüfen den Tastatur-Vertrag deterministisch
  // per dispatch (SVG-Fokus in Playwright ist unzuverlässig).
  const flaeche = page.locator('path[role="button"][tabindex="0"]').first()
  await expect(flaeche).toHaveCount(1)
  const kanton = await flaeche.getAttribute('aria-label')
  const ausgeloest = await page.evaluate(() => {
    const el = document.querySelector('path[role="button"][tabindex="0"]')
    if (!el) return false
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    return true
  })
  expect(ausgeloest).toBe(true)
  // Nach der Wahl ist ein Kanton gewählt → die Einzelkanton-Sicht mit der
  // «← Alle Kantone»-Zurückleiste erscheint (Karten-Übersicht unmountet).
  await expect(page.getByRole('button', { name: /Alle Kantone/ })).toBeVisible()
  expect(kanton, 'wählbare Fläche trägt einen Kantonsnamen').toBeTruthy()
})
