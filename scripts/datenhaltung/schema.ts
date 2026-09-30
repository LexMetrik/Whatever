// scripts/datenhaltung/schema.ts
// QS-DATA E0+: DB-Artefakt als kanonische Zwischenschicht (CLAUDE.md §7 Build-Regel 6).
//
// Zwei Schichten in EINER Datei je Doktyp (§1/§2.2 Partitionierung — daten/normtext.db ·
// daten/rechtsprechung.db · daten/soft-law.db):
//   (1) Blob-Tabellen (datei/eintrag/dokument): tragen in E0/E0+ die Paritäts-Beweise
//       (JSON → DB → JSON-Roundtrip byte-gleich). Laufen parallel bis E1.
//   (2) Ziel-Tabellen (§3 kanonisches Datenmodell): schema-reif angelegt, in E0+ noch LEER —
//       E1 (Generator-Flip) befüllt sie. Leere Tabellen kosten nichts; eine Nachmigration bei
//       Millionen Zeilen ist teuer, darum jetzt anlegen (§5 E0+ 1).
import { DatabaseSync } from 'node:sqlite';

export type Doktyp = 'normtext' | 'rechtsprechung' | 'soft-law';

// ── (1) Blob-Tabellen (Paritäts-Beweis) ────────────────────────────────────────
// datei/eintrag: strukturierte {erzeugt, eintraege}-Dateien (byte-genaue Rekonstruktion über
// die geordneten Eintrags-Blobs; trailing_nl bildet die Serialisierungs-Variante je Klasse nach
// — Bund/Kanton-Normtext ohne, Rechtsprechung mit abschliessendem "\n").
// dokument: generische Manifeste (Pfad → exakter Byte-Inhalt, reiner Roundtrip-Beweis ohne
// Struktur-Zerlegung, §5 E0+ 3).
const SCHEMA_BLOB = `
CREATE TABLE datei (
  pfad        TEXT PRIMARY KEY,
  typ         TEXT NOT NULL,   -- 'normtext-bund' | 'normtext-kanton' | 'rechtsprechung'
  erzeugt     TEXT,            -- top-level "erzeugt"-Feld (falls vorhanden)
  trailing_nl INTEGER NOT NULL DEFAULT 0   -- 1 = Datei endet auf "\\n" (Rechtsprechung)
);
CREATE TABLE eintrag (
  pfad          TEXT NOT NULL,
  idx           INTEGER NOT NULL,   -- Position in "eintraege" (Reihenfolge = Byte-Parität)
  id            TEXT,               -- indexierte Abfragefelder (Query, später FTS)
  erlass        TEXT,
  artikel       TEXT,
  artikel_label TEXT,
  blob          TEXT NOT NULL,      -- exakte Eintrags-Struktur (garantiert identische Rekonstruktion)
  PRIMARY KEY (pfad, idx)
);
CREATE INDEX idx_eintrag_erlass ON eintrag(erlass);
CREATE TABLE dokument (
  pfad   TEXT PRIMARY KEY,
  typ    TEXT NOT NULL,   -- 'normtext-manifest' | 'rechtsprechung-manifest' | 'materialien-manifest'
  inhalt TEXT NOT NULL    -- exakter Datei-Inhalt (Byte-Roundtrip)
);
`;

