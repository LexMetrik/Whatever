import { pfadTeil } from './verlaufLabel';
import {
  type TabEintrag,
  tabSchluessel,
  festeZone,
  ladeTabs,
  schreibe,
  eintragAus,
  gleich,
  MAX,
} from './tabs.zustand';

export * from './tabs.zustand';
export * from './tabs.beschriftung';

/** Öffnet/aktualisiert einen Reiter und hängt einen NEUEN hinten an (gekappt auf
 *  die jüngsten MAX). Dublette (per `tabSchluessel`) behält ihre Position
 *  (stabile Reihenfolge) und übernimmt nur ein neu aufgelöstes Label.
 *
 *  ── Seit dem R2-Nachzug ist das der Weg für einen AUSDRÜCKLICH neuen Reiter
 *  (Mittelklick, Ctrl/⌘-Klick, ⌘/Ctrl+Enter in der Suche, «zweite Instanz»).
 *  Die gewöhnliche Navigation geht über `ersetzeTab` (§5a Ziff. 3). */
export function merkeTab(path: string, label?: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  const idx = bisher.findIndex((t) => tabSchluessel(t.path) === teil);
  if (idx !== -1) {
    const alt = bisher[idx];
    const neu = eintragAus(path, label, alt);
    // nur schreiben, wenn sich etwas ändert (idempotent gegen Mehrfach-Aufruf)
    if (gleich(alt, neu)) return;
    const naechste = [...bisher];
    naechste[idx] = neu;
    schreibe(naechste);
    return;
  }
  schreibe(kappeMitRing([...bisher, eintragAus(path, label)]));
}

/** ── W2·18 Punkt 4 · WAS DIE KAPPE FRISST, LIEGT IM RING ───────────────────
 *  Die Grenze `MAX` selbst bleibt (50 Reiter, Auftrag David). Bis W2·18 fiel
 *  der gekappte Reiter aber STILL weg: kein Ring-Eintrag, also keine
 *  Rückfahrkarte — ein geöffnetes Dokument verschwand, ohne dass jemand es
 *  geschlossen hätte, und Alt+⇧+T brachte es nicht zurück. Gekappt wird
 *  einheitlich vorne (die ältesten), und genau die gehen in den Ring.
 *  Die Ablage-REIHENFOLGE entscheidet `merkeGeschlossen` (W2·18 Welle 2
 *  Punkt 4): absteigend nach Position, damit das Wiederherstellen Position um
 *  Position von vorn zurückholt. Hier steht nur, WER weichen muss.
 *
 *  `geschuetzt` ist der Eintrag, der GERADE hereinkommt: beim Wiederherstellen
 *  am vollen Speicher darf nicht der eben zurückgeholte Reiter das Opfer der
 *  Kappe sein — sonst sähe die Geste aus, als hätte sie gar nichts getan.
 *  Weichen muss dann der älteste ANDERE; er geht seinerseits in den Ring. */
export function kappeMitRing(tabs: TabEintrag[], geschuetzt?: TabEintrag): TabEintrag[] {
  if (tabs.length <= MAX) return tabs;
  const bleibt: TabEintrag[] = [];
  const weg: GeschlossenerReiter[] = [];
  let zuViel = tabs.length - MAX;
  tabs.forEach((eintrag, index) => {
    // W2·25: ein ANGEHEFTETER Reiter ist nie das Opfer der Kappe. Wer einen
    // Erlass festhält, hält ihn gegen das Weglaufen der Leiste fest — genau
    // dagegen. Weichen muss dann der älteste freie; gibt es keinen mehr,
    // bleibt die Liste über MAX (50 angeheftete Reiter sind eine Ansage, kein
    // Versehen, und stilles Wegwerfen wäre die schlechtere Antwort, §8).
    if (zuViel > 0 && eintrag !== geschuetzt && !eintrag.fest) { weg.push({ eintrag, index }); zuViel -= 1; }
    else bleibt.push(eintrag);
  });
  merkeGeschlossen(weg);
  return bleibt;
}

