// @shard-gruppe: 3
// ═══ W2·24 R13 · DIE REITERLEISTE ALS BROWSER-REITERBAND ════════════════════
//
// Die Prüfrunde R13 (7.9.2026, `scratchpad/w224-r13-befunde.md`) hat die Leiste
// gegen die Browser-Norm gemessen und zwölf Befunde erhoben. Diese Datei
// bewacht die neun, die R13 gebaut hat; die Nummern sind die des Befundes.
//
// ROT ZU BEKOMMEN (§6.7 — je Massnahme einmal gegen den Vorstand `a60dd7f75`
// gefahren, 7.9.2026; die Messwerte des Befundes stehen als Erwartung im Test):
//   R13-2  `Reiter.tsx`: `shrink-0` an der Reiter-Hülle wiederherstellen ⇒
//          @1440 `scrollWidth 1476 > clientWidth 1355`, der letzte Reiter als
//          «Z» an der Kante.
//   R13-1  `Reiterleiste.tsx`: den «N offen»-Knopf wieder nur bei Überlauf
//          zeigen ⇒ @390 rechte Kante des aktiven Reiters 312 bei clientWidth
//          253.
//   R13-3  `ueberlauf.fensterStart`: den alten Slot-Tausch einsetzen ⇒ beim
//          Wechsel #14 → #15 fällt «ArG» aus dem Streifen.
//   R13-4  `Reiter.tsx`: `{stelle !== null && …}` zurück ⇒ der ZGB-Reiter
//          trägt 60 px leeren Platzhalter und misst 137 statt 93 px.
//   R13-5  `Reiterleiste.tsx`: das `onContextMenu` am Streifen entfernen ⇒
//          `[role=menu]` bleibt 0.
//   R13-6  den Eintrag «Alle schliessen» aus `menueEintraege` streichen.
//   R13-9  den Eintrag «Adresse kopieren» streichen.
//   R13-7  `aria-keyshortcuts`/`kuerzel` am Reiter entfernen.
//   R13-8  `Alt+9` wieder auf `ordnung[8]` legen ⇒ landet auf dem NEUNTEN.
import { test, expect, type Page } from '@playwright/test'

const STREIFEN = '[data-reiter-streifen]'
const START = '/kontakt'

const OR = '/gesetze/bund/OR#art-336_c'
const BGE = '/rechtsprechung/bge_146_III_1'
const RECHNER = '/rechner/zpo-fristen'
const VORLAGE = '/vorlagen/arbeitsvertrag'
/** Acht realistische Reiter — das Kanzlei-Szenario aus R11, aufgefüllt auf die
 *  Zahl, bei der die feste Grenze `SICHTBAR_MAX = 8` bis R13 gerade noch nicht
 *  griff und der Überlauf darum stumm war. */
const ACHT = [OR, BGE, RECHNER, VORLAGE, '/gesetze/bund/ZGB', '/gesetze/bund/ZPO',
  '/gesetze/bund/STGB', '/gesetze/bund/URG']
// ── G23 (Gesamtprüfung W2·24, 7.9.2026) · DER SEED WAR NICHT KANONISCH ───────
// Diese beiden Listen trugen fünf Erlass-Schlüssel in gemischter Schreibung —
// `StGB`, `SchKG`, `ArG`, `StPO`, `VwVG`. Das REGISTER
// (`dist/normtext/register.json`, 1'576 Erlasse) führt sie ausschliesslich
// versal: `STGB`, `SCHKG`, `ARG`, `STPO`, `VWVG`. Die ROUTE löst beide
// Schreibungen auf (nachgemessen 7.9.2026: alle zehn Adressen zeigen denselben
// Erlass) — die Reiter-BESCHRIFTUNG nicht: sie schlägt den Schlüssel exakt nach.
// GEMESSEN am Vorstand `72b39d50c`, 15 Reiter @1440, aktiv KKG: von den neun
// sichtbaren Reitern trugen DREI die Aufschrift «Gesetz nicht gefunden»
// (Positionen 8/10/12 = ArG · StPO · VwVG; StGB und SchKG lagen ausserhalb des
// Fensters, also fünf im Speicher). Der Fehler war doppelt teuer: die
// Ersatz-Aufschrift ist ~3× breiter als ein Kürzel, deshalb passten nur 9 von 15
// Reitern ins Bild — die Sonde mass also nicht die Leiste, sondern ihren
// eigenen Seed. Mit kanonischem Seed sind es 13 von 15 (`data-reiter-fenster`
// 5/9/15 → 2/13/15), und die Messtabelle in
// `abnahme/design-identitaet/R13-REITER.md` trägt dazu eine datierte
// Nachzug-Zeile. Die ASSERTIONS sind unberührt (§6.3) — nur die Eingabe ist
// jetzt die, die der Befund gemeint hat.
const FUENFZEHN = ['/gesetze/bund/OR', '/gesetze/bund/ZGB', '/gesetze/bund/ZPO',
  '/gesetze/bund/STGB', '/gesetze/bund/SCHKG', '/gesetze/bund/BV', '/gesetze/bund/DSG',
  '/gesetze/bund/ARG', '/gesetze/bund/URG', '/gesetze/bund/STPO', '/gesetze/bund/BGG',
  '/gesetze/bund/VWVG', '/gesetze/bund/IPRG', '/gesetze/bund/KKG', '/gesetze/bund/KVG']

