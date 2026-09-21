// @shard-gruppe: 4
// ═══ W2·28-TREFFER-LANDKARTE · L-1/L-2 · DIE VERDRAHTUNG IM BROWSER ══════════
//
// Der Rechenkern (`components/leser/landkarteModell.ts`) und seine zwei Adapter
// sind in `src/tests/leser-landkarte-w228.test.ts` abgedeckt — das ist eine
// reine Datenfrage. NICHT abgedeckt war bis hierher die VERDRAHTUNG: ob der
// Streifen im Leser überhaupt zur richtigen Zeit dasteht, ob seine Marken zu
// der Zahl passen, die der Leser daneben nennt, ob der Schalter beide Anzeigen
// zugleich nimmt und ob ein Klick wirklich an die Stelle führt. Fünf Zusagen:
//
//  (a) RUHE. Vor der ersten Eingabe gibt es keinen Streifen (DESIGN-REGLEMENT
//      Ruhe-Grundsatz: kein Dauer-Element für eine Gelegenheits-Auskunft).
//  (b) MARKEN-ZAHL == TREFFER-ZAHL (DoD des Fahrplans, §5). Gemessen gegen die
//      Zahl, die die Zähler-Zeile SELBST anzeigt — nicht gegen eine im Test
//      nachgerechnete, die wäre die dritte Wahrheit.
//  (c) EIN SCHALTER FÜR BEIDE ANZEIGEN. Aus ⇒ weder Marken noch Hervorhebung;
//      ein ⇒ beides zurück. Die Hervorhebung wird an der Quelle gemessen
//      (`CSS.highlights`), nicht an der Farbe.
//  (d) DER KLICK FÜHRT. Ein Klick weit unten im Streifen bewegt die
//      Leseposition nach unten — und zwar auf die Stelle, die der Streifen
//      an dieser Höhe abbildet.
//  (e) KEINE TREFFER, KEIN STREIFEN. Der Befund, der diesen Spec ausgelöst hat:
//      eine erfolglose Suche liess einen leeren Streifen stehen, während der
//      Abschalter daneben (er hängt an `fundstellen > 0`) längst weg war.
//
// DAZU (f) die GEOMETRIE des Schalters: er muss das WCAG-2.5.8-Mindestmass von
// 24 px erreichen, OHNE die Höhe der Such-Zone zu verändern — die ist über
// `SUCH_H_AKTIV` festgeschrieben und trägt den Sprung-Offset jedes Ankers
// (LM-003). Beide Hälften gehören in DIESELBE Messung, sonst behebt der eine
// Wert den anderen.
//
// BESCHRÄNKUNG AUF DEN GESETZ-LESER (bewusst): der Entscheid-Leser trägt
// dieselben zwei Bauteile (`TrefferLandkarte`, `MarkenSchalter`) und dieselbe
// Bedingungslogik, aber einen eigenen, langsamen Datenpfad — ein zweiter
// Durchlauf über einen langen Entscheid verdoppelte die Laufzeit dieses Specs
// für eine Zusage, die dort auf derselben Mechanik ruht. Seine eigene Hälfte
// (Leseposition in den Erwägungen, Marken-Anker) ist datenseitig abgedeckt:
// `src/tests/leser-landkarte-w228.test.ts`, Block «B3».
//
// ROT ZU BEKOMMEN (§6.7) — je Zusage ein Handgriff, alle am Bau gesehen:
//  (a)/(e) in `v3/LandkarteZone.tsx` die Zeile `if (listeSteht ||
//      m.fundstellen <= 0) return null;` entfernen ⇒ (e) meldet den leeren
//      Streifen bei der erfolglosen Suche.
//  (b) dort `treffer={marken}` gegen `treffer={marken.slice(1)}` tauschen ⇒
//      die Marken-Zahl liegt um eins unter der genannten Bestimmungs-Zahl.
//  (c) in `v3/LandkarteZone.tsx` `m.markenAus` aus der Bedingung nehmen ⇒ der
//      Streifen bleibt trotz abgeschalteter Hervorhebung stehen.
//  (d) in `v3/LandkarteZone.tsx` im `onSprung` den Zweig `m.springeZuTreffer`
//      durch ein leeres `() => {}` ersetzen ⇒ der Klick bewegt nichts.
//  (f) in `src/index.css` bei `.fc-schalter` `min-height: var(--tap-ziel)`
//      streichen ⇒ die gemessene Knopfhöhe fällt auf 23 px (11 px · 1.2 Zeile
//      + 2×4 px Polster + 2 px Strich). Die frühere Fassung dieser Zeile nannte
//      ein `min-h-6` an der Aufrufstelle — das gab es am 21.9.2026 schon nicht
//      mehr (der Baustein trägt das Tap-Ziel seit dem Schalter-Nachzug).
//  (g) in `v3/SuchZone.tsx` am Zähler-Knopf `overflow-hidden whitespace-nowrap`
//      streichen UND die zwei Beschriftungs-Spans wieder durch das feste
//      «Treffer anzeigen →» ersetzen ⇒ der Knopf-Inhalt misst @390 234 px in
//      einem 200-px-Kasten und malt über den Schalter (Rot-Beweis 21.9.2026).
//      Für die S2-Hälfte: den `@layer components`-Block bei `.fc-schalter` in
//      `src/index.css` entfernen ⇒ der Schalter steht wieder auf 13 px/500
//      neben 11 px/400.
//
// ── (g) IST DIE SONDE ZUR SICHTPRÜFUNG VOM 21.9.2026 (§6.7) ─────────────────
// Beide Befunde jenes Tages lagen auf der Zähler-Zeile @390 und KEIN Tor sah
// sie: (a)–(f) messen Zahlen, Zustände und EINE Höhe, nie das Nebeneinander.
// Der Überlauf war zudem INNEN — die drei Kästen der Zeile lagen sauber
// nebeneinander, der Text lief aus seinem eigenen Kasten heraus. Eine Sonde,
// die nur Rechtecke vergleicht, wäre an genau diesem Befund grün geblieben;
// darum misst (g) beides.
import { test, expect, type Page } from '@playwright/test'

