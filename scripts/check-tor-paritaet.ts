// scripts/check-tor-paritaet.ts — CI/lokal-Tor-Parität (F2b).
//
// Zweck: jedes Tor aus `check:seriell` läuft im PR-Pfad (Workflow mit
// `pull_request`-Trigger = PR-Deckung, steht VOR dem Merge) oder braucht
// einen begründeten Allowlist-Eintrag; Wächter-Deckung (schedule/push, läuft
// erst NACH dem Merge) genügt dafür allein nicht. Gegenrichtung: jedes
// ci.yml-Tor läuft auch lokal (check:seriell/gate.sh) oder steht begründet
// auf ALLOWLIST_NUR_CI.
//
// 20.7.2026 · BEFUND · 27 von 34 seriellen Toren liefen nur lokal, CI kann das strukturell nie selbst melden — Tor eingeführt.
// 20.7.2026 · NACHTRAG · Tor stand fälschlich auf der eigenen Allowlist (rekursiv unsichtbar) — behoben, läuft seither in ci.yml.
// 15.8.2026 · SCHÄRFUNG (#425) · Wächter-Deckung wurde fälschlich als PR-Deckung gezählt (226 Snapshots passierten PR-CI grün) — ab hier zählt nur pull_request-Trigger als PR-Deckung.
// 5.9.2026 · SCHÄRFUNG (#712) · check:testtreue lief in ci.yml, nirgends lokal — Gegenrichtung ergänzt (s. Zweck oben).
// 14.9.2026 · SCHÄRFUNG (Befund B, PR #856) · `check:artikel-bestand` stand in package.json, lief in KEINEM Lauf. Beide Richtungen konnten das strukturell nicht sehen: Regel (1) sieht nur check:seriell, Regel (4) nur ci.yml — ein Tor in keiner der beiden Listen war unsichtbar (§6.7). Regel (6) setzt darum an der Grundmenge an: JEDES `check:*`-Skript.
import {
  pkg, seriellTore, gateShAbgedeckt, ciYmlFundstellen, ciTore,
  alleCheckSkripte, irgendwoGedeckt,
} from './tor-paritaet-sonden';
import { readdirSync } from 'node:fs';

/**
 * Begründete Ausnahmen: Tore, die bewusst NICHT in CI laufen.
 * Jeder Eintrag braucht einen Grund — «historisch gewachsen» ist keiner.
 */
const ALLOWLIST: Record<string, string> = {
  // 20.7.2026: check:entscheide/bs-entscheide/besetzung entfielen ersatzlos — DB-Begründung war falsch, sie lesen committete Projektionen (jetzt in ci.yml).
  // 21.7.2026: 18 weitere Einträge entfielen mit der R1-Verdrahtung (Audit #318).
  // 15.8.2026 (#425): check:verfall bleibt einziges wächter-only-Tor — wanduhr- statt diff-abhängig (K7, 3.8.2026, Lauf 30764225649).
  'check:verfall':
    'wanduhr-abhängig statt diff-abhängig — ein ablaufender Registertermin färbt sonst alle offenen PRs rot (K7, Lauf 30764225649). Ersatz-Arbiter: normen-monitor.yml (wöchentlich, mit Vorlauf-Warnung) und fedlex-frische.yml (vor jedem Reparatur-PR); zusätzlich lokal in check:seriell vor jedem Deploy',
  'check:materialien': 'braucht daten/*.db für die Byte-Reprojektion (CI-Zweig prüft committete Shards)',
  'check:gegenpruefung': 'liest den Working Tree, der in CI sauber ist; protokolliert unter CI=1 ausdrücklich SKIP (§6 Ziff. 7 lit. b) — Arbiter für den committeten Bereich ist check:merge-schutz in ci.yml',
  'check:schlankheit': 'lokal-warnend im gate, nicht Required — Zeilen-Wächter mit Baseline; ein Required-Rot bei Bestands-Regrowth würde fremde PRs blockieren, Eskalationsweg ist schlankheit:update mit Commit-Begründung',
};

/**
 * GEGENRICHTUNG (SCHÄRFUNG 5.9.2026, s. Kopf): Tore, die ci.yml im PR-Pfad
 * aufruft, aber die bewusst NICHT lokal (in `check:seriell`/`gate.sh`) laufen.
 * Jeder Eintrag braucht einen wahren, kurzen Grund — sonst gehört das Tor
 * lieber lokal verdrahtet.
 */
