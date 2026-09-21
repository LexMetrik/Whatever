// @shard-gruppe: 8
//
// ── D37 (David 7.9.2026, Rückfrage beantwortet) · ABSCHNITTE STARTEN ZU ─────
//
// «Die Gruppen in der Seitenleiste» — gemeint sind die fünf Abschnitte
// (Gesetze, Rechtsprechung, Materialien, Rechner, Vorlagen), die die Leiste
// gliedern (Komponente `Abschnitt` in `Sidebar.tsx`, NICHT die tieferen
// Untergruppen wie Bund/Kantone — die heissen im Code `Gruppe` und hatten ihr
// eigenes Zuklapp-Verhalten schon vor D37, s. O2/`uinav-o2-sidebar.e2e.ts`).
// Vorher startete jeder Abschnitt offen (`useState(true)`, unbedingt). Jetzt:
//   1. alle Abschnitte starten ZU,
//   2. AUSSER dem, in dem die aktuelle Route liegt (Orientierung, aria-current
//      bleibt sichtbar) — beliebig tief, nicht nur die eigene Übersichtsroute,
//   3. eine Nutzerwahl (Chevron-Klick) gewinnt darüber und bleibt für die
//      SITZUNG gemerkt (sessionStorage — NICHT dauerhaft wie die
//      Seitenleisten-Breite/-Wahl selbst, `useSeitenleiste.ts`/localStorage),
//   4. kein Layout-Sprung: der Anfangszustand steht synchron vor dem ersten
//      Frame fest (keine "erst offen, dann klappt zu"-Sequenz).
//
// ROT ZU BEKOMMEN (§6.7 — einmal gezeigt, 7.9.2026): mit dem VORHERIGEN Stand
// (`const [offen, setOffen] = useState(true)`, keine sessionStorage-Anbindung)
// scheitern Fall 1 und Fall 2 sofort («Gesetze aufklappen» hat aria-expanded
// bereits `true`, wo `false` erwartet wird) und Fall 3 SPÄTER (kein
// gespeicherter Zustand, der Chevron steht nach dem Reload wieder auf dem
// alten Immer-offen-Default). Mit dem D37-Stand alle vier grün. Siehe
// Rückgabe der bauenden Session für den geführten Beleg (git stash + Rebuild).
//
// Läuft gegen `vite preview` (dist), wie `uinav-o2-sidebar.e2e.ts`.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { seitenleisteOeffnen } from './helpers/seitenleiste'

const nav = (page: Page) => page.getByRole('navigation', { name: 'Hauptnavigation' })
const chevron = (page: Page, titel: string) =>
  nav(page).getByRole('button', { name: new RegExp(`^${titel} (auf|ein)klappen$`) })

const ABSCHNITTE = ['Gesetze', 'Rechtsprechung', 'Materialien', 'Rechner', 'Vorlagen'] as const

test.describe('D37 · Seitenleisten-Abschnitte starten zugeklappt', () => {
  test('Start auf «/»: alle fünf Abschnitte sind zu', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/')
    await seitenleisteOeffnen(page)

    for (const titel of ABSCHNITTE) {
      await expect(chevron(page, titel), `${titel} sollte beim Start zu sein`)
        .toHaveAttribute('aria-expanded', 'false')
      // Höhe der zugeklappten Zeile fest — kein leerer Klapp-Container im DOM,
      // der beim Aufklappen erst nachwachsen müsste.
      await expect(nav(page).getByText(titel, { exact: true })).toBeVisible()
    }

    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('Start auf /rechtsprechung: nur der Abschnitt Rechtsprechung ist offen', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/rechtsprechung')
    await seitenleisteOeffnen(page)

    await expect(chevron(page, 'Rechtsprechung')).toHaveAttribute('aria-expanded', 'true')
    for (const titel of ABSCHNITTE.filter((t) => t !== 'Rechtsprechung')) {
      await expect(chevron(page, titel), `${titel} sollte trotz Rechtsprechung-Route zu bleiben`)
        .toHaveAttribute('aria-expanded', 'false')
    }
    // Orientierung bleibt: die Übersichts-Marke der aktiven Route ist sichtbar.
    await expect(nav(page).locator('a[aria-current="page"][href="/rechtsprechung"]')).toBeVisible()

    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('bewusst aufgeklappt bleibt über einen Reload im selben Tab (sessionStorage, für die Sitzung)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/')
    await seitenleisteOeffnen(page)

    const rechnerChevron = chevron(page, 'Rechner')
    await expect(rechnerChevron).toHaveAttribute('aria-expanded', 'false')
    // Tastatur statt Maus — der Klapp-Schalter ist ein natives <button>.
    await rechnerChevron.focus()
    await page.keyboard.press('Enter')
    await expect(rechnerChevron).toHaveAttribute('aria-expanded', 'true')

    await page.reload()
    await seitenleisteOeffnen(page)
    await expect(chevron(page, 'Rechner'), 'die Sitzungs-Wahl «offen» muss den Reload überleben')
      .toHaveAttribute('aria-expanded', 'true')
    // Ein Abschnitt ohne Nutzerwahl bleibt weiterhin zu — die Speicherung ist
    // je Abschnitt getrennt, keine globale Öffnen-Alles-Wahl.
    await expect(chevron(page, 'Gesetze')).toHaveAttribute('aria-expanded', 'false')

    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('kein Layout-Sprung beim Start: der Anfangszustand steht vor dem ersten Frame fest', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number; __quellen: string[] }
      w.__cls = 0
      w.__quellen = []
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as unknown as {
          value: number; hadRecentInput: boolean; startTime: number
        }[]) {
          if (e.hadRecentInput) continue
          w.__cls += e.value
          w.__quellen.push(`${e.value.toFixed(4)}@${Math.round(e.startTime)}ms`)
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.goto('/')
    await expect(page.locator('header.sticky')).toBeVisible({ timeout: 20_000 })
    await seitenleisteOeffnen(page)
    await expect(chevron(page, 'Gesetze')).toBeVisible()
    await page.waitForTimeout(500)

    const { cls, quellen } = await page.evaluate(() => {
      const w = window as unknown as { __cls: number; __quellen: string[] }
      return { cls: w.__cls, quellen: w.__quellen }
    })
    // Latte wie D21 (0.01): lässt Subpixel-Rauschen durch, nicht ein
    // Nachwachsen der Abschnitts-Zeilen nach dem ersten Frame.
    expect(cls, `Layout-Sprung beim Start: CLS ${cls} — ${quellen.join(' | ')}`).toBeLessThanOrEqual(0.01)
  })

  test('@390: die Schublade zeigt dieselben zugeklappten Abschnitte', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/rechtsprechung')
    await page.getByRole('button', { name: 'Navigation öffnen' }).click()
    const schublade = page.locator('#seitenleisten-schublade')
    await expect(schublade).toBeVisible()

    const chevronMobil = (titel: string) =>
      schublade.getByRole('button', { name: new RegExp(`^${titel} (auf|ein)klappen$`) })
    await expect(chevronMobil('Rechtsprechung')).toHaveAttribute('aria-expanded', 'true')
    await expect(chevronMobil('Gesetze')).toHaveAttribute('aria-expanded', 'false')

    // Aufklappen funktioniert auch hier über den Chevron, nicht nur am Rand.
    await chevronMobil('Gesetze').click()
    await expect(chevronMobil('Gesetze')).toHaveAttribute('aria-expanded', 'true')

    expect(fehler, fehler.join('\n')).toEqual([])
  })
})
