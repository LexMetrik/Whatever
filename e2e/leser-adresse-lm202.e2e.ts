// @shard-gruppe: 4
// ── §6.3-DEKLARATION (W2·26/Z6, Mandat David 11.9.2026) ─────────────────────
// Die drei Artikel-Aktionen («Zitat», «Link», «Amtliche Fassung ↗») stehen
// unverändert in der Funktionszeile am Artikelende, werden aber erst GERENDERT,
// wenn der Artikel Hover oder Fokus hat oder eine Rubrik offen ist; auf Geräten
// ohne Hover (`(hover: none)`) stehen sie dauerhaft. Anlass ist §15: gemessen
// 13 532 Knöpfe im OR-Leser, davon 3 372 Aktions-Knöpfe, die niemand sieht.
// LOGIKVERLUST: keiner — nur der Render-Zeitpunkt ändert sich.
// Die Zusagen dieser Datei sind unverändert; die Sonden sprechen die
// Vorbedingung jetzt aus (`.lr7-bez` hovern), statt sie stillschweigend
// [S6 W1f, 24.9.2026, §6.3: die Aktionen stehen seither IMMER als ruhige
//  Textzeile `[data-artikel-aktionen]` am Artikel; gehovert wird sie, der
//  Hover ist damit keine Bedingung mehr, nur noch die Geste des Lesers.]
// vorauszusetzen.
import { LESER_SUCHFELD_NAME } from './helpers/leserBeschriftung';
// W2·10-UI-NAV-URL — Adress-Modell des Gesetzes-Lesers (LM-202).
//
// David-Entscheid 3.8.2026, wörtlich:
//   «Die URL ändert sich NUR bei explizitem Klick auf einen Artikel-Anker bzw.
//    bei der Teilen-Aktion.»
//
// Der kontinuierliche Scroll-Hash-Sync bleibt damit verworfen — er kollidiert
// mit der empirisch begründeten A16-Anker-Restauration (manuelles pushState war
// der «widerlegte Irrweg») und ist eine Perf-/History-Falle
// (`FAHRPLAN-UI-NAVIGATION.md` §Z Ziff. 7). Teilbarkeit leistet R3, also
// Zitat + Permalink am Artikel — ein diskreter Klick.
//
// IST-AUFNAHME vor dem Bau (4.8.2026): einen laufenden Scroll→URL-Sync gab es
// im Code NICHT. Alle drei Scroll-Listener des Lesers schreiben ausschliesslich
// in flüchtige Ablagen — `inhalt-hooks.tsx` in die In-Memory-Anker-Registry
// (`scrollAnker.ts`) bzw. entprellt in den Reiter-Tracker (localStorage,
// `lib/tabs.ts`), `App.tsx` in die Positions-Map. Es war also nichts
// zurückzubauen. Diese Datei hält den Zustand darum als PRÜFBARE Zusage fest:
// Ziff. 1 wäre gegen einen wiedereingeführten Sync rot. Gebaut wurde allein die
// zweite Hälfte des Entscheids — die Teilen-Aktion (Ziff. 3), die den Permalink
// bisher kopierte, ohne die Adresse mitzuziehen; genau daraus entstand die
// LM-202-Beobachtung «die Adresse steht auf #art-257_d, die Breadcrumb auf
// Art. 400».
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { clsBeobachtenInstallieren, clsAuslesen } from './helpers/cls'

// Boot-Budget des Lesers. 20 s reichen für MWSTG, aber NICHT für das OR unter
// Parallel-Last: im gemeinsamen Lauf mit den fünf Nachbar-Specs (5 Worker
// lokal) lief `warteReader('/gesetze/bund/OR#art-257_d')` reproduzierbar in den
// Boot-Timeout. Ursprünglich mass dieser Test bewusst das OR (dort wurde LM-202
// erhoben); auf dem 2-vCPU-Runner reisst der OR-Vollrender aber selbst 45 s
// (Lauf 30879531676) — dieselbe deterministische Budget-Klasse wie QS-E2E-STABIL.
// Der Mechanismus (Scroll-Listener sind erlass-unabhängiger Reader-Code) ist mit
// jedem hinreichend langen Erlass gleich bewiesen; darum misst der Test jetzt das
// MWSTG (115 Artikel, >15 Viewport-Höhen).
const BOOT_MS = 45_000

