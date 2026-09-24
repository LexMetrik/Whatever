// src/tests/fachaenderung.test.ts — Fachänderungs-Riegel (RL-03, 23.9.2026):
// reiner Kern scripts/analyse/fachaenderung-kern.ts, ohne git. Fälle (a)–(h)
// aus dem Auftrag; der Block «aus src/tests/check-testtreue.test.ts» ist
// wörtlich aus steuerwerkzeuge.test.ts hierher umgezogen (Regel R1 = das
// frühere check:testtreue, nur die Import-Quelle ist neu).
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  type CommitInfo,
  type TestStand,
  bewerte,
  entfernteRisikoAssertions,
  findeVerstoesse,
  importZiele,
  istRefactorCommit,
  istTestDatei,
  prTitelAusEreignis,
  pruefeFachaenderungForm,
  squashVerstoss,
} from '../../scripts/analyse/fachaenderung-kern';
import { assertionMengen } from '../../scripts/analyse/assertion-mengen';

const RISIKO = 'src/lib/verjaehrung.ts';
const NEUTRAL = 'src/lib/startseiteConfig.ts';
const BAUM = new Set([RISIKO, NEUTRAL]);
const da = (p: string) => BAUM.has(p);
const testText = (engine: string, erwartung: string, extra = '') =>
  `import { describe, it, expect } from 'vitest';\n` +
  `import { f } from '../lib/${engine}';\n` +
  `describe('d', () => {\n  it('t', () => {\n    expect(f()).toBe(${erwartung});\n  });\n${extra}});\n`;
const eingabe = (staende: TestStand[], trailer: string[] = [], betreff = 'fix(x): y', golden = false) => bewerte({
  commits: [{ sha: 'abc1234567', betreff, dateien: staende.map((s) => s.datei) }],
  engineBefunde: entfernteRisikoAssertions(staende, da, da),
  goldenGeaendert: golden,
  trailer,
  quelle: 'Fixture',
});
const TRAILER = 'Art. 130 OR — F5-04 Laufbeginn nicht als Gesetzesregel';
const AENDERUNG: TestStand[] = [{ datei: 'src/tests/v.test.ts', alt: testText('verjaehrung', '1'), neu: testText('verjaehrung', '2') }];

describe('check:fachaenderung — Fälle (a)–(h)', () => {
  it('(a) ROT: geänderte Assertion im Test einer Risiko-Engine, ohne Trailer', () => {
    const u = eingabe(AENDERUNG);
    expect(u.rot).toBe(true);
    expect(u.text).toMatch(/Engine src\/lib\/verjaehrung\.ts/);
    expect(u.text).toMatch(/Heilweg/);
  });
  it('(b) GRÜN: dieselbe Änderung mit gültigem Trailer', () => {
    expect(eingabe(AENDERUNG, [TRAILER]).rot).toBe(false);
  });
  it('(c) GRÜN: nur hinzugefügter Test bzw. neue Testdatei', () => {
    const neu = testText('verjaehrung', '1', `  it('neu', () => { expect(f()).toBe(3); });\n`);
    expect(eingabe([{ datei: 'src/tests/v.test.ts', alt: testText('verjaehrung', '1'), neu }]).rot).toBe(false);
    expect(eingabe([{ datei: 'src/tests/w.test.ts', alt: null, neu: testText('verjaehrung', '9') }]).rot).toBe(false);
  });
  it('(d) ROT: Golden-Diff ohne Trailer; mit Trailer grün', () => {
    expect(eingabe([], [], 'chore: golden', true).rot).toBe(true);
    expect(eingabe([], [TRAILER], 'chore: golden', true).rot).toBe(false);
  });
  it('(e) ROT: refactor-Commit mit Assertion-Änderung — auch mit Trailer', () => {
    const u = eingabe(AENDERUNG, [TRAILER], 'refactor(verjaehrung): entdoppelt');
    expect(u.rot).toBe(true);
    expect(u.text).toMatch(/§6\.3/);
  });
  it('(f) GRÜN: Doku-only', () => {
    const u = bewerte({ commits: [{ sha: 'd0c', betreff: 'docs(plan): x', dateien: ['ROADMAP.md'] }],
      engineBefunde: [], goldenGeaendert: false, trailer: [], quelle: 'Fixture' });
    expect(u.rot).toBe(false);
  });
  it('(g) GRÜN: Assertion-Änderung im Test einer Nicht-Risiko-Datei (dokumentierte Grenze)', () => {
    expect(eingabe([{ datei: 'src/tests/n.test.ts', alt: testText('startseiteConfig', '1'), neu: testText('startseiteConfig', '2') }]).rot).toBe(false);
  });
  it('(h) ROT: Trailer mit zu kurzem Befund-Teil', () => {
    const u = eingabe(AENDERUNG, ['Art. 130 OR — F5-04 kurz']);
    expect(u.rot).toBe(true);
    expect(u.text).toMatch(/zu kurz/);
  });
});

