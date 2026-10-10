import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { serialisiere } from '../../scripts/normtext/entscheide-schreiben';
import {
  projiziereEntscheidIndex, ENTSCHEID_INDEX_FELDER, type EntscheidIndex,
} from '../lib/rechtsprechung/entscheid-index';
import { aufloeseZitierteEntscheide } from '../lib/verzahnung/entscheid-kanten';
import type { BrowseEntscheid, EntscheidManifest } from '../lib/rechtsprechung/register';
import type { EntscheidSnapshotDatei } from '../lib/rechtsprechung/typen';

// ─────────────────────────────────────────────────────────────────────────────
// E0-REGISTER Teil 2 (10.10.2026): entscheid-index.json = schlanke Projektion von
// register.json für Urteils-Leser, Seitenkopf, Reiter und Verzahnung (§15).
// §6-Beweise der Verhaltensneutralität: (a) die Datei IST die Projektion, byte-gleich;
// (b) die Verzahnung löst mit dem Index dasselbe auf wie mit dem ganzen Register.
// ─────────────────────────────────────────────────────────────────────────────

const PUB = join(process.cwd(), 'public', 'rechtsprechung');

// Die Zusatzfelder (`extra`) stehen im Fixture hinter den Basisfeldern; die Feldreihenfolge des echten
// Registers prüft der Bestandstest unten. Randfälle: Datum ≠ Monatserster, Verweis-Eintrag (__voll), datumUnbekannt, quarantaene, richter,
// Dublette bei `nummer`.
const eintrag = (key: string, extra: Record<string, unknown> = {}): BrowseEntscheid => ({
  key, gericht: 'bger', gerichtName: 'Bundesgericht', gerichtstyp: 'bundesgericht', kanton: 'CH',
  nummer: '5A_1_2026', bgeReferenz: null, datum: '2026-03-17', zitierung: `BGer ${key}`,
  leitcharakter: 'routine', regesteVorhanden: false, regesteKurz: null, sachgebiet: 'privat', sprache: 'de',
  normKeys: ['ZGB'], bestand: 'snapshot', kuratierung: 'maschinell', datei: `bund/bger/${key}.json`,
  quelle: 'opencaselaw', quelleUrl: `https://search.bger.ch/${key}`,
  ...extra,
}) as unknown as BrowseEntscheid;

const register = (): EntscheidManifest => ({
  erzeugt: '2026-10-04',
  entscheide: [
    eintrag('a', { richter: [{ s: 'x-y', r: 'vorsitz' }] }),
    eintrag('b', { datumUnbekannt: true, quarantaene: 'Volltext nicht verfügbar' }),
    eintrag('c__voll', { datei: null, verweis: { zielKey: 'c', ansicht: 'voll', bgeReferenz: '150 III 1' } }),
    eintrag('d'),   // gleiche `nummer` wie 'a' (Dublette) — «erster Treffer gewinnt» hängt an der Reihenfolge
  ],
});

/** Unabhängige Erwartung (nicht dieselbe Codezeile wie die Implementierung): Feld-Auswahl per `in`. */
const erwartet = (e: BrowseEntscheid): Record<string, unknown> => {
  const roh = e as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const f of Object.keys(roh)) if ((ENTSCHEID_INDEX_FELDER as readonly string[]).includes(f)) out[f] = roh[f];
  return out;
};

describe('projiziereEntscheidIndex', () => {
  it('behält Eintrags- und Feldreihenfolge des Registers, nur die zehn Index-Felder', () => {
    const idx = projiziereEntscheidIndex(register());
    expect(idx.erzeugt).toBe('2026-10-04');
    expect(idx.entscheide.map((e) => e.key)).toEqual(['a', 'b', 'c__voll', 'd']);
    expect(Object.keys(idx.entscheide[0])).toEqual(
      ['key', 'nummer', 'bgeReferenz', 'datum', 'zitierung', 'leitcharakter', 'datei', 'richter']);
    expect(Object.keys(idx.entscheide[1])).toEqual(
      ['key', 'nummer', 'bgeReferenz', 'datum', 'zitierung', 'leitcharakter', 'datei', 'datumUnbekannt']);
    expect(Object.keys(idx.entscheide[2])).toEqual(
      ['key', 'nummer', 'bgeReferenz', 'datum', 'zitierung', 'leitcharakter', 'datei', 'verweis']);
    expect(idx.entscheide[2]).toMatchObject({ datei: null, verweis: { zielKey: 'c', ansicht: 'voll' } });
  });

  it('optionale Felder nur, wenn das Register sie trägt (nie ein erfundenes Leerfeld, §8)', () => {
    const [a, b, , d] = projiziereEntscheidIndex(register()).entscheide;
    expect(a).not.toHaveProperty('datumUnbekannt');
    expect(a).not.toHaveProperty('verweis');
    expect(b).not.toHaveProperty('richter');
    expect(d).not.toHaveProperty('richter');
    for (const e of [a, b, d]) expect(e).not.toHaveProperty('quarantaene');
  });

  it('ist rein: verändert die Eingabe nicht, zweiter Lauf byte-gleich', () => {
    const r = register();
    const vorher = serialisiere(r);
    const eins = serialisiere(projiziereEntscheidIndex(r));
    expect(serialisiere(r)).toBe(vorher);
    expect(serialisiere(projiziereEntscheidIndex(r))).toBe(eins);
  });
});

