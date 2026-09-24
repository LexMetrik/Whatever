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

  // S3 (23.9.2026): Materialien klappt jetzt auf — sofort Suche, KEINE
  // Unterstufen («die Suche IST die Stufe», Fahrplan §5d). Ein Pfad dahinter
  // wird darum immer auf [] gekürzt, nicht auf einen (nicht existenten) Anfang.
  it('Materialien: sofort aufklappbar, ohne Unterstufen', () => {
    expect(leseBlatt('materialien')).toEqual({ rubrik: 'materialien', pfad: [] });
    expect(leseBlatt('materialien/irgendwas')).toEqual({ rubrik: 'materialien', pfad: [] });
  });

  // S3-Nachzug (24.9.2026, Entscheid David «Beim Öffnen laden»): Rechtsprechung
  // klappt jetzt ebenfalls auf — dieselbe Regel wie Materialien (sofort Suche,
  // keine Unterstufen, ein Pfad dahinter wird auf [] gekürzt).
  it('Rechtsprechung: sofort aufklappbar, ohne Unterstufen', () => {
    expect(leseBlatt('rechtsprechung')).toEqual({ rubrik: 'rechtsprechung', pfad: [] });
    expect(leseBlatt('rechtsprechung/irgendwas')).toEqual({ rubrik: 'rechtsprechung', pfad: [] });
  });

  it('Unbekanntes und Leeres ergeben «zu» (seit S3 klappen alle vier Rubriken auf)', () => {
    for (const w of [null, undefined, '', '/', 'unsinn']) {
      expect(leseBlatt(w), String(w)).toBeNull();
    }
  });

  it('Rundlauf lesen → schreiben ist die Identität auf gültigen Orten', () => {
    for (const w of ['gesetze', 'gesetze/bund', 'gesetze/bund/05', 'gesetze/kantone', 'gesetze/kantone/ZH',
      'gesetze/international', 'werkzeuge', 'werkzeuge/rechner', 'werkzeuge/vorlagen', 'materialien', 'rechtsprechung']) {
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