test.describe.configure({ timeout: 120_000 })

// ── DEKLARIERTE SONDEN-ÄNDERUNG (§6.3) · R14b, 7.9.2026 ─────────────────────
// `/kontakt` war die Startroute, WEIL sie keinen Reiter trug. Seit R14b trägt
// JEDE Route einen (`lib/tabs.ts`, Block «R14b»; `istReiterPfad` ist ersatzlos
// gestrichen) — der Seed landet darum auf dem ZULETZT geseedeten Reiter statt
// auf einer reiterlosen Meta-Route. Damit bleibt die Reiterzahl exakt die
// geseedete, und keine Zählung dieser Datei verschiebt sich. `/kontakt` bleibt
// nur noch der Ort, an dem der Speicher überhaupt erreichbar ist (localStorage
// braucht eine geladene Herkunft), bevor er überschrieben wird.
async function seed(page: Page, tabs: string[], ziel?: string): Promise<void> {
  await page.goto(START)
  await page.evaluate((t) => {
    localStorage.setItem('lexmetrik-tabs', JSON.stringify(t.map((path) => ({ path }))))
  }, tabs)
  await page.goto(ziel ?? tabs[tabs.length - 1] ?? '/')
  if (tabs.length > 0) {
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel]`).first()).toBeVisible({ timeout: 45_000 })
  }
  // Die Beschriftungen kommen aus lazy geladenen Manifesten nach und ändern die
  // Reiterbreiten; erst danach steht das gemessene Fenster.
  await page.waitForTimeout(1500)
}

/** Rohmasse des Streifens — genau die Grössen, die der Befund gemessen hat. */
const masse = (page: Page) => page.evaluate(() => {
  const s = document.querySelector('[data-reiter-streifen]')!
  const k = [...s.querySelectorAll<HTMLElement>('[data-reiter-schluessel]')]
  const a = s.querySelector<HTMLElement>('[data-reiter-aktiv="true"]')
  return {
    scrollW: s.scrollWidth,
    clientW: s.clientWidth,
    fenster: s.getAttribute('data-reiter-fenster'),
    sichtbar: k.map((e) => e.getAttribute('data-reiter-schluessel')!),
    letzteKante: k.length ? Math.round(k[k.length - 1].offsetLeft + k[k.length - 1].offsetWidth) : 0,
    aktivRechts: a ? Math.round(a.offsetLeft + a.offsetWidth) : null,
  }
})

const gespeichert = (page: Page) => page.evaluate(() =>
  (JSON.parse(localStorage.getItem('lexmetrik-tabs') ?? '[]') as { path: string }[]).map((t) => t.path))

// ═══ R13-2 · KEIN REITER WIRD STUMM ANGESCHNITTEN ═══════════════════════════
//
// GEMESSEN am Vorstand: @1440 mit diesen acht Reitern `scrollWidth 1476 >
// clientWidth 1355`, sieben von acht im Bild, «+N» NICHT sichtbar (der Überlauf
// hing an der festen Zahl 9) — und der Scrollbalken ist per CSS unsichtbar. Der
// achte Reiter stand als «Z» an der Kante, ohne ein einziges Zeichen dafür.
test.describe('R13-2 — Überlauf aus der gemessenen Breite', () => {
  for (const [w, h] of [[1440, 900], [1024, 800], [390, 844]] as const) {
    test(`@${w}: die Reiter passen ganz ins Bild, der Rest steht im Blatt`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h })
      await seed(page, ACHT, '/gesetze/bund/URG')
      const m = await masse(page)
      expect(m.scrollW, `@${w} darf nicht überlaufen (Vorstand: 1476 > 1355)`)
        .toBeLessThanOrEqual(m.clientW + 1)
      expect(m.letzteKante, 'kein Reiter wird angeschnitten').toBeLessThanOrEqual(m.clientW + 1)
      expect(m.sichtbar.length).toBeGreaterThan(0)
      // Fenster-Buchführung: sichtbar + versteckt = Speicher, nie weniger.
      const [start, anzahl, gesamt] = (m.fenster ?? '').split('/').map(Number)
      expect(gesamt).toBe(ACHT.length)
      expect(anzahl).toBe(m.sichtbar.length)
      expect(start + anzahl).toBeLessThanOrEqual(gesamt)
      // Wird gekappt, MUSS der Weg zum Rest sichtbar sein.
      const blatt = page.getByRole('button', { name: `Alle ${ACHT.length} offenen Reiter` })
      await expect(blatt).toBeVisible()
      if (anzahl < gesamt) await expect(blatt).toHaveText(`+${gesamt - anzahl}`)
    })
  }
})

