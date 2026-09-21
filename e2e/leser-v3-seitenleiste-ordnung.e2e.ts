// @shard-gruppe: 4
// FAHRPLAN-LESER-V3, Kap. 4b — feste Reihenfolge der Seitenleiste:
//
//   ▸ Übersicht  (SR 312.0 · 480 Art. · Stand …)        scrollt weg
//   Gliederung        [alles auf/zu]   [↑ Anfang]       ◀ ab hier sticky
//    1. Teil … / 1. Titel …
//
// ── DEKLARIERTE VERTRAGSÄNDERUNG D28 (David 6.9.2026) ───────────────────────
// «die suchleiste im gesetz, welche sich oben an der gliederung befindet, will
// ich oben am gesetz — dann verschiebt sie sich auch nicht, wenn gliederung
// eingeklappt ist.» Das FELD ist damit aus dieser Leiste heraus; es sitzt in
// jeder Lage im klebenden Kopf-Block des Lesers (`v3/SuchZone.tsx`). Der
// H2-Vertrag darunter bleibt inhaltlich stehen — er sagte «das Feld scrollt
// nicht weg», und das gilt jetzt strenger als zuvor: es steht ausserhalb dieser
// Leiste und ist auch dann da, wenn die Leiste gar nicht steht.
// Fall (a) prüft darum ab hier die Ordnung OHNE Feld und zusätzlich, dass die
// Leiste keines mehr trägt (Rot-Beweis: mit dem Vorzustand stand
// `[data-v3-leiste-feld]` im Sockel).
//
// ── DEKLARIERTE VERTRAGSÄNDERUNG H2 (David 16.8.2026) ───────────────────────
// Bis H1 lautete der Vertrag «Übersicht → Feld → Baumkopf», wobei das FELD ÜBER
// dem klebenden Block stand und mit der Übersichtsbox wegscrollte. Davids
// Befund am gebauten Stand: das Suchfeld muss zugreifbar bleiben, auch wenn man
// in der Gliederung scrollt — wer tief im Baum der StPO stand, musste erst die
// Leiste hochscrollen, um zu suchen.
//
// NEU: das Feld ist Teil des KLEBENDEN Blocks und steht dort ZUOBERST. Damit
// ist es nicht mehr ein Geschwister VOR dem Block, sondern sein erstes Kind —
// `compareDocumentPosition(feld, baumkopf)` meldet darum «enthält», nicht
// «folgt». Genau daran fiel Fall (a) in seiner alten Fassung, und zwar zu
// Recht: er beschrieb eine Ordnung, die es nicht mehr gibt.
// Der Vitest-Zwilling dieses Vertrags steht in
// `src/tests/leser-v3-bauteile.test.tsx` («Übersicht → [Feld → Baumkopf]
// klebend → Baum → Extra») und ist bereits neu gefasst; diese Spec zieht nach
// und ergänzt, was nur der Browser sagen kann: dass der Block wirklich klebt.
// Nach §6.3 eine fachliche Änderung mit eigener Begründung, kein stillschweigend
// nachgezogener Test.
//
// `LeserSeitenleiste.tsx` ist reine Anordnung (§3): Übersicht, Feld und Baum
// kommen fertig herein, die Datei kennt weder Erlass noch Suchzustand.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

async function oeffneBGFA(page: Page): Promise<string[]> {
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/BGFA')
  await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
  await expect(page.locator('[data-v3-aside]')).toBeVisible({ timeout: 20_000 })
  return fehler
}

