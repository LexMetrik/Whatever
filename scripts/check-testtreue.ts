// scripts/check-testtreue.ts — §6.3-Diff-Tor, git-Runner (QS-AUDIT-VERWEISE, 8.8.2026).
// Regel, Grenzen und Klassifizierer: testtreue-kern.ts (dort testbar ohne git).
// Muster wie check-merge-schutz.ts: merge-base(origin/main)..HEAD, kein stiller Skip.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { findeVerstoesse, squashMeldung, type CommitInfo } from './testtreue-kern';

function git(args: string[]): string {
  return execFileSync('git', args, {
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 64 * 1024 * 1024,
  }).toString('utf8');
}

function raus(code: number, text: string): never {
  console.log(text);
  process.exit(code);
}

const BASIS = process.env.TESTTREUE_BASIS ?? 'origin/main';
let basis: string;
try {
  basis = git(['merge-base', BASIS, 'HEAD']).trim();
} catch {
  // Kein stiller Skip (§6.7): ohne Referenz ist das Tor kein Tor.
  raus(1, `check:testtreue ROT — Referenz '${BASIS}' nicht auflösbar. Erst 'git fetch origin', dann erneut.`);
}

const shas = git(['rev-list', `${basis}..HEAD`]).split('\n').map((z) => z.trim()).filter(Boolean);
const commits: CommitInfo[] = shas.map((sha) => {
  const betreff = git(['log', '-1', '--format=%s', sha]).trim();
  const dateien = git(['diff-tree', '--no-commit-id', '--name-only', '-r', sha])
    .split('\n').map((z) => z.trim()).filter(Boolean);
  return { sha, betreff, dateien };
});

const verstoesse = findeVerstoesse(commits);

// PR-Lauf: den künftigen Squash-Commit der Merge-Queue mitprüfen (Kern: squashMeldung).
const squash = squashMeldung(process.env, (p) => readFileSync(p, 'utf8'), commits);
if (squash && verstoesse.length === 0) raus(1, squash);

if (verstoesse.length === 0) {
  raus(0, `check:testtreue grün — ${commits.length} Commit(s) im Bereich ${basis.slice(0, 8)}..HEAD, ` +
    `kein als 'refactor' deklarierter Commit ändert Tests (§6.3).`);
}

const liste = verstoesse.map((v) =>
  `  ${v.sha.slice(0, 9)}  «${v.betreff.slice(0, 70)}»\n` +
  v.testDateien.slice(0, 6).map((t) => `      ${t}`).join('\n') +
  (v.testDateien.length > 6 ? `\n      … und ${v.testDateien.length - 6} weitere` : '')
).join('\n');
raus(1,
  `check:testtreue ROT — §6.3: als 'refactor' deklarierte(r) Commit(s) ändern Test-Dateien:\n${liste}\n\n` +
  `  Ein Refactoring lässt Tests unangetastet — sie sind sein Beweis. Muss ein Test\n` +
  `  geändert werden, ist es eine fachliche Änderung: eigener Commit, eigener Typ\n` +
  `  (fix/feat/test) mit Begründung, nie beiläufig im Umbau (CLAUDE.md §6.3, Skill refactoring).`);
