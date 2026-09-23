import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { LocaleProvider } from '../components/locale';
import { Abdeckung } from '../pages/Abdeckung';
import { Gesetze } from '../pages/Gesetze';
import { VorlagenUebersicht } from '../pages/VorlagenUebersicht';
import { STARTSEITE_ZAEHLER as Z } from '../data/startseiteZaehler.generated';

// ─── W2·29-WERKBANK-KATALOGE K5 · EINE ZÄHLQUELLE (§5/§8) ───────────────────
//
// Gemessen 23.9.2026 (Register-Stand 21.9.): dieselbe Sache trug auf drei
// Seiten verschiedene Zahlen.
//   a · /abdeckung zählte zur Laufzeit aus drei Manifesten mit eigener Regel
//       — 6'345 «Entscheide» inkl. 1'252 Verweis-Einträge; /rechtsprechung
//       und die Startseite sagen 5'093 (Nicht-Verweise, `gen:zaehler`).
//   b · /gesetze-Kopf «231 Bundeserlasse · … · 28 Staatsverträge»: die 28
//       SR-0-Staatsverträge steckten in den 231 UND standen daneben — doppelt
//       gezählt; die Säule «Bundesrecht» (Kachel, Tab) schliesst sie aus (203).
//   c · /vorlagen: Kopf «26 Vorlagen», Filter-Fuss «27 verfügbar» — die 27
//       zählte den «Amtlichen Zitierer» (`gerichtszitat`, keine Vorlage) mit,
//       den die Seite gar nicht zeigt.
// ROT ZU BEKOMMEN: in `Abdeckung.tsx` die Manifest-Zählung zurückholen (a),
// im `Gesetze.tsx`-Kopf wieder `gesetzeBundVolltext` einsetzen (b) oder im
// Filter-Fuss von `Katalog.tsx` wieder `verfuegbar.length` zählen (c).

const nf = (n: number) => n.toLocaleString('de-CH');
const html = (url: string, el: React.ReactElement) =>
  renderToString(<MemoryRouter initialEntries={[url]}><LocaleProvider>{el}</LocaleProvider></MemoryRouter>);
const text = (h: string) => parseHTML(`<!doctype html><html><body>${h}</body></html>`).document.body.textContent ?? '';

describe('K5 · eine Zählquelle', () => {
  it('Zähler: Bundesrecht + International = alle Bundeserlasse im Volltext (keine Doppelzählung)', () => {
    expect(Z.gesetzeBundesrechtVolltext + Z.gesetzeInternationalVolltext).toBe(Z.gesetzeBundVolltext);
    expect(Z.gesetzeBundVolltext + Z.gesetzeKantonVolltext).toBe(Z.gesetzeVolltext);
  });

  it('a · /abdeckung zeigt die Zahlen aus STARTSEITE_ZAEHLER, Verweise getrennt', () => {
    const t = text(html('/abdeckung', <Abdeckung />));
    expect(t).toContain(`${nf(Z.rechtsprechungVolltext)} Entscheide`);
    expect(t).toContain(`${nf(Z.rechtsprechungLeitentscheide)} amtliche Leitentscheide (BGE)`);
    expect(t).toContain(`${nf(Z.rechtsprechungVollurteilVerweise)} Verweis-Einträge`);
    expect(t).toContain(`${nf(Z.gesetzeBundesrechtVolltext)} Bundeserlasse`);
    expect(t).toContain(`${nf(Z.gesetzeInternationalVolltext)} Staatsverträge`);
    expect(t).toContain(`${nf(Z.gesetzeKantonVolltext)} kantonalen Erlasse`);
    expect(t).toContain(`${nf(Z.materialien)} amtliche Ressourcen`);
    // Die vermischte Summe (Entscheide + Verweise) steht nirgends mehr.
    expect(t).not.toContain(nf(Z.rechtsprechungVolltext + Z.rechtsprechungVollurteilVerweise));
  });

  it('b · /gesetze-Kopf zählt Bundesrecht, Kantone und Staatsverträge je einmal', () => {
    const t = text(html('/gesetze', <Gesetze />));
    expect(t).toContain(`${nf(Z.gesetzeBundesrechtVolltext)} Bundeserlasse · ${nf(Z.gesetzeKantonVolltext)} Kantonserlasse · ${nf(Z.gesetzeInternationalVolltext)} Staatsverträge im Volltext`);
  });

  it('c · /vorlagen: Filter-Fuss zählt, was die Seite zeigt (= Kopf)', () => {
    const h = html('/vorlagen', <VorlagenUebersicht />);
    const { document } = parseHTML(`<!doctype html><html><body>${h}</body></html>`);
    const fuss = document.querySelector('#vorlagen-filter-scope-vorlagen')?.textContent ?? '';
    expect(fuss).toContain(`${Z.vorlagen} verfügbar`);
    expect(text(h)).toContain(`${Z.vorlagen} Vorlagen`);
    // Die Seite zeigt genau so viele verlinkte Vorlagen-Zeilen.
    const zeilen = new Set([...document.querySelectorAll('#register-vorlagen a[href^="/vorlagen/"]')]
      .map((a) => a.getAttribute('href')));
    expect(zeilen.size).toBe(Z.vorlagen);
  });
});
