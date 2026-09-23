import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

// ─── D-7 (S6-W1a, 23.9.2026) · ZWEI GESTEN DES UNTEN ANGESCHLAGENEN BLATTS ────
//
// Befund (Audit D-7, @390): (1) die Zurück-Geste des Telefons schloss das
// modale Blatt nicht, sondern verliess den Leser — das Blatt deckt dort die
// einzige Bedienfläche, und «Zurück» ist die Geste, mit der man auf dem Telefon
// eine Fläche verlässt; (2) die Griffleiste versprach «nach unten wischen»,
// wirkungslos (§8: ein Zeichen ohne Geste).

/** Marke am History-Eintrag, den das offene modale Blatt belegt. */
const MARKE = 'lmErlassBlatt';

function traegtMarke(): boolean {
  const st: unknown = window.history.state;
  return typeof st === 'object' && st !== null && (st as Record<string, unknown>)[MARKE] === true;
}

/**
 * Browser-Zurück schliesst das offene MODALE Blatt zuerst.
 *
 * WIE: beim Öffnen ein History-Eintrag mit derselben Adresse und DEMSELBEN
 * Router-Zustand (`key`/`idx` kopiert) plus Marke — per `window.history`, NICHT
 * über `navigate`: ein Router-Push wechselte `location.key`, und daran hängen
 * der Anker-Sprung (`inhalt-sprung.tsx`, `letzteNavKey`) und die
 * A16-Restauration (`App.tsx`) — das Öffnen spränge sonst an den Anker der
 * Adresse. So sieht der Router beim Zurück denselben `key` und tut nichts.
 * Schliesst man anders (✕, Esc, Scrim), nimmt `history.back()` den Eintrag
 * wieder weg — kein Doppel-Zurück. NUR modal: am Desktop ist das Blatt Beiwerk
 * neben dem Text, dort gehört «Zurück» dem Ortswechsel (LM-202,
 * `lib/liveUrlSync`); ohne Eintrag gibt es auch kein Doppel-Zurück.
 * Führt ein Link aus dem Blatt fort, hat der Router seinen Eintrag schon
 * geschrieben — die Marke steht dann nicht mehr oben, und nichts wird genommen.
 */
export function useZurueckSchliesst(aktiv: boolean, schliesse: () => void): void {
  const schliesseRef = useRef(schliesse);
  useEffect(() => { schliesseRef.current = schliesse; }, [schliesse]);
  const laeuft = useRef(false);
  useEffect(() => {
    if (!aktiv || typeof window === 'undefined') return;
    laeuft.current = true;
    if (!traegtMarke()) {
      const st: unknown = window.history.state;
      window.history.pushState({ ...(typeof st === 'object' && st ? st : {}), [MARKE]: true }, '');
    }
    let perZurueck = false;
    const onPop = () => {
      if (traegtMarke()) return;
      perZurueck = true;
      schliesseRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      laeuft.current = false;
      // Einen Takt später: StrictMode baut den Effekt im Dev sofort wieder auf —
      // dann steht `laeuft` wieder, und der Eintrag bleibt (sonst schlösse das
      // `back()` das eben geöffnete Blatt).
      if (!perZurueck) setTimeout(() => { if (!laeuft.current && traegtMarke()) window.history.back(); }, 0);
    };
  }, [aktiv]);
}

/** Ab so vielen Pixeln nach unten schliesst das Loslassen das Blatt. Ein
 *  Fünftel der kleinsten Blatthöhe (55 % von 568 px @320 ≈ 312 px) — weniger
 *  wäre ein Zucken, mehr ein Kraftakt. */
const WISCH_SCHWELLE = 64;

/**
 * Wischen nach unten an der Griffleiste schliesst. Das Blatt folgt dem Finger
 * (`transform` am Ziel, kein Layout, kein CLS), unter der Schwelle springt es
 * zurück. Pointer-Ereignisse: Finger, Stift und Maus (Pane am Desktop) gleich.
 */
export function useWischZu(zielRef: RefObject<HTMLElement | null>, schliesse: () => void) {
  const start = useRef<number | null>(null);
  const setze = (dy: number) => {
    const el = zielRef.current;
    if (el) el.style.transform = dy > 0 ? `translateY(${dy}px)` : '';
  };
  const ende = (e: ReactPointerEvent<HTMLElement>) => {
    if (start.current === null) return;
    const dy = e.clientY - start.current;
    start.current = null;
    setze(0);
    if (e.type === 'pointerup' && dy >= WISCH_SCHWELLE) schliesse();
  };
  return {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      start.current = e.clientY;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      if (start.current !== null) setze(e.clientY - start.current);
    },
    onPointerUp: ende,
    onPointerCancel: ende,
  };
}