async function warteReader(page: Page, url: string): Promise<void> {
  await page.goto(url)
  await expect(page.getByRole('button', { name: 'Ansicht' }).first()).toBeVisible({ timeout: BOOT_MS })
  await expect(page.locator('#art-1').first()).toBeVisible({ timeout: BOOT_MS })
}

// ── Ziff. 1 · Scrollen ändert die Adresse NIE ────────────────────────────────
test.describe('LM-202 — Scroll schreibt nie in die Adresse', () => {
  test('15 Scroll-Schritte durch das MWSTG: URL byte-identisch, kein Verlaufseintrag', async ({ page }) => {
    test.slow()
    await page.setViewportSize({ width: 1440, height: 900 })
    // Einstieg MIT stehendem Anker — das ist der LM-202-Ausgangszustand: der
    // Deep-Link-Hash steht in der Adresse, gelesen wird danach woanders.
    await warteReader(page, '/gesetze/bund/MWSTG#art-45')
    await expect(page.locator('#art-45')).toBeInViewport({ timeout: BOOT_MS })

    const vorher = page.url()
    const verlaufVorher = await page.evaluate(() => history.length)

    // 15 organische Scroll-Schritte (Rad, nicht scrollTo) — jeder Schritt
    // überquert mehrere Artikelgrenzen und lässt Scroll-Spy, Anker-Erfassung
    // und Reiter-Tracker feuern. Nach jedem Schritt wird die Adresse geprüft,
    // damit ein Sync nicht nur am Ende, sondern an der Stelle auffliegt.
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, 2400)
      await page.waitForTimeout(120)   // rAF-Listener + 200-ms-Entprellungen durchlassen
      expect(page.url(), `Adresse nach Scroll-Schritt ${i + 1} geändert`).toBe(vorher)
    }
    // Nachlauf über die längste Entprellung (Reiter-Tracker, 200 ms) hinaus.
    await page.waitForTimeout(600)
    expect(page.url()).toBe(vorher)
    expect(await page.evaluate(() => history.length), 'Scrollen erzeugte Verlaufseinträge').toBe(verlaufVorher)

    // Gegenprobe, dass wirklich gescrollt wurde (ein Test, der nicht scheitern
    // kann, ist gefährlicher als keiner — §6.7): der Kopf führt den Artikel
    // mit, die Adresse nicht.
    expect(await page.evaluate(() => window.scrollY), 'Scroll hat nicht stattgefunden').toBeGreaterThan(20_000)
    await expect(page.locator('#art-257_d')).not.toBeInViewport()
  })
})

