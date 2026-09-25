// scripts/materialien/soft-law-zustand.ts
// E6a Stufe 1 (FAHRPLAN-MATERIALIEN-VERZAHNUNG §2.3): Typen + Parser/Validator des
// committeten, append-only Zustands-Trägers `bibliothek/register/soft-law-zustand.jsonl`.
//
// WARUM committet (§0/B2): `daten/*.db` ist gitignored + wegwerfbar — «galt damals» und die
// Append-only-Invariante hätten in CI/frischem Clone sonst keine Baseline. Das JSONL ist der
// deterministische Wiederaufbau-Anker (Zustands-Manifest + Snapshot ⇒ DB, nie Live-Quelle allein).
//
// Format (JSONL trägt keine Kommentare — es lebt hier): zwei Zeilentypen.
//   Kopfzeile je Snapshot-Lauf:  {"typ":"lauf","quelle":…,"abgerufen":ISO,"indexSha":…}
//   Dokumentzeile je Zustandsänderung: {"typ":"dok","id":…,"status":…,"entlistet_am":…,
//     "drift_token":…,"quell_ids":…,"sha":…,"stand":ISO,"stand_quelle":…,"quelle_url":…,"abgerufen":ISO}
// Harte Validierung: unbekannter typ / fehlendes Pflichtfeld / entlistet ohne entlistet_am ⇒ Error.
// Leere Datei ⇒ leeres, gültiges Ergebnis.

import { readFileSync, existsSync } from 'node:fs';

export const ZUSTAND_PFAD = 'bibliothek/register/soft-law-zustand.jsonl';

export type SoftLawQuelle = 'estv-mwst' | 'seco' | 'edoeb' | 'estv-ks';
export type DokStatus = 'gelistet' | 'entlistet';
export type StandQuelle = 'hub-label' | 'hub-beschreibung' | 'pdf-text' | 'pdf-meta' | 'payload' | 'toc' | 'ziffer-datum';

export interface LaufZeile {
  typ: 'lauf';
  quelle: SoftLawQuelle;
  abgerufen: string;
  indexSha: string;
}

export interface DokZeile {
  typ: 'dok';
  id: string;
  status: DokStatus;
  entlistet_am: string | null;
  drift_token: string;
  quell_ids: Record<string, unknown> | null;
  sha: string;
  stand: string;
  stand_quelle: StandQuelle;
  quelle_url: string;
  abgerufen: string;
  // ── Karten-Felder (§0/B6, CI-Rebuild-Fix): additiv erweitert (M2), damit check:materialien
  //    die dbDocs bei fehlender DB deterministisch aus dem JSONL rekonstruieren kann. Das
  //    committete JSONL ist noch leer → keine Migration.
  titel: string;
  behoerde: string;
  doktyp: string;
  nummer: string | null;
  rechtsgebiet: string;
  sprache: string;
  rang: number;
  normKeys: string[];
  hinweis: string | null;
}

export type ZustandZeile = LaufZeile | DokZeile;

export interface Zustand {
  /** Alle Kopfzeilen in Datei-Reihenfolge. */
  laeufe: LaufZeile[];
  /** Letzter (jüngster) Zustand je Dokument-id — append-only «last-write-wins». */
  letzterZustand: Map<string, DokZeile>;
  /** Alle Zeilen in Datei-Reihenfolge (für Append-only-/Quoten-Prüfungen im Tor). */
  zeilen: ZustandZeile[];
}

const QUELLEN = new Set<SoftLawQuelle>(['estv-mwst', 'seco', 'edoeb', 'estv-ks']);
const STATUS = new Set<DokStatus>(['gelistet', 'entlistet']);
// 'ziffer-datum' (M1/ESTV-MWST): Dokument-Stand = jüngstes «Publiziert am» der Ziffer-Seiten.
const STAND_QUELLEN = new Set<StandQuelle>(['hub-label', 'hub-beschreibung', 'pdf-text', 'pdf-meta', 'payload', 'toc', 'ziffer-datum']);
const ISO = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;
const ISO_DATUM = /^(\d{4})-(\d{2})-(\d{2})$/;

