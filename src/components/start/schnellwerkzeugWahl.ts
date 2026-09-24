// ─── Schnellwerkzeug der Startseite: welche Variante (U2, 24.9.2026) ─────────
//
// David 24.9.2026: «ich möchte dass man bei den schnellwerkzeugen auswählen
// kann» — Auswahl Frist · Verzugszins · Verjährung, die Wahl merkt sich der
// Browser (FAHRPLAN-WERKBANK-UMBAU §5d-bis U2: «Komfort, darf fehlen»).
// Darum: jeder Speicherzugriff in try/catch (privater Modus, gesperrter
// Speicher, Vorschau), und alles Unbekannte — fehlend, kaputt, alt — ist
// «frist», die Variante des Prerenders. Reine Darstellungs-Einstellung, keine
// Rechtslogik (§3).

export type SchnellWahl = 'frist' | 'verzugszins' | 'verjaehrung';

/** Reihenfolge = Reihenfolge der Reiter. `titel` ist die Flächen-Überschrift. */
export const SCHNELL_WAHLEN: readonly { code: SchnellWahl; label: string; titel: string }[] = [
  { code: 'frist', label: 'Frist', titel: 'Schnellwerkzeug · Frist berechnen' },
  { code: 'verzugszins', label: 'Verzugszins', titel: 'Schnellwerkzeug · Verzugszins berechnen' },
  { code: 'verjaehrung', label: 'Verjährung', titel: 'Schnellwerkzeug · Verjährung prüfen' },
];

export const SCHNELL_WAHL_STANDARD: SchnellWahl = 'frist';
export const SCHNELL_WAHL_KEY = 'lexmetrik.start.schnellwerkzeug';

const istWahl = (v: unknown): v is SchnellWahl => SCHNELL_WAHLEN.some((w) => w.code === v);

/** Gespeicherte Wahl; ohne Speicher oder bei unbekanntem Wert der Standard. */
export function leseSchnellWahl(): SchnellWahl {
  try {
    const v = localStorage.getItem(SCHNELL_WAHL_KEY);
    return istWahl(v) ? v : SCHNELL_WAHL_STANDARD;
  } catch {
    return SCHNELL_WAHL_STANDARD;
  }
}

/** Merkt die Wahl; scheitert still (Komfort, kein Zustand, der fehlen darf). */
export function speichereSchnellWahl(w: SchnellWahl): void {
  try { localStorage.setItem(SCHNELL_WAHL_KEY, w); } catch { /* privat-Modus */ }
}
