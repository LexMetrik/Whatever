// ─── Offene In-App-Reiter (Tab-Streifen, Zustand/Speicher) ──────────────────
//
// SSoT des localStorage-Keys 'lexmetrik-tabs' (§5). Reines Speicher-Werkzeug,
// KEINE Rechtslogik (§3): die Liste der zugleich offenen Reiter (Engines,
// Gesetze, Vorlagen, Entscheide), damit man ohne Browser-Tab zwischen mehreren
// hin- und herwechseln kann. Gespeichert wird NUR der Navigationspfad (+ optio-
// nales Anzeige-Label), NIE Formularinhalte (Berufsgeheimnis; das v1 erhält die
// Reiter-LISTE über Reloads, nicht den flüchtigen Formular-State — bewusste
// Grenze, navigationsbasiert). Reihenfolge = Array-Position, NEUE Reiter HINTEN
// angehängt (stabil, anders als der neueste-vorn-Ring in verlauf.ts) — kein
// Zeitstempel, also kein Date.now() in src/lib (§2 Determinismus).

export interface TabEintrag {
  path: string;
  label?: string;
  /** ── D27 (David 6.9.2026) · DER GEWÄHLTE ANKER — SEIT D27 NUR NOCH RÜCKFALL
   *  `path` trägt die LESESTELLUNG: der Scroll-Spy des Lesers schiebt dort
   *  laufend `#art-…` hinein (`aktualisiereTabArtikel`), damit ein Neustart an
   *  derselben Stelle aufsetzt (§5a Ziff. 6) und die Reiter-Liste die Position
   *  zeigt.
   *
   *  Der R2-Nachzug (F5) baute die Beschriftung ausdrücklich NICHT daraus,
   *  sondern aus diesem Feld — dem Anker, den die ADRESSE trug —, weil dieselbe
   *  Adresse sonst zwei Beschriftungen trug («ZGB» kalt, «Art. 3 ZGB» nach dem
   *  Scrollen). David 6.9.2026 hat die Regel UMGEDREHT: «diese funktion, dass
   *  es anzeigt in welchem artikel wir sind, soll der tab bekommen. es kann
   *  dann direkt im gesetz raus.» Determinismus (§2) heisst seither «gleiche
   *  LESESTELLUNG ⇒ gleiche Beschriftung» statt «gleiche Adresse ⇒ gleiche
   *  Beschriftung» — und die Lesestellung ist der gespeicherte `path`, der den
   *  Neustart überlebt (Kaltstart == SPA == Reload bei gleicher Stellung).
   *
   *  `wahl` bleibt der RÜCKFALL für das Fenster VOR dem ersten Spy-Lauf: ein
   *  Deep-Link `…#art-336_c`, der über `merkeTab` ohne Hash im `path`
   *  nachaktualisiert wird, verlöre sonst seinen Artikel, bis der Leser das
   *  erste Mal gescrollt hat. Er wird nie aus der Lesestellung nachgezogen. */
  wahl?: string;
  /** ── W2·25 (Spec `FAHRPLAN-DESIGN-IDENTITAET.md` §7) · ANGEHEFTET ────────
   *  Ein angehefteter Reiter steht schmal ganz links, trägt kein ✕ und
   *  überlebt «Alle schliessen» wie den Neustart (§5a Ziff. 5).
   *
   *  DIE D16-AUFLAGE STECKT IM WORT «FLACH»: Anheften ist KEINE zweite
   *  Anzeige-Ordnung, sondern eine Eigenschaft des Eintrags, die den EINEN
   *  Speicher umsortiert (feste zuerst, `hefteAn`). Fixer 1c hat jede
   *  Anzeige-Gruppierung entfernt, weil sie das Ziehen einsammelte («es geht
   *  nur wenn nur gesetze offen sind — bug», `e2e/w224-reiter-umordnen-d16`);
   *  eine Gruppierung, die das Anheften nachbaut, wäre derselbe Defekt unter
   *  neuem Namen. Was die Leiste zeigt, ist weiterhin `tabs` in
   *  Speicherreihenfolge — nur dass die festen darin vorn stehen.
   *
   *  DER PREIS DAFÜR IST EINE ZONENGRENZE, und die wird ABGELEHNT, nicht
   *  still korrigiert: ein Zug, der einen freien Reiter vor einen festen
   *  brächte, schreibt gar nichts (`ordneTabsUm` meldet `false`, und die
   *  Leiste zeigt die Sperre schon unter dem Zeiger). Ein still zurechtgerückter
   *  Zug wäre genau das D16-Bild — man zieht, und es geschieht etwas anderes.
   *
   *  DIE EIGENSCHAFT GEHÖRT DEM PLATZ, NICHT DEM DOKUMENT (Browser-Norm): eine
   *  Navigation IM angehefteten Reiter (`ersetzeTab`) lässt ihn angeheftet. */
  fest?: boolean;
}

