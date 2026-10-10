// ─── Direktaufruf eines Verweis-Keys (`…__voll`) im Entscheid-Leser ──────────
//
// Ein Verweis-Eintrag ist das «vollständige Urteil» zu einem BGE-Leitentscheid:
// eigene Karte in der Übersicht, aber KEIN eigener Snapshot (`datei: null`).
// Wer seine Adresse direkt aufruft (Lesezeichen, geteilter Link), wird auf das
// Ziel-BGE mit voraktivierter Ansicht weitergeleitet (EntscheidLeser.tsx, Lade-
// Effekt), statt «nicht verfügbar» zu sehen (§8). Diese Weiche war bis E0-REGISTER
// (10.10.2026) von keinem Test belegt; sie liest `verweis` und `datei` aus dem
// Verzeichnis, das der Leser lädt — der Umbau dieses Verzeichnisses (Register →
// schlanker Entscheid-Index) darf sie nicht stillschweigend verlieren (§6).
//
// Das Fetch-Stub antwortet auf BEIDE Verzeichnis-Adressen (Register und Index)
// mit demselben Körper: der Test gilt damit unverändert VOR und NACH der Umstellung
// des Lesers (Verhaltensneutralität, §6.3) — er prüft die Weiche, nicht die Adresse.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { LocaleProvider } from '../components/locale';
import { RouteSwitch } from '../RouteSwitch';

const NETZ = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'rest-flaechen', 'netz.json'), 'utf8'),
).antworten as Record<string, unknown>;
const SNAPSHOT_PFAD = '/rechtsprechung/bund/bge/149_IV_213.json';

// Schmale Einträge genügen: der Leser liest key, datei, verweis, richter.
const VERZEICHNIS = {
  erzeugt: '2026-09-23',
  entscheide: [
    {
      key: 'bge_149_IV_213', zitierung: 'BGE 149 IV 213', nummer: '149 IV 213', bgeReferenz: '149 IV 213',
      datum: '2023-04-06', leitcharakter: 'leitentscheid', datei: 'bund/bge/149_IV_213.json',
    },
    {
      key: 'bge_149_IV_213__voll', zitierung: 'BGE 149 IV 213 (vollständiges Urteil)', nummer: '1B_1/2023', bgeReferenz: null,
      datum: '2023-04-06', leitcharakter: 'routine', datei: null,
      verweis: { zielKey: 'bge_149_IV_213', ansicht: 'voll', bgeReferenz: '149 IV 213' },
    },
  ],
};

const angefragt: string[] = [];
let aufgeraeumt: Array<() => void> = [];
afterEach(() => { for (const f of aufgeraeumt) f(); aufgeraeumt = []; vi.unstubAllGlobals(); angefragt.length = 0; });

const ortSpur = { wert: '' };
function OrtSpur() {
  const l = useLocation();
  useEffect(() => { ortSpur.wert = l.pathname + l.search; }, [l.pathname, l.search]);
  return null;
}

async function oeffne(href: string): Promise<{ ort: string; html: string }> {
  const { document, window } = parseHTML('<!doctype html><html><head></head><body><div id="app"></div></body></html>');
  const speicher = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, String(v)); }, removeItem: (k: string) => { m.delete(k); }, clear: () => m.clear(), key: () => null, length: 0 };
  };
  class Beobachter { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  const browser = {
    requestAnimationFrame: (f: FrameRequestCallback) => globalThis.setTimeout(() => f(0), 0) as unknown as number,
    cancelAnimationFrame: (id: number) => globalThis.clearTimeout(id),
    matchMedia: (q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }),
    IntersectionObserver: Beobachter, ResizeObserver: Beobachter, scrollTo() {}, scrollBy() {},
    localStorage: speicher(), sessionStorage: speicher(),
    location: new URL(`https://lexmetrik.ch${href}`),
    history: { state: null, length: 1, replaceState() {}, pushState() {}, back() {}, forward() {}, go() {} },
  };
  for (const [k, v] of Object.entries(browser)) vi.stubGlobal(k, v);
  vi.stubGlobal('window', Object.assign(window, browser, { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }));
  // linkedom kennt `createRange` nicht; die Fundstellen-Markierung (?norm=) ruft es auf.
  Object.assign(document, { createRange: () => ({ setStart() {}, setEnd() {} }) });
  Object.assign((window as unknown as { Element: { prototype: object } }).Element.prototype, { scrollIntoView() {} });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  let offen = 0;
  vi.stubGlobal('fetch', vi.fn(async (u: string) => {
    const pfad = String(u).split('?')[0];
    offen++;
    try {
      angefragt.push(pfad);
      const verzeichnis = pfad === '/rechtsprechung/register.json' || pfad === '/rechtsprechung/entscheid-index.json';
      const koerper = verzeichnis ? VERZEICHNIS : pfad === SNAPSHOT_PFAD ? NETZ[SNAPSHOT_PFAD] : undefined;
      if (koerper === undefined) return { ok: false, status: 404, json: async () => null };
      return { ok: true, status: 200, json: async () => structuredClone(koerper) };
    } finally { offen--; }
  }));

  const ziel = document.getElementById('app') as unknown as HTMLElement;
  const root = createRoot(ziel);
  aufgeraeumt.push(() => act(() => root.unmount()));
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[href]}>
        <OrtSpur />
        <LocaleProvider><Suspense fallback={null}><RouteSwitch /></Suspense></LocaleProvider>
      </MemoryRouter>,
    );
  });
  let vorher = '';
  let stabil = 0;
  for (let i = 0; i < 500 && stabil < 5; i++) {
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const jetzt = ziel.innerHTML;
    stabil = jetzt !== '' && jetzt === vorher && offen === 0 ? stabil + 1 : 0;
    vorher = jetzt;
  }
  if (stabil < 5) throw new Error(`${href}: Fläche wurde nicht stabil`);
  return { ort: ortSpur.wert, html: ziel.innerHTML };
}

describe('Direktaufruf eines Verweis-Keys (__voll)', () => {
  it('leitet auf das Ziel-BGE mit voraktivierter Ansicht weiter und rendert dessen Urteil', async () => {
    const { ort, html } = await oeffne('/rechtsprechung/bge_149_IV_213__voll');
    expect(ort).toBe('/rechtsprechung/bge_149_IV_213?ansicht=voll');
    expect(html).toContain('BGE 149 IV 213');
    expect(html).not.toContain('Entscheid nicht gefunden');
    // Der Snapshot des ZIELS wurde geladen; der Verweis-Key selbst hat keine Datei.
    expect(angefragt).toContain(SNAPSHOT_PFAD);
  }, 60_000);

  it('schleppt ?norm= über die Weiterleitung mit (Fundstellen-Sprung überlebt den Redirect)', async () => {
    const { ort } = await oeffne('/rechtsprechung/bge_149_IV_213__voll?norm=BGG');
    expect(ort).toBe('/rechtsprechung/bge_149_IV_213?ansicht=voll&norm=BGG');
  }, 60_000);

  it('Gegenprobe: ein unbekannter Schlüssel leitet nicht weiter, sondern meldet «nicht gefunden»', async () => {
    const { ort, html } = await oeffne('/rechtsprechung/gibt_es_nicht');
    expect(ort).toBe('/rechtsprechung/gibt_es_nicht');
    expect(angefragt).not.toContain(SNAPSHOT_PFAD);
    expect(html).toMatch(/nicht (gefunden|verfügbar|im Bestand)/i);
  }, 60_000);
});
