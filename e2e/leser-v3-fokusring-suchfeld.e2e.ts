// @shard-gruppe: 7
// ─── Ä67 (David-Befund 17.8.2026 abends) · DER FOKUSRING WIRD NICHT BESCHNITTEN ─
//
// BEFUND, wörtlich: «um das suchfeld erscheint bei klick darin ein braun
// umrundetes feld dass abgeschnitten ist. ändern.»
//
// GEMESSEN am Prod-Stand (afc008c19), StPO/V3 @1440, Gliederung als Spalte, Feld
// fokussiert:
//   Feld                       x = 184 … 464
//   Ring (`outline`, 2 px, `outline-offset: 0`)   x = 182 … 466
//   Clip (`[data-v3-leiste-scroller]`, `overflow-x: hidden`)  x = 184 …
//   ⇒ linke Ring-Kante 2 px AUSSERHALB des Clips — abgeschnitten.
// `outline` liegt immer aussen; ein Ring, der aus seinem Element herausragt, ist
// in jedem scrollenden Behälter angreifbar. Der Fix zieht ihn nach INNEN
// (`outline-offset: -2px`, index.css Ä67), womit ihn kein Vorfahre mehr treffen
// kann — heute nicht und nach dem nächsten Layout-Umbau auch nicht.
//
// WAS DIESE SPEC PRÜFT: alle VIER Kanten des Ring-Rechtecks gegen das
// Clip-Rechteck des ENGSTEN clippenden Vorfahren — nicht die CSS-Deklaration.
// Eine Zusicherung auf `outline-offset === '-2px'` wäre eine Behauptung über die
// Schreibweise; hier steht die Frage, die David gestellt hat: ist etwas
// abgeschnitten.
//
// DREI LAGEN, weil das Feld drei Zuhause hatte (Ä19): Spalte (dort trat der
// Befund auf), Kopf-Zone bei eingeklappter Gliederung, und die Spalte im
// GESCROLLTEN Zustand — dort führte der klebende Sockel nur 2 px über dem Feld,
// die OBERE Kante war also derselbe Fall wie die linke.
//
// ── §6.3-DEKLARATION D28 (David 6.9.2026) · DAS FELD HAT NUR NOCH EIN ZUHAUSE ─
// «die suchleiste im gesetz … will ich oben am gesetz.» Das Feld sitzt seither
// in JEDER Lage im klebenden Kopf-Block und damit in KEINEM scrollenden
// Behälter mehr — der Ort des Befunds (der Leisten-Scroller) existiert für das
// Feld nicht mehr. Die Vorbedingung «es liegt in einem clippenden Scroller»
// wird darum fallengelassen; sie beschriebe eine Lage, die es nicht gibt, und
// machte den Fall rot, ohne dass etwas abgeschnitten wäre.
// WAS AN IHRE STELLE TRITT und den Fall scharf hält: die Zusage, die den Ring
// überall immun macht — er wird INNERHALB der Border-Box gezeichnet
// (`outline-offset <= -outline-width`). Das ist prüfbar, es ist die Ursache des
// Fixes statt seiner Wirkung an einer Stelle, und es fällt genau bei der
// Rot-Probe unten (`outline-offset: 0`). Die Kanten-Messung gegen einen
// clippenden Vorfahren BLEIBT — sie greift, sobald das Feld je wieder in einen
// scrollenden Behälter gerät.
//
// ROT ZU BEKOMMEN (§6.7): in `src/index.css` beim Selektor
// `.lc-input.lc-v3-feld:focus` den Wert `outline-offset: -2px` auf `0` setzen —
// der Vorzustand. Dann meldet (a) links −2 px und (c) oben −2 px.
import { test, expect, type Page } from '@playwright/test'

type Kanten = {
  links: number; oben: number; rechts: number; unten: number;
  clipMarke: string; ring: unknown; ow: number;
}

/**
 * Überstand des Ring-Rechtecks über den engsten clippenden Vorfahren, je Kante.
 * Positiv = ragt hinaus (= abgeschnitten). Kein clippender Vorfahre ⇒ alle 0.
 */
