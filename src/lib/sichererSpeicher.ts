// SSoT des Browserspeicher-Zugriffs der ganzen App (§5; W2·17-UI-BEFUNDE BG-01,
// 2.10.2026). Reine Hilfsschicht, keine Fachlogik.
//
// BEFUND (Finder-Bug-Check G, gemessen): bei gesperrtem Speicher (Chrome «Alle
// Cookies blockieren», Safari-Richtlinie, Kontext ohne Speicher-Recht) WIRFT
// schon das blosse Lesen der Eigenschaft `window.localStorage` einen
// SecurityError — nicht erst `getItem`. Zwei Sorten Fehlstellen führten dazu in
// den weissen Bildschirm: Lesezugriffe in useState-Initialisierern ohne
// try/catch (useSeitenleiste, lesePosition) und `typeof localStorage`-Wächter
// AUSSERHALB ihres try (zuletztVerwendet) — `typeof` auf eine wurfwillige
// Eigenschaft wirft selbst. Dutzende verstreute try/catch-Kopien (je mit
// eigener Lücke) waren die Wurzel; hier steht genau EINE Stelle.
//
// VERTRAG: nichts in dieser Datei wirft je.
//   · `lies` → Wert oder `null` (fehlender Schlüssel UND nicht verfügbarer
//     Speicher sind für den Aufrufer gleich: «kein gespeicherter Stand»).
//   · `schreib` / `entferne` → `true` bei Erfolg, `false` sonst (gesperrt,
//     Quote, Prerender-Node ohne Speicher). Die Rückgabe darf ignorieren, wer
//     den Speicher als blosse Bequemlichkeit führt (so ist es fast überall).
//   · Der Speicher wird bei JEDEM Aufruf neu aufgelöst (`globalThis`), nicht
//     einmal beim Modulstart: Tests tauschen ihn per stubGlobal/defineProperty
//     aus, und ein Browser kann ihn nach dem Laden sperren.
//
// TOR: `src/tests/sicherer-speicher-tor.test.ts` verbietet jeden direkten
// Zugriff auf `localStorage`/`sessionStorage` ausserhalb dieser Datei.

type Art = 'lokal' | 'sitzung';

/** Der Speicher oder `null`. Schon das Lesen der Eigenschaft kann werfen.
 *  Öffentlich nur für Aufrufer, die einen Speicher als PARAMETER annehmen (Test-
 *  Einspeisung, `blattGedaechtnis`/`gliederungGedaechtnis`); sie müssen das
 *  Objekt selbst wurfsicher benutzen — alle anderen nehmen `lokalSpeicher`. */
export function aufloesen(art: Art): Storage | null {
  try {
    const s = art === 'lokal' ? globalThis.localStorage : globalThis.sessionStorage;
    if (s) return s;
    // Testumgebungen ohne jsdom stubben mitunter nur `window.<speicher>`.
    const w = (globalThis as { window?: Window }).window;
    const ws = w ? (art === 'lokal' ? w.localStorage : w.sessionStorage) : null;
    return ws ?? null;
  } catch {
    return null;
  }
}

export interface SichererSpeicher {
  /** Gespeicherter Wert; `null` bei fehlendem Schlüssel ODER nicht verfügbarem Speicher. */
  lies(key: string): string | null;
  /** `true`, wenn geschrieben wurde. Wirft nie. */
  schreib(key: string, wert: string): boolean;
  /** `true`, wenn der Aufruf durchlief. Wirft nie. */
  entferne(key: string): boolean;
  /** Alle Schlüssel (leer bei nicht verfügbarem Speicher). */
  schluessel(): string[];
}

function bauen(art: Art): SichererSpeicher {
  return {
    lies(key) {
      try {
        return aufloesen(art)?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    schreib(key, wert) {
      try {
        const s = aufloesen(art);
        if (!s) return false;
        s.setItem(key, wert);
        return true;
      } catch {
        return false;
      }
    },
    entferne(key) {
      try {
        const s = aufloesen(art);
        if (!s) return false;
        s.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
    schluessel() {
      try {
        const s = aufloesen(art);
        if (!s) return [];
        const aus: string[] = [];
        for (let i = 0; i < s.length; i++) {
          const k = s.key(i);
          if (k !== null) aus.push(k);
        }
        return aus;
      } catch {
        return [];
      }
    },
  };
}

/** `localStorage` — bleibt über Sitzungen hinweg. */
export const lokalSpeicher: SichererSpeicher = bauen('lokal');

/** `sessionStorage` — gilt für diesen Tab-Besuch. */
export const sitzungsSpeicher: SichererSpeicher = bauen('sitzung');
