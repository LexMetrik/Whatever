/**
 * W2·17-UI-BEFUNDE · E-D13-B02 (1.10.2026) — Reiter «Änderungen» am Blatt: fallen die
 * Quellen beim Laden aus (Netzausfall), stand «Zu Art. N nichts erfasst.» da, und die
 * Erlass-Tafel war zugeklappt, ihr Fehlertext darin verborgen. Ein Ladefehler ist keine
 * Auskunft über den Artikel (§8). Gemessen im Befund mit blockierten Netzpfaden
 * (`/normtext/historie`, `/verzahnung/artikel-revisionen`, `/normtext/revisionen`).
 *
 * Geprüft wird die AUSSAGE der Fläche: Fehlerzustand → «Erneut laden» → die Quellen
 * erholen sich → der Artikel-Beleg (aus dem Artikel-Shard!) steht da.
 *
 * ROT ZU BEKOMMEN (§6.7): in `usePanelTafeln` `aenderungenLadefehler` fest `false`
 * (Fehlzustand) bzw. das `artikelRevisionen.erneut?.()` aus dem Erneut-Griff streichen
 * (Erholung: der Artikel-Beleg fehlt dann).
 *
 * ERGÄNZT (gleiche Klasse «Ladefehler/noch nicht geladen ≠ nichts erfasst», Auftrag 1.10.2026):
 *  · PE-F10-B01  Historie-Netzfehler (`historie.fehler`) → Fehlertext + Neuversuch statt
 *                «nichts erfasst» und statt «Erlass in Kraft seit …» (Staatsvertrag).
 *  · PE-F12-B02  Reiter «Materialien»: Artikelteil wartet auf die Historie, Fehler sichtbar.
 *  · PE-F12-B03  Kanton: kein «Zu § N nichts erfasst.»/Hinweis im Artikelteil der Materialien.
 *  · PE-F10-B04  Kanton: die Sperre gilt schon, solange der Sidecar lädt (kein Aufblitzen).
 * Rot: `historieFehler` fest `false`; `materialArtikelToken = token`; `!revisionen.fertig ||` streichen.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePanelTafeln } from '../pages/gesetz-leser/v3/PanelTafeln';
import { _leereRevisionenCache } from '../lib/normtext/revisionen';
import { _leereMaterialManifestCache } from '../lib/materialien/browse';
import type { ArtikelHistorie } from '../lib/normtext/historie-parse';
import type { HistorieStand } from '../pages/gesetz-leser/useHistorieShard';
import type { NormSnapshot } from '../lib/normtext/typen';

const EINTRAG = {
  id: 'bund/OR/art_7', ebene: 'bund', quelle: 'OR', erlass: 'OR', artikel: '7', artikelLabel: 'Art. 7',
  bloecke: [{ absatz: null, text: 'Lebender Wortlaut.' }], stand: '2026-05-22', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/x/de',
  abgerufen: '2026-10-01', fassungsToken: '20260522', sha: 'x',
} as unknown as NormSnapshot;

let root: Root | null = null;
let ziel: HTMLElement;
const text = () => (ziel.textContent ?? '').replace(/\s+/g, ' ');
const json = (body: unknown) => ({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => body }) as unknown as Response;
const tot = (status: number) => ({ ok: false, status, headers: { get: () => null }, json: async () => null }) as unknown as Response;

const SIDECAR = { erlassKey: 'OR', sr: '220', abgerufen: '2026-10-01', reichweite: null, revisionen: [
  { art: 'aenderung', dateEntryInForce: '2020-01-01', ocUri: 'https://x/oc/1', titelDe: 'Eine Änderung', quelleUrl: 'https://x' },
] };
const SHARD = { erlass: 'OR', proArtikel: { '7': { iso: '2001-01-01', as: 'AS 2001 99' } } };

/** `netz`: true = Netzausfall (fetch wirft); sonst Antworten je Pfad. */
function stubFetch(modus: { netz: true } | { sidecar: unknown; shard: unknown }) {
  const f = vi.fn(async (url: string) => {
    if ('netz' in modus) throw new TypeError('Failed to fetch');
    if (url.includes('/normtext/revisionen/')) return json(modus.sidecar);
    if (url.includes('/verzahnung/artikel-revisionen/')) return json(modus.shard);
    return tot(404);
  });
  vi.stubGlobal('fetch', f);
  return f;
}

interface Optionen {
  /** je Test verschieden: der Shard-Cache von `ladeRevisionShard` ist modulweit. */
  erlassKey?: string;
  historie?: HistorieStand;
  blattHistorie?: ArtikelHistorie;
  ebene?: 'bund' | 'kanton';
  erlassSr?: string | null;
  inkraftSeit?: string | null;
  tafel?: 'aenderungen' | 'materialien';
}

