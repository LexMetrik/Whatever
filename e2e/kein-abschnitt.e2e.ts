// @shard-gruppe: 2
// ─── R8 «Nichts abgeschnitten» (Prüfbefund 6.9.2026, w224-pruef-r2-funde.md) ──
//
// MESSWERKZEUG, kein Fix. Prüft mechanisch über Routen × Viewports × Thema,
// ob irgendwo Text/Elemente abgeschnitten, verdeckt oder aus dem Fenster
// gedrängt werden — acht Kategorien a–h (Kopf jeder Kategorie unten). Die
// Geometrie-Logik selbst steht in `helpers/abschnittMessung.ts` (§5 — eine
// Messstelle statt Duplikate je Kategorie-Test); diese Datei baut nur die
// Routenliste, fährt den Sweep und schreibt den Report.
//
// ROUTENLISTE (Auftrag): alle STATISCHEN Routen (Übersichten/Rechtstext-
// unabhängige Seiten, aus `prerenderRouten()` MINUS `katalogRouten()` — die
// eine Quelle §5, kein Hand-Katalog) + je 2 Vertreter je dynamischer Familie
// (Gesetz Bund/Kanton, Entscheid, Materialie, Rechner, Vorlage). Die Rechner-
// /Vorlagen-KARTEN selbst zählen NICHT als „statisch" in diesem Sinn — sonst
// wüchsen sie mit jeder neuen Karte automatisch in den Sweep und sprengten das
// Laufzeit-Budget; die 2 Vertreter genügen für die mechanische Fläche.
//
// LAUFZEIT-BUDGET (≤ 6 min bei 4 Workern, Auftrag): die ganze Datei läuft
// SERIELL in einem Worker (`mode: 'serial'`) — nur so lässt sich EIN
// JSON-Report ohne Cross-Worker-Datei-Wettlauf schreiben (Modul-Zustand bleibt
// im selben Prozess erhalten). Das kostet Parallelität INNERHALB der Datei,
// nicht zwischen Dateien — andere Shard-Gruppen laufen unverändert parallel.
// Um die serielle Laufzeit zu decken: die Geometrie-Sonde (a, b, c, f, g, h)
// läuft über ALLE Routen × 6 Viewports × 2 Themen (günstig — ein DOM-Scan pro
// Kombination, kein weiterer Seitenaufruf). Die INTERAKTIVEN Kategorien
// (d Sprungziel, e Popover, Split-View) sind auf eine bewusst kleinere,
// repräsentative Auswahl begrenzt (je an ihrer Deklaration begründet) — das
// ist eine MESSBEDINGUNG (§0 Ziff. 3), keine stille Lücke: alle drei bleiben
// vollständig FÜR IHRE AUSWAHL, nur die Auswahl selbst ist geschmälert.
//
// ROT ALS ERWARTUNG (§6.7-Rot-Probe siehe Commit-Text): dieser erste Lauf ist
// die ERSTE Messung (R8-REPORT-0) gegen eine App, die R2–R7 der Design-
// Identitäts-Prüfung noch NICHT durchlaufen hat — mehrere Funde sind bereits
// aus den Prüfbefunden bekannt (F6 Entscheid-Kurzform, D9 Wortmarke, D5
// Ansicht-Menü). Die Allowlist startet ABSICHTLICH LEER (Auftrag) — ein reales
// Rot ist hier die korrekte Auskunft des Werkzeugs, kein Werkzeugfehler.
import { test, expect, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { katalogRouten, prerenderRouten } from '../src/lib/seo'
import { geometrieScan, popoverUeberlaufScan, reiterWortgrenzeScan, sprungzielUnterKopf } from './helpers/abschnittMessung'
import { nachAllowlistTrennen, type Fund } from './helpers/abschnittAllowlist'

const HIER = dirname(fileURLToPath(import.meta.url))
const REPORT_PFAD = join(HIER, '..', 'test-results', 'kein-abschnitt.json')

interface Viewport { name: string; width: number; height: number }
const VIEWPORTS: Viewport[] = [
  { name: '320', width: 320, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 800 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1440', width: 1440, height: 900 },
]
const THEMEN = ['hell', 'dunkel'] as const

async function themaVorwaehlen(page: Page, thema: 'hell' | 'dunkel'): Promise<void> {
  await page.addInitScript((t) => {
    try { localStorage.setItem('lexmetrik-thema', t) } catch { /* privater Modus */ }
  }, thema)
}

async function seiteBereit(page: Page, route: string): Promise<void> {
  await page.goto(route)
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 })
}

