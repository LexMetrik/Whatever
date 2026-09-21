// @shard-gruppe: 2
// ── DEKLARIERTE SONDEN-ÄNDERUNG (§6.3) · W2·18 Welle 3 Punkt 3, 13.9.2026 ───
// Der Reiter ist seit diesem Schritt ein `<a href>` (React-Router-`Link`)
// statt eines `<button>` — die Rollen-Korrektur ist die Massnahme selbst
// (WCAG 4.1.2). Die Sonde greift darum über `link` statt `button`; Name,
// Reihenfolge und geprüfte Zusage sind unverändert.
// ═══ R14 · «ALLES IST EIN REITER» (Entscheid David 7.9.2026, Variante A) ════
//
// Anlass, Davids Wortlaut 7.9.2026 (DATEN, nicht Auftrag): «irgendwie ist es
// weird wenn ich im gesetz bin dann wieder startseite usw. ausserdem wenn alles
// zu ist und ich plus klicke dann erscheint einfach neuer reiter.»
//
// Das Modell davor kannte ZWEI Sorten Seiten: solche mit Reiter und die
// Startseite «/» ohne (D7-Abweichung). Daraus folgte der gemessene Verlust
// (R14-Prüfung, Stand `cfa8a9f81`): OR offen → Marke → ZGB ergab `[ZGB]` und
// den OR im Schliess-Ring, obwohl niemand etwas geschlossen hatte.
//
// SEIT R14 gilt EINE Regel: die Sammlung «/» ist ein gewöhnlicher Reiter und
// zugleich die Neuer-Reiter-Seite. Man steht immer in genau einem Reiter.
//
// ROT ZU BEKOMMEN (§6.7 — je Zusage einzeln gefahren, 7.9.2026, Vorstand
// `79023e630`):
//   Z1  GALT BIS R14b: «`lib/tabs.istReiterPfad`: den `'/'`-Zweig streichen».
//       Die Funktion ist mit R14b ersatzlos gestrichen; gleichwertig ist heute,
//       in `components/TabTracker.tsx` das `|| pathname === '/'` aus dem
//       `merkeTab`-Zweig zu nehmen ⇒ der Klick auf die Marke ERSETZT den
//       Gesetzes-Reiter und lässt 1 statt 2 stehen.
//   Z2  `layout/Reiterleiste.neuerReiter` auf `neuerLeererReiter()` zurück ⇒
//       die Aufschrift heisst «Neuer Reiter», nicht «Sammlung».
//   Z3  in `Reiterleiste.schliessen` das `zurSammlung()` durch `navigate('/')`
//       ersetzen ⇒ nach dem letzten ✕ steht für einen Frame kein Reiter
//       (bis R14b zusätzlich sichtbar am Attribut `data-reiter-leer`, das mit
//       R14b ersatzlos weggefallen ist).
//   Z4  in `TabTracker` das `ringt: navTyp !== 'POP'` streichen ⇒ Zurück und
//       Vorwärts füllen den Ring, «/gesetze» steht doppelt darin.
//   Z5  wie Z1 ⇒ «/» trägt keinen Reiter, die Leiste steht leer.
//   Z6  wie Z1 ⇒ der Reload findet nur den einen Dokument-Reiter.
import { test, expect, type Page } from '@playwright/test'

const REITER = 'nav[aria-label="Offene Reiter"]'
const STREIFEN = '[data-reiter-streifen]'
const aktiv = (page: Page) => page.locator(`${REITER} [data-reiter-aktiv="true"]`)
// `exact: true`: der Reiter «Sammlung» trägt seinen eigenen Knopf-Namen
// («Reiter 1: Sammlung»); nur der «+» heisst genau «Neuer Reiter».
const plusKnopf = (page: Page) => page.locator(REITER).getByRole('button', { name: 'Neuer Reiter', exact: true })
const kopfFeld = (page: Page) => page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })
const marke = (page: Page) => page.locator('header.sticky a[aria-label^="LexMetrik"]').first()

