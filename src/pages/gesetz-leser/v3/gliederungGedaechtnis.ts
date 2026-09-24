// ─── Entscheid David 24.9.2026 · DIE EINGEKLAPPTE GLIEDERUNG BLEIBT EINGEKLAPPT ─
//
// Auswahlfrage «Gliederung eingeklappt merken» = Ja: «eingeklappt bleibt
// eingeklappt, auch beim nächsten Gesetz». Seither steht die Nutzerwahl
// ERLASSÜBERGREIFEND in `localStorage` — anders als das Erlass-Blatt
// (`./blattGedaechtnis`: je Erlass, je Tab, nur bei Rückkehr), weil hier eine
// Vorliebe für die Arbeitsfläche gemerkt wird, keine Lage in einem Erlass.
//
// WAS GEMERKT WIRD: nur die Geste des Nutzers (Kopf-Griff, Schiene, ☰ ab
// 1024 — `LeserRahmenV3.setzeTocOffen`). NICHT gemerkt: das transiente Weichen
// vor dem offenen Blatt (abgeleitet in `./rahmenSpalten`, nie Zustand) und das
// Einklappen kurzer Erlasse (`leserV3Modell`, `leisteStartetZu`).
//
// WANN GELESEN: im ersten Client-Render (lazy Initializer in
// `../inhalt-zustand.tsx`) — der Leser mountet per `createRoot`, nicht per
// Hydration (§15.5); die Spuren stehen darum vom ersten Bild an richtig, und
// es springt nichts (CLS 0, `leser-v3-kontext-cls` (c)).
//
// ROBUST STATT STRENG (wie `./blattGedaechtnis`): Speicher kann fehlen oder
// werfen (privates Fenster, gesperrte Website-Daten) — dann gilt «offen».

const SCHLUESSEL = 'lm-leser-gliederung';
const ZU = 'zu';

type Lesend = Pick<Storage, 'getItem'>;
type Schreibend = Pick<Storage, 'setItem' | 'removeItem'>;

/** Hat der Nutzer die Gliederung zuletzt eingeklappt? */
export function gliederungGemerktZu(speicher: Lesend | null = lokal()): boolean {
  try {
    return speicher?.getItem(SCHLUESSEL) === ZU;
  } catch {
    return false;
  }
}

/** Merkt die Wahl; «offen» ist der Ausgangszustand und löscht den Eintrag. */
export function merkeGliederung(offen: boolean, speicher: Schreibend | null = lokal()): void {
  try {
    if (offen) speicher?.removeItem(SCHLUESSEL);
    else speicher?.setItem(SCHLUESSEL, ZU);
  } catch {
    // Quote/gesperrt: Bequemlichkeit, kein Datum.
  }
}

function lokal(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