describe('check:fachaenderung — Heuristik und Randfälle', () => {
  it('gelöschte Testdatei einer Risiko-Engine zählt als entfernte Assertions', () => {
    expect(eingabe([{ datei: 'src/tests/v.test.ts', alt: testText('verjaehrung', '1'), neu: null }]).rot).toBe(true);
  });
  it('Abschalten per it.skip ist eine Änderung', () => {
    const neu = testText('verjaehrung', '1').replace("it('t'", "it.skip('t'");
    expect(eingabe([{ datei: 'src/tests/v.test.ts', alt: testText('verjaehrung', '1'), neu }]).rot).toBe(true);
  });
  it('Umzug zwischen Tests derselben Engine ist keine Änderung (Pooling je Engine)', () => {
    expect(eingabe([
      { datei: 'src/tests/v.test.ts', alt: testText('verjaehrung', '1'), neu: null },
      { datei: 'src/tests/v2.test.ts', alt: null, neu: testText('verjaehrung', '1') },
    ]).rot).toBe(false);
  });
  it('Umzug zu einer Nicht-Risiko-Engine neutralisiert nichts', () => {
    expect(eingabe([
      { datei: 'src/tests/v.test.ts', alt: testText('verjaehrung', '1'), neu: null },
      { datei: 'src/tests/n.test.ts', alt: null, neu: testText('startseiteConfig', '1') },
    ]).rot).toBe(true);
  });
  it('importZiele löst relative Verweise auf (.ts, index, .js, vi.mock, import())', () => {
    const baum = new Set(['src/lib/a.ts', 'src/lib/b/index.ts', 'src/lib/c.ts', 'src/lib/d.ts']);
    const text = `import { a } from '../lib/a';\nimport x from '../lib/b';\nexport * from '../lib/c.js';\n` +
      `vi.mock('../lib/d');\nconst y = await import('../lib/a');\nimport z from 'vitest';\n`;
    expect(importZiele(text, 'src/tests/t.test.ts', (p) => baum.has(p)))
      .toEqual(['src/lib/a.ts', 'src/lib/b/index.ts', 'src/lib/c.ts', 'src/lib/d.ts']);
  });
  it('Trailer-Form: Norm + Gedankenstrich + ≥ 15 Zeichen', () => {
    expect(pruefeFachaenderungForm('Art. 266a OR — F4-01 Mietkündigung Zustelltag').art).toBe('gueltig');
    expect(pruefeFachaenderungForm('Art. 266a OR - F4-01 Mietkündigung Zustelltag').art).toBe('gueltig');
    expect(pruefeFachaenderungForm('F4-01 Mietkündigung Zustelltag').art).toBe('mangel');
    expect(pruefeFachaenderungForm('— F4-01 Mietkündigung Zustelltag').art).toBe('mangel');
  });
});

// ─── each-Tabellen (Gegenprüfung RL-03, SHA 2006823bf, Befund 1/2) ────────────
// Befund: die Datenzeilen von it.each/test.each/describe.each flossen nicht in
// die Multimenge — «erwartet 50 → 999999» in einer Tabellenzeile blieb grün.
const KOPF = `import { describe, it, expect } from 'vitest';\nimport { f } from '../lib/verjaehrung';\n`;
const eachText = (tabelle: string, aufruf = 'it.each', vorspann = '') =>
  KOPF + vorspann + `describe('d', () => {\n  ${aufruf}(${tabelle})('Fall %s', (a, b) => {\n    expect(f(a)).toBe(b);\n  });\n});\n`;
const tagText = (zeilen: string) =>
  KOPF + 'describe(\'d\', () => {\n  it.each`\n    a    | b\n' + zeilen + '  `(\'Fall $a\', ({ a, b }) => {\n    expect(f(a)).toBe(b);\n  });\n});\n';