// ── (2) Ziel-Tabellen §3 — Normtext-Seite (Erlasse/Fassungen/Artikel + Norm-Referenzen/Ranking) ──
// norm_referenzen + norm_rangliste liegen auf der NORM-/Lese-Seite (Kontext-Panel + Ranking lesen
// sie, §1) → daten/normtext.db. In E0+ leer.
const SCHEMA_ZIEL_NORMTEXT = `
CREATE TABLE erlasse (
  key          TEXT PRIMARY KEY,
  ebene        TEXT NOT NULL,            -- 'bund' | 'kanton'
  kanton       TEXT,
  sr           TEXT,
  abkuerzung   TEXT NOT NULL,
  titel        TEXT NOT NULL,
  rechtsgebiet TEXT NOT NULL,
  status       TEXT NOT NULL             -- ErlassStatus
);
CREATE TABLE erlass_fassungen (
  erlass_key     TEXT NOT NULL REFERENCES erlasse(key),
  fassungs_token TEXT NOT NULL,
  gueltig_von    TEXT NOT NULL,
  gueltig_bis    TEXT,
  stand          TEXT NOT NULL,          -- §7(a)
  quelle_url     TEXT NOT NULL,          -- §7(b)
  as_fundstelle  TEXT,
  abgerufen      TEXT NOT NULL,
  sha            TEXT NOT NULL,
  PRIMARY KEY (erlass_key, fassungs_token)
);
CREATE TABLE artikel (
  erlass_key     TEXT NOT NULL,
  fassungs_token TEXT NOT NULL,
  art_id         TEXT NOT NULL,          -- 'art_41', 'disp_u1_art_1', 'annex_…'
  ord            INTEGER NOT NULL,       -- Emissions-Reihenfolge im Erlass (Byte-Parität der Datei-Sequenz)
  artikel        TEXT NOT NULL,          -- Anzeige-Nummer/Token '41', '52bis'
  artikel_label  TEXT NOT NULL,          -- NormSnapshot.artikelLabel ('Art. 41', '§ 4') — Spalten-Weg (E1)
  grundlage      TEXT,                   -- NormSnapshot.grundlage? (Delegationsnorm-Verweis); NULL = weggelassen
  marg           TEXT,                   -- Randtitel (NormSnapshot.titel; Kanton). Bund E1 = NULL
  aufgehoben     INTEGER,                -- G-AUFH-ART: NormSnapshot.aufgehoben? (1 = aufgehoben) bzw. .gegenstandslos? (2 = gegenstandslos, W2·27); NULL = beide Felder weggelassen
  quelle_url     TEXT NOT NULL,          -- NormSnapshot.quelleUrl (mit Artikel-Anker) — §7(b)/(c)
  bloecke_json   TEXT NOT NULL,
  sha            TEXT NOT NULL,          -- trägt auch die Umzugs-Erkennung (§3.3)
  PRIMARY KEY (erlass_key, fassungs_token, art_id),
  FOREIGN KEY (erlass_key, fassungs_token) REFERENCES erlass_fassungen(erlass_key, fassungs_token)
);
CREATE TABLE norm_referenzen (
  id           INTEGER PRIMARY KEY,
  quelldok_typ TEXT NOT NULL,            -- 'entscheid' | 'material' | 'verwaltungsverordnung'
  quelldok_id  TEXT NOT NULL,
  erlass_key   TEXT NOT NULL,
  artikel      TEXT,
  zitat_key    TEXT NOT NULL,            -- normalisiert (normalisiere-zitat.ts)
  roh_zitat    TEXT NOT NULL,
  konfidenz    TEXT NOT NULL,            -- 'regex-hoch' | 'regex-niedrig' | 'unresolved'
  quelle       TEXT NOT NULL,            -- 'maschinell' | 'kuratiert'
  UNIQUE (quelldok_typ, quelldok_id, erlass_key, artikel, zitat_key)
);
CREATE INDEX ix_normref_norm ON norm_referenzen(erlass_key, artikel);
CREATE INDEX ix_normref_dok  ON norm_referenzen(quelldok_typ, quelldok_id);
CREATE TABLE norm_rangliste (
  erlass_key   TEXT NOT NULL,
  artikel      TEXT,
  entscheid_id TEXT NOT NULL,
  gewicht      INTEGER NOT NULL,
  PRIMARY KEY (erlass_key, artikel, entscheid_id)
);
`;

