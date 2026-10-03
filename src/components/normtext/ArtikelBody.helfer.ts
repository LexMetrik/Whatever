import type { NormSnapshot } from '../../lib/normtext/typen';
import type { BildDaten, BildKachel } from './BildElemente';

// Bild-/Kachel-Felder eines Blocks (bild/bildKacheln) sind neu im Snapshot-Daten-
// format; die Render-Schicht liest sie über diese lokale Erweiterung des
// Snapshot-Block-Typs (wie TabSpalte — kein Import aus scripts/, §3). Additiv:
// bestehende Blöcke ohne die Felder rendern unverändert.
export type BildBlock = NormSnapshot['bloecke'][number] & { bild?: BildDaten; bildKacheln?: BildKachel[] };

/** Zitier-Kontext der Lesesicht: macht Absatz-/lit.-/Ziff.-Marken klickbar
 *  («Art. X Abs. Y lit. z ERLASS» kopieren). Im Popover undefiniert → unverändert.
 *  B-6 (QS-BASIS): `fassung`/`permalinkBasis` (optional) rüsten die inline-Kopie
 *  mit dem Stand-Ausweis (§7 a–d) nach; fehlen sie (z. B. Popover), bleibt die
 *  Marke bei der reinen Fundstelle — byte-gleich zu vorher. */
export interface ZitierKontext {
  artikelLabel: string;
  kuerzel: string;
  /** Konsolidierungs-/Fassungsdatum ISO des Erlasses (Stand-Ausweis). */
  fassung?: string;
  /** Permalink-Pfad inkl. #anker OHNE origin (origin kommt zur Klick-Zeit). */
  permalinkBasis?: string;
}

// M6-D: leere Self-Ziel-Map + No-op-Sprung für den Fremdgesetz-Chapeau-Kontext —
// dort gibt es kein «eigenes» Sprungziel; NormText routet bare «Art. N» allein über
// `fremdKuerzel` auf das Fremdgesetz (NormChip). Modul-konstant (keine Re-Allokation).
export const FREMD_LEER: Map<string, string> = new Map();
export const NOOP = (): void => {};

// ─── QS-UI · MARKEN-PRÄFIX (Gegenprüfung PR #658, 4.9.2026) ─────────────────
// Fedlex setzt ZWEI verschiedene Dinge in dieselbe <dl><dt>-Struktur, und die
// Extraktion legt beide als `items[].marke` ab (extrahiere-fedlex.ts §Aufzählung):
//   (1) ECHTE Aufzählungen — «<dt>a. </dt>», «<dt>1. </dt>» → lit. a / Ziff. 1.
//   (2) LABEL-LISTEN (Legenden, Kategorien-Tafeln) — «<dt>A: </dt>»,
//       «<dt>BE: </dt>», «<dt>BAS </dt>». Das sind KEINE Aufzählungspositionen,
//       sondern definierte Begriffe: VZV Art. 3 zählt die Ausweiskategorien
//       A/B/BE/C1E/M auf, AsylV 2 Art. 23 die Formelgrössen BAS/BVA/EQCH.
// Gemessen am Preview von origin/main (4./5.9.2026, VZV Art. 3): sichtbar «BE.»,
// kopiertes Zitat «Art. 3 Abs. 1 lit. BE VZV». Beides ist fachlich falsch —
// «lit. BE» gibt es in der VZV nicht, und der Punkt ersetzt den amtlichen
// Doppelpunkt des <dt>. Die Marke selbst («BE») bleibt unverändert; geändert
// wird nur ihre BESCHRIFTUNG (§3: reine Darstellung, kein Zitat-Wortlaut).
//
// UNTERSCHEIDUNG (deterministisch, §2): der amtliche Trenner («a. » vs. «A: »)
// überlebt die Extraktion nicht — die Darstellungsschicht unterscheidet daher
// an der Marke selbst. Schweizer Aufzählungsmarken sind KLEINgeschrieben
// (a, abis, cquinquies) oder ziffernbeginnend (1, 1bis, 2.3); eine Marke, die
// mit einem GROSSbuchstaben beginnt, ist im Korpus ausnahmslos ein Label.
// Gemessen über den ganzen Korpus (public/normtext/**, 73 689 Item-Marken):
// 550 Vorkommen (0.75 %) beginnen gross — VZV-Kategorien, AsylV-Formelgrössen,
// AVO-Versicherungszweige (A1/B1/C1), VTS-«Klasse 3», LSV-Formelsymbole.
// Marken mit anderem Anfang (Symbole «+», «./», «– I») bleiben bewusst
// unangetastet: dort ist die Extraktion selbst mangelhaft, das ist ein eigener
// Befund und keine Beschriftungsfrage.
export type MarkenArt = 'strich' | 'ziff' | 'lit' | 'label';