export const KEY = 'lexmetrik-tabs';
export const MAX = 50;

/** Identität eines Reiters: pathname + optionaler Instanz-Diskriminator `?r=<n>`.
 *  Erlaubt DASSELBE Gesetz mehrfach offen (Auftrag David): zwei Reiter mit
 *  gleichem Pfad, aber verschiedenem `?r` sind verschiedene Reiter. Andere
 *  Query-Parameter (z.B. ?preset=) und der #Artikel-Anker gehören NICHT zur
 *  Identität — eine Engine mit ?preset=a/b bleibt EIN Reiter, der Artikel ändert
 *  nur Label/Scrollziel. */
export function tabSchluessel(path: string): string {
  const vorHash = path.split('#')[0];
  const [pfad, qs] = vorHash.split('?');
  const r = new URLSearchParams(qs ?? '').get('r');
  return r ? `${pfad}?r=${r}` : pfad;
}

/** Event, mit dem Schreiber (TabTracker, Schliess-Buttons) die Leser
 *  (useTabs → ReiterUebersicht/TabPanel) im selben Browser-Tab synchron halten. */
export const TABS_EVENT = 'lexmetrik:tabs';

// ═══ W2·25 · DIE FESTE ZONE (Spec §7 Teil 1, D16-Auflage) ══════════════════
//
// Es gibt genau EINE Ordnung (den flachen Speicher) und darin genau EINE
// Grenze: alles vor `festeZone` ist angeheftet, alles danach frei. Drei
// Funktionen halten sie — die Zählung, die Prüfung, der Zug. Jede andere
// Stelle der App fragt diese drei, statt selbst zu rechnen (§5).

/** Wie viele Reiter am KOPF der Ordnung angeheftet sind = Ende der festen
 *  Zone und zugleich die erste freie Position. Zählt nur den ZUSAMMENHÄNGENDEN
 *  Kopf: ein fester Reiter hinter einem freien wäre ein gebrochener Speicher,
 *  und den heilt `ladeTabs`, statt ihn hier mitzuzählen. */
export function festeZone(tabs: readonly TabEintrag[]): number {
  let n = 0;
  while (n < tabs.length && tabs[n].fest) n += 1;
  return n;
}

/** Steht die Ordnung richtig — erst alle festen, dann alle freien? Die eine
 *  Regel, gegen die jeder Zug geprüft wird (statt Indizes zweimal zu rechnen). */
function zonenTreu(tabs: readonly TabEintrag[]): boolean {
  return festeZone(tabs) === tabs.filter((t) => t.fest).length;
}

/** Den Zug ausrechnen, ohne ihn zu schreiben — `null` heisst «gibt es nicht»
 *  oder «über die Zonengrenze». EINE Quelle für beide Aufrufer: `ordneTabsUm`
 *  schreibt das Ergebnis, die Leiste fragt über `zugErlaubt` schon beim
 *  Überfahren, um die Sperre unter dem Zeiger zu zeigen (§8: die Ablehnung
 *  kommt vor dem Loslassen, nicht als stille Korrektur danach). */
function zugErgebnis(
  tabs: readonly TabEintrag[], vonPath: string, nachPath: string, davor?: boolean,
): TabEintrag[] | null {
  const von = tabs.findIndex((t) => tabSchluessel(t.path) === tabSchluessel(vonPath));
  const nach = tabs.findIndex((t) => tabSchluessel(t.path) === tabSchluessel(nachPath));
  if (von === -1 || nach === -1 || von === nach) return null;
  const seite = davor ?? von > nach;
  const naechste = [...tabs];
  const [bewegt] = naechste.splice(von, 1);
  const nachNeu = naechste.findIndex((t) => tabSchluessel(t.path) === tabSchluessel(nachPath));
  naechste.splice(seite ? nachNeu : nachNeu + 1, 0, bewegt);
  return zonenTreu(naechste) ? naechste : null;
}

