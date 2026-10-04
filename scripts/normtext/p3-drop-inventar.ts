/**
 * P3-Analyse (temporär, W2·5b): korpusweite <p>-Klassen-Inventur über alle
 * gepinnten Bund-HTMLs. Findet <p>-Elemente in Artikel-/disp-/annex-Körpern,
 * deren bereinigter Text NICHT im Extraktor-Output erscheint (stille Drops).
 * Aggregiert nach class-Attribut. NICHT Teil der gate-Kette — reines Audit.
 */
import { readFileSync, existsSync } from 'node:fs';
import { extrahiereArtikelAusAnker } from './extrahiere-fedlex.ts';
import { parseFedlexCacheEintraege } from './inventar-bund.ts';
import { SUFFIX_ALT } from '../../src/lib/fedlex/nummer.ts';

const shell = readFileSync('scripts/fedlex-cache.sh', 'utf8');
const eintraege = parseFedlexCacheEintraege(shell);

function normText(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-zA-Z#0-9]+;/gi, ' ')
    .replace(/\s+/g, '')
    .toLowerCase();
}
const ABSATZ_NR_PRAEFIX = new RegExp(`^\\d+${SUFFIX_ALT}?[a-z]?`);
function ohneAbsatzNr(norm: string): string {
  return norm.replace(ABSATZ_NR_PRAEFIX, '');
}
function istAbsatzKlasse(klasse: string): boolean {
  return /(?:^|[^a-z])absatz(?:$|[^a-z])/.test(klasse);
}

function outputText(art: ReturnType<typeof extrahiereArtikelAusAnker>): string {
  if (!art) return '';
  const teile: string[] = [];
  if (art.grundlage) teile.push(art.grundlage);
  for (const b of art.bloecke) {
    teile.push(b.text ?? '');
    for (const it of b.items ?? []) teile.push(it.marke, it.text);
    if (b.mehrspaltig) {
      for (const z of b.mehrspaltig.zeilen) teile.push(...z);
      for (const k of b.mehrspaltig.kopf ?? []) teile.push(k);
      for (const s of b.mehrspaltig.spalten ?? []) teile.push(s.titel);
    }
    for (const k of b.bildKacheln ?? []) teile.push(k.name ?? '', k.nummer ?? '');
  }
  return normText(teile.join(' '));
}

interface DropRec { law: string; artId: string; klasse: string; sample: string; absatzKlasse: boolean; }
const drops: DropRec[] = [];
const klasseCount = new Map<string, number>();
const klasseLaws = new Map<string, Set<string>>();
let artCount = 0;

const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;

for (const e of eintraege) {
  const pfad = `/tmp/${e.name}.html`;
  if (!existsSync(pfad)) continue;
  const html = readFileSync(pfad, 'utf8');
  const artRe = /<article[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/article>/gi;
  let am: RegExpExecArray | null;
  const gesehen = new Set<string>();
  while ((am = artRe.exec(html)) !== null) {
    const artId = am[1];
    if (gesehen.has(artId)) continue;
    gesehen.add(artId);
    artCount++;
    const out = outputText(extrahiereArtikelAusAnker(html, artId));
    const koerper = am[2].replace(/<div\s+class="footnotes">[\s\S]*$/i, '');
    let pm: RegExpExecArray | null;
    pRe.lastIndex = 0;
    while ((pm = pRe.exec(koerper)) !== null) {
      const attrs = pm[1];
      const roh = pm[2];
      if (/<img\b/i.test(roh)) continue;
      const txtRoh = normText(roh);
      const txt = ohneAbsatzNr(txtRoh);
      if (txt.length < 5) continue;
      const probe = txt.slice(0, 40);
      if (out.includes(probe)) continue;
      if (out.includes(txt.slice(0, 12))) continue;
      // auch ohne Absatznr-Strip prüfen (falls Extraktor Nr behielt)
      if (out.includes(txtRoh.slice(0, 40))) continue;
      const klasseM = attrs.match(/\bclass="([^"]*)"/i);
      const klasse = klasseM ? klasseM[1].trim() : '«keine-klasse»';
      const sample = roh.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70);
      drops.push({ law: e.name, artId, klasse, sample, absatzKlasse: istAbsatzKlasse(klasse) });
      klasseCount.set(klasse, (klasseCount.get(klasse) ?? 0) + 1);
      if (!klasseLaws.has(klasse)) klasseLaws.set(klasse, new Set());
      klasseLaws.get(klasse)!.add(e.name);
    }
  }
}

console.log(`\n=== P3 Drop-Inventur — ${eintraege.length} Bund-Erlasse, ${artCount} Artikel gescannt ===\n`);
const echt = drops.filter((d) => !d.absatzKlasse);
const absatzRest = drops.filter((d) => d.absatzKlasse);
console.log(`Flag-Kandidaten gesamt: ${drops.length}`);
console.log(`  davon absatz-Klasse (alt1 erfasst → Rest-Rauschen Tabellen/Formatierung): ${absatzRest.length}`);
console.log(`  ECHTE Drop-Kandidaten (nicht-absatz-Klasse): ${echt.length}\n`);
console.log('====== NICHT-absatz-Klassen (echte Drop-Kandidaten) ======');
const sorted = [...klasseCount.entries()]
  .filter(([k]) => !istAbsatzKlasse(k))
  .sort((a, b) => b[1] - a[1]);
for (const [klasse, n] of sorted) {
  const laws = [...(klasseLaws.get(klasse) ?? [])];
  console.log(`\n### class="${klasse}"  — ${n}× in ${laws.length} Erlassen`);
  console.log(`    Erlasse: ${laws.slice(0, 14).join(', ')}${laws.length > 14 ? ` …(+${laws.length - 14})` : ''}`);
  for (const b of drops.filter((d) => d.klasse === klasse).slice(0, 3)) {
    console.log(`    · ${b.law}/${b.artId}: "${b.sample}"`);
  }
}
console.log('\n\n====== absatz-Klassen mit Rest-Flags (Stichprobe, i.d.R. Tabellen/Formatierungs-Rauschen) ======');
const absKlassen = [...klasseCount.entries()].filter(([k]) => istAbsatzKlasse(k)).sort((a, b) => b[1] - a[1]);
for (const [klasse, n] of absKlassen.slice(0, 12)) {
  console.log(`  class="${klasse}" — ${n}×  z.B. ${drops.find((d) => d.klasse === klasse)?.law}/${drops.find((d) => d.klasse === klasse)?.artId}`);
}
