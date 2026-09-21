// @shard-gruppe: 8
// ─── QS-UI 8b · Tor «Verdikt zuerst» ────────────────────────────────────────
//
// Der Informationshierarchie-Pass (FAHRPLAN-UI-QUALITAET.md §2) hat die Ordnung
// im Ergebnisblock geradegezogen. Ohne Tor wäre das ein Einmal-Zustand: die
// Ordnung von R4/R6 lebt in 14 Formularen, und jede neue Visualisierung, jede
// neue Prosa-Zeile kann sie still wieder kippen. Genau so war sie gekippt —
// `ErbteilungForm` schob Tabelle und Quoten-Balken zwischen Eckdaten und
// Verdikt, und niemand merkte es, weil nichts es mass.
//
// Gemessen werden fünf Invarianten, alle aus geltenden Regeln, keine neuen:
//
//  I1  R4 Ziff. 2 / B1 — das Verdikt steht VOR der Herleitung: vor den
//      Aufklappern «Rechenweg»/«Annahmen» und vor jeder abgeleiteten Ansicht
//      (Tabelle, Kalender, Timeline, Balken) desselben Blocks. Ansichten
//      tragen dafür `data-ansicht`; `table, svg` bleibt Auffangnetz.
//  I2  R6 Ziff. 2 — «Warnungen sind nie weiter vom Verdikt entfernt als eine
//      Bildschirmhöhe.» Diese Regel stand seit 11.6.2026 im Reglement und war
//      bis QS-UI 8b ungegatet. Zwei Schranken (Reglement + gemessene
//      Regression) plus Skip-Ausweis — Begründung bei den Konstanten unten.
//  I3  B2 — Fliesstext im Ergebnisblock hält die Lesespalte (`max-w-reading`,
//      40rem). Ausgenommen sind ausdrücklich Kacheln und Tabellen (D-1.5:
//      «NUR Prosa-<p>; Kacheln/lc-tile/Tabellen bleiben unbegrenzt») — und
//      seit dem 5.9.2026 alles, was NICHT WIRKLICH SICHTBAR ist (Restliste
//      Ziff. 6, Herleitung unten bei `SICHTBAR`).
//  I4  Die Sprungmarke zum Ergebnis ist **erreichbar** — sichtbar, im Bild und
//      am Klickpunkt nicht verdeckt —, solange das Ergebnis nicht im Bild
//      steht, auf JEDER Breite. Sie trug bis QS-UI 8b `sm:hidden`, war also
//      auf Desktop tot, obwohl dort kein Verdikt im ersten Viewport steht
//      (gemessen 1.32–3.15 Bildschirmhöhen).
//      Warum nicht bloss `display !== 'none'`: Die Marke ist `position: fixed`
//      und lebt im `ErgebnisBlock`, der während seiner `lc-reveal`-Einblendung
//      (220 ms) ein `transform` trägt — ein transformierter Vorfahr wird zum
//      enthaltenden Block für `fixed`. Ein Tor, das nur die Sichtbarkeit
//      prüft, würde eine Marke durchwinken, die irgendwo im Dokument klebt
//      statt in der Bildschirmecke (§6.7: ein Tor, das nicht scheitern kann,
//      ist gefährlicher als keines). Geprüft wird darum die Geometrie.
//  I5  Die Sprungmarke druckt NICHT mit. Sie ist viewport-`fixed`; im Druck
//      läge sie sonst auf jeder Seite über dem Inhalt.
//
// Reine Darstellungs-Prüfung (§3): kein Wortlaut, kein Wert, keine Frist wird
// geprüft — nur Reihenfolge, Abstand und Breite.
import { test, expect, type Page } from '@playwright/test'
import { DROSSEL, REAKTIONS_BUDGET, REAKTIONS_LATTE, CONTAINER_BUDGET_CI } from './helpers/budgets'

// QS-UI (e) 15.8.2026 — Tor meldete falsch rot (3–6 von 65 unter --workers≥14,
// wechselnde Routen): `.lc-route` blendet per `lc-fade-in` ab opacity:0 ein
// (index.css:1128); landet `page.evaluate` auf dem Null-Frame, ist
// `checkVisibility({opacityProperty:true})` für JEDEN Nachfahren false — I8/I9/I10
// kippten ohne Defekt (Beleg: routeOpacity="0" instrumentiert, FAHRPLAN-UI-QUALITAET
// §2.3). Reduced-Motion schaltet die Animation ab (index.css:1186) — dasselbe
// Muster wie a11y/hist-ansicht/rechtsprechung-richter; kein waitForTimeout.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

// ── SICHTBAR · Restliste Ziff. 6, nachgezogen 5.9.2026 ──────────────────────
// Methodischer Fund aus Teil 2 (FAHRPLAN-UI-QUALITAET, Archiv §2.2): Chromium
// liefert `getBoundingClientRect` weiterhin für Absätze in einem GESCHLOSSENEN
// `<details>` — `::details-content` arbeitet mit `content-visibility: hidden`,
// nicht mit `display: none`. Wer nur die Rects prüft, misst Text, den niemand
// sieht: auf /vorlagen/gmbh-gruendung meldete die erste Messung 21
// Lesespalten-Verstösse, echt waren drei. I6 prüft darum seit Teil 2
// `checkVisibility()`; I3 (Teil 1) tat es NICHT und trug damit dieselbe blinde
// Stelle.
//
// Rot-Beweis am unveränderten Stand, 5.9.2026, /rechner/verzugszins @1280×800
// (Sonde: derselbe DOM, beide Filterketten nebeneinander, 900-px-Absatz
// injiziert):
//   Fall A · Absatz in geschlossenem <details> → alt 1 Verstoss, neu 0 (Falsch-Rot)
//   Fall B · Absatz sichtbar                   → alt 1 Verstoss, neu 1 (Tor beisst)
// Fall B ist die §6.7-Gegenprobe: die Verengung macht das Tor genauer, nicht
// stumpf.
//
// REIHENFOLGE (Korrektur 15.8.2026, Archiv-Restliste Ziff. 6): erst der
// Settle-Fix (Ziff. 7), dann dieses Nachziehen — `checkVisibility` trägt sonst
// die Falsch-Rot-Klasse des lc-fade-in-Nullframes mit. Der Settle-Fix steht
// seit PR #522 (`beforeEach` oben); nachgemessen 5.9.2026: 2 × 65/65 grün
// unter `--workers=16` (kalt) und `--workers=14` (warm).
const SICHTBAR = { contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true } as const

