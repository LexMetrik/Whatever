// @shard-gruppe: 2
// ─── QS-BASIS · Hydration statt Ersetzen (15.9.2026) ────────────────────────
//
// NEUER WÄCHTER (§6.3-Deklaration: neue Prüfung zu neuem Verhalten). Seit
// QS-BASIS startet `main.tsx` die prerenderten App-Routen mit `hydrateRoot`
// statt `createRoot`; welche Seite das ist, sagt der Marker `data-prerender`,
// den `scripts/prerender.ts` an den #root-Container schreibt.
//
// GEMESSEN (Lighthouse-Mobil, 4× CPU + langsames 4G, Median aus 3, dasselbe
// Preset wie `check:perf-lighthouse`): Startseite LCP 9.20 s → 4.21 s,
// Score 66 → 77. Die nicht hydrierten Kontrollseiten (`/gesetze/bund/OR`,
// `/gesetze/kanton/SO-614.11`) bleiben unverändert — der Gewinn hängt also an
// dieser Änderung und nicht am Messtag.
//
// WAS HIER GEPRÜFT WIRD, UND WARUM GENAU DAS:
//  (1) Der prerenderte HÜLLEN-DOM bleibt STEHEN. Geprüft an der
//      ELEMENT-IDENTITÄT (JS-Eigenschaft auf dem Knoten, die React nie
//      anfasst und ein neu erzeugter Knoten unmöglich tragen kann) — nicht an
//      der Optik, die bei render-then-replace genauso aussähe.
//  (2) KEIN Markup-Mismatch, in BEIDEN Besucherlagen. Die gefährlichere ist
//      die zweite: wer schon einmal da war, hat Reiter im `localStorage`, und
//      die standen vor dem Pin (`lib/hydration` + `components/layout/useTabs`)
//      im Client-Baum, aber nie im prerenderten HTML. GEMESSEN am Stand OHNE
//      Pin: 64 von 64 markierten Routen mit Mismatch, sobald EIN Reiter
//      gespeichert war; MIT Pin 0 von 64.
//  (3) Der Pin unterschlägt nichts — die Reiter sind nach dem Mount da.
//  (4) Die Leser-Detailseiten werden NICHT hydriert (anderes SEO-Markup aus
//      `lib/seo-detail`; dort wäre ein Mismatch Normtext-Verlust, Bauregel 5).
//
//  (5) DER ROUTEN-INHALT ÜBERLEBT EBENFALLS, die `<h1>` eingeschlossen
//      (QS-BASIS-Nachzug, 15.9.2026). Er hängt hinter der `<Suspense>`-Grenze
//      von `RouteHuelle`, und `React.lazy` suspendiert auch bei längst
//      geladenem Modul — ein suspendierter Teilbaum ist nicht hydrierbar.
//      Seither wärmt `main.tsx` den Chunk der aktuellen Route VOR
//      `hydrateRoot` vor (`routesManifest.vorwaermenFuerPfad`), und
//      `lazyRetry` rendert eine vorgewärmte Seite synchron. GEMESSEN auf `/`:
//      101 von 449 Knoten vorher, 449 von 450 nachher.
//  (6) DER TAG NACH DEM BAU ist ein eigener Fall, und zwar der häufigere:
//      der Prerender kennt weder das Datum noch den Speicher des Besuchers.
//      Zugesichert wird hier, dass (a) die Datumszeile und das Fristende des
//      Schnellrechners den Wert des BESUCHERS tragen (nie den des Baus —
//      genau das ging beim ersten Anlauf schief, s. `start/Begruessung.tsx`)
//      und (b) der unvermeidliche Mismatch im Pult-Modul EINGEGRENZT bleibt:
//      Hülle und `<h1>` überleben ihn. GEMESSEN: 102 von 450 Knoten ohne die
//      Modul-Grenze in `start/PultModul`, 377 von 450 mit ihr.
//  (7) JEDE prerenderte Route findet ihren Loader. Der Sweep unten ist der
//      Drift-Wächter über die zwei Tabellen in `routesManifest` — eine neue
//      prerenderte Route, die dort fehlt, wird nicht vorgewärmt und verlöre
//      still ihren Routen-Inhalt an einen Ersatz-Render.
//
// ROT-PROBEN (§6.7, ausgeführt 15.9.2026, jede Mutation einzeln gebaut und
// gefahren) — Ergebnisse im PR-Text.
import { test, expect, type Page } from '@playwright/test'
import { appGebootet } from './helpers/appGebootet'
import { prerenderRouten } from '../src/lib/seo'

