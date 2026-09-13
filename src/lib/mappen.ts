import { tabSchluessel, type TabEintrag } from './tabs';

// ═══ W2·25 TEIL 2 · DIE ARBEITSMAPPE (Spec §7, §5a Ziff. 9) ═════════════════
//
// «Offene Reiter als benannte Mappe lokal speichern und öffnen, als Adresse
// teilbar — deterministisch (§2), ohne Konto, ohne Server.»
//
// WAS EINE MAPPE IST: eine Liste von `TabEintrag`, mehr nicht. Dieselben
// Felder wie `lexmetrik-tabs` — der Pfad INKLUSIVE `#art-…`-Anker (das ist die
// Lesestellung, §5a Ziff. 6) und `fest` (die Anheftung, Teil 1). Es gibt
// keinen zweiten Reiter-Begriff und keine zweite Identität: verglichen wird
// über `tabSchluessel` wie überall sonst (§5).
//
// BERUFSGEHEIMNIS — DIESELBE GRENZE WIE `lexmetrik-tabs`, NICHT WEITER:
// gespeichert werden AUSSCHLIESSLICH Navigationspfade, nie Formular- oder
// Falldaten. Das gilt doppelt, weil eine Mappen-ADRESSE weitergegeben wird:
// was in ihr steht, steht in jedem Chatfenster, durch das sie geht. Rechner-
// Eingaben liegen allerdings SCHON heute in der Adresse (`?e=5000&k=ZH`) und
// gehen mit dem Reiter mit — wer eine Mappe teilt, teilt sie mit. Das ist
// dieselbe Offenheit wie beim Kopieren einer Reiter-Adresse (R13-9) und wird
// im Dialog benannt, nicht weggeglättet (§8).
//
// KEIN ZEITSTEMPEL (§2, kein `Date.now()` in `src/lib`): die Liste steht
// alphabetisch nach Namen, und die Verdrängung am Deckel folgt der
// Einfügereihenfolge des Arrays — die Reihenfolge IST die Reihenfolge.
//
// KEIN NETZ, KEIN DIENST: weder Kürzungs-Dienst noch Ablage. Die Adresse ist
// die Mappe.

const KEY = 'lexmetrik-mappen';
/** Wie viele Mappen nebeneinander. Mehr als das ist kein Vorrat mehr, sondern
 *  eine Liste, die man durchsuchen müsste — und das Kontextmenü trägt sie
 *  dann nicht mehr. */
export const MAPPEN_MAX = 12;
/** Länge eines Mappennamens. Die Zeile im Menü trägt nicht mehr. */
export const NAME_MAX = 48;
/** Reiter je Mappe — dieselbe Grenze wie die Reiterliste selbst (`lib/tabs`). */
const REITER_MAX = 50;
/** Der Name des Adress-Parameters. Steht hier einmal (§5) — die Leiste, der
 *  Tracker und die Sonden lesen ihn von hier. */
export const MAPPE_PARAM = 'mappe';

export interface Mappe {
  name: string;
  reiter: TabEintrag[];
}

// ─── Kodierung für die Adresse ──────────────────────────────────────────────
//
// ZIEL: eine Adresse, die man ansieht und versteht. `URLSearchParams.set`
// erreicht das NICHT — es kodiert nach `application/x-www-form-urlencoded` und
// macht aus jedem `/` ein `%2F`; aus drei Reitern wird eine Zeile, in der kein
// Gesetzeskürzel mehr zu erkennen ist. Der Schrägstrich ist im Query-Teil
// erlaubt (RFC 3986, `pchar` schliesst `/` ein), also bleibt er stehen.
//
// WAS KODIERT WERDEN MUSS, und warum genau das: `#` beendete sonst die Query
// (der Rest wäre Fragment), `&` und `?` bräche sie auf, `,` wäre ein falscher
// Trenner. `encodeURIComponent` erledigt alle vier und lässt `/` als einziges
// wieder zurückzusetzendes Zeichen übrig.
//
// DER TRENNER IST `,` und nicht `||` wie beim Pane-Permalink (`?p=`): dort
// wird über `searchParams` geschrieben, also ohnehin alles kodiert (`|` →
// `%7C`), hier nicht — und sechs Zeichen je Fuge wären sichtbarer Ballast.
// `,` ist im Query-Teil erlaubt (sub-delim) und kommt in kodierten Pfaden
// nicht mehr vor.
//
// DIE ANHEFTUNG TRÄGT EIN `*` VOR DEM PFAD. Ein Pfad beginnt immer mit `/`,
// ein `*` an erster Stelle ist also nie mehrdeutig; `encodeURIComponent` lässt
// `*` unangetastet, es steht damit auch im Bild.

