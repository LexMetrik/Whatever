// @shard-gruppe: 2
// ═══ D19 · «+»-KNOPF ERZEUGT EINEN NEUEN REITER (David 6.9.2026) ════════════
//
// David wörtlich: «in der tab zeile oben soll man mit plus einen neuen reiter
// erzeugen können». Browser-Vorbild: ein «+» am Ende der Arbeitsleiste legt
// einen Reiter an, macht ihn aktiv und schickt den Fokus in die Kopf-Suche.
// Die erste Navigation/Suche füllt GENAU diesen Reiter (§5a Ziff. 3
// «Navigation ersetzt den aktiven Reiter»). Höchstens EINER gleichzeitig: ein
// zweiter Klick auf «+» aktiviert den bestehenden.
//
// ── DEKLARIERTE TEST-ÄNDERUNG (§6.3) · R14, Entscheid David 7.9.2026 ────────
// Bis R14 legte «+» einen LEEREN Reiter an: Pfad «/», Feld `leer: true`,
// Aufschrift «Neuer Reiter» — über einem Bildschirm, der Zeichen für Zeichen
// derselbe blieb (gemessen 3777 == 3777 Zeichen; Davids «dann erscheint
// einfach neuer reiter»). Seit R14 ist die SAMMLUNG die Neuer-Reiter-Seite und
// ein gewöhnlicher Reiter. Alle fünf Fälle prüfen dieselben Zusagen wie zuvor
// — anlegen, füllen, höchstens einer, Alt+T, Reload —; nachgeführt sind allein
// die Aufschrift («Sammlung» statt «Neuer Reiter») und der gespeicherte
// Eintrag (`{ path: '/' }` statt `{ path: '/', leer: true }`).
//
// ROT ZU BEKOMMEN (§6.7 — beide Fälle einmal gefahren, 6.9.2026, R14-Fassung
// 7.9.2026):
//   (a) in `layout/Reiterleiste.neuerReiter` das `zurSammlung()` streichen ⇒
//       der Klick auf «+» tut nichts, kein Reiter entsteht.
//   (b) GALT BIS R14b: «in `lib/tabs.istReiterPfad` den `'/'`-Zweig streichen»
//       — die Funktion ist mit R14b ersatzlos gestrichen (jede Route ist ein
//       Reiter). Der gleichwertige Rot-Weg heute: in
//       `components/TabTracker.tsx` das `|| pathname === '/'` aus dem
//       `merkeTab`-Zweig nehmen ⇒ die Suche aus der Sammlung ERSETZT nicht,
//       sondern der Fall «zweiter Klick auf «+»» legt einen zweiten Reiter an.
//
// ── DEKLARIERTE TEST-ÄNDERUNG (§6.3) · R15, Entscheid David 24.9.2026 ───────
// Die Absätze darüber bleiben als datierte Belege (§0 Ziff. 2b). David
// 24.9.2026: «tabliste soll so funktionieren, dass wenn man auf plus klickt
// sich eine neue startseite öffnet und es nicht automatisch in suchen landet»
// und, zur Höchstens-einer-Regel: «nein heb diesen entscheid auf und mach es
// wie ich es sage». GEWOLLT GEÄNDERT sind damit zwei Zusagen:
//   · «schickt den Fokus in die Kopf-Suche» → die Kopf-Suche ist NICHT
//     fokussiert, das Such-Blatt NICHT offen; der Fokus steht auf dem neuen
//     Reiter, die Startseite (Begrüssung h1) ist sichtbar.
//   · «höchstens EINER» → ein zweites «+» legt «Sammlung (2)» an (`/?r=2`,
//     Instanz-Rahmen `lib/tabs.naechsteInstanz`), der neue ist aktiv.
// Unverändert: «+» ohne Reiter legt GENAU einen «/» an, Alt+T tut dasselbe,
// der Reiter übersteht den Reload, und eine Suche aus der Sammlung FÜLLT
// deren Reiter, statt einen zweiten anzulegen (§5a Ziff. 3).
//
// ROT ZU BEKOMMEN (§6.7, R15-Fassung 24.9.2026):
//   (c) in `Reiterleiste.neuerReiter` die Instanz-Wahl durch `'/'` ersetzen
//       ⇒ der Fall «zweites «+»» sieht `['/']` statt `['/', '/?r=2']`.
//   (d) den `lm:suche-fokus`-Versand zurücknehmen (samt Lauscher) ⇒ der
//       Fall «Klick» sieht die Kopf-Suche fokussiert.
import { test, expect, type Page } from '@playwright/test'
import { warteAufSuchindex } from './helpers/warteAufSuchindex'

