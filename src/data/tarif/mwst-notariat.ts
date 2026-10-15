// ─── MWST auf Notariatsgebühren: Behandlung je Kanton ───────────────────────
//
// RL-33 / RV-24 (RECHTSLOGIK, Teil 1). Bundesrecht: MWSTG (SR 641.20) Art. 25 Abs. 1
// (Normalsatz 8,1 %); Tätigkeiten von Amtsnotaren sind unternehmerisch und damit
// steuerbar (MWSTV SR 641.201 Art. 14 Ziff. 13 i.V.m. MWSTG Art. 12 Abs. 4). Amts-
// UND freie Notare rechnen also MWST; das frühere Kriterium «freies Notariat» war
// falsch. Massgeblich ist die Klausel im Kantonstarif; schweigt der Tarif, gilt
// Bundesrecht (W-16 a, Entscheid David 24.9.2026 «nach Empfehlung»). Befreit von der
// Steuerpflicht ist, wer unter der Umsatzgrenze von CHF 100 000 bleibt (MWSTG Art. 10
// Abs. 2 lit. a; Gemeinwesen Art. 12 Abs. 3) — das legt die UI als Hinweis offen.
//
// `art`: 'zusaetzlich' = zusätzlich zur Tarifgebühr; 'inbegriffen' = in den Tarif-
//        ansätzen enthalten (kein Aufschlag); 'offen' = kein Tarif, keine Aussage.
// `grundlage`: 'tarif' = ausdrückliche Klausel im Kantonstarif; 'bundesrecht' = Tarif
//        schweigt, Aufschlag nach MWSTG/MWSTV.
// Belegt am 15.10.2026 gegen die amtlichen Portale (Wortlaut der Klausel im Kommentar);
// Stand = Fassung des Erlasses. Quelle ist nie das Artefakt, immer die amtliche Fassung.

import type { KantonCode } from './typen';

export interface MwstBehandlung {
  art: 'zusaetzlich' | 'inbegriffen' | 'offen';
  grundlage: 'tarif' | 'bundesrecht';
  erlassName: string;
  erlassNr: string;
  artikel: string;
  stand: string;
  quelleUrl: string;
  /** Offener Vorbehalt (z. B. Zuordnung wartet auf David); wird im Hinweis ausgewiesen. */
  vermerk?: string;
}

const BUNDESRECHT_ARTIKEL = 'Tarif ohne MWST-Klausel; MWSTG Art. 25 Abs. 1, MWSTV Art. 14 Ziff. 13';
const BR_OFFEN_VERMERK = 'Tarif schweigt; MWST nach Bundesrecht (MWSTG), Zuordnung offen.';

