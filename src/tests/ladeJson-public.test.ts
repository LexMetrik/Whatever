/**
 * ARCH-REVIEW · Prüfer der Lade-Stellen gegen die ECHTEN Dateien unter public/
 * (Auflage Gegenprüfung PR #1349, 7.10.2026).
 *
 * Anlass: `ladeJson.test.ts` zeigt, dass die Prüfer Falschformen abweisen — nicht,
 * dass sie die Wirklichkeit annehmen. Ein zu strenger Prüfer (Pflichtfeld, das
 * eine echte Datei nicht trägt) liesse eine Lade-Stelle im Betrieb still in den
 * Fehlerpfad laufen (§8). Hier läuft jeder an den Lade-Stellen verwendete Prüfer
 * gegen die Generator-Artefakte, wie `pruefeJsonVoll` in datenAussenkanten.test.ts.
 *
 * Umfang: ALLE Dateien jedes Verzeichnisses (Messung 7.10.2026, Dateicache warm: ~3,5 s für
 * 10 135 Dateien / rund 450 MB — eine Stichprobe würde kaum sparen, aber Formen
 * übersehen). Wächst public/ spürbar, ist hier eine sortierte Stichprobe
 * (jede n-te + erste + letzte) der Ausweg. Nicht erfasst: such-index/artikel.json
 * (gitignored, erst im Build erzeugt).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pruefeJsonVoll, type JsonPruefer } from '../data/jsonSchutz';
import { ANKER_PRUEFER } from '../lib/entstehung/anker';
import { SYNOPSE_ENTWURF_PRUEFER } from '../lib/entstehung/synopse-entwurf';
import { ENTSTEHUNG_PRUEFER } from '../lib/entstehung/projektion';
import { SYNOPSE_PRUEFER } from '../lib/entstehung/synopse';
import { DECKUNG_PRUEFER } from '../lib/materialien/deckung';
import { MATERIALIEN_MANIFEST_PRUEFER, MATERIALIEN_I18N_PRUEFER } from '../lib/materialien/browse';
import { KANTEN_PRUEFER } from '../lib/materialien/kanten-shard';
import { NORMTEXT_REVISIONEN_PRUEFER } from '../lib/normtext/revisionen';
import { NORMTEXT_MANIFEST_PRUEFER, NORMTEXT_DATEI_PRUEFER, NORMTEXT_STRUKTUR_PRUEFER } from '../lib/normtext/browse';
import { NORMTEXT_SNAPSHOT_PRUEFER, NORMTEXT_KANTON_INDEX_PRUEFER } from '../lib/normtext/laden';
import { HISTORIE_PRUEFER } from '../lib/normtext/historie-laden';
import { RSPR_MANIFEST_PRUEFER, RSPR_RICHTER_PRUEFER, RSPR_DATEI_PRUEFER } from '../lib/rechtsprechung/browse';
import { NORMINDEX_PRUEFER, NORMINDEX_ERLASS_PRUEFER, NORMINDEX_SHARD_PRUEFER } from '../lib/rechtsprechung/norm-index';
import { BEZUEGE_PRUEFER } from '../lib/rechtsprechung/bezuege';
import { ARTIKEL_REVISIONEN_PRUEFER } from '../lib/verzahnung/artikel-revisionen';

const PUBLIC = join(process.cwd(), 'public');

/** Alle *.json unter einem Verzeichnis (rekursiv), sortiert; `index.json` ausgenommen. */
function dateien(verz: string): string[] {
  const aus: string[] = [];
  const geh = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) geh(p);
      else if (e.name.endsWith('.json') && e.name !== 'index.json') aus.push(p);
    }
  };
  geh(join(PUBLIC, verz));
  return aus.sort();
}

function pruefeDatei(datei: string, p: JsonPruefer): void {
  try {
    pruefeJsonVoll(JSON.parse(readFileSync(datei, 'utf8')), p);
  } catch (e) {
    throw new Error(`${relative(PUBLIC, datei)}: ${(e as Error).message}`, { cause: e });
  }
}

interface Verzeichnis { name: string; verz: string; pruefer: JsonPruefer[] }

