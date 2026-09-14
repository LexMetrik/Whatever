// ─── Transkription der Verweis-Auflösung (Quelle des V-1-Inventar-Tors) ─────
//
// Aus `scripts/check-verweis-inventar.ts` herausgelöst (§6.6-Schwelle, 831 Z.).
// Die Trennlinie ist inhaltlich, nicht bloss mechanisch:
//
//   · HIER steht, WAS DIE PRODUKTION TUT — die transkribierten Guards und die
//     Entscheidkette des Lesers, nachgebaut als reine Zählfunktion.
//   · DORT steht, WIE GEMESSEN UND VERGLICHEN WIRD — Korpus-Lauf, Artefakt,
//     Wächter, Selbsttest, Basislinien-Vergleich.
//
// Ohne Seiteneffekte beim Import (kein Korpus-Lauf), damit der Wächter-Test
// `src/tests/verweis-inventar-guards.test.ts` die Guard-Tabelle IMPORTIEREN
// kann, statt sie aus dem Quelltext zu klauben.
//
// Vollständige Herleitung, Grenzen (§8) und das Basislinien-Modell stehen im
// Kopf von `scripts/check-verweis-inventar.ts` — sie gelten unverändert.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  normVerweiseImText, fremdgesetzNachArtikel, fremdRoutingFormB,
  artikelnPluralVerweise, erkenneFedlexGesetz, SUFFIX_ALT, type FremdEbene,
} from '../src/lib/fedlex';
// V-3: dieselbe Token-Ableitung wie die Produktion (§5) — der Link entsteht
// nur, wenn `parsePassus` einen Anker liefert.
import { parsePassus } from '../src/lib/normtext/passus';

const WURZEL = process.cwd();
export const NORMTEXT_PFAD = join(WURZEL, 'src', 'components', 'NormText.tsx');
export const ARTIKELBODY_PFAD = join(WURZEL, 'src', 'components', 'normtext', 'ArtikelBody.tsx');
// V-3: die Kürzel-KANDIDATEN-Regel steht in der Datenzuleitung des Lesers
// (`baueKantonKuerzelKarte`), nicht in NormText — der Wächter liest sie dort.
// Bewusst KEIN zweiter SHA-256 auf diese Datei: sie trägt auch Sprung-, Such-
// und Spy-Hooks, die mit der Verweis-Auflösung nichts zu tun haben; ein Tor,
// das bei jedem Hook-Umbau rot wird, wird abgeschaltet (§6.7). Der
// Literal-Wächter ist hier das präzise Instrument.
export const INHALT_SPRUNG_PFAD = join(WURZEL, 'src', 'pages', 'gesetz-leser', 'inhalt-sprung.tsx');

// ─── 1 · Transkribierte Guards (Wächter-Massstab UND Compile-Quelle) ────────
//
// Jede Zeichenkette steht ZEICHENGLEICH in der genannten Quelldatei. `datei`
// sagt, wo; `zweck` sagt, welcher Guard. Ein Eintrag mit `stringLiteral: true`
// ist im Quelltext ein JS-String-Literal (einfache Anführungszeichen), kein
// RegExp-Literal — sein Muster wird über `jsStringLiteral()` gewonnen.

export interface GuardQuelle {
  zweck: string;
  datei: 'NormText.tsx' | 'ArtikelBody.tsx' | 'inhalt-sprung.tsx';
  literal: string;
  stringLiteral?: true;
}

/** Wortlaut, mit dem NormText.tsx die geteilte Suffix-Reihe einsetzt. */
const SUFFIX_PLATZHALTER = '${SUFFIX_ALT}';
/** Platzhalter → Reihe. Nur für den Regex-Bau; der Wächter vergleicht roh. */
const suffixeEinsetzen = (muster: string) => muster.split(SUFFIX_PLATZHALTER).join(SUFFIX_ALT);

