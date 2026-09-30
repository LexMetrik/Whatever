/**
 * W2·27-BUND-FERTIG · Shard-Ladefehler bei den WEITEREN Konsumenten (30.9.2026).
 *
 * #1168 hat den Lader (`ladeKantenShardErgebnis`: ok | leer | fehler) und die
 * Artikel-Gruppe des Erlass-Blatts umgestellt. Vier Posten aus der Gegenprüfung
 * dieses Schritts blieben offen — alle mit demselben Mangel (§8: ein Ladefehler
 * wird als «nichts erfasst» bzw. gar nicht gemeldet):
 *
 *  · P1  `lib/kontext` — `projiziereMaterialien`/`kontextFuerArtikel` (Verweis-
 *        Popover) und `kontextSoftLaw` setzten Fehler = `[]`.
 *  · P2  Dossier des Einzelmodus: Zähler «N Erläuterungen», darunter ein leerer Block.
 *  · P3  `EntstehungsBlock`: Praxis-Fehlerzeile von Hand, ohne «Erneut laden»,
 *        und sie blieb nach «Erneut laden» einer ANDEREN Fläche stehen.
 *  · P4  `kontextSoftLaw`: die Erläuterungsliste verlor bei Shard-Fehler still
 *        Einträge; «Erneut laden» hätte nichts Neues geholt.
 *
 * ROT ZU BEKOMMEN (§6.7), je Stelle:
 *  · P1/P4: in `kontextSoftLawErgebnis` bzw. `materialienFuerArtikelErgebnis`
 *    `fehler` fest auf `false` setzen.
 *  · P2: in `ArtikelLeser.bezuegeFuss.tsx` die Zeile `materialienLadefehler && …`
 *    aus `inhalt` nehmen (oder in `LeserLesespalte.tsx` die Prop nicht reichen).
 *  · P3: in `EntstehungsBlock.tsx` wieder die Handzeile `<p>` statt `AbrufFehler`;
 *    in `kanten-shard.ts` die Rückrufe in `versuch.then` nicht aufrufen.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EntstehungsBlock } from '../components/entstehung/EntstehungsBlock';
import { VerweisKontext } from '../components/kontext/VerweisKontext';
import { ArtikelBezuegeFuss } from '../pages/gesetz-leser/parts/ArtikelLeser.bezuegeFuss';
import { useArtikelMaterialien } from '../pages/gesetz-leser/artikelMaterialienLaden';
import { useErlaeuterungen } from '../pages/gesetz-leser/v3/panelKontextLaden';
import { kontextFuerArtikel, kontextSoftLaw, kontextSoftLawErgebnis } from '../lib/kontext';
import { beiKantenShardErholt, ladeKantenShardErgebnis, _leereKantenShardCache } from '../lib/materialien/kanten-shard';
import { _leereShardCache } from '../lib/rechtsprechung/norm-index';

const KANTE = { dok: 'DOK-A', artikel: '6', quelle: 'amtlich', konfidenz: 'regex-hoch', stand: '2025-01-01', fundstellen: [{ z: '1' }] };
const KOPF = (erlass: string) => ({ erzeugt: '2026-09-30', erlass, dokumente: { 'DOK-A': { urlBasis: 'https://x', stand: '2025-01-01' } }, kanten: [KANTE] });
const MANIFEST = {
  erzeugt: '2026-09-30',
  materialien: [{ key: 'DOK-A', behoerdeKuerzel: 'SECO', doktypLabel: 'Wegleitung', nummer: null, titel: 'Titel A', stand: '2025-01-01' }],
};

type Antwort = { status: number; body?: unknown } | 'netz';
type Quelle = Antwort | (() => Antwort);

/** Fetch-Stub je Pfad (Funktion = je Aufruf neu ausgewertet); Unbekanntes ist 404. */
function stubFetch(map: Record<string, Quelle>) {
  const f = vi.fn(async (url: string) => {
    const q = map[url];
    const a: Antwort = (typeof q === 'function' ? q() : q) ?? { status: 404 };
    if (a === 'netz') throw new TypeError('Failed to fetch');
    return { ok: a.status >= 200 && a.status < 300, status: a.status, json: async () => a.body } as unknown as Response;
  });
  vi.stubGlobal('fetch', f);
  return f;
}
const kantenAufrufe = (f: ReturnType<typeof stubFetch>) =>
  f.mock.calls.filter(([u]) => String(u).includes('/materialien/kanten/')).length;

