// scripts/analyse/kommentar-bilanz.test.ts — Rot-/Grün-Beweise für Regel 3
// (Summen-Bilanz) und Regel 3b (Multimengen-Bilanz) des Fremd-PR-Tors.
//
// ZWEI EBENEN (Muster wie scripts/datenhaltung/nachfuehren.test.ts):
//   · `pruefeSummenBilanz`/`pruefeMultimenge` hermetisch mit synthetischen
//     Dateiname→Inhalt-Karten — kein Git, kein Dateisystem, deterministisch.
//   · `fuehreBilanz` einmal gegen ein ECHTES Mini-Git-Repo (mkdtemp), damit
//     bewiesen ist, dass Diff-Filter, `git show` und die CLI-Verdrahtung
//     wirklich zusammenspielen — eine Attrappe kann das nicht zeigen.
//
// Die drei Pflicht-Rot-/Grün-Beweise (Auftrag QS-FREMDAGENTEN, 14.9.2026):
//   1. «hing» → «hung» (Zeilenzahl gleich, Inhalt anders) → ROT.
//   2. Reine Verschiebung einer Kommentarzeile zwischen zwei Dateien → GRÜN.
//   3. Löschung einer Kommentarzeile → ROT.
import { describe, expect, it, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  fuehreBilanz,
  istLeerkommentar,
  kommentarZeilenAlle,
  kommentarZeilenNichtLeer,
  pruefeMultimenge,
  pruefeSummenBilanz,
} from './kommentar-bilanz';

describe('kommentarZeilenAlle / kommentarZeilenNichtLeer / istLeerkommentar', () => {
  it('zählt //, /* und * als Kommentar-Startzeilen, Code-Zeilen nicht', () => {
    const text = ['// eins', '/* zwei', ' * drei', ' */', 'const x = 1;', '  // vier'].join('\n');
    expect(kommentarZeilenAlle(text)).toHaveLength(5);
  });

  it('erkennt blosse Marker als Leerkommentar', () => {
    expect(istLeerkommentar('*')).toBe(true);
    expect(istLeerkommentar('/*')).toBe(true);
    expect(istLeerkommentar('/**')).toBe(true);
    expect(istLeerkommentar('*/')).toBe(true);
    expect(istLeerkommentar('//')).toBe(true);
    expect(istLeerkommentar('// Inhalt')).toBe(false);
    expect(istLeerkommentar('* Inhalt')).toBe(false);
  });

  it('kommentarZeilenNichtLeer trimmt und lässt Leerkommentare weg', () => {
    const text = ['/**', ' * Ein Satz.', ' *', ' */', '// zweite Zeile  '].join('\n');
    expect(kommentarZeilenNichtLeer(text)).toEqual(['* Ein Satz.', '// zweite Zeile']);
  });
});

describe('pruefeSummenBilanz (Regel 3, hermetisch)', () => {
  it('grün, wenn die Summe steigt oder gleich bleibt', () => {
    const basis = { 'a.ts': '// eins\n// zwei\n' };
    const kopf = { 'a.ts': '// eins\n// zwei\n// drei\n' };
    const r = pruefeSummenBilanz(basis, kopf);
    expect(r).toEqual({ ok: true, vorher: 2, nachher: 3 });
  });

  it('rot, wenn die Summe sinkt', () => {
    const basis = { 'a.ts': '// eins\n// zwei\n// drei\n' };
    const kopf = { 'a.ts': '// eins\n' };
    const r = pruefeSummenBilanz(basis, kopf);
    expect(r.ok).toBe(false);
    expect(r.vorher).toBe(3);
    expect(r.nachher).toBe(1);
  });
});