// Rechner-Flächen, die ohne Eingabe schon ein Ergebnis zeigen (Live-Berechnung).
// Eingabe-gegatete Flächen (Streitwert, Prozesskosten, Betreibungskosten,
// Notariat/Grundbuch, Zuständigkeit, Gerichtszitat) sind hier bewusst NICHT
// aufgeführt: sie tragen im Leerzustand den `ErgebnisPlatzhalter` und werden von
// ihren eigenen Fluss-Specs abgedeckt.
const FLAECHEN = [
  '/rechner/tagerechner',
  '/rechner/zpo-fristen',
  '/rechner/schkg-fristen',
  '/rechner/verjaehrung',
  '/rechner/kuendigung',
  '/rechner/mietrecht',
  '/rechner/erb-fristen',
  '/rechner/erbteilung',
  '/rechner/gewaehrleistung',
  '/rechner/verzugszins',
  '/rechner/teuerung',
  '/rechner/bgg-fristen',
  '/rechner/verjaehrung-board',
  '/rechner/inkasso-strecke',
] as const

// Ergebnisblöcke ohne ErgebnisAnzeige — abschliessend, aus DESIGN-REGLEMENT-
// RECHNER R12. Ein NEUER Block ohne Verdikt macht das Tor rot; wer eine echte
// Ausnahme baut, trägt sie hier UND in R12 nach (keine stille Abweichung).
const OHNE_VERDIKT_ERLAUBT: readonly string[] = [
  // R12 Ziff. 1 — Tagerechner-Schnellrechner (EinfacheFristForm): bewusst
  // minimal, sein PDF-/Verdikt-Fall ist der jeweilige Regime-Rechner.
  'lc-ergebnis-einfach',
]

// 40rem Lesespalte + 1rem Toleranz für Rahmen/Innenabstand des Trägers.
const LESESPALTE_MAX = 16 * 41

// ── I2-Schranken (R6 Ziff. 2) ───────────────────────────────────────────────
// ZWEI Schranken, bewusst getrennt:
//
// (1) Die REGLEMENT-Schranke ist eine Bildschirmhöhe — so steht R6 Ziff. 2 da,
//     und so wird sie geprüft (unten gegen `hoehe`).
// (2) Die REGRESSIONS-Schranke ist gemessen. Ohne sie wäre I2 ein Tor, das
//     nicht scheitern kann (§6.7): der gemessene Abstand liegt über alle 22
//     Blöcke mit Vorbehalten bei 48–213 px gegen 800/844 px Schwelle, also
//     Faktor 3.8 Reserve. Die Werte sind quantisiert (48 · 75 · 103 · 130 ·
//     158 · 185 · 213) — der Schritt von ~27 px ist eine Zeile Vorbehalt.
//     320 px lässt also rund vier Zeilen Textwachstum zu und feuert trotzdem,
//     sobald zwischen Verdikt und Vorbehalte etwas EINGESCHOBEN wird — und das
//     ist der Fall, gegen den R6 Ziff. 2 geschrieben ist: jede Karte, jede
//     Kachelreihe, jede Visualisierung misst ein Vielfaches davon.
//     Das ist eine Regressions-Schranke auf gemessener Grundlage, KEINE neue
//     Regel — dieselbe Bauart wie die Budgets in `check:perf-budget`.
const WARN_ABSTAND_REGRESSION = 320

// ── I7-Schranke (Teil 2, Rechtsprechung) ────────────────────────────────────
// Regressions-Schranke auf gemessener Grundlage, gleiche Bauart wie oben.
// Gemessen 4.8.2026 über vier Entscheid-Flächen (BGE mit Regeste, BGE, BS,
// AG), beide Breiten: 0.56–0.62 Bildschirmhöhen Desktop, 0.68–0.83 mobil.
const VERDIKT_BH_REGRESSION = 1.2

// ── I8-Schranken (Teil 2, Vorlagen) ─────────────────────────────────────────
// Tiefe der «Stelle des Dokuments» in Bildschirmhöhen, gemessen 4.8.2026 über
// alle 29 Vorlagen-Flächen mit Dokument-Ausgabe (Tabelle im Fahrplan §2.1).
// Die Verteilung hat zwei klar getrennte Familien — darum zwei Schranken statt
// einer, die beide durchwinken müsste und damit nichts mehr fände:
//   Wizard-Flächen (26): Desktop 0.65–1.08 · mobil 1.50–2.61
//   Mappen-Flächen (2):  Desktop 2.50/5.09 · mobil 4.24/8.25
//
// ── NEU GEMESSEN 6.9.2026 (W2·24-DESIGN-IDENTITAET, §6.3-Deklaration) ────────
// Das Tor hat GENAU DAS GEMELDET, WOFÜR ES GEBAUT IST: über dem Dokument ist
// etwas Neues eingeschoben worden. Gemessen @1280×800 auf `/vorlagen/…`:
//   Kopfzone VOR dieser Runde:  Titelblatt 64 + Brotkrumen-Leiste 37      = 101 px
//   Kopfzone SEIT R2/R4/F8:     + Arbeitsleiste 34 + Ausgabe-Zeile 31     = 166 px
// Die 65 px treffen JEDE Route gleich (beide Leisten sind app-weit, nicht
// vorlagen-spezifisch) — das ist eine Verschiebung der ganzen Familie um
// 65/800 = 0.081 Bildschirmhöhen, kein Einzelwert-Ausreisser (§0 Ziff. 3).
// Verteilung nach der Verschiebung, alle 11 Wizard-Flächen mit Dokument:
//   0.810 patientenverfuegung · 0.810 vollmacht · 0.813 schlichtungsgesuch-bs
//   0.815 testament · 0.843 ag-gruendung · 0.851 rubrum · 0.851 verjaehrungs-
//   verzicht · 0.887 mahnung · 0.910 klage-vereinfacht · 1.011 nda
//   · 1.212 arbeitsvertrag (die längste Wizard-Fläche: 7 Schritte, dazu der
//     Vertragstyp-Wähler — sie lag mit 1.131 auch vorher an der Spitze).
// Die Schranke zieht darum auf 1.25 nach. Sie wird dabei ENGER, nicht weiter:
// über dem gemessenen Maximum blieben zuvor 0.12 Bildschirmhöhen Luft (1.08 →
// 1.2), jetzt sind es 0.038 (1.212 → 1.25). Wer über dem Dokument das Nächste
// einschiebt, wird also FRÜHER rot gestellt als bisher.
// ROT ZU BEKOMMEN (§6.7): die Ausgabe-Zeile in `layout/Shell.tsx` ein zweites
// Mal einhängen (+31 px) ⇒ arbeitsvertrag steht bei 1.251 und der Fall reisst.
const DOKUMENT_BH_REGRESSION = { desktop: 1.25, mobil: 2.8 } as const

