// src/tests/merge-schutz-hash-bindung.test.ts — Hash-Bindung der Quittung
// (PRUEF-AUTOMATIK, Entscheid David 19.10.2026). Teil 1: reine Funktionen aus
// scripts/gegenpruefung/register-bindung.ts. Teil 2: das Tor selbst gegen ein
// temporäres git-Repo — Rot-Probe (falscher Hash, Inhalt nach Quittung
// geändert) und Grün-Probe (korrekter Hash, auch gestapelte Queue-Commits).
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { risikoBereichHash } from '../../scripts/gegenpruefung/kern';
import { bewerteBindung, leseRegisterQuittungen } from '../../scripts/gegenpruefung/register-bindung';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const H1 = 'a'.repeat(64);
const H2 = 'b'.repeat(64);

describe('leseRegisterQuittungen', () => {
  it('liest Hash und Verdikt aus der echten Registerform, maskierte Pipes in der Engine-Zelle stören nicht', () => {
    const z = `| 2026-10-16 | a \\| b (committeter Bereich) | ${H1} | bestanden | fedlex x 20261001 | Beleg |`;
    expect(leseRegisterQuittungen([z])).toEqual([{ hash: H1, verdikt: 'bestanden' }]);
  });
  it('Zeilen ohne 64-hex-Hash in der dritten Zelle zählen nicht (Prosa, Kopfzeile, Trenner)', () => {
    expect(
      leseRegisterQuittungen(['- Eintrag X', '| datum | engine | hash | verdikt |', '|---|---|---|---|', `| d | e | ${'g'.repeat(64)} | bestanden |`]),
    ).toEqual([]);
  });
});

describe('bewerteBindung', () => {
  const gut = [{ hash: H1, verdikt: 'bestanden' }];
  it('Hash des Gesamtbereichs gequittet ⇒ ok (voll)', () => {
    expect(bewerteBindung(gut, H1, [])).toEqual({ ok: true, art: 'voll', gedeckt: 1 });
  });
  it('behoben gilt wie bestanden', () => {
    expect(bewerteBindung([{ hash: H1, verdikt: 'behoben' }], H1, []).ok).toBe(true);
  });
  it('anderer Hash ⇒ Fehler mit der klaren Meldung «Quittung passt nicht zum Diff»', () => {
    const r = bewerteBindung(gut, H2, []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.grund).toContain('Quittung passt nicht zum Diff');
  });
  it('Hash passt, Verdikt nicht (widerlegt) ⇒ Fehler', () => {
    const r = bewerteBindung([{ hash: H1, verdikt: 'widerlegt' }], H1, []);
    expect(r.ok).toBe(false);
  });
  it('gestapelte Queue-Einheiten: jede mit eigener Quittung ⇒ ok, fehlt eine ⇒ Fehler', () => {
    const q = [{ hash: H1, verdikt: 'bestanden' }, { hash: H2, verdikt: 'bestanden' }];
    const einheiten = [{ ref: 'c1', hash: H1 }, { ref: 'c2', hash: H2 }, { ref: 'c3', hash: null }];
    expect(bewerteBindung(q, 'c'.repeat(64), einheiten)).toEqual({ ok: true, art: 'einheiten', gedeckt: 2 });
    expect(bewerteBindung([q[0]], 'c'.repeat(64), einheiten).ok).toBe(false);
  });
  it('kein Gesamt-Hash bestimmbar und keine Einheiten ⇒ Fehler, nie stilles Grün', () => {
    expect(bewerteBindung(gut, null, []).ok).toBe(false);
  });
});

