// scripts/ci/diff-klassieren.test.ts
// Diff-Klassierung der CI (doku / code-fern / code) — Fälle der TS-Fassung und
// Verhaltenstest des ECHTEN Shell-Schritts aus ci.yml.
//
// ANLASS (FB S-31, 19.10.2026): #1419 änderte nur das Register
// `bibliothek/register/parameter-verfall.md`; der Diff lief als `doku`, der
// Tore-Job (u. a. `check:verfall-ui` für die Projektion
// `src/data/verfallTermine.generated.ts`) wurde übersprungen (§6.7: ein Tor, das
// für genau den verursachenden Diff nicht läuft, kann nicht scheitern). Erster
// Vorfall derselben Klasse: #619 (`.claude/agents/lex-bau.md`).
//
// PARITÄT: ci.yml trägt die Klassierung als Shell (der `diff`-Job ist
// checkout-/npm-frei und ruft diese Datei nicht auf). Der frühere Paritätstest
// lag in src/tests/steuerwerkzeuge.test.ts und wurde im Kahlschlag #1359
// (10.10.2026, «5 Meta-Tests gelöscht») gelöscht. Die erste Neufassung verglich
// nur den Text des Muster-Literals und die Form der `grep`-Zeilen — drei
// Sabotagen blieben grün (Gegenprüfung 19.10.2026): im pull_request-Zweig
// `art=code-fern` → `art=doku`, eine Schatten-Zuweisung hinter dem Literal,
// der Verfall-UI-Schritt an `art == 'code'` gebunden. Darum jetzt Verhalten:
// der `run:`-Block des Schritts `klassieren` wird per YAML-Parser aus ci.yml
// gezogen und je Zweig (pull_request, push, merge_group) mit `gh`-/`curl`-
// Attrappen (PATH-Vorschaltung in einem Temp-Ordner) wirklich ausgeführt; das
// Ergebnis (`art=…` in GITHUB_OUTPUT) wird gegen Soll UND gegen die TS-Fassung
// gehalten. Läuft ohne Netz; setzt `bash` und das Paket `yaml` voraus (dort
// bereits über vite installiert, nicht in package.json gelistet).
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
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

// ─── Shell↔TS-Parität: der echte run-Block, ausgeführt ───────────────────────
interface Schritt {
  id?: string;
  name?: string;
  if?: string;
  run?: string;
}
interface Workflow {
  jobs: Record<string, { outputs?: Record<string, string>; steps?: Schritt[] }>;
}

const workflow = parse(readFileSync('.github/workflows/ci.yml', 'utf8')) as Workflow;
const alleSchritte: Schritt[] = Object.values(workflow.jobs).flatMap((job) => job.steps ?? []);

const klassierSchritte = alleSchritte.filter((st) => st.id === 'klassieren');
const KLASSIER_SKRIPT = klassierSchritte[0]?.run ?? '';

type Zweig = 'pull_request' | 'push' | 'merge_group';
const ZWEIGE: readonly Zweig[] = ['pull_request', 'push', 'merge_group'];

// `gh`-Attrappe: Dateiliste aus ATTRAPPE_LISTE statt GitHub-API. Die
// merge_group-Compare-Abfrage (jq-Ausdruck enthält `.status`) bekommt vorab die
// Zeile `ahead|0`, die Regelabfrage `ALLGREEN`. Das `--jq` wird nicht
// ausgewertet — die Attrappe liefert direkt die Zeilen «N|<pfad>».
const GH_ATTRAPPE = `#!/bin/bash
case "$*" in
  *rules/branches*) echo ALLGREEN; exit 0;;
  *.status*) echo 'ahead|0';;
esac
cat "$ATTRAPPE_LISTE"
`;
// `curl`-Attrappe: der push-Zweig fragt die Live-Build-Kennung ab; ohne Netz
// leer ⇒ «Rückfall auf BEFORE», der Zweig läuft sonst unverändert.
const CURL_ATTRAPPE = '#!/bin/bash\nexit 0\n';

