// @shard-gruppe: 3
// ═══ W2·17-UI-BEFUNDE · Gesetzesleser: Druck ohne Rechtsinhalt-Verlust, Tabellen, Marken ═══
//
// Finder-Befunde DFG-G02 / DFG-G03 / DFG-D01 / DFG-D02 / DFG-D03 vom 2.10.2026
// (Messbedingung dort: Build 9bb82d7de, `vite preview`, headless Chromium).
//
//  G02  Im Druck fehlten alle Absatz-Nummern und Litera-Marken: `@media print`
//       blendet `button` aus, die Zitiermarke ist ein `<button>` (§1: Absatz-
//       Nummer und Litera sind Rechtsinhalt). Ausnahme `button.lc-druck-marke`.
//  G03  Im Druck liefen Tabellen über den Seitenrand (GebV SchKG Art. 37: alle
//       Beträge fehlten im PDF; ZH-211.11 § 4: «zuzü»). Beweis hier per echtem
//       `page.pdf` + Textsuche, nicht per CSS-Textsuche.
//  D01  Bildschirm, GebV SchKG Art. 37: 1549 px Tabelle in 603-px-Kasten, die
//       Gebühren 945 px ausserhalb. `whitespace-nowrap` an jeder Prosa-Zelle.
//  D02  Bildschirm, ZH-211.11 § 4: `w-max` hielt die Textspalte einzeilig.
//  D03  Lange Absatz-Marken («1quinquies», RPG Art. 5) brachen mitten im Wort.
//
// Zahlen, Beträge und Bereiche bleiben einzeilig (§N-4a); was trotz Umbruch
// breiter ist als die Spalte, scrollt im eigenen Container, nie die Seite.
import { test, expect, type Locator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { warteLeserBereit as leserBereit } from './helpers/leserBereit'

const ERLASS_GEBV = '/gesetze/bund/GEBV_SCHKG'
const ERLASS_ZH = '/gesetze/kanton/ZH-211.11'

type Block = { mehrspaltig?: { kopf?: string[]; zeilen: string[][] } }
type Eintrag = { artikel?: string; bloecke?: Block[] }

/** Alle nicht leeren Tabellenzellen (Kopf und Zeilen) eines Artikels aus dem Korpus. */
function zellenAusKorpus(datei: string, artikel: string): string[] {
  const d = JSON.parse(readFileSync(datei, 'utf8')) as { eintraege: Eintrag[] }
  const e = d.eintraege.find((x) => x.artikel === artikel)
  if (!e) throw new Error(`${datei}: Artikel ${artikel} fehlt`)
  const out: string[] = []
  for (const b of e.bloecke ?? []) {
    const m = b.mehrspaltig
    if (!m) continue
    for (const z of [...(m.kopf ? [m.kopf] : []), ...m.zeilen]) for (const c of z) if (c.trim()) out.push(c)
  }
  return out
}

const norm = (s: string) => s.replace(/[\u00a0\u202f\u2009]/g, ' ').replace(/\s+/g, ' ').trim()

/** Gesamttext des gedruckten PDF (pdfjs, Reihenfolge der Textläufe). */
async function pdfText(page: Page): Promise<string> {
  const buf = await page.pdf({ format: 'A4', printBackground: false })
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise
  const teile: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent()
    teile.push(tc.items.map((it) => ('str' in it ? it.str : '')).join(' '))
  }
  return norm(teile.join(' '))
}

/** Zellen, die im PDF fehlen. Die Zellen müssen in Quellreihenfolge hintereinander
 *  vorkommen (Chromium malt Zelle für Zelle, Zeile für Zeile), und zwar ohne
 *  Rücksicht auf Leerraum: pdfjs zerlegt «25% des» an Glyph-Läufen in «25 | % | des».
 *  Die Reihenfolge verhindert den Teilstring-Treffer («8.–» in «18.–»). */