export const G = {
  // Z6 a (14.9.2026): ART_INTERN setzt die GETEILTE Suffix-Reihe ein und steht
  // in NormText.tsx darum als Template-String mit `${SUFFIX_ALT}`. Genau diese
  // Schreibweise trägt die Transkription — sonst suchte der Drift-Wächter ein
  // Muster, das in der Quelle nirgends steht, und meldete Ruhe über nichts
  // (§6.7). Eingesetzt wird die Reihe erst beim Regex-Bau, aus DERSELBEN
  // Konstante, die die Produktion liest (§5): die Suffix-Liste kann hier
  // gar nicht mehr abdriften, nur noch der Rahmen darum.
  ART_INTERN: {
    zweck: 'ART_INTERN — bare «Art./Artikel N»',
    datei: 'NormText.tsx',
    literal: String.raw`/\bArt(?:\.|ikel)\s+(\d+(?:[a-z])?` + SUFFIX_PLATZHALTER + String.raw`?)(?![0-9a-z])/g`,
  },
  PARAGRAF_INTERN: {
    zweck: 'PARAGRAF_INTERN — «§ N» (F40)',
    datei: 'NormText.tsx',
    literal: String.raw`/§\s*(\d+(?:[a-z])?(?:bis|ter|quater|quinquies|sexies)?)(?![0-9a-z])/g`,
  },
  PARAGRAF_ANHANG_1: {
    zweck: 'PARAGRAF_ANHANG Fragment 1/4',
    datei: 'NormText.tsx',
    literal: String.raw`'^(?:'`,
    stringLiteral: true as const,
  },
  PARAGRAF_ANHANG_2: {
    zweck: 'PARAGRAF_ANHANG Fragment 2/4 (Passus-Glieder)',
    datei: 'NormText.tsx',
    literal: String.raw`'\\s+(?:Abs(?:atz|ätze|\\.)|Buchstaben?|Bst\\.|lit\\.|Ziff(?:ern?|\\.)|Satz|Sätze)\\s*[0-9a-z]+(?:bis|ter)?'`,
    stringLiteral: true as const,
  },
  PARAGRAF_ANHANG_3: {
    zweck: 'PARAGRAF_ANHANG Fragment 3/4 (Aufzählung/Bereich)',
    datei: 'NormText.tsx',
    literal: String.raw`'|\\s*(?:bis|und|oder|sowie|,|–|—|-)\\s*(?:§+\\s*)?\\d+(?:[a-z])?(?:bis|ter)?(?![0-9a-z])'`,
    stringLiteral: true as const,
  },
  PARAGRAF_ANHANG_4: {
    zweck: 'PARAGRAF_ANHANG Fragment 4/4',
    datei: 'NormText.tsx',
    literal: String.raw`')+'`,
    stringLiteral: true as const,
  },
  PARAGRAF_FREMD_GROSS: {
    zweck: 'PARAGRAF_FREMD_GROSS — Grosswort am §-Zitat',
    datei: 'NormText.tsx',
    literal: String.raw`/^\s+[A-ZÄÖÜ]/`,
  },
  PARAGRAF_FREMD_NAME: {
    zweck: 'PARAGRAF_FREMD_NAME / des-der-Guard (identisches Literal, zwei Fundstellen)',
    datei: 'NormText.tsx',
    literal: String.raw`/^\s+(?:des|der|über|vom)\b/`,
  },
  M12: {
    zweck: 'M12 — Gesetzes-Kürzel nach bare «Art. N»',
    datei: 'NormText.tsx',
    literal: String.raw`/^\s+(?:[A-ZÄÖÜ]{2,}|[A-ZÄÖÜ][a-zäöü]*[A-ZÄÖÜ]\w*)/`,
  },
  NORM_REF: {
    zweck: 'normRef — Ref-Normalisierung für die tokenMap',
    datei: 'NormText.tsx',
    literal: String.raw`s.toLowerCase().replace(/[^a-z0-9]/g, '')`,
  },
  KUERZEL_KANON: {
    zweck: 'kuerzelKanon — Kürzel-Normalisierung (eigenes vs. fremdes Kürzel)',
    datei: 'NormText.tsx',
    literal: String.raw`s.toUpperCase().replace(/[^A-Z0-9]/g, '')`,
  },
  // ── V-2 (Commit 967870b41): Selbstmarker-Weiche vor den Fremd-Guards ──────
  SELBST_MARKER: {
    zweck: 'SELBST_MARKER — Selbst-Wendung am Zitat («des vorliegenden Gesetzes», «dieser Verordnung»)',
    datei: 'NormText.tsx',
    literal: String.raw`/^\s*(?:(?:des|der)\s+vorliegenden|dies(?:es|er))\s+(?!Titels|Abschnitts|Kapitels|Anhangs|Teils|Buches|Hauptst)[A-ZÄÖÜ]/`,
  },
  GLIEDERUNGS_GENITIV: {
    zweck: 'GLIEDERUNGS_GENITIV — «dieses Titels/Abschnitts …» meint eine Gliederungseinheit, nie den Erlass (Härtung 31.8.2026)',
    datei: 'NormText.tsx',
    literal: String.raw`/^\s*dies(?:es|er)\s+(?:Titels|Abschnitts|Kapitels|Anhangs|Teils|Buches|Hauptst\w*)\b/`,
  },
  GESETZES_GENITIV: {
    zweck: 'GESETZES_GENITIV — «des Gesetzes» hinter dem Passus ist nie ein Selbstverweis; die belegten Fälle löst V-7c davor auf (V-7d, 14.9.2026)',
    datei: 'NormText.tsx',
    literal: String.raw`/^\s*des\s+Gesetzes\b/`,
  },
  SELBST_KUERZEL_TRIM: {
    zweck: 'nenntEigenesKuerzel — führender Trenner vor dem Kürzel',
    datei: 'NormText.tsx',
    literal: String.raw`rest.replace(/^\s+/, '')`,
  },
  SELBST_KUERZEL_GRENZE: {
    zweck: 'nenntEigenesKuerzel — Wortgrenze INKL. Bindestrich (KKV vs. KKV-FINMA)',
    datei: 'NormText.tsx',
    literal: String.raw`nach === '' || !/[\p{L}\p{N}-]/u.test(nach[0])`,
  },
  // ── V-3: Kanton-Kürzel-Resolver (§-Pfad) ──────────────────────────────────
  KANTON_KUERZEL_TOKEN: {
    zweck: 'kantonZielAmZitat — erstes Wort am Zitat (nach Passus)',
    datei: 'NormText.tsx',
    literal: String.raw`/^\s+(\S+)/`,
  },
  KANTON_KUERZEL_INTERPUNKTION: {
    zweck: 'kantonZielAmZitat — Satzzeichen am Zitat-Ende («§ 34 BPV).»); OHNE Bindestrich (SoHaG-Anhang ≠ SoHaG)',
    datei: 'NormText.tsx',
    literal: String.raw`/[.,;:)\]]+$/`,
  },
  KANTON_KUERZEL_KANDIDAT: {
    zweck: 'kuerzelKandidaten — welche Register-Kürzel überhaupt Ziel sein können (Datenzuleitung)',
    datei: 'inhalt-sprung.tsx',
    literal: String.raw`kuerzel.split(';').map((s) => s.trim())`,
  },
  KANTON_KUERZEL_KANDIDAT_FILTER: {
    zweck: 'kuerzelKandidaten — EIN Wort, ≥2 Zeichen, gross beginnend',
    datei: 'inhalt-sprung.tsx',
    literal: String.raw`.filter((s) => s.length >= 2 && !/\s/.test(s) && /^[A-ZÄÖÜ]/.test(s))`,
  },
  CHAPEAU_DOPPELPUNKT: {
    zweck: 'etabliertFremdgesetz — Doppelpunkt am Chapeau-Ende (M6)',
    datei: 'ArtikelBody.tsx',
    literal: String.raw`/:\s*$/`,
  },
  CHAPEAU_BESTIMMUNGEN: {
    zweck: 'etabliertFremdgesetz — «Bestimmungen des/der …» (M6)',
    datei: 'ArtikelBody.tsx',
    literal: String.raw`/\bBestimmungen\s+(?:des|der)\b/i`,
  },
  CHAPEAU_EIGEN: {
    zweck: 'etabliertFremdgesetz — Kanonisierung des eigenen Kürzels (M6)',
    datei: 'ArtikelBody.tsx',
    literal: String.raw`(eigenesKuerzel ?? '').toUpperCase().replace(/[^A-ZÄÖÜ]/g, '')`,
  },
  CHAPEAU_KUERZEL: {
    zweck: 'etabliertFremdgesetz — Kürzel-Kandidat im Chapeau (M6)',
    datei: 'ArtikelBody.tsx',
    literal: String.raw`/\b([A-ZÄÖÜ]{2,8})\b/g`,
  },
} satisfies Record<string, GuardQuelle>;

