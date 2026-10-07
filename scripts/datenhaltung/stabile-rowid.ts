// scripts/datenhaltung/stabile-rowid.ts
// STABILE rowid der Tabelle `artikel` (E0-BRANDSCHUTZ, Folge zu PR #1343, Befund M-1 der
// Opus-Gegenpruefung).
//
// PROBLEM. `artikel` hat einen zusammengesetzten TEXT-Primaerschluessel, also vergibt SQLite die
// rowid als Einfuegereihenfolge — und `ingest.ts` fuegt nach Dateipfad sortiert ein. Jeder neue
// oder entfernte Erlass/Artikel verschob damit die rowid ALLER Folgezeilen. Die rowid traegt aber
// den Such-Join `a.rowid = fts_artikel.rowid` (api/suche.ts) und ist darum im Turso-Delta
// (`turso-delta.ts`) Teil der Zeilen-Identitaet: eine verschobene rowid hiess DELETE + INSERT, ein
// einziger neuer Erlass mitten in der Reihenfolge ~60 000 Zeilen, die 30-%-Schwelle riss, und es
// gab den Vollneubau (~250 000 Schreibzeilen) — genau das, was das Delta verhindern soll.
// Beleg: seit 7.9.2026 aenderten 13 von 69 Manifest-Commits die artikel-Zahl; der Bund-Ausbau
// (231 → ~2150 Erlasse, Lieferungen zu <= 500) besteht aus genau solchen Einfuegungen.
//
// LOESUNG. Die rowid ist eine reine FUNKTION des Schluessels (erlass_key, art_id), nicht der
// Einfuegereihenfolge: SHA-256 ueber `erlass_key NUL art_id`, die fuehrenden ROWID_BITS Bit
// (+ 1, damit nie 0). Ein neuer/entfernter Artikel oder Erlass aendert damit die rowid keiner
// anderen Zeile. Zustandslos: kein committetes Register, das zwei parallele PRs zu Merge-
// Konflikten zwingt.
//
// WARUM (erlass_key, art_id) OHNE fassungs_token: der Token wechselt bei jeder neuen Fassung
// eines Erlasses; mit ihm im Hash bekaeme jeder Artikel einer neu gefassten Verordnung eine
// neue rowid — also genau die Verschiebung, die vermieden werden soll. Heute gilt «eine Datei =
// eine Fassung» (`erlass-rows.ts`, Fassungs-Invariante); lagen je Erlass zwei Fassungen, kaeme
// dieselbe art_id doppelt vor und der Kollisions-Riegel (unten) bricht den Bau — laut, nicht still.
//
// WARUM 52 BIT: `Number` (Hrana-Antworten, `node:sqlite`) ist nur bis 2^53 - 1 exakt; 52 Bit
// lassen eine Reserve. Kollisionswahrscheinlichkeit (Geburtstagsschranke) bei n Zeilen ≈
// n² / 2^53: n = 60 000 → 4·10⁻⁷; n = 500 000 → 2,8·10⁻⁵. Eine Kollision wird NICHT aufgeloest
// (eine Aufloesung per Sondierung machte die rowid wieder von der Reihenfolge abhaengig), sondern
// bricht den Bau rot ab — `pruefeKollision` nennt beide Schluessel; dann wird die Regel (ROWID_REGEL)
// mit einem Salz versioniert, was einen einmaligen Vollneubau kostet.
import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export const ROWID_BITS = 52;

/** Klartext der Regel. Geht in die Skip-Signatur von `artikel` ein (`turso-skip.ts`): wer die
 *  Regel aendert, erzwingt genau einmal den Neuaufbau — nie einen Skip auf Zeilen mit alten rowids. */
export const ROWID_REGEL = `artikel.rowid = 1 + erste ${ROWID_BITS} Bit von sha256(erlass_key NUL art_id) (stabile-rowid v1)`;

/** Deterministische rowid aus dem fachlichen Schluessel (siehe Kopf). Ergebnis: 1 … 2^ROWID_BITS. */
export function artikelRowid(erlassKey: string, artId: string): number {
  const d = createHash('sha256').update(erlassKey, 'utf8').update('\0').update(artId, 'utf8').digest();
  return Number(d.readBigUInt64BE(0) >> BigInt(64 - ROWID_BITS)) + 1;
}

/** Ist die rowid im Zielbereich (ganze, sicher darstellbare Zahl >= 1)? */
export function istGueltigeRowid(r: number): boolean {
  return Number.isSafeInteger(r) && r >= 1 && r <= 2 ** ROWID_BITS;
}

/**
 * Kollisions-Riegel: gehoert die rowid bereits einer ANDEREN Zeile — oder ist der Schluessel
 * schon vorhanden? Wirft mit beiden Schluesseln. (SQLite wuerde den Duplikat-Insert ohnehin mit
 * «UNIQUE constraint failed: artikel.rowid» abweisen; die Meldung hier sagt, wer kollidiert
 * und was zu tun ist.)
 */
export function pruefeKollision(db: DatabaseSync, rowid: number, erlassKey: string, artId: string): void {
  const r = db.prepare('SELECT erlass_key, art_id FROM artikel WHERE rowid = ?').get(rowid) as
    | { erlass_key: string; art_id: string }
    | undefined;
  if (!r) return;
  if (r.erlass_key === erlassKey && r.art_id === artId) {
    throw new Error(
      `stabile-rowid: «${erlassKey}|${artId}» kommt zweimal vor (zwei Fassungen je Erlass?) — ` +
        'der fassungs_token geht bewusst nicht in die rowid ein (siehe Kopf von stabile-rowid.ts).',
    );
  }
  throw new Error(
    `stabile-rowid: Kollision bei rowid ${rowid}: «${r.erlass_key}|${r.art_id}» und «${erlassKey}|${artId}» ` +
      'haben denselben Hash. Regel versionieren (Salz in ROWID_REGEL/artikelRowid) — kostet einen Neuaufbau der Replika.',
  );
}

// ── Kopplungs-Beweis ueber die rowid-MENGE ─────────────────────────────────────────
// Bis zur stabilen rowid waren die Nummern dicht (1…N): «Zeilenzahl gleich UND min/max gleich»
// bewies, dass `fts_artikel` und `artikel` dieselben rowids tragen. Bei Hash-rowids ist das nur
// noch der Rand — zwei verschiedene Mengen mit gleicher Zahl und gleichen Extremen bestehen die
// Probe, und der Such-Join (`a.rowid = fts_artikel.rowid`) zeigte auf fremde Artikel. Der
// Fingerabdruck fuegt zwei Modulo-Summen hinzu (kleine Primmoduli, damit `sum()` nicht ueber
// int64 laeuft: 60 000 · 10⁹ ≪ 9·10¹⁸); jede abweichende rowid aendert sie mit Wahrscheinlichkeit
// 1 − 1/p.
const MODUL_A = 1000000007;
const MODUL_B = 998244353;

/** SQL, das aus einer Spalte (rowid bzw. `_docsize.id`) den Mengen-Fingerabdruck bildet. */
export function rowidFingerabdruckSql(tabelle: string, spalte: string): string {
  return (
    `SELECT count(*) || '|' || min(${spalte}) || '|' || max(${spalte}) || '|' || ` +
    `sum(${spalte} % ${MODUL_A}) || '|' || sum(${spalte} % ${MODUL_B}) FROM ${tabelle}`
  );
}
