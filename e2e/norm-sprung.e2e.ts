// @shard-gruppe: 3
// Browser-Smoke des Norm-Sprungs in der NORMALEN Suchleiste (A5 · U-SUCHE,
// David 5.7.2026). Der Kontrakt ist die Sprung-FUNKTION, nicht mehr eine eigene
// ⌘K-Palette (die ist entfallen): erkennt die HeaderSuche eine Norm («OR 257d»,
// «ABRG 3»), erscheint der Direkt-Sprung als OBERSTER Treffer (Sprung-Badge),
// Enter springt zum Deep-Link. Freitext liefert keinen Sprung, sondern die
// gruppierte Universal-Suche. ⌘K/Ctrl-K fokussiert das Feld (kein Overlay).
// Läuft gegen `vite preview` (dist).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { clsBeobachtenInstallieren, clsAuslesen } from './helpers/cls'
import { kopfSucheOeffnen, sprungZeile } from './helpers/kopfSuche'
import { OR_LESER_FRIST } from './helpers/orLeser'

// CI-Härtung 19.7.2026 (BEFUND 3b): die Sprung-Tests warten per 20-s-Latch auf den
// EINMAL-Load des ~4-MB-Artikel-Index (P3 u. a.). Auf dem 2-vCPU-Runner unter
// Starvation überschritt dieser Latch reihum das globale 30-s-Test-Budget. Budget
// darum explizit auf 60 s (Muster gesetze-pdf-download). Der A9-CLS-Test behält sein
// eigenes test.slow(). INFRASTRUKTUR (Zeitbudget), KEIN Assertion-Change (§6.3):
// Sprung-/CLS-Assertions unberührt, Timeout greift nur bei Überschreitung.
//
// §17-Wurzelfix 12.9.2026 (OR-Leser-e2e-Härtung, FAHRPLAN-OFFENE-BEFUNDE): auf
// 150 s angehoben — die beiden `OR_LESER_FRIST`-Wartepunkte unten tragen seit
// heute je das zentrale 60-s-Budget (`helpers/orLeser.ts`) statt vorher 30 s;
// bei 60 s (statt bisher 30 s) je Wartepunkt reichte das alte 60-s-Test-Budget
// nicht mehr, um beiden im Ernstfall ihr volles Budget zu lassen.
test.describe.configure({ timeout: 150_000 })

// NACHZUG 4.9.2026 (§17-Wurzel-Fix Shard 3/8) — DEKLARIERTE TEST-INFRASTRUKTUR,
// KEIN Assertion-Change (§6.3): Der Datei-Kopf hob am 19.7.2026 das TEST-Budget
// auf 60 s, liess die einzelnen `expect` aber auf dem globalen 10-s-Default
// (`playwright.config.ts`). Die Assertions NACH dem Sprung warten auf den
// OR-Leser — dieselbe schwere Kette (Artikel-Index-/Struktur-Load), für die das
// Schwester-e2e `leser-suche-a35-a40-a41` seit dem 19.7. 20-s-Fristen setzt. Auf
// dem 2-vCPU-Runner riss darum das ENGSTE Glied (10 s) innerhalb eines Budgets,
// das 60 s erlaubt. Diese Frist gleicht die beiden an; sie greift nur bei
// Überschreitung, verlangsamt grüne Läufe nicht und lässt innerhalb der 60 s
// weiterhin Raum für die vorangehenden Prüfschritte. Geprüft wird unverändert
// DASSELBE (Überschrift trägt «OR», Ziel-Artikel im DOM).
//
// §17-Wurzelfix 12.9.2026: die lokale Konstante (30 s) ist zur zentralen
// `OR_LESER_FRIST` (60 s, `helpers/orLeser.ts`) zusammengezogen — #682 härtete
// diese Datei und `leser-suche-a35-a40-a41` je mit eigener Kopie derselben
// Zahl; die Kopie entfällt hier (Fahrplan-Eintrag «#682 härtete nur
// norm-sprung/leser-suche»). Rot-/Grün-Beweis der 60-s-Zahl: dort.

