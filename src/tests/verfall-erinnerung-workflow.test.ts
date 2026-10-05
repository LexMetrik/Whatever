// Zettel-Logik von .github/workflows/verfall-erinnerung.yml — der run-Block des Schritts
// «Zettel pflegen» läuft hier gegen ein Ersatz-`gh` (Shell-Stub). Bewiesen wird:
// anlegen / aktualisieren / schliessen / nichts, und FAIL-SAFE: scheitert gh ⇒ Exit 1
// (sonst merkt niemand, dass die Erinnerung ausfällt). Die Fälligkeit selbst färbt nie rot.
import { describe, it, expect, beforeAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const WORKFLOW = resolve(__dirname, '../../.github/workflows/verfall-erinnerung.yml');

/** run-Block des Schritts mit dem gegebenen Namens-Anfang, entrückt (ohne js-yaml-Abhängigkeit). */
function runBlock(yml: string, schrittName: string): string {
  const zeilen = yml.split('\n');
  const i = zeilen.findIndex((z) => z.includes(`- name: ${schrittName}`));
  if (i < 0) throw new Error(`Schritt «${schrittName}» fehlt`);
  const r = zeilen.findIndex((z, k) => k > i && /^\s+run: \|\s*$/.test(z));
  if (r < 0) throw new Error('run-Block fehlt');
  const einzug = zeilen[r].match(/^\s*/)![0].length;
  const block: string[] = [];
  for (let k = r + 1; k < zeilen.length; k++) {
    const z = zeilen[k];
    if (z.trim() !== '' && z.match(/^\s*/)![0].length <= einzug) break;
    block.push(z.slice(einzug + 2));
  }
  return block.join('\n') + '\n';
}

let dir: string;
let block: string;

beforeAll(() => {
  block = runBlock(readFileSync(WORKFLOW, 'utf8'), 'Zettel pflegen');
  dir = mkdtempSync(join(tmpdir(), 've-wf-'));
  mkdirSync(join(dir, 'bin'));
  mkdirSync(join(dir, 'out'));
  writeFileSync(join(dir, 'out/zettel.md'), 'Zettel-Text\n');
  writeFileSync(join(dir, 'out/zettel-titel.txt'), 'Verfall-Erinnerung (2026-10-06): 3 Termine in ≤ 45 Tagen, 0 überschritten\n');
  // Ersatz-gh: protokolliert jeden Aufruf; GH_NR = Nummer des offenen Zettels (leer = keiner);
  // GH_FAIL = Unterbefehl, der scheitern soll (api | label | issue-create | issue-edit | issue-close).
  writeFileSync(
    join(dir, 'bin/gh'),
    `#!/usr/bin/env bash
echo "gh $*" >> "$GH_LOG"
case "$1" in
  api) [ "\${GH_FAIL:-}" = api ] && exit 1; printf '%s' "\${GH_NR:-}";;
  label) [ "\${GH_FAIL:-}" = label ] && exit 1;;
  issue) [ "\${GH_FAIL:-}" = "issue-$2" ] && exit 1;;
esac
exit 0
`,
  );
  chmodSync(join(dir, 'bin/gh'), 0o755);
});

function fahre(env: Record<string, string>) {
  const log = join(dir, `gh-${Math.random().toString(36).slice(2)}.log`);
  const r = spawnSync('bash', ['-c', block], {
    encoding: 'utf8',
    env: {
      PATH: `${join(dir, 'bin')}:${process.env.PATH}`,
      GH_LOG: log,
      GITHUB_REPOSITORY: 'o/r',
      GH_TOKEN: 'x',
      RUN_URL: 'https://example.invalid/run/1',
      OUT: join(dir, 'out'),
      ...env,
    },
  });
  const aufrufe = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean) : [];
  return { status: r.status, out: r.stdout + r.stderr, aufrufe };
}
const hat = (aufrufe: string[], teil: string) => aufrufe.some((a) => a.includes(teil));

