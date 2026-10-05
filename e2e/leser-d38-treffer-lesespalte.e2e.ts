// @shard-gruppe: 6
// ═══ D38 (David 7.9.2026) · DIE TREFFER ERSETZEN DEN GESETZESTEXT ═══════════
//
// BEFUND, wörtlich: «die suchresultate die erscheinen wenn man im gesetz sucht
// sollen nicht in der gliederung erscheinen sondern den gesetzestext ersetzen».
//
// VIER ZUSAGEN, die diese Spec einzeln nachmisst — jede war vor D38 falsch:
//  (a) ORT. Die Trefferliste liegt über der LESESPALTE, nicht in der Gliederung.
//  (b) DIE GLIEDERUNG BLEIBT. Derselbe Baum, dieselbe Zeilenzahl, «alles auf/zu»
//      bedienbar — vor D38 verschwand er beim ersten Tastendruck.
//  (c) SPRUNG ZURÜCK OHNE POSITIONSVERLUST. Suchen und wieder verlassen (Esc)
//      lässt den Lesetext auf den Pixel dort, wo er stand.
//  (d) LAYOUT-SHIFT 0 beim Umschalten Text↔Treffer.
//  (f) ↑↓ FÜHREN DIE LAUFENDE STELLE MIT. Solange die Liste die Lesefläche hat,
//      ist sie das, was der Leser beim Schreiten ANSIEHT — eine Hervorhebung
//      ausserhalb ihres Scrollers wäre eine Rückmeldung, die niemand bekommt.
//
// WARUM IM BROWSER: (a) ist eine Frage nach Vorfahren im gerenderten Baum, (c)
// misst Rechtecke gegen den Viewport, (d) ist eine Browser-Metrik. Nichts davon
// sieht ein Unit-Test.
//
// ROT ZU BEKOMMEN (§6.7) — je Zusage ein Handgriff, alle vier vor dem Bau bzw.
// am Zwischenstand gesehen:
//  (a)/(b) in `v3/LeserGliederung.tsx` den Suchzweig von vor D38 wieder
//      einsetzen (`if (m.sucheAktiv) return <LeserTrefferListe …/>`) ⇒ die Liste
//      hat wieder `[data-v3-aside]` als Vorfahren und der Baum ist weg.
//  (c) die verworfene Bauart bauen — AUSTAUSCH statt Überlagerung: in
//      `v3/LeserLeseZeile.tsx` `<div className="space-y-5">{zelle}</div>` gegen
//      `{!trefferSpalte && <div className="space-y-5">{zelle}</div>}` tauschen
//      ⇒ der Gesetzestext ist während der Suche ausgehängt, (c) meldet «der
//      Gesetzestext ist ausgehängt».
//      ZWEI HANDGRIFFE, DIE NICHT GENÜGEN, beide am Zwischenstand gemessen
//      (7.9.2026) — sie stehen hier, damit niemand sie für den Rot-Beweis hält:
//      (i) `absolute` → `relative` allein: der Slot ist das LETZTE Kind der
//      Zelle, die Liste hinge also UNTER dem Text und verschöbe ihn nicht;
//      (ii) die Liste zusätzlich in den Fluss VOR die Zelle ziehen: dann wächst
//      der Inhalt oberhalb des Sichtfelds, und Chromes Scroll-Anchoring hält
//      die Bildlage von selbst — grün. Nur der Austausch nimmt dem Dokument
//      seine Höhe, und genau das ist der Fall, den (c) ausschliesst.
//  (f) in `v3/LeserTrefferSpalte.tsx` den `useEffect` mit der `scrollTop`-
//      Rechnung entfernen ⇒ die aktive Zeile wandert beim Schreiten aus dem
//      Scroller heraus und (f) meldet ihre Lage.
//  (d) in `LeserRahmenV3.tsx` `zoneHoch: feldGefuellt` gegen
//      `zoneHoch: feldGefuellt && !trefferSteht` tauschen ⇒ die Such-Zone springt
//      beim Umschalten um 24 px und (d) meldet die Verschiebung.
//      NICHT über CLS zu fangen, und das ist der Grund für die Bauart von (d):
//      jedes Umschalten ist eine Nutzergeste, und der Browser verwirft jeden
//      Shift innerhalb von 500 ms nach einer Eingabe (`hadRecentInput`). Die
//      erste Fassung von (d) mass nur CLS und blieb mit dem Defekt GRÜN
//      (gemessen 7.9.2026). Gemessen wird darum die GEOMETRIE — was der Leser
//      sieht —, und der CLS-Beobachter läuft nur noch als Beifang mit.
import { test, expect, type Page } from '@playwright/test'
import { clsAuslesen, clsBeobachtenInstallieren } from './helpers/cls'

