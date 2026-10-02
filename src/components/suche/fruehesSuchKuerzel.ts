// ─── ⌘K / «/» AB DEM ERSTEN PAINT · der Vorlauf vor dem ersten React-Commit ──
//
// BEFUND (§17-Wurzel-Fix, 4.9.2026 — CI-Shard 3/8 war in 6 von 6 main-Läufen
// flaky, stets an «⌘K/Ctrl-K fokussiert die Suchleiste»): Die globale
// Kürzel-Bindung hing AUSSCHLIESSLICH in einem `useEffect` von `HeaderSuche`.
// Ein Effekt läuft erst nach dem ersten React-Commit; `createRoot().render()`
// (render-then-replace, `scripts/prerender.ts`) plant diesen Commit aber nur.
// Zwischen `DOMContentLoaded` und dem Commit liegt darum ein Fenster, in dem
// KEIN Zuhörer existiert — wer dort ⌘K drückt, drückt ins Leere. Das ist kein
// Test-Artefakt: auf dem 2-vCPU-Runner ist das Fenster nur breiter als auf
// einem schnellen Rechner.
//
// GEMESSEN am origin/main-Stand (lokal, ungedrosselt, `vite preview`), Sonde
// drückt Ctrl-K unmittelbar nach `domcontentloaded`: 0/20 fokussiert.
// Kontrollprobe derselben Sonde nach `networkidle` (also nach dem Commit):
// 5/5. Nicht der Runner ist zu langsam — die Bindung existiert noch nicht.
//
// DAS MUSTER, in einem Satz: Dieses Modul wird beim AUSWERTEN des Einstiegs-
// moduls (`main.tsx`) registriert und MERKT einen Tastendruck, der vor dem
// Mount anfällt; `HeaderSuche` meldet sich beim Mount als Empfänger an und löst
// den gemerkten Wunsch sofort ein. Solange ein Empfänger angemeldet ist, hält
// sich dieses Modul vollständig heraus — die eingespielte Kürzel-Mechanik
// (Vorrangregel B1 gegenüber dem V3-Leser, Panel-Verhalten, Mobil-Lupe) bleibt
// unverändert dort, wo sie ist.
//
// WARUM KEIN INLINE-MIKROSKRIPT im prerenderten HTML: die Auslieferung setzt
// `script-src 'self'` OHNE `'unsafe-inline'` (`vercel.json`) — ein Inline-
// Script liefe im Browser gar nicht. Dieselbe Grenze zwingt `main.tsx` schon
// beim Thema («ohne CSP-verbotenes Inline-Script»). Ein Hash/Nonce in der CSP
// wäre eine zweite, von Hand gepflegte Wahrheit neben dem Skript (§5). Das
// Einstiegs-Bundle ist dagegen `'self'` und — weil `type="module"` implizit
// `defer` ist — ausgeführt, BEVOR `DOMContentLoaded` feuert. Genau die
// geforderte Frühe, ohne neue Datei im Auslieferungspfad, ohne DOM-Eingriff
// und damit ohne Layout-Shift.

import { offeneModaleDialoge } from '../layout/modalerDialog';

/** Tippt der Nutzer gerade in ein Feld? Dann ist «/» ein Zeichen, kein Kürzel.
 *  ⌘K/Ctrl-K greift auch dort — es ist der Einstieg von überall. */
function inEingabe(ziel: EventTarget | null): boolean {
  const el = ziel as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const t = el.tagName.toLowerCase();
  return t === 'input' || t === 'textarea' || t === 'select' || el.isContentEditable === true;
}

/** Die ENTSCHEIDUNG, getrennt vom Vollzug: ist dieser Tastendruck das Such-
 *  Kürzel? Rein und DOM-frei, damit die Regel an jeder Kombination prüfbar ist
 *  statt nur an den zweien, die ein e2e zufällig drückt (§2, §6.7). Nimmt
 *  bewusst ein Struktur-Literal und kein `KeyboardEvent` — Vitest läuft hier in
 *  `environment: 'node'`.
 *
 *  §5-UMZUG 4.9.2026: stand bis hierher in `pages/gesetz-leser/v3/suchKuerzel`
 *  und wird von dort unverändert re-exportiert (Wortlaut, Signatur und
 *  Prüfungen unberührt). Grund: der Vorlauf unten braucht dieselbe Entscheidung
 *  im Einstiegs-Bundle, und eine zweite Kopie wäre beim ersten Nachjustieren
 *  auseinandergelaufen. */
export function istSuchKuerzel(e: {
  key: string; metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean; target?: EventTarget | null;
}): boolean {
  if (e.altKey) return false;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') return true;
  return e.key === '/' && !e.metaKey && !e.ctrlKey && !inEingabe(e.target ?? null);
}

