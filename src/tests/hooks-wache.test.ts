// src/tests/hooks-wache.test.ts — die Claude-Code-Hooks, ein Prüfgegenstand. Beide Quellen fahren .claude/hooks/*.py mit synthetischem stdin-JSON und prüfen Exit-Code/Ausgabe.
// Zusammengelegt 31.8.2026 (QS-EFFIZIENZ, Ent-Regulierung Runde 2 Batch B; Beleg:
// bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md §3 Kandidat 1). Die
// Fälle stehen WÖRTLICH unter dem Banner ihrer Herkunftsdatei; gestrichen wurde
// nur ein wörtliches Rumpf-Duplikat (ROADMAP-CHRONIK.md, 31.8.2026).
import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── aus src/tests/hooks-wache.test.ts ─────────────────────────────────────────

// QS-HOOKS-AUSBAU (14.8.2026): Absicherung der zwei Claude-Code-Hooks
// .claude/hooks/subagent-wache.py (SubagentStop, §14.7 durchsetzen) und
// .claude/hooks/abschluss-wache.py (SessionEnd/--start, §17-Nachlass über die
// Session-Grenze). Die Hooks laufen als eigenständige Python-Prozesse; hier
// werden sie per execFileSync mit synthetischem stdin-JSON gefahren und
// Exit-Code/stdout/stderr geprüft — nach dem Muster von dispatch-klausel.test.ts
// (Fixtures statt Live-Dispatch, weil ein echter Sub-Agenten-Lauf hier nicht
// verfügbar ist).
//
// Stand nach Gegenprüfungs-Auflagen B1–B7/B10/B11 (14.8.2026):
//   - subagent-wache: keine Merkdatei mehr, Loop-Schutz über stdin-Feld
//     stop_hook_active; Erfolgs-/Negationswörter mit Wortgrenzen + Negations-
//     fenster; Artefakt-SHA nur kontextgebunden (commit|sha|head vor dem Hex).
//   - abschluss-wache: stdin-/JSON-Feld heisst reason (nicht end_reason);
//     Nachlass entsteht bei uncommitted/unpushed oder jetzt_offen (F17:
//     gelandetes Vorhaben steht noch in ROADMAP JETZT, Abgleich 5.10.2026); korrupte
//     .session-nachlass.json wird bei --start still geräumt.
//
// WICHTIG (Isolation): CLAUDE_PROJECT_DIR zeigt für jeden Testlauf auf ein
// frisches tmp-Verzeichnis, damit .session-nachlass.json NIE im echten Repo
// landet. Aufräumen nach jedem Test.

const SUBAGENT_WACHE = join(process.cwd(), '.claude/hooks/subagent-wache.py');
const ABSCHLUSS_WACHE = join(process.cwd(), '.claude/hooks/abschluss-wache.py');

let tmpDirs: string[] = [];

function neuesTmpDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'hooks-wache-'));
  tmpDirs.push(d);
  return d;
}

afterEach(() => {
  for (const d of tmpDirs) {
    try {
      rmSync(d, { recursive: true, force: true });
    } catch {
      // Aufräumfehler ignorieren — tmp-Verzeichnis, kein Produktivstand.
    }
  }
  tmpDirs = [];
});

interface Lauf {
  status: number;
  stdout: string;
  stderr: string;
}

/**
 * Führt einen der Hooks als Python-Prozess aus; Exit-Code wird nie geworfen.
 *
 * Test-Hygiene 5.9.2026 (QS-EFFIZIENZ, Kondensat-Befund): `execFileSync` gibt
 * stderr per Default an den ELTERNPROZESS weiter (Node inherited stderr bei
 * Sync-Exec, damit ein Fehlschlag sichtbar bleibt) — hier landete so bei jedem
 * Erfolgs-Fall (a) zweimal wörtlich der Block «SUBAGENT-WACHE (§14.7): Dein
 * Bericht behauptet Erfolg …» in der Vitest-Ausgabe, obwohl der Hook per Design
 * genau DAS auf stderr schreibt (kein Bug im Hook — nur unkontrolliertes
 * Durchreichen im Test). `stdio: ['pipe','pipe','pipe']` fängt stderr wie
 * stdout ab; Assertions unverändert, `err.stderr`/Rückgabe bleiben identisch
 * befüllt.
 */