describe('pruefeMultimenge (Regel 3b, hermetisch) — die drei Pflicht-Beweise', () => {
  it('ROT-BEWEIS 1: "hing" → "hung" (Zeilenzahl gleich, Inhalt anders)', () => {
    const basis = { 'a.ts': '// der Prozess hing seit Stunden\n// unverändert\n' };
    const kopf = { 'a.ts': '// der Prozess hung seit Stunden\n// unverändert\n' };
    const summe = pruefeSummenBilanz(basis, kopf);
    expect(summe.ok).toBe(true); // Summe bleibt 2 → 2, Regel 3 allein sieht nichts
    const befunde = pruefeMultimenge(basis, kopf);
    expect(befunde).toHaveLength(1);
    expect(befunde[0]).toMatchObject({
      zeile: '// der Prozess hing seit Stunden',
      basisDatei: 'a.ts',
      anzahlBasis: 1,
      anzahlHead: 0,
    });
  });

  it('GRÜN-BEWEIS: reine Verschiebung einer Kommentarzeile zwischen zwei Dateien', () => {
    const basis = { 'a.ts': '// wandert um\n// bleibt hier\n', 'b.ts': '' };
    const kopf = { 'a.ts': '// bleibt hier\n', 'b.ts': '// wandert um\n' };
    const befunde = pruefeMultimenge(basis, kopf);
    expect(befunde).toEqual([]);
  });

  it('ROT-BEWEIS 2: Löschung einer Kommentarzeile', () => {
    const basis = { 'a.ts': '// bleibt\n// verschwindet\n' };
    const kopf = { 'a.ts': '// bleibt\n' };
    const befunde = pruefeMultimenge(basis, kopf);
    expect(befunde).toHaveLength(1);
    expect(befunde[0].zeile).toBe('// verschwindet');
    expect(befunde[0].anzahlHead).toBe(0);
  });

  it('Zuwachs ist erlaubt — eine zusätzliche neue Kommentarzeile allein ist kein Befund', () => {
    const basis = { 'a.ts': '// eins\n' };
    const kopf = { 'a.ts': '// eins\n// neu dazu\n' };
    expect(pruefeMultimenge(basis, kopf)).toEqual([]);
  });

  it('Leerkommentare (blosse Marker) lösen keinen Befund aus, auch wenn sie verschwinden', () => {
    const basis = { 'a.ts': '/**\n * Text bleibt.\n */\n' };
    const kopf = { 'a.ts': '// Text bleibt.\n' }; // der reine `*`-Rahmen ist weg, der Inhalt (getrimmt) nicht identisch
    // Der Inhalt "Text bleibt." als "* Text bleibt." existiert im Kopf nicht mehr wörtlich —
    // das MUSS also einen Befund geben (Inhalt geändert), die reinen Marker-Zeilen (/**, */) aber nicht extra.
    const befunde = pruefeMultimenge(basis, kopf);
    expect(befunde.map((b) => b.zeile)).toEqual(['* Text bleibt.']);
  });

  it('eine wortgleiche Wiederholung (Duplikat) darf nicht halbiert verschwinden', () => {
    const basis = { 'a.ts': '// Achtung: siehe unten\n// Achtung: siehe unten\n' };
    const kopf = { 'a.ts': '// Achtung: siehe unten\n' };
    const befunde = pruefeMultimenge(basis, kopf);
    expect(befunde).toHaveLength(1);
    expect(befunde[0]).toMatchObject({ anzahlBasis: 2, anzahlHead: 1 });
  });
});

describe('fuehreBilanz — echtes Mini-Git-Repo (Verdrahtung git diff/show + CLI-Rückgabe)', () => {
  let repo: string;

  afterEach(() => {
    if (repo) rmSync(repo, { recursive: true, force: true });
  });

  function git(args: string[]): void {
    execFileSync('git', args, { cwd: repo, stdio: 'ignore' });
  }

  function commit(nachricht: string): void {
    execFileSync('git', ['add', '-A'], { cwd: repo, stdio: 'ignore' });
    execFileSync(
      'git',
      ['-c', 'user.email=t@t.de', '-c', 'user.name=t', 'commit', '-q', '-m', nachricht, '--no-verify'],
      { cwd: repo, stdio: 'ignore' },
    );
  }

  it('meldet ROT bei einer im echten Repo verfälschten Kommentarzeile, GRÜN bei reiner Verschiebung', () => {
    repo = mkdtempSync(join(tmpdir(), 'kommentar-bilanz-'));
    git(['init', '-q']);
    mkdirSync(join(repo, 'src'), { recursive: true });
    writeFileSync(join(repo, 'src', 'a.ts'), '// der Prozess hing seit Stunden\nexport const a = 1;\n');
    writeFileSync(join(repo, 'src', 'b.ts'), '// unveraendert\nexport const b = 1;\n');
    commit('basis');
    const basisRef = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo }).toString().trim();

    // Kopf 1: Verfälschung (rot erwartet)
    writeFileSync(join(repo, 'src', 'a.ts'), '// der Prozess hung seit Stunden\nexport const a = 1;\n');
    commit('kopf-rot');
    const r1 = fuehreBilanz(repo, basisRef, 'HEAD', ['src/*.ts']);
    expect(r1.status).toBe(1);
    expect(r1.ausgabe).toMatch(/Regel 3b \(Multimenge\) ROT/);
    expect(r1.ausgabe).toMatch(/hing seit Stunden/);

    // Kopf 2 (neuer Branch ab Basis): reine Verschiebung der Zeile nach b.ts (grün erwartet)
    git(['checkout', '-q', '-b', 'verschiebung', basisRef]);
    writeFileSync(join(repo, 'src', 'a.ts'), 'export const a = 1;\n');
    writeFileSync(join(repo, 'src', 'b.ts'), '// der Prozess hing seit Stunden\n// unveraendert\nexport const b = 1;\n');
    commit('kopf-verschoben');
    const r2 = fuehreBilanz(repo, basisRef, 'HEAD', ['src/*.ts']);
    expect(r2.status).toBe(0);
    expect(r2.ausgabe).toMatch(/Regel 3 \(Summe\) ok/);
    expect(r2.ausgabe).toMatch(/Regel 3b \(Multimenge\) ok/);
  });
});
