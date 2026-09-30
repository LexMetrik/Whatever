// Bestands-Leere der Gesetze-Gliederungen (Bund/Kanton) folgt dem Kanon
// «Keine Erlasse erfasst.» (W2·19 Kleinaufräumen 2, 30.9.2026; Prüfer-Fund aus
// #1187: dort wurden nur die zwei International-Stellen umgestellt). Alle
// Aufrufer (Gesetze.tsx) rendern diese Sichten nur bei LEEREM Suchfeld — leer
// heisst «nichts erfasst», nie «verdeckt». Such-/Filter-Leere («Kein Erlass
// gefunden.» mit Weiterweg, art="filter") bleibt unberührt, bewacht in
// start-blatt-zustaende-dkb.
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  RelevanzGitter, KantonRelevanzListe, KantonGebietGruppen,
} from '../components/normtext/GesetzeGliederung';

describe('Gesetze-Gliederungen: Bestands-Leere = «Keine Erlasse erfasst.»', () => {
  const faelle: [string, () => string][] = [
    ['RelevanzGitter (Bund, International)', () => renderToStaticMarkup(<RelevanzGitter erlasse={[]} />)],
    ['KantonRelevanzListe', () => renderToStaticMarkup(<KantonRelevanzListe erlasse={[]} />)],
    ['KantonGebietGruppen', () => renderToStaticMarkup(<KantonGebietGruppen erlasse={[]} />)],
  ];
  it.each(faelle)('%s ohne Erlasse', (_name, render) => {
    const html = render();
    expect(html).toContain('data-leerzustand="bestand"');
    expect(html).toContain('Keine Erlasse erfasst.');
    expect(html).not.toContain('Kein Erlass gefunden.');
  });
});

describe('Gesetze.tsx: «Kein Erlass gefunden.» nur als Filter-Leere', () => {
  // Code-Zeilen (Kommentare ausgeklammert): keine Bestands-Leere mit Filter-Wortlaut.
  const code = readFileSync('src/pages/Gesetze.tsx', 'utf8')
    .split('\n').filter((z) => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
  it('kein art="bestand" mit «Kein Erlass gefunden.»', () => {
    expect(code).not.toMatch(/art="bestand"\s+text="Kein Erlass gefunden\."/);
  });
  it('die Filter-Leere existiert weiter (Gegenprobe, kein totes Sieb)', () => {
    expect(code).toMatch(/art="filter"\s+text="Kein Erlass gefunden\."/);
  });
});
