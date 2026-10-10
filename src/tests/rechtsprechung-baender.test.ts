// Band-/Jahr-Gruppierung der Sprungleiste (W2·10-UI-NAV/J1).
//
// Die Leiste verspricht dreierlei, und genau das prüfen diese Fälle:
//   1. Sie bildet die REIHENFOLGE DER LISTE ab, sortiert nicht um.
//   2. Sie schreibt einen BGE-Band nur an, wenn er für das Jahr eindeutig ist
//      (§8 — sonst behauptete der Chip eine Zuordnung, die die Daten nicht tragen).
//   3. Sie zeigt sich nur bei chronologischer Sicht (`istChronologisch`); bei
//      einer Liste, die zwischen Jahren hin- und herspringt, hätte ein Chip
//      mehrere Fundstellen und der Sprung landete willkürlich.
//
// `ersterIndex` ist der Vertrag zum Batching: das Sprungziel muss geladen sein,
// bevor dorthin gescrollt werden kann.

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { jahrVon, bandVon, zaehleBaender, istChronologisch } from '../components/rechtsprechung/baender';
import { zaehleAktiveFilter } from '../components/rechtsprechung/zustand';
import { leseFenster, schreibeFenster, DECKEL_PRAEFIX } from '../components/ui/listenFenster';
import type { BrowseEntscheid } from '../lib/rechtsprechung/register';

function e(teil: Partial<BrowseEntscheid> & { key: string }): BrowseEntscheid {
  return {
    gericht: 'bger', gerichtName: 'Bundesgericht', gerichtstyp: 'bundesgericht',
    kanton: 'CH', nummer: '5A_1/2025', bgeReferenz: null, datum: '2025-01-01',
    zitierung: 'BGer 5A_1/2025', leitcharakter: 'routine', regesteVorhanden: false,
    regesteKurz: null, sachgebiet: 'privat', sprache: 'de', normKeys: [],
    bestand: 'vollstaendig', kuratierung: 'maschinell', datei: null,
    quelle: 'opencaselaw', quelleUrl: 'https://example.invalid',
    ...teil,
  } as BrowseEntscheid;
}

describe('jahrVon / bandVon', () => {
  it('liest das Jahr aus dem ISO-Datum', () => {
    expect(jahrVon(e({ key: 'a', datum: '2026-08-07' }))).toBe('2026');
  });

  it('behält das Jahr auch bei unbekanntem TAG (BS §3.3/§7.2)', () => {
    // Unbekannt ist der Tag, nicht das Jahr — die Anzeige sagt «2024, o. D.».
    expect(jahrVon(e({ key: 'a', datum: '2024-01-01', datumUnbekannt: true }))).toBe('2024');
  });

  it('liest den Band aus der BGE-Referenz, sonst null', () => {
    expect(bandVon(e({ key: 'a', bgeReferenz: '152 IV 14' }))).toBe('152');
    expect(bandVon(e({ key: 'b', bgeReferenz: null }))).toBeNull();
  });

  it('verträgt historische Abteilungen («148 Ia 31»)', () => {
    expect(bandVon(e({ key: 'a', bgeReferenz: '148 Ia 31' }))).toBe('148');
  });
});