const BEGRIFF = 'Kündigung'
const OHNE_TREFFER = 'zzzznichtvorhanden'

async function warteLeser(page: Page): Promise<void> {
  // F2g: die Prüfung misst Geometrie und Bildlage — Übergänge dürfen dabei
  // nicht mitlaufen, sonst misst sie Zwischenstände.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/OR')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000 })
  await expect(page.locator('[data-v3-suchsprung] input').first()).toBeVisible({ timeout: 20000 })
  await page.evaluate(() => document.fonts?.ready)
}

/**
 * Suchen — und die Trefferliste wieder schliessen.
 *
 * Der zweite Schritt ist nicht Bequemlichkeit, sondern die Bedingung selbst:
 * solange die Liste über der Lesespalte steht (D38), schweigt die Zähler-Zeile,
 * und mit ihr ist der Schalter «Hervorhebung» weg. Streifen und Schalter fallen
 * gemeinsam — also steht in dieser Lage auch der Streifen nicht. ↵ springt zur
 * ersten Fundstelle und gibt die Lesespalte frei; das ist derselbe Weg, den der
 * Leser nimmt.
 */
async function sucheUndLies(page: Page, wort = BEGRIFF): Promise<void> {
  const feld = page.locator('[data-v3-suchsprung] input').first()
  await feld.click()
  await feld.fill(wort)
  await expect(page.locator('[data-treffer-liste]').first()).toBeVisible({ timeout: 20000 })
  await feld.press('Enter')
  await expect(page.locator('[data-v3-treffer-spalte]')).toHaveCount(0)
}

/** Die Marken des Streifens: nur sie tragen einen `<title>` AM Rechteck
 *  (die Abschnitts-Bänder tragen ihn an der Gruppe darüber). */
const MARKEN = '[data-treffer-landkarte] svg rect > title'

/** Zahlen aus der Zähler-Zeile — die EINE Quelle, gegen die gemessen wird. */
async function zaehler(page: Page): Promise<{ bestimmungen: number; fundstellen: number }> {
  const text = await page.locator('[data-v3-treffer-weg]').innerText()
  // Tausendertrenner raus (schmales bzw. schmales geschütztes Leerzeichen und
  // der Schweizer Apostroph) — sonst zerfällt «1 146» in zwei Zahlen.
  const zahlen = text.replace(/[\u2009\u202f\u2019\u0027]/g, '').match(/\d+/g) ?? []
  return { bestimmungen: Number(zahlen[0]), fundstellen: Number(zahlen[1]) }
}

