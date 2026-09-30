import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import {
  baueRevisionen, grundmenge, type ErlassMeta, type RevisionsKontext, type RevisionSidecar,
} from '../../scripts/normtext/revisionen-generieren';
import type { SparqlBinding } from '../../scripts/fedlex-sparql';

// W3-10 (W2·27-BUND-FERTIG, 30.9.2026): eine BERICHTIGUNG (Art. 10 Abs. 1 PublG / Art. 58 ParlG)
// ist kein gestaffelt in Kraft gesetzter Erlass. Fedlex führt für sie mehrere Auswirkungs-Daten
// (Geltungsdatum des berichtigten Textes + Publikationsdatum); der Generator machte daraus je
// Datum eine Zeile mit «gestaffelt in Kraft …» (6 Zeilen in BMV/HMG/KLV). Amtlich: BMV ← AS 2016
// 2965, «Berichtigung (Art. 10 Abs. 1 PublG) … Art. 4 Abs. 2 Betrifft nur den italienischen
// Text. 23. August 2016» — EINE Berichtigung, nicht zwei Etappen.

const OC = (s: string) => `https://fedlex.data.admin.ch/eli/oc/${s}`;
const BMV: ErlassMeta = { key: 'BMV', sr: '412.103.1' };

function bind(o: Record<string, string | undefined>): SparqlBinding {
  const b: SparqlBinding = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) b[k] = { value: v };
  return b;
}

/** BMV ← oc/2016/497 (Berichtigung AS 2016 2965), Auswirkungen wie im store-raw: typ 6 an
 *  2016-08-01 und 2016-08-23, beide von der gleichnamigen Fassung eingearbeitet; Eigen-Datum
 *  (jolux:dateEntryInForce der Berichtigung) = 2016-08-23. Daneben AS 2016 2645 an 2016-08-01. */
function bmv(zusatz: RevisionsKontext['auswirkungen'] = []) {
  const k: RevisionsKontext = {
    abstractEli: 'cc/2009/423', basicAct: OC('2009/423'), inkrafttreten: '2009-08-01', aufhebung: '2026-03-01',
    auswirkungen: [
      { oc: OC('2016/497'), typ: 6, datum: '2016-08-01', fassung: '2016-08-01' },
      { oc: OC('2016/497'), typ: 6, datum: '2016-08-23', fassung: '2016-08-23' },
      { oc: OC('2016/100'), typ: 1, datum: '2016-08-01', fassung: '2016-08-01' },
      ...zusatz,
    ],
    ocStamm: { [OC('2016/100')]: { dateForce: '2016-08-01' } },
  };
  const bindings = [bind({ oc: OC('2016/497'), dateForce: '2016-08-23', dateDoc: '2016-08-23', roId: 'RO 2016 2965' })];
  return baueRevisionen(BMV, bindings, ['2016-08-01', '2016-08-23'], '2026-03-01', new Map(), '2026-09-23', new Set(), new Map(), k);
}

