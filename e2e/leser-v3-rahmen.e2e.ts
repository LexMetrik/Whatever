// @shard-gruppe: 3
import { test, expect, type Page } from '@playwright/test'

// ═══ §6.3-DEKLARATION (Entscheid A, David 24.9.2026) · DIE DRITTE SPUR IST ZURÜCK
//
// Davids Entscheid 24.9.2026, Variante A «Echte dritte Spalte»: «Das Blatt wird
// eine eigene Spalte wie die Gliederung und deckt nie Text ab. Nachteil: Der
// Text rutscht beim Öffnen zur Seite und bricht auf kleineren Bildschirmen neu
// um. Das hebt D33 (‹nichts verschiebt sich›) auf.» (Weisung 23.9. abends:
// «… nahe am relevanten artikel … einklappbar … analog gliederung.»)
//
// WAS SICH AN DEN FÄLLEN ÄNDERT: (a)/(b) prüften «Δ = 0, das Blatt überlagert»
// — jetzt prüfen sie das Gegenteil SCHÄRFER: das Blatt steht als Spur (`spalte`),
// überlappt die Lesespalte NIE (Blatt-x ≥ rechte Kante der Lese-Zelle + Abstand),
// der Rahmen wächst nie über den Raum, und Schliessen stellt Rahmen und Text
// byte-genau wieder her. (c) @1023: das Blatt ist dort das Sheet (`unten`) — bis
// hierher überlagerte es als `rechts` (Abweichung offengelegt im PR). (e2) prüft
// die Lesestelle weiter, jetzt auch dort, wo die Gliederung dem Blatt weicht;
// (g) prüft, dass der Schienen-Griff bei Nutzerwahl «zu» NUR einblendet, (g2)
// neu, dass er beim transienten Weichen den Platz vom Blatt zurückholt (Ä60 (c)
// P1-1, von D33 gestrichen, mit A zurück). (h) ist neu: «nie über Text» über
// vier Breiten. (d), (e), (f), (f2) stehen unverändert.
//
// ROT ZU BEKOMMEN (§6.7, gesehen 24.9.2026): in `v3/rahmenSpalten.rahmenBild`
// die Aufweitung weglassen (`breite: undefined`) ⇒ (h) @1920 und (a) rot (Rahmen
// wächst nicht, das Blatt drückt die Zelle unter den Boden bzw. steht nicht am
// Text); `weicht` fest `false` ⇒ (b)/(g2) rot.
//
// ── HISTORIE (Belege altern nicht) ──────────────────────────────────────────
// ═══ §6.3-DEKLARATION (D33, David 7.9.2026) · DIE DRITTE SPUR IST WEG ═══════
//
// Diese Datei bewachte die Ä60-(c)-Bauform: Rahmen wächst auf 1320 px, das
// Beiwerk-Blatt bekommt eine eigene 22-rem-Spur, und darunter weicht die
// Gliederung auf ihre Schiene. GEMESSEN am gebauten Stand (7.9.2026, @1440, OR)
// kostete das den Leser bei JEDEM Klick auf «⚖ Rechtsprechung» 88 px
// Seitenversatz und 124 px Textbreite — jede Zeile des gelesenen Artikels brach
// neu um —, der geklickte Knopf floh 178 px nach rechts, und @1024 verschwand
// die Gliederungsspalte ganz. David-Entscheid: Variante A, das Blatt überlagert
// (Herleitung, Messreihe und die verworfenen Varianten B/C in
// `src/pages/gesetz-leser/v3/rahmenSpalten.ts`, Dateikopf).
//
// WAS DIESE DATEI SEITHER MISST: dass der Rahmen sich NICHT mehr rührt. Die
// Fälle (a), (b), (e2) und (g) sind auf diese Zusage umgestellt — ihre alten
// Erwartungen («Blatt trägt die eigene Spur», «die Gliederung weicht», «der
// Schienen-Griff schliesst das Blatt») beschreiben eine Bauform, die es nicht
// mehr gibt. (c), (d), (e), (f) und (f2) stehen Wort für Wort unverändert; ihre
// Zusagen gelten für das überlagernde Blatt genauso.
// Der Preis der Variante A, offengelegt (§8): das Blatt VERDECKT im geöffneten
// Zustand die rechten ~352 px. Wo (a)/(b) bisher `deckung(...) === 0` verlangten,
// prüfen sie jetzt, dass der Text darunter unverändert steht — nicht, dass er
// frei liegt.
//
// ROT ZU BEKOMMEN (§6.7): in `rahmenSpalten.rahmenBild` wieder eine dritte Spur
// an `spalten` hängen (`+ ' 22rem'`) — dann wandert die Lesespalte beim Öffnen,
// und (a)/(b) melden die Δ.
//
// ── HISTORIE (Belege altern nicht) ──────────────────────────────────────────
// ═══ Ä60 (c) · DER BREITERE LESER-RAHMEN (W2·5m-LESER-V3, Etappe H4) ═════════
//
// DAVID-ENTSCHEID 17.8.2026 (Chat, wörtlich «ja und c, mach so»): von den drei
// Optionen des Spalten-Entscheids gilt (c) — der Rahmen des GESETZ-LESERS wird
// breiter, damit Gesetzestext und Beiwerk-Blatt NEBENEINANDER stehen statt
// übereinander. Jede andere Seite bleibt auf `max-w-content`.
//
// DER BEFUND, DEN DAS BEHEBT (gemessen 17./18.8.2026, StPO Art. 429, Panel offen
// — verdeckte px je Textzeile bzw. am Erlass-Titel):
//
//   Viewport   1024   1150   1280   1440   1920
//   Text        320    257    192    112      0
//   Titel       328    313    248    168      0   ← das ist Ä59
//
// ROT ZU BEKOMMEN (§6.7): in `src/pages/gesetz-leser/v3/rahmenSpalten.ts` die
// Zeile `const blattSpur = …` auf `false` setzen (dann liegt das Blatt wieder
// über dem Text ⇒ (a)/(b)/(e) rot) oder `LESER_MAX_REM` auf 67 zurücksetzen
// (der Rahmen kann nicht mehr wachsen ⇒ (a) rot, weil die Spur den Text unter
// das Lesemass drückt). Beide Beweise sind am 18.8.2026 gefahren worden.