describe('committete Dateien register.json + entscheid-index.json', () => {
  const rohReg = readFileSync(join(PUB, 'register.json'), 'utf8');
  const rohIdx = readFileSync(join(PUB, 'entscheid-index.json'), 'utf8');
  const reg = JSON.parse(rohReg) as EntscheidManifest;
  const idx = JSON.parse(rohIdx) as EntscheidIndex;

  it('serialisiere(projiziere(register)) reproduziert die Datei byte-gleich (voller Bestand)', () => {
    expect(serialisiere(projiziereEntscheidIndex(reg))).toBe(rohIdx);
  });

  it('gleiches erzeugt, gleiche Anzahl (inkl. __voll-Verweise), gleiche Reihenfolge', () => {
    expect(idx.erzeugt).toBe(reg.erzeugt);
    expect(reg.entscheide.length).toBeGreaterThan(6000);
    expect(idx.entscheide.length).toBe(reg.entscheide.length);
    expect(idx.entscheide.map((e) => e.key)).toEqual(reg.entscheide.map((e) => e.key));
    expect(idx.entscheide.filter((e) => e.verweis).length)
      .toBe(reg.entscheide.filter((e) => e.verweis).length);
    expect(idx.entscheide.filter((e) => e.verweis).length).toBeGreaterThan(1000);
  });

  it('jede Zeile ist genau die Auswahl der zehn Felder des Register-Eintrags (Werte und Feldreihenfolge)', () => {
    for (let i = 0; i < reg.entscheide.length; i++) {
      expect(Object.entries(idx.entscheide[i]), reg.entscheide[i].key)
        .toEqual(Object.entries(erwartet(reg.entscheide[i])));
    }
  });

  it('Dubletten bei `nummer` stehen im Index in derselben Reihenfolge wie im Register', () => {
    const nummern = (liste: { nummer: string; key: string }[]) => {
      const m = new Map<string, string[]>();
      for (const e of liste) m.set(e.nummer, [...(m.get(e.nummer) ?? []), e.key]);
      return [...m].filter(([, k]) => k.length > 1);
    };
    const dubl = nummern(reg.entscheide);
    expect(dubl.length).toBeGreaterThan(0);
    expect(nummern(idx.entscheide)).toEqual(dubl);
  });
});

describe('Verzahnung: aufloeseZitierteEntscheide mit Index ≡ mit Register', () => {
  it('Dubletten-Fixture: erster Treffer gewinnt, Verweis-Einträge werden übersprungen', () => {
    const r = register();
    const idx = projiziereEntscheidIndex(r);
    const z = ['5A_1_2026', 'BGE 150 III 1'];
    const mitReg = aufloeseZitierteEntscheide(z, r.entscheide, [], 'selbst');
    const mitIdx = aufloeseZitierteEntscheide(z, idx.entscheide, [], 'selbst');
    expect(mitIdx).toEqual(mitReg);
    expect(mitIdx.kanten.find((k) => k.zitat === '5A_1_2026')?.ziel?.key).toBe('a');
  });

  it('alle Volltexte mit zitierteEntscheide des Bestands: identische Auflösung (Register vs. Index)', () => {
    const reg = JSON.parse(readFileSync(join(PUB, 'register.json'), 'utf8')) as EntscheidManifest;
    const idx = JSON.parse(readFileSync(join(PUB, 'entscheid-index.json'), 'utf8')) as EntscheidIndex;
    let geprueft = 0;
    let aufgeloest = 0;
    for (const e of reg.entscheide) {
      if (!e.datei) continue;
      const roh = readFileSync(join(PUB, e.datei), 'utf8');
      if (!roh.includes('"zitierteEntscheide"')) continue;   // Vorsieb: JSON.parse nur, wo es etwas zu lösen gibt
      const snap = (JSON.parse(roh) as EntscheidSnapshotDatei).eintraege[0];
      const z = snap.zitierteEntscheide ?? [];
      if (z.length === 0) continue;
      const mitReg = aufloeseZitierteEntscheide(z, reg.entscheide, snap.abschnitte, e.key);
      const mitIdx = aufloeseZitierteEntscheide(z, idx.entscheide, snap.abschnitte, e.key);
      expect(mitIdx, e.key).toEqual(mitReg);
      geprueft++;
      aufgeloest += mitReg.imKorpus;
    }
    // Wächter gegen ein leeres Tor (§6.7): der Bestand trägt über 1000 solche Volltexte und aufgelöste Kanten.
    expect(geprueft).toBeGreaterThan(1000);
    expect(aufgeloest).toBeGreaterThan(1000);
  }, 120_000);
});
