// @shard-gruppe: 7
// ═══ D28-REGEL (David 6.9.2026) · DIE KLAPP-SONDE ════════════════════════════
//
// WÖRTLICH, im Anschluss an D28 («die suchleiste … will ich oben am gesetz —
// dann verschiebt sie sich auch nicht, wenn gliederung eingeklappt ist»):
// «achte darauf, dass dann das gleiche gilt».
//
// DIE REGEL, die daraus wird: beim Ein- und Ausklappen der Gliederung darf sich
// im klebenden Leser-Kopf NICHTS verschieben — nicht die Kopf-Knöpfe, nicht das
// Ansicht-Menü. Δx = Δy = 0. Was sich ändern DARF, ist die Breite der
// Textspalte; genau dafür klappt man die Gliederung ja ein.
//
// ── §6.3-DEKLARATION (D32, David 7.9.2026) · DIE SUCHE IST AUSGENOMMEN ──────
// Für die Erlass-Suche galt hier bis zum 7.9.2026 dieselbe Null. Sie war der
// Grund für Davids nächsten Befund: «die suche erscheint in der gliederung».
// GEMESSEN @1440 (OR, Preview-Build 7.9.2026): das Feld stand bei x = 184 —
// der linken Kante der GLIEDERUNGSSPALTE —, der Gesetzestext begann bei
// x = 492. Δ 308 px. Genau die Null, die dieser Fall bewachte, hielt das Feld
// dort fest: beim Einklappen sprang die Textspalte um −252 px, das Feld blieb
// stehen (Δx 0 gegen −252).
// D28 selbst hatte «oben am gesetz» verlangt; die Null war die Umsetzung eines
// Teilsatzes («dann verschiebt sie sich auch nicht»), nicht des Auftrags.
// NEUE REGEL für die Suche, die BEIDES hält: sie steht an der Kante des
// Gesetzestextes und wandert mit ihm — Δx(Suche) === Δx(Lesespalte). Für jedes
// andere Kopf-Element bleibt Δ = 0, unverändert und unverhandelt.
// Deklarierte fachliche Änderung; die Messung von damals bleibt oben stehen.
//
// WARUM DAS EINE ECHTE SONDE BRAUCHT, obwohl D28 die Lage strukturell löst:
// der Kopf-Block liegt über der ganzen Rahmenbreite, seine x-Position hängt
// darum an keinem Spalten-Zustand — SOLANGE der Rahmen selbst nicht wandert.
// Genau das ist die Gefahr: `rahmenSpalten.rahmenBild` verstellt die BREITE des
// Leser-Wurzelelements je nach Lage (Ä60 (c), die Aufweitung für das
// Beiwerk-Blatt), und ein zentriert stehender Rahmen, der breiter wird, zieht
// jedes Kind nach links. Der Vorzustand hat genau das getan: bis 16.8.2026
// verschwand das Grid beim Einklappen ganz und die Lesespalte sprang 175 px
// nach links (Messreihe im Kommentar von `rahmenSpalten.ts`). Die Sonde misst
// also nicht die Absicht, sondern das Ergebnis.
//
// ROT ZU BEKOMMEN (§6.7, gesehen): in `src/pages/gesetz-leser/v3/rahmenSpalten.ts`
// `spurVersatzRem` fest auf `0` setzen — dann bleibt das Feld beim Einklappen
// stehen, während die Textspalte wandert, und (a) meldet «Δx Suche 0 gegen
// Δx Spalte −252». (Zweiter Weg: die Schienen-Spur `SPUR_SCHIENE` von 2.25 auf
// 0 setzen — dann rückt die ganze Zeile, und die Null der übrigen Elemente
// bricht.)
//
// ── DIE APP-SEITENLEISTE IST BEWUSST EINE ANDERE FRAGE (offengelegt, §7) ────
// Der Auftrag nennt neben der Gliederung auch das Ein-/Ausblenden der
// APP-Seitenleiste. Dort ist Δx = 0 nicht erreichbar und wäre auch nicht
// gewollt: die Leiste nimmt dem `<main>` real 256 px weg, der ganze
// Seiteninhalt rückt — Kopf, Titelblatt, Text und Arbeitsleiste gemeinsam.
// Eine Zusage «nichts verschiebt sich» hiesse dort, den Inhalt gegen sein
// eigenes Fenster festzunageln. Gemessen wird darum die Aussage, die stimmen
// MUSS: die Elemente des Kopfes verschieben sich um GENAU DENSELBEN Betrag wie
// der Leser-Rahmen — keines rutscht relativ zu ihm (Fall b). Das ist dieselbe
// Zusage wie in (a), nur im Bezugssystem, das die App-Leiste übrig lässt.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

