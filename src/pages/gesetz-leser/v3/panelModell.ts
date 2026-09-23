import { useCallback, useState } from 'react';
import { labelMitBereich } from '../../../lib/normtext/darstellung';
import { useBezuege } from '../bezuegeLaden';
import { KLASSE_SCHALTER } from '../bezugAuswahl';
import { bereichLabel, type Zeitbereich } from '../bezugZeit';
import { bestimmungDativ, type BestimmungsWort } from './erlassAnsicht';
import { STATUS_RANG, type BezugStatus } from '../../../lib/verzahnung/facetten';
import type { Bezug } from '../../../lib/rechtsprechung/bezuege';

// ─── Modell des Rechtsprechungs-/Kontext-Panels (FAHRPLAN-LESER-V3 Kap. 4d, H3) ─
//
// Rechnende und zustandshaltende Hälfte des Panels — ohne JSX, damit die drei
// Zusagen ohne Browser prüfbar sind (§3/§6): der Zähler-Wortlaut, die
// Reiter-Ordnung und die Gruppierung der Kanten.
//
// ── NACHLADEN: DIE EINE STELLE, AN DER ES ENTSCHIEDEN WIRD (Kap. 7) ─────────
// `useBezuege` bekommt den Erlass-Key ERST, nachdem das Panel einmal offen war.
// Ohne Key läuft ihr Lade-Effekt in die frühe Rückgabe (`if (!erlassKey) return`),
// es geht also kein Byte des Bezugs-Shards über die Leitung, solange niemand das
// Panel aufzieht. Gemessen: BGG 300.2 KB gzip, BV 123.3, StPO 102.0
// (`check:perf-budget` führt die drei als eigene Budget-Zeilen).
//
// `jeGeoeffnet`, NICHT `offen`: Schliessen wirft die Daten nicht weg. Ein Panel,
// das bei jedem Zu/Auf neu lädt, wäre teurer als das eager-Laden, das wir gerade
// abgeschafft haben — und der Zähler verlöre seine Zahl wieder (§8).
//
// DIE HÜLLE BLEIBT DIE SELBE DATENLOGIK: geladen, gefiltert und gezählt wird
// weiterhin ausschliesslich in `bezuegeLaden`/`bezugAuswahl`/`bezugZeit`/
// `lib/rechtsprechung/bezuege`. H3 verschiebt den ZEITPUNKT und den ORT der
// Darstellung, nicht die Rechnung (§5).

export type PanelReiter = 'entscheide' | 'aenderungen' | 'materialien' | 'anwendung';

/** Reiter-Ordnung UND Beschriftung aus EINER Quelle (§5): ein Reiter, der hier
 *  fehlt, existiert nirgends; einer, der hier steht, ist überall gleich benannt.
 *  Reihenfolge = die Reihenfolge der Fragen am Gesetzesartikel: wie wird er
 *  ausgelegt (Entscheide) · wie ist er geworden (Änderungen) · woher kommt er
 *  (Materialien) · wie wendet man ihn an (Anwendung).
 *
 *  DER VIERTE STEHT HINTEN, NICHT NEBEN «ENTSCHEIDE» (W2·7-VZUI, 31.8.2026):
 *  fachlich stünde «Anwendung» der Auslegung am nächsten, die Reihe wäre dann
 *  aber nicht mehr die Frage-Chronologie, die sie erklärt — und ein Umsortieren
 *  verschöbe den Pfeiltasten-Weg, den `leser-v3-panel-facetten` (b) als Zusage
 *  misst. Der Zuwachs kostet damit nichts an bestehender Bedienung. */
export const PANEL_REITER: readonly { id: PanelReiter; label: string }[] = [
  { id: 'entscheide', label: 'Entscheide' },
  { id: 'aenderungen', label: 'Änderungen' },
  { id: 'materialien', label: 'Materialien' },
  { id: 'anwendung', label: 'Anwendung' },
];

