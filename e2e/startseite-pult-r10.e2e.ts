// @shard-gruppe: 3
// ─── W2·24-DESIGN-IDENTITAET R10 · Die Startseite als Pult ──────────────────
//
// NEUER WÄCHTER (§6.3-Deklaration: neue Prüfung zu neuem Verhalten). Geprüft
// wird, was am Referenzbild `abnahme/design-identitaet/pult-freigegeben.html`
// eine ZUSAGE ist und im Browser scheitern kann — nicht die Optik:
//
//   1. WERKSEINSTELLUNG (= was der Prerender ausliefert): Systematik, Frist und
//      Entscheide offen; Kantone und Materialien-nach-Behörde zu, aber mit
//      Schalter da. Vorgabe David 6.9.2026.
//   2. DER SCHALTER WIRKT und ÜBERLEBT das Neuladen (localStorage).
//   3. DIE REIHENFOLGE lässt sich im Blatt «Startseite anpassen» per Pfeilen
//      ändern und überlebt ebenfalls; «Werkseinstellung» nimmt alles zurück.
//   4. KEIN SPRUNG beim Laden mit gespeicherter Anordnung (§15): die Seite darf
//      nicht erst die Werkseinstellung zeigen und dann sichtbar umbauen.
//   5. DIE FÜNF BEREICHE stehen in einer Reihe und tragen ECHTE Zahlen aus dem
//      Zähler-Generat, keine Beispielwerte (§8).
//
// ROT-PROBE (§6.7, ausgeführt 6.9.2026, beide Mutationen einzeln gefahren):
//   · `standard: false` → `true` an den beiden zugeklappten Modulen: 3 Fälle rot
//     («Kantone, erfasste Erlasse: zu» — der Inhalt stand offen da).
//   · `rohLesen()` gibt immer `null` (gespeicherter Stand wird ignoriert):
//     4 Fälle rot — Schalter überlebt das Neuladen nicht, Umordnung greift
//     nicht, die vorgeschriebene Anordnung wird beim Laden nicht übernommen.
import { test, expect, type Page } from '@playwright/test'

const OFFEN = ['Bundesrecht, systematische Ordnung', 'Frist berechnen', 'Jüngste Entscheide im Korpus']
const ZU = ['Kantone, erfasste Erlasse', 'Amtliche Materialien nach Behörde']

/** Der Schalter einer Modulzeile (der Accessible Name nennt das Modul). */
const schalter = (page: Page, titel: string) =>
  page.getByRole('button', { name: new RegExp(`^${titel} (anzeigen|ausblenden)$`) })

/** Der Inhalt eines Moduls — sichtbar genau dann, wenn das Modul offen ist. */
const inhalt = (page: Page, titel: string) =>
  page.getByRole('region', { name: titel }).locator('> div').nth(1)

/** Die Modul-Kürzel in ANZEIGE-Reihenfolge (CSS `order`, nicht DOM-Ordnung).
 *  Gelesen am `data-pult-modul`-Marker, nicht am Titel-Wortlaut. */
async function reihenfolge(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-pult-modul]')]
      .map((el) => ({
        id: el.getAttribute('data-pult-modul')!,
        ord: Number(getComputedStyle(el).order || '0'),
      }))
      .sort((a, b) => a.ord - b.ord)
      .map((z) => z.id))
}

/** Die Bereichs-Reihe des Pults. Der Name ist «Bereiche der Sammlung» — die
 *  Reiterleiste der Krone heisst «Bereiche», beide sind Landmarks. */
const bereiche = (page: Page) => page.getByRole('navigation', { name: 'Bereiche der Sammlung' })

/** Auf das Pult warten, bevor GEMESSEN wird.
 *
 *  Nach `goto` steht zwar das prerenderte HTML, die App tauscht es beim
 *  Hydrieren aber kurz gegen ihren Ladezustand. Eine Messung direkt nach
 *  `load` sah darum leere Listen (gemessen 6.9.2026: `linke Kanten: ` leer).
 *  Die Zusicherungen mit Auto-Retry (`expect(...)`) fangen das von selbst; für
 *  `page.evaluate`-Messungen braucht es diesen Riegel. */
async function pultBereit(page: Page): Promise<void> {
  await expect(page.locator('[data-pult-modul]')).toHaveCount(5)
  await expect(bereiche(page).getByRole('link')).toHaveCount(5)
}