// ═══ FB · DER KASTEN TRÄGT SEINEN INHALT (Prüfbefund 7.9.2026) ══════════════
//
// R13-2 oben misst den STREIFEN. Diese Sonde misst, was R13-2 stillschweigend
// voraussetzt und was zwischen R13 und der Gesamtprüfung verloren ging: dass
// die Kante eines Reiterkastens zugleich die Kante seines Inhalts ist.
//
// GEMESSEN am Stand `85daf2926` (Preview 4419, gebautes dist/, Chromium @390,
// die acht Reiter von oben): alle acht Kästen endeten exakt bei 241 px =
// `clientWidth` — die Rechnung von R13-2 fand also keinen Überlauf, das Fenster
// blieb `0/8/8`, «+N» erschien nie. Der Streifen mass trotzdem `scrollWidth
// 256`: der letzte Kasten war 22 px breit und trug 38 px Inhalt (218 + 38).
// Die Beschriftungen aller acht Reiter standen auf Breite 0.
// URSACHE: `min-w-0` an der Reiter-HÜLLE (R8, `ce321f202`) — ein Flex-Kind ohne
// inhaltsbezogene Untergrenze passt per Definition immer.
//
// ROT ZU BEKOMMEN (§6.7, einmal gefahren 7.9.2026): in `Reiter.tsx` der Hülle
// wieder `min-w-0` geben ⇒ @390 acht Reiter, `spill` 16 px je Kasten,
// `beschriftung 0`.
test.describe('FB — kein Reiter trägt mehr Inhalt, als sein Kasten fasst', () => {
  for (const [w, h] of [[390, 844], [320, 700]] as const) {
    test(`@${w}: jeder Reiter steht ganz in seinem Kasten und ist lesbar`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h })
      await seed(page, ACHT, '/gesetze/bund/URG')
      const m = await page.evaluate(() => {
        const s = document.querySelector('[data-reiter-streifen]')!
        const k = [...s.querySelectorAll<HTMLElement>('[data-reiter-schluessel]')]
        return {
          streifen: { scrollW: s.scrollWidth, clientW: s.clientWidth },
          reiter: k.map((e) => ({
            schluessel: e.getAttribute('data-reiter-schluessel')!,
            spill: e.scrollWidth - e.clientWidth,
            // Die breiteste Beschriftung im Reiter: der Name (`kern`) bzw. der
            // Kopf. 0 hiesse, der Reiter zeigt niemandem, was er ist.
            beschriftung: Math.max(0, ...[...e.querySelectorAll<HTMLElement>('button span')]
              .filter((x) => !x.className.includes('sr-only'))
              .map((x) => Math.round(x.getBoundingClientRect().width))),
          })),
        }
      })
      expect(m.reiter.length, 'mindestens ein Reiter steht im Bild').toBeGreaterThan(0)
      expect(m.streifen.scrollW, `@${w} Vorstand: 256 in 241`)
        .toBeLessThanOrEqual(m.streifen.clientW + 1)
      for (const r of m.reiter) {
        expect(r.spill, `«${r.schluessel}» ragt über seinen Kasten (Vorstand: 16 px)`)
          .toBeLessThanOrEqual(1)
        expect(r.beschriftung, `«${r.schluessel}» ist ohne Aufschrift (Vorstand: 0 px)`)
          .toBeGreaterThan(0)
      }
    })
  }
})

