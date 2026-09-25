/**
 * W2·29-WERKBANK-REST S5b (25.9.2026) · Gesetze-/Leser-/Werkzeug-Kleinkram.
 *
 * Sichert die Zusagen der Scheibe, die weder die Flächen-Ratschen (sichtbarer
 * Text, keine Klassen) noch die e2e-Sonden eindeutig sehen. Je Block ein
 * Posten; Rot-Beweise im Bau-Bericht / PR-Body.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ErlassTabelle } from '../components/normtext/ErlassKarte';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

const quelle = (p: string) => readFileSync(p, 'utf8');

function tsxDateien(dir: string): string[] {
  const aus: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (n !== 'tests') aus.push(...tsxDateien(p)); }
    else if (p.endsWith('.tsx')) aus.push(p);
  }
  return aus;
}

describe('Ladeanzeige: EIN Baustein, keine Kopie der Ablesekante (Posten #1097-Rest)', () => {
  it('ausser ui/Ladeanzeige trägt keine Datei ein Markup «scale-rule» + «max-w-[200px]» (Klassenfolge egal)', () => {
    const funde: string[] = [];
    for (const p of tsxDateien('src')) {
      if (p.endsWith(join('ui', 'Ladeanzeige.tsx'))) continue;
      quelle(p).split('\n').forEach((z, i) => {
        if (/className=/.test(z) && /\bscale-rule\b/.test(z) && /max-w-\[200px\]/.test(z)) funde.push(`${p}:${i + 1}`);
      });
    }
    expect(funde).toEqual([]);
  });
  it('Gesetze und Rechtsprechung laden mit dem Baustein (Wortlaut unverändert)', () => {
    expect(quelle('src/pages/Gesetze.tsx')).toContain('<Ladeanzeige text="Die Sammlung wird abgerufen …" className="min-h-inhalt-region py-12" />');
    expect(quelle('src/pages/Rechtsprechung.tsx')).toContain('<Ladeanzeige text="Die Sammlung wird abgerufen …"');
  });
});

describe('ErlassTabelle: Nummer mit Sammlungs-Präfix nicht doppelt (Posten «(ESchG) (LS 632.1)»)', () => {
  // Echte Register-Zeile ZH-632.1 (public/normtext/register.json, 25.9.2026), gekürzt auf die Anzeige-Felder.
  const zh = (titel: string, sr: string, kuerzel: string): BrowseErlass => ({
    key: 'ZH-632.1', ebene: 'kanton', kanton: 'ZH', titel, kuerzel, sr,
    status: 'nur-live-link', quelleUrl: 'https://www.zh.ch/de/politik-staat/gesetze-beschluesse/gesetzessammlung.html',
    stand: '2026-01-01', artikelAnzahl: 0, sprache: 'de', aufgehoben: false,
  } as unknown as BrowseErlass);
  // Sichtbarer Text (ohne title-Attribute — der Titel steht dort als Tooltip ein zweites Mal).
  const zeile = (e: BrowseErlass, voll: boolean) => renderToStaticMarkup(
    <MemoryRouter><ErlassTabelle erlasse={[e]} voll={voll} beschriftung="Probe" /></MemoryRouter>,
  ).replace(/ title="[^"]*"/g, '');
  for (const voll of [false, true]) {
    it(`ZH-Erlass (${voll ? 'voll' : 'knapp'}): Titel ohne «(LS 632.1)», Kürzel «(ESchG)» bleibt, Spalte trägt die Nummer`, () => {
      const html = zeile(zh('Erbschafts- und Schenkungssteuergesetz (ESchG) (LS 632.1)', 'LS 632.1',
        'Erbschafts- und Schenkungssteuergesetz (ESchG)'), voll);
      expect(html).toContain('Erbschafts- und Schenkungssteuergesetz (ESchG)');
      expect(html).not.toContain('(LS 632.1)');
      expect(html.match(/LS 632\.1/g)).toHaveLength(1);
      expect(html.match(/\(ESchG\)/g)).toHaveLength(1);
    });
  }
  it('nur bei Zeichengleichheit: abweichende Nummer im Titel bleibt stehen', () => {
    const html = zeile(zh('Probegesetz (LS 632.2)', 'LS 632.1', 'Probegesetz'), false);
    expect(html).toContain('Probegesetz (LS 632.2)');
  });
  it('anderes Präfix, gleiche Ziffern: bleibt stehen (Präfix ist Teil der Identität)', () => {
    const html = zeile(zh('Probegesetz (SGS 632.1)', 'LS 632.1', 'Probegesetz'), false);
    expect(html).toContain('Probegesetz (SGS 632.1)');
  });
  it('Zahl-Fall ohne Präfix (D24) unverändert', () => {
    const html = zeile(zh('Probegesetz (760.12)', '760.12', 'Probegesetz'), false);
    expect(html).not.toContain('(760.12)');
  });
});