const TRENNER = ',';
const FEST_MARKE = '*';

const kodierePfad = (p: string): string => encodeURIComponent(p).replace(/%2F/g, '/');

/** Die Reiterfolge als Adress-Wert — roh, also NICHT noch einmal zu kodieren. */
export function kodiereMappe(reiter: readonly TabEintrag[]): string {
  return reiter
    .slice(0, REITER_MAX)
    .map((t) => (t.fest ? FEST_MARKE : '') + kodierePfad(t.path))
    .join(TRENNER);
}

/** Die Gegenrichtung. Unbrauchbare Einträge fallen einzeln weg (ein defekter
 *  Reiter macht eine Mappe nicht wertlos); bleibt nichts übrig, ist das
 *  Ergebnis leer und der Aufrufer übernimmt nichts. */
export function dekodiereMappe(wert: string): TabEintrag[] {
  const gesehen = new Set<string>();
  return wert.split(TRENNER)
    .map((roh): TabEintrag | null => {
      const fest = roh.startsWith(FEST_MARKE);
      const kern = fest ? roh.slice(FEST_MARKE.length) : roh;
      let pfad: string;
      try { pfad = decodeURIComponent(kern); } catch { return null; }
      // Nur app-eigene, absolute Pfade — eine Mappen-Adresse darf nicht zum
      // Werkzeug werden, mit dem man jemanden irgendwohin schickt (kein
      // `http(s)://`, kein protokollrelatives `//`).
      if (!pfad.startsWith('/') || pfad.startsWith('//')) return null;
      return { path: pfad, ...(fest ? { fest: true as const } : {}) };
    })
    .filter((t): t is TabEintrag => t !== null)
    .filter((t) => {
      const k = tabSchluessel(t.path);
      if (gesehen.has(k)) return false;
      gesehen.add(k);
      return true;
    })
    .slice(0, REITER_MAX);
}

/** Den ROHEN Wert eines Query-Parameters lesen — ausdrücklich ohne die
 *  Dekodierung von `URLSearchParams.get`: die machte aus dem kodierten Komma
 *  eines Rechner-Pfads (`%2C`) wieder ein `,` und damit einen Trenner, den es
 *  nicht gibt. Gelesen wird, was in der Zeile steht; dekodiert wird je
 *  Eintrag (oben). */
function rohParam(suche: string, name: string): string | null {
  for (const teil of suche.replace(/^\?/, '').split('&')) {
    const i = teil.indexOf('=');
    if (i !== -1 && teil.slice(0, i) === name) return teil.slice(i + 1);
  }
  return null;
}

/** Die Mappe aus einer Suchzeile (`window.location.search`) — `null`, wenn
 *  keine drinsteht oder nichts Brauchbares übrig bleibt. */
export function mappeAusSuche(suche: string): TabEintrag[] | null {
  const roh = rohParam(suche, MAPPE_PARAM);
  if (!roh) return null;
  const reiter = dekodiereMappe(roh);
  return reiter.length ? reiter : null;
}

/** Dieselbe Suchzeile ohne den Mappen-Parameter. Gebraucht an zwei Stellen:
 *  die Adresse wird nach dem Übernehmen aus der Zeile genommen (sonst zwänge
 *  jedes Neuladen dieselbe Mappe erneut auf — dieselbe Regel wie bei `?p=`,
 *  `usePaneLayout`), und der Reiter-Eintrag darf sie gar nicht erst tragen. */
export function ohneMappe(suche: string): string {
  const teile = suche.replace(/^\?/, '').split('&')
    .filter((t) => t !== '' && t.split('=')[0] !== MAPPE_PARAM);
  return teile.length ? `?${teile.join('&')}` : '';
}

/** Die teilbare Adresse zur gegebenen Reiterfolge: die AKTUELLE Seite plus den
 *  Mappen-Parameter. Wer sie öffnet, landet dort, wo der Absender stand, und
 *  bekommt dessen Leiste dazu.
 *
 *  Von Hand zusammengesetzt statt über `searchParams.set` — sonst kodierte der
 *  Setzer den ganzen Wert ein zweites Mal (Herleitung oben bei `kodierePfad`).
 *  Andere Parameter bleiben unangetastet. */
