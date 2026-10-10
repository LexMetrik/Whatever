// scripts/check-deckel.ts — check:deckel: Nachwachs-Sperre für Nicht-Produkt-Text.
// Summiert die Wörter der Fläche (check-deckel-kern.ts) und hält sie gegen
// messwerte/deckel.json. Die Grenze darf gegenüber origin/main nur sinken.
//   npm run check:deckel                 Tor
//   npm run deckel -- --stand            Summe, Grenze, Luft, Top 10
//   npm run deckel -- --nachziehen       Grenze = Ist + 5 % (nur senkend)
//   --basis <ref>                        Vergleichsstand (Diagnose, Rot-Beweis)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  DECKEL_DATEI, FLAECHEN, istDeckelFlaeche, klinkeUrteil, nachziehen, woerter, type Deckel,
} from './check-deckel-kern';

const git = (...a: string[]): string => execFileSync('git', a, {
  encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
});
const args = process.argv.slice(2);
const wunsch = args.includes('--basis') ? args[args.indexOf('--basis') + 1] : null;

function basisRef(): string | null {
  for (const ref of wunsch ? [wunsch] : ['origin/main', 'main']) {
    try { git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`); return ref; } catch { /* weiter */ }
  }
  return null;
}

function istStand(): Map<string, number> {
  const m = new Map<string, number>();
  for (const pfad of git('ls-files', '--cached', '--others', '--exclude-standard').split('\n')) {
    if (!pfad || m.has(pfad) || !istDeckelFlaeche(pfad) || !existsSync(pfad)) continue;
    m.set(pfad, woerter(readFileSync(pfad, 'utf8')));
  }
  return m;
}

function woerterBei(ref: string, pfad: string): number {
  try { return woerter(git('show', `${ref}:${pfad}`)); } catch { return 0; }
}

function basisDeckel(ref: string | null): Deckel | null {
  if (!ref) return null;
  try { return JSON.parse(git('show', `${ref}:${DECKEL_DATEI}`)) as Deckel; } catch { return null; }
}

const stand = istStand();
const ist = [...stand.values()].reduce((s, n) => s + n, 0);
const ref = basisRef();
const basis = basisDeckel(ref);
const lokal: Deckel | null = existsSync(DECKEL_DATEI)
  ? (JSON.parse(readFileSync(DECKEL_DATEI, 'utf8')) as Deckel) : null;

if (args.includes('--nachziehen')) {
  const neu = nachziehen(ist, lokal?.grenze_woerter ?? null);
  if (neu === null) {
    console.log(`deckel: nichts nachzuziehen — Ist ${ist} + 5 % senkt die Grenze ${lokal?.grenze_woerter} nicht.`);
  } else {
    const heute = new Date().toISOString().slice(0, 10);
    const d: Deckel = { grenze_woerter: neu, gesetzt: `${heute}: Ist ${ist} + 5 %`, flaechen: FLAECHEN };
    writeFileSync(DECKEL_DATEI, `${JSON.stringify(d, null, 2)}\n`);
    console.log(`deckel: Grenze ${lokal?.grenze_woerter ?? '(neu)'} → ${neu} Wörter (Ist ${ist}).`);
  }
  process.exit(0);
}

if (args.includes('--stand')) {
  const g = lokal?.grenze_woerter ?? 0;
  console.log(`Nicht-Produkt-Text: ${ist} Wörter in ${stand.size} Dateien · Grenze ${g} · Luft ${g - ist}`);
  for (const [p, n] of [...stand].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`  ${String(n).padStart(7)}  ${p}`);
  }
  process.exit(0);
}

if (!lokal) {
  console.error(`check:deckel ROT: ${DECKEL_DATEI} fehlt — anlegen mit \`npm run deckel -- --nachziehen\`.`);
  process.exit(1);
}
const klinke = klinkeUrteil(lokal, basis);
const ueber = ist > lokal.grenze_woerter;
if (!ueber && !klinke) {
  console.log(`check:deckel OK — Nicht-Produkt-Text ${ist} Wörter von ${lokal.grenze_woerter} ` +
    `(Luft ${lokal.grenze_woerter - ist})${basis ? '' : ` — Klinke ungeprüft: kein ${DECKEL_DATEI} auf ${ref ?? 'Basis'}`}.`);
  process.exit(0);
}
console.error('check:deckel ROT:');
if (ueber) {
  console.error(`  Nicht-Produkt-Text ${ist} Wörter > Grenze ${lokal.grenze_woerter} (+${ist - lokal.grenze_woerter}).`);
  if (ref) {
    const geaendert = new Set([...git('diff', '--name-only', ref).split('\n'),
      ...git('ls-files', '--others', '--exclude-standard').split('\n')]);
    const zu = [...geaendert].filter((p) => stand.has(p))
      .map((p) => [p, (stand.get(p) ?? 0) - woerterBei(ref, p)] as const)
      .filter(([, d]) => d > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (zu.length) console.error(`  Grösste Zuwächse gegenüber ${ref}:`);
    for (const [p, d] of zu) console.error(`    +${String(d).padStart(6)}  ${p}`);
  }
}
if (klinke) console.error(`  SPERRKLINKE: ${klinke}`);
console.error('  → erst streichen, dann hinzufügen.');
process.exit(1);
