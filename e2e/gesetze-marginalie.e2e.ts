// @shard-gruppe: 6
// Regressionsschutz für die einheitliche Randtitel-Formatierung (Auftrag 6a,
// David 26.6.2026 «uneinheitliche Bold-Formatierung»). Zwei stabile Rollen
// (margStufeStil): das BLATT (unterste gezeigte Stufe = Sachüberschrift) ist
// immer prominent, die VORFAHREN sind ruhiger Kontext je absoluter Tiefe — so
// flippt kein Vorfahre («II. Handlungsfähigkeit») mehr zwischen den Artikeln.
// Diese Tests prüfen die Invariante glyph-agnostisch am echten ZGB-Reader.
import { test, expect } from '@playwright/test'

async function margStapel(page: import('@playwright/test').Page) {
  await page.goto('/gesetze/bund/ZGB')
  await expect(page.locator('a[href="#art-11"]').first()).toBeVisible()
  return page.evaluate(() => {
    const stapel = [...document.querySelectorAll('div.font-serif.leading-snug')].filter((d) =>
      d.className.includes('space-y-0.5'),
    )
    return stapel.map((s) =>
      [...s.children].map((c) => {
        const cs = getComputedStyle(c as Element)
        return {
          text: (c.textContent ?? '').trim().slice(0, 30),
          size: parseFloat(cs.fontSize),
          weight: parseInt(cs.fontWeight, 10),
          // S2: die Hierarchie trägt seit Ä7 auch die FARBE (Blatt ink-800 gegen
          // Vorfahren ink-600) — ohne sie liesse sich «prominenter» nicht mehr
          // vollständig prüfen, wenn alle Stufen dieselbe Grösse haben.
          color: cs.color,
        }
      }),
    )
  })
}

