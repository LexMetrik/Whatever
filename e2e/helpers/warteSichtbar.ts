// e2e/helpers/warteSichtbar.ts — Warten auf ein NOCH NICHT vorhandenes Element,
// ohne dass die Wartung selbst die Seite ausbremst (W2·29-WERKBANK-LESER,
// Flacker-Wurzel `split-erwaegungssprung`, 23.9.2026).
//
// ── DER GEMESSENE DEFEKT ─────────────────────────────────────────────────────
// Playwright 1.60 rendert bei JEDEM Poll eines `expect(locator).toBeVisible()`,
// dessen Element (noch) nicht im DOM steht, einen Aria-Snapshot des GANZEN
// `document.body` — im Seiten-Hauptthread (`InjectedScript._ariaSnapshotForExpect`
// → `_renderAriaSnapshot(this.document.body)`, node_modules/playwright-core/lib/
// coreBundle.js). Der Snapshot dient nur der Fehlermeldung, wird aber auch in
// jedem grünen Poll gerechnet. Steht ein grosser Erlass im DOM (ZGB: 1277
// Artikel), kostet jeder Poll Sekunden — genau die Sekunden, in denen die App
// das Manifest parsen und den Entscheid rendern müsste. Die Wartung verzögert
// also das, worauf sie wartet; je länger es dauert, desto öfter pollt sie.
//
// CPU-Profil des Schritts «⧉ geklickt → `#e-2-3-1` sichtbar» (ZGB im Haupt-
// fenster, 2× CPU-Drossel, lokal unter Parallel-Last, je n=2):
//
//   Wartung                        Klick→Ziel     davon Aria-Snapshot (Profil)
//   expect(…).toBeVisible()        12.0–12.1 s    10.9 s von 13.7 s Profilzeit
//   locator.waitFor('visible')      0.7–0.8 s     0 (kein Aufruf)
//
// Rot im CI (Lauf 35868822283, Shard 4): das Pane stand 20 s auf «Der Entscheid
// wird abgerufen …» — die App kam nicht dazu, den Snapshot zu laden.
//
// ── WAS HIER NICHT PASSIERT ──────────────────────────────────────────────────
// Kein Timeout angehoben, kein Retry, keine Assertion gelockert (§6.3): dieselbe
// Bedingung «sichtbar», dieselbe Schranke, dieselbe Strenge (beide strikt). Nur
// die Abfrage ist eine andere — `waitFor` pollt ohne Snapshot. Danach bestätigt
// ein gewöhnliches `expect` den Zustand; es trifft das Element dann vorhanden an
// und rendert höchstens dessen eigenen Teilbaum (Tiefe 1), nicht den Body.
//
// WANN NEHMEN: für Elemente, die erst NACH einer Aktion auf einer Seite mit
// grossem DOM erscheinen (Erlass im Leser, Split mit Erlass — auch nach einer
// Hauptfenster-Navigation: die Werkbank hält den Erlass-Reiter montiert, das
// DOM bleibt gross; gemessen 53 998 Knoten / 1277 `#art-…` auf
// `/rechtsprechung/bge_151_III_377` nach dem Chip-Klick aus dem ZGB). Für
// Elemente, die schon stehen und nur ihren Zustand ändern, greift der
// Body-Snapshot nicht — dort bleibt ein gewöhnliches `expect` richtig.
import { expect, type Locator } from '@playwright/test'

/** Wartet, bis `ziel` sichtbar ist, und bestätigt es per `expect`.
 *  `timeout` ist die unveränderte Schranke der Aufrufstelle. */
export async function warteSichtbar(ziel: Locator, timeout: number): Promise<void> {
  await ziel.waitFor({ state: 'visible', timeout })
  await expect(ziel).toBeVisible()
}

/** Wartet, bis `ziel` im DOM steht, und prüft dann `toBeInViewport` — beides
 *  zusammen innerhalb DERSELBEN Schranke `timeout` (Frist, nicht Summe: die
 *  Aufrufstelle hatte vorher ein einziges `toBeInViewport({ timeout })`). */
export async function warteImViewport(ziel: Locator, timeout: number): Promise<void> {
  const frist = Date.now() + timeout
  await ziel.waitFor({ state: 'attached', timeout })
  await expect(ziel).toBeInViewport({ timeout: Math.max(1, frist - Date.now()) })
}