// Die zwei Mappen-Flächen sind KONSTRUKTIONSBEDINGT tief: vor der Mappe steht
// die Checkliste, die überhaupt erst bestimmt, welche Dokumente entstehen. Das
// umzubauen wäre ein Eingriff in den Seiten-Aufbau (R1/FE-1) und damit ein
// anderer Schritt — dieselbe Grenzziehung, die Teil 1 beim Tagerechner gezogen
// hat. Ihre Kompensation ist die Sprungmarke, und die prüft I9 auf BEIDEN
// Breiten. Gegenprobe: Wer hier steht und NICHT tief liegt, macht das Tor rot —
// sonst verrottet der Ausweis still, sobald jemand die Seite doch verkürzt.
const TIEF_AUSGEWIESEN: readonly string[] = [
  '/vorlagen/gmbh-gruendung',
  '/vorlagen/kapitalerhoehung',
]

// Flächen, deren Vorgabe-Eingabe KEINE Vorbehalte erzeugt — abschliessend und
// gemessen (4.8.2026, beide Breiten). Der Ausweis ist die Gegenprobe zum Skip:
// eine Fläche, die HIER NICHT steht und trotzdem ohne Vorbehalte kommt, macht
// das Tor rot. Damit fällt auf, wenn Warnungen still verschwinden — §8 ist der
// Grund, aus dem I2 überhaupt existiert, und ein stummer Skip wäre genau die
// Lücke, die §8 verbietet.
const OHNE_VORBEHALTE_ERWARTET: readonly string[] = [
  '/rechner/verjaehrung',
  '/rechner/teuerung',
  '/rechner/bgg-fristen',
]

type Befund = {
  id: string
  ohneVerdikt: boolean
  herleitungVorVerdikt: string[]
  ansichtVorVerdikt: number
  warnAbstand: number | null
  breiteProsa: { breite: number; anfang: string }[]
  sprung: { sichtbar: boolean; imBild: boolean; frei: boolean; hoehe: number; breite: number } | null
}

async function erhebe(page: Page, viewportHoehe: number): Promise<Befund[]> {
  return page.evaluate(([vh, sichtbar]: [number, typeof SICHTBAR]) => {
    const oben = (el: Element) => el.getBoundingClientRect().top + window.scrollY
    const bloecke = [...document.querySelectorAll('[id^="lc-ergebnis"]')]
    return bloecke.map((b) => {
      // Der Verdikt-Satz ist das Display-<p> im Kopf der ErgebnisAnzeige.
      const verdikt = b.querySelector('p.font-display.font-semibold')
      // Die Marke steht seit QS-UI 8b NEBEN dem Block (sie ist `fixed` und darf
      // nicht im transform-animierten Wrapper liegen) — darum dokumentweit
      // suchen und über das Sprungziel dem Block zuordnen.
      const sprung = document.querySelector(`a[href="#${b.id}"]`)
      const befund = {
        id: b.id,
        ohneVerdikt: !verdikt,
        herleitungVorVerdikt: [] as string[],
        ansichtVorVerdikt: 0,
        warnAbstand: null as number | null,
        breiteProsa: [] as { breite: number; anfang: string }[],
        sprung: null as null | { sichtbar: boolean; imBild: boolean; frei: boolean; hoehe: number; breite: number },
      }
      if (sprung) {
        const r = sprung.getBoundingClientRect()
        const mx = r.left + r.width / 2
        const my = r.top + r.height / 2
        befund.sprung = {
          sichtbar: getComputedStyle(sprung).display !== 'none',
          // Vollständig im Bild — nicht «existiert irgendwo im Dokument».
          imBild: r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight + 1 && r.right <= window.innerWidth + 1,
          // Am eigenen Mittelpunkt oberstes Element, also wirklich klickbar.
          frei: sprung.contains(document.elementFromPoint(mx, my)) || document.elementFromPoint(mx, my) === sprung,
          hoehe: Math.round(r.height),
          breite: Math.round(r.width),
        }
      }
      // I3 gilt auch ohne Verdikt (der Schnellrechner trägt Prosa).
      befund.breiteProsa = [...b.querySelectorAll('p')]
        // Echte Sichtbarkeit zuerst (Restliste Ziff. 6, s. oben bei `SICHTBAR`):
        // ein geschlossenes `<details>` liefert weiterhin Rect-Masse.
        .filter((p) => p.checkVisibility(sichtbar))
        .filter((p) => (p.textContent || '').trim().length > 90)
        // Kacheln und Tabellen sind ausgenommen (D-1.5); `sr-only`-Absätze sind
        // 1 px breit und tragen keine Lesespalte.
        .filter((p) => !p.closest('.lc-tile') && !p.closest('table') && p.getBoundingClientRect().width > 1)
        .filter((p) => p.getBoundingClientRect().width > 16 * 41)
        .map((p) => ({ breite: Math.round(p.getBoundingClientRect().width), anfang: (p.textContent || '').trim().slice(0, 44) }))
      if (!verdikt) return befund
      const yVerdikt = oben(verdikt)
      befund.herleitungVorVerdikt = [...b.querySelectorAll('button')]
        .filter((k) => /Rechenweg|Annahmen/.test(k.textContent || '') && oben(k) < yVerdikt)
        .map((k) => (k.textContent || '').trim().slice(0, 24))
      // Abgeleitete Ansichten: `data-ansicht` ist die EXPLIZITE Markierung
      // (Kalender, Zeitstrahlen, Balken, Erben-Tabelle); `table, svg` bleibt als
      // Auffangnetz für künftige Ansichten, die die Markierung vergessen.
      // Ohne `data-ansicht` sah I1 die vier Divs-Ansichten nicht: eine unter den
      // FristenKalender geschobene ErgebnisAnzeige liess das Tor grün
      // (§9-Bug-Check zu PR #440, B2 — reproduziert, dann behoben).
      befund.ansichtVorVerdikt = [...b.querySelectorAll('[data-ansicht], table, svg')]
        .filter((t) => oben(t) < yVerdikt).length
      // I2: warn-SPEZIFISCHER Griff. `[class*="bg-warn-bg"]` traf auch
      // dekorative Warn-Tönung (Quoten-Balken der Erbteilung) — siehe
      // ErgebnisAnzeige.tsx.
      const warn = b.querySelector('[data-vorbehalte]')
      if (warn) befund.warnAbstand = Math.round(Math.abs(oben(warn) - yVerdikt))
      void vh
      return befund
    })
  }, [viewportHoehe, SICHTBAR] as [number, typeof SICHTBAR])
}

