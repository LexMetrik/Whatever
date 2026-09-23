import { OEFFNER_NAME, OEFFNER_WORT } from './panelModell';
import { kopfGriffKlassen } from './kopfStufen';

// ─── Der Öffner des Panels — EINER je Zuschnitt (H3, F8; Nachzug Ä53/Ä56) ─────
//
// ═══ DIE RANDLASCHE IST GESTRICHEN — GEMESSEN, NICHT ENTSCHIEDEN ═════════════
//
// F8-Entscheid David 16.8.2026 lautete «V1, a, Lasche behalten»: ein Zähler in
// der Kopfzeile UND eine Randlasche im Seitenrand. Am GEBAUTEN Stand hält die
// Prämisse dieses Entscheids an keiner Breite (gemessen 17.8.2026, StPO):
//
//   Breite   Artikel-Rechtskante   Lasche (w-9 = 36 px)   Überlappung
//   ──────────────────────────────────────────────────────────────────
//   390 px   x = 370               x = 354 … 390          16 px IM Normtext
//   1024 px  x = 992               x = 988 … 1024          4 px IM Normtext
//   1440 px  x = 1200              x = 1404 … 1440         keine
//
// Bei 1024 px lässt die Lesespalte zwischen ihrer Kante und dem Rand des Lesers
// **8 px** — eine 36 px breite Schiene passt dort nicht, und sie passt auch
// nirgends unterhalb von ~1200 px. Die Design-Grundlage (Kap. 6) erlaubt im
// Lesekörper «**null** Icons ausser dem Entscheid-Zähler», und dieser Zähler ist
// der am ARTIKEL (Beiwerk-Zone, S2) — nicht eine schwebende Schiene über dem
// Text. Wo die Lasche NICHT überlappte (@1440), war sie zudem das wortgleiche
// Doppel des Kopf-Zählers: fünf Elemente in der Kopfzeile, zwei Knöpfe mit
// identischem Accessible-Name für dieselbe Fläche (Ä56).
//
// DARAUS DIE NEUE ORDNUNG — GENAU EIN ÖFFNER JE ZUSCHNITT:
//
//   Zuschnitt   Öffner                                  Grund
//   ────────────────────────────────────────────────────────────────────────────
//   voll        Zähler «⚖ 14 Entscheide»                Platz ist da, Zahl ist da
//   kompakt     Zähler «⚖ 14 Entscheide»                dito
//   mini        Zähler-Chip «⚖ 14»                      H4-II, s. u.
//   alle        Eintrag im «Ansicht ▾»/«···»-Menü       F8-Weg, wenn der Schalter aus ist
//   alle        Taste «r»                               F8-Weg (Kap. 4h)
//
// Der Menü-Eintrag steht auf JEDEM Zuschnitt und in JEDEM Pane (A2) — er ist der
// Weg, den Davids F8-Regel ausdrücklich offen halten will («Panel bleibt über
// ‹Ansicht ▾› und Tastatur erreichbar»). Die Abweichung von «Lasche behalten»
// ist im Vollzugsvermerk als §7-Abweichung ausgewiesen und wartet auf Davids
// Bestätigung.
//
// ── H4-II (17./18.8.2026) · AUF `mini` STEHT DER ZÄHLER JETZT AUCH ──────────
// Bis hierher trug die Zeile «mini | Eintrag im ···-Menü | Kopfzeile ist bei 4».
// Gemessen am gebauten Stand (@390, StPO Art. 429) hiess das: `[data-v3-panel-
// oeffner]` im Ruhezustand **0**, und der Weg zu den Entscheiden kostete **zwei
// Taps** («···» aufziehen, dann «Entscheide & Kontext …») gegen einen auf D und
// S. Das ist der NM-2-Befund des Kontaktbogens H4 und dort der Flip-Blocker:
// nicht «unerreichbar», wie der Bogen zunächst schrieb, aber doppelt so teuer
// auf dem Gerät, auf dem der Finger das einzige Werkzeug ist.
//
// Der VIER-ELEMENTE-Deckel von Kap. 6 bleibt gewahrt, weil ein anderes Element
// weicht: das ✕ war auf `mini` das Duplikat des sichtbaren Rücksprungs
// «‹ Gesetze» in derselben Zeile (beide auf `/gesetze`) — Herleitung und
// Messreihe in `./kopfStufen`, `zeigeSchliessKreuz`. Die Zeile trägt danach
// Ort · ⚖ · ☰ · ··· .
// NICHT eingelöst ist die zweite Hälfte des Deckels («≤ 2 reine Icons»): der
// Chip zeigt im Ruhezustand nur die Ikone, weil die Zahl vor dem Nachladen
// niemand kennt (§8). Vorher standen dort ☰ · ··· · ✕, also ebenfalls drei —
// die Lage ist unverändert, nicht verbessert; sie steht als offener Punkt im
// Kontaktbogen H4.
//
// ── DIE REGEL DAVIDS, UND WO SIE STEHT ──────────────────────────────────────
// «Rechtsprechung im Text» AUS ⇒ der Zähler verschwindet. Diese Datei prüft das
// NICHT: sie wird dann gar nicht gerendert. Die Entscheidung liegt an genau
// einer Stelle (`panelModell.oeffnerSichtbar`) — zwei Stellen, die dieselbe
// Option lesen, hätten irgendwann zwei Antworten. Der MENÜ-Eintrag bleibt in
// jeder Stellung: «aus» heisst «ich will keinen Hinweis sehen», nicht «ich
// verzichte auf den Zugang».
//
// ── WELCHE GESTALT der Zähler hat, entscheidet die STUFE (§5) ───────────────
// Die Zuordnung steht in `kopfElemente(stufe).panel` (`'voll' | 'kompakt'`),
// damit sie eine prüfbare Aussage über einen Rückgabewert ist und nicht über
// abwesenden Code (§6.7). Diese Datei liest den Wert, sie leitet ihn nicht ab —
// eine zweite Ableitung derselben Frage wäre eine zweite Wahrheit.

