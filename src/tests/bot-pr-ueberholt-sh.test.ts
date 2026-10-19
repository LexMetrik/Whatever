// src/tests/bot-pr-ueberholt-sh.test.ts — scripts/ci/bot-pr-ueberholt.sh gegen eine gh-Attrappe.
// Anlass: Gegenprüfung 19.10.2026 (PRUEF-AUTOMATIK), Auflage 2: (a) Präfix-Treffer nur für Bot-Zweige
// `<präfix><Datum>`, nicht `chore/lik-nachzug-fix`; (b) geschont wird, wo schon gearbeitet wird
// (Label, Fremd-Commit, Verdikt, Kommentar) — sinngemäss inPruefung() aus wochenlauf-kern.ts;
// (c) ein scheiternder `gh pr list` ist nie fatal.
// Shell-Muster wie fedlex-cache-sh.test.ts: `gh` ist ein Stub im PATH, kein Netz; `jq` ist echt.
// Entscheid: Logik bleibt im Shell-Skript (sie ruft gh/jq selbst auf), getestet über die Stub-Grenze,
// statt eine TS-Funktion daneben zu pflegen, die das Skript nicht benutzt (§5: eine Quelle).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SKRIPT = join(process.cwd(), 'scripts/ci/bot-pr-ueberholt.sh');
const PRAEFIX = 'chore/fedlex-frische-';
const BOT = 'fedlex-frische-bot';
const NEU = 'chore/fedlex-frische-2026-10-19';

const GH_STUB = `#!/bin/sh
# Attrappe: antwortet aus $STUB_DIR; jede Anfrage wird protokolliert.
echo "$*" >> "$STUB_DIR/aufrufe.log"
case "$1 $2" in
  "pr list")  [ -n "$STUB_LISTFAIL" ] && exit 1; cat "$STUB_DIR/list.json"; exit 0 ;;
  "pr view")  [ -f "$STUB_DIR/view-$3.fail" ] && exit 1; cat "$STUB_DIR/view-$3.json"; exit 0 ;;
  "pr close") echo "$3" >> "$STUB_DIR/closed.log"; exit 0 ;;
  "api --paginate")
    f=$(echo "$3" | sed -E 's#repos/\\{owner\\}/\\{repo\\}/##; s#/#-#g')
    [ -f "$STUB_DIR/api-$f.json" ] && cat "$STUB_DIR/api-$f.json" || echo '[]'
    exit 0 ;;
esac
exit 1
`;

let wurzel: string;
let n = 0;

beforeAll(() => {
  wurzel = mkdtempSync(join(tmpdir(), 'bot-pr-ueberholt-'));
  mkdirSync(join(wurzel, 'bin'));
  writeFileSync(join(wurzel, 'bin', 'gh'), GH_STUB, 'utf8');
  chmodSync(join(wurzel, 'bin', 'gh'), 0o755);
});
afterAll(() => rmSync(wurzel, { recursive: true, force: true }));

type Commit = { autor?: string; committer?: string; text?: string };
type Pr = {
  nr: number;
  zweig: string;
  labels?: string[];
  body?: string;
  commits?: Commit[];
  kommentare?: Array<{ typ: string; login: string }>;
  reviews?: Array<{ typ: string; login: string }>;
  viewFail?: boolean;
};

