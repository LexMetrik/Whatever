// Zustands-Weiche der Rechtsprechungs-Übersicht (LM-200/203/204/206).
//
// Der tragende Beleg ist nicht «der Parameter steht in der Adresse», sondern
// «nach dem Neuladen ist die TREFFERMENGE identisch» — darum laufen die Tests
// über `filterEntscheide()` gegen einen kleinen, aber echt geformten Bestand
// und vergleichen Schlüssel-Listen, nicht Parameter-Strings.

import {
  achsenDiff, leseFilterAusUrl, lokaleWerte, wendeAchsenAn, URL_ACHSEN,
  leseDichte, schreibeDichte, leseSort, schreibeSort, leseKlappe, schreibeKlappe,
  DICHTE_KEY, SORT_KEY, KLAPPE_KEY,
} from '../components/rechtsprechung/zustand';
import { filterEntscheide, type EntscheidFilterWerte } from '../lib/rechtsprechung/browse';
import type { BrowseEntscheid } from '../lib/rechtsprechung/register';

// ── Bestand: klein, aber über alle betroffenen Achsen gespreizt ──────────────

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

const BESTAND: BrowseEntscheid[] = [
  e({ key: 'bger-de-privat', sachgebiet: 'privat' }),
  e({ key: 'bger-fr-straf', sprache: 'fr', sachgebiet: 'straf' }),
  e({ key: 'bvger-de', gericht: 'bvger', gerichtName: 'Bundesverwaltungsgericht', gerichtstyp: 'bundesverwaltungsgericht' }),
  e({ key: 'bs-1', gericht: 'bs_appellationsgericht', gerichtName: 'Appellationsgericht BS', gerichtstyp: 'kantonal', kanton: 'BS', datum: '2024-06-01' }),
  e({ key: 'bs-2', gericht: 'bs_appellationsgericht', gerichtName: 'Appellationsgericht BS', gerichtstyp: 'kantonal', kanton: 'BS', sprache: 'fr', datum: '2023-06-01' }),
  e({ key: 'zh-1', gericht: 'zh_obergericht', gerichtName: 'Obergericht ZH', gerichtstyp: 'kantonal', kanton: 'ZH', leitcharakter: 'leitentscheid' }),
];

const schluessel = (w: EntscheidFilterWerte) => filterEntscheide(BESTAND, w).map((x) => x.key);

/** Was ein Filterklick schreiben würde, auf eine Adresse angewandt. */
function adresseNach(werte: EntscheidFilterWerte, start = ''): URLSearchParams {
  const params = new URLSearchParams(start);
  return wendeAchsenAn(params, achsenDiff(werte, params));
}

// ── LM-206: nach dem Neuladen dieselbe Treffermenge ─────────────────────────

describe('Neuladen stellt exakt dieselbe Treffermenge her (LM-206)', () => {
  const faelle: { name: string; werte: EntscheidFilterWerte }[] = [
    { name: 'Gemeinwesen BS', werte: { kanton: 'BS' } },
    { name: 'Gemeinwesen Bund', werte: { ebene: 'bund' } },
    { name: 'Gemeinwesen Kantone', werte: { ebene: 'kanton' } },
    { name: 'Instanz BVGer', werte: { gerichtstyp: 'bundesverwaltungsgericht' } },
    { name: 'Sprache FR', werte: { sprache: 'fr' } },
    { name: 'Gemeinwesen + Instanz + Sprache zusammen', werte: { kanton: 'BS', gerichtstyp: 'kantonal', sprache: 'fr' } },
    { name: 'Sachgebiet + Sprache (alt + neu gemischt)', werte: { sachgebiet: 'straf', sprache: 'fr' } },
    { name: 'Gericht + Zeitraum + nur Leitentscheide', werte: { gericht: 'zh_obergericht', datumVon: '2024-01-01', nurLeitentscheide: true } },
  ];

  for (const { name, werte } of faelle) {
    it(name, () => {
      const vorher = schluessel(werte);
      // Die Menge muss überhaupt etwas aussagen — sonst belegt der Vergleich nichts.
      expect(vorher.length).toBeGreaterThan(0);
      expect(vorher.length).toBeLessThan(BESTAND.length);

      // Adresse schreiben → Seite neu laden → Filter aus der Adresse lesen.
      const adresse = adresseNach(werte);
      const nachher = schluessel(leseFilterAusUrl(adresse));

      expect(nachher).toEqual(vorher);
    });
  }

  it('der geteilte Link trägt alle drei neuen Achsen namentlich', () => {
    const adresse = adresseNach({ kanton: 'BS', gerichtstyp: 'kantonal', sprache: 'fr' });
    expect(adresse.get('kanton')).toBe('BS');
    expect(adresse.get('instanz')).toBe('kantonal');
    expect(adresse.get('sprache')).toBe('fr');
  });

  // Vor dem Schritt war genau das der Befund: Richter kam zurück, Gemeinwesen nicht.
  it('kein Filter fällt beim Neuladen still weg', () => {
    const werte: EntscheidFilterWerte = { richter: 'muller-c', kanton: 'BS', sprache: 'fr' };
    const gelesen = leseFilterAusUrl(adresseNach(werte));
    expect(gelesen.richter).toBe('muller-c');
    expect(gelesen.kanton).toBe('BS');
    expect(gelesen.sprache).toBe('fr');
  });
});

