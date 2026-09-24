import { describe, it, expect } from 'vitest';
import { berechneVerjaehrung } from '../lib/verjaehrung';
import type { VerjaehrungInput } from '../lib/verjaehrung';

// RL-14 PR 2 (Prüfung Rechtslogik 23.9.2026, Befunde F5-03, F5-04/Q1/S3-e,
// UI-04, F5-09 Verzicht-Teil): Einredeverzicht (Art. 141 OR) im Rechner.
//
// Soll je Fall SELBST aus dem Normwortlaut hergeleitet (F5-09), nicht aus der
// Engine-Annahme übernommen:
// - Art. 141 Abs. 1 OR (Fassung AS 2018 5343, in Kraft 1.1.2020; Fedlex SR 220,
//   Konsolidierung 1.1.2026, abgerufen 24.9.2026:
//   https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/27/317_321_377/20260101/de/xml/fedlex-data-admin-ch-eli-cc-27-317_321_377-20260101-de-xml-12.xml):
//   «Der Schuldner kann ab Beginn der Verjährung jeweils für höchstens zehn
//   Jahre auf die Erhebung der Verjährungseinrede verzichten.»
//   → «ab Beginn der Verjährung» regelt die ZULÄSSIGKEIT (kein Vorausverzicht),
//     «höchstens zehn Jahre» die DAUER je Verzicht.
// - Botschaft BBl 2014 235 S. 262: «Bewusst nicht im Gesetz geregelt wird die
//   Frage, ab wann der Verjährungsverzicht gilt» — Moment des Verzichts oder
//   Verjährungseintritt; Auslegung der Erklärung. Zu lange oder unbegrenzte
//   Dauer → Kürzung auf die Höchstdauer (Art. 20 Abs. 2 OR); eine gesetzliche
//   Ersatzdauer gibt es nicht.
// - Entscheid David W-06 (24.9.2026), Rechner Variante a: Standard «ab
//   Erklärung» als OFFENGELEGTE Lesart mit Hinweis auf die Alternative.
// - Art. 132 Abs. 2 i.V.m. Art. 77 Abs. 1 Ziff. 3 OR: Jahresfrist endet am
//   zahlengleichen Tag; fehlt er, am letzten Tag des Monats.
// - aArt. 141 Abs. 1 OR (Fassung 1.11.2019, Fedlex-Filestore PDF/A
//   https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/27/317_321_377/20191101/de/pdf-a/fedlex-data-admin-ch-eli-cc-27-317_321_377-20191101-de-pdf-a.pdf):
//   «Auf die Verjährung kann nicht zum voraus verzichtet werden.»
// - Art. 49 Abs. 4 SchlT ZGB (Fedlex SR 210, Fassung 1.7.2026): «Im Übrigen
//   gilt das neue Recht für die Verjährung ab dem Zeitpunkt seines
//   Inkrafttretens.» → Verzicht ab 1.1.2020 nach neuem Art. 141 OR.

// Ordentliche Frist (Art. 127/130 OR): Fälligkeit 15.1.2020 → Eintritt Di 15.1.2030.
const base = (over: Partial<VerjaehrungInput>): VerjaehrungInput => ({
  regime: 'ordentlich',
  beginnRelativ: '2020-01-15',
  stichtag: '2026-06-04',
  kanton: 'ZH',
  ...over,
});

const alleTexte = (r: ReturnType<typeof berechneVerjaehrung>): string =>
  [r.ergebnis, ...r.rechenweg.map((s) => `${s.beschreibung} ${s.zwischenergebnis}`), ...r.annahmen, ...r.warnungen].join('\n');

