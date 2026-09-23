// src/tests/plan-check.test.ts — das Tor `check:plan` samt Regel 11. Beide Quellen prüfen `pruefe` aus scripts/plan/check; Regel 11 (Spec-Bindung) ist eine seiner Regeln.
// Zusammengelegt 31.8.2026 (QS-EFFIZIENZ, Ent-Regulierung Runde 2 Batch B; Beleg:
// bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md §3 Kandidat 1). Die
// Fälle stehen WÖRTLICH unter dem Banner ihrer Herkunftsdatei; gestrichen wurde
// nur ein wörtliches Rumpf-Duplikat (ROADMAP-CHRONIK.md, 31.8.2026).
import { fahrplanScan, pruefe } from '../../scripts/plan/check';

// ─── aus src/tests/plan-check.test.ts ──────────────────────────────────────────

const OK = `## Die geordnete Abarbeitung
<!-- @blockers
wbqdyap3x: I2 offen
-->
- [x] **1 · A**
  <!-- @meta id: W1·1 · status: done · blocker: null · dep: [] · feld: betrieb -->
- [ ] **4 · D**
  <!-- @meta id: W1·4 · status: blocked · blocker: wbqdyap3x · dep: [] · feld: betrieb -->

Siehe FAHRPLAN-PLAN-STEUERUNG.md.
`;
const existiert = () => true;

describe('pruefe', () => {
  it('sauberer Plan → keine Probleme', () => {
    expect(pruefe(OK, ['FAHRPLAN-PLAN-STEUERUNG.md'], existiert)).toEqual([]);
  });

  it('done mit [ ]-Checkbox → Problem', () => {
    const bad = OK.replace('- [x] **1 · A**', '- [ ] **1 · A**');
    expect(pruefe(bad, ['FAHRPLAN-PLAN-STEUERUNG.md'], existiert).some((p) => p.id === 'W1·1')).toBe(true);
  });

  it('blocker nicht im Register → Problem', () => {
    const bad = OK.replace('blocker: wbqdyap3x', 'blocker: xxxxx');
    expect(pruefe(bad, ['FAHRPLAN-PLAN-STEUERUNG.md'], existiert).some((p) => p.id === 'W1·4')).toBe(true);
  });

  it('nicht verlinkte FAHRPLAN-Datei → Problem', () => {
    expect(pruefe(OK, ['FAHRPLAN-PLAN-STEUERUNG.md', 'FAHRPLAN-GEISTER.md'], existiert).some((p) => /GEISTER/.test(p.meldung))).toBe(true);
  });

  // Regel (4c), Befund 20.7.2026: W2·6a-MAT stand auf done und hing an
  // W2·7-VZUI (ready) — die Regel fehlte, also fiel der falsche Plan-Zustand
  // monatelang nicht auf. Beide Richtungen festhalten.
  it('done mit offenem dep → Problem', () => {
    const bad = OK.replace(
      'id: W1·1 · status: done · blocker: null · dep: []',
      'id: W1·1 · status: done · blocker: null · dep: [W1·4]');
    const p = pruefe(bad, ['FAHRPLAN-PLAN-STEUERUNG.md'], existiert);
    expect(p.some((x) => x.id === 'W1·1' && /dep "W1·4" ist blocked/.test(x.meldung))).toBe(true);
  });

  it('done mit done-dep → kein Problem', () => {
    const gut = OK.replace(
      'id: W1·4 · status: blocked · blocker: wbqdyap3x · dep: []',
      'id: W1·4 · status: done · blocker: null · dep: [W1·1]')
      .replace('- [ ] **4 · D**', '- [x] **4 · D**');
    expect(pruefe(gut, ['FAHRPLAN-PLAN-STEUERUNG.md'], existiert)).toEqual([]);
  });

  // Regel 14 (Steuerungs-Diät 29.8.2026) — tritt an die Stelle der alten Regel 6
  // (Existenz jedes `kollision:`-Pfads). Beide Richtungen, weil ein falsch
  // geschriebener Wert schlimmer ist als ein fehlender: er sähe wie eine
  // Zuordnung aus und bildete still eine achte, private Fläche.
  it('@meta ohne feld: → Problem', () => {
    const bad = OK.replace(' · feld: betrieb -->\n- [ ] **4 · D**', ' -->\n- [ ] **4 · D**');
    expect(pruefe(bad, ['FAHRPLAN-PLAN-STEUERUNG.md'], existiert).some((p) => p.id === 'W1·1' && /ohne feld/.test(p.meldung))).toBe(true);
  });

  it('feld: ausserhalb des Vokabulars → Problem, mit der Wertliste in der Meldung', () => {
    const bad = OK.replace('feld: betrieb -->\n- [ ] **4 · D**', 'feld: lesser -->\n- [ ] **4 · D**');
    const p = pruefe(bad, ['FAHRPLAN-PLAN-STEUERUNG.md'], existiert);
    expect(p.some((x) => x.id === 'W1·1' && /kein Baufeld/.test(x.meldung) && /rechtsprechung/.test(x.meldung))).toBe(true);
  });

  it('alle acht Baufelder sind zulässig (Gegenprobe)', () => {
    for (const feld of ['leser', 'korpus', 'rechtsprechung', 'suche', 'design', 'werkzeuge', 'betrieb', 'rechtslogik']) {
      const gut = OK.replace('feld: betrieb -->\n- [ ] **4 · D**', `feld: ${feld} -->\n- [ ] **4 · D**`);
      expect(pruefe(gut, ['FAHRPLAN-PLAN-STEUERUNG.md'], existiert)).toEqual([]);
    }
  });
});

