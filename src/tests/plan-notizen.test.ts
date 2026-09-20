// src/tests/plan-notizen.test.ts — reine Zähl-Logik notizenBefund() (§17,
// Session-Notizen-Datei, Weisung David 15.9.2026).
import { describe, expect, it } from 'vitest';
import { notizenBefund, notizenVerzeichnis, notizenZeilen } from '../../scripts/plan/notizen';

describe('notizenBefund', () => {
  it('zählt offene und erledigte Posten getrennt (drei Abschnitte, gemischt)', () => {
    const inhalt = [
      'Session: 2026-09-15 test-slug · Schritt: QS-EFFIZIENZ',
      '',
      '## Nebenfunde (→ ROADMAP-Zeile/Fahrplan, nie nur Chat)',
      '- [ ] Erster offener Nebenfund',
      '- [x] Bereits übernommen',
      '',
      '## Lehren-Kandidaten (Formregel Skill lehren)',
      '- [ ] Noch zu prüfen',
      '',
      '## Wartet auf David',
      '- [x] Entschieden',
    ].join('\n');
    expect(notizenBefund([{ name: '2026-09-15-test-slug.md', inhalt }])).toEqual([
      { name: '2026-09-15-test-slug.md', offen: 2, erledigt: 2 },
    ]);
  });

  it('erkennt eine vollständig abgearbeitete Datei (nur [x], kein [ ])', () => {
    const inhalt = ['## Nebenfunde', '- [x] erledigt eins', '- [x] erledigt zwei'].join('\n');
    const befund = notizenBefund([{ name: 'fertig.md', inhalt }]);
    expect(befund).toEqual([{ name: 'fertig.md', offen: 0, erledigt: 2 }]);
  });

  it('leere Datei / Datei ohne Checkboxen ergibt 0/0', () => {
    const befund = notizenBefund([
      { name: 'leer.md', inhalt: '' },
      { name: 'ohne-checkboxen.md', inhalt: 'Session: 2026-09-15 x\n\nNur Prosa, keine Liste.\n' },
    ]);
    expect(befund).toEqual([
      { name: 'leer.md', offen: 0, erledigt: 0 },
      { name: 'ohne-checkboxen.md', offen: 0, erledigt: 0 },
    ]);
  });

  it('leere Eingabeliste ergibt leere Ausgabeliste', () => {
    expect(notizenBefund([])).toEqual([]);
  });
});

describe('notizenVerzeichnis', () => {
  // Signatur um `cwd` erweitert (Pfad-Bug-Fix 20.9.2026, F17): die alten
  // Fälle deckten nur bereits-absolute git-common-dir-Werte ab (der
  // Worktree-Fall) — das ist eine deklarierte fachliche Änderung, kein
  // Refactoring (§6.3), weil der alte Test das Fehlverhalten im
  // Haupt-Checkout (relativer Wert bleibt ungestrippt) gar nicht prüfte.
  it('leitet den Haupt-Checkout aus einem bereits absoluten git-common-dir ab (Worktree-Fall)', () => {
    expect(notizenVerzeichnis('/Users/david/Developer/LexMetrik/.git', '/irrelevant')).toBe(
      '/Users/david/Developer/LexMetrik/.claude/notizen',
    );
  });

  it('funktioniert gleich, wenn git-common-dir bereits der Haupt-Checkout selbst ist', () => {
    expect(notizenVerzeichnis('/repo/.git', '/irrelevant')).toBe('/repo/.claude/notizen');
  });

  it('löst einen relativen git-common-dir gegen cwd auf (Haupt-Checkout-Fall, Pfad-Bug 20.9.2026)', () => {
    // Reproduziert den Befund: `git rev-parse --git-common-dir` liefert an
    // der Repo-Wurzel des Haupt-Checkouts exakt ".git" (relativ, kein
    // Pfadtrenner davor) — die alte Regex strippte das nicht.
    expect(notizenVerzeichnis('.git', '/Users/david/Developer/LexMetrik')).toBe(
      '/Users/david/Developer/LexMetrik/.claude/notizen',
    );
  });

  it('löst einen relativen git-common-dir mit ../ auf (Unterordner im Haupt-Checkout)', () => {
    expect(notizenVerzeichnis('../.git', '/Users/david/Developer/LexMetrik/scripts')).toBe(
      '/Users/david/Developer/LexMetrik/.claude/notizen',
    );
  });

  it('löst die Worktree-Form auf (git-common-dir zeigt bereits absolut auf das Haupt-.git, nie auf .git/worktrees/<name>)', () => {
    expect(
      notizenVerzeichnis('/Users/david/Developer/LexMetrik/.git', '/Users/david/Developer/LexMetrik-wt-x'),
    ).toBe('/Users/david/Developer/LexMetrik/.claude/notizen');
  });
});

describe('notizenZeilen', () => {
  it('formatiert offene Posten mit Zähler und Übernahme-Hinweis', () => {
    expect(notizenZeilen([{ name: '2026-09-15-x.md', offen: 3, erledigt: 1 }])).toEqual([
      '📝 Session-Notizen: 2026-09-15-x.md — 3 offen · übernehmen oder abarbeiten (Skill bauschritt Station A/E)',
    ]);
  });

  it('formatiert eine abgearbeitete Datei als Lösch-Hinweis', () => {
    expect(notizenZeilen([{ name: '2026-09-14-y.md', offen: 0, erledigt: 2 }])).toEqual([
      '📝 Session-Notizen: 2026-09-14-y.md — abgearbeitet, löschen',
    ]);
  });

  it('leere Befund-Liste ergibt keine Zeile (still, kein Gate-Tor)', () => {
    expect(notizenZeilen([])).toEqual([]);
  });
});
