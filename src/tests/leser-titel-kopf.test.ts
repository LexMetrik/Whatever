import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { titelKennung, zeigeVolltitel } from '../pages/gesetz-leser/v3/erlassAnsicht';
import {
  KENNUNG_MAX_ZEICHEN, kopfTitelZeile, tabTitel, titelOhneKlammerSuffix,
} from '../pages/gesetz-leser/helpers';

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
// `erlassWortlaut.titelKennung` den Deckel `KENNUNG_MAX_ZEICHEN` entfernen.

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
const LUGUE = {
  titel: 'Übereinkommen über die gerichtliche Zuständigkeit und die Anerkennung und Vollstreckung von Entscheidungen in Zivil- und Handelssachen (LugÜ)',
  kuerzel: 'LugÜ',
};
const UNO_ANTIFOLTER = {
  titel: 'Übereinkommen vom 10. Dezember 1984 gegen Folter und andere grausame, unmenschliche oder erniedrigende Behandlung oder Strafe',
  kuerzel: 'UN-Antifolterkonvention',
};
const STPO = { titel: 'Schweizerische Strafprozessordnung (Strafprozessordnung, StPO)', kuerzel: 'StPO' };
const ZH_230 = {
  titel: 'Einführungsgesetz zum Schweizerischen Zivilgesetzbuch (EG ZGB) (LS 230)',
  kuerzel: 'Einführungsgesetz zum Schweizerischen Zivilgesetzbuch (EG ZGB)',
};

describe('E-D16-B01 · titelKennung: nur echte Kennungen, nie Volltitel oder Fragmente', () => {
  it('Registerwert == Volltitel (mit Klammer-Suffix): keine Kennung, Titel steht EINMAL', () => {
    expect(titelKennung(AR_822_111)).toBeNull();
    expect(kopfTitelZeile(AR_822_111, titelKennung(AR_822_111))).toBe(AR_822_111.titel);
  });

  it('Fragment als Registerwert (BS-390.760): keine Kennung, kein Anhang «(handelnd aufgrund …)»', () => {
    expect(titelKennung(BS_390_760)).toBeNull();
    expect(kopfTitelZeile(BS_390_760, titelKennung(BS_390_760))).toBe(BS_390_760.titel);
  });

  it('Deckel: ein Registerwert über KENNUNG_MAX_ZEICHEN ist keine Kennung mehr', () => {
    const lang = 'K'.repeat(KENNUNG_MAX_ZEICHEN + 1);
    expect(titelKennung({ titel: `Irgendein Vertrag ${'x'.repeat(100)}`, kuerzel: lang })).toBeNull();
    const knapp = 'K'.repeat(KENNUNG_MAX_ZEICHEN);
    expect(titelKennung({ titel: `Irgendein Vertrag ${'x'.repeat(100)}`, kuerzel: knapp })).toBe(knapp);
  });

  it('Gegenprobe: echte Kürzel/Kurztitel bleiben Kennung (LugÜ, UN-Antifolterkonvention)', () => {
    expect(titelKennung(LUGUE)).toBe('LugÜ');
    expect(titelKennung(UNO_ANTIFOLTER)).toBe('UN-Antifolterkonvention');
    expect(kopfTitelZeile(LUGUE, 'LugÜ')).toBe(
      'Übereinkommen über die gerichtliche Zuständigkeit und die Anerkennung und Vollstreckung von Entscheidungen in Zivil- und Handelssachen',
    );
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
    expect(tabTitel(STPO.kuerzel, STPO.titel)).toBe('StPO (Strafprozessordnung) — LexMetrik');
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

  it('keine Kennung über dem Deckel; nie Kennung UND derselbe Wert noch einmal in der Titelzeile', () => {
    const fehler: string[] = [];
    for (const e of REGISTER) {
      const kennung = titelKennung(e);
      const zeile = kopfTitelZeile(e, kennung);
      if (kennung && kennung.length > KENNUNG_MAX_ZEICHEN) fehler.push(`${e.key}: Kennung ${kennung.length} Zeichen`);
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
