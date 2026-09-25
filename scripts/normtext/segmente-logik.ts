/**
 * scripts/normtext/segmente-logik.ts — reine Logik für `check:segmente` (QS-KORPUS).
 *
 * Anlass: Herz-und-Nieren-Prüfung 24.9.2026, Befund normtext-treue-11 — kein Tor
 * prüfte segmentgenaue Vollständigkeit des Bund-Normtexts gegen die amtliche
 * Fedlex-HTML. 69 amtliche Segmente in 24 Artikeln fehlten still im Leser.
 *
 * UNABHÄNGIGKEIT (§ Architektur Ziff. 3): Zerlegung per DOM (`linkedom`), KEIN
 * Import von Parse-Funktionen aus `extrahiere-fedlex.ts`/`fussnoten-extrahiere.ts`
 * — sonst teilte dieses Tor genau die blinden Flecken, die es aufdecken soll.
 *
 * NACHTRAG 25.9.2026 (Orchestrator, Architektur-Korrektur «eingefrorenes Soll»):
 * ein Tor, das nur mit /tmp-Cache prüft, ist in PR-CI und Merge-Queue wirkungslos
 * (dort liegt nie ein Cache). Enthaltensein wird darum NIE per Klartext-Suche
 * geprüft, sondern per Fingerabdruck [Länge, Doppel-Rolling-Hash] und
 * Rabin-Karp-Fensterabgleich im normalisierten Projektions-Blob — EINE Funktion
 * (`fehlendeIndizes`) für Modus B (nur committetes Soll, kein Cache: die
 * Fingerabdrücke kommen aus der committeten Soll-Datei) und Modus C (Cache da:
 * dieselben Fingerabdrücke frisch aus der HTML abgeleitet). Kein Klartext
 * amtlichen Normtexts wird dauerhaft gespeichert (§5/§7 — sonst eine zweite,
 * unbelegte Wahrheit).
 */
import { parseHTML } from 'linkedom';
import { leereZeilenStatistik, type Fingerabdruck, type ZeilenStatistik } from './segmente-soll.ts';

// Soll-/Basislinien-Logik liegt seit Runde 3 (25.9.2026) in `segmente-soll.ts`
// (§6.6); hier re-exportiert, damit Aufrufer und Tests EINE Import-Quelle behalten.
export * from './segmente-soll.ts';

// ── Normalisierung (§ Architektur Ziff. 5, so knapp wie möglich) ───────────
// Entity-Dekodierung passiert bereits beim Parsen (linkedom decodiert `&nbsp;`,
// `&amp;` usw. in echte Unicode-Zeichen) und Hochstellungs-Reduktion beim Bau
// des Segment-Texts (`blockText` unten: ein <sup> ohne Fussnoten-Link bleibt
// inline, sein Text zählt normal mit) — hier bleiben nur zwei Schritte:
//  (a) NFC — defensiv gegen Codepoint-Varianten (kombinierte vs. zerlegte
//      Akzente) zwischen den ZWEI unabhängigen Ablesepfaden (rohe HTML via
//      DOM hier, committetes JSON dort); ein no-op für bereits-NFC-Text.
//  (b) jeden Leerraum entfernen (§5: «alle Leerräume … inkl. NBSP») — JS'
//      `\s` deckt U+00A0 (NBSP) bereits ab (empirisch geprüft), keine
//      Sonderbehandlung nötig. Ganze Wörter/Ziffern/Satzzeichen bleiben
//      erhalten (§5-Vorgabe: keine Normalisierung darf sie verschlucken).
export function normalisiere(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, '');
}

// Mindestlänge nach Normalisierung, ab der ein Segment geprüft wird (§ Architektur
// Ziff. 5). Begründung: empirisch aus der Herz-und-Nieren-Referenzprüfung
// (contain.py) übernommen — unterhalb von 8 Zeichen sind Fragmente (Listenmarken,
// blosse Ziffern, Interpunktion) nicht mehr verlässlich einem echten Verlust
// zuordenbar, UND kein einziger der 69 real fehlenden Segmente im heutigen
// Korpus ist kürzer. Kurze Fragmente ungeprüft zu lassen ist die sichere
// Richtung: ein zu kurzes Segment würde ohnehin fast überall zufällig
// "gefunden", eine Prüfung darauf wäre Rauschen, keine Aussage.
export const SEGMENT_MINDESTLAENGE = 8;

// Version DIESER Segmentier-/Normalisierungslogik. Eine committete Soll-Datei,
// deren `segmenterVersion` von der hier exportierten abweicht, gilt als
// veraltet (wie ein Pin-Mismatch) — ihre Fingerabdrücke wurden mit einer
// ANDEREN Zerlegung erzeugt und sind gegen die heutige nicht mehr aussagekräftig.
//
// 2 (Gegenprüfung 25.9.2026, Nachbesserung B1–B5): Zerlegung/Ankerauflösung
// geändert (dl>dl, h1–h5, Tabellenzeilen-Fingerabdruck, disp-Anker-Abbildung,
// Artikelmenge aus der HTML statt der Projektion) — jede committete Soll-Datei
// von Version 1 ist mit der heutigen Logik nicht mehr vergleichbar.
export const SEGMENTER_VERSION = 2;