type Stand = {
  modus: 'hydration' | 'client'
  vorwaermung: 'getroffen' | 'unbekannt' | 'gescheitert' | 'entfaellt'
  fehler: number
  meldungen: string[]
}
const stand = (page: Page) =>
  page.evaluate(() => (window as unknown as { __lexmetrikHydration: Stand }).__lexmetrikHydration)

/** Ein Reiter im Speicher = die Lage eines Besuchers, der schon einmal da war. */
async function alsWiederkehrer(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('lexmetrik-tabs', JSON.stringify([
        { path: '/gesetze/bund/OR', label: 'Obligationenrecht' },
        { path: '/vorlagen/nda' },
      ]))
    } catch { /* privater Modus — dann eben ohne */ }
  })
}

test('Startseite: die prerenderten Hüllen-Knoten ÜBERLEBEN den Start (Hydration, kein Ersatz)', async ({ page }) => {
  // Das Bundle wird angehalten, bis die prerenderten Knoten markiert sind.
  // Ohne dieses Tor wäre nicht unterscheidbar, ob ein Knoten überlebt hat oder
  // gerade erst entstanden ist.
  let freigeben: () => void = () => {}
  const tor = new Promise<void>((auf) => { freigeben = auf })
  await page.route(/\/assets\/.*\.js(\?.*)?$/, async (route) => {
    await tor
    await route.continue()
  })
  await page.goto('/', { waitUntil: 'commit' })
  await page.waitForSelector('#root a[href="#inhalt"]', { state: 'attached' })

  const vorher = await page.evaluate(() => {
    const knoten = [
      document.querySelector('#root a[href="#inhalt"]'),
      document.querySelector('#root footer'),
      document.querySelector('#root h1'),
    ]
    knoten.forEach((k, i) => { if (k) (k as unknown as { __vor?: number }).__vor = i })
    return { skip: !!knoten[0], fuss: !!knoten[1], ueberschrift: knoten[2]?.textContent ?? null }
  })
  expect(vorher.skip && vorher.fuss, 'Skip-Link und Fuss stehen schon OHNE JavaScript im HTML').toBe(true)
  expect(vorher.ueberschrift, 'und die <h1> ebenfalls').toBeTruthy()

  freigeben()
  await appGebootet(page)

  const nachher = await page.evaluate(() => {
    const el = (s: string) => document.querySelector(`#root ${s}`) as unknown as
      { __vor?: number; textContent: string | null } | null
    const skip = el('a[href="#inhalt"]')
    const fuss = el('footer')
    return {
      skipUeberlebt: skip?.__vor === 0,
      fussUeberlebt: fuss?.__vor === 1,
      ueberschriftUeberlebt: el('h1')?.__vor === 2,
      ueberschriftText: el('h1')?.textContent ?? null,
      vonReactGefuehrt: !!skip && Object.keys(skip).some((k) => k.startsWith('__reactFiber$')),
    }
  })

  expect(nachher.skipUeberlebt, 'der Skip-Link ist noch DERSELBE DOM-Knoten wie vor dem Bundle').toBe(true)
  expect(nachher.fussUeberlebt, 'der Fuss ebenso — die Hülle wurde hydriert, nicht ersetzt').toBe(true)
  expect(nachher.vonReactGefuehrt, 'React führt sie jetzt (die Hydration hat committet)').toBe(true)
  // DIE ÜBERSCHRIFT AUCH, und das ist der Punkt von (5): sie ist das
  // LCP-Element. Geprüft an der IDENTITÄT, nicht am Wortlaut — ein
  // zeichengleich neu erzeugter Knoten bestünde einen Textvergleich und wäre
  // trotzdem ein Neuanstrich.
  expect(nachher.ueberschriftUeberlebt,
    'die <h1> ist noch DERSELBE Knoten — der Routen-Chunk war vor dem Hydrieren da').toBe(true)
  expect(nachher.ueberschriftText, 'und trägt unverändert denselben Wortlaut').toBe(vorher.ueberschrift)

  const s = await stand(page)
  expect(s.modus).toBe('hydration')
  expect(s.vorwaermung, 'der Loader der Startseite wurde gefunden und abgewartet').toBe('getroffen')
  expect(s.fehler, `Hydrations-Mismatch: ${s.meldungen.join(' | ')}`).toBe(0)
})

