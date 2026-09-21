// @shard-gruppe: 8
// W2·5d-SPY (V3/H6) — Scroll-Spy-Härtung: rootMargin ↔ Bezugslinie.
//
// Herkunft: `fahrplaene/FAHRPLAN-GESETZES-UX.md` §10.10, Ausführungsvermerk
// E7/A33 — «V3 (rootMargin↔Bezugslinie-Kopplung, H6) bewusst deferiert — H6
// unreproduziert, Eingriff am Spy-Kern ohne Beleg (offener Härtungs-Posten)».
// Dieser Wächter IST der fehlende Beleg: er misst die Kopplung als Eigenschaft
// statt an festen Artikelnummern.
//
// Prüf-Eigenschaft (eine einzige, scharfe): Der Reader zeigt als «aktuellen
// Artikel» IMMER den Artikel an der Bezugslinie. Die Bezugslinie liegt 8 px unter
// dem Landepunkt eines Sprungs, und der Landepunkt wird GELESEN, nicht
// nachgerechnet (`.nt-anker`-scroll-margin = `var(--nt-stick)`,
// `scrollAnker.ts:ankerLandepunkt`); die Auswahl ist «Artikel, dessen Intervall
// die Linie enthält, sonst kleinste Distanz» (`src/lib/normtext/aktuellerArtikel.ts`)
// über die Kandidaten, die an der Linie noch nicht zu Ende sind
// (Zwischenraum-Regel, `inhalt-hooks.tsx`). Der Test rechnet dieses Soll bei jedem
// Halt über ALLE Artikel im DOM aus und vergleicht es mit dem Ist, das der Spy
// meldet (bis 6.9.2026 die Kopfzeile, seit D27 das Reiter-Signal — Herleitung an
// der Messfunktion unten).
// Er kennt darum keinen Artikel auswendig und überlebt jede Korpus-Regeneration.
//
// NACHTRAG 9.8.2026 (Sprung-Fix, deklarierte Änderung): zwei Zeilen der Sonde
// sind mitgezogen — Linie und Kandidatensatz. Herleitung unten bei `messen`.
//
// Vor dem Fix rot (gemessen 3.8.2026 gegen `origin/main`, vite preview):
//   H6-b «Auslöser sitzt am Band, nicht an der Linie» — der Observer meldete nur
//     Band-Ein-/Austritte (`rootMargin: '0px 0px -55% 0px'`), der Wechsel kam
//     erst beim Verlassen der Band-OBERkante, also 5rem + 8 px Scrollweg zu spät:
//     BGFA 5/24 Proben (bis 65 px), OR 3/30, OR mit Schriftskala 140 % 2/24.
//   H6-a «Band verfehlt die Linie» — bei 0,45 · H_root < 5rem + 8 (Viewport
//     320×200 ≙ 400 % Browser-Zoom, WCAG 1.4.10 Reflow) lag der Artikel an der
//     Linie ausserhalb des Bandes: 3/24 Proben, Kandidatensatz teils LEER.
// Nach dem Fix (Band = reiner Vorfilter über den ganzen Root, Auswertung pro
// Scroll-Frame gegen die frisch gemessene Linie) je 0/n.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { clsBeobachtenInstallieren, clsAuslesen } from './helpers/cls'

interface Probe {
  y: number; bezug: number; soll: string | null; ist: string | null; ueber: number | null; kandidaten: number
}

