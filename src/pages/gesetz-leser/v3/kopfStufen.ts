// ─── Overflow-Regel der V3-Kopfzeile (FAHRPLAN-LESER-V3 Kap. 4a) ────────────
//
// «Unter 900 px fällt zuerst «Gesetze», dann der Volltitel; **nie** der Artikel,
// nie «Ansicht».» — das ist eine REGEL, keine Klassenliste, und sie steht darum
// hier als reine Funktion (§2, §3) statt als Kette von `hidden sm:inline` im
// Markup. Zwei Gründe:
//
//  ① SIE IST PRÜFBAR. Die Zusicherung «der Artikel fällt nie» lässt sich an
//     einer Funktion für JEDE Breite beweisen (src/tests/leser-v3-kopfstufen.test.ts);
//     an verstreuten Utility-Klassen liesse sie sich nur an den drei Breiten
//     stichproben, die zufällig ein Screenshot trifft.
//  ② SIE BRAUCHT KEINE `imPane`-VERZWEIGUNG. Gemessen wird die Breite des
//     KOPF-ELEMENTS selbst (ResizeObserver), nicht der Viewport. Damit gilt in
//     der Einzelansicht, im breiten und im schmalen Pane exakt dieselbe Regel
//     aus derselben Quelle — genau das verlangt Kap. 10 («Kopf-/Layout-
//     Verzweigungen auf `imPane` → 0»), und genau das prüft
//     `e2e/leser-kopf-paritaet.e2e.ts`. Ein `xl:`-Präfix hätte im Pane den
//     Viewport gemessen und dort das Desktop-Bild in eine 620-px-Spalte gezwungen.
//
// ── A-8 (H4, 17.8.2026): DIE SCHWELLEN STEHEN NICHT MEHR HIER ──────────────
// Bis hierher trug diese Datei die Zahlen 900/640 UND die Messung selbst — und
// `istXl` (Ist-Hülle, 1024 px) entschied unabhängig davon über denselben Platz.
// Zwei Entscheider über eine Frage sind eine zweite Wahrheit (§5, Kap. 12 A-8).
// Seit A-8 liegt beides in `./useElementBreite`: dort die drei Schwellen, dort
// der ResizeObserver. Diese Datei ist nur noch der KOPF-Zuschnitt — sie
// übersetzt den Modus in ihre Stufen und sagt, was auf welcher Stufe steht.
// Verhalten unverändert: die Stufen liegen weiter an 640 und 900, bewiesen über
// jede Breite von 200 bis 2000 px in `src/tests/leser-v3-elementbreite.test.ts`.

import {
  SCHWELLE_D, SCHWELLE_S, modusFuer, useElementBreite, type Breitenmodus,
} from './useElementBreite';


/** Die drei Zuschnitte der Kopfzeile. Reihenfolge = abnehmender Platz. */
export type KopfStufe = 'voll' | 'kompakt' | 'mini';

/** Modus der einen Breiten-Quelle → Kopf-Zuschnitt. Die EINE Abbildung; sie
 *  steht als Tabelle da, damit ein Widerspruch zum Modus nicht in einer
 *  if-Kette versteckt entstehen kann. */
const STUFE_JE_MODUS: Record<Breitenmodus, KopfStufe> = {
  d: 'voll',
  s: 'kompakt',
  sheet: 'mini',
};

/** Grenze, ab der die Sektions-Krume «Gesetze» fällt (Kap. 4a) — Weiterleitung
 *  auf die eine Quelle, keine zweite Zahl. */
export const KOPF_SCHWELLE_KOMPAKT = SCHWELLE_D;
/** Grenze «H» der Skizze (Kap. 4): darunter der Handy-Zuschnitt. */
export const KOPF_SCHWELLE_MINI = SCHWELLE_S;

/** Breite (px) → Zuschnitt. Rein, monoton, an jeder Breite prüfbar. */
export function kopfStufe(breitePx: number): KopfStufe {
  return STUFE_JE_MODUS[modusFuer(breitePx)];
}

