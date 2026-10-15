// ─── Weitere Transaktionskosten neben der Beurkundungsgebühr ────────────────
//
// FAHRPLAN-BEURKUNDUNGS-AUSBAU (Direktive David: «sind wirklich alle Kosten
// abgedeckt?»). Deterministische Bundes-Zusatzkosten, die neben der kantonalen
// Notariatsgebühr anfallen — damit der Rechner die GESAMTEN Transaktionskosten
// zeigt (§8: ehrlich, was enthalten ist und was nicht):
//   1. MwSt 8,1 % auf die Notariatsgebühr — Amts- UND freie Notare (MWSTG Art. 25
//      Abs. 1; MWSTV Art. 14 Ziff. 13). Je Kanton nach Tarifklausel bzw. Bundesrecht,
//      Tabelle `MWST_BEHANDLUNG` (src/data/tarif/mwst-notariat.ts).
//   2. Handelsregistergebühr des Bundes (GebV-HReg) — feste Pauschale je Vorgang.
//   3. Emissionsabgabe (StG) — 1 % auf den den Freibetrag 1 Mio. übersteigenden
//      Teil des AG/GmbH-Kapitals (Freibetrag, nicht Freigrenze; Art. 6 Abs. 1 lit. h StG).
//
// Quelle/Verifikation: doppelt verifiziert gegen Fedlex (StG SR 641.10 Stand
// 1.1.2024; GebV-HReg SR 221.411.1 Stand 1.1.2021; MWSTG SR 641.20 Stand 31.3.2025;
// MWSTV SR 641.201 Stand 1.1.2025). Auslagen (Porti, Auszüge,
// Publikation), kantonale Pfandrechtssteuern und Verkehrs-/Gewinnsteuern bleiben
// bewusst draussen (eigene Regimes) — die UI legt das offen.

import { MWST_NORMALSATZ_PROZENT, type KantonCode } from '../data/tarif/typen';
import type { GeschaeftsartId } from '../data/tarif/beurkundung-typen';
import { MWST_BEHANDLUNG, ZH_MWST_INBEGRIFFEN, type MwstBehandlung } from '../data/tarif/mwst-notariat';
import type { Spanne } from './notariatGrundbuch';
import { EMISSIONSABGABE_FREIBETRAG_CHF, emissionsabgabeRoh } from './emissionsabgabe';

const MWST_QUELLE = { erlass: 'MWSTG (SR 641.20), Art. 25 Abs. 1; MWSTV (SR 641.201), Art. 14 Ziff. 13', url: 'https://www.fedlex.admin.ch/eli/cc/2009/615/de', stand: '31.3.2025' };
const UMSATZGRENZE_HINWEIS = 'Keine Steuerpflicht (und damit keine MwSt), wenn die Urkundsperson unter der Umsatzgrenze von CHF 100 000 bleibt (MWSTG Art. 10 Abs. 2 lit. a; Gemeinwesen Art. 12 Abs. 3).';

/** Handelsregistergebühr des Bundes (GebV-HReg, SR 221.411.1, Anhang zu Art. 3
 *  Abs. 1, Stand 1.1.2021) — feste Gesamtgebühr je Tatsache (davon 90 % Kanton /
 *  10 % Bund, Art. 8; der Kunde zahlt den Gesamtbetrag). */
const HREG_GEBUEHR: Partial<Record<GeschaeftsartId, { chf: number; ziffer: string }>> = {
  ag_gruendung: { chf: 420, ziffer: 'Anhang Ziff. 1.3' },
  gmbh_gruendung: { chf: 420, ziffer: 'Anhang Ziff. 1.3' },
  genossenschaft_gruendung: { chf: 280, ziffer: 'Anhang Ziff. 1.4' },
  stiftung: { chf: 210, ziffer: 'Anhang Ziff. 1.6' },
  kapitalerhoehung: { chf: 200, ziffer: 'Anhang Ziff. 1.3 (Statutenänderung)' },
  kapitalherabsetzung: { chf: 200, ziffer: 'Anhang Ziff. 1.3 (Statutenänderung)' },
  statutenaenderung: { chf: 200, ziffer: 'Anhang Ziff. 1.3' },
  fusion: { chf: 420, ziffer: 'Anhang Ziff. 2.1 (übernehmende Rechtseinheit)' },
};

