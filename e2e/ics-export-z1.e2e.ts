// @shard-gruppe: 7
// ─── W2·10-UI-NAV-Z1 · ICS-Ausleitung des Frist-Ergebnisses ────────────────
//
// Ist-Aufnahme vor dem Bau (Vintage-Regel §0.1): der geteilte Baustein
// `lib/icsExport.ts` + `IcsExportButton` existiert seit FAHRPLAN-PRAXIS 1.1 und
// wird von elf Formularen getragen. Die einzige verbliebene Lücke war der
// Schnell-/Tagerechner (`EinfacheFristForm`) — ausgerechnet der meistbenutzte
// Einstieg (Startseite + /rechner/tagerechner). Genau diese Lücke prüft die
// Spec: dass der Knopf existiert, bedienbar ist und eine gültige, zum
// angezeigten Fristende passende .ics-Datei ausliefert.
//
// Zusätzlich die A9-Bedienbarkeits-/Flüssigkeits-Prüfung (DoD): Tastatur,
// Accessible Name, Tap-Ziel, CPU-Drossel 6× und CLS 0.
import { test, expect } from '@playwright/test'

const KNOPF = 'In Kalender (.ics)'

/** Liest die .ics aus dem Download-Ereignis als Text. */
async function icsHolen(page: import('@playwright/test').Page, klick: () => Promise<void>) {
  const [download] = await Promise.all([page.waitForEvent('download'), klick()])
  const strom = await download.createReadStream()
  const stuecke: Buffer[] = []
  for await (const s of strom) stuecke.push(s as Buffer)
  return { name: download.suggestedFilename(), text: Buffer.concat(stuecke).toString('utf8') }
}

// Der Ergebnisblock des Schnellrechners auf /rechner/tagerechner — die Seite
// trägt darunter zusätzlich den Voll-Rechner (#lc-ergebnis-allgemein), der
// seinen eigenen, seit FAHRPLAN-PRAXIS 1.1 bestehenden Export hat.
const EINFACH = '#lc-ergebnis-einfach'