/** Führt den echten Klassier-Schritt aus und liefert den Wert von `art=`. */
function klassierenInShell(zweig: Zweig, dateien: readonly string[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'klassieren-test-'));
  try {
    const bin = join(dir, 'bin');
    const arbeit = join(dir, 'arbeit');
    mkdirSync(bin);
    mkdirSync(arbeit);
    writeFileSync(join(bin, 'gh'), GH_ATTRAPPE, { mode: 0o755 });
    writeFileSync(join(bin, 'curl'), CURL_ATTRAPPE, { mode: 0o755 });
    const liste = join(dir, 'liste.txt');
    writeFileSync(liste, dateien.map((d) => `N|${d}\n`).join(''));
    const ausgabe = join(dir, 'github-output');
    writeFileSync(ausgabe, '');
    const skript = join(dir, 'schritt.sh');
    writeFileSync(skript, KLASSIER_SKRIPT);
    const sha = (z: string) => z.repeat(40);
    const lauf = spawnSync('bash', [skript], {
      cwd: arbeit,
      encoding: 'utf8',
      env: {
        PATH: `${bin}:${process.env.PATH ?? '/usr/bin:/bin'}`,
        GH_TOKEN: 'attrappe',
        EVENT: zweig,
        REPO: 'attrappe/repo',
        PR: '1',
        GEMELDET: String(dateien.length),
        BEFORE: sha('a'),
        AFTER: sha('b'),
        MG_BASE: sha('a'),
        MG_HEAD: sha('b'),
        MG_BASE_REF: 'refs/heads/main',
        GITHUB_OUTPUT: ausgabe,
        ATTRAPPE_LISTE: liste,
      },
    });
    const meldung = `${zweig} ${JSON.stringify(dateien)}: Exit ${lauf.status}\n${lauf.stdout}\n${lauf.stderr}`;
    expect(lauf.status, meldung).toBe(0);
    const arten = readFileSync(ausgabe, 'utf8')
      .split('\n')
      .filter((z) => z.startsWith('art='));
    expect(arten, `genau eine art=-Zeile erwartet — ${meldung}`).toHaveLength(1);
    return arten[0].slice('art='.length);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('Shell↔TS-Parität — der echte run-Block aus ci.yml, je Zweig ausgeführt', () => {
  it('ci.yml trägt genau einen Schritt «klassieren» mit run-Block, und der Job reicht sein Ergebnis weiter', () => {
    expect(klassierSchritte).toHaveLength(1);
    expect(KLASSIER_SKRIPT.length).toBeGreaterThan(1000);
    expect(workflow.jobs.diff?.outputs?.art).toBe('${{ steps.klassieren.outputs.art }}');
  });

  const FAELLE: ReadonlyArray<readonly [string, readonly string[], 'doku' | 'code-fern' | 'code']> = [
    ['Register allein', [REGISTER], 'code-fern'],
    ['plan/FEHLERBESTAND.md', ['plan/FEHLERBESTAND.md'], 'doku'],
    ['Register + FEHLERBESTAND.md', [REGISTER, 'plan/FEHLERBESTAND.md'], 'code-fern'],
    ['Register + src/App.tsx', [REGISTER, 'src/App.tsx'], 'code'],
    ['.claude/agents/lex-bau.md (nicht doku)', ['.claude/agents/lex-bau.md'], 'code-fern'],
    ['Dispatch-Vorlage', ['docs/token-oekonomie/dispatch-template.md'], 'code-fern'],
    ['andere Registerliste bleibt doku', ['bibliothek/register/andere-liste.md'], 'doku'],
  ];

  for (const zweig of ZWEIGE) {
    it.each(FAELLE)(`${zweig}: %s`, (_name, dateien, soll) => {
      const shell = klassierenInShell(zweig, dateien);
      expect(shell).toBe(soll);
      expect(klassifiziereDiff(dateien)).toBe(soll);
    });
  }

  // Einzeldateien quer durch die Muster-Ränder (Anker, Punkt-Escape, Endung):
  // die Shell-ERE (`grep -E`) muss auf jedem Pfad wie die JS-Regex entscheiden.
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
    'docs/token-oekonomie/dispatch-template.md.bak',
    'docs/token-oekonomie/dispatch-templateXmd',
    'bibliothek/INDEX.md',
    'bibliothek/register/parameter-verfall.md',
    'bibliothek/register/parameter-verfall.md.bak',
    'bibliothek/register/parameter-verfallXmd',
    'bibliothek/register/unterordner/parameter-verfall.md',
    'x/bibliothek/register/parameter-verfall.md',
    'messwerte/a.json',
    'archiv/alt.ts',
    'package.json',
    'e2e/a.e2e.ts',
    '.github/workflows/ci.yml',
    'public/normtext/or.json',
  ];

  it('Einzeldatei-Stichprobe: Shell (pull_request) == TS, und alle drei Klassen kommen vor', () => {
    const arten = new Set<string>();
    for (const datei of STICHPROBE) {
      const shell = klassierenInShell('pull_request', [datei]);
      expect(shell, datei).toBe(klassifiziereDiff([datei]));
      arten.add(shell);
    }
    // Sonst wäre die Stichprobe kein Beweis (Tor, das nicht scheitern kann, §6.7).
    expect([...arten].sort()).toEqual(['code', 'code-fern', 'doku']);
  });

  it('das Registermuster steht in der TS-Fassung und wirkt in der Shell-Fassung (Auslöser FB S-31)', () => {
    expect(WERKZEUG_TROTZ_MD_MUSTER.some((re) => re.test(REGISTER))).toBe(true);
    expect(klassierenInShell('pull_request', [REGISTER])).not.toBe('doku');
  });
});

describe('Verbrauch der Klasse — der Verfall-UI-Schritt läuft bei jedem Nicht-Doku-Diff', () => {
  it("der Schritt mit check:verfall-ui trägt `if: needs.diff.outputs.art != 'doku'` (nicht == 'code')", () => {
    const schritte = alleSchritte.filter((st) => st.run?.includes('npm run check:verfall-ui'));
    expect(schritte).toHaveLength(1);
    expect(schritte[0].if?.replace(/\s+/g, ' ').trim()).toBe("needs.diff.outputs.art != 'doku'");
  });
});
