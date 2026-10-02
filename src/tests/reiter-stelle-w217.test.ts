import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { nummerAusToken, reiterStelle, stelleBrauchtDaten, type StelleDaten } from '../lib/reiterStelle';
import { ladeTabs, reiterKurzformText, reiterKurzformTeile } from '../lib/tabs';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { VerlaufManifeste } from '../lib/verlaufLabel';

// ─── W2·17-UI-BEFUNDE · DFG-F01 · Stelle im Reiter, Einzelfälle ──────────────
//
// Die fünf gemessenen Fälle aus dem Befund (Reiter «Art. 4950», «Art. scopeu1»,
// «Art. annex1», «Art. 4» im §-Erlass, «Art. 12 ZGB» für Art. 12 SchlT ZGB) mit
// kleinen Handdaten; der ganze Bestand steht in `reiter-stelle-korpus-w217`.
//
// ROT ZU BEKOMMEN (§6.7): in `reiterStelle` die Zeile `stelle = kurzLabel(e.artikelLabel)`
// durch `Art. ${token}` ersetzen — jeder Fall mit Daten wird rot.

const e = (artikel: string, artikelLabel: string) => ({ artikel, artikelLabel });
const daten = (...eintraege: ReturnType<typeof e>[]): StelleDaten => ({ eintraege, struktur: null });

describe('reiterStelle · mit Daten', () => {
  it('Bereich: «Art. 49–50», nicht «Art. 4950»', () => {
    const d = daten(e('49_50', 'Art. 49–50'));
    expect(reiterStelle('#art-49_50', 'GebV SchKG', 'bund', d)?.stelle).toBe('Art. 49–50');
  });
  it('Geltungsbereich: ohne Stand-Datum, nicht «Art. scopeu1»', () => {
    const d = daten(e('scope_u1', 'Geltungsbereich am 16. September 2022'));
    expect(reiterStelle('#art-scope_u1', 'EMRK', 'bund', d)).toMatchObject({ stelle: 'Geltungsbereich', kern: 'EMRK' });
  });
  it('Geltungsbereich bleibt unterscheidbar, wo ein Erlass zwei führt (KRK)', () => {
    const d = daten(
      e('scope_u1', 'Geltungsbereich des Übereinkommes am 7. Mai 2026'),
      e('scope_u3', 'Geltungsbereich der Änderung am 4. Juni 2014'),
    );
    expect(reiterStelle('#art-scope_u1', 'KRK', 'bund', d)?.stelle).toBe('Geltungsbereich des Übereinkommes');
    expect(reiterStelle('#art-scope_u3', 'KRK', 'bund', d)?.stelle).toBe('Geltungsbereich der Änderung');
  });
  it('Anhang: «Anhang 1», nicht «Art. annex1»', () => {
    expect(reiterStelle('#art-annex_1', 'ERV', 'bund', daten(e('annex_1', 'Anhang 1')))?.stelle).toBe('Anhang 1');
  });
  it('§-Erlass: «§ 4», nicht «Art. 4»', () => {
    expect(reiterStelle('#art-4', 'GOG', 'kanton', daten(e('4', '§ 4')))?.stelle).toBe('§ 4');
  });
  it('ZGB-Schlusstitel: «Art. 12 SchlT ZGB» — Stelle plus qualifiziertes Kürzel', () => {
    const d = daten(e('12', 'Art. 12'), e('disp_u1_art_12', 'Art. 12'));
    const r = reiterStelle('#art-disp_u1_art_12', 'ZGB', 'bund', d);
    expect(r).toMatchObject({ stelle: 'Art. 12', kern: 'SchlT ZGB', gelesen: 'Art. 12 SchlT ZGB' });
    // Der Hauptartikel 12 daneben bleibt «Art. 12 ZGB».
    expect(reiterStelle('#art-12', 'ZGB', 'bund', d)).toMatchObject({ stelle: 'Art. 12', kern: 'ZGB', gelesen: 'Art. 12' });
  });
  it('lange amtliche Bezeichnungen werden am Wortende gekürzt', () => {
    const lang = 'Vorbehalte und Erklärungen, die nach Artikel 21 des Übereinkommens abgegeben wurden';
    const s = reiterStelle('#art-decl_u2', 'GFK', 'bund', daten(e('decl_u2', lang)))!.stelle;
    expect(s.endsWith('…')).toBe(true);
    expect(lang.startsWith(s.slice(0, -1))).toBe(true);
    expect(s.length).toBeLessThanOrEqual(35);
  });
  it('Token, den der Erlass nicht kennt: keine Stelle statt einer erfundenen', () => {
    expect(reiterStelle('#art-999', 'OR', 'bund', daten(e('1', 'Art. 1')))).toMatchObject({ stelle: '', gelesen: '' });
  });
  it('kein Anker, kaputtes %-Escape: keine Stelle (PA-1-B01)', () => {
    expect(reiterStelle(undefined, 'OR', 'bund', null)).toBeNull();
    expect(reiterStelle('#art-97%', 'OR', 'bund', null)).toBeNull();
  });
});

