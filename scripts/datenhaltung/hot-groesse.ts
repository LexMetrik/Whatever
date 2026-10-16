// scripts/datenhaltung/hot-groesse.ts
// Speicher-Messung der HOT-Replika (A1-FUNDAMENT, Entscheid David 16.10.2026, Variante A).
//
// WAS GEMESSEN WIRD: nur die B-Baeume, die `turso-sync.ts` tatsaechlich nach Turso schreibt —
// nicht die Dateigroesse der lokalen Artefakte. Bis 16.10.2026 summierte build.ts die GANZEN
// Dateien daten/normtext.db + daten/rechtsprechung.db (754.92 MiB) und hielt sie gegen
// 1024 MiB. Rund 388 MiB davon sind Tabellen, die nie nach Turso gehen (`eintrag`,
// `dokument` u. a.); die 1024 MiB waren keine Turso-Grenze.
//
// DIE MENGE (eine Liste, §5): `SCHATTEN` — die Live-Tabellen der Replika. turso-sync.ts
// importiert sie von hier (es kann sie nicht umgekehrt liefern: das Modul startet beim Import
// den Sync). Je Tabelle zaehlen, was in Turso als eigener B-Baum entsteht:
//   - Basis-Tabellen (`BASIS`, turso-skip.ts): die Tabelle samt ALLEN ihren Indizes in
//     sqlite_master (PRIMARY-KEY-Autoindex; WITHOUT-ROWID-Tabellen haben keinen eigenen).
//   - FTS5-Tabellen: NUR die Schattentabellen, die `turso-fts-index.ts` uebertraegt
//     (`schattenDefinitionen(true)`: _config, _data, _idx, _docsize, _content). `_content`
//     entsteht nur bei standalone (fts_entscheide_schaufenster); contentless
//     (fts_artikel, `content=''`) legt SQLite gar nicht erst an — "existiert lokal" ist
//     darum dasselbe wie "wird uebertragen". Die virtuelle Tabelle selbst hat keinen B-Baum.
//
// WIE: SQLite-Virtualtabelle `dbstat` (in node:sqlite verfuegbar, geprueft auf Node 24.16),
// `SUM(pgsize)` je B-Baum — echte Seitengroesse inkl. Fuellgrad und Overflow-Seiten, keine
// Schaetzung. Freelist-Seiten gehoeren zu keinem B-Baum und zaehlen nicht (frischer Bau:
// keine).
//
// MESSGRENZE, ehrlich (§8): gemessen wird am LOKALEN Artefakt, das in Turso liegende Abbild
// weicht in drei Punkten ab (turso-skip.ts DDL_BASIS, turso-sync.ts Schritt 6):
//   1. Remote-Basistabellen tragen eine Spalte `zeilen_hash` (64 Zeichen), lokal fehlt sie.
//   2. Remote gibt es den Index `ix_artikel_erlass`, lokal nicht.
//   3. Remote gibt es die Tabelle `sync_meta` (Marken, wenige Zeilen).
// Gegenlauf mit Abbild der Remote-Form: Zahlen im Commit-/Bericht-Beleg; die Abweichung
// liegt unter 2 % der Messung und damit weit unter der Grenze.
import type { DatabaseSync } from 'node:sqlite';
import { BASIS } from './turso-skip';
import { schattenDefinitionen } from './turso-fts-index';

/** FTS5-Tabellen der Replika (Reihenfolge wie in turso-sync.ts). */
const FTS = ['fts_artikel', 'fts_entscheide_schaufenster'] as const;

/** Live-Tabellen der HOT-Replika, in Abhaengigkeits-Reihenfolge (Basis zuerst). Der Tausch in
 *  turso-sync.ts laeuft sie vorwaerts (RENAME) und rueckwaerts (DROP) ab. EINE Liste: der
 *  Sync und die Groessen-Messung lesen dieselbe. */
export const SCHATTEN = [...BASIS, ...FTS] as const;

/**
 * Speichergrenze des Turso-Gratisplans: «5GB storage».
 * Quelle: https://turso.tech/pricing, abgerufen 16.10.2026.
 * EINHEIT: als 5 · 1000³ Byte gelesen (Dezimal-GB). Meint Turso GiB (5 · 1024³ = 5 368 709 120 B),
 * waere die Grenze 7.4 % hoeher — das ist UNGEKLAERT; die Wahl ist die strengere.
 * Wert vorlaeufig, Bestaetigung David aus dem Turso-Konto ausstehend.
 */
