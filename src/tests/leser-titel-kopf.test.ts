import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { titelKennung, zeigeVolltitel } from '../pages/gesetz-leser/v3/erlassAnsicht';
import { kopfTitelZeile, tabTitel, titelOhneKlammerSuffix } from '../pages/gesetz-leser/helpers';
import { kuerzelIstTitelSchluss, titelMitSchluss, titelSchlussSignal } from '../pages/gesetz-leser/titelSchluss';

// ═══ W2·17-UI-BEFUNDE (Titel-Fixes, 1.10.2026) · Kopf-Titel und Reitertitel ═══
//
// Befunde (Bug-Check Gesetzesleser, Belege im Scratchpad leser/befund-*):
//  · E-D16-B01 — `titelKennung` setzte Registerwerte, die Volltitel/Fragmente
//    sind (kuerzel == titel; «handelnd aufgrund …»), als nicht umbrechende
//    «Kennung» vor den Titel: Titel doppelt, Seitenüberlauf (AR-822.111 @390:
//    scrollWidth 1434).
//  · PA-6-B04 — ArGV 2/3/4: `titelOhneKlammerSuffix` strich den Sachtitel
//    («(Gesundheitsschutz)») und die Titelzeile hängte «(ArGV 3)» ein zweites Mal an.
//  · PA-6-B05 — PVÜ/RBÜ verloren die Revisionsangabe im Titel.
//  · PA-6-B06 — Reitertitel «RBÜ (revidiert in Paris am 24. Juli 1971, RBÜ)».
//
// Die Fälle sind WÖRTLICH aus `public/normtext/register.json` (Stand 1.10.2026).
// ROT ZU BEKOMMEN: in `helpers.titelOhneKlammerSuffix` die drei Schutzzweige
// (Registerwert == Titel, «revidiert», Kürzel-Klammer davor) streichen bzw. in
// `kopfTitelZeile`/`titelKennung` den Zweig `kuerzelIstTitelSchluss` entfernen.
//
// NACHZUG 2.10.2026 (Prüfer-Befund NICHT LANDBAR F1–F4): der Längen-Deckel 70
// verwarf bei vier Kantonserlassen den abgespaltenen Titel-SCHLUSS (der Registerwert
// `kuerzel` ist dort kein Kurztitel, amtlich gilt `titel + ", " + kuerzel`). An seine
// Stelle tritt die inhaltliche Regel `titelSchluss.ts` (S1–S3), bewiesen an allen 41
// Registerwerten «Kürzel ≠ Titel, nicht im Titel, Länge > 30» (Tabelle unten).

