import { describe, expect, it } from 'vitest';
import {
  alter,
  flaechenZeile,
  klassiere,
  parseWorktreeFakten,
  platzName,
  type BranchFakt,
  type Fakten,
  type WorktreeFakt,
} from '../../scripts/plan/gitFlaechen';

// ─── Git-Flächen · reiner Kern (Anlass 21.9.2026, s. Kopf von gitFlaechen.ts) ──
//
// Hier wird die SCHUTZ-Seite festgenagelt, nicht die Abräum-Seite: jeder Test
// mit «ROT» beschreibt einen Fall, in dem eine fehlende Schutzbedingung Arbeit
// gelöscht hätte. Sie sind absichtlich so gebaut, dass sie rot werden, sobald
// eine Bedingung aus `klassiere` entfernt wird (§6.7 — ein Tor, das nicht
// scheitern kann, ist gefährlicher als keines).

const SHA_A = '1111111111111111111111111111111111111111';
const SHA_B = '2222222222222222222222222222222222222222';

const br = (p: Partial<BranchFakt> & { name: string }): BranchFakt => ({
  spitze: SHA_A,
  leer: false,
  vorMain: 1,
  letzterCommitUnix: null,
  remote: false,
  imWorktree: null,
  nachPrHead: null,
  pr: null,
  ...p,
});

const wt = (p: Partial<WorktreeFakt> & { pfad: string }): WorktreeFakt => ({
  name: platzName(p.pfad),
  haupt: false,
  aktuell: false,
  gelockt: false,
  sauber: true,
  branch: null,
  head: SHA_B,
  headVonMain: false,
  headIstPrHead: false,
  ...p,
});

const fakten = (p: Partial<Fakten> = {}): Fakten => ({
  ghVerfuegbar: true,
  aktuellerBranch: 'main',
  branches: [],
  worktrees: [],
  ...p,
});

const MERGED = { number: 7, zustand: 'MERGED' as const, headRefOid: SHA_A };

const branch = (bef: ReturnType<typeof klassiere>, name: string) => bef.branches.find((b) => b.name === name)!;
const platz = (bef: ReturnType<typeof klassiere>, pfad: string) => bef.worktrees.find((w) => w.pfad === pfad)!;

