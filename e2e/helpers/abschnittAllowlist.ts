// e2e/helpers/abschnittAllowlist.ts — Allowlist-Mechanik für R8 «Nichts
// abgeschnitten» (e2e/kein-abschnitt.e2e.ts). Getrennt von der Messung (§5):
// wer die Ausnahmeliste ändert, muss keine Geometrie-Logik lesen.
//
// Jeder Eintrag braucht Begründung + Datum (Auftrag). Match ist EXAKT auf
// route+viewport+modus+kategorie+selektor — eine Ausnahme gilt nie „ungefähr”,
// sonst verdeckt sie beim nächsten Fund an derselben Stelle eine andere Fehlart.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RohFund } from './abschnittMessung'

const HIER = dirname(fileURLToPath(import.meta.url))
const ALLOW_PFAD = join(HIER, '..', 'kein-abschnitt.allow.json')

interface AllowlistEintrag {
  route: string
  viewport: string
  modus: string
  kategorie: string
  selektor: string
  begruendung: string
  datum: string
}

export interface Fund extends RohFund {
  route: string
  viewport: string
  modus: string
}

function schluessel(f: { route: string; viewport: string; modus: string; kategorie: string; selektor: string }): string {
  return [f.route, f.viewport, f.modus, f.kategorie, f.selektor].join('␟')
}

let geladen: AllowlistEintrag[] | null = null

function allowlistLesen(): AllowlistEintrag[] {
  if (geladen) return geladen
  const roh = JSON.parse(readFileSync(ALLOW_PFAD, 'utf8'))
  if (!Array.isArray(roh.eintraege)) throw new Error('kein-abschnitt.allow.json: Feld "eintraege" fehlt oder ist kein Array')
  for (const e of roh.eintraege) {
    for (const feld of ['route', 'viewport', 'modus', 'kategorie', 'selektor', 'begruendung', 'datum']) {
      if (typeof e[feld] !== 'string' || !e[feld]) throw new Error(`kein-abschnitt.allow.json: Eintrag ohne "${feld}": ${JSON.stringify(e)}`)
    }
  }
  geladen = roh.eintraege as AllowlistEintrag[]
  return geladen
}

/** Trennt Funde in erlaubt (Allowlist-Treffer) und nicht erlaubt (gatend). */
export function nachAllowlistTrennen(funde: Fund[]): { erlaubt: Fund[]; nichtErlaubt: Fund[] } {
  const erlaubteSchluessel = new Set(allowlistLesen().map(schluessel))
  const erlaubt: Fund[] = []
  const nichtErlaubt: Fund[] = []
  for (const f of funde) {
    if (erlaubteSchluessel.has(schluessel(f))) erlaubt.push(f)
    else nichtErlaubt.push(f)
  }
  return { erlaubt, nichtErlaubt }
}
