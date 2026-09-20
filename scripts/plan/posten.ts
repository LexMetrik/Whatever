// scripts/plan/posten.ts — CLI des Posten-Modells (`npm run plan:posten`).
//
// Reine Hülle über scripts/plan/postenKern.ts. Die Trennung ist keine Stilfrage:
// den Kern importieren check.ts (Regel 16), next.ts (Posten-Zeile) und die
// beiden Lagebild-Erzeuger. Läge der CLI-Block in derselben Datei, liefe er bei
// JEDEM dieser Importe mit — gemessen 20.9.2026 im ersten Rot-Lauf der Regel 16:
// `npm run check:plan` druckte ein fremdes «Keine offenen Posten.» in seine
// Ausgabe. Ein Einstiegs-Test über `process.argv[1]` hilft nicht, weil vite-node
// dort seinen eigenen Binärpfad führt, nicht das Skript (nachgemessen ebd.).
// Dieselbe Trennung tragen retro-17.ts/retro17Kern.ts und
// selbstopt-erheben.ts/selbstoptKern.ts.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseRoadmap } from './parse';
import {
  CHRONIK,
  POSTEN_ARCHIV,
  migrationsPlan,
  notizenPosten,
  postenInhalt,
  postenJeDach,
  postenPfad,
  postenScan,
  postenZeile,
} from './postenKern';

function flagge(argv: string[], name: string): string | null {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}

function schreibe(pfad: string, inhalt: string): void {
  mkdirSync(dirname(pfad), { recursive: true });
  writeFileSync(pfad, inhalt);
}

function heuteIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function lebendePruefen(dach: string): void {
  const { einheiten } = parseRoadmap(readFileSync('ROADMAP.md', 'utf8'));
  const e = einheiten.find((x) => x.id === dach);
  if (!e) {
    console.error(`plan:posten ROT: Dach «${dach}» hat kein @meta in ROADMAP.md.`);
    process.exit(1);
  }
  if (e.etikett.status === 'done') {
    console.error(`plan:posten ROT: Dach «${dach}» ist done — Posten an einen lebenden Schritt hängen oder den Fund als eigenen Schritt aufnehmen.`);
    process.exit(1);
  }
}

if (!process.env.VITEST) {
  const argv = process.argv.slice(2);
  const befehl = argv[0] ?? '';

  if (befehl === 'neu') {
    const dach = flagge(argv, 'dach');
    const titel = flagge(argv, 'titel');
    if (!dach || !titel) {
      console.error('Aufruf: npm run plan:posten -- neu --dach <ID> --titel "…" [--anlass "…"] [--text "…"] [--wartet-auf david]');
      process.exit(2);
    }
    lebendePruefen(dach);
    const text = flagge(argv, 'text') ?? (process.stdin.isTTY ? '' : readFileSync(0, 'utf8').trim());
    const datum = flagge(argv, 'datum') ?? heuteIso();
    const belegt = new Set(postenScan().map((d) => d.pfad));
    const pfad = postenPfad(datum, titel, belegt);
    const inhalt = postenInhalt(
      { dach, titel, anlass: flagge(argv, 'anlass'), wartetAuf: flagge(argv, 'wartet-auf') },
      text || titel,
    );
    schreibe(pfad, inhalt);
    console.log(`Posten angelegt: ${pfad}`);
  } else if (befehl === 'zu') {
    const pfad = argv[1];
    if (!pfad || !existsSync(pfad)) {
      console.error('Aufruf: npm run plan:posten -- zu plan/posten/<datei>.md [--beleg "PR #123"]');
      process.exit(2);
    }
    const beleg = flagge(argv, 'beleg') ?? '—';
    const ziel = `${POSTEN_ARCHIV}/${pfad.split('/').pop()}`;
    mkdirSync(POSTEN_ARCHIV, { recursive: true });
    const inhalt = `${readFileSync(pfad, 'utf8').replace(/\s*$/, '')}\n\n**Erledigt ${heuteIso()}:** ${beleg}\n`;
    writeFileSync(pfad, inhalt);
    execFileSync('git', ['add', '--', pfad], { stdio: 'inherit' });
    execFileSync('git', ['mv', '--', pfad, ziel], { stdio: 'inherit' });
    console.log(`Posten geschlossen: ${ziel}`);
  } else if (befehl === 'aus-notizen') {
    const datei = argv[1];
    if (!datei || !existsSync(datei)) {
      console.error('Aufruf: npm run plan:posten -- aus-notizen <notizen-datei.md>');
      process.exit(2);
    }
    const belegt = new Set(postenScan().map((d) => d.pfad));
    const r = notizenPosten(readFileSync(datei, 'utf8'), flagge(argv, 'datum') ?? heuteIso(), belegt);
    for (const d of r.dateien) {
      lebendePruefen(d.dach);
      schreibe(d.pfad, d.inhalt);
      console.log(`  ${d.dach}  ${d.pfad}`);
    }
    if (r.dateien.length) writeFileSync(datei, r.neuerText);
    console.log(`${r.dateien.length} Posten angelegt, ${r.brauchtDach.length} Zeile(n) brauchen ein Dach:`);
    for (const z of r.brauchtDach) console.log(`  braucht Dach: ${z.slice(0, 110)}`);
  } else if (befehl === 'migrieren') {
    const trocken = argv.includes('--dry-run');
    const heute = flagge(argv, 'datum') ?? heuteIso();
    const titelDatei = flagge(argv, 'titel-datei');
    const titelVonHand = new Map<string, string>();
    if (titelDatei) {
      for (const z of readFileSync(titelDatei, 'utf8').split('\n')) {
        const m = /^([0-9a-f]{12})\s+(.+)$/.exec(z.trim());
        if (m) titelVonHand.set(m[1], m[2].trim());
      }
    }
    const md = readFileSync('ROADMAP.md', 'utf8');
    const r = migrationsPlan(md, titelVonHand, heute);
    console.log(`Posten-Dateien: ${r.dateien.length} · Chronik-Block: ${r.chronikBlock.length} B · entfallene Zeiger-Stubs: ${r.entfallen.length} · ohne Titel: ${r.ohneTitel.length}`);
    for (const e of r.entfallen) console.log(`  entfällt (Z.${e.zeile}): ${e.text.slice(0, 120)}`);
    for (const o of r.ohneTitel) console.log(`  OHNE TITEL ${o.hash}  ${o.text.slice(0, 120)}`);
    if (trocken) {
      console.log('(--dry-run: nichts geschrieben)');
    } else {
      for (const d of r.dateien) schreibe(d.pfad, d.inhalt);
      writeFileSync('ROADMAP.md', r.neuesMd);
      if (r.chronikBlock) writeFileSync(CHRONIK, `${readFileSync(CHRONIK, 'utf8').replace(/\s*$/, '')}\n${r.chronikBlock}`);
      console.log('geschrieben.');
    }
  } else if (befehl && !befehl.startsWith('-')) {
    const liste = postenJeDach(postenScan()).get(befehl) ?? [];
    console.log(`${befehl}: ${liste.length} offene(r) Posten`);
    for (const p of liste) console.log(`  ${p.datum}  ${p.kopf.wartetAuf ? '[D] ' : ''}${p.kopf.titel}\n            ${p.pfad}`);
  } else {
    const jeDach = postenJeDach(postenScan());
    const zeile = postenZeile(jeDach);
    for (const [id, liste] of [...jeDach.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${String(liste.length).padStart(3)}  ${id}`);
    }
    console.log(zeile ?? 'Keine offenen Posten.');
  }
}
