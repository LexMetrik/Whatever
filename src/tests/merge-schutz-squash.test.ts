// src/tests/merge-schutz-squash.test.ts — Tor `check:merge-schutz` erkennt das
// Gegenprüfungs-Verdikt auch im GitHub-Merge-Queue-Squash (QS-MONITOR-ROT,
// Lauf 35449385978, PR #921, 19.9.2026). Testet die reinen Funktionen aus
// scripts/gegenpruefung/squash-trailer.ts — kein git, kein fs ausser dem
// einmaligen Fixture-Read.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { leseGegenpruefungAusSquash, pruefeVerdiktForm, vereinigeVerdikte } from '../../scripts/gegenpruefung/squash-trailer';

const FIXTURE_921 = readFileSync(
  resolve(__dirname, 'fixtures/merge-schutz-squash-921.txt'),
  'utf8',
);

// Echte unumbrochene klassische Form (Commit 135ec0cba, PR #913, 19.9.2026) —
// git log --format=%B, wörtlich.
const MESSAGE_913_KLASSISCH =
  `chore(materialien): BS-Grossrat-Monatslauf 2026-09-18 (#913)\n\n` +
  `Automatischer Monats-Vollabgleich der Basler Grossratsgeschaefte. Inhaltlich folgenlos: reiner Reihenfolge-Tausch zweier Eintraege mit identischem Sortierschluessel (04.8107, GR Beschluss, 2005-01-12); Wurzel (fehlender Tie-Breaker url_dok in bs-materialien-run.ts) folgt als eigener PR unter QS-MONITOR-ROT.\n\n` +
  `Roadmap: QS-MONITOR-ROT\n` +
  `Gegenpruefung: bestanden mit Auflagen (Opus, Vollstaendigkeit/Quellen-Treue/Projektions-Konsistenz) — 441/441 Eintraege multimengen-gleich, beide PDFs gegen data.bs.ch Dataset 100313 belegt (19.9.2026), Projektion ordnungsinvariant; Auflage Tie-Breaker\n` +
  `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>\n`;

describe('leseGegenpruefungAusSquash — echte Fixture #921', () => {
  it('findet genau 1 Wert im umgebrochenen Squash mit Co-Author-Sektion', () => {
    const werte = leseGegenpruefungAusSquash(FIXTURE_921);
    expect(werte).toHaveLength(1);
    expect(werte[0].startsWith('bestanden (Opus,')).toBe(true);
    expect(werte[0]).toContain('3 Hinweise ohne Blocker');
  });

  it('der gefundene Wert besteht die Form-Prüfung', () => {
    const werte = leseGegenpruefungAusSquash(FIXTURE_921);
    expect(pruefeVerdiktForm(werte[0])).toEqual({ art: 'gueltig' });
  });
});

