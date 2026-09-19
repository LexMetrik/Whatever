// ═══ W2·5m-LESER-V3 · Die Schreiber der Klapp-Karte `tocBaum` ═══════════════
//
// Befund David 19.9.2026: «die gliederung ist noch scheisse … ausserdem klappt
// oft unterste ebene nicht auf» + «auch das aufklappen soll optimiert werden».
//
// Die Klapp-Karte hatte sechs Schreiber, jeder als eigenes Inline-`setTocBaum`
// (Sektions-Sprung, Artikel-Sprung, Tieflink, Sheet-Öffnen, «alles auf/zu»,
// Scroll-Spy) — und nur der Chevron (`klappZeile`) kannte den zweiten Schlüssel
// der Artikel-Ebene. Hier stehen die ausdrücklichen Öffner als reine
// Funktionen, damit der Wächter (`src/tests/gliederung-sichtbarkeit.test.ts`)
// genau das prüft, was die Oberfläche schreibt (§3, §6.7). Der Scroll-Spy
// bleibt bewusst draussen: er schreibt nur Sektions-Ids (CLS-Regel 13.8.2026,
// `artikelSchluessel` in ./tocAutoZuklappen).

import type { GliederungsKnoten } from './gliederungsModell';
import { artikelSchluessel } from './tocAutoZuklappen';

/**
 * Ein SPRUNG öffnet den Ast: alle Ids des Pfads (Wurzel → Ziel) und die
 * Ziel-Zeile selbst (`zielIds`) GANZ — samt ihrer Artikel-Ebene. Beim
 * Artikel-Sprung und Tieflink ist die Ziel-Zeile die Sektion, die den Artikel
 * direkt trägt (letzte Pfad-Id): so steht die Artikel-Zeile im Bild, und die
 * Marke sitzt auf dem Artikel statt auf dem Kapitel (`findeMarke`). Ein
 * Sprung ist Nutzer-Eingabe; sein Layout-Sprung zählt nicht als CLS (§15.2).
 */
export function oeffneSprungZiel(
  offen: Record<string, boolean>, pfad: readonly string[], zielIds: readonly string[],
): Record<string, boolean> {
  const n = { ...offen };
  for (const id of pfad) n[id] = true;
  for (const id of zielIds) { n[id] = true; n[artikelSchluessel(id)] = true; }
  return n;
}

/** Ist der Sprung-Ast schon vollständig offen? (Tieflink: kein leerer Re-Render.) */
export function sprungZielOffen(
  offen: Record<string, boolean>, pfad: readonly string[], zielIds: readonly string[],
): boolean {
  const soll = oeffneSprungZiel({}, pfad, zielIds);
  return Object.keys(soll).every((id) => offen[id] === true);
}

/**
 * Die Ids, über die «alles auf/zu» läuft: je Zeile MIT Kindern ALLE ihre Ids.
 * Bis 19.9.2026 nur `k.id` (die äusserste einer verdichteten Kette) — hatte
 * der Spy die inneren Ids offen geschrieben, blieb die Zeile nach «alles zu»
 * offen (`zeileIstOffen` ist `.some`; Wächter: 15 Zeilen, u. a. KOV, SVG).
 */
export function alleKlappIds(knoten: readonly GliederungsKnoten[]): string[] {
  const ids: string[] = [];
  const geh = (ks: readonly GliederungsKnoten[]) => {
    for (const k of ks) { if (k.kinder.length > 0) { ids.push(...k.ids); geh(k.kinder); } }
  };
  geh(knoten);
  return ids;
}

/**
 * «alles auf» / «alles zu» über alle Zeilen mit Kindern — «alles» heisst bis
 * zur Artikel-Ebene (Knopf-Titel «Alle Gliederungsstufen aufklappen»; ein
 * «alles auf», nach dem jede unterste Zeile noch einmal geklickt werden
 * muss, sagte etwas anderes als es tat, §8). §15: korpusweit kostet das wenig
 * — OR 2'181 → 2'296 Zeilen, ZGB 1'637 → 1'708 (die grössten Bäume sind
 * schon artikel-granular); StPO 156 → 636 ist der grösste relative Zuwachs.
 */
export function setzeAlle(
  offen: Record<string, boolean>, zeilenIds: readonly string[], ziel: boolean,
): Record<string, boolean> {
  const n = { ...offen };
  for (const id of zeilenIds) { n[id] = ziel; n[artikelSchluessel(id)] = ziel; }
  return n;
}

/** Steht alles offen — samt Artikel-Ebene? (Beschriftung des Knopfs «alles auf/zu».) */
export function alleOffen(offen: Record<string, boolean>, zeilenIds: readonly string[]): boolean {
  return zeilenIds.length > 0
    && zeilenIds.every((id) => offen[id] === true && offen[artikelSchluessel(id)] === true);
}