// ── §6.3-DEKLARATION 6.9.2026 (W2·24-DESIGN-IDENTITAET, Treffer-Anatomie D23) ─
// Die Sprung-Zeile trug bis hierher ein gerahmtes Etikett mit dem Wort «Sprung»
// bzw. «Direkt öffnen»; F1/F4 dieser Runde haben die AKTIONS-Etiketten aus der
// Trefferliste gestrichen (`src/components/suche/trefferAnatomie.ts`) — an ihre
// Stelle ist der Griff «↵» der Zeile getreten. Die Wächter unten prüfen darum
// dieselbe Zusage an ihrer neuen Stelle: `sprungZeile(page)` (Herleitung und
// Rot-Rezept an EINER Stelle, `helpers/kopfSuche.ts`). Die Gruppen-Überschrift
// «Norm-Sprung»/«Entscheid-Sprung» bleibt unverändert mitgeprüft, ebenso die
// Reihenfolge (oberster Treffer) und der Sprung selbst (Enter → URL).

// Die eine, überall sichtbare Kopf-Suchleiste (ARIA-Combobox).
const sucheFeld = (page: Page) => page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })
// Das Trefferpanel ist eine ARIA-Listbox; der Sprung ist die erste Gruppe.
const listbox = (page: Page) => page.getByRole('listbox', { name: 'Suchtreffer' })

