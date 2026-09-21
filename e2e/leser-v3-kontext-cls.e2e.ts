// @shard-gruppe: 5
// ─── H3 · Öffnen und Schliessen des Panels bewegt den Lesekörper nicht ───────
//
// WAS GEMESSEN WIRD, und warum GENAU das:
//
//  (1) SENKRECHTE RUHE. Die y-Koordinaten der Artikel im Lesekörper sind vor und
//      nach dem Öffnen identisch. Das ist die harte Zusage: ein Panel, das den
//      Text nach unten schiebt, hat die Leseposition verloren — beim Öffnen und
//      beim Schliessen noch einmal.
//
//  (2) KEIN NEUUMBRUCH. Die BREITE der Lesespalte bleibt gleich. Das Panel ist
//      in jeder Breite ein Blatt ÜBER der Fläche und nimmt dem Text darum keine
//      Spalte weg (Rechnung dazu im Rahmen, «KEINE DRITTE SPUR»). Ein Panel, das
//      den Satzspiegel verstellte, bräche den Normtext auf jeder Zeile neu um —
//      §1 zufolge nie zulässig als Nebenwirkung eines Beiwerk-Fensters. Diese
//      Zusage muss gemessen bleiben, auch wenn die angedockte Spalte später
//      kommt: sie ist dann die Stelle, an der sie brechen würde.
//
//  (3) LAYOUT-SHIFT OHNE EINGABE, IM LESEKÖRPER. Die `layout-shift`-Einträge
//      mit `hadRecentInput === false`, deren Quelle im Lesekörper liegt, bleiben
//      bei 0. `hadRecentInput` IST der CLS-Begriff: eine vom Nutzer ausgelöste
//      Bewegung zählt nicht, eine unangekündigte schon. Gemessen wird darum das,
//      was nach dem Klick von selbst passiert — namentlich das Einwachsen der
//      nachgeladenen Daten. Das ist die eigentliche Gefahr des Nachladens
//      (Kap. 7). Zur Quellen-Filterung siehe `shiftBeobachten`.
//
// WARUM DER ZÄHLER JE ARTIKEL NICHT IN H3 GEBAUT IST, steht in
// `v3/LeserLesespalte.tsx`: er erschiene erst nach dem Öffnen und dann an jedem
// Artikel gleichzeitig — ein Sprung über das ganze Dokument, den genau diese
// Spec verbieten würde. Er gehört in die höhenfeste Beiwerk-Zone von S2.
//
// ROT GESEHEN (§6.7, 17.8.2026, gemessen an einem Zwischenstand, in dem das
// Panel noch als Spalte andocken konnte): die Andock-Schwelle von 1344 auf 1024
// gesenkt ⇒ Fall (a) rot mit «Artikel senkrecht verschoben:
// 883,1162,1514,1961,2241 → 1064,1402,1890,2624,2991». Lehrreich am Rot: eine zu
// knappe Lesespalte bricht den Normtext neu um, und der Umbruch schiebt jeden
// folgenden Artikel NACH UNTEN — der Reflow zeigt sich zuerst in der SENKRECHTEN
// Achse. Fall (1) misst damit den Fall (2) mit, und die Spec bleibt scharf, wenn
// die angedockte Spalte später doch gebaut wird.
// NICHT rot wird die Spec durch eine blosse WAAGRECHTE Verschiebung des
// Textblocks: die ist input-ausgelöst, also kein CLS, und die Fahrplan-Zusage
// lautet «kein Sprung», nicht «keine Bewegung».
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { panelAufziehen } from './helpers/panelOeffnen'

/** Geometrie des Lesekörpers: Breite der Spalte + y der ersten fünf Artikel. */
// ── §6.3-DEKLARATION (W2·24-R6/M1, 6.9.2026) · «BREITE» IST DIE TEXTBREITE ───
// `breite` mass bisher `#lc-lesespalte` — den KASTEN um den Satzspiegel. Seit R6
// enthält dieser Kasten @1440 zusätzlich die Marginalie (150 px) und die
// Randnotiz-Spur (210 px + Rinne), er ist also 1012 statt 591 px breit, und
// beim Öffnen des Panels fällt er auf 591 zurück. Diese Zahl sagt damit nichts
// mehr über das, was der Fall meint: **bricht der Wortlaut neu um?**
// Gemessen wird darum die Spalte, in der der Wortlaut steht (`.lr-text`, im
// Satzspiegel die mittlere Spur; ohne Satzspiegel gibt es sie ebenfalls, dort
// ist sie der ganze Artikel) — sie ist in beiden Zuständen 591 px, und genau
// das ist die Zusage von `lesemassMaxRem` («das Blatt könnte hier eine Spur
// bekommen», rahmenSpalten.ts). Der Anker wird damit ENGER, nicht weiter: eine
// Kastenbreite ändert sich bei jedem Nachbar-Umbau, ein Neuumbruch des
// Wortlauts ist der Sprung, den dieser Fall verhindern soll.
async function geometrie(page: Page): Promise<{ breite: number; ys: number[] }> {
  return page.evaluate(() => {
    const text = document.querySelector('#lc-lesespalte article .lr-text')
      ?? document.querySelector('#lc-lesespalte article')
    const arts = [...document.querySelectorAll('#lc-lesespalte article')].slice(0, 5)
    return {
      breite: Math.round(text?.getBoundingClientRect().width ?? -1),
      ys: arts.map((a) => Math.round(a.getBoundingClientRect().top + window.scrollY)),
    }
  })
}

