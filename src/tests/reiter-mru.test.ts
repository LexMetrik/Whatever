import { describe, it, expect, beforeEach } from 'vitest';
import { merkeAktivenReiter, vorherigerReiter, type TabEintrag } from '../lib/tabs';

// ── W2·18 Welle 2 Punkt 2 (Fahrplan §4.R2) · PENDELN ZWISCHEN ZWEI REITERN ──
//
// GEMESSEN 13.9.2026 am Vorstand `f0ed8859c`: die Leiste kannte NUR die
// Positions-Reihenfolge (Alt+1…9, Alt+Bild↑/↓). Wer zwischen Reiter 2 und
// Reiter 11 hin- und herarbeitet — der Alltag beim Abgleich zweier Erlasse —
// musste die Position kennen und zählen; für Reiter 11 gab es überhaupt kein
// Kürzel (Alt+9 ist der LETZTE). Chrome («Ctrl+Tab in MRU») und VS Code
// («Ctrl+Tab») lösen das über die zuletzt-benutzt-Reihenfolge.
//
// Hier steht die reine Buchführung (§3: die Rechenregel, nicht die Taste).
// Welche Taste sie auslöst und warum, steht in `Reiterleiste.tsx`; dass sie
// im Browser pendelt, misst `e2e/w224-r13-reiter.e2e.ts`.
//
// ROT ZU BEKOMMEN (§6.7, so gefahren): `merkeAktivenReiter`/`vorherigerReiter`
// aus `lib/tabs.ts` entfernen — der Import scheitert, kein Fall läuft.

beforeEach(() => {
  const speicher = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => void speicher.set(k, v),
    removeItem: (k: string) => void speicher.delete(k),
    clear: () => speicher.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
});

const t = (path: string): TabEintrag => ({ path });
const OFFEN = [t('/gesetze/bund/OR'), t('/gesetze/bund/ZGB'), t('/rechner/zpo-fristen')];

describe('MRU-Pendeln (W2·18 Welle 2, Punkt 2)', () => {
  it('ohne Vorgeschichte gibt es kein Ziel — die Taste tut dann nichts', () => {
    expect(vorherigerReiter(OFFEN, '/gesetze/bund/OR')).toBeNull();
    merkeAktivenReiter('/gesetze/bund/OR');
    expect(vorherigerReiter(OFFEN, '/gesetze/bund/OR')).toBeNull();
  });

  it('zwei Reiter pendeln: hin und zurück, beliebig oft', () => {
    merkeAktivenReiter('/gesetze/bund/OR');
    merkeAktivenReiter('/rechner/zpo-fristen');
    // Von «zpo-fristen» führt das Kürzel zurück auf OR …
    const hin = vorherigerReiter(OFFEN, '/rechner/zpo-fristen');
    expect(hin?.path).toBe('/gesetze/bund/OR');
    // … und weil jede Aktivierung die Liste fortschreibt, führt es von dort
    // wieder zurück — das ist das Pendeln (Chrome/VS Code «Ctrl+Tab»).
    merkeAktivenReiter('/gesetze/bund/OR');
    expect(vorherigerReiter(OFFEN, '/gesetze/bund/OR')?.path).toBe('/rechner/zpo-fristen');
    merkeAktivenReiter('/rechner/zpo-fristen');
    expect(vorherigerReiter(OFFEN, '/rechner/zpo-fristen')?.path).toBe('/gesetze/bund/OR');
  });

  it('der zuletzt genutzte zählt, nicht der benachbarte', () => {
    merkeAktivenReiter('/gesetze/bund/ZGB');
    merkeAktivenReiter('/gesetze/bund/OR');
    merkeAktivenReiter('/rechner/zpo-fristen');
    // Nachbar im Streifen wäre ZGB; zuletzt genutzt war OR.
    expect(vorherigerReiter(OFFEN, '/rechner/zpo-fristen')?.path).toBe('/gesetze/bund/OR');
  });

  it('ein inzwischen geschlossener Reiter wird übersprungen, nicht angeboten', () => {
    merkeAktivenReiter('/gesetze/bund/ZGB');
    merkeAktivenReiter('/vorlagen/arbeitsvertrag'); // steht nicht mehr offen
    merkeAktivenReiter('/rechner/zpo-fristen');
    expect(vorherigerReiter(OFFEN, '/rechner/zpo-fristen')?.path).toBe('/gesetze/bund/ZGB');
  });

  it('dieselbe Identität steht genau einmal in der Liste', () => {
    merkeAktivenReiter('/gesetze/bund/ZGB');
    merkeAktivenReiter('/gesetze/bund/OR');
    merkeAktivenReiter('/gesetze/bund/ZGB');
    merkeAktivenReiter('/rechner/zpo-fristen');
    // Stünde ZGB doppelt, wäre der Vorgänger von zpo-fristen ZGB statt OR
    // (der jüngere ZGB-Eintrag hat den älteren zu verdrängen).
    expect(vorherigerReiter(OFFEN, '/rechner/zpo-fristen')?.path).toBe('/gesetze/bund/ZGB');
    expect(JSON.parse(localStorage.getItem('lexmetrik-tabs-mru') ?? '[]'))
      .toEqual(['/gesetze/bund/OR', '/gesetze/bund/ZGB', '/rechner/zpo-fristen']);
  });

  it('die Liste wächst nicht über zehn Einträge', () => {
    for (let i = 0; i < 30; i += 1) merkeAktivenReiter(`/gesetze/bund/E${i}`);
    expect(JSON.parse(localStorage.getItem('lexmetrik-tabs-mru') ?? '[]')).toHaveLength(10);
  });

  it('kaputter Speicher wirft nicht, er zählt als leer', () => {
    localStorage.setItem('lexmetrik-tabs-mru', '{nicht json');
    expect(vorherigerReiter(OFFEN, '/gesetze/bund/OR')).toBeNull();
    merkeAktivenReiter('/gesetze/bund/OR');
    merkeAktivenReiter('/gesetze/bund/ZGB');
    expect(vorherigerReiter(OFFEN, '/gesetze/bund/ZGB')?.path).toBe('/gesetze/bund/OR');
  });
});
