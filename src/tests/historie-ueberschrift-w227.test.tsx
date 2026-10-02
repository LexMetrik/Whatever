import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArtikelHistorieZeile } from '../pages/gesetz-leser/parts/ArtikelHistorie';
import type { ArtikelHistorie } from '../lib/normtext/historie-laden';

// W2·27-BUND-FERTIG (2.10.2026): ein Ereignis, das aus einer Fussnote an der Gliederungsüberschrift stammt
// (`ueberschrift`, build-seitig aus dem Sidecar-Feld `sektion`), trägt in der Zeitleiste die Herkunft «an der Überschrift «…»»
// — am Träger-Artikel wie an jedem Artikel darunter. Ereignisse ohne das Feld bleiben Zeichen für Zeichen wie bisher (§3).

const E = { wirkung: false, quellen: [] as ArtikelHistorie['ereignisse'][number]['quellen'], absatz: null, item: null };
const html = (h: ArtikelHistorie) => renderToStaticMarkup(<ArtikelHistorieZeile historie={h} zeitleiste />);
const text = (h: ArtikelHistorie) => html(h).replace(/<[^>]+>/g, '');

describe('ArtikelHistorie · Herkunft «an der Überschrift»', () => {
  const ueberschrift = 'Zehnter Titel: Der Arbeitsvertrag';
  const h: ArtikelHistorie = {
    giltSeit: '2012-01-01',
    ereignisse: [
      { ...E, typ: 'fassung', datum: '1972-01-01', ueberschrift },
      { ...E, typ: 'eingefuegt', datum: '2012-01-01' },
    ],
  };

  it('nennt die Überschrift am Überschrift-Ereignis, nicht am eigenen', () => {
    const t = text(h);
    expect(t).toContain('Neufassung · an der Überschrift «Zehnter Titel: Der Arbeitsvertrag» · in Kraft seit');
    expect(t.match(/an der Überschrift/g)).toHaveLength(1);
  });

  it('ohne `ueberschrift` bleibt die Zeile unverändert (kein Marker, kein «»)', () => {
    const t = html({ giltSeit: '2020-01-01', ereignisse: [{ ...E, typ: 'fassung', datum: '2020-01-01' }] });
    expect(t).not.toContain('Überschrift');
    expect(t).not.toContain('data-historie-ueberschrift');
  });
});
