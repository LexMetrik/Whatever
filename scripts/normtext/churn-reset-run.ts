// scripts/normtext/churn-reset-run.ts — CLI: setzt geänderte JSON-Dateien zurück, deren einzige
// Abweichung zu HEAD reiner Datums-Churn ist (Logik: churn-reset.ts, §17 Befund (a2)).
//
// Aufruf: npm run normtext:churn-reset [-- --pfad=public/normtext[,public/materialien]] [--trocken]
// Exit 0 immer, wenn die Prüfung selbst lief (das ist ein Aufräumer, kein Tor); Exit 1 nur bei
// git-Fehlern. Ausgabe: je Datei ein Verdikt, am Ende Zähler.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { istReinerDatumsChurn, setzeUnveraenderteEintraegeZurueck } from './churn-reset.ts';

function arg(name: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
}

const pfade = (arg('pfad') ?? 'public/normtext').split(',').map((p) => p.trim()).filter(Boolean);
const trocken = process.argv.includes('--trocken');

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
}

const geaendert = git(['diff', '--name-only', '--diff-filter=M', '--', ...pfade])
  .split('\n').map((s) => s.trim()).filter((s) => s.endsWith('.json'));

let churn = 0;
let substanz = 0;
let eintraege = 0; // je Eintrag zurückgesetzt (Dateien mit Substanz)
const zurueck: string[] = [];
for (const datei of geaendert) {
  let alt: string;
  try {
    alt = git(['show', `HEAD:${datei}`]);
  } catch {
    substanz += 1; // in HEAD unbekannt ⇒ nie zurücksetzen
    continue;
  }
  const neu = readFileSync(datei, 'utf8');
  if (istReinerDatumsChurn(alt, neu)) {
    churn += 1;
    zurueck.push(datei);
  } else {
    substanz += 1;
    // Datei mit Substanz: unveränderte Einträge behalten ihr altes `abgerufen` (je Eintrag).
    const r = setzeUnveraenderteEintraegeZurueck(alt, neu);
    if (r !== null && r.zurueckgesetzt > 0) {
      eintraege += r.zurueckgesetzt;
      if (!trocken) writeFileSync(datei, r.text, 'utf8');
      console.log(`  eintrag  ${datei}: ${r.zurueckgesetzt} unveränderte(r) Eintrag/Einträge${trocken ? ' (trocken)' : ''}`);
    }
  }
}

if (zurueck.length && !trocken) {
  // In Blöcken, damit die Argumentliste nie die Shell-Grenze reisst.
  for (let i = 0; i < zurueck.length; i += 200) {
    git(['checkout', '--', ...zurueck.slice(i, i + 200)]);
  }
}
for (const d of zurueck) console.log(`  churn    ${d}${trocken ? ' (trocken, nicht zurückgesetzt)' : ''}`);
console.log(
  `normtext:churn-reset — ${geaendert.length} geänderte JSON-Datei(en) unter ${pfade.join(', ')}: ` +
  `${churn} reiner Datums-Churn ${trocken ? 'erkannt' : 'zurückgesetzt'}, ${substanz} mit Substanz belassen ` +
  `(darin ${eintraege} unveränderte Einträge je Eintrag ${trocken ? 'erkannt' : 'zurückgesetzt'}).`,
);
