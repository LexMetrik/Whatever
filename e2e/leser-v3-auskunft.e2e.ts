// @shard-gruppe: nacht
// ─── H2b · Was die Trefferliste und das Suchfeld AUSSAGEN (Ä14–Ä23) ──────────
//
// Fünf Positionen des Ästhetik-Reviews H1 mit einem gemeinsamen Kern: die
// Oberfläche sagte weniger, als sie wusste, oder sagte es doppelt. Alle fünf sind
// am 17.8.2026 gemessen worden und stehen hier je als ein Fall.
//
//  Ä14  Fokusring am Suchfeld: `.lc-input:focus` setzte Rahmenfarbe + `--ring`
//       (2 px Papier-Saum + 2 px Messing) — gemessen `boxShadow: rgb(254,252,250)
//       0 0 0 2px, rgb(130,98,37) 0 0 0 4px`. Neu: EIN 2-px-Ring in der Rolle
//       `focus`, `box-shadow: none`.
//  Ä15  Trefferzähler: «49 Artikel · 110 Fundstellen» brauchte 176 px in einer
//       148-px-Zelle und wurde per `truncate` angeschnitten — eine Ellipse an
//       einer Kernauskunft (§8). Neu: Umbruch, `scrollWidth === clientWidth`.
//  Ä16  ZWEI ✕ im Feld: `type="search"` brachte Chromiums eigenen
//       `::-webkit-search-cancel-button` mit, daneben stand `data-v3-such-leeren`.
//       Neu: `type="text"` + `role="searchbox"` — eine Löschung.
//  Ä17  Trefferzeilen hatten den Kontext-Schnipsel verloren (V3 zeigte
//       «Art. 47 Kosten 4», V1 den Ausschnitt). Neu: im Ruhezustand je Gruppe der
//       Ausschnitt, den `LeserTreffer.ausschnitt` ohnehin trägt.
//  Ä20/Ä23 Platzhalter und Zählwort waren auf «Art.»/«Artikel» festgenagelt —
//       gemessen an ZH-211.11: «Suchen oder «Art. 429» …» und «9 Artikel» in einem
//       Erlass, der durchweg «§» führt. Neu: beides aus dem Datenmodell.
//
// ROT ZU BEKOMMEN (§6.7, je Fall genannt, alle gesehen):
//  Ä14 `.lc-v3-feld` aus dem className des Inputs entfernen (SuchSprungFeld.tsx)
//  Ä15 `leading-snug` am Zähler durch `truncate` ersetzen (LeserTrefferListe.tsx)
//  Ä16 `type="text"` zurück auf `type="search"` (SuchSprungFeld.tsx)
//  Ä17 die `{!offen && t.ausschnitt && …}`-Zeile entfernen (LeserTrefferListe.tsx)
//  Ä20/Ä23 `platzhalter`/`bestimmungsWort` am Aufruf im Rahmen weglassen
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const feld = (page: Page) => page.locator('[data-v3-suchsprung] input').first()

async function oeffne(page: Page, pfad: string): Promise<string[]> {
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(pfad)
  await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
  await expect(feld(page)).toBeVisible({ timeout: 20_000 })
  return fehler
}