// ─── AMTLICHER TRENNER STATT HEURISTIK (#679, 12.9.2026) ────────────────────
// Seit dem Extraktions-Fix führt der Fedlex-Snapshot den amtlichen Trenner
// hinter der <dt>-Marke als `items[].trenner` mit (extrahiere-fedlex.ts
// §`trenner`). Wo er vorliegt, wird NICHT mehr geraten:
//   ':'  → LABEL. Fedlex trennt Labels ausnahmslos mit Doppelpunkt; das
//          entscheidet AUCH die kleingeschriebenen Labels, an denen die
//          Heuristik scheiterte («für Witwen und Witwer:», UVG Art. 31 —
//          sie las sie als «lit. für Witwen und Witwer»). 87 Items im Bund-
//          Korpus (VZV 31, AsylV 3 17, VBB 16, VTS 13, UVG 4, ZEMIS-V 4, VKKG 2).
//   ')'   → Ordinalmarke mit Klammer (1447 Items, v.a. Staatsverträge «a)»).
//          Die Anzeige zeigt jetzt «a)» statt des erfundenen «a.».
// '' / '.' → KEINE Übersteuerung, weiterhin Heuristik. Begründung gemessen
//          (gepinnter Cache, 12.9.2026): unter den 30 '.'-Items stehen neben
//          Bereichsmarken («d. und e.», «h.–j.») auch echte LABELS mit Punkt
//          («EAZW + erm. St.» ZStV-Anhang, «B. 1.» GFK Art. 1) — der Punkt
//          allein trägt die Unterscheidung also nicht. Die 2852 Items ohne
//          Trenner sind Formelgrössen/Legendenschlüssel («BAS», «Leq,i») und
//          Gedankenstriche, für die die Marken-Heuristik richtig entscheidet.
//          Für die ANZEIGE ist auch '' und '.' verbindlich: dort wird der
//          amtliche Trenner verbatim gesetzt, nie einer erfunden.
// FEHLT das Feld ganz (Kanton-Snapshots, PDF-/HTM-Adapter), bleibt alles beim
// Verhalten von PR #658 — der Fallback ist bewusst erhalten, kein Zweitpfad
// auf Verdacht (§Gegengewicht).

/** Art einer Item-Marke — EINE Stelle (§5) für Präfix und Anzeige.
 *  `trenner` = amtlicher <dt>-Trenner des Snapshots, falls mitgeführt. */
export function markenArt(marke: string, trenner?: string): MarkenArt {
  const m = marke.trim();
  if (/^[–—-]$/.test(m)) return 'strich';
  if (trenner === ':') return 'label';
  if (trenner === ')') return /^\d/.test(m) ? 'ziff' : 'lit';
  if (/^\d/.test(m)) return 'ziff';
  if (/^\p{Lu}/u.test(m)) return 'label';
  return 'lit';
}

/** lit. (Buchstaben, Bund) vs. Ziff. (Zahlen, Kanton) anhand der Marke.
 *  Label-Marken tragen KEIN Präfix (leerer String) — s. Block oben. */
export function litZiff(marke: string, trenner?: string): string {
  const art = markenArt(marke, trenner);
  if (art === 'label') return '';
  return art === 'ziff' ? 'Ziff.' : 'lit.';
}

/** Zitat-Segment einer Marke («lit. a», «Ziff. 1», Label: nur «BE»).
 *  Der Nicht-Label-Zweig ist byte-gleich zum bisherigen `${litZiff(m)} ${m}`. */