const ARGV3 = { titel: 'Verordnung 3 zum Arbeitsgesetz (ArGV 3) (Gesundheitsschutz)', kuerzel: 'ArGV 3' };
const ARGV4 = {
  titel: 'Verordnung 4 zum Arbeitsgesetz (ArGV 4) (Industrielle Betriebe, Plangenehmigung und Betriebsbewilligung)',
  kuerzel: 'ArGV 4',
};
const ARGV2 = {
  titel: 'Verordnung 2 zum Arbeitsgesetz (ArGV 2) (Sonderbestimmungen für bestimmte Gruppen von Betrieben oder Arbeitnehmern und Arbeitnehmerinnen)',
  kuerzel: 'ArGV 2',
};
const PVUE = {
  titel: 'Pariser Verbandsübereinkunft zum Schutz des gewerblichen Eigentums (revidiert in Stockholm am 14. Juli 1967)',
  kuerzel: 'PVÜ',
};
const RBUE = {
  titel: 'Berner Übereinkunft zum Schutz von Werken der Literatur und Kunst (revidiert in Paris am 24. Juli 1971, RBÜ)',
  kuerzel: 'RBÜ',
};
const AR_822_111 = {
  titel: 'Gebührentarif zum Bundesgesetz vom 13. März 1964 über die Arbeit in Industrie, Gewerbe und Handel (Arbeitsgesetz)',
  kuerzel: 'Gebührentarif zum Bundesgesetz vom 13. März 1964 über die Arbeit in Industrie, Gewerbe und Handel (Arbeitsgesetz)',
};
const BS_390_760 = {
  titel: 'Vertrag betreffend die Kremation von Leichen aus dem Kanton Aargau im Krematorium der Stadt Basel zwischen dem Kanton Basel-Stadt, vertreten durch seinen Regierungsrat, handelnd aufgrund von § 17 des Gesetzes betreffend die Bestattungen, und dem Kanton Aargau namens dessen Gemeinden, vertreten durch den Regierungsrat',
  kuerzel: 'handelnd aufgrund seines Aufsichtsrechts gemäss § 1 der Vollziehungsverordnung vom 26. Februar 1946 zum Gesetz über das öffentliche Gesundheitswesen des Kantons Aargau vom 28. November 1919',
};
// Der amtliche Titel von BS-390.760 (gesetzessammlung.bs.ch/api/de/texts_of_law/390.760,
// abgerufen 2.10.2026) — Register-`titel` + ", " + Register-`kuerzel`, Zeichen für Zeichen.
const BS_390_760_AMTLICH =
  'Vertrag betreffend die Kremation von Leichen aus dem Kanton Aargau im Krematorium der Stadt Basel zwischen dem Kanton Basel-Stadt, vertreten durch seinen Regierungsrat, handelnd aufgrund von § 17 des Gesetzes betreffend die Bestattungen, und dem Kanton Aargau namens dessen Gemeinden, vertreten durch den Regierungsrat, handelnd aufgrund seines Aufsichtsrechts gemäss § 1 der Vollziehungsverordnung vom 26. Februar 1946 zum Gesetz über das öffentliche Gesundheitswesen des Kantons Aargau vom 28. November 1919';
const LUGUE = {
  titel: 'Übereinkommen vom 30. Oktober 2007 über die gerichtliche Zuständigkeit und die Anerkennung und Vollstreckung von Entscheidungen in Zivil- und Handelssachen (Lugano-Übereinkommen, LugÜ)',
  kuerzel: 'LugÜ',
};
const UNO_ANTIFOLTER = {
  titel: 'Übereinkommen vom 10. Dezember 1984 gegen Folter und andere grausame, unmenschliche oder erniedrigende Behandlung oder Strafe',
  kuerzel: 'UN-Antifolterkonvention',
};
const BEG = { titel: 'Bundesgesetz über Bucheffekten (Bucheffektengesetz, BEG)', kuerzel: 'BEG' };
const STPO = { titel: 'Schweizerische Strafprozessordnung', kuerzel: 'StPO' };
const ZH_230 = {
  titel: 'Einführungsgesetz zum Schweizerischen Zivilgesetzbuch (EG ZGB) (LS 230)',
  kuerzel: 'Einführungsgesetz zum Schweizerischen Zivilgesetzbuch (EG ZGB)',
};

