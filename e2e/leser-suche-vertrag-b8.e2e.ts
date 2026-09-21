import { LESER_SUCHFELD_NAME } from './helpers/leserBeschriftung';
// @shard-gruppe: 6
// W2·19-S8 · Bug-Check §9 — Tore für den §4.4-Vertrag «gemalte ≤ gezählte» (B8).
//
// ─── DIE LÜCKE, DIE DIESE DATEI SCHLIESST ────────────────────────────────────
// Der bestehende e2e-Wächter (leser-r1-r2.e2e.ts) prüft den Vertrag am BGFA mit
// dem Begriff «Berufsregeln». Das ist ein reiner Wortlaut-Treffer in einem
// Erlass ohne Beträge und ohne aufgehobene Bestimmungen — er kann die beiden
// Klassen, an denen der Vertrag wirklich brach, STRUKTURELL nicht treffen:
//   B1 — Beträge: gespeichert «16 800», gemalt «16'800», getippt beliebig.
//   B2 — «aufgehoben»: ein Ersatztext, den nur die Anzeige kennt.
// Zusätzlich fehlte eine Assertion, dass ein «weiter»-Schritt auf einer wirklich
// GEMALTEN Stelle landet (die vorhandene Blink-Prüfung ist quasi unfehlbar: der
// Puls sitzt am Artikel, nicht an der Fundstelle).
//
// ─── WIE HIER GEMESSEN WIRD ──────────────────────────────────────────────────
// Der Vertrag ist eine Aussage über EINEN Artikel: die Liste nennt je Artikel
// ihre Fundstellenzahl (`data-fundstellen-zahl`), und im Artikel liegen n
// gemalte Ranges. Global lässt sich das nicht messen — gemalt wird
// absichtsvoll nur im Sichtband (IntersectionObserver, §4.5), «gemalt < gezählt»
// wäre also überall trivial erfüllt. Darum wird der Artikel erst ins Sichtfeld
// geholt und dann verglichen.
//
// ROT VOR DEN FIXEN (gemessen 9.8.2026, vite preview aus dist):
//   B1 — «16'800» meldete 0 Artikel, während im Wortlaut die Stelle leuchtete.
//   B2 — «aufgehoben» malte Stellen, die kein Zähler kannte.
// Beide Klassen sind hier als Eigenschaft formuliert, nicht als Zahl: der Test
// überlebt jede Korpus-Regeneration.
import { test, expect, type Page } from '@playwright/test'

// ── Ä103 (18.8.2026) · DER ZÄHLER NENNT SEINE EINHEIT ───────────────────────
// V3 schreibt seit der Säuberung «Fundstelle 3 von 17», die Ist-Hülle weiter
// «3/17»; vor dem ersten Sprung stand dort «–/17» — ein Bruch ohne Zähler.
// Die Sonden prüfen darum die ZAHLEN, nicht das Trennzeichen: `laufendeStelle`
// zieht die erste Zahl heraus (ohne zweite Zahl = «–», also 0). Die
// Prüfaussage ist unverändert (§6.3-Deklaration).
async function laufendeStelle(page: import('@playwright/test').Page): Promise<number> {
  const t = await page.locator('[data-treffer-position]').innerText()
  const zahlen = t.match(/\d+/g)?.map(Number) ?? []
  return zahlen.length >= 2 ? zahlen[0] : 0
}

test.describe.configure({ timeout: 120_000 })

const inGesetzSuche = (page: Page) => page.getByRole('searchbox', { name: LESER_SUCHFELD_NAME })

async function oeffne(page: Page, pfad: string): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(pfad)
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 })
  await page.locator('[data-sek]').first().waitFor({ timeout: 20_000 })
}

/** Zahl der GEMALTEN Stellen innerhalb von `#art-<token>`. */
async function gemalt(page: Page, token: string): Promise<number> {
  return page.evaluate((tok) => {
    const art = document.getElementById(`art-${tok}`)
    if (!art) return -1
    const reg = (globalThis as unknown as {
      CSS?: { highlights?: Map<string, Iterable<Range>> }
    }).CSS?.highlights
    const hl = reg?.get('lc-such-treffer')
    if (!hl) return 0
    let n = 0
    for (const r of hl) {
      const k = r.startContainer
      const el = k.nodeType === 1 ? (k as Element) : k.parentElement
      if (el && art.contains(el)) n++
    }
    return n
  }, token)
}