/**
 * Erklärender Titel eines Reiters — ERLASS-NEUTRAL (H3-Nachzug C1).
 *
 * Bis hierher stand «zu diesem Artikel» als Literal in `PANEL_REITER`. An einem
 * §-Erlass (BS-640.100) war das schlicht falsch (Ä23-Klasse). Das Zähl-Substantiv
 * kommt darum aus der EINEN Ableitung (`./erlassAnsicht`), und weil der Titel
 * damit vom Erlass abhängt, ist er eine Funktion und kein Feld: ein Feld hätte
 * verlangt, die Tabelle je Erlass neu zu bauen — und die Reiter-ORDNUNG hängt
 * nicht am Erlass (§5, eine Quelle je Frage).
 */
export function reiterTitel(id: PanelReiter, wort: BestimmungsWort): string {
  if (id === 'entscheide') return `Gerichtsentscheide zu ${bestimmungDativ(wort)}`;
  if (id === 'aenderungen') return 'Änderungserlasse dieses Erlasses';
  if (id === 'materialien') return 'Botschaften und Vernehmlassungen zu diesem Erlass';
  return 'Behörden-Ressourcen und Werkzeuge zu diesem Erlass';
}

/**
 * Alle Öffner des Panels an einem Marker (A3, H3-Nachzug).
 *
 * Sie stehen ausserhalb der Panel-Fläche — in der klebenden Kopfzeile und im
 * «Ansicht ▾»-Menü —, und die Aussenklick-Regel des Panels muss sie kennen: ohne
 * die Ausnahme schliesst ihr `pointerdown` das Panel, das ihr `click` gleich
 * darauf wieder öffnet (der Knopf hätte sichtbar nichts getan). EIN Sammel-Marker
 * statt einer Aufzählung von Selektoren, damit ein dritter Öffner nicht
 * vergessen werden kann; er steht hier und nicht in der Komponenten-Datei, weil
 * `react-refresh/only-export-components` (Tor `lint`) dort keinen zweiten Export
 * duldet.
 */
export const OEFFNER_SELEKTOR = '[data-v3-panel-oeffner]';

/**
 * Das Wort am Panel-Öffner — unveränderlich, in jeder Datenlage und jedem
 * Zuschnitt.
 *
 * ── D35-F2 (Entscheid David 7.9.2026, Variante A) · «RECHTSPRECHUNG» → «ERLASS»
 * Bis hierher hiess der Griff «Rechtsprechung» und trug daneben die Zahl der
 * Entscheide DES ARTIKELS, an dem der Scroll-Spy gerade stand. Das war die
 * Dopplung D-1 der D35-Untersuchung, gemessen 7.9.2026 auf EINEM Bildschirm:
 * ZPO Art. 271 «⚖ Rechtsprechung 24» im Kopf gegen «24 Entscheide» in der
 * Funktionszeile zwei Zentimeter darunter — dieselbe Zahl, dieselbe Quelle,
 * zwei Orte (§5/§8).
 *
 * DIE WURZEL WAR NICHT DER ZWEITE KNOPF, SONDERN DIE VERMISCHTE BEZUGSGRÖSSE.
 * Das Blatt dahinter ist in drei von vier Reitern ERLASS-weit («Änderungen»,
 * «Materialien», «Anwendung» — `reiterTitel` oben sagt es Wort für Wort); nur
 * «Entscheide» ist artikelscharf. Der Kopf trägt seit Variante A, was für den
 * ganzen Erlass gilt, die Funktionszeile am Artikelende, was für genau diesen
 * Artikel gilt. Also heisst der Griff nach seiner Bezugsgrösse.
 *
 * DAS ▾ STATT DER ⚖: die Ikone stand für die Rechtsprechung, nicht für den
 * Erlass — sie wäre nach der Umbenennung ein Bild, das etwas anderes sagt als
 * das Wort daneben. Das ▾ sagt dasselbe wie am Nachbargriff «Ansicht ▾»: hier
 * klappt etwas auf. F0.9 («jeder Kopf-Griff trägt ein Wort», G14) bleibt damit
 * auf JEDER Breite eingelöst, und zwar mit demselben Wort auf allen.
 */
