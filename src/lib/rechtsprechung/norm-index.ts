// ─── Norm → Entscheid-Index (Verzahnung, Burggraben) ────────────────────────
//
// Lazy geladener Index public/rechtsprechung/norm-index.json: zu einem Erlass-
// Register-key die GENANNTEN Bundesgerichtsentscheide. Reine Ladeschicht (§3).
//
// Quelle (Stand W2·6-NKEY a+d) = die (maschinell extrahierten) statutes[] der
// Entscheide ∪ die deterministische Fliesstext-Erkennung über Regeste und
// Urteilstext (`extrahiereStatutRefs`). Status bleibt 'maschinell' — nie als
// geprüftes Präjudiz verkaufen (§7/§8).
//
// Was «genannt» hier ehrlich heisst: die Fliesstext-Erkennung ist vollständig
// und erfasst damit auch beiläufige, rein prozessuale Nennungen — das BGG steht
// dadurch in rund 85 % der Snapshots, ohne dass der Entscheid in der Sache
// etwas zum BGG sagt. Das ist gewollt (Dekret David, 27.7.2026): erst
// vollständig erkennen, dann über Ranking und Deckel kuratieren
// (LEITFAELLE_PRO_ARTIKEL, proNorm-Top-12) statt an der Extraktion still zu
// verwerfen. Ein Eintrag im Index belegt eine NENNUNG, keine Einschlägigkeit.

import type { Leitcharakter } from './typen';
import { kodiereSchluessel } from '../normtext/dateiUrl';
import { ladeJson, pruefeFelder } from '../ladeJson';

const INDEX_PRUEFER = pruefeFelder('rechtsprechung/norm-index.json', { proNorm: 'objekt' });
/** Für den Voll-/Stichprobenlauf gegen public/ (src/tests/ladeJson-public.test.ts). */
export { INDEX_PRUEFER as NORMINDEX_PRUEFER };
const ERLASS_PRUEFER = pruefeFelder('rechtsprechung/norm-index-erlasse.json', { proNorm: 'objekt' });
/** Für den Voll-/Stichprobenlauf gegen public/ (src/tests/ladeJson-public.test.ts). */
export { ERLASS_PRUEFER as NORMINDEX_ERLASS_PRUEFER };
const SHARD_PRUEFER = pruefeFelder('rechtsprechung/norm-index/<Erlass>.json', { proArtikel: 'objekt' });
/** Für den Voll-/Stichprobenlauf gegen public/ (src/tests/ladeJson-public.test.ts). */
export { SHARD_PRUEFER as NORMINDEX_SHARD_PRUEFER };

export interface EntscheidRef {
  key: string;
  zitierung: string;
  regesteKurz: string | null;
  datum: string;
  leitcharakter: Leitcharakter;
  gericht: string;
  kanton: string;
}

/**
 * Per-Artikel-Leitfall (W3): EntscheidRef + `gewicht` = TOPISCH gebundene In-degree
 * — die Anzahl ANDERER Entscheide, die DENSELBEN Artikel zitieren UND diesen
 * Entscheid nennen. Kein globaler Zitationszähler, kein PageRank (das würde
 * prozessuale Megafälle nach oben spülen); die Zahl misst nur die Zentralität
 * INNERHALB der Rechtsprechung zu genau diesem Artikel. Build-time, deterministisch.
 */
export interface LeitfallRef extends EntscheidRef {
  gewicht: number;
}

export interface NormEntscheidIndex {
  erzeugt: string;
  /** Erlass-Ebene: Register-key ('OR', 'ZPO') → Bundesgerichtsentscheide (unverändert). */
  proNorm: Record<string, EntscheidRef[]>;
  /**
   * Artikel-Ebene (W3): Schlüssel 'REGISTERKEY/ARTIKEL' (z.B. 'OR/41', 'STGB/12a'),
   * ARTIKEL = whitespace-freies Kleinschrift-Token wie in `zitat-extraktion.ts`
   * ('41', '52bis', '8a'). Absteigend nach `gewicht` (topische In-degree) sortiert.
   * Optional/additiv — ein Alt-Index ohne dieses Feld bricht die Erlass-Ebene nicht.
   */
  proNormArtikel?: Record<string, LeitfallRef[]>;
}

