// scripts/analyse/prozess-kennzahlen.test.ts — Spec der Prozess-Zeitreihe.
//
// Geprüft wird der Rechenweg, nicht die git-Beschaffung. Wichtigster Fall: die
// Pfad-Regel (seit 5.10.2026 statt Betreff-Muster, Begründung im Skript-Kopf).
import { describe, expect, it } from 'vitest';
import {
  SPALTEN,
  csvZeile,
  istProzessCommit,
  mischeZeilen,
  parseCsv,
  stichtage,
  type Zeile,
} from './prozess-kennzahlen.ts';

const zeile = (datum: string, tore = 0): Zeile => ({
  datum,
  claude_md_zeilen: 1,
  skills_zeilen: 2,
  rules_zeilen: 3,
  tore,
  hooks: 4,
  commits_30d: 5,
  prozess_commits_30d: 6,
  roadmap_bytes: 7,
  steuerflaeche_bytes: 8,
});

describe('istProzessCommit (Pfad-Regel)', () => {
  it('reiner Plan-Commit zählt als Prozess', () => {
    expect(istProzessCommit(['ROADMAP.md', 'plan/posten/x.md'])).toBe(true);
  });

  it('Skill + Hook zählen als Prozess', () => {
    expect(istProzessCommit(['.claude/skills/lehren/SKILL.md', '.claude/hooks/tor-schutz.py'])).toBe(true);
  });

  it('gemischter Commit (Feature + ROADMAP-Nachführung) zählt als Produkt', () => {
    expect(istProzessCommit(['src/lib/x.ts', 'ROADMAP.md'])).toBe(false);
  });

  it('reiner Daten-Commit zählt nicht als Prozess', () => {
    expect(istProzessCommit(['public/normtext/bund/x.json'])).toBe(false);
  });

  it('leere Pfadliste zählt nicht als Prozess', () => {
    expect(istProzessCommit([])).toBe(false);
  });

  it('Rechtsschutz-Datei folgt istFlaeche und zählt nicht als Prozess', () => {
    expect(istProzessCommit(['scripts/check-gegenpruefung.ts'])).toBe(false);
  });

  it('der Test eines Steuerungs-Skripts zählt als Prozess', () => {
    expect(istProzessCommit(['scripts/analyse/foo.test.ts'])).toBe(true);
    expect(istProzessCommit(['src/lib/foo.test.ts'])).toBe(false);
  });

  it('Messwerte-Dateien und Plan-Ordner sind Prozess-Pfade, andere messwerte nicht', () => {
    expect(istProzessCommit(['messwerte/prozess-kennzahlen.csv', 'messwerte/steuerflaeche.json', 'fahrplaene/x.md', 'archiv/y.md'])).toBe(true);
    expect(istProzessCommit(['messwerte/tor-bewaehrung.json'])).toBe(false);
  });
});

describe('stichtage', () => {
  it('liefert den 1. und 15. jedes Monats und hört am Stichtag auf', () => {
    expect(stichtage('2026-07-01', '2026-09-15')).toEqual([
      '2026-07-01', '2026-07-15', '2026-08-01', '2026-08-15', '2026-09-01', '2026-09-15',
    ]);
  });

  it('überspringt Tage vor dem Start und läuft über den Jahreswechsel', () => {
    expect(stichtage('2026-12-10', '2027-01-15')).toEqual(['2026-12-15', '2027-01-01', '2027-01-15']);
  });
});

describe('mischeZeilen', () => {
  it('ist idempotent je Datum: der zweite Lauf am selben Tag ersetzt, statt zu doppeln', () => {
    const alt = [zeile('2026-09-15', 88)];
    const gemischt = mischeZeilen(alt, [zeile('2026-09-15', 90)]);
    expect(gemischt).toHaveLength(1);
    expect(gemischt[0].tore).toBe(90);
  });

  it('sortiert nach Datum, unabhängig von der Eingabereihenfolge', () => {
    const gemischt = mischeZeilen([zeile('2026-09-01')], [zeile('2026-08-15'), zeile('2026-09-15')]);
    expect(gemischt.map((z) => z.datum)).toEqual(['2026-08-15', '2026-09-01', '2026-09-15']);
  });
});

describe('CSV-Rundlauf', () => {
  it('liest zurück, was es geschrieben hat', () => {
    const zeilen = [zeile('2026-08-15', 64), zeile('2026-09-15', 88)];
    const text = [SPALTEN.join(','), ...zeilen.map(csvZeile)].join('\n');
    const gelesen = parseCsv(text);
    expect(gelesen).toHaveLength(2);
    expect(gelesen[1].datum).toBe('2026-09-15');
    expect(gelesen[1].tore).toBe('88');
  });

  it('verträgt eine leere Datei', () => {
    expect(parseCsv('')).toEqual([]);
  });
});
