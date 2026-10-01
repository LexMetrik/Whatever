// ─── Lazy-Loader der Materialien-Kanten-Shards (E6a·M5) ─────────────────────
//
// Norm ↔ Material-Kanten liegen NICHT im Bundle (§15), sondern als erlass-lokale
// Shards public/materialien/kanten/<ERLASS_KEY>.json (+ Bucket-Split ab 300 KB,
// FAHRPLAN-MATERIALIEN-VERZAHNUNG §2.7/§0-B5). Diese Ladeschicht (§3) holt den
// Shard EINES Erlasses lazy (Promise-Cache je Erlass, Muster wie
// `ladeLeitfallShard`/`ladeRevisionShard`) und liefert die Roh-Kanten samt
// Dokument-Metadaten des Kopfes. Reine Projektion — keine Rechtslogik.
//
// Zwei Datei-Formen (Projektion §2.7):
//   · klein  ⇒ `{ erzeugt, erlass, dokumente, kanten }`
//   · gross  ⇒ Kopf `{ erzeugt, erlass, dokumente, buckets: ['1','2'] }`
//             + Bucket-Dateien `<KEY>/<n>.json` = `{ erzeugt, erlass, kanten }`
// Der Kopf trägt IMMER die `dokumente` (urlBasis/stand); nur die `kanten` wandern
// in die Buckets. Der Loader vereinigt sie transparent (KontextPanel lädt so 1
// Erlass = 1 logischer Fetch, bei Bucket-Split n Dateien).
//
// Existenzliste (Posten 2026-09-24, W2·29-WERKBANK-LESER): gefetcht wird NUR ein
// Erlass aus `KANTEN_ERLASSE` (generiert aus den committeten Shard-Köpfen,
// scripts/materialien/kanten-erlasse.ts; Drift-Tor check:materialien). Vorher ging
// jeder Erlass ohne Shard als Netz-404 über die Leitung (Konsolenfehler je Erlass,
// gemessen gegen Prod 24.9.2026: KVG.json 404). Fachlich unverändert: kein Shard =
// `leer` = «keine Kanten». Ladefehler sind davon getrennt (`fehler`, W3-5-Rest
// 30.9.2026): die Anzeige nimmt `ladeKantenShardErgebnis`; die dünne `null`-Fassung
// `ladeKantenShard` hatte seit #1196 keinen Aufrufer mehr und ist am 1.10.2026
// entfernt (W2·27-BUND-FERTIG).

import { KANTEN_ERLASSE } from './kanten-erlasse.generated';

/** Fundstelle einer aggregierten Kante (Ziffer + optionaler Deep-Link-Suffix). */
interface ShardFundstelle {
  z: string;
  url?: string;
}

/** Eine aggregierte (Dokument, Artikel)-Kante aus dem Shard. */
interface ShardKante {
  dok: string;
  /** Korpus-Artikel-Token ('11', '20_a'); fehlt bei Erlass-Ebene. */
  artikel?: string;
  quelle: string; // 'amtlich' | 'kuratiert' | 'maschinell'
  konfidenz: string;
  stand: string;
  fundstellen: ShardFundstelle[];
}

/** Dokument-Metadaten aus dem Shard-Kopf. */
interface ShardDokMeta {
  urlBasis: string;
  stand: string;
}

/** Ein geladener, ggf. aus Buckets vereinigter Erlass-Shard. */
export interface KantenShard {
  erlass: string;
  dokumente: Record<string, ShardDokMeta>;
  kanten: ShardKante[];
}

interface RohShard {
  erzeugt: string;
  erlass: string;
  dokumente?: Record<string, ShardDokMeta>;
  kanten?: ShardKante[];
  buckets?: string[];
}

const KANTEN_BASIS = '/materialien/kanten';

/**
 * Ergebnis eines Shard-Ladens, DREI Zustände (§8, Posten W3-5-Rest 25.9.2026):
 * «leer» (Erlass ohne Material-Kanten — nicht in `KANTEN_ERLASSE` oder 404) ist
 * eine ANTWORT; «fehler» (Netz-/Parse-Fehler, 5xx, fehlender Bucket) ist KEINE —
 * die Fläche darf sie nie als «nichts erfasst» ausgeben. Muster wie
 * `Geladen<T>` (`wert: null` = Quelle unerreichbar, leere Liste = nichts erfasst).
 */
export type KantenShardErgebnis =
  | { zustand: 'ok'; shard: KantenShard }
  | { zustand: 'leer' }
  | { zustand: 'fehler' };

const LEER: KantenShardErgebnis = { zustand: 'leer' };
const FEHLER: KantenShardErgebnis = { zustand: 'fehler' };

const shardPromises = new Map<string, Promise<KantenShardErgebnis>>();

