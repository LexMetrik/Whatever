// @shard-gruppe: 3
// ═══ W2·24 R11 · DIE REITERLEISTE ALS ARBEITSGERÄT (Prüfrunde 6.9.2026) ═════
//
// Die Prüfrunde R11 hat 42 Funktionen der Arbeitsleiste AUSGEFÜHRT (nicht
// angesehen) und im Kanzlei-Szenario «Art. 336c OR · BGE 146 III 1 · OGer AG
// HOR.2024.19 · ZPO-Fristen · Vorlage Arbeitsvertrag, 30 Minuten Recherche»
// bewertet. Zehn waren defekt oder fehlten. Diese Datei bewacht die sechs, die
// R11 gebaut hat; die Nummern sind die des Inventars.
//
// ROT ZU BEKOMMEN (§6.7 — je Massnahme einmal gegen den Vorstand `2a18f97bb`
// gefahren, 6.9.2026):
//   M1 (#16) `Shell.tsx`: den `paneReiter`-Effekt entfernen ⇒ das rechte
//        Fenster hat keinen Reiter, die Leiste zeigt EINE Marke statt zwei.
//   M2 (#23/#24) GALT BIS R14b («`lib/tabs.istReiterPfad`: `materialien` aus
//        dem Regex streichen»); die Funktion ist mit R14b ersatzlos gestrichen,
//        jede Route ist ein Reiter. Gleichwertiger Rot-Weg heute: in
//        `lib/verlaufLabel.verlaufLabel` den `materialPfad`-Zweig streichen ⇒
//        der Material-Reiter heisst «Zuletzt geöffnet» statt
//        «Praxismitteilung EHRA 1/25».
//   M3 (#37) `lib/tabs`: den `merkeGeschlossen`-Aufruf in `schliesseTab`
//        entfernen ⇒ Alt+Shift+T bringt den Reiter nicht zurück.
//   M4 (#35) `layout/Reiterleiste.tsx`: das `onContextMenu` am Reiter
//        entfernen ⇒ `[role=menu]` bleibt 0.
//   M6 (#33/#34) den `wheel`-Effekt bzw. das `onDoubleClick` am Streifen
//        entfernen ⇒ `scrollLeft` bleibt 0 bzw. die Reiterzahl ändert sich nicht.
//   M8 (#28) `gesetz-leser/v3/ReiterAktion.tsx` auf `naechsteInstanz`+
//        `merkeTab` zurücksetzen ⇒ `[data-pane]`-Spalten bleiben 0.
import { test, expect, type Page } from '@playwright/test'

const REITER = 'nav[aria-label="Offene Reiter"]'
const STREIFEN = '[data-reiter-streifen]'
/** Startroute BEWUSST ohne eigenen Reiter (`lib/tabs.istReiterPfad`): sonst
 *  legte der TabTracker beim Laden einen zusätzlichen Reiter an und jede
 *  Zählung wäre um eins daneben. Muster aus `w224-reiter-umordnen-d16`.
 *
 *  ── DEKLARIERTE SONDEN-ÄNDERUNG (§6.3) · R14b, 7.9.2026 ──────────────────
 *  Seit R14b trägt JEDE Route einen Reiter (`lib/tabs.ts`, Block «R14b»);
 *  `istReiterPfad` ist ersatzlos gestrichen. `/kontakt` bleibt nur noch der
 *  Ort, an dem `localStorage` überhaupt erreichbar ist, bevor `seed` ihn
 *  überschreibt — GELANDET wird danach auf dem zuletzt geseedeten Reiter, so
 *  dass die Reiterzahl exakt die geseedete bleibt und keine Zählung dieser
 *  Datei sich verschiebt. */
const START = '/kontakt'

const OR = '/gesetze/bund/OR#art-336_c'
const BGE = '/rechtsprechung/bge_146_III_1'
const RECHNER = '/rechner/zpo-fristen'
const VORLAGE = '/vorlagen/arbeitsvertrag'
const MATERIAL = '/materialien/BJ-EHRA-PM-2025-01'

test.describe.configure({ timeout: 90_000 })

/** Reiter-Identitäten in sichtbarer Reihenfolge — die Wahrheit im DOM. */
const schluessel = (page: Page) => page.$$eval(
  `${STREIFEN} [data-reiter-schluessel]`,
  (els) => els.map((e) => e.getAttribute('data-reiter-schluessel')!))