// ─── Teil 2: Tor gegen temporäres Repo ──────────────────────────────────────
const aufgeraeumt: string[] = [];
afterAll(() => {
  for (const p of aufgeraeumt) rmSync(p, { recursive: true, force: true });
});
function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}
function neuesRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'mschutz-hash-'));
  aufgeraeumt.push(root);
  git(root, 'init', '-q');
  const leer = join(root, '.githooks-leer');
  mkdirSync(leer, { recursive: true });
  git(root, 'config', 'core.hooksPath', leer);
  git(root, 'config', 'user.email', 't@t.ch');
  git(root, 'config', 'user.name', 'Test');
  git(root, 'config', 'commit.gpgsign', 'false');
  return root;
}
function schreib(root: string, pfad: string, inhalt: string): void {
  const abs = join(root, pfad);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, inhalt, 'utf8');
}
function commit(root: string, msg: string): string {
  git(root, 'add', '-A');
  execFileSync('git', ['-C', root, 'commit', '-q', '-m', msg]);
  return git(root, 'rev-parse', 'HEAD').trim();
}
const TRAILER = 'Gegenpruefung: bestanden (Opus, Test) — echter Zweig-Trailer mit genug Zeichen im Befund-Teil.';
const REG = 'bibliothek/register/gegenpruefung-register.md';
function zeile(hash: string | null): string {
  return `| 2026-10-19 | x | ${hash} | bestanden | q | n |\n`;
}
function hashUeber(repo: string, bereich: string): string {
  return risikoBereichHash({ cwd: repo, bereich, ciErlaubt: true }).hash as string;
}
function laufeTor(repo: string, basis: string, kopf: string): { status: number | null; ausgabe: string } {
  const vite = resolve(WURZEL, 'node_modules/.bin/vite-node');
  const script = resolve(WURZEL, 'scripts/check-merge-schutz.ts');
  // gh-Attrappe schlägt fehl ⇒ PR-Körper-Schutz überspringt sauber (kein Netz).
  const bin = mkdtempSync(join(tmpdir(), 'gh-aus-'));
  aufgeraeumt.push(bin);
  writeFileSync(join(bin, 'gh'), '#!/bin/sh\nexit 1\n', 'utf8');
  chmodSync(join(bin, 'gh'), 0o755);
  const p = spawnSync(vite, [script], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, MERGE_SCHUTZ_BASIS: basis, MERGE_SCHUTZ_KOPF: kopf },
  });
  return { status: p.status, ausgabe: (p.stdout ?? '') + (p.stderr ?? '') };
}

