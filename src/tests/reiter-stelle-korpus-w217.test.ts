import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import register from '../../public/normtext/register.json';
import { reiterKurzformTeile } from '../lib/tabs';
import { reiterStelle, stelleBrauchtDaten, type StelleDaten } from '../lib/reiterStelle';
import { erlassPfad } from '../lib/normtext/erlassAdresse';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { StrukturMap } from '../lib/normtext/browse';
import type { VerlaufManifeste } from '../lib/verlaufLabel';

// ─── W2·17-UI-BEFUNDE · DFG-F01 · KORPUS-TEST DER REITER-BESCHRIFTUNG ────────
//
// Der Reiter nennt die gelesene Stelle («Art. 336c OR»). Er bildete sie aus dem
// ANKER-TOKEN im Hash statt aus dem amtlichen Label des Eintrags («Art. 4950»,
// «Art. scopeu1», «Art. annex1», «Art. 4» in einem §-Erlass, «Art. 12 ZGB» für
// Art. 12 SchlT ZGB). Dieser Test erzeugt die Beschriftung für JEDEN Eintrag
// JEDES Bund- und Kanton-Erlasses aus JEDEM Token — über dieselbe Funktion, die
// die Leiste ruft (`reiterKurzformTeile`) — und misst sie am amtlichen Label.
//
// QUELLE DER WAHRHEIT: `public/normtext/<datei>` — `artikel` (Token) und
// `artikelLabel` (das, was der Leser zeigt), dazu das Struktur-Sidecar für die
// Gliederung der Übergangsgruppen. Nichts davon ist hier nachgebaut.
//
// BEKANNTE DATENAUSNAHME (Nebenfund, nicht Gegenstand dieses Fixes): im
// PatG-Snapshot tragen drei Bereichs-Einträge Token UND Label ohne Trenner
// («Art. 8790» statt «Art. 87–90», Quelle: U+2212 im amtlichen Text). Der
// Reiter zeigt, was der Leser zeigt — der Fehler gehört in die Daten
// (Korpus-Werkstatt), nicht in die Beschriftung.
const PATG_DATENFEHLER = ['8790', '96101', '104106'] as const;

const ROH = /scope|annex|decl_|disp_|_/;

type Roh = { artikel: string; artikelLabel: string };
const eintraegeVon = (datei: string): Roh[] =>
  (JSON.parse(readFileSync(join('public/normtext', datei), 'utf8')) as { eintraege: Roh[] }).eintraege;
const strukturVon = (ebene: string, key: string): StrukturMap | null => {
  try {
    return (JSON.parse(readFileSync(join('public/normtext/struktur', ebene, `${key}.json`), 'utf8')) as {
      artikel?: StrukturMap;
    }).artikel ?? null;
  } catch {
    return null;
  }
};

const erlasse = (register.erlasse as unknown as BrowseErlass[]).filter(
  (e) => e.datei && (e.ebene === 'bund' || e.ebene === 'kanton') && e.kuerzel,
);

interface Abw { erlass: string; token: string; label: string; stelle: string; kern: string; grund: string }

/** Die zwei Wege zur Beschriftung: die Auflösung selbst und die Leiste, die sie ruft. */
type Weg = 'aufloesung' | 'leiste';

