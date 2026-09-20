// scripts/gegenpruefung/squash-trailer.ts — Verdikt aus dem GitHub-Merge-Queue-
// Squash lesen (QS-MONITOR-ROT, Lauf 35449385978, PR #921, 19.9.2026).
//
// Befund: seit dem Org-Umzug landet main über die GitHub-Merge-Queue (Squash,
// Message = PR_TITLE + PR_BODY). GitHub verändert den PR-Body dabei zweifach:
//   1. Umbruch bei 72 Zeichen — die 'Gegenpruefung:'-Zeile zerfällt in
//      Fortsetzungszeilen OHNE Einzug, der Absatz ist damit für
//      `git log --format=%(trailers:...)` kein Trailer-Block mehr (nicht alle
//      Zeilen haben Trailer-Form).
//   2. Eine Co-Author-Sektion ('\n\n---------\n\nCo-authored-by: ...') wird als
//      LETZTER Absatz angehängt — %(trailers) liest dann nur noch diesen.
// Folge: JEDER Risikopfad-PR scheiterte in der Queue, obwohl Verdikt und
// Register-Zuwachs vorlagen (check-merge-schutz.ts sah 0 Trailer).
//
// Das hier ist KEINE Aufweichung des Schutzes: die drei Form-Regeln
// (VERDIKT/ZUSCHREIBUNG/BEFUNDE, siehe pruefeVerdiktForm) und die
// Register-Bindung in check-merge-schutz.ts bleiben unverändert bestehen.
// Diese Datei erkennt bloss zusätzlich, WELCHER Absatz nach dem GitHub-Umbruch
// noch der ursprüngliche Trailer-Block ist — nur der letzte Absatz VOR einer
// exakt erkannten Co-Author-Sektion zählt; Fliesstext und Fremdformen liefern
// weiterhin [].
//
// Reine Funktionen: kein git, kein fs. check-merge-schutz.ts liest die
// Commit-Nachrichten und reicht sie hier durch.

// ── Absatz-Erkennung / Co-Author-Sektion abschneiden ────────────────────────

const CO_AUTHOR_ZEILE = /^co-authored-by:\s*\S.*$/i;
const STRICH_ZEILE = /^-{5,}$/;

/**
 * Message in Zeilen zerlegen; eine abschliessende Leerzeile (Trailing-\n)
 * zählt nicht als Inhalt. Jede Zeile wird vor dem Vergleich RECHTS getrimmt
 * (Spec-Zusage H2, PR #925 Nachzug): `trimEnd()` entfernt sowohl ein
 * Whitespace-Rest ('   ' als «Leerzeile mit Space») als auch ein
 * abschliessendes CRLF-`\r` — beide Formen verhalten sich damit SYMMETRISCH
 * zur sauberen Eingabe (reines '\n', echte Leerzeile). Ohne das würde eine
 * Leerzeile mit einem Space, oder ein CRLF-Export, an jeder `=== ''`-Prüfung
 * (Absatz-/Co-Author-Grenzen unten) vorbeirutschen und die Erkennung
 * stillschweigend anders behandeln als bei sauberem Input.
 */
function zeilen(text: string): string[] {
  const roh = text.split('\n').map((z) => z.trimEnd());
  if (roh.length > 0 && roh[roh.length - 1] === '') roh.pop();
  return roh;
}

/**
 * Schneidet eine abschliessende GitHub-Co-Author-Sektion ab — in ZWEI Formen
 * (A3-Nachzug, Gegenprüfung 20.9.2026: 6:6 unter den letzten 12
 * Queue-Merges — mit Strich z. B. PR #941/c94967134, ohne Strich z. B.
 * PR #942/d20efde42): Form A: Strichzeile (≥5 Bindestriche), Leerzeile,
 * danach AUSSCHLIESSLICH 'Co-authored-by: …'-Zeilen. Form B (bare, ohne
 * Strich): der Co-Author-Block ist selbst ein eigener, durch eine Leerzeile
 * abgetrennter Abschluss-Absatz, der AUSSCHLIESSLICH aus
 * 'Co-authored-by: …'-Zeilen besteht — ohne diese Form las
 * `leseGegenpruefungAusSquash` bei Form B gar nichts: der (bare)
 * Co-Author-«Absatz» selbst wurde als letzter Absatz genommen, enthält aber
 * nie ein 'Gegenpruefung:'-Wort, und der davorliegende Verdikt-Absatz kam nie
 * zum Zug. Fehlt BEIDE Formen (Fremdzeile zwischen den Co-Author-Zeilen, oder
 * keine trennende Leerzeile), bleibt die Nachricht unverändert — bewusst
 * konservativ, damit nie mehr abgeschnitten wird als exakt dieser
 * GitHub-Anhang.
 */
