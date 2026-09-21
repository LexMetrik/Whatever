// @shard-gruppe: 3
import { test, expect, type Page } from '@playwright/test'

// ═══ S2-NACHZUG · MARKEN-GEOMETRIE IM LESEKÖRPER (17.8.2026) ═════════════════
//
// ZWEI Befunde des Ästhetik-Prüfers, beide am gebauten Stand REPRODUZIERT und
// vermessen, beide VORBESTEHEND (in der Ist-Hülle V1 gleich wie in V3) — und
// beide vom Typ «die Marke rückt dem Wortlaut ins Gehege». Sie stehen zusammen
// in einer Datei, weil sie dieselbe Frage stellen: hängt die Marke NEBEN dem
// Text, oder liegt sie darüber bzw. steht sie allein?
//
// HÜLLE: Die Prüfung läuft gegen BEIDE Hüllen. Die geprüften Klassen sitzen im
// KERN (`components/normtext/ArtikelBody.tsx`), sind also nicht V3-gegated; die
// Messung hat das bestätigt (identische Zahlen mit und ohne `?leser=v3`). Der
// Fall zu Ä61 nimmt darum ausdrücklich beide Adressen, der zu Ä62 prüft V3 UND
// V1. Diese Datei steht in keiner Projektliste und läuft damit im Projekt
// `chromium`; V3 wird — wie in `playwright.config.ts` beschrieben — über den
// Query-Parameter gesetzt.
//
// NACHTRAG 31.8.2026 (der Absatz oben bleibt als datierter Beleg stehen): mit der
// V1-Löschung (H5, 21.8.2026) gibt es nur noch EINE Hülle, und `?leser=v3` ist ein
// toter Parameter — `src/pages/GesetzLeser.tsx` rendert bedingungslos
// `LeserRahmenV3`, kein `leser=`-Switch im Produktcode (nachgemessen 31.8.2026 am
// Stand `337d2c9ef`). Die «V1»-Fälle waren damit zeichenweise ihre eigenen
// V3-Zwillinge und sind als Duplikate gestrichen; der Parameter ist aus den
// Adressen entfernt.
//
// ── Ä61 · lit.-MARKE LÄUFT ÜBER DEN ITEM-TEXT ────────────────────────────────
// Die Marken-Spalte der Aufzählungs-Items hatte eine FESTE Breite (`w-6` = 24 px)
// bei `shrink-0` und rechter Ausrichtung. Eine Marke, die breiter ist, dehnt die
// Box nicht — ihre Tinte läuft rechts heraus, über den Item-Text. GEMESSEN @1440
// vor dem Fix, in beiden Hüllen identisch (OR Art. 336c): `cbis.` und `cter.` je
// 10 px in den Text hinein, `cquater.` 35.2 px, `cquinquies.` 60.41 px; AIG
// Art. 5 `abis.` 10 px. Am Bild las sich das als «cbisvor», «cquatersolange»,
// «abismüssen». Betroffen ist damit genau das Ordnungs-Suffix des schweizerischen
// Rechts (bis/ter/quater/quinquies) — die einstelligen Marken blieben 8 px vor
// der Textkante.
//
// ROT ZU BEKOMMEN (§6.7): in `ArtikelBody.tsx` an den beiden Marken-Spans
// `min-w-6` durch `w-6` ersetzen (der Stand vor dem Nachzug). Einmal gesehen:
// 4 von 8 Items in OR 336c rot, grösster Überstand 60.41 px.
//
// ── Ä62 · FUSSNOTENMARKE ALS WAISE AM ZEILENANFANG ───────────────────────────
// Die Marke fiel allein auf die Folgezeile, obwohl die Zeile davor noch Platz
// hatte. GEMESSEN @1440 vor dem Fix: StGB 13 von 532 Marken (V3) bzw. 16 von 532
// (V1), StPO 8 von 276 (V3). Ursache ist die ATOMARE Inline-Box des Marker-
// `<button>`: Blink erzwingt sie unabhängig von der CSS-Angabe (`display:inline`
// am Marker ist gemessen ein No-op), und der A31-Wort-Verbinder VOR ihr verhindert
// den Bruch nicht. Herleitung, ausgeschlossene Alternativen (`overflow-wrap`) und
// der Gegenbeweis über DOM-Chirurgie stehen an `FnRef` in `ArtikelBody.tsx`.
//
// ROT ZU BEKOMMEN (§6.7): am Marker-Träger in `ArtikelBody.tsx` (`FnRef`)
// `whitespace-nowrap` entfernen ODER den `{WJ}` innerhalb des Trägers löschen —
// beides führt die Waisen zurück. Einmal gesehen: StGB 13, StPO 8.
//
// Die Waisen-Zählung ist dieselbe Methode wie im Prüfer-Skript: für jede Marke
// den unmittelbar vorausgehenden nicht-leeren Textknoten nehmen, dessen LETZTE
// Zeilenkiste bestimmen und prüfen, ob die Marke darunter UND links von deren
// rechtem Ende sitzt. Toleranzen (3 px / 4 px) fangen Subpixel-Rundung und die
// Hochstellung ab.

