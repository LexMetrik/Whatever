// Rot-/Grün-Beweise (§6.7) für die Nachzug-Auflagen 2–4 der Gegenprüfung zu PR #963 (21.9.2026),
// scripts/entstehung/curia-tor.ts. Alles gegen injizierte Daten bzw. TEMP-Dateien — nie gegen die
// echten Zustandsträger/Shards (die blieben unberührt).
//  2 Totalverlust: Vorstand mit Geschäften, Ist-Zustandsträger fehlt ⇒ ROT (vorher schwieg das Tor,
//    weil check-entstehung.ts die Schrumpf-Schwelle hinter `if (zustand)` übersprang).
//  3 CURIA_VORSTAND_BASIS: nur ein echter Vorfahr von HEAD, oder HEAD bei UNGEBUCHT geändertem
//    Zustandsträger (manueller Monatslauf) — HEAD bei gebuchtem Stand wäre ein Selbstvergleich.
//  4 Dublette im Zustandsträger ⇒ ROT (Ist) bzw. Meldung (Vorstand, historisch).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { leseCuriaZustand, CURIA_DIR, type CuriaZustand } from '../../scripts/entstehung/curia-zustand.ts';
import { pruefeCuriaBestand, pruefeCuriaSchrumpf, bestimmeCuriaVorstand, type CuriaVorstand } from '../../scripts/entstehung/curia-tor.ts';

const zeile = (nummer: string, n: number): CuriaZustand => ({
  nummer, abgerufen: '2026-09-21', sha: 'x', beschluesse: n, vorberatungen: n,
  schlussabstimmung: true, publikationen: n, objectiveZeilen: n,
});
const stand = (zustand: CuriaZustand[] | null): CuriaVorstand => ({ art: 'stand', basis: 'abc123456', herleitung: 'test', zustand });

describe('Auflage 2 — Totalverlust des Ist-Zustandsträgers', () => {
  it('ROT: Vorstand führt Geschäfte, Ist-Zustandsträger fehlt', () => {
    const r = pruefeCuriaSchrumpf(stand([zeile('01.001', 1), zeile('01.002', 2)]), null);
    expect(r.fehler).toHaveLength(1);
    expect(r.fehler[0]).toMatch(/Totalverlust/);
    expect(r.fehler[0]).toMatch(/2 Geschäft\(e\)/);
  });
  it('GRÜN: Erstfall — weder Vorstand-Zustandsträger noch Ist', () => {
    const r = pruefeCuriaSchrumpf(stand(null), null);
    expect(r.fehler).toEqual([]);
    expect(r.zeilen[0]).toMatch(/Erstfall/);
  });
  it('GRÜN: Erstfall — Vorstand-Zustandsträger leer, Ist fehlt', () => {
    expect(pruefeCuriaSchrumpf(stand([]), null).fehler).toEqual([]);
  });
  it('ROT bleibt: Vorstand unbestimmbar, Ist fehlt', () => {
    const r = pruefeCuriaSchrumpf({ art: 'unbestimmbar', grund: 'origin/main fehlt.' }, null);
    expect(r.fehler).toHaveLength(1);
    expect(r.fehler[0]).toMatch(/NICHT still grün/);
  });
  it('Ende-zu-Ende über bestimmeCuriaVorstand: Branch, JSONL im Arbeitsbaum gelöscht ⇒ Totalverlust', () => {
    const HEAD = 'h'.repeat(40);
    const MB = 'm'.repeat(40);
    const jsonl = `${JSON.stringify(zeile('01.001', 1))}\n`;
    const git = (args: string[]): string | null => {
      if (args[0] === 'rev-parse') return ({ HEAD, 'origin/main': MB } as Record<string, string>)[args[3].replace('^{commit}', '')] ?? null;
      if (args[0] === 'merge-base') return `${MB}\n`;
      if (args[0] === 'cat-file') return '';
      if (args[0] === 'show') return jsonl;
      return null;
    };
    const v = bestimmeCuriaVorstand({}, git, join(tmpdir(), 'curia-gibt-es-nicht-4b1f.jsonl'));
    const r = pruefeCuriaSchrumpf(v, null);
    expect(r.fehler).toHaveLength(1);
    expect(r.fehler[0]).toMatch(/Totalverlust/);
  });
});

