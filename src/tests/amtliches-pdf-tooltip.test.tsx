// W2·17-UI-BEFUNDE PA-9-B01/D01 · der Tooltip des amtlichen PDF sagt nicht
// «der geltenden Fassung», wenn der Erlass aufgehoben ist (§8).
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AmtlichesPdf } from '../pages/gesetz-leser/parts/AmtlichesPdf';

const titel = (html: string) => /title="([^"]*)"/.exec(html)?.[1] ?? '';

describe('AmtlichesPdf · Tooltip nach Status', () => {
  it('geltender Erlass: «geltenden Fassung»', () => {
    const t = titel(renderToStaticMarkup(<AmtlichesPdf href="https://x/a.pdf" stand="2025-01-01" extern />));
    expect(t).toMatch(/Amtliches PDF der geltenden Fassung/);
  });
  it('aufgehobener Erlass: nie «geltenden Fassung», sondern letzte Fassung vor der Aufhebung', () => {
    const t = titel(renderToStaticMarkup(<AmtlichesPdf href="https://x/a.pdf" stand="2020-03-01" extern aufgehoben />));
    expect(t).not.toMatch(/geltenden/);
    expect(t).toMatch(/Amtliches PDF der letzten Fassung vor der Aufhebung/);
  });
  it('der amtliche Vorbehalt bleibt in beiden Fällen', () => {
    const a = titel(renderToStaticMarkup(<AmtlichesPdf href="x" stand="2020-03-01" extern aufgehoben />));
    const g = titel(renderToStaticMarkup(<AmtlichesPdf href="x" stand="2020-03-01" extern />));
    expect(a).toMatch(/massgeblich/i);
    expect(g).toMatch(/massgeblich/i);
  });
});
