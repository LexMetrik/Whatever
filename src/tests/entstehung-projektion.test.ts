// E3 «Entstehung am Artikel» (FAHRPLAN-MATERIALIEN-VERZAHNUNG §11.4/§11.6):
// die Projektion, aus der die Karte am Artikel ihre Begründung liest.
//
// Geprüft wird, was fachlich falsch werden KANN (§6.7): der Join-Schlüssel
// (eine verfehlte oc-Normalisierung liesse die Karte stumm bleiben), der
// ZUSCHNITT (nur, was in der Fassungshistorie wirklich vorkommt — sonst wächst
// die Datei zum zweiten Register), die Ehrlichkeit (keine Botschaft ohne
// Sidecar-Bindung, §8) und die Byte-Stabilität (§2).
import { describe, it, expect } from 'vitest';
import {
  baueProjektion, serialisiereProjektion, ocsAusHistorie,
  type BotschaftQuelle, type HistorieQuelle, type RevisionsQuelle,
} from '../../scripts/entstehung/entstehung-projektion';
import { ocKurzform, aenderungFuer, PROJEKTION_PROFIL } from '../lib/entstehung/projektion';

const historie = (...ocs: string[]): HistorieQuelle => ({
  artikel: {
    '1': { ereignisse: [{ quellen: ocs.map((u) => ({ url: u })) }] },
  },
});

const REV: RevisionsQuelle = {
  abgerufen: '2026-09-05',
  revisionen: [
    {
      art: 'aenderung', ocUri: 'https://fedlex.data.admin.ch/eli/oc/2018/807',
      titelDe: 'Aktienrecht', roFundstelle: 'AS 2018 5343', dateEntryInForce: '2020-01-01',
      botschaftKey: 'BOTSCHAFT-A', quelleUrl: 'https://www.fedlex.admin.ch/eli/oc/2018/807/de',
    },
    {
      art: 'aenderung', ocUri: 'https://fedlex.data.admin.ch/eli/oc/2004/788',
      titelDe: 'Revision 2004', roFundstelle: 'AS 2004 5085', dateEntryInForce: '2005-01-01',
    },
    {
      art: 'aenderung', ocUri: 'https://fedlex.data.admin.ch/eli/oc/1999/1',
      titelDe: 'Kommt in keiner Fussnote vor', dateEntryInForce: '1999-01-01',
    },
  ],
};

const BOTSCHAFTEN = new Map<string, BotschaftQuelle>([
  ['BOTSCHAFT-A', {
    key: 'BOTSCHAFT-A', titel: 'Botschaft zum Aktienrecht', nummer: '16.077',
    quelleUrl: 'https://www.fedlex.admin.ch/eli/fga/2017/1/de', stand: '2016-11-23',
    ereignisse: [{ code: 200, datum: '2016-11-23', res: 'fga/2017/1' }],
  }],
]);

describe('ocKurzform — der EINE Join-Schlüssel', () => {
  it('normalisiert Datenhost, Publikationshost und Sprach-Suffix auf dieselbe Form', () => {
    const soll = 'oc/2018/807';
    expect(ocKurzform('https://fedlex.data.admin.ch/eli/oc/2018/807')).toBe(soll);
    expect(ocKurzform('https://www.fedlex.admin.ch/eli/oc/2018/807/de')).toBe(soll);
    expect(ocKurzform('https://www.fedlex.admin.ch/eli/oc/2018/807/fr')).toBe(soll);
    expect(ocKurzform('https://fedlex.data.admin.ch/eli/oc/2018/807/')).toBe(soll);
    // Altformat-Schlüssel mit Unterstrichen (belegt im Korpus, OR Art. 34).
    expect(ocKurzform('https://fedlex.data.admin.ch/eli/oc/1971/1465_1461_1461'))
      .toBe('oc/1971/1465_1461_1461');
  });

  it('liefert null, wo keine oc-URI steht — eine BBl-Fundstelle ist kein oc', () => {
    expect(ocKurzform('https://fedlex.data.admin.ch/eli/fga/2001/889')).toBeNull();
    expect(ocKurzform(null)).toBeNull();
    expect(ocKurzform(undefined)).toBeNull();
    expect(ocKurzform('')).toBeNull();
  });
});