/** Shard-Verzeichnisse: je Lade-Stelle ihr(e) Prüfer. */
const VERZEICHNISSE: Verzeichnis[] = [
  { name: 'materialien/anker', verz: 'materialien/anker', pruefer: [ANKER_PRUEFER] },
  { name: 'materialien/synopse-entwurf', verz: 'materialien/synopse-entwurf', pruefer: [SYNOPSE_ENTWURF_PRUEFER] },
  { name: 'materialien/entstehung', verz: 'materialien/entstehung', pruefer: [ENTSTEHUNG_PRUEFER] },
  { name: 'materialien/synopse', verz: 'materialien/synopse', pruefer: [SYNOPSE_PRUEFER] },
  { name: 'materialien/kanten', verz: 'materialien/kanten', pruefer: [KANTEN_PRUEFER] },
  { name: 'normtext/revisionen', verz: 'normtext/revisionen', pruefer: [NORMTEXT_REVISIONEN_PRUEFER] },
  { name: 'normtext/historie', verz: 'normtext/historie', pruefer: [HISTORIE_PRUEFER] },
  { name: 'normtext/struktur', verz: 'normtext/struktur', pruefer: [NORMTEXT_STRUKTUR_PRUEFER] },
  { name: 'normtext/bund', verz: 'normtext/bund', pruefer: [NORMTEXT_DATEI_PRUEFER, NORMTEXT_SNAPSHOT_PRUEFER] },
  { name: 'normtext/kanton', verz: 'normtext/kanton', pruefer: [NORMTEXT_DATEI_PRUEFER, NORMTEXT_SNAPSHOT_PRUEFER] },
  { name: 'rechtsprechung/bezuege', verz: 'rechtsprechung/bezuege', pruefer: [BEZUEGE_PRUEFER] },
  { name: 'rechtsprechung/norm-index', verz: 'rechtsprechung/norm-index', pruefer: [NORMINDEX_SHARD_PRUEFER] },
  { name: 'rechtsprechung/bund (Entscheide)', verz: 'rechtsprechung/bund', pruefer: [RSPR_DATEI_PRUEFER] },
  { name: 'rechtsprechung/kanton (Entscheide)', verz: 'rechtsprechung/kanton', pruefer: [RSPR_DATEI_PRUEFER] },
  { name: 'verzahnung/artikel-revisionen', verz: 'verzahnung/artikel-revisionen', pruefer: [ARTIKEL_REVISIONEN_PRUEFER] },
];

/** Einzeldateien (Register, Sidecars). */
const EINZELN: Array<[string, JsonPruefer]> = [
  ['materialien/register.json', MATERIALIEN_MANIFEST_PRUEFER],
  ['materialien/register-i18n.json', MATERIALIEN_I18N_PRUEFER],
  ['materialien/deckungs-sicht.json', DECKUNG_PRUEFER],
  ['normtext/register.json', NORMTEXT_MANIFEST_PRUEFER],
  ['normtext/kanton/index.json', NORMTEXT_KANTON_INDEX_PRUEFER],
  ['rechtsprechung/register.json', RSPR_MANIFEST_PRUEFER],
  ['rechtsprechung/richter.json', RSPR_RICHTER_PRUEFER],
  ['rechtsprechung/norm-index.json', NORMINDEX_PRUEFER],
  ['rechtsprechung/norm-index-erlasse.json', NORMINDEX_ERLASS_PRUEFER],
];

describe('Lade-Prüfer gegen die echten Dateien unter public/', () => {
  it.each(EINZELN)('%s besteht den Prüfer der Lade-Stelle (voll)', (rel, p) => {
    expect(existsSync(join(PUBLIC, rel)), `${rel} fehlt`).toBe(true);
    pruefeDatei(join(PUBLIC, rel), p);
  });

  it.each(VERZEICHNISSE.map((v) => [v.name, v] as const))('%s: alle Dateien bestehen den Prüfer', (_n, v) => {
    const alle = dateien(v.verz);
    expect(alle.length, `${v.verz}: keine Dateien`).toBeGreaterThan(0);
    for (const f of alle) for (const p of v.pruefer) pruefeDatei(f, p);
  });

  it('Negativprobe: eine echte Datei ohne Pflichtfeld wird abgewiesen (§6.7)', () => {
    const [datei] = dateien('normtext/revisionen');
    const roh = JSON.parse(readFileSync(datei, 'utf8')) as Record<string, unknown>;
    expect(() => pruefeJsonVoll(roh, NORMTEXT_REVISIONEN_PRUEFER)).not.toThrow();
    delete roh.revisionen;
    expect(() => pruefeJsonVoll(roh, NORMTEXT_REVISIONEN_PRUEFER)).toThrow(/revisionen/);
  });
});
