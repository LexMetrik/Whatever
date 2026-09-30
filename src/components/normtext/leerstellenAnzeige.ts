// W2·27-BUND-FERTIG (30.9.2026, Nachzug Prüfer-Auflagen A1/A3 zu #1201) — EINE Entscheidung,
// wann ein Ersatztext «kein Text im Snapshot» heisst (§5): ArtikelBody (Körper) und SynopseKarte
// (rechte Spalte) lasen vorher je eine eigene Regex; die Synopse hatte die Wortlaut-Sperre nicht.
//
// REGEL. Nur der «…»-PLATZHALTER eines Artikels ohne amtlichen Vermerk (`leer-ungeklaert`) wird
// zu «kein Text im Snapshot». Der amtliche WORTLAUT «Aufgehoben» ist Quelle, kein Platzhalter —
// er bleibt «aufgehoben» (davon hängen die Kantonsartikel ab, die «Aufgehoben» ohne Feld tragen).
import type { LeerstellenStatus } from '../../lib/normtext/darstellung';

/** Besteht der Text NUR aus Auslassungs-Platzhalter (leer, «…», «.», Leerraum)? Dann ist er
 *  kein Wortlaut — im Gegensatz zum amtlichen Wort «Aufgehoben». */
export function istLeerPlatzhalter(text: string): boolean {
  return /^[….\s]*$/.test(text.trim());
}

/** Gilt für DIESEN Ersatztext «kein Text im Snapshot»? Nur: Artikel ohne Vermerk UND der Text
 *  ist der «…»-Platzhalter, nicht der Wortlaut «Aufgehoben». */
export function sagtKeinText(zustand: LeerstellenStatus | undefined, text: string): boolean {
  return zustand === 'leer-ungeklaert' && istLeerPlatzhalter(text);
}
