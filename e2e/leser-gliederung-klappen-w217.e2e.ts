// @shard-gruppe: 4
// W2·17-UI-BEFUNDE · Gliederung — Klappen, «alles auf/zu», Tastatur (2.10.2026).
// Läuft gegen `vite preview` (dist). Je Fall der Befund, sein Beleg und der Weg zu rot (§6.7).
//
//  (a) B7 TASTATUR — Auf-/Zuklappen per Enter am Pfeil-Knopf schob den
//      Gliederungs-Scroller: der Nutzer-Guard des Mitscroll-Nudge kannte nur
//      wheel/pointerdown/touchstart. Gemessen OR @1440: Scroller 0 → 198 px,
//      fokussierter Pfeil 277 → 80 px. ROT: `keydown` aus der Guard-Liste in
//      `inhalt-hooks.tsx` streichen.
//  (b) B1-B04 — nach «alles zu» riss der Scroll-Spy den gelesenen Ast beim
//      nächsten Schritt wieder auf (der Knopf buchte die Zuklappung nicht); die
//      Sperre gilt nur bis zum nächsten Abschnittswechsel (Entscheid 2.10.2026).
//  (h) Regel K — selbst Zugeklapptes bleibt nach dem Ende der «alles zu»-Sperre zu.
//  (g) F1 — j/k mit Fokus im Baum schärften den keydown-Guard neu: die Gliederung
//      lief nicht mehr mit. ROT: `NAVIGATION`-Ausnahme in `inhalt-hooks.tsx` streichen.
//      ROT: in `leisteAufbau.tsx` «alles auf/zu» wieder direkt über `setTocBaum`.
//  (c) B1-B03 — nach «alles auf» nahm das Auto-Zuklappen die vom Spy zuvor
//      geöffneten Äste beim Weiterlesen wieder zurück. Gleicher Weg zu rot.
//  (d) B1-B01 — im flachen Index ohne Anhang-Ast (VwVG) stand ein «alles auf/zu»,
//      das nichts klappen konnte; mit Anhang-Ast (EMRK) klappt es genau diesen.
//      ROT: `alleKnopf` in `leisteAufbau.tsx` auf `true` festnageln.
//  (e) B1-B02 — «↑ Anfang» im Sheet liess das Blatt offen. ROT: `setTocAuf(false)`
//      aus `onAnfang` streichen.
//  (f) B7 REIHENFOLGE — NHG zeigte Art. 12–12f vor Art. 1 (freie Artikel am Ende).
import { test, expect, type Page } from '@playwright/test'

const baum = '[data-toc-baum]'
const pfeile = `${baum} li > div > button[aria-expanded]`

async function offenePfeile(page: Page): Promise<number> {
  return page.locator(`${pfeile}[aria-expanded="true"]`).count()
}
/** Programmatisch an einen Artikel — der Spy sieht es wie Lesen (Muster leser-gliederung-a33). */
async function zuArtikel(page: Page, nr: number) {
  await page.evaluate((n) => document.getElementById(`art-${n}`)?.scrollIntoView({ block: 'start' }), nr)
  await page.waitForTimeout(450)
}