// Eine Messung im Seitenkontext: Soll (aus dem DOM) gegen Ist (Reiter-Signal).
async function messen(page: Page): Promise<Probe> {
  return page.evaluate(() => {
    const rects = [...document.querySelectorAll('[id^="art-"]')].map((el) => {
      const r = el.getBoundingClientRect()
      return { token: el.id.replace(/^art-/, ''), top: r.top, bottom: r.bottom }
    })
    // Bezugslinie EXAKT wie `scrollAnker.ts:bezugslinie(0, ankerLandepunkt(el))`
    // und wie der Spy sie in `inhalt-hooks.tsx` bildet.
    // GEÄNDERT 9.8.2026 (deklariert, zusammen mit dem Sprung-Fix): hier stand
    // `5 * remPx + 8` — eine dritte Kopie einer Zahl, die im Produktivcode nie
    // 5 rem war. Der Landepunkt ist `var(--nt-stick)` (am gebauten Reader 100 px).
    // Weil dieser Wächter die Linie NACHRECHNETE statt sie zu LESEN, bestätigte
    // er die 12-px-Fehlstellung, statt sie zu zeigen. Jetzt wird derselbe Wert
    // gelesen, den auch `scrollIntoView` benutzt: der `scroll-margin-top` des
    // `.nt-anker`. Damit ist die Sonde gegen jede künftige Kopfhöhe immun.
    const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const artEl = document.querySelector('[id^="art-"]')
    const landepunkt = artEl ? (parseFloat(getComputedStyle(artEl).scrollMarginTop) || 5 * remPx) : 5 * remPx
    const bezug = landepunkt + 8
    // Auswahl wie `aktiverArtikel` — hier bewusst über ALLE Artikel (das Soll),
    // während der Spy nur seine beobachtete Teilmenge sieht (das war H6-a).
    // GEÄNDERT 9.8.2026: davor die ZWISCHENRAUM-REGEL des Readers
    // (inhalt-hooks.tsx) — ein Artikel, der oberhalb der Linie bereits GEENDET
    // hat, ist nicht mehr «dran», solange darunter einer folgt; der Zwischenraum
    // gehört der Gliederungs-Überschrift, und die eröffnet, was FOLGT. Ohne diese
    // Zeile verlangte der Wächter am Abschnittskopf weiterhin den Vorgänger —
    // also genau den Zustand, den David am 9.8.2026 als Fehler gemeldet hat.
    // `e.top < hoehe` bildet den Kandidatensatz des Readers nach: dessen Auswahl
    // läuft über die vom IntersectionObserver gemeldeten Artikel, und was
    // vollständig UNTER dem Sichtfeld liegt, ist darin nicht enthalten. Bei
    // 320×200 (400 % Zoom, H6-a) kann der Zwischenraum einer Gliederungs-
    // Überschrift höher sein als das ganze Sichtfeld — dann gibt es unterhalb der
    // Linie gar keinen sichtbaren Artikel mehr, und der zuletzt geendete bleibt
    // die einzige ehrliche Antwort. Ohne diese Bedingung verlangte die Sonde einen
    // Artikel, den der Leser nachweislich nicht sieht (gemessen: 40_a, Oberkante
    // 149 px UNTER der Linie in einem 200 px hohen Sichtfeld).
    const hoehe = document.documentElement.clientHeight
    const kandidaten = rects.filter((e) => e.bottom > bezug && e.top < hoehe)
    // ── §6.3-DEKLARATION (W2·24, 6.9.2026) · DER RÜCKFALL BLEIBT IM BILD ────
    // Hier stand `: rects` — ALLE Artikel des Erlasses, auch die 1'600, die
    // gerade gar nicht auf dem Schirm sind. Damit konnte das Orakel einen
    // Artikel als «Soll» ausrufen, den der Leser nachweislich nicht sieht, und
    // genau das tat es im Fall H6-a (320×200, 400 % Zoom): mit der
    // Arbeitsleiste (R2) liegt die Bezugslinie bei 198 px in einem 200 px
    // hohen Sichtfeld, der Kandidatensatz ist dann ein 2-px-Fenster und
    // praktisch immer leer. Gemessen y=20744: das Orakel verlangte «40_b»,
    // dessen Oberkante 10 px UNTER dem unteren Bildrand lag, während der Spy
    // «40_a» meldete — den letzten Artikel, der oberhalb der Linie geendet
    // hat, also die einzige Antwort, die der Leser überhaupt sehen kann.
    // Der Rückfall bleibt darum im SICHTBAREN Satz. Das ist eine Verschärfung,
    // keine Aufweichung: ein Signal, das auf einen Artikel ausserhalb des
    // Bildes zeigt, wird ab jetzt gemeldet statt bestätigt — vorher war genau
    // das das «Soll». Die Zusage des Falls («der Artikel an der Linie bleibt
    // sichtbar») steht damit erstmals im Orakel selbst.
    const sichtbar = rects.filter((e) => e.bottom > 0 && e.top < hoehe)
    const wahl = kandidaten.length > 0 ? kandidaten : (sichtbar.length > 0 ? sichtbar : rects)
    let soll: string | null = null
    let besteDist = Infinity
    for (const e of wahl) {
      const dist = bezug < e.top ? e.top - bezug : bezug > e.bottom ? bezug - e.bottom : 0
      if (dist === 0) { soll = e.token; break }
      if (dist < besteDist) { besteDist = dist; soll = e.token }
    }
    // ── §6.3-DEKLARATION D27 (David 6.9.2026) · DAS IST STEHT WOANDERS ──────
    // Bis 6.9. war das Ist der Live-Artikel der Inhalts-KOPFZEILE («· Art. 40d»),
    // gelesen aus `nav .num`. Die Kopfzeile trägt ihn nicht mehr — «diese
    // funktion, dass es anzeigt, in welchem artikel wir sind, soll der tab
    // bekommen; es kann dann direkt im gesetz raus». Der Spy selbst ist
    // UNVERÄNDERT, und genau ihn misst dieser Fall; gemessen wird darum ab hier
    // sein verbliebener Abnehmer: das Reiter-Signal, das
    // `aktualisiereTabArtikel` (`lib/tabs.ts`) in `localStorage['lexmetrik-tabs']`
    // schreibt und aus dem die Arbeitsleiste ihre Lesestellung zieht.
    // DIE MESSUNG WIRD DABEI SCHÄRFER, nicht weicher: verglichen wird jetzt
    // Token gegen Token (`335_c`) statt Token gegen Anzeige-Label («335c») —
    // `norm()` unten deckt beide Formen ab, aber Schlusstitel-Token
    // (`disp_u1_art_3`) waren als Label gar nicht rückrechenbar (M13).
    // ZEITVERHALTEN: der Schreiber ist mit 200 ms entprellt (vorher 150 ms für
    // das Kopf-Label). Der Nachmess-Zweig unten wartet 900 ms und deckt das ab.
    // NULLPROBE (§0 Nr. 3, 6.9.2026): mit dieser Umstellung meldet der Fall
    // H6-a bitgleich dieselbe Abweichung wie der Ausgangsstand mit der alten
    // Messung (y=20744, «40_a» statt «40_b») — die Umstellung ist damit
    // verhaltensneutral belegt, und die Abweichung ist ein Altbefund.
    // Der Pfadteil wird EXAKT verglichen: im Split trägt der Reiter des primären
    // Panes die Adresse des zweiten im Query mit, ein `includes` träfe den
    // falschen (gemessen 6.9.2026 in `leser-v3-ortsangabe`).
    const ist: string | null = (() => {
      try {
        const roh = localStorage.getItem('lexmetrik-tabs')
        const arr = roh ? JSON.parse(roh) : []
        const hier = location.pathname.toLowerCase()
        const treffer = Array.isArray(arr)
          ? arr.find((e: { path?: string }) => typeof e?.path === 'string'
            && e.path.split('?')[0].split('#')[0].toLowerCase() === hier)
          : null
        const anker = treffer ? /#art-(.+)$/.exec(treffer.path) : null
        return anker ? decodeURIComponent(anker[1]) : null
      } catch { return null }
    })()
    const sollR = rects.find((r) => r.token === soll)
    return {
      y: Math.round(window.scrollY), bezug, soll, ist,
      ueber: sollR ? Math.round(bezug - sollR.top) : null, kandidaten: rects.length,
    }
  })
}

