// HN-05-Auflage (W2·27-BUND-FERTIG P6): «Ziff. N» löst gegen die Ziffer-Ebene
// der Blöcke (`ziffer`) auf, bevor es als Aufzählungs-Marke gilt.
import { describe, it, expect } from 'vitest';
import { bestimmePassusZiel } from '../lib/normtext/passusZiel';
import { parsePassus } from '../lib/normtext/passus';
import type { NormSnapshot } from '../lib/normtext/typen';

type B = NormSnapshot['bloecke'];

// BV Art. 197-Form: Überschrift-Ziffern, jede Ziffer zählt ihre Absätze neu ab 1.
const bv: B = [
  { absatz: null, text: '1. Beitritt der Schweiz zur UNO', titel: 3, ziffer: '1' },
  { absatz: '1', text: 'Die Schweiz tritt der UNO bei.', ziffer: '1' },
  { absatz: '2', text: 'Der Bundesrat wird ermächtigt.', ziffer: '1' },
  { absatz: null, text: '9. Übergangsbestimmungen zu Art. 75b', titel: 3, ziffer: '9' },
  { absatz: '1', text: 'Tritt die Gesetzgebung nicht in Kraft …', ziffer: '9' },
  {
    absatz: '2', text: 'Baubewilligungen sind nichtig:', ziffer: '9',
    items: [{ marke: 'a', text: 'erste Voraussetzung;' }, { marke: 'b', text: 'zweite Voraussetzung.' }],
  },
  { absatz: null, text: '12. Übergangsbestimmung zu Art. 10a', titel: 3, ziffer: '12' },
  { absatz: null, text: 'Die Ausführungsgesetzgebung ist innert zweier Jahre zu erarbeiten.', ziffer: '12' },
];

// StGB Art. 140-Form: Ziffer-Absatz-Blöcke, unnummerierte Folge-Absätze erben die Ziffer.
const stgb: B = [
  { absatz: null, text: '1. Wer mit Gewalt einen Diebstahl begeht, wird bestraft.', ziffer: '1' },
  { absatz: null, text: 'Wer, auf frischer Tat ertappt, Nötigung verübt, wird gleich bestraft.', ziffer: '1' },
  {
    absatz: null, text: '2. Der Täter wird bestraft, wenn er:', ziffer: '2',
    items: [{ marke: 'a', text: 'gewerbsmässig handelt;' }, { marke: 'b', text: 'als Bande handelt.' }],
  },
  {
    absatz: null, text: '3. Der Täter wird härter bestraft, wenn er:', ziffer: '3',
    items: [{ marke: 'a', text: 'eine Waffe trägt;' }],
  },
];

const ziel = (b: B, zitat: string) => bestimmePassusZiel(b, parsePassus(zitat)!);

describe('Ziffer-Ebene — Überschrift-Ziffern (BV Art. 197)', () => {
  it('«Ziff. 12» ohne Absatz markiert den Inhalt der Ziffer 12, nicht eine Item-Marke', () => {
    const z = ziel(bv, 'Art. 197 Ziff. 12');
    expect([...z.zielBloecke!]).toEqual([7]);
    expect(z.hervorBlock).toBe(bv[7]);
    expect(z.passusMarke).toBeNull();
    expect(z.zielItemKey).toBeNull();
  });

  it('«Ziff. 9 Abs. 1» trifft den Absatz 1 der Ziffer 9 — nicht den Absatz 1 der Ziffer 1 (Kollision der Absatznummern)', () => {
    const z = ziel(bv, 'Art. 197 Ziff. 9 Abs. 1');
    expect([...z.zielBloecke!]).toEqual([4]);
    expect(z.hervorBlock).toBe(bv[4]);
  });

  it('«Ziff. 9 Abs. 2 lit. b» trifft genau dieses Item', () => {
    const z = ziel(bv, 'Art. 197 Ziff. 9 Abs. 2 lit. b');
    expect(z.zielItemKey).toEqual({ bi: 5, ji: 1 });
    expect(z.passusMarke).toBe('b');
  });

  it('«Ziff. 1» markiert beide Absatz-Blöcke der Ziffer, nicht die Überschrift', () => {
    expect([...ziel(bv, 'Art. 197 Ziff. 1').zielBloecke!]).toEqual([1, 2]);
  });

  it('nicht aufzulösender Absatz («Ziff. 12 Abs. 5») fällt auf die Ziffer als Ganzes zurück — nie auf eine fremde Ziffer', () => {
    expect([...ziel(bv, 'Art. 197 Ziff. 12 Abs. 5').zielBloecke!]).toEqual([7]);
  });

  it('ohne Ziff. bleibt «Abs. 1» der Legacy-Pfad (alle Blöcke mit absatz 1 — unverändert)', () => {
    const z = ziel(bv, 'Art. 197 Abs. 1');
    expect(z.zielBloecke).toBeUndefined();
    expect(z.hervorBlock).toBe(bv[1]);
  });
});

describe('Ziffer-Ebene — Absatz-Ziffern (StGB)', () => {
  it('«Ziff. 1 Abs. 2» zählt die unnummerierten Folge-Absätze der Ziffer positional (Art. 140 Ziff. 1 Abs. 2 StGB)', () => {
    const z = ziel(stgb, 'Art. 140 Ziff. 1 Abs. 2');
    expect([...z.zielBloecke!]).toEqual([1]);
    expect(z.hervorBlock).toBe(stgb[1]);
  });

  it('«Ziff. 1 Abs. 1» trifft den Ziffer-Block selbst', () => {
    expect([...ziel(stgb, 'Art. 140 Ziff. 1 Abs. 1').zielBloecke!]).toEqual([0]);
  });

  it('«Ziff. 3 lit. a» trifft lit. a der Ziffer 3 — nicht lit. a der Ziffer 2', () => {
    const z = ziel(stgb, 'Art. 139 Ziff. 3 lit. a');
    expect(z.zielItemKey).toEqual({ bi: 3, ji: 0 });
    const z2 = ziel(stgb, 'Art. 139 Ziff. 2 lit. b');
    expect(z2.zielItemKey).toEqual({ bi: 2, ji: 1 });
  });
});

describe('Ziffer-Ebene — Rückfall auf die Legacy-Auflösung (kein Verhalten ändert sich ohne ziffer)', () => {
  const legacy: B = [
    { absatz: '2', text: 'Zweiter Absatz:', items: [{ marke: '3', text: 'dritte Ziffer;' }, { marke: '4', text: 'vierte Ziffer.' }] },
  ];

  it('Artikel ohne ziffer-Blöcke: «Ziff. 3» bleibt die Item-Marke', () => {
    const z = ziel(legacy, 'Art. 5 Abs. 2 Ziff. 3');
    expect(z.zielBloecke).toBeUndefined();
    expect(z.zielItemKey).toEqual({ bi: 0, ji: 0 });
  });

  it('Artikel MIT ziffer-Blöcken, aber unbekannter Ziffer: «Ziff. 7» bleibt die Item-Marke', () => {
    const gemischt: B = [...stgb, { absatz: '2', text: 'Tail:', ziffer: '3', items: [{ marke: '7', text: 'siebte Ziffer.' }] }];
    const z = ziel(gemischt, 'Art. 139 Ziff. 7');
    expect(z.zielBloecke).toBeUndefined();
    expect(z.zielItemKey).toEqual({ bi: 4, ji: 0 });
  });
});
