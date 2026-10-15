// ─── Kantonale Schlichtungsgebühren (Art. 95 II lit. a / 96 ZPO) ────────────
//
// Geltungsbereich: Gebühr des Schlichtungsverfahrens in VERMÖGENSRECHTLICHEN,
// nicht bundesrechtlich kostenlosen Streitigkeiten (v. a. Geldforderungen).
// Die bundesrechtliche Kostenlosigkeit (Art. 113 Abs. 2 ZPO: Miete/Pacht,
// Arbeit ≤ 30'000, GlG/BehiG/Mitwirkung/KVG-Zusatz/Datenschutz) ist der Engine
// vorgeschaltet und hier NICHT abgebildet. Eigener, vom Entscheidgebühr-Tarif
// getrennter Tarif (regime-treu, §4).
//
// Quelle/Verifikation: bibliothek/kosten/schlichtungsgebuehren-kantone.md
// (zweifach geprüft 5.6.2026, Beträge wörtlich aus den amtlichen Erlass-Volltexten).
// Abnahme David ausstehend (§7) — nichts trägt 'geprüft'. Ermessensrahmen liefern
// die Spanne (§2/§8); VD/NE sind forfaitaire (deterministisch).

import type { KantonCode, KantonalerTarif } from './typen';

const INF = Infinity;

