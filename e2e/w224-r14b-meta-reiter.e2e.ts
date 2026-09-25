// @shard-gruppe: 2
// ═══ W2·24 · R14b — META-SEITEN SIND EBENFALLS REITER ═══════════════════════
//
// R14 (Entscheid David 7.9.2026) hat die Sammlung «/» zum Reiter gemacht und
// dabei EINE Grenze ausdrücklich offengelegt
// (`abnahme/design-identitaet/R14-REITER-MODELL.md`, «Offengelegte Grenze»):
// auf den Meta-Routen `/ueber`, `/methodik`, `/einstellungen`, `/kontakt`
// (und `/datenschutz`) blieb der 0-Reiter-Zustand bestehen — leerer 34-px-
// Streifen, Attribut `data-reiter-leer`, und `components/TabTracker.tsx` warf
// dort den aktiven Reiter als Herkunft weg (`aktiv.current = null`).
//
// R14b hebt auch diese Ausnahme auf: JEDE Route ist Reiterinhalt. `lib/tabs`
// führt keine Liste mehr, welcher Pfad einen Reiter trägt (`istReiterPfad` ist
// ersatzlos gestrichen, ebenso `BEREICHS_UEBERSICHTEN`, `data-reiter-leer` und
// alle vier `leer`-Zweige der Leiste).
//
// ROT ZU BEKOMMEN (§6.7 — je Zusage einzeln gefahren, 7.9.2026):
//   A  in `lib/tabs.KURZFORM` die Meta-Zeilen streichen ⇒ die Reiter heissen
//      «Wie LexMetrik rechnet», «Kontakt aufnehmen», «Datenschutzerklärung»
//      statt «Methodik», «Kontakt», «Datenschutz» — Fall A wird rot.
//   B  in `components/TabTracker.tsx` den R14b-Effekt wieder mit
//      `if (!istReiterPfad(pathname)) { aktiv.current = null; return }` klammern
//      (Funktion aus `lib/tabs` wiederherstellen) ⇒ die Meta-Routen tragen
//      keinen Reiter, die Fälle B und C werden rot.
//   C  in `Reiterleiste.schliessen` das `zurSammlung()` streichen (nur
//      `if (nachbar) navigate(nachbar.path)` stehen lassen) ⇒ der letzte ✕ auf
//      dem Meta-Reiter lässt 0 Reiter zurück und die Seite stehen, Fall D wird
//      rot. (`navigate('/')` STATT `zurSammlung()` genügt seit R14b NICHT mehr
//      als Rot-Weg: der TabTracker legt den Sammlungs-Reiter dann selbst an —
//      genau das ist der Gewinn dieses Nachzugs.)
//
// ═══ W2·29-WERKBANK-REST S3 (25.9.2026) · DIE ZUSAGE IST UMGEKEHRT ═══════════
// Der Kopf darüber bleibt als DATIERTER BELEG stehen (§0 Ziff. 2b) — er
// beschreibt den Stand bis `8cb868caa`. Entscheid David 19.9.2026: «keine
// reiter für meta seite». /ueber, /methodik, /einstellungen, /kontakt öffnen
// KEINEN Reiter mehr und ersetzen keinen; die Herkunft fällt weg (R14-Lehre,
// Herleitung `lib/tabs.oeffnetReiter`). Alle anderen Routen — auch
// /datenschutz, /abdeckung, /suche — bleiben Reiterinhalt (Fall B).
// Die Fälle A, C, D der R14b-Fassung prüften das Gegenteil und sind darum
// ERSETZT, nicht angepasst (deklarierte Fachänderung, Commit-Trailer).
//
// ROT ZU BEKOMMEN (§6.7, gefahren 25.9.2026 gegen dist/):
//   A/C  in `components/TabTracker.tsx` die Zeile
//        `if (!oeffnetReiter(pathname)) { aktiv.current = null; return; }`
//        streichen ⇒ jede Meta-Route legt ihren Reiter an bzw. ersetzt den
//        aktiven — A und C werden rot.
//   C    nur `aktiv.current = null;` in derselben Zeile streichen ⇒ kein
//        Meta-Reiter, aber der Folge-Klick ERSETZT den verlassenen Reiter
//        («/gesetze» weg, R14-Verlust) — C wird rot, A bleibt grün.
//
// ═══ S5c (25.9.2026) · /datenschutz WIRD FÜNFTE META-SEITE ═══════════════════
// Entscheid David 25.9.2026 («wie empfohlen»): /datenschutz öffnet ebenfalls
// keinen Reiter. Die Absätze darüber bleiben datierte Belege (§0 Ziff. 2b);
// die Aussage «auch /datenschutz bleibt Reiterinhalt» gilt seit S5c nicht
// mehr. `META` trägt jetzt fünf Routen, `REITER_ROUTEN` vier plus die zwei
// Dokument-/Übersichts-Routen. Rot seit S5c: in `lib/tabs.META_OHNE_REITER`
// '/datenschutz' streichen ⇒ Fall A wird auf /datenschutz rot.
import { test, expect, type Page } from '@playwright/test'

const REITER = 'nav[aria-label="Offene Reiter"]'
const STREIFEN = '[data-reiter-streifen]'
const aktiv = (page: Page) => page.locator(`${REITER} [data-reiter-aktiv="true"]`)

