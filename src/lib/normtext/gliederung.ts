// ─── Gliederungs-Wahl der Gesetzes-Übersichten (A15, W2·5d) ───────────────────
//
// REINE DARSTELLUNG (§3): welche Ordnung die drei Säulen-Übersichten (Bund /
// Kantone / International) zeigen. KEINE Rechtslogik.
//
// David (A15, 5.7.2026): «jeweils bei der übersicht von gesetzen bund kantone
// international verschiedene übersichten … relevanz, systematisch, rechtsgebiet
// … user soll dann zwischen diesen gliederungen auswählen können.»
//
// EINE Wahl gilt für alle drei Säulen (ein Interaktions-Vokabular, konsistent
// mit dem A4-«Ansicht»-Muster). Quelle der Wahrheit mit klarer Rangfolge:
//   1. `?gliederung=` in der URL  → stabile, teilbare Deep-Links (A15).
//   2. localStorage `lm.gesetze.gliederung`  → persistente Nutzer-Wahl.
//   3. Default 'systematisch'  → die bisherige, amtliche Ordnung; hält die
//      prerenderte Sicht + die bestehenden e2e-/Golden-Kontrakte byte-gleich.
//
// PRE-PAINT (§15/G2a-Muster): der Store wird SYNCHRON aus localStorage gelesen
// (Lazy-`useState`-Initializer im Gesetze-Orchestrator, analog `?q=`), bevor der
// interaktive Baum das erste Mal paintet — kein Aufblitzen der Default-Ordnung.
// Ein Inline-Script im <head> ist nicht nötig (und CSP-verboten): der Übersichts-
// Inhalt hängt ohnehin am async geladenen Browse-Manifest, rendert also erst
// nach dem ersten Paint — die synchrone Store-Lesung genügt für Flash-Freiheit.

export type Gliederung = 'relevanz' | 'systematisch' | 'rechtsgebiet';

export const GLIEDERUNGEN: ReadonlyArray<{ id: Gliederung; label: string }> = [
  { id: 'relevanz', label: 'Relevanz' },
  { id: 'systematisch', label: 'Systematisch' },
  { id: 'rechtsgebiet', label: 'Rechtsgebiet' },
];

const GLIEDERUNG_DEFAULT: Gliederung = 'systematisch';

const KEY = 'lm.gesetze.gliederung';

function istGliederung(v: unknown): v is Gliederung {
  return v === 'relevanz' || v === 'systematisch' || v === 'rechtsgebiet';
}

/** Gespeicherte Wahl (localStorage) oder Default. SSR-sicher. */
function ladeGliederung(): Gliederung {
  if (typeof window === 'undefined') return GLIEDERUNG_DEFAULT;
  try {
    const roh = localStorage.getItem(KEY);
    return istGliederung(roh) ? roh : GLIEDERUNG_DEFAULT;
  } catch {
    // localStorage gesperrt (privater Modus) → Default.
    return GLIEDERUNG_DEFAULT;
  }
}

/** Persistiert die Wahl (best effort — bei gesperrtem Speicher nur für die Sitzung). */
export function speichereGliederung(g: Gliederung): void {
  try {
    localStorage.setItem(KEY, g);
  } catch {
    /* Speicher gesperrt — die Wahl gilt dann nur für die Sitzung (URL trägt sie). */
  }
}

/** Auflösung URL → Persistenz → Default (Rangfolge oben). Der URL-Parameter
 *  gewinnt, damit geteilte `?gliederung=`-Links stabil dieselbe Sicht zeigen. */
export function loeseGliederung(urlWert: string | null): Gliederung {
  return istGliederung(urlWert) ? urlWert : ladeGliederung();
}