export const TURSO_FREE_SPEICHER_BYTES = 5 * 1000 ** 3;

export interface HotBaum {
  /** Name des B-Baums in dbstat (Tabelle, Index oder Autoindex). */
  name: string;
  /** Replizierte Tabelle, zu der er gehoert (Basis-Tabelle bzw. FTS-Tabelle). */
  tabelle: string;
  bytes: number;
}

export interface HotGroesse {
  /** Summe der Seitengroessen aller replizierten B-Baeume dieser DB. */
  bytes: number;
  baeume: HotBaum[];
  /** Replizierte Tabellen (aus SCHATTEN), die in dieser DB existieren. */
  gefunden: string[];
}

/** Ordnet einen sqlite_master-Eintrag einer replizierten Tabelle zu (oder null). */
function replizierteTabelle(name: string, tblName: string): string | null {
  if ((BASIS as readonly string[]).includes(tblName)) return tblName;
  for (const fts of FTS) {
    for (const { suffix } of schattenDefinitionen(true)) {
      if (name === `${fts}${suffix}`) return fts;
    }
  }
  return null;
}

/**
 * Misst, wie viele Bytes die nach Turso replizierten Tabellen in DIESER DB belegen.
 * Rein lesend; eine Tabelle aus SCHATTEN, die hier fehlt, ist kein Fehler (jede Tabelle
 * liegt in genau einem Artefakt) — die Vollstaendigkeit prueft `pruefeAbdeckung`.
 */
export function messeReplizierteBaeume(db: DatabaseSync): HotGroesse {
  const master = db.prepare('SELECT name, tbl_name FROM sqlite_master').all() as Array<{ name: string; tbl_name: string }>;
  const zuordnung = new Map<string, string>();
  const gefunden = new Set<string>();
  for (const m of master) {
    // Virtuelle Tabellen (FTS5) stehen mit rootpage 0 in sqlite_master, tragen aber keinen
    // B-Baum — nur als "gefunden" vermerken, ihre Schattentabellen messen.
    if ((SCHATTEN as readonly string[]).includes(m.name)) gefunden.add(m.name);
    const tabelle = replizierteTabelle(m.name, m.tbl_name);
    if (tabelle) zuordnung.set(m.name, tabelle);
  }
  const seiten = db.prepare('SELECT name, SUM(pgsize) AS bytes FROM dbstat GROUP BY name').all() as Array<{
    name: string;
    bytes: number;
  }>;
  const baeume: HotBaum[] = [];
  for (const s of seiten) {
    const tabelle = zuordnung.get(s.name);
    if (tabelle) baeume.push({ name: s.name, tabelle, bytes: Number(s.bytes) });
  }
  baeume.sort((a, b) => a.name.localeCompare(b.name));
  return {
    bytes: baeume.reduce((n, b) => n + b.bytes, 0),
    baeume,
    gefunden: SCHATTEN.filter((t) => gefunden.has(t)),
  };
}

/**
 * Jede Tabelle aus SCHATTEN muss in genau EINEM Artefakt liegen. Fehlt eine, wuerde die
 * Summe still zu klein (z. B. nach einem Rename); liegt eine in zwei, wuerde doppelt
 * gezaehlt bzw. die Zuordnung zur Sync-Quelle waere unklar. Gibt Meldungen zurueck (leer = ok).
 */
export function pruefeAbdeckung(gefundenJeArtefakt: ReadonlyArray<readonly string[]>): string[] {
  const meldungen: string[] = [];
  for (const t of SCHATTEN) {
    const n = gefundenJeArtefakt.filter((g) => g.includes(t)).length;
    if (n === 0) meldungen.push(`${t}: in keinem Artefakt gefunden`);
    else if (n > 1) meldungen.push(`${t}: in ${n} Artefakten gefunden`);
  }
  return meldungen;
}

/** Ergebnis der Budget-Pruefung gegen die Turso-Free-Speichergrenze. */
export function bewerteHotBudget(bytes: number, grenze = TURSO_FREE_SPEICHER_BYTES): { ok: boolean; zeile: string } {
  const mib = (b: number): string => (b / (1024 * 1024)).toFixed(2);
  const ok = bytes < grenze;
  return {
    ok,
    zeile:
      `HOT-Replika (nach Turso repliziert) = ${mib(bytes)} MiB / Grenze Turso Free 5 GB ` +
      `(≈ ${Math.round(grenze / (1024 * 1024))} MiB) → ${ok ? 'OK' : 'ÜBERSCHRITTEN'}`,
  };
}
