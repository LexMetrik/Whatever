// scripts/datenhaltung/turso-delta.ts
// ZEILENGENAUES Nachfuehren der Normtext-Tabellen statt Vollneubau (E0-BRANDSCHUTZ Teil A,
// 7.10.2026). Reine Logik + Orchestrierung ueber die abstrakte `Fern`-Schnittstelle: dieses
// Modul kennt weder fetch noch Token — `turso-sync.ts` reicht die Hrana-Implementierung
// hinein, der Test eine SQLite-Attrappe (Muster `turso-skip.ts`, §6.6).
//
// ANLASS (gemessen, CI-Logs turso-sync.yml, Lauf-IDs 36999017054, 37116241358, 37197504468,
// 37460148673 am 2., 3., 4. und 6.10.2026): der Skip-Plan (`turso-skip.ts`) uebersprang
// unveraenderte Tabellen, baute aber bei jeder geaenderten Signatur `artikel` (60 527 Zeilen),
// `fts_artikel` (vorgefertigter Index samt Schatten) und `erlass_fassungen` (1570) KOMPLETT
// neu — auch wenn sich drei Artikel geaendert hatten. Turso (Gratisplan) zaehlt jede
// geschriebene Zeile inkl. Index-Zeilen; im September war das Kontingent ab 15.9. gesperrt,
// die Extrapolation fuer Oktober endete um den 26.10. Entscheid David 15.9.2026: nicht
// zahlen, Wurzel-Fix. Mit dem Bund-Ausbau (231 → ~2150 Erlasse) wuerde jeder Vollneubau ein
// Vielfaches kosten.
//
// LESEN IST GUENSTIG, SCHREIBEN TEUER (turso.tech/pricing, Abruf 7.10.2026, Gratisplan):
// 500 Mio gelesene Zeilen gegen 10 Mio geschriebene je Monat — 50:1. Das Delta tauscht darum
// Schreibzeilen gegen Lesezeilen: es liest je Lauf ~130 000 Zeilen (Schluessel + Hash,
// Index-Shadow) — ein zweites Mal zur Verifikation —, um bei einer Handvoll geaenderter
// Artikel ~40–200 statt ~253 000 Zeilen zu schreiben (Rechnung im PR; Messreihe zum Index-
// Delta im Kopf von turso-fts-delta.ts).
//
// MECHANIK
//   Basis-Tabellen (`erlasse`, `erlass_fassungen`, `artikel`): jede Ziel-Zeile traegt eine
//   Spalte `zeilen_hash` (sha256 ueber den Inhalt, ohne rowid). Remote werden nur
//   (rowid, Schluessel, Hash) gelesen und mit dem lokalen Artefakt verglichen:
//     · Schluessel nur lokal ............ INSERT
//     · Schluessel nur remote ........... DELETE
//     · Schluessel beidseits, Hash ≠ .... UPDATE (eine Zeilen-Schreibung, Index unberuehrt)
//     · artikel: rowid ≠ ................ DELETE + INSERT (die rowid traegt den Such-Join
//       `a.rowid = fts_artikel.rowid` UND (bis 7.10.2026) die Ordnung `bm, rid` in api/suche.ts —
//       sie MUSS der lokalen entsprechen, sonst ist das Ergebnis nicht gleich dem Vollneubau).
//       ERGAENZUNG 7.10.2026 (E0-BRANDSCHUTZ, stabile rowid): die lokale rowid ist jetzt ein Hash
//       aus (erlass_key, art_id) (`stabile-rowid.ts`), nicht mehr die Einfuegereihenfolge — dieser
//       Zweig tritt im Regelbetrieb nicht mehr auf (`BasisDiff.verschoben` zaehlt ihn und das Log
//       nennt ihn als Ursache). Der Tie-Break der Suche ist ein fachlicher Schluessel, kein `rid`.
//   `fts_artikel`: siehe turso-fts-delta.ts (Index-Delta ueber lokale Replika).
//   ALLES in EINER Transaktion (BEGIN … COMMIT ueber baton): ein Abbruch laesst den alten,
//   vollstaendigen Stand stehen. VOR dem COMMIT, in derselben Transaktion, laufen die
//   Verifikationen (Inhalt je Zeile gegen das lokale Artefakt, Zeilenzahlen, Fingerabdruck
//   aller Index-Shadow-Zeilen, rowid-Menge) und die Marken (`sig_`/`zeilen_`, `delta_kennung`); schlaegt
//   eine fehl, wird zurueckgerollt — strenger als der Vollneubau, der erst NACH dem Tausch
//   nachkontrolliert. Die FTS-eigene Sicht (integrity-check, MATCH-Proben) folgt NACH dem
//   COMMIT auf frischen Verbindungen: eine Verbindung, die FTS5 schon benutzt hat, liest nach
//   direkten Shadow-Schreibungen in derselben Verbindung veraltet (Probe 7.10.2026).
//
// RUECKFALL AUF DEN VOLLNEUBAU (Schatten-Tabellen, unveraendert) bei:
//   · fehlender sig-Marke einer Tabelle der Gruppe (erster Lauf, unbekannter Stand)
//   · DDL-Abweichung (Schema-Aenderung — die Signatur-DDL; zusaetzlich Remote-`sqlite_master`
//     gegen die Soll-DDL, wie check-turso-frische Pruefung 0)
//   · fehlendem Index `ix_artikel_erlass`
//   · Zeilenzahl-Inkonsistenz: Remote-Zahl ≠ protokolliertes `zeilen_<t>` (Verstuemmelung)
//   · Delta-Schreibvolumen > SCHWELLE_DELTA (30 %) des Vollneubau-Schreibvolumens der
//     betroffenen Tabellen (beides in Zeilen inkl. Index-Zeilen gerechnet, s.
//     `ZEILEN_JE_BASISZEILE`): ein geaenderter Eintrag kostet beim Verschieben bis zu doppelt
//     so viele Schreibungen wie ein Vollneubau-Eintrag (DELETE + INSERT, je mit Index-Zeilen),
//     dazu kommt das Lesen; ab ~50 % waere das Delta teurer, 30 % laesst Reserve. Gerechnet
//     wird ueber die GRUPPE, nicht je Tabelle: sonst triggerte die Aenderung einer winzigen
//     Tabelle (2 von 6 Zeilen) den Vollneubau der 60 000-Zeilen-Tabelle daneben. Typischer
//     Ausloeser (bis 7.10.2026): ein NEUER Erlass mitten in der Reihenfolge verschob die rowids
//     aller Folgezeilen (lokale rowid = Einfuegereihenfolge in ingest.ts). Seit der stabilen rowid
//     nur noch beim EINMALIGEN Regelwechsel (ROWID_REGEL) — danach ist ein neuer Erlass ein Delta.
//   · jeder Fehler/jede Verifikation, die im Delta rot wird (Transaktion zurueckgerollt).
//   KEIN Rueckfall bei unklarem COMMIT-Ausgang (T-1): geht nur die COMMIT-ANTWORT verloren
//   (`CommitUnklarFehler`), traegt der Remote-Stand die `delta_kennung` dieses Laufs und besteht
//   die Verifikation auf frischen Verbindungen, ist das Delta festgeschrieben — ein Vollneubau
//   waere Verschwendung. Fehlt die Kennung, ist es nicht festgeschrieben (Rueckfall wie sonst).
//   Entscheide (`fts_entscheide_schaufenster`) laufen NICHT ueber das Delta: standalone mit
//   ~250 MiB Text, ohne Hash-Spalte (die DDL ist durch check-turso-frische Pruefung 0 fixiert)
//   und nur woechentlich neu — ~30 000 Schreibzeilen je Wochenlauf = ~0,3 % des Kontingents.
import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { istSchreibsperre, schreibeWert, BASIS, DDL_BASIS, SPALTEN_BASIS, SCHLUESSEL_BASIS, type BasisTabelle, type Signatur } from './turso-skip';
import type { Stmt, Wert } from './turso-transport';
import { buendeleStatements, gruppiereInserts, loescheStatements } from './turso-stmts';
import { berechneFtsDelta, leseSchattenUeber, schattenFingerprint, type FtsDelta } from './turso-fts-delta';
import { leseFtsSchatten } from './turso-fts-index';
import { rowidFingerabdruckSql } from './stabile-rowid';

