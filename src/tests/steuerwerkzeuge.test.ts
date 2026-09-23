// src/tests/steuerwerkzeuge.test.ts — die drei Nicht-Plan-Steuerwerkzeuge. scripts/dispatch(-agents) · scripts/testtreue-kern · scripts/ci/diff-klassieren.
// Zusammengelegt 31.8.2026 (QS-EFFIZIENZ, Ent-Regulierung Runde 2 Batch B; Beleg:
// bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md §3 Kandidat 1). Die
// Fälle stehen WÖRTLICH unter dem Banner ihrer Herkunftsdatei; gestrichen wurde
// nur ein wörtliches Rumpf-Duplikat (ROADMAP-CHRONIK.md, 31.8.2026).
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  type CommitInfo,
  findeVerstoesse,
  istRefactorCommit,
  squashVerstoss,
  istTestDatei,
} from '../../scripts/testtreue-kern';
import {
  CODE_FERNE_MUSTER,
  klassifiziereDateien,
  klassifiziereDiff,
  WERKZEUG_TROTZ_MD_MUSTER,
} from '../../scripts/ci/diff-klassieren';
import {
  dispatchText,
  KLASSEN,
  type Klauselvariante,
  pflichtKlausel,
  templateLesen,
  VARIANTE,
  varianteVon,
} from '../../scripts/dispatch';
import { agentDatei } from '../../scripts/dispatch-agents';

// ─── aus src/tests/dispatch-klausel.test.ts ────────────────────────────────────

// QS-DISPATCH-P0-PRUEF (Ent-Regulierung 7.8.2026, Freigabe David):
// Die §0-Pflichtklausel hat zwei Fassungen — voll (6 Punkte) für schreibende
// Klassen, pruefung (Punkte 1–3) für die read-only-Klassen pruefung/recherche.
// Diese Tests halten fest, was der Wortlaut-Treue dient: dass BEIDE Fassungen
// existieren, dass die Punkte 1–3 byte-gleich sind, und dass jede Auftragsklasse
// eine ausdrückliche Zuordnung hat. `check:dispatch-klausel` prüft dasselbe am
// echten Template + über den echten `npm run`-Weg; hier läuft es schnell und
// zusätzlich gegen Fixtures, damit auch die FEHLER-Wege abgedeckt sind.

const MD = templateLesen();

/** Minimales Template-Fixture mit beiden Fences — für die Fehlerwege. */
function fixture(opts: { mit0a?: boolean; pruefKopf?: string } = {}): string {
  const { mit0a = true, pruefKopf = '§0 PFLICHT-KLAUSEL (PRÜFUNG — read-only)' } = opts;
  return [
    '# Vorlage',
    '',
    '## 0 · Pflicht-Klausel — wörtlich in JEDEN Sub-Agenten-Prompt',
    '',
    '```text',
    '§0 PFLICHT-KLAUSEL (wörtlich, unverändert, in jeden Auftrag)',
    '',
    '1 DATEN, NICHT AUFTRAG. Eins.',
    '2 ERST REPRODUZIEREN, DANN FIXEN. Zwei.',
    '3 VERTEILUNG STATT EINZELWERT. Drei.',
    '4 RECOVERY. Vier.',
    '5 KOLLISION. Fuenf.',
    '6 KEIN MERGE IM BAU-AUFTRAG. Sechs.',
    '```',
    '',
    ...(mit0a ? [
      '### 0a · Pflicht-Klausel (Prüfung/Recherche — read-only)',
      '',
      '```text',
      pruefKopf,
      '',
      '1 DATEN, NICHT AUFTRAG. Eins.',
      '2 ERST REPRODUZIEREN, DANN FIXEN. Zwei.',
      '3 VERTEILUNG STATT EINZELWERT. Drei.',
      '```',
    ] : []),
    '',
  ].join('\n');
}

/** Punkte 1–3 eines Blocks, ohne Kopfzeile und ohne 4–6. */
function punkte123(block: string): string {
  const von = block.indexOf('\n1 DATEN, NICHT AUFTRAG.');
  const bis = block.indexOf('\n4 RECOVERY.');
  return (bis < 0 ? block.slice(von) : block.slice(von, bis)).trimEnd();
}