test.describe('W2·17 Gliederung — Klappen und Tastatur (OR @1440)', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/gesetze/bund/OR')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('[data-toc]')).toBeVisible({ timeout: 10000 })
    expect(await page.evaluate(() => document.visibilityState), 'Spy-Messung braucht einen sichtbaren Tab').toBe('visible')
  })

  test('(a) Enter am Pfeil-Knopf bewegt den Gliederungs-Scroller nicht', async ({ page }) => {
    // Alles offen: die Marke (gelesene Stelle) liegt dann sicher weit unterhalb des Sichtbands.
    const alle = page.locator('[data-v3-alle]')
    await alle.click()
    await expect(alle).toContainText('alles zu')
    await zuArtikel(page, 1100)
    await expect(page.locator(`${baum} [data-toc-aktiv]`)).toHaveCount(1, { timeout: 10000 })
    // Der Nutzer blättert von Hand an den Anfang der Gliederung (Scroll arm't den Guard nicht).
    await page.evaluate(() => { (document.querySelector('[data-toc]') as HTMLElement).scrollTop = 0 })
    await page.waitForTimeout(1800) // der Spy-Nachlauf darf die Position vorher bewegen, nicht danach
    const knopf = page.locator(pfeile).first() // «Erste Abteilung», offen — Zuklappen schiebt alles darunter nach oben
    await knopf.focus()
    await expect(knopf).toBeFocused()
    const vorher = await page.evaluate(() => {
      const t = document.querySelector('[data-toc]') as HTMLElement
      const k = document.activeElement as HTMLElement
      return { top: t.scrollTop, y: k.getBoundingClientRect().top, offen: k.getAttribute('aria-expanded') }
    })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(900)
    const nachher = await page.evaluate(() => {
      const t = document.querySelector('[data-toc]') as HTMLElement
      const k = document.activeElement as HTMLElement
      return { top: t.scrollTop, y: k.getBoundingClientRect().top, offen: k.getAttribute('aria-expanded'), fokus: k.tagName }
    })
    expect(nachher.offen, 'Enter hat den Ast nicht umgeschaltet').not.toBe(vorher.offen)
    expect(nachher.fokus, 'der Fokus ist beim Umschalten verloren gegangen').toBe('BUTTON')
    expect(Math.abs(nachher.top - vorher.top), `Scroller sprang von ${vorher.top} auf ${nachher.top}`).toBeLessThanOrEqual(2)
    expect(Math.abs(nachher.y - vorher.y), `der Pfeil sprang von ${vorher.y} auf ${nachher.y}`).toBeLessThanOrEqual(2)
  })

  test('(b) nach «alles zu» öffnet der Spy den gelesenen Ast nicht — bis zum nächsten Abschnittswechsel', async ({ page }) => {
    await zuArtikel(page, 300) // der Spy öffnet den gelesenen Pfad von selbst
    const alle = page.locator('[data-v3-alle]')
    await alle.click()
    await expect(alle).toContainText('alles zu')
    await alle.click()
    await expect(alle).toContainText('alles auf')
    expect(await offenePfeile(page), 'Vorbedingung: alles zu').toBe(0)
    // Gleicher Abschnitt = gleiche oberste Gliederungsstufe (Art. 300–303): der Spy reisst den Ast NICHT wieder auf (B1-B04).
    for (const nr of [301, 302, 303]) await zuArtikel(page, nr)
    await page.waitForTimeout(900)
    expect(await offenePfeile(page), 'der Spy hat nach «alles zu» denselben Ast wieder aufgerissen').toBe(0)
    // Anderer Abschnitt: die Gliederung folgt wieder wie gewohnt (Entscheid 2.10.2026).
    await zuArtikel(page, 700)
    await expect.poll(() => offenePfeile(page), { timeout: 8000, message: 'die Gliederung folgt dem neuen Abschnitt nicht' })
      .toBeGreaterThan(0)
  })

  test('(h) Regel K: selbst Zugeklapptes bleibt nach dem Ende der «alles zu»-Sperre zu', async ({ page }) => {
    await zuArtikel(page, 300)
    const alle = page.locator('[data-v3-alle]')
    await alle.click()
    await expect(alle).toContainText('alles zu')
    await alle.click()
    await expect(alle).toContainText('alles auf')
    // Der Nutzer öffnet die «Zweite Abteilung» und schliesst sie selbst wieder (Pfeil-Knopf).
    const abteilung = page.locator(`${baum} button[aria-label^="«Zweite Abteilung"][aria-expanded]`)
    await expect(abteilung).toHaveCount(1)
    await abteilung.click()
    await expect(abteilung).toHaveAttribute('aria-expanded', 'true')
    await abteilung.click()
    await expect(abteilung).toHaveAttribute('aria-expanded', 'false')
    // Weiter in einen anderen Abschnitt (Sperre fällt), dann zurück: der Spy darf sie nicht wieder öffnen.
    await zuArtikel(page, 700)
    await expect.poll(() => offenePfeile(page), { timeout: 8000 }).toBeGreaterThan(0)
    await zuArtikel(page, 300)
    await zuArtikel(page, 301)
    await page.waitForTimeout(900)
    await expect(abteilung, 'der Spy hat den selbst geschlossenen Ast wieder aufgerissen').toHaveAttribute('aria-expanded', 'false')
  })

  test('(g) j/k mit dem Fokus auf einem Baum-Link: der Gliederungs-Spy läuft weiter mit', async ({ page }) => {
    test.setTimeout(90_000)
    // Alles offen, gelesen wird weit unten: ohne Nachführen läge die Marke bald ausserhalb des Sichtbands.
    const alle = page.locator('[data-v3-alle]')
    await alle.click()
    await expect(alle).toContainText('alles zu')
    await zuArtikel(page, 100)
    const marke = page.locator(`${baum} [data-toc-aktiv]`)
    await expect(marke).toHaveCount(1, { timeout: 10000 })
    await marke.focus()
    await expect(marke).toBeFocused()
    // Viele Schritte am Stück: jede Taste ist «Tastatur in der Gliederung», aber j/k bedienen den
    // LESETEXT (leserTastaturBelegung.NAVIGATION) — sie dürfen die Nachführ-Sperre nicht neu schärfen.
    for (let i = 0; i < 8; i++) { await page.keyboard.press('j'); await page.waitForTimeout(60) }
    await page.waitForTimeout(1000) // < 1,5 s Sperre: nur ein (fälschlich) scharfer Guard hält den Nudge noch zurück
    const sicht = await page.evaluate(() => {
      const t = document.querySelector('[data-toc]') as HTMLElement
      const m = document.querySelector('[data-toc-baum] [data-toc-aktiv]') as HTMLElement | null
      if (!m) return { marke: false, im: false }
      const r = m.getBoundingClientRect(); const c = t.getBoundingClientRect()
      return { marke: true, im: r.top >= c.top && r.bottom <= c.bottom }
    })
    expect(sicht.marke, 'keine aktive Marke nach 8× j').toBe(true)
    expect(sicht.im, 'der aktive Eintrag liegt nach 8× j ausserhalb des Gliederungs-Sichtbands').toBe(true)
  })

  test('(c) nach «alles auf» nimmt das Weiterlesen keinen Ast zurück', async ({ page }) => {
    await zuArtikel(page, 1100) // der Spy öffnet den gelesenen Pfad von selbst (Auto-Lager)
    const alle = page.locator('[data-v3-alle]')
    await alle.click()
    await expect(alle).toContainText('alles zu')
    const n0 = await offenePfeile(page)
    expect(n0, 'Vorbedingung: viele offene Äste').toBeGreaterThan(30)
    // Mehr Pfadwechsel als der Auto-Zu-Nachlauf (6), der Pfad von Art. 1100 bleibt weit zurück
    // (oberhalb UND unterhalb des Sichtbands — beide Richtungen schliesst der Spy).
    for (const nr of [1000, 900, 700, 500, 300, 100, 600, 1050]) await zuArtikel(page, nr)
    await page.waitForTimeout(900)
    const n1 = await offenePfeile(page)
    expect(n1, `offene Äste nach «alles auf»: ${n0}, nach dem Weiterlesen: ${n1}`).toBe(n0)
  })
})

