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
 *
 * NACHTRAG 1.10.2026 (#1239, W2·18-FEHLERBUCH; der Wortlaut oben gilt als
 * Stand vom 23.9.2026 und bleibt stehen): «NUR modal … ohne Eintrag gibt es auch
 * kein Doppel-Zurück» stimmt seither nur noch für das ÖFFNEN — geschrieben wird
 * der Eintrag weiter nur, solange das Blatt modal ist. Ein Zuschnittwechsel auf
 * breit lässt ihn aber MIT Marke stehen (kein `back()`, Begründung im nächsten
 * Absatz); am Desktop kann nach dem Breitwerden also ein Eintrag gleicher Adresse
 * übrig sein, und ein Zurück darüber hat keine sichtbare Wirkung. Schliesst der
 * Nutzer das Blatt dort per Geste, räumt `history.back()` ihn weg, solange die
 * Marke oben steht (Nachzug 2, Milderung A).
 *
 * NUR EINE NUTZERGESTE NIMMT DEN EINTRAG WEG (§17-Wurzelfix W2·18-FEHLERBUCH,
 * 1.10.2026). `offen` (die Absicht des Nutzers) und `modal` (die Gestalt des
 * Zuschnitts) sind getrennte Argumente, weil das Blatt auf zwei verschiedene
 * Weisen «aufhört, modal zu sein»:
 *
 *  - `offen` → false (✕, Esc, Scrim, Wischen, «r»): der Nutzer hat geschlossen,
 *    das Blatt ist weg. `history.back()` räumt den Eintrag auf, wie bisher.
 *  - `modal` → false bei weiter offenem Blatt (Zuschnittwechsel: Fenster
 *    verbreitern, Gerät kippen über die Schwelle) oder Abbau der Komponente:
 *    KEIN `history.back()`. Die Seite wechselt die Gestalt, der Nutzer hat nichts
 *    getan, und ein `back()` ist ein Browser-Auftrag, der nicht rückholbar und
 *    nicht zeitlich verankert ist (s. u.). Der Eintrag bleibt stehen, MIT Marke:
 *    wird das Blatt wieder modal, findet `traegtMarke()` ihn und belegt ihn neu,
 *    statt einen zweiten zu schreiben. Preis: auf dem breiten Zuschnitt steht ein
 *    Verlaufseintrag gleicher Adresse und gleichen Router-Zustands mehr da — ein
 *    Zurück ohne sichtbare Wirkung, das der Router wie oben «nicht sieht».
 *
 * WARUM NICHT DEN VERWAISTEN EINTRAG BEIM NÄCHSTEN `popstate` ÜBERSPRINGEN
 * (verworfen): `popstate` trägt keine Richtung. Eine Seite, die beim Landen auf
 * dem entmarkten Eintrag E noch einmal `back()` ruft, räumt ihn beim Zurück aus
 * N weg — fängt aber auch das VORWÄRTS von P nach E ab (P → E sieht für den
 * Handler aus wie N → E) und liesse den Nutzer nie über E hinaus: Vorwärts wäre
 * kaputt. Ohne Navigation API (Firefox) ist die Richtung nicht zu haben.
 *
 * WARUM `back()` ÜBERHAUPT GEFÄHRLICH IST: es ist auch aus einem Mikrotask
 * ASYNCHRON (der Rücksprung wird im Browser-Prozess eingereiht), und er bricht
 * eine inzwischen begonnene Ganzseiten-Navigation ab (`net::ERR_ABORTED` am
 * `page.goto`, in `e2e/leser-v3-panel-nachzug.e2e.ts` (f)/(f3); für Nutzer:
 * Fenster verkleinern und wieder vergrössern, während ein Seitenwechsel läuft).
 * Ein `beforeunload`-Merker (#1239, b2da71ad2) schützte nur, wenn die Navigation
 * VOR dem Aufräumen begann — PR-Lauf 36890985162 widerlegte ihn: das Aufräumen
 * kam zuerst, die Navigation danach, das `back()` zuletzt. Wer nie `back()` ruft,
 * hat das Problem nicht.
 */
export function useZurueckSchliesst(offen: boolean, modal: boolean, schliesse: () => void): void {
  const aktiv = offen && modal;
  const schliesseRef = useRef(schliesse);
  useEffect(() => { schliesseRef.current = schliesse; }, [schliesse]);
  // Letzter COMMITTETER Stand von `offen`. Der Cleanup unten läuft VOR dem
  // Setup dieses Effekts (React: erst alle Cleanups, dann alle Setups) und sähe
  // darum noch den alten Wert — gelesen wird er erst im Mikrotask danach.
  const offenRef = useRef(offen);
  useEffect(() => { offenRef.current = offen; }, [offen]);
  // NACHZUG 2 (1.10.2026, Prüfer-Befund 4): Schliesst der Nutzer das Blatt per
  // Geste, während es NICHT modal ist (breiter Zuschnitt, der Eintrag steht noch
  // mit Marke da), läuft der Cleanup unten nicht — `aktiv` war schon false und
  // bleibt es. Ohne diesen Zweig bliebe der Eintrag als wirkungsloses Zurück
  // stehen. Ausgelöst NUR von `offen` true → false (Nutzergeste), nie vom
  // Zuschnittwechsel; gleiches Risikoprofil wie ✕ am Telefon (keine laufende
  // Navigation, Mikrotask-Ordnung gegenüber `offenRef` wie unten). Kein Doppel:
  // war `aktiv` im Vorcommit wahr, nimmt der Cleanup den Eintrag, nicht dieser Zweig.
  const vorherOffen = useRef(offen);
  const vorherAktiv = useRef(aktiv);
  useEffect(() => {
    const warOffen = vorherOffen.current;
    const warAktiv = vorherAktiv.current;
    vorherOffen.current = offen;
    vorherAktiv.current = aktiv;
    if (typeof window === 'undefined') return;
    if (warOffen && !offen && !warAktiv && !aktiv) {
      queueMicrotask(() => { if (!offenRef.current && traegtMarke()) window.history.back(); });
    }
  }, [offen, aktiv]);
  useEffect(() => {
    if (!aktiv || typeof window === 'undefined') return;
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
      // Nur die Nutzergeste «Blatt zu» räumt auf; Zuschnittwechsel (offen bleibt)
      // und Abbau (offen bleibt) lassen den Eintrag stehen — Begründung oben.
      //
      // MIKROTASK, NICHT MAKROTASK (§17-Wurzelfix, Flacker-Befund 24.9.2026, #1046):
      // `setTimeout(…, 0)` gibt die Kontrolle an die Browser-Ereignisschleife ab;
      // in der Lücke kann eine ECHTE Ganzseiten-Navigation begonnen haben, von der
      // dieses Dokument noch nichts weiss — beobachtet als `net::ERR_ABORTED`
      // auf `page.goto` in `leser-v3-panel-nachzug` (f): 11/30 rot unter 4×
      // CPU-Drossel (Läufe 35984783583, 36009374111). Mikrotasks laufen restlos VOR der
      // nächsten Makrotask. (Dass für den Zuschnittwechsel gar kein `back()` mehr
      // läuft, ändert daran nichts; für ✕ & Co. gilt es unverändert.) Seit dem
      // Nachzug 1.10.2026 trägt der Mikrotask zusätzlich die Ordnung gegenüber
      // `offenRef`: erst nach dem Setup-Lauf desselben Commits ist `offen` gültig.
      if (!perZurueck) queueMicrotask(() => { if (!offenRef.current && traegtMarke()) window.history.back(); });
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
