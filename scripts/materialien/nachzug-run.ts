// scripts/materialien/nachzug-run.ts — dünner CLI-Runner des Materialien-Nachzug-Bots
// (Kern + Begründungen: nachzug.ts). Aufrufer: .github/workflows/materialien-nachzug.yml.
//
// Aufruf: npm run materialien:nachzug -- --datum=$(date +%F) [--quellen=seco,estv-mwst]
// Ausgaben: Schlüssel status/quellen/widerspruch/hinweise auf stdout und nach $GITHUB_OUTPUT;
// PR-Text nach $NACHZUG_TMP/pr-body.md (Default .gate/materialien-nachzug, gitignoriert).
// Exit 1 = Werkzeugfehler (Lauf rot). Drift, Hinweise und «nichts zu tun» = Exit 0.
// KEIN lokaler Voll-Lauf nötig, um die Logik zu prüfen: src/tests/materialien-nachzug.test.ts.
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ZUSTAND_PFAD } from './soft-law-zustand.ts';
import { ERLAUBTE_PFADE, Werkzeugfehler, nachzug, parseQuellenFilter, prText, type Werkzeuge } from './nachzug.ts';

function arg(name: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
}

function git(args: string[]): string {
  const r = spawnSync('git', ['-c', 'core.quotePath=false', ...args], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) throw new Werkzeugfehler(`git ${args.join(' ')} rot (Exit ${r.status}): ${r.stderr}`);
  return r.stdout;
}

const werkzeuge: Werkzeuge = {
  npm(skript, args, erfasst = false) {
    const voll = ['run', skript, ...(args.length ? ['--', ...args] : [])];
    if (!erfasst) {
      const r = spawnSync('npm', voll, { stdio: 'inherit', env: process.env });
      return { status: r.status ?? 1, ausgabe: '' };
    }
    const r = spawnSync('npm', voll, { encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024 });
    process.stdout.write(r.stdout ?? '');
    process.stderr.write(r.stderr ?? '');
    return { status: r.status ?? 1, ausgabe: `${r.stdout ?? ''}\n${r.stderr ?? ''}` };
  },
  gitStatus: () => git(['status', '--porcelain=v1', '-uall']),
  zustandHead: () => git(['show', `HEAD:${ZUSTAND_PFAD}`]),
  zustandArbeitsbaum: () => readFileSync(ZUSTAND_PFAD, 'utf8'),
  verwerfe() {
    git(['checkout', 'HEAD', '--', ...ERLAUBTE_PFADE]);
    git(['clean', '-fdq', '--', ...ERLAUBTE_PFADE]);
  },
  log: (s) => console.log(s),
  warnung: (s) => console.log(`::warning::${s.replace(/\n/g, ' ')}`),
};

function ausgabe(schluessel: string, wert: string): void {
  console.log(`${schluessel}=${wert}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${schluessel}=${wert}\n`);
}

try {
  const datum = arg('datum') ?? '';
  const filter = parseQuellenFilter(arg('quellen'));
  const e = nachzug(datum, filter, werkzeuge);
  const tmp = process.env.NACHZUG_TMP || join('.gate', 'materialien-nachzug');
  mkdirSync(tmp, { recursive: true });
  if (e.status !== 'keine') writeFileSync(join(tmp, 'pr-body.md'), prText(e, datum), 'utf8');
  ausgabe('status', e.status);
  ausgabe('quellen', e.quellen.join(','));
  ausgabe('widerspruch', e.widerspruch.join(','));
  ausgabe('hinweise', String(e.hinweise.length));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### Materialien-Nachzug ${datum}\n\nStatus **${e.status}** · Quellen: ${e.quellen.join(', ') || '—'} · ` +
        `Hinweise: ${e.hinweise.length} · Widerspruch: ${e.widerspruch.join(', ') || '—'}\n` +
        (e.hinweise.length ? '\n' + e.hinweise.map((h) => `- ${h.text}`).join('\n') + '\n' : ''),
    );
  }
} catch (err) {
  const m = (err as Error).message;
  console.error(`::error::materialien:nachzug — ${err instanceof Werkzeugfehler ? 'Werkzeugfehler' : 'Absturz'}: ${m.replace(/\n/g, ' ')}`);
  process.exit(1);
}
