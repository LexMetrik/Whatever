/**
 * HN-04 Auflage 3 (QS-KORPUS, 25.9.2026) — Daten-Invariante «Snapshot-`erlass`
 * = Register-Kürzel» über ALLE Bund-Snapshots `public/normtext/bund/*.json`.
 *
 * ANLASS. Gegenprüfung HN-04, Befund B3: Die Mutation M2 (Aufrufstelle in
 * `scripts/normtext-snapshot.ts` zurück auf `const erlass = gesetzKey;`) blieb
 * grün — kein Tor prüfte auf Datenebene, dass das angezeigte Kürzel aus dem
 * Register kommt. Der Golden-sha deckt `erlass` nicht ab (er hasht nur Blocktext
 * und Items), der Doppellauf prüft nur «Projektion == committet».
 *
 * Diese Prüfung liest die committeten Dateien, nicht den Generator: ein
 * Generator-Fehler, der ein falsches Kürzel schreibt, wird rot, sobald seine
 * Ausgabe committet ist; eine Hand-Korrektur an einer JSON-Datei vorbei am
 * Register (§5) ebenso.
 *
 * ROT-BEWEIS (§6.7): M2 eingebaut, `npm run normtext -- --nur=bund --erlass=DESG
 * --datum=2026-09-25` gefahren ⇒ dieser Test rot mit «DESG: erlass "DESG" ≠
 * Register-Kürzel "DesG"»; Mutation und Datei danach zurückgesetzt (Bau-Bericht
 * HN-04-Auflagen).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { ERLASS_REGISTER } from '../lib/normtext/register';

const BUND_DIR = 'public/normtext/bund';

interface Eintrag { id: string; quelle: string; erlass: string }

const registerKuerzel = new Map(
  ERLASS_REGISTER.filter((e) => e.ebene === 'bund').map((e) => [e.key, e.kuerzel] as const),
);

const dateien = readdirSync(BUND_DIR).filter((f) => f.endsWith('.json')).sort();

describe('HN-04: Bund-Snapshots tragen im Feld `erlass` das Register-Kürzel', () => {
  it('die Prüfung ist nicht leer (Bestand ≥ 200 Bund-Dateien)', () => {
    expect(dateien.length).toBeGreaterThanOrEqual(200);
  });

  it('jede Bund-Datei: jeder Eintrag hat erlass = Register-Kürzel ihres Schlüssels', () => {
    const fehler: string[] = [];
    let eintraegeGeprueft = 0;
    for (const datei of dateien) {
      const key = datei.slice(0, -'.json'.length);
      const soll = registerKuerzel.get(key);
      if (soll === undefined) {
        fehler.push(`${key}: kein Bund-Eintrag im ERLASS_REGISTER`);
        continue;
      }
      const { eintraege } = JSON.parse(readFileSync(`${BUND_DIR}/${datei}`, 'utf8')) as { eintraege: Eintrag[] };
      for (const e of eintraege) {
        eintraegeGeprueft++;
        if (e.quelle !== key) fehler.push(`${e.id}: quelle "${e.quelle}" ≠ Dateischlüssel "${key}"`);
        if (e.erlass !== soll) {
          fehler.push(`${key}: erlass "${e.erlass}" ≠ Register-Kürzel "${soll}" (${e.id})`);
          break; // eine Meldung je Datei genügt
        }
      }
    }
    expect(eintraegeGeprueft).toBeGreaterThan(0);
    expect(fehler).toEqual([]);
  });
});
