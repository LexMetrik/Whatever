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
//     gesperrtem Speicher bleibt die Liste leer, `merke` meldet `false` und die
//     UI sagt es (§8), statt einen Erfolg zu behaupten;
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

/** Nur Inhalts-Routen — dieselbe Menge, die der ZuletztTracker verfolgt. */
const INHALT_ROUTE = /^\/(rechner|vorlagen|gesetze|rechtsprechung|materialien)\/[^\s<>"'`\\]+$/;
const HASH_ZEICHEN = /^[^\s<>"'`\\]*$/;

/** Ist das eine Adresse, die die Merkliste führen darf (intern, Inhalt, ohne Query)? */
export function istMerkRoute(route: unknown): route is string {
  if (typeof route !== 'string' || route.length > ROUTE_MAX) return false;
  if (route.startsWith('//') || route.includes('?')) return false;
  const [pfad, hash, ...rest] = route.split('#');
  if (rest.length > 0) return false;
  if (hash !== undefined && !HASH_ZEICHEN.test(hash)) return false;
  return INHALT_ROUTE.test(pfad);
}

/**
 * Die EINE Schreibweise einer gemerkten Stelle: Pfad kanonisiert, Query weg,
 * Anker roh übergeben und hier kodiert (Reiter-Pfade und Artikel-Aktion bauen
 * den Anker verschieden — nach dieser Funktion sind beide gleich). `null`, wenn
 * die Adresse keine merkbare Inhalts-Route ist.
 */
export function merkRoute(pfad: string, ankerRoh?: string | null): string | null {
  const ohneQuery = pfad.split('#')[0].split('?')[0];
  const kanonisch = kanonisierePfad(ohneQuery);
  const route = ankerRoh ? `${kanonisch}#${encodeURIComponent(ankerRoh)}` : kanonisch;
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
  return t.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, TITEL_MAX);
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
        .map((e) => ({
          route: kanonisierePfad(e.route),
          titel: saubererTitel(e.titel),
          typ: istTyp(e.typ) ? e.typ : typVonRoute(e.route),
          zeit: typeof e.zeit === 'number' && Number.isFinite(e.zeit) ? e.zeit : 0,
        }))
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

/** Ist diese Stelle gemerkt? (Route in der Schreibweise von `merkRoute`.) */
export function istGemerkt(route: string): boolean {
  holeMerkliste();
  return cacheSet.has(route);
}

// ── Schreiben ────────────────────────────────────────────────────────────────

function melde(): void {
  try { window.dispatchEvent(new Event(MERKLISTE_EVENT)); } catch { /* SSR / kein window */ }
}

/** Abo für `useSyncExternalStore`: gleicher Tab per Event, anderer Tab per `storage`. */
export function abonniereMerkliste(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(MERKLISTE_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(MERKLISTE_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

function speichere(liste: readonly MerkEintrag[]): boolean {
  const ok = liste.length === 0
    ? lokalSpeicher.entferne(KEY)
    : lokalSpeicher.schreib(KEY, JSON.stringify(liste.slice(0, MERKLISTE_MAX)));
  if (ok) melde();
  return ok;
}

/** Merkt eine Stelle (neueste nach vorn, je Route einmal). `false`: nicht gespeichert
 *  (Speicher gesperrt, Adresse nicht merkbar, Titel leer, Liste voll). */
export function merke(e: { route: string; titel: string; typ?: ZuletztTyp; zeit?: number }): boolean {
  const titel = saubererTitel(e.titel);
  if (titel === '' || !istMerkRoute(e.route)) return false;
  const route = kanonisierePfad(e.route);
  const ohne = holeMerkliste().filter((x) => x.route !== route);
  if (ohne.length >= MERKLISTE_MAX) return false;
  return speichere([{ route, titel, typ: e.typ ?? typVonRoute(route), zeit: e.zeit ?? 0 }, ...ohne]);
}

/** Entfernt eine Stelle. `true`, wenn der Aufruf durchlief. */
export function entferneMerkung(route: string): boolean {
  return speichere(holeMerkliste().filter((x) => x.route !== route));
}

/** Setzt die Merkung um; Rückgabe = «danach gemerkt?» (bei Fehlschlag der alte Stand). */
export function schalteMerkung(e: { route: string; titel: string; typ?: ZuletztTyp; zeit?: number }): boolean {
  if (istGemerkt(e.route)) entferneMerkung(e.route);
  else merke(e);
  return istGemerkt(e.route);
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
    const route = kanonisierePfad(z[0]);
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

/**
 * Übernimmt importierte Einträge: schon vorhandene Routen bleiben unangetastet
 * (der eigene Titel gewinnt), neue kommen hinter die eigenen — die Reihenfolge
 * des Links bleibt erhalten. Rückgabe: Zahl der neu hinzugekommenen Einträge
 * (`-1`, wenn der Speicher nichts annahm).
 */
export function uebernimmMerkliste(neu: readonly MerkEintrag[], zeit: number): number {
  const eigene = holeMerkliste();
  const vorhanden = new Set(eigene.map((e) => e.route));
  const dazu = neu.filter((e) => !vorhanden.has(e.route)).map((e) => ({ ...e, zeit }));
  if (dazu.length === 0) return 0;
  const gesamt = [...eigene, ...dazu].slice(0, MERKLISTE_MAX);
  if (!speichere(gesamt)) return -1;
  return gesamt.length - eigene.length;
}