describe('leseGegenpruefungAusSquash — Rot-Proben (§6.7)', () => {
  it('(i) Gegenpruefung-Zeile nur in einem Fliesstext-Absatz ⇒ []', () => {
    const message =
      `feat(x): irgendwas\n\n` +
      `Hier reden wir beilaeufig ueber Gegenpruefung: bestanden (Opus, Test) — das ist nur Prosa, kein Trailer-Block hier.\n\n` +
      `Ein Abschlusssatz ohne jede Trailer-Form.\n`;
    expect(leseGegenpruefungAusSquash(message)).toEqual([]);
  });

  it('(ii) letzter Absatz beginnt mit Prosa-Zeile, enthält danach eine Gegenpruefung-Zeile ⇒ []', () => {
    const message =
      `feat(x): irgendwas\n\n` +
      `Ein Prosa-Satz als erste Zeile des letzten Absatzes.\n` +
      `Gegenpruefung: bestanden (Opus, Test) — kommt zu spaet, der Absatz zaehlt nicht als Trailer-Block.\n`;
    expect(leseGegenpruefungAusSquash(message)).toEqual([]);
  });

  // A3-Nachzug (Gegenprüfung 20.9.2026, «NICHT BESTANDEN»): DEKLARIERTE
  // fachliche Änderung dieses einen Tests (§6.3 — kein stilles Anpassen).
  // Bisher dokumentierte dieser Test die BEHOBENE Lücke selbst als
  // gewolltes Verhalten: GitHub hängt den Co-Author-Absatz empirisch in
  // ZWEI Formen an (6:6 unter den letzten 12 Queue-Merges) — mit
  // `---------`-Trennzeile (PR #941/c94967134) UND bare, ohne Trennzeile
  // (PR #942/d20efde42: `\n\nCo-authored-by: …`). Die bare Form ist exakt
  // die hier konstruierte: ein reiner Co-Author-Absatz, nur durch eine
  // Leerzeile vom echten Trailer-Absatz getrennt. Ohne Fix verschwand ein
  // gültiges Verdikt in dieser Form spurlos — jetzt wird auch ein bare
  // Co-Author-Anhang (AUSSCHLIESSLICH Co-authored-by-Zeilen als eigener
  // Schluss-Absatz) abgeschnitten, der Trailer-Absatz davor wird gefunden.
  it('(iii) bare Co-Author-Absatz (ohne Strichzeile) wird jetzt ABGESCHNITTEN — der echte Trailer-Absatz davor wird gefunden', () => {
    const message =
      `feat(x): irgendwas\n\n` +
      `Roadmap: X\n` +
      `Gegenpruefung: bestanden (Opus, Test) — dieser echte Trailer-Absatz muss trotz bare Co-Author-Anhang gefunden werden.\n\n` +
      `Co-authored-by: Claude Sonnet <noreply@anthropic.com>\n`;
    const werte = leseGegenpruefungAusSquash(message);
    expect(werte).toHaveLength(1);
    expect(werte[0]).toContain('trotz bare Co-Author-Anhang gefunden werden');
  });

  it('(iii) Fremdzeile innerhalb der Co-Author-Sektion verhindert das Abschneiden', () => {
    const message =
      `feat(x): irgendwas\n\n` +
      `Roadmap: X\n` +
      `Gegenpruefung: bestanden (Opus, Test) — dieser echte Trailer-Absatz darf nicht gefunden werden, weil er nicht mehr der letzte ist.\n\n` +
      `---------\n\n` +
      `Reviewed-by: Jemand Fremdes\n` +
      `Co-authored-by: Claude Sonnet <noreply@anthropic.com>\n`;
    expect(leseGegenpruefungAusSquash(message)).toEqual([]);
  });

  it('(iv) Message ohne jeden Trailer-Block ⇒ []', () => {
    const message = `feat(x): irgendwas\n\nNur ein Fliesstext-Absatz ohne jede Trailer-Form am Ende.\n`;
    expect(leseGegenpruefungAusSquash(message)).toEqual([]);
  });

  it('(v) unumbrochene klassische Form (Commit 135ec0cba, #913) ⇒ Wert vorhanden', () => {
    const werte = leseGegenpruefungAusSquash(MESSAGE_913_KLASSISCH);
    expect(werte).toHaveLength(1);
    expect(werte[0].startsWith('bestanden mit Auflagen (Opus,')).toBe(true);
  });

  it('(vi) entumbrochener Wert erfüllt die Form-Regeln nicht ⇒ pruefeVerdiktForm rot', () => {
    const message =
      `feat(x): irgendwas\n\n` +
      `Roadmap: X\n` +
      `Gegenpruefung: x\n`;
    const werte = leseGegenpruefungAusSquash(message);
    expect(werte).toEqual(['x']);
    const pruefung = pruefeVerdiktForm(werte[0]);
    expect(pruefung.art).toBe('mangel');
  });
});

describe('pruefeVerdiktForm — Grenzfälle (unverändert aus check-merge-schutz.ts übernommen)', () => {
  it('n/a zählt nie als Verdikt', () => {
    expect(pruefeVerdiktForm('n/a — reine Prüflogik')).toEqual({ art: 'na' });
  });

  it('fehlendes Verdikt-Wort ⇒ mangel', () => {
    const p = pruefeVerdiktForm('irgendwas (Opus, Test) — 15 Zeichen Befund hier');
    expect(p.art).toBe('mangel');
  });

  it('fehlende Zuschreibung ⇒ mangel', () => {
    const p = pruefeVerdiktForm('bestanden — 15 Zeichen Befund hier ohne Klammer');
    expect(p.art).toBe('mangel');
  });

  it('gültige Form ⇒ gueltig', () => {
    const p = pruefeVerdiktForm(
      'bestanden (Opus 4.8, Extraktion/Identitaet) — 13 Stichproben blind gegen die Amtsquelle re-deriviert.',
    );
    expect(p).toEqual({ art: 'gueltig' });
  });
});

