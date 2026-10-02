// @vitest-environment node
/**
 * W2·17-UI-BEFUNDE · BG-02 / BG-03 / BG-04 (Finder-Bug-Check G, 2.10.2026) —
 * ein Ausfall eines BEGLEIT-Sidecars ist kein «leer»:
 *   BG-02  `currency.json`        → «nächste Fassung ab …», Prüfdatum, «seit … gilt
 *                                    eine neuere Fassung» verschwanden still
 *   BG-03  `kanton-luecken.json`  → der «Nicht vollständig erfasst»-Hinweis fehlte
 *   BG-04  Struktur-Sidecar       → Gliederung und Überschriften fehlten
 * Vorzustand: `browse.ts` cachte den Fehlschlag als `{}`/`null` bis zum
 * Neuladen des Tabs, der Leser sagte nichts. Jetzt: nicht gecacht, ausgewiesen
 * (`Teilausfall`, Titelblatt) und mit «Erneut laden» wiederholbar.
 *
 * ECHTE Effekt-Ausführung (linkedom + `createRoot` + `act`, Muster von
 * `leser-ladefehler-w217.test.tsx`); frisches Modul je Fall.
 *
 * WECHSELWIRKUNG #1267: `null` im Struktur-Sidecar bleibt für den Tieflink-Sprung
 * «entschieden» (`useStrukturEntschieden` nimmt das lenient `ladeStruktur`); dass
 * der Sprung nicht hängt, sichert `tieflink-*`/e2e — hier nur die Lader-Seite.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseHTML } from 'linkedom';
import { renderToStaticMarkup } from 'react-dom/server';
import type { NavigateFunction } from 'react-router-dom';
import type { useMeldeInhaltsKopf } from '../components/layout/InhaltsKopfKontext';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { Teilausfall } from '../pages/gesetz-leser/inhalt-zustand';

type MeldeKopf = ReturnType<typeof useMeldeInhaltsKopf>;
type GlobalPatch = Record<string, unknown>;

const ZH = { key: 'ZH-101', ebene: 'kanton', kuerzel: 'ZH-101', titel: 'Test', datei: 'kanton/ZH-101.json', status: 'geprueft', quelleUrl: 'https://www.zh.ch/101' };
const OR = { key: 'OR', ebene: 'bund', kuerzel: 'OR', titel: 'Obligationenrecht', datei: 'bund/OR.json', status: 'geprueft', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de' };
const REGISTER = { erlasse: [OR, ZH] };
const CURRENCY = { OR: { geprueftAm: '2026-10-01', naechsteFassungAb: '2027-01-01' } };
const LUECKEN = { erlasse: { 'ZH-101': { quelleUrl: 'https://www.zh.ch/101', erlass: 'Test', hinweise: ['Anhang vom §-Parser NICHT erfasst'] } } };
const STRUKTUR = { artikel: { '1': { gliederung: [] } }, kopf: { titel: 'Test' } };

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as unknown as Response;
const fehler = (code: number) => ({ ok: false, status: code, json: async () => ({}) }) as unknown as Response;

/** Je Sidecar eine Antwort-Funktion; der Aufrufer zählt Versuche selbst. */
type Antworten = { currency: () => Response; luecken: () => Response; struktur: () => Response };

