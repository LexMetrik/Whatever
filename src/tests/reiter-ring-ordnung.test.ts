import { describe, it, expect, beforeEach } from 'vitest';
import {
  ladeTabs, merkeTab, schliesseTab, leereTabs, schliesseAndere, schliesseRechtsVon,
  stelleLetztenWiederHer, letzterGeschlossener,
} from '../lib/tabs';

// ── W2·18 Welle 2 Punkt 4 (Fahrplan §4.R2) · DIE RÜCKFAHRKARTE HÄLT DIE
//    REIHENFOLGE ─────────────────────────────────────────────────────────────
//
// GEMESSEN 13.9.2026 (Nachtrag aus Welle 1): «Alle schliessen» mit drei
// Reitern [a, b, c] und dreimal Wiederherstellen ergab [a, c, b] — bei fünfzig
// Reitern setzte die Geste verschachtelt ein (r49, r48 … statt r0, r1 …). Die
// Leiste kam also zurück, aber in einer Ordnung, die es nie gab; wer seine
// Reiter nach Arbeitsgang sortiert hatte, musste neu sortieren.
//
// URSACHE: der Ring ist ein Stapel (jüngster zuletzt, `stelleLetztenWiederHer`
// nimmt hinten). Wer eine GANZE Leiste hineinlegt, muss sie darum VERKEHRT
// herum hineinlegen — sonst kommt der hinterste Reiter zuerst zurück, landet
// mangels Nachbarn vorn, und jeder weitere schiebt sich davor.
//
// ROT ZU BEKOMMEN (§6.7, so gefahren): in `lib/tabs.merkeGeschlossen` die
// Sortierung `sort((a, b) => b.index - a.index)` entfernen.

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

const pfade = () => ladeTabs().map((t) => t.path);
const oeffne = (...p: string[]) => p.forEach((x) => merkeTab(x));

describe('Ring-Ordnung nach Mehrfach-Schliessen (W2·18 Welle 2, Punkt 4)', () => {
  it('«Alle schliessen» + 3× Wiederherstellen ⇒ Ur-Reihenfolge', () => {
    oeffne('/a', '/b', '/c');
    leereTabs();
    expect(pfade()).toEqual([]);
    // Zurück kommt der VORDERSTE zuerst — und jeder weitere landet dahinter.
    expect(stelleLetztenWiederHer()?.path).toBe('/a');
    expect(pfade()).toEqual(['/a']);
    expect(stelleLetztenWiederHer()?.path).toBe('/b');
    expect(pfade()).toEqual(['/a', '/b']);
    expect(stelleLetztenWiederHer()?.path).toBe('/c');
    expect(pfade()).toEqual(['/a', '/b', '/c']);
  });

  it('auch bei zehn Reitern, wo der Fehler am teuersten war', () => {
    const zehn = Array.from({ length: 10 }, (_, i) => `/r${i}`);
    oeffne(...zehn);
    leereTabs();
    for (let i = 0; i < 10; i += 1) stelleLetztenWiederHer();
    expect(pfade()).toEqual(zehn);
  });

  it('«Rechts davon schliessen» + Wiederherstellen ⇒ Ur-Reihenfolge', () => {
    oeffne('/a', '/b', '/c', '/d');
    schliesseRechtsVon('/a');
    expect(pfade()).toEqual(['/a']);
    stelleLetztenWiederHer();
    stelleLetztenWiederHer();
    stelleLetztenWiederHer();
    expect(pfade()).toEqual(['/a', '/b', '/c', '/d']);
  });

  it('«Alle anderen schliessen» + Wiederherstellen ⇒ Ur-Reihenfolge', () => {
    oeffne('/a', '/b', '/c');
    schliesseAndere('/b');
    expect(pfade()).toEqual(['/b']);
    stelleLetztenWiederHer();
    stelleLetztenWiederHer();
    expect(pfade()).toEqual(['/a', '/b', '/c']);
  });

  it('die Beschriftung nennt den, der als NÄCHSTES zurückkommt', () => {
    oeffne('/a', '/b', '/c');
    leereTabs();
    expect(letzterGeschlossener()?.path).toBe('/a');
    stelleLetztenWiederHer();
    expect(letzterGeschlossener()?.path).toBe('/b');
  });

  it('die Einzelschliessung bleibt, wie sie war (Regression M3)', () => {
    oeffne('/a', '/b', '/c');
    schliesseTab('/b');
    expect(pfade()).toEqual(['/a', '/c']);
    expect(stelleLetztenWiederHer()?.path).toBe('/b');
    expect(pfade()).toEqual(['/a', '/b', '/c']);
  });

  it('nacheinander geschlossene Einzel-Reiter kommen jüngster zuerst zurück', () => {
    oeffne('/a', '/b', '/c');
    schliesseTab('/a');
    schliesseTab('/c');
    // Das ist KEIN Stapel-Wechsel: zwei Gesten, zwei Rückfahrkarten, die
    // jüngere zuerst — nur INNERHALB einer Geste zählt die Position.
    expect(stelleLetztenWiederHer()?.path).toBe('/c');
    expect(stelleLetztenWiederHer()?.path).toBe('/a');
    expect(pfade()).toEqual(['/a', '/b', '/c']);
  });
});
