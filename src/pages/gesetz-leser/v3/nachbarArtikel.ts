import {
  labelMitBereich, artikelLeerstellenStatus, type LeerstellenStatus,
} from '../../../lib/normtext/darstellung';
import type { StrukturMap } from '../../../lib/normtext/browse';
import type { NormSnapshot } from '../../../lib/normtext/typen';
import { eindeutigeBezeichnung } from '../artikelBezeichnung';

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
// zugänglichen Namen des Links, damit die Sprachausgabe ihn nennt, bevor man
// springt.
//
// W2·27 (15.9.2026): der Zustand ist DREIwertig, seit der Leser den amtlich
// belegten Fall vom bloss vermuteten trennt. Ein Boolean hier hiesse, dem
// Nachbarn «aufgehoben» anzusagen, wo der Artikel selbst «kein Text im
// Snapshot» sagt — zwei Wörter für denselben Zustand (§5).
//
// Rein und deterministisch (§2): kein DOM, keine Uhr, kein Speicher.

/** Ein Sprungziel: Token für den Anker, Label für die Beschriftung. */
export interface NachbarZiel {
  /** Artikel-Token (`e.artikel`) — der Anker `#art-<token>`. */
  token: string;
  /** Anzeige-Label («Art. 90a», «Art. 31–32») aus `labelMitBereich` (§5). */
  label: string;
  /** Belegstufe des Nachbarn — geht in den aria-Namen, nie ins Weglassen.
   *  Wortlaut über `leerstellenWort` (§5, nie hier abgeschrieben). */
  zustand: LeerstellenStatus;
  /** B11-D04 · liegt der Nachbar in einer ANDEREN Gruppe als der Artikel, auf dem
   *  der Pfeil steht — Hauptteil gegen eine Schlusstitel-/Übergangsgruppe, oder
   *  zwei verschiedene Gruppen? Nur dann ist «Art. 3» als Beschriftung mehrdeutig:
   *  innerhalb einer Gruppe trägt der Gliederungspfad des gelesenen Artikels die
   *  Gruppe schon (Herleitung bei `nachbarBezeichnung`). Rein aus den Token (§2). */
  gruppeWechsel: boolean;
}

/** Was an EINEM Artikel steht. Beide Seiten dürfen fehlen (erster/letzter Eintrag). */
export interface ArtikelNachbarn {
  vor: NachbarZiel | null;
  nach: NachbarZiel | null;
}

/** Gruppe eines Tokens: `disp_u<N>` für Schlusstitel-/Übergangsartikel, sonst leer. */
const gruppeVon = (token: string): string => /^disp_u\d+/.exec(token)?.[0] ?? '';

const ziel = (e: NormSnapshot, von: NormSnapshot): NachbarZiel => ({
  token: e.artikel,
  // §5: dieselbe Ableitung, die `../inhalt-ableitungen.tsx` für
  // `artLabelByToken` benutzt — ein Schlusstitel-Token («disp_u1_art_3») lässt
  // sich NICHT aus dem Token raten, der Eintrag trägt sein Label selbst.
  label: labelMitBereich(e.artikelLabel, e.artikel),
  // §5: dieselbe Prüfung, die `parts/ArtikelLeser` für seine eigene Statuszeile
  // stellt — Marker vor Text-Heuristik, Beleggrund im Ergebnis.
  zustand: artikelLeerstellenStatus(e.bloecke, e.aufgehoben, e.gegenstandslos),
  gruppeWechsel: gruppeVon(e.artikel) !== gruppeVon(von.artikel),
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
      vor: i > 0 ? ziel(liste[i - 1], liste[i]) : null,
      nach: i < liste.length - 1 ? ziel(liste[i + 1], liste[i]) : null,
    });
  }
  return map;
}

// ─── B11-D04 · «Art. 1» NACH Art. 1186 IST NICHT ART. 1 ──────────────────────
// Am Übergang vom Hauptteil in eine Schlusstitel-/Übergangsgruppe nannte der
// Pfeil den Nachbarn mit dem blossen Label (OR Art. 1186 → «Art. 1 ›», ZGB
// Art. 977 → «Art. 1 ›»): wer ihn drückt, landet in den Schlussbestimmungen, nicht
// bei Art. 1. Die eindeutige Bezeichnung liefert dieselbe Quelle wie der
// «Weiterlesen»-Chip und das Panel-Zitat (`../artikelBezeichnung`, §5): Label
// plus amtlicher Name der Gruppe aus der Gliederung. Die Gruppe steht als ZWEITE
// Zeile unter dem Label (kein zweites Vokabular, keine Kurzform — §8), die volle
// Bezeichnung im zugänglichen Namen und im `title`.
//
// Nur beim Gruppenwechsel qualifiziert (`NachbarZiel.gruppeWechsel`): innerhalb
// einer 104-teiligen Schlusstitel-Gruppe stünde sonst unter JEDEM Pfeil derselbe
// lange Gruppenname.

/** Volle Bezeichnung und — wo sie das Label ergänzt — der Gruppenname allein. */
export function nachbarBezeichnung(
  ziel: NachbarZiel,
  struktur: StrukturMap | null,
): { voll: string; gruppe: string | null } {
  const voll = ziel.gruppeWechsel ? eindeutigeBezeichnung(ziel.token, ziel.label, struktur) : ziel.label;
  // `eindeutigeBezeichnung` hängt die Gruppe als « (…)» an das unveränderte Label.
  const gruppe = voll.length > ziel.label.length ? voll.slice(ziel.label.length).replace(/^ \(|\)$/g, '') : null;
  return { voll, gruppe };
}
