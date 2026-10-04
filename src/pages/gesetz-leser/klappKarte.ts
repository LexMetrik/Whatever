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
// (`mitlaufenKarte`) ÖFFNET nur Sektions-Ids (CLS-Regel 13.8.2026,
// `artikelSchluessel` unten). Geschlossen wird auf JEDEM Pfad über eine Regel
// (`schliesseZeilen`): mit der Zeile ihre Artikel-Ebene (Code-Zweitblick PR
// #924; Wächter `src/tests/gliederung-zustandsfolgen.test.ts`). Jeder
// `setTocBaum` im Leser ruft eine Funktion dieser Datei.

import type { GliederungsKnoten, GliederungsModus } from './gliederungsTypen';

/**
 * Was `alleKlappIds` von einer Gliederungszeile braucht — strukturell statt
 * `import type { GliederungsKnoten }`: gliederungsModell.ts liest
 * `artikelSchluessel` von hier, ein Rück-Import wäre ein Zyklus (check:zyklen).
 */
interface KlappKnoten { readonly ids: readonly string[]; readonly kinder: readonly KlappKnoten[] }

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
export function alleKlappIds(knoten: readonly KlappKnoten[]): string[] {
  const ids: string[] = [];
  const geh = (ks: readonly KlappKnoten[]) => {
    for (const k of ks) { if (k.kinder.length > 0) { ids.push(...k.ids); geh(k.kinder); } }
  };
  geh(knoten);
  return ids;
}

/**
 * Die Ids, über die «alles auf/zu» der LEISTE läuft — nur Zeilen, die die Leiste
 * wirklich rendert (W2·17-UI-BEFUNDE B1-B01, 2.10.2026). `LeserGliederung` zeigt
 * je Modus etwas anderes: `b1` den ganzen Sektionsbaum, `b2/b4` den flachen
 * Artikel-Index PLUS den Anhang-Ast (der Rest des Baums wird dort nie gerendert),
 * `b3` nichts. Bis hierher lief der Knopf über `alleKlappIds(gliederung.knoten)`
 * auch dort, wo der Baum gar nicht steht: im VwVG 31 Ids unsichtbarer Zeilen —
 * der Knopf kippte seine Beschriftung («alles auf» → «alles zu»), und auf dem
 * Bildschirm geschah nichts (§8: ein Knopf, der nichts tut). Eine leere Liste
 * heisst: es gibt nichts zu klappen, die Leiste zeigt den Knopf nicht.
 * Strukturell typisiert aus demselben Grund wie `KlappKnoten` (kein Rück-Import
 * des Modells, check:zyklen) — `art`/`modus` kommen aus `gliederungsTypen`.
 */
export function leistenKlappIds(
  g: { modus: GliederungsModus; knoten: readonly (KlappKnoten & { art: GliederungsKnoten['art'] })[] },
): string[] {
  return alleKlappIds(leistenKnoten(g));
}

/** Die Zeilen-Wurzeln, die `LeserGliederung` als BAUM rendert (Herleitung bei `leistenKlappIds`). */
export function leistenKnoten<K extends { art: GliederungsKnoten['art'] }>(
  g: { modus: GliederungsModus; knoten: readonly K[] },
): readonly K[] {
  if (g.modus === 'b3-leer') return [];
  if (g.modus === 'b2-index' || g.modus === 'b4-mini') return g.knoten.filter((k) => k.art === 'anhang');
  return g.knoten;
}