/** Erster Treffer der Liste: Token + die GEZÄHLTE Fundstellenzahl. */
async function ersterTreffer(page: Page): Promise<{ token: string; gezaehlt: number }> {
  const zeile = page.locator('[data-treffer-artikel]').first()
  await expect(zeile).toBeVisible({ timeout: 20_000 })
  return {
    token: (await zeile.getAttribute('data-treffer-artikel')) ?? '',
    gezaehlt: Number(await zeile.getAttribute('data-fundstellen-zahl')),
  }
}

/** Suche stellen und den ersten Treffer ins Sichtfeld holen. */
async function sucheUndZeige(page: Page, begriff: string): Promise<{ token: string; gezaehlt: number }> {
  await inGesetzSuche(page).fill(begriff)
  await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 20_000 })
  const t = await ersterTreffer(page)
  await page.locator(`#art-${t.token}`).scrollIntoViewIfNeeded()
  return t
}

test.describe('B8 — der §4.4-Vertrag an den Klassen, die ihn wirklich brachen', () => {
  test('B1 — ein Betrag wird in JEDER Schreibweise gleich gezählt und gemalt (AHVV)', async ({ page }) => {
    await oeffne(page, '/gesetze/bund/AHVV')

    // Die drei Schreibweisen derselben Zahl müssen dieselbe Liste ergeben.
    //
    // ZWISCHEN DEN ANFRAGEN WIRD GELEERT und auf das Verschwinden der Liste
    // gewartet. Ohne das las der Fall die Liste der VORIGEN Anfrage (die Suche
    // ist entprellt) — er wäre grün gewesen, ohne etwas zu prüfen, und genau
    // das ist die Bauart, vor der §6.7 warnt. Aufgefallen ist es, weil der Fall
    // die Rot-Probe gegen den sabotierten Stand überlebte.
    const signaturen: string[] = []
    for (const begriff of ['16 800', "16'800", '16800']) {
      await inGesetzSuche(page).fill('')
      await expect(page.locator('[data-treffer-liste]')).toHaveCount(0, { timeout: 20_000 })
      await inGesetzSuche(page).fill(begriff)
      await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 20_000 })
      signaturen.push(await page.evaluate(() =>
        [...document.querySelectorAll('[data-treffer-artikel]')]
          .map((el) => `${el.getAttribute('data-treffer-artikel')}:${el.getAttribute('data-fundstellen-zahl')}`)
          .join('|')))
    }
    expect(signaturen[0], 'Testfall trägt nicht — AHVV kennt «16 800» nicht mehr').not.toBe('')
    expect(signaturen[1], `Apostroph-Schreibweise weicht ab: ${signaturen.join('  ≠  ')}`).toBe(signaturen[0])
    expect(signaturen[2], `blanke Schreibweise weicht ab: ${signaturen.join('  ≠  ')}`).toBe(signaturen[0])

    // Und im Wortlaut leuchtet es auch — mit dem Apostroph als Anfrage, also
    // genau in der Kombination, die vor dem Fix nichts fand.
    const t = await sucheUndZeige(page, "16'800")
    await expect.poll(async () => gemalt(page, t.token), { timeout: 20_000 }).toBeGreaterThan(0)
    expect(await gemalt(page, t.token), 'gemalte ≤ gezählte').toBeLessThanOrEqual(t.gezaehlt)
  })

  test('B2 — «aufgehoben» malt nie mehr, als gezählt ist (AHVV)', async ({ page }) => {
    await oeffne(page, '/gesetze/bund/AHVV')
    const t = await sucheUndZeige(page, 'aufgehoben')
    expect(t.token, 'Testfall trägt nicht — kein Treffer für «aufgehoben»').not.toBe('')
    // Der Ersatztext der aufgehobenen Bestimmung trägt seit B2 `data-such-meta`
    // und wird vom Walker übersprungen; vor dem Fix malte er mit, ohne je
    // gezählt zu sein.
    await page.waitForTimeout(800)
    expect(await gemalt(page, t.token), 'gemalte ≤ gezählte').toBeLessThanOrEqual(t.gezaehlt)
  })

  test('Ziffern-Begriff: der Marker-Ausschluss hält (BGFA, «2»)', async ({ page }) => {
    await oeffne(page, '/gesetze/bund/BGFA')
    const t = await sucheUndZeige(page, '2')
    await page.waitForTimeout(800)
    // Fussnoten-MARKER tragen dieselbe Ziffer noch einmal, sind aber kein
    // Wortlaut (FN_MARKER-Ausschluss). Ohne ihn riss genau diese Suche den
    // Vertrag (gemessen: 130 gemalt gegen 124 gezählt).
    expect(await gemalt(page, t.token), 'gemalte ≤ gezählte').toBeLessThanOrEqual(t.gezaehlt)
  })

  // ── B10: die Liste ist gedeckelt, die Zählung nicht ──────────────────────
  // «der» im OR ergab 1146 Zeilen und ~16'700 DOM-Knoten in demselben Scroller,
  // in dem S1–S7 den Gliederungsbaum gerade auf ~1'300 gedrückt hatten. Gemalt
  // werden jetzt 200 Zeilen; der Rest kommt auf Knopfdruck. Was NICHT gedeckelt
  // ist: der Kopf-Zähler und die ↑↓-Folge — sonst verschwände Information (§8).
  test('B10 — die Trefferliste ist gedeckelt, Zähler und Navigation nicht (OR)', async ({ page }) => {
    await oeffne(page, '/gesetze/bund/OR')
    await inGesetzSuche(page).fill('der')
    await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 20_000 })

    const gezeigt = await page.locator('[data-treffer-artikel]').count()
    expect(gezeigt, 'Liste ungedeckelt gemalt').toBeLessThanOrEqual(200)

    // Der KOPF nennt weiterhin die volle Menge — der Deckel ist eine Frage der
    // Anzeige, nicht der Suche.
    const kopf = await page.locator('[data-treffer-leiste]').innerText()
    const artikel = Number(kopf.match(/(\d+)\s+Artikel/)?.[1] ?? -1)
    expect(artikel, `Kopf-Zähler: ${kopf}`).toBeGreaterThan(gezeigt)

    // Und der Knopf sagt ehrlich, wie viele noch kommen, und holt sie.
    const mehr = page.locator('[data-treffer-mehr]')
    await expect(mehr).toBeVisible()
    await expect(mehr).toContainText(String(artikel - gezeigt))
    await mehr.click()
    await expect.poll(async () => page.locator('[data-treffer-artikel]').count(), { timeout: 20_000 })
      .toBeGreaterThan(gezeigt)
  })

  test('Ein «weiter»-Schritt landet auf einer wirklich gemalten Stelle', async ({ page }) => {
    await oeffne(page, '/gesetze/bund/BGFA')
    await inGesetzSuche(page).fill('Berufsregeln')
    await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 20_000 })
    const vor = page.locator('[data-treffer-vor]')
    await expect(vor).toBeVisible({ timeout: 20_000 })
    await vor.click()
    await expect.poll(() => laufendeStelle(page), { timeout: 20_000 }).toBe(1)

    // Der aktive Eintrag benennt den Artikel; dort MUSS jetzt eine gemalte
    // Stelle liegen — sonst hat der Sprung ein Ziel behauptet, das es nicht
    // gibt (§8). Die bisherige Blink-Prüfung konnte das nicht sehen: der Puls
    // sitzt am Artikel, unabhängig von jeder Markierung.
    const aktiv = page.locator('[data-treffer-artikel] [data-treffer-aktiv]').first()
    await expect(aktiv).toBeVisible({ timeout: 20_000 })
    const token = await aktiv.evaluate((el) =>
      el.closest('[data-treffer-artikel]')?.getAttribute('data-treffer-artikel') ?? '')
    expect(token).not.toBe('')
    await expect.poll(async () => gemalt(page, token), { timeout: 20_000 }).toBeGreaterThan(0)
  })
})
