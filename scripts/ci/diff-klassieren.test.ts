// scripts/ci/diff-klassieren.test.ts
// Diff-Klassierung der CI (doku / code-fern / code) — Fälle und Shell↔TS-Parität.
//
// ANLASS (FB S-31, 19.10.2026): #1419 änderte nur das Register
// `bibliothek/register/parameter-verfall.md`; der Diff lief als `doku`, der
// Tore-Job (u. a. `check:verfall-ui` für die Projektion
// `src/data/verfallTermine.generated.ts`) wurde übersprungen (§6.7: ein Tor, das
// für genau den verursachenden Diff nicht läuft, kann nicht scheitern). Erster
// Vorfall derselben Klasse: #619 (`.claude/agents/lex-bau.md`).
//
// PARITÄT: ci.yml trägt die Klassierung wortgleich als Shell-ERE (der `diff`-Job
// ist checkout-/npm-frei und ruft diese Datei nicht auf). Der frühere
// Paritätstest lag in src/tests/steuerwerkzeuge.test.ts und wurde mit dieser
// Datei im Kahlschlag #1359 (10.10.2026, «5 Meta-Tests gelöscht») gelöscht —
// er hing in einer Sammeldatei, deren Hauptgegenstand (scripts/dispatch*.ts)
// gestrichen wurde. Dieser Test hat darum NUR zwei Abhängigkeiten, die beide
// bestehen bleiben müssen, solange die Shell-Fassung existiert: diese
// Klassierungsdatei und ci.yml. Er importiert nichts aus dem Überbau.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CODE_FERNE_MUSTER,
  istReinerDokuDiff,
  klassifiziereDiff,
  WERKZEUG_TROTZ_MD_MUSTER,
} from './diff-klassieren.ts';

const REGISTER = 'bibliothek/register/parameter-verfall.md';

describe('klassifiziereDiff — Register mit Projektion ist kein Doku-Diff (FB S-31)', () => {
  it('parameter-verfall.md allein ist nicht doku, sondern code-fern (Tore-Job läuft, Browser-Shards nicht)', () => {
    expect(klassifiziereDiff([REGISTER])).not.toBe('doku');
    expect(klassifiziereDiff([REGISTER])).toBe('code-fern');
    expect(istReinerDokuDiff([REGISTER])).toBe(false);
  });

  it('parameter-verfall.md plus andere .md ist nicht doku', () => {
    expect(klassifiziereDiff([REGISTER, 'plan/FEHLERBESTAND.md'])).not.toBe('doku');
    expect(klassifiziereDiff(['plan/FEHLERBESTAND.md', 'ROADMAP.md', REGISTER])).not.toBe('doku');
  });

  it('Gegenprobe: reine .md ohne Werkzeug-Datei bleibt doku', () => {
    expect(klassifiziereDiff(['plan/FEHLERBESTAND.md'])).toBe('doku');
    expect(klassifiziereDiff(['ROADMAP.md', 'bibliothek/register/andere-liste.md'])).toBe('doku');
  });

  it('Bestand #619: Agent-Konfiguration und Dispatch-Vorlage sind nicht doku', () => {
    expect(klassifiziereDiff(['.claude/agents/lex-bau.md'])).not.toBe('doku');
    expect(klassifiziereDiff(['docs/token-oekonomie/dispatch-template.md'])).not.toBe('doku');
  });

  it('Grenzfälle: nur der exakte Registerpfad zählt (Anker, Punkt-Escape, Endung)', () => {
    for (const pfad of [
      'bibliothek/register/parameter-verfall.md.bak',
      'bibliothek/register/parameter-verfallXmd',
      'x/bibliothek/register/parameter-verfall.md',
      'bibliothek/register/unterordner/parameter-verfall.md',
    ]) {
      expect(WERKZEUG_TROTZ_MD_MUSTER.some((re) => re.test(pfad)), pfad).toBe(false);
    }
    expect(klassifiziereDiff(['bibliothek/register/parameter-verfall.mdx'])).toBe('code-fern');
  });

  it('eine App-Datei im Diff macht code, auch mit dem Register', () => {
    expect(klassifiziereDiff([REGISTER, 'src/data/verfallTermine.generated.ts'])).toBe('code');
  });
});

