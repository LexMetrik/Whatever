// @shard-gruppe: 7
// ─── Ä76 (David 17.8.2026) · SUCHE BEI EINGEKLAPPTER GLIEDERUNG ──────────────
//
// BEFUND, wörtlich: «wenn die gliederung ausgeblendet ist funktioniert suche
// nicht mehr resp. resultat ist versteckt. andere lösung finden.»
//
// WAS DER PROD-STAND (afc008c19) TAT, gemessen @1440 und @1024 auf der StPO mit
// «Entschädigung», Gliederung per «‹ Gliederung ausblenden» zugeklappt:
//   Suchfeld       1 (in der Kopf-Zone — Ä19 hielt)
//   Zähler-Zeile   «50 Artikel · 88 Fundstellen  Treffer anzeigen →», sichtbar
//   Trefferliste   im DOM, `isVisible()` true — aber y = 755, HÖHE 3596 px,
//                  INLINE über dem Lesetext
// Formal sichtbar, faktisch verschwunden: die Liste begann unter der Falz
// (Viewport 900) und schob den gesamten Gesetzestext um 3,6 Bildschirmhöhen nach
// unten. Der Befund BLEIBT der Massstab dieser Spec; nur die Antwort darauf hat
// gewechselt (§2b — ein Beleg wird nicht nachgeführt, er wird ergänzt):
//
//  · Ä76 (17.8.2026) antwortete mit dem TREFFER-BLATT am Feld — 18 rem breit,
//    halbe Fensterhöhe, ausserhalb des Flusses.
//  · D38 (7.9.2026) antwortet mit der LESESPALTE: «die suchresultate … sollen
//    den gesetzestext ersetzen». Das Blatt ist damit gefallen, und mit ihm die
//    Frage, die es beantwortete — ob die Gliederung steht oder nicht, ändert am
//    ORT der Liste nichts mehr.
//
// §6.3-UMSTELLUNG, deklariert: die Zeugen dieser Spec heissen seither
// `[data-v3-treffer-spalte]` statt `[data-v3-treffer-blatt]`. Was sie MESSEN,
// ist unverändert Davids Frage — sieht man das Ergebnis, ohne es suchen zu
// müssen, und bewegt sich der Lesetext dabei nicht. Die Breiten-/Höhen-Zusagen
// des Blattes (b) sind ersatzlos weg: die Liste soll den Text jetzt ERSETZEN,
// nicht neben ihm stehen — eine Zusicherung «schmal genug, damit der Text
// daneben sichtbar bleibt» widerspräche dem Auftrag. Was sie schützte (der Text
// darf nicht wegrutschen), prüft (e) unverändert weiter.
// Die Ortsfrage selbst — «in der Lesespalte, nicht in der Gliederung» — trägt
// `leser-d38-treffer-lesespalte.e2e.ts`; hier steht sie nur als Vorbedingung.
//
// WARUM IM BROWSER: geprüft werden Rechtecke gegen den Viewport, eine gerechnete
// Breiten-Weiche (ResizeObserver auf der Pane-Wurzel) und Stapelung. Nichts davon
// sieht ein Unit-Test — «im DOM und isVisible()» war beim Prod-Stand ja wahr.
//
// ROT ZU BEKOMMEN (§6.7): in `LeserRahmenV3.tsx` den Prop `trefferSpalte={…}`
// an der `<LeserLeseZeile>` weglassen. Dann ist die Liste nirgends mehr — (a),
// (c) und (f) finden sie nicht. Umgekehrt bringt ein Wiederherstellen des
// Inline-Zweigs von damals (a) und (e) zu Fall, weil das Listen-Rechteck dann
// wieder unter der Falz beginnt und der Satzspiegel wandert.
import { test, expect, type Page } from '@playwright/test'

const BEGRIFF = 'Entschädigung'

async function warteLeser(page: Page): Promise<void> {
  await page.goto('/gesetze/bund/STPO')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('StPO', { timeout: 30000 })
  await expect(page.locator('[data-v3-suchsprung] input').first()).toBeVisible({ timeout: 20000 })
  await page.evaluate(() => document.fonts?.ready)
}

