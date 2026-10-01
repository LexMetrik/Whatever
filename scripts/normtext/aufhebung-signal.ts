// ─── Amtliches Aufhebungs-Signal eines Fedlex-Artikels (W2·27) ────────────────
//
// WARUM (§7/§8, Befund Fahrplan-BUND-FERTIG §1 «Aufgehoben / Historie»): Bis
// 14.9.2026 trug KEIN Bund-Artikel das deklarierte Feld `NormSnapshot.aufgehoben`
// (0 von 25 463). Ob ein Artikel aufgehoben ist, entschied allein die TEXT-
// Heuristik `artikelGanzAufgehoben` (src/lib/normtext/darstellung.ts) — «Body ist
// leer oder «…» ⇒ aufgehoben». Ein EXTRAKTIONSFEHLER sieht identisch aus, und
// zwei amtlich NICHT aufgehobene Klassen sehen es ebenfalls:
//   • Änderungs-Artikel («…» + Fussnote «Die Änderung kann unter AS … konsultiert
//     werden», z.B. AVIG Art. 115, BGFA Art. 35) — der Artikel gilt, sein Inhalt
//     steht nur in der AS;
//   • noch nicht in Kraft getretene Artikel («Tritt zu einem späteren Zeitpunkt
//     in Kraft», z.B. AIG Art. 126f).
// Beides wird heute als «aufgehoben» angezeigt. Dieses Modul ersetzt die Vermutung
// durch das AMTLICHE Signal aus der Fedlex-Konsolidierung.
//
// DAS SIGNAL (empirisch erhoben 14.9.2026 an den 228 gepinnten Fedlex-HTMLs;
// Detailprobe an OR, ZGB, StGB, SchKG, VRV — 165 leere Artikel-Bodies):
// Fedlex rendert einen aufgehobenen Artikel als Nummerierungs-Slot, dessen
// Wortlaut durch einen AUFHEBUNGS-VERMERK in der amtlichen Fussnote ersetzt ist.
// Zwei belegte Bauformen:
//
//   (a) Leerer Body + Kopf-Fussnote am <h…class="heading">:
//       <article id="art_48"><h6 class="heading">… Art. 48 <sup><a href="#fn-X">28</a></sup></h6>
//         <div class="collapseable"><div class="footnotes"><p id="fn-X">…
//           Aufgehoben durch Art. 21 Abs. 1 des BG vom 30. Sept. 1943 …, mit
//           Wirkung seit 1. März 1945 (BS 2 951).</p></div></div></article>
//       (OR Art. 48.)
//
//   (b) Amtlicher «…»-Platzhalter je Absatz, Vermerk an der ABSATZ-Fussnote:
//       <p class="absatz"><sup>1</sup> …<sup><a href="#fn-Y">182</a></sup></p>
//       mit <p id="fn-Y">… Aufgehoben durch Ziff. I des BG vom 16. Dez. 2005,
//       mit Wirkung seit 1. Jan. 2008 …</p>  (ASYLG Art. 52, beide Absätze.)
//       Sonderform: der Body IST buchstäblich «Aufgehoben» (ASYLV2 Art. 19,
//       DBG Art. 43–48) — dann ist der amtliche Wortlaut selbst der Vermerk.
//
//   (c) Alles andere — leerer/«…»-Body OHNE Aufhebungs-Vermerk — bleibt
//       UNGEKLÄRT und bekommt KEIN Feld (§7: nichts fabrizieren). Der Wächter
//       `check:leerstellen` zählt diese Fälle und wird rot, sobald sie zunehmen.
//
// ERGÄNZT 30.9.2026 (W2·27-BUND-FERTIG, Prüfer #892) — zwei Lücken geschlossen:
//
//   (d) «GEGENSTANDSLOS» (StGB Art. 67f «Gegenstandslos gemäss Ziff. IV 1 des BG
//       vom 19. Juni 2015 …, mit Wirkung seit 1. Jan. 2018»; OR Schlusstitel
//       disp_u16/art_6 «Gegenstandslos.»). Fedlex führt den Artikel ohne Wortlaut
//       mit diesem Vermerk. «Gegenstandslos» ist NICHT «Aufgehoben» (§1: zwei
//       rechtlich verschiedene Fälle, keine gemeinsame Abstraktion): der Artikel
//       wurde nicht durch einen Aufhebungsakt gestrichen, sondern ist
//       gegenstandslos geworden. Darum ein EIGENES Feld `NormSnapshot.gegenstandslos`
//       und ein eigenes Zustandswort in der Darstellung — nie «aufgehoben» (§8).
//       Die Fussnoten-Grammatik `historie-parse.ts` kennt «Gegenstandslos» nicht
//       (kein Änderungs-Ereignis mit Verb-Kopf); sie wird bewusst NICHT erweitert
//       (Historie-Shards/UI-Mappings hingen daran) — der Vermerk wird hier am
//       Fussnoten-ANFANG erkannt (`fussnoteGegenstandslos`). Nicht erkannt, weil
//       Absatz-/Teil-Skopus: «Gegenstandslose UeB.» (KOV Art. 99, VZG Art. 135),
//       «Dritter Satz gegenstandslos» (VSTG Art. 36a), «… ist heute gegenstandslos»
//       (GEBV SchKG Art. 61) — dort lebt der Artikel.
//
//       NACHTRAG 1.10.2026 (W2·27-BUND-FERTIG, §0 Ziff. 2b — ergänzt, nicht nachgeführt): «bewusst NICHT
//       erweitert» galt für #1183. Seither kennt `historie-parse.ts` «Gegenstandslos» als eigenen
//       HistorieTyp 'gegenstandslos' (Gegenprüfung #1183, §8: die Historie zeigte 67f als «In Kraft»);
//       `fussnoteHebtAuf` bleibt davon unberührt (fragt nur typ 'aufgehoben'), die Vermerk-Regel hier
//       (`fussnoteGegenstandslos`) und die Grammatik dort teilen dasselbe Muster am Fussnoten-Anfang.
//
//   (e) ANHÄNGE (`<section id="annex_*">`, kein `<article>`): Fedlex rendert einen
//       aufgehobenen Anhang als Überschrift `<h1 class="heading">` mit Kopf-Marker,
//       Fussnoten-Div (Klasse «footnotes» ODER «footnotes section-heading-footnote»)
//       und leerem `<div class="collapseable">`. Der Extraktor synthetisiert dann den
//       «…»-Block (`extrahiereAnhang`); `anhangAmtlichesSignal` liest den Vermerk am
//       Kopf-Marker. Nur bei LEEREM Körper — ein Anhang mit Wortlaut trägt nie ein
//       Signal (§1: lieber nicht markieren als falsch).
//
//   (f) DREI weitere amtliche Formen (ERGÄNZT 1.10.2026, W2·27-BUND-FERTIG — Posten «Diese aufgehobenen
//       Art. …», «AsylG Art. 122», «Nach #1183: Bund-Leerstellen offen 82»; belegt an den gepinnten
//       Fedlex-HTMLs, Wortlaut + URL in src/tests/normtext-aufhebung-sammel-w227.test.ts):
//         • Plural-Sammelvermerk «Diese aufgehobenen Art. werden (mit Ausnahme von Art. 211) ersetzt durch …»
//           (StGB Art. 201–212, EIN Sammel-Artikel `art_201_212`, leerer Body) ⇒ `aufgehoben`.
//         • amtlicher Tippfehler «Aufgehobn durch Ziff. I der V des EFD vom 16. April 2014 …» (BKV Art. 8) ⇒
//           `aufgehoben` (die Fussnoten-Grammatik `historie-parse.ts` kennt «Aufgehobn» nicht und wird NICHT
//           erweitert: Historie-Shards hängen daran; der Vermerk wird wie «Gegenstandslos» hier am Fussnoten-
//           ANFANG erkannt, eng auf genau diese zwei Wortlaute).
//         • «… ist dieser Art. gegenstandslos» in einer Fussnote am Artikel-KOPF, die mit einem AS-Zitat beginnt
//           (AsylG Art. 122, «AS 1998 1582 Ziff. III. Aufgrund der Annahme dieses BB in der Volksabstimmung vom
//           13. Juni 1999 ist dieser Art. gegenstandslos.») ⇒ `gegenstandslos`. Anders als bei (d) trägt der
//           Artikel hier NOCH Wortlaut (die bedingte Bestimmung selbst); der Vermerk ist amtlich ausdrücklich auf
//           «dieser Art.» bezogen, steht an der Überschrift und gilt darum für den GANZEN Artikel. Das Feld ist
//           reine Metainformation: der Wortlaut bleibt unverändert im Snapshot (§5/§7).
//       NICHT erkannt (bleibt Posten, §1/§7): «Dieser Art. bleibt aus gesetzestechnischen Gründen leer»
//       (StGB Art. 108 — weder Aufhebung noch Gegenstandslosigkeit, sondern ein amtlich bewusst leerer Slot),
//       Änderungs-Artikel («Die Änderung kann unter AS … konsultiert werden»), EPV Anhang 2 (befristet),
//       Absatz-/Teil-Skopus («Gegenstandslos. Siehe Art. 75 …» FINMAG 15, «Gegenstandslose UeB.» KOV 99/VZG 135,
//       «Dritter Satz gegenstandslos» VSTG 36a, «Art. 61 Abs. 2 Bst. b ist heute gegenstandslos» GEBV SchKG 61).
//
// ABGRENZUNG: Dieses Modul entscheidet NUR über den GANZEN Artikel
// (`NormSnapshot.aufgehoben`, G-AUFH-ART). Aufhebungen einzelner Absätze/Items
// sind Sache der Artikel-Historie (public/normtext/historie/*.json).
//
// §5: Die Grammatik der Änderungs-Fussnoten wird NICHT zweitgeschrieben — die
// Klassifikation läuft über `parseFussnoteHistorie` (src/lib/normtext/historie-parse.ts),
// die EINE kalibrierte Quelle. Hier steht nur, WO im Artikel-HTML gesucht wird.