// ── Rückwärtskompatibilität und S1-Abgrenzung ───────────────────────────────

describe('Rückwärtskompatibilität der bestehenden Parameter', () => {
  it('rg/norm/richter behalten Name und Bedeutung', () => {
    const alt = new URLSearchParams('rg=straf&norm=OR&richter=muller-c');
    const w = leseFilterAusUrl(alt);
    expect(w.sachgebiet).toBe('straf');
    expect(w.norm).toBe('OR');
    expect(w.richter).toBe('muller-c');
    // Ein bestehender Link löst keinen Schreibvorgang aus (nichts hat sich geändert).
    expect(achsenDiff(w, alt)).toEqual({});
  });

  // Nicht zu den Filter-Achsen gehörende Parameter darf die Weiche nie anfassen —
  // sie kennt nur ihre eigene Tabelle.
  it('fremde Parameter bleiben unangetastet', () => {
    const adresse = adresseNach({ sachgebiet: 'privat', kanton: 'BS' }, 'utm_source=mail&rg=privat');
    expect(adresse.get('utm_source')).toBe('mail');
    expect(adresse.get('rg')).toBe('privat');
    expect(adresse.get('kanton')).toBe('BS');
  });
});

describe('S1-Abgrenzung: der Suchbegriff bleibt lokal', () => {
  it('q landet nie in der Adresse', () => {
    const adresse = adresseNach({ q: 'kündigung', kanton: 'BS' });
    expect(adresse.get('q')).toBeNull();
    expect([...adresse.keys()]).toEqual(['kanton']);
  });

  it('q bleibt im lokalen Rest, jede URL-Achse verlässt ihn', () => {
    const rest = lokaleWerte({ q: 'kündigung', kanton: 'BS', sprache: 'fr', sachgebiet: 'privat' });
    expect(rest).toEqual({ q: 'kündigung' });
    for (const feld of Object.keys(URL_ACHSEN)) expect(rest).not.toHaveProperty(feld);
  });
});

// ── Schreib-Arithmetik ──────────────────────────────────────────────────────

describe('achsenDiff schreibt nur Geändertes', () => {
  it('unveränderte Achsen erscheinen nicht im Diff', () => {
    const params = new URLSearchParams('rg=privat&kanton=BS');
    const diff = achsenDiff({ sachgebiet: 'privat', kanton: 'BS', sprache: 'de' }, params);
    expect(diff).toEqual({ sprache: 'de' });
  });

  it('entfernte Achsen werden gelöscht, nicht auf leer gesetzt', () => {
    const params = new URLSearchParams('rg=privat&kanton=BS&sprache=fr');
    const diff = achsenDiff({ sachgebiet: 'privat' }, params);
    expect(diff).toEqual({ kanton: null, sprache: null });
    const adresse = wendeAchsenAn(params, diff);
    expect(adresse.toString()).toBe('rg=privat');
  });

  // «zurücksetzen» räumt bis zu zehn Achsen auf einmal ab — deshalb EIN Schreibvorgang.
  it('zurücksetzen behält das Sachgebiet und löscht alles andere', () => {
    const params = new URLSearchParams('rg=privat&kanton=BS&instanz=kantonal&sprache=fr&richter=muller-c&leit=1&von=2024-01-01');
    const adresse = wendeAchsenAn(params, achsenDiff({ sachgebiet: 'privat' }, params));
    expect(adresse.toString()).toBe('rg=privat');
  });

  it('«nur Leitentscheide» als Wahrheitswert-Achse', () => {
    expect(adresseNach({ nurLeitentscheide: true }).get('leit')).toBe('1');
    expect(adresseNach({ nurLeitentscheide: false }).get('leit')).toBeNull();
    expect(leseFilterAusUrl(new URLSearchParams('leit=1')).nurLeitentscheide).toBe(true);
    expect(leseFilterAusUrl(new URLSearchParams()).nurLeitentscheide).toBe(false);
  });
});

