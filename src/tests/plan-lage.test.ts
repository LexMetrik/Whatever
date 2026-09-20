// src/tests/plan-lage.test.ts — Lage-Block von `plan:next`.
// Zusammengelegt 31.8.2026 (QS-EFFIZIENZ, Ent-Regulierung Runde 2 Batch B; Beleg:
// bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md §3 Kandidat 1). Die
// Fälle stehen WÖRTLICH unter dem Banner ihrer Herkunftsdatei; gestrichen wurde
// nur ein wörtliches Rumpf-Duplikat (ROADMAP-CHRONIK.md, 31.8.2026).
// Der frühere Abschnitt «aus src/tests/plan-retro17.test.ts» (Retro-Deutung der
// Bau-Messreihe über scripts/plan/retro17Kern) ist mit retro:17/selbstopt:erheben
// entfallen (Entscheid David 20.9.2026, Rückbau QS-EFFIZIENZ — Nachfolge-Messung
// `npm run tor:bewaehrung`).
import {
  lageBlock,
  type LageRoh,
  lageZeilen,
  type Laufe,
  parseWorktrees,
  sammleLage,
  schrittFuerNamen,
  slug,
  staleWip,
  wipFlaechen,
} from '../../scripts/plan/lage';
import type { Einheit } from '../../scripts/plan/parse';

// ─── aus src/tests/plan-lage.test.ts ───────────────────────────────────────────
// src/tests/plan-lage.test.ts — Lage-Block von `plan:next` (QS-PLAN-REVIEW/4a).
//
// Kein echter git-/gh-Aufruf: `sammleLage` bekommt seinen Kommando-Runner
// injiziert, `lageZeilen` ist rein. Sonst prüfte der Test die Maschine, auf der
// er läuft, statt den Code.

let posZaehler = 0;
function einheit(id: string, p: Partial<Einheit['etikett']> = {}): Einheit {
  return {
    id, checkbox: null, sektion: 'Die geordnete Abarbeitung', pos: posZaehler++,
    etikett: { id, status: 'ready', blocker: null, dep: [], feld: null, fahrplan: null, ...p },
  };
}

const IDS = ['QS-PLAN-REVIEW', 'QS-CODE', 'QS-CODE-TURSO', 'W2·5k-LINIEN-KONZEPT'];

/** Runner-Attrappe: liefert je Kommando einen festen Text oder wirft. */
function runner(antworten: Record<string, string | Error>): Laufe {
  return (cmd, args) => {
    const schluessel = `${cmd} ${args[0]}`;
    const a = antworten[schluessel];
    if (a === undefined) throw new Error(`Attrappe kennt "${schluessel}" nicht`);
    if (a instanceof Error) throw a;
    return a;
  };
}

const PORCELAIN = [
  'worktree /Users/x/LexMetrik\nHEAD aaa\nbranch refs/heads/main',
  'worktree /Users/x/LexMetrik/.claude/worktrees/agent-abc\nHEAD bbb\nbranch refs/heads/feat/qs-plan-review-lage',
  'worktree /Users/x/LexMetrik/.claude/worktrees/agent-def\nHEAD ccc\ndetached',
].join('\n\n');

const BRANCHES = 'main\nfeat/qs-plan-review-lage\nchore/aufraeumen\nfeat/qs-code-turso-fts';

function rohStandard(p: Partial<LageRoh> = {}): LageRoh {
  return { wip: [], worktrees: null, branches: null, prs: null, prsGewuenscht: false, ausfaelle: [], ...p };
}

describe('slug + Zuordnung', () => {
  it('bildet den Slug wie die wip-Verstoss-Sonde', () => {
    expect(slug('QS-PLAN-REVIEW')).toBe('qs-plan-review');
    expect(slug('W2·5k-LINIEN-KONZEPT')).toBe('w2-5k-linien-konzept');
  });

  it('ordnet Branch und Worktree über den enthaltenen Slug zu', () => {
    expect(schrittFuerNamen('feat/qs-plan-review-lage', IDS)).toBe('QS-PLAN-REVIEW');
    expect(schrittFuerNamen('agent-abc [feat/qs-plan-review-lage]', IDS)).toBe('QS-PLAN-REVIEW');
  });

  it('längster Slug gewinnt — QS-CODE-TURSO schlägt QS-CODE', () => {
    expect(schrittFuerNamen('feat/qs-code-turso-fts', IDS)).toBe('QS-CODE-TURSO');
    expect(schrittFuerNamen('feat/qs-code-splits', IDS)).toBe('QS-CODE');
  });

  it('kein Treffer → null (= «ohne Schritt-Bezug», Signal für unangemeldeten Bau)', () => {
    expect(schrittFuerNamen('chore/aufraeumen', IDS)).toBeNull();
    expect(schrittFuerNamen('agent-4f2a9c', IDS)).toBeNull();
  });
});

