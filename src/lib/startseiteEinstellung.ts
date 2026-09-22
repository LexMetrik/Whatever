// ─── Startseiten-Anordnung: der Nutzer-Zustand des Pults (W2·24-R10) ────────
//
// SSoT des localStorage-Keys 'lexmetrik-startseite' (§5) — welche Module der
// Startseite ANGEZEIGT werden und in welcher REIHENFOLGE. Reines Speicher- und
// Ordnungs-Werkzeug (§3), KEINE Rechtslogik: gespeichert werden ausschliesslich
// Modul-Kürzel, nie Formularinhalte und nie ein Suchbegriff (Berufsgeheimnis,
// dieselbe Linie wie `lib/zuletztVerwendet.ts`).
//
// DETERMINISTISCH (§2): `mische()` ist eine reine Funktion — gleiche Vorgaben +
// gleicher Speicherstand ergeben immer dieselbe Anordnung. Kein Date.now(), kein
// Zufall, keine Heuristik. Die drei Regeln der Mischung sind bewusst gewählt und
// einzeln geprüft (`src/tests/startseiteEinstellung.test.ts`):
//
//   1. UNBEKANNTE Kürzel im Speicher fallen weg. Ein umbenanntes oder
//      gestrichenes Modul darf keine Geisterzeile erzeugen.
//   2. DOPPELTE Kürzel zählen einmal (das erste Vorkommen bestimmt den Platz).
//      Ein manipulierter oder halb geschriebener Speicher soll die Seite nicht
//      doppelt rendern.
//   3. NEUE Module (im Registry, nicht im Speicher) hängen sich HINTEN an und
//      tragen ihre Werkseinstellung. Sie erscheinen damit, ohne die vom Nutzer
//      gewählte Ordnung der bekannten Module anzurühren — die Alternative
//      («an der Registry-Position einfügen») müsste raten, wohin, sobald der
//      Nutzer umsortiert hat.
//
// PRERENDER: der Build hat kein localStorage → `werkSchnappschuss()` liefert die
// Werkseinstellung, und genau die steht im ausgelieferten HTML. Der Client liest
// beim ersten Render synchron nach (`useSyncExternalStore`, `pages/Startseite`).
// Die Speicher-Schnappschüsse sind darum REFERENZ-STABIL gecacht: React verlangt
// von `getSnapshot`, dass zwei Aufrufe ohne Änderung dasselbe Objekt liefern —
// sonst rendert es in einer Endlosschleife.

/** Was das Registry über ein Modul verrät, soweit die Anordnung es braucht. */
export interface StartModulVorgabe {
  id: string;
  /** Werkseinstellung: steht dieses Modul ohne eigene Wahl des Nutzers offen? */
  standard: boolean;
}

/** Ein Posten der Anordnung: Modul-Kürzel + Sichtbarkeit. */
export interface StartPosten {
  id: string;
  an: boolean;
}

/** Gestalt im Speicher — bewusst zwei flache Listen statt Objekte je Modul:
 *  so bleibt der Eintrag lesbar und ein Fremdschlüssel kann nichts überschreiben. */
interface Gespeichert {
  reihenfolge: string[];
  an: string[];
}

export const STARTSEITE_KEY = 'lexmetrik-startseite';

/** Reaktives Event im GLEICHEN Tab (Muster ZULETZT_EVENT); andere Tabs laufen
 *  über das native `storage`-Event. */
const STARTSEITE_EVENT = 'lm:startseite';

function hatSpeicher(): boolean {
  return typeof localStorage !== 'undefined';
}

// SPEICHER-ERSATZ (§6.7 — ein Schalter, der nichts tut, ist schlimmer als
// keiner): im privaten Modus, bei vollem Kontingent oder gesperrtem Speicher
// wirft localStorage. Ohne Ersatz bliebe «Ausblenden» dann WIRKUNGSLOS — die
// Seite läse nach dem Klick denselben alten Stand zurück. Die Anordnung lebt
// darum ab dem ersten Fehlschlag im Arbeitsspeicher weiter: sie überlebt keinen
// Neuladen mehr (das ist die ehrliche Grenze), aber sie wirkt.
let speicherOk = true;
let ersatz: string | null = null;

function rohLesen(): string | null {
  if (speicherOk && hatSpeicher()) {
    try {
      return localStorage.getItem(STARTSEITE_KEY);
    } catch {
      speicherOk = false;
    }
  }
  return ersatz;
}

/** Roh-String → geprüfte Gestalt; alles Unerwartete wird zu `null` (Werkseinstellung). */
export function auswerten(roh: string | null): Gespeichert | null {
  if (!roh) return null;
  try {
    const o: unknown = JSON.parse(roh);
    if (!o || typeof o !== 'object') return null;
    const r = (o as { reihenfolge?: unknown }).reihenfolge;
    const a = (o as { an?: unknown }).an;
    if (!Array.isArray(r) || !Array.isArray(a)) return null;
    return {
      reihenfolge: r.filter((s): s is string => typeof s === 'string'),
      an: a.filter((s): s is string => typeof s === 'string'),
    };
  } catch {
    return null;
  }
}

/** Die Werkseinstellung: Registry-Ordnung, `standard` entscheidet über an/aus. */
export function werkseinstellung(vorgaben: readonly StartModulVorgabe[]): StartPosten[] {
  return vorgaben.map((v) => ({ id: v.id, an: v.standard }));
}