// ── (2) Ziel-Tabellen §3 — Rechtsprechungs-Seite (Entscheide + Zitat-Graph) ──
// zitat_kanten (Entscheid↔Entscheid) leben bei ihrer Quell-Seite (§1) → daten/rechtsprechung.db.
// entscheide tragen die normalisierten Match-Spalten ecli_key/bge_key + Indizes (§3.1). In E0+ leer.
const SCHEMA_ZIEL_RECHTSPRECHUNG = `
CREATE TABLE entscheide (
  id            TEXT PRIMARY KEY,
  ecli          TEXT,
  ecli_key      TEXT,                    -- normalisiert (normalisiere-zitat.ts)
  gericht       TEXT NOT NULL,
  kanton        TEXT,
  nummer        TEXT NOT NULL,
  bge_referenz  TEXT,                    -- 'BGE 150 III 423' (Anzeige-Form)
  bge_key       TEXT,                    -- normalisiert '150-III-423' (Match-Form)
  datum         TEXT NOT NULL,
  sprache       TEXT NOT NULL,
  leitcharakter INTEGER NOT NULL DEFAULT 0,
  kuratierung   TEXT NOT NULL,           -- 'kuratiert' | 'maschinell'
  regeste_json  TEXT,
  abschnitte_json TEXT,
  quelle        TEXT NOT NULL,
  quelle_url    TEXT NOT NULL,
  abgerufen     TEXT NOT NULL,
  sha           TEXT NOT NULL
);
CREATE INDEX ix_entscheide_ecli  ON entscheide(ecli_key);
CREATE INDEX ix_entscheide_bge   ON entscheide(bge_key);
CREATE INDEX ix_entscheide_datum ON entscheide(gericht, datum);
CREATE TABLE zitat_kanten (
  id             INTEGER PRIMARY KEY,
  von_id         TEXT NOT NULL REFERENCES entscheide(id),
  nach_id        TEXT,
  ziel_key       TEXT NOT NULL,          -- normalisierter Match-Key
  nach_zitierung TEXT NOT NULL,
  konfidenz      TEXT NOT NULL,
  quelle         TEXT NOT NULL,
  UNIQUE (von_id, ziel_key)
);
CREATE INDEX ix_zitat_von        ON zitat_kanten(von_id);
CREATE INDEX ix_zitat_nach       ON zitat_kanten(nach_id);
CREATE INDEX ix_zitat_unresolved ON zitat_kanten(ziel_key) WHERE nach_id IS NULL;
`;