describe('Zettel pflegen — Normalfälle (alle Exit 0, nie Rot wegen Fälligkeit)', () => {
  it('fällig, kein Zettel offen ⇒ Label sicherstellen, dann Zettel anlegen', () => {
    const r = fahre({ FAELLIG: '3', GH_NR: '' });
    expect(r.status).toBe(0);
    const iLabel = r.aufrufe.findIndex((a) => a.startsWith('gh label create erinnerung:verfall'));
    const iNeu = r.aufrufe.findIndex((a) => a.startsWith('gh issue create --label erinnerung:verfall'));
    expect(iLabel).toBeGreaterThan(-1);
    expect(iNeu).toBeGreaterThan(iLabel);
    expect(hat(r.aufrufe, '--body-file')).toBe(true);
  });
  it('fällig, Zettel #42 offen ⇒ Text aktualisieren, kein zweiter Zettel', () => {
    const r = fahre({ FAELLIG: '3', GH_NR: '42' });
    expect(r.status).toBe(0);
    expect(hat(r.aufrufe, 'gh issue edit 42 --title')).toBe(true);
    expect(hat(r.aufrufe, 'issue create')).toBe(false);
  });
  it('nichts fällig, Zettel #42 offen ⇒ schliessen mit Kommentar', () => {
    const r = fahre({ FAELLIG: '0', GH_NR: '42' });
    expect(r.status).toBe(0);
    expect(hat(r.aufrufe, 'gh issue close 42 --reason completed --comment')).toBe(true);
  });
  it('nichts fällig, kein Zettel ⇒ nur die Abfrage, keine Schreib-Aufrufe', () => {
    const r = fahre({ FAELLIG: '0', GH_NR: '' });
    expect(r.status).toBe(0);
    expect(r.aufrufe.every((a) => a.startsWith('gh api '))).toBe(true);
  });
  it('Abfrage filtert auf Label und Bot-Autor (findet nur den eigenen Zettel)', () => {
    const r = fahre({ FAELLIG: '0', GH_NR: '' });
    expect(r.aufrufe[0]).toContain('labels=erinnerung:verfall');
    expect(r.aufrufe[0]).toContain('creator=github-actions%5Bbot%5D');
  });
});

describe('Zettel pflegen — fail-safe: scheitert die Pflege, wird der Lauf ROT', () => {
  for (const [fall, env, fail] of [
    ['Abfrage', { FAELLIG: '3', GH_NR: '' }, 'api'],
    ['Anlegen', { FAELLIG: '3', GH_NR: '' }, 'issue-create'],
    ['Aktualisieren', { FAELLIG: '3', GH_NR: '42' }, 'issue-edit'],
    ['Schliessen', { FAELLIG: '0', GH_NR: '42' }, 'issue-close'],
  ] as const) {
    it(`gh ${fall} scheitert ⇒ Exit 1 mit ::error::`, () => {
      const r = fahre({ ...env, GH_FAIL: fail });
      expect(r.status).toBe(1);
      expect(r.out).toContain('::error::');
    });
  }
  it('Label-Anlage scheitert, Zettel-Anlage geht (Label existiert schon) ⇒ grün', () => {
    expect(fahre({ FAELLIG: '3', GH_NR: '', GH_FAIL: 'label' }).status).toBe(0);
  });
  it('Auswahl-Schritt lieferte keine Anzahl ⇒ Exit 1 (kein stilles Nichtstun)', () => {
    const r = fahre({ FAELLIG: '', GH_NR: '' });
    expect(r.status).toBe(1);
    expect(r.aufrufe).toHaveLength(0);
  });
});

describe('Workflow-Rahmen', () => {
  const yml = readFileSync(WORKFLOW, 'utf8');
  it('wöchentlich + manuell, Zettel-Recht issues: write, Zürcher Kalendertag', () => {
    expect(yml).toMatch(/cron: '\d+ \d+ \* \* 1'/);
    expect(yml).toContain('workflow_dispatch:');
    expect(yml).toContain('issues: write');
    expect(yml).toContain('TZ: Europe/Zurich');
  });
  it('kein Rot-Label und kein Rot-Symbol im Zettel-Workflow', () => {
    expect(yml).not.toMatch(/🔴|--color (FF0000|D73A4A|B60205)/iu);
  });
});
