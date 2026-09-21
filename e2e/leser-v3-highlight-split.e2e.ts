// @shard-gruppe: 5
// FAHRPLAN-LESER-V3 Kap. 14 / Etappe H2 — absorbierter ROADMAP-Schritt
// `QS-UI-HIGHLIGHT`: «::highlight()-Registry je Leser-Instanz; heute löscht im
// Split-View das Rail-Suchfeld die Markierung des Nachbar-Panes».
//
// WAS HIER GEPRÜFT WIRD UND WARUM IM BROWSER. Die BUCHFÜHRUNG (welche Instanz
// hält welche Ranges) ist rein und liegt in `src/tests/suchHighlight.test.ts` —
// dort wird sie ohne Browser bewiesen, samt Rot-Beweis. Was nur hier prüfbar
// ist: dass zwei echte Leser-Instanzen im Split-View auch wirklich zwei
// Instanzen sind und die eine CSS-Registry-Position gemeinsam tragen. Genau
// diese Verdrahtung — ein Hook-Aufruf je Pane, ein Symbol je Hook-Aufruf —
// sieht der reine Test nicht.
//
// AUFBAU DES SPLIT-VIEW: über den teilbaren Layout-Link `?p=` (usePaneLayout.ts,
// B-5) statt über den ⧉-Knopf an einer Leitfall-Zeile. Der Knopf öffnet einen
// ENTSCHEID daneben; hier werden aber zwei GESETZE gebraucht, weil nur sie zwei
// In-Gesetz-Suchfelder haben. `?p=` ist derselbe Weg, den ein geteilter Link
// nimmt, also kein Test-Sonderpfad.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

type Rolle = 'primaer' | 'sekundaer'

/**
 * Das Such-/Sprungfeld eines Panes — adressiert über die PANE-ROLLE, nicht über
 * die DOM-Verschachtelung.
 *
 * WARUM NICHT ÜBER `[data-pane="…"]` ALLEIN (Befund 16.8.2026, gemessen). Im
 * Split @1600 sind die Panes 669 px breit und unterschreiten damit die
 * xl-Schwelle: es gibt keine Seitenleisten-SPALTE, die Leiste ist ein
 * Bottom-Sheet hinter ☰ (Kap. 4b). Dieses Sheet hängt per Portal in der
 * Pane-Overlay-Schicht — und die liegt konstruktiv AUSSERHALB von
 * `[data-pane="…"]`. Die gemessene Vorfahrenkette des Feldes lautet:
 *
 *     input < … < div[data-v3-pane=primaer] < … < div#root
 *
 * Ein Selektor, der das Feld unterhalb von `[data-pane="primaer"]` sucht,
 * findet darum konstruktiv nichts — unabhängig davon, ob die Verdrahtung
 * stimmt. Genau das war der Fehlschlag dieser Spec.
 *
 * `data-v3-pane` ist der Marker, den der Portal-Vertrag dafür vorsieht
 * (LeserRahmenV3.tsx). Er ist bewusst NICHT `data-pane`: Shell.tsx zählt
 * `[data-pane]` für den F6-Regionswechsel, ein Sheet mit dieser Kennung machte
 * aus zwei Regionen vier. Die Spec nimmt darum BEIDE Orte an — Spalte (in der
 * Einzelansicht bzw. bei breiten Panes) und Sheet-Portal — und bleibt so gegen
 * die Breiten-Weiche unempfindlich, ohne die Rolle preiszugeben.
 *
 * KEINE LOCKERUNG: geprüft wird unverändert `toBeVisible`, und die Rollen-Probe
 * unten hält zusätzlich fest, dass die zwei Felder wirklich zwei verschiedenen
 * Panes gehören — der Prüfgegenstand wird dadurch schärfer, nicht weicher.
 */
function feldVon(page: Page, rolle: Rolle) {
  return page
    .locator(`[data-pane="${rolle}"], [data-v3-pane="${rolle}"]`)
    .locator('[data-v3-suchsprung] input')
    .first()
}

/**
 * Macht das Feld eines Panes erreichbar und gibt es zurück. Öffnet bei Bedarf
 * zuerst das Sheet — das ist keine Test-Bequemlichkeit, sondern derselbe Weg,
 * den ein Nutzer im Split geht.
 */
async function oeffneFeld(page: Page, rolle: Rolle) {
  const feld = feldVon(page, rolle)
  if (!(await feld.isVisible().catch(() => false))) {
    await page.locator(`[data-pane="${rolle}"] [data-v3-gliederung-auf]`).first().click()
  }
  await expect(feld, `Suchfeld des Panes «${rolle}» nicht erreichbar`).toBeVisible({ timeout: 20_000 })
  return feld
}

/**
 * Die Zusage «zwei echte Instanzen» — als eigene Messung, nicht als Nebeneffekt.
 * Ohne sie könnte die Spec auch dann grün werden, wenn beide `feldVon`-Aufrufe
 * DASSELBE Feld träfen; die Registry-Zahlen wären dann Zufallszahlen.
 */
