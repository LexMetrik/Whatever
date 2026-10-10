/**
 * Drift-Check für Norm-Snapshots (§7 Zitat-Ausnahme d — automatische Drift-Erkennung).
 *
 * Vier Prüfungen (2c = Label-/Anker-Riegel, W2·27-BUND-FERTIG):
 *   1. Bund-Fassung (OFFLINE): fassungsToken jedes Snapshots vs. Konsolidierung aus fedlex-cache.sh.
 *   2. Bund-Vollständigkeit (OFFLINE): Pflicht-Anker aus fedlex-cache.sh müssen als Snapshot existieren.
 *   2c. Label/Anker (OFFLINE): artikelLabel/quelleUrl gegen die id-Form (golden-neutral, sonst ungewacht).
 *   3. Kanton-Drift (NETZ, nur mit --netz): versionUid aus LexWork vs. fassungsToken im Snapshot.
 *
 * §2: kein Date.now/Math.random. §8: kein stilles Versagen (Exit 1 bei echten Problemen).
 * Exit 2 (nur --netz): mindestens eine Gruppe war nicht erreichbar — keine vollständige
 * Aussage; echte Drift (Exit 1) hat Vorrang. Vorher endete das als Warnung mit Exit 0
 * (Gegenprüfung 5.10.2026, MONITOR-Rückbau); der Runner check:netz begrenzt Exit 2.
 *
 * Aufruf:
 *   vite-node scripts/normtext/check-drift.ts           # offline (1+2)
 *   vite-node scripts/normtext/check-drift.ts -- --netz # mit Netz (1+2+3)
 *
 * Reine Logik (testbar, ohne FS/Netz): scripts/normtext/drift-logik.ts
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import pLimit from 'p-limit';
import { parseFedlexCacheEintraege } from './inventar-bund.ts';
import {
  sammleKantonInventar,
  sammleKantonVollinventarLexWork,
  sammleHtmInventar,
  sammleZhPdfInventar,
  sammlePdfInventar,
} from './inventar-kanton.ts';
import { holeLexWork, LexWorkShellError } from './adapter-lexwork.ts';
import { holeHtm } from './adapter-htm.ts';
import { verbindeExits } from './drift-logik.ts';
import { holeZhPdf } from './adapter-zh-pdf.ts';
import { holePdf, PDF_PROFILE } from './adapter-pdf.ts';
import { pdfLawIdSafe } from './lawid-safe.ts';
import {
  labelDeckungText,
  pruefeBundFassung,
  pruefeBundVollstaendigkeit,
  pruefeCoverage,
  pruefeLabelUrlMitDeckung,
} from './drift-logik.ts';
import type { NormSnapshot, RegisterEintragLite } from './drift-logik.ts';
import { PDF_EMBED_QUELLEN } from '../../src/lib/normtext/pdf-embed.ts';

// lawIdSafe für HTM-Quellen (kongruent zu normtext-snapshot.ts).
function htmLawIdSafe(url: string): string {
  const ti = url.match(/\/pdfatto\/atto\/(\d+)$/i);
  if (ti) return `ti-${ti[1]}`;
  const letzter = url.split('/').pop() ?? url;
  return letzter.replace(/\.html?$/i, '');
}

// lawIdSafe für ZH (kongruent zu normtext-snapshot.ts): …/erlass-211_11-… → «211.11».
function zhLawIdSafe(url: string): string {
  const m = url.match(/\/erlass-([^-]+)-/);
  return m ? m[1].replace(/_/g, '.') : url.replace(/[^a-z0-9.]+/gi, '_');
}

// pdfLawIdSafe (inkl. olexAt/olexPar) liegt zentral in ./lawid-safe.ts (§5, C1-1)
// — importiert oben; die frühere Handkopie kannte die olex-Profile nicht.

interface SnapshotDatei {
  erzeugt: string;
  eintraege: NormSnapshot[];
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

function ladeBundSnapshots(): { snapshots: NormSnapshot[]; snapshotIds: Set<string> } {
  const bundDir = 'public/normtext/bund';
  if (!existsSync(bundDir)) {
    return { snapshots: [], snapshotIds: new Set() };
  }

  const snapshots: NormSnapshot[] = [];
  const snapshotIds = new Set<string>();

  for (const datei of readdirSync(bundDir)) {
    if (!datei.endsWith('.json')) continue;
    const pfad = `${bundDir}/${datei}`;
    const inhalt = JSON.parse(readFileSync(pfad, 'utf8')) as SnapshotDatei;
    for (const e of inhalt.eintraege ?? []) {
      snapshots.push(e);
      snapshotIds.add(e.id);
    }
  }

  return { snapshots, snapshotIds };
}

function ladeKantonFassungsTokens(): Map<string, string> {
  // Map: "<KT>/<lawId>" → fassungsToken (erster Snapshot der Datei; alle Einträge teilen denselben)
  const kantonDir = 'public/normtext/kanton';
  const map = new Map<string, string>();
  if (!existsSync(kantonDir)) return map;

  for (const datei of readdirSync(kantonDir)) {
    if (!datei.endsWith('.json') || datei === 'index.json') continue;
    const pfad = `${kantonDir}/${datei}`;
    const inhalt = JSON.parse(readFileSync(pfad, 'utf8')) as SnapshotDatei;
    const eintraege = inhalt.eintraege ?? [];
    if (eintraege.length === 0) continue;

    // id-Format: "kanton/<KT>/<lawId>/art_xxx"
    const erster = eintraege[0];
    const teile = erster.id.split('/');
    if (teile.length < 4 || teile[0] !== 'kanton') continue;

    const kt = teile[1];
    const lawId = teile[2];
    map.set(`${kt}/${lawId}`, erster.fassungsToken);
  }

  return map;
}

/** Anzahl committeter Kanton-Snapshot-Einträge (für den «ungeprüft»-Ausweis der Label-Deckung). */
function zaehleKantonEintraege(): number {
  const kantonDir = 'public/normtext/kanton';
  if (!existsSync(kantonDir)) return 0;
  let n = 0;
  for (const datei of readdirSync(kantonDir)) {
    if (!datei.endsWith('.json') || datei === 'index.json') continue;
    const inhalt = JSON.parse(readFileSync(`${kantonDir}/${datei}`, 'utf8')) as SnapshotDatei;
    n += inhalt.eintraege?.length ?? 0;
  }
  return n;
}

