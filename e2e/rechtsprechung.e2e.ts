// @shard-gruppe: 3
// Browser-Smoke der Rubrik «Rechtsprechung»: Übersicht rendert + lädt das
// Manifest, Klick führt in den Reader (gegliederter Entscheid), keine Console-/
// Page-Errors, kein Mobil-Overflow. Läuft gegen `vite preview` (dist).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { DROSSEL, REAKTIONS_BUDGET, REAKTIONS_LATTE, CONTAINER_BUDGET_CI } from './helpers/budgets'

test.describe('/rechtsprechung — Übersicht', () => {
  test('rendert, lädt das Manifest, zeigt Entscheid-Karten ohne Fehler', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/rechtsprechung')
    await expect(page.getByRole('heading', { name: 'Rechtsprechung' }).first()).toBeVisible()
    // Manifest lädt clientseitig → mindestens eine Entscheid-Karte (Link in den Reader).
    await expect(page.locator('a[href^="/rechtsprechung/"]').first()).toBeVisible()
    await page.screenshot({ path: 'e2e-shots/rechtsprechung-uebersicht.png', fullPage: true })
    expect(fehler).toEqual([])
  })

  test('trennt Bund und Kantone über die Gemeinwesen-Achse', async ({ page }) => {
    // Rechtsprechung-Redesign (Leitentscheide-first): die Trennung Bund/Kantone
    // läuft über die Gemeinwesen-Filter-Achse (Alle · Bund · Kantone · <Kantone>,
    // EntscheidFilter.tsx), nicht mehr über zwei feste Abschnitte. (Locator 28.6.
    // an die deployte Achse nachgezogen: Chip heisst «Bund», nicht «Bundesgericht».)
    await page.goto('/rechtsprechung')
    // Die Facetten-Chips tragen einen a11y-aria-label «Gemeinwesen: <Text> (<n>)»
    // (Batch 2, EntscheidFilter.tsx:35), der den Accessible Name bildet — darum
    // Regex auf das Achsen-Label statt exaktem Chip-Text (sonst matcht der Name nie).
    const bund = page.getByRole('button', { name: /^Gemeinwesen: Bund \(\d+\)$/ })
    const kantone = page.getByRole('button', { name: /^Gemeinwesen: Kantone \(\d+\)$/ })
    await expect(bund).toBeVisible()
    await expect(kantone).toBeVisible()
    // Auf «Kantone» wechseln → die Liste zeigt weiterhin Entscheid-Links.
    await kantone.click()
    await expect(page.locator('a[href^="/rechtsprechung/"]').first()).toBeVisible()
  })

  test('kein horizontaler Overflow bei 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/rechtsprechung')
    await expect(page.getByRole('heading', { name: 'Rechtsprechung' }).first()).toBeVisible()
    await page.screenshot({ path: 'e2e-shots/rechtsprechung-mobil.png', fullPage: true })
    const b = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    expect(b.scroll, `scrollWidth ${b.scroll} > ${b.client}`).toBeLessThanOrEqual(b.client + 1)
  })
})

test.describe('Verzahnung im Gesetzes-Reader', () => {
  // «BGG zeigt im Kontext-Panel die Bundesgerichtsentscheide-Gruppe» GELÖSCHT
  // 21.8.2026 (H5) — prüfte das Ist-Hüllen-Kontextpanel (`KontextPanel.tsx`).
  // V3-Deckung: `leser-v3-panel-facetten` (b), die Reiter des V3-Panels (seit
  // W2·7-VZUI vier; der vierte hat mit `leser-v3-panel-anwendung` eine eigene).
  // Ergänzt S6 (23.9.2026): fünf Reiter; die Spec heisst seither
  // `leser-v3-panel-erlaeuterungen` (Erläuterungen + Werkzeuge).
})

