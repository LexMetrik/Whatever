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

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist', 'assets');

// gzip-Budgets. Stand 30.6.2026: entry 30 KB, vendor-react 73 KB.
const ENTRY_MAX = 60 * 1024;          // ~2× Headroom; fängt react-dom-Rückfall in den Entry
const VENDOR_REACT_MAX = 90 * 1024;   // react/-dom/-router(+scheduler) zusammen

const gz = (p: string): number => gzipSync(readFileSync(p)).length;
const kb = (n: number): string => `${(n / 1024).toFixed(1)} KB`;

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

// 4) DATEN-Nutzlast auf dem kritischen Pfad (Gegenprüfung 20.7.2026: Tor prüfte
//    nur dist/assets/*.js, register.json-Wachstum +118 KB gzip blieb unentdeckt
//    — public/**/*.json seither im Budget; register.json lädt jede Leserseite).
//
//    W2·5 (25.7.2026): Artikel-Suchindex dazu — lazy, aber gedeckelt, weil der
//    kantonale Korpus weiterwächst und der clientseitige Indexaufbau mit der
//    Artikelzahl skaliert (bei 54 444 Artikeln ~6.1 s node / 5.3 s Browser, riss
//    auf dem ~3.9× langsameren CI-Runner die Smoke-Suite). Wer die Schranke
//    anhebt, hebt auch die Wartezeit bis zum ersten Treffer — Staffelung
//    (artikelVolltext.ts `baue()`) mitdenken.
//
//    K3-SCHARFSCHALTUNG (1.9.2026): Deckel GESENKT, nicht gelockert — Generator
//    schreibt seit Korpusstand `123ffe495` per Default nur noch Bund-Ebene
//    (such-index-generieren.ts `EBENEN_DEFAULT`), kantonaler Volltext kommt aus
//    der Edge-Suche: 9 974.0 → 5 311.0 KB gzip (−46.8 %), neuer Deckel 5 850 KB.
//
//    W2·6-NKEY (28.7.2026): `norm-index.json` → `norm-index-erlasse.json` — der
//    normKeys-Backfill trieb den Monolithen auf 724 KB gzip (Erlass-Ebene allein
//    93 KB), der Nutzerpfad (kontextEntscheide → Verweis-Popover) braucht aber
//    nur die Erlass-Ebene. Monolith bleibt Build-/Prüf-Artefakt (eigenes Budget:
//    `NORM_INDEX_BUDGET_MB` in scripts/normtext/check-entscheide.ts). Schranke =
//    Ist 93 KB + ~30 % Reserve. §15: kein Logikverlust, nur weniger Bytes. Wer
//    `ladeNormIndex()` wieder in eine Komponente holt, muss hier neu eintragen.
//
//    Linse 4 (28.7.2026): derselbe Backfill hob register.json auf 756.9 KB gegen
//    das 780-KB-Budget (97 % Ausnutzung, normKeys-Vollständigkeit) — bewusst
//    nicht hier gelöst (§8); Verschlankung in eigene Projektion ist Folgearbeit.
//    QS-PERF (15.9.2026, Tor-Diagnose LCP-Element + Budget-Deckel Register/
//    Sidecars): `public/normtext/register.json` (der Normtext-Katalog, nicht
//    zu verwechseln mit dem Rechtsprechungs-Register oben) hatte BISHER GAR
//    KEIN Budget — Anlass war derselbe wie bei Linse 4: die Datei wuchs mit
//    W2·5n weiter (1518 KB roh, gemessen `wc -c public/normtext/register.json`,
//    15.9.2026) und lädt wie das Rechtsprechungs-Register jede Leserseite.
//    Deckel erzwingt bewusst den Register-Schnitt, nicht umgekehrt (§17: ein
//    Wachstum, das kein Tor sieht, kommt wieder). Ist 163 KB gzip
//    (`gzip -c public/normtext/register.json | wc -c` = 163323 Bytes,
//    15.9.2026) — Budget = Ist + ~7 % Kopffreiheit, absichtlich eng: die Datei
//    soll NICHT unbemerkt weiterwachsen, ein Rückschritt soll sofort rot sein.
const DATEN_BUDGET: readonly (readonly [string, number])[] = [
  ['public/rechtsprechung/register.json', 780 * 1024],
  ['public/rechtsprechung/richter.json', 24 * 1024],
  ['public/rechtsprechung/norm-index-erlasse.json', 120 * 1024],
  ['public/such-index/artikel.json', 5_850 * 1024], // K3, 1.9.2026: Ist 5 311 KB gzip (Bund-only)
  ['public/normtext/register.json', 175 * 1024], // QS-PERF 15.9.2026: Ist 163 KB gzip, s. Begründung oben
  // ── W2·7-BEZUG: die drei grössten Bezugs-Shards ───────────────────────────
  // Ein Nutzer lädt genau EINEN Shard (seinen Erlass), nie die Summe — Schranke
  // ist der Grösste, nicht das Verzeichnis. DREI Einträge (Gegenprüfung Runde
  // 1/I3, 29.7.2026): BV mit 123.3 KB gzip ist grösser als StPO (102.0 KB) —
  // BGG als Ausreisser, BV/StPO als das, was ein grosser Erlass normal kostet.
  //
  // B7 (David-Auftrag 28.7.2026): Auslieferungs-Deckel «8 je Status» aufgehoben,
  // jede Kante eines Artikels wird ausgeliefert (24'173 → 75'365 Kanten) —
  // Budgets deshalb angehoben, nicht weil man an sie stiess (§8).
  //
  // Gemessen 29.7.2026 (`gzip -6 -c`, `serialisiereShard`; Gegenprüfung Runde
  // 1/I2 — Vorher-Werte aus `git show origin/main`, nicht erinnert):
  //   BGG   300.2 KB (vorher 44.1 KB, Faktor 6.8) — Art. 42 BGG trägt 4'140 Kanten
  //   BV    123.3 KB (vorher 46.8 KB, Faktor 2.6)
  //   StPO  102.0 KB (vorher 63.6 KB, Faktor 1.6)
  //   StGB   77.8 KB (vorher 56.3 KB)
  //
  // §15 Logikverlust: keiner — Shard liegt nicht auf dem kritischen Pfad, lädt
  // nur bei aktiver Instanz-Facette (`bezuegeLaden.ts`). Budgets = Ist + ~28 %.
  ['public/rechtsprechung/bezuege/BGG.json', 384 * 1024],
  ['public/rechtsprechung/bezuege/BV.json', 160 * 1024],
  ['public/rechtsprechung/bezuege/STPO.json', 132 * 1024],
];
// Gemessen wird dist/ (Ausgelieferte Kopie), public/ nur als Rückfall —
// CI-Befund 25.7.2026: public/such-index/artikel.json ist gitignored, entsteht
// erst im Build; ohne dist/-Fallback lief das Tor rot mit «fehlt», obwohl die
// Datei existierte. vite build kopiert public/ nach dist/.
const daten = (rel: string): string | null => {
  const inDist = join(process.cwd(), 'dist', rel.replace(/^public\//, ''));
  if (existsSync(inDist)) return inDist;
  const inPublic = join(process.cwd(), rel);
  return existsSync(inPublic) ? inPublic : null;
};
console.log('check:perf-budget — Daten-Nutzlast (gzip):');
for (const [rel, max] of DATEN_BUDGET) {
  const p = daten(rel);
  if (!p) { fehler.push(`${rel} fehlt (weder in dist/ noch in public/) — Budget nicht prüfbar.`); continue; }
  const g = gz(p);
  console.log(`  ${rel.replace('public/', '')}  gzip ${kb(g)}  (Budget ${kb(max)})`);
  if (g > max) {
    fehler.push(`${rel} ${kb(g)} > Budget ${kb(max)} — Daten-Nutzlast auf dem kritischen Pfad. `
      + 'Entweder die Projektion verschlanken (Felder/Rollen auslagern) oder das Budget bewusst anheben.');
  }
}

// 5) STRUKTUR-SIDECARS (Glob-Deckel, QS-PERF 15.9.2026): `public/normtext/
//    struktur/**/*.json` — je Erlass ein Ganzarchiv-Baum, Bund + Kanton,
//    1535 Dateien (gezählt 15.9.2026) — hatte wie das Register oben BISHER
//    KEIN Budget. Anders als bei DATEN_BUDGET gibt es hier keine feste
//    Dateiliste (die Bezügs-Shards oben SIND schon eine feste Dreier-Liste,
//    kein Glob): der kantonale Korpus wächst laufend (W2·13-KANTONE), ein
//    einzelner neuer Erlass darf das Tor nicht an drei Stellen zugleich
//    ändern müssen. Ein Nutzer lädt nie die Summe, sondern höchstens EINEN
//    Erlass — die Schranke ist deshalb wie bei den Bezügs-Shards die
//    GRÖSSTE Einzeldatei, nicht das Verzeichnis.
//
//    Ist (`gzip -c public/normtext/struktur/bund/OR.json | wc -c`, 15.9.2026):
//    OR.json 87.6 KB gzip (grösster Bund-Erlass), ZGB 70.7 KB, STGB 43.2 KB.
//    Budget = Ist(OR) + ~8 % Kopffreiheit — bewusst eng aus demselben Grund
//    wie beim Register: der Schnitt ist Ziel, nicht Ausnahme.
const STRUKTUR_GLOB = { basis: 'public/normtext/struktur', max: 95 * 1024 };

/** Alle Dateien unter `dir`, die auf `endung` enden — rekursiv (Bund-/Kanton-
 *  Unterordner). Reihenfolge ist irrelevant, es wird nur das Maximum gesucht. */
function alleDateien(dir: string, endung: string): string[] {
  const out: string[] = [];
  for (const eintrag of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, eintrag.name);
    if (eintrag.isDirectory()) out.push(...alleDateien(p, endung));
    else if (eintrag.name.endsWith(endung)) out.push(p);
  }
  return out;
}

console.log('check:perf-budget — Struktur-Sidecars (gzip, grösste Einzeldatei):');
const strukturBasis = daten(STRUKTUR_GLOB.basis);
if (!strukturBasis) {
  fehler.push(`${STRUKTUR_GLOB.basis}/ fehlt (weder in dist/ noch in public/) — Budget nicht prüfbar.`);
} else {
  const dateien = alleDateien(strukturBasis, '.json');
  if (dateien.length === 0) {
    fehler.push(`${STRUKTUR_GLOB.basis}/ enthält keine *.json — Budget nicht prüfbar.`);
  } else {
    let groesste = { pfad: dateien[0], g: gz(dateien[0]) };
    for (const p of dateien.slice(1)) {
      const g = gz(p);
      if (g > groesste.g) groesste = { pfad: p, g };
    }
    const name = groesste.pfad.slice(strukturBasis.length + 1);
    console.log(`  ${name}  gzip ${kb(groesste.g)}  (Budget ${kb(STRUKTUR_GLOB.max)}, grösste von ${dateien.length} Dateien)`);
    if (groesste.g > STRUKTUR_GLOB.max) {
      fehler.push(`${STRUKTUR_GLOB.basis}/${name} ${kb(groesste.g)} > Budget ${kb(STRUKTUR_GLOB.max)} — grösste Struktur-Sidecar-Datei. `
        + 'Entweder den Erlass-Baum verschlanken oder das Budget bewusst anheben.');
    }
  }
}

if (fehler.length) {
  console.error('\ncheck:perf-budget ROT:');
  for (const f of fehler) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('check:perf-budget GRÜN — Bundle-Budget eingehalten, Single-React-Topologie stabil.');
