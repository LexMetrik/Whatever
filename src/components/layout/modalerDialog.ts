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

// ─── Offenes MENÜ (G4-B01, 2.10.2026) · die Schwester des modalen Dialogs ────
//
// «Ansicht ▾» (`LeserAnsichtV3`) und das Reiter-Kontextmenü (`ReiterMenue`) sind
// Schwebeflächen mit Fokus-Falle, aber KEIN `aria-modal` (sie lassen den Rest der
// Seite lesbar) — `MODALER_DIALOG` sieht sie darum nicht. Gemessen im Browser: mit
// offenem Ansicht-Menü schob «t» den Fokus in die Gliederung, das Menü blieb offen.
// Was ein Menü an Tasten braucht (Pfeile, Home/End, Esc, Enter), trägt das Menü
// selbst; Einzelzeichen-Kürzel dahinter bedienen ein Dokument, das man gerade nicht
// anfasst. `data-v3-ansicht-panel` ist die Schwebefläche samt Schriftregler (der
// liegt ausserhalb von `role="menu"`, s. `LeserAnsichtV3`), `role="menu"` jedes andere.

/** Selektor der gerade offenen Menüs (gemountet nur, solange sie offen sind). */
export const OFFENES_MENUE = '[data-v3-ansicht-panel], [role="menu"]';

/** Ist gerade ein Menü offen? Ohne DOM (SSR) nie. */
export function menueOffen(): boolean {
  return typeof document !== 'undefined' && document.querySelector(OFFENES_MENUE) !== null;
}