let root: Root | null = null;
let ziel: HTMLElement;
let win: Window;

async function rendere(el: React.ReactElement) {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  win = window as unknown as Window;
  vi.stubGlobal('window', Object.assign(window, {
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
    requestIdleCallback: (cb: () => void) => globalThis.setTimeout(cb, 0) as unknown as number,
    cancelIdleCallback: (id: number) => globalThis.clearTimeout(id),
  }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  ziel = document.getElementById('app') as unknown as HTMLElement;
  root = createRoot(ziel);
  await act(async () => { root!.render(el); });
  await settle();
}
async function settle() {
  for (let i = 0; i < 3; i++) await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
}
async function klick(el: Element) {
  await act(async () => { el.dispatchEvent(new (win as unknown as { Event: typeof Event }).Event('click', { bubbles: true })); });
  await settle();
}
const text = () => (ziel.textContent ?? '').replace(/\s+/g, ' ');
const erneutKnoepfe = () => Array.from(ziel.querySelectorAll('[data-abruf-erneut]'));

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
  _leereKantenShardCache();
  _leereShardCache();
});

// ─── Das Manifest ZUERST scheitern lassen: `ladeMaterialManifest` cacht nur Erfolge ─
describe('P1/P4 · Manifest fehlt (vor jedem erfolgreichen Abruf dieser Datei)', () => {
  it('kontextSoftLawErgebnis: Manifest 500 ⇒ fehler (nicht «nichts erfasst»)', async () => {
    stubFetch({ '/materialien/register.json': { status: 500 }, '/materialien/kanten/ARG.json': { status: 200, body: KOPF('ARG') } });
    const e = await kontextSoftLawErgebnis('norm', ['ARG']);
    expect(e).toEqual({ liste: [], fehler: true });
  });

  it('Popover: Shard da, Manifest fehlt ⇒ materialienFehler (Titel/Behörde nicht auflösbar)', async () => {
    stubFetch({ '/materialien/register.json': { status: 500 }, '/materialien/kanten/ARG.json': { status: 200, body: KOPF('ARG') } });
    const ctx = await kontextFuerArtikel('ARG', '6');
    expect(ctx.materialien).toEqual([]);
    expect(ctx.materialienFehler).toBe(true);
  });
});

