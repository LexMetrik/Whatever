// src/tests/plan-schreiben.test.ts — die SCHREIBENDEN Plan-Werkzeuge: scripts/plan/set.
// Zusammengelegt 31.8.2026 (QS-EFFIZIENZ, Ent-Regulierung Runde 2 Batch B; Beleg:
// bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md §3 Kandidat 1). Die
// Fälle stehen WÖRTLICH unter dem Banner ihrer Herkunftsdatei; gestrichen wurde
// nur ein wörtliches Rumpf-Duplikat (ROADMAP-CHRONIK.md, 31.8.2026).
// Der `scripts/plan/buchung`-Strang (plan-buchung.yml-Merge-Trailer) samt
// seinem Testblock ist am 20.9.2026 abgebaut (QS-CI-MINUTEN, Rückbau
// Plan-Buchung, gemessen 0 Buchungs-Commits seit der Merge-Queue 19.9.2026).
import { prosaMarkerDriftHinweis, setField } from '../../scripts/plan/set';

// ─── aus src/tests/plan-set.test.ts ────────────────────────────────────────────
// src/tests/plan-set.test.ts

const MD = `- [ ] **6 · Konsultieren**
  <!-- @meta id: W2·6 · status: ready · blocker: null · dep: [] · feld: betrieb -->
  Prosa.
`;

describe('setField', () => {
  it('setzt status=done und toggelt Checkbox auf [x]', () => {
    const out = setField(MD, 'W2·6', 'status', 'done');
    expect(out).toContain('status: done');
    expect(out).toContain('- [x] **6 · Konsultieren**');
  });

  it('setzt status=wip und toggelt Checkbox auf [~]', () => {
    const out = setField(MD, 'W2·6', 'status', 'wip');
    expect(out).toContain('status: wip');
    expect(out).toContain('- [~] **6 · Konsultieren**');
  });

  it('ändert ein Nicht-Status-Feld ohne Checkbox-Toggle', () => {
    const out = setField(MD, 'W2·6', 'blocker', 'wbqdyap3x');
    expect(out).toContain('blocker: wbqdyap3x');
    expect(out).toContain('- [ ] **6 · Konsultieren**');
  });

  it('wirft, wenn id nicht existiert', () => {
    expect(() => setField(MD, 'W9·9', 'status', 'done')).toThrow();
  });

  it('ändert ein Feld mit Mittelpunkt-Werten (dep mit W2·n-IDs)', () => {
    const md = [
      '- [ ] **6 · X**',
      '  <!-- @meta id: W2·6 · status: ready · blocker: null · dep: [W2·5] · feld: betrieb -->',
      '',
    ].join('\n');
    const out = setField(md, 'W2·6', 'dep', '[W2·5, W2·7]');
    expect(out).toContain('dep: [W2·5, W2·7]');
  });

  it('Wert mit $ wird literal eingesetzt (keine Backreference)', () => {
    const md = ['- [ ] **x**', '  <!-- @meta id: A · status: ready · blocker: null · dep: [] · feld: betrieb -->'].join('\n');
    const out = setField(md, 'A', 'dep', '[X$1Y]');
    expect(out).toContain('dep: [X$1Y]');
  });

  it('erhält den Blockquote-Präfix (> ) der @meta-Zeile', () => {
    const md = [
      '> **⬆ Prosa**',
      '> <!-- @meta id: QS-TOK · status: ready · blocker: null · dep: [] · feld: betrieb -->',
    ].join('\n');
    const out = setField(md, 'QS-TOK', 'status', 'wip');
    const metaZeile = out.split('\n').find((z) => z.includes('@meta'))!;
    expect(metaZeile.startsWith('> ')).toBe(true);
    expect(metaZeile).toContain('status: wip');
  });
});