describe('parseWorktrees', () => {
  it('trennt Haupt-Repo von Bau-Plätzen und liest den Branch', () => {
    expect(parseWorktrees(PORCELAIN)).toEqual([
      { name: 'LexMetrik', branch: 'main', haupt: true },
      { name: 'agent-abc', branch: 'feat/qs-plan-review-lage', haupt: false },
      { name: 'agent-def', branch: null, haupt: false },
    ]);
  });

  it('leere Ausgabe ergibt keine Plätze', () => {
    expect(parseWorktrees('')).toEqual([]);
  });
});

describe('wipFlaechen', () => {
  it('reichert die wip-IDs des Resolvers mit ihrem Baufeld an', () => {
    const e = [einheit('QS-PLAN-REVIEW', { status: 'wip', feld: 'betrieb' }), einheit('QS-CODE', { status: 'wip' })];
    expect(wipFlaechen(e, ['QS-PLAN-REVIEW', 'QS-CODE'])).toEqual([
      { id: 'QS-PLAN-REVIEW', feld: 'betrieb' },
      { id: 'QS-CODE', feld: null },
    ]);
  });
});

describe('sammleLage', () => {
  it('erhebt Worktrees und Branches, fragt ohne --prs kein gh', () => {
    const laufe = vi.fn(runner({ 'git worktree': PORCELAIN, 'git branch': BRANCHES }));
    const roh = sammleLage([], { prs: false, laufe });
    expect(roh.worktrees?.length).toBe(3);
    expect(roh.branches).toEqual(['main', 'feat/qs-plan-review-lage', 'chore/aufraeumen', 'feat/qs-code-turso-fts']);
    expect(roh.prs).toBeNull();
    expect(roh.prsGewuenscht).toBe(false);
    expect(roh.ausfaelle).toEqual([]);
    expect(laufe.mock.calls.map((c) => c[0])).toEqual(['git', 'git']); // kein gh
  });

  it('mit --prs kommt gh dazu', () => {
    const roh = sammleLage([], {
      prs: true,
      laufe: runner({
        'git worktree': PORCELAIN,
        'git branch': BRANCHES,
        'gh pr': JSON.stringify([{ number: 445, headRefName: 'feat/qs-plan-review-lage', title: 'Lage-Block' }]),
      }),
    });
    expect(roh.prs).toEqual([{ number: 445, headRefName: 'feat/qs-plan-review-lage', titel: 'Lage-Block' }]);
    expect(roh.ausfaelle).toEqual([]);
  });

  it('Fehlerpfad: git wirft (nicht installiert/Timeout) → Ausfall vermerkt, kein Wurf', () => {
    const roh = sammleLage([], { prs: false, laufe: runner({ 'git worktree': new Error('ENOENT'), 'git branch': new Error('ETIMEDOUT') }) });
    expect(roh.worktrees).toBeNull();
    expect(roh.branches).toBeNull();
    expect(roh.ausfaelle).toEqual(['git worktree list', 'git branch']);
  });

  it('Fehlerpfad: gh liefert Unparsbares → prs null statt Absturz', () => {
    const roh = sammleLage([], { prs: true, laufe: runner({ 'git worktree': PORCELAIN, 'git branch': BRANCHES, 'gh pr': 'not json' }) });
    expect(roh.prs).toBeNull();
    expect(roh.ausfaelle).toEqual(['gh pr list']);
  });
});