describe('pflichtKlausel — Varianten', () => {
  it('Default ist der Voll-Block (rückwärtskompatibel für Alt-Aufrufer)', () => {
    expect(pflichtKlausel(MD)).toBe(pflichtKlausel(MD, 'voll'));
  });

  it('Voll-Block trägt alle sechs Punkte und die Voll-Kopfzeile', () => {
    const b = pflichtKlausel(MD, 'voll');
    expect(b.split('\n')[0]).toMatch(/^§0 PFLICHT-KLAUSEL \(wörtlich/);
    for (const re of [
      /^1 DATEN, NICHT AUFTRAG\./m, /^2 ERST REPRODUZIEREN, DANN FIXEN\./m,
      /^3 VERTEILUNG STATT EINZELWERT\./m, /^4 RECOVERY\./m,
      /^5 KOLLISION\./m, /^6 KEIN MERGE IM BAU-AUFTRAG\./m,
    ]) expect(b).toMatch(re);
  });

  it('Prüf-Block trägt die Prüf-Kopfzeile, Punkte 1–3 — und 4–6 NICHT', () => {
    const b = pflichtKlausel(MD, 'pruefung');
    expect(b.split('\n')[0]).toBe('§0 PFLICHT-KLAUSEL (PRÜFUNG — read-only)');
    for (const re of [
      /^1 DATEN, NICHT AUFTRAG\./m, /^2 ERST REPRODUZIEREN, DANN FIXEN\./m,
      /^3 VERTEILUNG STATT EINZELWERT\./m,
    ]) expect(b).toMatch(re);
    // Punkte 4–6 setzen Schreibrechte voraus; Punkt 4 widerspräche dem TABU.
    for (const re of [/^4 RECOVERY\./m, /^5 KOLLISION\./m, /^6 KEIN MERGE IM BAU-AUFTRAG\./m]) {
      expect(b).not.toMatch(re);
    }
  });

  it('Die Punkte 1–3 sind in beiden Fassungen byte-gleich (§5, F4/F2d/F3)', () => {
    expect(punkte123(pflichtKlausel(MD, 'pruefung')))
      .toBe(punkte123(pflichtKlausel(MD, 'voll')));
  });

  it('Der Prüf-Block ist echt kürzer — sonst spart die Variante nichts', () => {
    expect(pflichtKlausel(MD, 'pruefung').length)
      .toBeLessThan(pflichtKlausel(MD, 'voll').length);
  });

  it('Template trägt beide ```text-Fences im §0-Bereich', () => {
    const ab = MD.indexOf('## 0 · Pflicht-Klausel');
    const bis = MD.indexOf('### §0 über Agent-Typen');
    expect(ab).toBeGreaterThanOrEqual(0);
    expect(bis).toBeGreaterThan(ab);
    expect(MD.slice(ab, bis).match(/```text/g)).toHaveLength(2);
    expect(MD).toContain('### 0a · Pflicht-Klausel');
  });
});

describe('pflichtKlausel — Fehlerwege (das Tor darf nicht blind werden)', () => {
  it('fehlender 0a-Abschnitt wirft, statt still den Voll-Block zu liefern', () => {
    expect(() => pflichtKlausel(fixture({ mit0a: false }), 'pruefung'))
      .toThrow(/0a · Pflicht-Klausel/);
  });

  it('falsche Kopfzeile im Prüf-Fence wirft (Fence-Verwechslung)', () => {
    const md = fixture({ pruefKopf: '§0 PFLICHT-KLAUSEL (wörtlich, unverändert, in jeden Auftrag)' });
    expect(() => pflichtKlausel(md, 'pruefung')).toThrow(/Kopfzeile/);
  });

  it('intaktes Fixture liefert beide Varianten', () => {
    const md = fixture();
    expect(pflichtKlausel(md, 'voll')).toMatch(/^§0 PFLICHT-KLAUSEL \(wörtlich/);
    expect(pflichtKlausel(md, 'pruefung')).toMatch(/^§0 PFLICHT-KLAUSEL \(PRÜFUNG/);
  });
});

describe('VARIANTE — Zuordnung Klasse → Fassung', () => {
  it('deckt JEDE Auftragsklasse aus KLASSEN ab', () => {
    const ohne = Object.keys(KLASSEN).filter((k) => !(k in VARIANTE));
    expect(ohne).toEqual([]);
  });

  it('kennt keine Klasse, die es in KLASSEN nicht gibt', () => {
    const verwaist = Object.keys(VARIANTE).filter((k) => !(k in KLASSEN));
    expect(verwaist).toEqual([]);
  });

  it('vergibt nur gültige Fassungen', () => {
    const gueltig: Klauselvariante[] = ['voll', 'pruefung'];
    for (const [k, v] of Object.entries(VARIANTE)) {
      expect(gueltig, `Klasse ${k}`).toContain(v);
    }
  });

  it('genau die read-only-Klassen tragen die Prüf-Fassung', () => {
    const pruef = Object.keys(KLASSEN).filter((k) => varianteVon(k) === 'pruefung');
    expect(pruef.sort()).toEqual(['pruefung', 'recherche']);
  });

  it('varianteVon fällt bei unbekannter Klasse fail-safe auf voll', () => {
    expect(varianteVon('gibtsnicht')).toBe('voll');
  });
});

// Befund B3 der Gegenprüfung 7.8.2026: Die Soll-Liste lebte NUR im Test. Eine
// Herabstufung (daten → pruefung) samt Regeneration war in sich konsistent —
// Tabelle, Wrapper, Generator, Projektion — und ging grün durchs Tor. Sie steht
// seither auch in check-dispatch-klausel.ts. Befund B1: der Hook-Vorschlag
// erkennt einen echten Prüf-Dispatch am read-only-TABU der Klasse, zitiert
// wörtlich aus KLASSEN. Beide Kopplungen werden hier festgehalten.
describe('Kopplungen ausserhalb dieses Moduls (B1/B3)', () => {
  const tor = readFileSync('scripts/check-dispatch-klausel.ts', 'utf8');
  // Seit der Anwendung des Vorschlags (QS-EFFIZIENZ Pkt. 2, 14.8.2026) lebt
  // der Hook am aktiven Ort; die Vorschlagsdatei ist gelöscht (§5).
  const hook = readFileSync('.claude/hooks/dispatch-schutz.py', 'utf8');

  it('das Tor führt dieselbe Soll-Liste read-only wie dieser Test', () => {
    expect(tor).toContain("const READONLY_SOLL = ['pruefung', 'recherche'] as const");
  });

  it('der Hook zitiert das read-only-TABU beider Klassen wörtlich aus KLASSEN', () => {
    for (const klasse of ['pruefung', 'recherche']) {
      const tabuZeile = KLASSEN[klasse].split('\n')[0];
      expect(tabuZeile, klasse).toMatch(/^TABU: /);
      // Der Hook trägt einen Präfix dieser Zeile — lang genug, um die Klasse
      // zu identifizieren, kurz genug, um Satzende-Kosmetik zu überleben.
      const praefix = tabuZeile.slice(0, 20);
      expect(hook, `${klasse}: «${praefix}…»`).toContain(praefix);
    }
  });

  it('der Hook verlangt bei der Prüf-Kopfzeile ein zweites Merkmal', () => {
    // Ohne das käme ein Bau-Auftrag, der die Kopfzeile nur ZITIERT, mit drei
    // Punkten durch (gemessene Proben b/g der Gegenprüfung: exit 0 statt 2).
    expect(hook).toContain('PRUEF_TABU');
    expect(hook).toContain('ist_pruefung = kopf_da and tabu_da');
  });
});

describe('dispatchText — die Variante kommt am Auftrag an', () => {
  it.each(Object.keys(KLASSEN))('Klasse %s trägt die richtige Kopfzeile', (klasse) => {
    const text = dispatchText(klasse, MD);
    const erwartet = varianteVon(klasse) === 'pruefung'
      ? /^§0 PFLICHT-KLAUSEL \(PRÜFUNG/
      : /^§0 PFLICHT-KLAUSEL \(wörtlich/;
    expect(text.split('\n')[0]).toMatch(erwartet);
    expect(text).toContain(KLASSEN[klasse]);
  });

  it('read-only-Klassen bekommen die Punkte 4–6 nicht', () => {
    for (const klasse of ['pruefung', 'recherche']) {
      const text = dispatchText(klasse, MD);
      expect(text, klasse).not.toMatch(/^4 RECOVERY\./m);
      expect(text, klasse).not.toMatch(/^5 KOLLISION\./m);
      expect(text, klasse).not.toMatch(/^6 KEIN MERGE IM BAU-AUFTRAG\./m);
    }
  });

  it('schreibende Klassen behalten alle sechs Punkte', () => {
    for (const klasse of ['bau', 'daten', 'mechanisch', 'synthese']) {
      const text = dispatchText(klasse, MD);
      expect(text, klasse).toMatch(/^4 RECOVERY\./m);
      expect(text, klasse).toMatch(/^5 KOLLISION\./m);
      expect(text, klasse).toMatch(/^6 KEIN MERGE IM BAU-AUFTRAG\./m);
    }
  });
});

describe('agentDatei — die Agent-Typen erben dieselbe Variante', () => {
  it.each(Object.keys(KLASSEN))('lex-%s trägt die Fassung seiner Klasse', (klasse) => {
    const datei = agentDatei(klasse, MD);
    const erwartet = varianteVon(klasse) === 'pruefung'
      ? '§0 PFLICHT-KLAUSEL (PRÜFUNG — read-only)'
      : '§0 PFLICHT-KLAUSEL (wörtlich, unverändert, in jeden Auftrag)';
    expect(datei).toContain(erwartet);
  });

  it('lex-pruefung und lex-recherche tragen keine Schreib-Punkte', () => {
    for (const klasse of ['pruefung', 'recherche']) {
      expect(agentDatei(klasse, MD), klasse).not.toMatch(/^4 RECOVERY\./m);
    }
  });
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


// ─── aus src/tests/ci-diff-klassieren.test.ts ──────────────────────────────────
// src/tests/ci-diff-klassieren.test.ts

// §6.7-Beweis: die vier Testfälle aus dem Auftrag (QS-PLAN-EINFACH, 14.8.2026,
// Punkt 3), gegen die volle Drei-Klassen-Entscheidung (Modell des PR-Zweigs).
describe('klassifiziereDiff — Auftrags-Testmatrix', () => {
  it('[nur ROADMAP.md] → doku', () => {
    expect(klassifiziereDiff(['ROADMAP.md'])).toBe('doku');
  });

  it('[scripts/plan/x.ts] → code-fern', () => {
    expect(klassifiziereDiff(['scripts/plan/x.ts'])).toBe('code-fern');
  });

  it('[src/App.tsx] → code', () => {
    expect(klassifiziereDiff(['src/App.tsx'])).toBe('code');
  });

  it('[scripts/plan/x.ts + src/App.tsx] → code (eine app-nahe Datei genügt)', () => {
    expect(klassifiziereDiff(['scripts/plan/x.ts', 'src/App.tsx'])).toBe('code');
  });

  // Anlass PR #619 (2.9.2026): .claude/agents/lex-bau.md wurde von Hand
  // geändert, der reine-.md-Kurzschluss stufte den Diff als `doku` ein, der
  // Tore-Job (u. a. check:dispatch-klausel) lief nicht (§6.7).
  it('[.claude/agents/lex-bau.md] → code-fern (nicht doku — Tore-Job muss laufen)', () => {
    expect(klassifiziereDiff(['.claude/agents/lex-bau.md'])).toBe('code-fern');
  });

  it('[.claude/agents/lex-bau.md + lex-daten.md] → code-fern (nicht doku)', () => {
    expect(klassifiziereDiff(['.claude/agents/lex-bau.md', '.claude/agents/lex-daten.md'])).toBe(
      'code-fern',
    );
  });

  it('[docs/token-oekonomie/dispatch-template.md] → code-fern (nicht doku)', () => {
    expect(klassifiziereDiff(['docs/token-oekonomie/dispatch-template.md'])).toBe('code-fern');
  });

  it('[.claude/agents/lex-bau.md + ROADMAP.md] → code-fern (gemischt mit echter Doku bleibt code-fern)', () => {
    expect(klassifiziereDiff(['.claude/agents/lex-bau.md', 'ROADMAP.md'])).toBe('code-fern');
  });
});

// merge_group-Zweig (ci.yml, 19.9.2026, QS-ORG-UMZUG/QS-CI-MINUTEN): die Queue
// klassiert den Diff je Eintrag mit DERSELBEN Drei-Klassen-Regel. Festgehalten
// sind die beiden ersten echten Queue-Einträge (Dateilisten über die
// Compare-API gemessen 19.9.2026, base_sha...head_sha):
//   #922  135ec0cba...06489b10c → doku
//   #917  06489b10c...9b125ce8e → code (gestapelt HINTER #922: base = Vordermann)
// EHRLICH ETIKETTIERT (Auflage Gegenprüfung 19.9.2026): die zwei Fälle prüfen
// das TS-MODELL, nicht die in ci.yml gebaute Bash-Fassung — sie dokumentieren
// die gemessenen Dateilisten. Dass Bash und TS dieselben Muster tragen UND
// unter echtem `grep -E` gleich entscheiden, sichern die Paritäts-Blöcke am
// Dateiende.
describe('klassifiziereDiff — dokumentiert die am 19.9.2026 gemessenen Dateilisten von #922/#917', () => {
  it('#922 [ROADMAP.md + fahrplaene/*.md] → doku', () => {
    expect(
      klassifiziereDiff(['ROADMAP.md', 'fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md']),
    ).toBe('doku');
  });

  it('#917 [2× .md + scripts/check-perf-budget.ts] → code (scripts/** ausserhalb plan/cowork)', () => {
    expect(
      klassifiziereDiff(['DESIGN-REGLEMENT.md', 'ROADMAP.md', 'scripts/check-perf-budget.ts']),
    ).toBe('code');
  });
});

describe('klassifiziereDateien — die einzelnen code-fernen Flächen', () => {
  it('scripts/cowork/** ist code-fern', () => {
    expect(klassifiziereDateien(['scripts/cowork/y.ts'])).toBe('code-fern');
  });

  it('.claude/** ist code-fern', () => {
    expect(klassifiziereDateien(['.claude/agents/foo.md'])).toBe('code-fern');
  });

  it('docs/** ist code-fern', () => {
    expect(klassifiziereDateien(['docs/anleitung.md'])).toBe('code-fern');
  });

  it('bibliothek/** ist code-fern', () => {
    expect(klassifiziereDateien(['bibliothek/register/x.md'])).toBe('code-fern');
  });

  it('messwerte/** ist code-fern', () => {
    expect(klassifiziereDateien(['messwerte/lauf.json'])).toBe('code-fern');
  });

  it('archiv/** ist code-fern', () => {
    expect(klassifiziereDateien(['archiv/FAHRPLAN-ALT.md'])).toBe('code-fern');
  });

  it('mehrere code-ferne Dateien zusammen bleiben code-fern', () => {
    expect(klassifiziereDateien(['scripts/plan/x.ts', 'docs/y.md', 'ROADMAP.md'])).toBe('code-fern');
  });

  // KONSERVATIV: jede andere Fläche kippt auf `code` — auch scripts/** ausserhalb
  // von plan/cowork, e2e/** und package.json (Auftrag: "konservativ").
  it('package.json ist code (keine Ausnahme)', () => {
    expect(klassifiziereDateien(['package.json'])).toBe('code');
  });

  it('e2e/** ist code (keine Ausnahme)', () => {
    expect(klassifiziereDateien(['e2e/foo.e2e.ts'])).toBe('code');
  });

  it('scripts/** ausserhalb plan/cowork ist code', () => {
    expect(klassifiziereDateien(['scripts/logik-sweep.ts'])).toBe('code');
  });

  it('scripts/plan/x.ts + scripts/logik-sweep.ts → code (ein Ausreisser genügt)', () => {
    expect(klassifiziereDateien(['scripts/plan/x.ts', 'scripts/logik-sweep.ts'])).toBe('code');
  });
});

// ─── Bash↔TS-Parität: CODE_FERN_RE/WERKZEUG_TROTZ_MD_RE ────────────────────────
// Bug-Check PR #626 (2.9.2026): ci.yml pflegt die beiden Klassierungsmuster als
// Bash-ERE-Literale (Zeile ~178/184) PARALLEL zu den TS-Regex-Arrays in
// diff-klassieren.ts (CODE_FERNE_MUSTER/WERKZEUG_TROTZ_MD_MUSTER) — ohne
// diesen Test kann eine Seite driften, ohne dass ein Tor es je bemerkt (§6.7).

describe('Bash↔TS-Parität — CODE_FERN_RE/WERKZEUG_TROTZ_MD_RE (Bug-Check #626)', () => {
  const ciYml = readFileSync('.github/workflows/ci.yml', 'utf8');

  function bashMuster(name: string): string {
    const treffer = ciYml.match(new RegExp(`^\\s*${name}='\\((.+)\\)'$`, 'm'));
    if (!treffer) throw new Error(`${name} nicht in ci.yml gefunden`);
    return treffer[1];
  }

  // `.source` einer JS-Regex-Literal escaped den Delimiter "/" syntaktisch
  // immer als "\/" — reiner JS-Literal-Zwang, keine Bash-Konvention. Für den
  // String-Vergleich mit der unescaped Bash-ERE wird das auf "/" normalisiert;
  // semantisch sind "\/" und "/" in grep -E identisch.
  function tsMuster(muster: readonly RegExp[]): string {
    return muster
      .map((r) => r.source)
      .join('|')
      .replace(/\\\//g, '/');
  }

  it('CODE_FERN_RE (ci.yml) == CODE_FERNE_MUSTER (diff-klassieren.ts)', () => {
    expect(bashMuster('CODE_FERN_RE')).toBe(tsMuster(CODE_FERNE_MUSTER));
  });

  it('WERKZEUG_TROTZ_MD_RE (ci.yml) == WERKZEUG_TROTZ_MD_MUSTER (diff-klassieren.ts)', () => {
    expect(bashMuster('WERKZEUG_TROTZ_MD_RE')).toBe(tsMuster(WERKZEUG_TROTZ_MD_MUSTER));
  });
});


// ─── Bash↔TS-Parität, Verhaltensseite (Auflage Gegenprüfung 19.9.2026) ─────────
// Der Block darüber (#626) vergleicht die Muster TEXTLICH (`.source` gegen das
// ERSTE Literal in ci.yml). Zwei Lücken bleiben, die dieser Block schliesst:
//  1. ein ZWEITES, abweichendes `NAME='…'` weiter unten in ci.yml (z. B. in
//     einem der drei Zweige pull_request/push/merge_group) bliebe unbemerkt;
//  2. Textgleichheit beweist nicht, dass Bash-ERE und JS-Regex dasselbe
//     ENTSCHEIDEN — das ist bisher nur angenommen. Darum klassiert eine
//     Pfad-Stichprobe (≥ 20, mit Grenzfällen für Anker, Punkt-Escape und `$`)
//     mit dem ECHTEN `grep -E` gegen das ci.yml-Literal und mit den TS-Mustern;
//     die Treffermengen müssen gleich sein.
// Vergleichsform bewusst BEIDES statt nur eines: `.source` ist die strengere
// Drift-Sonde (jedes Zeichen), die Stichprobe die einzige, die das gebaute
// Werkzeug (grep -E) wirklich ausführt. §6.7-Rot-Beweis 19.9.2026: `^docs/` →
// `docs/` in ci.yml ⇒ Stichprobe rot an `src/docs/x.ts`; zweites abweichendes
// Literal ⇒ Fall 1 rot (der #626-Block bleibt dabei GRÜN).
describe('Bash↔TS-Parität — alle Literale, echtes grep -E, drei Zweige (19.9.2026)', () => {
  const ciYml = readFileSync('.github/workflows/ci.yml', 'utf8');

  function alleLiterale(name: string): string[] {
    return [...ciYml.matchAll(new RegExp(`^\\s*${name}='(.*)'\\s*$`, 'gm'))].map((t) => t[1]);
  }

  const STICHPROBE = [
    'ROADMAP.md',
    'fahrplaene/FAHRPLAN-X.md',
    'README.mdx', // `\.md$`: Endanker
    'notizen/amd', // `\.md$`: Punkt ist escaped
    'src/x.md.ts',
    'a.md/b.ts', // Verzeichnis namens *.md
    'src/App.tsx',
    'src/lib/x.ts',
    'src/docs/x.ts', // `^docs/`: Anfangsanker
    'scripts/plan/x.ts',
    'scripts/planung/x.ts', // `^scripts/plan/`: Schrägstrich gehört zum Muster
    'scripts/cowork/y.ts',
    'scripts/check-perf-budget.ts',
    '.claude/agents/lex-bau.md',
    '.claude/settings.json',
    'xclaude/a.ts', // `^\.claude/`: Punkt ist escaped
    'docs/x.md',
    'docs/token-oekonomie/dispatch-template.md',
    'docs/token-oekonomie/dispatch-template.md.bak', // `$` im Werkzeug-Muster
    'docs/token-oekonomie/dispatch-templateXmd', // Punkt-Escape im Werkzeug-Muster
    'bibliothek/INDEX.md',
    'messwerte/a.json',
    'archiv/alt.ts',
    'package.json',
    'e2e/a.e2e.ts',
    '.github/workflows/ci.yml',
    'public/normtext/or.json',
  ];

  function grepTreffer(ere: string): string[] {
    try {
      const aus = execFileSync('grep', ['-E', ere], { input: STICHPROBE.join('\n') + '\n' });
      return aus.toString('utf8').split('\n').filter(Boolean);
    } catch (e) {
      if ((e as { status?: number }).status === 1) return []; // grep: kein Treffer
      throw e;
    }
  }

  it.each([
    ['CODE_FERN_RE', CODE_FERNE_MUSTER],
    ['WERKZEUG_TROTZ_MD_RE', WERKZEUG_TROTZ_MD_MUSTER],
  ] as const)('%s: jedes Literal in ci.yml identisch, grep -E == TS auf der Stichprobe', (name, ts) => {
    const literale = alleLiterale(name);
    expect(literale.length).toBeGreaterThanOrEqual(1);
    expect(new Set(literale).size).toBe(1);
    const viaTs = STICHPROBE.filter((d) => ts.some((re) => re.test(d)));
    expect(grepTreffer(literale[0])).toEqual(viaTs);
    // Nicht-leer und nicht-alles: sonst wäre die Stichprobe kein Beweis.
    expect(viaTs.length).toBeGreaterThan(0);
    expect(viaTs.length).toBeLessThan(STICHPROBE.length);
  });

  it('alle drei Zweige (pr/push/mg) werten dieselben zwei grep-Bedingungen aus', () => {
    const doku = [
      ...ciYml.matchAll(
        /if grep -qvE '\\\.md\$' (\S+) \|\| grep -qE "\$WERKZEUG_TROTZ_MD_RE" (\S+); then/g,
      ),
    ];
    const fern = [...ciYml.matchAll(/if grep -qvE "\$CODE_FERN_RE" (\S+); then/g)];
    const soll = ['mg-dateien.txt', 'pr-dateien.txt', 'push-dateien.txt'];
    expect(doku.map((t) => t[1]).sort()).toEqual(soll);
    expect(doku.every((t) => t[1] === t[2])).toBe(true);
    expect(fern.map((t) => t[1]).sort()).toEqual(soll);
  });
});

describe('check:testtreue — Squash-Commit der Merge-Queue (PR-Titel)', () => {
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
});
