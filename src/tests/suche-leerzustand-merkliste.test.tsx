import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SucheLeerzustand } from '../components/suche/SucheLeerzustand';
import { MERK_ALLE_HREF, MERK_IM_PANEL, leerOptionen } from '../components/suche/SucheLeerzustandKontext';
import { suchOptionId } from '../components/suche/suchOptionId';
import type { MerkEintrag } from '../lib/merkliste';
import type { ZuletztEintrag } from '../lib/zuletztVerwendet';

// Merkliste im Such-Leerzustand (LESER-NAV, Entscheid David 15.10.2026 «Ja, in ⌘K zeigen»).
//
// Geprüft wird, was ein Browser-Test nur indirekt sieht: (1) Anzeige mit Titel und Art,
// (2) der Leerfall — leere Merkliste lässt das Panel wie vorher (kein Abschnitt, kein
// Gruppen-Namensraum), (3) die Obergrenze samt «Alle N auf der Startseite», (4) die Tastatur:
// `leerOptionen` (Pfeiltasten/Enter in HeaderSuche) und die gerenderten Optionen sind EINE
// Liste in derselben Reihenfolge, (5) A11y: benannte Gruppen in der Listbox, Optionen statt
// Tab-Stopps, (6) HeaderSuche reicht dieselbe Liste an Anzeige UND Tastatur.
//
// ROT ZU BEKOMMEN (§6.7): in `leerOptionen` die Merkliste weglassen → (4) rot; in
// `SucheLeerzustand` `gemerkt` auf `merkliste` (ungekappt) setzen → (3) rot; `zeigeVerlauf`
// auf `true` zwingen → (2b) rot.

const LB = 'lb';
const merk = (n: number): MerkEintrag[] => Array.from({ length: n }, (_, i) => ({
  route: i === 0 ? '/gesetze/bund/OR#art-336c' : `/gesetze/bund/E${i}#art-1`,
  titel: i === 0 ? 'Art. 336c OR' : `Art. 1 E${i}`,
  typ: 'gesetz', zeit: 0,
}));
const VERLAUF: ZuletztEintrag[] = [{ route: '/rechner/verjaehrung', titel: 'Verjährung', typ: 'rechner', zeit: 1 }];

const render = (verlauf: ZuletztEintrag[], merkliste?: MerkEintrag[]) =>
  renderToString(<SucheLeerzustand verlauf={verlauf} merkliste={merkliste} listboxId={LB} onNavigate={() => {}} />);
const optionIds = (html: string) => Array.from(html.matchAll(/role="option" id="([^"]+)"/g), (m) => m[1]);

