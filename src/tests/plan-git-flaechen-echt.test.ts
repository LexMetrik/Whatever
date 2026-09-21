import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { erhebe, raeumeAb } from '../../scripts/plan/gitFlaechenSammeln';

// ─── Git-Flächen · Integration gegen ein ECHTES temporäres Repo ───────────────
//
// Der Kern-Test (plan-git-flaechen.test.ts) prüft die Klassierung über
// erfundene Fakten. Dieser hier prüft die ANDERE Hälfte: dass der Sammler die
// Fakten richtig aus git zieht und dass `--ausfuehren` genau das löscht, was
// klassiert wurde — mit echtem `git worktree remove`/`git branch -d|-D`.
//
// §6.7: ein Löschpfad, den nie jemand hat laufen sehen, ist kein geprüfter
// Löschpfad. Er läuft hier und NUR hier — im echten Repo fährt der Befehl im
// Auftrag ausschliesslich den Trockenlauf.
//
// Die PR-Lage wird injiziert (`prs`), nicht über `gh` geholt: der Test darf
// weder Netz noch ein GitHub-Konto brauchen.

let root = '';
let repo = '';
let wtLeer = '';
let wtSchmutzig = '';
let shaB1 = '';
let shaB2 = '';

const g = (args: string[], cwd = repo) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const sha = (ref: string) => g(['rev-parse', ref]).trim();
const schreibeCommit = (datei: string, text: string) => {
  writeFileSync(join(repo, datei), text);
  g(['add', '-A']);
  g(['commit', '-m', `${datei}: ${text}`]);
};
const branchNamen = () => g(['for-each-ref', 'refs/heads', '--format=%(refname:short)']).split('\n').filter(Boolean).sort();
const pr = (number: number, headRefName: string, headRefOid: string, state = 'MERGED') => ({ number, headRefName, headRefOid, state });

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'lexm-gitflaechen-'));
  repo = join(root, 'repo');
  mkdirSync(repo);
  g(['init', '-b', 'main']);
  g(['config', 'user.email', 'test@example.invalid']);
  g(['config', 'user.name', 'Test']);
  g(['config', 'commit.gpgsign', 'false']);

  schreibeCommit('a.txt', 'A');
  g(['branch', 'leer']); // 0 Commits vor main
  g(['branch', 'schmutzig']); // ebenfalls leer — nur der dreckige Worktree hält ihn

  g(['checkout', '-b', 'gelandet']);
  schreibeCommit('b1.txt', 'B1');
  shaB1 = sha('HEAD');
  schreibeCommit('b2.txt', 'B2');
  shaB2 = sha('HEAD');

  g(['checkout', 'main']);
  g(['checkout', '-b', 'offen']);
  schreibeCommit('c.txt', 'C');
  g(['checkout', 'main']);
  schreibeCommit('d.txt', 'D'); // main läuft weiter — `leer` bleibt trotzdem Vorfahre

  wtLeer = join(root, 'wt-leer');
  wtSchmutzig = join(root, 'wt-schmutzig');
  g(['worktree', 'add', wtLeer, 'leer']);
  g(['worktree', 'add', wtSchmutzig, 'schmutzig']);
  writeFileSync(join(wtSchmutzig, 'unversioniert.txt'), 'nicht committet'); // untracked = dirty
});

afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

describe('Sammler + Abräumen gegen ein echtes Repo', () => {
  it('ROT: ein Commit NACH dem PR-Head hält den Branch — auch mit gemergtem PR', () => {
    const bef = erhebe({ cwd: repo, prs: [pr(41, 'gelandet', shaB1)] });
    const b = bef.branches.find((x) => x.name === 'gelandet')!;
    expect(b.abraeumbar).toBe(false);
    expect(b.grund).toContain('1 Commit danach');
  });

  it('klassiert die vier Branches und die zwei Plätze richtig', () => {
    const bef = erhebe({ cwd: repo, prs: [pr(42, 'gelandet', shaB2)] });
    const b = (n: string) => bef.branches.find((x) => x.name === n)!;

    expect(bef.ghVerfuegbar).toBe(true);
    expect(b('leer')).toMatchObject({ klasse: 'leer', abraeumbar: true, flagge: '-d' });
    expect(b('gelandet')).toMatchObject({ klasse: 'gelandet', abraeumbar: true, flagge: '-D' });
    expect(b('offen')).toMatchObject({ klasse: 'offen', abraeumbar: false });
    expect(b('offen').vorMain).toBe(1);
    expect(b('main')).toMatchObject({ abraeumbar: false, stumm: true });

    // Der dreckige Platz und sein Branch bleiben — das ist der Realfall vom
    // 21.9.2026 (Worktree mit 9 uncommitteten Dateien).
    const s = bef.worktrees.find((w) => w.name === 'wt-schmutzig')!;
    expect(s.abraeumbar).toBe(false);
    expect(s.grund).toContain('nicht sauber');
    expect(b('schmutzig').abraeumbar).toBe(false);

    expect(bef.worktrees.find((w) => w.name === 'wt-leer')!.abraeumbar).toBe(true);
    expect(bef.worktrees.find((w) => w.name === 'repo')!.stumm).toBe(true);
  });

  it('--ausfuehren löscht genau die abräumbaren Flächen — offene Arbeit überlebt', () => {
    const bef = erhebe({ cwd: repo, prs: [pr(42, 'gelandet', shaB2)] });
    const shaLeer = bef.branches.find((x) => x.name === 'leer')!.spitze;
    const { zeilen, fehler } = raeumeAb(bef, { cwd: repo });

    expect(fehler).toBe(0);
    // Der alte SHA steht im Protokoll — sonst wäre nichts wiederherstellbar.
    expect(zeilen.join('\n')).toContain(`git branch leer ${shaLeer}`);

    expect(branchNamen()).toEqual(['main', 'offen', 'schmutzig']);
    expect(existsSync(wtLeer)).toBe(false);
    expect(existsSync(wtSchmutzig)).toBe(true);
    expect(existsSync(join(wtSchmutzig, 'unversioniert.txt'))).toBe(true);

    // Der gelöschte `gelandet`-Commit ist über seinen SHA weiter erreichbar.
    expect(sha(shaB2)).toBe(shaB2);
  });

  it('ohne gh-Antwort bleibt der gelandete Branch stehen (fail-closed)', () => {
    // Nach dem Abräumen oben: `offen` und `schmutzig` sind übrig. Ein zweiter
    // Lauf ohne PR-Wissen darf an beiden nichts ändern.
    const bef = erhebe({ cwd: repo, mitGh: false });
    expect(bef.ghVerfuegbar).toBe(false);
    expect(bef.branches.filter((b) => b.abraeumbar)).toEqual([]);
    expect(raeumeAb(bef, { cwd: repo }).zeilen).toEqual(['   — nichts abzuräumen']);
    expect(branchNamen()).toEqual(['main', 'offen', 'schmutzig']);
  });
});
