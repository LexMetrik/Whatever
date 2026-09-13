import { describe, it, expect, beforeEach } from 'vitest';
import {
  ladeTabs, merkeTab, schliesseTab, leereTabs, schliesseAndere, schliesseRechtsVon,
  ordneTabsUm, hefteAn, loeseAb, festeZone, zugErlaubt, istFest,
  stelleLetztenWiederHer,
} from '../lib/tabs';

// ═══ W2·25 · ANHEFTEN (§5a Ziff. 5, Spec FAHRPLAN-DESIGN-IDENTITAET §7) ═════
//
// DIE D16-AUFLAGE IST DER GANZE TEST. Anheften darf KEINE zweite
// Anzeige-Ordnung sein (Fixer 1c hat jede Anzeige-Gruppierung entfernt, weil
// sie das Ziehen einsammelte — `e2e/w224-reiter-umordnen-d16`), sondern muss
// den FLACHEN Speicher umsortieren. Daraus folgen zwei Zusagen, die hier
// stehen und nirgends sonst:
//   (a) angeheftet ⇒ der Reiter steht in der Speicherordnung vorn, und genau
//       die zeigt die Arbeitsleiste (`ordnung = tabs`, Reiterleiste.tsx);
//   (b) ein Zug über die Zonengrenze wird ABGELEHNT, nicht stillschweigend
//       korrigiert — `ordneTabsUm` meldet `false` und schreibt nichts.
//
// ROT-PROBE (§6.7, gefahren 13.9.2026 gegen `43a5459ff`): auf HEAD gibt es
// weder `TabEintrag.fest` noch `hefteAn`/`loeseAb`/`festeZone`/`zugErlaubt` —
// die Datei scheitert schon am Import. Der gemessene Rot-Wortlaut steht in der
// Commit-Message.
// WIEDER ROT ZU BEKOMMEN: in `lib/tabs.ts` die Partition in `ladeTabs`
// entfernen (dann fällt (a)) bzw. die Zonenprüfung in `ordneTabsUm` (dann (b)).

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
const feste = () => ladeTabs().filter((t) => t.fest).map((t) => t.path);

/** Drei Reiter, der mittlere angeheftet. */
function dreiMitEinemFesten(): void {
  merkeTab('/gesetze/bund/OR');
  merkeTab('/gesetze/bund/ZGB');
  merkeTab('/rechner/tagerechner');
  hefteAn('/gesetze/bund/ZGB');
}

describe('W2·25 Teil 1 — Anheften sortiert den flachen Speicher um', () => {
  it('Anheften ⇒ Position 0 im flachen Speicher (Wächter der Spec)', () => {
    merkeTab('/gesetze/bund/OR');
    merkeTab('/gesetze/bund/ZGB');
    merkeTab('/rechner/tagerechner');
    hefteAn('/rechner/tagerechner');
    expect(pfade()[0]).toBe('/rechner/tagerechner');
    expect(pfade()).toEqual(['/rechner/tagerechner', '/gesetze/bund/OR', '/gesetze/bund/ZGB']);
  });

  it('der zweite Angeheftete landet ans ENDE der festen Zone, nicht auf 0', () => {
    merkeTab('/gesetze/bund/OR');
    merkeTab('/gesetze/bund/ZGB');
    hefteAn('/gesetze/bund/ZGB');
    hefteAn('/gesetze/bund/OR');
    expect(pfade()).toEqual(['/gesetze/bund/ZGB', '/gesetze/bund/OR']);
    expect(festeZone(ladeTabs())).toBe(2);
  });

  it('`fest` überlebt das Speichern und Lesen; `istFest` liest dieselbe Quelle', () => {
    dreiMitEinemFesten();
    expect(feste()).toEqual(['/gesetze/bund/ZGB']);
    expect(istFest('/gesetze/bund/ZGB')).toBe(true);
    expect(istFest('/gesetze/bund/OR')).toBe(false);
  });

  it('ein korrupt gespeicherter freier Reiter VOR einem festen wird beim Laden geordnet', () => {
    localStorage.setItem('lexmetrik-tabs', JSON.stringify([
      { path: '/rechner/tagerechner' },
      { path: '/gesetze/bund/ZGB', fest: true },
      { path: '/gesetze/bund/OR', fest: true },
      { path: '/vorlagen/nda' },
    ]));
    // Stabile Partition: die feste Zone in ihrer Reihenfolge, dann die freie.
    expect(pfade()).toEqual([
      '/gesetze/bund/ZGB', '/gesetze/bund/OR', '/rechner/tagerechner', '/vorlagen/nda',
    ]);
  });

  it('Lösen setzt den Reiter an den Anfang der FREIEN Zone', () => {
    merkeTab('/gesetze/bund/OR');
    merkeTab('/gesetze/bund/ZGB');
    merkeTab('/rechner/tagerechner');
    hefteAn('/gesetze/bund/ZGB');
    hefteAn('/rechner/tagerechner');
    expect(pfade()).toEqual(['/gesetze/bund/ZGB', '/rechner/tagerechner', '/gesetze/bund/OR']);
    loeseAb('/gesetze/bund/ZGB');
    expect(pfade()).toEqual(['/rechner/tagerechner', '/gesetze/bund/ZGB', '/gesetze/bund/OR']);
    expect(feste()).toEqual(['/rechner/tagerechner']);
  });
});