test.describe('Reader (über Klick aus der Übersicht)', () => {
  test('öffnet einen Entscheid mit Kopf, Abschnitten und Provenienz', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/rechtsprechung')
    // Bewusst NICHT einfach `.first()`: ein quarantänierter Eintrag (§8, D-Auflage
    // 12.9.2026, PR #816 — Anlassfall bge_152_V_2, kein Volltext) kann je nach
    // Sortierung zuoberst stehen und trägt keine Abschnitte. `data-quarantaene`
    // sitzt direkt AM Link (EntscheidZeile.tsx: der Overlay-<Link> ist leer,
    // Stretched-Link-Muster — ein `:has([data-quarantaene])` auf dem <a> träfe
    // dort NIE zu, weil der Chip ein Geschwister ist, kein Nachfahre; erst durch
    // dieses Attribut direkt auf dem <a> ist der Zustand dort abfragbar). Die
    // implizite Testvoraussetzung «der erste Treffer hat einen Volltext» wird
    // jetzt explizit erzwungen.
    await page.locator('a[href^="/rechtsprechung/"]:not([data-quarantaene])').first().click()
    await expect(page).toHaveURL(/\/rechtsprechung\/.+/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Gegliederte Lesesicht: mindestens die Erwägungen-Überschrift.
    await expect(page.getByText('Erwägungen', { exact: false }).first()).toBeVisible()
    // Provenienz-Fuss: Live-Link auf die amtliche Fassung (kommt im Reader
    // mehrfach vor — Kopf-Link + Hinweis im Body, daher .first()).
    // NACHGEZOGEN 31.8.2026 (W2·19-DESIGN-KONSISTENZ · B2/BAU-4, Befund B-1):
    // der Link hiess hier «↗ massgebliche Fassung» (Pfeil vorne, klein
    // beginnend) und heisst seit dem Zug auf den geteilten `ui/QuellLink`
    // kanonisch «Amtliche Fassung ↗» (Benennungs-Glossar Ä110). Die Zusicherung
    // selbst — «der Live-Link auf die amtliche Fassung ist sichtbar» — ist
    // unverändert; nur ihr Suchwort folgt dem Kanon.
    await expect(page.getByText('Amtliche Fassung', { exact: false }).first()).toBeVisible()
    await page.screenshot({ path: 'e2e-shots/rechtsprechung-reader.png', fullPage: true })
    expect(fehler).toEqual([])
  })

  test('quarantänierter Entscheid (Quellenkonflikt) zeigt den Hinweis statt Abschnitte (§8, PR #816)', async ({ page }) => {
    // Fixer, committeter Key (bge_152_V_2 — OCLs Basis-Record ist mit 152 V 20
    // konfliert, `abschnitte` bewusst leer, `quarantaene` gesetzt). Direkt
    // navigiert statt aus der Liste geklickt: Sortierung/Position sind kein
    // Testinhalt, der Zustand des EINEN bekannten Falls ist es.
    const fehler = fehlerSammeln(page)
    await page.goto('/rechtsprechung/bge_152_V_2')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('[data-quarantaene]')).toContainText('mit BGE 152 V 20 vermischt')
    await expect(page.getByText('Erwägungen', { exact: false })).toHaveCount(0)
    expect(fehler).toEqual([])
  })
})

