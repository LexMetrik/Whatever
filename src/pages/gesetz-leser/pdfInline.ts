import { useEffect, useState } from 'react';

// ─── LESER-NAV/O-34b · PDF-Platzhalter endlos (PA-13-D02) ─────────────────────
// BEFUND (gemessen 15.10.2026, Dev-Server, Playwright-Chromium, `/gesetze/bund/NYUE`):
// `PdfEmbedAnsicht` hängt den Ladezustand an `onLoad` des iframes. Browser OHNE
// eingebauten PDF-Viewer (Chromium-headless-shell, die meisten mobilen Chrome-
// Fassungen) laden das PDF nicht ins Frame, sondern laden es herunter — `load`
// feuert nie, der Spinner «Amtliches PDF wird geladen …» liegt für immer über
// einer leeren Fläche (`navigator.pdfViewerEnabled === false`; mit Viewer,
// `channel: 'chromium'`, verschwindet er nach dem ersten Zeichnen).
//
// FIX in zwei Stufen, beide ohne Rechtsinhalt (§3):
//   1. `pdfViewerEnabled === false` ⇒ gar kein Frame, sondern ehrlicher Hinweis
//      mit Download-/Neu-Tab-Link (§8: nicht «lädt», was nie laden wird).
//   2. Zeitdeckel für den Spinner (Browser, die `pdfViewerEnabled` nicht melden):
//      danach fällt nur der Platzhalter, das Frame bleibt gemountet.
// Erstrender und erster Client-Render sind unverändert («inline» + Spinner), erst
// ein Timer-Tick entscheidet — Prerender-Markup bleibt byte-gleich.

/** Spinner-Obergrenze. Ein Viewer zeichnet das erste PDF-Bild in Sekunden; 12 s
 *  decken langsame Mobilnetze für das Fedlex-PDF (NYÜ ≈ 100 kB) grosszügig ab. */
export const PDF_LADE_DECKEL_MS = 12_000;

export type PdfAnzeige = 'inline' | 'ohne-viewer';

/** Reine Entscheidung: kann dieser Browser ein PDF im Frame zeigen?
 *  Nur ein ausdrückliches `false` zählt als «nein» — fehlt die Eigenschaft
 *  (ältere Browser), bleibt es beim bisherigen Frame plus Zeitdeckel. */
export function pdfAnzeige(nav: { pdfViewerEnabled?: boolean } | undefined | null): PdfAnzeige {
  return nav?.pdfViewerEnabled === false ? 'ohne-viewer' : 'inline';
}

export function usePdfAnzeige(bereit: boolean): { anzeige: PdfAnzeige; deckelAbgelaufen: boolean } {
  const [anzeige, setAnzeige] = useState<PdfAnzeige>('inline');
  const [deckelAbgelaufen, setDeckel] = useState(false);
  useEffect(() => {
    // 0-ms-Timer statt setState im Effektkörper (Muster `useWeiterlesen`).
    const id = window.setTimeout(() => setAnzeige(pdfAnzeige(typeof navigator === 'undefined' ? null : navigator)), 0);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    if (bereit) return;
    const id = window.setTimeout(() => setDeckel(true), PDF_LADE_DECKEL_MS);
    return () => window.clearTimeout(id);
  }, [bereit]);
  return { anzeige, deckelAbgelaufen };
}
