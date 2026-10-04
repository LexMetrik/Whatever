import { lokalSpeicher } from './sichererSpeicher';
// ─── «Zuletzt verwendet»-Tracker (Startseite V3, Modul #5 · UI-NAV O1) ──────
//
// SSoT des localStorage-Keys 'lexmetrik-zuletzt' (§5) — die EINE Verlauf-Quelle
// der App (kein Parallel-Store). Reines Speicher-Werkzeug (§3), KEINE Rechtslogik:
// die zuletzt besuchten Inhalts-Routen (Rechner, Vorlagen, Gesetze, Entscheide,
// Materialien) als Verlauf-Quelle für Startseiten-Chips, den ⌘K-Leerzustand und
// den Topbar-Verlauf. Gespeichert wird NUR der Navigationspfad + ein aufgelöstes
// Anzeige-Label + ein Inhalts-Typ (für das Typ-Icon) + ein Zeitstempel — NIE
// Formularinhalte (Berufsgeheimnis; navigationsbasiert wie lib/tabs.ts).
//
// Reihenfolge = neueste zuerst über die Array-Position (dedupe je route: alten
// Eintrag entfernen, neuen vorne einreihen) — das ist deterministisch und braucht
// KEIN Date.now(). Der `zeit`-Wert ist reine Anzeige-/Ordnungs-Metadaten (kein
// §2-Rechenwert) und wird darum von der Aufrufer-Schicht (ZuletztTracker in
// components/, wo Date.now() erlaubt ist) hereingereicht — die ESLint-§2-Sperre
// verbietet Date.now() in src/lib.
//
// SSR-sicher + defensiv: kein localStorage im Prerender-Node (Guard + try/catch);
// ein Tracker ist Komfort und darf nie eine Seite zerlegen.

/** Inhalts-Typ eines Verlauf-Eintrags — steuert nur das Anzeige-Icon (§3). */
export type ZuletztTyp = 'rechner' | 'vorlage' | 'gesetz' | 'entscheid' | 'material' | 'seite';

export interface ZuletztEintrag {
  route: string;
  titel: string;
  /** Inhalts-Typ für das Anzeige-Icon; aus der Route abgeleitet (typVonRoute). */
  typ: ZuletztTyp;
  /** Anzeige-/Ordnungs-Metadaten (ms seit Epoch); 0 wenn nicht mitgegeben. */
  zeit: number;
}

const KEY = 'lexmetrik-zuletzt';
// Kappung auf 12 (UI-NAV O1): der Topbar-Verlauf gruppiert nach heute/gestern/
// früher und braucht mehr als die 6 Startseiten-Chips, um nützlich zu sein. Die
// Chip-/Leerzustand-Konsumenten slicen selbst auf ihre eigene Anzeige-Zahl.
const MAX = 12;

/** Reaktives Event: bei jeder Schreiboperation im GLEICHEN Browser-Tab gefeuert,
 *  damit der Topbar-Verlauf live nachzieht (Muster TABS_EVENT). Anderer Tab läuft
 *  über das native `storage`-Event. */
export const ZULETZT_EVENT = 'lm:zuletzt';

/** Inhalts-Typ aus dem Navigationspfad ableiten (§2 deterministisch). Erste
 *  Pfadebene entscheidet; unbekannte Route → 'seite' (generisches Icon), damit
 *  kein gültiger Eintrag stillschweigend verworfen wird. */
export function typVonRoute(route: string): ZuletztTyp {
  const seg = route.split(/[?#]/)[0].split('/').filter(Boolean)[0];
  switch (seg) {
    case 'rechner': return 'rechner';
    case 'vorlagen': return 'vorlage';
    case 'gesetze': return 'gesetz';
    case 'rechtsprechung': return 'entscheid';
    case 'materialien': return 'material';
    default: return 'seite';
  }
}

/** Die zuletzt besuchten Einträge, neueste zuerst, gekappt auf MAX. Alt-Einträge
 *  ohne `typ` (frühere Fassung) werden aus der Route migriert (kein Verwerfen). */
export function holeZuletzt(): ZuletztEintrag[] {
  try {
    const roh = lokalSpeicher.lies(KEY);
    const arr = roh ? JSON.parse(roh) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((e): e is { route: string; titel: string; typ?: unknown; zeit: number } =>
        !!e && typeof e.route === 'string' && typeof e.titel === 'string' && typeof e.zeit === 'number')
      .map((e) => ({
        route: e.route,
        titel: e.titel,
        typ: istTyp(e.typ) ? e.typ : typVonRoute(e.route),
        zeit: e.zeit,
      }))
      .slice(0, MAX);
  } catch {
    return [];
  }
}

const TYP_WERTE: readonly ZuletztTyp[] = ['rechner', 'vorlage', 'gesetz', 'entscheid', 'material', 'seite'];
function istTyp(v: unknown): v is ZuletztTyp {
  return typeof v === 'string' && (TYP_WERTE as readonly string[]).includes(v);
}

function melde(): void {
  try { window.dispatchEvent(new Event(ZULETZT_EVENT)); } catch { /* SSR / kein window */ }
}

/** Merkt einen Besuch: dedupe je route (alter Eintrag raus), neuester nach vorn,
 *  auf MAX gekappt. `typ` optional → aus der Route abgeleitet; `zeit` optionale
 *  Metadaten (Default 0) — s. Kopfkommentar. */
export function merkeBesuch({ route, titel, typ, zeit }: { route: string; titel: string; typ?: ZuletztTyp; zeit?: number }): void {
  if (!route || !titel) return; // ohne auflösbaren Titel kein Chip (§8: kein Rohpfad)
  const ohne = holeZuletzt().filter((e) => e.route !== route);
  const neu: ZuletztEintrag = { route, titel, typ: typ ?? typVonRoute(route), zeit: zeit ?? 0 };
  // Kein Speicher / Quota → false: «Zuletzt» ist reiner Komfort, kein Event.
  if (lokalSpeicher.schreib(KEY, JSON.stringify([neu, ...ohne].slice(0, MAX)))) melde();
}

/** Leert den Verlauf komplett (Topbar-Verlauf «Verlauf leeren»). */
export function leereZuletzt(): void {
  if (lokalSpeicher.entferne(KEY)) melde();
}