test('Startseite als Wiederkehrer (Reiter im Speicher): weiterhin 0 Mismatches, Reiter erscheinen', async ({ page }) => {
  await alsWiederkehrer(page)
  await page.goto('/')
  await appGebootet(page)

  const s = await stand(page)
  expect(s.modus).toBe('hydration')
  expect(s.fehler, `Hydrations-Mismatch: ${s.meldungen.join(' | ')}`).toBe(0)

  // Der Pin darf den Inhalt nur VERZÖGERN, nie unterschlagen (§15/Logikverlust):
  // die gespeicherten Reiter stehen nach dem Mount-Effect in der Leiste.
  await expect(page.getByRole('button', { name: 'Reiter «OR» schliessen' })).toBeVisible()
})

test('Startseite: Skip-Link und Tastatur arbeiten auf dem hydrierten Baum', async ({ page }) => {
  await page.goto('/')
  await appGebootet(page)

  await page.keyboard.press('Tab')
  const skip = page.locator('#root a[href="#inhalt"]')
  await expect(skip, 'erster Tab-Stopp ist der Skip-Link').toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#inhalt')).toBeVisible()

  // Der Wächter bleibt auch nach der Tastatur-Runde bei 0 (kein Nach-Mismatch).
  expect((await stand(page)).fehler).toBe(0)
})

test('Leser-Detailseite bleibt bewusst beim Client-Render (anderes SEO-Markup)', async ({ page }) => {
  // Gegenprobe zur Marker-Logik: `/gesetze/:ebene/:key` wird aus `lib/seo-detail`
  // geschrieben, NICHT aus der App — dort darf nie hydriert werden, sonst wäre
  // der Volltext Gegenstand eines Mismatches (perf-Bauregel 5).
  await page.goto('/gesetze/bund/BGFA')
  await appGebootet(page)
  const s = await stand(page)
  expect(s.modus, 'Detailseiten tragen den Prerender-Marker nicht').toBe('client')
  expect(s.fehler).toBe(0)
})