/** `/muster/flags` → RegExp. Nur für die RegExp-Literale oben. */
export function re(literal: string): RegExp {
  const m = /^\/(.*)\/([a-z]*)$/s.exec(literal);
  if (!m) throw new Error(`Kein RegExp-Literal: ${literal}`);
  return new RegExp(suffixeEinsetzen(m[1]), m[2]);
}

/**
 * JS-String-Literal (einfache Anführungszeichen) → sein Wert. Mechanisch über
 * JSON.parse: die vier PARAGRAF_ANHANG-Fragmente enthalten kein `"`, darum ist
 * das Umsetzen der äusseren Quotes verlustfrei. So bleibt die transkribierte
 * Zeichenkette EIN Wert für Wächter und Compile.
 */
function jsStringLiteral(literal: string): string {
  return JSON.parse(`"${literal.slice(1, -1)}"`) as string;
}

const ART_INTERN = re(G.ART_INTERN.literal);
const PARAGRAF_INTERN = re(G.PARAGRAF_INTERN.literal);
const PARAGRAF_ANHANG = new RegExp(
  jsStringLiteral(G.PARAGRAF_ANHANG_1.literal)
  + jsStringLiteral(G.PARAGRAF_ANHANG_2.literal)
  + jsStringLiteral(G.PARAGRAF_ANHANG_3.literal)
  + jsStringLiteral(G.PARAGRAF_ANHANG_4.literal),
);
const PARAGRAF_FREMD_GROSS = re(G.PARAGRAF_FREMD_GROSS.literal);
const PARAGRAF_FREMD_NAME = re(G.PARAGRAF_FREMD_NAME.literal);
const DES_DER_GUARD = re(G.PARAGRAF_FREMD_NAME.literal); // identisches Literal
const M12 = re(G.M12.literal);

export const normRef = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export const kuerzelKanon = (s: string): string => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Transkription von `etabliertFremdgesetz` (ArtikelBody.tsx, M6). */
export function etabliertFremdgesetz(absatzText: string, eigenesKuerzel?: string): boolean {
  const t = absatzText.trim();
  if (!re(G.CHAPEAU_DOPPELPUNKT.literal).test(t)) return false;
  if (!re(G.CHAPEAU_BESTIMMUNGEN.literal).test(t)) return false;
  const eigen = (eigenesKuerzel ?? '').toUpperCase().replace(/[^A-ZÄÖÜ]/g, '');
  for (const m of t.matchAll(re(G.CHAPEAU_KUERZEL.literal) as RegExp & { global: true })) {
    if (m[1].toUpperCase() !== eigen) return true;
  }
  return false;
}

/** Glättung des Lese-Pfads (ArtikelBody `glaetteInterpunktion`) — verschiebt
 *  Offsets und muss darum VOR der Messung laufen, wie in der Produktion. */
export const glaetteInterpunktion = (s: string): string => s.replace(/ +([.,])/g, '$1');

// ─── 2 · Selbstmarker — seit V-2 der PRODUKTIONS-Guard ──────────────────────
//
// Bis V-2 (Commit 967870b41) trug dieses Tor einen EIGENEN Selbstmarker-
// Detektor: die Produktion kannte das Signal noch gar nicht, gemessen werden
// musste es trotzdem. Seit V-2 gibt es `selbstSignalAmZitat` im Leser — der
// eigene Detektor wäre ab hier eine zweite Wahrheit über dieselbe Frage (§5)
// und wurde ERSETZT. Die Spalte `selbstmarker` im Artefakt zählt darum jetzt
// exakt die Stellen, an denen die V-2-Weiche greift.
const SELBST_MARKER = re(G.SELBST_MARKER.literal);
const GLIEDERUNGS_GENITIV = re(G.GLIEDERUNGS_GENITIV.literal);
const GESETZES_GENITIV = re(G.GESETZES_GENITIV.literal);

/** Transkription von `nenntEigenesKuerzel` (NormText.tsx, V-2 Ziel 2). */
function nenntEigenesKuerzel(rest: string, kuerzel?: string): boolean {
  const k = (kuerzel ?? '').trim();
  if (!k) return false;
  const ohneRaum = rest.replace(/^\s+/, '');
  if (ohneRaum.length === rest.length) return false; // kein Trenner ⇒ kein eigenes Wort
  if (!ohneRaum.startsWith(k)) return false;
  const nach = ohneRaum.slice(k.length);
  return nach === '' || !/[\p{L}\p{N}-]/u.test(nach[0]);
}

