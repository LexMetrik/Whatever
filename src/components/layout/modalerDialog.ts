// ─── EIN Selektor für «offener modaler Dialog» (W2·17-UI-BEFUNDE, §5) ────────
//
// Bis 2.10.2026 stand `[role="dialog"][aria-modal="true"]` viermal als Literal
// (Shell.tsx F6, LeserTastatur.tsx Guard 3 und «r», fruehesSuchKuerzel.ts). Die
// Frage «liegt hinter mir ein modaler Dialog?» hat damit EINE Antwort — sie
// wohnt hier. Bewusst ohne Import: das Modul liegt auch im Einstiegs-Bundle
// (`fruehesSuchKuerzel`, Vorlauf vor dem ersten React-Commit).

/** Selektor der offenen modalen Dialoge (`aria-modal="true"`; Panes/Sheets ohne
 *  Fokus-Falle tragen es nicht, s. `ui/SheetRahmen`, `LesemodusOverlay`). */
export const MODALER_DIALOG = '[role="dialog"][aria-modal="true"]';

/** Alle gerade offenen modalen Dialoge; ohne DOM (SSR) leer. */
export function offeneModaleDialoge(): ArrayLike<Element> {
  return typeof document === 'undefined' ? [] : document.querySelectorAll(MODALER_DIALOG);
}