// ─── Shell↔TS-Parität ──────────────────────────────────────────────────────────
// Zwei Vergleichsformen: `.source` textlich (strengste Drift-Sonde, jedes
// Zeichen) und eine Pfad-Stichprobe, die das gebaute Werkzeug (`grep -E`)
// wirklich ausführt — Textgleichheit beweist nicht, dass ERE und JS-Regex
// gleich entscheiden.
describe('Shell↔TS-Parität — CODE_FERN_RE / WERKZEUG_TROTZ_MD_RE gegen ci.yml', () => {
  const ciYml = readFileSync('.github/workflows/ci.yml', 'utf8');

  function alleLiterale(name: string): string[] {
    return [...ciYml.matchAll(new RegExp(`^\\s*${name}='(.*)'\\s*$`, 'gm'))].map((t) => t[1]);
  }

  // `.source` escaped den Delimiter «/» als «\/» (reiner JS-Literal-Zwang);
  // in grep -E sind «\/» und «/» gleich.
  function tsMuster(muster: readonly RegExp[]): string {
    return `(${muster
      .map((r) => r.source)
      .join('|')
      .replace(/\\\//g, '/')})`;
  }

  const STICHPROBE = [
    'ROADMAP.md',
    'plan/FEHLERBESTAND.md',
    'README.mdx', // `\.md$`: Endanker
    'notizen/amd', // `\.md$`: Punkt ist escaped
    'src/x.md.ts',
    'a.md/b.ts', // Verzeichnis namens *.md
    'src/App.tsx',
    'src/data/verfallTermine.generated.ts',
    'src/docs/x.ts', // `^docs/`: Anfangsanker
    'scripts/cowork/y.ts',
    'scripts/verfall-generieren.ts',
    '.claude/agents/lex-bau.md',
    '.claude/settings.json',
    'xclaude/a.ts', // `^\.claude/`: Punkt ist escaped
    'docs/x.md',
    'docs/token-oekonomie/dispatch-template.md',
    'docs/token-oekonomie/dispatch-template.md.bak', // `$` im Werkzeug-Muster
    'docs/token-oekonomie/dispatch-templateXmd', // Punkt-Escape im Werkzeug-Muster
    'bibliothek/INDEX.md',
    'bibliothek/register/parameter-verfall.md',
    'bibliothek/register/parameter-verfall.md.bak', // `$` im Registermuster
    'bibliothek/register/parameter-verfallXmd', // Punkt-Escape im Registermuster
    'bibliothek/register/unterordner/parameter-verfall.md',
    'x/bibliothek/register/parameter-verfall.md', // Anfangsanker
    'messwerte/a.json',
    'archiv/alt.ts',
    'package.json',
    'e2e/a.e2e.ts',
    '.github/workflows/ci.yml',
    'public/normtext/or.json',
  ];

  function grepTreffer(ere: string): string[] {
    try {
      const aus = execFileSync('grep', ['-E', ere], { input: STICHPROBE.join('\n') + '\n' });
      return aus.toString('utf8').split('\n').filter(Boolean);
    } catch (e) {
      if ((e as { status?: number }).status === 1) return []; // grep: kein Treffer
      throw e;
    }
  }

  it.each([
    ['CODE_FERN_RE', CODE_FERNE_MUSTER],
    ['WERKZEUG_TROTZ_MD_RE', WERKZEUG_TROTZ_MD_MUSTER],
  ] as const)('%s: genau ein Literal in ci.yml, textgleich zu TS, grep -E == TS auf der Stichprobe', (name, ts) => {
    const literale = alleLiterale(name);
    expect(literale, `${name} muss genau einmal in ci.yml stehen`).toHaveLength(1);
    expect(literale[0]).toBe(tsMuster(ts));
    const viaTs = STICHPROBE.filter((d) => ts.some((re) => re.test(d)));
    expect(grepTreffer(literale[0])).toEqual(viaTs);
    // Nicht-leer und nicht-alles: sonst wäre die Stichprobe kein Beweis.
    expect(viaTs.length).toBeGreaterThan(0);
    expect(viaTs.length).toBeLessThan(STICHPROBE.length);
  });

  it('das Registermuster steht in BEIDEN Fassungen (Auslöser FB S-31)', () => {
    expect(alleLiterale('WERKZEUG_TROTZ_MD_RE')[0]).toContain('^bibliothek/register/parameter-verfall\\.md$');
    expect(WERKZEUG_TROTZ_MD_MUSTER.some((re) => re.test(REGISTER))).toBe(true);
  });

  it('alle drei Zweige (pr/push/mg) werten dieselben zwei grep-Bedingungen aus', () => {
    const doku = [
      ...ciYml.matchAll(/if grep -qvE '\\\.md\$' (\S+) \|\| grep -qE "\$WERKZEUG_TROTZ_MD_RE" (\S+); then/g),
    ];
    const fern = [...ciYml.matchAll(/if grep -qvE "\$CODE_FERN_RE" (\S+); then/g)];
    const soll = ['mg-dateien.txt', 'pr-dateien.txt', 'push-dateien.txt'];
    expect(doku.map((t) => t[1]).sort()).toEqual(soll);
    expect(doku.every((t) => t[1] === t[2])).toBe(true);
    expect(fern.map((t) => t[1]).sort()).toEqual(soll);
  });
});
