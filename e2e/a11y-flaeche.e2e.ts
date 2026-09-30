// @shard-gruppe: 5
// Gruppe 2 statt 1 (CI-Nachzug 5.9.2026, Lauf 33937186925): Gruppe 1 trug mit
// dieser Spec 479 s reine CI-Testzeit und war damit der schwerste der acht
// Shards (a11y 147 s + a11y-flaeche 108 s = 53 % der Gruppe), Gruppe 2 mit
// 222 s der leichteste. Umhängen bringt 371 s / 330 s — der Spread der acht
// Gruppen sinkt von 222–479 s auf 256–390 s, ohne dass eine Route, ein
// Zustand oder eine Assertion angetastet wird (§6.3: ändert NUR, welche Datei
// auf welchem Runner läuft). Die Annotation ist die Quelle, `shard-gruppen.json`
// die Projektion (§5) — nach dieser Zeile `npm run gen:e2e-shards`.
// ─── QS-UI Teilpass (e) · axe von Stichprobe auf FLÄCHENDECKUNG ──────────────
// FAHRPLAN-UI-QUALITAET §4 Ziff. 2 (archiviert) verlangt «alle Hauptrouten».
// Der Bestand `a11y.e2e.ts` prüft SIEBEN der 62 prerenderten Routen (plus die
// Detail-Leser und die interaktiven Zustände) — 55 Routen, darunter 19 Rechner
// und 29 Vorlagen, liefen bis hierher durch KEIN axe-Tor. Ein Kontrast- oder
// Label-Verstoss auf `/rechner/erbteilung` oder `/vorlagen/testament` konnte
// ungebremst deployen.
//
// SSoT statt Handliste (§5): die Routen kommen aus `prerenderRouten()` — der
// Quelle, aus der auch der Prerender und die Sitemap leben. Eine neue Karte im
// Katalog zieht damit AUTOMATISCH ins a11y-Tor ein; eine Handliste hier wäre
// eine zweite Wahrheit, die still veraltet (genau die Lücke, die diese Einheit
// schliesst).
//
// ABGRENZUNG zu `a11y.e2e.ts` (§17-Gegengewicht — nicht dieselbe Sorge zweimal
// tragen): was dort bereits mit demselben nackten Seitenaufruf geprüft wird,
// läuft hier NICHT noch einmal. `a11y.e2e.ts` bleibt zuständig für die
// interaktiven Zustände (offene Suche, Kalender-Popover, Reiter-Dialog,
// PLZ-Kacheln, BS-Facette), für Hell+Dunkel-Paare und für die nicht
// prerenderten Detail-Leser. Diese Datei ist die FLÄCHE: jede prerenderte Route
// einmal im Referenzmodus hell, plus die zwei Zustands-Vertreter, die auf keiner
// prerenderten Route entstehen (Rechner-ERGEBNIS und Wizard-Schritt 2).
//
// Tor-Politik wie im Bestand (§8): critical/serious brechen, moderate/minor
// werden als Anhang dokumentiert.
import { test, expect, type Page, type TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { prerenderRouten } from '../src/lib/seo'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// Kein Freibrief: `link-in-text-block` war bis 30.9.2026 (W2·19) als «B-2-Marken-
// entscheid, no-underline» ausgenommen; der Entscheid ist seit dem R3-Nachzug
// 6.9.2026 aufgehoben (DESIGN-REGLEMENT F0.8), alle Flächen messen ohne
// Ausnahme grün. JEDE Regel gatet.

// In `a11y.e2e.ts` bereits mit demselben nackten Aufruf abgedeckt (Stand
// 5.9.2026) — hier ausgelassen, damit dieselbe Messung nicht zweimal läuft.
// Wer dort einen Prüfpunkt entfernt, muss ihn hier aus der Liste nehmen; der
// Wächter am Dateiende hält die Liste an die Realität gebunden.
const SCHON_IM_BESTAND = new Set([
  '/',                      // «Startseite»
  '/rechner/tagerechner',   // «Tagerechner»
  '/rechner/zustaendigkeit',// «Zuständigkeit mit PLZ-Auswahl-Kacheln»
  '/vorlagen/arbeitsvertrag', // «Vorlage Arbeitsvertrag»
  '/gesetze',               // «Gesetze — Kanton BS» / «International — Übersicht» (Säulen derselben Route)
  '/rechtsprechung',        // «Rechtsprechung — Übersicht»
  '/suche',                 // «Suche — Ergebnisseite (S5)»
])

// Theme deterministisch pinnen — identisch zu `a11y.e2e.ts` (ohne gespeicherte
// Wahl folgt die App `prefers-color-scheme` der Prüfmaschine, das Tor wäre
// maschinenabhängig). Reduzierte Bewegung, sonst misst axe die lc-reveal-
// Einblendung mitten in der Animation (halbtransparenter Text → Falsch-Rot).
async function oeffnen(page: Page, url: string) {
  await page.addInitScript(() => {
    try { localStorage.setItem('lexmetrik-thema', 'hell') } catch { /* privater Modus */ }
  })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  await page.goto(url)
}

async function axePruefen(page: Page, testInfo: TestInfo, punkt: string) {
  const ergebnis = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const schwer = ergebnis.violations.filter(
    (v) => (v.impact === 'critical' || v.impact === 'serious'),
  )
  const dokumentieren = ergebnis.violations.filter((v) => !schwer.includes(v))
  if (dokumentieren.length > 0) {
    await testInfo.attach(`${punkt}-befunde-dokumentiert.json`, {
      body: JSON.stringify(
        dokumentieren.map((v) => ({
          id: v.id, impact: v.impact, help: v.help,
          knoten: v.nodes.map((n) => n.target.join(' ')),
        })),
        null, 2,
      ),
      contentType: 'application/json',
    })
  }
  expect(
    schwer.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} Knoten, z. B. ${v.nodes[0]?.target.join(' ')} | ${(v.nodes[0]?.failureSummary ?? '').replace(/\n/g, ' ').slice(0, 200)}`),
    `axe ${punkt}: keine critical/serious-Verstösse`,
  ).toEqual([])
}

const FLAECHE = prerenderRouten().filter((r) => !SCHON_IM_BESTAND.has(r))

for (const route of FLAECHE) {
  test(`Fläche — ${route}`, async ({ page }, testInfo) => {
    // 60 s statt der globalen 30 s: axe.analyze braucht auf den grossen
    // Vorlagen-/Rubrik-Seiten auf dem gedrosselten CI-Runner mehr. Über
    // testInfo statt über `SCHWERE_SPECS` in playwright.config.ts — die
    // Datei-Glob dort trägt nur `a11y.e2e.ts`, und ein Config-Eingriff wäre
    // ein Fixpunkt mehr für eine reine Budget-Frage (§6.3 INFRASTRUKTUR).
    testInfo.setTimeout(60_000)
    await oeffnen(page, route)
    await expect(page.locator('h1').first()).toBeVisible()
    await axePruefen(page, testInfo, `flaeche${route.replace(/\//g, '-')}`)
  })
}

// ── Zwei Zustands-Vertreter, die auf KEINER prerenderten Route entstehen ─────
// Der Auftrag verlangt sie ausdrücklich: die Fläche oben misst nur den
// Leerzustand, und genau die Ergebnis- bzw. Wizard-Flächen tragen die
// dichtesten Bedien- und Zahlen-Elemente.

test('Zustand — Rechner mit Ergebnis (Tagerechner)', async ({ page }, testInfo) => {
  testInfo.setTimeout(60_000)
  await oeffnen(page, '/rechner/tagerechner')
  await expect(page.locator('h1').first()).toBeVisible()
  // Zwei Datumsfelder füllen → die Ergebnis-Karte (Verdikt, Zwischenwerte,
  // Kopier-Affordanz) rendert. Ohne Eingabe misst axe nur das leere Formular.
  // RL-24/UI-07 (W-12 (c), 24.9.2026): bis dahin schaltete die ZPO-Vorbelegung
  // oben den Voll-Tab beim ersten Tippen auf «Zivilprozess» (dessen Datumsfeld
  // ist nth(1)). Seither keine Vorbelegung — dieselbe Wahl ausdrücklich.
  await page.locator('input[name="einfache-frist-ferien"][value="zpo"]').check()
  const felder = page.locator('input[type="text"][inputmode="numeric"], input[placeholder*="TT."]')
  await felder.nth(0).fill('01.01.2026')
  await felder.nth(1).fill('31.03.2026')
  await expect(page.getByText(/\bTage\b/).first()).toBeVisible()
  await axePruefen(page, testInfo, 'zustand-rechner-ergebnis')
})

test('Zustand — Vorlagen-Wizard Schritt 2', async ({ page }, testInfo) => {
  testInfo.setTimeout(60_000)
  await oeffnen(page, '/vorlagen/nda')
  await expect(page.locator('h1').first()).toBeVisible()
  const weiter = page.getByRole('button', { name: /weiter/i }).first()
  await weiter.waitFor({ state: 'visible' })
  await weiter.click()
  // Schritt 2 steht, sobald der Zurück-Weg existiert (Schritt 1 hat ihn nicht).
  await expect(page.getByRole('button', { name: /zurück/i }).first()).toBeVisible()
  await axePruefen(page, testInfo, 'zustand-wizard-schritt-2')
})

// Posten 30.9.2026 (Prüfer B3, 26.9.2026): alle Zustände oben liefen bisher
// nur @1280 — dort steht ein Rechner GESTAPELT (Stufe `content`, einspaltig).
// Ab 72rem Kartenbreite (`@container/rechnerkarte`, W2·31-BILDSCHIRMBREITE B3)
// stellt `.lc-rechner-spalten` den Ergebnis- bzw. Fehlerplatz RECHTS neben die
// Eingabe — eine eigene DOM-Anordnung (grid-column 2), die axe nie sah. Slug
// und Auslöser wie im bestehenden Breiten-Wächter (`e2e/rechner-breite.e2e.ts`,
// FEHLERFAELLE): ZPO-Fristen, Datumsfeld geleert → `[data-fehlerbox]` nimmt
// den Ergebnisplatz ein (role="alert"). @1920 wie dort, damit dieselbe
// Kartenbreite (≥ 72rem) gemessen wird.
// ROT ZU BEKOMMEN (§6.7): in index.css `.lc-rechner-spalten > [data-fehlerbox]`-
// Grid-Platzierung streichen → Box bleibt links, dieser Test bleibt trotzdem
// grün (er prüft axe, nicht die Position — die Positions-Zusicherung trägt
// `rechner-breite.e2e.ts`); ein `aria-live`/Label-Verstoss NUR in der
// zweispaltigen Anordnung (z. B. verdeckter Fokusrahmen der Ergebnisspalte)
// zeigt sich dagegen NUR hier, nicht in `a11y.e2e.ts` (@1280 gestapelt).
test('Zustand — Rechner zweispaltig, Fehlerbox rechts (ZPO-Fristen @1920)', async ({ page }, testInfo) => {
  testInfo.setTimeout(60_000)
  await page.setViewportSize({ width: 1920, height: 1080 })
  await oeffnen(page, '/rechner/zpo-fristen')
  await expect(page.locator('h1').first()).toBeVisible()
  const feld = page.getByLabel('Auslösendes Ereignis (Datum)')
  await feld.fill('')
  await feld.blur()
  const box = page.locator('.lc-rechner-spalten > [data-fehlerbox]')
  await expect(box).toBeVisible()
  await expect(box).toHaveAttribute('role', 'alert')
  await axePruefen(page, testInfo, 'zustand-rechner-zweispaltig-fehlerbox')
})

// ── Wächter gegen stille Auslassung ─────────────────────────────────────────
// Die Ausnahmeliste oben ist der einzige Weg, eine Route aus dem Tor zu nehmen.
// Ein Tippfehler darin (oder eine im Bestand entfernte Route) würde sonst still
// eine Route ungetestet lassen — der Wächter macht ihn laut (§6.7: ein Tor, das
// nicht scheitern kann, ist gefährlicher als keines).
test('Wächter — Ausnahmeliste deckt sich mit den Routen', async () => {
  const alle = new Set(prerenderRouten())
  const verwaist = [...SCHON_IM_BESTAND].filter((r) => !alle.has(r))
  expect(verwaist, 'SCHON_IM_BESTAND nennt Routen, die es nicht (mehr) gibt').toEqual([])
  expect(FLAECHE.length + SCHON_IM_BESTAND.size, 'Fläche + Ausnahmen ≠ Routenzahl').toBe(alle.size)
})