const WAISEN_ZAEHLER = async (page: Page) => page.evaluate(async () => {
  const waisen: string[] = []
  let tot = 0
  for (const art of Array.from(document.querySelectorAll('[id^="art-"]'))) {
    // Ohne Sichtbarmachen misst `content-visibility: auto` nicht (übersprungene
    // Artikel liefern nur ihre Ersatzhöhe).
    art.scrollIntoView()
    await new Promise((r) => setTimeout(r, 12))
    for (const marke of Array.from(art.querySelectorAll('[data-fn-ref]'))) {
      tot++
      const walker = document.createTreeWalker(art, NodeFilter.SHOW_TEXT)
      let davor: Text | null = null
      let n: Node | null
      while ((n = walker.nextNode())) {
        if (marke.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_PRECEDING) {
          // Wort-Verbinder und Leerraum zählen nicht als Text.
          if ((n.textContent ?? '').replace(/[⁠\s]/g, '').length) davor = n as Text
        } else break
      }
      if (davor == null) continue
      const r = document.createRange()
      r.selectNodeContents(davor)
      const kisten = r.getClientRects()
      const letzte = kisten[kisten.length - 1]
      const m = marke.getBoundingClientRect()
      if (letzte && m.top >= letzte.bottom - 3 && m.left < letzte.right - 4) {
        waisen.push(`${art.id}:${marke.textContent}`)
      }
    }
  }
  return { tot, n: waisen.length, beispiele: waisen.slice(0, 8) }
})

async function ladeLeser(page: Page, pfad: string): Promise<void> {
  await page.goto(pfad)
  await page.locator('[id^="art-"]').first().waitFor({ state: 'attached', timeout: 30_000 })
  await page.evaluate(() => document.fonts?.ready)
  await page.waitForTimeout(1200)
}

