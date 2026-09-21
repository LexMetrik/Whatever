// @shard-gruppe: 5
// B7-N1 · LM-010/LM-015 — die abdunkelnde Fläche hinter den Menüfenstern des
// Lesers (Entscheid David 8.8.2026).
//
// ── WAS DER BEFUND SAGT UND WAS DAVON HEUTE NOCH GILT (Vintage-Regel §0.1) ───
// Gemessen 30.8.2026 am gebauten Stand @1440 auf `/gesetze/bund/OR`:
//  · LM-010 («Rechtsprechungs-Menü rund 460 px hoch, liegt über dem Text») ist
//    ÜBERHOLT — die Fläche ist seit H3/Ä60 kein aufgezogenes Menü mehr, sondern
//    eine eigene Layout-Spur NEBEN dem Text; sie erzeugt gar kein Overlay.
//  · LM-015 («Die Menüfenster haben keine abdunkelnde Fläche dahinter») war für
//    «Ansicht ▾» REPRODUZIERT: 240 × 199 px, deckendes `paper-raised`, z-40,
//    kein Scrim im DOM.
//
// ── DIE REGEL, DIE DIESE SPEC BEWACHT ───────────────────────────────────────
// DER SCRIM FOLGT DER FOKUS-FALLE, nicht der Fläche. «Ansicht ▾» läuft im Modus
// `popover` und fängt den Fokus (`useDialogFokus`) — es ist modal und sagt das
// jetzt auch. Das Rechtsprechungs-Panel läuft auf D im Modus `beiwerk`/`spalte`
// und fängt ihn bewusst NICHT (Ä52) — dort bleibt es beim Scrim-Verzicht. Beide
// Hälften stehen hier, sonst bewachte die Spec nur die eine Richtung.
//
// ═══ AUFHEBUNG DER ERSTEN HÄLFTE · D41 (David 7.9.2026) ═════════════════════
// Der Absatz darüber bleibt als Beleg von damals stehen und wird NICHT
// nachgeführt (§2b). Aufgehoben ist seine SCHLUSSFOLGERUNG für das
// «Ansicht ▾»-Menü, und zwar an einer Messung, die es 2026-08 noch nicht gab:
// über dem Scrim (z 16) liegen VIER Balken mit DREI Breiten — Topbar (z 30,
// 1440 px), Reiterleiste (z 20, 1440), `InhaltsKopf` (z 19, 1440) und der
// Leser-Kopf `[data-v3-kopf]` (z 17, nur **1080** px). Gemessen @1440, Δ
// Leuchtdichte im Kopf-Band y 120–135: x 0–160 −74.9 · x 200–1160 **0.0** ·
// x 1280–1400 −74.9 — ein 1080 × 57 px helles Fenster mit zwei harten Kanten
// mitten im abgedunkelten Bild, das beim Scrollen mitwandert («uneinheitlich
// abgedunkelt», Meldung David). Ein vollflächiger Scrim UNTER einem nicht
// vollflächigen Kopf kann nicht einheitlich sein; die Bauart war der Mangel.
// `LeserScrim.tsx` ist darum ersatzlos entfallen, und die drei Fälle, die diese
// Stufe zementierten, sind mit ihr gegangen (Rückbau statt Zubau, §17).
//
// DER DATEINAME BLEIBT: B7-N1 ist nur zur HÄLFTE aufgehoben. Der modale
// Blatt-Scrim (@390) trägt seinen Kern weiter — «ein Scrim, der seine Farbe mit
// dem Thema wechselt, ist per Definition falsch» —, und der wird unten
// unverändert gemessen.
//
// ═══ WAS DIESE SPEC SEIT D41/D42 STATTDESSEN BEWACHT ════════════════════════
// Die Zusage hat die Richtung gewechselt: nicht mehr «wo MUSS ein Scrim sein»,
// sondern «wo darf KEINER sein». Bewacht wird Ä52 in beiden Lagen, in denen der
// Lesetext neben dem Beiwerk stehen bleibt — Einzelansicht @1440 (bestehend,
// jetzt auch bei OFFENEM Menü) und der Split-Pane (neu, D42). Und der Beweis
// ist dort nicht der Scrim-ZÄHLER, sondern die Bedienbarkeit selbst: ein Zähler
// allein finge die nächste Bauart nicht (§6.7).
//
// ── UND: DER SCRIM MUSS ABDUNKELN, IN BEIDEN THEMES ─────────────────────────
// `--ink-900` flippt mit dem Thema (hell `#201E16`, dunkel `#E9E7E2`). Ein
// `bg-ink-900/30` ist darum im Dunkelmodus ein HELLER Schleier — genau das stand
// bis zum 30.8.2026 im modalen Leser-Blatt (`LeserPanelZone`). Der Wächter
// prüft die Deckfarbe deshalb in BEIDEN Themes gegen denselben Wert: ein Scrim,
// der seine Farbe mit dem Thema wechselt, ist per Definition falsch.
// Läuft gegen `vite preview` (dist).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const SCRIM_FARBE = 'rgba(0, 0, 0, 0.3)'
// ── WURZEL-FIX (§17, W2·24-R6c 6.9.2026): NICHT MEHR DER OR ─────────────────
// Diese Datei lief auf `/gesetze/bund/OR` und riss reproduzierbar unter
// Parallel-Last an `leserBereit` («element(s) not found» nach 20 s), während
// jeder Fall einzeln grün war — 4 von 8 Fällen im 5-Worker-Lauf, 1 von 8 im
// seriellen (Nullprobe auf 2a18f97bb, also ÄLTER als R6c). Gemessen am
// Preview-Build: die OR-Seite liefert **8.75 MB** vorgerendertes HTML, BGBM
// **144 KB** — Faktor 60. Der Scrim ist erlass-neutral (er hängt am Menü, nicht
// am Gesetzestext), also kostet der Wechsel keine Aussage und nimmt der Datei
// ihre einzige Flake-Ursache. Dasselbe Argument und derselbe Erlass stehen seit
// dem 4.7.2026 in `e2e/leser-lesemass.e2e.ts` («BGBM … klein (~22 KB), trägt
// Marker UND Apparat — der grosse OR starvte den gedrosselten CI-Runner»).
// GEPRÜFT, dass BGBM alle vier Haken dieser Datei trägt (je 1×):
// `[data-leser-v3="rahmen"]`, `[data-v3-ansicht]`, `[data-v3-panel-oeffner]`,
// `[data-v3-panel-zaehler]`.
const PFAD = '/gesetze/bund/BGBM'