// ── Rolling-Hash / Fingerabdruck (NACHTRAG: Rabin-Karp, BigInt-frei) ───────
// Zwei unabhängige Polynom-Hashes mod 2^31−1 (Mersenne-Primzahl, gängige Wahl
// für Rolling-Hashes) mit verschiedenen Basen — kombiniert ~62 Bit Entropie,
// komfortabel über der geforderten Schwelle von ≥48 Bit. Alle Zwischenprodukte
// bleiben unter 2^53 (Number.MAX_SAFE_INTEGER): der grösste Faktor ist
// `Zeichencode(≤ 0x10FFFF) × MOD(< 2^31)` ≈ 2.4·10^15, sicher innerhalb der
// doppelt-genauen Ganzzahl-Grenze — kein BigInt nötig (Vorgabe NACHTRAG A).
const MOD = 2147483647; // 2^31 - 1
const BASIS_A = 131;
const BASIS_B = 137;

/** Fingerabdruck eines VOLLSTÄNDIG normalisierten Segments (ganze Zeichenkette als ein Fenster). */
export function fingerabdruck(normalisiertesSegment: string): Fingerabdruck {
  let a = 0;
  let b = 0;
  for (let i = 0; i < normalisiertesSegment.length; i++) {
    const c = normalisiertesSegment.charCodeAt(i);
    a = (a * BASIS_A + c) % MOD;
    b = (b * BASIS_B + c) % MOD;
  }
  return { laenge: normalisiertesSegment.length, hash: `${a.toString(36)}.${b.toString(36)}` };
}

/** Menge aller Fenster-Hashes gegebener Länge im (bereits normalisierten) Blob. */
function fensterHashes(blobNormalisiert: string, laenge: number): Set<string> {
  const n = blobNormalisiert.length;
  const treffer = new Set<string>();
  if (laenge <= 0 || laenge > n) return treffer; // Länge > Blob-Länge: kann nie enthalten sein.
  let potenzA = 1;
  let potenzB = 1;
  for (let i = 0; i < laenge - 1; i++) {
    potenzA = (potenzA * BASIS_A) % MOD;
    potenzB = (potenzB * BASIS_B) % MOD;
  }
  let a = 0;
  let b = 0;
  for (let i = 0; i < laenge; i++) {
    const c = blobNormalisiert.charCodeAt(i);
    a = (a * BASIS_A + c) % MOD;
    b = (b * BASIS_B + c) % MOD;
  }
  treffer.add(`${a.toString(36)}.${b.toString(36)}`);
  for (let i = laenge; i < n; i++) {
    const raus = blobNormalisiert.charCodeAt(i - laenge);
    const rein = blobNormalisiert.charCodeAt(i);
    // Rabin-Karp-Rollschritt: H(start+1) = (H(start) − raus·B^(L−1))·B + rein.
    // Zwischensumme vor dem Modulo kann negativ werden (JS `%` ist vorzeichen-
    // behaftet) — zweifach normalisiert, s. Unit-Test gegen naive String-Suche.
    a = ((((a - raus * potenzA) % MOD) + MOD) % MOD * BASIS_A + rein) % MOD;
    b = ((((b - raus * potenzB) % MOD) + MOD) % MOD * BASIS_B + rein) % MOD;
    treffer.add(`${a.toString(36)}.${b.toString(36)}`);
  }
  return treffer;
}

/**
 * Enthaltensein-Kern — EINE Logik für Modus B (Fingerabdrücke aus committetem
 * Soll) und Modus C (Fingerabdrücke frisch aus HTML): liefert die Indizes der
 * NICHT im Blob enthaltenen Fingerabdrücke (parallel zu `fps`), gruppiert nach
 * Länge, damit jede Blob-Länge nur einmal abgefahren wird.
 */
export function fehlendeIndizes(blobNormalisiert: string, fps: readonly Fingerabdruck[]): number[] {
  const nachLaenge = new Map<number, number[]>();
  fps.forEach((fp, i) => {
    const liste = nachLaenge.get(fp.laenge);
    if (liste) liste.push(i);
    else nachLaenge.set(fp.laenge, [i]);
  });
  const fehlt = new Set<number>(fps.map((_, i) => i));
  for (const [laenge, indizes] of nachLaenge) {
    const fenster = fensterHashes(blobNormalisiert, laenge);
    for (const i of indizes) if (fenster.has(fps[i].hash)) fehlt.delete(i);
  }
  return [...fehlt].sort((x, y) => x - y);
}

// ── HTML-Segmentierung (Modus C: frische Ableitung) ────────────────────────

export type SegmentArt = 'p' | 'dd' | 'td' | 'th' | 'h' | 'tr' | 'caption';

export interface RohSegment {
  art: SegmentArt;
  text: string; // roh (noch NICHT normalisiert) — Aufrufer normalisiert + filtert Mindestlänge.
}

/**
 * Minimaler struktureller Typ für einen linkedom-Knoten (Lint-Nachbesserung
 * 25.9.2026, Gegenprüfung-Folgeauftrag: `@typescript-eslint/no-explicit-any`
 * für die DOM-Durchreiche-Funktionen). Bewusst schmal — nur die hier
 * tatsächlich genutzten Mitglieder —, statt der vollen linkedom-Typen: volle
 * DOM-Typen koppeln dieses Tor unnötig eng an eine Parser-Bibliothek und
 * kollidieren teils mit `lib.dom.d.ts` (s. bereits `parseErlassHtml`s
 * eigener, ebenso schmaler Rückgabetyp). `childNodes` bleibt auf die
 * tatsächlich gelesene Teilmenge (nur `textContent`) begrenzt, da Text-Knoten
 * kein `querySelectorAll` etc. besitzen.
 */