/**
 * Schaufenster-Shard je Erlass (Weiche B, FAHRPLAN-DATENHALTUNG §10(6)/§11.2):
 * `public/rechtsprechung/norm-index/<REGISTERKEY>.json`. Enthält NUR die Artikel-
 * Ebene DIESES Erlasses (Schlüssel = blosses Artikel-Token, der 'REGISTERKEY/'-
 * Präfix ist in den Dateinamen gewandert). Zusätzliche Projektion aus derselben
 * Quelle (proNormArtikel) — das grosse norm-index.json bleibt unverändert. Der
 * ArtikelLeser lädt so nur den Shard SEINES Erlasses, nie das Gesamt-JSON (§15.3).
 */
export interface LeitfallShard {
  erzeugt: string;
  /** Register-key des Erlasses (= Dateiname ohne .json). */
  erlass: string;
  /**
   * Provenienz des `gewicht` in DIESEM Shard (V1b, FAHRPLAN-VERZAHNUNG-UI §3):
   * `'alt'` = kuratierte topische In-degree aus norm-index.json (342er-Korpus, byte-
   * gleiche Weiche-B-Projektion); `'e4'` = aus der Massen-Rangliste `norm_rangliste`
   * (195 342er-Korpus) ersetzt. **Nie gemischt** (§1.7/§3): der ganze Erlass-Shard ist
   * entweder vollständig `'e4'` (jeder Leitfall monoton auflösbar: masse-id vorhanden UND
   * gewicht ≥ alt) oder vollständig `'alt'` (mind. ein Leitfall vintage-absent/recall-lückig).
   * Renderer-neutral (nur Reihenfolge/Tooltip-Herkunft), aber auditierbar (Oracle-Tor).
   */
  gewichtQuelle: 'alt' | 'e4';
  /** Artikel-Token ('41', '52bis') → Leitfälle, absteigend nach `gewicht`. */
  proArtikel: Record<string, LeitfallRef[]>;
}

/**
 * Schlanke Laufzeit-Projektion der ERLASS-Ebene (W2·6-NKEY §15):
 * `public/rechtsprechung/norm-index-erlasse.json` = `{ erzeugt, proNorm }` aus
 * derselben Quelle wie norm-index.json, nur ohne die Artikel-Ebene. Zusätzliche
 * Projektion, keine zweite Wahrheit — die Byte-Gleichheit von `proNorm` prüft
 * check:entscheide (§5).
 */
export interface NormErlassIndex {
  erzeugt: string;
  proNorm: Record<string, EntscheidRef[]>;
}

let indexPromise: Promise<NormEntscheidIndex | null> | null = null;
let erlassPromise: Promise<NormErlassIndex | null> | null = null;

/**
 * Gesamt-JSON (Erlass- UND Artikel-Ebene, 6.1 MB roh / 731 KB gzip nach dem
 * W2·6-NKEY-Backfill).
 *
 * NICHT MEHR AUF EINEM LAUFZEITPFAD (Stand 28.7.2026, korrigiert den früheren
 * Kommentarstand): die Erlass-Ebene bedient `ladeNormIndexErlasse()` aus der
 * schlanken Projektion, die Artikel-Ebene bedienen die 157 Shards
 * (`ladeLeitfallShard`). Übrig bleibt `rechtsprechungFuerArtikel()` als
 * Zweitbeweis-Pfad für Tests / server-seitige Gegenprüfung. Wer diese Funktion
 * wieder in die UI zieht, holt damit das volle Artefakt über die Leitung zurück
 * und muss das §15-Budget in scripts/check-perf-budget.ts entsprechend
 * nachziehen.
 */
async function ladeNormIndex(): Promise<NormEntscheidIndex | null> {
  if (!indexPromise) {
    indexPromise = (async () => {
      try {
        const r = await ladeJson<NormEntscheidIndex>('/rechtsprechung/norm-index.json', INDEX_PRUEFER);
        if (r === null) indexPromise = null;
        return r;
      } catch {
        indexPromise = null;   // transient — nicht dauerhaft als null zementieren
        return null;
      }
    })();
  }
  return indexPromise;
}