/** Gliederung einklappen — der Zustand, in dem David gesucht hat. */
async function gliederungZu(page: Page): Promise<void> {
  const zu = page.locator('[data-v3-gliederung-zu]')
  await expect(zu, 'kein «Gliederung ausblenden» — Vorbedingung fehlt (§6.7)').toHaveCount(1)
  await zu.click()
  await expect(page.locator('[data-v3-aside]')).toHaveCount(0)
  // POSITIV-Vorbedingung: die Spalte ist weg, das Feld ist trotzdem da (Ä19).
  await expect(page.locator('[data-v3-such-zone] input')).toHaveCount(1)
}

/**
 * Suchen und warten, bis der Begriff durch das Debounce im Modell ist.
 *
 * D38: EIN Zeuge für jede Lage — die Liste steht in jeder Breite und mit wie
 * ohne Spalte über der Lesespalte. Die frühere Oder-Auswahl (Blatt @≥1024,
 * Zähler-Zeile darunter, Liste mit Spalte) ist mit den drei Orten weggefallen.
 */
async function suche(page: Page, wort = BEGRIFF): Promise<void> {
  const feld = page.locator('[data-v3-suchsprung] input').first()
  await feld.click()
  await feld.fill(wort)
  await expect(page.locator('[data-treffer-liste]').first()).toBeVisible({ timeout: 20000 })
}

/**
 * Liegt das Rechteck VOLLSTÄNDIG im Viewport? Genau das war beim Prod-Stand
 * falsch, während `isVisible()` true meldete.
 *
 * GEMESSEN WIRD DER SCROLLER, NICHT DIE LISTE. Die Liste ist darin mehrere
 * tausend Pixel hoch (StPO, «Entschädigung»), weil sie SCROLLT; die
 * Zusicherung wäre nur erfüllbar, wenn jede Trefferzeile gleichzeitig im Bild
 * stünde. Die Frage, die Davids Befund stellt, lautet: sieht man das Ergebnis,
 * ohne suchen zu müssen — also ist die FLÄCHE im Bild und steht oben drin
 * etwas Lesbares.
 */
async function imViewport(page: Page, wahl: string): Promise<{ drin: boolean; box: unknown }> {
  return page.locator(wahl).first().evaluate((el) => {
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight
    const vw = window.innerWidth
    return {
      drin: r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw && r.width > 0 && r.height > 0,
      box: { t: Math.round(r.top), l: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), vh, vw },
    }
  })
}