interface KnotenText {
  textContent: string | null;
}
interface Knoten extends KnotenText {
  // Jeder `Knoten` in diesem Modul stammt aus `children`/`querySelectorAll`/
  // `querySelector`/`cloneNode`/`getElementById` — laut DOM-Spezifikation
  // IMMER ein Element (nie ein Text-Knoten), `tagName` daher nie undefiniert.
  // Nur `childNodes` kann Text-Knoten mischen und nutzt darum `KnotenText`.
  tagName: string;
  children: Iterable<Knoten>;
  childNodes: Iterable<KnotenText>;
  firstElementChild: Knoten | null;
  parentElement: Knoten | null;
  closest(sel: string): Knoten | null;
  cloneNode(tief: boolean): Knoten;
  querySelector(sel: string): Knoten | null;
  querySelectorAll(sel: string): Iterable<Knoten>;
  getAttribute(name: string): string | null;
  remove(): void;
}

// ── B1/B5 (Gegenprüfung 25.9.2026): eId ⇄ HTML-Anker-ID ────────────────────
//
// Die Projektion kodiert den Fedlex-Pfadtrenner "/" innerhalb einer
// disp-Untereinheit als "_" (z.B. eId "disp_u1_art_149"), die HTML-Anker-ID
// behält ihn ("disp_u1/art_149"). Ohne diese Abbildung liefert
// `getElementById(eId)` für JEDEN so aufgebauten Anker `null`: 276 von 276
// disp-Einträgen (ZGB SchlT 178, OR 83, PatG 9, SchKG 4, VZG 2 — empirisch
// gezählt, node public/normtext/bund/*.json) fielen dadurch VOR diesem Fix
// still aus dem Soll, darunter ein echter, unentdeckter Verlust: PatG Art. 149
// (Inkrafttretens-Daten — steht in HTML, AKN-XML und Prüferliste). Alle
// übrigen eIds (der weit überwiegende Teil) sind bereits ihre eigene
// Anker-ID — reine Identität.
const DISP_EID_MUSTER = /^(disp_u\d+)_(art_.+)$/;

export function ankerIdVonEid(eId: string): string {
  const treffer = eId.match(DISP_EID_MUSTER);
  return treffer ? `${treffer[1]}/${treffer[2]}` : eId;
}

/** Umkehrung von `ankerIdVonEid` — HTML-Anker-ID → Projektions-eId-Form. */
function eIdVonAnkerId(ankerId: string): string {
  return ankerId.replace('/', '_');
}

// Nur ECHTE Artikel-Anker (§ B5-Scope, deckungsgleich mit `check:vollstaendigkeit`,
// das laut Gegenprüfung ebenfalls "nur art_*" prüft): "art_…" oder eine
// disp-Untereinheit "disp_uN/art_…". Fedlex vergibt <article id="…"> AUCH für
// andere Zählungen (z.B. `annex_I/lvl_u1/lvl_I/art_1` — Artikel-Nummerierung
// INNERHALB eines mehrstufig gegliederten Anhangs, empirisch 62 Vorkommen) —
// diese sind in KEINEM public/normtext/bund/*.json-eId als eigener Top-Level-
// Eintrag modelliert (node-Sweep 25.9.2026: 0 Treffer für "/lvl_" unter allen
// Bund-eIds) und würden sonst als Falsch-Positiv "kein Projektions-Eintrag"
// (B5-FEHLER) melden, obwohl sie nie einer sein sollten.
const ARTIKEL_ANKER_MUSTER = /^(art_[^/]+|disp_u\d+\/art_[^/]+)$/;

/**
 * Alle Artikel-eIds, die laut HTML tatsächlich existieren (B5: die zu prüfende
 * Artikelmenge kommt aus den HTML-Ankern, NICHT aus der Projektion — sonst
 * bliebe ein ganzer aus der Projektion GELÖSCHTER Artikel unbemerkt, empirisch
 * P13b: ZGB Art. 1 aus Projektion UND Soll entfernt blieb in Modus B UND C
 * grün, weil beide bisher nur über `projektion.values()` iterierten). Ein
 * `Set` statt einer Liste: KKV trägt zwei physische `<article id="art_126_z">`
 * (Fedlex-Quellfehler, s. artikel-vorkommen.ts) — beide liefern dieselbe eId
 * "art_126_z"; das zweite Vorkommen hat in der Projektion den Synthese-Schlüssel
 * "art_126_z__2" (kein Attribut dieses Namens in der HTML selbst), kommt daher
 * NICHT aus dieser Funktion, sondern bleibt Sache der Projektions-Vereinigung
 * im Aufrufer (B1-Ausnahme, `keinAnkerLokalisierbar`).
 */
export function alleArtikelEids(dokument: { querySelectorAll: (sel: string) => Iterable<Knoten> }): string[] {
  const eids = new Set<string>();
  for (const el of dokument.querySelectorAll('article[id]')) {
    const ankerId = el.getAttribute('id') as string;
    if (ARTIKEL_ANKER_MUSTER.test(ankerId)) eids.add(eIdVonAnkerId(ankerId));
  }
  return [...eids];
}