const BEGRIFF = 'Kündigung'

async function warteLeser(page: Page, pfad = '/gesetze/bund/OR'): Promise<void> {
  await page.goto(pfad)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000 })
  await expect(page.locator('[data-v3-suchsprung] input').first()).toBeVisible({ timeout: 20000 })
  await page.evaluate(() => document.fonts?.ready)
}

/** Tippen und warten, bis die entprellten Treffer stehen (nicht nur «sucht …»). */
async function suche(page: Page, wort = BEGRIFF): Promise<void> {
  const feld = page.locator('[data-v3-suchsprung] input').first()
  await feld.click()
  await feld.fill(wort)
  await expect(page.locator('[data-treffer-liste]').first()).toBeVisible({ timeout: 20000 })
}

test('(a) die Trefferliste liegt über der Lesespalte — und nirgends sonst', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)
  // POSITIV-Vorbedingung: die Gliederungs-Spalte steht überhaupt (§6.7) — sonst
  // wäre «die Liste ist nicht in ihr» trivial wahr.
  await expect(page.locator('[data-v3-aside]')).toHaveCount(1)
  await suche(page)

  // GENAU EINE Liste im Dokument. Zwei wären die Doppelwahrheit, die schon vor
  // D38 ausgeschlossen war (§5) — nur stand die eine damals am falschen Ort.
  await expect(page.locator('[data-treffer-liste]')).toHaveCount(1)

  const ort = await page.locator('[data-treffer-liste]').evaluate((el) => ({
    inSpalte: !!el.closest('[data-v3-treffer-spalte]'),
    inAside: !!el.closest('[data-v3-aside]'),
    inSheet: !!el.closest('[data-gliederung-sheet]'),
  }))
  expect(ort.inSpalte, 'die Liste liegt nicht über der Lesespalte').toBe(true)
  expect(ort.inAside, 'die Liste steht in der Gliederung — genau das ist der Befund').toBe(false)
  expect(ort.inSheet, 'die Liste steckt im Gliederungs-Sheet').toBe(false)

  // Sie DECKT den Text: ein Punkt mitten im Satzspiegel trifft die Liste, nicht
  // den Wortlaut. «Ersetzen» ist damit gemessen und nicht behauptet.
  const getroffen = await page.evaluate(() => {
    const spalte = document.querySelector('#lc-lesespalte')
    if (!spalte) return 'keine Lesespalte'
    const r = spalte.getBoundingClientRect()
    const el = document.elementFromPoint(Math.round(r.left + r.width / 2), 400)
    return el?.closest('[data-v3-treffer-spalte]') ? 'TREFFER' : 'text'
  })
  expect(getroffen, 'mitten im Satzspiegel steht noch der Gesetzestext').toBe('TREFFER')

  // Und sie steht IM Bild: der Kopf der Liste liegt unter dem klebenden
  // Kopf-Block und über der Falz — sonst wäre sie da und doch nicht zu sehen
  // (der Ä76-Befund «resultat ist versteckt» in Zahlen).
  const kopf = await page.locator('[data-treffer-liste] [data-treffer-leiste], [data-treffer-liste]').first()
    .evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { t: Math.round(r.top), vh: window.innerHeight }
    })
  expect(kopf.t, `Listenkopf unter der Falz: y = ${kopf.t} bei ${kopf.vh} px Fensterhöhe`)
    .toBeLessThan(kopf.vh / 2)
  expect(kopf.t, `Listenkopf über dem Fensterrand: y = ${kopf.t}`).toBeGreaterThanOrEqual(0)
})