/** Fusion: zusätzlich 80 für die Löschung jeder übertragenden Rechtseinheit
 *  (GebV-HReg Anhang Ziff. 2.1; B2-12). */
const HREG_LOESCHUNG_FUSION_CHF = 80;

const HREG_QUELLE = { erlass: 'GebV-HReg (SR 221.411.1), Anhang zu Art. 3', url: 'https://www.fedlex.admin.ch/eli/cc/2020/180/de', stand: '1.1.2021' };

/** Geschäftsarten, bei denen die Emissionsabgabe (Schaffung/Erhöhung von
 *  Beteiligungsrechten an AG/GmbH) anfällt. */
const EMISSIONSABGABE_ARTEN: ReadonlySet<GeschaeftsartId> = new Set<GeschaeftsartId>(
  ['ag_gruendung', 'gmbh_gruendung', 'kapitalerhoehung'],
);

const EMISSIONSABGABE_QUELLE = { erlass: 'StG (SR 641.10), Art. 8 Abs. 1 i.V.m. Art. 6 Abs. 1 lit. h', url: 'https://www.fedlex.admin.ch/eli/cc/1974/11_11_11/de', stand: '1.1.2024' };

/** Emissionsabgabe für die Zusatzkosten-Anzeige: auf ganze Franken gerundet,
 *  0 bei fehlender/zu kleiner Bemessung. Satz + Freibetrag (Freibetrag, nicht
 *  Freigrenze — nur der übersteigende Teil ist steuerbar) kommen aus der zentralen
 *  §5-Quelle `./emissionsabgabe` (A4-3b); hier nur die Rundungs-/Null-Konvention. */
export function emissionsabgabe(bemessungChf: number): number {
  if (!Number.isFinite(bemessungChf) || bemessungChf <= EMISSIONSABGABE_FREIBETRAG_CHF) return 0;
  return Math.round(emissionsabgabeRoh(bemessungChf));
}

/** MwSt 8,1 % auf die Notariatsgebühr, auf Rappen gerundet (B2-13: 2500 → 202.50).
 *  Rundungsart: kaufmännisch auf 0.01, keine Rundungsnorm im MWSTG gefunden. */
export function mwstAufschlag(gebuehrChf: number): number {
  return Math.round(gebuehrChf * MWST_NORMALSATZ_PROZENT) / 100;
}

/** Kantonale Pfandrechtssteuer/-abgabe bei Errichtung eines Grundpfands
 *  (zusätzlich zu Notariats-/Grundbuchgebühr; nur einzelne Kantone, z. B.
 *  FR/GE/VS/JU). Satz in % der Pfandsumme. Quelle: amtlich verifiziert
 *  (FAHRPLAN-LUECKEN-SCHLIESSEN L3). Leer = Kanton erhebt keine. */
