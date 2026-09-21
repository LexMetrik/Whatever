// @shard-gruppe: 6
// ─── §7b-Deckungslücke geschlossen (21.8.2026, Kontaktbogen H4 §7b Pos. 2) ───
//
// Deckt die WIRKUNG von `BezugFacettenWahl`/`BezugZeitWahl` AM V3-PANEL —
// `bezuege-facetten-b4.e2e.ts` und `bezuege-zeitstrahl-b5.e2e.ts` prüfen
// dieselben, UNVERÄNDERTEN geteilten Bausteine (§5) nur am alten Montagepunkt
// (Kopf-Dropdown «Rechtsprechung ▾»). Diese Datei stellt dieselbe Zusicherung
// für den neuen Montagepunkt her (`PanelFilterZeile`, hinter den Klappen
// «Instanzen»/«Zeitraum»), damit H5 die Ist-Hüllen-Dateien löschen darf.
//
// WAS NICHT PORTIERT WIRD, UND WARUM (deklarierte Abweichung, keine neue
// Entscheidung — der Befund steht bereits datiert im Code):
//   `PanelEntscheide.tsx` (H3, Kommentar dort) verzichtet BEWUSST auf die
//   Portionierung der Ist-Hülle («KEINE Portionierung, kein ‹weitere 5›: die
//   Liste im Panel darf senkrecht wachsen, das Panel scrollt ohnehin»). Die
//   V1-Zähler-Formulierung «5 von 16» / «weitere laden» hat damit am Panel
//   KEIN Gegenstück — sie mass eine Kappung, die V3 architektonisch nicht hat.
//   Was bleibt und hier geprüft wird: dass die Instanz-/Kanton-/Zeit-Wahl die
//   ANGEZEIGTE Liste korrekt schneidet, dass der Kanton-Feinschnitt die
//   Bundes-Kanten nicht mitlöscht, dass die Wahl einen Neuladen übersteht, und
//   dass die einmalige Alt-Stufen-Migration («5 J.» → Von-Datum) unabhängig
//   von der Hülle greift (der Store `lm.leser.optionen` ist hüllenneutral).
//
// Träger: StPO Art. 5 (wie B4/B5) — 16 Leitentscheide, Shard verifiziert
// 29.7.2026 nach B7 (Kopf von `bezuege-facetten-b4.e2e.ts`).
import { test, expect, type Page } from '@playwright/test'
import { panelAufziehen } from './helpers/panelOeffnen'

const STPO = '/gesetze/bund/STPO#art-5'

async function panelMitFilterOeffnen(page: Page): Promise<void> {
  await page.goto(STPO)
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await panelAufziehen(page)
  await expect(page.locator('#art-5')).toBeAttached()
}

function panel(page: Page) {
  return page.locator('[data-v3-panel]').first()
}

async function instanzenKlappeOeffnen(page: Page): Promise<void> {
  const klappen = panel(page).locator('[data-v3-panel-klappe]')
  const offen = panel(page).locator('[data-v3-panel-klappe-inhalt]')
  if (await offen.count() > 0) return
  await klappen.first().click()
}

async function zeitKlappeOeffnen(page: Page): Promise<void> {
  const offen = panel(page).locator('[data-v3-panel-klappe-inhalt]')
  if (await offen.count() > 0) {
    // Eine Klappe ist bereits offen (Instanzen) — schliessen, dann Zeit öffnen.
    await panel(page).locator('[data-v3-panel-klappe]').first().click()
  }
  await panel(page).locator('[data-v3-panel-klappe]').nth(1).click()
}

function entscheide(page: Page) {
  return panel(page).locator('[data-v3-panel-entscheid]')
}

