// scripts/datenhaltung/erlass-rows.ts
// QS-DATA E1 (Generator-Flip): der Spalten-Weg für Erlass-Dateien — BUND und KANTON.
//
// EINE Wahrheit für zwei Richtungen:
//   (1) schreibeErlass()  — NormSnapshot[] EINER Datei → Zeilen in erlasse +
//       erlass_fassungen + artikel (kein Blob, echte Spalten, §5 E1).
//   (2) projiziereErlass() — dieselben Zeilen → BYTE-GLEICHE public/*.json-Form
//       (Re-Serialisierung in exakter NormSnapshot-Feldreihenfolge; kein Feld-Remapping).
//
// Drei Aufrufer teilen sich diese Funktionen (Determinismus = derselbe Code):
//   - Reverse-Ingest (ingest.ts → daten/normtext.db, Dump-Manifest-Grundlage),
//   - Generator-Flip (generator-flip.ts ← normtext-snapshot.ts, public kommt aus der Projektion),
//   - Doppellauf + Unit-Test (Byte-Beweis alt==neu).
//
// SCHLÜSSEL vs. QUELLE (E1-Rest B, 3.7.2026 — Kanton-Flip): der erlasse-PK `meta.key`
// ist NICHT identisch mit der byte-tragenden NormSnapshot.quelle (2. id-Segment):
//   - Bund : key == quelle == gesetzKey ('OR'); kanton == null; id = 'bund/OR/art_11'.
//   - Kanton: key == Register-/Dateiname-Stamm ('AG-291.150', mit Bindestrich);
//     quelle == Kantonskürzel ('AG') == meta.kanton; id = 'kanton/AG/291.150/art_4'
//     (4 Segmente). art_id = alles nach 'kanton/AG/' = '291.150/art_4' (mit Schrägstrich).
// Die id-Zerlegung/-Rekonstruktion läuft IMMER über `quelle` (2. Segment), die
// erlasse-Identität über `key`. Bei Bund fallen beide zusammen → Bund-Bytes unverändert.
//
// Fassungs-Invariante (empirisch belegt 3.7.2026 über alle 218 Bund- + 1231 Kanton-
// Dateien): eine Snapshot-Datei = EINE Fassung — alle Einträge teilen ebene/quelle/
// erlass/stand/abgerufen/fassungsToken. Bruch wird hart geworfen (nie stille
// Zweitwahrheit, §5). Optionales Artikel-Feld schliesst sich ebenenweise aus: Bund
// trägt nur `grundlage` (Delegationsnorm), Kanton nur `titel` (Randtitel → Spalte marg).
import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { NormSnapshot } from '../../src/lib/normtext/typen.ts';
import { artikelRowid, pruefeKollision } from './stabile-rowid';

export interface ErlasseMeta {
  key: string; // erlasse-PK. Bund: == NormSnapshot.quelle (gesetzKey 'OR'). Kanton:
  //            Register-/Dateiname-Stamm 'AG-291.150' (≠ quelle 'AG', s. Modulkopf).
  ebene: 'bund' | 'kanton';
  kanton: string | null; // Kanton: Kürzel 'AG' == NormSnapshot.quelle (byte-tragend für id).
  sr: string | null;
  abkuerzung: string; // MUSS exakt NormSnapshot.erlass sein (byte-tragend für die Projektion)
  titel: string;
  rechtsgebiet: string;
  status: string;
}

/** Deterministischer Fassungs-Digest (§7 sha der Fassung): über die Artikel-shas. */
function fassungsDigest(snapshots: NormSnapshot[]): string {
  const zeilen = snapshots.map((s) => `${s.id}\t${s.sha}`).sort();
  return createHash('sha256').update(zeilen.join('\n'), 'utf8').digest('hex');
}

/** Erlass-Basis-URL = quelleUrl ohne #Anker (für erlass_fassungen.quelle_url). */
function basisUrl(quelleUrl: string): string {
  const i = quelleUrl.indexOf('#');
  return i === -1 ? quelleUrl : quelleUrl.slice(0, i);
}

/**
 * art_id aus der NormSnapshot.id, zerlegt über die QUELLE (2. id-Segment):
 *   Bund   'bund/OR/art_11'          (quelle 'OR') → 'art_11'.
 *   Kanton 'kanton/AG/291.150/art_4' (quelle 'AG') → '291.150/art_4'.
 * Die erlasse-PK `key` spielt hier NICHT mit (bei Kanton 'AG-291.150' ≠ quelle 'AG').
 */
