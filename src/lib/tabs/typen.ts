// ─── Offene In-App-Reiter (Tab-Streifen, Auftrag David) ─────────────────────
//
// SSoT des localStorage-Keys 'lexmetrik-tabs' (§5). Reines Speicher-Werkzeug,
// KEINE Rechtslogik (§3): die Liste der zugleich offenen Reiter (Engines,
// Gesetze, Vorlagen, Entscheide), damit man ohne Browser-Tab zwischen mehreren
// hin- und herwechseln kann. Gespeichert wird NUR der Navigationspfad (+ optio-
// nales Anzeige-Label), NIE Formularinhalte (Berufsgeheimnis; das v1 erhält die
// Reiter-LISTE über Reloads, nicht den flüchtigen Formular-State — bewusste
// Grenze, navigationsbasiert). Reihenfolge = Array-Position, NEUE Reiter HINTEN
// angehängt (stabil, anders als der neueste-vorn-Ring in verlauf.ts) — kein
// Zeitstempel, also kein Date.now() in src/lib (§2 Determinismus).

export interface TabEintrag {
  path: string;
  label?: string;
  /** ── D27 (David 6.9.2026) · DER GEWÄHLTE ANKER — SEIT D27 NUR NOCH RÜCKFALL
   *  `path` trägt die LESESTELLUNG: der Scroll-Spy des Lesers schiebt dort
   *  laufend `#art-…` hinein (`aktualisiereTabArtikel`), damit ein Neustart an
   *  derselben Stelle aufsetzt (§5a Ziff. 6) und die Reiter-Liste die Position
   *  zeigt.
   *
   *  Der R2-Nachzug (F5) baute die Beschriftung ausdrücklich NICHT daraus,
   *  sondern aus diesem Feld — dem Anker, den die ADRESSE trug —, weil dieselbe
   *  Adresse sonst zwei Beschriftungen trug («ZGB» kalt, «Art. 3 ZGB» nach dem
   *  Scrollen). David 6.9.2026 hat die Regel UMGEDREHT: «diese funktion, dass
   *  es anzeigt in welchem artikel wir sind, soll der tab bekommen. es kann
   *  dann direkt im gesetz raus.» Determinismus (§2) heisst seither «gleiche
   *  LESESTELLUNG ⇒ gleiche Beschriftung» statt «gleiche Adresse ⇒ gleiche
   *  Beschriftung» — und die Lesestellung ist der gespeicherte `path`, der den
   *  Neustart überlebt (Kaltstart == SPA == Reload bei gleicher Stellung).
   *
   *  `wahl` bleibt der RÜCKFALL für das Fenster VOR dem ersten Spy-Lauf: ein
   *  Deep-Link `…#art-336_c`, der über `merkeTab` ohne Hash im `path`
   *  nachaktualisiert wird, verlöre sonst seinen Artikel, bis der Leser das
   *  erste Mal gescrollt hat. Er wird nie aus der Lesestellung nachgezogen. */
  wahl?: string;
  /** ── W2·25 (Spec `FAHRPLAN-DESIGN-IDENTITAET.md` §7) · ANGEHEFTET ────────
   *  Ein angehefteter Reiter steht schmal ganz links, trägt kein ✕ und
   *  überlebt «Alle schliessen» wie den Neustart (§5a Ziff. 5).
   *
   *  DIE D16-AUFLAGE STECKT IM WORT «FLACH»: Anheften ist KEINE zweite
   *  Anzeige-Ordnung, sondern eine Eigenschaft des Eintrags, die den EINEN
   *  Speicher umsortiert (feste zuerst, `hefteAn`). Fixer 1c hat jede
   *  Anzeige-Gruppierung entfernt, weil sie das Ziehen einsammelte («es geht
   *  nur wenn nur gesetze offen sind — bug», `e2e/w224-reiter-umordnen-d16`);
   *  eine Gruppierung, die das Anheften nachbaut, wäre derselbe Defekt unter
   *  neuem Namen. Was die Leiste zeigt, ist weiterhin `tabs` in
   *  Speicherreihenfolge — nur dass die festen darin vorn stehen.
   *
   *  DER PREIS DAFÜR IST EINE ZONENGRENZE, und die wird ABGELEHNT, nicht
   *  still korrigiert: ein Zug, der einen freien Reiter vor einen festen
   *  brächte, schreibt gar nichts (`ordneTabsUm` meldet `false`, und die
   *  Leiste zeigt die Sperre schon unter dem Zeiger). Ein still zurechtgerückter
   *  Zug wäre genau das D16-Bild — man zieht, und es geschieht etwas anderes.
   *
   *  DIE EIGENSCHAFT GEHÖRT DEM PLATZ, NICHT DEM DOKUMENT (Browser-Norm): eine
   *  Navigation IM angehefteten Reiter (`ersetzeTab`) lässt ihn angeheftet. */
  fest?: boolean;
}