// Token («335_c») und Anzeige-Label («335c») vergleichbar machen.
const norm = (s: string | null): string | null => (s == null ? null : s.replace(/[_\s]/g, '').toLowerCase())

// Ein Lese-Scroll mit Halt: scrollen, einschwingen lassen, messen. Weicht das Ist
// ab, wird EINMAL nachgemessen — eine transiente Abweichung (F3-Entprellung 200 ms,
// content-visibility-Nachschätzung) verschwindet ohne weiteres Scrollen, eine
// strukturelle bleibt. Gezählt wird nur die bleibende (§6.7: der Wächter soll den
// Defekt fangen, nicht das Einschwingen).
// N2 (Bug-Check 3.8.2026): `delta === 0` heisst BEWUSST «gar nicht scrollen» — der
// Halt nach einem Sprung ist genau der Fall, in dem der Spy ohne Nutzerbewegung
// entscheiden muss. Vorher stand hier ein 150-px-Scroll, der den fehlenden
// Auslöser selbst lieferte und den Defekt verdeckte (§6.7).
async function scrollProbe(page: Page, delta: number, warteMs: number): Promise<Probe> {
  if (delta !== 0) await page.evaluate((d) => window.scrollBy(0, d), delta)
  await page.waitForTimeout(warteMs)
  const p = await messen(page)
  if (p.ist && norm(p.ist) !== norm(p.soll)) {
    await page.waitForTimeout(900)
    return messen(page)
  }
  return p
}