test('Der Tag NACH dem Bau: Datum und Fristende kommen vom Gerät, der Mismatch bleibt im Modul', async ({ page }) => {
  // DIE HÄUFIGERE LAGE, und bis zum Nachzug die kaputte. Ein Prerender kann das
  // Datum des Besuchers nicht kennen; das prerenderte HTML der Startseite trägt
  // darum zwangsläufig ANDERE Zahlen als sein Gerät, sobald er nicht am Bautag
  // kommt. Zwei Dinge dürfen daraus NICHT folgen:
  //   (a) dass er das Baudatum zu sehen bekommt (`suppressHydrationWarning`
  //       hätte genau das getan — React lässt den Server-Text stehen), und
  //   (b) dass die ganze Route neu gebaut wird und die <h1> mitnimmt.
  // Die Uhr steht auf einem festen, weit entfernten Tag, damit der Fall
  // unabhängig vom Bautag deterministisch ist (§2).
  const TAG = new Date('2027-03-04T08:30:00')
  await page.clock.install({ time: TAG })

  let freigeben: () => void = () => {}
  const tor = new Promise<void>((auf) => { freigeben = auf })
  await page.route(/\/assets\/.*\.js(\?.*)?$/, async (route) => { await tor; await route.continue() })
  await page.goto('/', { waitUntil: 'commit' })
  await page.waitForSelector('#root footer', { state: 'attached' })
  const vorher = await page.evaluate(() => {
    const h1 = document.querySelector('#root h1')
    if (h1) (h1 as unknown as { __vor?: boolean }).__vor = true
    return {
      // Das prerenderte Fristende des Schnellrechners — gerechnet ab dem
      // BAU-Tag, also nicht das, was der Besucher sehen darf.
      fristende: [...document.querySelectorAll('#root p')]
        .map((e) => e.textContent).find((t) => /^\d{2}\.\d{2}\.\d{4}$/.test(t ?? '')) ?? null,
    }
  })
  freigeben()
  await appGebootet(page)

  // (a) Die Datumszeile trägt den Tag des GERÄTS, vollständig ausgeschrieben.
  await expect(page.locator('main h1').first().locator('..').locator('p').first())
    .toHaveText('Donnerstag, 4. März 2027 · 08:30')
  // … und das Fristende ist neu gerechnet: 10 Tage ab dem 4.3.2027 endeten am
  // Sonntag, 14.3., und verschieben sich darum auf Montag, den 15.3.2027
  // (ZPO-Gerichtsferien greifen im März nicht). Jedenfalls NICHT mehr der
  // prerenderte Wert.
  const nachher = await page.evaluate(() => ({
    fristende: [...document.querySelectorAll('#root p')]
      .map((e) => e.textContent).find((t) => /^\d{2}\.\d{2}\.\d{4}$/.test(t ?? '')) ?? null,
    h1Ueberlebt: (document.querySelector('#root h1') as unknown as { __vor?: boolean } | null)?.__vor === true,
  }))
  expect(nachher.fristende, 'das Fristende rechnet ab dem Tag des Besuchers').toBe('15.03.2027')
  expect(nachher.fristende, 'und ist nicht das prerenderte').not.toBe(vorher.fristende)

  // (b) Eingegrenzt: die <h1> (das LCP-Element) überlebt den Modul-Mismatch.
  expect(nachher.h1Ueberlebt,
    'die <h1> ist derselbe Knoten — der Rückbau endete an der Modul-Grenze in start/PultModul').toBe(true)

  const s = await stand(page)
  expect(s.modus).toBe('hydration')
  expect(s.vorwaermung).toBe('getroffen')
  // Genau EIN gemeldeter Rückbau, und zwar der erwartete: das Pult-Modul mit
  // dem ab HEUTE rechnenden Schnellrechner. Mehr wäre eine neue, unbeaufsichtigte
  // Divergenz-Quelle — dieser Zähler ist der Wächter darüber.
  expect(s.fehler, `gemeldete Rückbauten: ${s.meldungen.join(' | ')}`).toBe(1)
})

test('Jede prerenderte Route findet ihren Loader (Drift-Wächter über routesManifest)', async ({ page }) => {
  // §5-Wächter: `main.tsx` schlägt den Seiten-Chunk der aktuellen Route in
  // STATISCHE_SEITENROUTEN + ROUTEN_MANIFEST nach. Fehlt eine prerenderte Route
  // dort, meldet der Stand `unbekannt` — die Seite hydriert dann zwar noch ihre
  // Hülle, verliert aber ihren Routen-Inhalt an einen Ersatz-Render, und zwar
  // LAUTLOS. Der Sweep fragt bewusst nur diese eine, billige Auskunft ab.
  test.setTimeout(180_000)
  const routen = prerenderRouten()
  expect(routen.length, 'der Sweep deckt alle prerenderten Routen ab').toBe(64)
  const fehlend: string[] = []
  for (const pfad of routen) {
    await page.goto(pfad)
    await appGebootet(page)
    const s = await stand(page)
    if (s.modus !== 'hydration' || s.vorwaermung !== 'getroffen') {
      fehlend.push(`${pfad} (modus=${s.modus}, vorwaermung=${s.vorwaermung})`)
    }
  }
  expect(fehlend, `Routen ohne Vorwärmung: ${fehlend.join(' · ')}`).toEqual([])
})