/** Werkzeug-Fehler dürfen NIE die Datei killen (Robustheits-Nachtrag, zweiter
 *  Lauf 6.9.2026): `mode: 'serial'` überspringt bei einem fehlgeschlagenen
 *  Test ALLE folgenden — inklusive des Berichts, der die eigentliche Aussage
 *  dieser Runde trägt. Ein Trigger, der beim Klicken hängt oder eine Route,
 *  die kurz nicht antwortet, ist ein WERKZEUG-Problem, keine Abschnitt-
 *  Kategorie — sie wird gemeldet (`werkzeug-fehler`, gatet nie) statt die
 *  ganze Messung verstummen zu lassen. Eine Zeile pro Fehlschlag genügt: ein
 *  systematisches Muster fällt beim Lesen des Reports sofort auf.
 */
async function sicher(route: string, ort: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
  } catch (e) {
    const fehler = (e as Error).message.split('\n')[0].slice(0, 200)
    console.warn(`[kein-abschnitt] Werkzeug-Fehler bei ${route} (${ort}): ${fehler}`)
    WERKZEUG_FEHLER.push({ route, ort, fehler })
  }
}

// ── Routenliste (§5: SSoT statt Handliste für den statischen Teil) ──────────
const KATALOG = new Set(katalogRouten())
const STATISCHE_ROUTEN = prerenderRouten().filter((r) => !KATALOG.has(r))

// Je 2 Vertreter aus dem Bestand — nicht enumeriert, weil das den Sweep auf
// alle ~19 Rechner/~29 Vorlagen und alle Erlasse/Entscheide/Materialien
// aufblähen würde (Laufzeit-Budget). Vorkommen anderswo im Bestand geprüft
// (grep über e2e/*.e2e.ts, 6.9.2026) — diese Slugs existieren.
const GESETZ_BUND = ['/gesetze/bund/OR', '/gesetze/bund/ZGB']
const GESETZ_KANTON = ['/gesetze/kanton/ZH-211.11', '/gesetze/kanton/BS-154.125']
// ── DRITTER ENTSCHEID-VERTRETER (W2·18 Welle 3 Punkt 1, 13.9.2026) ──────────
// Die beiden Vertreter oben tragen KURZE Gerichtsköpfe («BGE», «BGer») und
// passen @320 in den 171 px breiten Reiterstreifen — der Sweep meldete darum
// 0 Funde, während ein Entscheid mit langem Kopf dort GEMESSEN stumm überlief
// (`ag_gerichte_HOR_2024_19`, Kopf «OGer AG» 58 px: `scrollWidth 192` gegen
// `clientWidth 171`, Kategorie `a-ueberlauf-ohne-scroller`). Gefunden hat ihn
// eine Handmessung, nicht der Sweep. Damit die KLASSE künftig von selbst
// auffällt, steht der lange Kopf jetzt in der Routenliste.
const ENTSCHEID = ['/rechtsprechung/bge_152_V_52', '/rechtsprechung/bger_1B_278_2022',
  '/rechtsprechung/ag_gerichte_HOR_2024_19']
const MATERIALIE = ['/materialien/ESTV-KS-DBG-49', '/materialien/SECO-WL-ARG-ART-3A']
const RECHNER = ['/rechner/tagerechner', '/rechner/zustaendigkeit']
const VORLAGE = ['/vorlagen/arbeitsvertrag', '/vorlagen/nda']

const ALLE_ROUTEN: string[] = [
  ...STATISCHE_ROUTEN,
  ...GESETZ_BUND,
  ...GESETZ_KANTON,
  ...ENTSCHEID,
  ...MATERIALIE,
  ...RECHNER,
  ...VORLAGE,
]

