// ─── Grundpfand-Posten (Schuldbrief) = Beurkundung + Grundbucheintrag ────────
//
// RL-28 Teil 1 (RV-19, Deutschschweiz). Der Posten «Grundpfand» im Rechner
// Notariat/Grundbuch besteht aus zwei Gebühren nach zwei Erlassen:
//   · Beurkundung des Schuldbriefs  → SONDERTARIFE.schuldbrief (beurkundung.ts)
//   · Eintragung ins Grundbuch      → GRUNDBUCH_EINTRAG.grundpfand (grundbuch.ts)
// Diese Datei SETZT beide nur zusammen (RL-27-Primitiv `typ: 'summe'`); sie
// enthält keine Sätze (§5: eine Quelle je Satz). Eigenes Modul wegen des
// Zirkularimports: beurkundung.ts und grundbuch.ts importieren ihrerseits aus
// notariat-grundbuch.ts, darum kann die Summe nicht dort zusammengesetzt werden.
// Die Pfandsteuer (FR, GE, VS, VD, JU) gehört nicht hierher, sondern nach
// PFANDSTEUER (beurkundungZusatzkosten.ts); RL-28 Teil 3.
//
// Nicht Teil von Teil 1: Romandie und Tessin (FR, GE, VS, VD, NE, TI, JU, Teil 2) sowie
// BE, AI, AR, BL, SO, ZG (kein Notariatsteil in SONDERTARIFE) und SZ (eine einzige
// Gebühr nach Nr. 2, kein Summenfall). Ihre bisherigen Einträge stehen unten wortgleich
// in dieser Datei (einzige Quelle für alle 26 Kantone, §5); Teil 2/3 prüft sie gegen Norm.
// Stand der Erlasse: am 15.10.2026 an der amtlichen Quelle geöffnet.

import type { KantonCode, KantonalerTarif } from './typen';
import { SONDERTARIFE } from './beurkundung';
import { GRUNDBUCH_EINTRAG } from './grundbuch';

const INF = Infinity;
const R = 'recherche' as const;

const beurkundung = (k: KantonCode): KantonalerTarif => {
  const t = SONDERTARIFE.schuldbrief?.[k];
  if (!t) throw new Error(`SONDERTARIFE.schuldbrief.${k} fehlt (Grundpfand-Posten ${k} braucht den Notariatsteil)`);
  return t;
};
const eintrag = (k: KantonCode): KantonalerTarif => {
  const t = GRUNDBUCH_EINTRAG.grundpfand?.[k];
  if (!t) throw new Error(`GRUNDBUCH_EINTRAG.grundpfand.${k} fehlt (Grundpfand-Posten ${k} braucht den Eintragsteil)`);
  return t;
};

type Kopf = Pick<KantonalerTarif, 'erlassName' | 'erlassNr' | 'artikel' | 'stand' | 'hinweis'>;

/** Posten = Beurkundung + Grundbucheintrag. Die Quelle-URL ist die des
 *  Notariatserlasses; die des Eintragserlasses steht am Ende des Hinweises. */
const kombi = (kanton: KantonCode, kopf: Kopf): KantonalerTarif => {
  const n = beurkundung(kanton);
  const g = eintrag(kanton);
  const zweite = g.quelleUrl !== n.quelleUrl ? ` Quelle Eintrag: ${g.quelleUrl}` : '';
  return {
    kanton, ...kopf, verifiziert: R, quelleUrl: n.quelleUrl,
    hinweis: `${kopf.hinweis}${zweite}`,
    regel: { typ: 'summe', teile: [
      { etikett: 'Beurkundung', regel: n.regel },
      { etikett: 'Grundbucheintrag', regel: g.regel },
    ] },
  };
};