async function pruefeZweiInstanzen(page: Page) {
  const rollen = await page.locator('[data-v3-suchsprung] input').evaluateAll((els) =>
    els.map((el) => {
      let n: HTMLElement | null = el as HTMLElement
      while (n) {
        const v = n.getAttribute('data-v3-pane') ?? n.getAttribute('data-pane')
        if (v) return v
        n = n.parentElement
      }
      return '(ohne Pane-Rolle)'
    }))
  expect(rollen.slice().sort(), `Pane-Rollen der gefundenen Suchfelder: ${rollen.join(', ')}`)
    .toEqual(['primaer', 'sekundaer'])
}

/** Grösse der einen Registry-Position — 0, wenn sie gar nicht gesetzt ist. */
async function highlightGroesse(page: Page): Promise<number> {
  return page.evaluate(() => {
    const reg = (globalThis as unknown as { CSS?: { highlights?: Map<string, { size: number }> } }).CSS?.highlights
    return reg?.get('lc-such-treffer')?.size ?? 0
  })
}

test.describe('QS-UI-HIGHLIGHT — Suche in Pane A löscht die Markierung in Pane B nicht', () => {
  test('(≥lg) zwei Gesetz-Panes: Feld A leeren lässt die Markierung von Pane B stehen', async ({ page }) => {
    test.slow() // zwei volle Leser-Instanzen samt Idle-Shards — 3× Budget gegen CI-CPU-Starvation
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1600, height: 900 })

    // BGFA (klein, 13 Artikel) neben BGBM (klein): beide laden schnell und
    // tragen beide den Begriff «Anwalt» bzw. «Markt» sicher NICHT im jeweils
    // anderen — die Mengen sind darum unterscheidbar.
    await page.goto('/gesetze/bund/BGFA?leser=v3&p=/gesetze/bund/BGBM%3Fleser%3Dv3')
    await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 20_000 })

    // Im Pane ist die Seitenleiste ein SHEET (die Pane-Breite unterschreitet die
    // xl-Schwelle), das Suchfeld liegt also hinter ☰ und nicht in einer Spalte.
    // Erst öffnen, dann greifen — sonst prüfte der Test eine Fläche, die es in
    // dieser Breite gar nicht gibt.
    const feldA = await oeffneFeld(page, 'primaer')
    const feldB = await oeffneFeld(page, 'sekundaer')
    await pruefeZweiInstanzen(page)

    // ── Pane B sucht und malt ────────────────────────────────────────────────
    await feldB.fill('Markt')
    await expect.poll(() => highlightGroesse(page), { timeout: 30_000 }).toBeGreaterThan(0)
    const nurB = await highlightGroesse(page)

    // ── Pane A sucht ebenfalls: die EINE Position trägt jetzt BEIDE Mengen ───
    // Vor dem Fix ersetzte hier Pane A die Menge von Pane B vollständig — die
    // Vereinigung entstand nie, und im Nachbar-Pane erlosch die Markierung
    // schon bei der ersten fremden Eingabe (nicht erst beim Leeren).
    await feldA.fill('Anwalt')
    await expect.poll(() => highlightGroesse(page), { timeout: 30_000 }).toBeGreaterThan(nurB)

    // ── Der eigentliche Befund: Pane A leert sein Feld ───────────────────────
    await feldA.fill('')
    // Pane B hat weiterhin einen Begriff im Feld …
    await expect(feldB).toHaveValue('Markt')
    // … und darum muss seine Markierung stehen bleiben. Vor dem Fix fiel die
    // Position hier auf 0 (`reg.delete`), obwohl das Feld gefüllt blieb — die
    // Anzeige log über den Zustand (§8).
    await expect.poll(() => highlightGroesse(page), { timeout: 30_000 }).toBe(nurB)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(≥lg) leeren BEIDE Panes ihr Feld, verschwindet die Registry-Position ganz', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto('/gesetze/bund/BGFA?leser=v3&p=/gesetze/bund/BGBM%3Fleser%3Dv3')
    await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 20_000 })

    const feldA = await oeffneFeld(page, 'primaer')
    const feldB = await oeffneFeld(page, 'sekundaer')
    await pruefeZweiInstanzen(page)

    await feldA.fill('Anwalt')
    await feldB.fill('Markt')
    await expect.poll(() => highlightGroesse(page), { timeout: 30_000 }).toBeGreaterThan(0)

    // Kein Rest: eine leere `Highlight`-Instanz in der Registry stehenzulassen
    // wäre ein Zustand, den niemand sieht und den der nächste Leser als «da»
    // läse. Die Gegenprobe zum Test oben — sonst könnte die Instanz-Buchführung
    // auch dadurch «bestehen», dass sie nie etwas löscht.
    await feldA.fill('')
    await feldB.fill('')
    await expect.poll(async () => page.evaluate(() => {
      const reg = (globalThis as unknown as { CSS?: { highlights?: Map<string, unknown> } }).CSS?.highlights
      return reg?.has('lc-such-treffer') ?? false
    }), { timeout: 90_000 }).toBe(false)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})
