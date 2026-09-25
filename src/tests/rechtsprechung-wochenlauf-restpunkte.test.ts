// Restpunkte R1–R3 der Nachprüfung #1113 (25.9.2026) — je Punkt ein Test;
// jeder Block nennt die Mutation, die ihn rot macht (Rot-Beweis in der Rückgabe).
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { entscheide, type Lage, type RegEintrag, type StichprobenZeile } from '../../scripts/rechtsprechung/wochenlauf-kern';
import { befundBlock, leseBefundBlock, pruefeVorwoche, vollpruefungOffen, UNBEKANNT } from '../../scripts/rechtsprechung/wochenlauf-vorwoche';
import { kuerzeBody, BODY_MAX, SCHLUSS } from '../../scripts/rechtsprechung/wochenlauf-bericht';

const e = (key: string, gericht: string): RegEintrag => ({ key, gericht, datum: '2026-09-17' });
const z = (key: string, ergebnis: StichprobenZeile['ergebnis'], detail = ''): StichprobenZeile => ({ key, url: null, ergebnis, detail });
const gruen: Lage = {
  inhaltsDiff: true, quellenAus: [], toreRot: [], nachbauRot: [], mergeSchutzSperrt: true,
  stichprobe: [z('a', 'treffer')], unerwartet: [], budgetUeber: [], vorwocheVerworfen: null,
};

describe('R1 · mehr als ein Befund-Block ⇒ unlesbar (kein Verdecken)', () => {
  // Mutation: Mehrfach-Prüfung in leseBefundBlock entfernen ⇒ der obere (leere/zitierte) Block gewinnt.
  const echt = befundBlock([{ key: 'bvger_X', grund: 'Datum ✗' }]);
  it('zitierter leerer Block oben verdeckt den echten nicht', () => {
    expect(leseBefundBlock(`x\n\`\`\`\n${befundBlock([])}\n\`\`\`\n${echt}\nfuss`)).toEqual({ befunde: null, kaputt: true });
    expect(leseBefundBlock(`${befundBlock([])}\n${echt}`)).toEqual({ befunde: null, kaputt: true });
  });
  it('⇒ Platzhalter-Befund, Entwurf — auch wenn der PR nicht Entwurf war', () => {
    const vw = { entwurf: false, ...leseBefundBlock(`${befundBlock([])}\n${echt}`) };
    const p = pruefeVorwoche(vw, [z('bvger_X', 'treffer')]);
    expect(p.offen.map((b) => b.key)).toEqual([UNBEKANNT]);
    expect(entscheide({ ...gruen, vorwocheOffen: p.gruende }).entscheid).toBe('entwurf');
  });
  it('genau ein Block bleibt lesbar (Datum 17.9., nicht Monatserster)', () => {
    expect(leseBefundBlock(`kopf\n${echt}\nfuss`)).toEqual({ befunde: [{ key: 'bvger_X', grund: 'Datum ✗' }], kaputt: false });
  });
});

