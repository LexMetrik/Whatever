/**
 * W2·17-UI-BEFUNDE · Suchsemantik des Gesetzesreaders — Zählung, Hervorhebung und
 * Sprungziel beschreiben EINE Menge (PE-C8-B01, PE-C9-B01…B06).
 *
 * Die DOM-Seite (Walker über Link-/Markergrenzen, Blockgrenzen) prüft
 * `e2e/leser-suchsemantik-w217.e2e.ts`; hier steht, was reine Ableitung ist:
 * die Faltung, die Knoten-Offset-Abbildung, die Malbarkeit je Fundstelle und
 * der Sprungrang (`malRang`) der Folge.
 *
 * ROT VOR DEM FIX (1.10.2026, vitest auf origin/main 0880efac9): jeder Fall
 * unten scheiterte an dem im Titel genannten Befund.
 */
import { describe, it, expect } from 'vitest';
import {
  baueLeserSuchIndex, sucheImErlass, fundstellenFolge, badgesFuer, artikelFundstellen,
} from '../pages/gesetz-leser/leserSuche';
import { findeVorkommen, findeUeberKnoten } from '../pages/gesetz-leser/suchHighlight';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { StrukturMap } from '../lib/normtext/browse';

const basis = {
  ebene: 'bund' as const, quelle: 'X', erlass: 'X',
  stand: '2026-01-01', quelleUrl: 'https://example.invalid', abgerufen: '2026-01-01',
  fassungsToken: '20260101', sha: 'x',
};

function artikel(nr: string, text: string, extra: Partial<NormSnapshot> = {}): NormSnapshot {
  return { ...basis, id: `x/${nr}`, artikel: nr, artikelLabel: `Art. ${nr}`, bloecke: [{ absatz: '1', text }], ...extra };
}

// ═══ C9-B05 · Zeichenvarianten ═══════════════════════════════════════════════
describe('findeVorkommen — Zeichenvarianten werden vereinheitlicht (PE-C9-B05)', () => {
  it('geschützter Bindestrich U+2011 ≙ «-» (IV‑Stelle), in beide Richtungen', () => {
    expect(findeVorkommen('die IV‑Stelle prüft', 'IV-Stelle')).toEqual([[4, 13]]);
    expect(findeVorkommen('die IV-Stelle prüft', 'IV‑Stelle')).toEqual([[4, 13]]);
    expect(findeVorkommen('AHV‐pflichtig', 'ahv-pflichtig')).toEqual([[0, 13]]);
  });

  it('ß ≙ ss: «Gleichmäßigkeit» ist mit «Gleichmässigkeit» findbar, Offsets bleiben roh', () => {
    const text = 'zur Gleichmäßigkeit';
    const [[von, bis]] = findeVorkommen(text, 'Gleichmässigkeit');
    expect(text.slice(von, bis)).toBe('Gleichmäßigkeit');
    expect(findeVorkommen('Gleichmässigkeit', 'gleichmäßigkeit')).toEqual([[0, 16]]);
  });

  it('ß wird nie doppelt gezählt (Suche «s» in «ß»: eine Stelle, nicht zwei)', () => {
    expect(findeVorkommen('aßb', 's')).toEqual([[1, 2]]);
  });

  it('zerlegte Umlaute (a + U+0308) ≙ ä; die Range deckt BEIDE Zeichen', () => {
    const text = 'Fussgänger';
    const [[von, bis]] = findeVorkommen(text, 'Fussgänger');
    expect([von, bis]).toEqual([0, text.length]);
    expect(findeVorkommen(text, 'ä')).toEqual([[6, 8]]);
    // akzenttreu bleibt es: «a» findet das zerlegte ä NICHT.
    expect(findeVorkommen(text, 'ga')).toEqual([]);
  });

  it('unsichtbare Trennzeichen (U+00AD, U+200B, U+2060) fallen aus dem Vergleich', () => {
    expect(findeVorkommen('Haf­tung', 'Haftung')).toEqual([[0, 8]]);
    expect(findeVorkommen('Ha​ftung', 'Haftung')).toEqual([[0, 8]]);
    expect(findeVorkommen('Haftung⁠¹', 'haftung')).toEqual([[0, 7]]);
  });

  it('geschützte Leerzeichen ≙ Leerzeichen («Art. 97» = «Art. 97»)', () => {
    expect(findeVorkommen('nach Art. 97 OR', 'Art. 97')).toEqual([[5, 13]]);
  });

  it('Tausender-Faltung und Gross/Klein bleiben unverändert (B1, §6.3)', () => {
    expect(findeVorkommen('16 800 Franken', "16'800")).toEqual([[0, 6]]);
    expect(findeVorkommen('Vertrag und Vertragsschluss', 'vertrag')).toEqual([[0, 7], [12, 19]]);
  });
});