async function rendere(o: Optionen | string = {}) {
  const opt: Optionen = typeof o === 'string' ? { erlassKey: o } : o;
  const erlassKey = opt.erlassKey ?? 'OR';
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', Object.assign(window, { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  ziel = document.getElementById('app') as unknown as HTMLElement;
  root = createRoot(ziel);
  function Sonde() {
    const t = usePanelTafeln({
      erlassKey, laden: true, quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de', ebene: opt.ebene ?? 'bund', stichtag: null,
      aktArtikel: '7', artikelLabel: 'Art. 7', blatt: { eintrag: EINTRAG, historie: opt.blattHistorie },
      normZitat: 'Art. 7 OR', wort: 'Artikel', erlassSr: opt.erlassSr ?? null, inkraftSeit: opt.inkraftSeit ?? null,
      // Historie des Lesers: «geladen», ohne Shard (Netzausfall und 404 sind dort ununterscheidbar).
      historie: opt.historie ?? { wert: null, fertig: true },
    });
    return createElement('div', null, t.tafeln[opt.tafel ?? 'aenderungen']);
  }
  await act(async () => { root!.render(createElement(MemoryRouter, null, createElement(Sonde))); });
  for (let i = 0; i < 4; i++) await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
}

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
  _leereRevisionenCache();
  _leereMaterialManifestCache();
});

describe('Reiter «Änderungen» am Blatt — Ladefehler statt «nichts erfasst» (E-D13-B02)', () => {
  it('Netzausfall: Fehlertext + «Erneut laden», KEIN «Zu Art. 7 nichts erfasst.», Erlass-Tafel offen', async () => {
    stubFetch({ netz: true });
    await rendere();
    expect(text()).toContain('Änderungsverlauf konnte nicht geladen werden');
    expect(text()).toContain('Erneut laden');
    expect(text()).not.toContain('nichts erfasst');
    // nicht hinter einer Klappzeile verborgen
    expect(ziel.querySelector('[data-v3-blatt-erlassteil]')).toBeNull();
  });

  it('«Erneut laden» wiederholt Sidecar UND Artikel-Shard; nach der Erholung steht der Artikel-Beleg da', async () => {
    stubFetch({ netz: true });
    await rendere();
    const f = stubFetch({ sidecar: SIDECAR, shard: SHARD });
    const knopf = ziel.querySelector('[data-abruf-erneut]') as HTMLElement;
    expect(knopf).not.toBeNull();
    await act(async () => { knopf.click(); });
    for (let i = 0; i < 4; i++) await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
    expect(f.mock.calls.some(([u]) => String(u).includes('/normtext/revisionen/'))).toBe(true);
    expect(f.mock.calls.some(([u]) => String(u).includes('/verzahnung/artikel-revisionen/'))).toBe(true);
    expect(text()).not.toContain('konnte nicht geladen');
    expect(text()).toContain('Art. 7 OR zuletzt geändert durch AS 2001 99');
    expect(text()).not.toContain('Zu Art. 7 nichts erfasst');
  });

  it('Gegenprobe: Erlass OHNE Revisions-Datei (404 überall) = ehrliches «nichts erfasst», kein Fehler', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => tot(404)));
    await rendere('KOV');
    expect(text()).toContain('Zu Art. 7 nichts erfasst.');
    expect(text()).not.toContain('konnte nicht geladen');
    expect(text()).toContain('Für diesen Erlass ist kein Änderungsverlauf erfasst');
  });
});

// ─── Historie-Shard: Netzfehler ≠ «kein Shard» (PE-F10-B01) ─────────────────────
const ereignisMitBotschaft = (url: string) => ({
  giltSeit: '2010-01-01',
  ereignisse: [{ typ: 'fassung', datum: '2010-01-01', wirkung: false, quellen: [{ label: 'BBl 2006 7221', url }], absatz: null, item: null }],
}) as unknown as ArtikelHistorie;

describe('Historie-Netzfehler am Blatt — Reiter «Änderungen» (PE-F10-B01)', () => {
  const FEHLER = (erneut?: () => void): HistorieStand => ({ wert: null, fertig: true, fehler: true, erneut });
  it('Fehlertext + «Erneut laden» statt «nichts erfasst» und statt «Erlass in Kraft seit …» (Staatsvertrag)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => tot(404)));
    await rendere({ erlassKey: 'EMRK', historie: FEHLER(), erlassSr: '0.101', inkraftSeit: '1974-11-28' });
    expect(text()).toContain('Änderungen zu Art. 7 konnten nicht geladen werden');
    expect(text()).not.toContain('Zu Art. 7 nichts erfasst');
    expect(text()).not.toContain('Erlass in Kraft seit');
    expect(ziel.querySelector('[data-v3-blatt-artikelgruppe="aenderungen"][data-v3-blatt-fehler]')).not.toBeNull();
  });
  it('«Erneut laden» ruft den Neuversuch der Historie', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => tot(404)));
    const erneut = vi.fn();
    await rendere({ erlassKey: 'EMRK2', historie: FEHLER(erneut) });
    const knopf = ziel.querySelector('[data-v3-blatt-artikelgruppe="aenderungen"] [data-abruf-erneut]') as HTMLElement;
    await act(async () => { knopf.click(); });
    expect(erneut).toHaveBeenCalledTimes(1);
  });
  it('Gegenprobe: «kein Shard» ohne Fehler (404) bleibt die ehrliche Leerauskunft + «Erlass in Kraft seit …»', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => tot(404)));
    await rendere({ erlassKey: 'EMRK3', historie: { wert: null, fertig: true }, erlassSr: '0.101', inkraftSeit: '1974-11-28' });
    expect(text()).toContain('Erlass in Kraft seit 28.11.1974');
    expect(text()).not.toContain('konnten nicht geladen');
  });
});