// Fund 27 der QS-TOK-Endprüfung (31.7.2026): Der Checkbox-Nachzug prüfte
// `/^\s*-\s*\[[ x~]\]/` — `[d]`/`[D]` (Legenden-Status «geparkt/zurückgestellt»)
// fehlte in der Zeichenklasse. Folge: `plan:set <geparkter Schritt> status=ready`
// setzte das @meta, liess die Checkbox aber auf `[d]` stehen; check:plan (Glied von
// `npm run gate`) wurde dadurch beim Entparken rot — mit ZWEI Meldungen:
// «Checkbox [d] passt nicht zu status ready» und «status ready aber blocker gesetzt».
// Beide Meldungen müssen verschwinden, sonst ist nur die halbe Kette geheilt.
//
// Umfang richtiggestellt 31.7.2026 (Fund R2-10/R2-13 der Endprüfung Runde 2): Die
// frühere Fassung dieses Kommentars nannte «alle drei geparkten Schritte (W1·4,
// W2·5g-ZEIT, W2·5j-TABELLEN) sowie ROADMAP:494 `[D]`». Nachgezählt trägt die
// ROADMAP genau ZWEI `[d]/[D]`-Marken: die Bullet von `W2·5j-TABELLEN` und die
// Bullet `[D] **Quellen-Steinbruch OpenCaseLaw**`, die gar kein @meta trägt und
// für `plan:set` darum unerreichbar ist. W1·4 und W2·5g-ZEIT tragen `- [ ]`, waren
// also nie betroffen. Die Zeilenangabe «ROADMAP:494» war zudem schon beim Schreiben
// falsch (der Bullet stand auf 496) — Anker deshalb auf die stabile Form gehoben.
describe('setField — done räumt die @queue mit (§17-Wurzel-Fix 16.8.2026, PR #530)', () => {
  const MDQ = `<!-- @queue: W2·10, W2·6, W2·13 -->
- [~] **6 · Konsultieren**
  <!-- @meta id: W2·6 · status: wip · blocker: null · dep: [] · feld: betrieb -->
`;
  it('status=done entfernt genau die eigene ID aus der @queue', () => {
    const out = setField(MDQ, 'W2·6', 'status', 'done');
    expect(out).toContain('<!-- @queue: W2·10, W2·13 -->');
    expect(out).toContain('status: done');
  });
  it('status=wip lässt die @queue unangetastet', () => {
    const out = setField(MDQ.replace('status: wip', 'status: ready'), 'W2·6', 'status', 'wip');
    expect(out).toContain('<!-- @queue: W2·10, W2·6, W2·13 -->');
  });
  it('done ohne eigenen Queue-Eintrag lässt die @queue unangetastet', () => {
    const out = setField(MDQ.replace('W2·10, W2·6, W2·13', 'W2·10, W2·13'), 'W2·6', 'status', 'done');
    expect(out).toContain('<!-- @queue: W2·10, W2·13 -->');
  });
});