/** Transkription von `selbstSignalAmZitat` (NormText.tsx, V-2). */
function selbstSignalAmZitat(rest: string, ctx: Ctx): boolean {
  if (ctx.fremdKuerzel) return false;
  const nachPassus = rest.replace(PARAGRAF_ANHANG, '');
  return SELBST_MARKER.test(nachPassus) || nenntEigenesKuerzel(nachPassus, ctx.registerKuerzel);
}

// ─── 2b · V-3-Kanton-Kürzel-Resolver (Transkription) ────────────────────────
const KANTON_KUERZEL_TOKEN = re(G.KANTON_KUERZEL_TOKEN.literal);
const KANTON_KUERZEL_INTERPUNKTION = re(G.KANTON_KUERZEL_INTERPUNKTION.literal);

/** Transkription von `kuerzelAmZitat` (NormText.tsx, V-6). */
function kuerzelAmZitat(rest: string): string {
  const m = KANTON_KUERZEL_TOKEN.exec(rest);
  return m ? kuerzelKanon(m[1].replace(KANTON_KUERZEL_INTERPUNKTION, '')) : '';
}
/** Transkription von `kantonZielAmZitat` (NormText.tsx, V-3). */
function kantonZielAmZitat(rest: string, ctx: Ctx): string | null {
  const karte = ctx.kantonKuerzel;
  if (!karte) return null;
  const m = KANTON_KUERZEL_TOKEN.exec(rest.replace(PARAGRAF_ANHANG, ''));
  if (!m) return null;
  return karte.get(m[1].replace(KANTON_KUERZEL_INTERPUNKTION, '')) ?? null;
}

// Zeit-Kante (V-5, nur Zählung): Randtitel-Indiz bzw. Altrecht-Wendung im Block.
export const ZEIT_TITEL = /Übergangs/i;
export const ZEIT_ALTRECHT = /\b(?:bisherige[nmrs]?\s+Recht|frühere[nmrs]?\s+Recht|altrechtlich)/i;

// ─── 3 · Klassifizierer (Transkription von restMitIntern) ───────────────────

export type Entscheid = 'SELF' | 'FREMD' | 'TEXT';

/** Die Formklassen — je eine Stelle im Entscheidbaum. */
export const KLASSEN: Record<string, { entscheid: Entscheid; was: string }> = {
  'anker-fedlex': { entscheid: 'FREMD', was: 'Voll zitierter Bund-Anker «Art. N GESETZ» (NORM_IM_TEXT)' },
  'anker-kette': { entscheid: 'FREMD', was: 'Ketten-Glied, Kürzel aus dem Anker-Ende propagiert (i.V.m.)' },
  'anker-erlass': { entscheid: 'FREMD', was: 'Blosser Erlass-Verweis OHNE Artikelnummer → Erlass-Seite (Z1, W2·22)' },
  'anker-ausgeschrieben': { entscheid: 'FREMD', was: 'Ausgeschriebener Artikelverweis «Artikel N … KÜRZEL» → Fremd-Artikel (Z5, W2·22)' },
  'anker-self': { entscheid: 'SELF', was: 'Voll zitierter Anker auf den GELESENEN Erlass → Sprung statt Fedlex-Chip (V-2 Ziel 3)' },
  'art-chapeau-fremd': { entscheid: 'FREMD', was: 'bare «Art. N» unter Fremdgesetz-Chapeau → Zielgesetz (M6-D)' },
  'gliederungs-genitiv': { entscheid: 'TEXT', was: '«Art./§ N dieses Titels/Abschnitts …» — Gliederungseinheit, nie der Erlass (Härtung 31.8.2026)' },
  'gesetzes-genitiv': { entscheid: 'TEXT', was: '«Art. N [Passus] des Gesetzes» ohne Trägergesetz-Beleg — nie Selbstverweis, kein Link (V-7d, 14.9.2026)' },
  'art-desder-guard': { entscheid: 'TEXT', was: '«Art. N des/der/über/vom …» ohne Klammer-Kürzel' },
  'art-f41': { entscheid: 'TEXT', was: 'bare «Art. N» im §-designierten Erlass — Self-Sperre (F41)' },
  'art-kein-token': { entscheid: 'TEXT', was: 'bare «Art. N» — Bestimmung existiert im Erlass nicht' },
  'art-m12-kuerzel': { entscheid: 'TEXT', was: '«Art. N KÜRZEL» (unbekanntes Kürzel) — Self unterdrückt (M12)' },
  'art-n2-fremdkuerzel': { entscheid: 'TEXT', was: '«Art. N … FEDLEX-Kürzel» (N2 Form A) — Self unterdrückt' },
  'art-self': { entscheid: 'SELF', was: 'bare «Art. N» → Sprung im eigenen Erlass' },
  'm6-chapeau-unterdrueckt': { entscheid: 'TEXT', was: 'Zitat in Items unter unauflösbarem Fremdgesetz-Chapeau (M6)' },
  'n2b-glied': { entscheid: 'FREMD', was: 'Glied der Form B «Artikel N … des <Name> (KÜRZEL)» — Klammer-Kürzel' },
  'n2b-genitiv': { entscheid: 'FREMD', was: 'Form-B-Glied über kuratierten Kurztitel-Genitiv ohne Klammer («des Bankengesetzes», V-7a; Geltung je Ebene)' },
  'n2b-titel': { entscheid: 'FREMD', was: 'Form-B-Glied über amtlichen Volltitel «Bundesgesetzes/Verordnung [vom Datum] über …» (V-7b)' },
  'n2b-traeger': { entscheid: 'FREMD', was: 'Form-B-Glied über die namenlose Kurzform «des Gesetzes» → Trägergesetz des gelesenen Erlasses (V-7c)' },
  'n2b-glied-text': { entscheid: 'TEXT', was: 'Form-B-Glied ohne Ziel-Token (heute strukturell 0 — NormText übergibt kein Prädikat)' },
  'paragraf-fremd-grosswort': { entscheid: 'TEXT', was: '«§ N <Grosswort>» — Fremd-Indiz, kein Link' },
  'paragraf-kanton-kuerzel': { entscheid: 'FREMD', was: '«§ N KÜRZEL» — im Kanton EINDEUTIGES Kürzel eines anderen Erlasses → Link auf dessen Lesesicht (V-3)' },
  'paragraf-fremd-name': { entscheid: 'TEXT', was: '«§ N des/der/über/vom …» — Fremd-Indiz, kein Link' },
  'paragraf-kein-token': { entscheid: 'TEXT', was: '«§ N» — Bestimmung existiert im Erlass nicht' },
  'paragraf-self': { entscheid: 'SELF', was: '«§ N» → Sprung im eigenen Erlass (F40)' },
  'plural-glied-chapeau': { entscheid: 'FREMD', was: 'A10-Glied unter Fremdgesetz-Chapeau → Zielgesetz' },
  'plural-glied-f41': { entscheid: 'TEXT', was: 'A10-Glied im §-designierten Erlass — Self-Sperre (F41)' },
  'plural-glied-fremd': { entscheid: 'FREMD', was: 'A10-Glied mit aufgelöstem Fremdgesetz-Signal' },
  'plural-glied-kein-token': { entscheid: 'TEXT', was: 'A10-Glied — Bestimmung existiert im Erlass nicht' },
  'plural-glied-self': { entscheid: 'SELF', was: 'A10-Glied → Sprung im eigenen Erlass' },
  'plural-region-unterdrueckt': { entscheid: 'TEXT', was: 'A10-Region mit unauflösbarem Fremdnamen — ganz unterdrückt' },
};