/** Darf dieser Zug stattfinden? Für die Einfügemarke und den `dropEffect` —
 *  die Leiste zeichnet die Sperre, sie erfindet sie nicht. */
export function zugErlaubt(
  tabs: readonly TabEintrag[], vonPath: string, nachPath: string, davor?: boolean,
): boolean {
  return zugErgebnis(tabs, vonPath, nachPath, davor) !== null;
}

/** Ist dieser Reiter angeheftet? (Kontextmenü: «Anheften» oder «Lösen».) */
export function istFest(path: string): boolean {
  const teil = tabSchluessel(path);
  return ladeTabs().some((t) => tabSchluessel(t.path) === teil && t.fest === true);
}

/** Anheften: setzt die Eigenschaft UND sortiert den flachen Speicher um — der
 *  Reiter wandert ans ENDE der festen Zone (bei der ersten Anheftung also auf
 *  Position 0). Ans Ende, nicht nach vorn: wer einen zweiten Reiter anheftet,
 *  soll den ersten nicht verschoben vorfinden (dieselbe Ruhe wie beim
 *  Anhängen neuer Reiter hinten). Nichts geht verloren, also kein Ring. */
export function hefteAn(path: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  const i = bisher.findIndex((t) => tabSchluessel(t.path) === teil);
  if (i === -1 || bisher[i].fest) return;
  const naechste = bisher.filter((_, j) => j !== i);
  naechste.splice(festeZone(naechste), 0, { ...bisher[i], fest: true });
  schreibe(naechste);
}

/** Lösen: der Reiter verliert die Eigenschaft und steht danach als ERSTER
 *  freier — er bleibt damit dort, wo er eben noch stand, statt ans Ende der
 *  Leiste zu springen (ein gelöster Reiter ist nicht ein neu geöffneter). */
export function loeseAb(path: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  const i = bisher.findIndex((t) => tabSchluessel(t.path) === teil);
  if (i === -1 || !bisher[i].fest) return;
  // Das Feld wird ENTFERNT, nicht auf `false` gesetzt: ein `fest: false` im
  // Speicher wäre eine zweite Schreibweise für dasselbe (§5) und stünde in
  // jedem exportierten Eintrag (Mappen-Adresse) ohne Aussage herum.
  const frei: TabEintrag = { ...bisher[i] };
  delete frei.fest;
  const naechste = bisher.filter((_, j) => j !== i);
  naechste.splice(festeZone(naechste), 0, frei);
  schreibe(naechste);
}

export function ladeTabs(): TabEintrag[] {
  try {
    const roh = localStorage.getItem(KEY);
    const arr = roh ? JSON.parse(roh) : [];
    if (!Array.isArray(arr)) return [];
    const gesehen = new Set<string>();
    return arr
      .filter((e): e is TabEintrag & { leer?: unknown } =>
        e && typeof e.path === 'string' &&
        (e.label === undefined || typeof e.label === 'string') &&
        (e.wahl === undefined || typeof e.wahl === 'string'))
      .map(({ path, label, wahl, fest }): TabEintrag => ({
        path,
        ...(label ? { label } : {}),
        ...(wahl ? { wahl } : {}),
        ...(fest === true ? { fest: true } : {}),
      }))
      .filter((e) => {
        const k = tabSchluessel(e.path);
        if (gesehen.has(k)) return false;
        gesehen.add(k);
        return true;
      })
      // W2·18 Punkt 4 · EINE RICHTUNG: die ÄLTESTEN fallen. Hier stand
      // `.slice(0, MAX)` — beim Lesen fielen also die JÜNGSTEN 50 weg, während
      // `merkeTab` beim Schreiben die ältesten kappt. Zwei Richtungen an
      // derselben Grenze heisst: welche Reiter ein voller Speicher verliert,
      // hing davon ab, wer ihn zuletzt angefasst hat. Kein Ring-Eintrag an
      // dieser Stelle — Lesen ist keine Handlung, und `ladeTabs` läuft bei
      // jedem Ereignis (`useTabs`): ein Schreibzugriff im Lesepfad legte
      // denselben Eintrag bei jedem Lauf erneut in den Ring.
      // W2·25: die Kappe steht VOR der Partition, nicht danach — `slice(-MAX)`
      // schneidet vorn ab, und vorn stehen nach der Partition gerade die
      // ANGEHEFTETEN. Andersherum verlöre ein übervoller Speicher beim blossen
      // LESEN genau die Reiter, die der Nutzer festgehalten hat.
      .slice(-MAX)
      // ── W2·25 · DIE PARTITION IST TEIL DES LESENS, NICHT DES ZEICHNENS ──
      // Feste zuerst, innerhalb jeder Zone in gespeicherter Reihenfolge
      // (STABIL — `sort` wäre hier falsch, die Reihenfolge IST die Ordnung).
      // Sie steht HIER und nicht in der Leiste, weil die Leiste sonst eine
      // zweite Anzeige-Ordnung führte — genau der D16-Rückfall, den die
      // Spec ausschliesst. Geheilt wird damit auch, was von aussen kommt:
      // ein zweites Browserfenster mit älterem Stand, ein von Hand
      // geschriebener Speicher, eine Sitzung von vor diesem Schritt.
      // Rein deterministisch (§2), kein Zeitstempel, kein Schreibzugriff im
      // Lesepfad (`ladeTabs` läuft bei jedem Ereignis, s. `useTabs`).
      .reduce<TabEintrag[]>((acc, e) => {
        if (e.fest) acc.splice(festeZone(acc), 0, e); else acc.push(e);
        return acc;
      }, []);
  } catch {
    return [];
  }
}

