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
//      Teil des AG/GmbH-/Genossenschaftskapitals inkl. Agio (Freibetrag, nicht
//      Freigrenze; Art. 6 Abs. 1 lit. h bzw. lit. b StG; Bemessung Art. 8 Abs. 1 lit. a StG).
//
// Quelle/Verifikation: doppelt verifiziert gegen Fedlex (StG SR 641.10 Stand
// 1.1.2024; GebV-HReg SR 221.411.1 Stand 1.1.2021; MWSTG SR 641.20 Stand 31.3.2025;
// MWSTV SR 641.201 Stand 1.1.2025). Auslagen (Porti, Auszüge,
// Publikation) und Verkehrs-/Gewinnsteuern bleiben bewusst draussen (eigene Regimes);
// die kantonale Pfandrechtssteuer kommt aus der eigenen Quelle `pfandsteuer` — die UI legt das offen.

import { MWST_NORMALSATZ_PROZENT, type KantonCode } from '../data/tarif/typen';
import type { GeschaeftsartId } from '../data/tarif/beurkundung-typen';
import { MWST_BEHANDLUNG, ZH_MWST_INBEGRIFFEN, type MwstBehandlung } from '../data/tarif/mwst-notariat';
import type { Spanne } from './notariatGrundbuch';
import { EMISSIONSABGABE_FREIBETRAG_CHF, emissionsabgabeRoh } from './emissionsabgabe';
import { berechnePfandsteuer } from './pfandsteuer';

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
  ['ag_gruendung', 'gmbh_gruendung', 'kapitalerhoehung', 'genossenschaft_gruendung'],
);

/** Fällt bei dieser Geschäftsart die Emissionsabgabe an? Einzige Quelle für das
 *  Formular (§3/§5): bestimmt, ob das Feld «Ausgabebetrag inkl. Agio» erscheint —
 *  unabhängig davon, ob der Kantonstarif wertbasiert, fix oder offen ist. */
export function brauchtEmissionsabgabe(art: GeschaeftsartId): boolean {
  return EMISSIONSABGABE_ARTEN.has(art);
}

const EMISSIONSABGABE_URL = 'https://www.fedlex.admin.ch/eli/cc/1974/11_11_11/de';
const EMISSIONSABGABE_STAND = '1.1.2024';
/** Freibetrag-Litera je Rechtsform: AG/GmbH lit. h, Genossenschaft lit. b (beide Art. 6 Abs. 1 StG). */
const emissionsabgabeErlass = (art: GeschaeftsartId) =>
  `StG (SR 641.10), Art. 8 Abs. 1 lit. a i.V.m. Art. 6 Abs. 1 lit. ${art === 'genossenschaft_gruendung' ? 'b' : 'h'}`;

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
 *  → dann auch keine MwSt-Bezifferung, HReg und Emissionsabgabe bleiben).
 *  `wertChf` = Geschäftswert (Kapital) für Tarif-Posten.
 *  `ausgabebetragChf` = Nennwert + Agio (Art. 8 Abs. 1 lit. a StG: Bemessung ist der
 *  der Gesellschaft zufliessende Betrag, mindestens der Nennwert); fehlt er, gilt `wertChf`. */