test.describe('R10 · Werkseinstellung und Bereichs-Reihe', () => {
  test('Werkseinstellung: drei Module offen, zwei zu — alle fünf bedienbar', async ({ page }) => {
    await page.goto('/')
    for (const titel of OFFEN) {
      await expect(schalter(page, titel), `${titel}: Schalter da`).toBeVisible()
      await expect(inhalt(page, titel), `${titel}: offen`).toBeVisible()
    }
    for (const titel of ZU) {
      await expect(schalter(page, titel), `${titel}: Schalter da`).toBeVisible()
      await expect(inhalt(page, titel), `${titel}: zu`).toBeHidden()
    }
  })

  test('die fünf Bereiche stehen in einer Reihe und tragen gemessene Zahlen (§8)', async ({ page }) => {
    await page.goto('/')
    await pultBereit(page)
    const felder = bereiche(page).getByRole('link')
    for (const [i, name] of ['Gesetze', 'Rechtsprechung', 'Materialien', 'Rechner', 'Vorlagen'].entries()) {
      await expect(felder.nth(i)).toContainText(name)
      // Jede Zahl ist eine echte, positive Zahl — kein Platzhalter, kein «—».
      const text = (await felder.nth(i).innerText()).replace(/’|'/g, '')
      expect(text, `${name}: Zahl`).toMatch(/\d/)
    }
    // Alle fünf auf derselben Zeile (eine Reihe, @1440) — geprüft an der
    // Oberkante, nicht an der Spaltenzahl der CSS-Klasse.
    const oben = await felder.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)))
    expect(new Set(oben).size, `Oberkanten: ${oben.join(', ')}`).toBe(1)
  })

  test('@390 stehen die Bereiche zweispaltig', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await pultBereit(page)
    const felder = bereiche(page).getByRole('link')
    const links = await felder.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)))
    expect(new Set(links).size, `linke Kanten: ${links.join(', ')}`).toBe(2)
    // Und die Seite bläht sich nicht auf.
    const breite = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(breite).toBeLessThanOrEqual(390)
  })
})

