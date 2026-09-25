import { describe, it, expect } from 'vitest';
import {
  baueBotschaften, sortiereBindings, keyAusFga, liveLink, filtereBotschaftsKanten, type ErlassMeta,
} from '../../scripts/materialien/botschaften-generieren';
import { auswirkungsIndex } from '../../scripts/materialien/botschaften-auswirkungen';
import { parlamentUrlAusCuria } from '../lib/materialien/botschaften';
import type { SparqlBinding } from '../../scripts/fedlex-sparql';
import { BOTSCHAFTEN } from '../lib/materialien/botschaften.generated';
import { ERLASS_REGISTER } from '../lib/normtext/register';

// Paket 2 (W2·6): reine Generator-Logik (dedupe/Sortierung/Determinismus/Join-Felder) +
// die Curia→parlament.ch-Transformation. Netz-Kette prüft die Live-Daten separat.

const META: ErlassMeta[] = [
  { key: 'DSG', sr: '235.1', rechtsgebiet: 'oeffentlich', rang: 10 },
  { key: 'OR', sr: '220', rechtsgebiet: 'privat', rang: 1 },
];

function bind(o: Record<string, string | undefined>): SparqlBinding {
  const b: SparqlBinding = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) b[k] = { value: v };
  return b;
}

const FGA_A = 'https://fedlex.data.admin.ch/eli/fga/2017/2057';
const PROJ_A = 'https://fedlex.data.admin.ch/eli/proj/2017/1085';

describe('baueBotschaften — Kern-Logik', () => {
  it('dedupliziert eine Botschaft unter zwei SR (Mantelerlass → normKeys beide)', () => {
    const bindings = [
      bind({ sr: '235.1', botschaft: FGA_A, proj: PROJ_A, oc: 'oc/x', dateDoc: '2017-09-15', curia: '17.059', titleDe: 'Titel DE', titleFr: 'Titre FR', titleIt: 'Titolo IT' }),
      bind({ sr: '220', botschaft: FGA_A, proj: PROJ_A, oc: 'oc/y', dateDoc: '2017-09-15', curia: '17.059', titleDe: 'Titel DE', titleFr: 'Titre FR', titleIt: 'Titolo IT' }),
    ];
    const out = baueBotschaften(bindings, META);
    expect(out).toHaveLength(1);
    expect(out[0].normKeys).toEqual(['DSG', 'OR']); // sortiert
    expect(out[0].ocUris).toEqual(['oc/x', 'oc/y']);
    expect(out[0].titel).toBe('Titel DE');
    expect(out[0].titelFr).toBe('Titre FR');
    expect(out[0].titelIt).toBe('Titolo IT');
    expect(out[0].botschaftDate).toBe(out[0].stand);
  });

  it('erbt rechtsgebiet vom prominentesten normKey (kleinster rang), nicht geraten', () => {
    // OR (rang 1) prominenter als DSG (rang 10) → rechtsgebiet 'privat'.
    const bindings = [
      bind({ sr: '235.1', botschaft: FGA_A, proj: PROJ_A, dateDoc: '2017-09-15', titleDe: 'X' }),
      bind({ sr: '220', botschaft: FGA_A, proj: PROJ_A, dateDoc: '2017-09-15', titleDe: 'X' }),
    ];
    expect(baueBotschaften(bindings, META)[0].rechtsgebiet).toBe('privat');
  });

  it('wählt projEli + Curia deterministisch aus dem KLEINSTEN proj (mehrere projs)', () => {
    const bindings = [
      bind({ sr: '235.1', botschaft: FGA_A, proj: 'https://fedlex.data.admin.ch/eli/proj/2016/0066', dateDoc: '2016-01-01', curia: '16.066', titleDe: 'X' }),
      bind({ sr: '235.1', botschaft: FGA_A, proj: 'https://fedlex.data.admin.ch/eli/proj/2016/0065', dateDoc: '2016-01-01', curia: '16.065', titleDe: 'X' }),
    ];
    const out = baueBotschaften(bindings, META);
    expect(out[0].projEli).toBe('https://fedlex.data.admin.ch/eli/proj/2016/0065');
    expect(out[0].nummer).toBe('16.065'); // Curia des gewählten proj (konsistent)
  });

  it('sortiert Datum absteigend (jüngste zuerst), Tiebreak key', () => {
    const bindings = [
      bind({ sr: '220', botschaft: 'https://fedlex.data.admin.ch/eli/fga/2010/1', proj: 'p1', dateDoc: '2010-01-01', titleDe: 'Alt' }),
      bind({ sr: '220', botschaft: 'https://fedlex.data.admin.ch/eli/fga/2020/1', proj: 'p2', dateDoc: '2020-01-01', titleDe: 'Neu' }),
    ];
    const out = baueBotschaften(bindings, META);
    expect(out.map((e) => e.stand)).toEqual(['2020-01-01', '2010-01-01']);
  });

  it('lässt Einträge ohne Datum oder ohne DE-Titel aus (§8-Ehrlichkeit)', () => {
    const bindings = [
      bind({ sr: '220', botschaft: 'https://fedlex.data.admin.ch/eli/fga/2020/9', proj: 'p', titleDe: 'Ohne Datum' }),
      bind({ sr: '220', botschaft: 'https://fedlex.data.admin.ch/eli/fga/2020/8', proj: 'p', dateDoc: '2020-01-01' }),
    ];
    expect(baueBotschaften(bindings, META)).toHaveLength(0);
  });

  it('ist deterministisch bei umgekehrter Bindungs-Reihenfolge', () => {
    const bindings = [
      bind({ sr: '235.1', botschaft: FGA_A, proj: 'https://fedlex.data.admin.ch/eli/proj/2016/0066', dateDoc: '2016-01-01', curia: '16.066', titleDe: 'X' }),
      bind({ sr: '235.1', botschaft: FGA_A, proj: 'https://fedlex.data.admin.ch/eli/proj/2016/0065', dateDoc: '2016-01-01', curia: '16.065', titleDe: 'X' }),
    ];
    const vor = JSON.stringify(baueBotschaften(bindings, META));
    const zurueck = JSON.stringify(baueBotschaften([...bindings].reverse(), META));
    expect(vor).toBe(zurueck);
  });
});