describe('setField — Entparken (Fund 27)', () => {
  const geparkt = (cb: string) => [
    `- ${cb} **5j-TABELLEN · X**`,
    '  <!-- @meta id: W2·5j · status: parked · blocker: david-spaeter-tabellen · dep: [] · feld: betrieb -->',
  ].join('\n');

  it('[d] → status=ready zieht die Checkbox auf [ ] nach', () => {
    const out = setField(geparkt('[d]'), 'W2·5j', 'status', 'ready');
    expect(out.split('\n')[0]).toBe('- [ ] **5j-TABELLEN · X**');
    expect(out).toContain('status: ready');
  });

  it('[D] (gross) → status=wip zieht die Checkbox auf [~] nach', () => {
    const out = setField(geparkt('[D]'), 'W2·5j', 'status', 'wip');
    expect(out.split('\n')[0]).toBe('- [~] **5j-TABELLEN · X**');
  });

  it('[d] → status=done zieht die Checkbox auf [x] nach', () => {
    const out = setField(geparkt('[d]'), 'W2·5j', 'status', 'done');
    expect(out.split('\n')[0]).toBe('- [x] **5j-TABELLEN · X**');
  });

  it('status=ready räumt den blocker mit ab (sonst bleibt check:plan rot)', () => {
    const out = setField(geparkt('[d]'), 'W2·5j', 'status', 'ready');
    expect(out).toContain('blocker: null');
    expect(out).not.toContain('david-spaeter-tabellen');
  });

  it('status=blocked lässt den blocker unangetastet', () => {
    const out = setField(geparkt('[d]'), 'W2·5j', 'status', 'blocked');
    expect(out).toContain('blocker: david-spaeter-tabellen');
  });

  // Fund R2-9/R2-15 (Runde 2): Der Fund-27-Fix nahm `d`/`D` in die Zeichenklasse
  // auf, ergänzte aber CHECKBOX_FUER nicht — für alles ausser done/wip griff der
  // Fallback `?? '[ ]'`. Damit überschrieb `plan:set <geparkt> status=parked` die
  // Legendenmarke `[d]` still mit `[ ]`, und kein Tor sah es: CHECKBOX_STATUS
  // erlaubt `[ ]` auch für parked/blocked. Der geparkte Schritt las sich danach
  // wie ein offener — genau die Marke, die das Ausführungs-Protokoll Ziff. 1 zum
  // Überspringen verlangt. `plan:set` konnte `[d]` zudem nie wieder erzeugen.
  it('parked → parked erhält die Legendenmarke [d]', () => {
    const out = setField(geparkt('[d]'), 'W2·5j', 'status', 'parked');
    expect(out.split('\n')[0]).toBe('- [d] **5j-TABELLEN · X**');
  });

  it('parked → blocked erhält die Legendenmarke [d]', () => {
    const out = setField(geparkt('[d]'), 'W2·5j', 'status', 'blocked');
    expect(out.split('\n')[0]).toBe('- [d] **5j-TABELLEN · X**');
  });

  it('[D] (gross) → parked bleibt als geparkt-Marke erhalten', () => {
    const out = setField(geparkt('[D]'), 'W2·5j', 'status', 'parked');
    expect(out.split('\n')[0]).toBe('- [D] **5j-TABELLEN · X**');
  });

  // Fund R3-2 (Endprüfung Runde 3, 31.7.2026) — fachliche Richtigstellung, kein
  // Refactoring (§6.3): Der R2-9/R2-15-Fix hatte `parked: '[d]'` und
  // `blocked: '[d]'` in `CHECKBOX_FUER` aufgenommen. Begründet war nur das
  // BEWAHREN einer vorhandenen `[d]`-Marke — das hängt aber an der
  // `CHECKBOX_STATUS`-Abfrage, nicht an `CHECKBOX_FUER`. Der Eintrag ERZEUGTE die
  // Legendenmarke darum auch neu: ein bloss blockierter Schritt wurde in der
  // menschenlesbaren Liste als «geparkt/zurückgestellt» beschriftet (§8), und
  // derselbe Status `blocked` erschien je nach Vorzustand als `[ ]` ODER `[d]`
  // (gemessen: `[~]`→blocked ⇒ `[d]`, `[ ]`→blocked ⇒ `[ ]`). Kein Tor sah es,
  // weil `CHECKBOX_STATUS['[d]']` beide Status duldet. Normalform ist `[ ]`.
  it('[~] + blocked ⇒ [ ] (Normalform, nicht die Legendenmarke)', () => {
    const out = setField(geparkt('[~]').replace('status: parked', 'status: wip'), 'W2·5j', 'status', 'blocked');
    expect(out.split('\n')[0]).toBe('- [ ] **5j-TABELLEN · X**');
  });

  it('[x] + blocked ⇒ [ ] (Normalform, nicht die Legendenmarke)', () => {
    const out = setField(geparkt('[x]').replace('status: parked', 'status: done'), 'W2·5j', 'status', 'blocked');
    expect(out.split('\n')[0]).toBe('- [ ] **5j-TABELLEN · X**');
  });

  // Gegenprobe zur Rücknahme: das BEWAHREN bleibt unangetastet — es hängt an der
  // CHECKBOX_STATUS-Abfrage, die `[d]`/`[D]` für parked und blocked duldet.
  //
  // GESTRICHEN 31.8.2026 (Ent-Regulierung Runde 2, Batch B): der zweite Fall
  // dieser Gegenprobe, «[d] + parked bleibt [d]», war mit dem Fall
  // «parked → parked erhält die Legendenmarke [d]» (oben, Fund R2-9/R2-15)
  // WÖRTLICH rumpfgleich — dieselbe Eingabe `geparkt('[d]')`/`parked`, dieselbe
  // Erwartung. Er war das einzige echte Duplikat unter 463 Steuerungs-Fällen.
  // Beide Vorfälle bleiben eingefroren: R2-9/R2-15 durch den Fall oben, die
  // R3-2-Gegenprobe durch den `[D]`-Fall hier.
  it('[D] + blocked bleibt [D] (Bewahrung unangetastet)', () => {
    const out = setField(geparkt('[D]'), 'W2·5j', 'status', 'blocked');
    expect(out.split('\n')[0]).toBe('- [D] **5j-TABELLEN · X**');
  });

  // Gegenprobe: passt die vorhandene Marke NICHT zum neuen Status, wird sie
  // nachgezogen — sonst wäre der Nachzug wirkungslos statt schonend. Ziel ist seit
  // R3-2 die Normalform `[ ]`, nicht mehr die Legendenmarke `[d]`: wer parken
  // WILL, setzt die Marke von Hand; `plan:set` erfindet sie nicht.
  it('[x] → parked wird auf die Normalform [ ] nachgezogen', () => {
    const out = setField(geparkt('[x]').replace('status: parked', 'status: done'), 'W2·5j', 'status', 'parked');
    expect(out.split('\n')[0]).toBe('- [ ] **5j-TABELLEN · X**');
  });
});

