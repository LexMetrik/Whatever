// ─── BS-Delta (entscheide:bs --delta): nur neue/aktualisierte Keys, Rest byte-treu ─
//
// Regressionsanker für den Wurzel-Fix 25.9.2026 (Posten «entscheide:bs --delta:
// nur neue und aktualisierte Dokumente parsen», Gegenprüfung PR #1099): der
// frühere Delta-Lauf reichte das ganze Inventar an Fetch und Parse weiter und
// stempelte damit jeden Bestands-Snapshot um (`abgerufen` = Laufdatum). Netzfrei,
// gegen die golden fixtures unter scripts/rechtsprechung/fixtures/.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { parseBsDokument, baueSnapshot, docketSafeVergabe, type ParseErgebnis } from '../../scripts/rechtsprechung/bs-parse';
import { planeBsDelta, zuHolen, fuehreBsDeltaZusammen, docketSafeDelta, bsKeyVon } from '../../scripts/rechtsprechung/bs-delta';
import { serialisiere } from '../../scripts/normtext/entscheide-schreiben';
import type { Inventar, InventarZeile } from '../../scripts/rechtsprechung/bs-inventar';
import type { EntscheidSnapshot } from '../../src/lib/rechtsprechung/typen';

const FIX = join(process.cwd(), 'scripts', 'rechtsprechung', 'fixtures');
const parse = (name: string) => parseBsDokument(readFileSync(join(FIX, name)));

const zeileAus = (p: ParseErgebnis, key: number): InventarZeile => ({
  key, gn: p.gn, gnSekundaer: p.gnSekundaer, datum: p.datum, titel: p.titel,
  erstpublikation: p.erstpublikation, aktualisiert: p.aktualisiert,
});
const inventar = (eintraege: InventarZeile[]): Inventar => ({
  erzeugt: '2026-09-25', quelle: 'test', portal: { gesamtN: eintraege.length, jahre: {} }, eintraege,
});

// Bestand: zwei BS-Snapshots vom Vollimport 19.7.2026 + ein Nicht-BS-Snapshot.
const pA = parse('ag-2024-3.html');
const pB = parse('zg-k5-2023-13.html');
const pNeu = parse('ag-bez-2024-79.html');
const zA = zeileAus(pA, 1001);
const zB = zeileAus(pB, 1002);
const zNeu = zeileAus(pNeu, 1003);
const bestandBauen = (): EntscheidSnapshot[] => [
  { id: 'bund/bge/X', quelle: 'bger-bge', quelleUrl: 'https://example.invalid/bge' } as unknown as EntscheidSnapshot,
  baueSnapshot(pA, zA, pA.gn, '2026-07-19'),
  baueSnapshot(pB, zB, pB.gn, '2026-07-19'),
];

describe('BS-Delta: Plan Soll (Inventar) ↔ Ist (Korpus)', () => {
  it('unveränderter Eintrag wird weder geholt noch neu gebaut — Snapshot byte-gleich, abgerufen unverändert', () => {
    const bestand = bestandBauen();
    const vorher = serialisiere(bestand[1]);
    const plan = planeBsDelta(inventar([zA, zB, zNeu]), bestand);
    expect(plan.neu.map((z) => z.key)).toEqual([1003]);
    expect(plan.aktualisiert).toEqual([]);
    expect(plan.unveraendert).toBe(2);
    expect(plan.takedown).toEqual([]);
    expect(zuHolen(plan).map((z) => z.key)).toEqual([1003]);

    const neu = baueSnapshot(pNeu, zNeu, pNeu.gn, '2026-09-25');
    const out = fuehreBsDeltaZusammen(bestand, plan, [neu]);
    expect(out[1]).toBe(bestand[1]);                 // dasselbe Objekt, keine Neu-Assemblierung
    expect(serialisiere(out[1])).toBe(vorher);       // byte-gleich
    expect(out[1].abgerufen).toBe('2026-07-19');     // kein Umstempeln aufs Laufdatum
    expect(out.map((s) => s.id)).toEqual([bestand[0].id, bestand[1].id, bestand[2].id, neu.id]);
  });

  it('aktualisiert (Portal-Aktualisierungsdatum neuer): geholt und AN SEINER STELLE ersetzt', () => {
    const bestand = bestandBauen();
    const zAneu = { ...zA, aktualisiert: '2026-09-17' };
    const plan = planeBsDelta(inventar([zAneu, zB]), bestand);
    expect(plan.aktualisiert.map((a) => [a.z.key, a.gruende])).toEqual([[1001, [`aktualisiert ${zA.aktualisiert}→2026-09-17`]]]);
    expect(zuHolen(plan).map((z) => z.key)).toEqual([1001]);
    const ersatz = baueSnapshot({ ...pA, aktualisiert: '2026-09-17' }, zAneu, pA.gn, '2026-09-25');
    const out = fuehreBsDeltaZusammen(bestand, plan, [ersatz]);
    expect(out[1]).toBe(ersatz);
    expect(out[2]).toBe(bestand[2]);
    expect(out).toHaveLength(3);
  });

  it('Takedown: aus dem Inventar verschwundener Key wird entfernt und ausgewiesen', () => {
    const bestand = bestandBauen();
    const plan = planeBsDelta(inventar([zA]), bestand);
    expect(plan.takedown.map((s) => bsKeyVon(s))).toEqual([1002]);
    const out = fuehreBsDeltaZusammen(bestand, plan, []);
    expect(out.map((s) => s.id)).toEqual([bestand[0].id, bestand[1].id]);
  });

  it('docketSafe über die VOLLE Gruppe: neues Dokument mit Bestands-GN bekommt das Suffix', () => {
    const bestand = bestandBauen();
    const spaeter = `${Number(pA.datum!.slice(0, 4)) + 1}${pA.datum!.slice(4)}`;
    const zDup = { ...zA, key: 1004, datum: spaeter };
    const safes = docketSafeDelta([{ p: { ...pA, datum: spaeter }, z: zDup }], bestand, inventar([zA, zB, zDup]), docketSafeVergabe);
    expect(safes.get(1004)).toBe(`${pA.gn}-${spaeter.replace(/-/g, '')}`);
    expect(safes.has(1001)).toBe(false);   // Bestand bleibt, wird nicht neu vergeben
  });

  it('docketSafe fail-closed: verschöbe ein neues, früheres Dokument die id eines unveränderten', () => {
    const bestand = bestandBauen();
    const frueher = `${Number(pA.datum!.slice(0, 4)) - 1}${pA.datum!.slice(4)}`;
    const zDup = { ...zA, key: 1004, datum: frueher };
    expect(() => docketSafeDelta([{ p: { ...pA, datum: frueher }, z: zDup }], bestand, inventar([zA, zB, zDup]), docketSafeVergabe))
      .toThrow(/id-Verschiebung im Bestand/);
  });
});
