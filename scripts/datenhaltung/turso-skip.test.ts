// scripts/datenhaltung/turso-skip.test.ts
// Tests zu QS-TURSO-SCHREIBVOLUMEN (FAHRPLAN-DATENHALTUNG §17, 15.9.2026).
//
// Geprüft werden die beiden Entscheidungen, die das Schreibvolumen und die Ehrlichkeit
// des Syncs tragen:
//   · SKIP — wann eine Tabelle NICHT neu geschrieben wird (und vor allem: wann doch).
//   · SPERRE — die Kontingent-Antwort von Turso als eigener, unterscheidbarer Ausgang.
//
// §6.7: jeder Test hier lief einmal gegen einen Stub ROT, bevor die Logik entstand
// (Commit «test(datenhaltung): turso-skip Tests + Stub»).
import { describe, it, expect } from 'vitest';
import {
  EXIT_SPERRE,
  istSchreibsperre,
  sperrMeldung,
  signaturBasis,
  signaturFts,
  skipEntscheid,
  planeSkip,
  type Signatur,
  type SchattenLadungLese,
} from './turso-skip';

/** Wortlaut der Turso-Antwort aus der Sonde zum CI-Lauf 34948342923 (15.9.2026):
 *  HTTP 200, je Statement ein Pipeline-Fehler mit genau diesem Text. */
const SPERR_ANTWORT =
  '«INSERT INTO erlasse_neu (key, ebene…» → Operation was blocked: SQL write operations are ' +
  'forbidden (writes are blocked, do you need to upgrade your plan?)';

describe('Sperr-Erkennung (Kontingent, §17/3)', () => {
  it('erkennt die Kontingent-Sperre im stmt-Fehlertext', () => {
    expect(istSchreibsperre(new Error(`Turso stmt-Fehler: ${SPERR_ANTWORT}`))).toBe(true);
  });

  it('erkennt sie auch im Wortlaut einer zurückgerollten Transaktion', () => {
    expect(
      istSchreibsperre(new Error(`Transaktion zurückgerollt (Live-Stand unverändert): ${SPERR_ANTWORT}`)),
    ).toBe(true);
  });

  it('erkennt sie in einem rohen String (ohne Error-Hülle)', () => {
    expect(istSchreibsperre(SPERR_ANTWORT)).toBe(true);
  });

  it('hält einen GEWÖHNLICHEN Datenfehler auseinander — sonst würde Exit 3 Datenfehler verschlucken', () => {
    expect(istSchreibsperre(new Error('Turso stmt-Fehler: «SELECT…» → no such table: artikel'))).toBe(false);
    expect(istSchreibsperre(new Error('Turso HTTP 401: unauthorized'))).toBe(false);
    expect(istSchreibsperre(undefined)).toBe(false);
    expect(istSchreibsperre(null)).toBe(false);
  });

  it('EXIT_SPERRE ist 3 — unterscheidbar von Datenfehlern (Exit 1) und Erfolg (0)', () => {
    expect(EXIT_SPERRE).toBe(3);
  });

  it('die Meldung nennt Ursache, Stand der Replika, dass Lesen weiterläuft, und den Reset', () => {
    const m = sperrMeldung('2026-09-14T16:10:02.123Z');
    expect(m.startsWith('::error::')).toBe(true);
    expect(m).toContain('gesperrt');
    expect(m).toContain('2026-09-14T16:10:02.123Z');
    expect(m).toContain('Lesen');
    expect(m).toContain('1. des Monats');
  });

  it('nennt einen fehlenden Stand ausdrücklich, statt «null» zu drucken (§8)', () => {
    const m = sperrMeldung(null);
    expect(m).not.toContain('null');
    expect(m).toContain('unbekannt');
  });
});