/** Der Speicher ist die Wahrheit — er übersteht den Neustart. */
const pfade = (page: Page) => page.evaluate(() =>
  (JSON.parse(localStorage.getItem('lexmetrik-tabs') ?? '[]') as { path: string }[])
    .map((t) => t.path.split('#')[0]))
/** Der Schliess-Ring («zuletzt geschlossen», Alt+⇧+T). */
const ring = (page: Page) => page.evaluate(() =>
  (JSON.parse(localStorage.getItem('lexmetrik-tabs-zu') ?? '[]') as { eintrag: { path: string } }[])
    .map((x) => x.eintrag.path.split('#')[0]))

/** Startroute ohne eigenen Reiter (`lib/tabs.istReiterPfad` ist für /kontakt
 *  falsch — Meta-Seiten bleiben auch nach R14 aussen vor): so trägt der
 *  Speicher genau das, was der Fall selbst erzeugt.
 *
 *  ── DEKLARIERTE SONDEN-ÄNDERUNG (§6.3) · R14b, 7.9.2026 ──────────────────
 *  Der Absatz darüber bleibt als datierter Beleg (§0 Ziff. 2b) — er galt bis
 *  `8d398874e`. Seit R14b trägt auch `/kontakt` einen Reiter; die Rolle der
 *  Startroute ist deshalb nur noch, `localStorage` erreichbar zu machen, bevor
 *  das `beforeEach` ihn leert. Die Zusagen Z3–Z6 sind unberührt. */
const START = '/kontakt'
const OR = '/gesetze/bund/OR'

test.describe.configure({ timeout: 90_000 })

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(START)
  await page.evaluate(() => { localStorage.removeItem('lexmetrik-tabs'); localStorage.removeItem('lexmetrik-tabs-zu') })
  await expect(plusKnopf(page)).toBeVisible()
})

// ═══ Z1 · DIE MARKE AKTIVIERT DIE SAMMLUNG, SIE ÜBERSCHREIBT NICHTS ═════════
test('Z1 — aus dem Gesetz auf die Marke: die Sammlung wird aktiv, das Gesetz bleibt Reiter', async ({ page }) => {
  await page.goto(OR)
  await expect(aktiv(page)).toContainText('OR')
  expect(await pfade(page)).toEqual([OR])

  await marke(page).click()
  await expect(page).toHaveURL(/\/$/)
  // Zwei Reiter: das Gesetz steht weiter da, die Sammlung ist dazugekommen.
  await expect.poll(() => pfade(page), { timeout: 10_000 }).toEqual([OR, '/'])
  await expect(aktiv(page)).toHaveCount(1)
  await expect(aktiv(page)).toContainText('Sammlung')
  // Und nichts ist verloren gegangen — der Ring bleibt leer.
  expect(await ring(page), 'die Marke darf keinen Reiter verbrauchen').toEqual([])
})

// ═══ Z2 · «+» ÖFFNET DIE SAMMLUNG UND SETZT DEN CURSOR IN DIE SUCHE ═════════
test('Z2 — «+» öffnet den Sammlungs-Reiter, fokussiert die Suche und legt keinen zweiten an', async ({ page }) => {
  await plusKnopf(page).click()
  await expect(page).toHaveURL(/\/$/)
  await expect.poll(() => pfade(page), { timeout: 10_000 }).toEqual(['/'])
  await expect(aktiv(page)).toContainText('Sammlung')
  await expect(kopfFeld(page)).toBeFocused()

  // Höchstens EINE Sammlung (R13-Entscheid, für W2·25 bindend).
  await page.keyboard.press('Escape')
  await plusKnopf(page).click()
  expect(await pfade(page)).toEqual(['/'])
})