const descEachText = (tabelle: string) =>
  KOPF + `describe.each(${tabelle})('Gruppe %s', (a, b) => {\n  it('t', () => {\n    expect(f(a)).toBe(b);\n  });\n});\n`;
const stand = (alt: string, neu: string): TestStand[] => [{ datei: 'src/tests/v.test.ts', alt, neu }];
const TAB = '[[1, 50], [2, 60]]';

describe('check:fachaenderung — each-Tabellen im Assertion-Diff', () => {
  it('(i) ROT: it.each-Array, eine Datenzeile geändert (50 → 999999)', () => {
    expect(eingabe(stand(eachText(TAB), eachText('[[1, 999999], [2, 60]]'))).rot).toBe(true);
  });
  it('(ii) ROT: it.each-Array, eine Datenzeile entfernt', () => {
    expect(eingabe(stand(eachText(TAB), eachText('[[1, 50]]'))).rot).toBe(true);
  });
  it('(iii) GRÜN: it.each-Array, eine Datenzeile hinzugefügt', () => {
    expect(eingabe(stand(eachText(TAB), eachText('[[1, 50], [2, 60], [3, 70]]'))).rot).toBe(false);
  });
  it('(iv) ROT: Tagged-Template-Tabelle, eine Zeile geändert', () => {
    const alt = tagText('    ${1} | ${50}\n    ${2} | ${60}\n');
    expect(eingabe(stand(alt, tagText('    ${1} | ${999999}\n    ${2} | ${60}\n'))).rot).toBe(true);
    expect(eingabe(stand(alt, tagText('    ${1} | ${50}\n'))).rot).toBe(true);
    expect(eingabe(stand(alt, tagText('    ${1} | ${50}\n    ${2} | ${60}\n    ${3} | ${70}\n'))).rot).toBe(false);
  });
  it('(v) ROT: describe.each analog (geändert/entfernt), hinzugefügt grün', () => {
    expect(eingabe(stand(descEachText(TAB), descEachText('[[1, 999999], [2, 60]]'))).rot).toBe(true);
    expect(eingabe(stand(descEachText(TAB), descEachText('[[2, 60]]'))).rot).toBe(true);
    expect(eingabe(stand(descEachText(TAB), descEachText('[[1, 50], [2, 60], [3, 70]]'))).rot).toBe(false);
  });
  it('(vi) it.skip.each und it.each(…).skip werden als (abgeschalteter) Test erkannt', () => {
    for (const text of [eachText(TAB, 'it.skip.each'), KOPF + `it.each(${TAB}).skip('Fall %s', (a, b) => { expect(f(a)).toBe(b); });\n`]) {
      const m = assertionMengen(text, 'src/tests/v.test.ts');
      expect([...m.ittest.keys()]).toEqual(['⊘Fall%s']);
      expect(m.each.size).toBe(2);
    }
    expect(eingabe(stand(eachText(TAB, 'it.skip.each'), eachText('[[1, 999999], [2, 60]]', 'it.skip.each'))).rot).toBe(true);
    expect(eingabe(stand(eachText(TAB), eachText(TAB, 'it.concurrent.each'))).rot).toBe(false);
  });
  it('(vii) GRÜN: reine Formatierung der Tabelle (Whitespace/Zeilenumbruch)', () => {
    expect(eingabe(stand(eachText(TAB), eachText('[\n      [1,50],\n      [ 2 , 60 ],\n    ]'))).rot).toBe(false);
    const alt = tagText('    ${1} | ${50}\n    ${2} | ${60}\n');
    expect(eingabe(stand(alt, tagText('    ${1}     |    ${50}\n\n    ${2}|${60}\n'))).rot).toBe(false);
  });
  it('(viii) ROT: Tabellen-Konstante derselben Datei (auch via Spread/.map) — Zeile geändert oder entfernt', () => {
    const k = (werte: string, arg = 'FAELLE') => eachText(arg, 'it.each', `const FAELLE = ${werte} as const;\n`);
    expect(eingabe(stand(k(TAB), k('[[1, 999999], [2, 60]]'))).rot).toBe(true);
    expect(eingabe(stand(k(TAB), k('[[2, 60]]'))).rot).toBe(true);
    expect(eingabe(stand(k(TAB), k('[[1, 50], [2, 60], [3, 70]]'))).rot).toBe(false);
    expect(eingabe(stand(k(TAB, '[...FAELLE]'), k('[[1, 999999], [2, 60]]', '[...FAELLE]'))).rot).toBe(true);
    expect(eingabe(stand(k(TAB, 'FAELLE.map((z) => z)'), k('[[1, 999999], [2, 60]]', 'FAELLE.map((z) => z)'))).rot).toBe(true);
  });
});