/** ── §5a Ziff. 3 · EINE NAVIGATION ERSETZT DEN AKTIVEN REITER ───────────────
 *
 *  Wie im Browser: wer einem Link folgt, bekommt KEINEN neuen Reiter, sondern
 *  denselben Reiter mit neuem Inhalt («kein Reiter-Wildwuchs», David 6.9.2026).
 *  Drei Fälle, in dieser Reihenfolge — die Reihenfolge ist die ganze Regel:
 *
 *  1. **Das Ziel ist schon offen** → nur aktualisieren (`merkeTab`-Semantik).
 *     Der Wechsel auf einen bestehenden Reiter darf den vorher aktiven NICHT
 *     wegwerfen; sonst kostete jeder Klick in der Arbeitsleiste einen Reiter.
 *  2. **Der aktive Reiter existiert** → er wird an SEINER Position ersetzt
 *     (Reihenfolge bleibt stabil, der Reiter «wandert» nicht ans Ende).
 *  3. **Kein aktiver Reiter** (Kaltstart, Start-/Übersichtsseite als Herkunft)
 *     → anhängen wie bisher.
 *
 *  `altPath` ist die Adresse, aus der die Navigation kam; `null` heisst «es gab
 *  keinen». Rein deterministisch (§2), kein Zeitstempel, kein DOM.
 *
 *  ── R14 (7.9.2026) · BLÄTTERN IST KEIN VERLUST ────────────────────────────
 *  `ringt` sagt, ob der ersetzte Reiter in den «zuletzt geschlossen»-Ring
 *  gehört. GEMESSEN am Vorstand `79023e630` (`/gesetze` → OR → Zurück →
 *  Vorwärts): der Ring stand auf `[/gesetze, /gesetze/bund/OR, /gesetze]` —
 *  «/gesetze» doppelt, obwohl niemand etwas geschlossen hatte. Zurück und
 *  Vorwärts bewegen die History INNERHALB des Reiters; dabei geht nichts
 *  verloren, was man wiederherstellen müsste, und Alt+⇧+T verlor genau die
 *  Verlässlichkeit, für die R11-M3 es eingeführt hat. Der Aufrufer
 *  (`components/TabTracker.tsx`) kennt die Richtung deterministisch aus
 *  `useNavigationType()`; der Default `true` lässt jede andere Aufrufstelle
 *  (Panes in `layout/Shell.tsx`) bit-gleich wie vorher. */
export function ersetzeTab(altPath: string | null | undefined, neuPath: string, label?: string, ringt = true): void {
  const teilNeu = tabSchluessel(neuPath);
  const bisher = ladeTabs();
  if (bisher.some((t) => tabSchluessel(t.path) === teilNeu)) { merkeTab(neuPath, label); return; }
  const idxAlt = altPath ? bisher.findIndex((t) => tabSchluessel(t.path) === tabSchluessel(altPath)) : -1;
  if (idxAlt === -1) { merkeTab(neuPath, label); return; }
  const naechste = [...bisher];
  // M3: der ERSETZTE Reiter ist so verloren wie ein geschlossener — er kommt
  // darum in denselben Ring. Genau hier ist der Verlust häufiger als im
  // Browser, weil §5a Ziff. 3 das Ersetzen zum Normalfall macht.
  if (ringt) merkeGeschlossen([{ eintrag: bisher[idxAlt], index: idxAlt }]);
  // KEIN `alt`-Vorzustand: der Reiter zeigt jetzt ein ANDERES Dokument — Label,
  // Lesestellung und gewählter Anker des alten gehören nicht dorthin.
  naechste[idxAlt] = eintragAus(neuPath, label);
  schreibe(naechste);
}

export function schliesseTab(path: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  const idx = bisher.findIndex((t) => tabSchluessel(t.path) === teil);
  if (idx === -1) return;
  merkeGeschlossen([{ eintrag: bisher[idx], index: idx }]);
  schreibe(bisher.filter((_, i) => i !== idx));
}

