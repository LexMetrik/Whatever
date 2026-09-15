/**
 * check:confidence-frische — Wurzel-Fix zum Prüfer-Befund #848 (15.9.2026,
 * W2·27-BUND-FERTIG): `public/normtext/confidence.json` trug bislang nur ein
 * von Hand gesetztes `erzeugt`-Datum, das an nichts gekoppelt war — die Datei
 * konnte (und ist) unbemerkt monatelang veralten, während sich der Normtext-
 * Korpus weiterentwickelte.
 *
 * Prüft die Kopplung `confidence.json.korpus` ↔ `daten-manifest.json` ↔
 * aktueller Dateibestand (reine Vergleichslogik: confidence-frische-logik.ts).
 * Rot bei einer der drei Bedingungen aus dem Auftrag (Spec §Soll Ziff. 2):
 *   (a) korpus.sha fehlt, (b) korpus.sha ≠ aktueller Manifest-Wert,
 *   (c) zusammenfassung.erlasse ≠ Zahl der Snapshot-Dateien im Korpus.
 * §2: dieser Runner ist reine FS-Hülle, die Bewertung steht in der Logik-Datei.
 *
 * Aufruf: npm run check:confidence-frische
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pruefeFrische, type FrischeEingabe } from './confidence-frische-logik.ts';

interface ConfidenceDatei {
  erzeugt?: string;
  korpus?: { quelle?: string; sha?: string; erlasseDateien?: number };
  zusammenfassung?: { erlasse?: number };
}
interface ManifestDatei {
  'normtext.db'?: { artikel?: { sha?: string } };
}

const wurzel = process.cwd();
const confidencePfad = join(wurzel, 'public', 'normtext', 'confidence.json');
const manifestPfad = join(wurzel, 'daten-manifest.json');

let confidence: ConfidenceDatei;
try {
  confidence = JSON.parse(readFileSync(confidencePfad, 'utf-8')) as ConfidenceDatei;
} catch (e) {
  console.error(`check:confidence-frische ROT — ${confidencePfad} fehlt oder ist unparsebar: ${(e as Error).message}`);
  console.error('  → npm run report:confidence -- --schreibe --datum=YYYY-MM-DD');
  process.exit(1);
}

let manifest: ManifestDatei;
try {
  manifest = JSON.parse(readFileSync(manifestPfad, 'utf-8')) as ManifestDatei;
} catch (e) {
  console.error(`check:confidence-frische ROT — ${manifestPfad} fehlt oder ist unparsebar: ${(e as Error).message}`);
  process.exit(1);
}
const aktuellerManifestSha = manifest['normtext.db']?.artikel?.sha;
if (!aktuellerManifestSha) {
  console.error(`check:confidence-frische ROT — daten-manifest.json trägt kein normtext.db.artikel.sha.`);
  process.exit(1);
}

function zaehleSnapshotDateien(ebene: 'bund' | 'kanton'): number {
  const dir = join(wurzel, 'public', 'normtext', ebene);
  return readdirSync(dir).filter((n) => n.endsWith('.json') && n !== 'index.json').length;
}
const aktuelleDateianzahl = zaehleSnapshotDateien('bund') + zaehleSnapshotDateien('kanton');

const eingabe: FrischeEingabe = {
  gemeldeterKorpusSha: confidence.korpus?.sha,
  aktuellerManifestSha,
  gemeldeteErlasse: confidence.zusammenfassung?.erlasse ?? -1,
  aktuelleDateianzahl,
  erzeugt: confidence.erzeugt,
};

const befund = pruefeFrische(eingabe);

if (!befund.frisch) {
  console.error(`check:confidence-frische ROT — ${befund.gruende.length} Abweichung(en):`);
  for (const g of befund.gruende) console.error(`  [${g.klasse}] ${g.text}`);
  console.error('  → Reparatur: npm run report:confidence -- --schreibe --datum=YYYY-MM-DD');
  process.exit(1);
}

console.log(
  `check:confidence-frische OK — korpus.sha ${aktuellerManifestSha.slice(0, 12)}… stimmt mit ` +
  `daten-manifest.json überein, ${aktuelleDateianzahl} Snapshot-Dateien (erzeugt ${eingabe.erzeugt ?? '?'}).`,
);
