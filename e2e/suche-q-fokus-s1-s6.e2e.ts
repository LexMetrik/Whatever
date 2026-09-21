// @shard-gruppe: 6
// Browser-Kontrakt der beiden Suche-Rest-Schritte (FAHRPLAN-UI-NAVIGATION §2):
//
//   S1 · Query-Durchreichung `?q=` — der «alle N →»-Sprung der Universal-Suche
//        nimmt den Suchbegriff mit, die Zielseite filtert damit; auf
//        /rechtsprechung wandert der getippte Begriff entprellt in die Adresse,
//        so dass ein Neuladen `rg` UND `q` wiederherstellt.
//
//   S6 · Mobiler Such-Fokusmodus — @390 keine Fokus-Zoom-Falle (Feldschrift
//        ≥ 16 px), Feld über die volle Streifenbreite, ✕ führt zurück.
//
// Läuft gegen `vite preview` (dist).
import { test, expect, type Page } from '@playwright/test'
import { kopfSucheOeffnen } from './helpers/kopfSuche'

// ── §6.3-DEKLARATION (W2·23-STARTSEITE-V4 §6.1, 5.9.2026) ────────────────────
// Alle Fälle dieser Datei messen die KOPF-Suche (S1-Durchreichung, S6-Fokus-
// modus, Tastaturfalle). Sieben von ihnen starteten auf «/» — dort trägt seit
// diesem Schritt der Hero die eine Suche, der Streifen zeigt kein zweites Feld
// mehr. Startroute darum «/kontakt»: eine leichte statische Seite MIT Kopf-
// Suche und ohne eigenes Suchfeld, das die Locators stören könnte. Geändert
// ist ausschliesslich die Startroute — keine Assertion, kein Timeout, kein
// Umfang (§6.3). Für S1 bleibt der geprüfte Kern derselbe: der Sprung führt von
// einer FREMDEN Seite mit Remount auf /gesetze (der Nicht-Remount-Fall daneben
// startet unverändert auf /gesetze?ebene=bund).

// Der Artikel-Volltext-Index (~4 MB) lädt einmal; unter Runner-Last reicht das
// 30-s-Standardbudget nicht (Muster norm-sprung.e2e.ts). INFRASTRUKTUR, keine
// Assertion-Änderung (§6.3).
test.describe.configure({ timeout: 60_000 })

const sucheFeld = (page: Page) => page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })
const listbox = (page: Page) => page.getByRole('listbox', { name: 'Suchtreffer' })

