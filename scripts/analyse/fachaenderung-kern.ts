// scripts/analyse/fachaenderung-kern.ts — reiner Kern des Fachänderungs-Riegels
// (RL-03, Prüfung Rechtslogik 23.9.2026, Befunde S1-02/S1-05/S1-06). Hülle:
// scripts/check-fachaenderung.ts (git, gh). Hier: kein git, kein fs.
//
// ZWEI REGELN, ein Tor (ersetzt check:testtreue + die Assertion-Regel des
// Jules-Fremd-PR-Tors):
//  (R1) §6.3 unverändert aus testtreue-kern.ts übernommen: ein als `refactor`
//       deklarierter Commit, der IRGENDEINE Test-Datei berührt (src/tests/**,
//       *.test.ts(x), e2e/*.e2e.ts — auch bloss hinzugefügt), ist ROT. Kein
//       Trailer heilt das: Tests werden bei Refactorings nicht angepasst.
//       Dazu der künftige Queue-Squash (PR-Titel als Betreff, PR #1026).
//  (R2) Neu: eine GEÄNDERTE oder ENTFERNTE Assertion (expect-Ausdruck,
//       it/test-/describe-Name, Abschalten per .skip/.todo) in einem Test einer
//       Risiko-Engine — oder jeder Diff an golden/lexmetrik-golden.json —
//       verlangt den Trailer `Fachaenderung: <Norm> — <Befund-ID/Begründung>`
//       (Befund-Teil ≥ 15 Zeichen, analog Merge-Schutz). Rein hinzugefügte
//       Tests/Assertions sind frei. Der Befund S1-02 (Tests p=true, Golden
//       behalten()=false) zeigte: eine Test-Erwartung konnte still der Engine
//       nachgezogen werden, ohne dass irgendein Tor die fachliche Änderung sah.
//
// HEURISTIK Test → Engine (offengelegt, §8): Eine Testdatei gilt als Test einer
// Risiko-Engine, wenn einer ihrer DIREKTEN relativen Modul-Verweise (import/
// export … from, import(), vi.mock(), require()) auf einen Pfad auflöst, für
// den `behalten()` aus scripts/gegenpruefung/kern.ts wahr ist — dieselbe
// Risiko-Definition wie Merge-Schutz, keine zweite. Assertions werden je
// Risiko-Engine über ALLE geänderten Testdateien gepoolt: ein Split/Umzug von
// Tests derselben Engine ist damit keine Änderung, ein Umzug zu einer anderen
// Engine schon.
// GRENZEN: (a) nur direkte Importe — ein Test, der eine Risiko-Engine über
// eine Nicht-Risiko-Fassade/UI-Komponente erreicht, gilt als Nicht-Risiko-Test;
// (b) nur src/tests/**/*.test.ts(x) wird auf Assertions gelesen (Tests neben
// dem Code und e2e nur über R1); (c) Hilfsfunktionen, die intern expect()
// aufrufen, werden am Aufrufort nicht als Assertion erkannt; (d) Golden wird
// dateiweise erkannt, nicht je `werte`-Eintrag (feiner erst mit RL-48/S1-08).
// Die Gegenprüfungs-Quittung auf Risiko-Engines erzwingt check:merge-schutz —
// hier nur Hinweis, nicht zweimal geprüft.
import { posix } from 'node:path';
import ts from 'typescript';
import { behalten } from '../gegenpruefung/kern';
import { assertionMengen, type Mengen } from './test-assertion-diff';

export const GOLDEN = 'golden/lexmetrik-golden.json';

// ── R1 (wörtlich aus testtreue-kern.ts, Verhalten unverändert) ──────────────
export interface CommitInfo { sha: string; betreff: string; dateien: string[] }
export interface Verstoss { sha: string; betreff: string; testDateien: string[] }