for (const breite of [1024, 1440]) {
  test(`(a) @${breite}: eingeklappte Gliederung — Trefferliste sichtbar UND vollständig im Viewport`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 900 })
    await warteLeser(page)
    await gliederungZu(page)
    await suche(page)

    const liste = page.locator('[data-treffer-liste]')
    await expect(liste, 'Trefferliste fehlt ganz').toHaveCount(1)
    await expect(liste).toBeVisible()

    // DER KERN DES BEFUNDS: nicht «im DOM», sondern «im Bild». Beim Prod-Stand
    // begann das Rechteck bei y = 755 und war 3596 px hoch — es begann also
    // unterhalb der Falz. Gemessen wird der SCROLLER, auf dem die Liste liegt.
    //
    // ── ZWEI ZUSTÄNDE, WEIL `position: sticky` ZWEI HAT (gemessen 7.9.2026) ──
    // Die Fläche klebt am selben Anschlag wie die Gliederungs-Spalte und
    // rechnet ihren Höhen-Deckel aus demselben Ausdruck
    // (`calc(100vh - var(--nt-stick) - 1.5rem)`, §5 — eine Geometrie für beide
    // Spuren). Bei scrollY 0 ist sie aber noch NICHT geklebt: sie beginnt am
    // Kopf der Lese-Zelle (y = 218 statt 166) und ragt damit um genau diese
    // 52 px, gedeckelt sichtbar als 28 px, unter die Falz. Das ist keine
    // Eigenheit von D38 — die Gliederungs-Spalte tut seit je dasselbe, und ein
    // zweiter Höhen-Ausdruck nur für diese Fläche wäre die zweite
    // Geometrie-Quelle, die LM-003 verbietet.
    // GEPRÜFT WIRD DARUM BEIDES, statt einen Zustand wegzudefinieren (§8):
    //  · UNGEKLEBT (scrollY 0): der KOPF der Fläche steht im oberen Drittel des
    //    Bildes und die erste Trefferzeile ganz darin — genau das, was beim
    //    Prod-Stand (y = 755 von 900) falsch war.
    //  · GEKLEBT (nach einem Stück Scrollen): die Fläche passt vollständig.
    const ungeklebt = await imViewport(page, '[data-v3-treffer-spalte-scroller]')
    const kopfY = (ungeklebt.box as { t: number; vh: number })
    expect(kopfY.t, `Treffer-Fläche beginnt unter der Falz: ${JSON.stringify(ungeklebt.box)}`)
      .toBeLessThan(kopfY.vh / 3)
    expect(kopfY.t, `Treffer-Fläche über dem Fensterrand: ${JSON.stringify(ungeklebt.box)}`)
      .toBeGreaterThanOrEqual(0)

    // Und darin steht wirklich etwas Lesbares: die erste Trefferzeile liegt
    // ebenfalls ganz im Bild. Ohne diese zweite Sonde wäre eine leere,
    // korrekt platzierte Fläche grün (§6.7).
    const ersteZeile = await imViewport(page, '[data-v3-treffer-spalte] [data-treffer-artikel]')
    expect(ersteZeile.drin, `erste Trefferzeile nicht im Bild: ${JSON.stringify(ersteZeile.box)}`).toBe(true)

    // Und im geklebten Zustand passt die ganze Fläche.
    await page.evaluate(() => window.scrollTo(0, 600))
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(100)
    const { drin, box } = await imViewport(page, '[data-v3-treffer-spalte-scroller]')
    expect(drin, `geklebte Treffer-Fläche nicht vollständig im Viewport: ${JSON.stringify(box)}`).toBe(true)

    // ── Ä78 / V5 (17.8.2026), fortgeschrieben mit D38 · DER ZÄHLER STEHT
    //    GENAU EINMAL ────────────────────────────────────────────────────────
    // Befund des Ästhetik-Reviews: bei offener Liste sagte die Zeile am Feld
    // «N Artikel · M Fundstellen · Treffer anzeigen →» — und zwei Zentimeter
    // darunter sagte der Listenkopf dasselbe. Der Weg war zudem schon gegangen:
    // ein Knopf, der eine offene Liste öffnet. Geprüft in BEIDE Richtungen
    // (sonst wäre «weg» auch mit kaputter Suche grün): solange die Liste steht,
    // schweigt die Zeile und die Zahlen stehen in der Liste; nach ↵ ist sie
    // wieder da und nennt dieselben Zahlen (§5).
    // ROT ZU BEKOMMEN (§6.7): in `LeserRahmenV3.tsx` `listeSteht: trefferSteht`
    // auf `false` setzen ⇒ beide Zähler stehen gleichzeitig.
    await expect(page.locator('[data-v3-treffer-weg]'),
      'Zähler-Zeile steht neben der offenen Liste — der Zähler doppelt').toHaveCount(0)
    const inListe = (await liste.innerText()).replace(/\s+/g, ' ')
    expect(inListe, `Listenkopf ohne Artikel-Zahl: ${inListe}`).toMatch(/\d+ (Artikel|Paragraphen)/)
    expect(inListe, `Listenkopf ohne Fundstellen-Zahl: ${inListe}`).toMatch(/\d+ Fundstellen?/)

    // Liste weg ⇒ die Zeile kommt zurück, mit denselben Zahlen und dem Weg hinein.
    await page.locator('[data-v3-suchsprung] input').first().press('Enter')
    const weg = page.locator('[data-v3-treffer-weg]')
    await expect(weg).toBeVisible()
    const zaehler = (await weg.innerText()).replace(/\s+/g, ' ')
    expect(zaehler, `Zähler ohne Artikel-Zahl: ${zaehler}`).toMatch(/\d+ (Artikel|Paragraphen)/)
    expect(zaehler, `Zähler ohne Fundstellen-Zahl: ${zaehler}`).toMatch(/\d+ Fundstellen?/)
    expect(zaehler, `Weg zur Liste fehlt: ${zaehler}`).toContain('Treffer anzeigen')
  })
}

