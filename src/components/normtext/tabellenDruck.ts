// Breite Tabellen im Druck (W2·17-UI-BEFUNDE, Gegenprüfung #1279, §1/§8).
//
// Befund (A4 hoch, Spaltenbreite ≈ 589 px): Tabellen mit vielen Spalten oder langem
// Fliesstext passen auch mit kleiner Schrift nicht in die Spalte — das Papier schnitt
// sie still ab (FINFRAV-FINMA Anh. 1, VZV Anh. 3a, ERV Anh. 2, VVK, ZEMIS-V). Ein
// Ausdruck, dem Zellen fehlen, ohne dass es dasteht, ist falscher Rechtsinhalt.
//
// NUR STATISCH, beim Rendern (dritte Gegenprüfung #1279, §17-Gegengewicht): ein
// Druck-Ereignis (`beforeprint`/`matchMedia`) feuert in Chromium vor jedem Druck, auch bei
// schmalen Tabellen, und markierte unter Bildschirm-Stilen jede Tabelle als breit — jede
// landete auf einer eigenen Querformat-Seite (GebV SchKG 7/7, ZH-211.11 2/2). Darum:
// aus den Zelltexten wird eine Mindestbreite GESCHÄTZT; über der Hochformat-Spalte setzt
// das Markup `data-breit` und `--druck-zoom-vorab` (Querformat-Seite, kleinere Schrift,
// siehe index.css), und unter MIN_PT gedruckter Zellschrift `data-gekuerzt` (gedruckte
// Hinweiszeile). Kein Ereignis, kein Messen, kein Zustand. Geprüft ist nur Chromium.

/** Gedruckte Lesespalte A4 hoch (Rand 1.6 cm): gemessen 589 px. */
const SPALTE_HOCH = 589;
const MIN_ZOOM = 0.3;
const BASIS_ZOOM = 0.8;
/** Gedruckte Zellschrift bei Zoom 1 (pt): aus dem PDF gemessen (VAM Anh. 1: Zoom 0.57 → 6.7 pt). */
const ZELL_PT = 11.75;
/** Unter dieser gedruckten Zellschrift (pt) ist die Tabelle praktisch unlesbar: Hinweis. */
const MIN_PT = 8;
/** Genutzte Breite A4 quer (20.5 cm ≈ 775 px, siehe `data-breit` in index.css), mit Sicherheitsrand. */
const QUER = 750;
/** Mittlere Zeichenbreite (px) für die Schätzung, Zellrand je Spalte (px-3). */
const ZEICHEN_PX = 8;
const RAND_PX = 24;
/** Korrektur der Schätzung MIT RESERVE (vierte Prüfung #1279: LRV Anh. 3 verlor in der CI unter Linux-Schriften
 *  Zellen, weil sie mit 1.15 «nicht breit» blieb). Kalibriert an allen 674 Korpus-Tabellen (3.10.2026,
 *  Mindestbreite im Druck gemessen, Mac-Schriften): die Schätzung liegt im Median 16 % unter der Messung,
 *  im Extrem (LRV Anh. 3) 31 %. Mit 1.5 ist JEDE Tabelle markiert, deren gemessene Mindestbreite innerhalb von
 *  10 % der Hochformat-Grenze liegt (0 gefährdete verpasst); markiert sind 169, davon passen 115 auch im
 *  Hochformat (Fehlalarm = eine Querformat-Seite zu viel, kein Verlust). Lieber ein Fehlalarm als ein Verlust. */
const KORREKTUR = 1.5;

export type VorabDruck = { breit: boolean; klein: boolean; zoom: number; geschaetzt: number };

/** Schätzt aus den Zelltexten, ob eine Tabelle im Hochformat nicht passt. Je Spalte zählt die
 *  breiteste Zelle: einzeilige Zelle = ganze Länge, umbrechbare = längstes Wort.
 *  `spalten[ci]` = Zellen der Spalte `{ text, umbrechbar }`. */
export function vorabDruck(spalten: { text: string; umbrechbar: boolean }[][]): VorabDruck {
  let geschaetzt = 0;
  for (const zellen of spalten) {
    let w = 0;
    for (const z of zellen) {
      const laenge = z.umbrechbar ? Math.max(0, ...z.text.split(/\s+/).map((x) => x.length)) : z.text.trim().length;
      w = Math.max(w, laenge * ZEICHEN_PX);
    }
    if (w > 0) geschaetzt += w + RAND_PX;
  }
  geschaetzt *= KORREKTUR;
  const breit = geschaetzt > SPALTE_HOCH / BASIS_ZOOM;
  const zoom = Math.max(MIN_ZOOM, Math.min(BASIS_ZOOM, QUER / Math.max(geschaetzt, 1)));
  return { breit, klein: breit && zoom * ZELL_PT < MIN_PT, zoom, geschaetzt };
}