test.describe('Norm-Sprung in der normalen Suchleiste (A5)', () => {
  test('«OR 257d» ⇒ Sprung ist oberster Treffer, Enter springt zu #art-257_d (P3)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze')
    const feld = sucheFeld(page)
    await feld.click()
    await feld.fill('OR 257d')
    // Der Norm-Sprung erscheint als oberste Gruppe mit Sprung-Badge + amtlichem Titel.
    const box = listbox(page)
    await expect(box).toBeVisible()
    await expect(box.getByText('Norm-Sprung', { exact: true })).toBeVisible()
    await expect(sprungZeile(page)).toBeVisible()
    // Der Sprung ist die ERSTE Option (oberster Treffer, A5).
    await expect(box.getByRole('option').first()).toContainText('OR')
    await expect(box.getByRole('option').first()).toContainText('257d')
    // Enter (ohne Pfeil-Auswahl) springt auf den Direkt-Treffer.
    await feld.press('Enter')
    await expect(page).toHaveURL(/\/gesetze\/bund\/OR#art-257_d$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('OR', { timeout: OR_LESER_FRIST })
    // Der Ziel-Artikel steht im DOM (Anker auflösbar, §15 Funktions-Treue).
    await expect(page.locator('#art-257_d')).toHaveCount(1, { timeout: OR_LESER_FRIST })
    expect(fehler).toEqual([])
  })

  test('kantonaler Sprung mit Kantons-Angabe («ABRG 3»)', async ({ page }) => {
    await page.goto('/gesetze')
    const feld = sucheFeld(page)
    await feld.click()
    await feld.fill('ABRG 3')
    await expect(sprungZeile(page)).toBeVisible()
    await feld.press('Enter')
    await expect(page).toHaveURL(/\/gesetze\/kanton\/AR-621\.12#art-3$/)
  })

  test('«BGE 152 II 19» ⇒ Entscheid-Sprung «Direkt öffnen», Enter öffnet den Entscheid (S2)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze')
    const feld = sucheFeld(page)
    await feld.click()
    await feld.fill('BGE 152 II 19')
    const box = listbox(page)
    await expect(box).toBeVisible()
    await expect(box.getByText('Entscheid-Sprung', { exact: true })).toBeVisible()
    await expect(sprungZeile(page)).toBeVisible()
    await expect(box.getByRole('option').first()).toContainText('BGE 152 II 19')
    await feld.press('Enter')
    await expect(page).toHaveURL(/\/rechtsprechung\/bge_152_II_19$/)
    expect(fehler).toEqual([])
  })

  test('BGE ohne Präfix «152 II 19» springt ebenfalls', async ({ page }) => {
    await page.goto('/gesetze')
    const feld = sucheFeld(page)
    await feld.click()
    await feld.fill('152 II 19')
    await expect(sprungZeile(page)).toBeVisible()
    await feld.press('Enter')
    await expect(page).toHaveURL(/\/rechtsprechung\/bge_152_II_19$/)
  })

  test('BGE nicht im Bestand ⇒ §8-ehrliche Zeile + amtlicher bger.ch-SUCH-Link (A40, kein stilles Rauschen)', async ({ page }) => {
    await page.goto('/gesetze')
    const feld = sucheFeld(page)
    await feld.click()
    await feld.fill('BGE 1 I 1')
    const box = listbox(page)
    await expect(box.getByText(/nicht im Bestand/)).toBeVisible()
    // A40 (David 16.7.2026): EHRLICHER Such-Link statt konstruiertem highlight_docid-
    // Permalink (der landete beim falschen Entscheid). «suchen» statt «öffnen».
    const amtlich = box.getByRole('link', { name: /beim Bundesgericht suchen/ })
    await expect(amtlich).toBeVisible()
    await expect(amtlich).toHaveAttribute('href', /bger\.ch.*type=simple_query.*query_words=BGE(%20|\+|\s)1(%20|\+|\s)I(%20|\+|\s)1/)
    await expect(amtlich).not.toHaveAttribute('href', /highlight_docid/)
    await expect(amtlich).toHaveAttribute('target', '_blank')
  })

  test('Freitext zeigt KEINEN Sprung, sondern die gruppierte Suche', async ({ page }) => {
    await page.goto('/gesetze')
    const feld = sucheFeld(page)
    await feld.click()
    await feld.fill('Kündigung')
    const box = listbox(page)
    await expect(box).toBeVisible()
    // Kein Sprung-Vorschlag (kein Fehl-Sprung) …
    await expect(box.getByText('Norm-Sprung', { exact: true })).toHaveCount(0)
    await expect(sprungZeile(page)).toHaveCount(0)
    // … aber die Universal-Suche liefert Treffer.
    await expect(box.getByRole('option').first()).toBeVisible()
  })

  test('§8-Korpus-Offenlegung: Fusszeile «Durchsucht …» + Link auf /abdeckung (S3/E1)', async ({ page }) => {
    await page.goto('/gesetze')
    const feld = sucheFeld(page)
    await feld.click()
    await feld.fill('Miete')
    // Fusszeile erscheint, sobald die Manifeste geladen sind (für jede Query).
    await expect(page.getByText(/Durchsucht:/)).toBeVisible()
    const link = page.getByRole('link', { name: /Was ist drin/ })
    await expect(link).toHaveAttribute('href', '/abdeckung')
    await link.click()
    await expect(page).toHaveURL(/\/abdeckung$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Was ist durchsuchbar')
  })

  test('⌘K/Ctrl-K fokussiert die Suchleiste (kein Overlay mehr)', async ({ page }) => {
    await page.goto('/gesetze')
    // Kein Dialog/Overlay: die frühere Palette existiert nicht mehr.
    await page.keyboard.press('Control+k')
    await expect(sucheFeld(page)).toBeFocused()
    await expect(page.getByRole('dialog', { name: /Sprung zum Artikel/ })).toHaveCount(0)
  })

  // ── DEKLARIERTE ANPASSUNG (R12A/D22, 6.9.2026) · DER KASTEN IST WEG, DER
  //    WEG IST GEBLIEBEN ────────────────────────────────────────────────────
  // Hier stand «Landeplatz-CTA auf /gesetze fokussiert die Suchleiste»: der
  // Kasten «Direkt zum Artikel springen» auf /gesetze tat nichts anderes, als
  // die Kopf-Suche zu fokussieren — die dritte Suche derselben Seite (D22
  // Ziff. 3). Er ist entfernt. Was er versprach, muss der verbliebene Weg
  // halten, und genau das prüft dieser Test jetzt END-ZU-END statt nur den
  // Fokus: ab /gesetze «OR 257d» in die Kopf-Suche, Enter, Artikel 257d OR.
  // Die Zusicherung ist damit schärfer, nicht schwächer.
  test('Norm-Sprung ab /gesetze ohne CTA-Kasten: «OR 257d» → Art. 257d OR', async ({ page }) => {
    await page.goto('/gesetze')
    // Der Kasten existiert nicht mehr (Rot-Beweis-Richtung: käme er zurück,
    // stünde die dritte Suche wieder da).
    await expect(page.getByRole('main').getByRole('button', { name: /Direkt zum Artikel springen/ })).toHaveCount(0)
    const feld = sucheFeld(page)
    await expect(feld).toBeVisible({ timeout: 20000 })
    await feld.click()
    await feld.fill('OR 257d')
    await expect(sprungZeile(page)).toBeVisible({ timeout: 20000 })
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/gesetze\/bund\/OR#art-257_d$/, { timeout: 20000 })
    await expect(page.getByRole('heading', { level: 1 })).toContainText('OR', { timeout: 20000 })
  })

  // A9 (Querschnitt, DoD 10.4): Tippen/Navigieren/Springen bleibt unter starker
  // CPU-Drossel flüssig — ohne Timeout-Nähe — und die Interaktion verursacht
  // KEINEN Layout-Shift (CLS ≈ 0), weil der Sprung oben nur anwächst und nichts
  // darüber verschiebt. Der Kontrakt ist «Interaktion flüssig» (auf dem WARMEN
  // Index), NICHT «Kaltstart unter Drossel»: der Einmal-Load des ~4 MB-Index
  // läuft darum ungedrosselt VOR der Messung.
  test('A9: Suche tippen/navigieren/springen unter starker CPU-Drossel flüssig, CLS 0', async ({ page }) => {
    // Dieser Test fährt bewusst ZWEI Phasen: ungedrosselter Warmlauf (Einmal-Load
    // des ~4 MB-Index) + gedrosselte Mess-Interaktion. Auf dem 2-vCPU-CI-Runner
    // brauchen beide Phasen zusammen mehr als das 30-s-Default-Container-Budget —
    // nicht wegen Interaktions-Lag, sondern wegen des Einmal-Ladens auf schwacher
    // Hardware. `test.slow()` verdreifacht NUR das Container-Budget (90 s); die
    // einzelnen web-first-Assertions unten bleiben eng gebunden (12–15 s) und sind
    // weiterhin der SCHARFE Flüssigkeits-Beweis («ohne Timeout-Nähe», A9).
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze')
    const feld = sucheFeld(page)
    // App-Ready-Latte: die Kopf-Suchleiste (ARIA-Combobox) rendert NUR der Client
    // (nicht im Crawler-HTML) — erst wenn sie sichtbar ist, hängen die React-Handler.
    // Auf dem langsamen CI-Runner grosszügig binden, damit der Warmlauf nicht auf
    // eine noch nicht hydrierte Leiste tippt (sonst Klick-/fill-Timeout).
    await expect(feld).toBeVisible({ timeout: 20000 })
    // ZUSÄTZLICHE Ready-Latte auf den ROUTEN-Inhalt (20.7.2026). Die Kopf-Suchleiste
    // gehört zur App-SHELL und steht bereits, während die Route selbst noch am
    // Suspense-Fallback hängt. Beginnt die Messung in diesem Fenster, fällt der
    // Fallback-Wechsel (`App.tsx` min-h-screen → echte Routenhöhe) in das Budget —
    // ein Lade-Shift, den dieser INTERAKTIONS-Test laut Kontrakt nicht misst.
    // Empirisch: wartet der Warmlauf zusätzlich auf den Routen-Inhalt, misst der
    // Test CLS 0 bei 10×, 20× und 30× Drossel; ohne diese Latte riss er ab 8×
    // reproduzierbar (5 von 8 Läufen, bitgleiche Werte). Reine Ready-Bedingung —
    // Budget und Prüfschritte unverändert (§6.3).
    // DEKLARIERTE ANPASSUNG (R12A/D22): die Ready-Latte hing am CTA-Kasten, der
    // entfallen ist. Sie greift jetzt die Kernerlass-Zeile derselben Route —
    // ebenfalls Routen-Inhalt (nicht App-Shell), also derselbe Beweis dafür,
    // dass die Route und nicht nur die Shell steht. Budget und Prüfschritte
    // unverändert (§6.3).
    await expect(
      page.getByRole('main').getByRole('link', { name: 'OR', exact: true }),
    ).toBeVisible({ timeout: 20000 })
    await feld.click()
    const box = listbox(page)
    // WARMLAUF (ungedrosselt): der erste Tastendruck stösst das einmalige Lazy-
    // Laden des ~4 MB-Artikel-Index + Browse-Manifests an (§15.3 — ein aufgeschobener
    // Ladezeitpunkt, KEIN Interaktions-Lag). Wir laden ihn vor der Messung, damit die
    // A9-Messung die reine Interaktion (Parser + Render) misst, nicht diesen Einmal-Load.
    await feld.fill('OR 257d')
    await expect(sprungZeile(page)).toBeVisible({ timeout: 20000 })
    // ── WARMLAUF-LATTE korrigiert (26.7.2026, Ursachen-Fix) ──────────────────────
    // Der «Sprung»-Treffer beweist den warmen Index NICHT: er ist der
    // DETERMINISTISCHE Norm-Sprung aus dem Register/Parser und steht schon, während
    // der ~4-MB-Artikel-Index noch lädt. Gemessen (4-vCPU-Container, CI-Zweig): nach
    // dem Erscheinen von «Sprung» sind noch 11 586 · 13 065 · 13 546 · 14 484 ms
    // Ladearbeit offen. Diese Restlast fiel bisher in die GEDROSSELTE Messphase und
    // erschien dort — mit 4× multipliziert — als ~48-s-Stall der ersten Such-Latte,
    // streng bimodal (entweder ~0.5 s oder ~48 s, je nachdem ob der Load vor dem
    // Query-Reset fertig wurde). Auf dem 2-vCPU-Runner riss er alle drei Versuche
    // (PR #382, Shard 7/8) — und war NICHT Interaktions-Lag, sondern genau der
    // Einmal-Load, den dieser Warmlaufsschritt laut Kontrakt ausschliessen soll
    // («auf dem WARMEN Index, NICHT Kaltstart unter Drossel», Kommentar oben).
    //
    // Darum wartet der Warmlauf jetzt auf den Ladezustand, den er zu erreichen
    // behauptet: die SICHTBARE Ergebnis-Kopfzeile erscheint erst, wenn JEDE
    // Suchgruppe fertig ist (`SuchResultate.tsx` hält den reservierten Slot bis
    // dahin auf `invisible`) — Artikel-Index UND alle Manifeste.
    //
    // Das VERSCHÄRFT die Prüfung, statt sie zu lockern: die gedrosselten Latten
    // unten bleiben byte-gleich (12 000/15 000 ms) und lösen mit dem echten
    // Warmlauf in ~0.4–0.5 s auf, also bei ~4 % ihres Budgets statt im Münzwurf.
    // Kein expect entfernt, kein Budget gehoben (§6.3).
    await expect(
      page.locator('p[aria-hidden="true"]', { hasText: /\d+ Treffer/ }),
    ).toBeVisible({ timeout: 30_000 })
    // Die Kopfzeile allein deckt nur die Stufe, die `laedt` bindet. Der
    // Index-Aufbau läuft aber ZWEISTUFIG (`lib/suche/artikelVolltext.ts`): die
    // gestaffelte zweite Stufe setzt `unvollstaendig`, NICHT `laedt`, und wird von
    // `allesGeladen` darum nicht erfasst. Sichtbar ist sie am Vorbehalt «wird noch
    // ergänzt», den die Kopfzeile bei `waechstNoch` anhängt (`SuchResultate.tsx`).
    // Erst wenn der weg ist, ist der Index wirklich fertig — sonst blieb ein Rest
    // der zweiten Stufe im gedrosselten Fenster und damit ein Rest des Rennens.
    await expect(
      page.locator('p[aria-hidden="true"]', { hasText: /wird noch ergänzt/ }),
    ).toHaveCount(0, { timeout: 40_000 })
    await feld.fill('')
    await expect(box).toBeHidden()

    // CLS-Beobachter VOR der gemessenen Interaktion scharf schalten (nur unerwartete
    // Shifts). Mit Quellen-Erfassung: bei Überschreitung nennt die expect-Meldung
    // die Top-shiftenden Elemente + nav-relative Zeitstempel im Klartext.
    // `nurAbInstall` (20.7.2026): NUR Shifts ab hier zählen. Der `buffered`-Observer
    // rechnete zuvor die Shifts des bewusst ungedrosselten WARMLAUFS oben (und den
    // Seitenaufbau) diesem Interaktions-Budget zu — Beleg + Begründung im Kopf von
    // `helpers/cls.ts`. Das Budget 0.05 unten bleibt unverändert.
    await clsBeobachtenInstallieren(page, true, true)
    // CI-realistischer Drossel-Grad: der 2-vCPU-CI-Runner drosselt durch Contention
    // schon von sich aus; 6× käme dort effektiv ≈12× nahe und misst dann Host-
    // Auslastung statt Interaktions-Lag (systematisch rot in #160/#161/#162). Darum
    // auf CI 4× (auf 2 vCPU ≈8× effektiv, weiterhin harte Drossel), lokal 6× auf
    // mehr Kernen. Der KONTRAKT (tippen/navigieren/springen ohne Hänger, CLS<0.05)
    // bleibt in BEIDEN Fällen bestehen und wird unverändert gemessen (§6.3).
    const drosselRate = process.env.CI ? 4 : 6
    // Ab hier gedrosselt (CDP, nur Chromium).
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: drosselRate })

    // Die SUCH-Interaktion auf dem WARMEN Index (tippen → Sprung sichtbar → über
    // Gruppen navigieren) muss unter Drossel FLÜSSIG bleiben: jede web-first-
    // Assertion löst innerhalb ihres eng gebundenen Timeouts (12–15 s) auf, ohne
    // ihm nahezukommen («ohne Timeout-Nähe», A9). Ein starrer Wall-Clock-Wert
    // wäre auf einem ausgelasteten Host unzuverlässig und misst Host-Contention
    // statt Interaktions-Lag — deshalb ist die gebundene Auflösung selbst der Beweis.
    await feld.fill('OR 257d')
    await expect(sprungZeile(page)).toBeVisible({ timeout: 12000 })
    // Über die Gruppen navigieren (Pfeil runter/hoch) — bleibt reaktiv; die aktive
    // Option wandert (aria-activedescendant gesetzt).
    await feld.press('ArrowDown')
    await feld.press('ArrowDown')
    await feld.press('ArrowUp')
    await expect(feld).toHaveAttribute('aria-activedescendant', /.+/, { timeout: 12000 })
    // CLS der Such-Interaktion messen, SOLANGE die Seite noch dieselbe ist
    // (Enter navigiert weg und ersetzt das window/__cls). Die Sprung-Gruppe wächst
    // nur oben an und verschiebt nichts → CLS ≈ 0 (§15.2).
    const { cls, bericht } = await clsAuslesen(page)
    expect(cls, `CLS ${cls} — ${bericht}`).toBeLessThan(0.05)
    // SPRINGEN (deterministisch — CI-Härtung QS-PERF, §15.3-Nachzug zu #183):
    // Enter OHNE aktive Pfeil-Auswahl nimmt den OBERSTEN Treffer = den Norm-Sprung
    // (exakt der A5-Kontrakt des P3-Tests oben). Die vorangehende Pfeil-Navigation
    // hat NUR die Reaktivität bewiesen (aria-activedescendant); sie darf den Sprung
    // NICHT steuern, denn `aktivIndex` ist ein POSITIONS-Index in die async
    // wachsende Trefferliste: die per useDeferredValue entkoppelte ~4-MB-
    // Artikelgruppe (#183) landet «einen Tick später», sodass ein arrow-gesetzter
    // Index unter Drossel auf einen nachträglich eingeschobenen Artikel-Treffer
    // zeigt (real reproduziert: Enter landete auf SCHKG#art-257 statt OR). Ein
    // Query-Reset (leeren → neu tippen) setzt aktivIndex auf -1 (HeaderSuche.tsx),
    // damit Enter deterministisch den Sprung nimmt. Alles WEITERHIN unter Drossel —
    // der Fluiditäts-Beweis (tippen → Sprung sichtbar → springen) bleibt scharf.
    await feld.fill('')
    await expect(box).toBeHidden()
    await feld.fill('OR 257d')
    await expect(sprungZeile(page)).toBeVisible({ timeout: 12000 })
    await feld.press('Enter')
    await expect(page).toHaveURL(/\/gesetze\/bund\/OR#art-257_d$/, { timeout: 15000 })
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    expect(fehler).toEqual([])
  })

  // ── §6.3-DEKLARATION (29.8.2026, Entscheid David C1/B10/L3) ────────────────
  // GEÄNDERT ist NUR der Weg zum Feld, nicht die Zusage. Unter 480 px ist die
  // globale Suche im Ruhezustand seit dem Design-Review eine 44-px-Lupe (Befund:
  // das Feld war dort 28 px breit, ein leerer Rahmen ohne erkennbaren Zweck);
  // das Feld erscheint nach dem Tap über die volle Streifenbreite. Der Fluss
  // heisst darum jetzt «Lupe tippen → Feld offen → Sprung» statt «Feld tippen →
  // Sprung». Der Helfer trifft die Breiten-Fallunterscheidung an EINER Stelle
  // (`helpers/kopfSuche.ts`, §5).
  // UNVERÄNDERT und gleich streng: der Norm-Sprung MUSS auf dem Telefon ohne ⌘K
  // erreichbar sein, und die geöffnete Trefferfläche darf @390 keinen
  // horizontalen Überlauf erzeugen — beide Assertions stehen wörtlich wie zuvor.
  // ROT ZU BEKOMMEN: die Sprung-Gruppe mobil ausblenden ⇒ «Sprung» fehlt; die
  // feste Seitenverankerung des Panels (`inset-x-2`) durch eine Feldbreite
  // ersetzen ⇒ scrollWidth > clientWidth. NEU zusätzlich rot: eine tote Lupe
  // (Knopf da, Feld ohne Fokus) reisst schon im Helfer — @390 wäre die Suche
  // dann gar nicht mehr erreichbar, und genau das ist die Zusage dieses Falls.
  test('Mobil (390px): Suchleiste trägt den Sprung ohne ⌘K, kein Overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze')
    const feld = await kopfSucheOeffnen(page)
    await feld.fill('OR 257d')
    await expect(sprungZeile(page)).toBeVisible()
    // Kein horizontaler Overflow bei offenem Panel auf 390px.
    const b = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    expect(b.scroll, `scrollWidth ${b.scroll} > ${b.client}`).toBeLessThanOrEqual(b.client + 1)
  })
})