const ERLASS = '/gesetze/bund/STPO'

// ── §6.3-DEKLARATION (W2·24-CI, 6.9.2026) · DIE LESESTELLE WIE EIN LESER ────
// Hier stand `document.getElementById('art-429')?.scrollIntoView()` — ein roher
// DOM-Scroll, den auf dieser Seite NIEMAND auslöst: der Leser kommt über den
// Deep-Link, den Gliederungs-Sprung oder einen Treffer, und alle drei laufen
// über den Sprung-Pfad des Readers (`inhalt-sprung.tsx`/`scrollAnker.ts`), der
// die Landung nach der `content-visibility`-Neuschätzung nachkorrigiert.
// GEMESSEN 6.9.2026 (StPO @1280, `scratchpad/diag2.cjs`/`diag19.cjs`, dist):
//   · roher `scrollIntoView`: landet bei 198 px (korrekt) und driftet 100 ms
//     später auf 133 px — die Artikel 427/428 über dem Ziel schrumpfen beim
//     Materialisieren um zusammen ~66 px, `scrollY` bleibt stehen. Auf
//     origin/main schrumpfen dieselben Artikel um 196 px und `scrollY` zieht
//     mit; die Ursache dieser Differenz ist noch offen (die naheliegende
//     Vermutung «Arbeitsleiste unterdrückt das Scroll-Anchoring» ist
//     falsifiziert, s. `.rl-stelle` in `src/index.css`).
//   · PRODUKT-Weg `#art-429`: Abstand Kopf→Artikel −1 px, über 4 s stabil,
//     auf BEIDEN Ständen.
// Der Fall (e2) misst das Öffnen des Blattes, nicht `scrollIntoView`. Sein
// Vorzustand wird darum über den Weg hergestellt, den der Leser hat; die
// Assertions bleiben Wort für Wort dieselben und sind dadurch wieder scharf:
// vorher massen sie eine Ausgangslage, die schon vor dem Öffnen kaputt war.
async function leserLaden(page: Page, breite: number): Promise<void> {
  await page.setViewportSize({ width: breite, height: 900 })
  await page.goto(`${ERLASS}#art-429`)
  await expect(page.locator('.lc-leser[data-leser-v3="rahmen"]')).toHaveCount(1)
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
  await page.evaluate(() => document.fonts?.ready)
  await expect(page.locator('#art-429')).toBeVisible({ timeout: 20_000 })
  // Der Sprung ist gelandet, wenn die Zielstelle unter dem klebenden Kopf
  // steht — darauf warten statt auf eine feste Uhr.
  await expect.poll(async () => page.evaluate(() => {
    const kopf = document.querySelector('[data-v3-kopf]')
    const art = document.getElementById('art-429')
    if (!kopf || !art) return 9999
    return Math.round(Math.abs(art.getBoundingClientRect().top - kopf.getBoundingClientRect().bottom))
  }), { timeout: 20_000 }).toBeLessThanOrEqual(4)
  await page.waitForTimeout(300)
}

