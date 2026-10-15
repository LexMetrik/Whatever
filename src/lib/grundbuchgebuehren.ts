// ─── Grundbuchgebühren-Engine (alle Eintragungsarten) ──────────────────────
//
// FAHRPLAN-BEURKUNDUNGS-AUSBAU (Direktive David: «alle Arten von Grundbuch-
// gebühren»; Engines getrennt). Dünner, deterministischer Lader (§2/§3) über
// dem Tarif-Primitiv (`tarif/staffel`) und der Datenschicht (`data/tarif/
// grundbuch`). Die Eintragungsart wählt die Bemessungsbasis (Wert oder fix),
// der Kanton den Tarif. §8: fehlt der Tarif noch (Recherche), wird das offen
// ausgewiesen – nie ein erfundener Punktwert. Getrennt vom Beurkundungstarif
// (`lib/beurkundung.ts`): Grundbuch- und Notariatsgebühr sind eigene Regimes.

import type { Berechnungsergebnis, Rechenschritt } from '../types/legal';
import type { KantonCode, KantonalerTarif } from '../data/tarif/typen';
import { KANTONE } from '../data/tarif/typen';
import { auswertenTarif, type TarifErgebnis } from './tarif/staffel';
import { gbEintragsart, type GbEintragsartId } from '../data/tarif/grundbuch-typen';
import { GRUNDBUCH_EIGENTUM_KAUF, GRUNDBUCH_EINTRAG } from '../data/tarif/grundbuch';
import { type NgQuelle, type NgPosten, ergebnisSpanne, ngPostenText } from './notariatGrundbuch';

const quelle = (t: KantonalerTarif): NgQuelle => ({
  erlassName: t.erlassName, erlassNr: t.erlassNr, artikel: t.artikel,
  quelleUrl: t.quelleUrl, stand: t.stand, verifiziert: t.verifiziert, hinweis: t.hinweis,
});

export type GbTarifquelle = 'eintragsart' | 'eigentum_kauf';

/** Löst den kantonalen Tarif für eine Eintragungsart auf. null = noch kein
 *  verifizierter Tarif hinterlegt (Verifikation läuft, §8). */
export function tarifFuerGb(art: GbEintragsartId, kanton: KantonCode): { tarif: KantonalerTarif; herkunft: GbTarifquelle } | null {
  if (art === 'eigentum_kauf') return { tarif: GRUNDBUCH_EIGENTUM_KAUF[kanton], herkunft: 'eigentum_kauf' };
  const sonder = GRUNDBUCH_EINTRAG[art]?.[kanton];
  if (sonder) return { tarif: sonder, herkunft: 'eintragsart' };
  return null;
}

/** Regel-Typen, die sich am Wert bemessen (Wertfeld in der UI nötig). */
const WERT_TYPEN = ['promille', 'sockel_prozent', 'staffel_inklusiv', 'staffel_exklusiv', 'staffel_sockel_prozent', 'staffel_voll_prozent', 'staffel_rahmen', 'summe'];

/** true, wenn der für (Eintragungsart, Kanton) aufgelöste Tarif wertbasiert ist. */
export function istWertbasiertGb(art: GbEintragsartId, kanton: KantonCode): boolean {
  const auf = tarifFuerGb(art, kanton);
  if (!auf) return gbEintragsart(art).bemessung === 'wert';
  return WERT_TYPEN.includes(auf.tarif.regel.typ);
}

export interface GbEingabe {
  eintragsart: GbEintragsartId;
  kanton: KantonCode;
  /** Bemessungswert in CHF (nur bei wertbasierten Eintragungsarten relevant). */
  wertCHF?: number;
}

export interface GbErgebnis {
  eintragsart: GbEintragsartId;
  kanton: KantonCode;
  wertCHF?: number;
  posten: NgPosten | null;
  herkunft: GbTarifquelle | null;
  status: 'ok' | 'offen';
  hinweise: string[];
}

const pruefe = (chf: number, name: string): void => {
  if (!Number.isFinite(chf) || chf < 0) throw new RangeError(`${name} muss eine Zahl ≥ 0 sein (erhalten: ${chf}).`);
};

