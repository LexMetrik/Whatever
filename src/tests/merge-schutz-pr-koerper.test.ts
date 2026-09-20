// src/tests/merge-schutz-pr-koerper.test.ts — PR-Körper-Schutz simuliert die
// Queue-Squash-Nachricht aus PR-TITEL+PR-BODY (§17, QS-CI-MINUTEN, Befund
// Session Gliederung 19./20.9.2026): alle 3 roten `merge_group`-Läufe seit
// Einführung der Merge-Queue (Läufe 35449385978, 35451221267, 35458509735;
// PRs #921, #923) fielen an derselben Lücke — `check-merge-schutz.ts` zählte
// bis dahin nur die ZWEIG-Commits (`git log`), die Queue baut ihren einen
// Commit aber aus PR-Titel+PR-Body. Ein im PR-Body fehlendes oder verkürztes
// Verdikt war damit im Zweig-Commit-Pfad grün und flog erst nach ~25 min aus
// der Queue.
//
// Teil 1 testet die reinen/injizierbaren Funktionen aus
// scripts/gegenpruefung/pr-schutz.ts — kein Netz, keine echte `gh`-Abfrage
// (Auftragsvorgabe: gh-Abfrage injizierbar bauen). Teil 2 fährt das Tor
// selbst zweimal gegen ein temporäres git-Repo mit einer `gh`-Attrappe auf
// PATH — echter Beweis für die Verdrahtungs-Reihenfolge (kein Risiko-Diff ⇒
// PR-Körper-Schutz wird gar nicht erst aufgerufen; Risiko-Diff + verkürztes
// PR-Body-Verdikt ⇒ ROT trotz gültigem Zweig-Trailer — genau der Root-Cause).
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { baueQueueSquash, pruefePrKoerper, pruefePrSchutz, type PrKoerper } from '../../scripts/gegenpruefung/pr-schutz';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// Echte Fixture: `gh pr view 923 --json title,body` (20.9.2026) — PR #923 war
// einer der beiden PRs, die in der Queue an dieser Lücke fielen; sein Body
// ist inzwischen (nach `gh pr edit`) formal gültig und dient hier als
// GRÜN-Fixture (Auftragsvorgabe: "falls er inzwischen korrigiert wurde, nimm
// die Fixture"). Genau die Form, die Test (c) verlangt: eine >72-Zeichen-Zeile
// im letzten Absatz, eine '🤖 Generated…'-Zeile im vorletzten Absatz davor.
const FIXTURE_923_BODY = readFileSync(resolve(__dirname, 'fixtures/merge-schutz-pr-body-923.txt'), 'utf8');
const TITEL_923 = 'fix(struktur): SVG-Randtitel «Grundregel» nicht mehr an Art. 27 ff. vererbt (W2·5m-LESER-V3)';

// ─── Teil 1: reine Funktionen ───────────────────────────────────────────────

describe('baueQueueSquash', () => {
  it('Titel, Leerzeile, Body — dieselbe Form wie die Queue beim Squash', () => {
    expect(baueQueueSquash('feat(x): y', 'Beleg-Absatz.')).toBe('feat(x): y\n\nBeleg-Absatz.');
  });

  it('leerer/nur-Whitespace-Body ⇒ nur der Titel', () => {
    expect(baueQueueSquash('feat(x): y', '')).toBe('feat(x): y');
    expect(baueQueueSquash('feat(x): y', '   \n  ')).toBe('feat(x): y');
  });
});

describe('pruefePrKoerper — die drei Kernfälle (a)/(b)/(c)', () => {
  it('(a) Body ohne jeden Gegenpruefung-Absatz ⇒ kein-verdikt', () => {
    const body = '## Was\nEin Fix ohne Verdikt-Absatz.\n\nRoadmap: X\n';
    expect(pruefePrKoerper('fix(x): y', body)).toEqual({ art: 'kein-verdikt' });
  });

  it('(b) verkürztes Verdikt ("— keine", < 15 Zeichen Befund-Teil) ⇒ mangel', () => {
    const body = 'Roadmap: X\nGegenpruefung: bestanden (Opus, Test) — keine\n';
    const u = pruefePrKoerper('fix(x): y', body);
    expect(u.art).toBe('mangel');
    if (u.art === 'mangel') {
      expect(u.grund).toMatch(/Befund-Teil/);
      expect(u.wert).toBe('bestanden (Opus, Test) — keine');
    }
  });

  it('(c) echte Fixture PR #923 (Titel+Body) ⇒ gueltig', () => {
    expect(pruefePrKoerper(TITEL_923, FIXTURE_923_BODY)).toEqual({ art: 'gueltig' });
  });

  it('mehrere Gegenpruefung-Zeilen im letzten Absatz — der erste gültige zählt', () => {
    // Reale Form kommt so nicht vor (ein Absatz hat höchstens einen Verdikt-
    // Trailer), aber pruefePrKoerper darf bei einem Mix nicht am ersten
    // Mangel scheitern, wenn ein späterer gültig ist.
    const body = 'Gegenpruefung: x\nGegenpruefung: bestanden (Opus, Test) — genug Zeichen im Befund-Teil\n';
    expect(pruefePrKoerper('fix(x): y', body)).toEqual({ art: 'gueltig' });
  });
});