test('(b) die Gliederung bleibt während der Suche unverändert und bedienbar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)

  const baumZeilen = () => page.locator('[data-v3-leiste-baum] button').count()
  const vorher = await baumZeilen()
  expect(vorher, 'kein Gliederungsbaum — Vorbedingung fehlt (§6.7)').toBeGreaterThan(3)
  // «alles auf/zu» ist da, und zwar VOR der Suche.
  await expect(page.locator('[data-v3-alle]')).toHaveCount(1)

  await suche(page)

  expect(await baumZeilen(), 'der Baum hat während der Suche Zeilen verloren').toBe(vorher)
  // Ä32 ist mit seinem Anlass gefallen: der Knopf steht auch während der Suche,
  // weil er jetzt wieder auf einen Baum zeigt, der wirklich dasteht.
  await expect(page.locator('[data-v3-alle]'),
    '«alles auf/zu» verschwindet während der Suche').toHaveCount(1)
  // Ä10 ebenso: die Zone heisst «Gliederung», nicht «Treffer».
  await expect(page.locator('[data-v3-leiste-baumkopf] h2')).toHaveText('Gliederung')

  // BEDIENBAR, nicht nur sichtbar: ein Klick in den Baum klappt auf/zu, ohne
  // dass die Suche endet.
  await page.locator('[data-v3-alle]').click()
  await expect.poll(baumZeilen, { timeout: 10000 }).not.toBe(vorher)
  await expect(page.locator('[data-v3-suchsprung] input').first()).toHaveValue(BEGRIFF)
})

test('(c) Esc gibt den Text an genau der Stelle frei, an der er stand', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)

  // Erst ein Stück lesen — bei scrollY 0 wäre «keine Positionsverschiebung»
  // trivial erfüllt (§6.7).
  await page.evaluate(() => window.scrollTo(0, 4000))
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)

  // ── WARUM DIE LAGE IM BILD UND NICHT `scrollY` ────────────────────────────
  // Die Such-Zone im klebenden Kopf wächst beim ersten Zeichen von
  // `SUCH_H_RUHE` (2.75 rem) auf `SUCH_H_AKTIV` (4.25 rem) — 24 px, die Chromes
  // Scroll-Anchoring aus `scrollY` herausrechnet, damit der Leser NICHTS wandern
  // sieht. Eine Zusicherung auf gleichbleibendes `scrollY` verlangte hier also
  // das Gegenteil dessen, was die Zusage verspricht. Gemessen wird darum die
  // Grösse, um die es geht: wo steht ein Artikel im Bild (so schon
  // `leser-v3-suche-ohne-gliederung` (d), §5 — eine Messart für eine Frage).
  const zeuge = page.locator('#lc-lesespalte [id^="art-"]').first()
  const lage = () => zeuge.evaluate((el) => Math.round(el.getBoundingClientRect().top))
  const vorher = await lage()

  await suche(page)
  await expect(page.locator('[data-v3-treffer-spalte]')).toHaveCount(1)
  // ZUERST: steht der Gesetzestext überhaupt noch? Ein Austausch statt einer
  // Überlagerung fiele hier auf — und zwar als Aussage, nicht als Zeitablauf
  // (die erste Fassung mass gleich die Lage und lief in den 30-s-Timeout, weil
  // der Zeuge gar nicht mehr existierte; eine Fehlermeldung, die die Ursache
  // nicht nennt, ist ein halbes Tor).
  expect(await page.locator('#lc-lesespalte [id^="art-"]').count(),
    'der Gesetzestext ist ausgehängt — die Leseposition liesse sich nur noch rekonstruieren')
    .toBeGreaterThan(0)
  // Der Text ist verdeckt, aber nicht bewegt: schon WÄHREND der Suche steht der
  // Zeuge an seinem Platz. Genau daran hängt, dass Esc nichts wiederherstellen
  // muss (Herleitung in `v3/LeserTrefferSpalte.tsx`).
  expect(Math.abs(await lage() - vorher),
    `das Öffnen der Liste hat den Text bewegt: ${vorher} → ${await lage()}`).toBeLessThanOrEqual(2)

  await page.locator('[data-v3-suchsprung] input').first().press('Escape')
  await expect(page.locator('[data-v3-treffer-spalte]')).toHaveCount(0)
  await expect(page.locator('[data-v3-suchsprung] input').first()).toHaveValue('')
  const nachher = await lage()
  expect(Math.abs(nachher - vorher),
    `Esc hat den Lesetext bewegt: ${vorher} px → ${nachher} px im Bild`).toBeLessThanOrEqual(2)
})

