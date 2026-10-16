// scripts/datenhaltung/fts.ts
// QS-DATA E2-Vorarbeiten (W2·6-DATA): baut die HOT-FTS5-Tabellen build-time
// (FAHRPLAN-DATENHALTUNG §3 DDL + §11.5 hot/cold-Grenze).
//
// HOT (nach Turso repliziert; Budget = Speichergrenze Turso Free 5 GB, gemessen über dbstat in
// hot-groesse.ts — vorher «< 1 GB» ohne Quelle; das IST der E2-POC-Zuschnitt):
//   - fts_artikel                    (contentless, 6 Felder, ALLE Erlasse Bund+Kanton)
//   - fts_entscheide_schaufenster    (standalone, ALLE Einträge der rechtsprechung.db)
//
// RECALL-PARITÄT 31.8.2026 (QS-BASIS (d) K1): `fts_artikel` trug bis dahin nur den
// Artikeltext und fand darum systematisch weniger als der statische Client-Index.
// Seit K1 indexiert er dieselben sechs Felder (Extraktion geteilt via
// scripts/suche-felder.ts, §5) und liegt lokal wie remote CONTENTLESS. Begründung
// beider Wechsel steht am Kopf von baueFtsArtikel().
//
// ZAHLEN-KORREKTUR 20.7.2026 (§5/§8): hier standen bis dahin „218 Bund-Erlasse" und „342
// kuratierte Schaufenster-Entscheide". Beides beschrieb den E2-Erstzuschnitt und war zur
// laufenden Korpus-Erweiterung nie nachgeführt worden — der Code filtert an KEINER Stelle,
// er nimmt schlicht alle Zeilen. Ist-Stand 20.7.2026: 1458 Erlasse / 55'822 Artikel und
// 5093 Entscheide (BS-Import #300 u. a.). Konkrete Zahlen stehen darum bewusst NICHT mehr
// in diesen Kommentaren — sie veralten still und erzeugen genau die irreführende Doku, die
// §8 verbietet. Massgeblich ist der jeweils gemessene Stand aus `npm run datenhaltung:build`
// bzw. `daten-manifest.json`.
//
// COLD (server-only, NIE embedded): fts_entscheide_masse — der 58-GB-Vollkorpus-Index
// entsteht erst mit E3 auf dem Self-Host-VPS (§11.5). Wird hier BEWUSST NICHT gebaut,
// nur als Schema-Kommentar dokumentiert (siehe MASSE_SCHEMA_DOKU unten).
//
// Tokenizer exakt `unicode61 remove_diacritics 2` (§3): diakritik-insensitiv für DE/FR/IT
// (empirisch verifiziert: «verjahrung» trifft «Verjährung», «rechtsoffnung» → «Rechtsöffnung»).
//
// Die FTS-Tabellen werden NUR im on-disk-Build (build.ts) angelegt — NICHT in
// frischesSchema()/berechneManifest(). Grund: das Dump-Manifest (check:datenhaltung)
// beweist Determinismus über die QUELL-Tabellen; der FTS-Index ist eine reine Ableitung
// daraus (rebuildbar) und wird aus dem Manifest ausgeklammert (manifest.ts → tabellen()).
import type { DatabaseSync } from 'node:sqlite';
import { bloeckeText, FTS_ARTIKEL_SPALTEN } from './suche-kern';
import { baueRecallFelder, type Block, type StrukturArtikel } from '../suche-felder';

// Vercel-Fix 3.7.2026: `bloeckeText` (+ Doku) ist in das IMPORT-FREIE ./suche-kern.ts
// gewandert — api/suche.ts braucht es (Snippet-Bau) und darf keine node:sqlite-Kette
// ziehen (Vercels Function-Compile). Re-Export für bestehende Konsumenten:
export { bloeckeText, FTS_ARTIKEL_SPALTEN };