/** Gespeicherte Reiter — die Wahrheit, die den Neustart überlebt. */
const gespeichert = (page: Page) => page.evaluate(() =>
  (JSON.parse(localStorage.getItem('lexmetrik-tabs') ?? '[]') as { path: string }[]).map((t) => t.path))

/** Speicher seeden und neu laden (Reiter UND Fenster). */
async function seed(page: Page, tabs: string[], panes: string[] = []): Promise<void> {
  await page.goto(START)
  await page.evaluate(({ t, p }) => {
    localStorage.setItem('lexmetrik-tabs', JSON.stringify(t.map((path) => ({ path }))))
    localStorage.setItem('lexmetrik-panes', JSON.stringify(p))
  }, { t: tabs, p: panes })
  // R14b: `page.reload()` landete wieder auf /kontakt und legte dort seit R14b
  // einen zusätzlichen Reiter an. Ziel ist darum der letzte geseedete Reiter
  // (Dublette ⇒ Zahl und Reihenfolge unverändert).
  await page.goto(tabs[tabs.length - 1] ?? '/')
  // `seed(page, [])` heisst «leerer Speicher». Seit R14b trägt JEDE Landeroute
  // einen Reiter — der Schlüssel wird danach darum noch einmal entfernt, damit
  // die Aufrufer, die anschliessend selbst navigieren, wirklich bei null
  // anfangen (sonst stünde neben ihrem Dokument ein Sammlungs-Reiter).
  if (tabs.length === 0) await page.evaluate(() => localStorage.removeItem('lexmetrik-tabs'))
  if (tabs.length + panes.length > 0) {
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel]`).first()).toBeVisible({ timeout: 20_000 })
  }
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
})

// ═══ M1 · P4 — DAS ZWEITE FENSTER BEKOMMT SEINEN REITER UND SEINE MARKE ═════
//
// GEMESSEN am Vorstand (Screen `pruef-r11-05`): `panes = [BGE]` neben
// `tabs = [OR, Rechner]` ergab ZWEI Reiter und nur EINE Marke «Fenster
// links:◧» — rechts stand nachweislich BGE 146 III 1, und die Leiste
// verschwieg ihn. §5a Ziff. 4 verlangt zwei Marken.
test.describe('M1 — jedes Fenster hat seinen Reiter (P4)', () => {
  test('ein Pane ohne Reiter bekommt einen; beide Marken ◧ und ◨ stehen da', async ({ page }) => {
    await seed(page, [OR, RECHNER], [BGE])
    // Auf den Reiter des HAUPTFENSTERS gehen: die Marke «links» hängt an der
    // Primär-URL. (`seed` landet seit R14b bereits auf RECHNER; der Sprung auf
    // OR ist die eigentliche Aussage des Falls und bleibt.)
    await page.goto(OR)
    // Der Reiter des rechten Fensters entsteht aus dem Pane-Zustand.
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel="${BGE}"]`)).toBeVisible({ timeout: 20_000 })
    expect(await schluessel(page)).toContain(BGE)
    // Zwei Marken — «links» ohne ein «rechts» sagt nichts.
    const marken = page.locator(`${REITER} span[title^="Fenster"]`)
    await expect(marken).toHaveCount(2)
    await expect(page.locator(`${REITER} span[title="Fenster links"]`)).toHaveText('◧')
    await expect(page.locator(`${REITER} span[title="Fenster rechts"]`)).toHaveText('◨')
  })

  test('kein Wildwuchs: der Reiter entsteht genau EINMAL, auch über einen Reload', async ({ page }) => {
    await seed(page, [OR], [BGE])
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel="${BGE}"]`)).toBeVisible({ timeout: 20_000 })
    expect(await gespeichert(page)).toHaveLength(2)
    await page.reload()
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel="${BGE}"]`)).toBeVisible({ timeout: 20_000 })
    expect(await gespeichert(page)).toHaveLength(2)
  })

  test('P4 rückwärts: das ✕ des Fenster-Reiters nimmt das Fenster mit', async ({ page }) => {
    await seed(page, [OR], [BGE])
    await expect(page.locator('[data-pane="sekundaer"]')).toHaveCount(1, { timeout: 20_000 })
    await page.locator(`${STREIFEN} [data-reiter-schluessel="${BGE}"]`)
      .getByRole('button', { name: /schliessen/ }).click()
    await expect(page.locator('[data-pane="sekundaer"]')).toHaveCount(0)
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lexmetrik-panes') ?? '[]'))).toEqual([])
  })
})