/** Anzahl markierter Stellen in der Custom-Highlight-Registry des Dokuments. */
async function hervorhebungen(page: Page): Promise<number> {
  return page.evaluate(() => {
    const reg = (globalThis as { CSS?: { highlights?: Map<string, { size: number }> } }).CSS?.highlights
    if (!reg) return -1
    let n = 0
    for (const h of reg.values()) n += h.size
    return n
  })
}

test('(a) vor der ersten Eingabe steht kein Streifen', async ({ page }) => {
  await warteLeser(page)
  // POSITIV-Vorbedingung (§6.7): das Suchfeld ist da, die Fläche also die
  // richtige — «kein Streifen» wäre sonst trivial wahr.
  await expect(page.locator('[data-v3-suchsprung] input').first()).toHaveCount(1)
  await expect(page.locator('[data-treffer-landkarte]')).toHaveCount(0)
})

test('(b) Suche mit Treffern: der Streifen steht, und seine Marken sind die Treffer', async ({ page }) => {
  await warteLeser(page)
  await sucheUndLies(page)

  const streifen = page.locator('[data-treffer-landkarte]')
  await expect(streifen).toHaveCount(1)
  await expect(streifen).toBeVisible()

  const { bestimmungen, fundstellen } = await zaehler(page)
  expect(bestimmungen, 'keine Treffer — Vorbedingung fehlt (§6.7)').toBeGreaterThan(3)

  // DIE TRAGENDE ZUSICHERUNG: eine Marke je getroffener Bestimmung.
  const marken = await page.locator(MARKEN).count()
  expect(marken, `Marken ${marken} ≠ Bestimmungen ${bestimmungen} der Zähler-Zeile`).toBe(bestimmungen)

  // Der zugängliche Name nennt die Fundstellen-Zahl — der Streifen ist
  // `role="img"`, seine Auskunft muss im Namen stehen (B9: die Bedienung per
  // Tastatur läuft über die Trefferliste, nicht über hundert Tabstopps).
  const name = await streifen.getAttribute('aria-label')
  expect(name, 'der Streifen nennt seine Fundstellen-Zahl nicht').toContain(String(fundstellen))
  // Das SVG selbst ist für Screenreader stumm — sonst läse es tausend Rechtecke vor.
  await expect(streifen.locator('svg')).toHaveAttribute('aria-hidden', 'true')

  // Und der Weg zurück ist da: die Trefferliste bleibt erreichbar (WCAG 2.1.1
  // ist über sie erfüllt, nicht über den Streifen).
  await expect(page.locator('[data-v3-treffer-weg]')).toBeVisible()
})

test('(c) der Schalter nimmt Marken UND Hervorhebung — und gibt beide zurück', async ({ page }) => {
  await warteLeser(page)
  await sucheUndLies(page)

  const schalter = page.locator('[data-treffer-marken-schalter]')
  await expect(schalter).toHaveCount(1)
  await expect(schalter).toHaveAttribute('aria-pressed', 'true')

  // Vorzustand: beides steht.
  expect(await page.locator(MARKEN).count(), 'keine Marken vor dem Schalten').toBeGreaterThan(0)
  const vorher = await hervorhebungen(page)
  expect(vorher, 'keine Hervorhebung vor dem Schalten — Vorbedingung fehlt').toBeGreaterThan(0)

  await schalter.click()
  await expect(schalter).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('[data-treffer-landkarte]'), 'der Streifen bleibt trotz «aus» stehen').toHaveCount(0)
  await expect.poll(() => hervorhebungen(page), { timeout: 10000 })
    .toBe(0)
  // WAS DER SCHALTER NICHT TUT: die Zahlen bleiben stehen. Genommen wird die
  // Farbe, nicht das Ergebnis — darum heisst er «Hervorhebung», nicht «Suche».
  expect((await zaehler(page)).bestimmungen, 'der Schalter hat die Trefferzahl verändert').toBeGreaterThan(3)

  await schalter.click()
  await expect(schalter).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-treffer-landkarte]')).toHaveCount(1)
  await expect.poll(() => page.locator(MARKEN).count(), { timeout: 10000 }).toBeGreaterThan(0)
  await expect.poll(() => hervorhebungen(page), { timeout: 10000 }).toBeGreaterThan(0)
})