/** Conventional-Commit-Typ `refactor` — mit oder ohne Scope, auch `refactor!:`. */
export function istRefactorCommit(betreff: string): boolean {
  return /^refactor(\(|!|:)/i.test(betreff.trim());
}

/** Test-Dateien im Sinn von §6.3 (Unit/Golden-nah + e2e). */
export function istTestDatei(pfad: string): boolean {
  return (
    /(^|\/)src\/tests\//.test(pfad) ||
    /\.test\.tsx?$/.test(pfad) ||
    /(^|\/)e2e\/.*\.e2e\.ts$/.test(pfad)
  );
}

export function findeVerstoesse(commits: CommitInfo[]): Verstoss[] {
  const verstoesse: Verstoss[] = [];
  for (const c of commits) {
    if (!istRefactorCommit(c.betreff)) continue;
    const tests = c.dateien.filter(istTestDatei);
    if (tests.length > 0) verstoesse.push({ sha: c.sha, betreff: c.betreff, testDateien: tests });
  }
  return verstoesse;
}

/** R1-Squash (aus testtreue-kern.ts, PR #1026; Queue-Rauswurf #1023,
 *  merge_group 35912532181, 23.9.2026): Die Merge-Queue landet SQUASH — der
 *  eine Commit auf main trägt den PR-TITEL als Betreff und ALLE Dateien des
 *  PRs. Heisst der Titel `refactor(…)`, ist der Squash-Commit ein Verstoss,
 *  auch wenn jeder Einzel-Commit sauber `test(…)` deklariert. Bildet den
 *  künftigen Squash-Commit schon im PR-Lauf nach. */
export function squashVerstoss(prTitel: string, commits: CommitInfo[]): Verstoss | null {
  const dateien = [...new Set(commits.flatMap((c) => c.dateien))];
  const [v] = findeVerstoesse([{ sha: 'PR-Titel', betreff: prTitel, dateien }]);
  return v ?? null;
}

/** PR-Titel aus dem `pull_request`-Ereignis (GITHUB_EVENT_PATH); lokal und im
 *  `merge_group`-Lauf (dort IST HEAD der Squash-Commit) undefined. */
export function prTitelAusEreignis(
  env: Record<string, string | undefined>, lies: (pfad: string) => string,
): string | undefined {
  if (!env.GITHUB_EVENT_PATH || env.GITHUB_EVENT_NAME !== 'pull_request') return undefined;
  try {
    return (JSON.parse(lies(env.GITHUB_EVENT_PATH)) as { pull_request?: { title?: string } }).pull_request?.title;
  } catch {
    return undefined;
  }
}

// ── R2: Test → Engine ───────────────────────────────────────────────────────
/** Testdateien, deren Assertions R2 liest (inkl. *.property.test.ts). */
export function istAssertionTest(pfad: string): boolean {
  return /^src\/tests\/.+\.test\.tsx?$/.test(pfad);
}

/** Relative Modul-Verweise einer Datei, aufgelöst gegen `existiert`. */
export function importZiele(text: string, datei: string, existiert: (p: string) => boolean): string[] {
  const quelle = ts.createSourceFile(datei, text, ts.ScriptTarget.Latest, true,
    datei.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const specs: string[] = [];
  const besuchen = (n: ts.Node): void => {
    if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier
      && ts.isStringLiteral(n.moduleSpecifier)) specs.push(n.moduleSpecifier.text);
    if (ts.isCallExpression(n) && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0])) {
      const callee = n.expression.getText(quelle);
      if (n.expression.kind === ts.SyntaxKind.ImportKeyword || /^(vi\.(mock|doMock|importActual)|require)$/.test(callee)) {
        specs.push(n.arguments[0].text);
      }
    }
    ts.forEachChild(n, besuchen);
  };
  besuchen(quelle);
  const ziele = new Set<string>();
  for (const spec of specs) {
    if (!spec.startsWith('.')) continue;
    const roh = posix.normalize(posix.join(posix.dirname(datei), spec)).replace(/\.js$/, '');
    const kandidat = [roh, `${roh}.ts`, `${roh}.tsx`, `${roh}/index.ts`, `${roh}/index.tsx`].find(existiert);
    if (kandidat) ziele.add(kandidat);
  }
  return [...ziele].sort();
}

/** Risiko-Engines unter den Import-Zielen (behalten() aus gegenpruefung/kern). */
export function risikoEngines(ziele: string[]): string[] {
  return ziele.filter(behalten);
}

export interface TestStand {
  datei: string;
  /** Inhalt an der Basis (null = Datei neu). */
  alt: string | null;
  /** Inhalt am Kopf (null = Datei gelöscht). */
  neu: string | null;
}

export interface EngineBefund { engine: string; dateien: string[]; entfernt: string[] }

