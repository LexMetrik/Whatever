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

  // §6.3-DEKLARATION (W2·29-WERKBANK-LESER D2/B-1, 25.9.2026 — fachliche
  // Änderung, kein Refactoring): BES.2025.17 war bis D2 das Fixture für den
  // datumlosen BS-Entscheid (Platzhalter 2025-01-01 + datumUnbekannt). Die
  // amtliche Quelle (gerichte.bs.ch, nF30_KEY=78708, abgerufen 25.9.2026) lässt
  // das Metadatenfeld «Entscheiddatum:» leer, das Deckblatt trägt aber
  // «ENTSCHEID / vom 8. August 2025»; B-1 liest es seither aus. Gemessen
  // 25.9.2026: im ganzen Bestand `public/rechtsprechung` trägt KEIN Entscheid
  // mehr `datumUnbekannt: true` (main: 42 im Register, Branch: 0) — es gibt
  // kein echtes datumloses Fixture mehr. Darum zwei Tests statt einem:
  // (1) derselbe Entscheid zeigt jetzt das echte Datum und nie den Platzhalter;
  // (2) der §7.2-Pfad der Darstellung (DatumMeta, «Entscheiddatum nicht
  //     publiziert» + Erstpublikation) bleibt geprüft, an demselben Entscheid,
  //     dessen Snapshot im Test auf den datumlosen Zustand zurückgesetzt wird
  //     (so wie ihn der Generator ohne Deckblatt-Datum weiterhin erzeugt,
  //     `bs-rechtsprechung.test.ts` «ohne Deckblatt-Datum»).
  test('BS-Entscheid mit Deckblatt-Datum: echtes Datum statt Platzhalter; Sekundärnummer im Kopf (B-1)', async ({ page }) => {
    await page.goto('/rechtsprechung/bs_appellationsgericht_BES.2025.17')
    await expect(page.getByRole('heading', { level: 1, name: /BES\.2025\.17/ })).toBeVisible()
    await expect(page.getByText('(AG.2025.474)').first()).toBeVisible()
    await expect(page.getByText(/08\.08\.2025/).first()).toBeVisible()
    await expect(page.getByText('Entscheiddatum nicht publiziert')).toHaveCount(0)
    // Der frühere Platzhalter erscheint nirgends im Kopf.
    await expect(page.locator('header').getByText(/01\.01\.2025/)).toHaveCount(0)
  })

  test('datumloser BS-Entscheid: Platzhalter nie als Datum; Erstpublikation + Sekundärnummer im Kopf (§7.2)', async ({ page }) => {
    await page.route('**/rechtsprechung/kanton/BS/bs_appellationsgericht/BES.2025.17.json', async (route) => {
      const res = await route.fetch()
      const d = await res.json()
      d.eintraege[0] = {
        ...d.eintraege[0],
        datum: '2025-01-01',
        datumUnbekannt: true,
        zitierung: 'Appellationsgericht BS BES.2025.17',
      }
      await route.fulfill({ response: res, json: d })
    })
    await page.goto('/rechtsprechung/bs_appellationsgericht_BES.2025.17')
    await expect(page.getByRole('heading', { level: 1, name: /BES\.2025\.17/ })).toBeVisible()
    await expect(page.getByText('Entscheiddatum nicht publiziert').first()).toBeVisible()
    await expect(page.getByText(/Erstpublikation/).first()).toBeVisible()
    // Parallele Geschäftsnummer «(AG.2025.474)» im Meta-Kopf.
    await expect(page.getByText('(AG.2025.474)').first()).toBeVisible()
    // Kein fingiertes «Urteil vom 01.01.2025» im Kopf (Body-Text bleibt aussen vor).
    await expect(page.locator('header').getByText(/Urteil vom/)).toHaveCount(0)
    await expect(page.locator('header').getByText(/01\.01\.2025/)).toHaveCount(0)
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
    //
    // ── ZWEITE ORTSGRENZE: das Such-Verzeichnis selbst (W2·18-FEHLERBUCH, ──────
    // ── 1.10.2026, Merge-Queue-Lauf 36894892472) ───────────────────────────────
    // GEMESSEN (Reproduktion lokal, 4×-Drossel wie CI): der Rest-Shift 0.00105926…
    // — bitgleich der CI-Wert — ist die UMORDNUNG DES VERZEICHNISSES DURCH DIE
    // SUCHE: Tippt man «Rechtsgut», filtert `ErwaegungsRail` die Liste
    // (`nav[aria-label="Erwägungen"]`, `liste ?? gliederung`), die Einträge
    // darunter rücken um je 26 px nach oben bzw. erscheinen neu (Quellen: vier
    // `LI` dieser Liste, previousRect/currentRect nur in y verschoben). Das ist
    // die gewollte Antwort auf die Eingabe, kein Layout-Sprung. Ob Chrome sie
    // zählt, entschied bisher nur die UHR: `hadRecentInput` gilt 500 ms nach der
    // letzten ECHTEN Eingabe (hier dem Klick auf den Rail-Sprung), und
    // `fill()` ist keine — es setzt den Wert ohne Tastendruck. Auf einem
    // langsamen/belasteten Runner liegen > 500 ms zwischen Sprung-Klick und
    // Füllen, der Filter-Shift fällt aus dem Fenster und zählt voll: gleicher
    // Code, anderes Tempo, anderes Ergebnis (lokal mit 700 ms Pause vor `fill()`
    // reproduzierbar rot, ohne Pause grün). Die Latte «≤ 0.001» (6.9.2026) hat
    // das nur kaschiert — sie riss, sobald ein Eintrag mehr wanderte (4 Quellen
    // = 0.00106); «Subpixel-Rauschen» war die falsche Diagnose.
    // Darum die Ortsgrenze statt der Uhr: ein Shift zählt nur, wenn sich eine
    // Quelle AUSSERHALB des Verzeichnisses tatsächlich bewegt hat (Rect vorher ≠
    // nachher). Was Suche oder Sprung an Lesetext, Kopf, Treffer-Slot oder
    // Normen-Block verschieben, zählt weiterhin voll — und damit ist die Latte
    // wieder exakt 0 (unten), schärfer als ≤ 0.001, nicht lockerer.
    // [Wortlaut vom 1.10.2026, BERICHTIGT durch die Ergänzung unten:
    // «schärfer als zuvor, nicht lockerer» galt nur AUSSERHALB des Verzeichnisses.]
    //
    // ERGÄNZUNG 1.10.2026 (Zweitprüfung #1244, ergänzt statt umgeschrieben): die
    // Verzeichnis-Ausnahme galt zunächst über den GANZEN Ablauf. Prüfer-Mutation
    // «LI oben ins Verzeichnis einfügen, 700 ms nach dem Rail-Klick, ohne
    // Eingabe»: alte Messung 0.00198, mit der Ausnahme über den ganzen Ablauf 0 —
    // sie entging. Darum gilt die Ausnahme NUR in der SUCHPHASE (Flag unmittelbar
    // vor `fill()` bis nach sichtbarem `[data-erw-treffer]` samt zwei Frames,
    // Zeitfenster per `startTime`, weil Layout-Shift-Einträge asynchron zugestellt
    // werden). Genaue Abgrenzung: AUSSERHALB des Verzeichnisses ist die Latte
    // schärfer als zuvor (exakt 0 statt ≤ 0.001); INNERHALB des Verzeichnisses ist
    // nur die Suchphase ausgenommen — davor (Rail-Sprung) und danach
    // (Treffer-Sprung) zählen Verzeichnis-Shifts voll, und die Suchphase selbst
    // deckt die Versatz-Gegenprobe (vorher / nach Suche / nach Treffer-Sprung).
    //
    // Gegenstück: die Ortsgrenze blendet die Listeneinträge aus — damit wäre ein
    // einwachsender Treffer-Slot (§15.2: Auskunftszeile schöbe das Verzeichnis
    // nach unten) im Beobachter unsichtbar, denn dann verschiebt sich der
    // Behälter samt seinen Einträgen. Diese Schutzaufgabe trägt darum eine
    // eigene, geometrische Zusage: der Abstand des Verzeichnisses zur Oberkante
    // des Rails (scroll-unabhängig, der Rail klebt) bleibt durch die Suche
    // UNVERÄNDERT. Gemessen und im Quellcode gegengeprüft (Slot-Mutation: ohne
    // `min-h-12` wächst der Abstand um die Auskunftszeile, der Fall wird rot).
    const verzeichnisVersatz = () => page.evaluate(() => {
      const a = document.querySelector('[data-erw-rail]')!
      const n = a.querySelector('nav[aria-label="Erwägungen"]')!
      return n.getBoundingClientRect().top - a.getBoundingClientRect().top
    })
    const versatzVorher = await verzeichnisVersatz()
    await page.evaluate(() => {
      ;(window as unknown as { __cls: number }).__cls = 0
      ;(window as unknown as { __suche: { von: number; bis: number } }).__suche = { von: Infinity, bis: -Infinity }
      const inhalt = document.querySelector('main')
      const verzeichnis = document.querySelector('[data-erw-rail] nav[aria-label="Erwägungen"]')
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as PerformanceEntry[]) {
          const s = e as unknown as {
            value: number; hadRecentInput: boolean
            sources?: { node?: Node | null; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[]
          }
          if (s.hadRecentInput) continue
          const quellen = s.sources ?? []
          const bewegt = (q: { previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }) =>
            q.previousRect.x !== q.currentRect.x || q.previousRect.y !== q.currentRect.y
            || q.previousRect.width !== q.currentRect.width || q.previousRect.height !== q.currentRect.height
          // Verzeichnis-Ausnahme NUR in der Suchphase (Zeitfenster per startTime).
          const such = (window as unknown as { __suche: { von: number; bis: number } }).__suche
          const inSuchphase = e.startTime >= such.von && e.startTime <= such.bis
          const zaehlt = quellen.some((q) =>
            q.node && inhalt?.contains(q.node) && bewegt(q)
            && (!verzeichnis?.contains(q.node) || !inSuchphase))
          if (zaehlt) (window as unknown as { __cls: number }).__cls += s.value
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
    // Suchphase öffnen (Verzeichnis-Ausnahme gilt nur bis zu ihrem Ende).
    await page.evaluate(() => {
      ;(window as unknown as { __suche: { von: number; bis: number } }).__suche = { von: performance.now(), bis: Infinity }
    })
    t0 = Date.now()
    await feld.fill('Rechtsgut')
    await expect(rail.locator('[data-erw-treffer]')).toContainText('Treffer in', { timeout: REAKTIONS_LATTE })
    expect(Date.now() - t0, 'Suche im Entscheid zu langsam').toBeLessThan(REAKTIONS_BUDGET)
    // Suchphase schliessen: zwei Frames Nachlauf für die Filter-Antwort.
    await page.evaluate(() => new Promise<void>((fertig) => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        ;(window as unknown as { __suche: { von: number; bis: number } }).__suche.bis = performance.now()
        fertig()
      }))
    }))
    const versatzNachher = await verzeichnisVersatz()

    // Sprung auf einen Treffer aus der gefilterten Liste.
    const treffer = rail.locator('a[href^="#e-"]').first()
    const trefferAnker = (await treffer.getAttribute('href'))!.slice(1)
    t0 = Date.now()
    await treffer.click()
    await expect(page.locator(`#${trefferAnker}`)).toBeVisible({ timeout: REAKTIONS_LATTE })
    expect(Date.now() - t0, 'Treffer-Sprung zu langsam').toBeLessThan(REAKTIONS_BUDGET)
    const versatzTreffer = await verzeichnisVersatz()

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
    // ERGÄNZUNG 1.10.2026 (W2·18-FEHLERBUCH, ergänzt statt nachgeführt): diese
    // Latte riss am 1.10. mit 0.0010592592592592591 (Merge-Queue-Lauf
    // 36894892472); die Diagnose «Subpixel-Rauschen» ist FALSIFIZIERT — gemessen
    // ist es das Filter-Reflow des Verzeichnisses (zweite Ortsgrenze oben). Ob der
    // damalige Wert 0.000631… dieselbe Quelle hatte, wurde nicht nachgemessen
    // (Spur: gleiche Grössenordnung, gleiche Runner-Abhängigkeit). Mit der
    // zweiten Ortsgrenze trägt die Latte wieder die Aussage des Testnamens:
    // exakt 0, schärfer als zuvor.
    // PRÄZISIERUNG 1.10.2026 (Zweitprüfung #1244): «schärfer als zuvor» gilt
    // AUSSERHALB des Verzeichnisses; innerhalb ist nur die Suchphase ausgenommen
    // und dort durch die Versatz-Gegenprobe (unten) gedeckt — siehe Ergänzung oben.
    expect(cls, 'CLS über Rail-Sprung/Suche (ausserhalb des gefilterten Verzeichnisses) muss 0 sein').toBe(0)
    expect(versatzNachher, 'Treffer-Slot schiebt das Verzeichnis (reservierter Slot wächst ein)').toBeCloseTo(versatzVorher, 0)
    // ERGÄNZUNG 1.10.2026 (Zweitprüfung #1244): auch NACH dem Treffer-Sprung. Ein
    // Verzeichnis-Sprung direkt am Klick trägt `hadRecentInput` und fiele sonst
    // durch beide Netze (Beobachter und Versatz «nach Suche»).
    expect(versatzTreffer, 'Treffer-Sprung schiebt das Verzeichnis gegen die Rail-Oberkante').toBeCloseTo(versatzVorher, 0)
    expect(fehler).toEqual([])
  })
})
