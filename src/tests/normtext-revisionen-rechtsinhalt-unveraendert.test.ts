// @vitest-environment node
/**
 * LESER-NAV · Änderungen-Reiter (O-26): Rechtsinhalt UNVERÄNDERT (§6, Risikopfad
 * `src/lib/normtext/revisionen.ts`). Die Trennung «keine Datei» / «Abruf gescheitert» und der
 * neue `abgerufen`-Wert dürfen an den ERFOLGREICH geladenen Revisionen nichts ändern: dieselben
 * Einträge, dieselbe Reihenfolge, dieselben Felder.
 *
 * Beweis: für ALLE Sidecars unter `public/normtext/revisionen/` (Bestand per
 * `ls public/normtext/revisionen | wc -l`) liefert `revisionenFuerNorm([key])` genau die
 * Referenz, die hier unabhängig aus der Rohdatei gebildet wird (Dedupe über
 * `revisionSchluessel`, Datum absteigend, dann Art, dann ocUri), Eintrag für Eintrag
 * (Objektgleichheit, nicht nur Zahl) — plus Mehr-Key-Fall und die Stichproben OR / ZGB.
 *
 * Gemessen vor dem Umbau mit der Fassung von origin/main (einmaliger Vergleich, alt gegen neu,
 * alle 231 Sidecars, 6995 Revisionen, Mehr-Key OR+ZGB 219): Objektgleichheit überall.
 *
 * ROT ZU BEKOMMEN (§6.7): in `revisionenFuerNorm` die Sortierung umdrehen oder `dedupe`
 * streichen → Reihenfolge-/Dedupe-Fälle rot.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { revisionenFuerNorm, revisionSchluessel, _leereRevisionenCache, type RevisionBezug } from '../lib/normtext/revisionen';

const VERZ = 'public/normtext/revisionen';
const keys = readdirSync(VERZ).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
const roh = (k: string) => JSON.parse(readFileSync(`${VERZ}/${k}.json`, 'utf8')) as { abgerufen: string; reichweite: string; revisionen: RevisionBezug[] };

/** Referenz: so war die Liste vor dem Umbau definiert (Dedupe, dann Sortierung). */
function referenz(ks: readonly string[]): RevisionBezug[] {
  const seen = new Set<string>();
  const out: RevisionBezug[] = [];
  for (const k of ks) for (const r of roh(k).revisionen) {
    const id = revisionSchluessel(r);
    if (!seen.has(id)) { seen.add(id); out.push(r); }
  }
  return out.sort((a, b) =>
    a.dateEntryInForce !== b.dateEntryInForce ? (a.dateEntryInForce < b.dateEntryInForce ? 1 : -1)
    : a.art !== b.art ? (a.art < b.art ? -1 : 1)
    : (a.ocUri ?? '') < (b.ocUri ?? '') ? -1 : (a.ocUri ?? '') > (b.ocUri ?? '') ? 1 : 0);
}

beforeEach(() => {
  _leereRevisionenCache();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: true, status: 200, headers: { get: () => 'application/json' },
    json: async () => JSON.parse(readFileSync(`public${decodeURIComponent(String(url))}`, 'utf8')),
  }) as unknown as Response));
});
afterEach(() => vi.unstubAllGlobals());

describe('Revisionsliste bei erfolgreichem Laden: unverändert', () => {
  it('Bestand: mindestens 200 Sidecars (Skript-Zählung, kein Schätzwert)', () => {
    expect(keys.length).toBeGreaterThanOrEqual(200);
  });
  it('alle Sidecars: Einträge, Reihenfolge und Felder wie die Referenz aus der Rohdatei', async () => {
    let revisionen = 0;
    for (const k of keys) {
      const a = await revisionenFuerNorm([k]);
      expect(a?.nichtErfasst, k).toBeUndefined();
      expect(a?.revisionen, k).toEqual(referenz([k]));
      expect(a?.reichweite, k).toBe(roh(k).reichweite ?? null);
      revisionen += a?.revisionen.length ?? 0;
    }
    expect(revisionen).toBeGreaterThan(1000);
  });
  it('Stichprobe OR und ZGB: nicht leer, neueste zuerst, jeder Schlüssel einmal', async () => {
    for (const k of ['OR', 'ZGB']) {
      const a = await revisionenFuerNorm([k]);
      expect(a?.revisionen.length, k).toBeGreaterThan(20);
      const daten = a!.revisionen.map((r) => r.dateEntryInForce);
      expect(daten, k).toEqual([...daten].sort().reverse());
      const ids = a!.revisionen.map(revisionSchluessel);
      expect(new Set(ids).size, k).toBe(ids.length);
    }
  });
  it('mehrere Keys (OR + ZGB): vereinigt und dedupliziert wie die Referenz', async () => {
    const a = await revisionenFuerNorm(['OR', 'ZGB']);
    expect(a?.revisionen).toEqual(referenz(['OR', 'ZGB']));
  });
});