export function schreibe(tabs: TabEintrag[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(tabs)); } catch { /* privater Modus — Reiter sind Komfort */ }
  try { window.dispatchEvent(new Event(TABS_EVENT)); } catch { /* SSR/kein window */ }
}

/** Anker der ADRESSE («#art-…») oder undefined. Quelle des `wahl`-Feldes. */
export function hashVon(path: string): string | undefined {
  const i = path.indexOf('#');
  return i === -1 ? undefined : path.slice(i);
}

/** Eintrag aus einer Adresse bauen — mit `alt` als Vorzustand desselben Reiters
 *  (Label, Lesestellung und gewählter Anker überleben ein hash-/labelloses
 *  Update). EINE Stelle für diese Regel: `merkeTab` und `ersetzeTab` bauen
 *  denselben Eintrag, sonst driften «anhängen» und «ersetzen» auseinander. */
export function eintragAus(path: string, label?: string, alt?: TabEintrag): TabEintrag {
  // Ein Update OHNE Artikel-Anker (z.B. vom TabTracker mit pathname+?r) darf den
  // vom Reader gepflegten Anker NICHT löschen — sonst verlöre die zweite Instanz
  // ihr Live-Label «Kürzel – Art. X» (Auftrag David).
  const neuPath = (!path.includes('#') && alt?.path.includes('#'))
    ? `${path}#${alt.path.split('#')[1]}`
    : path;
  const neuLabel = label ?? alt?.label;
  const neuWahl = hashVon(path) ?? alt?.wahl;
  return {
    path: neuPath,
    ...(neuLabel ? { label: neuLabel } : {}),
    ...(neuWahl ? { wahl: neuWahl } : {}),
    // W2·25: die Anheftung gehört dem PLATZ, nicht dem Dokument (Browser-Norm)
    // — wer im angehefteten Reiter weiternavigiert, findet ihn angeheftet vor.
    // Ohne diese Zeile löste jede Navigation die Anheftung still, und die
    // Zonen-Partition in `ladeTabs` schöbe den Reiter obendrein weg.
    ...(alt?.fest ? { fest: true as const } : {}),
  };
}

export const gleich = (a: TabEintrag, b: TabEintrag): boolean =>
  // W2·25: `fest` gehört in den Vergleich — sonst sähe `tabsGleich` das
  // Anheften nicht, und die Leiste zeichnete den Reiter erst beim nächsten
  // fremden Ereignis um (`useTabs` hält an der alten Array-Identität fest).
  a.path === b.path && a.label === b.label && a.wahl === b.wahl && !!a.fest === !!b.fest;

