// scripts/analyse/kommentar-bilanz.ts — Kommentar-Bilanz für Fremd-PR-Branches
// (Jules), Regel 3 + Regel 3b des Fremd-PR-Tors (.github/workflows/ci.yml).
//
// VORGESCHICHTE. Regel 3 (Beleg PR #662, 4.9.2026) verglich nur die SUMME der
// Kommentarzeilen vorher/nachher — Jules durfte Kommentare löschen, solange
// die Summe stieg. Wurzel-Fix Regel 3b (Lehre PR #855/#857, 14.9.2026): Jules
// baute nach einer Ablehnung die Summe exakt auf den Ausgangswert zurück
// (580 → 580), vier Kommentarzeilen waren dabei trotzdem verfälscht («hing»
// → «hung», «plötzlich» → «suddenly», «einziges» → «einziger», «ein» →
// «eins») — eine Summen-Bilanz sieht das nicht, weil Zuwachs an anderer
// Stelle den Verlust ausgleicht. PR #857 traf das Tor nur, weil dort 98
// Zeilen GELÖSCHT wurden (Summe sank sichtbar).
//
// REGEL 3 (Summe, unverändert aus dem bisherigen Inline-Schritt extrahiert):
// Kommentar-Startzeilen (`//`, `/*`, `*`) aller gelöschten/geänderten Basis-
// Dateien vs. aller neuen/geänderten Head-Dateien — Summe darf nicht sinken.
//
// REGEL 3b (neu, 14.9.2026): MULTIMENGEN-Vergleich der getrimmten Kommentar-
// zeilen über dieselben Dateilisten. Jede Kommentarzeile der Basis muss im
// Head — über alle betroffenen Dateien hinweg — zeichengleich weiter
// existieren; sort|uniq-c-Äquivalent, jede Zeile deren Häufigkeit im Head
// SINKT ist ein Befund. Verschieben zwischen Dateien ist erlaubt (die Zeile
// taucht irgendwo im Head wieder auf), Ändern/Löschen nicht. Zuwachs ist
// erlaubt. Leerkommentare (blosse Marker ohne Text, z. B. `*`, `/**`, `*/`)
// werden ignoriert — sie sind austauschbares JSDoc-Gerüst, kein Inhalt, und
// häufig genug, dass sie sonst echte Befunde im Rauschen ertränken.
//
// Aufruf: npx vite-node scripts/analyse/kommentar-bilanz.ts <base-ref> <head-ref> [muster...]
//   muster default: 'src/*.ts' 'src/*.tsx' (identisch zum bisherigen Inline-Schritt)
//
// Exit 0: beide Regeln grün. Exit 1: mindestens eine Regel rot. Exit 2: Aufruf-
// oder Ref-Fehler.
//
// Kein `echo` — jede Ausgabe geht über `process.stdout`/`process.stderr`.

import { execFileSync } from 'node:child_process';

