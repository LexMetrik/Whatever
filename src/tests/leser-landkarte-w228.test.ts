/**
 * W2·28-TREFFER-LANDKARTE · L-1/L-2 — die Massstabs-Rechnung und ihre
 * Trefferquelle.
 *
 * DIE TRAGENDE ZUSICHERUNG (§5, DoD des Fahrplans): die Marken der Landkarte
 * kommen aus DENSELBEN Treffern wie die bestehende Hervorhebung — nie aus einer
 * zweiten Zählung. Der Beweis steht hier und nicht in e2e, weil er eine reine
 * Datenfrage ist: aus `sucheImErlass` bzw. `trefferInErwaegungen` fällt eine
 * Trefferliste, und `landkarteMarken` darf daraus genau eine Marke je Eintrag
 * machen, ohne die Fundstellen neu zu zählen.
 *
 * FIXTURE-REGEL (Lehre 9.8.2026): Erlasse über den REGISTER-SCHLÜSSEL laden.
 */
import { describe, it, expect } from 'vitest';
import { ladeNormFixture } from './fixtures/normtext-fixture';
import {
  bereichZuId, feldBeiAnteil, landkarteBaender, landkarteMarken, landkarteSpur,
  type LandkarteEinheit,
} from '../components/leser/landkarteModell';
import { gesetzLandkarteEinheiten } from '../pages/gesetz-leser/v3/landkarteGesetz';
import { entscheidLandkarteEinheiten } from '../pages/entscheidLandkarte';
import { baueLeserSuchIndex, sucheImErlass, zaehleTreffer } from '../pages/gesetz-leser/leserSuche';
import { trefferInErwaegungen, zaehleTreffer as zaehleEntscheidTreffer } from '../pages/entscheidLeserRegeln';
import type { EntscheidAbschnitt } from '../lib/rechtsprechung/typen';

const EINHEITEN: LandkarteEinheit[] = [
  { id: 'a', label: 'Art. 1', umfang: 100, abschnitt: 'Erster Titel' },
  { id: 'b', label: 'Art. 2', umfang: 300, abschnitt: 'Erster Titel' },
  { id: 'c', label: 'Art. 3', umfang: 0, abschnitt: 'Zweiter Titel' },
  { id: 'd', label: 'Art. 4', umfang: 100, abschnitt: null },
];

describe('landkarteSpur — der Massstab', () => {
  it('belegt 0..1 lückenlos und endet exakt auf 1', () => {
    const spur = landkarteSpur(EINHEITEN);
    expect(spur[0].von).toBe(0);
    expect(spur[spur.length - 1].bis).toBe(1);
    for (let i = 1; i < spur.length; i++) expect(spur[i].von).toBe(spur[i - 1].bis);
  });

  it('bildet den Umfang ab, nicht die Stückzahl', () => {
    const spur = landkarteSpur(EINHEITEN);
    const hoehe = (i: number) => spur[i].bis - spur[i].von;
    // Art. 2 trägt dreimal so viele Zeichen wie Art. 1 — und ist dreimal so hoch.
    expect(hoehe(1) / hoehe(0)).toBeCloseTo(3, 5);
  });

  it('gibt auch einem leeren (aufgehobenen) Baustein eine sichtbare Höhe', () => {
    const spur = landkarteSpur(EINHEITEN);
    expect(spur[2].bis).toBeGreaterThan(spur[2].von);
  });

  it('leere Eingabe ⇒ leere Spur (kein Streifen, §8)', () => {
    expect(landkarteSpur([])).toEqual([]);
  });
});

describe('landkarteMarken — EINE Trefferquelle (§5)', () => {
  it('erzeugt genau eine Marke je Treffer und zählt nichts nach', () => {
    const spur = landkarteSpur(EINHEITEN);
    const treffer = [{ id: 'b', anzahl: 7 }, { id: 'd', anzahl: 1 }];
    const marken = landkarteMarken(spur, treffer);
    expect(marken).toHaveLength(treffer.length);
    expect(marken.map((m) => m.anzahl)).toEqual([7, 1]);
    expect(marken[0].von).toBe(spur[1].von);
  });

  it('erfindet keine Lage für einen Treffer ausserhalb der Spur (§8)', () => {
    const spur = landkarteSpur(EINHEITEN);
    expect(landkarteMarken(spur, [{ id: 'gibts-nicht', anzahl: 3 }])).toEqual([]);
  });
});