/** Prüft alle Einträge eines Erlasses; `mitDaten=false` ist der Start aus dem Speicher. */
function pruefe(e: BrowseErlass, mitDaten: boolean, abw: Abw[], weg: Weg): number {
  const eintraege = eintraegeVon(e.datei!);
  const struktur = eintraege.some((x) => x.artikel.startsWith('disp_')) ? strukturVon(e.ebene, e.key) : null;
  const daten: StelleDaten = { eintraege, struktur };
  const m: VerlaufManifeste = {
    gesetze: { erlasse: [e] } as never,
    ...(mitDaten ? { artikel: { [e.key]: daten } } : {}),
  };
  for (const x of eintraege) {
    const t = { path: `${erlassPfad(e)}#art-${encodeURIComponent(x.artikel)}` };
    const { stelle, kern } = weg === 'leiste'
      ? reiterKurzformTeile(t, m)
      : reiterStelle(`#art-${x.artikel}`, e.kuerzel, e.ebene, mitDaten ? daten : null) ?? { stelle: '', kern: e.kuerzel };
    const z = stelle ?? '';
    const melde = (grund: string) => abw.push({ erlass: e.key, token: x.artikel, label: x.artikelLabel, stelle: z, kern, grund });
    const zusatz = kern.startsWith(e.kuerzel) ? kern.slice(e.kuerzel.length) : kern;
    if (ROH.test(z) || ROH.test(zusatz)) melde('Rohschlüssel in der Beschriftung');
    if (!mitDaten) {
      // Rückfall: nie etwas anderes als der Eintrag sagt. Eine nicht-leere Stelle
      // muss Stelle UND Kern des Ergebnisses MIT Daten treffen (dann braucht der
      // Reiter die Datei nicht, `stelleBrauchtDaten` = false); sonst bleibt sie
      // leer und das Kürzel unqualifiziert («lieber kürzer als falsch»).
      const anker = `#art-${x.artikel}`;
      const mit = reiterStelle(anker, e.kuerzel, e.ebene, daten)!;
      if (z) {
        if (z !== mit.stelle || kern !== mit.kern) melde('Rückfall ≠ Ergebnis mit Daten');
        if (stelleBrauchtDaten(anker, e.ebene, e.kuerzel)) melde('Rückfall ohne Bedarf an Daten, Bedarf gemeldet');
      } else {
        if (kern !== e.kuerzel) melde('leere Stelle, aber qualifiziertes Kürzel');
        if (!stelleBrauchtDaten(anker, e.ebene, e.kuerzel)) melde('leere Stelle, aber kein Bedarf an Daten gemeldet');
      }
      continue;
    }
    const kurz = z.endsWith('…') ? z.slice(0, -1) : null;
    const passt = z === x.artikelLabel
      || (kurz !== null && x.artikelLabel.startsWith(kurz))
      // «Geltungsbereich am 16. September 2022» → «Geltungsbereich» (Datum = Stand der Liste)
      || (z === 'Geltungsbereich' && x.artikelLabel.startsWith('Geltungsbereich'));
    if (!passt) melde('Stelle ≠ amtliches Label');
    if (x.artikelLabel.startsWith('§') && !z.startsWith('§')) melde('§-Erlass ohne «§»');
    if (x.artikelLabel.startsWith('Art.') && !z.startsWith('Art.')) melde('Art.-Erlass ohne «Art.»');
    if (/^\d+_\d+$/.test(x.artikel) && !/[–-]/.test(z)) melde('Bereich ohne Trenner');
  }
  return eintraege.length;
}

describe.each<[string, Weg]>([
  ['Auflösung (reiterStelle)', 'aufloesung'],
  ['Leiste (reiterKurzformTeile)', 'leiste'],
])('DFG-F01 · Reiter-Beschriftung am ganzen Korpus · %s', (_name, weg) => {
  it('mit geladenen Daten: jede Stelle ist das amtliche Label (Bund + Kanton, alle Token)', () => {
    const abw: Abw[] = [];
    let n = 0;
    for (const e of erlasse) n += pruefe(e, true, abw, weg);
    expect(n).toBeGreaterThan(60000);
    const gruende = new Map<string, number>();
    for (const a of abw) gruende.set(a.grund, (gruende.get(a.grund) ?? 0) + 1);
    const proGrund = [...gruende].map(([g, n]) => `${g}: ${n}`);
    expect(abw.slice(0, 12), `${new Set(abw.map((a) => `${a.erlass}#${a.token}`)).size} Einträge mit Abweichung von ${n} (${abw.length} Funde: ${proGrund.join('; ')})`).toEqual([]);
  }, 120_000);

  it('ohne Daten (Start aus dem Speicher): nie ein Rohschlüssel, Rückfall nur, wo der Token genügt', () => {
    const abw: Abw[] = [];
    for (const e of erlasse) pruefe(e, false, abw, weg);
    expect(abw.slice(0, 12), `${new Set(abw.map((a) => `${a.erlass}#${a.token}`)).size} Einträge mit Abweichung im Rückfall (${abw.length} Funde)`).toEqual([]);
  }, 120_000);
});

describe('DFG-F01 · bekannte Datenausnahme', () => {
  it('Datenausnahme PatG: die drei Bereichs-Labels sind selbst ohne Trenner — der Reiter zeigt sie wie der Leser', () => {
    const e = erlasse.find((x) => x.key.toUpperCase() === 'PATG')!;
    const eintraege = eintraegeVon(e.datei!);
    for (const tok of PATG_DATENFEHLER) {
      const x = eintraege.find((y) => y.artikel === tok);
      // Wird der Datenfehler behoben, wird dieser Fall rot: dann die Ausnahme streichen.
      expect(x?.artikelLabel, `PatG ${tok}`).toBe(`Art. ${tok}`);
      const { stelle } = reiterKurzformTeile(
        { path: `${erlassPfad(e)}#art-${tok}` },
        { gesetze: { erlasse: [e] } as never, artikel: { [e.key]: { eintraege, struktur: null } } },
      );
      expect(stelle).toBe(`Art. ${tok}`);
    }
  });
});
