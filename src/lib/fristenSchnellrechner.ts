import { parseISO } from 'date-fns';
import { betreibungsperiodeFuer } from '../data/schkgFeiertage';
import type { FeiertagsKontext } from '../data/zpoFeiertage';
import { formatDatum } from './datumsUtils';

// ─── Regeln des einfachen Fristenrechners (Tagerechner), RV-37/49/52/53 ────────
//
// Die Komponente `EinfacheFristForm` rechnet nicht selbst (§3): welcher Feiertags-
// Kontext zu welchem Regime gehört und wann ein Hinweis fällig ist, steht hier.
// Rein, deterministisch, kein Date.now() (§2).

/** Regime-Wahl des einfachen Rechners (Spiegel von `Ferien` in einfacheFristTexte.ts). */
export type SchnellRegime = 'keine' | 'stpo' | 'zpo' | 'schkg' | 'vwvg' | 'bgg';

/**
 * Feiertags-Kontext je Regime (RV-53): bestimmt, welche bedingten kantonalen Tage
 * (NE-Schliesstage, SO 1. Mai, GL 2.1.) im Kalender als arbeitsfrei markiert werden —
 * derselbe Kontext, mit dem die jeweilige Engine rechnet (zpoFeiertage.ts «Bedingte
 * kantonale Feiertage»). 'keine' = Art. 78 OR = 'allgemein'.
 */
export function feiertagsKontextFuer(regime: SchnellRegime): FeiertagsKontext {
  return regime === 'keine' ? 'allgemein' : regime;
}

/**
 * RV-52: Der einfache Rechner kennt den Auslöser nicht und ruft die SchKG-Engine darum
 * ohne ihn auf; die Sonderregel «Zustellung einer Betreibungsurkunde in den Betreibungs-
 * ferien» (BGE 121 III 284 E. 2b/c; Art. 56 Abs. 1 Ziff. 2 SchKG, Fedlex SR 281.1,
 * schkgFristen.ts «BINDUNG») greift deshalb nie. Fällt das Ereignis in die Betreibungs-
 * ferien, legt dieser Satz das offen. `null` ausserhalb der Ferien oder bei ungültigem Datum.
 */
export function schkgFerienzustellungHinweis(ereignisISO: string): string | null {
  const ereignis = parseISO(ereignisISO);
  if (isNaN(ereignis.getTime())) return null;
  const ferien = betreibungsperiodeFuer(ereignis);
  if (!ferien) return null;
  return `Das Ereignis (${formatDatum(ereignis)}) fällt in die Betreibungsferien (${formatDatum(ferien.von)}–${formatDatum(ferien.bis)}). `
    + 'Ist es die Zustellung eines Zahlungsbefehls oder einer Konkursandrohung, wirkt die Zustellung erst am ersten Tag '
    + 'nach den Ferien und die Frist beginnt erst dann zu laufen (BGE 121 III 284 E. 2b/c). '
    + 'Dieser Schnellrechner kennt den Auslöser nicht und rechnet ab dem eingegebenen Datum – das Fristende kann dadurch '
    + 'zu früh liegen. Im SchKG-Rechner den Auslöser «Zustellung Zahlungsbefehl» bzw. «Zustellung Konkursandrohung» wählen.';
}
