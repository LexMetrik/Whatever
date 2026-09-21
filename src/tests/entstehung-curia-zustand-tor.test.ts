// Rot-/Grün-Beweise (§6.7) für Ziffer (3) von `check:entstehung` — scripts/entstehung/curia-tor.ts.
// Alles gegen TEMP-Daten: ein Hand-Edit der echten JSONL löste zuerst den sha-Fehler aus und
// bewiese das falsche Tor. Darum prüft jeder Rot-Fall zusätzlich, dass der sha-Fehler NICHT feuert.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { leseCuriaZustand, CURIA_DIR, type CuriaZustand } from '../../scripts/entstehung/curia-zustand.ts';
import {
  pruefeCuriaBestand, pruefeCuriaSchrumpf, bestimmeCuriaVorstand,
  type CuriaVorstand, type CuriaSchrumpfAusnahme,
} from '../../scripts/entstehung/curia-tor.ts';

const SHA_FEHLER = /sha weicht vom Zustandsträger ab/;

let tmp: string;
let echt: CuriaZustand;

beforeAll(() => {
  const alle = leseCuriaZustand();
  if (!alle) throw new Error('Zustandsträger fehlt');
  // Ein echtes Geschäft mit mindestens einem Beschluss UND einer Vorberatung — nur so sind
  // beide Richtungen (Zähler zu hoch / zu niedrig) für beide Felder überhaupt darstellbar.
  const z = alle.find((x) => x.beschluesse >= 1 && x.vorberatungen >= 1);
  if (!z) throw new Error('kein geeignetes Geschäft');
  echt = z;
  tmp = mkdtempSync(join(tmpdir(), 'curia-tor-'));
  copyFileSync(join(CURIA_DIR, `${z.nummer}.json`), join(tmp, `${z.nummer}.json`));
});
afterAll(() => { rmSync(tmp, { recursive: true, force: true }); });

describe('pruefeCuriaBestand — Zähler-Gegenprobe gegen den Shard', () => {
  it('GRÜN: echte Zeile gegen echten Shard', () => {
    const r = pruefeCuriaBestand(tmp, [echt]);
    expect(r.fehler).toEqual([]);
    expect(r.zeilen.join('\n')).toMatch(new RegExp(`Zähler-Gegenprobe Beschlüsse ${echt.beschluesse} · Vorberatungen ${echt.vorberatungen}`));
  });

  for (const feld of ['beschluesse', 'vorberatungen'] as const) {
    for (const delta of [+1, -1]) {
      it(`ROT: «${feld}» im Zustandsträger ${delta > 0 ? 'zu hoch' : 'zu niedrig'} — und NICHT der sha-Fehler`, () => {
        const falsch = { ...echt, [feld]: echt[feld] + delta };
        const r = pruefeCuriaBestand(tmp, [falsch]);
        expect(r.fehler.some((f) => SHA_FEHLER.test(f))).toBe(false);
        expect(r.fehler).toHaveLength(1);
        expect(r.fehler[0]).toMatch(new RegExp(`«${feld}» \\d+ im Shard, aber ${echt[feld] + delta} im Zustandsträger`));
      });
    }
  }

  it('ROT: Schlussabstimmungs-Merker gekippt', () => {
    const r = pruefeCuriaBestand(tmp, [{ ...echt, schlussabstimmung: !echt.schlussabstimmung }]);
    expect(r.fehler.some((f) => SHA_FEHLER.test(f))).toBe(false);
    expect(r.fehler).toHaveLength(1);
    expect(r.fehler[0]).toMatch(/«schlussabstimmung»/);
  });

  it('ROT (laut, nicht still 0): Feld fehlt in einer alten Zeile', () => {
    const alt = { ...echt } as Partial<CuriaZustand>;
    delete alt.vorberatungen;
    const r = pruefeCuriaBestand(tmp, [alt as CuriaZustand]);
    expect(r.fehler.some((f) => SHA_FEHLER.test(f))).toBe(false);
    expect(r.fehler).toHaveLength(1);
    expect(r.fehler[0]).toMatch(/führt «vorberatungen» nicht/);
  });

  it('Gegenprobe des Tors: ein verfälschter sha feuert den sha-Fehler (die Unterscheidung oben ist echt)', () => {
    const r = pruefeCuriaBestand(tmp, [{ ...echt, sha: '0'.repeat(64) }]);
    expect(r.fehler.some((f) => SHA_FEHLER.test(f))).toBe(true);
  });
});

