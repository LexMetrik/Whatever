// scripts/materialien/bs-materialien-run.ts
// K-16: dünner Fetch/Write-Teil des BS-Materialien-Generators (Repo-Muster
// soft-law-projektion(-run) / material-manifest). Die Rechnung steht in
// bs-materialien.ts und ist ohne Netz testbar (§2/§0b Regel 5).
//
//   npm run materialien:bs -- --datum=$(date +%F)
//   npm run materialien:bs -- --datum=… --aus-roh   (Re-Parse ohne Netz, store-raw §11)
//
// Schreibt:
//   · src/lib/materialien/bs-grossrat.generated.ts   (Register-Quelle, Build-Zeit)
//   · bibliothek/materialien/bs-grossrat-raw/*.json  (Roh-Ablage: NUR die verwendeten
//     Zeilen — Provenienz ohne 31 MB Vollexport im Repo)

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import {
  BS_DATENSATZ, FELDER_GESCHAEFT, FELDER_DOKUMENT, FELDER_ERLASS, holeExport,
  type BsGeschaeft, type BsDokument, type BsErlassMeta,
} from './adapter-bs-grossrat.ts';
import {
  baueKanten, baueEreignisse, baueBsEintraege, serialisiere, fussnotenGeschaefte, cu,
  vergleicheBsDokumente,
  type BsErlassStamm,
} from './bs-materialien.ts';

const ZIEL = join('src', 'lib', 'materialien', 'bs-grossrat.generated.ts');
const ROH_DIR = join('bibliothek', 'materialien', 'bs-grossrat-raw');
const STRUKTUR_DIR = join('public', 'normtext', 'struktur', 'kanton');
const KORPUS_DIR = join('public', 'normtext', 'kanton');

const datumArg = process.argv.find((a) => a.startsWith('--datum='));
const datum = datumArg?.slice('--datum='.length);
if (!datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
  console.error('materialien:bs: --datum=YYYY-MM-DD erforderlich (§2, kein Date.now).');
  process.exit(1);
}
const ausRoh = process.argv.includes('--aus-roh');

/** Liest die BS-Erlass-Stammdaten aus den committeten Korpus-Artefakten (§5: der Korpus
 *  ist die Wahrheit darüber, welche Erlasse wir führen — nie eine zweite Liste). */
function leseErlassStamm(meta: readonly BsErlassMeta[]): BsErlassStamm[] {
  const metaNachSg = new Map(meta.map((m) => [m.systematic_number, m]));
  const dateien = readdirSync(KORPUS_DIR)
    .filter((f) => f.startsWith('BS-') && f.endsWith('.json'))
    .sort(cu);
  const stamm: BsErlassStamm[] = [];
  for (const datei of dateien) {
    const key = datei.slice(0, -'.json'.length);
    const sg = key.slice('BS-'.length);
    const sidecar = join(STRUKTUR_DIR, datei);
    if (!existsSync(sidecar)) continue;
    const roh = readFileSync(sidecar, 'utf8');
    const obj = JSON.parse(roh) as { kopf?: { titel?: string; erlassdatum?: string } };
    const m = metaNachSg.get(sg);
    stamm.push({
      key,
      sg,
      titel: obj.kopf?.titel ?? '',
      erlassdatum: obj.kopf?.erlassdatum ?? '',
      stichworte: (m?.keywords_de ?? []).filter((w) => typeof w === 'string'),
      kategorie: m?.category_name ?? '',
      // Der amtliche Schlüssel: die Fussnoten des Erlasses, wörtlich durchsucht.
      fussnotenGeschaefte: fussnotenGeschaefte(roh),
    });
  }
  return stamm;
}

function rohPfad(name: string): string { return join(ROH_DIR, `${name}.json`); }

function schreibeRoh(name: string, daten: unknown): void {
  mkdirSync(ROH_DIR, { recursive: true });
  writeFileSync(rohPfad(name), `${JSON.stringify(daten, null, 2)}\n`, 'utf8');
}