describe('R2 · BE nicht prüfbar ⇒ Entwurf mit eigenem Grund', () => {
  // Mutation: vollpruefungOffen-Grund in entscheide() nicht übernehmen (oder Filter auf «fehltreffer» statt «nicht-pruefbar») ⇒ «pr».
  const plan = [e('be_verwaltungsgericht_2002026656', 'be_verwaltungsgericht'), e('bvger_C_706_2026', 'bvger'), e('bvger_F_1_2026', 'bvger')];
  const sp = [
    z('be_verwaltungsgericht_2002026656', 'nicht-pruefbar', 'Datum nicht ermittelbar — Handprüfung'),
    z('bvger_C_706_2026', 'treffer'), z('bvger_F_1_2026', 'nicht-pruefbar'),
  ];
  it('nur das Vollprüfungs-Gericht erzeugt den Grund', () => {
    expect(vollpruefungOffen(plan, sp)).toEqual(['BE: Datum nicht belegbar — be_verwaltungsgericht_2002026656']);
    expect(vollpruefungOffen(plan, sp.map((s) => ({ ...s, ergebnis: 'treffer' as const })))).toEqual([]);
  });
  it('Entscheid «entwurf», obwohl ein Treffer da ist und kein Fehltreffer', () => {
    const ent = entscheide({ ...gruen, stichprobe: sp, vollpruefungOffen: vollpruefungOffen(plan, sp) });
    expect(ent).toEqual({ entscheid: 'entwurf', gruende: ['BE: Datum nicht belegbar — be_verwaltungsgericht_2002026656'] });
    expect(entscheide({ ...gruen, stichprobe: sp }).entscheid).toBe('pr'); // ohne R2 fiele BE durch
  });
  it('CLI verdrahtet den Grund in den Entscheid', () => {
    const cli = readFileSync('scripts/rechtsprechung/wochenlauf.ts', 'utf8');
    expect(cli).toMatch(/vollOffen\.push\(\.\.\.vollpruefungOffen\(plan, sp\.out\)\)/);
    expect(cli).toMatch(/vollpruefungOffen: vollOffen/);
  });
});

describe('R3a · Body-Kürzung < 60 000 Zeichen, Block und Schluss bleiben', () => {
  // Mutation: kuerzeBody gibt den Bericht ungekürzt zurück, oder schneidet vom Ende ⇒ rot.
  const block = befundBlock([{ key: 'bge_152_V_85', grund: 'Akz ✗' }]);
  const fuss = `\n\n## Für die prüfende Session\n\n${SCHLUSS}\n`;
  const lang = `Kopf\n\n${'| bvger | 1 | 2 | +1 | 2026-09-17 |\n'.repeat(3000)}\n${block}${fuss}`;
  it('kurz bleibt unverändert', () => {
    const kurz = `Kopf\n${block}${fuss}`;
    expect(kuerzeBody(kurz, null)).toBe(kurz);
  });
  it('lang wird gekürzt, sichtbar markiert, Block lesbar, Schluss unversehrt', () => {
    expect(lang.length).toBeGreaterThan(BODY_MAX);
    const k = kuerzeBody(lang, 'https://github.com/x/actions/runs/1');
    expect(k.length).toBeLessThan(BODY_MAX);
    expect(k).toMatch(/\*\*Bericht gekürzt\*\*.*Job-Summary.*actions\/runs\/1/);
    expect(leseBefundBlock(k)).toEqual({ befunde: [{ key: 'bge_152_V_85', grund: 'Akz ✗' }], kaputt: false });
    expect(k.endsWith(fuss)).toBe(true);
    expect(k.startsWith('Kopf\n')).toBe(true);
  });
  it('übergrosser Block ⇒ ersetzt durch unlesbare Marke (nächster Lauf: Entwurf)', () => {
    const riesig = befundBlock(Array.from({ length: 2000 }, (_, i) => ({ key: `k${i}`, grund: 'x'.repeat(30) })));
    const k = kuerzeBody(`Kopf\n${riesig}${fuss}`, null);
    expect(k.length).toBeLessThan(BODY_MAX);
    expect(leseBefundBlock(k)).toEqual({ befunde: null, kaputt: true });
    expect(k.endsWith(fuss)).toBe(true);
  });
  it('CLI schreibt den gekürzten Body, Summary behält den Volltext', () => {
    const cli = readFileSync('scripts/rechtsprechung/wochenlauf.ts', 'utf8');
    expect(cli).toMatch(/writeFileSync\(join\(aus, 'bericht\.md'\), kuerzeBody\(bericht, laufUrl\)\)/);
    expect(cli).toMatch(/baueSummary\(daten, bericht\)/);
  });
});

