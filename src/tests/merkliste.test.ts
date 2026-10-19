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

let speicher: Map<string, string>;
const stubSpeicherLeer = () => !speicher.has('lexmetrik-merkliste');

beforeEach(() => {
  vi.unstubAllGlobals();
  speicher = stubSpeicher();
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
    expect(merke({ route: '/gesetze/bund/OR#art-1', titel: 'Art. 1 OR', zeit: 1 })).toBe('ok');
    expect(merke({ route: '/gesetze/bund/ZGB#art-2', titel: 'Art. 2 ZGB', zeit: 2 })).toBe('ok');
    expect(merke({ route: '/gesetze/bund/OR#art-1', titel: 'Art. 1 OR', zeit: 3 })).toBe('ok');
    expect(holeMerkliste().map((e) => e.route)).toEqual(['/gesetze/bund/OR#art-1', '/gesetze/bund/ZGB#art-2']);
    expect(istGemerkt('/gesetze/bund/ZGB#art-2')).toBe(true);
    expect(schalteMerkung({ route: '/gesetze/bund/ZGB#art-2', titel: 'Art. 2 ZGB' })).toEqual({ gemerkt: false, fehler: null });
    expect(istGemerkt('/gesetze/bund/ZGB#art-2')).toBe(false);
    expect(schalteMerkung({ route: '/gesetze/bund/ZGB#art-2', titel: 'Art. 2 ZGB' })).toEqual({ gemerkt: true, fehler: null });
    expect(entferneMerkung('/gesetze/bund/OR#art-1')).toBe(true);
    expect(holeMerkliste()).toHaveLength(1);
    expect(leereMerkliste()).toBe(true);
    expect(holeMerkliste()).toEqual([]);
  });

  it('Typ kommt aus der Route; Titel wird gesäubert; leerer Titel und fremde Route werden abgelehnt', () => {
    merke({ route: '/rechtsprechung/BGE-147-III-293', titel: '  BGE\n147   III\t293 ' });
    expect(holeMerkliste()[0]).toMatchObject({ typ: 'entscheid', titel: 'BGE 147 III 293' });
    expect(merke({ route: '/gesetze/bund/OR', titel: '   ' })).toBe('ungueltig');
    expect(merke({ route: '/suche', titel: 'Suche' })).toBe('ungueltig');
  });

  it('Obergrenze: der 51. Eintrag wird abgelehnt — als «voll», NICHT als «gesperrt»; nichts geht stillschweigend verloren', () => {
    for (let i = 1; i <= MERKLISTE_MAX; i++) expect(merke({ route: `/gesetze/bund/E${i}`, titel: `E${i}` })).toBe('ok');
    expect(merke({ route: '/gesetze/bund/ZUVIEL', titel: 'Zuviel' })).toBe('voll');
    expect(schalteMerkung({ route: '/gesetze/bund/ZUVIEL', titel: 'Zuviel' })).toEqual({ gemerkt: false, fehler: 'voll' });
    expect(holeMerkliste()).toHaveLength(MERKLISTE_MAX);
    // Wieder-Merken einer schon gemerkten Stelle ist auch bei voller Liste kein Überlauf (sie rückt nur nach vorn).
    expect(merke({ route: '/gesetze/bund/E7', titel: 'E7' })).toBe('ok');
    expect(holeMerkliste()[0].route).toBe('/gesetze/bund/E7');
    expect(holeMerkliste()).toHaveLength(MERKLISTE_MAX);
  });

  it('gesperrt und voll sind getrennte Ergebnisse: Schreibfehler bei Platz = «gesperrt»', () => {
    const m = stubSpeicher();
    expect(merke({ route: '/gesetze/bund/OR', titel: 'OR' })).toBe('ok');
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: () => { throw new DOMException('voll', 'QuotaExceededError'); },
      removeItem: () => { throw new DOMException('gesperrt', 'SecurityError'); },
    });
    expect(merke({ route: '/gesetze/bund/ZGB', titel: 'ZGB' })).toBe('gesperrt');
    expect(schalteMerkung({ route: '/gesetze/bund/ZGB', titel: 'ZGB' })).toEqual({ gemerkt: false, fehler: 'gesperrt' });
    expect(schalteMerkung({ route: '/gesetze/bund/OR', titel: 'OR' })).toEqual({ gemerkt: true, fehler: 'gesperrt' });
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
    expect(merke({ route: '/gesetze/bund/OR', titel: 'OR' })).toBe('gesperrt');
    expect(schalteMerkung({ route: '/gesetze/bund/OR', titel: 'OR' })).toEqual({ gemerkt: false, fehler: 'gesperrt' });
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

  it('Übernehmen: eigene Titel gewinnen, neue kommen hinter die eigenen, Zähler stimmt', () => {
    merke({ route: '/gesetze/bund/OR#art-336c', titel: 'Mein Titel', zeit: 1 });
    const n = uebernimmMerkliste(dekodiereMerkliste(kodiereMerkliste(liste))!, 99);
    expect(n).toEqual({ neu: 1, schonVorhanden: 1, wegenObergrenze: 0 });
    const l = holeMerkliste();
    expect(l.map((e) => e.titel)).toEqual(['Mein Titel', 'BGE 147 III 293 «Müller»']);
    expect(l[1].zeit).toBe(99);
    expect(uebernimmMerkliste(dekodiereMerkliste(kodiereMerkliste(liste))!, 100)).toEqual({ neu: 0, schonVorhanden: 2, wegenObergrenze: 0 });
  });

  it('Übernehmen bei gesperrtem Speicher: null (nichts angenommen)', () => {
    const m = stubSpeicher();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: () => { throw new DOMException('gesperrt', 'SecurityError'); },
      removeItem: () => {},
    });
    expect(uebernimmMerkliste(dekodiereMerkliste(kodiereMerkliste(liste))!, 1)).toBeNull();
  });

  it('Übernehmen bei VOLLER Liste: nichts wird übernommen und das wird gezählt — nicht «alle schon gemerkt»', () => {
    for (let i = 1; i <= MERKLISTE_MAX; i++) merke({ route: `/gesetze/bund/E${i}`, titel: `E${i}` });
    const vorher = holeMerkliste();
    const r = uebernimmMerkliste(dekodiereMerkliste(kodiereMerkliste(liste))!, 5);
    expect(r).toEqual({ neu: 0, schonVorhanden: 0, wegenObergrenze: 2 });
    expect(holeMerkliste()).toEqual(vorher);
  });

  it('Übernehmen 45 + 10 neue: 5 kommen, 5 fallen wegen der Obergrenze weg und werden gezählt, die ersten des Links gewinnen', () => {
    for (let i = 1; i <= 45; i++) merke({ route: `/gesetze/bund/E${i}`, titel: `E${i}` });
    const link = [
      ...[1, 2, 3].map((i) => ({ route: `/gesetze/bund/E${i}`, titel: `schon ${i}` })), // 3 schon vorhanden
      ...Array.from({ length: 10 }, (_, i) => ({ route: `/gesetze/bund/N${i + 1}`, titel: `N${i + 1}` })),
    ];
    const r = uebernimmMerkliste(dekodiereMerkliste(kodiereMerkliste(link))!, 7);
    expect(r).toEqual({ neu: 5, schonVorhanden: 3, wegenObergrenze: 5 });
    const l = holeMerkliste();
    expect(l).toHaveLength(MERKLISTE_MAX);
    expect(l.slice(45).map((e) => e.titel)).toEqual(['N1', 'N2', 'N3', 'N4', 'N5']);
    // Summe stimmt: jede Stelle des Links steht in genau einer Zahl.
    expect(r!.neu + r!.schonVorhanden + r!.wegenObergrenze).toBe(link.length);
  });
});

