// scripts/analyse/prozess-kennzahlen.test.ts — Spec der Prozess-Zeitreihe.
//
// Geprüft wird der Rechenweg, nicht die git-Beschaffung. Der wichtigste Fall
// ist die Heuristik: sie weicht bewusst vom Auftrag ab (Substring → Wortgrenze,
// Begründung im Skript-Kopf), und genau diese Abweichung muss festgenagelt
// sein — sonst gleitet sie bei der nächsten Berührung stillschweigend zurück.
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
});

describe('istProzessCommit', () => {
  it('erkennt echte Prozess-Commits', () => {
    for (const s of [
      'QS-BEWAEHRUNG: Tor-Register',
      'STEUER-DOKU: Lehre F15 verankert',
      'feat: neues Tor check:zaehler',
      'fix(hooks): tor-schutz.py meldet Pfad',
      'QS-EFFIZIENZ 3: Tore entschlackt',
    ]) {
      expect(istProzessCommit(s), s).toBe(true);
    }
  });

  it('zählt einen refactor-Commit NICHT als Prozess-Commit — das ist der Kern der Abweichung', () => {
    const s = 'refactor(entstehung): synopse.ts unter 800 Zeilen';
    expect(istProzessCommit(s)).toBe(false);
    // Und dies ist der Beleg, dass die Auftrags-Variante ihn fälschlich nähme:
    expect(istProzessCommit(s, true)).toBe(true);
  });

  it('fällt nicht auf «tor» im Wortinneren herein', () => {
    for (const s of ['W2: Historie-Block je Artikel', 'Bump deps across 1 directory', 'Autor-Feld ergänzt']) {
      expect(istProzessCommit(s), s).toBe(false);
      expect(istProzessCommit(s, true), `${s} (roh)`).toBe(true);
    }
  });

  it('nimmt Tor auch in Zusammensetzungen mit Bindestrich', () => {
    expect(istProzessCommit('Tor-Parität geschärft')).toBe(true);
    expect(istProzessCommit('Zwei neue Tore verdrahtet')).toBe(true);
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
