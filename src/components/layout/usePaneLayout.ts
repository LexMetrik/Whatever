import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { tabSchluessel } from '../../lib/tabs';
import { kanonisierePfad } from '../../lib/normtext/erlassAdresse';
import { lokalSpeicher } from '../../lib/sichererSpeicher';

// ─── Pane-Layout (Split-View B-1) ──────────────────────────────────────────
//
// Hält die Pfade der SEKUNDÄREN Panes (das primäre Pane ist immer der bestehende
// BrowserRouter und treibt die URL). Reiner UI-Zustand der Darstellungsschicht
// (§3). Blaupause: useSeitenleiste/useSchriftskala (typeof-window-Guard,
// localStorage, SSR/prerender-sicher via render-then-replace, kein Hydrate).
//
// ZUSTANDSLOS (§5, Berufsgeheimnis): es werden AUSSCHLIESSLICH Pfade gespeichert,
// nie Formular-/Falldaten. #hash und ?preset werden abgestreift (wie tabSchluessel),
// sodass nur die Reiter-Identität (Pfad + ?r) persistiert — keine zweite
// Routen-/Reiter-Quelle (eine RouteSwitch, ein Tab-Speicher).
//
// VERHALTENSNEUTRAL: Default = [] (keine sekundären Panes) für jeden Prerender
// (typeof window === 'undefined') UND jeden frischen Client-Load (kein
// localStorage-Key) → Shell nimmt den 1-Pane-Pfad = exakt heute.

const PANES_KEY = 'lexmetrik-panes';
/** Maximal 2 sekundäre Panes (1 primär + 2 = 3 Spalten, FAHRPLAN B-2). */
export const MAX_SEKUNDAER = 2;

/** Normalisiert einen Pfad auf seine Reiter-Identität (Pfad + ?r, ohne Hash/Preset). */
function normPfad(pfad: string): string {
  // tabSchluessel erwartet pathname (+ ?query); es strippt #hash und ?preset und
  // behält ?r= (Mehrfachinstanz). Wir geben den vollen Pfad rein.
  return tabSchluessel(pfad);
}

/**
 * Defensiv säubern: nur absolute Pfade, gekappt, dedupliziert nach Reiter-Identität
 * (normPfad). Gespeichert wird der VOLLE Pfad inkl. #hash — der wählt bei manchen
 * Werkzeugen das Unter-Rechner-Tab (z. B. /rechner/zustaendigkeit#schkg); würde man
 * normalisiert speichern, öffnete das Pane auf dem falschen Tab. Dedup nur über die
 * Identität, damit zwei Hash-Varianten desselben Pfads sich nicht fälschlich tilgen.
 */
function saeubere(arr: unknown[]): string[] {
  const sauber: string[] = [];
  const gesehen = new Set<string>();
  for (const x of arr) {
    if (typeof x !== 'string' || !x.startsWith('/')) continue;
    // Umgezogene Erlass-Adressen beim Einlesen nachziehen (Gegenprüfung
    // 29.8.2026, Mangel 3): ein vor dem Umzug gespeichertes Pane und ein
    // geteilter `?p=`-Link trugen die Alt-Adresse dauerhaft weiter. Das Pane
    // rendert zwar richtig (der Leser springt), aber der GESPEICHERTE Zustand
    // blieb für immer alt — die Weiterleitung wäre damit Dauerzustand statt
    // Brücke. Vor der Dedup-Prüfung, damit Alt- und Neu-Form desselben
    // Erlasses nicht als zwei Panes nebeneinander überleben.
    const pfad = kanonisierePfad(x);
    const n = normPfad(pfad);
    if (gesehen.has(n)) continue;
    gesehen.add(n);
    sauber.push(pfad);
    if (sauber.length >= MAX_SEKUNDAER) break;
  }
  return sauber;
}

function ladePanes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    // B-5: ein geteilter Layout-Link `?p=pfad||pfad` gewinnt über localStorage —
    // so reproduziert das Öffnen eines geteilten Links den Pane-Satz.
    const geteilt = new URLSearchParams(window.location.search).get('p');
    if (geteilt) {
      // URLSearchParams.get hat bereits dekodiert → NICHT erneut decodeURIComponent.
      const seed = saeubere(geteilt.split('||'));
      // Defektes/leeres ?p= darf gespeicherte Panes NICHT löschen → nur bei Treffer gewinnen.
      if (seed.length) return seed;
    }
    const roh = lokalSpeicher.lies(PANES_KEY);
    if (!roh) return [];
    const arr = JSON.parse(roh);
    if (!Array.isArray(arr)) return [];
    return saeubere(arr);
  } catch { return []; }
}

/** Baut den teilbaren Layout-Permalink (aktuelle URL + ?p=sekundär-Pfade). */
export function layoutPermalink(sekundaer: string[]): string {
  if (typeof window === 'undefined') return '';
  const u = new URL(window.location.href);
  // searchParams.set kodiert selbst — NICHT vorab encodeURIComponent (sonst
  // doppelt kodiert). Trenner «||» (| → %7C); ladePanes liest via get() (dekodiert).
  if (sekundaer.length) u.searchParams.set('p', sekundaer.join('||'));
  else u.searchParams.delete('p');
  return u.toString();
}

