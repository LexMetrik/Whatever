import { grundartMeta } from '../helpers';
import { UebersichtBox } from './UebersichtBox';
import { uebersichtsAngaben } from './uebersichtAngaben';
import { rohdatenZeiger } from './rohdatenZeiger';
import type { BestimmungsWort } from './erlassAnsicht';
import type { LeserV3Modell } from './leserV3Modell';

// ─── Zone A der Seitenleiste: die EINE Übersichtsbox (Kap. 4b ①, Pos. 10) ────
//
// Herausgelöst aus `LeserRahmenV3.tsx` (H2b, §6.6): der Rahmen ist die Datei, die
// man liest, um die HÜLLE zu verstehen — «wo steht was». Die Zusammenstellung der
// Übersicht ist dagegen ein Bauteil mit einer eigenen Frage («was muss man beim
// Ankommen über diesen Erlass wissen»), und sie war der grösste zusammenhängende
// Block darin, der keine Layout-Entscheidung trifft.
//
// §3: reine Anordnung — und seit Ä70 nicht einmal mehr das. Die AUSWAHL der
// Angaben liegt in `./uebersichtAngaben.ts` (rein, ohne DOM, je Erlassart per
// Vitest geprüft), die DARSTELLUNG in `./UebersichtBox.tsx`. Diese Datei ist nur
// noch die Verdrahtung dazwischen: sie holt aus dem Modell, was die reine
// Funktion braucht, und reicht das Ergebnis weiter. Hier wird nichts gerechnet,
// nichts entschieden und nichts formuliert.
//
// ── WAS Ä70 AN DIESER STELLE AUFGELÖST HAT ──────────────────────────────────
// Bis hierher rief die Datei den GETEILTEN Baustein `parts/ErlassUebersicht`
// auf — dieselbe Komponente, die die Ist-Hülle in ihrer BREITEN Zone C rendert.
// Das war die Wurzel der Ästhetik-Befunde: jede ihrer Zeilen ist `truncate`
// (einzeilig, feste Höhe — für die breite Spalte richtig kalibriert), und in der
// 18-rem-Leiste kappte sie darum bis zu 284 px echten Text. Dazu kamen ihre
// eigene Überschrift «Erlass-Übersicht» und ihre eigene zweite Klappe «Mehr zu
// diesem Erlass», beide sinnvoll in einer eigenständigen Sektion, beide falsch
// INNERHALB einer Box, die schon «Übersicht» heisst und schon aufgeklappt ist.
//
// Der Baustein bleibt unverändert — V1 rendert ihn weiter Zeichen für Zeichen
// gleich (FL-4: die eingefrorene Hülle hängt nie an der neuen). Die V3-Box baut
// ihre Zeilen jetzt selbst; die geteilten ABLEITUNGEN (`erlassOrgan`,
// `nurErlassdatum`, `verifiziertesSachgebiet`, `teilerfassung`, `erfassungsgrad`,
// `kopfOverline`) werden dabei importiert, nicht nachgebaut (§5).
//
// ── B5 (H2b-Nachzug) · EINE QUELLE, EINMAL ZEIGEN ───────────────────────────
// Gemessen 17.8.2026 (StPO @1440, Box aufgeklappt): die Warnung stand ZWEIMAL in
// derselben Box, in zwei Wortlauten, zwei Zentimeter auseinander. B5 entfernte
// den zweiten Warn-Satz. Ä70 zieht die Konsequenz zu Ende: der Wortlaut ist jetzt
// der EINE aus `erlassKopfText.ts` (S3/F5), den auch der Erlass-Kopf setzt — und
// der Grundhinweis «Massgeblich ist stets die amtliche Fassung.», der bis hierher
// drei Zeilen unter der Warnung stand und ihren Schluss-Halbsatz wiederholte,
// entfällt (er steht unverändert im Erlass-Kopf).
// Die `aufgehoben`-Grenze bleibt, wo sie seit B5 liegt: in der reinen Funktion,
// weil sie eine fachliche Grenze ist (§8) und keine Anordnungsfrage.

export function LeserUebersicht({ m, bestimmungsWort }: {
  m: LeserV3Modell;
  /** Zähl-Substantiv aus dem Grundart-Register (§5, EINE Ableitung im Rahmen).
   *  B8: der Typ kommt aus `./erlassAnsicht`. */
  bestimmungsWort: BestimmungsWort;
}) {
  const { erlass, eintraege } = m;
  if (!erlass) return null;
  const meta = grundartMeta(erlass.key);
  return (
    <UebersichtBox angaben={uebersichtsAngaben({
      erlass,
      kopf: m.kopf,
      currency: m.currency?.[erlass.key],
      erlassTyp: meta.erlassTyp,
      // W2·19-GLIEDERUNG/S9: `null` = KEIN Snapshot geladen (nur-live-link/
      // pdf-embed) — dort gibt es keine `eintraege`, und «0 Artikel» wäre eine
      // Zahl, die wir nicht haben (§8). Bis Ä70 stieg die ganze Box in diesem
      // Fall aus (`if (!erlass || !eintraege) return null`) und liess die Leiste
      // ohne jede Erlass-Auskunft; jetzt entfällt nur die eine Zahl.
      anzahl: eintraege?.length ?? null,
      bestimmungsWort,
      bestimmungsEtikettStatus: meta.bestimmungsEtikettStatus,
      gliederungsTiefe: m.gliederungsTiefe,
      kennzahlen: m.gliederung.kennzahlen,
      kantonSys: m.kantonSys,
      kantonErlassAnzahl: m.kantonErlassAnzahl,
      nichtKonsolidiert: m.nichtKonsolidiert,
      nichtKonsolidiertSeit: m.nichtKonsolidiertSeit,
    })}
      // W2·5m · der Weg zu UNSEREM Schnappschuss (§7-Transparenz). Auch das ist
      // nur Verdrahtung: die Entscheidung, OB und WOHIN, trifft die reine
      // Funktion (`./rohdatenZeiger.ts`) — hier wird nichts gerechnet.
      rohdaten={rohdatenZeiger(erlass)} />
  );
}
