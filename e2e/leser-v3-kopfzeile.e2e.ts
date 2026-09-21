// @shard-gruppe: 6
// ═══ DIE V3-KOPFZEILE: EINE LEISTE, BÜNDIG ══════════════════════════════════
//
// ZUSAMMENGELEGT 31.8.2026 (Ent-Regulierung Runde 2 / Batch A, QS-EFFIZIENZ) aus
// `leser-v3-eine-kopfzeile` (A-2: es gibt genau EINE Kopfzeile) und
// `leser-v3-kopf-buendig` (Ä1: sie sitzt bündig an der Leiste über ihr). Beide
// messen dieselbe Leiste, von zwei Seiten. ALLE 16 FÄLLE BLEIBEN; zusammengeführt
// sind allein die Import-Zeilen. Keine Assertion entfernt, keine gelockert (§6.3).
//
// SHARD-WAHL, GEMESSEN (§0 Ziff. 3): lokal, kalt, `--workers=1`, dist/, 31.8.2026
// — eine-kopfzeile 28.4 s (kam aus Gruppe 8, der mit 267 s SCHWERSTEN) und
// kopf-buendig 8.2 s (Gruppe 6). Zusammen 36.6 s in Gruppe 6, die mit 127 s zu
// den leichtesten zählt: Gruppe 8 wird um 28 s entlastet, keine schwere Gruppe
// belastet. Vergleichsbasis sind die Gruppen-Summen der Lastprobe 18.8.2026 im
// `_kommentar` von `e2e/shard-gruppen.json`.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

// ═══════════════════════════════════════════════════════════════════════════
// TEIL 1 · A-2 — der Leser trägt genau EINE Kopfzeile
// Wortlaut übernommen aus `e2e/leser-v3-eine-kopfzeile.e2e.ts` (31.8.2026, Runde 2 / Batch A);
// Datei-Kopf und Fälle unverändert, nur die Import-Zeilen sind oben
// zusammengeführt.
// ═══════════════════════════════════════════════════════════════════════════
// ─── A-2 (LESER-V3, Auftrag David 17.8.2026) · EINE KOPFZEILE, NICHT ZWEI ─────
//
// DER AUFTRAG, wörtlich: «beachte dass wir jetzt oben einen header haben mit
// ähnlichem inhalt: Gesetze › Bund › StPO · Art. 144 · Stand 01.04.2025 · ✕ —
// und darunter: Gesetze › StPO … · Art. 144 · ◧ Ansicht ▾ — passe das
// entsprechend sinnvoll an».
//
// DER BEFUND, gemessen 17.8.2026 am Stand afc008c19 (`?leser=v3`, StPO):
//   @1440  Topbar bis 65 · App-Krumen-Leiste 65…102 (37 px) · V3-Kopf 102…159
//          ⇒ 2 `nav`-Krumen, 2 ✕, `--nt-stick` 156 px
//   @390   dasselbe Bild, V3-Kopf bis 195 px
//   Split  4 ✕ (2 je Pane), Pane-Titelleiste nennt Krume UND Artikel
//
// DIE NEUE WAHRHEIT, die diese Spec festhält:
//  (a) Unter `?leser=v3` gibt es GENAU EINE Krumen-Leiste — die des Lesers. Die
//      App-Leiste ist nicht «leer», sondern nicht da (`[data-inhalt-kopf]`
//      count 0), und der Kopf schliesst bündig an die Topbar an.
//  (b) Sie trägt alles, was die alte Leiste trug und was ihr gehört: die ganze
//      Krume (Gesetze › Bund › StPO, klickbar), die Ortsangabe, Ansicht, ✕.
//  (c) Den STAND trägt sie NICHT — er steht seit S3 im Erlass-Kopf, und zweimal
//      wäre eine zweite Wahrheit (§5). Geprüft in beide Richtungen: nicht im
//      Kopf, genau einmal auf der Seite.
//  (d) Im Split behält die Pane-Titelleiste ihre FENSTER-Steuerung (sie kann
//      keine Inhaltsseite tragen) und gibt die Identität ab.
//  (e) OHNE Flag ist die App-Leiste unverändert da (FL-4). Diese Sonde ist der
//      Grund, warum die Spec nicht nur «eine Leiste» zählt: eine Zählung, die
//      auch in V1 stimmt, hätte nichts über die Verschmelzung gesagt.
//  (f) Erlass-neutral: Kanton BS zeigt «Gesetze › Kanton BS › …» aus derselben
//      Ableitung, ohne Sonderpfad.
//
// ROT ZU BEKOMMEN (§6.7, am 17.8.2026 gesehen — Ausgaben im Vollzugsvermerk):
//  · in `src/components/layout/InhaltsKopf.tsx` den Block
//    `if (daten.kopfzeileSelbst) { … }` entfernen ⇒ (a)/(b) messen wieder zwei
//    Krumen-Leisten, zwei ✕ und 159 px Chrome;
//  · in `src/pages/GesetzLeser.tsx` (bis H5, 21.8.2026: `gesetz-leser/GesetzLeserV3.tsx`)
//    die Meldung `meldeInhaltsKopf({ kopfzeileSelbst: true, … })` streichen
//    ⇒ dasselbe;
//  · in `src/pages/gesetz-leser/v3/kopfStufen.ts` `krume` auf einem Zuschnitt
//    abschalten ⇒ (b)/(f) verlieren «Gesetze ›» und die Ebene-Stufe, (b2)/(h)
//    den Rücksprung «‹ Gesetze»;
//  · in `src/pages/gesetz-leser/v3/LeserRahmenV3.tsx` den Aufruf
//    `useKopfAnspruch(...)` durch `useKopfAnspruch(false)` ersetzen ⇒ (i) findet
//    auf NYÜ/DSGVO/Fehlseite wieder KEINE Krume und KEIN ✕ (bis 14.9.2026
//    stand hier EMRK — Ziel-Wechsel s. u. bei (i));
//  · in `src/components/layout/PaneKopf.tsx` `nurSteuerung` ignorieren ⇒ (d)
//    findet die Ortsangabe wieder in der Pane-Titelleiste.