export interface Ctx {
  tokenMap: Map<string, string>;
  /** Kanonisierter Register-SCHLÜSSEL (letztes Segment des Lese-Basispfads) —
   *  der Identitäts-Vergleich der N2-/Plural-Weichen. */
  eigenesKuerzel: string;
  /** V-2: das ROHE Register-KÜRZEL («SLV», «Personalgesetz»), wie es
   *  `useInternRefs` als `eigenesKuerzel` durchreicht — Zeichenvergleich mit
   *  Wortgrenze in `nenntEigenesKuerzel`, darum NICHT kanonisiert. */
  registerKuerzel?: string;
  paragrafDesigniert: boolean;
  fremdKuerzel?: string;
  /** V-3: Kürzel → Lese-Adresse der ANDEREN Erlasse desselben Kantons, wie
   *  `baueKantonKuerzelKarte` sie dem Leser gibt (Aufbau im Tor, Abschnitt 4). */
  kantonKuerzel?: ReadonlyMap<string, string>;
  /** V-7: Ebene des gelesenen Erlasses — NormText leitet sie aus dem Basispfad
   *  ab (`/gesetze/kanton/…` ⇒ kanton, sonst bund); Kurznamen mit Geltung
   *  `bund` lösen in kantonalen Erlassen nicht auf (`positivliste.ts`). */
  ebene?: FremdEbene;
  /** V-7c: ROHER Register-Key des gelesenen Erlasses — NormText leitet ihn aus
   *  dem letzten Segment des Basispfads ab und reicht ihn an
   *  `fremdRoutingFormB` durch; er entscheidet, ob «des Gesetzes» auf das
   *  Trägergesetz auflöst (`TRAEGER_EINTRAEGE`). */
  erlassKey?: string;
}

export interface Stelle {
  klasse: string;
  nummer: string | null;
  selbstmarker: boolean;
  /** Selbstmarker, aber die genannte Bestimmung gibt es im Erlass nicht. */
  totesZiel: boolean;
  /** Z6c (W2·22): der Zitat-Text, den die PRODUKTION an dieser Weiche in einen
   *  FREMD-Anker auflöst — genau das `artikel`-Prop, das NormText dem NormChip
   *  übergibt (bzw. `span.artikel` beim voll zitierten Anker). Nur an
   *  FREMD-Entscheiden gesetzt; das Tor schlägt daraus über `bundSnapshotRef`
   *  Ziel-Erlass und Ziel-Token nach (Sonderliste `toteFremdAnker`). Kein
   *  zweiter Erkenner: der String ist die Produktions-Eingabe, nicht ein
   *  Nachbau ihrer Bedeutung (§5). */
  ziel?: string;
  /** Z6c-KANTON (Nachzug 14.9.2026, Gegenprüfungs-Befund C): die V-3-Weiche
   *  `paragraf-kanton-kuerzel` baut ihren Fremd-Anker NICHT über NormChip und
   *  `bundSnapshotRef`, sondern direkt als `<a href={kantonZiel}#art-${token}>`
   *  (NormText.tsx). Ein Zitat-String wie «Art. 5 OR», den ein Resolver zerlegen
   *  könnte, entsteht dort gar nicht — darum trägt diese Weiche Ziel-Erlass und
   *  Anker-Token AUSDRÜCKLICH. Beide Werte stammen aus derselben transkribierten
   *  Weiche wie der gerenderte Link (§5): `quelle` aus `kantonZielAmZitat`,
   *  `token` aus `parsePassus` — genau die zwei Funktionen, aus denen die
   *  Produktion den href zusammensetzt.
   *
   *  ABWEICHUNG ZUR PRODUKTION, bewusst: dort liefert die Kürzel-Karte die
   *  Lese-ADRESSE (`/gesetze/kanton/BS-154.100`, `erlassPfad`), hier den
   *  REGISTER-KEY (`BS-154.100`, `kartenJeKanton`). Das letzte Pfadsegment IST
   *  der Key — dieselbe Gleichung, auf die sich `eigenesKuerzel` in der Messung
   *  schon stützt. Der Key ist das, womit der Snapshot-Nachschlag arbeitet. */
  kantonZiel?: { quelle: string; token: string; zitat: string };
}

