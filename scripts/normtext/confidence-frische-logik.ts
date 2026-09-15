/**
 * Reine Vergleichslogik für `check:confidence-frische` (§17, Wurzel-Befund
 * Prüfer #848, 15.9.2026): `confidence.json` trug bislang nur ein von Hand
 * gesetztes `erzeugt`-Datum — nichts koppelte den Report an den Korpus, darum
 * alterte die Datei drei Monate unbemerkt (Report blieb inhaltlich stehen,
 * während sich die Normtext-Snapshots weiterentwickelten).
 *
 * Seit report:confidence --schreibe (scripts/normtext/check-confidence.ts)
 * trägt confidence.json zusätzlich `korpus.sha` — den `normtext.db.artikel.sha`
 * aus dem committeten `daten-manifest.json` zum Schreibzeitpunkt. Dieser Wert
 * bewegt sich mit JEDER inhaltlichen Snapshot-Änderung (bloecke_json, Titel,
 * aufgehoben, …), weil er über alle Zeilen der ins Manifest eingehenden
 * `artikel`-Tabelle läuft und diese Tabelle 1:1 aus genau den Dateien gebaut
 * wird, die auch `report:confidence` einliest (public/normtext/{bund,kanton}
 * ohne index.json — geprüft scripts/datenhaltung/ingest.ts::ingestNormtextZiel).
 * `daten-manifest.json` selbst wird unabhängig gegen den frisch gebauten
 * Korpus verifiziert (Drift-Tor `check:datenhaltung`) — dieses Tor hier prüft
 * NUR die Kopplung `confidence.json` ↔ `daten-manifest.json`, nicht ein
 * drittes Mal den Korpus selbst (§17-Gegengewicht: keine Doppelprüfung).
 *
 * §2: rein, deterministisch — keine Filesystem-Zugriffe hier (die FS-Hülle
 * ist check-confidence-frische.ts).
 */

export interface FrischeEingabe {
  /** confidence.json: korpus.sha (fehlt bei Alt-Dateien ohne Kopplung). */
  gemeldeterKorpusSha: string | undefined;
  /** aktuell aus daten-manifest.json gelesener normtext.db.artikel.sha. */
  aktuellerManifestSha: string;
  /** confidence.json: zusammenfassung.erlasse. */
  gemeldeteErlasse: number;
  /** jetzt gezählte Anzahl Snapshot-Dateien in public/normtext/{bund,kanton} (ohne index.json). */
  aktuelleDateianzahl: number;
  /** confidence.json: erzeugt (für die Grün-Zeile, keine Prüfbedingung). */
  erzeugt: string | undefined;
}

export type FrischeGrundKlasse = 'sha-fehlt' | 'sha-abweichung' | 'anzahl-abweichung';

export interface FrischeGrund {
  klasse: FrischeGrundKlasse;
  text: string;
}

export interface FrischeBefund {
  frisch: boolean;
  gruende: FrischeGrund[];
}

/**
 * (a) korpus.sha fehlt (Alt-Datei ohne Kopplung),
 * (b) korpus.sha weicht vom aktuell im Manifest stehenden Wert ab,
 * (c) zusammenfassung.erlasse weicht von der jetzt gezählten Dateianzahl ab.
 * Jede zutreffende Bedingung erzeugt einen eigenen Grund — nicht nur die erste.
 */
export function pruefeFrische(eingabe: FrischeEingabe): FrischeBefund {
  const gruende: FrischeGrund[] = [];

  if (eingabe.gemeldeterKorpusSha === undefined) {
    gruende.push({
      klasse: 'sha-fehlt',
      text: 'confidence.json trägt kein korpus.sha (Alt-Datei ohne Manifest-Kopplung).',
    });
  } else if (eingabe.gemeldeterKorpusSha !== eingabe.aktuellerManifestSha) {
    gruende.push({
      klasse: 'sha-abweichung',
      text:
        `korpus.sha (${eingabe.gemeldeterKorpusSha.slice(0, 12)}…) weicht vom aktuellen ` +
        `daten-manifest.json#normtext.db.artikel.sha (${eingabe.aktuellerManifestSha.slice(0, 12)}…) ab.`,
    });
  }

  if (eingabe.gemeldeteErlasse !== eingabe.aktuelleDateianzahl) {
    gruende.push({
      klasse: 'anzahl-abweichung',
      text:
        `zusammenfassung.erlasse (${eingabe.gemeldeteErlasse}) weicht von der aktuellen Zahl ` +
        `der Snapshot-Dateien im Korpus (${eingabe.aktuelleDateianzahl}) ab.`,
    });
  }

  return { frisch: gruende.length === 0, gruende };
}
