// @shard-gruppe: 3
// Browser-Smoke der Rubrik V «Gesetze»: Übersicht rendert + lädt das Manifest,
// Klick führt in die Lesesicht (Volltext + TOC + In-Gesetz-Suche), keine
// Console-/Page-Errors, kein Mobil-Overflow. Läuft gegen `vite preview` (dist).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { LESER_SUCHFELD_NAME } from './helpers/leserBeschriftung';

// CI-Härtung 19.7.2026 (BEFUND 3b): der OR-Reader-Test kettet mehrere 15–20-s-Latches
// (Manifest-/Artikel-Index-/Struktur-Load, TOC, In-Gesetz-Suche). Auf dem 2-vCPU-
// Runner unter Starvation riss er reihum das 30-s-Budget. Budget explizit auf 60 s
// (Muster gesetze-pdf-download). INFRASTRUKTUR (Zeitbudget), KEIN Assertion-Change (§6.3).
test.describe.configure({ timeout: 60_000 })

test.describe('/gesetze — Übersicht', () => {
  test('Landeplatz zeigt drei Einstiegskacheln (kein stiller Bund-Default), Bund öffnet die Systematik', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze')
// ── §6.3-DEKLARATION (W2·24-R6/D11, 6.9.2026) · DIE H1 HEISST «GESETZE» ─────
// David 6.9.2026 zum Bild /gesetze: Overline «Rechtssammlung Schweiz» + H1
// «Schweizer Gesetzessammlung» + Erklär-Absatz sagten dreimal dasselbe. Die H1
// trägt seither den BEREICHSNAMEN — dasselbe Wort wie Reiter und Navigation.
// Deklarierte fachliche Änderung: die ERWARTUNG wandert mit, die ABSICHT des
// Falls (die Seite ist da und trägt eine H1) bleibt unberührt.
    await expect(page.getByRole('heading', { name: 'Gesetze', exact: true })).toBeVisible()
    const inhalt = page.getByRole('main')
    // G4 · §4.1: der Landeplatz zeigt die drei gleichwertigen Kacheln — und NICHT
    // still die Bund-Systematik (kein «Alle aufklappen» vor Säulen-Wahl).
    // DEKLARIERTE LOCATOR-ANPASSUNG (R12A/D22, 6.9.2026): «Kantone» und
    // «International» stehen jetzt ZWEIMAL auf der Seite — als Ebenen-Text-
    // Schalter an der Filterzeile und als Landeplatz-Kachel. Gemeint war hier
    // immer die KACHEL; sie trägt Zahl und Einheit im Namen, der Schalter nur
    // das Wort. Der Locator greift darum die Kachel eindeutig (Strict Mode).
    await expect(inhalt.getByRole('button', { name: /Bundesrecht/ })).toBeVisible()
    await expect(inhalt.getByRole('button', { name: /\d+ Kantone/ })).toBeVisible()
    await expect(inhalt.getByRole('button', { name: /Staatsverträge/ })).toBeVisible()
    await expect(inhalt.getByRole('button', { name: 'Alle aufklappen' })).toHaveCount(0)
    // Bund-Kachel wählen → Systematik (default eingeklappt) erscheint.
    await inhalt.getByRole('button', { name: /Bundesrecht/ }).click()
    await expect(page).toHaveURL(/ebene=bund/)
    await expect(inhalt.getByText('Privatrecht', { exact: false }).first()).toBeVisible()
    await inhalt.getByRole('button', { name: 'Alle aufklappen' }).click()
    await expect(inhalt.getByRole('link', { name: /Obligationenrecht/ }).first()).toBeVisible()
    expect(fehler).toEqual([])
  })

  test('Kantone-Kachel: Karte default, Liste zeigt das Kantonsraster', async ({ page }) => {
    await page.goto('/gesetze')
    const main = page.getByRole('main')
    // DEKLARIERTE LOCATOR-ANPASSUNG (R12A/D22): die KACHEL, nicht der gleichnamige
    // Ebenen-Text-Schalter an der Filterzeile (beide führen auf dieselbe Säule).
    await main.getByRole('button', { name: /\d+ Kantone/ }).click()
    // G5 · §4.3.3: die Karte ist der Default-Einstieg (gleichwertig neben der Liste).
    await expect(main.getByRole('group', { name: /Karte der Schweizer Kantone/ })).toBeVisible()
    // Auf «Liste» wechseln → das Auswahlraster (Wappen + Vollname + Zähler) je Kanton;
    // der frühere reine «BE»-Code-Knopf existiert in dieser Form nicht mehr.
    await main.getByRole('group', { name: 'Ansicht' }).getByRole('button', { name: 'Liste' }).click()
    await expect(main.getByRole('button', { name: /Bern/ })).toBeVisible()
  })

  test('kein horizontaler Overflow bei 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze')
    await expect(page.getByRole('heading', { name: 'Gesetze', exact: true })).toBeVisible()
    const b = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    expect(b.scroll, `scrollWidth ${b.scroll} > ${b.client}`).toBeLessThanOrEqual(b.client + 1)
  })
})