test.describe('H2b — Suchfeld und Trefferliste sagen, was sie wissen', () => {
  test('Ä14 · der Fokusring ist EIN 2-px-Ring in der Fokus-Rolle', async ({ page }) => {
    const fehler = await oeffne(page, '/gesetze/bund/BGFA')
    await feld(page).focus()
    await expect(feld(page)).toBeFocused()
    const stil = await feld(page).evaluate((el) => {
      const s = getComputedStyle(el)
      return { boxShadow: s.boxShadow, outlineWidth: s.outlineWidth, outlineStyle: s.outlineStyle }
    })
    expect(stil.boxShadow, `Doppelring über box-shadow noch da: ${stil.boxShadow}`).toBe('none')
    expect(stil.outlineStyle, 'kein sichtbarer Fokusring').toBe('solid')
    expect(parseFloat(stil.outlineWidth), `Ringbreite ${stil.outlineWidth}`).toBe(2)
    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('Ä16 · genau EINE Löschung im Feld (kein nativer Cancel-Knopf)', async ({ page }) => {
    const fehler = await oeffne(page, '/gesetze/bund/BGFA')
    // Der native Cancel existiert nur an `type="search"`. Er ist per DOM nicht
    // zählbar (UA-Pseudoelement) — darum wird die URSACHE geprüft, nicht ihr
    // Schatten: kein `type="search"` ⇒ kein zweites ✕, in jeder Engine.
    await expect(feld(page)).toHaveAttribute('type', 'text')
    // Die Semantik, die `type="search"` mitbrachte, muss ausdrücklich ersetzt sein.
    await expect(feld(page)).toHaveAttribute('role', 'searchbox')
    await feld(page).fill('Anwalt')
    await expect(page.locator('[data-v3-such-leeren]')).toHaveCount(1)
    // Und sie löscht wirklich, ohne den Fokus zu verlieren (Pos. 14).
    await page.locator('[data-v3-such-leeren]').click()
    await expect(feld(page)).toHaveValue('')
    await expect(feld(page)).toBeFocused()
    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('Ä15 + Ä17 · der Zähler wird nicht angeschnitten, die Zeilen tragen Kontext', async ({ page }) => {
    test.slow() // grosser Erlass, damit der Zähler überhaupt lang wird
    const fehler = await oeffne(page, '/gesetze/bund/STPO')
    await feld(page).fill('Kosten')
    await expect(page.locator('[data-treffer-leiste]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-treffer-artikel]').first()).toBeVisible({ timeout: 20_000 })

    // Ä15: keine Ellipse an der Kernauskunft.
    const zaehler = await page.locator('[data-treffer-leiste] p').first().evaluate((el) => ({
      text: (el as HTMLElement).innerText.replace(/\s+/g, ' ').trim(),
      abgeschnitten: el.scrollWidth > el.clientWidth + 1,
    }))
    expect(zaehler.abgeschnitten, `Zähler «${zaehler.text}» ist ellipsiert`).toBe(false)
    expect(zaehler.text, 'der Zähler nennt beide Zahlen').toMatch(/\d+ Artikel.*\d+ Fundstellen/)

    // Ä17: im RUHEZUSTAND (nichts aufgeklappt) trägt jede Artikelzeile ihren
    // Ausschnitt. Geprüft wird die Zeile, nicht die Gesamtmenge — eine einzige
    // Zeile mit Schnipsel liesse den Befund offen.
    const mitSchnipsel = await page.locator('[data-treffer-artikel]').evaluateAll((els) =>
      els.filter((el) => el.querySelector('[data-treffer-schnipsel]')).length)
    const alle = await page.locator('[data-treffer-artikel]').count()
    expect(mitSchnipsel, `nur ${mitSchnipsel} von ${alle} Trefferzeilen tragen einen Kontext-Schnipsel`)
      .toBe(alle)
    // Und der Schnipsel markiert den Begriff, statt ihn nur mitzuschleppen.
    await expect(page.locator('[data-treffer-schnipsel] mark').first()).toBeVisible()

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('Ä20 + Ä23 · §-Erlass: Platzhalter und Zählwort kommen aus dem Erlass', async ({ page }) => {
    test.slow()
    const fehler = await oeffne(page, '/gesetze/kanton/ZH-211.11')

    // Ä20: der Platzhalter nennt eine Bestimmung, die es hier WIRKLICH gibt.
    const platzhalter = await feld(page).getAttribute('placeholder')
    expect(platzhalter, `Platzhalter «${platzhalter}» verspricht einen Artikel`).not.toContain('Art.')
    expect(platzhalter, `Platzhalter «${platzhalter}»`).toContain('§')

    // Ä23: die Zählzeile zählt Paragraphen, nicht Artikel.
    await feld(page).fill('Gericht')
    await expect(page.locator('[data-treffer-leiste]')).toBeVisible({ timeout: 20_000 })
    const zeile = await page.locator('[data-treffer-leiste] p').first().innerText()
    expect(zeile.replace(/\s+/g, ' '), `Zählzeile «${zeile.trim()}» an einem §-Erlass`)
      .toMatch(/\d+ Paragraph(en)?/)
    expect(zeile, 'ein §-Erlass darf keine «Artikel» zählen').not.toContain('Artikel')

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('Ä10 + Ä5 · das Gliederungs-Blatt sagt «Gliederung» genau einmal', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/BGFA')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.locator('[data-v3-gliederung-auf]').first().click()
    await expect(page.locator('[data-gliederung-sheet]')).toBeVisible({ timeout: 15_000 })

    const doppelt = await page.locator('[data-gliederung-sheet]').evaluate((el) =>
      [...el.querySelectorAll('*')].filter((e) =>
        e.children.length === 0 && (e.textContent ?? '').trim().toLowerCase() === 'gliederung').length)
    expect(doppelt, `«Gliederung» steht ${doppelt}× im Blatt`).toBe(1)

    // Ä5: der klebende Sockel der Leiste trägt die Fläche seines Behälters —
    // im Blatt `paper-raised`, nicht `paper`. Sonst malt er dort ein sichtbares
    // Rechteck in einem dritten Ton.
    const toene = await page.locator('[data-gliederung-sheet]').evaluate((el) => {
      const sockel = el.querySelector('[data-toc-zone-a]')
      return {
        blatt: getComputedStyle(el).backgroundColor,
        sockel: sockel ? getComputedStyle(sockel).backgroundColor : '(kein Sockel)',
      }
    })
    expect(toene.sockel, `Blatt ${toene.blatt} gegen Sockel ${toene.sockel}`).toBe(toene.blatt)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})