describe('keyAusFga / liveLink', () => {
  it('baut stabile, URL-sichere Keys aus der fga-URI', () => {
    expect(keyAusFga(FGA_A)).toBe('BOTSCHAFT-2017-2057');
    expect(keyAusFga('https://fedlex.data.admin.ch/eli/fga/1999/1_5149_4753_4457')).toBe('BOTSCHAFT-1999-1_5149_4753_4457');
  });
  it('liveLink hängt /de an und zeigt auf www.fedlex.admin.ch', () => {
    expect(liveLink(FGA_A)).toBe('https://www.fedlex.admin.ch/eli/fga/2017/2057/de');
  });
});

describe('parlamentUrlAusCuria', () => {
  it('2-stelliges Jahr → Jahrhundert korrekt', () => {
    expect(parlamentUrlAusCuria('17.059')).toBe('https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=20170059');
    expect(parlamentUrlAusCuria('99.093')).toBe('https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=19990093');
  });
  it('4-stelliges Jahr wird übernommen', () => {
    expect(parlamentUrlAusCuria('2000.025')).toBe('https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=20000025');
  });
  it('ungültige Nummer → null', () => {
    expect(parlamentUrlAusCuria('abc')).toBeNull();
    expect(parlamentUrlAusCuria('')).toBeNull();
  });
});

