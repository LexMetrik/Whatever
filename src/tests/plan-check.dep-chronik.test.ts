import { describe, it, expect } from 'vitest';
import { pruefe } from '../../scripts/plan/check';
import { CHRONIK_DATEI, chronikErledigte, parseRoadmap } from '../../scripts/plan/parse';
import { resolve } from '../../scripts/plan/aufloesen';
import { setField } from '../../scripts/plan/set';

// ---------------------------------------------------------------------------
// Regel 4/4c/4e — dep-ZIELE AUS DER CHRONIK (Schritt QS-EFFIZIENZ, 15.9.2026).
//
// ANLASS (ROADMAP-Zeile «ROADMAP-Deckel bleibt knapp», Messung 14.9.2026):
// `ROADMAP.md` hat ein hartes Ceiling von 120 KiB (struktur-rotieren.py) und
// stand am 14.9.2026 bei 122 875 von 122 880 Bytes — fünf Bytes Luft. Entlastet
// wird es durch Überführung erledigter Schritte nach `ROADMAP-CHRONIK.md`.
// Genau das war für vier `done`-Schritte GESPERRT: Regel 4 («dep-IDs
// existieren») kannte nur `ROADMAP.md`, also hätte jede Überführung eines
// Schrittes, auf den ein lebender Schritt noch `dep` hält, `check:plan` rot
// gemacht. Der Deckel liess sich damit nur noch senken, indem man ENTWEDER die
// dep-Kante fälscht ODER den erledigten Schritt in der ROADMAP festhält —
// beides macht den Plan unwahr.
//
// GEBURTSBEWEIS (§6.7) auf dem Stand `68f3f02a1` (main), OHNE die Änderung,
// `npx vitest run src/tests/plan-check.dep-chronik.test.ts` → «Tests 9 failed |
// 5 passed (14)»:
//   × (a)  AssertionError: expected [ 'A: dep "ARCHIV" existiert nicht' ] to
//          deeply equal []
//   × (a2) TypeError: chronikErledigte is not a function
//   × (a3) expected [ 'A: dep "ARCHIV" existiert nicht' ] to deeply equal []
//   × (c)  expected 'A: dep "HALB" existiert nicht' to contain 'wip'
//   × (e)  expected 'A: dep "ZWEI" existiert nicht' to contain 'mehrdeutig'
//   × (e2) expected [ 'A: dep "ZWEI" existiert nicht' ] to deeply equal []
//   × (f)  expected [Function] to throw error matching /Chronik/ but got
//          'Schritt-id "ARCHIV" nicht gefunden'
//   × chronikErledigte × 2 — TypeError: chronikErledigte is not a function
// (b), (b2), (d), (d2) und (f2) waren schon vorher grün — sie halten die
// Gegenrichtung fest, damit der Fallback nicht zum Freibrief für tote
// dep-Zeiger wird.
//
// ABWEICHUNG vom Auftrag (§7 «abweichend umsetzen und offenlegen»): Der Auftrag
// verlangte «eine ID, die in BEIDEN Dateien steht, ist ein Fehler». Am Bestand
// (Messung 15.9.2026, main) stehen DREI IDs in beiden Dateien —
// `W3-TARIF-STAND` (rm:done/ch:done), `W2·24-DESIGN-IDENTITAET` (rm:done/ch:wip)
// und `W3-TARIF-NACHVERIFIKATION` (rm:done/ch:wip) —, dazu führt die Chronik 16
// Anker mit `status: ready`/`wip`. Das ist kein Defekt, sondern die Bauart der
// Chronik: sie friert WORTLAUT samt damaligem Status ein (Belege werden nie
// nachgeführt) und ist kein Status-Register. Eine harte Doppel-ID-Regel wäre
// also am ersten Lauf rot geworden — an korrekten Einträgen. Die Regel trifft
// darum die Stelle, an der Mehrdeutigkeit real entsteht: **ROADMAP.md gewinnt
// immer**; der Chronik-Fallback greift ausschliesslich für IDs, die in
// ROADMAP.md NICHT (mehr) stehen, und genau dort ist ein mehrdeutiges Archiv
// (dieselbe ID mehrfach mit VERSCHIEDENEM Status) rot.
// ---------------------------------------------------------------------------

