import { describe, expect, it } from 'vitest';
import { KATALOG_KARTEN } from '../lib/startseiteConfig';
import { OBERKATEGORIEN, kategorieFuer } from '../lib/oberkategorien';
import { kartenDerKategorie } from '../lib/katalogKategorie';
import { istVorlage } from '../lib/vorlagenKategorie';

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
    // S5a (W2·29-WERKBANK-REST, deklariert §6.3): vorher 'vorlagen' — eine
    // Werkzeug-Karte (modus 'rechner') dort stand nur als geplante sichtbar,
    // fertig auf keiner Katalogseite. Jetzt Rechner-Seite wie `gerichtszitat`.
    expect(kat('mandatsaufnahme')).toBe('zustaendigkeiten');
    expect(kat('checklisten')).toBe('zustaendigkeiten');
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

// ─── Eine Quelle für Rechner | Vorlagen (W2·29-WERKBANK-REST S5a, 25.9.2026) ─
//
// Die Vorlagen-Seite, das Werkzeuge-Blatt und die Kopf-Zähler (gen:zaehler)
// teilen den Katalog nach `istVorlage`; die Register-Listen nach
// `kategorieFuer`/`kartenDerKategorie`. Beide Schnitte müssen dieselbe Menge
// ergeben — sonst steht eine Karte in einer Liste, deren Zahl sie nicht zählt,
// oder (fertige Werkzeug-Karte in `vorlagen`) auf gar keiner Katalogseite.
describe('Rechner | Vorlagen: Liste und Zähler aus einer Quelle', () => {
  it('Kategorie «vorlagen» ≡ istVorlage (auch über den Fallback von kartenDerKategorie)', () => {
    const ids = (xs: { id: string }[]) => xs.map((k) => k.id).sort();
    expect(ids(kartenDerKategorie(KATALOG_KARTEN, 'vorlagen'))).toEqual(ids(KATALOG_KARTEN.filter(istVorlage)));
    expect(KATALOG_KARTEN.filter((k) => !istVorlage(k) && kategorieFuer(k) === 'vorlagen').map((k) => k.id)).toEqual([]);
  });
});
