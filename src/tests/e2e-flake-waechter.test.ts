// src/tests/e2e-flake-waechter.test.ts — Verdikt-Logik des Flacker-Wächters.
//
// Prüft die reine Funktion `flackerVerdikt` (Report-JSON ⇒ Verdikt) und einmal
// den Kommandozeilen-Rand (Exit-Code, Fund-Datei, Step-Summary). Das Tor selbst
// läuft nur in CI (Playwright-JSON-Report); seine ENTSCHEIDUNGSREGEL ist hier
// deterministisch nachgestellt.
//
// REGEL SEIT 5.10.2026 (Entscheid David, QS-CI-ZEIT E2): Retry-Grün ist eine
// WARNUNG (+ Reparatur-Zettel aus ci.yml), kein Rot mehr. Rot bleiben: ein Test,
// der in allen Versuchen rot ist, und jede Unklarheit im Report (§6.7 lit. b).
// Die frühere Ausnahmeliste/Modus-Datei ist zurückgebaut — ihre Tests mit ihr.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { flackerVerdikt, specNormalisieren, stepSummary } from '../../scripts/check-e2e-flake.ts';

type Status = 'expected' | 'flaky' | 'unexpected';

/** Minimaler Playwright-JSON-Report: ein Test je Eintrag, mit Status und Versuchszahl. */
function report(tests: { status: Status; datei?: string; titel?: string; versuche?: number }[]): string {
  const zaehle = (s: Status): number => tests.filter((t) => t.status === s).length;
  const specs = tests.map((t) => ({
    title: t.titel ?? 'A-Überlauf ohne Scroller',
    file: t.datei ?? 'gesetze-a-ueberlauf.e2e.ts',
    tests: [
      {
        status: t.status,
        results: Array.from({ length: t.versuche ?? (t.status === 'expected' ? 1 : 3) }, (_, i) => ({ retry: i })),
      },
    ],
  }));
  return JSON.stringify({
    suites: [{ title: 'wurzel', file: 'gesetze-a-ueberlauf.e2e.ts', specs }],
    stats: { expected: zaehle('expected'), unexpected: zaehle('unexpected'), flaky: zaehle('flaky'), skipped: 0 },
  });
}

describe('Flacker-Wächter — Verdikt', () => {
  it('kein Flackern ⇒ grün, keine Funde', () => {
    const v = flackerVerdikt({ reportRoh: report([{ status: 'expected' }]) });
    expect(v.rot).toBe(false);
    expect(v.funde).toEqual([]);
    expect(v.zusammenfassung).toBe('Flacker-Wächter: grün · 0 flackern (Warnung, kein Rot)');
    expect(stepSummary(v)).toBe('');
  });

  it('Retry-Grün ⇒ NICHT rot, aber ::warning FLACKERT mit Retry-Zahl und Fund', () => {
    const v = flackerVerdikt({ reportRoh: report([{ status: 'flaky', versuche: 2 }]) });
    expect(v.rot).toBe(false);
    expect(v.funde).toEqual([{ spec: 'gesetze-a-ueberlauf.e2e.ts', retries: 1, titel: ['A-Überlauf ohne Scroller'] }]);
    const warnung = v.meldungen.find((m) => m.startsWith('::warning file=e2e/gesetze-a-ueberlauf.e2e.ts::FLACKERT'));
    expect(warnung).toContain('1× Retry');
    expect(v.meldungen.some((m) => m.startsWith('::error'))).toBe(false);
    expect(stepSummary(v)).toContain('FLACKERT `e2e/gesetze-a-ueberlauf.e2e.ts`');
  });

  it('Test in ALLEN Versuchen rot ⇒ ROT, mit Spec und Titel', () => {
    const v = flackerVerdikt({ reportRoh: report([{ status: 'unexpected', titel: 'Reiter tragen Registerfarbe' }]) });
    expect(v.rot).toBe(true);
    expect(v.dauerRot).toEqual(['gesetze-a-ueberlauf.e2e.ts › Reiter tragen Registerfarbe']);
    expect(v.meldungen.some((m) => m.startsWith('::error') && m.includes('in ALLEN Versuchen rot'))).toBe(true);
    expect(stepSummary(v)).toContain('DAUER-ROT');
  });

  it('Dauer-Rot neben Flackern ⇒ rot; das Flackern wird trotzdem als Fund gemeldet', () => {
    const v = flackerVerdikt({
      reportRoh: report([
        { status: 'unexpected', datei: 'a.e2e.ts' },
        { status: 'flaky', datei: 'b.e2e.ts' },
      ]),
    });
    expect(v.rot).toBe(true);
    expect(v.funde.map((f) => f.spec)).toEqual(['b.e2e.ts']);
  });

  it('Report fehlt ⇒ rot, nie stilles Grün', () => {
    const v = flackerVerdikt({ reportRoh: null });
    expect(v.rot).toBe(true);
    expect(v.meldungen.some((m) => m.startsWith('::error') && m.includes('fehlt'))).toBe(true);
    expect(v.zusammenfassung).toContain('ROT');
  });

  it('Report unlesbar oder ohne stats.flaky / stats.unexpected ⇒ rot', () => {
    expect(flackerVerdikt({ reportRoh: '{kaputt' }).rot).toBe(true);
    expect(flackerVerdikt({ reportRoh: '{"suites":[]}' }).rot).toBe(true);
    expect(flackerVerdikt({ reportRoh: JSON.stringify({ suites: [], stats: { flaky: 0 } }) }).rot).toBe(true);
    expect(flackerVerdikt({ reportRoh: JSON.stringify({ suites: [], stats: { unexpected: 0 } }) }).rot).toBe(true);
  });

  it('stats.flaky > 0 ohne zuordenbaren Test ⇒ rot (Formatwechsel darf nichts verschlucken)', () => {
    const roh = JSON.stringify({ suites: [], stats: { flaky: 2, expected: 0, unexpected: 0, skipped: 0 } });
    const v = flackerVerdikt({ reportRoh: roh });
    expect(v.rot).toBe(true);
    expect(v.meldungen.some((m) => m.includes('stats.flaky=2'))).toBe(true);
  });

  it('stats.unexpected > 0 ohne zuordenbaren Test ⇒ trotzdem rot', () => {
    const roh = JSON.stringify({ suites: [], stats: { flaky: 0, expected: 0, unexpected: 1, skipped: 0 } });
    const v = flackerVerdikt({ reportRoh: roh });
    expect(v.rot).toBe(true);
    expect(v.meldungen.some((m) => m.includes('(keinem Test zuordenbar)'))).toBe(true);
  });

  it('Spec-Pfade werden einheitlich normalisiert, Retries je Spec summiert', () => {
    expect(specNormalisieren('./e2e/x.e2e.ts')).toBe('x.e2e.ts');
    const v = flackerVerdikt({
      reportRoh: report([
        { status: 'flaky', datei: 'e2e/x.e2e.ts', titel: 'eins', versuche: 2 },
        { status: 'flaky', datei: './e2e/x.e2e.ts', titel: 'zwei', versuche: 3 },
      ]),
    });
    expect(v.funde).toEqual([{ spec: 'x.e2e.ts', retries: 3, titel: ['eins', 'zwei'] }]);
  });
});