// ---------------------------------------------------------------------------
// Fund R2-1/R2-10 (Runde 2, KRITISCH): dieselbe Nachbarschafts-Annahme wie in
// parse.ts — der Checkbox-Nachzug brach an der ersten nicht-leeren Zeile über dem
// @meta ab. Steht dort Prosa, schreibt `plan:set` das @meta und lässt die
// sichtbare Checkbox stehen. Beide Layouts wörtlich aus der echten ROADMAP.
// ---------------------------------------------------------------------------
describe('setField — Checkbox-Nachzug über Prosa hinweg (Fund R2-1/R2-10)', () => {
  const B20 = [
    '  - [ ] **B20 · Prüf-Batch — «bereits gebaut» am Prod-Stand nachmessen (alle Bauteile)** — 15 Befunde (Blocker 1 · Hoch 5). §21.',
    '    **`dep: []` seit 31.7.2026 (Endprüfungs-Fund 18):** B20 ist kein Neubau, sondern Nachmessung,',
    '    und trägt mit LM-062 den einzigen Blocker der «bereits gebaut»-Klasse. Am Kettenende hätte die',
    '    Behauptung «ist gebaut» erst nach 19 Bau-Batches geprüft — erwiese sie sich als falsch, entstünde',
    '    der Bau-Posten am spätesten möglichen Punkt. B20 ist damit **unabhängig und vorziehbar**; die',
    '    Bau-Kette B1→…→B19 bleibt unverändert seriell. `plan:next` führt B20 dadurch gewollt in ready-now.',
    '    <!-- @meta id: W2·17-UI-BEFUNDE-B20 · status: ready · blocker: null · dep: [] · feld: betrieb -->',
  ].join('\n');

  const ZEIT = [
    '- [ ] **5g-ZEIT · Norm-Zeitmaschine + Fassungs-Diff** *(Ideen-Intake 20.7.2026 · Extraktion, `QS-GP`)*:',
    '  **Status 20.7.2026 (David):** «irgendwann, aktuell nicht relevant» → von `blocked` auf `parked`.',
    '  <!-- @meta id: W2·5g-ZEIT · status: parked · blocker: zeit-historik-poc · dep: [] · feld: betrieb -->',
  ].join('\n');

  it('B20-Layout: status=done zieht die Checkbox trotz 5 Prosa-Zeilen auf [x]', () => {
    const out = setField(B20, 'W2·17-UI-BEFUNDE-B20', 'status', 'done');
    expect(out.split('\n')[0].startsWith('  - [x] **B20 ·')).toBe(true);
  });

  it('W2·5g-ZEIT-Layout: status=wip zieht die Checkbox trotz Prosa-Zeile auf [~]', () => {
    const out = setField(ZEIT, 'W2·5g-ZEIT', 'status', 'wip');
    expect(out.split('\n')[0].startsWith('- [~] **5g-ZEIT ·')).toBe(true);
  });

  it('bindet NICHT an eine fremde Bullet-Zeile darüber', () => {
    const md = [
      '  - [ ] **fremde Checkbox der Nachbarliste**',
      '- **Datenhaltung / Single-Source-DB** *(QS-DATA)*.',
      '  <!-- @meta id: QS-DATA · status: blocked · blocker: b1 · dep: [] · feld: betrieb -->',
    ].join('\n');
    const out = setField(md, 'QS-DATA', 'status', 'done');
    expect(out.split('\n')[0]).toBe('  - [ ] **fremde Checkbox der Nachbarliste**');
  });
});