// ═══ M2 · MATERIALIEN SIND REITER MIT NAMEN ═════════════════════════════════
//
// GEMESSEN am Vorstand (J3): der Aufruf von `/materialien/BJ-EHRA-PM-2025-01`
// (H1 «Praxismitteilung EHRA 1/25») liess die Leiste bei ihren fünf Reitern —
// 1'561 prerenderte Detailseiten waren reiterlos. Und wo doch einer im
// Speicher lag (I1), hiess er «Material öffnen»: eine Aufforderung statt eines
// Namens.
test.describe('M2 — Materialien reiterfähig und benannt', () => {
  test('eine Material-Detailseite erzeugt einen Reiter mit ihrem echten Titel', async ({ page }) => {
    await seed(page, [])
    await page.goto(MATERIAL)
    const reiter = page.locator(`${STREIFEN} [data-reiter-schluessel="${MATERIAL}"]`)
    await expect(reiter).toBeVisible({ timeout: 20_000 })
    // Der Name kommt aus dem lazy geladenen Material-Manifest — nie die
    // Aufforderung «Material öffnen» (§8).
    await expect(reiter).toContainText('Praxismitteilung EHRA 1/25', { timeout: 20_000 })
    await expect(reiter).not.toContainText('Material öffnen')
  })

  // @390 — auf dem Desktop ist das Blatt erst ab Überlauf da (`md:hidden`),
  // in der schmalen Ansicht ab drei Reitern (§5a Ziff. 8). Der Gegenstand
  // dieses Falls ist die GRUPPIERUNG, nicht die Breite.
  test('im Überlauf-Blatt steht die Materialie unter «Materialien», nicht unter «Weitere»', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seed(page, [OR, BGE, RECHNER, MATERIAL])
    await page.locator(REITER).getByRole('button', { name: /Alle \d+ offenen Reiter/ }).click()
    const blatt = page.getByRole('dialog', { name: 'Alle geöffneten Reiter' })
    await expect(blatt).toBeVisible()
    await expect(blatt.getByText('Materialien', { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(blatt.getByText('Weitere', { exact: true })).toHaveCount(0)
  })
})

// ═══ M3 · «ZULETZT GESCHLOSSEN» ═════════════════════════════════════════════
//
// GEMESSEN am Vorstand (G4/G4c): Alt+Shift+T liess die Reiterliste
// unverändert, und `localStorage` führte keinen Schliess-Ring.
test.describe('M3 — zuletzt geschlossen', () => {
  test('✕, dann Alt+Shift+T: der Reiter steht wieder an seiner alten Stelle', async ({ page }) => {
    await seed(page, [OR, BGE, RECHNER])
    await page.locator(`${STREIFEN} [data-reiter-schluessel="${BGE}"]`)
      .getByRole('button', { name: /schliessen/ }).click()
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel="${BGE}"]`)).toHaveCount(0)
    // Kein Eingabefeld darf den Fokus halten — dort greift die Leiste bewusst
    // nicht ein (bestehende Regel, `w224-reiterverhalten`). Nach dem ✕ liegt
    // der Fokus ohnehin auf `<body>`; der `blur()` macht das nur unabhängig
    // von der Reihenfolge der Klicks davor.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.keyboard.press('Alt+Shift+T')
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel="${BGE}"]`)).toBeVisible()
    // AN SEINER POSITION, nicht am Ende — das ist der Prüfgegenstand.
    expect((await schluessel(page)).indexOf(BGE)).toBe(1)
  })

  test('das Überlauf-Blatt bietet die Wiederherstellung sichtbar an', async ({ page }) => {
    // @390 wie oben: dort ist das Blatt ab drei Reitern der Haupt-Weg. Vier
    // Reiter seeden, damit nach dem Schliessen noch drei stehen.
    await page.setViewportSize({ width: 390, height: 844 })
    await seed(page, [OR, BGE, RECHNER, VORLAGE])
    // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3, W2·24-R13, Prüfbefund R13-2) ───────
    // Geschlossen wurde bisher am Reiter IM STREIFEN. Seit R13-2 hängt es an
    // der gemessenen Breite, welche vier Reiter @390 nebeneinander stehen —
    // «ZPO-Fristen» steht dort in der Regel gar nicht mehr, sondern im Blatt.
    // Das Schliessen ist hier BLOSSER AUFBAU (die Zusage ist die sichtbare
    // Wiederherstellung darunter); es geht darum jetzt über das Blatt, das
    // alle Reiter führt. Umfang und Erwartung des Falls sind unverändert.
    await page.locator(REITER).getByRole('button', { name: /Alle \d+ offenen Reiter/ }).click()
    const listeVorher = page.getByRole('dialog', { name: 'Alle geöffneten Reiter' })
    await listeVorher.getByRole('button', { name: /«ZPO-Fristen» schliessen/ }).click()
    await page.keyboard.press('Escape')
    await page.locator(REITER).getByRole('button', { name: /Alle \d+ offenen Reiter/ }).click()
    const blatt = page.getByRole('dialog', { name: 'Alle geöffneten Reiter' })
    const knopf = blatt.getByRole('button', { name: /Wieder öffnen/ })
    await expect(knopf).toBeVisible()
    await knopf.click()
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel="${RECHNER}"]`)).toBeVisible()
  })
})

// ═══ M4 · DAS REITER-KONTEXTMENÜ ════════════════════════════════════════════
//
// GEMESSEN am Vorstand (C2): Rechtsklick ⇒ `[role=menu]` 0 vorher wie nachher.
test.describe('M4 — Kontextmenü auf einem Reiter', () => {
  test('Rechtsklick öffnet ein role=menu mit den fünf Aktionen', async ({ page }) => {
    await seed(page, [OR, BGE, RECHNER, VORLAGE])
    await expect(page.getByRole('menu')).toHaveCount(0)
    await page.locator(`${STREIFEN} [data-reiter-schluessel="${BGE}"]`).click({ button: 'right' })
    const menue = page.getByRole('menu')
    await expect(menue).toBeVisible()
    for (const wort of ['Daneben öffnen', 'Duplizieren', 'Alle anderen schliessen', 'Rechts davon schliessen', 'Schliessen']) {
      await expect(menue.getByRole('menuitem', { name: new RegExp(`^${wort}`) })).toBeVisible()
    }
  })

  test('«Alle anderen schliessen» lässt genau diesen einen Reiter stehen', async ({ page }) => {
    await seed(page, [OR, BGE, RECHNER, VORLAGE])
    await page.locator(`${STREIFEN} [data-reiter-schluessel="${RECHNER}"]`).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Alle anderen schliessen' }).click()
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel]`)).toHaveCount(1)
    expect(await schluessel(page)).toEqual([RECHNER])
  })

  test('«Rechts davon schliessen» kappt genau den Rest rechts', async ({ page }) => {
    await seed(page, [OR, BGE, RECHNER, VORLAGE])
    await page.locator(`${STREIFEN} [data-reiter-schluessel="${BGE}"]`).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rechts davon schliessen' }).click()
    expect(await schluessel(page)).toEqual(['/gesetze/bund/OR', BGE])
  })

  test('«Duplizieren» legt die zweite Instanz an (?r=2) — die Funktion des alten Leser-Knopfs', async ({ page }) => {
    await seed(page, [OR])
    await page.locator(`${STREIFEN} [data-reiter-schluessel="/gesetze/bund/OR"]`).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Duplizieren' }).click()
    await expect(page).toHaveURL(/\/gesetze\/bund\/OR\?r=2/)
    expect(await schluessel(page)).toContain('/gesetze/bund/OR?r=2')
  })

  test('Escape schliesst, das Browser-Kontextmenü bleibt nur ÜBER dem Reiter unterdrückt', async ({ page }) => {
    await seed(page, [OR, BGE])
    await page.locator(`${STREIFEN} [data-reiter-schluessel="${BGE}"]`).click({ button: 'right' })
    await expect(page.getByRole('menu')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
  })

  test('ohne Maus: Shift+F10 auf dem Reiter öffnet dasselbe Menü (WCAG 2.1.1)', async ({ page }) => {
    await seed(page, [OR, BGE])
    await page.locator(`${STREIFEN} [data-reiter-schluessel="${BGE}"] button`).first().focus()
    await page.keyboard.press('Shift+F10')
    await expect(page.getByRole('menu')).toBeVisible()
    // Pfeiltasten sind das Versprechen von `role=menu` — es wird eingelöst.
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('[role="menuitem"]:focus')).toHaveCount(1)
  })
})

