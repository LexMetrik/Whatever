// @shard-gruppe: 4
// ── DEKLARIERTE SONDEN-ÄNDERUNG (§6.3) · W2·18 Welle 3 Punkt 3, 13.9.2026 ───
// Der Reiter ist seit diesem Schritt ein `<a href>` (React-Router-`Link`)
// statt eines `<button>` — die Rollen-Korrektur ist die Massnahme selbst
// (WCAG 4.1.2). Die Sonde greift darum über `link` statt `button`; Name,
// Reihenfolge und geprüfte Zusage sind unverändert.
// ═══ W2·24 §5a Ziff. 3 + Befund F5 · WIE VIELE REITER EINE NAVIGATION KOSTET ═
//
// GEMESSENER ANLASS (6.9.2026, Preview 4335, gebautes dist/): drei Klicks über
// die Gesetze-Übersicht (OR → ZGB → ZPO) hinterliessen DREI Reiter —
// `components/TabTracker.tsx` rief bei jeder Navigation `lib/tabs.merkeTab()`,
// und das hängt an. David 6.9.2026: «kein Reiter-Wildwuchs» · «analog zum
// browser». Seit dem R2-Nachzug gilt die Browser-Regel: die Navigation ERSETZT
// den aktiven Reiter, ein zweiter entsteht nur auf ausdrückliche Geste.
//
// Und dieselbe Messung zeigte den zweiten Defekt (F5): nach 1500 px Scrollen
// stand im Reiter `/gesetze/bund/ZGB#art-3`, in der Adresse weiter
// `/gesetze/bund/ZGB` — dieselbe Adresse trug zwei Beschriftungen («ZGB» kalt,
// «Art. 3 ZGB» nach dem Scrollen), ohne dass jemand einen Artikel gewählt
// hätte. Die Beschriftung kam daraufhin aus `TabEintrag.wahl` (dem Anker der
// ADRESSE), die Lesestellung blieb in `path`.
//
// ── D27 (David 6.9.2026) · DIE REGEL IST UMGEDREHT ──────────────────────────
// «diese funktion, dass es anzeigt in welchem artikel wir sind, soll der tab
// bekommen. es kann dann direkt im gesetz raus.» Der Reiter FOLGT der
// Lesestellung — und Determinismus (§2) heisst seither «gleiche Lesestellung ⇒
// gleiche Beschriftung» statt «gleiche Adresse ⇒ gleiche Beschriftung». Fall
// (e) unten misst darum das Gegenteil von dem, was er beim R2-Nachzug mass;
// die ZUSAGE ist dieselbe geblieben (die Beschriftung ist reproduzierbar,
// nicht beliebig), nur ihr Bezugspunkt ist ein anderer.
//
// ROT ZU BEKOMMEN (§6.7), je Fall einer:
//   (a)/(b) in `TabTracker.tsx` `ersetzeTab(...)` wieder durch `merkeTab(...)`
//           ersetzen ⇒ (a) findet 3 statt 1 Reiter.
//   (c) den Capture-Handler `useNeuerReiterGeste` entfernen ⇒ der Ctrl-Klick
//       legt keinen Reiter an (bzw. der Browser öffnet ein eigenes Fenster).
//   (d) in `layout/HeaderSuche.tsx` den `lmNeuerReiter`-Zweig streichen ⇒ der
//       Treffer verbraucht den Reiter, aus dem er kommt.
//   (e) in `lib/tabs.basisKurzform` `hashVon(t.path) ?? t.wahl` wieder durch
//       `t.wahl` ersetzen ⇒ die Beschriftung bleibt beim Scrollen stehen (die
//       alte F5-Regel), und (e) misst «ZGB» statt «Art. N ZGB».
import { test, expect, type Page } from '@playwright/test'
import { kopfSucheOeffnen } from './helpers/kopfSuche'

const REITER = 'nav[aria-label="Offene Reiter"]'

