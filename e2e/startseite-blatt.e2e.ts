// @shard-gruppe: 3
import { test, expect, type Page } from '@playwright/test'

// ─── W2·29-WERKBANK-START S1 · Startseite: Kachelfeld, das vor Ort aufklappt ──
//
// Ersetzt `startseite-pult-r10.e2e.ts` (der Modul-Baukasten ist gestrichen,
// Auswahlfrage David 23.9.2026). Geprüft wird die ECHTE Aktionsfolge
// (`.claude/rules/webseiten-pruefung.md` «Zustand ist eine Folge»): aufklappen,
// Stufe tiefer, Browser-Zurück = eine Stufe, «← Zurück», Escape schliesst ganz
// und gibt den Fokus an die Kachel zurück; Deep-Link öffnet die Stufe direkt.
// Soll aus Davids Wortlaut: FAHRPLAN-WERKBANK-UMBAU §5d.

const feld = (page: Page) => page.getByRole('navigation', { name: 'Bereiche der Sammlung' })
const blatt = (page: Page) => page.locator('#lm-start-blatt')
const gesetzeKachel = (page: Page) => feld(page).getByRole('button', { name: /Gesetze/ })
const werkzeugeKachel = (page: Page) => feld(page).getByRole('button', { name: /Werkzeuge/ })
const materialienKachel = (page: Page) => feld(page).getByRole('button', { name: /Materialien/ })
const rechtsprechungKachel = (page: Page) => feld(page).getByRole('button', { name: /Rechtsprechung/ })

test.describe('Startseite · Kachelfeld', () => {
  for (const breite of [1280, 390]) {
    test(`@${breite}: vier Kacheln im 2×2-Feld, ohne Querscroll`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: 900 })
      await page.goto('/')
      const zellen = page.locator('.lc-start-zelle')
      await expect(zellen).toHaveCount(4)
      const lage = await zellen.evaluateAll((els) => els.map((e) => {
        const r = e.getBoundingClientRect()
        return { x: Math.round(r.left), y: Math.round(r.top) }
      }))
      expect(new Set(lage.map((l) => l.x)).size, `Spalten: ${JSON.stringify(lage)}`).toBe(2)
      expect(new Set(lage.map((l) => l.y)).size, `Reihen: ${JSON.stringify(lage)}`).toBe(2)
      const weite = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(weite).toBeLessThanOrEqual(breite)
      // §8: jede Kachel trägt eine echte Zahl.
      for (const t of await zellen.allInnerTexts()) expect(t.replace(/’|'/g, '')).toMatch(/\d/)
    })
  }
})

