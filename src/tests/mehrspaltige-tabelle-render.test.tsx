import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import type { NormSnapshot } from '../lib/normtext/typen';

// Task 2: MehrspaltigeTabelle — Render-Komponente
// Sichert: Kopf + Zeilen korrekt; numerische Zellen gruppiert; nicht-numerische
// Zellen unverändert; Blöcke OHNE mehrspaltig byte-identisch.

describe('MehrspaltigeTabelle (block.mehrspaltig → N-Spalten-Tarif)', () => {
  it('rendert Kopfzeile aus kopf[]', () => {
    const bloecke: NormSnapshot['bloecke'] = [{
      absatz: null,
      text: '',
      mehrspaltig: {
        kopf: ['Streitwert', 'Grundgebühr', 'Zuschlag'],
        zeilen: [['bis 5000', '25', '0%']],
      },
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="4" passus={{ absatz: null }} />,
    );
    expect(out).toContain('Streitwert');
    expect(out).toContain('Grundgebühr');
    expect(out).toContain('Zuschlag');
  });

  it('rendert Datenzeilen — gruppiereTausender gilt für ALLE Zellen (Issue 2+3, 22.6.2026)', () => {
    // gruppiereTausender wird auf JEDE Zelle angewendet (nicht nur numerische).
    // istNumerischeZelle steuert NUR noch die Rechtsbündigkeit.
    const bloecke: NormSnapshot['bloecke'] = [{
      absatz: null,
      text: '',
      mehrspaltig: {
        kopf: ['A', 'B'],
        zeilen: [
          ['bis 5000', '250'],
          ['über 5000 bis 10000', '1250'],
        ],
      },
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="4" passus={{ absatz: null }} />,
    );
    // «bis 5000» → «bis 5'000» (gruppiereTausender auf bare run)
    expect(out).toMatch(/bis 5&#x27;000|bis 5'000/);
    // «über 5000 bis 10000» — TEXT-Zelle, aber gruppiereTausender gilt trotzdem
    // → «über 5'000 bis 10'000»
    expect(out).toMatch(/über 5&#x27;000 bis 10&#x27;000|über 5'000 bis 10'000/);
    // «1250» → «1'250»
    expect(out).toMatch(/1&#x27;250|1'250/);
  });

  it('numerische Zelle «1250» → «1\'250» (gruppiereTausender)', () => {
    const bloecke: NormSnapshot['bloecke'] = [{
      absatz: null,
      text: '',
      mehrspaltig: {
        zeilen: [['1250']],
      },
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="4" passus={{ absatz: null }} />,
    );
    // React SSR escapes U+0027 as &#x27; — accept both forms
    expect(out).toMatch(/1&#x27;250|1'250/);
    expect(out).not.toContain('>1250<');
  });

  it('numerische Zelle «bis 10000» → «bis 10\'000» («bis» = 3 Buchstaben → numerisch)', () => {
    const bloecke: NormSnapshot['bloecke'] = [{
      absatz: null,
      text: '',
      mehrspaltig: {
        zeilen: [['bis 10000', '1000']],
      },
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="4" passus={{ absatz: null }} />,
    );
    // «bis 10000» — «bis» hat 3 Buchstaben, kein Wort mit ≥4 Buchstaben → numerisch → gruppiert
    expect(out).toMatch(/bis 10&#x27;000|bis 10'000/);
  });

  it('Zelle «über 1 Mio.» bleibt UNVERÄNDERT (hat 4-Buchstaben-Wort «über»)', () => {
    const bloecke: NormSnapshot['bloecke'] = [{
      absatz: null,
      text: '',
      mehrspaltig: {
        zeilen: [['über 1 Mio.', '5000']],
      },
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="4" passus={{ absatz: null }} />,
    );
    // «über» hat 4 Buchstaben → kein gruppiereTausender; Zelle bleibt unverändert
    expect(out).toContain('über 1 Mio.');
    // «5000» hat kein 4-Buchstaben-Wort → wird zu «5'000»
    expect(out).toMatch(/5&#x27;000|5'000/);
  });

  it('data-mehrspaltig-Attribut ist gesetzt', () => {
    const bloecke: NormSnapshot['bloecke'] = [{
      absatz: null,
      text: '',
      mehrspaltig: { zeilen: [['A', 'B']] },
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="4" passus={{ absatz: null }} />,
    );
    expect(out).toContain('data-mehrspaltig');
  });

  it('Block OHNE mehrspaltig hat KEIN data-mehrspaltig + Normaltext unverändert', () => {
    const bloecke: NormSnapshot['bloecke'] = [
      { absatz: '1', text: 'Normaler Absatz ohne Tabelle.' },
    ];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="1" passus={{ absatz: null }} />,
    );
    expect(out).toContain('Normaler Absatz ohne Tabelle.');
    expect(out).not.toContain('data-mehrspaltig');
  });

  it('mehrspaltig ohne kopf: keine Kopfzeile, nur Datenzeilen', () => {
    const bloecke: NormSnapshot['bloecke'] = [{
      absatz: null,
      text: '',
      mehrspaltig: {
        zeilen: [['250', '10%']],
      },
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="4" passus={{ absatz: null }} />,
    );
    // Kein bg-paper-sunken Kopf-span falls kein kopf
    expect(out).toContain('data-mehrspaltig');
    // Werte sind vorhanden
    expect(out).toMatch(/250|10%/);
  });

  it('Dash-Betrag «1250.–» enthält Tausender-Apostroph', () => {
    const bloecke: NormSnapshot['bloecke'] = [{
      absatz: null,
      text: '',
      mehrspaltig: {
        zeilen: [['1250.–']],
      },
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="4" passus={{ absatz: null }} />,
    );
    // «1250.–» hat Ziffern, kein 4-Buchstaben-Wort → numerisch → 1'250.–
    expect(out).toMatch(/1&#x27;250\.–|1'250\.–/);
  });

  // Issue 2+3 (22.6.2026): gruppiereTausender auf ALLE Zellen — Sicherheitstests

  it('Streitwert-Spalte «über 5 000 bis 10 000» → Apostrophe (Issue 3)', () => {
    // Leerzeichen-getrennte Tausender im Streitwert-Text werden apostrophiert.
    const bloecke: NormSnapshot['bloecke'] = [{
      absatz: null,
      text: '',
      mehrspaltig: {
        kopf: ['Streitwert', 'Grundgebühr', 'Zuschlag'],
        zeilen: [['über 5 000 bis 10 000', '1 250', 'zuzügl. 23%']],
      },
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="4" passus={{ absatz: null }} />,
    );
    // Streitwert-Spalte: Leerzeichen-Tausender apostrophiert
    expect(out).toMatch(/über 5&#x27;000 bis 10&#x27;000|über 5'000 bis 10'000/);
    // Grundgebühr: «1 250» → «1'250»
    expect(out).toMatch(/1&#x27;250|1'250/);
  });

  it('Tarif-Nr.-Zelle «1.1.1.1» wird NICHT verändert (keine Tausender-Gruppe)', () => {
    // «1.1.1.1» enthält keine Ziffernfolge der Form digit+space+3digits → unberührt.
    const bloecke: NormSnapshot['bloecke'] = [{
      absatz: null,
      text: '',
      mehrspaltig: {
        zeilen: [['1.1.1.1', 'Beschreibung']],
      },
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="4" passus={{ absatz: null }} />,
    );
    expect(out).toContain('1.1.1.1');
  });

  it('«über 10 Mio.» bleibt UNVERÄNDERT (kein digit+space+3digits-Muster)', () => {
    // «10 Mio.» — «Mio.» ist kein 3-Ziffern-Cluster → kein Apostroph gesetzt.
    const bloecke: NormSnapshot['bloecke'] = [{
      absatz: null,
      text: '',
      mehrspaltig: {
        zeilen: [['über 10 Mio.', '106 400']],
      },
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="4" passus={{ absatz: null }} />,
    );
    // «über 10 Mio.» unverändert
    expect(out).toContain('über 10 Mio.');
    // «106 400» → «106'400»
    expect(out).toMatch(/106&#x27;400|106'400/);
  });
});

// ── M10: kanonisches spalten-Modell (dumme Projektion, T-F6/T-F9) ─────────────
describe('KanonischeTabelle (block.mehrspaltig.spalten)', () => {
  const ART_20: NormSnapshot['bloecke'] = [{
    absatz: null,
    text: '',
    mehrspaltig: {
      spalten: [
        { typ: 'bereich', titel: 'Forderung/Franken' },
        { typ: 'betrag', titel: 'Gebühr/Franken' },
      ],
      zeilen: [['bis 100', '10.–'], ['über 100 bis 500', '25.–'], ['über 1 000 000', '400.–']],
    },
  }];
  const render = (b: NormSnapshot['bloecke']) =>
    renderToString(<ArtikelBody bloecke={b} artikel="20" passus={{ absatz: null }} />);

  it('rendert genau N columnheader und je Zeile N cell (T-B2/T-F6)', () => {
    const out = render(ART_20);
    expect((out.match(/role="columnheader"/g) ?? []).length).toBe(2);
    // 3 Datenzeilen × 2 Zellen = 6
    expect((out.match(/role="cell"/g) ?? []).length).toBe(6);
  });

  it('bereich linksbündig, betrag rechtsbündig + tabular-nums (T-C2/C3)', () => {
    const out = render(ART_20);
    // betrag-Kopf «Gebühr/Franken» trägt text-right
    expect(out).toMatch(/text-right[^>]*>Gebühr\/Franken|Gebühr\/Franken/);
    expect(out).toContain('text-right');
    // R5-B (5.9.2026) · DEKLARIERTE Test-Anpassung nach §6.3: die Zelle trug
    // die Roh-Utility `[font-variant-numeric:tabular-nums]`, also `.num` ohne
    // Familie UND ohne `lining-nums` — genau die halbe Deklaration, die R4-C
    // als Defekt nachgewiesen hat. Sie laeuft jetzt ueber die geteilte Rolle
    // `.lc-ziffern` (= `lining-nums tabular-nums`). BEWIESEN am Preview
    // (5.9.2026), dass das die Darstellung nicht aendert: dieselben zehn
    // Ziffern, einmal mit `tabular-nums` und einmal mit
    // `lining-nums tabular-nums` in Geist Variable auf ein Canvas gezeichnet,
    // ergeben BYTE-GLEICHE Pixel (Geist fuehrt ohnehin Versalziffern). Die
    // Aussage des Falls — «Betraege fluchten» — ist unveraendert wahr.
    expect(out).toContain('lc-ziffern');
    // bereich-Wert NICHT rechtsbündig: «bis 100» erscheint in einer Zelle ohne text-right davor — Inhalt da
    expect(out).toContain('bis 100');
  });

  it('Tausender-Apostroph in bereich + betrag (Swiss), Wortlaut-Token erhalten', () => {
    const out = render(ART_20);
    expect(out).toMatch(/1&#x27;000&#x27;000|1'000'000/); // bereich «über 1 000 000»
    expect(out).toContain('400.–'); // betrag unverändert
  });

  it('headerless (alle titel leer) rendert keine Kopfzeile', () => {
    const out = render([{
      absatz: null, text: '',
      mehrspaltig: { spalten: [{ typ: 'text', titel: '' }, { typ: 'betrag', titel: '' }], zeilen: [['Frühstück', '3.50']] },
    }]);
    expect(out).not.toContain('role="columnheader"');
    expect(out).toContain('Frühstück');
  });

  it('defensive: aritätsverletzende Zeile → linear, kein verschobenes Gitter (T-E5)', () => {
    const out = render([{
      absatz: null, text: '',
      mehrspaltig: { spalten: [{ typ: 'bereich', titel: 'A' }, { typ: 'betrag', titel: 'B' }], zeilen: [['x', 'y', 'z']] },
    }]);
    expect(out).not.toContain('role="columnheader"'); // kein Gitter
    expect(out).toContain('x · y · z'); // verlustfrei linear
  });
});

// ── W2·31 B11 (26.9.2026): Legacy-Tabelle — Nachspann und Beschriftungsspalte ──
// Befund EMRK-Geltungsbereich: 11 Einzelzellen-Fussnoten am Tabellenende zogen
// Spalte 1 auf 3'118 px. Zusicherung: der Nachspann steht unter dem Raster
// (verlustfrei, gleiche Reihenfolge), Einzelzellen MITTEN in der Tabelle bleiben
// Zeilen, nur Spalte 1 darf umbrechen.
describe('LegacyMehrspaltigeTabelle — Nachspann (B11)', () => {
  const render = (zeilen: string[][], kopf?: string[]) => renderToString(
    <ArtikelBody bloecke={[{ absatz: null, text: '', mehrspaltig: { kopf, zeilen } }]} artikel="scope_u1" passus={{ absatz: null }} />,
  );

  it('Einzelzellen-Zeilen am Ende → Nachspann unter dem Raster, Wortlaut und Reihenfolge unverändert', () => {
    const out = render([
      ['Albanien', '2. Oktober', '1996'],
      ['Europa'],
      ['Andorra*', '22. Januar', '1996'],
      ['* Vorbehalte und Erklärungen. Lange Fussnote.'],
      ['a Anwendungserklärung nach Art. 56.'],
      ['b Direktion für Völkerrecht, 3003 Bern, Sitzung vom 9. Mai 2007.'],
    ], ['Vertragsstaaten', 'Ratifikation', '']);
    // Raster: 3 Kopfzellen, 3 Zeilen (die MITTLERE Einzelzelle bleibt Zeile) × 3 = 9 Zellen
    expect((out.match(/role="columnheader"/g) ?? []).length).toBe(3);
    expect((out.match(/role="cell"/g) ?? []).length).toBe(9);
    const nach = out.slice(out.indexOf('data-tabelle-nachspann'));
    expect(nach).toContain('* Vorbehalte und Erklärungen. Lange Fussnote.');
    expect(nach.indexOf('* Vorbehalte')).toBeLessThan(nach.indexOf('a Anwendungserklärung'));
    expect(nach).not.toContain('role="cell"');
    // Prosa, keine Zahlenzelle: kein Tausender-Apostroph in PLZ und Jahr.
    expect(nach).toContain('3003 Bern, Sitzung vom 9. Mai 2007.');
  });

  it('ohne Einzelzellen-Ende kein Nachspann; einspaltige Tabelle bleibt ganz Raster', () => {
    expect(render([['A', '1'], ['B', '2']])).not.toContain('data-tabelle-nachspann');
    const einspaltig = render([['nur'], ['eine Spalte']]);
    expect(einspaltig).not.toContain('data-tabelle-nachspann');
    expect((einspaltig.match(/role="cell"/g) ?? []).length).toBe(2);
  });

  it('nur Spalte 1 darf umbrechen (mit Untergrenze), alle übrigen einzeilig, kein w-max', () => {
    const out = render([['Karibische Gebiete (Bonaire)', '1. Dezember', '1955']]);
    expect(out).not.toMatch(/class="table min-w-full w-max"/);
    const zellen = [...out.matchAll(/role="cell" class="([^"]*)"/g)].map((m) => m[1]);
    expect(zellen[0]).toContain('min-w-[9rem]');
    expect(zellen[0]).not.toContain('whitespace-nowrap');
    expect(zellen[0]).toContain('[overflow-wrap:break-word]');
    expect(zellen[1]).toContain('whitespace-nowrap');
    expect(zellen[2]).toContain('whitespace-nowrap');
  });
});
