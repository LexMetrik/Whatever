// HN-05-Auflage (W2·27-BUND-FERTIG P6): Korpus-Sonde der Ziffer-Ebene gegen die COMMITTETEN Snapshots.
// Belege gegen die amtliche Fassung: BV cc/1999/404 20240303 (Art. 196/197 — Überschrift-Ziffern),
// StGB cc/54/757_781_799 20261001 (Art. 139/140 — Absatz-Ziffern), gepinnte Fedlex-Filestore-HTMLs.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parsePassus } from '../lib/normtext/passus';
import { bestimmePassusZiel } from '../lib/normtext/passusZiel';
import type { NormSnapshot } from '../lib/normtext/typen';

const lade = (erlass: string): NormSnapshot[] =>
  (JSON.parse(readFileSync(`public/normtext/bund/${erlass}.json`, 'utf8')) as { eintraege: NormSnapshot[] }).eintraege;
const artikel = (erlass: string, token: string): NormSnapshot =>
  lade(erlass).find((e) => e.id === `bund/${erlass}/art_${token}`)!;
const ueberschriften = (e: NormSnapshot) => e.bloecke.filter((b) => b.titel !== undefined && b.ziffer !== undefined);

describe('Ziffer-Ebene im Korpus', () => {
  it('BV Art. 197: jede amtliche Ziffer-Überschrift 1–16 ist ein titel-Block mit ziffer (Ziff. 6 «nicht verwendet» eingeschlossen)', () => {
    const h = ueberschriften(artikel('BV', '197'));
    expect(h.map((b) => b.ziffer)).toEqual(Array.from({ length: 16 }, (_, i) => String(i + 1)));
    expect(h[0].text).toBe('1. Beitritt der Schweiz zur UNO');
    expect(h[11].text).toBe('12. Übergangsbestimmung zu Art. 10a (Verbot der Verhüllung des eigenen Gesichts)');
  });

  it('BV Art. 197: «Abs. 1» ist je Ziffer eindeutig — die fünf Ziffern mit nummerierten Absätzen tragen je eine eigene ziffer', () => {
    const e = artikel('BV', '197');
    const abs1 = e.bloecke.filter((b) => b.absatz === '1').map((b) => b.ziffer);
    expect(abs1).toEqual(['1', '9', '13', '15', '16']);
  });

  it('BV Art. 196 und ParlG Art. 173 tragen ihre Ziffer-Überschriften', () => {
    expect(ueberschriften(artikel('BV', '196')).length).toBe(16);
    expect(ueberschriften(artikel('PARLG', '173')).length).toBe(7);
  });

  it('StGB Art. 139: Ziffern 1–4, der unnummerierte Aufzählungsträger erbt, Text bleibt verbatim', () => {
    const b = artikel('STGB', '139').bloecke;
    expect(b.map((x) => x.ziffer)).toEqual(['1', '2', '3', '4']);
    expect(b[2].text.startsWith('3. Der Dieb wird mit Freiheitsstrafe')).toBe(true);
    expect(b[2].items!.map((i) => i.marke)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('StGB Art. 140: der unnummerierte Folge-Absatz gehört zur Ziffer 1 (Art. 140 Ziff. 1 Abs. 2)', () => {
    const b = artikel('STGB', '140').bloecke;
    expect(b[0].ziffer).toBe('1');
    expect(b[1].ziffer).toBe('1');
    expect(b[1].absatz).toBeNull();
  });

  // Ordnungsschlüssel einer Ziffer-Marke: [Zahl, Suffix-Rang] — «1» < «1bis» < «1ter» < «2» (Sammel «2_3» zählt als «2»).
  // Kein parseInt-Vergleich: parseInt('1bis') = 1 machte die Ordnungsprüfung für Suffix-Ziffern blind (#1251, B1).
  const SUFFIX_RANG = ['', 'bis', 'ter', 'quater', 'quinquies', 'sexies', 'septies', 'octies', 'novies', 'decies'];
  const schluessel = (z: string): [number, number] => {
    const m = z.match(/^(\d+)([a-z]*)/)!;
    const r = SUFFIX_RANG.indexOf(m[2]);
    return [Number(m[1]), r >= 0 ? r : 100 + m[2].charCodeAt(0)];
  };
  const kleiner = (a: string, b: string): boolean => {
    const [x, y] = [schluessel(a), schluessel(b)];
    return x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1];
  };
  const ERLASSE = ['BV', 'PARLG', 'STGB', 'MSTG', 'VSTRR', 'VVV', 'VZV', 'SVG', 'BETMG', 'LUGUE', 'GFK', 'CMR', 'EAUE', 'UNO_ANTIFOLTER', 'STAATENLOSE', 'SSV', 'MSCHG', 'FZV'];

  it('Invariante über alle Bund-Erlasse: ziffer steigt je Artikel nie rückwärts (String-Ordnung, nicht parseInt); jede Überschrift beginnt mit ihrer Ziffer', () => {
    const verstoesse: string[] = [];
    for (const f of ERLASSE) {
      for (const e of lade(f)) {
        let letzte: string | null = null;
        for (const b of e.bloecke) {
          if (b.ziffer === undefined) continue;
          if (letzte !== null && kleiner(b.ziffer, letzte)) verstoesse.push(`${e.id}: ${b.ziffer} nach ${letzte}`);
          letzte = b.ziffer;
          if (b.titel !== undefined && !b.text.startsWith(`${b.ziffer}.`)) verstoesse.push(`${e.id}: Überschrift «${b.text}» ≠ ziffer ${b.ziffer}`);
        }
      }
    }
    expect(verstoesse).toEqual([]);
  });

  it('Invariante (B1): ein Ziffer-Absatz, dessen amtliche Marke «Nbis»/«Nter» lautet, trägt genau diese ziffer — nicht die der Vorgängerziffer', () => {
    const verstoesse: string[] = [];
    let geprueft = 0;
    for (const f of ERLASSE) {
      for (const e of lade(f)) {
        for (const b of e.bloecke) {
          const m = b.titel === undefined ? b.text.match(/^(\d+(?:bis|ter|quater|quinquies))\.\s/) : null;
          if (m === null || b.ziffer === undefined) continue; // Block ohne ziffer = Artikel ohne Ziffer-Gliederung (Fliesstext)
          geprueft++;
          if (b.ziffer !== m[1]) verstoesse.push(`${e.id}: Text «${m[1]}.» ≠ ziffer «${b.ziffer}»`);
        }
      }
    }
    expect(verstoesse).toEqual([]);
    expect(geprueft).toBeGreaterThanOrEqual(6); // StGB 165/187/305bis, MStG 73/76/156
  });

  it('StGB Art. 187: «1bis» ist eigene Ziffer zwischen 1 und 2 (amtlich StGB 20261001)', () => {
    expect(artikel('STGB', '187').bloecke.map((b) => b.ziffer)).toEqual(['1', '1', '1', '1', '1bis', '2', '3', '4', '5', '6']);
  });

  it('Sammel-Ziffer «a_b» (Konvention art_77_78): MStG Art. 122 «2. und 3. …» erbt nicht die Ziffer 1; VZV Art. 145 «1.–2. …»', () => {
    expect(artikel('MSTG', '122').bloecke.map((b) => b.ziffer)).toEqual(['1', '1', '2_3']);
    expect(artikel('VZV', '145').bloecke[0].ziffer).toBe('1_2');
  });

  it('B3 an echten Daten: «Ziff. 1» / «Ziff. 1bis» / «Art. 305bis Ziff. 1bis» lösen auf den richtigen Block auf', () => {
    const z = (erlass: string, token: string, zitat: string) => {
      const e = artikel(erlass, token);
      const t = [...bestimmePassusZiel(e.bloecke, parsePassus(zitat)!).zielBloecke!];
      return t.map((i) => e.bloecke[i].text.slice(0, 5));
    };
    expect(z('STGB', '187', 'Art. 187 Ziff. 1 StGB')).toEqual(['1. We', 'es zu', 'es in', 'wird ']);
    expect(z('STGB', '187', 'Art. 187 Ziff. 1bis StGB')).toEqual(['1bis.']);
    expect(z('STGB', '305_bis', 'Art. 305bis Ziff. 1bis StGB')).toEqual(['1bis.']);
    expect(z('MSTG', '122', 'Art. 122 Ziff. 3 MStG')).toEqual(['2. un']);
  });

  it('MStG Art. 177 Ziffer 1 (einfaches nbsp) wird erkannt', () => {
    expect(artikel('MSTG', '177').bloecke.map((b) => b.ziffer)).toEqual(['1', '2', '2']);
  });
});