/** Die gespeicherten Reiter-ADRESSEN — die Wahrheit, die den Neustart übersteht. */
const pfade = (page: Page) => page.evaluate(() =>
  (JSON.parse(localStorage.getItem('lexmetrik-tabs') ?? '[]') as { path: string }[]).map((t) => t.path))

/** Die vier Meta-Routen des Entscheids 19.9.2026 plus /datenschutz
 *  (Entscheid David 25.9.2026, S5c). */
const META = ['/ueber', '/methodik', '/einstellungen', '/kontakt', '/datenschutz']

/** Routen, die weiter Reiterinhalt sind (R14b unverändert): die übrigen
 *  statischen/Dienst-Routen, die Sammlung, eine Übersicht, ein Dokument. */
const REITER_ROUTEN = ['/abdeckung', '/suche', '/', '/gesetze', '/gesetze/bund/OR']

test.describe.configure({ timeout: 120_000 })

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/datenschutz')
  await page.evaluate(() => {
    localStorage.removeItem('lexmetrik-tabs')
    localStorage.removeItem('lexmetrik-tabs-zu')
  })
})

// ═══ A · KEINE META-ROUTE ÖFFNET EINEN REITER ═══════════════════════════════
test('A — jede Meta-Route bleibt ohne Reiter (Kaltstart)', async ({ page }) => {
  for (const route of META) {
    await page.evaluate(() => localStorage.removeItem('lexmetrik-tabs'))
    await page.goto(route)
    await expect(page.locator('main h1').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel="${route}"]`)).toHaveCount(0)
    await expect(aktiv(page)).toHaveCount(0)
    // SYNCHRONISATION statt Warten: der SPA-Klick auf die Marke legt die
    // Sammlung an (R14). Steht danach GENAU «/» im Speicher, war der Tracker
    // aktiv und die Meta-Route hat nichts angelegt — sonst stünde sie davor.
    await page.locator('a[href="/"]').first().click()
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })
    await expect.poll(() => pfade(page), { timeout: 20_000, message: `${route} hat einen Reiter angelegt` })
      .toEqual(['/'])
  }
})

// ═══ B · ALLE ÜBRIGEN ROUTEN BLEIBEN REITERINHALT ═══════════════════════════
test('B — auf jeder Nicht-Meta-Route steht ihr Reiter', async ({ page }) => {
  for (const route of REITER_ROUTEN) {
    await page.goto(route)
    await expect(page.locator(REITER)).toBeVisible({ timeout: 30_000 })
    await expect
      .poll(() => page.locator(`${STREIFEN} [data-reiter-schluessel]`).count(),
        { timeout: 20_000, message: `${route}: die Leiste steht leer` })
      .toBeGreaterThanOrEqual(1)
    await expect(page.locator('[data-reiter-leer]')).toHaveCount(0)
  }
})

// ═══ C · DIE META-SEITE LÄSST DEN REITER STEHEN — UND DIE HERKUNFT FALLEN ═══
test('C — Übersicht → Meta → Dokument: nichts ersetzt, nichts verloren', async ({ page }) => {
  await page.goto('/gesetze')
  await expect.poll(() => pfade(page), { timeout: 20_000 }).toEqual(['/gesetze'])

  // SPA-Klick auf den Fuss-Link (kein `page.goto`: das wäre ein Kaltstart).
  await page.locator('a[href="/ueber"]').first().click()
  await expect(page).toHaveURL(/\/ueber$/, { timeout: 20_000 })
  await expect(page.locator('main h1').first()).toContainText('Über LexMetrik')
  // Der Übersichts-Reiter bleibt stehen, keiner ist aktiv.
  await expect.poll(() => pfade(page), { timeout: 10_000 }).toEqual(['/gesetze'])
  await expect(aktiv(page)).toHaveCount(0)

  // Weiter aus dem Fliesstext auf /abdeckung (Reiterinhalt): der Reiter kommt
  // HINZU. Hielte der Tracker die Herkunft «/gesetze» fest, ERSETZTE er ihn —
  // der gemessene R14-Verlust.
  await page.locator('main a[href="/abdeckung"]').first().click()
  await expect(page).toHaveURL(/\/abdeckung$/, { timeout: 20_000 })
  await expect.poll(() => pfade(page), { timeout: 10_000 }).toEqual(['/gesetze', '/abdeckung'])
  await expect(aktiv(page)).toHaveCount(1)
})

// ═══ D · NEUSTART AUF DER META-SEITE ════════════════════════════════════════
test('D — Neuladen auf einer Meta-Seite lässt die Reiter unberührt', async ({ page }) => {
  await page.goto('/gesetze/bund/OR')
  await expect.poll(() => pfade(page), { timeout: 20_000 }).toEqual(['/gesetze/bund/OR'])
  await page.goto('/einstellungen')
  await expect(page.locator('main h1').first()).toContainText('Einstellungen')
  await page.reload()
  await expect(page.locator('main h1').first()).toContainText('Einstellungen')
  await expect(page.locator(`${STREIFEN} [data-reiter-schluessel="/gesetze/bund/OR"]`)).toHaveCount(1, { timeout: 20_000 })
  await expect(aktiv(page)).toHaveCount(0)
  expect(await pfade(page)).toEqual(['/gesetze/bund/OR'])
})
