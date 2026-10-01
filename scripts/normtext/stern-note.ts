// ─── Sternchen-Verweisnote als <p class="absatz8pt …"> (P3b, W2·27-BUND-FERTIG) ───
//
// Befund (Fedlex-Frische-Lauf 36838192603, 1.10.2026): die redaktionellen Sternchen-Noten der VRV
// («* Vgl. Art. 18.», «* Für die Zeichengebung vgl. Art. 28.» — amtlicher Erlasstext, kein Apparat)
// zeichnete Fedlex in der Konsolidierung 20260701 als <p class="man-template-tab-krpr …"> aus (Alt 7 des
// Extraktors, W2·5b/P3), in 20261001 als <p class="absatz8pt man-space-before-3">. «absatz8pt» trifft
// Alt 1 NICHT (\babsatz\b: «z» und «8» sind beides Wortzeichen) → die 7 Noten fielen stumm aus dem
// Snapshot; check:segmente (Modus C) meldete «7 NEUE fehlende Segmente» (VRV art_1/10/18/19/24/71/95).
//
// Übernommen wird NUR die Sternchen-Note (Inhalt beginnt mit «*» bzw. «<sup>*</sup>»). Die übrigen
// absatz8pt-Kleindruck-Absätze (Inkrafttreten-Datumslisten u.ä.; korpusweit 135, davon 0 mit Stern
// ausser VRV, Messung 1.10.2026) bleiben wie bisher DEFERIERT (check:p-klassen BEWUSST_IGNORIERT).
// Eine einzige Definition (§5) für Extraktor UND Tor check:p-klassen.
// Belege: src/tests/normtext-sternnote.test.ts.

/** Beginn des <p>-Inhalts: «*» nackt oder als <sup>*</sup> (ggf. nach Leerraum/&nbsp;/<inl>). */
const STERN_ANFANG = '(?:\\s|&nbsp;|<\\/?inl>)*(?:<sup\\b[^>]*>\\s*\\*\\s*<\\/sup>|\\*)';

/** Alternative für die Block-Regex des Extraktors (eine Fanggruppe = <p>-Inhalt). */
export const STERN_NOTE_ALTERNATIVE =
  '<p[^>]*\\bclass="[^"]*\\babsatz8pt\\b[^"]*"[^>]*>' + `(${STERN_ANFANG}(?:(?!</p>)[\\s\\S])*?)</p>`;

const STERN_ANFANG_RE = new RegExp(`^${STERN_ANFANG}`, 'i');

/** Ist dieses <p> (Klasse + Inhalt) eine Sternchen-Verweisnote, die der Extraktor übernimmt? */
export function istSternNote(klasse: string, inner: string): boolean {
  return /\babsatz8pt\b/.test(klasse) && STERN_ANFANG_RE.test(inner);
}
