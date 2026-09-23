import { describe, it, expect } from 'vitest';
import { leseBlatt, schreibeBlatt, elternOrt, gleicherOrt, blattKrumen } from '../lib/startBlatt';

// W2·29-WERKBANK-START S1 — die Adresse des aufgeklappten Blatts
// (`/?blatt=<rubrik>/<stufe…>`, David 23.9.2026 «jede Stufe eine eigene
// Adresse»). Ein verstümmelter Deep-Link öffnet die nächsthöhere ECHTE Stufe,
// nie eine erfundene (§8).
describe('Startseite · Blatt-Adresse', () => {
  it('liest die gültigen Gesetze-Stufen vollständig', () => {
    expect(leseBlatt('gesetze')).toEqual({ rubrik: 'gesetze', pfad: [] });
    expect(leseBlatt('gesetze/bund/02')).toEqual({ rubrik: 'gesetze', pfad: ['bund', '02'] });
    expect(leseBlatt('gesetze/kantone/BS')).toEqual({ rubrik: 'gesetze', pfad: ['kantone', 'BS'] });
    expect(leseBlatt('gesetze/international')).toEqual({ rubrik: 'gesetze', pfad: ['international'] });
  });

  // S2 (23.9.2026): Werkzeuge klappt jetzt vor Ort auf (zwei Wahlen, keine
  // weitere Tiefe — die letzte Stufe ist die bestehende Produktseite).
  it('liest die gültigen Werkzeuge-Stufen vollständig', () => {
    expect(leseBlatt('werkzeuge')).toEqual({ rubrik: 'werkzeuge', pfad: [] });
    expect(leseBlatt('werkzeuge/rechner')).toEqual({ rubrik: 'werkzeuge', pfad: ['rechner'] });
    expect(leseBlatt('werkzeuge/vorlagen')).toEqual({ rubrik: 'werkzeuge', pfad: ['vorlagen'] });
  });

  it('kürzt Unbekanntes auf den längsten gültigen Anfang', () => {
    expect(leseBlatt('gesetze/bund/99')?.pfad).toEqual(['bund']);
    expect(leseBlatt('gesetze/kantone/XX')?.pfad).toEqual(['kantone']);
    expect(leseBlatt('gesetze/mond')?.pfad).toEqual([]);
    expect(leseBlatt('gesetze/international/zu/tief')?.pfad).toEqual(['international']);
    expect(leseBlatt('werkzeuge/mond')?.pfad).toEqual([]);
    expect(leseBlatt('werkzeuge/rechner/zu/tief')?.pfad).toEqual(['rechner']);
  });

  it('Rubriken, die noch nicht aufklappen, und Leeres ergeben «zu»', () => {
    for (const w of [null, undefined, '', '/', 'rechtsprechung', 'materialien', 'unsinn']) {
      expect(leseBlatt(w), String(w)).toBeNull();
    }
  });

  it('Rundlauf lesen → schreiben ist die Identität auf gültigen Orten', () => {
    for (const w of ['gesetze', 'gesetze/bund', 'gesetze/bund/05', 'gesetze/kantone', 'gesetze/kantone/ZH',
      'gesetze/international', 'werkzeuge', 'werkzeuge/rechner', 'werkzeuge/vorlagen']) {
      expect(schreibeBlatt(leseBlatt(w)!)).toBe(w);
    }
  });

  it('eine Stufe höher, und Gleichheit nach Inhalt', () => {
    const o = leseBlatt('gesetze/bund/02')!;
    expect(elternOrt(o)).toEqual({ rubrik: 'gesetze', pfad: ['bund'] });
    expect(elternOrt({ rubrik: 'gesetze', pfad: [] })).toBeNull();
    expect(gleicherOrt(o, leseBlatt('gesetze/bund/02'))).toBe(true);
    expect(gleicherOrt(o, elternOrt(o))).toBe(false);
    expect(gleicherOrt(null, null)).toBe(true);
  });

  // S2: «Rechner» bzw. «Vorlagen» als Pfad-Krume; leer auf der Wahl-Stufe.
  it('blattKrumen der Werkzeuge-Kachel: leer auf der Wahl, «Rechner»/«Vorlagen» je Zweig', () => {
    expect(blattKrumen(leseBlatt('werkzeuge')!)).toEqual([]);
    expect(blattKrumen(leseBlatt('werkzeuge/rechner')!)).toEqual([
      { label: 'Rechner', ort: { rubrik: 'werkzeuge', pfad: ['rechner'] } },
    ]);
    expect(blattKrumen(leseBlatt('werkzeuge/vorlagen')!)).toEqual([
      { label: 'Vorlagen', ort: { rubrik: 'werkzeuge', pfad: ['vorlagen'] } },
    ]);
  });
});