for (const [breite, hoehe, name] of [[1280, 800, 'Desktop'], [390, 844, 'Mobil']] as const) {
  test.describe(`Verdikt zuerst — ${name}`, () => {
    for (const pfad of FLAECHEN) {
      test(`${pfad}`, async ({ page }) => {
        await page.setViewportSize({ width: breite, height: hoehe })
        await page.goto(pfad)
        await page.locator('[id^="lc-ergebnis"]').first().waitFor()
        const befunde = await erhebe(page, hoehe)
        expect(befunde.length, 'mindestens ein Ergebnisblock').toBeGreaterThan(0)

        for (const b of befunde) {
          // I3 — Lesespalte (gilt für jeden Block).
          expect(b.breiteProsa, `B2 · Fliesstext über der Lesespalte (${LESESPALTE_MAX} px) in #${b.id}`).toEqual([])

          if (b.ohneVerdikt) {
            // Kein Verdikt ist nur zulässig, wo R12 es abschliessend erlaubt.
            expect(OHNE_VERDIKT_ERLAUBT, `R4 Ziff. 2 · Ergebnisblock #${b.id} ohne ErgebnisAnzeige — als R12-Ausnahme nachtragen oder Verdikt ergänzen`)
              .toContain(b.id)
            continue
          }
          // I1 — Verdikt vor Herleitung und vor abgeleiteter Ansicht.
          expect(b.herleitungVorVerdikt, `R4/B1 · Herleitungs-Aufklapper über dem Verdikt in #${b.id}`).toEqual([])
          expect(b.ansichtVorVerdikt, `R4/B1 · abgeleitete Ansicht (Tabelle/Grafik) über dem Verdikt in #${b.id}`).toBe(0)
          // I2 — Vorbehalte nahe am Verdikt. Zwei Schranken (s. oben).
          if (b.warnAbstand !== null) {
            expect(b.warnAbstand, `R6 Ziff. 2 · Vorbehalte weiter als eine Bildschirmhöhe (${hoehe} px) vom Verdikt in #${b.id}`)
              .toBeLessThanOrEqual(hoehe)
            expect(b.warnAbstand, `R6 Ziff. 2 · Regressions-Schranke gerissen — zwischen Verdikt und Vorbehalte ist etwas eingeschoben worden (gemessener Bestand 48–213 px) in #${b.id}`)
              .toBeLessThanOrEqual(WARN_ABSTAND_REGRESSION)
          } else {
            // Skip-Ausweis: Wo Vorbehalte fehlen, muss das erwartet sein.
            expect(OHNE_VORBEHALTE_ERWARTET, `§8 · #${b.id} auf ${pfad} zeigt KEINE Vorbehalte — entweder sind Warnungen still verschwunden, oder die Fläche gehört in OHNE_VORBEHALTE_ERWARTET`)
              .toContain(pfad)
          }
        }

        // I4 — die Sprungmarke ist erreichbar, solange das Ergebnis nicht im Bild
        // steht. Beim Laden steht der Seitenanfang im Bild, das Ergebnis nie
        // (gemessen auf allen 14 Flächen). Geprüft werden die Blöcke, die eine
        // Marke tragen — `sprung={false}`-Blöcke haben bewusst keine.
        const mitMarke = befunde.filter((b) => b.sprung !== null)
        expect(mitMarke.length, 'mindestens ein Block mit Sprungmarke').toBeGreaterThan(0)
        const erreichbar = mitMarke.filter((b) => b.sprung!.sichtbar)
        expect(erreichbar.length,
          `Sprungmarke auf ${name} unsichtbar, obwohl das Ergebnis nicht im ersten Viewport steht`).toBeGreaterThan(0)
        for (const b of erreichbar) {
          expect(b.sprung!.imBild, `Sprungmarke #${b.id} liegt nicht vollständig im Bild (fixed gegen einen transformierten Vorfahren?)`).toBe(true)
          expect(b.sprung!.frei, `Sprungmarke #${b.id} ist an ihrem Klickpunkt verdeckt`).toBe(true)
          // A9: Tap-Ziel. 36 px Höhe ist der Bestand der `lc-btn-sm`-Klasse;
          // die Marke darf nie darunter fallen.
          expect(b.sprung!.hoehe, `Tap-Ziel der Sprungmarke #${b.id} zu flach`).toBeGreaterThanOrEqual(32)
          expect(b.sprung!.breite, `Tap-Ziel der Sprungmarke #${b.id} zu schmal`).toBeGreaterThanOrEqual(44)
        }
      })
    }
  })
}

