import { labelMitBereich, artikelGanzAufgehoben } from '../../../lib/normtext/darstellung';
import type { NormSnapshot } from '../../../lib/normtext/typen';

// ═══ W2·5m · NACHBAR-ARTIKEL: «‹ Art. 89» / «Art. 90a ›» ════════════════════
//
// Auftrag ROADMAP W2·5m-LESER-V3, Zeile «Nachbar-Artikel-Pfeile … Muster
// gesetze-im-internet/dejure/buzer». Die Zeile löst F6 des Fahrplans ein, der
// 16.8.2026 mit «Nein, nicht in V3 — nach der Landung als eigener kleiner
// Schritt bewerten» beschieden war: bewertet, aufgenommen, hier gebaut. Der
// Fahrplan-Eintrag bleibt unverändert stehen (§0 Ziff. 2b — ein datierter
// Entscheid wird ergänzt, nicht nachgeführt).
//
// ─── DIE REIHENFOLGE WIRD NICHT ERFUNDEN ────────────────────────────────────
// Nachbar heisst: der Eintrag DAVOR und DANACH in `eintraege` — genau der
// Reihung, aus der `../inhalt-ableitungen.tsx` (`artIndex`, Z. 32–35) die
// Dokument-Position jedes Artikels zieht und nach der `./LeserLesespalte.tsx`
// Sektionen und freie Artikel mischt. Es gibt hier KEINEN Vergleich von
// Artikel-Nummern, keine Sortierung, keine Sonderregel für «a»-Artikel: dass
// Art. 90a zwischen 90 und 91 steht, sagt der Snapshot, nicht eine Heuristik.
// Eine zweite Ordnung neben der amtlichen wäre genau die zweite Wahrheit, die
// §5 verbietet — und bei «22 a», «36–42» oder «10. 1» auch prompt falsch.
//
// ─── AUFGEHOBENE ARTIKEL WERDEN NICHT ÜBERSPRUNGEN (§8) ─────────────────────
// Sie sind Teil der amtlichen Reihung; wer von Art. 348 ZGB weiterblättert,
// landet auf Art. 349 — und sieht dort «· aufgehoben», wie überall sonst im
// Leser. Ein Pfeil, der still über die Lücke springt, verschwiege dem Leser,
// DASS die Bestimmung aufgehoben wurde: das ist keine Bequemlichkeit, sondern
// eine falsche Auskunft über den Erlass. Der Zustand wandert stattdessen in den
// zugänglichen Namen des Links (`aufgehoben`), damit die Sprachausgabe ihn
// nennt, bevor man springt.
//
// Rein und deterministisch (§2): kein DOM, keine Uhr, kein Speicher.

/** Ein Sprungziel: Token für den Anker, Label für die Beschriftung. */
export interface NachbarZiel {
  /** Artikel-Token (`e.artikel`) — der Anker `#art-<token>`. */
  token: string;
  /** Anzeige-Label («Art. 90a», «Art. 31–32») aus `labelMitBereich` (§5). */
  label: string;
  /** Der Nachbar ist ganz aufgehoben — geht in den aria-Namen, nie ins Weglassen. */
  aufgehoben: boolean;
}

/** Was an EINEM Artikel steht. Beide Seiten dürfen fehlen (erster/letzter Eintrag). */
export interface ArtikelNachbarn {
  vor: NachbarZiel | null;
  nach: NachbarZiel | null;
}

const ziel = (e: NormSnapshot): NachbarZiel => ({
  token: e.artikel,
  // §5: dieselbe Ableitung, die `../inhalt-ableitungen.tsx` für
  // `artLabelByToken` benutzt — ein Schlusstitel-Token («disp_u1_art_3») lässt
  // sich NICHT aus dem Token raten, der Eintrag trägt sein Label selbst.
  label: labelMitBereich(e.artikelLabel, e.artikel),
  // §5: dieselbe Prüfung, die `parts/ArtikelLeser` für seine eigene Zeile
  // «· aufgehoben» stellt (dort Z. 142) — Marker vor Text-Heuristik.
  aufgehoben: artikelGanzAufgehoben(e.bloecke, e.aufgehoben),
});

/**
 * Token → Vorgänger/Nachfolger, EINMAL über die Liste gebaut.
 *
 * Die Werte sind referenz-STABIL, solange `eintraege` dieselbe Liste ist — das
 * ist Bedingung, nicht Zierde: `parts/ArtikelLeser` ist `memo`, und ein frisch
 * gebautes Objekt je Artikel und Render hübe die Schranke über alle 1686
 * Artikel des OR auf (§15, dieselbe Lehre wie `onImBlatt` in
 * `./panelModell.ts`). Darum gibt die Funktion eine Map zurück und keinen
 * Sucher, der bei jedem Aufruf neu baut.
 *
 * Der erste Eintrag hat kein `vor`, der letzte kein `nach` — dann steht dort
 * nichts (kein leerer Pfeil, kein toter Link).
 */
export function baueNachbarn(eintraege: NormSnapshot[] | null): Map<string, ArtikelNachbarn> {
  const map = new Map<string, ArtikelNachbarn>();
  const liste = eintraege ?? [];
  for (let i = 0; i < liste.length; i++) {
    map.set(liste[i].artikel, {
      vor: i > 0 ? ziel(liste[i - 1]) : null,
      nach: i < liste.length - 1 ? ziel(liste[i + 1]) : null,
    });
  }
  return map;
}