// ═══ C9-B03 · Mehrwort-Suche über Knotengrenzen ══════════════════════════════
describe('findeUeberKnoten — ein Treffer darf Textknoten überspannen (PE-C9-B03)', () => {
  it('«nach Artikel» über einen Link-Rand: eine Stelle, Start und Ende in verschiedenen Knoten', () => {
    // «… nach <a>Artikel 269</a> …» — zwei Textknoten
    const s = findeUeberKnoten(['wie nach ', 'Artikel 269', ' vorgesehen'], 'nach Artikel');
    expect(s).toEqual([{ vonKnoten: 0, vonOffset: 4, bisKnoten: 1, bisOffset: 7 }]);
  });

  it('Treffer innerhalb EINES Knotens bleiben wie zuvor (Fortschritt, mehrere)', () => {
    expect(findeUeberKnoten(['Vertrag und Vertrag'], 'vertrag')).toEqual([
      { vonKnoten: 0, vonOffset: 0, bisKnoten: 0, bisOffset: 7 },
      { vonKnoten: 0, vonOffset: 12, bisKnoten: 0, bisOffset: 19 },
    ]);
  });

  it('drei Knoten, Treffer endet genau an einer Knotengrenze', () => {
    const s = findeUeberKnoten(['gemäss ', 'Art', '. 5'], 'gemäss Art');
    expect(s).toEqual([{ vonKnoten: 0, vonOffset: 0, bisKnoten: 1, bisOffset: 3 }]);
  });

  it('ein Treffer, der erst im zweiten Knoten beginnt, adressiert diesen Knoten', () => {
    const s = findeUeberKnoten(['abc ', 'Artikel ', 'Artikel x'], 'artikel ');
    expect(s.map((x) => [x.vonKnoten, x.vonOffset, x.bisKnoten, x.bisOffset])).toEqual([[1, 0, 1, 8], [2, 0, 2, 8]]);
  });

  it('die Faltung gilt über Knoten: Wortverbinder U+2060 vor einem (übersprungenen) Marker stört nicht', () => {
    const s = findeUeberKnoten(['nach Artikel⁠', ' 269'], 'artikel 269');
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ vonKnoten: 0, vonOffset: 5, bisKnoten: 1, bisOffset: 4 });
  });

  it('keine Stelle ⇒ leer; leere Knotenliste ⇒ leer', () => {
    expect(findeUeberKnoten(['a', 'b'], 'xyz')).toEqual([]);
    expect(findeUeberKnoten([], 'x')).toEqual([]);
  });
});

// ═══ Index-Fixtures für die Malbarkeits-/Rang-Fälle ═══════════════════════════
function struktur(teile: StrukturMap): StrukturMap { return teile; }