test.describe('Startseite · Blatt der Gesetze-Kachel', () => {
  test('Stufenfolge mit Browser-Zurück, «← Zurück» und Escape', async ({ page }) => {
    await page.goto('/')
    const kachel = gesetzeKachel(page)
    await expect(kachel).toHaveAttribute('aria-expanded', 'false')
    await kachel.click()
    await expect(page).toHaveURL(/\?blatt=gesetze$/)
    await expect(kachel).toHaveAttribute('aria-expanded', 'true')
    await expect(blatt(page)).toBeFocused()

    await blatt(page).getByRole('button', { name: /Bund/ }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze\/bund$/)
    await blatt(page).getByRole('button', { name: /Privatrecht/ }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze\/bund\/02$/)
    // Letzte Stufe: echte Links in den Leser.
    await expect(blatt(page).locator('a[href="/gesetze/bund/OR"]').first()).toBeVisible()

    await page.goBack()
    await expect(page).toHaveURL(/\?blatt=gesetze\/bund$/)
    await blatt(page).getByRole('button', { name: '← Zurück' }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze$/)

    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/$/)
    await expect(blatt(page)).toHaveCount(0)
    await expect(kachel).toBeFocused()
  })

  // Gegenprüfung S1 (23.9.2026, blockierend): der Pfad-Klick auf einen Vorfahren
  // pushte einen NEUEN Eintrag — Browser-Zurück führte danach wieder in die Tiefe.
  test('Pfad-Klick geht über den Verlauf hinauf; Browser-Zurück danach schliesst', async ({ page }) => {
    await page.goto('/')
    await gesetzeKachel(page).click()
    await blatt(page).getByRole('button', { name: /Bund/ }).click()
    await blatt(page).getByRole('button', { name: /Privatrecht/ }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze\/bund\/02$/)
    await blatt(page).getByRole('navigation', { name: 'Pfad im Blatt' }).getByRole('button', { name: 'Gesetze' }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze$/)
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(blatt(page)).toHaveCount(0)
  })

  // START-UEBERARBEITUNG U1 (David 24.9.2026, «Drei hohe Spalten»): die
  // Wahl-Stufe zeigt die nächste Stufe schon an. DEKLARIERTE ERGÄNZUNG — die
  // drei neuen Wege aus der Wahl, je mit Browser-Zurück = eine Stufe.
  test('Wahl: Rechtsgebiet direkt, Kanton über die Karte, International-Rubrik', async ({ page }) => {
    await page.goto('/')
    await gesetzeKachel(page).click()
    await expect(page).toHaveURL(/\?blatt=gesetze$/)
    const gebiete = blatt(page).getByRole('list', { name: 'Rechtsgebiete des Bundes' })
    await gebiete.getByRole('button', { name: /Privatrecht/ }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze\/bund\/02$/)
    await expect(blatt(page).locator('a[href="/gesetze/bund/OR"]').first()).toBeVisible()
    await page.goBack()
    await expect(page).toHaveURL(/\?blatt=gesetze$/)

    await blatt(page).getByRole('button', { name: 'Zürich', exact: true }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze\/kantone\/ZH$/)
    await page.goBack()
    await expect(page).toHaveURL(/\?blatt=gesetze$/)
    // Kleine Kantone auch per Tastatur (Fokus + Enter). Den Mausklick auf BS/ZG
    // belegt seit U5 (24.9.2026, `SchweizKarte kompakt`) der Test weiter unten.
    await blatt(page).getByRole('button', { name: 'Basel-Stadt', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\?blatt=gesetze\/kantone\/BS$/)
    await page.goBack()
    await expect(page).toHaveURL(/\?blatt=gesetze$/)
    await blatt(page).getByRole('button', { name: /Alle 26 Kantone/ }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze\/kantone$/)
    await page.goBack()

    const rubriken = blatt(page).getByRole('list', { name: 'Rubriken des internationalen Rechts' })
    await rubriken.getByRole('button', { name: 'Menschenrechte' }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze\/international\/menschenrechte$/)
    // Nur DIESE Rubrik: ihr Kopf steht, eine andere nicht.
    await expect(blatt(page).locator('section#menschenrechte')).toBeVisible()
    await expect(blatt(page).locator('section#asyl-migration')).toHaveCount(0)
    await expect(blatt(page).getByRole('navigation', { name: 'Pfad im Blatt' })).toContainText('Menschenrechte')
    await page.goBack()
    await expect(page).toHaveURL(/\?blatt=gesetze$/)
    await expect(rubriken).toBeVisible()
  })

  test('Wahl @1280: drei Spalten füllen die Blatthöhe', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/?blatt=gesetze')
    const inhalt = blatt(page).locator('.lc-start-blatt-inhalt')
    const wahl = blatt(page).locator('.lc-start-fuellt')
    await expect(wahl).toBeVisible()
    const [i, w] = await Promise.all([inhalt.boundingBox(), wahl.boundingBox()])
    // Vorher (gemessen 24.9.2026 @1280): Wahl 179 px in 538 px Inhalt.
    expect(w!.height).toBeGreaterThan(i!.height - 60)
    // Seit U11 (24.9.2026, Suchfeld über den Spalten) trägt `.lc-start-fuellt`
    // zwei Zeilen: Feld, darunter das Spalten-Raster (letztes Kind).
    await expect(wahl.getByRole('searchbox', { name: 'Gesetze durchsuchen' })).toBeVisible()
    const spalten = await wahl.evaluate((el) => [...el.lastElementChild!.children].map((c) => Math.round(c.getBoundingClientRect().left)))
    expect(new Set(spalten).size).toBe(3)
  })

  // START-UEBERARBEITUNG U5 (David 24.9.2026 «nimm die kantone-karte auch
  // gleich mit»): auf der schmalen Kantone-Spalte der Wahl (1024–1280 px) war
  // die Karte so klein, dass kleine Kantone per Zeigerklick nicht zuverlässig
  // trafen (Befund U1-Bau, siehe Kommentar oben bei «Kleine Kantone … per
  // Tastatur»). ECHTER Zeigerklick statt Fokus+Enter — bei BEIDEN Breiten.
  for (const breite of [1280, 1024]) {
    test(`Wahl @${breite}: Kantone-Karte per Mausklick — Basel-Stadt und Zug treffen`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: 900 })
      await page.goto('/?blatt=gesetze')
      await blatt(page).getByRole('button', { name: 'Basel-Stadt', exact: true }).click()
      await expect(page).toHaveURL(/\?blatt=gesetze\/kantone\/BS$/)
      await page.goBack()
      await blatt(page).getByRole('button', { name: 'Zug', exact: true }).click()
      await expect(page).toHaveURL(/\?blatt=gesetze\/kantone\/ZG$/)
    })
  }

  test('Kantone: Landeskarte und Liste der 26, dann Erlassliste', async ({ page }) => {
    await page.goto('/?blatt=gesetze/kantone')
    await expect(blatt(page).locator('svg').first()).toBeVisible()
    const liste = blatt(page).getByRole('list', { name: 'Kantone' }).getByRole('button')
    await expect(liste).toHaveCount(26)
    await liste.filter({ hasText: 'Basel-Stadt' }).click()
    await expect(page).toHaveURL(/\?blatt=gesetze\/kantone\/BS$/)
    await expect(blatt(page).locator('a[href^="/gesetze/kanton/"]').first()).toBeAttached()
  })

  test('Deep-Link öffnet die Stufe direkt; ✕ schliesst ganz', async ({ page }) => {
    await page.goto('/?blatt=gesetze/international')
    await expect(blatt(page)).toBeVisible()
    await expect(blatt(page).getByText('International', { exact: true })).toBeVisible()
    await blatt(page).getByRole('button', { name: 'Gesetze schliessen' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(blatt(page)).toHaveCount(0)
  })

  test('Telefon: Vollbild-Blatt über der ganzen Seite', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await gesetzeKachel(page).click()
    await expect(blatt(page)).toHaveAttribute('data-phase', 'offen')
    // Die Einfahrt (450 ms, transform) abwarten: gemessen wird die Endlage.
    await expect.poll(async () => {
      const r = await blatt(page).boundingBox()
      return r && [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]
    }).toEqual([0, 0, 390, 844])
    // Das Blatt liegt oben: der Mittelpunkt trifft das Blatt, nicht die Seite dahinter.
    const oben = await page.evaluate(() => document.elementFromPoint(195, 600)?.closest('#lm-start-blatt') !== null)
    expect(oben).toBe(true)
    // Die App dahinter ist `inert` (Gegenprüfung S1); nach Escape ist sie es nicht
    // mehr, und der Fokus steht wieder auf der Kachel.
    await expect(page.locator('#root')).toHaveAttribute('inert', '')
    await page.keyboard.press('Escape')
    await expect(blatt(page)).toHaveCount(0)
    await expect(page.locator('#root')).not.toHaveAttribute('inert')
    await expect(gesetzeKachel(page)).toBeFocused()
  })
})