// ─── Reiter «Materialien»: Artikelteil (PE-F12-B02, PE-F12-B03) ─────────────────
const FGA = 'https://fedlex.data.admin.ch/eli/fga/2006/45';
const manifest = (key: string) => ({
  erzeugt: '2026-10-01',
  materialien: [{ key: 'B-06-062', doktyp: 'botschaft', normKeys: [key], titel: 'Botschaft zur Schweizerischen Zivilprozessordnung', nummer: '06.062',
    quelleUrl: 'https://www.fedlex.admin.ch/eli/fga/2006/45/de', stand: '2006-06-28' }],
});
function stubMaterialien(key: string) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).includes('/materialien/register.json') ? json(manifest(key)) : tot(404))));
}

describe('Reiter «Materialien» am Blatt — der Artikelteil hängt an der Historie (PE-F12-B02)', () => {
  it('Historie-Netzfehler: Fehlertext + Neuversuch, KEIN «nichts erfasst»', async () => {
    stubMaterialien('OR-M1');
    const erneut = vi.fn();
    await rendere({ erlassKey: 'OR-M1', tafel: 'materialien', historie: { wert: null, fertig: true, fehler: true, erneut } });
    expect(text()).toContain('Botschaften zu Art. 7 konnten nicht geladen werden');
    expect(text()).not.toContain('Zu Art. 7 nichts erfasst');
    await act(async () => { (ziel.querySelector('[data-v3-blatt-artikelgruppe="materialien"] [data-abruf-erneut]') as HTMLElement).click(); });
    expect(erneut).toHaveBeenCalledTimes(1);
  });
  it('Historie noch nicht da: weder Leerzeile noch Fehler (kein Aufblitzen vor der Botschaft)', async () => {
    stubMaterialien('OR-M2');
    await rendere({ erlassKey: 'OR-M2', tafel: 'materialien', historie: { wert: null, fertig: false } });
    expect(text()).not.toContain('Zu Art. 7');
    expect(text()).not.toContain('konnten nicht geladen');
  });
  it('Historie da, Fussnote nennt die Botschaft: sie steht im Artikelteil', async () => {
    stubMaterialien('OR-M3');
    await rendere({ erlassKey: 'OR-M3', tafel: 'materialien', historie: { wert: null, fertig: true }, blattHistorie: ereignisMitBotschaft(FGA) });
    expect(text()).toContain('Zu Art. 7');
    expect(text()).toContain('06.062');
    expect(text()).not.toContain('Zu Art. 7 nichts erfasst');
  });
  it('Historie da, keine Fussnote zur Botschaft: «nichts erfasst» bleibt die ehrliche Auskunft', async () => {
    stubMaterialien('OR-M4');
    await rendere({ erlassKey: 'OR-M4', tafel: 'materialien', historie: { wert: null, fertig: true } });
    expect(text()).toContain('Zu Art. 7 nichts erfasst.');
  });
});

describe('Kanton (PE-F12-B03, PE-F10-B04)', () => {
  it('Materialien am Kanton: kein «Zu § N nichts erfasst.» und kein «Nur Botschaften …»-Hinweis; die Erlass-Liste bleibt', async () => {
    stubMaterialien('BS-640.100');
    await rendere({ erlassKey: 'BS-640.100', ebene: 'kanton', tafel: 'materialien', historie: { wert: null, fertig: true } });
    expect(text()).not.toContain('nichts erfasst');
    expect(text()).not.toContain('Nur Botschaften');
    expect(ziel.querySelector('[data-v3-blatt-erlassteil="materialien"]')).not.toBeNull();
  });
  it('Änderungen am Kanton, Sidecar lädt noch: keine Leerzeile, Erlass-Tafel schon inline (kein Sprung)', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => (String(url).includes('/normtext/revisionen/') ? new Promise<Response>(() => undefined) : Promise.resolve(tot(404)))));
    await rendere({ erlassKey: 'BS-640.101', ebene: 'kanton', historie: { wert: null, fertig: true } });
    expect(text()).not.toContain('nichts erfasst');
    expect(ziel.querySelector('[data-v3-blatt-erlassteil="aenderungen"]')).toBeNull();
  });
});