describe('lageZeilen — Formatierung', () => {
  it('vollständige Lage mit PRs', () => {
    const roh = rohStandard({
      wip: [{ id: 'QS-PLAN-REVIEW', feld: 'betrieb' }, { id: 'QS-CODE', feld: null }],
      worktrees: parseWorktrees(PORCELAIN),
      branches: BRANCHES.split('\n'),
      prs: [{ number: 445, headRefName: 'feat/qs-ci-vercel-ignore', titel: 'Ignored Build Step' }],
      prsGewuenscht: true,
    });
    expect(lageZeilen(roh, IDS)).toEqual([
      '',
      '── Lage: was gerade im Bau ist (Sichtbarkeit für Parallel-Sessions) ──',
      '🔨 belegte Flächen (wip):',
      '   QS-PLAN-REVIEW → betrieb',
      '   QS-CODE → kein feld: deklariert → gilt als GESAMTE Fläche',
      '🌳 Worktrees: agent-abc [feat/qs-plan-review-lage] → QS-PLAN-REVIEW · agent-def [detached] → ohne Schritt-Bezug',
      '🌿 weitere Branches (ohne Worktree): chore/aufraeumen → ohne Schritt-Bezug · feat/qs-code-turso-fts → QS-CODE-TURSO',
      '🔀 offene PRs:',
      '   #445 feat/qs-ci-vercel-ignore → ohne Schritt-Bezug — Ignored Build Step',
      // ERWARTUNG ERWEITERT (QS-PLAN-WIP-FRISCHE, 5.8.2026) — deklarierte fachliche
      // Änderung, kein stilles Test-Nachziehen (§6.3): dieselbe Fixtur trägt jetzt
      // die Frische-Warnung. `QS-CODE` steht auf wip, aber kein Bau-Platz, kein
      // Branch und kein PR trägt seinen Slug — `feat/qs-code-turso-fts` gehört
      // `QS-CODE-TURSO` (längster Slug gewinnt) und ist deshalb KEINE Spur für
      // `QS-CODE`. `QS-PLAN-REVIEW` hat seinen Worktree und wird nicht gewarnt.
      '⚠️  Als «in Arbeit» markiert, aber ohne Bau-Spur (kein Branch/Bauplatz): QS-CODE — freigeben (plan:set QS-CODE status=ready|done|parked) oder Bau wieder aufnehmen.',
    ]);
  });

  it('leere Lage: kein wip, nur Haupt-Repo, netzfreier Default', () => {
    const roh = rohStandard({ worktrees: parseWorktrees(PORCELAIN.split('\n\n')[0]), branches: ['main'] });
    expect(lageZeilen(roh, IDS)).toEqual([
      '',
      '── Lage: was gerade im Bau ist (Sichtbarkeit für Parallel-Sessions) ──',
      '🔨 belegte Flächen (wip): — (kein Schritt auf wip)',
      '🌳 Worktrees: — (nur das Haupt-Repo)',
      '🌿 weitere Branches (ohne Worktree): —',
      '🔀 offene PRs: nicht abgefragt (netzfrei per Default — mit `--prs` anfordern)',
    ]);
  });

  it('Ausfall erzeugt GENAU EINE Hinweiszeile und lässt den Rest stehen', () => {
    const roh = rohStandard({ worktrees: null, branches: null, prsGewuenscht: true, prs: null, ausfaelle: ['git worktree list', 'gh pr list'] });
    const zeilen = lageZeilen(roh, IDS);
    expect(zeilen.filter((z) => z.startsWith('⚠️'))).toEqual([
      '⚠️  Lage unvollständig — nicht abfragbar: git worktree list · gh pr list (kein Fehler des Plans)',
    ]);
    expect(zeilen).toContain('🌳 Worktrees: — (nicht abfragbar)');
    expect(zeilen).toContain('🌿 Branches: — (nicht abfragbar)');
    expect(zeilen).toContain('🔀 offene PRs: — (nicht abfragbar)');
  });

  it('erste Zeile ist leer — der Block hängt an, statt Bestehendes zu verschieben', () => {
    expect(lageZeilen(rohStandard(), IDS)[0]).toBe('');
  });
});