test('(d) ein Klick in den Streifen führt an die Stelle im Dokument', async ({ page }) => {
  await warteLeser(page)
  await sucheUndLies(page)

  const streifen = page.locator('[data-treffer-landkarte]')
  const kasten = await streifen.boundingBox()
  expect(kasten, 'der Streifen hat keine Fläche').not.toBeNull()

  // Welcher Artikel steht gerade oben im Bild? Gegen IHN wird gemessen — nicht
  // gegen `scrollY`, damit die Zusage «der Klick führt an die Stelle» und nicht
  // «irgendetwas hat gescrollt» lautet.
  const obenImBild = async () => page.evaluate(() => {
    const arts = Array.from(document.querySelectorAll<HTMLElement>('#lc-lesespalte [id^="art-"]'))
    const sichtbar = arts.find((el) => el.getBoundingClientRect().bottom > 160)
    return sichtbar?.id ?? null
  })
  const vorher = await obenImBild()
  expect(vorher, 'kein Artikel im Bild — Vorbedingung fehlt').not.toBeNull()

  // Weit unten in den Streifen klicken: das ist das Ende des Erlasses, also
  // garantiert ein anderer Artikel als der, bei dem die erste Fundstelle lag.
  await page.mouse.click(kasten!.x + kasten!.width / 2, kasten!.y + kasten!.height * 0.92)
  await expect.poll(obenImBild, { timeout: 15000 }).not.toBe(vorher)

  // Und zwar NACH UNTEN — der Streifen bildet das Dokument massstäblich ab,
  // ein Klick bei 92 % darf nicht an den Anfang führen.
  const gerueckt = await page.evaluate(() => window.scrollY)
  expect(gerueckt, `Klick bei 92 % der Streifenhöhe endete bei scrollY ${gerueckt}`).toBeGreaterThan(1000)
})

test('(e) Suche ohne Treffer: kein Streifen — und kein Schalter, der fehlen könnte', async ({ page }) => {
  await warteLeser(page)
  const feld = page.locator('[data-v3-suchsprung] input').first()
  await feld.click()
  await feld.fill(OHNE_TREFFER)
  // Derselbe Weg wie bei einer erfolgreichen Suche: die Liste erscheint von
  // selbst, ↵ gibt die Lesespalte wieder frei. Ohne diesen Schritt läge der
  // Streifen schon an `listeSteht` — gemessen werden soll aber die ANDERE
  // Bedingung, «keine Fundstellen» (sonst prüfte der Test nicht, was er sagt).
  await expect(page.locator('[data-v3-treffer-spalte]')).toHaveCount(1, { timeout: 20000 })
  // Esc IN der Liste, nicht ↵ im Feld: ↵ ist eine SPRUNG-Geste und läuft ohne
  // Fundstelle ins Leere — die Liste bliebe stehen (gemessen 21.9.2026). Esc in
  // der Liste nimmt sie, ohne die Suche zu verlieren (`LeserTrefferSpalte`).
  await expect(page.locator('[data-treffer-leer]')).toContainText('Kein', { timeout: 20000 })
  await page.locator('[data-v3-treffer-spalte] button').first().focus()
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-v3-treffer-spalte]')).toHaveCount(0)

  // Und erst warten, bis die entprellte Antwort wirklich «0» sagt — sonst misst
  // der Test den Zwischenstand «sucht …» und wäre grundlos grün.
  await expect.poll(async () => (await zaehler(page)).fundstellen, { timeout: 20000 }).toBe(0)

  await expect(page.locator('[data-treffer-landkarte]'),
    'leerer Streifen bei erfolgloser Suche — genau der Befund vom 21.9.2026').toHaveCount(0)
  // Die Gegenprobe zur Regel «Streifen und Schalter fallen gemeinsam»: der
  // Schalter ist hier ebenfalls weg (er hängt an `fundstellen > 0`).
  await expect(page.locator('[data-treffer-marken-schalter]')).toHaveCount(0)
})