// W2·29-WERKBANK-START S2 (23.9.2026, Fahrplan §5d) — Werkzeuge klappt jetzt
// vor Ort auf: Rechner | Vorlagen → Liste nach Rechtsgebiet, letzte Stufe ist
// die bestehende Produktseite (ein gewöhnlicher Link).
test.describe('Startseite · Blatt der Werkzeuge-Kachel', () => {
  test('Werkzeuge → Vorlagen → Liste, Zurück, «In Vorbereitung» sichtbar', async ({ page }) => {
    await page.goto('/')
    const kachel = werkzeugeKachel(page)
    await expect(kachel).toHaveAttribute('aria-expanded', 'false')
    await kachel.click()
    await expect(page).toHaveURL(/\?blatt=werkzeuge$/)
    await expect(kachel).toHaveAttribute('aria-expanded', 'true')
    await expect(blatt(page)).toBeFocused()

    await blatt(page).getByRole('button', { name: /Vorlagen/ }).click()
    await expect(page).toHaveURL(/\?blatt=werkzeuge\/vorlagen$/)
    // Letzte Stufe: echte Links auf die bestehenden Vorlagen-Seiten.
    await expect(blatt(page).locator('a[href^="/vorlagen/"]').first()).toBeVisible()
    // §8: geplante Vorlagen bleiben sichtbar, als «In Vorbereitung» — aber
    // OHNE Link (Gegenprüfung S2 24.9.2026: der vorherige Fall prüfte nur die
    // Sichtbarkeit, nicht die Linklosigkeit — eine geplante Karte mit Link
    // wäre unentdeckt geblieben).
    const inVorbereitung = blatt(page).locator('details').filter({ hasText: 'In Vorbereitung' })
    await expect(inVorbereitung).toBeVisible()
    await expect(inVorbereitung.locator('a[href]')).toHaveCount(0)

    await blatt(page).getByRole('button', { name: '← Zurück' }).click()
    await expect(page).toHaveURL(/\?blatt=werkzeuge$/)

    // Rechner: Filterfeld schneidet die Liste auf einen Treffer zu.
    await blatt(page).getByRole('button', { name: /Rechner/ }).click()
    await expect(page).toHaveURL(/\?blatt=werkzeuge\/rechner$/)
    await expect(blatt(page).locator('a[href^="/rechner/"]').first()).toBeVisible()
    await blatt(page).getByPlaceholder('Rechner filtern').fill('Kapitalisierung')
    await expect(blatt(page).locator('a[href="/rechner/streitwert"]')).toBeVisible()
    await expect(blatt(page).locator('a[href^="/rechner/"]')).toHaveCount(1)
  })

  // Gegenprüfung S2 (24.9.2026), Befund 1/4: `KategorieSektion` trug in der
  // Vorlagen-Stufe ein eigenes Rechtsgebiet-Feld, das über `setSearchParams`
  // OHNE den Blatt-Verlaufsstatus schrieb (`useBlattOrt.ts` verlor
  // `blattTiefe`/`blattVonZu`) — ✕ liess `/?rg=…` im Verlauf stehen, und
  // Browser-Zurück öffnete das Blatt erneut. Der Fix (`ohneGebietsFilter`)
  // entfernt dieses zweite Feld aus dem Blatt. Dieser Fall sichert zweierlei:
  // (1) im Blatt steht KEIN Auswahlfeld (`select`), das an `useBlattOrt` vorbei
  // die Adresse schreiben könnte, und (2) die Verlaufskette ✕ → Zurück. Die
  // Kette allein fände den Fehler nicht (ohne Auswahl bleibt der Verlauf
  // heil; Nachprüfung 24.9.2026) — darum die Zusicherung (1). Rot-Beweis
  // (§6.7, 24.9.2026): mit `ohneGebietsFilter` in WerkzeugeBlatt.tsx entfernt
  // ist (1) rot (1 `select` statt 0).
  test('Werkzeuge → Vorlagen → ✕: Adresse zurück auf «/», Browser-Zurück öffnet das Blatt nicht erneut', async ({ page }) => {
    await page.goto('/')
    await werkzeugeKachel(page).click()
    await expect(page).toHaveURL(/\?blatt=werkzeuge$/)

    await blatt(page).getByRole('button', { name: /Vorlagen/ }).click()
    await expect(page).toHaveURL(/\?blatt=werkzeuge\/vorlagen$/)
    await expect(blatt(page).getByRole('searchbox').first()).toBeVisible()
    await expect(blatt(page).locator('select')).toHaveCount(0)

    await blatt(page).getByRole('button', { name: 'Werkzeuge schliessen' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(blatt(page)).toHaveCount(0)

    await page.goBack()
    await expect(blatt(page)).toHaveCount(0)
  })

  // START-UEBERARBEITUNG U8 (David 24.9.2026 «mach danach das werkzeuge-blatt
  // gleich wie gesetze»): zwei hohe Spalten statt zweier kleiner Kacheln über
  // leerer Fläche — Vorbild U1 (Gesetze-Wahl, Fall «drei Spalten» oben).
  test('U8 Wahl @1280: zwei Spalten füllen die Blatthöhe', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/?blatt=werkzeuge')
    const inhalt = blatt(page).locator('.lc-start-blatt-inhalt')
    const wahl = blatt(page).locator('.lc-start-fuellt')
    await expect(wahl).toBeVisible()
    const [i, w] = await Promise.all([inhalt.boundingBox(), wahl.boundingBox()])
    expect(w!.height).toBeGreaterThan(i!.height - 60)
    const spalten = await wahl.evaluate((el) => [...el.children].map((c) => Math.round(c.getBoundingClientRect().left)))
    expect(new Set(spalten).size).toBe(2)
  })

  test('U8 Wahl: Rechner-Kategorie und Vorlagen-Rechtsgebiet direkt, Zurück je eine Stufe', async ({ page }) => {
    await page.goto('/')
    await werkzeugeKachel(page).click()
    await expect(page).toHaveURL(/\?blatt=werkzeuge$/)
    const pfad = blatt(page).getByRole('navigation', { name: 'Pfad im Blatt' })

    const kategorien = blatt(page).getByRole('list', { name: 'Rechner nach Kategorie' })
    await kategorien.getByRole('button', { name: /Fristen/ }).click()
    await expect(page).toHaveURL(/\?blatt=werkzeuge\/rechner\/fristen$/)
    await expect(pfad).toContainText('Fristen')
    await expect(blatt(page).locator('a[href="/rechner/zpo-fristen"]').first()).toBeVisible()
    // Nur DIESE Kategorie: ein Gebühren-Rechner steht nicht darin.
    await expect(blatt(page).locator('a[href="/rechner/betreibungskosten"]')).toHaveCount(0)
    await page.goBack()
    await expect(page).toHaveURL(/\?blatt=werkzeuge$/)

    const gebiete = blatt(page).getByRole('list', { name: 'Vorlagen nach Rechtsgebiet' })
    // §8: ein Gebiet nur mit geplanten Vorlagen sagt das, statt «0» zu zählen.
    await expect(gebiete.getByRole('button', { name: /Strafrecht/ })).toContainText('in Vorbereitung')
    await gebiete.getByRole('button', { name: /Familienrecht/ }).click()
    await expect(page).toHaveURL(/\?blatt=werkzeuge\/vorlagen\/familienrecht$/)
    await expect(pfad).toContainText('Familienrecht')
    await expect(blatt(page).locator('a[href="/vorlagen/scheidungsklage"]').first()).toBeVisible()
    await expect(blatt(page).locator('a[href="/vorlagen/gmbh-gruendung"]')).toHaveCount(0)
    const inVorbereitung = blatt(page).locator('details').filter({ hasText: 'In Vorbereitung' })
    await expect(inVorbereitung).toBeVisible()
    await expect(inVorbereitung.locator('a[href]')).toHaveCount(0)
    await expect(blatt(page).locator('select')).toHaveCount(0)
    await page.goBack()
    await expect(page).toHaveURL(/\?blatt=werkzeuge$/)
    await expect(gebiete).toBeVisible()
  })

  test('U8 Deep-Link mit unbekannter Gebiets-ID fällt auf die Liste zurück', async ({ page }) => {
    await page.goto('/?blatt=werkzeuge/vorlagen/mond')
    await expect(blatt(page).getByPlaceholder('Vorlagen filtern')).toBeVisible()
    const pfad = blatt(page).getByRole('navigation', { name: 'Pfad im Blatt' })
    await expect(pfad).toContainText('Vorlagen')
    await expect(pfad).not.toContainText('mond')
    await page.goto('/?blatt=werkzeuge/rechner/vorlagen')
    await expect(blatt(page).getByPlaceholder('Rechner filtern')).toBeVisible()
  })
})

// ─── W2·29-WERKBANK-START S3 · Materialien-Kachel: sofort Suche ──────────────
//
// David 23.9.2026: «Materialien … wenn sie aufgeht soll direkt eine suche …
// ermöglichen». Keine Unterstufen (Fahrplan §5d S3) — Fokus liegt IM Suchfeld,
// nicht auf dem Blatt-Rahmen (Spec «Fokus drin», Ausnahme in StartKachelFeld).
test.describe('Startseite · Blatt der Materialien-Kachel', () => {
  test('öffnet mit Fokus im Suchfeld, filtert, Treffer führt in die Detailseite', async ({ page }) => {
    await page.goto('/')
    const kachel = materialienKachel(page)
    await expect(kachel).toHaveAttribute('aria-expanded', 'false')
    await kachel.click()
    await expect(page).toHaveURL(/\?blatt=materialien$/)
    await expect(kachel).toHaveAttribute('aria-expanded', 'true')
    const suchfeld = blatt(page).getByRole('searchbox', { name: 'Materialien durchsuchen' })
    // Fokus IM Feld, NICHT auf dem Blatt-Rahmen (Ausnahme S3).
    await expect(suchfeld).toBeFocused()
    await expect(blatt(page)).not.toBeFocused()

    await suchfeld.fill('Umstrukturierungen')
    // «Umstrukturierungen» trifft drei Titel (gemessen: node -e Filter über
    // register.json) — das Ziel wird über den eindeutigen Detail-Link
    // angesprochen, nicht über die (unspezifizierte) Trefferreihenfolge.
    const treffer = blatt(page).locator('a[href="/materialien/ESTV-KS-DBG-5A"]')
    await expect(treffer).toBeVisible()
    await treffer.click()
    await expect(page).toHaveURL(/\/materialien\/ESTV-KS-DBG-5A$/)
  })

  test('Filter nach Behörde, «Weitere anzeigen» wächst die Portion', async ({ page }) => {
    await page.goto('/?blatt=materialien')
    await expect(blatt(page)).toBeVisible()
    // ESTV führt 144 Materialien (gemessen: node -e Zählung register.json,
    // > PORTION 20) — die Portion zeigt darum anfangs nur 20 Zeilen.
    await blatt(page).getByLabel('Behörde').selectOption('ESTV')
    const zeilen = blatt(page).locator('a[href^="/materialien/"]')
    await expect(zeilen).toHaveCount(20)
    const mehr = blatt(page).getByRole('button', { name: /Weitere anzeigen/ })
    await expect(mehr).toBeVisible()
    await mehr.click()
    await expect(zeilen).toHaveCount(40)
  })

  test('Deep-Link öffnet direkt mit Fokus im Suchfeld; ✕ schliesst ganz', async ({ page }) => {
    await page.goto('/?blatt=materialien')
    await expect(blatt(page)).toBeVisible()
    // Nachzug (Gegenprüfung S3, 24.9.2026): der Deep-Link-Fall prüfte bislang
    // nur, dass das Blatt steht — nicht, dass die Fokus-Ausnahme «Fokus drin»
    // auch auf dem Deep-Link-Pfad greift (dort läuft `useLayoutEffect` mit
    // `tiefLink=true`, ein eigener Zweig gegenüber dem Klick-Pfad).
    const suchfeld = blatt(page).getByRole('searchbox', { name: 'Materialien durchsuchen' })
    await expect(suchfeld).toBeFocused()
    await blatt(page).getByRole('button', { name: 'Materialien schliessen' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(blatt(page)).toHaveCount(0)
  })
})

// ─── W2·29-WERKBANK-START S3-Nachzug · Rechtsprechung-Kachel: sofort Suche ──
//
// Entscheid David 23./24.9.2026 («Beim Öffnen laden», Fahrplan §5d
// S3-Nachtrag): das 9,46-MB-Register lädt über denselben Lader wie
// `/rechtsprechung` (`ladeEntscheidManifest`) erst beim Mounten des Blatts —
// nie auf «/», nie beim Hover, nie bei der Hydration. Fokus liegt IM Suchfeld
// (Spec «Fokus drin», dieselbe Ausnahme wie Materialien).
test.describe('Startseite · Blatt der Rechtsprechung-Kachel', () => {
  test('Register wird genau beim Öffnen angefragt (vorher nicht); Suche findet Treffer mit Link; Filter Leitentscheide wirkt', async ({ page }) => {
    const angefragt: string[] = []
    page.on('request', (r) => { if (r.url().includes('/rechtsprechung/register.json')) angefragt.push(r.url()) })
    await page.goto('/')
    // VOR dem Klick bis zur Netzruhe warten (keine Anfrage mehr seit 500 ms),
    // nicht auf eine feste Frist: der alte Fehlstand fragte das Register nach
    // +318–441 ms an (Gegenprüfung 24.9.2026) — eine feste 500-ms-Frist liesse
    // auf einem langsamen Runner einen späten Fetch durchrutschen. Träfe das
    // Register hier ein, wäre §15 verletzt.
    await page.waitForLoadState('networkidle')
    expect(angefragt, 'vor dem Öffnen: keine Anfrage').toEqual([])

    const kachel = rechtsprechungKachel(page)
    await expect(kachel).toHaveAttribute('aria-expanded', 'false')
    await kachel.click()
    await expect(page).toHaveURL(/\?blatt=rechtsprechung$/)
    await expect(kachel).toHaveAttribute('aria-expanded', 'true')
    const suchfeld = blatt(page).getByRole('searchbox', { name: 'Rechtsprechung durchsuchen' })
    // Fokus IM Feld, NICHT auf dem Blatt-Rahmen (Ausnahme S3, wie Materialien).
    await expect(suchfeld).toBeFocused()
    await expect(blatt(page)).not.toBeFocused()
    // GENAU DANN: nach dem Öffnen ist die Anfrage da (Rot-Beweis-Gegenstück
    // zum «/»-Beleg unten — dort wird ROT erzwungen, wenn die Anfrage VORHER
    // käme; hier wird GRÜN erzwungen, dass sie NACHHER kommt).
    await expect.poll(() => angefragt.length, 'nach dem Öffnen: genau eine Anfrage').toBeGreaterThan(0)

    // Filter «wirkt»: Kantonal + Leitentscheide zusammen sind LEER (Korpus-
    // Fakt, gemessen `node -e` Zählung register.json am 24.9.2026: von 3'795
    // kantonalen Entscheiden trägt keiner `leitcharakter: 'leitentscheid'`,
    // die BGE-Leitentscheide sind ausschliesslich Bundesgericht/CH) — ein
    // robuster Beleg, dass die drei Filter tatsächlich UND-verknüpft filtern,
    // statt nur als Knopf zu existieren.
    await blatt(page).getByRole('button', { name: 'Kantonal' }).click()
    await expect(blatt(page).getByRole('button', { name: 'Kantonal' })).toHaveAttribute('aria-pressed', 'true')
    await blatt(page).getByRole('button', { name: 'Leitentscheide' }).click()
    await expect(blatt(page).getByText('Kein Entscheid gefunden.')).toBeVisible()
    // Zurück auf unfiltriert für den Such-Treffer unten.
    await blatt(page).getByRole('button', { name: 'Leitentscheide' }).click()
    await blatt(page).getByRole('button', { name: 'Kantonal' }).click()

    // «152 V 52» trifft genau EINEN Entscheid (gemessen: node -e Filter über
    // register.json, Aktenzeichen = BGE-Referenz = Zitierung-Kern) — das Ziel
    // wird über den eindeutigen Detail-Link angesprochen, nicht über die
    // (unspezifizierte) Trefferreihenfolge.
    await suchfeld.fill('152 V 52')
    const treffer = blatt(page).locator('a[href="/rechtsprechung/bge_152_V_52"]')
    await expect(treffer).toBeVisible()
    await treffer.click()
    await expect(page).toHaveURL(/\/rechtsprechung\/bge_152_V_52$/)
  })

  test('Escape schliesst das Blatt ganz, Fokus zurück auf die Kachel', async ({ page }) => {
    await page.goto('/')
    await rechtsprechungKachel(page).click()
    await expect(blatt(page)).toBeVisible()
    // Hier wird der Fall «Blatt steht» geprüft (Fokus im Suchfeld); Escape
    // MITTEN in der Öffnung prüft der FEINSCHLIFF-Block unten.
    await expect(blatt(page).getByRole('searchbox', { name: 'Rechtsprechung durchsuchen' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/$/)
    await expect(blatt(page)).toHaveCount(0)
    await expect(rechtsprechungKachel(page)).toBeFocused()
  })

  test('Deep-Link öffnet direkt mit Fokus im Suchfeld; ✕ schliesst ganz', async ({ page }) => {
    await page.goto('/?blatt=rechtsprechung')
    await expect(blatt(page)).toBeVisible()
    const suchfeld = blatt(page).getByRole('searchbox', { name: 'Rechtsprechung durchsuchen' })
    await expect(suchfeld).toBeFocused()
    await blatt(page).getByRole('button', { name: 'Rechtsprechung schliessen' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(blatt(page)).toHaveCount(0)
  })
})

// ─── §15-Beleg: das 9,4-MB-Rechtsprechungs-Register lädt NIE auf «/» ─────────
//
// S3-Nebenfund (23.9.2026, gemessen): die Entscheid-Liste lud vor dem Fix
// `/rechtsprechung/register.json` nach der Hydration (dynamischer `import()`
// in `start/EntscheideListe.tsx`). Die Auswahl läuft seither zur Buildzeit im
// Zähler-Generator; die Liste rendert nur noch die Mini-Projektion
// `STARTSEITE_ZAEHLER.neuesteEntscheide`. ROT ZU BEKOMMEN: den `useEffect`-
// Fetch in `EntscheideListe.tsx` wiederherstellen — dann meldet dieser Test
// die geladene Register-URL (§6.7).
// DEKLARIERTE ANPASSUNG (W2·29-WERKBANK-START-LAYOUT, David 24.9.2026
// «entscheide sollen weg», §6.3): die Liste und ihre Projektion
// `neuesteEntscheide` sind gestrichen. Der §15-Beleg BLEIBT — er gilt jetzt
// dem Rechtsprechungs-Blatt, das sein Register erst beim Öffnen holt
// (`blattRuhe.ts`); gewartet wird auf die Kacheln statt auf die Überschrift.
// ROT ZU BEKOMMEN: in `RechtsprechungBlatt.tsx`/`StartKachelFeld.tsx` das
// Register schon beim Mount der Seite laden.
test('«/» lädt nie das 9,4-MB-Rechtsprechungs-Register (§15)', async ({ page }) => {
  const angefragt: string[] = []
  page.on('request', (r) => { if (r.url().includes('/rechtsprechung/register.json')) angefragt.push(r.url()) })
  await page.goto('/')
  // Die Kacheln stehen sofort im HTML — kein Nachlade-Fenster, auf das
  // gewartet werden müsste; trotzdem eine kurze, grosszügige Frist, damit ein
  // eventueller (fehlerhafter) Nachlade-Fetch Zeit hätte, VOR der Zusicherung
  // einzutreffen.
  await expect(rechtsprechungKachel(page)).toBeVisible()
  await page.waitForTimeout(1000)
  expect(angefragt, `angefragte Register-URLs: ${JSON.stringify(angefragt)}`).toEqual([])
})

// ─── W2·29-WERKBANK-START-FEINSCHLIFF (David 24.9.2026: «dass das schöner ist
// … überprüft, dass nicht abgeschnitten ist») ─────────────────────────────────
// Drei Bedienmängel aus den Gegenprüfungen S1–S3, als echte Aktionsfolgen.
test.describe('Startseite · Feinschliff', () => {
  // Escape SOFORT nach dem Klick, mitten in der 450-ms-Öffnung. Vorher stand
  // der Fokus bis zur Phase «offen» auf der Kachel UNTER dem Blatt, der
  // Escape-Handler sitzt am Blatt — die Taste verpuffte (alle vier Kacheln).
  for (const [name, kachel] of [['Gesetze', gesetzeKachel], ['Rechtsprechung', rechtsprechungKachel],
    ['Materialien', materialienKachel], ['Werkzeuge', werkzeugeKachel]] as const) {
    test(`${name}: Escape mitten in der Öffnung schliesst ganz, Fokus zurück auf die Kachel`, async ({ page }) => {
      await page.goto('/')
      await kachel(page).click()
      // Das Blatt steht im DOM (Phase «start»/früh «offen») — die Bewegung
      // läuft noch 450 ms. Nicht auf das Ende warten: genau hier verpuffte
      // die Taste. (Vor dem ersten Zeichnen des Blatts — die Navigation ist
      // eine React-Transition — gibt es noch kein Blatt, das hören könnte;
      // dieses Fenster misst Millisekunden und ist kein Bedienfall.)
      await expect(blatt(page)).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page).toHaveURL(/\/$/)
      await expect(blatt(page)).toHaveCount(0)
      await expect(kachel(page)).toBeFocused()
    })
  }

  // Über die 760-px-Grenze wechselt das Blatt zwischen Feld und Vollbild. Vorher
  // baute React dabei den ganzen Blatt-Teilbaum neu auf (Portal-Ziel wechselte):
  // Suchwort, Treffer und Fokus waren weg.
  test('Breitenwechsel Feld ↔ Vollbild behält Suchwort, Treffer und Fokus', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/?blatt=materialien')
    const suchfeld = blatt(page).getByRole('searchbox', { name: 'Materialien durchsuchen' })
    await expect(suchfeld).toBeFocused()
    await suchfeld.fill('Umstrukturierungen')
    const treffer = blatt(page).locator('a[href="/materialien/ESTV-KS-DBG-5A"]')
    await expect(treffer).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.locator('#root')).toHaveAttribute('inert', '')
    await expect(suchfeld).toHaveValue('Umstrukturierungen')
    await expect(treffer).toBeVisible()
    await expect(suchfeld).toBeFocused()

    await page.setViewportSize({ width: 1280, height: 900 })
    await expect(page.locator('#root')).not.toHaveAttribute('inert', '')
    await expect(suchfeld).toHaveValue('Umstrukturierungen')
    await expect(treffer).toBeVisible()
  })

  // §8: Verweis-Einträge (vollständiges Urteil zu einem BGE) sind keine eigenen
  // Entscheide — die Rubrikseite zählt sie nicht mit, die Entscheid-Liste auf
  // «/» lässt sie weg. Das Blatt zeigte 1'252 davon als gewöhnliche Treffer.
  // Die Zahl wird aus dem Register nachgerechnet, nicht abgeschrieben.
  test('Rechtsprechung: Trefferzahl ohne Verweis-Einträge, per aria-live gemeldet', async ({ page, request }) => {
    const reg = await (await request.get('/rechtsprechung/register.json')).json() as { entscheide: { verweis?: unknown }[] }
    const verweise = reg.entscheide.filter((e) => e.verweis).length
    expect(verweise, 'ohne Verweis-Einträge im Korpus prüfte dieser Fall nichts').toBeGreaterThan(0)
    const echte = reg.entscheide.length - verweise
    await page.goto('/?blatt=rechtsprechung')
    const zahl = blatt(page).getByRole('status').filter({ hasText: /Entscheide$/ })
    await expect(zahl).toHaveText(`${echte.toLocaleString('de-CH')} Entscheide`)
    await expect(zahl).toHaveAttribute('aria-live', 'polite')
  })
})

// ─── START-UEBERARBEITUNG U4 + U6 (David 24.9.2026, FAHRPLAN-WERKBANK-UMBAU §5d-bis)
// U4: «Häufig gebraucht» unter den Kacheln — Kacheln behalten ab `lg` ihre Höhe
// (Token `start-kachel-breit`, 18rem = 288 px), die Zeile füllt den Rest, und
// die linke Spalte endet bündig mit der Fläche Schnellwerkzeug, in allen drei
// Varianten. U6: Gruss und Datum auf einer Grundlinie, Linie über die volle
// Breite. ROT ZU BEKOMMEN: in `pages/Startseite.tsx` die Spalte zurück auf das
// blosse Kachelfeld stellen (Kacheln gestreckt, keine Zeile) bzw. in
// `SuchBlock.tsx` den Breiten-Deckel `max-w-[54rem]` zurücksetzen.
const haeufig = (page: Page) => page.locator('section').filter({ has: page.getByRole('heading', { name: 'Häufig gebraucht' }) })
const schnell = (page: Page) => page.locator('section:has([role=tabpanel])')
const unten = async (l: ReturnType<Page['locator']>) => { const b = (await l.boundingBox())!; return Math.round(b.y + b.height) }

// DEKLARIERTE ANPASSUNG (U9, Nachtrag David 24.9.2026 abends, §6.3): «zuletzt
// geöffnet auf startseite soll nicht extra platz einnehmen sonder
// schnellwerkzeug soll kleiner werden». Die Bühne ist nur noch so hoch wie die
// Frist-Variante, «Zuletzt geöffnet» steht in derselben Zeile unter dem
// Schnellwerkzeug. Bündig ist darum jetzt «Häufig gebraucht» mit der LETZTEN
// Fläche der Spalte: mit Einträgen «Zuletzt» (gestreckt), ohne Einträge reicht
// «Häufig gebraucht» mindestens bis unter das Schnellwerkzeug und bis zur
// Unterkante der Spalte. ROT ZU BEKOMMEN (U9): in `pages/Startseite.tsx` die
// `aside` zurück auf `row-span-2 grid-rows-subgrid` stellen.
const zuletztFl = (page: Page) => page.locator('section').filter({ has: page.getByRole('heading', { name: 'Zuletzt geöffnet' }) })
const INHALT = { Frist: 'Fristende', Verzugszins: 'Verzugszins (gesamt)', 'Verjährung': 'Verjährungseintritt' } as const

test.describe('Startseite · Häufig gebraucht und Kopfzeile', () => {
  for (const breite of [1024, 1440]) {
    test(`@${breite}: Kacheln 288 px, «Häufig gebraucht» endet bündig mit der Spalte — alle Varianten`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: 900 })
      await page.goto('/')
      const aside = page.locator('aside[aria-label="Arbeitsplatz"]')
      for (const wahl of ['Frist', 'Verzugszins', 'Verjährung'] as const) {
        await page.getByRole('tab', { name: wahl, exact: true }).click()
        await expect(page.getByRole('tabpanel')).toContainText(INHALT[wahl])
        const kacheln = await page.locator('.lc-start-zelle').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)))
        expect(kacheln, `${wahl}: Kachelhöhen`).toEqual([288, 288, 288, 288])
        expect(await unten(haeufig(page)), `${wahl}: ohne «Zuletzt» nicht über dem Schnellwerkzeug`).toBeGreaterThanOrEqual(await unten(schnell(page)) - 1)
        expect(Math.abs(await unten(haeufig(page)) - await unten(aside)), `${wahl}: eine Zeile`).toBeLessThanOrEqual(1)
      }
      // Mit Einträgen: «Zuletzt» ist die letzte Fläche und endet bündig mit «Häufig gebraucht».
      await page.evaluate(() => localStorage.setItem('lexmetrik-zuletzt', JSON.stringify(
        [0, 1, 2, 3, 4, 5, 6].map((i) => ({ route: `/gesetze/bund/U9-${i}`, titel: `Erlass ${i}`, typ: 'gesetz', zeit: 7 - i })))))
      for (const wahl of ['Frist', 'Verzugszins', 'Verjährung'] as const) {
        await page.goto('/')
        await page.getByRole('tab', { name: wahl, exact: true }).click()
        await expect(page.getByRole('tabpanel')).toContainText(INHALT[wahl])
        await expect(zuletztFl(page).getByRole('link')).toHaveCount(5)
        expect(Math.abs(await unten(haeufig(page)) - await unten(zuletztFl(page))), `${wahl}: Unterkanten mit «Zuletzt»`).toBeLessThanOrEqual(1)
      }
    })
  }

  test('@390: einspaltig Kacheln → Häufig gebraucht → Schnellwerkzeug', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto('/')
    const oben = async (l: ReturnType<Page['locator']>) => (await l.boundingBox())!.y
    const feldUnten = await unten(page.locator('.lc-start-feld'))
    expect(await oben(haeufig(page))).toBeGreaterThan(feldUnten)
    expect(await oben(schnell(page))).toBeGreaterThan(await unten(haeufig(page)))
  })

  test('Direktlinks in den Leser, Ziel aus dem Register (StGB → STGB), Tastatur', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const links = haeufig(page).getByRole('link')
    // U7: Zeile = Kürzel · SR · Titel — das Kürzel steht vorn (deklarierte Design-Änderung).
    await expect(links).toHaveText([/^BV/, /^ZGB/, /^OR/, /^StGB/, /^ZPO/, /^StPO/, /^SchKG/])
    await expect(haeufig(page).getByRole('link', { name: /^StGB – Schweizerisches Strafgesetzbuch$/ })).toHaveAttribute('href', '/gesetze/bund/STGB')
    await links.nth(1).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/gesetze\/bund\/ZGB$/)
  })

  test('U6: Gruss und Datum auf einer Grundlinie @1440, untereinander @390; Linie über die volle Breite', async ({ page }) => {
    for (const breite of [1440, 390]) {
      await page.setViewportSize({ width: breite, height: 900 })
      await page.goto('/')
      const kopf = page.locator('main h1').first().locator('..')
      const [h1, datum, k, a, f] = await Promise.all([page.locator('main h1').boundingBox(), kopf.locator('p').first().boundingBox(),
        kopf.boundingBox(), page.locator('aside[aria-label="Arbeitsplatz"]').boundingBox(), page.locator('.lc-start-feld').boundingBox()])
      if (breite === 1440) {
        // Grundlinie: beide Zeilen enden unten gleich (items-baseline, ±3 px).
        expect(Math.abs((h1!.y + h1!.height) - (datum!.y + datum!.height))).toBeLessThanOrEqual(3)
        expect(datum!.x).toBeGreaterThan(h1!.x + h1!.width)
        // Linie = Unterkante des Kopfs, von der Kachelspalte bis zum Rand des Schnellwerkzeugs.
        expect(Math.round(k!.x)).toBe(Math.round(f!.x))
        expect(Math.round(k!.x + k!.width)).toBe(Math.round(a!.x + a!.width))
      } else {
        expect(datum!.y).toBeGreaterThanOrEqual(h1!.y + h1!.height - 1)
      }
    }
  })
})
