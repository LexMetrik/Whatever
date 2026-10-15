// ─── Notariats- & Grundbuchkosten-Engine (Grundstückkauf) ──────────────────
//
// FAHRPLAN-NOTARIAT-GRUNDBUCH. Dünner, deterministischer Lader über dem
// fachneutralen Tarif-Primitiv (`tarif/staffel`) und der kantonalen Datenschicht
// (`data/tarif/notariat-grundbuch`). Vier getrennte Kostenblöcke beim Erwerb
// einer Liegenschaft (§4 regime-treu, §2 deterministisch, §8 Ehrlichkeit):
//   1. Beurkundungsgebühr (Notariat)      — Promille/Staffel des Kaufpreises
//   2. Grundbuchgebühr (Eigentum)         — Promille des Kaufpreises
//   3. Grundpfand (Schuldbrief, optional) — Promille der Pfandsumme
//   4. Handänderungssteuer (optional)     — kantonale STEUER, klar getrennt
//   5. Pfandsteuer (optional, mit Grundpfand; FR, GE, VS, VD, JU) — kantonale STEUER,
//      eigene Quelle `data/tarif/pfandsteuer.ts` (RL-28 Teil 3), nie in den Gebühren
// Quelle/Verifikation je Wert: bibliothek/kosten/notariat-grundbuch-kantone.md.

import type { Berechnungsergebnis, Rechenschritt } from '../types/legal';
import { chfGanz } from './format';
import type { KantonCode, KantonalerTarif } from '../data/tarif/typen';
import { auswertenTarif, type TarifErgebnis } from './tarif/staffel';
import { NOTARIAT, GRUNDBUCH, HANDAENDERUNGSSTEUER } from '../data/tarif/notariat-grundbuch';
// RL-28: Grundpfand-Posten = Beurkundung + Grundbucheintrag (eigene Quelle, siehe grundpfand.ts).
import { GRUNDPFAND } from '../data/tarif/grundpfand';
// RL-28 Teil 3: Pfandsteuer als eigene Quelle und eigener Posten (STEUER, keine Gebühr).
import { berechnePfandsteuer } from './pfandsteuer';

export interface Spanne { vonChf: number; bisChf: number }

/** Herkunfts-/Anzeige-Metadaten eines Tarifs (ohne die Regel selbst). */
export interface NgQuelle {
  erlassName: string;
  erlassNr: string;
  artikel: string;
  quelleUrl: string;
  stand: string;
  verifiziert: KantonalerTarif['verifiziert'];
  hinweis?: string;
}

export interface NgPosten {
  ergebnis: TarifErgebnis;
  quelle: NgQuelle;
}

export interface NotariatGrundbuchEingabe {
  kanton: KantonCode;
  kaufpreisCHF: number;
  /** Grundpfand (Schuldbrief) mitberechnen. */
  mitGrundpfand?: boolean;
  /** Pfandsumme für das Grundpfand (Default = Kaufpreis, falls mitGrundpfand). */
  pfandsummeCHF?: number;
  /** Handänderungssteuer mitberechnen (separater Steuerblock). */
  mitHandaenderungssteuer?: boolean;
}

export interface NotariatGrundbuchErgebnis {
  kanton: KantonCode;
  kaufpreisCHF: number;
  beurkundung: NgPosten;
  grundbuch: NgPosten;
  grundpfand?: NgPosten;
  /** Kantonale Pfandsteuer (STEUER, keine Gebühr) bei Grundpfand in FR, GE, VS, VD, JU; sonst fehlt der Posten. */
  pfandsteuer?: NgPosten;
  handaenderungssteuer?: NgPosten;
  /** Beurkundung + Grundbuch (+ Grundpfand), wenn alle bezifferbar; sonst null. Ohne Steuern. */
  gesamtGebuehren: Spanne | null;
  /** Gesamtgebühren + Pfandsteuer + Handänderungssteuer (wenn aktiv und bezifferbar). */
  gesamtMitSteuer: Spanne | null;
  hinweise: string[];
}

const quelle = (t: KantonalerTarif): NgQuelle => ({
  erlassName: t.erlassName, erlassNr: t.erlassNr, artikel: t.artikel,
  quelleUrl: t.quelleUrl, stand: t.stand, verifiziert: t.verifiziert, hinweis: t.hinweis,
});

/** Bezifferbare Spanne eines Tarif-Ergebnisses (null = nicht beziffert, z. B.
 *  freies Notariat / Verhandlungstarif → formel_extern). */
export const ergebnisSpanne = (e: TarifErgebnis): Spanne | null => {
  if (e.deterministisch) return { vonChf: e.betragChf, bisChf: e.betragChf };
  if (typeof e.vonChf === 'number' && typeof e.bisChf === 'number') return { vonChf: e.vonChf, bisChf: e.bisChf };
  return null;
};