// ── A1 (PR #925 Nachzug, Opus-Gegenprüfung Runde 1) ─────────────────────────
// Vereinigung der klassischen %(trailers)-Treffer mit den Squash-Treffern
// dedupliziert nicht: bei einem normalen (Nicht-Queue-)Commit finden beide
// Lesungen denselben Wert, die Rot-Meldung listete den Mangel doppelt, die
// Grün-Meldung zählte «2 formal taugliche(s) Verdikt(e)» statt 1.
describe('vereinigeVerdikte — Deduplizierung (A1)', () => {
  it('gleicher Wert aus beiden Quellen ⇒ Länge 1', () => {
    const wert = 'bestanden (Opus, Test) — derselbe Wert aus beiden Lesungen, 15+ Zeichen';
    expect(vereinigeVerdikte([wert], [wert])).toEqual([wert]);
  });

  it('verschiedene Werte ⇒ beide, stabile Reihenfolge (erster Treffer gewinnt)', () => {
    const a = 'bestanden (Opus, Test) — Wert A mit genug Zeichen fuer die Form';
    const b = 'behoben (Sonnet, Test) — Wert B mit genug Zeichen fuer die Form';
    expect(vereinigeVerdikte([a], [b])).toEqual([a, b]);
    expect(vereinigeVerdikte([b], [a])).toEqual([b, a]);
  });

  it('mehrfache Duplikate über beide Quellen verteilt ⇒ jeder Wert genau einmal, Reihenfolge stabil', () => {
    const a = 'bestanden (Opus, Test) — Wert A mit genug Zeichen fuer die Form';
    const b = 'behoben (Sonnet, Test) — Wert B mit genug Zeichen fuer die Form';
    expect(vereinigeVerdikte([a, b], [a, b])).toEqual([a, b]);
  });
});

// ── M3 (Mutationsprobe): STRICH_ZEILE-Bedingung in schneideCoAuthorAb ───────
// Ohne diese Bedingung würde jede Zeile unmittelbar vor einer Leerzeile+
// Co-Author-Sektion als Schnittpunkt behandelt — auch wenn dort keine
// Strichzeile steht, sondern echter Inhalt (hier: ein Prosa-Absatz statt der
// GitHub-Strichzeile). Der bestehende Test (iii) "ohne Strichzeile" deckt
// diesen Fall NICHT: dort liefern Original und Mutant zufällig dasselbe
// Ergebnis ([]), weil der freigelegte Absatz ohnehin kein 'Gegenpruefung:'
// trägt. Diese Probe legt einen ECHTEN Trailer-Absatz frei, sobald die
// Strichzeilen-Prüfung fehlt — Original muss [] liefern, ein Mutant ohne die
// Bedingung liefert den (fälschlich freigelegten) Wert.
describe('leseGegenpruefungAusSquash — Mutationsprobe M3 (STRICH_ZEILE)', () => {
  it('echter Trailer-Absatz, danach Prosa (statt Strichzeile), danach Co-Author ⇒ [] (Original bleibt konservativ)', () => {
    const message =
      `feat(x): irgendwas\n\n` +
      `Roadmap: X\n` +
      `Gegenpruefung: bestanden (Opus, Test) — echter Trailer-Absatz vor Prosa statt Strichzeile, darf nicht durchsickern.\n\n` +
      `Prosa.\n\n` +
      `Co-authored-by: Claude Sonnet <noreply@anthropic.com>\n`;
    // Ohne STRICH_ZEILE-Pruefung würde schneideCoAuthorAb bei 'Prosa.' statt
    // einer Strichzeile trotzdem schneiden und den Gegenpruefung-Absatz als
    // neuen letzten Absatz freilegen (Mutanten-Beleg: siehe Bau-Bericht,
    // lokal rot gezeigt und zurückgenommen). Original: konservativ [].
    expect(leseGegenpruefungAusSquash(message)).toEqual([]);
  });
});