/** Ab diesem Anteil geaenderter Zeilen gewinnt der Vollneubau (Begruendung im Kopf). */
export const SCHWELLE_DELTA = 0.3;

/** Tabellen der Gruppe, die das Delta gemeinsam traegt (Reihenfolge = Abhaengigkeit). */
export const NORMTEXT_GRUPPE = ['erlasse', 'erlass_fassungen', 'artikel', 'fts_artikel'] as const;

/** Geschriebene Zeilen je Basis-Zeile INKL. Index-Zeilen (Annahme, Abrechnung nicht
 *  belegt): Tabellenzeile + Primaerschluessel-Autoindex (+ `ix_artikel_erlass` bei artikel). */
export const ZEILEN_JE_BASISZEILE: Record<BasisTabelle, number> = { erlasse: 2, erlass_fassungen: 2, artikel: 3 };

export type Lese = (sql: string, args?: Wert[]) => Promise<Wert[][]>;

/** Eine offene Transaktion der Gegenseite. */
export interface FernTx {
  /** Fuehrt Statements aus; wirft bei JEDEM Statement-Fehler. */
  ausfuehren(stmts: Stmt[]): Promise<void>;
  lese: Lese;
}
/** Die Gegenseite (Turso per Hrana, im Test SQLite). */
export interface Fern {
  lese: Lese;
  /** BEGIN … COMMIT. Wirft `fn`, wird zurueckgerollt und der Fehler weitergereicht. Geht nur die
   *  COMMIT-ANTWORT verloren, wirft sie `CommitUnklarFehler` (ohne Rollback-Versuch). */
  transaktion<T>(fn: (tx: FernTx) => Promise<T>): Promise<T>;
}

