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
 * Trägt dieser Fussnoten-Prosatext einen amtlichen AUFHEBUNGS-Vermerk?
 * Delegiert an die kalibrierte Fussnoten-Grammatik (§5) und fragt nur, ob eines
 * der erkannten Ereignisse vom Typ «aufgehoben» ist («Aufgehoben durch/in/gemäss …»).
 *
 * BEWUSST NICHT erkannt (§7, nichts fabrizieren): «Gegenstandslos [gemäss …]»
 * (StGB Art. 67f, OR Schlusstitel) und der amtliche Tippfehler «Aufgehobn durch …»
 * (BKV Art. 8). Beide sind der Grammatik unbekannt; sie bleiben ungeklärt und
 * erscheinen im Wächter-Bericht, statt eine zweite Muster-Wahrheit neben
 * historie-parse.ts zu eröffnen (§5).
 */
export function fussnoteHebtAuf(text: string): boolean {
  if (!text.trim()) return false;
  return parseFussnoteHistorie({ text }).ereignisse.some((e) => e.typ === 'aufgehoben');
}

/** Fussnoten-Definitionen `fn-…` → Prosatext, aus dem Apparat EINES Artikels. */
export function fussnotenTexte(articleInner: string): Map<string, string> {
  const map = new Map<string, string>();
  const apparat = articleInner.match(/<div\s+class="footnotes">[\s\S]*$/i)?.[0] ?? '';
  for (const m of apparat.matchAll(/<p\s+id="(fn-[^"]+)"\s*>([\s\S]*?)<\/p>/gi)) {
    map.set(m[1], nurText(m[2]));
  }
  return map;
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
  // Tabellen/Mehrspaltiges sind LEBENDER Inhalt und schlagen alles (dieselbe
  // Rangfolge wie artikelGanzAufgehoben, Gegenprüfung 27.7.2026).
  if (bloecke.some((b) => (b.tabelle?.length ?? 0) > 0 || (b.mehrspaltig?.zeilen.length ?? 0) > 0)) {
    return false;
  }
  if (!bloecke.length) return false;

  const fn = fussnotenTexte(articleInner);
  const kopfHebtAuf = markerIds(kopfFragment(articleInner)).some((id) =>
    fussnoteHebtAuf(fn.get(id) ?? ''),
  );

  // JEDER Block muss eine amtlich aufgehobene Stelle sein — ein einziger lebender
  // Absatz macht den Artikel lebendig (§1: lieber nicht markieren als falsch).
  return bloecke.every((b, i) => {
    const items = b.items ?? [];
    const platzhalter = istPlatzhalter(b.text) && items.every((it) => istPlatzhalter(it.text));
    if (!platzhalter) return false;
    if (istWortlautAufgehoben(b.text)) return true; // amtlicher Wortlaut selbst
    const span = quellen[i];
    if (span == null) return kopfHebtAuf; // synthetisierter «…»-Block → Kopf-Vermerk
    const eigen = markerIds(span).some((id) => fussnoteHebtAuf(fn.get(id) ?? ''));
    return eigen || kopfHebtAuf;
  });
}