/**
 * ── C-1/D-5/E-10 (S6-W1a, 23.9.2026) · EIN NAME: «ERLASS-BLATT» ─────────────
 * Gemessen am Stand 8a4d74c96 trug dieselbe Fläche FÜNF Namen: «Erlass ▾» am
 * Öffner, «Erlass-Blatt öffnen …» als dessen Accessible Name, «Rechtsprechung
 * & Kontext» im eigenen Kopf, «Rechtsprechung und Kontext öffnen» in der
 * Tastenhilfe und «im Blatt öffnen» an der Funktionszeile. Seither heisst sie
 * überall «Erlass-Blatt» (Kopf `./LeserPanel`, Tastenhilfe
 * `../parts/leserTastaturBelegung`, Griff `../parts/ArtikelLeser.bezuegeFuss`).
 * Das ▾ ist gefallen: es sagte «Menü», der Griff öffnet aber eine Fläche mit
 * eigenem Kopf und ✕ (Audit D-5); den Zustand trägt `aria-expanded`.
 */
export const OEFFNER_WORT = 'Erlass-Blatt';

/**
 * Voller Accessible-Name des Öffners — er sagt, WAS sich öffnet.
 *
 * Bis D35-F2 hiess er «Rechtsprechung und Kontext zu Art. 271 öffnen — 24
 * Entscheide»: er nannte die Artikel-Zahl, also genau das, was der Griff jetzt
 * nicht mehr behauptet. Ein Screenreader hörte damit die Zahl weiterhin doppelt
 * (hier und an der Funktionszeile). Er nennt jetzt die vier Reiter des Blattes
 * und keine Zahl — die Zahl steht an genau einem Ort, und das ist die
 * Funktionszeile des Artikels.
 */
export const OEFFNER_NAME = `${OEFFNER_WORT} — ${aufzaehlung(PANEL_REITER.map((r) => r.label))}`;

/** «a, b und c» — der Name folgt der Reiter-Tabelle, statt sie abzuschreiben
 *  (§5; S6-W1a: bis 23.9.2026 stand die Liste als Literal). Das «öffnen» fiel
 *  mit D-8: der Griff schaltet um, den Zustand sagt `aria-expanded`. */
function aufzaehlung(teile: readonly string[]): string {
  return teile.length < 2 ? teile.join('') : `${teile.slice(0, -1).join(', ')} und ${teile[teile.length - 1]}`;
}

/**
 * ── N1/D33 (7.9.2026) · HIER STANDEN DIE ZAHL-MARKE UND IHR ATTRIBUT ────────
 * `oeffnerLabelKompakt`, `zaehlerAttribut` und `oeffnerName(anzahl, artikel)`
 * bauten die Zahl am Kopf-Griff — samt der §8-Schranke «keine Zahl, die wir
 * nicht haben» (`null`/`0` ⇒ leer) und der Zusage, dass Sichtbares und
 * `data-v3-panel-anzahl` DIESELBE Wahrheit sagen. Beide Befunde bleiben richtig
 * für ihren Stand (§0 Ziff. 2b, N1 vom 7.9.2026 — die Marke hat damals den
 * Namenswechsel «Rechtsprechung» → «3 Entscheide» beseitigt); sie sind mit
 * D35-F2 gegenstandslos geworden, weil der Kopf gar keine Artikel-Zahl mehr
 * trägt. Ersatzlos gestrichen statt bewacht (§17-Gegengewicht) — mit ihnen fällt
 * `artikelZahl`, die einzige Ableitung, die sie speiste — und mit ihr der
 * Import `ZaehlerNachschlag`: diese Datei kennt die Zähl-Datei nicht mehr.
 *
 * DIE ZAHL SELBST IST NICHT WEG: sie steht an der Funktionszeile des Artikels
 * (`parts/ArtikelLeser.bezuegeFuss.tsx`, aus derselben Zähl-Datei
 * `../bezuegeZaehler`). Das ist der ganze Punkt von Variante A — ein Ort je
 * Zahl. Bewacht von `e2e/w224-d35-f2-kopf.e2e.ts` (a).
 */