test.describe('V3-Panel · Bezüge-Facetten/Zeit — WIRKUNG (§7b Pos. 2)', () => {
  test('Kanton-Schnitt löscht die Bundes-Kanten nicht', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await instanzenKlappeOeffnen(page)
    await panel(page).locator('[data-bezug-klasse="kantonal"]').click()
    await expect(panel(page).locator('[data-bezug-kanton]').first()).toBeVisible({ timeout: 20_000 })
    await panel(page).locator('[data-bezug-kanton="BS"]').click()
    // Der teure Denkfehler (wie B4): BGer-Kanten tragen kanton='CH' und fielen
    // aus einer naiven Kantons-Auswahl heraus. Beide Gruppenköpfe bleiben da.
    await expect(panel(page)).toContainText('Leitentscheide')
    await expect(panel(page)).toContainText('Kantonal')
    await expect(entscheide(page).first()).toBeVisible({ timeout: 20_000 })
  })

  test('Instanz-Wahl übersteht einen Neuladen (Persistenz, hüllenneutraler Store)', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await instanzenKlappeOeffnen(page)
    await panel(page).locator('[data-bezug-klasse="kantonal"]').click()
    await expect(panel(page).locator('[data-bezug-kanton]').first()).toBeVisible({ timeout: 20_000 })
    await page.reload()
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await panelAufziehen(page)
    await instanzenKlappeOeffnen(page)
    await expect(panel(page).locator('[data-bezug-klasse="kantonal"]')).toHaveAttribute('aria-pressed', 'true')
  })

  test('alle Facetten aus ⇒ keine Entscheide-Liste im Panel', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await expect(entscheide(page).first()).toBeVisible({ timeout: 20_000 })
    await instanzenKlappeOeffnen(page)
    await panel(page).locator('[data-bezug-klasse="bge"]').click()
    await expect(page.locator('[data-v3-panel-lage="bedienung"]')).toBeVisible({ timeout: 20_000 })
    await expect(entscheide(page)).toHaveCount(0)
  })

  test('Datumsfeld «von» schneidet die Liste, «bis» grenzt weiter ein', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await expect(entscheide(page)).toHaveCount(16, { timeout: 20_000 })
    await zeitKlappeOeffnen(page)
    await panel(page).locator('[data-zeit-feld="von"]').fill('2024-01-01')
    // 5 der 16 Leitentscheide zu Art. 5 sind von 2024 oder jünger (wie B5).
    await expect(entscheide(page)).toHaveCount(5, { timeout: 20_000 })
    await panel(page).locator('[data-zeit-feld="bis"]').fill('2024-12-31')
    await expect(entscheide(page)).toHaveCount(3, { timeout: 20_000 })
  })

  test('verdrehte Eingabe wird getauscht, nicht als leere Menge gedeutet', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await zeitKlappeOeffnen(page)
    await panel(page).locator('[data-zeit-feld="bis"]').fill('2024-01-01')
    await panel(page).locator('[data-zeit-feld="von"]').fill('2024-12-31')
    await expect(entscheide(page)).toHaveCount(3, { timeout: 20_000 })
  })

  test('Zurücksetzen hebt den Zeitraum auf', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await zeitKlappeOeffnen(page)
    await panel(page).locator('[data-zeit-feld="von"]').fill('2025-01-01')
    await expect(entscheide(page)).toHaveCount(2, { timeout: 20_000 })
    await page.getByTitle('Zeitraum aufheben — wieder alle Entscheide zeigen').click()
    await expect(entscheide(page)).toHaveCount(16, { timeout: 20_000 })
    await expect(panel(page).locator('[data-zeit-feld="von"]')).toHaveValue('')
  })

  test('der Zeitraum übersteht einen Neuladen', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await zeitKlappeOeffnen(page)
    await panel(page).locator('[data-zeit-feld="von"]').fill('2024-01-01')
    await expect(entscheide(page)).toHaveCount(5, { timeout: 20_000 })
    await page.reload()
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await panelAufziehen(page)
    await expect(entscheide(page)).toHaveCount(5, { timeout: 20_000 })
    await zeitKlappeOeffnen(page)
    await expect(panel(page).locator('[data-zeit-feld="von"]')).toHaveValue('2024-01-01')
  })

  test('MIGRATION: eine gespeicherte Alt-Stufe «5 J.» wird EINMALIG zum Von-Datum', async ({ page }) => {
    // Derselbe hüllenneutrale Store (`lm.leser.optionen`) wie B5 — die
    // Migration lebt ausserhalb der Hülle und muss darum auch unter V3 greifen.
    await page.goto(STPO)
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.evaluate(() => {
      localStorage.setItem('lm.leser.optionen', JSON.stringify({
        fussnoten: 'an', verweise: 'an', leitfaelle: 'an',
        zeitraum: '5', hist: 'fussnoten',
      }))
    })
    await page.reload()
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    const stand = await page.evaluate(() => JSON.parse(localStorage.getItem('lm.leser.optionen') ?? '{}'))
    expect(stand.zeitraum).toBeUndefined()
    expect(stand.bezugBis).toBe('')
    const erwartet = await page.evaluate(() => {
      const h = new Date()
      const j = h.getUTCFullYear() - 5
      const rest = h.toISOString().slice(4, 10)
      const schalt = (j % 4 === 0 && j % 100 !== 0) || j % 400 === 0
      return `${j}${rest === '-02-29' && !schalt ? '-02-28' : rest}`
    })
    expect(stand.bezugVon).toBe(erwartet)
  })

  test('MIGRATION: «alle» bleibt offen — keine erfundene Einschränkung', async ({ page }) => {
    await page.goto(STPO)
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.evaluate(() => {
      localStorage.setItem('lm.leser.optionen', JSON.stringify({
        fussnoten: 'an', verweise: 'an', leitfaelle: 'an',
        zeitraum: 'alle', hist: 'fussnoten',
      }))
    })
    await page.reload()
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await panelAufziehen(page)
    await expect(entscheide(page)).toHaveCount(16, { timeout: 20_000 })
    await zeitKlappeOeffnen(page)
    await expect(panel(page).locator('[data-zeit-feld="von"]')).toHaveValue('')
    await expect(page.getByTitle('Zeitraum aufheben — wieder alle Entscheide zeigen')).toHaveCount(0)
  })
})