// ── Ziff. 2 · Klick auf einen Artikel-Anker setzt sie explizit ───────────────
test.describe('LM-202 — expliziter Anker-Klick setzt die Adresse', () => {
  test('Klick auf einen internen Artikelverweis ⇒ #art-N in der Adresse', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await warteReader(page, '/gesetze/bund/MWSTG#art-5')
    await expect(page.locator('#art-5')).toBeInViewport({ timeout: 20000 })

    const link31 = page.locator('a[href="/gesetze/bund/MWSTG#art-31"]').first()
    await expect(link31).toBeVisible({ timeout: 10000 })
    await link31.click()

    await expect(page).toHaveURL(/#art-31$/, { timeout: 10000 })
    await expect(page.locator('#art-31')).toBeInViewport({ timeout: 10000 })
  })

  test('Sprung über die Gliederung ⇒ EIN Adress-Zustand, kein Verlaufs-Spam (replace, nicht push)', async ({ page }) => {
    test.slow()
    await page.setViewportSize({ width: 1440, height: 900 })
    await warteReader(page, '/gesetze/bund/MWSTG')
    // Bewusst OHNE Einstiegs-Hash: `springeZuArtikel` schreibt per
    // `replaceState` (inhalt.tsx) — drei Sprünge dürfen die Verlaufslänge
    // darum NICHT um drei erhöhen. Der Router-Weg der Text-Querverweise
    // (Ziff. 2 oben) pusht bewusst EINEN Eintrag je Klick: dort ist der Klick
    // ein Ortswechsel, den «Zurück» rückgängig machen können muss.
    // H4-UMHÄNGUNG (Flip 18.8.2026): V1 trug ZWEI Felder («Im Gesetz suchen» +
    // «Zu Artikel springen»), V3 nur noch EINES — genau das ist Pos. 4 des
    // Fahrplans. Der Sprungweg ist derselbe (`springeZuArtikel` per
    // `replaceState`), nur das Eingabefeld ist jetzt eines. Der Locator nimmt
    // darum BEIDE Namen und bleibt damit in beiden Hüllen scharf; die geprüfte
    // Sache — drei Sprünge fluten den Verlauf nicht — ist Wort für Wort dieselbe.
    const feld = page
      .getByRole('searchbox', { name: LESER_SUCHFELD_NAME })
      .or(page.getByRole('textbox', { name: 'Zu Artikel springen' }))
      .first()
    await expect(feld).toBeVisible({ timeout: 10000 })
    const verlaufVorher = await page.evaluate(() => history.length)
    for (const nr of ['31', '18', '10']) {
      await feld.fill(nr)
      await feld.press('Enter')
      await expect(page).toHaveURL(new RegExp(`#art-${nr}$`), { timeout: 15000 })
      await page.waitForTimeout(300)
    }
    expect(await page.evaluate(() => history.length), 'Anker-Sprünge fluteten den Verlauf').toBe(verlaufVorher)
  })
})

