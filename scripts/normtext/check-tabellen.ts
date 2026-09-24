/**
 * check:tabellen (T-F1, M10) — blockierender Aritäts-/Werttreue-Validator über
 * die Normtext-Snapshot-Tabellen.
 *
 * BUND ist scharf (Build stoppt bei Bruch): jeder `mehrspaltig`-Block mit dem
 * kanonischen `spalten`-Modell MUSS erfüllen:
 *   (1) spalten vorhanden, N ≥ 1
 *   (2) ∀ Zeile: zeilen[i].length === N   (kopf == Zellzahl, T-B2)
 *   (3) typ ∈ {bereich, zahl, text, betrag}
 *   (4) keine vollständig leere Spalte (Spacer-Phantom, T-A7)
 *   (5) kein isolierter über/bis/ab-Rest als Einzelzelle (unverdichtete Staffel, T-A6)
 *
 * Ein Bund-Block, der NUR `kopf` trägt (kein `spalten`), ist ein ehrlicher
 * Legacy-Fallback (ragged/Prosa, T-E4) — NICHT-blockierend, aber transparent
 * gelistet (§8). KANTON läuft komplett im Report-Modus (warnend), bis sein
 * Generator-Pfad nachgezogen ist (Scope «zuerst nur Bund»).
 *
 * Aufruf: vite-node scripts/normtext/check-tabellen.ts   (in der `check`-Kette)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NormSnapshotDatei } from '../../src/lib/normtext/typen.ts';

const TYP_OK = new Set(['bereich', 'zahl', 'text', 'betrag']);
// Identisch mit STAFFEL_WORT in tabelle-normalisieren.ts (Bug-Check 30.6.2026:
// divergierende Listen → ein fr «de»/«jusqu’à»-Rest fiel sonst auseinander).
const LONE_STAFFEL = new Set(['bis', 'über', 'ueber', 'ab', 'und', 'et', 'de', 'à', 'jusqu’à', "jusqu'à"]);

/**
 * Untergrenze der kanonischen Bund-Blöcke (PS-19/HN-03, 25.9.2026). Ohne sie
 * lässt ein fehlendes `public/normtext/bund`-Verzeichnis das Tor grün durch:
 * `readdirSync` wirft, der catch lieferte bisher befund- und kommentarlos
 * `{kanon: 0}` zurück, main() druckte «OK» (Nullprobe-Beleg: leeres cwd →
 * «kanonische spalten-Blöcke: 0 … OK», Exit 0). Realstand bei Bau dieses Tors
 * (main d6c77ac40, `npx vite-node scripts/normtext/check-tabellen.ts`): 386.
 * Ein Rückgang braucht einen deklarierten Grund und eine Anpassung dieser
 * Zahl im selben Commit — kein Prozent-Puffer, eine harte Zahl ist die
 * einzige, die die Nullprobe zuverlässig auffängt.
 */
const MIN_KANONISCH_BUND = 386;

interface Befund {
  datei: string;
  id: string;
  regel: string;
  detail: string;
}

function pruefeBlock(
  m: { spalten?: Array<{ typ: string; titel: string }>; kopf?: string[]; zeilen: string[][] },
  datei: string,
  id: string,
  befunde: Befund[],
): 'kanonisch' | 'legacy' {
  if (!m.spalten || m.spalten.length === 0) return 'legacy';
  const N = m.spalten.length;
  const add = (regel: string, detail: string) => befunde.push({ datei, id, regel, detail });

  // (3) Typ-Vokabular
  for (const s of m.spalten) {
    if (!TYP_OK.has(s.typ)) add('typ', `unbekannter Spaltentyp «${s.typ}»`);
  }
  // (2) Arität: jede Zeile exakt N
  for (let i = 0; i < m.zeilen.length; i++) {
    if (m.zeilen[i].length !== N) add('aritaet', `Zeile ${i}: ${m.zeilen[i].length} Zellen ≠ ${N} Spalten`);
  }
  // (4) keine vollständig leere Spalte (Titel UND alle Zellen leer)
  for (let c = 0; c < N; c++) {
    const titelLeer = (m.spalten[c].titel ?? '').trim() === '';
    const datenLeer = m.zeilen.every((z) => (z[c] ?? '').trim() === '');
    if (titelLeer && datenLeer) add('leerspalte', `Spalte ${c} ist vollständig leer`);
  }
  // (5) kein isolierter Staffel-Rest
  for (let i = 0; i < m.zeilen.length; i++) {
    for (const zelle of m.zeilen[i]) {
      if (LONE_STAFFEL.has(zelle.trim().toLowerCase())) {
        add('staffel-rest', `Zeile ${i}: isolierte Staffel-Zelle «${zelle.trim()}»`);
      }
    }
  }
  return 'kanonisch';
}