function laufe(skript: string, projektDir: string, stdinJson: string, args: string[] = []): Lauf {
  try {
    const stdout = execFileSync('python3', [skript, ...args], {
      input: stdinJson,
      env: { ...process.env, CLAUDE_PROJECT_DIR: projektDir },
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { status: 0, stdout, stderr: '' };
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { status: err.status ?? -1, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
  }
}

describe('subagent-wache.py — SubagentStop-Hook (§14.7)', () => {
  function bericht(
    agentType: string,
    message: string,
    extra: Record<string, unknown> = {},
  ): string {
    return JSON.stringify({
      hook_event_name: 'SubagentStop',
      agent_type: agentType,
      last_assistant_message: message,
      ...extra,
    });
  }

  it('(a) Erfolg ohne Artefakt bei lex-bau → exit 2, stderr trägt §14.7', () => {
    const dir = neuesTmpDir();
    const r = laufe(SUBAGENT_WACHE, dir, bericht('lex-bau', 'Erledigt, alles grün.'));
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('§14.7');
  });

  it('(b) stop_hook_active:true (bereits einmal blockierter Stopp) → exit 0', () => {
    const dir = neuesTmpDir();
    const r = laufe(
      SUBAGENT_WACHE,
      dir,
      bericht('lex-bau', 'Erledigt, alles grün.', { stop_hook_active: true }),
    );
    expect(r.status).toBe(0);
  });

  it('(c) Erfolg MIT kontextgebundenem Commit-SHA → exit 0', () => {
    const dir = neuesTmpDir();
    const r = laufe(SUBAGENT_WACHE, dir, bericht('lex-bau', 'Erledigt. Commit a1b2c3d4e5f6.'));
    expect(r.status).toBe(0);
  });

  it('(d) agent_type lex-recherche (read-only) → exit 0', () => {
    const dir = neuesTmpDir();
    const r = laufe(SUBAGENT_WACHE, dir, bericht('lex-recherche', 'Erledigt, alles grün.'));
    expect(r.status).toBe(0);
  });

  it('(e) Bericht mit «blockiert» → exit 0', () => {
    const dir = neuesTmpDir();
    const r = laufe(
      SUBAGENT_WACHE,
      dir,
      bericht('lex-bau', 'Blockiert: Norm-Anker liess sich nicht verifizieren.'),
    );
    expect(r.status).toBe(0);
  });

  it('(f) kaputtes JSON auf stdin → exit 0', () => {
    const dir = neuesTmpDir();
    const r = laufe(SUBAGENT_WACHE, dir, '{ das ist kein JSON');
    expect(r.status).toBe(0);
  });

  // Auflage B11 — False-Positive-Klasse einfrieren.
  it('schema-konformer lex-synthese-Bericht MIT Commit-SHA → exit 0', () => {
    const dir = neuesTmpDir();
    const r = laufe(
      SUBAGENT_WACHE,
      dir,
      bericht('lex-synthese', 'Erledigt. Commit a1b2c3d4e5f6, alle Tests grün.'),
    );
    expect(r.status).toBe(0);
  });

  it('verneinter Erfolg («nicht erledigt») → exit 0', () => {
    const dir = neuesTmpDir();
    const r = laufe(
      SUBAGENT_WACHE,
      dir,
      bericht('lex-bau', 'Der Auftrag konnte nicht erledigt werden.'),
    );
    expect(r.status).toBe(0);
  });

  it('verneinter Erfolg («unerledigt») → exit 0', () => {
    const dir = neuesTmpDir();
    const r = laufe(SUBAGENT_WACHE, dir, bericht('lex-bau', 'Aufgabe unerledigt geblieben.'));
    expect(r.status).toBe(0);
  });

  it('nackte Zahl ohne Kontextwort zählt NICHT als Artefakt → exit 2', () => {
    const dir = neuesTmpDir();
    const r = laufe(SUBAGENT_WACHE, dir, bericht('lex-bau', 'Erledigt. Bundle hat 1234567 Bytes.'));
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('§14.7');
  });
});

describe('abschluss-wache.py — SessionEnd/--start-Hook (§17)', () => {
  it('(g) --start ohne Nachlass-Datei → exit 0, kein stdout', () => {
    const dir = neuesTmpDir();
    const r = laufe(ABSCHLUSS_WACHE, dir, '', ['--start']);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
  });

  it('(h) --start mit vorhandenem Nachlass → druckt NACHLASS-WACHE und löscht die Datei; zweiter Lauf still', () => {
    const dir = neuesTmpDir();
    const nachlassPfad = join(dir, '.session-nachlass.json');
    writeFileSync(
      nachlassPfad,
      JSON.stringify({
        reason: 'clear',
        branch: 'x',
        uncommitted: ['M a'],
        unpushed: [],
        jetzt_offen: [{ kuerzel: 'MONITOR', commit: 'abc fix' }],
      }),
    );

    const erster = laufe(ABSCHLUSS_WACHE, dir, '', ['--start']);
    expect(erster.status).toBe(0);
    expect(erster.stdout).toContain('NACHLASS-WACHE');
    expect(erster.stdout).toContain('Vorhaben MONITOR');
    expect(existsSync(nachlassPfad)).toBe(false);

    const zweiter = laufe(ABSCHLUSS_WACHE, dir, '', ['--start']);
    expect(zweiter.status).toBe(0);
    expect(zweiter.stdout).toBe('');
  });

  it('korrupter Nachlass beim --start → exit 0, Datei weg, kein stdout', () => {
    const dir = neuesTmpDir();
    const nachlassPfad = join(dir, '.session-nachlass.json');
    writeFileSync(nachlassPfad, '{ kaputtes JSON');

    const r = laufe(ABSCHLUSS_WACHE, dir, '', ['--start']);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
    expect(existsSync(nachlassPfad)).toBe(false);
  });

  // F17-JETZT-Abgleich (Umstieg 5.10.2026): origin/main wird per update-ref simuliert.
  const ROADMAP_MIT = '# Roadmap\n\n## JETZT\n\n1. **Normen-Monitor** (`MONITOR`) · S · Gegenprüfung ja\n\n## EINGANG\n';
  const ROADMAP_OHNE = '# Roadmap\n\n## JETZT\n\n1. **Anderes** (`ANDERES`) · S\n\n## EINGANG\n- MONITOR erwähnt\n';

  // Format der origin/main-Commits: «squash» = echtes GitHub-Merge-Queue-Squash
  // (Trailer NICHT im letzten Absatz — danach `---------` und Co-authored-by,
  // Gegenprüfung 5.10.2026 B1), «plain» = Trailer im letzten Absatz.
  function mainMessage(trailer: string | null, format: 'squash' | 'plain'): string {
    if (!trailer) return 'feat: x';
    return format === 'squash'
      ? `feat: x (#1)\n\nText\n\nRoadmap: ${trailer}\n\n---------\n\nCo-authored-by: X <x@example.invalid>`
      : `feat: x\n\nRoadmap: ${trailer}`;
  }
  function repoMitMain(
    roadmap: string, trailer: string | null, zweig: string,
    opt: { format?: 'squash' | 'plain'; eigenerTrailer?: string } = {},
  ): string {
    const dir = neuesTmpDir();
    const g = (...a: string[]) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' }).trim();
    g('init', '-q', '-b', 'main');
    g('config', 'user.email', 'test@example.invalid');
    g('config', 'user.name', 'Test');
    writeFileSync(join(dir, 'ROADMAP.md'), roadmap);
    g('add', 'ROADMAP.md');
    g('commit', '-q', '-m', mainMessage(trailer, opt.format ?? 'squash'));
    g('update-ref', 'refs/remotes/origin/main', g('rev-parse', 'HEAD'));
    g('checkout', '-q', '-b', zweig);
    if (opt.eigenerTrailer) {  // eigener Commit der Session über origin/main hinaus
      g('commit', '-q', '--allow-empty', '-m', `feat: y\n\nRoadmap: ${opt.eigenerTrailer}`);
    }
    return dir;
  }
  const nachlassVon = (dir: string) => {
    const r = laufe(ABSCHLUSS_WACHE, dir, JSON.stringify({ reason: 'other' }));
    expect(r.status).toBe(0);
    const pfad = join(dir, '.session-nachlass.json');
    return existsSync(pfad) ? JSON.parse(readFileSync(pfad, 'utf8')) : null;
  };

  it('(i) SessionEnd: Zweig MONITOR/x, MONITOR in JETZT, Squash-Commit (Trailer vor «---------») auf origin/main → Nachlass jetzt_offen', () => {
    const n = nachlassVon(repoMitMain(ROADMAP_MIT, 'MONITOR', 'MONITOR/x'));
    expect(n?.jetzt_offen[0].kuerzel).toBe('MONITOR');
    expect(n?.jetzt_offen[0].commit).toContain('feat: x');
    expect(n?.uncommitted).toEqual([]);
    expect(n?.unpushed).toEqual([]);
  });

  it('(i-b) wie (i), Commit-Format «plain» (Trailer im letzten Absatz) → ebenfalls Nachlass', () => {
    const n = nachlassVon(repoMitMain(ROADMAP_MIT, 'MONITOR', 'MONITOR/x', { format: 'plain' }));
    expect(n?.jetzt_offen[0].kuerzel).toBe('MONITOR');
  });

  it('(ii) SessionEnd: wie (i), aber MONITOR steht nicht mehr in JETZT → kein Nachlass', () => {
    expect(nachlassVon(repoMitMain(ROADMAP_OHNE, 'MONITOR', 'MONITOR/x'))).toBeNull();
  });

  it('(iii) SessionEnd: wie (i), aber kein Trailer-Commit auf origin/main → kein Nachlass', () => {
    expect(nachlassVon(repoMitMain(ROADMAP_MIT, null, 'MONITOR/x'))).toBeNull();
    // Trailer eines ANDEREN Vorhabens zählt nicht (Identität, nicht Substring).
    expect(nachlassVon(repoMitMain(ROADMAP_MIT, 'MONITOR2', 'MONITOR/x'))).toBeNull();
  });

  it('(iv) Fehlalarm-Schutz: Zweig claude/xyz OHNE eigenen Commit, origin/main-HEAD trägt Roadmap: MONITOR → KEIN Nachlass', () => {
    expect(nachlassVon(repoMitMain(ROADMAP_MIT, 'MONITOR', 'claude/xyz'))).toBeNull();
    expect(nachlassVon(repoMitMain(ROADMAP_MIT, 'MONITOR', 'claude/xyz', { format: 'plain' }))).toBeNull();
  });

  it('(v) Zweig claude/xyz mit EIGENEM Commit (Trailer Roadmap: MONITOR), origin/main frischer Squash-Commit mit MONITOR → Nachlass', () => {
    const n = nachlassVon(repoMitMain(ROADMAP_MIT, 'MONITOR', 'claude/xyz', { eigenerTrailer: 'MONITOR' }));
    expect(n?.jetzt_offen[0].kuerzel).toBe('MONITOR');
    expect(n?.unpushed).toEqual([]);  // ohne Upstream zählt nichts als ungepusht
  });

  it('(vi) Kürzel mit Kleinbuchstaben (W2·5l) wird erkannt, Vergleich case-insensitiv', () => {
    const roadmap = '# Roadmap\n\n## JETZT\n\n1. **X** (`W2·5l`) · S\n\n## EINGANG\n';
    const n = nachlassVon(repoMitMain(roadmap, 'W2·5l', 'claude/xyz', { eigenerTrailer: 'w2·5L' }));
    expect(n?.jetzt_offen[0].kuerzel).toBe('W2·5l');
  });

  it('SessionEnd: uncommitted löst Nachlass aus, jetzt_offen bleibt dabei leer', () => {
    const dir = repoMitMain(ROADMAP_OHNE, null, 'claude/xyz');
    writeFileSync(join(dir, 'unstaged.txt'), 'x\n');
    const n = nachlassVon(dir);
    expect(n?.reason).toBe('other');
    expect(n?.jetzt_offen).toEqual([]);
    expect(n?.uncommitted.length).toBeGreaterThan(0);
  });
});


// ─── aus src/tests/hook-mcp-deckung.test.ts ────────────────────────────────────
// ─── Hook-Deckung der MCP-Kanäle (QS-EFFIZIENZ 15.8.2026) ────────────────────
//
// ANLASS (Werkzeug-Analyse Befund 3): `tor-schutz.py` und `lese-schutz.py`
// hingen allein an den Matchern `Bash`/`Read`. Die Desktop-Commander-Werkzeuge
// erzielen dieselbe Wirkung unter anderem Namen und mit anderen Feldnamen —
// `start_process` (command) · `interact_with_process` (input) · `read_file`
// (path/length) · `read_multiple_files` (paths). Ohne Deckung fährt jedes
// Tor-Kommando durch eine Pipe und jeder Katastrophen-Read ungebremst durch.
//
// ZWEITER, TEURERER BEFUND — die Matcher-SYNTAX (§6.7): Claude Code
// (Bundle 2.1.220, Funktion `BFy`) behandelt einen Matcher, der nur aus
// `[A-Za-z0-9_|]` besteht, als LITERAL-Liste mit exakter Gleichheit — nicht als
// Regex. `deploy_to_vercel` ist aber nie gleich `mcp__<server>__deploy_to_vercel`.
// Der am 14.8.2026 gebaute `deploy-schutz`-Matcher konnte darum NIE feuern: ein
// Tor, das nicht scheitern kann. Erst ein Matcher mit Regex-Metazeichen nimmt
// den Regex-Zweig. Dieser Test friert beides ein — die Matcher-FORM und den
// Rot-Beweis der Adapter.

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SETTINGS = JSON.parse(
  readFileSync(resolve(WURZEL, '.claude/settings.json'), 'utf8'),
) as { hooks: { PreToolUse: { matcher?: string; hooks: { command: string }[] }[] } };

/** Ruft einen Hook so auf, wie Claude Code ihn füttert: Tool-JSON auf stdin. */
function hook(skript: string, eingabe: unknown): number {
  const p = spawnSync('python3', [resolve(WURZEL, '.claude/hooks', skript)], {
    input: JSON.stringify(eingabe),
    cwd: WURZEL,
    encoding: 'utf8',
  });
  return p.status ?? -1;
}

describe('Matcher-Form für MCP-Werkzeuge', () => {
  // Nachbau des Literal-Zweigs aus BFy(): nur diese Zeichen → keine Regex.
  const NUR_LITERAL = /^[a-zA-Z0-9_|]+$/;

  it('kein PreToolUse-Matcher nennt ein MCP-Werkzeug in Literal-Form', () => {
    const kaputt = SETTINGS.hooks.PreToolUse.filter(
      (e) => e.matcher && NUR_LITERAL.test(e.matcher) && e.matcher.includes('_'),
    ).map((e) => e.matcher);
    // Unterstrich = MCP-Namenskonvention (`start_process`); die eingebauten
    // Werkzeuge heissen `Bash`, `Read`, `Task|Agent` — die bleiben literal.
    expect(kaputt).toEqual([]);
  });

  it('jeder MCP-Matcher ist auf `^mcp__…$` verankert', () => {
    const mcp = SETTINGS.hooks.PreToolUse.map((e) => e.matcher).filter(
      (m): m is string => !!m && m.includes('mcp__'),
    );
    expect(mcp.length).toBeGreaterThan(0);
    for (const m of mcp) expect(m.startsWith('^mcp__') && m.endsWith('$')).toBe(true);
  });

  it('die drei Schutz-Hooks sind an MCP-Kanäle verdrahtet', () => {
    const verdrahtet = (skript: string) =>
      SETTINGS.hooks.PreToolUse.some(
        (e) => e.matcher?.includes('mcp__') && e.hooks.some((h) => h.command.includes(skript)),
      );
    expect(verdrahtet('tor-schutz.py')).toBe(true);
    expect(verdrahtet('lese-schutz.py')).toBe(true);
    expect(verdrahtet('deploy-schutz.py')).toBe(true);
  });
});

describe('tor-schutz: MCP-Shell-Kanäle', () => {
  const dc = (tool: string, tool_input: unknown) => ({
    tool_name: `mcp__Desktop_Commander__${tool}`,
    tool_input,
  });

  it('blockt ein Tor-Kommando durch eine Pipe (start_process)', () => {
    expect(hook('tor-schutz.py', dc('start_process', { command: 'npm run lint | tail -5' }))).toBe(2);
  });

  it('blockt ein Tor-Kommando durch eine Pipe (interact_with_process, Feld `input`)', () => {
    expect(hook('tor-schutz.py', dc('interact_with_process', { pid: 1, input: 'npx tsc -b | head' }))).toBe(2);
  });

  it('blockt `git commit --amend` über den MCP-Kanal', () => {
    expect(hook('tor-schutz.py', dc('start_process', { command: 'git commit --amend -m x' }))).toBe(2);
  });

  it('lässt harmlose Kommandos durch', () => {
    expect(hook('tor-schutz.py', dc('start_process', { command: 'ls -la src' }))).toBe(0);
    expect(hook('tor-schutz.py', dc('interact_with_process', { pid: 1, input: 'print(df.head())' }))).toBe(0);
  });

  // Direkter main-Push = Deploy (Auftrag David 15.8.2026, Skill landung
  // Ziff. 7): Verwaltungs-Pushes rissen am 15.8. das Vercel-Tageslimit und
  // warfen sechs fertige PRs auf BEHIND. Der Hook blockt den direkten Push,
  // lässt Feature-Branch-Pushes und den bewusst freigegebenen Schluss-Push durch.
  it('blockt direkte main-Pushes, lässt Branch-Push und freigegebenen Schluss-Push durch', () => {
    const bash = (command: string) => ({ tool_name: 'Bash', tool_input: { command } });
    expect(hook('tor-schutz.py', bash('git push origin main'))).toBe(2);
    expect(hook('tor-schutz.py', bash('git commit -m x -- ROADMAP.md && git push origin HEAD:main'))).toBe(2);
    expect(hook('tor-schutz.py', bash('git push -u origin feat/qs-x'))).toBe(0);
    expect(hook('tor-schutz.py', bash('git push'))).toBe(0);
    expect(hook('tor-schutz.py', bash('LEXMETRIK_MAIN_PUSH=1 git push origin main'))).toBe(0);
    expect(hook('tor-schutz.py', dc('start_process', { command: 'git push origin main' }))).toBe(2);
  });

  it('bleibt für Bash unverändert', () => {
    expect(hook('tor-schutz.py', { tool_name: 'Bash', tool_input: { command: 'npm run lint | tail' } })).toBe(2);
    expect(hook('tor-schutz.py', { tool_name: 'Bash', tool_input: { command: 'ls -la' } })).toBe(0);
  });
});

// ─── Merge-Schutz: richtige Fläche, richtige Kommando-Erkennung ───────────────
// §17-Wurzelfix 5.9.2026 (Beleg 02:30). Zwei belegte Defekte der Vorfassung:
//   (a) `gh pr merge <nr>` prüfte die LOKALE Arbeitskopie. Stand das Checkout
//       auf einem fremden Risiko-Branch, blockierte der Hook die Landung
//       völlig anderer, reiner UI-PRs (#679/#685) — und umgekehrt liess er den
//       Merge eines Risiko-PR (#687) DURCH, solange das Checkout sauber war.
//   (b) Das Muster traf jedes TEXTvorkommen: ein `grep 'gh pr merge' src/`
//       wurde blockiert (real reproduziert 5.9.2026).
// Massgeblich ist jetzt die KOMMANDO-POSITION; bei genannter PR-Nummer prüft
// der Hook den PR-Head (MERGE_SCHUTZ_KOPF). Die Fälle hier laufen OHNE Netz:
// CLAUDE_PROJECT_DIR zeigt auf ein leeres tmp-Verzeichnis, in dem
// `npm run check:merge-schutz` scheitert — ein erkanntes Merge-Kommando wird
// dort also fail-closed geblockt (Exit 2), reiner Text läuft gar nicht erst an.
describe('tor-schutz: Merge-Erkennung und Prüf-Fläche', () => {
  /** Hook mit eigenem Projekt-Verzeichnis fahren (kein echtes Repo berühren). */
  function hookIn(command: string, projekt: string): number {
    const p = spawnSync('python3', [resolve(WURZEL, '.claude/hooks/tor-schutz.py')], {
      input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
      cwd: WURZEL,
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: projekt },
    });
    return p.status ?? -1;
  }

  it('blockt ein echtes Merge-Kommando fail-closed (Tor nicht lauffähig)', () => {
    const leer = neuesTmpDir();
    // Ohne PR-Nummer: kein `gh`-Aufruf, kein Netz — und trotzdem geblockt.
    expect(hookIn('gh pr merge --squash', leer)).toBe(2);
    expect(hookIn('gh api -X PUT repos/o/r/pulls/315/merge', leer)).toBe(2);
    expect(hookIn('cd /x && gh pr merge --admin', leer)).toBe(2);
    expect(hookIn('bash -c "gh pr merge --squash"', leer)).toBe(2);
  });

  it('lässt reine Kommando-TEXTE durch (Fehlalarm 5.9.2026)', () => {
    const leer = neuesTmpDir();
    expect(hookIn("grep -rn 'gh pr merge' src/ | head -5", leer)).toBe(0);
    expect(hookIn('rg "gh pr merge" .claude/hooks', leer)).toBe(0);
    expect(hookIn('echo "gh pr merge 685"', leer)).toBe(0);
    // Gegenprobe: ein grep VOR einem echten Merge blockt weiterhin.
    expect(hookIn('grep -q x f && gh pr merge --squash', leer)).toBe(2);
  });

  // Kernbeweis für Defekt (a), OHNE Netz: ein Fixture-Repo als Projekt, ein
  // `gh`-Stub auf dem PATH, der einen Head-SHA AUS DIESEM Repo meldet, und ein
  // `check:merge-schutz`, das nur zurückmeldet, welchen Kopf es bekommen hat.
  // Die Vorfassung reichte keinen Kopf durch und prüfte darum immer HEAD.
  it('reicht bei genannter PR-Nummer den PR-Head an das Tor durch', () => {
    const projekt = neuesTmpDir();
    const g = (...a: string[]) => execFileSync('git', a, { cwd: projekt });
    g('init', '-q');
    g('config', 'user.email', 'test@example.invalid');
    g('config', 'user.name', 'Test');
    writeFileSync(join(projekt, 'a.txt'), 'x\n');
    g('add', 'a.txt');
    g('commit', '-q', '-m', 'init');
    const kopf = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: projekt, encoding: 'utf8' }).trim();

    writeFileSync(
      join(projekt, 'package.json'),
      JSON.stringify({
        name: 'fixture',
        scripts: { 'check:merge-schutz': "node -e \"console.log('KOPF=' + (process.env.MERGE_SCHUTZ_KOPF || 'KEINER')); process.exit(1)\"" },
      }),
    );
    // `gh pr view <nr> --json headRefOid` → fester Head aus dem Fixture-Repo.
    const bin = neuesTmpDir();
    writeFileSync(join(bin, 'gh'), `#!/bin/sh\necho '{"headRefOid":"${kopf}"}'\n`, { mode: 0o755 });

    const p = spawnSync('python3', [resolve(WURZEL, '.claude/hooks/tor-schutz.py')], {
      input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'gh pr merge 4242 --squash' } }),
      cwd: WURZEL,
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: projekt, PATH: `${bin}:${process.env.PATH}` },
    });
    expect(p.status).toBe(2);
    expect(p.stderr).toContain(`KOPF=${kopf}`);          // Tor sah den PR-Head …
    expect(p.stderr).toContain(`PR #4242 (Head ${kopf.slice(0, 8)})`); // … und sagt es
    expect(p.stderr).not.toContain('KOPF=KEINER');
  });

  it('check:merge-schutz prüft den über MERGE_SCHUTZ_KOPF genannten Stand', () => {
    // Der Hook setzt hier den PR-Head-SHA. Beweis, dass die Variable den
    // geprüften Bereich wirklich verschiebt: das Tor nennt den Kopf im Ergebnis.
    const lauf = (kopf: string) =>
      spawnSync('npm', ['run', '--silent', 'check:merge-schutz'], {
        cwd: WURZEL,
        encoding: 'utf8',
        env: { ...process.env, MERGE_SCHUTZ_BASIS: kopf, MERGE_SCHUTZ_KOPF: kopf },
      }).stdout ?? '';
    expect(lauf('HEAD')).toContain('..HEAD (');
    expect(lauf('HEAD~1')).toContain('..HEAD~1 (');
  });
});

