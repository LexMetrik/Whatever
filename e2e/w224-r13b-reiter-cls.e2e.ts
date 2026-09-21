// @shard-gruppe: 2
// ═══ W2·24 R13B · DIE REITERLEISTE SPRINGT NICHT (Nachzug §8 Nr. 8) ═════════
//
// ANLASS: zwei unabhängige Messungen am selben Defekt.
//   (1) PR #743 §8 b: «Reiterstreifen CLS 0.00136 — das führende «+» fällt beim
//       ersten Reiter weg.»
//   (2) Fixer D34 (7.9.2026): `e2e/leser-r1-r2.e2e.ts` «Suche, Fundstellen-
//       Sprung und Gliederungs-Sheet ohne Layout-Shift (CLS 0)» rot mit
//       0.000307 aus der Reiterleiste (`lc-schliessknopf`), Nullprobe auf
//       `cfa8a9f81` identisch, 1–2 von 3 Läufen rot.
//
// GEMESSEN am Stand `cfa8a9f81` (gebautes dist/, Preview 4429, Chromium @1280,
// PerformanceObserver `layout-shift`, nur input-freie Einträge, Quellen auf die
// Leiste gescopt). Die Zeitspur eines frischen ZGB-Reiters hatte VIER Zustände:
//
//   t=207 ms  leer      Streifen x60 b1196 h16   «+» x24 (links!)  kein Blatt
//   t=243 ms  1 Reiter  Streifen x24 b1116 h33   «+» x1140         Blatt da
//                       Reiter 131 px, Aufschrift «Gesetz öffnen»
//   t=260 ms            Reiter  80 px, Aufschrift «ZGB»  (Manifest eingetroffen)
//   erst beim Scrollen  Reiter 137 px, «Art. 5» — ✕ wandert 69 → 133
//
// Vier Ursachen, je eine eigene Shift-Zeile:
//   W1  zwei Aufrufstellen für das «+» (vor/nach dem Streifen)   0.000944
//   W2  Streifenhöhe und Trennkanten hingen am Reiterstand       (in W1 enthalten)
//   W3  Platzhalter-Aufschrift «Gesetz öffnen» (131) → «ZGB» (80) 0.000046 / 0.000521
//   W4  `.rl-stelle` mountete beim ersten Spy-Lauf (80 → 137 px)  ✕ 69 → 133
//
// NACH dem Fix: Leisten-Shift 0.000000 in allen Szenarien, und die Zeitspur hat
// nur noch ZWEI Zustände — leer (Streifen x24 b1116 h33, «+» x1140) und ein
// Reiter in seiner Endbreite.
//
// ROT ZU BEKOMMEN (§6.7 — jede Massnahme einzeln gegen den Fix-Stand gefahren,
// 7.9.2026; Werte = `leisteCls` dieser Sonde):
//   W1  `Reiterleiste.tsx`: `{plusKnopf(leer)}` zurück auf
//       `{!leer && plusKnopf(false)}` + `{leer && plusKnopf(true)}` vor den
//       Streifen ⇒ Fall «Öffnen» rot.
//   W2  `Reiterleiste.tsx`: das Blatt wieder in `{!leer && (…)}` hängen bzw.
//       `h-full` an der Zeile streichen ⇒ Fall «Öffnen» rot.
//   W3  `lib/tabs.ts`: `vorlaeufig` streichen (zurück auf `?.kuerzel`) ⇒ Fälle
//       «Öffnen» und «zweiter Reiter» rot.
//   W4  `Reiter.tsx`: den `.rl-stelle-frei`-Zweig streichen ⇒ Fall
//       «Lesestellung» rot (und die Breitenzusage darin bricht).
import { test, expect, type Page } from '@playwright/test'