/**
 * Kurzstand der Instanz-Wahl für die Filterzeile: «BGE» · «BGE +2» · «keine».
 *
 * Ä54: die Klappe muss ihren Stand NENNEN, sonst ist eine eingeklappte Facette
 * ein verstecktes Filter — und ein Ergebnis, dessen Einschränkung man nicht sieht,
 * ist eine falsche Auskunft über den Bestand (§8). Die Kurznamen kommen aus
 * `KLASSE_SCHALTER` (derselben Quelle wie die Schalter selbst, §5).
 */
export function instanzStand(klassen: readonly BezugStatus[]): string {
  const erste = klassen[0];
  if (erste === undefined) return 'keine';
  return klassen.length === 1
    ? KLASSE_SCHALTER[erste]
    : `${KLASSE_SCHALTER[erste]} +${klassen.length - 1}`;
}

/** Kurzstand des Zeitraums. `bereichLabel` liefert bei offenem Bereich `null` —
 *  daraus wird «alle», nie eine erfundene Jahreszahl (§8). */
export function zeitStand(bereich: Zeitbereich): string {
  return bereichLabel(bereich) ?? 'alle';
}

/**
 * Kanten nach Instanz-Klasse gruppieren, Klassen nach `STATUS_RANG`.
 *
 * Dieselbe Ordnung wie am Artikelfuss der Ist-Hülle (`BezuegeZeile`) und aus
 * demselben Grund (§8, `facetten.ts`): «Wer die drei in EINE Liste kippt und nur
 * nach Datum sortiert, behauptet stillschweigend Gleichrang.» Die Reihenfolge
 * INNERHALB einer Klasse ist die Shard-Ordnung (chronologisch neu → alt) — hier
 * wird sie erhalten, nie neu gesetzt (§5: keine zweite Sortier-Wahrheit).
 */
export function gruppiereKanten(kanten: readonly Bezug[]): [BezugStatus, Bezug[]][] {
  const gruppen = new Map<BezugStatus, Bezug[]>();
  for (const b of kanten) {
    const liste = gruppen.get(b.facetten.status);
    if (liste) liste.push(b);
    else gruppen.set(b.facetten.status, [b]);
  }
  return [...gruppen.entries()].sort((a, b) => STATUS_RANG[a[0]] - STATUS_RANG[b[0]]);
}

