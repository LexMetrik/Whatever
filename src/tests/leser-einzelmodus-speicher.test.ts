import { beforeEach, describe, expect, it, vi } from 'vitest';

// ═══ W2·5m · DIE GEMERKTE LESART IM GETEILTEN LESER-STORE ═══════════════════
//
// Kap. 15.6: «Eine Ansichtswahl, die jeder Seitenaufruf vergisst, ist keine
// Option.» Geprüft wird hier der Speicher — nicht das Bild: fällt das Feld aus
// `speichere()`, ist die Wahl nach dem nächsten Laden weg, und keine e2e-Sonde
// der laufenden Sitzung merkt es.
//
// EIGENE DATEI mit frischem Modul-Import je Fall: der Store liest den Speicher
// EINMAL beim Import (`const start = … lade()`). Ein zweiter Fall in derselben
// Modul-Instanz prüfte den Zustand des ersten, nicht den Bestands-Speicher —
// dieselbe Begründung wie in `leser-optionen-migration.test.ts`.
//
// ROT GEFAHREN (§6.7): `ansicht: aktuellAnsicht` aus `speichere()` entfernt
// ⇒ (b) rot («… to contain "artikel"»); die Whitelist-Zeile in `lade()` durch
// `o.ansicht as LeserModus` ersetzt ⇒ (d) rot (der Fremdwert rutschte durch).

// ── DER SPEICHER IST GESTELLT, NICHT GELIEHEN ──────────────────────────────
// Das Repo führt bewusst kein `jsdom` (Bundle- und Laufzeit-Kosten für eine
// Handvoll Sonden). Der Store braucht aus dem Browser genau zwei Dinge:
// `localStorage` und `document.documentElement`. Beide werden hier in zwanzig
// Zeilen gestellt — das ist ehrlicher als eine Abhängigkeit, denn so steht
// sichtbar da, WAS der Store von der Umgebung verlangt.
const speicher = new Map<string, string>();
const attribute = new Map<string, string>();
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

const KEY = 'lm.leser.optionen';

async function frischerStore(gespeichert?: Record<string, unknown>) {
  localStorage.clear();
  if (gespeichert) localStorage.setItem(KEY, JSON.stringify(gespeichert));
  vi.resetModules();
  const mod = await import('../pages/gesetz-leser/leserOptionen');
  mod.wendeLeserOptionenAn();
  return mod;
}

describe('W2·5m · die Lesart wird gemerkt', () => {
  beforeEach(() => { localStorage.clear(); });

  it('(a) ohne Speicher gilt «Ganzer Erlass» (F-E3, David 14.9.2026)', async () => {
    const { holeLeserAnsicht } = await frischerStore();
    expect(holeLeserAnsicht()).toBe('erlass');
  });

  it('(b) eine getroffene Wahl überlebt den nächsten Seitenaufruf', async () => {
    const { setzeLeserAnsicht } = await frischerStore();
    setzeLeserAnsicht('artikel');
    expect(localStorage.getItem(KEY)).toContain('"ansicht":"artikel"');
    // Zweiter Aufruf: derselbe Speicher, frisches Modul.
    const roh = JSON.parse(localStorage.getItem(KEY) as string);
    const { holeLeserAnsicht } = await frischerStore(roh);
    expect(holeLeserAnsicht()).toBe('artikel');
  });

  it('(c) ein Bestands-Speicher OHNE das Feld fällt auf die Vorgabe', async () => {
    // Jeder Speicher vor diesem Schritt — die Migration ist die Abwesenheit
    // einer Migration: fehlt das Feld, gilt «Ganzer Erlass» (§8, keine
    // Ansicht, die der Nutzer nie gewählt hat).
    const { holeLeserAnsicht } = await frischerStore({
      vermerke: 'fassung', fussRubriken: ['f', 'r'], stand: 2, schrift: 'gross',
    });
    expect(holeLeserAnsicht()).toBe('erlass');
  });

  it('(d) ein fremder Wert rutscht nicht durch (Whitelist wie bei `vermerke`)', async () => {
    const { holeLeserAnsicht } = await frischerStore({ ansicht: 'was-auch-immer', stand: 2 });
    expect(holeLeserAnsicht()).toBe('erlass');
  });

  it('(e) die übrigen Felder bleiben beim Schreiben unberührt (EIN Speicher, §5)', async () => {
    const { setzeLeserAnsicht } = await frischerStore({
      vermerke: 'fussnoten', fussRubriken: ['r'], stand: 2, schrift: 'gross',
    });
    setzeLeserAnsicht('artikel');
    const roh = JSON.parse(localStorage.getItem(KEY) as string);
    expect(roh.vermerke).toBe('fussnoten');
    expect(roh.fussRubriken).toEqual(['r']);
    expect(roh.schrift).toBe('gross');
    expect(roh.ansicht).toBe('artikel');
  });
});
