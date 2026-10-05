/**
 * Fedlex-Extraktor — Absatz-Nummern mit lateinischem Suffix (Blatt-Modul, W2·27-BUND-FERTIG P8,
 * 3.10.2026).
 *
 * EINE Suffix-Reihe (§5): `SUFFIX_ALT` aus src/lib/fedlex/nummer.ts — gemessen an den 231 gepinnten
 * Bund-HTMLs (alle <sup>-Inhalte «<Ziffer?><Suffix>», Kommando im PR): genau die zwölf Glieder
 * bis·ter·quater·quinquies·sexies·septies·octies·novies·decies·undecies·duodecies·tredecies, kein
 * weiteres. Bis P8 trugen Extraktor, Anhang-Pfad, Fussnoten-Position und Prüf-Tore je eine
 * Handkopie der Reihe, alle endeten bei `quinquies`: «<sup>1sexies</sup>» passte weder auf die
 * Absatznummer noch auf den Strip → absatz=null, das Label «1sexies» stand im Fliesstext, der
 * Anker fehlte (GwG Art. 9 Abs. 1sexies, VZAE Art. 87 — 14 Absätze in 7 Erlassen). Die Muster
 * liegen jetzt hier, damit Artikel-, Anhang- und Fussnoten-Pfad dieselbe Grammatik lesen.
 */
import { SUFFIX_ALT } from '../../../src/lib/fedlex/nummer.ts';

/**
 * Klassen-Token der ABSATZ-Familie (NT-01, HN-05, 5.10.2026) — EINE Definition für Extraktor (Alt 1), Fussnoten-
 * Block-Walk, Ziffer-Ebene und Tor `check:p-klassen`. Fedlex zeichnet einzelne Absätze mit Varianten der Klasse
 * aus; gemessen an den 231 gepinnten Bund-HTMLs (Kommando im PR) gibt es ausser «absatz» genau
 *   · `absatzkurs`  (kursiv; Absatznummer steht dort in einem <span>-Wrapper, UVPV 13 Abs. 3/4, OHG 49),
 *   · `absatz09pt`  (Kleindruck-Fortsetzungszeilen von Aufzählungen: StHG 56, VZV 143, VZG 119, ParlG 3, VBB 10),
 * als Absatz-Text im Artikelkörper. NICHT Teil der Familie (bewusst, je mit Besitzer):
 *   · `absatz8pt` / `absatz08pt` — im Artikelkörper Sternchen-Verweisnoten (stern-note.ts) und die Kleindruck-Zeilen
 *     der Inkrafttreten-Datumslisten (NT-10, eigener Schritt); in Anhängen gehen alle <p> über den Anhang-Pfad.
 * JS-`\b` zählt Ziffern als Wortzeichen: `absatz8pt`, `absatz10pt` und `absatzfoo` treffen NICHT; das bisherige
 * Verhalten für «absatz» und «man-template-absatz-struktur-1» (Bindestrich = Wortgrenze) bleibt unverändert.
 */
export const ABSATZ_KLASSE_QUELLE = '\\babsatz(?:kurs|09pt)?\\b';
const ABSATZ_KLASSE_RE = new RegExp(ABSATZ_KLASSE_QUELLE);
/** Gehört der Wert eines class-Attributs zur Absatz-Familie? */
export const istAbsatzKlasse = (klasse: string): boolean => ABSATZ_KLASSE_RE.test(klasse);

/**
 * Führende Hüllen vor der Absatznummer: Leerraum, &nbsp;, <inl>-Marken und — NT-01 — ein <span …>-Wrapper
 * (absatzkurs: `<span class="man-font-style-normal"><sup>3</sup></span>`). Schliessende </span> bleiben im Rest und
 * werden von entferneTags verworfen.
 */
const FUEHREND = '(?:\\s|&nbsp;|<\\/?inl>|<span\\b[^>]*>)*';

/** Erstes <sup> am Absatzanfang (Inhalt = Gruppe 1) — Kandidat für die Absatznummer; Fussnoten-<sup> trägt ein <a>. */
export const ABSATZ_ERSTES_SUP = new RegExp(`^${FUEHREND}<sup(?:[^>]*)>([\\s\\S]*?)<\\/sup>`, 'i');
/** Zwei benachbarte <sup> am Anfang: Ziffer (Gruppe 1) + mögliches Suffix (Gruppe 2) — «<sup>1</sup><sup>bis</sup>». */
export const ABSATZ_ZWEI_SUPS_ANFANG = new RegExp(
  `^${FUEHREND}<sup[^>]*>\\s*(\\d+)\\s*<\\/sup>(?:&nbsp;|\\s|<\\/?inl>)*<sup[^>]*>\\s*([^<]*?)\\s*<\\/sup>`,
  'i',
);

/** Ein <sup> mit der ganzen Absatznummer («<sup>1bis</sup>», «<sup>2</sup>»), samt Folge-Leerraum. */
export const ABSATZ_NR_EIN_SUP = new RegExp(
  `^${FUEHREND}<sup[^>]*>\\d+${SUFFIX_ALT}?[a-z]?<\\/sup>(?:&nbsp;|\\s|<\\/?inl>)*`,
  'i',
);

/** Gespaltene Nummer: «<sup>1</sup><sup>bis</sup>» (Ziffer und Suffix in zwei benachbarten <sup>). */
export const ABSATZ_NR_ZWEI_SUPS = new RegExp(
  `^${FUEHREND}<sup[^>]*>\\s*\\d+\\s*<\\/sup>(?:&nbsp;|\\s|<\\/?inl>)*<sup[^>]*>\\s*(?:${SUFFIX_ALT}|[a-z])\\s*<\\/sup>(?:&nbsp;|\\s|<\\/?inl>)*`,
  'i',
);

/** Das zweite <sup> der gespaltenen Nummer: Suffix-Wort oder einzelner Buchstabe, nie eine Ziffer (§1). */
export const SUFFIX_WORT_ODER_BUCHSTABE = new RegExp(`^(?:${SUFFIX_ALT}|[a-z])$`, 'i');

/** Inhalt eines <sup>, der eine Absatznummer ist: «1», «1bis», «1sexies», «2a». */
export const ABSATZ_NR_INHALT = new RegExp(`^\\d+${SUFFIX_ALT}?[a-z]?$`);