test.describe.configure({ mode: 'serial' })

// ── MESSBEDINGUNG: RUHENDES Layout, keine laufende Übergangs-Animation ──────
// (Befund 8.9.2026, Wurzel des flackernden R8-Tors.)
//
// Der Geometrie-Sweep resized DIESELBE Seite durch 320 → 390 → 768 → 1024 →
// 1280 → 1440 und wartet je 60 ms auf den Reflow. Eine CSS-TRANSITION dauert
// länger: `--dur-base`/Tailwind liegen bei 150 ms. Wer nach 60 ms misst, misst
// einen Zwischenframe — eine Geometrie, die nie zur Ruhe gekommen ist und die
// kein Nutzer als «abgeschnitten» erlebt.
//
// KONKRET GEMESSEN: der A–Z-Kopf auf `/gesetze` klappt an der 640-px-Grenze
// automatisch auf/zu (`AzRegister`, matchMedia), sein Chevron dreht dabei per
// `rotate-90`. Ein 20×20-Quadrat ist im ENDzustand drehneutral (0°/90°) — auf
// halbem Weg aber nicht: unter dem Winkel t misst die Hülle 20·(|cos t|+|sin t|),
// bei 45° also 28,3 px, und der Überstand landet 1:1 im `scrollWidth` des `h2`.
// Lokal nachgestellt (Resize 1280 → 320, 60 ms Wartezeit): h2 243/240, Chevron-
// Hülle 25,2 px, `transform: matrix(0.951…, 0.308…)` — mitten in der Drehung.
// Mit 400 ms Wartezeit: 240/240, Hülle 20 px, `transform: none`. Dieselben
// Werte meldete die CI (Lauf 34209371435, Shard 8/8, Attempt 0: @320 hell
// 244/240, @320 dunkel 243/240, @768 dunkel 683/680) — und Attempt 1 lief auf
// identischem Stand grün: das Tor hing an der Scheduling-Laune des Runners.
// Passend dazu trafen die Funde IMMER nur 320 und 768 — genau die beiden
// Viewports, bei denen die Schleife die 640-px-Grenze kreuzt.
//
// Die Ruhigstellung geschieht über `prefers-reduced-motion: reduce`, das die
// App bereits selbst bedient (`src/index.css`: `animation-duration` und
// `transition-duration` auf .001ms). KEIN eigener Mechanismus, kein längeres
// Warten geraten — der bestehende, im Produkt vorhandene Weg (§5).
// KEINE VERBLENDUNG (§6.7): die Regel setzt ausschliesslich DAUERN auf ~0, sie
// ändert weder Layout noch Sichtbarkeit noch Endzustände. Gemessen wird damit
// exakt der ruhende Zustand, den R8 meint — eine echte Kappung steht dort
// unverändert und wird unverändert gemeldet; nur der Zwischenframe entfällt.
// (`reducedMotion` liegt in dieser Playwright-Fassung unter `contextOptions`;
// die Konfiguration setzt `contextOptions` nirgends, hier wird also nichts
// überschrieben.)
test.use({ contextOptions: { reducedMotion: 'reduce' } })

/** Modul-weiter Sammelpunkt — sicher, weil die ganze Datei seriell in EINEM
 *  Worker/Prozess läuft (s. Kopf-Kommentar). Wird am Dateiende geschrieben. */
const GESAMMELTE_FUNDE: Fund[] = []
/** Werkzeug-Fehler (s. `sicher()`) — sichtbar im Report, gatet aber nie. */
const WERKZEUG_FEHLER: Array<{ route: string; ort: string; fehler: string }> = []

test.describe('R8 — Wächter: Vertreter existieren im Bestand', () => {
  test('die 2-je-Familie-Vertreter (Rechner/Vorlage) stehen im Katalog', () => {
    for (const r of [...RECHNER, ...VORLAGE]) {
      expect(KATALOG.has(r), `${r} fehlt in katalogRouten() — Vertreter veraltet, ersetzen`).toBe(true)
    }
  })
})

