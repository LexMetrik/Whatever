// Posten-Modell (QS-EFFIZIENZ, 20.9.2026) — «ein Nebenfund = eine kleine Datei».
//
// Der teuerste Fehler dieses Werkzeugs wäre ein STILLER: eine Migration, die
// einen Satz verliert, fällt niemandem auf — der Plan sieht danach aufgeräumt
// aus. Darum prüfen die Tests unten zuerst den WORTLAUT-ERHALT byte-genau und
// erst danach die Bequemlichkeit.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  datumAus,
  istZeigerStub,
  kopfText,
  migrationsPlan,
  notizenLeerHinweis,
  notizenPosten,
  parsePosten,
  postenInhalt,
  postenPfad,
  postenZeile,
  postenJeDach,
  schliessenPruefen,
  slugVon,
  titelAus,
  unterbloecke,
  zeilenHash,
} from '../../scripts/plan/postenKern';
import { pruefePosten } from '../../scripts/plan/postenRegel';

const META = (id: string, status = 'ready') =>
  `  <!-- @meta id: ${id} · status: ${status} · blocker: null · dep: [] · feld: betrieb -->`;

const PLAN = (...unter: string[]) =>
  ['## Betrieb', '', '- [ ] **Dach-Schritt** *(`QS-X`)*', META('QS-X'), '  Ziel-Prosa.', ...unter, ''].join('\n');