describe('E-D16-B01 · titelKennung: nur echte Kennungen, nie Volltitel oder Fragmente', () => {
  it('Registerwert == Volltitel (mit Klammer-Suffix): keine Kennung, Titel steht EINMAL', () => {
    expect(titelKennung(AR_822_111)).toBeNull();
    expect(kopfTitelZeile(AR_822_111, titelKennung(AR_822_111))).toBe(AR_822_111.titel);
  });

  it('Titel-Schluss als Registerwert (BS-390.760): keine Kennung, H1 = der VOLLE amtliche Titel (F1)', () => {
    // Amtlich (gesetzessammlung.bs.ch/api/de/texts_of_law/390.760, abgerufen 2.10.2026):
    // titel + ", " + kuerzel. Der PR-Stand dc4c1e08f verwarf den Schluss («… Gesundheitswesen
    // des Kantons Aargau vom 28. November 1919» fehlte).
    expect(titelKennung(BS_390_760)).toBeNull();
    expect(kopfTitelZeile(BS_390_760, titelKennung(BS_390_760))).toBe(BS_390_760_AMTLICH);
  });

  it('Gegenprobe: echte Kürzel/Kurztitel bleiben Kennung (LugÜ, UN-Antifolterkonvention)', () => {
    expect(titelKennung(LUGUE)).toBe('LugÜ');
    expect(titelKennung(UNO_ANTIFOLTER)).toBe('UN-Antifolterkonvention');
    expect(kopfTitelZeile(LUGUE, 'LugÜ')).toBe(
      'Übereinkommen vom 30. Oktober 2007 über die gerichtliche Zuständigkeit und die Anerkennung und Vollstreckung von Entscheidungen in Zivil- und Handelssachen',
    );
  });

  it('kein Längen-Deckel mehr: ein langer Kurztitel (Erlassform, kein Relationswort) bleibt Kennung, ein langer Titel-Schluss nicht', () => {
    const titel = `Irgendein Vertrag ${'x'.repeat(100)}`;
    const langerKurztitel = `Covid-19-Verordnung ${'Unterstützungsprogramm '.repeat(5)}Gastronomie`.trim();
    expect(langerKurztitel.length).toBeGreaterThan(100);
    expect(titelKennung({ titel, kuerzel: langerKurztitel })).toBe(langerKurztitel);
    const langerSchluss = `${'Gerichtsschreiberinnen und Gerichtsschreibern '.repeat(3)}sowie den Mitarbeitenden`;
    expect(titelKennung({ titel, kuerzel: langerSchluss })).toBeNull();
    expect(kopfTitelZeile({ titel, kuerzel: langerSchluss }, null)).toBe(`${titel}, ${langerSchluss}`);
  });

  it('Kürzel steht schon als Klammerglied im Titel (ArGV 4, RBÜ): keine zweite Kennung davor', () => {
    expect(titelKennung(ARGV4)).toBeNull();
    expect(titelKennung(RBUE)).toBeNull();
  });
});

describe('PA-6-B04 · ArGV 2/3/4: der amtliche Sachtitel bleibt, das Kürzel steht EINMAL', () => {
  it('ArGV 3: Titelzeile == amtlicher Titel', () => {
    expect(kopfTitelZeile(ARGV3, titelKennung(ARGV3))).toBe(ARGV3.titel);
  });
  it('ArGV 4: Titelzeile == amtlicher Titel (lang, aber keine Kennung davor)', () => {
    expect(kopfTitelZeile(ARGV4, titelKennung(ARGV4))).toBe(ARGV4.titel);
  });
  it('ArGV 2', () => {
    expect(kopfTitelZeile(ARGV2, titelKennung(ARGV2))).toBe(ARGV2.titel);
  });
  it('titelOhneKlammerSuffix: mit Kürzel bleibt der Sachtitel, ohne Kürzel verhält sich die Funktion wie zuvor', () => {
    expect(titelOhneKlammerSuffix(ARGV3.titel, ARGV3.kuerzel)).toBe(ARGV3.titel);
    expect(titelOhneKlammerSuffix(ARGV3.titel)).toBe('Verordnung 3 zum Arbeitsgesetz (ArGV 3)');
  });
  it('Gegenprobe: ein SR-Suffix hinter einem Kürzel-Klammerglied fällt weiter (kein Sachtitel)', () => {
    // «Titel (AKV) (760.12)» — die letzte Klammer ist eine Nummer, kein Sachtitel.
    expect(titelOhneKlammerSuffix('Einführungsverordnung zur Automobilkonzessionsverordnung (AKV) (760.12)', 'AKV'))
      .toBe('Einführungsverordnung zur Automobilkonzessionsverordnung (AKV)');
  });
  it('Gegenprobe: gewöhnliche Fälle byte-gleich (StPO, ZH-230, kein Kürzel)', () => {
    expect(kopfTitelZeile(STPO, titelKennung(STPO))).toBe('Schweizerische Strafprozessordnung (StPO)');
    expect(kopfTitelZeile(ZH_230, titelKennung(ZH_230)))
      .toBe('Einführungsgesetz zum Schweizerischen Zivilgesetzbuch (EG ZGB)');
    expect(kopfTitelZeile({ titel: 'Irgendein Reglement', kuerzel: '' }, null)).toBe('Irgendein Reglement');
  });
  it('zeigeVolltitel: dieselbe Zeichenkette wie die Titelzeile (Volltitel-Registerwert ⇒ unterdrückt)', () => {
    expect(zeigeVolltitel(AR_822_111)).toBe(false);
    expect(zeigeVolltitel(ARGV3)).toBe(true);
  });
});

