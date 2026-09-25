import { describe, it, expect } from 'vitest';
import { waehleNeue, fuehreAdditivZusammen, kantonSortierer } from '../../scripts/normtext/entscheide-additiv';
import type { EntscheidSnapshot } from '../lib/rechtsprechung/typen';

// Minimal-Fixture: nur die Felder, die der Zusammenführ-Kern liest (id, datum) plus
// ein Marker, an dem sich «Bestand» von «frisch geholt» unterscheiden lässt.
const snap = (id: string, datum: string, herkunft: 'bestand' | 'frisch'): EntscheidSnapshot =>
  ({ id, datum, gericht: id.split('/')[id.startsWith('bund/') ? 1 : 2], zitierung: `${herkunft}:${id}` }) as unknown as EntscheidSnapshot;

// Sortierer wie eidgKorpus: Datum desc, id als totaler Tiebreaker (§2).
const nachDatum = (xs: EntscheidSnapshot[]) =>
  [...xs].sort((a, b) => (a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

const B1 = snap('kanton/ZH/zh_obergericht/A1', '2026-05-12', 'bestand');
const B2 = snap('kanton/ZH/zh_obergericht/A2', '2026-04-24', 'bestand');
const BE = snap('bund/bvger/F_1_2026', '2026-06-19', 'bestand');
const basis = [BE, B1, B2];

describe('additiver Kantonszweig (Auftrag David 25.9.2026, Stichproben auffrischen)', () => {
  it('waehleNeue: Bestands-ids fallen VOR der N-Auswahl heraus — es kommen N wirklich neue', () => {
    const geholt = [
      snap('kanton/ZH/zh_obergericht/N1', '2026-09-20', 'frisch'),
      snap('kanton/ZH/zh_obergericht/A1', '2026-05-12', 'frisch'), // schon im Bestand
      snap('kanton/ZH/zh_obergericht/N2', '2026-09-10', 'frisch'),
      snap('kanton/ZH/zh_obergericht/N3', '2026-04-01', 'frisch'),
    ];
    const ids = new Set(basis.map((s) => s.id));
    const neu = waehleNeue(geholt, ids, 3, nachDatum);
    expect(neu.map((s) => s.id)).toEqual([
      'kanton/ZH/zh_obergericht/N1', 'kanton/ZH/zh_obergericht/N2', 'kanton/ZH/zh_obergericht/N3',
    ]);
  });

  it('Bestand bleibt byte-treu und vorne; Neues kommt dazu; frische Bestands-id überschreibt nie', () => {
    const kollision = snap('kanton/ZH/zh_obergericht/A1', '2026-05-12', 'frisch');
    const n1 = snap('kanton/ZH/zh_obergericht/N1', '2026-09-20', 'frisch');
    const e1 = snap('bund/bvger/F_9_2026', '2026-09-01', 'frisch');
    const r = fuehreAdditivZusammen(basis, [
      { name: 'eidg.', angefordert: 1, geholt: 4, neu: [e1] },
      { name: 'kantonale', angefordert: 1, geholt: 5, neu: [kollision, n1] },
    ]);
    expect(r.abbruch).toBeNull();
    expect(r.auswahl.slice(0, basis.length)).toEqual(basis);
    expect(r.auswahl.map((s) => s.id)).toEqual([BE.id, B1.id, B2.id, e1.id, n1.id]);
    // Bestandsobjekt, nicht das frische (Identität, nicht nur gleiche id)
    expect(r.auswahl.find((s) => s.id === B1.id)).toBe(B1);
    expect(r.neuJeZweig).toEqual({ 'eidg.': 1, kantonale: 1 });
  });

  it('Leer-Guard: kantonale Gerichte angefordert, aber 0 geholt ⇒ Abbruch, keine Auswahl', () => {
    const r = fuehreAdditivZusammen(basis, [
      { name: 'eidg.', angefordert: 3, geholt: 12, neu: [snap('bund/bvger/F_9_2026', '2026-09-01', 'frisch')] },
      { name: 'kantonale', angefordert: 5, geholt: 0, neu: [] },
    ]);
    expect(r.abbruch).toMatch(/0 kantonale Entscheide geholt .*Korpus unberührt/);
    expect(r.auswahl).toEqual([]);
  });

  it('«0 neu» (alles schon im Bestand) ist kein Quellausfall: kein Abbruch, Bestand unverändert', () => {
    const r = fuehreAdditivZusammen(basis, [
      { name: 'kantonale', angefordert: 1, geholt: 6, neu: [] },
    ]);
    expect(r.abbruch).toBeNull();
    expect(r.auswahl).toEqual(basis);
    expect(r.neuJeZweig).toEqual({ kantonale: 0 });
  });

  it('nicht angeforderter Zweig (angefordert 0) löst den Leer-Guard nicht aus', () => {
    const r = fuehreAdditivZusammen(basis, [
      { name: 'eidg.', angefordert: 0, geholt: 0, neu: [] },
      { name: 'kantonale', angefordert: 1, geholt: 2, neu: [snap('kanton/ZH/zh_obergericht/N1', '2026-09-20', 'frisch')] },
    ]);
    expect(r.abbruch).toBeNull();
    expect(r.auswahl).toHaveLength(basis.length + 1);
  });

  // Entscheid Orchestrator 25.9.2026: additiv kantonal streng nach Datum desc (wie eidg.),
  // Vollbau unverändert nach Rang (Regeste zuerst) — damit der Vollbau byte-gleich wählt.
  const rang = (xs: EntscheidSnapshot[]) =>
    [...xs].sort((a, b) =>
      (Number(!(a as unknown as { regeste?: unknown }).regeste) - Number(!(b as unknown as { regeste?: unknown }).regeste))
      || (a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : 0)
      || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const mitRegeste = (id: string, datum: string) =>
    ({ ...snap(id, datum, 'frisch'), regeste: { text: 'R', quelle: 'opencaselaw' } }) as unknown as EntscheidSnapshot;
  const sgPool = [
    mitRegeste('kanton/SG/sg_gerichte/ALT_MIT_REGESTE', '2025-11-01'),
    snap('kanton/SG/sg_gerichte/NEU1', '2026-09-15', 'frisch'),
    snap('kanton/SG/sg_gerichte/NEU2', '2026-09-01', 'frisch'),
  ];

  it('additiv: kantonale Auswahl streng nach Datum — ein älteres Urteil mit Regeste verdrängt kein neueres', () => {
    const neu = waehleNeue(sgPool, new Set(), 2, kantonSortierer(true, rang));
    expect(neu.map((s) => s.id)).toEqual(['kanton/SG/sg_gerichte/NEU1', 'kanton/SG/sg_gerichte/NEU2']);
  });

  it('Vollbau: kantonale Auswahl bleibt die Rang-Auswahl (derselbe Sortierer, Regeste zuerst)', () => {
    expect(kantonSortierer(false, rang)).toBe(rang);
    const neu = waehleNeue(sgPool, new Set(), 2, kantonSortierer(false, rang));
    expect(neu.map((s) => s.id)).toEqual(['kanton/SG/sg_gerichte/ALT_MIT_REGESTE', 'kanton/SG/sg_gerichte/NEU1']);
  });

  it('übersprungene Gerichte werden gemeldet, nicht still verschluckt — auch beim Abbruch', () => {
    const ok = fuehreAdditivZusammen(basis, [
      { name: 'kantonale', angefordert: 2, geholt: 3, neu: [], uebersprungen: ['ag_gerichte (0 IDs)'] },
    ]);
    expect(ok.abbruch).toBeNull();
    expect(ok.uebersprungen).toEqual(['ag_gerichte (0 IDs)']);
    const ab = fuehreAdditivZusammen(basis, [
      { name: 'kantonale', angefordert: 1, geholt: 0, neu: [], uebersprungen: ['sg_gerichte (0 Details)'] },
    ]);
    expect(ab.abbruch).not.toBeNull();
    expect(ab.uebersprungen).toEqual(['sg_gerichte (0 Details)']);
  });
});