const LEISTE = 'nav[aria-label="Offene Reiter"]'
/** Startroute BEWUSST ohne eigenen Reiter (`lib/tabs.istReiterPfad`) — sonst
 *  stünde die Leiste schon beim Laden nicht leer und der Fall «der erste
 *  Reiter entsteht» wäre gar nicht messbar. Muster aus `w224-r11-reiterleiste`.
 *
 *  ── DEKLARIERTE SONDEN-ÄNDERUNG (§6.3) · R14b, 7.9.2026 ──────────────────
 *  Seit R14b trägt `/kontakt` den Reiter «Kontakt» — der 0-Reiter-Zustand ist
 *  ersatzlos weg, `data-reiter-leer` existiert nicht mehr. Der GEGENSTAND
 *  beider Fälle bleibt unverändert: dass «+», Blatt und Streifen ihren Platz,
 *  ihre Breite und ihre Höhe halten, wenn der Reiter-Bestand wechselt.
 *  Gemessen wird jetzt der Wechsel Meta-Reiter → Gesetzes-Reiter statt
 *  0 Reiter → 1 Reiter; die Zahlen, die verglichen werden, sind dieselben. */
const START = '/kontakt'
const ZGB = '/gesetze/bund/ZGB'
const OR = '/gesetze/bund/OR'

test.describe.configure({ timeout: 120_000 })

// ── Der Beobachter, GESCOPT auf die Leiste ──────────────────────────────────
// Gemessen wird nur, was die Reiterleiste verschiebt. Alles andere auf diesen
// Seiten (der Leser baut seine Spalten spät auf, `DIV.lc-route` allein misst
// 0.047) gehört anderen Bau-Einheiten und wird mitprotokolliert, aber nicht
// zugerechnet (§0/3 «Verteilung statt Einzelwert»; dieselbe Trennung wie in
// `leser-r1-r2.e2e.ts`). Als `addInitScript` gesetzt, damit er eine
// SPA-Navigation ÜBERLEBT — der Fall «der erste Reiter entsteht» beginnt vor
// dem ersten Reiter und endet nach ihm.
async function beobachten(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __lcls: number; __lq: string[]; __fremd: number }
    w.__lcls = 0; w.__lq = []; w.__fremd = 0
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        const s = e as unknown as {
          value: number; hadRecentInput: boolean
          sources?: { node?: Element | null; previousRect?: DOMRectReadOnly; currentRect?: DOMRectReadOnly }[]
        }
        if (s.hadRecentInput) continue
        const q = s.sources ?? []
        const ausLeiste = q.filter((x) => !!x.node?.closest?.('nav[aria-label="Offene Reiter"]'))
        if (ausLeiste.length === 0) { w.__fremd += s.value; continue }
        w.__lcls += s.value
        for (const x of ausLeiste) {
          const n = x.node!
          const r = (d?: DOMRectReadOnly) => d ? `${Math.round(d.x)},${Math.round(d.y)} ${Math.round(d.width)}×${Math.round(d.height)}` : '-'
          w.__lq.push(`${n.tagName}.${String(n.className).slice(0, 45)} ${r(x.previousRect)} → ${r(x.currentRect)}`)
        }
      }
    }).observe({ type: 'layout-shift' })
  })
}
const lesen = (page: Page) => page.evaluate(() => {
  const w = window as unknown as { __lcls: number; __lq: string[]; __fremd: number }
  const out = { cls: w.__lcls, quellen: w.__lq, fremd: w.__fremd }
  w.__lcls = 0; w.__lq = []; w.__fremd = 0
  return out
})

/** Die Masse, an denen der Befund hing — «+», Blatt, Streifen, Schliess-✕. */
const masse = (page: Page) => page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Offene Reiter"]')!
  const kasten = (s: string) => {
    const el = nav.querySelector(s)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: Math.round(r.x), b: Math.round(r.width), h: Math.round(r.height) }
  }
  return {
    plus: kasten('.rl-plus'),
    blatt: kasten('[aria-haspopup="dialog"]'),
    streifen: kasten('[data-reiter-streifen]'),
    reiter: kasten('[data-reiter-aktiv="true"]'),
    kreuz: kasten('[data-reiter-aktiv="true"] .lc-schliessknopf'),
    stelle: nav.querySelector('.rl-stelle')?.textContent ?? null,
  }
})

const nurLeiste = (r: { cls: number; quellen: string[]; fremd: number }, was: string) =>
  expect(r.cls, `${was} — Layout-Shift MIT Reiterleisten-Quelle. Quellen: `
    + `${r.quellen.join(' | ') || '—'} (fremd, nicht zugerechnet: ${r.fremd})`).toBe(0)