async function ringKanten(page: Page): Promise<Kanten> {
  return page.evaluate(() => {
    const inp = document.querySelector('[data-v3-suchsprung] input') as HTMLElement | null
    if (!inp) throw new Error('kein Suchfeld im DOM')
    const cs = getComputedStyle(inp)
    const fb = inp.getBoundingClientRect()
    const ow = parseFloat(cs.outlineWidth) || 0
    const oo = parseFloat(cs.outlineOffset) || 0
    // `outline` wird ab der Border-Box nach AUSSEN gezeichnet; ein negativer
    // Offset zieht das Ring-Rechteck nach innen. Bei `-ow` liegt es genau auf der
    // Border-Box, also vollständig im Element.
    const ring = {
      l: fb.left - oo - ow, t: fb.top - oo - ow,
      r: fb.right + oo + ow, b: fb.bottom + oo + ow,
    }
    let el = inp.parentElement
    let clip: { l: number; t: number; r: number; b: number; marke: string } | null = null
    while (el && el !== document.documentElement) {
      const s = getComputedStyle(el)
      const clippt = [s.overflow, s.overflowX, s.overflowY]
        .some((v) => v === 'hidden' || v === 'clip' || v === 'auto' || v === 'scroll')
      if (clippt) {
        const b = el.getBoundingClientRect()
        const marke = el.hasAttribute('data-v3-leiste-scroller') ? 'data-v3-leiste-scroller'
          : el.hasAttribute('data-toc') ? 'data-toc'
          : el.hasAttribute('data-v3-such-zone') ? 'data-v3-such-zone'
          : el.tagName.toLowerCase()
        clip = { l: b.left, t: b.top, r: b.right, b: b.bottom, marke }
        break
      }
      el = el.parentElement
    }
    if (!clip) {
      return { links: 0, oben: 0, rechts: 0, unten: 0, clipMarke: '(keiner)', ring, ow }
    }
    return {
      links: +(clip.l - ring.l).toFixed(1),
      oben: +(clip.t - ring.t).toFixed(1),
      rechts: +(ring.r - clip.r).toFixed(1),
      unten: +(ring.b - clip.b).toFixed(1),
      clipMarke: clip.marke, ring, ow,
    }
  })
}

function pruefeGanz(k: Kanten, lage: string): void {
  // Der Ring muss überhaupt einer sein — 0 px breit wäre ein Tor, das nicht
  // scheitern kann (§6.7, und WCAG 2.4.7 verlangt einen sichtbaren Indikator).
  expect(k.ow, `${lage}: kein Fokusring gemessen (outline-width 0)`).toBeGreaterThanOrEqual(2)
  for (const kante of ['links', 'oben', 'rechts', 'unten'] as const) {
    expect(
      k[kante],
      `${lage}: Ring ${kante} um ${k[kante]} px vom Clip «${k.clipMarke}» beschnitten — Ring ${JSON.stringify(k.ring)}`,
    ).toBeLessThanOrEqual(0)
  }
}

async function warteLeser(page: Page): Promise<void> {
  await page.goto('/gesetze/bund/STPO')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('StPO', { timeout: 30000 })
  await expect(page.locator('[data-v3-suchsprung] input').first()).toBeVisible({ timeout: 20000 })
  await page.evaluate(() => document.fonts?.ready)
}

/**
 * D28-Nachzug: der Ring liegt INNERHALB der Border-Box des Feldes.
 *
 * Das ist die Eigenschaft, die ihn in jedem Behälter unbeschneidbar macht —
 * gemessen an den `outline`-Werten des fokussierten Feldes, nicht an der
 * CSS-Schreibweise. Rot, sobald `outline-offset` auf 0 (oder positiv) geht.
 */
async function ringLiegtInnen(page: Page): Promise<{ ow: number; oo: number }> {
  return page.evaluate(() => {
    const inp = document.querySelector('[data-v3-suchsprung] input') as HTMLElement | null
    if (!inp) throw new Error('kein Suchfeld im DOM')
    const cs = getComputedStyle(inp)
    return { ow: parseFloat(cs.outlineWidth) || 0, oo: parseFloat(cs.outlineOffset) || 0 }
  })
}

