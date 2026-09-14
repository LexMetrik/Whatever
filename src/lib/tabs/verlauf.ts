import { pfadTeil } from '../verlaufLabel';
import type { TabEintrag } from './typen';
import { tabSchluessel } from './typen';

// ─── M3 (Prüfbefund R11 #37, 6.9.2026) · «ZULETZT GESCHLOSSEN» ──────────────
//
// GEMESSENER ANLASS: Alt+Shift+T liess die Reiterliste unverändert, und
// `localStorage` führte keinen Schliess-Ring (G4/G4c). Im Browser ist das
// Wiederherstellen die Rückfahrkarte für jedes versehentliche ✕ — hier ist es
// MEHR als das: seit §5a Ziff. 3 ERSETZT schon eine gewöhnliche Navigation den
// aktiven Reiter (`ersetzeTab`), der Verlust ist also Alltag und nicht Unfall.
// Rechner-Eingaben liegen vollständig in der Adresse (`?e=…&k=ZH`), gehen mit
// dem Reiter also mit — genau darum ist die Wiederherstellung der richtige
// Ersatz für eine Schliess-Warnung und nicht deren Ergänzung.
//
// BERUFSGEHEIMNIS · DIESELBE GRENZE WIE `lexmetrik-tabs`, NICHT WEITER: der
// Ring speichert AUSSCHLIESSLICH `TabEintrag`-Objekte, also Pfad + Label +
// gewählter Anker — dieselben Felder, dieselbe Herkunft, dieselbe Lebensdauer
// wie die offene Reiterliste selbst. Eine Rechner-Adresse trägt Falldaten
// (`?e=2025-01-15&k=ZH`); sie tut das schon heute in `lexmetrik-tabs`, und der
// Ring verlängert genau diese eine Grenze um höchstens ZU_MAX Einträge. NIE
// aufgenommen werden Formularinhalte, und nie ein Zeitstempel (§2: kein
// Date.now() in src/lib) — die Reihenfolge im Array IST die Reihenfolge.
const ZU_KEY = 'lexmetrik-tabs-zu';
// ── W2·18 Punkt 4 · DIE RÜCKFAHRKARTE MUSS EINE GANZE LEISTE TRAGEN ────────
// Hier stand 10. `leereTabs` («Alle schliessen») legt ALLE offenen Reiter in
// den Ring — mit 10 als Kappe war die Geste ab dem elften Reiter nur noch zu
// zehn Zehnteln umkehrbar, und was darüber lag, fiel still weg. Die Kappe ist
// darum die der Reiterliste selbst: mehr als `MAX` Reiter kann niemand
// schliessen, also trägt ein Ring dieser Grösse jede Schliess-Geste
// vollständig. An der BERUFSGEHEIMNIS-Grenze ändert das nichts Qualitatives
// (oben): dieselben Felder, dieselbe Herkunft, dieselbe Lebensdauer, und nie
// mehr Einträge, als die Reiterliste daneben ohnehin führen darf.
const ZU_MAX = 50;

/** Ein geschlossener Reiter mit der Position, an der er stand. Die Position ist
 *  der ganze Unterschied zu einem Verlauf: wiederhergestellt wird DORT, wo der
 *  Reiter war, nicht am Ende der Leiste. */
export interface GeschlossenerReiter { eintrag: TabEintrag; index: number }

export function ladeGeschlossene(): GeschlossenerReiter[] {
  try {
    const roh = localStorage.getItem(ZU_KEY);
    const arr = roh ? JSON.parse(roh) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is GeschlossenerReiter =>
        x && typeof x.index === 'number' && x.eintrag && typeof x.eintrag.path === 'string')
      .slice(-ZU_MAX);
  } catch {
    return [];
  }
}

export function schreibeGeschlossene(ring: GeschlossenerReiter[]): void {
  try { localStorage.setItem(ZU_KEY, JSON.stringify(ring.slice(-ZU_MAX))); }
  catch { /* privater Modus — die Rückfahrkarte ist Komfort, kein Datenbestand */ }
}

/** Legt geschlossene/ersetzte Reiter hinten in den Ring (jüngster zuletzt).
 *  Die SAMMLUNG kommt NICHT hinein: sie trägt kein Dokument, ihre
 *  «Wiederherstellung» wäre ein Klick auf «+» (§8 — nichts versprechen, was
 *  keinen Wert hat). Bis R14 stand hier dieselbe Regel für den leeren
 *  «+»-Reiter (`!eintrag.leer`); seit die Sammlung selbst der Reiter ist, ist
 *  ihr PFAD das Merkmal — der Sonderfall im Datenmodell entfällt. */