export function leereTabs(): void {
  // ── W2·18 WELLE 2 PUNKT 4 · BERICHTIGTER KOMMENTAR ──────────────────────
  // Hier stand: «der ERSTE Reiter zuerst in den Ring, damit die
  // Wiederherstellung (vom Ende her) von hinten nach vorn zurückholt und
  // Position um Position stimmt.» Das war die Absicht, aber nicht die
  // Wirkung — GEMESSEN 13.9.2026 kam [a, b, c] als [a, c, b] zurück. Die
  // Ablage-Richtung entscheidet NICHT diese Stelle, sondern `merkeGeschlossen`
  // (dort die Herleitung): eine Geste legt absteigend nach Position ab, der
  // Stapel gibt sie aufsteigend zurück. Hier steht darum nur noch, WAS
  // hineinkommt — alles, mit seiner Position.
  // ── W2·25 · «ALLE» HEISST ALLE FREIEN ────────────────────────────────────
  // Angeheftete überleben die Geste (§5a Ziff. 5) — genau dafür heftet man an.
  // Sie gehen darum auch NICHT in den Ring: dort steht, was zurückgeholt
  // werden kann, und ein Reiter, der gar nicht weg ist, wäre dort eine tote
  // Zeile («Wieder öffnen: OR», während OR links steht).
  const bisher = ladeTabs();
  merkeGeschlossen(bisher.map((eintrag, index) => ({ eintrag, index })).filter(({ eintrag }) => !eintrag.fest));
  schreibe(bisher.filter((t) => t.fest));
}

/** ── W2·25 TEIL 2 · EINE MAPPE ÜBERNEHMEN (Spec §7, §5a Ziff. 9) ───────────
 *
 *  «Öffnen ersetzt die offenen Reiter nach sichtbarer Rückfrage, feste Reiter
 *  bleiben.» Die RÜCKFRAGE ist Sache der Oberfläche; hier steht, was danach
 *  geschieht — und zwar an EINER Stelle, weil dieselbe Übernahme aus zwei
 *  Richtungen kommt (Dialog und geteilte Adresse, §5).
 *
 *  DREI ZUSAGEN:
 *   1. Angeheftete Reiter bleiben, mit ihrem Platz vorn. Wer OR und ZGB
 *      festgehalten hat, verliert sie nicht, weil er eine Mappe öffnet — das
 *      ist derselbe Satz wie bei «Alle schliessen».
 *   2. Die verdrängten FREIEN Reiter gehen in den Schliess-Ring. Öffnen ist
 *      die grösste Schliess-Geste der App; ohne Rückfahrkarte wäre sie die
 *      einzige ohne (Alt+⇧+T holt sie Stück für Stück zurück).
 *   3. Die Ordnung bleibt zonentreu: erst die angehefteten (die offenen zuerst,
 *      dann die, die die Mappe mitbringt), dann die freien der Mappe.
 *
 *  Eine LEERE Mappe übernimmt gar nichts — sie schlösse sonst alles, ohne dass
 *  danach etwas dastünde (§8: eine Geste, die nur wegnimmt, ist keine).
 *
 *  @returns die neue Reiterfolge; der Aufrufer navigiert auf ihren ersten
 *           Eintrag aus der Mappe (er ist es, den die Mappe zeigen will).
 */
export function uebernehmeMappe(mappe: readonly TabEintrag[]): TabEintrag[] {
  if (mappe.length === 0) return ladeTabs();
  const bisher = ladeTabs();
  const offenFest = bisher.filter((t) => t.fest);
  const schonDa = new Set(offenFest.map((t) => tabSchluessel(t.path)));
  const ausMappe = mappe.filter((t) => !schonDa.has(tabSchluessel(t.path)));
  const naechste = [
    ...offenFest,
    ...ausMappe.filter((t) => t.fest),
    ...ausMappe.filter((t) => !t.fest),
  ];
  // Was verdrängt wird, ist das, was nachher nicht mehr dasteht — mit seiner
  // alten Position, damit Alt+⇧+T es dorthin zurücklegt.
  const bleibt = new Set(naechste.map((t) => tabSchluessel(t.path)));
  merkeGeschlossen(bisher.map((eintrag, index) => ({ eintrag, index }))
    .filter(({ eintrag }) => !bleibt.has(tabSchluessel(eintrag.path))));
  const gekappt = kappeMitRing(naechste);
  schreibe(gekappt);
  return gekappt;
}

