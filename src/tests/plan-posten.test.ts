// Posten-Modell (QS-EFFIZIENZ, 20.9.2026) — «ein Nebenfund = eine kleine Datei».
//
// Der teuerste Fehler dieses Werkzeugs wäre ein STILLER: eine Migration, die
// einen Satz verliert, fällt niemandem auf — der Plan sieht danach aufgeräumt
// aus. Darum prüfen die Tests unten zuerst den WORTLAUT-ERHALT byte-genau und
// erst danach die Bequemlichkeit.
import { describe, expect, it } from 'vitest';
import {
  datumAus,
  istZeigerStub,
  kopfText,
  migrationsPlan,
  notizenPosten,
  parsePosten,
  postenInhalt,
  postenPfad,
  postenZeile,
  postenJeDach,
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