// ── I5 · Die Sprungmarke druckt nicht mit ───────────────────────────────────
// §9-Bug-Check zu PR #440, B1: Der Druckblock in `src/index.css` listete
// `.lc-btn` — die Varianten `.lc-btn-outline/-primary/-ghost` entstehen aber
// über `@apply lc-btn`, und `@apply` inlined Deklarationen, es vergibt keine
// Klasse. Der Selektor griff also nie. Unbemerkt blieb das, weil fast alle
// Bedienelemente `<button>` sind; es traf die button-gestylten LINKS. Mit dem
// Wegfall von `sm:hidden` (QS-UI 8b) betraf es die Sprungmarke auf jeder
// Breite — auf schmalen Schirmen druckte sie schon vorher mit.
// Geprüft wird das ECHTE Druckmedium, nicht die CSS-Quelle: eine Regel, die
// man nur im Stylesheet nachliest, kann genau so danebengreifen wie diese es
// tat. Beide Breiten, weil die Marke früher breitenabhängig war.
for (const [breite, hoehe, name] of [[1280, 800, 'Desktop'], [390, 844, 'Mobil']] as const) {
  test(`Sprungmarke druckt nicht mit — ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: hoehe })
    await page.goto('/rechner/verjaehrung')
    await page.locator('[id^="lc-ergebnis"]').first().waitFor()

    // Gegenprobe zuerst: am Bildschirm IST die Marke da. Ohne sie wäre der
    // Druck-Nachweis wertlos (er würde auch bei fehlender Marke bestehen).
    const marke = page.locator('a[href^="#lc-ergebnis"]').first()
    await expect(marke, 'Vorbedingung: die Marke ist am Bildschirm sichtbar').toBeVisible()

    await page.emulateMedia({ media: 'print' })
    await expect(marke, 'Sprungmarke erscheint im Ausdruck').toBeHidden()

    // Und keine weiteren Bedienelemente im Ausdruck (dieselbe Fehlerklasse).
    const bedienelementeImDruck = await page.evaluate(() =>
      [...document.querySelectorAll('[class*="lc-btn"]')]
        .filter((el) => getComputedStyle(el).display !== 'none')
        .map((el) => el.tagName + '.' + [...el.classList].filter((c) => c.startsWith('lc-btn')).join('.')),
    )
    expect(bedienelementeImDruck, 'Bedienelemente im Ausdruck').toEqual([])

    await page.emulateMedia({ media: 'screen' })
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// TEIL 2 · Rechtsprechungs- und Vorlagen-Flächen (QS-UI 8b Teil 2, 4.8.2026)
// ═══════════════════════════════════════════════════════════════════════════
//
// Teil 1 fasste dieses Tor bewusst auf Rechner-Blöcke (`[id^="lc-ergebnis"]`).
// Rechtsprechung und Vorlagen haben einen ANDEREN Ergebnisbegriff, darum eigene
// Invarianten statt einer gedehnten Fassung der alten:
//
//   Rechtsprechung — «Verdikt» ist die Kern-Antwort der Seite: die Regeste bzw.
//     die als solche gekennzeichnete Zusammenfassung (`[data-verdikt]`,
//     DESIGN-REGLEMENT-RECHTSPRECHUNG R8). Fehlt sie der Quelle (kantonal:
//     `/structure` ist Bund-only), ist es der erste Abschnitt des Urteilstexts —
//     Auffangnetz derselben Bauart wie `data-ansicht` + `table, svg` in Teil 1.
//   Vorlagen — «Verdikt» ist das Dokument (`[data-dokument]`, das Vorschau-
//     «Papier»), nicht das Formular. Steht es noch nicht, steht an seiner Stelle
//     der Platzhalter (`[data-dokument-platz]`).
//
//  I6  B2/D-1.5 + R1 — Fliesstext hält die Lesespalte. Gleiche Regel wie I3,
//      neue Flächen. WICHTIG und anders als I3: hier wird ECHTE Sichtbarkeit
//      geprüft (`checkVisibility`). Ein geschlossenes `<details>` liefert in
//      Chromium weiterhin Masse über `getBoundingClientRect` — ohne die Prüfung
//      misst man Text, den niemand sieht. Beim Audit zu Teil 2 reproduziert:
//      21 gemeldete Verstösse auf `/vorlagen/gmbh-gruendung` schrumpften auf 3
//      echte, sobald die Sichtbarkeit geprüft wurde.
//  I7  §13.2/R8 — Das Verdikt des Entscheid-Lesers steht VOR dem Urteilstext und
//      vor dem Fuss, und der Weg dorthin bleibt kurz (Regressions-Schranke).
//  I8  §8 · R13-Analogie — An der STELLE des Dokuments steht auf einer Vorlagen-
//      Fläche mit Dokument-Ausgabe immer etwas: das Dokument selbst, ein
//      Platzhalter, oder — auf schmalen Schirmen — der beschriftete Griff des
//      eingeklappten Vorschau-Blocks. Nie nichts. Genau «nichts» war der Fall auf
//      `/vorlagen/gmbh-gruendung` und `/vorlagen/kapitalerhoehung`
//      (`MappenAnsicht` gab ohne Dokument `null` zurück); `/vorlagen/ag-gruendung`
//      trug als einzige der drei bereits einen Leerzustand — dieselbe Eins-von-
//      vielen-Lage wie beim `ErgebnisPlatzhalter` in Teil 1.
//      Zusätzlich eine Regressions-Schranke auf die TIEFE dieser Stelle: sie ist
//      das Desktop-Pendant zu I9 (dort gibt es keine Marke, sondern die klebende
//      Vorschau-Spalte — eine Marke daneben zeigte auf ohnehin Sichtbares).
//  I9  I4-Analogie, MOBIL — dort ist das Dokument zugeklappt und tief unten; die
//      Abkürzung ist der schwebende Sprung-Knopf. Steht die Stelle des Dokuments
//      nicht im Bild, muss er erreichbar sein: sichtbar, vollständig im Bild, am
//      Klickpunkt frei, Tap-Ziel. `/vorlagen/gmbh-gruendung` (7'894 px mobil) und
//      `/vorlagen/kapitalerhoehung` trugen als einzige Vorlagen-Flächen mit
//      Dokument-Ausgabe gar keine Marke — dieselbe Fehlerklasse wie das `sm:hidden`
//      der Rechner-Sprungmarke in Teil 1: die Abkürzung gab es, nur nicht hier.
//  I10 §8 — Die Formvorschrift steht im ERSTEN Viewport, nicht hinter der
//      Eingabestrecke. Sie entscheidet, ob ein Dokument überhaupt gültig
//      zustande kommt («Eigenhändig abzuschreiben», «Papierform · eigenhändig
//      unterzeichnen»); eine Vorlage, die das erst am Ende sagt, hat den Nutzer
//      die halbe Strecke im Unklaren gelassen.
//
// Reine Darstellungs-Prüfung (§3): kein Wortlaut, kein Rechtswert, keine Frist.

// Rechtsprechungs-Fläche. Der BGE-Schlüssel ist fest (amtliche Sammlung, stabil);
// die kantonale Fläche wird aus der Übersicht ERMITTELT statt fest verdrahtet —
// dort ist der Bestand ein wachsender Import (3'795 Einträge), ein fester Key
// würde rotten und das Tor aus dem falschen Grund rot färben.
const RSPR_BGE = '/rechtsprechung/bge_146_III_1'

// Vorlagen-Flächen: 14 der 30 Routen, so gewählt, dass jede STRUKTURFAMILIE
// einmal vorkommt — sonst prüft eine lange Liste vierzehnmal dasselbe Gerüst:
//   • generischer `VorlagenSeite`-Rahmen: mahnung · rubrum · verjaehrungsverzicht
//   • handgeschriebener Wizard: testament · vollmacht · nda · klage-vereinfacht
//     · patientenverfuegung · arbeitsvertrag · schlichtungsgesuch-bs
//   • mehrstufiger Wizard mit Mappe am Ende: ag-gruendung
//   • Dokumentmappe ohne Wizard-Rahmen: gmbh-gruendung · kapitalerhoehung
//   • Checkliste OHNE Dokument-Ausgabe: kuendigung-vermieter (I8/I9 gelten dort
//     nicht — die Fläche verspricht kein Dokument; I10 gilt weiterhin)
const VORLAGEN = [
  '/vorlagen/testament',
  '/vorlagen/vollmacht',
  '/vorlagen/nda',
  '/vorlagen/klage-vereinfacht',
  '/vorlagen/patientenverfuegung',
  '/vorlagen/arbeitsvertrag',
  '/vorlagen/schlichtungsgesuch-bs',
  '/vorlagen/mahnung',
  '/vorlagen/rubrum',
  '/vorlagen/verjaehrungsverzicht',
  '/vorlagen/ag-gruendung',
  '/vorlagen/gmbh-gruendung',
  '/vorlagen/kapitalerhoehung',
  '/vorlagen/kuendigung-vermieter',
] as const

// Flächen ohne Dokument-Ausgabe — abschliessend und begründet. Wer eine Fläche
// hier einträgt, erklärt damit, dass sie NIE ein Dokument liefert; wer eine
// Dokument-Fläche vergisst einzutragen, wird von I8 rot gestellt.
const OHNE_DOKUMENT_ERLAUBT: readonly string[] = [
  // Reine Checkliste, `startseiteConfig` ohne `output` ⇒ kein Export, kein
  // Vorschau-«Papier». Das Badge sagt es auch so («Checkliste — kein Export»).
  '/vorlagen/kuendigung-vermieter',
]

// I6-Ausweis: gemessene Lesespalten-Verstösse, die NICHT in dieser Einheit
// liegen, weil sie aus app-weit geteilten Bausteinen kommen (§14.2 — eine
// Domänen-Einheit fasst keinen Baustein an, der zugleich der Gesetzes-Fläche
// gehört; das ist `W2·5h-GESETZ-UI` bzw. ein Fundament-Schritt). Der Ausweis
// ist die Gegenprobe zum Weglassen: ein NEUER Verstoss macht das Tor rot.
//   • `SeitenKopf`-Intro (14 Seiten, u. a. /gesetze) — 976 px gemessen
//   • `Katalog`-Kategorie-Fussnote (Rechner- UND Vorlagen-Übersicht) — 976 px
const LESESPALTE_AUSWEIS: readonly string[] = [
  'Kuratierte Auswahl von Entscheiden des Bundesg',
  'Verträge, Eingaben, Erklärungen und Dokumentma',
  'Checklisten · Mandatsaufnahme-Formular · Öffen',
]

/** Prosa-Absätze über der Lesespalte — mit ECHTER Sichtbarkeitsprüfung (I6).
 *  Teilt die Optionen mit I3 (`SICHTBAR`, oben) — EINE Definition, §5. */
async function lesespalte(page: Page): Promise<string[]> {
  return page.evaluate(([max, sichtbar]: [number, typeof SICHTBAR]) => [...document.querySelectorAll('main p')]
    .filter((p) => p.checkVisibility(sichtbar))
    .filter((p) => (p.textContent || '').trim().length > 90)
    // Kacheln, Tabellen und das Dokument-«Papier» sind ausgenommen (D-1.5; das
    // Papier bildet ein Schriftbild ab, das PDF und DOCX teilen — seine Breite
    // regelt DESIGN-REGLEMENT-VORLAGEN V2, nicht die Lesespalte der App).
    .filter((p) => !p.closest('.lc-tile') && !p.closest('table') && !p.closest('[data-dokument]'))
    .filter((p) => p.getBoundingClientRect().width > max)
    .map((p) => (p.textContent || '').trim().slice(0, 46)), [LESESPALTE_MAX, SICHTBAR] as [number, typeof SICHTBAR])
}

for (const [breite, hoehe, name] of [[1280, 800, 'Desktop'], [390, 844, 'Mobil']] as const) {
  test.describe(`Verdikt zuerst · Rechtsprechung — ${name}`, () => {
    test('Übersicht: Lesespalte', async ({ page }) => {
      await page.setViewportSize({ width: breite, height: hoehe })
      await page.goto('/rechtsprechung')
      await page.locator('main').first().waitFor()
      await page.locator('a[href^="/rechtsprechung/"]').first().waitFor()
      const ueber = await lesespalte(page)
      expect(ueber.filter((t) => !LESESPALTE_AUSWEIS.includes(t)),
        `B2/R1 · Fliesstext über der Lesespalte (${LESESPALTE_MAX} px) auf /rechtsprechung`).toEqual([])
    })

    test('Entscheid-Leser: Verdikt vor dem Urteilstext', async ({ page }) => {
      await page.setViewportSize({ width: breite, height: hoehe })
      await page.goto(RSPR_BGE)
      await page.locator('[data-verdikt]').first().waitFor()
      const b = await page.evaluate(() => {
        const oben = (el: Element) => el.getBoundingClientRect().top + window.scrollY
        const verdikt = document.querySelector('[data-verdikt]')
        const koerper = document.querySelector('.rsp-anker')
        const fuss = document.querySelector('footer')
        return {
          yVerdikt: verdikt ? oben(verdikt) : null,
          yKoerper: koerper ? oben(koerper) : null,
          yFuss: fuss ? oben(fuss) : null,
        }
      })
      expect(b.yVerdikt, 'R8 · keine Regeste-/Zusammenfassungs-Box im Leser').not.toBeNull()
      expect(b.yKoerper, 'Urteilstext (.rsp-anker) fehlt').not.toBeNull()
      // I7 Ziff. 1 — das Verdikt steht VOR dem Urteilstext und vor dem Fuss.
      expect(b.yVerdikt!, 'R8/§13.2 · Regeste steht NACH dem Urteilstext').toBeLessThan(b.yKoerper!)
      expect(b.yVerdikt!, 'R8/§13.2 · Regeste steht NACH dem Provenienz-Fuss').toBeLessThan(b.yFuss!)
      // I7 Ziff. 2 — Regressions-Schranke auf gemessener Grundlage (KEINE neue
      // Regel, gleiche Bauart wie WARN_ABSTAND_REGRESSION in Teil 1). Gemessen
      // 4.8.2026 über vier Entscheid-Flächen: 0.56–0.62 Bildschirmhöhen Desktop,
      // 0.68–0.83 mobil. 1.20 lässt also rund eine halbe Bildschirmhöhe Kopf-
      // Wachstum zu und feuert trotzdem, sobald ein Block zwischen Seitenanfang
      // und Regeste geschoben wird — jede Karte, jede Kachelreihe misst mehr.
      expect(b.yVerdikt! / hoehe,
        'R8/§13.2 · Weg zum Verdikt über der Regressions-Schranke — steht etwas Neues über der Regeste?')
        .toBeLessThanOrEqual(VERDIKT_BH_REGRESSION)
      const ueber = await lesespalte(page)
      expect(ueber.filter((t) => !LESESPALTE_AUSWEIS.includes(t)),
        `B2/R1 · Fliesstext über der Lesespalte (${LESESPALTE_MAX} px) im Entscheid-Leser`).toEqual([])
    })

    test('Entscheid-Leser ohne amtliche Regeste: Urteilstext trägt das Verdikt', async ({ page }) => {
      await page.setViewportSize({ width: breite, height: hoehe })
      await page.goto('/rechtsprechung')
      await page.locator('a[href^="/rechtsprechung/"]').first().waitFor()
      // Erste kantonale Fläche aus der Übersicht — nicht fest verdrahtet (s. oben).
      const ziel = await page.evaluate(() => {
        const a = [...document.querySelectorAll('a[href^="/rechtsprechung/"]')]
          .map((x) => (x as HTMLAnchorElement).getAttribute('href') || '')
          .find((h) => h && !h.includes('/bge_'))
        return a ?? null
      })
      expect(ziel, 'kein Nicht-BGE-Entscheid in der Übersicht verlinkt — Bestand oder Gruppierung geändert?').not.toBeNull()
      await page.goto(ziel!)
      await page.locator('.rsp-anker').first().waitFor()
      const b = await page.evaluate(() => {
        const oben = (el: Element) => el.getBoundingClientRect().top + window.scrollY
        const verdikt = document.querySelector('[data-verdikt]')
          || document.querySelector('.rsp-anker [id^="abschnitt-"]')
        const fuss = document.querySelector('footer')
        return { y: verdikt ? oben(verdikt) : null, yFuss: fuss ? oben(fuss) : null }
      })
      // §8: Auch ohne amtliche Regeste steht ein greifbares Verdikt oben — sonst
      // beginnt die Seite mit Meta-Daten und der Nutzer sucht die Antwort selbst.
      expect(b.y, 'weder Regeste noch Urteilstext-Abschnitt gefunden').not.toBeNull()
      expect(b.y!, '§13.2 · Verdikt steht NACH dem Provenienz-Fuss').toBeLessThan(b.yFuss!)
      expect(b.y! / hoehe, 'R8/§13.2 · Weg zum Verdikt über der Regressions-Schranke')
        .toBeLessThanOrEqual(VERDIKT_BH_REGRESSION)
    })
  })

  test.describe(`Verdikt zuerst · Vorlagen — ${name}`, () => {
    for (const pfad of VORLAGEN) {
      test(`${pfad}`, async ({ page }) => {
        await page.setViewportSize({ width: breite, height: hoehe })
        await page.goto(pfad)
        await page.locator('h1').first().waitFor()
        const b = await page.evaluate(() => {
          const sicht = (el: Element) => el.checkVisibility(
            { contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })
          const oben = (el: Element) => el.getBoundingClientRect().top + window.scrollY
          // Das Dokument liegt zweimal im DOM (mobil einklappbar / Desktop klebend);
          // gesucht ist die SICHTBARE Instanz, nicht die erste im Baum.
          const dok = [...document.querySelectorAll('[data-dokument]')].find(sicht) ?? null
          // Platzhalter ODER Griff des eingeklappten Vorschau-Blocks — beide
          // markieren die STELLE des Dokuments (I8).
          const platz = [...document.querySelectorAll('[data-dokument-platz]')].find(sicht) ?? null
          const badge = [...document.querySelectorAll('[data-formgate]')].find(sicht) ?? null
          const sprung = [...document.querySelectorAll('[data-verdikt-sprung]')].find(sicht) ?? null
          let s: null | { hoehe: number; breite: number; imBild: boolean; frei: boolean } = null
          if (sprung) {
            const r = sprung.getBoundingClientRect()
            const mx = r.left + r.width / 2
            const my = r.top + r.height / 2
            s = {
              hoehe: Math.round(r.height), breite: Math.round(r.width),
              imBild: r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight + 1 && r.right <= window.innerWidth + 1,
              frei: sprung.contains(document.elementFromPoint(mx, my)) || document.elementFromPoint(mx, my) === sprung,
            }
          }
          // Die «Stelle des Dokuments» ist die OBERSTE der drei Erscheinungsformen.
          const stelle = [dok, platz].filter((x): x is Element => !!x)
            .sort((a, b) => oben(a) - oben(b))[0] ?? null
          // Klebt die Stelle? Auf Desktop steht die Vorschau in einer `sticky`
          // Spalte — sie rückt beim Scrollen von selbst ins Bild und braucht
          // keine Marke. Geprüft wird die BERECHNETE Position der Vorfahren,
          // nicht eine Klasse: `md:sticky` ist ein Klassenname, `position:
          // sticky` ist die Wirkung, und nur die zählt.
          let klebt = false
          for (let el: Element | null = stelle; el && el !== document.body; el = el.parentElement) {
            if (getComputedStyle(el).position === 'sticky') { klebt = true; break }
          }
          return {
            hatDok: !!dok, hatPlatz: !!platz, klebt,
            yStelle: stelle ? oben(stelle) : null,
            yBadge: badge ? oben(badge) : null,
            sprung: s,
          }
        })

        // I6 — Lesespalte.
        const ueber = await lesespalte(page)
        expect(ueber.filter((t) => !LESESPALTE_AUSWEIS.includes(t)),
          `B2/D-1.5 · Fliesstext über der Lesespalte (${LESESPALTE_MAX} px) auf ${pfad}`).toEqual([])

        // I10 — Formvorschrift im ersten Viewport (§8).
        expect(b.yBadge, `§8 · kein Formvorschrift-Badge ([data-formgate]) auf ${pfad}`).not.toBeNull()
        expect(b.yBadge! / hoehe,
          `§8 · Formvorschrift steht erst bei ${(b.yBadge! / hoehe).toFixed(2)} Bildschirmhöhen — sie gehört in den ersten Viewport`)
          .toBeLessThan(1)

        if (OHNE_DOKUMENT_ERLAUBT.includes(pfad)) {
          // Gegenprobe zum Ausweis: wer hier steht, darf auch KEIN Dokument
          // zeigen — sonst ist der Eintrag falsch und gehört gestrichen.
          expect(b.hatDok, `${pfad} steht in OHNE_DOKUMENT_ERLAUBT, zeigt aber ein Dokument — Eintrag streichen`).toBe(false)
          return
        }

        // I8 Ziff. 1 — die Stelle des Dokuments ist nie leer.
        expect(b.hatDok || b.hatPlatz,
          `§8/R13 · Auf ${pfad} steht an der Stelle des Dokuments weder ein Dokument noch ein Platzhalter noch ein Griff — entweder Platzhalter ergänzen oder die Fläche in OHNE_DOKUMENT_ERLAUBT ausweisen`)
          .toBe(true)

        // I8 Ziff. 2 — Regressions-Schranke auf die Tiefe dieser Stelle (gemessene
        // Grundlage, KEINE neue Regel; Bauart wie WARN_ABSTAND_REGRESSION).
        const tiefe = b.yStelle! / hoehe
        const schranke = breite >= 1024 ? DOKUMENT_BH_REGRESSION.desktop : DOKUMENT_BH_REGRESSION.mobil
        if (TIEF_AUSGEWIESEN.includes(pfad)) {
          // Gegenprobe zum Ausweis: eine ausgewiesene Fläche MUSS tief liegen.
          expect(tiefe,
            `${pfad} steht in TIEF_AUSGEWIESEN, liegt aber bei ${tiefe.toFixed(2)} Bildschirmhöhen — Ausweis streichen und die Fläche normal schranken`)
            .toBeGreaterThan(schranke)
        } else {
          expect(tiefe,
            `§13.2 · Die Stelle des Dokuments liegt auf ${pfad} bei ${tiefe.toFixed(2)} Bildschirmhöhen — über der Regressions-Schranke ${schranke}. Ist über dem Dokument etwas Neues eingeschoben worden?`)
            .toBeLessThanOrEqual(schranke)
        }

        // I9 — die Abkürzung. Sie wird gebraucht, WENN die Stelle des Dokuments
        // weder im Bild steht noch von selbst hineinrückt. Der zweite Fall ist
        // die klebende Vorschau-Spalte auf Desktop: sie bleibt beim Scrollen
        // stehen, eine schwebende Marke daneben zeigte auf ohnehin Sichtbares
        // (dieselbe Begründung, aus der sich `ErgebnisSprung` per
        // IntersectionObserver ausblendet). Genau diese Bedingung — und nicht
        // «Desktop ja / mobil nein» — ist die Regel; darum wird sie geprüft und
        // nicht die Breite.
        if (b.yStelle! < hoehe || b.klebt) return
        expect(b.sprung, `Abkürzung zum Dokument ([data-verdikt-sprung]) fehlt auf ${pfad} (${name}): die Stelle des Dokuments liegt bei ${tiefe.toFixed(2)} Bildschirmhöhen und klebt nicht`).not.toBeNull()
        expect(b.sprung!.imBild, `Abkürzung auf ${pfad} liegt nicht vollständig im Bild`).toBe(true)
        expect(b.sprung!.frei, `Abkürzung auf ${pfad} ist an ihrem Klickpunkt verdeckt`).toBe(true)
        // A9 · Tap-Ziel — dieselben Schranken wie an der Rechner-Sprungmarke.
        expect(b.sprung!.hoehe, `Tap-Ziel der Abkürzung auf ${pfad} zu flach`).toBeGreaterThanOrEqual(32)
        expect(b.sprung!.breite, `Tap-Ziel der Abkürzung auf ${pfad} zu schmal`).toBeGreaterThanOrEqual(44)
      })
    }
  })
}

