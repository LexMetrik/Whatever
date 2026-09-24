// @shard-gruppe: 3
// ─── D39 · Begrüssung als Kopf, «Sammlung» weg, Datum + Uhrzeit darunter ────
//
// David 7.9.2026, wörtlich: «auf der homeseite entferne oberhalb der
// begrüssung das wort Sammlung und dann mach die begrüssung prominenter und
// klarer von dem darunter abgegrenzt. also das hallo und dann etwas kleiner
// datum und uhrzeit.»
//
// UMSETZUNG (`start/SuchBlock.tsx`, `start/Begruessung.tsx`):
//   1. das frühere Titelblatt-Wort «Sammlung» (eigene <h1>) ist weg — die
//      Begrüssung selbst ist jetzt die (einzige) <h1>, eine Typo-Stufe grösser
//      als zuvor (`text-h1 lg:text-display`, Skala aus `tailwind.config.js`).
//   2. darunter, kleiner: Wochentag, Datum UND — neu — die Uhrzeit, minütlich
//      nachgeführt («Montag, 7. September 2026 · 14:32»).
//   3. eine 1-px-Linie (`border-rule`, F0.6) plus grösserer Abstand grenzt den
//      Block sichtbar gegen die Bereichs-Reihe darunter ab.
//
// ZEITQUELLE: die Komponente ruft nur `new Date()`/`setInterval` — Playwrights
// `page.clock` (1.60, s. Kommentar in `Begruessung.tsx`) fängt das
// transparent ab, ohne dass die Komponente einen Test-Parameter bräuchte.
//
// ROT-PROBE (§6.7, ausgeführt 7.9.2026, drei Mutationen einzeln gefahren):
//   · `<h1>{SAMMLUNG_TITEL}</h1>` wieder vor die Begrüssung gesetzt (Vorzustand
//     wiederhergestellt): «kein «Sammlung» im Kopfbereich» + «Begrüssung ist
//     die H1» beide rot (H1-Text war «Sammlung», H1-Tag lag vor dem Gruss).
//   · Uhrzeit-Platzhalter durch bedingtes Rendering ohne Reservierung ersetzt
//     (`{uhrzeit && <span>· {uhrzeit}</span>}`, kein `visibility:hidden`-
//     Platzhalter mehr): CLS-Fall rot (`__cls` > 0 statt 0 — die Zeile sprang
//     beim Erscheinen der Uhrzeit auf, weil kein Platz mehr reserviert war).
//   · `border-b border-rule` aus dem SuchBlock-Container entfernt: Linien-Fall
//     rot (`borderBottomWidth` maass 0px statt 1px).
import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { tageszeitFuer, waehleBegruessung } from '../src/lib/begruessungen'

/** Montag, 7. September 2026, 14:32 — Davids eigenes Beispiel im Auftrag. */
const FIXIERT = new Date('2026-09-07T14:32:00')

async function geheMitFixierterUhr(page: Page, zeit: Date = FIXIERT): Promise<void> {
  await page.clock.install({ time: zeit })
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
}

/** Der Begrüssungs-Block (`start/SuchBlock.tsx`, `.max-w-[54rem]`-Wrapper um
 *  H1 + Datumszeile) — abgegrenzt von der Bereichs-Reihe, die als Nächstes im
 *  DOM folgt. */
const kopfBlock = (page: Page) => page.locator('main h1').first().locator('..')

