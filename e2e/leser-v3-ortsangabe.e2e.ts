// @shard-gruppe: 8
// ─── Ä1 / D27 · EINE ORTSANGABE, EINE QUELLE (§7-Wahrheitsproblem) ───────────
//
// DER ANLASS (unverändert gültig): der Ästhetik-Review H1 meldete, die
// Krumen-Leiste nenne im Split-View einen ANDEREN Artikel als die Lesespalte
// («Art. 428» statt «Art. 429»). Eine falsche Ortsangabe ist kein
// Geschmacksbefund, sondern ein §7-Fehler — darum verlangt der Fahrplan
// (Kap. 7, Zeile H2b) hierfür ausdrücklich einen eigenen Test.
//
// ── NACHGEFÜHRT AUF DIE A-2-WAHRHEIT (17.8.2026) ────────────────────────────
// Bis A-2 verglich diese Spec ZWEI Chrome-Angaben: die App-Krumen-Leiste
// (`[data-ort-artikel]`) und die V3-Kopfzeile (`[data-v3-kopf-artikel]`). Die
// Leisten-Verschmelzung hat die erste beseitigt; die Spec mass seither Chrome
// gegen den TEXT.
//
// ── NACHGEFÜHRT AUF D27 (David 6.9.2026) · §6.3-DEKLARATION ─────────────────
// «diese funktion, dass es anzeigt in welchem artikel wir sind, soll der tab
// bekommen. es kann dann direkt im gesetz raus.» Damit fällt der ZWEITE
// Chrome-Träger: `[data-v3-kopf-artikel]` gibt es nicht mehr. Die Spec bloss
// zu löschen wäre falsch — die Frage «nennt die Ortsangabe wirklich die Stelle,
// an der der Leser steht» ist dieselbe geblieben, sie hat nur einen neuen
// Träger. Gemessen wird darum ab hier das SIGNAL, aus dem der Reiter seine
// Lesestellung zieht:
//
//   Scroll-Spy (`gesetz-leser/inhalt-hooks.tsx`, entprellt 200 ms)
//     → `aktualisiereTabArtikel(pfad + '#art-<token>')`  (`lib/tabs.ts`)
//       → localStorage `lexmetrik-tabs`, Feld `path` des passenden Reiters
//         → Reiterleiste: `artikelLabelVonPfad(t.path)` («gelesen bis Art. …»)
//
// DREI ZUSAGEN, dieselben drei wie zuvor, nur am neuen Träger:
//   (1) Es gibt nur EINE Quelle: weder `[data-ort-artikel]` noch
//       `[data-v3-kopf-artikel]` steht noch im DOM — die Ortsangabe ist genau
//       einmal da, im Reiter-Signal.
//   (2) Die genannte Bestimmung ist WIRKLICH DA: sie gehört zu einem Artikel,
//       der im Augenblick der Messung sichtbar unter dem klebenden Kopf steht.
//       Nennt das Signal etwas, das der Leser nicht sieht — ein nachlaufender
//       Wert, der Artikel des Nachbar-Panes, eine zweite Quelle —, wird die
//       Spec rot.
//   (3) Das Signal WECHSELT beim Scrollen. Ein Wert, der beim ersten
//       Artikelwechsel stehen bliebe, wäre eine Lesestellung, die nicht liest.
//
// ROT ZU BEKOMMEN (§6.7): in `src/pages/gesetz-leser/inhalt-hooks.tsx` den
// Aufruf `aktualisiereTabArtikel(tabZiel)` auskommentieren — dann bleibt der
// Reiter-Pfad auf dem Anker stehen, mit dem die Seite geöffnet wurde: (2) fällt
// nach dem Scrollen, (3) fällt sofort.
import { test, expect, type Locator, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

/** Die EINE Nummern-Grammatik dieser Messung — «Art. 429», «§ 12», «Art. 66a». */
function nummer(text: string | null | undefined): string | null {
  const t = (text ?? '').replace(/\s+/g, ' ').trim()
  const m = /((?:Art\.|§)\s*[\w.–-]+)/.exec(t)
  return m ? m[1].replace(/\s+/g, ' ') : null
}

/**
 * Die Bestimmungen, die in einer Lesefläche GERADE SICHTBAR sind (unterhalb des
 * klebenden Kopfes, oberhalb der Unterkante).
 *
 * `wurzel` ist die Einzelansicht (`body`) oder ein Pane — dieselbe Funktion für
 * beide, damit der Split keine zweite Messregel bekommt.
 */
async function sichtbare(wurzel: Locator): Promise<string[]> {
  const roh = await wurzel.evaluate((el) => {
    const stick = el.querySelector('[data-v3-kopf]')
    const oben = stick ? stick.getBoundingClientRect().bottom : 0
    const flaeche = el.getBoundingClientRect()
    const unten = Math.min(flaeche.bottom, window.innerHeight)
    const texte: string[] = []
    for (const art of el.querySelectorAll('article[id^="art-"]')) {
      const r = art.getBoundingClientRect()
      if (r.bottom <= oben || r.top >= unten) continue
      texte.push((art as HTMLElement).innerText)
    }
    return texte
  })
  return roh.map((t) => nummer(t)).filter((n): n is string => n !== null)
}

/**
 * Die Lesestellung, wie sie im Reiter-Signal steht — für den Reiter, dessen
 * PFADTEIL (alles vor `?`) genau `teil` ist, z. B. `/gesetze/bund/stpo`.
 *
 * GENAU der Pfadteil, kein `includes`: im Split trägt der Reiter des primären
 * Panes die Adresse des zweiten im Query mit
 * (`/gesetze/bund/STPO?leser=v3&p=/gesetze/bund/BGFA…`). Eine Teilstring-Suche
 * nach «bgfa» trifft darum ZUERST den STPO-Reiter und liefert dessen Artikel —
 * gemessen 6.9.2026: «Art. 8» statt «Art. 2», und der Fall wurde rot, ohne dass
 * am Produkt etwas fehlte (beide Signale standen korrekt:
 * `…STPO?…#art-8` und `…BGFA?leser=v3#art-2`).
 *
 * Gelesen wird der ROHE Speicher statt des gerenderten Reiters: dies ist die
 * Naht, an der die Lesestellung den Leser verlässt. Was die Reiterleiste daraus
 * macht, ist ihre Sache und woanders bewacht — hier zählt, dass die Angabe
 * überhaupt und richtig entsteht.
 */
async function signal(page: Page, teil: string): Promise<string | null> {
  const pfad = await page.evaluate((t) => {
    try {
      const roh = localStorage.getItem('lexmetrik-tabs')
      const arr = roh ? JSON.parse(roh) : []
      if (!Array.isArray(arr)) return null
      const treffer = arr.find((e: { path?: string }) =>
        typeof e?.path === 'string'
        && e.path.split('?')[0].split('#')[0].toLowerCase() === t.toLowerCase())
      return treffer?.path ?? null
    } catch { return null }
  }, teil)
  if (!pfad) return null
  const m = /#art-(.+)$/.exec(pfad)
  if (!m) return null
  const roh = decodeURIComponent(m[1])
  // Dieselbe Ableitung wie `lib/tabGruppen.artikelLabelVonPfad` — bewusst hier
  // nachgebaut statt importiert: die Spec soll gegen das SIGNAL messen, nicht
  // gegen die Funktion, die es später liest (sonst prüfte sie sich selbst).
  if (roh.startsWith('disp_')) {
    const suffix = roh.replace(/^.*_art_/, '').replace(/_(?=\d)/g, '–').replace(/_/g, '')
    return suffix ? `Art. ${suffix}` : null
  }
  const tok = roh.replace(/_/g, '')
  return tok ? `Art. ${tok}` : null
}

test.describe('Ä1/D27 — die Ortsangabe nennt den Ort, an dem der Leser wirklich steht', () => {
  test('(a) Einzelansicht: EINE Quelle, und sie nennt eine sichtbare Bestimmung', async ({ page }) => {
    test.slow() // grosser Erlass, damit der Spy mehrere Artikelgrenzen sieht
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })

    // (1) Keine zweite Quelle: die App-Krumen-Leiste ist mit A-2 weg, die
    // Kopfzeilen-Ortsangabe mit D27. Wäre eine von beiden zurück, stünde der
    // Artikel an zwei Stellen und der alte §7-Befund könnte wiederkommen.
    await expect(page.locator('[data-ort-artikel]')).toHaveCount(0)
    await expect(page.locator('[data-v3-kopf-artikel]')).toHaveCount(0)

    // Weit scrollen, damit überhaupt ein Artikel «dran» ist, und die Entprellung
    // (200 ms im Reiter-Schreiber) auslaufen lassen — sonst misst der Test das
    // Nachlaufen und nicht die Übereinstimmung.
    await page.evaluate(() => window.scrollBy(0, 3000))
    await page.waitForTimeout(1200)

    // (2) Signal == eine sichtbare Bestimmung.
    await expect.poll(async () => {
      const s = await signal(page, '/gesetze/bund/stpo')
      return s != null && (await sichtbare(page.locator('body'))).includes(s)
    }, { timeout: 20_000 }).toBe(true)

    const s1 = await signal(page, '/gesetze/bund/stpo')
    const sicht = await sichtbare(page.locator('body'))
    expect(sicht.length, 'keine sichtbare Bestimmung gefunden — die Messung prüfte nichts')
      .toBeGreaterThan(0)
    expect(sicht, `Signal nennt «${s1}», sichtbar sind ${sicht.join(', ')}`).toContain(s1)

    // (3) Es WECHSELT: weiterscrollen muss eine andere Bestimmung ergeben.
    await page.evaluate(() => window.scrollBy(0, 6000))
    await page.waitForTimeout(1200)
    await expect.poll(async () => signal(page, '/gesetze/bund/stpo'), { timeout: 20_000 })
      .not.toBe(s1)
    const s2 = await signal(page, '/gesetze/bund/stpo')
    const sicht2 = await sichtbare(page.locator('body'))
    expect(sicht2, `nach dem Weiterscrollen nennt das Signal «${s2}», sichtbar sind ${sicht2.join(', ')}`)
      .toContain(s2)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(b) Split-View: das Signal folgt dem PRIMÄREN Pane, nicht dem Nachbarn', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto('/gesetze/bund/STPO?leser=v3&p=/gesetze/bund/BGFA%3Fleser%3Dv3')
    await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-pane="primaer"] #art-1')).toBeAttached({ timeout: 20_000 })

    // BEIDE Panes um VERSCHIEDENE Strecken scrollen. Zwei Gründe, beide gemessen
    // (17.8.2026): (1) ein Pane, das nie gescrollt wurde, meldet gar keinen
    // Artikel — der Scroll-Spy hat dann nichts entschieden. (2) Verschiedene
    // Strecken erzeugen VERSCHIEDENE Nummern — erst dadurch fällt der Test auf,
    // wenn ein Signal den Artikel des Nachbar-Panes trägt.
    await page.locator('[data-pane="primaer"]').evaluate((el) => { el.scrollTop = 3000 })
    await page.locator('[data-pane="sekundaer"]').evaluate((el) => { el.scrollTop = 1500 })
    await page.waitForTimeout(2000)

    // Nirgends eine Chrome-Ortsangabe (D27) — in KEINEM der beiden Panes.
    await expect(page.locator('[data-v3-kopf-artikel]')).toHaveCount(0)
    await expect(page.locator('[data-ort-artikel]')).toHaveCount(0)

    // LM-179: JEDES Pane schreibt sein eigenes Reiter-Signal, weil derselbe
    // Erlass daneben weiterhin als Reiter offen ist. Geprüft wird je Reiter
    // gegen die Sichtbarkeit in SEINEM Pane.
    const paare: Array<[string, string]> = [
      ['[data-pane="primaer"]', '/gesetze/bund/stpo'],
      ['[data-pane="sekundaer"]', '/gesetze/bund/bgfa'],
    ]
    const nummern: string[] = []
    for (const [wahl, teil] of paare) {
      await expect.poll(async () => {
        const s = await signal(page, teil)
        return s != null && (await sichtbare(page.locator(wahl))).includes(s)
      }, { timeout: 20_000 }).toBe(true)
      const s = await signal(page, teil)
      const sicht = await sichtbare(page.locator(wahl))
      expect(sicht.length, `${wahl}: keine sichtbare Bestimmung — Fall trägt nicht`).toBeGreaterThan(0)
      expect(sicht, `${wahl}: Signal nennt «${s}», sichtbar sind ${sicht.join(', ')}`).toContain(s)
      nummern.push(s!)
    }
    // Die Nummern müssen sich unterscheiden — sonst wäre der Fall blind gegen
    // «das Signal trägt den Artikel des Nachbarn» (§6.7: der Fall muss tragen).
    expect(new Set(nummern).size, `beide Signale nennen dieselbe Nummer ${nummern.join(' | ')} — Fall trägt nicht`)
      .toBe(2)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})
