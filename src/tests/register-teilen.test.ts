import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { teileRegister, vereinigeRegister } from '../../scripts/normtext/register-teilen';
import { serialisiere } from '../../scripts/normtext/entscheide-schreiben';
import type {
  EntscheidManifest, EntscheidManifestVoll, EntscheidProvenienzRegister, BrowseEntscheidVoll,
} from '../lib/rechtsprechung/register';

// ─────────────────────────────────────────────────────────────────────────────
// E0-REGISTER (10.10.2026): register.json → Kern + register-provenienz.json.
// §6-Beweis der Verhaltensneutralität: teile ∘ vereinige ist die Identität, und
// vereinige(kern, provenienz) serialisiert byte-gleich zum Register VOR der
// Aufteilung (einmalig per `cmp` gegen `git show main:…` geführt, Bericht E0).
// ─────────────────────────────────────────────────────────────────────────────

const PUB = join(process.cwd(), 'public', 'rechtsprechung');

// Randfälle: Datum ≠ Monatserster, Verweis-Eintrag (__voll), datumUnbekannt, quarantaene, richter.
const eintrag = (key: string, extra: Record<string, unknown> = {}): BrowseEntscheidVoll => ({
  key, gericht: 'bger', gerichtName: 'Bundesgericht', gerichtstyp: 'bundesgericht', kanton: 'CH',
  nummer: '5A_1_2026', bgeReferenz: null, datum: '2026-03-17', zitierung: `BGer ${key}`,
  leitcharakter: 'routine', regesteVorhanden: false, regesteKurz: null, sachgebiet: 'privat', sprache: 'de',
  normKeys: ['ZGB'], bestand: 'snapshot', kuratierung: 'maschinell', datei: `bund/bger/${key}.json`,
  quelle: 'opencaselaw', quelleUrl: `https://search.bger.ch/${key}`, fassungsToken: `tok-${key}`,
  ...extra,
}) as unknown as BrowseEntscheidVoll;

const voll = (): EntscheidManifestVoll => ({
  erzeugt: '2026-10-04',
  entscheide: [
    eintrag('a', { richter: [{ s: 'x-y', r: 'vorsitz' }] }),
    eintrag('b', { datumUnbekannt: true, quarantaene: 'Volltext nicht verfügbar' }),
    eintrag('c__voll', { datei: null, verweis: { zielKey: 'c', ansicht: 'voll', bgeReferenz: '150 III 1' } }),
  ],
});

describe('teileRegister / vereinigeRegister', () => {
  it('Roundtrip auf Fixture ist byte-gleich unter serialisiere()', () => {
    const v = voll();
    const { kern, provenienz } = teileRegister(v);
    expect(serialisiere(vereinigeRegister(kern, provenienz))).toBe(serialisiere(v));
  });

  it('Kern trägt fassungsToken nicht mehr, behält quelleUrl; Provenienz trägt nur fassungsToken in Kern-Reihenfolge', () => {
    const { kern, provenienz } = teileRegister(voll());
    for (const e of kern.entscheide) {
      expect(e).not.toHaveProperty('fassungsToken');
      expect(e.quelleUrl).toMatch(/^https:\/\/search\.bger\.ch\//);
    }
    expect(Object.keys(provenienz.eintraege)).toEqual(['a', 'b', 'c__voll']);
    expect(provenienz.eintraege.b).toEqual({ fassungsToken: 'tok-b' });
    expect(provenienz.erzeugt).toBe(kern.erzeugt);
  });

  it('fassungsToken steht nach der Vereinigung unmittelbar hinter quelleUrl (Feldreihenfolge des Originals)', () => {
    const { kern, provenienz } = teileRegister(voll());
    for (const e of vereinigeRegister(kern, provenienz).entscheide) {
      const k = Object.keys(e);
      expect(k[k.indexOf('quelleUrl') + 1]).toBe('fassungsToken');
    }
  });

  it('teileRegister ist rein: verändert die Eingabe nicht', () => {
    const v = voll();
    const vorher = serialisiere(v);
    teileRegister(v);
    expect(serialisiere(v)).toBe(vorher);
  });

  it('wirft bei fehlendem Provenienz-Eintrag, Waise, abweichendem erzeugt und doppeltem key', () => {
    const { kern, provenienz } = teileRegister(voll());
    const ohne: EntscheidProvenienzRegister = { ...provenienz, eintraege: { ...provenienz.eintraege } };
    delete ohne.eintraege.b;
    expect(() => vereinigeRegister(kern, ohne)).toThrow(/«b» ohne Provenienz-Eintrag/);
    const waise: EntscheidProvenienzRegister = { ...provenienz, eintraege: { ...provenienz.eintraege, z: { fassungsToken: 't' } } };
    expect(() => vereinigeRegister(kern, waise)).toThrow(/ohne Kern-Eintrag: z/);
    expect(() => vereinigeRegister(kern, { ...provenienz, erzeugt: '2026-10-05' })).toThrow(/erzeugt weicht ab/);
    const doppelt = voll();
    doppelt.entscheide.push(eintrag('a'));
    expect(() => teileRegister(doppelt)).toThrow(/doppelter key «a»/);
  });
});

describe('committete Dateien register.json + register-provenienz.json', () => {
  const rohKern = readFileSync(join(PUB, 'register.json'), 'utf8');
  const rohProv = readFileSync(join(PUB, 'register-provenienz.json'), 'utf8');
  const kern = JSON.parse(rohKern) as EntscheidManifest;
  const prov = JSON.parse(rohProv) as EntscheidProvenienzRegister;

  it('teile(vereinige(kern, prov)) reproduziert BEIDE Dateien byte-gleich (voller Bestand)', () => {
    const neu = teileRegister(vereinigeRegister(kern, prov));
    expect(serialisiere(neu.kern)).toBe(rohKern);
    expect(serialisiere(neu.provenienz)).toBe(rohProv);
  });

  it('Provenienz deckt jeden Kern-Key genau einmal, in Kern-Reihenfolge, mit nicht-leerem fassungsToken', () => {
    expect(kern.entscheide.length).toBeGreaterThan(6000);
    expect(Object.keys(prov.eintraege)).toEqual(kern.entscheide.map((e) => e.key));
    expect(Object.values(prov.eintraege).filter((p) => !p.fassungsToken)).toEqual([]);
    expect(prov.erzeugt).toBe(kern.erzeugt);
  });

  it('kein Kern-Eintrag trägt fassungsToken; jeder trägt quelleUrl (Karten-Link «↗ amtlich»)', () => {
    expect(kern.entscheide.filter((e) => 'fassungsToken' in e)).toEqual([]);
    expect(kern.entscheide.filter((e) => !e.quelleUrl)).toEqual([]);
  });
});