// ─── CLI-Einstieg (Nebenfund Nachzug RL-03, 24.9.2026) ─────────────────────────
// Der Einstiegs-Guard `argv.some(/test-assertion-diff\.ts$/)` (b8d9a3ddd) war
// unter vite-node IMMER falsch (argv = [node, vite-node-Bin, …Argumente]) —
// der dokumentierte Aufruf (Skill landung, referenz-jules.md) endete still mit
// Exit 0. Derselbe Defekt wie dispatch.ts 20.7.2026 (scripts/dispatch-cli.ts).
describe('test-assertion-diff — CLI-Einstieg unter vite-node', () => {
  it('ohne Argumente: Usage auf stderr und Exit 2, kein stiller No-op', () => {
    const r = spawnSync('npx', ['vite-node', 'scripts/analyse/test-assertion-diff.ts'], { encoding: 'utf8' });
    expect(r.stderr).toMatch(/Usage/);
    expect(r.status).toBe(2);
  }, 60_000);
});

// ─── aus src/tests/check-testtreue.test.ts ─────────────────────────────────────
// src/tests/check-testtreue.test.ts — §6.3-Diff-Tor: der reine Kern, ohne git
// (QS-AUDIT-VERWEISE 8.8.2026). Der Rot-Fall hier ist der §6.7-Beweis, dass
// das Tor scheitern kann; der Live-Rot-Lauf ist im Bau-Protokoll dokumentiert.

const commit = (betreff: string, dateien: string[]): CommitInfo => ({ sha: 'deadbeef00', betreff, dateien });

describe('check:testtreue — §6.3 (Tests bleiben bei Refactorings unangetastet)', () => {
  it('ROT: als refactor deklarierter Commit ändert eine Test-Datei', () => {
    const v = findeVerstoesse([
      commit('refactor(engine): verjaehrung entdoppelt', ['src/lib/verjaehrung/engine.ts', 'src/tests/verjaehrung.test.ts']),
    ]);
    expect(v).toHaveLength(1);
    expect(v[0].testDateien).toEqual(['src/tests/verjaehrung.test.ts']);
  });

  it('ROT auch bei Scope-losem refactor: und bei e2e-Dateien', () => {
    expect(findeVerstoesse([commit('refactor: split', ['e2e/a11y.e2e.ts'])])).toHaveLength(1);
    expect(findeVerstoesse([commit('refactor!: breaking split', ['src/lib/x.test.ts'])])).toHaveLength(1);
  });

  it('GRÜN: refactor ohne Test-Berührung', () => {
    expect(findeVerstoesse([commit('refactor(ui): karten entdoppelt', ['src/components/Card.tsx'])])).toHaveLength(0);
  });

  it('GRÜN: fachlicher Commit darf Tests ändern — genau das verlangt §6.3 (eigener, deklarierter Schritt)', () => {
    expect(findeVerstoesse([
      commit('fix(verjaehrung): Stichtagsregel korrigiert', ['src/lib/verjaehrung/engine.ts', 'src/tests/verjaehrung.test.ts']),
      commit('test(plan): Regressionstest ergänzt', ['src/tests/plan-lage.test.ts']),
    ])).toHaveLength(0);
  });

  it('erkennt refactor-Deklarationen präzise (kein Treffer auf «feat: refactor vorbereiten»)', () => {
    expect(istRefactorCommit('refactor(plan-bild): …')).toBe(true);
    expect(istRefactorCommit('feat: refactor vorbereiten')).toBe(false);
    expect(istRefactorCommit('docs(refactoring): Skill ergänzt')).toBe(false);
  });

  it('Präfix-Grenzfälle: refactor!: , refactor(scope): und Gross-/Kleinschreibung — Ist-Verhalten eingefroren (Regelaudit 14.8.2026)', () => {
    // Scope + Breaking-Marker, beide bereits oben über findeVerstoesse indirekt geprüft —
    // hier explizit auf der reinen Klassifikator-Funktion, unabhängig von Testdatei-Erkennung.
    expect(istRefactorCommit('refactor(scope): x')).toBe(true);
    expect(istRefactorCommit('refactor!: x')).toBe(true);
    expect(istRefactorCommit('refactor(scope)!: x')).toBe(true);
    // Regex trägt das /i-Flag: Gross-/Kleinschreibung ist heute EGAL — das ist der
    // Ist-Zustand, nicht die Soll-Vorgabe; dieser Test hält ihn fest, ändert ihn nicht.
    expect(istRefactorCommit('Refactor: x')).toBe(true);
    expect(istRefactorCommit('REFACTOR(scope): x')).toBe(true);
    // Ohne Trenner nach dem Wort ist es kein Treffer (kein Conventional-Commit-Typ).
    expect(istRefactorCommit('refactoring: x')).toBe(false);
    expect(istRefactorCommit('refactor x')).toBe(false);
  });

  it('klassifiziert Test-Dateien wie §6.3 sie meint', () => {
    expect(istTestDatei('src/tests/plan-check.test.ts')).toBe(true);
    expect(istTestDatei('e2e/verzahnung.e2e.ts')).toBe(true);
    expect(istTestDatei('src/lib/foo.test.tsx')).toBe(true);
    expect(istTestDatei('src/lib/verjaehrung/engine.ts')).toBe(false);
    expect(istTestDatei('scripts/check-testtreue.ts')).toBe(false);
  });
});