describe('zaehleBaender', () => {
  it('gruppiert aufeinanderfolgende Jahre und merkt sich den ersten Index', () => {
    const liste = [
      e({ key: 'a', datum: '2026-08-07' }),
      e({ key: 'b', datum: '2026-03-01' }),
      e({ key: 'c', datum: '2025-11-02' }),
    ];
    const g = zaehleBaender(liste);
    expect(g.map((x) => x.jahr)).toEqual(['2026', '2025']);
    expect(g.map((x) => x.count)).toEqual([2, 1]);
    expect(g.map((x) => x.ersterIndex)).toEqual([0, 2]);
  });

  it('schreibt den Band an, wenn er für das Jahr EINDEUTIG ist', () => {
    const g = zaehleBaender([
      e({ key: 'a', datum: '2026-08-07', bgeReferenz: '152 IV 14' }),
      e({ key: 'b', datum: '2026-03-01', bgeReferenz: '152 III 9' }),
    ]);
    expect(g[0].label).toBe('2026 · BGE 152');
  });

  it('lässt den Band weg, wenn ein Jahr MEHRERE Bände trägt (§8)', () => {
    const g = zaehleBaender([
      e({ key: 'a', datum: '2026-08-07', bgeReferenz: '152 IV 14' }),
      e({ key: 'b', datum: '2026-01-04', bgeReferenz: '151 III 9' }),
    ]);
    expect(g[0].label).toBe('2026');
  });

  it('lässt den Band weg, wenn das Jahr gar keine BGE enthält', () => {
    const g = zaehleBaender([e({ key: 'a', datum: '2026-08-07', bgeReferenz: null })]);
    expect(g[0].label).toBe('2026');
  });

  it('zählt Verweis-Einträge nicht mit (symmetrisch zum Treffer-Zähler)', () => {
    const g = zaehleBaender([
      e({ key: 'a', datum: '2026-08-07' }),
      e({ key: 'b', datum: '2026-03-01', verweis: { zielKey: 'a', ansicht: 'voll', bgeReferenz: '152 IV 14' } }),
    ]);
    expect(g[0].count).toBe(1);
  });

  it('sortiert NICHT um — die Leiste spiegelt die Liste', () => {
    const g = zaehleBaender([
      e({ key: 'a', datum: '2019-05-05' }),
      e({ key: 'b', datum: '2026-08-07' }),
    ]);
    expect(g.map((x) => x.jahr)).toEqual(['2019', '2026']);
  });
});

describe('istChronologisch', () => {
  it('true, wenn jedes Jahr genau einmal vorkommt', () => {
    expect(istChronologisch(zaehleBaender([
      e({ key: 'a', datum: '2026-08-07' }),
      e({ key: 'b', datum: '2025-01-01' }),
    ]))).toBe(true);
  });

  it('false, wenn ein Jahr mehrfach auftaucht (z. B. Relevanz-Sortierung)', () => {
    // Genau der Fall, in dem ein Chip zwei Fundstellen hätte → Leiste bleibt weg.
    expect(istChronologisch(zaehleBaender([
      e({ key: 'a', datum: '2026-08-07' }),
      e({ key: 'b', datum: '2025-01-01' }),
      e({ key: 'c', datum: '2026-02-02' }),
    ]))).toBe(false);
  });
});

// ── J2 · Zahl im «Filter (n)»-Auslöser ──────────────────────────────────────
//
// Die Zahl darf nur zählen, was der Auslöser auch VERBIRGT. Sachgebiet (Rail)
// und Suchbegriff bleiben mobil sichtbar — stünden sie in der Zahl, verspräche
// sie verborgene Filter, die der Nutzer vor sich sieht (§8).

describe('zaehleAktiveFilter', () => {
  it('zählt null bei leerem Filterzustand', () => {
    expect(zaehleAktiveFilter({})).toBe(0);
  });

  it('zählt jede verborgene Achse einzeln', () => {
    expect(zaehleAktiveFilter({ kanton: 'BS', sprache: 'de', gericht: 'bger' })).toBe(3);
  });

  it('zählt «nur Leitentscheide» mit, aber nur wenn gesetzt', () => {
    expect(zaehleAktiveFilter({ nurLeitentscheide: true })).toBe(1);
    expect(zaehleAktiveFilter({ nurLeitentscheide: false })).toBe(0);
  });

  it('zählt Sachgebiet NICHT (Rail bleibt mobil sichtbar), Suchbegriff aber SCHON (liegt seit J2 im Sheet)', () => {
    expect(zaehleAktiveFilter({ sachgebiet: 'privat' })).toBe(0);
    expect(zaehleAktiveFilter({ sachgebiet: 'privat', q: 'Kündigung' })).toBe(1);
    expect(zaehleAktiveFilter({ q: '   ' })).toBe(0);
  });

  it('ignoriert auf null gesetzte Achsen', () => {
    expect(zaehleAktiveFilter({ kanton: null, sprache: null, norm: 'OR-266' })).toBe(1);
  });
});

