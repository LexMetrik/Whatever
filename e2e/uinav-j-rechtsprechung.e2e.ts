// @shard-gruppe: 5
// J1/J2/J4 · Rechtsprechungs-Seiten (W2·10-UI-NAV-J). Die vier Prüfpunkte des
// Fahrplans, die nur im echten Browser beweisbar sind — SSR führt keine Effekte
// aus, kennt keine Klicks, keinen Verlauf und keine Scrollposition.
//
//   1. Listen-Scroll-Restoration Treffer → Detail → zurück, MIT nachgeladenen
//      Batches: Position UND geladene Menge müssen wiederherstellbar sein.
//   2. Der Band-/Jahrgangs-Sprung führt wirklich zum Band — auch wenn das Ziel
//      jenseits des aktuellen Deckels liegt und erst nachgeladen werden muss.
//   3. Das Mobil-Sheet öffnet und schliesst mit korrektem Fokus (a11y).
//   4. News-Karten: Rechtsgebiet-Badge deterministisch, Datum einmal je Gruppe.
//
// TIMING-REGEL dieser Spec (Lehre der O-Runde, uinav-o2-sidebar): eine
// Adress-Zusicherung erfüllt sich bereits beim pushState und beweist NICHT, dass
// die Zwischenseite je gerendert wurde. Wo diese Spec einen Zwischenschritt
// braucht, riegelt sie ihn mit einem GERENDERTEN Merkmal ab und wartet vor
// `goBack()` darauf. Adress-Asserts bleiben query-tolerant: die Übersicht
// spiegelt ihren Filterzustand per replaceState in die Query.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

/** Übersicht öffnen und warten, bis das Manifest da ist (Zeilen gerendert). */
async function uebersicht(page: Page, query = '') {
  await page.goto(`/rechtsprechung${query}`)
  await expect(page.locator('a[href^="/rechtsprechung/"]').first()).toBeVisible()
}