describe('Integration: Hash-Bindung im Tor', () => {
  it('GRÜN-Probe: Registerzeile mit dem Hash des Diffs ⇒ grün, Meldung nennt die Bindung', () => {
    const repo = neuesRepo();
    schreib(repo, 'README.md', 'x\n');
    const basis = commit(repo, 'init');
    schreib(repo, 'src/lib/vorlagen/x.ts', 'export const x = 1;\n');
    commit(repo, `feat(vorlagen): x\n\n${TRAILER}\n`);
    schreib(repo, REG, zeile(hashUeber(repo, `${basis}..HEAD`)));
    const kopf = commit(repo, 'chore(gp): Register');
    const r = laufeTor(repo, basis, kopf);
    expect(r.ausgabe).toContain('grün');
    expect(r.ausgabe).toContain('an den Diff gebunden');
    expect(r.status).toBe(0);
  }, 30000);

  it('ROT-Probe (§6.7): falscher Hash ⇒ ROT mit «Quittung passt nicht zum Diff»', () => {
    const repo = neuesRepo();
    schreib(repo, 'README.md', 'x\n');
    const basis = commit(repo, 'init');
    schreib(repo, 'src/lib/vorlagen/x.ts', 'export const x = 1;\n');
    commit(repo, `feat(vorlagen): x\n\n${TRAILER}\n`);
    schreib(repo, REG, zeile('0'.repeat(64)));
    const kopf = commit(repo, 'chore(gp): Register');
    const r = laufeTor(repo, basis, kopf);
    expect(r.status).toBe(1);
    expect(r.ausgabe).toContain('Quittung passt nicht zum Diff');
  }, 30000);

  it('ROT: Inhalt der Risiko-Datei NACH der Quittung geändert ⇒ ROT', () => {
    const repo = neuesRepo();
    schreib(repo, 'README.md', 'x\n');
    const basis = commit(repo, 'init');
    schreib(repo, 'src/lib/vorlagen/x.ts', 'export const x = 1;\n');
    commit(repo, `feat(vorlagen): x\n\n${TRAILER}\n`);
    schreib(repo, REG, zeile(hashUeber(repo, `${basis}..HEAD`)));
    commit(repo, 'chore(gp): Register');
    schreib(repo, 'src/lib/vorlagen/x.ts', 'export const x = 2;\n');
    const kopf = commit(repo, 'fix(vorlagen): nachtraeglich');
    const r = laufeTor(repo, basis, kopf);
    expect(r.status).toBe(1);
    expect(r.ausgabe).toContain('Quittung passt nicht zum Diff');
  }, 30000);

  it('GRÜN: Queue-Stapel (zwei Squash-Commits, je eigene Quittung) ⇒ grün über die Einheiten', () => {
    const repo = neuesRepo();
    schreib(repo, 'README.md', 'x\n');
    const basis = commit(repo, 'init');
    // Vordermann PR1 (Squash-Commit: Risiko-Datei + Register + Trailer)
    schreib(repo, 'src/lib/vorlagen/a.ts', 'export const a = 1;\n');
    const c0 = commit(repo, `wip a\n`);
    const h1 = hashUeber(repo, `${basis}..${c0}`);
    git(repo, 'reset', '-q', '--hard', basis);
    schreib(repo, 'src/lib/vorlagen/a.ts', 'export const a = 1;\n');
    schreib(repo, REG, zeile(h1));
    const pr1 = commit(repo, `feat(vorlagen): a (#1)\n\n${TRAILER}\n`);
    // PR2 obendrauf
    schreib(repo, 'src/lib/vorlagen/b.ts', 'export const b = 1;\n');
    const c1 = commit(repo, 'wip b');
    const h2 = hashUeber(repo, `${pr1}..${c1}`);
    git(repo, 'reset', '-q', '--hard', pr1);
    schreib(repo, 'src/lib/vorlagen/b.ts', 'export const b = 1;\n');
    schreib(repo, REG, zeile(h1) + zeile(h2));
    const pr2 = commit(repo, `feat(vorlagen): b (#2)\n\n${TRAILER}\n`);
    const r = laufeTor(repo, basis, pr2);
    expect(r.ausgabe).toContain('Einheiten einzeln gedeckt');
    expect(r.status).toBe(0);
    // Gegenprobe: fehlt die Quittung des Hintermanns ⇒ ROT
    git(repo, 'reset', '-q', '--hard', pr1);
    schreib(repo, 'src/lib/vorlagen/b.ts', 'export const b = 1;\n');
    schreib(repo, REG, zeile(h1) + zeile('1'.repeat(64)));
    const pr2falsch = commit(repo, `feat(vorlagen): b (#2)\n\n${TRAILER}\n`);
    const r2 = laufeTor(repo, basis, pr2falsch);
    expect(r2.status).toBe(1);
    expect(r2.ausgabe).toContain('Quittung passt nicht zum Diff');
  }, 40000);
});

