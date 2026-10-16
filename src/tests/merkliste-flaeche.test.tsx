// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { MerklisteAnsicht, MerklisteFlaeche } from '../components/merkliste/MerklisteFlaeche';
import { kodiereMerkliste, type MerkEintrag } from '../lib/merkliste';
import { MERK_ALLE_HREF } from '../components/suche/SucheLeerzustandKontext';

// Merkliste auf der Startseite (LESER-NAV R-2): Struktur, Barrierefreiheit, Import-Vorschau.
// Das Klick-Verhalten (Merken, Entfernen, Link, Übernehmen) misst e2e/leser-merkliste.e2e.ts im Browser.

const E = (n: number, route = `/gesetze/bund/E${n}`): MerkEintrag => ({ route, titel: `Erlass ${n}`, typ: 'gesetz', zeit: n });
const render = (liste: MerkEintrag[], url = '/') =>
  renderToString(<MemoryRouter initialEntries={[url]}><MerklisteAnsicht liste={liste} /></MemoryRouter>).replace(/<!-- -->/g, '');

describe('MerklisteFlaeche', () => {
  it('ohne Einträge und ohne Link: gar nichts (keine Überschrift über Leerraum, §8)', () => {
    expect(render([])).toBe('');
    expect(renderToString(<MemoryRouter><MerklisteFlaeche /></MemoryRouter>)).toBe('');
  });

  it('mit Einträgen: Region «Merkliste», Verweise auf die Stelle, je Zeile ein benannter Entfernen-Knopf, «Nur auf diesem Gerät»', () => {
    const html = render([E(1, '/gesetze/bund/OR#art-336c'), E(2)]);
    expect(html).toContain('aria-labelledby');
    expect(html).toContain('>Merkliste</h2>');
    expect(html).toContain('href="/gesetze/bund/OR#art-336c"');
    expect(html).toContain('aria-label="Erlass 1 aus der Merkliste entfernen"');
    expect(html).toContain('aria-label="Erlass 2 aus der Merkliste entfernen"');
    expect(html).toContain('Nur auf diesem Gerät');
    expect(html).toContain('Als Link teilen');
    expect(html).not.toContain('Favoriten');
  });

  // LESER-NAV · FB O-71: «Alle N auf der Startseite» (⌘K) zeigt auf `/#merkliste`. Der Link hat nur ein Ziel, wenn die
  // Fläche die ID trägt (ohne sie landete er auf der Startseite, ohne die Fläche zu erreichen). Wirkung im Browser:
  // `e2e/leser-merkliste.e2e.ts` («Alle 7 auf der Startseite»).
  // ROT ZU BEKOMMEN (§6.7): in `MerklisteFlaeche.tsx` die `id` des Anker-Elements streichen.
  it('O-71: die Fläche trägt genau die ID, auf die «Alle N auf der Startseite» zeigt', () => {
    const [pfad, anker] = MERK_ALLE_HREF.split('#');
    expect(pfad).toBe('/');
    expect(anker, 'der Link trägt keinen Anker').toBeTruthy();
    const html = render([E(1)]);
    expect(html.match(new RegExp(`id="${anker}"`, 'g')), 'der Anker steht genau einmal').toHaveLength(1);
    // Der Anker sitzt ÜBER der Fläche, nicht in ihr: die Region selbst bleibt benannt.
    expect(html.indexOf(`id="${anker}"`)).toBeLessThan(html.indexOf('<section'));
  });

  it('Randdaten: bis 6 Zeilen alle, ab 7 nur sechs und ein aria-expanded-Knopf «Alle N anzeigen»', () => {
    const sechs = render([1, 2, 3, 4, 5, 6].map((n) => E(n)));
    expect(sechs).not.toContain('anzeigen');
    const sieben = render([1, 2, 3, 4, 5, 6, 7].map((n) => E(n)));
    expect(sieben).toContain('Alle 7 anzeigen');
    expect(sieben).toContain('aria-expanded="false"');
    expect(sieben).toContain('Erlass 6');
    expect(sieben).not.toContain('Erlass 7<');
  });

  it('geteilter Link: Vorschau MIT Route, noch nichts übernommen, Titel als Text (kein HTML)', () => {
    const payload = kodiereMerkliste([{ route: '/gesetze/bund/OR#art-1', titel: 'Art. 1 <b>OR</b>' }]);
    const html = render([], `/?merkliste=${payload}`);
    expect(html).toContain('Geteilte Merkliste mit 1 Stelle');
    expect(html).toContain('Noch nichts übernommen');
    expect(html).toContain('/gesetze/bund/OR#art-1');
    expect(html).toContain('Art. 1 &lt;b&gt;OR&lt;/b&gt;');
    expect(html).not.toContain('<b>OR</b>');
    expect(html).toContain('Übernehmen');
    expect(html).toContain('Verwerfen');
    // Vorschau-Zeilen sind KEINE Verweise: ein fremder Link führt nicht per Klick ins Ungeprüfte.
    expect(html).not.toContain('href="/gesetze/bund/OR#art-1"');
  });

  it('unbrauchbarer Link: Hinweis und «Schliessen», kein Übernehmen', () => {
    for (const roh of ['abc', kodiereMerkliste([{ route: 'https://evil.example/x', titel: 'x' }])]) {
      const html = render([], `/?merkliste=${roh}`);
      expect(html).toContain('Dieser Link enthält keine gültige Merkliste.');
      expect(html).toContain('Schliessen');
      expect(html).not.toContain('Übernehmen');
    }
  });

  it('Quellsonde: Startseite, Artikel-Aktionen und Reiter-Menü nehmen die EINE Merkliste (kein zweiter Speicher)', () => {
    expect(readFileSync('src/pages/Startseite.tsx', 'utf8')).toMatch(/<MerklisteFlaeche\s*\/>/);
    expect(readFileSync('src/pages/gesetz-leser/parts/ArtikelAktionen.tsx', 'utf8')).toMatch(/<MerkenKnopf\b/);
    expect(readFileSync('src/components/layout/Reiterleiste.tsx', 'utf8')).toMatch(/schalteMerkung\(/);
    expect(readFileSync('src/components/layout/VerlaufUebersicht.tsx', 'utf8')).toMatch(/useMerkliste\(\)/);
  });
});