test.describe('Lesesicht (über Klick aus der Übersicht)', () => {
  // Härtung (PR #145-Flake, 5.7.2026): der Scroll-Spy-/In-Gesetz-Such-Kontrakt
  // flakte auf dem 1686-Artikel-OR unter gedrosseltem 2-vCPU-CI-Runner (fill-
  // Timeout, weil die Live-Filterung aller 1686 Artikel den Main-Thread sättigt
  // und [data-toc-aktiv] nicht rechtzeitig sichtbar wird). Fix nach dem G2a/G2b-
  // Muster: (1) OR öffnet weiterhin über den Klick-Fluss und beweist Volltext +
  // TOC (reine Ladeprüfung, seitengrössen-robust); (2) der interaktive Reader-
  // Kontrakt (Scroll-Spy + In-Gesetz-Suche) wird auf einem KLEINEN strukturierten
  // Erlass (VGKE, 24 Art. mit Gliederung) geprüft — derselbe Kontrakt, aber
  // seitengrössen-UNABHÄNGIG → CPU-throttle-stabil. Assertions unverändert scharf,
  // vor jeder Interaktion wird die App-Ready-Latte (Suchfeld sichtbar) abgewartet.
  test('OR öffnet mit Volltext + TOC; Scroll-Spy und In-Gesetz-Suche (seitengrössen-unabhängig)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze')
    // G4: erst die Bund-Kachel wählen (kein stiller Default), dann die Systematik
    // aufklappen (default eingeklappt seit 25.6.2026), dann ist der OR-Link klickbar.
    await page.getByRole('main').getByRole('button', { name: /Bundesrecht/ }).click()
    await page.getByRole('main').getByRole('button', { name: 'Alle aufklappen' }).click()
    await page.getByRole('main').getByRole('link', { name: /Obligationenrecht/ }).first().click()
    await expect(page).toHaveURL(/\/gesetze\/bund\/OR/)
    // Kopf + Inhaltsverzeichnis + Artikel 1 (erstes Band offen) — OR öffnet mit Volltext + TOC.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('OR')
    await expect(page.getByText('Gliederung', { exact: true })).toBeVisible()
    await expect(page.locator('#art-1')).toContainText('Willensäusserung')

    // Scroll-Spy + In-Gesetz-Suche auf dem kleinen Erlass. App-Ready abwarten:
    // #art-1 gerendert + Suchfeld interaktiv, BEVOR gescrollt/gefiltert wird.
    await page.goto('/gesetze/bund/VGKE')
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Gliederung', { exact: true })).toBeVisible({ timeout: 20000 })
    const suche = page.getByRole('searchbox', { name: LESER_SUCHFELD_NAME })
    await expect(suche).toBeVisible({ timeout: 20000 })
    // Standort beim Scrollen: der Scroll-Spy markiert die aktive Gliederung im
    // Inhaltsverzeichnis (data-toc-aktiv).
    await page.evaluate(() => window.scrollTo(0, 1200))
    await expect(page.locator('[data-toc-aktiv]').first()).toBeVisible({ timeout: 15000 })
    // In-Gesetz-Suche liefert eine Trefferliste (VGKE Art. 1 «Die Kosten der
    // Verfahren …»).
    // §6.3-DEKLARATION (9.8.2026, W2·19-GLIEDERUNG/S8; Freigabe David 8.8.2026,
    // Bau-Spec §10 Entscheid (a)): der Anker auf die Trefferliste wandert, die
    // geprüfte Sache nicht. Die Liste hiess «N Treffer für «x»» und heisst seit
    // Entscheid (c) «N Artikel · M Fundstellen»; sie steht in der Seitenleiste,
    // und die Lesespalte wird NICHT mehr gefiltert — das Wort «filtert» im
    // bisherigen Kommentar war damit ebenfalls überholt. Der Test hängt seither
    // am stabilen `[data-treffer-leiste]` statt an einem Wortlaut.
    await suche.fill('Kosten')
    await expect(page.locator('[data-treffer-leiste]')).toBeVisible({ timeout: 15000 })
    expect(fehler).toEqual([])
  })

  // Regression (BS-Audit 23.6.2026, S13): lange Komposita in Aufzählungen
  // sprengten auf 390px den Reader (~25px H-Overflow im Steuergesetz). Nach dem
  // min-w-0 + overflow-wrap-Fix darf KEIN horizontaler Overflow mehr auftreten.
  test('Reader ohne horizontalen Overflow bei 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/kanton/BS-640.100')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Erster Artikel-Absatz sichtbar (Inhalt gerendert).
    await expect(page.locator('article').first()).toBeVisible()
    const b = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    expect(b.scroll, `scrollWidth ${b.scroll} > ${b.client}`).toBeLessThanOrEqual(b.client + 1)
  })

  // Regression: flacher Fallback (Erlass OHNE Gliederung/Struktur) darf die Lese-
  // spalte NICHT kollabieren. Vorher landete der einzige Grid-Inhalt in der 16rem-
  // TOC-Spalte → Body ~0 → ein Wort pro Zeile («alles verzogen»).
  // DEKLARIERTE ANPASSUNG (W2·19/S9, e2e-Freigabe David 8.8.2026): sektionslose
  // Erlasse haben seither BEWUSST eine Leiste (Erlass-Übersicht · Kontext ·
  // Trefferliste, Spec §2/§3.2 B3) — die frühere «kein TOC»-Assertion pinnte das
  // alte Loch (Schwachstelle 8). Die Substanz der Regression bleibt geprüft:
  // die Lesespalte kollabiert nicht.
  test('flacher Reader (mit Leiste seit S9) behält gesunde Lesebreite', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1280, height: 1000 })
    await page.goto('/gesetze/kanton/ZH-243')
    const ersterAbsatz = page.locator('article p').first()
    await expect(ersterAbsatz).toBeVisible()
    const breite = (await ersterAbsatz.boundingBox())?.width ?? 0
    // Kollabiert wären ~115px; gesund ist die Lesespalte deutlich breiter.
    expect(breite).toBeGreaterThan(360)
    // NEU: die Leiste existiert auch ohne Gliederung (ehrlicher Zustand statt nichts).
    await expect(page.locator('[data-toc]')).toBeVisible()
    expect(fehler).toEqual([])
  })
})
