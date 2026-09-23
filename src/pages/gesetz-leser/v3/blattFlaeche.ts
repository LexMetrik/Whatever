import type { CSSProperties } from 'react';

// ─── Die Fläche des Erlass-Blatts je Gestalt (aus `./LeserPanelZone` gezogen,
// S6-W1a 23.9.2026, §6.6: die Zone stand mit D-1/D-7 über der 420-Zeilen-Sonde).
// Wortlaut der Herleitungen unverändert übernommen.

/** Höhe des unten angeschlagenen Blatts: 55 % der Lesefläche (Ä55).
 *
 *  WARUM 55 UND NICHT 60 ODER 100: über dem Blatt müssen mindestens ein
 *  Artikel-Kopf und zwei Absätze stehen bleiben, sonst ist das Blatt ein
 *  Vollbild-Dialog mit Rundung. Gemessen @390 (StPO): Artikelhöhe ~348 px bei
 *  844 px Fläche — 45 % Restfläche = 380 px trägt genau das. Als CSS-Variable und
 *  nicht als Klassen-Literal, damit BEIDE Zweige (Pane und Einzelansicht) aus
 *  EINER Zahl rechnen; `dvh` bzw. `%`, weil der Pane-Zweig relativ zur
 *  Overlay-Schicht liegt und nicht zum Fenster. */
const BLATT_ANTEIL = 55;

export interface BlattFlaeche {
  /** Klassen der 0-Höhen-Hülle (nur die klebende Gestalt `'rechts'`). */
  huelle: string | undefined;
  klassen: string;
  stil: CSSProperties;
}

/** `randBlatt` = Gestalt `'rechts'` ausserhalb eines Panes; `imPaneBlatt` =
 *  das Blatt hängt in der Overlay-Schicht eines Panes. */
export function blattFlaeche(randBlatt: boolean, imPaneBlatt: boolean): BlattFlaeche {
  // ── Die Fläche ────────────────────────────────────────────────────────────
  // Anschlag-Kante und Deckel je Gestalt. Alle drei Zweige sind `fixed` bzw.
  // `absolute`, brauchen also keinen Platz im Fluss (§15/2, CLS 0).
  return randBlatt
    // ── D33 (7.9.2026) · DAS BLATT KLEBT AN DER LESE-ZELLE, NICHT AM FENSTER ──
    // Bis hierher war diese Gestalt `fixed … right-0` mit `top: var(--nt-stick)`.
    // GEMESSEN am ersten Bau von D33 (@1440, OR, Seite NICHT gescrollt): der
    // klebende Kopf steht dann noch an seiner natürlichen Stelle (y 145–201),
    // `--nt-stick` (154 px) meint aber die Stelle, an der er KLEBT. Das Blatt
    // begann darum 47 px zu hoch und lag über dem ⚖-Knopf, der es aufgezogen
    // hatte: `elementFromPoint` am Klickpunkt lieferte «Rechtsprechung &
    // Kontext» statt des Knopfes, der zweite Klick traf das Blatt. Das ist
    // wortgleich der Ä52-Befund von 17.8.2026 — nur die Ursache war neu.
    // JETZT: `sticky` in der Lese-Zelle. Die natürliche Lage ist die Oberkante
    // der Zelle (also unter dem Kopf, wo immer der gerade steht), und beim
    // Scrollen klebt es bei `--nt-stick` — «tiefer von beiden», ohne zu messen.
    // Die 0-Höhen-Hülle darum ist derselbe Kniff, mit dem die Scroll-Blende in
    // `./LeserLeseZeile` aus dem Fluss bleibt: kein Platz, kein CLS, Δ = 0.
    // ── D-1 (Entscheid David 23.9.2026) · SENKRECHT BLEIBT D33, WAAGRECHT NICHT ─
    // Die Kante «bündig an der Zelle» (D33) ist aufgehoben: das Blatt schliesst
    // am FENSTERRAND an (`right: -var(--blatt-rand)`, Herleitung und Messreihe
    // in `./useFensterRand`). Die Oberkante ist unverändert die von D33 —
    // bewacht von `leser-v3-rahmen` (a) und `leser-v3-panel-nachzug`.
    ? {
      huelle: 'pointer-events-none sticky z-modal h-0 overflow-visible',
      // W2·29 S5 (Board «Erlass-Blatt»): 380 px, bündig an der Zellenkante,
      // ohne Polster (bis dahin 22 rem mit `p-2` — Gestalt nach D33 unverändert).
      // D-1 (23.9.2026): «an der Zellenkante» → am Fensterrand, `right` im Stil.
      klassen: 'pointer-events-auto absolute top-0 w-[23.75rem] max-w-[calc(100vw-2rem)]',
      stil: {
        right: 'calc(-1 * var(--blatt-rand, 0px))',
        maxHeight: 'calc(100vh - var(--nt-stick) - 1.5rem)',
      } as CSSProperties,
    }
    : imPaneBlatt
      // Pane · unten angeschlagen in der Overlay-Schicht (die den Pane deckt).
      ? {
        huelle: undefined,
        klassen: 'pointer-events-auto absolute inset-x-0 bottom-0 z-modal',
        stil: { maxHeight: `${BLATT_ANTEIL}%` } as CSSProperties,
      }
      // H · echtes Bottom-Sheet: unten angeschlagen, gedeckelt, Artikel bleibt oben.
      : {
        huelle: undefined,
        klassen: 'fixed inset-x-0 bottom-0 z-modal',
        stil: { maxHeight: `${BLATT_ANTEIL}dvh` } as CSSProperties,
      };
}
