// ─── Notariats-, Grundbuch-, Grundpfand- & Handänderungssteuer-Tarife ───────
//
// Grundstückkauf-Nebenkosten je Kanton (FAHRPLAN-NOTARIAT-GRUNDBUCH). Quelle/
// Verifikation je Wert: bibliothek/kosten/notariat-grundbuch-kantone.md
// (ERSTRECHERCHE 15.6.2026, je Wert amtlicher Erlass + Artikel + Link + Stand).
// Verifikationsstand durchgehend 'recherche' bis zum Doppelcheck-Pass; nichts
// trägt 'geprüft' (§7). Determinismus §2: Promille/Staffel wo klare Bänder;
// ehrlich `rahmen`/`formel_extern` wo aufwand-/bandbreitenbasiert oder die
// Staffel-Bänder noch nicht abschliessend erhoben sind (Stützstelle im Hinweis).
// Promille-Staffeln sind MARGINAL kodiert (staffel_sockel_prozent, prozent=‰/10).

import type { KantonCode, KantonalerTarif } from './typen';

const INF = Infinity;
const R = 'recherche' as const;

// ─── Uri: kein amtlicher Notariatstarif ──────────────────────────────────────
// RB 9.2311 Art. 38 Abs. 3 verweist auf einen «beigefügten Tarif», der in der
// amtlichen Fassung (Version 812, in Kraft seit 1.1.2001) nicht enthalten ist.
// Der Konventionaltarif des Urner Anwalts- und Notarenverbands ist kein Erlass
// und wird nicht gerechnet (W-14, 23.9.2026; RL-26). Eine Quelle für alle UR-
// Einträge hier und in beurkundung.ts (§5).
const UR_OHNE_TARIF_HINWEIS =
  'Uri hat keinen amtlichen Notariatstarif (RB 9.2311 Art. 38 Abs. 3 verweist auf einen Tarif, der amtlich nicht publiziert ist); Gebühr beim Notariat erfragen. ' +
  'Der Urner Anwalts- und Notarenverband führt einen privaten Konventionaltarif (Stand 17.3.2015); er ist kein amtlicher Erlass und wird hier nicht gerechnet.';

export const urOhneAmtlichenTarif = (): KantonalerTarif => ({
  kanton: 'UR',
  erlassName: 'Verordnung über das Notariat (NotV)',
  erlassNr: 'RB 9.2311',
  artikel: 'Art. 38 Abs. 3',
  stand: '1.1.2001',
  verifiziert: R,
  quelleUrl: 'https://rechtsbuch.ur.ch/app/de/texts_of_law/9.2311',
  hinweis: UR_OHNE_TARIF_HINWEIS,
  regel: { typ: 'formel_extern', hinweis: UR_OHNE_TARIF_HINWEIS },
});

