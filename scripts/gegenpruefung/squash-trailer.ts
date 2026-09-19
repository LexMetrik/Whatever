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

/** Message in Zeilen zerlegen; eine abschliessende Leerzeile (Trailing-\n) zählt nicht als Inhalt. */
function zeilen(text: string): string[] {
  const roh = text.split('\n');
  if (roh.length > 0 && roh[roh.length - 1] === '') roh.pop();
  return roh;
}

/**
 * Schneidet eine abschliessende GitHub-Co-Author-Sektion ab — NUR in genau
 * dieser Form: Strichzeile (≥5 Bindestriche), Leerzeile, danach
 * AUSSCHLIESSLICH 'Co-authored-by: …'-Zeilen bis zum Ende der Nachricht.
 * Fehlt die Form (keine Strichzeile, oder eine Fremdzeile steckt zwischen den
 * Co-Author-Zeilen), bleibt die Nachricht unverändert — bewusst konservativ,
 * damit nie mehr abgeschnitten wird als exakt dieser GitHub-Anhang.
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
  if (j < 0 || !STRICH_ZEILE.test(eingabe[j])) return eingabe; // keine Strichzeile davor
  return eingabe.slice(0, j);
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

// ── Form-Prüfung des Verdikts (unverändert aus check-merge-schutz.ts hierher
// verschoben, Verhalten byte-gleich — check-merge-schutz.ts importiert von
// hier, damit der Test sie ohne Skript-Nebenwirkungen prüfen kann) ─────────
//
// SABOTAGE-BEFUND 20.7.2026: der alte Filter `!/^n\/a\b/i.test(t)` prüfte nur,
// dass der Wert nicht mit «n/a» beginnt — ein leerer Commit mit Trailer
// `Gegenpruefung: x` machte das Tor GRÜN (F2a: gegen eigene Ladung validiert).
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