// ─── aus src/tests/steuerwerkzeuge.test.ts (PR #1026, 23.9.2026) ───────────────
// Squash-Regel als Teil von R1, beim Rebase von RL-03 (24.9.2026) hierher
// übertragen: gleiche Fälle; der vierte («nur im pull_request-Lauf») prüft
// jetzt prTitelAusEreignis + bewerte statt der früheren squashMeldung.
describe('check:fachaenderung R1 — Squash-Commit der Merge-Queue (PR-Titel, Beleg #1023)', () => {
  const c = (betreff: string, dateien: string[]) => ({ sha: 'x', betreff, dateien });
  it('refactor-Titel + deklarierter test-Commit ⇒ Verstoss (Beleg #1023)', () => {
    const v = squashVerstoss('refactor(vorlagen): V2d+V2e', [
      c('refactor(vorlagen): V2d', ['src/pages/A.tsx']),
      c('test(vorlagen): Schwelle', ['src/tests/design-r9-fehlerbox-baustein.test.ts']),
    ]);
    expect(v?.testDateien).toEqual(['src/tests/design-r9-fehlerbox-baustein.test.ts']);
  });
  it('feat-Titel mit Test-Änderung ⇒ kein Verstoss', () => {
    expect(squashVerstoss('feat(vorlagen): x', [c('test: y', ['e2e/a.e2e.ts'])])).toBeNull();
  });
  it('refactor-Titel ohne Test-Dateien ⇒ kein Verstoss', () => {
    expect(squashVerstoss('refactor: x', [c('refactor: y', ['src/lib/a.ts'])])).toBeNull();
  });
  it('Ereignis: nur im pull_request-Lauf, sonst stumm', () => {
    const lies = () => JSON.stringify({ pull_request: { title: 'refactor: x' } });
    const cs = [c('test: y', ['src/tests/a.test.ts'])];
    const titel = prTitelAusEreignis({ GITHUB_EVENT_NAME: 'pull_request', GITHUB_EVENT_PATH: 'e' }, lies);
    expect(titel).toBe('refactor: x');
    expect(prTitelAusEreignis({ GITHUB_EVENT_NAME: 'merge_group', GITHUB_EVENT_PATH: 'e' }, lies)).toBeUndefined();
    expect(prTitelAusEreignis({}, lies)).toBeUndefined();
    const rot = bewerte({ commits: cs, engineBefunde: [], goldenGeaendert: false, trailer: [], quelle: 'q', prTitel: titel });
    expect(rot.rot).toBe(true);
    expect(rot.text).toMatch(/Squash/);
    expect(rot.text).toMatch(/#1023/);
    const still = bewerte({ commits: cs, engineBefunde: [], goldenGeaendert: false, trailer: [], quelle: 'q', prTitel: undefined });
    expect(still.rot).toBe(false);
  });
});
