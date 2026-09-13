import { describe, it, expect, beforeEach } from 'vitest';
import {
  ladeTabs, merkeTab, leereTabs, schliesseTab,
  letzterGeschlossener, stelleLetztenWiederHer,
} from '../lib/tabs';

// ── W2·18 Punkt 4 (Fahrplan §4.R) · KEINE STILLEN KAPPUNGS-VERLUSTE ─────────
//
// BELEG 13.9.2026, drei Befunde an derselben Grenze:
//  (a) ZWEI RICHTUNGEN. `ladeTabs` und `stelleLetztenWiederHer` kappten mit
//      `.slice(0, MAX)` (die ERSTEN 50 bleiben), `merkeTab` mit `.slice(-MAX)`
//      (die LETZTEN 50). Welche Reiter ein voller Speicher verliert, hing also
//      davon ab, wer ihn zuletzt angefasst hat.
//  (b) STILLER VERLUST. Das Gekappte fiel ohne Ring-Eintrag weg: ein offenes
//      Dokument verschwand, ohne dass jemand es geschlossen hätte, und
//      Alt+⇧+T brachte es nicht zurück.
//  (c) «ALLE SCHLIESSEN» NUR ZU ZEHN UMKEHRBAR. `leereTabs` legt alle Reiter
//      in den Ring, `schreibeGeschlossene` kappte ihn auf `ZU_MAX = 10` — ab
//      dem elften Reiter war die Geste nicht mehr vollständig rückgängig zu
//      machen.
//
// ROT ZU BEKOMMEN (§6.7, so gefahren): in `lib/tabs` `ladeTabs` und
// `stelleLetztenWiederHer` wieder auf `.slice(0, MAX)` stellen, `merkeTab` auf
// `.slice(-MAX)` ohne `kappeMitRing`, `ZU_MAX` zurück auf 10.

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

/** Direkt in den Speicher schreiben — am Kapp-Pfad der Schreiber vorbei. */
const seed = (n: number) => localStorage.setItem(
  'lexmetrik-tabs', JSON.stringify(Array.from({ length: n }, (_, i) => ({ path: `/rechner/r${i}` }))));

describe('Reiter-Kappung — eine Richtung, nichts fällt still weg (W2·18 Punkt 4)', () => {
  it('(a) ladeTabs kappt wie merkeTab: die ÄLTESTEN fallen', () => {
    seed(60);
    const t = ladeTabs();
    expect(t.length).toBe(50);
    // Vorher blieben r0…r49 stehen (die ersten), obwohl `merkeTab` an
    // derselben Grenze r10…r59 behalten hätte.
    expect(t[0].path).toBe('/rechner/r10');
    expect(t[49].path).toBe('/rechner/r59');
  });

  it('(b) was merkeTab wegkappt, liegt im Ring und lässt sich zurückholen', () => {
    for (let i = 0; i < 51; i++) merkeTab(`/rechner/r${i}`);
    expect(ladeTabs().map((t) => t.path)).not.toContain('/rechner/r0');
    expect(letzterGeschlossener()?.path).toBe('/rechner/r0');
    const wieder = stelleLetztenWiederHer();
    expect(wieder?.path).toBe('/rechner/r0');
    expect(ladeTabs().map((t) => t.path)).toContain('/rechner/r0');
  });

  it('(b) auch die Wiederherstellung kappt vorne, nicht hinten', () => {
    for (let i = 0; i < 50; i++) merkeTab(`/rechner/r${i}`);
    schliesseTab('/rechner/r20');          // Ring: r20, Speicher: 49 Reiter
    merkeTab('/rechner/neu');              // wieder 50 — voll
    stelleLetztenWiederHer();              // r20 zurück ⇒ 51 ⇒ kappen
    const t = ladeTabs();
    expect(t.length).toBe(50);
    expect(t.map((x) => x.path)).toContain('/rechner/r20');
    // Der JÜNGSTE bleibt; vorher warf `.slice(0, MAX)` genau ihn weg.
    expect(t[49].path).toBe('/rechner/neu');
    expect(t[0].path).toBe('/rechner/r1');
  });

  it('(c) «Alle schliessen» ist mit 50 Reitern vollständig umkehrbar', () => {
    for (let i = 0; i < 50; i++) merkeTab(`/rechner/r${i}`);
    const vorher = ladeTabs().map((t) => t.path);
    leereTabs();
    expect(ladeTabs()).toEqual([]);
    for (let i = 0; i < 50; i++) expect(stelleLetztenWiederHer()).not.toBeNull();
    // VOLLSTÄNDIG heisst hier: jeder Reiter ist wieder da, keiner doppelt.
    // Die REIHENFOLGE prüft dieser Fall bewusst nicht — dass
    // `stelleLetztenWiederHer` nach einem «Alle schliessen» verschachtelt
    // einsetzt (r49, r48 … statt r0, r1 …), ist ein eigener, ÄLTERER Defekt
    // der Positions-Regel (er zeigt sich schon bei drei Reitern) und nicht
    // Gegenstand dieses Schritts; er ist im Fahrplan §4.R als Nachtrag vom
    // 13.9.2026 vermerkt. Vor dem Fix kamen nur 10 von 50 Reitern zurück.
    expect([...ladeTabs().map((t) => t.path)].sort()).toEqual([...vorher].sort());
    // Der Ring ist danach leer — jede Karte wurde genau einmal eingelöst.
    expect(letzterGeschlossener()).toBeNull();
  });
});
