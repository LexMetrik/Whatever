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
// Die Pfandsteuer (FR, GE, VS, VD, JU) gehört nicht hierher, sondern in die eigene
// Quelle `pfandsteuer.ts` (RL-28 Teil 3) und in den Engine-Posten `pfandsteuer`.
//
// Teil 2 (RL-28, 15.10.2026): Romandie und Tessin (FR, GE, VS, VD, NE, TI, JU) sind wie
// die Deutschschweiz aus Beurkundung + Eintrag zusammengesetzt. BE, ZG, SO, BL, AR, AI
// haben keinen Notariatsteil in SONDERTARIFE (Rahmen-, Zeitaufwand- oder
// Kombitarife): ihre Regeln sind an der Norm geprüft und unverändert, nur Stand, Artikel
// und Hinweis sind nachgeführt. SZ ist eine einzige Gebühr nach Nr. 2 (kein Summenfall).
// Stand der Erlasse: am 15.10.2026 an der amtlichen Quelle geöffnet.

import type { KantonCode, KantonalerTarif } from './typen';
import type { TarifRegel } from '../../lib/tarif/staffel';
import { SONDERTARIFE } from './beurkundung';
import { GRUNDBUCH_EINTRAG } from './grundbuch';

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

/** Weiterer, eigenständig belegter Gebührenteil neben Beurkundung und Eintrag
 *  (z. B. JU: Forfait für die Erstellung der Schuldbrief-Urkunde). */
type Zusatzteil = { etikett: string; regel: TarifRegel };

/** Posten = Beurkundung + Grundbucheintrag. Die Quelle-URL ist die des
 *  Notariatserlasses; die des Eintragserlasses steht am Ende des Hinweises. */
const kombi = (kanton: KantonCode, kopf: Kopf, zusatz: Zusatzteil[] = []): KantonalerTarif => {
  const n = beurkundung(kanton);
  const g = eintrag(kanton);
  const zweite = g.quelleUrl !== n.quelleUrl ? ` Quelle Eintrag: ${g.quelleUrl}` : '';
  return {
    kanton, ...kopf, verifiziert: R, quelleUrl: n.quelleUrl,
    hinweis: `${kopf.hinweis}${zweite}`,
    regel: { typ: 'summe', teile: [
      { etikett: 'Beurkundung', regel: n.regel },
      { etikett: 'Grundbucheintrag', regel: g.regel },
      ...zusatz,
    ] },
  };
};