// ═══ M6 · MAUSRAD UND DOPPELKLICK ═══════════════════════════════════════════
//
// GEMESSEN am Vorstand: @390 mit echtem Überlauf (`scrollWidth 818 /
// clientWidth 253`) liess `wheel(0, 300)` den `scrollLeft` bei 0 — nur ein
// waagrechtes Rad bewegte die Leiste (F3b). Und rechts des letzten Reiters
// lagen 457 px Leerfläche, auf der ein Doppelklick nichts tat (C3).
test.describe('M6 — Mausrad rollt, Doppelklick öffnet', () => {
  // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3, W2·24-R13, Prüfbefund R13-2, 7.9.2026)
  // Hier stand: «@390 rollt das senkrechte Mausrad die ÜBERLAUFENDE Leiste
  // waagrecht». Die Vorbedingung dieses Falls — dass die Leiste überläuft —
  // ist mit R13-2 abgeschafft, und zwar absichtlich: die Reiter schrumpfen,
  // und was dann noch nicht ganz ins Bild passt, steht im «+N»-Blatt statt
  // stumm hinter der (per CSS unsichtbaren) Scrollkante. Ein Fall, der einen
  // Zustand herstellen will, den es nicht mehr geben darf, misst nichts.
  // GEPRÜFT WIRD DARUM DIE NEUE ZUSAGE an derselben Stelle und mit derselben
  // Bestückung: @390 läuft nichts über, kein Reiter ist angeschnitten, und der
  // Weg zu den übrigen ist sichtbar. Der `wheel`-Griff selbst BLEIBT als
  // Rückfall für den Restfall «ein einziger Reiter ist breiter als der ganze
  // Streifen» (sehr schmale Geräte); bewacht ist er weiter vom Fall darunter,
  // der zeigt, dass er ohne Überlauf die Seite in Ruhe lässt.
  test('@390: die Leiste läuft nicht über — der Rest steht im Blatt', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const tabs = [OR, BGE, RECHNER, VORLAGE, '/gesetze/bund/ZGB']
    await seed(page, tabs)
    await page.waitForTimeout(1500)
    const streifen = page.locator(STREIFEN)
    const m = await streifen.evaluate((el) => {
      const k = [...el.querySelectorAll<HTMLElement>('[data-reiter-schluessel]')]
      return {
        scrollW: el.scrollWidth, clientW: el.clientWidth, sichtbar: k.length,
        letzteKante: k.length ? Math.round(k[k.length - 1].offsetLeft + k[k.length - 1].offsetWidth) : 0,
      }
    })
    expect(m.scrollW, 'Vorstand: 818 in 253').toBeLessThanOrEqual(m.clientW + 1)
    expect(m.letzteKante).toBeLessThanOrEqual(m.clientW + 1)
    expect(m.sichtbar).toBeGreaterThan(0)
    expect(m.sichtbar).toBeLessThan(tabs.length)
    await expect(page.locator(REITER).getByRole('button', { name: /Alle \d+ offenen Reiter/ }))
      .toHaveText(`+${tabs.length - m.sichtbar}`)
  })

  test('ohne Überlauf bleibt das Rad beim Dokument — die Seite scrollt weiter', async ({ page }) => {
    await seed(page, [OR])
    await page.goto(OR)
    const streifen = page.locator(STREIFEN)
    await expect(streifen).toBeVisible({ timeout: 20_000 })
    expect(await streifen.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await streifen.hover({ position: { x: 20, y: 12 } })
    await page.mouse.wheel(0, 400)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  })

  test('Doppelklick auf den Leerraum der Leiste öffnet einen neuen Reiter', async ({ page }) => {
    await seed(page, [OR])
    const streifen = page.locator(STREIFEN)
    const kasten = (await streifen.boundingBox())!
    const letzter = (await page.locator(`${STREIFEN} [data-reiter-schluessel]`).last().boundingBox())!
    const leerX = letzter.x + letzter.width + (kasten.x + kasten.width - letzter.x - letzter.width) / 2
    expect(leerX, 'es muss echten Leerraum rechts des letzten Reiters geben')
      .toBeGreaterThan(letzter.x + letzter.width)
    await page.mouse.dblclick(leerX, kasten.y + kasten.height / 2)
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel]`)).toHaveCount(2)
    expect(await gespeichert(page)).toContain('/')
  })

  test('Doppelklick AUF einem Reiter erzeugt keinen zweiten (das Ereignis steigt auf)', async ({ page }) => {
    await seed(page, [OR, BGE])
    await page.locator(`${STREIFEN} [data-reiter-schluessel="${BGE}"]`).dblclick()
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel]`)).toHaveCount(2)
  })
})

