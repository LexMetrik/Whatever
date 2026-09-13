import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../components/locale';
import { Reiterleiste } from '../components/layout/Reiterleiste';

// ── W2·18 Welle 2 Punkt 1 (Fahrplan §4.R2) · EIN REITER IM TAB-RING ─────────
//
// GEMESSEN 13.9.2026 (SSR-Markup dieser Datei, Vorstand `2a331dcdd`): bei sechs
// Reitern trug die Leiste 0 × `tabindex` — jeder Reiterknopf UND jedes
// Schliess-✕ stand im Tab-Ring. Wer mit der Tabulator-Taste an der Leiste
// vorbei zum Dokument wollte, brauchte bei sechs Reitern zwölf Anschläge, bei
// fünfzig hundert. WAI-ARIA APG (Tabs/Toolbar) verlangt das Gegenteil: EIN
// Element der Gruppe im Ring, die Bewegung INNERHALB der Gruppe machen die
// Pfeiltasten.
//
// Hier gepinnt wird, was ohne Browser prüfbar ist: dass genau ein `tabindex="0"`
// im Streifen steht und dass er am aktiven Reiter sitzt. Das Verhalten der
// Pfeiltasten (Fokus wandert, Auswahl bleibt) misst die Browser-Sonde
// `e2e/w224-r13-reiter.e2e.ts` («W2·18 Welle 2 — Pfeiltasten»).
//
// ROT ZU BEKOMMEN (§6.7, so gefahren): in `reiterleiste/Reiter.tsx` das
// `tabIndex={imRing ? 0 : -1}` am Reiter-Knopf und die `tabIndex`-Angaben an
// ⧉/✕ entfernen.

beforeEach(() => {
  const speicher = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => void speicher.set(k, v),
    removeItem: (k: string) => void speicher.delete(k),
    clear: () => speicher.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
});

const html = (pfade: string[], url: string) => {
  localStorage.setItem('lexmetrik-tabs', JSON.stringify(pfade.map((path) => ({ path }))));
  return renderToString(
    <MemoryRouter initialEntries={[url]}>
      <LocaleProvider><Reiterleiste /></LocaleProvider>
    </MemoryRouter>,
  );
};

/** Die Reiter des Streifens als je ein Markup-Stück (Reihenfolge = Bild). */
function reiterBloecke(markup: string): { schluessel: string; html: string }[] {
  const teile = markup.split('data-reiter-aktiv=').slice(1);
  return teile.map((teil) => {
    const naechster = teil.indexOf('data-reiter-aktiv=');
    const eigen = naechster === -1 ? teil : teil.slice(0, naechster);
    const m = /data-reiter-schluessel="([^"]+)"/.exec(eigen);
    return { schluessel: m ? m[1] : '', html: eigen };
  });
}

const DREI = ['/gesetze/bund/OR', '/gesetze/bund/ZGB', '/rechner/zpo-fristen'];

describe('Reiterleiste — nur EIN Reiter im Tab-Ring (W2·18 Welle 2, Punkt 1)', () => {
  it('genau ein tabindex="0" im ganzen Streifen', () => {
    const m = html(DREI, '/gesetze/bund/ZGB');
    expect((m.match(/tabindex="0"/g) ?? []).length).toBe(1);
  });

  it('der Ring-Platz sitzt am AKTIVEN Reiter, nicht am ersten', () => {
    const bloecke = reiterBloecke(html(DREI, '/gesetze/bund/ZGB'));
    expect(bloecke.map((b) => b.schluessel)).toEqual(DREI);
    for (const b of bloecke) {
      const ring = b.schluessel === '/gesetze/bund/ZGB';
      expect(b.html.includes('tabindex="0"'), `${b.schluessel} im Ring? ${ring}`).toBe(ring);
    }
  });

  it('an jedem übrigen Reiter sind AUCH die Griffe aus dem Ring genommen', () => {
    const bloecke = reiterBloecke(html(DREI, '/gesetze/bund/ZGB'));
    for (const b of bloecke.filter((x) => x.schluessel !== '/gesetze/bund/ZGB')) {
      // Reiter-Knopf und Schliess-✕ — beide tragen −1, sonst bliebe die Leiste
      // bei fünfzig Reitern eine Tabulator-Wüste.
      expect((b.html.match(/tabindex="-1"/g) ?? []).length,
        `${b.schluessel}: Knopf UND ✕ müssen −1 tragen`).toBeGreaterThanOrEqual(2);
    }
  });

  it('steht der aktive Reiter nicht in der Liste, bekommt der erste den Platz', () => {
    const bloecke = reiterBloecke(html(DREI, '/ueber'));
    expect((bloecke[0].html.match(/tabindex="0"/g) ?? []).length).toBe(1);
  });
});
