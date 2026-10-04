// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';

// ─── BG-01 (W2·17-UI-BEFUNDE, 2.10.2026) · GESPERRTER BROWSERSPEICHER ────────
// Chrome «Alle Cookies blockieren» / Safari-Richtlinie: schon das LESEN der
// Eigenschaft `window.localStorage` wirft SecurityError. Gemessen vor dem Fix:
// `holeLesePosition`, `merkeLesePosition`, `holeZuletzt` und der useState-
// Initialisierer der Seitenleiste warfen → weisser Bildschirm.
//
// Hier wird der Zustand nachgestellt (wurfwilliger Getter auf globalThis) und
// geprüft, dass nichts wirft und überall der Default gilt. Der Tor-Test
// `sicherer-speicher-tor.test.ts` hält die Umstellung dauerhaft fest.
//
// ROT ZU BEKOMMEN (§6.7): in `lib/zuletztVerwendet.ts` oder `lesePosition.ts`
// den Zugriff wieder als `typeof localStorage` ausserhalb eines try schreiben,
// oder in `useSeitenleiste.ts` `lokalSpeicher.lies` durch
// `window.localStorage.getItem` ersetzen → je ein Fall unten wird rot.

type Beschreibung = PropertyDescriptor | undefined;
let altLokal: Beschreibung;
let altSitzung: Beschreibung;

function sperren(): void {
  const wirft = { configurable: true, get(): never { throw new DOMException('Failed to read the localStorage property: Access is denied', 'SecurityError'); } };
  Object.defineProperty(globalThis, 'localStorage', wirft);
  Object.defineProperty(globalThis, 'sessionStorage', wirft);
}

beforeEach(() => {
  altLokal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  altSitzung = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  vi.resetModules();
});

afterEach(() => {
  for (const [name, alt] of [['localStorage', altLokal], ['sessionStorage', altSitzung]] as const) {
    if (alt) Object.defineProperty(globalThis, name, alt);
    else delete (globalThis as Record<string, unknown>)[name];
  }
  vi.unstubAllGlobals();
});

describe('sichererSpeicher: wirft nie', () => {
  it('gesperrt (Getter wirft): lies → null, schreib/entferne → false, schluessel → []', async () => {
    sperren();
    const { lokalSpeicher, sitzungsSpeicher } = await import('../lib/sichererSpeicher');
    for (const s of [lokalSpeicher, sitzungsSpeicher]) {
      expect(s.lies('x')).toBeNull();
      expect(s.schreib('x', '1')).toBe(false);
      expect(s.entferne('x')).toBe(false);
      expect(s.schluessel()).toEqual([]);
    }
  });

  it('fehlt (undefined, Prerender-Node): gleiches Verhalten', async () => {
    vi.stubGlobal('localStorage', undefined);
    vi.stubGlobal('sessionStorage', undefined);
    const { lokalSpeicher, sitzungsSpeicher } = await import('../lib/sichererSpeicher');
    expect(lokalSpeicher.lies('x')).toBeNull();
    expect(sitzungsSpeicher.schreib('x', '1')).toBe(false);
  });

  it('Speicher vorhanden aber setItem wirft (Quota): schreib → false, lies funktioniert weiter', async () => {
    const daten = new Map<string, string>([['a', '1']]);
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => daten.get(k) ?? null,
      setItem: () => { throw new DOMException('quota', 'QuotaExceededError'); },
      removeItem: (k: string) => { daten.delete(k); },
      key: (i: number) => [...daten.keys()][i] ?? null,
      get length() { return daten.size; },
    });
    const { lokalSpeicher } = await import('../lib/sichererSpeicher');
    expect(lokalSpeicher.schreib('b', '2')).toBe(false);
    expect(lokalSpeicher.lies('a')).toBe('1');
    expect(lokalSpeicher.schluessel()).toEqual(['a']);
    expect(lokalSpeicher.entferne('a')).toBe(true);
  });

  it('intakter Speicher: Round-Trip, schluessel() ist eine Momentaufnahme', async () => {
    const daten = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => daten.get(k) ?? null,
      setItem: (k: string, v: string) => { daten.set(k, v); },
      removeItem: (k: string) => { daten.delete(k); },
      key: (i: number) => [...daten.keys()][i] ?? null,
      get length() { return daten.size; },
    });
    const { lokalSpeicher } = await import('../lib/sichererSpeicher');
    expect(lokalSpeicher.schreib('p:1', 'x')).toBe(true);
    expect(lokalSpeicher.schreib('p:2', 'y')).toBe(true);
    for (const k of lokalSpeicher.schluessel()) lokalSpeicher.entferne(k);
    expect(lokalSpeicher.schluessel()).toEqual([]);
  });
});

describe('Verbraucher bei gesperrtem Speicher: kein Wurf, Default gilt', () => {
  it('Leseposition (BG-01: typeof localStorage ausserhalb try)', async () => {
    sperren();
    const m = await import('../pages/gesetz-leser/lesePosition');
    expect(m.holeLesePosition('OR', 's')).toBeNull();
    expect(() => m.merkeLesePosition({ key: 'OR', token: 'art-41', label: 'Art. 41', stand: 's' })).not.toThrow();
    expect(() => m.vergissLesePosition('OR')).not.toThrow();
  });

  it('Zuletzt-Verlauf (BG-01: hatSpeicher warf selbst)', async () => {
    sperren();
    const m = await import('../lib/zuletztVerwendet');
    expect(m.holeZuletzt()).toEqual([]);
    expect(() => m.merkeBesuch({ route: '/gesetze/bund/OR', titel: 'OR' })).not.toThrow();
    expect(() => m.leereZuletzt()).not.toThrow();
  });

  it('Gliederung-/Blatt-Gedächtnis, Gliederungs-Wahl, Leser-Optionen laden', async () => {
    sperren();
    const g = await import('../pages/gesetz-leser/v3/gliederungGedaechtnis');
    expect(g.gliederungGemerktZu()).toBe(false);
    expect(() => g.merkeGliederung(false)).not.toThrow();
    const b = await import('../pages/gesetz-leser/v3/blattGedaechtnis');
    expect(b.liesBlatt('OR')).toBeNull();
    await expect(import('../pages/gesetz-leser/leserOptionen')).resolves.toBeTruthy();
  });

  it('Seitenleiste (BG-01: useState-Initialisierer warf) rendert mit Standardbreite', async () => {
    sperren();
    vi.stubGlobal('window', globalThis); // sonst greift der SSR-Wächter vor dem Speicherzugriff
    const { useSeitenleiste, BREITE_MIN, BREITE_MAX } = await import('../components/layout/useSeitenleiste');
    let breite = -1;
    function Sonde() {
      breite = useSeitenleiste().breite;
      return null;
    }
    expect(() => renderToString(createElement(Sonde))).not.toThrow();
    expect(breite).toBeGreaterThanOrEqual(BREITE_MIN);
    expect(breite).toBeLessThanOrEqual(BREITE_MAX);
  });
});
