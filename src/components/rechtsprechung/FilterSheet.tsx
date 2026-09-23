import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useDialogFokus } from '../layout/useDialogFokus';
import { SheetRahmen } from '../ui/SheetRahmen';

// ─── W2·10-UI-NAV/J2 · Mobil-Filter als Bottom-Sheet ─────────────────────────
//
// Fahrplan J2: «Filterblock hinter kompaktem ‹Filter (3)›-Button/Bottom-Sheet,
// Intro auf eine Zeile — Treffer ‹above the fold›».
//
// Vorher stand die ganze Steuerleiste (Suchfeld + drei Facetten-Leisten +
// Spruchkörper-Feld + Klappe «Erweiterte Filter») auf 390 px ÜBER der
// Trefferliste. Wer die Rubrik mobil öffnete, sah Bedienelemente, keine
// Entscheide. Jetzt trägt Mobil eine EINZEILIGE Leiste (Auslöser mit Zahl), die
// Facetten wohnen im Sheet; ab `lg` steht der Block unverändert inline.
//
// Aufbau und Optik folgen bewusst dem bestehenden GliederungSheet des Readers
// (§5/§10 — ein Sheet-Muster im Haus, nicht zwei): von unten angeschlagen,
// Griffleiste + Titel + ✕ (44 px Tap-Ziel) zuoberst, Inhalt darunter als
// einziger Scroller mit `overscroll-contain`.
// Seit F2-2 (31.8.2026) ist das kein «folgt», sondern DERSELBE Baustein:
// `ui/SheetRahmen`. Der Satz oben stand seit J2 da und war eine Kopie.
//
// A11Y-EHRLICHKEIT (Lehre B2 der V-Runde: role/aria ehrlich):
// Dieses Sheet fängt den Fokus, schliesst auf Escape, gibt den Fokus an den
// Auslöser zurück (useDialogFokus) und legt den Hintergrund still — es IST
// modal und sagt das auch (`role="dialog"`, `aria-modal="true"`). Wäre eines
// dieser Merkmale nicht da, stünde das Attribut hier nicht.
//
// §15/2 CLS 0: das Sheet ist `fixed`, also aus dem Fluss genommen — es
// verschiebt nichts. Der Auslöser darüber hat eine feste Zeilenhöhe.

export function FilterSheet({ anzahl, children }: {
  /** Zahl der aktiven Filter — steht in der Beschriftung und als Badge. */
  anzahl: number;
  /** Der Filterblock. Wird mobil im Sheet, ab `lg` inline gerendert. */
  children: ReactNode;
}) {
  const [offen, setOffen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  useDialogFokus(offen, sheetRef, () => setOffen(false));

  // Viewport-Stand schon im ERSTEN Client-Render lesen (lazy Initializer), nicht
  // erst per useEffect — sonst rendert der Client zuerst die Mobil-Fassung und
  // flippt danach auf die Desktop-Fassung, was die ganze Ergebnis-Spalte
  // reflowt (belegte CLS-Klasse, s. gesetz-leser/inhalt-zustand.tsx §15.5).
  const [istBreit, setIstBreit] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const upd = () => {
      setIstBreit(mq.matches);
      // Wird der Viewport breit, während das Sheet offen ist, gehört der Block
      // wieder inline — ein offener Dialog über der Desktop-Fassung ist ein
      // Zustand, den niemand angefordert hat. Die Rücknahme läuft HIER, im
      // Callback der Medien-Abfrage (echte Aussenwelt-Subskription), nicht in
      // einem eigenen Effekt: dort wäre sie eine Kaskaden-Renderung
      // (react-hooks/set-state-in-effect).
      if (mq.matches) setOffen(false);
    };
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);

  // Hintergrund still legen, solange das Sheet offen ist (Teil des modalen
  // Versprechens oben — ohne das dürfte `aria-modal` nicht dastehen).
  // `!istBreit` gehört in die Bedingung, nicht nur `offen`: sonst überlebte die
  // Sperre einen Wechsel auf Desktop-Breite, bei dem das Sheet gar nicht mehr
  // gerendert wird — die Seite liesse sich dann nicht mehr scrollen, ohne dass
  // ein schliessbares Element zu sehen wäre.
  useEffect(() => {
    if (!offen || istBreit) return;
    const vorher = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = vorher; };
  }, [offen, istBreit]);

  if (istBreit) return <>{children}</>;

  return (
    <>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOffen(true)}
          aria-expanded={offen} aria-haspopup="dialog"
          className="lc-chip inline-flex h-11 items-center gap-2 border-l-reg-r hover:text-ink-900">
          {/* Trichter — reine Dekoration, die Beschriftung trägt die Bedeutung. */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          Filter
          {/* W2·19-DESIGN-KONSISTENZ · D-8: die Zahl trug `lc-badge lc-badge-ok`
              — eine ZUSTANDS-Marke. §G-i trennt Werkstoff- von Zustandsfarbe und
              reserviert die ok-Rolle (`lc-badge-ok`/`lc-live`/`lc-termin-ring`)
              für Status; «3 Filter aktiv» ist aber kein Status, sondern eine
              ZÄHLUNG — und «grün» behauptete zusätzlich, aktive Filter seien
              etwas Gutes/Bestätigtes (§8). Kanon der Zählung ist die nackte Zahl
              (12:6:4:2 im Befund-Register), hier also `num` ohne Badge-Fläche.
              KEINE Pille nötig: der Zähler sitzt im Textfluss des Chips, es
              gibt nichts abzugrenzen — `lc-badge-soft` wäre nur ein zweiter
              Kasten im Kasten. ink-600 statt ink-500, weil die 12px-Ziffer auf
              der `--well`-Fläche des Chips ≥4.5:1 braucht (R4; ink-500 lag bei
              4.47:1). LM-051: Trenner als eigener Textknoten, sonst «Filter3». */}
          {anzahl > 0 && <>{' '}<span className="num text-ink-600">{anzahl}</span></>}
        </button>
      </div>

      {offen && (
        <>
          {/* F2-1: Farbe und Deckung aus `.lc-scrim` (src/index.css). Hier stand
              `bg-ink-900/30` — `--ink-900` flippt mit dem Thema (dunkel
              `#E9E7E2`), der «Scrim» HELLTE im Dunkelmodus also auf, statt
              abzudunkeln (Messung/Herleitung: `pages/gesetz-leser/v3/LeserScrim.tsx`,
              B7-N1). */}
          <div className="lc-scrim fixed inset-0 z-overlay" onClick={() => setOffen(false)} aria-hidden />
          {/* F2-2: Rahmen, Griffleiste, Titelzeile, ✕, Scroller und Sockel kommen
              aus dem EINEN Sheet-Baustein. Der Kommentar oben versprach seit J2
              «ein Sheet-Muster im Haus, nicht zwei» — bis hierher war es eine
              Kopie, die schon in der Anschlagshöhe auseinanderlief
              (`calc(4rem + 2.25rem)` hier, `var(--leser-kopf-h)` dort). Diese
              Fläche kennt ihre Kopfhöhe nicht selbst und nimmt darum die Vorgabe
              `--sheet-anschlag`. */}
          <SheetRahmen sheetRef={sheetRef} titel="Filter" onSchliessen={() => setOffen(false)}
            daten="data-filter-sheet"
            sockel={(
              <button type="button" onClick={() => setOffen(false)}
                className="lc-chip h-11 w-full justify-center border-l-reg-r font-medium text-ink-900 hover:bg-well">
                Treffer anzeigen
              </button>
            )}>
            {children}
          </SheetRahmen>
        </>
      )}
    </>
  );
}