// ═══ R13-1 · DER AKTIVE REITER IST IMMER GANZ IM BILD ═══════════════════════
//
// GEMESSEN am Vorstand @390 mit acht Reitern, aktiv = letzter: `scrollLeft 785`
// statt der nötigen 843, rechte Kante des aktiven Reiters 312 bei `clientWidth
// 253` — «URG» stand als «U» am Rand, auch nach einem Reload. Ursache war der
// «8 offen»-Knopf, der den Streifen NACH der Rechnung um ~58 px verschmälerte.
test('R13-1 — @390 steht der aktive Reiter vollständig im Streifen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seed(page, ACHT, '/gesetze/bund/URG')
  const m = await masse(page)
  expect(m.aktivRechts, 'der aktive Reiter muss im Bild enden (Vorstand: 312 bei 253)')
    .not.toBeNull()
  expect(m.aktivRechts!).toBeLessThanOrEqual(m.clientW + 1)
  expect(m.sichtbar).toContain('/gesetze/bund/URG')
})

// ═══ R13-3 · DAS FENSTER BEWEGT SICH, ES TAUSCHT NICHT ══════════════════════
//
// GEMESSEN am Vorstand: 15 Reiter, aktiv #14 ⇒ sichtbar [OR, ZGB, ZPO, StGB,
// SchKG, BV, DSG, ARG*]; dann aktiv #15 ⇒ ARG verschwand aus dem Streifen. Der
// aktive Reiter wurde in Slot 8 GETAUSCHT — die Leiste zeigte eine
// Nachbarschaft, die es im Speicher nicht gibt.
test('R13-3 — die sichtbaren Reiter sind immer eine zusammenhängende Teilfolge', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await seed(page, FUENFZEHN, '/gesetze/bund/KKG')
  const speicher = await gespeichert(page)
  const teilfolge = (sichtbar: string[]) => {
    const i = speicher.findIndex((p) => p.split('#')[0] === sichtbar[0])
    expect(i, 'der erste sichtbare Reiter muss im Speicher stehen').toBeGreaterThanOrEqual(0)
    expect(speicher.slice(i, i + sichtbar.length).map((p) => p.split('#')[0])).toEqual(sichtbar)
  }

  const vorher = await masse(page)
  teilfolge(vorher.sichtbar)
  expect(vorher.sichtbar).toContain('/gesetze/bund/KKG')

  await page.goto('/gesetze/bund/KVG')
  await expect(page.locator(`${STREIFEN} [data-reiter-aktiv="true"]`)).toBeVisible({ timeout: 45_000 })
  await page.waitForTimeout(1000)
  const nachher = await masse(page)
  teilfolge(nachher.sichtbar)
  expect(nachher.sichtbar).toContain('/gesetze/bund/KVG')
  // Der Nachbar bleibt Nachbar: ArG darf nicht verschwinden, nur weil ein
  // Reiter weiter hinten aktiv wurde — das war der Befund.
  const start = (s: string | null) => Number((s ?? '0/0/0').split('/')[0])
  expect(start(nachher.fenster) - start(vorher.fenster),
    'das Fenster rückt um höchstens einen Platz nach').toBeLessThanOrEqual(1)
})