/** Was auf einer Stufe sichtbar ist. `artikel` und `ansicht` sind bewusst als
 *  Felder geführt, obwohl sie immer `true` sind: so ist die Zusicherung des
 *  Fahrplans («nie der Artikel, nie Ansicht») eine Aussage über den Rückgabewert
 *  und nicht über abwesenden Code — ein Tor, das scheitern KANN (§6.7). */
export interface KopfElemente {
  /** ── Die FÜHRENDEN Krumen-Stufen «Gesetze › Bund ›». Fallen als erstes. ───
   *  Hiess bis 17.8.2026 `sektion` und trug nur «Gesetze ›»: die Ebene-Stufe
   *  («Bund», «Kanton BS», «International») stand in der App-Krumen-Leiste
   *  darüber, die A-2 abgelöst hat. Seither trägt die Kopfzeile die ganze Kette
   *  — aus EINER Quelle (`erlassAnsicht.brotkrume`, die auch die Ebene aus dem
   *  Datenmodell ableitet statt aus `if (bund)`).
   *  EIN Feld für beide Stufen und nicht zwei: sie beantworten dieselbe Frage
   *  («woher komme ich»), und wo der Platz für die eine nicht reicht, reicht er
   *  für die andere auch nicht — zwei Flags, die nie auseinandergehen können,
   *  wären ein Tor, das nicht scheitern kann (§6.7/§17).
   *
   *  ── V2 (Nachzug 17.8.2026) · SIE FÄLLT NICHT MEHR GANZ, SIE SCHRUMPFT ─────
   *  Das Feld war bis hierher ein `boolean`: unter 900 px Elementbreite (Handy
   *  @390, JEDES Pane unter 900 px) gab es gar keine Krume. Solange die
   *  App-Krumen-Leiste darüberstand, fing sie das auf — seit A-2 steht dort
   *  nichts mehr, und der einzige Weg nach oben war das ✕ («Gesetz schliessen»),
   *  das auf die Übersicht springt und die Ebene überspringt. Ein Zuschnitt, der
   *  auf zwei von drei Breiten die Aufwärts-Navigation entfernt, ist keiner.
   *  DARUM DREI WERTE — und ausdrücklich KEIN zweites Flag daneben:
   *    'voll'  die ganze Kette «Gesetze › Bund ›»;
   *    'kurz'  EIN klickbarer Rücksprung «‹ Gesetze» — die erste Stufe derselben
   *            Kette, aus derselben Quelle (`erlassAnsicht.brotkrume`), nie ein
   *            zweites Mal getextet.
   *  Einen dritten Wert «weg» gibt es nicht: die Krume fällt auf KEINER Breite
   *  ganz aus, und genau das prüft `leser-v3-kopfstufen.test.ts` über jede Breite
   *  von 280 bis 2000 px — eine Aussage über den Rückgabewert, kein abwesender
   *  Code (§6.7).
   *  Die Kopf-ZEILE wächst dadurch nicht: der Rücksprung steht IN der Ort-Zone
   *  (Design-Grundlage Kap. 6, ≤ 4 Elemente), die Höhe bleibt
   *  `--leser-v3-kopf-h`, und das Suchfeld bleibt oberstes Element des klebenden
   *  Blocks (Ä19). */
  krume: 'voll' | 'kurz';
  /** Erlass-Volltitel neben dem Kürzel. Fällt als zweites. */
  volltitel: boolean;
  /** Erlass-Kürzel («StPO»). Bleibt immer — es ist die Ortsangabe. */
  kuerzel: true;
  /** Laufender Artikel («Art. 429»). Bleibt IMMER (Fahrplan Kap. 4a). */
  artikel: true;
  /** Öffner «Ansicht ▾» bzw. «···». Bleibt IMMER (Fahrplan Kap. 4a). */
  ansicht: true;
  /**
   * ── D35-F2 (7.9.2026) · HIER STAND `panel: 'voll' | 'kompakt'` ────────────
   * Das Feld entschied die GESTALT des Kopf-Zählers — «⚖ 14 Entscheide» auf
   * D/S, «⚖ 14» auf `mini` (H3/Ä11, H4-II). Es hatte genau einen Zweck: den
   * NM-2-Befund vom 17.8.2026 einzulösen, dass auf `mini` überhaupt ein Öffner
   * in der Kopfzeile steht (gemessen `[data-v3-panel-oeffner]` 0, zwei Taps
   * statt einem). Der Befund und seine Messreihe bleiben in der Historie dieser
   * Datei stehen (§0 Ziff. 2b); eingelöst ist er seither STÄRKER, nicht
   * schwächer: seit D35-F2 trägt der Griff «Erlass ▾» auf JEDER Breite dasselbe
   * Wort, es gibt also keine Gestalt-Frage mehr zu beantworten. Ein Feld ohne
   * Frage ist gestrichen, nicht bewacht (§17-Gegengewicht).
   */
}

