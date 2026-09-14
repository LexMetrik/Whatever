import { pfadTeil } from '../verlaufLabel';
import type { TabEintrag } from './typen';
import { tabSchluessel } from './typen';
import { merkeGeschlossen, ladeGeschlossene, schreibeGeschlossene } from './verlauf';

const KEY = 'lexmetrik-tabs';
const MAX = 50;

/** Event, mit dem Schreiber (TabTracker, Schliess-Buttons) die Leser
 *  (useTabs → ReiterUebersicht/TabPanel) im selben Browser-Tab synchron halten. */
export const TABS_EVENT = 'lexmetrik:tabs';

/** ── R14 (7.9.2026) · DER GESPEICHERTE «LEERE REITER» WIRD ZUR SAMMLUNG ────
 *  Bis R14 trug der eine «+»-Reiter das Feld `leer: true` (D19). Wer die App
 *  mit einem solchen Eintrag im Speicher neu lädt, bekommt jetzt einen
 *  gewöhnlichen Reiter auf «/» — dieselbe Adresse, dieselbe Position, nur ohne
 *  den Sonderfall. Rein deterministisch (§2), kein Zeitstempel: ein
 *  Feld-Filter, sonst nichts. Fällt dabei ein zweiter Eintrag mit derselben
 *  Reiter-Identität an (eine bereits offene Sammlung neben dem leeren Reiter,
 *  über Pane/Ctrl-Klick möglich), bleibt der ERSTE stehen — die Reihenfolge
 *  ist die des Speichers, und zwei Reiter mit identischem Schlüssel wären für
 *  jede Aktion mehrdeutig (`tabSchluessel` ist die Identität, §5). */
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

function schreibe(tabs: TabEintrag[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(tabs)); } catch { /* privater Modus — Reiter sind Komfort */ }
  try { window.dispatchEvent(new Event(TABS_EVENT)); } catch { /* SSR/kein window */ }
}

/** Anker der ADRESSE («#art-…») oder undefined. Quelle des `wahl`-Feldes. */
function hashVon(path: string): string | undefined {
  const i = path.indexOf('#');
  return i === -1 ? undefined : path.slice(i);
}

/** Eintrag aus einer Adresse bauen — mit `alt` als Vorzustand desselben Reiters
 *  (Label, Lesestellung und gewählter Anker überleben ein hash-/labelloses
 *  Update). EINE Stelle für diese Regel: `merkeTab` und `ersetzeTab` bauen
 *  denselben Eintrag, sonst driften «anhängen» und «ersetzen» auseinander. */
function eintragAus(path: string, label?: string, alt?: TabEintrag): TabEintrag {
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

const gleich = (a: TabEintrag, b: TabEintrag): boolean =>
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
  const weg: Array<{ eintrag: TabEintrag; index: number }> = [];
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
