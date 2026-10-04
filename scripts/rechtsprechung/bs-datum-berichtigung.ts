// ─── BS-Datumsberichtigung des Bestands (Variante A, 4.10.2026) ──────────────
//
// Aus bs-parse.ts herausgelöst (§6.6); Rohdokumente → Bestand, offline.

import { existsSync, readFileSync } from 'node:fs';
import { rawPfad } from './bs-fetch';
import type { Inventar } from './bs-inventar';
import { parseBsDokument, baueSnapshot, bsWahlVon } from './bs-parse';
import type { KopfDatumFund } from './bs-datum';
import { ladeBestandSnapshots, schreibeKorpus } from '../normtext/entscheide-schreiben';
import type { EntscheidSnapshot } from '../../src/lib/rechtsprechung/typen';

// ─── Berichtigung des Bestands: Kopf-Datum vor Portal-Metadatum (Variante A) ──
//
// Entscheid David 4.10.2026: «Ich lasse die Regel für Basel als eigenen geprüften
// Schritt bauen, berichtige dabei auch die alten Basler Daten». Der Kopf steht NICHT
// im Snapshot (`abschnitte` beginnen nach dem Deckblatt) — die Ableitung braucht die
// Rohdokumente (`daten/bs-fiw/raw/`, nicht eingecheckt; Abruf: `bs-import
// --fetch-only`). Je Bestands-Snapshot wird mit DERSELBEN Regel wie im Import neu
// gebaut (`baueSnapshot`); übernommen werden ausschliesslich `datum`, `zitierung`,
// `datumPortal`, `datumKopfAbweichend`, `datumUnbekannt` und — nur bei geändertem Datum —
// `abgerufen`. Die LISTE ist auf das Portal-Datum bezogen (alt = Portal, neu = Kopf) und damit
// bei jedem Lauf gleich (Fixpunkt, auch auf bereits berichtigtem Bestand).
// Vorbedingungen je Dokument (sonst NICHT angefasst, sondern ausgewiesen): Inventar-
// Zeile da, gleiche GN, Portal-Metadatum == Inventar, gleiche id, gleicher Text-`sha`.
// Die id bleibt auch dann stehen, wenn ein docketSafe-Suffix das alte Portal-Datum
// trägt (stabile URLs, §6) — die Kollisionsregel rechnet weiter mit dem Portal-Datum.

export interface BsDatumAenderung {
  id: string;
  gn: string;
  key: number;
  /** Portal-Metadatum (Inventar) — der Stand VOR der Variante A. */
  alt: string;
  /** Kopf-Datum, jetzt `datum`. */
  neu: string;
  tage: number;
  fund: KopfDatumFund | null;
  url: string;
}
export interface BsDatumVerdacht {
  id: string; gn: string; key: number; grund: string; url: string;
  portal: string | null; kopf: string | null; fund: KopfDatumFund | null;
}
export interface BsDatumBericht {
  geprueft: number;
  /** Kopf lesbar und gleich dem Portal-Datum. */
  kopfGleich: number;
  /** Kein Kopf-Datum lesbar (Rückfall Portal bzw. Platzhalter). */
  ohneKopf: number;
  /** Portal ohne Entscheiddatum, Kopf-Datum füllt die Lücke (B-1). */
  portalOhneDatum: number;
  /** Kopf-Datum übernommen, weicht vom Portal ab (→ `datumPortal`). */
  aenderungen: BsDatumAenderung[];
  /** Kopf-Datum nicht übernommen (→ Portal bleibt, `datumKopfAbweichend`-Hinweis). */
  verdacht: BsDatumVerdacht[];
  uebersprungen: Array<{ id: string; grund: string }>;
  /** In DIESEM Lauf tatsächlich geänderte Bestands-Snapshots (0 = Fixpunkt). */
  geschrieben: number;
}

