import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import { istProsaZelle } from '../components/normtext/tarifText';
import type { NormSnapshot } from '../lib/normtext/typen';

// W2·17-UI-BEFUNDE DFG-D01/D02 (2.10.2026): Prosa-Zellen brechen um, Zahlen,
// Beträge und kurze Zellen bleiben einzeilig. Vorher: `w-max` (kanonisch) bzw.
// `whitespace-nowrap` an jeder Zelle ab Spalte 2 (Legacy) — GebV SchKG Art. 37
// stand 1'549 px breit in einem 603-px-Kasten.

const klassen = (out: string) => [...out.matchAll(/role="(?:cell|columnheader)" class="([^"]*)"/g)].map((m) => m[1]);
const render = (mehrspaltig: NonNullable<NormSnapshot['bloecke'][number]['mehrspaltig']>) =>
  renderToString(<ArtikelBody bloecke={[{ absatz: null, text: '', mehrspaltig }]} artikel="37" passus={{ absatz: null }} />);

describe('Prosa-Schwelle', () => {
  it('Beträge, Bereiche, Daten sind keine Prosa; ein Satz ist Prosa', () => {
    for (const z of ['25.–', 'bis 1 000', 'über 10 000 bis 100 000', '8. März 1960', '']) expect(istProsaZelle(z)).toBe(false);
    for (const z of ['zuzügl. 20% des Fr. 1 000 übersteigenden Streitwertes', '6 Promille, jedoch höchstens 150.–']) expect(istProsaZelle(z)).toBe(true);
  });
});

describe('kanonische Tabelle: Textspalte bricht um (DFG-D02)', () => {
  const out = render({
    spalten: [{ typ: 'text', titel: 'Streitwert' }, { typ: 'betrag', titel: 'Gebühr' }, { typ: 'text', titel: '' }],
    zeilen: [['bis 1 000', '250', 'zuzügl. 20% des Fr. 1 000 übersteigenden Streitwertes']],
  });
  const k = klassen(out);

  it('kein `w-max` am Tabellenkörper', () => {
    expect(out).not.toMatch(/class="table min-w-full w-max"/);
    expect(out).toContain('class="table min-w-full"');
  });
  it('Prosa-Zelle: Wortumbruch statt nowrap; Kurzzelle und Betrag: nowrap', () => {
    // Reihenfolge: 3 Kopfzellen, dann die 3 Zellen der Zeile.
    expect(k[5]).toContain('lc-wortumbruch');
    expect(k[5]).not.toContain('whitespace-nowrap');
    expect(k[3]).toContain('whitespace-nowrap');
    expect(k[4]).toContain('whitespace-nowrap');
    expect(k[4]).toContain('text-right');
  });
});

describe('Legacy-Tabelle: Prosa in Spalte 2+ bricht um, leere Auffüll-Spalten sparen Abstand (DFG-D01)', () => {
  const out = render({
    kopf: ['', 'Restschuld/Franken', 'Gebühr/Franken'],
    zeilen: [
      ['b.', 'für die Eintragung einer Zession', '10.–'],
      ['c.', 'für die Vorlegung des Registers oder für eine sich darauf stützende Auskunft', '9.–'],
    ],
  });
  const k = klassen(out);
  // 3 Spalten gefüllt; mit `spalten = 3` gibt es keine leere Spalte → alle px-3.

  it('Prosa-Zelle in Spalte 2 bricht um, Betrag in Spalte 3 nicht', () => {
    // Kopf: k[0..2]; Zeile b.: k[3..5]; Zeile c.: k[6..8]
    expect(k[4]).toContain('lc-wortumbruch');
    expect(k[4]).not.toContain('whitespace-nowrap');
    expect(k[7]).toContain('lc-wortumbruch');
    expect(k[5]).toContain('whitespace-nowrap');
    expect(k[8]).toContain('whitespace-nowrap');
  });
  it('Marke «b.» in Spalte 1 bricht nicht um (keine 9 rem Mindestbreite für einen Buchstaben)', () => {
    expect(k[3]).toContain('whitespace-nowrap');
    expect(k[3]).not.toContain('min-w-[9rem]');
  });
  it('Zellwortlaut unverändert', () => {
    expect(out).toContain('für die Vorlegung des Registers oder für eine sich darauf stützende Auskunft');
  });

  it('Auffüll-Spalten ohne jeden Inhalt tragen keinen Innenabstand', () => {
    // Zeilen mit 5 Zellen, Kopf mit 2 → Spalten 3 und 4 sind in jeder Zeile leer.
    const o = render({ kopf: ['A', 'B'], zeilen: [['x', 'y', '', '', '7.–'], ['z', 'w', '', '', '8.–']] });
    const kk = klassen(o);
    expect(kk.filter((c) => c.includes('px-0')).length).toBe(6); // Kopf 2 + 2 Zeilen × 2 leere Spalten
    expect(kk.filter((c) => c.includes('px-3')).length).toBe(9);
  });
});
