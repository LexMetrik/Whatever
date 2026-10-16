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

import { loeseErbeAuf, type ArtikelHistorie, type HistorieEreignis } from './historie-parse';
import { kodiereSchluessel } from './dateiUrl';
import { IST_SPA_RUECKFALL, ladeJson, pruefeFelder } from '../ladeJson';

const PRUEFER = pruefeFelder('normtext/historie/<Erlass>.json', { artikel: 'objekt' });
/** Für den Voll-/Stichprobenlauf gegen public/ (src/tests/ladeJson-public.test.ts). */
export { PRUEFER as HISTORIE_PRUEFER };

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
  /** W2·27 (2.10.2026): von Gliederungsüberschriften geerbte Ereignisse, je Erlass einmal; `artikel[…].erbt` zeigt hinein. */
  ueberschriftEreignisse?: HistorieEreignis[];
  residuum: Array<{ token: string; nr: string; roh: string }>;
}

/** Ergebnis EINES Abrufs: `shard: null` heisst «kein Shard» (`fehler: false`: 404 bzw.
 *  SPA-Rückfall — Erlass ohne Änderungs-Fussnoten, Kanton) ODER «nicht erreichbar»
 *  (`fehler: true`: Netz, HTTP-Fehler, kaputte Nutzlast). PE-F10-B01: beides war
 *  ununterscheidbar, die Fläche las den Netzfehler als «Zu Art. N nichts erfasst.» (§8). */
export interface HistorieLadung { shard: HistorieShard | null; fehler: boolean }

const shardPromises = new Map<string, Promise<HistorieLadung>>();

/**
 * Lädt den Historie-Shard eines Erlasses (lazy, gecacht) mit der Auskunft, OB der Abruf
 * gescheitert ist. `key` = der kanonische Erlass-Key (= Struktur-/Snapshot-Dateiname,
 * «OR», «BGBM»). Gecacht wird nur, was eine Auskunft ist (Shard da, oder «keine Datei»);
 * ein Fehlschlag nicht — der nächste Aufruf versucht es erneut («Erneut laden» der Fläche).
 * Kein throw.
 */
export async function ladeHistorieShardErgebnis(key: string): Promise<HistorieLadung> {
  let p = shardPromises.get(key);
  if (!p) {
    p = (async (): Promise<HistorieLadung> => {
      try {
        // 404 und SPA-Rückfall = kein Shard = kein Fehler (still); Status-/Form-/Netzfehler werfen.
        const shard = await ladeJson<HistorieShard>(`/normtext/historie/${kodiereSchluessel(key)}.json`, PRUEFER,
          { alsFehlend: IST_SPA_RUECKFALL });
        return { shard, fehler: false };
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
 * Historie EINES Artikels aus dem Shard. Der Shard-Schlüssel ist der ROHE Artikel-
 * Token, wie ihn Snapshot (`e.artikel`) und Struktur-Sidecar führen («40_a») — ein
 * DIREKTER Lookup, keine Token-Normalisierung (beide Seiten stammen aus derselben
 * Extraktion). undefined = Artikel ohne Historie-Fussnote (Ur-Bestand) ⇒ kein Badge.
 */
export function historieFuerArtikel(
  shard: HistorieShard | null | undefined,
  artikel: string,
): ArtikelHistorie | undefined {
  const a = shard?.artikel[artikel];
  if (!a || !shard || !a.erbt) return a;
  // Aufgelöst und je Shard-Eintrag gemerkt: dieselbe Objekt-Identität bei jedem Aufruf (memo-Komponenten, Effekte).
  let cache = aufgeloest.get(shard);
  if (!cache) aufgeloest.set(shard, (cache = new Map()));
  let r = cache.get(artikel);
  if (!r) cache.set(artikel, (r = loeseErbeAuf(a, shard.ueberschriftEreignisse)));
  return r;
}

const aufgeloest = new WeakMap<HistorieShard, Map<string, ArtikelHistorie>>();

/** Nur für Tests: Shard-Cache leeren (isolierte Fälle). */
export function _leereHistorieCache(): void {
  shardPromises.clear();
}
