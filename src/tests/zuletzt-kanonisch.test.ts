// LESER-NAV · FB O-27 / BG-09 — «Zuletzt verwendet» führt einen umgezogenen Erlass nicht doppelt.
//
// Der Tracker lief vor dem Umzugs-Sprung und merkte die Alt-Adresse (`/gesetze/bund/EMRK`) und
// gleich danach die kanonische (`/gesetze/international/EMRK`): zwei Chips für einen Erlass, und
// ein Bestand mit Alt-Einträgen behielt sie für immer. `merkeBesuch` kanonisiert die Route jetzt
// (dieselbe Funktion wie Panes und Reiter: `kanonisierePfad`, §5) und räumt Alt-Einträge desselben
// Erlasses beim Merken weg.
//
// ROT ZU BEKOMMEN (§6.7): in `lib/zuletztVerwendet.ts` die `kanonisierePfad`-Aufrufe in
// `merkeBesuch` UND `holeZuletzt` entfernen ⇒ (a)–(d) fallen (gemessen 15.10.2026). Das Lesen allein sichert
// `zuletzt-kanonisch-lesen.test.ts` (Alt-Bestand ohne neuen Besuch).
import { beforeEach, describe, expect, it } from 'vitest';
import { holeZuletzt, merkeBesuch } from '../lib/zuletztVerwendet';
import { kanonisierePfad } from '../lib/normtext/erlassAdresse';

const ALT = '/gesetze/bund/EMRK';
const NEU = '/gesetze/international/EMRK';

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

describe('BG-09 · umgezogene Erlass-Adressen im Verlauf', () => {
  it('Voraussetzung: EMRK ist ein umgezogener Erlass (Alt- und Neu-Adresse verschieden)', () => {
    expect(kanonisierePfad(ALT)).toBe(NEU);
    expect(kanonisierePfad(NEU)).toBe(NEU);
  });

  it('(a) Alt-Adresse dann kanonische Adresse: EIN Eintrag, kanonisch', () => {
    merkeBesuch({ route: ALT, titel: 'EMRK' });
    merkeBesuch({ route: NEU, titel: 'EMRK' });
    expect(holeZuletzt().map((e) => e.route)).toEqual([NEU]);
  });

  it('(b) nur die Alt-Adresse: wird kanonisch gespeichert', () => {
    merkeBesuch({ route: ALT, titel: 'EMRK' });
    expect(holeZuletzt().map((e) => e.route)).toEqual([NEU]);
  });

  it('(c) Bestand mit Alt-Eintrag: der kanonische Besuch räumt ihn weg, die Reihenfolge der übrigen bleibt', () => {
    localStorage.setItem('lexmetrik-zuletzt', JSON.stringify([
      { route: '/rechner/tagerechner', titel: 'Fristenrechner', typ: 'rechner', zeit: 2 },
      { route: ALT, titel: 'EMRK', typ: 'gesetz', zeit: 1 },
    ]));
    merkeBesuch({ route: NEU, titel: 'EMRK' });
    expect(holeZuletzt().map((e) => e.route)).toEqual([NEU, '/rechner/tagerechner']);
  });

  it('(d) Query und Anker überleben (Reiter-Instanz ?r, Fundstelle)', () => {
    merkeBesuch({ route: `${ALT}?r=2`, titel: 'EMRK' });
    expect(holeZuletzt().map((e) => e.route)).toEqual([`${NEU}?r=2`]);
  });

  it('(e) Gegenprobe: ein nicht umgezogener Erlass und Nicht-Erlass-Routen bleiben unverändert', () => {
    merkeBesuch({ route: '/gesetze/bund/OR', titel: 'OR' });
    merkeBesuch({ route: '/rechner/tagerechner', titel: 'Fristenrechner' });
    expect(holeZuletzt().map((e) => e.route)).toEqual(['/rechner/tagerechner', '/gesetze/bund/OR']);
  });
});