function fehlendeZellen(pdf: string, zellen: string[], ab: string): string[] {
  // Tausender-Apostroph ist Anzeige (`gruppiereZelle`): «1 000» steht als «1'000» im Druck.
  const kompakt = (s: string) => s.replace(/[\s'\u2019]+/g, '')
  const text = kompakt(pdf)
  let pos = text.indexOf(kompakt(ab))
  if (pos < 0) return [`(Tabellenanfang «${ab}» fehlt im PDF)`]
  const fehlt: string[] = []
  for (const z of zellen) {
    const i = text.indexOf(kompakt(norm(z)), pos)
    if (i < 0) fehlt.push(z)
    else pos = i + kompakt(norm(z)).length
  }
  return fehlt
}

async function tabelleMit(page: Page, kennwort: string): Promise<Locator> {
  const t = page.locator('[data-mehrspaltig]', { hasText: kennwort }).first()
  await expect(t).toBeAttached({ timeout: 20_000 })
  await page.evaluate(() => document.fonts?.ready)
  return t
}

test.describe('W2·17 · Druck (page.pdf, A4) verliert keinen Rechtsinhalt', () => {
  test('G03 · GebV SchKG Art. 37: jede Zelle der Tarif-Tabelle steht im PDF', async ({ page }) => {
    test.slow()
    const zellen = zellenAusKorpus('public/normtext/bund/GEBV_SCHKG.json', '37')
    expect(zellen.length, 'Positiv-Sonde: der Korpus-Artikel trägt die Tabelle').toBeGreaterThan(15)
    await page.goto(`${ERLASS_GEBV}#art-37`)
    await tabelleMit(page, 'Restschuld')
    const text = await pdfText(page)
    const fehlt = fehlendeZellen(text, zellen, zellen[0])
    expect(fehlt, `im PDF fehlen ${fehlt.length} von ${zellen.length} Zellen`).toEqual([])
  })

  test('G03 · ZH-211.11 § 4: Text der Tabelle steht vollständig im PDF', async ({ page }) => {
    test.slow()
    const zellen = zellenAusKorpus('public/normtext/kanton/ZH-211.11.json', '4')
    expect(zellen.length).toBeGreaterThan(15)
    await page.goto(`${ERLASS_ZH}#art-4`)
    await tabelleMit(page, 'Grundgebühr')
    const text = await pdfText(page)
    const fehlt = fehlendeZellen(text, zellen.slice(1), zellen[1])
    expect(fehlt, `im PDF fehlen ${fehlt.length} von ${zellen.length} Zellen`).toEqual([])
  })

  test('G02 · StPO Art. 3: Absatz-Nummern und Litera stehen im Druck, Bedienelemente nicht', async ({ page }) => {
    test.slow()
    await page.goto('/gesetze/bund/STPO#art-3')
    await leserBereit(page)
    const art = page.locator('#art-3')
    await expect(art).toBeAttached({ timeout: 20_000 })
    await page.emulateMedia({ media: 'print' })
    const m = await page.evaluate(() => {
      const sichtbar = (n: Element) => {
        for (let k: Element | null = n; k; k = k.parentElement) if (getComputedStyle(k).display === 'none') return false
        return true
      }
      const artikel = document.querySelector('#art-3') as HTMLElement
      const marken = [...artikel.querySelectorAll('button[title$="kopieren"]')]
      const fremde = [...document.querySelectorAll('button')].filter((b) => !b.matches('button[title$="kopieren"]') && sichtbar(b))
      return {
        marken: marken.length,
        markenSichtbar: marken.filter(sichtbar).map((b) => (b.textContent ?? '').trim()),
        fremdeSichtbar: fremde.map((b) => b.getAttribute('aria-label') ?? b.textContent ?? '?'),
        text: artikel.innerText,
      }
    })
    expect(m.marken, 'Positiv-Sonde: StPO Art. 3 trägt Zitiermarken').toBeGreaterThanOrEqual(6)
    expect(m.markenSichtbar.length, 'im Druck sind nicht alle Marken sichtbar').toBe(m.marken)
    expect(m.markenSichtbar).toEqual(expect.arrayContaining(['1', '2', 'a.', 'd.']))
    expect(m.text, 'Absatz-Nummer 1 steht vor dem Text').toMatch(/1\s*Die Strafbehörden/)
    expect(m.fremdeSichtbar, 'Bedienelemente bleiben im Druck ausgeblendet').toEqual([])
  })
})

test.describe('W2·17 · Druck: Tabellen bleiben in der Satzspiegel-Breite', () => {
  // A4 (794 px) abzüglich `@page { margin: 1.6cm }` beidseitig = 673 px. Gemessen wird der
  // Überstand jeder Zelle über die Kastenkante. Vorher (Build 9bb82d7de, Unclip allein)
  // ragten in diesen sechs Erlassen 14 Tabellen über die Kante (AHVV 4, LRV 4, LSV 3,
  // FZA 1, CHEMRRV 1, APOSTILLE 1); nachher 0. NICHT erfasst: Tabellen mit 10–36 Spalten und
  // Fliesstext-Zellen (VVK, ZEMIS-V, ERV, FINFRAV) — dort reicht keine Schriftstufe.
  for (const erlass of ['AHVV', 'LRV', 'LSV', 'FZA', 'CHEMRRV', 'APOSTILLE']) {
    test(`${erlass}: keine Tabellenzelle ragt im Druck über die Spalte`, async ({ page }) => {
      test.slow()
      await page.setViewportSize({ width: 673, height: 900 })
      await page.goto(`/gesetze/bund/${erlass}`)
      await expect(page.locator('[data-mehrspaltig]').first()).toBeAttached({ timeout: 20_000 })
      await page.evaluate(() => document.fonts?.ready)
      await page.emulateMedia({ media: 'print' })
      const m = await page.evaluate(() => {
        const ueber: string[] = []
        const tabellen = document.querySelectorAll('[data-mehrspaltig]')
        for (const t of tabellen) {
          const kante = t.getBoundingClientRect().right
          for (const c of t.querySelectorAll('[role="cell"],[role="columnheader"]')) {
            const r = c.getBoundingClientRect().right
            if (r > kante + 1) { ueber.push(`${(c.textContent ?? '').slice(0, 24)} +${Math.round(r - kante)}`); break }
          }
        }
        return { n: tabellen.length, ueber }
      })
      expect(m.n, 'Positiv-Sonde: der Erlass trägt Tabellen').toBeGreaterThan(0)
      expect(m.ueber, 'Tabellen ragen im Druck über die Spalte').toEqual([])
    })
  }
})

test.describe('W2·17 · Tabellen am Bildschirm: Prosa bricht um, Beträge bleiben einzeilig', () => {
  const BREITEN = [375, 1024, 1440, 1920]
  for (const scheme of ['light', 'dark'] as const) {
    for (const b of BREITEN) {
      test(`D01/D02 @${b} ${scheme}: Tabellen passen in die Spalte (ab 1440), Seite läuft nie quer`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme })
        await page.setViewportSize({ width: b, height: 900 })
        const messe = async (url: string, kennwort: string) => {
          await page.goto(url)
          const t = await tabelleMit(page, kennwort)
          await t.scrollIntoViewIfNeeded()
          return t.evaluate((el) => {
            const kasten = el.getBoundingClientRect()
            const zellen = [...el.querySelectorAll('[role="cell"],[role="columnheader"]')]
              .filter((c) => (c.textContent ?? '').trim())
              .map((c) => ({ r: c.getBoundingClientRect().right, h: c.getBoundingClientRect().height }))
            return {
              cw: el.clientWidth,
              sw: el.scrollWidth,
              rechts: Math.max(...zellen.map((z) => z.r)) - kasten.right,
              seite: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            }
          })
        }
        for (const [url, kw] of [[`${ERLASS_GEBV}#art-37`, 'Restschuld'], [`${ERLASS_ZH}#art-4`, 'Grundgebühr']] as const) {
          const m = await messe(url, kw)
          expect(m.seite, `${kw}: die Seite läuft @${b} quer`).toBeLessThanOrEqual(0)
          if (b >= 1440) {
            expect(m.sw, `${kw} @${b}: Tabelle ${m.sw} px in ${m.cw} px — Gebühren liegen ${Math.round(m.rechts)} px ausserhalb`)
              .toBeLessThanOrEqual(m.cw + 1)
          } else {
            // @375/@1024: darf im eigenen Container scrollen (Art. 37 ≈ 591 px nötig,
            // @1024 sind 574 frei), aber nicht mehr 2.6 Kastenbreiten breit sein (vorher 1549 px).
            expect(m.sw, `${kw} @${b}: ${m.sw} px bei ${m.cw} px Kasten`).toBeLessThan(2.1 * m.cw)
            expect(m.rechts, `${kw} @${b}: letzte Zelle ${Math.round(m.rechts)} px ausserhalb`).toBeLessThan(350)
          }
        }
      })
    }
  }

  test('D01 · GebV SchKG Art. 37: Betragszellen brechen nie um, Prosa-Zeilen schon', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${ERLASS_GEBV}#art-37`)
    const t = await tabelleMit(page, 'Restschuld')
    const m = await t.evaluate((el) => {
      const zellen = [...el.querySelectorAll('[role="cell"]')]
      // Zeilenzahl über die Textrechtecke der Zelle (die Zellhöhe selbst folgt der höchsten Nachbarzelle).
      const hoch = (c: Element) => {
        const rng = document.createRange()
        rng.selectNodeContents(c)
        return new Set([...rng.getClientRects()].map((r) => Math.round(r.top))).size > 1
      }
      const betrag = zellen.filter((c) => /^\d[\d' ]*\.–$/.test((c.textContent ?? '').trim()))
      const prosa = zellen.filter((c) => (c.textContent ?? '').trim().length > 30)
      return { betraege: betrag.length, betraegeUmbruch: betrag.filter(hoch).length, prosa: prosa.length }
    })
    expect(m.betraege, 'Positiv-Sonde: Betragszellen gefunden').toBeGreaterThanOrEqual(5)
    expect(m.betraegeUmbruch, 'Betragszellen brechen um').toBe(0)
    expect(m.prosa, 'Positiv-Sonde: Prosa-Zellen gefunden').toBeGreaterThanOrEqual(2)
  })
})

