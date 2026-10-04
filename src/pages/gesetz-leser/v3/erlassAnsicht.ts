import { verifiziertesSachgebiet } from '../helpers';
import { GEBIET_LABEL, type ErlassTyp } from '../../../lib/normtext/register';
import { erlassPfad as adresse, routenEbene } from '../../../lib/normtext/erlassAdresse';
import type { BrowseErlass } from '../../../lib/normtext/browse-typen';
import type { KantonSystematik } from '../../../lib/normtext/systematik';

// ─── Erlass → Anzeige-Angaben (FAHRPLAN-LESER-V3, Fundament-Auflage 2) ──────
//
// «Der Rahmen funktioniert für Bund, Kanton und Staatsvertrag identisch —
//  Erlass-spezifisches kommt aus dem Datenmodell, nie aus `if (bund)`.»
//  (Auftrag David 16.8.2026)
//
// Genau dafür gibt es diese Datei. Die drei Ebenen des Korpus (Bund · Kanton ·
// international) unterscheiden sich in **Beschriftungen und Zielen**, nicht im
// Aufbau: eine Brotkrume hat immer drei Stufen, ein Erlass hat immer eine
// Ebene-Angabe, eine Übersichtszeile nennt immer Umfang und Stand. Was daran
// je Ebene anders ist, wird HIER einmal abgeleitet und wandert als fertiger
// Wert in die Komponenten. Keine Komponente der V3-Hülle fragt `erlass.ebene`
// oder `erlass.rechtsgebiet` ab — die Sonde `leser-v3-adresse.test.ts` hält das
// fest, die Fälle prüft `leser-v3-erlassansicht.test.ts`.
//
// Warum das mehr ist als Kosmetik: eine vierte Ebene (etwa Gemeinderecht) oder
// eine vierte Darstellung braucht dann genau **einen** neuen Zweig an genau
// einer Stelle — statt sechs verstreuter Ternäre, von denen man einen vergisst.
// Genau dieser vergessene Zweig war der N13-Befund (BS-Audit 23.6.2026): die
// Reader-Overline zeigte für JEDEN kantonalen Erlass stur «Öffentliches Recht».
//
// Rein und deterministisch (§2): kein DOM, kein Speicher, keine Uhr.

// ─── DIE SCHWESTERDATEI `erlassWortlaut.ts` (Schnitt 14.9.2026) ─────────────
//
// Diese Datei beantwortet «WO steht dieser Erlass?» und ist die EINE Stelle,
// die dafür `.ebene`/`.rechtsgebiet` lesen darf. Die Frage «WIE heisst, was man
// liest?» — Zähl-Substantiv, Such-/Sprungfeld-Beschriftung, Titel- und
// Kennungs-Regeln — steht seit dem 14.9.2026 in `./erlassWortlaut`; dort ist
// auch begründet, warum (Tor-Deckel `leser-v3-fundament`, null Kopfraum bei 419
// von 420 Zeilen unter einem Adapter, der selbst bei 420 steht).
//
// Der Re-Export ist FASSADE, nicht Bequemlichkeit: alle Aufrufer importieren
// weiter aus `./erlassAnsicht`, der Schnitt ist damit verhaltensneutral und die
// Golden-Ausgaben byte-gleich (Skill `refactoring`, Fassaden-Muster). Das Tor
// prüft beide Richtungen — hier kein Bestimmungswort, dort keine Ebene.
export * from './erlassWortlaut';

/** Die Ebene-Stufe (Overline/Adresse): Beschriftung + Ziel der gefilterten Übersicht.
 *  W2·17 H9-B01 (1.10.2026): `brotkrume`/`hatRuecksprung`/`uebersichtsZeile` sind gestrichen
 *  (kein Aufrufer; die Kopfzeile trägt seit D27 keine Krume). */
export interface EbeneAngabe {
  label: string;
  to: string;
}

// Die Stufe nennt `routenEbene` (erlassAdresse.ts) — dieselbe Ableitung wie die
// Adresse. Vor Befund 45 lag hier eine Kopie: Krume «International», URL «bund».
export function ebeneAngabe(
  erlass: Pick<BrowseErlass, 'ebene' | 'kanton' | 'rechtsgebiet'>,
): EbeneAngabe {
  const stufe = routenEbene(erlass);
  if (stufe === 'international') {
    return { label: 'International', to: '/gesetze?ebene=international' };
  }
  if (stufe === 'bund') {
    // Cowork-Befund 14 (18.8.2026): «Bund» zeigte auf dasselbe Ziel wie «Gesetze»
    // (beide `/gesetze`) — die gefilterte Übersicht braucht `?ebene=bund`.
    return { label: 'Bund', to: '/gesetze?ebene=bund' };
  }
  const kt = erlass.kanton ?? '';
  return { label: `Kanton ${kt}`, to: `/gesetze?ebene=kanton&kt=${encodeURIComponent(kt)}` };
}

