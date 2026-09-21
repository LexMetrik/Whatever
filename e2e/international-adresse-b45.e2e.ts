// @shard-gruppe: 2
// alt-adresse:absicht — DIESE Spec fährt Alt-Adressen absichtlich an; das Tor
// «feste Erlass-Adressen sind kanonisch» (src/tests/erlass-adresse.test.ts)
// überspringt sie deshalb. Nur Weiterleitungs-Specs dürfen diese Marke tragen.
// ─── Befund 45 · Staatsverträge unter eigener Adresse ───────────────────────
//
// Cowork-Befund 45 (18.8.2026): Staatsverträge lagen unter `/gesetze/bund/…`,
// während Brotkrume und Reiter-Herkunft «International» sagten. Entscheid David
// 29.8.2026: eigener Pfad `/gesetze/international/:kuerzel`, MIT dauerhaften
// Weiterleitungen.
//
// Was diese Suite beweist:
//   – Die neue Adresse liefert den Leser (200, Volltext, Kopf).
//   – Die ALTE Adresse leitet auf die neue — der Kern des Entscheids.
//   – Ein Deep-Link mit Artikel-Anker ÜBERLEBT die Weiterleitung. Das ist die
//     eigentliche Zusage: eine Weiterleitung, die den Anker verliert, wirft den
//     Leser an den Erlass-Anfang zurück, und genau solche Links stehen in
//     versendeten Rechtsschriften.
//   – Die Säule heisst «International», nicht «Bund» (die Falschangabe, an der
//     der Befund hing). DAMALS stand sie in der Brotkrume des Lesers; seit R6d
//     (D27, 6.9.2026) gibt es die nicht mehr, und die Angabe steht in der
//     Seitenleiste — Herleitung und Messung beim Fall selbst.
//   – Gegenprobe: ein normaler Bundeserlass leitet NICHT — die Weiterleitung
//     darf nicht zur Allerwelts-Umleitung werden.
//   – Keine Schleife: die Zieladresse leitet nicht weiter.
//
// GRENZE (ehrlich, §8): läuft gegen `vite preview` (dist), prüft also den
// CLIENT-Redirect (src/pages/GesetzLeser.tsx → gesetz-leser/adressUmzug.ts) und
// den prerenderten Stub an der Alt-Adresse. Ein 301 auf Server-Ebene gibt es
// bewusst nicht — er liesse sich nur als handgepflegte Schlüsselliste in
// vercel.json schreiben (zweite Wahrheit neben dem Register, §5); Herleitung im
// Kopf von adressUmzug.ts.
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

// CISG: Staatsvertrag MIT gerendertem Volltext (status snapshot) — nur an einem
// solchen lässt sich der Artikel-Anker über die Weiterleitung hinweg prüfen.
const VERTRAG = 'CISG'
const NEU = `/gesetze/international/${VERTRAG}`
const ALT = `/gesetze/bund/${VERTRAG}`
// Art. 35 CISG (Vertragsmässigkeit der Ware) — im Snapshot vorhanden.
const ANKER = 'art-35'

test.describe('Befund 45 · neue Adresse', () => {
  test('die kanonische Adresse liefert den Leser', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    const antwort = await page.goto(NEU)
    expect(antwort?.status(), 'neue Adresse muss 200 liefern').toBe(200)
    await expect(page).toHaveURL(new RegExp(`${NEU}$`))
    // Der Erlass ist wirklich geladen (nicht nur die Hülle): sein Kürzel steht im Kopf.
    await expect(page.getByRole('heading', { name: new RegExp(VERTRAG) }).first()).toBeVisible()
    expect(fehler).toEqual([])
  })

  // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3, D27/R6d, 6.9.2026) · WO DIE HERKUNFT
  //    JETZT STEHT ────────────────────────────────────────────────────────────
  // Der Fall hiess «die Brotkrume nennt International, nicht Bund» und suchte
  // die Angabe in der Brotkrume des Lesers. Die gibt es nicht mehr: R6d hat sie
  // entfernt (`feat(leser): D28 Erlass-Suche im Leser-Kopf, D27 Brotkrume
  // raus`), die Bereichs-Navigation lebt seither allein in der Seitenleiste —
  // dieselbe Verschiebung, die auch `e2e/w224-reiterverhalten` bereits
  // nachgezogen hat (D17: «ich mochte die seitenleiste … und das oben
  // entfernen?»).
  // GEMESSEN 6.9.2026 (gebautes `dist/`, Chromium @1440×900, `/gesetze/
  // international/CISG`): GENAU EIN Element nennt die Säule — der Link
  // «International» → `/gesetze?ebene=international` in
  // `aside[data-app-seitenleiste]`; kein Element nennt «Bund».
  // Die ABSICHT des Befunds ist unverändert: Herkunft und Rückweg des
  // Staatsvertrags heissen «International», nie «Bund». Nachgeführt ist nur der
  // Ort, an dem beides steht. Die Seitenleiste startet seit D25/D26
  // eingeklappt; sie wird darum vorab aufgeklappt — Testaufbau, keine
  // Assertion.
  test('die Säule heisst International, nicht Bund', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => {
      try { localStorage.setItem('lexmetrik-seitenleiste-eingeklappt.v2', '0') } catch { /* privater Modus */ }
    })
    await page.goto(NEU)
    const saeule = page.getByRole('link', { name: 'International' }).first()
    await expect(saeule).toBeVisible()
    // Der Rückweg führt auf die Säule, nicht auf den Bund — die Adresse des
    // Links ist die eigentliche Zusage, der Text allein wäre Dekoration.
    await expect(saeule).toHaveAttribute('href', '/gesetze?ebene=international')
    // Die Falschangabe des Befunds darf nicht daneben stehen bleiben.
    await expect(page.getByRole('link', { name: /^Bund$/ })).toHaveCount(0)
  })
})