test.describe('S1 · Query-Durchreichung ?q=', () => {
  test('«alle N →» führt MIT dem Begriff auf /gesetze (Feld vorgefüllt, gefiltert)', async ({ page }) => {
    await page.goto('/kontakt')
    const feld = sucheFeld(page)
    await feld.click()
    await feld.fill('recht')
    const box = listbox(page)
    await expect(box).toBeVisible()
    // Die Gesetze-Gruppe kappt bei vielen Treffern und bietet den Sammel-Sprung.
    const mehr = box.getByRole('option', { name: /alle \d+ Treffer anzeigen/ }).first()
    await expect(mehr).toBeVisible()
    await mehr.click()
    // Kern von S1: die Query steht in der Adresse UND im Filterfeld der Zielseite.
    await expect(page).toHaveURL(/[?&]q=recht/)
    // DEKLARIERTE LOCATOR-ANPASSUNG (R12A/D22, 6.9.2026): das Filterfeld auf
    // /gesetze heisst am Bild «Filtern» und trägt diesen Namen jetzt auch
    // zugänglich (WCAG 2.5.3). Zusicherung unverändert: der Begriff kommt an.
    const zielFeld = page.getByRole('searchbox', { name: 'Filtern' })
    await expect(zielFeld.first()).toHaveValue('recht')
  })

  test('/gesetze?q= füllt das Filterfeld auch OHNE Remount (SPA-Sprung auf der eigenen Seite)', async ({ page }) => {
    await page.goto('/gesetze?ebene=bund')
    const feld = sucheFeld(page)
    await feld.click()
    await feld.fill('recht')
    await expect(listbox(page)).toBeVisible()
    const mehr = listbox(page).getByRole('option', { name: /alle \d+ Treffer anzeigen/ }).first()
    await mehr.click()
    // Ohne den laufenden ?q=-Abgleich bliebe das Feld hier leer (Lazy-Init greift
    // nur beim Mount — /gesetze → /gesetze mountet nicht neu).
    // DEKLARIERTE ANPASSUNG (R12A/D22, 6.9.2026): Locator folgt dem sichtbaren
    // Label «Filtern» (WCAG 2.5.3) — geprüft wird unverändert der ?q=-Abgleich.
    await expect(page.getByRole('searchbox', { name: 'Filtern' })).toHaveValue('recht')
  })

  test('Rechtsprechung: getippter Begriff landet in der Adresse und übersteht das Neuladen (rg UND q)', async ({ page }) => {
    await page.goto('/rechtsprechung?rg=zpo')
    const feld = page.getByRole('searchbox', { name: 'Filtern' })
    await feld.fill('Kündigung')
    // Entprellt (300 ms) — die Adresse zieht kurz danach nach.
    await expect(page).toHaveURL(/[?&]q=K%C3%BCndigung/)
    await expect(page).toHaveURL(/[?&]rg=zpo/)
    await page.reload()
    await expect(page.getByRole('searchbox', { name: 'Filtern' })).toHaveValue('Kündigung')
    await expect(page).toHaveURL(/[?&]rg=zpo/)
  })

  // Gegenprüfungs-Befund 7.8.2026 (ERNST): die Merkung des selbst gespiegelten
  // Werts galt unbegrenzt — die Zurück-Taste führte auf die alte Adresse, das
  // Feld behielt den neuen Begriff, und der Spiegel schrieb die History-Position
  // 300 ms später wieder um. Die Zustandslogik dahinter ist in
  // src/tests/useSucheAusUrl.test.ts einzeln festgenagelt.
  test('Zurück-Taste stellt den früheren Begriff wieder her und bleibt stehen', async ({ page }) => {
    await page.goto('/rechtsprechung')
    const feld = page.getByRole('searchbox', { name: 'Filtern' })
    await feld.fill('miete')
    await expect(page).toHaveURL(/[?&]q=miete/)
    // Fremde Adressänderung auf denselben Achsen (Header-Sprung-Äquivalent).
    await page.goto('/rechtsprechung?q=recht')
    await expect(feld).toHaveValue('recht')
    await page.goBack()
    await expect(page).toHaveURL(/[?&]q=miete/)
    await expect(feld).toHaveValue('miete')
    // …und der Spiegel schreibt die History-Position NICHT wieder um.
    await page.waitForTimeout(600)
    await expect(page).toHaveURL(/[?&]q=miete/)
  })

  // Gegenprüfungs-Befund 7.8.2026 (§8-Zählparität): Header dedupliziert die
  // Gemeinde-Doppel, die Zielseite tat es nicht — «alle 73 →» landete auf «74».
  test('«alle N →» und die Trefferzahl der Zielseite nennen dieselbe Zahl (§8)', async ({ page }) => {
    await page.goto('/kontakt')
    const feld = sucheFeld(page)
    await feld.click()
    await feld.fill('recht')
    const box = listbox(page)
    await expect(box).toBeVisible()
    const gesetzGruppe = box.getByRole('group', { name: 'Gesetze' })
    const mehr = gesetzGruppe.getByRole('option', { name: /alle \d+ Treffer anzeigen/ })
    const kopfZahl = Number(/\d+/.exec((await mehr.textContent()) ?? '')![0])
    await mehr.click()
    const seitenZahl = Number(/\d+/.exec((await page.getByText(/Treffer für «recht»/).textContent()) ?? '')![0])
    expect(seitenZahl).toBe(kopfZahl)
  })
})