describe('Auflage 3 — explizite Basis CURIA_VORSTAND_BASIS', () => {
  const HEAD = 'h'.repeat(40);
  const VOR = 'v'.repeat(40);
  const FREMD = 'f'.repeat(40);
  const ALT = `${JSON.stringify(zeile('01.001', 5))}\n`;
  const NEU = `${JSON.stringify(zeile('01.001', 1))}\n`;
  let tmp: string;
  let pfad: string;
  beforeAll(() => { tmp = mkdtempSync(join(tmpdir(), 'curia-basis-')); pfad = join(tmp, 'zustand.jsonl'); });
  afterAll(() => { rmSync(tmp, { recursive: true, force: true }); });

  // Fake-git: `inhalt` = JSONL je Commit; `vorfahren` = Commits, die echte Vorfahren von HEAD sind.
  const fake = (inhalt: Record<string, string>, vorfahren: string[]) => (args: string[]): string | null => {
    const refs: Record<string, string> = { HEAD, [HEAD]: HEAD, [VOR]: VOR, [FREMD]: FREMD, 'HEAD^1': VOR };
    if (args[0] === 'rev-parse') return refs[args[3].replace('^{commit}', '')] ?? null;
    if (args[0] === 'merge-base' && args[1] === '--is-ancestor') return vorfahren.includes(args[2]) && args[3] === HEAD ? '' : null;
    if (args[0] === 'merge-base') return null;
    const [c] = args[args.length - 1].split(':');
    const key = refs[c] ?? c;
    if (args[0] === 'cat-file') return key in inhalt ? '' : null;
    if (args[0] === 'show') return inhalt[key] ?? null;
    return null;
  };

  it('ROT: Basis = HEAD bei gebuchtem Zustandsträger (Arbeitsbaum = HEAD, geschrumpft) ⇒ Selbstvergleich abgewiesen', () => {
    writeFileSync(pfad, NEU);
    const v = bestimmeCuriaVorstand({ CURIA_VORSTAND_BASIS: 'HEAD' }, fake({ [HEAD]: NEU, [VOR]: ALT }, [VOR]), pfad);
    expect(v.art).toBe('unbestimmbar');
    const r = pruefeCuriaSchrumpf(v, [zeile('01.001', 1)]);
    expect(r.fehler).toHaveLength(1);
    expect(r.fehler[0]).toMatch(/Selbstvergleich/);
    expect(r.fehler[0]).toMatch(/Stand VOR dem geprüften/);
  });
  it('ROT: Basis ist kein Vorfahr von HEAD ⇒ abgewiesen', () => {
    writeFileSync(pfad, NEU);
    const v = bestimmeCuriaVorstand({ CURIA_VORSTAND_BASIS: FREMD }, fake({ [HEAD]: NEU, [FREMD]: NEU }, [VOR]), pfad);
    expect(v.art).toBe('unbestimmbar');
    expect(pruefeCuriaSchrumpf(v, [zeile('01.001', 1)]).fehler[0]).toMatch(/kein echter Vorfahr/);
  });
  it('GRÜN-Pfad: echter Vorfahr ⇒ Vorstand = dieser Stand, und die Schrumpfung wird ROT gemeldet', () => {
    writeFileSync(pfad, NEU);
    const v = bestimmeCuriaVorstand({ CURIA_VORSTAND_BASIS: VOR }, fake({ [HEAD]: NEU, [VOR]: ALT }, [VOR]), pfad);
    expect(v).toMatchObject({ art: 'stand', basis: VOR.slice(0, 9) });
    expect(pruefeCuriaSchrumpf(v, [zeile('01.001', 1)]).fehler.length).toBeGreaterThan(0);
  });
  it('legitim: Basis = HEAD bei UNGEBUCHT geändertem Zustandsträger (manueller Monatslauf) ⇒ Vorstand HEAD', () => {
    writeFileSync(pfad, NEU);
    const v = bestimmeCuriaVorstand({ CURIA_VORSTAND_BASIS: 'HEAD' }, fake({ [HEAD]: ALT }, []), pfad);
    expect(v).toMatchObject({ art: 'stand', basis: HEAD.slice(0, 9) });
    expect(pruefeCuriaSchrumpf(v, [zeile('01.001', 1)]).fehler.length).toBeGreaterThan(0);
  });
});

describe('Auflage 4 — Dublette im Zustandsträger', () => {
  let tmp: string;
  let echt: CuriaZustand;
  beforeAll(() => {
    const alle = leseCuriaZustand();
    if (!alle?.length) throw new Error('Zustandsträger fehlt');
    echt = alle[0];
    tmp = mkdtempSync(join(tmpdir(), 'curia-dublette-'));
    copyFileSync(join(CURIA_DIR, `${echt.nummer}.json`), join(tmp, `${echt.nummer}.json`));
  });
  afterAll(() => { rmSync(tmp, { recursive: true, force: true }); });

  it('GRÜN: jede Nummer einmal', () => {
    expect(pruefeCuriaBestand(tmp, [echt]).fehler).toEqual([]);
  });
  it('ROT: dieselbe Nummer zweimal im Ist-Zustandsträger (auch wenn beide Zeilen stimmen)', () => {
    const r = pruefeCuriaBestand(tmp, [echt, { ...echt }]);
    expect(r.fehler).toHaveLength(1);
    expect(r.fehler[0]).toMatch(new RegExp(`${echt.nummer.replace('.', '\\.')} steht 2× im Zustandsträger`));
  });
  it('ROT: Dublette mit abweichender zweiter Zeile wird nicht still von der letzten überschrieben', () => {
    const r = pruefeCuriaBestand(tmp, [echt, { ...echt, beschluesse: echt.beschluesse + 7 }]);
    expect(r.fehler.some((f) => /Nummer mehrfach/.test(f))).toBe(true);
  });
  it('Vorstand mit Dublette: Meldung in der Schlusszeile, kein Fehler (Vorstand ist historisch)', () => {
    const r = pruefeCuriaSchrumpf(stand([zeile('01.001', 1), zeile('01.001', 1)]), [zeile('01.001', 1)]);
    expect(r.fehler).toEqual([]);
    expect(r.zeilen[0]).toMatch(/Vorstand führt 1 Nummer\(n\) mehrfach: 01\.001/);
  });
});