describe('RL-14 · F5-04/S3-e — Verzichtsdauer läuft ab Erklärung (W-06 a), offengelegt', () => {
  it('Verzicht 1.12.2029 für 5 Jahre → Einrede ausgeschlossen bis 1.12.2034 (nicht 15.1.2035 «ab Eintritt»)', () => {
    // Art. 141 Abs. 1 OR: 5 Jahre ≤ 10 zulässig; Laufbeginn nach W-06 a =
    // Erklärungsdatum 1.12.2029 → 1.12.2034 (Art. 77 Abs. 1 Ziff. 3 OR).
    const r = berechneVerjaehrung(base({ verzicht: { datum: '2029-12-01', jahre: 5 } }));
    expect(r.verjaehrungISO).toBe('2030-01-15');
    expect(r.verzichtBisISO).toBe('2034-12-01');
  });

  it('Laufbeginn ist als Annahme mit Alternative offengelegt, nicht als Gesetzesregel', () => {
    const r = berechneVerjaehrung(base({ verzicht: { datum: '2029-12-01', jahre: 5 } }));
    const annahme = r.annahmen.find((a) => /Verzichtserklärung/.test(a));
    expect(annahme, r.annahmen.join('\n')).toBeDefined();
    expect(annahme).toContain('BBl 2014 235');
    // Alternative Lesart «ab Verjährungseintritt» mit ihrem Datum (15.1.2030 + 5 J.)
    expect(annahme).toMatch(/Verjährungseintritt/);
    expect(annahme).toContain('15.01.2035');
    // Kein Rechtssatz «ab Verjährungseintritt» im Rechenweg
    expect(alleTexte(r)).not.toMatch(/höchstens 10 Jahre ab Verjährungseintritt/);
  });

  it('Verzicht «für 12 Jahre» → auf 10 Jahre ab Erklärung gekürzt (Art. 20 Abs. 2 OR, BBl 2014 262)', () => {
    const r = berechneVerjaehrung(base({ verzicht: { datum: '2029-12-01', jahre: 12 } }));
    expect(r.verzichtBisISO).toBe('2039-12-01');
    expect(r.warnungen.some((w) => /gekürzt/.test(w))).toBe(true);
  });
});

describe('RL-14 · Verzicht mit Enddatum («bis …»)', () => {
  it('Fall V6: fällig 1.3.2017, Erklärung 15.9.2026, bis 31.12.2029 → Enddatum wörtlich, kein «ab Beginn der Verjährung»', () => {
    // Art. 141 Abs. 1 OR: 15.9.2026 → 31.12.2029 = 3 J. 3 M. ≤ 10 J. → zulässig.
    const r = berechneVerjaehrung(base({
      beginnRelativ: '2017-03-01', stichtag: '2028-06-01',
      verzicht: { datum: '2026-09-15', bis: '2029-12-31' },
    }));
    expect(r.verjaehrungISO).toBe('2027-03-01'); // Mo
    expect(r.verzichtBisISO).toBe('2029-12-31');
    expect(alleTexte(r)).not.toMatch(/ab Beginn der Verjährung/);
    expect(alleTexte(r)).not.toMatch(/ab Verjährungseintritt/);
  });

  it('Grenze: Erklärung 15.1.2026 → Ende 15.1.2036 zulässig (ohne Kürzung)', () => {
    const r = berechneVerjaehrung(base({ verzicht: { datum: '2026-01-15', bis: '2036-01-15' } }));
    expect(r.verzichtBisISO).toBe('2036-01-15');
    expect(r.warnungen.some((w) => /gekürzt|Höchstdauer/.test(w)), r.warnungen.join('\n')).toBe(false);
  });

  it('Grenze: Erklärung 15.1.2026 → Ende 16.1.2036 überschreitet 10 Jahre → Warnung, gekürzt auf 15.1.2036', () => {
    const r = berechneVerjaehrung(base({ verzicht: { datum: '2026-01-15', bis: '2036-01-16' } }));
    expect(r.verzichtBisISO).toBe('2036-01-15');
    const w = r.warnungen.find((x) => /Höchstdauer/.test(x));
    expect(w, r.warnungen.join('\n')).toBeDefined();
    expect(w).toContain('15.01.2036');
  });

  it('Schaltjahr: Erklärung 29.2.2028 → Höchstdauer endet 28.2.2038 (Art. 77 Abs. 1 Ziff. 3 OR)', () => {
    expect(berechneVerjaehrung(base({ verzicht: { datum: '2028-02-29', bis: '2038-02-28' } })).verzichtBisISO).toBe('2038-02-28');
    const r = berechneVerjaehrung(base({ verzicht: { datum: '2028-02-29', bis: '2038-03-01' } }));
    expect(r.verzichtBisISO).toBe('2038-02-28');
    expect(r.warnungen.some((w) => /Höchstdauer/.test(w))).toBe(true);
  });

  it('Enddatum UND Jahresangabe → das Enddatum der Erklärung ist massgeblich (offengelegt)', () => {
    const r = berechneVerjaehrung(base({ verzicht: { datum: '2026-09-15', jahre: 2, bis: '2029-12-31' } }));
    expect(r.verzichtBisISO).toBe('2029-12-31');
    expect(r.annahmen.some((a) => /Enddatum/.test(a))).toBe(true);
  });

  it('Enddatum nicht nach der Erklärung → Verzicht unberücksichtigt, Warnung', () => {
    const r = berechneVerjaehrung(base({ verzicht: { datum: '2026-09-15', bis: '2026-09-15' } }));
    expect(r.verzichtBisISO).toBeUndefined();
    expect(r.warnungen.some((w) => /Enddatum/.test(w))).toBe(true);
  });
});

