// ─── Tor: Integrität des Materialien-Korpus (offline, in `gate`) ────────────────
//
// E6a Stufe 1 (FAHRPLAN-MATERIALIEN-VERZAHNUNG §4): NEUBAU des früheren Hard-Asserts
// «Manifest == MATERIAL_REGISTER» zum MERGE-MODELL (§0/B9). register.json ist jetzt eine
// Projektion aus (kuratiertem MATERIAL_REGISTER + DB-Dokumenten); Kanten liegen in
// public/materialien/kanten/**. Das Tor prüft offline (daten/ existiert in CI NICHT):
//
//  · Register-Grundchecks (Key-Format, quelleUrl http(s), stand ISO + nicht Zukunft,
//    normKeys→ERLASS_REGISTER, status-Warnung) — wie bisher.
//  · Merge-Modell: jedes register.json-Element ist kuratiert ODER gelistetes DB-Dokument;
//    jede manifest-gelistete id genau einmal, keine entlistete id in register.json/Shards.
//  · Dreieck + 2-Lauf-Determinismus: die Projektions-Funktionen (aus soft-law-projektion.ts,
//    NICHT dupliziert) zweimal in-memory == committete Dateien (register.json byte-gleich,
//    Shards byte-gleich, keine Orphans).
//  · Shard-/Bucket-Budget ≤ 300 KB; erlass/artikelscharfe Kanten gegen ERLASS_REGISTER +
//    Korpus; Revisions-Cutoff erzwungen; quelle ∈ Enum; dok-Verweis ∈ register.json;
//    Kopf-Buckets vollständig, keine verwaisten Bucket-Dateien.
//  · §7 a–d je DB-Dokument (stand/quelle_url/drift_token nicht-leer; abgerufen = Hygiene,
//    KEIN §7-Surrogat; (c) sichtbarer UI-Live-Link = M1-DoD per Playwright, offline nicht prüfbar).
//  · Key-Abgleich/Dubletten (§2.6, alle 4 Quellen), Behörde+Doktyp registriert (§0/B6),
//    Append-only + Entlistungs-Quote ≤ 10 %/Lauf (§2.5), DB-Grössenbudget (§2.2).
//  · Wortfeld-Tor (§0/A7): keine AFFIRMATIVE «geprüft/gegengeprüft/verifiziert» in EIGENEN
//    Nutzertexten; Negationen («nicht/noch nicht/ungeprüft») sind ehrliche §8-Offenlegungen
//    und ERLAUBT. Amtliche `titel` in register.json = Zitat-Felder (ausgenommen).
//  · Vernehmlassungen Finding 7 (§17-Wurzelfix PR #803, war wanduhr-abhängig): 'laufend' mit
//    fristEnde < r.stand (Erhebungsdatum, vom Generator geschrieben) = Datenfehler zum
//    Erhebungszeitpunkt. Deterministisch, KEIN heute/Date.now — dieses Tor liest an KEINER
//    Stelle mehr die Wanduhr (Gegenprüfungs-Auflage A1). Der zugehörige Alterungs-Wächter
//    (Erhebungsdatum zu alt ⇒ rot) lebt bewusst NICHT hier, sondern im eigenen, standalone
//    Tor `check:vernehmlassungen-alter` (K7-Entscheid, Begründung dort UND in
//    scripts/materialien/vernehmlassungen-tor.ts) — sonst würde ein wanduhr-Rot fachfremde
//    Aufrufer dieses Tors (z. B. normen-monitor.yml Job `bs-grossrat`) vor deren PR-Schritt
//    mit einem Vernehmlassungs-Befund töten.
// Harte Verstösse → exit 1.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { MATERIAL_REGISTER, BEHOERDEN, DOKTYPEN } from '../../src/lib/materialien/register.ts';
// Botschaften (Paket 2, W2·6) sind kuratiert-äquivalent (generiert, nicht im in-Bundle
// MATERIAL_REGISTER): ALLE_MATERIALIEN = MATERIAL_REGISTER + BOTSCHAFTEN. Sie durchlaufen
// dieselben Register-Grundchecks + gelten im Merge-Modell als «kuratiert» (nicht DB-Dok).
import { ALLE_MATERIALIEN } from './material-manifest.ts';
import { ERLASS_REGISTER } from '../../src/lib/normtext/register.ts';
import type { MaterialVoll, MaterialManifest } from '../../src/lib/materialien/typen.ts';
import { ladeZustand, type DokZeile, type SoftLawQuelle, type ZustandZeile } from './soft-law-zustand.ts';
import { braucheDowngrade } from './revisions-cutoff.ts';
import {
  projiziereRegister,
  projiziereShards,
  baueKorpusInfo,
  ladeKantenAusDb,
  dbDokAusZustand,
  teileRegister,
  sammleKantenDokIds,
  REGISTER_PFAD,
  REGISTER_I18N_PFAD,
  REGISTER_PROVENIENZ_PFAD,
  KANTEN_DIR,
  SOFT_LAW_DB,
  SHARD_BYTE_LIMIT,
  type NormRefRow,
  type DokMeta,
  type ShardDatei,
} from './soft-law-projektion.ts';
import { wortfeldTreffer, wortfeldImQuellcode } from './wortfeld.ts';
import { kantenErlasseAusVerzeichnis, renderKantenErlasse, KANTEN_ERLASSE_PFAD } from './kanten-erlasse.ts';
import { finding7Fehler, parseDatumArg } from './vernehmlassungen-tor.ts';
import {
  pruefeDbVollstaendigkeit, pruefeKantenVollstaendigkeit, nurGelistete, shardInhaltGleich, zaehleKanten,
} from './db-vollstaendigkeit.ts';

