import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MERKLISTE_MAX, dekodiereMerkliste, entferneMerkung, holeMerkliste, istGemerkt, istMerkRoute, kodiereMerkliste,
  leereMerkliste, merke, merkRoute, merkRouteAusAdresse, merklisteLink, schalteMerkung, uebernimmMerkliste,
} from '../lib/merkliste';

// Merkliste (LESER-NAV R-2): lokaler Speicher, Adress-Kanon, Teilen als Link.
// Randdaten: gesperrter Speicher, kaputtes JSON, fremde Payloads (Schema, Doppelpunkte,
// Steuerzeichen, Übergrösse), Duplikate, Obergrenze.

function stubSpeicher(): Map<string, string> {
  const m = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    key: (i: number) => Array.from(m.keys())[i] ?? null,
    get length() { return m.size; },
  });
  return m;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  stubSpeicher();
});

describe('Adress-Kanon', () => {
  it('merkRoute verwirft die Query (Rechner-Eingaben sind Berufsgeheimnis) und kodiert den Anker', () => {
    expect(merkRoute('/rechner/verjaehrung?betrag=5000&partei=Muster')).toBe('/rechner/verjaehrung');
    expect(merkRoute('/gesetze/bund/OR', 'art-336c')).toBe('/gesetze/bund/OR#art-336c');
    expect(merkRoute('/gesetze/bund/OR', 'art-36–42')).toBe('/gesetze/bund/OR#art-36%E2%80%9342');
  });

  it('Reiter-Pfad und Artikel-Aktion ergeben dieselbe Route (kodierter vs. roher Anker, Instanz-Query)', () => {
    expect(merkRouteAusAdresse('/gesetze/bund/OR?r=2#art-36%E2%80%9342')).toBe(merkRoute('/gesetze/bund/OR', 'art-36–42'));
    expect(merkRouteAusAdresse('/gesetze/bund/OR#art-97%')).toBe('/gesetze/bund/OR'); // kaputtes Escape: ohne Anker
  });

  it('nur interne Inhalts-Routen sind merkbar', () => {
    for (const ok of ['/gesetze/bund/OR', '/rechtsprechung/BGE-147-III-293', '/vorlagen/nda', '/materialien/x', '/gesetze/bund/OR#art-1']) {
      expect(istMerkRoute(ok), ok).toBe(true);
    }
    for (const schlecht of ['/', '/suche', '/ueber', '//evil.example/gesetze/x', 'https://evil.example/gesetze/x', 'javascript:alert(1)',
      '/gesetze/bund/OR?x=1', '/gesetze/a b', '/gesetze/x#<script>', '/gesetze/x#a#b', `/gesetze/${'a'.repeat(400)}`, 42, null]) {
      expect(istMerkRoute(schlecht), String(schlecht)).toBe(false);
    }
    expect(merkRoute('/suche?q=abc')).toBeNull();
    expect(merkRouteAusAdresse('/ueber')).toBeNull();
  });
});

describe('Speicher', () => {
  it('merken, doppelt merken (einmal, vorn), umschalten, entfernen, leeren', () => {
    expect(merke({ route: '/gesetze/bund/OR#art-1', titel: 'Art. 1 OR', zeit: 1 })).toBe(true);
    expect(merke({ route: '/gesetze/bund/ZGB#art-2', titel: 'Art. 2 ZGB', zeit: 2 })).toBe(true);
    expect(merke({ route: '/gesetze/bund/OR#art-1', titel: 'Art. 1 OR', zeit: 3 })).toBe(true);
    expect(holeMerkliste().map((e) => e.route)).toEqual(['/gesetze/bund/OR#art-1', '/gesetze/bund/ZGB#art-2']);
    expect(istGemerkt('/gesetze/bund/ZGB#art-2')).toBe(true);
    expect(schalteMerkung({ route: '/gesetze/bund/ZGB#art-2', titel: 'Art. 2 ZGB' })).toBe(false);
    expect(istGemerkt('/gesetze/bund/ZGB#art-2')).toBe(false);
    expect(schalteMerkung({ route: '/gesetze/bund/ZGB#art-2', titel: 'Art. 2 ZGB' })).toBe(true);
    expect(entferneMerkung('/gesetze/bund/OR#art-1')).toBe(true);
    expect(holeMerkliste()).toHaveLength(1);
    expect(leereMerkliste()).toBe(true);
    expect(holeMerkliste()).toEqual([]);
  });

  it('Typ kommt aus der Route; Titel wird gesäubert; leerer Titel und fremde Route werden abgelehnt', () => {
    merke({ route: '/rechtsprechung/BGE-147-III-293', titel: '  BGE\n147   III\t293 ' });
    expect(holeMerkliste()[0]).toMatchObject({ typ: 'entscheid', titel: 'BGE 147 III 293' });
    expect(merke({ route: '/gesetze/bund/OR', titel: '   ' })).toBe(false);
    expect(merke({ route: '/suche', titel: 'Suche' })).toBe(false);
  });

  it('Obergrenze: der 51. Eintrag wird abgelehnt, nichts geht stillschweigend verloren', () => {
    for (let i = 1; i <= MERKLISTE_MAX; i++) expect(merke({ route: `/gesetze/bund/E${i}`, titel: `E${i}` })).toBe(true);
    expect(merke({ route: '/gesetze/bund/ZUVIEL', titel: 'Zuviel' })).toBe(false);
    expect(holeMerkliste()).toHaveLength(MERKLISTE_MAX);
  });

  it('kaputter Speicherinhalt ergibt eine leere Liste, kein Wurf; Fremdeinträge fallen einzeln raus', () => {
    const m = stubSpeicher();
    m.set('lexmetrik-merkliste', '{kein json');
    expect(holeMerkliste()).toEqual([]);
    m.set('lexmetrik-merkliste', JSON.stringify([{ route: '/gesetze/bund/OR', titel: 'OR' }, { route: 'https://x.example', titel: 'Böse' }, null, 7, { route: '/gesetze/bund/OR', titel: 'Doppelt' }]));
    expect(holeMerkliste().map((e) => e.titel)).toEqual(['OR']);
  });

  it('gesperrter Speicher (Lesen wirft, Schreiben wirft): leer, merke meldet false, nichts wirft', () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('localStorage', undefined);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new DOMException('blockiert', 'SecurityError'); } });
    expect(holeMerkliste()).toEqual([]);
    expect(merke({ route: '/gesetze/bund/OR', titel: 'OR' })).toBe(false);
    expect(schalteMerkung({ route: '/gesetze/bund/OR', titel: 'OR' })).toBe(false);
    expect(entferneMerkung('/gesetze/bund/OR')).toBe(false);
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it('Umzug: Alt- und Neu-Adresse eines umgezogenen Erlasses (EMRK) stehen nicht doppelt, kanonisch gespeichert', () => {
    expect(merkRoute('/gesetze/bund/EMRK', 'art-6')).toBe('/gesetze/international/EMRK#art-6');
    merke({ route: '/gesetze/bund/EMRK', titel: 'EMRK' });
    merke({ route: '/gesetze/international/EMRK', titel: 'EMRK' });
    expect(holeMerkliste().map((e) => e.route)).toEqual(['/gesetze/international/EMRK']);
    // Alt-Bestand aus dem Speicher wird beim Lesen kanonisiert und dedupliziert.
    stubSpeicher().set('lexmetrik-merkliste', JSON.stringify([
      { route: '/gesetze/bund/EMRK', titel: 'EMRK alt', typ: 'gesetz', zeit: 1 },
      { route: '/gesetze/international/EMRK', titel: 'EMRK neu', typ: 'gesetz', zeit: 2 }]));
    expect(holeMerkliste().map((e) => e.route)).toEqual(['/gesetze/international/EMRK']);
  });
});

