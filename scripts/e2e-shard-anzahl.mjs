// ─── Eine Quelle für die Shard-Anzahl (§5) ──────────────────────────────────
// BISHER stand die Zahl an DREI Stellen: der Job-Matrix in
// `.github/workflows/ci.yml` und je einer Konstante `GRUPPEN_MAX` in
// `e2e-shard-gruppen-generieren.mjs` und `e2e-shard-gruppen.mjs`; die
// Kommentare dort verlangten ausdrücklich, bei einer Änderung «DREI Stellen
// anzufassen». Genau diese Klasse (n Kopien einer Zahl, per Prosa
// synchronisiert) hat in ci.yml schon einmal getroffen (K12, Required-
// Kontextnamen über drei Systeme, PRs #318/#320 dauerhaft unmergbar).
//
// JETZT: die Job-Matrix in ci.yml ist die EINZIGE Stelle, an der die Zahl
// tatsächlich etwas steuert (sie erzeugt die CI-Jobs) — und damit die Quelle.
// Beide Skripte lesen sie hier heraus, keines hält eine eigene Kopie mehr.
// Anlass: M3 (8 → 4 Shards), QS-CI-MINUTEN, 8.9.2026.
//
// FEHLERSEITE (§6.7): Ist die Matrix-Zeile nicht lesbar oder keine
// lückenlose 1..N-Folge, wirft diese Funktion — beide Aufrufer (Generator
// und Union-Wächter) enden dann ROT. Kein Rückfall auf eine geratene Zahl:
// eine falsche Gruppen-Obergrenze liesse Specs still aus dem CI fallen.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Annotations-Wert und JSON-Schlüssel für Specs, die nicht in den Queue-Shards,
// sondern im Nachtlauf gegen main fahren (Entscheid David 5.10.2026, QS-CI-ZEIT
// N2). Steht hier, weil Generator UND Union-Wächter ihn brauchen (§5).
export const NACHT = 'nacht'

const HIER = dirname(fileURLToPath(import.meta.url))
const CI_YML = join(HIER, '..', '.github', 'workflows', 'ci.yml')

/** Anzahl der Shard-Gruppen, gelesen aus der Job-Matrix in ci.yml. */
export function gruppenAnzahl() {
  const inhalt = readFileSync(CI_YML, 'utf8')
  const m = inhalt.match(/^\s*gruppe:\s*\[([0-9,\s]+)\]\s*$/m)
  if (!m) {
    throw new Error(
      `Shard-Matrix nicht gefunden: in ${CI_YML} fehlt eine Zeile "gruppe: [1, 2, …]" (strategy.matrix des e2e-Jobs).`,
    )
  }
  const werte = m[1]
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
  const zahlen = werte.map(Number)
  const erwartet = zahlen.map((_, i) => i + 1)
  if (zahlen.length === 0 || zahlen.some((n, i) => n !== erwartet[i])) {
    throw new Error(
      `Shard-Matrix in ci.yml ist keine lückenlose Folge 1..N: [${werte.join(', ')}].`,
    )
  }
  return zahlen.length
}
