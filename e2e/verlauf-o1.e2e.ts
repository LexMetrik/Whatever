// @shard-gruppe: 6
// Browser-Smoke der Verlauf-Initiative (UI-NAV O1). Prüft die zwei neuen
// Zugänge auf DERSELBEN localStorage-Verlauf-Quelle (§5):
//   1. ⌘K-/Fokus-Leerzustand der Kopf-Suche zeigt «Zuletzt geöffnet» (seit D23
//      ohne den früheren «Einstiege»-Block, s. Deklaration im Fall).
//   2. Der Topbar-«Verlauf» öffnet ein Panel mit den zuletzt geöffneten Inhalten,
//      chronologisch gruppiert, §8-ehrlich «Nur auf diesem Gerät», mit «leeren».
// Läuft gegen `vite preview` (dist). Rechner-Routen tracken synchron (Label aus
// dem Shell-Bundle) → deterministisch ohne Manifest-Wartezeit.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const sucheFeld = (page: Page) => page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })
const verlaufKnopf = (page: Page) => page.getByRole('button', { name: /Verlauf – zuletzt geöffnet/ })

// Baut einen Verlauf aus zwei Rechner-Besuchen auf (synchrones Tracking).
async function verlaufAufbauen(page: Page) {
  await page.goto('/rechner/tagerechner')
  await expect(page.locator('h1').first()).toBeVisible()
  await page.goto('/rechner/verjaehrung')
  await expect(page.locator('h1').first()).toBeVisible()
}

test.describe('UI-NAV O1 — Verlauf-Initiative', () => {
  test('⌘K-Leerzustand zeigt «Zuletzt geöffnet» und navigiert', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await verlaufAufbauen(page)

    // Feld leer fokussieren → Leerzustand statt Treffer. Auf den Such-Bereich
    // scopen (der Rubrik-Name «Gesetze» steht auch in der Seitenleiste).
    const suchBereich = page.getByRole('search').filter({ has: sucheFeld(page) })
    await sucheFeld(page).click()
    await expect(suchBereich.getByText('Zuletzt geöffnet', { exact: true })).toBeVisible()
    // §6.3-DEKLARATION (W2·24-R5-F1E/D23, 6.9.2026): der Block «Einstiege» ist
    // ERSATZLOS GEFALLEN — er wiederholte Zeile für Zeile die Seitenleiste, die
    // seit D17 auf jeder Route steht (Davids Befund «sehr unästhetisch»,
    // Soll-Anatomie D23: «Einstiege entfällt»). Die zwei Zeilen, die den Block
    // und seinen Klick prüften, sind darum gestrichen und nicht umgeschrieben;
    // dass er WEG ist, prüft jetzt `e2e/w224-kopfsuche-d23.e2e.ts`.
    // Was der Fall hier weiterhin prüft, ist der eigentliche O1-Gegenstand: der
    // Verlauf-Eintrag im Leerzustand navigiert zu seinem Ziel.
    await suchBereich.getByRole('option', { name: /Verjährung/i }).first().click()
    await expect(page).toHaveURL(/\/rechner\/verjaehrung$/)
    expect(fehler).toEqual([])
  })

  test('Topbar-Verlauf: Panel mit Einträgen, §8-Hinweis und «leeren»', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await verlaufAufbauen(page)

    // Der Verlauf-Trigger erscheint (nach Mount) und öffnet das Dialog-Panel.
    const knopf = verlaufKnopf(page)
    await expect(knopf).toBeVisible()
    await knopf.click()
    const panel = page.getByRole('dialog', { name: /Verlauf – zuletzt geöffnet/ })
    await expect(panel).toBeVisible()
    await expect(panel.getByText('Heute', { exact: true })).toBeVisible()
    // §8-Ehrlichkeit: rein lokal.
    await expect(panel.getByText('Nur auf diesem Gerät', { exact: true })).toBeVisible()

    // Ein Verlauf-Eintrag navigiert zum Ziel.
    await panel.getByRole('button', { name: /Verjährung/i }).first().click()
    await expect(page).toHaveURL(/\/rechner\/verjaehrung$/)

    // «Verlauf leeren» entfernt den Trigger (nichts mehr zu zeigen).
    await verlaufKnopf(page).click()
    await page.getByRole('button', { name: 'Verlauf leeren', exact: true }).click()
    await expect(verlaufKnopf(page)).toHaveCount(0)
    expect(fehler).toEqual([])
  })
})
