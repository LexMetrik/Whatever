// scripts/materialien/kanten-erlasse.ts
// Existenzliste der Materialien-Kanten-Shards (Posten 2026-09-24 «Konsolen-404
// materialien/kanten/<ERLASS>.json bei Erlassen ohne Shard», Dach W2·29-WERKBANK-LESER).
//
// Anlass (gemessen 24.9.2026 gegen Prod): `ladeKantenShard` holte
// /materialien/kanten/<KEY>.json BLIND — für jeden Erlass ohne Shard (KVG, ZPO …)
// ein Netz-404 und damit ein Konsolenfehler je Erlass. 404 = «keine Kanten» ist
// fachlich richtig, nur der Netzweg dorthin nicht.
//
// Lösung: die Menge der Erlasse MIT Shard als generierte Bundle-Konstante
// (Muster `src/lib/rechtsprechung/erfasste-keys.generated.ts`). Der Loader fragt
// zuerst die Menge und fetcht nur Treffer. Die Menge ist eine reine Projektion
// der committeten Shard-Köpfe (Top-Level-`<KEY>.json` in public/materialien/kanten/;
// Bucket-Unterverzeichnisse zählen nicht, ihr Kopf liegt immer daneben) — §5:
// eine Quelle, nie von Hand. Drift-Schutz: `check:materialien` vergleicht die
// committete Datei byte-genau mit `renderKantenErlasse(kantenErlasseAusVerzeichnis())`.
//
// Warum nicht als JSON IN kanten/: fünf Leser sammeln dort rekursiv jede *.json
// als Shard (Orphan-Bereinigung der Projektion, check-materialien Drift/Invarianten,
// datenhaltung-Ingest, ESTV-Stand-Probe) — ein Manifest dort würde als Orphan
// gelöscht bzw. als kaputter Shard gemeldet.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';

export const KANTEN_ERLASSE_PFAD = 'src/lib/materialien/kanten-erlasse.generated.ts';
const KANTEN_VERZEICHNIS = 'public/materialien/kanten';

/** Erlass-Keys aller Top-Level-Shard-Köpfe `<KEY>.json`, sortiert (deterministisch). */
export function kantenErlasseAusVerzeichnis(dir: string = KANTEN_VERZEICHNIS): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => e.name.slice(0, -'.json'.length))
    .sort();
}

/** Byte-genaue Datei-Projektion der Existenzliste. */
export function renderKantenErlasse(keys: readonly string[]): string {
  const sortiert = [...new Set(keys)].sort();
  return (
    '// AUTO-GENERIERT von scripts/materialien/kanten-erlasse-run.ts — NICHT von Hand editieren.\n' +
    '// Erlasse MIT Materialien-Kanten-Shard (public/materialien/kanten/<KEY>.json).\n' +
    '// Der Loader (kanten-shard.ts) fetcht nur diese — alle anderen sind ohne Netz «keine Kanten».\n' +
    '// Drift-Tor: npm run check:materialien. Regenerieren: npm run materialien:kanten-erlasse\n' +
    'export const KANTEN_ERLASSE: ReadonlySet<string> = new Set([\n' +
    sortiert.map((k) => `  ${JSON.stringify(k)},\n`).join('') +
    ']);\n'
  );
}

/** Schreibt die Existenzliste aus dem Verzeichnis; gibt die Zahl der Erlasse zurück. */
export function schreibeKantenErlasse(): number {
  const keys = kantenErlasseAusVerzeichnis();
  writeFileSync(KANTEN_ERLASSE_PFAD, renderKantenErlasse(keys), 'utf8');
  return keys.length;
}