// ─── 1. Notariat / Beurkundung Kaufvertrag (über Kaufpreis) ─────────────────
export const NOTARIAT: Record<KantonCode, KantonalerTarif> = {
  ZH: { kanton: 'ZH', erlassName: 'Notariatsgebührenverordnung (NotGebV)', erlassNr: 'LS 243', artikel: 'Anhang Ziff. 1.1.1', stand: '1.1.2024', verifiziert: R, quelleUrl: 'https://www.zh.ch/de/politik-staat/gesetze-beschluesse/gesetzessammlung/zhlex-ls/erlass-243-2009_03_09-2009_07_01-123.html', hinweis: 'Amtsnotariat (staatlicher Fixtarif).', regel: { typ: 'promille', promille: 1, minChf: 100 } },
  BE: { kanton: 'BE', erlassName: 'Verordnung über die Gebühren der Notare (GebVN)', erlassNr: 'BSG 169.81', artikel: 'Art. 13 + Anhang 1', stand: '1.3.2022', verifiziert: R, quelleUrl: 'https://www.belex.sites.be.ch/app/de/texts_of_law/169.81', hinweis: 'Freies Notariat, Rahmentarif Anhang 1 (Stand 1.7.2006) nach Vertragswert mit Minimum und Maximum je Zeile, exkl. Mehrwertsteuer; die obere Grenze jeder Zeile gehört noch dazu.', regel: { typ: 'staffel_rahmen', baender: [
    { grenzeChf: 100000, minChf: 715, maxChf: 925 }, { grenzeChf: 200000, minChf: 1015, maxChf: 1425 }, { grenzeChf: 300000, minChf: 1305, maxChf: 1905 },
    { grenzeChf: 400000, minChf: 1585, maxChf: 2365 }, { grenzeChf: 500000, minChf: 1865, maxChf: 2825 }, { grenzeChf: 600000, minChf: 2075, maxChf: 3175 },
    { grenzeChf: 700000, minChf: 2285, maxChf: 3525 }, { grenzeChf: 800000, minChf: 2495, maxChf: 3875 }, { grenzeChf: 900000, minChf: 2705, maxChf: 4225 },
    { grenzeChf: 1000000, minChf: 2915, maxChf: 4575 }, { grenzeChf: 1100000, minChf: 3065, maxChf: 4845 }, { grenzeChf: 1200000, minChf: 3215, maxChf: 5115 },
    { grenzeChf: 1300000, minChf: 3365, maxChf: 5385 }, { grenzeChf: 1400000, minChf: 3515, maxChf: 5655 }, { grenzeChf: 1500000, minChf: 3665, maxChf: 5925 },
    { grenzeChf: 1600000, minChf: 3855, maxChf: 6215 }, { grenzeChf: 1700000, minChf: 4045, maxChf: 6505 }, { grenzeChf: 1800000, minChf: 4235, maxChf: 6795 },
    { grenzeChf: 1900000, minChf: 4425, maxChf: 7085 }, { grenzeChf: 2000000, minChf: 4615, maxChf: 7375 }, { grenzeChf: 3000000, minChf: 5865, maxChf: 9525 },
    { grenzeChf: 4000000, minChf: 7115, maxChf: 11675 }, { grenzeChf: 5000000, minChf: 8365, maxChf: 13825 }, { grenzeChf: 6000000, minChf: 9265, maxChf: 15225 },
    { grenzeChf: 7000000, minChf: 10165, maxChf: 16625 }, { grenzeChf: 8000000, minChf: 11065, maxChf: 18025 }, { grenzeChf: 9000000, minChf: 11965, maxChf: 19425 },
    { grenzeChf: 10000000, minChf: 12865, maxChf: 20825 }, { grenzeChf: 11000000, minChf: 13465, maxChf: 21825 }, { grenzeChf: 12000000, minChf: 14065, maxChf: 22825 },
    { grenzeChf: 13000000, minChf: 14665, maxChf: 23825 }, { grenzeChf: 14000000, minChf: 15265, maxChf: 24825 }, { grenzeChf: 15000000, minChf: 15865, maxChf: 25825 },
    { grenzeChf: 16000000, minChf: 16465, maxChf: 26825 }, { grenzeChf: 17000000, minChf: 17065, maxChf: 27825 }, { grenzeChf: 18000000, minChf: 17665, maxChf: 28825 },
    { grenzeChf: 19000000, minChf: 18265, maxChf: 29825 }, { grenzeChf: 20000000, minChf: 18865, maxChf: 30825 }, { grenzeChf: INF, minChf: 18865, maxChf: 30825, hinweis: 'Anhang 1 endet bei CHF 20 Mio.; darüber wird hier die Zeile von CHF 20 Mio. angesetzt, die Festsetzung liegt im Ermessen des Notars.' },
  ] } },
  LU: { kanton: 'LU', erlassName: 'Beurkundungsgebührenverordnung (BeurkGebV)', erlassNr: 'SRL Nr. 258', artikel: '§ 21 Abs. 1', stand: '1.1.2022', verifiziert: R, quelleUrl: 'https://srl.lu.ch/app/de/texts_of_law/258', hinweis: 'Tarif fix (§ 10: kein Über-/Unterschreiten). >10 Mio gebührenfrei.', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 500000, sockelChf: 0, abChf: 0, prozent: 0.3, minChf: 500 },
    { bisChf: 1000000, sockelChf: 1500, abChf: 500000, prozent: 0.25 },
    { bisChf: 5000000, sockelChf: 2750, abChf: 1000000, prozent: 0.2 },
    { bisChf: 10000000, sockelChf: 10750, abChf: 5000000, prozent: 0.1, maxChf: 15750 },
    { bisChf: INF, sockelChf: 15750, abChf: 10000000, prozent: 0, maxChf: 15750 },
  ] } },
  UR: urOhneAmtlichenTarif(),
  SZ: { kanton: 'SZ', erlassName: 'Gebührentarif Notare/Grundbuchverwalter', erlassNr: 'SRSZ 213.512', artikel: '§ 5 Abs. 1 Nr. 1', stand: '1.2.2021', verifiziert: R, quelleUrl: 'https://www.sz.ch/public/upload/assets/7361/213_512.pdf', hinweis: 'CHF 45 je (auch angefangene) CHF 50’000 (≈ 0,9‰); bei Werten über 10 Mio. wird die Gebühr auf dem Mehrbetrag um 50 % reduziert, höchstens 13’500. QS-GP 2.7.2026: −50 %-Degression >10 Mio. am amtlichen PDF verifiziert und ergänzt. HINWEIS: die Tranchen-Aufrundung «je CHF 50’000 bzw. Bruchteile davon» (Aufrundung auf die nächsten 50’000) ist noch flach als Promille angenähert.', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 10000000, sockelChf: 0, abChf: 0, prozent: 0.09, maxChf: 13500 },
    { bisChf: INF, sockelChf: 9000, abChf: 10000000, prozent: 0.045, maxChf: 13500 },
  ] } },
  OW: { kanton: 'OW', erlassName: 'Verordnung über die Beurkundungsgebühren', erlassNr: 'GDB 210.32', artikel: 'Art. 10 Ziff. 12', stand: '1.1.2013', verifiziert: R, quelleUrl: 'https://gdb.ow.ch/app/de/texts_of_law/210.32', hinweis: 'Freies Notariat; Erhöhung max. +50 % (Art. 4).', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 300000, sockelChf: 0, abChf: 0, prozent: 0.3, minChf: 600 },
    { bisChf: 600000, sockelChf: 900, abChf: 300000, prozent: 0.2 },
    { bisChf: INF, sockelChf: 1500, abChf: 600000, prozent: 0.1 },
  ] } },
  NW: { kanton: 'NW', erlassName: 'Beurkundungsgebührenverordnung', erlassNr: 'NG 268.12', artikel: '§ 20', stand: '1.1.2016', verifiziert: R, quelleUrl: 'https://gesetze.nw.ch/app/de/texts_of_law/268.12', hinweis: 'Amtsnotariat.', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 200000, sockelChf: 0, abChf: 0, prozent: 0.25, minChf: 300 },
    { bisChf: 500000, sockelChf: 500, abChf: 200000, prozent: 0.2 },
    { bisChf: 1000000, sockelChf: 1100, abChf: 500000, prozent: 0.15 },
    { bisChf: 5000000, sockelChf: 1850, abChf: 1000000, prozent: 0.1 },
    { bisChf: INF, sockelChf: 5850, abChf: 5000000, prozent: 0.05 },
  ] } },
  GL: { kanton: 'GL', erlassName: 'Verordnung über Beurkundung und Beglaubigung (Gebührentarif)', erlassNr: 'GS III B/3/2', artikel: 'Anhang Art. A1-1 Ziff. 1', stand: '1.1.2009', verifiziert: R, quelleUrl: 'https://gesetze.gl.ch/app/de/texts_of_law/III%20B%2F3%2F2', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 200000, sockelChf: 0, abChf: 0, prozent: 0.3, minChf: 400 },
    { bisChf: 500000, sockelChf: 600, abChf: 200000, prozent: 0.2 },
    { bisChf: 5000000, sockelChf: 1200, abChf: 500000, prozent: 0.1 },
    { bisChf: INF, sockelChf: 5700, abChf: 5000000, prozent: 0.05 },
  ] } },
  ZG: { kanton: 'ZG', erlassName: 'Verwaltungsgebührentarif', erlassNr: 'BGS 641.1', artikel: '§ 9 Abschn. J Ziff. 89', stand: '22.8.2025', verifiziert: R, quelleUrl: 'https://bgs.zg.ch/app/de/texts_of_law/641.1', hinweis: 'Aufwandbasiert (kein Promille seit 2019); +10–50 % bei Mehraufwand.', regel: { typ: 'rahmen', vonChf: 300, bisChf: 4000 } },
  FR: { kanton: 'FR', erlassName: 'Tarif des émoluments des notaires', erlassNr: 'RSF 261.16', artikel: 'Art. 4 al. 1 ch. 1bis', stand: '1.7.2016', verifiziert: R, quelleUrl: 'https://bdlf.fr.ch/app/fr/texts_of_law/261.16', hinweis: 'Pflichttarif des freien Notariats für Verkauf, Tausch und Schenkung von Grundstücken: kumulative Staffel mit Minimum CHF 150 und Höchstbetrag CHF 10’000 (Fassung vom 1.7.2016).', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 5000, sockelChf: 150, abChf: 0, prozent: 0 },
    { bisChf: 20000, sockelChf: 150, abChf: 5000, prozent: 0.7 },
    { bisChf: 50000, sockelChf: 255, abChf: 20000, prozent: 0.5 },
    { bisChf: 200000, sockelChf: 405, abChf: 50000, prozent: 0.3 },
    { bisChf: 2000000, sockelChf: 855, abChf: 200000, prozent: 0.2 },
    { bisChf: 5000000, sockelChf: 4455, abChf: 2000000, prozent: 0.1 },
    { bisChf: INF, sockelChf: 7455, abChf: 5000000, prozent: 0.05, maxChf: 10000 },
  ] } },
  SO: { kanton: 'SO', erlassName: 'Gebührentarif (GT)', erlassNr: 'BGS 615.11', artikel: '§ 25 Abs. 1 lit. a', stand: '1.3.2026', verifiziert: R, quelleUrl: 'https://bgs.so.ch/app/de/texts_of_law/615.11', hinweis: 'Gebührenrahmen CHF 100 bis 10’000 für Kauf-, Tausch- und Schenkungsvertrag einschliesslich Grundbucheintrag (kein gesetzliches Promille).', regel: { typ: 'rahmen', vonChf: 100, bisChf: 10000 } },
  BS: { kanton: 'BS', erlassName: 'Notariatstarif', erlassNr: 'SG 292.400', artikel: '§ 11 Abs. 1 Ziff. 17', stand: '1.7.2016', verifiziert: R, quelleUrl: 'https://www.gesetzessammlung.bs.ch/app/de/texts_of_law/292.400', hinweis: 'Freies Notariat; bis ½ reduzierbar bei eigenem Vorvertrag. 0,25% bis 2 Mio. (min. 500), Mehrbetrag über 2 Mio. 0,2%, über 5 Mio. 0,1%, über 10 Mio. 0,075%, höchstens 50’000. QS-GP 2.7.2026: Degressionsbänder >5/>10 Mio. am amtlichen Tarif-PDF (Version 3875) verifiziert — vorher fehlten sie.', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 2000000, sockelChf: 0, abChf: 0, prozent: 0.25, minChf: 500, maxChf: 50000 },
    { bisChf: 5000000, sockelChf: 5000, abChf: 2000000, prozent: 0.2, minChf: 500, maxChf: 50000 },
    { bisChf: 10000000, sockelChf: 11000, abChf: 5000000, prozent: 0.1, minChf: 500, maxChf: 50000 },
    { bisChf: INF, sockelChf: 16000, abChf: 10000000, prozent: 0.075, minChf: 500, maxChf: 50000 },
  ] } },
  BL: { kanton: 'BL', erlassName: 'Verordnung über die Notariatsgebühren (NotGebV)', erlassNr: 'SGS 217.13', artikel: '§ 9 Abs. 1 lit. d', stand: '1.11.2012', verifiziert: R, quelleUrl: 'https://bl.clex.ch/app/de/texts_of_law/217.13', hinweis: 'Freies Notariat; aufwandbasierte Rahmengebühr (kein Promille), kaufpreis-unabhängig (+MwSt).', regel: { typ: 'rahmen', vonChf: 800, bisChf: 2500 } },
  SH: { kanton: 'SH', erlassName: 'Grundbuchgebührenverordnung', erlassNr: 'SHR 211.433', artikel: '§ 13 Abs. 1 Ziff. 1', stand: '1.1.2011', verifiziert: R, quelleUrl: 'https://rechtsbuch.sh.ch/app/de/texts_of_law/211.433', hinweis: 'Amtsnotariat (Beurkundung durch Grundbuchamt).', regel: { typ: 'promille', promille: 1, minChf: 50 } },
  AR: { kanton: 'AR', erlassName: 'Gebührentarif für die Gemeinden', erlassNr: 'bGS 153.2', artikel: 'Anhang Ziff. 8.1 lit. a', stand: '1.1.2018', verifiziert: R, quelleUrl: 'https://ar.clex.ch/api/de/versions/1203/pdf_file', hinweis: 'Amtsnotariat; Beurkundung INKL. Grundbucheintrag kombiniert (½‰ bei Erbgang).', regel: { typ: 'promille', promille: 1, minChf: 200, maxChf: 4000 } },
  AI: { kanton: 'AI', erlassName: 'Gebührentarif (GebT)', erlassNr: 'GS 172.513', artikel: 'Art. 14 Abs. 2 Ziff. 1', stand: '1.1.2026', verifiziert: R, quelleUrl: 'https://ai.clex.ch/app/de/texts_of_law/172.513', hinweis: 'Amtsnotariat; Bemessung Handänderungswert.', regel: { typ: 'promille', promille: 1, minChf: 60 } },
  SG: { kanton: 'SG', erlassName: 'Verordnung über die Gebühren für Amtshandlungen der Grundbuchämter (GB-GebV)', erlassNr: 'sGS 914.5', artikel: 'Art. 8 Nr. 20.01 i.V.m. Art. 5 Abs. 1 (Verdoppelung des Eintragungsansatzes bei Beurkundung durch den Grundbuchverwalter)', stand: '1.6.2020', verifiziert: R, quelleUrl: 'https://www.gesetzessammlung.sg.ch/app/de/texts_of_law/914.5', hinweis: 'Amtsnotariat: Beurkundung durch die/den Grundbuchverwalter/in. Nach Art. 5 Abs. 1 GB-GebV wird der Eintragungsansatz (Nr. 20.01: 2‰ bis 2 Mio., 0,5‰ darüber, Rahmen 200–10’000) verdoppelt; hier trägt der Beurkundungs-Posten den einfachen Eintragungsansatz, der zusammen mit dem Grundbuch-Posten die Verdoppelung ergibt. QS-GP 2.7.2026: früher fälschlich nach aufgehobenem Tarif (Nr. 60.01.01/0.2) berechnet — Art. 8 Nr. 20.01 + Art. 5 am amtlichen GB-GebV-PDF (Version 2935, Stand 1.6.2020) verifiziert.', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 2000000, sockelChf: 0, abChf: 0, prozent: 0.2, minChf: 200, maxChf: 10000 },
    { bisChf: INF, sockelChf: 4000, abChf: 2000000, prozent: 0.05, minChf: 200, maxChf: 10000 },
  ] } },
  GR: { kanton: 'GR', erlassName: 'Verordnung über die Notariatsgebühren (NotGebV)', erlassNr: 'BR 210.370', artikel: 'Art. 16 Abs. 1 lit. a', stand: '1.1.2024', verifiziert: R, quelleUrl: 'https://www.gr-lex.gr.ch/app/de/texts_of_law/210.370', hinweis: 'Gemischt; zzgl. MwSt./Auslagen.', regel: { typ: 'promille', promille: 1, minChf: 100, maxChf: 15000 } },
  AG: { kanton: 'AG', erlassName: 'Dekret über den Notariatstarif', erlassNr: 'SAR 295.250', artikel: '§ 2 Abs. 1', stand: '1.1.2025', verifiziert: R, quelleUrl: 'https://gesetzessammlungen.ag.ch/app/de/texts_of_law/295.250', hinweis: 'Freiberufliches Notariat (+MwSt § 9).', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 600000, sockelChf: 0, abChf: 0, prozent: 0.4, minChf: 300 },
    { bisChf: 3000000, sockelChf: 2400, abChf: 600000, prozent: 0.2 },
    { bisChf: INF, sockelChf: 7200, abChf: 3000000, prozent: 0.1, maxChf: 20000 },
  ] } },
  TG: { kanton: 'TG', erlassName: 'Gesetz über Gebühren der Grundbuchämter und Notariate (GGG)', erlassNr: 'RB 632.1', artikel: '§ 14 Abs. 1', stand: '1.1.2016', verifiziert: R, quelleUrl: 'https://www.rechtsbuch.tg.ch/app/de/texts_of_law/632.1', hinweis: 'Amtsnotariat/Mischform (+MwSt).', regel: { typ: 'promille', promille: 1, minChf: 100, maxChf: 5000 } },
  TI: { kanton: 'TI', erlassName: 'Legge sulla tariffa notarile', erlassNr: 'RL 952.300', artikel: 'Art. 5 cpv. 1', stand: '1.7.2015', verifiziert: R, quelleUrl: 'https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/pdfatto/atto/148', hinweis: 'Höchsttarif (Notar darf unterschreiten, Art. 1 cpv. 5).', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 250000, sockelChf: 0, abChf: 0, prozent: 0.5, minChf: 500 },
    { bisChf: 500000, sockelChf: 1250, abChf: 250000, prozent: 0.4 },
    { bisChf: 750000, sockelChf: 2250, abChf: 500000, prozent: 0.35 },
    { bisChf: 1000000, sockelChf: 3125, abChf: 750000, prozent: 0.3 },
    { bisChf: 2000000, sockelChf: 3875, abChf: 1000000, prozent: 0.25 },
    { bisChf: 5000000, sockelChf: 6375, abChf: 2000000, prozent: 0.2 },
    { bisChf: 10000000, sockelChf: 12375, abChf: 5000000, prozent: 0.1 },
    { bisChf: 50000000, sockelChf: 17375, abChf: 10000000, prozent: 0.05 },
    { bisChf: INF, sockelChf: 37375, abChf: 50000000, prozent: 0 },
  ] } },
  VD: { kanton: 'VD', erlassName: 'Tarif des notaires (TNo)', erlassNr: 'BLV 178.11.2', artikel: 'Art. 14 al. 1', stand: '1.3.2016', verifiziert: R, quelleUrl: 'https://www.lexfind.ch/tolv/210344/fr', hinweis: 'Freies Notariat, Basistarif für Handänderungen mit sofortiger Ausführung (Art. 14 al. 1) mit Minimum CHF 300; Fassung in Kraft seit 1.3.2016, die Fortgeltung über den Abrufstand vom 11.11.2021 hinaus ist am Portal des Kantons Waadt noch nicht bestätigt.', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 100000, sockelChf: 0, abChf: 0, prozent: 0.7, minChf: 300 },
    { bisChf: 300000, sockelChf: 700, abChf: 100000, prozent: 0.4 },
    { bisChf: 500000, sockelChf: 1500, abChf: 300000, prozent: 0.25 },
    { bisChf: 750000, sockelChf: 2000, abChf: 500000, prozent: 0.2 },
    { bisChf: 1000000, sockelChf: 2500, abChf: 750000, prozent: 0.15 },
    { bisChf: 2500000, sockelChf: 2875, abChf: 1000000, prozent: 0.15 },
    { bisChf: 10000000, sockelChf: 5125, abChf: 2500000, prozent: 0.1 },
    { bisChf: 20000000, sockelChf: 12625, abChf: 10000000, prozent: 0.05 },
    { bisChf: INF, sockelChf: 17625, abChf: 20000000, prozent: 0.025 },
  ] } },
  VS: { kanton: 'VS', erlassName: 'Tarif des émoluments des notaires', erlassNr: 'RS 178.104', artikel: 'Art. 13 al. 1', stand: '1.1.2011', verifiziert: R, quelleUrl: 'https://lex.vs.ch/app/fr/texts_of_law/178.104', hinweis: 'Freies Notariat, kumulative Staffel für den Grundstückkauf (Art. 11 al. 1 let. d ch. 1) mit Minimum CHF 200 und ohne Höchstbetrag, zuzüglich Mehrwertsteuer.', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 5000, sockelChf: 200, abChf: 0, prozent: 0, minChf: 200 },
    { bisChf: 200000, sockelChf: 200, abChf: 5000, prozent: 0.5 },
    { bisChf: 500000, sockelChf: 1175, abChf: 200000, prozent: 0.4 },
    { bisChf: 1000000, sockelChf: 2375, abChf: 500000, prozent: 0.3 },
    { bisChf: 10000000, sockelChf: 3875, abChf: 1000000, prozent: 0.2 },
    { bisChf: INF, sockelChf: 21875, abChf: 10000000, prozent: 0.1 },
  ] } },
  NE: { kanton: 'NE', erlassName: 'Arrêté fixant le tarif des émoluments des notaires', erlassNr: 'RSN 166.31', artikel: 'Art. 14 ch. 54', stand: '13.5.2015', verifiziert: R, quelleUrl: 'https://rsn.ne.ch/DATA/program/books/RSN2015/20154/htm/16631.htm', hinweis: 'Freies Notariat, feste Pauschale je Preistranche für die Vente immobilière (Art. 14 ch. 54, Stand 13.5.2015), exkl. Mehrwertsteuer; die obere Grenze jeder Tranche gehört noch dazu, ab CHF 8’000’001 gilt CHF 10’000.', regel: { typ: 'staffel_inklusiv', baender: [
    { bisChf: 100000, chf: 800 }, { bisChf: 200000, chf: 1100 }, { bisChf: 300000, chf: 1400 }, { bisChf: 400000, chf: 1650 }, { bisChf: 500000, chf: 1900 },
    { bisChf: 600000, chf: 2150 }, { bisChf: 700000, chf: 2350 }, { bisChf: 800000, chf: 2550 }, { bisChf: 900000, chf: 2750 }, { bisChf: 1000000, chf: 2950 },
    { bisChf: 1100000, chf: 3100 }, { bisChf: 1200000, chf: 3250 }, { bisChf: 1300000, chf: 3400 }, { bisChf: 1400000, chf: 3550 }, { bisChf: 1500000, chf: 3700 },
    { bisChf: 1600000, chf: 3850 }, { bisChf: 1700000, chf: 4000 }, { bisChf: 1800000, chf: 4150 }, { bisChf: 1900000, chf: 4300 }, { bisChf: 2000000, chf: 4450 },
    { bisChf: 2100000, chf: 4600 }, { bisChf: 2200000, chf: 4750 }, { bisChf: 2300000, chf: 4900 }, { bisChf: 2400000, chf: 5000 }, { bisChf: 2500000, chf: 5100 },
    { bisChf: 2600000, chf: 5200 }, { bisChf: 2700000, chf: 5300 }, { bisChf: 2800000, chf: 5400 }, { bisChf: 2900000, chf: 5500 }, { bisChf: 3000000, chf: 5600 },
    { bisChf: 3500000, chf: 6000 }, { bisChf: 4000000, chf: 6400 }, { bisChf: 4500000, chf: 6800 }, { bisChf: 5000000, chf: 7200 }, { bisChf: 5500000, chf: 7600 },
    { bisChf: 6000000, chf: 8000 }, { bisChf: 6500000, chf: 8400 }, { bisChf: 7000000, chf: 8800 }, { bisChf: 7500000, chf: 9200 }, { bisChf: 8000000, chf: 9600 },
    { bisChf: INF, chf: 10000 },
  ] } },
  GE: { kanton: 'GE', erlassName: 'Règlement sur les émoluments des notaires (REmNot)', erlassNr: 'RSG E 6 05.03', artikel: 'Art. 10 al. 1 i.V.m. Art. 2 al. 2', stand: '30.4.2015', verifiziert: R, quelleUrl: 'https://silgeneve.ch/legis/program/books/rsg/htm/rsg_e6_05p03.htm', hinweis: 'Freies Notariat, tranchenweise Staffel von 7‰ bis 0,5‰ mit Minimum CHF 200 und ohne Höchstbetrag (Art. 10 al. 1, Stand 30.4.2015); bei Verkäufen an die öffentliche Hand gilt nach Art. 11 die Hälfte, was hier nicht abgebildet ist.', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 200000, sockelChf: 0, abChf: 0, prozent: 0.7, minChf: 200 },
    { bisChf: 400000, sockelChf: 1400, abChf: 200000, prozent: 0.6 },
    { bisChf: 800000, sockelChf: 2600, abChf: 400000, prozent: 0.45 },
    { bisChf: 1000000, sockelChf: 4400, abChf: 800000, prozent: 0.4 },
    { bisChf: 1500000, sockelChf: 5200, abChf: 1000000, prozent: 0.35 },
    { bisChf: 2000000, sockelChf: 6950, abChf: 1500000, prozent: 0.3 },
    { bisChf: 3500000, sockelChf: 8450, abChf: 2000000, prozent: 0.25 },
    { bisChf: 5000000, sockelChf: 12200, abChf: 3500000, prozent: 0.2 },
    { bisChf: 7500000, sockelChf: 15200, abChf: 5000000, prozent: 0.15 },
    { bisChf: 10000000, sockelChf: 18950, abChf: 7500000, prozent: 0.1 },
    { bisChf: 20000000, sockelChf: 21450, abChf: 10000000, prozent: 0.075 },
    { bisChf: INF, sockelChf: 28950, abChf: 20000000, prozent: 0.05 },
  ] } },
  JU: { kanton: 'JU', erlassName: 'Décret fixant les émoluments des notaires', erlassNr: 'RSJU 189.61', artikel: 'Art. 9 al. 1', stand: '1.1.2005', verifiziert: R, quelleUrl: 'https://rsju.jura.ch/fr/viewdocument.html?idn=20029&id=37829&download=1', hinweis: 'Freies Notariat, degressive Staffel von 7‰ bis 0,5‰ mit Minimum CHF 200 und Höchstbetrag CHF 15’000 in Franken (Art. 9 al. 1).', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 100000, sockelChf: 0, abChf: 0, prozent: 0.7, minChf: 200, maxChf: 15000 },
    { bisChf: 300000, sockelChf: 700, abChf: 100000, prozent: 0.5, maxChf: 15000 },
    { bisChf: 500000, sockelChf: 1700, abChf: 300000, prozent: 0.35, maxChf: 15000 },
    { bisChf: 750000, sockelChf: 2400, abChf: 500000, prozent: 0.25, maxChf: 15000 },
    { bisChf: 1000000, sockelChf: 3025, abChf: 750000, prozent: 0.2, maxChf: 15000 },
    { bisChf: 2500000, sockelChf: 3525, abChf: 1000000, prozent: 0.15, maxChf: 15000 },
    { bisChf: 10000000, sockelChf: 5775, abChf: 2500000, prozent: 0.1, maxChf: 15000 },
    { bisChf: INF, sockelChf: 13275, abChf: 10000000, prozent: 0.05, maxChf: 15000 },
  ] } },
};