describe('verbogene Adressen filtern nicht unsichtbar (§8)', () => {
  it('unbekannte Ebene und Instanz gelten als nicht gesetzt', () => {
    const w = leseFilterAusUrl(new URLSearchParams('ebene=galaxie&instanz=schiedsgericht'));
    expect(w.ebene).toBeNull();
    expect(w.gerichtstyp).toBeNull();
    expect(schluessel(w)).toEqual(BESTAND.map((x) => x.key));
  });

  it('leere Parameter filtern nicht', () => {
    const w = leseFilterAusUrl(new URLSearchParams('kanton=&sprache=&rg='));
    expect(schluessel(w)).toEqual(BESTAND.map((x) => x.key));
  });
});

// ── Darstellungs-Zustände: gleiche Klasse, gleicher Ort ─────────────────────

// Die Suite läuft im node-Environment (vite.config.ts) — es gibt kein
// localStorage. Ein Minimal-Speicher als Global genügt: die Helfer greifen zur
// Aufrufzeit auf `localStorage` zu und behandeln dessen Fehlen als Default-Fall.
const speicher = new Map<string, string>();
const attrappe: Storage = {
  getItem: (k) => speicher.get(k) ?? null,
  setItem: (k, v) => { speicher.set(k, String(v)); },
  removeItem: (k) => { speicher.delete(k); },
  clear: () => { speicher.clear(); },
  key: (i) => [...speicher.keys()][i] ?? null,
  get length() { return speicher.size; },
};

describe('Darstellung liegt vollständig in localStorage', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: attrappe, configurable: true });
  });
  afterAll(() => { Reflect.deleteProperty(globalThis, 'localStorage'); });
  beforeEach(() => { speicher.clear(); });

  it('ohne localStorage (Prerender) gilt still der Default', () => {
    Reflect.deleteProperty(globalThis, 'localStorage');
    expect(leseDichte()).toBe('liste');
    expect(leseSort()).toBe('relevanz');
    expect(leseKlappe()).toBe(false);
    expect(() => schreibeDichte('karten')).not.toThrow();
    Object.defineProperty(globalThis, 'localStorage', { value: attrappe, configurable: true });
  });

  it('Dichte, Sortierung und Klappe überstehen alle drei das Neuladen', () => {
    schreibeDichte('karten');
    schreibeSort('neu');
    schreibeKlappe(true);
    expect(leseDichte()).toBe('karten');
    expect(leseSort()).toBe('neu');
    expect(leseKlappe()).toBe(true);
  });

  it('Defaults ohne gespeicherten Wert', () => {
    expect(leseDichte()).toBe('liste');
    expect(leseSort()).toBe('relevanz');
    expect(leseKlappe()).toBe(false);
  });

  it('unbrauchbare gespeicherte Werte fallen auf den Default zurück', () => {
    attrappe.setItem(DICHTE_KEY, 'kacheln');
    attrappe.setItem(SORT_KEY, 'alphabetisch');
    attrappe.setItem(KLAPPE_KEY, 'vielleicht');
    expect(leseDichte()).toBe('liste');
    expect(leseSort()).toBe('relevanz');
    expect(leseKlappe()).toBe(false);
  });

  it('kein Darstellungs-Zustand rutscht in die Adresse', () => {
    schreibeDichte('karten');
    schreibeSort('neu');
    schreibeKlappe(true);
    const adresse = adresseNach({ kanton: 'BS' });
    for (const k of ['dichte', 'sort', 'ansicht', 'klappe']) expect(adresse.get(k)).toBeNull();
  });
});