/** Chrome-Höhen und Leisten-Inventar der Einzelansicht. */
async function chrome(page: Page) {
  return page.evaluate(() => {
    const kasten = (sel: string) => {
      const el = document.querySelector(sel)
      return el ? el.getBoundingClientRect() : null
    }
    const topbar = kasten('header.sticky')
    const kopf = kasten('[data-v3-kopf]')
    // ── §6.3-DEKLARATION (W2·24-R6c, 6.9.2026) · DER BEZUGSPUNKT WANDERT ─────
    // Bis hierher mass dieser Fall gegen die UNTERKANTE DER TOPBAR — richtig,
    // solange zwischen Topbar und Leser-Kopf nichts stand. Seit R2/D19 steht
    // dort die ARBEITSLEISTE (Reiter, Auftrag David «in der tab zeile oben soll
    // man mit plus einen neuen reiter erzeugen können») und seit R6/M10 die
    // AUSGABE-ZEILE («Jüngster Eintrag: …», D8) — zusammen 65 px @1440.
    // Gemessen am Bau-Stand von R6c: Topbar 0–64, Arbeitsleiste 64–98,
    // Ausgabe-Zeile 98–129, Leser-Kopf 129–186. Der Kopf klebt also weiterhin
    // BÜNDIG an dem, was über ihm steht (Lücke 0 px) — die Sonde verglich nur
    // mit der falschen Kante.
    // KEINE AUFWEICHUNG: die Zusage bleibt «keine Leerzone über dem Leser-Kopf»
    // und «der Leser bringt nicht mehr eigenes Chrome mit als vor A-2». Neu ist
    // nur, dass beide gegen die Unterkante des CHROME-STAPELS gemessen werden
    // statt gegen eine einzelne, inzwischen nicht mehr benachbarte Leiste. Die
    // Sonde wird dadurch anatomie-neutral: sie meldet auch die NÄCHSTE Leiste,
    // die jemand dazwischenschiebt, statt beim ersten Zuwachs blind zu werden.
    const stapel = (() => {
      if (!topbar || !kopf) return null
      let unten = topbar.bottom
      for (const el of document.querySelectorAll('body *')) {
        const b = el.getBoundingClientRect()
        if (b.height < 4 || b.width < window.innerWidth * 0.9) continue
        if (b.top >= topbar.bottom - 1 && b.bottom <= kopf.top + 1 && b.bottom > unten) unten = b.bottom
      }
      return Math.round(unten)
    })()
    return {
      topbarUnten: topbar ? Math.round(topbar.bottom) : null,
      /** Unterkante des klebenden Chrome-Stapels ÜBER dem Leser-Kopf. */
      stapelUnten: stapel,
      kopfOben: kopf ? Math.round(kopf.top) : null,
      kopfUnten: kopf ? Math.round(kopf.bottom) : null,
      appLeisten: document.querySelectorAll('[data-inhalt-kopf]').length,
      appKrumen: document.querySelectorAll('nav[aria-label="Brotkrümel"]').length,
      // §6.3-NACHZUG D27 (6.9.2026): die Ortsangabe ist keine `nav` mehr — die
      // Krume ist weg, geblieben ist die Kennungs-ZONE des Kopfes. Gezählt wird
      // ab hier sie; die Aussage «genau EINE Kopf-Ortszone je Lesefläche, und
      // keine App-Krumenleiste daneben» bleibt unverändert prüfbar.
      leserKrumen: document.querySelectorAll('[data-v3-kopf-ort]').length,
      // Schliess-Griffe im Ruhezustand: ein Knopf, dessen sichtbarer Text genau
      // «✕» ist. Deckt App-✕, Pane-✕ und Leser-✕ gleichermassen, ohne sich auf
      // eine der drei Beschriftungen zu verlassen.
      // ── §6.3-DEKLARATION (W2·24-R6c) · AUSSER DEM DER REITER ────────────
      // Seit R2/D19 trägt jeder Reiter der Arbeitsleiste sein eigenes ✕
      // («Reiter «StPO» schliessen», in `[data-reiter-streifen]`). Das ist der
      // Schliess-Griff EINES REITERS, nicht der der Kopfzone — es schliesst
      // nicht den Leser, sondern das Register-Blatt, das ihn zeigt, und es ist
      // ausdrücklich bestellt («in der tab zeile oben soll man mit plus einen
      // neuen reiter erzeugen können», David 6.9.2026). Die Aussage dieses
      // Falls lautet «die KOPFZONE DES LESERS trägt keinen Schliess-Griff» und
      // bleibt Wort für Wort so streng; sie zählt nur nicht mehr ein Kreuz mit,
      // das einem anderen Objekt gehört. Ein zurückkehrendes App-, Pane- oder
      // Leser-✕ meldet sie unverändert.
      kreuze: [...document.querySelectorAll('button')]
        .filter((b) => (b.textContent ?? '').trim() === '✕')
        .filter((b) => !b.closest('[data-reiter-streifen], nav[aria-label="Offene Reiter"]'))
        .map((b) => b.getAttribute('aria-label') ?? '?'),
      ortsangabenImChrome: document.querySelectorAll('[data-ort-artikel]').length,
    }
  })
}

/**
 * WO steht ein Stand-Datum, und klebt diese Stelle? Gesucht werden die INNERSTEN
 * Elemente, die die Zeichenkette tragen — sonst zählte jeder Vorfahre mit und
 * die Zahl sagte nichts. `klebt` heisst: die Stelle liegt in einer der beiden
 * klebenden Kopfleisten (App-Leiste oder V3-Kopfzeile). Nötig, weil die Orte
 * verschieden gebaut sind: die App-Leiste setzt das Datum in ein Kind-`span`,
 * der Erlass-Kopf schreibt «Stand 01.04.2025» als einen Textknoten.
 */
