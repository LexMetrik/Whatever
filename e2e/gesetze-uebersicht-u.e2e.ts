// @shard-gruppe: 6
// U-UEBERSICHT (W2·5d · A14 + A15) — Gliederungs-Umschalter auf allen drei
// Säulen (Relevanz · Systematisch · Rechtsgebiet), Kanton-Titelumbruch statt
// Kappen, Persistenz + Deep-Links, URL-Kompatibilität, Flüssigkeit @6×-Throttle
// (A9). Reine Darstellung (§3); läuft gegen `vite preview` (dist).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

async function keinOverflow(page: Page) {
  const b = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  expect(b.scroll, `scrollWidth ${b.scroll} > ${b.client}`).toBeLessThanOrEqual(b.client + 1)
}

test.describe('U-UEBERSICHT — Gliederungs-Umschalter (A15)', () => {
  test('Bund: Relevanz · Systematisch · Rechtsgebiet umschaltbar, URL trägt ?gliederung=', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze?ebene=bund')
    const main = page.getByRole('main')
    const gruppe = main.getByRole('group', { name: 'Gliederung' })
    await expect(gruppe).toBeVisible()

    // Default = Systematisch (die amtliche Systematik, byte-gleich zum Ist-Stand).
    await expect(gruppe.getByRole('button', { name: 'Systematisch' })).toHaveAttribute('aria-pressed', 'true')
    await expect(main.getByRole('button', { name: 'Alle aufklappen' })).toBeVisible()

    // Relevanz → flaches Gitter «die relevantesten zuerst» + Leitgesetze (BV) sichtbar.
    await gruppe.getByRole('button', { name: 'Relevanz' }).click()
    await expect(page).toHaveURL(/gliederung=relevanz/)
    await expect(main.getByText(/relevantesten Erlasse zuerst/)).toBeVisible()
    await expect(main.getByRole('link', { name: /Bundesverfassung/ }).first()).toBeVisible()

    // Rechtsgebiet → G6-Sicht (Querschnitts-Themen) als Modus in der Bund-Säule.
    await gruppe.getByRole('button', { name: 'Rechtsgebiet' }).click()
    await expect(page).toHaveURL(/gliederung=rechtsgebiet/)
    await expect(main.getByRole('heading', { name: 'Querschnitts-Themen' })).toBeVisible()

    expect(fehler).toEqual([])
  })

  test('International: Relevanz + SR-0.*-Rechtsgebiet-Gruppen', async ({ page }) => {
    await page.goto('/gesetze?ebene=international&gliederung=rechtsgebiet')
    const main = page.getByRole('main')
    await expect(main.getByText(/Völkerrechts-Sachachse/)).toBeVisible()
    // 0.1 «Internationales Recht — Allgemeines» (EMRK u.a.).
    await expect(main.getByRole('heading', { name: /Internationales Recht/ }).first()).toBeVisible()
    // Relevanz-Modus rendert ein Karten-Gitter.
    await main.getByRole('group', { name: 'Gliederung' }).getByRole('button', { name: 'Relevanz' }).click()
    await expect(main.getByText(/relevantesten Erlasse zuerst/)).toBeVisible()
  })

  test('Deep-Link setzt die Sicht direkt', async ({ page }) => {
    await page.goto('/gesetze?ebene=bund&gliederung=relevanz')
    const main = page.getByRole('main')
    await expect(main.getByRole('group', { name: 'Gliederung' }).getByRole('button', { name: 'Relevanz' }))
      .toHaveAttribute('aria-pressed', 'true')
    await expect(main.getByText(/relevantesten Erlasse zuerst/)).toBeVisible()
  })

  test('Persistenz: die geklickte Wahl gilt auf einer anderen Säule ohne ?gliederung=', async ({ page }) => {
    // Ein Klick persistiert (localStorage) — eine Wahl für alle drei Säulen (A15).
    await page.goto('/gesetze?ebene=bund')
    const main = page.getByRole('main')
    await main.getByRole('group', { name: 'Gliederung' }).getByRole('button', { name: 'Relevanz' }).click()
    await expect(main.getByText(/relevantesten Erlasse zuerst/)).toBeVisible()
    // Frische Navigation auf eine andere Säule OHNE Parameter → persistente Wahl gilt.
    await page.goto('/gesetze?ebene=international')
    await expect(main.getByRole('group', { name: 'Gliederung' }).getByRole('button', { name: 'Relevanz' }))
      .toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('U-UEBERSICHT — Kanton (A14: Relevanz + Titelumbruch)', () => {
  // ── DEKLARIERTE ANPASSUNG (D24, David 6.9.2026) ──────────────────────────
  // Zwei Dinge haben sich am gemessenen Gegenstand geändert, beide auf
  // ausdrückliche Weisung:
  // (1) Der Erklärabsatz «Die Kern-Erlasse zuerst …» ist entfallen
  //     (Sprach-Diät); sein Inhalt steht als `title` am Reiter «Relevanz».
  //     Die Latte, dass die Relevanz-Sicht wirklich steht, hängt darum jetzt
  //     an der Liste selbst — an ihrem zugänglichen Namen, nicht an einem
  //     Fliesstext, der jederzeit umformuliert werden darf.
  // (2) Der Titel wird auf ZWEI ZEILEN gekappt («keine Titel-Umbrüche über
  //     3 Zeilen», D24) — A14 (5.7.2026) hatte «gar nicht kappen» verlangt,
  //     was die Zeilenhöhen der beiden Spalten auseinandertrieb (bis 105 px
  //     Versatz, gemessen 6.9.2026). Die ABSICHT von A14 — «aktuell viel
  //     abgeschnitten», der volle amtliche Titel muss erreichbar bleiben —
  //     wird nicht fallengelassen, sondern SCHÄRFER geprüft: nicht mehr nur
  //     «kein nowrap», sondern zusätzlich, dass der volle Wortlaut im
  //     `title`-Attribut steht (§8) und länger ist als der sichtbare Rest.
  test('Relevanz-Sortierung; langer Titel bleibt vollständig erreichbar (BS)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze?ebene=kanton&kt=BS&gliederung=relevanz')
    const main = page.getByRole('main')
    await expect(main.getByRole('list', { name: /Erlasse nach Relevanz/ })).toBeVisible()

    // A14: der Titel wird NICHT einzeilig gekappt (kein `truncate`/white-space:nowrap).
    const zeile = main.locator('a[href^="/gesetze/kanton/BS-"]').first()
    await expect(zeile).toBeVisible()
    const titel = zeile.locator('span.tb-titel')
    const ws = await titel.evaluate((el) => getComputedStyle(el).whiteSpace)
    expect(ws).not.toBe('nowrap')
    // Der Titel-Text läuft nicht seitlich aus der Spalte (Umbruch, keine H-Kappung).
    const masse = await titel.evaluate((el) => ({ s: el.scrollWidth, c: el.clientWidth }))
    expect(masse.s, `Titel scrollWidth ${masse.s} > clientWidth ${masse.c} (seitlich gekappt)`)
      .toBeLessThanOrEqual(masse.c + 1)

    // §8/A14-Kern: der ganze amtliche Titel ist erreichbar, auch wo zwei Zeilen
    // ihn optisch abschneiden — er steht vollständig im `title`.
    const langeZeile = main.locator('a[href^="/gesetze/kanton/BS-"]')
      .filter({ has: page.locator('span.tb-titel') })
    const anzahl = await langeZeile.count()
    let geprueft = 0
    for (let i = 0; i < Math.min(anzahl, 40); i++) {
      const t = langeZeile.nth(i).locator('span.tb-titel')
      const attr = await t.getAttribute('title')
      const text = (await t.innerText()).trim()
      expect(attr, 'jede Titel-Zelle trägt den vollen Wortlaut als title').toBeTruthy()
      expect(attr!.length, 'der title ist nie kürzer als der sichtbare Text')
        .toBeGreaterThanOrEqual(text.replace(/…$/, '').trim().length)
      geprueft++
    }
    expect(geprueft, 'mindestens eine Zeile geprüft (Leer-Treffer-Schutz)').toBeGreaterThan(0)
    expect(fehler).toEqual([])
  })

  test('Kanton @390: kein H-Overflow in Relevanz und Rechtsgebiet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze?ebene=kanton&kt=BS&gliederung=relevanz')
    // D24: Latte auf der Liste statt auf dem entfallenen Erklärabsatz (s. o.).
    await expect(page.getByRole('main').getByRole('list', { name: /Erlasse nach Relevanz/ })).toBeVisible()
    await keinOverflow(page)
    await page.getByRole('main').getByRole('group', { name: 'Gliederung' }).getByRole('button', { name: 'Rechtsgebiet' }).click()
    await expect(page.getByRole('main').getByText(/Nach Rechtsgebiet gruppiert/)).toBeVisible()
    await keinOverflow(page)
  })
})

