// §8-Hinweis «Datum laut Urteilskopf; das Gerichtsportal nennt den …» (Entscheid David
// 4.10.2026: «jeweils hinweis wenn es abweicht»). ROT ZU BEKOMMEN (§6.7): in
// `DatumPortalHinweis` die Zeile `if (!snap.datumPortal …) return null` streichen bzw.
// den Hinweis im EntscheidLeser/Lesemodus aus `fakten` nehmen.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DatumMeta, DatumPortalHinweis } from '../components/rechtsprechung/EntscheidKopfTeile';
import type { EntscheidSnapshot } from '../lib/rechtsprechung/typen';
import { readFileSync } from 'node:fs';

const snap = (o: Partial<EntscheidSnapshot>): EntscheidSnapshot => ({ quelle: 'gerichte-bs', datum: '2022-09-21', ...o }) as EntscheidSnapshot;
const html = (s: EntscheidSnapshot) => renderToStaticMarkup(createElement(DatumPortalHinweis, { snap: s }));

describe('DatumPortalHinweis', () => {
  it('BS: nennt Urteilskopf und das abweichende Portal-Datum (CH-Format)', () => {
    const h = html(snap({ datumPortal: '2022-09-16' }));
    expect(h).toContain('Datum laut Urteilskopf; das Gerichtsportal nennt den');
    expect(h).toContain('16.09.2022');
  });
  it('OCL-Kantone: dieselbe Mechanik, andere Quelle', () => {
    expect(html(snap({ quelle: 'opencaselaw', datumPortal: '2025-07-04' }))).toContain('OpenCaseLaw nennt den');
  });
  it('kein Hinweis ohne Abweichung und beim datumlosen Platzhalter', () => {
    expect(html(snap({}))).toBe('');
    expect(html(snap({ datumPortal: '2022-09-16', datumUnbekannt: true }))).toBe('');
  });
  it('DatumMeta (Kopf UND Lesemodus) trägt den Hinweis hinter «Entscheid vom …»', () => {
    const h = renderToStaticMarkup(createElement(DatumMeta, { snap: snap({ datumPortal: '2022-09-16' }) }));
    expect(h).toContain('Entscheid vom');
    expect(h).toContain('das Gerichtsportal nennt den');
    expect(renderToStaticMarkup(createElement(DatumMeta, { snap: snap({}) }))).not.toContain('Gerichtsportal');
  });
  it('der Leser zeigt den Hinweis auch, wenn die Zitierung das Datum schon trägt (DatumMeta entfällt dann)', () => {
    expect(readFileSync('src/pages/EntscheidLeser.tsx', 'utf8')).toMatch(/datumImTitel \? \(snap\.datumPortal \? <DatumPortalHinweis snap=\{snap\} \/> : null\) : <DatumMeta/);
  });
});