const ansichtOeffner = (page: Page) => page.locator('[data-v3-ansicht]')
const ansichtPanel = (page: Page) => page.locator('[data-v3-ansicht-panel]')
const ansichtScrim = (page: Page) => page.locator('[data-v3-ansicht-scrim]')

async function leserBereit(page: Page) {
  await page.goto(PFAD)
  await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 })
}

test.describe('B7-N1 · Der modale Blatt-Scrim dunkelt auch im Dunkelmodus ab', () => {
  // Der Fehler, den das fängt: bis 30.8.2026 stand hier `bg-ink-900/30`.
  // `--ink-900` ist im Dunkelmodus `#E9E7E2` — der «Scrim» hellte dort auf.
  for (const thema of ['light', 'dark'] as const) {
    test(`@390 modales Blatt — Deckfarbe themenunabhängig (${thema})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: thema })
      await page.setViewportSize({ width: 390, height: 844 })
      await leserBereit(page)

      await page.locator('[data-v3-panel-oeffner]').first().click()
      await expect(page.locator('[data-v3-panel-modal="ja"]')).toBeVisible({ timeout: 20_000 })
      const scrim = page.locator('[data-v3-panel-scrim]')
      await expect(scrim).toHaveCount(1)
      expect(await scrim.evaluate((el) => getComputedStyle(el).backgroundColor),
        `Blatt-Scrim im Thema «${thema}»`).toBe(SCRIM_FARBE)
    })
  }
})

/** Zählt vollflächig abdunkelnde Flächen — die Messung, die «uneinheitlich
 *  abgedunkelt» und «Beiwerk hinter einer Scheibe» beide fängt, ohne einen
 *  bestimmten `data-`-Namen vorauszusetzen. */
const vollflaechigZaehlen = (page: Page) => page.evaluate(() => [...document.querySelectorAll('div')]
  .filter((e) => {
    const c = getComputedStyle(e); const r = e.getBoundingClientRect()
    return c.position === 'fixed' && r.width >= innerWidth - 2 && r.height >= innerHeight - 2
      && c.backgroundColor !== 'rgba(0, 0, 0, 0)'
  }).length)

test.describe('Ä52 bleibt unangetastet — Beiwerk bekommt KEINEN Scrim', () => {
  // ── D41-ERWEITERUNG (7.9.2026): AUCH BEI OFFENEM «Ansicht ▾»-MENÜ ─────────
  // Bis hierher mass dieser Fall nur den Ruhezustand des Menüs. Genau der war
  // aber nie der Streitpunkt: die Abdunklung entstand erst beim ÖFFNEN. Der Fall
  // deckt seither beide Zustände ab und läuft in BEIDEN Themes — der Δ von
  // −74.9 (hell) hatte im Dunkelmodus eine schwächere Entsprechung (≈ −8 bis
  // −14), ein Fall nur in hell hätte die halbe Wirkung übersehen.
  for (const thema of ['light', 'dark'] as const) {
    test(`Rechtsprechungs-Panel @1440 (${thema}): kein Overlay, kein Scrim — auch mit offenem Ansicht-Menü`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: thema })
      await page.setViewportSize({ width: 1440, height: 900 })
      // Mit Anker, damit der Artikel-Absatz nach dem Übergang im Sichtfeld steht
      // und die Sonde alle vier Ziele misst statt nur der drei im Kopf.
      await page.goto(`${PFAD}#art-1`)
      await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
      await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 })

      await page.locator('[data-v3-panel-oeffner]').first().click()
      await expect(page.locator('[data-v3-panel-form]')).toBeVisible({ timeout: 20_000 })

      // Die Zusage von `panelForm`/Ä52: nicht modal, also kein Scrim — weder der
      // eigene des Panels noch der des Ansicht-Menüs.
      await expect(page.locator('[data-v3-panel-modal="ja"]')).toHaveCount(0)
      await expect(ansichtScrim(page)).toHaveCount(0)
      expect(await vollflaechigZaehlen(page),
        'Beiwerk-Panel hat wieder eine Vollflächen-Abdunklung (Ä52)').toBe(0)

      // ── D41 · und jetzt das Menü aufziehen ──────────────────────────────
      // ROT-PROBE, vorgeführt am 7.9.2026 auf dem Stand vor D41 (§6.7):
      // `[data-v3-ansicht-scrim]` count 1 statt 0, in hell UND dunkel — genau
      // die Stufe, die den 1080 px breiten Kopf als helle Insel stehen liess.
      await ansichtOeffner(page).click()
      await expect(ansichtPanel(page)).toBeVisible()
      await expect(ansichtScrim(page),
        'Das «Ansicht ▾»-Menü dunkelt wieder ab (D41) — unter einem 1080-px-Kopf kann das nicht einheitlich sein')
        .toHaveCount(0)
      expect(await vollflaechigZaehlen(page),
        'Offenes Ansicht-Menü legt wieder eine Vollflächen-Abdunklung über die Seite (D41)').toBe(0)

      // Kein Ausweg ist verloren gegangen: die Wege hinaus trägt
      // `usePopoverAutoZu` (Modus `popover`) selbst, nicht der Scrim.
      await page.keyboard.press('Escape')
      await expect(ansichtPanel(page), 'Escape schliesst das Menü nicht mehr').toHaveCount(0)
      await ansichtOeffner(page).click()
      await expect(ansichtPanel(page)).toBeVisible()
      await page.mouse.click(300, 700)
      await expect(ansichtPanel(page), 'Der Aussenklick schliesst das Menü nicht mehr').toHaveCount(0)
    })
  }
})