describe('W3-10 · Berichtigung mit mehreren Auswirkungs-Daten = EINE Zeile ohne «gestaffelt»', () => {
  it('BMV ← AS 2016 2965: eine Zeile am Eigen-Datum der Berichtigung, keine Etappen', () => {
    const s = bmv();
    const z = s.revisionen.filter((r) => r.ocUri === OC('2016/497'));
    expect(z.map((r) => [r.dateEntryInForce, r.roFundstelle, r.wirkungen, r.etappen])).toEqual([
      ['2016-08-23', 'AS 2016 2965', ['berichtigung'], undefined],
    ]);
  });

  it('das weggefallene Datum erzeugt keinen Sammelerlass-Marker (Fassung gehört zur Berichtigung bzw. hat eine andere Zeile)', () => {
    const s = bmv();
    expect(s.revisionen.filter((r) => r.art === 'sammelerlass-marker')).toEqual([]);
    // 2016-08-01 bleibt durch AS 2016 2645 belegt
    expect(s.revisionen.map((r) => [r.ocUri, r.dateEntryInForce])).toContainEqual([OC('2016/100'), '2016-08-01']);
  });

  it('KLV ← AS 2018 2837: die Fassung, die NUR die Berichtigung erzeugt (2018-07-31), wird kein falscher Marker', () => {
    const erlass: ErlassMeta = { key: 'KLV', sr: '832.112.31' };
    const k: RevisionsKontext = {
      abstractEli: 'cc/1995/4964_4964_4964', basicAct: OC('1995/4964_4964_4964'), inkrafttreten: '1996-01-01',
      auswirkungen: [
        { oc: OC('2017/700'), typ: 1, datum: '2018-01-01', fassung: '2018-01-01' }, // älterer Stand: 2018-07-31 liegt NACH dem ältesten Eintrag
        { oc: OC('2018/432'), typ: 6, datum: '2018-07-31', fassung: '2018-07-31' },
        { oc: OC('2018/432'), typ: 6, datum: '2019-01-01', fassung: '2019-01-01' },
      ],
      ocStamm: { [OC('2017/700')]: { dateForce: '2018-01-01' } },
    };
    const bindings = [bind({ oc: OC('2018/432'), dateForce: '2019-01-01', dateDoc: '2018-07-31', roId: 'RO 2018 2837' })];
    const s = baueRevisionen(erlass, bindings, ['2018-01-01', '2018-07-31', '2019-01-01'], '2026-01-01', new Map(), '2026-09-23', new Set(), new Map(), k);
    expect(s.revisionen.map((r) => [r.art, r.dateEntryInForce, r.etappen])).toEqual([
      ['aenderung', '2019-01-01', undefined],
      ['aenderung', '2018-01-01', undefined],
    ]);
  });

  it('liegt das Eigen-Datum nicht unter den Auswirkungs-Daten, gilt das früheste (nie ein Datum erfinden, §7)', () => {
    const k: RevisionsKontext = {
      abstractEli: 'cc/2009/423', basicAct: OC('2009/423'), inkrafttreten: '2009-08-01',
      auswirkungen: [
        { oc: OC('2016/497'), typ: 6, datum: '2016-09-01', fassung: '2016-09-01' },
        { oc: OC('2016/497'), typ: 6, datum: '2016-08-05', fassung: '2016-08-05' },
      ],
      ocStamm: { [OC('2016/497')]: { dateForce: '2016-08-23' } },
    };
    const s = baueRevisionen(BMV, [], ['2016-08-05', '2016-09-01'], '2026-01-01', new Map(), '2026-09-23', new Set(), new Map(), k);
    expect(s.revisionen.map((r) => [r.dateEntryInForce, r.etappen])).toEqual([['2016-08-05', undefined]]);
  });

  it('ein ECHT gestaffelter Änderungserlass behält seine Etappen (AE-5 unberührt)', () => {
    const s = bmv([
      { oc: OC('2020/746'), typ: 1, datum: '2021-01-01' },
      { oc: OC('2020/746'), typ: 1, datum: '2023-01-01' },
    ]);
    const z = s.revisionen.filter((r) => r.ocUri === OC('2020/746'));
    expect(z.map((r) => r.dateEntryInForce)).toEqual(['2023-01-01', '2021-01-01']);
    for (const r of z) expect(r.etappen).toEqual(['2021-01-01', '2023-01-01']);
  });

  it('Berichtigung UND Änderung desselben oc: nicht kollabiert (nur reine Berichtigungen)', () => {
    const s = bmv([
      { oc: OC('2016/497'), typ: 1, datum: '2016-08-01', fassung: '2016-08-01' },
    ]);
    expect(s.revisionen.filter((r) => r.ocUri === OC('2016/497')).map((r) => r.dateEntryInForce)).toEqual(['2016-08-23', '2016-08-01']);
  });
});

describe('W3-10 · Bestand: keine reine Berichtigung trägt Etappen (store-raw + Sidecars)', () => {
  const RAW = 'bibliothek/normtext/revisionen-raw';
  const SIDECAR = 'public/normtext/revisionen';

  it('alle Sidecars: wirkungen == [berichtigung] ⇒ kein `etappen`', () => {
    const verstoesse: string[] = [];
    for (const f of readdirSync(SIDECAR).filter((n) => n.endsWith('.json'))) {
      const s = JSON.parse(readFileSync(`${SIDECAR}/${f}`, 'utf8')) as RevisionSidecar;
      for (const r of s.revisionen) {
        if (r.etappen && r.wirkungen && r.wirkungen.length > 0 && r.wirkungen.every((w) => w === 'berichtigung')) {
          verstoesse.push(`${s.erlassKey} ${r.roFundstelle} ${r.dateEntryInForce}`);
        }
      }
    }
    expect(verstoesse).toEqual([]);
  });

  it('BMV/HMG/KLV aus dem store-raw: je Berichtigung genau eine Zeile', () => {
    const erwartet: Record<string, [string, string]> = {
      BMV: ['AS 2016 2965', '2016-08-23'], HMG: ['AS 2018 5449', '2019-01-01'], KLV: ['AS 2018 2837', '2019-01-01'],
    };
    const meta = new Map(grundmenge().map((m) => [m.key, m]));
    for (const [key, [fundstelle, datum]] of Object.entries(erwartet)) {
      const raw = JSON.parse(readFileSync(`${RAW}/${key}.json`, 'utf8'));
      const s = baueRevisionen(
        meta.get(key)!, raw.bBindings, raw.aStaende, raw.korpusStand, new Map(), '2026-09-23',
        new Set(raw.belegteOcs ?? []), new Map(Object.entries(raw.rectifiesInfoProOc ?? {})), raw.kontext ?? undefined,
      );
      const z = s.revisionen.filter((r) => r.roFundstelle === fundstelle);
      expect(z.map((r) => [r.dateEntryInForce, r.etappen])).toEqual([[datum, undefined]]);
    }
  });
});