// ─── 2. Grundbuchgebühr Eigentumsübertragung (über Kaufpreis) ───────────────
export const GRUNDBUCH: Record<KantonCode, KantonalerTarif> = {
  ZH: { kanton: 'ZH', erlassName: 'Notariatsgebührenverordnung (NotGebV)', erlassNr: 'LS 243', artikel: 'Anhang Ziff. 2.2.1', stand: '1.1.2024', verifiziert: R, quelleUrl: 'https://www.zh.ch/de/politik-staat/gesetze-beschluesse/gesetzessammlung/zhlex-ls/erlass-243-2009_03_09-2009_07_01-123.html', regel: { typ: 'promille', promille: 1, minChf: 100 } },
  BE: { kanton: 'BE', erlassName: 'Gebührenverordnung (GebV)', erlassNr: 'BSG 154.21', artikel: 'Anhang 4B Ziff. 3.1.1', stand: '1.9.2026', verifiziert: R, quelleUrl: 'https://www.belex.sites.be.ch/app/de/texts_of_law/154.21', hinweis: 'Fix 200 Taxpunkte (1 TP = CHF 1; −20 % elektronisch), KEIN Promille.', regel: { typ: 'fix', chf: 200 } },
  LU: { kanton: 'LU', erlassName: 'Grundbuchgebührentarif (GBGT)', erlassNr: 'SRL Nr. 228', artikel: '§ 2 Abs. 1 Ziff. 1', stand: '1.1.2026', verifiziert: R, quelleUrl: 'https://srl.lu.ch/app/de/texts_of_law/228', hinweis: 'Halber Ansatz bei Ehegatten/Verwandten (§ 2 I Ziff. 2).', regel: { typ: 'promille', promille: 2, minChf: 100 } },
  UR: { kanton: 'UR', erlassName: 'Grundbuchgebührentarif (Justizdirektion)', erlassNr: 'RB 3.2521 / 9.3408', artikel: 'Art. 2 Abs. 1+3', stand: '1.1.2025', verifiziert: R, quelleUrl: 'https://www.ur.ch/online-schalter/2127/download', regel: { typ: 'promille', promille: 2, minChf: 50, maxChf: 10000 } },
  SZ: { kanton: 'SZ', erlassName: 'Gebührentarif Notare/Grundbuchverwalter', erlassNr: 'SRSZ 213.512', artikel: '§ 5 Abs. 1 Nr. 5/6/15', stand: '1.2.2021', verifiziert: R, quelleUrl: 'https://www.sz.ch/public/upload/assets/7361/213_512.pdf', hinweis: 'Eintragung pauschal CHF 8 + Blatt-Anlage 35 + Publikation 20; Wertbasis liegt im Notariatsposten.', regel: { typ: 'fix', chf: 63 } },
  OW: { kanton: 'OW', erlassName: 'Grundbuchgebührentarif', erlassNr: 'GDB 213.61', artikel: 'Art. 6 Abs. 1', stand: '1.1.2022', verifiziert: R, quelleUrl: 'https://gdb.ow.ch/app/de/texts_of_law/213.61', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 1000000, sockelChf: 0, abChf: 0, prozent: 0.15, minChf: 100 },
    { bisChf: INF, sockelChf: 1500, abChf: 1000000, prozent: 0.1, maxChf: 15000 },
  ] } },
  NW: { kanton: 'NW', erlassName: 'Gebührenverordnung', erlassNr: 'NG 265.51', artikel: 'Tarif-Nr. 2.6.1.1', stand: '1.1.2025', verifiziert: R, quelleUrl: 'https://gesetze.nw.ch/app/de/texts_of_law/265.51', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 3000000, sockelChf: 0, abChf: 0, prozent: 0.1, minChf: 200, maxChf: 8000 },
    { bisChf: INF, sockelChf: 3000, abChf: 3000000, prozent: 0.05, maxChf: 8000 },
  ] } },
  GL: { kanton: 'GL', erlassName: 'Gebührentarif zum ZGB (GebT ZGB)', erlassNr: 'GS III B/7/1', artikel: 'Art. 13 Abs. 1 Bst. a', stand: '1.1.2026', verifiziert: R, quelleUrl: 'https://gesetze.gl.ch/app/de/texts_of_law/III%20B%2F7%2F1', hinweis: 'Faktischer Ersatz für fehlende Handänderungssteuer.', regel: { typ: 'promille', promille: 3.5, minChf: 100 } },
  ZG: { kanton: 'ZG', erlassName: 'Grundbuchgebührentarif', erlassNr: 'BGS 215.35', artikel: '§ 13 / § 14 Abs. 1 Bst. a', stand: '1.1.2019', verifiziert: R, quelleUrl: 'https://bgs.zg.ch/app/de/texts_of_law/215.35', hinweis: 'Zeitaufwand × CHF 180/h × Faktor 4, bis ~CHF 6’000 (kein kaufpreisproportionaler Betrag).', regel: { typ: 'rahmen', vonChf: 200, bisChf: 6000 } },
  FR: { kanton: 'FR', erlassName: 'Tarif des émoluments fixes du registre foncier', erlassNr: 'RSF 214.5.16', artikel: 'Art. 2 ch. 6', stand: '1.12.2018', verifiziert: R, quelleUrl: 'https://bdlf.fr.ch/app/fr/texts_of_law/214.5.16', hinweis: 'Fix CHF 120 (1–10 Grundstücke); proportionale Last liegt in der Handänderungssteuer.', regel: { typ: 'fix', chf: 120 } },
  SO: { kanton: 'SO', erlassName: 'Gebührentarif (GT)', erlassNr: 'BGS 615.11', artikel: '§ 25 Abs. 1 lit. a', stand: '1.3.2026', verifiziert: R, quelleUrl: 'https://bgs.so.ch/app/de/texts_of_law/615.11', hinweis: 'Beurkundung und Eintrag sind eine Gebühr nach § 25 Abs. 1 lit. a GT und im Notariatsposten enthalten.', regel: { typ: 'fix', chf: 0 } },
  BS: { kanton: 'BS', erlassName: 'Verordnung zum EG ZGB', erlassNr: 'SG 211.110', artikel: '§ 51', stand: '1.5.2025', verifiziert: R, quelleUrl: 'https://www.gesetzessammlung.bs.ch/app/de/texts_of_law/211.110', hinweis: 'Promille gemäss amtl. Merkblatt GVA; § 51-Volltext im Doppelcheck gegenlesen.', regel: { typ: 'promille', promille: 1, minChf: 200, maxChf: 50000 } },
  BL: { kanton: 'BL', erlassName: 'Verordnung über die Gebühren zum Zivilrecht (GebV)', erlassNr: 'SGS 211.71', artikel: '§ 16 Ziff. 1 lit. d', stand: '1.1.2013', verifiziert: R, quelleUrl: 'https://bl.clex.ch/app/de/texts_of_law/211.71', hinweis: 'Fix CHF 300 (+80 Handänderungsanzeige), kaufpreis-unabhängig.', regel: { typ: 'fix', chf: 300 } },
  SH: { kanton: 'SH', erlassName: 'Grundbuchgebührenverordnung', erlassNr: 'SHR 211.433', artikel: '§ 14 Abs. 1 Ziff. 1', stand: '1.1.2011', verifiziert: R, quelleUrl: 'https://rechtsbuch.sh.ch/app/de/texts_of_law/211.433', hinweis: 'Ermässigt 3‰ Verwandte / 1‰ Ehe/Erbgang.', regel: { typ: 'promille', promille: 6, minChf: 50 } },
  AR: { kanton: 'AR', erlassName: 'Gebührentarif für die Gemeinden', erlassNr: 'bGS 153.2', artikel: 'Anhang Ziff. 8.1 lit. a', stand: '1.1.2018', verifiziert: R, quelleUrl: 'https://ar.clex.ch/api/de/versions/1203/pdf_file', hinweis: 'AR trennt Beurkundung und Eintrag nicht — der Grundbuchposten ist im Notariatsposten (kombiniert 1‰) bereits enthalten.', regel: { typ: 'fix', chf: 0 } },
  AI: { kanton: 'AI', erlassName: 'Gebührentarif (GebT)', erlassNr: 'GS 172.513', artikel: 'Art. 11 Abs. 1 Ziff. 1.1', stand: '1.1.2026', verifiziert: R, quelleUrl: 'https://ai.clex.ch/app/de/texts_of_law/172.513', regel: { typ: 'promille', promille: 1, minChf: 100 } },
  SG: { kanton: 'SG', erlassName: 'Verordnung über die Gebühren für Amtshandlungen der Grundbuchämter (GB-GebV)', erlassNr: 'sGS 914.5', artikel: 'Art. 8 Nr. 20.01', stand: '1.6.2020', verifiziert: R, quelleUrl: 'https://www.gesetzessammlung.sg.ch/app/de/texts_of_law/914.5', hinweis: 'Eintragung Eigentum (Nr. 20.01): 2‰ des Erwerbspreises bis 2 Mio., zuzüglich 0,5‰ darüber, Rahmen 200–10’000. QS-GP 2.7.2026: früher fälschlich nach aufgehobenem Tarif (Nr. 10.01, Knick bei 3 Mio., max 12’500) — Art. 8 Nr. 20.01 am amtlichen GB-GebV-PDF (Version 2935, Stand 1.6.2020) verifiziert.', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 2000000, sockelChf: 0, abChf: 0, prozent: 0.2, minChf: 200, maxChf: 10000 },
    { bisChf: INF, sockelChf: 4000, abChf: 2000000, prozent: 0.05, minChf: 200, maxChf: 10000 },
  ] } },
  GR: { kanton: 'GR', erlassName: 'Verordnung über die Gebühren der Grundbuchämter', erlassNr: 'BR 217.200', artikel: 'Art. 13 Abs. 1 lit. a', stand: '1.1.2025', verifiziert: R, quelleUrl: 'https://www.gr-lex.gr.ch/app/de/texts_of_law/217.200', regel: { typ: 'promille', promille: 1, minChf: 50, maxChf: 15000 } },
  AG: { kanton: 'AG', erlassName: 'Gesetz über die Grundbuchabgaben (GBAG)', erlassNr: 'SAR 725.100', artikel: '§ 8 Abs. 1', stand: '1.1.2020', verifiziert: R, quelleUrl: 'https://gesetzessammlungen.ag.ch/app/de/texts_of_law/725.100', hinweis: 'Grundbuchabgabe (Gemengsteuer); ersetzt eine separate Handänderungssteuer. Solidarisch (§ 5).', regel: { typ: 'promille', promille: 4, minChf: 100 } },
  TG: { kanton: 'TG', erlassName: 'Gesetz über Gebühren der Grundbuchämter und Notariate (GGG)', erlassNr: 'RB 632.1', artikel: '§ 14 Abs. 2 Ziff. 1', stand: '1.1.2016', verifiziert: R, quelleUrl: 'https://www.rechtsbuch.tg.ch/app/de/texts_of_law/632.1', hinweis: 'Sonderfälle 1‰ (Erbgang/Ehegatten, max. 2’000).', regel: { typ: 'promille', promille: 4, minChf: 100, maxChf: 20000 } },
  TI: { kanton: 'TI', erlassName: 'Legge sulle tasse e gli emolumenti del registro fondiario (LTORF)', erlassNr: 'RL 216.200', artikel: 'Art. 11 cpv. 1', stand: '1.1.2017', verifiziert: R, quelleUrl: 'https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/pdfatto/atto/181', hinweis: '11‰ (Wert < 2 Mio) / 13‰ (> 2 Mio) auf Gesamtwert; erfüllt zugleich die Handänderungs-Funktion (Reduktion 1/8 Ehegatten/Erbgang, Art. 12).', regel: { typ: 'staffel_voll_prozent', baender: [
    { bisChf: 2000000, fixChf: 0, prozent: 1.1 },
    { bisChf: INF, fixChf: 0, prozent: 1.3 },
  ] } },
  VD: { kanton: 'VD', erlassName: 'Loi sur le registre foncier (LRF)', erlassNr: 'BLV 211.61', artikel: 'Art. 26', stand: '1.1.2018', verifiziert: R, quelleUrl: 'https://www.lexfind.ch/tolv/200292/fr', regel: { typ: 'promille', promille: 1.5, minChf: 100, maxChf: 20000 } },
  VS: { kanton: 'VS', erlassName: 'Ordonnance cantonale sur le registre foncier (OcRF)', erlassNr: 'RS 211.611', artikel: 'Art. 32 al. 2 let. a OcRF', stand: '01.10.2025', verifiziert: R, quelleUrl: 'https://lex.vs.ch/app/fr/texts_of_law/211.611', hinweis: 'Eintragungsgebühr Grundeigentum: 2‰, mindestens 100 / höchstens 5’000 CHF (Deckel greift ab 2,5 Mio.); Bemessungsbasis auf den nächsten Tausender aufgerundet (al. 3). QS-GP 2.7.2026: min/max am amtlichen OcRF-PDF (lex.vs.ch/api/fr/versions/3515) verifiziert — vorher fälschlich 50/3000.', regel: { typ: 'promille', promille: 2, minChf: 100, maxChf: 5000 } },
  NE: { kanton: 'NE', erlassName: 'Loi sur l’émolument du registre foncier (LERF)', erlassNr: 'RSN 215.411.6', artikel: 'Art. 9 al. 2', stand: '1.8.2013', verifiziert: R, quelleUrl: 'https://rsn.ne.ch/DATA/program/books/RSN2016/20163/htm/2154116.htm', hinweis: '1,5‰ bis 800k, 0,8‰ auf Überschuss.', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 800000, sockelChf: 0, abChf: 0, prozent: 0.15, minChf: 50 },
    { bisChf: INF, sockelChf: 1200, abChf: 800000, prozent: 0.08 },
  ] } },
  GE: { kanton: 'GE', erlassName: 'Règlement émoluments registre foncier (REmORFDIT)', erlassNr: 'RSG E 1 50.06', artikel: 'Art. 3 al. 6', stand: '1.7.2011', verifiziert: R, quelleUrl: 'https://silgeneve.ch/legis/data/rsg_e1_50p06.htm', hinweis: '0,21 % (2,1‰), max. 40’000.', regel: { typ: 'promille', promille: 2.1, maxChf: 40000 } },
  JU: { kanton: 'JU', erlassName: 'Décret fixant les émoluments du registre foncier', erlassNr: 'RSJU 176.331', artikel: 'Art. 6', stand: '1.1.2017 (Punktwert 1.1.2025)', verifiziert: R, quelleUrl: 'https://rsju.jura.ch/fr/viewdocument.html?idn=20021&id=37773&download=1', hinweis: '1,5‰; min. 40 / max. 10’000 Punkte × Punktwert CHF 1.05 (Stand 2025, jährlich indexiert) ≈ CHF 42 / 10’500.', regel: { typ: 'promille', promille: 1.5, minChf: 42, maxChf: 10500 } },
};