/**
 * Der Kopf-Griff «Erlass-Blatt» — EINER je Zuschnitt (bis S6-W1a 23.9.2026
 * «Erlass ▾»; Umbenennung und Wegfall des ▾: `OEFFNER_WORT` in `./panelModell`).
 *
 * ── D35-F2 (Entscheid David 7.9.2026, Variante A) · HIER STAND EIN ZÄHLER ───
 * Bis hierher hiess dieses Bauteil `PanelZaehler` und trug «⚖ Rechtsprechung
 * 24» bzw. auf `mini` «⚖ 24»: das Wort, die Ikone und die Zahl der Entscheide
 * DES ARTIKELS unter dem Scroll-Spy. Die Herleitung der Zahl — feste Breite,
 * `tabular-nums`, linksbündig, `h-4 leading-4`, drei gemessene CLS-Befunde vom
 * 7.9.2026 — bleibt als Beleg ihres Datums in der Historie dieser Datei stehen
 * (§0 Ziff. 2b) und ist mit dem Wegfall der Zahl gegenstandslos: was nicht mehr
 * gerendert wird, kann nicht mehr schieben. Der CLS-Grund GILT WEITER für die
 * Stelle, die die Zahl übernommen hat (`parts/Funktionszeile.tsx` — dort steht sie
 * in einer Zeile, die nicht klebt und beim Scrollen nicht wechselt).
 *
 * WAS BLEIBT UND WARUM:
 *  · `data-v3-panel-zaehler` — der Selektor, an dem rund fünfzehn Sonden diesen
 *    Griff greifen (`e2e/helpers/panelOeffnen.ts` und die `leser-v3-panel-*`).
 *    Der Name beschreibt seit D35-F2 nicht mehr, was der Knopf ZEIGT, sondern
 *    welcher Knopf er IST. Ihn umzubenennen kostete fünfzehn Spec-Dateien, die
 *    dieser Schritt sonst nicht anfasst (§6.3), und brächte keine Zusage dazu.
 *  · `data-v3-panel-oeffner` — die Aussenklick-Ausnahme des Panels (A3).
 *  · `aria-expanded`/`aria-controls` — unverändert, samt der B3-Regel, dass die
 *    Id nur im offenen Zustand steht.
 *
 * WAS FÄLLT: `data-v3-panel-anzahl` (die Zahl steht jetzt genau einmal, an der
 * Funktionszeile) und die Prop `form` samt `kopfElemente(stufe).panel` — sie
 * entschied allein die GESTALT des Zählers («⚖ 14 Entscheide» gegen «⚖ 14»),
 * und beide Gestalten gibt es nicht mehr. Der Griff sieht auf jeder Stufe
 * gleich aus: ein Wort und ein ▾, wie «Ansicht ▾» daneben.
 */
export function ErlassGriff({ offen, panelId, kompakt, onKlick }: {
  offen: boolean;
  /** Id der Fläche — nur im offenen Zustand gesetzt (Bug-Check B3, H1): im
   *  geschlossenen Zustand existiert sie nicht, und eine kaputte Id-Referenz
   *  meldet axe als `aria-valid-attr-value`.
   *
   *  A3 (H3-Nachzug): der RAHMEN reicht sie herein. */
  panelId?: string;
  /** Nur der ZUSCHNITT der Kopfzeile (`stufe === 'mini'`) — er entscheidet die
   *  Zielgrösse in `kopfGriffKlassen`, nicht mehr die Beschriftung. */
  kompakt: boolean;
  onKlick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onKlick}
      aria-expanded={offen}
      aria-controls={offen ? panelId : undefined}
      aria-label={OEFFNER_NAME}
      title={OEFFNER_NAME}
      // D-8 (S6-W1a): «r» schaltet dasselbe um wie dieser Klick (`../parts/LeserTastatur`).
      aria-keyshortcuts="r"
      data-v3-panel-zaehler
      // A3: der Öffner ist für die Aussenklick-Regel des Panels kein «Aussen».
      // Sammel-Marker statt Aufzählung zweier Selektoren (`OEFFNER_SELEKTOR` in
      // `panelModell`), damit ein dritter Öffner nicht vergessen werden kann.
      data-v3-panel-oeffner
      // Ä90: die EINE Bauform der Kopf-Griffe — Umriss und Zielgrösse kommen
      // aus `kopfStufen`, nicht aus einer Klassenliste je Griff (§5).
      className={`${kopfGriffKlassen(kompakt)} gap-1 px-1.5`}
    >
      {/* G14 (7.9.2026): jeder Kopf-Griff trägt @320/@390 ein Wort (F0.9). Seit
          D35-F2 trägt er auf JEDER Breite DASSELBE Wort — die zwei Gesichter
          von Ä91 (mit und ohne Glyphe) sind mit der ⚖ entfallen, und damit auch
          die Falle, die N1 hier beseitigt hat: ein Knopf, der je nach Breite
          oder Datenlage anders heisst.
          Gemessen 7.9.2026 an der 350-px-Kopfzeile @390 (Archivo 11 px) trug
          die Zeile «Rechtsprechung 11» 105 · «Gliederung» 63 · «Ansicht ▾» 53
          plus 2 × 4 px `gap` = 229 px; «Erlass ▾» ist kürzer als der abgelöste
          Griff, die Zeile wird also nicht enger — die Ort-Zone (`min-w-0
          truncate`) kann ohnehin auf keiner Breite überlaufen. */}
      <span className="whitespace-nowrap">{OEFFNER_WORT}</span>
    </button>
  );
}
