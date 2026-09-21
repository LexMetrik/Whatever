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
import { test, expect, type Page } from '@playwright/test'

const REITER = 'nav[aria-label="Offene Reiter"]'
const STREIFEN = '[data-reiter-streifen]'
const aktiv = (page: Page) => page.locator(`${REITER} [data-reiter-aktiv="true"]`)

/** Die gespeicherten Reiter-ADRESSEN — die Wahrheit, die den Neustart übersteht. */
const pfade = (page: Page) => page.evaluate(() =>
  (JSON.parse(localStorage.getItem('lexmetrik-tabs') ?? '[]') as { path: string }[]).map((t) => t.path))

/** Die fünf Meta-Routen mit der Kurzform, die ihr Reiter tragen MUSS (§5a
 *  Ziff. 2: die kanonische Kurzform, nicht der SEO-Titel). */
const META: [string, string][] = [
  ['/ueber', 'Über'],
  ['/methodik', 'Methodik'],
  ['/einstellungen', 'Einstellungen'],
  ['/kontakt', 'Kontakt'],
  ['/datenschutz', 'Datenschutz'],
]

/** Jede Route der App, auf der die Leiste nie leer stehen darf: die fünf
 *  Meta-Routen, die beiden Dienst-Routen, die Sammlung, eine Bereichs-
 *  Übersicht und ein Dokument. */
const ALLE = [...META.map(([p]) => p), '/abdeckung', '/suche', '/', '/gesetze', '/gesetze/bund/OR']

test.describe.configure({ timeout: 120_000 })

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/kontakt')
  await page.evaluate(() => {
    localStorage.removeItem('lexmetrik-tabs')
    localStorage.removeItem('lexmetrik-tabs-zu')
  })
})

// ═══ A · JEDE META-ROUTE ÖFFNET IHREN REITER, MIT IHREM NAMEN ═══════════════
test('A — jede Meta-Route trägt genau einen Reiter mit ihrer Kurzform', async ({ page }) => {
  for (const [route, name] of META) {
    await page.goto(route)
    const reiter = page.locator(`${STREIFEN} [data-reiter-schluessel="${route}"]`)
    await expect(reiter, `${route} trägt keinen Reiter`).toHaveCount(1, { timeout: 20_000 })
    // Die Kurzform, nicht der SEO-Titel: «Kontakt», nicht «Kontakt aufnehmen».
    // `toContainText`: der Reiter trägt daneben die Vorlese-Nummer
    // («Reiter 1: ») und das Schliess-✕ — beides gehört ihm, nicht der
    // Aufschrift.
    await expect(reiter).toContainText(name)
    await expect(aktiv(page)).toContainText(name)
    // Aufgeräumt für die nächste Runde: `page.goto` ist ein Kaltstart und
    // hängt sonst an (`ersetzeTab`, Fall 3 «kein aktiver Reiter»).
    await page.evaluate(() => localStorage.removeItem('lexmetrik-tabs'))
  }
})

// ═══ B · DIE LEISTE STEHT AUF KEINER ROUTE LEER ═════════════════════════════
test('B — auf jeder Route steht mindestens ein Reiter, keiner ist «leer» markiert', async ({ page }) => {
  for (const route of ALLE) {
    await page.goto(route)
    await expect(page.locator(REITER)).toBeVisible({ timeout: 30_000 })
    await expect
      .poll(() => page.locator(`${STREIFEN} [data-reiter-schluessel]`).count(),
        { timeout: 20_000, message: `${route}: die Leiste steht leer` })
      .toBeGreaterThanOrEqual(1)
    // Das Attribut des 0-Reiter-Zustands existiert nicht mehr (ersatzlos, R14b).
    await expect(page.locator('[data-reiter-leer]')).toHaveCount(0)
  }
})

// ═══ C · EINE META-SEITE NAVIGIERT IM SELBEN REITER WIE JEDE SEITE ══════════
test('C — der Weg von der Übersicht auf die Meta-Seite kostet keinen Reiter', async ({ page }) => {
  await page.goto('/gesetze')
  await expect.poll(() => pfade(page), { timeout: 20_000 }).toEqual(['/gesetze'])

  // SPA-Klick auf den Fuss-Link (kein `page.goto`: das wäre ein Kaltstart und
  // ersetzt bewusst nichts — dieselbe Nachbau-Treue wie in
  // `w224-reiterverhalten.e2e.ts`).
  await page.locator('a[href="/ueber"]').first().click()
  await expect(page).toHaveURL(/\/ueber$/, { timeout: 20_000 })
  // ERSETZT, nicht angehängt — die Browser-Regel von §5a Ziff. 3 gilt jetzt
  // auch für Meta-Seiten. Bis R14b entstand hier gar kein Reiter, und der
  // Übersichts-Reiter blieb als tote Herkunft stehen (R14-Prüfung §1.4).
  await expect.poll(() => pfade(page), { timeout: 10_000 }).toEqual(['/ueber'])
  await expect(aktiv(page)).toContainText('Über')

  // Registerfarbe: eine Meta-Route hat kein Register — die Marke bleibt Tinte,
  // geraten wird keine Farbe (§8, R1-Zweig in `reiterleiste/Reiter.tsx`).
  const farbe = await page.locator(`${STREIFEN} [data-reiter-schluessel="/ueber"] span[aria-hidden]`)
    .first().evaluate((e) => getComputedStyle(e).backgroundColor)
  const tinte = await page.evaluate(() => {
    const s = document.createElement('span')
    s.className = 'bg-ink-900'
    document.body.appendChild(s)
    const c = getComputedStyle(s).backgroundColor
    s.remove()
    return c
  })
  expect(farbe, 'der aktive Meta-Reiter trägt Tinte, keine geratene Registerfarbe').toBe(tinte)

  // Und der Neustart findet denselben einen Reiter wieder (Persistenz).
  await page.reload()
  await expect.poll(() => pfade(page), { timeout: 20_000 }).toEqual(['/ueber'])
})

// ═══ D · DER LETZTE ✕ AUF EINEM META-REITER FÜHRT IN DIE SAMMLUNG ═══════════
test('D — der letzte ✕ auf einem Meta-Reiter lässt die Sammlung stehen, nie das Nichts', async ({ page }) => {
  await page.goto('/methodik')
  await expect.poll(() => pfade(page), { timeout: 20_000 }).toEqual(['/methodik'])

  await page.locator(`${REITER} .lc-schliessknopf`).first().click()
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })
  await expect(page.locator(`${STREIFEN} [data-reiter-schluessel]`)).toHaveCount(1)
  await expect(aktiv(page)).toContainText('Sammlung')

  // Alt+⇧+T bringt den Meta-Reiter zurück — er lag im Schliess-Ring wie jedes
  // andere Dokument (R11-M3), nicht ausserhalb.
  await page.keyboard.press('Alt+Shift+T')
  await expect(page).toHaveURL(/\/methodik$/, { timeout: 20_000 })
  await expect.poll(() => pfade(page), { timeout: 10_000 }).toEqual(['/methodik', '/'])
})