const ALLOWLIST_NUR_CI: Record<string, string> = {
  'check:merge-schutz':
    'vergleicht den GANZEN Feature-Branch (origin/main..HEAD) auf Gegenprüfungs-Verdikt + Register-Wachstum — während eines laufenden Risikopfad-Baus (vor Abschluss der Gegenprüfung) wäre es bei jedem WIP-Commit zwangsläufig rot. Das lokale Pendant ist die Gegenprüfung selbst (Skill `gegenpruefung`, dokumentiert per `gegenpruefung:ok`), nicht dieses Tor. Arbiter bleibt ci.yml (PR-Pfad).',
  'check:perf-budget':
    'braucht `dist/assets/` (Build-Artefakt aus `npm run build`) — kein Gate-Schritt baut vor jedem Lauf. Lokal bei Bedarf: `npm run build && npm run check:perf-budget`.',
  'check:e2e-flake':
    'braucht `playwright-report.json` — den erzeugt der JSON-Reporter laut playwright.config.ts NUR unter `CI`, und nur der Shard-Lauf selbst füllt ihn. Lokal fehlt die Datei, das Tor wäre bei jedem Gate-Lauf rot. Lokales Pendant ist der Verdikt-Test src/tests/e2e-flake-waechter.test.ts (läuft in check:seriell über die Vitest-Suite); Arbiter bleibt ci.yml (PR-Pfad, e2e-Job).',
  'check:perf-lighthouse':
    'braucht `dist/` (Build-Artefakt) und eine echte Chrome/Lighthouse-Messung über mehrere Läufe für den Median (mehrere Minuten) — ungeeignet für einen Gate-Lauf bei jedem WIP-Commit. Arbiter bleibt ci.yml (Job Perf, PR-Pfad).',
};

/**
 * REGEL (6) · GRUNDMENGE (SCHÄRFUNG 14.9.2026, s. Kopf): Tore, die in KEINEM
 * Lauf stehen — weder in `check:seriell`, noch in einer Kette, noch in einem
 * Workflow oder in `gate.sh`. Jeder Eintrag braucht einen wahren Grund, warum
 * das richtig ist; «wird noch verdrahtet» ist keiner (dann verdrahten).
 */
const ALLOWLIST_UNVERDRAHTET: Record<string, string> = {
  'check:zitatgraph':
    'BEWUSST KEIN TOR: die Hülle scripts/report-zitatgraph-warnungen.ts endet stets mit Exit 0 (so im Kopf deklariert) — ein erheblicher Teil der gemessenen Differenz ist bauartbedingtes Rauschen (Fussnoten-Citations, Erlass-Verweise ohne Artikelnummer). Ein Lauf daraus wäre ein Tor, das aus richtigem Verhalten Rot macht (§6.7 lit. a). Bericht auf Abruf: npm run check:zitatgraph.',
  'check:be-sprengel':
    'reine Kommandozeilen-Hülle um pruefeBeSprengel(); DIESELBE Prüfung läuft merge-blockierend als src/tests/beSprengel.test.ts über die Vitest-Suite (und damit in check:seriell und im PR-CI). Ein zweiter Lauf desselben Prädikats prüft nichts Zusätzliches — er verdoppelt nur die Laufzeit (§17-Gegengewicht).',
  'check:suchindex':
    'Drift-Tor des Suchindex-Generators — aber `npm run build` beginnt mit `gen:suchindex` und erzeugt den Index vor JEDEM Build neu (package.json, Skript "build"). Eine Drift kann die Auslieferung darum strukturell nicht erreichen: was gebaut wird, ist immer frisch generiert. Das Tor bleibt als Diagnose für den Zwischenstand im Arbeitsbaum.',
};

const seriell = seriellTore();
const { deckung, ohneOn } = ciTore();
const prGedeckt = (t: string): string[] => deckung.get(t)?.pr ?? [];
const waechterGedeckt = (t: string): string[] => deckung.get(t)?.waechter ?? [];
const gateSh = gateShAbgedeckt();
// Grundmenge für die Gegenrichtung: jedes Tor, das ein PR-Workflow aufruft.
const alleCiPrTore = [...deckung.entries()].filter(([, d]) => d.pr.length > 0).map(([t]) => t).sort();
const lokalGedeckt = (t: string): boolean => seriell.includes(t) || gateSh.has(t);
const fehler: string[] = [];

// (0) Ein Workflow ohne lesbaren `on:`-Block kann nicht als PR-Deckung gewertet
//     werden — und das wird gesagt, nicht angenommen (§6.7 lit. b).
for (const datei of ohneOn) {
  fehler.push(
    `  ${datei}: kein lesbarer 'on:'-Block — die Sonde kann PR- nicht von ` +
    `Wächter-Deckung unterscheiden.\n` +
    `      → Trigger-Kopf reparieren; bis dahin ist jede Deckung durch diesen Workflow ungeklärt.`);
}