describe('RL-14 · UI-04 — Verzicht ohne (gültige) Dauer wird nicht still auf 10 Jahre gesetzt', () => {
  it('ohne Dauer → Warnung (keine gesetzliche Ersatzdauer, BBl 2014 262); gerechnet mit der Höchstdauer ab Erklärung', () => {
    // Botschaft: unbegrenzter Verzicht → Kürzung auf die Höchstdauer (Art. 20
    // Abs. 2 OR); keine Ersatzdauer → offenlegen, nicht still vorgeben.
    const r = berechneVerjaehrung(base({ verzicht: { datum: '2029-12-01' } }));
    const w = r.warnungen.find((x) => /ohne Dauer/.test(x));
    expect(w, r.warnungen.join('\n')).toBeDefined();
    expect(w).toContain('BBl 2014 235');
    expect(r.verzichtBisISO).toBe('2039-12-01');
  });

  it.each([0, -5, NaN])('Dauer %s Jahre ist ungültig → Verzicht unberücksichtigt, Warnung (kein stilles Default)', (jahre) => {
    const r = berechneVerjaehrung(base({ verzicht: { datum: '2029-12-01', jahre } }));
    expect(r.verzichtBisISO).toBeUndefined();
    expect(r.warnungen.some((w) => /ungültig/.test(w)), r.warnungen.join('\n')).toBe(true);
  });
});