describe('R3b · PR-Schritt: nie bereit mit neuen Daten und altem Body', () => {
  // Mutation: «gh pr ready --undo» hinter den Push schieben, «--draft» beim Anlegen streichen, oder das
  // abschliessende «gh pr ready» ohne Entscheid-Weiche ⇒ rot. Der Schritt läuft echt in bash gegen Attrappen.
  const wf = parse(readFileSync('.github/workflows/rechtsprechung-wochenlauf.yml', 'utf8')) as {
    jobs: { wochenlauf: { steps: Array<{ name?: string; run?: string }> } };
  };
  const skript = wf.jobs.wochenlauf.steps.find((s) => s.name?.startsWith('PR eröffnen'))!.run!;
  function fahre(env: Record<string, string>, ghFehler = ''): string[] {
    const d = mkdtempSync(join(tmpdir(), 'wl-r3-'));
    const log = join(d, 'log');
    for (const cmd of ['gh', 'git', 'npx']) {
      writeFileSync(join(d, cmd), `#!/bin/bash\necho "${cmd} $*" >> "${log}"\n` +
        (cmd === 'gh' ? `case "$*" in ${ghFehler || '__nie__'}) exit 1;; esac\n[ "$1 $2" = "pr list" ] && echo 41\n` : '') + 'exit 0\n');
      chmodSync(join(d, cmd), 0o755);
    }
    writeFileSync(join(d, 'bericht.md'), 'b'); writeFileSync(join(d, 'commit.txt'), 'c');
    try {
      execFileSync('bash', ['-c', skript], { env: { PATH: `${d}:/usr/bin:/bin`, DATUM: '2026-09-28', BRANCH: 'auto/rechtsprechung-wochenlauf', LEASE: '', NR: '', AUS: d, GITHUB_STEP_SUMMARY: join(d, 's'), ...env }, stdio: 'pipe' });
    } catch { /* Exit ≠ 0 — das Protokoll zeigt, wie weit er kam */ }
    return readFileSync(log, 'utf8').trim().split('\n');
  }
  const pos = (l: string[], re: RegExp) => l.findIndex((x) => re.test(x));
  it('bestehender PR, «pr»: Entwurf → Push → Body → CI → bereit (zuletzt)', () => {
    const l = fahre({ NR: '41', LEASE: 'abc', ENTSCHEID: 'pr' });
    const undo = pos(l, /^gh pr ready 41 --undo$/), push = pos(l, /^git push/), edit = pos(l, /^gh pr edit 41 /), ready = pos(l, /^gh pr ready 41$/);
    expect([undo, push, edit, ready].every((i) => i >= 0)).toBe(true);
    expect(undo).toBeLessThan(push); expect(push).toBeLessThan(edit); expect(edit).toBeLessThan(ready);
    expect(ready).toBe(l.length - 1);
  });
  it('bestehender PR, «entwurf»: bleibt Entwurf', () => {
    const l = fahre({ NR: '41', LEASE: 'abc', ENTSCHEID: 'entwurf' });
    expect(l.filter((x) => /^gh pr ready/.test(x))).toEqual(['gh pr ready 41 --undo']);
  });
  it('Entwurf-Setzen scheitert ⇒ kein Push, kein Body (set -e)', () => {
    const l = fahre({ NR: '41', LEASE: 'abc', ENTSCHEID: 'pr' }, '"pr ready 41 --undo"');
    expect(pos(l, /^git push/)).toBe(-1);
    expect(pos(l, /^gh pr (edit|ready 41$)/)).toBe(-1);
  });
  it('neuer PR: immer --draft, bereit erst am Schluss und nur bei «pr»', () => {
    const l = fahre({ ENTSCHEID: 'pr' });
    expect(l[pos(l, /^gh pr create/)]).toMatch(/--draft/);
    expect(pos(l, /^gh pr ready 41$/)).toBe(l.length - 1);
    const e2 = fahre({ ENTSCHEID: 'entwurf' });
    expect(e2[pos(e2, /^gh pr create/)]).toMatch(/--draft/);
    expect(pos(e2, /^gh pr ready/)).toBe(-1);
  });
  it('strikter Modus bleibt', () => {
    expect(skript).toMatch(/^set -euo pipefail$/m);
  });
});