function abweichungen(proben: Probe[]): string[] {
  return proben
    .filter((p) => p.ist && norm(p.ist) !== norm(p.soll))
    .map((p) => `y=${p.y}: Signal meldet «${p.ist}», an der Bezugslinie (${p.bezug}px) liegt «${p.soll}» (Oberkante ${p.ueber}px über der Linie)`)
}

// ── N4 (Wächter-Härte, Bug-Check 3.8.2026) ──────────────────────────────────
// `abweichungen` lässt Proben mit `ist == null` bewusst durch: eine einzelne
// Probe darf in die Entprellungslücke fallen (150-ms-`setAktArtikel`-Timer), und
// beim Kopfzeilen-Umbau ist der Selektor kurz leer. Der Preis: fiele der Kopf
// GANZ aus (Spy feuert nie, Label wird nie gesetzt, `nav .num` verschwindet),
// wäre jede Probe `null` und der Wächter still grün — er misst dann nichts mehr.
// Darum je Lauf zusätzlich eine Mindestquote gemessener Ist-Werte.
// Schwelle 50 % — GEMESSEN begründet (4.8.2026, alle vier Tests dieser Datei mit
// probeweise auf 1.0 gesetzter Schwelle gefahren: grün, also Quote 100 % — 30/30,
// 24/24, 24/24, 10/10). 50 % lässt der Entprellung und dem Warmlauf also den
// halben Lauf Luft und fängt trotzdem jeden Defekt, bei dem der Kopf dauerhaft
// leer bleibt. Gegenprobe (§6.7, dass dieses Tor scheitern KANN): `ist` im
// Seitenkontext hart auf null gesetzt ⇒ «nur 0/30 Proben mit Ist-Wert», während
// `abweichungen` weiterhin [] lieferte — genau die Lücke, die N4 schliesst.
const MIN_IST_QUOTE = 0.5

function istQuote(proben: Probe[]): number {
  return proben.length ? proben.filter((p) => p.ist != null).length / proben.length : 0
}

function quoteMeldung(proben: Probe[]): string {
  return `nur ${proben.filter((p) => p.ist != null).length}/${proben.length} Proben mit Ist-Wert — schreibt der Spy überhaupt noch ein Reiter-Signal?`
}