describe('klassiere · Branches', () => {
  it('leer (0 Commits vor main) ⇒ abräumbar mit -d', () => {
    const b = branch(klassiere(fakten({ branches: [br({ name: 'alt', leer: true, vorMain: 0 })] })), 'alt');
    expect(b.klasse).toBe('leer');
    expect(b.abraeumbar).toBe(true);
    expect(b.flagge).toBe('-d');
  });

  it('gelandet (MERGED-PR, Spitze deckungsgleich) ⇒ abräumbar mit -D', () => {
    const b = branch(
      klassiere(fakten({ branches: [br({ name: 'squash', pr: MERGED, nachPrHead: 0 })] })),
      'squash',
    );
    expect(b.klasse).toBe('gelandet');
    expect(b.abraeumbar).toBe(true);
    // -d verweigert bei Squash-Merges — genau der Anlass vom 21.9.2026.
    expect(b.flagge).toBe('-D');
  });

  it('ROT (a): ein Commit NACH dem PR-Head ⇒ nicht abräumbar', () => {
    const b = branch(
      klassiere(fakten({ branches: [br({ name: 'squash', pr: MERGED, nachPrHead: 1 })] })),
      'squash',
    );
    expect(b.klasse).toBe('offen');
    expect(b.abraeumbar).toBe(false);
    expect(b.grund).toContain('1 Commit danach');
  });

  it('ROT (a2): PR-Head lokal unbekannt (nachPrHead null) ⇒ nicht abräumbar', () => {
    const b = branch(
      klassiere(fakten({ branches: [br({ name: 'squash', pr: MERGED, nachPrHead: null })] })),
      'squash',
    );
    expect(b.abraeumbar).toBe(false);
    expect(b.grund).toContain('fail-closed');
  });

  it('offener oder geschlossen-nicht-gemergter PR ist keine Landung', () => {
    const bef = klassiere(
      fakten({
        branches: [
          br({ name: 'offen-pr', pr: { ...MERGED, zustand: 'OPEN' }, nachPrHead: 0 }),
          br({ name: 'zu-pr', pr: { ...MERGED, zustand: 'CLOSED' }, nachPrHead: 0 }),
          br({ name: 'ohne-pr' }),
        ],
      }),
    );
    for (const n of ['offen-pr', 'zu-pr', 'ohne-pr']) expect(branch(bef, n).abraeumbar).toBe(false);
    expect(branch(bef, 'ohne-pr').grund).toContain('kein PR');
  });

  it('ROT (c): gh ausgefallen ⇒ NUR leere Branches sind abräumbar', () => {
    const bef = klassiere(
      fakten({
        ghVerfuegbar: false,
        branches: [br({ name: 'leer', leer: true, vorMain: 0 }), br({ name: 'squash', pr: MERGED, nachPrHead: 0 })],
      }),
    );
    expect(branch(bef, 'leer').abraeumbar).toBe(true);
    expect(branch(bef, 'squash').abraeumbar).toBe(false);
    expect(branch(bef, 'squash').grund).toContain('fail-closed');
  });

  it('ROT (d): main und der aktuell ausgecheckte Branch sind nie abräumbar — und stumm', () => {
    const bef = klassiere(
      fakten({
        aktuellerBranch: 'feat/hier',
        // Beide wären nach Klasse «leer» — nur der Schutz hält sie.
        branches: [
          br({ name: 'main', leer: true, vorMain: 0 }),
          br({ name: 'feat/hier', leer: true, vorMain: 0 }),
        ],
      }),
    );
    for (const n of ['main', 'feat/hier']) {
      expect(branch(bef, n).abraeumbar).toBe(false);
      expect(branch(bef, n).stumm).toBe(true);
    }
  });

  it('ROT (b2): gelandeter Branch in einem NICHT abräumbaren Worktree bleibt stehen', () => {
    const bef = klassiere(
      fakten({
        branches: [br({ name: 'squash', pr: MERGED, nachPrHead: 0, imWorktree: '/tmp/platz' })],
        worktrees: [wt({ pfad: '/tmp/platz', branch: 'squash', sauber: false })],
      }),
    );
    expect(branch(bef, 'squash').klasse).toBe('gelandet');
    expect(branch(bef, 'squash').abraeumbar).toBe(false);
    expect(branch(bef, 'squash').grund).toContain('platz');
  });

  it('gelandeter Branch in einem abräumbaren Worktree darf mit — der Platz geht zuerst', () => {
    const bef = klassiere(
      fakten({
        branches: [br({ name: 'squash', pr: MERGED, nachPrHead: 0, imWorktree: '/tmp/platz' })],
        worktrees: [wt({ pfad: '/tmp/platz', branch: 'squash', sauber: true })],
      }),
    );
    expect(platz(bef, '/tmp/platz').abraeumbar).toBe(true);
    expect(branch(bef, 'squash').abraeumbar).toBe(true);
  });
});

describe('klassiere · Worktrees', () => {
  it('ROT (b): unversionierte oder uncommittete Dateien ⇒ nicht abräumbar', () => {
    const bef = klassiere(
      fakten({
        branches: [br({ name: 'leer', leer: true, vorMain: 0, imWorktree: '/tmp/p' })],
        worktrees: [wt({ pfad: '/tmp/p', branch: 'leer', sauber: false })],
      }),
    );
    expect(platz(bef, '/tmp/p').abraeumbar).toBe(false);
    expect(platz(bef, '/tmp/p').grund).toContain('nicht sauber');
  });

  it('ROT (b2): `git status` nicht abfragbar ⇒ nicht abräumbar (fail-closed)', () => {
    const bef = klassiere(
      fakten({
        branches: [br({ name: 'leer', leer: true, vorMain: 0, imWorktree: '/tmp/p' })],
        worktrees: [wt({ pfad: '/tmp/p', branch: 'leer', sauber: null })],
      }),
    );
    expect(platz(bef, '/tmp/p').abraeumbar).toBe(false);
  });

  it('ROT (d): Haupt-Checkout, aktueller Platz und gelockter Platz sind nie abräumbar', () => {
    const bef = klassiere(
      fakten({
        branches: [br({ name: 'leer', leer: true, vorMain: 0 })],
        worktrees: [
          wt({ pfad: '/tmp/haupt', haupt: true, branch: 'leer' }),
          wt({ pfad: '/tmp/hier', aktuell: true, branch: 'leer' }),
          wt({ pfad: '/tmp/lock', gelockt: true, branch: 'leer' }),
        ],
      }),
    );
    expect(platz(bef, '/tmp/haupt').abraeumbar).toBe(false);
    expect(platz(bef, '/tmp/haupt').stumm).toBe(true);
    expect(platz(bef, '/tmp/hier').abraeumbar).toBe(false);
    expect(platz(bef, '/tmp/hier').stumm).toBe(true);
    expect(platz(bef, '/tmp/lock').abraeumbar).toBe(false);
    expect(platz(bef, '/tmp/lock').grund).toContain('gelockt');
  });

  it('ROT (e): detached HEAD — nur von main erreichbar oder Head eines gemergten PR darf weg', () => {
    const bef = klassiere(
      fakten({
        worktrees: [
          wt({ pfad: '/tmp/frei', branch: null, headVonMain: true }),
          wt({ pfad: '/tmp/pr', branch: null, headIstPrHead: true }),
          wt({ pfad: '/tmp/fremd', branch: null }),
        ],
      }),
    );
    expect(platz(bef, '/tmp/frei').abraeumbar).toBe(true);
    expect(platz(bef, '/tmp/pr').abraeumbar).toBe(true);
    expect(platz(bef, '/tmp/fremd').abraeumbar).toBe(false);
    expect(platz(bef, '/tmp/fremd').grund).toContain('fail-closed');
  });

  it('Worktree auf einem Branch, den die Branch-Liste nicht kennt ⇒ nicht abräumbar', () => {
    const bef = klassiere(fakten({ worktrees: [wt({ pfad: '/tmp/x', branch: 'phantom' })] }));
    expect(platz(bef, '/tmp/x').abraeumbar).toBe(false);
  });
});

