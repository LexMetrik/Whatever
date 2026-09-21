// @shard-gruppe: 3
// ─── H3 · Zähler und Erreichbarkeit des Rechtsprechungs-Panels ───────────────
//
// ZWEI ZUSAGEN, die diese Spec messbar macht:
//
//  1. JEDER ENTSCHEID BLEIBT ERREICHBAR. In V3 steht unter dem Artikel keine
//     Bezüge-Zeile mehr (Pos. 12). Der Weg zu den Entscheiden ist der Öffner —
//     und er führt ins Panel, in BEIDEN Panes. Wäre der Öffner weg oder das
//     Panel leer, wäre die Rechtsprechung des Artikels unerreichbar geworden:
//     der eine Fehler, den H3 nicht machen darf.
//
//  2. DIE REGEL DAVIDS VOM 16.8.2026 (F8): «Rechtsprechung im Text» AUS ⇒
//     der Zähler weg. Und trotzdem erreichbar — über «Ansicht ▾» und über die
//     Taste «r» (Kap. 4h). Beides wird hier geprüft, nicht nur die halbe Regel.
//
// ── §6.3-NACHZUG (H3-Nachzug Ä53/Ä56, 17.8.2026): DIE RANDLASCHE IST WEG ─────
// Diese Spec verlangte bis hierher an vier Stellen `[data-v3-panel-lasche]`. Die
// Lasche ist gestrichen, weil sie gemessen 16 px @390 / 4 px @1024 IM Normtext
// lag und @1440 das wortgleiche Doppel des Kopf-Zählers war (Herleitung in
// `v3/LeserPanelOeffner.tsx`). Die geprüften ZUSAGEN sind unverändert — nur der
// Öffner, mit dem sie geprüft werden, ist der, den es je Zuschnitt gibt
// (`helpers/panelOeffnen.ts`). Ihre ABWESENHEIT prüft `leser-v3-panel-nachzug` (f).
//
// ROT GESEHEN (§6.7, 17.8.2026, gemessen statt behauptet):
//  · Fall (b): in `v3/LeserRahmenV3.tsx` den F8-Torwächter entfernt
//    (`panelZone = true` und `panelOeffner` ohne `panel.oeffnerSichtbar`) ⇒
//    «locator('[data-v3-panel-zaehler]') Expected 0, Received 1».
//    ANMERKUNG: es genügt NICHT, die Bedingung in `LeserPanelZone` aufzuheben —
//    der äussere Torwächter im Rahmen fängt das ab. Die F8-Regel hat GENAU EINEN
//    wirksamen Ort, und das ist der Rahmen; wer sie brechen will, muss dort
//    hinein. Beim ersten Rot-Versuch (Sabotage in der Zone) blieb die Spec grün —
//    das ist die Auskunft, wo die Regel wirklich lebt.
//  · Fall (a)/(c)/(d) hängen an denselben zwei Stellen: fällt der Öffner, fällt
//    (a); fällt die Portal-Rolle `data-v3-pane`, fällt (c); fällt der `r`-Zweig in
//    `parts/LeserTastatur.tsx`, fällt (d).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { panelAufziehen } from './helpers/panelOeffnen'

async function warteLeser(page: Page): Promise<void> {
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
}

