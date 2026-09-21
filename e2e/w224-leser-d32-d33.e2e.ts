// @shard-gruppe: 7
// ═══ D32 / D33 / N1 / N4 (David 6.9.2026, Finder-Befund 7.9.2026) ════════════
//
// Vier gemessene Mängel derselben klebenden Kopf-Zone des Gesetzeslesers. Die
// Zahlen in Klammern sind der IST-Stand vor diesem Bau (gemessen @1440 hell,
// `/gesetze/bund/OR`, Preview-Build vom 7.9.2026) — sie sind zugleich die
// Rot-Probe: gegen jenen Stand scheitert jeder Fall dieser Datei.
//
//   D32  Die Erlass-Suche stand über der GLIEDERUNG, nicht über dem Gesetz:
//        Feld x = 184, Lesespalte x = 492 — **Δ 308 px**. Eingeklappt sprang
//        die Textspalte auf 240, das Feld blieb bei 184 (Δ 56).
//        SOLL: Feld x = Lesespalte x, in jeder Lage (Δ 0).
//   N4   Der klebende Kopf-BLOCK war 100 px hoch (Kopf-Zeile 56 + Such-Zone 44)
//        und zu rund 70 % leer: rechts oben ⚖/Ansicht, darunter links das Feld.
//        SOLL: EINE Zeile — Feld und Griffe liegen senkrecht übereinander,
//        der Block misst im Ruhezustand die Höhe EINER Zeile (56 px).
//   D33  Ein Klick auf «Rechtsprechung» zog dem Text eine Spur ab: Lesespalte
//        x 492 → 404, Breite 764 → 640, der Knopf selbst floh 178 px nach
//        rechts (x 1075 → 1253). Der zweite Klick an derselben Stelle traf den
//        Gesetzestext, nicht den Knopf.
//        SOLL (Variante A, Blatt statt Spur): Δ = 0 an Text UND Knopf, der
//        zweite Klick schliesst, @1024 bleibt die Gliederung stehen.
//   N1   Zwei Zahlen für denselben Artikel: Bezüge-Zeile «11 Entscheide»
//        (Bezugsgrösse, Zähl-Datei), Kopf-Zähler «3 Entscheide» (gefilterte
//        Kanten). SOLL: dieselbe Zahl aus derselben Quelle, und die
//        Beschriftung wechselt nicht, sobald der Lazy-Shard eintrifft.
//        NACHTRAG D35-F2 (7.9.2026, ERGÄNZUNG statt Nachführung, §0 Ziff. 2b):
//        seither trägt der Kopf-Griff überhaupt keine Artikel-Zahl mehr — die
//        Zahl steht an genau einem Ort, der Funktionszeile am Artikelende
//        (Variante A, `e2e/w224-d35-f2-kopf.e2e.ts`).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const FELD = '[data-v3-such-zone] input'
/** Die Lese-ZELLE (Gesetzesspalte) — dieselbe Fläche, die `rahmenSpalten` misst. */
const SPALTE = '[data-lr-spiegel]'
const ZAEHLER = '[data-v3-panel-zaehler]'

type Kasten = { x: number; y: number; b: number; h: number } | null

async function kasten(page: Page, wahl: string): Promise<Kasten> {
  return page.evaluate((w) => {
    const el = document.querySelector(w)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: Math.round(r.left), y: Math.round(r.top), b: Math.round(r.width), h: Math.round(r.height) }
  }, wahl)
}

async function oeffne(page: Page, pfad: string, breite: number, hoehe = 900): Promise<string[]> {
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: breite, height: hoehe })
  await page.goto(pfad)
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator(FELD)).toBeVisible({ timeout: 20_000 })
  await expect(page.locator(SPALTE)).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(500)
  return fehler
}

