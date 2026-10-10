import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { vorinstanzNominativ } from '../lib/rechtsprechung/vorinstanz';
import { extrahiereRubrum } from '../../scripts/normtext/adapter-entscheide';
import type { EntscheidSnapshotDatei } from '../lib/rechtsprechung/typen';

// U-03 (plan/FEHLERBESTAND.md): «Beschwerde gegen den Entscheid DES Appellationsgerichts …» — die Extraktion
// liess den Genitiv des Kopfworts stehen. Beispiel BGE 147 III 218 (Urteil 4A_…, Rubrum).

describe('vorinstanzNominativ', () => {
  it('Anlassfall BGE 147 III 218: Appellationsgerichts → Appellationsgericht', () => {
    expect(vorinstanzNominativ('Appellationsgerichts des Kantons Basel-Stadt, Dreiergericht, vom 24. September 2020'))
      .toBe('Appellationsgericht des Kantons Basel-Stadt, Dreiergericht, vom 24. September 2020');
  });
  it('nur das Kopfwort wird verändert', () => {
    expect(vorinstanzNominativ('Obergerichts des Kantons Aargau, Strafgericht, 1. Kammer, vom 4. Mai 2026'))
      .toBe('Obergericht des Kantons Aargau, Strafgericht, 1. Kammer, vom 4. Mai 2026');
    expect(vorinstanzNominativ('Bundesverwaltungsgerichts, Abteilung I, vom 1. November 2019 (A-4864/2018)'))
      .toBe('Bundesverwaltungsgericht, Abteilung I, vom 1. November 2019 (A-4864/2018)');
    // nominatives Kopfwort, Genitiv-Attribut dahinter bleibt Genitiv
    expect(vorinstanzNominativ('Beschwerdekammer des Bundesstrafgerichts vom 5. Mai 2022'))
      .toBe('Beschwerdekammer des Bundesstrafgerichts vom 5. Mai 2022');
    expect(vorinstanzNominativ('Verwaltungskommission des Bundespatentgerichts vom 8. April 2020'))
      .toBe('Verwaltungskommission des Bundespatentgerichts vom 8. April 2020');
  });
  it('Adjektiv folgt dem Geschlecht: Kantonales Zwangsmassnahmengericht, Grosser Rat, Kantonsrat', () => {
    expect(vorinstanzNominativ('Kantonalen Zwangsmassnahmengerichts Bern, Gerichtspräsident, vom 31. Mai 2024'))
      .toBe('Kantonales Zwangsmassnahmengericht Bern, Gerichtspräsident, vom 31. Mai 2024');
    expect(vorinstanzNominativ('Interkantonalen Geldspielgerichts vom 15. Februar 2021 (23-20)'))
      .toBe('Interkantonales Geldspielgericht vom 15. Februar 2021 (23-20)');
    expect(vorinstanzNominativ('Grossen Rats des Kantons Thurgau vom 12. Januar 2022')).toBe('Grosser Rat des Kantons Thurgau vom 12. Januar 2022');
    expect(vorinstanzNominativ('Regierungsrats des Kantons Bern vom 5. Juli 2017 (702/2017)')).toBe('Regierungsrat des Kantons Bern vom 5. Juli 2017 (702/2017)');
  });
  it('Quell-Artefakte: Silbentrennung und fehlendes Leerzeichen', () => {
    expect(vorinstanzNominativ('Bundesverwaltungs- gerichts vom 27. Oktober 2022 (A-691/2021)')).toBe('Bundesverwaltungsgericht vom 27. Oktober 2022 (A-691/2021)');
    expect(vorinstanzNominativ('Versicherungsgerichtsdes Kantons Aargau vom 8. Dezember 2023')).toBe('Versicherungsgericht des Kantons Aargau vom 8. Dezember 2023');
  });
  it('fr./it. Namen, Datums-/Satzreste und Nominative bleiben zeichengleich; idempotent', () => {
    const unveraendert = [
      'Tribunal cantonal du canton de Vaud, Chambre des recours pénale, du 29 novembre 2021',
      'Cour de justice de la République et canton de Genève, Chambre administrative',
      'Tribunale delle assicurazioni del Cantone Ticino del 14 marzo 2022',
      '8. April 2020 und das Urteil vom 10. Februar 2022 des Verwaltungsgerichts des Kantons Zürich',
      'Anklagekammer des Kantons St. Gallen vom 31. März 2021',
      'Obergericht des Kantons Zürich vom 1. Januar 2020',
    ];
    for (const t of unveraendert) expect(vorinstanzNominativ(t), t).toBe(t);
    const einmal = vorinstanzNominativ('Kantonsgerichts Luzern, 4. Abteilung, vom 23. März 2021 (7W 20 30)');
    expect(vorinstanzNominativ(einmal)).toBe(einmal);
  });
});

describe('extrahiereRubrum (Neuzug) liefert die Vorinstanz im Nominativ', () => {
  it('«Beschwerde gegen den Entscheid des …»', () => {
    const ft = 'Besetzung Bundesrichterin Hohl, Präsidentin, Gerichtsschreiber Bittel. Verfahrensbeteiligte A.________ GmbH, Beschwerdeführerin, gegen B.________ AG, Beschwerdegegnerin. Gegenstand Mieterausweisung. Beschwerde gegen den Entscheid des Appellationsgerichts des Kantons Basel-Stadt, Dreiergericht, vom 24. September 2020. Sachverhalt: A. Text.';
    expect(extrahiereRubrum(ft)?.vorinstanz).toBe('Appellationsgericht des Kantons Basel-Stadt, Dreiergericht, vom 24. September 2020');
  });
});

// Korpus-Tor: kein Rubrum der Bundes-Entscheide beginnt mit einem Genitiv-Kopfwort. Vorher: 771 von 1060
// Rubren mit Vorinstanz (Vollzählung 11.10.2026: 756 BGE + 15 BGer).
describe('Korpus: Vorinstanz im Nominativ', () => {
  const wurzel = join(process.cwd(), 'public', 'rechtsprechung', 'bund');
  const genitiv: string[] = [];
  let mitVorinstanz = 0;
  const geh = (d: string) => {
    for (const n of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, n.name);
      if (n.isDirectory()) { geh(p); continue; }
      if (!n.name.endsWith('.json')) continue;
      for (const e of (JSON.parse(readFileSync(p, 'utf8')) as EntscheidSnapshotDatei).eintraege ?? []) {
        const v = e.rubrum?.vorinstanz;
        if (!v) continue;
        mitVorinstanz++;
        if (/^(?:(?:Kantonalen|Interkantonalen|Grossen)\s+)?\p{Lu}[\p{L}-]*(?:gerichts|rats|amts|departements)(?=[\s,]|$)/iu.test(v)) genitiv.push(`${e.id}: ${v.slice(0, 60)}`);
      }
    }
  };
  geh(wurzel);
  it('Bestand trägt Vorinstanzen (das Tor prüft etwas)', () => { expect(mitVorinstanz).toBeGreaterThan(1000); });
  it('0 Rubren mit Genitiv-Kopfwort', () => { expect(genitiv).toEqual([]); });
});
