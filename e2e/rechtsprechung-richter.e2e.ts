// @shard-gruppe: 2
// Richter-/Spruchkörper-Facette der Übersicht /rechtsprechung (R-RICHTER Block B).
//
// Prüft die Achse end-to-end gegen den ECHTEN Korpus: eintippen → auswählen →
// die Liste zeigt nur Entscheide dieser Person (im Reader am amtlichen
// Besetzungs-Feld nachgewiesen), kombinierbar mit der Gemeinwesen-/Gericht-
// Achse, ehrlicher Leerzustand, a11y-Rollen der Combobox, kein Mobil-Overflow.
//
// Fixture-Person: Stephan Wullschleger (Appellationsgericht BS) — 692 Entscheide,
// ausschliesslich Kanton BS (am Register verifiziert 20.7.2026). Aus dieser
// Verteilung folgt der Kombinations-Test: Richter + «Bund» muss LEER sein.
import { test, expect, type Page, type TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const RICHTER_NAME = 'Wullschleger'
const RICHTER_SLUG = 'wullschleger-stephan'

function feld(page: Page) {
  return page.getByRole('combobox', { name: 'Nach Richter:in filtern' })
}

/** Optionen NUR der Richter-Listbox — role=option matcht sonst auch die
 *  <option>-Elemente des nativen Sortierungs-<select> derselben Toolbar. */
function optionen(page: Page) {
  return page.getByRole('listbox', { name: 'Richter:innen' }).getByRole('option')
}

/** Trefferzahl aus dem Ergebnis-Zähler («<n> Entscheide») der Übersicht.
 *  Test-Infrastruktur an deklarierte Format-Änderung LM-119/121 angepasst
 *  (§6.3-Ausnahme, deklarierter Schritt, CI-Nachzug PR #676): der Zähler
 *  zeigt ab 1000 tausendergruppiert («5'093», typografie.tsx zahlGruppiert),
 *  der Apostroph-Trenner gehört zur Zahl — die Regex akzeptiert ihn dort. */
async function trefferZahl(page: Page): Promise<number> {
  const txt = await page.getByText(/^[\d'’\u00A0\u202F]+\s+Entscheide?$/).first().innerText()
  return Number(txt.replace(/\D+/g, ''))
}

async function waehleRichter(page: Page, name = RICHTER_NAME) {
  await feld(page).click()
  await feld(page).fill(name)
  const option = optionen(page).filter({ hasText: name }).first()
  await expect(option).toBeVisible()
  const zahl = Number((await option.innerText()).match(/(\d+)\s*$/)?.[1] ?? '0')
  await option.click()
  return zahl
}

test.describe('/rechtsprechung — Richter-Facette', () => {
  test('filtert auf eine bekannte Richter:in und zeigt nur deren Entscheide', async ({ page }) => {
    await page.goto('/rechtsprechung')
    await expect(page.getByRole('heading', { name: 'Rechtsprechung' }).first()).toBeVisible()
    // Ungefilterte Ausgangsmenge (Kontrast zum gefilterten Stand).
    const vorher = await trefferZahl(page)
    expect(vorher).toBeGreaterThan(1000)

    const optionZahl = await waehleRichter(page)
    expect(optionZahl).toBeGreaterThan(0)

    // Die Achse ist teilbar (URL) und sichtbar (Aktiv-Chip mit Namen).
    await expect(page).toHaveURL(new RegExp(`richter=${RICHTER_SLUG}`))
    await expect(page.getByRole('button', { name: new RegExp(`Richter-Filter .*${RICHTER_NAME}.* entfernen`) })).toBeVisible()

    // R15: die Zahl am Namen ist die ECHTE Resttreffer-Zahl, nicht ein Korpus-Wert.
    const nachher = await trefferZahl(page)
    expect(nachher).toBe(optionZahl)
    expect(nachher).toBeLessThan(vorher)

    // Und die Treffer sind wirklich ihre: der erste Entscheid führt die Person im
    // amtlichen Besetzungs-Feld des Readers (kein Vertrauen auf das Manifest allein).
    await page.locator('a[href^="/rechtsprechung/"]').first().click()
    await expect(page).toHaveURL(/\/rechtsprechung\/.+/)
    await expect(page.getByText('Besetzung', { exact: false }).first()).toBeVisible()
    await expect(page.getByText(RICHTER_NAME, { exact: false }).first()).toBeVisible()
  })

  test('kombiniert mit der Gemeinwesen-/Gericht-Achse (echte Schnittmenge)', async ({ page }) => {
    await page.goto('/rechtsprechung')
    const bundVorher = page.getByRole('button', { name: /^Gemeinwesen: Bund \(\d+\)$/ })
    await expect(bundVorher).toBeVisible()

    const nurRichter = await waehleRichter(page)

    // Die Achsen greifen WIRKLICH ineinander: die Person urteilt ausschliesslich
    // am Appellationsgericht BS, also hat «Bund» in diesem Ausschnitt null Treffer
    // — und die Leiste blendet die unmögliche Option aus, statt einen Klick ins
    // Leere anzubieten (R15/Null-Prune). Genau das ist der Kombinations-Beweis.
    await expect(page.getByRole('button', { name: /^Gemeinwesen: Bund \(\d+\)$/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: `Gemeinwesen: Kantone (${nurRichter})` })).toBeVisible()

    // Zusätzlich den Kanton-Drilldown schneiden: BS ändert an SEINER Menge nichts.
    await page.getByRole('button', { name: `Gemeinwesen: BS (${nurRichter})` }).click()
    expect(await trefferZahl(page)).toBe(nurRichter)
    await expect(page).toHaveURL(new RegExp(`richter=${RICHTER_SLUG}`))

    // Richter-Filter entfernen → «Bund» ist wieder wählbar, die Menge wächst.
    await page.getByRole('button', { name: new RegExp(`Richter-Filter .*${RICHTER_NAME}.* entfernen`) }).click()
    await expect(page).not.toHaveURL(/richter=/)
    expect(await trefferZahl(page)).toBeGreaterThan(nurRichter)
  })

  test('zeigt einen ehrlichen Leerzustand statt eines Fehlers', async ({ page }) => {
    await page.goto('/rechtsprechung')
    await feld(page).click()
    // Vor der ersten Eingabe steht kein Fehler (§13/C2) — nur Vorschläge.
    await expect(optionen(page).first()).toBeVisible()
    await feld(page).fill('zzzzzzz')
    // Wortlaut geändert 20.7.2026 (fachliche Änderung, §6.3 deklariert): der frühere
    // Satz «Keine Richter:in mit diesem Namen im aktuellen Ausschnitt» war bei der
    // häufigsten Eingabeform SACHLICH FALSCH — «Thomas Stadelmann» lief hinein,
    // obwohl die Person im Ausschnitt ist (nur unter dem Nachnamen-Eimer erfasst).
    // Die Suche findet das jetzt; der Leerzustand nennt zusätzlich den Grund.
    await expect(page.getByText('Kein Treffer im aktuellen Ausschnitt', { exact: false })).toBeVisible()
    await expect(optionen(page)).toHaveCount(0)
    // Die Trefferliste bleibt unangetastet, solange nichts gewählt ist.
    await expect(page).not.toHaveURL(/richter=/)

    // REGRESSION (20.7.2026): ohne Listbox darf die Combobox weder «expanded»
    // melden noch per aria-controls auf eine nicht existierende Id zeigen — das
    // war ein axe-CRITICAL (`aria-valid-attr-value`), den der a11y-Scan unten
    // NICHT sah, weil er nur den befüllten Zustand prüfte.
    await expect(feld(page)).toHaveAttribute('aria-expanded', 'false')
    expect(await feld(page).getAttribute('aria-controls')).toBeNull()
    const leerBefund = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['link-in-text-block'])
      .analyze()
    expect(
      leerBefund.violations
        .filter((v) => v.impact === 'critical' || v.impact === 'serious')
        .map((v) => `${v.id} (${v.impact}): ${v.help}`),
      'axe Richter-Facette LEERZUSTAND: keine critical/serious-Verstösse',
    ).toEqual([])
  })

  test('meldet die leere Schnittmenge ehrlich, ohne den Richter-Filter zu verwerfen', async ({ page }) => {
    await page.goto('/rechtsprechung')
    await waehleRichter(page)
    // Freitext-Achse mit einem Begriff, den kein Entscheid dieser Person trägt.
    await page.getByRole('searchbox', { name: 'Filtern' }).fill('zzzzzzzq')
    await expect(page.getByText('Kein Entscheid gefunden', { exact: false })).toBeVisible()
    // §8: der Richter-Filter wird NICHT stillschweigend fallen gelassen, nur weil
    // die Schnittmenge leer ist — er bleibt sichtbar und in der URL.
    await expect(page).toHaveURL(new RegExp(`richter=${RICHTER_SLUG}`))
    await expect(page.getByRole('button', { name: new RegExp(`Richter-Filter .*${RICHTER_NAME}.* entfernen`) })).toBeVisible()
  })

  test('«zurücksetzen» räumt Richter- UND Norm-Achse gemeinsam aus der URL', async ({ page }) => {
    // REGRESSION (20.7.2026): zwei URL-Achsen wurden in EINEM Handler nacheinander
    // geschrieben, beide auf demselben veralteten params-Stand — der zweite Schreib-
    // vorgang machte die Löschung des ersten rückgängig, `?norm=` überlebte das
    // Zurücksetzen. Die Richter-Achse war die erste zweite Achse und deckte es auf.
    await page.goto(`/rechtsprechung?richter=${RICHTER_SLUG}&norm=sr_210`)
    await expect(feld(page)).toBeVisible()
    await expect(page.getByRole('button', { name: new RegExp(`Richter-Filter .*${RICHTER_NAME}.* entfernen`) })).toBeVisible()

    await page.getByText('zurücksetzen', { exact: true }).first().click()

    await expect(page).not.toHaveURL(/richter=/)
    await expect(page).not.toHaveURL(/norm=/)
  })

  test('bedient die ARIA-Combobox-Rollen und die Tastatur', async ({ page }) => {
    await page.goto('/rechtsprechung')
    const eingabe = feld(page)
    await expect(eingabe).toHaveAttribute('aria-expanded', 'false')
    await eingabe.click()
    await expect(eingabe).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('listbox', { name: 'Richter:innen' })).toBeVisible()

    // Pfeil-Auswahl setzt aria-activedescendant auf die hervorgehobene Option.
    await eingabe.fill(RICHTER_NAME)
    await eingabe.press('ArrowDown')
    const aktiv = await eingabe.getAttribute('aria-activedescendant')
    expect(aktiv).toBeTruthy()
    // Attribut-Selektor statt #id: die useId()-Ids enthalten Doppelpunkte.
    await expect(page.locator(`[id="${aktiv}"]`)).toHaveAttribute('aria-selected', 'true')
    // Enter übernimmt die hervorgehobene Person.
    await eingabe.press('Enter')
    await expect(page).toHaveURL(new RegExp(`richter=${RICHTER_SLUG}`))
    await expect(eingabe).toHaveAttribute('aria-expanded', 'false')
  })

  test('a11y: keine critical/serious-Verstösse mit geöffneter Listbox', async ({ page }, testInfo: TestInfo) => {
    // Theme deterministisch pinnen (sonst misst axe je nach Uhrzeit hell/dunkel).
    await page.addInitScript(() => {
      try { localStorage.setItem('lexmetrik-thema', 'hell') } catch { /* privater Modus */ }
    })
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
    await page.goto('/rechtsprechung')
    await feld(page).click()
    await feld(page).fill('e')
    await expect(optionen(page).first()).toBeVisible()

    const ergebnis = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Inline-Link-Marken ohne Unterstreichung = dokumentierter Markenentscheid
      // (a11y-BERICHT.md B-2), wie an allen anderen Prüfpunkten dieser Rubrik.
      .disableRules(['link-in-text-block'])
      .analyze()
    const schwer = ergebnis.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    if (ergebnis.violations.length > 0) {
      await testInfo.attach('richter-facette-befunde.json', {
        body: JSON.stringify(ergebnis.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help })), null, 2),
        contentType: 'application/json',
      })
    }
    expect(
      schwer.map((v) => `${v.id} (${v.impact}): ${v.help} — z. B. ${v.nodes[0]?.target.join(' ')}`),
      'axe rechtsprechung-richter-facette: keine critical/serious-Verstösse',
    ).toEqual([])
  })

  test('kein horizontaler Overflow bei 390px mit geöffneter Liste', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/rechtsprechung')
    // §6.3-FACHÄNDERUNG (W2·10-UI-NAV-J2, 8.8.2026): Unter 1024 px wohnt der
    // Filterblock seit J2 im «Filter»-Bottom-Sheet, damit die Treffer mobil
    // nicht erst unter der ganzen Steuerleiste beginnen. Das Richter-Feld ist
    // dort also erst NACH dem Öffnen erreichbar — das Verhalten hat sich
    // gewollt geändert, darum wird dieser Schritt hier ergänzt und nicht die
    // Zusicherung aufgeweicht. GEPRÜFT WIRD UNVERÄNDERT DASSELBE: dass die
    // geöffnete Vorschlagsliste bei 390 px keinen Seitwärts-Überlauf erzeugt.
    await page.getByRole('button', { name: /^Filter/ }).click()
    await expect(page.getByRole('dialog', { name: 'Filter' })).toBeVisible()
    await feld(page).click()
    await feld(page).fill(RICHTER_NAME)
    await expect(optionen(page).first()).toBeVisible()
    await page.screenshot({ path: 'e2e-shots/rechtsprechung-richter-mobil.png', fullPage: false })
    const b = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    expect(b.scroll, `scrollWidth ${b.scroll} > ${b.client}`).toBeLessThanOrEqual(b.client + 1)
  })

  // ── Regressionen der Gegenprüfung 20.7.2026 ────────────────────────────────
  test('findet die Person auch bei Eingabe «Vorname Nachname»', async ({ page }) => {
    // Die Bundesgerichts-Rubra nennen keine Vornamen — gut die Hälfte der
    // Facetten-Einträge ist reiner Nachname. Die natürliche Eingabe lief darum
    // vorher in den Leerzustand, obwohl die Person im Ausschnitt ist.
    await page.goto('/rechtsprechung')
    await feld(page).click()
    await feld(page).fill('Thomas Stadelmann')
    await expect(optionen(page).first()).toBeVisible()
    await expect(optionen(page).first()).toContainText('Stadelmann')
  })

  test('unbekannter Slug wird als kaputter Link ausgewiesen, nicht als Person', async ({ page }) => {
    await page.goto('/rechtsprechung?richter=gibts-nicht-xyz')
    await expect(page.getByText('im Register nicht bekannt', { exact: false })).toBeVisible()
  })

  test('«zurücksetzen» ist da, wenn Richter der einzige Filter ist', async ({ page }) => {
    // Der typische geteilte ?richter=-Link: der Leerzustand verwies auf ein
    // «zurücksetzen», das gar nicht gerendert wurde.
    await page.goto(`/rechtsprechung?richter=${RICHTER_SLUG}`)
    await expect(page.getByRole('button', { name: /zurücksetzen/i })).toBeVisible()
  })

  test('keine erfundenen Amtsträger:innen in der Facette', async ({ page }) => {
    // Rollenwörter/Fragmente, die vor dem Fix als wählbare Richter:innen standen.
    await page.goto('/rechtsprechung')
    // Geprüft wird die Abwesenheit des PHANTOM-LABELS, nicht eine leere Liste:
    // «Donzallaz Beusch» findet über die Nachnamen-Stufe zu Recht den echten
    // Bundesrichter Beusch — verboten ist nur der verschmolzene Eintrag selbst.
    for (const phantom of ['présidant', 'unica', 'federali Patrick Robert-Nicoud',
      'Donzallaz Beusch', 'de Yanick Felley', 'Heidrun Gutmanns-']) {
      await feld(page).click()
      await feld(page).fill(phantom)
      const exakt = new RegExp(`^${phantom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\d+$`, 'i')
      await expect(optionen(page).filter({ hasText: exakt })).toHaveCount(0)
      await feld(page).fill('')
    }
    // Gegenprobe: der REALE Richter, der zuvor als «de Yanick Felley» (Partikel am
    // Vornamen) im Register stand, ist jetzt korrekt erfasst — die Bereinigung hat
    // ihn nicht mitentfernt, sondern richtiggestellt.
    await feld(page).click()
    await feld(page).fill('Felley')
    await expect(optionen(page).first()).toHaveText(/^Yanick Felley\s*\d+$/)
  })
})
