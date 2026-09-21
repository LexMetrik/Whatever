// @shard-gruppe: 5
// ═══ DER LESER LÄUFT NICHT QUER — SEITE UND GLIEDERUNG ══════════════════════
//
// ZUSAMMENGELEGT 31.8.2026 (Ent-Regulierung Runde 2 / Batch A, QS-EFFIZIENZ) aus
// `leser-kein-seitenueberlauf.e2e.ts` (dieser Datei, umbenannt) und
// `leser-gliederung-kein-overflow.e2e.ts` (entfällt). Beide messen dieselbe
// Zusage — im Leser läuft nichts quer — auf zwei Ebenen: die SEITE als Ganzes
// und den TOC-SCROLLER in sich. ALLE VIER FÄLLE BLEIBEN, keine Assertion
// entfernt, keine gelockert (§6.3). Verschmolzen ist nur die doppelte
// `fehlerSammeln`-Hilfe.
//
// SHARD-NEUTRAL: die aufgenommenen drei Fälle standen in Gruppe 5, dieser eine in
// Gruppe 6; die zusammengelegte Datei trägt Gruppe 5 — damit wandert genau EIN
// Fall die Gruppe, nicht drei. Weil CI mit `workers: 1` je Shard fährt, spart die
// Zusammenlegung keine Laufzeit; sie verkleinert die Regelfläche (Beleg:
// bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md §1, zweite Regel).
//
// NICHT AUFGENOMMEN ist `topbar-kein-ueberlauf-320.e2e.ts`. Sie misst einen
// ANDEREN Gegenstand — den App-Streifen @320 — und schliesst die übrige Seite
// ausdrücklich aus (Begründung in ihrem Kopf: der offene Gliederungs-Überläufer
// aus PR #567). Sie bleibt eigenständig.
//
// ═══ TEIL 1 · DIE SEITE ══════════════════════════════════════════════════════
// B6 (H4-Nachzug 18.8.2026) · KEINE SEITE LÄUFT QUER
//
// AUSGANGSBEFUND (Klick-Test B9): «ZH-211.11 § 4: Tabelle 81 px Seiten-Überlauf
// @390 trotz `.lc-scroll-x`, V1 + V3, Kern-Render».
//
// NACHGEMESSEN 18.8.2026 (390×844, `vite preview`, beide Hüllen je 81 px): die
// Zahl stimmt, die URSACHE nicht — und der Irrtum ist die eigentliche Lehre.
//
//   Tabelle in § 4   1002 px breit, IM Scroller `span.lc-scroll-x`
//                    (clientWidth 312 · scrollWidth 1002 · overflow-x: auto)
//                    ⇒ korrekt gefasst, läuft nirgends über.
//   Echter Überläufer `a` «Notariatsgebührenverordnung (NotGebV) ›» in der
//                    Fusszeile «Weitere Erlasse»: 191 px breit, rechte Kante 471
//                    in einem 390-Fenster ⇒ genau die 81 px.
//
// Warum die Fehlzuordnung naheliegt: `getBoundingClientRect` einer Tabelle IM
// Scroller liefert ihre volle Breite (1002), nicht die sichtbare. Wer nach
// «breiten Elementen» sucht, findet zuerst sie. Die Sonde unten macht darum den
// zweiten Schritt zur Bedingung: ein Element zählt nur als Überläufer, wenn es
// KEINEN klippenden Vorfahren hat (`overflow-x` ≠ `visible`). Ohne diesen Filter
// meldet jede Überlauf-Sonde den Inhalt jedes Scrollers mit — sie kann dann
// nicht mehr zwischen «gefasst» und «hinausgeragt» unterscheiden und ist als
// Wächter wertlos (§6.7).
//
// URSACHE des echten Überlaufs: drei Flex-Kinder ohne `min-w-0`. Ein Flex-Kind
// schrumpft nicht unter seine `min-content`-Breite — und die ist hier das
// längste Wort, «Notariatsgebührenverordnung». Dass der Kürzel-Wert an diesem
// Erlass der Volltitel ist, ist ein eigener Daten-Befund (Klick-Test C3); die
// Zeile darf aber an KEINEM Wert brechen.
//
// ROT ZU BEKOMMEN (§6.7): in `v3/LeserLesespalte.tsx` das `min-w-0` an den
// beiden Nachbar-Links entfernen ⇒ rot mit 81 px. So gemessen (damals an
// beiden Hüllen — `inhalt-volltext.tsx`, die V1-Fassung, ist mit H5,
// 21.8.2026, gelöscht).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

/** Elemente, die über die Fensterbreite ragen UND von niemandem geklippt werden. */
async function ueberlaeufer(page: Page): Promise<{ ueberlauf: number; quellen: string[] }> {
  return page.evaluate(() => {
    const grenze = document.documentElement.clientWidth
    const quellen: string[] = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.right <= grenze + 1) continue
      let a = el.parentElement
      let geklippt = false
      while (a && a !== document.documentElement) {
        const ox = getComputedStyle(a).overflowX
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') { geklippt = true; break }
        a = a.parentElement
      }
      if (geklippt) continue
      quellen.push(`${el.tagName}${el.className ? '.' + String(el.className).split(' ')[0] : ''}`
        + ` right=${Math.round(r.right)} «${(el.textContent ?? '').trim().slice(0, 40)}»`)
    }
    return {
      ueberlauf: document.documentElement.scrollWidth - grenze,
      quellen: quellen.slice(0, 6),
    }
  })
}

