/**
 * LESER-NAV/O-34c (Nachzug, Gegenprüfung #1370): das Prerender-HTML (seo-detail) zeigte
 * den Fedlex-Abstandshalter «[tab]» als `<b>[tab]</b>`, obwohl die Lese-Hülle ihn seit O-34c
 * als marke-los behandelt. Beide teilen jetzt `istLeerMarke` (src/lib/listenMarke.ts, §5).
 */
import { describe, it, expect } from 'vitest';
import { erlassVolltextHtml } from '../lib/seo-detail';
import { istLeerMarke as ausHelfer } from '../components/normtext/ArtikelBody.helfer';
import { istLeerMarke } from '../lib/listenMarke';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { NormSnapshotDatei } from '../lib/normtext/typen';

const erlass = {
  key: 'X',
  kuerzel: 'X',
  titel: 'Testerlass',
  ebene: 'bund',
  rechtsgebiet: 'zivilrecht',
  quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/x',
} as unknown as BrowseErlass;
const datei = (marken: string[]) =>
  ({
    erzeugt: '',
    eintraege: [
      {
        artikelLabel: 'Art. 1',
        bloecke: [{ absatz: '1', text: 'Einleitung', items: marken.map((marke) => ({ marke, text: istLeerMarke(marke) ? 'Text leer' : `Text ${marke}` })) }],
      },
    ],
  }) as unknown as NormSnapshotDatei;

describe('Prerender-Liste · Abstandshalter-Marke', () => {
  it('«[tab]» und «» erscheinen nicht als <b>-Marke; echte Marken bleiben', () => {
    const html = erlassVolltextHtml(erlass, datei(['[tab]', ' [tab] ', '', 'a', '1']));
    expect(html).not.toContain('[tab]');
    expect(html).toContain('<li>Text leer</li>');
    expect(html).toContain('<li><b>a</b> Text a</li>');
    expect(html).toContain('<li><b>1</b> Text 1</li>');
  });
  it('Lese-Hülle und Prerender teilen dieselbe Funktion (eine Stelle, §5)', () => {
    expect(ausHelfer).toBe(istLeerMarke);
  });
});
