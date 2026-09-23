import { describe, it, expect } from 'vitest';
import { berechneVerjaehrung } from '../lib/verjaehrung';
import type { VerjaehrungInput } from '../lib/verjaehrung';

// RL-08 (Prüfung Rechtslogik 23.9.2026, Befunde F5-01/F5-02/F5-09b):
// Übergangsrecht der Verjährungsrevision 2020 (Art. 49 SchlT ZGB).
//
// Normen (Soll hier SELBST aus dem Wortlaut hergeleitet, nicht aus dem Plan):
// - Art. 49 Abs. 1 SchlT ZGB (Fassung AS 2018 5343, in Kraft 1.1.2020; Fedlex
//   SR 210, Fassung 1.7.2026, https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de):
//   «Bestimmt das neue Recht eine längere Frist als das bisherige Recht, so gilt
//   das neue Recht, sofern die Verjährung nach bisherigem Recht noch nicht
//   eingetreten ist.» Abs. 2: kürzere neue Frist → bisheriges Recht.
//   Abs. 3: Beginn einer laufenden Verjährung bleibt unberührt.
// - aArt. 60 Abs. 1 OR (Fassung 1.11.2019, Fedlex SR 220,
//   https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/27/317_321_377/20191101/de/pdf-a/fedlex-data-admin-ch-eli-cc-27-317_321_377-20191101-de-pdf-a.pdf):
//   1 Jahr ab Kenntnis, «jedenfalls aber» 10 Jahre ab schädigender Handlung.
// - aArt. 67 Abs. 1 OR (gleiche Fassung): 1 Jahr ab Kenntnis, 10 Jahre ab Entstehung.
// - Art. 127/130 Abs. 1 OR (gleiche Fassung, unverändert): 10 Jahre ab Fälligkeit.
// - Art. 132 OR (Beginntag zählt nicht, Ende am zahlengleichen Tag) und
//   Art. 78 OR i.V.m. Art. 132 Abs. 2 OR (Sa/So/Feiertag → nächster Werktag)
//   gelten altes wie neues Recht gleich.

const base = (over: Partial<VerjaehrungInput>): VerjaehrungInput => ({
  regime: 'delikt',
  beginnRelativ: '2018-06-01',
  beginnAbsolut: '2018-05-01',
  stichtag: '2021-01-01',
  kanton: 'ZH',
  ...over,
});