test.describe('W2·10-UI-NAV-J · Rechtsprechungs-Seiten', () => {
  // ── J1/1 · Scroll-Restoration mit nachgeladenen Batches ───────────────────
  test('Treffer → Detail → zurück: geladene Menge UND Position überleben', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    // «Neueste zuerst» erzwingt den EINEN Strom (statt der Sektions-Ansicht) und
    // damit genau die Liste, die Fenster und Sprungleiste trägt.
    await uebersicht(page, '?kanton=BS')
    await page.getByLabel('Sortierung').selectOption('neu')

    const zeilen = page.locator('a[href^="/rechtsprechung/"]')
    const vorher = await zeilen.count()

    // Einen Batch nachladen — erst dadurch entsteht der Fall, den der Fahrplan
    // meint (ohne Nachladen wäre die Wiederherstellung trivial).
    const mehr = page.getByRole('button', { name: /Weitere anzeigen/ })
    await expect(mehr).toBeVisible()
    await mehr.click()
    const nachgeladen = await zeilen.count()
    expect(nachgeladen, 'der Batch muss die Liste wirklich verlängern').toBeGreaterThan(vorher)

    // Tief scrollen und einen Treffer JENSEITS des Grundfensters öffnen.
    const ziel = zeilen.nth(nachgeladen - 5)
    await ziel.scrollIntoViewIfNeeded()
    const y = await page.evaluate(() => window.scrollY)
    expect(y, 'für den Test muss echt gescrollt worden sein').toBeGreaterThan(500)

    await ziel.click()
    // COMMIT-BEWEIS statt blossem Adress-Beweis: auf ein gerendertes Merkmal der
    // Detailseite warten, sonst liegt der Rückweg im selben React-Batch.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // ── HÄRTUNG (Gegenprüfungs-Befund B5, 8.8.2026) ───────────────────────────
    // Ohne diesen Reload bewies der Fall NICHTS: bei kurzer Verweildauer auf der
    // Detailseite überlebt der Übersichts-Baum in einem verzögerten Unmount-
    // Fenster, der Fenster-Zustand liegt dann noch im lebenden `useState` — der
    // Fall bestand darum auch mit ausgehängter Wiederherstellung. Der Reload
    // zerstört den React-Baum HART und deterministisch (kein Warten auf ein
    // Zeitfenster): danach ist sessionStorage die EINZIGE verbliebene Quelle,
    // aus der das Fenster zurückkommen kann. Genau der Pfad, den J1 gebaut hat.
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.goBack()
    await expect(page).toHaveURL(/\/rechtsprechung(\?|$)/)

    // (a) DER MECHANISMUS: die geladene Menge ist wieder da — allein aus
    //     sessionStorage, denn der Baum von vorhin existiert nicht mehr.
    await expect(zeilen).toHaveCount(nachgeladen)
    // (b) Und damit ist die frühere Position überhaupt wieder ERREICHBAR: das
    //     Dokument ist mindestens so hoch wie der Scrollwert von vorhin. Das ist
    //     der eigentliche Schaden, den J1 behebt — ohne wiederhergestelltes
    //     Fenster wäre die Liste auf eine Batch-Breite geschrumpft und die
    //     gespeicherte Position läge jenseits des Dokumentendes.
    //     Der konkrete scrollY wird hier bewusst NICHT geprüft: die
    //     Positions-Tabelle in App.tsx lebt im Arbeitsspeicher und ist nach
    //     einem echten Reload naturgemäss fort. Diesen Teil deckt Leg 2 ab.
    const hoehe = await page.evaluate(() => document.documentElement.scrollHeight)
    expect(hoehe, `Dokumenthöhe ${hoehe} muss die frühere Position ${y} tragen`).toBeGreaterThanOrEqual(y)

    // ── Leg 2 · Position innerhalb DERSELBEN Sitzung (ohne Reload) ────────────
    // Hier ist die Positions-Tabelle in App.tsx noch da; geprüft wird ihr
    // Zusammenspiel mit dem wiederhergestellten Fenster.
    await page.evaluate(() => window.scrollTo(0, 0))
    const ziel2 = zeilen.nth(nachgeladen - 5)
    await ziel2.scrollIntoViewIfNeeded()
    const y2 = await page.evaluate(() => window.scrollY)
    expect(y2).toBeGreaterThan(500)
    await ziel2.click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.goBack()
    await expect(page).toHaveURL(/\/rechtsprechung(\?|$)/)
    await expect(zeilen).toHaveCount(nachgeladen)
    await expect.poll(
      () => page.evaluate(() => window.scrollY),
      { message: 'Scrollposition nach Rückkehr' },
    ).toBeGreaterThan(y2 * 0.5)

    expect(fehler, fehler.join('\n')).toEqual([])
  })

  // ── J1/2 · Der Band-Sprung führt zum Band ─────────────────────────────────
  test('Jahrgangs-Sprungleiste führt zum Jahrgang und lädt ihn bei Bedarf nach', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await uebersicht(page, '?kanton=BS')
    await page.getByLabel('Sortierung').selectOption('neu')

    const leiste = page.getByRole('navigation', { name: 'Nach Jahrgang springen' })
    await expect(leiste).toBeVisible()

    // Der LETZTE Chip ist der älteste Jahrgang — sein erster Eintrag liegt am
    // weitesten hinten, also mit Sicherheit jenseits des Grunddeckels.
    const chips = leiste.getByRole('button')
    const n = await chips.count()
    expect(n, 'die Leiste braucht mehrere Jahrgänge').toBeGreaterThan(1)
    const letzter = chips.nth(n - 1)
    const label = (await letzter.getAttribute('aria-label')) ?? ''
    const jahr = /Jahrgang (\d{4})/.exec(label)?.[1]
    expect(jahr, `Jahr aus «${label}»`).toBeTruthy()

    const vorher = await page.locator('a[href^="/rechtsprechung/"]').count()
    await letzter.click()

    // ── B2 · DAS FENSTER SPRINGT MIT, es wächst nicht auf ────────────────────
    // Der ÄLTESTE Jahrgang liegt am Ende einer mehrtausendzeiligen Liste. Würde
    // der Deckel bis dorthin wachsen, stünden hier Tausende Zeilen im DOM —
    // genau die Last, gegen die LISTE_DECKEL gebaut ist. Geprüft wird darum
    // nicht «mehr geladen», sondern «gleich viel geladen wie vorher»: der
    // Sprung an das Listenende kostet dasselbe DOM wie jeder andere.
    await expect
      .poll(() => page.locator('a[href^="/rechtsprechung/"]').count(), { message: 'gerenderte Einträge' })
      .toBeLessThanOrEqual(vorher)

    // Der Weg zurück nach oben bleibt offen — sonst wäre der Teil der Liste
    // über dem Fenster unerreichbar (§8).
    await expect(page.getByRole('button', { name: /Frühere anzeigen/ })).toBeVisible()

    // Und wir sind dort GELANDET: das Element am oberen Rand des Blickfelds
    // trägt das gesuchte Jahr. Geprüft wird die Datums-Spalte der Zeile, die
    // gerade oben steht — nicht bloss, dass irgendwo dieses Jahr vorkommt.
    const obenJahr = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, 140)
      const zeile = el?.closest('[class*="group"]') ?? el
      return zeile?.textContent?.match(/\b(\d{4})\b/)?.[1] ?? null
    })
    expect(obenJahr, 'Jahr der Zeile am oberen Rand').toBe(jahr)

    expect(fehler, fehler.join('\n')).toEqual([])
  })

  // ── J2 · Mobil-Sheet: öffnen/schliessen mit korrektem Fokus ───────────────
  test('Mobil-Filter-Sheet ist modal, fokussiert und gibt den Fokus zurück', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await uebersicht(page)

    const ausloeser = page.getByRole('button', { name: /^Filter/ })
    await expect(ausloeser).toBeVisible()
    await expect(ausloeser).toHaveAttribute('aria-expanded', 'false')
    // Der Filterblock ist mobil NICHT vorab sichtbar (das ist der ganze Zweck).
    await expect(page.getByRole('searchbox', { name: 'Filtern' })).toHaveCount(0)

    await ausloeser.click()
    const sheet = page.getByRole('dialog', { name: 'Filter' })
    await expect(sheet).toBeVisible()
    // Ehrliche Rolle: es fängt den Fokus und legt den Hintergrund still, also
    // darf und muss es sich als modal ausweisen (Lehre B2 der V-Runde).
    await expect(sheet).toHaveAttribute('aria-modal', 'true')
    // Der Fokus steht IM Sheet, nicht mehr auf dem Auslöser.
    await expect.poll(
      () => page.evaluate(() => !!document.activeElement?.closest('[data-filter-sheet]')),
      { message: 'Fokus liegt im Sheet' },
    ).toBe(true)
    // Der Filterblock ist jetzt erreichbar.
    await expect(page.getByRole('searchbox', { name: 'Filtern' })).toBeVisible()

    // Escape schliesst und gibt den Fokus an den Auslöser zurück.
    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
    await expect.poll(
      () => page.evaluate(() => document.activeElement?.textContent?.includes('Filter') ?? false),
      { message: 'Fokus zurück auf dem Auslöser' },
    ).toBe(true)

    expect(fehler, fehler.join('\n')).toEqual([])
  })

  // ── J4 · Entscheid-Liste der Startseite ───────────────────────────────────
  test('Entscheid-Liste: Gebiet je Zeile, Datum einmal je Gruppe, keine Gericht-Fusszeile', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/')
    // DEKLARIERTE ANPASSUNG (W2·23-STARTSEITE-V4 §3 #6, 5.9.2026, §6.3): die
    // Sektion heisst nicht mehr «Neue Bundesgerichtsentscheide» (aria-label),
    // sondern trägt eine echte <h2> «Jüngste Entscheide im Korpus» — ein
    // §8-Wortlaut-Fix (der Korpus endet ggf. Monate zurück, «neu» versprach
    // Aktualität, die die Daten nicht tragen).
    // DEKLARIERTE ANPASSUNG (W2·24-DESIGN-IDENTITAET R3, 6.9.2026, §6.3): aus
    // dem waagrechten KARTENSTREIFEN ist die LISTE des Referenzbildes geworden
    // (Datum · Zitierung · Gebiet/Regeste). Geprüft werden dieselben drei
    // Zusicherungen an ihrer neuen Form — (a) Datum-Dedupe, (b) jede Zeile
    // nennt ihr Rechtsgebiet, (c) keine «Bundesgericht»-Fusszeile. Der
    // Gebiets-Träger ist nicht mehr ein `.lc-overline`-Badge IM Link, sondern
    // die dritte Spalte der Zeile; sie trägt dafür ein stabiles `data-gebiet`.
    const liste = page.getByRole('region', { name: 'Jüngste Entscheide im Korpus' })
    await expect(liste).toBeVisible()
    await expect(liste.getByRole('listitem').first()).toBeVisible()

    // (a) Datum-Dedupe: jedes Datum steht in der Liste GENAU EINMAL.
    // §6.3-DEKLARATION (W2·24-DESIGN-IDENTITAET, Runde FC, 7.9.2026): der Griff
    // war `li > p` — das Gruppen-Datum stand als eigener `<p class="num">` direkt
    // im `<li>` (R3, 4dd675fd3). R9-2/A-3 (55acbf45d) hat genau diesen SECHSTEN
    // byte-gleichen Datums-Formatierer eingesammelt: die Gruppe trägt ihr Datum
    // seither über den geteilten Baustein `ui/Datum` (§5), also als
    // `span.lc-ziffern` statt als `<p>`. NULLPROBE: `EntscheideListe.tsx` und
    // `ui/Datum.tsx` sind byte-gleich zur Zweig-Basis `018b41a37` — der Griff war
    // schon dort tot, die Wurzel liegt VOR diesem Zweig, nicht in ihm.
    // Die drei Zusagen bleiben wörtlich; nur der Griff folgt dem Baustein:
    // `.lc-ziffern` ist die Ziffernrolle, die `ui/Datum` setzt und ausdrücklich
    // nicht verhandelt (Herleitung im Kopf des Bausteins).
    const daten = await liste.locator('li > .lc-ziffern').allTextContents()
    expect(daten.length, 'mindestens eine Datums-Gruppe').toBeGreaterThan(0)
    expect(new Set(daten).size, `Daten doppelt: ${daten.join(', ')}`).toBe(daten.length)

    // (b) Jede Zeile trägt genau ein Rechtsgebiet, und das ist nicht leer.
    const zeilen = liste.locator('a[href^="/rechtsprechung/"]')
    const anzahl = await zeilen.count()
    expect(anzahl).toBeGreaterThan(0)
    const gebiete = liste.locator('[data-gebiet]')
    expect(await gebiete.count(), 'ein Gebiet je Entscheid-Zeile').toBe(anzahl)
    for (let i = 0; i < anzahl; i++) {
      expect((await gebiete.nth(i).textContent())?.trim()).toBeTruthy()
    }

    // (c) Die «Bundesgericht»-Fusszeile ist weg — sie wiederholte den Titel.
    expect(await liste.textContent()).not.toContain('Bundesgericht')

    expect(fehler, fehler.join('\n')).toEqual([])
  })
})