export function kopfElemente(stufe: KopfStufe): KopfElemente {
  return {
    krume: stufe === 'voll' ? 'voll' : 'kurz',
    volltitel: stufe === 'voll',
    kuerzel: true,
    artikel: true,
    ansicht: true,
  };
}

// ═══ Ä87/Ä91 (H4-Nachzug 18.8.2026) · DAS KOPF-✕ IST GESTRICHEN ══════════════
//
// Hier stand `zeigeSchliessKreuz(stufe, vollflaechig)` = «✕ überall ausser im
// Pane und auf `mini`». Es ist ersatzlos weg, und zwar gemessen:
//
//   Lage                          Befund 18.8.2026 (`scratchpad/a-mess.cjs`)
//   ────────────────────────────────────────────────────────────────────────
//   D @1440, Blatt offen          ZWEI sichtbare ✕, 47 px übereinander
//                                 (Kopf y = 80 «Gesetz schliessen», Blatt
//                                 y = 127 «Rechtsprechung und Kontext
//                                 schliessen») — Ä87
//   S @720, Ruhezustand           FÜNF Elemente in der Zeile: Ort · ⚖ · ☰ ·
//                                 «Ansicht» · ✕; der Deckel der Design-
//                                 Grundlage Kap. 6 liegt bei vier — Ä91
//   Pane, jede Stufe              schon vorher 0 (Ä46)
//   mini                          schon vorher 0 (Element-Budget)
//
// DIE REGEL, DIE AN SEINE STELLE TRITT (Auflage-Anpassung im Fahrplan, datiert
// 18.8.2026): **höchstens EIN ✕ je Kopfzeile, und der Rücksprung ist immer
// beschriftet.** Das Ziel `/gesetze` steht auf JEDER Breite als Wort in der
// Ort-Zone — als volle Kette «Gesetze › Bund ›» oder als Rücksprung
// «‹ Gesetze», beides aus `erlassAnsicht.brotkrume` mit `to: '/gesetze'`. Ein
// Wort ist die bessere Auskunft als ein Zeichen (§8), und ein zweites Zeichen
// mit demselben Ziel ist der §5-Befund, den Ä56 an der anderen Ecke der Zeile
// schon erledigt hat.
//
// WARUM GESTRICHEN UND NICHT AUF EINE BEDINGUNG GESTELLT: die Bedingung wäre
// «zeige das ✕, wenn KEIN beschrifteter Rücksprung dasteht» — und die erste
// Krumen-Stufe trägt ihr `to` unbedingt. Ein Prädikat, das nicht `true` werden
// kann, ist ein Tor, das nicht scheitern kann (§6.7/§17: streichen statt
// bewachen). Die Zusage, auf der die Streichung ruht, wird dort geprüft, wo sie
// entsteht: `erlassAnsicht.hatRuecksprung` samt Unit-Beweis über Bund, Kanton
// und Staatsvertrag — DIESE Funktion kann rot werden, indem man `to` aus der
// ersten Krumen-Stufe nimmt.
//
// §7-ABWEICHUNG, weiterhin offengelegt: der Auftrag zu Ä46 sagte «Einzelansicht
// bleibt bei 1 ✕». Sie ist jetzt auf jeder Breite 0. Die Auflage ist im
// Fahrplan datiert angepasst (David-Prüfer-Befund Ä87, nicht Geschmack).