/** Speicherstand + Registry → Anordnung. Rein und deterministisch (Regeln 1–3 oben). */
export function mische(vorgaben: readonly StartModulVorgabe[], roh: Gespeichert | null): StartPosten[] {
  if (!roh) return werkseinstellung(vorgaben);
  const bekannt = new Map(vorgaben.map((v) => [v.id, v]));
  const offen = new Set(roh.an);
  const gesehen = new Set<string>();
  const posten: StartPosten[] = [];
  for (const id of roh.reihenfolge) {
    if (!bekannt.has(id) || gesehen.has(id)) continue; // Regel 1 + 2
    gesehen.add(id);
    posten.push({ id, an: offen.has(id) });
  }
  for (const v of vorgaben) {
    if (!gesehen.has(v.id)) posten.push({ id: v.id, an: v.standard }); // Regel 3
  }
  return posten;
}

// ── Referenz-stabile Schnappschüsse für useSyncExternalStore ────────────────
let werkCache: StartPosten[] | null = null;
let rohCache: string | null = null;
let wertCache: StartPosten[] | null = null;

/** Server-/Prerender-Schnappschuss: immer die Werkseinstellung, stabile Referenz. */
export function werkSchnappschuss(vorgaben: readonly StartModulVorgabe[]): StartPosten[] {
  werkCache ??= werkseinstellung(vorgaben);
  return werkCache;
}

/** Client-Schnappschuss aus dem Speicher; unverändert → dieselbe Referenz. */
export function schnappschuss(vorgaben: readonly StartModulVorgabe[]): StartPosten[] {
  const roh = rohLesen();
  if (wertCache && roh === rohCache) return wertCache;
  rohCache = roh;
  wertCache = mische(vorgaben, auswerten(roh));
  return wertCache;
}

function melde(): void {
  try {
    window.dispatchEvent(new Event(STARTSEITE_EVENT));
  } catch {
    /* SSR / kein window */
  }
}

/** Anordnung schreiben. Speichert NUR Kürzel (s. Dateikopf). */
export function speichere(posten: readonly StartPosten[]): void {
  const wert: Gespeichert = {
    reihenfolge: posten.map((p) => p.id),
    an: posten.filter((p) => p.an).map((p) => p.id),
  };
  ersatz = JSON.stringify(wert);
  if (speicherOk && hatSpeicher()) {
    try {
      localStorage.setItem(STARTSEITE_KEY, ersatz);
    } catch {
      speicherOk = false; // ab jetzt gilt der Arbeitsspeicher-Ersatz
    }
  }
  melde();
}

/** «Werkseinstellung»: den Eintrag löschen, nicht die Vorgabe hineinschreiben —
 *  so folgt die Seite künftigen Änderungen an der Werkseinstellung weiter (§5). */
export function setzeZurueck(): void {
  ersatz = null;
  if (speicherOk && hatSpeicher()) {
    try {
      localStorage.removeItem(STARTSEITE_KEY);
    } catch {
      speicherOk = false;
    }
  }
  melde();
}

/** Abonnement für useSyncExternalStore: eigener Tab (Event) + fremder Tab (storage). */
export function abonniere(melden: () => void): () => void {
  window.addEventListener(STARTSEITE_EVENT, melden);
  window.addEventListener('storage', melden);
  return () => {
    window.removeEventListener(STARTSEITE_EVENT, melden);
    window.removeEventListener('storage', melden);
  };
}

// ── Reine Bearbeitungs-Schritte (testbar, ohne Speicher) ────────────────────

/** Ein Modul an-/ausschalten. Unbekanntes Kürzel → unveränderte Liste. */
export function schalte(posten: readonly StartPosten[], id: string): StartPosten[] {
  return posten.map((p) => (p.id === id ? { ...p, an: !p.an } : p));
}

/**
 * Ein Modul um einen Platz verschieben (`-1` hoch, `+1` runter).
 *
 * KEIN ZIEHEN (David-Vorgabe 6.9.2026): Pfeile sind tastatur- und
 * screenreader-bedienbar, ein Drag-and-Drop wäre es nur mit einer zweiten,
 * eigens gebauten Tastaturbedienung — also zwei Wahrheiten für eine Ordnung.
 * Am Rand der Liste passiert nichts (kein Umlauf: er verschöbe ein Modul über
 * die ganze Seite, was niemand mit einem Pfeilklick meint).
 */
export function verschiebe(posten: readonly StartPosten[], id: string, richtung: -1 | 1): StartPosten[] {
  const i = posten.findIndex((p) => p.id === id);
  if (i < 0) return [...posten];
  const j = i + richtung;
  if (j < 0 || j >= posten.length) return [...posten];
  const neu = [...posten];
  [neu[i], neu[j]] = [neu[j], neu[i]];
  return neu;
}

/** Steht die Anordnung auf Werkseinstellung? (Beschriftung/Zustand des Blatts.) */
export function istWerkseinstellung(vorgaben: readonly StartModulVorgabe[], posten: readonly StartPosten[]): boolean {
  const werk = werkseinstellung(vorgaben);
  return werk.length === posten.length
    && werk.every((w, i) => w.id === posten[i].id && w.an === posten[i].an);
}

/** NUR FÜR TESTS: den Modul-Zustand (Ersatzspeicher, Schnappschuss-Cache)
 *  zurücksetzen. Ohne das trüge ein Test den Cache des vorigen mit sich. */
export function __zustandVergessen(): void {
  speicherOk = true;
  ersatz = null;
  rohCache = null;
  wertCache = null;
  werkCache = null;
}