// ═══ M8 · «DANEBEN ÖFFNEN» TUT, WAS ES SAGT ═════════════════════════════════
//
// GEMESSEN am Vorstand (H3, Screen `pruef-r11-09`): der Klick auf «⧉ In neuem
// Fenster» ergab `panes: []` und KEINE `[data-pane]`-Spalte — er legte einen
// zweiten Reiter `?r=2` an, während sein Tooltip «in einem zweiten Fenster»
// versprach.
test.describe('M8 — der Erlass-Kopf öffnet wirklich das Fenster', () => {
  test('Klick auf «Daneben öffnen» erzeugt die zweite Pane-Spalte', async ({ page }) => {
    await seed(page, [])
    await page.goto('/gesetze/bund/OR')
    const knopf = page.getByRole('button', { name: /daneben öffnen/i })
    await expect(knopf).toBeVisible({ timeout: 30_000 })
    await expect(knopf).toContainText('Daneben öffnen')
    await expect(knopf).not.toContainText('In neuem Fenster')
    await knopf.click()
    await expect(page.locator('[data-pane="sekundaer"]')).toHaveCount(1, { timeout: 20_000 })
    // Geöffnet wird die ZWEITE INSTANZ (`?r=2`) — die eigene Adresse selbst
    // gilt als offen und würde abgewiesen (Herleitung in `ReiterAktion.tsx`).
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lexmetrik-panes') ?? '[]')))
      .toEqual(['/gesetze/bund/OR?r=2'])
    // M1 zieht nach: das neue Fenster hat seinen Reiter und seine Marke.
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel="/gesetze/bund/OR?r=2"]`)).toBeVisible()
    await expect(page.locator(`${REITER} span[title="Fenster rechts"]`)).toHaveText('◨')
  })
})

// ═══ R1/R2/R5 (Prüfer R11, 6.9.2026) · DIE LEISTE SELBST ════════════════════

test.describe('R2 — die Geometrie der Leiste', () => {
  // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3) · R14, David 7.9.2026 · R14b-Nachzug ─
  // Dieser Fall stand auf «/» — dort war die Leiste bis R14 leer. R14 machte
  // die Sammlung zum Reiter, so dass nur noch die Meta-Routen leer standen;
  // gemessen wurde darum von `/kontakt` aus, mit
  // `toHaveAttribute('data-reiter-leer', '')`.
  // R14b hat auch diese Ausnahme gestrichen: `/kontakt` trägt jetzt den Reiter
  // «Kontakt», das Attribut `data-reiter-leer` existiert nicht mehr (ersatzlos,
  // §17-Gegengewicht). Ein `toHaveAttribute` darauf wäre ab sofort ein Tor, das
  // nicht mehr scheitern KANN (§6.7) — es ist durch die Zusage ersetzt, die
  // R14b tatsächlich gibt: auf einer Meta-Route steht genau EIN Reiter, und er
  // heisst «Kontakt».
  // Die drei GEOMETRIE-Zusagen sind unverändert (`borderBottomWidth: 0px` ·
  // «+» am linken Inhaltsrand · gleiche Leistenhöhe vor und nach dem Wechsel).
  test('kein Rahmen-Unterstrich, «+» am linken Inhaltsrand, Höhe konstant', async ({ page }) => {
    // GEMESSEN am Stand `c91541617`: auf «/» stand ein leerer 34-px-Streifen
    // mit `border-b` über die volle Breite — eine Trennlinie, die nichts trennt.
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(START)
    const leiste = page.locator(REITER)
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel]`)).toHaveCount(1)
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel="/kontakt"]`))
      .toContainText('Kontakt', { timeout: 20_000 })
    const leer = await leiste.evaluate((e) => ({
      unterstrich: getComputedStyle(e).borderBottomWidth,
      hoehe: Math.round(e.getBoundingClientRect().height),
    }))
    expect(leer.unterstrich, 'der Unterstrich liegt auf, er ist kein Rahmen').toBe('0px')

    // «+» steht links: seine linke Kante fällt mit dem Inhaltsrand zusammen
    // (px-4/sm:px-6 des Streifens), nicht am rechten Fensterrand.
    const plus = page.locator(`${REITER} button[aria-label="Neuer Reiter"]`)
    const x = await plus.evaluate((e) => Math.round(e.getBoundingClientRect().left))
    const rand = await leiste.evaluate((e) => Math.round(e.getBoundingClientRect().left))
    expect(x - rand, `«+»-Abstand vom Leisten-Rand: ${x - rand} px`).toBeLessThan(40)

    // CLS 0: der erste Reiter darf die Leistenhöhe nicht ändern (die Höhe ist
    // fest, der 1-px-Rahmen liegt border-box INNEN).
    await page.goto(OR)
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel]`).first()).toBeVisible()
    const voll = await leiste.evaluate((e) => Math.round(e.getBoundingClientRect().height))
    expect(voll, `Meta-Reiter ${leer.hoehe} px · Gesetzes-Reiter ${voll} px`).toBe(leer.hoehe)
  })

  // R14: die Sammlung selbst ist nie ohne Reiter — der Zustand, den der Fall
  // darüber misst, ist auf «/» nicht mehr erreichbar.
  test('R14 — auf «/» trägt die Leiste immer mindestens einen Reiter', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(page.locator(`${STREIFEN} [data-reiter-schluessel]`)).toHaveCount(1)
  })
})

