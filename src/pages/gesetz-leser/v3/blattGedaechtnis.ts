// ─── D-6 (S6-W1a, 23.9.2026) · DAS ERLASS-BLATT MERKT SICH, WIE MAN ES VERLIESS ─
//
// Befund (Audit D-6): offen/zu und der aktive Reiter gingen bei Browser-Zurück
// und Reload verloren — wer aus dem Blatt einen Entscheid öffnete und zurückkam,
// stand vor einem geschlossenen Blatt auf «Entscheide», auch wenn er in
// «Materialien» war. Seither steht beides JE ERLASS in `sessionStorage`.
//
// WARUM `sessionStorage` UND NICHT DIE ADRESSE: die Adresse gehört den echten
// Ortswechseln und dem Teilen (`lib/liveUrlSync`, LM-202); ein Blatt-Zustand ist
// eine Bedien-Bequemlichkeit dieses Tabs, keine Fundstelle. Je Tab und je
// Sitzung — ein neuer Tab beginnt geschlossen, wie ein frisch geöffneter Leser
// (und ebenso ein frischer Aufruf im selben Tab, s. «Wann» unten).
//
// ROBUST STATT STRENG: Speicher kann fehlen oder werfen (privates Fenster,
// Quote, gesperrte Website-Daten) — dann gilt schlicht der Ausgangszustand. Ein
// Reiter, den es nicht mehr gibt (die Reiter-Tabelle wandert, S6-W1cd), wird
// verworfen statt eingesetzt.

import { useEffect } from 'react';
import { useNavigationType } from 'react-router-dom';
import { PANEL_REITER, type PanelReiter, type PanelZustand } from './panelModell';

export interface BlattGedaechtnis {
  offen: boolean;
  reiter: PanelReiter;
}

const PRAEFIX = 'lm-erlass-blatt:';

/** Liest den gemerkten Zustand — `null`, wenn nichts (Gültiges) gemerkt ist. */
export function liesBlatt(erlassKey: string, speicher: Pick<Storage, 'getItem'> | null = sitzung()): BlattGedaechtnis | null {
  try {
    const roh = speicher?.getItem(PRAEFIX + erlassKey);
    if (!roh) return null;
    const wert = JSON.parse(roh) as Partial<BlattGedaechtnis>;
    const reiter = PANEL_REITER.find((r) => r.id === wert.reiter)?.id;
    if (typeof wert.offen !== 'boolean' || !reiter) return null;
    return { offen: wert.offen, reiter };
  } catch {
    return null;
  }
}

/** Schreibt den Zustand; ein werfender Speicher wird still übergangen. */
export function merkeBlatt(erlassKey: string, wert: BlattGedaechtnis, speicher: Pick<Storage, 'setItem'> | null = sitzung()): void {
  try {
    speicher?.setItem(PRAEFIX + erlassKey, JSON.stringify(wert));
  } catch {
    // Quote/gesperrt: der Zustand ist Bequemlichkeit, kein Datum (s. Kopf).
  }
}

function sitzung(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

// ── WANN WIEDERHERGESTELLT WIRD: NUR BEI RÜCKKEHR ─────────────────────────────
// Der Befund lautet «bei Zurück/Reload verloren». Ein FRISCHER Aufruf desselben
// Erlasses (Link, getippte Adresse) beginnt dagegen geschlossen wie jeder neu
// geöffnete Leser — sonst spränge das Blatt auf, weil man es vor einer Stunde
// im selben Tab einmal offen hatte. Rückkehr heisst: eine POP-Navigation des
// Routers, und zwar entweder nach einem `popstate` in diesem Dokument (Zurück
// innerhalb der App) oder beim ersten Aufbau, wenn der Browser die Seite per
// Neuladen bzw. Zurück/Vorwärts geladen hat (Navigation Timing `type`). Der
// erste Aufbau ist für den Router ebenfalls POP — darum die zweite Bedingung.
let popstateGesehen = false;
if (typeof window !== 'undefined') window.addEventListener('popstate', () => { popstateGesehen = true; });

function istRueckkehr(navTyp: string): boolean {
  if (navTyp !== 'POP') return false;
  if (popstateGesehen) return true;
  try {
    const eintrag = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return eintrag?.type === 'reload' || eintrag?.type === 'back_forward';
  } catch {
    return false;
  }
}

/**
 * Verbindet den Panel-Zustand mit dem Gedächtnis — EIN Aufruf im Rahmen.
 *
 * Wiederherstellen, sobald der Erlass-Key bekannt ist (er kommt erst mit den
 * Daten), dann jede Änderung mitschreiben. Die Reihenfolge der zwei Effekte ist
 * die Zusage: im selben Commit läuft das Lesen VOR dem Schreiben, das Schreiben
 * sieht dort noch den Ausgangszustand und überschreibt kurz — der nächste
 * Commit trägt den wiederhergestellten Wert nach. Über `oeffne` statt eines
 * nackten `setOffen`, damit das Nachladen (`jeGeoeffnet`) mitläuft.
 */
export function useBlattGedaechtnis(erlassKey: string | undefined, zustand: PanelZustand): void {
  const { offen, reiter, oeffne, setReiter } = zustand;
  const navTyp = useNavigationType();
  useEffect(() => {
    if (!erlassKey || !istRueckkehr(navTyp)) return;
    const g = liesBlatt(erlassKey);
    if (!g) return;
    if (g.offen) oeffne(g.reiter); else setReiter(g.reiter);
    // Läuft nur, wenn der Erlass-Key kommt: `oeffne`/`setReiter` sind stabil,
    // und `navTyp` gilt für den Aufruf, der den Key gebracht hat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erlassKey, oeffne, setReiter]);
  useEffect(() => {
    if (erlassKey) merkeBlatt(erlassKey, { offen, reiter });
  }, [erlassKey, offen, reiter]);
}