export interface PanelZustand {
  /**
   * ── D35-F2 (7.9.2026) · HIER STAND `oeffnerSichtbar` ───────────────────────
   * Das Feld las `leitfaelle === 'an'` und war die EINE Stelle, an der Davids
   * F8-Regel vom 16.8.2026 (V-0-Entscheid) vollzogen wurde: Schalter
   * «Rechtsprechung im Text» AUS ⇒ Zähler UND Randlasche weg, der Zugang blieb
   * über «Ansicht ▾» und die Taste «r». Regel und Begründung bleiben als Beleg
   * ihres Datums stehen (§0 Ziff. 2b) — sie sind mit D35-F2 gegenstandslos: der
   * Schalter ist ersatzlos gefallen (`../leserOptionen`), weil der Kopf-Griff
   * keine Artikel-Zahl mehr zeigt, die man verbergen wollte. Damit steht der
   * Griff IMMER und der Menü-Eintrag «Entscheide & Kontext …» (Ä92, «ein Öffner
   * je Breite») nie mehr; beide Zweige sind gestrichen statt bewacht
   * (§17-Gegengewicht). Die Taste «r» bleibt der tastaturseitige Weg.
   */
  offen: boolean;
  /** War das Panel in dieser Sitzung schon einmal offen — oder hat jemand
   *  ANDERS nach denselben Daten gefragt? Steuert das Nachladen.
   *
   *  D30 (6.9.2026): das Flag heisst weiterhin so, trägt aber seither zwei
   *  Auslöser. Der zweite ist `weckeDaten()` unten. */
  jeGeoeffnet: boolean;
  reiter: PanelReiter;
  setReiter: (r: PanelReiter) => void;
  oeffne: (r?: PanelReiter) => void;
  /** D35-F2 · `oeffne('entscheide')` als REFERENZ-STABILER Griff — der
   *  Sekundär-Weg «im Blatt öffnen ›» der Funktionszeile hängt daran. */
  oeffneEntscheide: () => void;
  schliesse: () => void;
  umschalten: () => void;
  /**
   * Die Daten holen, OHNE das Panel aufzuziehen (W2·24-R5-F1K, D30).
   *
   * Anlass, Davids Wortlaut: die Bezüge-Zeile am Artikelkopf «klappt auf, zeigt
   * aber nur den Rechnen-Block; die gezählten Entscheide … werden nicht
   * geladen». Sie sass am kurzen Ende von H3: der Bezugs-Shard wird seither erst
   * beim Öffnen des Panels geholt, und die Zeile hatte keinen Weg, danach zu
   * fragen. Die Zahl stand da (Zähl-Datei, R6c), der Apparat kam nie.
   *
   * DIESELBE STELLE, KEIN ZWEITER LADEPFAD (§5): das Aufklappen setzt genau das
   * Flag, das auch das Panel setzt — `useBezuege` bekommt seinen Erlass-Key,
   * `usePanelBezuege` und die Bezüge-Zeile lesen danach DIESELBE Hook-Instanz.
   * Wer erst die Zeile aufklappt und dann das Panel öffnet, löst keinen zweiten
   * Fetch aus; wer die Zeile wieder zuklappt, verliert die Daten nicht (der
   * Grund, aus dem das Flag `jeGeoeffnet` heisst und nicht `offen`).
   */
  weckeDaten: () => void;
}

export function usePanelZustand(): PanelZustand {
  const [offen, setOffen] = useState(false);
  const [jeGeoeffnet, setJeGeoeffnet] = useState(false);
  const [reiter, setReiter] = useState<PanelReiter>('entscheide');

  const oeffne = useCallback((r?: PanelReiter) => {
    if (r) setReiter(r);
    setJeGeoeffnet(true);
    setOffen(true);
  }, []);
  const schliesse = useCallback(() => setOffen(false), []);
  // D30: nur das Lade-Flag, kein `setOffen` — das Panel bleibt zu.
  // `setJeGeoeffnet(true)` auf einem bereits gesetzten Flag ist in React ein
  // No-op (Bail-out), die Zeile darf also bei jedem Aufklappen rufen.
  const weckeDaten = useCallback(() => setJeGeoeffnet(true), []);
  const umschalten = useCallback(() => {
    setOffen((o) => {
      if (!o) setJeGeoeffnet(true);
      return !o;
    });
  }, []);

  // D35-F2 · EIN STABILER GRIFF FÜR DIE FUNKTIONSZEILE. `oeffne` bekommt seinen
  // Reiter hier, nicht am Aufrufer: ein dort gebautes `() => oeffne('…')` wäre
  // bei jedem Render des Rahmens eine neue Funktion und risse die
  // `memo`-Schranke von `parts/ArtikelLeser` über alle 1686 Artikel (§15).
  const oeffneEntscheide = useCallback(() => oeffne('entscheide'), [oeffne]);
  return { offen, jeGeoeffnet, reiter, setReiter, oeffne, oeffneEntscheide, schliesse, umschalten, weckeDaten };
}

