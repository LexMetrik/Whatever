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
import { INTERNATIONAL_GRUPPEN } from './normtext/international-rubriken';

/** Die vier Kacheln der Startseite, als Adress-Wort. */
export type BlattRubrik = 'gesetze' | 'rechtsprechung' | 'materialien' | 'werkzeuge';

/** Welche Kacheln vor Ort aufklappen — seit S3 alle vier. S1: Gesetze;
 *  S2 (23.9.2026): Werkzeuge; S3 (23./24.9.2026): Materialien UND
 *  Rechtsprechung — sofort Suche, keine Unterstufen. Rechtsprechung war
 *  zunächst zurückgestellt (§15-Messwert, s. Fahrplan §5d S3-Nachtrag): das
 *  Register ist 9,4 MB/775 KB gzip, mehr als das Sechsfache der 1,5-MB-
 *  Register von Materialien/Gesetze. ENTSCHEID DAVID 23.9.2026 (Auswahlfrage):
 *  «Beim Öffnen laden» (Option a) — das Register lädt über denselben Lader
 *  wie `/rechtsprechung` (`ladeEntscheidManifest`) erst beim Mounten des
 *  Blatts, nie auf «/» (Herleitung in `components/start/
 *  RechtsprechungBlatt.tsx`). */
export const AUFKLAPPBAR: ReadonlySet<BlattRubrik> = new Set<BlattRubrik>(['gesetze', 'werkzeuge', 'materialien', 'rechtsprechung']);

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
/** START-UEBERARBEITUNG U1 (David 24.9.2026, «Drei hohe Spalten»): die
 *  International-Spalte der Wahl führt direkt in EINE Rubrik — eigene Stufe
 *  `international/<gruppenId>`, gleiche Quelle wie die Sektions-ids auf
 *  /gesetze (`lib/normtext/international-rubriken.ts`, §5). */
const INTL_GRUPPE: ReadonlySet<string> = new Set(INTERNATIONAL_GRUPPEN.map((g) => g.id));

/** Längster gültiger Anfang von `pfad` für die Gesetze-Kachel. */
function gesetzePfad(pfad: readonly string[]): string[] {
  const [ebene, zweite] = pfad;
  if (!ebene || !GESETZE_EBENEN.has(ebene)) return [];
  if (ebene === 'bund' && zweite && GEBIET_NR.has(zweite)) return ['bund', zweite];
  if (ebene === 'kantone' && zweite && KANTON.has(zweite)) return ['kantone', zweite];
  if (ebene === 'international' && zweite && INTL_GRUPPE.has(zweite)) return ['international', zweite];
  return [ebene];
}

/** Die zwei Wahlen der Werkzeuge-Kachel (S2 23.9.2026): Rechner | Vorlagen,
 *  jeweils eine Liste — keine weitere Tiefe (die letzte Stufe ist die
 *  bestehende Produktseite, ein gewöhnlicher Link, keine eigene Blatt-Stufe). */
type WerkzeugeZweig = 'rechner' | 'vorlagen';
const WERKZEUGE_ZWEIGE: ReadonlySet<string> = new Set<WerkzeugeZweig>(['rechner', 'vorlagen']);

/** Längster gültiger Anfang von `pfad` für die Werkzeuge-Kachel. */
function werkzeugePfad(pfad: readonly string[]): string[] {
  const [zweig] = pfad;
  return zweig && WERKZEUGE_ZWEIGE.has(zweig) ? [zweig] : [];
}

/** Liest `?blatt=…`. `null` = Blatt zu (fehlend, leer oder eine Rubrik, die
 *  noch nicht aufklappt). */
export function leseBlatt(wert: string | null | undefined): BlattOrt | null {
  if (!wert) return null;
  const [rubrik, ...rest] = wert.split('/').filter(Boolean);
  if (!rubrik || !AUFKLAPPBAR.has(rubrik as BlattRubrik)) return null;
  const r = rubrik as BlattRubrik;
  const pfad = r === 'gesetze' ? gesetzePfad(rest) : r === 'werkzeuge' ? werkzeugePfad(rest) : [];
  return { rubrik: r, pfad };
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
  if (ort.rubrik === 'werkzeuge') {
    const [zweig] = ort.pfad;
    if (!zweig) return [];
    const label = zweig === 'rechner' ? 'Rechner' : 'Vorlagen';
    return [{ label, ort: { rubrik: ort.rubrik, pfad: [zweig] } }];
  }
  if (ort.rubrik !== 'gesetze') return [];
  const [ebene, zweite] = ort.pfad;
  if (!ebene) return [];
  const label = ebene === 'bund' ? 'Bund' : ebene === 'kantone' ? 'Kantone' : 'International';
  const erste = { label, ort: { rubrik: ort.rubrik, pfad: [ebene] } };
  if (!zweite) return [erste];
  const titel = ebene === 'bund'
    ? SYSTEMATIK.find((k) => k.nr === zweite)?.titel ?? zweite
    : ebene === 'international'
      ? INTERNATIONAL_GRUPPEN.find((g) => g.id === zweite)?.titel ?? zweite
      : KANTON_NAMEN[zweite as keyof typeof KANTON_NAMEN] ?? zweite;
  return [erste, { label: titel, ort: { rubrik: ort.rubrik, pfad: [ebene, zweite] } }];
}