const addiere = (a: Spanne | null, b: Spanne | null): Spanne | null =>
  (a && b) ? { vonChf: a.vonChf + b.vonChf, bisChf: a.bisChf + b.bisChf } : null;

const pruefe = (chf: number, name: string): void => {
  if (!Number.isFinite(chf) || chf < 0) throw new RangeError(`${name} muss eine Zahl ≥ 0 sein (erhalten: ${chf}).`);
};

/** Berechnet die Erwerbs-Nebenkosten (Beurkundung + Grundbuch [+ Grundpfand]
 *  [+ Handänderungssteuer]) für einen Kanton. Rein und deterministisch. */
export function berechneNotariatGrundbuch(e: NotariatGrundbuchEingabe): NotariatGrundbuchErgebnis {
  pruefe(e.kaufpreisCHF, 'Kaufpreis');

  const notTarif = NOTARIAT[e.kanton];
  const gbTarif = GRUNDBUCH[e.kanton];
  const beurkundung: NgPosten = { ergebnis: auswertenTarif(notTarif.regel, e.kaufpreisCHF), quelle: quelle(notTarif) };
  const grundbuch: NgPosten = { ergebnis: auswertenTarif(gbTarif.regel, e.kaufpreisCHF), quelle: quelle(gbTarif) };

  let grundpfand: NgPosten | undefined;
  let pfandsteuer: NgPosten | undefined;
  if (e.mitGrundpfand) {
    const pfandsumme = e.pfandsummeCHF ?? e.kaufpreisCHF;
    pruefe(pfandsumme, 'Pfandsumme');
    const pTarif = GRUNDPFAND[e.kanton];
    grundpfand = { ergebnis: auswertenTarif(pTarif.regel, pfandsumme), quelle: quelle(pTarif) };
    const ps = berechnePfandsteuer(e.kanton, pfandsumme);
    if (ps) {
      pfandsteuer = {
        ergebnis: { deterministisch: true, betragChf: ps.betragChf, schritte: ps.schritte },
        quelle: { erlassName: ps.erlassName, erlassNr: ps.erlassNr, artikel: ps.artikel, quelleUrl: ps.url, stand: ps.stand, verifiziert: 'recherche', hinweis: ps.hinweis },
      };
    }
  }

  let handaenderungssteuer: NgPosten | undefined;
  if (e.mitHandaenderungssteuer) {
    const hTarif = HANDAENDERUNGSSTEUER[e.kanton];
    handaenderungssteuer = { ergebnis: auswertenTarif(hTarif.regel, e.kaufpreisCHF), quelle: quelle(hTarif) };
  }

  const gesamtGebuehren = [beurkundung, grundbuch, ...(grundpfand ? [grundpfand] : [])]
    .reduce<Spanne | null>((acc, p, i) => i === 0 ? ergebnisSpanne(p.ergebnis) : addiere(acc, ergebnisSpanne(p.ergebnis)), null);
  const steuern = [pfandsteuer, handaenderungssteuer].filter((p): p is NgPosten => !!p);
  const gesamtMitSteuer = steuern.reduce<Spanne | null>((acc, p) => addiere(acc, ergebnisSpanne(p.ergebnis)), gesamtGebuehren);

  const hinweise = [
    'Erwerbs-Nebenkosten beim Grundstückkauf: Beurkundung (Notariat) + Grundbucheintrag; optional Grundpfand (Schuldbrief) und Handänderungssteuer.',
    'Beträge sind die kantonalen Gebühren nach Kaufpreis bzw. Pfandsumme; Auslagen (Porti, Auszüge) und allfällige MwSt. (freies Notariat) sind nicht enthalten.',
  ];
  if (handaenderungssteuer) hinweise.push('Die Handänderungssteuer ist eine kantonale/kommunale STEUER (keine Gebühr); Befreiungen (z. B. unter Ehegatten/Nachkommen) sind einzelfallabhängig und hier nicht berücksichtigt.');

  if (pfandsteuer) hinweise.push('Die Pfandsteuer ist eine kantonale STEUER auf die Pfandsumme (keine Gebühr) und in den Gesamtgebühren nicht enthalten; Befreiungen und Sonderfälle laut Quellenhinweis sind nicht berücksichtigt.');

  return { kanton: e.kanton, kaufpreisCHF: e.kaufpreisCHF, beurkundung, grundbuch, grundpfand, pfandsteuer, handaenderungssteuer, gesamtGebuehren, gesamtMitSteuer, hinweise };
}

/** Interkantonaler Vergleich derselben Konstellation über alle 26 Kantone. */
export function vergleichNotariatGrundbuch(
  kaufpreisCHF: number, mitGrundpfand?: boolean, pfandsummeCHF?: number, mitHandaenderungssteuer?: boolean,
): NotariatGrundbuchErgebnis[] {
  return (Object.keys(NOTARIAT) as KantonCode[]).map((kanton) =>
    berechneNotariatGrundbuch({ kanton, kaufpreisCHF, mitGrundpfand, pfandsummeCHF, mitHandaenderungssteuer }));
}

