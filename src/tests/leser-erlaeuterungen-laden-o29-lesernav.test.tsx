/**
 * LESER-NAV O-29 (E8-B01) · Reiter «Erläuterungen» war beim Laden — und beim Ausfall des
 * Registers — leer: ohne Zahl stand die Erlass-Tafel zugeklappt, ihr Lade- und Fehlersatz
 * hinter der Klappzeile. Gemessen 16.10.2026 mit Vite-Dev-Server und headless Chromium
 * (DBG, ARG; Materialien-Abruf um 2,5 s verzögert): bis zum Eintreffen der Daten stand im
 * Reiter nur «▸ Alle Erläuterungen des Erlasses», kein Wort vom Laden.
 *
 * ROT ZU BEKOMMEN (§6.7, gefahren 16.10.2026): in `PanelTafeln` die Zeile `erlLaedt && …`
 * streichen ⇒ Fall 1 rot; `erlAusfall ? 0 : erlZahl` auf `erlZahl` zurücksetzen ⇒ Fall 2 und 4 rot;
 * `&& !erlaeuterungen.rest` an `erlAusfall` wieder anhängen ⇒ Fall 4 rot.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePanelTafeln } from '../pages/gesetz-leser/v3/PanelTafeln';
import { _leereKantenShardCache } from '../lib/materialien/kanten-shard';
import { _leereMaterialManifestCache } from '../lib/materialien/browse';
import type { NormSnapshot } from '../lib/normtext/typen';

const MANIFEST = {
  erzeugt: '2026-10-01',
  materialien: [{ key: 'A', doktyp: 'wegleitung', behoerdeKuerzel: 'SECO', doktypLabel: 'Wegleitung', nummer: null, titel: 'Titel A', stand: '2025-01-01' }],
};
const KANTEN = {
  erzeugt: '2026-10-01', erlass: 'ARG', dokumente: {},
  kanten: [{ dok: 'A', artikel: '6', quelle: 'amtlich', konfidenz: 'x', stand: '2025-01-01', fundstellen: [] }],
};

let root: Root | null = null;
afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
  _leereKantenShardCache();
  _leereMaterialManifestCache();
});

type Antwort = 'haengt' | 'ok' | 'manifest500' | 'shard500' | 'shardLeer';

async function erlaeuterungenText(antwort: Antwort, erlass = 'ARG'): Promise<{ text: string; klappzeilen: number }> {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', Object.assign(window, {
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
    requestIdleCallback: (cb: () => void) => globalThis.setTimeout(cb, 0) as unknown as number,
    cancelIdleCallback: (id: number) => globalThis.clearTimeout(id),
  }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (antwort === 'haengt') return new Promise<Response>(() => {});
    const pfad = String(url).replace(/^https?:\/\/[^/]+/, '');
    const json = (status: number, body: unknown) => ({ ok: status < 400, status, headers: { get: () => 'application/json' }, json: async () => body }) as unknown as Response;
    if (pfad.includes('/materialien/register.json')) return antwort === 'manifest500' ? json(500, null) : json(200, MANIFEST);
    if (pfad.includes(`/materialien/kanten/${erlass}.json`)) {
      if (antwort === 'shard500') return json(500, null);
      return json(200, antwort === 'shardLeer' ? { ...KANTEN, erlass, kanten: [] } : KANTEN);
    }
    return json(404, null);
  }));
  const ziel = document.getElementById('app') as unknown as HTMLElement;
  function Sonde() {
    const t = usePanelTafeln({
      erlassKey: erlass, laden: true, quelleUrl: 'https://www.fedlex.admin.ch/', ebene: 'bund', stichtag: null,
      aktArtikel: '6', artikelLabel: 'Art. 6', blatt: { eintrag: { artikel: '6' } as unknown as NormSnapshot },
      normZitat: `Art. 6 ${erlass}`, wort: 'Artikel', historie: { wert: null, fertig: true },
    });
    return createElement('div', null, t.tafeln.erlaeuterungen);
  }
  root = createRoot(ziel);
  await act(async () => { root!.render(createElement(MemoryRouter, null, createElement(Sonde))); });
  for (let i = 0; i < 10; i++) await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
  return {
    text: (ziel.textContent ?? '').replace(/\s+/g, ' '),
    klappzeilen: ziel.querySelectorAll('[data-v3-blatt-erlassteil]').length,
  };
}

describe('O-29 · Reiter «Erläuterungen»: Laden und Ausfall sind sichtbar', () => {
  it('1 · Daten noch unterwegs: «werden geladen …» über der zugeklappten Zeile', async () => {
    const { text, klappzeilen } = await erlaeuterungenText('haengt');
    expect(text).toContain('Behördliche Erläuterungen werden geladen …');
    expect(klappzeilen).toBe(1);
    expect(text).toContain('Alle Erläuterungen des Erlasses');
  });

  it('2 · Register fällt aus: der Fehlersatz steht offen, keine Klappzeile, keine Ladezeile', async () => {
    const { text, klappzeilen } = await erlaeuterungenText('manifest500');
    expect(text).toContain('Behördliche Erläuterungen konnten nicht geladen werden');
    expect(text).not.toContain('werden geladen');
    expect(klappzeilen).toBe(0);
  });

  // A3 (Gegenprüfung #1405): bei Ausfall des Kanten-Shards ist `rest` IMMER gesetzt (auch
  // leer: STG kuratiert 0 Einträge) — `!rest` hielt die Tafel zugeklappt, der Fehlersatz
  // stand hinter der Klappzeile (§8). Offen muss sie stehen, `rest` leer oder nicht.
  it('4 · Kanten-Shard fällt aus (Erlass ohne kuratierte Einträge): Fehlersatz offen, keine Klappzeile', async () => {
    const { text, klappzeilen } = await erlaeuterungenText('shard500', 'STG');
    expect(text).toContain('Behördliche Erläuterungen konnten nicht geladen werden');
    expect(klappzeilen).toBe(0);
  });

  it('5 · Normalfall: Shard ok, Liste leer ist kein Ausfall (Leersatz statt Fehlersatz)', async () => {
    const { text } = await erlaeuterungenText('shardLeer', 'STG');
    expect(text).toContain('keine behördliche Erläuterung erfasst');
    expect(text).not.toContain('konnten nicht geladen werden');
  });

  it('3 · geladen: keine Ladezeile mehr, Tafel zugeklappt mit Zahl, Artikel-Teil da', async () => {
    const { text, klappzeilen } = await erlaeuterungenText('ok');
    expect(text).not.toContain('werden geladen');
    expect(klappzeilen).toBe(1);
    expect(text).toContain('Alle Erläuterungen des Erlasses');
    expect(text).toContain('Titel A');
  });
});
