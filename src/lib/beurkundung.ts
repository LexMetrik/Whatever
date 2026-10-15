// ─── Allgemeine Beurkundungskosten-Engine (alle Geschäftsarten) ─────────────
//
// FAHRPLAN-BEURKUNDUNGS-AUSBAU B-4. Dünner, deterministischer Lader (§2/§3)
// über dem fachneutralen Tarif-Primitiv (`tarif/staffel`) und der kantonalen
// Datenschicht (`data/tarif/beurkundung`). Verallgemeinert die Beurkundungs-
// gebühr auf jede öffentlich beurkundbare Geschäftsart: die Geschäftsart wählt
// die Bemessungsbasis (Geschäftswert), der Kanton den Tarif. §8-Ehrlichkeit:
// fehlt der kantonale Tarif noch (Verifikation läuft), wird das ausgewiesen –
// nie ein erfundener Punktwert. Der Grundstückkauf bleibt im Spezialrechner
// `notariatGrundbuch.ts` (4 Kostenblöcke) erhalten; hier ist er eine
// Geschäftsart unter vielen (gleiche verifizierte Beurkundungs-Datenschicht).

import type { Berechnungsergebnis, Rechenschritt } from '../types/legal';
import type { KantonCode, KantonalerTarif } from '../data/tarif/typen';
import { KANTONE } from '../data/tarif/typen';
import { auswertenTarif, type TarifErgebnis } from './tarif/staffel';
import { geschaeftsart, type GeschaeftsartId } from '../data/tarif/beurkundung-typen';
import { GRUNDSTUECKKAUF_BEURKUNDUNG, GENERELLER_WERTTARIF, SONDERTARIFE } from '../data/tarif/beurkundung';
import { type NgQuelle, type NgPosten, ergebnisSpanne, ngPostenText, mwstSatz } from './notariatGrundbuch';

const quelle = (t: KantonalerTarif): NgQuelle => ({
  erlassName: t.erlassName, erlassNr: t.erlassNr, artikel: t.artikel,
  quelleUrl: t.quelleUrl, stand: t.stand, verifiziert: t.verifiziert, hinweis: t.hinweis,
});

/** Herkunft eines aufgelösten Tarifs (für Anzeige/Doku). */
export type Tarifquelle = 'sondertarif' | 'genereller_werttarif' | 'grundstueckkauf';

/** Löst den einschlägigen kantonalen Tarif für eine Geschäftsart auf.
 *  null = noch kein verifizierter Tarif hinterlegt (Verifikation läuft, §8). */
export function tarifFuer(art: GeschaeftsartId, kanton: KantonCode): { tarif: KantonalerTarif; herkunft: Tarifquelle } | null {
  if (art === 'grundstueckkauf') return { tarif: GRUNDSTUECKKAUF_BEURKUNDUNG[kanton], herkunft: 'grundstueckkauf' };
  const sonder = SONDERTARIFE[art]?.[kanton];
  if (sonder) return { tarif: sonder, herkunft: 'sondertarif' };
  if (geschaeftsart(art).bemessung === 'wert') {
    const g = GENERELLER_WERTTARIF[kanton];
    if (g) return { tarif: g, herkunft: 'genereller_werttarif' };
  }
  return null;
}

/** Regel-Typen, die sich am Geschäftswert bemessen (Wertfeld in der UI nötig). */
const WERT_TYPEN = ['promille', 'sockel_prozent', 'staffel_inklusiv', 'staffel_exklusiv', 'staffel_sockel_prozent', 'staffel_voll_prozent', 'staffel_rahmen', 'summe'];

/** true, wenn der für (Geschäftsart, Kanton) aufgelöste Tarif wertbasiert ist
 *  (die UI zeigt dann das Geschäftswert-Feld). Fehlt der Tarif noch, greift der
 *  statische bemessung-Hinweis der Geschäftsart. */
export function istWertbasiert(art: GeschaeftsartId, kanton: KantonCode): boolean {
  const auf = tarifFuer(art, kanton);
  if (!auf) return geschaeftsart(art).bemessung === 'wert';
  return WERT_TYPEN.includes(auf.tarif.regel.typ);
}

export interface BeurkundungEingabe {
  geschaeftsart: GeschaeftsartId;
  kanton: KantonCode;
  /** Geschäftswert in CHF (nur bei wertbasierten Geschäftsarten relevant). */
  geschaeftswertCHF?: number;
}

export interface BeurkundungErgebnis {
  geschaeftsart: GeschaeftsartId;
  kanton: KantonCode;
  geschaeftswertCHF?: number;
  /** Beurkundungsgebühr-Posten (null = Tarif noch nicht verifiziert hinterlegt). */
  posten: NgPosten | null;
  herkunft: Tarifquelle | null;
  /** 'ok' = Tarif aufgelöst; 'offen' = kantonaler Tarif noch in Verifikation. */
  status: 'ok' | 'offen';
  hinweise: string[];
}

const pruefe = (chf: number, name: string): void => {
  if (!Number.isFinite(chf) || chf < 0) throw new RangeError(`${name} muss eine Zahl ≥ 0 sein (erhalten: ${chf}).`);
};

/** Berechnet die Beurkundungsgebühr für eine Geschäftsart in einem Kanton.
 *  Rein und deterministisch; ehrlich «offen», solange der Tarif fehlt (§8). */