describe('PA-6-B05 · PVÜ/RBÜ: die Revisionsangabe gehört zum Titel', () => {
  it('PVÜ (Titel > 80 Zeichen ⇒ Kennung davor): die Revisionsangabe bleibt im Titel', () => {
    expect(titelKennung(PVUE)).toBe('PVÜ');
    expect(kopfTitelZeile(PVUE, 'PVÜ')).toBe(PVUE.titel);
  });
  it('kurzer Titel mit Revisionsangabe: sie bleibt, das Kürzel folgt einmal (Zitierform)', () => {
    const kurz = { titel: 'Übereinkunft X (revidiert in Paris am 1. Juli 1971)', kuerzel: 'ÜX' };
    expect(titelKennung(kurz)).toBeNull();
    expect(kopfTitelZeile(kurz, null)).toBe('Übereinkunft X (revidiert in Paris am 1. Juli 1971) (ÜX)');
  });
  it('RBÜ: «(revidiert in Paris am 24. Juli 1971, RBÜ)» bleibt, das Kürzel wird nicht angehängt', () => {
    expect(kopfTitelZeile(RBUE, titelKennung(RBUE))).toBe(RBUE.titel);
  });
});

describe('PA-6-B06 · Reitertitel ohne gedoppeltes Kürzel', () => {
  it('F3: Registerwert == Volltitel (AR-822.111, ZH-212.812 …): «Titel — LexMetrik», die Klammer steht EINMAL', () => {
    expect(tabTitel(AR_822_111.kuerzel, AR_822_111.titel)).toBe(`${AR_822_111.titel} — LexMetrik`);
    const gebv = {
      titel: 'Verordnung über die Gebühren, Kosten und Entschädigungen vor dem Sozialversicherungsgericht (GebV SVGer)',
      kuerzel: 'Verordnung über die Gebühren, Kosten und Entschädigungen vor dem Sozialversicherungsgericht (GebV SVGer)',
    };
    expect(tabTitel(gebv.kuerzel, gebv.titel)).toBe(`${gebv.titel} — LexMetrik`);
  });
  it('F1: Titel-Schluss als Registerwert: der Reiter nennt den vollen Titel, nicht den Schluss als «Kürzel»', () => {
    expect(tabTitel(BS_390_760.kuerzel, BS_390_760.titel)).toBe(`${BS_390_760_AMTLICH} — LexMetrik`);
  });
  it('RBÜ: «RBÜ (revidiert in Paris am 24. Juli 1971) — LexMetrik»', () => {
    expect(tabTitel(RBUE.kuerzel, RBUE.titel)).toBe('RBÜ (revidiert in Paris am 24. Juli 1971) — LexMetrik');
  });
  it('Gegenprobe: PVÜ, ArGV 4, Klammer ohne Kürzel unverändert; StPO verliert nur das gedoppelte Glied', () => {
    expect(tabTitel(PVUE.kuerzel, PVUE.titel)).toBe('PVÜ (revidiert in Stockholm am 14. Juli 1967) — LexMetrik');
    expect(tabTitel(ARGV4.kuerzel, ARGV4.titel))
      .toBe('ArGV 4 (Industrielle Betriebe, Plangenehmigung und Betriebsbewilligung) — LexMetrik');
    expect(tabTitel('OR', 'Bundesgesetz betreffend die Ergänzung des Schweizerischen Zivilgesetzbuches (Obligationenrecht)'))
      .toBe('OR (Obligationenrecht) — LexMetrik');
    // gleiche Regel wie bei RBÜ: das Kürzel steht VOR der Klammer, nicht noch einmal darin
    // (88 Register-Einträge, wörtlich BEG: «… (Bucheffektengesetz, BEG)»)
    expect(tabTitel(BEG.kuerzel, BEG.titel)).toBe('BEG (Bucheffektengesetz) — LexMetrik');
    // StPO steht im Register OHNE Klammer: der Reiter ist unverändert «Kürzel (Titel)»
    expect(tabTitel(STPO.kuerzel, STPO.titel)).toBe('StPO (Schweizerische Strafprozessordnung) — LexMetrik');
  });
  it('das Kürzel bleibt, wenn es das einzige Klammerglied ist (EMRK-Weiche greift weiter)', () => {
    expect(tabTitel('EMRK', 'Konvention zum Schutze der Menschenrechte und Grundfreiheiten (EMRK)'))
      .toBe('EMRK — LexMetrik');
  });
});

