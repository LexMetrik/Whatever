// @shard-gruppe: 7
//
// ── D21/D25 · DIE INHALTSSPALTE SPRINGT BEIM ROUTENWECHSEL NICHT ────────────
//
// ANLASS (David 6.9.2026, Dev-Server 84eea666e): «wenn man bspw. auf
// rechtsprechung klickt verschiebt sich alles». Die Diagnose vom selben Tag hat
// die Ursache benannt: die Seitenleiste stand auf «/» nicht, auf den
// Rubrikseiten schon — beim ersten Klick wanderte die Inhaltsspalte darum um die
// volle Leistenbreite nach rechts. D17 hat das behoben (Leiste überall), D25
// setzt darauf auf (Leiste überall EINGEKLAPPT starten). Beide Entscheide teilen
// dieselbe Zusage, und die hatte bis hierher keinen Wächter:
//
//   Die linke Kante und die Breite von `main#inhalt` sind über einen
//   Routenwechsel hinweg IDENTISCH — Δ = 0, nicht «klein».
//
// Δ = 0 statt einer Toleranz ist hier richtig und nicht pedantisch: es gibt
// keinen physikalischen Grund, warum ein Routenwechsel den Satzspiegel um auch
// nur einen Subpixel verschieben dürfte. Wer die Leiste bewusst route-abhängig
// macht, soll hier scheitern — genau das war der Defekt.
//
// ROT ZU BEKOMMEN (§6.7 — einmal gezeigt, 6.9.2026): in
// `src/components/layout/useSeitenleiste.ts` `VORGABE_EINGEKLAPPT` auf `false`
// setzen UND in `Shell.tsx` die Leiste wieder von «/» ausnehmen
// (`{!seitenleiste.eingeklappt && pathname !== '/' && (…)}` — der D17-Stand
// davor). GEMESSEN mit genau dieser Rückbau-Sonde @1440, gebautes dist/:
//   Fall 1 rot — «Kante wandert beim Wechsel / → /rechtsprechung: 0 → 256»
//   Fall 2 rot — die Leiste ist auf «/» gar nicht da, die Gegenprobe scheitert
//                schon am Schalter
// Ohne die Sonde sind beide grün (Δ = 0). Der Rückbau ist danach wieder
// entfernt; der Wächter läuft gegen den D25-Stand.
//
// GEGENPROBE IM TEST SELBST: der zweite Fall blendet die Leiste per Schalter EIN
// und misst denselben Wechsel noch einmal. Auch mit stehender Leiste ist Δ = 0 —
// sonst wäre der erste Fall nur deshalb grün, weil gerade nirgends eine Leiste
// steht, und der Wächter würde die eigentliche Gefahr (route-abhängige Leiste)
// gar nicht mehr sehen können.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { seitenleisteOeffnen } from './helpers/seitenleiste'

/** Kante und Breite des Sidebar-Nachbarn — auf ganze Pixel gerundet gemessen
 *  wird NICHT: eine Rundung würde genau die Subpixel-Drift verstecken, die ein
 *  halb gerenderter Rahmen erzeugt. */
async function spalte(page: Page): Promise<{ x: number; breite: number }> {
  const box = (await page.locator('main#inhalt').boundingBox())!
  return { x: box.x, breite: box.width }
}

// Die Wege, die David beschrieben hat — als SPA-Kette aus EINEM Laden heraus.
// Bewusst kein `page.goto` zwischendurch: ein Neuladen verdeckt genau den
// Sprung, um den es geht (das Dokument wird neu aufgebaut, es gibt kein
// Vorher-Nachher im selben Layout). Angeklickt werden die Bereichs-Kacheln der
// Startseite; sie sind mit eingeklappter Leiste der einzige Klick-Weg zwischen
// den Rubriken, und genau auf ihnen ist David der Sprung aufgefallen.
const rubrikLink = (page: Page, pfad: string) => page.locator(`a[href="${pfad}"]`).first()

