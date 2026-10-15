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
// Nicht Teil von Teil 1: Romandie und Tessin (FR, GE, VS, VD, NE, TI, JU, Teil 2)
// sowie die Kantone ohne Notariatsteil in SONDERTARIFE (BE, AI, AR, BL, SO, ZG)
// und SZ (eine einzige Gebühr nach Nr. 2, kein Summenfall). Sie bleiben unverändert
// auf der bisherigen Tabelle GRUNDPFAND in notariat-grundbuch.ts (bis Teil 2).
// Stand der Erlasse: am 15.10.2026 an der amtlichen Quelle geöffnet.

import type { KantonCode, KantonalerTarif } from './typen';
import { SONDERTARIFE } from './beurkundung';
import { GRUNDBUCH_EINTRAG } from './grundbuch';
import { GRUNDPFAND as GRUNDPFAND_BISHER } from './notariat-grundbuch';

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
  ...GRUNDPFAND_BISHER,

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
    hinweis: 'Beurkundung 1 ‰ + Eintrag 1 ‰ der Pfandsumme, je mindestens 100. Mehrwertsteuer nach § 2 zusätzlich.',
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
  UR: { ...eintrag('UR'), hinweis: GRUNDPFAND_BISHER.UR.hinweis },
};