const PFANDSTEUER: Partial<Record<KantonCode, { satzProzent: number; artikel: string; url: string; stand: string; freigrenzeChf?: number; basisAbrundenChf?: number; mindestChf?: number }>> = {
  FR: { satzProzent: 0.75, artikel: "Art. 23 al. 1 i.V.m. Art. 5 al. 1 lit. a Loi sur les droits de mutation et les droits sur les gages immobiliers (LDMG, RSF 635.1.1)", url: "https://bdlf.fr.ch/app/fr/texts_of_law/635.1.1", stand: "2024-03-01" },
  GE: { satzProzent: 0.65, artikel: "LDE (RSG D 3 30) Art. 84 et Art. 85", url: "https://silgeneve.ch/legis/data/rsg_d3_30.htm", stand: "2026-03-21" },
  // JU: 3,5 o/oo, gesetzlicher Mindestbetrag CHF 30 (Art. 13 al. 1: "et de 30 francs au moins").
  JU: { satzProzent: 0.35, mindestChf: 30, artikel: "Loi reglant les droits de mutation et les droits percus pour la constitution de gages (RSJU 215.326.2), Art. 1, Art. 11 et Art. 13 al. 1 (mind. 30 fr.)", url: "https://rsju.jura.ch/fr/viewdocument.html?idn=20037&id=33943&download=1", stand: "1978-11-09" },
  // VD: Freigrenze (kein Freibetrag) — Pfandsummen bis und mit CHF 5'000 sind nach
  // LTim Art. 3 al. 3 steuerbefreit; darüber ganze Pfandsumme × 2 o/oo.
  // VD: 2 o/oo; Bemessungsbasis auf die vollen tausend Franken abgerundet (Art. 3 al. 2: "arrondie aux mille francs inferieurs").
  VD: { satzProzent: 0.2, freigrenzeChf: 5000, basisAbrundenChf: 1000, artikel: "Loi sur le droit de timbre (LTim, BLV 652.11) du 10.12.2013, Art. 1 (objet: contrats de gages immobiliers art. 793ss CC), Art. 3 al. 2 (taux 2 o/oo, base arrondie aux mille francs inferieurs) et al. 3 (exoneration <= 5'000 fr.), Art. 4 (perception par le Registre foncier)", url: "https://www.lexfind.ch/tolv/119178/fr", stand: "01.01.2014" },
  VS: { satzProzent: 0.2, artikel: "Art. 1, 8, 11 Abs. 1 lit. c und Art. 16 lit. b Loi sur les droits de mutations (LDM), RS 643.1", url: "https://lex.vs.ch/app/fr/texts_of_law/643.1", stand: "1.1.2013" },
};

export interface Zusatzposten {
  label: string;
  /** Betrag oder Spanne (CHF). */
  von: number;
  bis: number;
  erlass: string;
  url: string;
  stand: string;
  hinweis?: string;
}

// Spanne aus notariatGrundbuch trägt Felder vonChf/bisChf — hier lokal normalisiert.
type SpanneN = { von: number; bis: number };
const norm = (s: Spanne): SpanneN => ({ von: s.vonChf, bis: s.bisChf });

/** Berechnet die weiteren Transaktionskosten neben der Beurkundungsgebühr.
 *  `gebuehr` = bezifferbare Beurkundungsgebühr-Spanne (null wenn nicht beziffert
 *  → dann auch keine MwSt-Bezifferung). `wertChf` = Geschäftswert (Kapital). */
