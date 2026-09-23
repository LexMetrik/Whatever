// scripts/testtreue-kern.ts — §6.3-Diff-Tor, reiner Kern (QS-AUDIT-VERWEISE, 8.8.2026).
// Bis 31.8.2026 `scripts/check-testtreue-kern.ts`; umbenannt, weil das Modul kein
// Tor-Einstieg ist (kein `check:*`-Skript ruft es direkt) und darum nicht in die
// Tor-Fläche `scripts/check-*.ts` gehört. Einstieg bleibt check-testtreue.ts.
//
// §6.3: «Tests werden bei Refactorings nicht angepasst.» Muss ein Test geändert
// werden, ist es eine fachliche Änderung und gehört in einen eigenen,
// deklarierten Schritt. Das Audit 7.8.2026 belegte, dass die Prosa-Regel allein
// nicht trägt (§6.7-Muster: Regeln wirken fast nur als Tor) — dieses Tor prüft
// den COMMITTETEN Bereich merge-base(origin/main)..HEAD: ein Commit, der sich
// selbst als `refactor` deklariert UND Test-Dateien ändert, macht rot.
//
// Bewusste Grenzen: Das Tor liest die Selbst-Deklaration (Conventional-Commit-
// Typ). Ein fachlicher Commit, der Tests ändert, ist erlaubt (genau das
// verlangt §6.3: eigener, deklarierter Schritt — d. h. NICHT als refactor
// deklariert). Ein Refactoring, das sich als `feat` tarnt, fängt das Tor nicht
// — es erzwingt aber, dass die Tarnung eine aktive Falschdeklaration wäre
// statt eines Versehens beim «Test kurz mit anpassen».
// ── Reiner Kern (testbar ohne git) ──────────────────────────────────────────
export interface CommitInfo {
  sha: string;
  betreff: string;
  dateien: string[];
}

export interface Verstoss {
  sha: string;
  betreff: string;
  testDateien: string[];
}

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

/** Squash-Falle (Queue-Rauswurf #1023, merge_group 35912532181, 23.9.2026):
 *  Die Merge-Queue landet SQUASH — der eine Commit auf main trägt den
 *  PR-TITEL als Betreff und ALLE Dateien des PRs. Einzel-Commits, die eine
 *  Test-Änderung sauber als `test(…)` deklarieren, retten den PR dann nicht:
 *  heisst der Titel `refactor(…)`, ist der Squash-Commit ein Verstoss, und das
 *  Tor schlägt erst im `merge_group`-Lauf an (~10 min Queue-Zeit verloren).
 *  Diese Prüfung bildet den künftigen Squash-Commit schon im PR-Lauf nach. */
export function squashVerstoss(prTitel: string, commits: CommitInfo[]): Verstoss | null {
  const dateien = [...new Set(commits.flatMap((c) => c.dateien))];
  const [v] = findeVerstoesse([{ sha: 'PR-Titel', betreff: prTitel, dateien }]);
  return v ?? null;
}

/** PR-Titel aus dem `pull_request`-Ereignis; lokal und im `merge_group`-Lauf
 *  (dort IST HEAD der Squash-Commit) undefined. */
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

/** Rot-Meldung für den künftigen Squash-Commit, sonst null. */
export function squashMeldung(
  env: Record<string, string | undefined>, lies: (pfad: string) => string, commits: CommitInfo[],
): string | null {
  const titel = prTitelAusEreignis(env, lies);
  const v = titel ? squashVerstoss(titel, commits) : null;
  if (!v || !titel) return null;
  return `check:testtreue ROT — §6.3 (Squash): der PR-Titel «${titel.slice(0, 70)}» ist als 'refactor'\n` +
    `  deklariert, der PR ändert aber Test-Dateien:\n` +
    v.testDateien.slice(0, 6).map((t) => `      ${t}`).join('\n') + '\n\n' +
    `  Die Merge-Queue landet SQUASH mit dem PR-Titel als Betreff — der Commit auf main\n` +
    `  wäre ein 'refactor', der Tests ändert, und fiele im merge_group-Lauf durch.\n` +
    `  PR-Titel-Typ ändern (feat/fix/test), dann den PR-Lauf neu starten (Titel-Änderung\n` +
    `  allein startet ihn nicht). Beleg: Queue-Rauswurf #1023, 23.9.2026.`;
}
