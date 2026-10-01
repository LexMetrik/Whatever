// HN-05-Auflage (W2·27-BUND-FERTIG P6): Korpus-Sonde der Ziffer-Ebene gegen die COMMITTETEN Snapshots.
// Belege gegen die amtliche Fassung: BV cc/1999/404 20240303 (Art. 196/197 — Überschrift-Ziffern),
// StGB cc/54/757_781_799 20261001 (Art. 139/140 — Absatz-Ziffern), gepinnte Fedlex-Filestore-HTMLs.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
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

  it('Invariante über alle Bund-Erlasse: ziffer steigt je Artikel nie rückwärts; jede Überschrift beginnt mit ihrer Ziffer', () => {
    const verstoesse: string[] = [];
    for (const f of ['BV', 'PARLG', 'STGB', 'MSTG', 'VSTRR', 'VVV', 'VZV', 'SVG', 'BETMG', 'LUGUE', 'GFK', 'CMR', 'EAUE', 'UNO_ANTIFOLTER', 'STAATENLOSE']) {
      for (const e of lade(f)) {
        let letzte = 0;
        for (const b of e.bloecke) {
          if (b.ziffer === undefined) continue;
          const n = parseInt(b.ziffer, 10);
          if (n < letzte) verstoesse.push(`${e.id}: ${b.ziffer} nach ${letzte}`);
          letzte = n;
          if (b.titel !== undefined && !b.text.startsWith(`${b.ziffer}.`)) verstoesse.push(`${e.id}: Überschrift «${b.text}» ≠ ziffer ${b.ziffer}`);
        }
      }
    }
    expect(verstoesse).toEqual([]);
  });
});
