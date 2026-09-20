import { describe, expect, it } from 'vitest';
import { pruefeKopfBuchung } from '../../scripts/plan/kopfBuchung';

// ─── Regel 15 — KOPF-BUCHUNG (Anlass 20.9.2026, W2·24-DESIGN-IDENTITAET / W3-TARIF-STAND) ──
//
// Zuschnitt, deklarierte Grenzen und Geburtsbeweis stehen im Kopf von
// scripts/plan/kopfBuchung.ts. Hier wird die Mechanik festgenagelt — samt dem
// ROT-Fall, damit die Regel auch dann noch rot werden KANN, wenn die reale
// ROADMAP längst bereinigt ist (F2e: ein Tor, das man nur einmal rot gesehen
// hat, ist nur einmal geprüft). Die drei GRENZ-Tests unten sind absichtlich
// Grün-Erwartungen: sie halten die Untergrenze fest, damit eine spätere
// Erweiterung sie bewusst kippen muss statt versehentlich.

const META = (id: string, status: string) =>
  `  <!-- @meta id: ${id} · status: ${status} · blocker: null · dep: [] · feld: test -->`;

describe('Regel 15 · Kopf-Buchung', () => {
  it('ROT: erledigter Kopf trägt einen offenen Unterposten', () => {
    const p = pruefeKopfBuchung(
      [
        '- [x] **Erledigter Dach-Schritt**',
        META('W9·TEST', 'done'),
        '  ✅ gelandet 6.9.2026 (#734).',
        '  - [ ] **WARTET AUF DAVID (fachlich, §7):** Verjährungsrevision 2020.',
      ].join('\n'),
    );
    expect(p).toHaveLength(1);
    expect(p[0].id).toBe('W9·TEST');
    expect(p[0].meldung).toContain('ROADMAP.md:4');
    expect(p[0].meldung).toContain('WARTET AUF DAVID');
  });

  it('ROT: mehrere offene Posten ergeben mehrere Meldungen — je Posten eine', () => {
    const p = pruefeKopfBuchung(
      [
        '- [x] **Erledigt**',
        META('W9·MEHR', 'done'),
        '  - [ ] **Posten A**',
        '  - [x] **Posten B** — erledigt.',
        '  - [ ] **Posten C**',
      ].join('\n'),
    );
    expect(p).toHaveLength(2);
    expect(p.map((x) => x.meldung.match(/ROADMAP\.md:(\d+)/)![1])).toEqual(['3', '5']);
  });

  it('ROT auch ohne @meta: die abgehakte Kopf-Checkbox allein genügt', () => {
    // Im Bestand real: `QS-BEWAEHRUNG` ist nur abgehakt, ohne @meta-Zeile.
    const p = pruefeKopfBuchung(['- [x] **Kopf ohne @meta** — ✅ 15.9.2026.', '  - [ ] **Doch noch offen**'].join('\n'));
    expect(p).toHaveLength(1);
    expect(p[0].id).toBeNull();
    expect(p[0].meldung).toContain('Kopf ohne @meta');
  });

  it('ROT auch bei `status: done` unter einer nicht nachgezogenen Checkbox', () => {
    // Regel 2 fängt die Checkbox/Status-Drift selbst; Regel 15 darf sich nicht
    // darauf verlassen, sonst verdeckt ein zweiter Defekt den ersten.
    const p = pruefeKopfBuchung(['- [ ] **Kopf**', META('W9·DRIFT', 'done'), '  - [ ] **offen**'].join('\n'));
    expect(p).toHaveLength(1);
    expect(p[0].id).toBe('W9·DRIFT');
  });

  it('GRUEN: offener Kopf darf beliebig viele offene Posten tragen — der Normalfall', () => {
    expect(
      pruefeKopfBuchung(
        ['- [ ] **Offener Dach-Schritt**', META('W9·OFFEN', 'ready'), '  - [ ] **A**', '  - [ ] **B**'].join('\n'),
      ),
    ).toHaveLength(0);
  });

  it('GRUEN: erledigter Kopf mit durchweg abgehakten Posten', () => {
    expect(
      pruefeKopfBuchung(['- [x] **Erledigt**', META('W9·SAUBER', 'done'), '  - [x] **A**', '  - [x] **B**'].join('\n')),
    ).toHaveLength(0);
  });

  it('GRUEN: `[~]` (wip) und `[d]` (geparkt) zählen nicht als offener Posten (Zuschnitt c)', () => {
    expect(
      pruefeKopfBuchung(['- [x] **Erledigt**', META('W9·WIP', 'done'), '  - [~] **laufend**', '  - [d] **geparkt**'].join('\n')),
    ).toHaveLength(0);
  });

  it('eine Leerzeile beendet den Block NICHT (CommonMark loose list, Zuschnitt a)', () => {
    const p = pruefeKopfBuchung(
      ['- [x] **Erledigt**', META('W9·LEER', 'done'), '  Prosa.', '', '  - [ ] **trotzdem drunter**'].join('\n'),
    );
    expect(p).toHaveLength(1);
  });

  it('ein neuer Kopf auf Spalte 0 beendet den Block des vorigen', () => {
    const p = pruefeKopfBuchung(
      [
        '- [x] **Erledigt**',
        META('W9·ERSTER', 'done'),
        '- [ ] **Nächster, offener Kopf**',
        META('W9·ZWEITER', 'ready'),
        '  - [ ] **gehört zum zweiten, nicht zum ersten**',
      ].join('\n'),
    );
    expect(p).toHaveLength(0);
  });

  it('eine Überschrift beendet den Block', () => {
    expect(
      pruefeKopfBuchung(
        ['- [x] **Erledigt**', META('W9·HEAD', 'done'), '', '## Nächstes Feld', '', '  - [ ] **dahinter**'].join('\n'),
      ),
    ).toHaveLength(0);
  });

  it('GRENZE 1 (deklariert): hinter dem Feldtrenner `---` wird nicht mehr gesucht', () => {
    // Der 15. Posten des Anlassfalls stand genau dort (Altstand Z. 734). Nach
    // CommonMark beginnt hinter dem Trenner eine neue Liste — der Posten hängt
    // an keinem Schritt mehr; das ist eine eigene Klasse, kein Fall für Regel 15.
    expect(
      pruefeKopfBuchung(
        ['- [x] **Erledigt**', META('W9·TRENNER', 'done'), '', '', '---', '  - [ ] **verwaist hinter dem Trenner**'].join('\n'),
      ),
    ).toHaveLength(0);
  });

  it('GRENZE 2 (deklariert): eingerückte `- [x]`-Unterposten werden nicht als Kopf geprüft', () => {
    const md = [
      '- [ ] **Offener Dach-Schritt**',
      META('W9·TIEF', 'ready'),
      '  - [x] **erledigter Unterposten**',
      '    - [ ] **darunter noch offen**',
    ].join('\n');
    expect(pruefeKopfBuchung(md)).toHaveLength(0);
  });

  it('Einrücktiefe ist egal, solange sie > 0 ist (Zuschnitt b)', () => {
    const p = pruefeKopfBuchung(
      ['- [x] **Erledigt**', META('W9·TIEFE', 'done'), '    - [ ] **vier Leerzeichen**', '\t- [ ] **Tabulator**'].join('\n'),
    );
    expect(p).toHaveLength(2);
  });

  it('leeres Dokument und Dokument ohne Checkboxen bleiben grün', () => {
    expect(pruefeKopfBuchung('')).toHaveLength(0);
    expect(pruefeKopfBuchung('## Nur Prosa\n\nKein Bullet weit und breit.')).toHaveLength(0);
  });
});