/**
 * Sachgebiet für die Overline des Erlass-Kopfs. Bund trägt das
 * Rechtsgebiet-Etikett, Kantone das **verifizierte** Sachgebiet aus der
 * amtlichen Systematik — und wo keines vorliegt, gar keines (§8: der neutrale
 * Fallback «Bereich N» ist keine Auskunft, sondern eine Behauptung).
 */
export function overlineGebiet(
  erlass: Pick<BrowseErlass, 'ebene' | 'kanton' | 'rechtsgebiet' | 'sr'>,
  kantonSys: Record<string, KantonSystematik>,
): string | null {
  if (erlass.ebene === 'bund') return GEBIET_LABEL[erlass.rechtsgebiet] ?? null;
  return verifiziertesSachgebiet(erlass, kantonSys)?.top ?? null;
}

/**
 * Adresse eines Erlasses: `/gesetze/<routenEbene>/<key>`. Auch das ist eine
 * Erlass-spezifische Ableitung und gehört darum hierher — gefunden von der
 * Vertrags-Sonde `leser-v3-fundament.test.ts` (16.8.2026), die den Zugriff auf
 * `.ebene` in `LeserLesespalte.tsx` (Nachbar-Erlass-Links) als Verstoss gegen
 * die Zusage oben meldete. Kein `if (bund)`, aber ein Lesezugriff ausserhalb
 * der einen erlaubten Stelle: würde die Route je Ebene anders aussehen, wäre
 * er der Ort, an dem man es vergisst. Statt die Zusage aufzuweichen, ist die
 * Ableitung hergezogen. Befund 45 (29.8.2026) zog sie eine Etappe WEITER — die
 * Route sieht je Ebene tatsächlich anders aus, und Prerender/Sitemap/Suche
 * brauchen dieselbe Adresse, dürfen aber nichts aus der Lesesicht importieren:
 * Formel in `lib/normtext/erlassAdresse.ts`, dies bleibt die Zusage und delegiert.
 */
export function erlassPfad(erlass: Pick<BrowseErlass, 'ebene' | 'rechtsgebiet' | 'key'>): string {
  return adresse(erlass);
}
export const panelEbene = (e: Pick<BrowseErlass, 'ebene'>): BrowseErlass['ebene'] => e.ebene; // K-2b/F37 · Herleitung: ./LeserPanelZone, Prop `ebene`

/**
 * Ä108 (Live-Ästhetik-Prüfung 18.8.2026) · DIE ZEILE «ART» TRÄGT DIE ERLASSART
 * ODER SIE ENTSTEHT NICHT.
 *
 * GEMESSEN am FR-Erlass 635.1.1: dort stand «Art · Kanton FR». Das Feld
 * versprach die Erlassart und lieferte die EBENE — eine Auskunft, die im selben
 * Bild schon zweimal steht (Kopf-Overline «Kanton FR», Krume «Kanton FR ›»).
 * Ursache: die Box baute ihren Wert mit `kopfOverline`, und die fällt ohne
 * bekannten `erlassTyp` auf die Ebene zurück — richtig für eine OVERLINE, die
 * nie leer sein darf, falsch für eine Label/Wert-Zeile, die entfallen kann (§8:
 * «Art — Kanton FR» ist keine Erlassart, sondern ein leeres Versprechen).
 *
 * JETZT: der Wert kommt direkt aus dem `erlassTyp` des Registers. Ist er dort
 * nicht geführt, entsteht keine Zeile — dieselbe Regel, nach der schon «Stand»
 * ohne Wert entfällt (B8). Der Bund behält seinen belegten Vorgabewert
 * «Bundesgesetz» (byte-verträglich zum Vorzustand, `kopfOverline`); ihn hier zu
 * streichen wäre eine zweite, ungefragte Änderung.
 *
 * Erlass-neutral (Fundament-Auflage 2): liest `rechtsgebiet`/`ebene`/`erlassTyp`,
 * nie eine Kantonsliste. Der Ebene-Zusatz «Kanton XX ·» entfällt — er ist die
 * Auskunft des Kopfes, nicht die dieser Zeile (§5).
 */
export function erlassArt(
  erlass: Pick<BrowseErlass, 'ebene' | 'rechtsgebiet'>,
  erlassTyp: ErlassTyp | undefined,
): string | null {
  if (erlass.rechtsgebiet === 'international') {
    return erlassTyp === 'staatsvertrag' ? 'Staatsvertrag' : null;
  }
  if (erlass.ebene === 'bund') {
    return erlassTyp === 'verfassung' ? 'Bundesverfassung'
      : erlassTyp === 'verordnung' ? 'Verordnung'
      : erlassTyp === 'staatsvertrag' ? 'Staatsvertrag'
      : 'Bundesgesetz';
  }
  return erlassTyp === 'gesetz' ? 'Gesetz'
    : erlassTyp === 'verordnung' ? 'Verordnung'
    : erlassTyp === 'verfassung' ? 'Verfassung'
    : null;
}
