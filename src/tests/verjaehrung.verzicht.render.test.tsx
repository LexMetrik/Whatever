// RL-14 PR 2 (F5-03, UI-04, F5-04): Darstellung des Einredeverzichts im
// Verjährungsrechner. Formular per Permalink vorbelegt (usePermalinkFelder
// liest window.location.search); Render wie die Export-Ratsche
// (prerenderToNodeStream + linkedom), Uhr fest.
//
// Soll (Art. 141 Abs. 1 / Art. 142 OR, Fedlex SR 220 Konsolidierung 1.1.2026):
// Ist auf die Erhebung der Einrede wirksam verzichtet, darf die Stichtags-
// Kachel die Forderung nicht als rot «verjährt (Einrede …)» ausweisen — die
// Einrede ist ausgeschlossen. Die Verzichtsdauer wird nicht als «ab
// Verjährungseintritt» beschriftet (BBl 2014 235 S. 262: Laufbeginn offen;
// W-06 a: ab Erklärung).
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { prerenderToNodeStream } from 'react-dom/static';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { LocaleProvider } from '../components/locale';
import { VerjaehrungForm } from '../components/forms/VerjaehrungForm';

async function rendere(search: string): Promise<Document> {
  vi.stubGlobal('window', { location: { search, hash: '', pathname: '/rechner/verjaehrung', origin: 'https://lexmetrik.ch' } });
  const { prelude } = await prerenderToNodeStream(
    <MemoryRouter initialEntries={[`/rechner/verjaehrung${search}`]}>
      <LocaleProvider><VerjaehrungForm /></LocaleProvider>
    </MemoryRouter>,
  );
  let html = '';
  for await (const teil of prelude) html += String(teil);
  return parseHTML(`<!doctype html><html><body>${html}</body></html>`).document as unknown as Document;
}

const stichtagKachel = (doc: Document): Element | undefined =>
  [...doc.querySelectorAll('.lc-tile')].find((el) => (el.textContent ?? '').startsWith('Am Stichtag'));

describe('RL-14 · Verjährungsrechner — Einredeverzicht in der Darstellung', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-01T12:00:00'));
  });
  afterEach(() => { vi.unstubAllGlobals(); });
  afterAll(() => { vi.useRealTimers(); });

  it('F5-03: verjährt, aber Einrede durch Verzicht ausgeschlossen → Kachel ohne Rot, mit Verzichtssatz', async () => {
    // Fälligkeit 1.3.2017 → Eintritt 1.3.2027; Verzicht 15.9.2026 bis 31.12.2029; Stichtag 1.6.2028.
    const doc = await rendere('?re=ordentlich&br=2017-03-01&s=2028-06-01&k=ZH&va=1&vd=2026-09-15&vb=2029-12-31');
    const kachel = stichtagKachel(doc);
    expect(kachel, 'Stichtags-Kachel fehlt').toBeDefined();
    expect(kachel!.querySelector('.text-danger-700')).toBeNull();
    expect((kachel!.textContent ?? '').replace(/\s+/g, ' ')).toContain('Einrede durch Verzicht bis 31.12.2029 ausgeschlossen');
  });

  it('F5-04: Beschriftung der Verzichtsdauer nennt nicht «ab Verjährungseintritt»', async () => {
    const doc = await rendere('?re=ordentlich&br=2020-01-15&s=2026-06-04&k=ZH&va=1&vd=2029-12-01&vj=5');
    const text = (doc.body.textContent ?? '').replace(/\s+/g, ' ');
    expect(text).toContain('Verzicht');
    expect(text).not.toMatch(/ab Verjährungseintritt/);
  });

  it('UI-04: leeres Dauerfeld → kein Eingabefehler vor der Eingabe, aber kein stiller Platzhalter «10»', async () => {
    const doc = await rendere('?re=ordentlich&br=2020-01-15&s=2026-06-04&k=ZH&va=1&vd=2029-12-01');
    const jahre = doc.querySelector('input[type="number"]');
    expect(jahre).not.toBeNull();
    expect(jahre!.getAttribute('aria-invalid')).not.toBe('true');
    expect(jahre!.getAttribute('placeholder') ?? '').not.toBe('10');
  });

  it('UI-04: Dauer 0 → Feld als ungültig markiert', async () => {
    const doc = await rendere('?re=ordentlich&br=2020-01-15&s=2026-06-04&k=ZH&va=1&vd=2029-12-01&vj=0');
    const jahre = doc.querySelector('input[type="number"]');
    expect(jahre!.getAttribute('aria-invalid')).toBe('true');
  });
});
