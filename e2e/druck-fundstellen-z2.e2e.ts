// @shard-gruppe: 3
// ─── W2·10-UI-NAV-Z2 · Print-CSS für Fundstellen ───────────────────────────
//
// Reproduktion VOR dem Fix (§0.2 «erst reproduzieren, dann fixen»): der
// Druckstand vom 3.8.2026 blendete mit `@media print { header { display:none } }`
// nicht nur die Topbar aus, sondern AUCH den Erlass-/Entscheid-Kopf — also
// genau die Fundstelle: Titel, SR-Nummer, Stand-Zeile, Link auf die geltende
// Fassung und (§8) das Aufhebungs-Banner. Ein Ausdruck ohne Stand-Zeile ist
// als Aktenstück wertlos und im Aufhebungsfall irreführend.
//
// Diese Spec misst den echten `print`-Medienzustand (page.emulateMedia) im
// gebauten Stand — keine CSS-Textsuche, sondern computed styles am DOM.
import { test, expect } from '@playwright/test'
import { panelAufziehen } from './helpers/panelOeffnen';

const ERLASS = '/gesetze/bund/OR'

/** Sichtbar im Sinne des Druckers: kein display:none in der Vorfahrenkette. */
async function druckSichtbar(el: import('@playwright/test').Locator) {
  return el.evaluate((n) => {
    for (let k: Element | null = n; k; k = k.parentElement) {
      if (getComputedStyle(k).display === 'none') return false
    }
    return true
  })
}

