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

/** ── RUNDE 2 (24.9.2026) · FESTE HÖHE STATT DECKEL, MOBIL HÖHER ────────────
 *
 *  DER SPRUNG (gemessen OR @390×844, Blatt öffnen, Rahmen alle 50–600 ms):
 *  0–600 ms oben 527 / hoch 317 px («Entscheide werden geladen …»), ab ~1,2 s
 *  oben 380 / hoch 464 px — das Blatt sprang 147 px nach oben, sobald die
 *  Liste kam, und die Griffleiste wanderte mit (Wurzel der Wisch-Flacker vom
 *  23.9.2026). WURZEL: `maxHeight` ist ein Deckel, die Höhe folgte dem
 *  Inhalt. Darum jetzt `height` — dieselbe Lösung wie die Spur («feste Höhe
 *  statt Deckel, damit ein Reiterwechsel die Spalte nicht springen lässt»).
 *
 *  DER ANTEIL (mobil): die Ä55-Regel bleibt der Massstab — über dem Blatt
 *  steht der Artikelkopf mit seiner ersten Zeile. Das bewacht
 *  `e2e/leser-v3-panel-nachzug.e2e.ts` als ≥ 120 px Streifen unter dem
 *  klebenden Kopf (`--nt-stick`, gemessen 190 px @390/375/320). Also reicht
 *  das Blatt bis 8 rem (128 px, 8 px Luft über der Test-Schwelle) unter den Kopf, nie weniger als die bisherigen 55 %
 *  und nie mehr als 70 % (darüber wäre es ein Vollbild-Dialog mit Rundung):
 *  @390×844 → 526 px = 62 % (statt 464), @375×667 und @320×568 → 55 % wie
 *  bisher (dort lässt der Kopf keinen Raum für mehr). Im Pane bleibt es bei
 *  55 % der Overlay-Schicht — dort steht ein zweiter Text daneben. */
const BLATT_HOEHE_MOBIL = `min(70dvh, max(${BLATT_ANTEIL}dvh, calc(100dvh - var(--nt-stick, 11.875rem) - 8rem)))`;

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
        // S6 W1g (24.9.2026, Board «Fliesstext-Blatt»): bis zur Fensterunterkante
        // — die 1.5 rem Luft unten gehörten zur Karte (Rahmen, Radius), die das
        // Blatt als Spalte nicht mehr trägt (index.css `[data-v3-panel-form='spalte']`).
        stil: { top: 'var(--nt-stick)', height: 'calc(100vh - var(--nt-stick))' },
      },
      klassen: 'flex min-h-0 flex-1 flex-col [&>*]:flex-1',
      stil: {},
    }
    : imPaneBlatt
      // Pane · unten angeschlagen in der Overlay-Schicht (die den Pane deckt).
      ? {
        traeger: ohneBox,
        klassen: 'pointer-events-auto absolute inset-x-0 bottom-0 z-modal [&>*]:min-h-0 [&>*]:flex-1',
        stil: { height: `${BLATT_ANTEIL}%` } as CSSProperties,
      }
      // H · echtes Bottom-Sheet: unten angeschlagen, gedeckelt, Artikel bleibt oben.
      : {
        traeger: ohneBox,
        klassen: 'fixed inset-x-0 bottom-0 z-modal [&>*]:min-h-0 [&>*]:flex-1',
        stil: { height: BLATT_HOEHE_MOBIL } as CSSProperties,
      };
}
