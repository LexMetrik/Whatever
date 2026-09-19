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
// `artikelSchluessel` unten).

import type { GliederungsKnoten } from './gliederungsModell';

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

/**
 * B3 (Bug-Check 9.8.2026) — EINE ZEILE, EIN ZIELWERT.
 *
 * Eine verdichtete Einzelkind-Kette ist EINE Baumzeile mit MEHREREN
 * Sektions-Ids. Der Chevron kippte sie bis hierher EINZELN
 * (`k.ids.forEach(tocToggle)`). Standen die Ids nicht im gleichen Zustand — und
 * genau das hinterlässt ein Sektions-Sprung, der nur die äusserste Id öffnet —,
 * kam ein GEMISCHTER Zustand heraus. Weil eine Zeile als offen gilt, sobald
 * IRGENDEINE ihrer Ids offen ist (`zeileIstOffen`, `.some(Boolean)`), liess sich
 * der Ast danach nie wieder schliessen: `aria-expanded` blieb dauerhaft `true`,
 * und der Nutzer hatte keinen Ausweg. Betroffen sind alle Zeilen mit
 * Verdichtung UND Kindern (ZGB, VVG, KOV, mehrere BS-Erlasse).
 *
 * Die Regel steht HIER und nicht im Zustands-Hook, damit sie ohne React und
 * ohne DOM prüfbar ist (§6.7: das Tor muss den Fall rot zeigen können).
 * `istOffen` kommt vom Aufrufer, weil die Zeile ihren sichtbaren Zustand auch
 * aus dem Modell beziehen kann (`startOffen`, `startOffeneTiefe`) — eine Zeile
 * ohne Eintrag in der Karte liesse sich sonst mit dem ersten Klick nicht
 * schliessen.
 */
export function klappZeile(
  offen: Record<string, boolean>, ids: string[], istOffen: boolean,
): Record<string, boolean> {
  const ziel = !istOffen;
  return {
    ...offen,
    ...Object.fromEntries(ids.map((id) => [id, ziel])),
    // Die ARTIKEL-Ebene bewegt nur ein ausdrücklicher Schritt — dieser Klick
    // und die Öffner in ./klappKarte, nie der Spy (s. u.).
    ...Object.fromEntries(ids.map((id) => [artikelSchluessel(id), ziel])),
  };
}

/**
 * Schlüssel des Artikel-Ebenen-Zustands einer Zeile (CI-Rot 13.8.2026).
 *
 * WARUM EIN ZWEITER SCHLÜSSEL IN DERSELBEN KARTE. Die Klapp-Karte `tocBaum`
 * hat zwei Schreiber: den NUTZER (Chevron-Klick, Sektions-Sprung) und den
 * SCROLL-SPY (Auto-Akkordeon). Für die Sektions-Ebene ist das richtig — der
 * Spy soll den gelesenen Zweig aufreissen. Für die Artikel-Ebene ist es der
 * Defekt: der Spy öffnete beim Weiterlesen eine Zeile, die ihre Artikel trägt,
 * und das Auto-Zuklappen hängte den so gewachsenen Ast später wieder aus —
 * mit bis zu 49 Artikel-Zeilen darin.
 *
 * BELEG (CI-Lauf 31721564029, Shard 6, deterministisch in Erst- und
 * Zweitlauf): CLS 0.0751 gegen Budget 0.05, Quellen drei Baumzeilen der BV,
 * die im Sichtband auf 0×0 kollabieren — die grösste 280×498 px, also genau
 * eine aufgeklappte Artikel-Liste. Der Trace zeigt zugleich, dass die BV mit
 * `aria-expanded="false"` an den artikel-tragenden Zeilen STARTET: geöffnet
 * haben kann sie also nur der Spy.
 *
 * Mit dem zweiten Schlüssel bewegt der Spy weiterhin die Sektionen (a33-Auftrag
 * K bleibt erfüllt), die Artikel-Ebene aber nur noch der ausdrückliche Klick —
 * und der ist Nutzer-Eingabe, deren Layout-Sprung nicht als unerwarteter Shift
 * zählt. Zugleich landet eine so geöffnete Zeile in `manuellOffenRef`
 * (inhalt-zustand) und wird vom Auto-Zuklappen nie wieder angefasst: die
 * grossen Aushäng-Ereignisse können gar nicht mehr entstehen.
 *
 * Der Präfix kann mit keiner `sek-N`- oder `gm-…`-Id kollidieren.
 */
export const ARTIKEL_OFFEN_PRAEFIX = 'art@';
export function artikelSchluessel(id: string): string {
  return `${ARTIKEL_OFFEN_PRAEFIX}${id}`;
}

/**
 * Die Karten-Rechnung des Scroll-Spys (Mitlaufen + Auto-Zuklappen) als reine
 * Funktion — bis W2·5m-LESER-V3 stand sie als Closure `aktualisieren` in
 * `inhalt-hooks.tsx` und war nur über React erreichbar. Mitlaufen öffnet die
 * Sektions-Ids des aktiven Pfads (nie die Artikel-Ebene, CLS-Regel 13.8.2026;
 * nie eine vom Nutzer zugeklappte Id), das Auto-Zuklappen schliesst die Ids,
 * die `planeZuklappen` freigibt. Identische Referenz, wenn nichts ändert
 * (kein Re-Render).
 */
export function mitlaufenKarte(
  o: Record<string, boolean>,
  a: { aktivIds: readonly string[]; aufklappen: boolean; manuellZu: ReadonlySet<string>; schliessen: readonly string[] },
): Record<string, boolean> {
  let geaendert = false;
  const n = { ...o };
  if (a.aufklappen) for (const id of a.aktivIds) if (!n[id] && !a.manuellZu.has(id)) { n[id] = true; geaendert = true; }
  for (const id of a.schliessen) if (n[id]) { n[id] = false; geaendert = true; }
  return geaendert ? n : o;
}