test('(c) Klick auf einen Treffer springt — und gibt den Text frei', async ({ page }) => {
  // §6.3-UMSTELLUNG (D38): bis 7.9.2026 verlangte dieser Fall das GEGENTEIL —
  // «das Blatt bleibt offen, sonst müsste man für jeden zweiten Treffer neu
  // suchen». Die Begründung galt, solange die Liste NEBEN dem Text lag. Über
  // dem Text darf sie nicht stehenbleiben: der Sprung führt in den Wortlaut,
  // und eine Liste, die ihn danach weiter verdeckt, hätte den Sprung umsonst
  // gemacht. Der Einwand von damals bleibt beantwortet: die Suche und der
  // Begriff bleiben stehen, die Zähler-Zeile am Feld führt mit «Treffer
  // anzeigen →» in einem Klick zurück, und ‹ › schreiten durch die Fundstellen,
  // ohne die Liste überhaupt zu brauchen.
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)
  await gliederungZu(page)
  await suche(page)

  const spalte = page.locator('[data-v3-treffer-spalte]')
  const erster = spalte.locator('[data-treffer-artikel]').first()
  await expect(erster, 'kein Treffer zum Klicken — Vorbedingung fehlt (§6.7)').toHaveCount(1)

  const vorher = await page.evaluate(() => window.scrollY)
  await erster.locator('button, a').first().click()
  // Der Sprung ist der Zweck: die Seite bewegt sich.
  await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 10000 })
    .not.toBe(vorher)
  // Und der Wortlaut ist frei — sonst wäre der Sprung ins Verdeckte gegangen.
  await expect(spalte).toHaveCount(0)
  await expect(page.locator('[data-v3-suchsprung] input').first()).toHaveValue(BEGRIFF)
  await expect(page.locator('[data-v3-treffer-weg]'), 'kein Weg zurück zur Liste').toBeVisible()
})

test('(d) Esc schliesst ohne Sprung — der gelesene Text bleibt exakt stehen', async ({ page }) => {
  // ── WAS «KEIN SPRUNG» HIER HEISST, und warum nicht `scrollY` ────────────────
  // GEMESSEN beim ersten Lauf dieser Fassung: nach Esc stand `scrollY` auf 876
  // statt 900 — genau **24 px** weniger. Das ist kein Defekt, sondern die
  // Gegenbewegung: die Such-Zone im klebenden Kopf schrumpft beim Leeren von
  // `SUCH_H_AKTIV` (4.25 rem) auf `SUCH_H_RUHE` (2.75 rem), also um exakt diese
  // 24 px (`v3/SuchZone.tsx`, B9). Alles darunter rückt 24 px hoch, und Chromes
  // Scroll-Anchoring zieht `scrollY` um dieselben 24 px nach — damit der Leser
  // NICHTS wandern sieht. Gemessen wird darum die Lage eines Artikels IM BILD.
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)
  await gliederungZu(page)
  await suche(page)
  await expect(page.locator('[data-v3-treffer-spalte]')).toBeVisible()

  // Erst ein Stück lesen, damit «kein Sprung» überhaupt etwas behauptet: bei
  // scrollY 0 wäre die Zusicherung trivial erfüllt (§6.7).
  await page.evaluate(() => window.scrollTo(0, 900))
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(100)

  // Ein Artikel, der gerade im Bild steht, ist der Zeuge.
  const zeuge = page.locator('#lc-lesespalte [id^="art-"]').first()
  const lage = () => zeuge.evaluate((el) => Math.round(el.getBoundingClientRect().top))
  const vorher = await lage()

  await page.locator('[data-v3-suchsprung] input').first().press('Escape')
  // Esc IM FELD ist Pos. 14: leeren, nicht springen. Damit endet die Suche und
  // die Liste ist weg.
  await expect(page.locator('[data-v3-treffer-spalte]')).toHaveCount(0)
  await expect(page.locator('[data-v3-suchsprung] input').first()).toHaveValue('')
  const nachher = await lage()
  expect(
    Math.abs(nachher - vorher),
    `Esc hat den Lesetext bewegt: ${vorher} px → ${nachher} px im Bild`,
  ).toBeLessThanOrEqual(2)

  // Der zweite Weg heraus: ↵ nimmt NUR die Liste, die Suche bleibt — und
  // «Treffer anzeigen →» holt sie zurück. Beides ohne Positionsverlust.
  await suche(page)
  await expect(page.locator('[data-v3-treffer-spalte]')).toBeVisible()
  const vorher2 = await lage()
  await page.locator('[data-v3-suchsprung] input').first().press('Escape')
  await expect(page.locator('[data-v3-treffer-spalte]')).toHaveCount(0)
  expect(Math.abs(await lage() - vorher2), 'Esc hat gescrollt').toBeLessThanOrEqual(2)
})

