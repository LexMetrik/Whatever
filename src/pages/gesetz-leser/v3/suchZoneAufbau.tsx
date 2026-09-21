import type { ReactNode } from 'react';
import { SuchZone } from './SuchZone';
import type { BestimmungsWort } from './erlassAnsicht';
import { MarkenSchalter } from '../../../components/leser/MarkenSchalter';

// ═══ DER AUFBAU DER KLEBENDEN SUCH-ZONE ══════════════════════════════════════
//
// ANLASS DER AUSLAGERUNG — eine WECHSELWIRKUNG, kein einzelner Zufluss: die
// Fundament-Sonde `src/tests/leser-v3-fundament.test.ts` verlangt, dass der
// Adapter `leserV3Modell.ts` der grösste Baustein von `v3/` bleibt (Auflage 1).
// Zwei parallel gebaute Zweige haben diese Ordnung zusammen gekippt, keiner
// allein; ausgelagert ist darum genau die NAHT, an der die beiden Zuflüsse sich
// trafen (Herleitung im Vollzugsvermerk 17.8.2026).
//
// §3: reine Anordnung — die Funktion setzt Elemente zusammen und entscheidet
// nichts, was der Rahmen nicht schon entschieden hat.
//
// ── D38 (7.9.2026) · DAS BLATT AM FELD IST GEFALLEN ─────────────────────────
// Hier hing bis zum 7.9.2026 das Treffer-Blatt (Ä76): 18 rem breit, halbe
// Fensterhöhe, `absolute` unter dem Feld — die Notlösung für den Desktop mit
// eingeklappter Gliederung. Sie ist mit D38 gegenstandslos: die Trefferliste hat
// jetzt in JEDER Lage die Lesefläche (`./LeserTrefferSpalte`), es gibt also
// keinen Fall mehr, in dem sie nirgends stünde. §17 — gestrichen statt bewacht:
// gefallen sind mit ihm `LeserTrefferBlatt.tsx`, die Props `blatt`/`blattOffen`
// der Zone, die Fallunterscheidung `istXl` (Blatt gegen Bottom-Sheet) und der
// Weg `onSheet`, der die Treffer ins Gliederungs-Sheet zog. Was bleibt, ist die
// Zähler-Zeile: sie sagt die Zahlen und führt mit «Treffer anzeigen →» zur
// Liste zurück, sobald der Leser sie weggeschaltet hat.

/**
 * Baut die klebende Such-Zone des Kopf-Blocks — oder gibt `undefined` zurück,
 * wo der Erlass gar keine Gliederung und damit keine Suche hat.
 *
 * D28 (David 6.9.2026): `klebt` sagt NICHT «die Gliederung steht nicht als
 * Spalte», sondern nur «dieser Erlass hat überhaupt eine Gliederung» — das Feld
 * sitzt in JEDER Lage hier (Herleitung in `./SuchZone`).
 */
export function suchZoneAufbau(a: {
  /** Hat der Erlass eine Gliederung? Ohne sie gibt es nichts zu durchsuchen. */
  klebt: boolean;
  sucheAktiv: boolean;
  /** A2: Gliederungs-Sheet offen ⇒ das Feld steht DORT, die Zone gibt es her
   *  (§5/K2 — genau EIN Feld im DOM). Die Zone bleibt mit unveränderter Höhe
   *  stehen, damit das Chrome hinter dem Overlay nichts verschiebt. */
  feldImSheet: boolean;
  suchFeld: ReactNode;
  bestimmungen: number;
  fundstellen: number;
  bestimmungsWort: BestimmungsWort;
  /** «Treffer anzeigen →» — holt die Liste über die Lesespalte zurück. */
  onListe: () => void;
  /** D28 · Schritt durch die Fundstellen, sichtbar neben dem Zähler (`./SuchZone`). */
  onVor?: () => void;
  onZurueck?: () => void;
  /** Liegt die Trefferliste GERADE über der Lesespalte? Dann schweigt die
   *  Zähler-Zeile — Zahlen und ↑↓ stehen in ihrer eigenen Werkzeugzeile, aus
   *  derselben Quelle (§5). Herleitung am gleichnamigen Prop in `./SuchZone`. */
  listeSteht: boolean;
  /** W2·28 · L-2 · Zustand des Schalters «Hervorhebung». Das ELEMENT baut diese
   *  Datei (nicht der Rahmen): sie ist ohnehin die Naht, an der die Such-Zone
   *  ihre Teile bekommt, und `./SuchZone` soll ein reiner Renderer bleiben. */
  markenAus: boolean;
  setzeMarkenAus: (aus: boolean) => void;
}): ReactNode | undefined {
  if (!a.klebt) return undefined;
  return (
    <SuchZone suchFeld={a.feldImSheet ? undefined : a.suchFeld} sucheAktiv={a.sucheAktiv}
      bestimmungen={a.bestimmungen} fundstellen={a.fundstellen}
      bestimmungsWort={a.bestimmungsWort}
      onListe={a.onListe}
      onVor={a.onVor} onZurueck={a.onZurueck} listeSteht={a.listeSteht}
      markenSchalter={<MarkenSchalter aus={a.markenAus} onSchalten={a.setzeMarkenAus} />} />
  );
}