async function montiere(ebene: 'bund' | 'kanton', schluessel: string, antworten: Antworten) {
  vi.resetModules();
  const { window, document } = parseHTML('<!doctype html><html><body><div id="root"></div></body></html>');
  (globalThis as GlobalPatch).window = window;
  (globalThis as GlobalPatch).document = document;
  (globalThis as GlobalPatch).fetch = vi.fn(async (url: string) => {
    const u = String(url);
    if (u.endsWith('/normtext/register.json')) return ok(REGISTER);
    if (u.endsWith('/normtext/currency.json')) return antworten.currency();
    if (u.endsWith('/normtext/kanton-luecken.json')) return antworten.luecken();
    if (u.includes('/struktur/')) return antworten.struktur();
    if (u.endsWith('.json') && u.includes('/normtext/')) return ok({ eintraege: [{ artikel: '1' }] });
    return fehler(404);
  });

  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { act } = React as unknown as { act: (fn: () => void | Promise<void>) => Promise<void> };
  const { useLeserDaten } = await import('../pages/gesetz-leser/inhalt-hooks');

  const setCurrency = vi.fn();
  const setStruktur = vi.fn();
  const setKopf = vi.fn();
  const setKantonLuecken = vi.fn();
  const setTeilausfall = vi.fn();
  function Harness() {
    useLeserDaten({
      ebene, schluessel, navigate: (() => {}) as unknown as NavigateFunction, erlass: null, istSekundaer: false,
      meldeInhaltsKopf: (() => {}) as unknown as MeldeKopf,
      setManifest: () => {}, setCurrency, setStruktur, setKopf,
      setKantonSys: () => {}, setKantonLuecken, setErlass: () => {}, setEintraege: () => {},
      setFehler: () => {}, setTeilausfall,
    });
    return null;
  }
  const root = createRoot(document.getElementById('root') as unknown as Element);
  const lasse = async () => { for (let i = 0; i < 6; i++) await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
  await act(async () => { root.render(React.createElement(Harness)); });
  await lasse();
  const letzter = () => setTeilausfall.mock.calls.at(-1)?.[0] as Teilausfall | null | undefined;
  const erneut = async () => { await act(async () => { letzter()?.erneut(); }); await lasse(); };
  return { setCurrency, setStruktur, setKopf, setKantonLuecken, setTeilausfall, letzter, erneut, lasse, act, root };
}

afterEach(() => {
  delete (globalThis as GlobalPatch).window;
  delete (globalThis as GlobalPatch).document;
  delete (globalThis as GlobalPatch).fetch;
});

const heil: Antworten = { currency: () => ok(CURRENCY), luecken: () => ok(LUECKEN), struktur: () => ok(STRUKTUR) };

describe('useLeserDaten — Begleit-Sidecars: Ausfall ≠ leer, wiederholbar', () => {
  it('alles da: kein Teilausfall (letzter Stand null/unverändert)', async () => {
    const m = await montiere('bund', 'OR', heil);
    expect(m.letzter() ?? null).toBeNull();
    expect(m.setCurrency).toHaveBeenLastCalledWith(CURRENCY);
    expect(m.setStruktur).toHaveBeenLastCalledWith(STRUKTUR.artikel);
    expect(m.setKopf).toHaveBeenLastCalledWith(STRUKTUR.kopf);
  });

  it('BG-02: currency 503 → Ausfall «fassung», currency löst trotzdem auf ({}); «Erneut laden» holt neu und trifft', async () => {
    let versuch = 0;
    const m = await montiere('bund', 'OR', { ...heil, currency: () => (++versuch === 1 ? fehler(503) : ok(CURRENCY)) });
    expect(m.letzter()?.teile).toEqual(['fassung']);
    expect(m.setCurrency).toHaveBeenLastCalledWith({}); // FruehAnsicht wartet nicht auf den Platzhalter
    await m.erneut();
    expect(m.letzter() ?? null).toBeNull(); // Ausfall gelöst
    expect(m.setCurrency).toHaveBeenLastCalledWith(CURRENCY); // «nächste Fassung ab …» ist da
    expect(versuch).toBe(2);
  });

  it('BG-02: currency 404 (kaputte Auslieferung) ist ebenfalls ein Ausfall, kein «keine Fassungsangaben»', async () => {
    const m = await montiere('bund', 'OR', { ...heil, currency: () => fehler(404) });
    expect(m.letzter()?.teile).toEqual(['fassung']);
  });

  it('BG-03: kanton-luecken Netzfehler → Ausfall «luecken»; Neuversuch bringt den Lücken-Hinweis', async () => {
    let versuch = 0;
    const m = await montiere('kanton', 'ZH-101', { ...heil, luecken: () => { if (++versuch === 1) throw new Error('Netz'); return ok(LUECKEN); } });
    expect(m.letzter()?.teile).toEqual(['luecken']);
    expect(m.setKantonLuecken).not.toHaveBeenCalled();
    await m.erneut();
    expect(m.letzter() ?? null).toBeNull();
    expect(m.setKantonLuecken).toHaveBeenLastCalledWith(LUECKEN.erlasse);
  });

  it('BG-03: für den Bund wird kanton-luecken gar nicht erst geholt (§15) — kein Ausfall', async () => {
    const m = await montiere('bund', 'OR', { ...heil, luecken: () => fehler(500) });
    expect(m.letzter() ?? null).toBeNull();
  });

  it('BG-04: Struktur-Sidecar 500 → Ausfall «struktur», struktur/kopf bleiben ungesetzt; Neuversuch bringt beide', async () => {
    let versuch = 0;
    const m = await montiere('bund', 'OR', { ...heil, struktur: () => (++versuch === 1 ? fehler(500) : ok(STRUKTUR)) });
    expect(m.letzter()?.teile).toEqual(['struktur']);
    expect(m.setStruktur).not.toHaveBeenCalled();
    await m.erneut();
    expect(m.letzter() ?? null).toBeNull();
    expect(m.setStruktur).toHaveBeenLastCalledWith(STRUKTUR.artikel);
    expect(m.setKopf).toHaveBeenLastCalledWith(STRUKTUR.kopf);
  });

  it('BG-04: Struktur-Sidecar 404 ist KEIN Ausfall (rund 146 Erlasse haben bewusst keine Gliederung)', async () => {
    const m = await montiere('bund', 'OR', { ...heil, struktur: () => fehler(404) });
    expect(m.letzter() ?? null).toBeNull();
    expect(m.setStruktur).toHaveBeenLastCalledWith(null);
  });

  it('mehrere Ausfälle zugleich: ein Zustand mit allen Teilen in fester Reihenfolge, ein «Erneut laden» holt alle', async () => {
    let n = 0;
    const m = await montiere('kanton', 'ZH-101', {
      currency: () => (n++ < 3 ? fehler(503) : ok(CURRENCY)),
      luecken: () => (n++ < 3 ? fehler(503) : ok(LUECKEN)),
      struktur: () => (n++ < 3 ? fehler(503) : ok(STRUKTUR)),
    });
    expect(m.letzter()?.teile).toEqual(['fassung', 'luecken', 'struktur']);
    await m.erneut();
    expect(m.letzter() ?? null).toBeNull();
    expect(m.setCurrency).toHaveBeenLastCalledWith(CURRENCY);
    expect(m.setKantonLuecken).toHaveBeenLastCalledWith(LUECKEN.erlasse);
    expect(m.setStruktur).toHaveBeenLastCalledWith(STRUKTUR.artikel);
  });

  it('scheitert der Neuversuch erneut, steht der Ausfall wieder (kein stilles Verschwinden)', async () => {
    const m = await montiere('bund', 'OR', { ...heil, currency: () => fehler(503) });
    await m.erneut();
    expect(m.letzter()?.teile).toEqual(['fassung']);
  });

  it('nach Unmount schreibt ein spätes «Erneut laden» nichts mehr (kein Leck)', async () => {
    const m = await montiere('bund', 'OR', { ...heil, currency: () => fehler(503) });
    const erneut = m.letzter()!.erneut;
    await m.act(async () => { m.root.unmount(); });
    const anzahl = m.setTeilausfall.mock.calls.length;
    await m.act(async () => { erneut(); });
    await m.lasse();
    expect(m.setTeilausfall.mock.calls.length).toBe(anzahl);
  });
});

describe('browse.ts — Sidecars cachen keinen Fehlschlag (BG-02/03)', () => {
  async function browse() { vi.resetModules(); return import('../lib/normtext/browse'); }

  it('ladeCurrency: 503 wirft und fällt aus dem Cache; Erfolg danach bleibt gecacht (ein Fetch)', async () => {
    let ruf = 0;
    const f = vi.fn(async () => (++ruf === 1 ? fehler(503) : ok(CURRENCY)));
    vi.stubGlobal('fetch', f);
    const b = await browse();
    await expect(b.ladeCurrency()).rejects.toThrow(/503/);
    await expect(b.ladeCurrency()).resolves.toEqual(CURRENCY);
    await b.ladeCurrency();
    expect(f).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it('ladeKantonLuecken: Netzfehler wirft und wird nicht gecacht', async () => {
    let ruf = 0;
    vi.stubGlobal('fetch', vi.fn(async () => { if (++ruf === 1) throw new Error('Netz'); return ok(LUECKEN); }));
    const b = await browse();
    await expect(b.ladeKantonLuecken()).rejects.toThrow('Netz');
    await expect(b.ladeKantonLuecken()).resolves.toEqual(LUECKEN.erlasse);
    vi.unstubAllGlobals();
  });

  it('ladeKantonLuecken: Datei ohne «erlasse» = {} (gültig, kein Fehler)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok({})));
    const b = await browse();
    await expect(b.ladeKantonLuecken()).resolves.toEqual({});
    vi.unstubAllGlobals();
  });

  it('ladeKantonSystematik: liefert bei Fehler {} (Aufrufer unverändert), aber der nächste Aufruf versucht neu', async () => {
    let ruf = 0;
    const baum = { ZH: { knoten: [] } };
    vi.stubGlobal('fetch', vi.fn(async () => (++ruf === 1 ? fehler(500) : ok(baum))));
    const b = await browse();
    await expect(b.ladeKantonSystematik()).resolves.toEqual({});
    await expect(b.ladeKantonSystematik()).resolves.toEqual(baum);
    vi.unstubAllGlobals();
  });
});

describe('ErlassLeserKopf — der Ausfall steht im Titelblatt, mit «Erneut laden»', () => {
  const erlass = { ...OR, sr: '220', stand: '2026-01-01', status: 'snapshot' } as unknown as BrowseErlass;
  const render = async (ladeAusfall: Teilausfall | null | undefined) => {
    vi.resetModules();
    const { ErlassLeserKopf } = await import('../pages/gesetz-leser/parts/ErlassLeserKopf');
    return renderToStaticMarkup(
      <ErlassLeserKopf erlass={erlass} overline="Bund" artikelAnzahl={12} hinweis="Kopie — massgeblich ist die amtliche Fassung" ladeAusfall={ladeAusfall} />,
    );
  };

  it('Fassungsausfall: Satz, «Erneut laden», Link auf die amtliche Fassung (§8: Ausweg)', async () => {
    const h = await render({ teile: ['fassung'], erneut: () => {} });
    expect(h).toContain('Fassungsangaben konnten nicht geladen werden.');
    expect(h).toContain('Erneut laden');
    expect(h).toContain('data-leser-teilausfall="fassung"');
    expect(h).toContain('href="https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de"');
  });

  it('drei Teile: deutscher Aufzählungssatz «a, b und c»', async () => {
    const h = await render({ teile: ['fassung', 'luecken', 'struktur'], erneut: () => {} });
    expect(h).toContain('Fassungsangaben, Angaben zu nicht erfassten Teilen und Gliederung und Überschriften konnten nicht geladen werden.');
  });

  it('nur Gliederung: eigener Satz', async () => {
    expect(await render({ teile: ['struktur'], erneut: () => {} })).toContain('Gliederung und Überschriften konnten nicht geladen werden.');
  });

  it('ohne Ausfall (null/undefined): keine Zeile, kein «Erneut laden»', async () => {
    for (const a of [null, undefined]) {
      const h = await render(a);
      expect(h).not.toContain('konnten nicht geladen werden');
      expect(h).not.toContain('Erneut laden');
    }
  });
});
