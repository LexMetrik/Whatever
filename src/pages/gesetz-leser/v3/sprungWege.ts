import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { holeLeserAnsicht } from '../leserOptionen';
import { einzelSprungAdresse, tokenAusHash } from './einzelModus';

// ═══ W2·17-UI-BEFUNDE · DIE ZWEI HILFEN DES ARTIKEL-SPRUNGS ═════════════════
//
// Aus `./leserV3Modell.ts` herausgezogen (Schlankheits-Sonde: der Adapter steht bei
// 420/420) und zugleich der Ort, an dem der Befund-Cluster «Navigation im
// Einzelmodus» (1.10.2026) seine EINE Weiche bekommt. Reine Verdrahtung, keine
// Rechtsregel (§3): welche Adresse gilt, entscheidet `./einzelModus` (§5).

/**
 * Das Zeichen im Router-Zustand: «der Sprung ist vollzogen». Bei jeder Navigation mit
 * `#art-` wiederholt der Nachlauf-Effekt in `../inhalt-sprung.tsx` (Gegenstück dort, derselbe
 * Schlüssel) den Sprung — er würde die Suche ein zweites Mal beenden (Landkarte,
 * PE-B12-B02) und über den Fundstellen-Scroll hinwegscrollen (PE-C3-B02).
 */
const SPRUNG_ERLEDIGT = { sprungErledigt: true } as const;

/**
 * Der Einzelmodus-Zweig des Artikel-Sprungs: navigiert über den ROUTER und meldet,
 * ob er das getan hat (`false` ⇒ Gesamtansicht oder eine Fläche, die die Adresse nicht führt
 * — das zweite Fenster —, der Aufrufer macht, was er immer machte).
 *
 * `navigate` (also `pushState`) und nicht `replaceState`, aus demselben Grund wie
 * beim Blättern (`./useEinzelModus`, Datei-Kopf): jeder Sprung ist hier eine
 * ausdrückliche Geste, und «Zurück» soll zum vorigen Artikel führen. Gelesen wird die
 * Adresse und die gemerkte Wahl ZUM ZEITPUNKT DES SPRUNGS — der Callback hängt
 * dadurch nicht an der Location und baut sich nicht bei jedem Blättern neu.
 */
export function useEinzelSprung(basisPfad: string, fuehrtAdresse: boolean): {
  /** Gilt gerade der Einzelmodus auf dieser Fläche? (Gelesen zum Zeitpunkt des Aufrufs.) */
  imEinzel: () => boolean;
  /** Der Sprung selbst: `true`, wenn der Router navigiert hat (oder schon dort steht). */
  navigiere: (token: string) => boolean;
} {
  const navigate = useNavigate();
  return useMemo(() => {
    const adresse = (token: string) => (!fuehrtAdresse || typeof window === 'undefined' ? null
      : einzelSprungAdresse(basisPfad, window.location.search, holeLeserAnsicht(), token));
    return {
      imEinzel: () => adresse('') !== null,
      navigiere: (token: string) => {
        const ziel = adresse(token);
        if (ziel === null) return false;
        // Steht die Adresse schon dort, bleibt der Verlauf, wie er ist (kein doppelter Eintrag).
        if (tokenAusHash(window.location.hash) !== token) navigate(ziel, { state: SPRUNG_ERLEDIGT });
        return true;
      },
    };
  }, [basisPfad, fuehrtAdresse, navigate]);
}

/** Die Uhr des Zeitplans — in der Seite Browser-Timer, in der Sonde eine falsche Uhr. */
export interface ZeitplanUhr {
  rahmen: (fn: () => void) => number;
  rahmenAbbruch: (id: number) => void;
  zeit: (fn: () => void, ms: number) => number;
  zeitAbbruch: (id: number) => void;
}

/**
 * Der Zeitplan EINES Sprungs: nach einem Frame + 110 ms der erste Scroll, 400 ms später
 * der Korrektur-Scroll samt Freigabe (`danach`). Ein NEUER Sprung verwirft den noch
 * laufenden — PE-B10-B03: der Korrektur-Scroll des ersten Sprungs riss die Ansicht
 * nach dem zweiten zurück (498 ms art-10 · 831 art-60 · 1018 art-10, VWVG, zwei
 * Sprünge 200 ms hintereinander). Beide Schritte des verworfenen Sprungs fallen weg,
 * auch seine Freigabe — der neue Sprung gibt am Ende selbst frei.
 */
export function erzeugeSprungZeitplan(uhr: ZeitplanUhr): {
  plane: (erst: () => void, danach: () => void) => void;
  abbrechen: () => void;
} {
  let rahmen: number | null = null;
  let zeit: number | null = null;
  const abbrechen = () => {
    if (rahmen !== null) uhr.rahmenAbbruch(rahmen);
    if (zeit !== null) uhr.zeitAbbruch(zeit);
    rahmen = null;
    zeit = null;
  };
  const plane = (erst: () => void, danach: () => void) => {
    abbrechen();
    rahmen = uhr.rahmen(() => {
      zeit = uhr.zeit(() => {
        erst();
        zeit = uhr.zeit(danach, 400);
      }, 110);
    });
  };
  return { plane, abbrechen };
}

const BROWSER_UHR: ZeitplanUhr = {
  rahmen: (fn) => window.requestAnimationFrame(fn),
  rahmenAbbruch: (id) => window.cancelAnimationFrame(id),
  zeit: (fn, ms) => window.setTimeout(fn, ms),
  zeitAbbruch: (id) => window.clearTimeout(id),
};

/**
 * Der Zeitplan des Artikel-Sprungs, an die Lebenszeit der Fläche gebunden: ein neuer Sprung
 * verwirft den laufenden (PE-B10-B03), und beim Abbau läuft nichts mehr gegen ein abgehängtes
 * Element. Was bei den zwei Schritten passiert (Scroll, Lock lösen), sagt der Aufrufer.
 */
export function useSprungZeitplan(): (erst: () => void, danach: () => void) => void {
  const zeitplanRef = useRef<ReturnType<typeof erzeugeSprungZeitplan> | null>(null);
  useEffect(() => () => zeitplanRef.current?.abbrechen(), []);
  return useCallback((erst: () => void, danach: () => void) => {
    zeitplanRef.current ??= erzeugeSprungZeitplan(BROWSER_UHR);
    zeitplanRef.current.plane(erst, danach);
  }, []);
}