test('(f) der Schalter erreicht 24 px — ohne die Höhe der Such-Zone zu verändern', async ({ page }) => {
  await warteLeser(page)
  // Die Zonenhöhe VOR der Suche (Ruhe-Stellung) als Zeuge dafür, dass der
  // gemessene Wert überhaupt von etwas abhängt (§6.7).
  const zone = page.locator('[data-v3-such-zone]')
  const zonenHoehe = () => zone.evaluate((el) => Math.round(el.getBoundingClientRect().height))
  const ruhe = await zonenHoehe()

  await sucheUndLies(page)
  const aktiv = await zonenHoehe()
  expect(aktiv, 'die Zone wächst mit der Suche gar nicht — Messung ohne Aussage').toBeGreaterThan(ruhe)
  // `SUCH_H_AKTIV` = 4.25 rem = 68 px. Die Zahl steht in `v3/SuchZone.tsx` und
  // trägt den Sprung-Offset jedes Ankers; sie darf sich durch ein grösseres
  // Tap-Ziel NICHT verschieben.
  expect(aktiv, `Such-Zone ${aktiv} px statt 68 px (SUCH_H_AKTIV)`).toBe(68)

  const schalter = page.locator('[data-treffer-marken-schalter]')
  const mass = await schalter.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { h: Math.round(r.height), b: Math.round(r.width) }
  })
  expect(mass.h, `Tap-Ziel ${mass.h} px hoch — WCAG 2.5.8 verlangt 24 px`).toBeGreaterThanOrEqual(24)
  expect(mass.b, `Tap-Ziel ${mass.b} px breit`).toBeGreaterThanOrEqual(24)

  // Der Knopf bleibt dabei IN der Zone — ein Tap-Ziel, das unten heraussteht,
  // läge über dem Lesetext.
  const drin = await page.evaluate(() => {
    const k = document.querySelector('[data-treffer-marken-schalter]')?.getBoundingClientRect()
    const z = document.querySelector('[data-v3-such-zone]')?.getBoundingClientRect()
    return k && z ? { unten: Math.round(k.bottom - z.bottom), oben: Math.round(k.top - z.top) } : null
  })
  expect(drin, 'Schalter oder Zone fehlen').not.toBeNull()
  expect(drin!.unten, `der Schalter steht ${drin!.unten} px unter der Zonenkante`).toBeLessThanOrEqual(0)
  expect(drin!.oben, `der Schalter steht ${drin!.oben} px über der Zonenkante`).toBeGreaterThanOrEqual(0)
})