// ─── P4 · kontextSoftLaw ────────────────────────────────────────────────────
describe('P4 · kontextSoftLawErgebnis unterscheidet Shard-Fehler von «ohne Shard»', () => {
  it('ein Shard scheitert, der andere trägt: Rest-Liste + fehler=true', async () => {
    stubFetch({
      '/materialien/register.json': { status: 200, body: MANIFEST },
      '/materialien/kanten/ARG.json': { status: 200, body: KOPF('ARG') },
      '/materialien/kanten/MWSTG.json': 'netz',
    });
    const e = await kontextSoftLawErgebnis('norm', ['ARG', 'MWSTG']);
    expect(e.fehler).toBe(true);
    expect(e.liste.map((m) => m.key)).toEqual(['DOK-A']); // der Rest bleibt sichtbar, aber als unvollständig markiert
  });

  it('Erlass ohne Shard (404) ist eine ANTWORT: fehler=false', async () => {
    stubFetch({ '/materialien/register.json': { status: 200, body: MANIFEST }, '/materialien/kanten/ARG.json': { status: 404 } });
    expect(await kontextSoftLawErgebnis('norm', ['ARG'])).toEqual({ liste: [], fehler: false });
  });

  it('Erfolgsfall unverändert: die dünne Fassung `kontextSoftLaw` liefert dieselbe Liste', async () => {
    stubFetch({ '/materialien/register.json': { status: 200, body: MANIFEST }, '/materialien/kanten/ARG.json': { status: 200, body: KOPF('ARG') } });
    const e = await kontextSoftLawErgebnis('norm', ['ARG']);
    expect(e.fehler).toBe(false);
    expect(await kontextSoftLaw('norm', ['ARG'])).toEqual(e.liste);
  });

  it('Erläuterungen-Tafel: Shard-Fehler ⇒ Fehlerzeile statt Teilliste; «Erneut laden» holt wirklich neu', async () => {
    let netzDa = false;
    const f = stubFetch({
      '/materialien/register.json': { status: 200, body: MANIFEST },
      '/materialien/kanten/ARG.json': () => (netzDa ? { status: 200, body: KOPF('ARG') } : 'netz'),
    });
    function Sonde() {
      const s = useErlaeuterungen('ARG', true);
      return createElement('div', null,
        s.fertig && s.wert === null ? createElement('button', { 'data-abruf-erneut': '', onClick: s.erneut }, 'Erneut laden') : null,
        s.wert ? s.wert.liste.map((m) => createElement('span', { key: m.key }, m.titel)) : null,
        s.fertig && s.wert === null ? 'FEHLER' : null);
    }
    await rendere(createElement(Sonde));
    expect(text()).toContain('FEHLER');
    const vorher = kantenAufrufe(f);
    netzDa = true;
    await klick(erneutKnoepfe()[0]);
    expect(kantenAufrufe(f)).toBeGreaterThan(vorher);
    expect(text()).toContain('Titel A');
    expect(text()).not.toContain('FEHLER');
  });
});

// ─── P1 · Verweis-Popover ───────────────────────────────────────────────────
describe('P1 · Verweis-Popover (kontextFuerArtikel / VerweisKontext)', () => {
  const popover = () => createElement(MemoryRouter, null,
    createElement(VerweisKontext, { erlassKey: 'ARG', artikel: '6', artikelZitat: 'Art. 6 ARG' }));

  it('kontextFuerArtikel: Shard-Netzfehler ⇒ materialienFehler; 404 ⇒ keiner', async () => {
    stubFetch({ '/materialien/register.json': { status: 200, body: MANIFEST }, '/materialien/kanten/ARG.json': 'netz' });
    expect((await kontextFuerArtikel('ARG', '6')).materialienFehler).toBe(true);
    _leereKantenShardCache();
    stubFetch({ '/materialien/register.json': { status: 200, body: MANIFEST }, '/materialien/kanten/ARG.json': { status: 404 } });
    expect((await kontextFuerArtikel('ARG', '6')).materialienFehler).toBe(false);
  });

  it('Popover zeigt bei Shard-Fehler die Fehlerzeile (nicht nichts); «Erneut laden» holt neu', async () => {
    let netzDa = false;
    const f = stubFetch({
      '/materialien/register.json': { status: 200, body: MANIFEST },
      '/materialien/kanten/ARG.json': () => (netzDa ? { status: 200, body: KOPF('ARG') } : 'netz'),
    });
    await rendere(popover());
    expect(text()).toContain('Amtliche Materialien konnten nicht geladen werden.');
    const vorher = kantenAufrufe(f);
    netzDa = true;
    await klick(erneutKnoepfe()[0]);
    expect(kantenAufrufe(f)).toBeGreaterThan(vorher);
    expect(text()).not.toContain('konnten nicht geladen werden');
    expect(text()).toContain('Titel A');
  });

  it('Popover ohne Shard (404): weiterhin nichts (ruhiger Leerzustand, kein Fehler)', async () => {
    stubFetch({ '/materialien/register.json': { status: 200, body: MANIFEST }, '/materialien/kanten/ARG.json': { status: 404 } });
    await rendere(popover());
    expect(text()).toBe('');
  });
});