// «Erholt»-Signal (W2·27-BUND-FERTIG, Posten Praxis-Zeile 30.9.2026): mehrere
// Flächen fragen denselben Shard (Praxis-Zeile, Artikel-Gruppe, Erlass-Tafel,
// Popover). Ein gescheiterter Abruf wird nicht gecacht — holt EINE Fläche per
// «Erneut laden» nach, müssen die anderen, die noch den Fehler zeigen, es
// erfahren, sonst bleibt ihre Zeile stehen, obwohl die Daten da sind.
const hatteFehler = new Set<string>();
const erholtHoerer = new Map<string, Set<() => void>>();

/**
 * Meldet, sobald der Shard EINES Erlasses nach einem Fehlschlag erstmals wieder
 * geladen ist (`ok` oder `leer`). Gedacht für Flächen, die gerade `fehler`
 * zeigen: Rückruf = ihren eigenen Abruf wiederholen. Gibt die Abmeldung zurück.
 */
export function beiKantenShardErholt(erlassKey: string, rueckruf: () => void): () => void {
  let hoerer = erholtHoerer.get(erlassKey);
  if (!hoerer) { hoerer = new Set(); erholtHoerer.set(erlassKey, hoerer); }
  hoerer.add(rueckruf);
  return () => { hoerer.delete(rueckruf); };
}

/** `null` = 404 (Datei gibt es nicht); jeder andere Fehlschlag wirft. */
async function holeJson(pfad: string): Promise<RohShard | null> {
  const res = await fetch(pfad);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as RohShard;
}

/**
 * Lädt den Kanten-Shard EINES Erlasses (mit Bucket-Vereinigung) und sagt, ob er
 * `ok` geladen wurde, `leer` ist (nicht in `KANTEN_ERLASSE`, oder Kopf-404) oder
 * `fehler` war (Netz-/Parse-Fehler, 5xx, ein Bucket fehlt/scheitert — der Kopf
 * hat ihn ja angekündigt). Promise-Cache je Erlass; `ok` und `leer` werden
 * gecacht, `fehler` NICHT (§8 — ein späterer Aufruf, z. B. «Erneut laden»,
 * versucht es wieder).
 */
export async function ladeKantenShardErgebnis(erlassKey: string): Promise<KantenShardErgebnis> {
  if (!KANTEN_ERLASSE.has(erlassKey)) return LEER; // kein Shard committet → kein Netzweg
  let p = shardPromises.get(erlassKey);
  if (!p) {
    const versuch = (async (): Promise<KantenShardErgebnis> => {
      try {
        const kopf = await holeJson(`${KANTEN_BASIS}/${encodeURIComponent(erlassKey)}.json`);
        if (!kopf) return LEER; // 404 = kein Shard (kein Fehler)
        const dokumente = kopf.dokumente ?? {};
        if (Array.isArray(kopf.kanten)) {
          return { zustand: 'ok', shard: { erlass: kopf.erlass, dokumente, kanten: kopf.kanten } };
        }
        if (Array.isArray(kopf.buckets)) {
          const teile = await Promise.all(
            kopf.buckets.map((b) => holeJson(`${KANTEN_BASIS}/${encodeURIComponent(erlassKey)}/${encodeURIComponent(b)}.json`)),
          );
          // Ein vom Kopf angekündigter Bucket, der 404 liefert, ist ein Defekt, kein «leer».
          if (teile.some((t) => t === null)) return FEHLER;
          const kanten = teile.flatMap((t) => t!.kanten ?? []);
          return { zustand: 'ok', shard: { erlass: kopf.erlass, dokumente, kanten } };
        }
        return { zustand: 'ok', shard: { erlass: kopf.erlass, dokumente, kanten: [] } };
      } catch {
        return FEHLER;
      }
    })();
    p = versuch;
    shardPromises.set(erlassKey, versuch);
    // Fehlschlag nie cachen (dasselbe Muster wie `ladeMaterialManifest`).
    void versuch.then((e) => {
      if (e.zustand === 'fehler') {
        if (shardPromises.get(erlassKey) === versuch) shardPromises.delete(erlassKey);
        hatteFehler.add(erlassKey);
      } else if (hatteFehler.delete(erlassKey)) {
        for (const rueckruf of [...(erholtHoerer.get(erlassKey) ?? [])]) rueckruf();
      }
    });
  }
  return p;
}

/** Nur für Tests: den Shard-Promise-Cache leeren. */
export function _leereKantenShardCache(): void {
  shardPromises.clear();
  hatteFehler.clear();
  erholtHoerer.clear(); // Test-Isolation: ein nicht abgemeldeter Hörer darf nicht in den nächsten Test rufen
}
