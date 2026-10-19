/**
 * LESER-NAV · FB O-67 (Nachzug) · Kopf-Anker «Art. N» im sekundären Pane.
 *
 * Im Pane (`intern.paneSprung` gesetzt) trägt der Anker den ABSOLUTEN Pfad des Pane-Erlasses
 * (`intern.basisPfad` + `#art-N`). Ein relatives `#art-N` löste sich bei Strg/Cmd-Klick, «Link
 * kopieren» und Mittelklick gegen die Adresse des Hauptfensters auf (ZGB statt OR).
 *
 * ROT ZU BEKOMMEN (§6.7): in `parts/ArtikelLeser.tsx` den href wieder auf `#art-${e.artikel}` stellen
 * ⇒ der Pane-Fall misst «#art-9» statt «/gesetze/bund/OR#art-9».
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArtikelLeser } from '../pages/gesetz-leser/parts';
import type { PaneInternRefs } from '../pages/gesetz-leser/inhalt-sprung';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

const erlass: BrowseErlass = {
  key: 'OR', ebene: 'bund', kanton: null, kuerzel: 'OR', titel: 'Obligationenrecht',
  sr: '220', rechtsgebiet: 'privat', sprache: 'de', rang: 0, status: 'snapshot',
  datei: 'bund/OR.json', artikelAnzahl: 1, stand: '2026-06-12',
  quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de', fassungsToken: '20260612',
  pdfPfad: null,
};

const art = (artikel: string): NormSnapshot => ({
  id: `bund/OR/art_${artikel}`, ebene: 'bund', quelle: 'OR', erlass: 'OR',
  artikel, artikelLabel: `Art. ${artikel}`, bloecke: [{ absatz: null, text: 'Text.' }],
  stand: '2026-06-12', quelleUrl: `https://x#art_${artikel}`, abgerufen: '2026-09-30',
  fassungsToken: '20260612', sha: artikel,
});

const intern = (pane: boolean): PaneInternRefs => ({
  tokenMap: new Map(), basisPfad: '/gesetze/bund/OR', springeZu: () => {},
  ...(pane ? { paneSprung: () => {} } : {}),
});

const kopfHref = (html: string, label: string): string | null => {
  const m = html.match(new RegExp(`<a href="([^"]*)"[^>]*>${label}</a>`));
  return m ? m[1] : null;
};

describe('O-67 — Kopf-Anker im Pane', () => {
  it('Pane: absoluter Pfad des Pane-Erlasses', () => {
    const html = renderToStaticMarkup(<ArtikelLeser e={art('9')} erlass={erlass} basisPfad="/gesetze/bund/OR" intern={intern(true)} />);
    expect(kopfHref(html, 'Art. 9')).toBe('/gesetze/bund/OR#art-9');
  });

  it('Randfall: Artikel mit Buchstabenzusatz behält den Token im Pane-Pfad', () => {
    const html = renderToStaticMarkup(<ArtikelLeser e={art('336_c')} erlass={erlass} basisPfad="/gesetze/bund/OR" intern={intern(true)} />);
    expect(html).toContain('href="/gesetze/bund/OR#art-336_c"');
  });

  it('Gegenproben: Hauptfenster (ohne paneSprung) und ohne intern bleiben relativ', () => {
    const haupt = renderToStaticMarkup(<ArtikelLeser e={art('9')} erlass={erlass} basisPfad="/gesetze/bund/OR" intern={intern(false)} />);
    expect(kopfHref(haupt, 'Art. 9')).toBe('#art-9');
    const ohne = renderToStaticMarkup(<ArtikelLeser e={art('9')} erlass={erlass} basisPfad="/gesetze/bund/OR" />);
    expect(kopfHref(ohne, 'Art. 9')).toBe('#art-9');
  });
});