test('(d) Umschalten Text↔Treffer verschiebt nichts — weder Kopf noch Text', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)
  await page.evaluate(() => window.scrollTo(0, 4000))
  await suche(page)

  // ── DAS MESSFENSTER ENTHÄLT KEINEN SPRUNG (gemessen 7.9.2026) ─────────────
  // Die erste Fassung schaltete hier um und benutzte dafür ↵ — das ist aber
  // eine SPRUNG-Geste: sie scrollt zur nächsten Fundstelle, und die Gliederung
  // daneben klappt dem neuen Ort nach (`tocAutoZuklappen`). Gemessen wurden so
  // CLS 0.0039 aus verschwindenden Baumzeilen bei x = 184 — ein Shift des
  // MITSCROLLENS, nicht des Umschaltens. Er ist eine Folge davon, dass die
  // Gliederung während der Suche überhaupt noch dasteht (D38, und genau so
  // gewollt), liegt weit unter dem Budget 0.05 und gehört nicht in diesen Test.
  // DARUM: erst springen, dann scharf schalten — und danach nur noch Wege
  // benutzen, die NICHT springen (Zähler-Zeile auf, Esc in der Liste zu).
  await page.locator('[data-v3-suchsprung] input').first().press('Enter')
  await expect(page.locator('[data-v3-treffer-spalte]')).toHaveCount(0)
  await page.waitForTimeout(800)
  await clsBeobachtenInstallieren(page, false, true)

  // Zwei Zeugen: die Höhe des klebenden Kopf-Blocks (dort sass der 24-px-Sprung)
  // und die Lage eines Artikels IM DOKUMENT.
  // WARUM DOKUMENT- UND NICHT BILDKOORDINATEN — hier anders als in (c): die
  // Dokumentlage ist unabhängig davon, wohin gerade gescrollt wurde, und genau
  // sie verschiebt ein wachsender oder schrumpfender Kopf-Block. Sie ist damit
  // der schärfere Zeuge für «die Geometrie hat sich geändert».
  const zeuge = page.locator('#lc-lesespalte [id^="art-"]').first()
  const mass = async () => ({
    zone: await page.locator('[data-v3-such-zone]').evaluate(
      (el) => Math.round(el.getBoundingClientRect().height)),
    art: await zeuge.evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY)),
  })
  const imText = await mass()

  // Weg hinein: die Zähler-Zeile am Feld — sie springt nicht, sie zeigt nur.
  const weg = page.locator('[data-v3-treffer-weg]')
  await expect(weg).toBeVisible()
  await weg.click()
  await expect(page.locator('[data-v3-treffer-spalte]')).toHaveCount(1)
  const mitListe = await mass()
  expect(mitListe.zone, `die Such-Zone springt beim Umschalten: ${imText.zone} → ${mitListe.zone} px`)
    .toBe(imText.zone)
  expect(Math.abs(mitListe.art - imText.art),
    `der Text rutscht beim Umschalten: ${imText.art} → ${mitListe.art} px im Dokument`).toBeLessThanOrEqual(2)

  // Weg hinaus OHNE Sprung: Esc IN der Liste nimmt die Liste, sonst nichts.
  await page.locator('[data-v3-treffer-spalte] [data-treffer-artikel] button').first().focus()
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-v3-treffer-spalte]')).toHaveCount(0)
  const zurueck = await mass()
  expect(zurueck.zone, `Such-Zone zurück: ${mitListe.zone} → ${zurueck.zone} px`).toBe(imText.zone)
  expect(Math.abs(zurueck.art - imText.art),
    `der Text rutscht zurück: ${imText.art} → ${zurueck.art} px im Dokument`).toBeLessThanOrEqual(2)

  await page.waitForTimeout(500)
  const { cls, bericht } = await clsAuslesen(page)
  expect(cls, `eingabe-ferner Layout-Shift beim Umschalten — ${bericht}`).toBeLessThanOrEqual(0.001)
})

test('(e) @390: die Treffer stehen in der Lesespalte, das Sheet bleibt die Gliederung', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await warteLeser(page)
  await suche(page)

  // Kein Sheet von selbst — die Liste steht im Text, nicht hinter einer Geste.
  await expect(page.locator('[data-gliederung-sheet]')).toHaveCount(0)
  const ort = await page.locator('[data-treffer-liste]').evaluate(
    (el) => !!el.closest('[data-v3-treffer-spalte]'))
  expect(ort, '@390 liegt die Liste nicht über der Lesespalte').toBe(true)

  // ☰ öffnet weiterhin die GLIEDERUNG, auch während einer Suche — vor D38 stand
  // dort die Trefferliste und der Baum war unerreichbar.
  await page.locator('[data-v3-gliederung-auf]').click()
  const sheet = page.locator('[data-v3-leiste]')
  await expect(sheet).toBeVisible({ timeout: 15000 })
  await expect(sheet.locator('[data-treffer-liste]'), 'im Sheet steht die Trefferliste').toHaveCount(0)
  await expect(sheet.locator('[data-v3-leiste-baum] button').first()).toBeVisible()
  await expect(page.locator('[data-v3-alle]'), '«alles auf/zu» fehlt im Sheet').toHaveCount(1)
})

