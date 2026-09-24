import { useEffect, useRef, type RefObject } from 'react';
import { useDialogFokus } from '../../../components/layout/useDialogFokus';

// ─── EIN Auto-Zu für alle aufziehbaren Flächen des Lesers V3 (H3) ────────────
//
// ANLASS (Vollzugsvermerk H1, «Folge-Etappen»): H1 hat die Aussenklick-, Esc- und
// Fokus-Rückgabe-Mechanik im `LeserAnsichtV3` als zwei lokale `useEffect`
// geschrieben. H3 bringt eine ZWEITE aufziehbare Fläche (das
// Rechtsprechungs-/Kontext-Panel). Zwei Kopien derselben Bedien-Zusage laufen
// beim ersten Nachjustieren auseinander — dann schliesst die eine Fläche auf
// Wischen und die andere nicht, ohne dass irgendwo steht, welche recht hat (§5).
//
// ── ZWEI MODI, WEIL ES ZWEI FLÄCHEN GIBT (deklariert, nicht abgeleitet) ──────
//
//   modus      Fläche                       Fokus-Falle  Aussenklick  Wisch-Geste
//   ──────────────────────────────────────────────────────────────────────────────
//   popover    «Ansicht ▾» im Kopf          ja           ja           ja
//   blatt      Panel als MODALES Sheet      ja           ja           nein
//   beiwerk    Panel als Blatt rechts (D)   NEIN         ja           nein
//   spalte     Panel als eigene Spur (Ä60)  NEIN         NEIN         nein
//
// ── `spalte` — DER VIERTE MODUS, UND WARUM ER KEINEN AUSSENKLICK KENNT ───────
// Ä60 (c), 18.8.2026: seit der Rahmen breiter werden darf, steht das Panel auf D
// nicht mehr ÜBER dem Text, sondern als eigene Spur NEBEN ihm (`rahmenSpalten`).
// Damit ist es kein aufgezogenes Blatt mehr, sondern Teil des Layouts — und
// einen Layout-Bestandteil, den ein Klick irgendwohin wegräumt, erwartet niemand.
//
// GEMESSEN, nicht gemeint (18.8.2026 @1440, erster Bau MIT Aussenklick): der
// Klick auf «Gliederung ausblenden» schloss zuerst das Panel; der Rahmen fiel
// dabei von 1344 auf 1072 px zurück, der Knopf wanderte unter dem Zeiger weg und
// sein `click` erreichte ihn nie — die Gliederung blieb offen. Ein Aussenklick,
// der die Fläche unter der Hand verschiebt, frisst genau den Klick, für den er
// gedacht war (rot gesehen an `leser-v3-uebersicht` (c)). Geschlossen wird die
// Spur über ✕, Esc oder den Zähler — drei benannte Wege.
//
// Esc schliesst in ALLEN Modi und gibt den Fokus an den Öffner zurück — das ist
// die Zusage, die keine Fläche verhandeln darf (WCAG 2.1.2/2.4.3).
//
// ── `beiwerk` — DER DRITTE MODUS IST ZURÜCK, MIT AUFRUFER (Ä52, 17.8.2026) ───
// H3 hatte einen Modus `spalte` (nicht modal) für ein angedocktes Panel gebaut
// und mit der Spalte gestrichen — richtig, denn er hatte keinen Aufrufer mehr.
// Jetzt hat er einen: das rechts angeschlagene Blatt auf D. `kopfStufen.panelForm`
// verspricht für `'rechts'` ausdrücklich «der Lesetext bleibt links sichtbar und
// LESBAR; das Panel ist Beiwerk» — gebaut war aber ein Vollflächen-Scrim mit
// `aria-modal` und Fokus-Falle, also das Gegenteil. Kommentar und Bau mussten
// zusammenkommen; der Bau hat nachgegeben, weil die Zusage die richtige ist.
//
// Was `beiwerk` NICHT tut: den Fokus fangen. Der Lesetext daneben bleibt
// bedienbar (Links, Fussnoten, Suche) — das ist der Unterschied zwischen einem
// Dialog und einem Beiwerk. Was es TUT: den Fokus beim Öffnen in die Fläche
// setzen (sonst wäre sie nach `r` per Tastatur unerreichbar), Esc annehmen und
// den Fokus beim Schliessen zurückgeben.
//
// WARUM `blatt`/`beiwerk` KEINE WISCH-GESTE HABEN: das Sheet ist selbst ein
// Scroller. Die Wisch-Geste im Panel-Inhalt würde das Panel schliessen, das man
// gerade liest — genau die Falle, die LM-009 für den umgekehrten Fall beschreibt.
// Beim `beiwerk` kommt hinzu, dass man den Lesetext daneben scrollt, WÄHREND das
// Panel offen bleiben soll: ein Wisch-Zu machte die Fläche unbenutzbar.
//
// ── AUSSENKLICK-AUSNAHME (Ä52-Folgebefund) ──────────────────────────────────
// Der Zähler in der Kopfzeile liegt NICHT im `wrapRef` des Panels (er steht im
// klebenden Kopf, eine andere Teilstruktur). Ohne Ausnahme wäre ein Klick darauf
// erst ein Aussenklick (`pointerdown` ⇒ schliesst) und danach ein Öffner-Klick
// (`click` ⇒ öffnet wieder) — der Knopf hätte sichtbar nichts getan. Solange das
// Blatt einen Scrim hatte, fiel das nicht auf; ohne Scrim wird es sofort sichtbar.
// Der Aufrufer benennt die Ausnahme darum als Selektor, statt sie zu erraten.
//
// LM-009 (aus `LeserAnsichtMenu`, wörtlich weitergetragen): geschlossen wird auf
// eine echte NUTZER-Geste (`wheel`/`touchmove`/`resize`), nie auf das generische
// `scroll`-Ereignis — ein Schalter verändert die Höhe des Fliesstexts, der
// Browser gleicht per Scroll-Anchoring aus und feuerte `scroll` ohne Geste; das
// eben geöffnete Panel schloss sich von selbst.

