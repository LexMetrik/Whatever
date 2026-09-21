// @shard-gruppe: 5
// ─── H3-NACHZUG · die sieben Befunde der drei Prüfer, gemessen ───────────────
//
// Jede Zusage hier hat einen VORHER-MESSWERT (17.8.2026, gebauter H3-Stand) und
// wird ohne den Fix rot. Die Messwerte stehen bei den Fällen, damit man sie nicht
// im Vollzugsvermerk suchen muss.
//
// ROT GESEHEN (§6.7) — Sabotage → Ausgabe, je Fall am Ende des Kommentars.
//
// WERKZEUG-FALLE beim Nachvollziehen der Rot-Beweise (verbrannt 17.8.2026,
// S2×H3-Vereinigung): der e2e-Server ist `npm run preview` und bedient `dist/`,
// mit `reuseExistingServer` ausserhalb von CI. Eine Sabotage in `src/**` wirkt
// darum ERST nach `npm run build` — ohne Neubau bleibt der Fall grün und die
// Sabotage sieht wie ein Tor aus, das nicht scheitern kann. Reihenfolge:
// sabotieren → `npm run build` → Fall laufen lassen → zurücksetzen → `npm run
// build`. Sabotagen in `e2e/**` (Schwellen, Assertions) wirken sofort.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { panelAufziehen } from './helpers/panelOeffnen'

async function warteLeser(page: Page): Promise<void> {
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
}

// D35-F2 (7.9.2026): hier stand `schalterAus(page)`, der den Store auf
// `leitfaelle: 'aus'` setzte und neu lud. Das Feld gibt es nicht mehr
// (`v3/leserOptionen.ts`); der Helfer hatte danach null Aufrufer und ist
// gestrichen statt bewacht (§17-Gegengewicht).