describe('reiterStelle · ohne Daten (Start aus dem Speicher)', () => {
  it('Bund-Nummer: aus dem Token, exakt (Bereich, Buchstaben, Schlusstitel)', () => {
    expect(reiterStelle('#art-336_c', 'OR', 'bund', null)?.stelle).toBe('Art. 336c');
    expect(reiterStelle('#art-49_50', 'GebV SchKG', 'bund', null)?.stelle).toBe('Art. 49–50');
    expect(reiterStelle('#art-226_a_226_d', 'OR', 'bund', null)?.stelle).toBe('Art. 226a–226d');
    expect(reiterStelle('#art-disp_u1_art_31_32', 'ZGB', 'bund', null)?.stelle).toBe('Art. 31–32');
  });
  it('Schlusstitel ohne Daten: nie «Art. 12 ZGB» — ZGB «SchlT», sonst die laufende Gruppe', () => {
    expect(reiterStelle('#art-disp_u1_art_12', 'ZGB', 'bund', null)).toMatchObject({ stelle: 'Art. 12', kern: 'SchlT ZGB' });
    const or = reiterStelle('#art-disp_u12_art_2_4', 'OR', 'bund', null)!;
    expect(or.stelle).toBe('Art. 2–4');
    expect(or.kern).toBe('OR (nachgestellte Bestimmungen, Gruppe 12)');
  });
  it('Anhang und Geltungsbereich: ohne Rohschlüssel; unbekannte Form: keine Stelle', () => {
    expect(reiterStelle('#art-annex_1', 'ERV', 'bund', null)?.stelle).toBe('Anhang 1');
    expect(reiterStelle('#art-annex_3_1', 'GSCHV', 'bund', null)?.stelle).toBe('Anhang 3.1');
    expect(reiterStelle('#art-scope_u1', 'EMRK', 'bund', null)?.stelle).toBe('Geltungsbereich');
    expect(reiterStelle('#art-annex_u1', 'VZV', 'bund', null)?.stelle).toBe('');
    expect(reiterStelle('#art-decl_u2', 'GFK', 'bund', null)?.stelle).toBe('');
  });
  it('Kanton: keine Stelle — «Art.» oder «§» weiss erst der Eintrag', () => {
    expect(reiterStelle('#art-4', 'GOG', 'kanton', null)?.stelle).toBe('');
  });
  it('stelleBrauchtDaten: Bund-Nummern nicht, Kanton und Sonderformen schon', () => {
    expect(stelleBrauchtDaten('#art-336_c', 'bund')).toBe(false);
    expect(stelleBrauchtDaten('#art-4', 'kanton')).toBe(true);
    expect(stelleBrauchtDaten('#art-annex_1', 'bund')).toBe(true);
    expect(stelleBrauchtDaten(undefined, 'bund')).toBe(false);
  });
});

// ─── Die Leiste: dieselbe Stelle in Einzeiler und Teilen ─────────────────────

const erlass = (key: string, kuerzel: string, ebene = 'bund') =>
  ({ key, ebene, kanton: ebene === 'kanton' ? 'ZH' : null, kuerzel, titel: kuerzel, rechtsgebiet: 'privat' }) as unknown as BrowseErlass;
const manifest = (er: BrowseErlass, d?: StelleDaten): VerlaufManifeste => ({
  gesetze: { erlasse: [er] } as never,
  ...(d ? { artikel: { [er.key]: d } } : {}),
});

