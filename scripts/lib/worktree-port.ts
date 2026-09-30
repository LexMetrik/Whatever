// Port aus dem Arbeitsverzeichnis (§17-Wurzelfix, Vorfall 4.8.2026 e2e; ZWEITER
// Vorfall 30.9.2026: zwei parallele Bau-Agenten fanden den Mess-Port 4391 belegt,
// einer beendete den fremden Server und mass zuerst fremden Code). Die Prosa-Regel
// («vor dem Messlauf lsof») trug nicht — sie verlangt, an die Falle zu denken.
// Darum: derselbe Pfad ⇒ derselbe Port (§2), verschiedene Worktrees ⇒ i. d. R.
// verschiedene Ports. Zwei getrennte Fenster, damit der e2e-Server und der
// manuelle Messserver DESSELBEN Worktrees nie kollidieren. Genutzt von
// playwright.config.ts (e2e) und vite.config.ts (`vite preview` ohne `--port`).
import { createHash } from 'node:crypto'

export interface PortFenster {
  readonly basis: number
  readonly spanne: number
}

/** e2e-Server (playwright.config.ts): hält Abstand zu 4317 (CI) und 4319 (messung-cwv). */
export const E2E_FENSTER: PortFenster = { basis: 4400, spanne: 400 }
/** Manueller Messserver (`vite preview` ohne `--port`): 4800–4999. */
export const MESS_FENSTER: PortFenster = { basis: 4800, spanne: 200 }

export function portAusPfad(pfad: string, fenster: PortFenster): number {
  const summe = createHash('sha256').update(pfad).digest().readUInt32BE(0)
  return fenster.basis + (summe % fenster.spanne)
}
