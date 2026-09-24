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
  /** Klassen und Stil des Trägers — nur die Spur (`spalte`) hat eine Box. */
  traeger: { klassen: string; stil: CSSProperties | undefined };
  klassen: string;
  stil: CSSProperties;
}

/** `spalte` = offenes Blatt als eigene Spur (Entscheid A, 24.9.2026);
 *  `imPaneBlatt` = das Blatt hängt in der Overlay-Schicht eines Panes. */
export function blattFlaeche(spalte: boolean, imPaneBlatt: boolean): BlattFlaeche {
  // ── Der Träger ────────────────────────────────────────────────────────────
  // Ohne Spur `display: contents`: die Kinder sind `fixed` bzw. `absolute` und
  // brauchen keinen Platz im Fluss (§15/2, CLS 0) — ein Kasten erzeugte im Grid
  // eine implizite Spalte samt Abstand, die niemand angefordert hat.
  const ohneBox = { klassen: 'contents', stil: undefined };
  return spalte
    // ── ENTSCHEID A (David 24.9.2026) · DAS BLATT IST EINE SPUR ────────────
    // D33 (7.9.2026) hatte es als 0-Höhen-Hülle über die Lese-Zelle gelegt, D-1
    // (23.9.2026) an den Fensterrand gerückt (`useFensterRand`, zurückgebaut).
    // Beides deckte Zeilenenden ab (Analyse 24.9.2026: @1024/1280/1440 343/215/
    // 135 px). Jetzt ist der Träger selbst die dritte Grid-Zelle — Geometrie
    // WÖRTLICH wie das Gliederungs-`aside` (`./LeserLeseZeile`): klebt bei
    // `--nt-stick`, eigene Scrollfläche, reicht bis zur Fensterunterkante (feste
    // Höhe statt Deckel, damit ein Reiterwechsel die Spalte nicht springen lässt).
    ? {
      traeger: {
        klassen: 'sticky flex min-h-0 flex-col self-start',
        stil: { top: 'var(--nt-stick)', height: 'calc(100vh - var(--nt-stick) - 1.5rem)' },
      },
      klassen: 'flex min-h-0 flex-1 flex-col [&>*]:flex-1',
      stil: {},
    }
    : imPaneBlatt
      // Pane · unten angeschlagen in der Overlay-Schicht (die den Pane deckt).
      ? {
        traeger: ohneBox,
        klassen: 'pointer-events-auto absolute inset-x-0 bottom-0 z-modal',
        stil: { maxHeight: `${BLATT_ANTEIL}%` } as CSSProperties,
      }
      // H · echtes Bottom-Sheet: unten angeschlagen, gedeckelt, Artikel bleibt oben.
      : {
        traeger: ohneBox,
        klassen: 'fixed inset-x-0 bottom-0 z-modal',
        stil: { maxHeight: `${BLATT_ANTEIL}dvh` } as CSSProperties,
      };
}