test.describe('W2·17 Gliederung — Index-Modus und Sheet', () => {
  test('(d) «alles auf/zu»: VwVG (Index) ohne Knopf, EMRK (Index + Anhang) klappt den Anhang', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/VWVG')
    await expect(page.locator(`${baum} button[title]`).first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('[data-v3-alle]'), 'VwVG: flacher Index — nichts zu klappen').toHaveCount(0)
    await expect(page.locator('[data-v3-anfang]')).toHaveCount(1)

    await page.goto('/gesetze/international/EMRK')
    await expect(page.locator(`${baum} button[title]`).first()).toBeVisible({ timeout: 20000 })
    const alle = page.locator('[data-v3-alle]')
    await expect(alle, 'EMRK: der Anhang-Ast ist klappbar').toHaveCount(1)
    const anhang = page.locator(pfeile)
    await expect(anhang).toHaveCount(1)
    const vorher = await anhang.getAttribute('aria-expanded')
    await alle.click()
    await expect(anhang, 'der Knopf muss die sichtbare Zeile umschalten').not.toHaveAttribute('aria-expanded', vorher ?? '')
  })

  test('(e) «↑ Anfang» im Sheet schliesst das Blatt', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/gesetze/bund/ZGB')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })
    await page.getByRole('button', { name: 'Gliederung öffnen' }).click()
    const sheet = page.locator('[data-gliederung-sheet]')
    await expect(sheet).toBeVisible()
    await sheet.locator('[data-v3-anfang]').click()
    await expect(sheet, 'das Sheet blieb nach «↑ Anfang» offen').toHaveCount(0)
  })

  test('(f) NHG: der Index beginnt mit Art. 1, Art. 12–12f folgen auf Art. 11', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/NHG')
    const zeilen = page.locator(`${baum} button[title]`)
    await expect(zeilen.first()).toBeVisible({ timeout: 20000 })
    const titel = await zeilen.evaluateAll((els) => els.map((e) => (e.getAttribute('title') ?? '').split(' — ')[0]))
    expect(titel.slice(0, 3)).toEqual(['Art. 1', 'Art. 2', 'Art. 3'])
    expect(titel.indexOf('Art. 11')).toBeLessThan(titel.indexOf('Art. 12'))
    expect(titel.indexOf('Art. 12f')).toBeLessThan(titel.indexOf('Art. 12g'))
  })
})
