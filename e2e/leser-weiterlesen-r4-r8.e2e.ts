// @shard-gruppe: 5
import { test, expect, type Page } from '@playwright/test'
import { clsBeobachtenInstallieren, clsAuslesen } from './helpers/cls'
import { DROSSEL } from './helpers/budgets'

// ─── W2·10-UI-NAV/R4 + R8 ────────────────────────────────────────────────────
//
// R4 «Weiterlesen bei Art. X»: die gemerkte Lesestelle wird beim Wiederkommen
// ANGEBOTEN, nie automatisch angesprungen. Genau diese Grenze ist das Prüfziel —
// ein Auto-Sprung wäre die eine Umsetzung, die niemand erwartet (§8).
//
// R8 j/k + «?»: Tastatur-Navigation im Reader, ohne die global belegten «/» und
// ⌘K anzufassen (Kontrakt `tastatur.e2e.ts`, dort UNVERÄNDERT — §6.3; die
// Koexistenz wird hier zusätzlich AUF DER READER-SEITE geprüft, wo der neue
// Listener läuft).
//
// A9-DoD-Querschnitt: Tastatur/aria/Tap-Ziele und Flüssigkeit unter CPU-Drossel.
// CLS 0 wird STRUKTUREL bewiesen statt gemessen: beide neuen Flächen liegen
// `position: fixed` ausserhalb des Layoutflusses — der Test vergleicht die
// Dokument-Geometrie mit und ohne Chip und verlangt Byte-Gleichheit der
// y-Positionen. Ein Timing-Mass könnte hier nur Lade-Shifts der Seite messen,
// die es schon vorher gab; die Geometrie sagt, was die Frage eigentlich ist.
// Drossel aus `./helpers/budgets` (§5).
const ERLASS = '/gesetze/bund/BV'
const SPEICHER = 'lexmetrik-leseposition'

/** Wartet, bis der Reader den Volltext trägt (Artikel-Anker im DOM). */
async function readerBereit(page: Page): Promise<void> {
  await expect(page.locator('[id^="art-"]').first()).toBeAttached({ timeout: 20000 })
}

/** Scrollt zu einem Artikel weiter hinten und wartet, bis der Scroll-Spy die
 *  Stelle GEMERKT hat (Beleg: der Speicher-Eintrag existiert). Kein Warten auf
 *  eine feste Zeit — gewartet wird auf das Ergebnis. */
async function leseBis(page: Page, index: number): Promise<{ token: string; label: string }> {
  const erster = await page.evaluate((i) => {
    const alle = Array.from(document.querySelectorAll('[id^="art-"]'))
    const el = alle[Math.min(i, alle.length - 1)] as HTMLElement
    el.scrollIntoView({ block: 'start' })
    return alle[0].id.replace(/^art-/, '')
  }, index)
  await expect
    .poll(async () => page.evaluate((k) => localStorage.getItem(k), SPEICHER), { timeout: 20000 })
    .not.toBeNull()
  const eintrag = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]')[0], SPEICHER)
  // WELCHER Artikel gemerkt wird, entscheidet der Scroll-Spy über seine
  // Bezugslinie — das ist bewusst SEINE Wahrheit (§5), und der Test schreibt sie
  // ihm nicht vor. Geprüft wird, was für R4 zählt: es ist ein echter Artikel und
  // NICHT der erste des Dokuments (sonst gäbe es nichts anzubieten).
  expect(eintrag.token, 'eine Stelle wurde gemerkt').toBeTruthy()
  expect(eintrag.token, 'die gemerkte Stelle liegt hinter dem Dokumentanfang').not.toBe(erster)
  expect(eintrag.label, 'das Label ist ein Artikel-Name, kein Rohtoken').toMatch(/^Art\./)
  return { token: eintrag.token, label: eintrag.label }
}