function laufe(verzeichnis: string, scharf: boolean): { befunde: Befund[]; kanon: number; legacy: Array<{ datei: string; id: string }> } {
  const befunde: Befund[] = [];
  const legacy: Array<{ datei: string; id: string }> = [];
  let kanon = 0;
  let dateien: string[];
  try {
    dateien = readdirSync(verzeichnis).filter((f) => f.endsWith('.json') && f !== 'index.json');
  } catch {
    // Fehlendes/unlesbares Verzeichnis war bisher ein stiller Nulldurchlauf
    // (0 Blöcke, Exit 0) statt eines Fehlschlags — genau der Nullprobe-Fund
    // PS-19. Im scharfen (Bund-)Modus ist das ein Befund; die Untergrenze
    // unten fängt denselben Fall zusätzlich ab, falls hier je gelockert wird.
    if (scharf) {
      befunde.push({ datei: verzeichnis, id: '(verzeichnis)', regel: 'verzeichnis', detail: 'fehlt oder ist nicht lesbar' });
    }
    return { befunde, kanon, legacy };
  }
  for (const f of dateien) {
    const datei = join(verzeichnis, f);
    let inhalt: NormSnapshotDatei;
    try {
      inhalt = JSON.parse(readFileSync(datei, 'utf8')) as NormSnapshotDatei;
    } catch {
      if (scharf) befunde.push({ datei, id: '(datei)', regel: 'parse', detail: 'kein gültiges JSON' });
      continue;
    }
    for (const e of inhalt.eintraege ?? []) {
      for (const b of e.bloecke ?? []) {
        if (!b.mehrspaltig) continue;
        const art = pruefeBlock(b.mehrspaltig, datei, e.id, befunde);
        if (art === 'kanonisch') kanon++;
        else legacy.push({ datei, id: e.id });
      }
    }
  }
  return { befunde, kanon, legacy };
}

function main(): void {
  // BUND scharf
  const bund = laufe('public/normtext/bund', true);
  if (bund.kanon < MIN_KANONISCH_BUND) {
    bund.befunde.push({
      datei: 'public/normtext/bund',
      id: '(gesamt)',
      regel: 'untergrenze',
      detail: `nur ${bund.kanon} kanonische Blöcke, Untergrenze ${MIN_KANONISCH_BUND} unterschritten`,
    });
  }
  // KANTON Report-Modus (warnend, nicht blockierend)
  const kanton = laufe('public/normtext/kanton', false);

  console.log('[check:tabellen] Bund (scharf):');
  console.log(`  kanonische spalten-Blöcke: ${bund.kanon}`);
  console.log(`  Legacy-Fallback (kopf, ehrlich nicht-kanonisiert): ${bund.legacy.length}`);
  for (const l of bund.legacy) console.log(`    · ${l.id}  [${l.datei.split('/').pop()}]`);

  if (kanton.kanon + kanton.legacy.length > 0) {
    console.log(`\n[check:tabellen] Kanton (Report): ${kanton.kanon} kanonisch, ${kanton.legacy.length} legacy ` +
      `(Scope «zuerst nur Bund» — nicht blockierend)`);
    if (kanton.befunde.length > 0) {
      console.log(`  ${kanton.befunde.length} Kanton-Hinweise (warnend):`);
      for (const b of kanton.befunde.slice(0, 10)) console.log(`    ~ ${b.id} [${b.regel}] ${b.detail}`);
    }
  }

  if (bund.befunde.length > 0) {
    console.error('\nFEHLER check:tabellen — Bund-Aritäts-/Werttreue-Brüche:');
    for (const b of bund.befunde) {
      console.error(`  ✗ ${b.id} [${b.regel}] ${b.detail}  (${b.datei.split('/').pop()})`);
    }
    console.error(`\n${bund.befunde.length} Bruch/Brüche. Tabellen-Normalisierung (tabelle-normalisieren.ts) oder Verzeichnis public/normtext/bund prüfen.`);
    process.exit(1);
  }

  console.log('\n[check:tabellen] OK — 0 Aritäts-/Leerspalten-/Staffel-Brüche im Bund-Korpus.');
}

main();