function leseRoh<T>(name: string): T[] {
  const p = rohPfad(name);
  if (!existsSync(p)) throw new Error(`materialien:bs --aus-roh: ${p} fehlt — zuerst einen Netzlauf fahren.`);
  return JSON.parse(readFileSync(p, 'utf8')) as T[];
}

async function main(): Promise<void> {
  let geschaefte: BsGeschaeft[];
  let dokumente: BsDokument[];
  let erlassMeta: BsErlassMeta[];

  if (ausRoh) {
    geschaefte = leseRoh<BsGeschaeft>('geschaefte');
    dokumente = leseRoh<BsDokument>('dokumente');
    erlassMeta = leseRoh<BsErlassMeta>('erlasse');
    console.log(`materialien:bs: Re-Parse aus ${ROH_DIR} (kein Netz).`);
  } else {
    const alleGeschaefte = await holeExport<BsGeschaeft>(BS_DATENSATZ.geschaefte, FELDER_GESCHAEFT);
    erlassMeta = await holeExport<BsErlassMeta>(BS_DATENSATZ.erlasse, FELDER_ERLASS, fetch, 'is_active="True"');
    const stammVor = leseErlassStamm(erlassMeta);
    const kantenVor = baueKanten(alleGeschaefte, stammVor);
    const gebraucht = new Set(kantenVor.map((k) => k.geschaeft));
    geschaefte = alleGeschaefte.filter((g) => gebraucht.has(g.signatur_ges)).sort((a, b) => cu(a.signatur_ges, b.signatur_ges));
    const alleDokumente = await holeExport<BsDokument>(BS_DATENSATZ.dokumente, FELDER_DOKUMENT);
    dokumente = alleDokumente
      .filter((d) => d.signatur_ges !== null && gebraucht.has(d.signatur_ges))
      .sort(vergleicheBsDokumente);
    // Roh-Ablage: nur die verwendeten Zeilen + die Erlass-Metadaten der verkanteten
    // Erlasse. Der Vollexport (31 MB) gehört nicht ins Repo, die Belegzeilen schon.
    const erlasseGebraucht = new Set(kantenVor.map((k) => k.erlass.slice('BS-'.length)));
    erlassMeta = erlassMeta
      .filter((m) => erlasseGebraucht.has(m.systematic_number))
      .sort((a, b) => cu(a.systematic_number, b.systematic_number));
    schreibeRoh('geschaefte', geschaefte);
    schreibeRoh('dokumente', dokumente);
    schreibeRoh('erlasse', erlassMeta);
    console.log(
      `materialien:bs: Abzug ${alleGeschaefte.length} Geschäfte / ${alleDokumente.length} Dokumente → `
      + `Roh-Ablage ${geschaefte.length} / ${dokumente.length} / ${erlassMeta.length} Zeilen (${ROH_DIR}).`,
    );
  }

  const stamm = leseErlassStamm(erlassMeta);
  const kanten = baueKanten(geschaefte, stamm);
  const { jeGeschaeft, unklassiert } = baueEreignisse(dokumente);
  const eintraege = baueBsEintraege(geschaefte, kanten, jeGeschaeft);

  writeFileSync(ZIEL, serialisiere(eintraege, datum as string), 'utf8');

  const nachRegel = new Map<string, number>();
  for (const k of kanten) nachRegel.set(k.regel, (nachRegel.get(k.regel) ?? 0) + 1);
  const erlasse = new Set(kanten.map((k) => k.erlass));
  const ereignisse = eintraege.reduce((n, e) => n + e.ereignisse.length, 0);
  console.log(
    `materialien:bs (--datum=${datum}): ${eintraege.length} Einträge · ${kanten.length} Kanten `
    + `(${[...nachRegel.entries()].sort().map(([r, n]) => `${r}=${n}`).join(' · ')}) über ${erlasse.size} Erlasse · `
    + `${ereignisse} Verfahrens-Ereignisse → ${ZIEL}`,
  );
  if (unklassiert.length > 0) {
    console.log(`materialien:bs: ${unklassiert.length} amtliche Dokument-Bezeichnungen ohne Klassen-Regel (nicht als Schritt geführt, §8):`);
    for (const u of unklassiert) console.log(`  ${u.anzahl}× ${u.bez}`);
  }
}

await main();