function schneideCoAuthorAb(eingabe: string[]): string[] {
  let i = eingabe.length - 1;
  let sahCoAuthor = false;
  while (i >= 0 && CO_AUTHOR_ZEILE.test(eingabe[i])) {
    sahCoAuthor = true;
    i--;
  }
  if (!sahCoAuthor) return eingabe; // kein Co-Author-Anhang am Ende
  if (i < 0 || eingabe[i] !== '') return eingabe; // keine Leerzeile davor
  const j = i - 1;
  if (j >= 0 && STRICH_ZEILE.test(eingabe[j])) return eingabe.slice(0, j); // Form A: Strichzeile davor
  return eingabe.slice(0, i); // Form B (bare): Leerzeile reicht, Co-Author ist eigener Absatz
}

/** Ein Trailer-Kopf 'Schluessel: ' — dieselbe Zeichenmenge wie git (alnum + '-'). */
const TRAILER_KOPF = /^[A-Za-z][A-Za-z0-9-]*:\s/;

/** Den letzten (durch Leerzeile abgetrennten) Absatz der Zeilenliste liefern. */
function letzterAbsatz(eingabe: string[]): string[] {
  let ende = eingabe.length;
  while (ende > 0 && eingabe[ende - 1] === '') ende--; // trailing Leerzeilen weg
  let start = ende;
  while (start > 0 && eingabe[start - 1] !== '') start--;
  return eingabe.slice(start, ende);
}

/**
 * Entumbricht einen Absatz: eine Zeile OHNE Trailer-Kopf wird mit einem
 * Leerzeichen an die Vorzeile gehängt (GitHub-72-Zeichen-Umbruch rückgängig
 * machen). Beginnt schon die erste Zeile ohne Trailer-Kopf, ist der Absatz
 * kein Trailer-Block (Fliesstext) — das ruft der Aufrufer separat ab.
 *
 * BEKANNTE AUSWEITUNG (H1, PR #925 Nachzug, bewusst akzeptiert): jede Zeile
 * OHNE Trailer-Kopf wird gefaltet — ein Schlussabsatz, dessen ERSTE Zeile ein
 * 'Wort: '-Muster trägt, darf danach also auch Prosa-Zeilen enthalten und
 * liefert trotzdem ein Verdikt (git selbst verlangt dafür entweder Einrückung
 * oder bricht die Trailer-Erkennung ab >25 % Nicht-Trailer-Zeilen ab — diese
 * Heuristik hier tut das nicht). Warum akzeptiert: der Trailer bleibt ohnehin
 * SELBST-ATTESTIERT (siehe Bindungs-Kommentar in check-merge-schutz.ts) —
 * die eigentliche Bindung ist der Register-Zuwachs, nicht die Formstrenge
 * dieser Faltung. Eine strengere 72-Zeichen-Break-Heuristik scheitert an der
 * echten Fixture (eine umgebrochene Zeile mit nur 31 Zeichen, weil das
 * Folgewort 62 Zeichen lang ist — kein fester Umbruchpunkt). Empirische Basis:
 * n = 2 gemessene Queue-Commits (41ae4ee99, 9b125ce8e). Ändert GitHub die
 * Squash-Form, wird check:merge-schutz wieder ROT (fail-closed, kein stiller
 * Blindflug) statt die neue Form fälschlich zu akzeptieren.
 */
function entumbrich(absatz: string[]): string[] {
  const out: string[] = [];
  for (const z of absatz) {
    if (out.length === 0 || TRAILER_KOPF.test(z)) {
      out.push(z);
    } else {
      out[out.length - 1] = `${out[out.length - 1]} ${z.trim()}`;
    }
  }
  return out;
}

// git matcht %(trailers:key=Gegenpruefung,...) case-insensitiv (empirisch
// geprüft, 19.9.2026: ein Trailer 'gegenpruefung: …' (klein) wurde von
// `git log --format='%(trailers:key=Gegenpruefung,valueonly)'` gefunden) —
// dieselbe Toleranz hier, damit sich das Verhalten nicht verengt.
const GEGENPRUEFUNG_KOPF = /^gegenpruefung:\s*/i;

/**
 * Liest alle 'Gegenpruefung:'-Werte aus einer (Squash-)Commit-Message, auch
 * wenn GitHub sie umgebrochen und um eine Co-Author-Sektion ergänzt hat.
 * Sucht ausschliesslich im letzten Absatz vor einer erkannten Co-Author-
 * Sektion — kein Treffer in früheren Absätzen, keine Suche im Fliesstext.
 */
export function leseGegenpruefungAusSquash(message: string): string[] {
  const ohneCoAuthor = schneideCoAuthorAb(zeilen(message));
  const absatz = letzterAbsatz(ohneCoAuthor);
  if (absatz.length === 0 || !TRAILER_KOPF.test(absatz[0])) return [];

  return entumbrich(absatz)
    .filter((z) => GEGENPRUEFUNG_KOPF.test(z))
    .map((z) => z.replace(GEGENPRUEFUNG_KOPF, '').trim())
    .filter(Boolean);
}

