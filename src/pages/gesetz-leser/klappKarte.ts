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

/**
 * Ein SPRUNG öffnet den Ast: alle Ids des Pfads (Wurzel → Ziel) und die
 * Ziel-Zeile selbst (`zielIds`).
 */
export function oeffneSprungZiel(
  offen: Record<string, boolean>, pfad: readonly string[], zielIds: readonly string[],
): Record<string, boolean> {
  const n = { ...offen };
  for (const id of pfad) n[id] = true;
  for (const id of zielIds) n[id] = true;
  return n;
}

/** Ist der Sprung-Ast schon vollständig offen? (Tieflink: kein leerer Re-Render.) */
export function sprungZielOffen(
  offen: Record<string, boolean>, pfad: readonly string[], zielIds: readonly string[],
): boolean {
  const soll = oeffneSprungZiel({}, pfad, zielIds);
  return Object.keys(soll).every((id) => offen[id] === true);
}

/** «alles auf» / «alles zu» über alle Zeilen mit Kindern. */
export function setzeAlle(
  offen: Record<string, boolean>, zeilenIds: readonly string[], ziel: boolean,
): Record<string, boolean> {
  return { ...offen, ...Object.fromEntries(zeilenIds.map((id) => [id, ziel])) };
}

/** Steht alles offen? (Beschriftung des Knopfs «alles auf/zu».) */
export function alleOffen(offen: Record<string, boolean>, zeilenIds: readonly string[]): boolean {
  return zeilenIds.length > 0 && zeilenIds.every((id) => offen[id] === true);
}
