// Rezidiv-Wache (PS-09/HN-03, 25.9.2026, zweitgeprüft bestätigt).
//
// ANLASS. `scripts/datenhaltung/doppellauf.ts` und `scripts/materialien/
// soft-law-projektion.ts` trugen ein literales NUL-Byte als Feldtrenner in
// einer Hash-/Gruppierungsbildung (`.update(...\x00...)`, `[...].join('\x00')`)
// — geschrieben als rohes Byte statt als Escape-Sequenz. `doppellauf.ts` hatte
// dafür bereits einen Fix («literale NUL-Bytes … durch Escape-Sequenzen
// ersetzt», c754e1c5e), bekam das NUL aber durch eine spätere Änderung
// (54b180daa) zurück — der Mangel ist REZIDIVIEREND, keine Erstauffälligkeit.
//
// WARUM DAS ZÄHLT (§6.7, Skill gegenpruefung). git klassiert eine Datei mit
// einem NUL-Byte in den ersten ~8000 Bytes als BINÄR (`buffer_is_binary`,
// nur dieses Präfix wird gescannt). `git diff`/`git log --numstat` und die
// GitHub-PR-Ansicht zeigen dann «Binary files differ» statt des Inhalts —
// eine Gegenprüfung auf einem Risikopfad (`scripts/datenhaltung/**`,
// `scripts/materialien/**`) kann den geänderten Code gar nicht lesen.
//
// Diese Wache liest alle git-getrackten Quelldateien roh (Bytes, nicht als
// Text) und schlägt fehl, sobald eine ein literales NUL-Byte enthält. Der Fix
// ist stets die Escape-Form (`'\u0000'`) — laufzeitgleich (Beweis: `'\x00' ===
// '\u0000'` ist in JS/TS eine Sprach-Garantie, keine Annahme), aber git-,
// Diff- und Gegenprüfungs-sichtbar.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Dieselben Endungen wie in beiden HN-03-Prüfläufen (Erst-/Zweitprüfer). */
const QUELL_ENDUNGEN = ['.ts', '.tsx', '.mjs', '.js', '.py', '.sh'];

/** Reine Logik (testbar ohne git): welche der übergebenen Dateien tragen ein literales NUL-Byte? */
export function findeDateienMitLiteralemNul(pfade: string[]): string[] {
  const treffer: string[] = [];
  for (const pfad of pfade) {
    let inhalt: Buffer;
    try {
      inhalt = readFileSync(pfad);
    } catch {
      continue; // zwischen Auflistung und Lesen gelöscht/umbenannt — kein Befund dieser Wache
    }
    if (inhalt.includes(0)) treffer.push(pfad);
  }
  return treffer;
}

describe('keine literalen NUL-Bytes in getrackten Quelldateien (PS-09/HN-03)', () => {
  it('git-getrackte .ts/.tsx/.mjs/.js/.py/.sh-Dateien enthalten kein literales NUL-Byte', () => {
    const ausgabe = execFileSync('git', ['ls-files'], { encoding: 'utf8' });
    const dateien = ausgabe.split('\n').filter((f) => f !== '' && QUELL_ENDUNGEN.some((e) => f.endsWith(e)));
    expect(dateien.length).toBeGreaterThan(1000); // Sanity: `git ls-files` lief wirklich, keine leere/kaputte Liste

    const treffer = findeDateienMitLiteralemNul(dateien);
    expect(
      treffer,
      `${treffer.length} Datei(en) mit literalem NUL-Byte — git zeigt sie (ab NUL in den ersten ~8000 ` +
        `Bytes) als Binärdatei, Diff/Gegenprüfung werden dort blind: ${treffer.join(', ')}. ` +
        `Fix: das rohe Byte durch die Escape-Sequenz '\\u0000' ersetzen (laufzeitgleich).`,
    ).toEqual([]);
  });

  // Rot-Beweis der Wache selbst (§6.7: «ein Tor, das nicht scheitern kann, ist
  // gefährlicher als keines») — belegt an einer frischen Fixture, dass die
  // Erkennung eine echte Regression auch wirklich fängt, statt nur zufällig
  // nie auf die Probe gestellt zu werden.
  it('erkennt ein literales NUL-Byte in einer frischen Fixture-Datei', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nul-wache-rotbeweis-'));
    const mitNul = join(dir, 'mit-nul.ts');
    const ohneNul = join(dir, 'ohne-nul.ts');
    writeFileSync(mitNul, Buffer.from("const key = a + '\x00' + b;"));
    writeFileSync(ohneNul, Buffer.from("const key = a + '\\u0000' + b;"));
    try {
      expect(findeDateienMitLiteralemNul([mitNul, ohneNul])).toEqual([mitNul]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