describe('pruefe — Lücken-Abdeckung (Task-5-Review)', () => {
  const REG = ['<!-- @blockers', 'b1: grund', '-->'].join('\n');
  const plan = (units: string) =>
    `## Die geordnete Abarbeitung\n${REG}\n${units}\n\nSiehe FAHRPLAN-PLAN-STEUERUNG.md.\n`;
  const unit = (cb: string, meta: string) => `- ${cb} **x**\n  <!-- @meta ${meta} -->`;
  const ok = (md: string) => pruefe(md, ['FAHRPLAN-PLAN-STEUERUNG.md'], () => true);

  // Die Inventar-Regeln («Inventar-ID ohne @meta», «verwaistes @meta») sind mit
  // der Steuerungs-Diät vom 29.8.2026 gestrichen (Doppelbuchführung; Begründung
  // im Kommentar an Regel 1 in check.ts). Was von Regel 1 bleibt, ist die
  // Dubletten-Prüfung darunter.
  it('doppelte id → Problem', () => {
    const u = 'id: A · status: ready · blocker: null · dep: [] · feld: betrieb';
    const md = plan(`${unit('[ ]', u)}\n${unit('[ ]', u)}`);
    expect(ok(md).some((p) => /mehrfach/.test(p.meldung))).toBe(true);
  });
  it('Zyklus A→B→A → Problem', () => {
    const md = plan(
      `${unit('[ ]', 'id: A · status: ready · blocker: null · dep: [B] · feld: betrieb')}\n` +
      `${unit('[ ]', 'id: B · status: ready · blocker: null · dep: [A] · feld: betrieb')}`,
    );
    expect(ok(md).some((p) => /Zyklus/.test(p.meldung))).toBe(true);
  });
  it('dep auf nicht existierende id → Problem', () => {
    const md = plan(unit('[ ]', 'id: A · status: ready · blocker: null · dep: [ZZ] · feld: betrieb'));
    expect(ok(md).some((p) => /ZZ/.test(p.meldung))).toBe(true);
  });
  it('Checkbox [~] mit status done → Problem', () => {
    const md = plan(unit('[~]', 'id: A · status: done · blocker: null · dep: [] · feld: betrieb'));
    expect(ok(md).some((p) => p.id === 'A')).toBe(true);
  });
  it('Checkbox [D] (geparkt) mit status parked → kein Coupling-Problem', () => {
    const md = plan(unit('[D]', 'id: A · status: parked · blocker: b1 · dep: [] · feld: betrieb'));
    expect(ok(md)).toEqual([]);
  });
  it('Checkbox [D] (geparkt) mit status done → Problem', () => {
    const md = plan(unit('[D]', 'id: A · status: done · blocker: null · dep: [] · feld: betrieb'));
    expect(ok(md).some((p) => p.id === 'A')).toBe(true);
  });
  it('status ready mit blocker → Problem', () => {
    const md = plan(unit('[ ]', 'id: A · status: ready · blocker: b1 · dep: [] · feld: betrieb'));
    expect(ok(md).some((p) => p.id === 'A')).toBe(true);
  });
  it('status blocked ohne blocker → Problem', () => {
    const md = plan(unit('[ ]', 'id: A · status: blocked · blocker: null · dep: [] · feld: betrieb'));
    expect(ok(md).some((p) => p.id === 'A')).toBe(true);
  });
  // Die 26×-Slot-Regeln 5/5b/5c (höchstens ein 26× auf wip · höchstens ein
  // `slot: inhaber` · der Inhaber muss den Slot zurückgeben können) sind mit der
  // Steuerungs-Diät vom 29.8.2026 gestrichen, zusammen mit den Feldern `26x` und
  // `slot`. Die Reihenfolge, die sie erzwangen, steht jetzt als `dep` am Schritt
  // (Regeln 4/4b/4c prüfen sie), gleichzeitige Arbeit auf derselben Fläche meldet
  // die Feld-Warnung von plan:next (src/tests/plan-next.test.ts).
});