// ---------------------------------------------------------------------------
describe('Kopf-Format', () => {
  it('schreibt und liest denselben Kopf (Rundreise)', () => {
    const kopf = { dach: 'QS-X', titel: 'Ein Fund', anlass: 'Messung 18.9.2026', wartetAuf: 'david' };
    const p = parsePosten('plan/posten/2026-09-18-ein-fund.md', postenInhalt(kopf, 'Rumpf-Text.'));
    expect('fehler' in p).toBe(false);
    if ('fehler' in p) return;
    expect(p.kopf).toEqual(kopf);
    expect(p.datum).toBe('2026-09-18');
    expect(p.rumpf.trim()).toBe('Rumpf-Text.');
  });

  it('optionale Felder fehlen im Text, wenn sie null sind', () => {
    expect(kopfText({ dach: 'QS-X', titel: 'T', anlass: null, wartetAuf: null })).toBe(
      '<!-- @posten\ndach: QS-X\ntitel: T\n-->',
    );
  });

  it.each([
    ['ohne Kopf', 'plan/posten/2026-09-18-x.md', 'nur Text', /@posten/],
    ['ohne dach', 'plan/posten/2026-09-18-x.md', '<!-- @posten\ntitel: T\n-->\n', /ohne `dach:`/],
    ['ohne titel', 'plan/posten/2026-09-18-x.md', '<!-- @posten\ndach: QS-X\n-->\n', /ohne `titel:`/],
    ['Tippfehler im Schlüssel', 'plan/posten/2026-09-18-x.md', '<!-- @posten\ndach: QS-X\ntitel: T\ndatum: 1\n-->\n', /unbekannter Kopf-Schlüssel/],
    ['Dateiname ohne Datum', 'plan/posten/x.md', '<!-- @posten\ndach: QS-X\ntitel: T\n-->\n', /YYYY-MM-DD/],
  ])('meldet Formfehler: %s', (_n, pfad, inhalt, muster) => {
    const p = parsePosten(pfad, inhalt);
    expect('fehler' in p && muster.test(p.fehler)).toBe(true);
  });

  it('Dateiname-Vergabe ist deterministisch, auch bei Titel-Gleichheit', () => {
    const belegt = new Set<string>();
    const a = postenPfad('2026-09-20', 'Grösse & Deckel', belegt);
    belegt.add(a);
    const b = postenPfad('2026-09-20', 'Grösse & Deckel', belegt);
    expect(a).toBe('plan/posten/2026-09-20-groesse-deckel.md');
    expect(b).toBe('plan/posten/2026-09-20-groesse-deckel-2.md');
    expect(slugVon('ÄÖÜ — ß!')).toBe('aeoeue-ss');
  });

  it('Datum kommt aus dem Anlass in beiden Schreibweisen', () => {
    expect(datumAus('Messung 18.9.2026')).toBe('2026-09-18');
    expect(datumAus('Stand 2026-09-18')).toBe('2026-09-18');
    expect(datumAus('ohne Datum')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('schliessenPruefen — Vorprüfung für `plan:posten -- zu` (P1, Bug-Check 20.9.2026)', () => {
  const REPO = '/repo';
  const dateien = new Map<string, string>([
    ['/repo/plan/posten/2026-09-20-t.md', postenInhalt({ dach: 'QS-X', titel: 'T', anlass: null, wartetAuf: null }, 'x')],
    ['/repo/plan/posten/2026-09-20-ohne-kopf.md', 'kein Kopf'],
    ['/repo/archiv/posten/2026-09-19-erledigt.md', postenInhalt({ dach: 'QS-X', titel: 'A', anlass: null, wartetAuf: null }, 'x')],
    ['/repo/WICHTIG.md', '# Wichtig\n\nkeine Posten-Datei.'],
  ]);
  const existsFn = (p: string) => dateien.has(p);
  const leseFn = (p: string) => {
    const v = dateien.get(p);
    if (v === undefined) throw new Error(`ENOENT ${p}`);
    return v;
  };
  const identFn = (p: string) => p; // kein Symlink in diesem Fake-FS

  it('GRÜN: gültiger Posten unter dem Posten-Ordner', () => {
    const r = schliessenPruefen('plan/posten/2026-09-20-t.md', REPO, existsFn, leseFn, identFn);
    expect(r).toEqual({ ok: true, fehler: null, relPfad: 'plan/posten/2026-09-20-t.md' });
  });

  it('ROT-Reproduktion (Prüfer-Probe `zu WICHTIG.md`): Datei ausserhalb des Posten-Ordners wird abgelehnt, nicht verschoben', () => {
    const r = schliessenPruefen('WICHTIG.md', REPO, existsFn, leseFn, identFn);
    expect(r.ok).toBe(false);
    expect(r.fehler).toMatch(/liegt nicht unter plan\/posten\//);
  });

  it('ROT-Reproduktion (Doppel-Probe): bereits geschlossene Datei (unter archiv/posten) wird abgelehnt, nichts doppelt angehängt', () => {
    const r = schliessenPruefen('archiv/posten/2026-09-19-erledigt.md', REPO, existsFn, leseFn, identFn);
    expect(r.ok).toBe(false);
    expect(r.fehler).toMatch(/liegt bereits unter archiv\/posten\/.*schon geschlossen/);
  });

  it('lehnt einen `..`-Ausbruch aus dem Posten-Ordner ab', () => {
    const r = schliessenPruefen('plan/posten/../../WICHTIG.md', REPO, existsFn, leseFn, identFn);
    expect(r.ok).toBe(false);
    expect(r.fehler).toMatch(/liegt nicht unter plan\/posten\//);
  });

  it('meldet eine nicht existente Datei statt sie stillschweigend zu ignorieren', () => {
    const r = schliessenPruefen('plan/posten/2026-09-20-fehlt.md', REPO, existsFn, leseFn, identFn);
    expect(r.ok).toBe(false);
    expect(r.fehler).toMatch(/existiert nicht/);
  });

  it('lehnt eine Datei ohne gültigen `@posten`-Kopf ab, auch wenn sie im richtigen Ordner liegt', () => {
    const r = schliessenPruefen('plan/posten/2026-09-20-ohne-kopf.md', REPO, existsFn, leseFn, identFn);
    expect(r.ok).toBe(false);
    expect(r.fehler).toMatch(/kein `<!-- @posten/);
  });

  it('lehnt einen Symlink-Ausbruch aus dem realen Posten-Ordner ab', () => {
    // Textuell liegt der Pfad unter plan/posten/, aber sein REALER Pfad (nach
    // Symlink-Auflösung) zeigt aus dem Posten-Ordner hinaus.
    const realFn = (p: string) => (p === '/repo/plan/posten' ? '/repo/plan/posten' : '/anderswo/ausserhalb.md');
    const r = schliessenPruefen('plan/posten/2026-09-20-t.md', REPO, existsFn, leseFn, realFn);
    expect(r.ok).toBe(false);
    expect(r.fehler).toMatch(/Symlink.*hinaus/);
  });
});

// ---------------------------------------------------------------------------
describe('schliessenPruefen — echtes Dateisystem (Symlink-Ausbruch)', () => {
  it('lehnt eine Datei ab, die über einen Symlink aus plan/posten/ hinauszeigt', async () => {
    const os = await import('node:os');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const wurzel = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-posten-symlink-'));
    try {
      const posten = path.join(wurzel, 'plan', 'posten');
      const ausserhalb = path.join(wurzel, 'ausserhalb');
      fs.mkdirSync(posten, { recursive: true });
      fs.mkdirSync(ausserhalb, { recursive: true });
      const ziel = path.join(ausserhalb, 'geheim.md');
      fs.writeFileSync(ziel, postenInhalt({ dach: 'QS-X', titel: 'T', anlass: null, wartetAuf: null }, 'x'));
      fs.symlinkSync(ziel, path.join(posten, '2026-09-20-ausbruch.md'));
      const r = schliessenPruefen(
        'plan/posten/2026-09-20-ausbruch.md',
        wurzel,
        fs.existsSync,
        (p) => fs.readFileSync(p, 'utf8'),
        fs.realpathSync,
      );
      expect(r.ok).toBe(false);
      expect(r.fehler).toMatch(/Symlink.*hinaus/);
    } finally {
      fs.rmSync(wurzel, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
describe('unterbloecke — was ein Posten ist und was nicht', () => {
  it('bindet die Unterzeile an ihr Dach', () => {
    const b = unterbloecke(PLAN('  - [ ] **Fund A** — Text.'));
    expect(b.map((x) => [x.dach, x.box])).toEqual([['QS-X', ' ']]);
  });

  it('nimmt NUR strenger eingerückte Fortsetzungszeilen mit', () => {
    // Bestandsfall QS-PERF (gemessen 20.9.2026): der `**Detail:**`-Block des
    // DACHS steht auf demselben Einzug wie die Unterzeile. Eine Regel «bis zur
    // nächsten Bullet» hätte ihn mitgenommen und den Zeiger gelöscht.
    const md = PLAN('  - [ ] **Fund A** — Text.', '    Fortsetzung.', '  **Detail:** [F](fahrplaene/F.md)');
    const b = unterbloecke(md);
    expect(b).toHaveLength(1);
    expect(b[0].zeilen).toEqual(['  - [ ] **Fund A** — Text.', '    Fortsetzung.']);
  });

  it('bindet nichts vor dem ersten @meta (Legende, Querschnitt-Band)', () => {
    const md = ['## Betrieb', '', '  - [ ] **frei schwebend**', '- **Dach ohne Checkbox**', META('QS-X')].join('\n');
    expect(unterbloecke(md)).toEqual([]);
  });

  it('eine neue Top-Level-Bullet beendet den Geltungsbereich', () => {
    const md = [PLAN('  - [ ] **Fund A**'), '- [ ] **Anderer Schritt ohne @meta**', '  - [ ] **kein Posten**'].join('\n');
    expect(unterbloecke(md).map((x) => x.dach)).toEqual(['QS-X']);
  });

  // P2 (Bug-Check 20.9.2026): eine `- [ ]`-BEISPIELZEILE in einem Codezaun
  // oder einem mehrzeiligen HTML-Kommentar ist Dokumentation, kein Posten.
  it('ROT→GRÜN: Beispielzeile in einem ```-Codezaun ist kein Posten', () => {
    const md = PLAN('  Beispiel-Snippet:', '  ```', '  - [ ] **Beispiel** — nur zur Illustration.', '  ```');
    expect(unterbloecke(md)).toEqual([]);
  });

  it('ROT→GRÜN: Beispielzeile in einem mehrzeiligen HTML-Kommentar ist kein Posten', () => {
    const md = PLAN('<!-- Beispiel:', '  - [ ] **Beispiel** — nur zur Illustration.', '-->');
    expect(unterbloecke(md)).toEqual([]);
  });

  it('GRÜN (Grenze): einzeilige `<!-- @meta … -->`-Kommentare öffnen keinen Kommentar-Block', () => {
    // Wortgleich zum Hausstil — muss weiterhin das Dach setzen, nicht übersprungen werden.
    expect(unterbloecke(PLAN('  - [ ] **Fund A** — Text.'))[0].dach).toBe('QS-X');
  });

  it('GRÜN (Bestand unverändert): echte @blockers-/@david-fragen-Blöcke bleiben wie zuvor ausserhalb jedes Posten-Blocks', () => {
    // Diese Blöcke tragen unindentierte Prosa (kein `- [ ]`) — vor UND nach der
    // Kontext-Erweiterung liefern sie keinen Unterblock.
    const md = [
      PLAN(),
      '<!-- @blockers',
      'irgendein-blocker: Prosa ohne Checkbox.',
      '-->',
      '',
      '<!-- @david-fragen',
      'irgendeine-frage: Prosa ohne Checkbox.',
      '-->',
    ].join('\n');
    expect(unterbloecke(md)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
describe('check:plan Regel 16', () => {
  const datei = (pfad: string, inhalt: string) => [{ pfad, inhalt }];
  const gueltig = (dach = 'QS-X') => postenInhalt({ dach, titel: 'T', anlass: null, wartetAuf: null }, 'Rumpf.');

  it('GRÜN: saubere ROADMAP + Posten an lebendem Dach', () => {
    expect(pruefePosten(PLAN(), datei('plan/posten/2026-09-20-t.md', gueltig()))).toEqual([]);
  });

  it('ROT (b): eingerückte Checklisten-Zeile unter einem Dach', () => {
    const p = pruefePosten(PLAN('  - [ ] **Fund A** — Text.'), []);
    expect(p).toHaveLength(1);
    expect(p[0].id).toBe('QS-X');
    expect(p[0].meldung).toMatch(/plan:posten -- neu --dach QS-X/);
  });

  it('GRÜN (b-Grenze): Etappen-Kennungszeile bleibt erlaubt (Regel 14 liest sie)', () => {
    expect(pruefePosten(PLAN('  - [ ] **S2 · Typografie** — offen.'), [])).toEqual([]);
  });

  it('GRÜN (b-Grenze): eingerückter Unterschritt mit eigenem @meta bleibt erlaubt', () => {
    const md = PLAN('  - [ ] **Unterschritt**', '    <!-- @meta id: QS-Y · status: ready · blocker: null · dep: [] · feld: betrieb -->');
    expect(pruefePosten(md, [])).toEqual([]);
  });

  it('ROT (a): Posten hängt an einem Dach, das es nicht (mehr) gibt', () => {
    const p = pruefePosten(PLAN(), datei('plan/posten/2026-09-20-t.md', gueltig('QS-WEG')));
    expect(p[0].meldung).toMatch(/nicht \(mehr\) führt/);
  });

  it('ROT (a): Dach ist done, Posten noch offen — die F17-Absicherung', () => {
    const md = ['## Betrieb', '', '- [x] **Dach**', META('QS-X', 'done'), ''].join('\n');
    const p = pruefePosten(md, datei('plan/posten/2026-09-20-t.md', gueltig()));
    expect(p).toHaveLength(1);
    expect(p[0].meldung).toMatch(/steht auf done/);
    expect(p[0].meldung).toMatch(/plan:posten -- zu /);
  });

  it('ROT (a): Formfehler im Kopf wird gemeldet, nicht verschluckt', () => {
    const p = pruefePosten(PLAN(), datei('plan/posten/2026-09-20-t.md', 'kein Kopf'));
    expect(p[0].meldung).toMatch(/kein `<!-- @posten/);
  });
});

// ---------------------------------------------------------------------------
describe('migrieren — Wortlaut-Erhalt', () => {
  const HEUTE = '2026-09-20';

  // P2-Regressionsschutz (Bug-Check 20.9.2026): `migrieren` liest denselben
  // Bestand wie Regel 16 (b) über `unterbloecke()` — auf dem aktuellen
  // ROADMAP.md-Stand (nach der Posten-Migration) muss der Lauf ein No-op
  // bleiben, auch nachdem unterbloecke() Codezäune/HTML-Kommentare überspringt.
  it('ist auf dem echten ROADMAP.md-Bestand ein No-op', () => {
    const md = readFileSync('ROADMAP.md', 'utf8');
    const r = migrationsPlan(md, new Map(), HEUTE);
    expect(r.dateien).toEqual([]);
    expect(r.ohneTitel).toEqual([]);
    expect(r.chronikBlock).toBe('');
    expect(r.neuesMd).toBe(md);
  });

  it('löst eine offene Unterzeile byte-genau in eine Posten-Datei', () => {
    const zeile = '  - [ ] **Fund A** *(Messung 18.9.2026)* — langer Wortlaut mit `Code` und — Gedankenstrich.';
    const r = migrationsPlan(PLAN(zeile), new Map(), HEUTE);
    expect(r.dateien).toHaveLength(1);
    expect(r.dateien[0].pfad).toBe('plan/posten/2026-09-18-fund-a.md');
    expect(r.dateien[0].inhalt).toContain(zeile); // byte-genau, samt Einzug und Checkbox
    expect(r.dateien[0].inhalt).toContain('anlass: Messung 18.9.2026');
    expect(r.neuesMd).not.toContain(zeile);
    expect(r.neuesMd).toContain('  Ziel-Prosa.'); // Dach-Prosa unangetastet
  });

  it('nimmt Fortsetzungszeilen mit und lässt den Dach-Zeiger stehen', () => {
    const md = PLAN('  - [ ] **Fund A** — eins', '    zwei', '  **Detail:** [F](fahrplaene/F.md)');
    const r = migrationsPlan(md, new Map(), HEUTE);
    expect(r.dateien[0].inhalt).toContain('  - [ ] **Fund A** — eins\n    zwei');
    expect(r.neuesMd).toContain('  **Detail:** [F](fahrplaene/F.md)');
  });

  it('jede entfernte Zeile findet sich byte-gleich wieder (Posten, Chronik oder erklärt entfallen)', () => {
    const md = PLAN(
      '  - [ ] **Offen A** — Text.',
      '  - [x] **Erledigt mit Substanz** — ✅ 1.9.2026, dabei fiel ein zweiter Defekt auf: der Zähler zählt doppelt.',
      '  - [x] **Erledigt: B1 und B2** — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026.',
      '  - [ ] **S2 · Etappe** — bleibt.',
    );
    const r = migrationsPlan(md, new Map(), HEUTE);
    const weg = md.split('\n').filter((z) => !r.neuesMd.split('\n').includes(z));
    const erhalten = r.dateien.map((d) => d.inhalt).join('\n') + '\n' + r.chronikBlock;
    const entfallen = r.entfallen.map((e) => e.text);
    for (const z of weg) {
      expect(erhalten.includes(z) || entfallen.includes(z.trim())).toBe(true);
    }
    expect(r.neuesMd).toContain('  - [ ] **S2 · Etappe** — bleibt.');
    expect(r.entfallen).toHaveLength(1);
  });

  it('ist idempotent: der zweite Lauf findet nichts mehr', () => {
    const erst = migrationsPlan(PLAN('  - [ ] **Fund A** — Text.'), new Map(), HEUTE);
    const zweit = migrationsPlan(erst.neuesMd, new Map(), HEUTE);
    expect(zweit.dateien).toEqual([]);
    expect(zweit.chronikBlock).toBe('');
    expect(zweit.neuesMd).toBe(erst.neuesMd);
  });

  it('ist reproduzierbar: gleiche Eingabe ⇒ byte-gleiche Ausgabe', () => {
    const md = PLAN('  - [ ] **Fund A** — Text.', '  - [x] **Alt** — ✅ mit eigener Substanz und einem zweiten Satz.');
    const a = migrationsPlan(md, new Map(), HEUTE);
    const b = migrationsPlan(md, new Map(), HEUTE);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('verweigert eine Zeile ohne **Titel** und nennt ihren Hash', () => {
    const zeile = '  - [ ] Stufe 2: Abgleich über Artikelnummer statt eId.';
    const ohne = migrationsPlan(PLAN(zeile), new Map(), HEUTE);
    expect(ohne.dateien).toEqual([]);
    expect(ohne.neuesMd).toContain(zeile); // bleibt stehen statt geraten zu werden
    expect(ohne.ohneTitel[0].hash).toBe(zeilenHash(zeile));

    const mit = migrationsPlan(PLAN(zeile), new Map([[zeilenHash(zeile), 'Artikelnummer statt eId']]), HEUTE);
    expect(mit.dateien[0].pfad).toBe('plan/posten/2026-09-20-artikelnummer-statt-eid.md');
    expect(mit.dateien[0].inhalt).toContain(zeile);
  });

  it('markiert WARTET-AUF-DAVID-Zeilen als David-Posten', () => {
    const r = migrationsPlan(PLAN('  - [ ] **WARTET AUF DAVID (fachlich, §7):** Etwas entscheiden.'), new Map(), HEUTE);
    expect(r.dateien[0].inhalt).toContain('wartet-auf: david');
  });

  it('lässt ein Dach ohne @meta und Etappen-Zeilen unberührt', () => {
    expect(titelAus('  - [ ] **Fund `A`:** Text')).toBe('Fund A');
    expect(istZeigerStub(['  - [x] **Erledigt: X** — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026.'])).toBe(true);
    // Schwelle Null: schon eine Aufzählung ist Substanz und wandert wörtlich mit.
    expect(istZeigerStub(['  - [x] **Erledigt:** Z1 · Z2 — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 7.9.2026.'])).toBe(false);
    expect(istZeigerStub(['  - [x] **X** — ✅ dabei fiel ein zweiter, bisher unbekannter Defekt auf. Wortlaut: ROADMAP-CHRONIK.md.'])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe('aus-notizen', () => {
  const NOTIZEN = [
    '# Notizen 2026-09-20',
    '',
    '## Nebenfunde',
    '- [ ] [QS-X] Zähler zählt doppelt — `zaehler.ts:12` addiert zweimal.',
    '- [ ] ohne Dach-Marke',
    '- [x] [QS-X] schon abgehakt',
    '',
    '## Wartet auf David',
    '- [ ] [QS-X] Deckel heben?',
    '',
    '## Erledigt in dieser Session',
    '- [ ] [QS-X] gehört nicht in die Ernte',
  ].join('\n');

  it('erntet nur die richtigen Abschnitte und hakt sie ab', () => {
    const r = notizenPosten(NOTIZEN, '2026-09-20');
    expect(r.dateien.map((d) => d.titel)).toEqual(['Zähler zählt doppelt', 'Deckel heben?']);
    expect(r.dateien[0].inhalt).toContain('`zaehler.ts:12` addiert zweimal.');
    expect(r.dateien[1].inhalt).toContain('wartet-auf: david');
    expect(r.neuerText).toContain('- [x] [QS-X] Zähler zählt doppelt');
    expect(r.neuerText).toContain('- [ ] [QS-X] gehört nicht in die Ernte'); // fremder Abschnitt unberührt
  });

  it('rät kein Dach, sondern meldet die Zeile', () => {
    expect(notizenPosten(NOTIZEN, '2026-09-20').brauchtDach).toEqual(['ohne Dach-Marke']);
  });

  // P3 (Bug-Check 20.9.2026): `(.+)$` schliesst `\r` als Zeilenterminator aus,
  // und der Split war nur an `\n` — eine CRLF-Datei liess jede Zeile still
  // durchfallen. ROT-Reproduktion vor dem Fix: dateien:[], brauchtDach:[].
  it('ROT→GRÜN: eine CRLF-Datei liefert dieselben Funde wie dieselbe Datei mit LF', () => {
    const crlf = NOTIZEN.replace(/\n/g, '\r\n');
    const rLf = notizenPosten(NOTIZEN, '2026-09-20');
    const rCrlf = notizenPosten(crlf, '2026-09-20');
    expect(rCrlf.dateien.map((d) => d.titel)).toEqual(rLf.dateien.map((d) => d.titel));
    expect(rCrlf.brauchtDach).toEqual(rLf.brauchtDach);
    expect(rCrlf.dateien).toHaveLength(2); // vor dem Fix: 0
  });

  it('schreibt beim Zurückschreiben durchgängig LF (Entscheid P3: vereinheitlichen statt mischen)', () => {
    const crlf = NOTIZEN.replace(/\n/g, '\r\n');
    const r = notizenPosten(crlf, '2026-09-20');
    expect(r.neuerText).not.toContain('\r');
    expect(r.neuerText).toContain('- [x] [QS-X] Zähler zählt doppelt');
  });

  it('einzelnes `\\r` (Alt-Mac-Zeilenende) wird ebenfalls normalisiert', () => {
    const cr = NOTIZEN.replace(/\n/g, '\r');
    expect(notizenPosten(cr, '2026-09-20').dateien).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
describe('notizenLeerHinweis — Sichtbarkeit bei 0 Funden (P3, F17)', () => {
  it('meldet 0 Funde in einer nicht-leeren Datei statt still zu enden', () => {
    const r = { dateien: [], brauchtDach: [] };
    expect(notizenLeerHinweis('# Notizen\n\nnichts Erkennbares hier.', r)).toMatch(/0 Zeilen erkannt/);
  });

  it('schweigt bei einer leeren Datei (kein Dauer-Rauschen)', () => {
    expect(notizenLeerHinweis('', { dateien: [], brauchtDach: [] })).toBeNull();
    expect(notizenLeerHinweis('   \n  ', { dateien: [], brauchtDach: [] })).toBeNull();
  });

  it('schweigt, sobald etwas gefunden wurde', () => {
    expect(notizenLeerHinweis('Text', { dateien: [{ pfad: 'x', inhalt: 'x', dach: 'QS-X', titel: 'T' }], brauchtDach: [] })).toBeNull();
    expect(notizenLeerHinweis('Text', { dateien: [], brauchtDach: ['eine Zeile'] })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('Sichtbarkeit (F17)', () => {
  it('plan:next-Zeile ist datumsfrei und zählt David-Posten getrennt', () => {
    const dateien = [
      { pfad: 'plan/posten/2026-09-20-a.md', inhalt: postenInhalt({ dach: 'QS-X', titel: 'A', anlass: null, wartetAuf: null }, 'x') },
      { pfad: 'plan/posten/2026-09-20-b.md', inhalt: postenInhalt({ dach: 'QS-X', titel: 'B', anlass: null, wartetAuf: 'david' }, 'x') },
      { pfad: 'plan/posten/2026-09-20-c.md', inhalt: postenInhalt({ dach: 'QS-Y', titel: 'C', anlass: null, wartetAuf: null }, 'x') },
    ];
    expect(postenZeile(postenJeDach(dateien))).toBe(
      '📌 Offene Posten: 3 in 2 Schritten (davon 1 wartet-auf-David) — `npm run plan:posten -- <ID>`',
    );
  });

  it('keine Posten ⇒ keine Zeile (kein Dauer-Rauschen)', () => {
    expect(postenZeile(new Map())).toBeNull();
  });
});