// ── Korpus-Invarianten über ALLE Register-Einträge ──────────────────────────
interface RegisterEintrag { key: string; kuerzel: string; titel: string }
const REGISTER = (JSON.parse(readFileSync('public/normtext/register.json', 'utf8')) as {
  erlasse: RegisterEintrag[];
}).erlasse;

describe('Korpus-Invarianten (public/normtext/register.json)', () => {
  it('das Register ist da und gross genug, damit die Invarianten etwas prüfen', () => {
    expect(REGISTER.length).toBeGreaterThan(1500);
  });

  it('nie Kennung UND derselbe Wert noch einmal in der Titelzeile; nie ein Titel-Schluss als Kennung', () => {
    const fehler: string[] = [];
    for (const e of REGISTER) {
      const kennung = titelKennung(e);
      const zeile = kopfTitelZeile(e, kennung);
      if (kennung && kuerzelIstTitelSchluss(e)) fehler.push(`${e.key}: Titel-Schluss als Kennung`);
      if (kennung && zeile.toLowerCase().includes(kennung.toLowerCase())) fehler.push(`${e.key}: Kennung steht noch in der Titelzeile`);
    }
    expect(fehler).toEqual([]);
  });

  it('nie «(Kürzel) (Kürzel)» in der Titelzeile', () => {
    const fehler: string[] = [];
    for (const e of REGISTER) {
      const k = e.kuerzel.trim();
      if (!k) continue;
      const zeile = kopfTitelZeile(e, titelKennung(e));
      if (zeile.includes(`(${k}) (${k})`)) fehler.push(`${e.key}: «(${k}) (${k})»`);
    }
    expect(fehler).toEqual([]);
  });

  it('die letzte Klammer verschwindet nicht, wenn sie der Sachtitel/die Revision ist (ArGV 2/3/4, PVÜ, RBÜ)', () => {
    for (const k of ['ARGV2', 'ARGV3', 'ARGV4', 'PVUE', 'RBUE']) {
      const e = REGISTER.find((x) => x.key === k)!;
      const letzte = e.titel.match(/\(([^)]*)\)\s*$/)![1];
      const zeile = kopfTitelZeile(e, titelKennung(e));
      // das Klammerglied (ohne ein angehängtes Kürzel) steht noch in der Titelzeile
      expect(zeile, k).toContain(letzte.replace(/,\s*RBÜ$/, ''));
    }
  });
});