/**
 * Nimmt die Rohausgabe von `git log --format=%B%x00 <bereich>` (mehrere
 * Commit-Messages, NUL-getrennt — Commit-Messages selbst enthalten
 * Leerzeilen, ein einfacher `\n\n`-Split wäre also nicht eindeutig) und
 * liefert alle 'Gegenpruefung:'-Werte aus allen Messages vereint. Reine
 * Stringverarbeitung — das `git log` bleibt Sache des Aufrufers
 * (check-merge-schutz.ts), diese Funktion bekommt nur die fertige Ausgabe.
 */
export function leseGegenpruefungAusRohLog(rohNulGetrennt: string): string[] {
  return rohNulGetrennt
    .split('\0')
    .map((m) => m.replace(/^\n+/, '').replace(/\n+$/, ''))
    .filter(Boolean)
    .flatMap((m) => leseGegenpruefungAusSquash(m));
}

/**
 * Vereinigt die klassischen `%(trailers:key=Gegenpruefung,valueonly)`-Treffer
 * mit den zusätzlichen Squash-Treffern (leseGegenpruefungAusRohLog) und
 * dedupliziert dabei (A1, PR #925 Nachzug, Opus-Gegenprüfung Runde 1): bei
 * normalen (Nicht-Queue-)Commits liefern beide Lesungen denselben Wert — ohne
 * Deduplizierung listet die Rot-Meldung einen Mangel doppelt, und die
 * Grün-Meldung zählt «2 formal taugliche(s) Verdikt(e)» statt der tatsächlich
 * einen. Reihenfolge bleibt STABIL (erster Treffer gewinnt) — reine
 * Funktion, kein git/fs.
 */
export function vereinigeVerdikte(klassisch: string[], ausSquash: string[]): string[] {
  const gesehen = new Set<string>();
  const ergebnis: string[] = [];
  for (const wert of [...klassisch, ...ausSquash]) {
    if (gesehen.has(wert)) continue;
    gesehen.add(wert);
    ergebnis.push(wert);
  }
  return ergebnis;
}

// ── Form-Prüfung des Verdikts (unverändert aus check-merge-schutz.ts hierher
// verschoben, Verhalten byte-gleich — check-merge-schutz.ts importiert von
// hier, damit der Test sie ohne Skript-Nebenwirkungen prüfen kann) ─────────
//
// SABOTAGE-BEFUND 20.7.2026: der alte Filter `!/^n\/a\b/i.test(t)` prüfte nur,
// dass der Wert nicht mit «n/a» beginnt — ein leerer Commit mit Trailer
// `Gegenpruefung: x` machte das Tor GRÜN (F2a: gegen eigene Ladung validiert).
//
// Jetzt braucht das Verdikt eine PRÜFBARE FORM — Verdikt-Wort aus
// geschlossener Menge, Zuschreibung (Modell + Linsen), Befund-Text:
//     bestanden (Opus 4.8, Extraktion/Identitaet) — 13 Stichproben …
// (H3, PR #925 Nachzug: Begründung wörtlich aus Commit 135ec0cba hierher
// zurückgeholt — sie ging beim Verschieben dieser Form-Prüfung aus
// check-merge-schutz.ts in dieses Modul verloren.)
export const VERDIKT = /^(bestanden|behoben)\b/i;
export const ZUSCHREIBUNG = /\(([^)]{5,})\)/; // (Modell, Linsen)
export const BEFUNDE = /[—–-]{1,2}\s*(\S[\s\S]{14,})$/; // — <Befunde>, ≥15 Zeichen

export type VerdiktPruefung =
  | { art: 'na' }
  | { art: 'gueltig' }
  | { art: 'mangel'; grund: string };

/** Prüft die Form eines einzelnen Gegenpruefung-Trailer-Werts. */
export function pruefeVerdiktForm(t: string): VerdiktPruefung {
  if (/^n\/a\b/i.test(t)) return { art: 'na' }; // bewusster n/a-Fall: zählt nie als Verdikt
  if (!VERDIKT.test(t)) {
    return { art: 'mangel', grund: `Verdikt-Wort fehlt (erwartet 'bestanden' oder 'behoben' am Anfang)` };
  }
  const z = ZUSCHREIBUNG.exec(t);
  if (!z || z[1].split(',').filter((s) => s.trim().length >= 2).length < 2) {
    return { art: 'mangel', grund: `Zuschreibung '(<Modell>, <Linsen>)' fehlt oder nennt nicht beides` };
  }
  if (!BEFUNDE.test(t)) {
    return { art: 'mangel', grund: `Befund-Teil nach '—' fehlt oder ist zu kurz (< 15 Zeichen)` };
  }
  return { art: 'gueltig' };
}