// ═══ R13-4 · KEIN 60-PX-LOCH OHNE LESESTELLUNG ══════════════════════════════
//
// GEMESSEN am Vorstand: `.rl-stelle` mit leerem `textContent`, Breite 60 px,
// ZGB-Reiter 137 px (mit «Art. 336c» misst OR 148 px). Entscheide und Rechner
// hatten den Platzhalter gar nicht — drei verschiedene Textanfänge in einer
// Zeile.
test('R13-4 — ein Gesetzes-Reiter ohne Lesestellung reserviert keinen Platz', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await seed(page, ['/gesetze/bund/ZGB', BGE])
  const m = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('[data-reiter-schluessel="/gesetze/bund/ZGB"]')!
    const st = el.querySelector<HTMLElement>('.rl-stelle')
    return {
      stelleBreite: st ? Math.round(st.getBoundingClientRect().width) : 0,
      reiterBreite: Math.round(el.offsetWidth),
    }
  })
  expect(m.stelleBreite, 'kein leerer Platzhalter (Vorstand: 60 px)').toBe(0)
  // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3) · W2·18 Punkt 5, 13.9.2026 ───────────
  // Die Schranke stand auf 110 und stammt aus der Zeit, als der Boden eines
  // Reiters die feste Zahl `--app-reiter-min-b` (5rem = 80 px) war. W2·18
  // Punkt 5 gibt der Aufschrift einen eigenen Boden von sechs Zeichen
  // (`min-w-[6ch]`, `Reiter.tsx`) — sonst stand sie bei sieben Reitern @1024
  // auf Breite 0 («StGB», «ZPO») bzw. als «ZPO-Fr…». Der ZGB-Reiter misst
  // damit 111 statt 104 px (gemessen 13.9.2026, @1440, Dev-Server).
  // Die GEPRÜFTE ZUSAGE ist unverändert und bleibt scharf: kein leerer
  // 60-px-Platzhalter (Zeile darüber), und der Reiter bleibt weit unter dem
  // Vorstand von 137 px. Nachgeführt ist allein die Zahl, um die der Boden
  // gewachsen ist; 120 lässt die 60 px des Platzhalters weiterhin auffliegen.
  expect(m.reiterBreite, 'der Reiter misst seinen Inhalt (Vorstand: 137 px)').toBeLessThan(120)
})

// ═══ R13-5 · DIE RÜCKFAHRKARTE LIEGT DA, WO MAN SIE SUCHT ═══════════════════
//
// GEMESSEN am Vorstand: nach dem Schliessen des letzten Reiters standen 0
// Reiter, der Ring hielt drei Einträge — und der Rechtsklick auf den Leerraum
// ergab `[role=menu]` = 0. Zurück kam man nur mit Alt+⇧+T, mit der Maus gar
// nicht.
// ── DEKLARIERTE TEST-ÄNDERUNG (§6.3) · R14, Entscheid David 7.9.2026 ───────
// Der Fall stand auf dem Zustand «0 Reiter» (`toHaveCount(0)` nach dem letzten
// ✕). Den gibt es seit R14 nicht mehr: der letzte ✕ führt in die Sammlung, die
// Leiste trägt danach genau EINEN Reiter. Die geprüfte ZUSAGE (R13-5) ist
// unverändert — die Rückfahrkarte liegt da, wo man sie sucht, nämlich im
// Rechtsklick auf die freie Fläche; nachgeführt ist allein die Reiterzahl, auf
// der gemessen wird.
test('R13-5 — Rechtsklick auf den Leerraum bietet «Wieder öffnen» an', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await seed(page, [OR, BGE], OR)
  for (const s of ['/gesetze/bund/OR', BGE]) {
    await page.locator(`[data-reiter-schluessel="${s}"] button[aria-label*="schliessen"]`).first().click()
    await page.waitForTimeout(300)
  }
  // R14: übrig bleibt die Sammlung — sie ist die freie Fläche, auf der der
  // Rechtsklick gemessen wird.
  await expect(page.locator(`${STREIFEN} [data-reiter-schluessel]`)).toHaveCount(1)
  await expect(page.locator(`${STREIFEN} [data-reiter-schluessel="/"]`)).toHaveCount(1)

  const kasten = (await page.locator(STREIFEN).boundingBox())!
  await page.mouse.click(kasten.x + kasten.width - 40, kasten.y + kasten.height / 2, { button: 'right' })
  const menue = page.locator('[role=menu]')
  await expect(menue).toHaveCount(1)
  await expect(menue.getByRole('menuitem', { name: /Wieder öffnen/ })).toBeVisible()
  await expect(menue.getByRole('menuitem', { name: 'Neuer Reiter' })).toBeVisible()

  await menue.getByRole('menuitem', { name: /Wieder öffnen/ }).click()
  // Der wiederhergestellte Reiter tritt NEBEN die Sammlung.
  await expect(page.locator(`${STREIFEN} [data-reiter-schluessel]`)).toHaveCount(2)
})

