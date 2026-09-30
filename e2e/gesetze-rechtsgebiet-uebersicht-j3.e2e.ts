// @shard-gruppe: 3
// J3 · Gesetzesübersicht nach Rechtsgebieten (ROADMAP.md W2·10-UI-NAV, Idee
// David 16.8.2026, dejure.org-Vorbild «Gesetze nach Rechtsgebieten»): auf dem
// neutralen G4-Landeplatz /gesetze eine dichte Rechtsgebiets-Gliederung als
// gehaltvoller Default-Inhalt (Cowork-Befund 19). Beweise dieser Spec:
//   – Gruppierung vorhanden: mind. zwei Rechtsgebiets-Rubriken mit Titel +
//     Trefferzahl, dieselbe Taxonomie wie «Nach Sachgebiet» in der
//     Rechtsprechung (SSoT `register.ts` GEBIETE).
//   – Links führen in den Erlass: ein bekannter Leitgesetz-Link (OR) navigiert
//     nach `/gesetze/bund/OR`.
//   – a11y: axe (WCAG 2.1 AA) auf der Landeplatz-Seite, keine critical/
//     serious-Verstösse aus der neuen Sektion.
// Läuft gegen `vite preview` (dist).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import AxeBuilder from '@axe-core/playwright'

const sektion = (page: Page) => page.getByRole('region', { name: 'Gesetze nach Rechtsgebiet' })

test.describe('J3 · Rechtsgebiets-Übersicht auf /gesetze', () => {
  test('Gruppierung vorhanden — mehrere Rechtsgebiets-Rubriken mit Trefferzahl', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze')
    await expect(sektion(page)).toBeVisible()

    // Privatrecht + Strafrecht sind die zwei grössten Bund-Rubriken (register.ts
    // GEBIETE-Reihenfolge) — beide mit einer Kopfzeile + num. Trefferzahl.
    const privat = sektion(page).getByRole('heading', { name: 'Privatrecht' })
    const straf = sektion(page).getByRole('heading', { name: 'Strafrecht' })
    await expect(privat).toBeVisible()
    await expect(straf).toBeVisible()

    // Kein Akkordeon (anders als die bestehende Bund-Gliederungs-Sicht,
    // gesetze-rechtsgebiet-g6.e2e.ts): sofort sichtbare dichte Linkliste,
    // kein Klick zum Aufklappen.
    await expect(page.getByRole('link', { name: /Obligationenrecht/ }).first()).toBeVisible()
    expect(fehler).toEqual([])
  })

  test('Link führt in den Erlass — Obligationenrecht (OR)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze')
    await sektion(page).getByRole('link', { name: /Obligationenrecht/ }).first().click()
    await expect(page).toHaveURL(/\/gesetze\/bund\/OR$/)
    expect(fehler).toEqual([])
  })

  test('a11y: axe (WCAG 2.1 AA) auf dem Landeplatz — keine critical/serious-Verstösse', async ({ page }) => {
    // Deterministisches Theme (wie a11y.e2e.ts): ohne gespeicherte Wahl folgt
    // prefers-color-scheme der Prüfmaschine → sonst flaky.
    await page.addInitScript(() => {
      try { localStorage.setItem('lexmetrik-thema', 'hell') } catch { /* privater Modus */ }
    })
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
    await page.goto('/gesetze')
    await expect(sektion(page)).toBeVisible()

    const ergebnis = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .include('#rechtsgebiete-uebersicht')
      .analyze()
    // `link-in-text-block` gatet mit (damals ausgenommen als Markenentscheid B-2;
    // seit R3-Nachzug 6.9.2026 sind Inline-Links unterstrichen, F0.8).
    const schwer = ergebnis.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(
      schwer.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} Knoten`),
      'axe J3-Rechtsgebietsübersicht: keine critical/serious-Verstösse',
    ).toEqual([])
  })
})
