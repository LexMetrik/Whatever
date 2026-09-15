/**
 * report:confidence — läuft die Treue-Gates (confidence-logik.ts) über die
 * bestehenden Norm-Snapshots und erzeugt einen Confidence-Report + Quarantäne-
 * Liste.
 *
 * Ehrliche Benennung (QS-CONFIDENCE-EHRLICH, 8.8.2026): das npm-Skript heisst
 * `report:confidence`, nicht mehr `check:confidence` — der Lauf kann bauart-
 * bedingt nie rot werden (Quarantäne ist erwarteter Normalzustand, der Mensch
 * liest den Report), und ein `check:`-Präfix ohne Scheiter-Fähigkeit verletzt
 * §6.7 (Präzedenz `check:tot` → `report:tot`, QS-SELBSTOPT 7.8.2026). Der
 * DATEINAME bleibt als grep-Anker unverändert (Verweis-Logik wie CLAUDE.md §16:
 * übersetzen statt umbenennen). Zweck (FAHRPLAN-GESETZE-IMPORT-3TIER §3): den Korpus-Review-Fan-out
 * (1 Agent pro Gesetz) durch maschinelle Vorfilterung ersetzen — der Mensch sieht
 * nur noch Erlasse mit score < Schwelle.
 *
 * Doppelnutzen: über den HEUTIGEN Korpus gelaufen ist dies der Kalibrierungs-
 * Akzeptanztest — findet das Gate die bekannten Befunde (22.6.: 58/150) wieder?
 *
 * Aufruf:  npm run report:confidence  (vite-node scripts/normtext/check-confidence.ts) [-- --schwelle=0.95] [--datum=YYYY-MM-DD] [--schreibe]
 * §2: die Bewertung ist rein (confidence-logik); dieser Runner ist nur FS-Hülle.
 *
 * Frische-Kopplung (§17, Wurzel-Befund Prüfer #848, 15.9.2026): `erzeugt`
 * wurde bislang per `--datum` von Hand gesetzt, ohne dass irgendetwas es an
 * den Korpus koppelte — die Datei alterte drei Monate unbemerkt. `--schreibe`
 * trägt seither zusätzlich `korpus` (sha aus dem committeten
 * `daten-manifest.json#normtext.db.artikel.sha`, das sich mit jeder Snapshot-
 * Änderung bewegt, geprüft gegen scripts/datenhaltung/ingest.ts::
 * ingestNormtextZiel — dieselben Dateien, die `ladeErlasse` unten einliest).
 * Ohne `--datum` bricht `--schreibe` jetzt ab, statt `erzeugt` still
 * wegzulassen. Das begleitende Tor `check:confidence-frische`
 * (check-confidence-frische.ts) hält die Kopplung fest.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pruefeTreue, bewerteConfidence, type SnapArtikel, type TreueFlag } from './confidence-logik.ts';

interface SnapshotEintrag {
  artikel: string;
  artikelLabel: string;
  bloecke: SnapArtikel['bloecke'];
}
interface SnapshotDatei {
  eintraege: SnapshotEintrag[];
}

interface ErlassBefund {
  datei: string;
  ebene: 'bund' | 'kanton';
  key: string;
  artikelTotal: number;
  score: number;
  vetos: number;
  flags: TreueFlag[];
}

function ladeErlasse(basis: string, ebene: 'bund' | 'kanton'): ErlassBefund[] {
  const dir = join(basis, ebene);
  const befunde: ErlassBefund[] = [];
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json') && n !== 'index.json').sort()) {
    const datei = join(dir, name);
    let inhalt: SnapshotDatei;
    try {
      inhalt = JSON.parse(readFileSync(datei, 'utf-8')) as SnapshotDatei;
    } catch (e) {
      console.warn(`  WARN unparsebar, übersprungen: ${ebene}/${name} (${(e as Error).message})`);
      continue;
    }
    if (!Array.isArray(inhalt.eintraege)) continue; // Manifest/Nicht-Snapshot überspringen
    const artikel: SnapArtikel[] = inhalt.eintraege.map((e) => ({
      artikel: e.artikel,
      artikelLabel: e.artikelLabel,
      bloecke: e.bloecke,
    }));
    const flags = pruefeTreue(artikel);
    const conf = bewerteConfidence(flags);
    befunde.push({
      datei: `${ebene}/${name}`,
      ebene,
      key: name.replace(/\.json$/, ''),
      artikelTotal: artikel.length,
      score: conf.score,
      vetos: conf.vetos.length,
      flags,
    });
  }
  return befunde;
}

function arg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.slice(name.length + 3) : undefined;
}

const basis = join(process.cwd(), 'public', 'normtext');
const schwelle = Number(arg('schwelle') ?? '0.95');
if (!Number.isFinite(schwelle) || schwelle < 0 || schwelle > 1) {
  throw new Error(`Ungültige --schwelle: "${arg('schwelle')}" — erwartet Zahl in [0,1]`);
}
const befunde = [...ladeErlasse(basis, 'bund'), ...ladeErlasse(basis, 'kanton')];

// Aggregation
const klassen: Record<string, number> = {};
let flagsTotal = 0;
for (const b of befunde) {
  for (const f of b.flags) {
    klassen[f.klasse] = (klassen[f.klasse] ?? 0) + 1;
    flagsTotal++;
  }
}
const autoAkzept = befunde.filter((b) => b.score >= schwelle);
const quarantaene = befunde.filter((b) => b.score < schwelle).sort((a, b) => a.score - b.score);

console.log(`\n── Confidence-Report über ${befunde.length} Erlasse (Schwelle ${schwelle}) ──`);
console.log(`Auto-Akzept (score ≥ ${schwelle}): ${autoAkzept.length}  (${((autoAkzept.length / befunde.length) * 100).toFixed(0)} %)`);
console.log(`Quarantäne (Review nötig):        ${quarantaene.length}`);
console.log(`Treue-Flags gesamt: ${flagsTotal}`);
console.log('Flag-Klassen:', JSON.stringify(klassen));
console.log('\nTop-Quarantäne (niedrigster Score zuerst):');
for (const b of quarantaene.slice(0, 15)) {
  const harte = b.flags.filter((f) => f.schwere === 'hart').length;
  console.log(`  ${b.score.toFixed(2)}  ${b.datei}  (${b.flags.length} Flags, ${harte} hart, ${b.artikelTotal} Art.)`);
}

if (process.argv.includes('--schreibe')) {
  const datum = arg('datum');
  if (!datum) {
    throw new Error(
      'report:confidence --schreibe ohne --datum=YYYY-MM-DD: erzeugt darf nicht still wegfallen ' +
      '(§17, Prüfer-Befund #848) — Aufruf ergänzen: --schreibe --datum=YYYY-MM-DD',
    );
  }
  const manifestPfad = join(process.cwd(), 'daten-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPfad, 'utf-8')) as {
    'normtext.db'?: { artikel?: { sha?: string } };
  };
  const manifestSha = manifest['normtext.db']?.artikel?.sha;
  if (!manifestSha) {
    throw new Error(`${manifestPfad} trägt kein normtext.db.artikel.sha — Manifest neu bauen (npm run datenhaltung:manifest).`);
  }
  const out = {
    erzeugt: datum,
    schwelle,
    korpus: { quelle: 'daten-manifest.json#normtext.db.artikel.sha', sha: manifestSha, erlasseDateien: befunde.length },
    zusammenfassung: { erlasse: befunde.length, autoAkzept: autoAkzept.length, quarantaene: quarantaene.length, klassen },
    erlasse: befunde.map((b) => ({
      datei: b.datei, ebene: b.ebene, key: b.key, artikelTotal: b.artikelTotal,
      score: b.score, vetos: b.vetos,
      flags: b.flags.map((f) => ({ artikel: f.artikel, klasse: f.klasse, schwere: f.schwere, detail: f.detail })),
    })),
  };
  const ziel = join(basis, 'confidence.json');
  writeFileSync(ziel, JSON.stringify(out, null, 2) + '\n');
  console.log(`\ngeschrieben: ${ziel}`);
}