const META = (id: string, status: string, dep: string[] = []) =>
  `  <!-- @meta id: ${id} · status: ${status} · blocker: null · dep: [${dep.join(', ')}] · feld: betrieb -->`;

const CB: Record<string, string> = { done: '[x]', wip: '[~]', ready: '[ ]', blocked: '[ ]', parked: '[ ]' };

const eintrag = (id: string, status: string, dep: string[] = []) =>
  [`- ${CB[status]} **Schritt ${id}** *(\`${id}\`)*`, META(id, status, dep)].join('\n');

/** Minimal-ROADMAP: eine Sektion, Einträge, keine @queue, kein Prosa-Marker. */
const roadmap = (...eintraege: string[]) => ['# ROADMAP', '', '## betrieb', '', ...eintraege, ''].join('\n');

const chronik = (...eintraege: string[]) =>
  ['# ROADMAP-CHRONIK', '', '## Umschichtung (Wortlaut)', '', ...eintraege, ''].join('\n');

/** Leser, der NUR die Chronik kennt — kein Dateisystem, kein Fahrplan, keine Zeitreihe. */
const leserMit = (chronikMd: string | null) => (p: string) => (p === CHRONIK_DATEI ? chronikMd : null);

const check = (rm: string, chronikMd: string | null) =>
  pruefe(rm, [], () => true, leserMit(chronikMd)).map((p) => `${p.id ?? '(global)'}: ${p.meldung}`);

