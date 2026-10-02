import { useCallback, useEffect, useState } from 'react';
import { lokalSpeicher } from '../../lib/sichererSpeicher';

// ─── Schriftskala „A− / A+" (persistent, global) ───────────────────────────
//
// R3 (Auftrag David 30.6.2026): ersetzt den früheren Inhaltsbreite-Umschalter
// (kompakt/breit). Ein +/−-Steller skaliert die Wurzel-Schriftgrösse (html
// `font-size` in %), wodurch ALLE rem-basierten Tokens (§13) proportional
// mitwachsen — Schrift UND Abstände, site-weit. Weil Schrift und Lesespalten-
// Maximalbreite (`max-w-reading`/`max-w-content`) im selben rem-Faktor wachsen,
// bleibt die Zeichen-pro-Zeile-Länge konstant; der Text wird nur grösser.
//
// Prozent statt fixer px: so bleibt die eigene Browser-Schriftgrösse des Nutzers
// (Barrierefreiheit, WCAG 1.4.4) als Basis erhalten. Default 1.0 (= 100 %, KEIN
// inline-Stil) ⇒ heutige Darstellung byte-gleich (Golden-neutral, §6). Die
// Breakpoints (Tailwind lg etc.) sind px-basiert und verschieben sich NICHT.
//
// SSR/Prerender-sicher: Initialwert über typeof-window-Guard; der Prerender
// trägt keinen inline-font-size → Default. Erst der Client wendet die
// gespeicherte Wahl an (createRoot render-then-replace, keine Hydration → kein
// Mismatch). Die Wahl wird in localStorage gespiegelt (über Sitzungen/Reloads).

const SKALA_KEY = 'lexmetrik-schriftskala';

// Diskrete Stufen (rem-Faktor). 1.0 = Default = heutige Grösse. Bewusst eng
// (0.9–1.4), damit Tap-Ziele und Layout nicht brechen (§13/F1).
const STUFEN = [0.9, 1.0, 1.1, 1.2, 1.3, 1.4] as const;
const DEFAULT_FAKTOR = 1.0;

/** Index der Stufe, die `faktor` am nächsten liegt (robust gegen Altwerte). */
function stufeIndex(faktor: number): number {
  let beste = 0;
  let besteDist = Infinity;
  for (let i = 0; i < STUFEN.length; i++) {
    const d = Math.abs(STUFEN[i] - faktor);
    if (d < besteDist) { besteDist = d; beste = i; }
  }
  return beste;
}

function ladeFaktor(): number {
  if (typeof window === 'undefined') return DEFAULT_FAKTOR;
  // Lesen wie Schreiben in try/catch: getItem wirft SecurityError, wenn der
  // Speicher per Browser-Policy gesperrt ist (z. B. «alle Cookies blockieren»).
  // Ohne Fang würde der useState-Initialisierer werfen und die App weiss-
  // bildschirmen — daher Fallback auf den Default, auf die nächste Stufe gesnappt.
  try {
    const roh = lokalSpeicher.lies(SKALA_KEY);
    if (roh == null) return DEFAULT_FAKTOR;
    const n = Number(roh);
    return Number.isFinite(n) ? STUFEN[stufeIndex(n)] : DEFAULT_FAKTOR;
  } catch { return DEFAULT_FAKTOR; }
}

/**
 * Wendet die gespeicherte Schriftskala VOR dem ersten Render an (Aufruf in
 * main.tsx, analog `wendeThemaAn`) — so blitzt für Nutzer mit eigener Wahl nicht
 * kurz die Default-Grösse auf. Default 1.0 ⇒ kein inline-Stil (byte-gleich). Der
 * Hook-Effekt hält den Wert danach zur Laufzeit synchron.
 */
export function wendeSchriftskalaAn(): void {
  if (typeof document === 'undefined') return;
  const f = ladeFaktor();
  const el = document.documentElement;
  if (f === DEFAULT_FAKTOR) el.style.removeProperty('font-size');
  else el.style.fontSize = `${Math.round(f * 100)}%`;
}

export interface Schriftskala {
  /** Aktueller rem-Faktor (eine der STUFEN). */
  faktor: number;
  /** Anzeigewert in Prozent (gerundet), z. B. 110. */
  prozent: number;
  /** Eine Stufe grösser (no-op am oberen Anschlag). */
  groesser: () => void;
  /** Eine Stufe kleiner (no-op am unteren Anschlag). */
  kleiner: () => void;
  kannGroesser: boolean;
  kannKleiner: boolean;
}

export function useSchriftskala(): Schriftskala {
  const [faktor, setFaktor] = useState(ladeFaktor);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const el = document.documentElement;
      // Default: inline-Stil ENTFERNEN (nicht «100%» setzen), damit die
      // Darstellung byte-gleich der heutigen bleibt und die Browser-Basis greift.
      if (faktor === DEFAULT_FAKTOR) el.style.removeProperty('font-size');
      else el.style.fontSize = `${Math.round(faktor * 100)}%`;
    }
    lokalSpeicher.schreib(SKALA_KEY, String(faktor)); // Speicher gesperrt — Zustand bleibt nur für die Sitzung
  }, [faktor]);

  const groesser = useCallback(() => setFaktor((f) => STUFEN[Math.min(STUFEN.length - 1, stufeIndex(f) + 1)]), []);
  const kleiner = useCallback(() => setFaktor((f) => STUFEN[Math.max(0, stufeIndex(f) - 1)]), []);

  const i = stufeIndex(faktor);
  return {
    faktor,
    prozent: Math.round(faktor * 100),
    groesser,
    kleiner,
    kannGroesser: i < STUFEN.length - 1,
    kannKleiner: i > 0,
  };
}
