import { kanonisierePfad } from './normtext/erlassAdresse';
import { lokalSpeicher } from './sichererSpeicher';
import { sicherDekodiert } from './sicherDekodieren';
import { typVonRoute, type ZuletztTyp } from './zuletztVerwendet';

// ─── Merkliste (LESER-NAV · R-2, Entscheid David 19.9.2026 «ja») ─────────────
//
// Eine LOKALE Liste gemerkter Stellen (Artikel, Erlasse, Entscheide, Rechner,
// Vorlagen): nur im Browser dieses Geräts, kein Konto, kein Server (Leitbild,
// zustandslose Werkzeuge). Teilen geschieht als Link, dessen Adresse die Liste
// selbst trägt (`/?merkliste=…`) — der Empfänger sieht sie vor dem Übernehmen.
//
// SSoT des localStorage-Keys 'lexmetrik-merkliste' (§5). Schwester von
// `zuletztVerwendet.ts` und wie diese:
//   · Zugriff NUR über `sichererSpeicher` (Tor `sicherer-speicher-tor`): bei
//     gesperrtem Speicher bleibt die Liste leer, `merke` meldet `'gesperrt'` und
//     die UI sagt es (§8), statt einen Erfolg zu behaupten; eine volle Liste ist
//     ein eigenes Ergebnis (`'voll'`), nie als «gesperrt» ausgegeben;
//   · Adressen kanonisiert (`kanonisierePfad`): ein umgezogener Erlass (EMRK)
//     steht nicht doppelt in der Liste;
//   · Reihenfolge = Array-Position, neueste zuerst; `zeit` kommt vom Aufrufer
//     (kein `Date.now()` in src/lib, §2) und ist reine Anzeige-Metadaten.
//
// WAS GESPEICHERT WIRD: Pfad (ohne Query) + Anker + Titel + Typ. NIE
// Formularinhalte: Rechner-Adressen tragen ihre Eingaben in der Query
// (Berufsgeheimnis) — die Query wird beim Merken verworfen (`merkRoute`).
//
// SICHERHEIT DES LINKS: der Payload kommt aus einer fremden Adresse und ist
// Daten, nie Auftrag. Beim Dekodieren wird jede Route gegen `istMerkRoute`
// geprüft (nur interne Inhalts-Pfade, kein Schema, kein `//`), Titel werden
// gekürzt und von Steuerzeichen befreit; React setzt sie als Text, nie als HTML.

export interface MerkEintrag {
  route: string;
  titel: string;
  typ: ZuletztTyp;
  /** Anzeige-/Ordnungs-Metadaten (ms seit Epoch); 0 wenn nicht mitgegeben. */
  zeit: number;
}

const KEY = 'lexmetrik-merkliste';
/** Obergrenze: hält den Teilen-Link in einer Grössenordnung, die Mail und Chat vertragen. */
export const MERKLISTE_MAX = 50;
const TITEL_MAX = 120;
const ROUTE_MAX = 300;
const PAYLOAD_MAX = 20000;
/** Query-Parameter des Teilen-Links auf der Startseite. */
export const MERKLISTE_PARAM = 'merkliste';
/** Reaktives Event im GLEICHEN Tab (Muster ZULETZT_EVENT); anderer Tab: `storage`. */
const MERKLISTE_EVENT = 'lm:merkliste';

/** Unsichtbare Steuerzeichen, die Text umlenken oder ein Zeichen verstecken:
 *  Nullbreite (U+200B–U+200F), Bidi-Einbettung/-Override (U+202A–U+202E),
 *  Bidi-Isolate (U+2066–U+2069) und das BOM (U+FEFF). Ein Titel «Art. 1 OR» mit
 *  U+202E läse sich im Link-Vorschau-Text anders, als er ist (Trojan Source). */
const UNSICHTBAR_ALLE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const UNSICHTBAR = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/;