test.describe('Z1 · Kalender-Ausleitung im Schnell-/Tagerechner', () => {
  test('Tagerechner liefert eine gültige .ics zum angezeigten Fristende', async ({ page }) => {
    await page.goto('/rechner/tagerechner')
    const knopf = page.locator(EINFACH).getByRole('button', { name: KNOPF })
    await expect(knopf, 'der Tagerechner trägt die Kalender-Ausleitung').toBeVisible()

    // Deterministische Eingabe statt des «heute»-Defaults: 10 Tage ab 1.6.2026
    // unter ZPO-Gerichtsferien (Vorbelegung des Rechners).
    await page.locator('input[placeholder="TT.MM.JJJJ"]').first().fill('01.06.2026')
    await expect(page.locator(EINFACH).getByText('Fristende', { exact: true })).toBeVisible()

    const { name, text } = await icsHolen(page, () => knopf.click())
    expect(name, 'Dateiname endet auf .ics').toMatch(/\.ics$/)
    const zeilen = text.replace(/\r\n /g, '').split('\r\n')
    expect(zeilen[0]).toBe('BEGIN:VCALENDAR')
    expect(zeilen.filter((z) => z === 'BEGIN:VEVENT')).toHaveLength(1)
    expect(text, 'Ganztages-DATE statt zeitzonenabhängigem Zeitstempel').toContain('DTSTART;VALUE=DATE:')
    expect(text, 'ein DATE trägt keine Zeitzone — kein TZID/VTIMEZONE').not.toContain('TZID')

    // Das exportierte Datum ist DAS angezeigte Fristende (kein zweites Rechnen, §3).
    const dtstart = zeilen.find((z) => z.startsWith('DTSTART'))!.split(':')[1]
    const angezeigt = await page.locator(`${EINFACH} .num`).first().innerText()
    const [tt, mm, jjjj] = angezeigt.replace(/^[^,]*,\s*/, '').trim().split('.')
    expect(dtstart, `DTSTART ${dtstart} entspricht der Anzeige «${angezeigt}»`).toBe(`${jjjj}${mm}${tt}`)

    // §8: die Vorbehalte der Anzeige reisen mit, der Export erfindet nichts.
    expect(text, 'zentrale Fusszeile «keine Rechtsberatung»').toContain('keine Rechtsberatung')
    expect(text, 'das gewählte Fristenlauf-Regime steht im Beschrieb').toContain('Fristenlauf')
  })

  // ── §9-Bug-Check M-1 (mittel, §1/§5) ────────────────────────────────────
  // Prüfer-Repro: ZWEI fachlich verschiedene Fristen mit demselben Endtag —
  // dieselbe Dauer einmal ohne Ferien, einmal unter ZPO-Gerichtsferien. Solange
  // der Titel konstant «Fristende» lautet, ist `UID:frist-<endtag>-<token>` für
  // beide identisch; RFC 5545 §3.8.4.7 verlangt aber eindeutige UIDs, und der
  // Kalender überschreibt den ersten Eintrag beim Import des zweiten STUMM.
  // Exakt die in `src/lib/icsExport.ts` dokumentierte Fehlerklasse M-1 vom
  // 7.6.2026 — nur an einem Formular, das kein Aktenzeichen-Feld trägt.
  test('M-1 — verschiedene Regimes mit gleichem Endtag ergeben verschiedene UIDs', async ({ page }) => {
    await page.goto('/rechner/tagerechner')
    const knopf = page.locator(EINFACH).getByRole('button', { name: KNOPF })
    await expect(knopf).toBeVisible()
    await page.locator('input[placeholder="TT.MM.JJJJ"]').first().fill('01.06.2026')

    const holen = async (regime: string) => {
      await page.locator(`input[name="einfache-frist-ferien"][value="${regime}"]`).check()
      await expect(knopf).toBeVisible()
      const { text } = await icsHolen(page, () => knopf.click())
      const entfaltet = text.replace(/\r\n /g, '')
      return {
        uid: entfaltet.split('\r\n').find((z) => z.startsWith('UID:'))!,
        dtstart: entfaltet.split('\r\n').find((z) => z.startsWith('DTSTART'))!,
        summary: entfaltet.split('\r\n').find((z) => z.startsWith('SUMMARY:'))!,
      }
    }

    const ohne = await holen('keine')
    const zpo = await holen('zpo')

    // Voraussetzung des Repros: derselbe Endtag — sonst wäre die UID ohnehin verschieden.
    expect(zpo.dtstart, 'beide Regimes enden am selben Tag (sonst greift das Repro nicht)').toBe(ohne.dtstart)
    // Und trotzdem sind es fachlich zwei verschiedene Fristen …
    expect(zpo.summary, 'die Titel unterscheiden die beiden Fristen').not.toBe(ohne.summary)
    // … also müssen auch die UIDs auseinandergehen.
    expect(zpo.uid, `UID kollidiert: ${ohne.uid}`).not.toBe(ohne.uid)
  })

  // DEKLARIERTE UMBENENNUNG (W2·23-STARTSEITE-V4, 5.9.2026): auf «/» steht seit
  // V4 kein Tab-Kasten «Schnellrechner» mehr, sondern die Fristen-ZEILE
  // (dieselbe `EinfacheFristForm`, Variante `zeile`). Die geprüfte Zusage —
  // die Startseite trägt dieselbe .ics-Ausleitung — ist unverändert.
  test('Startseiten-Fristenzeile trägt dieselbe Ausleitung', async ({ page }) => {
    await page.goto('/')
    const knopf = page.getByRole('button', { name: KNOPF }).first()
    await expect(knopf).toBeVisible()
    const { text } = await icsHolen(page, () => knopf.click())
    expect(text.startsWith('BEGIN:VCALENDAR')).toBe(true)
  })

  test('A9 — Tastatur, Accessible Name und Tap-Ziel', async ({ page }) => {
    await page.goto('/rechner/tagerechner')
    const knopf = page.locator(EINFACH).getByRole('button', { name: KNOPF })
    await expect(knopf).toBeVisible()

    // Accessible Name (kein Icon-only-Knopf).
    expect((await knopf.innerText()).trim()).toBe(KNOPF)

    // Tap-Ziel ≥ 24 × 24 CSS-px (WCAG 2.2 SC 2.5.8) — dieselbe Untergrenze,
    // die src/tests/tap-ziel-token.test.ts am Token festhält.
    const box = (await knopf.boundingBox())!
    expect(box.height, `Höhe ${box.height} ≥ 24`).toBeGreaterThanOrEqual(24)
    expect(box.width, `Breite ${box.width} ≥ 24`).toBeGreaterThanOrEqual(24)

    // Tastatur: fokussierbar und per Enter auslösbar.
    await knopf.focus()
    await expect(knopf).toBeFocused()
    const { text } = await icsHolen(page, async () => { await page.keyboard.press('Enter') })
    expect(text.startsWith('BEGIN:VCALENDAR')).toBe(true)
  })

  test('A9 — flüssig unter 6× CPU-Drossel, CLS 0', async ({ page, browser }) => {
    test.skip(browser.browserType().name() !== 'chromium', 'CDP-Drossel nur in Chromium')
    const cdp = await page.context().newCDPSession(page)
    await page.goto('/rechner/tagerechner')
    await expect(page.locator(EINFACH).getByRole('button', { name: KNOPF })).toBeVisible()

    // Layout-Shift-Zähler VOR der Interaktion scharf schalten.
    await page.evaluate(() => {
      ;(window as unknown as { __cls: number }).__cls = 0
      new PerformanceObserver((liste) => {
        for (const e of liste.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })

    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })
    const datum = page.locator('input[placeholder="TT.MM.JJJJ"]').first()
    const start = Date.now()
    for (const d of ['01.06.2026', '20.07.2026', '24.12.2026', '05.01.2027']) {
      await datum.fill(d)
      await expect(page.locator(EINFACH).getByRole('button', { name: KNOPF })).toBeVisible()
    }
    const dauer = Date.now() - start
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })

    // Vier vollständige Neuberechnungen inkl. Kalender-Neuzeichnung bei 6×
    // gedrosselter CPU. Grosszügige Obergrenze — sie schlägt erst bei einer
    // Long-Task-Kaskade an, nicht bei Runner-Streuung.
    expect(dauer, `4 Neuberechnungen unter 6× Drossel in ${dauer} ms`).toBeLessThan(12_000)

    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
    expect(cls, `CLS ${cls} — die Ausleitung verschiebt nichts`).toBeLessThanOrEqual(0.01)

    const fehler: string[] = []
    page.on('console', (m) => m.type() === 'error' && fehler.push(m.text()))
    expect(fehler).toEqual([])
  })
})