const stelle = (
  klasse: string, nummer: string | null, ctx: Ctx, selbstmarker = false, ziel?: string,
  kantonZiel?: { quelle: string; token: string; zitat: string },
): Stelle => ({
  klasse,
  nummer,
  selbstmarker,
  totesZiel:
    selbstmarker && !ctx.fremdKuerzel && ctx.tokenMap.size > 0 && nummer != null
    && !ctx.tokenMap.has(normRef(nummer)),
  ...(ziel != null ? { ziel } : {}),
  ...(kantonZiel != null ? { kantonZiel } : {}),
});

/** Transkription von `restMitIntern` — zählt statt zu rendern. */
function restStellen(s: string, ctx: Ctx): Stelle[] {
  if (!s) return [];
  const out: Stelle[] = [];
  const paragrafErlass = ctx.paragrafDesigniert;
  const ebene: FremdEbene = ctx.ebene ?? 'bund';
  const pluralRegionen = artikelnPluralVerweise(s, ebene, ctx.erlassKey);
  const inPluralRegion = (idx: number) =>
    pluralRegionen.some((r) => idx >= r.oeffnerStart && idx < r.end);

  // Spans, die in der Produktion in `linkSpans` landen (und darum vom
  // `last`-Cursor verworfen werden können) — getrennt von den Text-Ausgängen,
  // die sofort feststehen.
  const linkSpans: { start: number; end: number; s: Stelle }[] = [];
  const textStellen: Stelle[] = [];

  for (const r of pluralRegionen) {
    if (r.unterdruecken) {
      for (const g of r.glieder) textStellen.push(stelle('plural-region-unterdrueckt', g.roh, ctx));
      continue;
    }
    const fremdEffektiv = r.fremd && kuerzelKanon(r.fremd) !== ctx.eigenesKuerzel ? r.fremd : null;
    for (const g of r.glieder) {
      if (fremdEffektiv) {
        // Z6c: NormText.tsx:431 — <NormChip artikel={`Art. ${g.roh} ${fremdEffektiv}`} …>
        linkSpans.push({ start: g.start, end: g.end, s: stelle('plural-glied-fremd', g.roh, ctx, false, `Art. ${g.roh} ${fremdEffektiv}`) });
      } else if (ctx.fremdKuerzel) {
        // Z6c: NormText.tsx:437 — M6-D-Chapeau.
        linkSpans.push({ start: g.start, end: g.end, s: stelle('plural-glied-chapeau', g.roh, ctx, false, `Art. ${g.roh} ${ctx.fremdKuerzel}`) });
      } else {
        if (paragrafErlass) { textStellen.push(stelle('plural-glied-f41', g.roh, ctx)); continue; }
        const token = ctx.tokenMap.get(normRef(g.roh));
        if (!token) { textStellen.push(stelle('plural-glied-kein-token', g.roh, ctx)); continue; }
        linkSpans.push({ start: g.start, end: g.end, s: stelle('plural-glied-self', g.roh, ctx) });
      }
    }
  }

  if (paragrafErlass) {
    for (const m of s.matchAll(PARAGRAF_INTERN)) {
      const start = m.index, end = start + m[0].length;
      if (inPluralRegion(start)) continue;
      const nach = s.slice(end);
      const sm = selbstSignalAmZitat(nach, ctx);
      // V-3: benanntes Kürzel eines ANDEREN Erlasses desselben Kantons → Link.
      // Steht wie in der Produktion VOR den Fremd-Guards und NACH dem
      // Selbst-Signal; ohne Anker-Token fällt es in die Guards zurück.
      const kantonZiel = sm ? null : kantonZielAmZitat(nach, ctx);
      const kantonToken = kantonZiel ? parsePassus(m[0])?.artikelToken : undefined;
      if (kantonZiel && kantonToken) {
        // Z6c-Kanton (Befund C, 14.9.2026): bis hierher zählte die Weiche nur
        // ihre Stellen — das Ziel blieb ungemessen, und «0 ausgelieferte tote
        // Anker» war darum eine Aussage über den Bund, nicht über den Korpus.
        // Ziel-Erlass und Token reisen jetzt mit; der Nachschlag im Snapshot
        // des Ziels passiert in der Messung, wie beim Bund-Zweig.
        linkSpans.push({
          start, end,
          s: stelle('paragraf-kanton-kuerzel', m[1], ctx, sm, undefined,
            { quelle: kantonZiel, token: kantonToken, zitat: m[0] }),
        });
        continue;
      }
      const rest = nach.replace(PARAGRAF_ANHANG, '');
      // V-2: das ausdrückliche Selbst-Signal steht VOR beiden Fremd-Guards.
      // Produktion prüft die beiden Signale danach in EINER Bedingung; hier
      // getrennt gezählt — der Entscheid (TEXT) ist in beiden Zweigen derselbe.
      if (!sm && GLIEDERUNGS_GENITIV.test(rest)) { textStellen.push(stelle('gliederungs-genitiv', m[1], ctx, sm)); continue; }
      if (!sm && PARAGRAF_FREMD_GROSS.test(rest)) { textStellen.push(stelle('paragraf-fremd-grosswort', m[1], ctx, sm)); continue; }
      if (!sm && PARAGRAF_FREMD_NAME.test(rest)) { textStellen.push(stelle('paragraf-fremd-name', m[1], ctx, sm)); continue; }
      const token = ctx.tokenMap.get(normRef(m[1]));
      if (!token) { textStellen.push(stelle('paragraf-kein-token', m[1], ctx, sm)); continue; }
      linkSpans.push({ start, end, s: stelle('paragraf-self', m[1], ctx, sm) });
    }
    linkSpans.sort((a, b) => a.start - b.start);
  }

  let last = 0;
  let pq = 0;
  const emitPluralBis = (pos: number) => {
    while (pq < linkSpans.length && linkSpans[pq].start < pos) {
      const sp = linkSpans[pq++];
      if (sp.start < last) continue; // von einer N2b-Region konsumiert
      out.push(sp.s);
      last = sp.end;
    }
  };

  for (const m of s.matchAll(ART_INTERN)) {
    if (m.index < last) continue;
    if (inPluralRegion(m.index)) continue;
    emitPluralBis(m.index);
    const start = m.index;
    const rest = s.slice(start + m[0].length);
    const routing = fremdRoutingFormB(rest, m[1], undefined, ebene, ctx.erlassKey);
    // V-7: Volltitel des GELESENEN Erlasses ist kein Fremdverweis (wie Original).
    if (routing && kuerzelKanon(routing.gesetz) !== ctx.eigenesKuerzel) {
      // V-7: Klasse nach Erkennungs-Signal (Klammer / Genitiv-Kurztitel / Volltitel).
      const klasse = routing.signal === 'klammer' ? 'n2b-glied'
        : routing.signal === 'genitiv' ? 'n2b-genitiv'
        : routing.signal === 'traeger' ? 'n2b-traeger' : 'n2b-titel';
      for (const g of routing.glieder) {
        // Z6c: NormText.tsx:551 — <NormChip artikel={g.artikel} …>.
        out.push(stelle(g.linkbar ? klasse : 'n2b-glied-text', g.roh, ctx, false, g.linkbar ? g.artikel : undefined));
      }
      last = start + m[0].length + routing.regionEnd;
      continue;
    }
    // V-2: ausdrückliches Selbst-Signal → keine der vier Fremd-Vermutungen
    // (des/der, N2, M12, F41) greift. Reihenfolge exakt wie im Original.
    const sm = selbstSignalAmZitat(rest, ctx);
    // V-6: Rest ohne Passus-/Aufzählungsglieder; im Chapeau ruht die Erweiterung.
    const nachPassus = ctx.fremdKuerzel ? rest : rest.replace(PARAGRAF_ANHANG, '');
    // Härtung 31.8.: Gliederungs-Genitiv ⇒ Text (Reihenfolge exakt wie Original).
    if (!sm && GLIEDERUNGS_GENITIV.test(rest.replace(PARAGRAF_ANHANG, ''))) { out.push(stelle('gliederungs-genitiv', m[1], ctx, sm)); continue; }
    if (!sm && GESETZES_GENITIV.test(nachPassus)) { out.push(stelle('gesetzes-genitiv', m[1], ctx, sm)); continue; }
    if (!sm && DES_DER_GUARD.test(rest)) { out.push(stelle('art-desder-guard', m[1], ctx, sm)); continue; }
    const fremd = sm ? null : fremdgesetzNachArtikel(rest);
    if (fremd && kuerzelKanon(fremd) !== ctx.eigenesKuerzel) { out.push(stelle('art-n2-fremdkuerzel', m[1], ctx, sm)); continue; }
    // V-6: der M12-Guard greift auf dem ROHEN Rest ODER auf dem Rest nach dem
    // Passus, in beiden Zweigen nur bei einem FREMDEN Kürzel (Produktion prüft
    // das in zwei aufeinanderfolgenden Zeilen; der Entscheid ist in beiden
    // derselbe und wird darum hier zusammen gezählt). Herleitung und Messung
    // stehen am Guard in NormText.tsx.
    if (!sm && ((kuerzelAmZitat(rest) !== ctx.eigenesKuerzel && M12.test(rest))
      || (kuerzelAmZitat(nachPassus) !== ctx.eigenesKuerzel && M12.test(nachPassus)))) {
      out.push(stelle('art-m12-kuerzel', m[1], ctx, sm)); continue;
    }
    if (ctx.fremdKuerzel) {
      // Z6c: NormText.tsx:647 — <NormChip artikel={`Art. ${m[1]} ${intern.fremdKuerzel}`} …>.
      out.push(stelle('art-chapeau-fremd', m[1], ctx, sm, `Art. ${m[1]} ${ctx.fremdKuerzel}`));
      last = start + m[0].length;
      continue;
    }
    if (paragrafErlass && !sm) { out.push(stelle('art-f41', m[1], ctx, sm)); continue; }
    const token = ctx.tokenMap.get(normRef(m[1]));
    if (!token) { out.push(stelle('art-kein-token', m[1], ctx, sm)); continue; }
    out.push(stelle('art-self', m[1], ctx, sm));
    last = start + m[0].length;
  }
  emitPluralBis(s.length);
  return [...out, ...textStellen];
}

