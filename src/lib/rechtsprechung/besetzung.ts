// ─── Spruchkörper-Besetzung — Fassade ────────────────────────────────────────
//
// RISIKOPFAD (Anonymisierung + Namens-Identität). Der Inhalt dieser Datei liegt
// seit QS-CODE-SPLITS in zwei Geschwister-Modulen unter
// `src/lib/rechtsprechung/besetzung/`, geschnitten an der bereits vorhandenen
// Phasen-Trennlinie der Altdatei und gerichtet ohne Zyklus verkettet:
//
//   parser.ts — Freitext-Parser (Marker-Tabellen, fold, Tokenisierung,
//               Slug-Bildung, Anonymisierungs-Guard, parseBesetzung)
//   kanon.ts  — korpus-globaler Kanon-Pass (KanonEintrag, kanonisiere);
//               importiert `kanonSlug` aus parser.ts, nie umgekehrt
//
// Die fachlichen Grenzen gelten unverändert und sind am Fundort dokumentiert:
// Richter/Gerichtsschreiber sind amtlich NAMENTLICH, Parteien/Gutachter sind
// ANONYMISIERT und dürfen NIE als Richter erfasst werden (harter Guard); lässt
// sich ein Freitext nicht sicher strukturieren, wird nichts fabriziert (§8).
//
// Diese Datei bleibt der EINE Importpfad für alle Konsumenten
// (`@/lib/rechtsprechung/besetzung`) und re-exportiert exakt die bisherige
// öffentliche Oberfläche — unverändert, verhaltensneutral, keine Ergänzung und
// keine Auslassung (§6).

export { istAnonymisiert, fold, kanonSlug, bereinigeBesetzungsFreitext, parseBesetzung } from './besetzung/parser';
export type { RichterRolle } from './besetzung/parser';

export { kanonisiere } from './besetzung/kanon';
export type { KanonEintrag } from './besetzung/kanon';