// ── M4 (Mutationsprobe): BEFUNDE-Regel in pruefeVerdiktForm ─────────────────
describe('pruefeVerdiktForm — Mutationsprobe M4 (BEFUNDE-Regel)', () => {
  it("'kurz' als Befund-Teil ⇒ mangel mit Befund-Teil-Grund", () => {
    const p = pruefeVerdiktForm('bestanden (Opus, Linsen) — kurz');
    expect(p.art).toBe('mangel');
    if (p.art === 'mangel') {
      expect(p.grund).toMatch(/Befund-Teil/);
    }
  });

  it('Grenzwert 15 Zeichen Befund-Teil ⇒ gueltig', () => {
    const p = pruefeVerdiktForm('bestanden (Opus, Linsen) — ' + 'X'.repeat(15));
    expect(p).toEqual({ art: 'gueltig' });
  });

  it('Grenzwert 14 Zeichen Befund-Teil ⇒ mangel', () => {
    const p = pruefeVerdiktForm('bestanden (Opus, Linsen) — ' + 'X'.repeat(14));
    expect(p.art).toBe('mangel');
  });
});

// ── H2 (Spec-Zusage): trailing Whitespace und CRLF symmetrisch ──────────────
describe('leseGegenpruefungAusSquash — H2 CRLF/Whitespace-Symmetrie', () => {
  it('CRLF-Variante der echten Fixture #921 liefert denselben Wert wie LF', () => {
    const crlf = FIXTURE_921.replace(/\n/g, '\r\n');
    const lf = leseGegenpruefungAusSquash(FIXTURE_921);
    const mitCrlf = leseGegenpruefungAusSquash(crlf);
    expect(mitCrlf).toEqual(lf);
    expect(mitCrlf).toHaveLength(1);
  });

  it('CRLF-Variante der klassischen Form (#913) liefert denselben Wert wie LF', () => {
    const crlf = MESSAGE_913_KLASSISCH.replace(/\n/g, '\r\n');
    expect(leseGegenpruefungAusSquash(crlf)).toEqual(leseGegenpruefungAusSquash(MESSAGE_913_KLASSISCH));
  });

  it('«Leerzeile» mit einem Space verhält sich wie eine echte Leerzeile (Absatzgrenze)', () => {
    const ohneSpace =
      `feat(x): irgendwas\n\n` +
      `Gegenpruefung: bestanden (Opus, Test) — 15+ Zeichen Befund fuer den Vergleich.\n`;
    const mitSpace =
      `feat(x): irgendwas\n \n` +
      `Gegenpruefung: bestanden (Opus, Test) — 15+ Zeichen Befund fuer den Vergleich.\n`;
    expect(leseGegenpruefungAusSquash(mitSpace)).toEqual(leseGegenpruefungAusSquash(ohneSpace));
  });

  it('«Leerzeile» mit Space vor der Co-Author-Sektion verhält sich wie eine echte Leerzeile', () => {
    const ohneSpace =
      `feat(x): irgendwas\n\n` +
      `Roadmap: X\n` +
      `Gegenpruefung: bestanden (Opus, Test) — 15+ Zeichen Befund fuer den Vergleich.\n\n` +
      `---------\n\n` +
      `Co-authored-by: Claude Sonnet <noreply@anthropic.com>\n`;
    const mitSpace = ohneSpace.replace('---------\n\nCo-authored-by', '---------\n \nCo-authored-by');
    expect(leseGegenpruefungAusSquash(mitSpace)).toEqual(leseGegenpruefungAusSquash(ohneSpace));
    expect(leseGegenpruefungAusSquash(ohneSpace)).toHaveLength(1);
  });

  it('bestehende Rot-Proben bleiben rot (H2 macht keine grün) — Fliesstext-Absatz', () => {
    const message =
      `feat(x): irgendwas\n\n` +
      `Hier reden wir beilaeufig ueber Gegenpruefung: bestanden (Opus, Test) — das ist nur Prosa, kein Trailer-Block hier.\n\n` +
      `Ein Abschlusssatz ohne jede Trailer-Form.\n`;
    expect(leseGegenpruefungAusSquash(message)).toEqual([]);
  });

  it('bestehende Rot-Proben bleiben rot (H2 macht keine grün) — Fremdzeile in Co-Author-Sektion', () => {
    const message =
      `feat(x): irgendwas\n\n` +
      `Roadmap: X\n` +
      `Gegenpruefung: bestanden (Opus, Test) — dieser echte Trailer-Absatz darf nicht gefunden werden, weil er nicht mehr der letzte ist.\n\n` +
      `---------\n\n` +
      `Reviewed-by: Jemand Fremdes\n` +
      `Co-authored-by: Claude Sonnet <noreply@anthropic.com>\n`;
    expect(leseGegenpruefungAusSquash(message)).toEqual([]);
  });
});