// `['V1', '?leser=v1']` GELÖSCHT 21.8.2026 (H5) — die Ist-Hülle, gegen die
// dieser Zweig lief, existiert nicht mehr. DIÄT 31.8.2026: die damit
// einelementig gewordene Schleife ist aufgelöst; der Fall behält seinen Namen.
test.describe('B6 — die Seite läuft nicht quer', () => {
  test('V3 @390: ZH-211.11 läuft nicht quer — die Tabelle bleibt im Scroller', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/kanton/ZH-211.11')
    await expect(page.locator('article[id^="art-"]').first()).toBeAttached({ timeout: 20_000 })
    // Die Fusszeile ist das Ziel der Messung — sie muss gerendert sein.
    await expect(page.locator('nav[aria-label="Weitere Erlasse"]')).toBeAttached({ timeout: 20_000 })

    const { ueberlauf, quellen } = await ueberlaeufer(page)
    expect(ueberlauf, `Seiten-Überlauf @390 — ungeklippte Quellen: ${quellen.join(' | ') || '—'}`)
      .toBeLessThanOrEqual(0)

    // Positiv-Sonde: die breite Tabelle IST da und IST gefasst. Ohne sie könnte
    // der Fall grün werden, weil die Tabelle verschwunden ist (§6.7).
    const scroller = await page.evaluate(() => {
      const t = [...document.querySelectorAll('span.table')].find((x) => x.scrollWidth > 500)
      if (!t) return null
      const s = t.closest('.lc-scroll-x') as HTMLElement | null
      return s ? { cw: s.clientWidth, sw: s.scrollWidth, overflowX: getComputedStyle(s).overflowX } : null
    })
    expect(scroller, 'die breite Tabelle sitzt in keinem `.lc-scroll-x`').not.toBeNull()
    expect(scroller!.overflowX).toBe('auto')
    expect(scroller!.sw, 'der Scroller hat nichts zu scrollen — die Tabelle ist nicht mehr breit')
      .toBeGreaterThan(scroller!.cw)
  })
})

// ═══ TEIL 2 · DIE GLIEDERUNG ═════════════════════════════════════════════════
// Übernommen 31.8.2026 aus `leser-gliederung-kein-overflow.e2e.ts` (Gruppe 5),
// Wortlaut und Assertions unverändert.
//
// W2·19-GLIEDERUNG/S9 — Zusatzpunkt David 9.8.2026: die Leiste darf NICHT von
// links nach rechts scrollbar sein. Kein horizontaler Overflow im
// [data-toc]-Scroller (Baum, Trefferliste, Zonen A/C) — lange Etikette
// (HAdoptÜ-Anhang, tief verschachtelte OR-Zweige) brechen um statt
// überzulaufen oder einen Scrollbalken zu erzeugen. Dieselbe Garantie im
// mobilen Gliederungs-Sheet (eigener Scroller, `[data-gliederung-baum-scroll]`).
// Abnahme-Mass: `scrollWidth <= clientWidth` am Scroller-Container — die
// harte, messbare Fassung von «nicht scrollbar» (ein Scrollbalken selbst ist
// browserabhängig sichtbar/unsichtbar, `scrollWidth` ist es nicht).

async function keinHorizontalerOverflow(page: Page, selektor: string): Promise<void> {
  const diff = await page.locator(selektor).evaluate((el) => el.scrollWidth - el.clientWidth)
  expect(diff, `${selektor}: scrollWidth (${diff >= 0 ? '+' : ''}${diff}px über clientWidth) darf nicht überlaufen`).toBeLessThanOrEqual(0)
}

test.describe('W2·19-GLIEDERUNG/S9 — Leiste ohne horizontalen Overflow', () => {
  test('Desktop OR, tief aufgeklappter Pfad: [data-toc] überläuft nicht', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    // Hash-Sprung auf einen tief verschachtelten Artikel öffnet den vollen
    // Ahnen-Pfad (5 Ebenen, T1-Kodifikation) — genau der «tief aufgeklappt»-Fall.
    await page.goto('/gesetze/bund/OR#art-530')
    await expect(page.locator('[data-toc]')).toBeVisible({ timeout: 40_000 })
    await expect(page.locator('[data-toc] [data-toc-aktiv]')).toHaveCount(1, { timeout: 40_000 })
    await page.waitForTimeout(500)
    await keinHorizontalerOverflow(page, '[data-toc]')
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('HAdoptÜ (HAUE) — lange Anhang-/Titel-Etikette überlaufen nicht', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/international/HAUE')
    await expect(page.locator('[data-toc]')).toBeVisible({ timeout: 40_000 })
    await page.waitForTimeout(500)
    await keinHorizontalerOverflow(page, '[data-toc]')
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('Mobiles Gliederungs-Sheet — Baum-Scroller überläuft nicht', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/international/HAUE')
    await expect(page.locator('article').first()).toBeVisible({ timeout: 40_000 })
    await page.getByRole('button', { name: /Gliederung/ }).first().click()
    await expect(page.locator('[data-gliederung-sheet]')).toBeVisible({ timeout: 40_000 })
    await page.waitForTimeout(400)
    await keinHorizontalerOverflow(page, '[data-gliederung-baum-scroll]')
    expect(fehler, fehler.join('\n')).toEqual([])
  })
})
