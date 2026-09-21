// @shard-gruppe: 1
// FAHRPLAN-LESER-V3, Etappe H2 (Kap. 4b Pos. 5) — die Trefferliste ist ein
// VERZEICHNIS in Erlass-Reihenfolge, je Artikel gruppiert.
//
// Abnahme-Satz der H2-Zeile: «Treffer stehen in Erlass-Reihenfolge je Artikel
// gruppiert». Beides wird hier am gemalten DOM geprüft — die reine Sortierregel
// selbst liegt in `src/tests/leser-suche-w219.test.ts` (S4, ohne Browser, samt
// Mutanten-Test). Hier zählt nur, ob die Hülle liefert, was die Regel zusagt.
//
// STPO (480 Artikel): gross genug, dass eine Relevanz-Rangfolge die Liste
// sichtbar durchmischt hätte, und mit «Entschädigung» ein Begriff, der über den
// ganzen Erlass verstreut vorkommt.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const suchFeld = (page: Page) => page.locator('[data-v3-suchsprung] input')

async function oeffneStPO(page: Page): Promise<string[]> {
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/STPO')
  await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
  await expect(suchFeld(page)).toBeVisible({ timeout: 20_000 })
  return fehler
}

/** Dokument-Position jedes gelisteten Artikels, gemessen am ECHTEN Lesetext. */
async function listenPositionen(page: Page): Promise<number[]> {
  return page.evaluate(() => {
    const alle = [...document.querySelectorAll('article[id^="art-"]')].map((a) => a.id)
    return [...document.querySelectorAll('[data-treffer-artikel]')]
      .map((li) => alle.indexOf(`art-${li.getAttribute('data-treffer-artikel')}`))
      .filter((i) => i >= 0)
  })
}

// ── Ä103 (18.8.2026) · DER ZÄHLER NENNT SEINE EINHEIT ───────────────────────
// V3 schreibt seit der Säuberung «Fundstelle 3 von 17», die Ist-Hülle weiter
// «3/17»; vor dem ersten Sprung stand dort «–/17» — ein Bruch ohne Zähler.
// Die Sonden prüfen darum die ZAHLEN, nicht das Trennzeichen: `laufendeStelle`
// zieht die erste Zahl heraus (ohne zweite Zahl = «–», also 0). Die
// Prüfaussage ist unverändert (§6.3-Deklaration).
async function laufendeStelle(page: import('@playwright/test').Page): Promise<number> {
  const t = await page.locator('[data-treffer-position]').innerText()
  const zahlen = t.match(/\d+/g)?.map(Number) ?? []
  return zahlen.length >= 2 ? zahlen[0] : 0
}

