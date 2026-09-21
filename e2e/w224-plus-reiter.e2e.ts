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

test('Klick auf «+» legt einen aktiven Sammlungs-Reiter an und schickt den Fokus in die Kopf-Suche', async ({ page }) => {
  await plusKnopf(page).click()
  await expect(page).toHaveURL(/\/$/)
  expect(await tabs(page)).toEqual(['/'])
  await expect(aktiv(page)).toContainText('Sammlung')
  await expect(kopfFeld(page)).toBeFocused()
})

test('Suche füllt DENSELBEN Reiter — kein zweiter, die Zahl bleibt', async ({ page }) => {
  await plusKnopf(page).click()
  const feld = kopfFeld(page)
  await expect(feld).toBeFocused()
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

test('zweiter Klick auf «+» aktiviert den bestehenden Sammlungs-Reiter statt einen zweiten anzulegen', async ({ page }) => {
  await plusKnopf(page).click()
  expect(await tabs(page)).toEqual(['/'])
  // Das Suchvorschlags-Blatt fängt sonst den Zeiger ab (R14-Prüfung §1.3 e).
  await page.keyboard.press('Escape')
  await plusKnopf(page).click()
  expect(await tabs(page)).toEqual(['/'])
})

test('Alt+T legt denselben Sammlungs-Reiter an wie der Klick', async ({ page }) => {
  await page.keyboard.press('Alt+T')
  await expect(page).toHaveURL(/\/$/)
  expect(await tabs(page)).toEqual(['/'])
  await expect(kopfFeld(page)).toBeFocused()
})

test('Reload: der Sammlungs-Reiter übersteht den Neustart', async ({ page }) => {
  await plusKnopf(page).click()
  await page.reload()
  await expect(plusKnopf(page)).toBeVisible()
  await expect(aktiv(page)).toContainText('Sammlung')
  expect(await tabs(page)).toEqual(['/'])
})
