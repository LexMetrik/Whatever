// ─── Kantonale Pfandrechtssteuer bei Errichtung eines Grundpfands ────────────
//
// RL-28 Teil 3 (RV-19). Eigene Quelle für die STEUER (keine Gebühr), die einzelne
// Kantone neben Beurkundungs- und Grundbuchgebühr auf die Pfandsumme erheben (FR, GE,
// VS, VD, JU). Vorher stand die Tabelle in `lib/beurkundungZusatzkosten.ts` (§5: eine
// Quelle). Zwei Verbraucher lesen sie über `lib/pfandsteuer.ts`: der Beurkundungsrechner
// (`weitereKosten`) und der Rechner Notariat/Grundbuch (Posten `pfandsteuer`).
//
// Kantone ohne Eintrag erheben keine Pfandsteuer (für NE und TI am 15.10.2026 in den
// Notariats- und Grundbucherlassen keine gefunden; die übrigen Kantone sind nicht
// einzeln geprüft: leer heisst «nicht erfasst», nicht «amtlich bestätigt steuerfrei»).
//
// Alle Normen am 15.10.2026 an der amtlichen Quelle geöffnet.

import type { KantonCode } from './typen';

export interface PfandsteuerSatz {
  erlassName: string;
  erlassNr: string;
  /** Einschlägige Bestimmungen (Anzeige-Beleg). */
  artikel: string;
  url: string;
  stand: string;
  /** Grundsatz in Prozent der Pfandsumme (vor Zuschlag). */
  satzProzent: number;
  /** Zuschlag auf die Steuer in Prozent (GE: 110 Centimes je Franken = Faktor 2,1). */
  zuschlagProzent?: number;
  /** Freigrenze: bis und mit diesem Wert steuerbefreit, darüber die ganze Summe steuerbar (VD). */
  freigrenzeChf?: number;
  /** Bis und mit diesem Wert steuerbefreit (VS Art. 18 al. 1 lit. a); Prüfung am ROHWERT. */
  befreitBisChf?: number;
  /** Bemessungsbasis auf Vielfache abgerundet (VD LTim Art. 3 al. 2: auf 1’000). */
  basisAbrundenChf?: number;
  /** Bemessungsbasis auf Vielfache aufgerundet (VS LDM Art. 16 al. 2: auf 100). */
  basisAufrundenChf?: number;
  /** Fixbetrag für ein Band der (gerundeten) Basis, beide Grenzen eingeschlossen (VS: 1’001–20’000 = 20). */
  fixBand?: { vonChf: number; bisChf: number; chf: number };
  /** Gesetzlicher Mindestbetrag (JU Art. 13 al. 1: mindestens 30). */
  mindestChf?: number;
  /** Ergänzender Hinweis (Sonderfälle, die nicht gerechnet werden). */
  hinweis?: string;
}

export const PFANDSTEUER: Partial<Record<KantonCode, PfandsteuerSatz>> = {
  FR: {
    erlassName: 'Loi sur les droits de mutation et les droits sur les gages immobiliers (LDMG)', erlassNr: 'RSF 635.1.1',
    artikel: 'Art. 23 al. 1 i.V.m. Art. 5 al. 1 lit. a LDMG (RSF 635.1.1)',
    url: 'https://bdlf.fr.ch/app/fr/texts_of_law/635.1.1', stand: '2024-03-01',
    satzProzent: 0.75,
  },
  GE: {
    erlassName: 'Loi sur les droits d’enregistrement (LDE) / Loi sur les centimes additionnels cantonaux (LCACant)', erlassNr: 'RSG D 3 30 / D 3 07',
    artikel: 'LDE Art. 84 und Art. 85 al. 1 (0,65 %); LCACant Art. 4 lit. b (110 Centimes je Franken = Zuschlag 110 %)',
    url: 'https://silgeneve.ch/legis/data/rsg_d3_30.htm', stand: '2026-03-21',
    satzProzent: 0.65, zuschlagProzent: 110,
    hinweis: 'Effektiv 1,365 % (0,65 % + 110 % Zuschlag). Nicht gerechnet: Halbierung (samt Zuschlägen) beim Erwerb der Hauptwohnung für Operationen bis 1 Mio. (LDE Art. 8A al. 2); Maximalhypothek ohne Schuldanerkennung 3 ‰ (Art. 106); Schuldner der Steuer (der Notar zahlt vor der Registrierung, Art. 161).',
  },
  // JU: 3,5 ‰, gesetzlicher Mindestbetrag CHF 30 (Art. 13 al. 1: «et de 30 francs au moins»).
  JU: {
    erlassName: 'Loi réglant les droits de mutation et les droits perçus pour la constitution de gages', erlassNr: 'RSJU 215.326.2',
    artikel: 'Art. 1, Art. 11 und Art. 13 al. 1 (3,5 ‰, mindestens 30 Fr.)',
    url: 'https://rsju.jura.ch/fr/viewdocument.html?idn=20037&id=33943&download=1', stand: '1978-11-09',
    satzProzent: 0.35, mindestChf: 30,
  },
  // VD: Freigrenze (kein Freibetrag): Pfandsummen bis und mit CHF 5’000 sind nach LTim Art. 3 al. 3
  // steuerbefreit, darüber die ganze Pfandsumme × 2 ‰; Basis auf die vollen tausend Franken
  // abgerundet (Art. 3 al. 2).
  VD: {
    erlassName: 'Loi sur le droit de timbre (LTim)', erlassNr: 'BLV 652.11',
    artikel: 'Art. 1 (contrats de gages immobiliers art. 793ss CC), Art. 3 al. 2 (2 ‰, base arrondie aux mille francs inférieurs) und al. 3 (exonération ≤ 5’000 fr.), Art. 4 (perception par le Registre foncier)',
    url: 'https://www.lexfind.ch/tolv/119178/fr', stand: '01.01.2014',
    satzProzent: 0.2, freigrenzeChf: 5000, basisAbrundenChf: 1000,
  },
  // VS: LDM RS 643.1 Art. 16 al. 1: 20 Fr. für 1’001–20’000, 0,2 % ab 20’001; al. 2: jeder Wert auf die
  // nächste Hunderterstelle aufgerundet; Art. 18 al. 1 lit. a: Akte bis 1’000 Fr. befreit.
  VS: {
    erlassName: 'Loi sur les droits de mutations (LDM)', erlassNr: 'RS 643.1',
    artikel: 'Art. 8 al. 1 lit. a, Art. 11 al. 1 lit. c, Art. 16 al. 1–2 (20 Fr. für 1’001–20’000, 0,2 % ab 20’001, Basis auf 100 aufgerundet), Art. 18 al. 1 lit. a (bis 1’000 Fr. befreit)',
    url: 'https://lex.vs.ch/app/fr/texts_of_law/643.1', stand: '1.1.2013',
    satzProzent: 0.2, befreitBisChf: 1000, basisAufrundenChf: 100,
    fixBand: { vonChf: 1001, bisChf: 20000, chf: 20 },
    hinweis: 'Gemeindezuschläge gelten nur für Handänderungen. Nicht gerechnet: gesetzliche Pfandrechte (Art. 17 al. 2 lit. m, fix 50) und die Umwandlung Papier- in Register-Schuldbrief (Art. 40 al. 2).',
  },
};
