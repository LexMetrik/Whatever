// LESER-NAV · FB O-27 / BG-09 (Nachzug) — `holeZuletzt` kanonisiert und dedupliziert beim LESEN.
//
// Ein Alt-Bestand, der vor dem Fix geschrieben wurde, kann Alt- UND Neu-Adresse eines umgezogenen
// Erlasses (EMRK) tragen. Ohne neuen Besuch räumt `merkeBesuch` nichts weg — die Chips zeigten
// zwei Einträge für einen Erlass. Beim Lesen gewinnt der neueste (erste) Eintrag.
//
// ROT ZU BEKOMMEN (§6.7): in `lib/zuletztVerwendet.ts` in `holeZuletzt` das `kanonisierePfad` und
// das `.filter((e, i, alle) => …)` entfernen ⇒ (a), (b), (c) fallen.
import { beforeEach, describe, expect, it } from 'vitest';
import { holeZuletzt } from '../lib/zuletztVerwendet';

const ALT = '/gesetze/bund/EMRK';
const NEU = '/gesetze/international/EMRK';
const KEY = 'lexmetrik-zuletzt';

function bestand(eintraege: unknown[]): void {
  localStorage.setItem(KEY, JSON.stringify(eintraege));
}

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

describe('BG-09 · Alt-Bestand beim Lesen', () => {
  it('(a) Alt- und Neu-Adresse im Bestand: EIN Chip, der neueste (erste) gewinnt', () => {
    bestand([
      { route: ALT, titel: 'EMRK neu', typ: 'gesetz', zeit: 3 },
      { route: '/rechner/tagerechner', titel: 'Fristenrechner', typ: 'rechner', zeit: 2 },
      { route: NEU, titel: 'EMRK alt', typ: 'gesetz', zeit: 1 },
    ]);
    const z = holeZuletzt();
    expect(z.map((e) => e.route)).toEqual([NEU, '/rechner/tagerechner']);
    expect(z[0].titel).toBe('EMRK neu');
    expect(z[0].zeit).toBe(3);
  });

  it('(b) nur ein Alt-Eintrag: wird kanonisch gelesen', () => {
    bestand([{ route: ALT, titel: 'EMRK', typ: 'gesetz', zeit: 1 }]);
    expect(holeZuletzt().map((e) => e.route)).toEqual([NEU]);
  });

  it('(c) Randfall: Eintrag ohne typ wird aus der kanonischen Route migriert; Query bleibt', () => {
    bestand([{ route: `${ALT}?r=2`, titel: 'EMRK', zeit: 1 }]);
    const [e] = holeZuletzt();
    expect(e.route).toBe(`${NEU}?r=2`);
    expect(e.typ).toBe('gesetz');
  });

  it('(d) Gegenprobe: verschiedene Instanzen (?r) und nicht umgezogene Erlasse bleiben getrennt', () => {
    bestand([
      { route: '/gesetze/bund/OR', titel: 'OR', typ: 'gesetz', zeit: 3 },
      { route: `${NEU}?r=2`, titel: 'EMRK 2', typ: 'gesetz', zeit: 2 },
      { route: NEU, titel: 'EMRK', typ: 'gesetz', zeit: 1 },
    ]);
    expect(holeZuletzt().map((e) => e.route)).toEqual(['/gesetze/bund/OR', `${NEU}?r=2`, NEU]);
  });

  it('(e) Randfall: leerer oder defekter Bestand', () => {
    expect(holeZuletzt()).toEqual([]);
    localStorage.setItem(KEY, 'kein json');
    expect(holeZuletzt()).toEqual([]);
  });
});