describe('landkarteBaender / feldBeiAnteil / bereichZuId', () => {
  it('fasst gleiche Etiketten zusammen und erfindet keines', () => {
    const baender = landkarteBaender(landkarteSpur(EINHEITEN));
    expect(baender.map((b) => b.label)).toEqual(['Erster Titel', 'Zweiter Titel']);
    expect(baender[0].von).toBe(0);
  });

  it('trifft das Feld unter dem Klick und klemmt an den Rändern', () => {
    const spur = landkarteSpur(EINHEITEN);
    expect(feldBeiAnteil(spur, -1)?.id).toBe('a');
    expect(feldBeiAnteil(spur, 2)?.id).toBe('d');
    expect(feldBeiAnteil(spur, (spur[1].von + spur[1].bis) / 2)?.id).toBe('b');
  });

  it('spannt die Leseposition über ALLE Felder einer Id', () => {
    const spur = landkarteSpur([
      { id: 'abschnitt-sachverhalt', label: 'Sachverhalt', umfang: 10, abschnitt: 'Sachverhalt' },
      { id: 'abschnitt-sachverhalt', label: 'Sachverhalt', umfang: 10, abschnitt: 'Sachverhalt' },
      { id: 'e-1', label: 'E. 1', umfang: 10, abschnitt: 'Erwägungen' },
    ]);
    expect(bereichZuId(spur, 'abschnitt-sachverhalt')).toEqual({ von: 0, bis: spur[1].bis });
    expect(bereichZuId(spur, 'unbekannt')).toBeNull();
  });
});

describe('Gesetz-Leser: Marken-Zahl == Treffer-Zahl der Dokumentsuche', () => {
  const { eintraege, struktur } = ladeNormFixture('bund', 'BGFA');
  const spur = landkarteSpur(gesetzLandkarteEinheiten(eintraege, struktur));

  it('jeder Artikel des Erlasses steht genau einmal auf der Spur', () => {
    expect(spur).toHaveLength(eintraege.length);
    expect(new Set(spur.map((f) => f.id)).size).toBe(eintraege.length);
  });

  for (const begriff of ['anwalt', 'aufsicht', 'berufsregeln']) {
    it(`«${begriff}»: eine Marke je Treffer, Summe = Fundstellen`, () => {
      const index = baueLeserSuchIndex('BGFA', eintraege, struktur);
      const treffer = sucheImErlass(index, begriff);
      const { fundstellen } = zaehleTreffer(treffer);
      expect(treffer.length).toBeGreaterThan(0);
      const marken = landkarteMarken(spur, treffer.map((t) => ({ id: t.token, anzahl: t.fundstellen })));
      // Die zwei Hälften der Zusicherung: Zahl der Marken == Zahl der Treffer,
      // und die Fundstellen sind DURCHGEREICHT, nicht nachgezählt.
      expect(marken).toHaveLength(treffer.length);
      expect(marken.reduce((n, m) => n + m.anzahl, 0)).toBe(fundstellen);
    });
  }

  it('trägt die amtliche Gliederung als Abschnitts-Etikett — oder keines', () => {
    const baender = landkarteBaender(spur);
    for (const b of baender) expect(b.label.length).toBeGreaterThan(0);
    // Die Etiketten stammen aus derselben Quelle wie `gruppe` der Trefferliste.
    const erste = struktur?.[eintraege[0].artikel]?.gliederung?.[0]?.label ?? null;
    expect(spur[0].abschnitt).toBe(erste);
  });
});

describe('Entscheid-Leser: dieselben Anker wie die Trefferliste (§5)', () => {
  const abschnitte: EntscheidAbschnitt[] = [
    { typ: 'sachverhalt', bloecke: [{ marke: null, text: 'Die Miete war strittig.' }] },
    {
      typ: 'erwaegung',
      bloecke: [
        { marke: 'E. 1', text: 'Zur Miete im Allgemeinen.' },
        { marke: 'E. 1.1', text: 'Die Miete ist ein Dauerschuldverhältnis; Miete bleibt Miete.' },
        { marke: 'E. 2', text: 'Kosten.' },
      ],
    },
    { typ: 'dispositiv', bloecke: [{ marke: null, text: 'Die Beschwerde wird abgewiesen.' }] },
  ];
  const spur = landkarteSpur(entscheidLandkarteEinheiten(abschnitte));

  it('jeder Treffer-Anker der Liste findet seine Lage auf der Spur', () => {
    const treffer = trefferInErwaegungen(abschnitte, 'miete');
    expect(treffer.length).toBeGreaterThan(0);
    const marken = landkarteMarken(spur, treffer.map((t) => ({ id: t.anker, anzahl: t.anzahl })));
    expect(marken).toHaveLength(treffer.length);
    // Die Gesamtzahl der Fundstellen ist die des Lesers — sie liegt HÖHER als
    // die Summe der Marken, weil der Sachverhalt kein anspringbarer Anker ist
    // (§8: der Leser nennt beide Zahlen, die Landkarte behauptet keine dritte).
    expect(zaehleEntscheidTreffer(abschnitte, 'miete'))
      .toBeGreaterThanOrEqual(marken.reduce((n, m) => n + m.anzahl, 0));
  });

  it('bildet alle vier Abschnittsarten als Bänder ab, in Dokument-Reihenfolge', () => {
    expect(landkarteBaender(spur).map((b) => b.label)).toEqual(['Sachverhalt', 'Erwägungen', 'Dispositiv']);
  });

  it('gibt Sachverhalt und Dispositiv den Abschnitts-Anker als Sprungziel', () => {
    expect(spur[0].id).toBe('abschnitt-sachverhalt');
    expect(spur[spur.length - 1].id).toBe('abschnitt-dispositiv');
  });
});