function sammle(ziel: Map<string, number>, m: Mengen): void {
  for (const art of ['describe', 'ittest', 'expect'] as const) {
    for (const [w, n] of m[art]) ziel.set(`${art}: ${w}`, (ziel.get(`${art}: ${w}`) ?? 0) + n);
  }
}

/**
 * R2-Kern: je Risiko-Engine die Assertions ALLER geänderten Testdateien, die
 * sie (an Basis bzw. Kopf) direkt importieren, als Multimenge poolen; was an
 * der Basis öfter vorkommt als am Kopf, ist geändert oder entfernt.
 */
export function entfernteRisikoAssertions(
  staende: TestStand[],
  existiertAlt: (p: string) => boolean,
  existiertNeu: (p: string) => boolean,
): EngineBefund[] {
  const pools = new Map<string, { alt: Map<string, number>; neu: Map<string, number>; dateien: Set<string> }>();
  const pool = (e: string) => pools.get(e) ?? pools.set(e, { alt: new Map(), neu: new Map(), dateien: new Set() }).get(e)!;
  for (const s of staende) {
    if (!istAssertionTest(s.datei)) continue;
    for (const [text, seite, existiert] of [[s.alt, 'alt', existiertAlt], [s.neu, 'neu', existiertNeu]] as const) {
      if (text === null) continue;
      const engines = risikoEngines(importZiele(text, s.datei, existiert));
      if (engines.length === 0) continue;
      const m = assertionMengen(text, s.datei);
      for (const e of engines) { const p = pool(e); p.dateien.add(s.datei); sammle(p[seite], m); }
    }
  }
  const befunde: EngineBefund[] = [];
  for (const [engine, p] of [...pools].sort(([a], [b]) => a.localeCompare(b))) {
    // Multimengen-Differenz: nur was an der Basis ÖFTER vorkommt als am Kopf.
    const entfernt = [...p.alt].filter(([w, n]) => n > (p.neu.get(w) ?? 0))
      .map(([w, n]) => `- (${n - (p.neu.get(w) ?? 0)}×) ${w}`).sort();
    if (entfernt.length > 0) befunde.push({ engine, dateien: [...p.dateien].sort(), entfernt });
  }
  return befunde;
}

// ── Trailer ─────────────────────────────────────────────────────────────────
export const FACHAENDERUNG_KOPF = /^fachaenderung:\s*/i;
const FORM = /^(\S.{2,}?)\s+(?:—|–|--?)\s+(\S.*)$/;

export type TrailerUrteil = { art: 'gueltig' } | { art: 'mangel'; grund: string };

/** Form `<Norm> — <Befund-ID oder Begründung>`, Befund-Teil ≥ 15 Zeichen. */
export function pruefeFachaenderungForm(wert: string): TrailerUrteil {
  const m = FORM.exec(wert.trim());
  if (!m) return { art: 'mangel', grund: `Form '<Norm> — <Befund-ID oder Begründung>' fehlt` };
  if (m[2].trim().length < 15) return { art: 'mangel', grund: `Befund-Teil nach '—' zu kurz (< 15 Zeichen)` };
  return { art: 'gueltig' };
}

// ── Gesamturteil ────────────────────────────────────────────────────────────
export interface Eingabe {
  commits: CommitInfo[];
  engineBefunde: EngineBefund[];
  goldenGeaendert: boolean;
  /** Trailer-Werte aus der massgeblichen Quelle (PR-Body oder Zweig-Commits). */
  trailer: string[];
  /** Woher die Trailer stammen — nur für die Meldung. */
  quelle: string;
  /** PR-Titel = Betreff des künftigen Queue-Squash (nur im pull_request-Lauf). */
  prTitel?: string;
}

export interface Urteil { rot: boolean; text: string }

const HEILWEG =
  `  Heilweg (Skill auftrag §14.5, CLAUDE.md §6.3): die Änderung als fachliche\n` +
  `  deklarieren — Trailer im LETZTEN Absatz (PR-Body bzw. Commit):\n` +
  `    Fachaenderung: <Norm> — <Befund-ID oder Begründung, ≥ 15 Zeichen>\n` +
  `  Beispiel:  Fachaenderung: Art. 266a OR — F4-01 Mietkündigung Zustelltag\n` +
  `  Auf Risiko-Engines verlangt check:merge-schutz zusätzlich die Gegenprüfungs-\n` +
  `  Quittung — hier nicht doppelt geprüft.`;

