import { describe, it, expect } from 'vitest';
import {
  VV_DEFAULTS, vvZusammenstellen, pruefeVvGates, type VvAntworten,
} from '../lib/vorlagen/verjaehrungsverzicht';

// ─── Verjährungsverzichtserklärung (Art. 141 OR) ─────────────────────────────
//
// VB-01/VB-03 (Prüfung Rechtslogik 23.9.2026), Entscheid David 24.9.2026 W-06
// «Vorlage B»: Die Erklärung legt den Beginn des Verzichts selbst fest — «mit
// Wirkung ab dem Datum dieser Erklärung bis …, längstens zehn Jahre ab dem
// Datum dieser Erklärung».
//
// Normgrundlage (Fedlex SR 220, Fassung 20260101, unverändert in den
// Konsolidierungen 20261001 und 20270701, abgerufen 24.9.2026):
// https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_141
//   Art. 141 Abs. 1 OR: «Der Schuldner kann ab Beginn der Verjährung jeweils
//   für höchstens zehn Jahre auf die Erhebung der Verjährungseinrede
//   verzichten.» — «ab Beginn» regelt, AB WANN verzichtet werden darf; die
//   zehn Jahre gelten je Verzicht, ihr Laufbeginn ist bewusst offen
//   (Botschaft BBl 2014 235, S. 262).
// https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_77
//   Art. 77 Abs. 1 Ziff. 3 i.V.m. Abs. 2 OR: Jahresfrist endet am Tag gleicher
//   Zahl; fehlt er im letzten Monat, am letzten Tag dieses Monats.

const basis = (p: Partial<VvAntworten> = {}): VvAntworten => ({
  ...VV_DEFAULTS,
  absenderName: 'S AG', absenderAdresse: 'X 1, 4051 Basel',
  adressatName: 'G GmbH', adressatAdresse: 'Y 2, 8000 Zürich',
  forderungBeschrieb: 'Werklohnforderung aus Werkvertrag vom 1. Februar 2017',
  ort: 'Basel',
  ...p,
});

const verzichtSatz = (a: VvAntworten) =>
  vvZusammenstellen(a).ergebnis.dokument.absaetze.find((x) => x.bausteinId === 'VV_verzicht')!.text;

describe('Vorlage Verjährungsverzicht — Laufbeginn der Höchstdauer (VB-01, W-06 B)', () => {
  it('Fall V6: fällig 1.3.2017, Erklärung 15.9.2026, bis 31.12.2029 — kein «ab Beginn der Verjährung», Enddatum wörtlich', () => {
    const a = basis({ datum: '2026-09-15', verzichtBis: '2029-12-31' });
    const satz = verzichtSatz(a);
    expect(satz).toContain('mit Wirkung ab dem Datum dieser Erklärung bis zum 31.12.2029');
    expect(satz).toContain('längstens jedoch für zehn Jahre ab dem Datum dieser Erklärung');
    expect(satz).not.toMatch(/Beginn der Verjährung/i);
    expect(pruefeVvGates(a).blocker).toEqual([]);
  });

  it('kein Absatz, kein Disclaimer und kein Gate-Text knüpft die zehn Jahre an den Verjährungsbeginn', () => {
    const a = basis({ datum: '2026-09-15', verzichtBis: '2029-12-31' });
    const { dokument } = vvZusammenstellen(a).ergebnis;
    for (const abs of dokument.absaetze) expect(abs.text).not.toMatch(/Beginn der Verjährung/i);
    expect(dokument.disclaimer).not.toMatch(/Beginn der Verjährung/i);
    expect(dokument.disclaimer).toContain('zehn Jahre ab dem Datum der Erklärung');
    const g = pruefeVvGates({ ...a, verzichtBis: '2036-09-16' });
    for (const t of [...g.blocker, ...g.warnungen, ...g.hinweise]) {
      // Zulässigkeit «erst ab Beginn der Verjährung» darf genannt werden; die
      // LAUF-Aussage «(Höchstdauer) läuft ab Beginn der Verjährung» nicht.
      expect(t).not.toMatch(/läuft[^.]*ab Beginn der Verjährung/i);
    }
  });

  it('Hinweis legt die offene Auslegungsfrage offen und belegt sie (BBl 2014 235, S. 262)', () => {
    const hinweise = pruefeVvGates(basis({ datum: '2026-09-15', verzichtBis: '2029-12-31' })).hinweise;
    const laufbeginn = hinweise.find((h) => h.includes('BBl 2014 235'));
    expect(laufbeginn).toBeDefined();
    expect(laufbeginn).toContain('erst ab Beginn der Verjährung zulässig');
    expect(laufbeginn).toContain('je Verzicht');
    expect(laufbeginn).toContain('ab dem Datum dieser Erklärung');
  });

  it('Blanko: Verzichts-Satz trägt Laufbeginn und Begrenzung auch unausgefüllt', () => {
    const satz = verzichtSatz({ ...VV_DEFAULTS });
    expect(satz).toContain('mit Wirkung ab dem Datum dieser Erklärung bis zum ________');
    expect(satz).toContain('längstens jedoch für zehn Jahre ab dem Datum dieser Erklärung');
  });
});

describe('Vorlage Verjährungsverzicht — Grenze zehn Jahre ab Erklärung (VB-03, Art. 77 Abs. 1 Ziff. 3 OR)', () => {
  const blockerHoechstdauer = (datum: string, verzichtBis: string) =>
    pruefeVvGates(basis({ datum, verzichtBis })).blocker
      .filter((b) => b.includes('mehr als zehn Jahre nach dem Erklärungsdatum'));

  it('Erklärung 15.1.2026 → Ende 15.1.2036 zulässig', () => {
    expect(pruefeVvGates(basis({ datum: '2026-01-15', verzichtBis: '2036-01-15' })).blocker).toEqual([]);
  });

  it('Erklärung 15.1.2026 → Ende 16.1.2036 Blocker, Begründung ohne «ab Beginn der Verjährung»', () => {
    const b = blockerHoechstdauer('2026-01-15', '2036-01-16');
    expect(b).toHaveLength(1);
    expect(b[0]).toContain('Art. 141 Abs. 1 OR');
    expect(b[0]).not.toMatch(/Beginn der Verjährung/i);
  });

  it('Erklärung 29.2.2028 → Ende 28.2.2038 zulässig, 1.3.2038 Blocker (Monatsende-Regel)', () => {
    expect(pruefeVvGates(basis({ datum: '2028-02-29', verzichtBis: '2038-02-28' })).blocker).toEqual([]);
    expect(blockerHoechstdauer('2028-02-29', '2038-03-01')).toHaveLength(1);
  });

  it('Ende am oder vor dem Erklärungsdatum bleibt Blocker', () => {
    expect(pruefeVvGates(basis({ datum: '2026-01-15', verzichtBis: '2026-01-15' })).blocker)
      .toContain('Das Verzichts-Ende muss nach dem Erklärungsdatum liegen.');
  });
});