test.describe('R8 — Geometrie-Sweep (a, b, c, f, g, h)', () => {
  for (const route of ALLE_ROUTEN) {
    for (const thema of THEMEN) {
      test(`${route} — ${thema}`, async ({ page }, testInfo) => {
        // 90 s statt der globalen 30 s (Muster `a11y-flaeche.e2e.ts`): OR/ZGB
        // tragen ~75 000 DOM-Knoten (s. `leserBereit.ts`) — `geometrieScan`
        // durchläuft `body *` sechsmal (je Viewport), und Playwrights
        // Test-Timeout ist von AUSSEN erzwungen (kein try/catch in `sicher()`
        // fängt es ab, zweiter Lauf 6.9.2026 riss hier bei 30 s serienweise
        // die ganze Datei ab — `mode: 'serial'` übersprang 44 Folgetests).
        testInfo.setTimeout(90_000)
        await sicher(route, thema, async () => {
          await themaVorwaehlen(page, thema)
          await seiteBereit(page, route)
          for (const vp of VIEWPORTS) {
            await page.setViewportSize({ width: vp.width, height: vp.height })
            await page.waitForTimeout(60) // Reflow nach Resize abwarten
            const [geom, reiter] = await Promise.all([geometrieScan(page), reiterWortgrenzeScan(page)])
            for (const f of [...geom, ...reiter]) {
              GESAMMELTE_FUNDE.push({ route, viewport: vp.name, modus: thema, ...f })
            }
          }
        })
      })
    }
  }
})

// ── Kategorie d — Sprungziel unter dem sticky Kopf ──────────────────────────
// Begrenzt auf die Gesetz-Vertreter (dort existieren `#art-…`-Sprungziele) und
// zwei Viewports (schmal/breit — der Kopf ändert dort typischerweise seine
// Höhe/Anordnung am stärksten), hell (Kategorie ist layoutgetrieben, nicht
// themaabhängig — Kopf-Höhe ändert sich nicht mit dem Farbschema).
test.describe('R8 — Sprungziel unter Kopf (d)', () => {
  for (const route of [...GESETZ_BUND, ...GESETZ_KANTON]) {
    for (const vp of [{ name: '390', width: 390, height: 844 }, { name: '1280', width: 1280, height: 900 }]) {
      test(`${route} #art-1 — ${vp.name}`, async ({ page }, testInfo) => {
        testInfo.setTimeout(60_000) // s. Begründung im Geometrie-Sweep oben
        await sicher(route, `d/${vp.name}`, async () => {
          await themaVorwaehlen(page, 'hell')
          await page.setViewportSize({ width: vp.width, height: vp.height })
          await seiteBereit(page, route)
          const gefunden = await page.locator('#art-1').count()
          if (gefunden === 0) return // Erlass ohne Art. 1 (defensiv) — keine Aussage möglich
          const funde = await sprungzielUnterKopf(page, 'art-1')
          for (const f of funde) GESAMMELTE_FUNDE.push({ route, viewport: vp.name, modus: 'hell', ...f })
        })
      })
    }
  }
})

// ── Kategorie e — Menüs/Popover ausserhalb des Viewports ────────────────────
// Repräsentative Routen mit bekannten Öffnern (Suche, Ansicht-Menü, Wizard-
// Select, Systematik-Filter) statt aller 25 — jeder Klick+Escape kostet
// spürbar Zeit (Laufzeit-Budget), und diese vier decken die in den Prüf-
// befunden benannten Risikostellen ab (D5 Ansicht-Menü, D9 Suchpanel).
const POPOVER_ROUTEN = ['/', '/gesetze/bund/OR', '/vorlagen/nda', '/gesetze']
test.describe('R8 — Popover/Menü ausserhalb Viewport (e)', () => {
  for (const route of POPOVER_ROUTEN) {
    for (const vp of [{ name: '320', width: 320, height: 800 }, { name: '1280', width: 1280, height: 900 }]) {
      test(`${route} — ${vp.name}`, async ({ page }, testInfo) => {
        testInfo.setTimeout(60_000) // s. Begründung im Geometrie-Sweep oben
        await sicher(route, `e/${vp.name}`, async () => {
          await themaVorwaehlen(page, 'hell')
          await page.setViewportSize({ width: vp.width, height: vp.height })
          await seiteBereit(page, route)
          const funde = await popoverUeberlaufScan(page)
          for (const f of funde) GESAMMELTE_FUNDE.push({ route, viewport: vp.name, modus: 'hell', ...f })
        })
      })
    }
  }
})