const REITER = 'nav[aria-label="Offene Reiter"]'
const aktiv = (page: Page) => page.locator(`${REITER} [data-reiter-aktiv="true"]`)
// `exact: true`: der «+» heisst «Neuer Reiter» (die AKTION), der Reiter selbst
// «Sammlung» (der INHALT). Der exakte Vergleich hielt schon vor R14 die drei
// Treffer auseinander und bleibt darum unverändert stehen.
const plusKnopf = (page: Page) => page.locator(REITER).getByRole('button', { name: 'Neuer Reiter', exact: true })
const kopfFeld = (page: Page) => page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })

/** Die gespeicherten Reiter-ADRESSEN — die Wahrheit, die den Neustart übersteht.
 *  Nur die Pfade: die Sammlung trägt wie die fünf Bereichs-Übersichten ihren
 *  SEO-Titel als `label` (R3-F7 — die ANZEIGE holt ihre Kurzform «Sammlung»
 *  aus `lib/tabs.reiterKurzform`, nicht daraus), und dieses Feld wird vom
 *  TabTracker einen Tick nach dem Öffnen nachgetragen. Ein Vergleich ganzer
 *  Objekte hinge damit am Zeitpunkt der Messung, nicht an der Zusage. */
const tabs = (page: Page) => page.evaluate(() =>
  (JSON.parse(localStorage.getItem('lexmetrik-tabs') ?? '[]') as { path: string }[]).map((t) => t.path))

test.describe.configure({ timeout: 60_000 })

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  // Startroute BEWUSST ohne eigenen Reiter (analog w224-reiter-umordnen-d16):
  // sonst legte der TabTracker beim Laden bereits einen Reiter an und die
  // «genau 1 Reiter»-Messung unten wäre verfälscht.
  //
  // ── DEKLARIERTE SONDEN-ÄNDERUNG (§6.3) · R14b, 7.9.2026 ──────────────────
  // Seit R14b gibt es keine reiterlose Route mehr — `/kontakt` trägt den
  // Reiter «Kontakt». Die Zusagen dieser Datei («+» legt GENAU EINEN
  // Sammlungs-Reiter an, ein zweiter Klick verdoppelt ihn nicht) sind
  // unverändert; nur der Ausgangszustand wird jetzt ausdrücklich hergestellt,
  // statt sich auf eine Ausnahme zu verlassen: Speicher leeren, dann messen.
  await page.goto('/kontakt')
  await page.evaluate(() => localStorage.removeItem('lexmetrik-tabs'))
  await expect(plusKnopf(page)).toBeVisible()
})

/** Die Startseite steht: Begrüssung als h1, kein offenes Such-Blatt, die
 *  Kopf-Suche NICHT fokussiert, und der Fokus liegt auf dem aktiven Reiter. */
async function startseiteOhneSuchSprung(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(kopfFeld(page)).not.toBeFocused()
  await expect(page.getByRole('listbox', { name: 'Suchtreffer' })).toHaveCount(0)
  await expect.poll(() => page.evaluate(() =>
    document.activeElement?.closest('[data-reiter-aktiv="true"]') !== null)).toBe(true)
}

test('Klick auf «+» legt einen aktiven Sammlungs-Reiter an — ohne Sprung in die Suche', async ({ page }) => {
  await plusKnopf(page).click()
  await expect(page).toHaveURL(/\/$/)
  expect(await tabs(page)).toEqual(['/'])
  await expect(aktiv(page)).toContainText('Sammlung')
  await startseiteOhneSuchSprung(page)
})