// ── A9 · Bedienbarkeit und Flüssigkeit der neuen Abkürzung ──────────────────
// Die zwei Bauteile dieser Einheit, die der Nutzer BEDIENT, sind die Abkürzung
// zum Dokument (`ErgebnisSprung` auf den Mappen-Flächen; der «Vorschau ↓»-Knopf
// im Wizard) und der Griff des eingeklappten Vorschau-Blocks. Geprüft wird beides
// unter CPU-Drossel: Tastatur-Erreichbarkeit, Wirkung, Reaktionszeit, CLS.
// Drossel/Budget/Latte aus `./helpers/budgets` (§5).
const A9_DROSSEL = DROSSEL
const A9_BUDGET = REAKTIONS_BUDGET
const A9_LATTE = REAKTIONS_LATTE

test('A9 · Abkürzung zum Dokument: Tastatur, Wirkung, Flüssigkeit, CLS 0', async ({ page }) => {
  if (CONTAINER_BUDGET_CI) test.setTimeout(CONTAINER_BUDGET_CI)
  const konsolenfehler: string[] = []
  page.on('pageerror', (e) => konsolenfehler.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') konsolenfehler.push(m.text()) })

  await page.setViewportSize({ width: 390, height: 844 })
  const client = await page.context().newCDPSession(page)
  await client.send('Emulation.setCPUThrottlingRate', { rate: A9_DROSSEL })

  // (1) Mappen-Fläche: die NEUE Marke. Sie ist ein <a> auf einen Anker — also
  //     fokussierbar und mit Enter auslösbar, ohne dass die Spec das nachbaut.
  await page.goto('/vorlagen/kapitalerhoehung')
  const marke = page.locator('[data-verdikt-sprung]')
  await expect(marke).toBeVisible({ timeout: A9_LATTE })
  await page.evaluate(() => {
    ;(window as unknown as { __cls: number }).__cls = 0
    const inhalt = document.querySelector('main')
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        const s = e as unknown as { value: number; hadRecentInput: boolean; sources?: { node?: Node | null }[] }
        if (s.hadRecentInput) continue
        if ((s.sources ?? []).some((q) => q.node && inhalt?.contains(q.node))) {
          ;(window as unknown as { __cls: number }).__cls += s.value
        }
      }
    }).observe({ type: 'layout-shift' })
  })
  await marke.focus()
  expect(await page.evaluate(() => document.activeElement?.getAttribute('data-verdikt-sprung') !== null),
    'Abkürzung ist nicht per Tastatur fokussierbar').toBe(true)
  let t0 = Date.now()
  await page.keyboard.press('Enter')
  // Wirkung: die Stelle des Dokuments steht danach im Bild.
  await expect(page.locator('#vorlagen-dokumente')).toBeInViewport({ timeout: A9_LATTE })
  expect(Date.now() - t0, 'Sprung zum Dokument zu langsam').toBeLessThan(A9_BUDGET)
  const clsMappe = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
  expect(clsMappe, 'CLS über den Dokument-Sprung muss 0 sein').toBe(0)

  // (2) Wizard-Fläche: Griff + schwebender Knopf klappen das Dokument auf.
  await page.goto('/vorlagen/testament')
  const knopf = page.locator('[data-verdikt-sprung]')
  await expect(knopf).toBeVisible({ timeout: A9_LATTE })
  await page.evaluate(() => { (window as unknown as { __cls: number }).__cls = 0 })
  await page.evaluate(() => {
    const inhalt = document.querySelector('main')
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        const s = e as unknown as { value: number; hadRecentInput: boolean; sources?: { node?: Node | null }[] }
        if (s.hadRecentInput) continue
        if ((s.sources ?? []).some((q) => q.node && inhalt?.contains(q.node))) {
          ;(window as unknown as { __cls: number }).__cls += s.value
        }
      }
    }).observe({ type: 'layout-shift' })
  })
  await knopf.focus()
  t0 = Date.now()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-dokument]').first()).toBeVisible({ timeout: A9_LATTE })
  expect(Date.now() - t0, 'Aufklappen der Vorschau zu langsam').toBeLessThan(A9_BUDGET)

  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  expect(konsolenfehler, 'Konsolenfehler beim Bedienen der Abkürzung').toEqual([])
})