describe('RL-08 — Altfall verjährt nach bisherigem Recht (Art. 49 Abs. 1 SchlT ZGB)', () => {
  it('F5-01 delikt_person: Verhalten 1.3.2005, Kenntnis 1.3.2021 → verjährt am 2.3.2015 (aArt. 60 Abs. 1 OR: 10 J)', () => {
    // aArt. 60 Abs. 1 OR: 10 Jahre ab 1.3.2005 → 1.3.2015 (Art. 132 OR) = Sonntag
    // → nächster Werktag Mo 2.3.2015 (Art. 78 OR i.V.m. Art. 132 Abs. 2 OR).
    // Eingetreten vor 1.1.2020 → die neue 20-J.-Frist (Art. 60 Abs. 1bis OR) gilt nicht.
    const r = berechneVerjaehrung(base({
      regime: 'delikt_person', beginnAbsolut: '2005-03-01', beginnRelativ: '2021-03-01', stichtag: '2023-01-01',
    }));
    expect(r.status).toBe('ok');
    expect(r.verjaehrtAmStichtag).toBe(true);
    expect(r.verjaehrungISO).toBe('2015-03-02');
    expect(r.uebergangsrecht?.art).toBe('bisheriges_recht');
    expect(r.uebergangsrecht?.altrechtEndeISO).toBe('2015-03-02');
    expect(r.ergebnis).toContain('Art. 49 Abs. 1 SchlT ZGB');
    expect(r.ergebnis).toMatch(/^Verjährt nach bisherigem Recht/);
  });

  it('F5-01 vertrag_person: Pflichtverletzung 1.3.2008 → verjährt am 1.3.2018 (Art. 127/130 OR: 10 J ab Fälligkeit)', () => {
    // Art. 127 OR (vor 2020 einzige Frist für vertragliche Personenschäden),
    // Fälligkeit = Pflichtverletzung (Annahme, BGE 137 III 16): 1.3.2008 + 10 J
    // = Do 1.3.2018 (Werktag). Eingetreten vor 1.1.2020 → Art. 128a OR gilt nicht.
    const r = berechneVerjaehrung(base({
      regime: 'vertrag_person', beginnAbsolut: '2008-03-01', beginnRelativ: '2021-03-01', stichtag: '2023-01-01',
    }));
    expect(r.verjaehrtAmStichtag).toBe(true);
    expect(r.verjaehrungISO).toBe('2018-03-01');
    expect(r.uebergangsrecht?.art).toBe('bisheriges_recht');
  });

  it('F5-02 delikt: Kenntnis 1.6.2018, Stichtag 1.1.2021 → verjährt am 3.6.2019 (aArt. 60 Abs. 1 OR: 1 J)', () => {
    // 1.6.2018 + 1 J = 1.6.2019 = Samstag → Mo 3.6.2019 (Art. 78 OR; Samstag
    // gleichgestellt nach BG über den Fristenlauf an Samstagen, SR 173.110.3).
    const r = berechneVerjaehrung(base({}));
    expect(r.verjaehrtAmStichtag).toBe(true);
    expect(r.verjaehrungISO).toBe('2019-06-03');
    expect(r.uebergangsrecht?.art).toBe('bisheriges_recht');
    // Die Kopfzeile widerspricht dem Befund nicht mehr (F5-02):
    expect(r.ergebnis).not.toMatch(/^Nicht verjährt/);
  });

  it('F5-02 bereicherung: Kenntnis 1.6.2018 → verjährt am 3.6.2019 (aArt. 67 Abs. 1 OR: 1 J)', () => {
    const r = berechneVerjaehrung(base({ regime: 'bereicherung' }));
    expect(r.verjaehrtAmStichtag).toBe(true);
    expect(r.verjaehrungISO).toBe('2019-06-03');
  });

  it('Grenze: Ende nach bisherigem Recht am Di 31.12.2019 → eingetreten vor dem 1.1.2020 → verjährt', () => {
    const r = berechneVerjaehrung(base({ beginnRelativ: '2018-12-31', beginnAbsolut: '2018-12-01' }));
    expect(r.verjaehrungISO).toBe('2019-12-31');
    expect(r.verjaehrtAmStichtag).toBe(true);
    expect(r.uebergangsrecht?.art).toBe('bisheriges_recht');
  });

  it('Stichtag vor dem Altrecht-Ende: nicht verjährt, Ende nach bisherigem Recht ausgewiesen', () => {
    const r = berechneVerjaehrung(base({ stichtag: '2019-05-01' }));
    expect(r.verjaehrtAmStichtag).toBe(false);
    expect(r.verjaehrungISO).toBe('2019-06-03');
  });

  it('Unterbrechung NACH dem Altrecht-Ende bleibt wirkungslos → weiterhin verjährt', () => {
    const r = berechneVerjaehrung(base({ unterbrechungen: [{ typ: 'anerkennung', datum: '2019-10-01' }] }));
    expect(r.uebergangsrecht?.art).toBe('bisheriges_recht');
    expect(r.verjaehrtAmStichtag).toBe(true);
    expect(r.verjaehrungISO).toBe('2019-06-03');
  });
});