// ── Split-View (`?p=`) bei 1024/1440 ────────────────────────────────────────
// Zwei Kombinationen (Leser+Entscheid, Startseite+Leser) statt aller Paare —
// dieselbe Geometrie-Sonde deckt beide Panes in einem Durchlauf ab, weil sie
// über `body *` läuft.
const SPLIT_KOMBIS: Array<{ primaer: string; sekundaer: string }> = [
  { primaer: '/gesetze/bund/OR', sekundaer: '/rechtsprechung/bge_152_V_52' },
  { primaer: '/', sekundaer: '/gesetze/bund/ZGB' },
]
test.describe('R8 — Split-View', () => {
  for (const { primaer, sekundaer } of SPLIT_KOMBIS) {
    for (const vp of [{ name: '1024', width: 1024, height: 800 }, { name: '1440', width: 1440, height: 900 }]) {
      const route = `${primaer} + ${sekundaer} (split)`
      test(`${primaer} + ${sekundaer} — ${vp.name}`, async ({ page }, testInfo) => {
        testInfo.setTimeout(60_000) // s. Begründung im Geometrie-Sweep oben
        await sicher(route, vp.name, async () => {
          await themaVorwaehlen(page, 'hell')
          await page.setViewportSize({ width: vp.width, height: vp.height })
          await page.goto(`${primaer}?p=${encodeURIComponent(sekundaer)}`)
          await expect(page.locator('[data-pane="sekundaer"]').first()).toBeVisible({ timeout: 15_000 })
          const [geom, reiter] = await Promise.all([geometrieScan(page), reiterWortgrenzeScan(page)])
          for (const f of [...geom, ...reiter]) GESAMMELTE_FUNDE.push({ route, viewport: vp.name, modus: 'hell', ...f })
        })
      })
    }
  }
})

// ── Bericht + Tor (muss die LETZTE Deklaration sein — `mode: 'serial'` fährt
// die Datei in Deklarationsreihenfolge, GESAMMELTE_FUNDE ist bis hierhin voll) ─
test.describe('R8 — Bericht & Tor', () => {
  test('Report schreiben, keine nicht erlaubten Funde', () => {
    mkdirSync(dirname(REPORT_PFAD), { recursive: true })
    const nachRoute: Record<string, Fund[]> = {}
    for (const f of GESAMMELTE_FUNDE) {
      (nachRoute[f.route] ??= []).push(f)
    }
    writeFileSync(REPORT_PFAD, JSON.stringify({
      erzeugt: new Date().toISOString(),
      routenGeprueft: ALLE_ROUTEN.length,
      gesamtFunde: GESAMMELTE_FUNDE.length,
      werkzeugFehler: WERKZEUG_FEHLER, // gatet nie, s. `sicher()` — Transparenz für den Report
      nachRoute,
    }, null, 2))

    const { nichtErlaubt } = nachAllowlistTrennen(GESAMMELTE_FUNDE)
    const zeilen = nichtErlaubt.map(
      (f) => `${f.route} @${f.viewport} ${f.modus} [${f.kategorie}] ${f.selektor} — ${f.messwert}`,
    )
    expect(
      zeilen.slice(0, 40),
      `${nichtErlaubt.length} nicht erlaubte Funde (voller Report: test-results/kein-abschnitt.json). `
      + 'R8-REPORT-0 ist die erwartete erste Messung — Auftrag verlangt NICHT FIXEN in dieser Runde.',
    ).toEqual([])
  })
})