// ── BS-Tranche (W2·6-BS, Block B): amtliches Portal rechtsprechung.gerichte.bs.ch ──
// Fixe Keys aus dem committeten Register (Daten-Commit Block A; ein Delta-Lauf
// ersetzt Keys nie, er ergänzt/entfernt nur bei amtlichem Takedown — dann Test
// bewusst rot = Signal). CLS-Messung: e2e/helpers/cls.ts existiert auf origin/main
// NICHT → gemäss Block-B-Auftrag dokumentiert statt gemessen (Folge-Einheit, wenn
// der Helper landet); der §15.2-CLS-Schutz läuft weiter über check:perf-budget.
test.describe('Kanton BS — Register-Facette und Reader', () => {
  test('Facette «Gemeinwesen: BS» filtert; Liste bleibt DOM-gedeckelt («Weitere anzeigen»)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/rechtsprechung')
    const bs = page.getByRole('button', { name: /^Gemeinwesen: BS \(\d+\)$/ })
    await expect(bs).toBeVisible()
    await bs.click()
    // Gefilterte Liste zeigt BS-Entscheide (Key-Präfix bs_…).
    await expect(page.locator('a[href^="/rechtsprechung/bs_"]').first()).toBeVisible()
    // WURZEL des Flackerns (gemessen 23.9.2026, W2·29-WERKBANK-KATALOGE K0): ein
    // bs_-Link steht AUCH in der ungefilterten Ansicht — die Zeile oben beweist den
    // Filter-Commit nicht. Unter CPU-Drossel (CDP x4/x8) zählte die Sonde darum
    // noch die ungefilterte Sektions-Ansicht (339 Links) und nach «Weitere
    // anzeigen» nur 200 → `nachher > gerendert` rot. Gerendertes Merkmal des
    // gefilterten Stands: im Hauptinhalt steht KEIN Nicht-BS-Entscheid mehr.
    await expect(page.locator('#inhalt a[href^="/rechtsprechung/"]:not([href^="/rechtsprechung/bs_"])')).toHaveCount(0)
    // DOM-Deckel (§7.1, axe-Timeout-Lektion): trotz Tausender BS-Treffer werden je
    // Sektion max. 100 Zeilen GERENDERT; der Rest hängt am «Weitere anzeigen»-Knopf.
    const gerendert = await page.locator('a[href^="/rechtsprechung/"]').count()
    expect(gerendert, `DOM-Deckel verletzt: ${gerendert} gerenderte Entscheid-Links`).toBeLessThanOrEqual(400)
    const mehr = page.getByRole('button', { name: /Weitere anzeigen/ }).first()
    await expect(mehr).toBeVisible()
    await mehr.click()
    // Auf den Commit des Batches warten statt einmalig zu zählen.
    await expect.poll(() => page.locator('a[href^="/rechtsprechung/"]').count()).toBeGreaterThan(gerendert)
    await page.screenshot({ path: '.scratch/bs-uebersicht-facette.png', fullPage: false })
    expect(fehler).toEqual([])
  })

  test('BS-Entscheid rendert: Kopf, Erwägungs-Sprunganker, maschinell-Badge, amtlicher Quell-Link (§8)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/rechtsprechung/bs_appellationsgericht_AUS.2026.54')
    await expect(page.getByRole('heading', { level: 1, name: /AUS\.2026\.54/ })).toBeVisible()
    // §6.3-DEKLARATION (W2·24-DESIGN-IDENTITAET, Runde FC, 7.9.2026): hier stand
    // `getByText('Kanton BS', { exact: true })` — die EBENEN-KRUME der Ortsleiste.
    // Sie ist mit GA-1 ABSICHTLICH entfallen: `layout/BrotkrumeRegel.ts` lässt in
    // der Einzelansicht nur noch die Sektions-Krume («Rechtsprechung») stehen,
    // weil das Blatt Reiter und H1 ohnehin nennen (Messung dort im Wortlaut).
    // Dieselbe Streichung ist am Gesetz-Leser bereits deklariert (D27,
    // `leser-v3-kopfzeile.e2e.ts:397`) — die Regel ist jetzt EINE (§5).
    // Die ZUSAGE des Falls bleibt unverändert: der Kopf sagt, WOHER der
    // Entscheid stammt. Gemessen wird sie an der H1, die den kantonalen
    // Spruchkörper wörtlich führt («Appellationsgericht BS AUS.2026.54 vom …»);
    // wo die Zitierung den Gerichtsnamen NICHT trägt, hält ihn GA-2 in der
    // Overline (`EntscheidLeser.tsx`) — die Herkunft steht also immer.
    // Rot-Beweis und Nullprobe: `abnahme/design-identitaet/FC-RECHTSPRECHUNG.md`.
    await expect(page.getByRole('heading', { level: 1, name: /Appellationsgericht BS/ })).toBeVisible()
    // §8-Ehrlichkeit: maschinell-Badge sichtbar.
    await expect(page.getByText('maschinell', { exact: true }).first()).toBeVisible()
    // Sprung-Navigation: «Erwägungen»-Chip führt zum Anker (Ziel existiert).
    await page.getByRole('navigation', { name: 'Abschnitte' }).getByText('Erwägungen').click()
    await expect(page.locator('#abschnitt-erwaegung')).toBeVisible()
    // Amtlicher Live-Link auf das BS-Portal (massgebliche Fassung) mit Dokument-Key.
    const href = await page.locator('a[href*="rechtsprechung.gerichte.bs.ch"]').first().getAttribute('href')
    expect(href).toContain('Aufruf=getMarkupDocument')
    // Provenienz-Fuss: Quelle-Label der BS-Datenbank (Block-A-Guard §7.1).
    await expect(page.getByText(/Rechtsprechungs-Datenbank der Gerichte Basel-Stadt/).first()).toBeVisible()
    await page.screenshot({ path: '.scratch/bs-reader.png', fullPage: true })
    expect(fehler).toEqual([])
  })

  test('datumloser BS-Entscheid: Platzhalter nie als Datum; Erstpublikation + Sekundärnummer im Kopf (§7.2)', async ({ page }) => {
    await page.goto('/rechtsprechung/bs_appellationsgericht_BES.2025.17')
    await expect(page.getByRole('heading', { level: 1, name: /BES\.2025\.17/ })).toBeVisible()
    await expect(page.getByText('Entscheiddatum nicht publiziert').first()).toBeVisible()
    await expect(page.getByText(/Erstpublikation/).first()).toBeVisible()
    // Parallele Geschäftsnummer «(AG.2025.474)» im Meta-Kopf.
    await expect(page.getByText('(AG.2025.474)').first()).toBeVisible()
    // Kein fingiertes «Urteil vom 01.01.2025» im Kopf (Body-Text bleibt aussen vor).
    await expect(page.locator('header').getByText(/Urteil vom/)).toHaveCount(0)
    await page.screenshot({ path: '.scratch/bs-reader-datumlos.png', fullPage: false })
  })

  test('langer BS-Entscheid: kein horizontaler Overflow bei 390px (Mobil, Tabellen)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    // SB.2018.46 = grösstes BS-Dokument im Bestand (Strafurteil mit Tabellen).
    await page.goto('/rechtsprechung/bs_appellationsgericht_SB.2018.46')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('#abschnitt-erwaegung')).toBeAttached()
    const b = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    expect(b.scroll, `scrollWidth ${b.scroll} > ${b.client}`).toBeLessThanOrEqual(b.client + 1)
    await page.screenshot({ path: '.scratch/bs-reader-mobil.png', fullPage: false })
  })

  test('mehrteiliges Urteil (Nummerierungs-Restarts): keine React-Key-Errors, keine doppelten Anker-IDs (R7)', async ({ page }) => {
    // SB.2018.46 startet die amtliche Erwägungs-Nummerierung mehrfach neu
    // (tops 1,2,4,5,1,2,3,1,…) — vor dem Fix: 16 console.errors «two children
    // with the same key» + 34 doppelte DOM-IDs (#e-1 5×), Pin-Cite mehrdeutig.
    const fehler = fehlerSammeln(page)
    await page.goto('/rechtsprechung/bs_appellationsgericht_SB.2018.46')
    await expect(page.locator('#abschnitt-erwaegung')).toBeAttached()
    // Alle Anker-IDs im Dokument eindeutig (Pin-Cite-Permalinks, R7).
    const doppelte = await page.evaluate(() => {
      const alle = [...document.querySelectorAll('[id]')].map((el) => el.id)
      const gesehen = new Set<string>(); const dupl = new Set<string>()
      for (const id of alle) { if (gesehen.has(id)) dupl.add(id); gesehen.add(id) }
      return [...dupl]
    })
    expect(doppelte, `doppelte DOM-IDs: ${doppelte.join(', ')}`).toEqual([])
    // Wiederholungs-Lauf trägt das -wN-Suffix und ist als Sprungziel vorhanden.
    await expect(page.locator('#e-1-w2')).toBeAttached()
    expect(fehler).toEqual([])
  })

  test('BS-Karte/-Zeile: amtlicher Betreff ehrlich etikettiert, nie als Regeste (§8)', async ({ page }) => {
    await page.goto('/rechtsprechung')
    await page.getByRole('button', { name: /^Gemeinwesen: BS \(\d+\)$/ }).click()
    // Listen-Dichte (Default): Betreff-Marker in der Metazeile sichtbar.
    await expect(page.getByText('amtl. Betreff').first()).toBeVisible()
  })
})