describe('flaechenZeile (plan:next)', () => {
  const rest = (n: number) =>
    fakten({ branches: Array.from({ length: n }, (_, i) => br({ name: `b${i}` })) });

  it('sauberer Zustand ⇒ keine Zeile', () => {
    expect(flaechenZeile(klassiere(fakten()), false)).toBeNull();
    // main und der aktuelle Branch allein erzeugen ebenfalls nichts.
    expect(
      flaechenZeile(klassiere(fakten({ aktuellerBranch: 'main', branches: [br({ name: 'main', leer: true })] })), false),
    ).toBeNull();
  });

  it('nennt höchstens drei Namen, dann +n', () => {
    const z = flaechenZeile(klassiere(rest(5)), false)!;
    expect(z).toContain('5 zu prüfen: b0, b1, b2 +2');
    expect(z).not.toContain('b3');
  });

  it('mit gh-Prüfung heisst es «mit ungelandeter Arbeit», ohne «zu prüfen» (§8)', () => {
    expect(flaechenZeile(klassiere(rest(1)), true)).toContain('mit ungelandeter Arbeit');
    expect(flaechenZeile(klassiere(rest(1)), false)).toContain('zu prüfen');
  });

  it('ist byte-stabil — keine Uhrzeit, kein Pfad, gleiche Eingabe gleiche Zeile', () => {
    const bef = klassiere(
      fakten({ branches: [br({ name: 'alt', leer: true, vorMain: 0, letzterCommitUnix: 1_700_000_000 }), br({ name: 'x' })] }),
    );
    expect(flaechenZeile(bef, false)).toBe(flaechenZeile(bef, false));
    expect(flaechenZeile(bef, false)).toBe('🧹 Git-Flächen: 1 abräumbar · 1 zu prüfen: x — npm run aufraeumen:git');
  });
});

describe('alter + parseWorktreeFakten', () => {
  it('rechnet Tage aus einem übergebenen Jetzt — nie aus Date.now() (§2)', () => {
    expect(alter(null, 1_000_000)).toBe('');
    expect(alter(1_000_000, 1_000_000)).toBe('heute');
    expect(alter(1_000_000, 1_000_000 + 86_400)).toBe('1 Tag alt');
    expect(alter(1_000_000, 1_000_000 + 3 * 86_400)).toBe('3 Tage alt');
  });

  it('liest Pfad, Branch, HEAD und die Sperre aus der Porcelain-Ausgabe', () => {
    const porcelain = [
      'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n',
      'worktree /repo/wt/eins\nHEAD def456\nbranch refs/heads/feat/x\nlocked\n',
      'worktree /repo/wt/zwei\nHEAD 999aaa\ndetached\n',
    ].join('\n');
    expect(parseWorktreeFakten(porcelain)).toEqual([
      { pfad: '/repo', branch: 'main', head: 'abc123', gelockt: false, haupt: true },
      { pfad: '/repo/wt/eins', branch: 'feat/x', head: 'def456', gelockt: true, haupt: false },
      { pfad: '/repo/wt/zwei', branch: null, head: '999aaa', gelockt: false, haupt: false },
    ]);
    expect(parseWorktreeFakten('')).toEqual([]);
  });
});