function istString(x: unknown): x is string {
  return typeof x === 'string' && x.length > 0;
}

/** ISO-Datum mit Monats-/Tages-Plausibilität (Monat 01–12, Tag 01–31), §0-Härtung 4c. */
export function istPlausiblesDatum(s: unknown): s is string {
  if (typeof s !== 'string') return false;
  const m = ISO_DATUM.exec(s);
  if (!m) return false;
  const mo = Number(m[2]);
  const tg = Number(m[3]);
  return mo >= 1 && mo <= 12 && tg >= 1 && tg <= 31;
}

function istStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((e) => typeof e === 'string');
}

/** Validiert + normalisiert eine Roh-Zeile; wirft mit Zeilennummer bei Verstoss. */
function parseZeile(roh: unknown, nr: number): ZustandZeile {
  if (typeof roh !== 'object' || roh === null || Array.isArray(roh)) {
    throw new Error(`soft-law-zustand Z.${nr}: kein JSON-Objekt.`);
  }
  const o = roh as Record<string, unknown>;
  if (o.typ === 'lauf') {
    if (!QUELLEN.has(o.quelle as SoftLawQuelle)) throw new Error(`soft-law-zustand Z.${nr}: unbekannte quelle ${JSON.stringify(o.quelle)}.`);
    if (!istString(o.abgerufen)) throw new Error(`soft-law-zustand Z.${nr}: lauf ohne abgerufen.`);
    if (!istString(o.indexSha)) throw new Error(`soft-law-zustand Z.${nr}: lauf ohne indexSha.`);
    return { typ: 'lauf', quelle: o.quelle as SoftLawQuelle, abgerufen: o.abgerufen, indexSha: o.indexSha };
  }
  if (o.typ === 'dok') {
    if (!istString(o.id)) throw new Error(`soft-law-zustand Z.${nr}: dok ohne id.`);
    if (!STATUS.has(o.status as DokStatus)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} ungültiger status ${JSON.stringify(o.status)}.`);
    if (!istString(o.drift_token)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} ohne drift_token (§0/A8).`);
    if (!istString(o.sha)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} ohne sha.`);
    if (!istString(o.stand) || !ISO.test(o.stand)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} stand kein ISO-Datum.`);
    if (!istPlausiblesDatum(o.stand)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} stand «${o.stand}» unplausibel (Monat 01–12, Tag 01–31).`);
    if (!STAND_QUELLEN.has(o.stand_quelle as StandQuelle)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} ungültige stand_quelle ${JSON.stringify(o.stand_quelle)}.`);
    if (!istString(o.quelle_url)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} ohne quelle_url.`);
    if (!istString(o.abgerufen)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} ohne abgerufen.`);
    // Karten-Felder (Pflicht, §0/B6): tragen die Browse-Rekonstruktion aus dem JSONL.
    if (!istString(o.titel)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} ohne titel.`);
    if (!istString(o.behoerde)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} ohne behoerde.`);
    if (!istString(o.doktyp)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} ohne doktyp.`);
    if (o.nummer !== null && typeof o.nummer !== 'string') throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} nummer weder string noch null.`);
    if (!istString(o.rechtsgebiet)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} ohne rechtsgebiet.`);
    if (!istString(o.sprache)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} ohne sprache.`);
    if (typeof o.rang !== 'number' || !Number.isFinite(o.rang)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} rang keine Zahl.`);
    if (!istStringArray(o.normKeys)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} normKeys kein string[].`);
    if (o.hinweis !== null && typeof o.hinweis !== 'string') throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} hinweis weder string noch null.`);
    const status = o.status as DokStatus;
    const entlistetAm = o.entlistet_am ?? null;
    // entlistet ⇒ entlistet_am Pflicht (ISO-plausibel); gelistet ⇒ entlistet_am null (keine Geister-Daten).
    if (status === 'entlistet') {
      if (!istString(entlistetAm)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} entlistet ohne entlistet_am.`);
      if (!istPlausiblesDatum(entlistetAm)) throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} entlistet_am «${entlistetAm}» unplausibel (Monat 01–12, Tag 01–31).`);
    } else if (entlistetAm !== null) {
      throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} gelistet, aber entlistet_am gesetzt.`);
    }
    const quellIds = o.quell_ids ?? null;
    if (quellIds !== null && (typeof quellIds !== 'object' || Array.isArray(quellIds))) {
      throw new Error(`soft-law-zustand Z.${nr}: dok ${o.id} quell_ids ist weder null noch Objekt.`);
    }
    return {
      typ: 'dok',
      id: o.id,
      status,
      entlistet_am: entlistetAm as string | null,
      drift_token: o.drift_token,
      quell_ids: quellIds as Record<string, unknown> | null,
      sha: o.sha,
      stand: o.stand,
      stand_quelle: o.stand_quelle as StandQuelle,
      quelle_url: o.quelle_url,
      abgerufen: o.abgerufen,
      titel: o.titel,
      behoerde: o.behoerde,
      doktyp: o.doktyp,
      nummer: (o.nummer ?? null) as string | null,
      rechtsgebiet: o.rechtsgebiet,
      sprache: o.sprache,
      rang: o.rang,
      normKeys: o.normKeys,
      hinweis: (o.hinweis ?? null) as string | null,
    };
  }
  throw new Error(`soft-law-zustand Z.${nr}: unbekannter typ ${JSON.stringify(o.typ)}.`);
}

