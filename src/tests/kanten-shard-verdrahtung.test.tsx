/**
 * W2·27-BUND-FERTIG · W3-5-Rest (30.9.2026), Gegenprüfung B1/B3 — die
 * VERDRAHTUNG: Kanten-Shard-Lader → Hook → Fläche. `kanten-shard-ladefehler`
 * prüft Lader, Ableitung und Baustein einzeln; hier läuft echtes React.
 *
 *  · B1: `EntstehungsBlock` (Zeile «Praxis», im selben Blatt wie die Artikel-
 *    Gruppen) sagte bei Shard-Fehler «Keine Wegleitung erfasst, die diesen
 *    Artikel nennt.» — eine Aussage über den Bestand, die nie geprüft wurde.
 *  · B3: `usePanelTafeln` zeigte die Fehlerzeile der Artikel-Gruppe auch, wenn
 *    nur das MANIFEST ausfiel — dann meldet `PanelErlaeuterungen` den Ausfall
 *    schon selbst (AN-4): zwei Zeilen, zwei Knöpfe für dieselbe Ursache.
 *  · Ablauf «Erneut laden»: Shard-Fehler → Zeile + Knopf → Klick → neuer Abruf
 *    → Treffer statt Fehler.
 *
 * ROT ZU BEKOMMEN: in `EntstehungsBlock` wieder `ladeKantenShard` nehmen (B1);
 * in `PanelTafeln` `ladefehler` an `artikelMaterialienUnsicher` statt an den
 * Shard-Fehler hängen (B3); `erneut` im Hook nicht an `versuch` koppeln.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EntstehungsBlock } from '../components/entstehung/EntstehungsBlock';
import { usePanelTafeln } from '../pages/gesetz-leser/v3/PanelTafeln';
import { _leereKantenShardCache } from '../lib/materialien/kanten-shard';
import type { NormSnapshot } from '../lib/normtext/typen';

const KANTE = { dok: 'DOK-A', artikel: '6', quelle: 'amtlich', konfidenz: 'regex-hoch', stand: '2025-01-01', fundstellen: [{ z: '1' }] };
const KOPF = { erzeugt: '2026-09-30', erlass: 'ARG', dokumente: { 'DOK-A': { urlBasis: 'https://x', stand: '2025-01-01' } }, kanten: [KANTE] };
const MANIFEST = {
  erzeugt: '2026-09-30',
  materialien: [{ key: 'DOK-A', behoerdeKuerzel: 'SECO', doktypLabel: 'Wegleitung', nummer: null, titel: 'Titel A', stand: '2025-01-01' }],
};

type Antwort = { status: number; body?: unknown } | 'netz';
type Quelle = Antwort | Antwort[] | (() => Antwort);

/** Fetch-Stub je Pfad (Liste = nacheinander, Funktion = je Aufruf neu ausgewertet);
 *  alles Unbekannte ist 404. */
function stubFetch(map: Record<string, Quelle>) {
  const zaehler: Record<string, number> = {};
  const f = vi.fn(async (url: string) => {
    const a0 = map[url];
    const liste = typeof a0 === 'function' ? [a0()] : Array.isArray(a0) ? a0 : [a0];
    const i = Math.min(zaehler[url] ?? 0, liste.length - 1);
    zaehler[url] = (zaehler[url] ?? 0) + 1;
    const a = liste[i] ?? { status: 404 };
    if (a === 'netz') throw new TypeError('Failed to fetch');
    return { ok: a.status >= 200 && a.status < 300, status: a.status, json: async () => a.body } as unknown as Response;
  });
  vi.stubGlobal('fetch', f);
  return f;
}

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
const text = () => (ziel.textContent ?? '').replace(/\s+/g, ' ');

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
  _leereKantenShardCache();
});