/** Die Kopf-Elemente, deren Lage D28-Regel festnagelt. Die Erlass-Suche steht
 *  NICHT darunter — sie folgt seit D32 der Textspalte (Deklaration oben) und
 *  wird im Fall (a) gegen DEREN Δ gemessen. */
const ZIELE = {
  kopf: '[data-v3-kopf]',
  ort: '[data-v3-kopf-ort]',
  griffe: '[data-v3-kopf-griffe]',
  ansicht: '[data-v3-ansicht]',
} as const

type Lage = Record<string, { x: number; y: number } | null>

async function lagen(page: Page): Promise<Lage> {
  return page.evaluate((ziele) => {
    const out: Record<string, { x: number; y: number } | null> = {}
    for (const [name, wahl] of Object.entries(ziele)) {
      const el = document.querySelector(wahl as string)
      if (!el) { out[name] = null; continue }
      const r = el.getBoundingClientRect()
      out[name] = { x: Math.round(r.left), y: Math.round(r.top) }
    }
    const rahmen = document.querySelector('[data-leser-v3="rahmen"]')
    const rr = rahmen?.getBoundingClientRect()
    out.rahmen = rr ? { x: Math.round(rr.left), y: Math.round(rr.top) } : null
    return out
  }, ZIELE)
}

/** Δ je Element, als lesbare Liste für die Fehlermeldung. */
function delta(vor: Lage, nach: Lage, bezugVor = { x: 0, y: 0 }, bezugNach = { x: 0, y: 0 }) {
  const zeilen: string[] = []
  let max = 0
  for (const name of Object.keys(vor)) {
    if (name === 'rahmen') continue
    const a = vor[name]
    const b = nach[name]
    if (!a || !b) { zeilen.push(`${name}: fehlt (vor ${a ? 'da' : '—'}, nach ${b ? 'da' : '—'})`); max = 9999; continue }
    const dx = (b.x - bezugNach.x) - (a.x - bezugVor.x)
    const dy = (b.y - bezugNach.y) - (a.y - bezugVor.y)
    zeilen.push(`${name}: Δx=${dx} Δy=${dy}`)
    max = Math.max(max, Math.abs(dx), Math.abs(dy))
  }
  return { text: zeilen.join(' · '), max }
}

/** D32: Feld-Kante und Kante der Gesetzesspalte in EINER Auswertung — zwei
 *  Aufrufe massen zwei Layout-Zustände. */
async function suchePaar(page: Page): Promise<{ feld: number | null; spalte: number | null }> {
  return page.evaluate(() => {
    const kante = (w: string) => {
      const el = document.querySelector(w)
      return el ? Math.round(el.getBoundingClientRect().left) : null
    }
    return { feld: kante('[data-v3-such-zone] input'), spalte: kante('[data-lr-spiegel]') }
  })
}

async function oeffne(page: Page, breite = 1440): Promise<string[]> {
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: breite, height: 900 })
  await page.goto('/gesetze/bund/STPO')
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
  await expect(page.locator('[data-v3-such-zone] input')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(500)
  return fehler
}