// ═══ F1/F2 (Nachzug 2.10.2026) · der abgespaltene Titel-SCHLUSS — Regel statt Längen-Deckel ═══
//
// `titelSchluss.ts` erkennt INHALTLICH, ob der Registerwert `kuerzel` der Rest des
// amtlichen Titels nach dem letzten Komma ist (S1 klein beginnend ≥ 3 Wörter ·
// S2 Relationswort · S3 Rest + Klammer-Kürzel ohne Erlassform davor). Hier der
// Beweis an ALLEN 41 Registerwerten «Kürzel ≠ Titel, nicht im Titel enthalten,
// Länge > 30» (2.10.2026) und am ganzen Register.
// ROT ZU BEKOMMEN: in `titelSchlussSignal` einen der drei Zweige streichen — dann
// kippt der betroffene Fall der Tabelle auf «Kurztitel».

type Klasse = 'schluss' | 'kurztitel';
const KURZTITEL: Klasse = 'kurztitel';
/** key → [Klasse, Signal | Grund]. Die Zuordnung ist von Hand an der amtlichen Quelle
 *  geprüft (BS: texts_of_law-API `abbreviation` leer ⇒ Titel-Schluss, gefüllt ⇒
 *  Kurztitel; ZH: Seitentitel zh.ch; abgerufen 2.10.2026). */
const ZUORDNUNG_41: Record<string, [Klasse, string]> = {
  'BS-154.123': ['schluss', 'S2 «sowie» (BS-API: abbreviation leer, Titel = titel, kuerzel)'],
  'BS-390.760': ['schluss', 'S1 klein beginnend ≥ 3 Wörter «handelnd aufgrund …» (BS-API: abbreviation leer)'],
  'BS-953.900': ['schluss', 'S2 «betreffend» (BS-API: abbreviation leer)'],
  'ZH-211.12': ['schluss', 'S3 «Auskunftspersonen und Sachverständigen (Entschädigungsverordnung …)» (zh.ch-Seitentitel)'],
  'ZH-215.12': ['schluss', 'S2 «gemäss» (zh.ch-Seitentitel: «… über die Gebühren, Kosten und Entschädigungen gemäss Anwaltsgesetz»)'],
  'VD-vd-210360': ['schluss', 'S1 klein beginnend «en lien avec …» (amtlicher Wortlaut nicht abgerufen — unentscheidbar, der VOLLE Text steht im Kopf)'],
  ...Object.fromEntries([
    'BS-410.130', 'BS-419.901', 'BS-819.400', 'BS-RiE 789.300', 'BS-833.100', 'BS-819.872', 'BS-819.879',
    'BS-819.179', 'BS-819.879.001', 'BS-BeE 153.860', 'BS-BeE 789.310', 'BS-RiE 153.840', 'BS-419.300',
    'BS-361.200', 'BS-BeE 152.100', 'BS-153.280', 'BS-160.100', 'BS-RiE 153.300', 'BS-568.400',
    'BS-BaB 155.300', 'BS-439.140', 'BS-153.610', 'BS-RiE 411.630', 'BS-RiE 253.150', 'BS-410.120',
    'BS-BeE 750.100', 'BS-RiE 750.100', 'BS-BeE 750.110', 'BS-RiE 750.110', 'BS-410.150', 'BS-122.250',
    'BS-410.910', 'BS-410.140', 'GL-III-A.5', 'SH-221.101',
  ].map((k): [string, [Klasse, string]] => [k, [KURZTITEL, 'Erlassform als Kern, kein Relationswort, Klammer nur Zusatz']])),
};

