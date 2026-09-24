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
// `null` = «keine Kanten».

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

const shardPromises = new Map<string, Promise<KantenShard | null>>();

async function holeJson(pfad: string): Promise<RohShard | null> {
  const res = await fetch(pfad);
  if (!res.ok) return null;
  return (await res.json()) as RohShard;
}

/**
 * Lädt den Kanten-Shard EINES Erlasses (mit Bucket-Vereinigung). `null` =
 * Erlass ohne Material-Kanten (nicht in `KANTEN_ERLASSE`, oder doch 404) oder
 * transienter Fehler. Promise-Cache je
 * Erlass; ein 404 wird gecacht (dauerhaft kein Shard), ein Netz-/Parse-Fehler
 * NICHT (§8 — späterer Aufruf darf erneut versuchen).
 */
export async function ladeKantenShard(erlassKey: string): Promise<KantenShard | null> {
  if (!KANTEN_ERLASSE.has(erlassKey)) return null; // kein Shard committet → kein Netzweg
  let p = shardPromises.get(erlassKey);
  if (!p) {
    p = (async () => {
      try {
        const kopf = await holeJson(`${KANTEN_BASIS}/${encodeURIComponent(erlassKey)}.json`);
        if (!kopf) return null; // 404 = kein Shard (kein Fehler)
        const dokumente = kopf.dokumente ?? {};
        if (Array.isArray(kopf.kanten)) {
          return { erlass: kopf.erlass, dokumente, kanten: kopf.kanten };
        }
        if (Array.isArray(kopf.buckets)) {
          const teile = await Promise.all(
            kopf.buckets.map((b) => holeJson(`${KANTEN_BASIS}/${encodeURIComponent(erlassKey)}/${encodeURIComponent(b)}.json`)),
          );
          if (teile.some((t) => t === null)) {
            // Ein Bucket fehlte transient → nicht dauerhaft null cachen.
            shardPromises.delete(erlassKey);
            return null;
          }
          const kanten = teile.flatMap((t) => t!.kanten ?? []);
          return { erlass: kopf.erlass, dokumente, kanten };
        }
        return { erlass: kopf.erlass, dokumente, kanten: [] };
      } catch {
        shardPromises.delete(erlassKey);
        return null;
      }
    })();
    shardPromises.set(erlassKey, p);
  }
  return p;
}

/** Nur für Tests: den Shard-Promise-Cache leeren. */
export function _leereKantenShardCache(): void {
  shardPromises.clear();
}