// ═══ D42 (David 7.9.2026) · IM SPLIT BLEIBT DAS GESETZES-PANE BEDIENBAR ══════
//
// BEFUND, gemessen @1440 vor dem Fix: beim Split mutierte das offene,
// nicht-modale Beiwerk-Panel still zum Dialog. `[data-v3-panel-scrim]` lag als
// `absolute inset-0 z-40` über der GANZEN Gesetzes-Pane ([2,165,718,735]),
// obwohl das Blatt selbst nur 404 von 735 px belegte — die 331 px Gesetzestext
// darüber blieben sichtbar und waren doch tot. `elementFromPoint` auf die Mitte
// von Ansicht-Öffner, ⚖-Öffner, Suchfeld und Textabsatz lieferte VIERMAL
// `div[data-v3-panel-scrim]` statt des Ziels. Davids «fast nicht mehr bedienbar»
// war also keine Optik, sondern wörtlich wahr.
//
// WARUM DIE TREFFER-SONDE UND NICHT NUR EIN SCRIM-ZÄHLER (§6.7). Ein Tor, das
// `toHaveCount(0)` auf einen `data-`-Namen prüft, fällt bei der nächsten Bauart
// still um — ein `inert`, ein `pointer-events`, ein anderes Overlay sperren das
// Pane genauso und hiessen anders. Gemessen wird darum die ZUSAGE selbst:
// erreicht ein Klick auf die Mitte eines Bedienelements dieses Element. Der
// Zähler steht daneben, weil er die URSACHE benennt, wenn die Sonde rot wird.
//
// ZWEI AUFBAUTEN, weil der Defekt zwei Gesichter hatte: der Zustand (Split beim
// Laden) und der ÜBERGANG (Panel offen → «⧉ Daneben öffnen»). Gemessen war
// beides identisch rot — die Wurzel sitzt am Pane-Zustand, der Übergang macht
// sie nur überraschend. Bewacht sind trotzdem beide: der Übergang ist die
// Reihenfolge, die David gemeldet hat.
//
// SEKUNDÄRES PANE = `/rechner/zpo-fristen` und nicht ein zweiter Erlass: die
// Aussage hängt am PRIMÄREN Pane, und ein leichtes Nachbar-Pane hält die Datei
// bei ihrer Flake-Vorgabe von oben (BGBM statt OR, W2·24-R6c).
const SPLIT_SEKUNDAER = '%2Frechner%2Fzpo-fristen'