test.describe('D28-Regel — beim Klappen verschiebt sich im Leser-Kopf nichts', () => {
  test('(a) @1440: Gliederung zu und wieder auf — Δx/Δy = 0 an jedem Kopf-Element', async ({ page }) => {
    test.slow()
    const fehler = await oeffne(page)
    await expect(page.locator('[data-v3-aside]')).toBeVisible({ timeout: 20_000 })

    const vor = await lagen(page)
    const sucheVor = await suchePaar(page)
    expect(sucheVor.feld, 'die Erlass-Suche steht vor dem Klappen gar nicht im Kopf').not.toBe(null)

    // ZU: die Gliederung weicht auf ihre Schiene (Ä79).
    await page.locator('[data-v3-gliederung-zu]').first().click()
    await expect(page.locator('[data-v3-aside]')).toHaveCount(0, { timeout: 15_000 })
    await page.waitForTimeout(400)
    const zu = await lagen(page)

    const dZu = delta(vor, zu)
    expect(dZu.max, `nach dem Einklappen: ${dZu.text}`).toBe(0)

    // Die Gegenprobe, ohne die der Fall nicht trüge: die TEXTSPALTE hat sich
    // wirklich verändert. Sonst wäre die Null oben auch bei einem Klick ohne
    // jede Wirkung grün (§6.7).
    const sucheZu = await suchePaar(page)
    const dSpalte = sucheZu.spalte! - sucheVor.spalte!
    expect(Math.abs(dSpalte), 'die Lesespalte ist beim Einklappen nicht gewandert — Fall trägt nicht')
      .toBeGreaterThan(50)
    // D32: das Feld wandert mit ihr, nicht gegen sie.
    expect(sucheZu.feld! - sucheVor.feld!,
      `Δx Suche ${sucheZu.feld! - sucheVor.feld!} ≠ Δx Lesespalte ${dSpalte}`).toBe(dSpalte)

    // AUF: zurück in die Spalte.
    await page.locator('[data-v3-gliederung-schiene]').first().click()
    await expect(page.locator('[data-v3-aside]')).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(400)
    const auf = await lagen(page)

    const dAuf = delta(vor, auf)
    expect(dAuf.max, `nach dem Wiederaufklappen: ${dAuf.text}`).toBe(0)
    const sucheAuf = await suchePaar(page)
    expect(sucheAuf.feld, 'nach dem Wiederaufklappen steht die Suche woanders').toBe(sucheVor.feld)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(b) @1440: App-Seitenleiste ein-/ausblenden — der Kopf rückt mit dem Rahmen, nicht gegen ihn', async ({ page }) => {
    test.slow()
    const fehler = await oeffne(page)

    const vor = await lagen(page)
    const bezugVor = vor.rahmen
    expect(bezugVor, 'der Leser-Rahmen ist nicht messbar').not.toBe(null)

    await page.getByRole('button', { name: 'Seitenleiste ein- und ausblenden' }).first().click()
    await page.waitForTimeout(600)
    const nach = await lagen(page)
    const bezugNach = nach.rahmen
    expect(bezugNach, 'der Leser-Rahmen ist nach dem Umschalten nicht messbar').not.toBe(null)

    // Die Gegenprobe zuerst: der Rahmen hat sich WIRKLICH bewegt oder seine
    // Breite geändert — sonst prüfte der relative Vergleich unten nichts.
    const rahmenBewegt = await page.evaluate(() =>
      Math.round(document.querySelector('[data-leser-v3="rahmen"]')?.getBoundingClientRect().width ?? 0))
    expect(rahmenBewegt, 'der Rahmen ist nach dem Umschalten nicht messbar').toBeGreaterThan(0)

    const d = delta(vor, nach, bezugVor!, bezugNach!)
    expect(d.max, `relativ zum Leser-Rahmen: ${d.text} (Rahmen selbst: Δx=${bezugNach!.x - bezugVor!.x})`).toBe(0)

    // Und die Erlass-Suche ist danach unverändert bedienbar — die eigentliche
    // Zusage hinter D28-Zusatz («sichtbar auch bei eingeklappter Seitenleiste»).
    const feld = page.locator('[data-v3-such-zone] input')
    await expect(feld).toBeVisible()
    await feld.click()
    await expect(feld).toBeFocused()

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})