test('R4: gemerkte Stelle wird ANGEBOTEN, nicht angesprungen — Klick springt, ✕ vergisst', async ({ page }) => {
  await page.goto(ERLASS)
  await readerBereit(page)
  const { label } = await leseBis(page, 12)

  // ── Wiederkommen ──────────────────────────────────────────────────────────
  await page.goto(ERLASS)
  await readerBereit(page)
  const chip = page.getByRole('button', { name: `Weiterlesen bei ${label}` })
  await expect(chip).toBeVisible({ timeout: 20000 })

  // KERN: KEIN Auto-Sprung. Das Dokument steht am Anfang, wo die Adresse es
  // verspricht — das Angebot wartet, es handelt nicht.
  expect(await page.evaluate(() => window.scrollY), 'kein Auto-Sprung beim Öffnen').toBeLessThan(50)

  // Klick springt tatsächlich zur gemerkten Stelle …
  await chip.click()
  await expect(chip).toBeHidden()
  await expect
    .poll(async () => page.evaluate(() => window.scrollY), { timeout: 10000 })
    .toBeGreaterThan(200)

  // … und das ✕ vergisst das Angebot dauerhaft (nicht nur für diese Ansicht).
  await page.goto(ERLASS)
  await readerBereit(page)
  const chip2 = page.getByRole('button', { name: /^Weiterlesen bei / })
  await expect(chip2).toBeVisible({ timeout: 20000 })
  await page.getByRole('button', { name: 'Weiterlesen-Angebot verwerfen' }).click()
  await expect(chip2).toBeHidden()
  expect(
    await page.evaluate((k) => localStorage.getItem(k), SPEICHER),
    '✕ heisst «nicht wieder anbieten» — also auch aus dem Speicher',
  ).toBeNull()
})

test('R4: Deep-Link schlägt das Angebot — wer Art. X anfragt, bekommt keinen zweiten Vorschlag', async ({ page }) => {
  await page.goto(ERLASS)
  await readerBereit(page)
  const { token } = await leseBis(page, 12)
  // Ein ANDERER Artikel als der gemerkte, per Anker adressiert.
  const anderer = await page.evaluate((t) => {
    const alle = Array.from(document.querySelectorAll('[id^="art-"]')).map((e) => e.id)
    return (alle.find((id) => id !== `art-${t}`) ?? alle[0]).replace(/^art-/, '')
  }, token)

  await page.goto(`${ERLASS}#art-${anderer}`)
  await readerBereit(page)
  // Dem Chip Zeit lassen, falls er fälschlich käme (er erscheint über einen
  // 0-ms-Timer nach dem Mount): erst der Reader-Anker, dann die Negativ-Prüfung.
  await page.waitForTimeout(1500)
  await expect(page.locator('[data-weiterlesen]')).toHaveCount(0)
})

test('R4: der Chip liegt ausserhalb des Layoutflusses — Entfernen bewegt nichts (CLS 0)', async ({ page }) => {
  await page.goto(ERLASS)
  await readerBereit(page)
  await leseBis(page, 12)
  await page.goto(ERLASS)
  await readerBereit(page)
  await expect(page.locator('[data-weiterlesen]')).toBeVisible({ timeout: 20000 })

  // Der Beweis läuft im SELBEN Dokument, im selben Augenblick: Geometrie messen,
  // Chip herausnehmen, erneut messen, Chip zurücksetzen. Zwei getrennte Ladungen
  // zu vergleichen wäre kein Beweis, sondern eine Wette auf gleich weit
  // eingeschwungene Ladezustände (genau daran scheiterte die erste Fassung mit
  // 20 px Differenz, die NICHT vom Chip kam). `getBoundingClientRect` erzwingt
  // den Reflow, die Messung ist also nach dem Entfernen aktuell.
  const geo = await page.evaluate(() => {
    const h1 = document.querySelector('h1') as HTMLElement
    const art = document.querySelector('[id^="art-"]') as HTMLElement
    const chip = document.querySelector('[data-weiterlesen]') as HTMLElement
    const y = () => ({ h1: Math.round(h1.getBoundingClientRect().y), art: Math.round(art.getBoundingClientRect().y) })
    const position = getComputedStyle(chip).position
    const mit = y()
    const eltern = chip.parentElement as HTMLElement
    const danach = chip.nextSibling
    chip.remove()
    const ohne = y()
    eltern.insertBefore(chip, danach)
    return { position, mit, ohne }
  })
  expect(geo.position, 'der Chip ist fixed — er kann per Konstruktion nichts verschieben').toBe('fixed')
  expect(geo.ohne.h1, 'Titel steht ohne Chip an derselben Stelle').toBe(geo.mit.h1)
  expect(geo.ohne.art, 'erster Artikel steht ohne Chip an derselben Stelle').toBe(geo.mit.art)
})