// Regel 8 (@queue-Integrität, Einbau 24.7.2026): die Queue ist die EINE
// Prioritäts-Quelle; tote/erledigte IDs oder Prosa-Widerspruch steuern falsch.
describe('pruefe — Regel 8 @queue-Integrität', () => {
  const mitQueue = (queue: string, extra = '') =>
    `## Die geordnete Abarbeitung\n<!-- @queue: ${queue} -->\n${extra}` + OK.replace('## Die geordnete Abarbeitung\n', '');

  it('konsistente Queue → kein Problem', () => {
    // W1·4 ist im OK-Fixture `blocked` und damit seit der 8.3-Erweiterung (Fund 15
    // der QS-TOK-Endprüfung, 31.7.2026) selbst ein Stale-Fall. Die Gegenprobe
    // «konsistente Queue» braucht darum einen BAUBAREN Schritt; die Aussage des
    // Tests bleibt unverändert — nur das Fixture hatte den Zustand mitkodiert,
    // den die neue Regel gerade als Fehler ausweist.
    const baubar = mitQueue('W1·4').replace('status: blocked · blocker: wbqdyap3x', 'status: ready · blocker: null');
    expect(pruefe(baubar, ['FAHRPLAN-PLAN-STEUERUNG.md'], () => true)).toEqual([]);
  });
  it('8.1: Queue-ID ohne @meta → Problem', () => {
    const p = pruefe(mitQueue('GEIST'), ['FAHRPLAN-PLAN-STEUERUNG.md'], () => true);
    expect(p.some((x) => x.id === 'GEIST' && /kein @meta/.test(x.meldung))).toBe(true);
  });
  it('8.2: Dublette in der Queue → Problem', () => {
    const p = pruefe(mitQueue('W1·4, W1·4'), ['FAHRPLAN-PLAN-STEUERUNG.md'], () => true);
    expect(p.some((x) => x.id === 'W1·4' && /mehrfach/.test(x.meldung))).toBe(true);
  });
  it('8.3: done-ID in der Queue → Problem (Stale-Guard)', () => {
    const p = pruefe(mitQueue('W1·1'), ['FAHRPLAN-PLAN-STEUERUNG.md'], () => true);
    expect(p.some((x) => x.id === 'W1·1' && /veraltete Steuerung/.test(x.meldung))).toBe(true);
  });
  // 8.4 prüft gegen die TATSÄCHLICHE plan:next-Ausgabe (resolve().readyNow[0]),
  // nicht bloss gegen queue[0] — Härtung nach adversarialem Verify-Befund 24.7.2026.
  const READY = `- [ ] **5 · E**\n  <!-- @meta id: W1·5 · status: ready · blocker: null · dep: [] · feld: betrieb -->\n`;

  it('8.4: Prosa-«OBERSTER» widerspricht der plan:next-Ausgabe → Problem', () => {
    const md = mitQueue('W1·5', '> **⬆ OBERSTER OFFENER SCHRITT:** `W1·1` zuerst.\n' + READY);
    const p = pruefe(md, ['FAHRPLAN-PLAN-STEUERUNG.md'], () => true);
    expect(p.some((x) => x.id === 'W1·1' && /Prosa behauptet oberster/.test(x.meldung))).toBe(true);
  });
  it('8.4: Prosa-«OBERSTER» ohne @queue → Problem', () => {
    const md = OK + '\n> **⬆ OBERSTER OFFENER SCHRITT:** `W1·4` zuerst.\n';
    const p = pruefe(md, ['FAHRPLAN-PLAN-STEUERUNG.md'], () => true);
    expect(p.some((x) => x.id === null && /keine @queue/.test(x.meldung))).toBe(true);
  });
  it('8.4: Prosa-«OBERSTER» == plan:next-Ausgabe → kein Problem', () => {
    const md = mitQueue('W1·5', '> **⬆ OBERSTER OFFENER SCHRITT:** `W1·5` zuerst.\n' + READY);
    expect(pruefe(md, ['FAHRPLAN-PLAN-STEUERUNG.md'], () => true)).toEqual([]);
  });
  it('8.4: Queue-Kopf nicht baubar (blocked) → Prosa==queue[0] genügt NICHT (Drift-Szenario)', () => {
    // W1·4 ist blocked und Queue-Kopf; plan:next liefert W1·5. Die alte queue[0]-Prüfung
    // wäre hier grün geblieben — genau die Drift, die der Guard schliessen soll.
    const md = mitQueue('W1·4, W1·5', '> **⬆ OBERSTER OFFENER SCHRITT:** `W1·4` zuerst.\n' + READY);
    const p = pruefe(md, ['FAHRPLAN-PLAN-STEUERUNG.md'], () => true);
    expect(p.some((x) => x.id === 'W1·4' && /plan:next liefert "W1·5"/.test(x.meldung))).toBe(true);
  });
  it('8.4: Backtick-Fragment VOR dem Marker bindet nicht (Marker-verankerte ID)', () => {
    const md = mitQueue('W1·5', '> Datei `foo.ts` gefixt. **⬆ OBERSTER OFFENER SCHRITT:** `W1·5` zuerst.\n' + READY);
    expect(pruefe(md, ['FAHRPLAN-PLAN-STEUERUNG.md'], () => true)).toEqual([]);
  });
});