/** ── M4 · «ALLE ANDEREN SCHLIESSEN» (Prüfbefund R11 #35) ────────────────────
 *  Reiner Array-Filter, deterministisch (§2), Identität über `tabSchluessel`.
 *  Kein Sonderfall für den leeren «+»-Reiter: er ist ein Reiter wie jeder
 *  andere und wird mitgeschlossen, wenn er nicht der genannte ist. */
export function schliesseAndere(path: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  if (!bisher.some((t) => tabSchluessel(t.path) === teil)) return;
  // W2·25: «alle anderen» lässt die angehefteten stehen — dieselbe Zusage wie
  // bei «Alle schliessen», und dieselbe wie im Browser.
  const bleibt = (t: TabEintrag) => tabSchluessel(t.path) === teil || !!t.fest;
  const weg = bisher.map((eintrag, index) => ({ eintrag, index }))
    .filter(({ eintrag }) => !bleibt(eintrag));
  if (weg.length === 0) return;
  merkeGeschlossen(weg);
  schreibe(bisher.filter(bleibt));
}

/** ── M4 · «RECHTS DAVON SCHLIESSEN» ────────────────────────────────────────
 *  Alles NACH der Position des genannten Reiters fällt weg; der genannte und
 *  alles links davon bleibt. Die Position ist die des flachen Speichers — also
 *  genau die, die die Arbeitsleiste zeigt (D16). */
export function schliesseRechtsVon(path: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  const idx = bisher.findIndex((t) => tabSchluessel(t.path) === teil);
  if (idx === -1 || idx === bisher.length - 1) return;
  // W2·25: rechts von einem ANGEHEFTETEN Reiter stehen die übrigen
  // angehefteten — auch sie bleiben (§5a Ziff. 5). Von einem freien Reiter aus
  // ändert das nichts: die feste Zone liegt immer links.
  const weg = bisher.slice(idx + 1).map((eintrag, i) => ({ eintrag, index: idx + 1 + i }))
    .filter(({ eintrag }) => !eintrag.fest);
  if (weg.length === 0) return;
  merkeGeschlossen(weg);
  schreibe(bisher.filter((t, i) => i <= idx || !!t.fest));
}

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
const ZU_MAX = MAX;

/** Ein geschlossener Reiter mit der Position, an der er stand. Die Position ist
 *  der ganze Unterschied zu einem Verlauf: wiederhergestellt wird DORT, wo der
 *  Reiter war, nicht am Ende der Leiste. */
interface GeschlossenerReiter { eintrag: TabEintrag; index: number }