describe('lese-schutz: MCP-Lese- und Shell-Kanäle', () => {
  const dc = (tool: string, tool_input: unknown) => ({
    tool_name: `mcp__Desktop_Commander__${tool}`,
    tool_input,
  });
  const RIESE = 'public/materialien/register.json'; // ~1.9 MB, real im Repo

  it('blockt eine nie-direkt-zu-lesende Datei (read_file, Feld `path`)', () => {
    expect(hook('lese-schutz.py', dc('read_file', { path: 'golden/x.json' }))).toBe(2);
  });

  it('blockt den ungebremsten Riesen-Read und lässt den gebundenen durch', () => {
    expect(hook('lese-schutz.py', dc('read_file', { path: RIESE }))).toBe(2);
    expect(hook('lese-schutz.py', dc('read_file', { path: RIESE, offset: 0, length: 40 }))).toBe(0);
  });

  it('prüft jeden Pfad eines Bündels (read_multiple_files, Feld `paths`)', () => {
    expect(hook('lese-schutz.py', dc('read_multiple_files', { paths: ['package.json', 'golden/x.json'] }))).toBe(2);
    expect(hook('lese-schutz.py', dc('read_multiple_files', { paths: ['package.json'] }))).toBe(0);
  });

  it('blockt `cat` auf eine Werkzeug-Datei auch über die MCP-Shell', () => {
    expect(hook('lese-schutz.py', dc('start_process', { command: 'cat package-lock.json' }))).toBe(2);
    expect(hook('lese-schutz.py', dc('interact_with_process', { pid: 1, input: 'cat golden/a.json' }))).toBe(2);
    expect(hook('lese-schutz.py', dc('start_process', { command: 'wc -l package-lock.json' }))).toBe(0);
  });

  it('bleibt für Read und Bash unverändert', () => {
    expect(hook('lese-schutz.py', { tool_name: 'Read', tool_input: { file_path: 'golden/x.json' } })).toBe(2);
    expect(hook('lese-schutz.py', { tool_name: 'Read', tool_input: { file_path: RIESE } })).toBe(2);
    expect(hook('lese-schutz.py', { tool_name: 'Read', tool_input: { file_path: RIESE, limit: 20 } })).toBe(0);
    expect(hook('lese-schutz.py', { tool_name: 'Bash', tool_input: { command: 'cat golden/a.json' } })).toBe(2);
    expect(hook('lese-schutz.py', { tool_name: 'Bash', tool_input: { command: 'ls -la' } })).toBe(0);
  });

  it('fasst fremde Werkzeuge mit ähnlichem Namen nicht an', () => {
    // Google-Drive `read_file_content` o. Ä. — anderer Kanal, anderes Feld.
    const fremd = { tool_name: 'mcp__drive__read_file_content', tool_input: { file_id: 'golden/x.json' } };
    expect(hook('lese-schutz.py', fremd)).toBe(0);
  });
});
