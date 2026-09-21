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
import { markenHoehe } from '../components/leser/landkarteMasse';

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

// ─── Fertigbau 21.9.2026 · zwei Mängel der Verdrahtung, auf Modell-Ebene ─────

describe('B3 · Leseposition in den Erwägungen (Sprung-Anker ≠ Lesepositions-Anker)', () => {
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
  const erwFelder = spur.filter((f) => f.abschnitt === 'Erwägungen');

  it('DER DEFEKT: der Spy meldet «abschnitt-erwaegung» — und findet jetzt einen Bereich', () => {
    // Der Scroll-Spy des Entscheid-Lesers beobachtet ausschliesslich
    // `[id^="abschnitt-"]`; für die Erwägungen meldet er also genau diese Id.
    // Vor dem Fertigbau lieferte `bereichZuId` dafür `null`, und im grössten
    // Teil jedes Entscheids stand die Landkarte ohne Leseposition da.
    const bereich = bereichZuId(spur, 'abschnitt-erwaegung');
    expect(bereich, 'keine Leseposition für die Erwägungen — genau der Befund').not.toBeNull();
    // Und zwar über ALLE Erwägungsblöcke, nicht nur über den ersten.
    expect(bereich).toEqual({ von: erwFelder[0].von, bis: erwFelder[erwFelder.length - 1].bis });
  });

  it('DER SPRUNG BLEIBT DIE ERWÄGUNG: `id` trägt weiter den Erwägungs-Anker', () => {
    // Gegenprobe zum Test darüber. Trüge die Einheit den Abschnitts-Anker auch
    // als Sprungziel, führte jeder Klick auf eine Erwägungs-Marke an den
    // Abschnittskopf — in einem langen Urteil ein Themawechsel, kein Treffer.
    expect(erwFelder.map((f) => f.id)).toEqual(['e-1', 'e-1-1', 'e-2']);
    for (const f of erwFelder) expect(f.leseId).toBe('abschnitt-erwaegung');
    // `feldBeiAnteil` (der Klick auf den Streifen) liefert folgerichtig das
    // Sprungziel, nicht den Lesepositions-Anker.
    const mitte = (erwFelder[1].von + erwFelder[1].bis) / 2;
    expect(feldBeiAnteil(spur, mitte)?.id).toBe('e-1-1');
  });

  it('Sachverhalt und Dispositiv brauchen kein zweites Feld — `id` gilt für beides', () => {
    expect(spur[0].leseId).toBeUndefined();
    expect(bereichZuId(spur, 'abschnitt-sachverhalt')).toEqual({ von: spur[0].von, bis: spur[0].bis });
    expect(bereichZuId(spur, 'abschnitt-dispositiv')).not.toBeNull();
  });

  it('der Gesetz-Leser bleibt unberührt: ein Artikel-Token trifft sein eines Feld', () => {
    // Dort melden Scroll-Spy und Sprung dieselbe Id; `leseId` bleibt leer, und
    // `bereichZuId` fällt auf `id` zurück — die alte Zusicherung gilt weiter.
    const gesetzSpur = landkarteSpur(EINHEITEN);
    expect(gesetzSpur[1].leseId).toBeUndefined();
    expect(bereichZuId(gesetzSpur, 'b')).toEqual({ von: gesetzSpur[1].von, bis: gesetzSpur[1].bis });
  });
});

describe('B1 · Suche ohne Treffer ⇒ nichts abzubilden (der Streifen hat keinen Anlass)', () => {
  it('Entscheid: kein Treffer ⇒ Gesamtzahl 0 UND keine Marke — die Bedingung der Zone', () => {
    const abschnitte: EntscheidAbschnitt[] = [
      { typ: 'erwaegung', bloecke: [{ marke: 'E. 1', text: 'Zur Miete im Allgemeinen.' }] },
    ];
    const spur = landkarteSpur(entscheidLandkarteEinheiten(abschnitte));
    const begriff = 'grundbucheintragung';
    expect(zaehleEntscheidTreffer(abschnitte, begriff), 'Vorbedingung: der Begriff kommt nicht vor').toBe(0);
    const treffer = trefferInErwaegungen(abschnitte, begriff);
    expect(landkarteMarken(spur, treffer.map((t) => ({ id: t.anker, anzahl: t.anzahl })))).toEqual([]);
  });

  it('Gesetz: erfolgloser Begriff ⇒ null Fundstellen, null Marken', () => {
    const { eintraege, struktur } = ladeNormFixture('bund', 'BGFA');
    const index = baueLeserSuchIndex('BGFA', eintraege, struktur);
    const treffer = sucheImErlass(index, 'zzzznichtvorhanden');
    expect(zaehleTreffer(treffer).fundstellen).toBe(0);
    const gesetzSpur = landkarteSpur(gesetzLandkarteEinheiten(eintraege, struktur));
    expect(landkarteMarken(gesetzSpur, treffer.map((t) => ({ id: t.token, anzahl: t.fundstellen })))).toEqual([]);
  });
});


