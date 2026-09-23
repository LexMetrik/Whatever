// v3/useLeserBereit.ts — der EINE Bereitschaftsmarker des Lesers
// (W2·29-WERKBANK-LESER S0, Flacker-Regel David 23.9.2026).
//
// ── WOFÜR ─────────────────────────────────────────────────────────────────────
// Sonden (`e2e/helpers/leserBereit.ts`) brauchen einen Zeitpunkt, ab dem der
// Leser «steht»: Einträge gerendert, Struktur-Sidecar beantwortet, und die
// Nachlade-Welle, die beides auslöst (Gliederungsbaum, Beobachter, Zähler),
// hat den Main-Thread wieder freigegeben. Bis hierher warteten die Specs auf
// Stellvertreter (`#art-1`, den Ansicht-Öffner) — beide stehen, SOBALD der
// erste Client-Render da ist, also MITTEN in der Nachlade-Kette. Wer dann
// tippt, lässt den teuren Such-Commit (`sucheAktiv`) mit dieser Kette um den
// Main-Thread konkurrieren (Messreihe im Commit, Flackerer
// `leser-suche-a35-a40-a41` Z. 89, Lauf 35779952911).
//
// ── WAS «BEREIT» HEISST (deterministisch, kein Timer-Raten) ─────────────────
//   1. `eintraegeDa` — der Snapshot ist im Zustand (`m.eintraege !== null`);
//   2. die Struktur-Promise ist ERLEDIGT — dieselbe gecachte Promise, die
//      `inhalt-hooks` für Gliederung und Kopf abonniert (kein zweiter Fetch:
//      gleiche Daten-Ebene `erlass.ebene`, s. Falle in `../bezuegeZaehler`);
//      `null` (404) zählt als erledigt — ein Erlass ohne Sidecar ist bereit;
//   3. danach die ERSTE Leerlauf-Welle (`requestIdleCallback` OHNE Timeout —
//      der Rückruf läuft erst, wenn der Browser tatsächlich nichts zu tun hat).
// Nur wo `requestIdleCallback` fehlt (Safari, jsdom), fällt der Marker auf
// einen Makrotask zurück; die Sonden laufen in Chromium.
//
// ── WAS HIER NICHT PASSIERT ───────────────────────────────────────────────────
// Kein Einfluss auf Darstellung oder Verhalten: der Marker ist ein reines
// Daten-Attribut für Sonden (`data-leser-bereit` an `#lc-lesespalte`). Er
// wechselt mit dem Erlass-Schlüssel zurück auf «nicht bereit».
import { useEffect, useState } from 'react';
import { ladeStruktur } from '../../../lib/normtext/browse';

type LeerlaufFenster = typeof window & {
  requestIdleCallback?: (cb: () => void) => number;
  cancelIdleCallback?: (id: number) => void;
};

function ersteLeerlaufWelle(cb: () => void): () => void {
  const w = window as LeerlaufFenster;
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(cb);
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, 0);
  return () => window.clearTimeout(id);
}

/** `true`, sobald der Leser für `erlass` bereit ist (Definition oben). */
export function useLeserBereit(erlass: { ebene: string; key: string } | null | undefined, eintraegeDa: boolean): boolean {
  // Der Zustand trägt den Schlüssel, zu dem er gehört (Muster `useBezuegeZaehler`):
  // beim Erlass-Wechsel gilt der alte Marker sofort nicht mehr, ohne synchronen
  // setState im Effekt-Rumpf.
  const [bereitFuer, setBereitFuer] = useState<string | null>(null);
  const ebene = erlass?.ebene;
  const key = erlass?.key;
  useEffect(() => {
    if (!ebene || !key || !eintraegeDa) return;
    let lebt = true;
    let abbrechen = () => {};
    void ladeStruktur(ebene, key).then(() => {
      if (!lebt) return;
      abbrechen = ersteLeerlaufWelle(() => { if (lebt) setBereitFuer(key); });
    });
    return () => { lebt = false; abbrechen(); };
  }, [ebene, key, eintraegeDa]);
  return eintraegeDa && key !== undefined && bereitFuer === key;
}