/** ── W2·17-UI-BEFUNDE C2-B01/B02 (2.10.2026) · NICHT HINTER EINEN MODALEN DIALOG
 *  Liegt das Such-Feld, das das Kürzel bedienen würde, HINTER einem offenen
 *  modalen Dialog? Dann gehört der Tastendruck dem Dialog und keinem Feld.
 *
 *  BEFUND (reproduziert 2.10.2026, Chromium, `vite` lokal): bei offenem Dialog
 *  «Tastatur-Kurzbefehle» (StPO, 1440) zog Ctrl+K den Fokus auf das Leser-Feld
 *  dahinter, ebenso «/»; bei der offenen Navigations-Schublade (375, /gesetze)
 *  tat dasselbe die Kopfleisten-Suche. Beide Male lag `document.activeElement`
 *  ausserhalb des Dialogs, der Nutzer tippte in ein verdecktes Feld (WCAG 2.4.3,
 *  Fokus-Reihenfolge; ARIA-Dialog-Pattern).
 *
 *  GEWÄHLT: der Tastendruck SCHWEIGT, statt den Dialog erst zu schliessen. Das
 *  ist dasselbe Muster, das die Fläche schon an zwei Stellen trägt — F6 in
 *  `Shell.tsx` («Offenen modalen Dialog nicht verlassen») und Guard 3 in
 *  `parts/LeserTastatur` («hinter einem offenen modalen Dialog wird nichts
 *  bedient»); und es passt zu `useDialogFokus`, dessen Dialoge den Fokus selbst
 *  halten und nur auf Esc/Tab hören: ein Kürzel, das einen Dialog von aussen
 *  wegräumt, kennt weder dessen Zustand (Eingaben in `MappenDialog`, offene
 *  Auswahl im Filter-Sheet) noch dessen `onClose`; ein synthetisches Esc wäre
 *  geraten. Wer suchen will, schliesst den Dialog (Esc) und drückt erneut.
 *
 *  AUSNAHME: steht das Feld SELBST im Dialog (Gliederungs-Sheet, A2 — dort
 *  zieht der Rahmen das Feld in das Blatt), bleibt das Kürzel bedienbar; sonst
 *  gäbe es im Blatt keinen Weg mehr zur Suche.
 *
 *  Der Aufrufer ruft dies VOR `preventDefault`: ein schweigender Empfänger
 *  beansprucht den Tastendruck nicht, der Browser-Standard bleibt unberührt.
 *
 *  `modale` ist ein Parameter, weil Vitest ohne DOM läuft (`environment:
 *  'node'`): die Entscheidung ist so an jeder Lage prüfbar. */
export function kuerzelHinterModal(
  feld: unknown,
  modale: ArrayLike<{ contains: (n: never) => boolean }> = offeneModaleDialoge(),
): boolean {
  for (let i = 0; i < modale.length; i++) {
    // Kein Feld (noch nicht gerendert) ⇒ es liegt in keinem Dialog.
    if (feld == null || !modale[i].contains(feld as never)) return true;
  }
  return false;
}

/** Der angemeldete Empfänger — gesetzt, sobald `HeaderSuche` montiert ist. */
let empfaenger: (() => void) | null = null;
/** Ein Tastendruck aus dem Vorlauf, der noch auf seinen Empfänger wartet. */
let wunschOffen = false;
let laeuft = false;

function vorlauf(e: KeyboardEvent): void {
  // Ab hier ist React da: die Kürzel-Mechanik von `HeaderSuche` (und die
  // Capture-Vorrangregel des V3-Lesers) entscheidet allein.
  if (empfaenger) return;
  // Vorrangregel B1 (16.8.2026) gilt auch im Vorlauf: wer in der Capture-Phase
  // schon beansprucht hat, gewinnt.
  if (e.defaultPrevented) return;
  if (!istSuchKuerzel(e)) return;
  // C2-B01/B02: hinter einem offenen modalen Dialog wartet kein Feld auf den
  // Tastendruck — er wird weder gemerkt noch beansprucht.
  if (kuerzelHinterModal(null)) return;
  // Den Browser-Default (⌘K = Adresszeile) unterbinden, sonst tippt der Nutzer
  // seine Suche ins falsche Fenster.
  e.preventDefault();
  wunschOffen = true;
}

/** Registriert den Vorlauf. Aufruf auf Modul-Ebene in `main.tsx` — dort läuft
 *  er vor `createRoot().render()` und damit vor `DOMContentLoaded`. */
export function fruehesSuchKuerzelStarten(): void {
  if (laeuft) return;
  laeuft = true;
  window.addEventListener('keydown', vorlauf);
}

/** Das Suchfeld meldet sich als Empfänger an — und löst dabei einen im Vorlauf
 *  gemerkten Tastendruck ein (höchstens einmal; der Wunsch ist danach
 *  verbraucht). Das Einlösen läuft bewusst DEFERRED: der Aufrufer ist ein
 *  React-Effekt, und ein synchroner `setState` in dessen Rumpf kaskadiert
 *  Renders (Repo-Muster, Tor `lint`/`react-hooks/set-state-in-effect`). */
export function suchKuerzelEmpfaengerAnmelden(fokussiere: () => void): void {
  empfaenger = fokussiere;
  if (!wunschOffen) return;
  wunschOffen = false;
  window.setTimeout(fokussiere, 0);
}

/** Abmelden beim Unmount — nur die EIGENE Anmeldung, damit ein Aufräumen nicht
 *  einen inzwischen angemeldeten zweiten Empfänger abräumt. */
export function suchKuerzelEmpfaengerAbmelden(fokussiere: () => void): void {
  if (empfaenger === fokussiere) empfaenger = null;
}
