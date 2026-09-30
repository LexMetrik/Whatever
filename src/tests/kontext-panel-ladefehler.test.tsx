/**
 * W2·27-BUND-FERTIG · Ladefehler-Rest (30.9.2026, Folgearbeit zu #1181).
 *
 * #1181 hat Erlass-Tafel, Popover, Dossier und Praxis-Zeile auf den Hausbaustein
 * `AbrufFehler` gebracht. Offen blieben drei Stellen, hier abgesichert:
 *
 *  · R1  `KontextPanel` (Ist-Hülle in inhalt-ansichten/EntscheidLeser) las die
 *        dünne `kontextSoftLaw` und zeigte bei Shard-Fehler still einen Teilbestand.
 *  · R2  `VerweisKontext` (Popover) lud nicht nach, wenn eine ANDERE Fläche den
 *        Shard erholte.
 *  · R3  `ladeErlaeuterungen`: «Manifest-Ausfall ⇒ KEIN `rest`» war ungesichert —
 *        die Mutation `if (!manifest) return { stand: null, rest: {…} }` blieb grün.
 *
 * ROT ZU BEKOMMEN (§6.7):
 *  · R1: in `KontextPanel.tsx` `softLawFehler` fest `false` (oder wieder `kontextSoftLaw`).
 *  · R2: in `VerweisKontext.tsx` den `beiKantenShardErholt`-Effekt streichen.
 *  · R3: in `panelKontextLaden.ladeErlaeuterungen` bei `!manifest` ein `rest` liefern.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KontextPanel } from '../components/kontext/KontextPanel';
import { VerweisKontext } from '../components/kontext/VerweisKontext';
import { PanelErlaeuterungen } from '../pages/gesetz-leser/v3/PanelErlaeuterungen';
import { useErlaeuterungen } from '../pages/gesetz-leser/v3/panelKontextLaden';
import { ladeKantenShardErgebnis, _leereKantenShardCache } from '../lib/materialien/kanten-shard';
import { _leereShardCache } from '../lib/rechtsprechung/norm-index';

// Anmeldungen/Abmeldungen des Erholt-Signals zählen (Durchreicher, Verhalten unverändert).
const abo = vi.hoisted(() => ({ an: 0, ab: 0 }));
vi.mock('../lib/materialien/kanten-shard', async (orig) => {
  const m = await orig<typeof import('../lib/materialien/kanten-shard')>();
  return {
    ...m,
    beiKantenShardErholt: (k: string, r: () => void) => {
      abo.an++;
      const ab = m.beiKantenShardErholt(k, r);
      return () => { abo.ab++; ab(); };
    },
  };
});

const KANTE = { dok: 'DOK-A', artikel: '6', quelle: 'amtlich', konfidenz: 'regex-hoch', stand: '2025-01-01', fundstellen: [{ z: '1' }] };
const KOPF = (erlass: string) => ({ erzeugt: '2026-09-30', erlass, dokumente: { 'DOK-A': { urlBasis: 'https://x', stand: '2025-01-01' } }, kanten: [KANTE] });
const MANIFEST = {
  erzeugt: '2026-09-30',
  materialien: [{ key: 'DOK-A', behoerdeKuerzel: 'SECO', doktypLabel: 'Wegleitung', nummer: null, titel: 'Titel A', stand: '2025-01-01' }],
};

type Antwort = { status: number; body?: unknown } | 'netz';
type Quelle = Antwort | (() => Antwort);

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
const materialFehler = () => ziel.querySelectorAll('[data-kontext-material-fehler]');

afterEach(async () => {
  // Erst unmounten (der Cleanup meldet ab und zählt), DANN die Zähler zurücksetzen —
  // sonst landet die Abmeldung im nächsten Test (Zweitprüfung #1196, Shuffle-Seed 3).
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  abo.an = 0; abo.ab = 0;
  vi.unstubAllGlobals();
  _leereKantenShardCache();
  _leereShardCache();
});

// ─── Manifest-Ausfall ZUERST: `ladeMaterialManifest` cacht nur Erfolge, eine Datei-
// weite Vorbelegung gibt es nicht — vor jedem erfolgreichen Abruf dieser Datei ──
function tafelHelfer() {
  function Tafel() {
    const s = useErlaeuterungen('ARG', true);
    return createElement(MemoryRouter, null, createElement('div', null,
      createElement('span', { 'data-rest': s.rest ? 'ja' : 'nein', 'data-wert': s.wert ? 'ja' : 'nein', 'data-fertig': s.fertig ? 'ja' : 'nein' }),
      createElement(PanelErlaeuterungen, { stand: s })));
  }
  const attr = (n: string) => ziel.querySelector('[data-rest]')!.getAttribute(n);
  return { Tafel, attr };
}
const panelArg = () => createElement(MemoryRouter, null, createElement(KontextPanel, { typ: 'norm', normKeys: ['ARG'] }));

describe('0 · Manifest-Ausfall (vor jedem erfolgreichen Abruf dieser Datei)', () => {
  const { Tafel, attr } = tafelHelfer();
  it('R1 · KontextPanel: Fehlerzeile mit Knopf, nie ein stilles «nichts erfasst»', async () => {
    stubFetch({ '/materialien/register.json': { status: 500 }, '/materialien/kanten/ARG.json': { status: 200, body: KOPF('ARG') } });
    await rendere(panelArg());
    expect(materialFehler()).toHaveLength(1);
    expect(ziel.querySelectorAll('[data-kontext-material-fehler] [data-abruf-erneut]')).toHaveLength(1);
  });

  it('R3 · Manifest 500 (Shard da): weder `rest` noch kuratierte Einträge — «Behördliche Erläuterungen konnten nicht geladen werden»', async () => {
    stubFetch({ '/materialien/register.json': { status: 500 }, '/materialien/kanten/ARG.json': { status: 200, body: KOPF('ARG') } });
    await rendere(createElement(Tafel));
    expect(attr('data-fertig')).toBe('ja');
    expect(attr('data-wert')).toBe('nein');
    expect(attr('data-rest')).toBe('nein');
    expect(text()).toContain('Behördliche Erläuterungen konnten nicht geladen werden.');
    expect(text()).not.toContain('Merkblatt zum Pikettdienst'); // kuratiert, läge im Bundle — ohne Datenstand aber kein Rest (AN-4)
    expect(ziel.querySelectorAll('[data-v3-panel-unvollstaendig]')).toHaveLength(0);
  });

});

// ─── R1 · KontextPanel (Ist-Hülle) ──────────────────────────────────────────
describe('R1 · KontextPanel: Shard-Ausfall ⇒ AbrufFehler + «Erneut laden» statt stillem Teilbestand', () => {
  // ARG führt im MATERIAL_REGISTER kuratierte Einträge (Bundle, kein Netz nötig).
  const panel = panelArg;

  it('Shard 5xx: kuratierter Rest bleibt, dazu Fehlerzeile «Ein Teil …» mit Knopf; Klick holt neu und heilt', async () => {
    let netzDa = false;
    const f = stubFetch({
      '/materialien/register.json': { status: 200, body: MANIFEST },
      '/materialien/kanten/ARG.json': () => (netzDa ? { status: 200, body: KOPF('ARG') } : { status: 503 }),
    });
    await rendere(panel());
    expect(text()).toContain('Merkblatt zum Pikettdienst'); // kuratiert, Bundle
    expect(text()).not.toContain('Titel A');
    expect(text()).toContain('Ein Teil der amtlichen Materialien konnte nicht geladen werden.');
    expect(materialFehler()).toHaveLength(1);
    const vorher = kantenAufrufe(f);
    netzDa = true;
    await klick(ziel.querySelector('[data-kontext-material-fehler] [data-abruf-erneut]')!);
    expect(kantenAufrufe(f)).toBeGreaterThan(vorher);
    expect(text()).toContain('Titel A');
    expect(text()).toContain('Merkblatt zum Pikettdienst');
    expect(materialFehler()).toHaveLength(0);
    expect(text()).not.toContain('Ein Teil der amtlichen Materialien');
  });

  it('Erlass OHNE kuratierte Einträge, Shard scheitert: Voll-Ausfall «Amtliche Materialien konnten …» IN der Gruppe, nicht der Leerzustand', async () => {
    // MWSTV: in KANTEN_ERLASSE, aber ohne Bundle-Einträge/Werkzeuge/Normen ⇒ ohne den Fehler wäre das Panel «leer».
    // typ 'entscheid' (EntscheidLeser): Botschaften/Revisionen/Vernehmlassungen sind norm-only und liefern
    // hier weder Fehler noch Inhalt — sonst verdeckte deren 404-Fehlerzeile die `istLeer`-Bedingung.
    stubFetch({ '/materialien/register.json': { status: 200, body: MANIFEST }, '/materialien/kanten/MWSTV.json': 'netz' });
    await rendere(createElement(MemoryRouter, null, createElement(KontextPanel, { typ: 'entscheid', normKeys: ['MWSTV'] })));
    expect(materialFehler()).toHaveLength(1);
    expect(text()).not.toContain('Noch keine Querverweise'); // istLeer trägt `!softLawFehler`
    const gruppe = ziel.querySelector('[data-kontext-material-fehler]')!.closest('[data-kontext-rolle]')!;
    expect(gruppe.textContent).toContain('Amtliche Materialien');
    expect(gruppe.textContent).toContain('Amtliche Materialien konnten nicht geladen werden.'); // Mehrzahl, kein «Ein Teil»
    expect(gruppe.textContent).not.toContain('Ein Teil der');
    expect(gruppe.textContent).not.toContain('erfasste Behördenpublikationen'); // kein Zähler-Hinweis ohne Liste
  });

  it('Teil-Ausfall: die Fehlerzeile steht in derselben Gruppe wie der kuratierte Rest', async () => {
    stubFetch({ '/materialien/register.json': { status: 200, body: MANIFEST }, '/materialien/kanten/ARG.json': { status: 503 } });
    await rendere(panel());
    const gruppe = ziel.querySelector('[data-kontext-material-fehler]')!.closest('[data-kontext-rolle]')!;
    expect(gruppe.textContent).toContain('Merkblatt zum Pikettdienst');
    expect(gruppe.textContent).toContain('Ein Teil der amtlichen Materialien konnte nicht geladen werden.');
  });

  it('Shard 404 (Erlass ohne Kanten) ist eine ANTWORT: keine Fehlerzeile', async () => {
    stubFetch({ '/materialien/register.json': { status: 200, body: MANIFEST }, '/materialien/kanten/ARG.json': { status: 404 } });
    await rendere(panel());
    expect(materialFehler()).toHaveLength(0);
    expect(text()).toContain('Merkblatt zum Pikettdienst');
  });

  it('eine ANDERE Fläche erholt den Shard ⇒ das Panel lädt ohne eigenen Klick nach', async () => {
    let netzDa = false;
    stubFetch({
      '/materialien/register.json': { status: 200, body: MANIFEST },
      '/materialien/kanten/ARG.json': () => (netzDa ? { status: 200, body: KOPF('ARG') } : 'netz'),
    });
    await rendere(panel());
    expect(materialFehler()).toHaveLength(1);
    netzDa = true;
    await act(async () => { await ladeKantenShardErgebnis('ARG'); });
    await settle();
    expect(materialFehler()).toHaveLength(0);
    expect(text()).toContain('Titel A');
  });

  it('Unmount meldet das Erholt-Abo ab', async () => {
    stubFetch({ '/materialien/register.json': { status: 200, body: MANIFEST }, '/materialien/kanten/ARG.json': 'netz' });
    await rendere(panel());
    expect(abo.an).toBeGreaterThanOrEqual(1);
    expect(abo.ab).toBe(0); // solange gemountet: keine Abmeldung
    const r = root!; root = null;
    await act(async () => r.unmount());
    expect(abo.ab).toBe(abo.an);
  });
});

// ─── R2 · Popover zieht bei «Erholt» nach ───────────────────────────────────
describe('R2 · VerweisKontext: eine ANDERE Fläche erholt den Shard ⇒ Popover lädt ohne Klick nach', () => {
  const popover = () => createElement(MemoryRouter, null,
    createElement(VerweisKontext, { erlassKey: 'ARG', artikel: '6', artikelZitat: 'Art. 6 ARG' }));

  it('Fehlerzeile sichtbar; ein fremder Abruf heilt den Shard ⇒ Liste da, Zeile weg', async () => {
    let netzDa = false;
    stubFetch({
      '/materialien/register.json': { status: 200, body: MANIFEST },
      '/materialien/kanten/ARG.json': () => (netzDa ? { status: 200, body: KOPF('ARG') } : 'netz'),
    });
    await rendere(popover());
    expect(text()).toContain('Amtliche Materialien konnten nicht geladen werden.');
    netzDa = true;
    await act(async () => { await ladeKantenShardErgebnis('ARG'); });
    await settle();
    expect(text()).not.toContain('konnten nicht geladen werden');
    expect(text()).toContain('Titel A');
  });

  it('Unmount meldet das Abo ab', async () => {
    stubFetch({ '/materialien/register.json': { status: 200, body: MANIFEST }, '/materialien/kanten/ARG.json': 'netz' });
    await rendere(popover());
    expect(abo.an).toBeGreaterThanOrEqual(1);
    expect(abo.ab).toBe(0);
    const r = root!; root = null;
    await act(async () => r.unmount());
    expect(abo.ab).toBe(abo.an);
  });
});

// ─── R3 · Manifest-Ausfall ⇒ KEIN `rest` ────────────────────────────────────
describe('R3 · Gegenprobe: Manifest da, Shard scheitert ⇒ `rest` ist da', () => {
  const { Tafel, attr } = tafelHelfer();
  it('Gegenprobe: Manifest da, Shard scheitert ⇒ `rest` IST da (die Unterscheidung trägt)', async () => {
    stubFetch({ '/materialien/register.json': { status: 200, body: MANIFEST }, '/materialien/kanten/ARG.json': 'netz' });
    await rendere(createElement(Tafel));
    expect(attr('data-wert')).toBe('nein');
    expect(attr('data-rest')).toBe('ja');
  });
});