// ─── B4 · Die Marke bleibt eine Marke (Befund 21.9.2026) ────────────────────
//
// DER BEFUND, DER DIESEN BLOCK AUSGELÖST HAT — gemessen im Browser @1440/hell
// auf `/rechtsprechung/bge_152_V_52` mit «Beschwerde» (23 Fundstellen in 7
// Erwägungen): sieben Marken von 40.4 bis 123.5 px, zusammen 495 px LÜCKENLOS
// aneinander in einem 664 px hohen Streifen. Das waren 74.5 % der Spur als
// durchgehender roter Block; einzelne Fundstellen liessen sich darin nicht
// mehr unterscheiden. Ursache war die unbegrenzte Höhe `(bis - von) * HOEHE`:
// im GESETZ ist ein Baustein einer von 1686 Artikeln und die Marke fällt unter
// die Untergrenze (gemessen alle 88 OR-Marken 2.8–3.2 px), im ENTSCHEID ist er
// eine ganze Erwägung — aus Marken wurde Fläche.
//
// Zwei Regeln sind damit gerissen: `.claude/rules/design.md` Handschrift 4
// («Registerfarbe als Strich/Kante/Marke, NIE Fläche») und der Zweck des
// Streifens (`FAHRPLAN-RECHERCHE-KOMFORT.md` §1: dicht behandelt oder nur
// gestreift muss ohne Scrollen erkennbar sein).
//
// WARUM HIER UND NICHT IN e2e: die Klemmung ist eine reine Zahlenregel und
// damit ohne Browser vollständig prüfbar (§2). `markenHoehe` ist der EINE Weg,
// auf dem eine Markenhöhe entsteht — fällt der Deckel weg, fällt dieser Block.
//
// ROT ZU BEKOMMEN (§6.7): in `src/components/leser/TrefferLandkarte.tsx` in
// `markenHoehe` das `Math.min(MARKE_MAX, …)` streichen ⇒ der erste Fall meldet
// 186.5 statt ≤ 12.
//
// DIE ZAHLEN 12 UND 4 STEHEN HIER AUSGESCHRIEBEN und werden bewusst NICHT aus
// `TrefferLandkarte` importiert: ein Tor, das seine Schwelle von der geprüften
// Datei bezieht, folgt jeder künftigen Änderung stillschweigend und kann nicht
// mehr scheitern (§6.7). Wer den Deckel verschiebt, verschiebt ihn an zwei
// Stellen — und begründet ihn dabei.
describe('B4 · Höchsthöhe: keine Marke wird zur Fläche', () => {
  // Die sieben getroffenen Erwägungen des Befundes, als ANTEILE der Spur —
  // abgelesen aus den gemessenen `y`/`height`-Attributen des SVG (viewBox
  // 0 0 48 1000), nicht nachgerechnet.
  const GEMESSEN: { label: string; von: number; bis: number }[] = [
    { label: 'E. 4.1.2', von: 252.512, bis: 372.387 },
    { label: 'E. 4.2.1', von: 372.387, bis: 558.898 },
    { label: 'E. 4.2.2', von: 558.898, bis: 626.516 },
    { label: 'E. 4.2.3', von: 626.516, bis: 732.244 },
    { label: 'E. 4.3', von: 732.244, bis: 874.293 },
    { label: 'E. 4.4', von: 874.293, bis: 939.023 },
    { label: 'E. 4.5', von: 939.023, bis: 1000 },
  ].map((e) => ({ label: e.label, von: e.von / 1000, bis: e.bis / 1000 }));

  it('DER DEFEKT: keine der sieben Entscheid-Marken wächst über den Deckel', () => {
    for (const e of GEMESSEN) {
      const roh = (e.bis - e.von) * 1000;
      expect(roh, `Vorbedingung: ${e.label} war ungedeckelt grösser als der Deckel`)
        .toBeGreaterThan(12);
      expect(markenHoehe(e.von, e.bis), `${e.label} überschreitet die Höchsthöhe`)
        .toBeLessThanOrEqual(12);
    }
  });

  it('und der Streifen ist danach keine Fläche mehr: unter einem Fünftel Farbe', () => {
    const summe = GEMESSEN.reduce((n, e) => n + markenHoehe(e.von, e.bis), 0);
    // Vorher: 745 von 1000 Einheiten (74.5 % — der gemessene Block).
    expect(summe).toBeLessThan(200);
  });

  it('die Untergrenze bleibt: ein Artikel des OR verschwindet nicht', () => {
    // Gemessen auf /gesetze/bund/OR mit «Kündigung»: alle 88 Marken lagen auf
    // der Untergrenze. Der Deckel darf sie nicht berühren.
    const { eintraege, struktur } = ladeNormFixture('bund', 'BGFA');
    const gesetzSpur = landkarteSpur(gesetzLandkarteEinheiten(eintraege, struktur));
    const index = baueLeserSuchIndex('BGFA', eintraege, struktur);
    const treffer = sucheImErlass(index, 'Anwalt');
    expect(treffer.length, 'Vorbedingung: der Begriff kommt vor').toBeGreaterThan(0);
    const marken = landkarteMarken(gesetzSpur, treffer.map((t) => ({ id: t.token, anzahl: t.fundstellen })));
    for (const m of marken) expect(markenHoehe(m.von, m.bis)).toBeGreaterThanOrEqual(4);
  });

  it('zwischen den Grenzen bildet die Höhe weiter den Umfang ab (§1: nichts eingeebnet)', () => {
    // Zwei Bausteine unter dem Deckel: der doppelt so grosse ist doppelt so hoch.
    expect(markenHoehe(0, 0.005)).toBeCloseTo(5, 6);
    expect(markenHoehe(0, 0.01)).toBeCloseTo(10, 6);
  });
});