test.describe('D39 · Begrüssung als Kopf', () => {
  test('kein «Sammlung» im Kopfbereich — die Begrüssung ist die (einzige) H1', async ({ page }) => {
    await geheMitFixierterUhr(page)
    const h1 = page.locator('main h1')
    await expect(h1).toHaveCount(1)
    const h1Text = (await h1.innerText()).trim()
    expect(h1Text, `H1-Text: «${h1Text}»`).not.toBe('')
    expect(h1Text, `H1-Text: «${h1Text}»`).not.toContain('Sammlung')
    // Kein «Sammlung» im ganzen Kopf-Block (H1 + Datumszeile) — die Bereichs-
    // Reihe darunter trägt den Namen «Bereiche der Sammlung» (Landmark, eigener
    // Abschnitt) unverändert weiter und ist NICHT Teil dieses Blocks.
    const blockText = await kopfBlock(page).innerText()
    expect(blockText, `Kopf-Block: «${blockText}»`).not.toContain('Sammlung')
    await expect(page.getByRole('navigation', { name: 'Bereiche der Sammlung' })).toBeVisible()
  })

  test('die Begrüssung (H1) ist optisch grösser als die Datumszeile darunter', async ({ page }) => {
    await geheMitFixierterUhr(page)
    const h1Gross = await page.locator('main h1').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    const datumZeile = kopfBlock(page).locator('p').first()
    const datumGross = await datumZeile.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(h1Gross, `H1 ${h1Gross}px vs. Datumszeile ${datumGross}px`).toBeGreaterThan(datumGross)
  })

  test('Datumszeile zeigt Wochentag, Datum und Uhrzeit im Format HH:MM, minütlich nachgeführt', async ({ page }) => {
    await geheMitFixierterUhr(page)
    const datumZeile = kopfBlock(page).locator('p').first()
    await expect(datumZeile).toHaveText('Montag, 7. September 2026 · 14:32')
    // Zwei Minuten vor — die Uhr tickt (`setInterval`, 60 s), Playwrights
    // virtuelle Uhr feuert die fälligen Timer beim Vorspulen synchron.
    await page.clock.fastForward('02:00')
    await expect(datumZeile).toHaveText('Montag, 7. September 2026 · 14:34')
  })

  test('Uhrzeit steht im Prerender-HTML nur als unsichtbarer, reservierter Platzhalter', async ({ page }) => {
    // Roh-HTML der Server-Antwort — VOR Hydration/Skripten. Die einzige
    // HH:MM-Stelle darin ist der unsichtbare `00:00`-Platzhalter, der die
    // Zeilenbreite reserviert; keine gebackene, echte Uhrzeit (§15, CLS).
    const antwort = await page.goto('/')
    const html = (await antwort?.text()) ?? ''
    expect(html, 'Platzhalter unsichtbar reserviert').toContain('visibility:hidden')
    expect(html.match(/\d{2}:\d{2}/g), 'einzige HH:MM-Stelle ist der Platzhalter').toEqual(['00:00'])
  })

  test('eine 1-px-Linie (--rule) trennt den Kopf-Block von der Bereichs-Reihe — @1440 und @390', async ({ page }) => {
    for (const breite of [1440, 390]) {
      await page.setViewportSize({ width: breite, height: 900 })
      await geheMitFixierterUhr(page)
      const linie = await kopfBlock(page).evaluate((el) => {
        const s = getComputedStyle(el)
        return { breite: s.borderBottomWidth, farbe: s.borderBottomColor }
      })
      expect(linie.breite, `@${breite}: Linienbreite`).toBe('1px')
      const ruleFarbe = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--rule').trim())
      // `--rule` ist selbst wieder eine Farbfunktion (`color-mix`/Hex, Theme-
      // abhängig) — verglichen wird gegen die vom Browser AUFGELÖSTE Farbe des
      // Elements, das dieselbe Variable referenziert (ein zweites, unabhängig
      // berechnetes Element via `--rule` direkt gesetzt).
      const aufgeloest = await page.evaluate((wert) => {
        const probe = document.createElement('div')
        probe.style.borderBottom = `1px solid ${wert}`
        document.body.appendChild(probe)
        const farbe = getComputedStyle(probe).borderBottomColor
        probe.remove()
        return farbe
      }, ruleFarbe)
      expect(linie.farbe, `@${breite}: Linienfarbe = --rule`).toBe(aufgeloest)
    }
  })

  test('CLS 0, wenn die Uhrzeit nach der Hydration erscheint (§15)', async ({ page }) => {
    // ROT-PROBE-BEFUND (7.9.2026, Voraussetzung für dieses Tor, §6.7): am
    // Gruss-/Datumstext dieser Runde ist die Zeile bei @1440 UND @390 nie so
    // knapp, dass «· 14:32» sie zum Umbruch zwänge — eine Mutation OHNE
    // `visibility:hidden`-Reservierung (bedingtes Rendern `{uhrzeit && …}`)
    // maass an BEIDEN Breiten dieselbe Zahl wie die Fassung MIT Reservierung
    // (@390 exakt 0, @1440 dieselbe Restrauschen-Zahl — Ursprung ausserhalb
    // dieses Blocks, unter der 0.01-Schwelle unten). Die Reservierung bleibt
    // trotzdem gebaut (CSS-Garantie: `visibility:hidden` nimmt nie eine Box
    // aus dem Fluss, anders als `display:none`/bedingtes Rendern — genau die
    // Zusage aus dem Auftrag) UND dieses Tor bleibt als Regression-Wächter
    // stehen: ein künftig längerer Gruss, der die Zeile doch zum Umbruch
    // zwingt, würde die Schwelle unten (0.01, zwei Grössenordnungen unter dem
    // Web-Vitals-«gut»-Wert 0.1) reissen.
    await page.clock.install({ time: FIXIERT })
    await page.addInitScript(() => {
      ;(window as unknown as { __cls: number }).__cls = 0
      new PerformanceObserver((liste) => {
        for (const e of liste.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.goto('/')
    await expect(page.locator('main h1')).toBeVisible()
    // Die Datumszeile trägt jetzt die echte Uhrzeit (Effekt ist gelaufen).
    await expect(kopfBlock(page).locator('p').first()).toContainText('14:32')
    await page.waitForTimeout(500)
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
    expect(cls, `CLS ${cls}`).toBeLessThan(0.01)
  })
})

// ─── Gruss pro Besuch, nach Besuchsstunde, ohne Tausch (16.9.2026) ─────────
//
// Entscheid David 16.9.2026 «a»: der Gruss soll wieder BEI JEDEM BESUCH
// wechseln und zur lokalen Stunde passen — ohne den LCP-Tausch, den QS-PERF
// #879 behoben hat. Umsetzung: konstantes Inline-Skript hinter der h1
// (`start/Begruessung.tsx`, `GRUSS_SKRIPT`), der Client übernimmt dessen Text.
//
// ROT-PROBE (§6.7, 16.9.2026) des Kein-Tausch-Wächters: `anfangsGruss()` so
// verändert, dass der Client IMMER selbst neu zieht (erste Zeile
// `return waehleBegruessung(new Date().getHours(), Math.random)`): rot mit
// «Endtext ≠ Skript-Gruss · null@5 → Die Suche steht bereit.@6 → Eine stille
// Stunde.@18 → null@70 → No am Läse?@372» (Build-Gruss, Skript-Gruss vor dem
// Paint, Loch des render-then-replace, Client-Neuzug = Tausch). CSP-Wächter:
// Hash in vercel.json um ein Zeichen verfälscht ⇒ Unit-Test UND der CSP-Fall
// unten rot («script-src-elem inline»). Grün danach 40/40 (`--repeat-each=8`,
// 5 Worker, warm).
// ─── Frame-Protokoll statt FCP-Vergleich (K9, 23.9.2026) ───────────────────
//
// Bis 23.9.2026 prüfte der Kein-Tausch-Fall «Skript-Gruss-Zeit ≤ FCP». Das war
// doppelt unscharf: (1) Chromium liefert `first-contentful-paint` auf 4 ms
// VERGRÖBERT (lokal 150/150 Messwerte Vielfache von 4, auch der CI-Wert 188),
// die MutationObserver-Zeit aber auf 0.1 ms — eine Marge unter 4 ms war damit
// Münzwurf (CI-Lauf 35877640481: Skript @189.9 gegen FCP 188, 1 Retry grün);
// (2) FCP ist die PRÄSENTATIONS-Zeit des Frames, nicht der Moment, in dem er
// gemalt wurde — gemessen (Stylesheet +150 ms, CPU 4×) malte der erste Frame
// bei ~170 ms den Build-Gruss, das Skript lief danach, FCP kam erst ~220 ms:
// der Fall blieb GRÜN, obwohl der falsche Gruss gemalt war.
// Jetzt: ein requestAnimationFrame-Protokoll hält in JEDEM Rendering-Durchgang
// den h1-Text fest. rAF läuft im selben Durchgang direkt vor Stil/Layout/Paint
// und NICHT, solange das Dokument render-blockiert ist (HTML-Standard «update
// the rendering»; gemessen: erster rAF stets nach dem Stylesheet-Ende). Zeigt
// kein Frame je einen anderen Gruss als den des Skripts, hat der Browser auch
// keinen anderen gemalt — ohne Zeitvergleich, ohne Vergröberung.
type Frame = { t: string | null; zeit: number }

async function frameProtokoll(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __frames: { t: string | null; zeit: number }[] }
    w.__frames = []
    const tick = () => {
      w.__frames.push({ t: document.querySelector('main h1')?.textContent ?? null, zeit: performance.now() })
      if (w.__frames.length < 300) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

/** Frames, die eine h1 mit einem ANDEREN Text als dem Skript-Gruss zeigten
 *  (`null` = h1 kurz weg beim render-then-replace: kein Tausch). */
function fremdeFrames(frames: Frame[], gezogen: string | undefined): Frame[] {
  return frames.filter((f) => f.t !== null && f.t !== gezogen)
}

const bildFrames = (frames: Frame[]) => frames.slice(0, 6).map((f) => `${f.t}@${Math.round(f.zeit)}`).join(' → ')

test.describe('Gruss pro Besuch (Entscheid David 16.9.2026 «a»)', () => {
  /** Math.random fest (bzw. als Folge) — VOR jedem Seitenskript. */
  async function zufallFest(page: Page, werte: number[]): Promise<void> {
    await page.addInitScript((w) => {
      let i = 0
      Math.random = () => w[i++ % w.length]
    }, werte)
  }

  for (const [stunde, zeit] of [[8, '2026-09-07T08:15:00'], [23, '2026-09-07T23:40:00']] as const) {
    test(`der Gruss stammt aus dem Pool der Besuchsstunde (${stunde} Uhr)`, async ({ page }) => {
      // Zufall 0 ⇒ Index 0 des Stunden-Pools = erster Gruss des TAGESZEIT-
      // Fensters (der Pool beginnt mit dem Fenster, `IMMER` folgt).
      await zufallFest(page, [0])
      await geheMitFixierterUhr(page, new Date(zeit))
      await expect(page.locator('main h1')).toHaveText(waehleBegruessung(stunde, () => 0))
      expect(tageszeitFuer(stunde).pool).toContain(await page.locator('main h1').innerText())
    })
  }

  test('zwei Besuche zur selben Stunde können verschiedene Grüsse liefern', async ({ browser }) => {
    const gesehen: string[] = []
    for (const r of [0.02, 0.87]) {
      const kontext = await browser.newContext()
      const page = await kontext.newPage()
      await zufallFest(page, [r])
      await geheMitFixierterUhr(page)
      await expect(page.locator('main h1')).toHaveText(waehleBegruessung(14, () => r))
      gesehen.push(await page.locator('main h1').innerText())
      await kontext.close()
    }
    expect(gesehen[0], gesehen.join(' · ')).not.toBe(gesehen[1])
  })

  test('kein Tausch: der vor dem ersten Paint gesetzte Gruss bleibt nach vollständigem Laden stehen', async ({ page }) => {
    // Folge statt fester Zahl: zöge der Client selbst noch einmal, bekäme er
    // einen ANDEREN Wert als das Inline-Skript (Rot-Probe oben).
    await zufallFest(page, [0.02, 0.87, 0.5, 0.33])
    await page.addInitScript(() => {
      const w = window as unknown as { __grussLog: { t: string | null; zeit: number }[] }
      w.__grussLog = []
      let zuletzt: string | null | undefined
      new MutationObserver(() => {
        const t = document.querySelector('main h1')?.textContent ?? null
        if (t !== zuletzt) { w.__grussLog.push({ t, zeit: performance.now() }); zuletzt = t }
      }).observe(document, { subtree: true, childList: true, characterData: true })
    })
    await frameProtokoll(page)
    // OHNE `page.clock`: die virtuelle Uhr ersetzt auch `performance` — die
    // Paint-Einträge fehlten dann (gemessen 16.9.2026: FCP `undefined`), und
    // für diese Zusage ist die Stunde egal.
    await page.goto('/')
    // App gebootet: die Uhrzeit kommt erst aus dem Mount-Effekt.
    await expect(kopfBlock(page).locator('p').first()).toHaveText(/\d{2}:\d{2}$/)
    await page.waitForTimeout(500)
    const { log, gezogen, frames, ende } = await page.evaluate(() => ({
      log: (window as unknown as { __grussLog: { t: string | null; zeit: number }[] }).__grussLog,
      gezogen: (window as unknown as { __lexmetrikGruss?: string }).__lexmetrikGruss,
      frames: (window as unknown as { __frames: { t: string | null; zeit: number }[] }).__frames,
      ende: document.querySelector('main h1')?.textContent,
    }))
    const bild = log.map((e) => `${e.t}@${Math.round(e.zeit)}`).join(' → ')
    expect(gezogen, `Inline-Skript lief nicht · ${bild}`).toBeTruthy()
    expect(ende, `Endtext ≠ Skript-Gruss · ${bild}`).toBe(gezogen)
    // Ab dem ersten Auftreten des Skript-Grusses zeigt die h1 nie einen
    // anderen Text (ein kurzes Fehlen der h1 beim render-then-replace ist kein
    // Tausch und wird übergangen).
    const erst = log.findIndex((e) => e.t === gezogen)
    expect(erst, bild).toBeGreaterThanOrEqual(0)
    const danach = log.slice(erst).filter((e) => e.t !== null && e.t !== gezogen)
    expect(danach, `Tausch nach dem Skript-Gruss · ${bild}`).toEqual([])
    // … und er stand VOR dem ersten Paint: kein Rendering-Durchgang zeigte je
    // einen anderen Gruss (Frame-Protokoll oben), und mindestens einer zeigte
    // den Skript-Gruss (sonst wäre die Aussage leer).
    expect(fremdeFrames(frames, gezogen), `Frame mit fremdem Gruss · ${bildFrames(frames)}`).toEqual([])
    expect(frames.some((f) => f.t === gezogen), `kein Frame mit dem Skript-Gruss · ${bildFrames(frames)}`).toBe(true)
  })

  // ─── Render-Sperre bis nach dem Wahl-Skript (K9, 23.9.2026) ──────────────
  // Wurzel des CI-Flackerns (Lauf 35877640481): das Wahl-Skript wartet auf das
  // noch ladende Stylesheet; trifft es ein, kann Chromium einen Frame malen,
  // BEVOR die nachgereichte Skript-Aufgabe läuft — der Build-Gruss ist dann
  // einen Frame lang zu sehen. Gemessen 23.9.2026 (Frame-Protokoll, Stylesheet
  // +150 ms, CPU 4×, n=30): 6/30 (main vor K7), 4/30 bzw. 3/30 (K7) Ladevorgänge
  // mit einem Frame «Benvenuti a tutti.» (Build-Gruss); mit der Sperre 0/60
  // und 0/30. Fix: `<link rel="expect" href="#…" blocking="render">` im <head>
  // (`scripts/prerender.ts`), Anker = die Datumszeile hinter dem Skript
  // (`GRUSS_ANKER_ID`, `Begruessung.tsx`).
  //
  // ROT-PROBE (§6.7, 23.9.2026), gegen den Build OHNE Sperre (Stand K7,
  // 908d34ff4): Struktur-Fall rot mit «rel=expect fehlt im <head> der
  // Startseite»; Verhaltens-Fall rot in 12/20 (`--repeat-each=20 --workers=1
  // --retries=0`, load 1.8→3.4) mit «Frame mit dem Build-Gruss · Lauf 4:
  // Benvenuti a tutti.@170 → Herzlich willkommen.@223 → …». Anker entfernt
  // (id nur noch im Pane): der Prerender bricht ab («Gruss-Anker
  // #gruss-gezogen fehlt hinter dem Wahl-Skript»). MIT Sperre: ganze Datei
  // 280/280 (`--repeat-each=20 --workers=1`, load 2.8→5.3) und dieser Block
  // 160/160 (`--workers=4`, load bis 11.5).
  test('Render-Sperre im Prerender-HTML: <link rel=expect blocking=render> zielt auf ein Element HINTER dem Wahl-Skript', async ({ page }) => {
    const antwort = await page.goto('/')
    const html = (await antwort?.text()) ?? ''
    const kopf = html.slice(0, html.indexOf('<body'))
    const link = kopf.match(/<link rel="expect" href="#([\w-]+)" blocking="render" \/>/)
    expect(link, 'rel=expect fehlt im <head> der Startseite').not.toBeNull()
    const anker = link![1]
    const skript = html.indexOf('<script data-gruss="wahl">')
    expect(skript, 'Wahl-Skript fehlt').toBeGreaterThan(0)
    const ankerPos = [...html.matchAll(new RegExp(`id="${anker}"`, 'g'))].map((m) => m.index)
    expect(ankerPos, `Anker #${anker} genau einmal`).toHaveLength(1)
    expect(ankerPos[0]!, `Anker #${anker} steht hinter dem Wahl-Skript`).toBeGreaterThan(skript)
  })

  test('kein Frame mit dem Build-Gruss, auch wenn das Stylesheet spät eintrifft (CPU 4×)', async ({ browser }) => {
    // Genau die CI-Lage, reproduzierbar: das Stylesheet kommt erst an, wenn der
    // Parser längst an der h1 steht, und die CPU ist knapp. Fünf frische
    // Kontexte je Lauf (ohne Sperre traf es ~15 % der Ladevorgänge, s. oben).
    const befunde: string[] = []
    for (let i = 0; i < 5; i++) {
      const kontext = await browser.newContext()
      const page = await kontext.newPage()
      const cdp = await kontext.newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
      await page.route(/\.css$/, async (route) => {
        await new Promise((r) => setTimeout(r, 150))
        await route.continue()
      })
      await frameProtokoll(page)
      await page.goto('/')
      await expect(kopfBlock(page).locator('p').first()).toHaveText(/\d{2}:\d{2}$/)
      const { gezogen, frames } = await page.evaluate(() => ({
        gezogen: (window as unknown as { __lexmetrikGruss?: string }).__lexmetrikGruss,
        frames: (window as unknown as { __frames: { t: string | null; zeit: number }[] }).__frames,
      }))
      expect(gezogen, 'Inline-Skript lief nicht').toBeTruthy()
      expect(frames.length, 'Frame-Protokoll leer').toBeGreaterThan(0)
      if (fremdeFrames(frames, gezogen).length > 0) befunde.push(`Lauf ${i + 1}: ${bildFrames(frames)}`)
      await kontext.close()
    }
    expect(befunde, `Frame mit dem Build-Gruss · ${befunde.join(' | ')}`).toEqual([])
  })

  // NACHZUG GEGENPRÜFUNG #899 (17.9.2026): das Inline-Skript läuft nur beim
  // Parser-Laden; `window.__lexmetrikGruss` bleibt danach für den ganzen Tab
  // stehen. Der Rückweg per `<Link to="/">` (Topbar-Logo) muss frisch aus der
  // DANN aktuellen Stunde ziehen, nicht den Gruss des ersten Aufrufs zeigen.
  // Zufall fest 0 ⇒ erster Gruss des jeweiligen Tageszeit-Fensters; 08 und
  // 23 Uhr liegen in verschiedenen Fenstern, die Grüsse unterscheiden sich.
  // ROT-PROBE (§6.7, 17.9.2026): gegen den Stand 992325c67 (jeder Mount
  // übernimmt `__lexmetrikGruss`) rot mit «Expected: Schönen späten Abend. ·
  // Received: Einen klaren Morgen.»; mit Einmal-Übernahme grün (3/3, CI=1).
  test('SPA-Rückweg auf «/» Stunden später: frischer Gruss aus dem Pool der neuen Stunde', async ({ page }) => {
    const morgens = waehleBegruessung(8, () => 0)
    const nachts = waehleBegruessung(23, () => 0)
    expect(nachts, 'Testannahme: verschiedene Fenster').not.toBe(morgens)
    await zufallFest(page, [0])
    await geheMitFixierterUhr(page, new Date('2026-09-07T08:15:00'))
    await expect(page.locator('main h1')).toHaveText(morgens)
    // DEKLARIERTE ANPASSUNG (§6.3, W2·29-WERKBANK-START S3, 24.9.2026): die
    // vier Kacheln unter «Bereiche der Sammlung» sind seit S3 alle Knöpfe, die
    // vor Ort aufklappen — keiner verlässt «/». Der SPA-Weg weg von «/» läuft
    // darum über den Inhalts-Link zum Fristenrechner; geprüft wird dieselbe
    // Zusicherung (frischer Gruss nach der Rückkehr).
    await page.locator('main#inhalt a[href="/rechner/tagerechner"]').first().click()
    await expect(page).not.toHaveURL(/\/$/)
    await page.clock.setSystemTime(new Date('2026-09-07T23:40:00'))
    await page.getByRole('link', { name: 'LexMetrik – Startseite' }).first().click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('main h1')).toHaveText(nachts)
    expect(tageszeitFuer(23).pool).toContain(await page.locator('main h1').innerText())
  })

  test('CSP aus vercel.json: das Inline-Skript läuft (sha256 passt zu den ausgelieferten Bytes)', async ({ page }) => {
    const vercel = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8')) as {
      headers: { source: string; headers: { key: string; value: string }[] }[]
    }
    const csp = vercel.headers.find((h) => h.source === '/(.*)')!.headers
      .find((h) => h.key === 'Content-Security-Policy')!.value
    await page.route((url) => url.pathname === '/', async (route) => {
      const antwort = await route.fetch()
      await route.fulfill({ response: antwort, headers: { ...antwort.headers(), 'content-security-policy': csp } })
    })
    await page.addInitScript(() => {
      const w = window as unknown as { __cspVerstoesse: string[] }
      w.__cspVerstoesse = []
      document.addEventListener('securitypolicyviolation', (e) => {
        w.__cspVerstoesse.push(`${e.violatedDirective} ${e.blockedURI}`)
      })
    })
    await geheMitFixierterUhr(page)
    await expect(kopfBlock(page).locator('p').first()).toContainText('14:32')
    const { gezogen, verstoesse } = await page.evaluate(() => ({
      gezogen: (window as unknown as { __lexmetrikGruss?: string }).__lexmetrikGruss,
      verstoesse: (window as unknown as { __cspVerstoesse: string[] }).__cspVerstoesse,
    }))
    expect(verstoesse.filter((v) => v.startsWith('script-src')), verstoesse.join(' | ')).toEqual([])
    expect(gezogen, 'Inline-Skript unter der Prod-CSP nicht gelaufen').toBeTruthy()
    await expect(page.locator('main h1')).toHaveText(gezogen!)
  })
})
