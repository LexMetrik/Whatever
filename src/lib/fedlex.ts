// ─── Fedlex — Fassade ────────────────────────────────────────────────────────
//
// Der Inhalt dieser Datei liegt seit QS-CODE-SPLITS in vier Geschwister-Modulen
// unter `src/lib/fedlex/`, geschnitten entlang der vier dokumentierten Achsen und
// gerichtet ohne Zyklus verkettet:
//
//   tabelle.ts   — die FEDLEX-Konstantentabelle + FedlexGesetz
//   url.ts       — Anker-Token (artikelToken) und URL-Bau (fedlexUrl)
//   erkennung.ts — Gesetzes-Erkennung (Kürzel, Genitiv, Chapeau, Direktlink)
//   parser.ts    — Zitatformen (NORM_IM_TEXT, Fremdrouting Form B, Plural)
//   spannen.ts   — Verweis-Spannen (i.V.m.-Ketten, Erlass-Verweise ohne Artikel)
//
// Diese Datei bleibt der EINE Importpfad für alle Konsumenten (`@/lib/fedlex`)
// und re-exportiert exakt die bisherige öffentliche Oberfläche — unverändert,
// verhaltensneutral, keine Ergänzung und keine Auslassung (§6).

export { FEDLEX } from './fedlex/tabelle';
export type { FedlexGesetz } from './fedlex/tabelle';

export { artikelToken, fedlexUrl } from './fedlex/url';
export { ART_SUFFIXE, SUFFIX_ALT } from './fedlex/nummer';

export {
  erkenneFedlexGesetz,
  erkenneGenitivGesetz,
  erkenneTitelGesetz,
  chapeauZielFremdgesetz,
  fedlexLinkFuerArtikel,
} from './fedlex/erkennung';
export {
  GENITIV_EINTRAEGE, TITEL_EINTRAEGE, KUERZEL_SCHREIBWEISEN, titelGeltung,
} from './fedlex/positivliste';
export type { FremdEbene, Geltung, GenitivEintrag, TitelEintrag, TitelKopf } from './fedlex/positivliste';
export { TRAEGER_EINTRAEGE, traegergesetzFuerErlass } from './fedlex/traegergesetz';
export type { TraegerEintrag } from './fedlex/traegergesetz';

export {
  NORM_IM_TEXT,
  fremdgesetzNachArtikel,
  fremdRoutingFormB,
  artikelnPluralVerweise,
} from './fedlex/parser';
export type { FremdRoutingGlied, FremdSignal, PluralRegion } from './fedlex/parser';
export { normVerweiseImText, erlassVerweiseImText, ausgeschriebeneVerweiseImText } from './fedlex/spannen';
export type { NormVerweisSpan } from './fedlex/spannen';
