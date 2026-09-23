// ─── Reine Regel-Lib: Identitäts-Kopf eines Entscheids ──────────────────────
//
// Leitet aus einem EntscheidSnapshot das Anzeige-Modell des EINHEITLICHEN
// Detailseiten-Kopfs ab (§3: keine UI, kein JSX — nur Daten→Daten). Die
// Komponente (EntscheidLeser.tsx) rendert das Modell, ohne selbst eine
// Ableitungsregel zu kennen.
//
// Ziel (Auftrag David 24.6.2026): jeder BGE-Detailseite liegt derselbe Aufbau
// zugrunde — Identität → genau EINE Thema-Aussage → (befüllte) Rubrum-Zeilen.
// Nie ein Loch, nie ein separater Block, der mal auftaucht; nichts erfunden (§8).
//
// SSoT (§5): die Thema-Synthese kommt aus synthThema() (browse.ts), die
// Regeste-Kürzung aus normalisiereRegeste()+kuerzeRegeste() (register.ts) —
// hier KEINE zweite Kaskade, keine eigene Textglättung.

import type { EntscheidSnapshot } from './typen';
import { synthThema } from './browse';
import { rubrumAusAmtlichemStrukturfeld, rubrumFeldPlausibel, type RubrumFeld } from './rubrum';

export type KopfLabelKey = RubrumFeld;

/** Feste Reihenfolge der Rubrum-Zeilen im Kopf (amtliche Rubrum-Folge, Art. 112 BGG). */
const RUBRUM_ORDER: KopfLabelKey[] = ['gegenstand', 'parteien', 'vorinstanz', 'besetzung'];

interface KopfRubrumZeile {
  label: KopfLabelKey;
  wert: string;
}

export interface KopfModell {
  /**
   * Abgeleitete Sachgebiets-Leitzeile (synthThema) — nur gesetzt, wenn den
   * Thema-Anker sonst NICHTS trägt: weder ein Rubrum-Gegenstand noch die (im
   * Reader unter dem Kopf gezeigte) Regeste. So bleibt der Kopf einheitlich,
   * ohne die Regeste zu doppeln; nichts erfunden (§8, nur echte Strukturfelder).
   */
  leitzeile: string | null;
  /** Nur plausible Rubrum-Felder, in fester Reihenfolge. */
  rubrumZeilen: KopfRubrumZeile[];
}

/**
 * Kopf-Modell eines Entscheids (rein/deterministisch). Der Kopf trägt die
 * Identität; eine Thema-Aussage steht IMMER genau einmal zur Verfügung —
 * entweder über einen Rubrum-Gegenstand, die Regeste-Box oder, wenn beides
 * fehlt, die abgeleitete `leitzeile`. Keine Dopplung, kein Loch.
 */
export function kopfModell(s: EntscheidSnapshot): KopfModell {
  const r = s.rubrum;
  const rubrumZeilen: KopfRubrumZeile[] = RUBRUM_ORDER
    .map((label) => ({ label, wert: (r?.[label] ?? '').trim() }))
    // §1/§8: nur plausible Einträge zeigen — fehlgeschnittene Erwägungs-Fragmente
    // (Falsch-Positive der Extraktion) werden verworfen, nicht prominent gerendert.
    // Amtliche Strukturfelder (BS-Portal-Betreff) sind KEINE Extraktion → verbatim
    // zeigen; sonst widerspricht der Reader der Karte («amtl. Betreff», §8).
    .filter((z) => rubrumFeldPlausibel(z.label, z.wert, rubrumAusAmtlichemStrukturfeld(s.quelle)));

  const hatGegenstand = rubrumZeilen.some((z) => z.label === 'gegenstand');
  // Die Regeste-Box (Reader) zeigt jede vorhandene Regeste → dann trägt sie das
  // Thema, und eine Kopf-Leitzeile wäre eine Dopplung.
  const regesteTraegtThema = !!(s.regeste && s.regeste.text.trim());
  const leitzeile = hatGegenstand || regesteTraegtThema ? null : synthThema(s);
  return { leitzeile, rubrumZeilen };
}