export function git(cwd: string, args: string[]): string {
  const buf = execFileSync('git', args, {
    cwd,
    maxBuffer: 1024 * 1024 * 128,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return Buffer.from(buf).toString('utf8');
}

export function refGueltig(cwd: string, ref: string): boolean {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], {
      cwd,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

/** Dateien, die zwischen zwei Refs unter dem gegebenen Diff-Filter (git-Buchstaben,
 *  z. B. "DM" oder "AM") und den gegebenen Pathspec-Mustern geändert wurden. */
export function geaenderteDateien(cwd: string, basis: string, head: string, filter: string, muster: string[]): string[] {
  const roh = git(cwd, ['diff', '--name-only', `--diff-filter=${filter}`, `${basis}..${head}`, '--', ...muster]);
  return roh.split('\n').map((z) => z.trim()).filter(Boolean);
}

/** Inhalt einer Datei bei einem Ref, oder null, wenn sie dort nicht existiert. */
export function inhaltFuerDatei(cwd: string, ref: string, datei: string): string | null {
  try {
    return git(cwd, ['show', `${ref}:${datei}`]);
  } catch {
    return null;
  }
}

const KOMMENTAR_ZEILE = /^\s*(\/\/|\/\*|\*)/;

/** Eine Zeile ist "leer", wenn sie NACH dem Trimmen nur aus dem Kommentar-
 *  Marker besteht, ohne jeden weiteren Text (z. B. Stern, Slash-Stern,
 *  Stern-Slash oder doppelter Slash allein auf der Zeile). */
export function istLeerkommentar(zeileGetrimmt: string): boolean {
  return /^(\/\/|\/\*+|\*\/|\*)$/.test(zeileGetrimmt);
}

/** Regel 3 (Summe): jede Kommentar-Startzeile zählt, auch Leerkommentare —
 *  identisch zur bisherigen Inline-Formel `grep -cE '^\s*(//|/\*|\*)'`. */
export function kommentarZeilenAlle(text: string): string[] {
  return text.split('\n').filter((z) => KOMMENTAR_ZEILE.test(z));
}

/** Regel 3b (Multimenge): getrimmt, Leerkommentare ausgeschlossen. */
export function kommentarZeilenNichtLeer(text: string): string[] {
  return text
    .split('\n')
    .filter((z) => KOMMENTAR_ZEILE.test(z))
    .map((z) => z.trim())
    .filter((z) => !istLeerkommentar(z));
}

/** Regel 3: Summen-Bilanz. `basisDateien`/`kopfDateien` = Dateiname → Inhalt
 *  (oder null, falls die Datei bei diesem Ref nicht existiert). */
export function pruefeSummenBilanz(
  basisDateien: Record<string, string | null>,
  kopfDateien: Record<string, string | null>,
): { ok: boolean; vorher: number; nachher: number } {
  let vorher = 0;
  for (const inhalt of Object.values(basisDateien)) {
    if (inhalt !== null) vorher += kommentarZeilenAlle(inhalt).length;
  }
  let nachher = 0;
  for (const inhalt of Object.values(kopfDateien)) {
    if (inhalt !== null) nachher += kommentarZeilenAlle(inhalt).length;
  }
  return { ok: nachher >= vorher, vorher, nachher };
}

export interface Multimengenbefund {
  zeile: string;
  basisDatei: string;
  anzahlBasis: number;
  anzahlHead: number;
}

/** Regel 3b: Multimengen-Vergleich. Reine Funktion — nimmt Dateiname → Inhalt
 *  (oder null) für Basis- und Head-Seite entgegen, keine Git-Aufrufe. */
export function pruefeMultimenge(
  basisDateien: Record<string, string | null>,
  kopfDateien: Record<string, string | null>,
): Multimengenbefund[] {
  const zaehleBasis = new Map<string, number>();
  const basisDateiFuerZeile = new Map<string, string>();
  for (const [datei, inhalt] of Object.entries(basisDateien)) {
    if (inhalt === null) continue;
    for (const z of kommentarZeilenNichtLeer(inhalt)) {
      zaehleBasis.set(z, (zaehleBasis.get(z) ?? 0) + 1);
      if (!basisDateiFuerZeile.has(z)) basisDateiFuerZeile.set(z, datei);
    }
  }
  const zaehleHead = new Map<string, number>();
  for (const inhalt of Object.values(kopfDateien)) {
    if (inhalt === null) continue;
    for (const z of kommentarZeilenNichtLeer(inhalt)) {
      zaehleHead.set(z, (zaehleHead.get(z) ?? 0) + 1);
    }
  }

  const befunde: Multimengenbefund[] = [];
  for (const [zeile, anzahlBasis] of zaehleBasis) {
    const anzahlHead = zaehleHead.get(zeile) ?? 0;
    if (anzahlHead < anzahlBasis) {
      befunde.push({ zeile, basisDatei: basisDateiFuerZeile.get(zeile) ?? '?', anzahlBasis, anzahlHead });
    }
  }
  befunde.sort((a, b) => (a.basisDatei + a.zeile).localeCompare(b.basisDatei + b.zeile));
  return befunde;
}

/** Führt beide Regeln für ein Ref-Paar in einem echten Git-Repo (`cwd`) aus. */
export function fuehreBilanz(
  cwd: string,
  basisRef: string,
  headRef: string,
  muster: string[],
): { status: 0 | 1; ausgabe: string } {
  const geloeschtOderGeaendert = geaenderteDateien(cwd, basisRef, headRef, 'DM', muster);
  const hinzugefuegtOderGeaendert = geaenderteDateien(cwd, basisRef, headRef, 'AM', muster);

  const basisDateien: Record<string, string | null> = {};
  for (const f of geloeschtOderGeaendert) basisDateien[f] = inhaltFuerDatei(cwd, basisRef, f);
  const kopfDateien: Record<string, string | null> = {};
  for (const f of hinzugefuegtOderGeaendert) kopfDateien[f] = inhaltFuerDatei(cwd, headRef, f);

  const zeilen: string[] = [];
  let status: 0 | 1 = 0;

  const summe = pruefeSummenBilanz(basisDateien, kopfDateien);
  if (!summe.ok) {
    status = 1;
    zeilen.push(
      `Regel 3 (Summe) ROT — Kommentar-Bilanz sinkt (${summe.vorher} → ${summe.nachher} Kommentarzeilen): Kommentare sind Inhalt, verschieben ja, löschen nie.`,
    );
  } else {
    zeilen.push(`Regel 3 (Summe) ok (${summe.vorher} → ${summe.nachher})`);
  }

  const befunde = pruefeMultimenge(basisDateien, kopfDateien);
  if (befunde.length > 0) {
    status = 1;
    zeilen.push(
      `Regel 3b (Multimenge) ROT — ${befunde.length} Kommentarzeile(n) im Head geändert/verschwunden (nicht nur verschoben):`,
    );
    for (const b of befunde.slice(0, 20)) {
      zeilen.push(`  - [${b.basisDatei}] "${b.zeile}" (${b.anzahlBasis}× → ${b.anzahlHead}×)`);
    }
    if (befunde.length > 20) zeilen.push(`  … ${befunde.length - 20} weitere.`);
  } else {
    zeilen.push('Regel 3b (Multimenge) ok — keine Kommentarzeile verloren oder verändert.');
  }

  return { status, ausgabe: zeilen.join('\n') + '\n' };
}

function main(): void {
  const [basisRef, headRef, ...musterArg] = process.argv.slice(2);
  const muster = musterArg.length > 0 ? musterArg : ['src/*.ts', 'src/*.tsx'];
  const cwd = process.cwd();

  if (!basisRef || !headRef) {
    process.stderr.write(
      'Usage: npx vite-node scripts/analyse/kommentar-bilanz.ts <base-ref> <head-ref> [muster..., default: src/*.ts src/*.tsx]\n',
    );
    process.exit(2);
  }

  for (const ref of [basisRef, headRef]) {
    if (!refGueltig(cwd, ref)) {
      process.stderr.write(`kommentar-bilanz: Ref "${ref}" ist ungültig (git rev-parse --verify fehlgeschlagen) — Exit 2.\n`);
      process.exit(2);
    }
  }

  const { status, ausgabe } = fuehreBilanz(cwd, basisRef, headRef, muster);
  process.stdout.write(ausgabe);
  process.exit(status);
}

// CLI-Teil NICHT unter vitest ausführen — der Test importiert die reinen
// Funktionen und `fuehreBilanz`, darf main()/process.exit aber nie als
// Seiteneffekt auslösen (Muster wie scripts/datenhaltung/nachfuehren.ts;
// vite-node setzt VITEST nicht, der CLI-Weg läuft normal — Beleg: unter
// vite-node zeigt process.argv[1] auf das vite-node-Binary, nie auf diese
// Datei, ein Abgleich auf den Dateinamen wäre hier still nie wahr).
if (!process.env.VITEST) {
  main();
}