/**
 * Transkription von `selbstSpanSprung` (NormText.tsx, V-2 Ziel 3): nennt ein
 * VOLL zitierter Anker den gelesenen Erlass selbst, bleibt der Sprung im Leser,
 * statt über NormChip nach Fedlex hinauszuführen. Alle vier Bedingungen nötig.
 */
function selbstSpanSprung(s: { artikel: string }, ctx: Ctx | null): boolean {
  if (!ctx || ctx.fremdKuerzel) return false;
  const gesetz = erkenneFedlexGesetz(s.artikel);
  if (!gesetz) return false;
  const kanon = kuerzelKanon(gesetz);
  const eigen = [ctx.eigenesKuerzel, kuerzelKanon(ctx.registerKuerzel ?? '')];
  if (!eigen.includes(kanon)) return false;
  const m = s.artikel.matchAll(ART_INTERN).next().value;
  if (!m) return false;
  return ctx.tokenMap.get(normRef(m[1])) != null;
}

/**
 * Ein Fliesstext-Stück wie NormText es sieht: erst die voll zitierten Anker
 * (normVerweiseImText), dann die Zwischenstücke durch die Guard-Kette.
 * `ctx === null` = M6-Fall (Items unter unauflösbarem Fremdgesetz-Chapeau):
 * die Produktion übergibt dort KEIN `intern`, die Guard-Kette läuft also gar
 * nicht — die bare Zitate sind vor jedem Entscheid unterdrückt.
 */
