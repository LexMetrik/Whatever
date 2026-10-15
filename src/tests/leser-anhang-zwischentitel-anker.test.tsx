// LESER-NAV / FB O-36 (e): Anhang-Zwischentitel (Block mit `titel`, ohne Ziffer)
// tragen den Anker `anh-<artikel>-<i>` NUR in der Lesespalte (zitierKontext
// gesetzt, wie ArtikelLeser ihn übergibt). Das Popover (kein zitierKontext) steht
// gleichzeitig mit dem Leser im DOM — dort wäre die Id doppelt vergeben.
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import type { NormSnapshot } from '../lib/normtext/typen';

const bloecke: NormSnapshot['bloecke'] = [
  { absatz: null, text: 'Zwischentitel ohne Ziffer', titel: 3 },
  { absatz: '1', text: 'Erster Absatz.' },
  { absatz: null, text: 'Zweiter Zwischentitel', titel: 4 },
  { absatz: '1', text: 'Zweiter Absatz.' },
];
const zk = { artikelLabel: 'Anhang 1', kuerzel: 'CHEMRRV' };

describe('ArtikelBody — Anker der Anhang-Zwischentitel', () => {
  it('Lesespalte (zitierKontext): jeder Zwischentitel trägt id="anh-<artikel>-<i>"', () => {
    const o = renderToString(<ArtikelBody bloecke={bloecke} artikel="a1" passus={{ absatz: null }} zitierKontext={zk} />);
    expect(o).toContain('id="anh-a1-0"');
    expect(o).toContain('id="anh-a1-2"');
  });

  it('Popover (ohne zitierKontext): keine Id, sonst doppelt im DOM', () => {
    const o = renderToString(<ArtikelBody bloecke={bloecke} artikel="a1" passus={{ absatz: null }} />);
    expect(o).not.toContain('id="anh-');
  });
});
