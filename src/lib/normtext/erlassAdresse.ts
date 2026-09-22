// ─── Adresse eines Erlasses: DIE eine Ableitung (§5) ────────────────────────
//
// Cowork-Befund 45 (18.8.2026) / Entscheid David 29.8.2026 («ja, mit
// Redirects»): Staatsverträge lagen unter `/gesetze/bund/<key>`. Sie tragen im
// Register `ebene: 'bund'` — richtig, denn ein ratifizierter Staatsvertrag IST
// Landesrecht und steht in der SR (0.xxx); die Snapshot-Dateien liegen darum
// unter `public/normtext/bund/`. Für den Leser ist «Bund» in der Adresse
// gleichwohl die falsche Auskunft: die Brotkrume sagt seit Cowork-Befund 14
// «International» (erlassAnsicht.ebeneAngabe), die Reiter-Herkunft ebenso
// (tabGruppen.herkunftVon) — nur die URL widersprach beiden.
//
// Deshalb ZWEI Ebenen-Begriffe, sauber getrennt:
//
//   DATEN-Ebene  (`BrowseErlass.ebene`, 'bund' | 'kanton')
//       Wo der Snapshot liegt: `/normtext/<datenEbene>/<key>.json`,
//       `/normtext/struktur/<datenEbene>/<key>.json`. Unverändert.
//
//   ROUTEN-Ebene (`routenEbene()`, 'bund' | 'kanton' | 'international')
//       Was in der Adresse steht: `/gesetze/<routenEbene>/<key>`.
//
// Vor diesem Modul erzeugten rund zwanzig Stellen den Pfad je selbst per
// Template-Literal, drei davon mit fest verdrahtetem `bund`. Genau das ist der
// Grund, warum die Falschadresse so lange überlebte. Ab hier gilt: WER EINEN
// ERLASS-PFAD BAUT, RUFT `erlassPfad()`. Ein zweiter Pfad-Formatierer ist ein
// §5-Verstoss und wird vom Tor `src/tests/erlass-adresse.test.ts` gemeldet.

import { KANTONE } from '../kantone';
import { FEDLEX, type FedlexGesetz } from '../fedlex';
import { ERLASS_REGISTER } from './register';
import type { BrowseErlass } from './browse-typen';

/** Ebene, wie sie in der ADRESSE steht — nicht die Daten-Ebene des Registers. */
export type RoutenEbene = 'bund' | 'kanton' | 'international';

// GESTRICHEN (Gegenprüfung 29.8.2026, Mangel 6): hier standen `ROUTEN_EBENEN`
// und `istRoutenEbene` — beide ohne einen einzigen Aufrufer, während
// `RouteSwitch.tsx:88` die Liste von Hand führt. Ein Modul, das «EINE Ableitung»
// verspricht und die Hilfsmittel dafür ungenutzt mitliefert, ist keine Quelle,
// sondern Beiwerk (§17 Rückbau). Die Liste in RouteSwitch bleibt, wo sie ist:
// sie beantwortet eine ROUTEN-Frage («kenne ich dieses Segment?») und darf den
// Start-Bundle nicht um das Register vergrössern.

/**
 * Routen-Ebene eines Erlasses. «International» (Staatsvertrag) schlägt die
 * Daten-Ebene — dieselbe Vorrang-Regel, die `tabGruppen.herkunftVon` und
 * `erlassAnsicht.ebeneAngabe` schon anwenden; beide leiten jetzt von hier ab,
 * damit es die Regel nur einmal gibt.
 */
export function routenEbene(e: Pick<BrowseErlass, 'ebene' | 'rechtsgebiet'>): RoutenEbene {
  if (e.rechtsgebiet === 'international') return 'international';
  return e.ebene;
}

/**
 * Daten-Ebene zu einer Routen-Ebene: wo die Snapshot-/Struktur-Dateien liegen.
 *
 * 'international' ist eine reine Adress-Ebene ohne eigenes Datenverzeichnis —
 * die Staatsverträge liegen unter `bund`. Dass diese Zuordnung stimmt, ist
 * KEINE Annahme, sondern bewacht: `erlass-adresse.test.ts` prüft gegen das
 * gebaute Register, dass jeder Erlass mit Routen-Ebene 'international' die
 * Daten-Ebene 'bund' trägt. Käme je ein kantonaler Staatsvertrag hinzu, wird
 * das Tor rot, statt dass hier still die falsche Datei geladen wird.
 */
export function datenEbeneVonRoute(routen: string): string {
  return routen === 'international' ? 'bund' : routen;
}