// ═══ C8-B01 / C9-B02 · Suchbereich ≠ «Alles»: Sprungrang über ALLE gemalten Stellen ═
describe('malRang bei Suchbereich ≠ «Alles» (PE-C8-B01 = PE-C9-B02)', () => {
  // Art. 7: Kopf «Art. 7» (Feld g, gemalt, ausserhalb des Bereichs «Text») + zwei
  // Fliesstext-Stellen. Gemalt wird in der Lesespalte ALLES: Kopf, dann beide
  // Stellen — die erste Fundstelle des BEREICHS ist also die ZWEITE gemalte.
  const e = [artikel('7', 'siehe Art. 5 und Art. 6')];
  const st = struktur({ '7': { gliederung: [], marginalie: [] } });
  const ix = baueLeserSuchIndex('X', e, st);

  it('Bereich «Alles»: Kopf = malRang 0, dann die beiden Stellen 1 und 2', () => {
    const folge = fundstellenFolge(sucheImErlass(ix, 'Art.', 'alles'), false);
    expect(folge.map((f) => f.malRang)).toEqual([0, 1, 2]);
  });

  it('Bereich «Text»: die Folge nennt nur die zwei Text-Stellen, ihr malRang zählt den Kopf mit', () => {
    const folge = fundstellenFolge(sucheImErlass(ix, 'Art.', 'text'), false);
    expect(folge.map((f) => f.rang)).toEqual([0, 1]);
    expect(folge.map((f) => f.malRang)).toEqual([1, 2]);
  });

  it('Bereich «Überschriften»: der Kopf selbst ist malRang 0', () => {
    const folge = fundstellenFolge(sucheImErlass(ix, 'Art.', 'titel'), false);
    expect(folge.map((f) => f.malRang)).toEqual([0]);
  });

  it('Bereich «Fussnoten» bei sichtbarem Apparat: die Fussnote kommt NACH Kopf und Text', () => {
    const e2 = [artikel('8', 'Art. 5 gilt', {})];
    const st2 = struktur({ '8': { gliederung: [], marginalie: [], fussnoten: [{ nr: '1', text: 'Art. 9 früher', links: [] }] } });
    const ix2 = baueLeserSuchIndex('X', e2, st2);
    const folge = fundstellenFolge(sucheImErlass(ix2, 'Art.', 'fussnoten'), false);
    // gemalt in Dokumentreihenfolge: Kopf (0), Text (1), Fussnote (2)
    expect(folge.map((f) => f.malRang)).toEqual([2]);
    // Apparat aus: die Fussnote ist nicht malbar, ihr Rang ist null
    expect(fundstellenFolge(sucheImErlass(ix2, 'Art.', 'fussnoten'), true).map((f) => f.malRang)).toEqual([null]);
  });

  it('gleiche Folge für «Alles» und Bereich, wo der Bereich nichts ausschliesst (Rang = Rang)', () => {
    const a = fundstellenFolge(sucheImErlass(ix, 'Art. 5', 'alles'), false).map((f) => f.malRang);
    const t = fundstellenFolge(sucheImErlass(ix, 'Art. 5', 'text'), false).map((f) => f.malRang);
    expect(t).toEqual(a);
  });
});

// ═══ C9-B01 · Fussnoten: Malbarkeit hängt am Apparat-Zustand ═════════════════
describe('Fussnoten sind in Stellung «aus» nicht malbar — jede Klasse (PE-C9-B01)', () => {
  const e = [artikel('4', 'Ohne Treffer.')];
  const st = struktur({
    '4': {
      gliederung: [], marginalie: [],
      fussnoten: [
        { nr: '1', text: 'SR 943.03', links: [], kl: 'V' },
        { nr: '2', text: 'SR 220', links: [] },
        { nr: '3', text: 'Fassung gemäss SR 221', links: [], kl: 'A' },
      ],
    },
  });
  const treffer = sucheImErlass(baueLeserSuchIndex('X', e, st), 'SR');

  it('alle drei Fussnoten tragen dieselbe Malbarkeit (Apparat), unabhängig von der Klasse', () => {
    expect(treffer[0].felder.map((f) => f.malbar)).toEqual(['aenderung']);
    expect(treffer[0].fundstellen).toBe(3);
  });

  it('Apparat aus: kein Sprungrang, die Badge sagt «(ausgeblendet)»', () => {
    expect(fundstellenFolge(treffer, true).map((f) => f.malRang)).toEqual([null, null, null]);
    expect(badgesFuer(treffer[0], true)).toEqual(['Fussnote (ausgeblendet)']);
  });

  it('Apparat an: drei gemalte Stellen 0,1,2; die Badge hat keinen Zusatz', () => {
    expect(fundstellenFolge(treffer, false).map((f) => f.malRang)).toEqual([0, 1, 2]);
    expect(badgesFuer(treffer[0], false)).toEqual(['Fussnote']);
  });
});

