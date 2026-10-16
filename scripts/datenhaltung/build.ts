// scripts/datenhaltung/build.ts
// QS-DATA E0+/E2-Vorarbeiten: baut die drei persistenten, gitignorten DB-Artefakte je Doktyp (§1/§2.2):
//   daten/normtext.db · daten/rechtsprechung.db · daten/soft-law.db.
// Das E0-Einzelartefakt daten/lexmetrik.db entfällt ersatzlos (Neuerzeugung billig). Die
// Artefakte sind Werk-Zwischenprodukt; massgeblich bleibt die amtliche Quelle (CLAUDE.md §7/6).
//
// E2-Vorarbeiten (W2·6-DATA): zusätzlich die HOT-FTS5-Tabellen (fts.ts, §3/§11.5) —
// fts_artikel (normtext.db) + fts_entscheide_schaufenster (rechtsprechung.db). Die COLD-
// Masse (fts_entscheide_masse) entsteht erst mit E3 auf dem Self-Host (nicht hier).
import { mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { oeffneDb, frischesSchema, type Doktyp } from './schema';
import {
  ingestNormtext,
  ingestNormtextZiel,
  ingestRechtsprechung,
  ingestSoftLaw,
  type Zaehler,
} from './ingest';
import { baueFtsArtikel, baueFtsEntscheideSchaufenster } from './fts';
import { messeReplizierteBaeume, pruefeAbdeckung, bewerteHotBudget } from './hot-groesse';
import type { DatabaseSync } from 'node:sqlite';

// Normtext: Blob-Tabellen (Paritäts-Beweis) + ab E1 die ECHTEN Ziel-Tabellen (Spalten-Weg).
function ingestNormtextVoll(db: DatabaseSync): Zaehler {
  return { ...ingestNormtext(db), ...ingestNormtextZiel(db) };
}

const ALT_ARTEFAKT = 'daten/lexmetrik.db';
const ARTEFAKTE: {
  pfad: string;
  doktyp: Doktyp;
  ingest: (db: DatabaseSync) => Zaehler;
  fts?: (db: DatabaseSync) => Zaehler;
}[] = [
  {
    pfad: 'daten/normtext.db',
    doktyp: 'normtext',
    ingest: ingestNormtextVoll,
    // `fts_artikel ohne Struktur` wird MITGEDRUCKT (§8): die Recall-Felder m/n/g/f
    // speisen sich aus dem Struktur-Sidecar, und Artikel ohne Sidecar tragen sie
    // leer. Diese Zahl darf nicht still wachsen — sie ist die Abdeckungs-Anzeige
    // der Recall-Parität (K1). Stand 31.8.2026: 2264 von 56 113 (4.03 %).
    fts: (db) => {
      const b = baueFtsArtikel(db);
      return { 'fts_artikel': b.zeilen, 'fts_artikel ohne Struktur': b.ohneStruktur };
    },
  },
  { pfad: 'daten/rechtsprechung.db', doktyp: 'rechtsprechung', ingest: ingestRechtsprechung, fts: (db) => ({ 'fts_entscheide_schaufenster': baueFtsEntscheideSchaufenster(db) }) },
  { pfad: 'daten/soft-law.db', doktyp: 'soft-law', ingest: ingestSoftLaw },
];

function mib(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MiB';
}

mkdirSync('daten', { recursive: true });
if (existsSync(ALT_ARTEFAKT)) rmSync(ALT_ARTEFAKT); // E0-Monolith ersatzlos entfernt

// HOT-Budget (§11.5): gemessen wird nur, was turso-sync nach Turso schreibt (hot-groesse.ts),
// gegen die Speichergrenze des Turso-Gratisplans (5 GB) — nicht die Dateigroesse der Artefakte.
let hotBytes = 0;
const gefundenJeArtefakt: Array<readonly string[]> = [];
for (const { pfad, doktyp, ingest, fts } of ARTEFAKTE) {
  if (existsSync(pfad)) rmSync(pfad);
  const db = oeffneDb(pfad);
  frischesSchema(db, doktyp);
  const z = ingest(db);
  const zFts = fts ? fts(db) : {};
  const repliziert = messeReplizierteBaeume(db); // vor close(): dbstat liest die offene DB
  db.close();
  const bytes = statSync(pfad).size;
  hotBytes += repliziert.bytes;
  gefundenJeArtefakt.push(repliziert.gefunden);
  const teile = Object.entries({ ...z, ...zFts }).map(([k, v]) => `${k} ${v}`).join(' · ');
  console.log(`datenhaltung:build — ${pfad} (${teile}) [${mib(bytes)}]`);
  console.log(`datenhaltung:build — ${pfad}: repliziert ${mib(repliziert.bytes)} (Datei ${mib(bytes)})`);
}
// Jede replizierte Tabelle muss in genau einem Artefakt liegen, sonst ist die Summe unvollstaendig.
const abdeckung = pruefeAbdeckung(gefundenJeArtefakt);
if (abdeckung.length > 0) {
  console.error(`datenhaltung:build ROT — HOT-Messung unvollstaendig: ${abdeckung.join('; ')}`);
  process.exit(1);
}
const budget = bewerteHotBudget(hotBytes);
console.log(`datenhaltung:build — ${budget.zeile}`);