describe('pruefeCuriaSchrumpf — Schwelle 0 gegen den Vorstand', () => {
  const zeile = (nummer: string, n: number, extra: Partial<CuriaZustand> = {}): CuriaZustand => ({
    nummer, abgerufen: '2026-09-21', sha: 'x', beschluesse: n, vorberatungen: n,
    schlussabstimmung: true, publikationen: n, objectiveZeilen: n, ...extra,
  });
  const stand = (zustand: CuriaZustand[] | null): CuriaVorstand => ({ art: 'stand', basis: 'abc123456', herleitung: 'test', zustand });

  it('GRÜN: gleich oder gestiegen', () => {
    const r = pruefeCuriaSchrumpf(stand([zeile('01.001', 3), zeile('01.002', 2)]), [zeile('01.001', 3), zeile('01.002', 5), zeile('01.003', 1)]);
    expect(r.fehler).toEqual([]);
    expect(r.zeilen[0]).toMatch(/2 verglichen, 0 Absenkung/);
  });

  for (const feld of ['objectiveZeilen', 'publikationen', 'beschluesse', 'vorberatungen'] as const) {
    it(`ROT: «${feld}» sinkt (Vorstand höher als Ist)`, () => {
      const r = pruefeCuriaSchrumpf(stand([zeile('01.001', 4)]), [zeile('01.001', 4, { [feld]: 3 })]);
      expect(r.fehler).toHaveLength(1);
      expect(r.fehler[0]).toMatch(new RegExp(`«${feld}» sinkt von 4 .* auf 3`));
    });
  }

  it('ROT: gemeinsames Absinken von publikationen UND objectiveZeilen (der Fall, den die Kreuzprobe nicht sieht)', () => {
    const r = pruefeCuriaSchrumpf(stand([zeile('01.001', 12)]), [zeile('01.001', 12, { publikationen: 8, objectiveZeilen: 8 })]);
    expect(r.fehler).toHaveLength(2);
  });

  it('ROT: Geschäft weggefallen', () => {
    const r = pruefeCuriaSchrumpf(stand([zeile('01.001', 1), zeile('01.002', 1)]), [zeile('01.001', 1)]);
    expect(r.fehler).toHaveLength(1);
    expect(r.fehler[0]).toMatch(/01\.002 steht im Vorstand .* weggefallen/);
  });

  it('ROT: Schlussabstimmung verschwunden', () => {
    const r = pruefeCuriaSchrumpf(stand([zeile('01.001', 1)]), [zeile('01.001', 1, { schlussabstimmung: false })]);
    expect(r.fehler).toHaveLength(1);
  });

  it('Feld fehlt im Vorstand: nicht vergleichbar, aber ausgewiesen (nicht still)', () => {
    const alt = zeile('01.001', 2) as Partial<CuriaZustand>;
    delete alt.publikationen; delete alt.objectiveZeilen;
    const r = pruefeCuriaSchrumpf(stand([alt as CuriaZustand]), [zeile('01.001', 1, { beschluesse: 2, vorberatungen: 2 })]);
    expect(r.fehler).toEqual([]);
    expect(r.zeilen[0]).toMatch(/nicht vergleichbar, weil der Vorstand das Feld nicht führt: objectiveZeilen 1×, publikationen 1×/);
  });

  it('Ausnahme greift nur für den EXAKTEN Übergang und nur mit seit + grund', () => {
    const v = stand([zeile('01.001', 4)]);
    const ist = [zeile('01.001', 4, { beschluesse: 3 })];
    const a = (x: Partial<CuriaSchrumpfAusnahme>): CuriaSchrumpfAusnahme => ({
      nummer: '01.001', feld: 'beschluesse', vorher: 4, nachher: 3, seit: '2026-09-21', grund: 'Amtsquelle nahm Beschluss zurück (Beleg)', ...x,
    });
    expect(pruefeCuriaSchrumpf(v, ist, [a({})]).fehler).toEqual([]);
    expect(pruefeCuriaSchrumpf(v, ist, [a({ nachher: 2 })]).fehler).toHaveLength(1);
    expect(pruefeCuriaSchrumpf(v, ist, [a({ grund: ' ' })]).fehler).toHaveLength(1);
    expect(pruefeCuriaSchrumpf(v, ist, [a({ seit: '' })]).fehler).toHaveLength(1);
    expect(pruefeCuriaSchrumpf(stand([zeile('01.001', 4)]), [zeile('01.001', 4)], [a({})]).zeilen[0]).toMatch(/1 ohne Wirkung/);
  });

  it('ROT: Vorstand unbestimmbar wird NIE still grün', () => {
    const r = pruefeCuriaSchrumpf({ art: 'unbestimmbar', grund: 'origin/main fehlt.' }, [zeile('01.001', 1)]);
    expect(r.fehler).toHaveLength(1);
    expect(r.fehler[0]).toMatch(/NICHT still grün/);
  });
});