/**
 * Nur die Erlass-Ebene laden (Promise-Cache wie oben) — die Nutzlast des Verweis-Popovers.
 *
 * FEHLSCHLÄGE WERDEN NICHT GECACHT (Härtung 28.7.2026, §8): der Promise-Cache hielt
 * bis dahin auch das `null` eines abgebrochenen fetch dauerhaft fest. Ein einziger
 * transienter Netzfehler beim ERSTEN Öffnen eines Verweis-Popovers liess damit die
 * Entscheid-Liste für die GANZE Sitzung leer — und zwar ohne Fehlermeldung, also als
 * «zu diesem Erlass gibt es keine Bundesgerichtsentscheide» gelesen. Das ist eine
 * Falschaussage über die Rechtslage, nicht bloss ein fehlendes Feature.
 * Das gehärtete Muster stand schon 60 Zeilen tiefer in `ladeLeitfallShard`; hier ist
 * es nachgezogen (§5: EIN Muster für alle drei Lader dieser Datei).
 */
async function ladeNormIndexErlasse(): Promise<NormErlassIndex | null> {
  if (!erlassPromise) {
    erlassPromise = (async () => {
      try {
        const r = await ladeJson<NormErlassIndex>('/rechtsprechung/norm-index-erlasse.json', ERLASS_PRUEFER);
        if (r === null) erlassPromise = null;
        return r;
      } catch {
        erlassPromise = null;
        return null;
      }
    })();
  }
  return erlassPromise;
}

/**
 * Bundesgerichtsentscheide zu einem Erlass-Register-key ('OR', 'ZPO' …) oder [].
 *
 * Liest die schlanke Projektion (93 KB gzip statt 731 KB). Rückgabe unverändert:
 * `proNorm` ist in beiden Dateien dasselbe Objekt in derselben Ordnung (§5).
 */
export async function rechtsprechungFuerErlass(registerKey: string): Promise<EntscheidRef[]> {
  const idx = await ladeNormIndexErlasse();
  return idx?.proNorm[registerKey] ?? [];
}

/**
 * Artikel-Token normalisieren auf die SHARD-Form (`zitat-extraktion.ts`): klein,
 * whitespace- UND unterstrich-frei. Der Reader reicht die eId-nahe Unterstrich-Form
 * durch (`e.artikel` = '727_a', '663_b_bis'), die Shard-Tokens sind aber whitespace-
 * los aus dem Zitat-Text extrahiert ('727a', '663bbis'). Ohne den `_`-Strip fiele
 * die Leitfall-Zeile für JEDEN Buchstaben-Artikel aus (Bug W2·7-VZUI/V1b, z. B. OR
 * Art. 727a). Identisch zu `kanonArtikelToken` im V1c-Revisions-Pfad (revisionen-
 * extrakt.ts) — beide Query-Pfade normalisieren die eId-Form gleich (§5).
 */
export function normArtikelToken(artikel: string): string {
  return String(artikel).toLowerCase().replace(/[\s_]+/g, '');
}

/**
 * Leitfälle zu genau EINEM Artikel: Register-key + Artikel-Token ('OR', '41').
 * Absteigend nach topischer In-degree (`gewicht`) vorsortiert. [] wenn unbekannt
 * oder wenn der Index (Alt-Fassung) keine Artikel-Ebene trägt.
 *
 * Liest das GESAMT-JSON (6.1 MB, Stand 28.7.2026 nach dem W2·6-NKEY-Backfill;
 * die frühere Zahl «536 KB» war vor-Backfill) — bewusst nur für Tests /
 * server-seitige Gegenprüfung. Die UI nimmt den erlass-lokalen Shard
 * (`leitfaelleFuerArtikel`).
 *
 * Damit ist das Gesamt-JSON seit W2·6-NKEY vom Laufzeitpfad genommen: die
 * Erlass-Ebene liefert `ladeNormIndexErlasse()`, die Artikel-Ebene die Shards.
 * Wer diese Funktion in eine Komponente einbaut, macht das Artefakt wieder zu
 * echter Nutzlast — dann gehören die Deckel in scripts/check-perf-budget.ts und
 * scripts/normtext/check-entscheide.ts zusammen neu bewertet (§15).
 */
