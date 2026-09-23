// @shard-gruppe: 6
// ─── S6-W1b · Reiter «Entscheide» des Erlass-Blatts (W2·29-WERKBANK-LESER) ────
//
// Misst am gebauten Leser, was der Audit vom 23.9.2026 bemängelt und David am
// selben Tag entschieden hat («zuerst bge aber nur die 5 neusten und dann
// kantonal jeweils 5 und dann der rest»):
//   (a) Ordnung + Portion an OR Art. 41 (30 BGE · 20 BS · 1 AG, Shard 23.9.2026)
//   (b) Ladefehler ⇒ Fehler-Lage + «Erneut laden», nie «kein Entscheid»
//   (c) nach Netz-Rückkehr (`online`) lädt es von selbst neu
//   (d) kantonaler Erlass zeigt im Grundzustand seine kantonalen Entscheide
//       (BS-154.100 § 44, Befund B-3: vorher «kein Entscheid erfasst»)
//
// ROT-BEWEIS je Fall: (a) auf dem Stand vor S6-W1b stand nur die BGE-Gruppe mit
// 30 Zeilen da; (b)/(c) zeigten «Zu Art. 41 ist kein Entscheid … erfasst»; (d)
// zeigte den Bestands-Satz (Audit-Belege /private/tmp/reiter-entscheide-belege/).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { panelAufziehen } from './helpers/panelOeffnen'

const SHARD = '**/rechtsprechung/bezuege/**'

async function oeffne(page: Page, pfad: string): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(pfad)
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await panelAufziehen(page)
}

function inhalt(page: Page) {
  return page.locator('[data-v3-panel-reiter-inhalt="entscheide"]')
}

test.describe('S6-W1b — Reiter Entscheide', () => {
  test('(a) OR Art. 41: BGE → kantonale Gerichte, je 5, «weitere» holt nach und führt den Fokus', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await oeffne(page, '/gesetze/bund/OR#art-41')
    const gruppen = inhalt(page).locator('[data-v3-panel-gruppe]')
    await expect(gruppen.first()).toHaveAttribute('data-v3-panel-gruppe', 'bge', { timeout: 20_000 })
    const status = await gruppen.evaluateAll((els) => els.map((e) => e.getAttribute('data-v3-panel-gruppe')))
    // BGE zuerst, danach nur noch kantonale Gruppen (an Art. 41 gibt es keinen Rest).
    expect(status[0]).toBe('bge')
    expect(status.slice(1).every((s) => s === 'kantonal'), status.join(',')).toBe(true)
    expect(status.length).toBeGreaterThan(1)

    // Je Gruppe höchstens fünf Zeilen beim Öffnen.
    for (const n of await gruppen.locator('ul').evaluateAll((uls) => uls.map((u) => u.children.length))) {
      expect(n).toBeLessThanOrEqual(5)
    }
    const bge = inhalt(page).locator('[data-v3-panel-gruppe="bge"]')
    await expect(bge).toHaveAttribute('data-v3-panel-gruppe-zahl', '30')
    await expect(bge.locator('[data-v3-panel-entscheid]')).toHaveCount(5)

    // «weitere 25» (Rest ≤ 50) holt den ganzen Rest; der Fokus landet auf dem
    // ersten neuen Eintrag, nicht im Nichts (der Knopf verschwindet).
    const weitere = bge.locator('[data-v3-panel-weitere="bge"]')
    await expect(weitere).toHaveText('weitere 25')
    await weitere.click()
    await expect(bge.locator('[data-v3-panel-entscheid]')).toHaveCount(30)
    await expect(weitere).toHaveCount(0)
    const fokusIndex = await page.evaluate(() => {
      const li = document.activeElement?.closest('[data-v3-panel-entscheid]')
      return li?.parentElement ? [...li.parentElement.children].indexOf(li) : -1
    })
    expect(fokusIndex).toBe(5)

    // Kopf nennt Artikel UND Kürzel (E-10).
    await expect(page.locator('[data-v3-panel]').first()).toContainText('Art. 41 OR')
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('(b) Ladefehler: eigene Lage mit «Erneut laden», nie «kein Entscheid erfasst»', async ({ page }) => {
    await page.route(SHARD, (r) => r.abort('internetdisconnected'))
    await oeffne(page, '/gesetze/bund/OR#art-41')
    await expect(inhalt(page).locator('[data-v3-panel-lage="fehler"]')).toBeVisible({ timeout: 20_000 })
    await expect(inhalt(page)).not.toContainText('kein Entscheid')
    await page.unroute(SHARD)
    await inhalt(page).locator('[data-v3-panel-neu-laden]').click()
    await expect(inhalt(page).locator('[data-v3-panel-gruppe="bge"]')).toBeVisible({ timeout: 20_000 })
    await expect(inhalt(page).locator('[data-v3-panel-lage="fehler"]')).toHaveCount(0)
  })

  test('(c) nach Netz-Rückkehr lädt es von selbst neu', async ({ page }) => {
    await page.route(SHARD, (r) => r.abort('internetdisconnected'))
    await oeffne(page, '/gesetze/bund/OR#art-41')
    await expect(inhalt(page).locator('[data-v3-panel-lage="fehler"]')).toBeVisible({ timeout: 20_000 })
    await page.unroute(SHARD)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect(inhalt(page).locator('[data-v3-panel-gruppe="bge"]')).toBeVisible({ timeout: 20_000 })
  })

  test('(d) BS-154.100 § 44: der Grundzustand zeigt die kantonalen Entscheide (B-3)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await oeffne(page, '/gesetze/kanton/BS-154.100#art-44')
    await expect(inhalt(page).locator('[data-v3-panel-gruppe="kantonal"]').first()).toBeVisible({ timeout: 20_000 })
    await expect(inhalt(page).locator('[data-v3-panel-lage="bestand"]')).toHaveCount(0)
    await expect(inhalt(page).locator('[data-v3-panel-abdeckung-zeile] a[href="/abdeckung"]')).toBeVisible()
    expect(fehler, fehler.join('\n')).toEqual([])
  })
})