/** Die gespeicherte Reiter-Liste — die Wahrheit, die auch den Neustart überlebt. */
const pfade = (page: Page) => page.evaluate(() =>
  (JSON.parse(localStorage.getItem('lexmetrik-tabs') ?? '[]') as { path: string }[]).map((t) => t.path))

/** Reiter-IDENTITÄTEN ohne den Lesestellungs-Anker, den der Leser laufend
 *  nachführt (`#art-…`, s. `lib/tabs.aktualisiereTabArtikel`). */
const identitaeten = async (page: Page) => (await pfade(page)).map((p) => p.split('#')[0])

/** Sichtbare Beschriftungen der Arbeitsleiste (erster Knopf je Reiter = der
 *  Name; die Griffe ✕/⧉ dahinter zählen nicht mit, ohne die sr-only-Ordnungszahl). */
// ── DEKLARIERTE TEST-ÄNDERUNG (§6.3, D27, 6.9.2026) ─────────────────────────
// `.filter(Boolean)` vor dem Zusammenfügen: seit D27 trägt jeder Gesetzes-
// Reiter eine Spanne für die Lesestellung (`.rl-stelle`), die die BREITE des
// Artikels reserviert und darum auch dann im DOM steht, wenn der Scroll-Spy
// noch nichts gemeldet hat — dann leer. Ohne den Filter ergäbe das Zusammen-
// fügen ein führendes Leerzeichen (« ZGB»). Gemessen wird unverändert die
// SICHTBARE Beschriftung.
const beschriftungen = (page: Page) => page.evaluate(() =>
  [...document.querySelectorAll('nav[aria-label="Offene Reiter"] [data-reiter-aktiv]')]
    // DEKLARIERTE SONDEN-ÄNDERUNG (§6.3), W2·18 Welle 3 Punkt 3: der Reiter
    // ist seit diesem Schritt ein `<a href>` statt eines `<button>`; gemessen
    // wird unverändert die sichtbare Beschriftung.
    .map((d) => [...(d.querySelector('a')?.querySelectorAll('span:not(.sr-only)') ?? [])]
      .map((s) => s.textContent?.trim()).filter(Boolean).join(' ')))

async function leserBereit(page: Page): Promise<void> {
  await expect(page.locator('article[id^="art-"]').first()).toBeAttached({ timeout: 20_000 })
}

