// @shard-gruppe: 1
// ─── W2·17-UI-BEFUNDE · Entscheide-Filter im Browser (Prüflauf 1.10.2026) ────
//
// Was nur mit echtem Browser prüfbar ist und in `src/tests/leser-entscheide-filter.test.tsx`
// (Logik, Server-Render) nicht steht:
//   · E5-B01  Tastatur im Datumsfeld «bis» nach gesetztem «von»: das bestehende
//             e2e (`leser-v3-panel-bezuege-wirkung`) setzt per `fill()` den
//             GANZEN Wert in einem Ereignis und fuhr das Tippen nie — das native
//             `type=date` meldet beim Jahr-Tippen aber nach jeder Ziffer einen
//             gültigen Wert (0002-…, 0020-…), und der Bereich tauschte die Enden.
//   · E4-B01  gespeicherter Fremdkanton filtert nicht unsichtbar weiter.
//   · E4-B04  Escape schliesst zuerst nur die Zeichenerklärung, nicht das Panel.
//   · E4-B05  die Zeichenerklärung erklärt kein ★, das im Panel nie vorkommt.
//   · E4-D03  Trefferfläche der Zeichenerklärung und des Aufheben-Knopfs ≥ 24 px (F9).
//
// Träger: StPO Art. 5 (wie `leser-v3-panel-bezuege-wirkung`) — kantonal nur BS
// (Shard `public/rechtsprechung/bezuege/STPO.json`, an Art. 5: 117 × BS, kein ZH,
// obwohl der Erlass ZH sonst führt).
import { test, expect, type Locator, type Page } from '@playwright/test'
import { panelAufziehen } from './helpers/panelOeffnen'
import { rohShard, sollImFenster, sollKanten } from '../src/tests/korpusSoll.helfer'

const BGE_DATEN = sollKanten(rohShard('STPO'), '5', 'bge').map((k) => k.datum)
const FENSTER_2021_2023 = sollImFenster(BGE_DATEN, '2021-01-01', '2023-12-31')

const STPO = '/gesetze/bund/STPO#art-5'

function panel(page: Page) {
  return page.locator('[data-v3-panel]').first()
}

async function panelOeffnen(page: Page): Promise<void> {
  await page.goto(STPO)
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await panelAufziehen(page)
  await expect(page.locator('#art-5')).toBeAttached()
}

async function klappe(page: Page, nr: 0 | 1): Promise<void> {
  const offen = panel(page).locator('[data-v3-panel-klappe-inhalt]')
  if (await offen.count() > 0) await panel(page).locator('[data-v3-panel-klappe]').first().click()
  await panel(page).locator('[data-v3-panel-klappe]').nth(nr).click()
}

/** Höhe der KLICKBAREN Fläche um die Mitte eines Elements (elementFromPoint nach oben/unten). */
async function trefferHoehe(el: Locator): Promise<number> {
  await el.scrollIntoViewIfNeeded()
  return el.evaluate((node) => {
    const r = node.getBoundingClientRect()
    const x = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const trifft = (y: number) => {
      const t = document.elementFromPoint(x, y)
      return t !== null && (t === node || node.contains(t))
    }
    let oben = 0
    while (oben < 60 && trifft(cy - oben - 1)) oben++
    let unten = 0
    while (unten < 60 && trifft(cy + unten)) unten++
    return oben + unten
  })
}

test.describe('V3-Panel · Entscheide-Filter — Befunde 1.10.2026', () => {
  test('E5-B01: Tastatur in «bis» nach gesetztem «von» tauscht die Enden nicht', async ({ page }) => {
    expect(FENSTER_2021_2023, 'Vorbedingung: das Fenster 2021–2023 trägt BGE').toBeGreaterThan(0)
    await panelOeffnen(page)
    await klappe(page, 1)
    const von = panel(page).locator('[data-zeit-feld="von"]')
    const bis = panel(page).locator('[data-zeit-feld="bis"]')
    await von.fill('2021-01-01')
    // ECHTES Tippen, Ziffer für Ziffer (Chromium en-US: MM/DD/YYYY) — nicht fill().
    await bis.focus()
    await page.keyboard.type('12312023')
    await expect(bis).toHaveValue('2023-12-31')
    await expect(von).toHaveValue('2021-01-01')
    await expect(panel(page).locator('[data-v3-panel-gruppe="bge"]'))
      .toHaveAttribute('data-v3-panel-gruppe-zahl', String(FENSTER_2021_2023), { timeout: 20_000 })
  })

  test('E4-B01/B03: ein gespeicherter Fremdkanton (ZH, an Art. 5 ohne Entscheid) leert die Liste nicht und steht sichtbar', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('lm.leser.optionen', JSON.stringify({ bezugKantone: ['ZH'] })) } catch { /* Speicher gesperrt */ }
    })
    await panelOeffnen(page)
    // Die kantonalen Entscheide (BS) stehen da — der Fremdkanton schneidet nichts.
    await expect(panel(page).locator('[data-v3-panel-gruppe="kantonal"]').first()).toBeVisible({ timeout: 20_000 })
    // §6.3-DEKLARATION (2.10.2026, Variante A): die Klappe nannte hier «· ZH». Ein Kanton ohne Kante am
    // Artikel schneidet nichts und steht darum NICHT im Stand (sonst läse er sich wie ein wirkender Filter);
    // die Auskunft trägt der Satz unter der Filterzeile und der Chip (neue Fälle unten).
    await expect(panel(page).locator('[data-v3-panel-klappe]').first()).not.toContainText('ZH')
    // … und der Chip steht gedrückt da, auch wenn der Erlass ihn führt oder nicht.
    await klappe(page, 0)
    await expect(panel(page).locator('[data-bezug-kanton="ZH"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(panel(page)).toContainText('schränkt er dort nicht ein')
  })

  test('E4-B04: Escape schliesst nur die Zeichenerklärung, nicht das Panel', async ({ page }) => {
    await panelOeffnen(page)
    await klappe(page, 0)
    await panel(page).getByRole('button', { name: 'Zeichenerklärung' }).click()
    const status = panel(page).locator('[role="status"]').filter({ hasText: 'Zeichen an den Entscheid-Verweisen' })
    await expect(status).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(status).toHaveCount(0)
    await expect(panel(page)).toBeVisible()
    await expect(panel(page).locator('[data-v3-panel-klappe-inhalt]')).toBeVisible()
  })

  test('E4-B05: die Zeichenerklärung erklärt kein ★, das im Panel nie vorkommt', async ({ page }) => {
    await panelOeffnen(page)
    await klappe(page, 0)
    await panel(page).getByRole('button', { name: 'Zeichenerklärung' }).click()
    const status = panel(page).locator('[role="status"]').filter({ hasText: 'Zeichen an den Entscheid-Verweisen' })
    await expect(status).toBeVisible()
    await expect(status).not.toContainText('★')
    await expect(status).not.toContainText('Leitentscheid')
    await expect(status).toContainText('↻')
    await expect(status).toContainText('⧉')
  })

  test('E4-D03: Trefferfläche von «Zeichenerklärung» und «Zeitraum aufheben» ≥ 24 px (F9)', async ({ page }) => {
    await panelOeffnen(page)
    await klappe(page, 0)
    const legende = panel(page).getByRole('button', { name: 'Zeichenerklärung' })
    expect(await trefferHoehe(legende)).toBeGreaterThanOrEqual(24)
    await klappe(page, 1)
    await panel(page).locator('[data-zeit-feld="von"]').fill('2021-01-01')
    const aufheben = panel(page).getByTitle('Zeitraum aufheben — wieder alle Entscheide zeigen')
    expect(await trefferHoehe(aufheben)).toBeGreaterThanOrEqual(24)
  })
})