describe('Signatur (was den Remote-Inhalt bestimmt, §17/2)', () => {
  const DDL_A = 'CREATE TABLE artikel (erlass_key TEXT NOT NULL, art_id TEXT NOT NULL)';
  const DDL_B = 'CREATE TABLE artikel (erlass_key TEXT NOT NULL, art_id TEXT NOT NULL, neu TEXT)';
  const SHA = 'a'.repeat(64);

  it('ist deterministisch (§2): gleiche Eingabe, gleicher Wert', () => {
    expect(signaturBasis(DDL_A, SHA)).toBe(signaturBasis(DDL_A, SHA));
  });

  it('ändert sich bei DDL-Drift — sonst umginge der Skip Prüfung 0 (SCHEMA) des Wächters', () => {
    expect(signaturBasis(DDL_B, SHA)).not.toBe(signaturBasis(DDL_A, SHA));
  });

  it('ändert sich bei geänderten Daten (Manifest-sha)', () => {
    expect(signaturBasis(DDL_A, 'b'.repeat(64))).not.toBe(signaturBasis(DDL_A, SHA));
  });

  it('verwechselt DDL und sha nicht (Feldgrenze ist Teil der Signatur)', () => {
    expect(signaturBasis('xy', 'z')).not.toBe(signaturBasis('x', 'yz'));
  });

  const ladungen = (block: Uint8Array, text: string): SchattenLadungLese[] => [
    { suffix: '_config', spalten: ['k', 'v'], werte: [['version', 4]] },
    { suffix: '_data', spalten: ['id', 'block'], werte: [[1, block], [2, null]] },
    { suffix: '_content', spalten: ['id', 'c0'], werte: [[1, text]] },
  ];

  it('FTS-Signatur ist deterministisch über denselben Schatten-Inhalt', () => {
    const a = signaturFts(DDL_A, ladungen(new Uint8Array([1, 2, 3]), 'Beschwerde'));
    const b = signaturFts(DDL_A, ladungen(new Uint8Array([1, 2, 3]), 'Beschwerde'));
    expect(a).toBe(b);
  });

  it('FTS-Signatur ändert sich bei GEÄNDERTEM BLOB — das Manifest deckt FTS nicht ab', () => {
    const a = signaturFts(DDL_A, ladungen(new Uint8Array([1, 2, 3]), 'Beschwerde'));
    const b = signaturFts(DDL_A, ladungen(new Uint8Array([1, 2, 4]), 'Beschwerde'));
    expect(a).not.toBe(b);
  });

  it('FTS-Signatur ändert sich bei geändertem Text-Inhalt', () => {
    const a = signaturFts(DDL_A, ladungen(new Uint8Array([1, 2, 3]), 'Beschwerde'));
    const b = signaturFts(DDL_A, ladungen(new Uint8Array([1, 2, 3]), 'Beschwerdf'));
    expect(a).not.toBe(b);
  });

  it('FTS-Signatur ändert sich bei DDL-Drift (Spalte dazu ⇒ Neuaufbau)', () => {
    const a = signaturFts(DDL_A, ladungen(new Uint8Array([1]), 'x'));
    const b = signaturFts(DDL_B, ladungen(new Uint8Array([1]), 'x'));
    expect(a).not.toBe(b);
  });

  it('FTS-Signatur trennt Feldgrenzen — «ab»+«c» ist nicht «a»+«bc»', () => {
    const a = signaturFts(DDL_A, [{ suffix: '_x', spalten: ['p', 'q'], werte: [['ab', 'c']] }]);
    const b = signaturFts(DDL_A, [{ suffix: '_x', spalten: ['p', 'q'], werte: [['a', 'bc']] }]);
    expect(a).not.toBe(b);
  });

  it('FTS-Signatur unterscheidet NULL von leerem Text und leerem BLOB', () => {
    const mach = (v: Uint8Array | string | null) =>
      signaturFts(DDL_A, [{ suffix: '_x', spalten: ['p'], werte: [[v]] }]);
    expect(new Set([mach(null), mach(''), mach(new Uint8Array(0))]).size).toBe(3);
  });

  it('FTS-Signatur unterscheidet Zahl 1 von Text «1»', () => {
    const mach = (v: number | string) => signaturFts(DDL_A, [{ suffix: '_x', spalten: ['p'], werte: [[v]] }]);
    expect(mach(1)).not.toBe(mach('1'));
  });
});

