// ─── WELCHES PANE beansprucht einen Tastendruck? (A3/A2, eine Quelle) ────────
//
// BEFUND 1, gemessen 17.8.2026 im Split @1600 (BGFA | BGBM, `?leser=v3`): seit
// Ä19 hat JEDES Pane ein Suchfeld, also lief der ⌘K-Hook zweimal und hängte zwei
// `window`-Listener in derselben Capture-Phase. Beide beanspruchten den
// Tastendruck, beide reichten Fokus nach — der zuletzt registrierte gewann.
// Gemessen: Fokus im primären Pane, ⌘K ⇒ Fokus landete im SEKUNDÄREN Feld
// (`imPrimaer:false, imSekundaer:true`), und ebenso, wenn er schon sekundär war.
// Das Kürzel bediente damit nie das Pane, in dem der Leser arbeitet.
//
// BEFUND 2, gemessen 17.8.2026 im Split (H3-Nachzug A2): dieselbe Frage stellte
// sich für die Taste «r» (Panel aufziehen) — nur hatte sie dort NICHT dieselbe
// Antwort. Der Leser-Tastatur-Listener lief absichtlich nur im PRIMÄREN Pane
// (ein zweiter globaler Listener hätte j/k doppelt springen lassen), also öffnete
// «r» aus dem sekundären Pane das Panel des primären. Ein Kürzel, das eine andere
// Fläche bedient als die, in der man liest, ist schlimmer als keines (§8).
//
// DIE REGEL, in einem Satz: der Tastendruck gehört dem Pane, in dem
// `document.activeElement` steht. Steht der Fokus in KEINEM Pane (Body, Topbar,
// Krume), gewinnt das ZULETZT BENUTZTE Pane — und erst wenn es das noch nicht
// gibt, das primäre (die Fläche, die der Leser sieht, wenn er noch nichts
// gewählt hat).
//
// W2·17-UI-BEFUNDE (F1-B01, 2.10.2026) — ZWEI LÜCKEN DER ERSTEN FASSUNG,
// gemessen am gebauten Stand (`e2e/leser-split-w217.e2e.ts`):
//  (1) «Kein Pane unter dem Fokus ⇒ primär» war zu grob. Das Blatt, das
//      Gliederungs-Sheet und jeder Popover hängen per Portal in der
//      Overlay-Schicht des Panes (`LeserPanelZone`, `Shell.tsx`) und liegen
//      damit AUSSERHALB von `[data-pane]` — der Fokus steht dort im sekundären
//      Fenster, die Auflösung sah ihn nirgends und gab dem primären den
//      Tastendruck. Gemessen @1600, Blatt des sekundären Panes offen, «r»:
//      beide Blätter offen (das primäre ging zusätzlich auf), statt dass das
//      Blatt, in dem man arbeitet, zuging. Die Overlay-Wurzel trägt zwar kein
//      `data-pane`, aber `data-v3-pane` (Rolle des Panes, Portal-Vertrag
//      `LeserRahmenV3`) — beide Marken zählen jetzt.
//  (2) Fällt der Fokus auf den Body (ein Knopf, der ihn trug, verschwindet; Esc
//      schliesst ein Blatt), wusste die Auflösung nichts mehr vom Pane, in dem
//      der Leser eben noch war, und fiel auf das primäre zurück — j/k/r wirkten
//      im FALSCHEN Fenster. Darum merkt sich dieses Modul das Pane des letzten
//      Klicks bzw. Fokus-Wechsels (`pointerdown`/`focusin`, Capture-Phase am
//      Dokument). Die Auflösung bleibt rein lesend: sie liest den Fokus bei
//      JEDEM Tastendruck, die Merkliste ist nur der Rückfall dahinter.
//      Ein Pane, das es nicht mehr gibt (✕), zählt nicht als Rückfall — und
//      ein NEU geöffnetes erbt die Merkung des alten nicht (Element-Identität).
//  (3) NACHZUG (Gegenprüfung #1275): auch Klicks auf die Titelleiste und auf
//      einen Reiter der Arbeitsleiste benennen ein Pane, liegen aber ausserhalb
//      von `[data-pane]` und `[data-v3-pane]`. Sie tragen darum `data-pane-bezug`
//      (`PaneKopf`: die eigene Rolle; `Reiter`: das Fenster, in dem er steht,
//      sonst das Hauptfenster). Ohne die Marke hätte «im rechten Pane lesen,
//      links in den Reiter klicken, r» das rechte Pane bedient — schlechter als
//      der alte Rückfall «primär».
//
// WARUM EIGENE, GETEILTE DATEI: sie ist die EINE Antwort für BEIDE Kürzel-Wege
// (`v3/suchKuerzel` für ⌘K/«/», `parts/LeserTastatur` für j/k/t/r/?). Bis zum
// H3-Nachzug stand sie in `v3/suchKuerzel.ts`; von dort hätte `parts/` sie nicht
// holen dürfen — die geteilten Bausteine rendert auch die Ist-Hülle und dürfen
// nicht an `v3/` hängen (FL-4, Abhängigkeitsrichtung). Zwei Kopien der Regel
// wären beim ersten Nachjustieren auseinandergelaufen (§5).
//
// §2: rein DOM-LESEND, ohne Zustand. Die Entscheidung fällt beim Tastendruck,
// nicht beim Registrieren des Listeners — sonst wäre sie beim Pane-Wechsel
// veraltet.