describe('pruefePrSchutz — injizierte gh-Holung, kein Netz', () => {
  const bereich = 'aaaa1111..bbbb2222';

  it('(e) kein PR gefunden (kein gh/kein PR/kein Netz) ⇒ null, sauberer Überspring', () => {
    expect(pruefePrSchutz(['node', 'script'], 3, bereich, () => null)).toBeNull();
  });

  it('(a) PR gefunden, Body ohne Verdikt ⇒ ROT-Meldung mit Heil-Hinweis', () => {
    const holen = (): PrKoerper => ({ nummer: 42, titel: 'fix(x): y', body: 'Kein Verdikt hier.\n' });
    const r = pruefePrSchutz(['node', 'script'], 3, bereich, holen);
    expect(r).not.toBeNull();
    expect(r).toContain('PR #42');
    expect(r).toContain("kein 'Gegenpruefung:'-Verdikt im PR-Body");
    expect(r).toContain('gh pr edit 42 --body-file');
  });

  it('(b) PR gefunden, Verdikt verkürzt ⇒ ROT-Meldung nennt Fundstelle + Mangel-Grund', () => {
    const holen = (): PrKoerper => ({
      nummer: 7,
      titel: 'fix(x): y',
      body: 'Roadmap: X\nGegenpruefung: bestanden (Opus, Test) — keine\n',
    });
    const r = pruefePrSchutz(['node', 'script'], 1, bereich, holen);
    expect(r).toContain('formal untauglich');
    expect(r).toContain('Befund-Teil');
    expect(r).toContain('bestanden (Opus, Test) — keine');
  });

  it('(c) PR gefunden, gültiges Verdikt (echte Fixture #923) ⇒ null — alter Pfad prüft weiter', () => {
    const holen = (): PrKoerper => ({ nummer: 923, titel: TITEL_923, body: FIXTURE_923_BODY });
    expect(pruefePrSchutz(['node', 'script'], 12, bereich, holen)).toBeNull();
  });

  it('--pr <n> wird an holen() durchgereicht (expliziter Modus)', () => {
    let empfangen: string | undefined = 'unveraendert';
    const holen = (nr?: string): PrKoerper | null => {
      empfangen = nr;
      return null;
    };
    pruefePrSchutz(['node', 'script', '--pr', '555'], 1, bereich, holen);
    expect(empfangen).toBe('555');
  });

  it('ohne --pr wird holen() ohne Nummer gerufen (aktueller Branch)', () => {
    let empfangen: string | undefined = 'unveraendert';
    const holen = (nr?: string): PrKoerper | null => {
      empfangen = nr;
      return null;
    };
    pruefePrSchutz(['node', 'script'], 1, bereich, holen);
    expect(empfangen).toBeUndefined();
  });
});

// ─── Teil 2: Integration — das echte Tor gegen ein temporäres git-Repo ──────
// Spawnt `vite-node scripts/check-merge-schutz.ts` (dieselbe Form wie
// `npm run check:merge-schutz`) mit einer `gh`-Attrappe auf PATH — echter
// End-zu-End-Beweis, kein Netz (die Attrappe beantwortet `gh pr view` lokal).

const aufgeraeumt: string[] = [];
afterAll(() => {
  for (const p of aufgeraeumt) rmSync(p, { recursive: true, force: true });
});

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}
function neuesRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'mschutz-pr-'));
  aufgeraeumt.push(root);
  git(root, 'init', '-q');
  const leer = join(root, '.githooks-leer');
  mkdirSync(leer, { recursive: true });
  git(root, 'config', 'core.hooksPath', leer); // fremde globale Hooks neutralisieren
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
function commit(root: string, msg: string): void {
  git(root, 'add', '-A');
  execFileSync('git', ['-C', root, 'commit', '-q', '-m', msg]);
}

