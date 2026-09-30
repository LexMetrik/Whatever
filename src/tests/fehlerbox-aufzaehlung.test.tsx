// FehlerBox: das Aufzählungszeichen «• » steht nur bei mindestens zwei Meldungen
// (W2·19 Kleinaufräumen 30.9.2026; Bau DK-B #1175 setzte es auch vor einzeilige).
// Verwender: alle Aufrufer der einen Komponente (Formulare, PdfExport, BlattLaedt).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FehlerBox } from '../components/vorlagen/ui';

const punkte = (html: string): number => (html.match(/•/g) ?? []).length;

describe('FehlerBox: Aufzählungszeichen nur bei ≥ 2 Meldungen', () => {
  it('eine Meldung: kein «•», Text steht', () => {
    const html = renderToStaticMarkup(<FehlerBox fehler={['Betrag fehlt.']} />);
    expect(punkte(html)).toBe(0);
    expect(html).toContain('Betrag fehlt.');
  });

  it('zwei Meldungen: je ein «•»', () => {
    const html = renderToStaticMarkup(<FehlerBox fehler={['Betrag fehlt.', 'Datum fehlt.']} />);
    expect(punkte(html)).toBe(2);
    expect(html).toContain('Datum fehlt.');
  });

  it('drei Meldungen (Rand): drei «•»; leere Liste: nichts gerendert', () => {
    expect(punkte(renderToStaticMarkup(<FehlerBox fehler={['a', 'b', 'c']} />))).toBe(3);
    expect(renderToStaticMarkup(<FehlerBox fehler={[]} />)).toBe('');
  });

  it('eigener Titel bei einer Meldung (BlattLaedt-Fall): Titel da, kein «•»', () => {
    const html = renderToStaticMarkup(<FehlerBox titel="Laden fehlgeschlagen" fehler={['Register nicht erreichbar.']} />);
    expect(html).toContain('Laden fehlgeschlagen');
    expect(punkte(html)).toBe(0);
  });
});