describe('Regel 4 — dep-Ziele dürfen in der Chronik liegen', () => {
  it('(a) dep auf eine in der Chronik als done archivierte ID ist grün', () => {
    const rm = roadmap(eintrag('A', 'ready', ['ARCHIV']));
    expect(check(rm, chronik(eintrag('ARCHIV', 'done')))).toEqual([]);
  });

  it('(a2) plan:next behandelt ein Chronik-done-dep als erfüllt (sonst wartet der Schritt ewig)', () => {
    const { einheiten, queue } = parseRoadmap(roadmap(eintrag('A', 'ready', ['ARCHIV'])));
    const ohne = resolve(einheiten, queue);
    expect(ohne.wartetDep).toEqual([{ id: 'A', offen: ['ARCHIV'] }]);
    const mit = resolve(einheiten, queue, chronikErledigte(chronik(eintrag('ARCHIV', 'done'))).done);
    expect(mit.readyNow).toEqual(['A']);
    expect(mit.wartetDep).toEqual([]);
  });

  it('(a3) auch ein done-Schritt darf auf ein Chronik-done-Ziel zeigen (Regel 4c)', () => {
    const rm = roadmap(eintrag('A', 'done', ['ARCHIV']));
    expect(check(rm, chronik(eintrag('ARCHIV', 'done')))).toEqual([]);
  });

  it('(b) dep auf eine ID, die NIRGENDS steht, bleibt rot', () => {
    const rm = roadmap(eintrag('A', 'ready', ['PHANTOM']));
    expect(check(rm, chronik(eintrag('ARCHIV', 'done')))).toEqual(['A: dep "PHANTOM" existiert nicht']);
  });

  it('(b2) fehlende Chronik-Datei ändert nichts — der tote Zeiger bleibt rot', () => {
    const rm = roadmap(eintrag('A', 'ready', ['ARCHIV']));
    expect(check(rm, null)).toEqual(['A: dep "ARCHIV" existiert nicht']);
  });

  it('(c) dep auf eine Chronik-ID mit status != done ist rot und nennt den Status', () => {
    const rm = roadmap(eintrag('A', 'ready', ['HALB']));
    const funde = check(rm, chronik(eintrag('HALB', 'wip')));
    expect(funde).toHaveLength(1);
    expect(funde[0]).toContain('HALB');
    expect(funde[0]).toContain('wip');
    expect(funde[0]).toContain(CHRONIK_DATEI);
  });

  it('(d) ROADMAP gewinnt: dieselbe ID in beiden Dateien ist KEIN Fehler (Bestandsform)', () => {
    // Bestandsfall W3-TARIF-STAND / W2·24-DESIGN-IDENTITAET: die Chronik hält den
    // damaligen Wortlaut samt damaligem Status fest; massgeblich ist die ROADMAP.
    const rm = roadmap(eintrag('A', 'ready', ['DOPPEL']), eintrag('DOPPEL', 'done'));
    expect(check(rm, chronik(eintrag('DOPPEL', 'wip')))).toEqual([]);
  });

  it('(d2) ROADMAP gewinnt auch gegen die Auflösung: ein dort OFFENES Ziel bleibt offen', () => {
    const rm = roadmap(eintrag('A', 'done', ['DOPPEL']), eintrag('DOPPEL', 'ready'));
    expect(check(rm, chronik(eintrag('DOPPEL', 'done')))).toEqual([
      'A: status done, aber dep "DOPPEL" ist ready',
    ]);
  });

  it('(e) mehrdeutiges Chronik-Archiv (dieselbe ID, verschiedener Status) ist rot', () => {
    const rm = roadmap(eintrag('A', 'ready', ['ZWEI']));
    const funde = check(rm, chronik(eintrag('ZWEI', 'done'), eintrag('ZWEI', 'ready')));
    expect(funde).toHaveLength(1);
    expect(funde[0]).toContain('mehrdeutig');
    expect(funde[0]).toContain('ZWEI');
  });

  it('(e2) dieselbe ID mehrfach mit GLEICHEM Status ist eindeutig — grün', () => {
    // Bestandsform: `W2·23-STARTSEITE-V4` steht 2× als done in der Chronik.
    const rm = roadmap(eintrag('A', 'ready', ['ZWEI']));
    expect(check(rm, chronik(eintrag('ZWEI', 'done'), eintrag('ZWEI', 'done')))).toEqual([]);
  });
});

describe('plan:set auf eine archivierte ID', () => {
  it('(f) nennt die Chronik statt «nicht gefunden»', () => {
    const rm = roadmap(eintrag('A', 'ready'));
    expect(() => setField(rm, 'ARCHIV', 'status', 'ready', leserMit(chronik(eintrag('ARCHIV', 'done'))))).toThrow(
      /Chronik/,
    );
  });

  it('(f2) eine ID, die auch die Chronik nicht kennt, bleibt «nicht gefunden»', () => {
    const rm = roadmap(eintrag('A', 'ready'));
    expect(() => setField(rm, 'PHANTOM', 'status', 'ready', leserMit(chronik(eintrag('ARCHIV', 'done'))))).toThrow(
      /nicht gefunden/,
    );
  });
});

describe('chronikErledigte — die eine Leseregel (§5)', () => {
  it('liest done-Anker, Status und Mehrdeutigkeit', () => {
    const w = chronikErledigte(
      chronik(eintrag('X', 'done'), eintrag('Y', 'ready'), eintrag('Z', 'done'), eintrag('Z', 'wip')),
    );
    expect([...w.done].sort()).toEqual(['X']);
    expect(w.status.get('Y')).toBe('ready');
    expect([...w.mehrdeutig]).toEqual(['Z']);
  });

  it('leerer/fehlender Chronik-Text ergibt leeres Wissen statt Absturz', () => {
    expect(chronikErledigte('').done.size).toBe(0);
    expect(chronikErledigte(null).done.size).toBe(0);
  });
});