import { parseFussnoteHistorie } from '../../src/lib/normtext/historie-parse.ts';

/** Ein Block, wie ihn `parseArtikelInner` liefert (nur die hier gelesenen Felder). */
export interface SignalBlock {
  text: string;
  items?: Array<{ text: string }>;
  tabelle?: unknown[];
  mehrspaltig?: { zeilen: unknown[] };
}

/**
 * Zwei amtliche Aufhebungs-Wortlaute, die die Fussnoten-Grammatik (`historie-parse.ts`) nicht kennt und die hier
 * eng am Fussnoten-ANFANG erkannt werden (Klasse (f), s. Kopf-Doku; ergänzt 1.10.2026):
 *  • «Diese aufgehobenen Art(.|ikel) …» — Plural-Sammelvermerk (StGB Art. 201–212). Wortgrenze nach «Art»/«Artikel»
 *    (kein «Artikelnummern»); NICHT «Dieser Art. …» (Singular, StGB Art. 108: «bleibt … leer»).
 *  • «Aufgehobn durch …» — amtlicher Fedlex-Tippfehler (BKV Art. 8), nur exakt dieses Wort mit folgendem «durch».
 */
const SAMMEL_AUFGEHOBEN_RE = /^Diese aufgehobenen Art(?:\.|ikel)(?=\s)/;
const TIPPFEHLER_AUFGEHOBN_RE = /^Aufgehobn durch(?=\s)/;