export function weitereKosten(
  art: GeschaeftsartId,
  kanton: KantonCode,
  wertChf: number | undefined,
  gebuehr: Spanne | null,
): { posten: Zusatzposten[]; mwst: MwstBehandlung; mwstHinweis?: string } {
  const posten: Zusatzposten[] = [];
  const mwst = MWST_BEHANDLUNG[kanton];
  let mwstHinweis: string | undefined;

  // 1. MwSt auf die Notariatsgebühr (Amts- und freie Notare; nur wenn die Gebühr beziffert ist).
  if (mwst.art === 'inbegriffen') {
    mwstHinweis = `MwSt in den Tarifansätzen inbegriffen (${mwst.erlassNr} ${mwst.artikel}, Stand ${mwst.stand}): kein Aufschlag.${mwst.vermerk ? ' ' + mwst.vermerk : ''}`;
  } else if (mwst.art === 'offen') {
    mwstHinweis = mwst.vermerk;
  } else if (gebuehr) {
    const g = norm(gebuehr);
    // ZH: Ausnahmen laut Dienstanweisung FD 22.11.2023 § 2 (nur wo die Tarifziffer eindeutig ist).
    const zhAusnahme = kanton === 'ZH' ? ZH_MWST_INBEGRIFFEN[art] : undefined;
    if (zhAusnahme && zhAusnahme.bisGebuehrChf === undefined) {
      mwstHinweis = `MwSt in der Gebühr inbegriffen (Dienstanweisung der Finanzdirektion ZH vom 22.11.2023 zur NotGebV, § 2, Ziff. ${zhAusnahme.ziffer}): kein Aufschlag.`;
    } else {
      const grenze = zhAusnahme?.bisGebuehrChf;
      const f = (x: number) => (grenze !== undefined && x <= grenze ? 0 : mwstAufschlag(x));
      const basis = mwst.grundlage === 'tarif'
        ? `Zusätzlich zur Gebühr nach Kantonstarif (${mwst.erlassNr} ${mwst.artikel}, Stand ${mwst.stand}).`
        : `Der Kantonstarif (${mwst.erlassNr}) enthält keine MwSt-Klausel: Aufschlag nach Bundesrecht (MWSTG Art. 25 Abs. 1; MWSTV Art. 14 Ziff. 13).`;
      const zhNote = grenze !== undefined
        ? ` Dienstanweisung FD ZH 22.11.2023 § 2 (Ziff. ${zhAusnahme!.ziffer}): bis zu einer Gebühr von CHF ${grenze} inbegriffen; darüber wird die MwSt auf die ganze Gebühr gerechnet (Auslegung, nicht ausdrücklich geregelt).`
        : kanton === 'ZH' ? ' Einzelne Leistungen sind laut Dienstanweisung FD ZH 22.11.2023 § 2 inbegriffen (z. B. Beglaubigungen).' : '';
      posten.push({
        label: `MwSt ${MWST_NORMALSATZ_PROZENT} %`,
        von: f(g.von), bis: f(g.bis),
        ...(mwst.grundlage === 'tarif'
          ? { erlass: `${mwst.erlassName} (${mwst.erlassNr}), ${mwst.artikel}; ${MWST_QUELLE.erlass}`, url: mwst.quelleUrl, stand: mwst.stand }
          : { erlass: MWST_QUELLE.erlass, url: MWST_QUELLE.url, stand: MWST_QUELLE.stand }),
        hinweis: `${basis}${zhNote} ${UMSATZGRENZE_HINWEIS}${mwst.vermerk ? ' ' + mwst.vermerk : ''}`,
      });
    }
  }

  // 2. Handelsregistergebühr des Bundes (feste Pauschale).
  const hreg = HREG_GEBUEHR[art];
  if (hreg) {
    posten.push({
      label: 'Handelsregistergebühr (Bund)',
      von: hreg.chf, bis: hreg.chf,
      erlass: `${HREG_QUELLE.erlass}, ${hreg.ziffer}`, url: HREG_QUELLE.url, stand: HREG_QUELLE.stand,
      hinweis: 'Feste Gebühr je Eintragung; weitere Tatsachen/Belege können zusätzliche Positionen auslösen.',
    });
    if (art === 'fusion') {
      posten.push({
        label: 'Handelsregistergebühr: Löschung übertragende Gesellschaft (Bund)',
        von: HREG_LOESCHUNG_FUSION_CHF, bis: HREG_LOESCHUNG_FUSION_CHF,
        erlass: `${HREG_QUELLE.erlass}, Anhang Ziff. 2.1 (Löschung der übertragenden Rechtseinheit)`, url: HREG_QUELLE.url, stand: HREG_QUELLE.stand,
        hinweis: 'CHF 80 je übertragende Gesellschaft; bei mehreren übertragenden Gesellschaften entsprechend mehr.',
      });
    }
  }

  // 2b. Kantonale Pfandrechtssteuer bei Schuldbrief-/Grundpfand-Errichtung.
  const pfand = PFANDSTEUER[kanton];
  if (pfand && art === 'schuldbrief' && wertChf !== undefined) {
    // Freigrenze: bis und mit dem Schwellenwert steuerbefreit (z. B. VD ≤ 5'000).
    const befreit = pfand.freigrenzeChf !== undefined && wertChf <= pfand.freigrenzeChf;
    // Basis-Abrundung (VD LTim Art. 3 al. 2: auf die vollen tausend Franken).
    const basis = pfand.basisAbrundenChf ? Math.floor(wertChf / pfand.basisAbrundenChf) * pfand.basisAbrundenChf : wertChf;
    let betrag = befreit ? 0 : Math.round((basis * pfand.satzProzent) / 100);
    // Gesetzlicher Mindestbetrag (JU RSJU 215.326.2 Art. 13 al. 1: mind. 30 fr.).
    if (!befreit && pfand.mindestChf !== undefined) betrag = Math.max(betrag, pfand.mindestChf);
    posten.push({
      label: `Pfandrechtssteuer (${pfand.satzProzent} %)`,
      von: betrag, bis: betrag,
      erlass: pfand.artikel, url: pfand.url, stand: pfand.stand,
      hinweis: befreit
        ? `Pfandsumme bis CHF ${pfand.freigrenzeChf!.toLocaleString('de-CH')}: steuerbefreit (Freigrenze).`
        : 'Kantonale Abgabe auf die Pfandsumme bei Errichtung des Grundpfands.',
    });
  }

  // 3. Emissionsabgabe (1 % auf den CHF 1 Mio übersteigenden Teil = Freibetrag), nur AG/GmbH-Kapital.
  if (EMISSIONSABGABE_ARTEN.has(art) && wertChf !== undefined) {
    const abgabe = emissionsabgabe(wertChf);
    // §8-Ehrlichkeit (QS-GP 2.7.2026): Der 1-Mio-Freibetrag gilt nach Art. 6 Abs. 1
    // lit. h StG GESAMTHAFT über alle Leistungen der Gesellschafter (Gründung + alle
    // früheren Erhöhungen), nicht je isoliertem Vorgang. Bei einer Kapitalerhöhung ist
    // er darum meist schon aufgebraucht → dann ist der ganze Erhöhungsbetrag zu 1 %
    // steuerbar. Mangels Eingabe der bisherigen Leistungen wird er hier auf den
    // isolierten Erhöhungsbetrag angewendet; das wird offengelegt (Wert kann zu tief sein).
    const kumulNote = art === 'kapitalerhoehung'
      ? ' Bei Kapitalerhöhungen gilt der Freibetrag von CHF 1 Mio. gesamthaft über alle bisherigen Leistungen (Gründung + frühere Erhöhungen) und ist meist bereits aufgebraucht — dann ist der ganze Erhöhungsbetrag zu 1 % steuerbar. Hier wird er auf den isolierten Erhöhungsbetrag angewendet; der ausgewiesene Betrag kann daher zu tief sein.'
      : '';
    posten.push({
      label: 'Emissionsabgabe (StG)',
      von: abgabe, bis: abgabe,
      erlass: EMISSIONSABGABE_QUELLE.erlass, url: EMISSIONSABGABE_QUELLE.url, stand: EMISSIONSABGABE_QUELLE.stand,
      // A4-3a: Art. 6 Abs. 1 lit. h StG ist ein FREIBETRAG (nur der übersteigende Teil
      // ist steuerbar), keine Freigrenze (ganzer Betrag) — Text an die Rechnung angeglichen.
      hinweis: (abgabe === 0
        ? 'Kapital (inkl. Agio) bis CHF 1 Mio: abgabefrei (Freibetrag Art. 6 Abs. 1 lit. h StG).'
        : 'Bemessung Nennwert + Agio; steuerbar ist nur der CHF 1 Mio übersteigende Teil (Freibetrag Art. 6 Abs. 1 lit. h StG). Befreiungen (Sanierung, Umstrukturierung Art. 6 StG) nicht berücksichtigt.') + kumulNote,
    });
  }

  return { posten, mwst, mwstHinweis };
}