// ═══ Ä90 (H4-Nachzug 18.8.2026) · EINE BAUFORM FÜR ALLE KOPF-GRIFFE ══════════
//
// BEFUND, gemessen @390 an StPO Art. 429 (`scratchpad/a-mess.cjs`, 18.8.2026):
// die drei Griffe der Kopfzeile trugen DREI Bauformen —
//
//   Griff   Klassen                             Fläche    Grund
//   ────────────────────────────────────────────────────────────────────────
//   ⚖       lc-leiste-griff + -fest             24×24 px  Chip auf `--well`
//   ☰       lc-leiste-griff                     24×24 px  nackt, transparent
//   ···     lc-leiste-griff + -fest + sm:-Zweig 28×24 px  Pille, breiter
//
// Drei Zeichen nebeneinander, drei verschiedene Umrisse, gleiche Wichtigkeit:
// die Zeile las sich als Sammlung statt als Leiste (Design-Grundlage Kap. 6).
// Dazu 24 px Zielfläche — das ist die WCAG-2.5.8-Untergrenze, auf einem Gerät,
// auf dem der Finger das einzige Werkzeug ist, also der schlechteste noch
// zulässige Wert.
//
// DARUM ZWEI KONSTANTEN STATT DREI KLASSENLISTEN IM MARKUP: die Bauform ist eine
// Aussage über die ganze Zeile und darf nicht an drei Stellen gepflegt werden
// (§5 — die drei Griffe entstehen in drei Dateien: `./LeserPanelOeffner`,
// `./LeserRahmenV3`, `./LeserAnsichtV3`). Sie stehen HIER, weil hier auch die
// Stufe entsteht, die sie auswählt.
//
// EHRLICHER REST, unverändert benannt: die zweite Hälfte des Deckels von Kap. 6
// («≤ 2 reine Icons») bleibt @390 mit ⚖ · ☰ · ··· gerissen. Neu ist, dass die
// drei WIE EINE FAMILIE aussehen und (seit F2-6, 31.8.2026) 44 px Ziel tragen;
// bis dahin waren es 32 — der Deckel selbst ist
// als «drei, aber eine Bauform» im Fahrplan datiert nachgeführt; der Rest gehört
// zu Ä33/Ä34 (Griff-Zahl), nicht hierher.

/** Die EINE Bauform eines Kopf-Griffs (⚖ · ☰ · «Ansicht»). Chip auf `--well`,
 *  damit alle Griffe derselben Zeile denselben Umriss haben. */
const KOPF_GRIFF = 'lc-leiste-griff lc-leiste-griff-fest';

