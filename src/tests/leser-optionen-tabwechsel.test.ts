// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ═══ LESER-NAV · FB O-27 / BG-05 — Lesart-Wechsel in einem ANDEREN Tab ═══════
//
// Tab A speichert «Einzelne Bestimmung». Tab B liest gerade die Gesamtansicht
// (Adresse schweigt zur Lesart) — vor dem Fix übernahm der storage-Hörer die neue
// Lesart live, `modusEntscheid` kippte in den Einzelmodus und zeigte den
// Einstiegsanker (Lesestelle weg). Die Lesart eines anderen Tabs gilt jetzt nur als
// Präferenz für künftige Aufrufe; alle übrigen Optionen synchronisieren weiter live.
//
// ROT ZU BEKOMMEN (§6.7): in `leserOptionen.ts` im storage-Hörer die Zeile
// `aktuellAnsicht = lebend;` entfernen ⇒ (a) fällt; in `speichere()`
// `gemerkteAnsicht` durch `aktuellAnsicht` ersetzen ⇒ (b) fällt.

const speicher = new Map<string, string>();
const attribute = new Map<string, string>();
const hoererSammlung: Array<(e: { key: string | null }) => void> = [];
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => { speicher.set(k, String(v)); },
    removeItem: (k: string) => { speicher.delete(k); },
    clear: () => { speicher.clear(); },
  },
});
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: {
    documentElement: {
      setAttribute: (k: string, v: string) => { attribute.set(k, v); },
      getAttribute: (k: string) => attribute.get(k) ?? null,
    },
  },
});
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    addEventListener: (art: string, fn: (e: { key: string | null }) => void) => { if (art === 'storage') hoererSammlung.push(fn); },
    removeEventListener: () => {},
  },
});

const KEY = 'lm.leser.optionen';

async function frischerStore(gespeichert: Record<string, unknown>) {
  localStorage.clear();
  hoererSammlung.length = 0;
  localStorage.setItem(KEY, JSON.stringify(gespeichert));
  vi.resetModules();
  const mod = await import('../pages/gesetz-leser/leserOptionen');
  mod.wendeLeserOptionenAn();
  return mod;
}

/** Tab A schreibt in den gemeinsamen Speicher; Tab B bekommt das storage-Ereignis. */
function fremderTabSchreibt(felder: Record<string, unknown>) {
  const alt = JSON.parse(localStorage.getItem(KEY) ?? '{}');
  localStorage.setItem(KEY, JSON.stringify({ ...alt, ...felder }));
  for (const f of hoererSammlung) f({ key: KEY });
}

describe('BG-05 · die Lesart eines anderen Tabs wirft den Leser nicht um', () => {
  beforeEach(() => { localStorage.clear(); });

  it('(a) Tab B liest «Ganzer Erlass»: das Ereignis ändert die LIVE-Lesart nicht', async () => {
    const mod = await frischerStore({ ansicht: 'erlass' });
    expect(mod.holeLeserAnsicht()).toBe('erlass');
    fremderTabSchreibt({ ansicht: 'artikel' });
    expect(mod.holeLeserAnsicht()).toBe('erlass');
  });

  it('(b) der Speicher behält die Wahl des anderen Tabs, auch wenn Tab B eine andere Option ändert', async () => {
    const mod = await frischerStore({ ansicht: 'erlass' });
    fremderTabSchreibt({ ansicht: 'artikel' });
    mod.setzeVermerke('fussnoten');
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}').ansicht, 'Tab B überschrieb die Wahl von Tab A mit seinem alten Stand').toBe('artikel');
  });

  it('(c) übrige Optionen synchronisieren weiter live', async () => {
    const mod = await frischerStore({ ansicht: 'erlass', vermerke: 'aus' });
    fremderTabSchreibt({ vermerke: 'fussnoten' });
    expect(attribute.get('data-vermerke')).toBe('fussnoten');
    expect(mod.holeLeserAnsicht()).toBe('erlass');
  });

  it('(d) eine eigene Wahl in Tab B gilt sofort und wird gespeichert — auch wenn sie der Live-Lesart gleicht', async () => {
    const mod = await frischerStore({ ansicht: 'erlass' });
    fremderTabSchreibt({ ansicht: 'artikel' });
    mod.setzeLeserAnsicht('erlass'); // bewusste Wahl: Tab B bleibt bei «Ganzer Erlass»
    expect(mod.holeLeserAnsicht()).toBe('erlass');
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}').ansicht).toBe('erlass');
    mod.setzeLeserAnsicht('artikel');
    expect(mod.holeLeserAnsicht()).toBe('artikel');
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}').ansicht).toBe('artikel');
  });

  it('(e) ein neuer Aufruf (frischer Start) liest die Wahl des anderen Tabs', async () => {
    await frischerStore({ ansicht: 'erlass' });
    fremderTabSchreibt({ ansicht: 'artikel' });
    vi.resetModules();
    const neu = await import('../pages/gesetz-leser/leserOptionen');
    neu.wendeLeserOptionenAn();
    expect(neu.holeLeserAnsicht()).toBe('artikel');
  });
});