describe('F2 · die 41 Registerwerte «Kürzel ≠ Titel, nicht im Titel, Länge > 30» — Zuordnung je Fall', () => {
  const faelle = REGISTER.filter((e) => {
    const k = e.kuerzel.trim().toLowerCase();
    const t = e.titel.trim().toLowerCase();
    return k && k !== t && !t.includes(k) && k.length > 30;
  });

  it('die Tabelle deckt GENAU die 41 Fälle des Registers ab (Register gewachsen ⇒ Tabelle nachführen)', () => {
    expect(faelle.map((e) => e.key).sort()).toEqual(Object.keys(ZUORDNUNG_41).sort());
    expect(faelle).toHaveLength(41);
  });

  it('jede Zuordnung gilt: 6 Titel-Schlüsse, 35 Kurztitel', () => {
    const falsch: string[] = [];
    for (const e of faelle) {
      const [klasse, grund] = ZUORDNUNG_41[e.key]!;
      const signal = titelSchlussSignal(e);
      if ((klasse === 'schluss') !== (signal !== null)) falsch.push(`${e.key}: erwartet ${klasse} (${grund}), Regel sagt ${signal}`);
      if (klasse === 'schluss' && !grund.startsWith(signal ?? '?')) falsch.push(`${e.key}: Signal ${signal} ≠ ${grund}`);
    }
    expect(falsch).toEqual([]);
    expect(faelle.filter((e) => ZUORDNUNG_41[e.key]![0] === 'schluss')).toHaveLength(6);
    expect(faelle.filter((e) => ZUORDNUNG_41[e.key]![0] === KURZTITEL)).toHaveLength(35);
  });

  it('Titel-Schluss ⇒ H1 = titel + ", " + kuerzel, keine Kennung; Kurztitel ⇒ nie das Kürzel mit Komma am Titel', () => {
    for (const e of faelle) {
      const kennung = titelKennung(e);
      const zeile = kopfTitelZeile(e, kennung);
      if (ZUORDNUNG_41[e.key]![0] === 'schluss') {
        expect(kennung, e.key).toBeNull();
        expect(zeile, e.key).toBe(titelMitSchluss(e));
      } else {
        expect(zeile, e.key).not.toContain(`, ${e.kuerzel.trim()}`);
      }
    }
  });

  it('amtlicher Wortlaut, Zeichen für Zeichen (BS-API / zh.ch, abgerufen 2.10.2026)', () => {
    const h1 = (key: string) => {
      const e = REGISTER.find((x) => x.key === key)!;
      return kopfTitelZeile(e, titelKennung(e));
    };
    expect(h1('BS-390.760')).toBe(BS_390_760_AMTLICH);
    expect(h1('BS-154.123')).toBe(
      'Reglement über das von den Präsidentinnen und Präsidenten, nebenamtlichen Richterinnen und Richtern, Gerichtsschreiberinnen und Gerichtsschreibern sowie den Mitarbeitenden der Gerichte abzulegende Handgelübde',
    );
    expect(h1('BS-953.900')).toBe(
      'Vereinbarung zwischen den Schweizerischen Bundesbahnen (SBB) den Schweizerischen PTT-Betrieben (PTT) den Basler Verkehrs-Betrieben (BVB) der BLT Baselland Transport AG (BLT) und den Kantonen Aargau, Basel-Landschaft, Basel-Stadt, Bern, Jura, Solothurn betreffend den integralen Tarifverbund Nordwestschweiz (TNW) ab 1. Januar 1990',
    );
    // zh.ch setzt nach «Zeuginnen,» zwei Leerzeichen; die H1 normalisiert sie (HTML).
    expect(h1('ZH-211.12')).toBe(
      'Verordnung der obersten kantonalen Gerichte über die Entschädigung der Zeugen und Zeuginnen, Auskunftspersonen und Sachverständigen (Entschädigungsverordnung der obersten Gerichte)',
    );
    expect(h1('ZH-215.12')).toBe('Verordnung des Obergerichts über die Gebühren, Kosten und Entschädigungen gemäss Anwaltsgesetz');
  });

  it('Gegenprobe Grenzfälle der Regel: kleinbeginnende Kürzel ≤ 2 Wörter und Klammer-Kürzel MIT Erlassform bleiben Kurztitel', () => {
    const t = 'Verordnung über irgendetwas ganz anderes';
    for (const k of ['eGovG', 'kEnG', 'kant. BBV', 'kantonale Waldverordnung', 'ad personam-Verordnung',
      'Anerkennungsverordnung Inland (AVO Inland)', 'Notariatsgebührenverordnung (221.101 (ergänzend 211.433))', 'Datenschutz (DSG)']) {
      expect(kuerzelIstTitelSchluss({ titel: t, kuerzel: k }), k).toBe(false);
    }
    // Aufzählungs-Buchstabe (S1) und Identität/Teilstring (nie Schluss)
    expect(titelSchlussSignal({ titel: 'Vertrag über X', kuerzel: 'b) den Betrieb der Hafenbahn' })).toBe('S1');
    expect(kuerzelIstTitelSchluss({ titel: 'Vertrag über X sowie Y', kuerzel: 'sowie Y' })).toBe(false);
    expect(kuerzelIstTitelSchluss({ titel: '', kuerzel: 'handelnd aufgrund seines Rechts' })).toBe(false);
  });
});