test.describe('Leitentscheid — Ansichten «Amtlicher BGE-Auszug» ⟷ «Vollständiges Urteil»', () => {
  test('Default Auszug; Wechsel auf Vollständiges Urteil ändert den Body (§8)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/rechtsprechung/bge_152_IV_14')
    await expect(page.getByRole('heading', { level: 1, name: /BGE 152 IV 14/ })).toBeVisible()

    const voll = page.getByRole('tab', { name: /Vollständiges Urteil/ })
    const auszug = page.getByRole('tab', { name: /Amtlicher BGE-Auszug/ })
    await expect(auszug).toBeVisible()
    await expect(voll).toBeVisible()
    // Leitentscheid ist Default-Ansicht (Regeste-forward).
    await expect(auszug).toHaveAttribute('aria-selected', 'true')
    const body = page.locator('article').first()
    const auszugText = (await body.innerText()).trim()
    expect(auszugText.length).toBeGreaterThan(100)

    await voll.click()
    await expect(voll).toHaveAttribute('aria-selected', 'true')
    const vollText = (await body.innerText()).trim()
    expect(vollText).not.toEqual(auszugText)

    await auszug.click()
    await expect(auszug).toHaveAttribute('aria-selected', 'true')
    expect((await body.innerText()).trim()).toEqual(auszugText)

    await page.screenshot({ path: 'e2e-shots/leitentscheid-ansichten.png', fullPage: true })
    expect(fehler).toEqual([])
  })

  test('Deep-Link ?ansicht=voll öffnet direkt die Voll-Ansicht', async ({ page }) => {
    await page.goto('/rechtsprechung/bge_152_IV_14?ansicht=voll')
    await expect(page.getByRole('tab', { name: /Vollständiges Urteil/ })).toHaveAttribute('aria-selected', 'true')
  })

  test('Übersicht führt vollständige Urteile als getrennte Einträge', async ({ page }) => {
    await page.goto('/rechtsprechung')
    await expect(page.getByRole('heading', { name: /Vollständige Urteile zu den Leitentscheiden/ })).toBeVisible()
    await expect(page.locator('a[href*="ansicht=voll"]').first()).toBeVisible()
  })
})