export function markenZitat(marke: string, trenner?: string): string {
  const p = litZiff(marke, trenner);
  return p === '' ? marke.trim() : `${p} ${marke}`;
}

/** Sichtbare Beschriftung der Marken-Spalte. Liegt der AMTLICHE Trenner vor,
 *  wird er verbatim gesetzt («a)», «BE:», «BAS» ohne Zusatz) — nie einer
 *  erfunden. Ohne Trenner-Feld wie bisher: Gedankenstrich ohne Punkt,
 *  Aufzählungsmarke mit «.», Label-Marke mit «:»; trägt das Label schon ein
 *  Satzzeichen, wird keines verdoppelt. */
export function markenAnzeige(marke: string, trenner?: string): string {
  // Marke-lose Haupttext-Zeile (`marke: ''`, W2·27-BUND-FERTIG 3.10.2026): nichts anzeigen — KEIN erfundenes «.».
  if (marke === '') return '';
  const art = markenArt(marke, trenner);
  if (art === 'strich') return '–';
  if (trenner !== undefined) return `${marke.trimEnd()}${trenner}`;
  // W2·17 E-D2-B02: endet die Marke schon auf ein Satzzeichen (Phrasen-Marke
  // «1. Légalisation de signature:» aus Tabellenzeilen-Items, «a)»), wird keines
  // angehängt — «signature:.» war ein erfundenes Zeichen (§1).
  const m = marke.trimEnd();
  if (/[:.;,)]$/.test(m)) return m;
  return art !== 'label' ? `${marke}.` : `${m}:`;
}

/** Verschachtelungsstufe je Item. PRIMÄR aus der EXPLIZITEN `tiefe` des
 *  Snapshots (M6, §1): liefert Fedlex die Stufe mit, wird sie NICHT mehr aus
 *  dem Markentyp geraten — das Raten erzeugte falsche Zitate, wenn die
 *  Reihenfolge umgekehrt ist (Ziff. → lit. statt lit. → Ziff.).
 *  FALLBACK-Heuristik nur für Daten OHNE tiefe (Kanton-Snapshots, noch nicht
 *  re-segnete Bund-Erlasse): Bst (a,b,c) = Stufe 0; Ziff (1,2,3) NACH einem
 *  Bst = Stufe 1, sonst 0; Gedankenstrich = eine Stufe tiefer als das
 *  vorausgehende Item. EINE Stelle (§5) — genutzt für die block-lokale
 *  Darstellung UND die blockübergreifende Fortsetzungs-Kette der Bild-Blöcke. */
export function stufenFuer(items: Array<{ marke: string; tiefe?: number }>): number[] {
  const hatTiefe = items.some((it) => typeof it.tiefe === 'number');
  if (hatTiefe) return items.map((it) => it.tiefe ?? 0);
  // `leer` = marke-lose Zeile (W2·27-BUND-FERTIG 3.10.2026): trägt keine Ebene aus ihrer Marke — sie steht auf Stufe 0
  // und verändert weder `sahLit` noch die Strich-Kette noch die `erste`-Erkennung (sonst kippte «'' 1. 2.» auf Stufe 1).
  const typ = (m: string) => m === '' ? 'leer' : /^[–—-]$/.test(m.trim()) ? 'strich' : /^\d/.test(m.trim()) ? 'ziff' : 'lit';
  const arten = items.map((it) => typ(it.marke));
  // W2·17 E-D2-B01: kantonale Listen «1. a. b. c. 2. 3.» stellen die lit. UNTER
  // die Ziff. Erkennbar daran, dass die erste Nicht-Strich-Marke eine Ziffer ist
  // UND später eine lit. auf eine Ziff. folgt (Ziff.→lit.-Übergang). Dann ist die
  // Ziff. die äussere Stufe; die Bund-Reihenfolge «a. 1. 2. b.» (lit. zuerst)
  // bleibt unverändert. Ohne diese Umkehr stand Ziff. 2 ff. als Kind der letzten
  // lit. — und der Zitierknopf lieferte «Art. 1 Abs. 1 lit. c Ziff. 2».
  const erste = arten.find((a) => a !== 'strich' && a !== 'leer');
  // «Echte» lit. = Kleinbuchstaben-Marke («a», «abis», «a)»); Phrasen-, Symbol-
  // und Leer-Marken («[tab]», «½‰», «Somme du gage:») lösen die Umkehr nicht aus.
  const echteLit = (i: number) => arten[i] === 'lit' && /^\p{Ll}+[).]?$/u.test(items[i].marke.trim());
  const ziffAussen = erste === 'ziff' && arten.some((_, i) => echteLit(i) && arten.slice(0, i).includes('ziff'));
  const stufen: number[] = [];
  let sahLit = false, letzteNichtStrich = 0;
  for (const t of arten) {
    let lv: number;
    if (t === 'leer') lv = 0;
    else if (t === 'strich') lv = letzteNichtStrich + 1;
    else if (ziffAussen) { lv = t === 'ziff' ? 0 : 1; letzteNichtStrich = lv; }
    else if (t === 'ziff') { lv = sahLit ? 1 : 0; letzteNichtStrich = lv; }
    else { lv = 0; sahLit = true; letzteNichtStrich = 0; }
    stufen.push(lv);
  }
  return stufen;
}

