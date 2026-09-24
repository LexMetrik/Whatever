// scripts/materialien/soft-law-projektion-run.ts
// Dünner CLI-Runner der Soft-Law-Projektion (§2.7). Getrennt vom reinen Modul
// soft-law-projektion.ts, damit dieses seiteneffektfrei importierbar bleibt
// (check:materialien + Tests) — vgl. Repo-Muster material-manifest / *-run.
//
// §2: --datum kommt aus der Shell (kein Date.now). Aufruf: npm run materialien -- --datum=$(date +%F)
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  projiziereRegister,
  projiziereShards,
  baueKorpusInfo,
  ladeKantenAusDb,
  dbDokAusZustand,
  schreibeShardsUndBereinige,
  sammleKantenDokIds,
  teileRegister,
  REGISTER_PFAD,
  REGISTER_I18N_PFAD,
  REGISTER_PROVENIENZ_PFAD,
  SOFT_LAW_DB,
  type NormRefRow,
  type DokMeta,
} from './soft-law-projektion.ts';
import { ladeZustand } from './soft-law-zustand.ts';
import { schreibeKantenErlasse } from './kanten-erlasse.ts';
import { pruefeDbVollstaendigkeit, pruefeKantenVollstaendigkeit, nurGelistete } from './db-vollstaendigkeit.ts';

const datumArg = process.argv.find((a) => a.startsWith('--datum='));
const datum = datumArg?.slice('--datum='.length);
if (!datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
  console.error('soft-law-projektion: --datum=YYYY-MM-DD erforderlich (§2, kein Date.now).');
  process.exit(1);
}

// dbDocs IMMER aus dem committeten Zustands-Manifest (§0/B2) — nie aus der DB (keine Divergenz).
const dbDocs = dbDokAusZustand(ladeZustand());
let kanten: NormRefRow[] = [];
let dokMeta = new Map<string, DokMeta>();
if (existsSync(SOFT_LAW_DB)) {
  const db = new DatabaseSync(SOFT_LAW_DB);
  ({ kanten, dokMeta } = ladeKantenAusDb(db));
  db.close();
} else {
  console.log(`soft-law-projektion: ${SOFT_LAW_DB} fehlt — Kanten-Shards aus DB entfallen (register.json aus Zustands-Manifest, §8).`);
}

// Vollständigkeits-Wache VOR jedem Schreiben (A2c, Gegenprüfung PR #815 zu #703-Nachzug):
// dieselben zwei Dimensionen wie check-materialien.ts (Dokument-Meta UND Kanten). Eine DB, die
// nur EINE gecrawlte Quelle trägt, besteht die bisherige `kanten.length > 0`-Wache trotzdem —
// `projiziereShards` läse dann die Kanten der FEHLENDEN Quellen als "nicht mehr projiziert" und
// `schreibeShardsUndBereinige` LÖSCHTE deren committete Shards (dieselbe Beinahe-Datenverlust-
// Klasse wie die hohle-DB-Lehre 21.7.2026, nur durch einen Teilstand statt einer leeren DB
// ausgelöst). Klarer Abbruch VOR dem Register-Schreiben statt stillem Weiterlaufen — kein
// Löschen, kein Teil-Schreiben.
if (kanten.length > 0) {
  const dokMetaIds = new Set(dokMeta.keys());
  const dbKantenDokIds = new Set(kanten.map((k) => k.quelldok_id));
  const gelistetIds = new Set(dbDocs.map((d) => d.key));
  const dokMetaVollstaendigkeit = pruefeDbVollstaendigkeit(gelistetIds, dokMetaIds);
  // A4 (Gegenprüfung PR #815, Deadlock): siehe nurGelistete-Docstring in db-vollstaendigkeit.ts —
  // ein entlistetes Dokument darf hier fehlen, dieser Lauf bereinigt seine Shard-Kante gerade.
  const kantenVollstaendigkeit = pruefeKantenVollstaendigkeit(nurGelistete(sammleKantenDokIds(), gelistetIds), dbKantenDokIds);
  if (!dokMetaVollstaendigkeit.vollstaendig || !kantenVollstaendigkeit.vollstaendig) {
    const fehlend = [...new Set([...dokMetaVollstaendigkeit.fehlendeIds, ...kantenVollstaendigkeit.fehlendeIds])];
    console.error(
      `soft-law-projektion: ${SOFT_LAW_DB} unvollständig geladen (${fehlend.length} Dokument(e) ohne volle ` +
        `Dok-Meta- und/oder Kanten-Deckung, z. B. ${fehlend.slice(0, 3).join(', ')}${fehlend.length > 3 ? ', …' : ''}) ` +
        `— Abbruch VOR jedem Schreiben (§17-Wurzelfix A2c): ein Teilstand darf committete Shards weder ` +
        `überschreiben noch als Orphan löschen. Vollen Snapshot aller Quellen fahren, dann erneut.`,
    );
    process.exit(1);
  }
}