// ── §6.3-DEKLARATION (29.8.2026, Entscheid David C1/B10/L3 + C2) ─────────────
// Der Design-Review hat den Streifen unter 480 px entlastet: die globale Suche
// ist dort im Ruhezustand eine 44-px-Lupe (das Feld war gemessen 28 px breit),
// und Logo wie Verlauf-Trigger weichen, weil sie einen benannten Zweitzugang
// EINEN Tap entfernt haben (Schublade bzw. Such-Leerzustand). Damit zerfällt der
// frühere eine Mobil-Bereich in ZWEI Bänder, und die S6-Zusagen verteilen sich
// entlang der Schwelle — keine wird schwächer, jede steht künftig dort, wo sie
// überhaupt messbar ist:
//
//   < 480 px  «Lupe → Feld» ist der Weg. Feldschrift und Query-Lesbarkeit
//             gelten unverändert und werden hier @390 weiter geprüft (echte
//             Telefonbreite) — nur eben am GEÖFFNETEN Feld, dem einzigen
//             Zustand, in dem dort überhaupt getippt wird.
//   480–639   Logo und Werkzeuge stehen im Streifen; nur DORT ist «Fokus
//             blendet sie aus, ✕ holt sie zurück» eine prüfbare Aussage. Der
//             Fall zieht darum in den eigenen describe unten um — wörtlich
//             unverändert, nur mit anderer Breite.
//   Die Entsprechung unter 480 px («Lupe → Feld über die volle Streifenbreite,
//   ✕ zurück, Fokus auf ‹Navigation öffnen›») ist lückenlos gedeckt von
//   `topbar-kein-ueberlauf-320.e2e.ts` @320 — kein Prüfpunkt geht verloren,
//   und die Doppelung wird bewusst nicht angelegt (§17-Rückbau).
test.describe('S6 · Mobiler Such-Fokusmodus @390', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  // ROT ZU BEKOMMEN: in `HeaderSuche.tsx` das `text-base` der Feld-Klasse
  // streichen ⇒ unter sm greift `text-body-s` (14 px) und der Fall reisst.
  test('Feldschrift ≥ 16 px (keine iOS-Fokus-Zoom-Falle)', async ({ page }) => {
    await page.goto('/kontakt')
    // Gemessen wird der Zustand, in dem der Nutzer @390 wirklich tippt: nach dem
    // Lupen-Tap. Der Ruhezustand trägt dort kein Feld mehr (C1/B10/L3).
    const feld = await kopfSucheOeffnen(page)
    const px = await feld.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    // iOS Safari zoomt beim Fokus auf jedes Feld unter 16 px; der Nutzer muss
    // danach von Hand herauszoomen. 14 px (text-body-s) war genau dieser Fall.
    expect(px).toBeGreaterThanOrEqual(16)
  })

  test('getippte Query bleibt im Feld sichtbar (nicht abgeschnitten)', async ({ page }) => {
    await page.goto('/kontakt')
    const feld = await kopfSucheOeffnen(page)
    await feld.fill('arbeitsvertrag')
    // scrollWidth > clientWidth hiesse: der Anfang der Query ist aus dem Feld
    // gescrollt — genau der S6-Prüfpunkt «getippte Query voll lesbar».
    const passt = await feld.evaluate((el: HTMLInputElement) => el.scrollWidth <= el.clientWidth + 1)
    expect(passt).toBe(true)
  })
})

// Zweites Band derselben S6-Zusage (Deklaration oben). WARUM 500 UND NICHT 480:
// `viewport` setzt die FENSTER-Breite, die Media-Query misst die Layout-Breite
// ohne die klassische Scrollleiste — bei 480 sind das 465 px, die Schwelle
// greift also noch (gemessen 29.8.2026; dieselbe Rechnung steht im Tor
// `topbar-kein-ueberlauf-320.e2e.ts`). 500 liegt mit 485 px sicher darüber und
// bleibt trotzdem im Mobil-Fokusmodus (`istMobil` = unter sm/640 px).
test.describe('S6 · Fokusmodus im Band 480–639 px (dort trägt der Streifen das Logo)', () => {
  test.use({ viewport: { width: 500, height: 844 } })

  test('Fokus blendet Logo und Werkzeuge aus, ✕ holt sie zurück', async ({ page }) => {
    await page.goto('/kontakt')
    // Nur der Top-Streifen (die Fusszeile trägt dasselbe Logo-Label).
    const logo = page.getByRole('banner').getByRole('link', { name: /LexMetrik – Startseite/ })
    await expect(logo).toBeVisible()
    const feld = sucheFeld(page)
    const vorher = (await feld.boundingBox())!.width
    await feld.click()
    await expect(logo).toBeHidden()
    const schliessen = page.getByRole('button', { name: 'Suche schliessen' })
    await expect(schliessen).toBeVisible()
    // Das Feld gewinnt die frei gewordene Breite.
    const nachher = (await feld.boundingBox())!.width
    expect(nachher).toBeGreaterThan(vorher)
    // Ziel-Komfortmass der Zone: 44 px (min-h-11/min-w-11), wie die übrigen
    // Streifen-Knöpfe — 36 px lagen darunter (Gegenprüfungs-Befund 7.8.2026).
    const kasten = (await schliessen.boundingBox())!
    expect(kasten.height).toBeGreaterThanOrEqual(44)
    expect(kasten.width).toBeGreaterThanOrEqual(44)
    await schliessen.click()
    await expect(logo).toBeVisible()
    await expect(schliessen).toBeHidden()
    // Fokus kehrt gezielt in den Streifen zurück, nicht auf <body>
    // (Gegenprüfungs-Befund 7.8.2026, Tastatur-/Screenreader-Position).
    await expect(page.getByRole('button', { name: 'Navigation öffnen' })).toBeFocused()
  })
})