/** Adresse eines Erlasses: `/gesetze/<routenEbene>/<key>`.
 *
 *  `encodeURIComponent` lässt A-Za-z0-9 und `_ . - ! ~ * ' ( )` unberührt;
 *  Bund-Keys (UPPERCASE/_/Ziffern) bleiben identisch, kantonale Keys mit
 *  Sonderzeichen werden prozentkodiert — Pfad == sitemap-loc == canonical ==
 *  Dateiname-Basis, durchgehend eine Form. */
export function erlassPfad(e: Pick<BrowseErlass, 'ebene' | 'rechtsgebiet' | 'key'>): string {
  return `/gesetze/${routenEbene(e)}/${encodeURIComponent(e.key)}`;
}

/**
 * Adresse aus einem bereits bekannten ROUTEN-SEGMENT und Schlüssel — für den
 * Leser-Rahmen, der die Route vollzieht und den Erlass evtl. noch nicht
 * aufgelöst hat.
 *
 * DER PARAMETER HEISST NICHT `ebene`, UND DAS IST DER PUNKT (Gegenprüfung
 * 29.8.2026, Mangel 4 · zweiter Durchgang). Befund 45 konnte entstehen, weil
 * das Segment in der Adresse und das Feld im Register denselben Namen tragen:
 * `ebene`. Wer `erlassPfadRoh(e.ebene, e.key)` schreibt, ruft brav die eine
 * Quelle und verdrahtet trotzdem die Daten-Ebene in die Adresse — der Fehler
 * sieht dann aus wie seine eigene Lösung.
 *
 * Seit hier `routenSegment` steht, trägt keine legitime Aufrufstelle mehr
 * etwas namens `ebene` herein; die Sonde in `erlass-adresse.test.ts` kann
 * deshalb den blossen Bezeichner `ebene` an dieser Stelle verbieten, ohne
 * richtige Aufrufe zu treffen.
 */
export function erlassPfadRoh(routenSegment: string, key: string): string {
  return `/gesetze/${routenSegment}/${encodeURIComponent(key)}`;
}

/** Alt-Adresse desselben Erlasses (vor Befund 45), die dauerhaft weiterleitet.
 *  null, wenn der Erlass nie umgezogen ist (Bund-/Kantonserlasse). */
export function erlassAltPfad(e: Pick<BrowseErlass, 'ebene' | 'rechtsgebiet' | 'key'>): string | null {
  if (routenEbene(e) !== 'international') return null;
  return `/gesetze/${e.ebene}/${encodeURIComponent(e.key)}`;
}

// ─── Adresse, wenn nur der Schlüssel bekannt ist ────────────────────────────
//
// Etliche Link-Erzeuger kennen keinen `BrowseErlass`, sondern nur den Key aus
// einem Verweis (Vorlagen-NormChip, Entscheid-Verzahnung, Volltext-Treffer der
// Suche). Vor Befund 45 schrieben sie darum `/gesetze/bund/<key>` FEST hin —
// für einen Staatsvertrag doppelt falsch, denn die Adresse war weder kanonisch
// noch als Alt-Form gedacht. Das Register beantwortet die Frage synchron und
// deterministisch (§2), also fragen sie es jetzt.
const EBENE_JE_KEY: ReadonlyMap<string, RoutenEbene> = new Map(
  ERLASS_REGISTER.map((e) => [e.key, routenEbene(e)] as const),
);