test.describe('H3 — Zähler, Lasche, F8-Regel', () => {
  // ── §6.3-DEKLARATION (D35-F2, Entscheid David 7.9.2026) ───────────────────
  // Der Fall hiess «… und der Zähler bekommt seine Zahl» und wartete auf
  // `data-v3-panel-anzahl`. Die N1-Herleitung darunter bleibt als Beleg ihres
  // Datums stehen (§0 Ziff. 2b, 7.9.2026: Kopf «3» gegen Zeile «11»); D35-F2
  // löst denselben §5-Befund eine Ebene höher — der Kopf nennt GAR KEINE
  // Artikel-Zahl mehr, die Zahl steht an genau einem Ort (Funktionszeile).
  // Was der Fall unverändert prüft: der Öffner führt wirklich ins Panel, und
  // die Entscheide stehen darin. Dass die Zahl genau einmal vorkommt, misst
  // `e2e/w224-d35-f2-kopf.e2e.ts` (a) mit eigener Rot-Probe.
  test('(a) D @1440 StPO: der Kopf-Griff führt ins Panel — ohne eine Zahl zu nennen', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await warteLeser(page)

    // Im Lesekörper steht KEINE Bezüge-Zeile mehr (Pos. 12) — sie ist der Grund,
    // aus dem es den Öffner überhaupt gibt.
    await expect(page.locator('[data-bezuege-zeile]')).toHaveCount(0)

    const zaehler = page.locator('[data-v3-panel-zaehler]')
    await expect(zaehler).toBeVisible()
    // ── §6.3-DEKLARATION (N1, David 7.9.2026) · DIE ZAHL IST VON ANFANG AN DA ─
    // Hier stand: «Vor dem Öffnen steht dort KEINE Zahl — der Shard ist nicht
    // geladen, und eine 0 wäre eine Behauptung über den Bestand (§8).» Der
    // zweite Halbsatz gilt unverändert; der erste beschrieb die QUELLE, nicht
    // die Zusage. Gemessen 7.9.2026 @1440 an OR Art. 336c: die Bezüge-Zeile am
    // Artikel nannte «11 Entscheide», der Kopf-Zähler daneben «3» — zwei Zahlen
    // für dieselbe Sache, weil der Zähler die GEFILTERTEN Kanten des lazy
    // geladenen Shards zählte. Er liest jetzt die Zähl-Datei (ø 289 B, kommt im
    // Leerlauf), also dieselbe Bezugsgrösse wie die Zeile. Folge: die Zahl steht
    // vor dem ersten Öffnen — und die Beschriftung des Knopfes wechselt nicht
    // mehr unter dem Cursor, sobald der Shard eintrifft (D33).
    // WAS UNVERÄNDERT GILT und hier weiter geprüft wird: ohne Datei keine Zahl
    // (kein `0` aus Unwissen), und der Öffner führt wirklich ins Panel.
    await expect(zaehler).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('[data-v3-panel]')).toHaveCount(0)
    // D35-F2: kein Zähl-Attribut, und die Beschriftung trägt keine Ziffer.
    expect(await zaehler.getAttribute('data-v3-panel-anzahl')).toBeNull()
    const textVor = ((await zaehler.textContent()) ?? '').trim()
    expect(textVor, 'der Kopf-Griff schreibt eine Zahl hin').not.toMatch(/\d/)

    await zaehler.click()
    await expect(page.locator('[data-v3-panel]')).toBeVisible()
    await expect(zaehler).toHaveAttribute('aria-expanded', 'true')

    // Das Öffnen ändert die Beschriftung nicht — die N1-Falle («zwei Namen für
    // denselben Knopf») bleibt geschlossen, jetzt baulich statt durch Rechnung.
    expect(((await zaehler.textContent()) ?? '').trim(),
      'die Beschriftung wechselt beim Öffnen').toBe(textVor)

    // Und die Entscheide stehen wirklich im Panel, nicht bloss der Reiter.
    await expect(page.locator('[data-v3-panel] [data-v3-panel-gruppe]').first()).toBeVisible({ timeout: 20_000 })
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  // ── §6.3-DEKLARATION (D35-F2, Entscheid David 7.9.2026) ───────────────────
  // Hier stand «(b) F8: ‹Rechtsprechung im Text› aus ⇒ Zähler weg, Menü-Weg
  // bleibt». Davids F8-Regel vom 16.8.2026 und die Messreihe im Dateikopf
  // bleiben unverändert stehen (§0 Ziff. 2b); der Schalter, den der Fall umlegte,
  // ist mit Variante A ERSATZLOS gefallen — der Kopf trägt keine Artikel-Zahl
  // mehr, die man hätte verbergen wollen (`v3/leserOptionen.ts`). Mit ihm fällt
  // der Menü-Eintrag «Entscheide & Kontext …», der ihn vertrat. Ein Fall über
  // ein Steuerelement, das es nicht gibt, ist keine Sonde (§17-Gegengewicht).
  // Die verbliebene Zusage — genau EIN Öffner je Breite, unbedingt — prüft
  // `e2e/leser-v3-kopf.e2e.ts` (g).

  test('(c) Split-View: das Pane trägt seinen eigenen Öffner, und das Blatt nennt sein Pane', async ({ page }) => {
    test.slow() // schwere Split-View-Interaktion (Präzedenz A17/FL-1)
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    // Das zweite Pane entsteht über die Bedienung, nicht über die Adresse — genau
    // wie in `leser-kopf-paritaet` (ein `?r=`-Parameter erzeugt keines).
    await page.goto('/gesetze/bund/AIG')
    await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
    const art5 = page.locator('#art-5')
    await expect(art5).toBeAttached({ timeout: 20_000 })
    await art5.scrollIntoViewIfNeeded()
    await page.waitForTimeout(250)
    const stgbLink = art5.locator('a[href*="54/757_781_799"][href*="#art_66_a"]:not([href*="66_a_bis"])').first()
    await expect(stgbLink).toBeVisible({ timeout: 10_000 })
    await stgbLink.click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: /nebeneinander öffnen/ }).click()

    const pane = page.locator('[data-pane="sekundaer"]')
    await expect(pane).toBeVisible({ timeout: 10_000 })
    await expect(pane.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })

    // Im Pane ist das Panel IMMER ein Blatt (nie drei vertikale Flächen). BEIDE
    // Panes tragen einen Öffner, sonst wäre die Rechtsprechung in einer von ihnen
    // unerreichbar — im 590-px-Pane (Zuschnitt `mini`) ist es der Menü-Eintrag,
    // und dass er in JEDEM Pane steht, ist die A2-Zusage.
    await expect(page.locator('[data-v3-ansicht-panel-auf]')).toHaveCount(0) // Menüs zu
    await expect(page.locator('[data-v3-panel-spur="blatt"]')).toHaveCount(2)

    // Das Blatt nennt SEIN Pane (H2-Portal-Vertrag) — ohne diese Marke wären zwei
    // offene Panels im DOM nicht auseinanderzuhalten.
    const rollen = await page.locator('[data-v3-panel-spur="blatt"]').evaluateAll(
      (els) => els.map((e) => e.getAttribute('data-v3-pane')),
    )
    expect([...rollen].sort()).toEqual(['primaer', 'sekundaer'])

    // Öffnen im Pane öffnet GENAU EIN Panel, nicht beide. GESUCHT WIRD ÜBER DIE
    // ROLLE, nicht über `[data-pane="sekundaer"]`: das Blatt hängt per Portal in
    // der Overlay-Schicht und liegt damit AUSSERHALB des Pane-Elements — genau der
    // H2-Befund, dessentwegen die Rolle als Attribut mitwandert.
    const sekundaer = page.locator('[data-v3-pane="sekundaer"][data-v3-panel-spur="blatt"]')
    await panelAufziehen(page, pane)
    await expect(page.locator('[data-v3-panel]')).toHaveCount(1, { timeout: 20_000 })
    await expect(sekundaer.locator('[data-v3-panel]')).toHaveCount(1)
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('(e) H @390 ohne Leseposition: das Panel nennt den Artikel und zeigt seine Entscheide', async ({ page }) => {
    // BEFUND 17.8.2026, gemessen: auf dem Handy-Zuschnitt hat der Scroll-Spy beim
    // Ankommen noch keine Leseposition gesetzt (`[data-v3-kopf-artikel]` count 0).
    // Ohne Fallback las man dort «kein Entscheid der eingeschalteten Instanzen
    // erfasst» — an einem Erlass mit 1443 Verknüpfungen (§8). Jetzt gilt der ERSTE
    // Artikel, und der Panel-Kopf sagt, welcher es ist.
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await warteLeser(page)
    await expect(page.locator('[data-v3-kopf-artikel]')).toHaveCount(0)

    await panelAufziehen(page)
    // Der Kopf benennt den Bezug — ohne Namen wäre die Liste eine Behauptung
    // über «irgendeinen» Artikel.
    await expect(page.locator('[data-v3-panel] p').first()).toContainText('Art. 1')
    await expect(page.locator('[data-v3-panel] [data-v3-panel-gruppe]').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-v3-panel] [data-v3-panel-entscheid]').first()).toBeVisible()
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  // ── §6.3-DEKLARATION (D35-F2, Entscheid David 7.9.2026) ───────────────────
  // Der Fall hiess «(d) F8-Kehrseite: mit ausgeschaltetem Schalter öffnet ‹r›
  // das Panel weiterhin». Den Schalter gibt es nicht mehr (Herleitung bei (b)).
  // Die Zusage, die er bewachte, gilt unverändert und ist hier ohne die
  // Vorbedingung geprüft: die Taste «r» zieht das Blatt auf, und Esc schliesst
  // es wieder — der tastaturseitige Weg neben dem Kopf-Griff (Kap. 4h).
  test('(d) die Taste «r» zieht das Blatt auf, Esc schliesst es', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await warteLeser(page)

    // Fokus ausserhalb jedes Eingabefelds (der Listener hat einen Eingabe-Guard).
    await page.locator('#lc-lesespalte').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('r')
    await expect(page.locator('[data-v3-panel]')).toBeVisible({ timeout: 10_000 })
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-v3-panel]')).toHaveCount(0)
    expect(fehler, fehler.join('\n')).toEqual([])
  })
})