type PaneRolle = 'primaer' | 'sekundaer';

/** Rolle des Panes, in dem `el` steht — `[data-pane]` (Fläche selbst),
 *  `[data-v3-pane]` (Overlay-Schicht: Blatt, Sheet) oder `[data-pane-bezug]`
 *  (Bedienelement MIT Pane-Bezug ausserhalb der Fläche: Titelleiste `PaneKopf`,
 *  Reiter der Arbeitsleiste), sonst `null`. */
function rolleVon(el: Element | null | undefined): PaneRolle | null {
  const marke = el?.closest?.('[data-pane]')?.getAttribute('data-pane')
    ?? el?.closest?.('[data-v3-pane]')?.getAttribute('data-v3-pane')
    ?? el?.closest?.('[data-pane-bezug]')?.getAttribute('data-pane-bezug')
    ?? null;
  return marke === 'sekundaer' ? 'sekundaer' : marke === 'primaer' ? 'primaer' : null;
}

/** Pane des letzten Klicks bzw. Fokus-Wechsels samt der FLÄCHE, die es damals
 *  war (Element-Identität statt blosser Rolle: ein geschlossenes und neu
 *  geöffnetes Fenster ist ein anderes Element und erbt die Merkung nicht).
 *  `null`, solange nichts geschah. */
let zuletztBenutzt: { rolle: PaneRolle; flaeche: Element | null } | null = null;

if (typeof document !== 'undefined') {
  const merke = (e: Event) => {
    const ziel = e.target as Element | null;
    const rolle = rolleVon(ziel);
    if (!rolle) return;
    const flaeche = ziel?.closest?.('[data-pane]') ?? document.querySelector(`[data-pane="${rolle}"]`);
    zuletztBenutzt = { rolle, flaeche };
  };
  document.addEventListener('pointerdown', merke, true);
  document.addEventListener('focusin', merke, true);
}

/**
 * Gehört dieser Tastendruck dem Leser in diesem Pane?
 *
 * @param imSekundaerenPane Rolle des fragenden Lesers. Vorgabe-Fall `false`
 *   deckt die Einzelansicht UND das primäre Pane ab; nur der sekundäre Leser
 *   übergibt `true`.
 */
export function tastendruckGehoertPane(imSekundaerenPane: boolean): boolean {
  if (typeof document === 'undefined') return !imSekundaerenPane;
  const ziel = document.activeElement as Element | null;
  const fokusPane = rolleVon(ziel);
  // Rückfall: das zuletzt benutzte Pane, solange es noch im DOM steht; sonst
  // primär (auch in der Einzelansicht, wo es überhaupt kein `[data-pane]` gibt:
  // dort ist `imSekundaerenPane` false).
  const rueckfall: PaneRolle = zuletztBenutzt?.rolle === 'sekundaer' && zuletztBenutzt.flaeche?.isConnected
    ? 'sekundaer' : 'primaer';
  return ((fokusPane ?? rueckfall) === 'sekundaer') === imSekundaerenPane;
}
