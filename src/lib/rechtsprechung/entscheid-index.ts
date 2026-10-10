// ─── Entscheid-Index: die schlanke Verzeichnis-Projektion des Registers ───────
//
// E0-REGISTER Teil 2 (10.10.2026, Entscheid David «Variante 1 + 3»). Jede
// Urteilsseite und jede Seite mit Urteils-Reiter lud bisher das ganze Register
// (`register.json`, 6815 Einträge) — obwohl Leser, Seitenkopf, Reiter und
// Verzahnung daraus nur zehn Felder brauchen (§15 Geräte-Last). Darum eine
// zweite, EINZIGE kleine Projektion derselben Quelle (§5):
//
//   public/rechtsprechung/entscheid-index.json   { erzeugt, entscheide: [ Pick<…> ] }
//
// Bewusst NICHT «register.json» im Namen: Browser-Tests und Betriebs-Smoke prüfen
// per Teilzeichenfolge, welche Seite das ganze Register anfragt.
//
// Alle Einträge, in Register-Reihenfolge: die Verzahnung löst über `bgeReferenz`/
// `nummer` auf, und bei `nummer` gibt es Dubletten — «erster Treffer gewinnt»
// hängt an der Reihenfolge. Auch die `__voll`-Verweis-Einträge sind drin: der
// Direktaufruf eines Verweis-Keys leitet über `verweis` auf das Ziel-BGE weiter.
//
// Die Funktion ist rein und deterministisch (§2). Sie wird vom Generator
// (scripts/normtext/entscheide-schreiben.ts), vom Prüftor (check-entscheide.ts)
// und im Browser genutzt, wenn nötig — dieselbe Funktion, keine zweite Liste.
// Reine Datenschicht (§3).

import type { BrowseEntscheid, EntscheidManifest } from './register';

/** Die zehn Felder, die Leser, Seitenkopf, Reiter und Verzahnung aus dem Register lesen. */
export const ENTSCHEID_INDEX_FELDER = [
  'key', 'zitierung', 'datum', 'datumUnbekannt', 'datei', 'verweis', 'richter', 'bgeReferenz', 'nummer', 'leitcharakter',
] as const satisfies readonly (keyof BrowseEntscheid)[];

/** Ein Index-Eintrag: genau diese Felder des Registers, sonst nichts. */
export type EntscheidIndexEintrag = Pick<BrowseEntscheid, (typeof ENTSCHEID_INDEX_FELDER)[number]>;

/** `public/rechtsprechung/entscheid-index.json`. */
export interface EntscheidIndex {
  /** Wie `register.json` (selbe Erzeugung). */
  erzeugt: string;
  entscheide: EntscheidIndexEintrag[];
}

const FELD_MENGE: ReadonlySet<string> = new Set(ENTSCHEID_INDEX_FELDER);

/**
 * Register → Index. Reihenfolge der Einträge UND der Felder bleibt wie im
 * Register; ein Feld erscheint nur, wenn der Register-Eintrag es trägt
 * (`datumUnbekannt`, `verweis`, `richter` sind optional — nie ein erfundenes
 * Leerfeld, §8). Verändert die Eingabe nicht.
 */
export function projiziereEntscheidIndex(register: EntscheidManifest): EntscheidIndex {
  return {
    erzeugt: register.erzeugt,
    entscheide: register.entscheide.map(
      (e) => Object.fromEntries(Object.entries(e).filter(([feld]) => FELD_MENGE.has(feld))) as unknown as EntscheidIndexEintrag,
    ),
  };
}