/**
 * Klassen des Kopf-Griffs.
 *
 * Auf dem Handy-Zuschnitt wächst das Ziel von 24 auf **44 px**
 * (`.lc-leiste-griff-komfort` → `--tap-ziel-komfort`, src/index.css). Sonst
 * bleibt `--tap-ziel`: dort bedient eine Maus, und ein grösserer Chip nähme dem
 * Ort Platz, den er braucht.
 *
 * F2-6 (31.8.2026) — VON 32 AUF 44: hier stand `min-h-8 min-w-8`, also eine
 * Untergrenze von 32 px. Das war weder der Token `--tap-ziel` (24 px, WCAG 2.5.8
 * AA) noch das Komfortmass (44 px, WCAG 2.5.5 AAA), sondern eine dritte, nirgends
 * hergeleitete Zahl — und zwar auf dem einzigen Zuschnitt, auf dem der Finger das
 * einzige Werkzeug ist (der Abschnitt über `KOPF_GRIFF` nennt 24 px dort selbst
 * «der schlechteste noch zulässige Wert»). Die alte Begründung für 32 war die
 * 48 px hohe Kopfzeile: «das Ziel passt also ohne Umbruch, und in der Ort-Zone
 * bleibt Platz (Zeile 350 px, Griff-Zone vorher 84 px)». Sie trägt 44 ebenso —
 * 44 passt in 48, und die Griff-Zone wächst von 84 auf ~108 px (zwei Icon-Griffe
 * +12 px; «Ansicht ▾» ist ohnehin breiter), die Ort-Zone bleibt bei ~242 px.
 * Als KLASSE statt als Utility-Kette, damit der Wert bei seinem Token bleibt und
 * das a11y-Tor die Komfort-Griffe an einem stabilen Selektor findet.
 *
 * `mini` als BOOLEAN und nicht als `KopfStufe`: die drei Aufrufer haben die
 * Antwort bereits in der Hand (`form === 'kompakt'`, `kompakt`,
 * `stufe === 'mini'`) und sollen die Stufe nicht neu kennen müssen (§3).
 */
export function kopfGriffKlassen(mini: boolean): string {
  return mini ? `${KOPF_GRIFF} lc-leiste-griff-komfort` : KOPF_GRIFF;
}

/**
 * Grösse der ICON-Glyphe im Griff — auf dem Handy-Zuschnitt 20 px, sonst die
 * Schriftgrösse des Griffs.
 *
 * `text-h3` ist die 20-px-Stufe der Repo-Skala (`tailwind.config.js`,
 * 1.25 rem) und NICHT die gleich grosse Tailwind-Default-Klasse: die sind vom
 * DESIGN-REGLEMENT (B2/F7, §13) ausgeschlossen und werden von
 * `check:design-tokens` gemeldet — rot gesehen 18.8.2026. Der Name der Stufe
 * meint hier keine Überschrift, sondern schlicht ihre Grösse; `leading-none`
 * nimmt die mitgelieferte Zeilenhöhe wieder heraus, weil eine Glyphe in einem
 * Komfort-Ziel keine braucht (bis F2-6: 32 px, seither 44).
 *
 * Getrennt von den Griff-Klassen, weil sonst auch die Zahl im Zähler-Chip
 * mitwüchse — sie ist Text, keine Glyphe.
 */
export function kopfGlypheKlassen(mini: boolean): string {
  return mini ? 'text-h3 leading-none' : 'leading-none';
}