test.describe('H3-Nachzug — Panel: Lade-Ende, Erreichbarkeit, Gestalt', () => {
  test('(a) A1 · Erlass OHNE Bezugs-Shard: der Satz kommt, nicht der Ladebalken', async ({ page }) => {
    // VORHER, gemessen an ZH-211.11 (`?leser=v3`): nach 8 s stand im Reiter
    // «Entscheide» nur «Entscheide werden geladen …». Ursache: «geladen» wurde aus
    // `klassenImErlass` abgeleitet, und ein 404 ergibt dort `{}` — nicht
    // unterscheidbar von «noch nichts da». Betroffen: 1149 von 1459 Erlassen
    // (79 %; 311 Bezugs-Shards, kein einziger für ZH).
    // ROT: in `bezuegeLaden.ts` `geladen` auf `false` festnageln ⇒ dieser Fall
    // meldet «erwartet Bestands-Satz, gefunden data-v3-panel-lage="laedt"».
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/kanton/ZH-211.11')
    await warteLeser(page)
    await panelAufziehen(page)

    const inhalt = page.locator('[data-v3-panel-reiter-inhalt="entscheide"]')
    // Der Bestands-Satz, nicht der Wissens-Satz: «wir haben nachgesehen, es gibt
    // nichts» ist Wissen und darf nicht als Unwissen erscheinen (§8).
    await expect(inhalt.locator('[data-v3-panel-lage="bestand"]')).toBeVisible({ timeout: 20_000 })
    await expect(inhalt.locator('[data-v3-panel-lage="laedt"]')).toHaveCount(0)
    // Und der Satz ist ERLASS-NEUTRAL (C1): ZH-211.11 zählt Paragraphen.
    await expect(inhalt.locator('[data-v3-panel-lage="bestand"]')).toContainText('§')

    // Positiv-Sonde gegen «grün, weil nichts geladen wird»: ein Erlass MIT Shard
    // erreicht denselben Zustand über Daten, nicht über einen 404.
    await page.goto('/gesetze/bund/STPO')
    await warteLeser(page)
    await panelAufziehen(page)
    await expect(page.locator('[data-v3-panel] [data-v3-panel-gruppe]').first())
      .toBeVisible({ timeout: 20_000 })
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  // ── §6.3-DEKLARATION (D35-F2, Entscheid David 7.9.2026) ───────────────────
  // Hier stand «(b) A2 · @390 mit ‹Rechtsprechung im Text: aus› führt ‹Ansicht›
  // ins Panel». Die A2-Messung vom 17.8.2026 (@390 nach dem Ausschalten kein
  // Öffner in der Kopfzeile, Fläche ohne Hardware-Tastatur unerreichbar) bleibt
  // als Beleg ihres Datums stehen (§0 Ziff. 2b). Mit Variante A gibt es die
  // Lage nicht mehr: der Schalter ist ersatzlos gefallen, der Kopf-Griff
  // «Erlass ▾» steht auf jeder Breite, und der Menü-Eintrag, der ihn vertrat,
  // ist mit ihm gestrichen (§17-Gegengewicht). Die A2-SORGE selbst — «@390
  // führt ein Weg aus der Kopfzeile zur Fläche» — prüft
  // `e2e/leser-v3-kopf.e2e.ts` (a3), jetzt ohne Vorbedingung und mit EINEM Tap.

  test('(c) A3 · der Öffner ist ein bewusster Umschalter, mit gültigem aria-controls', async ({ page }) => {
    // VORHER, gemessen @1024 und @1440: `aria-controls` am Kopf-Zähler war `null`
    // — der Rahmen reichte die Id nie durch, die Fläche baute sich ihre eigene
    // (`useId` in `LeserPanelZone`). Und bei offenem Blatt lag der Öffner unter
    // dem Scrim: der Klick traf die Überlagerung, nicht den Knopf.
    // ROT: `panelId` im Rahmen nicht durchreichen ⇒ «expected attribute
    // aria-controls to match /\S/, got null».
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await warteLeser(page)

    const zaehler = page.locator('[data-v3-panel-zaehler]')
    await expect(zaehler).toHaveAttribute('aria-expanded', 'false')
    // Geschlossen: KEIN aria-controls (die Fläche existiert nicht — axe
    // `aria-valid-attr-value`).
    expect(await zaehler.getAttribute('aria-controls')).toBeNull()

    await zaehler.click()
    const flaeche = page.locator('[data-v3-panel]')
    await expect(flaeche).toBeVisible()
    await expect(zaehler).toHaveAttribute('aria-expanded', 'true')
    const id = await zaehler.getAttribute('aria-controls')
    expect(id, 'aria-controls fehlt am offenen Öffner').toBeTruthy()
    // Und die Id zeigt WIRKLICH auf die Fläche, nicht irgendwohin.
    await expect(flaeche).toHaveAttribute('id', id!)

    // Zweiter Klick = bewusstes Schliessen am Knopf selbst (nicht über den Scrim).
    await zaehler.click()
    await expect(flaeche).toHaveCount(0)
    await expect(zaehler).toHaveAttribute('aria-expanded', 'false')
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('(d) B1 · D: das Blatt beginnt UNTER dem Kopf und ist kein Dialog', async ({ page }) => {
    // VORHER, gemessen @1440: Blatt-Oberkante y = 100, V3-Kopf y = 100…159 — das
    // Blatt lag über der Kopfzeile samt Öffner, «Ansicht ▾» und ✕. Dazu ein
    // Vollflächen-Scrim mit `aria-modal`, obwohl `panelForm` für `'rechts'`
    // ausdrücklich «Lesetext bleibt sichtbar und LESBAR» verspricht.
    // ROT: `top: 'var(--leser-kopf-h)'` in `LeserPanelZone` wiederherstellen ⇒
    // «Blatt deckt den Kopf: blatt.y 100 < kopfUnterkante 159».
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await warteLeser(page)
    await panelAufziehen(page)

    // ── §6.3-ANPASSUNG, DEKLARIERT (Ä60 (c), David-Entscheid 17.8.2026) ──────
    // Der Fall stand auf `[data-v3-panel-form="rechts"]`. @1440 trägt die Fläche
    // seit dem breiteren Rahmen die Gestalt `spalte`. Die vier Zusagen dieses
    // Falls — beginnt unter dem Kopf · kein Scrim · `role=region` · der Lesetext
    // bleibt anklickbar — gelten für BEIDE Gestalten und werden hier unverändert
    // gemessen, nur an der Fläche statt an einem Gestalt-Namen. WELCHE Gestalt
    // auf welcher Breite gilt, prüft `leser-v3-rahmen.e2e.ts`.
    const blatt = page.locator('[data-v3-panel-form]')
    await expect(blatt).toBeVisible()
    const kopf = (await page.locator('[data-v3-kopf]').boundingBox())!
    const box = (await blatt.boundingBox())!
    const unterkante = kopf.y + kopf.height

    // ── DIE HARTE ZUSAGE: KEIN BEDIENELEMENT DES KOPFS LIEGT UNTER DEM BLATT ──
    // Das ist der Befund Ä52 wörtlich («deckt den V3-Kopf samt Öffner,
    // ‹Ansicht ▾›, ✕»), und er ist ohne Toleranz messbar.
    // Ä87/Ä91 (H4-Nachzug 18.8.2026): `[data-v3-kopf-schliessen]` stand hier als
    // dritter Griff — das Kopf-✕ ist gestrichen (Herleitung `v3/kopfStufen.ts`),
    // der ☰ tritt an seine Stelle, sobald die Gliederung nicht als Spalte steht.
    for (const griff of ['[data-v3-panel-zaehler]', '[data-v3-ansicht]']) {
      const g = (await page.locator(griff).boundingBox())!
      expect(box.y, `${griff} liegt unter dem Blatt (Griff-Unterkante ${g.y + g.height})`)
        .toBeGreaterThanOrEqual(g.y + g.height)
    }

    // ── UND DIE KANTE SELBST, mit deklarierter 4-px-Toleranz ─────────────────
    // Das Blatt beginnt an `--nt-stick` = KLEBE-Unterkante des Kopf-Blocks
    // (100 + 56 = 156 px). Die gemessene Unterkante im RUHEZUSTAND liegt bei
    // 159 px, weil (a) der Kopf-Block bei y = 102 im Fluss steht und erst beim
    // Scrollen auf seine Klebe-Position 100 fährt, und (b) `kopfHoehe()` die
    // 1-px-Unterlinie nicht mitzählt. Beide Differenzen liegen UNTERHALB der
    // Griffe (siehe Schleife oben) und betreffen nur die Rand-Linie.
    // Die Toleranz aus `--nt-stick` zu entfernen wäre der falsche Fix: dann
    // hätte die Geometrie zwei Quellen, und der Sprung-Offset der Anker liefe
    // beim nächsten Stufenwechsel auseinander (LM-003).
    expect(box.y, `Blatt deckt den Kopf: blatt.y ${box.y}, Kopf-Unterkante ${unterkante}`)
      .toBeGreaterThanOrEqual(unterkante - 4)

    // NICHT modal: kein Scrim, keine Dialog-Rolle — der Text bleibt bedienbar.
    await expect(blatt).toHaveAttribute('data-v3-panel-modal', 'nein')
    expect(await blatt.getAttribute('aria-modal')).toBeNull()
    await expect(blatt).toHaveAttribute('role', 'region')

    // Und das ist keine Behauptung über Attribute, sondern über BEDIENBARKEIT:
    // ein Klick in den Lesetext erreicht den Text. Lag dort ein Scrim, bricht
    // Playwright mit «subtree intercepts pointer events» ab — genau das ist die
    // Messung, und sie ist stärker als jedes Attribut.
    // (In der Gestalt `rechts` schliesst der Klick das Beiwerk-Blatt per
    // Aussenklick; in der Gestalt `spalte` nicht — sie ist Layout und kein
    // aufgezogenes Blatt, Herleitung samt Messung in `usePopoverAutoZu`. Für die
    // Messung hier ist beides gleich: geprüft wird, dass NICHTS den Zeiger
    // abfängt. Der Klick steht darum weiterhin am Ende des Falls.)
    const artikel = page.locator('#lc-lesespalte article').first()
    await artikel.scrollIntoViewIfNeeded()
    await expect(artikel).toBeVisible()
    await artikel.click({ position: { x: 5, y: 5 }, timeout: 5000 })
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('(e) B4 · H @390: echtes Bottom-Sheet — der Artikel bleibt darüber sichtbar', async ({ page }) => {
    // VORHER, gemessen @390: das «Bottom-Sheet» begann bei y = 100 und war 744 px
    // hoch — es füllte den Schirm (844 px) und verdeckte den ganzen Gesetzestext.
    // ROT: `top: 'var(--leser-kopf-h)'` + volle Höhe zurückbauen ⇒ «Sheet deckt
    // die Fläche: sheet.y 100, erwartet > 380».
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    // ZUM ARTIKEL springen, BEVOR das Sheet aufgeht: @390 beginnt die Artikelliste
    // erst weit unten (Erlass-Kopf + Übersichtsbox darüber) — im Ruhezustand ist
    // oberhalb des Sheets gar kein Artikel, und die Messung sagte dann nichts über
    // das Sheet, sondern über die Startposition der Seite.
    //
    // GEMESSEN am ANKER, nicht per `scrollIntoViewIfNeeded` (S2-Vereinigung
    // 17.8.2026): der minimale Scroll hört auf, sobald der Artikel IRGENDWO im
    // 844-px-Fenster steht — unter der S2-Typografie ist der Inhalt oberhalb
    // gewachsen, und er landet dann bei y = 392 in der unteren Bildhälfte, also
    // dort, wo das Sheet sitzt (Streifen −12.6 px). Das ist keine Aussage über das
    // Sheet, sondern über eine Scroll-Heuristik, die kein Leser je erzeugt: der
    // Leser kommt über den Anker-Sprung, und der legt den Artikelkopf unter die
    // Klebekante des Kopfs (gemessen y = 192.4 bei scrollY 882, Kopf-Unterkante
    // 193). Die Spec misst darum den Weg des Lesers.
    await page.goto('/gesetze/bund/STPO#art-1')
    await warteLeser(page)
    const artikel = page.locator('#art-1')
    await expect(artikel).toBeAttached({ timeout: 20_000 })
    await page.waitForTimeout(800)
    const aBoxVorher = (await artikel.boundingBox())!
    // VORBEDINGUNG: der Sprung hat stattgefunden. Ohne sie könnte ein misslungener
    // Anker-Sprung (Artikel gar nicht im Bild) den Fall still grün färben.
    const kopfUnten = await page.locator('[data-v3-kopf]').boundingBox()
      .then((b) => b!.y + b!.height)
    expect(aBoxVorher.y, `Anker-Sprung misslungen: Artikel y ${aBoxVorher.y}, Kopf-Unterkante ${kopfUnten}`)
      .toBeLessThanOrEqual(kopfUnten + 8)
    await panelAufziehen(page)

    const sheet = page.locator('[data-v3-panel-form="unten"]')
    await expect(sheet).toBeVisible()
    const box = (await sheet.boundingBox())!
    // Unten angeschlagen: die Unterkante liegt am Fensterboden (±2 px Rundung).
    expect(Math.abs((box.y + box.height) - 844), `Sheet hängt nicht unten: ${box.y}+${box.height}`)
      .toBeLessThanOrEqual(2)
    // Und es lässt oben Platz: 55 % Deckel ⇒ mindestens 40 % der Fläche frei.
    expect(box.height, `Sheet zu hoch: ${box.height} px von 844`).toBeLessThanOrEqual(844 * 0.58)
    expect(box.y, `Sheet beginnt zu weit oben: ${box.y}`).toBeGreaterThan(844 * 0.4)

    // Der Lesetext steht darüber und ist SICHTBAR — das ist der Unterschied
    // zwischen einem Blatt und einem Vollbild-Dialog. Und er ist NICHT verschoben
    // worden (das Sheet liegt über ihm, es verdrängt ihn nicht).
    const aBox = (await artikel.boundingBox())!
    expect(aBox.y, `Artikel verschoben: ${aBoxVorher.y} → ${aBox.y}`).toBeCloseTo(aBoxVorher.y, 0)
    // Und zwar ein LESBARER Streifen, nicht ein Pixel-Splitter. Die frühere Fassung
    // verlangte nur `aBox.y < box.y` — damit wäre ein 1 px hoher Artikel-Rest über
    // dem Sheet grün gewesen, obwohl vom Artikel nichts zu lesen ist. Gemessen
    // 17.8.2026 @390: Artikel y 192.4, Sheet y 379.8 ⇒ 187.4 px Streifen, der
    // Artikelkopf samt erster Absatzzeile steht frei. Die Schwelle 120 px lässt
    // Raum für Zeilenhöhen-Varianz der drei S2-Textgrössen und bleibt weit unter
    // dem Ist — sie ist STRENGER als die alte Zusage, nicht lockerer.
    const streifen = box.y - aBox.y
    expect(streifen, `Artikel-Streifen oberhalb des Sheets zu schmal: ${streifen} px (Artikel y ${aBox.y}, Sheet y ${box.y})`)
      .toBeGreaterThanOrEqual(120)
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('(f) B2/B5 · im Lesekörper hängt kein Öffner mehr, und nie zwei gleichzeitig', async ({ page }) => {
    // VORHER, gemessen: die Randlasche (`w-9` = 36 px, `fixed right-0 top-1/3`)
    // schnitt @390 16 px und @1024 4 px in den Normtext; @1440 war sie das
    // wortgleiche Doppel des Kopf-Zählers (Kopfzeile bei 5 Elementen).
    // Design-Grundlage Kap. 6: im Lesekörper null Icons.
    // ROT: `PanelLasche` samt Rand-Positionierung wieder einsetzen ⇒ dieser Fall
    // meldet «Öffner im Lesekörper: [data-v3-panel-lasche] count 1».
    const fehler = fehlerSammeln(page)
    for (const [w, h] of [[390, 844], [1024, 800], [1440, 900]] as const) {
      await page.setViewportSize({ width: w, height: h })
      await page.goto('/gesetze/bund/STPO')
      await warteLeser(page)
      await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })

      // Kein schwebender Öffner am Rand des Lesekörpers.
      await expect(page.locator('[data-v3-panel-lasche]')).toHaveCount(0)

      // Und höchstens EIN sichtbarer Öffner ausserhalb des Menüs.
      const sichtbar = await page.locator('[data-v3-panel-zaehler]').count()
      expect(sichtbar, `@${w}: mehr als ein Öffner in der Kopfzeile`).toBeLessThanOrEqual(1)

      // Positiv-Sonde: erreichbar ist die Fläche auf JEDER Breite (sonst wäre die
      // Abwesenheit der Lasche ein Verlust, kein Aufräumen).
      await panelAufziehen(page)
      await expect(page.locator('[data-v3-panel]')).toBeVisible()
    }
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('(g) Ä54 · die Filterzeile ist eine Zeile, nicht ein Block', async ({ page }) => {
    // VORHER, gemessen @1440 (StPO): der Filter-Block war 348 px hoch, die erste
    // Entscheid-Gruppe begann 352 px unter dem Panel-Kopf — drei Erklär-Absätze,
    // ein Histogramm und zwei Datumsfelder vor der ersten Fundstelle.
    // ROT: die zwei Klappen in `PanelFilterZeile` dauerhaft offen rendern ⇒
    // «Filterzeile 348 px, erwartet <= 64».
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await warteLeser(page)
    await panelAufziehen(page)

    const filter = page.locator('[data-v3-panel] [data-v3-panel-filter]')
    await expect(filter).toBeVisible()
    const box = (await filter.boundingBox())!
    expect(box.height, `Filterzeile ${box.height} px — das ist ein Block, keine Zeile`)
      .toBeLessThanOrEqual(64)

    // Die Klappen NENNEN ihren Stand — eine eingeklappte Facette ohne Anzeige wäre
    // ein verstecktes Filter (§8).
    const klappen = filter.locator('[data-v3-panel-klappe]')
    await expect(klappen).toHaveCount(2)
    await expect(klappen.first()).toContainText('Instanzen')
    await expect(klappen.nth(1)).toContainText('Zeitraum')

    // Und sie führen zu den GETEILTEN Bausteinen — dieselbe Datenlogik, nur
    // eingeklappt (Ä54 verlangt keine neue Auswahl-Wahrheit).
    await klappen.first().click()
    await expect(filter.locator('[data-bezug-klasse="bge"]')).toHaveCount(1)
    await klappen.nth(1).click()
    await expect(filter.locator('input[type="date"]').first()).toBeAttached()
    expect(fehler, fehler.join('\n')).toEqual([])
  })
})