test.describe('Ä61 · die lit.-Marke überlappt den Item-Text nicht', () => {
  test.use({ viewport: { width: 1440, height: 1440 } })
  // DIÄT 31.8.2026 (Runde 2 / Batch A): hier standen zwei Adressen, `…/OR?leser=v3`
  // und `…/OR`. Seit der V1-Löschung (H5, 21.8.2026) liest der Produktcode den
  // Parameter nicht mehr (`src/pages/GesetzLeser.tsx` rendert bedingungslos
  // `LeserRahmenV3`) — die beiden Fälle waren also zeichenweise DERSELBE Fall,
  // zweimal gefahren, beide `test.slow()` auf dem 2038-Artikel-OR. Der zweite ist
  // als bewiesenes Duplikat gestrichen; die geprüfte Aussage ist unverändert.
  for (const [name, pfad] of [['V3', '/gesetze/bund/OR']] as const) {
    test(`OR 336c (${name}): lit. cbis/cter/cquater/cquinquies bleiben in ihrer Spalte`, async ({ page }) => {
      test.slow()
      await ladeLeser(page, pfad)
      await page.evaluate(() => document.getElementById('art-336_c')?.scrollIntoView())
      await page.waitForTimeout(600)

      const zeilen = await page.evaluate(() => {
        const art = document.getElementById('art-336_c')
        if (art == null) return null
        // Rechter Rand der TINTE, nicht der Box: eine überlaufende Marke behält
        // ihre 24-px-Box, nur ihr Text ragt hinaus. Darum Range-Kisten.
        const inkRechts = (el: Element): number => {
          const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
          let max = -Infinity
          let n: Node | null
          while ((n = w.nextNode())) {
            if (!(n.textContent ?? '').trim()) continue
            const r = document.createRange()
            r.selectNodeContents(n)
            for (const k of Array.from(r.getClientRects())) max = Math.max(max, k.right)
          }
          return max
        }
        const out: Array<{ marke: string; ueberstand: number }> = []
        // ── §6.3-DEKLARATION (W2·24-R6, 6.9.2026) · DER ANKER WIRD ENGER ────
        // Die Sonde nahm JEDES `li` des Artikels. Seit R6 trägt der Artikel im
        // vollen Satzspiegel eine dritte Spalte — die Randnotiz —, und deren
        // «Rechnen»-Rubrik ist eine Liste: Werkzeug-Link, darunter die Art
        // («Rechner»). Zwei GESTAPELTE Zeilen, also ragt die erste
        // zwangsläufig über die linke Kante der zweiten hinaus; gemeldet wurde
        // «Kündigung & Fristen im Arbeitsverhältnis +133.73 px». Das ist keine
        // Marken-Kollision, es ist gar keine Marke.
        // Die ABSICHT des Falls war immer der WORTLAUT: ragt die Ordnungsmarke
        // («cbis.») in den Text ihres Aufzählungspunkts? Der Anker sagt das
        // jetzt auch — `.lr-text` ist die Textspalte des Satzspiegels und in
        // der Zeilenform (V1, Trefferliste, schmal) ebenfalls der Träger des
        // Wortlauts, der Fall bleibt dort also unverändert bestückt. Die
        // bis/ter-Pflichtprüfung darunter beweist das bei jedem Lauf: fände der
        // Anker den Wortlaut nicht, wäre der Fall rot, nicht still grün (§6.7).
        // ── §6.3-DEKLARATION (W2·24-R6b, 6.9.2026) · DERSELBE GRUND, NEUER ORT ─
        // Mit dem Wegfall der Randspalten steht die «Rechnen»-Liste nicht mehr
        // neben dem Artikel, sondern in der Bezüge-Zeile UNTER dem Artikelkopf —
        // also innerhalb von `.lr-text`. Der R6-Anker allein trennt sie damit
        // nicht mehr ab, und der Fall meldete wieder «Kündigung & Fristen im
        // Arbeitsverhältnis +233.52 px»: dieselbe Nicht-Marke, neuer Ort.
        // Getrennt wird jetzt an der Eigenschaft, um die es geht, statt an einer
        // Fläche: `data-such-meta` markiert im ganzen Leser das, was BEDIENUNG
        // ist und kein Gesetzestext (§4.4) — genau die Menge, die diese Sonde
        // nichts angeht. Die ABSICHT bleibt der Wortlaut; die bis/ter-
        // Pflichtprüfung darunter hält den Fall weiter scharf (§6.7).
        const wortlaut = art.querySelector('.lr-text') ?? art
        for (const li of Array.from(wortlaut.querySelectorAll('li'))) {
          if (li.closest('[data-such-meta]') != null) continue
          const marke = li.firstElementChild
          const text = marke?.nextElementSibling
          if (marke == null || text == null) continue
          const mBox = marke.getBoundingClientRect()
          const tBox = text.getBoundingClientRect()
          if (mBox.width === 0 || tBox.width === 0) continue
          const ink = inkRechts(marke)
          if (!Number.isFinite(ink)) continue
          out.push({
            marke: (marke.textContent ?? '').trim(),
            ueberstand: Math.round((ink - tBox.left) * 100) / 100,
          })
        }
        return out
      })

      expect(zeilen, 'OR Art. 336c ist im DOM und trägt Aufzählungs-Items').not.toBeNull()
      // Die Ordnungs-Suffixe MÜSSEN vorkommen — sonst prüfte der Fall nichts (§6.7).
      const suffixe = zeilen!.filter((z) => /^[a-z](bis|ter|quater|quinquies)\.$/.test(z.marke))
      expect(suffixe.length, `keine bis/ter-Marke gefunden (gesehen: ${zeilen!.map((z) => z.marke).join(' ')})`)
        .toBeGreaterThanOrEqual(3)

      const kollisionen = zeilen!.filter((z) => z.ueberstand > 0)
      expect(
        kollisionen,
        `Marken-Tinte läuft in den Item-Text:\n${kollisionen.map((k) => `  «${k.marke}» +${k.ueberstand} px`).join('\n')}`,
      ).toEqual([])
    })
  }
})

test.describe('Ä62 · die Fussnotenmarke bleibt am Wort, nie allein am Zeilenanfang', () => {
  test.use({ viewport: { width: 1440, height: 1440 } })
  // DIÄT 31.8.2026 (Runde 2 / Batch A): «StGB V1» war `…/STGB` ohne Parameter und
  // damit — seit der V1-Löschung 21.8.2026 — dieselbe Adresse wie «StGB V3».
  // Gestrichen als bewiesenes Duplikat (Beleg: bibliothek/betrieb/
  // testapparat-fang-historie-2026-08-31.md §7 Ziff. 1). Die beiden verbleibenden
  // Fälle decken beide Erlasse wie zuvor.
  for (const [name, pfad] of [
    ['StGB V3', '/gesetze/bund/STGB'],
    ['StPO V3', '/gesetze/bund/STPO'],
  ] as const) {
    test(`${name}: keine Marken-Waise`, async ({ page }) => {
      test.slow()
      await ladeLeser(page, pfad)
      const r = await WAISEN_ZAEHLER(page)
      // Positiv-Sicherung: ohne Marken prüfte der Fall nichts (§6.7).
      expect(r.tot, `${name}: keine Fussnotenmarke gefunden`).toBeGreaterThan(100)
      expect(
        r.n,
        `${name}: ${r.n} von ${r.tot} Marken stehen allein am Zeilenanfang — ${r.beispiele.join(', ')}`,
      ).toBe(0)
    })
  }
})
