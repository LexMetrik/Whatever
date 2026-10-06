// ─── LIK-Nachzug: CLI des Bot-Tors «nur Anfügung» (MONITOR, 5.10.2026) ───────
//
// Aufruf (aus scripts/lik/nachzug.sh):
//   npx vite-node scripts/lik/vergleich.ts -- <alt.ts> <neu.ts> <xlsx.json> <beleg.md>
// Liest LIK_REIHEN aus beiden TS-Modulen (echter Modul-Import, keine Textsuche),
// die unabhängige Neu-Einlesung aus <xlsx.json>, schreibt den Beleg-Abschnitt nach
// <beleg.md> und gibt `status=keine|anfuegung|pruefen` (+ Zählwerte) aus — auf
// stdout und, falls gesetzt, nach $GITHUB_OUTPUT. Exit ≠ 0 nur bei Lesefehlern.

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { belegMarkdown, vergleicheLik, type Reihen } from './vergleich-kern';

async function reihenAus(pfad: string): Promise<Reihen> {
  const mod = (await import(pathToFileURL(resolve(pfad)).href)) as { LIK_REIHEN?: Reihen };
  if (!mod.LIK_REIHEN) throw new Error(`${pfad}: Export LIK_REIHEN fehlt`);
  return mod.LIK_REIHEN;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  if (args.length !== 4) throw new Error('Aufruf: vergleich.ts <alt.ts> <neu.ts> <xlsx.json> <beleg.md>');
  const [altPfad, neuPfad, jsonPfad, mdPfad] = args;
  const alt = await reihenAus(altPfad);
  const neu = await reihenAus(neuPfad);
  const xlsx = (JSON.parse(readFileSync(jsonPfad, 'utf8')) as { reihen: Reihen }).reihen;
  const v = vergleicheLik(alt, neu, xlsx);
  writeFileSync(mdPfad, belegMarkdown(v, xlsx) + '\n');
  const aus = [
    `status=${v.status}`,
    `angefuegt=${v.angefuegt.length}`,
    `geaendert=${v.geaendert.length}`,
    `entfernt=${v.entfernt.length}`,
    `abweichungen=${v.gegenlesung.abweichungen.length}`,
    `geprueft=${v.gegenlesung.geprueft}`,
  ];
  console.log(aus.join('\n'));
  for (const g of v.gruende) console.log(`grund: ${g}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, aus.join('\n') + '\n');
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(2);
});