export function stellenImText(text: string, ctx: Ctx | null, paragrafFuerM6: boolean): Stelle[] {
  const out: Stelle[] = [];
  const leer: Ctx = { tokenMap: new Map(), eigenesKuerzel: '', paragrafDesigniert: false };
  const rest = (s: string) => {
    if (ctx) { out.push(...restStellen(s, ctx)); return; }
    for (const m of s.matchAll(ART_INTERN)) out.push(stelle('m6-chapeau-unterdrueckt', m[1], leer));
    if (paragrafFuerM6) {
      for (const m of s.matchAll(PARAGRAF_INTERN)) out.push(stelle('m6-chapeau-unterdrueckt', m[1], leer));
    }
  };
  // Z1 (W2·22): wie die Produktion — `ctx.eigenesKuerzel` ist der kanonisierte
  // Register-Schlüssel des gelesenen Erlasses und schliesst den Erlass-Verweis
  // auf sich selbst aus (NormText übergibt dort das rohe letzte Pfad-Segment;
  // die Identitäts-Normalisierung in `erlassVerweiseImText` ist idempotent).
  // Z5 (W2·22): wie die Produktion reicht das Tor die Ebene mit durch —
  // `ctx.ebene` ist dieselbe Ableitung aus dem Lese-Basispfad.
  const spans = normVerweiseImText(text, ctx?.eigenesKuerzel, ctx?.ebene ?? 'bund');
  if (spans.length === 0) { rest(text); return out; }
  let zuletzt = 0;
  for (const s of spans) {
    if (s.start > zuletzt) rest(text.slice(zuletzt, s.start));
    out.push(
      selbstSpanSprung(s, ctx)
        ? stelle('anker-self', null, ctx ?? leer)
        // Z6c: NormText.tsx:769 — <NormChip artikel={s.artikel} …>. Der blosse
        // Erlass-Verweis (Z1) trägt gar keine Artikelnummer und ist damit per
        // Bauart die Fallback-Form selbst — kein Ziel-Token nachzuschlagen.
        : stelle(s.erlass ? 'anker-erlass'
          : s.ausgeschrieben ? 'anker-ausgeschrieben'
          : s.propagiert ? 'anker-kette' : 'anker-fedlex', null, ctx ?? leer, false,
        s.erlass ? undefined : s.artikel),
    );
    zuletzt = s.end;
  }
  if (zuletzt < text.length) rest(text.slice(zuletzt));
  return out;
}

// ─── 4 · Wächter: Transkription ↔ Quelltext ─────────────────────────────────

/**
 * Was der Wächter im Quelltext SUCHT. Bei einem RegExp-Literal ist das das
 * MUSTER ohne Schrägstriche und Flags, sonst das Literal selbst.
 *
 * Warum nicht das ganze `/…/g`: gemessen 31.8.2026 an einem
 * verhaltensneutralen Umbau in `NormText.tsx` — dasselbe Muster wurde in eine
 * Konstante gehoben und zweimal instanziiert (`const ART_MUSTER = String.raw…;
 * new RegExp(ART_MUSTER, 'g')`), damit `matchAll` und die flag-lose
 * Nummern-Entnahme sich keinen `lastIndex` teilen. Das Muster blieb dabei
 * zeichengleich, das LITERAL verschwand — der Wächter hätte einen Fehlalarm
 * geschlagen und, schlimmer, den Blick auf die ECHTE Änderung derselben Datei
 * verstellt. Ein Wächter, der bei jeder Umstellung schreit, wird abgeschaltet.
 *
 * Die Flags fallen bewusst aus dem Vergleich: sie sind hier gesetzt (das Tor
 * compiliert aus dem eigenen Literal), und ein verlorenes `g` an einem
 * `matchAll`-Muster ist in der Produktion ein sofortiger TypeError, keine
 * stille Abweichung. Jede Änderung am MUSTER schlägt weiterhin durch.
 */
export function suchtext(g: GuardQuelle): string {
  const m = /^\/(.*)\/([a-z]*)$/s.exec(g.literal);
  return g.stringLiteral || !m ? g.literal : m[1];
}

export function waechterGuards(): string[] {
  const quelle: Record<string, string> = {
    'NormText.tsx': readFileSync(NORMTEXT_PFAD, 'utf8'),
    'ArtikelBody.tsx': readFileSync(ARTIKELBODY_PFAD, 'utf8'),
    'inhalt-sprung.tsx': readFileSync(INHALT_SPRUNG_PFAD, 'utf8'),
  };
  const fehler: string[] = [];
  for (const [name, g] of Object.entries(G) as [string, GuardQuelle][]) {
    if (!quelle[g.datei].includes(suchtext(g))) {
      fehler.push(`${name} (${g.zweck}): Muster steht NICHT mehr zeichengleich in ${g.datei} → ${suchtext(g)}`);
    }
  }
  return fehler;
}

