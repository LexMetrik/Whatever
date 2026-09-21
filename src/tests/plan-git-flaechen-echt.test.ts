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
let wtNotiz = '';
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
const pr = (number: number, headRefName: string, headRefOid: string, state = 'MERGED', baseRefName = 'main') =>
  ({ number, headRefName, headRefOid, state, baseRefName });

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'lexm-gitflaechen-'));
  repo = join(root, 'repo');
  mkdirSync(repo);
  g(['init', '-b', 'main']);
  g(['config', 'user.email', 'test@example.invalid']);
  g(['config', 'user.name', 'Test']);
  g(['config', 'commit.gpgsign', 'false']);

  writeFileSync(join(repo, '.gitignore'), 'notizen/\nnode_modules/\n');
  schreibeCommit('a.txt', 'A');
  g(['branch', 'leer']); // 0 Commits vor main
  g(['branch', 'schmutzig']); // ebenfalls leer — nur der dreckige Worktree hält ihn
  g(['branch', 'notiztraeger']); // leer — nur eine GITIGNORTE Datei hält ihn

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
  wtNotiz = join(root, 'wt-notiz');
  g(['worktree', 'add', wtLeer, 'leer']);
  g(['worktree', 'add', wtSchmutzig, 'schmutzig']);
  g(['worktree', 'add', wtNotiz, 'notiztraeger']);
  writeFileSync(join(wtSchmutzig, 'unversioniert.txt'), 'nicht committet'); // untracked = dirty
  // Nur GITIGNORT: `git status --porcelain` zeigt hier nichts, und
  // `git worktree remove` löscht die Datei ohne `--force` klaglos mit
  // (empirisch belegt 21.9.2026) — der Realfall sind Davids `.claude/notizen/`.
  mkdirSync(join(wtNotiz, 'notizen'));
  writeFileSync(join(wtNotiz, 'notizen', 'uebergabe.md'), 'Davids Pflicht-Notiz');
  // Reiner Bau-Cache im ABRÄUMBAREN Platz: darf ihn NICHT festhalten.
  mkdirSync(join(wtLeer, 'node_modules'));
  writeFileSync(join(wtLeer, 'node_modules', 'x.js'), '// Cache');
});

afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

/** Nichts belegt — die Belegungsregel prüft der Kern-Test, nicht `lsof`. */
const FREI: string[] = [];

describe('Sammler + Abräumen gegen ein echtes Repo', () => {
  it('ROT: ein Commit NACH dem PR-Head hält den Branch — auch mit gemergtem PR', () => {
    const bef = erhebe({ cwd: repo, belegtePfade: FREI, prs: [pr(41, 'gelandet', shaB1)] });
    const b = bef.branches.find((x) => x.name === 'gelandet')!;
    expect(b.abraeumbar).toBe(false);
    expect(b.grund).toContain('1 Commit danach');
  });

  it('ROT (3): PR gemergt, aber nach einem Feature-Zweig ⇒ nicht abräumbar', () => {
    const bef = erhebe({ cwd: repo, belegtePfade: FREI, prs: [pr(43, 'gelandet', shaB2, 'MERGED', 'feat/sammel')] });
    const b = bef.branches.find((x) => x.name === 'gelandet')!;
    expect(b.abraeumbar).toBe(false);
    expect(b.grund).toContain('feat/sammel');
  });

  it('ROT (1): ein laufender Prozess im Worktree hält Platz UND Branch', () => {
    // Pfad aus dem Befund nehmen, nicht selbst bauen: git meldet den
    // aufgelösten Pfad (/private/var/… statt /var/…), und genau so druckt ihn
    // auch `lsof` — ein handgebauter Pfad träfe daneben.
    const pfad = erhebe({ cwd: repo, belegtePfade: FREI }).worktrees.find((w) => w.name === 'wt-leer')!.pfad;
    const bef = erhebe({ cwd: repo, belegtePfade: [join(pfad, 'unterordner')], prs: [pr(42, 'gelandet', shaB2)] });
    expect(bef.worktrees.find((w) => w.name === 'wt-leer')!.abraeumbar).toBe(false);
    expect(bef.worktrees.find((w) => w.name === 'wt-leer')!.grund).toContain('laufender Prozess');
    expect(bef.branches.find((x) => x.name === 'leer')!.abraeumbar).toBe(false);
  });

  it('klassiert die Branches und die drei Plätze richtig', () => {
    const bef = erhebe({ cwd: repo, belegtePfade: FREI, prs: [pr(42, 'gelandet', shaB2)] });
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

    // ROT (2): NUR eine gitignorte Datei — `git status --porcelain` wäre hier
    // leer. Der Platz und sein Branch müssen trotzdem stehen bleiben.
    const n = bef.worktrees.find((w) => w.name === 'wt-notiz')!;
    expect(n.abraeumbar).toBe(false);
    expect(n.grund).toContain('notizen/');
    expect(b('notiztraeger').abraeumbar).toBe(false);

    // Umgekehrt: ein reiner Bau-Cache (`node_modules/`) hält nichts auf.
    expect(bef.worktrees.find((w) => w.name === 'wt-leer')!.abraeumbar).toBe(true);
    expect(bef.worktrees.find((w) => w.name === 'repo')!.stumm).toBe(true);
  });

  it('--ausfuehren löscht genau die abräumbaren Flächen — offene Arbeit und Notizen überleben', () => {
    const bef = erhebe({ cwd: repo, belegtePfade: FREI, prs: [pr(42, 'gelandet', shaB2)] });
    const shaLeer = bef.branches.find((x) => x.name === 'leer')!.spitze;
    const { zeilen, fehler } = raeumeAb(bef, { cwd: repo });

    expect(fehler).toBe(0);
    // Der alte SHA steht im Protokoll — sonst wäre nichts wiederherstellbar.
    expect(zeilen.join('\n')).toContain(`git branch leer ${shaLeer}`);

    expect(branchNamen()).toEqual(['main', 'notiztraeger', 'offen', 'schmutzig']);
    expect(existsSync(wtLeer)).toBe(false);
    expect(existsSync(wtSchmutzig)).toBe(true);
    expect(existsSync(join(wtSchmutzig, 'unversioniert.txt'))).toBe(true);
    // Der Kern des Bug-Checks: die gitignorte Notiz steht noch da.
    expect(existsSync(join(wtNotiz, 'notizen', 'uebergabe.md'))).toBe(true);

    // Der gelöschte `gelandet`-Commit ist über seinen SHA weiter erreichbar.
    expect(sha(shaB2)).toBe(shaB2);
  });

  it('ohne gh-Antwort bleibt der gelandete Branch stehen (fail-closed)', () => {
    // Nach dem Abräumen oben sind `notiztraeger`, `offen` und `schmutzig`
    // übrig. Ein zweiter Lauf ohne PR-Wissen darf an keinem etwas ändern.
    const bef = erhebe({ cwd: repo, belegtePfade: FREI, mitGh: false });
    expect(bef.ghVerfuegbar).toBe(false);
    expect(bef.branches.filter((b) => b.abraeumbar)).toEqual([]);
    expect(raeumeAb(bef, { cwd: repo }).zeilen).toEqual(['   — nichts abzuräumen']);
    expect(branchNamen()).toEqual(['main', 'notiztraeger', 'offen', 'schmutzig']);
  });
});
