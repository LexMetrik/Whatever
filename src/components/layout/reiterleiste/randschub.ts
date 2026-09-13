// ═══ W2·18 WELLE 3 PUNKT 2 · UMORDNEN ÜBER DIE FENSTERGRENZE HINAUS ═════════
//
// DIE SPEC WOLLTE AUTO-SCROLL — DEN GIBT ES HIER NICHT MEHR. Fahrplan §4.R3
// Punkt 2 verlangte «beim Ziehen an den linken/rechten Rand scrollt der
// Streifen automatisch (~8 px je Frame)». GEMESSEN 13.9.2026 (gebautes dist/,
// Chromium, 15 Reiter, aktiv Nr. 12):
//   @1024  scrollWidth 859  == clientWidth 859,  Fenster 4/8/15
//   @1440  scrollWidth 1275 == clientWidth 1275, Fenster 0/12/15
//   @390   scrollWidth 241  == clientWidth 241,  Fenster 11/1/15
// Der Streifen scrollt NIE: seit R13-2 ist der Überlauf kein Scrollbalken
// mehr, sondern ein FENSTER über die Speicherordnung — was nicht nebeneinander
// passt, steht im «+N»-Blatt (`useReiterFenster`). Ein Auto-Scroll wäre also
// eine Mechanik, die nicht feuern kann (§6.7; §17-Gegengewicht: was nicht
// scheitern kann, wird nicht gebaut).
//
// DIESELBE AUFGABE, DAS ANDERE MITTEL: am Rand schiebt sich der GEZOGENE
// REITER selbst durch die Speicherordnung, einen Platz je Takt. Er wandert
// damit über die Fenstergrenze hinaus, und das Fenster folgt ihm, solange er
// der aktive ist (R13-3: das Fenster bewegt sich, es tauscht nicht). Kein
// Umlauf an den Enden — der Reiter fiele sonst unbemerkt ans andere Ende
// (dieselbe Regel wie bei Alt+⇧+←/→).
//
// Diese Datei ist der RECHNENDE Teil (§3): rein, ohne DOM, ohne React — darum
// in `src/tests/reiter-randschub.test.ts` direkt prüfbar. Die Taktung und das
// Ziehen selbst stehen in `Reiterleiste.tsx`.

/** Breite der Randzone in CSS-px, in der der Schub anspringt. 32 px ist die
 *  Grössenordnung, die Browser und Editoren für ihre Auto-Scroll-Zonen nehmen,
 *  und sie bleibt unter der halben Breite eines schmalen Reiters (GEMESSEN
 *  @320: 130 px) — man kann also am Rand noch gezielt ablegen, ohne den Schub
 *  auszulösen. */
export const RAND_PX = 32;

/** Abstand zweier Schübe. Ein Platz je Viertelsekunde ist schnell genug, um
 *  fünfzehn Reiter in unter vier Sekunden zu durchqueren, und langsam genug,
 *  dass man beim Loslassen sieht, wo man steht. */
export const SCHUB_MS = 250;

/** Auf welcher Seite des Streifens der Zeiger steht — `null` heisst: in der
 *  Mitte, kein Schub.
 *
 *  @param x      Zeiger-X in Viewport-Koordinaten (`DragEvent.clientX`).
 *  @param kasten Streifen-Rechteck (`getBoundingClientRect`).
 *  @param rand   Breite der Randzone; Vorgabe `RAND_PX`.
 */
export function randSeite(
  x: number,
  kasten: { left: number; right: number },
  rand: number = RAND_PX,
): 'links' | 'rechts' | null {
  // Ein Streifen, der schmaler ist als zwei Randzonen, hätte gar keine Mitte:
  // dann teilt die Hälfte. Sonst läge jeder Punkt in BEIDEN Zonen und die
  // Reihenfolge der beiden Abfragen entschiede — ein stiller Zufall.
  const breite = kasten.right - kasten.left;
  const zone = Math.min(rand, breite / 2);
  if (x <= kasten.left + zone) return 'links';
  if (x >= kasten.right - zone) return 'rechts';
  return null;
}

/**
 * Der Nachbar, an dem der gezogene Reiter beim nächsten Takt vorbeizieht.
 *
 * @param ordnung Reiter-Schlüssel in Speicherreihenfolge (`tabSchluessel`).
 * @param von     Schlüssel des gezogenen Reiters.
 * @param links   Schubrichtung.
 * @returns Ziel und Seite für `lib/tabs.ordneTabsUm`, oder `null`, wenn der
 *          Reiter schon am Anschlag steht (dann steht der Takt still).
 */
export function schubZiel(
  ordnung: readonly string[],
  von: string,
  links: boolean,
): { ziel: string; davor: boolean } | null {
  const i = ordnung.indexOf(von);
  if (i === -1) return null;
  const j = links ? i - 1 : i + 1;
  if (j < 0 || j >= ordnung.length) return null;
  return { ziel: ordnung[j], davor: links };
}
