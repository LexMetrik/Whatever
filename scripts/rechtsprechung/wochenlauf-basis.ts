// ─── Wochenlauf: Aufbau-Basis wählen und PR-Schutz (CLI, git + gh) ─────────
//
//   vite-node scripts/rechtsprechung/wochenlauf-basis.ts -- --datum=YYYY-MM-DD --aus=<ordner>
//   vite-node scripts/rechtsprechung/wochenlauf-basis.ts -- --pruefe=<nr> --branch=<name>
//
// Modus «wählen» (vor dem Lauf, A6/A9):
//  · kein offener Auto-PR (Head auto/rechtsprechung-*) → Basis main, neuer Branch.
//  · offener Auto-PR IN PRÜFUNG (inPruefung, wochenlauf-kern.ts) → aussetzen:
//    nichts überschreiben, Warnung + Summary im Workflow.
//  · offener Auto-PR unberührt → auf SEINEM Kopf aufbauen und main einmergen.
//    Grund: die Generatoren nehmen «die N neuesten, die noch nicht im Bestand
//    sind» (--eidg-pro/--kanton-pro). Auf main aufgebaut, fehlten die Einträge
//    der Vorwoche im Bestand UND in der neuen Auswahl — der Force-Push hätte sie
//    still verworfen (Befund A6, 25.9.2026). Merge-Konflikt → Merge abbrechen,
//    auf main aufbauen, «Vorwoche verworfen: <Grund>» ⇒ Entwurf.
// Schreibt <aus>/basis.json und GITHUB_OUTPUT (branch, nr, lease, aussetzen, grund).
// basis.json trägt dazu `vorwoche` (A2, Gegenprüfung #1113): Entwurf-Status des
// offenen Auto-PR und die offenen Befunde aus seinem Body (leseBefundBlock,
// wochenlauf-vorwoche.ts) — der Lauf prüft sie zwingend erneut.
//
// Modus «prüfen» (direkt vor dem Push): dieselbe inPruefung-Frage noch einmal —
// zwischen Laufstart und Push liegen bis zu zwei Stunden. Exit 3 = in Prüfung.
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inPruefung, type PrLage } from './wochenlauf-kern';
import { leseBefundBlock, type Vorwoche } from './wochenlauf-vorwoche';

export type Git = (...a: string[]) => string;
export const PR_PRAEFIX = 'auto/rechtsprechung-';

/**
 * Auf dem Kopf des Vorwochen-Branch aufbauen und `main` einmergen. Bei Konflikt
 * wird der Merge abgebrochen und auf den Startstand zurückgekehrt (Aufbau auf
 * main); der Grund nennt die Konfliktdateien. `git` wirft bei Exit ≠ 0.
 */
export function baueAufVorwoche(git: Git, branch: string, main = 'origin/main'): { ok: true } | { ok: false; grund: string } {
  const start = git('rev-parse', 'HEAD').trim();
  git('checkout', '-q', '-B', branch, `origin/${branch}`);
  try {
    git('merge', '-q', '--no-edit', '-m', `Merge ${main} in ${branch} (Wochenlauf)`, main);
    return { ok: true };
  } catch {
    const konflikt = git('diff', '--name-only', '--diff-filter=U').trim().split('\n').filter(Boolean);
    try { git('merge', '--abort'); } catch { /* kein Merge offen */ }
    git('checkout', '-q', '-f', '--detach', start);
    return { ok: false, grund: `Merge-Konflikt mit main in ${konflikt.length ? konflikt.slice(0, 5).join(', ') : 'unbekannt'}${konflikt.length > 5 ? ` (+${konflikt.length - 5})` : ''}` };
  }
}

const sh = (cmd: string, args: string[]) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const git: Git = (...a) => sh('git', a);
const gh = (...a: string[]) => sh('gh', a);