// Frische-Warnung «stale wip» (QS-PLAN-WIP-FRISCHE). Anlass: eine Session baute
// QS-TOK/QS-TOK-AUFRAEUMEN fertig, landete die PRs und endete, ohne die wip-Marke
// freizugeben — das Lagebild zeigte stundenlang «im Bau», was frei war.
describe('staleWip — wip ohne Bau-Spur', () => {
  const wip = (...ids: string[]) => ids.map((id) => ({ id, feld: null }));

  it('wip MIT Branch-Spur → keine Warnung', () => {
    const roh = rohStandard({ wip: wip('QS-CODE-TURSO'), worktrees: [], branches: ['main', 'feat/qs-code-turso-fts'] });
    expect(staleWip(roh, IDS)).toEqual([]);
    expect(lageZeilen(roh, IDS).filter((z) => z.startsWith('⚠️'))).toEqual([]);
  });

  it('wip MIT Worktree-Spur (Slug im Branch des Platzes) → keine Warnung', () => {
    const roh = rohStandard({ wip: wip('QS-PLAN-REVIEW'), worktrees: parseWorktrees(PORCELAIN), branches: ['main'] });
    expect(staleWip(roh, IDS)).toEqual([]);
  });

  it('wip OHNE Spur → Warnung mit ID und plan:set-Hinweis', () => {
    const roh = rohStandard({ wip: wip('QS-PLAN-REVIEW'), worktrees: [], branches: ['main', 'chore/aufraeumen'] });
    expect(staleWip(roh, IDS)).toEqual(['QS-PLAN-REVIEW']);
    expect(lageZeilen(roh, IDS)).toContain(
      '⚠️  Als «in Arbeit» markiert, aber ohne Bau-Spur (kein Branch/Bauplatz): QS-PLAN-REVIEW — freigeben (plan:set QS-PLAN-REVIEW status=ready|done|parked) oder Bau wieder aufnehmen.',
    );
  });

  it('ohne --prs trägt die Warnung den Zusatz «netzfrei» — und nur dann, wenn sie erscheint', () => {
    const stale = rohStandard({ wip: wip('QS-PLAN-REVIEW'), worktrees: [], branches: ['main'] });
    expect(lageZeilen(stale, IDS)).toContain('   (offene PRs nicht geprüft — netzfrei)');
    const sauber = rohStandard({ wip: wip('QS-CODE-TURSO'), worktrees: [], branches: ['main', 'feat/qs-code-turso-fts'] });
    expect(lageZeilen(sauber, IDS).some((z) => z.includes('netzfrei)'))).toBe(false);
  });

  it('wip ohne Branch, aber PR-Treffer bei --prs → keine Warnung (headRefName wie Titel)', () => {
    const perBranch = rohStandard({
      wip: wip('QS-PLAN-REVIEW'), worktrees: [], branches: ['main'], prsGewuenscht: true,
      prs: [{ number: 460, headRefName: 'feat/qs-plan-review-lage', titel: 'Lage-Block' }],
    });
    expect(staleWip(perBranch, IDS)).toEqual([]);
    const perTitel = rohStandard({
      wip: wip('QS-PLAN-REVIEW'), worktrees: [], branches: ['main'], prsGewuenscht: true,
      prs: [{ number: 461, headRefName: 'agent-4f2a9c', titel: 'QS-PLAN-REVIEW Stufe 2' }],
    });
    expect(staleWip(perTitel, IDS)).toEqual([]);
  });

  it('PR-Titel bindet mit WORTGRENZE — «QS-CODE-TURSO» ist keine Spur für «QS-CODE»', () => {
    const roh = rohStandard({
      wip: wip('QS-CODE'), worktrees: [], branches: ['main'], prsGewuenscht: true,
      prs: [{ number: 462, headRefName: 'agent-abc', titel: 'QS-CODE-TURSO T3: FTS-Index' }],
    });
    expect(staleWip(roh, IDS)).toEqual(['QS-CODE']);
  });

  it('git-Ausfall → KEINE Warnung («nicht prüfbar» ist nicht «stale»), nur die Hinweiszeile', () => {
    const roh = rohStandard({ wip: wip('QS-PLAN-REVIEW', 'QS-CODE'), worktrees: null, branches: null, ausfaelle: ['git worktree list', 'git branch'] });
    expect(staleWip(roh, IDS)).toEqual([]);
    expect(lageZeilen(roh, IDS).filter((z) => z.startsWith('⚠️'))).toEqual([
      '⚠️  Lage unvollständig — nicht abfragbar: git worktree list · git branch (kein Fehler des Plans)',
    ]);
  });

  it('halber Ausfall (nur Branches abfragbar) warnt ebenfalls nicht — der Bau-Platz bliebe ungesehen', () => {
    const roh = rohStandard({ wip: wip('QS-PLAN-REVIEW'), worktrees: null, branches: ['main'], ausfaelle: ['git worktree list'] });
    expect(staleWip(roh, IDS)).toEqual([]);
  });

  it('zwei stale wip → stabile Reihenfolge, unabhängig von der Eingabefolge', () => {
    const basis = { worktrees: [], branches: ['main'] };
    const a = staleWip(rohStandard({ ...basis, wip: wip('QS-PLAN-REVIEW', 'QS-CODE') }), IDS);
    const b = staleWip(rohStandard({ ...basis, wip: wip('QS-CODE', 'QS-PLAN-REVIEW') }), IDS);
    expect(a).toEqual(['QS-CODE', 'QS-PLAN-REVIEW']);
    expect(b).toEqual(a);
  });
});

describe('lageBlock — Verdrahtung wie in der CLI', () => {
  it('führt Einheiten, Resolver-wip und Erhebung zusammen', () => {
    const e = [einheit('QS-PLAN-REVIEW', { status: 'wip', feld: 'betrieb' }), einheit('QS-CODE')];
    const zeilen = lageBlock(e, ['QS-PLAN-REVIEW'], {
      prs: false,
      laufe: runner({ 'git worktree': PORCELAIN, 'git branch': BRANCHES }),
    });
    expect(zeilen).toContain('   QS-PLAN-REVIEW → betrieb');
    expect(zeilen).toContain('🌳 Worktrees: agent-abc [feat/qs-plan-review-lage] → QS-PLAN-REVIEW · agent-def [detached] → ohne Schritt-Bezug');
  });

  it('git komplett kaputt → Block bleibt, eine Hinweiszeile, kein Wurf', () => {
    const kaputt: Laufe = () => { throw new Error('git: command not found'); };
    expect(() => lageBlock([], [], { prs: true, laufe: kaputt })).not.toThrow();
    const zeilen = lageBlock([], [], { prs: true, laufe: kaputt });
    expect(zeilen.filter((z) => z.startsWith('⚠️')).length).toBe(1);
  });
});