// ═══ Z3 · DER LETZTE ✕ FÜHRT IN DIE SAMMLUNG, NICHT INS NICHTS ══════════════
test('Z3 — nach dem letzten ✕ steht genau ein Reiter «Sammlung», die Leiste ist nie leer', async ({ page }) => {
  await page.goto(OR)
  await expect(aktiv(page)).toContainText('OR')

  await page.locator(`${REITER} .lc-schliessknopf`).first().click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator(`${STREIFEN} [data-reiter-schluessel]`)).toHaveCount(1)
  await expect(aktiv(page)).toContainText('Sammlung')
  expect(await pfade(page)).toEqual(['/'])
  // Das geschlossene Dokument ist die Rückfahrkarte, die Sammlung nicht.
  expect(await ring(page)).toEqual([OR])
})

// ═══ Z4 · ZURÜCK BLÄTTERT IM REITER — UND FÜLLT KEINEN RING ═════════════════
//
// GEMESSEN am Vorstand (R14-Prüfung §1.3 b): drei Verlaufsschritte legten
// «OR» zweimal in den Ring, obwohl nichts geschlossen wurde. Alt+⇧+T verlor
// damit genau die Verlässlichkeit, für die R11-M3 es eingeführt hat.
test('Z4 — Zurück und Vorwärts bewegen den Reiter, ohne den Schliess-Ring zu füllen', async ({ page }) => {
  await page.goto('/gesetze')
  await expect.poll(() => pfade(page), { timeout: 10_000 }).toEqual(['/gesetze'])
  // EINE Vorwärts-Navigation in der App: sie ersetzt den Reiter und legt den
  // verlassenen Stand in den Ring — das ist die Regel von §5a Ziff. 3 und
  // bleibt unangetastet.
  await page.locator(`a[href="${OR}"]`).first().click()
  await expect(page).toHaveURL(new RegExp(`${OR}$`))
  await expect.poll(() => ring(page), { timeout: 10_000 }).toEqual(['/gesetze'])

  const vorher = await ring(page)
  const zahlVorher = (await pfade(page)).length

  await page.goBack()
  await expect(page).toHaveURL(/\/gesetze$/)
  await page.goForward()
  await expect(page).toHaveURL(new RegExp(`${OR}$`))
  await page.waitForTimeout(500)

  const nachher = await ring(page)
  expect(nachher, 'Blättern ist kein Verlust — der Ring darf nicht wachsen').toEqual(vorher)
  expect(new Set(nachher).size, `Dubletten im Ring: ${nachher.join(', ')}`).toBe(nachher.length)
  expect((await pfade(page)).length, 'Blättern erzeugt keinen Reiter').toBe(zahlVorher)
})

// ═══ Z5 · «/» IST EIN REITER WIE JEDER ANDERE ═══════════════════════════════
test('Z5 — die Sammlung trägt ihren eigenen Reiter, auch beim Kaltstart auf «/»', async ({ page }) => {
  await page.goto('/')
  await expect.poll(() => pfade(page), { timeout: 10_000 }).toEqual(['/'])
  await expect(aktiv(page)).toContainText('Sammlung')
})

// ═══ Z6 · DER NEUSTART FINDET DIESELBE LEISTE ══════════════════════════════
test('Z6 — Sammlung und Gesetz überstehen den Reload, die Sammlung bleibt aktiv', async ({ page }) => {
  await page.goto(OR)
  await marke(page).click()
  await expect.poll(() => pfade(page), { timeout: 10_000 }).toEqual([OR, '/'])

  await page.reload()
  await expect(plusKnopf(page)).toBeVisible()
  await expect.poll(() => pfade(page), { timeout: 10_000 }).toEqual([OR, '/'])
  await expect(aktiv(page)).toContainText('Sammlung')
  // Und der Wechsel zurück ins Gesetz kostet keinen Reiter (§5a Ziff. 3).
  await page.locator(`${REITER} [data-reiter-schluessel="${OR}"]`)
    .getByRole('link', { name: /^Reiter \d+: / }).click()
  await expect(page).toHaveURL(new RegExp(`${OR}$`))
  expect(await pfade(page)).toEqual([OR, '/'])
})