// ─── B1 ─────────────────────────────────────────────────────────────────────
describe('EntstehungsBlock · Zeile «Praxis» trennt leer von Ladefehler (B1)', () => {
  const block = () => createElement(EntstehungsBlock, { erlassKey: 'ARG', artikel: '6' });
  const praxis = () => (ziel.querySelector('[data-entstehung-praxis]')?.textContent ?? '').replace(/\s+/g, ' ');

  it('Shard-Abruf scheitert: KEINE «Keine Wegleitung erfasst»-Aussage, sondern der Ladefehler', async () => {
    stubFetch({ '/materialien/kanten/ARG.json': 'netz' });
    await rendere(block());
    expect(praxis()).toContain('konnten nicht geladen werden');
    expect(praxis()).not.toContain('Keine Wegleitung erfasst');
  });

  it('Shard 500 ebenso', async () => {
    stubFetch({ '/materialien/kanten/ARG.json': { status: 500 } });
    await rendere(block());
    expect(praxis()).toContain('konnten nicht geladen werden');
    expect(praxis()).not.toContain('Keine Wegleitung erfasst');
  });

  it('Shard 404 (Erlass ohne Kanten): weiterhin die ehrliche Leerauskunft', async () => {
    stubFetch({ '/materialien/kanten/ARG.json': { status: 404 } });
    await rendere(block());
    expect(praxis()).toContain('Keine Wegleitung erfasst, die diesen Artikel nennt.');
  });

  it('Shard da, Art. 6 genannt: Zählsatz', async () => {
    stubFetch({ '/materialien/kanten/ARG.json': { status: 200, body: KOPF } });
    await rendere(block());
    expect(praxis()).toContain('1 Wegleitung nennt diesen Artikel');
  });
});

// ─── B3 + Ablauf ────────────────────────────────────────────────────────────
describe('usePanelTafeln · Fehlerzeile der Artikel-Gruppe nur beim Shard-Ausfall (B3)', () => {
  function Sonde() {
    const t = usePanelTafeln({
      erlassKey: 'ARG', laden: true, quelleUrl: 'https://www.fedlex.admin.ch/', ebene: 'bund', stichtag: null,
      aktArtikel: '6', artikelLabel: 'Art. 6', blatt: { eintrag: { artikel: '6' } as unknown as NormSnapshot },
      normZitat: 'Art. 6 ARG', wort: 'Artikel',
    });
    return createElement('div', null, t.tafeln.erlaeuterungen);
  }
  const sonde = () => createElement(MemoryRouter, null, createElement(Sonde));
  const gruppeFehler = () => ziel.querySelectorAll('[data-v3-blatt-fehler]');
  const erneutKnoepfe = () => ziel.querySelectorAll('[data-abruf-erneut]');

  it('nur das MANIFEST fällt aus: die Gruppe bleibt ausgeblendet (kein zweiter Fehler, kein zweiter Knopf)', async () => {
    stubFetch({
      '/materialien/kanten/ARG.json': { status: 200, body: KOPF },
      '/materialien/register.json': { status: 500 },
    });
    await rendere(sonde());
    expect(gruppeFehler()).toHaveLength(0);
    expect(text()).not.toContain('nichts erfasst');
    // …und die Artikel-Gruppe trägt keinen eigenen «Erneut laden»-Knopf: den Manifest-
    // Ausfall meldet die Tafel darunter (`PanelErlaeuterungen`, AN-4), nicht die Gruppe.
    expect(erneutKnoepfe()).toHaveLength(0);
  });

  it('Shard fällt aus: Fehlerzeile + «Erneut laden» statt «nichts erfasst»; Klick holt neu', async () => {
    // Zwei Leser fragen den Shard (dieser Hook und die Gesetzgebungs-Tafel über
    // `lib/kontext`) — darum schaltet der Stub den Ausfall per Schalter, nicht per
    // Aufrufzähler.
    let netzDa = false;
    const f = stubFetch({
      '/materialien/kanten/ARG.json': () => (netzDa ? { status: 200, body: KOPF } : 'netz'),
      '/materialien/register.json': { status: 200, body: MANIFEST },
    });
    await rendere(sonde());
    expect(gruppeFehler()).toHaveLength(1);
    expect(text()).toContain('Erläuterungen zu Art. 6 konnten nicht geladen werden.');
    expect(text()).not.toContain('Zu Art. 6 nichts erfasst');
    const knopf = ziel.querySelector('[data-v3-blatt-fehler] [data-abruf-erneut]') as unknown as HTMLElement;
    expect(knopf).toBeTruthy();

    netzDa = true;
    const vorher = f.mock.calls.filter(([u]) => String(u).includes('/materialien/kanten/')).length;
    await act(async () => { knopf.dispatchEvent(new (win as unknown as { Event: typeof Event }).Event('click', { bubbles: true })); });
    await settle();
    const nachher = f.mock.calls.filter(([u]) => String(u).includes('/materialien/kanten/')).length;
    expect(nachher).toBeGreaterThan(vorher); // der Fehlschlag ist nicht gecacht, der Klick versucht es neu
    expect(gruppeFehler()).toHaveLength(0);
    expect(text()).not.toContain('nichts erfasst');
    expect(text()).toContain('Titel A');
  });
});