type Sonde = { name: string; getroffen: boolean; traf: string }

/**
 * Für jedes Bedienelement im PRIMÄREN Pane: liefert `document.elementFromPoint`
 * auf seine Mitte das Element selbst (oder einen seiner Nachfahren)?
 *
 * Die Liste ist adaptiv — was der Zuschnitt gerade nicht zeigt, wird nicht
 * gemessen —, aber der Aufrufer prüft die ANZAHL mit: eine Sonde, die auf null
 * Ziele zusammenschrumpft, wäre ein Tor, das nicht scheitern kann.
 *
 * ÜBERSPRUNGEN WIRD AUCH, WAS AUSSERHALB DES SICHTFELDS LIEGT — und das ist
 * keine Lockerung, sondern die Bedingung dafür, dass die Sonde misst, was sie
 * behauptet. `elementFromPoint` ist ausserhalb des Fensters definitionsgemäss
 * `null`; im ersten Lauf meldete der Artikel-Absatz darum in Fall (b) «nicht
 * treffbar», obwohl er bloss weiter unten stand (gemessen 7.9.2026: getroffen
 * true/true/true für Kopf-Elemente, `traf: 'nichts'` für den Absatz). Ein Scrim
 * schiebt kein Element aus dem Fenster — der D42-Defekt bleibt also voll
 * erfasst; erfasst würde nur zusätzlich das Scrollen, das niemand behauptet hat.
 */
async function trefferSonde(page: Page): Promise<Sonde[]> {
  return page.evaluate(() => {
    const pane = document.querySelector('[data-pane="primaer"]')
    if (!pane) return []
    const kandidaten: Array<[string, string]> = [
      ['Ansicht-Öffner', '[data-v3-ansicht]'],
      ['Panel-Öffner (⚖)', '[data-v3-panel-oeffner]'],
      ['Suchfeld im Leser-Kopf', '[data-v3-suchsprung] input'],
      ['Artikel-Textabsatz', '#art-1 p'],
    ]
    const out: Array<{ name: string; getroffen: boolean; traf: string }> = []
    for (const [name, sel] of kandidaten) {
      const ziel = pane.querySelector(sel)
      if (!ziel) continue
      const b = ziel.getBoundingClientRect()
      if (b.width < 4 || b.height < 4) continue
      const mx = Math.round(b.x + b.width / 2), my = Math.round(b.y + b.height / 2)
      if (mx < 0 || my < 0 || mx >= innerWidth || my >= innerHeight) continue
      const el = document.elementFromPoint(mx, my)
      const getroffen = !!el && (el === ziel || ziel.contains(el))
      out.push({
        name, getroffen,
        traf: el
          ? el.tagName.toLowerCase() + [...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `[${a.name}]`).join('')
          : 'nichts',
      })
    }
    return out
  })
}