test('Suche aus der Sammlung füllt DENSELBEN Reiter — kein zweiter, die Zahl bleibt', async ({ page }) => {
  await plusKnopf(page).click()
  const feld = kopfFeld(page)
  await feld.click()
  await feld.fill('OR 257d')
  await expect(page.getByRole('listbox', { name: 'Suchtreffer' })).toBeVisible()
  // §17-Wurzelfix (Fixer 1h, offener Punkt «Aus Fixer 1e»): `aufTaste` in
  // HeaderSuche.tsx navigiert auf Enter erst, wenn `allesGeladen` true ist —
  // vorher wartete dieser Test dafür auf die Playwright-Standarduhr (10 s),
  // nicht auf den Index-Zustand selbst. Auf den Index warten, DANN Enter.
  await warteAufSuchindex(page)
  await feld.press('Enter')
  await expect(page).toHaveURL(/\/gesetze\/bund\/OR#art-257_d$/)
  // Genau EIN Reiter — der leere ist gefüllt, nicht verdoppelt.
  const t = await tabs(page)
  expect(t.length).toBe(1)
  expect(t[0]).toContain('/gesetze/bund/OR')
  await expect(aktiv(page)).toContainText('257d OR')
})

test('zweiter Klick auf «+» legt einen ZWEITEN Sammlungs-Reiter an, der neue ist aktiv (R15)', async ({ page }) => {
  await plusKnopf(page).click()
  expect(await tabs(page)).toEqual(['/'])
  await plusKnopf(page).click()
  await expect(page).toHaveURL(/\/\?r=2$/)
  await expect.poll(() => tabs(page)).toEqual(['/', '/?r=2'])
  await expect(aktiv(page)).toHaveCount(1)
  await expect(aktiv(page)).toContainText('Sammlung')
  await expect(aktiv(page)).toContainText('(2)')
  await startseiteOhneSuchSprung(page)
})

test('Alt+T legt denselben Sammlungs-Reiter an wie der Klick — und beim zweiten Mal einen neuen', async ({ page }) => {
  await page.keyboard.press('Alt+T')
  await expect(page).toHaveURL(/\/$/)
  expect(await tabs(page)).toEqual(['/'])
  await startseiteOhneSuchSprung(page)
  await page.keyboard.press('Alt+T')
  await expect(page).toHaveURL(/\/\?r=2$/)
  await expect.poll(() => tabs(page)).toEqual(['/', '/?r=2'])
})

test('Reload: der Sammlungs-Reiter übersteht den Neustart', async ({ page }) => {
  await plusKnopf(page).click()
  await page.reload()
  await expect(plusKnopf(page)).toBeVisible()
  await expect(aktiv(page)).toContainText('Sammlung')
  expect(await tabs(page)).toEqual(['/'])
})

test('Reload auf `/?r=2` zeigt die Startseite, beide Sammlungs-Reiter bleiben (R15)', async ({ page }) => {
  await plusKnopf(page).click()
  await plusKnopf(page).click()
  await expect(page).toHaveURL(/\/\?r=2$/)
  await page.reload()
  await expect(page).toHaveURL(/\/\?r=2$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(aktiv(page)).toContainText('(2)')
  expect(await tabs(page)).toEqual(['/', '/?r=2'])
})

test('«Alle schliessen» lässt genau EINE Sammlung übrig, keine Instanzen (R15)', async ({ page }) => {
  await plusKnopf(page).click()
  await plusKnopf(page).click()
  await plusKnopf(page).click()
  await expect.poll(() => tabs(page)).toEqual(['/', '/?r=2', '/?r=3'])
  await page.locator(`${REITER} [data-reiter-aktiv="true"]`).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Alle schliessen' }).click()
  await expect.poll(() => tabs(page)).toEqual(['/'])
  await expect(page).toHaveURL(/\/$/)
})