/** Panel über den Kopf-Zähler aufziehen — der Weg, den auch ein Nutzer hat. */
async function panelAufziehen(page: Page): Promise<void> {
  await page.locator('[data-v3-panel-zaehler]').first().click()
  await expect(page.locator('[data-v3-panel]').first()).toBeVisible({ timeout: 20_000 })
}

interface Masse {
  text: { x: number; r: number; b: number } | null
  blatt: { x: number; r: number; b: number } | null
  titel: { x: number; r: number; b: number } | null
  /** Die Lese-Zelle (Entscheid A): ihre rechte Kante ist die Grenze des Blatts. */
  zelle: { x: number; r: number; b: number } | null
  aside: number
  schiene: number
  form: string | null
  rahmen: number
  ch: number | null
  overflow: number
}

/** Alle Masse in EINEM `evaluate` — sonst misst jede Zeile einen anderen Moment. */
function messen(page: Page): Promise<Masse> {
  return page.evaluate(() => {
    const kasten = (sel: string) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: Math.round(r.x), r: Math.round(r.right), b: Math.round(r.width) }
    }
    // Lesemass nach der Methode von `leser-lesemass.e2e.ts`: der Absatz mit den
    // MEISTEN Zeichen je Zeile, nicht irgendeiner.
    let ch: number | null = null
    let text: { x: number; r: number; b: number } | null = null
    document.querySelectorAll('#lc-lesespalte [id^="art-"] p').forEach((p) => {
      const inhalt = (p.textContent ?? '').trim()
      if (inhalt.length < 40) return
      const range = document.createRange()
      range.selectNodeContents(p)
      const kaesten = range.getClientRects()
      if (kaesten.length < 3) return
      const wert = Math.round(inhalt.length / kaesten.length)
      if (ch === null || wert > ch) {
        ch = wert
        const r = (p as HTMLElement).getBoundingClientRect()
        text = { x: Math.round(r.x), r: Math.round(r.right), b: Math.round(r.width) }
      }
    })
    // Ohne umbrechenden Absatz (schmale Spalte) trägt die Lesespalte selbst die
    // Kante — gemessen wird dann sie, nie gar nichts.
    return {
      text: text ?? kasten('#lc-lesespalte'),
      blatt: kasten('[data-v3-panel-form]'),
      titel: kasten('[data-v3-erlass-kopf] h1') ?? kasten('h1'),
      zelle: kasten('[data-lr-spiegel]'),
      aside: document.querySelectorAll('[data-v3-aside]').length,
      schiene: document.querySelectorAll('[data-v3-gliederung-schiene]').length,
      form: document.querySelector('[data-v3-panel-form]')?.getAttribute('data-v3-panel-form') ?? null,
      rahmen: Math.round(document.querySelector('[data-leser-v3="rahmen"]')!.getBoundingClientRect().width),
      ch,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

// D33 (7.9.2026): `deckung()` ist gestrichen. Sie mass die WAAGRECHTE
// Überschneidung von Text und Blatt und war die Kernfrage der eigenen Spur
// («nichts verdeckt»). Beim überlagernden Blatt ist die Überschneidung gewollt
// und offengelegt; gemessen wird jetzt, wie viel Lesetext frei BLEIBT (Fall (a)).

test.describe('Ä60 (c) — Text und Beiwerk-Blatt stehen nebeneinander', () => {
  // ── (a) @1440: das Blatt überlagert — und bewegt nichts ───────────────────
  test('(a) @1440: das Blatt ist eine Spur neben der Lese-Zelle, Gliederung bleibt, Rundlauf verlustfrei', async ({ page }) => {
    await leserLaden(page, 1440)
    const zu = await messen(page)
    // Zu bleibt der Rahmen der Seitenrahmen (1072 px) — die Schiene weitet ihn
    // nicht (R8 `kein-abschnitt`: 1084 px liefen über `div.lc-route`).
    expect(zu.rahmen, '@1440 zu: der Rahmen ist breiter als der Seitenrahmen').toBe(1072)
    await expect(page.locator('[data-v3-blatt-schiene]'), '@1440 zu: die Blatt-Schiene fehlt').toBeVisible()

    await panelAufziehen(page)
    const auf = await messen(page)

    expect(auf.form, '@1440 steht das Blatt nicht als eigene Spur').toBe('spalte')
    expect(auf.aside, '@1440 darf das Öffnen die Gliederungsspalte nicht kosten').toBe(1)
    await expect(page.locator('[data-v3-blatt-schiene]')).toHaveCount(0)
    // DIE Zusage der Variante A: das Blatt deckt nie Text — seine linke Kante
    // liegt genau einen Spur-Abstand (20 px) rechts der Lese-Zelle.
    expect(auf.blatt!.x - auf.zelle!.r, `Blatt ${auf.blatt!.x} gegen Zelle ${auf.zelle!.r}`).toBe(20)
    expect(auf.blatt!.x, 'das Blatt überlappt den Lesetext').toBeGreaterThanOrEqual(auf.text!.r)
    expect(auf.rahmen, 'der Rahmen wächst über das Fenster').toBeLessThanOrEqual(1440 - 48)
    expect(auf.text!.b, `Lesespalte @1440 nur ${auf.text!.b} px`).toBeGreaterThanOrEqual(448)
    // Und senkrecht: es beginnt UNTER dem klebenden Kopf-Block, nie darüber —
    // das war der Ä52-Befund (das Blatt deckte die Griffe, die es aufziehen).
    const oben = await page.evaluate(() => {
      const kopf = document.querySelector('[data-v3-kopf]')!.getBoundingClientRect()
      const blatt = document.querySelector('[data-v3-panel-form]')!.getBoundingClientRect()
      return Math.round(blatt.top - kopf.bottom)
    })
    expect(oben, `das Blatt beginnt ${-oben} px über der Unterkante des Kopf-Blocks (Ä52)`)
      .toBeGreaterThanOrEqual(-1)
    expect(auf.ch!, `Lesemass ${auf.ch} ch (WCAG SC 1.4.8)`).toBeLessThanOrEqual(80)
    expect(auf.overflow, 'waagrechter Überlauf des Dokuments').toBeLessThanOrEqual(1)

    // Rundlauf: Schliessen stellt Rahmen, Lesespalte und Schiene byte-genau her.
    await page.locator('[data-v3-blatt-zu]').click()
    await expect(page.locator('[data-v3-panel]')).toHaveCount(0)
    const wieder = await messen(page)
    expect(wieder.rahmen).toBe(zu.rahmen)
    expect(wieder.text, 'die Lesespalte steht nach dem Schliessen woanders').toEqual(zu.text)
    await expect(page.locator('[data-v3-blatt-schiene]')).toBeVisible()
  })

  // ── (b) @1150: der enge Fall — die Gliederung weicht, TRANSIENT ───────────
  // Raum 1102 px < 72.25 rem (1156): Gliederung + 448 px Lesespalte + Blatt
  // passen nicht nebeneinander. Die Gliederung weicht beim Öffnen auf ihre
  // Schiene und steht nach dem Schliessen wieder — ohne dass «zu» gemerkt wird.
  test('(b) @1150: die Gliederung weicht dem offenen Blatt und kehrt zurück', async ({ page }) => {
    await leserLaden(page, 1150)
    await panelAufziehen(page)
    const auf = await messen(page)

    expect(auf.form).toBe('spalte')
    expect(auf.aside, '@1150 steht die Gliederung trotz Platzmangel').toBe(0)
    expect(auf.schiene, '@1150 fehlt die Gliederungs-Schiene').toBe(1)
    expect(auf.blatt!.x, 'das Blatt überlappt den Lesetext').toBeGreaterThanOrEqual(auf.text!.r)
    // 28 rem = 448 px ist der Boden, den die Design-Grundlage der Lesespalte setzt.
    expect(auf.text!.b, `Lesespalte @1150 nur ${auf.text!.b} px`).toBeGreaterThanOrEqual(448)
    expect(auf.overflow, 'waagrechter Überlauf des Dokuments @1150').toBeLessThanOrEqual(1)

    await page.locator('[data-v3-blatt-zu]').click()
    await expect(page.locator('[data-v3-aside]'), 'nach dem Schliessen fehlt die Gliederung').toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('lm-leser-gliederung')),
      'das Weichen wurde als Nutzerwahl gemerkt').toBeNull()
  })

  // ── (c) die Spaltengrenze 1024 ist UNVERÄNDERT ────────────────────────────
  // Der Rahmen wird breiter — die Schwelle, ab der die Gliederung überhaupt eine
  // Spalte sein kann, bleibt der Viewport 1024 (A-8, Kap. 12: die Umstellung auf
  // eine Element-Messung würde sie verschieben und ist darum NICHT erfolgt).
  test('(c) @1024 trägt die Gliederungsspalte, @1023 nicht — die Grenze bleibt', async ({ page }) => {
    await leserLaden(page, 1024)
    expect((await messen(page)).aside, '@1024 fehlt die Gliederungsspalte — die Grenze ist gewandert').toBe(1)

    await leserLaden(page, 1023)
    const schmal = await messen(page)
    expect(schmal.aside, '@1023 steht eine Gliederungsspalte — die Grenze ist gewandert').toBe(0)
    // Und unter 1024 bekommt das Blatt KEINE Spur, der Rahmen wächst nicht.
    // §6.3 (Entscheid A, 24.9.2026): hier stand `'rechts'` — die Überlagerung,
    // die es seither nicht mehr gibt. Unter 1024 ist das Blatt wie die
    // Gliederung das Sheet (Auftrag: «Sheet + Knopf im Kopf»).
    await expect(page.locator('[data-v3-blatt-schiene]'), '@1023 steht eine Blatt-Schiene').toHaveCount(0)
    await panelAufziehen(page)
    const auf = await messen(page)
    expect(auf.form, '@1023 hat das Blatt eine eigene Spur bekommen').toBe('unten')
    expect(auf.rahmen, '@1023 ist der Rahmen gewachsen').toBe(schmal.rahmen)
  })

  // ── (d) jede andere Seite bleibt auf `max-w-content` ──────────────────────
  test('(d) Startseite und Rechner behalten ihre Inhaltsbreite (1072 px @1440)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    for (const pfad of ['/', '/gesetze']) {
      await page.goto(pfad)
      await expect(page.locator('main#inhalt')).toBeVisible({ timeout: 20_000 })
      const breite = await page.evaluate(() => {
        const wrap = document.querySelector('main#inhalt > div') as HTMLElement | null
        if (!wrap) return null
        const cs = getComputedStyle(wrap)
        return Math.round(wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight))
      })
      expect(breite, `${pfad}: Inhaltsbreite ${breite} px statt 1072 — die Leser-Aufweitung leckt`).toBe(1072)
    }
  })

  // ── (f) Ä86 · die Spur ist Layout, kein Popover ───────────────────────────
  // BEFUND (Klick-Test 18.8.2026, Stand `6ca1609b3`, @1440/@1024): das
  // angedockte Panel schloss bei JEDEM Klick in die Lesespalte — Textmarkieren
  // bei offenem Panel war unmöglich (`usePopoverAutoZu` Modus «beiwerk»).
  // Sobald das Blatt als eigene Spur NEBEN dem Text steht, ist es kein
  // aufgezogenes Blatt mehr: Schliessen nur über ✕ · Esc · Zweitklick auf den
  // Zähler · «r». UNTER 1024 px bleibt es beim alten Verhalten — der dritte
  // Fall unten ist die Gegenprobe dazu (§6.7: sonst prüfte (f) nur, dass
  // irgendwo nichts schliesst).
  for (const breite of [1440, 1150]) {
    test(`(f) @${breite}: Klick in den Text lässt das Blatt offen, Auswahl möglich`, async ({ page }) => {
      await leserLaden(page, breite)
      await panelAufziehen(page)
      const panel = page.locator('[data-v3-panel]').first()

      const absatz = page.locator('#lc-lesespalte [id^="art-"] p').first()
      await absatz.scrollIntoViewIfNeeded()
      await absatz.click({ position: { x: 5, y: 5 } })
      await expect(panel, `@${breite}: der Klick in den Text hat das Blatt geschlossen`).toBeVisible()

      // Und wirklich MARKIEREN, nicht nur klicken: der Dreifachklick wählt den
      // Absatz. Ein Blatt, das dabei zugeht, macht die Auswahl unbrauchbar.
      await absatz.click({ clickCount: 3 })
      const auswahl = await page.evaluate(() => (window.getSelection()?.toString() ?? '').trim().length)
      expect(auswahl, `@${breite}: nichts markiert`).toBeGreaterThan(20)
      await expect(panel, `@${breite}: das Markieren hat das Blatt geschlossen`).toBeVisible()

      // Die benannten Wege heraus bleiben: Zweitklick auf den Zähler schliesst.
      await page.locator('[data-v3-panel-zaehler]').first().click()
      await expect(page.locator('[data-v3-panel]')).toHaveCount(0)
    })
  }

  // ── §6.3-DEKLARATION (D33, 7.9.2026) · DIE GEGENPROBE HAT EINEN NEUEN ORT ──
  // Sie stand @1023 und prüfte, dass die «nicht bei jedem Klick schliessen»-Regel
  // NICHT unter die 1024er-Grenze leckt. Diese Grenze trennte die eigene
  // Blatt-Spur vom überlagernden Blatt; seit D33 überlagert es überall, und die
  // Regel gilt für jedes nicht-modale Blatt — @1023 wie @1440. Eine Gegenprobe
  // auf einen Unterschied, den es nicht mehr gibt, prüft nichts (§6.7).
  // Die Gegenprobe steht jetzt dort, wo der Unterschied WIRKLICH ist: beim
  // MODALEN Blatt (@390, Bottom-Sheet mit Scrim). Dort schliesst der Klick
  // daneben weiterhin — sonst wäre (f) der Beweis, dass nirgends etwas schliesst.
  test('(f2) Gegenprobe @390: das modale Blatt schliesst beim Klick auf den Scrim', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${ERLASS}#art-429`)
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
    await panelAufziehen(page)
    await expect(page.locator('[data-v3-panel-form="unten"]')).toBeVisible()
    const scrim = page.locator('[data-v3-panel-scrim]')
    await expect(scrim, '@390 fehlt der Scrim — dann ist das Blatt gar nicht modal').toBeVisible()
    await scrim.click({ position: { x: 10, y: 10 } })
    await expect(page.locator('[data-v3-panel]'),
      '@390 bleibt das modale Blatt offen — der Weg daneben ist zu').toHaveCount(0)
  })

  // ── (e) der gelesene Text bleibt an seiner Leseposition ──────────────────
  // Die Aufweitung verstellt die BREITE des Rahmens. Sie darf den gelesenen
  // Text darum waagrecht bewegen (die Spur braucht Platz) — senkrecht NICHT.
  // Ein Blatt, das beim Aufziehen die Lesestelle wegschiebt, ist genau der
  // Mangel, den `useStickAusgleich` für die Gliederung behoben hat.
  test('(e) Öffnen und Schliessen verschieben die Lesestelle senkrecht nicht', async ({ page }) => {
    await leserLaden(page, 1440)
    const y = () => page.evaluate(() => Math.round(document.getElementById('art-429')!.getBoundingClientRect().y))
    const vorher = await y()
    const rahmenVorher = (await messen(page)).rahmen
    await panelAufziehen(page)
    expect(Math.abs((await y()) - vorher), 'das Aufziehen verschiebt die Lesestelle senkrecht').toBeLessThanOrEqual(2)
    // Und zurück: der Rundlauf lässt keinen Versatz zurück (Klasse Ä26/S2).
    await page.locator('[data-v3-panel-zu]').first().click()
    await expect(page.locator('[data-v3-panel]')).toHaveCount(0)
    expect(Math.abs((await y()) - vorher), 'nach dem Schliessen steht die Lesestelle woanders').toBeLessThanOrEqual(2)
    // §6.3-DEKLARATION (W2·24-R6/M1, Herleitung bei Fall (a)): der Rahmen ist
    // nach dem Schliessen wieder GENAU DER, der er vor dem Öffnen war — das ist
    // die Zusage, nicht eine feste Zahl. Seit R6 hält ihn die Randnotiz-Spalte
    // @1440 ohnehin auf 1'320 px; ein Rundlauf, der etwas zurücklässt, wäre
    // weiterhin rot.
    expect((await messen(page)).rahmen, 'der Rahmen bleibt nach dem Schliessen verändert').toBe(rahmenVorher)
  })

  // ── (e2) Ä88 · derselbe Satz dort, wo das Blatt die Gliederung FALTET ──────
  // Zwischen 1024 und 1391 px reicht der Raum nicht für Spalte UND Blatt: die
  // Gliederung weicht auf ihre Schiene, die Such-Zone wandert in den klebenden
  // Kopf (Ä19), und der wächst um 44 px. (e) misst @1440 — dort passiert das
  // gar nicht, der Fall konnte den Mangel also nicht sehen.
  //
  // GEMESSEN VOR DEM FIX (18.8.2026, StPO Art. 429, `scratchpad/a-mess.cjs`):
  //   @1024  Kopfhöhe 57 → 101 px · Abstand Block→Artikel −1 → **−45** px
  //          (die Artikel-Überschrift lag hinter dem Kopf, also unsichtbar)
  //   @1150  57 → 101 px · Abstand −1 → −1 px   (Chromium-Anchoring trug)
  //   @1280  57 → 101 px · Abstand −1 → −1 px
  //
  // GEMESSEN WIRD DER ABSTAND, NICHT DIE y-KOORDINATE — und das ist keine
  // Aufweichung, sondern die Invariante von `useStickAusgleich`: der gelesene
  // Artikel behält seinen Platz UNTER der Unterkante des klebenden Blocks. Eine
  // Prüfung auf `y` allein wäre @1150/@1280 rot, obwohl dort nichts verloren
  // geht (Kopf und Artikel wandern gemeinsam um 44 px), und @1024 grün gewesen,
  // wo die Überschrift verschwand.
  //
  // ROT ZU BEKOMMEN (§6.7, gefahren 18.8.2026): in `v3/LeserRahmenV3.tsx` die
  // Wicklung `panel = { …, umschalten: () => mitAusgleich(…) }` entfernen (dann
  // läuft das Öffnen am Ausgleich vorbei) oder in `v3/useStickAusgleich.ts` die
  // `lage` wieder nur aus `tocOffen` bilden.
  for (const breite of [1024, 1150, 1280]) {
    test(`(e2) @${breite}: die Lesestelle bleibt stehen — auch wo die Gliederung weicht`, async ({ page }) => {
      await leserLaden(page, breite)
      const abstand = () => page.evaluate(() => {
        const kopf = document.querySelector('[data-v3-kopf]')!.getBoundingClientRect()
        const art = document.getElementById('art-429')!.getBoundingClientRect()
        return Math.round(art.top - kopf.bottom)
      })
      const vorher = await abstand()
      await panelAufziehen(page)
      // §6.3-DEKLARATION (Entscheid A, 24.9.2026): D33 verlangte hier «die
      // Gliederung bleibt». Seit A weicht sie @1024/@1150 dem offenen Blatt
      // (Raum < 1156 px), @1280 bleibt sie — die Gegenprobe prüft beides, und
      // die Kernaussage (Lesestelle bleibt) steht unverändert darunter.
      const weicht = breite < 1204
      await expect(page.locator('[data-v3-aside]'),
        `@${breite}: Gliederungsspalte ${weicht ? 'steht trotz Platzmangel' : 'fehlt'}`).toHaveCount(weicht ? 0 : 1)
      await expect(page.locator('[data-v3-gliederung-schiene]')).toHaveCount(weicht ? 1 : 0)
      const nachher = await abstand()
      expect(Math.abs(nachher - vorher),
        `@${breite}: der Abstand Kopf→Artikel wandert um ${nachher - vorher} px (${vorher} → ${nachher})`)
        .toBeLessThanOrEqual(4)
      // Und die Überschrift steht wirklich im Bild — der eigentliche Ä88-Verlust
      // war, dass sie hinter den gewachsenen Kopf rutschte.
      expect(nachher, `@${breite}: die Artikel-Überschrift liegt ${-nachher} px hinter dem Kopf`)
        .toBeGreaterThanOrEqual(-4)
    })
  }

  // ── (g) P1-1 · EIN Klick auf die Schiene, wenn das Blatt ihren Platz hat ───
  // BEFUND (Bug-Check 18.8.2026, Repro `p1/r2-schiene.cjs`, hier @1280
  // nachgemessen): klappt man die Gliederung ZUERST ein und öffnet DANN das
  // Blatt, blieb der Schienen-Griff wirkungslos —
  //
  //   Schritt                     [data-v3-aside]   Grid
  //   ────────────────────────────────────────────────────────────────
  //   Gliederung zu                     0           36px 1004px
  //   Blatt offen                       0           36px 780px 352px
  //   1. Klick auf die Schiene          0           36px 780px 352px   ← nichts
  //   2. Klick auf die Schiene          1           288px 752px
  //
  // Dazwischen stand `tocOffen` still auf `true`: ein Zustand ohne Bild, der
  // beim nächsten Esc als aufspringende Gliederung sichtbar geworden wäre.
  // URSACHE: `rahmenSpalten.schieneHoltPlatz` fragte nach `tocOffen` statt nach
  // der Lage (Herleitung am Feld dort).
  //
  // ROT ZU BEKOMMEN (§6.7, gefahren 18.8.2026): in `v3/rahmenSpalten.ts`
  // `schieneHoltPlatz` wieder auf `blattSpur && tocOffen && !gliederungSpalte`.
  test('(g) @1280: ein Klick auf die Schiene holt die Gliederung zurück — auch bei offenem Blatt', async ({ page }) => {
    const fehler: string[] = []
    page.on('pageerror', (e) => fehler.push(e.message))
    await leserLaden(page, 1280)
    await page.locator('[data-v3-gliederung-zu]').click()
    await expect(page.locator('[data-v3-gliederung-schiene]')).toBeVisible()
    await panelAufziehen(page)
    // Ausgangslage: Schiene UND offenes Blatt — seit Entscheid A als Spur.
    await expect(page.locator('[data-v3-panel-form="spalte"]')).toBeVisible()
    await expect(page.locator('[data-v3-aside]')).toHaveCount(0)

    await page.locator('[data-v3-gliederung-schiene]').click()
    // EIN Klick: die Spalte steht. §6.3-DEKLARATION (D33): das Blatt bleibt
    // dabei OFFEN. Bis 7.9.2026 musste der Griff es schliessen, weil beide
    // denselben Platz brauchten (`schieneHoltPlatz`); ohne Spur nimmt die
    // Gliederung ihm nichts mehr weg, und ein Griff, der ungefragt ein zweites
    // Ding zumacht, wäre jetzt der Mangel (§8).
    await expect(page.locator('[data-v3-aside]'), 'nach EINEM Schienen-Klick fehlt die Gliederungsspalte')
      .toBeVisible({ timeout: 10_000 })
    await expect(page.locator('[data-v3-gliederung-schiene]')).toHaveCount(0)
    await expect(page.locator('[data-v3-panel]'),
      'der Schienen-Griff hat das Blatt zugemacht, obwohl es ihm nicht im Weg steht').toHaveCount(1)
    expect(fehler, fehler.join(' | ')).toEqual([])
  })

  // ── (g2) Entscheid A · die Schiene holt den Platz vom Blatt zurück ────────
  // @1150 weicht die OFFEN gewählte Gliederung dem Blatt. «Einblenden» wäre dort
  // ein Knopf ohne Wirkung (sie ist ja offen gewählt) — der Klick schliesst das
  // Blatt, und die Gliederung steht (Ä60 (c) P1-1, `schieneHoltPlatz`).
  test('(g2) @1150: ein Klick auf die gewichene Schiene schliesst das Blatt, die Gliederung steht', async ({ page }) => {
    await leserLaden(page, 1150)
    await panelAufziehen(page)
    await expect(page.locator('[data-v3-aside]')).toHaveCount(0)
    await page.locator('[data-v3-gliederung-schiene]').click()
    await expect(page.locator('[data-v3-panel]'), 'das Blatt blieb offen').toHaveCount(0)
    await expect(page.locator('[data-v3-aside]'), 'die Gliederung steht nicht').toBeVisible()
    await expect(page.locator('[data-v3-blatt-schiene]')).toBeVisible()
  })

  // ── (i) Entscheid David 24.9.2026 · «eingeklappt bleibt eingeklappt» ──────
  // Auch beim nächsten Gesetz (erlassübergreifend, `localStorage`). Öffnen
  // löscht die Wahl wieder. ROT ZU BEKOMMEN: `merkeGliederung` im Rahmen
  // weglassen ⇒ ZGB steht wieder mit Gliederungsspalte.
  test('(i) @1440: die eingeklappte Gliederung bleibt eingeklappt, auch im nächsten Gesetz', async ({ page }) => {
    await leserLaden(page, 1440)
    await page.locator('[data-v3-gliederung-zu]').click()
    await expect(page.locator('[data-v3-gliederung-schiene]')).toBeVisible()
    await page.goto('/gesetze/bund/ZGB')
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
    await expect(page.locator('[data-v3-gliederung-schiene]'), 'ZGB: die Wahl «zu» ging verloren').toBeVisible()
    await expect(page.locator('[data-v3-aside]')).toHaveCount(0)
    await page.locator('[data-v3-gliederung-schiene]').click()
    await expect(page.locator('[data-v3-aside]')).toBeVisible()
    await page.reload()
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
    await expect(page.locator('[data-v3-aside]'), 'nach dem Wieder-Öffnen blieb «zu» gemerkt').toBeVisible()
  })

  // ── (h) Entscheid A · «deckt nie Text ab» über vier Breiten ───────────────
  // Die Kernzusage des Entscheids, an jeder Prüfbreite des Auftrags gemessen.
  // @1920 zusätzlich «direkt am Text»: der Rahmen wächst nach rechts, der Text
  // bleibt stehen (x vor = x nach), und das Blatt steht einen Spur-Abstand
  // neben der Lese-Zelle, die genau das Lesemass (720 px) breit ist.
  for (const breite of [1024, 1280, 1440, 1920]) {
    test(`(h) @${breite}: das offene Blatt überlappt den Lesetext nie`, async ({ page }) => {
      await leserLaden(page, breite)
      const zu = await messen(page)
      await panelAufziehen(page)
      const auf = await messen(page)
      expect(auf.form).toBe('spalte')
      expect(auf.blatt!.x, `@${breite}: Blatt ${auf.blatt!.x} < Text ${auf.text!.r}`).toBeGreaterThanOrEqual(auf.text!.r)
      expect(auf.blatt!.x - auf.zelle!.r, `@${breite}: Abstand Zelle→Blatt`).toBe(20)
      expect(auf.blatt!.r, `@${breite}: Blatt ragt aus dem Fenster`).toBeLessThanOrEqual(breite)
      expect(auf.overflow, `@${breite}: waagrechter Überlauf`).toBeLessThanOrEqual(1)
      if (breite === 1920) {
        expect(auf.zelle!.b, '@1920: Zelle ≠ Lesemass — das Blatt steht nicht am Text').toBe(720)
        expect(auf.text!.x, '@1920: der Text ist beim Öffnen gerutscht').toBe(zu.text!.x)
      }
    })
  }
})
