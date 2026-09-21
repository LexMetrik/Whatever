// @shard-gruppe: 6
// ═══ C2 (Design-Review 29.8.2026) · DER APP-STREIFEN LÄUFT NICHT QUER @320 ═══
//
// BEFUND, gemessen 29.8.2026 gegen `vite preview` (Chromium, 320×800):
// die Rechtsgruppe der Topbar (Verlauf · Reiter · Thema · Sprache) endete bei
// x = 332 in einem 320-px-Fenster — «de ▾» hing 12 px über der Fensterkante.
// `documentElement.scrollWidth` war 332 auf `/gesetze` und 355 im Leser.
//
// DIE MESSBEDINGUNG IST TEIL DES BEFUNDS (§0 Ziff. 3). Kalt ist der Streifen
// unauffällig: Verlauf- und Reiter-Trigger erscheinen erst, wenn Verlauf bzw.
// offene Reiter existieren (beide client-only, `useZuletzt`/`useTabs`). Die
// Rechtsgruppe misst darum 98 px beim allerersten Seitenaufruf und 198 px,
// sobald man EIN Gesetz geöffnet hat — und genau dann läuft sie über. Der
// Review-Bericht las das als «Leser-Zusatzgriffe»; es sind keine Leser-Griffe,
// es ist der WARME Zustand desselben Streifens auf jeder Route. Die Fälle unten
// wärmen darum bewusst vor, statt kalt zu messen (kalt wäre grün ohne Aussage).
//
// GEPRÜFT WIRD NUR DER STREIFEN, nicht die ganze Seite. Der Leser hat @320 einen
// ZWEITEN, hiervon unabhängigen Überläufer: die Gliederungs-Titel in
// `SektionBaumTOC` (`whitespace-nowrap`, rechte Kante 355). Der gehört zu einer
// anderen Bau-Einheit (offener PR #567) und wird hier bewusst nicht mitgemessen
// — ein Tor, das auf fremde Arbeit wartet, wäre entweder rot oder aufgeweicht.
// Sobald die Gliederung nachgezogen ist, gehört die Schranke auf die ganze Seite
// gehoben (Rest-Vermerk in der Rückgabe der Bau-Einheit W2·11-MOBILKOPF).
//
// ROT ZU BEKOMMEN (§6.7): in `src/components/layout/Topbar.tsx` das
// `max-[480px]:hidden` am Logo-`<Link>` ODER an der Hülle um
// `<VerlaufUebersicht/>` entfernen. Gemessen 29.8.2026 @320 auf `/gesetze`,
// warm, gegen den dev-Server — je EINMAL vor und nach dem Lupen-Posten, weil
// sich dazwischen die Empfindlichkeit des Tors ändert:
//
//                      vor der Lupe       mit der Lupe
//   Fix (Soll)           0 px  grün         0 px  grün   (Kante 320)
//   nur Logo zurück      0 px  GRÜN          6 px  rot   (Kante 326)
//   nur Verlauf zurück   0 px  GRÜN          6 px  rot   (Kante 326)
//   beide zurück        12 px  rot          56 px  rot   (Kante 332 / 376)
//
// Die beiden GRÜN in der linken Spalte sind kein Messfehler, sondern der
// Zustand, den C1/B10 beschreibt: das Suchfeld war `flex-1 min-w-0` und
// schluckte jeden Platzmangel, bis es 0 px breit war — ein Feld, das unter
// Druck verschwindet statt zu drücken. Seit es unter 480 px eine 44-px-Lupe ist
// (`min-w-11`, `HeaderSuche`), kann es nicht mehr schlucken, und das Tor ist auf
// jede einzelne Rücknahme empfindlich. Wer die Lupe entfernt, macht dieses Tor
// also wieder stumpf — dann gehört die Untergrenze zuerst zurück.
import { test, expect, type Page } from '@playwright/test'

