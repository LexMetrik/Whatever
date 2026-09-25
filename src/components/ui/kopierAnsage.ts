// ═══ Kopier-Quittung für Screenreader — EINE Ansage-Region (REST S5b) ═══════
//
// Anlass: QS-UI Runde 8 «⧉-Quittung» (Entscheid David 24.9.2026 → REST S5).
// GEMESSEN 25.9.2026 am Quelltext: jede Kopier-Fläche der App quittiert über
// `useKopieren` SICHTBAR (Text- oder Glyphen-Tausch «⧉ Zitat kopieren» →
// «✓ kopiert», PaneKopf «⧉» → «✓», KopierButton «… kopieren» → «Kopiert ✓»),
// aber KEINE sagt es einem Screenreader an: ein Textwechsel IN einem Knopf ist
// keine Live-Region, und die Knöpfe mit festem `aria-label` (ZitierMarke,
// ArtikelAktionen «Permalink kopieren») ändern nicht einmal ihren Namen. Die
// einzige Ansage stand in `rechtsprechung/EntscheidBody` (eigene Region, R4-D-
// Ausnahme, Körper byte-gleich — bleibt).
//
// LÖSUNG AM GETEILTEN HOOK (§10): `useKopieren` legt beim ersten Mount EINE
// höfliche Live-Region an (`#lm-kopier-ansage`, sr-only, direkt in `body`,
// ausserhalb jedes Panes und darum auch nach dem Schliessen eines Menüs noch
// da) und schreibt NACH erfolgreichem Schreiben die Ansage hinein. Die Region
// steht vor dem ersten Klick im DOM — eine erst mit dem Text eingefügte Region
// wird von Screenreadern oft überhört (Posten NACHLAUF «Ladeanzeige
// role=status»). Wechselnder Inhalt (geschütztes Leerzeichen im Wechsel), damit
// dieselbe Kopie zweimal hintereinander erneut angesagt wird (Muster Zähler `n`
// in EntscheidBody). Kein Prerender-Eintrag: die Region entsteht im Effekt.

export const KOPIER_ANSAGE_ID = 'lm-kopier-ansage';
export const KOPIER_ANSAGE_TEXT = 'In die Zwischenablage kopiert';

let wechsel = false;

/** Die eine Region — anlegen, falls sie fehlt. Ohne DOM (SSR) `null`. */
export function kopierAnsageRegion(): HTMLElement | null {
  if (typeof document === 'undefined' || !document.body) return null;
  let el = document.getElementById(KOPIER_ANSAGE_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = KOPIER_ANSAGE_ID;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.className = 'sr-only';
    document.body.appendChild(el);
  }
  return el;
}

/** Ansage nach erfolgreichem Kopieren (nie vorher, §8). */
export function sageKopiertAn(text: string = KOPIER_ANSAGE_TEXT): void {
  const el = kopierAnsageRegion();
  if (!el) return;
  wechsel = !wechsel;
  el.textContent = wechsel ? text : `${text} `;
}
