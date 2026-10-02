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
// «Ansicht ▾» (`LeserAnsichtV3`), das Reiter-Kontextmenü (`ReiterMenue`), der
// Verlauf (`VerlaufUebersicht`, `role="dialog"` OHNE `aria-modal`) und die
// Sprachwahl (`SprachUmschalter`) sind Schwebeflächen mit Menü-Anatomie und Fokus
// im Inneren, aber KEIN `aria-modal` (sie lassen den Rest der Seite lesbar) —
// `MODALER_DIALOG` sieht sie darum nicht. Gemessen im Browser: mit offenem Ansicht-
// Menü schob «t» den Fokus in die Gliederung; mit offenem Verlauf sprang «j» von
// Art. 1 auf Art. 2 und «→» auf Art. 3. Was ein Menü an Tasten braucht (Pfeile,
// Home/End, Esc, Enter), trägt das Menü selbst; Einzelzeichen-Kürzel dahinter
// bedienen ein Dokument, das man gerade nicht anfasst.
//
// EINE Markierung statt einer wachsenden Selektorliste (§5): jede solche Fläche
// trägt `data-menue-flaeche` an ihrem Wurzelelement (nur gemountet, solange offen).
// Eine neue Fläche mit Menü-Anatomie setzt das Attribut — hier ändert sich nichts.

/** Selektor der gerade offenen Menü-Flächen. */
const OFFENES_MENUE = '[data-menue-flaeche]';

/** Ist gerade ein Menü offen? Ohne DOM (SSR) nie. */
export function menueOffen(): boolean {
  return typeof document !== 'undefined' && document.querySelector(OFFENES_MENUE) !== null;
}