describe('Teilen als Link', () => {
  const liste = [
    { route: '/gesetze/bund/OR#art-336c', titel: 'Art. 336c OR' },
    { route: '/rechtsprechung/BGE-147-III-293', titel: 'BGE 147 III 293 «Müller»' },
  ];

  it('Rundlauf mit Umlauten und Sonderzeichen; Link zeigt auf die Startseite', () => {
    const link = merklisteLink('https://lexmetrik.ch', liste);
    expect(link.startsWith('https://lexmetrik.ch/?merkliste=')).toBe(true);
    expect(link).not.toMatch(/[+/=]$/);
    const payload = new URL(link).searchParams.get('merkliste')!;
    const zurueck = dekodiereMerkliste(payload)!;
    expect(zurueck.map((e) => [e.route, e.titel])).toEqual(liste.map((e) => [e.route, e.titel]));
    expect(zurueck[1].typ).toBe('entscheid');
  });

  it('fremde Payloads: Müll, falscher Typ, Übergrösse, leere Treffermenge ergeben null', () => {
    expect(dekodiereMerkliste('')).toBeNull();
    expect(dekodiereMerkliste('%%%')).toBeNull();
    expect(dekodiereMerkliste('abc')).toBeNull();
    expect(dekodiereMerkliste(kodiereMerkliste([{ route: 'https://evil.example/x', titel: 'x' }]))).toBeNull();
    expect(dekodiereMerkliste(btoa('{"a":1}'))).toBeNull();
    expect(dekodiereMerkliste('A'.repeat(20001))).toBeNull();
  });

  it('fremde Payloads: ungültige Zeilen entfallen einzeln, Steuerzeichen und Länge werden gesäubert, kein Schema durchgelassen', () => {
    const roh = JSON.stringify([
      ['/gesetze/bund/OR', `Titel\u0000mit\nSteuerzeichen${'x'.repeat(300)}`],
      ['javascript:alert(1)', 'böse'],
      ['//evil.example/gesetze/x', 'böse'],
      ['/gesetze/bund/OR', 'Doppelt'],
      ['/vorlagen/nda', 42],
    ]);
    const bytes = new TextEncoder().encode(roh);
    const payload = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const e = dekodiereMerkliste(payload)!;
    expect(e).toHaveLength(1);
    expect(e[0].route).toBe('/gesetze/bund/OR');
    expect(e[0].titel.length).toBeLessThanOrEqual(120);
    // eslint-disable-next-line no-control-regex
    expect(e[0].titel).not.toMatch(/[\u0000-\u001f]/);
  });

  it('Übernehmen: eigene Titel gewinnen, neue kommen hinter die eigenen, Zähler stimmt, gesperrter Speicher meldet -1', () => {
    merke({ route: '/gesetze/bund/OR#art-336c', titel: 'Mein Titel', zeit: 1 });
    const n = uebernimmMerkliste(dekodiereMerkliste(kodiereMerkliste(liste))!, 99);
    expect(n).toBe(1);
    const l = holeMerkliste();
    expect(l.map((e) => e.titel)).toEqual(['Mein Titel', 'BGE 147 III 293 «Müller»']);
    expect(l[1].zeit).toBe(99);
    expect(uebernimmMerkliste(dekodiereMerkliste(kodiereMerkliste(liste))!, 100)).toBe(0);
  });
});