// AP-8 (QS-TOK, 31.7.2026): Die aktiven Fahrpläne sind aus dem Repo-Wurzel nach
// `fahrplaene/` gezogen. Der Link-Check (Regel 7) scannt seither jenen Ordner statt
// `.`. Zwei Dinge müssen dabei bewiesen sein — sonst ist das Tor nach dem Umzug
// still grün und prüft nichts mehr (§6.7: «ein Tor, das nicht scheitern kann, ist
// gefährlicher als keines»):
//   1. der Scan findet die Dateien im NEUEN Ordner (und stürzt nicht ab, wenn er fehlt);
//   2. eine gefundene, aber unverlinkte Datei erzeugt weiterhin ein Problem.
// Regel 7 vergleicht bewusst gegen den BASENAMEN (`md.includes(f)`): ROADMAP-Verweise
// tragen den Dateinamen — als Link `](fahrplaene/FAHRPLAN-X.md)`, als `fahrplan:`-Feld
// oder in Prosa. Der Basename trifft alle drei Formen, ein Pfad-Vergleich nur die
// ersten beiden.
describe('fahrplanScan — Ordner-Scan des Link-Tors (AP-8)', () => {
  it('liest die FAHRPLAN-*.md des angegebenen Ordners (nicht der Wurzel)', () => {
    const leser = (d: string) =>
      d === 'fahrplaene' ? ['FAHRPLAN-A.md', 'FAHRPLAN-B.md', 'README.md', 'notiz.txt'] : ['FAHRPLAN-WURZEL.md'];
    expect(fahrplanScan('fahrplaene', leser, () => true)).toEqual(['FAHRPLAN-A.md', 'FAHRPLAN-B.md']);
  });

  it('fehlender Ordner → leere Liste statt Absturz', () => {
    const leser = () => { throw new Error('ENOENT'); };
    expect(fahrplanScan('fahrplaene', leser, () => false)).toEqual([]);
  });

  it('NEGATIV-TEST: unverlinkte Datei aus dem fahrplaene-Scan → Tor meldet Problem', () => {
    const gescannt = fahrplanScan('fahrplaene', () => ['FAHRPLAN-PLAN-STEUERUNG.md', 'FAHRPLAN-ZZZZ-PROBE.md'], () => true);
    const p = pruefe(OK, gescannt, existiert);
    expect(p.map((x) => x.meldung)).toContain('FAHRPLAN-ZZZZ-PROBE.md ist nicht aus ROADMAP.md verlinkt');
  });

  it('verlinkte Datei aus dem fahrplaene-Scan → kein Problem (Gegenprobe)', () => {
    const gescannt = fahrplanScan('fahrplaene', () => ['FAHRPLAN-PLAN-STEUERUNG.md'], () => true);
    expect(pruefe(OK, gescannt, existiert)).toEqual([]);
  });
});

