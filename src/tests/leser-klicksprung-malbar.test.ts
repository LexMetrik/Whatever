// LESER-NAV / FB O-36 (a): ein Klick auf einen Treffer-Artikel (Trefferliste,
// Landkarten-Marke) springt zur ersten GEMALTEN Fundstelle des Artikels — nicht
// zur ersten datenseitigen, die oft im Randtitel/Gliederungspfad liegt und
// nichts malt (`lc-such-aktiv` blieb leer). Hat der Artikel keine gemalte
// Fundstelle, bleibt es bei der ersten (Artikel-Blink, §8).
import { describe, it, expect } from 'vitest';
import { ladeNormFixture } from './fixtures/normtext-fixture';
import {
  baueLeserSuchIndex, sucheImErlass, fundstellenFolge, ersterKlickSprung,
  type FundstellenSchritt,
} from '../pages/gesetz-leser/leserSuche';

const s = (token: string, rang: number, malRang: number | null): FundstellenSchritt => ({ token, rang, malRang, kopf: null });

describe('ersterKlickSprung — Randfälle', () => {
  it('erste Fundstelle nicht malbar, zweite malbar ⇒ die zweite', () => {
    const folge = [s('1', 0, 0), s('2', 0, null), s('2', 1, 0), s('2', 2, 1), s('3', 0, 0)];
    expect(ersterKlickSprung(folge, '2')).toBe(2);
  });
  it('erste malbar ⇒ die erste (unverändert)', () => {
    const folge = [s('1', 0, 0), s('2', 0, 0), s('2', 1, 1)];
    expect(ersterKlickSprung(folge, '2')).toBe(1);
  });
  it('keine malbar ⇒ die erste (Artikel-Blink)', () => {
    const folge = [s('1', 0, 0), s('2', 0, null), s('2', 1, null), s('3', 0, 0)];
    expect(ersterKlickSprung(folge, '2')).toBe(1);
  });
  it('malbare Fundstelle eines NACHBARARTIKELS wird nie gewählt', () => {
    const folge = [s('2', 0, null), s('3', 0, 0)];
    expect(ersterKlickSprung(folge, '2')).toBe(0);
  });
  it('Artikel nicht in der Folge ⇒ -1; leere Folge ⇒ -1', () => {
    expect(ersterKlickSprung([s('1', 0, 0)], '9')).toBe(-1);
    expect(ersterKlickSprung([], '1')).toBe(-1);
  });
});

// §6.3-DEKLARATION (LESER-NAV, FB O-36 b): bis O-36 b lag die erste Fundstelle
// vieler BGFA-Artikel im Gliederungspfad (`nie` malbar); der Korpus-Fall forderte
// darum «mindestens ein Artikel, dessen erste Fundstelle ungemalt war». Seit der
// Gliederungskopf gemalt wird (`kopf`), gibt es diesen Fall im BGFA nicht mehr
// (Sonde 15.10.2026: «Anwältinnen», «Anwalt» je 0) — die Tragfähigkeit wäre
// damit verloren gewesen. Sie ist am SSV wieder da: in Anhang 2 («annex_2») steht
// «Fahrbahn» zuerst im Alt-Text eines Bildes (ein Attribut, nie gemalt, `nie`) und
// danach im Wortlaut (Sonde 15.10.2026: 7 Stellen, davon die erste ungemalt). Ein
// Rückfall in «immer die erste» schlägt hier an.
// ROT ZU BEKOMMEN (§6.7): in `ersterKlickSprung` (leserSuche.ts) den Rückgabewert
// auf `folge.findIndex((f) => f.token === token)` setzen — der SSV-Fall fällt.
describe('ersterKlickSprung — am echten Korpus', () => {
  const faelle: Array<{ key: string; begriff: string; ungemalteErste: boolean }> = [
    { key: 'BGFA', begriff: 'Anwältinnen', ungemalteErste: false },
    { key: 'SSV', begriff: 'Fahrbahn', ungemalteErste: true },
  ];
  for (const { key, begriff, ungemalteErste } of faelle) {
    it(`${key} «${begriff}»: jeder Artikel mit gemalter Fundstelle landet auf einer gemalten`, () => {
      const { eintraege, struktur } = ladeNormFixture('bund', key);
      const folge = fundstellenFolge(sucheImErlass(baueLeserSuchIndex(key, eintraege, struktur), begriff), false);
      const tokens = [...new Set(folge.map((f) => f.token))];
      let altOhneMal = 0;
      for (const token of tokens) {
        const eigene = folge.filter((f) => f.token === token);
        const hatMalbar = eigene.some((f) => f.malRang !== null);
        const alt = folge.findIndex((f) => f.token === token);
        const neu = ersterKlickSprung(folge, token);
        expect(folge[neu].token).toBe(token);
        if (hatMalbar) {
          expect(folge[neu].malRang, `${token}: Klick landet auf gemalter Stelle`).not.toBeNull();
          if (folge[alt].malRang === null) altOhneMal++;
        } else {
          expect(neu, `${token}: ohne gemalte Stelle bleibt es bei der ersten`).toBe(alt);
        }
      }
      expect(tokens.length, 'Testfall trägt nicht: zu wenige Treffer-Artikel').toBeGreaterThan(ungemalteErste ? 0 : 10);
      if (ungemalteErste) {
        expect(altOhneMal, 'Testfall trägt nicht: kein Artikel, dessen erste Fundstelle ungemalt war').toBeGreaterThan(0);
      }
    });
  }
});