test('(f) ↑↓ führen die laufende Fundstelle in der Liste mit', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)
  await suche(page)

  const scroller = page.locator('[data-v3-treffer-spalte-scroller]')
  const vor = page.locator('[data-treffer-vor]')
  await expect(vor, 'kein ↓-Griff — Vorbedingung fehlt (§6.7)').toHaveCount(1)

  // Weit genug schreiten, dass die aktive Zeile ohne Mitführen längst unter der
  // Kante des Scrollers läge (die Liste ist auf dem OR mehrere tausend Pixel
  // hoch, der Scroller rund 710).
  for (let i = 0; i < 12; i += 1) await vor.click()
  await page.waitForTimeout(400)

  const lage = await scroller.evaluate((s) => {
    // §6.3-DEKLARATION (W2·17-UI-BEFUNDE PE-C5-B01, 1.10.2026): hier stand die
    // Selektorliste `a, b` — `querySelector` liefert damit das ERSTE Element in
    // Dokument-Reihenfolge, und der Artikel-KOPF steht vor seinen Stellen. Der
    // Fall mass dadurch denselben Kopf wie der Fix in `LeserTrefferSpalte` und
    // konnte den Fehler nicht sehen (§6.7: ein Tor, das nicht scheitern kann).
    // Jetzt Vorrang für die STELLE, der Kopf nur als Ersatz; die Prüfaussage
    // («die laufende Zeile liegt im Scroller») bleibt dieselbe, nur trifft sie
    // jetzt die richtige Zeile. Der Scharfbeweis steht in (g).
    const el = s.querySelector('[data-treffer-stelle-aktiv]') ?? s.querySelector('[data-treffer-aktiv]')
    if (!el) return null
    const z = el.getBoundingClientRect()
    const k = s.getBoundingClientRect()
    return { drin: z.top >= k.top - 1 && z.bottom <= k.bottom + 1, z: Math.round(z.top), k: Math.round(k.top), kb: Math.round(k.bottom) }
  })
  expect(lage, 'keine aktive Zeile in der Liste').not.toBeNull()
  expect(lage!.drin, `aktive Zeile ausserhalb des Scrollers: ${JSON.stringify(lage)}`).toBe(true)
})

// ═══ W2·17-UI-BEFUNDE · SUCH-NAVIGATION (Befunde PE-C4/C5/C6/C7/C8, 1.10.2026) ═
//
// Jeder Fall gegen den Zustand, der den Befund gezeigt hat (Messreihen in den
// Befund-Dateien); die reinen Zustands-Regeln sitzen zusätzlich als Unit-Sonden
// in `src/tests/leser-suchnavigation-w217.test.tsx`. Hier steht, was nur der
// Browser sieht: Geometrie, Fokus, Bildlage.
//
// ROT ZU BEKOMMEN (§6.7) — je Fall ein Handgriff in `src/`, nie in `dist/`
// (die Spec baut vor dem Lauf neu):
//  (g) `v3/LeserTrefferSpalte.tsx`: die zwei `querySelector` zurück auf die eine
//      Liste `'[data-treffer-stelle-aktiv], [data-treffer-aktiv]'` ⇒ die laufende
//      Stelle wandert aus dem Scroller, (g) meldet ihre Lage.
//  (h) `v3/LeserTrefferListe.tsx`: `Math.max(…, aktivIdx + 1)` im Deckel
//      streichen ⇒ nach dem Sprung auf die letzte Fundstelle steht keine Zeile
//      hervorgehoben da.
//  (i) `v3/LeserTrefferSpalte.tsx`: Anker `sticky h-0` und `absolute` zurück auf
//      den `sticky`-Scroller ⇒ am Seitenende liegt das Segment über der Kante.
//  (j) `inhalt-suchtreffer.tsx` / `v3/useTrefferSicht.ts`: die Zeile mit dem
//      Rücksetzen beim leeren Feld streichen ⇒ Schalter bleibt «aus», Liste weg.
//  (k) `inhalt-suchtreffer.tsx`: `&& nav.bereich === bereich` streichen.
//  (l) `v3/SuchBereichWahl.tsx`: den `onKeyDown` streichen.
//  (m) `v3/SuchZone.tsx`: `after:`-Klassen von `SCHRITT` bzw. den `clip-path`
//      der Zone streichen.