/** PDF-Rechenbericht (mandatstauglich): bildet das Kostenbild auf das gemeinsame
 *  Berechnungsergebnis ab, das die zentrale PDF-Schicht (lib/pdf) rendert (§3). */
export function notariatGrundbuchBericht(e: NotariatGrundbuchErgebnis): Berechnungsergebnis {
  const schritt = (titel: string, p: NgPosten): Rechenschritt => ({
    beschreibung: `${titel}: ${p.quelle.erlassName} (${p.quelle.erlassNr}), ${p.quelle.artikel}, Stand ${p.quelle.stand}${p.quelle.verifiziert === 'recherche' ? ' — nicht abgenommen' : ''}`,
    zwischenergebnis: ngPostenText(p) + (p.quelle.hinweis ? ` — ${p.quelle.hinweis}` : ''),
    // Kantonaler Erlass mit amtlichem Direktlink (quelleUrl), damit der PDF-Verweis klickbar ist.
    normen: [{ artikel: `${p.quelle.erlassName} (${p.quelle.erlassNr}), ${p.quelle.artikel}`, url: p.quelle.quelleUrl || undefined }],
  });
  const rechenweg: Rechenschritt[] = [schritt('Beurkundung (Notariat)', e.beurkundung), schritt('Grundbuch', e.grundbuch)];
  if (e.grundpfand) rechenweg.push(schritt('Grundpfand (Schuldbrief)', e.grundpfand));
  if (e.pfandsteuer) rechenweg.push(schritt('Pfandsteuer (kantonale Steuer)', e.pfandsteuer));
  if (e.handaenderungssteuer) rechenweg.push(schritt('Handänderungssteuer (kantonale Steuer)', e.handaenderungssteuer));
  // Das rechte Glied trägt bewusst KEIN «CHF »-Präfix (die Spanne führt es nur
  // einmal), bleibt daher bei Math.round(...).toLocaleString — nicht chfGanz (H-9).
  const spanneTxt = (s: Spanne | null) => !s ? 'nicht beziffert' : s.vonChf === s.bisChf ? chfGanz(s.vonChf) : `${chfGanz(s.vonChf)} – ${Math.round(s.bisChf).toLocaleString('de-CH')}`;
  return {
    ergebnis: `Notariat ${ngPostenText(e.beurkundung)} · Grundbuch ${ngPostenText(e.grundbuch)} · Gebühren gesamt ${spanneTxt(e.gesamtGebuehren)}${e.pfandsteuer ? ` · Pfandsteuer ${ngPostenText(e.pfandsteuer)} (Steuer, nicht in den Gebühren)` : ''}${e.handaenderungssteuer || e.pfandsteuer ? ` · inkl. ${e.pfandsteuer && e.handaenderungssteuer ? 'Pfand- und Handänderungssteuer' : e.pfandsteuer ? 'Pfandsteuer' : 'Handänderungssteuer'} ${spanneTxt(e.gesamtMitSteuer)}` : ''}`,
    status: 'ok',
    rechenweg,
    annahmen: [],
    warnungen: e.hinweise,
    // Bundesrechtliche Grundlage (Fedlex) PLUS die einschlägigen kantonalen
    // Erlasse mit amtlichem Direktlink (quelleUrl).
    normverweise: [
      { artikel: 'Art. 657 ZGB', bemerkung: 'öffentliche Beurkundung des Grundstückkaufs' },
      { artikel: 'Art. 216 OR' },
      ...[e.beurkundung, e.grundbuch, e.grundpfand, e.pfandsteuer, e.handaenderungssteuer]
        .filter((p): p is NgPosten => !!p && !!p.quelle.quelleUrl)
        .map((p) => ({ artikel: `${p.quelle.erlassName} (${p.quelle.erlassNr}), ${p.quelle.artikel}`, bemerkung: `Stand ${p.quelle.stand}`, url: p.quelle.quelleUrl })),
    ],
  };
}

/** Anzeige-Hilfe: ein Posten als kurzer Text (Betrag, Spanne oder «nach Vereinbarung»). */
export function ngPostenText(p: NgPosten): string {
  const e = p.ergebnis;
  const chf = chfGanz; // geteilte Formatter-Heimat (lib/format, H-9), byte-gleich
  if (e.deterministisch) return chf(e.betragChf);
  const von = typeof e.vonChf === 'number' ? chf(e.vonChf) : null;
  const bis = typeof e.bisChf === 'number' ? chf(e.bisChf) : null;
  if (von && bis) return von === bis ? von : `${von} – ${bis}`;
  if (bis) return `bis ${bis}`;
  if (von) return `ab ${von}`;
  return 'nach Vereinbarung/Aufwand';
}
