// ─── Orchestrator: BS-Rechtsprechungs-Import (npm run entscheide:bs) ─────────
//
//   vite-node scripts/rechtsprechung/bs-import.ts -- [--inventar-only]
//     [--fetch-only] [--parse-only] [--delta] [--limit=N] [--datum=YYYY-MM-DD]
//
// Phasen (Bauplan §5): Inventar (16 Requests, Count-Gates G1/G2) → Fetch (golden
// store, resumierbar) → Parse (offline, Fidelity-Gates) → schreibeKorpus()
// (Bestand von Platte + BS additiv; §6: kein Drift der bestehenden Snapshots).
// --delta (Wurzel-Fix 25.9.2026, Regel + Begründung in bs-delta.ts): Inventar neu,
// dann Plan Soll (Inventar) ↔ Ist (committeter Korpus) — NUR neue und aktualisierte
// Keys werden geholt und geparst, alle übrigen BS-Snapshots bleiben byte-treu von
// der Platte (auch `abgerufen`); aus dem Portal verschwundene Scope-Einträge werden
// entfernt (Takedown-Respekt §2/§5.4) und im Report ausgewiesen. Bis 25.9.2026
// reichte --delta das GANZE Inventar an Fetch und Parse weiter: ohne lokalen
// Roh-Store (daten/bs-fiw/raw/ ist nicht eingecheckt) holte es alle ~3950
// Dokumente neu und stempelte den Bestand um. Wiederaufnehmbar: `--delta
// --fetch-only` / `--delta --parse-only` rechnen denselben Plan. --limit ist mit
// --delta gesperrt (ein Teil-Delta liesse Plan-Zeilen ohne Rohdatei zurück).
// --kopfdatum-nachtrag (B-1, 23.9.2026): nur die Dokumente OHNE Metadaten-Datum
// holen und ihr Datum aus dem Deckblatt nachtragen (`nachtragKopfdatum`); kein
// Inventar-Neubau, kein Vollabruf.

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { baueInventar, type Inventar } from './bs-inventar';
import { fetcheAlle, BS_DATEN, FEHLERLISTE } from './bs-fetch';
import { planeBsDelta, zuHolen, berichteBsDelta, parseUndSchreibeDelta } from './bs-delta';
import { ladeBestandSnapshots } from '../normtext/entscheide-schreiben';

const arg = (name: string): string | null => {
  const p = process.argv.find((a) => a.startsWith(name + '='));
  return p ? p.slice(name.length + 1) : null;
};
const hat = (f: string) => process.argv.includes(f);

const datum = arg('--datum') ?? new Date().toISOString().slice(0, 10);
const limit = Number(arg('--limit') ?? '0');
const INVENTAR_PFAD = join(BS_DATEN, 'inventar.json');

function ladeInventar(): Inventar {
  if (!existsSync(INVENTAR_PFAD)) throw new Error(`[bs-import] ${INVENTAR_PFAD} fehlt — zuerst Inventar-Phase fahren.`);
  return JSON.parse(readFileSync(INVENTAR_PFAD, 'utf8')) as Inventar;
}

async function main() {
  const nurInventar = hat('--inventar-only');
  const nurFetch = hat('--fetch-only');
  const nurParse = hat('--parse-only');
  const delta = hat('--delta');
  if (delta && limit > 0) throw new Error('[bs-import] --limit ist mit --delta gesperrt (Plan-Zeilen ohne Rohdatei).');

  // ── Sonderlauf B-1: Kopf-Datum der datumlosen Dokumente nachtragen ──
  // Holt NUR die Rohdateien der Inventar-Einträge ohne Metadaten-Datum (golden
  // store, idempotent) und patcht genau deren Datum — Begründung und Beweis-
  // Vorbedingungen bei `nachtragKopfdatum` (bs-parse.ts).
  if (hat('--kopfdatum-nachtrag')) {
    const inv = ladeInventar();
    const datumlos: Inventar = { ...inv, eintraege: inv.eintraege.filter((z) => !z.datum) };
    const bericht = await fetcheAlle(datumlos, datum);
    if (bericht.fehler.length) { process.exitCode = 1; return; }
    const { nachtragKopfdatum } = await import('./bs-parse');
    nachtragKopfdatum(inv, datum);
    return;
  }

  // ── Phase 1: Inventar (übersprungen bei --fetch-only/--parse-only) ──
  if (!nurFetch && !nurParse) {
    mkdirSync(BS_DATEN, { recursive: true });
    const inv = await baueInventar(datum);
    writeFileSync(INVENTAR_PFAD, JSON.stringify(inv, null, 1) + '\n', 'utf8');
    console.log(`[bs-import] Inventar geschrieben: ${inv.eintraege.length} Scope-Einträge.`);
    if (delta) berichteBsDelta(planeBsDelta(inv, ladeBestandSnapshots()));
    if (nurInventar) return;
  }

  // ── Phase 2: Fetch (golden store, resumierbar) ──
  if (!nurParse) {
    const voll = ladeInventar();
    // Delta: nur die Plan-Zeilen (neu + aktualisiert) holen, nie das ganze Inventar.
    const inv: Inventar = delta ? { ...voll, eintraege: zuHolen(planeBsDelta(voll, ladeBestandSnapshots())) } : voll;
    if (delta) console.log(`[bs-import] Delta-Fetch: ${inv.eintraege.length} von ${voll.eintraege.length} Scope-Einträgen.`);
    const bericht = await fetcheAlle(inv, datum, limit);
    if (bericht.fehler.length) {
      console.error(`[bs-import] ${bericht.fehler.length} Fetch-Fehler — Fehlerliste: ${FEHLERLISTE}`);
      process.exitCode = 1;
      return;   // Nie mit lückenhaftem raw-Bestand weiterparsen (Count-Gate G1 wäre rot).
    }
    if (nurFetch) return;
  }

  // ── Phase 3+4: Parse (offline) + Korpus schreiben ──
  if (delta) { await parseUndSchreibeDelta(ladeInventar(), datum); return; }
  const { parseUndSchreibe } = await import('./bs-parse');
  await parseUndSchreibe(ladeInventar(), datum, limit);
}

main().catch((e) => { console.error(e); process.exit(1); });