/**
 * Trägt dieser Fussnoten-Prosatext einen amtlichen AUFHEBUNGS-Vermerk?
 * Delegiert an die kalibrierte Fussnoten-Grammatik (§5) und fragt nur, ob eines
 * der erkannten Ereignisse vom Typ «aufgehoben» ist («Aufgehoben durch/in/gemäss …»);
 * dazu zwei eng gefasste Anfangs-Wortlaute, die der Grammatik unbekannt sind
 * (`SAMMEL_AUFGEHOBEN_RE`, `TIPPFEHLER_AUFGEHOBN_RE` — Klasse (f)).
 *
 * «Gegenstandslos [gemäss …]» (StGB Art. 67f, OR Schlusstitel) wird NICHT hier, sondern von
 * `fussnoteGegenstandslos` erkannt: es ist kein Aufhebungs-Vermerk (§1).
 *
 * NACHTRAG 1.10.2026 (§0 Ziff. 2b — ergänzt, nicht nachgeführt): bis 30.9.2026 stand hier, der Tippfehler
 * «Aufgehobn durch …» (BKV Art. 8) bleibe «bewusst NICHT erkannt». Das galt für #1183; seit 1.10.2026 ist er
 * als amtlicher Wortlaut am Fedlex-HTML belegt und wird eng erkannt.
 */
export function fussnoteHebtAuf(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (SAMMEL_AUFGEHOBEN_RE.test(t) || TIPPFEHLER_AUFGEHOBN_RE.test(t)) return true;
  return parseFussnoteHistorie({ text }).ereignisse.some((e) => e.typ === 'aufgehoben');
}