test.describe('Z2 · Druck der Fundstelle', () => {
  test('Erlass-Kopf mit Titel, SR und Stand bleibt im Ausdruck', async ({ page }) => {
    await page.goto(ERLASS)
    const kopf = page.locator('main header').first()
    await expect(kopf).toBeVisible()
    await page.emulateMedia({ media: 'print' })

    expect(await druckSichtbar(kopf), 'Erlass-Kopf (Titel/SR/Stand) im Druck sichtbar').toBe(true)
    const text = await kopf.innerText()
    expect(text, 'Stand-Zeile steht im Ausdruck').toContain('Stand')
    expect(text, 'SR-Nummer steht im Ausdruck').toContain('SR')
  })

  test('Topbar-Chrome verschwindet im Ausdruck', async ({ page }) => {
    await page.goto(ERLASS)
    await page.emulateMedia({ media: 'print' })
    const topbar = page.locator('header.lc-glass')
    await expect(topbar).toHaveCount(1)
    expect(await druckSichtbar(topbar), 'sticky Topbar wird nicht mitgedruckt').toBe(false)
  })

  test('amtlicher Quell-Link druckt seine URL aus', async ({ page }) => {
    await page.goto(ERLASS)
    const link = page.locator('main header a[href^="http"]').first()
    await expect(link).toBeVisible()
    const href = await link.getAttribute('href')
    await page.emulateMedia({ media: 'print' })
    const nach = await link.evaluate((n) => getComputedStyle(n, '::after').content)
    expect(nach, `URL steht im Ausdruck (href ${href})`).toContain('http')
  })

  test('Leser-Spalten werden im Ausdruck nicht abgeschnitten', async ({ page }) => {
    test.slow() // OR-Volltext (1686 Artikel) — 3× Budget gegen CI-CPU-Starvation
    await page.goto(ERLASS)
    // `toBeAttached` statt `toBeVisible`: gemessen werden berechnete Stile, nicht
    // Sichtbarkeit — und der OR-Leser braucht unter Worker-Konkurrenz länger, bis
    // der Wrapper im Layout steht (Muster aus split-view-a34.e2e.ts).
    //
    // CI-Budget 90 s statt 30 s (QS-E2E-STABIL, Beleg 7.8.2026, Lauf 31204889639).
    // Das 30-s-Fenster war zu knapp bemessen und riss auf einem gestarveten
    // 2-vCPU-Runner: `.lc-leser` war nach 30 s noch nicht im DOM, die Seite stand
    // auf «Wird geladen …». Der Trace weist den Fehlschlag eindeutig als LADEZEIT
    // aus, nicht als Defekt — alle 36 Anfragen kamen mit 200 zurück, keine
    // Konsolen- oder Netzwerkfehler. Dass es lange dauert, ist auf dieser Seite
    // erklärbar: der OR-Leser zieht 1.9 MB OR-Volltext, 1.4 MB Struktur und
    // 9.5 MB `rechtsprechung/register.json`, die alle geparst sein wollen.
    // Eigene Messreihe auf 10-Kern-Maschine (je 3 Läufe): 1.0 s ungedrosselt,
    // 2.6 s bei 4×, 3.9 s bei 6× — der CI-Runner liegt also nochmals um ein
    // Vielfaches darunter, und ein Deckel bei 30 s misst dort die Maschine statt
    // die Sache (dieselbe Fehlerklasse wie der Standzeit-Deckel in
    // leser-ruecksprung-r5-r7, dort schon einmal als Messfehler erkannt).
    // Das ist ein ZEITBUDGET, keine Assertion (§6.3): geprüft wird unverändert,
    // dass kein Container clippt und kein Artikel via content-visibility
    // ungerendert bleibt. `test.slow()` gibt 270 s Gesamtbudget, 90 s passen hinein.
    // LOKAL bleiben 30 s — dort ist die Seite in ~1 s da, und ein weites Fenster
    // würde einen echten Ladefehler nur verzögert sichtbar machen.
    const ladeBudget = process.env.CI ? 90_000 : 30_000
    await expect(page.locator('.lc-leser')).toBeAttached({ timeout: ladeBudget })
    await expect(page.locator('#art-1')).toBeAttached({ timeout: ladeBudget })
    await page.emulateMedia({ media: 'print' })

    // (a) Scroll-Panes dürfen im Druck nicht clippen — sonst endet der Ausdruck
    //     nach dem sichtbaren Ausschnitt.
    const clippend = await page.evaluate(() =>
      [...document.querySelectorAll('main *')].filter((n) => {
        const s = getComputedStyle(n)
        return (
          (s.overflowY === 'auto' || s.overflowY === 'scroll' || s.overflowX === 'auto' || s.overflowX === 'scroll') &&
          n.scrollHeight > n.clientHeight + 2
        )
      }).length,
    )
    expect(clippend, 'kein scrollender Container schneidet Inhalt ab').toBe(0)

    // (b) content-visibility:auto überspringt Rendering ausserhalb des Viewports —
    //     im Druck muss der Artikeltext ausgeschrieben sein.
    const versteckt = await page.evaluate(() =>
      [...document.querySelectorAll('.nt-art-cv')].filter(
        (n) => getComputedStyle(n).contentVisibility === 'auto',
      ).length,
    )
    expect(versteckt, 'kein Artikel bleibt via content-visibility ungerendert').toBe(0)
  })

  // ── §9-Bug-Check M-3 (Wächter-Ehrlichkeit, §6.7) ────────────────────────
  // Der Test darüber öffnet gar keinen zweiten Pane — er kann seinen eigenen
  // Fall also nicht sehen. Im Split-View liegt die Höhenbegrenzung nämlich
  // NICHT am gemessenen Element, sondern am Multipane-Rahmen (`h-dvh` in
  // Shell.tsx) und am Pane-`<main>` selbst (`absolute inset-0 overflow-y-auto`,
  // das kein `main …`-Nachfahren-Selektor trifft). Ergebnis vor dem Fix: der
  // Ausdruck endet nach EINER Seite, während derselbe Erlass ohne Split über
  // hunderte Seiten läuft. Dieser Test öffnet den zweiten Pane real und misst.
  // «Split-View-Ausdruck bleibt nicht auf eine Seite zugeschnitten» GELÖSCHT
  // 21.8.2026 (H5) — brauchte als Einstieg das ⧉ an der Ist-Hüllen-Bezüge-
  // Zeile unter dem Artikel (mit Pos. 12 aufgegeben). V3-Deckung: der Fall
  // «V3: Split-View-Ausdruck …» weiter unten in dieser Datei.

  // ── §7b-Deckungslücke geschlossen (21.8.2026, Kontaktbogen H4 §7b Pos. 5) ──
  // Deckt den Test darüber für V3: derselbe Sachverhalt (Split-Ausdruck bleibt
  // nicht auf eine Seite geklemmt), anderer EINSTIEG — das ⧉ sitzt jetzt am
  // Panel-Chip (`KanteMitVorschau`, §7b Pos. 3), nicht mehr an der
  // Bezüge-Zeile. ROT GESEHEN (§6.7) VOR dem `PanelEntscheide.tsx`-Umbau: kein
  // ⧉-Knopf am Chip, `getByRole('button', {name:/nebeneinander öffnen/})`
  // fand nichts.
  test('V3: Split-View-Ausdruck bleibt nicht auf eine Seite zugeschnitten', async ({ page }) => {
    test.slow() // schwere Split-View-Interaktion (Panes + idle-Shards + Scroll)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/ZGB#art-684')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })

    // Referenz: derselbe Erlass OHNE Split — so hoch druckt er wirklich.
    await page.emulateMedia({ media: 'print' })
    const ohneSplit = await page.evaluate(() => document.documentElement.scrollHeight)
    expect(ohneSplit, 'Referenz: der Erlass ist vielseitig').toBeGreaterThan(20_000)
    await page.emulateMedia({ media: 'screen' })

    // ── §6.3-DEKLARATION (D35-F3, Entscheid David 7.9.2026) ──────────────────
    // ZURÜCK ZUM ANKER, bevor das Panel aufgezogen wird. Grund, gemessen
    // 7.9.2026 an ZGB #art-684: die Änderungs-Wahl dämpft am Bildschirm die
    // `kl:'A'`-Fussnoten, im DRUCK nie (ein Ausdruck ohne amtliche Fussnoten
    // wäre ein unvollständiges Dokument, §7/§8) — die Regel steht darum in
    // `@media screen`. `emulateMedia` schaltet das LIVE-Layout um, und der
    // Rundlauf screen→print→screen kostet dadurch Dokumenthöhe:
    //   vor print   y 352 277 · Höhe 571 855 · Panel-Zähler 3
    //   in  print   y 352 277 · Höhe 843 946 · Zähler 9
    //   nach print  y 351 993 · Höhe 571 948 · Zähler WEG
    // Die absolute Scrollposition zeigt danach auf einen anderen Artikel, der
    // Scroll-Spy findet dort keine Entscheide, und der Zähler verschwindet
    // (F8-Regel, richtig). Das ist ein Artefakt der Media-EMULATION — ein echter
    // Ausdruck lässt das Bildschirm-Layout unangetastet. Die Sonde prüft den
    // Split-AUSDRUCK, nicht die Spy-Stabilität unter Media-Wechsel; sie holt
    // ihren Artikel darum zurück in den Blick, statt auf die Pixel zu vertrauen.
    // Die Referenzmessung ist damit abgeschlossen; für den eigentlichen Beweis
    // wird die Seite frisch geladen. Ein `scrollIntoViewIfNeeded` allein genügt
    // NICHT (gemessen: der Zähler kommt zurück, die Bezugs-Shards des neuen
    // Spy-Artikels aber nicht mehr) — der Reload ist der eine Griff, der jeden
    // Rest der Emulation abräumt.
    await page.goto('/gesetze/bund/ZGB#art-684')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await expect.poll(
      async () => page.locator('[data-v3-panel-zaehler]').count(),
      { timeout: 20_000, message: 'kein Panel-Zähler am Artikel — der Spy steht woanders' },
    ).toBeGreaterThan(0)

    // Zweiten Pane über den ⧉ am Panel-Chip öffnen.
    await panelAufziehen(page)
    const panel = page.locator('[data-v3-panel]')
    const ersterEintrag = panel.locator('[data-v3-panel-entscheid]').first()
    await expect(ersterEintrag).toBeVisible({ timeout: 20_000 })
    await ersterEintrag.getByRole('button', { name: /nebeneinander öffnen/ }).click()
    await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 10_000 })

    await page.emulateMedia({ media: 'print' })
    const mass = await page.evaluate(() => {
      const primaer = document.querySelector('[data-pane="primaer"]') as HTMLElement
      return {
        doku: document.documentElement.scrollHeight,
        paneUeberhang: primaer.scrollHeight - primaer.clientHeight,
      }
    })

    expect(mass.paneUeberhang, `Pane-Überhang ${mass.paneUeberhang}px wird abgeschnitten`).toBeLessThanOrEqual(2)
    expect(mass.doku, `Split-Ausdruck ${mass.doku}px vs. ${ohneSplit}px ohne Split`).toBeGreaterThan(20_000)
  })
})