/** Verifikation in der Transaktion fehlgeschlagen → Rollback → Rueckfall. */
export class DeltaVerifikationFehler extends Error {}

/** Das COMMIT wurde abgeschickt, seine Antwort aber ging verloren (Netz, 5xx, unbekannter baton
 *  beim Wiederholen): der Server KANN festgeschrieben haben. `Fern.transaktion` wirft dies statt
 *  eines gewoehnlichen Fehlers; `versuche` liest daraufhin den Remote-Stand, statt blind auf den
 *  Vollneubau (~250 000 Schreibzeilen) auszuweichen (T-1 der Gegenpruefung #1343). Ein COMMIT, das
 *  der Server MIT Fehlerantwort abweist, ist dagegen eindeutig nicht festgeschrieben und bleibt
 *  ein gewoehnlicher Fehler. */
export class CommitUnklarFehler extends Error {}

/** sha256 ueber den Zeileninhalt — laengen-praefixiert und typ-getaggt wie die Signaturen. */
export function zeilenHash(werte: Wert[]): string {
  const h = createHash('sha256');
  for (const w of werte) schreibeWert(h, w);
  return h.digest('hex');
}

/** Inhaltsspalten (ohne rowid) in Ladereihenfolge. */
export function inhaltsSpalten(t: BasisTabelle): string[] {
  return SPALTEN_BASIS[t].filter((s) => s !== 'rowid');
}
/** Hat die Tabelle eine tragende rowid (Such-Join)? */
export const MIT_ROWID: Record<BasisTabelle, boolean> = { erlasse: false, erlass_fassungen: false, artikel: true };
/** Spaltenliste des INSERT (rowid zuerst, wo sie traegt; `zeilen_hash` zuletzt). */
export function insertSpalten(t: BasisTabelle): string[] {
  return [...(MIT_ROWID[t] ? ['rowid'] : []), ...inhaltsSpalten(t), 'zeilen_hash'];
}

export interface BasisZeile {
  rowid: number;
  schluessel: string;
  schluesselWerte: Wert[];
  hash: string;
  /** Inhaltswerte (ohne rowid, ohne Hash) in `inhaltsSpalten`-Reihenfolge — nur lokal gefuellt. */
  werte: Wert[];
}

function schluesselVon(t: BasisTabelle, werte: Wert[]): { schluessel: string; schluesselWerte: Wert[] } {
  const sp = inhaltsSpalten(t);
  const schluesselWerte = SCHLUESSEL_BASIS[t].map((k) => werte[sp.indexOf(k)]);
  return { schluessel: JSON.stringify(schluesselWerte), schluesselWerte };
}

/** Spalten + Wert-Tupel fuer den VOLLNEUBAU-Ladepfad (`ladeTabelle` in turso-sync.ts): dieselbe
 *  Hash-Rechnung wie `leseLokalBasis` — eine Quelle (§5), sonst haette ein Vollneubau Hashes,
 *  die das naechste Delta als «geaendert» liest. */
export function ladeZeilenBasis(db: DatabaseSync, t: BasisTabelle): { spalten: string[]; werte: Wert[][] } {
  const lokal = leseLokalBasis(db, t);
  return {
    spalten: insertSpalten(t),
    werte: lokal.map((z) => [...(MIT_ROWID[t] ? [z.rowid] : []), ...z.werte, z.hash]),
  };
}

/** Lokale Zeilen des Artefakts samt Hash. */
export function leseLokalBasis(db: DatabaseSync, t: BasisTabelle): BasisZeile[] {
  const sp = inhaltsSpalten(t);
  const rows = db.prepare(`SELECT rowid AS __rid, ${sp.join(', ')} FROM ${t} ORDER BY rowid`).all() as Array<Record<string, Wert>>;
  return rows.map((r) => {
    const werte = sp.map((s) => r[s] ?? null);
    return { rowid: Number(r.__rid), ...schluesselVon(t, werte), hash: zeilenHash(werte), werte };
  });
}

/** Remote: nur (rowid, Schluessel, Hash) — der Inhalt bleibt auf der Gegenseite. */
export async function leseRemoteBasis(lese: Lese, t: BasisTabelle): Promise<BasisZeile[]> {
  const k = SCHLUESSEL_BASIS[t];
  const aus: BasisZeile[] = [];
  const seite = 20000;
  let ab = -1;
  for (;;) {
    const rows = await lese(
      `SELECT rowid, ${k.join(', ')}, zeilen_hash FROM ${t} WHERE rowid > ? ORDER BY rowid LIMIT ${seite}`,
      [ab],
    );
    for (const r of rows) {
      const schluesselWerte = r.slice(1, 1 + k.length);
      aus.push({
        rowid: Number(r[0]),
        schluessel: JSON.stringify(schluesselWerte),
        schluesselWerte,
        hash: String(r[1 + k.length]),
        werte: [],
      });
    }
    if (rows.length < seite) break;
    ab = Number(rows[rows.length - 1][0]);
  }
  return aus;
}

