// ─── Startseite · die Adresse des aufgeklappten Blatts (W2·29-WERKBANK-START) ──
//
// David 23.9.2026 (Auswahlfragen am Prototyp): die Kachel klappt VOR ORT auf,
// «jede Stufe eine eigene Adresse», «Browser-Zurück = eine Stufe». Die Adresse
// ist die Router-Query `/?blatt=<rubrik>/<stufe…>` — `lib/tabs.tabSchluessel`
// ignoriert sie, der Reiter «/» bleibt EIN Reiter (FAHRPLAN-WERKBANK-UMBAU §5d).
//
// Dieses Modul ist rein (§2/§3): es liest und schreibt nur den Parameter und
// kürzt eine unbekannte Stufe auf den längsten GÜLTIGEN Anfang. Ein
// verstümmelter Deep-Link öffnet damit die nächsthöhere echte Stufe, nie ein
// leeres Blatt und nie eine erfundene (§8).
import { SYSTEMATIK } from './normtext/systematik';
import { KANTONE } from './kantone';
import { KANTON_NAMEN } from '../data/tarif/typen';

/** Die vier Kacheln der Startseite, als Adress-Wort. */
export type BlattRubrik = 'gesetze' | 'rechtsprechung' | 'materialien' | 'werkzeuge';

/** Welche Kacheln schon vor Ort aufklappen. Scheibe S1: nur Gesetze; die
 *  anderen drei führen bis S2/S3 auf ihre Rubrikseite (Fahrplan §5d). */
export const AUFKLAPPBAR: ReadonlySet<BlattRubrik> = new Set<BlattRubrik>(['gesetze']);

export interface BlattOrt {
  rubrik: BlattRubrik;
  /** Stufen unterhalb der Rubrik, z. B. `['bund', '02']` oder `['kantone', 'BS']`. */
  pfad: readonly string[];
}

export const BLATT_PARAM = 'blatt';

/** Die drei Wahlen der Gesetze-Kachel (David 23.9.2026: «Dritte Wahl» für das
 *  internationale Recht). */
type GesetzeEbene = 'bund' | 'kantone' | 'international';
const GESETZE_EBENEN: ReadonlySet<string> = new Set<GesetzeEbene>(['bund', 'kantone', 'international']);
const GEBIET_NR: ReadonlySet<string> = new Set(SYSTEMATIK.map((k) => k.nr));
const KANTON: ReadonlySet<string> = new Set(KANTONE);

/** Längster gültiger Anfang von `pfad` für die Gesetze-Kachel. */
function gesetzePfad(pfad: readonly string[]): string[] {
  const [ebene, zweite] = pfad;
  if (!ebene || !GESETZE_EBENEN.has(ebene)) return [];
  if (ebene === 'bund' && zweite && GEBIET_NR.has(zweite)) return ['bund', zweite];
  if (ebene === 'kantone' && zweite && KANTON.has(zweite)) return ['kantone', zweite];
  return [ebene];
}

/** Liest `?blatt=…`. `null` = Blatt zu (fehlend, leer oder eine Rubrik, die
 *  noch nicht aufklappt). */
export function leseBlatt(wert: string | null | undefined): BlattOrt | null {
  if (!wert) return null;
  const [rubrik, ...rest] = wert.split('/').filter(Boolean);
  if (!rubrik || !AUFKLAPPBAR.has(rubrik as BlattRubrik)) return null;
  const r = rubrik as BlattRubrik;
  return { rubrik: r, pfad: r === 'gesetze' ? gesetzePfad(rest) : [] };
}

/** Schreibt den Parameterwert (ohne `?blatt=`). */
export function schreibeBlatt(ort: BlattOrt): string {
  return [ort.rubrik, ...ort.pfad].join('/');
}

/** Eine Stufe höher; `null`, wenn der Ort schon die Rubrik selbst ist. */
export function elternOrt(ort: BlattOrt): BlattOrt | null {
  return ort.pfad.length ? { rubrik: ort.rubrik, pfad: ort.pfad.slice(0, -1) } : null;
}

export function gleicherOrt(a: BlattOrt | null, b: BlattOrt | null): boolean {
  if (!a || !b) return a === b;
  return schreibeBlatt(a) === schreibeBlatt(b);
}

/** Pfad-Leiste des Blatts unterhalb der Rubrik (Band oben im Blatt). */
export function blattKrumen(ort: BlattOrt): { label: string; ort: BlattOrt }[] {
  if (ort.rubrik !== 'gesetze') return [];
  const [ebene, zweite] = ort.pfad;
  if (!ebene) return [];
  const label = ebene === 'bund' ? 'Bund' : ebene === 'kantone' ? 'Kantone' : 'International';
  const erste = { label, ort: { rubrik: ort.rubrik, pfad: [ebene] } };
  if (!zweite) return [erste];
  const titel = ebene === 'bund'
    ? SYSTEMATIK.find((k) => k.nr === zweite)?.titel ?? zweite
    : KANTON_NAMEN[zweite as keyof typeof KANTON_NAMEN] ?? zweite;
  return [erste, { label: titel, ort: { rubrik: ort.rubrik, pfad: [ebene, zweite] } }];
}