/** Kantonaler Normtext-Korpus: die Datei-Stämme sind die Erlass-Schlüssel (K-16). */
const KANTON_KORPUS_DIR = join('public', 'normtext', 'kanton');

// ══ Gate ════════════════════════════════════════════════════════════════════════
const QUELLEN_ENUM = new Set(['amtlich', 'kuratiert', 'maschinell']);
const VERN_STATUS = new Set([
  'in-vorbereitung', 'geplant', 'laufend',
  'abgeschlossen-stellungnahmen', 'abgeschlossen-bericht', 'abgeschlossen', 'zurueckgezogen',
]);
const KEY_UNSICHER = /[\\/#?\s]/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const DB_BUDGET_MB = 50;
const ENTLISTUNG_QUOTE = 0.1;

const fehler: string[] = [];
const warn: string[] = [];

function collectFiles(dir: string, pred: (p: string) => boolean, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) collectFiles(p, pred, out);
    else if (pred(p)) out.push(p);
  }
  return out;
}

function main(): void {
  const behoerdeIds = new Set(BEHOERDEN.map((b) => b.id));
  const doktypIds = new Set(DOKTYPEN.map((d) => d.id));
  const erlassKeys = new Set(ERLASS_REGISTER.map((e) => e.key));
  // K-16: kantonale Erlasse stehen NICHT im ERLASS_REGISTER (das führt nur den Bund) —
  // ihre Identität ist die committete Datei im Korpus (public/normtext/kanton/<KEY>.json,
  // Index derselben Menge in kanton/index.json). Ohne diese Zeile wäre jede kantonale
  // Verknüpfung ein «toter Cross-Link» und das Tor auf Dauerrot; mit ihr prüft es
  // weiterhin gegen eine echte Existenz-Menge, nur gegen die richtige (§5).
  const kantonKeys = new Set(
    existsSync(KANTON_KORPUS_DIR)
      ? readdirSync(KANTON_KORPUS_DIR)
        .filter((f) => f.endsWith('.json') && f !== 'index.json')
        .map((f) => f.slice(0, -'.json'.length))
      : [],
  );
  const kuratiertKeys = new Set(ALLE_MATERIALIEN.map((r) => r.key));
  const korpus = baueKorpusInfo();

  // A2 (Gegenprüfung PR #803): --datum gegen ISO validieren statt ein kaputtes Format
  // stillschweigend als "kein Override" zu behandeln (Date.parse('kaputt') = NaN hätte
  // sonst z. B. den Zukunfts-Check unten lautlos abgeschaltet). Ungültig ⇒ harter Fehler,
  // `heute` bleibt undefined (die übrigen Checks laufen trotzdem, der Fehler oben reicht
  // für exit 1 in ausgabe()).
  let heute: string | undefined;
  try {
    heute = parseDatumArg(process.argv);
  } catch (e) {
    fehler.push((e as Error).message);
  }

  // ── 1. Register-Grundchecks (kuratiert + generierte Botschaften) ──────────────
  const gesehen = new Set<string>();
  for (const r of ALLE_MATERIALIEN) {
    if (gesehen.has(r.key)) fehler.push(`Doppelter key: ${r.key}`);
    gesehen.add(r.key);
    if (KEY_UNSICHER.test(r.key)) fehler.push(`Key pfad-/URL-unsicher: ${JSON.stringify(r.key)}`);
    if (!/^https?:\/\//.test(r.quelleUrl)) fehler.push(`${r.key}: quelleUrl ist keine http(s)-URL (§7c): ${r.quelleUrl}`);
    if (!ISO.test(r.stand)) fehler.push(`${r.key}: stand kein ISO-Datum: ${r.stand}`);
    else if (heute && r.stand > heute) fehler.push(`${r.key}: stand ${r.stand} liegt in der Zukunft (> ${heute}).`);
    for (const nk of r.normKeys ?? []) {
      if (!erlassKeys.has(nk) && !kantonKeys.has(nk)) {
        fehler.push(`${r.key}: normKeys verweist auf unbekannten Erlass ${nk} (toter Cross-Link, §8).`);
      }
    }
    if (r.status !== 'nur-live-link') {
      warn.push(`${r.key}: status '${r.status}' — pdf-embed/volltext brauchen gehosteten Inhalt + Drift-Tor (§7).`);
    }
    // Botschaften (Paket 2): Paket-5-Join-Felder + Provenienz-Integrität (Finding 1, P0).
    if (r.behoerde === 'BR') {
      if (r.doktyp !== 'botschaft') fehler.push(`${r.key}: BR-Eintrag mit doktyp '${r.doktyp}' ≠ 'botschaft'.`);
      if (!r.normKeys || r.normKeys.length === 0) fehler.push(`${r.key}: Botschaft ohne normKeys (verwaist, §8).`);
      if (!r.projEli) fehler.push(`${r.key}: Botschaft ohne projEli — Paket-5-Join bräche (Finding 1).`);
      if (r.botschaftDate !== r.stand) fehler.push(`${r.key}: botschaftDate (${r.botschaftDate}) ≠ stand (${r.stand}).`);
      if (!/^https:\/\/www\.fedlex\.admin\.ch\/eli\/fga\//.test(r.quelleUrl)) {
        fehler.push(`${r.key}: quelleUrl ist kein Fedlex-fga-Live-Link: ${r.quelleUrl}.`);
      }
    }
    // Vernehmlassungen (Paket 3, W3·11): Status-/Frist-/Konsistenz-Invarianten.
    if (r.behoerde === 'BUND') {
      if (r.doktyp !== 'vernehmlassung') fehler.push(`${r.key}: BUND-Eintrag mit doktyp '${r.doktyp}' ≠ 'vernehmlassung'.`);
      if (!r.normKeys || r.normKeys.length === 0) fehler.push(`${r.key}: Vernehmlassung ohne normKeys (verwaist, §8).`);
      if (!/^https:\/\/www\.fedlex\.admin\.ch\/eli\/dl\/proj\//.test(r.quelleUrl)) {
        fehler.push(`${r.key}: quelleUrl ist kein Fedlex-Vernehmlassungs-Live-Link (eli/dl/proj): ${r.quelleUrl}.`);
      }
      const v = r.vernehmlassung;
      if (!v) {
        fehler.push(`${r.key}: Vernehmlassung ohne vernehmlassung-Feld (Status/Frist fehlen, §8).`);
      } else {
        if (!VERN_STATUS.has(v.status)) fehler.push(`${r.key}: Vernehmlassungs-Status '${v.status}' ∉ Enum (${[...VERN_STATUS].join('|')}).`);
        if (!v.projEli) fehler.push(`${r.key}: Vernehmlassung ohne projEli (Gesetzgebungs-Graph-Anker fehlt).`);
        if (v.fristStart && !ISO.test(v.fristStart)) fehler.push(`${r.key}: fristStart kein ISO-Datum: ${v.fristStart}.`);
        if (v.fristEnde && !ISO.test(v.fristEnde)) fehler.push(`${r.key}: fristEnde kein ISO-Datum: ${v.fristEnde}.`);
        if (v.fristStart && v.fristEnde && v.fristStart > v.fristEnde) {
          fehler.push(`${r.key}: fristStart ${v.fristStart} > fristEnde ${v.fristEnde} (unmöglicher Zeitraum).`);
        }
        // Finding 7 (P0, user-sichtbar), deterministisch seit §17-Wurzelfix PR #803 (war
        // wanduhr-abhängig, #789/Befund 12.9.2026) — reine Funktion in vernehmlassungen-tor.ts,
        // testbar ohne den ganzen check-materialien-Lauf. Der zugehörige Alterungs-Wächter (liest
        // `heute`) lebt bewusst NICHT hier, sondern im eigenen Tor `check:vernehmlassungen-alter`
        // (K7-Entscheid, Begründung im Kopf dieser Datei und in vernehmlassungen-tor.ts).
        const f7 = finding7Fehler(r.key, v.status, v.fristEnde, r.stand);
        if (f7) fehler.push(f7);
      }
    }
  }

  // ── 2. Zustands-Manifest laden (Validator wirft bei Verstoss, §2.3) ───────────
  let zustand;
  try {
    zustand = ladeZustand();
  } catch (e) {
    fehler.push(`Zustands-Manifest ungültig: ${(e as Error).message}`);
    ausgabe(0, 0, 0, 0);
    return;
  }
  const gelistet = new Map<string, DokZeile>();
  const entlistetIds = new Set<string>();
  for (const [id, z] of zustand.letzterZustand) {
    // KEY_UNSICHER-Check auch auf JSONL-/DB-IDs (§0-Härtung 4b, Pfad-Sicherheit der Shard-Dateien).
    if (KEY_UNSICHER.test(id)) fehler.push(`Zustands-Manifest: id pfad-/URL-unsicher: ${JSON.stringify(id)}.`);
    if (z.status === 'gelistet') gelistet.set(id, z);
    else entlistetIds.add(id);
  }

  // ── 3. dbDocs IMMER aus dem Zustands-Manifest (CI-Rebuild-Fix, §0/B2) ──────────
  // register.json-Byte-Gleichheit läuft so auch in CI (keine DB nötig). Die DB dient NUR der
  // lokalen Shard-Reprojektion (kanten/dokMeta); in CI werden die committeten Shards direkt
  // validiert (pruefeShardDatei + Dok-Mitgliedschaft + Plausibilität), nicht byte-reprojiziert.
  const dbDocs: MaterialVoll[] = dbDokAusZustand(zustand);
  const dbExists = existsSync(SOFT_LAW_DB);
  let kanten: NormRefRow[] = [];
  let dokMeta = new Map<string, DokMeta>();
  if (dbExists) {
    const mb = statSync(SOFT_LAW_DB).size / (1024 * 1024);
    if (mb > DB_BUDGET_MB) warn.push(`${SOFT_LAW_DB} ist ${mb.toFixed(1)} MB (> ${DB_BUDGET_MB} MB Warnschwelle, §2.2).`);
    const db = new DatabaseSync(SOFT_LAW_DB);
    ({ kanten, dokMeta } = ladeKantenAusDb(db));
    db.close();
  }
  // Reprojektionsfähig ist die DB nur MIT Harvest-Kanten: `datenhaltung:build` erzeugt
  // eine hohle soft-law.db (nur Blob-Ingest, norm_referenzen/soft_law leer) — Byte-
  // Reprojektion daraus würde JEDEN committeten Shard fälschlich als Orphan melden
  // (Falsch-Rot 21.7.2026). Massgeblich sind allein die kanten: projiziereShards leitet
  // die Shard-Dateien ausschliesslich daraus ab; dokMeta ohne kanten würde den Byte-Pfad
  // betreten und dasselbe Falsch-Rot erzeugen (Gegenprüfungs-Befund 21.7.2026, Angriff 5).
  // Ohne Kanten gilt der CI-Pfad; das SKIP wird protokolliert, nie still (§6 Ziff. 7 lit. b).
  const reprojektionsfaehig = kanten.length > 0;

  // ── 4. register.json einlesen + Dreieck/Determinismus (byte-gleich) ───────────
  if (!existsSync(REGISTER_PFAD)) {
    fehler.push(`${REGISTER_PFAD} fehlt — 'npm run materialien -- --datum=$(date +%F)' ausführen und committen.`);
    ausgabe(0, 0, 0, 0);
    return;
  }
  const registerBytes = readFileSync(REGISTER_PFAD, 'utf8');
  const register = JSON.parse(registerBytes) as MaterialManifest;
  const registerKeys = new Set(register.materialien.map((m) => m.key));

  const frisch1 = projiziereRegister(register.erzeugt, dbDocs);
  const frisch2 = projiziereRegister(register.erzeugt, dbDocs);
  if (JSON.stringify(frisch1) !== JSON.stringify(frisch2)) fehler.push('register-Projektion nicht deterministisch (2-Lauf-Diff).');
  // ALLE DREI Projektionen byte-gleich gegen denselben frischen Lauf (12.9.2026):
  // sie entstehen gemeinsam, also müssen sie auch gemeinsam geprüft werden — sonst
  // könnte eine der beiden neuen Dateien unbemerkt veralten (§5, zweite Wahrheit).
  const geteilt = teileRegister(frisch1);
  const geteilt2 = teileRegister(frisch2);
  if (JSON.stringify(geteilt) !== JSON.stringify(geteilt2)) fehler.push('Register-Aufteilung nicht deterministisch (2-Lauf-Diff).');
  for (const [pfad, soll] of [
    [REGISTER_PFAD, geteilt.kern],
    [REGISTER_I18N_PFAD, geteilt.i18n],
    [REGISTER_PROVENIENZ_PFAD, geteilt.provenienz],
  ] as const) {
    if (!existsSync(pfad)) {
      fehler.push(`${pfad} fehlt — 'npm run materialien -- --datum=$(date +%F)' schreibt alle drei Projektionen gemeinsam.`);
      continue;
    }
    if (readFileSync(pfad, 'utf8') !== JSON.stringify(soll, null, 2) + '\n') {
      fehler.push(`${pfad} weicht von der frischen Projektion ab — nur über den Generator pflegen (§2). 'npm run materialien -- --datum=$(date +%F)'.`);
    }
  }
  // Kein Feld darf in zwei Dateien liegen und keines verschwinden (§5/§8): der Kern
  // trägt nie sha/FR/IT/Ketten, und JEDER Eintrag hat genau eine Provenienz-Zeile.
  for (const m of register.materialien as unknown as Array<Record<string, unknown>>) {
    for (const verboten of ['sha', 'titelFr', 'titelIt', 'ereignisse', 'bsKanten', 'ocUris', 'projEli', 'botschaftDate', 'artAnker']) {
      if (verboten in m) fehler.push(`${String(m.key)}: Feld '${verboten}' liegt im Browser-Kanal register.json — gehört in register-i18n.json bzw. register-provenienz.json (§5/§15).`);
    }
  }
  const provKeys = new Set(Object.keys(geteilt.provenienz.eintraege));
  for (const m of register.materialien) {
    if (!provKeys.has(m.key)) fehler.push(`${m.key}: keine Provenienz-Zeile (sha) in ${REGISTER_PROVENIENZ_PFAD} — Drift-Token verloren (§7).`);
  }
  for (const k of provKeys) {
    if (!registerKeys.has(k)) fehler.push(`${k}: Provenienz-Zeile ohne Eintrag im Kern-Register — Waise (§5).`);
    const sha = geteilt.provenienz.eintraege[k].sha;
    if (!/^[0-9a-f]{64}$/.test(sha)) fehler.push(`${k}: sha ist kein sha256 (§7).`);
  }
  for (const k of Object.keys(geteilt.i18n.titel)) {
    if (!registerKeys.has(k)) fehler.push(`${k}: FR/IT-Titel ohne Eintrag im Kern-Register — Waise (§5).`);
  }

  // Shard-Byte-Reprojektion nur lokal-mit-Harvest-DB UND vollständig geladenen Quellen; sonst
  // (CI ohne DB, hohle Build-DB, ODER ein lokaler Teilstand mit nur EINER gecrawlten Quelle)
  // committete Shards direkt validieren (§0/M0-Vermerk). Vollständigkeits-Marker in ZWEI
  // Dimensionen (Gegenprüfung PR #815, Auflage A2a): (1) Dokument-Meta — jede 'gelistet'-id
  // MUSS in der DB-Dokument-Meta auftauchen; (2) Kanten — jedes Dokument mit mindestens einer
  // COMMITTETEN Kante MUSS auch in der DB-Kantenmenge auftauchen. Dimension 1 allein reicht
  // NICHT: `seedSoftLawDb` befüllt `soft_law` immer vollständig, auch wenn `norm_referenzen`
  // (die Kanten) auf eine einzelne Quelle beschnitten wurden — genau dieser Fall bestand
  // Dimension 1 trotzdem und erzeugte die 7 falschen Orphan-Shard-Meldungen. Ohne DEN Marker
  // vergliche der Byte-Pfad einen unvollständig geladenen DB-Zustand gegen die VOLLSTÄNDIGEN
  // committeten Shards (FAHRPLAN-OFFENE-BEFUNDE.md, PR #703-Nachzug; siehe
  // scripts/materialien/db-vollstaendigkeit.ts für den vollständigen Befund samt A1-Präzisierung
  // zu den ZUSÄTZLICH beobachteten 4 Byte-Abweichungen, die NICHT vom Teilstand stammen, sondern
  // vom `erzeugt`-Stempel — deshalb `shardInhaltGleich` statt rohem String-Vergleich unten).
  const dokMetaIds = new Set(dokMeta.keys());
  const dbKantenDokIds = new Set(kanten.map((k) => k.quelldok_id));
  const gelistetIds = new Set(gelistet.keys());
  const dokMetaVollstaendigkeit = pruefeDbVollstaendigkeit(gelistetIds, dokMetaIds);
  // A4 (Gegenprüfung PR #815, Deadlock): Kanten-Soll auf aktuell 'gelistet' einschränken — ein
  // entlistetes Dokument hat im COMMITTETEN (noch nicht bereinigten) Shard weiterhin eine
  // Kante, darf die DB aber nicht als unvollständig markieren (siehe nurGelistete-Docstring).
  const kantenVollstaendigkeit = pruefeKantenVollstaendigkeit(nurGelistete(sammleKantenDokIds(), gelistetIds), dbKantenDokIds);
  const vollstaendig = dokMetaVollstaendigkeit.vollstaendig && kantenVollstaendigkeit.vollstaendig;
  const fehlendeGesamt = [...new Set([...dokMetaVollstaendigkeit.fehlendeIds, ...kantenVollstaendigkeit.fehlendeIds])];
  let kantenGesamt: number;
  if (dbExists && reprojektionsfaehig && vollstaendig) {
    const shard1 = projiziereShards(register.erzeugt, kanten, dokMeta, korpus);
    const shard2 = projiziereShards(register.erzeugt, kanten, dokMeta, korpus);
    if (JSON.stringify(shard1.dateien) !== JSON.stringify(shard2.dateien)) fehler.push('Shard-Projektion nicht deterministisch (2-Lauf-Diff).');
    kantenGesamt = pruefeShardDrift(shard1.dateien, gelistet);
  } else {
    if (dbExists && reprojektionsfaehig && !vollstaendig) {
      console.log(
        `HINWEIS materialien: ${SOFT_LAW_DB} unvollständig geladen (${fehlendeGesamt.length} Dokument(e) ` +
          `ohne volle Dok-Meta- und/oder Kanten-Deckung, z. B. ${fehlendeGesamt.slice(0, 3).join(', ')}` +
          `${fehlendeGesamt.length > 3 ? ', …' : ''}) — Shard-Byte-Vergleich übersprungen, committete Shards werden direkt validiert (§6.7).`,
      );
    } else if (dbExists) {
      console.log(`SKIP  Byte-Reprojektion: ${SOFT_LAW_DB} ohne Harvest-Zeilen (norm_referenzen/soft_law leer, z.B. nach datenhaltung:build) — committete Shards werden direkt validiert (CI-Pfad).`);
    }
    kantenGesamt = pruefeCommittedShards(gelistet);
  }

  // ── 5. Merge-Modell: jedes register-Element kuratiert ODER gelistetes DB-Dok ──
  for (const m of register.materialien) {
    if (!behoerdeIds.has(m.behoerde)) fehler.push(`${m.key}: Behörde '${m.behoerde}' nicht registriert (§0/B6, stiller Browse-Drop).`);
    if (!doktypIds.has(m.doktyp)) fehler.push(`${m.key}: Doktyp '${m.doktyp}' nicht registriert (§0/B6, stiller Browse-Drop).`);
    const istKuratiert = kuratiertKeys.has(m.key);
    const istDbGelistet = gelistet.has(m.key);
    if (!istKuratiert && !istDbGelistet) {
      fehler.push(`${m.key}: register.json-Eintrag ist weder kuratiert (MATERIAL_REGISTER) noch gelistetes DB-Dokument (Zustands-Manifest).`);
    }
    if (istKuratiert && istDbGelistet) {
      fehler.push(`${m.key}: sowohl kuratiert als auch DB-Dokument — Key-Kollision (§2.6, bestehender Key gewinnt).`);
    }
    // Wortfeld nur in EIGENEN Feldern (hinweis) — amtliche titel sind Zitat-Felder (ausgenommen).
    if (m.hinweis) {
      for (const t of wortfeldTreffer(m.hinweis)) {
        fehler.push(`${m.key}: hinweis enthält affirmatives «${t.treffer}» (§0/A7): «${t.kontext}».`);
      }
    }
  }
  // jede gelistete id genau EINMAL in register.json; keine entlistete id in register.json
  for (const id of gelistet.keys()) {
    if (!registerKeys.has(id)) fehler.push(`Zustands-Manifest listet '${id}' (gelistet), fehlt aber in register.json.`);
  }
  for (const id of entlistetIds) {
    if (registerKeys.has(id)) fehler.push(`Entlistetes Dokument '${id}' erscheint in register.json (muss raus, §2.5).`);
  }

  // ── 6. §7 a–d + Key-Abgleich/Dubletten je gelistetem DB-Dokument ──────────────
  for (const [id, z] of gelistet) {
    if (!z.stand) fehler.push(`${id}: §7(a) stand leer.`);
    if (!z.quelle_url) fehler.push(`${id}: §7(b) quelle_url leer.`);
    if (!z.drift_token) fehler.push(`${id}: §7(d) drift_token leer (Default-Schlupf, §0/A8).`);
    if (!z.abgerufen) fehler.push(`${id}: abgerufen leer (Hygiene — KEIN §7-Surrogat).`);
    // Dubletten (§2.6): quelle_url ODER (behoerde+nummer) deckungsgleich mit MATERIAL_REGISTER ⇒
    // der DB-Eintrag MUSS den bestehenden Key tragen (bestehender Key gewinnt).
    const regEintrag = register.materialien.find((m) => m.key === id);
    for (const k of MATERIAL_REGISTER) {
      if (k.key === id) continue;
      const urlMatch = k.quelleUrl === z.quelle_url;
      const nummerMatch = !!regEintrag && !!regEintrag.nummer && k.behoerde === regEintrag.behoerde && k.nummer === regEintrag.nummer;
      if (urlMatch || nummerMatch) {
        fehler.push(`Dublette (§2.6): DB-Dokument '${id}' deckt sich mit MATERIAL_REGISTER '${k.key}' (${urlMatch ? 'quelle_url' : 'behoerde+nummer'}) — bestehenden Key übernehmen.`);
      }
    }
  }

  // ── 7. Append-only + Entlistungs-Quote je Lauf-Gruppe (§2.5) ──────────────────
  pruefeEntlistungsQuote(zustand.zeilen);

  // ── 8. Wortfeld-Tor über die Quell-Dateien (§0/A7) ────────────────────────────
  const scope = [
    // *.generated.ts ausgenommen: enthält amtliche Botschafts-TITEL (Zitat-Felder, §0/A7
    // wie amtliche titel in register.json) + den negierten Provenienz-hinweis — kein
    // hand-geschriebener Nutzertext.
    ...collectFiles('src/lib/materialien', (p) => p.endsWith('.ts') && !p.endsWith('.generated.ts')),
    ...collectFiles('src/components/kontext', (p) => p.endsWith('.tsx')),
    ...collectFiles('src/pages', (p) => /\/Material[^/]*\.tsx$/.test(p)),
  ];
  for (const datei of scope) {
    for (const t of wortfeldImQuellcode(readFileSync(datei, 'utf8'))) {
      fehler.push(`${datei}: affirmatives «${t.treffer}» in Nutzertext (§0/A7): «${t.kontext}». Erlaubt sind Negationen (nicht/noch nicht/ungeprüft).`);
    }
  }

  // ── 9. Zustands-Manifest ↔ register.json-DB-Teil deckungsgleich (immer, CI-fähig) ──
  const registerDbKeys = new Set(register.materialien.filter((m) => !kuratiertKeys.has(m.key)).map((m) => m.key));
  const dbKeys = new Set(dbDocs.map((d) => d.key));
  for (const k of dbKeys) if (!registerDbKeys.has(k)) fehler.push(`Zustands-Dokument '${k}' fehlt im register.json-DB-Teil.`);
  for (const k of registerDbKeys) if (!dbKeys.has(k)) fehler.push(`register.json-DB-Eintrag '${k}' ohne Zustands-Zeile.`);

  // ── 10. Existenzliste ↔ Shard-Köpfe byte-genau (Posten 2026-09-24, kein Netz-404) ──
  // Der Loader fetcht NUR Erlasse aus KANTEN_ERLASSE. Fehlt ein Shard-Kopf in der Liste,
  // verschwänden seine Kanten still aus dem UI (§1) — darum Drift = Fehler, nicht Warnung.
  const kantenErlasseSoll = renderKantenErlasse(kantenErlasseAusVerzeichnis(KANTEN_DIR));
  const kantenErlasseIst = existsSync(KANTEN_ERLASSE_PFAD) ? readFileSync(KANTEN_ERLASSE_PFAD, 'utf8') : null;
  if (kantenErlasseIst !== kantenErlasseSoll) {
    fehler.push(
      `${KANTEN_ERLASSE_PFAD} weicht von den Shard-Köpfen in ${KANTEN_DIR} ab (Existenzliste des Loaders) — ` +
        `npm run materialien:kanten-erlasse ausführen und committen.`,
    );
  }

  const shards = existsSync(KANTEN_DIR) ? collectFiles(KANTEN_DIR, (p) => p.endsWith('.json')).length : 0;
  ausgabe(register.materialien.length, dbDocs.length, kantenGesamt, shards);
}


// ── Shard-/Bucket-Prüfung gegen die committeten Dateien (byte + Invarianten) ────
// Lokal (mit DB): Byte-Reprojektion + Orphan-Erkennung + direkte Invarianten. Der Kanten-
// Zähler stammt bewusst NICHT aus der (lokalen) DB, sondern aus den tatsächlich validierten
// committeten Shard-Dateien — sonst zeigt die Tor-Zusammenfassung strukturell 0, sobald der
// Byte-Pfad übersprungen wird, obwohl der committete Bestand tausende Kanten trägt (§6.7,
// FAHRPLAN-OFFENE-BEFUNDE.md PR #703-Nachzug). Der Byte-Vergleich läuft über `shardInhaltGleich`
// (ohne den `erzeugt`-Stempel, A2b) — ein reiner Erzeugungs-Zeitstempel-Unterschied ist kein
// fachlicher Drift (siehe db-vollstaendigkeit.ts, A1-Präzisierung).
function pruefeShardDrift(emittiertDateien: ShardDatei[], gelistet: Map<string, DokZeile>): number {
  const emittiert = new Map(emittiertDateien.map((d) => [join(KANTEN_DIR, d.pfad), d.inhalt]));
  const vorhanden = existsSync(KANTEN_DIR) ? collectFiles(KANTEN_DIR, (p) => p.endsWith('.json')) : [];
  for (const [p, inhalt] of emittiert) {
    if (!existsSync(p)) fehler.push(`Shard fehlt: ${p} — Projektion neu schreiben.`);
    else if (!shardInhaltGleich(readFileSync(p, 'utf8'), inhalt)) fehler.push(`Shard weicht von der Projektion ab: ${p}.`);
  }
  for (const p of vorhanden) if (!emittiert.has(p)) fehler.push(`Orphan-Shard (nicht mehr projiziert): ${p}.`);
  // Direkte Invarianten auf den committeten Dateien (Defense-in-depth über die Byte-Gleichheit hinaus).
  let kanten = 0;
  for (const p of vorhanden) kanten += pruefeShardDatei(p, gelistet);
  return kanten;
}

// CI (ohne DB): keine Byte-Reprojektion möglich → committete Shards DIREKT validieren
// (Invarianten + Dok-Mitgliedschaft im JSONL + Plausibilität), §0/M0-Vermerk. Ebenso der
// Fallback bei einer unvollständig geladenen lokalen DB (Vollständigkeits-Marker oben).
function pruefeCommittedShards(gelistet: Map<string, DokZeile>): number {
  const vorhanden = existsSync(KANTEN_DIR) ? collectFiles(KANTEN_DIR, (p) => p.endsWith('.json')) : [];
  let kanten = 0;
  for (const p of vorhanden) kanten += pruefeShardDatei(p, gelistet);
  return kanten;
}

interface ShardKanteRaw { dok: string; artikel?: string; quelle: string; konfidenz: string; stand: string; fundstellen?: unknown[] }
interface ShardRaw { erzeugt: string; erlass: string; dokumente?: Record<string, unknown>; kanten?: ShardKanteRaw[]; buckets?: string[] }

function pruefeShardDatei(pfad: string, gelistet: Map<string, DokZeile>): number {
  const bytes = Buffer.byteLength(readFileSync(pfad), 'utf8');
  if (bytes > SHARD_BYTE_LIMIT) fehler.push(`Shard ${pfad} ${bytes} B > ${SHARD_BYTE_LIMIT} B Budget (§0/B5).`);
  let obj: ShardRaw;
  try {
    obj = JSON.parse(readFileSync(pfad, 'utf8')) as ShardRaw;
  } catch {
    fehler.push(`Shard ${pfad}: kein gültiges JSON.`);
    return 0;
  }
  const erlassSet = new Set(ERLASS_REGISTER.map((e) => e.key));
  if (!erlassSet.has(obj.erlass)) fehler.push(`Shard ${pfad}: erlass '${obj.erlass}' nicht im ERLASS_REGISTER.`);
  const korpus = baueKorpusInfo();
  const registerKeys = new Set((JSON.parse(readFileSync(REGISTER_PFAD, 'utf8')) as MaterialManifest).materialien.map((m) => m.key));

  // Kopf-Datei mit buckets: alle Bucket-Dateien existieren, keine verwaisten.
  if (obj.buckets) {
    const bucketDir = join(KANTEN_DIR, obj.erlass);
    const erwartet = new Set(obj.buckets.map((b) => join(bucketDir, `${b}.json`)));
    for (const p of erwartet) if (!existsSync(p)) fehler.push(`Shard-Kopf ${pfad}: Bucket ${p} fehlt.`);
    if (existsSync(bucketDir)) {
      for (const f of readdirSync(bucketDir)) {
        if (f.endsWith('.json') && !erwartet.has(join(bucketDir, f))) fehler.push(`Verwaiste Bucket-Datei: ${join(bucketDir, f)}.`);
      }
    }
  }
  const dokInShard = new Set<string>();
  for (const k of obj.kanten ?? []) {
    dokInShard.add(k.dok);
    if (!QUELLEN_ENUM.has(k.quelle)) fehler.push(`Shard ${pfad}: kante.quelle '${k.quelle}' ∉ {amtlich,kuratiert,maschinell}.`);
    if (!registerKeys.has(k.dok)) fehler.push(`Shard ${pfad}: dok-Verweis '${k.dok}' existiert nicht in register.json.`);
    // NEU (§0/M0-Vermerk): jede Shard-Kante dok MUSS im Zustands-Manifest gelistet sein.
    if (!gelistet.has(k.dok)) fehler.push(`Shard ${pfad}: dok-Verweis '${k.dok}' nicht als 'gelistet' im Zustands-Manifest.`);
    if (k.artikel !== undefined && k.artikel !== '') {
      if (!erlassSet.has(obj.erlass)) continue; // schon oben gemeldet
      const set = korpus.artikelSet(obj.erlass);
      if (set === null) fehler.push(`Shard ${pfad}: artikelscharfe Kante Art. ${k.artikel} ohne Normtext-Korpus (${obj.erlass}) — muss Erlass-Ebene sein.`);
      else if (!set.has(k.artikel)) fehler.push(`Shard ${pfad}: Art. ${k.artikel} nicht im Korpus ${obj.erlass} (Geister-Anker).`);
      if (braucheDowngrade(obj.erlass, k.artikel, k.stand)) {
        fehler.push(`Shard ${pfad}: artikelscharfe Kante Art. ${k.artikel} mit Stand ${k.stand} < Cutoff ${obj.erlass} (Revisions-Regel §2.4 verletzt).`);
      }
    }
  }
  // NEU: aggregierte Kanten-Zahl plausibel — nie mehr distinkte Dokumente in EINEM Shard als im
  // ganzen Manifest gelistet sind (Tripwire gegen aufgeblähte/korrupte Shards, §0/M0-Vermerk).
  if (dokInShard.size > gelistet.size) {
    fehler.push(`Shard ${pfad}: ${dokInShard.size} distinkte Dokumente > ${gelistet.size} gelistete im Manifest — unplausibel.`);
  }
  // Zusammenfassungs-Zähler der Tor-Ausgabe: immer aus dem committeten Bestand DIESES Shards
  // (nie aus der lokalen DB, §6.7 — siehe Kommentar an den Aufrufern). Kein Downgrade-Zähler
  // mehr (A3, §17-Gegengewicht) — siehe zaehleKanten in db-vollstaendigkeit.ts.
  return zaehleKanten(obj.kanten);
}

// ── Append-only + Entlistungs-Quote je Lauf-Gruppe (§2.5) ───────────────────────
function pruefeEntlistungsQuote(zeilen: ZustandZeile[]): void {
  const bestand = new Map<SoftLawQuelle, Set<string>>();
  let aktuelleQuelle: SoftLawQuelle | null = null;
  let gruppeEntlistet = 0;
  let gruppeBestandVorher = 0;

  const gruppeAbschliessen = (): void => {
    if (aktuelleQuelle === null) return;
    if (gruppeEntlistet > Math.max(1, gruppeBestandVorher) * ENTLISTUNG_QUOTE) {
      fehler.push(`Entlistungs-Quote (§2.5): Lauf '${aktuelleQuelle}' entlistet ${gruppeEntlistet} von ${gruppeBestandVorher} (> ${ENTLISTUNG_QUOTE * 100} %) — Quell-Bruch? Snapshot prüfen.`);
    }
  };

  for (const z of zeilen) {
    if (z.typ === 'lauf') {
      gruppeAbschliessen();
      aktuelleQuelle = z.quelle;
      gruppeEntlistet = 0;
      if (!bestand.has(z.quelle)) bestand.set(z.quelle, new Set());
      gruppeBestandVorher = bestand.get(z.quelle)!.size;
    } else {
      const set = aktuelleQuelle ? bestand.get(aktuelleQuelle)! : null;
      if (z.status === 'entlistet') {
        gruppeEntlistet++;
        set?.delete(z.id);
      } else {
        set?.add(z.id);
      }
    }
  }
  gruppeAbschliessen();
}

// ── Ausgabe ─────────────────────────────────────────────────────────────────────
// Kein Downgrade-Zähler mehr (A3, Gegenprüfung PR #815, §17-Gegengewicht): der Wert war in
// JEDEM erfolgreichen Lauf strukturell 0 (jeder Downgrade-Verstoss macht den Lauf über
// pruefeShardDatei gleichzeitig rot, siehe dort) — gestrichen statt nur ehrlicher beschriftet.
function ausgabe(nReg: number, nDb: number, nKanten: number, nShards: number): void {
  for (const w of warn) console.warn(`WARN  materialien: ${w}`);
  if (fehler.length) {
    for (const f of fehler) console.error(`ROT   materialien: ${f}`);
    console.error(`\ncheck:materialien — ${fehler.length} Verstoss/Verstösse.`);
    process.exit(1);
  }
  console.log(
    `check:materialien OK — ${nReg} Materialien (${nReg - nDb} kuratiert · ${nDb} DB), ` +
      `${nKanten} Kanten · ${nShards} Shards; ` +
      `Merge-Modell + Determinismus + Revisions-/Wortfeld-Tor konsistent.`,
  );
}

// check-materialien ist ausschliesslich ein vite-node-Entry (Tests importieren den
// Wortfeld-Extractor aus wortfeld.ts, nicht diese Datei) — top-level ausführen wie die
// übrigen check-*-Skripte.
main();