/**
 * Trägt dieser Fussnoten-Prosatext den amtlichen Vermerk «GEGENSTANDSLOS»?
 * Nur am Fussnoten-ANFANG («Gegenstandslos gemäss Ziff. IV 1 des BG …», «Gegenstandslos.»)
 * und nur als ganzes Wort — «Gegenstandslose UeB.» (Adjektiv, Absatz-Skopus) und
 * Mitte-Satz-Formen («ist dieser Art. gegenstandslos») gehören nicht hierher:
 * dort lebt der Artikel bzw. betrifft der Vermerk nur einen Teil (§1/§7).
 * Bewusst KEIN Aufhebungs-Vermerk — s. Kopf-Doku Klasse (d).
 */
export function fussnoteGegenstandslos(text: string): boolean {
  return /^Gegenstandslos(?=[\s.,;:]|$)/.test(text.trim());
}

/**
 * Sagt diese Fussnote ausdrücklich «… ist dieser Art. gegenstandslos»? (AsylG Art. 122: «AS 1998 1582 Ziff. III.
 * Aufgrund der Annahme dieses BB in der Volksabstimmung vom 13. Juni 1999 ist dieser Art. gegenstandslos.»)
 * Die Fussnote beginnt hier mit einem AS-Zitat, darum greift die Anfangs-Regel `fussnoteGegenstandslos` nicht
 * (und bleibt unverändert, #1183). Eng gefasst: Subjekt MUSS «dieser Art.»/«dieser Artikel» sein (nicht «Art. 61
 * Abs. 2 Bst. b», nicht «Dritter Satz»), «gegenstandslos» als ganzes Wort (nicht «gegenstandslosen»). Gilt nur für
 * den Artikel-KOPF-Marker (`kopfDiesenArtGegenstandslos`) — an einem Absatz-Marker besagt «dieser Art.» nichts über
 * den ganzen Artikel (§1). Kein Aufhebungs-Vermerk — s. Kopf-Doku Klassen (d)/(f).
 */
export function fussnoteDiesenArtGegenstandslos(text: string): boolean {
  return /\bist dieser Art(?:\.|ikel)\s+gegenstandslos(?=[\s.,;:]|$)/.test(text.trim());
}

/** `<p id="fn-…">`-Definitionen eines HTML-Fragments → Prosatext. */
function fussnotenDefinitionen(fragment: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of fragment.matchAll(/<p\s+id="(fn-[^"]+)"\s*>([\s\S]*?)<\/p>/gi)) {
    map.set(m[1], nurText(m[2]));
  }
  return map;
}

/** Fussnoten-Definitionen `fn-…` → Prosatext, aus dem Apparat EINES Artikels. */
export function fussnotenTexte(articleInner: string): Map<string, string> {
  return fussnotenDefinitionen(articleInner.match(/<div\s+class="footnotes">[\s\S]*$/i)?.[0] ?? '');
}

/** Fussnoten-Marker (`href="#fn-…"`) eines HTML-Fragments in Reihenfolge. */
export function markerIds(fragment: string): string[] {
  return [...fragment.matchAll(/href="#(fn-[^"]+)"/gi)].map((m) => m[1]);
}

/** Die Artikel-Überschrift `<hN class="… heading …">…</hN>` (trägt den Kopf-Marker). */
export function kopfFragment(articleInner: string): string {
  return articleInner.match(/<h\d\b[^>]*class="[^"]*\bheading\b[^"]*"[\s\S]*?<\/h\d>/i)?.[0] ?? '';
}

/** Ist dieser Block-Text ein Aufhebungs-PLATZHALTER (leer, «…» oder «Aufgehoben»)?
 *  Deckungsgleich mit `istAufgehoben` der Darstellungsschicht — die Heuristik
 *  entscheidet hier NICHTS, sie grenzt nur die Stellen ein, an denen nach einem
 *  amtlichen Vermerk gesucht wird. */
export function istPlatzhalter(text: string): boolean {
  const t = text.trim();
  if (t === '') return true;
  if (/^[….\s]*$/.test(t)) return true;
  return istWortlautAufgehoben(t);
}

/** Ist der Block-Text buchstäblich der amtliche Wortlaut «Aufgehoben»? */
function istWortlautAufgehoben(text: string): boolean {
  const t = text.trim().replace(/^(?:(?:und|et|bis|[–-]|\d+)\s+)+/i, '');
  return /^aufgehoben\.?$/i.test(t);
}

function nurText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#160;|&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\d+\s*/, ''); // führende Fussnoten-Nummer
}

