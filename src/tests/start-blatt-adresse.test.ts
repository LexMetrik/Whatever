import { describe, it, expect } from 'vitest';
import { leseBlatt, schreibeBlatt, elternOrt, gleicherOrt, blattKrumen, WERKZEUGE_RECHNER_KATEGORIEN, WERKZEUGE_VORLAGEN_GEBIETE } from '../lib/startBlatt';
import { KATALOG_KARTEN, istVerfuegbar } from '../lib/startseiteConfig';
import { istVorlage } from '../lib/vorlagenKategorie';
import { kartenDerKategorie } from '../lib/katalogKategorie';
import { STARTSEITE_ZAEHLER } from '../data/startseiteZaehler.generated';
import { INTERNATIONAL_GRUPPEN } from '../lib/normtext/international-rubriken';

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

  // START-UEBERARBEITUNG U1 (24.9.2026): die International-Spalte der Wahl
  // führt direkt in EINE Rubrik — eigene Adresse, Browser-Zurück = eine Stufe.
  it('International-Rubrik als eigene Stufe; unbekannte Rubrik kürzt auf «international»', () => {
    for (const g of INTERNATIONAL_GRUPPEN) {
      const w = `gesetze/international/${g.id}`;
      expect(leseBlatt(w)).toEqual({ rubrik: 'gesetze', pfad: ['international', g.id] });
      expect(schreibeBlatt(leseBlatt(w)!)).toBe(w);
      expect(blattKrumen(leseBlatt(w)!)).toEqual([
        { label: 'International', ort: { rubrik: 'gesetze', pfad: ['international'] } },
        { label: g.titel, ort: { rubrik: 'gesetze', pfad: ['international', g.id] } },
      ]);
    }
    expect(leseBlatt('gesetze/international/mond')?.pfad).toEqual(['international']);
    expect(elternOrt(leseBlatt('gesetze/international/menschenrechte')!)).toEqual({ rubrik: 'gesetze', pfad: ['international'] });
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

// START-UEBERARBEITUNG U8 (David 24.9.2026 «mach danach das werkzeuge-blatt
// gleich wie gesetze»): die Werkzeuge-Wahl führt direkt in EINE Rechner-
// Kategorie bzw. EIN Vorlagen-Rechtsgebiet — eigene Adresse, unbekannte ID
// kürzt auf die Liste, Pfad-Leiste mit Titel.
describe('Startseite · Werkzeuge-Gebietsstufen (U8)', () => {
  it('Rechner-Kategorie und Vorlagen-Gebiet als eigene Stufe, Rundlauf und Pfad', () => {
    expect(WERKZEUGE_RECHNER_KATEGORIEN.map((k) => k.id)).toEqual(['zustaendigkeiten', 'fristen', 'gebuehren']);
    for (const k of WERKZEUGE_RECHNER_KATEGORIEN) {
      const w = `werkzeuge/rechner/${k.id}`;
      expect(leseBlatt(w)).toEqual({ rubrik: 'werkzeuge', pfad: ['rechner', k.id] });
      expect(schreibeBlatt(leseBlatt(w)!)).toBe(w);
      expect(blattKrumen(leseBlatt(w)!)).toEqual([
        { label: 'Rechner', ort: { rubrik: 'werkzeuge', pfad: ['rechner'] } },
        { label: k.titel, ort: { rubrik: 'werkzeuge', pfad: ['rechner', k.id] } },
      ]);
    }
    expect(WERKZEUGE_VORLAGEN_GEBIETE.length).toBeGreaterThan(0);
    for (const g of WERKZEUGE_VORLAGEN_GEBIETE) {
      const w = `werkzeuge/vorlagen/${g.id}`;
      expect(leseBlatt(w)).toEqual({ rubrik: 'werkzeuge', pfad: ['vorlagen', g.id] });
      expect(schreibeBlatt(leseBlatt(w)!)).toBe(w);
      expect(blattKrumen(leseBlatt(w)!)[1]).toEqual({ label: g.name, ort: { rubrik: 'werkzeuge', pfad: ['vorlagen', g.id] } });
    }
  });

  it('unbekannte oder fremde ID kürzt auf die Liste', () => {
    expect(leseBlatt('werkzeuge/vorlagen/mond')?.pfad).toEqual(['vorlagen']);
    // Kategorie-ID im Vorlagen-Zweig und umgekehrt: keine Kreuzung der Achsen.
    expect(leseBlatt('werkzeuge/vorlagen/fristen')?.pfad).toEqual(['vorlagen']);
    expect(leseBlatt('werkzeuge/rechner/vorlagen')?.pfad).toEqual(['rechner']);
    expect(leseBlatt('werkzeuge/rechner/familienrecht')?.pfad).toEqual(['rechner']);
    expect(leseBlatt('werkzeuge/rechner/fristen/zu/tief')?.pfad).toEqual(['rechner', 'fristen']);
    expect(blattKrumen(leseBlatt('werkzeuge/vorlagen/mond')!)).toEqual([
      { label: 'Vorlagen', ort: { rubrik: 'werkzeuge', pfad: ['vorlagen'] } },
    ]);
  });

  // §5/§8: die Gebiets-Achse ist DIESELBE wie der Rechtsgebiet-Filter auf
  // /vorlagen — jede echte Vorlage fällt in ein angebotenes Gebiet, und die
  // Spalten-Zahlen summieren sich zum Kachel-Zähler (gezählt, nicht
  // behauptet). Rot, wenn eine Vorlage ein Rechtsgebiet ausserhalb von
  // RECHTSGEBIET_SEKTIONEN trägt (sie verschwände sonst still aus der Wahl).
  it('jede Vorlage liegt in einem Gebiet der Wahl; Summen = Kachel-Zähler', () => {
    const namen = new Set(WERKZEUGE_VORLAGEN_GEBIETE.map((g) => g.name));
    const vorlagen = KATALOG_KARTEN.filter(istVorlage);
    for (const v of vorlagen) expect(namen.has(v.rechtsgebiet), `${v.id}: ${v.rechtsgebiet}`).toBe(true);
    expect(vorlagen.filter(istVerfuegbar).length).toBe(STARTSEITE_ZAEHLER.vorlagen);
    const rechner = WERKZEUGE_RECHNER_KATEGORIEN
      .reduce((n, k) => n + kartenDerKategorie(KATALOG_KARTEN, k.id).filter(istVerfuegbar).length, 0);
    expect(rechner).toBe(STARTSEITE_ZAEHLER.rechner);
  });
});