/** ── W2·18 Punkt 2 · STRUKTURELLE GLEICHHEIT ZWEIER REITERLISTEN ───────────
 *  `ladeTabs()` baut bei JEDEM Aufruf ein neues Array aus dem `localStorage` —
 *  identischer Inhalt, neue Identität. Wer daraus React-State macht, rendert
 *  auch dann neu, wenn sich nichts geändert hat (die gemessene Kaskade beim
 *  Scrollen, s. `useTabs`). Diese Funktion sagt, ob zwei Listen dasselbe
 *  BEDEUTEN: gleiche Länge, gleiche Reihenfolge, je Eintrag gleicher Pfad
 *  (inkl. Anker), gleiches Label, gleiche Wahl — dieselben drei Felder, die
 *  `gleich` schon für den Einzeleintrag prüft (§5, eine Regel). */
export function tabsGleich(a: readonly TabEintrag[], b: readonly TabEintrag[]): boolean {
  return a === b || (a.length === b.length && a.every((x, i) => gleich(x, b[i])));
}

/** #12: Reiter umsortieren — verschiebt den gezogenen Reiter (vonPath) an die
 *  Position des Ziel-Reiters (nachPath). Identifikation über `tabSchluessel`
 *  (stabile Reiter-Identität); deterministisch, kein Zeitstempel.
 *
 *  ── D15/D16 (David 6.9.2026) · WOHIN GENAU, SAGT DER ZEIGER ────────────────
 *  «per drag and drop soll man register verschieben können … analog browser».
 *  Im Browser entscheidet die ZEIGERPOSITION über dem Ziel, ob der Reiter davor
 *  oder dahinter einrastet — darum der dritte Parameter. Er ist optional, und
 *  sein Default reproduziert die frühere, richtungsabhängige Regel BIT-GLEICH:
 *  wer nach links zieht, landet vor dem Ziel; wer nach rechts zieht, dahinter.
 *  Genau davon leben die ▲/▼-Knöpfe der Reiter-Liste (`layout/TabPanel.tsx`),
 *  die kein Zeiger-X haben — sie bleiben unangetastet (§6.3).
 *
 *  Der Zielindex wird NACH dem Herausnehmen neu bestimmt: sonst verschiebt der
 *  entnommene Reiter das Ziel um eins, und «davor» landete dahinter.
 *
 *  ── W2·25 · DIE ZONENGRENZE WIRD ABGELEHNT, NICHT KORRIGIERT ─────────────
 *  Seit dem Anheften gibt es eine Grenze in derselben flachen Ordnung. Ein
 *  Zug darüber hinweg schreibt NICHTS und meldet `false`; der Aufrufer zeigt
 *  die Sperre (die Leiste tut es schon beim Überfahren, `zugErlaubt`). Der
 *  Rückgabewert ist neu — alle Bestands-Aufrufer ignorieren ihn und verhalten
 *  sich wortgleich wie vorher (`void`-Semantik bleibt gültig).
 *  @returns true, wenn umgeordnet wurde; false bei unbekanntem Pfad, gleicher
 *           Position ODER abgelehnter Zonengrenze.
 */
export function ordneTabsUm(vonPath: string, nachPath: string, davor?: boolean): boolean {
  const naechste = zugErgebnis(ladeTabs(), vonPath, nachPath, davor);
  if (!naechste) return false;
  schreibe(naechste);
  return true;
}

/** ── W2·18 Punkt 3 · WER NACH DEM SCHLIESSEN AKTIV WIRD ────────────────────
 *  Browser-Norm (Chrome, Firefox, Safari): der RECHTE Nachbar rückt nach; gibt
 *  es keinen — der geschlossene Reiter war der letzte —, ist es der linke.
 *  Bis W2·18 war es umgekehrt (links zuerst). Der Unterschied ist nicht
 *  kosmetisch: wer eine Reihe von links nach rechts abarbeitet und jeden
 *  erledigten Reiter schliesst, wurde bei jedem ✕ an den ANFANG zurückgeworfen
 *  statt einen Schritt weitergetragen.
 *
 *  @param ordnung Die Reiter in Speicherreihenfolge.
 *  @param idx     Stelle des geschlossenen Reiters; `-1`, wenn er nicht in der
 *                 Liste steht (dann gibt es keinen Nachfolger).
 *  @returns Der Reiter, der aktiv wird, oder `undefined` — dann war es der
 *           letzte, und der Aufrufer entscheidet (die Leiste geht zur
 *           Sammlung, R14). */
export function nachfolgerReiter(ordnung: readonly TabEintrag[], idx: number): TabEintrag | undefined {
  if (idx < 0) return undefined;
  return ordnung[idx + 1] ?? ordnung[idx - 1];
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