// Absatznummer-Muster (Fedlex-Konvention: <sup>1</sup>, <sup>1bis</sup>, …) —
// ganze Zeichenkette muss passen (§7 CLAUDE.md: kein Teilstring-Treffer).
const ABSATZNUMMER_MUSTER =
  /^\d+(?:bis|ter|quater|quinquies|sexies|septies|octies|novies|decies)?[a-z]?\.?$/;

/** Entfernt Fussnoten-Verweismarken (<sup> MIT <a>) aus einem (bereits geklonten) Teilbaum. */
function ohneFussnotenmarken(klon: Knoten): Knoten {
  for (const sup of [...klon.querySelectorAll('sup')]) {
    if (sup.querySelector('a')) sup.remove();
  }
  return klon;
}

/**
 * Entfernt `<style>`/`<script>` aus einem (bereits geklonten) Teilbaum. Fedlex
 * bettet Signalisations-Icons als Inline-SVG in `<p class="bild">` ein
 * (`<svg><defs><style>.cls-1{fill:#…}</style></defs><path .../></svg>`) —
 * `textContent` liest den `<style>`-Inhalt wörtlich mit (DOM-Eigenheit: anders
 * als `innerText` unterscheidet `textContent` nicht zwischen sichtbarem Text
 * und Stylesheet-Text). Ohne diese Bereinigung würde jedes so eingebettete
 * Icon CSS-Quelltext als "Segment" ausgeben — ein Zerlegungs-Artefakt, kein
 * amtlicher Normtext (empirisch an SSV annex_2 gefunden).
 */
function ohneStyleUndScript(klon: Knoten): Knoten {
  for (const el of [...klon.querySelectorAll('style, script')]) el.remove();
  return klon;
}

/**
 * Text eines Blatt-Blocks (p/dd/td/th): Fussnoten-Verweismarken raus, JEDES
 * `<dt>` raus (reine Listenmarke, § Architektur Ziff. 4 — auch verschachtelt:
 * Fedlex simuliert Zellen-Einrückung in `<td>`/`<th>` mit
 * `<dl><dt><span data-message="…-TAB">[tab]</span></dt><dd>…</dd></dl>`;
 * empirisch an KRK/CEDAW scope_u1 gefunden — ohne diese Regel würde jede so
 * eingerückte Zelle das literale Wort "[tab]" ins Segment ziehen, das die
 * Projektion nie enthält: ein Zerlegungs-Artefakt, kein echter Verlust),
 * dann eine FÜHRENDE freistehende Absatznummer (`<sup>1bis</sup>` ohne Link,
 * GENAU das Absatznummer-Muster, nichts als Leerraum davor) raus — die liegt
 * im separaten `absatz`-Feld der Projektion, nicht im `text`-Feld. Ein <sup>
 * OHNE Link, das NICHT führt oder nicht dem Muster entspricht (z.B. «Absatz
 * 1<sup>bis</sup>» mitten im Satz), bleibt stehen — sein Text zählt normal mit
 * (Hochstellungs-Reduktion auf den Text, § Architektur Ziff. 5).
 */
function blockText(element: Knoten): string {
  const klon = ohneStyleUndScript(ohneFussnotenmarken(element.cloneNode(true)));
  for (const dt of [...klon.querySelectorAll('dt')]) dt.remove();
  const erstesElement = klon.firstElementChild;
  if (erstesElement && erstesElement.tagName === 'SUP') {
    let vorlauf = '';
    for (const kind of klon.childNodes) {
      if (kind === erstesElement) break;
      vorlauf += kind.textContent ?? '';
    }
    if (vorlauf.trim() === '' && ABSATZNUMMER_MUSTER.test((erstesElement.textContent ?? '').trim())) {
      erstesElement.remove();
    }
  }
  return klon.textContent ?? '';
}

/**
 * Parst eine Erlass-HTML EINMAL (linkedom). Getrennt von `segmentiereAnker`,
 * damit die CLI bei tausenden Artikeln je Erlass-Datei nicht tausendmal neu
 * parst — das Parsen ist der teure Schritt, `getElementById` je Anker billig.
 */
export function parseErlassHtml(
  html: string,
): { getElementById: (id: string) => Knoten | null; querySelectorAll: (sel: string) => Iterable<Knoten> } {
  const { document } = parseHTML(html);
  // Einziger Übertritt von linkedoms eigenen (mit `lib.dom.d.ts` kollidierenden
  // — `cloneNode()` ist dort z.B. auf `Node` statt der aufrufenden Unterklasse
  // typisiert) Typen auf den schmalen `Knoten`-Vertrag dieses Moduls. Laufzeit-
  // Verhalten unverändert (reines DOM-Objekt, keine Kopie); JEDE andere
  // Funktion hier prüft danach echt gegen `Knoten`, keine weitere `any`-Lücke.
  return document as unknown as { getElementById: (id: string) => Knoten | null; querySelectorAll: (sel: string) => Iterable<Knoten> };
}