describe('F2 · Korpus-Invarianten der Titel-Schluss-Regel (alle Register-Einträge)', () => {
  it('die Regel trifft GENAU die sechs Titel-Schlüsse — jede weitere Zuordnung ist ein Review-Fall', () => {
    const treffer = REGISTER.filter((e) => kuerzelIstTitelSchluss(e)).map((e) => e.key).sort();
    expect(treffer).toEqual(['BS-154.123', 'BS-390.760', 'BS-953.900', 'VD-vd-210360', 'ZH-211.12', 'ZH-215.12']);
  });

  it('nichts wird verworfen: der Registerwert steht in Kennung + H1 — oder ist Teil des Titels (§1)', () => {
    const fehler: string[] = [];
    for (const e of REGISTER) {
      const k = e.kuerzel.trim().toLowerCase();
      if (!k) continue;
      const kennung = titelKennung(e);
      const sichtbar = `${kennung ?? ''} ${kopfTitelZeile(e, kennung)}`.toLowerCase();
      if (!sichtbar.includes(k) && !e.titel.toLowerCase().includes(k)) fehler.push(`${e.key}: «${e.kuerzel}» fehlt`);
    }
    expect(fehler).toEqual([]);
  });

  it('Titelschluss-Fälle: Kopf und Reiter nennen denselben vollen Titel', () => {
    for (const e of REGISTER.filter((x) => kuerzelIstTitelSchluss(x))) {
      expect(tabTitel(e.kuerzel, e.titel), e.key).toBe(`${titelMitSchluss(e)} — LexMetrik`);
      expect(kopfTitelZeile(e, titelKennung(e)), e.key).toBe(titelMitSchluss(e));
    }
  });
});

describe('F3 · die Test-Vorlagen stehen wörtlich im Register (keine erfundene Titelform)', () => {
  const VORLAGEN: Array<[string, { titel: string; kuerzel: string }]> = [
    ['ARGV2', ARGV2], ['ARGV3', ARGV3], ['ARGV4', ARGV4], ['PVUE', PVUE], ['RBUE', RBUE],
    ['AR-822.111', AR_822_111], ['BS-390.760', BS_390_760], ['LUGUE', LUGUE], ['UNO_ANTIFOLTER', UNO_ANTIFOLTER],
    ['STPO', STPO], ['ZH-230', ZH_230], ['BEG', BEG],
  ];
  it.each(VORLAGEN)('%s', (key, vorlage) => {
    const e = REGISTER.find((x) => x.key === key)!;
    expect(e, `${key} fehlt im Register`).toBeDefined();
    expect({ titel: e.titel, kuerzel: e.kuerzel }).toEqual(vorlage);
  });
});