function pruefeInnen(m: { ow: number; oo: number }, lage: string): void {
  // Positiv-Sonde: es gibt überhaupt einen Ring. Ohne sie wäre «nicht
  // beschnitten» bei fehlendem Fokusring trivial erfüllt (§6.7).
  expect(m.ow, `${lage}: gar kein Fokusring (outline-width 0)`).toBeGreaterThan(0)
  expect(m.oo, `${lage}: Ring liegt aussen (outline-offset ${m.oo}, width ${m.ow}) — in jedem Scroller angreifbar`)
    .toBeLessThanOrEqual(-m.ow)
}

async function fokussiere(page: Page): Promise<void> {
  const feld = page.locator('[data-v3-suchsprung] input').first()
  await feld.click()
  // Vorbedingung: der Ring gehört dem Feld, nicht einem Nachbarn.
  await expect(feld).toBeFocused()
}

for (const schema of ['light', 'dark'] as const) {
  test(`(a) Spalte @1440 (${schema}): Ring vollständig sichtbar — der Ort des Befunds`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: schema, reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await warteLeser(page)
    // Vorbedingung: die Gliederung STEHT als Spalte — die Lage, in der David
    // geklickt hat. Das Feld liegt seit D28 nicht mehr IN ihr, sondern im
    // Kopf-Block darüber; geprüft wird beides, die Lage und der Ring.
    await expect(page.locator('[data-v3-aside]')).toHaveCount(1)
    await fokussiere(page)
    pruefeInnen(await ringLiegtInnen(page), `Spalte/${schema}`)
    pruefeGanz(await ringKanten(page), `Spalte/${schema}`)
  })
}

test('(b) Kopf-Zone bei eingeklappter Gliederung: Ring vollständig sichtbar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)
  const zu = page.locator('[data-v3-gliederung-zu]')
  await expect(zu).toHaveCount(1)
  await zu.click()
  await expect(page.locator('[data-v3-such-zone] input')).toHaveCount(1)
  await fokussiere(page)
  pruefeInnen(await ringLiegtInnen(page), 'Kopf-Zone')
  pruefeGanz(await ringKanten(page), 'Kopf-Zone')
})

test('(c) Spalte GESCROLLT: auch die obere Kante bleibt ganz', async ({ page }) => {
  // Der Sockel über dem Feld führt nur `pt-0.5` (2 px). Scrollt die Leiste, liegt
  // die obere Ring-Kante am Clip-Rand — derselbe Fall wie links, nur oben.
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)
  await expect(page.locator('[data-v3-aside]')).toHaveCount(1)
  const scroller = page.locator('[data-v3-leiste-scroller]').first()
  await expect(scroller).toHaveCount(1)

  // Erst ALLE Gliederungsstufen aufklappen. Beim ersten Lauf dieser Fassung
  // scrollte die Leiste sonst nur 55 px weit (der Baum steht eingeklappt), und
  // die feste Marke «> 100» scheiterte an der PRÜFMECHANIK statt an der Sache —
  // ein Fehlschlag, der nichts über den Ring aussagt.
  await page.locator('[data-v3-alle]').click()
  // POSITIV-Vorbedingung: die Leiste ist überhaupt scrollbar. Ohne sie liefe der
  // Test gegen einen ungescrollten Scroller und behauptete nichts (§6.7).
  await expect
    .poll(async () => scroller.evaluate((el) => el.scrollHeight - el.clientHeight), { timeout: 15000 })
    .toBeGreaterThan(200)

  await scroller.evaluate((el) => { el.scrollTop = el.scrollHeight })
  await expect.poll(async () => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(100)
  await fokussiere(page)
  pruefeInnen(await ringLiegtInnen(page), 'Spalte gescrollt')
  pruefeGanz(await ringKanten(page), 'Spalte gescrollt')
})

// «(d) V1 ist unberührt — der Ring dort ist der alte» GELÖSCHT 21.8.2026 (H5).
// Bewachte die Fassaden-Grenze `.lc-input` (ganze App) vs. `.lc-v3-feld`
// (nur V3) gegen die Ist-Hülle — mit deren Löschung gibt es kein zweites
// Feld mehr, das mitgezogen werden könnte.