export function berichtigeBsDatum(inventar: Inventar, datum: string, schreibe = true): BsDatumBericht {
  const bestand = ladeBestandSnapshots();
  const zeileVon = new Map(inventar.eintraege.map((z) => [z.key, z] as const));
  const bericht: BsDatumBericht = { geprueft: 0, kopfGleich: 0, ohneKopf: 0, portalOhneDatum: 0, aenderungen: [], verdacht: [], uebersprungen: [], geschrieben: 0 };
  bestand.forEach((alt, i) => {
    if (alt.quelle !== 'gerichte-bs') return;
    const m = /nF30_KEY=(\d+)/.exec(alt.quelleUrl);
    if (!m) throw new Error(`[datum-kopf] ${alt.id}: kein nF30_KEY in quelleUrl`);
    const key = Number(m[1]);
    const z = zeileVon.get(key);
    const skip = (grund: string) => { bericht.uebersprungen.push({ id: alt.id, grund }); };
    if (!z) return skip('nicht im Inventar');
    const pfad = rawPfad(key);
    if (!existsSync(pfad)) throw new Error(`[datum-kopf] Rohdatei fehlt: ${alt.nummer} (key ${key}) — zuerst bs-import --fetch-only.`);
    const p = parseBsDokument(readFileSync(pfad));
    if (p.gn !== z.gn) return skip(`GN-Drift Kopf «${p.gn}» ≠ Inventar «${z.gn}»`);
    if (p.datum !== z.datum) return skip(`Portal-Metadatum jetzt ${p.datum ?? '–'}, Inventar ${z.datum ?? '–'} — Delta/Vollimport`);
    bericht.geprueft++;
    const neu = baueSnapshot(p, z, alt.id.slice(alt.id.lastIndexOf('/') + 1), datum);
    if (neu.id !== alt.id) return skip(`id-Drift ${alt.id} → ${neu.id}`);
    if (neu.sha !== alt.sha) return skip('Text-sha weicht vom Bestand ab — Dokument seit dem Import geändert');
    const wahl = bsWahlVon(p, datum);
    if (wahl.verdacht) bericht.verdacht.push({ id: alt.id, gn: alt.nummer, key, grund: wahl.verdacht, url: alt.quelleUrl, portal: z.datum, kopf: p.datumKopf ?? null, fund: p.kopfFund ?? null });
    else if (z.datum === null) bericht.portalOhneDatum++;
    else if (!p.datumKopf) bericht.ohneKopf++;
    else if (p.datumKopf === z.datum) bericht.kopfGleich++;
    else {
      bericht.aenderungen.push({
        id: alt.id, gn: alt.nummer, key, alt: z.datum, neu: neu.datum,
        tage: Math.round((Date.parse(`${neu.datum}T00:00:00Z`) - Date.parse(`${z.datum}T00:00:00Z`)) / 86_400_000),
        fund: p.kopfFund ?? null, url: alt.quelleUrl,
      });
    }
    const gleich = neu.datum === alt.datum && (neu.datumPortal ?? null) === (alt.datumPortal ?? null)
      && (neu.datumKopfAbweichend ?? null) === (alt.datumKopfAbweichend ?? null) && !!neu.datumUnbekannt === !!alt.datumUnbekannt;
    if (gleich) return;
    const patch: EntscheidSnapshot = { ...alt, zitierung: neu.zitierung, datum: neu.datum };
    if (neu.datum !== alt.datum) patch.abgerufen = datum;   // Datum geändert ⇒ Stand des Datums = dieser Abruf
    if (neu.datumPortal) patch.datumPortal = neu.datumPortal; else delete patch.datumPortal;
    if (neu.datumKopfAbweichend) patch.datumKopfAbweichend = neu.datumKopfAbweichend; else delete patch.datumKopfAbweichend;
    if (neu.datumUnbekannt) patch.datumUnbekannt = true; else delete patch.datumUnbekannt;
    bestand[i] = patch;
    bericht.geschrieben++;
  });
  const nachId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  bericht.aenderungen.sort(nachId);
  bericht.verdacht.sort(nachId);
  if (schreibe && bericht.geschrieben) schreibeKorpus(bestand, datum);
  return bericht;
}