test.describe('D21 · Kein Layoutsprung beim Routenwechsel', () => {
  test('Sidebar-Nachbar: Kante und Breite bleiben über den Routenwechsel identisch', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(page.locator('header.sticky')).toBeVisible({ timeout: 20_000 })

    const anfang = await spalte(page)
    const messe = async (was: string) => {
      await expect(page.locator('h1')).toBeVisible({ timeout: 20_000 })
      const jetzt = await spalte(page)
      expect(jetzt.x, `Kante wandert ${was}: ${anfang.x} → ${jetzt.x}`).toBe(anfang.x)
      expect(jetzt.breite, `Breite springt ${was}: ${anfang.breite} → ${jetzt.breite}`).toBe(anfang.breite)
    }

    await rubrikLink(page, '/rechtsprechung').click()
    await expect(page).toHaveURL(/\/rechtsprechung$/)
    await messe('beim Wechsel / → /rechtsprechung')

    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await messe('beim Zurückgehen /rechtsprechung → /')

    await rubrikLink(page, '/gesetze').click()
    await expect(page).toHaveURL(/\/gesetze$/)
    await messe('beim Wechsel / → /gesetze')

    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('Gegenprobe mit STEHENDER Leiste: derselbe Wechsel, ebenfalls Δ = 0', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const leiste = await seitenleisteOeffnen(page)
    const leistenBreite = (await leiste.boundingBox())!.width
    expect(leistenBreite, 'Leiste steht nicht — die Gegenprobe wäre ein Nulltest (§6.7)').toBeGreaterThan(100)

    const vor = await spalte(page)
    await page.getByRole('link', { name: 'Rechtsprechung', exact: true }).first().click()
    await expect(page).toHaveURL(/\/rechtsprechung/)
    await expect(page.locator('h1')).toBeVisible({ timeout: 20_000 })
    // Die Leiste steht nach dem Wechsel immer noch (Nutzerwahl gilt überall) …
    await expect(leiste).toBeVisible()
    // … und die Inhaltsspalte hat sich um keinen Pixel bewegt.
    const nachher = await spalte(page)
    expect(nachher.x, `Kante wandert mit stehender Leiste: ${vor.x} → ${nachher.x}`).toBe(vor.x)
    expect(nachher.breite, `Breite springt mit stehender Leiste: ${vor.breite} → ${nachher.breite}`).toBe(vor.breite)

    expect(fehler, fehler.join('\n')).toEqual([])
  })

  // ── D21-NEBENFUND · «Fusszeile flackert beim Routenwechsel» ────────────────
  //
  // David 6.9.2026. Der Fuss folgt der Inhaltsspalte im Fluss; solange eine Route
  // ihre eigenen Daten nachlädt und dabei nur einen kurzen Ladeblock rendert,
  // rutscht er ins Bild und beim Eintreffen der Daten wieder hinaus. Über eine
  // schnelle Leitung dauert das ~100 ms — sichtbar, aber zu kurz, um es ohne
  // Drosselung messen zu können. Darum wird hier GEDROSSELT gemessen (400 kbit/s,
  // 150 ms): dieselbe Mechanik, nur langsam genug für eine belastbare Zahl.
  //
  // ROT ZU BEKOMMEN (§6.7 — einmal gezeigt, 6.9.2026): in
  // `src/pages/Rechtsprechung.tsx` die Höhenreservierung des Ladezustands
  // (`pk('min-h-screen', 'min-h-[24rem]')`) wieder entfernen. GEMESSEN mit genau
  // diesem Rückbau: CLS 0.3070 / 0.3070 / 0.3070 (3 Läufe), einziger Shift die
  // Quelle FOOTER von y=564 nach unten. Mit Reservierung: 0.0000 in 3 Läufen.
  test('D21-Nebenfund · der Seitenfuss flackert beim Routenwechsel nicht', async ({ page }) => {
    test.slow()
    await page.setViewportSize({ width: 1440, height: 900 })
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 150, downloadThroughput: 400 * 1024, uploadThroughput: 400 * 1024,
    })
    await page.goto('/gesetze')
    await seitenleisteOeffnen(page)
    // Messfenster erst JETZT öffnen: der Aufbau von /gesetze ist nicht das
    // Prüfobjekt, der Wechsel ist es.
    await page.evaluate(() => {
      const w = window as unknown as { __cls: number; __quellen: string[] }
      w.__cls = 0
      w.__quellen = []
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as unknown as {
          value: number; hadRecentInput: boolean; startTime: number
          sources?: { node?: { tagName?: string } | null }[]
        }[]) {
          if (e.hadRecentInput) continue
          w.__cls += e.value
          w.__quellen.push(`${e.value.toFixed(4)}@${Math.round(e.startTime)}ms ${(e.sources ?? []).map((s) => s.node?.tagName ?? '?').join(',')}`)
        }
      }).observe({ type: 'layout-shift', buffered: false })
    })
    await page.locator('a[href="/rechtsprechung"]').first().click()
    await expect(page).toHaveURL(/\/rechtsprechung$/)
    // Warten, bis die Sammlung wirklich da ist — sonst misst der Fall den
    // Ladezustand statt den Übergang.
    await expect(page.locator('[data-erw-rail], main a[href^="/rechtsprechung/"]').first())
      .toBeVisible({ timeout: 30_000 })
    await page.waitForTimeout(1500)
    const { cls, quellen } = await page.evaluate(() => {
      const w = window as unknown as { __cls: number; __quellen: string[] }
      return { cls: w.__cls, quellen: w.__quellen }
    })
    // Latte 0.01: der reparierte Fall misst 0.0000, der defekte 0.3070 — die
    // Latte liegt dazwischen und lässt Subpixel-Rauschen durch, nicht den Sprung
    // einer ganzen Fusszeile.
    expect(cls, `Fuss-Sprung beim Routenwechsel: CLS ${cls} — ${quellen.join(' | ')}`).toBeLessThanOrEqual(0.01)
  })

  test('D25 · Prerender liefert die volle Breite ab dem ersten Frame (kein Nachrutschen)', async ({ page }) => {
    // Die Vorgabe «eingeklappt» muss schon im ausgelieferten HTML stehen, sonst
    // rutscht die Inhaltsspalte nach der Hydration auf die volle Breite — ein
    // Sprung, den kein Nutzer verursacht hat.
    await page.setViewportSize({ width: 1440, height: 900 })
    // Mit JavaScript zuerst, damit die Basis-Adresse feststeht (der eigene
    // Kontext unten erbt sie nicht).
    await page.goto('/')
    await expect(page.locator('header.sticky')).toBeVisible({ timeout: 20_000 })
    const basis = new URL('/', page.url()).toString()
    // JavaScript aus: was hier steht, ist exakt das prerenderte Dokument.
    const ohneJs = await page.context().browser()!.newContext({
      viewport: { width: 1440, height: 900 }, javaScriptEnabled: false,
    })
    const roh = await ohneJs.newPage()
    await roh.goto(basis)
    await expect(roh.locator('aside[data-app-seitenleiste]')).toHaveCount(0)
    const rohBreite = (await roh.locator('main#inhalt').boundingBox())!.width
    await ohneJs.close()

    // Dieselbe Breite nach der Hydration — kein Nachrutschen.
    expect((await spalte(page)).breite, 'Inhaltsspalte rutscht nach der Hydration').toBe(rohBreite)
  })
})