/** Beide Kästen in EINER Auswertung — sonst misst man zwei Layout-Zustände. */
async function feldUndSpalte(page: Page) {
  const feld = await kasten(page, FELD)
  const spalte = await kasten(page, SPALTE)
  expect(feld, 'Suchfeld nicht messbar').not.toBe(null)
  expect(spalte, 'Lesespalte nicht messbar').not.toBe(null)
  return { feld: feld!, spalte: spalte! }
}

test.describe('D32 — die Erlass-Suche steht über dem Gesetz, nicht über der Gliederung', () => {
  test('(a) @1440 mit stehender Gliederung: Feld-Kante = Kante der Gesetzesspalte', async ({ page }) => {
    test.slow()
    const fehler = await oeffne(page, '/gesetze/bund/OR', 1440)
    await expect(page.locator('[data-v3-aside]')).toBeVisible({ timeout: 20_000 })

    const { feld, spalte } = await feldUndSpalte(page)
    expect(Math.abs(feld.x - spalte.x),
      `Feld x=${feld.x}, Gesetzesspalte x=${spalte.x} (Ist-Stand vor dem Fix: Δ 308 px)`)
      .toBeLessThanOrEqual(1)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(b) @1440 eingeklappt: das Feld wandert mit der Spalte, nicht gegen sie', async ({ page }) => {
    test.slow()
    await oeffne(page, '/gesetze/bund/OR', 1440)
    await expect(page.locator('[data-v3-aside]')).toBeVisible({ timeout: 20_000 })
    const vor = await feldUndSpalte(page)

    await page.locator('[data-v3-gliederung-zu]').first().click()
    await expect(page.locator('[data-v3-aside]')).toHaveCount(0, { timeout: 15_000 })
    await page.waitForTimeout(400)
    const nach = await feldUndSpalte(page)

    // Gegenprobe: die Spalte hat sich WIRKLICH bewegt — sonst prüfte (b) nichts.
    expect(Math.abs(nach.spalte.x - vor.spalte.x),
      'die Gesetzesspalte ist beim Einklappen gar nicht gewandert — der Fall trägt nicht')
      .toBeGreaterThan(50)
    expect(nach.feld.x - vor.feld.x,
      `Δx Feld ${nach.feld.x - vor.feld.x} ≠ Δx Spalte ${nach.spalte.x - vor.spalte.x}`)
      .toBe(nach.spalte.x - vor.spalte.x)
    expect(Math.abs(nach.feld.x - nach.spalte.x), 'eingeklappt steht das Feld nicht über dem Text').toBeLessThanOrEqual(1)
  })

  test('(c) @1024 (ZGB) und (d) @390 — dieselbe Kante', async ({ page }) => {
    test.slow()
    await oeffne(page, '/gesetze/bund/ZGB', 1024)
    const breit = await feldUndSpalte(page)
    expect(Math.abs(breit.feld.x - breit.spalte.x),
      `@1024: Feld x=${breit.feld.x}, Spalte x=${breit.spalte.x} (Ist-Stand: Δ 308 px)`)
      .toBeLessThanOrEqual(1)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(500)
    const schmal = await feldUndSpalte(page)
    expect(Math.abs(schmal.feld.x - schmal.spalte.x), '@390: Feld und Text stehen nicht bündig')
      .toBeLessThanOrEqual(1)
  })
})