test.describe('W2·17 · D03 · lange Absatz-Marken bleiben eine Zeile', () => {
  test('RPG Art. 5: «1quinquies» steht auf einer Zeile und überlappt den Text nicht', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/RPG#art-5')
    await leserBereit(page)
    const art = page.locator('#art-5')
    await expect(art).toBeAttached({ timeout: 20_000 })
    await art.scrollIntoViewIfNeeded()
    const m = await art.evaluate((el) => {
      const marken = [...el.querySelectorAll('button[title$="kopieren"]')]
        .filter((b) => /^\d(quater|quinquies|sexies)/.test((b.textContent ?? '').trim()))
      return marken.map((b) => {
        const r = b.getBoundingClientRect()
        const lh = parseFloat(getComputedStyle(b).lineHeight)
        const ziel = b.nextSibling
        let textLinks = Infinity
        if (ziel) {
          const rng = document.createRange()
          rng.selectNodeContents(ziel)
          const rr = rng.getClientRects()[0]
          if (rr) textLinks = rr.left
        }
        // Luft zwischen dem letzten Zeichen der Marke (Innenrand abgezogen) und dem Text dahinter.
        const innen = parseFloat(getComputedStyle(b).paddingRight)
        return { text: (b.textContent ?? '').trim(), h: r.height, lh, abstand: textLinks - (r.right - innen) }
      })
    })
    expect(m.length, 'Positiv-Sonde: RPG Art. 5 trägt Marken mit Zusatz').toBeGreaterThanOrEqual(1)
    for (const k of m) {
      expect(k.h, `«${k.text}» bricht um (${k.h} px bei Zeilenhöhe ${k.lh})`).toBeLessThanOrEqual(k.lh * 1.3)
      expect(k.abstand, `«${k.text}» klebt am Text (${k.abstand} px)`).toBeGreaterThanOrEqual(3)
    }
  })
})

