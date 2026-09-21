// scripts/entstehung/curia-zustand.ts
// Zustandsträger des Curia-Vollabgleichs (E4, §11.6). JSONL, eine Zeile je Geschäft —
// zeilenweise, damit ein Monatslauf ihn anhängend fortschreiben kann und ein Diff im PR
// lesbar bleibt.
//
// WOZU: `Modified` ist bei Curia Vista unbrauchbar (R4 §5: Business und Objective
// verschiedener Geschäfte trugen denselben Zeitstempel 10.2.2026 — systemweiter Reindex).
// Ein Delta-Sync über Zeitstempel liefe danach leer. Der Lauf ist deshalb ein
// VOLLABGLEICH, und der Zustandsträger ist der einzige Beleg, WAS ein Lauf gesehen hat:
// verschwindet ein Geschäft aus dem Shard-Verzeichnis, sieht `check:entstehung` (3) das.
//
// §18: enthält keine Zugangsdaten. §11.8: enthält KEINE Personendaten.
import { readFileSync, existsSync } from 'node:fs';

export const CURIA_DIR = 'public/materialien/curia';
export const CURIA_ZUSTAND_PFAD = 'bibliothek/register/curia-zustand.jsonl';

export interface CuriaZustand {
  /** Geschäftsnummer «17.059» (= Dateiname des Shards). */
  nummer: string;
  /** Abrufdatum ISO (§7a — die Curia-Auflage verlangt die Dokumentation). */
  abgerufen: string;
  /** sha256 des ausgelieferten Shards. */
  sha: string;
  /** Zahl der Rats-Beschlüsse (Resolution) im Shard. */
  beschluesse: number;
  /** Zahl der Kommissions-Vorberatungen (Preconsultation). */
  vorberatungen: number;
  /** true = eine NR-Schlussabstimmung wurde aggregiert ausgezählt. */
  schlussabstimmung: boolean;
  /** Zahl der gespeicherten Publikations-Fundstellen (`shard.publikationen.length`). */
  publikationen: number;
  /** Zahl der ROHEN Objective-Zeilen, die der amtliche Endpunkt geliefert hat — vor jeder
   *  Auswertung. Das ist die UNABHÄNGIGE Referenz der Kreuzprobe: `check:entstehung`
   *  verlangt `publikationen === objectiveZeilen` und wird sonst rot.
   *
   *  BERICHTIGUNG 21.9.2026 (zweite Runde, F8 — der alte Satz bleibt lesbar, statt
   *  stillschweigend ersetzt zu werden): Hier stand, `objectiveZeilen − distinkteObjective`
   *  sei «die Zahl der echt doppelt gelieferten Zeilen (08.053: 12 − 8 = 4)». Das war falsch
   *  gemessen — jene vier Zeilen unterscheiden sich in der Vorlage (`BillNumber`), sind also
   *  eigene Fundstellen und keine Doppellieferungen. Seit `publikationen[].vorlage` führt der
   *  Lauf sie getrennt; 08.053 speichert 12 von 12. Mitgezähltes Feld `distinkteObjective`
   *  entfällt damit ersatzlos: es mass dieselbe Entscheidung wie der Schlüssel und konnte
   *  dessen Fehler darum nie finden (§17-Gegengewicht — nicht beides behalten, wenn eines
   *  reicht). Echte Doppellieferungen existieren korpusweit (22.417, 26.023, 19.464 — vier
   *  Zeilen, keines dieser Geschäfte hat einen Shard); taucht eines davon je im Bestand auf,
   *  wird das Tor rot und der Fall gehört als begründete Ausnahme ins Register. */
  objectiveZeilen: number;
}

/** Liest den Zustandsträger; null = Etappe E4 noch nicht gelaufen.
 *
 *  ACHTUNG, der Rückgabetyp ist ein VERSPRECHEN DES SCHREIBERS, keine Prüfung: die Datei
 *  auf der Platte kann aus einem Lauf vor einer Feld-Erweiterung stammen und ein Feld
 *  schlicht nicht führen. Wer ein junges Feld liest, prüft es darum selbst auf
 *  Vorhandensein (so macht es `check:entstehung` für die beiden Publikations-Zahlen) —
 *  nie stillschweigend als 0 lesen, das wäre wieder ein leiser Verlust. */
export function leseCuriaZustand(pfad = CURIA_ZUSTAND_PFAD): CuriaZustand[] | null {
  if (!existsSync(pfad)) return null;
  return readFileSync(pfad, 'utf8')
    .split('\n')
    .filter((z) => z.trim())
    .map((z) => JSON.parse(z) as CuriaZustand);
}

/** Byte-deterministische Serialisierung (nach Geschäftsnummer sortiert). */
export function serialisiereCuriaZustand(z: readonly CuriaZustand[]): string {
  return [...z]
    .sort((a, b) => (a.nummer < b.nummer ? -1 : a.nummer > b.nummer ? 1 : 0))
    .map((e) => JSON.stringify(e))
    .join('\n') + '\n';
}