describe('RL-08 — Gegenproben: neues Recht gilt (Art. 49 Abs. 1/3 SchlT ZGB)', () => {
  it('delikt: Kenntnis 1.3.2019 → Altrecht-Ende 2.3.2020 (nach 1.1.2020) → neue 3-J.-Frist bis 1.3.2022', () => {
    // bisher: 1.3.2019 + 1 J = So 1.3.2020 → Mo 2.3.2020 — nicht vor 1.1.2020
    // eingetreten → neues Recht, Beginn unberührt: 1.3.2019 + 3 J = Di 1.3.2022.
    const r = berechneVerjaehrung(base({ beginnRelativ: '2019-03-01', beginnAbsolut: '2019-02-01' }));
    expect(r.uebergangsrecht?.art).toBe('neues_recht');
    expect(r.uebergangsrecht?.altrechtEndeISO).toBe('2020-03-02');
    expect(r.verjaehrungISO).toBe('2022-03-01');
    expect(r.verjaehrtAmStichtag).toBe(false);
    expect(r.massgeblicheFrist).toBe('relativ');
  });

  it('delikt_person: Verhalten 10.5.2012 → Altrecht-Ende 10.5.2022 → neues Recht (3 J ab Kenntnis 1.3.2021 = 1.3.2024)', () => {
    const r = berechneVerjaehrung(base({
      regime: 'delikt_person', beginnAbsolut: '2012-05-10', beginnRelativ: '2021-03-01', stichtag: '2023-01-01',
    }));
    expect(r.uebergangsrecht?.art).toBe('neues_recht');
    expect(r.verjaehrungISO).toBe('2024-03-01'); // Fr
    expect(r.absolutEndeISO).toBe('2032-05-10'); // Mo, 20 J (Art. 60 Abs. 1bis OR)
    expect(r.verjaehrtAmStichtag).toBe(false);
  });

  it('Fälle mit Beginn ≥ 2020 bleiben unberührt (kein Übergangsrecht)', () => {
    const r = berechneVerjaehrung(base({ beginnRelativ: '2024-02-29', beginnAbsolut: '2024-02-29', stichtag: '2026-06-05' }));
    expect(r.uebergangsrecht).toBeUndefined();
    expect(r.warnungen.some((w) => w.includes('SchlT'))).toBe(false);
    expect(r.verjaehrungISO).toBe('2027-03-01'); // 28.2.2027 = So → Mo 1.3.2027
  });
});

describe('RL-08 — nicht eindeutig abbildbar → «unsicher» statt falscher Sicherheit (§8)', () => {
  it('strafbare Handlung (aArt. 60 Abs. 2 OR): Altrecht-Ende vor 2020 nicht gesichert → unsicher', () => {
    const r = berechneVerjaehrung(base({ strafbareHandlung: true }));
    expect(r.uebergangsrecht?.art).toBe('unsicher');
    expect(r.ergebnis).toMatch(/^Unsicher/);
    expect(r.warnungen.some((w) => w.includes('Art. 60 Abs. 2') && w.includes('SchlT'))).toBe(true);
  });

  it('Unterbrechung vor dem Altrecht-Ende und vor 2020 → unsicher', () => {
    const r = berechneVerjaehrung(base({ unterbrechungen: [{ typ: 'anerkennung', datum: '2019-01-15' }] }));
    expect(r.uebergangsrecht?.art).toBe('unsicher');
    expect(r.warnungen.some((w) => w.includes('SchlT'))).toBe(true);
  });

  it('Stillstand im Altrecht-Fenster → unsicher (Katalog Art. 134 OR 2020 erweitert)', () => {
    const r = berechneVerjaehrung(base({ stillstaende: [{ von: '2019-01-01', bis: '2019-12-31' }] }));
    expect(r.uebergangsrecht?.art).toBe('unsicher');
  });

  it('vertrag_person, Altrecht-Ende nach 2020 (Art. 49 Abs. 1 vs. Abs. 2 SchlT offen) → unsicher, beide Daten genannt', () => {
    // bisher: Art. 127 OR, 1.3.2015 + 10 J = Sa 1.3.2025 → Mo 3.3.2025;
    // neu: Art. 128a OR relativ 3 J ab Kenntnis 1.3.2016 = 1.3.2019 (Fr).
    const r = berechneVerjaehrung(base({
      regime: 'vertrag_person', beginnAbsolut: '2015-03-01', beginnRelativ: '2016-03-01', stichtag: '2021-01-01',
    }));
    expect(r.uebergangsrecht?.art).toBe('unsicher');
    expect(r.uebergangsrecht?.altrechtEndeISO).toBe('2025-03-03');
    expect(r.ergebnis).toContain('03.03.2025');
  });
});