/**
 * Bezugs-Daten des Panels — dieselbe Hook wie in der Ist-Hülle, nur mit
 * verzögertem Key (Begründung im Dateikopf).
 *
 * Rückgabe ist unverändert die von `useBezuege`; das Panel bekommt damit
 * `bezuegeFuer`, die verfügbaren Kantone, die Klassen-Zahlen des Erlasses und
 * das Jahres-Histogramm aus EINER Quelle.
 */
export type PanelBezuege = ReturnType<typeof useBezuege>;

export function usePanelBezuege(erlassKey: string | undefined, jeGeoeffnet: boolean): PanelBezuege {
  return useBezuege(jeGeoeffnet ? erlassKey : undefined);
}


/**
 * Auf WELCHEN Artikel bezieht sich das Panel?
 *
 * ── DER BEFUND, DEN DAS BEHEBT (gemessen 17.8.2026 @390, StPO) ─────────────
 * Der Scroll-Spy setzt die Leseposition erst, wenn ein Artikel die Beobachtungs-
 * zone erreicht. Auf dem Handy-Zuschnitt ist sie beim Ankommen noch NICHT
 * gesetzt (`[data-v3-kopf-artikel]` count 0). Wer dort das Panel öffnete, las
 * «Zu diesem Erlass ist kein Entscheid der eingeschalteten Instanzen erfasst» —
 * an einem Erlass mit 1443 Verknüpfungen. Das ist keine leere Liste, das ist
 * eine falsche Tatsachenbehauptung (§8), und sie entstand aus einem Zustand, den
 * der Nutzer nicht kennt und nicht herstellen wollte.
 *
 * FALLBACK IST DER ERSTE ARTIKEL DES ERLASSES — und er wird BENANNT: der
 * Panel-Kopf schreibt «· Art. 1» daneben, das Kurz-Zitat trägt dieselbe Angabe.
 * Damit ist die Auskunft wahr («die Entscheide zu Art. 1»), statt wahr-aber-
 * unbrauchbar («keine Leseposition») oder falsch («nichts erfasst»).
 *
 * Das Label kommt aus `labelMitBereich` — derselben Funktion, aus der der Kern
 * es baut (§5): sonst stimmte das `?norm=` bei Bereichs-Artikeln nicht.
 */
export function panelBezug(
  aktArtikel: string | null,
  aktivToken: string | null,
  erster: { artikelLabel: string; artikel: string } | undefined,
): { label: string | null; token: string | null } {
  if (aktArtikel && aktivToken) return { label: aktArtikel, token: aktivToken };
  if (!erster) return { label: null, token: null };
  return { label: labelMitBereich(erster.artikelLabel, erster.artikel), token: erster.artikel };
}

/**
 * Kurz-Zitat für den Fundstellen-Sprung («Art. 429 StPO»).
 *
 * MUSS ZEICHENGLEICH SEIN mit dem, was der Kern am Artikelfuss baut
 * (`ArtikelLeser`: `${labelMitBereich(e.artikelLabel, e.artikel)} ${erlass.kuerzel}`)
 * — sonst matcht der EntscheidLeser die zitierende Erwägung nicht mehr und der
 * Sprung landet am Seitenanfang. Der Scroll-Spy liefert genau dieses Label
 * (`artLabelByToken` in `inhalt-ableitungen` wendet `labelMitBereich` an), es
 * wird hier also NICHT neu gebildet, nur zusammengesetzt (§5).
 *
 * Ohne Leseposition bleibt das Kürzel allein — ein erfundenes «Art. 1» wäre eine
 * falsche Fundstellen-Angabe (§8).
 */
export function normZitat(artikelLabel: string | null, kuerzel: string): string {
  return artikelLabel ? `${artikelLabel} ${kuerzel}` : kuerzel;
}