export interface BasisDiff {
  tabelle: BasisTabelle;
  einfuegen: BasisZeile[];
  aendern: BasisZeile[];
  /** Remote-Zeilen, die entfallen (bei rowid-Verschiebung auch der alte Stand). */
  loeschen: BasisZeile[];
  gleich: number;
  /** Zeilen mit gleichem Schluessel, aber anderer rowid (nur artikel). Seit der stabilen rowid
   *  (stabile-rowid.ts) 0 im Regelbetrieb; > 0 heisst: Regelwechsel oder Reihenfolge-Verschiebung. */
  verschoben: number;
}

/** Vergleicht lokal gegen remote ueber den Schluessel (siehe Kopf). */
export function diffBasis(t: BasisTabelle, lokal: BasisZeile[], remote: BasisZeile[]): BasisDiff {
  const rm = new Map(remote.map((r) => [r.schluessel, r]));
  const lm = new Set(lokal.map((l) => l.schluessel));
  const d: BasisDiff = { tabelle: t, einfuegen: [], aendern: [], loeschen: [], gleich: 0, verschoben: 0 };
  for (const l of lokal) {
    const r = rm.get(l.schluessel);
    if (!r) d.einfuegen.push(l);
    else if (MIT_ROWID[t] && r.rowid !== l.rowid) {
      d.loeschen.push(r);
      d.einfuegen.push(l);
      d.verschoben++;
    } else if (r.hash !== l.hash) d.aendern.push(l);
    else d.gleich++;
  }
  for (const r of remote) if (!lm.has(r.schluessel)) d.loeschen.push(r);
  return d;
}

export function diffGroesse(d: BasisDiff): number {
  return d.einfuegen.length + d.aendern.length + d.loeschen.length;
}

/** SQL des Basis-Deltas in der Reihenfolge Loeschen → Aendern → Einfuegen (ein neuer Stand
 *  einer verschobenen Zeile trifft so nie auf seinen eigenen alten Schluessel/rowid). */
export function basisStatements(d: BasisDiff): Stmt[] {
  const t = d.tabelle;
  const stmts: Stmt[] = [];
  if (MIT_ROWID[t]) {
    for (let i = 0; i < d.loeschen.length; i += 1000) {
      const teil = d.loeschen.slice(i, i + 1000);
      stmts.push({ sql: `DELETE FROM ${t} WHERE rowid IN (${teil.map(() => '?').join(', ')})`, args: teil.map((z) => z.rowid) });
    }
  } else {
    stmts.push(...loescheStatements(t, SCHLUESSEL_BASIS[t], d.loeschen.map((z) => z.schluesselWerte)));
  }
  const sp = inhaltsSpalten(t);
  const nichtSchluessel = sp.filter((s) => !SCHLUESSEL_BASIS[t].includes(s));
  for (const z of d.aendern) {
    const set = [...nichtSchluessel, 'zeilen_hash'].map((s) => `${s} = ?`).join(', ');
    const werte = [...nichtSchluessel.map((s) => z.werte[sp.indexOf(s)]), z.hash];
    if (MIT_ROWID[t]) stmts.push({ sql: `UPDATE ${t} SET ${set} WHERE rowid = ?`, args: [...werte, z.rowid] });
    else {
      stmts.push({
        sql: `UPDATE ${t} SET ${set} WHERE ${SCHLUESSEL_BASIS[t].map((s) => `${s} = ?`).join(' AND ')}`,
        args: [...werte, ...z.schluesselWerte],
      });
    }
  }
  const spalten = insertSpalten(t);
  stmts.push(
    ...gruppiereInserts(
      `INSERT INTO ${t} (${spalten.join(', ')})`,
      spalten.length,
      d.einfuegen.map((z) => [...(MIT_ROWID[t] ? [z.rowid] : []), ...z.werte, z.hash]),
    ),
  );
  return stmts;
}

function wertGleich(a: Wert, b: Wert): boolean {
  return a instanceof Uint8Array && b instanceof Uint8Array ? Buffer.compare(a, b) === 0 : a === b;
}

/** Liest die in diesem Delta geschriebenen Zeilen (neu + geaendert) im Inhalt zurueck und zaehlt
 *  die Abweichungen gegen die lokalen Werte (inkl. rowid bei artikel). */