describe('Härtung (Bidi, Punkt-Segmente, Kanonisierung vor Prüfung)', () => {
  const UNSICHTBARE = [
    '\u200B', '\u200C', '\u200D', '\u200E', '\u200F', '\u202A', '\u202B', '\u202C', '\u202D', '\u202E',
    '\u2066', '\u2067', '\u2068', '\u2069', '\uFEFF', '\u00AD', '\u061C', '\u2060', '\u2061', '\u2062', '\u2063', '\u2064'];

  it('Titel: Bidi- und Nullbreite-Zeichen fliegen raus (Trojan Source), der Rest bleibt', () => {
    for (const z of UNSICHTBARE) {
      expect(merke({ route: '/gesetze/bund/OR', titel: `Art${z}. 1 ${z}OR` })).toBe('ok');
      expect(holeMerkliste()[0].titel, `U+${z.charCodeAt(0).toString(16)}`).toBe('Art. 1 OR');
      leereMerkliste();
    }
    expect(merke({ route: '/gesetze/bund/OR', titel: '\u202E\u200B\uFEFF' })).toBe('ungueltig'); // nur Steuerzeichen = leer
  });

  it('Route: dieselben Zeichen werden entfernt; als Rohwert besteht keine Route mit ihnen', () => {
    for (const z of UNSICHTBARE) {
      expect(istMerkRoute(`/gesetze/bund/O${z}R`), `U+${z.charCodeAt(0).toString(16)}`).toBe(false);
      expect(merke({ route: `/gesetze/bund/O${z}R#art-${z}1`, titel: 'OR' })).toBe('ok');
      expect(holeMerkliste().map((e) => e.route)).toEqual(['/gesetze/bund/OR#art-1']);
      leereMerkliste();
    }
    expect(merkRoute('/gesetze/bund/O\u202ER', 'art-\u200B1')).toBe('/gesetze/bund/OR#art-1');
  });

  it('Route aus fremdem Link und aus gespeichertem Bestand: gleiche Säuberung, kein Geistereintrag', () => {
    const roh = JSON.stringify([['/gesetze/bund/O\u202ER', 'Titel\u200B']]);
    const payload = btoa(String.fromCharCode(...new TextEncoder().encode(roh))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(dekodiereMerkliste(payload)!.map((e) => [e.route, e.titel])).toEqual([['/gesetze/bund/OR', 'Titel']]);
    stubSpeicher().set('lexmetrik-merkliste', JSON.stringify([{ route: '/gesetze/bund/O\u202ER', titel: 'T\u200Bitel' }]));
    expect(holeMerkliste().map((e) => [e.route, e.titel])).toEqual([['/gesetze/bund/OR', 'Titel']]);
  });

  it('Punkt-Segmente: «.» und «..» roh und kodiert (%2e, %2E, doppelt, mit %2f) werden abgelehnt, ehrliche Pfade bleiben', () => {
    const schlecht = ['/gesetze/bund/../OR', '/gesetze/bund/./OR', '/gesetze/..', '/gesetze/bund/%2e%2e/OR', '/gesetze/bund/%2E%2E/OR',
      '/gesetze/bund/%2e./OR', '/gesetze/bund/.%2E/OR', '/gesetze/bund/%2e/OR', '/gesetze/bund/%252e%252e/OR',
      '/gesetze/bund/..%2fOR', '/gesetze/bund/%2e%2e%2fOR', '/gesetze/bund/..%5cOR', '/gesetze/bund/%2e%2e%zz/..'];
    for (const r of schlecht) expect(istMerkRoute(r), r).toBe(false);
    for (const r of ['/gesetze/bund/OR', '/gesetze/kanton/BS-640.100', '/rechtsprechung/BGE-147-III-293', '/gesetze/bund/a.b', '/gesetze/bund/%C3%A4b', '/gesetze/bund/OR#..', '/gesetze/bund/OR#art-1.2']) {
      expect(istMerkRoute(r), r).toBe(true);
    }
    expect(merke({ route: '/gesetze/bund/%2e%2e/OR', titel: 'x' })).toBe('ungueltig');
    expect(merkRoute('/gesetze/bund/%2E%2E/OR')).toBeNull();
  });

  it('Punkt-Segmente im fremden Link und im Bestand fallen einzeln raus', () => {
    const roh = JSON.stringify([['/gesetze/bund/%2e%2e/OR', 'böse'], ['/gesetze/bund/OR', 'gut']]);
    const payload = btoa(String.fromCharCode(...new TextEncoder().encode(roh))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(dekodiereMerkliste(payload)!.map((e) => e.titel)).toEqual(['gut']);
    stubSpeicher().set('lexmetrik-merkliste', JSON.stringify([{ route: '/gesetze/bund/%2e%2e/OR', titel: 'böse' }, { route: '/gesetze/bund/OR', titel: 'gut' }]));
    expect(holeMerkliste().map((e) => e.titel)).toEqual(['gut']);
  });

  it('Länge wird NACH der Kanonisierung geprüft: der Umzug (bund→international) macht den Pfad länger — kein Geistereintrag', () => {
    // 295 Zeichen roh (≤ 300), nach dem Umzug von «bund» zu «international» 304 (> 300).
    const kopf = '/gesetze/bund/EMRK#';
    const route = kopf + 'a'.repeat(295 - kopf.length);
    expect(route).toHaveLength(295);
    expect(istMerkRoute(route)).toBe(true); // roh bestünde sie die Prüfung …
    expect(merke({ route, titel: 'EMRK' })).toBe('ungueltig'); // … kanonisiert nicht mehr
    expect(holeMerkliste()).toEqual([]);
    expect(stubSpeicherLeer()).toBe(true); // und es wurde auch nichts geschrieben
    // Gegenprobe: knapp unter der Grenze nach dem Umzug wird gemerkt und bleibt lesbar.
    const ok = kopf + 'a'.repeat(290 - kopf.length);
    expect(merke({ route: ok, titel: 'EMRK' })).toBe('ok');
    expect(holeMerkliste()).toHaveLength(1);
  });
});
