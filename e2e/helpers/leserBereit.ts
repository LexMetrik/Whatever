// e2e/helpers/leserBereit.ts — die EINE Bereitschafts-Wartung des Lesers
// (§5, QS-E2E-STABIL, §17-Wurzelfix zu Ä24).
//
// ── WOFÜR ─────────────────────────────────────────────────────────────────────
// Neun Leser-Specs warten vor ihrer eigentlichen Aussage darauf, dass die
// CLIENT-Hülle übernommen hat. Der Beweis dafür ist gut gewählt: der
// «Ansicht»-Öffner steht NICHT im Prerender-HTML (nachgemessen 17.8.2026:
// `dist/gesetze/bund/OR.html` enthält NULL `<button>`), er existiert also erst,
// wenn React gerendert hat. Nur die ABFRAGE war teuer.
//
// ── DER GEMESSENE DEFEKT (Wurzel von Ä24, Kap. 14) ────────────────────────────
// Bis 17.8.2026 lautete die Wartung überall
//   `expect(page.getByRole('button', { name: 'Ansicht' }).first()).toBeVisible({ timeout: 20000 })`
// `getByRole` mit Namensfilter rechnet für JEDEN Knopf im Dokument den
// zugänglichen Namen aus. Auf dem OR sind das **13 518 Knöpfe** bei 75 724
// DOM-Knoten (gemessen @1280 nach dem Laden) — und die Abfrage läuft im Polling,
// also wiederholt.
//
// A/B auf demselben Dokument (`/gesetze/bund/OR#art-319`), je frischer
// Browser-Kontext, gleiche Wartebedingung «sichtbar», nur die Suchmaschine
// getauscht:
//
//   Bedingung                     Rolle+Name        Attribut        über 20 s
//   warm, ungedrosselt (n=10)     4.1–4.4 s         1.0–1.0 s       0 / 0
//   4× CPU-Drossel (n=5)          28.2–29.0 s       17.9–19.9 s     5/5 / 0/5
//
// Die 4×-Drossel ist die CI-nahe Bedingung aus der Ä24-Forensik (2-Kern-Runner,
// `workers: 1`). Unter ihr reisst ALLEIN DIE ABFRAGE das 20-s-Budget: die Seite
// ist nach ~18 s bedienbar, die Namensberechnung kostet weitere ~10 s. Genau so
// fiel Shard 7 — «element(s) not found» im Vorraum, ohne dass die Sachaussage je
// geprüft wurde (Ä24: «Das Tor misst nicht mehr seine Sachaussage, sondern die
// Tagesform des Runners»).
//
// ── WAS HIER NICHT PASSIERT ───────────────────────────────────────────────────
// Kein Timeout angehoben, keine Retry-Zahl erhöht, keine Assertion gelockert
// (§6.3): dieselbe Sachaussage, dieselbe Schranke, billigere Abfrage. Die
// Abdeckung des ZUGÄNGLICHEN NAMENS geht nicht verloren — sie ist dort geprüft,
// wo sie hingehört: `leser-kopf-a9.e2e.ts` und `leser-kopf-g2b.e2e.ts` fassen den
// Öffner weiter über Rolle+Name.
//
// ── EHRLICHER REST ────────────────────────────────────────────────────────────
// Nach dem Tausch bleiben bei 4× Drossel 17.9–19.9 s gegen ein 20-s-Budget: der
// dominante Term ist weg, der Rest ist der Erst-Render des OR selbst und liegt
// bei QS-PERF (Ä24-Übergabe). Wer hier eine Zahl senken will, senkt sie dort.
import { expect, type Page } from '@playwright/test'

/** Der Öffner des Ansicht-Menüs (`v3/LeserAnsichtV3.tsx`) — reine
 *  Attribut-Abfrage (O(1) im Selektor-Engine), existiert nur im Client-Render.
 *  Bis H5 (21.8.2026) stand hier zusätzlich `[data-ansicht-menu]` der
 *  Ist-Hülle (`LeserAnsichtMenu.tsx`); mit deren Löschung entfällt die
 *  zweite Hälfte. */
export const ANSICHT_OEFFNER = '[data-v3-ansicht]'

/** Wartet, bis die Client-Hülle des Lesers übernommen hat. Budget unverändert
 *  20 s — das ist die Schranke, gegen die die Specs seit je laufen. */
export async function warteLeserBereit(page: Page, timeout = 20000): Promise<void> {
  await expect(page.locator(ANSICHT_OEFFNER).first()).toBeVisible({ timeout })
}