export async function inhaltsAbweichungen(lese: Lese, d: BasisDiff): Promise<number> {
  const t = d.tabelle;
  const sp = inhaltsSpalten(t);
  const k = SCHLUESSEL_BASIS[t];
  const geschrieben = [...d.einfuegen, ...d.aendern];
  let falsch = 0;
  const paket = 300;
  for (let i = 0; i < geschrieben.length; i += paket) {
    const teil = geschrieben.slice(i, i + paket);
    const bedingung =
      k.length === 1
        ? `${k[0]} IN (${teil.map(() => '?').join(', ')})`
        : `(${k.join(', ')}) IN (VALUES ${teil.map(() => `(${k.map(() => '?').join(', ')})`).join(', ')})`;
    const rows = await lese(`SELECT rowid, ${sp.join(', ')} FROM ${t} WHERE ${bedingung}`, teil.flatMap((z) => z.schluesselWerte));
    const remote = new Map<string, Wert[]>();
    for (const r of rows) remote.set(schluesselVon(t, r.slice(1)).schluessel, r);
    for (const z of teil) {
      const r = remote.get(z.schluessel);
      const ok = r !== undefined && (!MIT_ROWID[t] || r[0] === z.rowid) && z.werte.every((w, j) => wertGleich(r[1 + j], w));
      if (!ok) falsch++;
    }
  }
  return falsch;
}

/** Quelle der Wahrheit fuer die Schreib-Schaetzung eines Basis-Deltas. */
export function basisSchreibzeilen(d: BasisDiff): number {
  const m = ZEILEN_JE_BASISZEILE[d.tabelle];
  return (d.einfuegen.length + d.loeschen.length) * m + d.aendern.length;
}

/** `sqlite_master.sql` vergleichbar machen: Quotes um den Namen (RENAME schreibt sie) und
 *  Whitespace-Laeufe fallen weg — die Spaltenliste bleibt bit-genau (vgl. check-turso-frische). */
export function normalisiereDdl(sql: string): string {
  return sql
    .replace(/^\s*CREATE\s+(VIRTUAL\s+)?TABLE\s+"?([^"\s(]+)"?/i, (_m, v: string | undefined, n: string) => `CREATE ${v ? 'VIRTUAL ' : ''}TABLE ${n}`)
    .replace(/\s+/g, ' ')
    .trim();
}

export interface Schreibvolumen {
  basis: number;
  fts: number;
  marken: number;
}

export type DeltaErgebnis =
  | { ok: true; tabellen: string[]; schreib: Schreibvolumen }
  | { ok: false; grund: string };

export interface DeltaEingabe {
  fern: Fern;
  normtext: DatabaseSync;
  /** Tabellen der Gruppe, die in diesem Lauf NICHT uebersprungen werden. */
  nichtSkip: ReadonlySet<string>;
  lokaleSig: ReadonlyMap<string, Signatur>;
  /** `sig_<tabelle>`-Marken der Replika (Tabelle → Signatur). */
  remoteSigMarken: ReadonlyMap<string, string>;
  sollZeilen: Readonly<Record<string, number>>;
  ftsDdl: (name: string) => string;
  ftsSpalten: readonly string[];
  /** MATCH-Terme, die im Korpus vorkommen MUESSEN (Verifikation vor COMMIT). */
  matchProben: string[];
  log: (zeile: string) => void;
  schwelle?: number;
  /** Kennung DIESES Laufs; steht in derselben Transaktion in `sync_meta.delta_kennung`. Nach einem
   *  unklaren COMMIT-Ausgang beweist ihr Vorliegen, dass genau dieses Delta festgeschrieben wurde.
   *  Standard: zufaellig (reine Orchestrierung, kein Teil der Rechenlogik). */
  kennung?: string;
}

const ENTSCHIEDEN = (grund: string): DeltaErgebnis => ({ ok: false, grund });

/**
 * Versucht das Delta. `ok:false` heisst «Vollneubau», NIE «Fehler»: jede Unstimmigkeit
 * (Voraussetzung, Schwelle, Verifikation) endet dort, mit begruendetem Text fuer das Log.
 * Nur eine Turso-Schreibsperre wird weitergeworfen (Exit 3 in turso-sync.ts).
 */
export async function versucheNormtextDelta(a: DeltaEingabe): Promise<DeltaErgebnis> {
  try {
    return await versuche(a);
  } catch (e) {
    if (istSchreibsperre(e)) throw e;
    return ENTSCHIEDEN(`Delta-Fehler (${e instanceof Error ? e.message : String(e)}) — Vollneubau`);
  }
}

