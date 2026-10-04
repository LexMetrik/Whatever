// Zitat-Zerlegung. Das Artikel-Token folgt dem Fedlex-Anker-Format
// (335c → 335_c, 334bis → 334_bis), kongruent zu src/lib/fedlex.ts.
// Bug-Audit 19.6.2026 (H5): abschliessende Wortgrenze \b nötig, sonst frisst das
// optionale [a-z]? das «b» von «bis» und «Art. 334bis» wird zu «334_b». Mit \b
// backtrackt [a-z]? und gibt das Suffix frei (kongruent zu fedlex.ts:161).
const ART = /(?:Art\.?|§)\s*(\d+[a-z]?(?:bis|ter|quater|quinquies)?)\b/i;
// Lat. Suffixe (bis/ter/…) wie bei ART zuerst, sonst verstümmelt «Abs. 1bis»
// zu «1b» (B2). Reihenfolge: Suffix vor optionalem Einzel-Buchstaben.
const ABS = /Abs\.?\s*(\d+(?:bis|ter|quater|quinquies)?[a-z]?)/i;
// lit./Bst. b  →  Buchstaben-Punkt; Ziff./Ziffer 17  →  Ziffern-Punkt.
// Schlüsselwort mit Punkt ODER Wortgrenze, damit «litera a» NICHT als
// «lit» + «e» (Match mitten im Wort «litera») fehlinterpretiert wird (B3):
// nach «lit»/«Bst» muss ein Punkt oder eine Wortgrenze (\b) folgen.
const LIT = /(?:lit\.|Bst\.|\blit\b|\bBst\b)\s*([a-z](?:bis|ter)?)\b/i;
// Lat. Suffix vor dem Einzel-Buchstaben (wie ABS), sonst wird «Ziff. 1bis» zu «1b» und
// «Art. 187 Ziff. 1bis StGB» löst nie auf (Befund-Runde #1251, B3). «3b»/«5a» bleiben Buchstaben-Ziffern.
const ZIFF = /(?:Ziff\.|Ziffer|\bZiff\b)\s*(\d+(?:bis|ter|quater|quinquies)?[a-z]?)/i;
const SUFFIX = /^(\d+)([a-z])?(bis|ter|quater|quinquies)?$/;
// Anhang-/Tarif-Ziffer ohne Art./§ («Anhang Ziff. 1.1.1», «Tarif-Nr. 2.5»,
// «Ziffer 4.4.3.1»). NUR als Fallback, wenn ART (Art./§) NICHT matcht — sonst
// gewinnt immer der Artikel-Designator. Verlangt eine MEHRSTUFIGE Ziffer
// (\d+(?:\.\d+)+ → mind. «N.N»), damit einfache «Ziff. 17» nicht fälschlich als
// Anhang-Token gelten (die bleiben echte lit./Ziff. eines Artikels). Token = die
// gepunktete Ziffer, kongruent zum Anhang-Segmentierer (segmentiereAnhangZiffern)
// und zum Snapshot-`artikel`.
const ANHANG_ZIFFER =
  /(?:Anhang|Ziff\.|Ziffer|Tarif-?Nr\.?|\bNr\.)\s*(?:Art\.\s*[\w-]+\s*(?:Ziff\.|Ziffer)?\s*)?(\d+(?:\.\d+)+)/i;

/**
 * Zerlegtes Zitat. lit/ziff sind nur gesetzt, wenn das Zitat sie nennt
 * (sonst weggelassen — die Felder sind optional, damit Bestandstests
 * mit `toEqual({ artikelToken, absatz })` ohne lit/ziff sauber bleiben).
 */
export interface Passus {
  artikelToken: string;
  absatz: string | null;
  lit?: string;
  ziff?: string;
}

export function parsePassus(zitat: string): Passus | null {
  const a = zitat.match(ART);
  if (!a) {
    // Kein Art./§ → evtl. eine Anhang-/Tarif-Ziffer («Anhang Ziff. 1.1.1»).
    const anh = zitat.match(ANHANG_ZIFFER);
    return anh ? { artikelToken: anh[1].toLowerCase(), absatz: null } : null;
  }
  const artikelToken = a[1].toLowerCase()
    .replace(SUFFIX, (_, n, b, suf) => [n, b, suf].filter(Boolean).join('_'));
  const abs = zitat.match(ABS);
  const passus: Passus = { artikelToken, absatz: abs ? abs[1].toLowerCase() : null };
  const lit = zitat.match(LIT);
  if (lit) passus.lit = lit[1].toLowerCase();
  const ziff = zitat.match(ZIFF);
  if (ziff) passus.ziff = ziff[1].toLowerCase();
  // Bewusst First-Match: bei verketteten Zitaten («… i.V.m. Ziff. X») wird die
  // ERSTE genannte lit/Ziff übernommen. Das ist gewollt (das Popover hebt die
  // primär zitierte Stelle hervor); die Wortgrenze in LIT/ZIFF stellt nur
  // sicher, dass keine Marke mitten aus einem Wort gegriffen wird (B3).
  return passus;
}

// Führender Artikel-Designator eines (oft aufgeblähten) kantonalen Roh-Zitats:
// das ERSTE «Art. N[a-z]*» bzw. «§ N[a-z]*» (lat. Suffixe bis/ter/… mitnehmen),
// OHNE Abs./Ziff./lit./Klammer-Verweise/Erlass-Nr. So wird der Popover-Titel
// schlank und einheitlich wie bei Bund («Art. 335c»):
//   «§ 13 Abs. 1 Ziff. 1»               → «§ 13»
//   «Art. 36 (Art. 38 vereinfacht)»     → «Art. 36»
//   «§ 24 Abs. 1 lit. a GT (BGS 615.11)»→ «§ 24»
//   «211.433 § 15 Abs. 1 Ziff. 1»       → «§ 15»
// Die zitierte Abs./Ziff./lit. geht NICHT verloren: sie steckt in `passus`
// (Trigger) und treibt die Markierung; nur der Titel wird gekürzt.
// Ohne matchbaren Designator → Roh-String zurück (defensiv).
const DESIGNATOR = /(Art\.?|§)\s*(\d+(?:bis|ter|quater|quinquies)?[a-z]?)/i;

export function artikelLabelKurz(rohArtikel: string): string {
  const m = rohArtikel.match(DESIGNATOR);
  if (!m) return rohArtikel;
  // «Art.» / «art» → kanonisch «Art.»; «§» bleibt «§».
  const designator = m[1].startsWith('§') ? '§' : 'Art.';
  return `${designator} ${m[2]}`;
}

// Text-Fragment für externe Links (Chromium hebt hervor, andere ignorieren).
// Erste 6 Wörter genügen für eine eindeutige Sprungmarke.
export function textFragment(text: string): string {
  const woerter = text.trim().split(/\s+/).slice(0, 6).join(' ');
  return `#:~:text=${encodeURIComponent(woerter)}`;
}