export const MWST_BEHANDLUNG: Record<KantonCode, MwstBehandlung> = {
  // ZH: «zusätzlich zur Gebühr»; Ausnahmen in der Dienstanweisung der Finanzdirektion vom 22.11.2023 § 2
  // (DA geöffnet; Wortlaut NotGebV § 2 selbst über das JS-Portal nicht abrufbar — Dossier RL-33).
  ZH: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Notariatsgebührenverordnung (NotGebV)', erlassNr: 'LS 243', artikel: 'NotGebV § 2; Dienstanweisung FD 22.11.2023 § 2 (Ausnahmen)', stand: '1.1.2024', quelleUrl: 'https://www.zh.ch/de/politik-staat/gesetze-beschluesse/gesetzessammlung/zhlex-ls/erlass-243-2009_03_09-2009_07_01-123.html' },
  // BE: «Die Mehrwertsteuer ist in der Gebühr nicht enthalten.»
  BE: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Verordnung über die Notariatsgebühren (GebVN)', erlassNr: 'BSG 169.81', artikel: 'Art. 1 Abs. 3 GebVN', stand: '1.3.2022', quelleUrl: 'https://www.belex.sites.be.ch/app/de/texts_of_law/169.81' },
  // LU: Anspruch auf die Mehrwertsteuer auf Honorar und Auslagen, soweit mehrwertsteuerpflichtig.
  LU: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Verordnung über die Beurkundungsgebühren (BeurkGebV)', erlassNr: 'SRL 258', artikel: '§ 9 Abs. 1', stand: '1.1.2022', quelleUrl: 'https://srl.lu.ch/app/de/texts_of_law/258' },
  // UR: kein amtlicher Tarif (RL-26) → keine Aussage.
  UR: { art: 'offen', grundlage: 'bundesrecht', erlassName: 'Notariatsverordnung (NotV)', erlassNr: 'RB 9.2311', artikel: 'Kein Gebührentarif, keine MWST-Klausel', stand: '1.1.2001', quelleUrl: 'https://rechtsbuch.ur.ch/app/de/texts_of_law/9.2311', vermerk: 'Uri hat keinen amtlichen Notariatstarif; MWST nicht beziffert.' },
  // SZ: «wird diese zusätzlich in Rechnung gestellt» (§ 2 Abs. 2, eingefügt 20.12.2005, in allen Fassungen gleich).
  // Stand: das amtliche PDF (sz.ch assets/7361, abgerufen 15.10.2026) trägt im Kopf «SRSZ 1.2.2027» und in Fn. 1
  // als letzte Änderung GS 28-9c vom 27.5.2026 — 1.2.2027 ist damit wohl deren Inkrafttreten (Amtsblatt nicht
  // geöffnet); «1.2.2021» ist durch nichts belegt (Änderung davor GS 26-6 vom 19.5.2020). Darum ehrlich: Fassung unklar.
  SZ: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Gebührentarif für Notare und Grundbuchverwalter sowie freiberufliche Urkundspersonen', erlassNr: 'SRSZ 213.512', artikel: '§ 2 Abs. 2', stand: 'Fassung unklar (PDF Kopf 1.2.2027, abgerufen 15.10.2026)', quelleUrl: 'https://www.sz.ch/public/upload/assets/7361/213_512.pdf' },
  // OW: «Anspruch auf die Mehrwertsteuer auf Gebühr, Honorar und Auslagen, soweit mehrwertsteuerpflichtig».
  OW: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Verordnung über die Beurkundungsgebühren', erlassNr: 'GDB 210.32', artikel: 'Art. 6 Abs. 2', stand: '1.1.2013', quelleUrl: 'https://gdb.ow.ch/app/de/texts_of_law/210.32' },
  // NW: «In der Gebühr nicht inbegriffen ist: … 3. die Mehrwertsteuer.»
  NW: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Verordnung über die Beurkundungsgebühren (BeurkGebV)', erlassNr: 'NG 268.12', artikel: '§ 3a Abs. 1 Ziff. 3', stand: '1.1.2016', quelleUrl: 'https://gesetze.nw.ch/app/de/texts_of_law/268.12' },
  // GL: Anspruch auf die Mehrwertsteuer auf Gebühr und Auslagen, soweit mehrwertsteuerpflichtig.
  GL: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Verordnung über Beurkundung und Beglaubigung mit Gebührentarif', erlassNr: 'GS III B/3/2', artikel: 'Art. 10 Abs. 3', stand: '1.1.2009', quelleUrl: 'https://gesetze.gl.ch/app/de/texts_of_law/III%20B%2F3%2F2' },
  // ZG: «In den Ansätzen dieses Tarifs ist die Mehrwertsteuer, sofern geschuldet, inbegriffen.»
  ZG: { art: 'inbegriffen', grundlage: 'tarif', erlassName: 'Kantonsratsbeschluss über die Gebühren in Verwaltungs- und Zivilsachen (Verwaltungsgebührentarif)', erlassNr: 'BGS 641.1', artikel: 'Ziff. 109bis', stand: '22.8.2025', quelleUrl: 'https://bgs.zg.ch/app/de/texts_of_law/641.1', vermerk: 'Gilt für den Tarif der Notariate; Anwalts-Urkundspersonen (BeurkG § 28 Abs. 2) rechnen nach dem Obergerichtstarif, dort offen.' },
  // W-16 (a): Tarif schweigt → Bundesrecht.
  FR: { art: 'zusaetzlich', grundlage: 'bundesrecht', erlassName: 'Tarif des émoluments des notaires', erlassNr: 'RSF 261.16', artikel: BUNDESRECHT_ARTIKEL, stand: '1.7.2016', quelleUrl: 'https://bdlf.fr.ch/app/fr/texts_of_law/261.16' },
  SO: { art: 'zusaetzlich', grundlage: 'bundesrecht', erlassName: 'Gebührentarif (GT)', erlassNr: 'BGS 615.11', artikel: BUNDESRECHT_ARTIKEL, stand: '1.3.2026', quelleUrl: 'https://bgs.so.ch/app/de/texts_of_law/615.11', vermerk: 'Freie Notare in SO: Tarifgrundlage nicht geprüft.' },
  // BS: Tarif schweigt (PDF volltext-durchsucht, 0 Treffer); Zuordnung wartet auf David.
  BS: { art: 'zusaetzlich', grundlage: 'bundesrecht', erlassName: 'Notariatstarif', erlassNr: 'SG 292.400', artikel: BUNDESRECHT_ARTIKEL, stand: '1.7.2016', quelleUrl: 'https://www.gesetzessammlung.bs.ch/app/de/texts_of_law/292.400', vermerk: BR_OFFEN_VERMERK },
  // BL: «Zum Stundenansatz und zu allen festen Gebührenansätzen wird die Mehrwertsteuer hinzugerechnet.»
  BL: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Verordnung über die Notariatsgebühren', erlassNr: 'SGS 217.13', artikel: '§ 11 Abs. 1', stand: '1.11.2012', quelleUrl: 'https://bl.clex.ch/app/de/texts_of_law/217.13' },
  SH: { art: 'zusaetzlich', grundlage: 'bundesrecht', erlassName: 'Verordnung über die Gebühren für öffentliche Beurkundungen (Notariatsgebührenverordnung)', erlassNr: 'SHR 221.101', artikel: BUNDESRECHT_ARTIKEL, stand: '1.1.2016', quelleUrl: 'https://rechtsbuch.sh.ch/app/de/texts_of_law/221.101' },
  // AR: «In den Gebühren gemäss diesem Tarif ist eine allfällige Mehrwertsteuer nicht enthalten.»
  AR: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Gesetz über die Gebühren der Gemeinden (Gebührentarif für die Gemeinden)', erlassNr: 'bGS 153.2', artikel: 'Art. 12 Abs. 1', stand: '1.1.2018', quelleUrl: 'https://ar.clex.ch/api/de/versions/1203/pdf_file' },
  AI: { art: 'zusaetzlich', grundlage: 'bundesrecht', erlassName: 'Gebührentarif', erlassNr: 'GS 172.513', artikel: BUNDESRECHT_ARTIKEL, stand: '1.1.2026', quelleUrl: 'https://ai.clex.ch/app/de/texts_of_law/172.513' },
  // SG: Fn. 5 «Die Gebühren verstehen sich ohne Mehrwertsteuer … wird die Gebühr um den Steuerbetrag erhöht.»
  // Grundstücksbezogene Beurkundungen: GB-GebV sGS 914.5 Art. 3 «Soweit die Gebühren der Mehrwertsteuer
  // unterliegen, wird diese hinzugerechnet.» (in Vollzug seit 1.6.2020; gesetzessammlung.sg.ch, 15.10.2026 geöffnet)
  SG: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Gebührentarif für die Kantons- und Gemeindeverwaltung', erlassNr: 'sGS 821.5', artikel: 'Fussnote 5 (Gebühren ohne Mehrwertsteuer); grundstücksbezogen auch sGS 914.5 Art. 3 (Mehrwertsteuer)', stand: '1.1.2026', quelleUrl: 'https://www.gesetzessammlung.sg.ch/api/de/versions/3849/pdf_file' },
  // GR: «… Ersatz der notwendigen Auslagen und der Mehrwertsteuer, die offen auszuweisen ist».
  GR: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Verordnung über die Notariatsgebühren (NotGebV)', erlassNr: 'BR 210.370', artikel: 'Art. 1 Abs. 1', stand: '1.1.2024', quelleUrl: 'https://www.gr-lex.gr.ch/app/de/texts_of_law/210.370' },
  // AG: «… sowie auf die von ihr zu entrichtende Mehrwertsteuer».
  AG: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Dekret über den Notariatstarif', erlassNr: 'SAR 295.250', artikel: '§ 9 Abs. 1', stand: '1.1.2025', quelleUrl: 'https://gesetzessammlungen.ag.ch/app/de/texts_of_law/295.250' },
  // TG: Gegenprüfung 15.10.2026: Die Preisliste GNI (Stand 1.1.2026) ist kein Erlass; sie nennt MWST nur bei
  // Beurkundungen von Grundstücksgeschäften, Depotgebühren, Gesellschaftsrecht, Stundenansätzen und
  // *-markierten Erbschaftsgeschäften und schweigt zu Beglaubigungen, Bürgschaften, Familien-/Erbrecht;
  // GGG RB 632.1 schweigt. Darum Bundesrecht (W-16 a), Betrag unverändert.
  TG: { art: 'zusaetzlich', grundlage: 'bundesrecht', erlassName: 'Preisliste Grundbuchamt und Notariat (GNI)', erlassNr: 'Preisliste GNI', artikel: BUNDESRECHT_ARTIKEL, stand: '1.1.2026', quelleUrl: 'https://gni.tg.ch/public/upload/assets/123369/Preisliste%20Grundbuchamt%20und%20Notariat.pdf', vermerk: 'Preisliste GNI nennt MWST für Grundstücks- und Gesellschaftsgeschäfte; im Übrigen Bundesrecht (MWSTG).' },
  TI: { art: 'zusaetzlich', grundlage: 'bundesrecht', erlassName: 'Legge sulla tariffa notarile', erlassNr: 'RL 952.300', artikel: BUNDESRECHT_ARTIKEL, stand: '1.7.2015', quelleUrl: 'https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/pdfatto/atto/148' },
  // VD: Tarif schweigt (0 Treffer TVA); Zuordnung wartet auf David.
  VD: { art: 'zusaetzlich', grundlage: 'bundesrecht', erlassName: 'Tarif des honoraires dus aux notaires pour des opérations ministérielles (TNo)', erlassNr: 'BLV 178.11.2', artikel: BUNDESRECHT_ARTIKEL, stand: '1.3.2016', quelleUrl: 'https://www.lexfind.ch/tolv/210344/fr', vermerk: BR_OFFEN_VERMERK },
  // VS: «Le notaire assujetti à la TVA perçoit cette taxe en sus des montants indiqués dans le présent règlement.»
  VS: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Règlement fixant le tarif des émoluments et des débours des notaires', erlassNr: 'RS 178.104', artikel: 'Art. 10 al. 1', stand: '1.1.2011', quelleUrl: 'https://lex.vs.ch/app/fr/texts_of_law/178.104' },
  // NE: Art. 14 «Les émoluments, hors TVA, dus aux notaires …» (HTML «Etat au 13 mai 2015», Aktualität ungeprüft).
  NE: { art: 'zusaetzlich', grundlage: 'tarif', erlassName: 'Arrêté fixant le tarif des émoluments des notaires', erlassNr: 'RSN 166.31', artikel: 'Art. 14', stand: '13.5.2015', quelleUrl: 'https://rsn.ne.ch/DATA/program/books/RSN2015/20154/htm/16631.htm' },
  GE: { art: 'zusaetzlich', grundlage: 'bundesrecht', erlassName: 'Règlement sur les émoluments des notaires (REmNot)', erlassNr: 'RSG E 6 05.03', artikel: BUNDESRECHT_ARTIKEL, stand: '2026', quelleUrl: 'https://silgeneve.ch/legis/program/books/rsg/htm/rsg_e6_05p03.htm' },
  // JU: Décret schweigt (0 Treffer TVA); Zuordnung wartet auf David.
  JU: { art: 'zusaetzlich', grundlage: 'bundesrecht', erlassName: 'Décret concernant les émoluments des notaires', erlassNr: 'RSJU 189.61', artikel: BUNDESRECHT_ARTIKEL, stand: '1.1.2007', quelleUrl: 'https://rsju.jura.ch/fr/viewdocument.html?idn=20029&id=37829&download=1', vermerk: BR_OFFEN_VERMERK },
};

/** ZH-Ausnahmen (Dienstanweisung der Finanzdirektion vom 22.11.2023 zur NotGebV, § 2):
 *  MWST in der Gebühr inbegriffen. Abbildung je Geschäftsart nur dort, wo die Zuordnung
 *  zur Tarifziffer eindeutig ist (beurkundung.ts ZH): vollmacht = Ziff. 4.5.1
 *  (Beglaubigung Unterschrift) → immer inbegriffen; buergschaft = Ziff. 4.4.1 → inbegriffen,
 *  sofern die Gebühr CHF 199 nicht übersteigt. Übrige DA-Ziffern (4.3.1/4.3.4/4.4.4/4.5.2/
 *  4.5.3/4.7/5.2/6/7) haben keine Geschäftsart im Rechner. */
export const ZH_MWST_INBEGRIFFEN: Partial<Record<string, { ziffer: string; bisGebuehrChf?: number }>> = {
  vollmacht: { ziffer: '4.5.1' },
  buergschaft: { ziffer: '4.4.1', bisGebuehrChf: 199 },
};