describe('RL-14 · F5-03 — wirksamer Einredeverzicht: verjährt, aber Einrede ausgeschlossen', () => {
  it('Eintritt 1.3.2027, Verzicht bis 31.12.2029, Stichtag 1.6.2028 → kein «als Einrede geltend zu machen»', () => {
    // Art. 142 OR: Verjährung nur auf Einrede; Art. 141 Abs. 1 OR: auf die
    // Erhebung der Einrede ist bis 31.12.2029 verzichtet → am Stichtag
    // ausgeschlossen. Der Eintritt der Verjährung selbst bleibt (1.3.2027).
    const r = berechneVerjaehrung(base({
      beginnRelativ: '2017-03-01', stichtag: '2028-06-01',
      verzicht: { datum: '2026-09-15', bis: '2029-12-31' },
    }));
    expect(r.verjaehrtAmStichtag).toBe(true);
    expect(r.einredeAusgeschlossenAmStichtag).toBe(true);
    expect(r.ergebnis).toContain('Einrede durch Verzicht bis 31.12.2029 ausgeschlossen');
    expect(r.ergebnis).not.toContain('als Einrede geltend zu machen');
  });

  it('Verzicht abgelaufen (bis 1.12.2030, Stichtag 1.6.2031) → Einrede wieder erhebbar, Hinweis auf den Ablauf', () => {
    const r = berechneVerjaehrung(base({ stichtag: '2031-06-01', verzicht: { datum: '2029-12-01', jahre: 1 } }));
    expect(r.verzichtBisISO).toBe('2030-12-01');
    expect(r.verjaehrtAmStichtag).toBe(true);
    expect(r.einredeAusgeschlossenAmStichtag).toBe(false);
    expect(r.ergebnis).toContain('als Einrede geltend zu machen');
    expect(r.ergebnis).toMatch(/Einredeverzicht.*01\.12\.2030.*abgelaufen/);
  });

  it('gleicher Verzicht, Stichtag 1.6.2030 (nach Eintritt, vor Verzichtsende) → Einrede ausgeschlossen', () => {
    const r = berechneVerjaehrung(base({ stichtag: '2030-06-01', verzicht: { datum: '2029-12-01', jahre: 1 } }));
    expect(r.verjaehrtAmStichtag).toBe(true);
    expect(r.einredeAusgeschlossenAmStichtag).toBe(true);
    expect(r.ergebnis).toContain('Einrede durch Verzicht bis 01.12.2030 ausgeschlossen');
  });

  it('Verzicht endet vor dem Verjährungseintritt → ohne Auswirkung, kein «ausgeschlossen» im Ergebnis', () => {
    // Erklärung 15.1.2026 + 2 J. = 15.1.2028 < Eintritt 15.1.2030.
    const r = berechneVerjaehrung(base({ verzicht: { datum: '2026-01-15', jahre: 2 } }));
    expect(r.verzichtBisISO).toBe('2028-01-15');
    expect(r.ergebnis).not.toContain('ausgeschlossen');
    const schritt = r.rechenweg.find((s) => /Einredeverzicht/.test(s.beschreibung));
    expect(schritt?.zwischenergebnis).toMatch(/vor dem Verjährungseintritt/);
  });
});

describe('RL-14 · Zusammenspiel mit dem Übergangsrecht (RL-08, Art. 49 SchlT ZGB)', () => {
  it('Altfall verjährt 2.3.2015 nach bisherigem Recht; Verzicht 10.1.2022 für 5 J. → Verdikt bleibt, Einrede bis 10.1.2027 ausgeschlossen', () => {
    // Art. 49 Abs. 1 SchlT ZGB: Verjährung nach bisherigem Recht eingetreten
    // (aArt. 60 Abs. 1 OR, 10 J. ab 1.3.2005 → So → Mo 2.3.2015). Der Verzicht
    // von 2022 untersteht dem neuen Art. 141 OR (Art. 49 Abs. 4 SchlT ZGB) und
    // darf das Altrecht-Verdikt nicht überschreiben — nur die Einrede sperren.
    const r = berechneVerjaehrung(base({
      regime: 'delikt_person', beginnAbsolut: '2005-03-01', beginnRelativ: '2021-03-01', stichtag: '2023-01-01',
      verzicht: { datum: '2022-01-10', jahre: 5 },
    }));
    expect(r.uebergangsrecht?.art).toBe('bisheriges_recht');
    expect(r.verjaehrungISO).toBe('2015-03-02');
    expect(r.verjaehrtAmStichtag).toBe(true);
    expect(r.verzichtBisISO).toBe('2027-01-10');
    expect(r.ergebnis).toMatch(/^Verjährt nach bisherigem Recht/);
    expect(r.ergebnis).toContain('Einrede durch Verzicht bis 10.01.2027 ausgeschlossen');
    expect(r.ergebnis).not.toContain('als Einrede geltend zu machen');
  });

  it('Verzicht vor dem 1.1.2020 → Hinweis auf aArt. 141 Abs. 1 OR («nicht zum voraus»), fachlich prüfen', () => {
    const r = berechneVerjaehrung(base({
      beginnRelativ: '2017-03-01', stichtag: '2026-06-01', verzicht: { datum: '2019-06-01', jahre: 5 },
    }));
    expect(r.verzichtBisISO).toBe('2024-06-01');
    const w = r.warnungen.find((x) => /aArt\. 141 Abs\. 1 OR/.test(x));
    expect(w, r.warnungen.join('\n')).toBeDefined();
    expect(w).toContain('zum voraus');
  });
});