/** Tokenizer-Spezifikation (§3, nicht verhandelbar): diakritik-insensitiv DE/FR/IT. */
export const TOKENIZER = 'unicode61 remove_diacritics 2';

/** Durchsuchbarer Plaintext der Entscheid-Abschnitte: alle `bloecke[].text`, normalisiert. */
interface Abschnitt {
  bloecke?: Array<{ text?: string }>;
}
export function abschnitteText(abschnitte: Abschnitt[] | undefined): string {
  const teile: string[] = [];
  for (const a of abschnitte ?? []) for (const b of a.bloecke ?? []) if (b.text) teile.push(b.text);
  return teile.join(' ').replace(/\s+/g, ' ').trim();
}

/** DDL von `fts_artikel` — EINE Quelle für lokal und remote (§5). Die Spaltenliste
 *  kommt aus suche-kern.ts, weil nur sie von BEIDEN Ausführungswegen erreichbar ist. */
export function ddlFtsArtikel(name: string): string {
  return `CREATE VIRTUAL TABLE ${name} USING fts5(${FTS_ARTIKEL_SPALTEN.join(', ')}, content='', tokenize='${TOKENIZER}')`;
}

/** Spalten von `fts_entscheide_schaufenster` in Index-Reihenfolge — standalone
 *  (Text physisch gespeichert, damit die native `snippet()` verfügbar ist).
 *  `id`/`quelle_url` sind UNINDEXED: sie werden zurückgegeben, nicht durchsucht. */
export const FTS_ENTSCHEIDE_SPALTEN = [
  'id UNINDEXED',
  'titel',
  'regeste',
  'text',
  'quelle_url UNINDEXED',
] as const;

/**
 * DDL von `fts_entscheide_schaufenster` — EINE Quelle für lokal und remote (§5).
 *
 * Bis zum 31.8.2026 stand diese Spaltenliste ZWEIMAL wörtlich im Repo: hier für die
 * lokale Tabelle und ein zweites Mal von Hand in turso-sync.ts für die Replika. Genau
 * davor warnt der Kommentar an der Sync-Stelle für `fts_artikel` — «eine Abweichung in
 * Zahl oder Reihenfolge der Spalten liesse den Shadow-Transport NICHT scheitern, sondern
 * legte die Gewichte auf das falsche Feld» —, nur war die Warnung für die Entscheide
 * selbst nie eingelöst (Gegenprüfungs-Befund F1, Umfeld). Jetzt ist sie es.
 */
export function ddlFtsEntscheide(name: string): string {
  return `CREATE VIRTUAL TABLE ${name} USING fts5(${FTS_ENTSCHEIDE_SPALTEN.join(', ')}, tokenize='${TOKENIZER}')`;
}

interface StrukturDatei {
  artikel?: Record<string, StrukturArtikel>;
}

/** Ergebnis von `baueFtsArtikel` — Zeilenzahl UND Struktur-Abdeckung. */
export interface FtsArtikelBericht {
  /** Indexierte Zeilen (MUSS == artikel-Zeilen sein; der Such-Join hängt daran). */
  zeilen: number;
  /** Artikel ohne Struktur-Sidecar-Eintrag → m/n/g/f bleiben leer (§8: nicht still). */
  ohneStruktur: number;
}