// Cowork-Befund 38 (21.8.2026): Fokus per Tab ins Topbar-Suchfeld öffnete das
// Vorschlagsfenster (Leerzustand: Verlauf + Einstiege) — jede Zeile war darin
// ein echter `<a>`-Tab-Stopp, bis zu 9× Tab liess den Fokus im Widget hängen,
// erst Escape löste zuverlässig. Fix: SucheLeerzustand.tsx rendert seither
// dieselbe ARIA-Listbox wie die Trefferliste (role=option, Pfeiltasten + Enter
// über das steuernde Feld) — TAB verlässt das Feld wie jedes normale Kontrollelement.
test.describe('Tastaturfalle in der globalen Suche (Cowork-Befund 38)', () => {
  // §6.3-DEKLARATION (D23, 6.9.2026): das Panel heisst jetzt «Suche — zuletzt
  // geöffnet» statt «Suche — Verlauf und Einstiege», weil der Einstiege-Block
  // ersatzlos gefallen ist. Geprüft wird unverändert die TASTATURFALLE, nicht
  // der Name; der Regex zieht nur nach.
  test('Tab verlässt das leere Suchfeld (Verlauf-Fenster) in ≤3 Schritten', async ({ page }) => {
    await page.goto('/kontakt')
    const feld = sucheFeld(page)
    await feld.click()
    // Leerzustand offen (kein Text getippt) — genau der Befund-38-Auslöser.
    await expect(page.getByRole('listbox', { name: /zuletzt geöffnet/i })).toBeVisible()
    await expect(feld).toBeFocused()

    let verlassen = false
    for (let i = 0; i < 3 && !verlassen; i++) {
      await page.keyboard.press('Tab')
      verlassen = !(await feld.evaluate((el) => el === document.activeElement))
    }
    expect(verlassen, 'Tab liess den Fokus > 3 Schritte im Suchfeld/-fenster hängen').toBe(true)
    // Der Fokus landet auf einem ECHTEN Folge-Element ausserhalb des Feldes,
    // nicht auf einer Listbox-Option (role=option ist bewusst kein Tab-Stopp).
    await expect(page.locator(':focus')).not.toHaveAttribute('role', 'option')
  })

  // §6.3-DEKLARATION (D23, 6.9.2026): der Leerzustand führt seit D23 NUR noch
  // den Verlauf (der «Einstiege»-Block ist gefallen, er wiederholte die
  // Seitenleiste). Ohne Verlauf hat das leere Panel darum keine Optionen mehr,
  // und ein Pfeiltasten-Fall ohne Optionen prüft nichts. Der Fall legt sich
  // seinen Verlauf jetzt selbst an — geprüft wird unverändert das
  // Combobox-Muster (aria-activedescendant folgt der Pfeiltaste, der Fokus
  // bleibt im Feld), nicht mehr und nicht weniger.
  test('Pfeiltasten navigieren die Vorschläge weiterhin (Combobox-Muster bleibt intakt)', async ({ page }) => {
    await page.goto('/rechner/tagerechner')
    await expect(page.locator('h1').first()).toBeVisible()
    await page.goto('/kontakt')
    const feld = sucheFeld(page)
    await feld.click()
    const box = page.getByRole('listbox', { name: /zuletzt geöffnet/i })
    await expect(box).toBeVisible()
    await expect(feld).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('ArrowDown')
    const aktivId = await feld.getAttribute('aria-activedescendant')
    expect(aktivId).toBeTruthy()
    // Attribut-Selektor statt `#id` — die Options-ID enthält `:`/`/` (aus
    // React `useId()` bzw. der Route), ungültig als roher ID-Selektor.
    await expect(box.locator(`[id="${aktivId}"]`)).toHaveAttribute('aria-selected', 'true')
    // Der Fokus selbst bleibt beim Pfeil-Navigieren im Feld (Combobox-Muster).
    await expect(feld).toBeFocused()
  })
})

