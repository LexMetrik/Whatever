// scripts/check-perf-budget.ts — Performance-Budget-Tor (QS-PERF, CLAUDE.md §15).
//
// Sichert die vendor-react-Split-Bundle-Topologie (FAHRPLAN-PERFORMANCE Rank 5)
// gegen Regression und die Doppel-React-Instanz automatisiert ab.
//
// Chrome-frei, deterministisch, liest gebautes `dist/` — gehört in den
// DEPLOY-Pfad nach `npm run build`, nicht in den schnellen `gate`.
// Lighthouse-Schranken (CLS/LCP/TBT) laufen separat als `check:perf-lighthouse`
// nach dem Merge (ci.yml).
//
// Budgets als gzip-Bytes; Headroom eng genug, dass ein Rückfall von
// react-dom/react-router in den Entry rot wird.
//
// Die Daten-Nutzlast-Budgets (feste Liste + Struktur-Sidecar-Glob) stehen seit
// 15.9.2026 in scripts/perf/daten-budget.ts (Steuerdeckel-Wurzelfix: die
// Prüf-LOGIK zählte als Steuerungs-Fläche `scripts/check-*.ts` mit, obwohl sie
// dort nicht liegen muss — s. Kopfkommentar dort). Verhalten byte-gleich.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gz, kb, pruefeDatenBudgets } from './perf/daten-budget';

const DIST = join(process.cwd(), 'dist', 'assets');

// gzip-Budgets. Stand 30.6.2026: entry 30 KB, vendor-react 73 KB.
const ENTRY_MAX = 60 * 1024;          // ~2× Headroom; fängt react-dom-Rückfall in den Entry
const VENDOR_REACT_MAX = 90 * 1024;   // react/-dom/-router(+scheduler) zusammen

if (!existsSync(DIST)) {
  console.error('check:perf-budget — dist/assets/ fehlt. Zuerst `npm run build` (das Tor prüft das gebaute Bundle).');
  process.exit(1);
}

const files = readdirSync(DIST);
const entry = files.filter((f) => /^index-.*\.js$/.test(f));
const vendor = files.filter((f) => /^vendor-react-.*\.js$/.test(f));
const fehler: string[] = [];

console.log('check:perf-budget — Bundle-Topologie & -Budget:');

// 1) Genau EIN Entry-Chunk und EIN vendor-react-Chunk (stabile Cache-Topologie).
if (entry.length !== 1) fehler.push(`Entry-Chunk: erwartet genau 1 (index-*.js), gefunden ${entry.length}.`);
if (vendor.length !== 1) {
  fehler.push(`vendor-react-Chunk: erwartet genau 1 (vendor-react-*.js), gefunden ${vendor.length} — `
    + 'die React-Familie muss nach Rank 5 in EINEM stabil benannten Chunk liegen (vite.config manualChunks).');
}

// 2) gzip-Budgets.
if (entry.length === 1) {
  const g = gz(join(DIST, entry[0]));
  console.log(`  entry         ${entry[0]}  gzip ${kb(g)}  (Budget ${kb(ENTRY_MAX)})`);
  if (g > ENTRY_MAX) {
    fehler.push(`Entry-Chunk ${kb(g)} > Budget ${kb(ENTRY_MAX)} — meist react-dom/react-router zurück im Entry `
      + '(manualChunks-Regex prüfen) oder eine schwere, nicht lazy geladene Abhängigkeit.');
  }
}
if (vendor.length === 1) {
  const g = gz(join(DIST, vendor[0]));
  console.log(`  vendor-react  ${vendor[0]}  gzip ${kb(g)}  (Budget ${kb(VENDOR_REACT_MAX)})`);
  if (g > VENDOR_REACT_MAX) fehler.push(`vendor-react ${kb(g)} > Budget ${kb(VENDOR_REACT_MAX)}.`);
}

// 3) Doppel-React-Schutz: die react-dom-Client-Implementierung darf NUR im
//    vendor-react-Chunk liegen, nie zusätzlich im Entry (sonst zwei React-
//    Instanzen → «Invalid hook call»). Marker sind react-dom-interne Symbole.
if (entry.length === 1) {
  const src = readFileSync(join(DIST, entry[0]), 'utf8');
  if (/listenToAllSupportedEvents|onCommitFiberRoot/.test(src)) {
    fehler.push('react-dom-Implementierung im Entry-Chunk gefunden — Doppel-Instanz-Risiko '
      + '(manualChunks greift nicht; der Entry darf react-dom nur IMPORTIEREN, nicht enthalten).');
  }
}

// 4) + 5) Daten-Nutzlast (feste Liste) + Struktur-Sidecars (Glob, grösste
//    Einzeldatei) — ausgelagert, s. Kopfkommentar.
fehler.push(...pruefeDatenBudgets());

if (fehler.length) {
  console.error('\ncheck:perf-budget ROT:');
  for (const f of fehler) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('check:perf-budget GRÜN — Bundle-Budget eingehalten, Single-React-Topologie stabil.');
