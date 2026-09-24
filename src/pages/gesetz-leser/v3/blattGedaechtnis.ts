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
// (und ebenso ein frischer Aufruf oder Hash-Sprung im selben Tab, s. «Wann» unten).
//
// ROBUST STATT STRENG: Speicher kann fehlen oder werfen (privates Fenster,
// Quote, gesperrte Website-Daten) — dann gilt schlicht der Ausgangszustand. Ein
// Reiter, den es nicht mehr gibt (die Reiter-Tabelle wandert, S6-W1cd), wird
// verworfen statt eingesetzt. Seit S6-W1cd (23.9.2026) mit einer Ausnahme:
// «anwendung» geht an seinen Nachfolger «erlaeuterungen» (`alsPanelReiter`,
// die eine Stelle für gespeicherte Reiter-Werte).

import { useEffect, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { alsPanelReiter, type PanelReiter, type PanelZustand } from './panelModell';

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
    const reiter = alsPanelReiter(wert.reiter);
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

// ── WANN WIEDERHERGESTELLT WIRD: NUR BEI ECHTER RÜCKKEHR ─────────────────────
// Der Befund lautet «bei Zurück/Reload verloren». Wiederhergestellt wird darum
// genau dann, wenn die Navigation, die den Leser an seinen jetzigen Ort brachte,
// (a) ein Browser-Zurück/Vor an einen ANDEREN Ort war (Router-POP mit Wechsel
// von Pfad oder Suche — auch auf einen Verlaufseintrag, den ein roher Hash-Link
// angelegt hat) oder (b) der erste Aufbau eines Dokuments, das der Browser per
// Neuladen bzw. Zurück/Vor geladen hat (Navigation Timing `type`), solange
// seither kein `popstate` kam. NICHT wiederhergestellt: frischer Aufruf (Link,
// getippte Adresse: Timing `navigate`), In-App-Link (PUSH/REPLACE) und
// Hash-Sprung (POP ohne Pfadwechsel — ein roher `<a href="#art-…">` oder ein
// `goto` mit anderem Hash löst ein natives `popstate` aus; der Leser bleibt
// dabei montiert und das Blatt, wie es war).
//
// NACHZUG 23.9.2026 (Auflage Gegenprüfung PR #1002): bis dahin setzte JEDES
// `popstate` einen modul-globalen Merker dauerhaft auf «gesehen», und der
// Timing-Typ `reload` galt für die ganze Lebensdauer des Dokuments — nach einem
// Hash-Sprung oder einem Reload war damit JEDE spätere POP-Navigation, die den
// Erlass-Key (neu) brachte, eine «Rückkehr». Seither ist die Rückkehr an die
// konkrete Navigation gebunden (`ortGesehen` je Ort) und wird beim
// Wiederherstellen genau einmal verbraucht. `popstateSeitLaden` bleibt
// modul-global, entscheidet aber nur noch, ob ein POP beim ERSTEN Aufbau des
// Rahmens der Dokument-Aufbau selbst ist (b) oder eine Rückkehr (a).
let popstateSeitLaden = false;
if (typeof window !== 'undefined') window.addEventListener('popstate', () => { popstateSeitLaden = true; });

export type Ortsart = 'erstaufbau' | 'ortswechsel' | 'sprung';
export interface Dokument { popstateSeitLaden: boolean; ladeTyp: string | undefined }
interface Ort { key: string; pathname: string; search: string }

/** Wie sich der Ort gegenüber dem zuletzt gesehenen geändert hat; der Hash zählt nicht. */
export function ortsart(vorherPfad: string | null, ort: Pick<Ort, 'pathname' | 'search'>): Ortsart {
  if (vorherPfad === null) return 'erstaufbau';
  return vorherPfad === ort.pathname + ort.search ? 'sprung' : 'ortswechsel';
}

export function istRueckkehr(navTyp: string, art: Ortsart, dok: Dokument): boolean {
  if (navTyp !== 'POP') return false;
  if (art === 'sprung') return false;
  if (art === 'erstaufbau' && !dok.popstateSeitLaden) return dok.ladeTyp === 'reload' || dok.ladeTyp === 'back_forward';
  return true;
}

/** Navigation-Timing-Typ des Dokuments (`navigate`/`reload`/`back_forward`) — robust gegen Fehlen und Werfen. */
export function ladeTypVon(perf: Pick<Performance, 'getEntriesByType'> | undefined): string | undefined {
  try {
    return (perf?.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type;
  } catch {
    return undefined;
  }
}

/**
 * Bindet die Rückkehr an die konkrete Navigation: `ortGesehen` klassiert jeden
 * neuen Ort (und überschreibt den vorigen Anlass), `wiederherstellen` sagt
 * höchstens einmal «ja» und verbraucht den Anlass. Rein — Ort, Navigationstyp
 * und Dokument-Zustand liefert die Hook.
 */
export function rueckkehrMerker(dokument: () => Dokument) {
  let vorherPfad: string | null = null;
  let anlass: { schluessel: string; rueckkehr: boolean } | null = null;
  return {
    ortGesehen(ort: Ort, navTyp: string): void {
      anlass = { schluessel: ort.key, rueckkehr: istRueckkehr(navTyp, ortsart(vorherPfad, ort), dokument()) };
      vorherPfad = ort.pathname + ort.search;
    },
    wiederherstellen(ortSchluessel: string): boolean {
      if (!anlass || anlass.schluessel !== ortSchluessel || !anlass.rueckkehr) return false;
      anlass = { ...anlass, rueckkehr: false };
      return true;
    },
  };
}

function dokumentJetzt(): Dokument {
  return { popstateSeitLaden, ladeTyp: typeof performance === 'undefined' ? undefined : ladeTypVon(performance) };
}

/**
 * Verbindet den Panel-Zustand mit dem Gedächtnis — EIN Aufruf im Rahmen.
 *
 * Jeden neuen Ort klassieren, wiederherstellen, sobald der Erlass-Key bekannt
 * ist (er kommt erst mit den Daten), dann jede Änderung mitschreiben. Die
 * Reihenfolge der drei Effekte ist die Zusage: im selben Commit läuft
 * Klassieren vor Lesen vor Schreiben; das Schreiben sieht dort noch den
 * Ausgangszustand und überschreibt kurz — der nächste Commit trägt den
 * wiederhergestellten Wert nach. Über `oeffne` statt eines nackten `setOffen`,
 * damit das Nachladen (`jeGeoeffnet`) mitläuft.
 */
export function useBlattGedaechtnis(erlassKey: string | undefined, zustand: PanelZustand): void {
  const { offen, reiter, oeffne, setReiter } = zustand;
  const navTyp = useNavigationType();
  const ort = useLocation();
  const [merker] = useState(() => rueckkehrMerker(dokumentJetzt));
  useEffect(() => {
    merker.ortGesehen(ort, navTyp);
    // Je Navigation genau einmal: `ort` ist je Navigation ein neues Objekt —
    // auch beim Hash-Sprung, dessen Schlüssel («default») gleich bleiben kann.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ort]);
  useEffect(() => {
    if (!erlassKey || !merker.wiederherstellen(ort.key)) return;
    const g = liesBlatt(erlassKey);
    if (!g) return;
    if (g.offen) oeffne(g.reiter); else setReiter(g.reiter);
    // Läuft nur, wenn der Erlass-Key kommt: `oeffne`/`setReiter` sind stabil,
    // und `ort.key` gehört zu dem Aufruf, der den Key gebracht hat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erlassKey, oeffne, setReiter]);
  useEffect(() => {
    if (erlassKey) merkeBlatt(erlassKey, { offen, reiter });
  }, [erlassKey, offen, reiter]);
}