/**
 * Zerlegt den Körper eines Artikels/Anhang-Abschnitts (per `ankerId` im
 * bereits geparsten Dokument per DOM-`id` lokalisiert) in rohe Blatt-Segmente.
 * `null`, wenn der Anker in der HTML nicht existiert — eigener Befundtyp,
 * s. `check-segmente.ts` (§ Architektur Ziff. 6: Artikel-PRÄSENZ ist nicht
 * diese Prüfung, das deckt `check:vollstaendigkeit`; hier nicht still
 * übersprungen, sondern gezählt).
 */
/**
 * Zerlegt einen Bereich (Artikelkörper ODER — rekursiv — eine einzelne
 * Tabellenzelle) in Listen- und Fliesstext-Segmente: JEDES <dd> im Bereich
 * (ohne den eigenen, ggf. verschachtelten <dl>-Inhalt — der wird über
 * dieselbe `querySelectorAll('dd')` als EIGENES Segment erfasst, egal wie
 * tief verschachtelt; <dt> nie, reine Listenmarke, § Architektur Ziff. 4),
 * danach der restliche Fliesstext (jeder <p>, JEDER Klasse — die
 * Extraktor-Klassenliste [absatz09pt, man-template-tab-utit, …] ist für
 * dieses Tor irrelevant: es prüft Enthaltensein, nicht Klassenzugehörigkeit,
 * s. Architektur-Abweichung im Bericht).
 *
 * B2 (Gegenprüfung 25.9.2026): die frühere Version ging über eine dd→dl-
 * Rekursion (nur <dl> DIREKT unter einem <dd>), das übersah ein <dl>, das
 * OHNE dazwischenliegendes <dd> direkt in einem anderen <dl> steckt
 * (`<dl><dl>…`) — 22 Listenpunkte verloren (StHG Art. 7 «Ist dieser Zinssatz
 * negativ oder null …», VVV Anhang 4, HZÜ-Formular). `querySelectorAll('dd')`
 * findet JEDES <dd> im Teilbaum unabhängig von seiner Elternkette — Fixtures
 * R2–R4/R6/R7/R12 der Gegenprüfung bestanden das direkt, kein Sonderfall mehr
 * nötig.
 *
 * Mutiert `bereich` (entfernt die verarbeiteten <dl> UND <p>), damit (a) ein
 * äusserer Scan sie nicht doppelt sieht und (b) die Restmengen-Prüfung des
 * Aufrufers nur noch UNBEKANNTEN Rest sieht — der Aufrufer übergibt darum
 * stets einen Klon.
 */
function segmentiereBereich(bereich: Knoten, segmente: RohSegment[]): void {
  for (const dd of [...bereich.querySelectorAll('dd')]) {
    const eigenerKlon = dd.cloneNode(true);
    for (const verschachtelt of [...eigenerKlon.querySelectorAll('dl')]) verschachtelt.remove();
    segmente.push({ art: 'dd', text: blockText(eigenerKlon) });
  }
  for (const dl of [...bereich.querySelectorAll('dl')]) dl.remove();
  for (const p of [...bereich.querySelectorAll('p')]) {
    segmente.push({ art: 'p', text: blockText(p) });
    p.remove();
  }
}

// B2 (Restmengen-Prüfung, Gegenprüfung 25.9.2026): nach dd/dl/p-Extraktion
// darf im Bereich kein nennenswerter Text mehr übrig sein — ein unbekannter
// Block-Typ (z.B. <ul>/<li>, <blockquote>) würde sonst wie dl>dl VOR diesem
// Fix komplett unbemerkt Text verschlucken. Schwelle wie ein Segment (§
// Architektur Ziff. 5: < 8 Zeichen sind Marken/Ziffern-Rauschen, kein
// Verlust-Risiko). Rein meldend (kein Segment, keine Fingerabdruck-Prüfung
// dagegen) — eine willkürlich zusammengeklebte Restmenge mehrerer, im
// Original NICHT benachbarter Text-Knoten ist keine verlässliche
// Enthaltensein-Prüfung gegen den Projektions-Blob (anders als ein
// tatsächliches HTML-Element).
function restmenge(bereich: Knoten): string | null {
  const roh = bereich.textContent ?? '';
  if (normalisiere(roh).length < SEGMENT_MINDESTLAENGE) return null;
  return roh.trim().replace(/\s+/g, ' ').slice(0, 80); // lesbare Vorschau (Leerraum erhalten), Schwelle bleibt normalisiert
}

