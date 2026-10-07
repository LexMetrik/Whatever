// e2e/helpers/warteAufSuchindex.ts — auf den Ladezustand der Suche warten, nicht
// auf die Uhr (Fixer 1e/1h, §17-Wurzelfix zum offenen Punkt «Aus Fixer 1e»).
// (Nachtrag 7.10.2026, A1-FUNDAMENT: es gibt keinen Browser-Suchindex mehr; «fertig»
// heisst jetzt: Manifeste geladen UND die Serverantwort von /api/suche da — oder als
// Ausfall gemeldet. Der Name bleibt, die Mechanik ist dieselbe.)
//
// ── DER DEFEKT ────────────────────────────────────────────────────────────
// `useUniversalSuche.ts` lädt den Such-Index ERST beim ersten nicht-leeren
// Query (Preset-Index, Gesetzes-/Entscheid-Manifest, ~10 MB gzip Artikel-
// Volltext, s. Kommentar dort). `e2e/suche-seite.e2e.ts` und
// `e2e/w224-plus-reiter.e2e.ts` verliessen sich darauf, dass er innerhalb des
// Playwright-Standard-Timeouts lädt (`playwright.config.ts`: `expect: {
// timeout: 10_000 }`) — eine feste UHR statt eines Index-Zustands. Auf einer
// kalten/gedrosselten Maschine reicht das nicht (dieselbe Fehlerklasse wie
// `leserBereit.ts` oben im selben Ordner).
//
// ── DAS SIGNAL (existiert bereits — kein neuer Code-Pfad nötig) ────────────
// `SuchResultate.tsx` rendert für JEDE Suche eine barrierefreie Live-Region
// (`role="status"`, `aria-live="polite"`), deren Text WÄHREND des Ladens
// «wird [noch] durchsucht …» lautet (`!allesGeladen || gruppen.some(g =>
// g.laedt)`) und danach entweder die fertige Trefferzahl oder «Keine Treffer»
// trägt. Derselbe Baustein bedient sowohl das Kopf-Dropdown (`HeaderSuche.tsx`)
// als AUCH die /suche-Vollseite (`Suche.tsx`) — EIN Helfer für beide Flächen,
// kein zweiter Weg (§5). `useUniversalSuche.ts`/`HeaderSuche.tsx` brauchen
// darum KEIN zusätzliches `data-suchindex`-Attribut: das Signal ist schon da,
// nur ungenutzt.
import { expect, type Page } from '@playwright/test'

/**
 * Wartet, bis die Live-Region der Suche NICHT mehr «wird [noch] durchsucht …»
 * meldet — also bis der lazy Index (oder zumindest die aktuelle Query-Runde)
 * fertig geladen ist. Grosszügigeres Zeitbudget als der Playwright-Default
 * (kalte/gedrosselte Maschine, ~10 MB gzip Artikel-Index), WEIL es hier genau
 * die Wartezeit ist, die vorher unter der Decke verschwand statt im Test zu
 * stehen.
 */
export async function warteAufSuchindex(page: Page, timeout = 20_000) {
  const status = page.getByRole('status').filter({ hasText: /Treffer|durchsucht/ })
  await expect(status.first(), 'Such-Index (role="status" in SuchResultate.tsx) meldet fertig geladen')
    .not.toHaveText(/wird (noch )?durchsucht/, { timeout })
}