describe('Leiste · reiterKurzformText folgt dem amtlichen Label', () => {
  const zgb = erlass('ZGB', 'ZGB');
  const zgbDaten = daten(e('12', 'Art. 12'), e('disp_u1_art_12', 'Art. 12'));

  it('«Art. 12 SchlT ZGB» für den Schlusstitel-Artikel, «Art. 12 ZGB» für den Hauptartikel', () => {
    const m = manifest(zgb, zgbDaten);
    expect(reiterKurzformText({ path: '/gesetze/bund/ZGB#art-disp_u1_art_12' }, m)).toBe('Art. 12 SchlT ZGB');
    expect(reiterKurzformText({ path: '/gesetze/bund/ZGB#art-12' }, m)).toBe('Art. 12 ZGB');
  });
  it('§-Erlass und Bereich über die Teile', () => {
    const gog = erlass('ZH-211.11', 'GOG', 'kanton');
    expect(reiterKurzformTeile({ path: '/gesetze/kanton/ZH-211.11#art-4' }, manifest(gog, daten(e('4', '§ 4'))))).toMatchObject({ stelle: '§ 4', kern: 'GOG' });
    const geb = erlass('GEBV', 'GebV SchKG');
    expect(reiterKurzformText({ path: '/gesetze/bund/GEBV#art-49_50' }, manifest(geb))).toBe('Art. 49–50 GebV SchKG');
  });
  it('Lesestellung geht vor `wahl`; ohne Anker keine Stelle', () => {
    const m = manifest(zgb, zgbDaten);
    expect(reiterKurzformTeile({ path: '/gesetze/bund/ZGB', wahl: '#art-12' }, m).stelle).toBe('Art. 12');
    expect(reiterKurzformTeile({ path: '/gesetze/bund/ZGB' }, m).stelle).toBe('');
  });
});

describe('Altbestand im Speicher wird beim Laden richtig beschriftet', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('ein vor dem Fix gespeicherter Reiter trägt nur den Pfad — die Beschriftung entsteht beim Zeichnen', () => {
    // So lag der Speicher vor dem Fix (Pfad mit Anker-Token, optional `wahl`): das
    // alte Label «Art. disp…/Art. 4950» war nie gespeichert, sondern abgeleitet.
    const roh = JSON.stringify([
      { path: '/gesetze/bund/ZGB#art-disp_u1_art_12' },
      { path: '/gesetze/bund/EMRK', wahl: '#art-scope_u1' },
      { path: '/gesetze/bund/GEBV#art-49_50' },
    ]);
    vi.stubGlobal('localStorage', { getItem: () => roh, setItem: () => undefined, removeItem: () => undefined });
    const tabs = ladeTabs();
    expect(tabs).toHaveLength(3);
    const ms = [
      manifest(erlass('ZGB', 'ZGB'), daten(e('disp_u1_art_12', 'Art. 12'))),
      manifest(erlass('EMRK', 'EMRK'), daten(e('scope_u1', 'Geltungsbereich am 16. September 2022'))),
      manifest(erlass('GEBV', 'GebV SchKG')),
    ];
    expect(tabs.map((t, i) => reiterKurzformText(t, ms[i]))).toEqual([
      'Art. 12 SchlT ZGB', 'Geltungsbereich EMRK', 'Art. 49–50 GebV SchKG',
    ]);
    // Und ohne geladene Daten (Kaltstart): keine Rohschlüssel, im Zweifel keine Stelle.
    expect(tabs.map((t, i) => reiterKurzformText(t, { gesetze: ms[i].gesetze }))).toEqual([
      'Art. 12 SchlT ZGB', 'Geltungsbereich EMRK', 'Art. 49–50 GebV SchKG',
    ]);
  });
});

describe('nummerAusToken: dieselbe Regel für die Anzeige-Stellen ohne Eintrag (Nebenfund DFG-F01)', () => {
  it('Bereich mit Trenner, Zusätze zusammengezogen', () => {
    expect(nummerAusToken('49_50')).toBe('49–50');
    expect(nummerAusToken('20_a')).toBe('20a');
    expect(nummerAusToken('226_a_226_d')).toBe('226a–226d');
  });
  it('KontextPanel, kontext.ts und PanelErlaeuterungen streichen den Unterstrich nicht mehr ersatzlos', () => {
    for (const f of ['src/components/kontext/KontextPanel.tsx', 'src/lib/kontext.ts', 'src/pages/gesetz-leser/v3/PanelErlaeuterungen.tsx']) {
      const q = readFileSync(f, 'utf8');
      expect(q, f).toContain('nummerAusToken(');
      expect(q, f).not.toMatch(/replace\(\/_\/g, ''\)/);
    }
  });
});