// ─── 3. Grundpfand / Schuldbrief (Beurkundung + Eintrag, über Pfandsumme) ───
// Vereinfacht als Gesamt-Promille (Beurkundung + Eintrag) der Pfandsumme.
export const GRUNDPFAND: Record<KantonCode, KantonalerTarif> = {
  ZH: { kanton: 'ZH', erlassName: 'NotGebV', erlassNr: 'LS 243', artikel: 'Anhang Ziff. 1.2.1 + 2.3.1', stand: '1.1.2024', verifiziert: R, quelleUrl: 'https://www.zh.ch/de/politik-staat/gesetze-beschluesse/gesetzessammlung/zhlex-ls/erlass-243-2009_03_09-2009_07_01-123.html', hinweis: 'Beurkundung 1‰ + Eintrag 1‰.', regel: { typ: 'promille', promille: 2, minChf: 200 } },
  BE: { kanton: 'BE', erlassName: 'GebVN / GebV', erlassNr: 'BSG 169.81 / 154.21', artikel: 'Art. 18 / Anhang 4B Ziff. 3.3.1', stand: '1.3.2022', verifiziert: R, quelleUrl: 'https://www.belex.sites.be.ch/app/de/texts_of_law/169.81', regel: { typ: 'formel_extern', hinweis: 'Beurkundung nach Zeitaufwand (min. 200) + Eintrag 100 TP — KEIN Promille.' } },
  LU: { kanton: 'LU', erlassName: 'BeurkGebV / GBGT', erlassNr: 'SRL 258 / 228', artikel: '§ 29 / § 8', stand: '1.1.2026', verifiziert: R, quelleUrl: 'https://srl.lu.ch/app/de/texts_of_law/258', hinweis: 'Beurkundung Staffel (max. 7’125) + Eintrag 2‰ + Titel 40.', regel: { typ: 'promille', promille: 2, minChf: 350 } },
  UR: { kanton: 'UR', erlassName: 'Grundbuchgebührentarif (Tarifordnung der Justizdirektion Uri vom 4. Dezember 2024)', erlassNr: 'gestützt auf RB 3.2521 Art. 8a und RB 9.3408 Art. 2 Abs. 2', artikel: 'Grundbuchgebührentarif UR Art. 5 Abs. 1 und 2', stand: '4.12.2024', verifiziert: R, quelleUrl: 'https://www.ur.ch/online-schalter/2127/download', hinweis: 'Nur Eintragsgebühr (amtlicher Grundbuchgebührentarif); Beurkundung durch freies Notariat ohne amtlichen Tarif — beim Notariat erfragen.', regel: { typ: 'promille', promille: 2, minChf: 70, maxChf: 10000 } },
  SZ: { kanton: 'SZ', erlassName: 'Gebührentarif Notare/Grundbuchverwalter', erlassNr: 'SRSZ 213.512', artikel: '§ 5 Abs. 1 Nr. 2', stand: '1.2.2021', verifiziert: R, quelleUrl: 'https://www.sz.ch/public/upload/assets/7361/213_512.pdf', hinweis: 'CHF 45 je (auch angefangene) CHF 50’000 (≈ 0,9‰); bei Pfandsumme über 8 Mio. wird die Gebühr auf dem Mehrbetrag um 50 % reduziert, höchstens 10’350. QS-GP 2.7.2026: −50 %-Degression >8 Mio. am amtlichen PDF verifiziert und ergänzt (Tranchen-Aufrundung noch flach angenähert).', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 8000000, sockelChf: 0, abChf: 0, prozent: 0.09, maxChf: 10350 },
    { bisChf: INF, sockelChf: 7200, abChf: 8000000, prozent: 0.045, maxChf: 10350 },
  ] } },
  OW: { kanton: 'OW', erlassName: 'Beurkundungsgebühren / Grundbuchgebührentarif', erlassNr: 'GDB 210.32 / 213.61', artikel: 'Art. 10 Ziff. 23 / Art. 12', stand: '1.1.2022', verifiziert: R, quelleUrl: 'https://gdb.ow.ch/app/de/texts_of_law/213.61', hinweis: 'Beurkundung (min. 400) + Eintrag (max. 10’000).', regel: { typ: 'promille', promille: 3.5, minChf: 480 } },
  NW: { kanton: 'NW', erlassName: 'Beurkundungsgebühren / Gebührenverordnung', erlassNr: 'NG 268.12 / 265.51', artikel: '§ 28 / Tarif 2.6.3.1', stand: '1.1.2025', verifiziert: R, quelleUrl: 'https://gesetze.nw.ch/app/de/texts_of_law/265.51', hinweis: 'Beurkundung + Eintrag 2‰ (max. 8’000) + Ausfertigung 100.', regel: { typ: 'promille', promille: 3.25, minChf: 300, maxChf: 8000 } },
  GL: { kanton: 'GL', erlassName: 'Beurkundung / GebT ZGB', erlassNr: 'GS III B/3/2 / III B/7/1', artikel: 'Art. A1-1 Ziff. 7.1 / Art. 13 Abs. 2 Bst. a', stand: '1.1.2026', verifiziert: R, quelleUrl: 'https://gesetze.gl.ch/app/de/texts_of_law/III%20B%2F7%2F1', hinweis: 'Eintragsgebühr 3‰ der Pfandsumme, mind. Fr. 50 (Art. 13 Abs. 2 Bst. a GebT ZGB) PLUS separate Beurkundungsgebühr 1,5‰, mind. Fr. 50 / max. Fr. 500 (Beurkundungstarif GS III B/3/2, Anhang Ziff. 7.1). Der Mindestbetrag Fr. 100 der hier kodierten Regel ist die Summe beider Minima (50 + 50) — bei Pfandsumme Fr. 10’000 fallen amtlich 50 + 50 = 100 an. Der 3‰-Satz bildet vorerst nur den Eintragsteil ab; die eigenständige Modellierung der Beurkundungskomponente (4,5‰ bis rund Fr. 333’000 Pfandsumme, darüber Deckel Fr. 500 auf dem Beurkundungsteil) ist offen — darum bleibt der Mindestbetrag bei Fr. 100 (Gegenprüfung 7.9.2026).', regel: { typ: 'promille', promille: 3, minChf: 100 } },
  ZG: { kanton: 'ZG', erlassName: 'Verwaltungs-/Grundbuchgebührentarif', erlassNr: 'BGS 641.1 / 215.35', artikel: 'Ziff. 89bis / § 14 Abs. 1 Bst. e', stand: '2019/2025', verifiziert: R, quelleUrl: 'https://bgs.zg.ch/app/de/texts_of_law/215.35', hinweis: 'Aufwandbasiert: Beurkundung 210–850 + Eintrag bis 4’500.', regel: { typ: 'rahmen', vonChf: 410, bisChf: 5350 } },
  FR: { kanton: 'FR', erlassName: 'Tarif notaires / émoluments fixes RF / droits sur gages', erlassNr: 'RSF 261.16 / 214.5.16 / 635.1.1', artikel: 'Art. 4 ch. 3 / Art. 2 ch. 11 / Art. 23', stand: '2018/2024', verifiziert: R, quelleUrl: 'https://bdlf.fr.ch/app/fr/texts_of_law/261.16', hinweis: 'Notar-Staffel + Eintrag fix 100 + Grundpfandsteuer 0,75 % der Pfandsumme.', regel: { typ: 'promille', promille: 7.5, minChf: 230 } },
  SO: { kanton: 'SO', erlassName: 'Gebührentarif (GT)', erlassNr: 'BGS 615.11', artikel: '§ 25 Abs. 1 lit. m', stand: '1.3.2026', verifiziert: R, quelleUrl: 'https://bgs.so.ch/app/de/texts_of_law/615.11', hinweis: 'Gebührenrahmen (kein Promille).', regel: { typ: 'rahmen', vonChf: 20, bisChf: 10000 } },
  BS: { kanton: 'BS', erlassName: 'Notariatstarif / V. zum EG ZGB', erlassNr: 'SG 292.400 / 211.110', artikel: '§ 11 Abs. 1 Ziff. 28 / § 51', stand: '2016/2024', verifiziert: R, quelleUrl: 'https://www.gesetzessammlung.bs.ch/app/de/texts_of_law/292.400', hinweis: 'Beurkundung 0,25 % (max. 50’000) + Eintrag 1‰ + Erstausstellung 100.', regel: { typ: 'promille', promille: 3.5, minChf: 600 } },
  BL: { kanton: 'BL', erlassName: 'NotGebV / GebV Zivilrecht', erlassNr: 'SGS 217.13 / 211.71', artikel: '§ 9 Abs. 1 lit. f / § 16 Ziff. 4 lit. a', stand: '2012/2013', verifiziert: R, quelleUrl: 'https://bl.clex.ch/app/de/texts_of_law/217.13', hinweis: 'Beurkundung Rahmen 350–1’500 + Eintrag fix 300 (pfandsummen-unabhängig).', regel: { typ: 'rahmen', vonChf: 650, bisChf: 1800 } },
  SH: { kanton: 'SH', erlassName: 'Grundbuchgebührenverordnung', erlassNr: 'SHR 211.433', artikel: '§ 13 Abs. 1 Ziff. 3.1 / § 15 Abs. 1 Ziff. 1', stand: '1.1.2011', verifiziert: R, quelleUrl: 'https://rechtsbuch.sh.ch/app/de/texts_of_law/211.433', hinweis: 'Beurkundung 1‰ + Eintrag 2‰.', regel: { typ: 'promille', promille: 3, minChf: 100 } },
  AR: { kanton: 'AR', erlassName: 'Gebührentarif für die Gemeinden', erlassNr: 'bGS 153.2', artikel: 'Anhang Ziff. 8.2 lit. a', stand: '1.1.2018', verifiziert: R, quelleUrl: 'https://ar.clex.ch/api/de/versions/1203/pdf_file', hinweis: 'Errichtung 1‰ (Beurkundung eingeschlossen).', regel: { typ: 'promille', promille: 1, minChf: 100, maxChf: 2000 } },
  AI: { kanton: 'AI', erlassName: 'Gebührentarif (GebT)', erlassNr: 'GS 172.513', artikel: 'Art. 14 Abs. 2 Ziff. 3 / Art. 11 Abs. 1 Ziff. 6.1', stand: '1.1.2026', verifiziert: R, quelleUrl: 'https://ai.clex.ch/app/de/texts_of_law/172.513', hinweis: 'Beurkundung 1‰ + Eintrag 1‰ (je min. 50 / max. 2’000).', regel: { typ: 'promille', promille: 2, minChf: 100, maxChf: 4000 } },
  SG: { kanton: 'SG', erlassName: 'Gebührentarif für die Grundbuchämter', erlassNr: 'sGS 914.5', artikel: 'Art. 10 Nr. 21.01 (i.V.m. Art. 5 Abs. 1) / Nr. 21.02', stand: '1.6.2020', verifiziert: R, quelleUrl: 'https://www.gesetzessammlung.sg.ch/app/de/texts_of_law/914.5', hinweis: 'Eintragung 1‰ der Pfandsumme, je Pfandrecht im Rahmen 100–2’000 (Nr. 21.01); bei Beurkundung durch die Grundbuchverwalterin verdoppeln sich die Ansätze über Eintragungen (Art. 5 Abs. 1) → 2‰, Rahmen 200–4’000. Papier-Schuldbrief zusätzlich Fr. 300 (Nr. 21.02). Kein Satzunterschied mehr zwischen Papier- und Register-Schuldbrief.', regel: { typ: 'promille', promille: 2, minChf: 200, maxChf: 4000 } },
  GR: { kanton: 'GR', erlassName: 'NotGebV / V. Grundbuchämter', erlassNr: 'BR 210.370 / 217.200', artikel: 'Art. 16 Abs. 1 lit. i / Art. 13 Abs. 1 lit. j', stand: '2024/2025', verifiziert: R, quelleUrl: 'https://www.gr-lex.gr.ch/app/de/texts_of_law/217.200', hinweis: 'Beurkundung 1‰ + Eintrag 1‰ (je max. 15’000).', regel: { typ: 'promille', promille: 2, minChf: 150, maxChf: 30000 } },
  AG: { kanton: 'AG', erlassName: 'Notariatstarif / GBAG', erlassNr: 'SAR 295.250 / 725.100', artikel: '§ 3 Abs. 1 / § 23 Abs. 1 lit. a', stand: '2025/2020', verifiziert: R, quelleUrl: 'https://gesetzessammlungen.ag.ch/app/de/texts_of_law/725.100', hinweis: 'Beurkundung ⅔ der §2-Ansätze (max. 7’500) + Eintragungsabgabe 1,5‰ + 40/Gläubiger.', regel: { typ: 'promille', promille: 1.5, minChf: 100 } },
  TG: { kanton: 'TG', erlassName: 'GGG', erlassNr: 'RB 632.1', artikel: '§ 14 Abs. 1 / Abs. 2 Ziff. 11', stand: '1.1.2016', verifiziert: R, quelleUrl: 'https://www.rechtsbuch.tg.ch/app/de/texts_of_law/632.1', hinweis: 'Beurkundung 1‰ (max. 5’000) + Eintrag 1,5‰ (max. 10’000); kombiniert höchstens 15’000. QS-GP 2.7.2026: kombinierter Höchstbetrag 15’000 ergänzt (GGG § 14 Abs. 1 + Abs. 2 Ziff. 11) — vorher ungedeckelt.', regel: { typ: 'promille', promille: 2.5, minChf: 200, maxChf: 15000 } },
  TI: { kanton: 'TI', erlassName: 'Tariffa notarile / LTORF', erlassNr: 'RL 952.300 / 216.200', artikel: 'Art. 6 / Art. 25', stand: '2015/2017', verifiziert: R, quelleUrl: 'https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/pdfatto/atto/181', hinweis: 'Beurkundung halber Art.-5-Tarif + Eintrag 7‰.', regel: { typ: 'promille', promille: 7, minChf: 200 } },
  VD: { kanton: 'VD', erlassName: 'TNo / LRF', erlassNr: 'BLV 178.11.2 / 211.61', artikel: 'Art. 20 / Art. 28', stand: '2005/2018', verifiziert: R, quelleUrl: 'https://www.lexfind.ch/tolv/200292/fr', hinweis: 'Beurkundung 5‰ degressiv + Eintrag 1,5‰ (max. 20’000); Pfand vom droit de mutation ausgenommen.', regel: { typ: 'promille', promille: 3, minChf: 200 } },
  VS: { kanton: 'VS', erlassName: 'Tarif notaires / Ordonnance RF / LDM', erlassNr: 'RS 178.104 / 211.611 / 643.1', artikel: 'Art. 13 al. 2 / Art. 32 OcRF / Art. 16', stand: '2011/2025', verifiziert: R, quelleUrl: 'https://lex.vs.ch/app/fr/texts_of_law/178.104', hinweis: 'Beurkundung + Eintrag 2,5‰ (max. 3’000) + Pfandsteuer 0,2 %. (Eintrag-Anker Art. 32 OcRF statt alter Nummerierung Art. 96.)', regel: { typ: 'promille', promille: 4.5, minChf: 300 } },
  NE: { kanton: 'NE', erlassName: 'Tarif notaires / LERF', erlassNr: 'RSN 215.411.6 / 166.31', artikel: 'Art. 10', stand: '2012/2013', verifiziert: R, quelleUrl: 'https://rsn.ne.ch/DATA/program/books/RSN2016/20163/htm/2154116.htm', hinweis: 'Beurkundung Pauschalstaffel (Tarif notaires RSN 166.31 Art. 14 ch. 44 «Constitution d’un droit de gage immobilier») + Eintrag LERF Art. 10 = 2‰ bis 2 Mio (hier kodiert).', regel: { typ: 'promille', promille: 2, minChf: 50 } },
  GE: { kanton: 'GE', erlassName: 'REmORFDIT / REmNot / LDE', erlassNr: 'RSG E 1 50.06 / E 6 05.03 / D 3 30', artikel: 'Art. 4 al. 6', stand: '1985/2011', verifiziert: R, quelleUrl: 'https://silgeneve.ch/legis/data/rsg_e1_50p06.htm', hinweis: 'Beurkundung 5‰ degressiv (REmNot RSG E 6 05.03 Art. 16) + Eintrag 0,085 % (REmORFDIT RSG E 1 50.06 Art. 4, hier kodiert) + Registrierungssteuer 0,65 % der Pfandsumme (LDE RSG D 3 30 Art. 84).', regel: { typ: 'promille', promille: 6.5, minChf: 200 } },
  JU: { kanton: 'JU', erlassName: 'Décret notaires / RF / LDMG', erlassNr: 'RSJU 189.61 / 176.331 / 215.326.2', artikel: 'Art. 10 / Art. 7 / Art. 13', stand: '2005/2017/2024', verifiziert: R, quelleUrl: 'https://rsju.jura.ch/fr/viewdocument.html?idn=20021&id=37773&download=1', hinweis: 'Beurkundung 5‰ degressiv + Eintrag 1‰ + 70 Pkt + Pfandsteuer 3,5‰.', regel: { typ: 'promille', promille: 4.5, minChf: 270 } },
};

