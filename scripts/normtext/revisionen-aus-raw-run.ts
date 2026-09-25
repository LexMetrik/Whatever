// scripts/normtext/revisionen-aus-raw-run.ts
// Re-Parse der Revisions-Sidecars aus dem committeten store-raw — OHNE Netz (§11 «Re-Parse
// ohne Re-Crawl»). Anlass (W2·29-WERKBANK-LESER, Erlass-Blatt Welle 2 Daten-Rest, 25.9.2026):
// ändert sich nur der Botschafts-Index (botschaften.generated.ts, M-4/M-5), ändert sich im
// Sidecar nur `botschaftKey` — ein voller `normtext:revisionen`-Lauf würde dafür 231 Erlasse
// neu crawlen und fremde Fedlex-Drift in denselben Commit mischen (sortenrein, §6).
//
// Baut exakt, was check:revisionen (1) «Determinismus» offline nachbaut: dieselbe reine
// baueRevisionen-Funktion, derselbe raw, das committete `abgerufen` bleibt (es ist das
// Abrufdatum des raw, nicht dieses Laufs). Danach ist check:revisionen per Konstruktion grün.
// Aufruf: npx vite-node scripts/normtext/revisionen-aus-raw-run.ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import {
  grundmenge, baueRevisionen, serialisiere, botschaftIndex,
  type RevisionSidecar, type RectifiesInfo, type RevisionsKontext,
} from './revisionen-generieren.ts';
import type { SparqlBinding } from '../fedlex-sparql.ts';

const SIDECAR_DIR = 'public/normtext/revisionen';
const RAW_DIR = 'bibliothek/normtext/revisionen-raw';

const ocZuBotschaft = botschaftIndex();
let geaendert = 0, fehlt = 0;
for (const m of grundmenge()) {
  const sidecarP = `${SIDECAR_DIR}/${m.key}.json`;
  const rawP = `${RAW_DIR}/${m.key}.json`;
  if (!existsSync(sidecarP) || !existsSync(rawP)) { fehlt++; console.error(`  ✗ ${m.key}: Sidecar oder raw fehlt — normtext:revisionen (Netz) nötig.`); continue; }
  const alt = readFileSync(sidecarP, 'utf8');
  const sidecar = JSON.parse(alt) as RevisionSidecar;
  const raw = JSON.parse(readFileSync(rawP, 'utf8')) as {
    korpusStand: string; bBindings: SparqlBinding[]; aStaende: string[]; belegteOcs?: string[];
    rectifiesInfoProOc?: Record<string, RectifiesInfo>; kontext?: RevisionsKontext | null;
  };
  const neu = serialisiere(baueRevisionen(
    m, raw.bBindings, raw.aStaende, raw.korpusStand, ocZuBotschaft, sidecar.abgerufen,
    new Set(raw.belegteOcs ?? []), new Map(Object.entries(raw.rectifiesInfoProOc ?? {})), raw.kontext ?? undefined,
  ));
  if (neu !== alt) { writeFileSync(sidecarP, neu, 'utf8'); geaendert++; }
}
console.log(`revisionen-aus-raw: ${geaendert} Sidecar(s) neu geschrieben, Botschafts-oc-Index ${ocZuBotschaft.size}.`);
if (fehlt) process.exit(1);