async function laufendeStelleInListe(page: Page) {
  return page.locator('[data-v3-treffer-spalte-scroller]').evaluate((s) => {
    const st = s.querySelector('[data-treffer-stelle-aktiv]')
    const k = s.getBoundingClientRect()
    const rest = s.querySelector('[data-treffer-stellen-rest]')?.textContent ?? null
    if (!st) return { stelle: null as string | null, drin: false, rest, lage: 'keine Stelle' }
    const z = st.getBoundingClientRect()
    return {
      stelle: st.getAttribute('data-treffer-stelle'),
      drin: z.top >= k.top - 1 && z.bottom <= k.bottom + 1,
      rest,
      lage: `${Math.round(z.top)}..${Math.round(z.bottom)} in ${Math.round(k.top)}..${Math.round(k.bottom)}`,
    }
  })
}

test('(g) ↑↓ führen die STELLE mit, nicht den Artikelkopf — und der Stellen-Deckel sagt es', async ({ page }) => {
  test.slow()
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)
  // «e»: OR Art. 1 trägt dutzende Stellen in EINEM Artikel — die Lage, in der
  // Kopf und Stelle nicht mehr zugleich in den Scroller passen (PE-C7-B02).
  await suche(page, 'e')
  const erster = page.locator('[data-treffer-artikel]').first()
  const stellen = Number(await erster.getAttribute('data-fundstellen-zahl'))
  expect(stellen, 'Vorbedingung: erster Artikel hat mehr Stellen als der Deckel (40) — sonst prüft der Fall nichts (§6.7)')
    .toBeGreaterThan(44)

  const vor = page.locator('[data-treffer-vor]').first()
  for (let i = 1; i <= 25; i += 1) await vor.click()
  await page.waitForTimeout(300)
  const bei25 = await laufendeStelleInListe(page)
  expect(bei25.stelle, 'bei 25 keine laufende Stelle in der Liste').not.toBeNull()
  expect(bei25.drin, `laufende STELLE ausserhalb des Scrollers (gemessen wurde bis hier der Kopf): ${bei25.lage}`).toBe(true)

  // ↓ über den Stellen-Deckel hinaus: Zeile steht UND der Deckel nennt sich.
  for (let i = 26; i <= 45; i += 1) await vor.click()
  await page.waitForTimeout(300)
  const bei45 = await laufendeStelleInListe(page)
  expect(bei45.stelle, 'ab der 41. Stelle keine laufende Zeile (PE-C7-B04)').not.toBeNull()
  expect(bei45.drin, `laufende Stelle 45 ausserhalb des Scrollers: ${bei45.lage}`).toBe(true)
  expect(bei45.rest, 'der Stellen-Deckel nennt die übrigen Stellen nicht').toMatch(/^\d+ weitere Stellen/)

  // PE-C7-B03: der Kopf ist ein Sprung, kein Auf-/Zu-Schalter.
  expect(
    await erster.locator('> button').getAttribute('aria-expanded'),
    'aria-expanded an einem Knopf, der wegführt (PE-C7-B03)',
  ).toBeNull()

  // PE-C7-D01: die Schnipsel-Spalte springt nicht ab Rang 10.
  const xs = await page.locator('[data-treffer-stellen] [data-treffer-stelle]').evaluateAll((bs) =>
    bs.slice(0, 30).map((b) => Math.round(b.querySelector('.lc-such-ausschnitt')!.getBoundingClientRect().left * 10) / 10))
  expect(xs.length).toBeGreaterThan(12)
  expect(new Set(xs).size, `Schnipsel-Spalte springt: ${xs.join(',')}`).toBe(1)
})

