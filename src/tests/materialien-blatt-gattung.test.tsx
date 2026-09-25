/**
 * U12 (David 24.9.2026, «materialien soll erläuterungen und materialien
 * enthalten»): das Blatt der Materialien-Kachel trennt die Gattungen mit einem
 * Schalter «Alle · Materialien · Erläuterungen». Zuordnung aus
 * `lib/materialien/gattung.ts` — dieselbe, nach der der Leser seine Reiter
 * «Materialien» (botschaften/vernehmlassungen/ratschlaege.ts) und
 * «Erläuterungen» füllt (§5).
 *
 * ROT ZU BEKOMMEN: im Blatt den Gattungs-Filter weglassen (`inGattung` = alle)
 * oder in `gattung.ts` einen Gesetzgebungs-Doktyp aus der Menge nehmen.
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MaterialienBlatt } from '../components/start/MaterialienBlatt';
import { DOKTYPEN } from '../lib/materialien/register';
import { gattungVon } from '../lib/materialien/gattung';
import type { BrowseMaterial } from '../lib/materialien/typen';

const eintrag = (key: string, behoerde: BrowseMaterial['behoerde'], doktyp: BrowseMaterial['doktyp'], titel: string): BrowseMaterial => ({
  key, behoerde, behoerdeName: behoerde, behoerdeKuerzel: behoerde, doktyp, doktypLabel: doktyp, titel,
  nummer: null, rechtsgebiet: 'steuerrecht' as BrowseMaterial['rechtsgebiet'], sprache: 'de' as BrowseMaterial['sprache'],
  status: 'nur-live-link' as BrowseMaterial['status'], quelleUrl: 'https://www.admin.ch/', stand: '2026-01-01',
  rang: 1, normKeys: [], hinweis: null,
});
const MANIFEST = {
  erzeugt: '2026-09-24',
  materialien: [
    eintrag('BR-BOT-1', 'BR', 'botschaft', 'Botschaft zur Revision X'),
    eintrag('ESTV-KS-1', 'ESTV', 'kreisschreiben', 'Kreisschreiben Nr. 1'),
  ],
};

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('U12 · Gattungs-Zuordnung (eine Quelle mit dem Leser)', () => {
  it('genau die Doktypen der Leser-Reiter «Materialien» sind Gesetzgebung', () => {
    const gesetzgebung = DOKTYPEN.filter((d) => gattungVon(d.id) === 'materialien').map((d) => d.id).sort();
    expect(gesetzgebung).toEqual(['botschaft', 'gr-bericht', 'gr-initiative', 'ratschlag', 'vernehmlassung']);
  });
});

describe('U12 · Materialien-Blatt: Gattungs-Schalter filtert', () => {
  it('Alle zeigt beide mit Gattungs-Marke; Materialien/Erläuterungen je nur ihre Gattung', async () => {
    const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
    vi.stubGlobal('window', Object.assign(window, { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }));
    vi.stubGlobal('document', document);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => MANIFEST })));
    const ziel = document.getElementById('app') as unknown as HTMLElement;
    const root = createRoot(ziel);
    await act(async () => { root.render(<MemoryRouter><MaterialienBlatt /></MemoryRouter>); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    const links = () => [...ziel.querySelectorAll('a[href^="/materialien/"]')].map((a) => a.getAttribute('href'));
    const knopf = (name: string) => [...ziel.querySelectorAll('[role="group"][aria-label="Gattung"] button')]
      .find((b) => b.textContent === name) as unknown as HTMLElement;
    const klick = async (name: string) => {
      await act(async () => { knopf(name).dispatchEvent(new window.Event('click', { bubbles: true })); });
    };

    expect(links()).toEqual(['/materialien/BR-BOT-1', '/materialien/ESTV-KS-1']);
    expect([...ziel.querySelectorAll('[data-gattung]')].map((m) => m.textContent)).toEqual(['Materialien', 'Erläuterungen']);
    expect(knopf('Alle').getAttribute('aria-pressed')).toBe('true');

    await klick('Materialien');
    expect(knopf('Materialien').getAttribute('aria-pressed')).toBe('true');
    expect(links()).toEqual(['/materialien/BR-BOT-1']);
    // Behörden-Optionen folgen der Gattung; die Trefferzahl zählt weiter (§8).
    expect([...ziel.querySelectorAll('select')[0].querySelectorAll('option')].map((o) => o.getAttribute('value'))).toEqual(['', 'BR']);
    expect(ziel.textContent).toContain('1 Dokument');

    await klick('Erläuterungen');
    expect(links()).toEqual(['/materialien/ESTV-KS-1']);
    expect([...ziel.querySelectorAll('select')[1].querySelectorAll('option')].map((o) => o.getAttribute('value'))).toEqual(['', 'kreisschreiben']);

    act(() => root.unmount());
  });
});
