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
// BEKANNTE GRENZE, bewusst NICHT hier zugesichert (offener Punkt im PR): der
// ROUTEN-INHALT hängt hinter der lazy `<Suspense>`-Grenze von `RouteHuelle`.
// Deren Chunk ist beim Hydrations-Start noch nicht da, React rendert diesen
// Teilbaum darum client-seitig — gemessen auf `/`: 101 von 449 Knoten
// (Kopf, Reiterleiste, Fuss) hydriert, der Rest neu. Der LCP-Gewinn oben tritt
// trotzdem ein. Wer den Rest auch hydrieren will, muss den Routen-Chunk VOR
// `hydrateRoot` auflösen; das ist ein eigener Schritt.
//
// ROT-PROBE (§6.7, ausgeführt 15.9.2026, Mutation einzeln gebaut und
// gefahren): in `main.tsx` die Marker-Abfrage auf `false` — also wieder immer
// `createRoot`. Ergebnis im PR-Text.
import { test, expect, type Page } from '@playwright/test'
import { appGebootet } from './helpers/appGebootet'

type Stand = { modus: 'hydration' | 'client'; fehler: number; meldungen: string[] }
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
      vonReactGefuehrt: !!skip && Object.keys(skip).some((k) => k.startsWith('__reactFiber$')),
      ueberschrift: el('h1')?.textContent ?? null,
    }
  })

  expect(nachher.skipUeberlebt, 'der Skip-Link ist noch DERSELBE DOM-Knoten wie vor dem Bundle').toBe(true)
  expect(nachher.fussUeberlebt, 'der Fuss ebenso — die Hülle wurde hydriert, nicht ersetzt').toBe(true)
  expect(nachher.vonReactGefuehrt, 'React führt sie jetzt (die Hydration hat committet)').toBe(true)
  expect(nachher.ueberschrift, 'und die Überschrift ist wortgleich geblieben').toBe(vorher.ueberschrift)

  const s = await stand(page)
  expect(s.modus).toBe('hydration')
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