// ── G1 (Runde 3): Zeilen-Fingerabdruck je Zeile, allein aus der HTML ───────
//
// Eine Zeile verkettet (B4) macht die Löschung EINER zu kurzen Zelle sichtbar
// (Tarifbetrag «0.77», «190.–», «4,00»). Entscheid je ZEILE:
//  (1) KOPFZEILE (in <thead> oder nur <th>-Zellen) ⇒ kein Zeilen-Fingerabdruck.
//      Die Projektion legt Köpfe spaltenweise ab (`mehrspaltig.kopf`, bei
//      `spalten[]` mit `typ` zwischen den Titeln; RDV annex_3: dreizeiliger
//      Kopf spaltenweise zusammengefasst) — eine Kopfzeilen-Verkettung wäre
//      ein Tor-Artefakt (G2). Kopfzellen ≥ 8 Zeichen bleiben über die
//      Zellregel geprüft.
//  (2) LISTENMARKEN: jedes <dt> TRENNT die Zeile in Stücke (statt die Zeile
//      ganz auszunehmen). Die Projektion führt eine Marke teils literal im
//      Zelltext («a. Länge»), teils gar nicht — ein Stück OHNE Marke ist in
//      beiden Fällen zusammenhängend im Blob, eine Verkettung ÜBER die Marke
//      hinweg nicht (GSCHV annex_2 «…N – unter 10 °C», KRK-Sternchen-Legende).
//  (3) Ein Stück wird gefingerprintet, wenn es Text aus ≥ 2 Zellen trägt
//      (`ZEILE_MINDESTZELLEN`) — unabhängig von der Zeichenzahl (VVEA Anhang 7
//      «Arsen / 2» = 6 Zeichen). Begründung der Mindestlänge: die Information
//      des Zeilen-Fingerabdrucks ist die NACHBARSCHAFT zweier Zellen; ein
//      Stück aus EINER Zelle ist genau das Zellsegment (Zellregel, ≥ 8). Ein
//      kurzes Stück kann höchstens zufällig anderswo im Artikel-Blob stehen —
//      das schwächt die Prüfung (falsch grün), macht sie aber nie falsch rot.
// Zeilen ohne Fingerabdruck werden je Grund gezählt (`ZeilenStatistik`) und in
// jedem Lauf ausgegeben.
export const ZEILE_MINDESTZELLEN = 2;

// Platzhalter für eine Listenmarke im Zeilentext — NUL kommt in geparster
// HTML nicht vor (der Parser ersetzt es durch U+FFFD).
const MARKEN_TRENNER = '\u0000';

function zellTextMitMarken(zelle: Knoten): string {
  const klon = ohneStyleUndScript(ohneFussnotenmarken(zelle.cloneNode(true)));
  for (const dt of [...klon.querySelectorAll('dt')]) dt.textContent = MARKEN_TRENNER;
  return klon.textContent ?? '';
}

// Kopfzeile nach dem AMTLICHEN Markup (Fedlex-Klassen, nicht Extraktor-Code):
// <thead>; oder jede nicht-leere Zelle ist <th> ohne Daten-Klasse
// (`man-template-tab-krpr`/`-utit` = Tabellenkörper, z.B. LRV Anhang 3,
// VTS Anhang 9); oder jede nicht-leere Zelle trägt `man-template-tab-kpf`
// (Kopf als <td>, z.B. RDV annex_3, LSV-Anhänge, FZA annex_III).
function hatKlasse(zelle: Knoten, muster: RegExp): boolean {
  if (muster.test(zelle.getAttribute('class') ?? '')) return true;
  for (const el of zelle.querySelectorAll('[class]')) if (muster.test(el.getAttribute('class') ?? '')) return true;
  return false;
}

function istKopfzeile(zeile: Knoten, zellen: Knoten[]): boolean {
  if (zeile.parentElement?.tagName === 'THEAD') return true;
  const nichtLeer = zellen.filter((z) => normalisiere(z.textContent ?? '').length > 0);
  if (nichtLeer.length === 0) return false;
  if (nichtLeer.every((z) => z.tagName === 'TH' && !hatKlasse(z, /man-template-tab-(?:krpr|utit)/))) return true;
  return nichtLeer.every((z) => hatKlasse(z, /man-template-tab-kpf/));
}

function zeilenSegmente(tabelle: Knoten, segmente: RohSegment[], statistik: ZeilenStatistik): void {
  statistik.tabellen++;
  let zeilenMitFp = 0;
  const ohneFp = (zellen: Knoten[]): void => {
    const laengste = Math.max(0, ...zellen.map((z) => normalisiere(zellTextMitMarken(z)).length));
    if (laengste > 0 && laengste < SEGMENT_MINDESTLAENGE) statistik.ungeschuetzt++;
  };
  for (const zeile of [...tabelle.querySelectorAll('tr')]) {
    if (zeile.closest('table') !== tabelle) continue; // Zeile einer verschachtelten Tabelle: dort gezählt
    const zellen = [...zeile.children].filter((k) => k.tagName === 'TD' || k.tagName === 'TH');
    if (zellen.length === 0) continue;
    statistik.zeilen++;
    if (istKopfzeile(zeile, zellen)) {
      statistik.ohne.kopf++;
      ohneFp(zellen);
      continue;
    }
    const stuecke: Array<{ teile: string[]; zellen: number }> = [{ teile: [], zellen: 0 }];
    let nichtLeer = 0;
    let bildzelle = false;
    for (const zelle of zellen) {
      // (4) BILDZELLE (<img>/<svg>, Signaltafeln SSV annex_2): die Projektion
      // legt sie als `bildKacheln` ab — Bild-Metadaten (datei/alt/sha) stehen
      // im Blob ZWISCHEN den Zellen. Die Bildzelle wird darum wie eine Marke
      // isoliert (eigenes Stück davor und danach), ihr Text bleibt zellweise geprüft.
      const mitBild = zelle.querySelector('img, svg') !== null;
      if (mitBild) {
        bildzelle = true;
        stuecke.push({ teile: [], zellen: 0 });
      }
      const teile = zellTextMitMarken(zelle).split(MARKEN_TRENNER);
      if (normalisiere(teile.join('')).length > 0) nichtLeer++;
      teile.forEach((teil, i) => {
        if (i > 0) stuecke.push({ teile: [], zellen: 0 });
        if (normalisiere(teil).length === 0) return;
        const aktuell = stuecke[stuecke.length - 1];
        aktuell.teile.push(teil.trim());
        aktuell.zellen++;
      });
      if (mitBild) stuecke.push({ teile: [], zellen: 0 });
    }
    const mehrzellig = stuecke.filter((s) => s.zellen >= ZEILE_MINDESTZELLEN);
    if (mehrzellig.length > 0) {
      statistik.mitFingerabdruck++;
      zeilenMitFp++;
      for (const s of mehrzellig) segmente.push({ art: 'tr', text: s.teile.join(' ') });
      continue;
    }
    if (nichtLeer < ZEILE_MINDESTZELLEN) statistik.ohne.einzelzelle++;
    else if (bildzelle) statistik.ohne.bild++;
    else statistik.ohne.marken++;
    ohneFp(zellen);
  }
  if (zeilenMitFp === 0) statistik.tabellenOhneZeilenFp++;
}