// ── B2 · Plausibilisierung des wiederhergestellten Sichtfensters ────────────
//
// sessionStorage ist von der Seite (und von fremdem Skript gleicher Herkunft)
// schreibbar. Ohne Schranke liesse sich über einen präparierten Wert ein
// beliebig grosses DOM erzwingen — genau die Last, gegen die das Fenster gebaut
// ist. Unplausibles fällt darum GANZ auf den Grundzustand zurück.

// Die Suite läuft im node-Environment (vite.config.ts) — es gibt kein
// sessionStorage. Minimal-Speicher als Global, wie in rechtsprechung-zustand.
const sitzung = new Map<string, string>();
const sitzungAttrappe: Storage = {
  getItem: (k) => sitzung.get(k) ?? null,
  setItem: (k, v) => { sitzung.set(k, String(v)); },
  removeItem: (k) => { sitzung.delete(k); },
  clear: () => { sitzung.clear(); },
  key: (i) => [...sitzung.keys()][i] ?? null,
  get length() { return sitzung.size; },
};

describe('leseFenster · Plausibilisierung', () => {
  const KEY = 'test-fenster';
  const GRUND = 100;
  const MAX = 2000;
  const grundFenster = { von: 0, bis: GRUND };

  beforeAll(() => {
    Object.defineProperty(globalThis, 'sessionStorage', { value: sitzungAttrappe, configurable: true });
  });
  afterAll(() => { Reflect.deleteProperty(globalThis, 'sessionStorage'); });
  beforeEach(() => { sitzung.clear(); });

  it('ohne sessionStorage (Prerender) gilt still der Grundzustand', () => {
    Reflect.deleteProperty(globalThis, 'sessionStorage');
    expect(leseFenster(KEY, GRUND, MAX)).toEqual(grundFenster);
    Object.defineProperty(globalThis, 'sessionStorage', { value: sitzungAttrappe, configurable: true });
  });

  it('liefert den Grundzustand, wenn nichts gespeichert ist', () => {
    expect(leseFenster(KEY, GRUND, MAX)).toEqual(grundFenster);
  });

  it('SPEICHER-VERTRAG: der Sitzungsschlüssel bleibt byte-gleich («rsp:deckel:» + Liste, Wert «von:bis»)', () => {
    // P10b (30.9.2026): der Helfer zog nach ui/listenFenster; das Präfix bleibt, sonst verlöre
    // jeder Nutzer beim Deploy sein aufgeklapptes Fenster (sessionStorage überlebt im offenen Tab).
    schreibeFenster('materialien:BR', { von: 0, bis: 200 });
    expect(sitzung.get('rsp:deckel:materialien:BR')).toBe('0:200');
    expect(DECKEL_PRAEFIX).toBe('rsp:deckel:');
  });

  it('stellt ein plausibles Fenster wieder her', () => {
    schreibeFenster(KEY, { von: 300, bis: 500 });
    expect(leseFenster(KEY, GRUND, MAX)).toEqual({ von: 300, bis: 500 });
  });

  it('verwirft ein Fenster über der harten Spannen-Grenze', () => {
    schreibeFenster(KEY, { von: 0, bis: MAX + 1 });
    expect(leseFenster(KEY, GRUND, MAX)).toEqual(grundFenster);
  });

  it('verwirft negative und verdrehte Grenzen', () => {
    sitzungAttrappe.setItem(DECKEL_PRAEFIX + KEY, '-5:100');
    expect(leseFenster(KEY, GRUND, MAX)).toEqual(grundFenster);
    sitzungAttrappe.setItem(DECKEL_PRAEFIX + KEY, '500:300');
    expect(leseFenster(KEY, GRUND, MAX)).toEqual(grundFenster);
    sitzungAttrappe.setItem(DECKEL_PRAEFIX + KEY, '100:100');
    expect(leseFenster(KEY, GRUND, MAX)).toEqual(grundFenster);
  });

  it('verwirft Unsinn statt ihn teilweise zu übernehmen', () => {
    for (const roh of ['', 'abc', '100', '1:2:3', 'NaN:200', '1e999:1e999']) {
      sitzungAttrappe.setItem(DECKEL_PRAEFIX + KEY, roh);
      expect(leseFenster(KEY, GRUND, MAX), `Rohwert «${roh}»`).toEqual(grundFenster);
    }
  });
});