// ---------------------------------------------------------------------------
// QS-PLAN-EINFACH (14.8.2026): `seq-hart`/`seq-weich` sind gestrichen — Alt-
// Zeilen im Bestand dürfen plan:set aber nicht brechen; der nächste Schreib-
// zugriff räumt die Felder mechanisch ab.
// ---------------------------------------------------------------------------
describe('setField — optionale Felder und Altfeld-Toleranz', () => {
  it('räumt gestrichene Altfelder (seq-hart/seq-weich) beim Schreiben ab', () => {
    const alt =
      '  <!-- @meta id: W2·5d · status: ready · blocker: null · dep: [] · feld: betrieb -->';
    const md = ['- [ ] **5d · Gesetzes-UX**', alt].join('\n');
    const out = setField(md, 'W2·5d', 'status', 'wip');
    const zeile = out.split('\n').find((z) => z.includes('@meta'))!;
    expect(zeile).toContain('status: wip');
    expect(zeile).not.toContain('seq-hart');
    expect(zeile).not.toContain('seq-weich');
  });

  // Beim Nachtragen der `fahrplan:`-Felder für W3·10/W3·11/W3·14-S/W3·14-a11y
  // aufgefallen (31.7.2026): `setField` ersetzte das Feld per Regex in der
  // normalisierten Zeile. Fehlte das OPTIONALE Feld dort, traf die Regex nichts —
  // die Zeile blieb unverändert, und die CLI meldete trotzdem «gesetzt: …».
  // Dieselbe Fehlerklasse wie die Funde dieser Runde: ein Werkzeug, das seinen
  // Nicht-Erfolg als Erfolg meldet. Optionale Felder werden jetzt angehängt;
  // parseEtikett liest reihenfolge-unabhängig, serializeEtikett normalisiert.
  it('trägt ein fehlendes optionales Feld nach, statt still nichts zu tun', () => {
    const md = [
      '- [ ] **10 · X**',
      '  <!-- @meta id: W3·10 · status: ready · blocker: null · dep: [] · feld: betrieb -->',
    ].join('\n');
    const out = setField(md, 'W3·10', 'fahrplan', 'fahrplaene/FAHRPLAN-X.md');
    expect(out).not.toBe(md);
    expect(out.split('\n')[1]).toBe(
      '  <!-- @meta id: W3·10 · status: ready · blocker: null · dep: [] · feld: betrieb · fahrplan: fahrplaene/FAHRPLAN-X.md -->');
  });

  it('gestrichene Felder sind nicht mehr setzbar', () => {
    const md = [
      '- [ ] **10 · X**',
      '  <!-- @meta id: W3·10 · status: ready · blocker: null · dep: [] · feld: betrieb -->',
    ].join('\n');
    expect(() => setField(md, 'W3·10', 'seq-hart', '[QS-PERF(a.ts)]')).toThrow(/Unbekanntes Feld/);
    expect(() => setField(md, 'W3·10', 'of', 'ja')).toThrow(/Unbekanntes Feld/);
  });
});

// ---------------------------------------------------------------------------
// §17-Wurzel-Fix (Anlass 5.8.2026): `npm run plan:set -- QS-TOK status=wip`
// setzte den Queue-Kopf auf `wip`, liess den Prosa-Marker «⬆ OBERSTER OFFENER
// SCHRITT» unverändert — der wip-Schritt fällt aus `resolve().readyNow`
// (aufloesen.ts), also driftete der Marker sofort gegen `plan:next`, und
// check:plan Regel 8.4 wurde erst im NÄCHSTEN Lauf rot (check.ts). Die neue
// Beobachtungsfunktion `prosaMarkerDriftHinweis` prüft dieselbe Lage sofort
// nach dem Setzen, ohne die Prosa selbst anzufassen.
// ---------------------------------------------------------------------------
describe('prosaMarkerDriftHinweis (§17-Wurzel-Fix)', () => {
  const mitQueue = (queueIds: string, marker: string) =>
    [
      `<!-- @queue: ${queueIds} -->`,
      marker,
      '- [ ] **4 · D**',
      '  <!-- @meta id: W1·4 · status: ready · blocker: null · dep: [] · feld: betrieb -->',
      '- [ ] **5 · E**',
      '  <!-- @meta id: W1·5 · status: ready · blocker: null · dep: [] · feld: betrieb -->',
    ].join('\n');

  it('Marker nennt X, X wird wip → Hinweis enthält beide IDs', () => {
    const md = mitQueue('W1·4, W1·5', '> **⬆ OBERSTER OFFENER SCHRITT:** `W1·4` zuerst.');
    const out = setField(md, 'W1·4', 'status', 'wip');
    const hinweis = prosaMarkerDriftHinweis(out);
    expect(hinweis).not.toBeNull();
    expect(hinweis).toContain('`W1·4`');
    expect(hinweis).toContain('`W1·5`');
    expect(hinweis).toContain('Regel 8.4');
  });

  it('Marker stimmt weiterhin mit plan:next überein → kein Hinweis', () => {
    const md = mitQueue('W1·4, W1·5', '> **⬆ OBERSTER OFFENER SCHRITT:** `W1·4` zuerst.');
    const out = setField(md, 'W1·5', 'blocker', 'irrelevant-fuer-marker');
    expect(prosaMarkerDriftHinweis(out)).toBeNull();
  });

  it('kein Marker vorhanden → kein Hinweis', () => {
    const md = mitQueue('W1·4, W1·5', '');
    const out = setField(md, 'W1·4', 'status', 'wip');
    expect(prosaMarkerDriftHinweis(out)).toBeNull();
  });
});
