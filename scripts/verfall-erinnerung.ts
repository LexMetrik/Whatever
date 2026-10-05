// ─── Verfall-Erinnerung (CLI): Auswahl + Zettel-Text für den Workflow ─────────
//
//   npm run report:verfall-erinnerung -- [--stichtag=YYYY-MM-DD] [--out=VERZEICHNIS]
//
// Liest bibliothek/register/parameter-verfall.md, wählt Einträge mit Termin
// ≤ VORLAUF_TAGE (45) oder überschritten und schreibt nach --out (Default
// .gate/verfall-erinnerung):
//   auswahl.json  maschinenlesbar (Stichtag, ueberschritten[], bald[])
//   zettel.md     Zettel-Text (Markdown)
//   zettel-titel.txt
// Bei $GITHUB_OUTPUT: faellig=<Anzahl bald+überschritten>, ueberschritten=<Anzahl>.
//
// Exit 0 IMMER, auch bei überschrittenen Terminen: eine Erinnerung färbt nie rot
// (Entscheid David 5./6.10.2026; das Tor mit Exit 1 bleibt `check:verfall`).
// Exit 1 nur bei kaputtem Skript/Register (ungültiger Stichtag, Register fehlt,
// kein einziger Termin gelesen) — sonst bliebe der Ausfall der Erinnerung unbemerkt.
//
// Tagesbezug: nur HIER (Betriebs-Werkzeug, wie verfall-pruefen.ts); die Logik in
// verfall-erinnerung-kern.ts bekommt den Stichtag als Parameter (§2).
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { iso, sammleTermine, VORLAUF_TAGE } from './verfall-parse.ts';
import { waehleErinnerungen, zettelText, zettelTitel } from './verfall-erinnerung-kern.ts';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTER_PFAD = 'bibliothek/register/parameter-verfall.md';

function arg(name: string): string | undefined {
  const pre = `--${name}=`;
  return process.argv.find((a) => a.startsWith(pre))?.slice(pre.length);
}

function fehler(msg: string): never {
  console.error(`verfall-erinnerung: ${msg}`);
  process.exit(1);
}

const jetzt = new Date();
const stichtag = arg('stichtag') ?? iso(jetzt.getFullYear(), jetzt.getMonth() + 1, jetzt.getDate());
if (!/^\d{4}-\d{2}-\d{2}$/.test(stichtag)) fehler(`--stichtag muss YYYY-MM-DD sein, war «${stichtag}»`);
const out = resolve(arg('out') ?? join(WURZEL, '.gate/verfall-erinnerung'));

let md: string;
try {
  md = readFileSync(join(WURZEL, REGISTER_PFAD), 'utf8');
} catch (e) {
  fehler(`Register nicht lesbar: ${(e as Error).message}`);
}
const { termine } = sammleTermine(md);
if (termine.length === 0) fehler('Register lieferte 0 terminierte Einträge — Parser oder Register kaputt');

const auswahl = waehleErinnerungen(termine, stichtag, VORLAUF_TAGE);
const repo = process.env.GITHUB_REPOSITORY;
const text = zettelText(auswahl, {
  registerPfad: REGISTER_PFAD,
  registerMd: md,
  repoUrl: repo ? `${process.env.GITHUB_SERVER_URL ?? 'https://github.com'}/${repo}` : undefined,
});

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'auswahl.json'), JSON.stringify(auswahl, null, 2) + '\n');
writeFileSync(join(out, 'zettel.md'), text);
writeFileSync(join(out, 'zettel-titel.txt'), zettelTitel(auswahl) + '\n');

const faellig = auswahl.bald.length + auswahl.ueberschritten.length;
console.log(`Verfall-Erinnerung (Stichtag ${stichtag}): ${termine.length} Termine gelesen, ${auswahl.bald.length} in ≤ ${VORLAUF_TAGE} Tagen, ${auswahl.ueberschritten.length} überschritten → ${out}`);
for (const f of [...auswahl.ueberschritten, ...auswahl.bald]) {
  console.log(`  ${f.tage < 0 ? 'ÜBERSCHRITTEN' : 'fällig      '} ${f.termin.datum} (${f.tage} T)  ${f.termin.label.slice(0, 80)}`);
}
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `faellig=${faellig}\nueberschritten=${auswahl.ueberschritten.length}\n`);
}
