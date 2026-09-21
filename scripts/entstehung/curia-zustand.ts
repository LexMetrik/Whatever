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
  /** Zahl der ROHEN Objective-Zeilen, die der amtliche Endpunkt geliefert hat — vor
   *  jeder Auswertung. Nur Transparenz: `objectiveZeilen − distinkteObjective` ist die
   *  Zahl der echt doppelt gelieferten Zeilen (gemessen 21.9.2026 bei 08.053: 12 − 8 = 4). */
  objectiveZeilen: number;
  /** Zahl der DISTINKTEN Objective-Zeilen, unabhängig von `bauePublikationen` ausgezählt
   *  (`distinkteObjectiveZeilen()`). Das ist die Kreuzprobe: weicht sie von
   *  `publikationen` ab, hat der Lauf amtliche Fundstellen zusammenfallen lassen —
   *  genau der Befund vom 21.9.2026 (Geschäft 01.023: 21 statt 32). `check:entstehung`
   *  rechnet offline gegen, weil die CI kein Netz hat. */
  distinkteObjective: number;
}

/** Liest den Zustandsträger; null = Etappe E4 noch nicht gelaufen.
 *
 *  ACHTUNG, der Rückgabetyp ist ein VERSPRECHEN DES SCHREIBERS, keine Prüfung: die Datei
 *  auf der Platte kann aus einem Lauf vor einer Feld-Erweiterung stammen und ein Feld
 *  schlicht nicht führen. Wer ein junges Feld liest, prüft es darum selbst auf
 *  Vorhandensein (so macht es `check:entstehung` für die drei Publikations-Zahlen) —
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