test('(g) @390 ist die Zähler-Zeile lesbar — nichts überlappt, nichts läuft heraus', async ({ page }) => {
  // Die Sichtprüfung lief @390 hell. Der Fall stellt sie nach, nicht eine
  // bequemere Breite: @1440 gab es keinen der beiden Befunde (623 px Zeile,
  // 473 px Inhalt — gemessen 21.9.2026).
  // Schmal von Anfang an, nicht nachträglich verkleinert: die Zone soll auf
  // derselben Breite AUFGEBAUT werden, auf der sie gemessen wird.
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/gesetze/bund/OR')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000 })
  await expect(page.locator('[data-v3-suchsprung] input').first()).toBeVisible({ timeout: 20000 })
  await page.evaluate(() => document.fonts?.ready)
  await sucheUndLies(page)

  const zeile = await page.evaluate(() => {
    const weg = document.querySelector('[data-v3-treffer-weg]') as HTMLElement | null
    if (!weg) return null
    const eltern = weg.parentElement as HTMLElement
    const kasten = (el: Element) => {
      const r = el.getBoundingClientRect()
      return { x: Math.round(r.x), rechts: Math.round(r.right), b: Math.round(r.width), h: Math.round(r.height) }
    }
    const stil = (el: Element) => {
      const cs = getComputedStyle(el)
      return { gr: cs.fontSize, fett: cs.fontWeight }
    }
    return {
      zeile: kasten(eltern),
      kinder: Array.from(eltern.children).map((c) => ({
        name: c.getAttributeNames().find((a) => a.startsWith('data-')) ?? c.tagName.toLowerCase(),
        ...kasten(c), ...stil(c),
      })),
      // Der INNERE Überlauf des Zähler-Knopfs: genau hier lag der Befund.
      knopf: { sichtbar: weg.clientWidth, inhalt: weg.scrollWidth },
      schalterStil: (() => {
        const k = document.querySelector('[data-treffer-marken-schalter]')
        return k ? stil(k) : null
      })(),
    }
  })
  expect(zeile, 'Zähler-Zeile fehlt — Vorbedingung (§6.7)').not.toBeNull()
  // POSITIV-Vorbedingung: die Zeile trägt wirklich alle drei Rollen, sonst wäre
  // «nichts überlappt» trivial wahr.
  expect(zeile!.kinder.length, `nur ${zeile!.kinder.length} Elemente in der Zeile`).toBe(3)

  // 1 · KEIN KIND ÜBERLAPPT EIN ANDERES.
  for (let i = 0; i < zeile!.kinder.length; i++) {
    for (let j = i + 1; j < zeile!.kinder.length; j++) {
      const a = zeile!.kinder[i]; const b = zeile!.kinder[j]
      expect(a.x < b.rechts && b.x < a.rechts,
        `${a.name} [${a.x}…${a.rechts}] überlappt ${b.name} [${b.x}…${b.rechts}]`).toBe(false)
    }
  }

  // 2 · ALLES BLEIBT IN DER ZEILENBREITE.
  for (const k of zeile!.kinder) {
    expect(k.x, `${k.name} beginnt links der Zeile (${k.x} < ${zeile!.zeile.x})`).toBeGreaterThanOrEqual(zeile!.zeile.x)
    expect(k.rechts, `${k.name} endet rechts der Zeile (${k.rechts} > ${zeile!.zeile.rechts})`).toBeLessThanOrEqual(zeile!.zeile.rechts)
  }

  // 3 · DER ZÄHLER LÄUFT NICHT AUS SEINEM EIGENEN KASTEN. Das ist der Befund
  //     selbst: vor dem Fix 234 px Inhalt in 200 px Kasten, und die 34 px
  //     überzähligen Pixel landeten als Text auf dem Schalter daneben.
  expect(zeile!.knopf.inhalt,
    `Zähler-Inhalt ${zeile!.knopf.inhalt} px in ${zeile!.knopf.sichtbar} px Kasten`)
    .toBeLessThanOrEqual(zeile!.knopf.sichtbar)

  // 4 · S2 · DER SCHALTER ORDNET SICH DER ZEILE UNTER. Gemessen gegen den
  //     NACHBARN, nicht gegen eine im Test notierte Zahl — die wäre die zweite
  //     Wahrheit neben der Typo-Skala (§5).
  const zaehlerStil = zeile!.kinder.find((k) => k.name === 'data-v3-treffer-weg')
  expect(zaehlerStil, 'Zähler-Knopf nicht gefunden').toBeTruthy()
  expect(zeile!.schalterStil, 'Schalter nicht gefunden').not.toBeNull()
  expect(zeile!.schalterStil!.gr,
    `Schalter ${zeile!.schalterStil!.gr} gegen Zähler ${zaehlerStil!.gr}`).toBe(zaehlerStil!.gr)
  expect(zeile!.schalterStil!.fett,
    `Schalter-Gewicht ${zeile!.schalterStil!.fett} gegen Zähler ${zaehlerStil!.fett}`).toBe(zaehlerStil!.fett)

  // 5 · DER WEG, DIE HERVORHEBUNG LOSZUWERDEN, IST AUF MOBIL ERREICHBAR.
  //     Der Streifen fällt @390 ohnehin weg (`hidden xl:block`), die FARBE IM
  //     TEXT nicht — ein Schalter, der hier verschwände, nähme dem Leser die
  //     einzige Möglichkeit, sie abzustellen. Geprüft wird nicht «da», sondern
  //     «wirkt»: bedienbares Tap-Ziel UND die Hervorhebung geht wirklich aus.
  const schalter = page.locator('[data-treffer-marken-schalter]')
  await expect(schalter).toBeVisible()
  const mass = await schalter.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { h: Math.round(r.height), b: Math.round(r.width), oben: Math.round(r.top), unten: Math.round(r.bottom) }
  })
  expect(mass.h, `Tap-Ziel @390 nur ${mass.h} px hoch (WCAG 2.5.8: 24 px)`).toBeGreaterThanOrEqual(24)
  expect(mass.b, `Tap-Ziel @390 nur ${mass.b} px breit`).toBeGreaterThanOrEqual(24)
  expect(mass.oben, 'der Schalter steht über dem Fensterrand').toBeGreaterThanOrEqual(0)
  expect(mass.unten, 'der Schalter steht unter der Falz').toBeLessThanOrEqual(844)

  expect(await hervorhebungen(page), 'keine Hervorhebung vor dem Schalten — Vorbedingung fehlt').toBeGreaterThan(0)
  await schalter.click()
  await expect(schalter).toHaveAttribute('aria-pressed', 'false')
  await expect.poll(() => hervorhebungen(page), { timeout: 10000 }).toBe(0)

  // Und die Zone hat sich durch nichts davon bewegt (LM-003).
  const zone = await page.locator('[data-v3-such-zone]').evaluate((el) => Math.round(el.getBoundingClientRect().height))
  expect(zone, `Such-Zone @390 ${zone} px statt 68 px (SUCH_H_AKTIV)`).toBe(68)
})
