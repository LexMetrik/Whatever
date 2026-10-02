// W2·17-UI-BEFUNDE · Darstellung der Wortlaut-Verweise: Dossier (Einzelmodus, E-D12-B01),
// Blatt-Zeile (PE-F5-B01, E-D13-B01 kantonale Kürzel-Kollision, E-D13-B04 Klappzeilen-Name).
// Die Listen-Logik selbst und die Parität zum Wortlaut: leser-verweise-w217.test.tsx.
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ArtikelLeser } from '../pages/gesetz-leser/parts';
import { sammleVerweise } from '../pages/gesetz-leser/parts/ArtikelLeser.fussnoten';
import { VerweisChips } from '../pages/gesetz-leser/parts/ArtikelLeser.bezuegeFuss';
import { BlattVerweise } from '../pages/gesetz-leser/v3/BlattArtikel';
import { art, blatt, bundPfad, erlassFuer, internFuer, lade } from './leser-verweise-w217-helfer';

// Das Dossier setzt Zahl und Wort mit geschütztem Leerzeichen — für den Vergleich normalisiert.
const flach = (html: string) => html.replace(/\s+/g, ' ');
const dossier = (key: string, artikel: string) => {
  const korpus = lade('bund', key);
  const props = { e: art(korpus, artikel), erlass: erlassFuer(key, key), basisPfad: bundPfad(key), fussForm: 'dossier' as const, intern: internFuer('bund', key, korpus) };
  return flach(renderToString(createElement(MemoryRouter, null, createElement(ArtikelLeser, props))));
};

describe('E-D12-B01 · Dossier (Einzelmodus)', () => {
  it('OR 336d: 1 Verweis, nicht 0 Verweise', () => {
    const out = dossier('OR', '336_d');
    expect(out).toContain('1 Verweis<');
    expect(out).not.toContain('0 Verweise');
  });

  it('AHVG 14 (ausgeschriebene Fremdverweise, PE-F5-B01): mehr als ein Verweis', () => {
    expect(dossier('AHVG', '14')).toMatch(/[2-9] Verweise</);
  });
});

const blattZeile = (ebene: 'bund' | 'kanton', key: string, token: string, zitat: string, kuerzel: string, mitIntern = true) => {
  const korpus = lade(ebene, key);
  const intern = mitIntern ? internFuer(ebene, key, korpus) : undefined;
  return renderToStaticMarkup(createElement(BlattVerweise, { artikel: blatt(art(korpus, token)), zitat, wort: 'Artikel' as const, intern, erlassKuerzel: kuerzel }));
};

describe('PE-F5-B01 · E-D13-B01 · E-D13-B04 · Blatt-Zeile Verweise dieses Artikels', () => {
  it('OR 336d: Zeile da, Name beginnt mit der sichtbaren Beschriftung, kein 1 Verweise', () => {
    const out = blattZeile('bund', 'OR', '336_d', 'Art. 336d OR', 'OR');
    expect(out).toContain('aria-label="Verweise dieses Artikels: 1, Art. 336d OR"');
    expect(out).toContain('data-v3-blatt-verweise="336_d"');
    expect(out).not.toContain('1 Verweise');
  });

  it('AHVG 14: die Zeile fehlt NICHT mehr (vorher: keine Zeile trotz Fremdverweisen)', () => {
    expect(blattZeile('bund', 'AHVG', '14', 'Art. 14 AHVG', 'AHVG')).toContain('data-v3-blatt-verweise="14"');
  });

  it('AR-621.111 Art. 41b: ohne intern keine Zeile; mit intern kein Bundes-StG (E-D13-B01)', () => {
    expect(blattZeile('kanton', 'AR-621.111', '41_b', 'Art. 41b StV', 'StV', false)).toBe('');
    expect(blattZeile('kanton', 'AR-621.111', '41_b', 'Art. 41b StV', 'StV')).not.toMatch(/StG|fedlex/);
  });

  it('VerweisChips: Sprung als Chip-Link mit Wortlaut-Anzeige', () => {
    const or = lade('bund', 'OR');
    const v = sammleVerweise(art(or, '336_d'), { kuerzel: 'OR', intern: internFuer('bund', 'OR', or) });
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(VerweisChips, { verweise: v })));
    expect(html).toContain('href="' + bundPfad('OR') + '#art-336_c"');
    expect(html).toContain('>Artikel 336c</a>');
  });
});
