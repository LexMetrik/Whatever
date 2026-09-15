import { useEffect, useState } from 'react';
import { waehleBegruessungFuerBuild } from '../../lib/begruessungen';

// ─── Begrüssung und Tagesdatum der Startseite (W2·23-STARTSEITE-V4 §4) ──────
//
// W2·24-R3: aus der Zeile «Gruss + Datum» ist ein HOOK geworden. Grund ist der
// Satzspiegel: der Gruss steht in der Textspalte (kursive Literata), Wochentag
// und Datum stehen in der Marginalie links — zwei Orte, EINE Uhrzeit. Genau
// dafür braucht es den gemeinsamen Aufruf; zwei Komponenten mit je eigenem
// `new Date()` könnten (nachts, an der Monatsgrenze) auseinanderlaufen.
// Wortlaut, Pool und Zufallsquelle sind unverändert.
//
// ZUFALL, bewusst UND an der richtigen Schicht (Auftrag David 5.9.2026
// «verschiedene Begrüssungen … etwas persönlicher»): der Gruss wechselt
// weiterhin zufällig, seit QS-PERF (15.9.2026) aber pro DEPLOY statt pro
// Besuch, UND (Nachbesserung selber Tag) aus dem tageszeit-NEUTRALEN
// `IMMER`-Pool statt aus einem Tageszeit-Fenster — der Build-Zeitpunkt ist
// kein verlässlicher Bezug zur Uhrzeit des Besuchs (ein um 09:00 gebauter
// Stand könnte sonst um 09:00 real einen Abend-Gruss zeigen). S.
// `waehleBegruessungFuerBuild` in `lib/begruessungen.ts` für den Befund
// (Prerender/Client zogen bis dahin je einen EIGENEN Zufallswert, die
// grösste Zeile der Seite tauschte nach dem JS-Download, Lighthouse mass das
// als LCP bei 9.4 s) und die Begründung der Produkt-Nuance. CLAUDE.md §2 ist
// nicht berührt: die Regel bindet die ENGINES (gleiche Eingabe → gleiche
// Frist, gleicher Betrag); diese Zeile trägt keinen Rechtswert und geht in
// keine Berechnung ein.
//
// PRERENDER: `gruss` ist jetzt bei GLEICHEM Build-Seed (`VITE_BUILD_ID`)
// zwischen Prerender und Client identisch (Bauregel 2 «Client-Initialstate
// auf den Server-Zustand pinnen») — kein Tausch mehr. `datum`/`wochentag`
// bleiben live (echte Uhrzeit des Aufrufs) und divergieren wie bisher
// zwischen Build und Client; sie tragen darum weiterhin ehrlich
// `suppressHydrationWarning` (kleine Nebenzeile, nicht die LCP-h1). Ein
// min-height braucht `gruss` nicht: die Pool-Datei hält jeden Eintrag unter
// GRUSS_MAX_ZEICHEN (30), der Gruss bleibt also auch auf 390 px einzeilig
// (§15: kein Layout-Sprung, weil die Umbruchstelle nicht vom gezogenen Gruss
// abhängt).

// Datum «5. September 2026» + Wochentag getrennt — deterministisch ohne
// Locale-Abhängigkeit (SSR-stabil, keine Intl-Überraschungen zwischen Node und
// Browser).
const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export interface Heute {
  /** Gezogener Gruss aus dem Pool (`lib/begruessungen.ts`). */
  gruss: string;
  /** «Samstag» */
  wochentag: string;
  /** «5. September 2026» */
  datum: string;
  /** «14:32» — `null` vor der Hydration (Prerender UND erster Client-Render,
   *  s. `uhrzeit()` unten), danach jede Minute nachgeführt. NIE im
   *  Server-HTML: SuchBlock reserviert dafür Platz, statt ihn erst beim
   *  Erscheinen zu öffnen (§15, CLS 0). */
  uhrzeit: string | null;
}

// Build-Seed für `waehleBegruessungFuerBuild` — dieselbe Kennung, die
// `components/fehlermeldung.ts` schon für die Fehlerkanal-Zuordnung liest
// (§5, Single Source): Vercel-Commit-SHA (vite.config.ts `define`), sonst
// 'dev'. Identisch für `vite build` (Client-Bundle) UND
// `vite-node scripts/prerender.ts` (derselbe Vite-`define`, beide Schritte
// desselben `npm run build`-Aufrufs) — NIE eine Uhrzeit, die zwischen den
// zwei Prozessen leicht auseinanderliefe.
const BUILD_SEED = (import.meta.env?.VITE_BUILD_ID as string | undefined) ?? 'dev';

const pad = (n: number) => String(n).padStart(2, '0');

/** «14:32», 24-Stunden, ohne Locale-Abhängigkeit (wie Wochentag/Datum oben). */
function uhrzeit(jetzt: Date): string {
  return `${pad(jetzt.getHours())}:${pad(jetzt.getMinutes())}`;
}

/** Gruss, Wochentag und Datum aus EINER Uhrzeit (einmal beim Mount, lazy init).
 *
 *  UHRZEIT SEPARAT (D39, David 7.9.2026 «datum und uhrzeit»): Gruss/Wochentag/
 *  Datum bleiben wie bisher EIN Bild vom Mount-Zeitpunkt (§4-Kommentar oben —
 *  sie sollen nicht mitten in der Sitzung springen). Die Uhrzeit dagegen SOLL
 *  ticken; sie lebt darum in einem eigenen State, startet mit `null` (identisch
 *  zwischen Server- und erstem Client-Render, also keine Hydration-Divergenz
 *  UND kein Prerender-Wert, der beim Build einfriert) und wird erst im
 *  `useEffect` — also NACH der Hydration — gesetzt und danach jede Minute
 *  nachgeführt.
 *
 *  ZEITQUELLE INJIZIERBAR: bewusst KEIN eigener Injektions-Parameter hier —
 *  die Komponente ruft schlicht `new Date()`/`setInterval`, dieselben
 *  Globals, die Playwrights `page.clock` (verfügbar ab 1.45, hier 1.60)
 *  transparent abfängt. Ein zweiter, nur für Tests existierender Parameter
 *  wäre eine spekulative Abstraktion für einen Bedarf, den es schon gibt
 *  (Minimalismus-Prinzip, `.claude/rules/schichtentrennung.md`) — der e2e-
 *  Wächter (`e2e/d39-begruessung.e2e.ts`) installiert die Uhr vor `goto`. */
export function useHeute(): Heute {
  const [heute] = useState<Omit<Heute, 'uhrzeit'>>(() => {
    const jetzt = new Date();
    return {
      gruss: waehleBegruessungFuerBuild(BUILD_SEED),
      wochentag: WOCHENTAGE[jetzt.getDay()],
      datum: `${jetzt.getDate()}. ${MONATE[jetzt.getMonth()]} ${jetzt.getFullYear()}`,
    };
  });
  const [zeit, setZeit] = useState<string | null>(null);
  useEffect(() => {
    const nachfuehren = () => setZeit(uhrzeit(new Date()));
    nachfuehren();
    const id = setInterval(nachfuehren, 60_000);
    return () => clearInterval(id);
  }, []);
  return { ...heute, uhrzeit: zeit };
}
