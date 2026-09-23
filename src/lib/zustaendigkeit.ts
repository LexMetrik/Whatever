// Dossier: bibliothek/normen/zpo-zustaendigkeit-regelwerk.md · bibliothek/normen/zustaendigkeit-engine-verifikation.md
//
// ─── Zuständigkeit — Fassade ─────────────────────────────────────────────────
//
// Der Inhalt dieser Datei liegt seit QS-CODE-SPLITS in drei Geschwister-Modulen
// unter `src/lib/zustaendigkeit/`, geschnitten entlang der zwei materiell
// verschiedenen Prüfungen und gerichtet ohne Zyklus verkettet:
//
//   gemeinsam.ts    — Schwellen, Eingabe-Typen, Eingabe-Validierung
//   erstinstanz.ts  — bestimmeZustaendigkeit + Berichts-Mapper (erste Instanz)
//   rechtsmittel.ts — bestimmeRechtsmittel + Berichts-Mapper (Rechtsmittelzug)
//
// Die zwei Engines sind rechtlich verschiedene Prüfungen und bleiben getrennt
// (§4) — geteilt wird nur die fachneutrale Grundlage. Diese Datei bleibt der
// EINE Importpfad für alle Konsumenten (`@/lib/zustaendigkeit`) und
// re-exportiert exakt die bisherige öffentliche Oberfläche — unverändert,
// verhaltensneutral, keine Ergänzung und keine Auslassung (§6).

export { ZPO_SCHWELLEN } from './zustaendigkeit/gemeinsam';
export type {
  Rechtsweg,
  Streitsache,
  MieteUnterfall,
  DeliktUnterfall,
  PersoenlichkeitUnterfall,
  IpUnterfall,
  ZustaendigkeitInput,
  RmObjekt,
  RmVerfahren,
  RmVorinstanz,
} from './zustaendigkeit/gemeinsam';

export { bestimmeZustaendigkeit, zustaendigkeitErgebnis } from './zustaendigkeit/erstinstanz';
export type { SchlichtungsbehoerdeTyp, ZustaendigkeitErgebnis } from './zustaendigkeit/erstinstanz';

export {
  RECHTSMITTEL_SCHWELLEN,
  bgerGebietFuerStreitsache,
  bestimmeRechtsmittel,
  rechtsmittelBericht,
} from './zustaendigkeit/rechtsmittel';
