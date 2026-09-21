// @shard-gruppe: 7
// Footer-CLS beim Such-Einschwung der Übersicht /gesetze (W2·5d, David 25.7.):
// Beim Tippen in den lokalen Browse-Filter swappt der Ebenen-Inhalt gegen die
// Trefferregion — vorher zog das den FOOTER in den Viewport (input-adjazenter
// Layout-Shift ~0.0496, Nullprobe 25.7. im IA-4-Commit ac5e346d dokumentiert).
// Fix nach §15.2: die Inhalts-/Trefferregion reserviert ihren Platz von Anfang
// an (min-h-Token `inhalt-region`, tailwind.config.js) — der Footer beginnt
// unterhalb des Folds und bewegt sich beim Ergebnis-Swap nicht sichtbar.
// Beweis hier: BEIDE Wege (Tippen → Treffer; Löschen → zurück zum Panel)
// unter CPU-Drossel 6× mit CLS === 0 (input-freie Shifts, wie §11.6.5).
// Läuft gegen `vite preview` (dist).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

// DEKLARIERTE ANPASSUNG (R12A/D22, 6.9.2026): das Filterfeld auf /gesetze trägt
// jetzt das sichtbare Label «Filtern» — und damit auch den zugänglichen Namen
// (WCAG 2.5.3: sichtbarer Text IST der Name; das frühere `aria-label`
// «Gesetze durchsuchen …» sagte etwas anderes als das Bild). Nur der Locator
// zieht nach, die Zusicherung bleibt Wort für Wort dieselbe.
const feld = (page: Page) => page.getByRole('searchbox', { name: 'Filtern' })

// Beobachter VOR der Interaktion installieren — gemessen wird genau der
// Tipp-/Lösch-Einschwung. Attribution (Quell-Knoten) wird mitprotokolliert,
// damit ein Rot sofort die Fläche nennt (Footer vs. Trefferregion).
//
// ── §17-NACHZUG 6.9.2026 · DIE MELDUNG SAGT JETZT AUCH, WOHIN ES SPRANG ─────
// Der CI-Flake vom 6.9. meldete «Quellen: DIV.flex justify-end» — die FLÄCHE,
// aber nicht die BEWEGUNG. Die Diagnose (54 px aufwärts, weil der Hinweis
// «Systematik noch nicht hinterlegt» über der Zeile erschien und wieder
// verschwand; Wurzel-Fix in `pages/Gesetze.tsx`) kostete darum eine eigene
// Messreihe. Der Beobachter protokolliert seither zusätzlich `y` vorher→nachher
// und den Beitrag zum Wert. REINE BERICHTERSTATTUNG: keine Assertion, kein
// Schwellenwert, kein Timeout wird berührt (§6.3).
async function clsBeobachten(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __cls: number; __clsQuellen: string[] }
    w.__cls = 0
    w.__clsQuellen = []
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as PerformanceEntry[]) {
        const s = e as unknown as {
          value: number; hadRecentInput: boolean
          sources?: { node?: Element | null; previousRect?: DOMRectReadOnly; currentRect?: DOMRectReadOnly }[]
        }
        if (s.hadRecentInput) continue
        w.__cls += s.value
        for (const q of s.sources ?? []) {
          const n = q.node
          const b = q as unknown as { previousRect?: DOMRectReadOnly; currentRect?: DOMRectReadOnly }
          const weg = b.previousRect && b.currentRect
            ? ` y ${Math.round(b.previousRect.y)}→${Math.round(b.currentRect.y)}`
            : ''
          if (n) w.__clsQuellen.push(
            `${n.tagName}${n.id ? `#${n.id}` : ''}.${String(n.className).slice(0, 60)}${weg} (+${s.value.toFixed(5)})`)
        }
      }
    }).observe({ type: 'layout-shift' })
  })
}

async function clsLesen(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __cls: number; __clsQuellen: string[] }
    return { cls: w.__cls, quellen: w.__clsQuellen }
  })
}

test.describe('Übersicht /gesetze · Footer-CLS beim Such-Einschwung (§15.2)', () => {
  test('CLS 0 unter CPU-Drossel 6× — Tippen (Treffer schwingen ein) UND Löschen (zurück zum Panel)', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 6 })

    // Dasselbe Szenario wie die 25.7.-Nullprobe: Kanton-Scope ZH, Suchwort
    // ohne ZH-Treffer → der Swap Panel (hoch) ↔ Lücken-Hinweis (kurz) ist die
    // maximale Höhen-Differenz dieser Fläche.
    await page.goto('/gesetze?ebene=kanton&kt=ZH')
    const main = page.getByRole('main')
    await expect(main.getByText(/Erlass(e)? erfasst/).first()).toBeVisible({ timeout: 20_000 })

    await clsBeobachten(page)

    // Weg 1: Tippen → Trefferregion schwingt ein (ersetzt das Kanton-Panel).
    await feld(page).fill('Obligationenrecht')
    await expect(main.getByText(/in diesem Kanton erfasst/)).toBeVisible({ timeout: 15_000 })
    // Nachlauf: späte (input-freie) Shifts noch einsammeln — genau dort sass
    // der vorbestehende Footer-Shift (>500 ms nach Input unter Drossel).
    await page.waitForTimeout(700)

    // Weg 2: Löschen → zurück zum Ebenen-Panel.
    await feld(page).fill('')
    await expect(main.getByText(/Erlass(e)? erfasst/).first()).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(700)

    const { cls, quellen } = await clsLesen(page)
    expect(cls, `Layout-Shift (input-frei) beim Such-Einschwung — Quellen: ${quellen.join(' | ') || '—'}`).toBe(0)

    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    expect(fehler).toEqual([])
  })
})