/**
 * Routen-Ebene allein aus dem Schlüssel.
 *
 * DAS REGISTER ENTSCHEIDET, nicht der Aufrufer. `fallback` gilt NUR für
 * Schlüssel, die das Register nicht kennt — dort gibt es nichts zu entscheiden,
 * und eine ehrliche Fehlseite ist besser als ein geratener Sprung.
 *
 * Dass hier das Register gewinnt und nicht die übergebene Ebene, ist ein
 * Nachzug aus der Gegenprüfung (29.8.2026, Mangel 1): vorher war der Parameter
 * der Fallback FÜR ALLE Keys, und damit lieferte `/gesetze/international/OR`
 * eine vollständige, funktionierende OR-Seite — mit der Brotkrume «Bund». Also
 * exakt Befund 45, nur spiegelverkehrt: eine zweite Adresse, deren URL der
 * angezeigten Ebene widerspricht (§5/§8). Registerautoritativ gilt das für
 * jeden BUNDES-Erlass (ERLASS_REGISTER, 238 Keys): genau EINE Adresse, jede
 * andere leitet dorthin.
 *
 * K-3 (W2·13-KANTONE, 31.8.2026) SCHLIESST DIE ANDERE HÄLFTE. Bis hierher
 * fielen die 1231 Kantons-Keys auf das URL-Segment zurück — `/gesetze/bund/
 * ZH-211.1` rendete eine vollständige Kantonsseite mit der Brotkrume «Kanton
 * Zürich» (dokumentierte Lücke, Gegenprüfung 29.8.2026 Befund 1; Wurzel-Posten
 * FAHRPLAN-UI-NAVIGATION §7). Sie sind bewusst NICHT ins Register gewandert:
 * das trägt den Bund, und ein Client-Index über 1231 kantonale Schlüssel gehört
 * nicht in den Start-Bundle.
 *
 * Stattdessen die Regel, die die Schlüssel ohnehin tragen: ein kantonaler
 * Schlüssel beginnt mit dem Kantonskürzel («ZH-211.1», «BS-RiE 911.900»), ein
 * Bundes- oder Staatsvertrags-Schlüssel nie. Das ist KEINE Heuristik, sondern
 * bewacht (§2/§7): `src/tests/leser-ebenen-redirect-k3.test.ts` prüft gegen den
 * committeten Bestand, dass alle 1231 kantonalen Schlüssel dem Muster folgen
 * und KEINER der 238 Bundes-Schlüssel es trifft. Käme je ein Gegenbeispiel,
 * wird das Tor rot, statt dass hier still falsch geleitet wird.
 *
 * REIHENFOLGE IST TEIL DER REGEL: das Register entscheidet zuerst, die
 * Präfix-Regel greift nur für Schlüssel, die es nicht kennt. Und die 26 Kürzel
 * sind die bestehende Kantonsliste (`lib/kantone`, BV Art. 1) — keine zweite
 * Wahrheit. Ein Schlüssel, der weder im Register steht noch ein Kantonskürzel
 * trägt, bleibt beim übergebenen Segment: dort gibt es nichts zu entscheiden,
 * und eine ehrliche Fehlseite ist besser als ein geratener Sprung (§8).
 */
const KANTON_PRAEFIX = new RegExp(`^(${KANTONE.join('|')})-`);

export function routenEbeneVonKey(key: string, fallback = 'bund'): string {
  const ausRegister = EBENE_JE_KEY.get(key);
  if (ausRegister) return ausRegister;
  return KANTON_PRAEFIX.test(key) ? 'kanton' : fallback;
}

/** Adresse allein aus dem Schlüssel — siehe `routenEbeneVonKey`. */
export function erlassPfadVonKey(key: string, fallback = 'bund'): string {
  return erlassPfadRoh(routenEbeneVonKey(key, fallback), key);
}

// ─── ELI → Schlüssel: liegt DIESER Erlass bei uns im Korpus? ────────────────
//
// Gegenprüfungs-Auflage zu PR #823 (12.9.2026). Ein Erlass kann einen anderen
// als Nachfolger NENNEN (`BrowseErlass.aufgehoben.nachfolger.eli`), ohne dass
// wir wüssten, ob wir diesen Nachfolger selbst führen. Bis zur BMV-Total-
// revision war die Antwort immer «nein», und das Aufhebungs-Banner verlinkte
// darum ausschliesslich nach fedlex.admin.ch. Seit `BMV_2025` im Korpus liegt,
// schickte genau dieser Link den Leser aus dem Korpus HINAUS, obwohl die
// geltende Fassung einen Klick entfernt lag (§8).
//
// Die Zuordnung ist DEKLARIERT, nicht geraten (§2/§5): jeder Bund-Eintrag trägt
// seinen `fedlexKey`, und `FEDLEX` nennt dazu die amtliche ELI-URL. Beide
// Tabellen sind bereits gegeneinander verriegelt («Tor 3 — fedlex.ts ↔ Register
// synchron», src/tests/normtext-register.test.ts), es entsteht also keine
// zweite Wahrheit.
//
// MEHRDEUTIGKEIT ⇒ KEIN TREFFER. Eine ELI, die auf mehr als einen Schlüssel
// zeigte, wird bewusst verworfen statt willkürlich aufgelöst: ein Sprung auf
// den falschen von zwei Erlassen wäre schlimmer als der bisherige Weg über die
// amtliche Quelle (§8).

/** ELI-Pfad (`cc/2025/408`) aus einer Fedlex-URL; null, wenn keine enthalten. */
function eliAusUrl(url: string): string | null {
  const m = /\/eli\/(.+?)(?:\/(?:de|fr|it|rm))?\/?$/.exec(url);
  return m ? m[1] : null;
}

