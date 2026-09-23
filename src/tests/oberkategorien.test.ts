import { describe, expect, it } from 'vitest';
import { KATALOG_KARTEN } from '../lib/startseiteConfig';
import { OBERKATEGORIEN, kategorieFuer } from '../lib/oberkategorien';

// ─── Oberkategorien-Invarianten (Auftrag David 10.6.2026) ───────────────────
// Das Register gliedert primär nach Zuständigkeiten/Fristen/Gebühren/Vorlagen.
// Diese Tests erzwingen: JEDE Karte fällt in GENAU eine Kategorie — eine neue
// Werkzeug-Karte ohne explizite Zuordnung bricht die Suite (kein stilles
// Wegsortieren, §8).

describe('Oberkategorien (Register-Primärachse)', () => {
  it('es gibt genau die vier bestellten Kategorien in fester Reihenfolge', () => {
    expect(OBERKATEGORIEN.map((k) => k.id)).toEqual(['zustaendigkeiten', 'fristen', 'gebuehren', 'vorlagen']);
  });

  it('JEDE Katalog-Karte hat eine Kategorie (Werkzeuge explizit zugeordnet)', () => {
    const ohne = KATALOG_KARTEN.filter((k) => kategorieFuer(k) === null);
    expect(ohne.map((k) => k.id), 'Karten ohne Oberkategorie — Zuordnung in lib/oberkategorien.ts nachführen').toEqual([]);
  });

  it('Stichproben: die Zuordnung folgt dem Output-Typ', () => {
    const kat = (id: string) => kategorieFuer(KATALOG_KARTEN.find((k) => k.id === id)!);
    expect(kat('zustaendigkeit')).toBe('zustaendigkeiten');
    expect(kat('zpo-fristen')).toBe('fristen');
    expect(kat('tagerechner')).toBe('fristen');
    expect(kat('betreibungskosten')).toBe('gebuehren');
    expect(kat('teuerungsrechner')).toBe('gebuehren');
    expect(kat('mietvertrag-wohnen')).toBe('vorlagen');
    expect(kat('ag-gruendung')).toBe('vorlagen');
    expect(kat('mandatsaufnahme')).toBe('vorlagen');
    // K8 (W2·29-WERKBANK-KATALOGE, deklariert §6.3): Entscheid David 23.9.2026
    // «zitierer auf /rechner zeigen» — vorher 'vorlagen' (auf keiner Seite sichtbar).
    expect(kat('gerichtszitat')).toBe('zustaendigkeiten');
  });

  it('jede Kategorie ist nicht leer und enthält mindestens ein verfügbares Werkzeug — ausser sie ist ehrlich leer', () => {
    for (const k of OBERKATEGORIEN) {
      const karten = KATALOG_KARTEN.filter((c) => kategorieFuer(c) === k.id);
      expect(karten.length, k.id).toBeGreaterThan(0);
    }
  });
});