test.describe('N4 — Feld und Griffe stehen in EINER Kopfzeile', () => {
  test('(e) @1440: Suchfeld und ⚖/Ansicht überlappen senkrecht, der Block misst eine Zeile', async ({ page }) => {
    test.slow()
    const fehler = await oeffne(page, '/gesetze/bund/OR', 1440)

    const feld = await kasten(page, FELD)
    const griffe = await kasten(page, '[data-v3-kopf-griffe]')
    const block = await kasten(page, '[data-v3-kopf]')
    expect(feld && griffe && block, 'Kopf-Elemente nicht messbar').toBeTruthy()

    // Zwei Zeilen ⇒ keine Überlappung. Ist-Stand: Feld y 154–186, Griffe y 114–138.
    const ueberlappt = feld!.y < griffe!.y + griffe!.h && griffe!.y < feld!.y + feld!.h
    expect(ueberlappt,
      `Feld y ${feld!.y}–${feld!.y + feld!.h}, Griffe y ${griffe!.y}–${griffe!.y + griffe!.h} — zwei Reihen statt einer`)
      .toBe(true)

    // Der klebende Block: Ist-Stand 100 px (56 Zeile + 44 Zone), Soll ≤ 60.
    expect(block!.h, `klebender Kopf-Block ${block!.h} px hoch (Ist-Stand vor dem Fix: 100 px)`)
      .toBeLessThanOrEqual(60)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})

test.describe('D33 — «Rechtsprechung» öffnet ein Blatt und verschiebt nichts', () => {
  test('(f) @1440: Text und Knopf bleiben Pixel für Pixel stehen, der zweite Klick schliesst', async ({ page }) => {
    test.slow()
    const fehler = await oeffne(page, '/gesetze/bund/OR', 1440)
    const zaehler = page.locator(ZAEHLER).first()
    await expect(zaehler).toBeVisible({ timeout: 20_000 })

    const spalteVor = await kasten(page, SPALTE)
    const knopfVor = await kasten(page, ZAEHLER)
    const textVor = (await zaehler.textContent())?.trim() ?? ''
    expect(knopfVor, 'Zähler nicht messbar').not.toBe(null)

    // Der Klickpunkt wird EINMAL bestimmt und beide Male benutzt — genau das
    // war der Mangel: der Knopf floh unter dem Cursor weg.
    const punkt = { x: knopfVor!.x + Math.round(knopfVor!.b / 2), y: knopfVor!.y + Math.round(knopfVor!.h / 2) }

    // Layout-Shift-Messung um den Klick herum (§15.2: ein Klick auf ein
    // Beiwerk-Element darf keinen Shift erzeugen).
    await page.evaluate(() => {
      const w = window as unknown as { __cls: number }
      w.__cls = 0
      new PerformanceObserver((liste) => {
        for (const e of liste.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!e.hadRecentInput) w.__cls += e.value
        }
      }).observe({ type: 'layout-shift', buffered: false })
    })

    await page.mouse.click(punkt.x, punkt.y)
    await expect(page.locator('[data-v3-panel]').first()).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(600)

    const spalteNach = await kasten(page, SPALTE)
    const knopfNach = await kasten(page, ZAEHLER)
    expect(spalteNach, `Gesetzesspalte vor ${JSON.stringify(spalteVor)} / nach ${JSON.stringify(spalteNach)}`)
      .toEqual(spalteVor)
    expect(knopfNach, `Knopf vor ${JSON.stringify(knopfVor)} / nach ${JSON.stringify(knopfNach)}`)
      .toEqual(knopfVor)

    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
    expect(cls, `Layout-Shift beim Öffnen: ${cls}`).toBeLessThanOrEqual(0.001)

    // (g) An der geklickten Stelle liegt danach WIEDER der Knopf.
    const getroffen = await page.evaluate((p) => {
      const el = document.elementFromPoint(p.x, p.y)
      const knopf = el?.closest('[data-v3-panel-zaehler]')
      return { knopf: knopf != null, tag: el?.tagName ?? '—', text: (el?.textContent ?? '').slice(0, 24) }
    }, punkt)
    expect(getroffen.knopf,
      `an der Klickstelle liegt ${getroffen.tag} «${getroffen.text}» statt des Knopfes`).toBe(true)

    // (j) Die Beschriftung hat sich durch das Öffnen nicht geändert.
    const textNach = (await zaehler.textContent())?.trim() ?? ''
    expect(textNach, `Zählertext «${textVor}» → «${textNach}»`).toBe(textVor)

    // (h) Zweiter Klick an derselben Stelle schliesst.
    await page.mouse.click(punkt.x, punkt.y)
    await expect(page.locator('[data-v3-panel]')).toHaveCount(0, { timeout: 15_000 })
    await expect(zaehler).toHaveAttribute('aria-expanded', 'false')

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(i) @1024: das Öffnen löscht die Gliederung nicht', async ({ page }) => {
    test.slow()
    await oeffne(page, '/gesetze/bund/ZGB', 1024)
    await expect(page.locator('[data-v3-aside]')).toBeVisible({ timeout: 20_000 })
    const spalteVor = await kasten(page, SPALTE)

    await page.locator(ZAEHLER).first().click()
    await expect(page.locator('[data-v3-panel]').first()).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(500)

    await expect(page.locator('[data-v3-aside]'),
      '@1024 verschwand die ganze Gliederungsspalte beim Öffnen (Ist-Stand)').toBeVisible()
    expect(await kasten(page, SPALTE), 'die Gesetzesspalte ist beim Öffnen gewandert').toEqual(spalteVor)
  })
})

// ── §6.3-DEKLARATION (D35-F2, Entscheid David 7.9.2026) ─────────────────────
// Der Block hiess «N1 — der Kopf-Zähler nennt dieselbe Zahl wie die Bezüge-Zeile»
// und verlangte Gleichheit der beiden Zahlen. Die N1-Messung vom 7.9.2026 (OR
// Art. 336c @1440: Kopf «3», Zeile «11») bleibt richtig für ihren Stand und wird
// NICHT nachgeführt (§0 Ziff. 2b) — N1 hat sie behoben, indem beide Orte
// dieselbe Zähl-Datei lasen.
//
// D35-F2 (Variante A) geht eine Ebene höher: nicht dieselbe Zahl an zwei Orten,
// sondern EIN Ort. Der Kopf-Griff heisst «Erlass ▾» und trägt gar keine
// Artikel-Zahl mehr; die Zahl steht ausschliesslich an der Funktionszeile des
// Artikels. Die Zusage ist damit strenger als N1, nicht schwächer — die
// Gleichheits-Prüfung hat keinen zweiten Operanden mehr.
// Die neue Fassung steht als eigene Sonde in `e2e/w224-d35-f2-kopf.e2e.ts` (a)
// («genau ein Ort nennt die Entscheid-Zahl je Artikel», mit Rot-Probe); hier
// bleibt der ORTS-Teil der Zusage, weil er zu D32/D33 gehört: die Zeile trägt
// die Zahl, der Kopf nicht.
test.describe('N1/D35-F2 — die Entscheid-Zahl steht am Artikel, nicht im Kopf', () => {
  test('(k) OR Art. 336c: die Funktionszeile trägt die Zahl, der Kopf-Griff keine', async ({ page }) => {
    test.slow()
    const fehler = await oeffne(page, '/gesetze/bund/OR#art-336_c', 1440)
    // Die Zähl-Datei kommt im Leerlauf; die Marke ist ihr sichtbarer Beleg.
    const marke = page.locator('#art-336_c .lr7-bez-marke[data-reg="r"]').first()
    await expect(marke).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(800)

    const ausMarke = Number((((await marke.textContent()) ?? '').match(/\d+/) ?? ['0'])[0])
    expect(ausMarke, 'die Bezüge-Zeile nennt keine Entscheid-Zahl — der Fall trägt nicht').toBeGreaterThan(0)

    // Der Griff steht (Positiv-Sonde §6.7 — sonst prüfte der Fall eine leere
    // Kopfzeile) und nennt keine Zahl, weder sichtbar noch im Attribut.
    const griff = page.locator(ZAEHLER).first()
    await expect(griff).toBeVisible()
    expect(await griff.getAttribute('data-v3-panel-anzahl'),
      `der Kopf-Griff trägt wieder eine Zahl — die Zeile nennt bereits ${ausMarke}`).toBeNull()
    expect((await griff.textContent()) ?? '', 'der Kopf-Griff schreibt wieder eine Zahl hin')
      .not.toMatch(/\d/)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})