export function weitereKosten(
  art: GeschaeftsartId,
  kanton: KantonCode,
  wertChf: number | undefined,
  gebuehr: Spanne | null,
  ausgabebetragChf?: number,
): { posten: Zusatzposten[]; mwst: MwstBehandlung; mwstHinweis?: string; emissionsHinweis?: string } {
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

  // 2b. Kantonale Pfandrechtssteuer bei Schuldbrief-/Grundpfand-Errichtung (eigene Quelle:
  //     data/tarif/pfandsteuer.ts, Rechenfunktion lib/pfandsteuer.ts; RL-28 Teil 3).
  if (art === 'schuldbrief' && wertChf !== undefined) {
    const pfand = berechnePfandsteuer(kanton, wertChf);
    if (pfand) {
      posten.push({
        label: pfand.label,
        von: pfand.betragChf, bis: pfand.betragChf,
        erlass: pfand.erlass, url: pfand.url, stand: pfand.stand,
        hinweis: pfand.hinweis,
      });
    }
  }

  // 3. Emissionsabgabe (1 % auf den CHF 1 Mio übersteigenden Teil = Freibetrag), nur AG/GmbH-Kapital.
  // Art. 8 Abs. 1 lit. a StG: zufliessender Betrag, mindestens aber der Nennwert → liegen beide vor, gilt der höhere.
  const bemessungChf = ausgabebetragChf !== undefined && wertChf !== undefined
    ? Math.max(ausgabebetragChf, wertChf)
    : (ausgabebetragChf ?? wertChf);
  if (EMISSIONSABGABE_ARTEN.has(art) && bemessungChf !== undefined) {
    const genossenschaft = art === 'genossenschaft_gruendung';
    const abgabe = emissionsabgabe(bemessungChf);
    // §8-Ehrlichkeit (QS-GP 2.7.2026): Der 1-Mio-Freibetrag gilt nach Art. 6 Abs. 1
    // lit. h StG GESAMTHAFT über alle Leistungen der Gesellschafter (Gründung + alle
    // früheren Erhöhungen), nicht je isoliertem Vorgang. Bei einer Kapitalerhöhung ist
    // er darum meist schon aufgebraucht → dann ist der ganze Erhöhungsbetrag zu 1 %
    // steuerbar. Mangels Eingabe der bisherigen Leistungen wird er hier auf den
    // isolierten Erhöhungsbetrag angewendet; das wird offengelegt (Wert kann zu tief sein).
    const kumulNote = art === 'kapitalerhoehung'
      ? ' Bei Kapitalerhöhungen gilt der Freibetrag von CHF 1 Mio. gesamthaft über alle bisherigen Leistungen (Gründung + frühere Erhöhungen) und ist meist bereits aufgebraucht — dann ist der ganze Erhöhungsbetrag zu 1 % steuerbar. Hier wird er auf den isolierten Erhöhungsbetrag angewendet; der ausgewiesene Betrag kann daher zu tief sein.'
      : '';
    const lit = genossenschaft ? 'b' : 'h';
    const bemessungNote = ' Bemessung: Ausgabebetrag inkl. Agio, mindestens Nennwert (Art. 8 Abs. 1 lit. a StG). Sacheinlagen zum Verkehrswert (Art. 8 Abs. 3 StG).';
    const genoNote = genossenschaft
      ? ' Genossenschaft: Die Abgabe entsteht mit der Begründung oder Erhöhung der Anteile (Art. 7 Abs. 1 lit. c StG); von den Einzahlungen eines Geschäftsjahres wird sie nur erhoben, soweit sie die Rückzahlungen im selben Geschäftsjahr übersteigen (Art. 9 Abs. 2 StG). Der Freibetrag gilt gesamthaft über alle Leistungen der Genossenschafter.'
      : '';
    posten.push({
      label: 'Emissionsabgabe (StG)',
      von: abgabe, bis: abgabe,
      erlass: emissionsabgabeErlass(art), url: EMISSIONSABGABE_URL, stand: EMISSIONSABGABE_STAND,
      // A4-3a: Art. 6 Abs. 1 lit. h StG ist ein FREIBETRAG (nur der übersteigende Teil
      // ist steuerbar), keine Freigrenze (ganzer Betrag) — Text an die Rechnung angeglichen.
      hinweis: (abgabe === 0
        ? `Kapital (inkl. Agio) bis CHF 1 Mio: abgabefrei (Freibetrag Art. 6 Abs. 1 lit. ${lit} StG).`
        : `Steuerbar ist nur der CHF 1 Mio übersteigende Teil (Freibetrag Art. 6 Abs. 1 lit. ${lit} StG). Befreiungen (Sanierung, Umstrukturierung Art. 6 StG) nicht berücksichtigt.`) + bemessungNote + genoNote + kumulNote,
    });
  }

  // Abgabe nicht ausgewiesen, weil keine Bemessung vorliegt (z. B. Fixtarif-Kanton, Feld leer): ehrlich offenlegen (§8).
  const emissionsHinweis = EMISSIONSABGABE_ARTEN.has(art) && bemessungChf === undefined
    ? 'Emissionsabgabe: ohne Ausgabebetrag nicht ausgewiesen (1 % auf den CHF 1 Mio. übersteigenden Teil, StG Art. 8).'
    : undefined;
  return { posten, mwst, mwstHinweis, ...(emissionsHinweis ? { emissionsHinweis } : {}) };
}