// ─── Teil 3: Grenze der Einzel-Quittungen (Auflage 1 der Gegenprüfung 19.10.2026) ──
// S8: Der älteste Commit setzt eine Risiko-Datei OHNE Quittung, zwei neuere sind
// einzeln quittiert. `rev-list --max-count=60` schnitt den ältesten still ab ⇒ grün.
// Jetzt: mehr als 60 First-Parent-Commits ⇒ ROT, nie Abschneiden.
describe('Integration: Grenze der Einzel-Quittungen (60 First-Parent-Commits)', () => {
  function stapel(anzahlLeer: number): { repo: string; basis: string; kopf: string } {
    const repo = neuesRepo();
    schreib(repo, 'README.md', 'x\n');
    const basis = commit(repo, 'init');
    // ältester Commit: Risiko-Datei, KEINE Quittung (trägt den Trailer, damit die Form-Stufe passiert)
    schreib(repo, 'src/lib/vorlagen/a.ts', "export const a = 'UNGEPRUEFT';\n");
    commit(repo, `feat(vorlagen): a\n\n${TRAILER}\n`);
    for (let i = 0; i < anzahlLeer; i++) execFileSync('git', ['-C', repo, 'commit', '-q', '--allow-empty', '-m', `leer ${i}`]);
    schreib(repo, 'src/lib/vorlagen/b.ts', 'export const b = 1;\n');
    const cb = commit(repo, 'feat(vorlagen): b');
    schreib(repo, 'src/lib/vorlagen/c.ts', 'export const c = 1;\n');
    const cc = commit(repo, 'feat(vorlagen): c');
    // zwei neuere Einheiten einzeln quittiert (Register ist kein Risiko-Pfad ⇒ eigener Commit)
    schreib(repo, REG, zeile(hashUeber(repo, `${cb}^..${cb}`)) + zeile(hashUeber(repo, `${cc}^..${cc}`)));
    const kopf = commit(repo, 'chore(gp): Register');
    return { repo, basis, kopf };
  }

  it('ROT-Probe (S8): 62 First-Parent-Commits, ältester unquittiert ⇒ ROT mit Grenz-Meldung statt stillem Grün', () => {
    const { repo, basis, kopf } = stapel(58); // a + 58 leer + b + c + Register = 62
    expect(git(repo, 'rev-list', '--first-parent', '--count', `${basis}..${kopf}`).trim()).toBe('62');
    const r = laufeTor(repo, basis, kopf);
    expect(r.status).toBe(1);
    expect(r.ausgabe).toContain('mehr als 60 First-Parent-Commits');
    expect(r.ausgabe).toContain('Gesamt-Quittung');
  }, 60000);

  it('Gegenprobe: genau 60 First-Parent-Commits ⇒ Einzel-Auswertung läuft; ältester unquittiert ⇒ ROT wegen fehlender Quittung, nicht wegen der Grenze', () => {
    const { repo, basis, kopf } = stapel(56); // a + 56 leer + b + c + Register = 60
    expect(git(repo, 'rev-list', '--first-parent', '--count', `${basis}..${kopf}`).trim()).toBe('60');
    const r = laufeTor(repo, basis, kopf);
    expect(r.status).toBe(1);
    expect(r.ausgabe).not.toContain('mehr als 60');
    expect(r.ausgabe).toContain('Quittung passt nicht zum Diff');
  }, 60000);

  it('GRÜN: 62 Commits mit EINER Gesamt-Quittung über den Bereich ⇒ grün (Grenze betrifft nur den Einzel-Weg)', () => {
    const repo = neuesRepo();
    schreib(repo, 'README.md', 'x\n');
    const basis = commit(repo, 'init');
    schreib(repo, 'src/lib/vorlagen/a.ts', "export const a = 'GEPRUEFT';\n");
    commit(repo, `feat(vorlagen): a\n\n${TRAILER}\n`);
    for (let i = 0; i < 60; i++) execFileSync('git', ['-C', repo, 'commit', '-q', '--allow-empty', '-m', `leer ${i}`]);
    schreib(repo, REG, zeile(hashUeber(repo, `${basis}..HEAD`)));
    const kopf = commit(repo, 'chore(gp): Register');
    expect(git(repo, 'rev-list', '--first-parent', '--count', `${basis}..${kopf}`).trim()).toBe('62');
    const r = laufeTor(repo, basis, kopf);
    expect(r.ausgabe).toContain('Hash passt');
    expect(r.status).toBe(0);
  }, 60000);
});
