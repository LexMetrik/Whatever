// ─── Kantonale Pfandrechtssteuer: eine reine Rechenfunktion ─────────────────
//
// RL-28 Teil 3. Rechnet die STEUER auf die Pfandsumme aus der Datenquelle
// `data/tarif/pfandsteuer.ts`. Eine Funktion für beide Verbraucher (Beurkundungsrechner
// `weitereKosten` und Rechner Notariat/Grundbuch), damit der Satz nie an zwei Stellen
// gepflegt wird (§5). Rein und deterministisch (§2).
//
// Reihenfolge (jede Stufe nur, wenn die Quelle sie kennt):
//   1. Befreiung/Freigrenze am ROHWERT der Pfandsumme (VS ≤ 1’000, VD ≤ 5’000);
//   2. Bemessungsbasis runden (VD auf 1’000 ab, VS auf 100 auf);
//   3. Fixband (VS 1’001–20’000 = 20);
//   4. Satz × (1 + Zuschlag) (GE 0,65 % × 2,1), Mindestbetrag (JU 30).
// Rundung des Betrags: ganze Franken (`Math.round`, wie bisher; der Test FR 3’000 → 23
// aus 22,5 bindet diese Konvention). Folge: VS 20’001 → Basis 20’100 → 40,20 → 40.

import { PFANDSTEUER } from '../data/tarif/pfandsteuer';
import type { KantonCode } from '../data/tarif/typen';
import { chfGanz } from './format';

export interface PfandsteuerErgebnis {
  /** Steuerbetrag in ganzen Franken. */
  betragChf: number;
  /** Wirksamer Satz in Prozent der Pfandsumme nach Zuschlag (GE 1.365); beim VS-Fixband der Normalsatz. */
  satzProzentEffektiv: number;
  label: string;
  /** Erlass mit Nummer und Artikel in einem String (Anzeige-Beleg). */
  erlass: string;
  artikel: string;
  erlassName: string;
  erlassNr: string;
  url: string;
  stand: string;
  hinweis: string;
  /** Nachvollziehbarer Rechenweg («STEUER: Satz × Pfandsumme …»). */
  schritte: string[];
}

/** Rundet auf 6 Nachkommastellen: 0,65 × 2,1 = 1,3650000000000002 → 1,365 (Anzeige und Label). */
const bereinige = (x: number): number => Math.round(x * 1e6) / 1e6;

/** Pfandsteuer eines Kantons für eine Pfandsumme; `undefined`, wenn der Kanton keine erhebt. */
export function berechnePfandsteuer(kanton: KantonCode, pfandsummeChf: number): PfandsteuerErgebnis | undefined {
  const s = PFANDSTEUER[kanton];
  if (!s) return undefined;
  if (!Number.isFinite(pfandsummeChf) || pfandsummeChf < 0) {
    throw new RangeError(`Pfandsumme muss eine Zahl ≥ 0 sein (erhalten: ${pfandsummeChf}).`);
  }

  const satzEff = bereinige(s.satzProzent * (1 + (s.zuschlagProzent ?? 0) / 100));
  const label = `Pfandrechtssteuer (${satzEff} %)`;
  const schritte: string[] = [];
  const kopf = { satzProzentEffektiv: satzEff, label, erlass: `${s.erlassName} (${s.erlassNr}), ${s.artikel}`, artikel: s.artikel, erlassName: s.erlassName, erlassNr: s.erlassNr, url: s.url, stand: s.stand };
  const ergebnis = (betragChf: number, hinweis: string): PfandsteuerErgebnis =>
    ({ ...kopf, betragChf, hinweis: s.hinweis ? `${hinweis} ${s.hinweis}` : hinweis, schritte });

  // 1. Befreiung / Freigrenze am Rohwert.
  const grenze = [s.freigrenzeChf, s.befreitBisChf].filter((x): x is number => x !== undefined);
  if (grenze.length > 0 && pfandsummeChf <= Math.max(...grenze)) {
    const g = Math.max(...grenze);
    schritte.push(`STEUER: Pfandsumme ${chfGanz(pfandsummeChf)} liegt bis und mit ${chfGanz(g)} — steuerbefreit`);
    return ergebnis(0, `Pfandsumme bis CHF ${g.toLocaleString('de-CH')}: steuerbefreit${s.freigrenzeChf !== undefined ? ' (Freigrenze)' : ''}.`);
  }

  // 2. Bemessungsbasis runden.
  let basis = pfandsummeChf;
  if (s.basisAbrundenChf) basis = Math.floor(basis / s.basisAbrundenChf) * s.basisAbrundenChf;
  if (s.basisAufrundenChf) basis = Math.ceil(basis / s.basisAufrundenChf) * s.basisAufrundenChf;
  if (basis !== pfandsummeChf) {
    schritte.push(`STEUER: Bemessungsbasis ${chfGanz(pfandsummeChf)} auf ${chfGanz(basis)} ${s.basisAbrundenChf ? 'abgerundet' : 'aufgerundet'}`);
  }

  // 3. Fixband.
  if (s.fixBand && basis >= s.fixBand.vonChf && basis <= s.fixBand.bisChf) {
    schritte.push(`STEUER: Bemessungsbasis ${chfGanz(basis)} im Band ${chfGanz(s.fixBand.vonChf)}–${chfGanz(s.fixBand.bisChf)}: Festbetrag ${chfGanz(s.fixBand.chf)}`);
    return ergebnis(s.fixBand.chf, `Festbetrag ${chfGanz(s.fixBand.chf)} für Beträge von ${chfGanz(s.fixBand.vonChf)} bis ${chfGanz(s.fixBand.bisChf)}; kantonale STEUER auf die Pfandsumme bei Errichtung des Grundpfands.`);
  }

  // 4. Satz × (1 + Zuschlag), Mindestbetrag.
  let betrag = Math.round((basis * satzEff) / 100);
  schritte.push(`STEUER: ${satzEff} % × ${chfGanz(basis)} = ${chfGanz(betrag)}${s.zuschlagProzent ? ` (Satz ${s.satzProzent} % plus Zuschlag ${s.zuschlagProzent} %)` : ''}`);
  if (s.mindestChf !== undefined && betrag < s.mindestChf) {
    betrag = s.mindestChf;
    schritte.push(`STEUER: gesetzlicher Mindestbetrag ${chfGanz(s.mindestChf)}`);
  }
  return ergebnis(betrag, 'Kantonale STEUER auf die Pfandsumme bei Errichtung des Grundpfands.');
}