export const GRUNDPFAND: Record<KantonCode, KantonalerTarif> = {
  // Teil 2/3 prüft gegen Norm: Die folgenden 14 Kantone sind wortgleich aus der früheren
  // Tabelle in notariat-grundbuch.ts übernommen (Werte, Metadaten, Hinweise unverändert).
  BE: { kanton: 'BE', erlassName: 'GebVN / GebV', erlassNr: 'BSG 169.81 / 154.21', artikel: 'Art. 18 / Anhang 4B Ziff. 3.3.1', stand: '1.3.2022', verifiziert: R, quelleUrl: 'https://www.belex.sites.be.ch/app/de/texts_of_law/169.81', regel: { typ: 'formel_extern', hinweis: 'Beurkundung nach Zeitaufwand (min. 200) + Eintrag 100 TP — KEIN Promille.' } },
  SZ: { kanton: 'SZ', erlassName: 'Gebührentarif Notare/Grundbuchverwalter', erlassNr: 'SRSZ 213.512', artikel: '§ 5 Abs. 1 Nr. 2', stand: '1.2.2021', verifiziert: R, quelleUrl: 'https://www.sz.ch/public/upload/assets/7361/213_512.pdf', hinweis: 'CHF 45 je (auch angefangene) CHF 50’000 (≈ 0,9‰); bei Pfandsumme über 8 Mio. wird die Gebühr auf dem Mehrbetrag um 50 % reduziert, höchstens 10’350. QS-GP 2.7.2026: −50 %-Degression >8 Mio. am amtlichen PDF verifiziert und ergänzt (Tranchen-Aufrundung noch flach angenähert).', regel: { typ: 'staffel_sockel_prozent', baender: [
    { bisChf: 8000000, sockelChf: 0, abChf: 0, prozent: 0.09, maxChf: 10350 },
    { bisChf: INF, sockelChf: 7200, abChf: 8000000, prozent: 0.045, maxChf: 10350 },
  ] } },
  ZG: { kanton: 'ZG', erlassName: 'Verwaltungs-/Grundbuchgebührentarif', erlassNr: 'BGS 641.1 / 215.35', artikel: 'Ziff. 89bis / § 14 Abs. 1 Bst. e', stand: '2019/2025', verifiziert: R, quelleUrl: 'https://bgs.zg.ch/app/de/texts_of_law/215.35', hinweis: 'Aufwandbasiert: Beurkundung 210–850 + Eintrag bis 4’500.', regel: { typ: 'rahmen', vonChf: 410, bisChf: 5350 } },
  FR: { kanton: 'FR', erlassName: 'Tarif notaires / émoluments fixes RF / droits sur gages', erlassNr: 'RSF 261.16 / 214.5.16 / 635.1.1', artikel: 'Art. 4 ch. 3 / Art. 2 ch. 11 / Art. 23', stand: '2018/2024', verifiziert: R, quelleUrl: 'https://bdlf.fr.ch/app/fr/texts_of_law/261.16', hinweis: 'Notar-Staffel + Eintrag fix 100 + Grundpfandsteuer 0,75 % der Pfandsumme.', regel: { typ: 'promille', promille: 7.5, minChf: 230 } },
  SO: { kanton: 'SO', erlassName: 'Gebührentarif (GT)', erlassNr: 'BGS 615.11', artikel: '§ 25 Abs. 1 lit. m', stand: '1.3.2026', verifiziert: R, quelleUrl: 'https://bgs.so.ch/app/de/texts_of_law/615.11', hinweis: 'Gebührenrahmen (kein Promille).', regel: { typ: 'rahmen', vonChf: 20, bisChf: 10000 } },
  BL: { kanton: 'BL', erlassName: 'NotGebV / GebV Zivilrecht', erlassNr: 'SGS 217.13 / 211.71', artikel: '§ 9 Abs. 1 lit. f / § 16 Ziff. 4 lit. a', stand: '2012/2013', verifiziert: R, quelleUrl: 'https://bl.clex.ch/app/de/texts_of_law/217.13', hinweis: 'Beurkundung Rahmen 350–1’500 + Eintrag fix 300 (pfandsummen-unabhängig).', regel: { typ: 'rahmen', vonChf: 650, bisChf: 1800 } },
  AR: { kanton: 'AR', erlassName: 'Gebührentarif für die Gemeinden', erlassNr: 'bGS 153.2', artikel: 'Anhang Ziff. 8.2 lit. a', stand: '1.1.2018', verifiziert: R, quelleUrl: 'https://ar.clex.ch/api/de/versions/1203/pdf_file', hinweis: 'Errichtung 1‰ (Beurkundung eingeschlossen).', regel: { typ: 'promille', promille: 1, minChf: 100, maxChf: 2000 } },
  AI: { kanton: 'AI', erlassName: 'Gebührentarif (GebT)', erlassNr: 'GS 172.513', artikel: 'Art. 14 Abs. 2 Ziff. 3 / Art. 11 Abs. 1 Ziff. 6.1', stand: '1.1.2026', verifiziert: R, quelleUrl: 'https://ai.clex.ch/app/de/texts_of_law/172.513', hinweis: 'Beurkundung 1‰ + Eintrag 1‰ (je min. 50 / max. 2’000).', regel: { typ: 'promille', promille: 2, minChf: 100, maxChf: 4000 } },
  TI: { kanton: 'TI', erlassName: 'Tariffa notarile / LTORF', erlassNr: 'RL 952.300 / 216.200', artikel: 'Art. 6 / Art. 25', stand: '2015/2017', verifiziert: R, quelleUrl: 'https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/pdfatto/atto/181', hinweis: 'Beurkundung halber Art.-5-Tarif + Eintrag 7‰.', regel: { typ: 'promille', promille: 7, minChf: 200 } },
  VD: { kanton: 'VD', erlassName: 'TNo / LRF', erlassNr: 'BLV 178.11.2 / 211.61', artikel: 'Art. 20 / Art. 28', stand: '2005/2018', verifiziert: R, quelleUrl: 'https://www.lexfind.ch/tolv/200292/fr', hinweis: 'Beurkundung 5‰ degressiv + Eintrag 1,5‰ (max. 20’000); Pfand vom droit de mutation ausgenommen.', regel: { typ: 'promille', promille: 3, minChf: 200 } },
  VS: { kanton: 'VS', erlassName: 'Tarif notaires / Ordonnance RF / LDM', erlassNr: 'RS 178.104 / 211.611 / 643.1', artikel: 'Art. 13 al. 2 / Art. 32 OcRF / Art. 16', stand: '2011/2025', verifiziert: R, quelleUrl: 'https://lex.vs.ch/app/fr/texts_of_law/178.104', hinweis: 'Beurkundung + Eintrag 2,5‰ (max. 3’000) + Pfandsteuer 0,2 %. (Eintrag-Anker Art. 32 OcRF statt alter Nummerierung Art. 96.)', regel: { typ: 'promille', promille: 4.5, minChf: 300 } },
  NE: { kanton: 'NE', erlassName: 'Tarif notaires / LERF', erlassNr: 'RSN 215.411.6 / 166.31', artikel: 'Art. 10', stand: '2012/2013', verifiziert: R, quelleUrl: 'https://rsn.ne.ch/DATA/program/books/RSN2016/20163/htm/2154116.htm', hinweis: 'Beurkundung Pauschalstaffel (Tarif notaires RSN 166.31 Art. 14 ch. 44 «Constitution d’un droit de gage immobilier») + Eintrag LERF Art. 10 = 2‰ bis 2 Mio (hier kodiert).', regel: { typ: 'promille', promille: 2, minChf: 50 } },
  GE: { kanton: 'GE', erlassName: 'REmORFDIT / REmNot / LDE', erlassNr: 'RSG E 1 50.06 / E 6 05.03 / D 3 30', artikel: 'Art. 4 al. 6', stand: '1985/2011', verifiziert: R, quelleUrl: 'https://silgeneve.ch/legis/data/rsg_e1_50p06.htm', hinweis: 'Beurkundung 5‰ degressiv (REmNot RSG E 6 05.03 Art. 16) + Eintrag 0,085 % (REmORFDIT RSG E 1 50.06 Art. 4, hier kodiert) + Registrierungssteuer 0,65 % der Pfandsumme (LDE RSG D 3 30 Art. 84).', regel: { typ: 'promille', promille: 6.5, minChf: 200 } },
  JU: { kanton: 'JU', erlassName: 'Décret notaires / RF / LDMG', erlassNr: 'RSJU 189.61 / 176.331 / 215.326.2', artikel: 'Art. 10 / Art. 7 / Art. 13', stand: '2005/2017/2024', verifiziert: R, quelleUrl: 'https://rsju.jura.ch/fr/viewdocument.html?idn=20021&id=37773&download=1', hinweis: 'Beurkundung 5‰ degressiv + Eintrag 1‰ + 70 Pkt + Pfandsteuer 3,5‰.', regel: { typ: 'promille', promille: 4.5, minChf: 270 } },

  // Teil 1 (nach Norm aus zwei Erlassen zusammengesetzt):

  AG: kombi('AG', {
    erlassName: 'Notariatstarif / Gesetz über die Grundbuchabgaben', erlassNr: 'SAR 295.250 / 725.100',
    artikel: '§ 3 Abs. 1 / § 23 Abs. 1 lit. a, § 4 Abs. 1', stand: '1.1.2025 / 1.1.2020',
    hinweis: 'Beurkundung zwei Drittel der Ansätze von § 2 (höchstens 7’500; Annahme: Minimum 300 wird nicht gedrittelt) + Eintragungsabgabe 1,5 ‰ (mindestens 100; Pfandsumme auf 1’000 gerundet, bei genau x’500 Annahme: aufwärts). Eine Fixgebühr von 40 je Gläubiger ist amtlich nicht belegt und nicht enthalten.',
  }),
  BS: kombi('BS', {
    erlassName: 'Notariatstarif / Verordnung zum EG ZGB', erlassNr: 'SG 292.400 / 211.110',
    artikel: '§ 11 Abs. 1 Ziff. 28 lit. a (wie Ziff. 17) / § 51 Abs. 1 lit. b, Abs. 6 lit. a', stand: '1.7.2016 / 1.5.2025',
    hinweis: 'Beurkundung 0,25 % bis 2 Mio. (mindestens 500), darüber degressiv, höchstens 50’000 + Eintrag 1 ‰ (mindestens 200, höchstens 50’000; Pfandsumme auf volle Tausend aufgerundet). Nicht enthalten: Ausstellung eines Papier-Schuldbriefs 100 (§ 51 Abs. 7 lit. d), Zuschläge für Mitverpfändung.',
  }),
  LU: kombi('LU', {
    erlassName: 'Beurkundungsgebührenverordnung / Grundbuchgebührentarif', erlassNr: 'SRL 258 / 228',
    artikel: '§ 29 Abs. 1 / § 8 Abs. 1 Ziff. 1', stand: '1.1.2022 / 1.1.2026',
    hinweis: 'Beurkundung Staffel 2 ‰ bis 0,5 ‰ (mindestens 300, höchstens 7’125; über 10 Mio. gebührenfrei) + Eintrag 2 ‰ (mindestens 50). Nicht enthalten: Ausfertigung eines Papier-Schuldbriefs 40 (GBGT § 10 Abs. 1 Ziff. 1).',
  }),
  OW: kombi('OW', {
    erlassName: 'Beurkundungsgebühren / Grundbuchgebührentarif', erlassNr: 'GDB 210.32 / 213.61',
    artikel: 'Art. 10 Ziff. 23 / Art. 12 Abs. 1', stand: '1.1.2013 / 1.1.2022',
    hinweis: 'Beurkundung 1,5 ‰ bis 300’000, +1 ‰ bis 600’000, +0,5 ‰ darüber (mindestens 400) + Eintrag 2 ‰ bis 500’000, +1,5 ‰ bis 1 Mio., +1 ‰ darüber (mindestens 80, höchstens 10’000).',
  }),
  NW: kombi('NW', {
    erlassName: 'Beurkundungsgebührenverordnung / Gebührenverordnung', erlassNr: 'NG 268.12 / 265.51',
    artikel: '§ 28 Abs. 1 / Anhang Ziff. 2.6.3.1', stand: '1.1.2016 / 1.1.2025',
    hinweis: 'Beurkundung 1,5 ‰ bis 200’000, dann degressiv bis 0,2 ‰ (mindestens 200) + Eintrag 2 ‰ bis 3 Mio., 1 ‰ darüber (mindestens 100, höchstens 8’000; der Höchstbetrag gilt nur für den Eintragsteil). Nicht enthalten: Ausfertigung eines Papier-Schuldbriefs 100 (Ziff. 2.6.3.3).',
  }),
  GL: kombi('GL', {
    erlassName: 'Verordnung über Beurkundung und Beglaubigung / Gebührentarif ZGB', erlassNr: 'GS III B/3/2 / III B/7/1',
    artikel: 'Anhang Art. A1-1 Ziff. 7.1 / Art. 13 Abs. 2 lit. a', stand: '1.1.2009 / 1.1.2026',
    hinweis: 'Beurkundung 1,5 ‰ (mindestens 50, höchstens 500) + Eintrag 3 ‰ (mindestens 50).',
  }),
  SH: kombi('SH', {
    erlassName: 'Grundbuchgebührenverordnung', erlassNr: 'SHR 211.433',
    artikel: '§ 13 Abs. 1 Ziff. 3.1 / § 15 Abs. 1 Ziff. 1', stand: '1.1.2011',
    hinweis: 'Beurkundung 1 ‰ (mindestens 50) + Eintrag 2 ‰ (mindestens 50), beide Gebühren in derselben Verordnung.',
  }),
  TG: kombi('TG', {
    erlassName: 'Gesetz über die Gebühren und Gemengsteuern der Grundbuchämter und Notariate (GGG)', erlassNr: 'RB 632.1',
    artikel: '§ 14 Abs. 1 / § 14 Abs. 2 Ziff. 11', stand: '1.1.2016',
    hinweis: 'Beurkundung 1 ‰ (mindestens 100, höchstens 5’000) + Eintrag 1,5 ‰ (mindestens 100, höchstens 10’000); zusammen höchstens 15’000 (erreicht ab 6,67 Mio.).',
  }),
  GR: kombi('GR', {
    erlassName: 'Notariatsgebührenverordnung / Verordnung über die Gebühren der Grundbuchämter', erlassNr: 'BR 210.370 / 217.200',
    artikel: 'Art. 16 Abs. 1 lit. i Ziff. 1 / Art. 13 Abs. 1 lit. j', stand: '1.1.2024 / 1.1.2025',
    hinweis: 'Beurkundung 1 ‰ (mindestens 100, höchstens 15’000) + Eintrag 1 ‰ (mindestens 50, höchstens 15’000).',
  }),
  ZH: kombi('ZH', {
    erlassName: 'Notariatsgebührenverordnung (NotGebV)', erlassNr: 'LS 243',
    artikel: 'Anhang Ziff. 1.2.1 und 2.3.1', stand: '1.1.2024',
    hinweis: 'Beurkundung 1 ‰ + Eintrag 1 ‰ der Pfandsumme, je mindestens 100.',
  }),
  SG: kombi('SG', {
    erlassName: 'Verordnung über die Gebühren für Amtshandlungen der Grundbuchämter (GB-GebV)', erlassNr: 'sGS 914.5',
    artikel: 'Art. 10 Nr. 21.01 i.V.m. Art. 5 Abs. 1 und 2', stand: '1.6.2020',
    hinweis: 'Beurkundung 1 ‰ (Rahmen 100–2’000, einfacher Satz nach Art. 5 Abs. 2) + Eintrag 1 ‰ (Rahmen 100–2’000), zusammen 2 ‰ im Rahmen 200–4’000 (Art. 5 Abs. 1: Verdoppelung bei Beurkundung durch das Grundbuchamt). Papier-Schuldbrief zusätzlich 300 (Nr. 21.02).',
  }),

  // Bewusste Ausnahme (RL-26, Entscheid B-T4 «bleibt»): Der Notariatsteil Uri ist
  // `formel_extern` (kein amtlicher Tarif). Eine `summe` damit würde den ganzen
  // Posten «nicht beziffert» machen. UR zeigt darum NUR den amtlichen Eintragsteil
  // mit dem Hinweis «Nur Eintragsgebühr …», kein `summe`-Objekt.
  UR: { ...eintrag('UR'), hinweis: 'Nur Eintragsgebühr (amtlicher Grundbuchgebührentarif); Beurkundung durch freies Notariat ohne amtlichen Tarif — beim Notariat erfragen.' },
};
