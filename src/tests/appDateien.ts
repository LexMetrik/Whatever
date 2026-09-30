// ─── Die EINE Datei-Quelle der Quelltext-Wächter (R3-α, 31.8.2026) ──────────
//
// DER BEFUND (Design-Konsistenz Runde 3, Finder-Bericht B3): vier Wächter der
// Design-Konsistenz bewachten ihre Regel nicht app-weit, sondern gegen eine von
// Hand gepflegte DATEI-LISTE (`migriert`, `KONSUMENTEN`, `R2E_FLAECHEN`,
// `DATEIEN`). Eine solche Liste ist ein Vakuum-Tor (§6.7): sie kann die
// Rückfälle nur dort sehen, wo schon jemand hingeschaut hat. Gemessen am
// 31.8.2026 standen ausserhalb der Listen sechs unmigrierte Leerzustände, ein
// «(optional)» im Label und zwei rohe `type="date"` — alle vier Wächter grün.
//
// DIE WURZEL-BEHEBUNG (§17): die Wächter fegen die App, nicht ihre Liste. Wo
// eine Fläche ausgenommen bleibt, steht die Begründung AM FUNDORT und wird vom
// Test wörtlich zitiert (nicht bloss der Pfad) — eine Ausnahme, die man nur im
// Test sieht, ist eine unsichtbare Ausnahme.
//
// §5: die Verzeichnis-Wanderung liegt genau einmal hier statt viermal kopiert.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** `src/` — von diesem Verzeichnis aus fegen alle Sonden. */
export const APP_WURZEL = join(__dirname, '..');

/**
 * Alle App-Dateien mit den angegebenen Endungen.
 *
 * Ausgenommen sind `tests/` und `fixtures/`: dort stehen die Sonden selbst und
 * ihre Negativ-Kontrollen — die ZITIEREN die verbotenen Formen legitim, und ein
 * Wächter, der seine eigene Negativ-Kontrolle als Verstoss liest, zwänge zum
 * Löschen genau der Belege, die ihn beweisbar machen (§2b/§6.7).
 */
export function appDateien(endungen: readonly string[] = ['.tsx'], dir = APP_WURZEL, treffer: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'tests' || name === 'fixtures') continue;
      appDateien(endungen, p, treffer);
    } else if (endungen.some((e) => name.endsWith(e))) {
      treffer.push(p);
    }
  }
  return treffer;
}

/** Alle `.tsx` der App (Darstellungsschicht) — der Normalfall der Sonden. */
export const alleTsx = (): string[] => appDateien(['.tsx']);

/** Alle `.ts`/`.tsx` der App — wo eine Regel auch Hooks/Helfer trifft. */
export const alleQuellen = (): string[] => appDateien(['.ts', '.tsx']);

/** Pfad relativ zu `src/` — die Form, in der Fehlermeldungen lesbar sind. */
export const rel = (abs: string): string => abs.slice(APP_WURZEL.length + 1);

/**
 * Quelltext OHNE Kommentare.
 *
 * Warum das sein muss (dieselbe Herleitung wie in `leerzustand-d7` und
 * `design-konsistenz-chips-marken`): jede behobene Stelle trägt einen
 * Kommentar, der die ALTE Bauform beim Namen nennt. Läse die Sonde den Rohtext,
 * wäre sie für immer rot — und die naheliegende «Reparatur» wäre, die Belege zu
 * löschen (§2b: Belege altern nicht).
 *
 * REIHENFOLGE (W2·19 DK-A, 30.9.2026): ZEILEN-Kommentare zuerst, dann Blöcke.
 * Umgekehrt las ein Zeilenkommentar, der einen Glob wie `src/lib/normtext/**`
 * nennt, das `/**` als Blockanfang und verschluckte den Code bis zum nächsten Blockende
 * (gemessen: `PanelAenderungen.tsx` −2641, `EreignisFristen.tsx` −2269,
 * `ArtikelBody.tsx` −1271, `Begruessung.tsx` −280 Zeichen — jede Sonde sah dort
 * einen Teil der Datei nicht).
 */
export const ohneKommentare = (s: string): string =>
  s.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

/** Datei-Inhalt ohne Kommentare. */
export const liesOhneKommentare = (pfad: string): string => ohneKommentare(readFileSync(pfad, 'utf8'));

/** Roh-Inhalt inkl. Kommentare — für Ausnahmen, deren Begründung zitiert wird. */
export const liesRoh = (pfad: string): string => readFileSync(pfad, 'utf8');

/**
 * Eine dokumentierte Ausnahme.
 *
 * `datei` — Pfad relativ zu `src/`.
 * `begruendung` — WÖRTLICHES Zitat aus dem Kommentar am Fundort. Der Test
 *   prüft, dass der Satz dort wirklich steht: verschwindet die Begründung,
 *   fällt die Ausnahme, nicht bloss der Kommentar.
 */
export type Ausnahme = { datei: string; begruendung: string };

/**
 * Prüft, dass jede Ausnahme ihre Begründung am Fundort trägt, und gibt die
 * Pfade zurück, die der Sweep überspringen darf.
 *
 * Der Aufrufer ruft das VOR dem Sweep auf — so ist eine Ausnahme ohne
 * Fundort-Beleg ein Fehlschlag und nicht ein stiller Freibrief.
 */
export function pruefeAusnahmen(ausnahmen: readonly Ausnahme[]): Set<string> {
  const fehlend: string[] = [];
  for (const a of ausnahmen) {
    if (!liesRoh(join(APP_WURZEL, a.datei)).includes(a.begruendung)) fehlend.push(`${a.datei}: «${a.begruendung}»`);
  }
  if (fehlend.length) {
    throw new Error(
      'Ausnahme ohne Begründung am Fundort (die Ausnahmeliste zitiert einen Satz, '
      + `der dort nicht mehr steht):\n  ${fehlend.join('\n  ')}`,
    );
  }
  return new Set(ausnahmen.map((a) => a.datei));
}
