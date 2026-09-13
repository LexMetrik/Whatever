import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../components/locale';
import { Reiterleiste } from '../components/layout/Reiterleiste';

// ── W2·25 · DIE FORM DES ANGEHEFTETEN REITERS (Spec §7 Teil 1) ──────────────
//
// «schmaler Reiter nur mit Kürzel, ganz links, ohne ✕» (§5a Ziff. 5). Drei
// dieser vier Zusagen stehen schon im SSR-Markup und brauchen keinen Browser:
// die Stellung (ganz links), das fehlende ✕ und die fehlenden Teile (Kopf,
// Lesestellung). Die vierte — dass er dadurch wirklich SCHMALER wird — ist
// eine Breitenmessung und steht in `e2e/w224-r13-reiter.e2e.ts`.
//
// ROT ZU BEKOMMEN (§6.7, so gefahren 13.9.2026 gegen `43a5459ff`: das Feld
// `fest` existierte nicht, die Leiste zeichnete drei gewöhnliche Reiter):
// in `reiterleiste/Reiter.tsx` den `{!fest && <SchliessKnopf …>}`-Zweig wieder
// bedingungslos rendern bzw. die Partition in `lib/tabs.ladeTabs` entfernen.

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

const html = (tabs: { path: string; fest?: boolean }[], url: string) => {
  localStorage.setItem('lexmetrik-tabs', JSON.stringify(tabs));
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

describe('W2·25 — der angeheftete Reiter trägt kein ✕ und steht ganz links', () => {
  it('der angeheftete Reiter steht vorn, obwohl er hinten gespeichert war', () => {
    const markup = html([
      { path: '/rechner/zpo-fristen' },
      { path: '/gesetze/bund/ZGB' },
      { path: '/gesetze/bund/OR', fest: true },
    ], '/gesetze/bund/ZGB');
    expect(reiterBloecke(markup).map((b) => b.schluessel)).toEqual([
      '/gesetze/bund/OR', '/rechner/zpo-fristen', '/gesetze/bund/ZGB',
    ]);
  });

  it('nur der angeheftete Reiter trägt `data-reiter-fest`, und nur er kein ✕', () => {
    const markup = html([
      { path: '/gesetze/bund/OR', fest: true },
      { path: '/gesetze/bund/ZGB' },
    ], '/gesetze/bund/ZGB');
    const [festerBlock, freierBlock] = reiterBloecke(markup);
    expect(festerBlock.schluessel).toBe('/gesetze/bund/OR');
    expect(festerBlock.html).toContain('data-reiter-fest="true"');
    expect(freierBlock.html).not.toContain('data-reiter-fest');
    // A3-1: das ✕ der App kommt aus EINEM Baustein und trägt darum überall
    // denselben Namen — genau daran ist es im Markup zu erkennen.
    expect(festerBlock.html, 'der angeheftete Reiter hat kein Schliess-✕').not.toContain('» schliessen');
    expect(freierBlock.html, 'der freie Reiter behält seines').toContain('» schliessen');
  });

  it('«angeheftet» steht im Accessible Name und im `title`, nicht als Glyphe', () => {
    const markup = html([{ path: '/gesetze/bund/OR', fest: true }], '/gesetze/bund/OR');
    const [block] = reiterBloecke(markup);
    expect(block.html).toContain('Angehefteter Reiter 1: ');
    expect(block.html).toContain('angeheftet');
  });

  it('der angeheftete Reiter zeigt weder Lesestellung noch Kopf — nur den Kern', () => {
    const markup = html([
      { path: '/gesetze/bund/OR#art-336_c', fest: true },
      { path: '/gesetze/bund/ZGB#art-1' },
    ], '/gesetze/bund/OR#art-336_c');
    const [festerBlock] = reiterBloecke(markup);
    expect(festerBlock.html, 'keine reservierte Lesestellung').not.toContain('rl-stelle');
    expect(festerBlock.html).not.toContain('data-reiter-teil="kopf"');
    expect(festerBlock.html).toContain('data-reiter-teil="kern"');
  });
});
