import { LESER_SUCHFELD_NAME } from './helpers/leserBeschriftung';
// @shard-gruppe: 4
// W2·19-S8 · Bug-Check §9 — Suche × Klapp-Zustand der Lesespalte (B3 + B4).
//
// ─── WAS HIER SCHIEFGING ─────────────────────────────────────────────────────
// Seit S8 bleibt die Lesespalte bei aktiver Suche vollständig — aber sie bleibt
// auch KLAPPBAR. Ein Treffer kann darum in einer zugeklappten Sektion liegen,
// und dann ist sein Artikel schlicht nicht im DOM. Zwei Defekte folgten daraus:
//
//   B3 (hoch) — `zeigeFundstelle` stieg beim fehlenden Artikel VOR `setNav` aus
//     (inhalt-suchtreffer.tsx). Der Klick auf den Treffer tat nichts: kein
//     Scroll, keine Öffnung, keine Meldung (§8). Schwerer wog die Folge für ↑↓:
//     weil `nav.pos` nie fortschrieb, berechnete jeder weitere Tastendruck
//     dieselbe Position — die Navigation blieb an dieser Stelle stehen. Der
//     Sprungpfad hatte damit weniger Kraft als der Artikel-Sprung
//     (`springeZuArtikel`, inhalt.tsx), der die Vorfahren-Sektion seit je öffnet.
//   B4 (mittel) — der IntersectionObserver, der die Markierungen artikelweise
//     malt, hatte `offen` nicht in seinen Deps. Artikel, die erst NACH dem
//     Effekt-Lauf ins DOM kamen (weil eine Sektion aufging), wurden nie
//     beobachtet und blieben unmarkiert. Der Scroll-Spy macht es vor
//     (inhalt-hooks.tsx, `offen` steht dort mit Begründung in der Dep-Liste).
//
// Beide haben dieselbe Wurzel — Klapp-Zustand × Suche — und werden zusammen
// bewacht. Der B4-Fall geht bewusst NICHT über den Treffer-Klick: der malt sein
// Sprungziel ausdrücklich selbst (§4.5) und verdeckte den Observer-Defekt. Er
// öffnet die Sektion über ihren eigenen Kopf — der Weg, auf dem allein der
// Observer zuständig ist.
//
// Leichter Erlass (BGFA, 40 Artikel): die Defekte sind strukturell, nicht
// mengenabhängig; ein OR-Lauf kostete nur Zeit und Flake-Risiko (§17-Lehre aus
// dem Flake-Herd, Kopf von leser-r1-r2.e2e.ts).
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
const BEGRIFF = 'Berufsregeln'

async function oeffneUndSuche(page: Page): Promise<string> {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/BGFA')
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 })
  // Auf die Gliederung warten (B9): der Index ist erst mit dem Struktur-Sidecar
  // vollständig — vorher misst der Fall eine halbe Datenlage.
  await page.locator('[data-sek]').first().waitFor({ timeout: 20_000 })
  await inGesetzSuche(page).fill(BEGRIFF)
  await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 20_000 })
  const ersteZeile = page.locator('[data-treffer-artikel]').first()
  await expect(ersteZeile).toBeVisible({ timeout: 20_000 })
  return (await ersteZeile.getAttribute('data-treffer-artikel')) ?? ''
}

/** Die Sektion, die `#art-<token>` enthält, im FLIESSTEXT auf-/zuklappen. */
async function schalteSektion(page: Page, token: string, offen: boolean): Promise<boolean> {
  return page.evaluate(({ tok, auf }) => {
    const merk = (window as unknown as { __sekId?: string })
    const art = document.getElementById(`art-${tok}`)
    const sek = art?.closest('section') ?? (merk.__sekId
      ? document.querySelector(`[data-sek="${merk.__sekId}"]`)?.closest('section')
      : null)
    const kopf = sek?.querySelector('[data-sek]')
    if (kopf) merk.__sekId = kopf.getAttribute('data-sek') ?? undefined
    const knopf = kopf?.querySelector<HTMLButtonElement>(`button[aria-expanded="${auf ? 'false' : 'true'}"]`)
    if (!knopf) return false
    knopf.click()
    return true
  }, { tok: token, auf: offen })
}

/** Liegt mindestens eine gemalte Fundstelle INNERHALB von `#art-<token>`? */
async function markiert(page: Page, token: string): Promise<boolean> {
  return page.evaluate((tok) => {
    const art = document.getElementById(`art-${tok}`)
    if (!art) return false
    const reg = (globalThis as unknown as {
      CSS?: { highlights?: Map<string, Iterable<Range>> }
    }).CSS?.highlights
    const hl = reg?.get('lc-such-treffer')
    if (!hl) return false
    for (const r of hl) {
      const k = r.startContainer
      const el = k.nodeType === 1 ? (k as Element) : k.parentElement
      if (el && art.contains(el)) return true
    }
    return false
  }, token)
}