/** Legt die Fixtures an und fährt das Skript; liefert Exit, Ausgabe und die geschlossenen PR-Nummern. */
function lauf(prs: Pr[], opts: { listFail?: boolean; praefix?: string; neu?: string; bot?: string } = {}) {
  const bot = opts.bot ?? BOT;
  const dir = join(wurzel, `fall-${n++}`);
  mkdirSync(dir);
  writeFileSync(join(dir, 'list.json'), JSON.stringify(prs.map((p) => ({ number: p.nr, headRefName: p.zweig }))));
  for (const p of prs) {
    writeFileSync(join(dir, `view-${p.nr}.json`), JSON.stringify({ body: p.body ?? 'Automatischer Lauf.', labels: (p.labels ?? []).map((name) => ({ name })) }));
    if (p.viewFail) writeFileSync(join(dir, `view-${p.nr}.fail`), '');
    const commits = (p.commits ?? [{}]).map((c) => ({
      commit: {
        author: { name: c.autor ?? bot },
        committer: { name: c.committer ?? bot },
        message: c.text ?? 'chore: Lauf\n\nGegenpruefung: ausstehend — Bot-PR, Session prüft',
      },
    }));
    writeFileSync(join(dir, `api-pulls-${p.nr}-commits.json`), JSON.stringify(commits));
    writeFileSync(join(dir, `api-issues-${p.nr}-comments.json`), JSON.stringify((p.kommentare ?? []).map((k) => ({ user: { type: k.typ, login: k.login } }))));
    writeFileSync(join(dir, `api-pulls-${p.nr}-reviews.json`), JSON.stringify((p.reviews ?? []).map((k) => ({ user: { type: k.typ, login: k.login } }))));
  }
  const r = spawnSync('bash', [SKRIPT, opts.praefix ?? PRAEFIX, opts.neu ?? NEU, '1500'], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${join(wurzel, 'bin')}:${process.env.PATH}`, STUB_DIR: dir, ...(opts.listFail ? { STUB_LISTFAIL: '1' } : {}) },
  });
  const log = join(dir, 'closed.log');
  const zu = existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter(Boolean).map(Number) : [];
  return { status: r.status, out: (r.stdout ?? '') + (r.stderr ?? ''), zu };
}

describe('bot-pr-ueberholt.sh — Zweig-Treffer', () => {
  it('schliesst den unberührten älteren Bot-PR (ISO-Datum und Monat), nie den neuen Zweig oder jüngere', () => {
    const r = lauf([
      { nr: 10, zweig: 'chore/fedlex-frische-2026-10-12' },
      { nr: 11, zweig: 'chore/fedlex-frische-2026-09' },
      { nr: 12, zweig: NEU },
      { nr: 13, zweig: 'chore/fedlex-frische-2026-10-26' },
    ]);
    expect(r.status).toBe(0);
    expect(r.zu.sort()).toEqual([10, 11]);
  });

  it('Handzweig mit gleichem Präfix wird NICHT getroffen (chore/lik-nachzug-fix)', () => {
    const r = lauf(
      [
        { nr: 20, zweig: 'chore/lik-nachzug-fix' },
        { nr: 21, zweig: 'chore/lik-nachzug-2026-08' },
        { nr: 22, zweig: 'chore/lik-nachzug-2026-08-extra' },
        { nr: 23, zweig: 'chore/lik-nachzug-2026-8' },
      ],
      { praefix: 'chore/lik-nachzug-', neu: 'chore/lik-nachzug-2026-09', bot: 'lik-nachzug-bot' },
    );
    expect(r.zu).toEqual([21]);
  });

  it('fremdes Präfix bleibt unberührt', () => {
    expect(lauf([{ nr: 30, zweig: 'chore/curia-monatslauf-2026-09-01' }]).zu).toEqual([]);
  });
});

describe('bot-pr-ueberholt.sh — Schon-Regeln (sinngemäss inPruefung)', () => {
  const alt = (extra: Partial<Pr>): Pr => ({ nr: 40, zweig: 'chore/fedlex-frische-2026-10-05', ...extra });

  it('Kontrolle: ohne jede Spur wird geschlossen — auch ein Draft ohne Label', () => {
    expect(lauf([alt({})]).zu).toEqual([40]);
  });
  it('Label in-pruefung ⇒ geschont', () => {
    const r = lauf([alt({ labels: ['in-pruefung'] })]);
    expect(r.zu).toEqual([]);
    expect(r.out).toContain('Label in-pruefung');
  });
  it('anderes Label ⇒ kein Schutz', () => {
    expect(lauf([alt({ labels: ['automerge'] })]).zu).toEqual([40]);
  });
  it('Commit eines anderen Autors ⇒ geschont', () => {
    const r = lauf([alt({ commits: [{}, { autor: 'David Graf' }] })]);
    expect(r.zu).toEqual([]);
    expect(r.out).toContain('fremder Commit');
  });
  it('Committer «GitHub» (Web-Edit/Update-Branch) ⇒ geschont', () => {
    expect(lauf([alt({ commits: [{ committer: 'GitHub' }] })]).zu).toEqual([]);
  });
  it('Verdikt im PR-Text ⇒ geschont; «ausstehend» zählt nicht', () => {
    expect(lauf([alt({ body: 'Text\n\nGegenpruefung: bestanden (Opus, Daten) — Stichprobe ok' })]).zu).toEqual([]);
    expect(lauf([alt({ body: 'Text\n\nGegenpruefung: ausstehend — Session prüft' })]).zu).toEqual([40]);
  });
  it('Verdikt in einer Commit-Message ⇒ geschont', () => {
    expect(lauf([alt({ commits: [{ text: 'fix: x\n\nGegenpruefung: behoben (Opus, Daten) — 2 Befunde' }] })]).zu).toEqual([]);
  });
  it('Kommentar oder Review eines Menschen ⇒ geschont; Kommentar eines Bots nicht', () => {
    expect(lauf([alt({ kommentare: [{ typ: 'User', login: 'david' }] })]).zu).toEqual([]);
    expect(lauf([alt({ reviews: [{ typ: 'User', login: 'david' }] })]).zu).toEqual([]);
    expect(lauf([alt({ kommentare: [{ typ: 'Bot', login: 'vercel[bot]' }] })]).zu).toEqual([40]);
  });
  it('Lage des PR nicht lesbar ⇒ geschont (nie im Zweifel schliessen); die anderen PRs laufen weiter', () => {
    const r = lauf([alt({ viewFail: true }), { nr: 41, zweig: 'chore/fedlex-frische-2026-10-06' }]);
    expect(r.zu).toEqual([41]);
    expect(r.out).toContain('PR-Lage nicht lesbar');
  });
});

describe('bot-pr-ueberholt.sh — Fehlerpfad', () => {
  it('gh pr list scheitert ⇒ Warnung, Exit 0, nichts geschlossen', () => {
    const r = lauf([{ nr: 50, zweig: 'chore/fedlex-frische-2026-10-05' }], { listFail: true });
    expect(r.status).toBe(0);
    expect(r.out).toContain('::warning::');
    expect(r.zu).toEqual([]);
  });
});