test.describe('R13B — Reiterleiste: CLS 0 über Öffnen, Schliessen, Hover und Lesestellung', () => {
  test('der erste Reiter entsteht — «+», Blatt und Streifen halten ihren Platz', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await beobachten(page)
    await page.goto(START)
    await expect(page.locator(LEISTE)).toBeVisible({ timeout: 45_000 })
    // R14b: genau EIN Reiter, und er heisst «Kontakt» — statt des früheren
    // `[data-reiter-leer]`-Attributs, das es nicht mehr gibt (§6.7: kein Tor,
    // das nicht scheitern kann). Der Speicher wird danach geleert, damit das
    // folgende `page.goto` (ein KALTSTART, der nichts ersetzt) wieder bei
    // genau EINEM Reiter landet — sonst mässe der Fall 1 gegen 2 Reiter.
    await expect(page.locator('[data-reiter-streifen] [data-reiter-schluessel]')).toHaveCount(1)
    await page.evaluate(() => localStorage.removeItem('lexmetrik-tabs'))
    await page.waitForTimeout(1200)
    const leer = await masse(page)
    await lesen(page)

    await page.goto(ZGB)
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 45_000 })
    // Lange genug, dass das lazy Browse-Manifest da ist (W3): am Vorstand kam
    // die Aufschrift «ZGB» 17 ms nach dem Reiter, unter Last entsprechend später.
    await page.waitForTimeout(2500)
    const voll = await masse(page)

    nurLeiste(await lesen(page), 'der erste Reiter entsteht')
    // Die drei Masse, die der Befund wandern sah — jetzt Zahl für Zahl gleich.
    expect(leer.plus, 'das «+» steht mit und ohne Reiter am selben Platz').toEqual(voll.plus)
    expect(leer.blatt!.x, 'das «N offen»-Blatt hält seinen Platz').toBe(voll.blatt!.x)
    expect(leer.blatt!.b, 'das «N offen»-Blatt hält seine Breite').toBe(voll.blatt!.b)
    expect(leer.streifen, 'der Streifen hält Platz, Breite und Höhe (Vorstand: x60 b1196 h16 → x24 b1116 h33)')
      .toEqual(voll.streifen)
  })

  test('ein zweiter Reiter kommt dazu — die Aufschrift springt nicht nach', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await beobachten(page)
    await page.goto(ZGB)
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 45_000 })
    await page.waitForTimeout(2500)
    const vorher = await masse(page)
    await lesen(page)

    await page.goto(OR)
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 45_000 })
    await page.waitForTimeout(2500)
    const nachher = await masse(page)

    nurLeiste(await lesen(page), 'ein zweiter Reiter kommt dazu')
    expect(vorher.plus, 'das «+» bleibt am Ende stehen').toEqual(nachher.plus)
    expect(vorher.streifen, 'der Streifen bleibt, wie er war').toEqual(nachher.streifen)
  })

  test('die Lesestellung erscheint — der gelesene Reiter behält seine Breite', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await beobachten(page)
    await page.goto(ZGB)
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 45_000 })
    await page.waitForTimeout(2500)
    const vorher = await masse(page)
    expect(vorher.stelle, 'vor dem ersten Lese-Griff steht noch keine Stellung im Reiter').toBeNull()
    await lesen(page)

    // Der Spy meldet ERST nach echtem Scrollen (`inhalt-hooks.tsx`,
    // `if (gescrollt.current)`), entprellt auf 200 ms. Scrollen ist keine
    // diskrete Eingabe — der Folge-Shift fällt also NICHT unter die
    // `hadRecentInput`-Ausnahme und wird hier voll gezählt.
    await page.mouse.wheel(0, 2000)
    await expect(page.locator(`${LEISTE} .rl-stelle`)).toHaveText(/Art\./, { timeout: 20_000 })
    await page.waitForTimeout(900)
    const nachher = await masse(page)

    nurLeiste(await lesen(page), 'die Lesestellung erscheint')
    expect(vorher.reiter!.b, 'der Reiter hielt den Platz seiner Stellung schon vorher frei'
      + ' (Vorstand: 80 → 137 px)').toBe(nachher.reiter!.b)
    expect(vorher.kreuz!.x, 'das Schliess-✕ wandert nicht (Vorstand: 69 → 133)').toBe(nachher.kreuz!.x)
    expect(vorher.plus, 'das «+» wandert nicht mit').toEqual(nachher.plus)
  })

  test('Hover und Tastatur-Fokus auf den Griffen verschieben nichts', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await beobachten(page)
    await page.goto(ZGB)
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 45_000 })
    await page.waitForTimeout(2500)
    const vorher = await masse(page)
    await lesen(page)

    // Die Griffe ✕ und ⧉ erscheinen am inaktiven Reiter erst bei Hover/Fokus
    // (F10, `griffSicht`) — über `opacity`, nicht über Mount/Unmount. Diese
    // Sonde hält fest, dass das so bleibt: ein Mount würde den Reiter weiten.
    await page.locator(`${LEISTE} .lc-schliessknopf`).first().hover()
    await page.waitForTimeout(500)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.waitForTimeout(500)
    const nachher = await masse(page)

    nurLeiste(await lesen(page), 'Hover und Tastatur-Fokus auf den Griffen')
    expect(vorher.reiter!.b, 'der Reiter wird vom Hover nicht breiter').toBe(nachher.reiter!.b)
    expect(vorher.kreuz, 'das Schliess-✕ steht schon vor dem Hover an seinem Platz').toEqual(nachher.kreuz)
  })

  test('der letzte Reiter wird geschlossen — die Leiste fällt auf dieselbe Geometrie zurück', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await beobachten(page)
    await page.goto(START)
    await expect(page.locator(LEISTE)).toBeVisible({ timeout: 45_000 })
    // R14b (s. Fall darüber): Speicher leeren, damit der Kaltstart auf ZGB
    // wieder GENAU EINEN Reiter trägt und der letzte ✕ ihn auch trifft.
    await expect(page.locator('[data-reiter-streifen] [data-reiter-schluessel]')).toHaveCount(1)
    await page.evaluate(() => localStorage.removeItem('lexmetrik-tabs'))
    await page.waitForTimeout(1200)
    const leerVorher = await masse(page)

    await page.goto(ZGB)
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 45_000 })
    await page.waitForTimeout(2500)
    await page.locator(`${LEISTE} .lc-schliessknopf`).first().click()
    // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3) · R14, Entscheid David 7.9.2026 ────
    // Hier stand `toHaveCount(1)` auf `[data-reiter-leer]`: der letzte ✕ liess
    // die Leiste LEER zurück. Seit R14 tritt die Sammlung an die Stelle des
    // letzten Reiters — die Leiste ist nie leer. Die geprüfte ZUSAGE bleibt die
    // Geometrie: das «+», der Streifen und das Blatt stehen nach dem
    // Schliessen genau dort, wo sie vorher standen. Sie ist damit sogar
    // schärfer geworden, weil jetzt der Wechsel Dokument → Sammlung gemessen
    // wird und nicht der Rückfall in einen Leerzustand.
    await expect(page.locator(`${LEISTE} [data-reiter-schluessel="/"]`)).toHaveCount(1, { timeout: 20_000 })
    // R14b: `[data-reiter-leer]` ist ersatzlos gestrichen; die Zusage lautet
    // jetzt positiv — nach dem letzten ✕ steht genau EIN Reiter.
    await expect(page.locator('[data-reiter-streifen] [data-reiter-schluessel]')).toHaveCount(1)
    await page.waitForTimeout(900)
    const leerNachher = await masse(page)

    // Der Klick selbst ist eine diskrete Eingabe (`hadRecentInput`), sein
    // Folge-Shift wäre CLS-exkludiert — die ZUSAGE ist darum die Geometrie:
    // die Leiste sieht nach dem Schliessen aus wie vor dem Öffnen.
    expect(leerVorher.plus, 'das «+» steht nach dem Schliessen wieder genau dort').toEqual(leerNachher.plus)
    expect(leerVorher.streifen, 'der Streifen kehrt in seine Masse zurück').toEqual(leerNachher.streifen)
    expect(leerVorher.blatt!.x, 'das Blatt hält seinen Platz').toBe(leerNachher.blatt!.x)
  })
})