/** Stand-Ausweis-Basis (B-6): dieselbe Fassung + Permalink-Basis für alle Marken
 *  eines Artikels; der Abruf-Tag und der origin kommen zur Klick-Zeit dazu. */
export interface AusweisBasis { fassung?: string; permalinkBasis: string }

// FN-5: numerischer Nr-Vergleich («95» < «95a» < «96») für die stabile Reihung
// der End-Marker, wenn Rückfall-Kandidaten mit bestehenden zusammentreffen —
// gleiche Ordnung wie die fussAnzeige-Sortierung im ArtikelLeser (A43).
export function vglFnNr(a: string, b: string): number {
  const key = (nr: string): [number, string] => {
    const m = /^(\d+)([a-z]*)$/i.exec(nr.trim());
    return m ? [parseInt(m[1], 10), m[2].toLowerCase()] : [Number.POSITIVE_INFINITY, nr];
  };
  const ka = key(a), kb = key(b);
  return ka[0] - kb[0] || ka[1].localeCompare(kb[1]);
}

/** Zitat-Segment der Ziffer-Ebene («Art. 197 Ziff. 9 Abs. 1 BV»): ohne `ziffer` leer = byte-gleich. */
export const zifferTeil = (b: { ziffer?: string }): string => (b.ziffer != null ? ` Ziff. ${b.ziffer}` : '');

type ZitatItem = NonNullable<NormSnapshot['bloecke'][number]['items']>[number];

/** Zitat-Segmente eines Items («lit. a», «Ziff. 3.1 lit. a»): nächster Vorfahre je
 *  flacherer Stufe, rückwärts über die Kette. EINE Stelle (§5) für den Zitierknopf
 *  der Item-Zeile (vormals inline in ArtikelBody.tsx, Wortlaut der Logik unverändert).
 *  Mit `vorKette` (Items der unterbrochenen Liste aus Vorgänger-Blöcken: Bild-Block-
 *  Fortsetzung, Anhang-Zwischennotiz) läuft die Kette über die VERSCHMOLZENE Liste;
 *  ohne bleibt der Pfad byte-identisch block-lokal (`stufen` = stufenFuer(items)). */
export function itemZitatSegmente(
  items: ZitatItem[],
  stufen: number[],
  j: number,
  vorKette?: ZitatItem[],
): string[] {
  const mitVor = vorKette != null && vorKette.length > 0;
  const kette = mitVor ? [...vorKette, ...items.slice(0, j + 1)] : items.slice(0, j + 1);
  const kStufen = mitVor ? stufenFuer(kette) : stufen;
  const seg: string[] = [];
  let lvl = kStufen[kette.length - 1];
  for (let k = kette.length - 1; k >= 0 && lvl >= 0; k--) {
    // Marke-lose Zeile (`marke: ''`) trägt kein Zitat-Segment und ist nie Eltern-Glied einer Kette.
    if (kStufen[k] === lvl && kette[k].marke !== '' && !/^[–—-]$/.test(kette[k].marke.trim())) {
      // QS-UI: Label-Marken ohne «lit.»-Präfix (markenZitat) — «lit. BE» ist in der
      // VZV kein Zitat, die Kategorie heisst schlicht «BE».
      seg.unshift(markenZitat(kette[k].marke, kette[k].trenner));
      lvl--;
    }
  }
  return seg;
}

