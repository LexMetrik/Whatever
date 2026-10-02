// Client-Loader für die Per-Artikel-Historie-Shards (G-HIST-UI). Reine Ladeschicht
// (CLAUDE.md §3): holt den erlass-lokalen Shard `public/normtext/historie/<KEY>.json`
// (aus G-HIST #286, 209 Shards) und reicht die schon STRUKTURIERTEN Ereignisse an
// den Reader durch — KEINE Datums-/Rechtslogik hier, kein Parsen (das lief zur
// Bauzeit in `historie-generieren.ts` + `historie-parse.ts`). Die Komponente
// rendert nur, was der Shard liefert.
//
// Lade-/Cache-Muster byte-gleich zu `ladeLeitfallShard` (norm-index.ts, §5): EIN
// Fetch je Erlass, gecachte laufende Promise, 404 = kein Shard (Erlass ohne
// Historie-Fussnoten bzw. Kanton — kein Fehler, still), transiente Fehler NICHT
// dauerhaft als null gecacht (ein späterer Zugriff darf neu versuchen, §8).

import type { ArtikelHistorie } from './historie-parse';
import { kodiereSchluessel } from './dateiUrl';

// Der Per-Artikel-Eintrag ist exakt die Generator-Projektion `ArtikelHistorie`
// ({ giltSeit, aufgehobenSeit?, ereignisse }). Re-Export als Typ (zur Bauzeit
// erased ⇒ der Regex-Parser landet NICHT im Client-Bundle).
export type { ArtikelHistorie, HistorieEreignis, HistorieTyp } from './historie-parse';

/** Erlass-lokaler Historie-Shard, wie ihn `historie-generieren.ts` schreibt. */
export interface HistorieShard {
  erlass: string;
  abdeckung: { fussnoten: number; ereignis: number; referenz: number; unparsed: number };
  /** Artikel-Token (roh, «40_a») → strukturierte Historie. */
  artikel: Record<string, ArtikelHistorie>;
  residuum: Array<{ token: string; nr: string; roh: string }>;
}

/** Ergebnis EINES Abrufs: `shard: null` heisst «kein Shard» (`fehler: false`: 404 bzw.
 *  SPA-Rückfall — Erlass ohne Änderungs-Fussnoten, Kanton) ODER «nicht erreichbar»
 *  (`fehler: true`: Netz, HTTP-Fehler, kaputte Nutzlast). W2·17-UI-BEFUNDE PE-F10-B01
 *  (1.10.2026): beides war ununterscheidbar, die Fläche las den Netzfehler als
 *  «Zu Art. N nichts erfasst.» (§8). */
export interface HistorieLadung { shard: HistorieShard | null; fehler: boolean }

const shardPromises = new Map<string, Promise<HistorieLadung>>();

/**
 * Wie `ladeHistorieShard`, aber mit der Auskunft, OB der Abruf gescheitert ist. Gecacht
 * wird nur, was eine Auskunft ist (Shard da, oder «keine Datei»); ein Fehlschlag nicht —
 * der nächste Aufruf versucht es erneut («Erneut laden» der Fläche).
 */
export async function ladeHistorieShardErgebnis(key: string): Promise<HistorieLadung> {
  let p = shardPromises.get(key);
  if (!p) {
    p = (async (): Promise<HistorieLadung> => {
      try {
        const res = await fetch(`/normtext/historie/${kodiereSchluessel(key)}.json`);
        if (res.status === 404) return { shard: null, fehler: false }; // kein Shard = kein Fehler (still)
        if (!res.ok) { shardPromises.delete(key); return { shard: null, fehler: true }; }
        // SPA-Rückfall = 404 (`vite dev`/`vite preview` liefern die App mit 200 text/html);
        // fehlt der Header (Test-Doppel), gilt der Parse-Versuch.
        if ((res.headers?.get?.('content-type') ?? '').includes('html')) return { shard: null, fehler: false };
        return { shard: (await res.json()) as HistorieShard, fehler: false };
      } catch {
        // Transienter Netz-/Parse-Fehler NICHT dauerhaft cachen (wie Leitfall-Shard):
        // ein späterer Zugriff darf neu versuchen.
        shardPromises.delete(key);
        return { shard: null, fehler: true };
      }
    })();
    shardPromises.set(key, p);
  }
  return p;
}

/**
 * Lädt den Historie-Shard eines Erlasses (lazy, gecacht). `key` = der kanonische
 * Erlass-Key (= Struktur-/Snapshot-Dateiname, «OR», «BGBM»). Liefert null bei
 * 404 (kein Shard — Erlass ohne Änderungs-Fussnoten oder Kanton), Netz-/Parse-
 * Fehler. Kein throw. Wer «kein Shard» von «nicht erreichbar» trennen muss (die
 * Anzeige «nichts erfasst»), nimmt `ladeHistorieShardErgebnis`.
 */
export async function ladeHistorieShard(key: string): Promise<HistorieShard | null> {
  return (await ladeHistorieShardErgebnis(key)).shard;
}

/**
 * Historie EINES Artikels aus dem Shard. Der Shard-Schlüssel ist der ROHE Artikel-
 * Token, wie ihn Snapshot (`e.artikel`) und Struktur-Sidecar führen («40_a») — ein
 * DIREKTER Lookup, keine Token-Normalisierung (beide Seiten stammen aus derselben
 * Extraktion). undefined = Artikel ohne Historie-Fussnote (Ur-Bestand) ⇒ kein Badge.
 */
export function historieFuerArtikel(
  shard: HistorieShard | null | undefined,
  artikel: string,
): ArtikelHistorie | undefined {
  return shard?.artikel[artikel];
}

/** Nur für Tests: Shard-Cache leeren (isolierte Fälle). */
export function _leereHistorieCache(): void {
  shardPromises.clear();
}