/** Amtliches Signal eines GANZEN Artikels/Anhangs: Fedlex-Vermerk am Kopf bzw. an jedem Platzhalter. */
export type AmtlichesSignal = 'aufgehoben' | 'gegenstandslos';

/** Gemeinsamer Rumpf für «aufgehoben» und «gegenstandslos»: dieselbe Rangfolge
 *  (Tabelle → jeder Block Platzhalter → Vermerk am Kopf/Absatz), nur das Vermerk-
 *  Prädikat und der Wortlaut-Kurzschluss unterscheiden sich (§5: eine Regel, eine Stelle). */
function artikelMitVermerk(
  hebt: (fussnote: string) => boolean,
  wortlautKurzschluss: boolean,
  articleInner: string,
  bloecke: readonly SignalBlock[],
  quellen: readonly (string | null)[],
): boolean {
  // Tabellen/Mehrspaltiges sind LEBENDER Inhalt und schlagen alles (dieselbe
  // Rangfolge wie artikelGanzAufgehoben, Gegenprüfung 27.7.2026).
  if (bloecke.some((b) => (b.tabelle?.length ?? 0) > 0 || (b.mehrspaltig?.zeilen.length ?? 0) > 0)) {
    return false;
  }
  if (!bloecke.length) return false;

  const fn = fussnotenTexte(articleInner);
  const kopfHebtAuf = markerIds(kopfFragment(articleInner)).some((id) => hebt(fn.get(id) ?? ''));

  // JEDER Block muss eine amtlich gekennzeichnete Stelle sein — ein einziger lebender
  // Absatz macht den Artikel lebendig (§1: lieber nicht markieren als falsch).
  return bloecke.every((b, i) => {
    const items = b.items ?? [];
    const platzhalter = istPlatzhalter(b.text) && items.every((it) => istPlatzhalter(it.text));
    if (!platzhalter) return false;
    if (wortlautKurzschluss && istWortlautAufgehoben(b.text)) return true; // amtlicher Wortlaut selbst
    const span = quellen[i];
    if (span == null) return kopfHebtAuf; // synthetisierter «…»-Block → Kopf-Vermerk
    const eigen = markerIds(span).some((id) => hebt(fn.get(id) ?? ''));
    return eigen || kopfHebtAuf;
  });
}

/**
 * Ist der GANZE Artikel amtlich aufgehoben? Entscheidet allein aus dem
 * Quell-HTML — Klassen (a)/(b) oben. Rückgabe `false` heisst «kein amtliches
 * Signal», NICHT «gilt» (§8: das Nichtwissen bleibt sichtbar, der Wächter zählt es).
 *
 * @param articleInner  Inneres des `<article …>` (mit `<h…>` und Fussnoten-Apparat)
 * @param bloecke       Die geparsten Blöcke des Artikels (`parseArtikelInner`)
 * @param quellen       Quell-HTML-Span je Block, deckungsgleich mit `bloecke`;
 *                      `null` = vom Generator synthetisierter «…»-Block (leerer
 *                      Fedlex-Body) — dann gilt der Kopf-Marker.
 */
export function artikelAmtlichAufgehoben(
  articleInner: string,
  bloecke: readonly SignalBlock[],
  quellen: readonly (string | null)[],
): boolean {
  return artikelMitVermerk(fussnoteHebtAuf, true, articleInner, bloecke, quellen);
}

/**
 * Amtliches Signal des GANZEN Artikels: «aufgehoben» (Klassen (a)/(b)), «gegenstandslos»
 * (Klasse (d)) oder `null` (kein Signal — bleibt ungeklärt, §7). «aufgehoben» hat Vorrang;
 * gemischte Belege (ein Block aufgehoben, ein anderer gegenstandslos) ergeben `null`.
 */
export function artikelAmtlichesSignal(
  articleInner: string,
  bloecke: readonly SignalBlock[],
  quellen: readonly (string | null)[],
): AmtlichesSignal | null {
  if (artikelAmtlichAufgehoben(articleInner, bloecke, quellen)) return 'aufgehoben';
  if (artikelMitVermerk(fussnoteGegenstandslos, false, articleInner, bloecke, quellen)) return 'gegenstandslos';
  return kopfDiesenArtGegenstandslos(articleInner, bloecke) ? 'gegenstandslos' : null;
}