// ─── Hauptprogramm ────────────────────────────────────────────────────────────

// Höfliche Nebenläufigkeit (Werkzeug-Audit §Audit-1): die Netz-Drift-Schleifen
// holen bis zu FETCH_CONCURRENCY Quellen gleichzeitig. DETERMINISMUS: nur die
// (reinen) Re-Fetches laufen parallel; die Verarbeitung (Console-Ausgabe,
// Zähler, exitCode) bleibt danach seriell in unveränderter Inventar-Reihenfolge.
const FETCH_CONCURRENCY = 4;

async function main(): Promise<void> {
  const mitNetz = process.argv.includes('--netz');

  const shellQuelle = readFileSync('scripts/fedlex-cache.sh', 'utf8');
  const cacheEintraege = parseFedlexCacheEintraege(shellQuelle);

  // cacheMap: name (lowercase) → konsolidierung
  const cacheMap = new Map<string, string>(
    cacheEintraege.map((e) => [e.name.toLowerCase(), e.konsolidierung]),
  );

  // ankerMap: name (lowercase) → Pflicht-Anker-Array
  const ankerMap = new Map<string, string[]>(
    cacheEintraege.map((e) => [e.name.toLowerCase(), e.anker]),
  );

  const { snapshots, snapshotIds } = ladeBundSnapshots();

  let exitCode = 0;
  let netzFehler = 0; // Gruppen ohne Aussage (Quelle nicht erreichbar), alle Netz-Prüfungen

  // ─── Prüfung 1: Bund-Fassung (offline) ─────────────────────────────────────
  const mismatches = pruefeBundFassung(snapshots, cacheMap);
  if (mismatches.length > 0) {
    console.error('\nFEHLER Bund-Fassung: fassungsToken stimmt nicht mit Cache überein:');
    for (const m of mismatches) {
      console.error(
        `  ${m.id}: Snapshot "${m.snapshotToken}" ≠ Cache "${m.cacheToken}" — \`npm run normtext\` neu laufen`,
      );
    }
    exitCode = 1;
  }

  // ─── Prüfung 2: Bund-Vollständigkeit (offline) ─────────────────────────────
  const fehlend = pruefeBundVollstaendigkeit(snapshotIds, ankerMap);
  if (fehlend.length > 0) {
    console.error('\nFEHLER Bund-Vollständigkeit: Pflicht-Anker ohne Snapshot:');
    for (const id of fehlend) {
      console.error(`  ${id}`);
    }
    exitCode = 1;
  }

  // ─── Prüfung 2b: Coverage-Assertion (offline, P1-b) ────────────────────────
  // Kein gehosteter Bund-Volltext ohne Currency-Überwachung. Register-SSoT.
  let coverageStatus = 'ok';
  const registerPfad = 'public/normtext/register.json';
  if (existsSync(registerPfad)) {
    const register = JSON.parse(readFileSync(registerPfad, 'utf8')) as {
      erlasse: RegisterEintragLite[];
    };
    const pinEliSet = new Set(cacheEintraege.map((e) => e.eli));
    const pdfEmbedKeys = new Set(PDF_EMBED_QUELLEN.map((q) => q.key));
    const luecken = pruefeCoverage(register.erlasse ?? [], pinEliSet, pdfEmbedKeys);
    if (luecken.length > 0) {
      console.error('\nFEHLER Coverage: gehosteter Bund-Volltext ohne Currency-Pin:');
      for (const l of luecken) console.error(`  ${l.key}: ${l.grund}`);
      coverageStatus = `${luecken.length} ungepinnt`;
      exitCode = 1;
    }
  } else {
    coverageStatus = 'übersprungen (register.json fehlt)';
  }

  // ─── Prüfung 2c: Label-/Anker-Riegel (offline, W2·27-BUND-FERTIG) ──────────
  const { befunde: labelUrl, deckung: labelDeckung } = pruefeLabelUrlMitDeckung(
    snapshots,
    new Map(cacheEintraege.map((e) => [e.name.toLowerCase(), e.eli])),
  );
  if (labelUrl.length > 0) {
    console.error('\nFEHLER Label/Anker: artikelLabel/quelleUrl passen nicht zur id (golden-neutral, sonst ungewacht):');
    for (const b of labelUrl) console.error(`  [${b.regel}] ${b.id}: ${b.text}`);
    exitCode = 1;
  }

  // Kanton-Labels: kein #Anker, Label nicht aus der id ableitbar → vom Riegel
  // UNGEPRÜFT; das Tor weist das aus (§8), statt «ok» zu suggerieren.
  console.log(`  Label-Deckung: ${labelDeckungText(labelDeckung, zaehleKantonEintraege())}`);

  // ─── Report Prüfung 1+2 ────────────────────────────────────────────────────
  const gepruefte = snapshots.filter((s) => s.id.startsWith('bund/')).length;
  const driftStatus = mismatches.length === 0 ? 'ok' : `${mismatches.length} Mismatch(es)`;
  const fehlendStatus = fehlend.length === 0 ? 'ok' : `${fehlend.length} fehlend`;
  console.log(
    `check:normtext (offline): ${gepruefte} Bund-Snapshots geprüft — Drift: ${driftStatus}, Fehlend: ${fehlendStatus}, Coverage: ${coverageStatus}, Label/Anker: ${labelUrl.length === 0 ? 'ok' : `${labelUrl.length} Befund(e)`}`,
  );

  // ─── Prüfung 3: Kanton-Drift (NETZ) ────────────────────────────────────────
  if (mitNetz) {
    console.log('\ncheck:normtext-netz: Kanton-Drift prüfen …');
    // §6.7-Wurzel-Fix (Fund #694, 12.9.2026): sammleKantonInventar() deckt nur
    // die tarif-zitierten LexWork-Gruppen ab (69 von 1189 committeten LexWork-
    // Kanton-Snapshots, Nullprobe 12.9.2026) — ein Erlass ohne Tarif-Zitat
    // driftete dadurch unbemerkt (BS-121.100 u. a., ROADMAP-CHRONIK.md (git 3fd5db8f9:ROADMAP-CHRONIK.md),
    // «Kanton-Fremd-Drift AR/BS (26 Erlasse) + Vollabdeckungs-Tor»).
    // Vollabdeckung: Tarif-Gruppen ∪ alle committeten LexWork-Snapshots,
    // dedupliziert über denselben Gruppen-Schlüssel wie sammleKantonInventar.
    const tarifGruppen = sammleKantonInventar();
    const vollGruppen = sammleKantonVollinventarLexWork();
    const tarifSchluessel = new Set(tarifGruppen.map((g) => `${g.kanton}|${g.host}|${g.lang}|${g.lawId}`));
    const gruppen = [
      ...tarifGruppen,
      ...vollGruppen.filter((g) => !tarifSchluessel.has(`${g.kanton}|${g.host}|${g.lang}|${g.lawId}`)),
    ];
    const kantonTokens = ladeKantonFassungsTokens();

    let kantonGeprüft = 0;
    let kantonDrift = 0;
    let kantonWarnungen = 0;
    let kantonShell = 0;

    const kantonLimit = pLimit(FETCH_CONCURRENCY);
    const kantonAbrufe = await Promise.all(
      gruppen.map((gruppe) =>
        kantonLimit(async (): Promise<{ skip: true } | { ok: true; ergebnis: Awaited<ReturnType<typeof holeLexWork>> } | { ok: false; msg: string; shell: boolean }> => {
          // Gruppen ohne Snapshot NICHT über das Netz holen (wie seriell).
          if (kantonTokens.get(`${gruppe.kanton}/${gruppe.lawId}`) === undefined) return { skip: true };
          try {
            // A1 (Gegenprüfung PR #828): zweisprachige Erlasse tragen im
            // Bestands-Key (gruppe.lawId) den Sprachsuffix, die LexWork-API-URL
            // nicht — fetchLawId ist die suffixfreie, fetch-taugliche Form.
            return { ok: true, ergebnis: await holeLexWork(gruppe.host, gruppe.lang, gruppe.fetchLawId ?? gruppe.lawId) };
          } catch (err) {
            // Soft-404-Shell (Endpunkt migriert/tot) ist ein HARTER Fehler, kein
            // transienter Netz-Blip: sonst veraltet der Snapshot still (GL-Klasse).
            return { ok: false, msg: err instanceof Error ? err.message : String(err), shell: err instanceof LexWorkShellError };
          }
        }),
      ),
    );

    for (let i = 0; i < gruppen.length; i++) {
      const gruppe = gruppen[i];
      const abruf = kantonAbrufe[i];
      if ('skip' in abruf) continue; // kein Snapshot → überspringen
      const key = `${gruppe.kanton}/${gruppe.lawId}`;
      const snapshotToken = kantonTokens.get(key)!;

      if (!abruf.ok) {
        if (abruf.shell) {
          // Soft-404-Shell = HARTER Fehler: der strukturierte Endpunkt liefert
          // keine Daten mehr, der Snapshot würde still veralten (die GL-Klasse,
          // 11.7.2026). Exit 1, damit die Klasse nie wieder unbemerkt driftet.
          console.error(
            `FEHLER Kanton-Soft-404: ${gruppe.kanton} ${gruppe.lawId}: ${abruf.msg}`,
          );
          kantonShell++;
          exitCode = 1;
          continue;
        }
        // Transienter Netzfehler → Warnung, kein harter Fehler (§8: transparent).
        console.warn(`WARNUNG Kanton-Netz: ${gruppe.kanton} ${gruppe.lawId}: ${abruf.msg}`);
        kantonWarnungen++;
        netzFehler++;
        continue;
      }
      const ergebnis = abruf.ergebnis;

      if (ergebnis.meta.nurPdf) {
        // nurPdf-Erlass → überspringen
        continue;
      }

      kantonGeprüft++;
      const neueUid = ergebnis.meta.versionUid;

      if (neueUid && neueUid !== snapshotToken) {
        console.error(
          `FEHLER Kanton-Drift: ${gruppe.kanton} ${gruppe.lawId}: version_uid "${neueUid}" ≠ Snapshot "${snapshotToken}" — Snapshot neu erzeugen`,
        );
        kantonDrift++;
        exitCode = 1;
      }
    }

    console.log(
      `check:normtext-netz: ${kantonGeprüft} Kanton-Gruppen geprüft — Drift: ${kantonDrift}, Soft-404-Shells: ${kantonShell}, Netz-Warnungen: ${kantonWarnungen}`,
    );

    // ─── Prüfung 4: HTM-Drift (NETZ) — quelleHash statt version_uid ──────────
    // NE/GE-HTM-Quellen haben kein version_uid. Drift-Token ist der quelleHash
    // des extrahierten Volltexts (fassungsToken im Snapshot). Re-fetch +
    // quelleHash-Vergleich erkennt jede inhaltliche Quellen-Änderung (§7 d).
    console.log('\ncheck:normtext-netz: HTM-Drift (NE/GE) prüfen …');
    const htmGruppen = sammleHtmInventar();
    let htmGeprüft = 0;
    let htmDrift = 0;
    let htmWarnungen = 0;

    const htmLimit = pLimit(FETCH_CONCURRENCY);
    const htmAbrufe = await Promise.all(
      htmGruppen.map((g) =>
        htmLimit(async (): Promise<{ skip: true } | { ok: true; ergebnis: Awaited<ReturnType<typeof holeHtm>> } | { ok: false; msg: string }> => {
          if (kantonTokens.get(`${g.kanton}/${htmLawIdSafe(g.quelleUrl)}`) === undefined) return { skip: true };
          try {
            // Ohne `referenz`: dieses Tor vergleicht ausschliesslich den
            // quelleHash gegen den committeten fassungsToken. Der Zukunftsfilter
            // wirkt nur auf `meta.stand`, das hier nie gelesen wird — ihn zu
            // setzen änderte kein Verdikt, brächte aber die Wanduhr in ein Tor.
            return { ok: true, ergebnis: await holeHtm(g.quelleUrl, g.profil) };
          } catch (err) {
            return { ok: false, msg: err instanceof Error ? err.message : String(err) };
          }
        }),
      ),
    );

    for (let i = 0; i < htmGruppen.length; i++) {
      const g = htmGruppen[i];
      const abruf = htmAbrufe[i];
      if ('skip' in abruf) continue; // kein Snapshot → überspringen
      const snapshotToken = kantonTokens.get(`${g.kanton}/${htmLawIdSafe(g.quelleUrl)}`)!;

      if (!abruf.ok) {
        console.warn(`WARNUNG HTM-Netz: ${g.kanton} ${g.quelleUrl}: ${abruf.msg}`);
        htmWarnungen++;
        netzFehler++;
        continue;
      }
      const ergebnis = abruf.ergebnis;
      htmGeprüft++;
      const neuerHash = ergebnis.meta.quelleHash;
      if (neuerHash && neuerHash !== snapshotToken) {
        console.error(
          `FEHLER HTM-Drift: ${g.kanton} ${htmLawIdSafe(g.quelleUrl)}: quelleHash "${neuerHash.slice(0, 12)}…" ≠ Snapshot "${snapshotToken.slice(0, 12)}…" — Snapshot neu erzeugen`,
        );
        htmDrift++;
        exitCode = 1;
      }
    }

    console.log(
      `check:normtext-netz: ${htmGeprüft} HTM-Gruppen geprüft — Drift: ${htmDrift}, Netz-Warnungen: ${htmWarnungen}`,
    );

    // ─── Prüfung 5: ZH-Drift (NETZ) — Byte-Hash der QUELLE (zhlex Text-PDF) ──
    //
    // ZH-PDF-Quellen haben kein version_uid. Bis zur Fix-Runde 3 diente der
    // Hash der EXTRAKTION als Drift-Token — und war damit strukturell blind:
    // ändert die amtliche Quelle etwas in einem Teil, den der Adapter bewusst
    // verwirft (Übergangs-/Schlussapparat, PBG-Anhang, Fussnoten-Apparat; bei
    // ZH-700.1 zusammen 14 % der Textzeilen), bleibt der Hash gleich und diese
    // Prüfung schweigt. Ein Token, der ausgerechnet die Fläche nicht sieht, die
    // der Lücken-Index als Lücke ausweist, ist keiner (§7 d).
    //
    // SEIT FIX-RUNDE 3 ist `meta.quelleHash` der sha256 der ROHEN PDF-Bytes.
    // Die Prüfung läuft damit ZWEISTUFIG: erst Byte-Hash (sieht jede
    // Quell-Änderung), und NUR bei Abweichung interessiert die zweite Frage —
    // hat sich auch der extrahierte Wortlaut geändert (`meta.extraktHash`)?
    // Das trennt «Quelle neu gesetzt, Wortlaut gleich» von «Wortlaut geändert»
    // und sagt der Folge-Session, wie dringend die Neuerzeugung ist.
    //
    // MODUS `netz` ist hier zwingend: der Roh-PDF-Cache (O1) beschleunigt jede
    // andere Stelle, aber Frische holt ausschliesslich der Drift-Check — sonst
    // prüfte der Cache sich selbst (§5: massgeblich ist die amtliche Fassung).
    console.log('\ncheck:normtext-netz: ZH-Drift (zhlex PDF, Byte-Hash) prüfen …');
    // ZH-4a (31.8.2026): sammleZhPdfInventar() liefert seit der deklarativen
    // Quellenliste die VEREINIGUNG aus Tarif-Ableitung und `ZH_QUELLEN`
    // (zh-quellen.ts), dedupliziert über die Registry-URL. Damit ist auch ein
    // ZH-Erlass OHNE Tarif-Zitat driftüberwacht — vorher war er hier
    // unsichtbar (§7-d-Lücke, Dossier §7). Kein Eingriff nötig: die Prüfung
    // liest dieselbe Inventar-Funktion wie der Generator (§5, eine Quelle).
    const zhGruppen = sammleZhPdfInventar();
    let zhGeprüft = 0;
    let zhDrift = 0;
    let zhWarnungen = 0;

    const zhLimit = pLimit(FETCH_CONCURRENCY);
    const zhAbrufe = await Promise.all(
      zhGruppen.map((g) =>
        zhLimit(async (): Promise<{ skip: true } | { ok: true; ergebnis: Awaited<ReturnType<typeof holeZhPdf>> } | { ok: false; msg: string }> => {
          if (kantonTokens.get(`${g.kanton}/${zhLawIdSafe(g.quelleUrl)}`) === undefined) return { skip: true };
          try {
            return { ok: true, ergebnis: await holeZhPdf(g.quelleUrl, 'netz') };
          } catch (err) {
            return { ok: false, msg: err instanceof Error ? err.message : String(err) };
          }
        }),
      ),
    );

    for (let i = 0; i < zhGruppen.length; i++) {
      const g = zhGruppen[i];
      const abruf = zhAbrufe[i];
      if ('skip' in abruf) continue;
      const snapshotToken = kantonTokens.get(`${g.kanton}/${zhLawIdSafe(g.quelleUrl)}`)!;
      if (!abruf.ok) {
        console.warn(`WARNUNG ZH-Netz: ${g.kanton} ${g.quelleUrl}: ${abruf.msg}`);
        zhWarnungen++;
        netzFehler++;
        continue;
      }
      const ergebnis = abruf.ergebnis;
      zhGeprüft++;
      const neuerHash = ergebnis.meta.quelleHash;
      if (neuerHash && neuerHash !== snapshotToken) {
        // Zweite Stufe: sagt, WAS sich geändert hat. Der Extraktions-Hash steht
        // nicht im Snapshot (die Schema-Erweiterung liegt im fremden
        // Datenhaltungs-Strang) — er wird darum gegen den frisch berechneten
        // Wortlaut-Hash des Snapshots gehalten, den derselbe Lauf mitliefert.
        console.error(
          `FEHLER ZH-Drift: ${g.kanton} ${zhLawIdSafe(g.quelleUrl)}: Quell-Bytes "${neuerHash.slice(0, 12)}…" ≠ Snapshot-fassungsToken "${snapshotToken.slice(0, 12)}…"` +
            ` (Extraktions-Hash der frischen Quelle: ${ergebnis.meta.extraktHash.slice(0, 12)}…, ${ergebnis.meta.quellBytes} Bytes) — Snapshot neu erzeugen`,
        );
        zhDrift++;
        exitCode = 1;
      }
    }

    console.log(
      `check:normtext-netz: ${zhGeprüft} ZH-Gruppen geprüft — Drift: ${zhDrift}, Netz-Warnungen: ${zhWarnungen}`,
    );

    // ─── Prüfung 6: PDF-Drift (NETZ) — quelleHash (SZ/TI/VD/JU Text-PDF) ──────
    // Generische PDF-Quellen haben kein version_uid → quelleHash des extrahierten
    // Volltexts als Drift-Token (§7 d). Re-fetch + Vergleich.
    console.log('\ncheck:normtext-netz: PDF-Drift (SZ/TI/VD/JU) prüfen …');
    const pdfGruppen = sammlePdfInventar();
    let pdfGeprüft = 0;
    let pdfDrift = 0;
    let pdfWarnungen = 0;
    // C1-1: Gruppen ohne Snapshot-Treffer NICHT mehr still überspringen, sondern
    // sammeln und sichtbar machen. Ein Teil davon ist legitim (PDF-Quelle ohne
    // Snapshot = Live-Link-Fallback) → kein harter Tor-Fehler; aber ein erneuter
    // Schlüssel-Drift (wie der olex-Bug) fällt so sofort in der Gate-Ausgabe auf.
    const pdfOhneSnapshot: string[] = [];

    const pdfLimit = pLimit(FETCH_CONCURRENCY);
    const pdfAbrufe = await Promise.all(
      pdfGruppen.map((g) =>
        pdfLimit(async (): Promise<{ skip: true } | { ok: true; ergebnis: Awaited<ReturnType<typeof holePdf>> } | { ok: false; msg: string }> => {
          if (kantonTokens.get(`${g.kanton}/${pdfLawIdSafe(g.profil, g.quelleUrl)}`) === undefined) return { skip: true };
          try {
            // Ohne `referenz` — gleiche Begründung wie beim HTM-Zweig oben:
            // verglichen wird der quelleHash, nicht der Stand.
            return { ok: true, ergebnis: await holePdf(g.quelleUrl, PDF_PROFILE[g.profil]) };
          } catch (err) {
            return { ok: false, msg: err instanceof Error ? err.message : String(err) };
          }
        }),
      ),
    );

    for (let i = 0; i < pdfGruppen.length; i++) {
      const g = pdfGruppen[i];
      const abruf = pdfAbrufe[i];
      const key = `${g.kanton}/${pdfLawIdSafe(g.profil, g.quelleUrl)}`;
      const snapshotToken = kantonTokens.get(key);
      if ('skip' in abruf || snapshotToken === undefined) { pdfOhneSnapshot.push(`${g.kanton}/${g.profil} ${key}`); continue; }
      if (!abruf.ok) {
        console.warn(`WARNUNG PDF-Netz: ${g.kanton} ${g.quelleUrl}: ${abruf.msg}`);
        pdfWarnungen++;
        netzFehler++;
        continue;
      }
      const ergebnis = abruf.ergebnis;
      pdfGeprüft++;
      const neuerHash = ergebnis.meta.quelleHash;
      if (neuerHash && neuerHash !== snapshotToken) {
        console.error(
          `FEHLER PDF-Drift: ${g.kanton} ${pdfLawIdSafe(g.profil, g.quelleUrl)}: quelleHash "${neuerHash.slice(0, 12)}…" ≠ Snapshot "${snapshotToken.slice(0, 12)}…" — Snapshot neu erzeugen`,
        );
        pdfDrift++;
        exitCode = 1;
      }
    }

    console.log(
      `check:normtext-netz: ${pdfGeprüft} PDF-Gruppen geprüft — Drift: ${pdfDrift}, Netz-Warnungen: ${pdfWarnungen}, ohne Snapshot (Live-Link/ungeprüft): ${pdfOhneSnapshot.length}`,
    );
    if (pdfOhneSnapshot.length) {
      console.log('  PDF-Gruppen ohne Snapshot-Treffer (Drift NICHT geprüft):');
      for (const z of pdfOhneSnapshot) console.log(`    – ${z}`);
    }
  }

  if (netzFehler > 0) {
    console.error(
      `\ncheck:normtext-netz: ${netzFehler} Gruppe(n) nicht erreichbar — KEINE vollständige Aussage` +
        (exitCode === 0 ? ' (Exit 2).' : ' (echter Befund hat Vorrang, Exit 1).'),
    );
  }
  process.exit(verbindeExits([exitCode, netzFehler > 0 ? 2 : 0]));
}

main().catch((err) => {
  console.error('check-drift: unerwarteter Fehler:', err);
  process.exit(1);
});