export interface PaneLayout {
  /** Pfade der sekundären Panes (ohne das primäre). Länge 0…MAX_SEKUNDAER. */
  sekundaer: string[];
  /** Öffnet einen Pfad als zusätzliches sekundäres Pane (no-op bei voll/Duplikat). */
  oeffneDaneben: (pfad: string) => void;
  /** Schliesst das sekundäre Pane an Index i. */
  schliesse: (i: number) => void;
  /** Sortiert ein sekundäres Pane um (Drag-Drop/◂▸) — reines Array-Splice, keine Navigation. */
  verschiebe: (von: number, nach: number) => void;
  /** Ersetzt das sekundäre Pane an Index i (für «zum Hauptfenster»: alter Primär rutscht hierher). */
  ersetze: (i: number, pfad: string) => void;
}

export function usePaneLayout(): PaneLayout {
  const [sekundaer, setSekundaer] = useState<string[]>(ladePanes);

  // B-5: ?p= war nur Seed (geteilter Link) → nach dem Übernehmen aus der URL
  // entfernen, damit ein Reload den dann lokalen Zustand nutzt (localStorage),
  // nicht erneut den geteilten Satz aufzwingt. Einmalig.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = new URL(window.location.href);
    if (u.searchParams.has('p')) {
      u.searchParams.delete('p');
      window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash);
    }
  }, []);

  useEffect(() => {
    lokalSpeicher.schreib(PANES_KEY, JSON.stringify(sekundaer)); // gesperrt → nur für die Sitzung
  }, [sekundaer]);

  const oeffneDaneben = useCallback((roh: string) => {
    // Kanonisiert wie beim Einlesen (Mangel 3): auch ein zur Laufzeit
    // übergebener Alt-Pfad darf nicht als Alt-Pfad in den Speicher wandern.
    const pfad = kanonisierePfad(roh);
    const n = normPfad(pfad);
    // Vollen Pfad (inkl. #hash) speichern, Dedup über die Reiter-Identität.
    setSekundaer((s) => (s.length >= MAX_SEKUNDAER || s.some((x) => normPfad(x) === n) ? s : [...s, pfad]));
  }, []);

  const schliesse = useCallback((i: number) => {
    setSekundaer((s) => s.filter((_, idx) => idx !== i));
  }, []);

  const verschiebe = useCallback((von: number, nach: number) => {
    setSekundaer((s) => {
      if (von === nach || von < 0 || nach < 0 || von >= s.length || nach >= s.length) return s;
      const n = [...s];
      const [x] = n.splice(von, 1);
      n.splice(nach, 0, x);
      return n;
    });
  }, []);

  const ersetze = useCallback((i: number, pfad: string) => {
    // Vollen Pfad (inkl. #hash/?preset) speichern wie oeffneDaneben — sonst verlöre
    // das beförderte Hauptfenster sein Unter-Tab/Anker. Dedup läuft über normPfad.
    setSekundaer((s) => (i < 0 || i >= s.length ? s : s.map((x, idx) => (idx === i ? kanonisierePfad(pfad) : x))));
  }, []);

  return { sekundaer, oeffneDaneben, schliesse, verschiebe, ersetze };
}

// ─── Pane-Steuerung (B-2) ──────────────────────────────────────────────────
//
// Damit tief verschachtelte Stellen (z. B. das KontextPanel «Passende
// Werkzeuge» im Gesetzleser) ein Pane öffnen können, ohne das Layout
// durchzureichen, stellt Shell diese Steuerung als Kontext bereit.
// `kannOeffnen` ist nur ab lg + freier Kapazität true → die «daneben»-Aktion
// erscheint genau dann, wenn ein Pane auch wirklich aufgeht.

export interface PaneSteuerung {
  oeffneDaneben: (pfad: string) => void;
  kannOeffnen: boolean;
  /** true, wenn der Pfad bereits offen ist (Primär-URL oder ein Pane) → kein Doppel. */
  istOffen: (pfad: string) => boolean;
  /** ── M1 · P4 RÜCKWÄRTS (Prüfbefund R6/R11 #16) ───────────────────────────
   *  Schliesst das SEKUNDÄRE Fenster, das genau diesen Pfad zeigt; sonst
   *  no-op. Seit M1 hat jeder Pfad in einem Fenster auch einen Reiter — dann
   *  MUSS das ✕ dieses Reiters das Fenster mitnehmen. Täte es das nicht,
   *  stünde rechts wieder ein Dokument, das die Leiste nicht mehr führt: genau
   *  der gemessene P4-Zustand, nur von der anderen Seite. */
  schliessePane: (pfad: string) => void;
}

const PaneSteuerungContext = createContext<PaneSteuerung>({
  oeffneDaneben: () => {}, kannOeffnen: false, istOffen: () => false, schliessePane: () => {},
});

export const PaneSteuerungProvider = PaneSteuerungContext.Provider;

export function usePaneSteuerung(): PaneSteuerung {
  return useContext(PaneSteuerungContext);
}