export function bewerte(e: Eingabe): Urteil {
  const teile: string[] = [];
  let rot = false;

  const verstoesse = findeVerstoesse(e.commits);
  if (verstoesse.length > 0) {
    rot = true;
    const liste = verstoesse.map((v) =>
      `  ${v.sha.slice(0, 9)}  «${v.betreff.slice(0, 70)}»\n` +
      v.testDateien.slice(0, 6).map((t) => `      ${t}`).join('\n') +
      (v.testDateien.length > 6 ? `\n      … und ${v.testDateien.length - 6} weitere` : '')).join('\n');
    teile.push(
      `check:fachaenderung ROT — §6.3: als 'refactor' deklarierte(r) Commit(s) ändern Test-Dateien:\n${liste}\n\n` +
      `  Ein Refactoring lässt Tests unangetastet — sie sind sein Beweis; auch ein\n` +
      `  Fachaenderung-Trailer heilt das nicht. Muss ein Test geändert werden, ist es\n` +
      `  eine fachliche Änderung: eigener Commit, eigener Typ (fix/feat/test) mit\n` +
      `  Begründung (CLAUDE.md §6.3, Skill refactoring).`);
  }

  // R1-Squash: nur wenn kein Einzel-Commit schon rot ist (Verhalten wie #1026).
  const squash = verstoesse.length === 0 && e.prTitel ? squashVerstoss(e.prTitel, e.commits) : null;
  if (squash && e.prTitel) {
    rot = true;
    teile.push(
      `check:fachaenderung ROT — §6.3 (Squash): der PR-Titel «${e.prTitel.slice(0, 70)}» ist als 'refactor'\n` +
      `  deklariert, der PR ändert aber Test-Dateien:\n` +
      squash.testDateien.slice(0, 6).map((t) => `      ${t}`).join('\n') + '\n\n' +
      `  Die Merge-Queue landet SQUASH mit dem PR-Titel als Betreff — der Commit auf main\n` +
      `  wäre ein 'refactor', der Tests ändert, und fiele im merge_group-Lauf durch.\n` +
      `  PR-Titel-Typ ändern (feat/fix/test), dann den PR-Lauf neu starten (Titel-Änderung\n` +
      `  allein startet ihn nicht). Beleg: Queue-Rauswurf #1023, 23.9.2026.`);
  }

  const pflicht = e.engineBefunde.length > 0 || e.goldenGeaendert;
  if (pflicht) {
    const urteile = e.trailer.map((t) => ({ t, u: pruefeFachaenderungForm(t) }));
    const gueltig = urteile.filter((x) => x.u.art === 'gueltig');
    const anlass = [
      ...e.engineBefunde.map((b) =>
        `  Engine ${b.engine} (Tests: ${b.dateien.join(', ')}):\n` +
        b.entfernt.slice(0, 5).map((z) => `      ${z.slice(0, 110)}`).join('\n') +
        (b.entfernt.length > 5 ? `\n      … und ${b.entfernt.length - 5} weitere` : '')),
      ...(e.goldenGeaendert ? [`  ${GOLDEN} geändert`] : []),
    ].join('\n');
    if (gueltig.length === 0) {
      rot = true;
      const maengel = urteile.map((x) => `    · «${x.t.slice(0, 90)}» → ${x.u.art === 'mangel' ? x.u.grund : ''}`).join('\n');
      teile.push(
        `check:fachaenderung ROT — geänderte/entfernte Assertion(s) an Risiko-Engine-Tests ` +
        `oder Golden-Diff, aber kein gültiger 'Fachaenderung:'-Trailer (${e.quelle}):\n${anlass}\n\n` +
        (maengel ? `  Gefunden, aber formal untauglich:\n${maengel}\n\n` : '') + HEILWEG);
    } else {
      teile.push(`check:fachaenderung — fachliche Änderung deklariert (${e.quelle}): «${gueltig[0].t.slice(0, 90)}»\n${anlass}`);
    }
  }

  if (!rot) {
    teile.push(`check:fachaenderung grün — ${e.commits.length} Commit(s); kein refactor-Commit ändert Tests (§6.3)` +
      (pflicht ? '; Fachänderung deklariert.' : '; keine geänderte Assertion an Risiko-Engine-Tests, kein Golden-Diff.'));
  }
  return { rot, text: teile.join('\n\n') };
}