const KEY_JE_ELI: ReadonlyMap<string, string | null> = (() => {
  const map = new Map<string, string | null>();
  for (const e of ERLASS_REGISTER) {
    if (e.ebene !== 'bund' || !e.fedlexKey) continue;
    const eli = eliAusUrl(FEDLEX[e.fedlexKey as FedlexGesetz] ?? '');
    if (!eli) continue;
    map.set(eli, map.has(eli) ? null : e.key); // zweiter Treffer ⇒ mehrdeutig
  }
  return map;
})();

/**
 * Register-Schlüssel zu einem ELI-Pfad (`cc/2025/408` → `BMV_2025`).
 * null = nicht im Korpus oder mehrdeutig — dann bleibt die amtliche Quelle
 * der einzige Weg (§7/§8).
 */
export function erlassKeyVonEli(eli: string): string | null {
  if (!eli) return null;
  return KEY_JE_ELI.get(eli.replace(/^\/+|\/+$/g, '')) ?? null;
}

// ─── Gespeicherte Adressen nachziehen ───────────────────────────────────────
//
// Nachzug aus der Gegenprüfung (29.8.2026, Mängel 2 und 3): Reiter
// (`lib/tabs`) und Split-Panes (`layout/usePaneLayout`) speichern PFADE. Ein
// vor dem Umzug gemerkter Reiter, ein versendeter Alt-Link, ein geteilter
// `?p=`-Layout-Link — sie alle tragen die Alt-Adresse in den gespeicherten
// Zustand. Der Client-Sprung im Leser kommt dafür zu spät: der Reiter ist
// bereits geschrieben, wenn der Leser überhaupt rendert, und es entstand ein
// toter Zweitreiter neben dem echten.
//
// Darum kanonisiert JEDE Stelle, die einen Pfad SPEICHERT, ihn vorher hier.
// Damit bleibt die Weiterleitung, was der Entscheid wollte — eine Brücke für
// Alt-Bestand — statt zum Dauerzustand zu werden.

/** Zerlegt `/gesetze/<ebene>/<key>` (Rest = Query/Anker); null, wenn der Pfad
 *  keine Erlass-Adresse ist.
 *
 *  EXPORTIERT seit F25 (K-1b, 31.8.2026) — ohne neue Logik, nur die Sichtbarkeit
 *  geändert. Der Leser-Einsprung (`pages/GesetzLeser.tsx`) leitet Ebene und
 *  Schlüssel jetzt hierüber aus `location.pathname` ab, statt sie aus
 *  `useParams()` zu nehmen: `react-router` v7 dekodiert Routen-Parameter selbst
 *  UND ersetzt danach jedes verbliebene `%2F` durch `/` (`matchPathImpl`,
 *  node_modules/react-router/…/chunk-*.mjs). Für die drei Glarner Schlüssel mit
 *  `%` in der Kanonik (`GL-III%20B%2F3%2F2` u. a.) zerstört das den Schlüssel —
 *  über `useParams()` sind sie prinzipiell unerreichbar, gleich was die
 *  Komponente danach tut. Der rohe Pfad trägt sie unversehrt. Damit gibt es für
 *  «Pfad → {Ebene, Schlüssel}» weiterhin GENAU EINE Ableitung (§5), und sie ist
 *  dieselbe, die `kanonisierePfad` für gespeicherte Adressen anwendet. */
export function zerlegeErlassPfad(pfad: string): { ebene: string; key: string; rest: string } | null {
  const m = /^\/gesetze\/([^/?#]+)\/([^?#]+)(.*)$/.exec(pfad);
  if (!m) return null;
  let key: string;
  try { key = decodeURIComponent(m[2]); } catch { return null; }
  return { ebene: m[1], key, rest: m[3] };
}

/**
 * Kanonische Form einer Erlass-Adresse; alles andere bleibt unverändert.
 * Query und Anker überleben — der Instanz-Diskriminator `?r=<n>` gehört zur
 * Reiter-Identität, und `#art-…` ist die Fundstelle.
 */
export function kanonisierePfad(pfad: string): string {
  const t = zerlegeErlassPfad(pfad);
  if (!t) return pfad;
  const kanonisch = routenEbeneVonKey(t.key, t.ebene);
  if (kanonisch === t.ebene) return pfad;
  return erlassPfadRoh(kanonisch, t.key) + t.rest;
}