/**
 * @param restmeldungen optional: wird — falls übergeben — um eine Meldung
 *   ergänzt, wenn nach der Zerlegung nennenswerter unklassifizierter Text
 *   übrig bleibt (B2-Restmengen-Prüfung). `undefined` (Default, Tests/Fixtures
 *   ohne Interesse daran) macht KEINE Restmengen-Prüfung — reine Performance/
 *   Kompatibilität, kein Verhaltensunterschied an den Segmenten selbst.
 * @param statistik optional (G1): wird um Tabellen/Zeilen und die Zeilen ohne
 *   Zeilen-Fingerabdruck je Grund hochgezählt.
 */
export function segmentiereAnker(
  dokument: { getElementById: (id: string) => Knoten | null },
  ankerId: string,
  restmeldungen?: string[],
  statistik: ZeilenStatistik = leereZeilenStatistik(),
): RohSegment[] | null {
  const wurzel = dokument.getElementById(ankerId);
  if (!wurzel) return null;
  const klon = wurzel.cloneNode(true);

  // Fussnoten-Apparat und die Artikel-Kopfzeile (Nummer + Sachüberschrift,
  // § Architektur Ziff. 4 — liegen in anderen Projektionsfeldern) nie scannen.
  for (const raus of [...klon.querySelectorAll('div.footnotes'), ...klon.querySelectorAll('h6')]) {
    raus.remove();
  }

  // B3 (Gegenprüfung 25.9.2026): die EIGENE Überschrift EINES NICHT-Artikel-
  // Ankers (Anhänge nutzen h1 statt h6 — empirisch an VTS annex_10 geprüft:
  // <section id="annex_10"><h1>…Anhang 10…</h1>…, derselbe Aufbau wie ein
  // Artikel mit seinem h6) ist stets das ERSTE Element-Kind der Anker-Wurzel;
  // ihr Text liegt in `artikelLabel`, einem anderen Projektionsfeld — sonst
  // ein Tor-Artefakt. Ein Zwischentitel weiter unten im Baum ist NIE das
  // erste Kind der Wurzel und bleibt darum erhalten (s. u.). Für Artikel
  // selbst ein No-op: ihre eigene Überschrift ist h6, oben bereits entfernt.
  const erstesKind = klon.firstElementChild;
  if (erstesKind && /^H[1-5]$/.test(erstesKind.tagName)) erstesKind.remove();

  const segmente: RohSegment[] = [];

  // B3: Zwischentitel h1–h5 IRGENDWO im Anker (2'010 in Anhängen + 406
  // Eigen-Titel weiterer Nicht-Artikel-Anker laut Gegenprüfung — die eigene
  // Überschrift DIESES Ankers ist bereits oben entfernt) waren zuvor gar kein
  // Segmenttyp und damit ungeprüft, undokumentiert. Vor der Tabellen-/dl-
  // Verarbeitung eingesammelt und entfernt (Überschriften stehen in diesem
  // Korpus nie in einer Tabellenzelle oder Liste — empirisch keine
  // Gegenbeispiele), damit die Restmengen-Prüfung sie nicht nochmals sieht.
  for (const h of [...klon.querySelectorAll('h1, h2, h3, h4, h5')]) {
    segmente.push({ art: 'h', text: blockText(h) });
    h.remove();
  }

  // Tabellen ZELLWEISE (§ Architektur Ziff. 4 — der Referenz-Prüfer tolerierte
  // abweichende Zeilen-Zerlegung; zellweise ist die feinere, dem JSON-Schema
  // `mehrspaltig.zeilen[i][j]` entsprechende Granularität): jede Zelle ist
  // selbst ein Mini-Bereich — Fedlex bettet in Zellen teils EIGENE <p>+<dl>-
  // Struktur ein (empirisch an GSCHV annex_2 gefunden: `<td><p>Bei
  // Temperaturen:</p><dl><dt>–</dt><dd>über 10 °C: …</dd><dt>–</dt>
  // <dd>unter 10 °C: …</dd></dl></td>` — als EIN Blob gelesen verklebte das
  // zu "…Nunter 10…", ein Zerlegungs-Artefakt). Enthält die Zelle KEINE
  // solche innere Struktur, bleibt sie EIN Segment (Fallback: `blockText`).
  //
  // ZUSÄTZLICH Zeilen-Fingerabdrücke (B4; G1 Runde 3 — Entscheid je ZEILE,
  // allein aus der HTML, s. `zeilenSegmente`). Die frühere Fassung schaltete
  // sie je Projektions-EINTRAG ab, sobald dort irgendwo `items`/`spalten`
  // vorkam — 62 % aller Zeilen ohne Schutz (GP 2, G1), und das Soll hing von
  // der Projektion ab (G6). `<caption>` (G5) ist ein eigenes Segment, statt mit
  // der Tabelle verworfen zu werden (heute 0 im Korpus).
  for (const tabelle of [...klon.querySelectorAll('table')]) {
    zeilenSegmente(tabelle, segmente, statistik);
    for (const beschriftung of [...tabelle.querySelectorAll('caption')]) {
      segmente.push({ art: 'caption', text: blockText(beschriftung) });
      beschriftung.remove();
    }
    for (const zelle of [...tabelle.querySelectorAll('td, th')]) {
      const innereSegmente: RohSegment[] = [];
      segmentiereBereich(zelle.cloneNode(true), innereSegmente);
      if (innereSegmente.length > 0) {
        segmente.push(...innereSegmente);
      } else {
        const art: SegmentArt = zelle.tagName.toLowerCase() === 'th' ? 'th' : 'td';
        segmente.push({ art, text: blockText(zelle) });
      }
    }
    tabelle.remove();
  }

  segmentiereBereich(klon, segmente);

  if (restmeldungen) {
    const rest = restmenge(klon);
    if (rest) restmeldungen.push(`${ankerId}: "${rest}"`);
  }

  return segmente;
}