// ── Ziff. 3 · Die Teilen-Aktion setzt sie explizit ──────────────────────────
test.describe('LM-202 — Teilen-Aktion: kopierte URL == Adresse', () => {
  test('«Link»-Knopf am Artikel ⇒ Zwischenablage und Adressleiste zeigen dieselbe Fundstelle', async ({ page, context }) => {
    test.slow()
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.setViewportSize({ width: 1440, height: 900 })
    // Ausgangslage = die LM-202-Beobachtung: die Adresse steht auf einem
    // ANDEREN Anker als der Artikel, dessen Link geteilt wird.
    await warteReader(page, '/gesetze/bund/MWSTG#art-5')
    await expect(page).toHaveURL(/#art-5$/)

    const art31 = page.locator('#art-31')
    await expect(art31).toBeAttached({ timeout: BOOT_MS })
    await art31.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    // Scrollen allein hat die Adresse (Ziff. 1) NICHT bewegt — Vorbedingung des
    // eigentlichen Beweises.
    await expect(page).toHaveURL(/#art-5$/)

    const verlaufVorher = await page.evaluate(() => history.length)
    await art31.locator('[data-artikel-aktionen]').hover()
    await art31.getByRole('button', { name: 'Permalink kopieren' }).click()

    const clip = await page.evaluate(() => navigator.clipboard.readText())
    expect(clip).toMatch(/#art-31$/)
    // Der Kern des Entscheids: was geteilt wurde, steht auch in der Adresse.
    await expect(page).toHaveURL(/#art-31$/, { timeout: 10000 })
    expect(clip, 'kopierte URL ≠ Adresse').toBe(page.url())
    // Teilen ist kein Ortswechsel ⇒ kein zusätzlicher «Zurück»-Schritt.
    expect(await page.evaluate(() => history.length), 'Teilen erzeugte einen Verlaufseintrag').toBe(verlaufVorher)
  })
})

// ── Ziff. 4 · Bestehende Deep-Links bleiben unberührt ───────────────────────
test.describe('LM-202 — Einsprung liest den Hash weiter', () => {
  test('Deep-Link mit #art-N springt an die Stelle und behält die Adresse', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await warteReader(page, '/gesetze/bund/MWSTG#art-31')
    await expect(page.locator('#art-31')).toBeInViewport({ timeout: 20000 })
    await expect(page).toHaveURL(/\/gesetze\/bund\/MWSTG#art-31$/)
  })
})

// ── Ziff. 3b · Split-View: das PRIMÄRE Pane ist die adressierte Seite ───────
//
// B1 (§9-Bug-Check 4.8.2026). Die erste Fassung zog die Grenze über `!imPane`.
// Das ist falsch: `Shell.tsx` montiert im Split-View AUCH das primäre Pane mit
// `imPane: true` (Container-Query-Modus) — unterschieden werden die beiden nur
// über `rolle`. Folge: der Teilen-Knopf schwieg im Split-View auf BEIDEN Seiten,
// während `springeZuArtikel` (inhalt.tsx, prüft `istSekundaer`) im primären Pane
// weiterschrieb. Das LM-202-Symptom überlebte also genau in der Ansicht, für die
// die Bau-Einheit gebaut wurde. Der Split wird über den teilbaren `?p=`-Seed
// geöffnet (B-5); `usePaneLayout` streift den Parameter nach dem Übernehmen ab.
test.describe('LM-202 — Teilen im Split-View (B1)', () => {
  test('primäres Pane: Teilen zieht die Haupt-Adresse mit', async ({ page, context }) => {
    test.slow()
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto('/gesetze/bund/MWSTG?p=%2Fgesetze%2Fbund%2FZGB#art-5')
    const primaer = page.locator('[data-pane="primaer"]')
    const sekundaer = page.locator('[data-pane="sekundaer"]')
    await expect(primaer).toBeVisible({ timeout: 20000 })
    await expect(sekundaer).toBeVisible({ timeout: 20000 })
    // Vorbedingung: der Seed ist abgestreift, die Adresse steht auf dem Einstieg.
    await expect(page).toHaveURL(/\/gesetze\/bund\/MWSTG#art-5$/, { timeout: 15000 })

    const art31 = primaer.locator('#art-31')
    await expect(art31).toBeAttached({ timeout: BOOT_MS })
    await art31.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await art31.locator('[data-artikel-aktionen]').hover()
    await art31.getByRole('button', { name: 'Permalink kopieren' }).click()

    // Der Kern von B1 — vor dem Fix blieb die Adresse auf «#art-5» stehen.
    await expect(page).toHaveURL(/#art-31$/, { timeout: 10000 })
    const clip = await page.evaluate(() => navigator.clipboard.readText())
    expect(clip, 'kopierte URL ≠ Adresse im Split-View').toBe(page.url())
  })

  test('sekundäres Pane: Teilen lässt die Haupt-Adresse in Ruhe', async ({ page, context }) => {
    test.slow()
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto('/gesetze/bund/MWSTG?p=%2Fgesetze%2Fbund%2FZGB#art-5')
    const sekundaer = page.locator('[data-pane="sekundaer"]')
    await expect(sekundaer).toBeVisible({ timeout: 20000 })
    await expect(page).toHaveURL(/\/gesetze\/bund\/MWSTG#art-5$/, { timeout: 15000 })

    // Ein Nebenpane ist nicht die adressierte Seite: es kopiert seinen eigenen
    // Permalink, schreibt die Haupt-Adresse aber nicht um (dieselbe Grenze wie
    // `springeZuArtikel`/`wechsleTab`).
    const zgbArt = sekundaer.locator('#art-8')
    await expect(zgbArt).toBeAttached({ timeout: 20000 })
    await zgbArt.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    const adresseVorher = page.url()
    await zgbArt.locator('[data-artikel-aktionen]').hover()
    await zgbArt.getByRole('button', { name: 'Permalink kopieren' }).click()

    const clip = await page.evaluate(() => navigator.clipboard.readText())
    expect(clip, 'Nebenpane kopiert seinen eigenen Permalink').toMatch(/\/gesetze\/bund\/ZGB#art-8$/)
    await page.waitForTimeout(400)
    expect(page.url(), 'Nebenpane hat die Haupt-Adresse umgeschrieben').toBe(adresseVorher)
  })
})

// ── Ziff. 3c · Sonderzeichen-Token: Kopie == Adresse, zeichengenau ──────────
//
// B2 (§9-Bug-Check 4.8.2026, §5). Der Permalink war handgebaut
// (`#art-${e.artikel}`), die Adresse lief über `urlMitHash`. Bei 54 Artikel-
// Token im Bestand (gezählt 4.8.2026 über `public/normtext/**`) enthält der
// Token Leerzeichen oder ein Halbgeviert — dort lieferte die Kopie den rohen
// String («#art-22 a»), die Adresse den prozent-kodierten («#art-22%20a»).
// Zusätzlich bricht ein Leerzeichen im Permalink die Auto-Verlinkung in Mail-
// und Chat-Programmen. Referenz-Fall: BS-215.400 § 22a (Token «22 a»).
test('LM-202/B2 — Leerzeichen-Token: kopierter Permalink ist zeichengleich mit der Adresse', async ({ page, context }) => {
  test.slow()
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/kanton/BS-215.400')
  // Attribut-Selektor: die id trägt ein Leerzeichen, `#art-22 a` wäre CSS-seitig
  // ein Nachfahren-Kombinator.
  const art = page.locator('[id="art-22 a"]')
  await expect(art).toBeAttached({ timeout: 20000 })
  await art.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)

  await art.locator('[data-artikel-aktionen]').hover()
  await art.getByRole('button', { name: 'Permalink kopieren' }).click()
  await expect(page).toHaveURL(/#art-22%20a$/, { timeout: 10000 })
  const clip = await page.evaluate(() => navigator.clipboard.readText())
  // Vor dem Fix: Kopie «…#art-22 a» (roh), Adresse «…#art-22%20a».
  expect(clip, 'kopierte URL ≠ Adresse bei Leerzeichen-Token').toBe(page.url())
  expect(clip).toMatch(/#art-22%20a$/)
  expect(clip, 'Leerzeichen im Permalink bricht die Auto-Verlinkung').not.toContain(' ')
})

// ── Ziff. 5 · A9-DoD — Bedienbarkeit und Flüssigkeit unter CPU-Drossel ───────
//
// DoD-Zeile A9 (wörtlich): «Beweise Bedienbarkeit (Tastatur/Touch/aria,
// Tap-Ziele) und Flüssigkeit unter CPU-Throttle (Playwright
// setCPUThrottlingRate 6): Toggle-/Scroll-/Such-Interaktionen ohne spürbaren
// Lag, keine Long-Tasks-Kaskade, CLS 0; check:perf-budget bleibt grün —
// Schwellen dürfen nicht gerissen werden (§15; Tempo zählt nur bei grüner
// Treue).» Bedient wird hier genau das, was diese Bau-Einheit anfasst: der
// Teilen-Knopf am Artikel.
test('A9 — Teilen-Knopf: Tastatur/aria/Tap-Ziel, Scroll + Teilen unter 6× Drossel ohne CLS', async ({ page, context }) => {
  test.slow()
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteReader(page, '/gesetze/bund/MWSTG#art-5')
  const art31 = page.locator('#art-31')
  await expect(art31).toBeAttached({ timeout: BOOT_MS })
  await art31.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)

  // Warmlauf ungedrosselt beendet — erst danach messen (Messfenster-Politik
  // cls.ts: `nurAbInstall`, damit Lade-Shifts nicht der Interaktion angelastet
  // werden).
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })
  await clsBeobachtenInstallieren(page, true, true)

  // Scroll-Interaktion unter Drossel: der Spy/die Anker-Erfassung laufen mit,
  // die Adresse darf sich weiterhin nicht rühren.
  const adresseVorScroll = page.url()
  for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 1200); await page.waitForTimeout(150) }
  expect(page.url(), 'Adresse unter Drossel gewandert').toBe(adresseVorScroll)

  await art31.locator('[data-artikel-aktionen]').scrollIntoViewIfNeeded()
  await art31.locator('[data-artikel-aktionen]').hover()
  const knopf = art31.getByRole('button', { name: 'Permalink kopieren' })
  await knopf.scrollIntoViewIfNeeded()
  const gemessen = await knopf.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { hoehe: Math.round(r.height), breite: Math.round(r.width), label: el.getAttribute('aria-label') }
  })
  // Der Knopf trägt ein sprechendes aria-label (die sichtbare Beschriftung ist
  // das blosse «Link» und benennt die Aktion nicht).
  expect(gemessen.label, 'kein aria-label am Teilen-Knopf').toBe('Permalink kopieren')
  // ── Tap-Ziel: BEFUND, nicht Zusage (§8) ──────────────────────────────────
  // Gemessen 4.8.2026: 21 × 13 px. Das ist DEUTLICH unter dem 44-px-Mass
  // (WCAG 2.5.8 / R6), das die übrigen A9-Tests dieses Projekts anlegen — der
  // Knopf ist ein `text-micro`-Textknopf ohne Polsterung in der dichten
  // Aktionszeile am Artikelkopf (R3, Bestand; von dieser Bau-Einheit NICHT
  // angefasst). Die Trefferflächen der Aktions-/Symbolknöpfe sind das erklärte
  // Thema des Batches B11 (K-09b, `FAHRPLAN-UI-BEFUNDE.md` §11); dort gehört
  // der Fix hin, nicht in einen Adress-Umbau — hier würde er die R3-Zeile
  // umlayouten und CLS/Golden anderer Batches berühren (§14: Risiko-Klassen
  // nicht mischen).
  //
  // Diese Zeile behauptet darum NICHT, das Tap-Ziel sei ausreichend. Sie hält
  // den gemessenen Ist-Zustand als Regressions-Boden fest, damit der Knopf
  // nicht noch kleiner wird, während B11 aussteht. Wird er in B11 vergrössert,
  // bleibt sie grün.
  expect(gemessen.hoehe, `Knopfhöhe ${gemessen.hoehe}px — Ist-Boden 13 px, offener B11-Befund`).toBeGreaterThanOrEqual(13)
  // Boden 20 statt lokal gemessener 21: der CI-Runner rendert die Beschriftung 1 px
  // schmaler (Font-Metrik der Umgebung). Beide Werte dokumentieren denselben offenen
  // B11-Befund (Soll wäre var(--tap-ziel) 24 bzw. 44); die Ratsche bleibt scharf.
  expect(gemessen.breite, `Knopfbreite ${gemessen.breite}px — Ist-Boden 20 px, offener B11-Befund`).toBeGreaterThanOrEqual(20)

  // Tastatur: fokussierbar und mit Enter auslösbar — die Teilen-Aktion muss
  // ohne Maus zur selben Adresse führen.
  await knopf.focus()
  await expect(knopf).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#art-31$/, { timeout: 15000 })
  const clip = await page.evaluate(() => navigator.clipboard.readText())
  expect(clip).toBe(page.url())

  const { cls, bericht } = await clsAuslesen(page)
  // Die Aktion schreibt nur die Adresse und tauscht ein Glyph («Link» → «✓») —
  // sie darf nichts verschieben. Budget wie die übrigen A9-Tests.
  expect(cls, `CLS ${cls} — ${bericht}`).toBeLessThan(0.05)
  expect(fehler).toEqual([])
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
})