// (1) Jedes serielle Tor läuft im PR-PFAD ODER steht begründet auf der Allowlist.
//     Wächter-Deckung allein genügt NICHT (Schärfung 15.8.2026, s. Kopf).
for (const t of seriell) {
  if (prGedeckt(t).length || t in ALLOWLIST) continue;
  const w = waechterGedeckt(t);
  fehler.push(
    w.length
      ? `  ${t}: NUR wächter-gedeckt (${w.join(', ')}) — kein Workflow mit pull_request-Trigger fährt es.\n` +
        `      Ein post-merge-Wächter meldet, er verhindert keinen Merge (#425).\n` +
        `      → entweder in .github/workflows/ci.yml (Tore-Job) verdrahten,\n` +
        `      → oder in ALLOWLIST von scripts/check-tor-paritaet.ts eintragen, mit dem\n` +
        `        Wächter als benanntem Ersatz-Arbiter (Regel 3 bindet den Verweis maschinell).`
      : `  ${t}: läuft in KEINEM Workflow und steht nicht auf der Allowlist.\n` +
        `      → entweder in .github/workflows/ci.yml verdrahten,\n` +
        `      → oder in ALLOWLIST von scripts/check-tor-paritaet.ts mit GRUND eintragen.`);
}

// (2) Verrottete Allowlist: ein Eintrag, dessen Tor inzwischen im PR-Pfad läuft
//     oder der gar kein serielles Tor (mehr) ist, ist tote Regel und wird
//     gemeldet. Wächter-Deckung macht einen Eintrag NICHT überholt — sie ist
//     genau der Zustand, den er begründet.
for (const [t, grund] of Object.entries(ALLOWLIST)) {
  if (!seriell.includes(t)) {
    fehler.push(`  ${t}: steht auf der Allowlist, ist aber nicht (mehr) in check:seriell — Eintrag streichen.`);
  } else if (prGedeckt(t).length) {
    fehler.push(
      `  ${t}: läuft inzwischen im PR-Pfad (${prGedeckt(t).join(', ')}), Allowlist-Eintrag ist überholt — streichen.\n` +
      `      (alter Grund: ${grund})`);
  }
}

// (3) Nennt ein Grund einen Workflow als Ersatz-Arbiter, muss dieser existieren —
//     maschinell gebunden statt Prosa-Behauptung (Einwand 20.7.2026).
const vorhandeneWorkflows = new Set(readdirSync('.github/workflows'));
for (const [t, grund] of Object.entries(ALLOWLIST)) {
  for (const m of grund.matchAll(/([a-z0-9-]+\.ya?ml)/g)) {
    if (!vorhandeneWorkflows.has(m[1])) {
      fehler.push(
        `  ${t}: Grund nennt '${m[1]}' als Ersatz-Arbiter, aber ` +
        `.github/workflows/${m[1]} existiert nicht.\n` +
        `      → Der Verweis ist tot: entweder Tor in CI verdrahten oder Grund korrigieren.`);
    }
  }
}

// (4) GEGENRICHTUNG (SCHÄRFUNG 5.9.2026): jedes Tor, das ci.yml im PR-Pfad
//     aufruft, läuft auch LOKAL (check:seriell ODER gate.sh) oder steht
//     begründet auf ALLOWLIST_NUR_CI. Beleg #712: check:testtreue lief in
//     ci.yml, aber nirgends lokal — lokal grün war keine Aussage über CI.
for (const t of alleCiPrTore) {
  if (lokalGedeckt(t) || t in ALLOWLIST_NUR_CI) continue;
  const zeilen = ciYmlFundstellen(t).join(', ') || '?';
  fehler.push(
    `  ${t}: läuft in ci.yml (Zeile ${zeilen}), aber in KEINER lokalen Kette ` +
    `(check:seriell/gate.sh) — lokal grün sagt nichts über CI (Beleg #712).\n` +
    `      → in check:seriell oder gate.sh verdrahten, oder mit GRUND in ` +
    `ALLOWLIST_NUR_CI (scripts/check-tor-paritaet.ts) eintragen.`);
}