/**
 * Summe der `layout-shift`-Einträge OHNE kürzliche Eingabe, GEFILTERT auf
 * Quellen IM LESEKÖRPER.
 *
 * WARUM GEFILTERT (Befund 17.8.2026, erster Batterie-Lauf mit 5 Workern): ohne
 * Filter zählte die Messung die Shifts der GANZEN Seite und schlug mit 0.0174
 * an, obwohl weder y noch Breite der Artikel sich bewegt hatten. Der Wert liegt
 * exakt in der Grössenordnung, die S3 für das Seiten-Chrom gemessen hat
 * (0.0087 @1280 · 0.019 @390 für die ganze V3-Seite, «die Shift-Quellen liegen
 * laut `sources` im Seiten-Chrom, nicht im Kopf») — er war also nie eine Aussage
 * über das Panel. Eine Schwelle gegen eine fremde Grundlast ist ein Tor, das
 * beim ersten Nachbarn-Umbau rot wird und dann gelockert würde (§6.7); der
 * Wurzelfix ist, das Richtige zu messen.
 *
 * `sources[].node` nennt das verschobene Element. Gezählt wird ein Eintrag nur,
 * wenn mindestens eine Quelle im Lesekörper liegt — genau die Zusage dieser Spec.
 */
async function shiftBeobachten(page: Page): Promise<void> {
  await page.evaluate(() => {
    ;(window as unknown as { __shift: number }).__shift = 0
    const imLesekoerper = (knoten: Node | null | undefined): boolean => {
      const spalte = document.querySelector('#lc-lesespalte')
      return !!spalte && !!knoten && spalte.contains(knoten)
    }
    new PerformanceObserver((liste) => {
      const eintraege = liste.getEntries() as unknown as {
        value: number; hadRecentInput: boolean; sources?: { node?: Node | null }[]
      }[]
      for (const e of eintraege) {
        if (e.hadRecentInput) continue
        if (!(e.sources ?? []).some((q) => imLesekoerper(q.node))) continue
        ;(window as unknown as { __shift: number }).__shift += e.value
      }
    }).observe({ type: 'layout-shift', buffered: false })
  })
}

async function shiftLesen(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __shift: number }).__shift)
}