/** Komfort-Wrapper (Fixtures/Tests): parst UND zerlegt in einem Schritt. Die
 * CLI nutzt `parseErlassHtml`+`segmentiereAnker` getrennt (Performance). */
export function segmentiereArtikel(html: string, ankerId: string, restmeldungen?: string[]): RohSegment[] | null {
  return segmentiereAnker(parseErlassHtml(html), ankerId, restmeldungen);
}

// ── Projektions-Blob (aus dem committeten public/normtext/bund/<KEY>.json) ──

// Generisch statt feldweise aufgezählt (§ Architektur Ziff. 6: «prüfe das
// tatsächliche Schema der JSON, nimm nichts an») — sammelt JEDEN String-Leaf
// rekursiv unter `bloecke` (text, items[].text/marke, mehrspaltig.kopf/
// spalten[].titel/zeilen[][], bild.alt, bildKacheln[].bild.alt/name/nummer …).
// Nicht-String-Werte (Zahlen, bool, null) werden strukturell übersprungen —
// das schliesst insbesondere `bloecke[].titel` (NUMERISCHE Gliederungstiefe,
// z.B. 2) automatisch aus, OHNE den Schlüsselnamen "titel" zu sperren (der
// bedeutet bei `mehrspaltig.spalten[].titel` etwas anderes: dort ein ECHTER
// String-Spaltenkopf, z.B. "EU"/"Schweiz" — eine Schlüsselnamen-Sperre hätte
// diesen fälschlich mitgesperrt; empirisch an MEPV/SSV geprüft).
function sammleStrings(wert: unknown, ziel: string[]): void {
  if (typeof wert === 'string') {
    ziel.push(wert);
    return;
  }
  if (Array.isArray(wert)) {
    for (const v of wert) sammleStrings(v, ziel);
    return;
  }
  if (wert && typeof wert === 'object') {
    for (const v of Object.values(wert)) sammleStrings(v, ziel);
  }
}

export interface ProjektionsEintrag {
  id: string;
  bloecke: unknown;
  grundlage?: unknown;
  [weitere: string]: unknown;
}

/**
 * Normalisierter Such-Blob eines Projektions-Eintrags. Enthält zusätzlich das
 * Feld `grundlage` (Kurzverweis unter der Randtitel-Klasse "referenz", z.B.
 * VOEB "(Art. 6 Abs. 2 und 3 sowie 52 Abs. 2 BöB)") — OHNE dieses Feld wäre
 * JEDES referenz-Vorkommen ein Tor-Artefakt gewesen (empirisch an VOEB
 * geprüft: 19 Artikel tragen `grundlage`, keines davon in `bloecke`).
 */
export function projektionsBlob(eintrag: Pick<ProjektionsEintrag, 'bloecke' | 'grundlage'>): string {
  const teile: string[] = [];
  sammleStrings(eintrag.bloecke, teile);
  if (typeof eintrag.grundlage === 'string') teile.push(eintrag.grundlage);
  return normalisiere(teile.join(''));
}


/**
 * Rohsegmente → Fingerabdrücke mit der Mindestlängen-Regel je Art: Zeilen-
 * stücke (`tr`) tragen ihre eigene Untergrenze bereits (≥ 2 Zellen, s.
 * `ZEILE_MINDESTZELLEN`), alle übrigen Segmente `SEGMENT_MINDESTLAENGE`.
 */
export function segmenteZuFingerabdruecken(roh: readonly RohSegment[]): Array<{ roh: RohSegment; fp: Fingerabdruck }> {
  const aus: Array<{ roh: RohSegment; fp: Fingerabdruck }> = [];
  for (const r of roh) {
    const n = normalisiere(r.text);
    if (n.length === 0 || (r.art !== 'tr' && n.length < SEGMENT_MINDESTLAENGE)) continue;
    aus.push({ roh: r, fp: fingerabdruck(n) });
  }
  return aus;
}