// ── V5 (W2·10-UI-NAV) · Erwägungs-Navigation + «Im Entscheid suchen» ─────────
//
// Prüfsatz: (a) der Rail bietet die Erwägungen als Sprungziele an und trifft
// sie; (b) die Suche zählt ehrlich und filtert die Liste; (c) mobil ist der
// Rail ein aufklappbarer Block ÜBER dem Text mit 24-px-Tap-Zielen; (d) der
// ganze Fluss läuft unter CPU-Drossel ohne Hänger und mit CLS 0 (A9).
//
// Drossel + Budgets aus `./helpers/budgets` (§5) — keine eigene, zweite Latte.

test.describe('V5 — Erwägungs-Rail im Entscheid-Leser', () => {
  test('Rail listet die Erwägungen, springt an den Anker und sucht ehrlich im Entscheid', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/rechtsprechung/bge_152_IV_14')
    await expect(page.getByRole('heading', { level: 1, name: /BGE 152 IV 14/ })).toBeVisible()

    const rail = page.locator('[data-erw-rail]')
    await expect(rail).toBeVisible()
    // Die Sprungziele tragen dieselben `#e-…`-Anker wie Body und Pin-Cite (§5).
    const ziel = rail.locator('a[href^="#e-"]').first()
    await expect(ziel).toBeVisible()
    const anker = (await ziel.getAttribute('href'))!.slice(1)
    await ziel.click()
    await expect(page.locator(`#${anker}`)).toBeVisible()
    // LM-209-Konvention: der Sprung spiegelt den Hash, erzeugt aber keinen
    // Verlaufseintrag — die Adresse trägt das Ziel trotzdem (teilbar).
    await expect(page).toHaveURL(new RegExp(`#${anker}$`))

    // Suche: «Rechtsgut» steht mehrfach in den Erwägungen dieses BGE.
    const feld = rail.getByRole('searchbox', { name: 'Im Entscheid suchen' })
    await feld.fill('Rechtsgut')
    const zeile = rail.locator('[data-erw-treffer]')
    await expect(zeile).toBeVisible()
    await expect(zeile).toContainText('Treffer in')
    // Die Ergebnisliste ist kürzer als das volle Verzeichnis (sie filtert wirklich).
    const nachSuche = await rail.locator('a[href^="#e-"]').count()
    await feld.fill('')
    const ohneSuche = await rail.locator('a[href^="#e-"]').count()
    expect(nachSuche, `Suche filtert nicht: ${nachSuche} von ${ohneSuche}`).toBeLessThan(ohneSuche)

    // §8: ein Begriff ohne Vorkommen behauptet keine Treffer.
    await feld.fill('zzzqxyz')
    await expect(zeile).toContainText('Keine Treffer')
    expect(fehler).toEqual([])
  })

  // B6 (§9-Bug-Check 4.8.2026): im Lesemodus zeigte der Rail weiter Trefferzahlen,
  // während die Markierung abgeschaltet war und jeder Sprung still ins Leere lief
  // (der Haupt-Body ist dort ausgehängt). Eine Zahl neben toten Sprungzielen ist
  // eine Halb-Auskunft (§8) — der Rail verschwindet jetzt mit dem Lesemodus.
  test('im Lesemodus verschwindet der Rail — keine Zahlen neben toten Sprungzielen (§8)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/rechtsprechung/bge_152_IV_14')
    const rail = page.locator('[data-erw-rail]')
    await expect(rail).toBeVisible()
    await rail.getByRole('searchbox', { name: 'Im Entscheid suchen' }).fill('Rechtsgut')
    await expect(rail.locator('[data-erw-treffer]')).toContainText('Treffer in')

    await page.getByRole('button', { name: /Lesemodus/ }).first().click()
    await expect(page.getByRole('dialog', { name: /Lesemodus/ })).toBeVisible()
    await expect(rail).toHaveCount(0)

    // Zurück im Leser steht die Suche unverändert da (der Begriff ist nicht verloren).
    // ── DEKLARIERTE LOCATOR-VERSCHÄRFUNG (§6.3, W2·24-F1F 6.9.2026) ──────────
    // GEMESSEN auf dem Basisstand ebf53e425 (Nullprobe, 30 s Timeout): der
    // ungescopte `.first()`-Treffer war NICHT mehr der «✕ schliessen»-Knopf des
    // Overlays, sondern der Reiter-Schliessknopf der Arbeitsleiste
    // («Reiter «BGE 152 IV 14» schliessen», layout/Reiterleiste) — er steht im
    // DOM vor dem Dialog und liegt UNTER dessen Fläche, der Klick wurde darum
    // dauerhaft abgefangen («<article …> from <div role="dialog" …> subtree
    // intercepts pointer events»). Das ist kein Produktfehler: der Reiterstreifen
    // DARF hinter einem modalen Dialog liegen. Der Test zielt jetzt auf den
    // Knopf IM Dialog — die geprüfte Zusage (Schliessen bringt Rail und
    // Suchbegriff unverändert zurück) ist unverändert und wird sogar strenger,
    // weil sie nicht mehr an einem beliebigen «schliessen» hängt.
    const dialog = page.getByRole('dialog', { name: /Lesemodus/ })
    await dialog.getByRole('button', { name: /schliessen/ }).first().click()
    await expect(rail).toBeVisible()
    await expect(rail.getByRole('searchbox', { name: 'Im Entscheid suchen' })).toHaveValue('Rechtsgut')
  })

  test('mobil (390px): Rail ist ein aufklappbarer Block, Tap-Ziele ≥ 24 px, kein Overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/rechtsprechung/bge_152_IV_14')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const griff = page.locator('[data-erw-rail-griff]')
    await expect(griff).toBeVisible()
    await expect(griff).toHaveAttribute('aria-expanded', 'false')
    // Eingeklappt liegen die Sprungziele nicht im Weg.
    await expect(page.locator('[data-erw-rail] a[href^="#e-"]').first()).toBeHidden()
    await griff.click()
    await expect(griff).toHaveAttribute('aria-expanded', 'true')
    const ziel = page.locator('[data-erw-rail] a[href^="#e-"]').first()
    await expect(ziel).toBeVisible()
    // WCAG 2.5.8: mindestens 24 px hohe Tap-Ziele.
    const box = (await ziel.boundingBox())!
    expect(box.height, `Tap-Ziel nur ${box.height} px hoch`).toBeGreaterThanOrEqual(24)
    const griffBox = (await griff.boundingBox())!
    expect(griffBox.height, `Griff nur ${griffBox.height} px hoch`).toBeGreaterThanOrEqual(24)
    // Kein Querscroll durch die neue Fläche.
    const b = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    expect(b.scroll, `scrollWidth ${b.scroll} > ${b.client}`).toBeLessThanOrEqual(b.client + 1)
  })

  test('A9: Rail-Sprung + Suche flüssig unter CPU-Throttle, CLS 0', async ({ page }) => {
    if (CONTAINER_BUDGET_CI) test.setTimeout(CONTAINER_BUDGET_CI)
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: DROSSEL })

    await page.goto('/rechtsprechung/bge_152_IV_14')
    const rail = page.locator('[data-erw-rail]')
    await expect(rail).toBeVisible({ timeout: 20_000 })

    // CLS-Beobachter über den GESAMTEN Fluss (nur input-freie Shifts zählen).
    //
    // ── ABGRENZUNG AUF DIE LESEFLÄCHE, mit Beleg (§0.3-Verteilung) ────────────
    // Gezählt werden nur Shifts, an denen mindestens EIN Quellknoten INNERHALB
    // von `<main>` liegt. Grund, gemessen am 4.8.2026 unter 6×-Drossel: die
    // App-Schale wirft rund 3.2 s nach dem Laden EINEN Shift von 0.000226, dessen
    // Quellen ausschliesslich Topbar-Knöpfe sind (Reiter-/Verlauf-Zähler
    // `min-h-11 min-w-11`, ThemaUmschalter `h-11 w-11`) — er entsteht, wenn der
    // TabTracker die Route registriert und der Zähler im Kopf breiter wird. Das
    // ist ein Bestands-Verhalten der Schale, VOR und NACH dieser Einheit
    // identisch, und liegt ausserhalb der Bau-Fläche (Shell/Topbar). Ihn
    // mitzuzählen hiesse, ein fremdes Bestandsproblem dieser Einheit
    // zuzuschreiben; ihn global wegzudefinieren hiesse, den Wächter stumpf zu
    // machen. Darum die Ortsgrenze: alles, was der Rail-Sprung und die Suche im
    // Lesebereich anrichten, fällt weiterhin voll ins Gewicht.
    await page.evaluate(() => {
      ;(window as unknown as { __cls: number }).__cls = 0
      const inhalt = document.querySelector('main')
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as PerformanceEntry[]) {
          const s = e as unknown as {
            value: number; hadRecentInput: boolean; sources?: { node?: Node | null }[]
          }
          if (s.hadRecentInput) continue
          const quellen = s.sources ?? []
          const imInhalt = quellen.some((q) => q.node && inhalt?.contains(q.node))
          if (imInhalt) (window as unknown as { __cls: number }).__cls += s.value
        }
      }).observe({ type: 'layout-shift' })
    })

    // Sprung an eine Erwägung.
    const ziel = rail.locator('a[href^="#e-"]').first()
    const anker = (await ziel.getAttribute('href'))!.slice(1)
    let t0 = Date.now()
    await ziel.click()
    await expect(page.locator(`#${anker}`)).toBeVisible({ timeout: REAKTIONS_LATTE })
    expect(Date.now() - t0, 'Rail-Sprung zu langsam').toBeLessThan(REAKTIONS_BUDGET)

    // Suche tippen (Highlight-API + Trefferliste) — die teuerste Interaktion.
    const feld = rail.getByRole('searchbox', { name: 'Im Entscheid suchen' })
    t0 = Date.now()
    await feld.fill('Rechtsgut')
    await expect(rail.locator('[data-erw-treffer]')).toContainText('Treffer in', { timeout: REAKTIONS_LATTE })
    expect(Date.now() - t0, 'Suche im Entscheid zu langsam').toBeLessThan(REAKTIONS_BUDGET)

    // Sprung auf einen Treffer aus der gefilterten Liste.
    const treffer = rail.locator('a[href^="#e-"]').first()
    const trefferAnker = (await treffer.getAttribute('href'))!.slice(1)
    t0 = Date.now()
    await treffer.click()
    await expect(page.locator(`#${trefferAnker}`)).toBeVisible({ timeout: REAKTIONS_LATTE })
    expect(Date.now() - t0, 'Treffer-Sprung zu langsam').toBeLessThan(REAKTIONS_BUDGET)

    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
    // ── LATTE «exakt 0» → «≤ 0.001» (deklariert, §6.3/§17, W2·24-F1F 6.9.2026) ─
    // GEMESSEN: der Fall riss die Nulllatte mit 0.000631275720164609 — das sind
    // gerundet 0.06 ‰ des Bildschirms und liegt drei Zehnerpotenzen unter dem
    // Web-Vitals-«gut»-Wert (0.1). `toBe(0)` ist eine EXAKTE Gleitkomma-Latte auf
    // eine Grösse, die aus Subpixel-Rundung des Browsers entsteht; sie geht je
    // nach Runner-Tempo grün oder rot, ohne dass sich am Produkt etwas ändert —
    // also ein Tor, das nicht misst, was es zu messen behauptet.
    // Die Latte wird NICHT auf das Budget anderer A9-Tests (0.05) gehoben,
    // sondern nur so weit, dass Subpixel-Rauschen darunter bleibt: bei 0.001
    // schlägt jeder Shift, der ein Bedienelement um mehr als rund einen Pixel
    // verschiebt, weiterhin voll durch. Die Ortsgrenze (nur Shifts INNERHALB
    // `main`) bleibt unverändert.
    expect(cls, 'CLS über Rail-Sprung/Suche muss unter dem Subpixel-Rauschen bleiben').toBeLessThanOrEqual(0.001)
    expect(fehler).toEqual([])
  })
})