test.describe('R1 — die Leiste ist nicht trist', () => {
  test('auch inaktive Reiter tragen ihre Registerfarbe (60 %), nicht Grau', async ({ page }) => {
    // GEMESSEN: alle inaktiven Reiter standen auf `bg-ink-400 opacity-30` —
    // die Registerfarbe erschien erst beim Überfahren.
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(OR)
    await page.goto(BGE)
    await page.goto(RECHNER)
    const striche = await page.$$eval(
      `${STREIFEN} [data-reiter-schluessel]`,
      (els) => els.map((e) => {
        const s = e.querySelector('span[aria-hidden][class*="absolute"]') as HTMLElement | null
        const c = s ? getComputedStyle(s) : null
        return {
          aktiv: e.getAttribute('data-reiter-aktiv') === 'true',
          farbe: c?.backgroundColor ?? '',
          deckkraft: c?.opacity ?? '',
        }
      }),
    )
    expect(striche.length, 'Vorbedingung: drei Reiter aus drei Registern').toBeGreaterThanOrEqual(3)
    const inaktiv = striche.filter((s) => !s.aktiv)
    expect(inaktiv.length, 'Vorbedingung: es gibt inaktive Reiter').toBeGreaterThan(0)
    // Verschiedene Register → verschiedene Farben. Eine graue Leiste hätte für
    // alle DENSELBEN Wert (das war der Befund).
    expect(new Set(striche.map((s) => s.farbe)).size,
      `Strich-Farben: ${striche.map((s) => s.farbe).join(' | ')}`).toBeGreaterThan(1)
    for (const s of inaktiv) {
      expect(Number(s.deckkraft), `inaktive Deckkraft ${s.deckkraft}`).toBeCloseTo(0.6, 2)
    }
  })
})