test.describe('B3/B4 — Treffer in einer zugeklappten Sektion', () => {
  test('B3 — Klick auf den Treffer öffnet die Sektion und weist den Eintrag als aktiv aus', async ({ page }) => {
    const token = await oeffneUndSuche(page)
    expect(token, 'Testaufbau: kein Treffer gefunden').not.toBe('')
    expect(await schalteSektion(page, token, false), 'Testaufbau: Sektion liess sich nicht zuklappen').toBe(true)
    await expect(page.locator(`#art-${token}`)).toHaveCount(0)

    await page.locator(`[data-treffer-artikel="${token}"] button`).first().click()

    await expect(page.locator(`#art-${token}`)).toBeVisible({ timeout: 15_000 })
    // ── §6.3-NACHZUG D38 (7.9.2026) · DIE LISTE WIRD DAFÜR ZURÜCKGEHOLT ──────
    // Seit D38 liegt die Trefferliste ÜBER der Lesespalte und gibt sie beim
    // Sprung frei — sie bliebe sonst über genau dem Wortlaut stehen, in den der
    // Klick geführt hat. Die Aussage dieses Falls ist unverändert («der
    // Eintrag ist als aktiv ausgewiesen»); sie wird nur dort geprüft, wo die
    // Liste jetzt steht: nach einem Klick auf «Treffer anzeigen →».
    await page.locator('[data-v3-treffer-weg]').click()
    await expect(page.locator(`[data-treffer-artikel="${token}"] [data-treffer-aktiv]`)).toHaveCount(1)
  })

  test('B3 — «weiter» bleibt nicht hängen, wenn die erste Fundstelle zugeklappt ist', async ({ page }) => {
    const token = await oeffneUndSuche(page)
    expect(await schalteSektion(page, token, false)).toBe(true)

    const vor = page.locator('[data-treffer-vor]')
    await expect(page.locator('[data-treffer-position]')).toBeVisible({ timeout: 20_000 })
    await expect(vor).toBeVisible({ timeout: 15_000 })
    // Vor der ersten Navigation «–/n» (nichts Erfundenes, §8) — das ist auch der
    // Wert, auf dem der Defekt die Anzeige FESTHIELT.
    await expect.poll(() => laufendeStelle(page), { timeout: 20_000 }).toBe(0)

    const gesehen: string[] = []
    for (let i = 0; i < 3; i++) {
      await vor.click()
      await page.waitForTimeout(400)
      gesehen.push(((await page.locator('[data-treffer-position]').textContent()) ?? '').trim())
    }
    // Drei Schritte, drei verschiedene Positionen. Vor dem Fix stand hier
    // dreimal «–/n»: `setNav` lief nie, also berechnete jeder weitere Klick aus
    // derselben Ausgangslage dieselbe Zielposition.
    expect(new Set(gesehen).size, `Positionsanzeige nach drei «weiter»: ${gesehen.join(' | ')}`).toBe(3)
    // Ä103: der Zähler nennt seine Einheit («Fundstelle 1 von 17»), V1 weiter «1/17».
    expect(gesehen[0], 'erster Schritt landet auf Fundstelle 1').toMatch(/^(Fundstelle )?1[ /]/)
  })

  test('B4 — eine wieder aufgeklappte Sektion wird markiert (der Observer kennt den Klapp-Zustand)', async ({ page }) => {
    const token = await oeffneUndSuche(page)
    // VORBEDINGUNG: gemalt wird artikelweise und nur im (grosszügigen) Sichtband
    // — ohne dieses Heranscrollen prüfte der Fall nichts, weil auch der intakte
    // Reader einen weit entfernten Artikel bewusst nicht malt.
    await page.locator(`#art-${token}`).scrollIntoViewIfNeeded()
    await expect.poll(async () => markiert(page, token), { timeout: 20_000 }).toBe(true)

    expect(await schalteSektion(page, token, false)).toBe(true)
    await expect(page.locator(`#art-${token}`)).toHaveCount(0)
    // Über den SEKTIONSKOPF wieder öffnen — nicht über den Treffer-Klick, der
    // sein Ziel selbst malt und den Observer-Defekt verdecken würde.
    expect(await schalteSektion(page, token, true), 'Testaufbau: Sektion liess sich nicht wieder öffnen').toBe(true)
    await expect(page.locator(`#art-${token}`)).toBeVisible({ timeout: 15_000 })
    await page.locator(`#art-${token}`).scrollIntoViewIfNeeded()

    await expect.poll(async () => markiert(page, token), { timeout: 20_000 }).toBe(true)
  })
})