export function berechneBeurkundung(e: BeurkundungEingabe): BeurkundungErgebnis {
  // Bemessungsbasis: der Geschäftswert wird IMMER an die Regel durchgereicht;
  // ob er wirkt, entscheidet der kantonale Tarif (promille/staffel nutzen ihn;
  // fix/rahmen/aufwand ignorieren ihn). Dieselbe Geschäftsart kann je Kanton
  // wertbasiert ODER fix sein (z. B. Testament: OW 1‰, ZH Rahmen) — darum keine
  // statische bemessung-Weiche in der Logik (§1/§2).
  const basis = e.geschaeftswertCHF ?? 0;
  if (e.geschaeftswertCHF != null) pruefe(e.geschaeftswertCHF, 'Geschäftswert');

  const aufgeloest = tarifFuer(e.geschaeftsart, e.kanton);
  if (!aufgeloest) {
    return {
      geschaeftsart: e.geschaeftsart, kanton: e.kanton, geschaeftswertCHF: e.geschaeftswertCHF,
      posten: null, herkunft: null, status: 'offen',
      hinweise: ['Für diese Geschäftsart ist der kantonale Beurkundungstarif noch nicht abschliessend verifiziert hinterlegt (Recherche läuft). Es wird bewusst kein Betrag geschätzt.'],
    };
  }

  const ergebnis: TarifErgebnis = auswertenTarif(aufgeloest.tarif.regel, basis);
  const posten: NgPosten = { ergebnis, quelle: quelle(aufgeloest.tarif) };

  const hinweise: string[] = [];
  hinweise.push(`Beurkundungsgebühr des Notariats nach kantonalem Tarif; HReg-/Grundbuchgebühren und Auslagen sind nicht enthalten. ${mwstSatz(e.kanton)}`);
  if (aufgeloest.herkunft === 'genereller_werttarif') hinweise.push('Es gilt der allgemeine wertbasierte Beurkundungstarif des Kantons (kein art-spezifischer Sondersatz im Tarif).');
  if (!ergebnis.deterministisch) hinweise.push('Aufwand-/Rahmentarif – die konkrete Festsetzung erfolgt im Einzelfall; ausgewiesen ist die Spanne bzw. der Hinweis.');
  if (aufgeloest.tarif.hinweis) hinweise.push(aufgeloest.tarif.hinweis);

  return {
    geschaeftsart: e.geschaeftsart, kanton: e.kanton, geschaeftswertCHF: e.geschaeftswertCHF,
    posten, herkunft: aufgeloest.herkunft, status: 'ok', hinweise,
  };
}

/** Interkantonaler Vergleich derselben Geschäftsart/desselben Werts (26 Kt). */
export function vergleichBeurkundung(geschaeftsart: GeschaeftsartId, geschaeftswertCHF?: number): BeurkundungErgebnis[] {
  return KANTONE.map((kanton) => berechneBeurkundung({ geschaeftsart, kanton, geschaeftswertCHF }));
}

/** Bezifferbare Untergrenze (für Sortierung; offen/nicht beziffert → ans Ende). */
export const beurkundungSortwert = (r: BeurkundungErgebnis): number =>
  r.posten ? (ergebnisSpanne(r.posten.ergebnis)?.vonChf ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;

/** PDF-Rechenbericht (mandatstauglich): auf das gemeinsame Berechnungsergebnis
 *  abgebildet, das die zentrale PDF-Schicht rendert (§3/§5). */
export function beurkundungBericht(e: BeurkundungErgebnis): Berechnungsergebnis {
  const art = geschaeftsart(e.geschaeftsart);
  if (!e.posten) {
    return {
      ergebnis: `${art.label}: kantonaler Beurkundungstarif noch nicht verifiziert hinterlegt (kein Schätzwert).`,
      status: 'ok', rechenweg: [], annahmen: [], warnungen: e.hinweise,
      normverweise: art.normBund.map((n) => ({ artikel: n.artikel, bemerkung: n.bemerkung })),
    };
  }
  const p = e.posten;
  const rechenweg: Rechenschritt[] = [{
    beschreibung: `Beurkundung ${art.label}: ${p.quelle.erlassName} (${p.quelle.erlassNr}), ${p.quelle.artikel}, Stand ${p.quelle.stand}${p.quelle.verifiziert === 'recherche' ? ' — nicht abgenommen' : ''}`,
    zwischenergebnis: ngPostenText(p) + (p.quelle.hinweis ? ` — ${p.quelle.hinweis}` : ''),
    normen: [{ artikel: `${p.quelle.erlassName} (${p.quelle.erlassNr}), ${p.quelle.artikel}`, url: p.quelle.quelleUrl || undefined }],
  }];
  return {
    ergebnis: `Beurkundung ${art.label}: ${ngPostenText(p)}`,
    status: 'ok', rechenweg, annahmen: [], warnungen: e.hinweise,
    normverweise: [
      ...art.normBund.map((n) => ({ artikel: n.artikel, bemerkung: n.bemerkung })),
      ...(p.quelle.quelleUrl ? [{ artikel: `${p.quelle.erlassName} (${p.quelle.erlassNr}), ${p.quelle.artikel}`, bemerkung: `Stand ${p.quelle.stand}`, url: p.quelle.quelleUrl }] : []),
    ],
  };
}
