// @shard-gruppe: 1
// FAHRPLAN-LESER-V3, Kap. 4b Pos. 4 (FL-5) — EIN Feld sucht UND springt.
// `SuchSprungFeld.tsx` löst die Eingabe gegen die Artikel-Token auf
// (`loeseArtikelEingabe`, suchTreffer.ts): eine auflösbare Zahl SPRINGT beim
// Enter/Klick, alles andere bleibt die bestehende In-Gesetz-Suche. Esc leert
// nur, springt aber nie (Pos. 14, «recover from mistakes»).
//
// STPO (480 Artikel, Art. 429 «Entschädigung und Genugtuung») ist bewusst
// gewählt: derselbe Artikel beweist sowohl den Zahlen-Sprung (a) als auch,
// dass der Volltextbegriff «Entschädigung» dort real vorkommt (b) — kein
// erfundener Suchbegriff.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const suchFeld = (page: Page) => page.locator('[data-v3-suchsprung] input')

async function oeffneStPO(page: Page): Promise<string[]> {
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/STPO')
  await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
  await expect(suchFeld(page)).toBeVisible({ timeout: 20_000 })
  return fehler
}

test.describe('FL-5 — EIN Feld für Suchen und Springen', () => {
  test('(a) «429» löst auf, Enter springt UNTER die klebende Kopfzeile', async ({ page }) => {
    test.slow() // grosser Erlass (StPO, 480 Art.)
    const fehler = await oeffneStPO(page)

    await suchFeld(page).fill('429')
    const hinweis = page.locator('[data-v3-sprung-hinweis]')
    await expect(hinweis).toBeVisible({ timeout: 10_000 })
    await expect(hinweis).toContainText('429')

    await suchFeld(page).press('Enter')
    const art = page.locator('#art-429')
    await expect(art).toBeInViewport({ timeout: 15_000 })
    await expect(page).toHaveURL(/#art-429$/)

    // Landepunkt: die Oberkante von Art. 429 liegt auf der Unterkante der
    // klebenden Kopfzeile (Risiko R1, `--nt-stick`) — nie negativ (hinter dem
    // Kopf verschwunden), nie deutlich darunter (zu weit gescrollt).
    const kopfBox = await page.locator('[data-v3-kopf]').boundingBox()
    const artBox = await art.boundingBox()
    expect(kopfBox, 'Kopfzeile nicht gefunden').not.toBeNull()
    expect(artBox, 'Art. 429 nicht gefunden').not.toBeNull()
    const artTop = artBox!.y
    const kopfUnterkante = kopfBox!.y + kopfBox!.height
    expect(artTop, `Art. 429 top=${artTop}, Kopf-Unterkante=${kopfUnterkante}`).toBeGreaterThanOrEqual(0)
    expect(Math.abs(artTop - kopfUnterkante), `Abstand Art.-Oberkante zu Kopf-Unterkante`).toBeLessThanOrEqual(8)

    expect(fehler).toEqual([])
  })

  // §6.3-UMSTELLUNG D38 (David 7.9.2026): der Fall hiess «… Seitenleiste zeigt
  // Trefferliste» und wartete darauf, dass die Überschrift der Leiste von
  // «Gliederung» auf «Treffer» wechselt. Genau diesen Wechsel hat David
  // beanstandet — die Treffer liegen seither über der Lesespalte, die Leiste
  // behält ihren Baum. Was der Fall prüft, ist unverändert: ein Volltext-Begriff
  // erzeugt KEINEN Sprung-Hinweis und sehr wohl eine Trefferliste.
  test('(b) Volltext-Begriff «Entschädigung»: kein Sprung-Hinweis, Trefferliste über der Lesespalte', async ({ page }) => {
    test.slow()
    const fehler = await oeffneStPO(page)

    await suchFeld(page).fill('Entschädigung')
    // Kein Sprung möglich — «Entschädigung» löst nicht auf keinen Artikel-Token.
    await expect(page.locator('[data-v3-sprung-hinweis]')).toHaveCount(0)

    // Die Liste erscheint über der Lesespalte (Debounce ~200 ms) …
    await expect(page.locator('[data-v3-treffer-spalte] [data-treffer-liste]'))
      .toBeVisible({ timeout: 10_000 })
    // … und die Seitenleiste bleibt, was sie ist (D38).
    const baumkopf = page.locator('[data-v3-leiste-baumkopf]')
    await expect(baumkopf.locator('h2')).toHaveText('Gliederung', { timeout: 10_000 })

    expect(fehler).toEqual([])
  })

  test('(c) Esc leert das Feld, springt aber NIE — Scrollposition bleibt exakt stehen', async ({ page }) => {
    test.slow()
    const fehler = await oeffneStPO(page)

    // Erst etwas herunterscrollen, damit ein Sprung überhaupt sichtbar wäre.
    await page.evaluate(() => window.scrollTo(0, 800))
    await page.waitForTimeout(150)
    const vorher = await page.evaluate(() => window.scrollY)

    await suchFeld(page).fill('429')
    await expect(page.locator('[data-v3-sprung-hinweis]')).toBeVisible({ timeout: 10_000 })
    await suchFeld(page).press('Escape')

    await expect(suchFeld(page)).toHaveValue('')
    await expect(page.locator('[data-v3-sprung-hinweis]')).toHaveCount(0)
    const nachher = await page.evaluate(() => window.scrollY)
    expect(nachher, `Scroll vorher ${vorher}, nachher ${nachher}`).toBe(vorher)

    expect(fehler).toEqual([])
  })

  // VORRANG VOR DER HEADER-SUCHE (Bug-Check B1, 16.8.2026). Der Test hatte den
  // Fehler bis dahin maskiert: zwischen den beiden Kürzeln stand ein
  // `body.click()`, und der schloss nebenbei das Dropdown der globalen Suche,
  // das ⌘K dort ebenfalls aufgezogen hatte. Ohne Klick — nur `blur()` — steht
  // im Test, was der Nutzer sieht; darum prüft er jetzt zusätzlich, dass das
  // Header-Dropdown ZU bleibt (deklarierte Verhaltensänderung, PR #537).
  const headerFeld = (page: Page) =>
    page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })
  // Das Dropdown der globalen Suche — Treffer UND Leerzustand rendern beide eine
  // `.lc-card` innerhalb `[role="search"]`. Bewusst NICHT `aria-expanded`: das
  // steht bei leerem Feld auch dann auf `false`, wenn der Leerzustand sichtbar
  // aufgezogen ist, und der Test wäre grün, ohne etwas zu prüfen (§6.7).
  // §6.3-DEKLARATION (W2·24-R5-F1/D9, 6.9.2026): `.lc-card` → `.lc-suchpanel`
  // — dasselbe Element, neuer Klassenname (EINE Panel-Anatomie für Kopf und Hero).
  const headerDropdown = (page: Page) => page.locator('[role="search"] .lc-suchpanel')

  test('(d) ⌘K/Ctrl+K und «/» fokussieren das Feld — und NUR dieses', async ({ page }) => {
    test.slow()
    const fehler = await oeffneStPO(page)

    await page.keyboard.press('Control+k')
    await expect(suchFeld(page)).toBeFocused()
    await expect(headerDropdown(page)).toHaveCount(0)
    await expect(headerFeld(page)).not.toBeFocused()

    // Weg vom Feld, OHNE Klick (ein Klick auf den Body schlösse fremde Overlays
    // gleich mit): der Fokus fällt auf <body>, «/» ist dort ein Kürzel.
    await suchFeld(page).blur()
    await expect(suchFeld(page)).not.toBeFocused()
    await page.keyboard.press('/')
    await expect(suchFeld(page)).toBeFocused()
    await expect(headerDropdown(page)).toHaveCount(0)

    expect(fehler).toEqual([])
  })

  // ── §6.3-DEKLARATION (H2b, Ä19) · DIE PRÄMISSE DIESES FALLS IST WEG ────────
  // Bis H2 lautete er «⌘K bei ZUGEKLAPPTER Gliederungsspalte ZIEHT SIE AUF und
  // fokussiert», und er prüfte auf dem Weg dorthin `suchFeld → toHaveCount(0)`:
  // ohne Spalte gab es kein Feld im DOM. Genau das WAR der Ä19-Befund — in dieser
  // Lage (wie im Split und auf dem Handy) hatte der Leser keine erreichbare
  // Suche. Seit H2b trägt der klebende Kopf-Block die Such-Zone; das Feld ist
  // immer da, und ein «zieht die Spalte auf» hätte keinen Gegenstand mehr.
  //
  // WAS DER FALL WEITERHIN PRÜFT (seine Sache, unverändert): ⌘K erreicht das Feld
  // des Lesers, und die globale Header-Suche kommt nicht dazwischen (Bug-Check
  // B1 — zwei Empfänger für eine Absicht). NEU HINZU, und das ist eine
  // VERSCHÄRFUNG: das Kürzel darf die Spalte NICHT mehr aufziehen. Täte es das,
  // wanderte das Feld beim Tastendruck aus dem Kopf in die eben geöffnete Spalte,
  // der nachgereichte Fokus träfe ein Element mitten im Austausch, und der Nutzer
  // bekäme einen Layout-Sprung für eine Taste, die nur fokussieren soll.
  test('(e) ⌘K bei zugeklappter Gliederung fokussiert das Feld — ohne die Spalte aufzuziehen', async ({ page }) => {
    test.slow()
    const fehler = await oeffneStPO(page)

    await page.locator('[data-v3-gliederung-zu]').click()
    await expect(page.locator('[data-v3-aside]')).toHaveCount(0)
    // Ä19: das Feld ist trotzdem da — und zwar im klebenden Kopf-Block.
    await expect(suchFeld(page)).toHaveCount(1)
    expect(await suchFeld(page).evaluate((el) => !!el.closest('[data-v3-kopf]')),
      'ohne Spalte muss das Feld im Kopf-Block stehen (Ä19)').toBe(true)

    await page.keyboard.press('Control+k')
    await expect(suchFeld(page)).toBeFocused()
    // Die Spalte bleibt zu: kein Sprung, kein Umzug des fokussierten Feldes.
    await expect(page.locator('[data-v3-aside]'), '⌘K hat die Gliederungsspalte aufgezogen').toHaveCount(0)
    await expect(headerDropdown(page)).toHaveCount(0)
    await expect(headerFeld(page)).not.toBeFocused()

    expect(fehler).toEqual([])
  })
})