describe('Skip-Entscheid (§17/2)', () => {
  const lokal: Signatur = { signatur: 'sig-x', sollZeilen: 60508 };

  it('überspringt NUR bei gleicher Signatur UND Remote-Zeilenzahl == Soll', () => {
    const b = skipEntscheid({ lokal, remoteSignatur: 'sig-x', remoteZeilen: 60508 });
    expect(b.skip).toBe(true);
    expect(b.grund).toMatch(/\S/);
  });

  it('baut neu, wenn die Signatur abweicht (neue Daten oder neue DDL)', () => {
    expect(skipEntscheid({ lokal, remoteSignatur: 'sig-alt', remoteZeilen: 60508 }).skip).toBe(false);
  });

  it('baut neu, wenn remote gar keine Signatur-Marke liegt (erster Lauf, alte Marken-Version)', () => {
    expect(skipEntscheid({ lokal, remoteSignatur: undefined, remoteZeilen: 60508 }).skip).toBe(false);
    expect(skipEntscheid({ lokal, remoteSignatur: null, remoteZeilen: 60508 }).skip).toBe(false);
  });

  it('baut neu bei passender Signatur, aber ABWEICHENDER Zeilenzahl — der halb-gedroppte Fall vom 19.7.2026', () => {
    const b = skipEntscheid({ lokal, remoteSignatur: 'sig-x', remoteZeilen: 16400 });
    expect(b.skip).toBe(false);
    expect(b.grund).toContain('16400');
  });

  it('baut neu, wenn die Remote-Zeilenzahl nicht ermittelbar ist — nicht geprüft ≠ in Ordnung (§8)', () => {
    expect(skipEntscheid({ lokal, remoteSignatur: 'sig-x', remoteZeilen: null }).skip).toBe(false);
  });

  it('baut neu bei leerer Remote-Tabelle, auch wenn Soll 0 wäre — 0 Zeilen ist nie ein gültiger HOT-Stand', () => {
    expect(skipEntscheid({ lokal: { signatur: 's', sollZeilen: 0 }, remoteSignatur: 's', remoteZeilen: 0 }).skip).toBe(
      false,
    );
  });
});

describe('planeSkip (Zusammenspiel, mit eingespeisten Lesern)', () => {
  const lokal = new Map<string, Signatur>([
    ['artikel', { signatur: 'sig-a', sollZeilen: 10 }],
    ['fts_artikel', { signatur: 'sig-f', sollZeilen: 10 }],
  ]);

  it('überspringt die unveränderte Tabelle und baut die veränderte neu', async () => {
    const plan = await planeSkip(
      lokal,
      async () => new Map([['artikel', 'sig-a'], ['fts_artikel', 'sig-f-alt']]),
      async () => 10,
    );
    expect(plan.get('artikel')?.skip).toBe(true);
    expect(plan.get('fts_artikel')?.skip).toBe(false);
  });

  it('fragt die Remote-Zeilenzahl nur ab, wo die Signatur überhaupt passt (jede Abfrage kostet)', async () => {
    const gefragt: string[] = [];
    await planeSkip(
      lokal,
      async () => new Map([['artikel', 'sig-a'], ['fts_artikel', 'sig-f-alt']]),
      async (t) => {
        gefragt.push(t);
        return 10;
      },
    );
    expect(gefragt).toEqual(['artikel']);
  });

  it('baut ALLES neu, wenn die Marken-Tabelle nicht lesbar ist (leere Marken)', async () => {
    const plan = await planeSkip(lokal, async () => new Map(), async () => 10);
    expect([...plan.values()].every((b) => !b.skip)).toBe(true);
  });

  it('liefert für jede lokale Tabelle genau einen Befund', async () => {
    const plan = await planeSkip(lokal, async () => new Map(), async () => 10);
    expect([...plan.keys()].sort()).toEqual(['artikel', 'fts_artikel']);
  });
});
