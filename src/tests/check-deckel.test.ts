// Reine Logik von check:deckel (scripts/check-deckel-kern.ts): Fläche, Klinke, Nachziehen.
import { describe, expect, it } from 'vitest';
import {
  istDeckelFlaeche, klinkeUrteil, nachziehen, nachziehGrenze, woerter, type Deckel,
} from '../../scripts/check-deckel-kern';

const d = (g: number): Deckel => ({ grenze_woerter: g, gesetzt: 't', flaechen: [] });

describe('check:deckel — Fläche', () => {
  it.each([
    'ROADMAP.md',
    '.claude/hooks/tor-schutz.py',
    'fahrplaene/FAHRPLAN-RECHTSLOGIK.md',
    'plan/FEHLERBESTAND.md',
    'bibliothek/methodik/fristen.md',
  ])('zählt %s', (p) => expect(istDeckelFlaeche(p)).toBe(true));

  it.each([
    'bibliothek/register/gegenpruefung-register.md',
    'bibliothek/normen/or.md',
    'src/tests/check-deckel.test.ts',
    '.claude/hooks/x.test.ts',
    'src/lib/fristen.ts',
    'abnahme/protokoll.json',
  ])('zählt %s nicht', (p) => expect(istDeckelFlaeche(p)).toBe(false));
});

describe('check:deckel — Wörter', () => {
  it('wc -w-Semantik: ASCII-Whitespace trennt, Mehrfach-Leerraum zählt nicht doppelt', () => {
    expect(woerter('  Art. 5\tURG\n\nkeine  Kommentare  ')).toBe(5);
    expect(woerter('')).toBe(0);
  });
});

describe('check:deckel — Sperrklinke', () => {
  it('Anhebung gegenüber der Basis ist rot', () => {
    expect(klinkeUrteil(d(1001), d(1000))).toMatch(/angehoben/);
  });
  it('Senkung und Gleichstand sind grün; ohne Basis ungeprüft', () => {
    expect(klinkeUrteil(d(900), d(1000))).toBeNull();
    expect(klinkeUrteil(d(1000), d(1000))).toBeNull();
    expect(klinkeUrteil(d(5000), null)).toBeNull();
  });
});

describe('check:deckel — Nachziehen', () => {
  it('Ist + 5 % auf volle 100 aufgerundet', () => {
    expect(nachziehGrenze(1000)).toBe(1100); // 1050 → 1100
    expect(nachziehGrenze(1904)).toBe(2000); // 1999.2 → 2000
    expect(nachziehGrenze(1905)).toBe(2100); // 2000.25 → 2100
    expect(nachziehGrenze(2000)).toBe(2100); // genau 2100 bleibt 2100
    expect(nachziehGrenze(0)).toBe(0);
  });
  it('senkt nur, setzt bei Erstanlage', () => {
    expect(nachziehen(1000, 2000)).toBe(1100);
    expect(nachziehen(1000, 1100)).toBeNull();
    expect(nachziehen(1000, 1050)).toBeNull();
    expect(nachziehen(1000, null)).toBe(1100);
  });
});
