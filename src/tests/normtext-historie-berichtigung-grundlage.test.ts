import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { parseFussnoteHistorie, type FnEingang } from '../lib/normtext/historie-parse';

// W3-11 (W2·27-BUND-FERTIG, 30.9.2026): «Berichtigt von der Redaktionskommission der BVers
// (Art. 33 GVG – AS 1974 1051)» nennt RECHTSGRUNDLAGE und deren Fundstelle — nicht die
// Fundstelle der Berichtigung. Der Parser machte aus der Klammer eine Quelle «AS 1974 1051» am
// Ereignis «Berichtigung» (10 Ereignisse: ATSG 47, AVIG 43a, BETMG 17, DESG 36, OR 328/336c/
// 685d/716a, STG 29, STGB 305bis). Amtlich: oc/1974/1051_1051_1051 = «Geschäftsverkehrsgesetz,
// Änderung» (SPARQL, Abruf 30.9.2026; dateDocument 1974-03-14, ausser Kraft 2003-12-01);
// Art. 58 ParlG (SR 171.10, Stand 2026-03-02) ist die heutige Berichtigungs-Grundlage der
// Redaktionskommission, dieselbe Fussnote nennt sie als «(Art. 58 Abs. 1 ParlG; SR 171.10)».

const fn = (text: string, links: FnEingang['links'] = [], extra: Partial<FnEingang> = {}): FnEingang =>
  ({ text, links, absatz: null, item: null, ...extra });
const GVG_LINK = { label: 'AS <b>1974 </b>1051', url: 'https://fedlex.data.admin.ch/eli/oc/1974/1051_1051_1051' };

describe('W3-11 · Rechtsgrundlage in der Berichtigungs-Fussnote ist keine Fundstelle des Ereignisses', () => {
  it('OR 336c Fn 207 (runde Klammer): Ereignis «berichtigt» ohne Quelle', () => {
    const r = parseFussnoteHistorie(fn('Berichtigt von der Redaktionskommission der BVers (Art. 33 GVG – AS <b>1974 </b>1051).', [GVG_LINK], { absatz: '1', item: 'a' }));
    expect(r.klasse).toBe('ereignis');
    expect(r.ereignisse).toHaveLength(1);
    expect(r.ereignisse[0]).toMatchObject({ typ: 'berichtigt', datum: null, quellen: [], absatz: '1', item: 'a' });
  });

  it('eckige Klammer (BETMG 17, OR 716a) und Klammer-Rest «)]» (STG 29)', () => {
    for (const t of [
      'Berichtigt von der Redaktionskommission der BVers [Art. 33 GVG – AS 1974 1051].',
      'Berichtigt von der Redaktionskommission der BVers (Art. 33 GVG – AS <b>1974 </b>1051)].',
    ]) {
      const r = parseFussnoteHistorie(fn(t, [GVG_LINK]));
      expect(r.ereignisse.map((e) => [e.typ, e.quellen])).toEqual([['berichtigt', []]]);
    }
  });

  it('die AS-Fundstelle der BERICHTIGUNG selbst bleibt (BMV 4: «Die Berichtigung vom … (AS 2016 2965)»)', () => {
    const link = { label: 'AS <b>2016</b> 2965', url: 'https://fedlex.data.admin.ch/eli/oc/2016/497' };
    const r = parseFussnoteHistorie(fn('Die Berichtigung vom 23. Aug. 2016 betrifft nur den italienischen Text (AS <b>2016</b> 2965).', [link]));
    expect(r.ereignisse.map((e) => [e.typ, e.quellen.map((q) => q.label)])).toEqual([['berichtigt', ['AS 2016 2965']]]);
  });

  it('Fassung + Berichtigung in EINER Fussnote: die Fassungs-Quellen bleiben (Bauart DBG 124, synthetisch mit GVG-Klammer)', () => {
    const r = parseFussnoteHistorie(fn(
      'Fassung gemäss Anhang Ziff. 7 des Zivildienstgesetzes vom 6. Okt. 1995, in Kraft seit 1. Okt. 1996 (AS 1996 1445; BBl 1994 III 1609). Berichtigt von der Redaktionskommission der BVers (Art. 33 GVG – AS 1974 1051).',
      [GVG_LINK, { label: 'AS 1996 1445', url: 'https://fedlex.data.admin.ch/eli/oc/1996/1445_1445_1445' }],
    ));
    expect(r.ereignisse.map((e) => [e.typ, e.quellen.map((q) => q.label)])).toEqual([
      ['fassung', ['AS 1996 1445', 'BBl 1994 III 1609']],
      ['berichtigt', []],
    ]);
  });

  it('ParlG-Variante mit SR (Art. 58 Abs. 1 ParlG; SR 171.10) bleibt quellenlos wie bisher', () => {
    const r = parseFussnoteHistorie(fn('Berichtigt von der Redaktionskommission der BVers (Art. 58 Abs. 1 ParlG; SR 171.10).'));
    expect(r.ereignisse.map((e) => [e.typ, e.quellen])).toEqual([['berichtigt', []]]);
  });

  it('eine Fundstelle in Klammer OHNE GVG/ParlG-Rechtsgrundlage bleibt Quelle (nie breiter als belegt)', () => {
    const r = parseFussnoteHistorie(fn('Berichtigt von der Redaktionskommission der BVers am 22. Febr. 2024 (AS 2024 99).', [{ label: 'AS 2024 99', url: 'https://fedlex.data.admin.ch/eli/oc/2024/99' }]));
    expect(r.ereignisse[0].quellen.map((q) => q.label)).toEqual(['AS 2024 99']);
  });
});

describe('W3-11 · Bestand: kein Berichtigungs-Ereignis im Historie-Shard trägt «AS 1974 1051»', () => {
  it('alle Shards', () => {
    const treffer: string[] = [];
    for (const f of readdirSync('public/normtext/historie').filter((n) => n.endsWith('.json'))) {
      const s = JSON.parse(readFileSync(`public/normtext/historie/${f}`, 'utf8')) as {
        artikel: Record<string, { ereignisse: Array<{ typ: string; quellen: Array<{ label: string }> }> }>;
      };
      for (const [token, a] of Object.entries(s.artikel)) {
        for (const e of a.ereignisse) {
          if (e.typ === 'berichtigt' && e.quellen.some((q) => q.label === 'AS 1974 1051')) treffer.push(`${f} ${token}`);
        }
      }
    }
    expect(treffer).toEqual([]);
  });
});