// ═══ C9-B04 · eine Fussnoten-Ordnung ═════════════════════════════════════════
describe('Fussnoten-Reihenfolge im Index = Anzeige (nach Nummer) (PE-C9-B04)', () => {
  it('Sidecar-Reihenfolge [35, 36, 37, 34] ⇒ Index-Reihenfolge 34, 35, 36, 37', () => {
    const e = [artikel('60', 'Ohne.')];
    const st = struktur({
      '60': {
        gliederung: [], marginalie: [],
        fussnoten: [
          { nr: '35', text: 'BG vom 15. Juni', links: [] },
          { nr: '36', text: 'BG vom 16. Juni', links: [] },
          { nr: '37', text: 'BG vom 17. Juni', links: [] },
          { nr: '34', text: 'BG vom 19. Dez', links: [] },
        ],
      },
    });
    const ix = baueLeserSuchIndex('X', e, st);
    const f = artikelFundstellen(ix, '60', 'vom 1');
    expect(f.map((x) => x.ausschnitt.treffer + x.ausschnitt.nach.slice(0, 4))).toHaveLength(4);
    // Anzeige-Ordnung: Nr. 34 zuerst — «34 BG vom 19. Dez».
    expect(f[0].ausschnitt.vor).toContain('34');
    expect(f[3].ausschnitt.vor).toContain('37');
  });

  it('Suffixe und unparsbare Nummern: 9, 10, 10a, ohne Nummer zuletzt (wie fnNrSortKey)', () => {
    const e = [artikel('61', 'Ohne.')];
    const st = struktur({
      '61': {
        gliederung: [], marginalie: [],
        fussnoten: [
          { nr: '', text: 'x ohne Nummer', links: [] },
          { nr: '10a', text: 'x zehn a', links: [] },
          { nr: '10', text: 'x zehn', links: [] },
          { nr: '9', text: 'x neun', links: [] },
        ],
      },
    });
    const f = artikelFundstellen(baueLeserSuchIndex('X', e, st), '61', 'x ');
    expect(f.map((x) => x.ausschnitt.nach)).toEqual(['neun', 'zehn', 'zehn a', 'ohne Nummer']);
  });
});

// ═══ C9-B06 · aufgehobene Artikel ════════════════════════════════════════════
describe('Artikel ohne Wortlaut: der Körper steht nicht im DOM, also nicht malbar (PE-C9-B06)', () => {
  const e = [
    artikel('9', 'Aufgehoben', { aufgehoben: true }),
    artikel('10', 'Aufgehoben, aber nur zum Teil', {}),
  ];
  const st = struktur({ '9': { gliederung: [], marginalie: [] }, '10': { gliederung: [], marginalie: [] } });
  const treffer = sucheImErlass(baueLeserSuchIndex('X', e, st), 'aufgehoben');

  it('Art. 9 (amtlich aufgehoben): Fundstelle bleibt findbar, ist aber nie gemalt', () => {
    const t9 = treffer.find((t) => t.token === '9')!;
    expect(t9.fundstellen).toBe(1);
    expect(fundstellenFolge([t9], false).map((f) => f.malRang)).toEqual([null]);
  });

  it('ein Artikel MIT Wortlaut bleibt malbar (Gegenprobe)', () => {
    const t10 = treffer.find((t) => t.token === '10')!;
    expect(fundstellenFolge([t10], false).map((f) => f.malRang)).toEqual([0]);
  });

  it('der Kopf «Art. 9» bleibt gemalt: Suche «Art. 9» ⇒ malRang 0', () => {
    const t = sucheImErlass(baueLeserSuchIndex('X', e, st), 'Art. 9');
    expect(fundstellenFolge(t, false).map((f) => f.malRang)).toEqual([0]);
  });
});