export const GRUNDPFAND: Record<KantonCode, KantonalerTarif> = {
  // Kein Summenfall (kein amtlicher Notariatsteil als Einzelposten); Regeln an der Norm geprüft (15.10.2026).
  BE: { kanton: 'BE', erlassName: 'GebVN / GebV', erlassNr: 'BSG 169.81 / 154.21', artikel: 'Art. 18 Abs. 1 / Anhang 4B Ziff. 3.3.1', stand: '1.3.2022 / 1.9.2026', verifiziert: R, quelleUrl: 'https://www.belex.sites.be.ch/app/de/texts_of_law/169.81', regel: { typ: 'formel_extern', hinweis: 'Beurkundung nach gebotenem Zeitaufwand, mindestens 200 (GebVN Art. 18 Abs. 1) + Eintrag 100 für die Eröffnung der Grundpfandrechtsbeziehung plus 20 je belastetes Grundstück (GebV Anhang 4B Ziff. 3.3.1) — KEIN Promille. Normen am 15.10.2026 geöffnet: GebVN Fassung 1.3.2022, GebV Fassung 1.9.2026.' } },
  // SZ: § 5 Abs. 1 Nr. 2 ist EINE Gebühr für Notar und Grundbuchverwalter (kein Summen-
  // Posten). Regel und Metadaten kommen aus SONDERTARIFE.schuldbrief.SZ (eine Quelle, §5);
  // nur der Posten-Hinweis ist hier formuliert.
  SZ: { ...beurkundung('SZ'), hinweis: 'Eine Gebühr für Beurkundung und Grundbucheintrag (§ 5 Abs. 1 Nr. 2): CHF 45 je angefangene CHF 50’000 der Pfandsumme (Aufrundung auf volle CHF 50’000 vor der Berechnung), über CHF 8 Mio. auf dem Mehrbetrag um 50 % reduziert, höchstens CHF 10’350.' },
  ZG: { kanton: 'ZG', erlassName: 'Verwaltungs-/Grundbuchgebührentarif', erlassNr: 'BGS 641.1 / 215.35', artikel: 'Ziff. 89bis / § 13 Abs. 1–2, § 14 Abs. 1 lit. e', stand: '22.8.2025 / 1.1.2019', verifiziert: R, quelleUrl: 'https://bgs.zg.ch/app/de/texts_of_law/215.35', hinweis: 'Beurkundung: Errichtung und Änderung eines Grundpfandrechts 210 bis 850 (BGS 641.1 Ziff. 89bis). Eintrag nach Zeitaufwand zu CHF 180 je Stunde (BGS 215.35 § 13 Abs. 1–2), bei Pfanderrichtungen und Pfanderhöhungen mit Faktor 3 bis zu einer Gebühr von 4’500 (§ 14 Abs. 1 lit. e, Abs. 3). Die Norm nennt keine Mindestgebühr für den Eintrag; die Untergrenze 410 (210 + 200) ist eine Annahme, keine Normzahl.', regel: { typ: 'rahmen', vonChf: 410, bisChf: 5350 } },
  SO: { kanton: 'SO', erlassName: 'Gebührentarif (GT)', erlassNr: 'BGS 615.11', artikel: '§ 25 Abs. 1 lit. m', stand: '1.3.2026', verifiziert: R, quelleUrl: 'https://bgs.so.ch/app/de/texts_of_law/615.11', hinweis: 'Gebührenrahmen 20–10’000 (kein Promille) für die «in separater Urkunde begründete Errichtung oder Abänderung eines Grundpfandrechtes»; Norm am 15.10.2026 geöffnet (Fassung 1.3.2026).', regel: { typ: 'rahmen', vonChf: 20, bisChf: 10000 } },
  BL: { kanton: 'BL', erlassName: 'NotGebV / GebV Zivilrecht', erlassNr: 'SGS 217.13 / 211.71', artikel: '§ 9 Abs. 1 lit. f / § 16 Abs. 1 Ziff. 4 lit. a', stand: '1.11.2012 / 1.1.2013', verifiziert: R, quelleUrl: 'https://bl.clex.ch/app/de/texts_of_law/217.13', hinweis: 'Beurkundung Rahmen 350–1’500 (NotGebV § 9 Abs. 1 lit. f; innerhalb des Rahmens nach Zeitaufwand, Überschreitung bei Mehraufwand möglich, § 9 Abs. 2–3) + Eintrag fix 300 inkl. Titelausstellung (GebV Zivilrecht § 16 Abs. 1 Ziff. 4 lit. a), pfandsummen-unabhängig. Normen am 15.10.2026 geöffnet.', regel: { typ: 'rahmen', vonChf: 650, bisChf: 1800 } },
  AR: { kanton: 'AR', erlassName: 'Gebührentarif für die Gemeinden', erlassNr: 'bGS 153.2', artikel: 'Anhang Ziff. 8.2 lit. a', stand: '1.1.2018', verifiziert: R, quelleUrl: 'https://ar.clex.ch/api/de/versions/1203/pdf_file', hinweis: 'Beurkundung eingeschlossen (bGS 153.2 Ziff. 8 Ingress: «Die Kosten für Beratung, Vertragsabfassung (ausser bei Ziff. 8.2), Beurkundung, Prüfung und Grundbucheintragung sind in den folgenden Gebühren enthalten.»). Errichtung oder Erhöhung 1 ‰ der Pfandsumme im Rahmen 100–2’000 (Anhang Ziff. 8.2 lit. a), abzüglich gleichzeitig zu löschender Pfandrechte auf demselben Grundstück. Nicht enthalten: Zuschlag 20 je weiteres Grundstück und Vertragsabfassung durch das Grundbuchamt 100–200 (Ziff. 8.2). Fassung 1.1.2018 am 15.10.2026 geöffnet.', regel: { typ: 'promille', promille: 1, minChf: 100, maxChf: 2000 } },
  AI: { kanton: 'AI', erlassName: 'Gebührentarif (GebT)', erlassNr: 'GS 172.513', artikel: 'Art. 14 Abs. 2 Ziff. 3 / Art. 11 Abs. 1 Ziff. 6.1', stand: '1.1.2026', verifiziert: R, quelleUrl: 'https://ai.clex.ch/app/de/texts_of_law/172.513', hinweis: 'Beurkundung 1 ‰ (Art. 14 Abs. 2 Ziff. 3) + Eintrag 1 ‰ (Art. 11 Abs. 1 Ziff. 6.1), je mindestens 50 und höchstens 2’000; zusammen 2 ‰ im Rahmen 100–4’000. Bei Neuerrichtung unter gleichzeitiger Löschung gilt die Differenz. Fassung 1.1.2026 am 15.10.2026 geöffnet.', regel: { typ: 'promille', promille: 2, minChf: 100, maxChf: 4000 } },

  // Teil 1 (nach Norm aus zwei Erlassen zusammengesetzt):

  AG: kombi('AG', {
    erlassName: 'Notariatstarif / Gesetz über die Grundbuchabgaben', erlassNr: 'SAR 295.250 / 725.100',
    artikel: '§ 3 Abs. 1 / § 23 Abs. 1 lit. a, § 4 Abs. 1', stand: '1.1.2025 / 1.1.2020',
    hinweis: 'Beurkundung zwei Drittel der Ansätze von § 2 (höchstens 7’500; Mindestbetrag als zwei Drittel von CHF 300 = CHF 200 gelesen, da § 3 Abs. 1 nur für das Maximum einen eigenen Betrag nennt; Praxis kann CHF 300 anwenden) + Eintragungsabgabe 1,5 ‰ (mindestens 100; Pfandsumme auf 1’000 gerundet, bei genau x’500 Annahme: aufwärts). Eine Fixgebühr von 40 je Gläubiger ist amtlich nicht belegt und nicht enthalten.',
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
    hinweis: 'Beurkundung 1,5 ‰ bis 300’000, +1 ‰ bis 600’000, +0,5 ‰ darüber (mindestens 400) + Eintrag 2 ‰ bis 500’000, +1,5 ‰ bis 1 Mio., +1 ‰ darüber (mindestens 80, höchstens 10’000). Nicht abgebildet: Art. 4 GDB 210.32 (Erhöhung der Beurkundungsgebühr bei Mehraufwand um höchstens die Hälfte) und Art. 5 lit. a (Herabsetzung um einen Drittel bei Beurkundung eines in Reinschrift vorgelegten Dokuments; der Mindestansatz bleibt vorbehalten); im Einzelfall kann die Gebühr deshalb höher oder tiefer ausfallen.',
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

  // Teil 2 (RL-28, 15.10.2026): Romandie und Tessin, aus zwei bis drei Erlassen zusammengesetzt.

  FR: kombi('FR', {
    erlassName: 'Tarif des émoluments des notaires / Tarif des émoluments fixes du registre foncier', erlassNr: 'RSF 261.16 / 214.5.16',
    artikel: 'Art. 4 ch. 3 / Art. 2 ch. 11 lit. a', stand: '1.7.2016 / 1.12.2018',
    hinweis: 'Beurkundung Constitution d’un droit de gage immobilier (bis 5 000 = 100, dann 5 ‰ / 2,5 ‰ / 2 ‰ / 0,75 ‰ / 0,45 ‰, höchstens 10 000) + Eintrag fix 100 je Pfand. Pfandsteuer 0,75 % separat (Posten Pfandsteuer, LDMG RSF 635.1.1 Art. 23). Nicht enthalten: Art. 2 ch. 11 lit. e «confection d’une cédule hypothécaire» Fr. 30 (ob auch beim Register-Schuldbrief fällig, offen).',
  }),
  GE: kombi('GE', {
    erlassName: 'Règlement sur les émoluments des notaires (REmNot) / REmORFDIT', erlassNr: 'RSG E 6 05.03 / E 1 50.06',
    artikel: 'Art. 16 al. 1 / Art. 4', stand: '30.4.2015 / 24.4.2024',
    hinweis: 'Beurkundung 5 ‰ bis 200 000 (mindestens 100), dann 4 ‰, 3 ‰, 2 ‰, 1 ‰ (REmNot Art. 16 al. 1) + Eintrag 0,085 % der Pfandsumme, höchstens 20 000 je Pfand, Löschung inbegriffen (REmORFDIT Art. 4). Pfandsteuer 1,365 % separat (Posten Pfandsteuer). Nicht enthalten: Titelausfertigung 100–200 (REmNot Art. 16 al. 4).',
  }),
  VS: kombi('VS', {
    erlassName: 'Tarif des émoluments des notaires / Ordonnance cantonale sur le registre foncier', erlassNr: 'RS 178.104 / 211.611',
    artikel: 'Art. 13 al. 2 / Art. 32 al. 2 let. c, al. 3', stand: '1.1.2011 / 1.10.2025',
    hinweis: 'Beurkundung gages immobiliers (200 bis 10 000, dann 5 ‰ / 4 ‰ / 3 ‰ / 2 ‰ / 1 ‰, ohne Maximum) + Eintrag Register-Schuldbrief und Hypothek 1 ‰ (100–2 500), die Pfandsumme für den Eintrag auf volle 1 000 aufgerundet. Pfandsteuer separat (Posten Pfandsteuer, LDM RS 643.1 Art. 16). Nicht enthalten: Papier-Schuldbrief 2,5 ‰ (let. b).',
  }),
  VD: kombi('VD', {
    erlassName: 'Tarif des honoraires dus aux notaires (TNo) / Loi sur le registre foncier (LRF)', erlassNr: 'BLV 178.11.2 / 211.61',
    artikel: 'Art. 20 al. 3 / Art. 28', stand: '1.3.2016 / 1.1.2018',
    hinweis: 'Beurkundung 5 ‰ bis 100 000 (mindestens 100), degressiv bis 0,125 ‰ ab 20 Mio. (TNo Art. 20 al. 3) + Eintrag 1,5 ‰ (100–20 000 je Operation, LRF Art. 28). Pfandsteuer 2 ‰ (Stempelsteuer nach LTim) separat (Posten Pfandsteuer). Quelle: lexfind (Fassungen generiert 2019–2021, als «Actuelle» gekennzeichnet); ob TNo, LRF und LTim danach geändert wurden, liess sich am amtlichen BLV-Portal nicht prüfen (das Portal liefert ohne Skript keinen Text).',
  }),
  NE: kombi('NE', {
    erlassName: 'Arrêté fixant le tarif des émoluments des notaires / Loi concernant le tarif des émoluments du registre foncier (LERF)', erlassNr: 'RSN 166.31 / 215.411.6',
    artikel: 'Art. 14 ch. 44 / Art. 10', stand: '13.5.2015 / 1.8.2013',
    hinweis: 'Beurkundung Pauschalstufen für die Constitution d’un droit de gage immobilier (500 bis 100 000, dann +200 je 100 000 bis 1,3 Mio., +100 je 100 000 bis 3 Mio., ab 3 000 001 = 4 700) + Eintrag 2 ‰ bis 2 Mio., 1,5 ‰ auf dem Überschuss (mindestens 50). Keine Pfandsteuer. Nicht enthalten: Ziff. 45 Réquisition d’inscription 100 (Zuordnung offen). Zum Tippfehler im Quelltext bei der Stufe 1,1–1,2 Mio. siehe SONDERTARIFE.schuldbrief.NE.',
  }),
  TI: kombi('TI', {
    erlassName: 'Legge sulla tariffa notarile / Legge sulle tariffe per le operazioni nel Registro fondiario (LTORF)', erlassNr: 'RL 952.300 / 216.200',
    artikel: 'Art. 6 i.V.m. Art. 5 cpv. 1 / Art. 25', stand: '1.7.2015 / 1.1.2012',
    hinweis: 'Beurkundung: Höchsttarif Art. 6 LTN (Lesart A: voller Art.-5-Satz bis 100 000, halbe Sätze auf dem Mehrbetrag; 1 Mio. = 2 187.50; Lesart B «halbe Gesamtgebühr ab 100 000» ergäbe 1 937.50, offen) + Eintrag 7 ‰ ohne Minimum (Art. 25). Keine Pfandsteuer.',
  }),
  JU: kombi('JU', {
    erlassName: 'Décret fixant les émoluments des notaires / Décret fixant les émoluments du registre foncier', erlassNr: 'RSJU 189.61 / 176.331',
    artikel: 'Art. 10 al. 1 / Art. 7, Art. 8 ch. 4 lit. a', stand: '1.10.1994 / 1.1.2017',
    hinweis: 'Beurkundung 5 ‰ der ersten 100 000 (mindestens 100), dann 3,5 ‰, 3 ‰, 2 ‰, 1 ‰ (Art. 10 al. 1) + Eintrag 1 ‰ in Franken, Minimum 40 und Maximum 10 000 Punkte à CHF 1.05 (Art. 7) + Forfait 70 Punkte = 73.50 für die Erstellung der Schuldbrief-Urkunde (Art. 8 ch. 4 lit. a; die Emolumente werden nach Art. 3 kumuliert, der Forfait als eigener Teil gewählt, weil der Posten ein Schuldbrief ist). Lesart des ‰-Satzes in Franken (nicht in Punkten) siehe GRUNDBUCH_EINTRAG.grundpfand.JU. Pfandsteuer 3,5 ‰ separat (Posten Pfandsteuer).',
  }, [{ etikett: 'Forfait Schuldbrief-Urkunde (70 Punkte)', regel: { typ: 'fix', chf: 73.5 } }]),

  // Bewusste Ausnahme (RL-26, Entscheid B-T4 «bleibt»): Der Notariatsteil Uri ist
  // `formel_extern` (kein amtlicher Tarif). Eine `summe` damit würde den ganzen
  // Posten «nicht beziffert» machen. UR zeigt darum NUR den amtlichen Eintragsteil
  // mit dem Hinweis «Nur Eintragsgebühr …», kein `summe`-Objekt.
  UR: { ...eintrag('UR'), hinweis: 'Nur Eintragsgebühr (amtlicher Grundbuchgebührentarif); Beurkundung durch freies Notariat ohne amtlichen Tarif — beim Notariat erfragen.' },
};
