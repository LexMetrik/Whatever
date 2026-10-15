// Dossier: bibliothek/kosten/notariatstarife-gruendung-kantone.md
// ─── Notariatsgebühren der Gründungs-Beurkundung je Kanton (P11) ─────────────
//
// RL-36 (RV-27, B2-10, S3c-c): DÜNNER ADAPTER auf die allgemeine Beurkundungs-
// Engine. Die Gründungstarife (Geschäftsart 'ag_gruendung') stehen genau einmal
// in `SONDERTARIFE.ag_gruendung` (src/data/tarif/beurkundung.ts, §5); diese
// Datei hält KEINE eigene Tarifkopie mehr, sondern bildet das Engine-Ergebnis
// auf die Anzeigeform der Gründungs-Maske ab. Status der Daten: 'recherche'
// (fachliche Abnahme ausstehend) — die UI legt das offen (§8).
//
// Tarifwerte sind Beurkundungsgebühren OHNE Auslagen; ob und wie MWST (8,1 %)
// hinzukommt, hängt vom Kanton ab (freies Notariat: ja; ZG: im Tarif
// inbegriffen; Amtsnotariate: i. d. R. keine) und wird NICHT hier, sondern in
// der MWST-Logik der Kosten-Engines behandelt (RL-33). Bemessungsgrundlage =
// Kapital in CHF (Agio zählt nur in BE ausdrücklich zur Basis — dort als
// Hinweis; übrige Kantone konservativ ohne Agio, Verifikation offen).
// Fremdwährungs-Kapital: Bemessung am CHF-Gegenwert ist nicht verifiziert →
// die aufrufende Maske zeigt ehrlich «offen» (kein Aufruf).
//
// §4/§5: reine Datenschicht-Abbildung + deterministische Rechnung, KEINE UI;
// die Gründungs-Masken (AG, später GmbH) konsumieren das Ergebnis.

import { KANTONE } from './kantone';
import type { KantonCode } from '../data/tarif/typen';
import { berechneBeurkundung, tarifFuer } from './beurkundung';

type NotariatsGebuehr =
  | { typ: 'betrag'; chf: number }
  | { typ: 'rahmen'; vonChf: number; bisChf: number; mittelChf?: number }
  /** Amtlich nicht bezifferbar (Aufwandtarif, kein amtlicher Tarif) — nie ein Schein-Wert. */
  | { typ: 'nicht_beziffert' };

export type NotariatsTarifAuskunft = {
  kanton: string;
  ergebnis: NotariatsGebuehr;
  /** Massgeblicher Erlass (amtliche konsolidierte Fassung). */
  erlassLabel: string;
  erlassUrl: string;
  stand: string;
  /** Offenzulegende Besonderheiten (§8). */
  hinweise: string[];
};

const istKanton = (k: string): k is KantonCode => (KANTONE as readonly string[]).includes(k);

/** Gebühr der Gründungs-Beurkundung für das CHF-Kapital.
 *  null = kein gültiger Kantonscode. Wirft RangeError bei negativem, nicht
 *  endlichem oder NaN-Kapital (S3c-c: kein stilles Clampen auf den Mindestbetrag). */
export function notariatsGebuehrGruendung(kanton: string, kapitalChf: number): NotariatsTarifAuskunft | null {
  if (!Number.isFinite(kapitalChf) || kapitalChf < 0) {
    throw new RangeError(`Kapital muss eine endliche Zahl ≥ 0 sein (erhalten: ${kapitalChf}).`);
  }
  if (!istKanton(kanton)) return null;

  const r = berechneBeurkundung({ geschaeftsart: 'ag_gruendung', kanton, geschaeftswertCHF: kapitalChf });
  const aufgeloest = tarifFuer('ag_gruendung', kanton);
  // Für alle 26 Kantone ist ein Sondertarif hinterlegt (UR/AG: formel_extern);
  // fehlt er künftig, bleibt die Auskunft ehrlich «nicht beziffert».
  if (!r.posten || !aufgeloest) {
    return {
      kanton, ergebnis: { typ: 'nicht_beziffert' }, erlassLabel: 'kantonaler Notariatstarif', erlassUrl: '',
      stand: 'offen', hinweise: r.hinweise,
    };
  }

  const t = aufgeloest.tarif;
  const e = r.posten.ergebnis;
  let ergebnis: NotariatsGebuehr;
  if (e.deterministisch) {
    ergebnis = { typ: 'betrag', chf: e.betragChf };
  } else if (e.vonChf != null && e.bisChf != null) {
    ergebnis = { typ: 'rahmen', vonChf: e.vonChf, bisChf: e.bisChf };
    // BE Anhang 4 weist «Mittel» aus: in jeder Zeile das arithmetische Mittel von
    // Minimum und Maximum (gegen das amtliche PDF gelesen, 15.10.2026).
    if (kanton === 'BE') ergebnis.mittelChf = (e.vonChf + e.bisChf) / 2;
  } else {
    ergebnis = { typ: 'nicht_beziffert' };
  }

  const hinweise: string[] = [];
  if (t.hinweis) hinweise.push(t.hinweis);
  if (!e.deterministisch && e.hinweis) hinweise.push(e.hinweis);

  return {
    kanton,
    ergebnis,
    erlassLabel: `${t.erlassName} (${t.erlassNr}), ${t.artikel}`,
    erlassUrl: t.quelleUrl,
    stand: t.stand,
    hinweise,
  };
}