/**
 * fts_artikel — CONTENTLESS FTS5 (`content=''`), rowid == artikel.rowid.
 *
 * SECHS SPALTEN statt einer (QS-BASIS (d) K1, 31.8.2026). Bis dahin trug der Index
 * allein `bloeckeText(bloecke_json)` — also nur das, was der statische Client-Index
 * als Feld `t` führt. Die fünf Recall-Felder m/n/g/tb/f (21.5 % des Rohtextes) hatten
 * am Edge kein Gegenstück, und der DB-Weg fand darum systematisch weniger als der
 * statische: Query «Miete» lieferte OR 253 und OR 267 mit NULL Treffern, während zehn
 * kantonale Gebührenerlasse die Liste anführten (Messung K0, bibliothek/register/
 * suche-edge-nullprobe-2026-08-31.md Ziff. 3). Still war der Fehler, weil die Antwort
 * nie leer war — nur schlechter. Die Extraktion teilt sich der Index jetzt mit dem
 * Generator (scripts/suche-felder.ts, §5).
 *
 * WARUM CONTENTLESS UND NICHT MEHR `content='artikel'` (Wechsel im selben Schritt):
 * Die alte Deklaration behauptete eine Spalte `text` auf `artikel` — die es dort nie
 * gab. Das trug nur, weil ausschliesslich MATCH/bm25/rowid gelesen werden; ein blosses
 * `SELECT count(*) FROM fts_artikel` OHNE MATCH scheitert heute schon mit «no such
 * column: T.text» (am 31.8.2026 reproduziert). Mit sechs Spalten hätte die Lüge fünf
 * weitere nicht existierende Spalten behauptet — und `marginalie` hätte auf Rebuild
 * die ECHTE, anders belegte `artikel.marg`-Spalte gelesen. Die Turso-Gegenseite ist
 * ohnehin seit jeher contentless (turso-sync.ts); lokal dasselbe zu deklarieren
 * entfernt die Divergenz, statt sie auf sechs Spalten auszuweiten. Snippets waren nie
 * betroffen — die baut suche-kern.ts deterministisch aus `bloecke_json`.
 *
 * Insert-Reihenfolge = artikel.rowid → deterministischer Segment-Aufbau (§2).
 * LEFT JOIN auf `erlasse`: ein Artikel ohne Erlass-Zeile darf NICHT aus dem Index
 * fallen — die Zeilengleichheit fts_artikel == artikel ist die Invariante, an der
 * der Such-Join und der Index-Riegel des Syncs hängen.
 */