function artIdAusId(id: string, ebene: string, quelle: string): string {
  const praefix = `${ebene}/${quelle}/`;
  if (!id.startsWith(praefix)) throw new Error(`erlass-rows: id '${id}' passt nicht zu Präfix '${praefix}'`);
  return id.slice(praefix.length);
}

/** Byte-tragende NormSnapshot.quelle (= 2. id-Segment): Bund == key, Kanton == kanton. */
function quelleVonMeta(meta: ErlasseMeta): string {
  return meta.ebene === 'kanton' ? (meta.kanton ?? '') : meta.key;
}

/** Schreibt EINEN Erlass (eine Fassung) als Zeilen in die Ziel-Tabellen. */
export function schreibeErlass(db: DatabaseSync, meta: ErlasseMeta, snapshots: NormSnapshot[]): void {
  if (snapshots.length === 0) throw new Error(`schreibeErlass: keine Snapshots für ${meta.key}`);
  const s0 = snapshots[0];
  const { fassungsToken, stand, abgerufen } = s0;
  const quelle = quelleVonMeta(meta); // 2. id-Segment; bei Kanton == meta.kanton, NICHT meta.key
  if (meta.ebene === 'kanton' && !meta.kanton)
    throw new Error(`schreibeErlass: Kanton-Erlass ${meta.key} ohne kanton (quelle-Grundlage fehlt)`);
  for (const s of snapshots) {
    if (s.ebene !== meta.ebene || s.quelle !== quelle)
      throw new Error(`schreibeErlass: ebene/quelle-Bruch in ${meta.key}: ${s.id} (quelle '${s.quelle}' ≠ '${quelle}')`);
    if (s.erlass !== meta.abkuerzung)
      throw new Error(`schreibeErlass: erlass-Label uneinheitlich in ${meta.key}: '${s.erlass}' ≠ '${meta.abkuerzung}'`);
    if (s.fassungsToken !== fassungsToken || s.stand !== stand || s.abgerufen !== abgerufen)
      throw new Error(`schreibeErlass: Fassungs-Bruch (eine Datei = eine Fassung) in ${meta.key}: ${s.id}`);
  }

  db.prepare(
    'INSERT INTO erlasse (key, ebene, kanton, sr, abkuerzung, titel, rechtsgebiet, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(meta.key, meta.ebene, meta.kanton, meta.sr, meta.abkuerzung, meta.titel, meta.rechtsgebiet, meta.status);

  db.prepare(
    'INSERT INTO erlass_fassungen (erlass_key, fassungs_token, gueltig_von, gueltig_bis, stand, quelle_url, as_fundstelle, abgerufen, sha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(meta.key, fassungsToken, stand, null, stand, basisUrl(s0.quelleUrl), null, abgerufen, fassungsDigest(snapshots));

  const artStmt = db.prepare(
    'INSERT INTO artikel (rowid, erlass_key, fassungs_token, art_id, ord, artikel, artikel_label, grundlage, marg, aufgehoben, quelle_url, bloecke_json, sha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  snapshots.forEach((s, i) => {
    // rowid = f(erlass_key, art_id), NICHT die Einfuegereihenfolge (stabile-rowid.ts): ein neuer
    // Erlass verschiebt keine fremde Zeile, das Turso-Delta bleibt ein Delta.
    const artId = artIdAusId(s.id, meta.ebene, quelle);
    const rowid = artikelRowid(meta.key, artId);
    pruefeKollision(db, rowid, meta.key, artId);
    artStmt.run(
      rowid,
      meta.key,
      fassungsToken,
      artId,
      i,
      s.artikel,
      s.artikelLabel,
      s.grundlage ?? null,
      s.titel ?? null,
      // G-AUFH-ART: 1 = aufgehoben, 2 = gegenstandslos (W2·27, eigene Kategorie — gleiche Spalte,
      // kein Schema-/Turso-Eingriff), NULL = Feld weggelassen (§7: nichts fabrizieren).
      s.aufgehoben ? 1 : s.gegenstandslos ? 2 : null,
      s.quelleUrl,
      JSON.stringify(s.bloecke),
      s.sha,
    );
  });
}

interface ArtikelRow {
  art_id: string;
  artikel: string;
  artikel_label: string;
  grundlage: string | null;
  marg: string | null;
  aufgehoben: number | null;
  quelle_url: string;
  bloecke_json: string;
  sha: string;
}

/**
 * Projiziert EINEN Erlass (eine Fassung) byte-gleich in die NormSnapshotDatei-Form.
 * Feldreihenfolge exakt wie der Generator sie emittiert (id, ebene, quelle, erlass,
 * artikel, artikelLabel, [titel], [aufgehoben|gegenstandslos], [grundlage], bloecke, stand, quelleUrl,
 * abgerufen, fassungsToken, sha) — sonst kippt die Byte-Parität. `titel`(Kanton, aus
 * Spalte marg) und `grundlage`(Bund) schliessen sich empirisch aus; `aufgehoben`
 * (G-AUFH-ART, LexWork/Kanton) kann NEBEN `titel` stehen (BS 132.100 §76a/§76b behalten
 * ihren Randtitel UND den Marker) — die Reihenfolge titel→aufgehoben→grundlage hält alle
 * Ebenen byte-gleich. id/quelle laufen über QUELLE (Kanton == kanton-Spalte, NICHT die
 * erlasse-PK `key`); siehe Modulkopf SCHLÜSSEL vs. QUELLE.
 */
export function projiziereErlass(db: DatabaseSync, key: string, fassungsToken: string): string {
  const erl = db.prepare('SELECT ebene, abkuerzung, kanton FROM erlasse WHERE key = ?').get(key) as
    | { ebene: string; abkuerzung: string; kanton: string | null }
    | undefined;
  if (!erl) throw new Error(`projiziereErlass: erlasse fehlt für ${key}`);
  const fass = db
    .prepare('SELECT stand, abgerufen FROM erlass_fassungen WHERE erlass_key = ? AND fassungs_token = ?')
    .get(key, fassungsToken) as { stand: string; abgerufen: string } | undefined;
  if (!fass) throw new Error(`projiziereErlass: erlass_fassungen fehlt für ${key}/${fassungsToken}`);
  const rows = db
    .prepare(
      'SELECT art_id, artikel, artikel_label, grundlage, marg, aufgehoben, quelle_url, bloecke_json, sha FROM artikel WHERE erlass_key = ? AND fassungs_token = ? ORDER BY ord',
    )
    .all(key, fassungsToken) as unknown as ArtikelRow[];

  // 2. id-Segment (byte-tragende quelle): Bund == key, Kanton == kanton-Spalte.
  const quelle = erl.ebene === 'kanton' ? (erl.kanton ?? '') : key;

  const eintraege = rows.map((r) => {
    const o: Record<string, unknown> = {};
    o.id = `${erl.ebene}/${quelle}/${r.art_id}`;
    o.ebene = erl.ebene;
    o.quelle = quelle;
    o.erlass = erl.abkuerzung;
    o.artikel = r.artikel;
    o.artikelLabel = r.artikel_label;
    if (r.marg !== null) o.titel = r.marg; // Kanton-Randtitel (N1)
    if (r.aufgehoben === 1) o.aufgehoben = true; // G-AUFH-ART: 1 = aufgehoben; NULL/0 = Feld weggelassen
    else if (r.aufgehoben === 2) o.gegenstandslos = true; // W2·27: 2 = gegenstandslos (eigenes Feld, s. typen.ts)
    if (r.grundlage !== null) o.grundlage = r.grundlage; // Bund-Delegationsnorm (G23)
    o.bloecke = JSON.parse(r.bloecke_json);
    o.stand = fass.stand;
    o.quelleUrl = r.quelle_url;
    o.abgerufen = fass.abgerufen;
    o.fassungsToken = fassungsToken;
    o.sha = r.sha;
    return o;
  });

  // erzeugt == abgerufen (empirisch invariant über alle Bund-Dateien).
  return JSON.stringify({ erzeugt: fass.abgerufen, eintraege }, null, 2);
}

/** Alle (erlass_key, fassungs_token)-Paare mit Ziel-Zeilen — für Doppellauf/Report.
 *
 * TODO(H-5/B2, Fahrplan-Anker): heute 0 Aufrufer, BEWUSST behalten — der Fassungs-Diff
 * «bei jedem neuen erlass_fassungen-Eintrag dreistufiger Diff (stabil/verändert/verschwunden,
 * umgezogen via sha)» (FAHRPLAN-DATENHALTUNG §3.3) braucht genau diese Enumeration, sobald
 * der Paket-5-Historie-Rohstoff in erlass_fassungen landet (E-Strecke; heute 1 Fassung je
 * Erlass, s. stabilitaets-report.ts-Kopf). Negativ-Check H-5 12.7.2026: kein weiterer Konsument. */
export function alleErlassFassungen(db: DatabaseSync): Array<{ key: string; fassungsToken: string }> {
  const rows = db
    .prepare('SELECT erlass_key AS key, fassungs_token AS ft FROM erlass_fassungen ORDER BY erlass_key, fassungs_token')
    .all() as unknown as Array<{ key: string; ft: string }>;
  return rows.map((r) => ({ key: r.key, fassungsToken: r.ft }));
}