describe('bestimmeCuriaVorstand — Basis-Wahl je Umgebung (git injiziert)', () => {
  const HEAD = 'h'.repeat(40);
  const MB = 'm'.repeat(40);
  const VOR = 'v'.repeat(40);
  const JSONL = `${JSON.stringify({ nummer: '01.001', beschluesse: 1 })}\n`;
  let pfad: string;
  beforeAll(() => { pfad = join(tmp, 'zustand.jsonl'); writeFileSync(pfad, JSONL); });

  // Fake-git: `refs` = auflösbare Refs, `mb` = merge-base-Ergebnis, `inhalt` = JSONL je Commit.
  const fake = (refs: Record<string, string>, mb: string | null, inhalt: Record<string, string>) => (args: string[]): string | null => {
    if (args[0] === 'rev-parse') return refs[args[3].replace('^{commit}', '')] ?? null;
    if (args[0] === 'merge-base') return mb;
    const [c] = args[args.length - 1].split(':');
    const key = refs[c] ?? c;
    if (args[0] === 'cat-file') return key in inhalt ? '' : null;
    if (args[0] === 'show') return inhalt[key] ?? null;
    return null;
  };

  it('ROT-Pfad: ungültige explizite Basis ⇒ unbestimmbar', () => {
    const v = bestimmeCuriaVorstand({ CURIA_VORSTAND_BASIS: 'gibtsnicht' }, fake({ HEAD }, MB, {}), pfad);
    expect(v.art).toBe('unbestimmbar');
  });
  it('ROT-Pfad: flacher PR-Checkout ohne origin/main ⇒ unbestimmbar', () => {
    expect(bestimmeCuriaVorstand({}, fake({ HEAD }, null, {}), pfad).art).toBe('unbestimmbar');
  });
  it('ROT-Pfad: origin/main da, aber keine gemeinsame Geschichte ⇒ unbestimmbar', () => {
    expect(bestimmeCuriaVorstand({}, fake({ HEAD, 'origin/main': MB }, null, {}), pfad).art).toBe('unbestimmbar');
  });
  it('Branch/PR/Queue: merge-base ≠ HEAD ⇒ Vorstand = merge-base (nicht HEAD)', () => {
    const v = bestimmeCuriaVorstand({}, fake({ HEAD, 'origin/main': MB }, `${MB}\n`, { [MB]: JSONL, [HEAD]: '' }), pfad);
    expect(v).toMatchObject({ art: 'stand', basis: MB.slice(0, 9) });
  });
  it('Monatslauf: auf main, Arbeitsbaum ≠ HEAD ⇒ Vorstand = HEAD', () => {
    const v = bestimmeCuriaVorstand({}, fake({ HEAD, 'origin/main': HEAD }, `${HEAD}\n`, { [HEAD]: `${JSON.stringify({ nummer: '01.001', beschluesse: 2 })}\n` }), pfad);
    expect(v).toMatchObject({ art: 'stand', basis: HEAD.slice(0, 9) });
  });
  it('push auf main: Arbeitsbaum = HEAD ⇒ Vorstand = HEAD^1', () => {
    const v = bestimmeCuriaVorstand({}, fake({ HEAD, 'origin/main': HEAD, 'HEAD^1': VOR }, `${HEAD}\n`, { [HEAD]: JSONL, [VOR]: JSONL }), pfad);
    expect(v).toMatchObject({ art: 'stand', basis: VOR.slice(0, 9) });
  });
  it('flacher Klon auf main, Arbeitsbaum = HEAD, HEAD^1 fehlt ⇒ «unveraendert» mit Grund (kein Fehler, aber ausgewiesen)', () => {
    const v = bestimmeCuriaVorstand({}, fake({ HEAD, 'origin/main': HEAD }, `${HEAD}\n`, { [HEAD]: JSONL }), pfad);
    expect(v.art).toBe('unveraendert');
    expect(pruefeCuriaSchrumpf(v, []).zeilen[0]).toMatch(/nicht verglichen — .*HEAD\^1 fehlt/);
  });
  it('Vorstand ohne Zustandsträger (vor E4) ⇒ nichts zu vergleichen', () => {
    const v = bestimmeCuriaVorstand({}, fake({ HEAD, 'origin/main': MB }, `${MB}\n`, {}), pfad);
    expect(v).toMatchObject({ art: 'stand', zustand: null });
  });
});