test.describe('Kap. 4b — feste Reihenfolge der Seitenleiste', () => {
  test('(a) Übersicht scrollt weg, der Gliederungs-Block klebt — und trägt KEIN Feld (D28)', async ({ page }) => {
    const fehler = await oeffneBGFA(page)

    const befund = await page.evaluate(() => {
      const uebersicht = document.querySelector('[data-v3-leiste-uebersicht]')
      const baumkopf = document.querySelector('[data-v3-leiste-baumkopf]')
      const alle = document.querySelector('[data-v3-alle]')
      const baum = document.querySelector('[data-v3-leiste-baum]')
      const leiste = document.querySelector('[data-v3-leiste]')
      if (!uebersicht || !baumkopf || !alle || !baum || !leiste) {
        return {
          fehlend: { uebersicht: !uebersicht, baumkopf: !baumkopf, alle: !alle, baum: !baum, leiste: !leiste },
        }
      }
      // Node.compareDocumentPosition: Bit 4 (DOCUMENT_POSITION_FOLLOWING) gesetzt
      // ⇒ das zweite Argument steht NACH dem Aufrufer im Dokument.
      const FOLGT = Node.DOCUMENT_POSITION_FOLLOWING
      return {
        fehlend: null,
        uebersichtVorBlock: !!(uebersicht.compareDocumentPosition(baumkopf) & FOLGT),
        // D28: die GANZE Leiste trägt kein Such-/Sprungfeld mehr — weder im
        // klebenden Sockel noch sonstwo. Das ist der Kern der Änderung.
        feldInDerLeiste: !!leiste.querySelector('[data-v3-leiste-feld], [data-v3-suchsprung]'),
        // Die Übersicht bleibt ausserhalb — sie ist Ankunfts-Information, kein
        // Werkzeug, und darf wegscrollen.
        uebersichtNichtImBlock: !baumkopf.contains(uebersicht),
        alleImBlock: baumkopf.contains(alle),
        blockVorBaum: !!(baumkopf.compareDocumentPosition(baum) & FOLGT),
        // Nur der Browser kann sagen, ob der Block wirklich klebt — das ist der
        // Mehrwert dieser Spec gegenüber dem Vitest-Zwilling.
        position: getComputedStyle(baumkopf).position,
      }
    })

    expect(befund.fehlend, `Anker fehlen im DOM: ${JSON.stringify(befund.fehlend)}`).toBeNull()
    expect(befund.uebersichtVorBlock, 'Übersicht steht nicht vor dem klebenden Block').toBe(true)
    expect(befund.feldInDerLeiste, 'die Gliederung trägt wieder ein Suchfeld — D28: es gehört in den Leser-Kopf').toBe(false)
    expect(befund.uebersichtNichtImBlock, 'Übersicht ist in den klebenden Block gerutscht und scrollt nicht mehr weg').toBe(true)
    expect(befund.alleImBlock, '«alles auf/zu» steht nicht im klebenden Block').toBe(true)
    expect(befund.blockVorBaum, 'klebender Block steht nicht vor dem Baum').toBe(true)
    expect(befund.position, 'der Gliederungs-Block klebt nicht').toBe('sticky')

    expect(fehler).toEqual([])
  })

  test('(b) die Übersicht scrollt weg, der Baum-Kopf klebt (sticky) — OR, dessen Leisteninhalt die Spalte übersteigt', async ({ page }) => {
    // WAR EIN PRODUKTFEHLER, BEHOBEN AM 16.8.2026 (H1) — der Fall stand bis
    // dahin auf `fixme`, weil ihn die Test-Etappe zwar fand, aber nicht fixen
    // durfte. Wurzel: `[data-v3-aside]` trug eine `max-height`, das Kind
    // (`[data-v3-leiste]` → `[data-v3-leiste-scroller]`) aber `h-full` — und
    // `height:100%` löst nach CSS-Spec gegen eine MAXIMALhöhe nicht auf. Der
    // Scroller wuchs darum auf die volle Inhaltshöhe (`scrollHeight ===
    // clientHeight`, gemessen an OR@1440×900: 1082 === 1082 bei 712 px
    // Spaltenhöhe) und hatte nichts zu scrollen; der Überschuss wurde vom
    // `overflow-hidden` STUMM abgeschnitten statt über die Leiste erreichbar zu
    // sein. Fix: dieselbe Flex-Anatomie wie die Ist-Spalte (`flex flex-col` +
    // `maxHeight` am Aside, `flex-1 min-h-0` am Scroller) — nachgemessen
    // scrollHeight 1082 / clientHeight 692.
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/OR')
    await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-v3-aside]')).toBeVisible({ timeout: 20_000 })

    const uebersicht = page.locator('[data-v3-uebersicht]')
    const baumkopf = page.locator('[data-v3-leiste-baumkopf]')
    await expect(uebersicht).toBeInViewport()
    await expect(baumkopf).toBeInViewport()

    const scroller = page.locator('[data-v3-leiste-scroller]')
    await scroller.evaluate((el) => { el.scrollTop = el.scrollHeight })
    await page.waitForTimeout(200)

    await expect(uebersicht).not.toBeInViewport()
    await expect(baumkopf).toBeInViewport()

    expect(fehler).toEqual([])
  })

  test('(c) «alles auf» klappt alle Gliederungsstufen auf und wird zu «alles zu» (OR, zunächst zugeklappt)', async ({ page }) => {
    test.slow() // schwerer Erlass (OR) nötig, damit der Baum überhaupt zu startet
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/OR')
    await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-v3-aside]')).toBeVisible({ timeout: 20_000 })
    const alleKnopf = page.locator('[data-v3-alle]')
    await expect(alleKnopf).toBeVisible({ timeout: 20_000 })
    await expect(alleKnopf).toContainText('alles auf')

    const baum = page.locator('[data-v3-leiste-baum] li')
    await expect(baum.first()).toBeVisible({ timeout: 20_000 })
    const vorher = await baum.count()

    await alleKnopf.click()

    await expect(alleKnopf).toContainText('alles zu', { timeout: 15_000 })
    const nachher = await baum.count()
    expect(nachher, `Baumzeilen vorher ${vorher}, nachher ${nachher}`).toBeGreaterThan(vorher)

    expect(fehler).toEqual([])
  })

  test('(d) «↑ Anfang» scrollt das Fenster auf 0', async ({ page }) => {
    const fehler = await oeffneBGFA(page)

    await page.evaluate(() => window.scrollTo(0, 1200))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500)

    await page.locator('[data-v3-anfang]').click()

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)

    expect(fehler).toEqual([])
  })
})