// ─── 4. Handänderungssteuer (über Kaufpreis) — kantonale/kommunale STEUER ────
// `formel_extern` = keine separate Handänderungssteuer (klarer Hinweis).
const keineSteuer = (kanton: KantonCode, erlassName: string, hinweis: string, quelleUrl = ''): KantonalerTarif =>
  ({ kanton, erlassName, erlassNr: '—', artikel: '—', stand: '2026', verifiziert: R, quelleUrl, hinweis, regel: { typ: 'formel_extern', hinweis } });

export const HANDAENDERUNGSSTEUER: Record<KantonCode, KantonalerTarif> = {
  ZH: keineSteuer('ZH', 'Keine Handänderungssteuer', 'ZH erhebt keine Handänderungssteuer (abgeschafft per 1.1.2005).'),
  BE: { kanton: 'BE', erlassName: 'Gesetz über die Handänderungssteuer (HStG)', erlassNr: 'BSG 215.326.2', artikel: 'Art. 11 Abs. 1', stand: '1.4.2023', verifiziert: R, quelleUrl: 'https://www.belex.sites.be.ch/app/de/texts_of_law/215.326.2', hinweis: '1,8 % der Gegenleistung; Hauptwohnsitz-Befreiung erste CHF 800’000 (Art. 11a/11b).', regel: { typ: 'promille', promille: 18 } },
  LU: { kanton: 'LU', erlassName: 'Handänderungssteuergesetz (HStG)', erlassNr: 'SRL Nr. 645', artikel: '§ 6', stand: '1.1.2025', verifiziert: R, quelleUrl: 'https://srl.lu.ch/app/de/texts_of_law/645', hinweis: '1,5 %; befreit sind — je selbständig — Rechtsgeschäfte zwischen Ehegatten/eingetragenen Partnern/Lebenspartnern und Verwandten in auf- und absteigender Linie (§ 3 Ziff. 2) sowie Rechtsgeschäfte mit einem Handänderungswert unter Fr. 20’000 (§ 3 Ziff. 6).', regel: { typ: 'promille', promille: 15 } },
  UR: keineSteuer('UR', 'Keine Handänderungssteuer', 'UR erhebt keine Handänderungssteuer (stattdessen die Grundbuchgebühr 2‰).'),
  SZ: { kanton: 'SZ', erlassName: 'Gesetz über die Handänderungssteuer', erlassNr: 'SRSZ 172.500', artikel: '§ 7', stand: '1.2.2007', verifiziert: R, quelleUrl: 'https://www.lexfind.ch/tolv/82040/de', hinweis: '1 % (durch die Gemeinde); Befreiungen § 5/§ 6 (Ehegatten/gerade Linie/Geschwister/Erbgang).', regel: { typ: 'promille', promille: 10 } },
  OW: { kanton: 'OW', erlassName: 'Steuergesetz', erlassNr: 'GDB 641.4', artikel: 'Art. 162', stand: '1.1.2026', verifiziert: R, quelleUrl: 'https://gdb.ow.ch/app/de/texts_of_law/641.4', hinweis: '1,5 % (Käufer/Verkäufer solidarisch); Befreiung Erbgang/Ehegatten/gerade Linie (Art. 159).', regel: { typ: 'promille', promille: 15 } },
  NW: { kanton: 'NW', erlassName: 'Steuergesetz', erlassNr: 'NG 521.1', artikel: 'Art. 140', stand: '1.1.2026', verifiziert: R, quelleUrl: 'https://gesetze.nw.ch/app/de/texts_of_law/521.1', hinweis: '1 % des Handänderungswerts; Befreiung Eltern/Kinder/Ehegatten/Erbgang (Art. 139).', regel: { typ: 'promille', promille: 10 } },
  GL: keineSteuer('GL', 'Keine Handänderungssteuer', 'GL erhebt keine Handänderungssteuer (die 3,5‰-Grundbuchgebühr wirkt faktisch ersatzweise).'),
  ZG: keineSteuer('ZG', 'Keine Handänderungssteuer', 'ZG erhebt keine Handänderungssteuer (per Revision 2019 gestrichen).'),
  FR: { kanton: 'FR', erlassName: 'Loi sur les droits de mutation et les droits sur les gages immobiliers', erlassNr: 'RSF 635.1.1', artikel: 'Art. 21', stand: '1.3.2024', verifiziert: R, quelleUrl: 'https://bdlf.fr.ch/app/fr/texts_of_law/635.1.1', hinweis: '1,5 % kantonal + Gemeindezuschlag bis 100 % → effektiv bis 3,0 %; Erstwohnungs-Abzug Art. 19a.', regel: { typ: 'promille', promille: 15 } },
  SO: { kanton: 'SO', erlassName: 'Steuergesetz (StG)', erlassNr: 'BGS 614.11', artikel: '§ 212', stand: '1.1.2025', verifiziert: R, quelleUrl: 'https://bgs.so.ch/app/de/texts_of_law/614.11', hinweis: '2,2 % (Ehegatten/eingetr. Partner/Nachkommen die Hälfte = 1,1 %); keine Eigenheim-Befreiung.', regel: { typ: 'promille', promille: 22 } },
  BS: { kanton: 'BS', erlassName: 'Handänderungssteuergesetz', erlassNr: 'SG 650.100', artikel: '§ 1 Abs. 2', stand: '1.7.2014', verifiziert: R, quelleUrl: 'https://www.gesetzessammlung.bs.ch/app/de/texts_of_law/650.100', hinweis: '3 %; ermässigt 1,5 % bei ≥6 J selbstbewohnt / Ersatzbeschaffung (§ 4); Befreiung Nachkommen/Ehegatten/Erbteilung.', regel: { typ: 'promille', promille: 30 } },
  BL: { kanton: 'BL', erlassName: 'Steuergesetz (StG)', erlassNr: 'SGS 331', artikel: '§ 84 Abs. 1', stand: '1.1.2023', verifiziert: R, quelleUrl: 'https://bl.clex.ch/app/de/texts_of_law/331', hinweis: 'Je 1,25 % Veräusserer UND Erwerber = 2,5 % total; Erwerber CHF 0 bei selbstgenutztem Wohneigentum (§ 82 II).', regel: { typ: 'promille', promille: 25 } },
  SH: keineSteuer('SH', 'Keine Handänderungssteuer', 'SH erhebt keine Handänderungssteuer (nur Grundstückgewinnsteuer).', 'https://rechtsbuch.sh.ch/app/de/texts_of_law/641.100'),
  AR: { kanton: 'AR', erlassName: 'Steuergesetz', erlassNr: 'bGS 621.11', artikel: 'Art. 238', stand: '1.1.2025', verifiziert: R, quelleUrl: 'https://ar.clex.ch/app/de/texts_of_law/621.11', hinweis: '2 % (Gemeindesteuer; Gemeinden dürfen tiefer ansetzen); halber Satz 1 % Eltern→Nachkommen.', regel: { typ: 'promille', promille: 20 } },
  AI: { kanton: 'AI', erlassName: 'Steuergesetz', erlassNr: 'GS 640.000', artikel: 'Art. 119 Abs. 1', stand: '1.1.2024', verifiziert: R, quelleUrl: 'https://ai.clex.ch/app/de/texts_of_law/640.000', hinweis: '1 %; Befreiung u. a. unter Ehegatten (Art. 118).', regel: { typ: 'promille', promille: 10 } },
  SG: { kanton: 'SG', erlassName: 'Steuergesetz', erlassNr: 'sGS 811.1', artikel: 'Art. 245', stand: '2026', verifiziert: R, quelleUrl: 'https://www.gesetzessammlung.sg.ch/app/de/texts_of_law/811.1', hinweis: '1 % (Gemeindesteuer, kantonal einheitlich); reduziert 0,5 % (Eltern–Kinder/Geschwister Nachlassteilung); Befreiung Ehegatten (Art. 244).', regel: { typ: 'promille', promille: 10 } },
  GR: { kanton: 'GR', erlassName: 'Gesetz über die Gemeinde- und Kirchensteuern (GKStG)', erlassNr: 'BR 720.200', artikel: 'Art. 12 Abs. 1', stand: '1.1.2025', verifiziert: R, quelleUrl: 'https://www.gr-lex.gr.ch/app/de/texts_of_law/720.200', hinweis: 'Reine GEMEINDESTEUER (Kanton erhebt keine), Gemeinde max. 2 % — konkreter Satz nur im kommunalen Gesetz; Befr. Erbgang/Schenkung/Ehegatten (Art. 9).', regel: { typ: 'rahmen', vonChf: 0, bisChf: 20000, hinweis: 'Gemeindesteuer 0–2 % (konkreter Satz kommunal).' } },
  AG: keineSteuer('AG', 'Keine separate Handänderungssteuer', 'AG erhebt keine separate Handänderungssteuer; abgedeckt durch die Grundbuchabgabe 4‰ (§ 8 GBAG, = Grundbuch-Posten).', 'https://gesetzessammlungen.ag.ch/app/de/texts_of_law/725.100'),
  TG: { kanton: 'TG', erlassName: 'Steuergesetz', erlassNr: 'RB 640.1', artikel: '§ 140 Abs. 1', stand: '1.1.2025', verifiziert: R, quelleUrl: 'https://www.rechtsbuch.tg.ch/app/de/texts_of_law/640.1', hinweis: '1 %; Befreiung Eltern–Nachkommen/Geschwister (§ 138).', regel: { typ: 'promille', promille: 10 } },
  TI: keineSteuer('TI', 'Keine separate Handänderungssteuer', 'TI erhebt keine separate Handänderungssteuer; die Grundbuchgebühr (11‰/13‰, LTORF Art. 11) erfüllt die Funktion (= Grundbuch-Posten).', 'https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/pdfatto/atto/181'),
  VD: { kanton: 'VD', erlassName: 'Loi sur les droits de mutation (LMSD)', erlassNr: 'BLV 648.11', artikel: 'Art. 10', stand: '2024', verifiziert: R, quelleUrl: 'https://www.lexfind.ch/tolv/106879/fr', hinweis: '2,2 % Kanton + Gemeindezuschlag bis 50 % → max. 3,3 %; kein Eigenheim-Rabatt; Befr. Ehegatten (Art. 3).', regel: { typ: 'promille', promille: 22 } },
  VS: { kanton: 'VS', erlassName: 'Loi sur les droits de mutations (LDM)', erlassNr: 'RS 643.1', artikel: 'Art. 14 al. 1', stand: '1.1.2013', verifiziert: R, quelleUrl: 'https://lex.vs.ch/app/fr/texts_of_law/643.1', hinweis: 'Pauschal-stufig 1 % (50k–500k) / 1,3 % (500k–1 Mio) / 1,5 % (>1 Mio) auf Gesamtwert + Gemeindezuschlag bis 50 %; Befr. gerade Linie/Ehegatten (Art. 18).', regel: { typ: 'staffel_voll_prozent', baender: [
    { bisChf: 500000, fixChf: 0, prozent: 1 },
    { bisChf: 1000000, fixChf: 0, prozent: 1.3 },
    { bisChf: INF, fixChf: 0, prozent: 1.5 },
  ] } },
  NE: { kanton: 'NE', erlassName: 'Loi sur les lods et droits de mutation immobilière (LDMI)', erlassNr: 'RSN 635.0', artikel: 'Art. 6', stand: '2024', verifiziert: R, quelleUrl: 'https://rsn.ne.ch/DATA/program/books/RSN2015/20155/htm/6350.htm', hinweis: '3,3 %; reduziert 2,2 % bei erster Selbstbewohnung (Art. 11); Befr. Erbgang/Ehegatten/gerade Linie (Art. 8).', regel: { typ: 'promille', promille: 33 } },
  GE: { kanton: 'GE', erlassName: 'Loi sur les droits d’enregistrement (LDE)', erlassNr: 'RSG D 3 30', artikel: 'Art. 33', stand: '2024', verifiziert: R, quelleUrl: 'https://silgeneve.ch/legis/data/rsg_d3_30.htm', hinweis: '3 % (Käufer); Abzug CHF 15’000 bei eigenem Hauptwohnsitz, wenn Preis ≤ 1 Mio (Art. 8A).', regel: { typ: 'promille', promille: 30 } },
  JU: { kanton: 'JU', erlassName: 'Loi sur les droits de mutation et les gages (LDMG)', erlassNr: 'RSJU 215.326.2', artikel: 'Art. 6', stand: '1.3.2024', verifiziert: R, quelleUrl: 'https://rsju.jura.ch/fr/viewdocument.html?idn=20037&id=33943&download=1', hinweis: '2,5 % (≤ 1 Mio); für den Teil über 1 Mio 3,2 % (marginal, «pour la part»); reduziert 1,5 % Nachkommen/Vorfahren (Art. 9); Befr. Ehegatten/Konkubinat (Art. 10).', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 1000000, sockelChf: 0, abChf: 0, prozent: 2.5 },
    { bisChf: INF, sockelChf: 25000, abChf: 1000000, prozent: 3.2 },
  ] } },
};