test.describe('Befund 45 · die Alt-Adresse leitet dauerhaft weiter', () => {
  test('alte Adresse landet auf der neuen', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    const antwort = await page.goto(ALT)
    // Kein 404: die Alt-Adresse bleibt erreichbar (Prerender-Stub bzw. SPA-Fallback).
    expect(antwort?.status(), 'Alt-Adresse darf nie 404 liefern').toBeLessThan(400)
    await expect(page).toHaveURL(new RegExp(`${NEU}$`))
    expect(fehler).toEqual([])
  })

  test('der Artikel-Anker überlebt die Weiterleitung', async ({ page }) => {
    await page.goto(`${ALT}#${ANKER}`)
    await expect(page).toHaveURL(new RegExp(`${NEU}#${ANKER}$`))
    // Nicht nur die URL: der Zielartikel steht wirklich da.
    const ziel = page.locator(`#${ANKER}`)
    await expect(ziel).toBeVisible()
  })

  test('die Weiterleitung hinterlässt keinen History-Eintrag (kein Zurück-Loop)', async ({ page }) => {
    await page.goto('/gesetze')
    await page.goto(ALT)
    await expect(page).toHaveURL(new RegExp(`${NEU}$`))
    await page.goBack()
    await expect(page).toHaveURL(/\/gesetze(\?.*)?$/)
  })

  test('der Stub an der Alt-Adresse kanonisiert auf die neue', async ({ request }) => {
    // Roh geholt, ohne SPA-Takeover: so sieht ein Crawler die Seite.
    const roh = await request.get(ALT)
    expect(roh.status()).toBe(200)
    const html = await roh.text()
    expect(html, 'canonical fehlt oder zeigt nicht auf die neue Adresse')
      .toContain(`rel="canonical" href="https://lexmetrik.vercel.app${NEU}"`)
    expect(html, 'die Alt-Adresse darf nicht indexiert werden').toContain('content="noindex, follow"')
  })
})

test.describe('Befund 45 · die Übersicht verlinkt die neue Adresse', () => {
  test('die Säule ?ebene=international führt direkt auf /gesetze/international/…', async ({ page }) => {
    await page.goto('/gesetze?ebene=international')
    // Der Link muss die KANONISCHE Adresse tragen. Stünde hier noch die alte,
    // wäre jeder Klick aus der Übersicht ein Umweg über die Weiterleitung —
    // technisch funktionierend, aber genau der Zustand, den Befund 45 meint.
    const link = page.locator(`a[href^="/gesetze/international/${VERTRAG}"]`).first()
    await expect(link, 'Übersicht verlinkt den Staatsvertrag nicht kanonisch').toHaveCount(1)
    await expect(page.locator(`a[href^="/gesetze/bund/${VERTRAG}"]`)).toHaveCount(0)
  })
})

// ─── Nachzüge aus der adversarialen Gegenprüfung (29.8.2026) ────────────────
//
// Drei Mängel, die der Bau selbst erzeugt hatte. Sie stehen hier und nicht nur
// im Unit-Tor, weil alle drei erst im laufenden Browser sichtbar werden: der
// erste als gerenderte Seite, die beiden anderen als GESPEICHERTER Zustand im
// localStorage — die Ebene, auf der eine Weiterleitung zum Dauerzustand wird.

test.describe('Befund 45 · Nachzüge der Gegenprüfung', () => {
  test('(M1) die Ebene ist nicht frei wählbar — /gesetze/international/OR leitet zurück', async ({ page }) => {
    // Vorher: 200 mit vollständiger OR-Seite (1686 Artikel) und Brotkrume
    // «Bund» — Befund 45 spiegelverkehrt, eine zweite Adresse je Bundeserlass.
    await page.goto('/gesetze/international/OR')
    await expect(page).toHaveURL(/\/gesetze\/bund\/OR$/)
  })

  test('(M2) eine Alt-Adresse erzeugt GENAU EINEN Reiter', async ({ page }) => {
    // Vorher: der Reiter-Tracker lief vor dem Umzugs-Sprung und merkte beide
    // Adressen — ein toter Zweitreiter je Bestandsnutzer und je versendetem Link.
    await page.goto(ALT)
    await expect(page).toHaveURL(new RegExp(`${NEU}$`))
    const roh = await page.evaluate(() => window.localStorage.getItem('lexmetrik-tabs'))
    const pfade = (JSON.parse(roh ?? '[]') as { path: string }[]).map((t) => t.path)
    expect(pfade, 'Alt-Adresse hinterlässt einen zweiten, toten Reiter').toEqual([NEU])
  })

  test('(M3) ein geteiltes Pane wird kanonisch gespeichert', async ({ page }) => {
    // Vorher: das Pane rendert richtig, aber `lexmetrik-panes` behielt die
    // Alt-Adresse dauerhaft — die Brücke wäre zum Dauerzustand geworden.
    await page.goto(`/gesetze/bund/OR?p=${ALT}`)
    await page.waitForTimeout(1200)
    const roh = await page.evaluate(() => window.localStorage.getItem('lexmetrik-panes'))
    expect(JSON.parse(roh ?? '[]'), 'Pane speichert die Alt-Adresse weiter').toEqual([NEU])
  })
})

test.describe('Befund 45 · Gegenproben', () => {
  test('ein normaler Bundeserlass leitet NICHT weiter', async ({ page }) => {
    await page.goto('/gesetze/bund/OR')
    await expect(page).toHaveURL(/\/gesetze\/bund\/OR$/)
  })

  test('die Zieladresse leitet nicht weiter (keine Schleife)', async ({ page }) => {
    await page.goto(NEU)
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(new RegExp(`${NEU}$`))
  })
})