// Rot-und-Grün-Beweis am Kommandozeilen-Rand (§6.7): der Exit-Code ist das, was
// den Shard-Schritt in ci.yml rot oder grün macht. `VITEST` wird dem Kind
// entzogen, sonst überspringt der Entry-Guard den Rand.
describe('Flacker-Wächter — Exit-Code (CLI)', () => {
  const ordner = mkdtempSync(join(tmpdir(), 'flake-waechter-'));
  const fahre = (reportRoh: string): { exit: number; ausgabe: string; funde: string; summary: string } => {
    const reportPfad = join(ordner, `report-${Math.random().toString(36).slice(2)}.json`);
    const funde = `${reportPfad}.funde.json`;
    const summary = `${reportPfad}.summary.md`;
    writeFileSync(reportPfad, reportRoh);
    writeFileSync(summary, '');
    const env: NodeJS.ProcessEnv = { ...process.env, E2E_FLAKE_FUNDE: funde, GITHUB_STEP_SUMMARY: summary };
    delete env.VITEST;
    try {
      const ausgabe = execFileSync('npx', ['vite-node', 'scripts/check-e2e-flake.ts', reportPfad], { env, encoding: 'utf8' });
      return { exit: 0, ausgabe, funde: existsSync(funde) ? readFileSync(funde, 'utf8') : '', summary: readFileSync(summary, 'utf8') };
    } catch (e) {
      const f = e as { status: number; stdout: string };
      return { exit: f.status, ausgabe: f.stdout, funde: existsSync(funde) ? readFileSync(funde, 'utf8') : '', summary: readFileSync(summary, 'utf8') };
    }
  };

  it('durchgängig roter Test ⇒ Exit ≠ 0', () => {
    const r = fahre(report([{ status: 'unexpected' }]));
    expect(r.exit).not.toBe(0);
    expect(r.ausgabe).toContain('in ALLEN Versuchen rot');
  }, 60_000);

  it('Retry-Grün ⇒ Exit 0, ::warning FLACKERT, Fund-Datei und Step-Summary geschrieben', () => {
    const r = fahre(report([{ status: 'flaky', versuche: 2 }]));
    expect(r.exit).toBe(0);
    expect(r.ausgabe).toContain('::warning file=e2e/gesetze-a-ueberlauf.e2e.ts::FLACKERT');
    expect(JSON.parse(r.funde)).toEqual({
      funde: [{ spec: 'gesetze-a-ueberlauf.e2e.ts', retries: 1, titel: ['A-Überlauf ohne Scroller'] }],
    });
    expect(r.summary).toContain('FLACKERT');
  }, 60_000);

  it('alles grün ⇒ Exit 0, keine Fund-Datei', () => {
    const r = fahre(report([{ status: 'expected' }]));
    expect(r.exit).toBe(0);
    expect(r.funde).toBe('');
  }, 60_000);
});