function ladeGeschlossene(): GeschlossenerReiter[] {
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

function schreibeGeschlossene(ring: GeschlossenerReiter[]): void {
  try { localStorage.setItem(ZU_KEY, JSON.stringify(ring.slice(-ZU_MAX))); }
  catch { /* privater Modus — die Rückfahrkarte ist Komfort, kein Datenbestand */ }
}

/** Legt geschlossene/ersetzte Reiter hinten in den Ring (jüngster zuletzt).
 *  Die SAMMLUNG kommt NICHT hinein: sie trägt kein Dokument, ihre
 *  «Wiederherstellung» wäre ein Klick auf «+» (§8 — nichts versprechen, was
 *  keinen Wert hat). Bis R14 stand hier dieselbe Regel für den leeren
 *  «+»-Reiter (`!eintrag.leer`); seit die Sammlung selbst der Reiter ist, ist
 *  ihr PFAD das Merkmal — der Sonderfall im Datenmodell entfällt. */
function merkeGeschlossen(neue: GeschlossenerReiter[]): void {
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

/** Stellt den zuletzt geschlossenen Reiter AN SEINER ALTEN POSITION wieder her
 *  und gibt ihn zurück (der Aufrufer navigiert dorthin). null = nichts im Ring.
 *
 *  Ist derselbe Reiter inzwischen wieder offen, wird der Ring-Eintrag
 *  VERBRAUCHT und der offene Reiter zurückgegeben — sonst bliebe ein Eintrag
 *  stehen, dessen Wiederherstellung sichtbar nichts tut. */
export function stelleLetztenWiederHer(): TabEintrag | null {
  const ring = ladeGeschlossene();
  const letzter = ring.pop();
  if (!letzter) return null;
  schreibeGeschlossene(ring);
  const bisher = ladeTabs();
  const teil = tabSchluessel(letzter.eintrag.path);
  if (bisher.some((t) => tabSchluessel(t.path) === teil)) return letzter.eintrag;
  const naechste = [...bisher];
  // W2·25: die alte Position gilt, SOWEIT sie die Zonengrenze achtet. Ein
  // freier Reiter, dessen Platz inzwischen in der festen Zone läge (jemand hat
  // in der Zwischenzeit angeheftet), landet als erster freier statt mitten
  // zwischen den angehefteten — sonst wäre die Rückfahrkarte die eine Stelle,
  // die den Speicher bricht, den `ladeTabs` gleich darauf wieder umsortiert.
  const zone = festeZone(naechste);
  const roh = Math.min(letzter.index, naechste.length);
  naechste.splice(letzter.eintrag.fest ? Math.min(roh, zone) : Math.max(roh, zone), 0, letzter.eintrag);
  // W2·18 Punkt 4: dieselbe Richtung und derselbe Ring wie beim Öffnen — hier
  // stand `.slice(0, MAX)` und warf am vollen Speicher den JÜNGSTEN Reiter weg,
  // um den wiederhergestellten aufzunehmen.
  schreibe(kappeMitRing(naechste, letzter.eintrag));
  return letzter.eintrag;
}

/** Pfad für eine NEUE Instanz desselben Erlasses/Items (Auftrag David: dasselbe
 *  Gesetz mehrfach offen). Hängt den nächsten freien `?r=<n>` an den aktuellen
 *  Pfad (Artikel-Anker bleibt erhalten). Die erste Instanz trägt kein `?r`
 *  (implizit r=1), die nächste `?r=2` usw. */
export function naechsteInstanz(path: string): string {
  const pfad = pfadTeil(path);
  const hash = path.includes('#') ? `#${path.split('#')[1]}` : '';
  const rs = ladeTabs()
    .filter((t) => pfadTeil(t.path) === pfad)
    .map((t) => Number(new URLSearchParams(t.path.split('#')[0].split('?')[1] ?? '').get('r')) || 1);
  const next = (rs.length ? Math.max(...rs) : 0) + 1;
  return `${pfad}?r=${next}${hash}`;
}

/** Aktualisiert NUR den Artikel-Anker (#) eines bereits offenen Reiters mit
 *  dieser Identität — die LESESTELLUNG (Neustart, Reiter-Liste, Auftrag David).
 *  Legt KEINEN neuen Reiter an und ändert die Reihenfolge nicht.
 *  Rührt `wahl` NICHT an: die Beschriftung folgt der Adresse, nicht dem
 *  Scroll-Spy (F5, Herleitung an `TabEintrag.wahl`). */
export function aktualisiereTabArtikel(path: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  const idx = bisher.findIndex((t) => tabSchluessel(t.path) === teil);
  if (idx === -1 || bisher[idx].path === path) return;
  const naechste = [...bisher];
  naechste[idx] = { ...bisher[idx], path };
  schreibe(naechste);
}