export function merkeGeschlossen(neue: GeschlossenerReiter[]): void {
  const echte = neue.filter(({ eintrag }) => pfadTeil(eintrag.path) !== '/');
  if (echte.length === 0) return;
  // ── W2·18 WELLE 2 PUNKT 4 · EINE GANZE LEISTE LIEGT VERKEHRT HERUM AB ────
  //
  // GEMESSEN 13.9.2026: «Alle schliessen» mit [a, b, c] und dreimal
  // Wiederherstellen ergab [a, c, b]; mit zehn Reitern [r0, r9, r1, r8, r2,
  // r7, r3, r6, r4, r5] — die Leiste kam zurück, aber verschachtelt. Dasselbe
  // bei «Rechts davon schliessen» ([a, b, d, c] statt [a, b, c, d]).
  //
  // URSACHE: der Ring ist ein STAPEL — `stelleLetztenWiederHer` nimmt hinten.
  // Wer eine ganze Leiste in Ur-Reihenfolge hineinlegt, bekommt sie also von
  // HINTEN zurück: der hinterste Reiter kommt zuerst, findet eine leere Liste
  // vor, landet mangels Nachbarn vorn (`Math.min(index, length)`) — und jeder
  // weitere schiebt sich davor.
  //
  // DIE ANTWORT steht hier und nur hier (§5): eine Geste legt ihre Reiter
  // ABSTEIGEND nach Position ab, damit der Stapel sie AUFSTEIGEND zurückgibt.
  // Dann trifft jeder wiederhergestellte Reiter auf eine Liste, die vor ihm
  // schon alles Vordere trägt, und `splice(index)` landet auf den Punkt.
  // Gilt für alle vier Aufrufer mit mehr als einem Eintrag (`leereTabs`,
  // `schliesseAndere`, `schliesseRechtsVon`, `kappeMitRing`); die
  // Einzelschliessung merkt davon nichts, und die REIHENFOLGE ZWISCHEN zwei
  // Gesten bleibt unberührt (jüngere Geste zuerst zurück).
  const geordnet = [...echte].sort((a, b) => b.index - a.index);
  schreibeGeschlossene([...ladeGeschlossene(), ...geordnet]);
}

/** Der zuletzt geschlossene Reiter — für die Beschriftung der Aktion
 *  («Zuletzt geschlossen: Art. 336c OR»). null = der Ring ist leer, dann wird
 *  die Aktion gar nicht erst angeboten (kein toter Menüeintrag). */
export function letzterGeschlossener(): TabEintrag | null {
  const ring = ladeGeschlossene();
  return ring.length ? ring[ring.length - 1].eintrag : null;
}

// ═══ W2·18 WELLE 2 PUNKT 2 · ZULETZT BENUTZT (MRU) ══════════════════════════
//
// GEMESSENER ANLASS (13.9.2026, Stand `f0ed8859c`): die Leiste kannte nur die
// POSITION — Alt+1…9 und Alt+Bild↑/↓. Wer zwischen zwei Reitern hin- und
// herarbeitet (der Alltag beim Abgleich zweier Erlasse), musste ihre Stellen
// kennen und zählen, und ab Reiter 10 gab es überhaupt kein Kürzel mehr
// (Alt+9 ist der LETZTE, R13-8). Chrome («Ctrl+Tab in MRU») und VS Code
// («Ctrl+Tab») lösen genau das über die zuletzt-benutzt-Reihenfolge.
//
// WAS HIER STEHT, IST NUR DIE BUCHFÜHRUNG (§3): eine Liste von Reiter-
// IDENTITÄTEN, jüngste zuletzt, ohne Dubletten, gekappt auf `MRU_MAX`. Kein
// Zeitstempel (§2: kein `Date.now()` in `src/lib`) — die Reihenfolge im Array
// IST die Reihenfolge. Welche Taste sie auslöst, entscheidet die Leiste.
//
// ZEHN statt `MAX`: anders als der Schliess-Ring ist das keine Rückfahrkarte
// für Verlorenes, sondern ein Kurzzeit-Gedächtnis für das Pendeln. Was zehn
// Reiter zurückliegt, findet man über das «+N»-Blatt, nicht über ein Kürzel.
const MRU_KEY = 'lexmetrik-tabs-mru';
const MRU_MAX = 10;

function ladeMru(): string[] {
  try {
    const roh = localStorage.getItem(MRU_KEY);
    const arr = roh ? JSON.parse(roh) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string').slice(-MRU_MAX) : [];
  } catch {
    return [];
  }
}

/** Schreibt fort, WELCHER Reiter gerade aktiv geworden ist. Aufrufer ist die
 *  Leiste bei jedem Aktiv-Wechsel; mehrfaches Melden derselben Identität ändert
 *  nichts (sie steht dann einmal, am jüngsten Ende). */
export function merkeAktivenReiter(path: string): void {
  const teil = tabSchluessel(path);
  const ohne = ladeMru().filter((k) => k !== teil);
  try { localStorage.setItem(MRU_KEY, JSON.stringify([...ohne, teil].slice(-MRU_MAX))); }
  catch { /* privater Modus — das Pendeln ist Komfort, kein Datenbestand */ }
}

/** Der zuletzt benutzte Reiter, der NICHT der aktive ist und noch offen steht —
 *  das Ziel des Pendel-Kürzels. `null` = es gibt keinen (frischer Start, oder
 *  alles Gemerkte ist inzwischen geschlossen); dann tut die Taste nichts, statt
 *  irgendwohin zu springen (§8).
 *
 *  @param offen Die offenen Reiter (Speicherordnung, die die Leiste ohnehin hält).
 *  @param aktiv Identität des aktiven Reiters (`tabSchluessel`). */
export function vorherigerReiter(offen: readonly TabEintrag[], aktiv: string): TabEintrag | null {
  const mru = ladeMru();
  for (let i = mru.length - 1; i >= 0; i -= 1) {
    if (mru[i] === aktiv) continue;
    const t = offen.find((x) => tabSchluessel(x.path) === mru[i]);
    if (t) return t;
  }
  return null;
}