test.describe('Arbeitsleiste — eine Navigation, ein Reiter', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3, W2·24-R5-F1C, David-Befund D17,
    // 6.9.2026) · WO DER RÜCKWEG AUF DIE ÜBERSICHT KLICKBAR IST ──────────────
    // Vier Fälle klickten «zurück auf /gesetze» am Bereichs-Reiter im
    // Titelblatt (`header.sticky a[href="/gesetze"]`). Den gibt es nicht mehr:
    // «ich mochte die seitenleiste. können wir die behalten. und das oben
    // entfernen?» — die Bereichs-Navigation lebt seither ausschliesslich in der
    // Seitenleiste. Geklickt wird darum dort. Damit die Leiste auch IM LESER
    // offen steht (dort startet sie per Ä1c-Vorgabe eingeklappt, und eine
    // einmal getroffene Nutzerwahl gewinnt), wird die Wahl vorab gesetzt — das
    // ist Testaufbau, keine Assertion: Umfang, Zusagen und Erwartungen der
    // Fälle bleiben Wort für Wort dieselben.
    await page.addInitScript(() => {
      try { localStorage.setItem('lexmetrik-seitenleiste-eingeklappt.v2', '0') } catch { /* privater Modus */ }
    })
    await page.goto('/gesetze')
    await page.evaluate(() => localStorage.removeItem('lexmetrik-tabs'))
  })

  // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3, David-Befund D7, 6.9.2026) ───────────
  // «achte darauf dass der reiter bei gesetz mitzählt». Bis zu diesem Nachzug
  // waren die Bereichs-Übersichten für die Reiter unsichtbar; die Schleife
  // dieses Falls kehrt nach jedem Erlass über den Kopf-Link auf `/gesetze`
  // zurück, und diese Rückkehr liess den Reiter darum unverändert stehen.
  // Seit dem D7-Nachzug ist `/gesetze` ein Reiter-Ziel wie jedes andere (seit
  // R14b gilt das ohne jede Ausnahme für JEDE Route) — die Rückkehr ERSETZT
  // den aktiven Reiter, genau wie im Browser.
  // Die geprüfte ZUSAGE ist unverändert die von §5a Ziff. 3 (kein Wildwuchs:
  // sechs Navigationen, EIN Reiter); nachgeführt ist nur, welchen Inhalt
  // dieser eine Reiter am Ende trägt — den zuletzt besuchten, und das ist
  // nach der letzten Schleifenrunde die Übersicht.
  test('(a) sechs Navigationen hinterlassen EINEN Reiter', async ({ page }) => {
    await page.goto('/gesetze')
    for (const key of ['ZGB', 'OR', 'ZPO']) {
      await page.locator(`a[href="/gesetze/bund/${key}"]`).first().click()
      await leserBereit(page)
      // Zwischenstand: der Erlass hat den Reiter der Übersicht übernommen.
      expect(await identitaeten(page)).toEqual([`/gesetze/bund/${key}`])
      await page.locator('aside[data-app-seitenleiste] a[href="/gesetze"]').first().click()
      await expect(page).toHaveURL(/\/gesetze$/, { timeout: 20_000 })
    }
    expect(await identitaeten(page)).toEqual(['/gesetze'])
  })

  // ── D7 · DIE PFLICHTFÄLLE (a)–(e) DES DAVID-BEFUNDS ───────────────────────
  // ROT ZU BEKOMMEN: GALT BIS R14b («in `lib/tabs.istReiterPfad` die
  // `BEREICHS_UEBERSICHTEN`-Zeile streichen ⇒ (D7-e) findet 0 Reiter»);
  // Funktion und Konstante sind mit R14b ersatzlos gestrichen. Gleichwertig
  // heute: in `lib/tabs.KURZFORM` die Zeile `'/gesetze'` streichen ⇒ (D7-e)
  // findet die Beschriftung «Schweizer Gesetzessammlung» statt «Gesetze».
  // Unverändert: `ersetzeTab` in `TabTracker` durch `merkeTab` tauschen ⇒
  // (D7-c) findet 2 statt 1.
  test('(D7 a/b) Erlass ohne und mit Artikel-Anker erzeugt je EINEN zählenden Reiter', async ({ page }) => {
    await page.goto('/gesetze/bund/OR')
    await leserBereit(page)
    expect(await identitaeten(page)).toEqual(['/gesetze/bund/OR'])
    await expect(page.locator(`${REITER} [data-reiter-aktiv]`)).toHaveCount(1)
    // (b) derselbe Erlass über einen Deep-Link auf den Artikel
    await page.goto('/gesetze/bund/OR#art-336_c')
    await leserBereit(page)
    expect(await identitaeten(page)).toEqual(['/gesetze/bund/OR'])
    expect((await beschriftungen(page))[0]).toContain('336c')
  })

  test('(D7 c) Blättern im selben Erlass erzeugt keinen zweiten Reiter', async ({ page }) => {
    await page.goto('/gesetze/bund/ZGB')
    await leserBereit(page)
    const vorher = await identitaeten(page)
    // Sprung über die Gliederung/Deep-Link INNERHALB desselben Erlasses.
    await page.goto('/gesetze/bund/ZGB#art-3')
    await leserBereit(page)
    await page.mouse.wheel(0, 1500)
    await page.waitForTimeout(600)
    expect(await identitaeten(page)).toEqual(vorher)
    await expect(page.locator(`${REITER} [data-reiter-aktiv]`)).toHaveCount(1)
  })

  // (D7 d) «Wechsel Bund→Kanton→International je eigener Reiter nur bei
  // Ctrl-Klick, sonst Ersatz». Geprüft wird der ERLASS-Wechsel; die Ebene
  // spielt für die Regel keine Rolle (`tabSchluessel` kennt nur den Pfad,
  // nicht die Ebene) — und dieselbe Ebenen-Frage prüft
  // `(f)` samt Kanonisierung der Alt-Adressen bereits am Datenmodell.
  // WICHTIG für die Nachbau-Treue: die Schritte laufen als SPA-KLICKS. Ein
  // `page.goto()` ist ein Kaltstart, und dort ersetzt der Tracker bewusst
  // nichts (`aktiv.current === null`) — mit `goto` gemessen sähe man einen
  // Defekt, wo keiner ist (so beim ersten Bau dieses Falls geschehen).
  test('(D7 d) der Erlass-Wechsel ersetzt; Ctrl-Klick öffnet den zweiten', async ({ page }) => {
    await page.goto('/gesetze')
    await page.locator('a[href="/gesetze/bund/ZGB"]').first().click()
    await leserBereit(page)
    expect(await identitaeten(page)).toEqual(['/gesetze/bund/ZGB'])
    await page.locator('aside[data-app-seitenleiste] a[href="/gesetze"]').first().click()
    await page.locator('a[href="/gesetze/bund/OR"]').first().click()
    await leserBereit(page)
    expect(await identitaeten(page), 'der Wechsel hat einen zweiten Reiter angelegt').toEqual(['/gesetze/bund/OR'])
    await page.locator('aside[data-app-seitenleiste] a[href="/gesetze"]').first().click()
    await page.locator('a[href="/gesetze/bund/ZPO"]').first().click({ modifiers: ['ControlOrMeta'] })
    await expect.poll(() => identitaeten(page), { timeout: 10_000 })
      .toEqual(['/gesetze', '/gesetze/bund/ZPO'])
  })

  test('(D7 e) die Übersicht /gesetze ist ein Reiter «Gesetze» und zählt mit', async ({ page }) => {
    await page.goto('/gesetze')
    await expect.poll(() => identitaeten(page), { timeout: 10_000 }).toEqual(['/gesetze'])
    await expect(page.locator(`${REITER} [data-reiter-aktiv]`)).toHaveCount(1)
    // §5a Ziff. 2: die Beschriftung ist die Kurzform, NICHT der SEO-Titel
    // («Schweizer Recht an einem Ort: …», Prüfbefund R3-F7).
    expect((await beschriftungen(page))[0]).toBe('Gesetze')
    // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3) · R14, Entscheid David 7.9.2026 ────
    // Alter Wortlaut: «Die Startseite bleibt bewusst ohne Reiter (Begründung an
    // `istReiterPfad`)» mit `toEqual(['/gesetze'])` nach dem Klick auf die
    // Marke. Seit R14 ist die Sammlung ein Reiter: der Klick auf die Marke
    // AKTIVIERT sie und lässt die Übersicht stehen, statt sie zu überschreiben
    // — genau der Verlust, den David 7.9.2026 als «weird» gemeldet hat. Die
    // D7-Zusage dieses Falls (die Übersicht /gesetze ist ein Reiter «Gesetze»
    // und zählt mit) ist unberührt.
    await page.locator('header.sticky a[aria-label^="LexMetrik"]').first().click()
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })
    await expect.poll(() => identitaeten(page), { timeout: 10_000 }).toEqual(['/gesetze', '/'])
  })

  test('(b) der Wechsel auf einen offenen Reiter wirft den aktiven NICHT weg', async ({ page }) => {
    await page.goto('/gesetze')
    await page.locator('a[href="/gesetze/bund/ZGB"]').first().click()
    await leserBereit(page)
    // zweiter Reiter per Geste, dann zurück auf den ersten — beide müssen bleiben
    await page.locator('aside[data-app-seitenleiste] a[href="/gesetze"]').first().click()
    await page.locator('a[href="/gesetze/bund/OR"]').first().click({ modifiers: ['ControlOrMeta'] })
    await expect.poll(() => pfade(page), { timeout: 10_000 }).toHaveLength(2)
    // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3, W2·24-R5-F1C, D16, 6.9.2026) ────────
    // Hier stand ein Sammel-Selektor mit `.first()`, der den anzuklickenden
    // Reiter aus der DOM-REIHENFOLGE griff. Die war bis D16 eine andere: die
    // Leiste bündelte nach Kategorie/Herkunft und stellte darum den
    // OR-Erlass vor die Übersicht. Seit D16 zeigt sie die Speicherreihenfolge
    // (der Bug war genau dieses Bündeln, `e2e/w224-reiter-umordnen-d16`), also
    // steht die Übersicht vorn — und `.first()` träfe sie statt des Lesers.
    // Der Reiter wird deshalb BENANNT statt gezählt; die geprüfte Zusage
    // («ein Klick in der Leiste kostet keinen Reiter») ist unverändert.
    await page.locator(`${REITER} [data-reiter-schluessel="/gesetze/bund/OR"]`)
      .getByRole('link', { name: /^Reiter \d+: / }).click()
    await leserBereit(page)
    expect((await pfade(page)).length, 'ein Klick in der Leiste kostete einen Reiter').toBe(2)
  })

  test('(c) Ctrl/⌘-Klick öffnet im Hintergrund — die Ansicht bleibt stehen', async ({ page }) => {
    await page.goto('/gesetze')
    await page.locator('a[href="/gesetze/bund/ZGB"]').first().click()
    await leserBereit(page)
    await page.locator('aside[data-app-seitenleiste] a[href="/gesetze"]').first().click()
    await expect(page).toHaveURL(/\/gesetze$/, { timeout: 20_000 })
    await page.locator('a[href="/gesetze/bund/OR"]').first().click({ modifiers: ['ControlOrMeta'] })
    // §6.3/D7: der Rückweg auf die Übersicht ersetzt den ZGB-Reiter durch den
    // Übersichts-Reiter (siehe (a)); die geprüfte Zusage dieses Falls — der
    // Ctrl-Klick legt einen ZWEITEN an und die Ansicht bleibt stehen — ist
    // unverändert.
    await expect.poll(() => identitaeten(page), { timeout: 10_000 })
      .toEqual(['/gesetze', '/gesetze/bund/OR'])
    // Wie im Browser: der neue Reiter geht im HINTERGRUND auf.
    await expect(page).toHaveURL(/\/gesetze$/)
  })

  test('(d) ⌘/Ctrl+Enter in der Kopfsuche öffnet einen NEUEN Reiter', async ({ page }) => {
    // Wie (e)/(g): der Fall lädt ZWEI schwere Leser (ZGB, dann OR über den
    // Treffer-Sprung) und wartet dazwischen bis zu 20 s auf die Trefferliste.
    // GEMESSEN 6.9.2026 (gebautes `dist/`, --workers=2, --repeat-each=3): 2/3
    // rot mit «Test timeout of 30000ms exceeded» — die Uhr lief beim `press`
    // ab, nicht die Bedienung: derselbe Griff braucht ohne Parallel-Last
    // 46–152 ms (Einzelmessung, 3/3). `test.slow()` verdreifacht das Mass;
    // Zusagen, Erwartungen und Umfang bleiben Wort für Wort dieselben (§6.3).
    test.slow()
    await page.goto('/gesetze/bund/ZGB')
    await leserBereit(page)
    expect(await identitaeten(page)).toEqual(['/gesetze/bund/ZGB'])
    const feld = await kopfSucheOeffnen(page)
    await feld.fill('Obligationenrecht')
    await expect(page.locator('header.sticky [role="option"], header.sticky [role="listbox"] a').first())
      .toBeVisible({ timeout: 20_000 })
    await feld.press('ControlOrMeta+Enter')
    await leserBereit(page)
    const nach = await identitaeten(page)
    expect(nach.length, `Reiter nach ⌘+Enter: ${nach.join(' | ')}`).toBe(2)
    expect(nach[0], 'der Reiter, aus dem der Treffer kam, ist verbraucht').toBe('/gesetze/bund/ZGB')
  })

  // ── (e) · D27 · DER REITER FOLGT DER LESESTELLUNG ────────────────────────
  // Bis zum R2-Nachzug prüfte dieser Fall das GEGENTEIL («die Beschriftung
  // folgt der Adresse, nicht dem Scrollen», F5). David hat die Regel am
  // 6.9.2026 umgedreht; die Zusage bleibt die Reproduzierbarkeit — sie hängt
  // jetzt an der Lesestellung statt an der Adresse. Herleitung im Kopf.
  test('(e) die Beschriftung folgt der Lesestellung — live beim Scrollen (D27)', async ({ page }) => {
    // Der Fall lädt den ZGB-Leser dreimal (Kaltstart, Reload, SPA-Gegenprobe);
    // das reisst unter Parallel-Last das 30-s-Regelmass, ohne dass etwas kaputt
    // wäre. `test.slow()` verdreifacht es — Zusage und Messung unverändert.
    test.slow()
    await page.goto('/gesetze/bund/ZGB')
    await leserBereit(page)
    // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3, W2·24-R5-F1E/C, 6.9.2026) · WAS AM
    //    DOKUMENTANFANG ÜBERHAUPT ZU MELDEN IST ────────────────────────────
    // Hier stand `.toEqual([stringMatching(/^Art\. \S+ ZGB$/)])`: der Fall
    // setzte voraus, dass der Leser schon BEI scrollY 0 einen Artikel meldet.
    // Das war nie eine Produkt-Zusage, sondern ein Randwert der Fensterhöhe.
    // GEMESSEN (Nullprobe 6.9.2026, beide Stände im gebauten `dist/`, Chromium
    // @1440×900, frischer Reiter):
    //   F1G-Stand bbd7100bf : `art-1`.top = 877 px ⇒ Spy meldet ⇒ «Art. 1 ZGB»
    //   Integrationszweig   : `art-1`.top = 921 px ⇒ Spy meldet nichts ⇒ «ZGB»
    // Die 44 px sind der D28-Kopf aus R6d («Erlass-Suche im Leser-Kopf») samt
    // R6d-Nachzug — bei 900 px Fensterhöhe fällt `art-1` damit unter die
    // Bezugslinie des Scroll-Spys. Das F1G-Protokoll bleibt für SEINEN Stand
    // richtig (§0 Ziff. 2b: ergänzt, nicht nachgeführt); die Zusage von D27
    // ist davon unberührt — am Dokumentanfang steht KEIN Artikel an der Linie,
    // und der Reiter erfindet dort auch keinen. Geprüft wird darum der
    // WECHSEL, nicht ein bestimmter Startwert.
    await expect.poll(() => beschriftungen(page), { timeout: 20_000 })
      .toEqual([expect.stringMatching(/ZGB$/)])
    const anfang = (await beschriftungen(page))[0]
    const vorher = anfang
    // GEMESSEN 6.9.2026: `page.mouse.wheel` ohne vorheriges `move` liefert sein
    // Rad an der Zeigerposition (0,0) ab — dort steht das Titelblatt, nicht die
    // Textspalte, und der Leser scrollt keinen Pixel (window.scrollY blieb 0).
    // Der Zeiger geht darum zuerst in die Textspalte. (Dieselbe Falle steckt in
    // den Fällen, die nach dem Rad «es hat sich NICHTS geändert» messen — dort
    // fällt sie nicht auf, weil das Nichts-Ereignis auch ohne Scrollen eintritt.)
    await page.mouse.move(720, 500)
    await page.mouse.wheel(0, 1500)
    // Und der Rad-Wurf wird BELEGT, bevor auf seine Wirkung gewartet wird:
    // sonst meldet ein misslungenes Scrollen dasselbe Bild wie eine stehen
    // gebliebene Beschriftung, und die Diagnose beginnt an der falschen Stelle
    // (genau das kostete am 6.9.2026 einen Durchgang).
    await page.waitForFunction(() => window.scrollY > 0, undefined, { timeout: 10_000 })
    // ZUSAGE 1: der Text WECHSELT (die Rot-Probe der alten Regel).
    await expect.poll(() => beschriftungen(page).then((b) => b[0]), { timeout: 20_000 })
      .not.toBe(vorher)
    const nachher = (await beschriftungen(page))[0]
    expect(nachher, `Beschriftung nach dem Scrollen: «${nachher}»`).toMatch(/^Art\. \S+ ZGB$/)
    // Die Stellung steht auch im gespeicherten Pfad — sie überlebt den Neustart.
    const stelle = (await pfade(page))[0]
    expect(stelle).toMatch(/#art-/)

    // ── ZUSAGE 2 (Determinismus, §2) · GLEICHE STELLUNG ⇒ GLEICHE BESCHRIFTUNG
    // Der Reload setzt den Leser bewusst NICHT an die alte Stelle zurueck —
    // W2·10-UI-NAV/R4 hat das entschieden («beim erneuten Oeffnen KEIN
    // Auto-Sprung, sondern ein unaufdringlicher Chip», `lesePosition.ts`).
    // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3, 6.9.2026) · WAS DER NEUSTART TRÄGT ──
    // Hier stand `.toBe(anfang)`: der Fall erwartete nach dem Reload wieder den
    // Dokumentanfang. GEMESSEN (Integrationszweig, gebautes `dist/`, ZGB,
    // 1500 px, dann Reload): der Reiter zeigt weiter «Art. 3 ZGB», sein
    // gespeicherter Pfad weiter `#art-3` — die LESESTELLUNG ist genau das, was
    // den Neustart ueberlebt (`lib/tabs`, dieselbe Quelle wie der `title`
    // «gelesen bis …», §5). Am F1G-Stand fiel das nicht auf, weil der Spy dort
    // schon bei scrollY 0 wieder meldete und den gespeicherten Wert
    // ueberschrieb (Messung oben). Die geprueste Zusage ist unveraendert
    // «gleiche Stellung ⇒ gleiche Beschriftung» — nur wird sie jetzt an der
    // Stellung gemessen, die wirklich gespeichert ist.
    await page.reload()
    await leserBereit(page)
    await expect.poll(() => beschriftungen(page).then((b) => b[0]), { timeout: 20_000 })
      .toBe(nachher)
    expect((await pfade(page))[0], 'die Lesestellung ueberlebt den Neustart').toBe(stelle)
    await page.mouse.move(720, 500)
    await page.mouse.wheel(0, 1500)
    await page.waitForFunction(() => window.scrollY > 0, undefined, { timeout: 10_000 })
    await expect.poll(() => beschriftungen(page).then((b) => b[0]), { timeout: 20_000 })
      .toBe(nachher)

    // ZUSAGE 3: KALTSTART == SPA. Beide Wege auf denselben Erlass, beide bei
    // der Stellung «Dokumentanfang» — dieselbe Zeichenkette.
    await page.goto('/gesetze')
    await page.evaluate(() => localStorage.removeItem('lexmetrik-tabs'))
    await page.goto('/gesetze')
    await page.locator('a[href="/gesetze/bund/ZGB"]').first().click()
    await leserBereit(page)
    // `anfang` ist der KALTSTART-Wert von ganz oben (page.goto auf den Leser);
    // der Klick-Weg muss dieselbe Zeichenkette liefern — genau das war der
    // F5-Befund («ZGB» kalt vs. «Art. 1 ZGB» per SPA), nur jetzt auf der
    // anderen Seite der Regel geloest.
    await expect.poll(() => beschriftungen(page).then((b) => b[0]), { timeout: 20_000 }).toBe(anfang)
  })

  // ── (h) · D27 · OHNE LESE-GRIFF WIRD DIE STELLUNG NICHT ANGETASTET ────────
  // Fall (e) oben faellt nur auf, solange `art-1` bei 900 px Fensterhoehe UEBER
  // der Bezugslinie des Scroll-Spys liegt (877 px am Stand vom 7.9.2026; bei
  // 921 px meldete der Spy am Dokumentanfang nichts und der Defekt blieb
  // unsichtbar — genau so ueberlebte er die Staende 0ba97c5d6/a60dd7f75).
  // Dieser Fall misst die Zusage ohne jede Geometrie: eine gespeicherte
  // Stellung, KEIN Scrollen, und danach steht sie unveraendert da.
  // ROT ZU BEKOMMEN (§6.7): in `gesetz-leser/inhalt-hooks.tsx` das Tor
  // `if (gescrollt.current)` um den `aktualisiereTabArtikel`-Zweig streichen ⇒
  // der Spy schreibt beim Aufsetzen `#art-1` ueber `#art-99`.
  test('(h) ohne Lese-Griff bleibt die gespeicherte Stellung unangetastet (D27)', async ({ page }) => {
    await page.goto('/gesetze/bund/ZGB')
    await leserBereit(page)
    await page.evaluate(() => localStorage.setItem(
      'lexmetrik-tabs', JSON.stringify([{ path: '/gesetze/bund/ZGB#art-99' }])))
    await page.reload()
    await leserBereit(page)
    // Feste Wartezeit mit Begruendung: geprueft wird ein NICHT-Ereignis, auf das
    // kein Poll warten kann. 2000 ms decken den ersten Observer-Frame plus die
    // 200-ms-Entprellung des Schreibpfads um eine Zehnerpotenz ab (gemessen:
    // der Ueberschreiber stand ohne Tor ~150 ms nach dem Reload im Speicher).
    await page.waitForTimeout(2000)
    expect((await pfade(page))[0], 'die gespeicherte Stellung wurde ueberschrieben')
      .toBe('/gesetze/bund/ZGB#art-99')
  })

  // ── (g) · D27 · IM SPLIT FOLGT JEDES FENSTER SEINER EIGENEN STELLUNG ──────
  test('(g) beide Pane-Reiter tragen je ihre eigene Stellung (D27, Split)', async ({ page }) => {
    // Zwei Leser-Instanzen desselben Erlasses in einem Fenster — Begründung für
    // `test.slow()` wie bei (e).
    test.slow()
    await page.goto('/gesetze/bund/OR')
    await leserBereit(page)
    await page.getByRole('button', { name: /daneben öffnen/i }).first().click()
    await expect(page.locator('[data-pane="sekundaer"]')).toHaveCount(1, { timeout: 20_000 })
    // Zwei Reiter auf denselben Erlass (`?r=2` ist die zweite Instanz).
    await expect.poll(() => identitaeten(page), { timeout: 20_000 }).toHaveLength(2)
    // Im SEKUNDÄREN Fenster scrollen — nur dessen Reiter darf wandern.
    const vorher = await beschriftungen(page)
    const pane = page.locator('[data-pane="sekundaer"]')
    const kasten = await pane.boundingBox()
    if (!kasten) throw new Error('Pane ohne Kasten')
    await page.mouse.move(kasten.x + kasten.width / 2, kasten.y + kasten.height / 2)
    await page.mouse.wheel(0, 2500)
    await expect.poll(() => beschriftungen(page), { timeout: 20_000 }).not.toEqual(vorher)
    const nachher = await beschriftungen(page)
    // Genau EINE Beschriftung hat sich geändert — nicht beide zusammen.
    const geaendert = nachher.filter((b, i) => b !== vorher[i])
    expect(geaendert.length, `vorher: ${vorher.join(' | ')} · nachher: ${nachher.join(' | ')}`).toBe(1)
  })

  test('(f) der Neustart ändert nichts an der Liste', async ({ page }) => {
    await page.goto('/gesetze')
    await page.locator('a[href="/gesetze/bund/ZGB"]').first().click()
    await leserBereit(page)
    await page.locator('a[href="/gesetze/bund/OR"]').first().click({ modifiers: ['ControlOrMeta'] })
    await expect.poll(() => pfade(page), { timeout: 10_000 }).toHaveLength(2)
    // Verglichen werden die IDENTITÄTEN: die Lesestellung (`#art-…`) führt der
    // Leser laufend nach, sie ist kein Neustart-Effekt.
    const vorher = await identitaeten(page)
    await page.reload()
    await leserBereit(page)
    expect(await identitaeten(page)).toEqual(vorher)
  })
})
