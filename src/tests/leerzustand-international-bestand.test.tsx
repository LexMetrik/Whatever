// Bestands-Leere der International-Gliederungen folgt dem Leerzustand-Kanon
// «Keine X erfasst.» (Leerzustand.tsx-Kopf; W2·19 Kleinaufräumen 30.9.2026,
// Posten aus Bau DK-B #1175). Die Filter-/Such-Leere («Kein X gefunden.» mit
// Weiterweg) bleibt unberührt und ist in start-blatt-zustaende-dkb bewacht.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InternationalRubriken } from '../components/normtext/InternationalRubriken';
import { IntlRechtsgebietSicht } from '../components/normtext/GesetzeGliederung';

describe('International-Gliederungen: Bestands-Leere = «Keine Erlasse erfasst.»', () => {
  it('InternationalRubriken ohne Erlasse (alle Rubriken)', () => {
    const html = renderToStaticMarkup(<InternationalRubriken erlasse={[]} />);
    expect(html).toContain('data-leerzustand="bestand"');
    expect(html).toContain('Keine Erlasse erfasst.');
    expect(html).not.toContain('Kein Eintrag gefunden.');
  });

  it('InternationalRubriken ohne Erlasse in einer gewählten Rubrik (gruppe)', () => {
    const html = renderToStaticMarkup(<InternationalRubriken erlasse={[]} gruppe="menschenrechte" />);
    expect(html).toContain('Keine Erlasse erfasst.');
  });

  it('IntlRechtsgebietSicht ohne Erlasse', () => {
    const html = renderToStaticMarkup(<IntlRechtsgebietSicht erlasse={[]} />);
    expect(html).toContain('data-leerzustand="bestand"');
    expect(html).toContain('Keine Erlasse erfasst.');
    expect(html).not.toContain('Kein Eintrag gefunden.');
  });
});