// ─── P2 · Dossier des Einzelmodus ───────────────────────────────────────────
describe('P2 · Dossier: Zähler «N Erläuterungen» + gescheitertes Laden', () => {
  const fuss = (extra: Record<string, unknown>) => createElement(MemoryRouter, null,
    createElement(ArtikelBezuegeFuss, {
      verweise: [], werkzeuge: [], zitat: 'Art. 6 ARG', artikel: '6',
      zaehler: { entscheide: 0, materialien: 3 }, materialien: [], ...extra,
    }));
  const blockM = () => ziel.querySelector('[data-dossier-reg="m"]') as unknown as HTMLElement;
  async function oeffneErlaeuterungen() {
    await klick(blockM().querySelector('button[data-reg="m"]')!);
  }

  it('Laden gescheitert: Fehlerzeile mit «Erneut laden» statt leerem Block unter der Zahl', async () => {
    const erneut = vi.fn();
    await rendere(fuss({ materialienLadefehler: erneut }));
    await oeffneErlaeuterungen();
    expect(text()).toContain('3 Erläuterungen'); // die Zahl aus der Zähl-Datei bleibt
    expect(blockM().textContent).toContain('Behördliche Erläuterungen konnten nicht geladen werden.');
    await klick(blockM().querySelector('[data-abruf-erneut]')!);
    expect(erneut).toHaveBeenCalledTimes(1);
  });

  it('kein Fehler, Liste da: Liste wie bisher, keine Fehlerzeile', async () => {
    const mat = [{ key: 'DOK-A', titel: 'Titel A', behoerdeKuerzel: 'SECO', doktypLabel: 'Wegleitung', pfad: '/materialien/DOK-A', herkunft: 'amtlich', stand: '2025-01-01', nummer: null }];
    await rendere(fuss({ materialien: mat }));
    await oeffneErlaeuterungen();
    expect(blockM().textContent).toContain('Titel A');
    expect(blockM().textContent).not.toContain('konnten nicht geladen werden');
  });

  it('Verdrahtung Hook → Dossier: Shard-Fehler im Hook wird zur Fehlerzeile, «Erneut laden» heilt', async () => {
    let netzDa = false;
    stubFetch({
      '/materialien/register.json': { status: 200, body: MANIFEST },
      '/materialien/kanten/ARG.json': () => (netzDa ? { status: 200, body: KOPF('ARG') } : 'netz'),
    });
    // So verdrahtet `LeserLesespalte` es im Einzelmodus (`einzel && unsicher ? erneut : undefined`).
    function Sonde() {
      const [nachschlag, unsicher, erneut] = useArtikelMaterialien('ARG', true);
      return fuss({ materialien: nachschlag('6'), materialienLadefehler: unsicher ? erneut : undefined });
    }
    await rendere(createElement(Sonde));
    await oeffneErlaeuterungen();
    expect(blockM().textContent).toContain('konnten nicht geladen werden');
    netzDa = true;
    await klick(blockM().querySelector('[data-abruf-erneut]')!);
    expect(text()).toContain('Titel A');
  });

  it('LeserLesespalte reicht die Prop nur im Einzelmodus und nur bei Ausfall (Quellsonde)', () => {
    const q = readFileSync(resolve(import.meta.dirname ?? '.', '../pages/gesetz-leser/v3/LeserLesespalte.tsx'), 'utf8');
    expect(q).toMatch(/materialienLadefehler=\{einzel && materialienUnsicher \? materialienErneut : undefined\}/);
  });
});