describe('SucheLeerzustand — Merkliste (LESER-NAV)', () => {
  it('(1) zeigt Titel und Art der gemerkten Stellen unter dem Abschnitt «Merkliste»', () => {
    const html = render(VERLAUF, merk(2));
    expect(html).toContain('>Merkliste</p>');
    expect(html).toContain('Art. 336c OR');
    expect(html).toContain('Art. 1 E1');
    expect(html).toContain('Gesetz');
    // Merkliste steht über dem Verlauf (Reihenfolge wie im Topbar-Flyout).
    expect(html.indexOf('>Merkliste</p>')).toBeLessThan(html.indexOf('>Zuletzt geöffnet</p>'));
  });

  it('(2a) Leerfall: leere Merkliste = kein Abschnitt, kein Gruppen-Namensraum, Panel-Name unverändert', () => {
    for (const html of [render(VERLAUF), render(VERLAUF, []), render([], [])]) {
      expect(html).not.toContain('Merkliste');
      expect(html).not.toContain(`${LB}-merkliste-`);
      expect(html).toContain('aria-label="Suche — zuletzt geöffnet"');
    }
    expect(render(VERLAUF)).toContain('Zuletzt geöffnet');
    expect(render([], [])).toContain('Noch nichts geöffnet.');
  });

  it('(2b) Verlauf leer, Merkliste nicht (nach «Verlauf leeren»): Liste statt «Noch nichts geöffnet», Fusszeile ohne Leeren-Knopf', () => {
    const html = render([], merk(2));
    expect(html).toContain('Art. 336c OR');
    expect(html).not.toContain('Noch nichts geöffnet.');
    expect(html).not.toContain('>Zuletzt geöffnet</p>');
    expect(html).toContain('aria-label="Suche — Merkliste"');
    expect(html).toContain('Nur auf diesem Gerät');
    expect(html).not.toContain('Verlauf leeren');
  });

  it('(3) Obergrenze: höchstens MERK_IM_PANEL Zeilen, darüber «Alle N auf der Startseite»', () => {
    expect(optionIds(render([], merk(MERK_IM_PANEL)))).toHaveLength(MERK_IM_PANEL);
    expect(render([], merk(MERK_IM_PANEL))).not.toContain('auf der Startseite');

    const viele = render([], merk(MERK_IM_PANEL + 4));
    expect(optionIds(viele)).toHaveLength(MERK_IM_PANEL + 1);
    expect(viele).toContain(`Alle ${MERK_IM_PANEL + 4} auf der Startseite`);
    expect(viele).not.toContain(`Art. 1 E${MERK_IM_PANEL}`); // die (MAX+1)-te Stelle ist nicht im Panel
  });

  it('(4) Tastatur: leerOptionen und gerenderte Optionen sind dieselbe Liste in derselben Reihenfolge', () => {
    for (const n of [0, 1, MERK_IM_PANEL, MERK_IM_PANEL + 3]) {
      for (const verlauf of [[], VERLAUF]) {
        const liste = merk(n);
        const optionen = leerOptionen(verlauf, LB, liste);
        expect(optionen.map((o) => o.oid), `n=${n}, Verlauf ${verlauf.length}`).toEqual(optionIds(render(verlauf, liste)));
      }
    }
    // Ziele: Enter navigiert zur Route der Zeile; die «Alle»-Option zur Startseite.
    const o = leerOptionen(VERLAUF, LB, merk(MERK_IM_PANEL + 1));
    expect(o[0]).toEqual({ oid: suchOptionId(LB, 'merkliste', '/gesetze/bund/OR#art-336c'), href: '/gesetze/bund/OR#art-336c' });
    expect(o[MERK_IM_PANEL].href).toBe(MERK_ALLE_HREF);
    expect(o[MERK_IM_PANEL + 1].href).toBe('/rechner/verjaehrung');
  });

  it('(4b) dieselbe Route in Merkliste und Verlauf ergibt zwei verschiedene Options-IDs', () => {
    const ids = leerOptionen(VERLAUF, LB, [{ route: '/rechner/verjaehrung', titel: 'Verjährung', typ: 'rechner', zeit: 0 }]).map((o) => o.oid);
    expect(new Set(ids).size).toBe(2);
  });

  it('(5) A11y: Listbox heisst «Merkliste und zuletzt geöffnet», beide Abschnitte sind benannte Gruppen, Zeilen sind Optionen ohne Tab-Stopp', () => {
    const html = render(VERLAUF, merk(2));
    expect(html).toContain('role="listbox"');
    expect(html).toContain('aria-label="Suche — Merkliste und zuletzt geöffnet"');
    const gruppen = Array.from(html.matchAll(/role="group" aria-labelledby="([^"]+)"/g), (m) => m[1]);
    expect(gruppen).toHaveLength(2);
    for (const id of gruppen) expect(html, `Gruppen-Name ${id}`).toContain(`<p id="${id}"`);
    expect(html).not.toContain('<a ');
    expect(optionIds(html)).toHaveLength(3);
  });

  it('(6) Quellsonde: HeaderSuche reicht EINE Merkliste an Anzeige und Tastatur', () => {
    const quelle = readFileSync('src/components/layout/HeaderSuche.tsx', 'utf8');
    expect(quelle.match(/useMerkliste\(\)/g) ?? []).toHaveLength(1);
    expect(quelle).toMatch(/leerOptionen\(verlauf, listboxId, merkliste\)/);
    expect(quelle).toMatch(/<SucheLeerzustand verlauf=\{verlauf\} merkliste=\{merkliste\}/);
  });
});