test.describe('H2 — Trefferliste in Erlass-Reihenfolge, je Artikel gruppiert', () => {
  test('(a) die Liste läuft mit dem Gesetz mit, nicht nach Relevanz', async ({ page }) => {
    test.slow()
    const fehler = await oeffneStPO(page)

    await suchFeld(page).fill('Entschädigung')
    await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-treffer-artikel]').first()).toBeVisible({ timeout: 30_000 })

    const pos = await listenPositionen(page)
    expect(pos.length, 'zu wenige Treffer für eine Reihenfolge-Aussage').toBeGreaterThan(3)
    // STRIKT aufsteigend: Dokument-Position ist je Artikel eindeutig, also gibt
    // es keinen Gleichstand, den eine zweite Stufe brechen müsste.
    expect(pos, `Listen-Reihenfolge: ${pos.join(',')}`).toEqual([...pos].sort((a, b) => a - b))
    expect(new Set(pos).size).toBe(pos.length)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(b) jeder Gruppenkopf steht GENAU EINMAL — in der Rangfolge sprang er hin und her', async ({ page }) => {
    test.slow()
    const fehler = await oeffneStPO(page)
    await suchFeld(page).fill('Entschädigung')
    await expect(page.locator('[data-treffer-artikel]').first()).toBeVisible({ timeout: 30_000 })

    // §6.3-DEKLARATION (Ä102, 18.8.2026): der Anker wandert, die geprüfte Sache
    // nicht. Bis heute hing der Locator an der KLASSE `lc-overline` — also am
    // Aussehen. Ä102 hat den Zwischenkopf aus der Versal-Overline in
    // Normalschreibung genommen (die Ellipse traf den Gliederungsort, eine
    // Kernauskunft); der Wächter hängt jetzt an der Identität
    // `data-treffer-gruppe`. Dieselbe Lehre wie der `data-fn-ref`-Fix aus H2.
    const koepfe = await page.locator('[data-treffer-liste] li[data-treffer-gruppe]').allInnerTexts()
    expect(koepfe.length, 'keine Gruppenköpfe — Testfall trägt nicht').toBeGreaterThan(1)
    expect(new Set(koepfe).size, `doppelte Gruppenköpfe: ${koepfe.join(' | ')}`).toBe(koepfe.length)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(c) der aktive Artikel klappt auf und zeigt eine Zeile JE Fundstelle', async ({ page }) => {
    test.slow()
    const fehler = await oeffneStPO(page)
    await suchFeld(page).fill('Entschädigung')
    await expect(page.locator('[data-treffer-artikel]').first()).toBeVisible({ timeout: 30_000 })

    // Einen Artikel mit MEHR ALS EINER Fundstelle wählen — an einem Artikel mit
    // genau einer Stelle bewiese «eine Zeile» nichts über die Gruppierung.
    // Die Auswahl läuft über die Daten am Element, nicht über einen
    // Playwright-Filter: `data-fundstellen-zahl` ist eine ZAHL, und ein
    // «hat-Kind»-Filter kann Zahlen nicht vergleichen.
    const wahl = await page.evaluate(() => {
      for (const li of document.querySelectorAll('[data-treffer-artikel]')) {
        const n = Number(li.getAttribute('data-fundstellen-zahl') ?? '0')
        if (n > 1) return { token: li.getAttribute('data-treffer-artikel'), zahl: n }
      }
      return null
    })
    expect(wahl, 'kein Artikel mit mehr als einer Fundstelle — Testfall trägt nicht').not.toBeNull()
    const { token, zahl } = wahl!

    // ── §6.3-UMSTELLUNG D38 (David 7.9.2026) · WIE DER ARTIKEL AUFKLAPPT ─────
    // Hier stand ein KLICK auf den Artikelkopf. Der springt seit je zur ersten
    // Fundstelle und klappte nebenbei auf; solange die Liste NEBEN dem Text lag,
    // sah man beides. Über dem Text kann sie nach dem Sprung nicht stehen
    // bleiben — sie verdeckte genau den Wortlaut, in den der Klick führt
    // (`leser-v3-suche-ohne-gliederung` (c)). Der Kopf-Klick ist damit die
    // Geste «dahin», nicht «zeig mir mehr».
    // AUFGEKLAPPT WIRD DER ARTIKEL, IN DEM DIE ↑↓-NAVIGATION STEHT — das war
    // schon vorher der tragende Zweig (`offen = aktiv || handAuf`,
    // `v3/LeserTrefferListe.tsx`) und ist der einzige, der ohne Sprung
    // auskommt. Die Sonde schreitet darum mit ↓ bis zu dem gewählten Artikel
    // vor, statt ihn anzuklicken. Was sie prüft — eine Zeile JE Fundstelle,
    // genau eine davon aktiv — ist unverändert.
    const vor = page.locator('[data-treffer-vor]')
    await expect(vor, 'kein ↓-Griff in der Werkzeugzeile — Vorbedingung fehlt (§6.7)').toHaveCount(1)
    let erreicht = false
    for (let i = 0; i < 60 && !erreicht; i += 1) {
      await vor.click()
      erreicht = await page.locator(`[data-treffer-artikel="${token}"][data-fundstellen-zahl]`)
        .evaluate((el) => el.querySelector('[data-treffer-stelle]') !== null)
        .catch(() => false)
    }
    expect(erreicht, `↓ hat Artikel ${token} in 60 Schritten nicht erreicht`).toBe(true)

    // Aufgeklappt: so viele Fundstellen-Zeilen wie der Zähler nennt (bis zum
    // Deckel von 40 — der Zähler bleibt datenseitig und nennt die volle Zahl).
    const stellen = page.locator(`[data-treffer-artikel="${token}"] [data-treffer-stelle]`)
    await expect(stellen.first()).toBeVisible({ timeout: 20_000 })
    expect(await stellen.count()).toBe(Math.min(zahl, 40))

    // Genau EINE Zeile ist die laufende Fundstelle (die ↑↓-Position).
    await expect(page.locator('[data-treffer-stelle-aktiv="1"]')).toHaveCount(1)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(d) ↓ im Suchfeld rückt die laufende Fundstelle vor', async ({ page }) => {
    test.slow()
    const fehler = await oeffneStPO(page)
    await suchFeld(page).fill('Entschädigung')
    await expect(page.locator('[data-treffer-position]')).toBeVisible({ timeout: 30_000 })

    await suchFeld(page).focus()
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => laufendeStelle(page), { timeout: 20_000 }).toBe(1)
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => laufendeStelle(page), { timeout: 20_000 }).toBe(2)
    await page.keyboard.press('ArrowUp')
    await expect.poll(() => laufendeStelle(page), { timeout: 20_000 }).toBe(1)

    // Und der Text bleibt beim Feld: ↑↓ dürfen die Schreibmarke nicht bewegen
    // und nichts an der Eingabe ändern.
    await expect(suchFeld(page)).toHaveValue('Entschädigung')
    await expect(suchFeld(page)).toBeFocused()

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(e) Suchbereich «Fussnoten» ändert Zähler und Liste', async ({ page }) => {
    test.slow()
    const fehler = await oeffneStPO(page)
    await suchFeld(page).fill('Entschädigung')
    await expect(page.locator('[data-treffer-artikel]').first()).toBeVisible({ timeout: 30_000 })
    const alle = await page.locator('[data-treffer-artikel]').count()

    // «Titel» ist eine echte Teilmenge: Randtitel + Gliederung, nie Fliesstext.
    await page.locator('[data-v3-bereich="titel"]').click()
    await expect.poll(async () => page.locator('[data-treffer-artikel]').count(), { timeout: 20_000 })
      .toBeLessThan(alle)
    await expect(page.locator('[data-v3-bereich="titel"]')).toHaveAttribute('aria-checked', 'true')

    // Zurück auf «Alles» ⇒ wieder die volle Menge (der Bereich ist ein Filter,
    // kein zweiter Suchlauf mit eigener Semantik).
    await page.locator('[data-v3-bereich="alles"]').click()
    await expect.poll(async () => page.locator('[data-treffer-artikel]').count(), { timeout: 20_000 })
      .toBe(alle)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})