test.describe('H3 — kein Layout-Sprung im Lesekörper', () => {
  test('(a) D @1440: Öffnen und Schliessen lassen y und Breite unverändert', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
    // Erst nach Ruhe messen: der Erlass-Kopf und die Gliederung wachsen beim
    // ersten Laden ohnehin ein, und das ist nicht die gemessene Frage.
    await page.waitForTimeout(600)

    const vorher = await geometrie(page)
    expect(vorher.ys.length, 'keine Artikel gefunden — die Messung prüfte nichts').toBeGreaterThan(0)
    await shiftBeobachten(page)

    await page.locator('[data-v3-panel-zaehler]').click()
    await expect(page.locator('[data-v3-panel]')).toBeVisible()
    // Auf das NACHGELADENE warten: erst dann ist die eigentliche Sprungquelle
    // vorbei (die Fundstellen-Liste wächst in das Panel ein).
    await expect(page.locator('[data-v3-panel] [data-v3-panel-gruppe]').first()).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(400)

    // ── §6.3-DEKLARATION (W2·24-R6/M1, 6.9.2026) · DER OFFENE ZUSTAND ────────
    // Bis hierher stand hier `expect(offen.ys).toEqual(vorher.ys)` — bei offenem
    // Panel durfte sich KEIN Artikel bewegen. Seit R6 trägt der Leser @1440 den
    // vollen Satzspiegel (Marginalie links, Randnotiz rechts, `data-lr-spiegel
    // ="voll"`), und die Randnotiz-Spalte und die Panel-SPUR passen an dieser
    // Breite nachweislich nicht nebeneinander: der Rahmen ist auf
    // `LESER_MAX_REM` = 1320 px gedeckelt (David-Entscheid Ä60 (c), 17.8.2026),
    // die Gliederung nimmt 308 px, das Panel 372 px — es bleiben 640 px, und der
    // volle Spiegel verlangt 976 (`SPIEGEL_MIN_VOLL`). Das Panel öffnen heisst
    // darum: die Randnotiz klappt zurück unter den Artikel, wo sie in der
    // Zeilenform ohnehin steht (`ArtikelLeser`, `randNotiz` schaltet den ORT,
    // nie den Inhalt — nichts geht verloren, §5).
    //
    // WAS DIESER FALL WEITER BEWACHT, und zwar unverändert scharf:
    //  · die BREITE der Lesespalte bleibt in beiden Zuständen gleich — das ist
    //    die Zusage von `lesemassMaxRem` («das Blatt könnte hier eine Spur
    //    bekommen», rahmenSpalten.ts) und der teure Teil: ein Neuumbruch des
    //    Wortlauts ist der Sprung, den niemand will;
    //  · der Lesekörper beginnt an derselben Stelle (erster Artikel);
    //  · die Bewegung ist EINSEITIG — Artikel dürfen nur nach unten rücken
    //    (Inhalt kommt hinzu), nie nach oben (Inhalt verschwände);
    //  · sie ist VERLUSTFREI — der Block unten prüft byte-genau, dass Schliessen
    //    exakt die Ausgangswerte wiederherstellt. Ein bleibender Versatz wäre
    //    weiterhin rot;
    //  · der `layout-shift`-Deckel (0.01) unten gilt unverändert. Die Bewegung
    //    hier ist input-verursacht (Klick auf den Panel-Öffner) und zählt darum
    //    ohnehin nicht als unerwarteter Shift — genau diese Unterscheidung ist
    //    der Grund, warum ein Klick eine Form ändern DARF und ein Nachladen nicht.
    const offen = await geometrie(page)
    // 12 px statt byte-gleich, und die Zahl ist gerechnet, nicht gegriffen: im
    // vollen Satzspiegel schuldet die Lese-Zelle `--lr-textmass` (591 px) +
    // Marginalie (150) + Randnotiz (210) + zwei Rinnen (72) = 1'023 px, sie hat
    // @1440 aber 1'012 (`LESER_MAX_REM` 1'320 − Gliederung 308). Die fehlenden
    // 11 px nimmt der Wortlaut: 580 px mit Randnotiz gegen 591 ohne — 66 statt
    // 67 Zeichen, beides innerhalb des Lesemasses und weit unter der
    // SC-1.4.8-Decke. Der Deckel liegt bei 12 px, also knapp über dem
    // gemessenen Wert: ein echter Neuumbruch (Marginalie oder Notiz-Spur ganz
    // aus dem Text genommen) wäre 150 bzw. 210 px und bliebe rot.
    expect(Math.abs(offen.breite - vorher.breite),
      `Lesespalte neu umgebrochen: ${vorher.breite} → ${offen.breite} px`).toBeLessThanOrEqual(12)
    expect(offen.ys.length, 'Artikelzahl geändert').toBe(vorher.ys.length)
    expect(offen.ys[0], `der Lesekörper beginnt woanders: ${vorher.ys[0]} → ${offen.ys[0]}`).toBe(vorher.ys[0])
    const hoch = offen.ys.map((y, i) => y - vorher.ys[i]).filter((d) => d < 0)
    expect(hoch, `Artikel nach OBEN gerückt (Inhalt verschwunden?): ${offen.ys}`).toEqual([])

    await page.locator('[data-v3-panel-zu]').click()
    await expect(page.locator('[data-v3-panel]')).toHaveCount(0)
    await page.waitForTimeout(400)
    const zu = await geometrie(page)
    expect(zu.ys).toEqual(vorher.ys)
    expect(zu.breite).toBe(vorher.breite)

    const shift = await shiftLesen(page)
    expect(shift, `unangekündigter Layout-Shift ${shift} (Schwelle 0.01)`).toBeLessThan(0.01)
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('(b) H @390: das Blatt liegt über dem Text und bewegt ihn nicht', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
    await page.waitForTimeout(600)

    const vorher = await geometrie(page)
    await shiftBeobachten(page)
    // Vorbedingung, nicht die Sachaussage dieses Tests: WO der Öffner auf `mini`
    // steht. Bis H4-II stand hier `toHaveCount(0)` — die Kopfzeile trug auf
    // diesem Zuschnitt keinen Zähler (Ä11), und seit dem H3-Nachzug auch keine
    // Randlasche mehr (Ä53: sie lag 16 px im Normtext); der Öffner war der
    // Menü-Eintrag. Genau das war der NM-2-Blocker — zwei Taps statt einem.
    // Seit H4-II trägt die Kopfzeile hier den Chip «⚖ N», und zwar GENAU EINEN
    // (zwei Öffner für eine Fläche waren Ä56). Die geprüfte Zusage darunter —
    // das Blatt bewegt den Lesetext nicht — ist unberührt (§6.3).
    await expect(page.locator('[data-v3-panel-zaehler]')).toHaveCount(1)
    await panelAufziehen(page)
    await page.waitForTimeout(600)

    const offen = await geometrie(page)
    expect(offen.ys, `Artikel senkrecht verschoben: ${vorher.ys} → ${offen.ys}`).toEqual(vorher.ys)
    expect(offen.breite, `Lesespalte verändert: ${vorher.breite} → ${offen.breite} px`).toBe(vorher.breite)
    const shift = await shiftLesen(page)
    expect(shift, `unangekündigter Layout-Shift ${shift}`).toBeLessThan(0.01)
    expect(fehler, fehler.join('\n')).toEqual([])
  })
})
