// scripts/materialien/botschaften-generieren-run.ts
// Dünner CLI-Runner des Botschaften-Generators (Paket 2, W2·6). Getrennt vom reinen
// Modul botschaften-generieren.ts, damit dieses seiteneffektfrei importierbar bleibt
// (Test + check:botschaften-netz) — Repo-Muster material-manifest / soft-law-projektion(-run).
//
// §2: --datum aus der Shell (kein Date.now). Netz-Lauf.
// Aufruf: npm run materialien:botschaften -- --datum=$(date +%F)
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  grundmenge, holeBindings, baueBotschaften, serialisiere, sortiereBindings, filtereBotschaftsKanten,
} from './botschaften-generieren.ts';
import { auswirkungsIndex, ladeAuswirkungsQuellen, REVISIONEN_RAW_DIR } from './botschaften-auswirkungen.ts';
import {
  holeEreignisBindings, baueEreignisse,
} from './verfahrens-ereignisse.ts';

const datumArg = process.argv.find((a) => a.startsWith('--datum='));
const heute = datumArg ? datumArg.slice('--datum='.length) : '';
if (!/^\d{4}-\d{2}-\d{2}$/.test(heute)) { console.error('--datum=YYYY-MM-DD nötig (§2)'); process.exit(1); }

const meta = grundmenge();
console.log(`botschaften: Grundmenge ${meta.length} Bund-Volltext-Erlasse → SPARQL-Reverse-Kette …`);
// M-5: Fedlex-Auswirkungen aus dem committeten Revisionen-store-raw (kein zweiter Crawl).
const quellen = ladeAuswirkungsQuellen(meta.map((m) => m.key));
if (quellen.length !== meta.length) {
  console.error(`botschaften: Auswirkungen nur für ${quellen.length}/${meta.length} Erlasse in ${REVISIONEN_RAW_DIR} — erst normtext:revisionen laufen lassen.`);
  process.exit(1);
}
const auswirkungen = auswirkungsIndex(quellen);
console.log(`botschaften: Auswirkungs-Index ${auswirkungen.size} oc (Rechtsetzungs-Typen)`);
const bindings = filtereBotschaftsKanten(await holeBindings(meta, fetch, 'bibliothek/materialien/botschaften-raw'));

// E1 (§11.7): zweiter Durchgang gegen denselben Endpunkt — Verfahrenskette je
// Projekt-Knoten. Die proj-Menge stammt aus dem ersten Durchgang (kein Raten).
const projUris = [...new Set(bindings.map((b) => b.proj?.value).filter((v): v is string => !!v))].sort();
console.log(`botschaften: ${projUris.length} Projekt-Knoten → Verfahrens-Ereignisse (type-projet) …`);
const evBindings = await holeEreignisBindings(projUris);
// store-raw (§11): EINE deterministisch sortierte Roh-Datei → Re-Parse ohne Re-Crawl.
mkdirSync('bibliothek/materialien/verfahren-raw', { recursive: true });
writeFileSync('bibliothek/materialien/verfahren-raw/ereignisse.json',
  JSON.stringify(sortiereBindings(evBindings), null, 2) + '\n', 'utf8');
const ereignisseProProj = baueEreignisse(evBindings);

const eintraege = baueBotschaften(bindings, meta, ereignisseProProj, auswirkungen);

// Zukunfts-Guard (§8-Ehrlichkeit): kein stand > heute.
const zukunft = eintraege.filter((e) => e.stand > heute);
if (zukunft.length) { console.error(`botschaften: ${zukunft.length} Einträge mit stand > ${heute} (Zukunft) — abbrechen.`); process.exit(1); }

writeFileSync('src/lib/materialien/botschaften.generated.ts', serialisiere(eintraege), 'utf8');

const mitCuria = eintraege.filter((e) => e.nummer).length;
const mantel = eintraege.filter((e) => e.normKeys.length > 1).length;
const srMitTreffer = new Set(eintraege.flatMap((e) => e.normKeys)).size;
console.log(`botschaften: ${eintraege.length} Botschaften → src/lib/materialien/botschaften.generated.ts`);
console.log(`  Curia ${mitCuria}/${eintraege.length} · Mantelerlass ${mantel} · Erlasse mit ≥1 Botschaft ${srMitTreffer}/${meta.length}`);
const mitEreignissen = eintraege.filter((e) => e.ereignisse?.length).length;
const ereignisZahl = eintraege.reduce((n, e) => n + (e.ereignisse?.length ?? 0), 0);
console.log(`  Verfahrens-Ereignisse ${ereignisZahl} über ${mitEreignissen}/${eintraege.length} Botschaften (${projUris.length} Projekt-Knoten)`);