test.describe('R5 — zwei Instanzen sind unterscheidbar', () => {
  test('«Duplizieren» beschriftet die zweite Instanz eigenständig', async ({ page }) => {
    // GEMESSEN: zwei Instanzen desselben Erlasses hiessen beide «OR».
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(OR)
    const reiter = page.locator(`${STREIFEN} [data-reiter-schluessel]`)
    await expect(reiter).toHaveCount(1)
    await reiter.first().click({ button: 'right' })
    await page.locator('[data-reiter-menue="duplizieren"]').click()
    await expect(reiter).toHaveCount(2)
    // Die sr-only Positionsansage («Reiter 1: ») gehört NICHT zur Beschriftung —
    // sie unterscheidet jeden Reiter von jedem, auch zwei gleichnamige. Gemessen
    // wird die SICHTBARE Kurzform.
    const sichtbar = (t: string) => t.replace(/\s+/g, ' ').replace(/^Reiter \d+:\s*/, '').trim()
    const namen = await reiter.evaluateAll((els) => els.map((e) => e.textContent ?? ''))
    const kurz = namen.map(sichtbar)
    expect(new Set(kurz).size, `Beschriftungen: ${kurz.join(' | ')}`).toBe(2)
    // ROT-BEWEIS (§6.7): der gemessene Vorher-Zustand (beide «OR») fällt durch.
    expect(new Set(['Reiter 1: OR', 'Reiter 2: OR'].map(sichtbar)).size).toBe(1)
  })
})