test.describe('W2·17 · G01 · Kurzbefehle-Hilfe («?») hat eine Fläche', () => {
  for (const [scheme, breite] of [['light', 375], ['dark', 375], ['light', 1440], ['dark', 1440]] as const) {
    test(`StPO @${breite} ${scheme}: der Dialog ist deckend und umrandet`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.setViewportSize({ width: breite, height: 900 })
      await page.goto('/gesetze/bund/STPO#art-3')
      await leserBereit(page)
      await page.locator('#art-3').scrollIntoViewIfNeeded()
      await page.keyboard.press('?')
      const dialog = page.getByRole('dialog', { name: 'Tastatur-Kurzbefehle' })
      await expect(dialog).toBeVisible()
      const m = await dialog.evaluate((el) => {
        const cs = getComputedStyle(el)
        const rgba = (cs.backgroundColor.match(/[\d.]+/g) ?? []).map(Number)
        const r = el.getBoundingClientRect()
        // Was liegt an der Dialogmitte obenauf? Der Dialog selbst — sonst schimmert Normtext durch.
        return {
          alpha: rgba.length > 3 ? rgba[3] : 1,
          rand: parseFloat(cs.borderTopWidth),
          oben: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('[role="dialog"]') === el,
        }
      })
      expect(m.alpha, 'Hintergrund des Dialogs ist transparent — der Normtext schimmert durch').toBeGreaterThanOrEqual(0.99)
      expect(m.rand, 'der Dialog trägt keine Kante').toBeGreaterThanOrEqual(1)
      expect(m.oben).toBe(true)
    })
  }
})
