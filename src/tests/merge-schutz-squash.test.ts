// src/tests/merge-schutz-squash.test.ts — Tor `check:merge-schutz` erkennt das
// Gegenprüfungs-Verdikt auch im GitHub-Merge-Queue-Squash (QS-MONITOR-ROT,
// Lauf 35449385978, PR #921, 19.9.2026). Testet die reinen Funktionen aus
// scripts/gegenpruefung/squash-trailer.ts — kein git, kein fs ausser dem
// einmaligen Fixture-Read.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { leseGegenpruefungAusSquash, pruefeVerdiktForm } from '../../scripts/gegenpruefung/squash-trailer';

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

  it('(iii) Pseudo-Co-Author-Sektion ohne Strichzeile wird NICHT abgeschnitten — der echte Trailer-Absatz davor bleibt verdeckt', () => {
    const message =
      `feat(x): irgendwas\n\n` +
      `Roadmap: X\n` +
      `Gegenpruefung: bestanden (Opus, Test) — dieser echte Trailer-Absatz darf nicht gefunden werden, weil er nicht mehr der letzte ist.\n\n` +
      `Co-authored-by: Claude Sonnet <noreply@anthropic.com>\n`;
    // Ohne Strichzeile davor gilt die Co-Author-Zeile selbst als letzter
    // Absatz (kein Abschneiden) — der davorliegende echte Trailer-Absatz wird
    // nicht durchsucht.
    expect(leseGegenpruefungAusSquash(message)).toEqual([]);
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