// ── Kanonische Serialisierung (feste Feld-Reihenfolge ⇒ Byte-Determinismus, append-only) ──
/** Kopfzeile eines Snapshot-Laufs. */
export function serialisiereLauf(l: LaufZeile): string {
  return JSON.stringify({ typ: 'lauf', quelle: l.quelle, abgerufen: l.abgerufen, indexSha: l.indexSha });
}
/** Dokumentzeile (Zustandsänderung). Feste Reihenfolge = JSONL-Byte-Stabilität. */
export function serialisiereDok(d: DokZeile): string {
  return JSON.stringify({
    typ: 'dok',
    id: d.id,
    status: d.status,
    entlistet_am: d.entlistet_am,
    drift_token: d.drift_token,
    quell_ids: d.quell_ids,
    sha: d.sha,
    stand: d.stand,
    stand_quelle: d.stand_quelle,
    quelle_url: d.quelle_url,
    abgerufen: d.abgerufen,
    titel: d.titel,
    behoerde: d.behoerde,
    doktyp: d.doktyp,
    nummer: d.nummer,
    rechtsgebiet: d.rechtsgebiet,
    sprache: d.sprache,
    rang: d.rang,
    normKeys: d.normKeys,
    hinweis: d.hinweis,
  });
}

/** Liest + validiert das Zustands-Manifest. Fehlende/leere Datei ⇒ leeres, gültiges Ergebnis. */
export function ladeZustand(pfad = ZUSTAND_PFAD): Zustand {
  const laeufe: LaufZeile[] = [];
  const letzterZustand = new Map<string, DokZeile>();
  const zeilen: ZustandZeile[] = [];
  if (!existsSync(pfad)) return { laeufe, letzterZustand, zeilen };
  const roh = readFileSync(pfad, 'utf8');
  const linien = roh.split('\n');
  linien.forEach((linie, i) => {
    const t = linie.trim();
    if (t === '') return; // Leerzeilen (inkl. abschliessender) überspringen
    let obj: unknown;
    try {
      obj = JSON.parse(t);
    } catch {
      throw new Error(`soft-law-zustand Z.${i + 1}: kein gültiges JSON.`);
    }
    const zeile = parseZeile(obj, i + 1);
    zeilen.push(zeile);
    if (zeile.typ === 'lauf') laeufe.push(zeile);
    else letzterZustand.set(zeile.id, zeile);
  });
  return { laeufe, letzterZustand, zeilen };
}
