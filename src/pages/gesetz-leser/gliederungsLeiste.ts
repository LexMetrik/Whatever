import { zeilenAnsicht, type GliederungsKnoten } from './gliederungsModell';

// ─── Zustand der Leisten-Knöpfe, abgeleitet aus dem SICHTBAREN ───────────────
// (eigene Datei: gliederungsModell.ts liegt knapp unter der §6.6-Grenze von 800 Zeilen)

/**
 * Steht der Baum GANZ offen — so, wie «alles auf» ihn hinterlässt? (Beschriftung
 * des Knopfs «alles auf/zu», W2·17-UI-BEFUNDE B1-B03/B04, 2.10.2026.)
 *
 * Aus dem SICHTBAREN abgeleitet (`zeilenAnsicht`), nicht aus der Klapp-Karte: eine
 * Zeile, die das Modell offen startet (`startOffen`/`startOffeneTiefe` — der
 * Anhang-Ast in B2/B4, B1 offen), hat keinen Karten-Eintrag. Die Karten-Prüfung
 * (`alleOffen` in `./klappKarte`, seither entfallen) las dort «nicht offen»: der Knopf hiess «alles
 * auf», obwohl alles zu sehen war, und sein erster Klick änderte nur die
 * Beschriftung (EMRK-Anhang). Jede Zeile mit Kindern muss offen sein UND ALLE
 * ihre Kinder zeigen (die Artikel-Ebene eingeschlossen); eine zu bricht ab —
 * darunter gibt es nichts Sichtbares mehr zu prüfen.
 */
export function baumGanzOffen(
  knoten: readonly GliederungsKnoten[], offen: Record<string, boolean>, startOffeneTiefe: number,
): boolean {
  let klappbar = false;
  const geh = (ks: readonly GliederungsKnoten[]): boolean => ks.every((k) => {
    if (k.kinder.length === 0) return true;
    klappbar = true;
    const { auf, sichtbareKinder } = zeilenAnsicht(k, offen, startOffeneTiefe);
    return auf && sichtbareKinder.length === k.kinder.length && geh(sichtbareKinder);
  });
  return geh(knoten) && klappbar;
}