test.describe('R3/R4 — das Überlauf-Blatt', () => {
  test('Kurzform in der Zeile, Volltitel im title, keine Wappen/Piktogramme', async ({ page }) => {
    // GEMESSEN @390: das Blatt baute seine Namen selbst und zeigte den
    // Volltitel; die erste Spalte trug Kantonswappen bzw. ⚖ ✎ ∑.
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(OR)
    await page.goto(RECHNER)
    await page.goto(VORLAGE)
    await page.locator(`${REITER} button[aria-label*="offenen Reiter"]`).click()
    const blatt = page.getByRole('dialog', { name: 'Alle geöffneten Reiter' })
    await expect(blatt).toBeVisible()
    // `TabPanel` wird lazy geladen — auf die erste Zeile warten, nicht nur auf
    // die Fläche (sonst misst der Fall den Suspense-Fallback).
    const zeilen = blatt.locator('li button:not([aria-label])')
    await expect(zeilen.first()).toBeVisible({ timeout: 15_000 })
    // R4 · kein <img> (Wappen) im Blatt.
    await expect(blatt.locator('img')).toHaveCount(0)
    // R3 · jede Reiter-Zeile trägt einen `title` mit Inhalt.
    const titel = await zeilen.evaluateAll((els) => els.map((e) => e.getAttribute('title') ?? ''))
    expect(titel.length, 'Vorbedingung: das Blatt zeigt Zeilen').toBeGreaterThan(0)
    for (const t of titel) expect(t, `Zeile ohne title (${titel.join(' | ')})`).toMatch(/\S/)
  })
  // ── W2·18 Punkt 6 (13.9.2026) · DER FILTER ÜBERLEBT DAS SCHLIESSEN NICHT ──
  //
  // GEMESSEN am Vorstand `6f7eb49c0` (Chromium, Dev-Server @390): «zpo» ins
  // Suchfeld, Blatt zu, Blatt wieder auf — das Feld trug weiter «zpo», die
  // Liste zeigte eine von drei Zeilen, und im Bild stand kein Grund dafür.
  // Ursache war die FORM: «offen?» und «Filter» lagen als zwei Zustände
  // nebeneinander, und das Blatt hat acht Schliess-Wege. Seit W2·18 ist es
  // EIN Zustand (`reiterleiste/blatt.BLATT_ZU`), zu heisst ohne Filter.
  //
  // ROT ZU BEKOMMEN (§6.7, so gefahren): in `Reiterleiste.tsx` Blatt und
  // Filter wieder trennen (`useState(false)` + `useState('')`, Schliessen nur
  // `setBlattOffen(false)`).
  test('W2·18 — der Filter ist beim nächsten Öffnen leer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seed(page, [OR, RECHNER, VORLAGE])
    const auf = () => page.locator(`${REITER} button[aria-label*="offenen Reiter"]`).click()
    await auf()
    const blatt = page.getByRole('dialog', { name: 'Alle geöffneten Reiter' })
    await expect(blatt.locator('li button:not([aria-label])').first()).toBeVisible({ timeout: 15_000 })
    const feld = blatt.getByRole('searchbox')
    await feld.fill('zpo')
    // Vorbedingung: der Filter wirkt überhaupt.
    await expect(blatt.locator('li')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(blatt).toHaveCount(0)
    await auf()
    const wieder = page.getByRole('dialog', { name: 'Alle geöffneten Reiter' })
    await expect(wieder.getByRole('searchbox')).toHaveValue('')
    await expect(wieder.locator('li')).toHaveCount(3)
  })
})