// ═══ D10/D18 · AUF «/» GIBT ES GENAU EINE SUCHE — UND ZWAR DIE IM KOPF ══════
//
// ── DEKLARIERTE TEST-ÄNDERUNG (§6.3, W2·24-R5-F1C, 6.9.2026) ────────────────
// Der Fall stand hier als D10-Wächter mit UMGEKEHRTEM Vorzeichen: auf «/» sollte
// das eine Suchfeld der HERO sein und der Kopf keines tragen. David hat die
// Frage am 6.9.2026 anders entschieden — «insgesamt braucht es auf der
// startseite keine suche. nur oben reicht» (D18). Die geprüfte ZUSAGE ist
// unverändert und war immer die eigentliche: auf «/» gibt es GENAU EIN
// Suchfeld, der Fokus bleibt dort, das Kürzel «/» zielt darauf und das
// Trefferpanel öffnet an diesem Feld. Gedreht ist nur, WELCHES Feld das ist.
// Umfang und Breiten (@1440/@1030/@390) bleiben; die Prüfung wird dabei nicht
// schwächer, sondern schärfer — sie gilt jetzt für dasselbe Feld wie auf jeder
// anderen Route (§5: ein Suchweg).
//
// ROT ZU BEKOMMEN (§6.7 — einmal gefahren, 6.9.2026): in `layout/Topbar.tsx`
// die HeaderSuche wieder hinter `{!aufStartseite && …}` legen ⇒ «/» trägt kein
// Feld mehr, alle vier Fälle reissen.
test.describe('D18 · «/» trägt EIN Suchfeld, und es steht im Titelblatt', () => {
  const KOPF = 'header [role="search"] input[type="search"]'

  for (const breite of [1440, 1030]) {
    test(`@${breite}: ein Feld, Klick und «/» landen im Kopf`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: 860 })
      await page.goto('/')
      await expect(page.locator(KOPF)).toBeVisible({ timeout: 20_000 })
      // (1) Es gibt kein zweites Suchfeld — insbesondere keines im Inhalt.
      await expect(page.locator('[role="search"] input')).toHaveCount(1)
      await expect(page.locator('main [role="search"] input')).toHaveCount(0)
      // (2) Ein Klick bleibt, wo er hingehört — auch ein paar Frames später.
      await page.locator(KOPF).click()
      await page.waitForTimeout(900)
      expect(await page.evaluate(() => document.activeElement?.closest('header') !== null)).toBe(true)
      // (3) Das Kürzel «/» zielt auf dasselbe Feld.
      await page.locator(KOPF).blur()
      await page.keyboard.press('/')
      await expect(page.locator(KOPF)).toBeFocused({ timeout: 10_000 })
    })
  }

  // @390 trägt der Streifen im Ruhezustand die Lupe statt des Feldes
  // (C1/B10/L3) — die Zusage «genau eine Suche, und sie ist im Kopf» gilt dort
  // über den Lupen-Weg. Gemessen wird darum der geöffnete Zustand.
  test('@390: die Lupe im Kopf öffnet das eine Feld', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 })
    await page.goto('/')
    await expect(page.locator('header [data-suche-lupe]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('main [role="search"] input')).toHaveCount(0)
    const feld = await kopfSucheOeffnen(page)
    await expect(feld).toBeFocused()
    expect(await feld.evaluate((el) => el.closest('header') !== null)).toBe(true)
  })

  test('@1440: das Treffer-Panel öffnet AM Kopf-Feld, nicht im Inhalt', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.locator(KOPF).click()
    await page.locator(KOPF).fill('kündigung')
    const panel = page.locator('[role="listbox"]').first()
    await expect(panel).toBeVisible({ timeout: 20_000 })
    const lage = await page.evaluate((sel) => {
      const f = document.querySelector(sel)!.getBoundingClientRect()
      const p = document.querySelector('[role="listbox"]')!.getBoundingClientRect()
      return { unterFeld: p.top >= f.bottom - 1, imKopf: !!document.querySelector('header [role="listbox"]') }
    }, KOPF)
    expect(lage.imKopf, 'das Panel hängt nicht am Kopf-Feld').toBe(true)
    expect(lage.unterFeld, 'das Panel steht nicht unter dem Feld').toBe(true)
  })
})

// ── D18 · DER `?q=`-PERMALINK GEHT NICHT VERLOREN ───────────────────────────
// Die Hero-Suche schrieb ihren Begriff in `/?q=…`; solche Adressen sind geteilt
// worden und müssen weiter tragen (David: «keine funktion darf verloren
// gehen»). Die Kopf-Suche ist bewusst ein Dropdown OHNE Adress-Kopplung — der
// Permalink zieht darum auf die Volltext-Suche, die `?q=` seit jeher liest.
// ROT ZU BEKOMMEN: die Weiterleitung in `components/start/SuchBlock.tsx`
// entfernen ⇒ `/?q=…` bleibt auf «/» stehen und filtert nichts.
test('D18 · `/?q=…` führt auf die Volltext-Suche mit demselben Begriff', async ({ page }) => {
  await page.goto('/?q=k%C3%BCndigung')
  await expect(page).toHaveURL(/\/suche\?q=k%C3%BCndigung/, { timeout: 20_000 })
  await expect(page.getByRole('searchbox', { name: /durchsuchen/ }).first()).toHaveValue('kündigung')
})