test.describe('W2·5d-SPY — Bezugslinie entscheidet, nicht das Beobachtungs-Band', () => {
  // ── H6-b: der Wechsel muss AN der Linie fallen, nicht am Band-Rand ──────────
  // Flacher Erlass (BGFA, 40 Artikel): dort war der Verzug am grössten (bis 65 px),
  // weil zwischen zwei Band-Ereignissen viel Scrollweg liegt.
  test('H6-b — flacher Erlass: Lesestellung folgt der Bezugslinie ohne Verzug', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/BGFA')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(800)
    await page.evaluate(() => window.scrollTo(0, 3000))
    await page.waitForTimeout(1200)

    const proben: Probe[] = []
    for (let i = 0; i < 30; i++) proben.push(await scrollProbe(page, 43, 450))
    // Der Lauf muss überhaupt durch Artikelgrenzen gegangen sein, sonst prüft er nichts.
    expect(new Set(proben.map((p) => p.soll)).size, 'Sonde hat keine Artikelgrenze überquert').toBeGreaterThan(2)
    expect(istQuote(proben), quoteMeldung(proben)).toBeGreaterThanOrEqual(MIN_IST_QUOTE) // N4
    expect(abweichungen(proben), 'Lesestellung weicht von der Bezugslinie ab').toEqual([])
    expect(fehler).toEqual([])
  })

  // ── H6-b im tiefen Kodex (OR, 1686 Artikel, content-visibility) ─────────────
  test('H6-b — tiefer Kodex: Lesestellung folgt der Bezugslinie ohne Verzug', async ({ page }) => {
    test.setTimeout(process.env.CI ? 180_000 : 90_000)
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/OR')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 30000 })
    await page.waitForTimeout(1000)
    await page.evaluate(() => window.scrollTo(0, 20000))
    await page.waitForTimeout(1500)

    const proben: Probe[] = []
    for (let i = 0; i < 24; i++) proben.push(await scrollProbe(page, 43, 450))
    expect(new Set(proben.map((p) => p.soll)).size, 'Sonde hat keine Artikelgrenze überquert').toBeGreaterThan(1)
    expect(istQuote(proben), quoteMeldung(proben)).toBeGreaterThanOrEqual(MIN_IST_QUOTE) // N4
    expect(abweichungen(proben), 'Lesestellung weicht von der Bezugslinie ab').toEqual([])
    expect(fehler).toEqual([])
  })

  // ── H6-a: 400 % Browser-Zoom (WCAG 1.4.10 Reflow) ──────────────────────────
  // 320×200 CSS-px ≙ 400 % Zoom auf 1280×800. Dort war 0,45 · Root-Höhe (90 px)
  // ≈ die Bezugslinie (88 px): der Artikel an der Linie fiel aus dem Band, der
  // Kandidatensatz war zeitweise LEER und der Kopf blieb auf dem Vorgänger stehen.
  test('H6-a — 400 % Zoom (320×200): der Artikel an der Linie bleibt sichtbar', async ({ page }) => {
    test.setTimeout(process.env.CI ? 180_000 : 90_000)
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 320, height: 200 })
    await page.goto('/gesetze/bund/OR')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 30000 })
    await page.waitForTimeout(1000)
    await page.evaluate(() => window.scrollTo(0, 20000))
    await page.waitForTimeout(1500)

    const proben: Probe[] = []
    for (let i = 0; i < 24; i++) proben.push(await scrollProbe(page, 31, 450))
    expect(istQuote(proben), quoteMeldung(proben)).toBeGreaterThanOrEqual(MIN_IST_QUOTE) // N4
    expect(abweichungen(proben), 'Lesestellung weicht von der Bezugslinie ab (Band verfehlt die Linie)').toEqual([])
    expect(fehler).toEqual([])
  })

  // ── A9-Querschnitt: Bedienbarkeit + Flüssigkeit unter 6× CPU-Drossel ────────
  test('A9 — 6× Drossel: Spy treu, Gliederung tastaturbedienbar, CLS im Budget', async ({ page }) => {
    test.setTimeout(process.env.CI ? 180_000 : 120_000)
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/BGFA')
    await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('[data-toc]')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(800)

    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })
    // Messfenster erst JETZT scharf schalten (nur Shifts der gedrosselten
    // Interaktion, nicht der Warmlauf — Begründung in helpers/cls.ts).
    await clsBeobachtenInstallieren(page, false, true)

    // Lese-Scroll per Tastatur (echter Input): der Spy muss auch gedrosselt an der
    // Linie bleiben, und die Auto-Gliederung darf dabei nicht springen.
    await page.locator('article[id^="art-"]').first().click({ position: { x: 5, y: 5 } })
    const proben: Probe[] = []
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('PageDown')
      await page.waitForTimeout(700)
      const p = await messen(page)
      if (p.ist && norm(p.ist) !== norm(p.soll)) { await page.waitForTimeout(900); proben.push(await messen(page)) }
      else proben.push(p)
    }
    expect(istQuote(proben), quoteMeldung(proben)).toBeGreaterThanOrEqual(MIN_IST_QUOTE) // N4
    expect(abweichungen(proben), 'Lesestellung weicht unter 6× Drossel von der Bezugslinie ab').toEqual([])

    // aria: der aktive Gliederungs-Eintrag ist als solcher ausgezeichnet.
    // W2·19-GLIEDERUNG/S4 (F5) — deklarierte Anpassung, und zwar eine
    // VERSCHÄRFUNG (Bau-Spec §3.5, e2e-Freigabe David 8.8.2026). Bisher trugen
    // ALLE Vorfahren des Lesepfads `aria-current="true"`; ein Screenreader
    // meldete damit bis zu sechs gleichzeitige Standorte — eine Falschaussage
    // (§8), weshalb hier auch nur «mehr als null» geprüft werden konnte. Seit F5
    // trägt GENAU EINER die Marke, und zwar mit dem Wert `location`: es ist eine
    // Stelle im Dokument, keine Seite. Der Test prüft jetzt beides — Wert und
    // Anzahl — statt nur die blosse Anwesenheit.
    const aktiv = page.locator('[data-toc] [aria-current="location"]')
    expect(await aktiv.count(), 'genau EIN aria-current="location" im Gliederungsbaum').toBe(1)
    expect(await page.locator('[data-toc] [aria-current]').count(), 'kein zweites aria-current').toBe(1)

    // Tastatur-Bedienung: ein Gliederungs-Eintrag ist fokussierbar und springt per
    // Enter (bewusst der ERSTE Eintrag — der aktive läge schon am Ziel und der
    // Sprung wäre kein Beweis). S4: auf den ersten SPRUNG-Knopf einer Baumzeile
    // gescopt. Zwei Gründe, beide aus dieser Slice: seit Zone A im Scroller
    // klebt, wäre der erste Knopf in `[data-toc]` der Quickjump (Enter auf leerem
    // Feld bewegt zu Recht nichts), und innerhalb einer Zeile steht das Chevron
    // vor dem Sprungknopf — das Chevron klappt nur auf. `:not([aria-expanded])`
    // trifft genau den Knopf, den der Test immer meinte.
    // H4-UMHÄNGUNG (Flip 18.8.2026) — gleicher Befund, gleiche Begründung wie in
    // `leser-ruecksprung-r5-r7` (dort ausführlich): `:not([aria-expanded])`
    // trennt in V3 NICHTS mehr, weil der Titel-Knopf dort selbst
    // `aria-expanded` trägt (er klappt einen geschlossenen Ast beim Sprung mit
    // auf, `SektionBaumTOC`). Gemessen 18.8.2026: der Locator fand 0 Elemente
    // und lief ins 120-s-Budget, ohne je etwas zu prüfen — ein Tor, das nicht
    // scheitern KANN, sondern nur hängt (§6.7). Trennscharf in BEIDEN Hüllen ist
    // `title`: den trägt der Titel-Knopf (voller Etikett-Text), das Chevron
    // nicht (es hat nur `aria-label`). Die geprüfte Sache ist unverändert — ein
    // Gliederungs-Eintrag ist fokussierbar und springt per Enter.
    // §6.3-DEKLARATION (W2·24-R6c, P8): Sprung-Zeile = `<a href>`, sonst `button`.
    const ziel = page.locator('[data-toc] li[data-sektion-id] :is(a, button)[title]:visible').first()
    await ziel.focus()
    await expect(ziel).toBeFocused()
    const vorher = await page.evaluate(() => Math.round(window.scrollY))
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    const nachher = await page.evaluate(() => Math.round(window.scrollY))
    expect(Math.abs(nachher - vorher), 'Enter auf dem Gliederungs-Eintrag bewegt die Seite nicht').toBeGreaterThan(50)

    // Und nach dem Sprung fängt der Spy wieder EXAKT an der Linie an — ein
    // Klick-Sprung darf ihn nicht dauerhaft entkoppeln (jumpLock-Übergabe).
    // N2: OHNE weiteres Scrollen (delta 0). Der jumpLock fällt 500 ms nach dem
    // Sprung per Timer; wer erst die nächste Nutzerbewegung abwartet, prüft die
    // Lock-Übergabe gar nicht. 900 ms Wartezeit > 500 ms Lock + Entprellung.
    const nachSprung = await scrollProbe(page, 0, 900)
    // N4: hier zwingend ein Ist — sonst prüfte `abweichungen` an einer leeren
    // Kopfzeile vorbei und die N2-Aussage wäre leer.
    expect(nachSprung.ist, 'nach dem Sprung meldet der Spy gar keine Lesestellung').not.toBeNull()
    expect(abweichungen([nachSprung]), 'nach dem Gliederungs-Sprung folgt der Kopf der Bezugslinie nicht mehr (jumpLock ohne Nachlauf?)').toEqual([])

    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    // CLS-Budget wie im A9-Querschnitt der Reader-Specs (0.05, leser-gliederung-a33).
    const cls = await clsAuslesen(page)
    expect(cls.cls, `CLS ${cls.cls} über Budget — ${cls.bericht}`).toBeLessThan(0.05)
    expect(fehler).toEqual([])
  })
})