export const SCHLICHTUNG: Record<KantonCode, KantonalerTarif> = {
  ZH: {
    kanton: 'ZH', erlassName: 'Gebührenverordnung des Obergerichts (GebV OG)', erlassNr: 'LS 211.11',
    artikel: '§ 3', stand: '1.1.2015 (Nachtrag 087)', verifiziert: 'doppelt',
    quelleUrl: 'https://www.zh.ch/de/politik-staat/gesetze-beschluesse/gesetzessammlung/zhlex-ls/erlass-211_11-2010_09_08-2011_01_01-087.html',
    hinweis: 'Streitwertgestufter Rahmen; bei Entscheid/Urteilsvorschlag (Art. 210/212 ZPO) Erhöhung um bis zur Hälfte.',
    regel: { typ: 'staffel_rahmen', baender: [
      { grenzeChf: 1000, minChf: 65, maxChf: 250 },
      { grenzeChf: 10000, minChf: 250, maxChf: 420 },
      { grenzeChf: 100000, minChf: 420, maxChf: 615 },
      { grenzeChf: INF, minChf: 615, maxChf: 1240 },
    ] },
  },
  BE: {
    kanton: 'BE', erlassName: 'Verfahrenskostendekret (VKD)', erlassNr: 'BSG 161.12',
    artikel: 'Art. 35', stand: '1.5.2026', verifiziert: 'doppelt',
    quelleUrl: 'https://www.belex.sites.be.ch/app/de/texts_of_law/161.12',
    hinweis: '100–1000 Taxpunkte (1 TP = CHF 1, Art. 4); Kostenvorschuss in der Praxis hälftig.',
    regel: { typ: 'rahmen', vonChf: 100, bisChf: 1000 },
  },
  LU: {
    kanton: 'LU', erlassName: 'Justiz-Kostenverordnung (JusKV)', erlassNr: 'SRL Nr. 265',
    artikel: '§ 4', stand: '1.1.2026', verifiziert: 'doppelt',
    quelleUrl: 'https://srl.lu.ch/app/de/texts_of_law/265',
    hinweis: 'Streitwertgestuft; bei Entscheid/Urteilsvorschlag zusätzlich CHF 100–500.',
    regel: { typ: 'staffel_rahmen', baender: [
      { grenzeChf: 50000, minChf: 200, maxChf: 400 },
      { grenzeChf: 100000, minChf: 300, maxChf: 600 },
      { grenzeChf: 500000, minChf: 500, maxChf: 1000 },
      { grenzeChf: INF, minChf: 800, maxChf: 2000 },
    ] },
  },
  UR: {
    kanton: 'UR', erlassName: 'Gerichtsgebührenreglement (GGebR)', erlassNr: 'RB 2.3232',
    artikel: 'Art. 4', stand: '1.10.2023', verifiziert: 'doppelt',
    quelleUrl: 'https://rechtsbuch.ur.ch/app/de/texts_of_law/2.3232',
    hinweis: 'Bei Entscheid/Urteilsvorschlag angemessen erhöht.',
    regel: { typ: 'rahmen', vonChf: 200, bisChf: 2000 },
  },
  SZ: {
    kanton: 'SZ', erlassName: 'Gebührenordnung (GebO)', erlassNr: 'SRSZ 173.111',
    artikel: '§ 31', stand: '1.2.2026', verifiziert: 'doppelt',
    quelleUrl: 'https://www.sz.ch/public/upload/assets/32452/173_111.pdf',
    hinweis: 'Pauschale (Schlichtungsverfahren).',
    regel: { typ: 'rahmen', vonChf: 100, bisChf: 1000 },
  },
  OW: {
    kanton: 'OW', erlassName: 'Gebührenordnung für die Rechtspflege (GebOR)', erlassNr: 'GDB 134.15',
    artikel: 'Art. 8', stand: '1.3.2015', verifiziert: 'doppelt',
    quelleUrl: 'https://gdb.ow.ch/app/de/texts_of_law/134.15',
    hinweis: 'Gilt für Schlichtungs- und Entscheidverfahren.',
    regel: { typ: 'rahmen', vonChf: 100, bisChf: 1000 },
  },
  NW: {
    kanton: 'NW', erlassName: 'Prozesskostengesetz (PKoG)', erlassNr: 'NG 261.2',
    artikel: 'Art. 6', stand: '1.1.2016', verifiziert: 'doppelt',
    quelleUrl: 'https://gesetze.nw.ch/app/de/texts_of_law/261.2',
    hinweis: 'Streitwertgestuft; bei Entscheid/Urteilsvorschlag Erhöhung um bis zur Hälfte.',
    regel: { typ: 'staffel_rahmen', baender: [
      { grenzeChf: 5000, minChf: 100, maxChf: 300 },
      { grenzeChf: 30000, minChf: 200, maxChf: 500 },
      { grenzeChf: INF, minChf: 300, maxChf: 700 },
    ] },
  },
  GL: {
    kanton: 'GL', erlassName: 'Verordnung über die Prozesskosten in Zivil- und Strafsachen', erlassNr: 'GS III A/5',
    artikel: 'Art. 2', stand: '1.1.2026', verifiziert: 'doppelt',
    quelleUrl: 'https://gesetze.gl.ch/app/de/texts_of_law/III-A.5',
    hinweis: 'Pauschale.',
    regel: { typ: 'rahmen', vonChf: 100, bisChf: 800 },
  },
  ZG: {
    kanton: 'ZG', erlassName: 'Kostenverordnung Obergericht (KoV OG)', erlassNr: 'BGS 161.7',
    artikel: '§ 10', stand: '1.7.2026', verifiziert: 'doppelt',
    quelleUrl: 'https://bgs.zg.ch/app/de/texts_of_law/161.7',
    hinweis: 'Streitwertgestuft; bei Entscheid/Entscheidvorschlag zusätzlich CHF 100–800.',
    regel: { typ: 'staffel_rahmen', baender: [
      { grenzeChf: 1000, minChf: 50, maxChf: 250 },
      { grenzeChf: 10000, minChf: 200, maxChf: 400 },
      { grenzeChf: 100000, minChf: 300, maxChf: 600 },
      { grenzeChf: INF, minChf: 500, maxChf: 1200 },
    ] },
  },
  FR: {
    kanton: 'FR', erlassName: 'Justizreglement (JR)', erlassNr: 'SGF 130.11',
    artikel: 'Art. 18', stand: '1.12.2025', verifiziert: 'recherche',
    quelleUrl: 'https://bdlf.fr.ch/app/de/texts_of_law/130.11',
    hinweis: 'Weiter Rahmen; Festsetzung nach Streitwert/Aufwand (Art. 11 Abs. 2 JR).',
    regel: { typ: 'rahmen', vonChf: 50, bisChf: 10000, hinweis: 'Gebührenrahmen CHF 50–10 000; konkrete Festsetzung nach Streitwert und Aufwand (Art. 11 Abs. 2 JR).' },
  },
  SO: {
    kanton: 'SO', erlassName: 'Gebührentarif (GT)', erlassNr: 'BGS 615.11',
    artikel: '§ 144', stand: '1.3.2026', verifiziert: 'doppelt',
    quelleUrl: 'https://bgs.so.ch/app/de/texts_of_law/615.11',
    hinweis: 'Schlichtungsbehörden CHF 200–1500 (§ 144); Friedensrichter CHF 50–200 (§ 152bis).',
    regel: { typ: 'rahmen', vonChf: 200, bisChf: 1500 },
  },
  BS: {
    kanton: 'BS', erlassName: 'Reglement über die Gerichtsgebühren (GGR)', erlassNr: 'SG 154.810',
    artikel: '§ 3', stand: '3.6.2021', verifiziert: 'recherche',
    quelleUrl: 'https://www.gesetzessammlung.bs.ch/app/de/texts_of_law/154.810',
    hinweis: 'CHF 100 bis höchstens 30 % der Entscheidgebühr (§ 5), maximal CHF 10 000 — relativer Tarif; angezeigt ist der absolute Rahmen.',
    regel: { typ: 'rahmen', vonChf: 100, bisChf: 10000, hinweis: 'CHF 100 bis höchstens 30 % der Entscheidgebühr, maximal CHF 10 000 (§ 3 GGR).' },
  },
  BL: {
    kanton: 'BL', erlassName: 'Gebührentarif (GebT)', erlassNr: 'SGS 170.31',
    artikel: '§ 7 / § 8', stand: '1.1.2021', verifiziert: 'doppelt',
    quelleUrl: 'https://bl.clex.ch/app/de/texts_of_law/170.31',
    hinweis: 'Friedensrichter CHF 50–300 ohne / 100–500 mit Verhandlung (§ 7); Zivilkreisgerichts-Schlichtung 100–500 (§ 8 lit. e).',
    regel: { typ: 'rahmen', vonChf: 50, bisChf: 500 },
  },
  SH: {
    // Korrektur 16.6.2026 (§7, fachl. freigegeben David): bisher zitierte
    // kantonale ZPO «SHR 273.100 Art. 109» (1951) wurde am 1.1.2011 mit der
    // eidg. ZPO aufgehoben (totes Recht, LexWork-API 404). Geltend ist Art. 82
    // Justizgesetz (JG): «Im Schlichtungsverfahren beträgt die Pauschalgebühr
    // Fr. 100.00 bis Fr. 1'000.00, wenn das Verfahren nicht kostenlos ist.»
    // Quelle: rechtsbuch.sh.ch JG 173.200, version_uid ce466f93…, i.K. 1.5.2026.
    kanton: 'SH', erlassName: 'Justizgesetz (JG)', erlassNr: 'SHR 173.200',
    artikel: 'Art. 82', stand: '1.5.2026', verifiziert: 'doppelt',
    quelleUrl: 'https://rechtsbuch.sh.ch/app/de/texts_of_law/173.200',
    hinweis: 'Pauschalgebühr Schlichtungsverfahren (Art. 82 JG); entfällt, wenn das Verfahren kostenlos ist (Art. 113 Abs. 2 ZPO).',
    regel: { typ: 'rahmen', vonChf: 100, bisChf: 1000 },
  },
  AR: {
    kanton: 'AR', erlassName: 'Gebührenordnung (Rechtskosten Zivil-/Strafrechtspflege)', erlassNr: 'bGS 233.3',
    artikel: 'Art. 13', stand: '1.12.2017', verifiziert: 'doppelt',
    quelleUrl: 'https://ar.clex.ch/app/de/texts_of_law/233.3',
    hinweis: 'NICHT kostenlos (ausser bundesrechtlich): Vermittler CHF 50–200 + CHF 100 je weitere Stunde; Verdoppelung möglich ab Streitwert CHF 100 000.',
    regel: { typ: 'rahmen', vonChf: 50, bisChf: 200 },
  },
  AI: {
    kanton: 'AI', erlassName: 'Verordnung über die Gebühren der Gerichte (GGV)', erlassNr: 'GS 173.810',
    artikel: 'Art. 7', stand: '1.1.2024', verifiziert: 'doppelt',
    quelleUrl: 'https://ai.clex.ch/app/de/texts_of_law/173.810',
    hinweis: 'Verfahrensabhängig (Art. 7 GGV): Erteilung Klagebewilligung 200–1000 · Urteilsvorschlag/Entscheid 300–1000 · Einigung/Rückzug/Säumnis 100–600 (lit. b–d; lit. a aufgehoben) → Gesamtrahmen 100–1000. Re-Verifikation 21.6. und erneut 15.10.2026 (RL-36) am Volltext der LexWork-API (Version in Kraft seit 1.1.2024, nicht aufgehoben): amtlich bestätigt; der pauschale 50–500-Rahmen war falsch.',
    regel: { typ: 'rahmen', vonChf: 100, bisChf: 1000 },
  },
  SG: {
    kanton: 'SG', erlassName: 'Gerichtskostenverordnung (GKV)', erlassNr: 'sGS 941.12',
    artikel: 'Art. 8', stand: '1.7.2026', verifiziert: 'doppelt',
    quelleUrl: 'https://www.gesetzessammlung.sg.ch/app/de/texts_of_law/941.12',
    hinweis: 'Klagebewilligung CHF 200–1000; Urteilsvorschlag/Entscheid 300–1000; Einigung/Säumnis/Rückzug 100–600.',
    regel: { typ: 'rahmen', vonChf: 100, bisChf: 1000 },
  },
  GR: {
    kanton: 'GR', erlassName: 'Verordnung über die Gerichtsgebühren in Zivilverfahren (VGZ)', erlassNr: 'BR 320.210',
    artikel: 'Art. 2', stand: '1.1.2025', verifiziert: 'doppelt',
    quelleUrl: 'https://www.gr-lex.gr.ch/app/de/texts_of_law/320.210',
    hinweis: 'Schlichtungsverfahren CHF 100–500; bei Entscheid (Art. 212) oder Urteilsvorschlag (Art. 210 I lit. c) CHF 300–3000.',
    regel: { typ: 'rahmen', vonChf: 100, bisChf: 500 },
  },
  AG: {
    kanton: 'AG', erlassName: 'Gebührendekret (GebührD)', erlassNr: 'SAR 662.110',
    artikel: '§ 6', stand: '1.7.2024', verifiziert: 'recherche',
    quelleUrl: 'https://gesetzessammlungen.ag.ch/app/de/texts_of_law/662.110',
    hinweis: 'Erledigung (Anerkennung/Vergleich/Rückzug) CHF 50–300; Klagebewilligung 50–300; Urteil/Urteilsvorschlag ab CHF 100 (bis zum Doppelten bei Aufwand).',
    regel: { typ: 'rahmen', vonChf: 50, bisChf: 500 },
  },
  TG: {
    kanton: 'TG', erlassName: 'Verordnung über die Gebühren der Strafverfolgungs- und Gerichtsbehörden (VGG)', erlassNr: 'RB 638.1',
    artikel: '§ 7', stand: '1.1.2022', verifiziert: 'doppelt',
    quelleUrl: 'https://www.rechtsbuch.tg.ch/app/de/texts_of_law/638.1',
    hinweis: 'Vermittlungsvorstand streitwertgestuft; Klageabschreibung nach Vorladung CHF 50.',
    regel: { typ: 'staffel_rahmen', baender: [
      { grenzeChf: 2000, minChf: 100, maxChf: 150 },
      { grenzeChf: 8000, minChf: 120, maxChf: 200 },
      { grenzeChf: 30000, minChf: 160, maxChf: 300 },
      { grenzeChf: 100000, minChf: 240, maxChf: 400 },
      { grenzeChf: INF, minChf: 320, maxChf: 500 },
    ] },
  },
  TI: {
    kanton: 'TI', erlassName: 'Legge sulla tariffa giudiziaria (LTG)', erlassNr: 'RL 178.200',
    artikel: 'Art. 5', stand: '30.11.2010 (geltende Fassung)', verifiziert: 'doppelt',
    quelleUrl: 'https://www.lexfind.ch/tolv/125101/it',
    hinweis: 'Streitwertgestuft; oberstes Band CHF 3000 bis 0,5 % des Streitwerts. Bei erfolgreicher Schlichtung kann auf die Gebühr verzichtet werden.',
    regel: { typ: 'staffel_rahmen', baender: [
      { grenzeChf: 2000, minChf: 50, maxChf: 150 },
      { grenzeChf: 5000, minChf: 100, maxChf: 300 },
      { grenzeChf: 30000, minChf: 200, maxChf: 1500 },
      { grenzeChf: 100000, minChf: 500, maxChf: 3000 },
      { grenzeChf: 1000000, minChf: 1000, maxChf: 5000 },
      { grenzeChf: INF, minChf: 3000, maxProzent: 0.5 },
    ] },
  },
  VD: {
    kanton: 'VD', erlassName: 'Tarif des frais judiciaires civils (TFJC)', erlassNr: 'BLV 270.11.5',
    artikel: 'Art. 15', stand: '28.9.2010 (geltende Fassung)', verifiziert: 'doppelt',
    quelleUrl: 'https://www.lexfind.ch/tolv/105539/fr',
    hinweis: 'Émolument forfaitaire (fest); Reduktion um ⅓, wenn das Verfahren vor der Schlichtungsverhandlung endet (Art. 17).',
    regel: { typ: 'staffel_sockel_prozent', baender: [
      { bisChf: 2000, sockelChf: 150, abChf: 0, prozent: 0 },
      { bisChf: 5000, sockelChf: 210, abChf: 0, prozent: 0 },
      { bisChf: 10000, sockelChf: 300, abChf: 0, prozent: 0 },
      { bisChf: 30000, sockelChf: 360, abChf: 0, prozent: 0 },
      { bisChf: 100000, sockelChf: 900, abChf: 0, prozent: 0 },
      { bisChf: INF, sockelChf: 1200, abChf: 500000, prozent: 0.25, maxChf: 5000 },
    ] },
  },
  VS: {
    kanton: 'VS', erlassName: 'Loi fixant le tarif des frais et dépens (LTar)', erlassNr: 'SGS/VS 173.8',
    artikel: 'Art. 15', stand: '1.1.2025', verifiziert: 'recherche',
    quelleUrl: 'https://lex.vs.ch/app/de/texts_of_law/173.8',
    hinweis: 'Art. 15 LTar: citation en conciliation 50–100 (je nach Zahl Beklagter, Abs. 1a) + tenue de la séance 120–250 (Abs. 1b) → Normalfall 170–350; Streitwert ≤ 2000 oder proposition de décision 60–500 (Abs. 2). Re-Verifikation 21.6.: amtlich bestätigt (Fassung 1.1.2025).',
    regel: { typ: 'rahmen', vonChf: 50, bisChf: 500 },
  },
  NE: {
    kanton: 'NE', erlassName: 'Loi fixant le tarif des frais (LTFrais)', erlassNr: 'RSN 164.1',
    artikel: 'Art. 11', stand: '1.1.2020', verifiziert: 'doppelt',
    quelleUrl: 'https://rsn.ne.ch/DATA/program/books/RSN2024/20245/htm/164.1.htm',
    hinweis: 'Émolument forfaitaire (fest); Reduktion bis CHF 300 bei geringem Aufwand; auch bei erfolgreicher Schlichtung geschuldet.',
    regel: { typ: 'staffel_inklusiv', baender: [
      { bisChf: 2000, chf: 300 },
      { bisChf: 5000, chf: 400 },
      { bisChf: 8000, chf: 500 },
      { bisChf: 10000, chf: 600 },
      { bisChf: 30000, chf: 1000 },
      { bisChf: 100000, chf: 1300 },
      { bisChf: 500000, chf: 1900 },
      { bisChf: INF, chf: 2500 },
    ] },
  },
  GE: {
    kanton: 'GE', erlassName: 'Règlement fixant le tarif des frais en matière civile (RTFMC)', erlassNr: 'rsGE E 1 05.10',
    artikel: 'Art. 15', stand: '1.7.2025', verifiziert: 'recherche',
    quelleUrl: 'https://silgeneve.ch/legis/data/rsg_e1_05p10.htm',
    hinweis: 'Émolument forfaitaire de conciliation (Art. 15 RTFMC): bis 30 000 CHF 100, darüber CHF 200. Bei Mehrheit von Klägern oder Beklagten erhöht sich die Gebühr um 20 % (Art. 13 RTFMC, Dispositions communes — gemeinsame Bestimmung auch für die Schlichtung); die Engine kennt keinen Parteien-Input, daher hier nicht eingerechnet.',
    regel: { typ: 'staffel_inklusiv', baender: [{ bisChf: 30000, chf: 100 }, { bisChf: INF, chf: 200 }] },
  },
  JU: {
    kanton: 'JU', erlassName: 'Décret fixant les émoluments judiciaires', erlassNr: 'RSJU 176.511',
    artikel: 'Art. 21 Abs. 1 lit. b', stand: '1.1.2024 (Punktwert 1.1.2025)', verifiziert: 'doppelt',
    quelleUrl: 'https://rsju.jura.ch/fr/viewdocument.html?idn=20021&id=34172',
    hinweis: '200–1000 Punkte × Punktwert CHF 1.05 (Stand 1.1.2025, jährlich indexiert — Verfallskandidat).',
    regel: { typ: 'rahmen', vonChf: 210, bisChf: 1050 },
  },
};