/** Nur Inhalts-Routen — dieselbe Menge, die der ZuletztTracker verfolgt. */
const INHALT_ROUTE = /^\/(rechner|vorlagen|gesetze|rechtsprechung|materialien)\/[^\s<>"'`\\]+$/;
const HASH_ZEICHEN = /^[^\s<>"'`\\]*$/;

/** Ein Pfad-Segment `.` oder `..` — roh ODER nach dem Dekodieren (`%2e`, `%2E`, auch
 *  doppelt kodiert `%252e`; ein dabei entstehender `/` zählt als Segmentgrenze). Kodierungstiefe
 *  über 4: abgelehnt. Ein kaputtes Escape ist kein Punkt-Segment (`sicherDekodiert` = `null`). */
function istPunktSegment(segment: string): boolean {
  let s = segment;
  for (let tiefe = 0; tiefe < 4; tiefe++) {
    if (s.split(/[/\\]/).some((x) => x === '.' || x === '..')) return true;
    const d = sicherDekodiert(s);
    if (d === null || d === s) return false;
    s = d;
  }
  return true;
}

/** Ist das eine Adresse, die die Merkliste führen darf (intern, Inhalt, ohne Query)? */
export function istMerkRoute(route: unknown): route is string {
  if (typeof route !== 'string' || route.length > ROUTE_MAX) return false;
  if (route.startsWith('//') || route.includes('?') || UNSICHTBAR.test(route)) return false;
  const [pfad, hash, ...rest] = route.split('#');
  if (rest.length > 0) return false;
  if (hash !== undefined && !HASH_ZEICHEN.test(hash)) return false;
  if (!INHALT_ROUTE.test(pfad)) return false;
  return !pfad.split('/').some(istPunktSegment);
}

/** Die EINE Normalform einer Adresse VOR jeder Prüfung: unsichtbare Steuerzeichen weg, dann
 *  `kanonisierePfad`. Länge und Gültigkeit werden erst auf diesem Ergebnis geprüft — sonst
 *  entstünde ein Geistereintrag, der beim Lesen wieder herausfällt (Umzug macht Pfade länger). */
function normalisiereRoute(route: string): string {
  return kanonisierePfad(route.replace(UNSICHTBAR_ALLE, ''));
}

/**
 * Die EINE Schreibweise einer gemerkten Stelle: Pfad kanonisiert, Query weg,
 * Anker roh übergeben und hier kodiert (Reiter-Pfade und Artikel-Aktion bauen
 * den Anker verschieden — nach dieser Funktion sind beide gleich). `null`, wenn
 * die Adresse keine merkbare Inhalts-Route ist.
 */
export function merkRoute(pfad: string, ankerRoh?: string | null): string | null {
  const ohneQuery = pfad.split('#')[0].split('?')[0];
  const kanonisch = normalisiereRoute(ohneQuery);
  const anker = ankerRoh ? ankerRoh.replace(UNSICHTBAR_ALLE, '') : '';
  const route = anker ? `${kanonisch}#${encodeURIComponent(anker)}` : kanonisch;
  return istMerkRoute(route) ? route : null;
}

/** Wie `merkRoute`, aber aus einer vollständigen Adresse mit Query und kodiertem Anker (Reiter). */
export function merkRouteAusAdresse(adresse: string): string | null {
  const i = adresse.indexOf('#');
  const hashRoh = i >= 0 ? sicherDekodiert(adresse.slice(i + 1)) : null;
  if (i >= 0 && hashRoh === null) return merkRoute(adresse, null); // kaputtes Escape: ohne Anker merken
  return merkRoute(adresse, hashRoh || null);
}

function saubererTitel(t: string): string {
  // eslint-disable-next-line no-control-regex
  return t.replace(UNSICHTBAR_ALLE, '').replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, TITEL_MAX);
}

const TYP_WERTE: readonly ZuletztTyp[] = ['rechner', 'vorlage', 'gesetz', 'entscheid', 'material', 'seite'];
function istTyp(v: unknown): v is ZuletztTyp {
  return typeof v === 'string' && (TYP_WERTE as readonly string[]).includes(v);
}

// ── Lesen ────────────────────────────────────────────────────────────────────

// Der Parse-Cache hängt am ROHEN Speicherwert, nicht an einer Invalidierung: ein
// Wert, den ein anderer Tab oder ein Test geändert hat, wird so von selbst neu
// gelesen. Er trägt die vielen Artikel-Knöpfe (ein Lesezugriff je Knopf, ein
// Parse je Änderung).
let cacheRoh: string | null | undefined;
let cacheListe: MerkEintrag[] = [];
let cacheSet: ReadonlySet<string> = new Set();

/** Die gemerkten Stellen, neueste zuerst. Wirft nie; kaputter Speicher = leer. */
export function holeMerkliste(): MerkEintrag[] {
  const roh = lokalSpeicher.lies(KEY);
  if (roh === cacheRoh) return cacheListe;
  let liste: MerkEintrag[] = [];
  try {
    const arr: unknown = roh ? JSON.parse(roh) : [];
    if (Array.isArray(arr)) {
      liste = arr
        .filter((e): e is { route: string; titel: string; typ?: unknown; zeit?: unknown } =>
          !!e && typeof e.route === 'string' && typeof e.titel === 'string')
        .map((e) => {
          const route = normalisiereRoute(e.route);
          return {
            route,
            titel: saubererTitel(e.titel),
            typ: istTyp(e.typ) ? e.typ : typVonRoute(route),
            zeit: typeof e.zeit === 'number' && Number.isFinite(e.zeit) ? e.zeit : 0,
          };
        })
        .filter((e) => e.titel !== '' && istMerkRoute(e.route))
        .filter((e, i, alle) => alle.findIndex((x) => x.route === e.route) === i)
        .slice(0, MERKLISTE_MAX);
    }
  } catch {
    liste = [];
  }
  cacheRoh = roh;
  cacheListe = liste;
  cacheSet = new Set(liste.map((e) => e.route));
  return liste;
}

/** Ist diese Stelle gemerkt? (Route in der Schreibweise von `merkRoute`.) Liest den Speicher —
 *  für Schreibpfade und Menüs; die Hooks der Oberfläche nehmen `istGemerktImStand`. */
export function istGemerkt(route: string): boolean {
  holeMerkliste();
  return cacheSet.has(route);
}

// ── Geteiltes Abo (§15 Geräte-Last) ──────────────────────────────────────────
//
// GEMESSEN am Konzept: im Obligationenrecht-Leser sind rund 1700 «Merken»-Knöpfe gemountet. Je Knopf ein
// eigenes Abo hiesse ~3400 window-Listener und ~1700 `getItem` JE EREIGNIS. Darum gibt es im Modul
// GENAU EINE Anmeldung am Fenster (ein `lm:merkliste`-, ein `storage`-Listener), solange mindestens ein
// Hook abonniert ist. Bei einem Ereignis wird der Rohwert EINMAL gelesen (`holeMerkliste` füllt den
// Cache) und dann werden alle Abonnenten benachrichtigt; ihr Snapshot liest den Cache, nicht den Speicher.
// Ohne Abonnenten gibt es keinen Listener und keinen Cache-Vertrauensvorschuss: der Snapshot liest dann
// selbst (nur der erste Render, ein einmaliger Lesezugriff je Knopf).

const abonnenten = new Set<() => void>();
let amFenster = false;

function beiAenderung(): void {
  holeMerkliste(); // EIN Lesezugriff je Ereignis, nicht einer je Abonnent
  for (const cb of Array.from(abonnenten)) cb();
}

/** Anderer Tab: nur unser Schlüssel (oder `clear()`, `key === null`) zählt — nicht jedes Fremd-`storage`. */
function beiStorage(ev: StorageEvent): void {
  if (ev.key === null || ev.key === KEY) beiAenderung();
}

/** Abo für `useSyncExternalStore`: gleicher Tab per Event, anderer Tab per `storage`. */
export function abonniereMerkliste(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  abonnenten.add(cb);
  if (!amFenster) {
    amFenster = true;
    window.addEventListener(MERKLISTE_EVENT, beiAenderung);
    window.addEventListener('storage', beiStorage);
    holeMerkliste(); // Cache auf den Stand jetzt bringen (zwischen Render und Abo kann sich etwas geändert haben)
  }
  return () => {
    abonnenten.delete(cb);
    if (abonnenten.size === 0 && amFenster) {
      amFenster = false;
      window.removeEventListener(MERKLISTE_EVENT, beiAenderung);
      window.removeEventListener('storage', beiStorage);
    }
  };
}

/** Snapshot für den Hook: mit Abonnenten der Cache (kein `getItem`), sonst ein frischer Lesezugriff. */
export function merklisteImStand(): MerkEintrag[] {
  return amFenster ? cacheListe : holeMerkliste();
}

/** Wie `istGemerkt`, aber aus dem Cache, solange abonniert wird (Hook der Merken-Knöpfe). */
export function istGemerktImStand(route: string): boolean {
  if (!amFenster) holeMerkliste();
  return cacheSet.has(route);
}

// ── Schreiben ────────────────────────────────────────────────────────────────

function melde(): void {
  try { window.dispatchEvent(new Event(MERKLISTE_EVENT)); } catch { /* SSR / kein window */ }
}

function speichere(liste: readonly MerkEintrag[]): boolean {
  const ok = liste.length === 0
    ? lokalSpeicher.entferne(KEY)
    : lokalSpeicher.schreib(KEY, JSON.stringify(liste.slice(0, MERKLISTE_MAX)));
  if (ok) melde();
  return ok;
}

/** Ergebnis eines Schreibversuchs — getrennt, damit die Oberfläche das Richtige sagt (§8):
 *  `voll` = Obergrenze `MERKLISTE_MAX` erreicht (der Nutzer kann abhelfen: Einträge entfernen),
 *  `gesperrt` = der Browser nahm nichts an (Speicher gesperrt, Quote),
 *  `ungueltig` = Adresse nicht merkbar oder Titel leer. */
export type MerkErgebnis = 'ok' | 'voll' | 'gesperrt' | 'ungueltig';

/** Merkt eine Stelle (neueste nach vorn, je Route einmal). Adresse und Titel werden zuerst
 *  normalisiert und DANN geprüft (Länge, Gültigkeit): was nicht gespeichert wird, wird nie
 *  als Geistereintrag angelegt. */
export function merke(e: { route: string; titel: string; typ?: ZuletztTyp; zeit?: number }): MerkErgebnis {
  const titel = saubererTitel(e.titel);
  const route = normalisiereRoute(e.route);
  if (titel === '' || !istMerkRoute(route)) return 'ungueltig';
  const ohne = holeMerkliste().filter((x) => x.route !== route);
  if (ohne.length >= MERKLISTE_MAX) return 'voll';
  return speichere([{ route, titel, typ: e.typ ?? typVonRoute(route), zeit: e.zeit ?? 0 }, ...ohne]) ? 'ok' : 'gesperrt';
}

/** Entfernt eine Stelle. `true`, wenn der Aufruf durchlief. */
export function entferneMerkung(route: string): boolean {
  return speichere(holeMerkliste().filter((x) => x.route !== route));
}

/** Ergebnis von `schalteMerkung`: der Stand DANACH und, falls die Umschaltung scheiterte, warum. */
export interface MerkSchaltung {
  gemerkt: boolean;
  fehler: Exclude<MerkErgebnis, 'ok'> | null;
}

/** Setzt die Merkung um (bei Fehlschlag bleibt der alte Stand, `fehler` sagt den Grund). */
export function schalteMerkung(e: { route: string; titel: string; typ?: ZuletztTyp; zeit?: number }): MerkSchaltung {
  let fehler: MerkSchaltung['fehler'] = null;
  if (istGemerkt(e.route)) {
    if (!entferneMerkung(e.route)) fehler = 'gesperrt';
  } else {
    const r = merke(e);
    if (r !== 'ok') fehler = r;
  }
  return { gemerkt: istGemerkt(e.route), fehler };
}

export function leereMerkliste(): boolean {
  return speichere([]);
}

// ── Teilen als Link ──────────────────────────────────────────────────────────

function nachBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function ausBase64Url(payload: string): string | null {
  try {
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

/** Format des Payloads: base64url(JSON `[[route, titel], …]`), neueste zuerst. */
export function kodiereMerkliste(liste: readonly Pick<MerkEintrag, 'route' | 'titel'>[]): string {
  return nachBase64Url(JSON.stringify(liste.slice(0, MERKLISTE_MAX).map((e) => [e.route, e.titel])));
}

/**
 * Liest einen Payload aus einer fremden Adresse. `null` = unbrauchbar. Gültig ist
 * nur, was `istMerkRoute` besteht; ungültige Zeilen entfallen einzeln, ein
 * Payload ganz ohne gültige Zeile ist `null`. `typ` wird aus der Route abgeleitet.
 */
export function dekodiereMerkliste(payload: string): MerkEintrag[] | null {
  if (!payload || payload.length > PAYLOAD_MAX) return null;
  const json = ausBase64Url(payload);
  if (json === null) return null;
  let arr: unknown;
  try { arr = JSON.parse(json); } catch { return null; }
  if (!Array.isArray(arr)) return null;
  const aus: MerkEintrag[] = [];
  for (const z of arr.slice(0, MERKLISTE_MAX)) {
    if (!Array.isArray(z) || typeof z[0] !== 'string' || typeof z[1] !== 'string') continue;
    const route = normalisiereRoute(z[0]);
    const titel = saubererTitel(z[1]);
    if (titel === '' || !istMerkRoute(route) || aus.some((x) => x.route === route)) continue;
    aus.push({ route, titel, typ: typVonRoute(route), zeit: 0 });
  }
  return aus.length > 0 ? aus : null;
}

/** Der Teilen-Link auf die Startseite; `ursprung` z. B. `window.location.origin`. */
export function merklisteLink(ursprung: string, liste: readonly Pick<MerkEintrag, 'route' | 'titel'>[]): string {
  return `${ursprung}/?${MERKLISTE_PARAM}=${kodiereMerkliste(liste)}`;
}

/** Was beim Übernehmen geschah — jede Stelle des Links ist in genau einer Zahl: `neu` übernommen,
 *  `schonVorhanden` (eigener Titel bleibt), `wegenObergrenze` nicht übernommen, weil `MERKLISTE_MAX`
 *  erreicht ist. Nichts geht stillschweigend verloren (§8). */
export interface Uebernahme {
  neu: number;
  schonVorhanden: number;
  wegenObergrenze: number;
}

/**
 * Übernimmt importierte Einträge: schon vorhandene Routen bleiben unangetastet
 * (der eigene Titel gewinnt), neue kommen hinter die eigenen — die Reihenfolge
 * des Links bleibt erhalten, bei Platzmangel fallen die LETZTEN des Links weg
 * (und werden gezählt). `null`, wenn der Speicher nichts annahm.
 */
export function uebernimmMerkliste(neu: readonly MerkEintrag[], zeit: number): Uebernahme | null {
  const eigene = holeMerkliste();
  const bekannt = new Set(eigene.map((e) => e.route));
  const vomLink = new Set<string>();
  const dazu: MerkEintrag[] = [];
  let schonVorhanden = 0;
  for (const e of neu) {
    if (vomLink.has(e.route)) continue; // Doppel im Link zählt einmal
    vomLink.add(e.route);
    if (bekannt.has(e.route)) schonVorhanden++;
    else dazu.push({ ...e, zeit });
  }
  const platz = Math.max(0, MERKLISTE_MAX - eigene.length);
  const aufnehmen = dazu.slice(0, platz);
  const ergebnis: Uebernahme = { neu: aufnehmen.length, schonVorhanden, wegenObergrenze: dazu.length - aufnehmen.length };
  if (aufnehmen.length === 0) return ergebnis; // nichts zu schreiben
  return speichere([...eigene, ...aufnehmen]) ? ergebnis : null;
}
