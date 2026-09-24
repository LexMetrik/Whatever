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
    // Erst wenn der Fokus im Suchfeld steht, ist das Blatt offen und hört auf
    // Escape (der Handler sitzt am Feld-Rahmen; während der Öffnung verpufft
    // die Taste — Gegenprüfung 24.9.2026: ohne dieses Warten 1/20 grün).
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
test('«/» lädt nie das 9,4-MB-Rechtsprechungs-Register (§15)', async ({ page }) => {
  const angefragt: string[] = []
  page.on('request', (r) => { if (r.url().includes('/rechtsprechung/register.json')) angefragt.push(r.url()) })
  await page.goto('/')
  // Die Entscheid-Liste («Jüngste Entscheide im Korpus», §8-Wortlaut) steht
  // sofort im HTML (Buildzeit-Projektion) — kein
  // Nachlade-Fenster, auf das gewartet werden müsste; trotzdem eine kurze,
  // grosszügige Frist, damit ein eventueller (fehlerhafter) Nachlade-Fetch
  // Zeit hätte, VOR der Zusicherung einzutreffen.
  await expect(page.getByText('Jüngste Entscheide im Korpus')).toBeVisible()
  await page.waitForTimeout(1000)
  expect(angefragt, `angefragte Register-URLs: ${JSON.stringify(angefragt)}`).toEqual([])
})