test('R4/A9: Tap-Ziele des Chips ≥ 44 px (WCAG 2.5.8, R6-Mass)', async ({ page }) => {
  await page.goto(ERLASS)
  await readerBereit(page)
  await leseBis(page, 12)
  await page.goto(ERLASS)
  await readerBereit(page)
  await expect(page.locator('[data-weiterlesen]')).toBeVisible({ timeout: 20000 })
  for (const knopf of await page.locator('[data-weiterlesen] button').all()) {
    const box = (await knopf.boundingBox())!
    expect(box.height, 'Höhe des Tap-Ziels').toBeGreaterThanOrEqual(44)
    expect(box.width, 'Breite des Tap-Ziels').toBeGreaterThanOrEqual(44)
  }
})

test('R8: j/k gehen Artikel vor/zurück, «?» öffnet die Übersicht, Escape gibt den Fokus zurück', async ({ page }) => {
  await page.goto(ERLASS)
  await readerBereit(page)
  // Bezugspunkt setzen (der Spy muss einen aktiven Artikel kennen).
  await leseBis(page, 12)
  const vorher = await page.evaluate(() => window.scrollY)

  await page.keyboard.press('j')
  await expect
    .poll(async () => page.evaluate(() => window.scrollY), { timeout: 10000 })
    .toBeGreaterThan(vorher)
  const nachJ = await page.evaluate(() => window.scrollY)
  await page.keyboard.press('k')
  await expect
    .poll(async () => page.evaluate(() => window.scrollY), { timeout: 10000 })
    .toBeLessThan(nachJ)

  // «?»-Overlay: Dialog-Rolle, Fokus IM Dialog (Fokusfalle), Escape schliesst.
  await page.keyboard.press('?')
  const dialog = page.getByRole('dialog', { name: 'Tastatur-Kurzbefehle' })
  await expect(dialog).toBeVisible()
  expect(
    await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-modal="true"]')
      return !!d && (d === document.activeElement || d.contains(document.activeElement))
    }),
    'der Fokus steht nach dem Öffnen IM Dialog (ARIA-Dialog-Muster)',
  ).toBe(true)
  // Die Übersicht nennt die Belegung UND die global belegten Tasten (§8).
  await expect(dialog).toContainText('Zum nächsten Artikel')
  await expect(dialog).toContainText('⌘K')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

// «R8-Koexistenz: im Reader bleiben / und ⌘K die Suche» GELÖSCHT 21.8.2026
// (H5) — hielt die Ist-Hüllen-Zusage fest (Vorrang der Kopf-Suche auf «/» und
// ⌘K im Leser). Kein Defekt, ein entschiedener Vorrangwechsel: im V3-Leser
// gehören «/» und ⌘K dem Such-/Sprungfeld des Lesers, nicht der Kopf-Suche
// (`v3/suchKuerzel.ts`, Bug-Check B1 16.8.2026). V3-Deckung:
// `leser-v3-suche-sprung` (⌘K/«/» ins Leser-Feld) und
// `src/tests/leser-v3-kuerzel.test.ts` (die Regel DOM-frei, alle Kombinationen).

test('R8/B1: bei OFFENEM «?»-Overlay navigiert j/k nicht — der Dialog-Guard nimmt sich nicht selbst aus', async ({ page }) => {
  // §9-Bug-Check B1. Die erste Fassung nahm das EIGENE Overlay pauschal von
  // Guard 3 aus, damit «?» ein Toggle bleibt — und liess damit auch j/k
  // durchlaufen: das Dokument scrollte HINTER dem offenen Dialog (+318 px).
  // Ein Modal hat eine Fokusfalle; was dahinter passiert, hat niemand gewollt.
  await page.goto(ERLASS)
  await readerBereit(page)
  await leseBis(page, 12)

  await page.keyboard.press('?')
  const dialog = page.getByRole('dialog', { name: 'Tastatur-Kurzbefehle' })
  await expect(dialog).toBeVisible()

  const vorher = await page.evaluate(() => window.scrollY)
  await page.keyboard.press('j')
  await page.waitForTimeout(800) // dem Sprung Zeit geben, falls er fälschlich käme
  expect(await page.evaluate(() => window.scrollY), 'j bewegt das Dokument hinter dem Dialog NICHT').toBe(vorher)
  await page.keyboard.press('k')
  await page.waitForTimeout(800)
  expect(await page.evaluate(() => window.scrollY), 'k bewegt das Dokument hinter dem Dialog NICHT').toBe(vorher)

  // «?» bleibt trotzdem ein Toggle — das war der Grund für die Ausnahme, und er
  // muss ohne sie weiter tragen.
  await page.keyboard.press('?')
  await expect(dialog).toBeHidden()
})