/** Alles, was inPruefung braucht, von GitHub und aus git (branch muss gefetcht sein). */
function sammle(nr: string, branch: string): PrLage {
  const commits = git('log', '--format=%an%x09%cn', `origin/main..origin/${branch}`).trim().split('\n').filter(Boolean)
    .map((z) => { const [autor, committer] = z.split('\t'); return { autor, committer }; });
  const pr = JSON.parse(gh('pr', 'view', nr, '--json', 'body,labels')) as { body: string; labels: Array<{ name: string }> };
  const menschen: string[] = [];
  for (const pfad of [`repos/{owner}/{repo}/issues/${nr}/comments`, `repos/{owner}/{repo}/pulls/${nr}/reviews`, `repos/{owner}/{repo}/pulls/${nr}/comments`]) {
    menschen.push(...gh('api', '--paginate', pfad, '--jq', '.[] | select(.user.type == "User") | .user.login').trim().split('\n').filter(Boolean));
  }
  return { commits, body: pr.body ?? '', labels: pr.labels.map((l) => l.name), menschen };
}

function ausgabe(werte: Record<string, string>): void {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(werte).map(([k, v]) => `${k}=${v.replace(/\n/g, ' ')}\n`).join(''));
}

function main(): void {
  const arg = (n: string) => process.argv.find((a) => a.startsWith(n + '='))?.slice(n.length + 1);
  const pruefe = arg('--pruefe');
  if (pruefe) {
    const branch = arg('--branch') ?? '';
    git('fetch', '-q', 'origin', branch, 'main');
    const grund = inPruefung(sammle(pruefe, branch));
    if (grund) { console.log(`::warning::PR #${pruefe} ist inzwischen in Prüfung (${grund}) — nicht überschrieben.`); process.exit(3); }
    return;
  }
  const datum = arg('--datum') ?? '';
  const aus = arg('--aus') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || !aus) { console.error('--datum=YYYY-MM-DD und --aus=<ordner> nötig'); process.exit(2); }
  mkdirSync(aus, { recursive: true });
  git('fetch', '-q', 'origin', 'main');
  const offen = (JSON.parse(gh('pr', 'list', '--state', 'open', '--limit', '200', '--json', 'number,headRefName')) as Array<{ number: number; headRefName: string }>)
    .filter((p) => p.headRefName.startsWith(PR_PRAEFIX)).sort((a, b) => b.number - a.number);
  if (offen.length > 1) console.log(`::warning::${offen.length} offene Auto-PRs (${offen.map((p) => `#${p.number}`).join(', ')}) — es wird nur #${offen[0].number} fortgeführt.`);
  let basis = { branch: `${PR_PRAEFIX}${datum}`, nr: '', lease: '', aussetzen: '', grund: '', vorwocheVerworfen: '', vorwoche: null as Vorwoche | null };
  if (offen.length) {
    const { number, headRefName: branch } = offen[0];
    git('fetch', '-q', 'origin', branch);
    const lease = git('rev-parse', `origin/${branch}`).trim();
    basis = { ...basis, branch, nr: String(number), lease };
    const grund = inPruefung(sammle(String(number), branch));
    if (grund) basis = { ...basis, aussetzen: 'true', grund };
    else {
      const pv = JSON.parse(gh('pr', 'view', String(number), '--json', 'body,isDraft')) as { body?: string; isDraft: boolean };
      basis = { ...basis, vorwoche: { entwurf: pv.isDraft, ...leseBefundBlock(pv.body ?? '') } };
      const r = baueAufVorwoche(git, branch);
      if (!r.ok) basis = { ...basis, vorwocheVerworfen: r.grund };
    }
  }
  writeFileSync(join(aus, 'basis.json'), JSON.stringify(basis, null, 1) + '\n');
  ausgabe({ branch: basis.branch, nr: basis.nr, lease: basis.lease, aussetzen: basis.aussetzen, grund: basis.grund });
  console.log(`[wochenlauf-basis] ${basis.aussetzen ? `AUSSETZEN — PR #${basis.nr} in Prüfung: ${basis.grund}` : basis.nr ? `baut auf PR #${basis.nr} (${basis.branch})${basis.vorwocheVerworfen ? ` — Vorwoche verworfen: ${basis.vorwocheVerworfen}` : ''}` : `neuer Branch ${basis.branch} auf main`}`);
}

// Nur als CLI ausführen, nicht beim Import im Test (Muster check-e2e-flake.ts:
// unter vite-node zeigt process.argv[1] aufs Binary, darum VITEST).
if (!process.env.VITEST) main();
