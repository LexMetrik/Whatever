import type { BrowseErlass } from '../../../lib/normtext/browse-typen';
import { formatiereDatum } from '../helpers';

// ═══ W2·5m · DER WEG ZU DEN ROHDATEN EINES ERLASSES (§7-Transparenz) ════════
//
// Auftrag ROADMAP W2·5m-LESER-V3, Zeile «Rohdaten-Link je Erlass (JSON-Snapshot/
// AKN-Quelle, Stand, Fassungs-Token) im Leser-Kopf — §7-Transparenz, Muster
// legislation.gov.uk «Print Options»».
//
// ─── WARUM IN DER ÜBERSICHTSBOX UND NICHT IM ERLASS-KOPF ────────────────────
// Ä81/Ä97 (18.8.2026) haben die Arbeitsteilung der beiden Köpfe ausdrücklich
// gezogen und gemessen:
//     Kopf = WELCHER Erlass, WIE AKTUELL, WO die amtliche Fassung
//     Box  = WOHER er kommt und WIE er gebaut ist
// «Woher kommt dieser Text» ist genau die Frage, die ein Rohdaten-Link
// beantwortet — und der Kopf ist der Ort, an dem eine zusätzliche technische
// Zeile am teuersten wäre (er steht auf jeder Breite vor dem ersten Artikel).
//
// ─── WARUM EIGENES BAUTEIL UND NICHT EIN DRITTER `UebersichtLink` ───────────
// (1) FACHLICH — `links` führt zu AMTLICHEN Zielen (Fedlex-Fassung, amtliches
//     PDF). Der JSON-Schnappschuss ist das Gegenteil: UNSER Artefakt, die
//     Kopie. Beide in einer Reihe liessen offen, welcher Link die massgebliche
//     Fassung trägt — genau die Verwechslung, die §7 und §8 hier verbieten.
// (2) MECHANISCH — `uebersichtAngaben.ts` stand am 14.9.2026 bei 417 Zeilen
//     gegen den 420er-Deckel aus `leser-v3-fundament.test.ts`, und dieselbe
//     Sonde verlangt, dass `leserV3Modell.ts` (419) der grösste Baustein
//     BLEIBT. Vier zusätzliche Zeilen dort hätten beide Sonden gerissen. Der
//     ROADMAP-Punkt «Tor-Konflikt `erlassAnsicht.ts`-Deckel» beschreibt
//     dieselbe Enge von der anderen Seite. Ein eigenes Bauteil ist hier also
//     nicht die Ausweichbewegung, sondern die Antwort, die §6.6 ohnehin gibt:
//     eine neue Frage bekommt eine neue Datei, statt eine volle zu füllen.
//     (Der Deckel selbst bleibt unangetastet — ihn zu verschieben ist der
//     eigene, in der ROADMAP notierte Wurzel-Fix, kein Nebenprodukt hier.)
//
// ─── WAS HIER BEWUSST NICHT STEHT: DER FASSUNGS-TOKEN IM KLARTEXT ───────────
// Der Auftrag verlangte ihn sichtbar. Ä71 (18.8.2026) hat ihn mit Messung aus
// der Box entfernt: in seiner Datumsform ist er der Stand in anderer Notation
// (§5-Dopplung), in seiner Hash-Form — 1231 von 1469 Erlassen — ist er
// Maschinen-Provenienz, und CLAUDE.md §7 Bst. d verlangt die
// Drift-ERKENNUNG gegen die Quelle, nicht den Abdruck des Hashes im Lesekopf.
// Gebaut ist darum die Ä71-Linie: der Token steht IN der verlinkten Datei,
// zusammen mit allem anderen, wogegen man uns prüfen kann. Ä71 und seine Sonde
// (`src/tests/leser-v3-uebersicht.test.ts`) bleiben unverändert stehen (§0
// Ziff. 2b); die Abweichung vom Auftrag ist offengelegt, nicht übergangen
// (§7, letzter Absatz) — sie umzudrehen ist ein Entscheid Davids, kein Bau.
//
// Rein und deterministisch (§2): kein DOM, keine Uhr, kein Speicher.

/** Der Zeiger auf den Schnappschuss, aus dem der Leser rendert. */
export interface RohdatenZeiger {
  /** App-eigene Adresse des Snapshots, z. B. `/normtext/bund/OR.json`. */
  href: string;
  /** Der Stand, den DIESE Datei trägt — derselbe Wert wie die Zeile «Stand»
   *  der Box, in derselben Schreibung (§5). Er steht hier ein zweites Mal,
   *  weil die Aussage eine andere ist: dort «so alt ist der Text», hier «das
   *  ist die Fassung, die in dieser Datei liegt» (§7 Bst. a — kein Artefakt
   *  ohne Datum). `null` bei den 2 von 1469 Erlassen ohne Stand (VD, B8):
   *  lieber kein Datum als eine leere Präposition. */
  stand: string | null;
}

/**
 * `erlass.datei` ist der Pfad relativ zu `public/normtext` (`bund/OR.json`);
 * ausgeliefert wird derselbe Pfad unter `/normtext/` — die Datei wird nicht ein
 * zweites Mal benannt, nur ihr Präfix ergänzt (§5). Kein `if (bund)`: der
 * Kantons-Snapshot liegt unter demselben Präfix (Ä70).
 *
 * Ohne `datei` gibt es keinen Snapshot (`nur-live-link`, `pdf-embed`) — dann
 * `null` und damit gar keine Zeile, statt eines Links ins Leere. Dieselbe
 * §8-Regel, nach der ein fehlendes `quelleUrl` keinen toten Link erzeugt.
 */
export function rohdatenZeiger(erlass: BrowseErlass): RohdatenZeiger | null {
  if (!erlass.datei) return null;
  return {
    href: `/normtext/${erlass.datei}`,
    stand: erlass.stand ? formatiereDatum(erlass.stand) : null,
  };
}