test('(h) Wrap auf die LETZTE Fundstelle: die Zeile steht da, die Werkzeugzeile bleibt im Bild', async ({ page }) => {
  test.slow()
  await page.setViewportSize({ width: 1440, height: 700 })
  await warteLeser(page)
  // «der»: >1000 Treffer-Artikel, die letzte Fundstelle liegt jenseits des
  // 200er-Deckels (PE-C7-B01); der Wrap springt ans Seitenende (PE-C7-B05).
  await suche(page, 'der')
  await page.locator('[data-treffer-zurueck]').first().click()
  await expect.poll(async () => (await laufendeStelleInListe(page)).stelle, { timeout: 20000 })
    .not.toBeNull()
  const stelle = await laufendeStelleInListe(page)
  expect(stelle.drin, `laufende Stelle ausserhalb des Scrollers: ${stelle.lage}`).toBe(true)

  const leiste = await page.locator('[data-treffer-leiste]').evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight }
  })
  expect(leiste.top, `Zähler und ↑↓ ausserhalb des Bildschirms: ${JSON.stringify(leiste)}`).toBeGreaterThanOrEqual(0)
  expect(leiste.bottom).toBeLessThanOrEqual(leiste.vh)
})

for (const [breite, hoehe] of [[1280, 800], [375, 812]] as const) {
  test(`(i) am Seitenende gesucht: Segment und Zähler liegen im Bild (@${breite})`, async ({ page }) => {
    test.slow()
    await page.setViewportSize({ width: breite, height: hoehe })
    await warteLeser(page)
    // «Artikel lesen, am Ende suchen» (PE-C5-D01): bis zum Dokument-Ende scrollen,
    // mehrfach, weil der Text beim Scrollen nachwächst.
    for (let i = 0; i < 6; i += 1) {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await page.waitForTimeout(400)
    }
    await suche(page)
    const lage = await page.evaluate(() => {
      const zone = document.querySelector('[data-v3-such-zone]')!.getBoundingClientRect()
      const seg = document.querySelector('[data-v3-suchbereich]')!.getBoundingClientRect()
      return { zoneUnten: Math.round(zone.bottom), segOben: Math.round(seg.top), segUnten: Math.round(seg.bottom), vh: window.innerHeight }
    })
    // Bei der Messung lag das Segment 256 px (@1280) bzw. 520 px (@375) ÜBER
    // der Kante, Liste und Werkzeugzeile waren nicht mehr erreichbar.
    expect(lage.segOben, `Segment über der Zone: ${JSON.stringify(lage)}`).toBeGreaterThanOrEqual(lage.zoneUnten - 1)
    expect(lage.segUnten).toBeLessThanOrEqual(lage.vh)
  })
}

test('(j) Leeren und denselben Begriff neu: Liste und Hervorhebung sind wieder da', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)
  const feld = page.locator('[data-v3-suchsprung] input').first()
  await suche(page)
  await feld.press('Enter')                      // Sprung: die Liste weicht (D38)
  await expect(page.locator('[data-treffer-liste]')).toHaveCount(0)
  const schalter = page.locator('[data-treffer-marken-schalter]')
  await expect(schalter).toHaveAttribute('aria-pressed', 'true')
  await schalter.click()
  await expect(schalter).toHaveAttribute('aria-pressed', 'false')

  await feld.fill('')
  await feld.fill(BEGRIFF)                       // DERSELBE Begriff (PE-C4-B02 / PE-C5-B02)
  await expect(page.locator('[data-treffer-liste]').first(), 'Liste kommt nach Leeren + gleichem Begriff nicht zurück')
    .toBeVisible({ timeout: 20000 })
  // Die Zähler-Zeile mit dem Schalter erscheint wieder, sobald die Liste weicht.
  await feld.press('Enter')
  await expect(page.locator('[data-treffer-liste]')).toHaveCount(0)
  await expect(schalter, 'Hervorhebung blieb nach Leeren «aus» (PE-C4-B01)').toHaveAttribute('aria-pressed', 'true')
})

test('(k) Bereichswechsel verwirft die Fundstellen-Nummer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)
  await suche(page, 'Schadenersatz')
  const vor = page.locator('[data-treffer-vor]').first()
  for (let i = 0; i < 5; i += 1) await vor.click()
  await expect(page.locator('[data-treffer-position]')).toContainText(/Fundstelle 5 von \d+/)
  await page.locator('[data-v3-bereich="titel"]').click()
  await expect(page.locator('[data-v3-bereich="titel"]')).toHaveAttribute('aria-checked', 'true')
  // Vorher «Fundstelle 5 von 11» o. ä. (PE-C6-B01: «20 von 11»): eine Nummer aus
  // der alten Folge gegen die neue. Jetzt: keine gewählt.
  await expect(page.locator('[data-treffer-position]')).toContainText('keine gewählt')
  await expect(page.locator('[data-treffer-stelle-aktiv]'), 'fremde Zeile als aktiv hervorgehoben').toHaveCount(0)
})

