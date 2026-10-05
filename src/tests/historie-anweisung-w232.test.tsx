import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArtikelHistorieZeile } from '../pages/gesetz-leser/parts/ArtikelHistorie';
import type { ArtikelHistorie } from '../lib/normtext/historie-laden';

// W2·32-GENERALANWEISUNGEN (5.10.2026): ein Ereignis aus einer Anweisung des Änderungserlasses (am Artikel keine Fussnote) nennt
// seine Herkunft — «Anweisung: «Gewalt» → «Sorge»» — neben Skopus, Datum und AS-Fundstelle (§8). Ereignisse aus Fussnoten tragen
// den Marker nicht und bleiben Zeichen für Zeichen wie bisher (§3).

const E = { wirkung: false, quellen: [] as ArtikelHistorie['ereignisse'][number]['quellen'], absatz: null, item: null };
const html = (h: ArtikelHistorie) => renderToStaticMarkup(<ArtikelHistorieZeile historie={h} zeitleiste />);
const text = (h: ArtikelHistorie) => html(h).replace(/<[^>]+>/g, '');

describe('ArtikelHistorie · Herkunft «Anweisung» (W2·32)', () => {
  const h: ArtikelHistorie = {
    giltSeit: '2000-01-01',
    ereignisse: [
      { ...E, typ: 'fassung', datum: '1978-01-01' },
      {
        ...E, typ: 'ausdruck', datum: '2000-01-01', absatz: '2', anweisung: '«Gewalt» → «Sorge»',
        quellen: [{ label: 'AS 1999 1118', url: 'https://fedlex.data.admin.ch/eli/oc/1999/149' }],
      },
    ],
  };

  it('nennt die Anweisung mit Ersatzausdruck, Absatz, Datum und Fundstelle', () => {
    const t = text(h);
    expect(t).toContain('Ausdruck angepasst · Abs. 2 · Anweisung: «Gewalt» → «Sorge» · in Kraft seit');
    expect(t).toContain('AS 1999 1118');
    expect(html(h).match(/data-historie-anweisung/g)).toHaveLength(1);
  });

  it('Fussnoten-Ereignisse tragen den Marker nicht', () => {
    expect(html({ giltSeit: '1978-01-01', ereignisse: [h.ereignisse[0]] })).not.toContain('data-historie-anweisung');
  });
});