async function standStellen(page: Page, datum: string): Promise<{ text: string; klebt: boolean }[]> {
  return page.evaluate((d) => {
    const raus: { text: string; klebt: boolean }[] = []
    for (const el of document.querySelectorAll('body *')) {
      if (!(el.textContent ?? '').includes(d)) continue
      if ([...el.children].some((k) => (k.textContent ?? '').includes(d))) continue
      // R3-α (31.8.2026, deklariert): das Datum steckt seit dem <Datum>-
      // Baustein in einem eigenen tabular-nums-Span — das TIEFSTE Element
      // trägt das Wort «Stand» nicht mehr. Der Text wird darum aus dem
      // Eltern-Element gelesen (die Zeile), die Chrome-Zuordnung bleibt am
      // Fundelement. Sichtbar ist die Zeile unverändert (Zusicherung :184).
      raus.push({
        text: ((el.parentElement?.textContent ?? el.textContent) ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
        klebt: !!el.closest('[data-inhalt-kopf], [data-v3-kopf]'),
      })
    }
    return raus
  }, datum)
}

// Die Vorzustände, gegen die der Gewinn gemessen wird (Stand afc008c19,
// 17.8.2026) und die Höhe der weggefallenen Leiste. Die Schranke ist damit keine
// runde Wunschzahl, sondern «vorher minus die Leiste».
const VORHER_D = 159
const VORHER_H = 195
const APP_LEISTE_H = 36
/** Höhe der App-Topbar, die in `VORHER_D`/`VORHER_H` mit drinsteckt. */
const TOPBAR_H = 64
/** Was der LESER selbst an Chrome mitbringen darf — «vorher minus Leiste minus
 *  Topbar». Gemessen am Bau-Stand von R6c: 57 px @1440, 93 px @390; die
 *  Schranken (59 / 95) behielten damit ihre Bissigkeit von 2 px.
 *
 *  ── §6.3-DEKLARATION D28 (David 6.9.2026) · @1440 KOSTET DIE SUCHE 44 px ───
 *  «die suchleiste im gesetz … will ich oben am gesetz.» Bis 6.9. lag das Feld
 *  @1440 in der Gliederungs-SPALTE und kostete den klebenden Kopf nichts; seit
 *  D28 trägt der Kopf-Block es auf jeder Breite. GEMESSEN am gebauten Stand
 *  (STPO, Preview 4372): Kopfhöhe @1440 **57 → 101 px** (+44 = `SUCH_H_RUHE`,
 *  2.75 rem), @390 unverändert **93 px** — dort stand das Feld schon vorher im
 *  Kopf. Die Schranke @1440 wird darum auf 103 gehoben und behält ihre
 *  Bissigkeit von 2 px; @390 bleibt sie unberührt bei 95.
 *  DER PREIS IST BENANNT, nicht wegdefiniert: der Ausdruck unten ist deshalb um
 *  eine EIGENE Zeile ergänzt statt die Vorher-Werte umzuschreiben — `VORHER_D`
 *  ist ein Messwert vom 17.8.2026 und bleibt, was er war. */
const SUCH_ZONE_H = 44
const EIGEN_D = VORHER_D - APP_LEISTE_H - TOPBAR_H + SUCH_ZONE_H
const EIGEN_H = VORHER_H - APP_LEISTE_H - TOPBAR_H

test.describe('A-2 — unter ?leser=v3 trägt der Leser die eine Kopfzeile', () => {
  test('(a)+(b)+(c) Einzelansicht @1440: eine Leiste, volle Krume, kein zweiter Stand', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
    await page.waitForTimeout(600)

    const m = await chrome(page)
    // (a) EINE Leiste — und der Kopf klebt direkt an der Topbar.
    expect(m.appLeisten, 'die App-Krumen-Leiste ist noch im DOM').toBe(0)
    expect(m.appKrumen, 'zweite Brotkrümel-Navigation im DOM').toBe(0)
    expect(m.leserKrumen, 'die Kopfzeile des Lesers fehlt — die Messung prüfte nichts').toBe(1)
    expect(m.kopfOben, `der Kopf schliesst nicht an den Chrome-Stapel an (${m.stapelUnten} → ${m.kopfOben})`)
      .toBeLessThanOrEqual((m.stapelUnten ?? 0) + 1)
    expect(m.kopfOben).toBeGreaterThanOrEqual((m.stapelUnten ?? 0) - 2)
    expect((m.kopfUnten ?? 0) - (m.stapelUnten ?? 0),
      `der Leser bringt ${(m.kopfUnten ?? 0) - (m.stapelUnten ?? 0)} px eigenes Chrome mit — erlaubt ${EIGEN_D}`)
      .toBeLessThanOrEqual(EIGEN_D)
    // ── Ä87/Ä91 (H4-Nachzug 18.8.2026) · KEIN Schliess-Griff mehr ──────────
    // Hier stand «EIN Schliess-Griff, und zwar der des Gesetzes». Gemessen
    // 18.8.2026 @1440 lag genau dieses ✕ bei offenem Beiwerk-Blatt 47 px über
    // dessen eigenem ✕ (y 80 / y 127) — zwei gleiche Zeichen, zwei Wirkungen.
    // Es ist gestrichen; sein Ziel `/gesetze` steht in derselben Zeile als
    // beschriftete Krume (Zusicherung (b) unten). Die Aussage bleibt damit
    // scharf: im RUHEZUSTAND trägt die ganze Kopfzone NULL Schliess-Griffe.
    expect(m.kreuze.length, `Schliess-Griffe: ${m.kreuze.join(' | ')}`).toBe(0)
    expect(m.ortsangabenImChrome, 'die App-Leiste nennt noch eine Ortsangabe').toBe(0)

    // (b) §6.3-DEKLARATION D27/D28 (David 6.9.2026): die Kopfzeile trug bis
    // 6.9. die VOLLE Krume «Gesetze › Bund › StPO». Sie ist weg — der Ort steht
    // im Reiter, der Rücksprung in der Hauptnavigation. Was die Zeile ab hier
    // trägt und was hier geprüft wird: Kennung · Ansicht · Erlass-Suche, dazu
    // die Negativ-Zusagen (keine Kette, kein ✕, keine Lesestellung).
    const ort = page.locator('[data-v3-kopf] [data-v3-kopf-ort]')
    await expect(ort).toHaveCount(1)
    await expect(ort.getByRole('link')).toHaveCount(0)
    await expect(page.locator('[data-v3-kopf-krume-kurz]')).toHaveCount(0)
    await expect(page.locator('[data-v3-kopf-artikel]')).toHaveCount(0)
    await expect(page.locator('[data-v3-kopf-kuerzel]')).toHaveText('StPO')
    await expect(page.locator('[data-v3-kopf] [data-v3-ansicht]')).toBeVisible()
    // D28: die Erlass-Suche steht im Kopf-Block — @1440 MIT stehender Gliederung.
    await expect(page.locator('[data-v3-kopf] [data-v3-such-zone] input')).toBeVisible()
    await expect(page.locator('[data-v3-kopf-schliessen]'),
      'Ä87: das Kopf-✕ ist gestrichen — der Rücksprung steht in der Hauptnavigation').toHaveCount(0)
    // ── D27 · WO DER WEG ZURÜCK JETZT STEHT (gemessen 6.9.2026) ─────────────
    // Die Hauptnavigation ist auf einer Leser-Seite EINGEKLAPPT (Vorgabe
    // `useSeitenleiste({ vorgabeEingeklappt: istGesetzLeserPfad })`) — gemessen
    // @1440 auf `/gesetze/bund/STPO`: `nav[aria-label="Hauptnavigation"]` count
    // **0**, der Umschalter in der Topbar count **1**, und nach einem Klick
    // darauf steht der Link `/gesetze` (count 1). Der Weg zurück ist also da und
    // ist einen Klick entfernt; die Krume war es auf `mini` faktisch auch (dort
    // stand nur noch «‹ Gesetze»). Geprüft wird beides, damit der Fall nicht
    // stumm grün wird, wenn eine Seite den Umschalter verliert.
    const umschalter = page.getByRole('button', { name: 'Seitenleiste ein- und ausblenden' }).first()
    await expect(umschalter, 'ohne Umschalter gibt es keinen Weg in die Hauptnavigation').toHaveCount(1)
    await umschalter.click()
    await expect(page.locator('nav[aria-label="Hauptnavigation"] a[href="/gesetze"]').first(),
      'der Weg zurück zur Gesetzes-Übersicht fehlt in der Hauptnavigation').toBeVisible({ timeout: 15_000 })
    await umschalter.click()
    const ortText = (await ort.innerText()).replace(/\s+/g, ' ').trim()
    expect(ortText, `Ortszone lautet «${ortText}»`).toBe('StPO')

    // (c) DER STAND IST NICHT MITGEWANDERT — und trotzdem ohne Scrollen da.
    // Die Verschmelzung hätte ihn leicht in die Kopfzeile nachziehen können; das
    // wäre die dritte Ausgabe derselben Zahl gewesen (Erlass-Kopf + Übersichts-
    // zeile tragen sie in V3 bereits, beide im Lesebereich und beide vor A-2).
    // Geprüft wird darum genau die A-2-Aussage: KEIN klebendes Chrome nennt den
    // Stand mehr, und der Erlass-Kopf tut es im Ruhezustand sichtbar (NM-3).
    const kopfText = await page.locator('[data-v3-kopf]').innerText()
    expect(kopfText, `«Stand» steht in der Kopfzeile: ${kopfText}`).not.toContain('Stand')
    const stellen = await standStellen(page, '01.04.2025')
    const imChrome = stellen.filter((s) => s.klebt)
    expect(imChrome.length, `Stand in klebendem Chrome: ${imChrome.map((s) => s.text).join(' || ')}`).toBe(0)
    const ausgeschrieben = stellen.filter((s) => s.text.includes('Stand'))
    expect(ausgeschrieben.length, 'kein ausgeschriebener «Stand …» mehr auf der Seite').toBeGreaterThan(0)
    await expect(page.getByText('Stand 01.04.2025').first()).toBeInViewport()

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(b2) Handy @390: dasselbe, mit dem Zuschnitt «mini»', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
    await page.waitForTimeout(600)

    const m = await chrome(page)
    expect(m.appLeisten, 'die App-Krumen-Leiste ist noch im DOM').toBe(0)
    expect(m.leserKrumen).toBe(1)
    // R6c: Bezug ist der Chrome-STAPEL, s. `chrome()`.
    expect(m.kopfOben).toBeLessThanOrEqual((m.stapelUnten ?? 0) + 1)
    expect((m.kopfUnten ?? 0) - (m.stapelUnten ?? 0),
      `der Leser bringt @390 ${(m.kopfUnten ?? 0) - (m.stapelUnten ?? 0)} px eigenes Chrome mit — erlaubt ${EIGEN_H}`)
      .toBeLessThanOrEqual(EIGEN_H)
    // ── Ä46/NM-2 (H4-II, 17./18.8.2026) · @390 STEHT GAR KEIN ✕ MEHR ────────
    // Hier stand `.toBe(1)`. Die Zahl war nie das Ziel, sondern «nicht zwei»
    // (A-2 hatte sie von 2 auf 1 gebracht). H4-II bringt sie auf 0, und zwar
    // nicht durch Verlust: das ✕ führte auf `/gesetze` — genau dorthin, wohin
    // der Rücksprung «‹ Gesetze» zwei Zentimeter weiter links in DERSELBEN
    // Zeile führt (unten geprüft, samt Klick). Zwei Griffe, ein Ziel, 350 px
    // Zeilenbreite. Der frei gewordene Platz trägt jetzt den Panel-Zähler, den
    // `mini` bis dahin gar nicht hatte (NM-2, `leser-v3-h4-kopfwege` (a)).
    // §6.3: fachliche Änderung, deklariert — die Aussage wird nicht weicher,
    // sondern schärfer (genau 0 statt «nicht mehr als 1»).
    expect(m.kreuze.length, `Schliess-Griffe @390: ${m.kreuze.join(' | ')}`).toBe(0)
    // §6.3-DEKLARATION D27 (David 6.9.2026): bis 6.9. fiel auf `mini` die KETTE,
    // während die Krume als Rücksprung «‹ Gesetze» stehen blieb. Beides ist weg
    // — der Ort steht im Reiter, der Rücksprung in der Hauptnavigation. Die
    // Kopfzone trägt auf `mini` damit Kennung · Griffe · Suchfeld, und genau
    // das wird hier geprüft. Der Weg nach oben ist unten gemessen, samt Klick;
    // die Zusage «er ist da und er wirkt» ist unverändert, nur ihr Ort ist neu.
    await expect(page.locator('[data-v3-kopf-kuerzel]')).toHaveText('StPO')
    await expect(page.locator('[data-v3-kopf] [data-v3-suchsprung] input')).toBeVisible()
    await expect(page.locator('[data-v3-kopf-krume-kurz]')).toHaveCount(0)
    await expect(page.locator('[data-v3-kopf-artikel]')).toHaveCount(0)
    const ortH = (await page.locator('[data-v3-kopf] [data-v3-kopf-ort]').innerText())
      .replace(/\s+/g, ' ').trim()
    expect(ortH, `Ortszone @390: «${ortH}»`).toBe('StPO')
    // Und der Weg nach oben ist wirklich bedienbar: @390 steht die
    // Hauptnavigation in der Off-Canvas-Schublade hinter ☰.
    await page.getByRole('button', { name: 'Navigation öffnen' }).first().click()
    const zurueck = page.locator('nav[aria-label="Hauptnavigation"] a[href="/gesetze"]').first()
    await expect(zurueck).toBeVisible({ timeout: 15_000 })
    await zurueck.click()
    await expect(page).toHaveURL(/\/gesetze(\?|$)/, { timeout: 20_000 })

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(d) Split-View: die Pane-Leiste behält die Fenster-Steuerung, gibt die Identität ab', async ({ page }) => {
    test.slow() // zwei volle Leser-Instanzen
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto('/gesetze/bund/STPO?leser=v3&p=/gesetze/bund/BGFA%3Fleser%3Dv3')
    await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-pane="sekundaer"] [data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(800)

    // Je Pane GENAU EINE Kopfzeile — und keine App-Krume irgendwo.
    for (const wahl of ['[data-pane="primaer"]', '[data-pane="sekundaer"]']) {
      await expect(page.locator(`${wahl} [data-v3-kopf]`)).toHaveCount(1)
      await expect(page.locator(`${wahl} [data-v3-kopf-kuerzel]`)).toBeVisible()
      // Ä46 (H4-II) / Ä87 (H4-Nachzug): der V3-Kopf trägt kein eigenes ✕ mehr —
      // im Pane war es das zweite Kreuz (44 px unter dem der Griffleiste), seit
      // 18.8.2026 ist es auf JEDER Breite gestrichen.
      // §6.3-NACHZUG D27/D28 (6.9.2026): der Rücksprung, der hier stand, ist
      // in die Hauptnavigation gezogen; an seiner Stelle steht die Erlass-Suche.
      await expect(page.locator(`${wahl} [data-v3-kopf-schliessen]`)).toHaveCount(0)
      await expect(page.locator(`${wahl} [data-v3-kopf-krume-kurz]`)).toHaveCount(0)
      await expect(page.locator(`${wahl} [data-v3-such-zone] input`)).toBeVisible()
    }
    await expect(page.locator('[data-inhalt-kopf]')).toHaveCount(0)
    // ── §6.3-DEKLARATION L6 (Entscheid David 7.9.2026) ─────────────────────
    // Bis 7.9. stand hier «die Leiste nennt gar nichts mehr» — geprüft als
    // `not.toMatch(/StPO|BGFA|Gesetze|Stand/)`. Gemessen war das Ergebnis zwei
    // NAMENLOSE Fenster nebeneinander («⠿ ◂ ▸ ⇱ ⧉ ✕»), während der
    // Reiterstreifen darüber beide Erlasse nennt (Befund L6, 17.8.2026).
    // Davids Entscheid gibt der Titelleiste ihren NAMEN zurück — die Kurzform,
    // nicht die Krume. Die Aussage dieses Falls wird dadurch nicht weicher,
    // sondern genauer: was A-2 abgeben wollte, war die DOPPELTE ORTSANGABE
    // (Krumen-Kette, Artikel-Zitat, Stand) — nicht der Name des Fensters.
    // Genau so steht es jetzt hier, und die Doppelkrume bleibt verboten.
    const leisten = page.locator('[data-pane-kopf]')
    await expect(leisten).toHaveCount(2)
    for (const [i, name] of ['StPO', 'BGFA'].entries()) {
      const text = (await leisten.nth(i).innerText()).replace(/\s+/g, ' ').trim()
      // Krume, Sektion und Stand bleiben weg — das ist der A-2-Kern.
      expect(text, `Pane-Titelleiste ${i} trägt wieder Ortsangabe: «${text}»`)
        .not.toMatch(/Gesetze|Bund|Stand|›/)
      // L6: der Name steht — und genau einmal.
      expect(text.split(name).length - 1, `Pane-Titelleiste ${i}: «${text}»`).toBe(1)
      await expect(leisten.nth(i).locator('[data-pane-name]')).toHaveText(name)
    }
    await expect(page.locator('[data-ort-artikel]')).toHaveCount(0)
    // Höhe unverändert 36 px: die Leiste verliert Inhalt, nicht ihren Platz —
    // sie trägt weiter die Fenster-Steuerung (kein Sprung im Pane, §15.2).
    for (let i = 0; i < 2; i++) {
      const box = await leisten.nth(i).boundingBox()
      expect(Math.round(box!.height), `Pane-Titelleiste ${i} hat ${box!.height} px`).toBe(36)
    }
    // … die Fenster-Steuerung nicht: sie kann nicht wandern, weil eine
    // Inhaltsseite ihr eigenes Fenster nicht schliessen und nicht verschieben kann.
    await expect(page.getByRole('button', { name: /Hauptfenster schliessen/ })).toHaveCount(1)
    await expect(page.getByRole('button', { name: /«BGFA» zum Hauptfenster machen/ })).toHaveCount(1)
    await expect(page.getByRole('button', { name: /Layout-Link kopieren/ })).toHaveCount(1)
    await expect(page.getByTitle('Zum Verschieben ziehen')).toHaveCount(2)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  // «(e) OHNE Flag ist die App-Leiste unverändert da (FL-4)» GELÖSCHT
  // 21.8.2026 (H5) — prüfte `[data-inhalt-kopf]` der Ist-Hülle (FL-4, mit dem
  // Flag-Code gefallen). Kein Rückweg mehr, den man ohne Flag prüfen könnte.

  test('(f) erlass-neutral: Kanton BS zeigt «Gesetze › Kanton BS › …»', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/kanton/BS-640.100')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(600)

    const m = await chrome(page)
    expect(m.appLeisten).toBe(0)
    // R6c: Bezug ist der Chrome-STAPEL, s. `chrome()`.
    expect((m.kopfUnten ?? 0) - (m.stapelUnten ?? 0)).toBeLessThanOrEqual(EIGEN_D)
    // §6.3-DEKLARATION D27: hier stand die Kanton-Krume «Gesetze › Kanton BS ›»
    // samt ihrem gefilterten Ziel. Die Krume ist weg; die ERLASS-NEUTRALITÄT,
    // um die es dem Fall geht, wird ab hier an der Kennung gemessen — sie ist
    // das, was von der Ortsangabe im Kopf geblieben ist, und sie muss auf einem
    // Kantonserlass genauso stehen wie auf einem Bundeserlass (BS-640.100 ist
    // gerade der Fall, in dem das Kürzel der ganze Name sein kann, Ä21/A4).
    const ort = page.locator('[data-v3-kopf] [data-v3-kopf-ort]')
    await expect(ort).toHaveCount(1)
    const text = (await ort.innerText()).replace(/\s+/g, ' ').trim()
    expect(text.length, `Kennung im Kopf lautet «${text}» — leer`).toBeGreaterThan(0)
    expect(text, `Kennung enthält noch eine Krume: «${text}»`).not.toContain('›')
    await expect(ort.getByRole('link')).toHaveCount(0)
    // Der Weg zur gefilterten Kantons-Übersicht ist nicht verloren, er steht in
    // der Hauptnavigation bzw. auf der Gesetzes-Übersicht — hier zählt nur, dass
    // die Kopfzeile ihn nicht ein zweites Mal führt (§5).

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  // ── (g) DIE WEICHENDE LEISTE DARF DEN INHALT NICHT VERSCHIEBEN ─────────────
  //
  // DER BEFUND, der diese Sonde erzwungen hat (17.8.2026, im Bau gemessen): die
  // Route `/gesetze/:ebene/:key` ist `lazy` (RouteSwitch), die Shell rät solange
  // aus dem Pfad, dass eine App-Leiste kommt (`kopfVonPfad`). Die erste Fassung
  // liess die Leiste bei der Meldung «ich trage sie selbst» auf 0 px fallen —
  // `main#inhalt` rückte 102 → 65 px hoch, EIN Shift von 0.0238 bei t ≈ 395 ms,
  // Gesamt-CLS 0.0309 gegen 0.0048 in V1. Das Bestands-Tor `leser-kopf-cls-s3`
  // (v3 @390) riss damit seine Schwelle 0.05 mit 0.0573.
  //
  // DER WURZELFIX (nicht umschifft, §17): das Band der Leiste BLEIBT reserviert,
  // der Leser-Kopf legt sich darüber und verschluckt es (`--leser-v3-app-band`).
  // Sichtbar sind die 37 px trotzdem gewonnen — das misst (a) —, gesprungen ist
  // nichts. Nachher: 0 Sprünge von `main#inhalt`, Gesamt-CLS 0.0064–0.0071
  // @1440 und 0.0028–0.018 @390, also auf V1-Niveau.
  //
  // GEMESSEN WIRD DER EINE SPRUNG, NICHT DAS GESAMT-CLS — und das ist §0.3, nicht
  // Bequemlichkeit: das Gesamt-CLS derselben Seite mass in der defekten Fassung
  // 0.030 allein und 0.054 unter drei parallelen Workern (dieselbe Datei,
  // derselbe Build). Eine Zahl ohne Messbedingung wäre hier ein Flake-Generator;
  // die Frage «wandert der Inhaltsrahmen?» ist dagegen bedingungsfrei.
  // ROT ZU BEKOMMEN (§6.7, am 17.8.2026 gesehen): in `InhaltsKopf.tsx` dem
  // stillen Träger seine Höhe nehmen (`h-9 border-b border-transparent` weg) ⇒
  // ein Sprung mit 0.0238.
  test('(g) beim Laden wandert der Inhaltsrahmen nicht', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      const w = window as unknown as { __haupt: number[] }
      w.__haupt = []
      new PerformanceObserver((liste) => {
        type Shift = PerformanceEntry & {
          value: number; hadRecentInput: boolean; sources?: { node?: Node | null }[]
        }
        for (const e of liste.getEntries() as Shift[]) {
          if (e.hadRecentInput) continue
          const trifftMain = (e.sources ?? []).some((q) => (q.node as Element | null)?.id === 'inhalt')
          if (trifftMain) w.__haupt.push(e.value)
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
    await page.waitForTimeout(3000)

    const spruenge = await page.evaluate(() => (window as unknown as { __haupt: number[] }).__haupt)
    const summe = spruenge.reduce((s, v) => s + v, 0)
    // Gemessen 17.8.2026 @1440 StPO nach dem Wurzelfix: NULL Einträge. Die
    // Schranke lässt Chrom-Grundrauschen zu (Sub-Pixel-Rundung beim Einlaufen der
    // Webfont), aber nicht die weichende Leiste: die schlägt mit 0.0238 zu Buche,
    // also dem Fünffachen.
    expect(summe, `main#inhalt verschiebt sich um ${summe} — Sprünge ${JSON.stringify(spruenge)}; die weichende 37-px-Leiste kostet 0.0238`)
      .toBeLessThan(0.005)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  // ── (h) V2 · IM PANE GILT DIESELBE REGEL, GEMESSEN AN DER ELEMENTBREITE ────
  // Ein 700-px-Pane unterschreitet die 900-px-Schwelle und bekommt darum den
  // Zuschnitt `kompakt` — mit demselben Rücksprung wie das Handy, aus derselben
  // Funktion (`kopfStufen`, ResizeObserver am Rahmen; Kap. 10: keine
  // `imPane`-Verzweigung). Das ist der Fall, den A-2 unbemerkt gebrochen hatte:
  // im Split gab es über dem Kopf gar keine App-Leiste mehr, die hätte auffangen
  // können.
  test('(h) V2 · Pane unter 900 px trägt den Rücksprung «‹ Gesetze»', async ({ page }) => {
    test.slow() // zwei volle Leser-Instanzen
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO?leser=v3&p=/gesetze/bund/BGFA%3Fleser%3Dv3')
    await expect(page.locator('[data-pane="sekundaer"] [data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(800)

    for (const wahl of ['[data-pane="primaer"]', '[data-pane="sekundaer"]']) {
      const kopf = page.locator(`${wahl} [data-v3-kopf]`)
      // Positiv-Sonde: das Pane ist wirklich schmaler als 900 px — sonst prüfte
      // die Zeile darunter den Desktop-Zuschnitt und wäre grundlos grün.
      const breite = (await kopf.boundingBox())!.width
      expect(breite, `${wahl} ist ${breite} px breit — über der 900-px-Schwelle`).toBeLessThan(900)
      // §6.3-DEKLARATION D27 (6.9.2026): der Rücksprung stand bis 6.9. in JEDEM
      // Pane-Kopf. Er steht jetzt EINMAL in der Hauptnavigation — im Split ist
      // das der Gewinn, nicht der Verlust: zwei Panes trugen zwei Wege zum
      // selben Ziel (§5). Geprüft wird darum je Pane die Abwesenheit, und für
      // die Seite als ganze das Vorhandensein (unten).
      await expect(kopf.locator('[data-v3-kopf-krume-kurz]'),
        `${wahl} trägt wieder eine Krume`).toHaveCount(0)
      // D28: statt ihrer trägt jeder Pane-Kopf die Erlass-Suche.
      await expect(kopf.locator('[data-v3-such-zone] input')).toBeVisible()
    }
    // D27: der Weg zurück steht in der Hauptnavigation, die auf Leser-Seiten
    // eingeklappt startet — der Umschalter ist der eine Griff dahin (Fall (b)).
    await expect(page.getByRole('button', { name: 'Seitenleiste ein- und ausblenden' }).first())
      .toHaveCount(1)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  // ── (j) DIE RESERVIERUNG ÜBERLEBT JEDEN PFADWECHSEL (Cowork-Befund 1/53) ──
  //
  // BEFUND (externe Test-Session 18.8.2026, Mechanik dort vermessen): nach einem
  // Erlass-Wechsel (ZGB → OR) oder der Zurücktaste in einen zuvor besuchten
  // Erlass erschien die App-Krumen-Leiste im LAUTEN Zustand («‹ Gesetze › StPO ✕»,
  // z-19) GENAU AUF der V3-Werkzeugleiste (z-17, gleiches top 64 px) und
  // übermalte «Rechtsprechung» und «Ansicht»; ihr ✕ führte auf die Startseite
  // (Befunde 1, 4, 15, 17, 53). WURZEL im Code: die Shell setzt ihre Kopfdaten
  // bei JEDEM Pfadwechsel zurück (Shell.tsx, «frische Seite meldet neu»), aber
  // die Melde-Effekte des Lesers (`useKopfAnspruch`, Fassaden-Reservierung)
  // hingen nicht am Pfad — sie meldeten nur beim Mount, und der Leser bleibt
  // beim Erlass-Wechsel gemountet. Danach griff der `kopfVonPfad`-Fallback.
  // ROT ZU BEKOMMEN (§6.7, am 21.8.2026 gesehen): in `useKopfAnspruch.ts` den
  // `pathname` wieder aus den Deps nehmen ⇒ nach dem Wechsel misst `appLeisten` 1.
  test('(j) Erlass-Wechsel und Zurücktaste: die App-Leiste bleibt still', async ({ page }) => {
    test.slow() // drei Leser-Ladevorgänge in einer Sitzung
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/BGFA')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })

    // Client-seitiger Wechsel in einen ZWEITEN Erlass über die Fuss-Navigation
    // («<Kürzel> ›», exakt die Repro der Test-Session). Kein `page.goto`: ein
    // Vollreload wäre der Erstaufruf, den (a) schon prüft — der Befund braucht
    // den Route-Param-Wechsel bei GEMOUNTETEM Leser.
    await page.locator('nav[aria-label="Weitere Erlasse"] a').last().click()
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(400)
    let m = await chrome(page)
    expect(m.appLeisten, 'App-Leiste laut nach Erlass-Wechsel (Befund 1)').toBe(0)
    expect(m.appKrumen, 'zweite Krume nach Erlass-Wechsel').toBe(0)

    // Zurücktaste in den vorher besuchten Erlass (Befund 53).
    await page.goBack() // → BGFA, client-seitig (popstate)
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(400)
    m = await chrome(page)
    expect(m.appLeisten, 'App-Leiste laut nach Zurücktaste (Befund 53)').toBe(0)
    expect(m.appKrumen, 'zweite Krume nach Zurücktaste').toBe(0)
    // Und die Werkzeugleiste ist BEDIENBAR: der oberste Treffer am «Ansicht»-Griff
    // ist der Griff selbst, nicht der Container der App-Leiste (elementFromPoint —
    // exakt die Messung der Test-Session).
    const oben = await page.evaluate(() => {
      const griff = document.querySelector('[data-v3-kopf] [data-v3-ansicht]')
      if (!griff) return 'kein-griff'
      const r = griff.getBoundingClientRect()
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return el && (griff === el || griff.contains(el) || el.contains(griff)) ? 'griff' : `verdeckt:${el?.className}`
    })
    expect(oben, 'die V3-Werkzeugleiste ist übermalt').toBe('griff')

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  // ── (k) AUCH DER RÜCKWEG AUS ENTSCHEID/MATERIAL LÄSST DIE LEISTE STILL ────
  //
  // BEFUND David 21.8.2026 (nach dem (j)-Fix): «der gleiche bug … liegt noch
  // vor wenn ich von entscheid rückwärts auf das gesetz gehe». Gleiche Wurzel,
  // anderer Melder: EntscheidLeser/MaterialLeser räumten ihre Kopf-Meldung im
  // passiven Unmount-Cleanup — das lief NACH dem Layout-Effekt des wieder
  // montierten Gesetz-Lesers und wischte dessen Reservierung weg. ROT ZU
  // BEKOMMEN (§6.7, 21.8.2026 gesehen): das Cleanup in `EntscheidLeser.tsx`
  // wieder einsetzen ⇒ nach goBack misst `appLeisten` 1.
  test('(k) Entscheid öffnen und Zurücktaste: die App-Leiste bleibt still', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    // OR Art. 41: verlässliche «viele BGE»-Stelle (der Standard-Instanzfilter
    // zeigt nur BGE — ein Artikel ohne BGE-Treffer liesse den Test ohne Link
    // verhungern, gesehen 21.8. an SchKG Art. 10).
    await page.goto('/gesetze/bund/OR#art-41')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    // Panel öffnen und client-seitig in einen Entscheid navigieren.
    await page.locator('[data-v3-panel-oeffner]').click()
    const entscheid = page.locator('a[href^="/rechtsprechung/"]:visible').first()
    await expect(entscheid).toBeVisible({ timeout: 20_000 })
    await entscheid.click()
    await expect(page).toHaveURL(/\/rechtsprechung\//, { timeout: 20_000 })
    await page.waitForTimeout(400)
    // Zurück in den Gesetz-Leser (Befund-Repro).
    await page.goBack()
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(400)
    const m = await chrome(page)
    expect(m.appLeisten, 'App-Leiste laut nach Zurück aus dem Entscheid').toBe(0)
    expect(m.appKrumen, 'zweite Krume nach Zurück aus dem Entscheid').toBe(0)
    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  // ── (i) V1 · WO KEIN V3-KOPF STEHT, MUSS DIE APP-LEISTE ZURÜCKKOMMEN ──────
  //
  // BEFUND (Ästhetik-Review 17.8.2026): die Fassade meldete `kopfzeileSelbst`
  // UNBEDINGT — auf den drei Wegen, auf denen der Rahmen früh zurückkehrt
  // (Fehlseite · pdf-embed · nur-live-link), rendert sie aber nie eine Kopfzeile.
  // Gemessen 17.8.2026 an `/gesetze/bund/EMRK?leser=v3` (damalige Adresse; seit Befund 45 kanonisch `/gesetze/international/EMRK`): null Krumen, null ✕. Der Leser sass
  // auf einer Seite ohne jeden Weg zurück — in V1 trug die App-Leiste ihn.
  // Geprüft wird das SICHTBARE Ergebnis (Krume + Schliessen), nicht die Meldung:
  // eine Sonde auf `kopfzeileSelbst` bliebe grün, wenn die Leiste aus einem
  // anderen Grund verschwände.
  // ZIEL-WECHSEL 14.9.2026 (QS-KORPUS, deklarierte Test-Änderung nach §6.3): die
  // pdf-embed-Sonde lief bis hierhin auf EMRK. Die EMRK ist seit PR #860 ein
  // regulärer Volltext-Snapshot (Fedlex registriert für die geltende
  // Konsolidierung 20220916 eine deutsche HTML-Manifestation) — sie rendert
  // darum einen V3-Kopf, und die Positiv-Sonde «hier steht KEIN V3-Kopf» kippte
  // zu Recht rot. Das VERHALTEN ist bewusst geändert, nicht der Test gebogen:
  // die Assertionen sind wörtlich dieselben, nur das Ziel ist der verbliebene
  // pdf-embed-Erlass NYÜ (SR 0.277.12, `PDF_EMBED_QUELLEN` in
  // `src/lib/normtext/pdf-embed.ts` — seit 14.9.2026 der einzige Eintrag).
  // Fällt auch NYÜ einmal auf Volltext, trägt diese Zeile keinen Fall mehr;
  // dann als «(i)-entfällt» mit Datum begründen, nicht stillschweigend löschen.
  for (const [name, pfad] of [
    ['pdf-embed (NYÜ)', '/gesetze/international/NYUE'],
    ['nur-live-link (DSGVO)', '/gesetze/international/DSGVO'],
    ['Fehlseite', '/gesetze/bund/GIBTSNICHT'],
  ] as const) {
    test(`(i) V1 · ${name}: App-Krume und ✕ sind da`, async ({ page }) => {
      const fehler = fehlerSammeln(page)
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(pfad)
      // Positiv-Sonde: es steht wirklich KEIN V3-Kopf auf dieser Seite — sonst
      // prüfte der Test den Normalfall.
      await expect(page.locator('[data-inhalt-kopf]')).toBeVisible({ timeout: 20_000 })
      await page.waitForTimeout(600)
      await expect(page.locator('[data-v3-kopf]'), 'diese Ansicht rendert doch einen V3-Kopf').toHaveCount(0)
      await expect(page.locator('[data-inhalt-kopf-still]'), 'die Leiste schweigt weiterhin').toHaveCount(0)

      const leiste = page.locator('[data-inhalt-kopf]')
      await expect(leiste.locator('nav')).toHaveCount(1)
      const text = (await leiste.innerText()).replace(/\s+/g, ' ')
      expect(text, `App-Leiste: «${text}»`).toContain('Gesetze')
      await expect(leiste.getByRole('link', { name: 'Gesetze' })).toHaveAttribute('href', '/gesetze')
      // Ein Schliess-Griff — der Weg zurück, der auf diesen Seiten fehlte.
      await expect(leiste.getByRole('button', { name: /schliessen/i })).toHaveCount(1)

      expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
    })
  }
})


// ═══════════════════════════════════════════════════════════════════════════
// TEIL 2 · Ä1 — der V3-Kopf sitzt bündig an der Leiste über ihm
// Wortlaut übernommen aus `e2e/leser-v3-kopf-buendig.e2e.ts` (31.8.2026, Runde 2 / Batch A);
// Datei-Kopf und Fälle unverändert, nur die Import-Zeilen sind oben
// zusammengeführt.
// ═══════════════════════════════════════════════════════════════════════════
// ─── Ä1 (LESER-V3 H2b) · KEINE LEERZONE UNTER DER KRUMEN-LEISTE ──────────────
//
// BEFUND, gemessen 17.8.2026 @1440 (StPO, `?leser=v3`): die Krumen-Leiste endet
// bei y = 102, der V3-Kopf begann bei y = 150 — 48 px Leerzone im RUHEZUSTAND,
// die beim ersten Scroll auf 0 px zusammenfiel (dort klebt der Kopf bei y = 100).
// Der Leser sah zwei verschiedene Bilder derselben Kopfzone, je nachdem ob er
// schon gescrollt hatte.
//
// URSACHE: die 48 px sind die obere Polsterung des Route-Wrappers
// (`components/layout/Shell.tsx`, `py-8 sm:py-12`); im Split-View-Pane sind es
// 24 px (`components/layout/Pane.tsx`, `py-6`). Sie gehört dem Seiteninhalt, nicht
// einer klebenden Leiste. Der V3-Kopf verschluckt sie über
// `--leser-v3-kopf-luecke` (Vorgabe in `src/index.css`, Pane-Wert inline vom
// Rahmen).
//
// WARUM DIESE SPEC UND NICHT EINE ZUSICHERUNG: der Wert ist an ZWEI fremde
// Polsterungen gekoppelt, die niemand für den Leser pflegt. Ändert eine davon,
// öffnet sich die Leerzone wieder — still. Die Spec MISST die Lücke auf allen
// drei Breiten gegen 0 statt sie zu behaupten.
//
// ROT ZU BEKOMMEN (§6.7): in `src/pages/gesetz-leser/v3/LeserKopf.tsx` die Zeile
// `marginTop: 'calc(-1 * var(--leser-v3-kopf-luecke, 0px))'` entfernen — dann
// misst der Fall (a) 48 px, (b) 32 px und (c) 24 px statt je 0.
//
// ── NACHGEFÜHRT AUF DIE A-2-WAHRHEIT (17.8.2026, Auftrag David) ──────────────
// Die Krumen-Leiste, an der der Kopf bündig sass, GIBT ES IN DER EINZELANSICHT
// NICHT MEHR (Leisten-Verschmelzung: die Seite trägt ihre Kopfzeile selbst).
// Damit hätte `luecke(page, '[data-inhalt-kopf]')` in (a)/(b) `NaN` gemessen —
// und `expect(NaN).toBeLessThanOrEqual(0)` ist rot, die Spec also nicht bloss
// stumm, sondern falsch. Nachgezogen wird der BEZUGSPUNKT, nicht die Schranke:
// oberhalb des Kopfes steht jetzt die Topbar, an ihr muss er bündig sitzen. Die
// Aussage ist unverändert streng («keine Leerzone, kein Verrutschen darunter»)
// und deckt seit A-2 sogar mehr, weil sie die neue Anschlusskante prüft.
// (c) bleibt Zeichen für Zeichen: im Pane bleibt die Titelleiste (sie trägt die
// Fenster-Steuerung) und damit der alte Bezugspunkt.

/** Lücke zwischen der Unterkante der Leiste ÜBER dem Kopf und dessen Oberkante.
 *  Seit A-2 ist das in der Einzelansicht die Topbar (`header.sticky`), im Pane
 *  weiterhin die Pane-Titelleiste. */
async function luecke(page: Page, obenWahl: string): Promise<number> {
  return page.evaluate((sel) => {
    const kopf = document.querySelector('[data-v3-kopf]')
    if (!kopf) return Number.NaN
    const kr = kopf.getBoundingClientRect()
    // ── §6.3-DEKLARATION (W2·24-R6c) · DER ANSCHLAG IST DER CHROME-STAPEL ──
    // `STAPEL` misst gegen die Unterkante DESSEN, was unmittelbar über dem
    // Leser-Kopf klebt — seit R2/D19 die Arbeitsleiste, seit R6/M10 zusätzlich
    // die Ausgabe-Zeile, davor die blosse Topbar. Herleitung und Messreihe:
    // s. `chrome()`. Ein fester Selektor bleibt möglich (Pane-Titelleiste im
    // Split), wo genau EIN Anschlag gemeint ist.
    if (sel !== '#stapel') {
      const oben = document.querySelector(sel)
      return oben ? Math.round(kr.top - oben.getBoundingClientRect().bottom) : Number.NaN
    }
    const topbar = document.querySelector('header.sticky')
    if (!topbar) return Number.NaN
    let unten = topbar.getBoundingClientRect().bottom
    for (const el of document.querySelectorAll('body *')) {
      const b = el.getBoundingClientRect()
      if (b.height < 4 || b.width < window.innerWidth * 0.9) continue
      if (b.top >= topbar.getBoundingClientRect().bottom - 1 && b.bottom <= kr.top + 1 && b.bottom > unten) unten = b.bottom
    }
    return Math.round(kr.top - unten)
  }, obenWahl)
}

/** Der Chrome-Stapel über dem Leser-Kopf — der Anschlag in der Einzelansicht
 *  (bis R6c die blosse Topbar; seither Topbar + Arbeitsleiste + Ausgabe-Zeile). */
const TOPBAR = '#stapel'

/** ── B3 (H2b-Nachzug) · ZWEISEITIG, NICHT NUR NACH OBEN ─────────────────────
 *  Die Zusicherung lautete `toBeLessThanOrEqual(0)` und war damit halb blind: sie
 *  blieb grün, wenn der Kopf UNTER die Krumen-Leiste rutscht — bei −40 px läge er
 *  hinter ihr, die Ortsangabe wäre verdeckt, und kein Tor hätte es gemerkt. Ein
 *  Tor, das nur eine Richtung kennt, bewacht die halbe Aussage (§6.7).
 *  DIE SCHRANKE: −2 … 0 px. Nach unten 0, weil eine positive Lücke der Befund
 *  ist; nach oben −2, weil der Kopf konstruktiv bündig anschliesst und 1–2 px
 *  Überlappung nur aus Sub-Pixel-Rundung entstehen könnten (gemessen 17.8.2026:
 *  0 px auf allen drei Breiten, keine Überlappung).
 *  ROT IN BEIDE RICHTUNGEN (§6.7), beides am 17.8.2026 gemessen:
 *   · NACH OBEN: in `v3/LeserKopf.tsx` die Zeile
 *     `marginTop: 'calc(-1 * var(--leser-v3-kopf-luecke, 0px))'` entfernen ⇒
 *     +48 px (a) / +32 px (b) / +24 px (c).
 *   · NACH UNTEN: `top: 'var(--leser-v3-kopf-top)'` auf `top: '0rem'` setzen ⇒
 *     im Ruhezustand 0 px, GESCROLLT −101 px (Messung 17.8.2026 vor A-2, Bezug
 *     Krumen-Leiste; seit A-2 ist der Bezug die Topbar, also −65 px): der Kopf
 *     klebt an der Fensterkante und schiebt sich unter die opake Leiste über
 *     ihm, die Ortsangabe ist verdeckt. GEGENPROBE, die NICHT trägt und darum hier
 *     steht: `marginTop: '-4rem'` bleibt grün — im Ruhezustand schluckt die
 *     Wrapper-Polsterung den Wert, im geklebten Zustand klemmt `top` ihn ab.
 *     Wer die untere Schranke prüfen will, muss also am `top` drehen. */
const LUECKE_MIN = -2
const LUECKE_MAX = 0

function buendig(px: number, wo: string): void {
  expect(px, `Leerzone ${wo}: ${px} px — erlaubt ist ${LUECKE_MIN} … ${LUECKE_MAX}`)
    .toBeLessThanOrEqual(LUECKE_MAX)
  expect(px, `Der Kopf rutscht unter die Krumen-Leiste (${wo}): ${px} px`)
    .toBeGreaterThanOrEqual(LUECKE_MIN)
}

test.describe('Ä1 — der V3-Kopf sitzt bündig an der Leiste über ihm', () => {
  test('(a) Einzelansicht @1440: im Ruhezustand UND gescrollt keine Leerzone', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })

    // A-2: die App-Krumen-Leiste ist weg — geprüft, damit der Bezugspunkt-Wechsel
    // unten nicht still an einer noch vorhandenen Leiste vorbeimisst.
    await expect(page.locator('[data-inhalt-kopf]')).toHaveCount(0)
    const ruhe = await luecke(page, TOPBAR)
    buendig(ruhe, 'Ruhezustand @1440 (war 48 px vor H2b, Bezug seit A-2 die Topbar)')

    // Und im geklebten Zustand ebenfalls — sonst wäre der Ruhezustand nur zufällig
    // richtig und das Bild sprang beim Scrollen weiterhin.
    await page.evaluate(() => window.scrollBy(0, 1200))
    await page.waitForTimeout(300)
    buendig(await luecke(page, TOPBAR), 'nach 1200 px Scroll @1440')

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(b) Handy @390: dieselbe Bündigkeit bei kleinerer Wrapper-Polsterung', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/BGFA')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })

    await expect(page.locator('[data-inhalt-kopf]')).toHaveCount(0)
    buendig(await luecke(page, TOPBAR), '@390 (Wrapper dort py-8 = 32 px)')

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  test('(c) Split-View: der Kopf des Panes sitzt bündig an der Pane-Titelleiste', async ({ page }) => {
    test.slow() // zwei volle Leser-Instanzen
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto('/gesetze/bund/BGFA?leser=v3&p=/gesetze/bund/BGBM%3Fleser%3Dv3')
    await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-pane="sekundaer"] [data-v3-kopf]')).toBeVisible({ timeout: 20_000 })

    // Im Pane ist der Bezugspunkt die Pane-Titelleiste (PaneKopf) statt der
    // App-Krume: sie liegt AUSSERHALB des Pane-Scrollers und ist dort die Kante,
    // an der der V3-Kopf klebt (`--leser-v3-kopf-top: 0`).
    const paneLuecke = await page.evaluate(() => {
      const pane = document.querySelector('[data-pane="sekundaer"]')
      const scroller = pane as HTMLElement | null
      const kopf = pane?.querySelector('[data-v3-kopf]')
      if (!scroller || !kopf) return Number.NaN
      return Math.round(kopf.getBoundingClientRect().top - scroller.getBoundingClientRect().top)
    })
    buendig(paneLuecke, 'im Pane (Wrapper dort py-6 = 24 px)')

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  // ── A4 (H2b-Nachzug) · DIE KENNUNG WIRD NIE ELLIPSIERT ────────────────────
  // BEFUND, gemessen 17.8.2026 @1440 am LugÜ: Ä21 gab dem Kürzel `min-w-0
  // truncate`, und in einer Zone mit ZWEI truncate-Geschwistern verteilt Flexbox
  // den Platzmangel auf beide — das vier Zeichen kurze «LugÜ» wurde zu «Lu…»
  // (`scrollWidth` 29 in `clientWidth` 23). Ausgerechnet die Kennung, die Ä-(d)
  // im Titel gerade nach vorn gezogen hat, verschwand als erste.
  // ROT ZU BEKOMMEN (§6.7): in `v3/LeserKopf.tsx` die Klassenwahl am
  // `data-v3-kopf-kuerzel` wieder fest auf `min-w-0 truncate` setzen — dann misst
  // der Fall LugÜ @1440 erneut 29 in 23.
  test('(d) das Erlass-Kürzel im Kopf ist nie angeschnitten (LugÜ · StPO · ZH-211.11)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    for (const [pfad, kuerzel, breite] of [
      ['/gesetze/international/LUGUE', 'LugÜ', 1440],
      ['/gesetze/bund/STPO', 'StPO', 1440],
      ['/gesetze/kanton/ZH-211.11', null, 1440],
      ['/gesetze/international/LUGUE', 'LugÜ', 390],
    ] as const) {
      await page.setViewportSize({ width: breite, height: 900 })
      await page.goto(pfad)
      const el = page.locator('[data-v3-kopf-kuerzel]')
      await expect(el).toBeVisible({ timeout: 20_000 })
      const mass = await el.evaluate((n) => ({
        text: n.textContent ?? '', sw: n.scrollWidth, cw: n.clientWidth,
      }))
      // ZH-211.11 trägt als Kürzel den ganzen Namen (45 Zeichen) — dort DARF
      // gekürzt werden, dann ist das Kürzel der Titel und es gibt keinen zweiten.
      // Geprüft wird also nur, wo eine echte KENNUNG steht.
      if (kuerzel === null) {
        expect(mass.text.length, 'ZH-211.11 trägt kein langes Kürzel mehr — Fall untauglich')
          .toBeGreaterThan(20)
        continue
      }
      expect(mass.text.trim(), `${pfad}: falsches Kürzel im Kopf`).toBe(kuerzel)
      expect(mass.sw, `${pfad} @${breite}: «${kuerzel}» ist ellipsiert (${mass.sw} in ${mass.cw})`)
        .toBeLessThanOrEqual(mass.cw)
    }

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })

  // ── (e) V6 (Nachzug 17.8.2026) · DER KOPF WÄCHST, DER TEXT BLEIBT STEHEN ───
  //
  // BEFUND des Ästhetik-Reviews, gemessen @1440 an der StPO: klappt man die
  // Gliederung ein, verliert der Leser die Spalte — und der klebende Kopf-BLOCK
  // übernimmt dafür die Such-Zone (Ä19). Er wächst von 121 auf 164 px. Der
  // Lesetext rutscht um dieselben ~43 px nach unten, die Scroll-Position bleibt
  // aber stehen: `#art-429` lag vorher bündig unter dem Kopf (y = 120) und danach
  // DAHINTER. Wer die Gliederung ausblendet, um mehr Text zu sehen, verliert als
  // erstes die Überschrift, an der er gerade las.
  //
  // GEPRÜFT WIRD DIE ZUSAGE, NICHT DIE ZAHL (§0.3): «der Artikelkopf, der vor dem
  // Umschalten sichtbar unter dem Kopf stand, steht danach immer noch unter ihm».
  // Eine feste Pixeldifferenz wäre an Schriftskala und Such-Zustand gebunden und
  // liefe bei der nächsten Höhenänderung falsch — die Aussage nicht.
  // Beide Richtungen, weil der Ausgleich in beide funktionieren muss: zuklappen
  // (Kopf wächst) und wieder aufklappen (Kopf schrumpft).
  //
  // ROT ZU BEKOMMEN (§6.7): in `v3/LeserRahmenV3.tsx` die drei `setzeTocOffen`
  // wieder durch `m.setTocOffen` ersetzen (oder in `v3/useStickAusgleich.ts` das
  // `scrollBy` streichen) ⇒ der Artikelkopf liegt nach dem Zuklappen hinter dem
  // Kopf, die Differenz ist die Höhe der Such-Zone.
  test('(e) V6 · Gliederung umschalten schiebt den gelesenen Artikel nicht unter den Kopf', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO#art-429')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('#art-429')).toBeAttached({ timeout: 20_000 })
    await page.waitForTimeout(1200) // der Anker-Sprung hat zwei Nachläufe

    /** Unterkante des klebenden Blocks und Oberkante des gelesenen Artikels. */
    const lage = () => page.evaluate(() => {
      const kopf = document.querySelector('[data-v3-kopf]')!.getBoundingClientRect()
      const art = document.querySelector('#art-429')!.getBoundingClientRect()
      return { kopfUnten: kopf.bottom, artOben: art.top, kopfHoehe: kopf.height }
    })

    // Vorbedingung (§6.7): der Artikel steht WIRKLICH sichtbar unter dem Kopf —
    // sonst prüfte der Test eine Lage, in der es nichts zu verlieren gibt.
    const vorher = await lage()
    expect(vorher.artOben, `Vorbedingung: #art-429 steht bei ${vorher.artOben}, Kopf endet bei ${vorher.kopfUnten}`)
      .toBeGreaterThanOrEqual(vorher.kopfUnten - 2)
    expect(vorher.artOben, 'Vorbedingung: #art-429 liegt nicht im Bild').toBeLessThan(900)

    // ── §6.3-DEKLARATION D28 (David 6.9.2026) · DIE URSACHE IST WEG ─────────
    // Hier stand als Vorbedingung «der Kopf ist GEWACHSEN» — der Ä19-Zustand:
    // beim Einklappen übernahm der Kopf-Block die Such-Zone und wuchs von 121
    // auf 164 px, worauf `useStickAusgleich` den Scroll nachziehen musste.
    // Seit D28 trägt der Kopf die Zone IMMER; gemessen 6.9.2026 @1440 (STPO):
    // Kopfhöhe vor und nach dem Einklappen **101 → 101 px**. Die Zusage dieses
    // Falls — «der Artikel, an dem ich lese, steht danach immer noch unter dem
    // Kopf» — ist damit nicht schwächer, sondern auf dem kürzeren Weg erfüllt:
    // es gibt nichts mehr auszugleichen. Die Vorbedingung wird darum
    // UMGEDREHT, nicht gestrichen; sie meldet ab hier jede Rückkehr der
    // lagen-abhängigen Kopfhöhe. `useStickAusgleich` bleibt in Kraft und
    // notwendig — der zweite Auslöser, das Beiwerk-Blatt (`rohPanel.offen`),
    // ist unberührt.
    await page.locator('[data-v3-gliederung-zu]').click()
    await expect(page.locator('[data-v3-aside]')).toHaveCount(0)
    await page.waitForTimeout(400)
    const zu = await lage()
    expect(zu.kopfHoehe, `D28: der Kopf ändert beim Klappen seine Höhe (${vorher.kopfHoehe} → ${zu.kopfHoehe})`)
      .toBe(vorher.kopfHoehe)
    expect(zu.artOben, `#art-429 liegt nach dem Zuklappen bei ${zu.artOben}, der Kopf endet bei ${zu.kopfUnten}`)
      .toBeGreaterThanOrEqual(zu.kopfUnten - 2)

    // AUFKLAPPEN — der Kopf schrumpft, und der Artikel bleibt wieder stehen.
    // Ä79 (H4-II, 17./18.8.2026): der Griff heisst hier seit dem Fix
    // `[data-v3-gliederung-schiene]` statt `[data-v3-gliederung-auf]`. Das ist
    // KEINE Aufweichung der Aussage (§6.3): beide hingen am selben
    // `setzeTocOffen(true)` des Rahmens und standen @1440 GLEICHZEITIG da — zwei
    // ☰ für eine Handlung, 933 px auseinander an gegenüberliegenden
    // Fensterkanten. Der Kopf-☰ weicht dort, wo die beschriftete Schiene
    // dasselbe tut; die Zusage DIESES Tests (der Höhenausgleich aus
    // `useStickAusgleich`) ist unverändert und wird unverändert gemessen.
    await page.locator('[data-v3-gliederung-schiene]').click()
    await expect(page.locator('[data-v3-aside]')).toHaveCount(1)
    await page.waitForTimeout(400)
    const auf = await lage()
    expect(auf.artOben, `#art-429 liegt nach dem Aufklappen bei ${auf.artOben}, der Kopf endet bei ${auf.kopfUnten}`)
      .toBeGreaterThanOrEqual(auf.kopfUnten - 2)
    expect(auf.artOben, 'nach dem Aufklappen aus dem Bild gescrollt').toBeLessThan(900)

    expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
  })
})