describe('baueProjektion — Zuschnitt, Ehrlichkeit, Determinismus', () => {
  const h = historie(
    'https://fedlex.data.admin.ch/eli/oc/2018/807',
    'https://fedlex.data.admin.ch/eli/fga/2001/889',
  );

  it('nimmt NUR die oc, die in der Fassungshistorie vorkommen (Zuschnitt, §15)', () => {
    const p = baueProjektion('OR', h, REV, BOTSCHAFTEN, new Set());
    expect(Object.keys(p!.aenderungen)).toEqual(['oc/2018/807']);
    expect(ocsAusHistorie(h)).toEqual(new Set(['oc/2018/807']));
  });

  it('bindet die Botschaft nur, wenn das Revisions-Sidecar sie führt UND sie erfasst ist (§8)', () => {
    const p = baueProjektion('OR', historie(
      'https://fedlex.data.admin.ch/eli/oc/2018/807',
      'https://fedlex.data.admin.ch/eli/oc/2004/788',
    ), REV, BOTSCHAFTEN, new Set());
    expect(p!.aenderungen['oc/2018/807'].botschaft).toBe('BOTSCHAFT-A');
    // 2004 trägt keinen botschaftKey ⇒ die Karte fällt auf «Bundesblatt» zurück.
    expect(p!.aenderungen['oc/2004/788'].botschaft).toBeUndefined();
    expect(Object.keys(p!.botschaften)).toEqual(['BOTSCHAFT-A']);
  });

  it('behauptet keine Botschaft, die in der Quelle fehlt (leere Botschaften-Menge)', () => {
    const p = baueProjektion('OR', h, REV, new Map(), new Set());
    expect(p!.aenderungen['oc/2018/807'].botschaft).toBeUndefined();
    expect(p!.botschaften).toEqual({});
  });

  it('setzt `anker` nur mit vorhandenem Sidecar (Chip «Sprung zur Erläuterung»)', () => {
    expect(baueProjektion('OR', h, REV, BOTSCHAFTEN, new Set())!
      .botschaften['BOTSCHAFT-A'].anker).toBeUndefined();
    expect(baueProjektion('OR', h, REV, BOTSCHAFTEN, new Set(['BOTSCHAFT-A']))!
      .botschaften['BOTSCHAFT-A'].anker).toBe(true);
  });

  it('liefert null statt einer leeren Datei, wenn nichts abzuleiten ist (§8)', () => {
    expect(baueProjektion('OR', historie('https://fedlex.data.admin.ch/eli/fga/2001/889'), REV, BOTSCHAFTEN, new Set())).toBeNull();
    expect(baueProjektion('OR', h, null, BOTSCHAFTEN, new Set())).toBeNull();
    expect(baueProjektion('OR', historie('https://fedlex.data.admin.ch/eli/oc/9999/1'), REV, BOTSCHAFTEN, new Set())).toBeNull();
  });

  it('trägt Profil und Abrufdatum — ohne sie wäre die Karte eine Behauptung ohne Stand (§7a)', () => {
    const p = baueProjektion('OR', h, REV, BOTSCHAFTEN, new Set())!;
    expect(p.profil).toBe(PROJEKTION_PROFIL);
    expect(p.abgerufen).toBe('2026-09-05');
    expect(p.erlass).toBe('OR');
  });

  it('ist byte-stabil: Schlüssel sortiert, Reihenfolge der Quelle egal (§2)', () => {
    const gross = historie(
      'https://fedlex.data.admin.ch/eli/oc/2018/807',
      'https://fedlex.data.admin.ch/eli/oc/2004/788',
    );
    const a = serialisiereProjektion(baueProjektion('OR', gross, REV, BOTSCHAFTEN, new Set())!);
    const gedreht: RevisionsQuelle = { ...REV, revisionen: [...REV.revisionen!].reverse() };
    const b = serialisiereProjektion(baueProjektion('OR', gross, gedreht, BOTSCHAFTEN, new Set())!);
    expect(a).toBe(b);
    expect(Object.keys(baueProjektion('OR', gross, REV, BOTSCHAFTEN, new Set())!.aenderungen))
      .toEqual(['oc/2004/788', 'oc/2018/807']);
    expect(a.endsWith('\n')).toBe(true);
  });

  it('erste Nennung eines oc gewinnt — ein zweiter Eintrag überschreibt nie still (§8)', () => {
    const doppelt: RevisionsQuelle = {
      abgerufen: '2026-09-05',
      revisionen: [
        REV.revisionen![0],
        { art: 'sammelerlass-marker', ocUri: 'https://fedlex.data.admin.ch/eli/oc/2018/807' },
      ],
    };
    const p = baueProjektion('OR', h, doppelt, BOTSCHAFTEN, new Set())!;
    expect(p.aenderungen['oc/2018/807'].titel).toBe('Aktienrecht');
  });

  it('gestaffelter Erlass: «inkraft» ist die erste Etappe, nicht die zuerst gelistete (S6-D1, AE-5)', () => {
    // Seit 23.9.2026 steht ein gestaffelt in Kraft gesetzter Erlass je Etappe im Sidecar,
    // absteigend — die zuerst gelesene Zeile ist die SPÄTESTE Etappe (OR ← AS 2020 4005:
    // 2023-01-01 vor 2021-01-01). «inkraft» behält die Bedeutung «erstes Inkrafttreten».
    const oc = 'https://fedlex.data.admin.ch/eli/oc/2018/807';
    const gestaffelt: RevisionsQuelle = {
      abgerufen: '2026-09-23',
      revisionen: [
        { art: 'aenderung', ocUri: oc, titelDe: 'Aktienrecht', dateEntryInForce: '2023-01-01', etappen: ['2021-01-01', '2023-01-01'] },
        { art: 'aenderung', ocUri: oc, titelDe: 'Aktienrecht', dateEntryInForce: '2021-01-01', etappen: ['2021-01-01', '2023-01-01'] },
      ],
    };
    const p = baueProjektion('OR', h, gestaffelt, BOTSCHAFTEN, new Set())!;
    expect(p.aenderungen['oc/2018/807'].inkraft).toBe('2021-01-01');
  });
});

describe('aenderungFuer — die Brücke vom Historie-Ereignis zur Karte', () => {
  const p = baueProjektion('OR', historie('https://fedlex.data.admin.ch/eli/oc/2018/807'), REV, BOTSCHAFTEN, new Set())!;

  it('findet die Änderung über die oc-Quelle des Ereignisses, egal an welcher Stelle', () => {
    const treffer = aenderungFuer(p, [
      { url: 'https://fedlex.data.admin.ch/eli/fga/2001/889' },
      { url: 'https://fedlex.data.admin.ch/eli/oc/2018/807' },
    ]);
    expect(treffer?.oc).toBe('oc/2018/807');
    expect(treffer?.a.titel).toBe('Aktienrecht');
  });

  it('ist still, wo nichts erfasst ist — der Griff «Warum?» erscheint dann gar nicht', () => {
    expect(aenderungFuer(p, [{ url: 'https://fedlex.data.admin.ch/eli/oc/1900/1' }])).toBeNull();
    expect(aenderungFuer(p, [{ url: null }])).toBeNull();
    expect(aenderungFuer(null, [{ url: 'https://fedlex.data.admin.ch/eli/oc/2018/807' }])).toBeNull();
  });
});