// ── (2) Ziel-Tabellen §3 — Soft-Law (Materialien + Verwaltungsverordnungen in EINER Tabelle) ──
// E6a Stufe 1 (FAHRPLAN-MATERIALIEN-VERZAHNUNG §2.1): die Stufe-1-Zusatzspalten stehen
// DIREKT im CREATE TABLE — die Tabelle ist in E0+ leer (frisches Schema je Lauf), also ist
// das äquivalent zu den §2.1-`ALTER TABLE`-Anweisungen, ohne Migrations-Turnerei.
//   status/entlistet_am/drift_token/quell_ids/stand_quelle: §2.1.
//   drift_token trägt BEWUSST KEINEN Default (§0/A8): ein leerer Default würde das
//   Nicht-leer-Tor (check:materialien) unterlaufen — jeder Insert muss den Wert liefern.
const SCHEMA_ZIEL_SOFTLAW = `
CREATE TABLE soft_law (
  id           TEXT PRIMARY KEY,
  kategorie    TEXT NOT NULL,              -- 'material' | 'verwaltungsverordnung'
  doktyp       TEXT NOT NULL,              -- 'botschaft' | 'kreisschreiben' | 'vernehmlassung' | …
  behoerde     TEXT NOT NULL,
  titel        TEXT NOT NULL,
  fundstelle   TEXT,
  stand        TEXT NOT NULL,
  quelle_url   TEXT NOT NULL,
  abgerufen    TEXT NOT NULL,
  sha          TEXT,
  status       TEXT NOT NULL DEFAULT 'gelistet',  -- 'gelistet' | 'entlistet' (§2.1)
  entlistet_am TEXT,                               -- ISO; gesetzt gdw. status='entlistet'
  drift_token  TEXT NOT NULL,                      -- KEIN Default (§0/A8): Insert muss liefern
  quell_ids    TEXT,                               -- JSON: volatile IDs + url_basis (Q1) — NIE Teil der ID
  stand_quelle TEXT                                -- 'hub-label'|'pdf-text'|'pdf-meta'|'payload'|'toc' (§8)
);
-- Kanten: §3.2-Schema VOLLSTÄNDIG (Nordstern «EIN Query über alle Doktypen», §0/B7),
-- additive Stufe-1-Spalten (fundstelle/fundstelle_url/stand/abgerufen) am Ende.
--   artikel/fundstelle = TEXT NOT NULL DEFAULT '' → '' = Erlass-Ebene bzw. keine Ziffer;
--   KEIN COALESCE im UNIQUE-Key (§0/A2 — node:sqlite verbietet Ausdrücke im Key).
--   Die Projektion normalisiert '' zu einem weggelassenen Feld (§2.1-Kommentar).
--   quelle = 'amtlich' | 'kuratiert' | 'maschinell' — Enum-ERWEITERUNG um 'amtlich'
--   (§0/A3+B7; Nachtrag in FAHRPLAN-DATENHALTUNG §3.2 = M0-Posten). Mappt 1:1 auf
--   VerzahnungsKante.herkunft.
CREATE TABLE norm_referenzen (
  id             INTEGER PRIMARY KEY,
  quelldok_typ   TEXT NOT NULL,             -- 'soft_law'
  quelldok_id    TEXT NOT NULL,
  erlass_key     TEXT NOT NULL,             -- Register-Key, kanonisch, VERSIONSLOS
  artikel        TEXT NOT NULL DEFAULT '',  -- '' = Erlass-Ebene
  zitat_key      TEXT NOT NULL,             -- normalisierter Match-Key (normalisiere-zitat.ts)
  roh_zitat      TEXT NOT NULL,             -- Fedlex-Anker-Href | Dateiname | Titel-String (Audit)
  konfidenz      TEXT NOT NULL,             -- 'regex-hoch' | 'regex-niedrig' | 'unresolved'
  quelle         TEXT NOT NULL,             -- 'amtlich' | 'kuratiert' | 'maschinell'
  fundstelle     TEXT NOT NULL DEFAULT '',  -- 'Ziff. 6.10' | ''
  fundstelle_url TEXT,                       -- RELATIV zur url_basis des Dokuments (Churn-Dämpfung §0/A11)
  stand          TEXT NOT NULL,             -- Stand der Quell-Seite/Version (§7 a)
  abgerufen      TEXT NOT NULL,
  UNIQUE (quelldok_typ, quelldok_id, erlass_key, artikel, zitat_key, fundstelle)
);
CREATE INDEX ix_normref_erlass ON norm_referenzen(erlass_key, artikel);
-- Snapshots (§2.2): inhalt = NUR das extrahierte Substrat (<main>/Nuxt-Payload/ToC-XHTML),
-- gzip-komprimiert (§0/A13). Lokal (DB gitignored); der committete Beleg ist das
-- Zustands-Manifest bibliothek/register/soft-law-zustand.jsonl (§2.3). DB-Grössenbudget
-- 50 MB im Offline-Tor.
CREATE TABLE quell_snapshot (
  quelle    TEXT NOT NULL,
  abgerufen TEXT NOT NULL,
  sha       TEXT NOT NULL,
  inhalt    BLOB
);
`;

const ZIEL_SCHEMA: Record<Doktyp, string> = {
  normtext: SCHEMA_ZIEL_NORMTEXT,
  rechtsprechung: SCHEMA_ZIEL_RECHTSPRECHUNG,
  'soft-law': SCHEMA_ZIEL_SOFTLAW,
};

export function oeffneDb(pfad = ':memory:'): DatabaseSync {
  const db = new DatabaseSync(pfad);
  db.exec('PRAGMA journal_mode = MEMORY;');
  return db;
}

/** Legt Blob-Tabellen (Paritäts-Beweis) + die Ziel-Tabellen des Doktyps an. */
export function frischesSchema(db: DatabaseSync, doktyp: Doktyp): void {
  db.exec(SCHEMA_BLOB);
  db.exec(ZIEL_SCHEMA[doktyp]);
}