describe('BOTSCHAFTEN (committet) — Struktur-Invarianten', () => {
  const erlassKeys = new Set(ERLASS_REGISTER.map((e) => e.key));
  it('jede Botschaft: BR/botschaft, projEli, botschaftDate==stand, normKeys⊆Register, Fedlex-Link', () => {
    for (const b of BOTSCHAFTEN) {
      expect(b.behoerde).toBe('BR');
      expect(b.doktyp).toBe('botschaft');
      expect(b.status).toBe('nur-live-link');
      expect(b.projEli, `${b.key} ohne projEli`).toBeTruthy();
      expect(b.botschaftDate).toBe(b.stand);
      expect(b.quelleUrl).toMatch(/^https:\/\/www\.fedlex\.admin\.ch\/eli\/fga\//);
      expect((b.normKeys ?? []).length).toBeGreaterThan(0);
      for (const nk of b.normKeys ?? []) expect(erlassKeys.has(nk), `${b.key} → unbekannter Erlass ${nk}`).toBe(true);
    }
  });
  it('Referenzfall DSG: genau 2 Botschaften (17.059 + 03.016)', () => {
    const dsg = BOTSCHAFTEN.filter((b) => (b.normKeys ?? []).includes('DSG'));
    expect(dsg).toHaveLength(2);
    expect(new Set(dsg.map((b) => b.nummer))).toEqual(new Set(['17.059', '03.016']));
  });
  it('Keys sind eindeutig', () => {
    const keys = BOTSCHAFTEN.map((b) => b.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// Befund (f), QS-MONITOR-ROT 1.9.2026: Roh-Bindings je SR deterministisch geordnet — der SPARQL-
// Endpunkt liefert ohne ORDER BY in wechselnder Reihenfolge (Rot-Beweis: vier Roh-Dateien am
// 30.8. und 1.9.2026 bei identischem Inhalt umsortiert, multiset-identisch).
describe('sortiereBindings — deterministische Roh-Ordnung', () => {
  const a = { sr: { type: 'literal', value: '831.10' }, fga: { type: 'uri', value: 'https://fedlex.data.admin.ch/eli/fga/2024/2' } };
  const b = { sr: { type: 'literal', value: '831.10' }, fga: { type: 'uri', value: 'https://fedlex.data.admin.ch/eli/fga/2023/9' } };
  const c = { fga: { type: 'uri', value: 'https://fedlex.data.admin.ch/eli/fga/2023/9' }, sr: { type: 'literal', value: '831.10' } };
  it('gleiche Bindings in anderer Reihenfolge ⇒ gleiche Ausgabe', () => {
    expect(sortiereBindings([a, b])).toEqual(sortiereBindings([b, a]));
  });
  it('Feld-Reihenfolge innerhalb eines Bindings zählt nicht (kanonischer Schlüssel)', () => {
    expect(sortiereBindings([a, b]).map((x) => x.fga.value)).toEqual(sortiereBindings([a, c]).map((x) => x.fga.value));
  });
  it('Eingabe bleibt unverändert (rein), Ausgabe hat alle Elemente', () => {
    const eingabe = [a, b];
    const out = sortiereBindings(eingabe);
    expect(eingabe).toEqual([a, b]);
    expect(out).toHaveLength(2);
  });
});

// W2·29-WERKBANK-LESER, Erlass-Blatt Welle 2 Daten-Rest (25.9.2026).
// M-4 — Reproduktion am main 59078ae8c: BOTSCHAFT-2006-1 (PatG, BBl 2006 1) trug nummer 04.054
// und normKeys [BV, PATG]. Ursache live belegt (Fedlex-SPARQL 25.9.2026): proj/2005/1572 (Curia
// 04.054, Gentechfrei-Initiative) verweist mit einem Ereignis type-projet/650 («Abgestimmt am»)
// auf fga/2006/1 — nur Ereignisse type-projet/200 («Botschaft des Bundesrats») begründen die
// Kante Projekt → Botschaft; die fünf echten Projekte proj/2005/2004…2009 tragen 05.082.
const META_W2: ErlassMeta[] = [
  { key: 'BV', sr: '101', rechtsgebiet: 'oeffentlich', rang: 1 },
  { key: 'OR', sr: '220', rechtsgebiet: 'privat', rang: 2 },
  { key: 'PATG', sr: '232.14', rechtsgebiet: 'privat', rang: 50 },
  { key: 'SCHKG', sr: '281.1', rechtsgebiet: 'privat', rang: 5 },
  { key: 'STGB', sr: '311.0', rechtsgebiet: 'oeffentlich', rang: 3 },
];
const TYP = (n: number) => `https://fedlex.data.admin.ch/vocabulary/type-projet/${n}`;

describe('M-4 — nur type-projet/200 begründet Projekt → Botschaft', () => {
  const fga = 'https://fedlex.data.admin.ch/eli/fga/2006/1';
  const bindings = [
    bind({ sr: '101', botschaft: fga, proj: 'https://fedlex.data.admin.ch/eli/proj/2005/1572', oc: 'https://fedlex.data.admin.ch/eli/oc/2006/23', evType: TYP(650), dateDoc: '2005-11-23', curia: '04.054', titleDe: 'Botschaft zur Änderung des Patentgesetzes' }),
    bind({ sr: '232.14', botschaft: fga, proj: 'https://fedlex.data.admin.ch/eli/proj/2005/2004', oc: 'https://fedlex.data.admin.ch/eli/oc/2008/374', evType: TYP(200), dateDoc: '2005-11-23', curia: '05.082', titleDe: 'Botschaft zur Änderung des Patentgesetzes' }),
  ];
  it('Ereignis 650 (Abstimmung) zählt nicht: Curia 05.082, normKeys nur PATG', () => {
    const out = baueBotschaften(bindings, META_W2);
    expect(out).toHaveLength(1);
    expect(out[0].nummer).toBe('05.082');
    expect(out[0].normKeys).toEqual(['PATG']);
    expect(out[0].projEli).toBe('https://fedlex.data.admin.ch/eli/proj/2005/2004');
    expect(out[0].ocUris).toEqual(['https://fedlex.data.admin.ch/eli/oc/2008/374']);
  });
  it('Botschaft nur über ein Nicht-200-Ereignis erreichbar ⇒ kein Eintrag', () => {
    expect(baueBotschaften([bindings[0]], META_W2)).toHaveLength(0);
  });
  it('filtereBotschaftsKanten lässt Bindungen ohne evType (Alt-Roh) stehen', () => {
    const ohne = bind({ sr: '220', botschaft: fga, proj: 'p', dateDoc: '2005-11-23', titleDe: 'X' });
    expect(filtereBotschaftsKanten([bindings[0], bindings[1], ohne])).toEqual([bindings[1], ohne]);
  });
});

// M-5 — Reproduktion am main 59078ae8c: BOTSCHAFT-2019-1847 (19.043, missbräuchlicher Konkurs)
// nur unter OR, obwohl AS 2023 628 laut Fedlex-Rechtsanalyse («Auswirkungen», revisionen-raw)
// auch SchKG und StGB ändert — Fedlex klassiert den oc nur unter SR 220. Die Auswirkungen
// ergänzen normKeys; ein oc, der unter KEINER Korpus-SR klassiert ist (Pfad B, Bindung ohne
// sr), wird allein über die Auswirkungen zugeordnet.
describe('M-5 — normKeys aus den Fedlex-Auswirkungen des ändernden Erlasses', () => {
  const fga = 'https://fedlex.data.admin.ch/eli/fga/2019/1847';
  const ocA = 'https://fedlex.data.admin.ch/eli/oc/2023/628';
  const ocB = 'https://fedlex.data.admin.ch/eli/oc/2099/1';
  const idx = new Map<string, Set<string>>([[ocA, new Set(['OR', 'SCHKG', 'STGB'])], [ocB, new Set(['BV'])]]);
  it('Pfad A (SR-Klassierung) + Auswirkungen ⇒ OR, SCHKG, STGB', () => {
    const out = baueBotschaften([
      bind({ sr: '220', botschaft: fga, proj: 'p1', oc: ocA, evType: TYP(200), dateDoc: '2019-06-26', curia: '19.043', titleDe: 'Missbräuchlicher Konkurs' }),
    ], META_W2, undefined, idx);
    expect(out[0].normKeys).toEqual(['OR', 'SCHKG', 'STGB']);
  });
  it('Pfad B (ohne sr) wird nur über die Auswirkungen zugeordnet; ohne Index-Treffer verworfen', () => {
    const b = bind({ botschaft: 'https://fedlex.data.admin.ch/eli/fga/2099/5', proj: 'p2', oc: ocB, evType: TYP(200), dateDoc: '2099-01-01', titleDe: 'Y' });
    expect(baueBotschaften([b], META_W2, undefined, idx)[0].normKeys).toEqual(['BV']);
    expect(baueBotschaften([b], META_W2, undefined, new Map())).toHaveLength(0);
    expect(baueBotschaften([b], META_W2)).toHaveLength(0);
  });
  it('auswirkungsIndex: nur Rechtsetzungs-Typen, fremdOcs = Index minus Korpus-klassierte oc', () => {
    const r = auswirkungsIndex([
      { key: 'SCHKG', auswirkungen: [{ oc: ocA, typ: 1 }, { oc: 'x/12', typ: 12 }, { oc: 'x/6', typ: 6 }], klassiert: [] },
      { key: 'OR', auswirkungen: [{ oc: ocA, typ: 1 }, { oc: ocB, typ: 2 }], klassiert: [ocA] },
    ]);
    expect([...r.index.keys()].sort()).toEqual([ocB, ocA].sort());
    expect([...r.index.get(ocA)!].sort()).toEqual(['OR', 'SCHKG']);
    expect(r.fremdOcs).toEqual([ocB]);
  });
});

// M-7 — BBl-Fundstelle der Botschaft (Fedlex jolux:historicalLegalId der DE-Expression,
// live 25.9.2026: fga/2006/1/de → «BBl 2006 1»).
describe('M-7 — BBl-Fundstelle', () => {
  it('übernimmt historicalLegalId DE als fundstelle', () => {
    const out = baueBotschaften([
      bind({ sr: '232.14', botschaft: 'https://fedlex.data.admin.ch/eli/fga/2006/1', proj: 'p', evType: TYP(200), dateDoc: '2005-11-23', titleDe: 'X', bbl: 'BBl 2006 1' }),
    ], META_W2);
    expect(out[0].fundstelle).toBe('BBl 2006 1');
  });
});

describe('BOTSCHAFTEN (committet) — Befunde M-4/M-5/M-7 behoben', () => {
  const patg = BOTSCHAFTEN.find((b) => b.key === 'BOTSCHAFT-2006-1');
  it('M-4: PatG-Botschaft 05.082, nur PATG', () => {
    expect(patg?.nummer).toBe('05.082');
    expect(patg?.normKeys).toEqual(['PATG']);
  });
  it('M-5: 19.043 unter OR, SCHKG und STGB', () => {
    expect(BOTSCHAFTEN.find((b) => b.key === 'BOTSCHAFT-2019-1847')?.normKeys).toEqual(expect.arrayContaining(['OR', 'SCHKG', 'STGB']));
  });
  it('M-7: jede Botschaft mit Fundstelle der Form «BBl JJJJ S»; PatG = BBl 2006 1', () => {
    expect(patg?.fundstelle).toBe('BBl 2006 1');
    for (const b of BOTSCHAFTEN) if (b.fundstelle) expect(b.fundstelle).toMatch(/^BBl \d{4} \d+$/);
  });
});