test('(e) das Öffnen verschiebt den Lesetext um 0 px — darum eine Ebene und keine aufziehende Spalte', async ({ page }) => {
  // Das ist die MESSUNG, die die Alternative ausgeschlossen hat: «Spalte beim
  // Suchen aufziehen» hätte den Satzspiegel @1440 um 126 px seitwärts bewegt.
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)
  await gliederungZu(page)

  const kasten = () => page.locator('#lc-lesespalte').evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { x: Math.round(r.left + window.scrollX), w: Math.round(r.width) }
  })
  const vorher = await kasten()
  await suche(page)
  await expect(page.locator('[data-v3-treffer-spalte]')).toBeVisible()
  const nachher = await kasten()
  expect(nachher, `Satzspiegel verschoben: ${JSON.stringify(vorher)} → ${JSON.stringify(nachher)}`)
    .toEqual(vorher)
})

test('(f) mit STEHENDER Spalte gibt es genau eine Liste — und sie steht nicht in der Gliederung', async ({ page }) => {
  // Die Kehrseite von (a): die Liste hat EINEN Ort, nicht zwei nebeneinander.
  // Zwei Listen gleichzeitig wären die Doppelwahrheit, die schon vor D38
  // ausgeschlossen war (§5) — nur stand die eine damals in der Gliederung.
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)
  await suche(page)

  await expect(page.locator('[data-v3-aside]')).toHaveCount(1)
  await expect(page.locator('[data-treffer-liste]')).toHaveCount(1)
  await expect(page.locator('[data-v3-aside] [data-treffer-liste]')).toHaveCount(0)
  await expect(page.locator('[data-v3-treffer-spalte] [data-treffer-liste]')).toHaveCount(1)
})