/** Rechte Kante des am weitesten rechts stehenden Streifen-Elements. */
async function streifenKante(page: Page): Promise<{ ueberlauf: number; quellen: string[] }> {
  return page.evaluate(() => {
    const grenze = document.documentElement.clientWidth
    const kopf = document.querySelector('header.sticky')
    if (!kopf) return { ueberlauf: Number.NaN, quellen: ['header.sticky fehlt'] }
    const quellen: string[] = []
    let weiteste = 0
    for (const el of kopf.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      weiteste = Math.max(weiteste, r.right)
      if (r.right > grenze + 1) {
        quellen.push(`${el.tagName}${el.className ? '.' + String(el.className).split(' ')[0] : ''}`
          + ` right=${Math.round(r.right)} «${(el.textContent ?? '').trim().slice(0, 24)}»`)
      }
    }
    return { ueberlauf: Math.round(weiteste - grenze), quellen: quellen.slice(0, 6) }
  })
}

/** Warmer Zustand: Verlauf UND offener Reiter vorhanden — sonst misst der Fall
 *  einen Streifen, den es im Alltag nach dem ersten Klick nicht mehr gibt. */
async function waerme(page: Page): Promise<void> {
  await page.goto('/gesetze/bund/OR')
  await expect(page.locator('article[id^="art-"]').first()).toBeAttached({ timeout: 20_000 })
}