/** Berechnet die Grundbuchgebühr für eine Eintragungsart in einem Kanton. */
export function berechneGrundbuchgebuehr(e: GbEingabe): GbErgebnis {
  // Wert wird IMMER durchgereicht; der kantonale Tarif entscheidet, ob er wirkt
  // (dieselbe Eintragungsart kann je Kanton wertbasiert oder fix sein).
  const basis = e.wertCHF ?? 0;
  if (e.wertCHF != null) pruefe(e.wertCHF, 'Bemessungswert');

  const aufgeloest = tarifFuerGb(e.eintragsart, e.kanton);
  if (!aufgeloest) {
    return {
      eintragsart: e.eintragsart, kanton: e.kanton, wertCHF: e.wertCHF,
      posten: null, herkunft: null, status: 'offen',
      hinweise: ['Für diese Eintragungsart ist der kantonale Grundbuchgebühren-Tarif noch nicht abschliessend verifiziert hinterlegt (Recherche läuft). Es wird bewusst kein Betrag geschätzt.'],
    };
  }

  const ergebnis: TarifErgebnis = auswertenTarif(aufgeloest.tarif.regel, basis);
  const posten: NgPosten = { ergebnis, quelle: quelle(aufgeloest.tarif) };

  const hinweise: string[] = ['Grundbuchgebühr (Eintragung) nach kantonalem Tarif; Notariats-/Beurkundungsgebühr, Handänderungssteuer, Auslagen und MwSt. sind nicht enthalten.'];
  if (!ergebnis.deterministisch) hinweise.push('Aufwand-/Rahmentarif – konkrete Festsetzung im Einzelfall.');
  if (aufgeloest.tarif.hinweis) hinweise.push(aufgeloest.tarif.hinweis);

  return { eintragsart: e.eintragsart, kanton: e.kanton, wertCHF: e.wertCHF, posten, herkunft: aufgeloest.herkunft, status: 'ok', hinweise };
}

/** Interkantonaler Vergleich derselben Eintragungsart/desselben Werts (26 Kt). */
export function vergleichGrundbuchgebuehr(eintragsart: GbEintragsartId, wertCHF?: number): GbErgebnis[] {
  return KANTONE.map((kanton) => berechneGrundbuchgebuehr({ eintragsart, kanton, wertCHF }));
}

export const gbSortwert = (r: GbErgebnis): number =>
  r.posten ? (ergebnisSpanne(r.posten.ergebnis)?.vonChf ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;

/** PDF-Rechenbericht (§3/§5). */
export function grundbuchgebuehrBericht(e: GbErgebnis): Berechnungsergebnis {
  const art = gbEintragsart(e.eintragsart);
  if (!e.posten) {
    return {
      ergebnis: `${art.label}: kantonaler Grundbuchgebühren-Tarif noch nicht verifiziert hinterlegt (kein Schätzwert).`,
      status: 'ok', rechenweg: [], annahmen: [], warnungen: e.hinweise,
      normverweise: art.normBund.map((n) => ({ artikel: n.artikel, bemerkung: n.bemerkung })),
    };
  }
  const p = e.posten;
  const rechenweg: Rechenschritt[] = [{
    beschreibung: `Grundbuch ${art.label}: ${p.quelle.erlassName} (${p.quelle.erlassNr}), ${p.quelle.artikel}, Stand ${p.quelle.stand}${p.quelle.verifiziert === 'recherche' ? ' — nicht abgenommen' : ''}`,
    zwischenergebnis: ngPostenText(p) + (p.quelle.hinweis ? ` — ${p.quelle.hinweis}` : ''),
    normen: [{ artikel: `${p.quelle.erlassName} (${p.quelle.erlassNr}), ${p.quelle.artikel}`, url: p.quelle.quelleUrl || undefined }],
  }];
  return {
    ergebnis: `Grundbuch ${art.label}: ${ngPostenText(p)}`,
    status: 'ok', rechenweg, annahmen: [], warnungen: e.hinweise,
    normverweise: [
      ...art.normBund.map((n) => ({ artikel: n.artikel, bemerkung: n.bemerkung })),
      ...(p.quelle.quelleUrl ? [{ artikel: `${p.quelle.erlassName} (${p.quelle.erlassNr}), ${p.quelle.artikel}`, bemerkung: `Stand ${p.quelle.stand}`, url: p.quelle.quelleUrl }] : []),
    ],
  };
}