/** Die Teile einer Reiter-Kurzform. `stelle` s. `basisKurzform` (D27). */
export interface KurzformTeile {
  kopf: string; kern: string; stelle: string | null;
  /** ── W2·18 Punkt 5 · DIE INSTANZ-NUMMER IST EIN EIGENER TEIL ─────────────
   *  «(2)», «(3)» … ab der zweiten Instanz; bei der ersten fehlt das Feld.
   *  Bis W2·18 hing die Nummer HINTEN am Kern («ZPO-Fristen (2)»), und weil
   *  der Kern der kürzbare Teil ist, fiel sie als erstes weg: GEMESSEN
   *  13.9.2026 @1024 mit sieben Reitern standen «ZPO-Fristen (2)» und
   *  «(3)» beide als «ZPO-…» da — zwei Reiter, ein Bild. Als eigener Teil
   *  kann die Leiste sie ungekürzt setzen. Der Einzeiler (`reiterKurzformText`)
   *  bleibt Zeichen für Zeichen derselbe: er fügt sie an derselben Stelle
   *  wieder an. */
  instanz?: string;
}

/** ── R8 (Prüfbefund R11, 6.9.2026) · WAS DER `title` EINES REITERS SAGT ─────
 *
 *  GEMESSEN am Stand `c91541617`: der Tooltip trug den Stand NUR bei Gesetzen
 *  («OR — Stand 02.09.2026 — gelesen bis Art. 336c»); ein Entscheid-Reiter
 *  nannte kein Urteilsdatum und ein Rechner-Reiter nichts ausser seinem Namen.
 *  Gerade dort ist der Tooltip aber der Ort, an dem die Kurzform ihre Auskunft
 *  zurückgibt (§8): die Kurzform kürzt «Obergericht AG HOR.2024.19 vom
 *  14.01.2026» auf «OGer AG HOR.2024.19», und «Fristenrechner (Tage · ZPO ·
 *  SchKG)» auf «Fristenrechner».
 *
 *  AUS DER QUELLE, SONST GAR NICHT (§7): Stand und Urteilsdatum kommen aus den
 *  Manifesten, die Kurzbeschreibung aus dem Katalog (`karte.description`,
 *  SSoT §5). Fehlt ein Feld — oder ist das Manifest noch nicht geladen —,
 *  bleibt der Teil weg. Kein Platzhalter, keine Schätzung. Ein Entscheid mit
 *  `datumUnbekannt` (Quelle ohne Entscheiddatum) bekommt darum kein Datum.
 */
export interface ReiterKarteTeile {
  /** Volltitel, wie ihn der Verlauf führt («Obergericht AG HOR.2024.19 vom …»). */
  volltitel: string;
  /** Der AUSGESCHRIEBENE Erlasstitel aus dem Manifest («Bundesgesetz betreffend
   *  die Ergänzung des Schweizerischen Zivilgesetzbuches …»), sonst `null`.
   *  Nur die Karte zeigt ihn: bei einem Gesetz ist `volltitel` das Kürzel
   *  («OR»), und genau dieses Kürzel will die Karte auflösen. Der Einzeiler
   *  (`reiterTitel`) rührt ihn NICHT an — er bliebe sonst nicht derselbe. */
  langtitel: string | null;
  /** Kurzform, wie sie im Reiter steht — die Karte sagt, wofür sie steht. */
  kurzform: string;
  /** Sammel-Label der Art («Gesetze», «Rechtsprechung», …) plus Piktogramm. */
  kategorie: { label: string; pikto: string };
  /** Konsolidierungsstand eines Erlasses, `TT.MM.JJJJ`; sonst `null`. */
  stand: string | null;
  /** Entscheiddatum, `TT.MM.JJJJ` — nur, wenn die Zitierung es nicht schon trägt. */
  datum: string | null;
  /** Kurzbeschreibung aus dem Katalog (SSoT §5). */
  beschreibung: string | null;
  /** Lesestellung («Art. 336c»), nur bei Gesetzen. */
  gelesen: string | null;
}

/** Identität eines Reiters: pathname + optionaler Instanz-Diskriminator `?r=<n>`.
 *  Erlaubt DASSELBE Gesetz mehrfach offen (Auftrag David): zwei Reiter mit
 *  gleichem Pfad, aber verschiedenem `?r` sind verschiedene Reiter. Andere
 *  Query-Parameter (z.B. ?preset=) und der #Artikel-Anker gehören NICHT zur
 *  Identität — eine Engine mit ?preset=a/b bleibt EIN Reiter, der Artikel ändert
 *  nur Label/Scrollziel. */
export function tabSchluessel(path: string): string {
  const vorHash = path.split('#')[0];
  const [pfad, qs] = vorHash.split('?');
  const r = new URLSearchParams(qs ?? '').get('r');
  return r ? `${pfad}?r=${r}` : pfad;
}