test.describe('C2 — die Topbar bleibt @320 im Fenster', () => {
  for (const [name, pfad] of [
    ['Leser', '/gesetze/bund/OR'],
    ['Gesetze-Übersicht', '/gesetze'],
    ['Startseite', '/'],
  ] as const) {
    test(`${name} @320: kein Element des Streifens ragt über die Fensterkante`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 })
      await waerme(page)
      await page.goto(pfad)
      await expect(page.locator('header.sticky')).toBeVisible({ timeout: 20_000 })

      // Vorbedingung (§6.7): der Streifen ist WARM — sonst wäre der Fall grün,
      // weil zwei der vier Werkzeug-Knöpfe schlicht fehlen.
      //
      // ── NACHGEZOGEN 6.9.2026 (R2-Nachzug) · DIE SONDE ZEIGTE INS LEERE ────
      // Bis hierher suchte sie `button[aria-label="Alle geöffneten Reiter"]` im
      // Streifen — den ☰-Trigger der `ReiterUebersicht`. Den hat W2·24 R2
      // gelöscht (die offenen Reiter stehen sichtbar in der Arbeitsleiste);
      // GEMESSEN gegen das R2-`dist/`: alle drei Fälle rot, «resolved to 0
      // elements», also seit dem R2-Bau ein totes Tor. Die Vorbedingung ist
      // dieselbe geblieben — «es ist ein Reiter offen» —, sie wird nur dort
      // gemessen, wo die Reiter heute stehen.
      await expect(page.locator('nav[aria-label="Offene Reiter"] [data-reiter-aktiv]').first())
        .toBeVisible({ timeout: 20_000 })

      const { ueberlauf, quellen } = await streifenKante(page)
      expect(ueberlauf, `Streifen-Überlauf @320 auf ${pfad}: ${ueberlauf} px — ${quellen.join(' | ') || 'keine Quelle'}`)
        .toBeLessThanOrEqual(0)
    })
  }

  // ── C2 · DER ERSATZ FÜR DAS LOGO IST DA, NICHT BLOSS BEHAUPTET ────────────
  // Der Streifen darf das Logo unter 480 px nur weglassen, WEIL die Schublade es
  // dort trägt. Ohne diesen Fall stünde das Argument allein im Kommentar, und
  // eine spätere Änderung an `markeZeigen` würde die Marke auf schmalen Schirmen
  // stillschweigend ganz verlieren (§6.7).
  // ROT ZU BEKOMMEN: in `components/layout/Sidebar.tsx` den Klassenausdruck
  // `markeZeigen ? 'flex' : 'hidden max-[480px]:flex'` wieder auf ein
  // `{markeZeigen && …}` zurücknehmen ⇒ @320 findet der Fall 0 sichtbare Marken.
  // Gemessen 29.8.2026 (Schublade offen): sichtbar 1 @320, 1 @375, 0 @500.
  //
  // ── F7 (Prüfbefund 6.9.2026) · DAS SIEGEL STEHT JETZT AUCH IM STREIFEN ────
  // Der Kopf ist seit R2 das TITELBLATT der Sammlung; @390 trug er kein Zeichen
  // der Herkunft mehr. Zurück kommt das §-Siegel (28 px), NICHT die Wortmarke —
  // an deren ~130 px war C2 gescheitert. Die Zusage dieses Falls ändert sich
  // damit: geprüft wird nicht mehr «der Streifen hat KEINE Marke», sondern
  // «Siegel ja, Wortmarke nein — und die Schublade trägt beides».
  test('@320 trägt der Streifen das Siegel, die Schublade die volle Marke', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/gesetze')
    await expect(page.locator('header.sticky')).toBeVisible({ timeout: 20_000 })
    // Vorbedingung: das Siegel steht im Streifen, die Wortmarke nicht.
    await expect(page.locator('header.sticky a[aria-label="LexMetrik – Startseite"]')).toBeVisible()
    await expect(page.locator('header.sticky a[aria-label="LexMetrik – Startseite"] svg')).toBeVisible()
    const wortmarkeBreit = await page.locator('header.sticky a[aria-label="LexMetrik – Startseite"]')
      .evaluate((a) => a.getBoundingClientRect().width)
    expect(wortmarkeBreit, `Marke im Streifen @320: ${wortmarkeBreit} px — mehr als das Siegel`)
      .toBeLessThan(60)

    await page.locator('header.sticky button[aria-label="Navigation öffnen"]').click()
    const schublade = page.locator('#seitenleisten-schublade')
    await expect(schublade).toBeVisible({ timeout: 10_000 })
    await expect(schublade.locator('a[aria-label="LexMetrik – Startseite"]')).toBeVisible()
    // Und der Weg zur Startseite steht dort ohnehin als beschrifteter Eintrag.
    await expect(schublade.locator('a[href="/"]').first()).toBeAttached()
  })

  // ── C1/B10/L3 · DIE LUPE IST DIE SUCHE, NICHT IHR PLATZHALTER ─────────────
  // BEFUND, gemessen 29.8.2026 warm: das Suchfeld war @320 UND @375 genau 28 px
  // breit — ein leerer Rahmen. Es reicht nicht, dass dort jetzt ein Knopf steht;
  // geprüft wird, dass er die Suche AUFMACHT und das Feld dann benutzbar ist.
  // Ohne diesen Fall wäre der Streifen-Überlauf oben auch mit einer toten Lupe
  // grün (§6.7).
  // ROT ZU BEKOMMEN: in `HeaderSuche.tsx` `onClick={fokussiere}` an der Lupe
  // durch `onClick={() => setOffen(true)}` ersetzen ⇒ das Feld erscheint, trägt
  // aber keinen Fokus (der Fokus-Wunsch über das Render hinweg ist genau das,
  // was der versteckte Zustand braucht); oder `min-h-11 min-w-11` an der Lupe
  // selbst streichen ⇒ sie unterschreitet das 44-px-Komfortziel.
  // GESTRICHEN 29.8.2026 (Korrekturrunde) war ein DRITTER, nachgemessen
  // FALSCHER Rot-Weg: «das `max-[480px]:min-w-11` in `Topbar.tsx` streichen ⇒
  // die Lupe steht @320 über der Hüllenkante». Sie tut es nicht. Die flex-1-
  // Hülle ist auf jeder geprüften Breite weiter als ihr Inhalt (72 px @320 …
  // 212 @460), mit und ohne Untergrenze identisch; die Lupe ist `shrink-0` und
  // hält ihre 44 px ohnehin selbst. Die Untergrenze ist daraufhin aus
  // `Topbar.tsx` entfernt worden (§17). Ein Rot-Weg, der nicht rot wird, ist
  // schlimmer als keiner — er lässt ein Tor stärker aussehen, als es ist (§6.7).
  test('@320 öffnet die Lupe das Feld über die volle Streifenbreite', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await waerme(page)
    await page.goto('/gesetze')

    const lupe = page.locator('header.sticky [data-suche-lupe]')
    await expect(lupe).toBeVisible({ timeout: 20_000 })
    expect(await lupe.evaluate((n) => Math.round(n.getBoundingClientRect().width)),
      'Die Lupe unterschreitet das 44-px-Komfortziel (§13/F-Reihe)').toBeGreaterThanOrEqual(44)
    // Vorbedingung: im Ruhezustand ist das Feld dort NICHT im Bild — sonst
    // prüfte der Fall einen Streifen, der die Lupe gar nicht braucht.
    await expect(page.locator('header.sticky input[type="search"]')).toBeHidden()

    await lupe.click()
    const feld = page.locator('header.sticky input[type="search"]')
    await expect(feld).toBeFocused({ timeout: 10_000 })
    const breite = await feld.evaluate((n) => Math.round(n.getBoundingClientRect().width))
    // Der Fokusmodus gibt dem Feld den Streifen minus dessen Polsterung (2×16).
    expect(breite, `Feldbreite nach dem Lupen-Tap @320: ${breite} px (vor dem Fix: 28 px)`)
      .toBeGreaterThanOrEqual(240)

    // Tippen erreicht das Feld, und die Trefferfläche öffnet.
    await page.keyboard.type('or 257')
    await expect(feld).toHaveValue('or 257')

    // ✕ führt zurück — Lupe wieder da, Fokus nicht auf <body> (S6-Zusage).
    await page.locator('header.sticky button[aria-label="Suche schliessen"]').click()
    await expect(lupe).toBeVisible()
    // ── KORREKTURRUNDE 29.8.2026 · DAS TOR RANNTE, NICHT DIE APP ─────────────
    // Diese Stelle las `document.activeElement` EINMALIG und war damit lokal
    // 12/12 rot (`--repeat-each=12 --workers=1`, warm, gegen dist/) — nicht weil
    // der Fokus ausbliebe, sondern weil er noch unterwegs war: der Streifen gibt
    // ihn per React-Effekt zurück, sobald das Ziel wieder sichtbar IST.
    // GEMESSEN am gebauten Stand, ms vom ✕-Klick bis `document.activeElement`
    // == ☰, 6 Läufe: 22.8 · 11.5 · 9.5 · 11.7 · 11.5 · 9.2.
    // Auf dem langsamen CI-Runner hätte die vorangehende Sichtbarkeits-Prüfung
    // dieses Fenster überdeckt — das Tor wäre dort grün und lokal rot gewesen,
    // also ein Fall, der die MASCHINE misst statt die Software.
    // Die Zusage bleibt wörtlich und gleich streng: nach dem ✕ trägt der ☰ den
    // Fokus, nicht <body>. Nur die Ablesung wartet die Übergabe ab, mit einem
    // Budget rund zwei Zehnerpotenzen über der gemessenen Dauer.
    // ROT ZU BEKOMMEN: in `HeaderSuche.tsx` den Aufruf `onFokusZurueck?.()` im
    // ✕-Knopf streichen ⇒ der Fokus fällt auf <body>, der Poll läuft ins Budget.
    await expect
      .poll(async () => page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
        { timeout: 2000, message: 'Fokus nach dem ✕ verloren' })
      .toBe('Navigation öffnen')
  })

  // Gegenprobe: die Entlastung gilt NUR unter 480 px. Darüber muss der Streifen
  // wieder vollständig sein — sonst hätte der Fix oben die Werkzeuge dauerhaft
  // entfernt und das Tor hätte das nicht gemerkt (§6.7).
  // WARUM 500 UND NICHT 480: `setViewportSize` setzt die FENSTER-Breite, die
  // Media-Query misst die Layout-Breite ohne die klassische Scrollleiste — bei
  // 480 sind das 465 px, die Schwelle greift also noch. Gemessen 29.8.2026:
  // bei 480 meldet der Fall «Logo hidden». 500 liegt mit 485 px sicher darüber
  // und bleibt trotzdem im Mobil-Bereich (< sm = 640).
  test('@500 stehen Logo und Verlauf-Trigger wieder im Streifen', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 800 })
    await waerme(page)
    await expect(page.locator('header.sticky a[aria-label="LexMetrik – Startseite"]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('header.sticky button[aria-label="Verlauf – zuletzt geöffnet"]')).toBeVisible()
    // …und das Feld steht dort wieder selbst im Streifen, ohne Lupe davor.
    await expect(page.locator('header.sticky input[type="search"]')).toBeVisible()
    await expect(page.locator('header.sticky [data-suche-lupe]')).toBeHidden()

    // Und dort läuft er ebenfalls nicht über.
    const { ueberlauf, quellen } = await streifenKante(page)
    expect(ueberlauf, `Streifen-Überlauf @500: ${ueberlauf} px — ${quellen.join(' | ') || 'keine Quelle'}`)
      .toBeLessThanOrEqual(0)
  })
})