type ListenBlock = NormSnapshot['bloecke'][number] & { bild?: unknown; bildKacheln?: unknown[] };

// Block, der die Item-Liste eines Anhangs NICHT unterbricht: marke-lose Zwischen-Notiz
// (nur Text) oder Items-Block. Absatz-, Titel-, Tabellen- und Bild-Blöcke sind eine Grenze.
const gehoertZurListe = (b: ListenBlock): boolean =>
  b.titel === undefined && b.absatz == null && b.bild == null
  && !(b.bildKacheln != null && b.bildKacheln.length > 0)
  && b.mehrspaltig == null && !(b.tabelle != null && b.tabelle.length > 0);

/** Anhang-Zwischennotiz (W2·27 P4): die Extraktion teilt die Item-Liste an einer
 *  marke-losen Zeile (Block mit `einzug`). Der Notiz-Block und der Block danach beginnen
 *  dann mit Punkten der Tiefe ≥ 1, deren Eltern-Punkt in einem Vorblock liegt — ohne
 *  diese Kette verlöre der Zitierknopf den übergeordneten Punkt («Anhang 4 lit. a» statt
 *  «Anhang 4 Ziff. 3.1 lit. a», §1: ein verkürztes Zitat ist ein falsches). Liefert die
 *  Items der Vorgänger derselben Liste bis zum nächstvorherigen Punkt der Wurzel-Ebene
 *  (genug, um die Kette zu schliessen). Leer, wenn der Block an der Wurzel beginnt (block-
 *  lokal vollständig) oder weder er noch sein unmittelbarer Vorgänger ein Notiz-Block ist:
 *  ein gewöhnlicher Absatz-Block mit eigener Unterliste (ARGV1 Anh., RBUE Anh.) hat seinen
 *  Eltern im eigenen Text, nicht im Vorblock — dort bliebe jede Kette erfunden (§1). */
export function anhangVorKette(bloecke: NormSnapshot['bloecke'], i: number): ZitatItem[] {
  const b = bloecke[i] as ListenBlock;
  if (b.items == null || b.items.length === 0 || !gehoertZurListe(b)) return [];
  if (stufenFuer(b.items)[0] <= 0) return [];
  if (b.einzug == null && (i === 0 || bloecke[i - 1].einzug == null)) return [];
  const vor: ZitatItem[] = [];
  for (let k = i - 1; k >= 0; k--) {
    const vb = bloecke[k] as ListenBlock;
    if (!gehoertZurListe(vb)) break;
    if (vb.items == null || vb.items.length === 0) continue; // Notiz ohne Unterliste
    vor.unshift(...vb.items);
    if (vb.items.some((it) => (it.tiefe ?? 0) === 0)) break;
  }
  return vor;
}

/** Linker Einzug (Lesesicht) einer marke-losen Anhang-Zeile: die Textspalte der Items ihrer
 *  Ebene (Liste pl-8 + Ebene·1.6 rem + Zeilen-px-2 + Markenspalte min-w-6 + gap-2 = 4.5 rem
 *  + Ebene·1.6 rem, vgl. itemListe) — die Zeile steht unter dem Text ihres Eltern-Punkts, ihre
 *  Unterliste eine Stufe tiefer. Ohne `einzug`: kein Eingriff (Prosa-Kante pl-9 bleibt). */
export const einzugStil = (b: { einzug?: number }): { paddingLeft: string } | undefined =>
  b.einzug != null ? { paddingLeft: `${(4.5 + 1.6 * b.einzug).toFixed(1)}rem` } : undefined;