// ─── Entscheid David 2.10.2026, Variante A: der Kantonfilter sagt, wenn die Wahl am Artikel nicht wirkt ──
// Träger wie oben StPO Art. 5 (kantonal nur BS). «ZH» wirkt dort nicht: Chip im Zustand «gewählt, hier
// ohne Wirkung» (Durchstreichung, nicht Farbe allein) und ein Satz UNTER der Filterzeile, ohne die Klappe
// zu öffnen. «BS» wirkt: kein Satz, kein Sonderzustand.
for (const flaeche of [
  { name: '375 hell', breite: 375, hoehe: 800, farbe: 'light' as const },
  { name: '375 dunkel', breite: 375, hoehe: 800, farbe: 'dark' as const },
  { name: '1440 hell', breite: 1440, hoehe: 900, farbe: 'light' as const },
  { name: '1440 dunkel', breite: 1440, hoehe: 900, farbe: 'dark' as const },
]) {
  test.describe(`Kantonfilter-Hinweis @${flaeche.name}`, () => {
    test.use({ viewport: { width: flaeche.breite, height: flaeche.hoehe }, colorScheme: flaeche.farbe })

    test('ZH an StPO Art. 5: Satz sichtbar, Chip durchgestrichen, Liste unverändert, kein Seitenüberlauf', async ({ page }, info) => {
      await page.addInitScript(() => {
        try { localStorage.setItem('lm.leser.optionen', JSON.stringify({ bezugKantone: ['ZH'] })) } catch { /* Speicher gesperrt */ }
      })
      await panelOeffnen(page)
      const satz = panel(page).locator('[data-v3-panel-kanton-hinweis]')
      await expect(satz).toBeVisible({ timeout: 20_000 })
      await expect(satz).toHaveText('Kein Entscheid aus ZH an Art. 5 — angezeigt sind alle Kantone.')
      // Die kantonalen Entscheide (BS) stehen weiter da — Verhalten bleibt (Variante A).
      await expect(panel(page).locator('[data-v3-panel-gruppe="kantonal"]').first()).toBeVisible()
      await klappe(page, 0)
      const chip = panel(page).locator('[data-bezug-kanton="ZH"]')
      await expect(chip).toHaveAttribute('data-bezug-kanton-wirkung', 'keine')
      await expect(chip).toHaveAttribute('aria-pressed', 'true')
      await expect(chip).toHaveCSS('text-decoration-line', 'line-through')
      await chip.scrollIntoViewIfNeeded()
      await info.attach(`kantonfilter-${flaeche.name}`, { body: await page.screenshot(), contentType: 'image/png' })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      // Abwählen: Satz und Sonderzustand verschwinden.
      await chip.click()
      await expect(satz).toHaveCount(0)
    })

    test('BS an StPO Art. 5 wirkt: kein Satz, kein Sonderzustand', async ({ page }) => {
      await page.addInitScript(() => {
        try { localStorage.setItem('lm.leser.optionen', JSON.stringify({ bezugKantone: ['BS'] })) } catch { /* Speicher gesperrt */ }
      })
      await panelOeffnen(page)
      await expect(panel(page).locator('[data-v3-panel-gruppe="kantonal"]').first()).toBeVisible({ timeout: 20_000 })
      await expect(panel(page).locator('[data-v3-panel-kanton-hinweis]')).toHaveCount(0)
      await klappe(page, 0)
      await expect(panel(page).locator('[data-bezug-kanton="BS"]')).not.toHaveAttribute('data-bezug-kanton-wirkung', /.*/)
    })
  })
}