/**
 * WELCHE GESTALT hat das Panel-Blatt? (Kap. 4d)
 *
 * Beides sind Überlagerungen — sie nehmen dem Lesetext keine Spalte weg und
 * brechen ihn darum nie neu um (Rechnung zur gestrichenen Grid-Spalte im
 * Rahmen). Nur die KANTE, an der sie hängen, unterscheidet sie:
 *
 *   'rechts'  22 rem breit, am rechten Rand, von der Kopf-Unterkante bis zum
 *             Fensterboden — die Gestalt, die die Skizze für D zeigt («Panel
 *             rechts 22rem»). Das Panel ist Beiwerk und verhält sich auch so:
 *             kein Scrim, keine Modalität, keine Fokus-Falle; der Lesetext
 *             daneben bleibt scrollbar und anklickbar (Ä52, `usePopoverAutoZu`
 *             Modus `beiwerk`).
 *
 *             ── EHRLICHE EINSCHRÄNKUNG, GEMESSEN (Ä60, 17.8.2026) ──────────
 *             «Der Lesetext bleibt links sichtbar UND LESBAR» stand hier bis
 *             zum H3-Nachzug als unbedingte Zusage. Sie ist NICHT eingelöst:
 *             gemessen @1440 liegt die Lesespalte bei x 580…1200 und das Blatt
 *             bei x 1088…1440 — es verdeckt die äusseren **112 px jeder Zeile**
 *             (18 % der Spaltenbreite; @1280: 192, @1024: 320), die Zeilenenden
 *             fehlen also. Und keine feste Breite behebt das: @1440 misst der
 *             Rand rechts der Spalte 240 px, @1280 nur 160.
 *             ── SEIT Ä60 (c) IST DIESE FUNKTION NICHT MEHR DAS LETZTE WORT ──
 *             David-Entscheid 17.8.2026: der Leser-Rahmen wird breiter, und
 *             `rahmenSpalten.rahmenBild` gibt dem Blatt dort eine EIGENE Spur
 *             (`'spalte'`). `'rechts'` bleibt die Gestalt für den ENGEN Rahmen
 *             — Fenster unter 1024 px, ausgeklappte App-Seitenleiste —, und
 *             dort gilt die Messreihe oben unverändert. Dieser Kommentar sagt
 *             sie darum weiter, statt sie wegzuglätten (§8).
 *   'unten'   Bottom-Sheet über die ganze Breite — die Gestalt für H (Daumenzone)
 *             und für jede geteilte Fläche (dort verbietet die harte Regel eine
 *             dritte vertikale Fläche, und ein 22-rem-Streifen in einer
 *             600-px-Spalte liesse vom Text nichts übrig).
 *
 * `vollflaechig` = der Leser hat die ganze Seite für sich (Einzelansicht). Die
 * Prop heisst NICHT `imPane`, und das ist kein Kosmetik-Entscheid: die
 * Fundament-Sonde lässt `imPane` nur in den Wurzel-Dateien zu — zu Recht, denn
 * eine Datei, die den Hüllen-Zustand selbst liest, verzweigt auf ihn. Diese
 * Funktion verzweigt auf eine EIGENSCHAFT DER FLÄCHE, die ihr der Rahmen
 * mitteilt; die eine Übersetzung (`!umgebung.imPane`) steht dort. Der erste Bau
 * hiess hier `imPane` und wurde von der Sonde zurückgewiesen (17.8.2026).
 *
 * Gemessen 17.8.2026 am ersten Bildbogen: auf D @1440 wirkte das Bottom-Sheet
 * wie ein Vollbild-Dialog — es verdeckte den ganzen Gesetzestext, obwohl das
 * Panel Beiwerk ist. Genau das behebt die Unterscheidung.
 */
export function panelForm(stufe: KopfStufe, vollflaechig: boolean): 'rechts' | 'unten' {
  return vollflaechig && stufe === 'voll' ? 'rechts' : 'unten';
}

/** Höhe der Kopfzeile je Stufe (Design-Grundlage Kap. 3: H 48 px · D 56 px ·
 *  S 48 px). EINE Quelle — der Rahmen legt sie als `--leser-v3-kopf-h` aus und
 *  die Sprung-Offsets (`--nt-stick`) rechnen daraus (Risiko R1). */
export function kopfHoehe(stufe: KopfStufe): string {
  return stufe === 'voll' ? '3.5rem' : '3rem';
}

/**
 * Der Kopf-Zuschnitt der gemessenen Rahmenbreite.
 *
 * A-8 (17.8.2026): Messung und Schwellen sind nach `./useElementBreite`
 * gewandert — die Herleitung des Callback-Refs, des `border-box`-Observers und
 * des Startwerts aus `window.innerWidth` steht dort im Kopfkommentar. Hier
 * bleibt nur die Übersetzung Modus → Stufe. Der Name `kopfRef` bleibt, damit
 * `LeserRahmenV3` unverändert bleibt (der Rahmen hängt den Ref an sein
 * Wurzel-Element).
 */
export function useKopfStufe(): { stufe: KopfStufe; kopfRef: (el: HTMLDivElement | null) => void } {
  const { modus, messRef } = useElementBreite();
  return { stufe: STUFE_JE_MODUS[modus], kopfRef: messRef };
}