test('(g) Split-Pane: jedes Pane trägt seine Liste über der eigenen Lesespalte', async ({ page }) => {
  // Im Split @1600 misst jedes Pane rund 590 px und unterschreitet die
  // xl-Schwelle. Vor D38 entschied genau diese Schwelle zwischen Blatt und
  // Bottom-Sheet; seither gibt es keine Weiche mehr — die Liste liegt in jeder
  // Breite über der Lesespalte DES EIGENEN Panes. Geprüft wird darum, dass die
  // Suche im primären Pane das sekundäre nicht anfasst.
  test.slow() // zwei volle Leser-Instanzen
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto('/gesetze/bund/STPO?leser=v3&p=/gesetze/bund/BGBM%3Fleser%3Dv3')
  await expect(page.locator('[data-pane="sekundaer"] [data-v3-kopf]')).toBeVisible({ timeout: 30000 })
  // Positiv-Sonde: es gibt wirklich zwei Felder (§6.7).
  await expect(page.locator('[data-v3-suchsprung] input')).toHaveCount(2, { timeout: 20000 })

  const feld = page.locator('[data-pane="primaer"] [data-v3-suchsprung] input')
  await feld.click()
  await feld.fill(BEGRIFF)
  await expect(page.locator('[data-pane="primaer"] [data-v3-treffer-spalte] [data-treffer-liste]'))
    .toBeVisible({ timeout: 20000 })
  await expect(page.locator('[data-pane="sekundaer"] [data-v3-treffer-spalte]'),
    'die Suche im linken Pane hat das rechte verdeckt').toHaveCount(0)
  await expect(page.locator('[data-gliederung-sheet]'),
    'im Split zieht die Suche ein Sheet auf').toHaveCount(0)
})

// ═══ Ä84 (Ästhetik-Prüfer 17.8.2026) · DAS SEGMENT WÄCHST NICHT MIT ═══════════
//
// GEMESSEN am damaligen Stand (StPO, «Entschädigung», chromium): das
// Suchbereich-Segment ist für die 18-rem-Leiste kalibriert (vier kurze Wörter,
// je `flex-1`) und dehnte sich ohne Deckel auf die Breite seines Behälters —
// @720 auf das 2,5-fache. Vier Schalter über 688 px sind keine Werkzeugzeile
// mehr: die Trefferliste darunter bleibt schmal, und das Segment liest sich als
// Reiter-Leiste einer Zone, die es nicht gibt.
//
// D38 ändert den BEHÄLTER (Lesespalte statt Blatt/Sheet), nicht die Zusage: der
// Deckel ist weiterhin nötig, weil die Lesespalte @1440 volle 640 px breit ist.
//
// ROT ZU BEKOMMEN (§6.7): in `v3/SuchBereichWahl.tsx` die Breiten-Klasse
// `w-[min(100%,18rem)]` entfernen ⇒ (h) meldet die volle Behälterbreite.
// So gemessen, bevor der Deckel gebaut wurde.
for (const breite of [390, 720]) {
  test(`(h) @${breite}: das Suchbereich-Segment behält seine Kalibrierung`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 844 })
    await warteLeser(page)
    await suche(page)
    // POSITIV-Vorbedingung: es ist wirklich die TREFFERLISTE über der
    // Lesespalte — sonst prüfte alles Weitere den falschen Zustand (§6.7).
    const flaeche = page.locator('[data-v3-treffer-spalte]')
    await expect(flaeche.locator('[data-treffer-liste]')).toHaveCount(1)

    const befund = await page.evaluate(() => {
      const seg = document.querySelector('[data-v3-treffer-spalte] [data-v3-suchbereich]') as HTMLElement | null
      const scroller = document.querySelector('[data-v3-treffer-spalte-scroller]') as HTMLElement | null
      return {
        segBreite: seg ? Math.round(seg.getBoundingClientRect().width) : null,
        segEltern: seg?.parentElement ? Math.round(seg.parentElement.getBoundingClientRect().width) : null,
        ueberlauf: scroller ? scroller.scrollWidth - scroller.clientWidth : 0,
      }
    })

    expect(befund.segBreite, 'Suchbereich-Segment nicht gefunden').not.toBeNull()
    // 18 rem = 288 px; die 1-px-Toleranz fängt das Sub-Pixel-Runden.
    expect(befund.segBreite!,
      `Segment ${befund.segBreite} px in ${befund.segEltern} px Behälter`).toBeLessThanOrEqual(289)
    // Und es schrumpft mit, wo weniger Platz ist — sonst risse es die Fläche auf.
    expect(befund.segBreite!).toBeLessThanOrEqual((befund.segEltern ?? 0) + 1)
    expect(befund.ueberlauf, 'die Treffer-Fläche scrollt waagrecht').toBeLessThanOrEqual(1)
  })
}
