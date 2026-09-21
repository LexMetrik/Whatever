// @shard-gruppe: 4
// ─── Entscheid-Klick springt zur zitierenden Erwägung — auch im SPLIT ────────
//
// AUFTRAG DAVID 30.8.2026 (wörtlich): «fixxe dass wenn ich im gesetz split
// screen zum entscheid klicke direkt zu der entsprächenden erwägung gelange.»
//
// WAS DIESE SPEC PRÜFT UND WARUM SIE NICHT «schon wieder dasselbe» IST.
// `leser-v3-panel-erwaegungssprung.e2e.ts` deckt den Sprung in der EINZEL-
// ansicht. Der Split-Weg war ungedeckt, obwohl er drei Dinge zusätzlich
// verlangt, die je einzeln brechen können und in der Einzelansicht gar nicht
// vorkommen:
//
//   (a) `?norm=` muss den ⧉-Weg überleben — `usePaneLayout.oeffneDaneben`
//       kanonisiert und dedupliziert den Pfad, bevor er ins Pane geht.
//   (b) Im Pane ist die massgebliche Hash-Quelle die PANE-LOKALE Location, nicht
//       `window.location.hash`. Trägt die Haupt-URL ein `#art-…` (sie tut es —
//       man kommt ja aus einem Artikel), und läse der Leser den Fenster-Hash,
//       bräche er den `?norm=`-Sprung als «Hash gewinnt» ab und das Pane ginge
//       oben auf (stumm falsch, §8).
//   (c) Gescrollt werden muss der PANE-Container, nicht das Fenster.
//
// Alle drei sind heute richtig verdrahtet — diese Spec hält sie fest, statt sie
// dem nächsten Umbau zu überlassen (§6.7: was nicht geprüft wird, bricht still).
//
// GEMESSEN wird der ECHTE Scroll (`scrollTop` des Panes), nicht nur
// `toBeInViewport`: ein sehr kurzer Entscheid stünde auch ungescrollt im
// Viewport — die Zusage wäre dann scheinbar gehalten, ohne dass gesprungen
// wurde. Der Referenzfall (ZGB Art. 684 → BGE 151 III 377, E. 2.3.1) scrollt
// gemessen ~3700 px.
import { test, expect, type Page, type Locator } from '@playwright/test'
import { panelAufziehen } from './helpers/panelOeffnen'

const ZIEL = '#e-2-3-1'
const CHIP = 'a[href*="bge_151_III_377"]'

async function paneScroll(pane: Locator): Promise<number> {
  return pane.evaluate((el) => (el as HTMLElement).scrollTop)
}

async function gesetzImHauptfenster(page: Page) {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto('/gesetze/bund/ZGB#art-684')
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await panelAufziehen(page)
}

test('⧉ öffnet den Entscheid als Pane — und das Pane steht auf der Erwägung', async ({ page }) => {
  await gesetzImHauptfenster(page)
  const chip = page.locator('[data-v3-panel]').locator(CHIP).first()
  await expect(chip).toBeVisible({ timeout: 20_000 })
  // (a) Die Fundstellen-Absicht hängt am Link, den der ⧉ weiterreicht.
  await expect(chip).toHaveAttribute('href', /norm=Art\.(%20|\+| )684(%20|\+| )ZGB/)
  await chip.locator('xpath=ancestor::span[1]').locator('button[title*="nebeneinander"]').click()

  const pane = page.locator('[data-pane="sekundaer"]')
  await expect(pane.locator(ZIEL)).toBeVisible({ timeout: 20_000 })
  await expect(pane.locator(ZIEL)).toBeInViewport({ timeout: 15_000 })
  // (c) Der Sprung hat den PANE-Container bewegt, nicht bloss zufällig gepasst.
  expect(await paneScroll(pane)).toBeGreaterThan(500)
})

test('Gesetz IM Pane: Chip-Klick navigiert pane-lokal auf die Erwägung', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  // Split über den teilbaren Layout-Link `?p=` aufbauen (kein Test-Sonderpfad —
  // derselbe Weg, den ein geteilter Link nimmt, s. leser-v3-highlight-split).
  await page.goto('/rechner?p=' + encodeURIComponent('/gesetze/bund/ZGB#art-684'))
  const pane = page.locator('[data-pane="sekundaer"]')
  await expect(pane.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  // Das Panel portaliert AUS dem Pane heraus (H2-Befund) — darum an `page`.
  await panelAufziehen(page, pane)
  const chip = page.locator('[data-v3-panel]').locator(CHIP).first()
  await expect(chip).toBeVisible({ timeout: 20_000 })
  await chip.click()

  await expect(pane.locator(ZIEL)).toBeVisible({ timeout: 20_000 })
  await expect(pane.locator(ZIEL)).toBeInViewport({ timeout: 15_000 })
  expect(await paneScroll(pane)).toBeGreaterThan(500)

  // Der Pane hat eine EIGENE History (Pane.tsx): der Browser-Zurück-Knopf darf
  // deshalb NICHT das Pane zurückspulen, sondern gehört dem Hauptfenster. Das
  // Hauptfenster stand auf `/rechner` — genau dorthin (bzw. auf die vorige
  // Hauptfenster-Adresse) führt «zurück», das Gesetz-Pane bleibt stehen.
  await expect(page).toHaveURL(/\/rechner/)
})

test('Rückweg (F7): «zurück» führt aus dem Entscheid ins Gesetz an den Artikel', async ({ page }) => {
  await gesetzImHauptfenster(page)
  const chip = page.locator('[data-v3-panel]').locator(CHIP).first()
  await expect(chip).toBeVisible({ timeout: 20_000 })
  await chip.click()                                    // Hauptfenster-Navigation
  await expect(page.locator(ZIEL)).toBeInViewport({ timeout: 20_000 })
  await expect(page).toHaveURL(/norm=/)

  await page.goBack()
  await expect(page).toHaveURL(/\/gesetze\/bund\/ZGB#art-684$/)
  // Und der Leser steht wieder am Artikel, nicht am Erlassanfang.
  await expect(page.locator('#art-684')).toBeInViewport({ timeout: 20_000 })
})

test('kantonales Recht landet ebenfalls auf der Erwägung (§ 4 BüRG)', async ({ page }) => {
  // Der neue Zweig: Fedlex kennt kantonales Recht nicht, der Sprung lief dort
  // bis 30.8.2026 IMMER ins Leere (gemessen 0.0 % über 10 645 Kanten). Jetzt
  // trägt ihn die wörtliche Nennung (`ankunftsAnker`).
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto('/rechtsprechung/bs_appellationsgericht_VD.2021.223?norm=' + encodeURIComponent('§ 4 BüRG'))
  const ziel = page.locator('#e-2-3-3')
  await expect(ziel).toBeVisible({ timeout: 20_000 })
  await expect(ziel).toBeInViewport({ timeout: 15_000 })
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300)
})
