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
 * HN-04-Auflagen). Vollständigkeit (Delta-Gegenprüfung H1): WAG.json
 * vorübergehend entfernt ⇒ rot mit fehlendem «WAG»; zurückgesetzt.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { ERLASS_REGISTER } from '../lib/normtext/register';
import { parseFedlexCacheEintraege } from '../../scripts/normtext/inventar-bund';

const BUND_DIR = 'public/normtext/bund';

interface Eintrag { id: string; quelle: string; erlass: string }

const registerKuerzel = new Map(
  ERLASS_REGISTER.filter((e) => e.ebene === 'bund').map((e) => [e.key, e.kuerzel] as const),
);

const dateien = readdirSync(BUND_DIR).filter((f) => f.endsWith('.json')).sort();

// Generator-Eingabe: jede Zeile in scripts/fedlex-cache.sh erzeugt genau eine
// Bund-Datei (normtext-snapshot.ts, Bund-Schleife). Register-Bund-Einträge ohne
// Fedlex-Pin (EU-/Staatsvertragsrecht ohne Filestore-Volltext) haben bewusst
// keine Datei — sichtbar festgehalten statt still (§6.7).
const cacheSchluessel = parseFedlexCacheEintraege(readFileSync('scripts/fedlex-cache.sh', 'utf8'))
  .map((e) => e.name.toUpperCase())
  .sort();
const REGISTER_BUND_OHNE_DATEI = ['BRUESSEL_IA', 'DMA', 'DSA', 'DSGVO', 'KI_VO', 'MICA', 'NYUE', 'PRHG', 'ROM_I', 'ROM_II'];

describe('HN-04: Bund-Snapshots tragen im Feld `erlass` das Register-Kürzel', () => {
  it('Vollständigkeit: Dateien = fedlex-cache.sh-Einträge, Register-Bund = Dateien + deklarierte Ausnahmen', () => {
    const schluessel = dateien.map((f) => f.slice(0, -'.json'.length)).sort();
    expect(schluessel).toEqual(cacheSchluessel);
    const ohneDatei = [...registerKuerzel.keys()].filter((k) => !schluessel.includes(k)).sort();
    expect(ohneDatei).toEqual(REGISTER_BUND_OHNE_DATEI);
    expect(registerKuerzel.size).toBe(schluessel.length + REGISTER_BUND_OHNE_DATEI.length);
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