export async function rechtsprechungFuerArtikel(registerKey: string, artikel: string): Promise<LeitfallRef[]> {
  const idx = await ladeNormIndex();
  if (!idx?.proNormArtikel) return [];
  return idx.proNormArtikel[`${registerKey}/${normArtikelToken(artikel)}`] ?? [];
}

// ─── Schaufenster-Shards (Weiche B) — erlass-lokal, für den ArtikelLeser ──────
//
// Promise-Cache je Erlass (Repo-Muster wie `indexPromise` oben): der erste Artikel
// eines Erlasses stösst EINEN fetch an, alle weiteren Artikel desselben Erlasses
// teilen ihn. So lädt der Reader nie das Gesamt-JSON eager (§15.3), sondern nur den
// Shard des gerade offenen Erlasses.
const shardPromises = new Map<string, Promise<LeitfallShard | null>>();

export async function ladeLeitfallShard(registerKey: string): Promise<LeitfallShard | null> {
  let p = shardPromises.get(registerKey);
  if (!p) {
    p = (async () => {
      try {
        // 404 = kein Shard = Erlass ohne Artikel-Treffer (kein Fehler)
        return await ladeJson<LeitfallShard>(`/rechtsprechung/norm-index/${kodiereSchluessel(registerKey)}.json`, SHARD_PRUEFER);
      } catch {
        // Transienter Netz-/Parse-Fehler (W2·7-VZUI-Härtung): NICHT dauerhaft als
        // null cachen — sonst bleiben die Leitfall-Chips bis zum Reload tot, ein
        // späterer Aufrufer (nächster Artikel) darf es erneut versuchen (§8).
        shardPromises.delete(registerKey);
        return null;
      }
    })();
    shardPromises.set(registerKey, p);
  }
  return p;
}

/**
 * Leitfälle zu EINEM Artikel aus dem erlass-lokalen Shard. Ergebnis MUSS zeichen-
 * gleich zu `rechtsprechungFuerArtikel(registerKey, artikel)` sein (dieselbe Quelle
 * proNormArtikel, nur je Erlass gesplittet — Zweitbeweis in artikel-index.test.ts).
 */
export async function leitfaelleFuerArtikel(registerKey: string, artikel: string): Promise<LeitfallRef[]> {
  const shard = await ladeLeitfallShard(registerKey);
  return shard?.proArtikel[normArtikelToken(artikel)] ?? [];
}

/**
 * Shard-Inversion (V1.2, W2·7-VZUI): Entscheid-key → Artikel-Token des Artikels,
 * für den der Entscheid in DIESEM Erlass das höchste topische Gewicht trägt.
 * Speist die «via Art. N»-Sublabels der KontextPanel-Entscheid-Chips (Magic
 * Moment 5: Top-Entscheide am Erlass-Ende MIT Artikelbezug) — aus dem ohnehin
 * geladenen Shard, keine neuen Daten. Rein/deterministisch (§2): bei Gewichts-
 * Gleichstand gewinnt das zuerst gesehene Artikel-Token (stabile Shard-Ordnung).
 */
export function artikelProEntscheid(shard: LeitfallShard): Map<string, string> {
  const best = new Map<string, { artikel: string; gewicht: number }>();
  for (const [artikel, refs] of Object.entries(shard.proArtikel)) {
    for (const r of refs) {
      const b = best.get(r.key);
      if (!b || r.gewicht > b.gewicht) best.set(r.key, { artikel, gewicht: r.gewicht });
    }
  }
  return new Map([...best].map(([key, v]) => [key, v.artikel]));
}

/** Nur für Tests: den Shard-Promise-Cache leeren (sonst leckt er über Testfälle). */
export function _leereShardCache(): void {
  shardPromises.clear();
}

/** Nur für Tests: die beiden Index-Promise-Caches leeren (Monolith + Erlass-Projektion). */
export function _leereNormIndexCache(): void {
  indexPromise = null;
  erlassPromise = null;
}