// D33 (7.9.2026): `'spalte'` heisst jetzt `'fest'`. Die LAGE, nach der er
// benannt war (das Panel als eigene Rahmen-Spur, Ä60 (c)), gibt es nicht mehr;
// die REGEL dahinter bleibt und ist der eigentliche Inhalt des Modus: ein Blatt,
// das neben dem Lesetext steht, schliesst nicht bei jedem Klick in den Text.
// Datierter Anlass, der ihn hält (§17-Gegengewicht): Klick-Test 18.8.2026 —
// mit `'beiwerk'` war Textmarkieren bei offenem Panel unmöglich, das Blatt ging
// bei JEDEM Klick in die Lesespalte zu (Wächter `leser-v3-rahmen` (f)).
export type AutoZuModus = 'popover' | 'blatt' | 'beiwerk' | 'fest';

/** Die zwei Modi OHNE Fokus-Falle: das Panel ist dort Beiwerk, kein Dialog. */
const OHNE_FALLE: AutoZuModus[] = ['beiwerk', 'fest'];

export function usePopoverAutoZu({ offen, schliesse, wrapRef, panelRef, modus, aussenAusnahme }: {
  offen: boolean;
  /** Instabile Funktion erlaubt — sie wird über eine Ref gelesen. */
  schliesse: () => void;
  /** Umschliessender Bereich (Öffner UND Fläche). Ein `pointerdown` darin
   *  schliesst nicht. Ohne Ref entfällt die Aussenklick-Prüfung — dann trägt der
   *  Aufrufer sie selbst (das Blatt tut das über seine Überlagerung). */
  wrapRef?: RefObject<HTMLElement | null>;
  /** Die Fläche selbst; braucht `tabIndex={-1}`, damit der Fokus hineingesetzt
   *  werden kann, wenn sie kein fokussierbares Kind hat. */
  panelRef: RefObject<HTMLElement | null>;
  modus: AutoZuModus;
  /** CSS-Selektor der Elemente, die trotz Lage AUSSERHALB von `wrapRef` nicht als
   *  Aussenklick gelten (die Öffner des Panels — Herleitung im Kopf). */
  aussenAusnahme?: string;
}): void {
  const schliesseRef = useRef(schliesse);
  useEffect(() => { schliesseRef.current = schliesse; }, [schliesse]);

  // Fokus-Falle + Esc + Fokus-Rückgabe aus der GETEILTEN Mechanik — dieselbe,
  // die das Ist-Menü und das Gliederungs-Blatt verwenden (§5). NICHT im Modus
  // `beiwerk`/`spalte`: dort ist die Falle gerade das, was nicht sein darf (Kopf oben).
  useDialogFokus(offen && !OHNE_FALLE.includes(modus), panelRef, () => schliesseRef.current());

  // ── `beiwerk`/`spalte`: Fokus hinein, Esc, Rückgabe — OHNE Falle ─────────
  // Bewusst KEIN Aufruf von `useDialogFokus` mit abgeschalteter Falle: die Falle
  // ist dort die Hälfte der Zusage, und ein Schalter «Dialog ohne Dialog» hätte
  // jeden ihrer sieben Aufrufer betroffen (§5 — geteilte Mechanik nicht für einen
  // Sonderfall umbauen). Fokussiert wird der Container selbst (`tabIndex={-1}`);
  // von dort wandert Tab regulär in die Fläche und wieder heraus.
  useEffect(() => {
    if (!offen || !OHNE_FALLE.includes(modus)) return;
    const wurzel = panelRef.current;
    if (wurzel == null) return;
    const vorher = document.activeElement as HTMLElement | null;
    // `preventScroll` (S6 W1g, 24.9.2026): das Beiwerk steht sichtbar NEBEN
    // bzw. über dem Text — der Fokus darf die Lesestelle nicht verschieben.
    // GEMESSEN @1024 am gebauten Stand (ZGB, Seitenanfang): seit das Blatt als
    // Spalte bis zur Fensterunterkante reicht (`./blattFlaeche`), ragte es im
    // Fluss 51 px unter den Rand, `focus()` scrollte das Fenster um diese 51 px,
    // und nach dem Schliessen blieben 22 px Versatz stehen — die Gliederung
    // kam bei y 183 statt 205 zurück (`w224-leser-d32-d33` (i) rot). Schon
    // vorher scrollte es 29 px (und zurück); die Spalte klebt ohnehin.
    wurzel.focus({ preventScroll: true });
    const taste = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') schliesseRef.current();
    };
    window.addEventListener('keydown', taste);
    return () => {
      window.removeEventListener('keydown', taste);
      if (vorher && typeof vorher.focus === 'function') vorher.focus();
    };
  }, [offen, modus, panelRef]);

  // ── Aussenklick — in JEDEM Modus ausser `spalte` (Herleitung im Kopf) ─────
  useEffect(() => {
    if (!offen || !wrapRef || modus === 'fest') return;
    const klick = (e: PointerEvent) => {
      const wurzel = wrapRef.current;
      if (!wurzel) return;
      const ziel = e.target as Node;
      if (wurzel.contains(ziel)) return;
      // Die Öffner sind kein «Aussen» — Herleitung im Dateikopf.
      if (aussenAusnahme && ziel instanceof Element && ziel.closest(aussenAusnahme)) return;
      schliesseRef.current();
    };
    document.addEventListener('pointerdown', klick);
    return () => document.removeEventListener('pointerdown', klick);
  }, [offen, wrapRef, aussenAusnahme, modus]);

  // ── Wisch-/Grössen-Geste (nur `popover`, Herleitung LM-009 im Kopf) ───────
  useEffect(() => {
    if (!offen || modus !== 'popover') return;
    const zu = () => schliesseRef.current();
    window.addEventListener('wheel', zu, { passive: true });
    window.addEventListener('touchmove', zu, { passive: true });
    window.addEventListener('resize', zu);
    return () => {
      window.removeEventListener('wheel', zu);
      window.removeEventListener('touchmove', zu);
      window.removeEventListener('resize', zu);
    };
  }, [offen, modus]);
}