// Verify-Befund 24.7.2026, umformuliert nach dem Plan-Neuschnitt 29.8.2026: der
// Querschnitt-Filter (und mit ihm der `begleitend`-Eimer) ist entfallen — die
// ROADMAP gliedert nach Baufeldern. Was bleibt, ist die Aussage dahinter: ein
// offener dep darf nie still verschluckt werden, egal in welcher Sektion.
describe('resolve-Kopplung — offene Voraussetzung, unabhängig von der Sektion', () => {
  it('ready mit offener dep landet in wartetDep, nie in readyNow', async () => {
    const { resolve } = await import('../../scripts/plan/next');
    const qs = {
      id: 'QS-X', checkbox: null, sektion: 'Betrieb & Prüfstrasse', pos: 0,
      etikett: { id: 'QS-X', status: 'ready' as const, blocker: null, dep: ['FEHLT'], feld: 'betrieb', fahrplan: null },
    };
    const b = resolve([qs]);
    expect(b.wartetDep).toEqual([{ id: 'QS-X', offen: ['FEHLT'] }]);
    expect(b.readyNow).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Fix-Runde 1 nach der Endprüfung der QS-TOK-Aufräumwelle.
// ---------------------------------------------------------------------------

// Regel 9 (Funde 11/21): Bis AP-8 trug kein `fahrplan:`-Feld ein Verzeichnis-Präfix;
// seither tragen es alle. Damit ist eine neue Fehlerklasse entstanden (falsches oder
// fehlendes Präfix), die das Tor NICHT sehen konnte: Regel 7 prüft nur die
// Gegenrichtung (jede Datei in fahrplaene/ muss als Basename irgendwo im
// ROADMAP-Volltext vorkommen).
// Mutations-Beweis gegen die echte ROADMAP vor dem Fix: `fahrplan:` auf einen
// erfundenen Pfad gesetzt → pruefe() lieferte []. §6.7: erst rot zeigen.
describe('Regel 9 — fahrplan:-Pfad muss existieren', () => {
  const MIT_FAHRPLAN = OK.replace(
    'id: W1·1 · status: done · blocker: null · dep: [] · feld: betrieb',
    'id: W1·1 · status: done · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md',
  );

  it('NEGATIV: fahrplan: zeigt auf eine nicht existierende Datei → Problem', () => {
    const nur = (p: string) => p === 'fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md';
    const bad = MIT_FAHRPLAN.replace('fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md', 'fahrplaene/FAHRPLAN-GIBTSNICHT.md');
    const p = pruefe(bad, ['FAHRPLAN-PLAN-STEUERUNG.md'], nur);
    expect(p.map((x) => x.meldung)).toContain('fahrplan "fahrplaene/FAHRPLAN-GIBTSNICHT.md" existiert nicht');
  });

  it('GEGENPROBE: existierender fahrplan:-Pfad → kein Problem', () => {
    const nur = (p: string) => p === 'fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md';
    expect(pruefe(MIT_FAHRPLAN, ['FAHRPLAN-PLAN-STEUERUNG.md'], nur)).toEqual([]);
  });

  it('ohne fahrplan:-Feld wird nichts geprüft (kein Fehlalarm)', () => {
    expect(pruefe(OK, ['FAHRPLAN-PLAN-STEUERUNG.md'], () => false).filter((p) => /^fahrplan /.test(p.meldung))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Regel 10 (Fund R2-1/R2-10 der Endprüfung Runde 2, 31.7.2026) — KRITISCH.
//
// Regel 2 prüft die Checkbox-Kopplung nur `if (e.checkbox && …)`. Wo parse.ts die
// Checkbox nicht binden kann, ist das Tor deshalb blind: `plan:set <id> status=done`
// schreibt das @meta, die sichtbare Liste bleibt auf «offen», check:plan bleibt
// grün. Das ist ein Tor, das an dieser Stelle nicht scheitern KANN (§6.7).
//
// Regel 10 schliesst den Nullfall von vorn: Steht unter einer Checkbox-Bullet ein
// @meta, bevor die nächste Checkbox-Bullet, eine gleich- oder höherrangige Bullet
// oder eine Überschrift kommt, MUSS dieses @meta genau an diese Checkbox gebunden
// sein. Ist es das nicht, driften Steuerung und sichtbarer Plan still auseinander.
// ---------------------------------------------------------------------------
describe('Regel 10 — Checkbox-Bullet ohne gebundenes @meta', () => {
  const plan10 = (units: string) =>
    `## Die geordnete Abarbeitung\n<!-- @blockers\nb1: grund\n-->\n${units}\n\nSiehe FAHRPLAN-PLAN-STEUERUNG.md.\n`;
  const lauf = (md: string) => pruefe(md, ['FAHRPLAN-PLAN-STEUERUNG.md'], () => true);

  it('NEGATIV: Checkbox-Bullet, dazwischen eine checkbox-lose Unter-Bullet, dann @meta → Problem', () => {
    const md = plan10([
      '- [ ] **B20 · Prüf-Batch**',
      '  - Unter-Bullet ohne Checkbox kappt die Bindung.',
      '  <!-- @meta id: A · status: ready · blocker: null · dep: [] · feld: betrieb -->',
    ].join('\n'));
    expect(lauf(md).some((p) => p.id === 'A' && /nicht an die Checkbox/.test(p.meldung))).toBe(true);
  });

  it('NEGATIV: Checkbox-Bullet, dazwischen ein fremder Kommentar, dann @meta → Problem', () => {
    const md = plan10([
      '- [ ] **B20 · Prüf-Batch**',
      '  <!-- Notiz, die die Rückwärts-Bindung kappt -->',
      '  <!-- @meta id: A · status: ready · blocker: null · dep: [] · feld: betrieb -->',
    ].join('\n'));
    expect(lauf(md).some((p) => p.id === 'A' && /nicht an die Checkbox/.test(p.meldung))).toBe(true);
  });

  // Ehrliche Grenze der Regel (§8): Eine doppelte Leerzeile trennt Blöcke in
  // BEIDEN Richtungen — die Rückwärts-Bindung bricht ab, und der Vorwärts-Blick
  // dieser Regel ebenso. Der Fall ist damit kein Befund, sondern ausserhalb des
  // Geltungsbereichs; hier festgehalten, damit niemand mehr Deckung annimmt, als
  // die Regel gibt.
  it('GRENZE: doppelte Leerzeile trennt den Block — bewusst kein Problem', () => {
    const md = plan10([
      '- [ ] **B20 · Prüf-Batch**',
      '',
      '',
      '  <!-- @meta id: A · status: ready · blocker: null · dep: [] · feld: betrieb -->',
    ].join('\n'));
    expect(lauf(md)).toEqual([]);
  });

  it('GEGENPROBE: B20-Layout (Bullet, Prosa, @meta) → kein Problem', () => {
    const md = plan10([
      '- [ ] **B20 · Prüf-Batch**',
      '  Prosa-Zeile eins.',
      '  Prosa-Zeile zwei.',
      '  <!-- @meta id: A · status: ready · blocker: null · dep: [] · feld: betrieb -->',
    ].join('\n'));
    expect(lauf(md)).toEqual([]);
  });

  // Fund R3-1/R3-9 (Endprüfung Runde 3, 31.7.2026, KRITISCH). Die erste Fassung
  // dieses Tests stand hier als «GEGENPROBE: … → kein Problem (Unter-Bullet stoppt
  // die Sicht)», also als GEWOLLTES Verhalten. Das war unehrlich (§8): Regel 10
  // brach an JEDER Checkbox-Bullet ab, auch an einer tiefer eingezogenen, und die
  // Rückwärts-Bindung brach am @meta des Unterschritts ab. Eine Dach-Bullet, deren
  // eigenes @meta NACH dem @meta ihres Unterschritts steht, fiel damit durch beide
  // Netze — dieselbe stille Drift wie R2-1, nur über eine Unter-Bullet statt über
  // eine Prosa-Zeile, und im Bestand LIVE an `W2·7-BEZUG`. Belegt vor dem Fix:
  // `parseRoadmap` lieferte dort `checkbox = null`, `setField(md,'W2·7-BEZUG',
  // 'status','wip')` schrieb `status: wip` und liess `- [x]` stehen, und
  // `pruefe()` auf dem mutierten Text meldete NULL Probleme.
  //
  // Fixture = das echte ALTE ROADMAP-Layout (Z.549–556 vor der Heilung).
  it('NEGATIV: Dach-@meta hinter dem @meta seines Unterschritts → Problem (echtes W2·7-BEZUG-Layout)', () => {
    const md = plan10([
      '- [x] **7-BEZUG · Bezüge am Artikel — Facetten-Fundament alle Instanzen** — ✅ **done 28.7.2026**,',
      '  B1–B6 + B7 komplett (PRs #401–#406).',
      '  - [x] **B7 · Voll-Auflistung + Eidg.-Facette** — ✅ **done 29.7.2026**',
      '    <!-- @meta id: B · status: done · blocker: null · dep: [] · feld: betrieb -->',
      '  Detail: Chronik.',
      '  <!-- @meta id: A · status: done · blocker: null · dep: [] · feld: betrieb -->',
    ].join('\n'));
    expect(lauf(md).some((p) => p.id === 'A' && /nicht an die Checkbox/.test(p.meldung))).toBe(true);
  });

  // Gegenprobe zum vorigen Fall: das Dach-@meta unmittelbar unter seiner Bullet —
  // die Normalform, die FAHRPLAN-PLAN-STEUERUNG.md von Autoren verlangt und die
  // ROADMAP.md für W2·7-BEZUG in derselben Runde hergestellt hat. Der Unterschritt
  // behält sein eigenes @meta; beide binden, kein Problem.
  it('GEGENPROBE: Dach-@meta unmittelbar unter der Dach-Bullet → kein Problem', () => {
    const md = plan10([
      '- [x] **7-BEZUG · Bezüge am Artikel — Facetten-Fundament alle Instanzen** — ✅ **done 28.7.2026**,',
      '  <!-- @meta id: A · status: done · blocker: null · dep: [] · feld: betrieb -->',
      '  B1–B6 + B7 komplett (PRs #401–#406).',
      '  - [x] **B7 · Voll-Auflistung + Eidg.-Facette** — ✅ **done 29.7.2026**',
      '    <!-- @meta id: B · status: done · blocker: null · dep: [] · feld: betrieb -->',
      '  Detail: Chronik.',
    ].join('\n'));
    expect(lauf(md)).toEqual([]);
  });

  // Fund R3-7: `bindeCheckbox` prüfte die Kommentar-Grenze VOR dem Bullet-Test.
  // Eine Bullet, die `-->` oder `<!--` bloss als Fliesstext im eigenen Titel führt
  // (ein Pfeil im Schritt-Namen genügt), galt damit als Kommentar-Grenze: die
  // Bindung brach ab, und Regel 10 wurde falsch-positiv rot — mit einer Meldung,
  // die auf die falsche Ursache zeigt. Eine Bullet-Zeile ist nie eine
  // Kommentar-Grenze; der Bullet-Test gehört darum zuerst.
  it('GEGENPROBE: Bullet mit «-->» im eigenen Titel bindet ihre Checkbox → kein Problem', () => {
    const md = plan10([
      '- [ ] **A · Migration (Pfeil: alt --> neu)**',
      '  <!-- @meta id: A · status: ready · blocker: null · dep: [] · feld: betrieb -->',
    ].join('\n'));
    expect(lauf(md)).toEqual([]);
  });

  it('GEGENPROBE: checkbox-lose Querschnitt-Bullet unter fremder Checkbox-Liste → kein Problem', () => {
    const md = plan10([
      '  - [ ] **fremde Checkbox der Nachbarliste**',
      '- **Datenhaltung / Single-Source-DB** *(QS-DATA)*.',
      '  <!-- @meta id: A · status: blocked · blocker: b1 · dep: [] · feld: betrieb -->',
    ].join('\n'));
    expect(lauf(md)).toEqual([]);
  });
});

// Regel 8.3 (Fund 15): Der Stale-Guard nannte nur `done` und `parked`. Ein
// `blocked`-Schritt am Queue-Kopf blieb still grün — auch 8.4 greift nicht, weil ein
// blockierter Kopf gar nicht erst in readyNow landet und readyNow[0] unverändert
// bleibt. Dieselbe Fehlerklasse wie der Ur-Befund vom 24.7.2026, nur über `blocked`.
describe('Regel 8.3 — Stale-Guard deckt auch blocked', () => {
  const MIT_QUEUE = `## Die geordnete Abarbeitung\n<!-- @queue: W1·4 -->\n` + OK.replace('## Die geordnete Abarbeitung\n', '');

  it('NEGATIV: blockierter Schritt am Queue-Kopf → Problem', () => {
    const p = pruefe(MIT_QUEUE, ['FAHRPLAN-PLAN-STEUERUNG.md'], existiert);
    expect(p.map((x) => x.meldung)).toContain('@queue-ID "W1·4" ist blocked — veraltete Steuerung, aus @queue entfernen');
  });

  it('GEGENPROBE: ready-Schritt in der Queue → kein Problem', () => {
    const gut = MIT_QUEUE.replace('status: blocked · blocker: wbqdyap3x', 'status: ready · blocker: null');
    expect(pruefe(gut, ['FAHRPLAN-PLAN-STEUERUNG.md'], existiert)).toEqual([]);
  });
});

// ── bindeCheckbox × Dach-Checklisten (Wurzel-Fix 8.8.2026, QS-AUDIT-VERWEISE) ──
// plan:set toggelte bei Dach-Schritten real die LETZTE Checklisten-Zeile statt
// der Schritt-Checkbox (die dem @meta nächste Checkbox ist bei Dächern eine
// eingerückte Position). Eingerückte Bullets werden jetzt übersprungen.
describe('bindeCheckbox — Dach-Schritt mit eingerückter Checkliste', () => {
  it('bindet die Schritt-Checkbox (Spalte 0), nie eine Checklisten-Position', async () => {
    const { bindeCheckbox } = await import('../../scripts/plan/parse');
    const zeilen = [
      '- [ ] **`W9·9-DACH` · Titel** — Prosa.',
      '  - [ ] Position eins',
      '  - [x] Position zwei',
      '  <!-- @meta id: W9·9-DACH · status: ready · blocker: null · dep: [] -->',
    ];
    const b = bindeCheckbox(zeilen, 3);
    expect(b.zeile).toBe(0);
    expect(b.checkbox).toBe('[ ]');
  });

  it('ohne Checkliste unverändert: nächste Spalte-0-Checkbox wird gebunden', async () => {
    const { bindeCheckbox } = await import('../../scripts/plan/parse');
    const zeilen = [
      '- [x] **`W9·8` · Titel** — Prosa.',
      '  <!-- @meta id: W9·8 · status: done · blocker: null · dep: [] -->',
    ];
    const b = bindeCheckbox(zeilen, 1);
    expect(b.zeile).toBe(0);
    expect(b.checkbox).toBe('[x]');
  });
});