test.describe('R10 · eigener Zustand', () => {
  test('der Schalter wirkt und überlebt das Neuladen', async ({ page }) => {
    await page.goto('/')
    await schalter(page, 'Kantone, erfasste Erlasse').click()
    await expect(inhalt(page, 'Kantone, erfasste Erlasse')).toBeVisible()
    await schalter(page, 'Frist berechnen').click()
    await expect(inhalt(page, 'Frist berechnen')).toBeHidden()

    await page.reload()
    await expect(inhalt(page, 'Kantone, erfasste Erlasse'), 'nach dem Neuladen offen').toBeVisible()
    await expect(inhalt(page, 'Frist berechnen'), 'nach dem Neuladen zu').toBeHidden()
  })

  test('das Blatt ordnet um, «Werkseinstellung» nimmt alles zurück', async ({ page }) => {
    await page.goto('/')
    await pultBereit(page)
    const vorher = await reihenfolge(page)
    expect(vorher).toEqual(['systematik', 'kantone', 'frist', 'entscheide', 'behoerden'])

    await page.getByRole('button', { name: 'Startseite anpassen' }).click()
    const blatt = page.getByRole('dialog', { name: 'Startseite anpassen' })
    await expect(blatt).toBeVisible()
    // Zweites Modul einen Platz hoch → es steht vorn.
    await blatt.getByRole('button', { name: 'Kantone, erfasste Erlasse nach oben' }).click()
    await expect.poll(() => reihenfolge(page)).toEqual(
      ['kantone', 'systematik', 'frist', 'entscheide', 'behoerden'])

    // Überlebt das Neuladen …
    await page.keyboard.press('Escape')
    await page.reload()
    await pultBereit(page)
    expect((await reihenfolge(page))[0]).toBe('kantone')

    // … und «Werkseinstellung» nimmt es zurück.
    await page.getByRole('button', { name: 'Startseite anpassen' }).click()
    await page.getByRole('dialog', { name: 'Startseite anpassen' })
      .getByRole('button', { name: 'Werkseinstellung' }).click()
    await expect.poll(() => reihenfolge(page)).toEqual(vorher)
  })

  test('alle Module aus: die Seite bleibt bedienbar, kein Titel über Leerraum', async ({ page }) => {
    await page.goto('/')
    for (const titel of OFFEN) await schalter(page, titel).click()
    for (const titel of [...OFFEN, ...ZU]) {
      await expect(inhalt(page, titel), `${titel}: zu`).toBeHidden()
      await expect(schalter(page, titel), `${titel}: wieder einschaltbar`).toBeVisible()
    }
    // Begrüssung, Bereiche und Fuss stehen weiter — sie sind nicht abschaltbar.
    // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3, W2·24-R5-F1C, David D18, 6.9.2026):
    // «insgesamt braucht es auf der startseite keine suche. nur oben reicht» —
    // das Pult trägt keine eigene Suche mehr. Die Sonde prüft darum das erste
    // unabschaltbare Element, das geblieben ist (die Begrüssungs-/Titelzeile);
    // Umfang und Aussage des Falls (was ist NICHT abschaltbar) unverändert.
    await expect(page.locator('main h1').first()).toBeVisible()
    await expect(bereiche(page)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Startseite anpassen' })).toBeVisible()
  })

  test('Laden mit gespeicherter Anordnung erzeugt keinen Layout-Sprung (§15)', async ({ page }) => {
    // Anordnung vorschreiben, BEVOR die Seite lädt — genau der Fall, in dem der
    // Prerender (Werkseinstellung) und der Client (eigene Wahl) auseinandergehen.
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('lexmetrik-startseite', JSON.stringify({
      reihenfolge: ['entscheide', 'kantone', 'systematik', 'behoerden', 'frist'],
      an: ['entscheide', 'kantone', 'behoerden'],
    })))
    await page.addInitScript(() => {
      ;(window as unknown as { __cls: number }).__cls = 0
      new PerformanceObserver((liste) => {
        for (const e of liste.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.reload()
    await expect(inhalt(page, 'Kantone, erfasste Erlasse')).toBeVisible()
    await page.waitForTimeout(1200)
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
    // Web-Vitals-Schwelle «gut» ist 0.1; die Seite baut beim Laden die eigene
    // Anordnung ein und muss trotzdem darunter bleiben.
    expect(cls, `CLS ${cls}`).toBeLessThan(0.1)
  })
})

// ─── D29 · Modul-Links führen je zu ihrem eigenen Ziel ──────────────────────
//
// Bug David 6.9.2026, Bild «Bundesrecht, systematische Ordnung»: «jede Kachel
// führt zu der gleichen Seite». Die Zeilen-Hrefs waren am Quelltext schon
// distinkt (Bau-Bericht); dieser Wächter misst am LAUFENDEN Browser, was David
// tatsächlich sieht — Klick UND Ziel, nicht nur das Attribut.
//
// ROT-PROBE (§6.7, 6.9.2026): am unveränderten Vorzustand (Kürzel als reiner
// `<small>`-Text ohne `<Link>`) meldete Playwright für den ersten Fall
// `getByRole('link', { name: 'BV' })` → 0 Treffer statt 1.
test.describe('D29 · Systematik-Modul: eigenes Ziel je Zeile', () => {
  test('die sechs Zeilen tragen sechs verschiedene Hrefs', async ({ page }) => {
    await page.goto('/')
    await pultBereit(page)
    const modul = page.getByRole('region', { name: 'Bundesrecht, systematische Ordnung' })
    // Fünf Bund-Kategorien + International — Zeilen-Hrefs, nicht die Kürzel darunter.
    // Auto-Retry (`expect.poll`), weil das Hydrieren die vorgerenderte Liste
    // kurz gegen den Ladezustand tauscht (Gotcha oben, `pultBereit` deckt nur
    // die Modul-Anzahl ab, nicht diese spezifischen Hrefs).
    await expect.poll(() => modul.locator('a').evaluateAll((els) =>
      [...new Set(els.map((e) => e.getAttribute('href')).filter((h) => h?.includes('#sys-') || h?.includes('ebene=international')))].length,
    )).toBe(6)
  })

  test('ein Kernerlass-Kürzel ist ein eigener Link auf seinen Erlass', async ({ page }) => {
    await page.goto('/')
    const link = page.getByRole('link', { name: 'BV', exact: true })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/gesetze/bund/BV')
  })

  test('Klick auf Zeile 03 landet auf der Zivilprozess-Kategorie (Adresse + Überschrift)', async ({ page }) => {
    await page.goto('/')
    await pultBereit(page)
    await page.getByRole('link', { name: 'Zivilprozess- und Zwangsvollstreckungsrecht' }).click()
    await expect(page).toHaveURL(/\/gesetze\?ebene=bund#sys-zivilverfahren$/)
    // Die Kategorie ist ein natives <details id="sys-zivilverfahren">
    // (`gesetze-teile/geteilt.tsx`, kein <h*> — die «Überschrift» ist der
    // <summary>-Text); offen UND im sichtbaren Bereich sind die zwei
    // messbaren Zusagen des Deeplinks.
    const kategorie = page.locator('#sys-zivilverfahren')
    await expect(kategorie).toHaveAttribute('open', '')
    await expect(kategorie.getByText('Zivilprozess- und Zwangsvollstreckungsrecht')).toBeVisible()
    await expect(kategorie).toBeInViewport()
  })
})
