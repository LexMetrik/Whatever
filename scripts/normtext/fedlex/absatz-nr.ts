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

/** Ein <sup> mit der ganzen Absatznummer («<sup>1bis</sup>», «<sup>2</sup>»), samt Folge-Leerraum. */
export const ABSATZ_NR_EIN_SUP = new RegExp(
  `^(?:\\s|&nbsp;|<\\/?inl>)*<sup[^>]*>\\d+${SUFFIX_ALT}?[a-z]?<\\/sup>(?:&nbsp;|\\s|<\\/?inl>)*`,
  'i',
);

/** Gespaltene Nummer: «<sup>1</sup><sup>bis</sup>» (Ziffer und Suffix in zwei benachbarten <sup>). */
export const ABSATZ_NR_ZWEI_SUPS = new RegExp(
  `^(?:\\s|&nbsp;|<\\/?inl>)*<sup[^>]*>\\s*\\d+\\s*<\\/sup>(?:&nbsp;|\\s|<\\/?inl>)*<sup[^>]*>\\s*(?:${SUFFIX_ALT}|[a-z])\\s*<\\/sup>(?:&nbsp;|\\s|<\\/?inl>)*`,
  'i',
);

/** Das zweite <sup> der gespaltenen Nummer: Suffix-Wort oder einzelner Buchstabe, nie eine Ziffer (§1). */
export const SUFFIX_WORT_ODER_BUCHSTABE = new RegExp(`^(?:${SUFFIX_ALT}|[a-z])$`, 'i');

/** Inhalt eines <sup>, der eine Absatznummer ist: «1», «1bis», «1sexies», «2a». */
export const ABSATZ_NR_INHALT = new RegExp(`^\\d+${SUFFIX_ALT}?[a-z]?$`);