// (1) Die DREI Register-Projektionen aus EINEM Lauf (Trailing-Newline wie bisher).
//     Kern · FR/IT-Titel · Provenienz — Aufteilung und Messung: bibliothek/
//     materialien/2026-09-12-register-deckel-messung.md. Alle drei entstehen
//     gemeinsam; wer nur eine schreibt, erzeugt eine zweite Wahrheit (§5).
const register = projiziereRegister(datum, dbDocs);
const { kern, i18n, provenienz } = teileRegister(register);
mkdirSync(dirname(REGISTER_PFAD), { recursive: true });
writeFileSync(REGISTER_PFAD, JSON.stringify(kern, null, 2) + '\n', 'utf8');
writeFileSync(REGISTER_I18N_PFAD, JSON.stringify(i18n, null, 2) + '\n', 'utf8');
writeFileSync(REGISTER_PROVENIENZ_PFAD, JSON.stringify(provenienz, null, 2) + '\n', 'utf8');

// (2) Kanten-Shards + Orphan-Bereinigung — NUR mit Harvest-Kanten (J3-Lehre
// 29.8.2026, §17): eine fehlende oder hohle soft-law.db (nur Blob-Ingest,
// norm_referenzen leer — z.B. frischer Worktree oder nach datenhaltung:build)
// lieferte kanten=[] und die Orphan-Bereinigung LOESCHTE alle committeten
// Shards (33k Zeilen, Beinahe-Datenverlust). Gleiche Bedingung wie die
// `reprojektionsfaehig`-Wache in check-materialien.ts (Falsch-Rot 21.7.2026):
// ohne Kanten bleiben die committeten Shards unangetastet, protokolliert.
let dateien: ReturnType<typeof projiziereShards>['dateien'] = [];
let downgrades: ReturnType<typeof projiziereShards>['downgrades'] = [];
let nichtProjiziert: ReturnType<typeof projiziereShards>['nichtProjiziert'] = [];
let geschrieben = 0, entfernt = 0;
if (kanten.length > 0) {
  ({ dateien, downgrades, nichtProjiziert } = projiziereShards(datum, kanten, dokMeta, baueKorpusInfo()));
  ({ geschrieben, entfernt } = schreibeShardsUndBereinige(dateien));
} else {
  console.log('soft-law-projektion: keine Harvest-Kanten (DB fehlt oder hohl) — Shards bleiben unangetastet (kein Orphan-Loeschen).');
}
// (3) Existenzliste der Shard-Köpfe (kanten-erlasse.ts) — IMMER aus dem Verzeichnis nach dem
// Schreiben, damit Liste und Shards nie auseinanderlaufen (Drift-Tor: check:materialien).
const kantenErlasse = schreibeKantenErlasse();
for (const d of downgrades) console.log(`  Downgrade: ${d.dok} · ${d.erlass} Art. ${d.artikel} → Erlass-Ebene (${d.grund})`);
for (const n of nichtProjiziert) console.log(`  nicht projiziert: ${n.dok} · ${n.erlass} (${n.grund})`);

console.log(
  `soft-law-projektion (--datum=${datum}): register.json ${kern.materialien.length} Materialien ` +
    `(+ register-i18n.json ${Object.keys(i18n.titel).length} FR/IT-Titel · register-provenienz.json ${Object.keys(provenienz.eintraege).length} Einträge) ` +
    `(${register.materialien.length - dbDocs.length} kuratiert · ${dbDocs.length} DB); ` +
    `Shards ${dateien.length} Datei(en) [${geschrieben} geschrieben · ${entfernt} orphan · ${kantenErlasse} Erlass-Köpfe gelistet] · ` +
    `${downgrades.length} Downgrades · ${nichtProjiziert.length} nicht projiziert.`,
);
