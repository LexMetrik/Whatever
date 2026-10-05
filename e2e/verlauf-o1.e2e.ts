// @shard-gruppe: nacht
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

  // W2·31 P3 (30.9.2026): «Verlauf leeren» steht auch im Such-Leerzustand. Der
  // Topbar-Verlauf fehlt unter 481 px (C2) und bei grosser Schrift bis ~570 px
  // (`.lc-topbar-verlauf`, index.css) — die Liste blieb über die leere Suche
  // sichtbar, das Leeren aber unerreichbar. Beide Fälle hier; beide Male wird
  // zuerst bewiesen, dass der Topbar-Knopf WIRKLICH fehlt (sonst prüfte der Test
  // den Zugang, den es schon gab).
  // ROT ZU BEKOMMEN (§6.7, gegen `src/`): in `SucheLeerzustand.tsx` die Fusszeile
  // abschalten (`{verlauf.length > 0 && (` → `{false && (`) → beide Fälle schlagen an
  // (Knopf nicht zu finden; Beweis im PR-Bericht).
  for (const fall of [
    { name: '@400 (Topbar-Verlauf unter 481 px weg)', width: 400, skala: '1.0' },
    { name: 'Skala 1.4 @520 (Topbar-Verlauf bei grosser Schrift weg)', width: 520, skala: '1.4' },
  ]) {
    test(`Such-Leerzustand: «Verlauf leeren» erreichbar ${fall.name}`, async ({ page }) => {
      const fehler = fehlerSammeln(page)
      await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v) } catch { /* gesperrt */ } }, ['lexmetrik-schriftskala', fall.skala])
      await page.setViewportSize({ width: fall.width, height: 800 })
      await verlaufAufbauen(page)
      // Vorbedingung: der Topbar-Knopf steht hier NICHT im Bild.
      await expect(verlaufKnopf(page)).toBeHidden()

      // Unter 481 px öffnet die Lupe das Feld; darüber steht das Feld schon da.
      const lupe = page.locator('[data-suche-lupe]')
      if (await lupe.isVisible()) await lupe.click()
      else await sucheFeld(page).click()
      const suchBereich = page.getByRole('search').filter({ has: sucheFeld(page) })
      await expect(suchBereich.getByRole('option', { name: /Verjährung/i }).first()).toBeVisible()
      // §8: die Fussnote steht weiter da, der Knopf neben ihr — und nicht IN der Listbox.
      await expect(suchBereich.getByText('Nur auf diesem Gerät', { exact: true })).toBeVisible()
      const leeren = suchBereich.getByRole('button', { name: 'Verlauf leeren', exact: true })
      await expect(leeren).toBeVisible()
      await expect(suchBereich.getByRole('listbox').getByRole('button')).toHaveCount(0)

      await leeren.click()
      await expect(suchBereich.getByText('Noch nichts geöffnet.')).toBeVisible()
      await expect(suchBereich.getByRole('option')).toHaveCount(0)
      await expect(suchBereich.getByRole('button', { name: 'Verlauf leeren', exact: true })).toHaveCount(0)
      // Der Fokus fällt nicht auf <body>: er geht zurück ins Suchfeld.
      await expect(sucheFeld(page)).toBeFocused()

      // Wirklich gelöscht (nicht nur ausgeblendet): die eine Quelle (`lib/zuletztVerwendet`,
      // Schlüssel `lexmetrik-zuletzt`) ist leer. Kein Neuladen: die Seite, auf der man
      // steht, trüge sich beim Laden sofort wieder in den Verlauf ein.
      expect(await page.evaluate(() => localStorage.getItem('lexmetrik-zuletzt'))).toBeNull()
      expect(fehler).toEqual([])
    })
  }
})