/**
 * DIE Schliess-Regel der Klapp-Karte (W2·5m-LESER-V3, Code-Zweitblick PR #924):
 * wird eine Zeile geschlossen — gleich über welchen Pfad —, ist auch ihre
 * Artikel-Ebene geschlossen. Alle Schliesser laufen hierüber: Chevron
 * (`klappZeile`), «alles zu» (`klappZeile` über alle Ids), Auto-Zuklappen (`mitlaufenKarte`).
 *
 * WARUM. Bis hierher setzte das Auto-Zuklappen nur `<id>=false`; ein vom
 * Tieflink gesetztes `art@<id>` blieb liegen, und das nächste Mitlaufen
 * (`<id>=true`) öffnete darüber eine reine Artikel-Liste — ein Öffnen der
 * Artikel-Ebene durch den Spy, das die CLS-Regel 13.8.2026 ausschliesst
 * (Wächter `gliederung-zustandsfolgen`: 4'580/4'580 Fälle rot).
 *
 * `nurGesetzte`: nur Schlüssel umlegen, die `true` stehen (Spy: eine Zeile,
 * die aus dem Modell offen startet, bleibt unberührt, und ohne Änderung
 * bleibt es beim Nicht-Rendern). Sonst ausdrücklich `false` — Klick und
 * «alles zu» müssen auch eine Zeile ohne Karten-Eintrag schliessen.
 * Mutiert `n` (die Kopie des Aufrufers) und meldet, ob sich etwas änderte.
 */
function schliesseInKopie(n: Record<string, boolean>, id: string, nurGesetzte: boolean): boolean {
  let geaendert = false;
  for (const s of [id, artikelSchluessel(id)]) {
    if (n[s] === true || (!nurGesetzte && n[s] !== false)) { n[s] = false; geaendert = true; }
  }
  return geaendert;
}

/** Schliesst die Zeilen `ids` samt Artikel-Ebene (ausdrücklich, neue Karte). */
function schliesseZeilen(offen: Record<string, boolean>, ids: readonly string[]): Record<string, boolean> {
  const n = { ...offen };
  for (const id of ids) schliesseInKopie(n, id, false);
  return n;
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
  // Schliessen läuft über DIE Schliess-Regel (`schliesseZeilen`); Öffnen
  // bewegt die ARTIKEL-Ebene mit — nur ein ausdrücklicher Schritt tut das
  // (dieser Klick und die Öffner oben), nie der Spy (s. u.).
  if (istOffen) return schliesseZeilen(offen, ids);
  return {
    ...offen,
    ...Object.fromEntries(ids.map((id) => [id, true])),
    ...Object.fromEntries(ids.map((id) => [artikelSchluessel(id), true])),
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
const ARTIKEL_OFFEN_PRAEFIX = 'art@';
export function artikelSchluessel(id: string): string {
  return `${ARTIKEL_OFFEN_PRAEFIX}${id}`;
}

/**
 * Die Karten-Rechnung des Scroll-Spys (Mitlaufen + Auto-Zuklappen) als reine
 * Funktion — bis W2·5m-LESER-V3 stand sie als Closure `aktualisieren` in
 * `inhalt-hooks.tsx` und war nur über React erreichbar. Mitlaufen öffnet die
 * Sektions-Ids des aktiven Pfads (nie die Artikel-Ebene, CLS-Regel 13.8.2026;
 * nie eine vom Nutzer zugeklappte Id), das Auto-Zuklappen schliesst die Ids,
 * die `planeZuklappen` freigibt — samt Artikel-Ebene (`schliesseInKopie`,
 * seit W2·5m-LESER-V3; vorher blieb `art@` liegen). Identische Referenz, wenn nichts ändert
 * (kein Re-Render).
 */
export function mitlaufenKarte(
  o: Record<string, boolean>,
  a: { aktivIds: readonly string[]; aufklappen: boolean; manuellZu: ReadonlySet<string>; schliessen: readonly string[] },
): Record<string, boolean> {
  let geaendert = false;
  const n = { ...o };
  if (a.aufklappen) for (const id of a.aktivIds) if (!n[id] && !a.manuellZu.has(id)) { n[id] = true; geaendert = true; }
  // Auto-Zu über DIE Schliess-Regel: mit der Zeile geht ihr `art@` zu.
  for (const id of a.schliessen) if (schliesseInKopie(n, id, true)) geaendert = true;
  return geaendert ? n : o;
}