describe('W2·25 Teil 1 — die Zonengrenze wird sichtbar abgelehnt (D16-Auflage)', () => {
  it('ein freier Reiter vor einen festen: abgelehnt, Ordnung unverändert', () => {
    dreiMitEinemFesten();
    const vorher = pfade();
    expect(zugErlaubt(ladeTabs(), '/rechner/tagerechner', '/gesetze/bund/ZGB', true)).toBe(false);
    expect(ordneTabsUm('/rechner/tagerechner', '/gesetze/bund/ZGB', true)).toBe(false);
    expect(pfade(), 'nichts wurde geschrieben — auch nicht «korrigiert»').toEqual(vorher);
  });

  it('ein fester Reiter hinter einen freien: ebenfalls abgelehnt', () => {
    dreiMitEinemFesten();
    const vorher = pfade();
    expect(zugErlaubt(ladeTabs(), '/gesetze/bund/ZGB', '/rechner/tagerechner', false)).toBe(false);
    expect(ordneTabsUm('/gesetze/bund/ZGB', '/rechner/tagerechner', false)).toBe(false);
    expect(pfade()).toEqual(vorher);
  });

  it('INNERHALB der festen Zone bleibt das Umordnen erlaubt', () => {
    merkeTab('/gesetze/bund/OR');
    merkeTab('/gesetze/bund/ZGB');
    merkeTab('/rechner/tagerechner');
    hefteAn('/gesetze/bund/OR');
    hefteAn('/gesetze/bund/ZGB');
    expect(pfade()).toEqual(['/gesetze/bund/OR', '/gesetze/bund/ZGB', '/rechner/tagerechner']);
    expect(ordneTabsUm('/gesetze/bund/ZGB', '/gesetze/bund/OR', true)).toBe(true);
    expect(pfade()).toEqual(['/gesetze/bund/ZGB', '/gesetze/bund/OR', '/rechner/tagerechner']);
  });

  it('INNERHALB der freien Zone bleibt das Umordnen erlaubt (D16 unberührt)', () => {
    dreiMitEinemFesten();
    merkeTab('/vorlagen/nda');
    expect(ordneTabsUm('/vorlagen/nda', '/gesetze/bund/OR', true)).toBe(true);
    expect(pfade()).toEqual([
      '/gesetze/bund/ZGB', '/vorlagen/nda', '/gesetze/bund/OR', '/rechner/tagerechner',
    ]);
  });

  it('ohne einen einzigen festen Reiter ist JEDER Zug erlaubt (kein Rückschritt gegen D16)', () => {
    merkeTab('/gesetze/bund/OR');
    merkeTab('/rechtsprechung/bs_appellationsgericht_BEZ.2022.42');
    merkeTab('/rechner/tagerechner');
    expect(ordneTabsUm('/rechner/tagerechner', '/gesetze/bund/OR', true)).toBe(true);
    expect(pfade()[0]).toBe('/rechner/tagerechner');
  });
});

describe('W2·25 Teil 1 — feste Reiter überleben die Schliess-Gesten', () => {
  it('«Alle schliessen» lässt die festen stehen und legt nur den Rest in den Ring', () => {
    dreiMitEinemFesten();
    leereTabs();
    expect(pfade()).toEqual(['/gesetze/bund/ZGB']);
    expect(stelleLetztenWiederHer()?.path).toBe('/gesetze/bund/OR');
  });

  it('«Alle anderen schliessen» lässt die festen stehen', () => {
    dreiMitEinemFesten();
    merkeTab('/vorlagen/nda');
    schliesseAndere('/vorlagen/nda');
    expect(pfade()).toEqual(['/gesetze/bund/ZGB', '/vorlagen/nda']);
  });

  it('«Rechts davon schliessen» am festen Reiter lässt die übrigen festen stehen', () => {
    merkeTab('/gesetze/bund/OR');
    merkeTab('/gesetze/bund/ZGB');
    merkeTab('/rechner/tagerechner');
    hefteAn('/gesetze/bund/OR');
    hefteAn('/gesetze/bund/ZGB');
    schliesseRechtsVon('/gesetze/bund/OR');
    expect(pfade()).toEqual(['/gesetze/bund/OR', '/gesetze/bund/ZGB']);
  });

  it('das ausdrückliche Schliessen EINES festen Reiters bleibt möglich (Kontextmenü)', () => {
    dreiMitEinemFesten();
    schliesseTab('/gesetze/bund/ZGB');
    expect(pfade()).toEqual(['/gesetze/bund/OR', '/rechner/tagerechner']);
  });

  it('die MAX-Kappung wirft keinen festen Reiter weg', () => {
    merkeTab('/gesetze/bund/OR');
    hefteAn('/gesetze/bund/OR');
    for (let i = 0; i < 60; i++) merkeTab(`/rechner/r${i}`);
    const t = ladeTabs();
    expect(t.length).toBe(50);
    expect(t[0].path).toBe('/gesetze/bund/OR');
    expect(t[0].fest).toBe(true);
  });
});