test('R4/B2: kein Angebot, wenn die gemerkte Stelle der Dokumentanfang ist', async ({ page }) => {
  // §9-Bug-Check B2. Der Lese-Effekt lief schon im Zwischen-Render
  // (`erlass` da, `eintraege` noch null), setzte den Ref-Riegel und verglich
  // gegen einen Dokumentanfang, den er noch gar nicht kannte — die
  // Unterdrückung griff nie und der Chip bot «Weiterlesen bei Art. 1» an,
  // während man bei scrollY 0 exakt dort stand.
  await page.goto(ERLASS)
  await readerBereit(page)
  await leseBis(page, 12)

  // Den gemerkten Eintrag auf den ERSTEN Artikel umschreiben. Gesät wird nur das
  // Token/Label — der `stand` bleibt der echte, von der App selbst geschriebene
  // Wert (sonst schlüge die Invalidierung zu und der Test bewiese nichts).
  // Der Weg über echtes Scrollen führt hier nicht ans Ziel: am Dokumentanfang
  // liegt der erste Artikel UNTER der Spy-Bezugslinie, der Spy meldet also
  // zurecht gar keinen Artikel.
  await page.evaluate((k) => {
    const alle = JSON.parse(localStorage.getItem(k) ?? '[]')
    const erster = (document.querySelector('[id^="art-"]') as HTMLElement).id.replace(/^art-/, '')
    alle[0] = { ...alle[0], token: erster, label: `Art. ${erster}` }
    localStorage.setItem(k, JSON.stringify(alle))
  }, SPEICHER)

  await page.goto(ERLASS)
  await readerBereit(page)
  await page.waitForTimeout(1500) // dem Chip Zeit geben, falls er fälschlich käme
  await expect(page.locator('[data-weiterlesen]')).toHaveCount(0)
})

test('B5 (Fremdfund #429): das Gliederungs-Sheet benennt den gelesenen Artikel in «Sie sind hier»', async ({ page }) => {
  // `inhalt.tsx` schlug den vom Spy gemeldeten LABEL-Wert in der TOKEN-Map nach
  // (`artLabelByToken.get(aktArtikel)`), während `inhalt-hooks.tsx` dort das
  // fertige Label hineinsetzt. Ergebnis: `siePfadArtikel` war IMMER null und die
  // Artikel-Angabe im Sheet fehlte seit #429 dauerhaft — still, weil der Pfad
  // allein die Zeile schon füllt.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(ERLASS)
  await readerBereit(page)
  await leseBis(page, 12)

  await page.getByRole('button', { name: /Gliederung/ }).first().click()
  const sieHier = page.locator('[data-sie-sind-hier]')
  await expect(sieHier).toBeVisible({ timeout: 20000 })
  await expect(sieHier, '«Sie sind hier» nennt den gelesenen Artikel, nicht nur den Pfad').toContainText(/Art\.\s?\d/)
})

test('R8/A9: «?»-Overlay unter CPU-Drossel — flüssig und ohne Layout-Sprung (CLS 0)', async ({ page }) => {
  await page.goto(ERLASS)
  await readerBereit(page)
  const client = await page.context().newCDPSession(page)
  await client.send('Emulation.setCPUThrottlingRate', { rate: DROSSEL })
  // Messfenster erst NACH dem Seitenaufbau scharf schalten: gemessen wird die
  // Interaktion, nicht der Ladevorgang (Begründung in helpers/cls.ts).
  await clsBeobachtenInstallieren(page, false, true)

  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('?')
    await expect(page.getByRole('dialog', { name: 'Tastatur-Kurzbefehle' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Tastatur-Kurzbefehle' })).toBeHidden()
  }

  const { cls, bericht } = await clsAuslesen(page)
  // Das Overlay ist `fixed` — es darf im Dokument NICHTS verschieben. Budget wie
  // in den übrigen A9-Specs (0.05), erwartet wird 0.
  expect(cls, `CLS ${cls} — ${bericht}`).toBeLessThanOrEqual(0.05)
})
