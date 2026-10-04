// §8-Hinweis «Datum laut Urteilskopf; das Gerichtsportal nennt den …» (Entscheid David
// 4.10.2026: «jeweils hinweis wenn es abweicht»). ROT ZU BEKOMMEN (§6.7): in
// `DatumPortalHinweis` die Zeile `if (!snap.datumPortal …) return null` streichen bzw.
// den Hinweis im EntscheidLeser/Lesemodus aus `fakten` nehmen.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DatumPortalHinweis } from '../components/rechtsprechung/EntscheidKopfTeile';
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
  it('der Leser und das Lesemodus-Overlay binden den Hinweis ein (auch wenn die Zitierung das Datum trägt)', () => {
    for (const f of ['src/pages/EntscheidLeser.tsx', 'src/components/rechtsprechung/LesemodusOverlay.tsx']) {
      expect(readFileSync(f, 'utf8')).toMatch(/<DatumPortalHinweis snap=\{snap\} \/>/);
    }
  });
});