/**
 * «… ist dieser Art. gegenstandslos» an der Artikel-ÜBERSCHRIFT (AsylG Art. 122) — gilt auch, wenn der Artikel noch
 * Wortlaut trägt: der Vermerk ist amtlich ausdrücklich auf den GANZEN Artikel bezogen. Konservativ (§1): nie mit
 * Tabelle/Mehrspaltigem (lebender Inhalt schlägt, wie bei `artikelMitVermerk`), nie wenn am selben Kopf zugleich ein
 * Aufhebungs-Vermerk steht (widersprüchlich → kein Signal, Nichtwissen bleibt sichtbar).
 */
function kopfDiesenArtGegenstandslos(articleInner: string, bloecke: readonly SignalBlock[]): boolean {
  if (!bloecke.length) return false;
  if (bloecke.some((b) => (b.tabelle?.length ?? 0) > 0 || (b.mehrspaltig?.zeilen.length ?? 0) > 0)) return false;
  const fn = fussnotenTexte(articleInner);
  const kopfTexte = markerIds(kopfFragment(articleInner)).map((id) => fn.get(id) ?? '');
  return kopfTexte.some(fussnoteDiesenArtGegenstandslos) && !kopfTexte.some(fussnoteHebtAuf);
}

/**
 * Amtliches Signal eines ANHANGS (`<section id="annex_*">`, Klasse (e)). Aufrufen NUR
 * bei leerem Körper (der Extraktor synthetisiert dann «…»): gelesen wird der Vermerk
 * an den Kopf-Markern der Überschrift. Die Fussnoten-Div-Klasse variiert («footnotes»,
 * «footnotes section-heading-footnote»), darum werden alle `<p id="fn-…">` der Sektion gelesen.
 * @param sektionInner  Inneres der `<section>` (Überschrift + Fussnoten-Apparat)
 */
export function anhangAmtlichesSignal(sektionInner: string): AmtlichesSignal | null {
  const fn = fussnotenDefinitionen(sektionInner);
  const texte = markerIds(kopfFragment(sektionInner)).map((id) => fn.get(id) ?? '');
  if (texte.some(fussnoteHebtAuf)) return 'aufgehoben';
  return texte.some(fussnoteGegenstandslos) ? 'gegenstandslos' : null;
}

/** Die Signal-Felder eines Extrakts als Spread für den Snapshot-Eintrag. Reihenfolge
 *  aufgehoben → gegenstandslos: die DB-Projektion (erlass-rows.ts) emittiert sie so,
 *  jede andere Reihenfolge kippt die Byte-Parität. */
export function signalFelder(r: {
  aufgehoben?: true;
  gegenstandslos?: true;
}): { aufgehoben?: true; gegenstandslos?: true } {
  return {
    ...(r.aufgehoben ? { aufgehoben: true as const } : {}),
    ...(r.gegenstandslos ? { gegenstandslos: true as const } : {}),
  };
}

/**
 * Rückgabe-Shape von `extrahiereArtikelAusAnker`: `bloecke` plus die optionalen
 * Artikel-Metadaten. Der Helfer lebt HIER und nicht im Extraktor, weil
 * `extrahiere-fedlex.ts` unter dem §6.6-Zeilendeckel steht (Baseline 1496,
 * erlaubt bis 1645) — die Regel gehört ohnehin zu diesem Modul.
 *
 * SCHLÜSSEL-REIHENFOLGE: `aufgehoben`/`gegenstandslos` stehen VOR `grundlage`. Die
 * DB-Projektion emittiert id…artikelLabel, [titel], [aufgehoben|gegenstandslos],
 * [grundlage], bloecke… (scripts/datenhaltung/erlass-rows.ts, `projiziereErlass`);
 * eine andere Reihenfolge im Generator kippt die Byte-Parität zwischen DB und
 * Snapshot. Beide Felder fliessen NICHT in `sha256Bloecke` — Artikel-Metadaten wie
 * `titel` und `grundlage`, darum golden-neutral.
 */
export function artikelTextMitAufhebung<
  B extends SignalBlock,
  T extends { bloecke: B[]; quellen: (string | null)[]; grundlage?: string },
>(
  articleInner: string,
  r: T,
): { aufgehoben?: true; gegenstandslos?: true; grundlage?: string; bloecke: B[] } {
  const signal = artikelAmtlichesSignal(articleInner, r.bloecke, r.quellen);
  return {
    ...(signal === 'aufgehoben' ? { aufgehoben: true as const } : {}),
    ...(signal === 'gegenstandslos' ? { gegenstandslos: true as const } : {}),
    ...(r.grundlage != null ? { grundlage: r.grundlage } : {}),
    bloecke: r.bloecke,
  };
}
