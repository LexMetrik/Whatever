// @shard-gruppe: 5
// Browser-Smoke der Rechtsprechungs-Auflistung am Artikel (FAHRPLAN-DATENHALTUNG
// §11.2, Weiche B). Läuft gegen `vite preview` (dist).
//
// GELÖSCHT 21.8.2026 (H5): die Fälle (a) «Artikel MIT Entscheiden zeigt die
// Auflistung», (b) «ohne Treffer/Facette steht am Artikelfuss NICHTS» und
// (d) «V3: Chip zeigt den Kurztext auf Hover + Tastatur» prüften den
// Ist-Hüllen-Artikelfuss (`[data-bezuege-zeile]`, `[data-rechtsprechung-menu]`,
// mit Pos. 12 aufgegeben). V3-Deckung stand bzw. steht: `leser-v3-panel-
// facetten` (a, Ort) + `leser-v3-panel-zaehler` (Zähler) für (a);
// `leser-v3-panel-nachzug` (f) für (b); `e2e/leser-v3-panel-kurztext.e2e.ts`
// (21.8.2026, §7b Pos. 3) für (d). Verbleibt: (c), hüllenneutral.
import { test, expect } from '@playwright/test'
import { OR_LESER_FRIST } from './helpers/orLeser'

// §17-Wurzelfix 12.9.2026 (FAHRPLAN-OFFENE-BEFUNDE «OR-Leser-e2e auf
// 60-s-Budget härten»): der einzige Test dieser Datei wartet ohne
// Test-Zeitbudget-Override auf den Client-Takeover von `/gesetze/bund/OR`
// (default 30 s) — zu knapp, um dem `#art-1`-Wartepunkt unten sein eigenes
// 60-s-Budget zu geben (Muster gesetze-pdf-download / gesetze-ux-9punkte).
// INFRASTRUKTUR (Zeitbudget), KEIN Assertion-Change (§6.3).
test.describe.configure({ timeout: 90_000 })

test.describe('Rechtsprechungs-Auflistung im ArtikelLeser (OR)', () => {
  test('(c) vollständiger Normtext bleibt im DOM (Ctrl+F / §15.1)', async ({ page }) => {
    await page.goto('/gesetze/bund/OR')
    // Rot-/Grün-Beweis in `helpers/orLeser.ts`: 60-s-Budget statt 10-s-Default.
    await expect(page.locator('#art-1')).toBeVisible({ timeout: OR_LESER_FRIST })
    // Tiefe Artikel bleiben im DOM (content-visibility, kein Windowing) — die Chips
    // hängen sich nur an, sie entfernen nichts. Ein weit unten liegender Artikel und
    // die Gesamtzahl der Artikel-Knoten beweisen die Vollständigkeit.
    await expect(page.locator('#art-529')).toHaveCount(1)
    const artikelZahl = await page.locator('article[id^="art-"]').count()
    expect(artikelZahl).toBeGreaterThan(500)
  })
})