// ── S2 · DEKLARIERTE FACHLICHE ÄNDERUNG (§6.3, kein Refactoring) ─────────────
//
// Bis S2 stand hier eine ABSOLUTE Grössenschwelle: Blatt ≥ 16 px, Vorfahren
// strikt kleiner. Der Entscheid David 17.8.2026 am Bildbogen (F3 = V2 «amtsnah
// kompakt») setzt die Zeile «Marginalie/Randtitel 0.8125 rem, Sans, ink-600» —
// alle Randtitel-Stufen laufen damit auf 13 px, und die alte Schwelle prüfte
// nicht mehr die Invariante, sondern die abgelöste Grösse (gemessen: Blatt 13 px
// gegen erwartete ≥ 16).
//
// DIE INVARIANTE BLEIBT UNVERÄNDERT und ist weiterhin die des Auftrags David
// 26.6.2026 («uneinheitliche Bold-Formatierung»): jedes Blatt (die unterste
// gezeigte Stufe = Sachüberschrift) sieht GLEICH aus, und zwar so, wie Ä7 es
// festlegt. Geprüft wird das ab dem S2-Nachzug an allen drei Merkmalen der Stufe
// — Grösse 13 px (Token `leser-rand`), Gewicht 600, Farbe ink-800 —, weil die
// Grösse allein die Rangfolge nicht mehr tragen kann: nach V2 laufen alle drei
// Randtitel-Stufen auf derselben Grösse und unterscheiden sich über Gewicht und
// Farbe. Die Farbe steht als `rgb(...)`-Literal, weil dieser Test im Hell-Modus
// läuft (Projekt `chromium`/`leser-v3` ohne Farbschema-Override).
//
// OFFEN FÜR DAVIDS AUGE (§8, nicht vom Test zu entscheiden): die Sachüberschrift
// ist mit V2 von 16 px auf 13 px gefallen. Das folgt der V2-Zeile, die David am
// Bogen gewählt hat, berührt aber denselben Auftrag vom 26.6.2026, der verlangte,
// sie dürfe nicht «zu einem blassen Abschnittslabel verkümmern». Die Nachher-
// Bilder unter docs/ux-audit-2026-07/reader/leser-v3-s2/nachher/ zeigen es am
// Objekt; der Vollzugsvermerk S2 führt es als Vorbehalt.
/** Relative Helligkeit einer `rgb(...)`-Farbe (WCAG-Formel, ohne Alpha-Fall). */
function helligkeit(farbe: string): number {
  const m = farbe.match(/\d+(\.\d+)?/g)
  if (!m || m.length < 3) throw new Error(`Farbe nicht lesbar: ${farbe}`)
  const [r, g, b] = m.slice(0, 3).map((v) => {
    const k = Number(v) / 255
    return k <= 0.03928 ? k / 12.92 : ((k + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// ── S2-NACHZUG 17.8.2026: DER TOTE VORFAHREN-ZWEIG IST GESTRICHEN ────────────
//
// Bis zum Nachzug stand hier eine Schleife über die VORFAHREN eines Randtitel-
// Stapels mit drei Zusicherungen (nie grösser, nie fett, nie dunkler als das
// Blatt). Sie lief NIE — und zwar schon vor S2 nicht: alle 11 Randtitel-Stapel,
// die dieser Test auf dem ZGB sieht, haben GENAU EIN Kind (`mitVorfahren: 0`);
// über ZGB und OR hinweg 40 000 px durchgescrollt findet sich kein Stapel mit
// mehr als einem Kind. Grund im Produkt: `margAnzeige` zeigt nur die gegenüber
// dem Vorartikel GEÄNDERTEN Stufen, und das ist praktisch immer nur das Blatt.
// Belegt war der tote Zweig durch einen Rot-Beweis, der GRÜN blieb: das Blatt
// versuchsweise auf `font-semibold text-ink-400` gesetzt (heller als jeder
// Vorfahr) — 4/4 grün, weil die Schleife nicht läuft.
//
// S2 hatte die Zusicherungen mit der Begründung STEHEN GELASSEN, sie seien
// «richtig, nur unerreicht». Drei Prüfer haben das übereinstimmend als Deckungs-
// Schein gemeldet, und CLAUDE.md §17 Abs. 2 ist eindeutig: was nicht scheitern
// kann, wird GESTRICHEN statt bewacht (Präzedenz `seq-hart`). Ein Zweig, der die
// Hierarchie erst prüft, wenn ihn irgendwann ein Datenstand erreicht, schützt
// heute nichts und verdeckt, was wirklich geprüft ist. Kommt der mehrstufige
// Stapel je, ist er ein sichtbarer Datenstand mit eigenem Fall.
//
// Was bleibt, ist EINE LEBENDE Zusicherung am Blatt — und die ist jetzt vollständig
// (bis S2 prüfte sie nur `weight >= 600`): Grösse, Gewicht UND Farbe des Blatts
// gegen den Ä7-Entscheid, gemessen 13 px / 600 / ink-800.
const BLATT_PX = 13          // Token `leser-rand` 0.8125 rem (F3 = V2)
const BLATT_GEWICHT = 600    // semibold
// ── §6.3-DEKLARATION (W2·24-R6b, 6.9.2026) · DIE ZAHL WAR STEHENGEBLIEBEN ────
// `rgb(43, 41, 36)` (#2B2924) war der Wert von `--ink-800` VOR der Farbrunde
// D12 («Lesekomfort — warmes Papier, gedämpfte Tinte», f1cef1042). Seither steht
// `--ink-800` in `src/index.css` auf **#32302C = rgb(50, 48, 44)**; das Literal
// hier ist nie mitgezogen worden. Aufgefallen ist es erst jetzt, weil dieselbe
// Zusicherung seit R4/R6 gar nicht mehr erreicht wurde: die Gewichts-Prüfung
// darüber war rot (der Randtitel lief im Satzspiegel auf `font-weight:500`), und
// Vitest bricht am ersten `expect`. Der Fall war damit auf dem Basis-Commit
// 84eea666e byte-gleich rot (Nullprobe 6.9.2026, gemessen «Gewicht 500»).
// Die ABSICHT ist unverändert die des Ä7-Entscheids — das Blatt trägt ink-800 —,
// nur steht die Zahl jetzt wieder für das, was sie behauptet.
const BLATT_FARBE = 'rgb(50, 48, 44)' // --ink-800 = #32302C (src/index.css)

test('Blatt (Sachüberschrift) trägt die Ä7-Stufe: 13 px semibold ink-800', async ({ page }) => {
  const stapel = await margStapel(page)
  expect(stapel.length, 'ZGB hat Randtitel-Stapel').toBeGreaterThan(5)
  // Die Invariante des Auftrags David 26.6.2026 («uneinheitliche Bold-
  // Formatierung») heisst: JEDES Blatt sieht gleich aus. Darum über alle Stapel,
  // nicht am ersten.
  for (const zeilen of stapel) {
    const blatt = zeilen[zeilen.length - 1]
    expect(blatt.size, `Blatt ${JSON.stringify(blatt.text)}: Grösse`).toBeCloseTo(BLATT_PX, 1)
    expect(blatt.weight, `Blatt ${JSON.stringify(blatt.text)}: Gewicht`).toBeGreaterThanOrEqual(BLATT_GEWICHT)
    expect(blatt.color, `Blatt ${JSON.stringify(blatt.text)}: Farbe`).toBe(BLATT_FARBE)
    // Und das Blatt ist nie heller als ink-800 — die Farbe ist seit Ä7 das zweite
    // Merkmal der Hierarchie, weil alle Randtitel-Stufen gleich gross sind.
    expect(helligkeit(blatt.color), `Blatt ${JSON.stringify(blatt.text)} ist heller als ink-800`)
      .toBeLessThanOrEqual(helligkeit(BLATT_FARBE) + 0.001)
  }
})

test('Höchstens drei definierte Randtitel-Stil-Stufen (kein Wildwuchs)', async ({ page }) => {
  const stapel = await margStapel(page)
  const stile = new Set(stapel.flat().map((z) => `${z.size}/${z.weight}`))
  // NACHZUG 17.8.2026: hier stand «Blatt 16/600, Vorfahr-Abschnitt 14/500,
  // Vorfahr-tiefer 14/400» — mit F3 = V2 überholt. `margStufeStil` definiert die
  // drei Stufen jetzt auf EINER Grösse (Token `leser-rand` = 13 px) und
  // unterscheidet sie über Gewicht und Farbe: Blatt 13/600 ink-800 >
  // Vorfahr-Abschnitt 13/500 ink-600 (Versalien) > Vorfahr-tiefer 13/400 ink-600.
  // Höchstens drei distinkte (size,weight)-Paare bleibt damit die richtige Grenze.
  expect(stile.size, `gefundene Stile: ${[...stile].join(', ')}`).toBeLessThanOrEqual(3)
})

// A30/A31 (David 16.7.2026, E2): Marginalien-Suffix hochgestellt + Fussnoten-
// Marker klebt an Artikelnummer/Marginalie (Fedlex-treu, empirisch am Filestore-
// HTML verifiziert: «III<sup>bis</sup>.», Marker als <sup> DIREKT am Bezugswort).
test('A30: Marginalien-Ordnungssuffix (bis/ter) wird hochgestellt', async ({ page }) => {
  await page.goto('/gesetze/bund/ZGB')
  await expect(page.locator('a[href="#art-19_d"]').first()).toBeVisible()
  // Der Randtitel «IIIbis. …» rendert «bis» als eigenes <sup> (nicht flach im
  // Text); ein <sup> mit exakt «bis» ist ausschliesslich der Marginalien-Suffix
  // (Absatznummern stehen als «1bis» ganz im <sup>, Fussnoten sind <button>).
  const hatSuffixSup = await page.evaluate(() =>
    [...document.querySelectorAll('sup')].some((s) => s.textContent?.trim() === 'bis'),
  )
  expect(hatSuffixSup, 'Randtitel-Suffix «bis» ist hochgestellt').toBe(true)
})

test('A31: Fussnoten-Marker klebt ohne Abstand an der Artikelnummer', async ({ page }) => {
  await page.goto('/gesetze/bund/ZGB#art-276')
  // ── §6.3-DEKLARATION (W2·24, 6.9.2026) · DER ANKER IM ARTIKEL, NICHT IM BAUM
  // `a[href="#art-276"]` traf seit P8 («Gliederungszeilen sind Links», neue
  // Spec `leser-gliederung-p8`) zuerst die GLIEDERUNGS-Zeile in der
  // Seitenspalte: sie trägt seither dieselbe Adresse. Deren Elternteil ist ein
  // `div.flex` ohne `nowrap` und ohne Fussnoten-Marker — der Fall prüfte also
  // ein anderes Element als das, über das er spricht (gemessen: wrap = DIV
  // `flex items-start`, white-space `normal`). Der Prüfpunkt ist unverändert
  // die Artikelnummer IM Artikel; nur der Selektor sagt das jetzt auch.
  await expect(page.locator('#art-276 a[href="#art-276"]').first()).toBeVisible()
  const geklebt = await page.evaluate(() => {
    const a = document.querySelector('#art-276 a[href="#art-276"]')
    const wrap = a?.parentElement
    if (!wrap || getComputedStyle(wrap).whiteSpace !== 'nowrap') return false
    // Der Artikel-Fussnoten-Marker (353) liegt IM selben nowrap-Wrapper wie das
    // «Art. N»-Label → kein gap-x-2/ml-Abstand, kein Umbruch auf eine eigene Zeile.
    return !!wrap.querySelector('button[aria-label^="Fussnote"]')
  })
  expect(geklebt, '«Art. 276» + Marker sind EIN nowrap-Inline-Element').toBe(true)
})