test.describe('U-UEBERSICHT — URL-Kompatibilität (bestehende Deep-Links)', () => {
  test('?ansicht=rechtsgebiet (G6-Tür) bleibt erreichbar', async ({ page }) => {
    await page.goto('/gesetze?ansicht=rechtsgebiet')
    await expect(page.getByRole('heading', { name: 'Querschnitts-Themen' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Grundgerüst nach Rechtsgebiet' })).toBeVisible()
  })

  test('?ebene=kanton&kt=ZH bleibt Default Systematisch (amtliche Ordner)', async ({ page }) => {
    // Fachliche Aenderung 1.9.2026 (§6.3, deklariert): ZH traegt seit der
    // Kern-Tranche den amtlichen Systematik-Baum — der Deep-Link zeigt
    // weiterhin die systematische Default-Ansicht, jetzt mit Ordner-Namen.
    await page.goto('/gesetze?ebene=kanton&kt=ZH')
    await expect(page.getByText(/Gerichtsorganisation - Zivilrecht/).first()).toBeVisible()
  })

  test('?ebene=bund bleibt Default Systematisch (Alle aufklappen)', async ({ page }) => {
    await page.goto('/gesetze?ebene=bund')
    await expect(page.getByRole('main').getByRole('button', { name: 'Alle aufklappen' })).toBeVisible()
  })
})

test.describe('U-UEBERSICHT — A9 Flüssigkeit unter CPU-Throttle 6×', () => {
  test('Umschalten bleibt flüssig, ohne Fehler', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 6 })
    await page.goto('/gesetze?ebene=bund')
    const main = page.getByRole('main')
    const gruppe = main.getByRole('group', { name: 'Gliederung' })
    await expect(gruppe).toBeVisible()

    for (const [name, marke] of [
      ['Relevanz', /relevantesten Erlasse zuerst/],
      ['Rechtsgebiet', /Querschnitts-Themen/],
      ['Systematisch', /Alle aufklappen/],
    ] as const) {
      const t0 = Date.now()
      await gruppe.getByRole('button', { name }).click()
      if (name === 'Systematisch') {
        await expect(main.getByRole('button', { name: 'Alle aufklappen' })).toBeVisible({ timeout: 8000 })
      } else {
        await expect(main.getByText(marke).first()).toBeVisible({ timeout: 8000 })
      }
      // Grosszügiges Budget (6×-gedrosselt): der Umschalter reagiert ohne Hänger.
      expect(Date.now() - t0, `Umschalten «${name}» zu langsam`).toBeLessThan(6000)
    }
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    expect(fehler).toEqual([])
  })
})