export function mappenAdresse(reiter: readonly TabEintrag[]): string {
  if (typeof window === 'undefined') return '';
  const u = new URL(window.location.href);
  const ohne = ohneMappe(u.search).replace(/^\?/, '');
  const query = [ohne, `${MAPPE_PARAM}=${kodiereMappe(reiter)}`].filter(Boolean).join('&');
  return `${u.origin}${u.pathname}?${query}${u.hash}`;
}

// ─── Der benannte Speicher ──────────────────────────────────────────────────

function schreibe(mappen: Mappe[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(mappen)); }
  catch { /* privater Modus — Mappen sind Komfort, kein Datenverlust */ }
}

/** Alle Mappen, alphabetisch nach Namen (§2: eine feste Ordnung ohne Uhr).
 *  Korruptes oder fremdes JSON ergibt eine leere Liste, nie einen Absturz. */
export function ladeMappen(): Mappe[] {
  try {
    const roh = localStorage.getItem(KEY);
    const arr = roh ? JSON.parse(roh) : [];
    if (!Array.isArray(arr)) return [];
    const namen = new Set<string>();
    return arr
      .filter((m): m is Mappe =>
        !!m && typeof m.name === 'string' && m.name.trim() !== ''
        && Array.isArray(m.reiter) && m.reiter.length > 0
        && m.reiter.every((t: unknown) =>
          !!t && typeof (t as TabEintrag).path === 'string'
          && (t as TabEintrag).path.startsWith('/')))
      .map((m): Mappe => ({
        name: m.name.trim().slice(0, NAME_MAX),
        reiter: m.reiter.slice(0, REITER_MAX).map(({ path, fest }): TabEintrag => ({
          path,
          ...(fest === true ? { fest: true } : {}),
        })),
      }))
      .filter((m) => {
        if (namen.has(m.name)) return false;
        namen.add(m.name);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  } catch { return []; }
}

/** Eine Mappe beim Namen — `null`, wenn es sie nicht (mehr) gibt. */
export function mappeMitNamen(name: string): Mappe | null {
  const gesucht = name.trim();
  return ladeMappen().find((m) => m.name === gesucht) ?? null;
}

/** Speichern unter diesem Namen. Gleicher Name = ÜBERSCHREIBEN, nicht
 *  verdoppeln: der Name ist die Identität der Mappe, und zwei «Fall Meier»
 *  wären für jede Aktion mehrdeutig (§5, dieselbe Regel wie bei
 *  `tabSchluessel`). Ein leerer Name oder eine leere Reiterfolge legt nichts
 *  an — eine Mappe ohne Inhalt wäre eine Zusage, die nichts hält (§8). */
export function speichereMappe(name: string, reiter: readonly TabEintrag[]): void {
  const sauber = name.trim().slice(0, NAME_MAX);
  if (!sauber || reiter.length === 0) return;
  const inhalt = reiter.slice(0, REITER_MAX).map(({ path, fest }): TabEintrag => ({
    path,
    ...(fest ? { fest: true as const } : {}),
  }));
  // Reihenfolge im SPEICHER ist die Einfügereihenfolge (die Anzeige sortiert
  // `ladeMappen` alphabetisch): nur so weiss der Deckel unten, welche Mappe
  // die älteste ist, ohne eine Uhr zu befragen (§2).
  const roh = (() => {
    try {
      const a = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      return Array.isArray(a) ? (a as Mappe[]) : [];
    } catch { return []; }
  })();
  const ohneGleichnamige = roh.filter((m) => m?.name?.trim?.() !== sauber);
  const naechste = [...ohneGleichnamige, { name: sauber, reiter: inhalt }];
  schreibe(naechste.slice(-MAPPEN_MAX));
}

/** Eine Mappe löschen. Ein unbekannter Name tut nichts — nie ein stiller
 *  Treffer auf die falsche Zeile. */
export function loescheMappe(name: string): void {
  const gesucht = name.trim();
  const roh = (() => {
    try {
      const a = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      return Array.isArray(a) ? (a as Mappe[]) : [];
    } catch { return []; }
  })();
  schreibe(roh.filter((m) => m?.name?.trim?.() !== gesucht));
}