test('(l) Suchbereich ist eine echte Radio-Gruppe: Pfeiltasten wählen, ein Tab-Stopp', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await warteLeser(page)
  await suche(page)
  const radios = page.locator('[data-v3-suchbereich] [role="radio"]')
  await expect(radios).toHaveCount(4)
  expect(
    await radios.evaluateAll((rs) => rs.filter((r) => r.getAttribute('tabindex') === '0').length),
    'genau EIN Tab-Stopp in der Gruppe (roving tabindex)',
  ).toBe(1)

  await page.locator('[data-v3-bereich="alles"]').focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('[data-v3-bereich="titel"]')).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('[data-v3-bereich="titel"]'), 'Fokus folgt der Auswahl').toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')           // Umlauf: alles → fussnoten
  await expect(page.locator('[data-v3-bereich="fussnoten"]')).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('Home')
  await expect(page.locator('[data-v3-bereich="alles"]')).toHaveAttribute('aria-checked', 'true')
})

test('(m) ‹ › tragen eine Hitbox von 24 px (F9), die Zone schneidet an ihrer Unterkante', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await warteLeser(page)
  await suche(page)
  await page.locator('[data-v3-suchsprung] input').first().press('Enter')   // Liste weicht, die Zeile mit ‹ › erscheint
  await expect(page.locator('[data-v3-treffer-vor]')).toBeVisible()
  for (const [attr, seite] of [['data-v3-treffer-zurueck', -1], ['data-v3-treffer-vor', 1]] as const) {
    const treffer = await page.locator(`[${attr}]`).evaluate((el, [a, sx]) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      // Punkte 11.5 px von der Mitte: ausserhalb der sichtbaren 20 px, innerhalb von 24.
      // Innen (zum Nachbarn) wird nicht gemessen — dort liegt dessen Fläche.
      const punkte = [[cx + Number(sx) * 11.5, cy], [cx, cy - 11.5], [cx, cy + 11.5]]
      return {
        sichtbar: [Math.round(r.width), Math.round(r.height)],
        treffer: punkte.map(([x, y]) => !!document.elementFromPoint(x, y)?.closest(`[${String(a)}]`)),
      }
    }, [attr, seite])
    expect(treffer.sichtbar, `${attr}: die sichtbare Fläche darf nicht wachsen`).toEqual([20, 20])
    expect(treffer.treffer, `${attr}: Hitbox unter 24 px`).toEqual([true, true, true])
  }

  // PE-C4-B03: Nur-Leerraum leert die Zone SOFORT (roher Feldwert), die
  // Zähler-Zeile hängt aber 200 ms am entprellten Begriff. In dieser Spanne ragte
  // sie 9 px unter die Zone — und war dort anklickbar (gemessen: Treffer-Test
  // 3 px unter der Zonenkante traf die Zeile). Frame für Frame gelesen, im
  // selben Tick wie die Eingabe.
  const unterhalb = await page.evaluate(async () => {
    const feld = document.querySelector('[data-v3-suchsprung] input') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(feld, '   ')
    feld.dispatchEvent(new Event('input', { bubbles: true }))
    const log: boolean[] = []
    for (let i = 0; i < 6; i += 1) {
      await new Promise((r) => requestAnimationFrame(r))
      const zeile = document.querySelector('[data-v3-treffer-weg]')
      if (!zeile) break
      const z = document.querySelector('[data-v3-such-zone]')!.getBoundingClientRect()
      const r = zeile.getBoundingClientRect()
      log.push(!!document.elementFromPoint(r.left + 20, z.bottom + 3)?.closest('[data-v3-treffer-weg]'))
    }
    return log
  })
  expect(unterhalb.length, 'Vorbedingung: die Zeile stand noch (sonst misst der Fall nichts, §6.7)').toBeGreaterThan(0)
  expect(unterhalb, 'Zähler-Zeile ragt unter die Zone (PE-C4-B03)').not.toContain(true)
})