export function baueFtsArtikel(db: DatabaseSync): FtsArtikelBericht {
  db.exec(ddlFtsArtikel('fts_artikel') + ';');

  // Struktur-Sidecars kommen aus der DB (ingest.ts legt sie als `dokument` mit
  // typ='normtext-struktur' ab) — NICHT aus dem Dateisystem. So bleibt der FTS-Bau
  // eine reine Funktion der DB und funktioniert auch für in-memory-Aufbauten (Tests).
  const strukturen = new Map<string, StrukturDatei>();
  for (const r of db
    .prepare("SELECT pfad, inhalt FROM dokument WHERE typ = 'normtext-struktur'")
    .all() as Array<{ pfad: string; inhalt: string }>) {
    // pfad = public/normtext/struktur/<ebene>/<erlass_key>.json → Schlüssel '<ebene>/<key>'
    const m = /\/struktur\/([^/]+)\/(.+)\.json$/.exec(r.pfad);
    if (!m) continue;
    try {
      strukturen.set(`${m[1]}/${m[2]}`, JSON.parse(r.inhalt) as StrukturDatei);
    } catch {
      /* unlesbarer Sidecar → Felder bleiben leer, wie im statischen Index */
    }
  }

  const rows = db
    .prepare(
      `SELECT a.rowid AS rowid, a.erlass_key AS erlass_key, a.artikel AS artikel,
              a.grundlage AS grundlage, a.bloecke_json AS bloecke_json, e.ebene AS ebene
       FROM artikel a LEFT JOIN erlasse e ON e.key = a.erlass_key
       ORDER BY a.rowid`,
    )
    .all() as Array<{
    rowid: number;
    erlass_key: string;
    artikel: string;
    grundlage: string | null;
    bloecke_json: string;
    ebene: string | null;
  }>;

  const ins = db.prepare(
    `INSERT INTO fts_artikel(rowid, ${FTS_ARTIKEL_SPALTEN.join(', ')}) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  let ohneStruktur = 0;
  for (const r of rows) {
    const sa = r.ebene ? strukturen.get(`${r.ebene}/${r.erlass_key}`)?.artikel?.[r.artikel] : undefined;
    if (!sa) ohneStruktur++;
    const bloecke = JSON.parse(r.bloecke_json) as Block[];
    const f = baueRecallFelder(bloecke, sa, r.grundlage);
    ins.run(r.rowid, bloeckeText(r.bloecke_json), f.m, f.n, f.g, f.tb, f.f);
  }
  return { zeilen: rows.length, ohneStruktur };
}

/**
 * fts_entscheide_schaufenster — STANDALONE (self-contained) FTS5. Die Ziel-Tabelle
 * `entscheide` ist in E0+/E1/E2-Vorarbeiten LEER (befüllt erst E3), darum external
 * content unmöglich → gespeist wird aus den Blob-Einträgen (`eintrag`-Tabelle der
 * rechtsprechung.db). Spalten: id/quelle_url UNINDEXED (Rückgabe/Join ohne Index),
 * titel/regeste/text indexiert. Native `snippet()` ist hier verfügbar (Text physisch
 * gespeichert). Insert-Reihenfolge = (pfad, idx) → deterministisch.
 *
 * UMFANG (klargestellt 20.7.2026): ALLE `eintrag`-Zeilen, ohne jeden Filter. Der Kommentar
 * sprach früher von „den 342 kuratierten Schaufenster-Entscheiden" — das war der Stand der
 * E2-Erstfassung und beschrieb den Code schon länger falsch. Der Name „Schaufenster" trennt
 * hier HOT von COLD (`fts_entscheide_masse`, E3/VPS), er bezeichnet keine Auswahl innerhalb
 * der HOT-Daten. Wichtig fürs Produkt (§8): die Suche kennt damit denselben Entscheid-Korpus,
 * den der Reader zeigt — es gibt keine stille Teilmenge, über die Nutzer getäuscht würden.
 * @returns Zeilenzahl (== Anzahl `eintrag`-Zeilen der rechtsprechung.db).
 */
export function baueFtsEntscheideSchaufenster(db: DatabaseSync): number {
  db.exec(ddlFtsEntscheide('fts_entscheide_schaufenster') + ';');
  const rows = db.prepare('SELECT blob FROM eintrag ORDER BY pfad, idx').all() as Array<{ blob: string }>;
  const ins = db.prepare(
    'INSERT INTO fts_entscheide_schaufenster(id, titel, regeste, text, quelle_url) VALUES (?, ?, ?, ?, ?)',
  );
  for (const r of rows) {
    const e = JSON.parse(r.blob) as {
      id: string;
      zitierung?: string;
      nummer?: string;
      regeste?: { text?: string };
      abschnitte?: Abschnitt[];
      quelleUrl?: string;
    };
    ins.run(
      e.id,
      e.zitierung ?? e.nummer ?? '',
      e.regeste?.text ?? '',
      abschnitteText(e.abschnitte),
      e.quelleUrl ?? '',
    );
  }
  return rows.length;
}

// ── COLD (E3, NICHT hier bauen) — nur Schema-Dokumentation (§11.5) ────────────────
// fts_entscheide_masse entsteht mit dem BGer-Massen-Import (E3) auf dem Self-Host-VPS,
// als STANDALONE FTS5 über den 191k+-Vollkorpus. Bleibt server-only, nie in die
// Edge-Replika eingebettet (58-GB-Index sprengt jedes Edge-Budget). Ziel-DDL:
//   CREATE VIRTUAL TABLE fts_entscheide_masse USING fts5(
//     id UNINDEXED, titel, regeste, text, quelle_url UNINDEXED,
//     tokenize='unicode61 remove_diacritics 2');
export const MASSE_SCHEMA_DOKU =
  "fts_entscheide_masse: cold, server-only, entsteht mit E3 (nicht build-time gebaut, §11.5).";
