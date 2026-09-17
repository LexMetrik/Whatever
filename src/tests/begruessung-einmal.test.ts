import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waehleBegruessung } from '../lib/begruessungen';

// ─── Einmal-Übernahme des vorgemalten Grusses (Nachzug #899, 17.9.2026) ─────
//
// Befund Gegenprüfung: `window.__lexmetrikGruss` bleibt für die ganze
// Tab-Lebensdauer stehen (das Inline-Skript läuft nur beim Parser-Laden);
// jeder spätere Mount übernahm ihn — eingefrorener Gruss bei SPA-Rückweg auf
// «/» und im zweiten Pane. Zusage jetzt: GENAU ein Mount (der erste) besitzt
// den vorgemalten Gruss; derselbe Mount bekommt ihn bei wiederholtem
// Initializer-Aufruf (StrictMode) wieder; jeder weitere Mount zieht frisch.
//
// vitest läuft in `node` (kein jsdom): `window`/`document` minimal gestubbt,
// das Modul je Fall frisch geladen (Modul-Zustand = Besitz).

const VORGEMALT = 'Vorgemalter Gruss';

async function frischesModul() {
  vi.resetModules();
  return import('../components/start/Begruessung');
}

describe('anfangsGruss — Einmal-Übernahme', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { __lexmetrikGruss: VORGEMALT });
    vi.stubGlobal('document', { querySelector: () => null });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('erster Mount übernimmt den Skript-Gruss, auch bei doppeltem Initializer (StrictMode)', async () => {
    const { anfangsGruss } = await frischesModul();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const mount = {};
    expect(anfangsGruss(mount)).toBe(VORGEMALT);
    expect(anfangsGruss(mount)).toBe(VORGEMALT);
  });

  it('späterer Mount (SPA-Rückweg, zweites Pane) zieht frisch aus der aktuellen Stunde', async () => {
    const { anfangsGruss } = await frischesModul();
    expect(anfangsGruss({})).toBe(VORGEMALT);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-07T23:40:00'));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const zweiter = anfangsGruss({});
    expect(zweiter).toBe(waehleBegruessung(23, () => 0));
    expect(zweiter).not.toBe(VORGEMALT);
  });

  it('ohne Skript-Gruss und ohne prerenderte h1 zieht auch der erste Mount selbst — und besitzt diesen Wert', async () => {
    vi.stubGlobal('window', {});
    const { anfangsGruss } = await frischesModul();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-07T08:15:00'));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const mount = {};
    const erster = anfangsGruss(mount);
    expect(erster).toBe(waehleBegruessung(8, () => 0));
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(anfangsGruss(mount)).toBe(erster);
  });
});
