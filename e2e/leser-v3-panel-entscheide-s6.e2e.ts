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
import { rohShard, sollKanten } from '../src/tests/korpusSoll.helfer'

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
    // BGE zuerst, dann je kantonales Gericht, dann der Rest (PanelEntscheide.tsx:
    // «BGE, dann JE kantonales Gericht, dann der Rest (übrige BGer, eidg.)»).
    // §6.3-DEKLARATION (W2·29-WERKBANK-LESER D2/E-1, 25.9.2026 — fachliche
    // Änderung): bis D2 stand hier «an Art. 41 gibt es keinen Rest» und bge 30.
    // Seit E-1 zeigen zehn der dreissig BGE-Kanten an Art. 41 OR aufs
    // Volltext-Urteil (nur in einer nicht publizierten Erwägung genannt) —
    // Shard `public/rechtsprechung/bezuege/OR.json`, gesamtProArtikel["41"]:
    // main {bge 30, kantonal 21}, D2 {bge 20, bger 10, kantonal 21}. Es gibt
    // darum eine Rest-Gruppe «bger» am Ende; geprüft bleibt die Reihung.
    expect(status[0]).toBe('bge')
    const iRest = status.findIndex((s, i) => i > 0 && s !== 'kantonal')
    const kantonale = status.slice(1, iRest < 0 ? undefined : iRest)
    expect(kantonale.length, status.join(',')).toBeGreaterThan(0)
    expect(kantonale.every((s) => s === 'kantonal'), status.join(',')).toBe(true)
    const rest = iRest < 0 ? [] : status.slice(iRest)
    expect(rest.every((s) => s === 'bger' || s === 'eidg'), status.join(',')).toBe(true)

    // Je Gruppe höchstens fünf Zeilen beim Öffnen.
    for (const n of await gruppen.locator('ul').evaluateAll((uls) => uls.map((u) => u.children.length))) {
      expect(n).toBeLessThanOrEqual(5)
    }
    // §6.3-DEKLARATION (QS-KORPUS BGE-Band-Nachzug 152, 25.9.2026 — Korpus-
    // Zuwachs, keine Logik-Änderung): damals bge 20 / «weitere 15» / 20 (Shard
    // OR.json auf origin/main, gesamtProArtikel["41"] {bge 20, bger 10,
    // kantonal 21}); seither {bge 21, bger 11, kantonal 21}. Der eine neue BGE
    // an Art. 41 OR ist BGE 152 IV 201 (6B_973/2023 vom 4.12.2025, neu aus
    // Bd. 152, PR #1099). Portion (5) und «Rest ≤ 50 ⇒ alles» bleiben gleich.
    // §6.3-DEKLARATION (QS-KORPUS Einheit P «Zahl-Pins korpusrelativ»,
    // 25.9.2026): die feste 21 riss bei jedem Korpus-Zuwachs (Lauf 36124134898,
    // #1099: «Expected "20", Received "21"»). Soll-Wert seither aus dem rohen
    // Shard (korpusSoll.helfer, ohne src/lib); die Vorbedingung des Falls —
    // mehr als eine Portion (5), Rest in EINEM Schritt (≤ 50) — als Invariante.
    const n = sollKanten(rohShard('OR'), '41', 'bge').length
    expect(n, 'Vorbedingung: 5 < BGE an Art. 41 OR ≤ 55').toBeGreaterThan(5)
    expect(n, 'Vorbedingung: 5 < BGE an Art. 41 OR ≤ 55').toBeLessThanOrEqual(55)
    const bge = inhalt(page).locator('[data-v3-panel-gruppe="bge"]')
    await expect(bge).toHaveAttribute('data-v3-panel-gruppe-zahl', String(n))
    await expect(bge.locator('[data-v3-panel-entscheid]')).toHaveCount(5)

    // «weitere n−5» (Rest ≤ 50) holt den ganzen Rest; der Fokus landet auf dem
    // ersten neuen Eintrag, nicht im Nichts (der Knopf verschwindet).
    const weitere = bge.locator('[data-v3-panel-weitere="bge"]')
    await expect(weitere).toHaveText(`weitere ${n - 5}`)
    await weitere.click()
    await expect(bge.locator('[data-v3-panel-entscheid]')).toHaveCount(n)
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