// (5) Verrottete ALLOWLIST_NUR_CI: ein Eintrag, dessen Tor inzwischen doch
//     lokal läuft oder ci.yml gar nicht mehr aufruft, ist tote Regel.
for (const [t, grund] of Object.entries(ALLOWLIST_NUR_CI)) {
  if (!alleCiPrTore.includes(t)) {
    fehler.push(`  ${t}: steht auf ALLOWLIST_NUR_CI, ruft aber keinen PR-Workflow (ci.yml) mehr auf — Eintrag streichen.`);
  } else if (lokalGedeckt(t)) {
    fehler.push(
      `  ${t}: läuft inzwischen lokal (check:seriell/gate.sh) — ALLOWLIST_NUR_CI-Eintrag ist überholt, streichen.\n` +
      `      (alter Grund: ${grund})`);
  }
}

// Regel (6) · GRUNDMENGE (SCHÄRFUNG 14.9.2026, Befund B): jedes `check:*`-Skript
//     läuft irgendwo — in check:seriell, in einer Kette, in einem Workflow oder
//     in gate.sh — oder steht begründet auf ALLOWLIST_UNVERDRAHTET. Wie die
//     Deckung ermittelt wird (transitiv über Ketten und kettenlesende Runner,
//     samt der Rekursions-Falle, die dabei zuschlug), steht in den Sonden.
for (const t of alleCheckSkripte) {
  if (irgendwoGedeckt.has(t) || t in ALLOWLIST_UNVERDRAHTET) continue;
  fehler.push(
    `  ${t}: steht in package.json, läuft aber in KEINEM Lauf — nicht in\n` +
    `      check:seriell, in keiner Kette, in keinem Workflow, nicht in gate.sh.\n` +
    `      Ein Tor, das nie läuft, kann nicht scheitern (§6.7); es sieht nach\n` +
    `      Deckung aus und ist keine (Befund B, PR #856: check:artikel-bestand).\n` +
    `      → in check:seriell + ci.yml verdrahten, oder mit GRUND in\n` +
    `        ALLOWLIST_UNVERDRAHTET (scripts/check-tor-paritaet.ts) eintragen.`);
}

// (7) Verrottete ALLOWLIST_UNVERDRAHTET: ein Eintrag, dessen Tor inzwischen
//     doch irgendwo läuft (oder das es gar nicht mehr gibt), ist tote Regel.
for (const [t, grund] of Object.entries(ALLOWLIST_UNVERDRAHTET)) {
  if (!(t in pkg.scripts)) {
    fehler.push(`  ${t}: steht auf ALLOWLIST_UNVERDRAHTET, existiert aber nicht (mehr) in package.json — Eintrag streichen.`);
  } else if (irgendwoGedeckt.has(t)) {
    fehler.push(
      `  ${t}: läuft inzwischen in einem Lauf — ALLOWLIST_UNVERDRAHTET-Eintrag ist überholt, streichen.\n` +
      `      (alter Grund: ${grund})`);
  }
}

const imPrPfad = seriell.filter((t) => prGedeckt(t).length);
const nurWaechter = seriell.filter((t) => !prGedeckt(t).length && waechterGedeckt(t).length);
const nurCi = alleCiPrTore.filter((t) => !lokalGedeckt(t) && t in ALLOWLIST_NUR_CI);
const unverdrahtet = alleCheckSkripte.filter((t) => !irgendwoGedeckt.has(t));

if (fehler.length) {
  console.log(`check:tor-paritaet ROT — ${fehler.length} Abweichung(en):\n${fehler.join('\n')}`);
  process.exit(1);
}

console.log(
  `check:tor-paritaet OK — ${seriell.length} Tore in check:seriell: ` +
  `${imPrPfad.length} laufen im PR-Pfad (vor dem Merge), ` +
  `${seriell.length - imPrPfad.length} begründet auf der Allowlist ` +
  `(davon ${nurWaechter.length} mit Wächter als Ersatz-Arbiter). ` +
  `Kein Tor nur wächter-gedeckt ohne Eintrag. ` +
  `Gegenrichtung: ${alleCiPrTore.length} Tore ruft ci.yml im PR-Pfad auf, ` +
  `${alleCiPrTore.length - nurCi.length} davon laufen auch lokal ` +
  `(check:seriell/gate.sh), ${nurCi.length} begründet auf ALLOWLIST_NUR_CI. ` +
  `Kein Tor nur-CI ohne Eintrag. ` +
  `Grundmenge: ${alleCheckSkripte.length} check:*-Skripte in package.json, ` +
  `${alleCheckSkripte.length - unverdrahtet.length} laufen irgendwo ` +
  `(Kette/Workflow/gate.sh), ${unverdrahtet.length} begründet auf ` +
  `ALLOWLIST_UNVERDRAHTET. Kein Tor ohne Lauf.`);