// ═══ R13-6/R13-9 · WAS IM REITER-MENÜ FEHLTE ════════════════════════════════
//
// GEMESSEN am Vorstand @1440 mit drei Reitern: der Blatt-Knopf war `md:hidden`
// (Breite 0) und «Alle schliessen» stand ausschliesslich im Blatt — am Desktop
// also nirgends. Und das Menü kannte kein «Adresse kopieren», obwohl die App
// den Weg hat (`LinkTeilenButton`).
test.describe('R13-6/R13-9 — «Alle schliessen» und «Adresse kopieren» am Reiter', () => {
  test('«Alle schliessen» steht am Desktop im Reiter-Menü und wirkt', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await seed(page, [OR, BGE, RECHNER])
    await page.locator('[data-reiter-schluessel="/gesetze/bund/OR"]').click({ button: 'right' })
    const menue = page.locator('[role=menu]')
    await expect(menue.getByRole('menuitem', { name: 'Alle schliessen' })).toBeVisible()
    await menue.getByRole('menuitem', { name: 'Alle schliessen' }).click()
    // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3) · R14, Entscheid David 7.9.2026 ────
    // Alter Wortlaut: `toHaveCount(0)` und `gespeichert(page) === []`. «Alle
    // schliessen» schliesst seit R14 alle DOKUMENTE; übrig bleibt die
    // Sammlung, wie im Browser das letzte Fenster mit der Neuer-Tab-Seite
    // stehen bleibt. Die geprüfte R13-6-Zusage — die Geste steht am Desktop im
    // Reiter-Menü und WIRKT — ist unverändert.
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel]`)).toHaveCount(1)
    expect(await gespeichert(page)).toEqual(['/'])
  })

  test('«Adresse kopieren» legt die kanonische Adresse in die Zwischenablage', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.setViewportSize({ width: 1440, height: 900 })
    await seed(page, [OR, BGE])
    await page.locator(`[data-reiter-schluessel="${BGE}"]`).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Adresse kopieren' }).click()
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain(BGE)
  })
})

// ═══ R13-7/R13-8 · DIE TASTATURWEGE SIND ABLESBAR UND VOLLSTÄNDIG ═══════════
//
// GEMESSEN am Vorstand: 0 × `aria-keyshortcuts` in der ganzen Leiste, kein
// Alt-Weg im `title` — und `Alt+9` sprang auf den NEUNTEN Reiter, womit bei 15
// Reitern alles ab #10 per Tastatur unerreichbar war.
test.describe('R13-7/R13-8 — Tastatur', () => {
  test('jeder erreichbare Reiter nennt sein Kürzel — im title und für ARIA', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await seed(page, FUENFZEHN.slice(0, 4), '/gesetze/bund/OR')
    const dritter = page.locator('[data-reiter-schluessel="/gesetze/bund/ZPO"]')
    await expect(dritter).toHaveAttribute('title', /Alt\+3/)
    await expect(dritter.locator('button').first()).toHaveAttribute('aria-keyshortcuts', 'Alt+3')
    const letzter = page.locator('[data-reiter-schluessel="/gesetze/bund/STGB"]')
    await expect(letzter.locator('button').first()).toHaveAttribute('aria-keyshortcuts', /Alt\+9/)
  })

  test('Alt+9 springt auf den LETZTEN Reiter, Alt+Bild↓/↑ blättert zyklisch', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await seed(page, FUENFZEHN.slice(0, 12), '/gesetze/bund/OR')
    // GEWARTET WIRD AUF DIE LEISTE, NICHT AUF DIE ADRESSE: die Leser-Route lädt
    // ihren Chunk nach, die URL steht darum vor dem Re-Render der Leiste. Wer
    // nur die URL abfragt, drückt die nächste Taste gegen den ALTEN aktiven
    // Reiter — gemessen 7.9.2026 (Alt+Bild↑ landete auf BGG statt VwVG).
    // Kleinschreibung im Vergleich: der Reiter-Schlüssel folgt der Adresse, und
    // die Route liefert den Erlass-Key nach einer Navigation in seiner
    // kanonischen Schreibung (`VWVG`), während der Speicher die geseedete trägt.
    // Geprüft wird hier die REIHENFOLGE, nicht die Schreibweise.
    // NACHTRAG G23 (7.9.2026): der Seed IST seither kanonisch, die beiden
    // Schreibungen fallen hier also zusammen. Der Vergleich bleibt
    // schreibungsblind — er prüft die Reihenfolge, und er soll nicht rot werden,
    // wenn eine Route ihre Adresse einmal anders normalisiert.
    const aktiv = async () => (await page.locator(`${STREIFEN} [data-reiter-aktiv="true"]`)
      .getAttribute('data-reiter-schluessel'))?.toLowerCase()
    await page.keyboard.press('Alt+9')
    await expect.poll(aktiv).toBe('/gesetze/bund/vwvg')
    // Vom letzten einen weiter = wieder der erste (Umlauf, Browser-Norm).
    await page.keyboard.press('Alt+PageDown')
    await expect.poll(aktiv).toBe('/gesetze/bund/or')
    await page.keyboard.press('Alt+PageUp')
    await expect.poll(aktiv).toBe('/gesetze/bund/vwvg')
  })

  test('das Blatt führt die Kürzel-Liste — sonst lernt sie niemand', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await seed(page, [OR, BGE, RECHNER])
    await page.getByRole('button', { name: 'Alle 3 offenen Reiter' }).click()
    const blatt = page.getByRole('dialog', { name: 'Alle geöffneten Reiter' })
    await expect(blatt.getByText('Alt+9', { exact: true })).toBeVisible()
    await expect(blatt.getByText('zum letzten Reiter')).toBeVisible()
    // Was der Browser abfängt, wird NICHT versprochen (§8).
    await expect(blatt.getByText('Ctrl+Tab')).toHaveCount(0)
  })
})

// ═══ W2·18 WELLE 2 (13.9.2026) · §4.R2 ══════════════════════════════════════
//
// ROT ZU BEKOMMEN (§6.7 — je Massnahme einmal gegen den Vorstand `2a331dcdd`
// gefahren):
//   Punkt 1  `reiterleiste/Reiter.tsx`: `tabIndex={imRing ? 0 : -1}` entfernen
//            ⇒ 0 Reiter mit `tabindex=0`, und ←/→ bewegen nichts (der Zuhörer
//            `onKeyDown` am Streifen in `Reiterleiste.tsx` fehlt dann ebenso).
test.describe('W2·18 Welle 2 Punkt 1 — Pfeiltasten bewegen den FOKUS', () => {
  /** Identität des Reiters, in dem der Fokus gerade steht. */
  const fokusReiter = (page: Page) => page.evaluate(() =>
    document.activeElement?.closest('[data-reiter-schluessel]')
      ?.getAttribute('data-reiter-schluessel') ?? null)

  test('←/→/Home/End wandern, die Auswahl bleibt — und Delete schliesst', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const VIER = FUENFZEHN.slice(0, 4)
    await seed(page, VIER, VIER[0])
    // Genau EIN Reiter im Tabulator-Ring (APG), und zwar der aktive.
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel] [tabindex="0"]`)).toHaveCount(1)
    await page.locator(`${STREIFEN} [data-reiter-schluessel] [tabindex="0"]`).focus()
    await expect.poll(() => fokusReiter(page)).toBe(VIER[0])

    await page.keyboard.press('ArrowRight')
    await expect.poll(() => fokusReiter(page)).toBe(VIER[1])
    // DIE AUSWAHL BLEIBT: der Fokus wandert, navigiert wird erst mit Enter.
    await expect(page.locator(`${STREIFEN} [data-reiter-aktiv="true"]`))
      .toHaveAttribute('data-reiter-schluessel', VIER[0])

    await page.keyboard.press('End')
    await expect.poll(() => fokusReiter(page)).toBe(VIER[3])
    await page.keyboard.press('ArrowRight')  // kein Umlauf am Rand
    await expect.poll(() => fokusReiter(page)).toBe(VIER[3])
    await page.keyboard.press('Home')
    await expect.poll(() => fokusReiter(page)).toBe(VIER[0])
    await page.keyboard.press('ArrowLeft')   // kein Umlauf, andere Seite
    await expect.poll(() => fokusReiter(page)).toBe(VIER[0])

    // Delete schliesst den fokussierten Reiter; der Fokus rückt mit.
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Delete')
    await expect.poll(() => gespeichert(page)).toEqual([VIER[0], VIER[2], VIER[3]])
    await expect.poll(() => fokusReiter(page)).toBe(VIER[2])
  })
})
