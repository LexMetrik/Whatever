// scripts/check-fachaenderung.ts — Fachänderungs-Riegel (RL-03, 23.9.2026),
// Nachfolger von check:testtreue. Regeln/Heuristik/Grenzen: analyse/fachaenderung-kern.ts.
// Bereich wie check-merge-schutz.ts (merge-base..KOPF, kein stiller Skip).
// Trailer: mit auffindbarem PR (--pr, FACHAENDERUNG_PR, Branch) dessen
// Queue-Squash (Titel+Body), sonst die Commits im Bereich.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  type CommitInfo, GOLDEN, FACHAENDERUNG_KOPF, bewerte, entfernteRisikoAssertions, istAssertionTest,
  prTitelAusEreignis,
} from './analyse/fachaenderung-kern';
import { leseTrailerAusRohLog, leseTrailerAusSquash } from './gegenpruefung/squash-trailer';
import { baueQueueSquash, holePrKoerperEcht } from './gegenpruefung/pr-schutz';

const BASIS = process.env.FACHAENDERUNG_BASIS ?? 'origin/main';
const KOPF = process.env.FACHAENDERUNG_KOPF ?? 'HEAD';

function git(args: string[]): string {
  return execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024 }).toString('utf8');
}
const zeilen = (s: string): string[] => s.split('\n').map((z) => z.trim()).filter(Boolean);

let basis = '';
try {
  basis = git(['merge-base', BASIS, KOPF]).trim();
} catch {
  console.log(`check:fachaenderung ROT — Referenz '${BASIS}' nicht auflösbar. Erst 'git fetch origin', dann erneut.`);
  process.exit(1);
}
const bereich = `${basis}..${KOPF}`;

const commits: CommitInfo[] = zeilen(git(['rev-list', bereich])).map((sha) => ({
  sha,
  betreff: git(['log', '-1', '--format=%s', sha]).trim(),
  dateien: zeilen(git(['diff-tree', '--no-commit-id', '--name-only', '-r', sha])),
}));

// --no-renames: Umzug = Löschen + Anlegen; der Kern poolt je Engine.
const geaendert = zeilen(git(['diff', '--no-renames', '--name-only', bereich]));
const baum = (ref: string) => new Set(zeilen(git(['ls-tree', '-r', '--name-only', ref])));
const baumAlt = baum(basis);
const baumNeu = baum(KOPF);
const lies = (ref: string, b: Set<string>, p: string) => (b.has(p) ? git(['show', `${ref}:${p}`]) : null);
const staende = geaendert.filter(istAssertionTest).map((datei) => ({
  datei, alt: lies(basis, baumAlt, datei), neu: lies(KOPF, baumNeu, datei),
}));
const engineBefunde = entfernteRisikoAssertions(staende, (p) => baumAlt.has(p), (p) => baumNeu.has(p));

const argPr = process.argv.indexOf('--pr');
const pr = holePrKoerperEcht((argPr >= 0 ? process.argv[argPr + 1] : process.env.FACHAENDERUNG_PR) || undefined);
const trailer = pr
  ? leseTrailerAusSquash(baueQueueSquash(pr.titel, pr.body), FACHAENDERUNG_KOPF)
  : [...new Set([
      ...zeilen(git(['log', '--format=%(trailers:key=Fachaenderung,valueonly)', bereich])),
      ...leseTrailerAusRohLog(git(['log', '--format=%B%x00', bereich]), FACHAENDERUNG_KOPF),
    ])];

const urteil = bewerte({
  commits,
  engineBefunde,
  goldenGeaendert: geaendert.includes(GOLDEN),
  trailer,
  quelle: pr ? `PR #${pr.nummer}, Queue-Squash aus Titel+Body` : `Commits ${basis.slice(0, 8)}..${KOPF}`,
  // R1-Squash (#1026/#1023): nur im pull_request-Lauf aus dem Ereignis.
  prTitel: prTitelAusEreignis(process.env, (p) => readFileSync(p, 'utf8')),
});
console.log(urteil.text);
process.exit(urteil.rot ? 1 : 0);