async function paneBleibtBedienbar(page: Page, lage: string) {
  // Der Zähler benennt die Ursache …
  await expect(page.locator('[data-v3-panel-scrim]'),
    `${lage}: das Blatt im Pane trägt wieder einen Scrim (D42)`).toHaveCount(0)
  const blatt = page.locator('[data-v3-panel-form]')
  await expect(blatt, `${lage}: das Blatt im Pane meldet sich wieder als modal (D42)`)
    .toHaveAttribute('data-v3-panel-modal', 'nein')
  // … keine Rollen-Lüge (§8): ein Dialog ohne Modalität ist keiner.
  await expect(blatt, `${lage}: role="dialog" ohne Modalität wäre die Rollen-Lüge, die §8 verbietet`).toHaveAttribute('role', 'region')
  expect(await blatt.getAttribute('aria-modal'), `${lage}: aria-modal am nicht-modalen Blatt`).toBeNull()

  // … und das hier ist der eigentliche Beweis.
  const sonden = await trefferSonde(page)
  expect(sonden.length,
    `${lage}: die Treffer-Sonde fand kein einziges Bedienelement im primären Pane — dann prüft sie nichts`)
    .toBeGreaterThanOrEqual(3)
  expect(sonden.filter((s) => !s.getroffen),
    `${lage}: Bedienelemente im Gesetzes-Pane sind nicht treffbar (D42) — ${JSON.stringify(sonden)}`)
    .toEqual([])
}

test.describe('D42 · Split: das Gesetzes-Pane bleibt bedienbar', () => {
  for (const thema of ['light', 'dark'] as const) {
    // ── ROT-PROBE, vorgeführt am 7.9.2026 (§6.7) ────────────────────────────
    // Auf dem Stand vor D42 (Quelldateien auf 7db4880d5 zurückgesetzt, `dist`
    // neu gebaut): 6 von 8 Fällen dieser Datei rot, `[data-v3-panel-scrim]`
    // count 1 statt 0. Weil der Zähler zuerst zuschlägt, ist die TREFFER-SONDE
    // eigens rot gemessen worden — sonst wäre sie ein Tor, das nie gefallen ist:
    //   (a) Split beim Laden : 4 Ziele gemessen, 4 nicht treffbar
    //   (b) Übergang         : 4 Ziele gemessen, 4 nicht treffbar
    // In beiden Aufbauten lieferte `elementFromPoint` für Ansicht-Öffner,
    // ⚖-Öffner, Suchfeld UND Artikel-Absatz je `div[data-v3-panel-scrim]`.
    test(`(a) Split beim Laden, dann ⚖ im primären Pane (${thema})`, async ({ page }) => {
      const fehler = fehlerSammeln(page)
      await page.emulateMedia({ colorScheme: thema })
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`${PFAD}?p=${SPLIT_SEKUNDAER}#art-1`)
      await expect(page.locator('[data-leser-v3="rahmen"]').first()).toBeVisible({ timeout: 20_000 })
      await expect(page.locator('[data-pane="primaer"] #art-1')).toBeVisible({ timeout: 20_000 })

      await page.locator('[data-pane="primaer"] [data-v3-panel-oeffner]').first().click()
      await expect(page.locator('[data-v3-panel-form]')).toBeVisible({ timeout: 20_000 })

      await paneBleibtBedienbar(page, 'Split beim Laden')

      // Der Weg hinaus bleibt: `modus` fällt im Pane auf `'fest'`, das steht in
      // `OHNE_FALLE` — daran hängt der Escape-Handler (usePopoverAutoZu).
      await page.keyboard.press('Escape')
      await expect(page.locator('[data-v3-panel-form]'),
        'Escape schliesst das Blatt im Pane nicht mehr').toHaveCount(0)
      expect(fehler).toEqual([])
    })

    // Davids Reihenfolge: erst das Panel, DANN in den Split. Genau hier mutierte
    // der Zustand, ohne dass der Nutzer etwas am Panel getan hätte.
    test(`(b) Übergang: Panel offen ⇒ «⧉ Daneben öffnen» (${thema})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: thema })
      await page.setViewportSize({ width: 1440, height: 900 })
      await leserBereit(page)

      await page.locator('[data-v3-panel-oeffner]').first().click()
      await expect(page.locator('[data-v3-panel-form]')).toBeVisible({ timeout: 20_000 })
      // Vorzustand: in der Einzelansicht ist das Panel Beiwerk (Ä52) …
      await expect(page.locator('[data-v3-panel-form]')).toHaveAttribute('data-v3-panel-modal', 'nein')

      await page.locator('[aria-label*="daneben öffnen"]').first().click()
      await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 20_000 })
      await expect(page.locator('[data-v3-panel-form]')).toBeVisible({ timeout: 20_000 })

      // … und der blosse Wechsel der Portal-Wurzel darf daran nichts ändern.
      await paneBleibtBedienbar(page, 'Übergang in den Split')
    })
  }
})