async function versuche(a: DeltaEingabe): Promise<DeltaErgebnis> {
  const { fern, log } = a;
  const schwelle = a.schwelle ?? SCHWELLE_DELTA;
  const basisNeu = BASIS.filter((t) => a.nichtSkip.has(t));
  const ftsNeu = a.nichtSkip.has('fts_artikel');

  // ── Voraussetzungen ────────────────────────────────────────────────────────────────
  for (const t of NORMTEXT_GRUPPE) {
    if (!a.remoteSigMarken.get(t)) return ENTSCHIEDEN(`keine sig-Marke fuer ${t} — Vollneubau`);
  }
  const master = new Map(
    (await fern.lese(
      "SELECT name, sql FROM sqlite_master WHERE name IN ('erlasse','erlass_fassungen','artikel','fts_artikel','ix_artikel_erlass')",
    )).map((r) => [String(r[0]), String(r[1])]),
  );
  const sollDdl: Array<[string, string]> = [
    ...BASIS.map((t): [string, string] => [t, DDL_BASIS[t](t)]),
    ['fts_artikel', a.ftsDdl('fts_artikel')],
  ];
  for (const [t, ddl] of sollDdl) {
    const ist = master.get(t);
    if (ist === undefined) return ENTSCHIEDEN(`Tabelle ${t} fehlt remote — Vollneubau`);
    if (normalisiereDdl(ist) !== normalisiereDdl(ddl)) return ENTSCHIEDEN(`DDL von ${t} weicht ab (Schema-Aenderung) — Vollneubau`);
  }
  if (!master.has('ix_artikel_erlass')) return ENTSCHIEDEN('Index ix_artikel_erlass fehlt remote — Vollneubau');
  const marken = new Map(
    (await fern.lese("SELECT schluessel, wert FROM sync_meta WHERE schluessel LIKE 'zeilen\\_%' ESCAPE '\\'")).map((r) => [
      String(r[0]).replace(/^zeilen_/, ''),
      Number(r[1]),
    ]),
  );
  for (const t of NORMTEXT_GRUPPE) {
    const n = Number((await fern.lese(`SELECT count(*) FROM ${t}`))[0]?.[0]);
    const soll = marken.get(t);
    if (soll === undefined || !Number.isFinite(soll)) return ENTSCHIEDEN(`keine zeilen_${t}-Marke — Vollneubau`);
    if (n !== soll) return ENTSCHIEDEN(`Zeilen-Inkonsistenz ${t}: remote ${n} ≠ protokolliert ${soll} (Verstuemmelung?) — Vollneubau`);
  }

  // ── Diffs ──────────────────────────────────────────────────────────────────────────
  const lokalBasis = new Map<BasisTabelle, BasisZeile[]>();
  const diffs: BasisDiff[] = [];
  let voll = 0; // Schreibzeilen des Vollneubaus der betroffenen Tabellen
  for (const t of basisNeu) {
    const lokal = leseLokalBasis(a.normtext, t);
    lokalBasis.set(t, lokal);
    const remote = await leseRemoteBasis(fern.lese, t);
    const d = diffBasis(t, lokal, remote);
    log(`  Delta ${t}: +${d.einfuegen.length} ~${d.aendern.length} −${d.loeschen.length} (gleich ${d.gleich}${d.verschoben > 0 ? `, davon rowid-verschoben ${d.verschoben}` : ''})`);
    voll += Math.max(lokal.length, remote.length) * ZEILEN_JE_BASISZEILE[t];
    diffs.push(d);
  }
  // Frueher Ausstieg VOR der teuren Index-Rechnung (~13 s bei 60 000 Dokumenten): der Index
  // kostet im Vollneubau ~ eine Shadow-Zeile je Dokument (`_docsize`).
  const basisDelta = diffs.reduce((n, d) => n + basisSchreibzeilen(d), 0);
  if (ftsNeu) voll += a.sollZeilen['fts_artikel'] ?? 0;
  // Der Grund eines Rueckfalls gehoert ins Log (E0-BRANDSCHUTZ Ziel 4): seit der stabilen rowid
  // darf eine rowid-Verschiebung nicht mehr vorkommen — taucht sie auf, steht sie hier mit Zahl.
  const verschoben = diffs.reduce((n, d) => n + d.verschoben, 0);
  const verschiebung = verschoben > 0 ? ` [Ursache: ${verschoben} Zeilen mit anderer rowid — rowid-Regel gewechselt oder Einfuegereihenfolge verschoben]` : '';
  if (basisDelta > schwelle * voll) {
    return ENTSCHIEDEN(`Basis-Delta ${basisDelta} Schreibzeilen > ${schwelle * 100} % des Vollneubaus (${voll}) — Vollneubau${verschiebung}`);
  }
  // Wird NUR der Index neu gerechnet (artikel uebersprungen, z. B. nach einer Struktur-
  // Sidecar-Aenderung), haengt er an einer Tabelle, die dieser Lauf nicht anfasst: sie muss
  // Zeile fuer Zeile (inkl. rowid) dem lokalen Artefakt entsprechen (Korrespondenz-Riegel,
  // Gegenpruefungs-Befund B1 in turso-skip.ts — hier exakt statt per Stichprobe).
  if (ftsNeu && !a.nichtSkip.has('artikel')) {
    const nach = diffBasis('artikel', leseLokalBasis(a.normtext, 'artikel'), await leseRemoteBasis(fern.lese, 'artikel'));
    if (diffGroesse(nach) !== 0) return ENTSCHIEDEN(`artikel uebersprungen, weicht aber in ${diffGroesse(nach)} Zeilen vom lokalen Artefakt ab — Vollneubau`);
  }
  let fts: FtsDelta | null = null;
  if (ftsNeu) {
    const remote = await leseSchattenUeber(fern.lese, 'fts_artikel');
    const neu = [...leseFtsSchatten(a.normtext, 'fts_artikel', false)];
    fts = berechneFtsDelta({ ddl: a.ftsDdl, spalten: a.ftsSpalten, remote, neu });
    log(`  Delta fts_artikel: ${fts.geaenderteDokumente} Dokumente → ${fts.deltaZeilen} von ${fts.remoteZeilen} Shadow-Zeilen`);
    // Exakte Bezugsgroesse statt der Schaetzung oben: der Vollneubau schreibt ALLE Shadow-Zeilen.
    voll += fts.remoteZeilen - (a.sollZeilen['fts_artikel'] ?? 0);
    const gesamt = basisDelta + fts.deltaZeilen;
    if (gesamt > schwelle * voll) {
      return ENTSCHIEDEN(`Delta ${gesamt} Schreibzeilen > ${schwelle * 100} % des Vollneubaus (${voll}) — Vollneubau${verschiebung}`);
    }
  }
  log(`  Delta-Volumen: ${basisDelta + (fts?.deltaZeilen ?? 0)} Schreibzeilen gegen ${voll} im Vollneubau (${((100 * (basisDelta + (fts?.deltaZeilen ?? 0))) / Math.max(voll, 1)).toFixed(2)} %).`);

  // ── Statements ─────────────────────────────────────────────────────────────────────
  const stmts: Stmt[] = diffs.flatMap(basisStatements);
  if (fts) {
    for (const l of fts.loeschungen) stmts.push(...loescheStatements(`fts_artikel${l.suffix}`, l.schluesselSpalten, l.schluessel));
    for (const u of fts.upserts) {
      stmts.push(...gruppiereInserts(`INSERT OR REPLACE INTO fts_artikel${u.suffix} (${u.spalten.join(', ')})`, u.spalten.length, u.werte));
    }
  }
  const nichtSkipTabellen = [...BASIS.filter((t) => a.nichtSkip.has(t)), ...(ftsNeu ? ['fts_artikel'] : [])];
  const markenStmts = nichtSkipTabellen.flatMap((t): Array<[string, string]> => [
    [`sig_${t}`, a.lokaleSig.get(t)?.signatur ?? ''],
    [`zeilen_${t}`, String(a.sollZeilen[t])],
  ]);
  const schreib: Schreibvolumen = {
    basis: diffs.reduce((s, d) => s + basisSchreibzeilen(d), 0),
    fts: fts?.deltaZeilen ?? 0,
    marken: markenStmts.length + 1, // + delta_kennung
  };

  // ── Verifikation (laeuft in der Transaktion VOR dem COMMIT — und, nach einem unklaren COMMIT-
  //    Ausgang, auf frischen Verbindungen GEGEN den festgeschriebenen Stand) ───────────────────
  const rot = (m: string): never => {
    throw new DeltaVerifikationFehler(m);
  };
  const verifiziere = async (lese: Lese): Promise<void> => {
    // (a) Inhalt je Zeile: remote nach dem Delta == lokal (Schluessel, rowid, Hash).
    for (const d of diffs) {
      const nach = diffBasis(d.tabelle, lokalBasis.get(d.tabelle) as BasisZeile[], await leseRemoteBasis(lese, d.tabelle));
      if (diffGroesse(nach) !== 0) rot(`${d.tabelle}: nach dem Delta noch ${diffGroesse(nach)} Abweichungen gegen das lokale Artefakt`);
      // Der Hash allein bewiese nur, dass die HASH-Spalte stimmt. Darum werden die geschriebenen
      // Zeilen (neu + geaendert) im INHALT zurueckgelesen und Wert fuer Wert verglichen.
      const falsch = await inhaltsAbweichungen(lese, d);
      if (falsch > 0) rot(`${d.tabelle}: ${falsch} geschriebene Zeilen weichen im Inhalt vom lokalen Artefakt ab`);
    }
    // (b) Zeilenzahlen aller Tabellen der Gruppe == Soll (auch uebersprungene). Der Index wird
    //     ueber `_docsize` gezaehlt (eine Zeile je Dokument, gewoehnliche Tabelle) — NICHT ueber
    //     die virtuelle Tabelle: eine Verbindung, die FTS5 schon benutzt hat, haelt Struktur-
    //     Caches und liest nach direkten Shadow-Schreibungen in DERSELBEN Verbindung veraltet
    //     bzw. meldet «fts5: corruption found reading blob» (Probe 7.10.2026, SQLite-Attrappe).
    //     Eine ANDERE Verbindung sieht den neuen Stand nach COMMIT korrekt (ebenfalls belegt).
    const tabelle = (t: string) => (t === 'fts_artikel' ? 'fts_artikel_docsize' : t);
    for (const t of NORMTEXT_GRUPPE) {
      const n = Number((await lese(`SELECT count(*) FROM ${tabelle(t)}`))[0]?.[0]);
      if (n !== a.sollZeilen[t]) rot(`${t}: ${n} Zeilen ≠ Soll ${a.sollZeilen[t]}`);
    }
    // (c) Index: Fingerabdruck ALLER Shadow-Tabellen == berechneter Zielzustand. Der Zielzustand
    //     hat lokal den FTS5-integrity-check und die Instanz-Gleichheit gegen den neuen Index
    //     bestanden (berechneFtsDelta) — Gleichheit damit uebertraegt beides auf die Gegenseite.
    if (fts) {
      const ist = await leseSchattenUeber(lese, 'fts_artikel');
      if (schattenFingerprint(ist) !== schattenFingerprint(fts.nachher)) rot('fts_artikel: Shadow-Tabellen weichen vom berechneten Zielzustand ab');
    }
    // (d) rowid-Kopplung artikel == fts_artikel (der Such-Join haengt daran).
    //     Mengen-Fingerabdruck (Zahl, min, max, zwei Modulo-Summen), nicht nur die Spannweite:
    //     bei Hash-rowids beweist der Rand allein nichts (stabile-rowid.ts).
    const spanne = async (t: string, sp: string) => String((await lese(rowidFingerabdruckSql(tabelle(t), sp)))[0]?.[0]);
    const [sa, sf] = [await spanne('artikel', 'rowid'), await spanne('fts_artikel', 'id')];
    if (sa !== sf) rot(`rowid-Menge artikel ${sa} ≠ fts_artikel ${sf}`);
  };

  // ── Transaktion: anwenden → verifizieren → Marken → COMMIT ────────────────────────
  const kennung = a.kennung ?? randomUUID();
  const markenMitKennung: Array<[string, string]> = [...markenStmts, ['delta_kennung', kennung]];
  try {
    await fern.transaktion(async (tx) => {
      for (const req of buendeleStatements(stmts)) await tx.ausfuehren(req);
      await verifiziere(tx.lese);
      // (e) Marken — erst nach bestandener Verifikation (Quittung, nicht Absicht). Die Kennung
      //     dieses Laufs steht in DERSELBEN Transaktion: ihr Vorliegen beweist das COMMIT.
      await tx.ausfuehren([
        {
          sql: `INSERT INTO sync_meta (schluessel, wert) VALUES ${markenMitKennung.map(() => '(?, ?)').join(', ')}
                ON CONFLICT(schluessel) DO UPDATE SET wert = excluded.wert`,
          args: markenMitKennung.flat(),
        },
      ]);
    });
  } catch (e) {
    if (!(e instanceof CommitUnklarFehler)) throw e;
    // T-1: COMMIT abgeschickt, Antwort verloren. Erst den Remote-Stand lesen, DANN entscheiden:
    // traegt er die Kennung dieses Laufs und besteht die Verifikation auf frischen Verbindungen,
    // ist das Delta festgeschrieben und korrekt — ein Vollneubau waere reine Verschwendung.
    log(`  COMMIT-Ausgang unklar (${e.message}) — lese die Kennung des Remote-Stands ...`);
    let ist: Wert | undefined;
    try {
      ist = (await fern.lese("SELECT wert FROM sync_meta WHERE schluessel = 'delta_kennung'"))[0]?.[0];
    } catch (le) {
      if (istSchreibsperre(le)) throw le;
      return ENTSCHIEDEN(`COMMIT-Ausgang unklar und der Remote-Stand nicht lesbar (${le instanceof Error ? le.message : String(le)}) — Vollneubau`);
    }
    if (ist !== kennung) return ENTSCHIEDEN(`COMMIT-Ausgang unklar (${e.message}); Remote traegt die Kennung dieses Laufs nicht — nicht festgeschrieben, Vollneubau`);
    try {
      await verifiziere(fern.lese);
    } catch (ve) {
      return ENTSCHIEDEN(`COMMIT-Ausgang unklar; Kennung liegt vor, aber die Verifikation des festgeschriebenen Stands scheitert (${ve instanceof Error ? ve.message : String(ve)}) — Vollneubau`);
    }
    log('  COMMIT-Antwort verloren, Delta aber festgeschrieben und auf frischen Verbindungen verifiziert — kein Vollneubau.');
  }

  // NACH dem COMMIT, auf frischen Verbindungen: die FTS-eigene Sicht. Scheitert hier etwas,
  // ist der Stand zwar festgeschrieben, aber der Vollneubau stellt ihn dann (verifiziert) her.
  if (fts) {
    await fern.transaktion((tx) => tx.ausfuehren([{ sql: "INSERT INTO fts_artikel(fts_artikel) VALUES('integrity-check')" }]));
  }
  for (const w of a.matchProben) {
    const n = Number((await fern.lese('SELECT count(*) FROM fts_artikel WHERE fts_artikel MATCH ?', [`"${w}"`]))[0]?.[0]);
    if (!(n > 0)) return ENTSCHIEDEN(`nach dem Delta: fts_artikel MATCH "${w}" liefert ${n} Treffer — Vollneubau`);
  }
  return { ok: true, tabellen: nichtSkipTabellen, schreib };
}