/** gh-Attrappe auf PATH: `gh pr view … --json …` liefert IMMER dieselbe (test-gesteuerte) Antwort. */
function ghAttrappe(antwort: { number: number; title: string; body: string }): string {
  const bin = mkdtempSync(join(tmpdir(), 'gh-bin-'));
  aufgeraeumt.push(bin);
  const p = join(bin, 'gh');
  writeFileSync(p, `#!/bin/sh\ncat <<'EOF_GH_FIXTURE'\n${JSON.stringify(antwort)}\nEOF_GH_FIXTURE\n`, 'utf8');
  chmodSync(p, 0o755);
  return bin;
}

function laufeTor(repo: string, basis: string, kopf: string, ghBin: string): { status: number | null; ausgabe: string } {
  const vite = resolve(WURZEL, 'node_modules/.bin/vite-node');
  const script = resolve(WURZEL, 'scripts/check-merge-schutz.ts');
  const p = spawnSync(vite, [script], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${ghBin}:${process.env.PATH}`, MERGE_SCHUTZ_BASIS: basis, MERGE_SCHUTZ_KOPF: kopf },
  });
  return { status: p.status, ausgabe: (p.stdout ?? '') + (p.stderr ?? '') };
}

/** Repo mit einem Risiko-Datei-Commit, gültigem Zweig-Trailer + gewachsenem Register. */
function repoMitRisikoUndGueltigemZweigTrailer(): { repo: string; basis: string; kopf: string } {
  const repo = neuesRepo();
  schreib(repo, 'README.md', 'x\n');
  commit(repo, 'init');
  const basis = git(repo, 'rev-parse', 'HEAD').trim();
  schreib(repo, 'src/lib/vorlagen/x.ts', 'export const x = 1;\n');
  schreib(repo, 'bibliothek/register/gegenpruefung-register.md', '# Register\n\n- Eintrag X\n');
  commit(repo, 'feat(vorlagen): x\n\nGegenpruefung: bestanden (Opus, Test) — echter Zweig-Trailer mit genug Zeichen im Befund-Teil.\n');
  const kopf = git(repo, 'rev-parse', 'HEAD').trim();
  return { repo, basis, kopf };
}

describe('Integration: check-merge-schutz.ts gegen ein temporäres git-Repo', () => {
  it('(d) kein Risiko-Diff ⇒ grün — eine boshafte gh-Attrappe (leerer Body) bleibt unbeachtet', () => {
    const repo = neuesRepo();
    schreib(repo, 'README.md', 'x\n');
    commit(repo, 'init');
    const kopf = git(repo, 'rev-parse', 'HEAD').trim();
    const bin = ghAttrappe({ number: 1, title: 'x', body: '' }); // wäre ROT, würde sie aufgerufen
    const r = laufeTor(repo, kopf, kopf, bin);
    expect(r.status).toBe(0);
    expect(r.ausgabe).toContain('kein Risiko-Pfad');
  }, 20000);

  it('Risiko-Diff + gültiger Zweig-Trailer, aber PR-Body-Verdikt verkürzt ⇒ ROT (Root-Cause-Regression, Befund PRs #921/#923)', () => {
    const { repo, basis, kopf } = repoMitRisikoUndGueltigemZweigTrailer();
    const bin = ghAttrappe({
      number: 9,
      title: 'feat(vorlagen): x',
      body: 'Roadmap: X\nGegenpruefung: bestanden (Opus, Test) — keine\n',
    });
    const r = laufeTor(repo, basis, kopf, bin);
    expect(r.status).toBe(1);
    expect(r.ausgabe).toContain('PR #9');
    expect(r.ausgabe).toContain('formal untauglich');
  }, 20000);

  it('dieselbe Lage, aber PR-Body-Verdikt gültig ⇒ GRÜN (alter Pfad greift, Register gewachsen)', () => {
    const { repo, basis, kopf } = repoMitRisikoUndGueltigemZweigTrailer();
    const bin = ghAttrappe({ number: 9, title: TITEL_923, body: FIXTURE_923_BODY });
    const r = laufeTor(repo, basis, kopf, bin);
    expect(r.status).toBe(0);
    expect(r.ausgabe).toContain('grün');
    expect(r.ausgabe).toContain('gewachsen');
  }, 20000);
});