// ─── P3 · Praxis-Zeile ──────────────────────────────────────────────────────
describe('P3 · EntstehungsBlock · Praxis-Fehlerzeile = AbrufFehler + «Erneut laden»', () => {
  const block = () => createElement(EntstehungsBlock, { erlassKey: 'ARG', artikel: '6' });
  const praxis = () => (ziel.querySelector('[data-entstehung-praxis]')?.textContent ?? '').replace(/\s+/g, ' ');

  it('Shard-Fehler: Hausbaustein mit Knopf; Klick holt neu und zeigt den Zählsatz', async () => {
    let netzDa = false;
    const f = stubFetch({ '/materialien/kanten/ARG.json': () => (netzDa ? { status: 200, body: KOPF('ARG') } : 'netz') });
    await rendere(block());
    expect(praxis()).toContain('Praxis-Angaben konnten nicht geladen werden.');
    expect(ziel.querySelectorAll('[data-entstehung-praxis] [data-abruf-erneut]')).toHaveLength(1);
    const vorher = kantenAufrufe(f);
    netzDa = true;
    await klick(ziel.querySelector('[data-entstehung-praxis] [data-abruf-erneut]')!);
    expect(kantenAufrufe(f)).toBeGreaterThan(vorher);
    expect(praxis()).toContain('1 Wegleitung nennt diesen Artikel');
  });

  it('«Erneut laden» einer ANDEREN Fläche (Tafel) heilt auch diese Zeile — ohne eigenen Klick', async () => {
    let netzDa = false;
    stubFetch({
      '/materialien/register.json': { status: 200, body: MANIFEST },
      '/materialien/kanten/ARG.json': () => (netzDa ? { status: 200, body: KOPF('ARG') } : 'netz'),
    });
    function Sonde() {
      const s = useErlaeuterungen('ARG', true);
      return createElement('div', null,
        createElement(EntstehungsBlock, { erlassKey: 'ARG', artikel: '6' }),
        s.fertig && s.wert === null ? createElement('button', { 'data-tafel-erneut': '', onClick: s.erneut }, 'Tafel erneut') : null);
    }
    await rendere(createElement(Sonde));
    expect(praxis()).toContain('konnten nicht geladen werden');
    netzDa = true;
    await klick(ziel.querySelector('[data-tafel-erneut]')!);
    expect(praxis()).toContain('1 Wegleitung nennt diesen Artikel');
    expect(praxis()).not.toContain('konnten nicht geladen werden');
  });

  it('Shard 404 (Erlass ohne Kanten): weiterhin die ehrliche Leerauskunft, kein Knopf', async () => {
    stubFetch({ '/materialien/kanten/ARG.json': { status: 404 } });
    await rendere(block());
    expect(praxis()).toContain('Keine Wegleitung erfasst, die diesen Artikel nennt.');
    expect(erneutKnoepfe()).toHaveLength(0);
  });
});

// ─── Das «Erholt»-Signal des Laders ─────────────────────────────────────────
describe('beiKantenShardErholt — meldet genau die Erholung nach einem Fehlschlag', () => {
  it('fehler → ok: EIN Rückruf; ohne vorherigen Fehler oder nach Abmeldung: keiner', async () => {
    let netzDa = false;
    stubFetch({ '/materialien/kanten/ARG.json': () => (netzDa ? { status: 200, body: KOPF('ARG') } : 'netz') });
    const rueckruf = vi.fn();
    const abmelden = beiKantenShardErholt('ARG', rueckruf);
    expect((await ladeKantenShardErgebnis('ARG')).zustand).toBe('fehler');
    expect(rueckruf).not.toHaveBeenCalled(); // der Fehlschlag selbst ist keine Erholung
    netzDa = true;
    expect((await ladeKantenShardErgebnis('ARG')).zustand).toBe('ok');
    await settle();
    expect(rueckruf).toHaveBeenCalledTimes(1);
    await ladeKantenShardErgebnis('ARG'); // gecacht: kein zweites Signal
    expect(rueckruf).toHaveBeenCalledTimes(1);

    abmelden();
    // Zweiter Erlass: angemeldet und sofort wieder abgemeldet ⇒ kein Rückruf.
    let mwstDa = false;
    stubFetch({ '/materialien/kanten/MWSTG.json': () => (mwstDa ? { status: 200, body: KOPF('MWSTG') } : 'netz') });
    const abgemeldet = vi.fn();
    beiKantenShardErholt('MWSTG', abgemeldet)();
    await ladeKantenShardErgebnis('MWSTG');
    mwstDa = true;
    expect((await ladeKantenShardErgebnis('MWSTG')).zustand).toBe('ok');
    await settle();
    expect(abgemeldet).not.toHaveBeenCalled();
  });
});
