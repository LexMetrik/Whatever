import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { satzspiegelFuer, type Satzspiegel } from './satzspiegel';

// ═══ ENTSCHEID A (David 24.9.2026) · DAS ERLASS-BLATT IST WIEDER EINE SPUR ══
//
// Weisung Chat 23.9.2026 abends: «… das ui bei verschiedenen bildschirmgrössen
// so ist dass es nahe am relevanten artikel ist und einklappbar ist und nicht
// mit dem knopf erlass. analog gliederung.» Entscheid 24.9.2026, Variante A
// «Echte dritte Spalte»: «Das Blatt wird eine eigene Spalte wie die Gliederung
// und deckt nie Text ab. Nachteil: Der Text rutscht beim Öffnen zur Seite und
// bricht auf kleineren Bildschirmen neu um. Das hebt D33 (‹nichts verschiebt
// sich›) auf.» Verworfen: B (Schiene + Überlagerung), C (Reiter in der
// Gliederung). D33 unten bleibt als Beleg seines Datums stehen (§0 Ziff. 2b).
// BEFUND (Analyse 24.9.2026, Stand 150d5a9a3): das überlagernde Blatt (D33 + D-1
// Fensterrand) deckte @1024/1280/1440 343/215/135 px Zeilenenden ab und stand
// @1920 105 px vom Text weg.
// DAS BILD ab 1024 px in der Einzelansicht — drei Spuren, rechts gespiegelt:
//   Gliederung 18 rem | Schiene 2.25 · Text · Blatt 23.75 rem | Schiene 2.25
// Der Rahmen wächst (Ä60 (c), `aufweitung` aus der Historie zurück) auf «linke
// Spur + Lesemass-Deckel + rechte Spur», nie über den Raum, und hält seine
// linke Kante, solange rechts Raum ist — @1920 sitzt das Blatt bündig am Text.
// ZWEI SCHWELLEN, beide aus `LESE_MIN` gerechnet (Messtabelle: Fahrplan §5a):
//   · Raum < Gliederung + LESE_MIN + Blatt (+ 2 Abstände) = 72.25 rem (1156 px,
//     Fenster ≈ 1204): offenes Blatt ⇒ die Gliederung weicht TRANSIENT auf ihre
//     Schiene — abgeleitet, nie gemerkt; schliesst das Blatt, steht sie wieder.
//   · Raum < Schiene + LESE_MIN + Blatt (+ 2 Abstände) = 56.5 rem (904 px, etwa
//     1024 mit ausgeklappter App-Seitenleiste): keine Blatt-Spur, das Blatt ist
//     das Sheet unten wie unter 1024.

// ═══ D33 (David 7.9.2026) · DAS BEIWERK-BLATT BEKOMMT KEINE SPUR MEHR ════════
// (Aufgehoben durch Entscheid A, 24.9.2026 — s. o. Befund und Deklaration im
// Wortlaut; die Abwägung A/B/C und der «Preis» von D33 stehen in der Historie
// dieser Datei vor 24.9.2026 und in `abnahme/design-identitaet/R6E-LESER.md`.)
//
// DEKLARIERTE FACHLICHE ÄNDERUNG (§6.3), nicht Refactoring: die dritte Spur des
// Rahmens — die eigene 22-rem-Spalte für das Rechtsprechungs-Blatt, gebaut als
// Ä60 (c) am 17.8.2026 — ist zurückgebaut. Der Rahmen kennt seither GENAU ZWEI
// Spuren (Gliederung bzw. ihre Schiene · Gesetzestext), seine Breite hängt an
// keinem Panel-Zustand mehr, und das Blatt überlagert (Gestalt `'rechts'`,
// dieselbe, die enge Desktop-Fenster seit Ä52 tragen).
//
// DER BEFUND, gemessen 7.9.2026 @1440 hell und dunkel, `/gesetze/bund/OR`:
//   Klick auf «⚖ Rechtsprechung»   Ruhe        offen        Δ
//   Gesetzesspalte  x / Breite     492 / 764   404 / 640    −88 / −124
//   Gliederung      x               184         96          −88
//   Zähler (der geklickte Knopf) x 1075        1253        +178
//   @1024 (ZGB): die Gliederungsspalte fiel beim Öffnen ganz aus dem DOM.
// Folge: jede Zeile des gelesenen Artikels brach neu um, und an der geklickten
// Stelle lag danach der Gesetzestext — ein zweiter Klick dorthin tat nichts.
// Das verstiess gegen D9 («nichts verschiebt sich») und gegen die Zusage von
// M3 («zeig es mir daneben, der Artikel bleibt»).
//
// ── AB HIER DIE HERLEITUNG VON Ä60 (c) (17./18.8.2026) ──────────────────────
// Im Wortlaut (Belege altern nicht). Seit Entscheid A trägt sie wieder: die
// Aufweitung und `LESE_MIN` sind zurück; die Deckel-Zahl `LESER_MAX_REM` nicht
// (der Rahmen rechnet «Spuren + LESEMASS_MAX», s. Dateikopf).
//
// ═══ Ä60 (c) · WIE BREIT DER LESER IST UND WELCHE SPUREN ER TRÄGT ════════════
//
// David-Entscheid 17.8.2026 (Chat, wörtlich «ja und c, mach so»): von den drei
// Optionen des Spalten-Entscheids gilt **(c)** — der Rahmen des GESETZ-LESERS
// darf breiter werden als eine Textseite, damit Gesetzestext und Beiwerk-Blatt
// nebeneinander stehen statt übereinander. Kein anderer Seitentyp ist berührt:
// `max-w-content` (70 rem, `tailwind.config.js`) bleibt unverändert, die
// Aufweitung geschieht am Leser-Wurzelelement und nur dort.
//
// ── DER BEFUND, DEN DAS BEHEBT (Ä60/Ä59, gemessen 17./18.8.2026, StPO 429) ──
// Das rechts angeschlagene Blatt lag ÜBER dem Lesetext, weil der Rahmen auf
// 1072 px gedeckelt war, das Blatt aber am FENSTER klebt:
//
//   Viewport   Rahmen        Textabsatz     Blatt          verdeckt   Titel
//   1024        24… 999      372… 992        672…1024      320 px     328 px
//   1150        39…1111      435…1055        798…1150      257 px     313 px
//   1280       104…1176      500…1120        928…1280      192 px     248 px
//   1440       184…1256      580…1200       1088…1440      112 px     168 px
//   1920       424…1496      820…1440       1568…1920        0 px       0 px
//
// Erst ab 1920 px läuft das Blatt am Rahmen vorbei — auf jedem realen
// Laptop-Fenster fehlten die Zeilenenden. «Keine feste Blattbreite behebt das»
// (Vollzugsvermerk H3): der Rand rechts der Lesespalte misst @1440 240 px,
// @1280 nur 160 — die Arithmetik, nicht die Zahl, war der Defekt.
//
// ── DIE RECHNUNG, DIE DEN DECKEL SETZT ──────────────────────────────────────
// Der frühere Kommentar im Rahmen («KEINE DRITTE SPUR») rechnete richtig und
// zog den falschen Schluss: 18 rem Gliederung + 40 rem Lesemass + 22 rem Blatt
// samt zwei Abständen à 2 rem sind **84 rem**, der Seitenrahmen bot 67 rem
// (1072 px). Der Zweig war nicht unmöglich, ihm fehlten 272 px. Genau die gibt
// (c) ihm — und keinen Schritt mehr: `LESER_MAX_REM` IST diese Summe. Ein
// Rahmen, der breiter wäre als seine drei Spuren, wäre Fensterbreite für
// Fliesstext (Design-Grundlage Kap. 8 Nr. 7).
//
// ── DIE EINE SCHWELLE: «BEHÄLT DER TEXT SEIN VOLLES LESEMASS?» ──────────────
// Unterhalb von 84 rem passen die drei Spuren nicht zusammen. Statt den Text zu
// quetschen (bei 976 px Raum blieben ihm 272 px = ~30 ch) weicht die
// GLIEDERUNG auf ihre Schiene (2.25 rem) — dasselbe Bauteil, das Ä79 als «den
// einen Griff» festgehalten hat, und ein Klick zurück. Gemessen ergibt das:
//
//   Raum (px)   Spuren                        Lesespalte   ch (StPO)
//    976 (VP 1024)  Schiene · Text · Blatt        524 px      ~56
//   1102 (VP 1150)  Schiene · Text · Blatt        640 px       73  (voll)
//   1232 (VP 1280)  Schiene · Text · Blatt        640 px       73  (voll)
//   1344 (VP≥1392)  Gliederung · Text · Blatt     640 px       73  (voll)
//
// Der Text ist also ab 1150 px Fenster in KEINER Lage schmaler als heute, und
// unter 1024 px ändert sich nichts (dort trägt die Gliederung ohnehin ein
// Sheet, und das Blatt bleibt, was es war — David-Entscheid: «unter 1024 bleibt
// alles wie heute»).
//
// ── GEMESSEN WIRD DER RAUM, NICHT DAS EIGENE ELEMENT ────────────────────────
// `useElementBreite` misst das Wurzelelement — genau das, dessen Breite diese
// Datei VERSTELLT. Als Entscheidungsgrundlage wäre es eine Rückkopplung. Der
// `raum` ist darum die Breite, die die Lesefläche im `<main>` HÄTTE (Fenster
// bzw. Pane minus Aussenabstände, ohne Scrollbar); sie ändert sich, wenn das
// Fenster oder die App-Seitenleiste sich ändert, nie durch diese Datei selbst.

// ── WARUM DAS GRID AUCH EINGEKLAPPT STEHEN BLEIBT (David 16.8.2026) ─────────
// Befund am H1-Stand, @1440 reproduziert: klappte man die Gliederung ein,
// verschwand das Grid ganz. Die Lesespalte sprang um 175 px nach links
// (x 600 → 424) und gewann ganze 31 px Breite (641 → 672, mehr lässt das
// Lesemass nicht zu) — ein Sprung ohne Gewinn, und der einzige Weg zurück war
// ein unbeschriftetes 24-px-☰ an der GEGENÜBERLIEGENDEN Fensterkante (x = 1101).
// Darum bleibt die linke Spur immer stehen und wird zur Schiene (Ä79).

/** Breite der Gliederungsspalte (rem) — Ist-Wert des Rahmens, hier benannt.
 *  (Das Fahrplan-Soll §5a nannte 250 px; gebaut sind seit W2·19 S2 288 px.) */
const SPUR_GLIEDERUNG = 18;
/** Breite der Blatt-Spur (rem) = 380 px, Board «Erlass-Blatt» (W2·29 S5). */
const SPUR_BLATT = 23.75;
/** Kleinste Lesespalte (rem, ≈ 46 ch), unter der eine Spur weicht — dieselbe
 *  Zahl wie Ä60 (c) und `satzspiegel.SPIEGEL_MIN_BREIT` (dort eigenständig
 *  hergeleitet): so kippt das offene Blatt die Artikelform nie in die Zeile. */
const LESE_MIN = 28;
/** Breite der eingeklappten Gliederungs-Schiene (rem), `leisteAufbau.schieneAufbau`. */
const SPUR_SCHIENE = 2.25;
/** Abstand zwischen zwei Spuren (rem) = `gap-5` (LeserLeseZeile.tsx).
 *  2 → 1.25 rem am 29.8.2026 (Auftrag David: «weniger Abstand Gesetz ↔
 *  Gliederung»); Folgewerte LESER_MAX_REM/RAUM_MIN_BLATT rechnen mit. */
export const SPUR_ABSTAND = 1.25;
// `LESEMASS` (40 rem, `max-w-reading`) ist als Konstante mit `LESER_MAX_REM`
// gefallen (D33): der Rahmen rechnet nicht mehr mit ihm. Der Wert selbst lebt
// unverändert in `tailwind.config.js` und in `--leser-lesemass-max` weiter.

// ── LESEMASS_MAX · Auftrag David 21.8.2026, wörtlich «können wir machen, dass
//    der gesetzestext bei verfügbarer breite vom bildschirm oder wenn
//    gliederung eingeklappt ist breiter wird» — zugleich Erledigung von
//    Cowork-Befund 50 und der ENTSCHEID zum offenen Satzspiegel-Punkt (Kap. 5
//    im Fahrplan): der Text DARF breiter werden, aber mit einem Deckel statt
//    Vollbreite (Design-Grundlage Kap. 8 Nr. 7 «nie Fensterbreite für
//    Fliesstext»). ─────────────────────────────────────────────────────────
//
// HERLEITUNG (gemessen 21.8.2026 am gebauten Stand, längster mehrzeiliger
// Fliesstext-Absatz je Erlass @1440, Methode von `leser-lesemass.e2e.ts`):
//   · `leser-lesemass.e2e.ts` bewacht als HARTE Zusage SC 1.4.8 (WCAG): Zeile
//     ≤ 80 ch. Diese Zusage gilt unverändert weiter — der Auftrag nennt eine
//     Zielspanne «~75–90 Zeichen», nicht eine Anhebung der WCAG-Decke; wo
//     beides zusammentrifft, gewinnt die geprüfte Accessibility-Zusage.
//   · Erster Versuch 46 rem: StGB (nicht in `ERLASSE`, aber real ausgeliefert)
//     stieg auf 81 ch — ÜBER der Decke. 45 rem = 720 px bringt StGB auf 78 ch
//     zurück (2 ch Reserve) und hält alle anderen Stichproben darunter: ZGB 68→75,
//     OR 71→77, StPO 73→75, VMWG 74→74 ch (unverändert — der längste Absatz
//     bricht an derselben Stelle um). +5 rem = **+12.5 %** gegenüber `LESEMASS`
//     — spürbar breiter, aber knapper als «ein Viertel», weil StGB die 80-ch-
//     Decke schon bei deutlich weniger Zuwachs erreicht (Ausgangswert 73 ch bei
//     40 rem war bereits nah an der Decke). Die 75–90-ch-Zielspanne des
//     Auftrags wird damit nur am UNTEREN Rand erfüllt — offengelegte
//     Abweichung (§7): Ursache ist die vorbestehende SC-1.4.8-Zusage, nicht
//     eine engere Lesung des Auftrags.
//
// WARUM EIN DECKEL UND KEINE VOLLBREITE: die Lese-Zelle (`minmax(0,1fr)` in
// `rahmenBild.spalten`) ist bei offener Gliederung @1440 bereits 752 px breit,
// eingeklappt (Schiene) 1004 px — beides mehr als der Deckel. `width:100%` +
// `max-width` (unverändertes CSS-Muster von `max-w-reading`) liefert genau die
// verlangte Eigenschaft von selbst: die Spalte wächst mit dem verfügbaren Raum
// der GRID-Zelle (schon vorhanden über `useRahmenRaum`/`rahmenBild`, "eine
// Breiten-Quelle", A-8) und STOPPT am Deckel — der Rest geht in Randluft. Keine
// dritte Schwelle, keine neue Messung: die Zelle ist längst dynamisch, nur der
// Deckel selbst war bislang zu knapp gesetzt, um je zu greifen.
//
// ANWENDUNG: `#lc-lesespalte` (`LeserLesespalte`) UND `.max-w-normtext`
// (Artikel-Fliesstext `ArtikelLeser` + Ingress `ErlassKopfBlock`) werden NUR
// innerhalb des V3-Wurzelelements (`index.css`,
// `.lc-leser[data-leser-v3="rahmen"]`) auf denselben Wert gehoben — sonst
// bekäme die Kopfzeile (ungedeckelt, volle Zellenbreite) einen anderen rechten
// Rand als der Fliesstext (genau der Fehler, den A37 behoben hat). V1 (Ist-
// Hülle) ist unberührt: die Selektoren sind auf `[data-leser-v3="rahmen"]`
// gescoped, das V1 nie trägt.
export const LESEMASS_MAX = 45;

// D33 strich `LESER_MAX_REM`/`LESE_MIN`/`RAUM_MIN_BLATT` (R6E-LESER.md);
// Entscheid A bringt `LESE_MIN` zurück, der Deckel rechnet «Spuren + LESEMASS_MAX».

export interface RahmenRaum {
  /** Breite (px), die dem Leser im `<main>` zur Verfügung steht — der Deckel
   *  der Aufweitung (Entscheid A, 24.9.2026; D33 hatte sie ungelesen gelassen). */
  raumPx: number;
  /** Breite (px) des Rahmens = Inhaltsbreite seines Elternkastens. */
  ruhePx: number;
  /** Gemessene Wurzel-Schriftgrösse (px) — der Schriftregler verstellt sie (R3). */
  remPx: number;
}

export interface RahmenLage {
  /** Gemessener Raum; `null`, solange nichts gemessen ist (dann bleibt alles wie bisher). */
  raum: RahmenRaum | null;
  /** Steht die Gliederung auf dieser Fläche überhaupt als Spalte zur Wahl? */
  spaltenLage: boolean;
  /** Hat der Nutzer die Gliederung offen? */
  tocOffen: boolean;
  /** Kante des Blatts (`kopfStufen.panelForm`) — entscheidet mit über die
   *  Artikelform (`./satzspiegel`). */
  ruheForm: 'rechts' | 'unten';
  /** Entscheid A (24.9.2026): Steht das Erlass-Blatt auf dieser Fläche als
   *  Spur zur Wahl (Einzelansicht ab 1024 px, Kante `'rechts'`)? */
  blattLage: boolean;
  /** Ist das Blatt offen? D33 hatte die Eingabe gestrichen («das Bild hängt
   *  nicht am Panel-Zustand»); Entscheid A hebt genau diese Zusage auf. */
  blattOffen: boolean;
}

export interface RahmenBild {
  /** Gestalt des Erlass-Blatts: eigene Spur rechts (`'spalte'`, Entscheid A
   *  24.9.2026 — D33 hatte sie gestrichen) oder das Sheet unten. Die
   *  Überlagerung `'rechts'` (D33/D-1) gibt es nicht mehr. */
  blattForm: 'spalte' | 'unten';
  /** Steht das offene Blatt als 23.75-rem-Spur? */
  blattSpur: boolean;
  /** Steht statt seiner die Schiene rechts (Blatt zu)? */
  blattSchiene: boolean;
  /** Steht die Gliederung als 18-rem-Spalte? */
  gliederungSpalte: boolean;
  /** Steht statt ihrer die schmale Schiene? */
  schiene: boolean;
  /** Steht die Gliederungs-Schiene nur, weil das offene Blatt ihren Platz hat?
   *  Dann holt ihr Klick den Platz zurück (schliesst das Blatt), statt eine
   *  Gliederung «einzublenden», die ohnehin offen gewählt ist (Ä60 (c) P1-1). */
  schieneHoltPlatz: boolean;
  /** Breite der rechten Spur SAMT Abstand (rem), 0 ohne Blatt-Spalte — die
   *  Kopfzeile stellt ihren rechten Streifen so breit (Spiegel von D32). */
  spurVersatzRechtsRem: number;
  /** Aufweitung des Rahmens (Breite + Ränder) oder `undefined`. */
  breite: CSSProperties | undefined;
  /**
   * Waagrechter Versatz der Lese-Zelle gegenüber der linken Rahmenkante (rem)
   * — also die Breite der linken Spur SAMT ihrem Abstand, oder 0, wo keine
   * Spur steht (Handy, Pane, kein Gliederungs-Inhalt).
   *
   * ── D32 (David 6./7.9.2026) · «DIE SUCHE ERSCHEINT IN DER GLIEDERUNG» ─────
   * Die Erlass-Suche gehört seit D28 in den klebenden Kopf-BLOCK, der über der
   * ganzen Rahmenbreite steht. Gemessen 7.9.2026 @1440 (OR) hatte das zur
   * Folge, dass das Feld bei x = 184 begann — der linken Kante der
   * GLIEDERUNGSSPALTE — während der Gesetzestext erst bei x = 492 anfing:
   * **308 px** daneben, also über der Gliederung statt über dem Gesetz. Genau
   * das meinte Davids Befund; D28 selbst hatte «oben am gesetz» verlangt.
   *
   * Diese Zahl ist die Antwort, und sie steht HIER, weil hier schon entschieden
   * wird, welche Spur links steht (eine Geometrie-Quelle, LM-003). Der Rahmen
   * legt sie als `--leser-spur-versatz` aus; die Kopfzeile stellt ihre linke
   * Zone genau so breit, und damit beginnt die Suche in JEDER Lage an der
   * Kante des Gesetzestextes — beim Ein- und Ausklappen wandert sie um exakt
   * denselben Betrag wie die Textspalte (Sonde `w224-leser-d32-d33` (a)/(b)).
   */
  spurVersatzRem: number;
  /** `grid-template-columns` der Lese-Zeile; `undefined` = kein Grid (wie bisher). */
  spalten: string | undefined;
  satzspiegel: Satzspiegel; // Artikelform (W2·24-R6b) — Herleitung in `./satzspiegel`
}

/**
 * Die eine Entscheidung über die Spuren des Rahmens — rein, an jeder Breite
 * nachrechenbar (§2), Beweis in `src/tests/leser-v3-rahmenspalten.test.ts`.
 * Entscheid A (24.9.2026): `blattOffen` ist wieder Eingabe (Dateikopf).
 */
export function rahmenBild(lage: RahmenLage): RahmenBild {
  const { raum, spaltenLage, tocOffen, ruheForm, blattLage, blattOffen } = lage;
  const rem = raum?.remPx ?? 16;
  // Ohne Messung (erster Render) gilt der Raum als ausreichend — gemessen wird
  // im selben Commit (Callback-Ref in `useRahmenRaum`), vor dem ersten Bild.
  const raumRem = raum == null ? Infinity : raum.raumPx / rem;
  const linksSchieneRem = spaltenLage ? SPUR_SCHIENE + SPUR_ABSTAND : 0;
  const blattSpalte = blattLage && raumRem >= linksSchieneRem + LESE_MIN + SPUR_ABSTAND + SPUR_BLATT;
  const blattSpur = blattSpalte && blattOffen;
  const weicht = blattSpur && spaltenLage && tocOffen
    && raumRem < SPUR_GLIEDERUNG + SPUR_ABSTAND + LESE_MIN + SPUR_ABSTAND + SPUR_BLATT;
  const gliederungSpalte = spaltenLage && tocOffen && !weicht;
  const schiene = spaltenLage && !gliederungSpalte;

  const spurRem = gliederungSpalte ? SPUR_GLIEDERUNG : SPUR_SCHIENE;
  const spurVersatzRem = spaltenLage ? spurRem + SPUR_ABSTAND : 0;
  const rechtsRem = blattSpur ? SPUR_BLATT : SPUR_SCHIENE;
  const spurVersatzRechtsRem = blattSpalte ? rechtsRem + SPUR_ABSTAND : 0;
  // Ziel: die Spuren und keinen Schritt mehr (Ä60 (c): ein breiterer Rahmen gäbe
  // dem Fliesstext Fensterbreite) — nie schmaler als ohne Aufweitung.
  const breitePx = raum == null ? null
    : Math.min(raum.raumPx, Math.max(raum.ruhePx, (spurVersatzRem + LESEMASS_MAX + spurVersatzRechtsRem) * rem));
  const zellePx = breitePx == null ? null : breitePx - (spurVersatzRem + spurVersatzRechtsRem) * rem;
  const satzspiegel = satzspiegelFuer(zellePx, rem, spaltenLage && ruheForm === 'rechts');
  const spuren = [spaltenLage ? `${spurRem}rem` : '', 'minmax(0,1fr)', blattSpalte ? `${rechtsRem}rem` : '']
    .filter((x) => x !== '').join(' ');
  return {
    blattForm: blattSpalte ? 'spalte' : 'unten',
    blattSpur,
    blattSchiene: blattSpalte && !blattOffen,
    gliederungSpalte,
    schiene,
    schieneHoltPlatz: weicht,
    spurVersatzRem,
    spurVersatzRechtsRem,
    spalten: spaltenLage || blattSpalte ? spuren : undefined,
    breite: raum != null && breitePx != null ? aufweitung(raum, breitePx) : undefined,
    satzspiegel,
  };
}

/**
 * Ä60 (c) (17.8.2026), mit Entscheid A zurück: der Rahmen wird `breitePx` breit
 * und behält seine linke Kante, solange rechts im Raum Platz ist; erst dann
 * rückt er nach links. `undefined`, wo nichts zu gewinnen ist.
 */
function aufweitung(raum: RahmenRaum, breitePx: number): CSSProperties | undefined {
  if (breitePx <= raum.ruhePx) return undefined;
  const linksHeute = (raum.raumPx - raum.ruhePx) / 2;
  const dx = Math.min(linksHeute, raum.raumPx - breitePx) - linksHeute; // ≤ 0
  return {
    '--leser-max-w': `${breitePx}px`,
    width: 'var(--leser-max-w)',
    marginInlineStart: `${dx}px`,
    // Der Kasten muss aufgehen: dx + Breite + Ende = Elternbreite.
    marginInlineEnd: `${raum.ruhePx - breitePx - dx}px`,
  } as CSSProperties;
}


/**
 * Misst den Raum am Elternkasten und am umgebenden `<main>`.
 *
 * `ruhePx` ist die INHALTSBREITE des Elternkastens — also genau die Breite, die
 * der Rahmen ohne Aufweitung hätte, unabhängig davon, wie viele neutrale
 * Zwischen-Container die Hülle einzieht. `raumPx` ist die Breite des `<main>`
 * abzüglich aller Polsterungen und Kanten auf dem Weg dorthin; `clientWidth`
 * lässt die Scrollbar aussen vor, `100vw` täte das nicht.
 */
function raumMessen(el: HTMLElement): RahmenRaum | null {
  const eltern = el.parentElement;
  if (!eltern) return null;
  const innen = (n: HTMLElement) => {
    const cs = getComputedStyle(n);
    return { pad: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth) };
  };
  const ruhePx = eltern.clientWidth - innen(eltern).pad;
  let rand = 0;
  let lauf: HTMLElement | null = eltern;
  while (lauf && lauf.tagName !== 'MAIN') {
    rand += innen(lauf).pad;
    lauf = lauf.parentElement;
  }
  // Ohne `<main>` gibt es keine belastbare Aussenkante — dann NICHT aufweiten
  // (der Rahmen bleibt, was er heute ist), statt auf `100vw` zu raten.
  if (!lauf) return null;
  const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const raumPx = lauf.clientWidth - rand;
  if (!(raumPx > 0) || !(ruhePx > 0)) return null;
  return { raumPx, ruhePx, remPx };
}

function gleich(a: RahmenRaum | null, b: RahmenRaum | null): boolean {
  if (a === null || b === null) return a === b;
  return a.raumPx === b.raumPx && a.ruhePx === b.ruhePx && a.remPx === b.remPx;
}

/**
 * Der Mess-Ref des Rahmens.
 *
 * CALLBACK-REF und Messung im Commit — dieselbe Begründung und derselbe
 * reproduzierte Fehler wie bei `useElementBreite`: der Rahmen kehrt beim ersten
 * Render mit dem Lade-Platzhalter zurück, ein `useEffect` auf einem `useRef`
 * liefe genau einmal mit `null` und hinge nie einen Observer ein.
 *
 * Beobachtet werden BEIDE Kästen: das `<main>` (Fenster, Pane-Breite,
 * App-Seitenleiste) und der Elternkasten (er folgt dem Schriftregler, weil
 * `max-w-content` in rem misst — das `<main>` täte das nicht).
 */
export function useRahmenRaum(): {
  raum: RahmenRaum | null;
  raumRef: (el: HTMLDivElement | null) => void;
} {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [raum, setRaum] = useState<RahmenRaum | null>(null);

  const uebernimm = useCallback((ziel: HTMLElement) => {
    const neu = raumMessen(ziel);
    setRaum((alt) => (gleich(alt, neu) ? alt : neu));
  }, []);

  const raumRef = useCallback((ziel: HTMLDivElement | null) => {
    setEl(ziel);
    if (ziel) uebernimm(ziel);
  }, [uebernimm]);

  // KEINE Messung im Effekt-Körper (Lint `react-hooks/set-state-in-effect`, rot
  // gesehen im `npm run gate` vom 18.8.2026): ein `setState` direkt im Effekt
  // erzeugt eine Kaskaden-Renderung. Und es wäre die DRITTE Messung derselben
  // Zahl — der Callback-Ref oben misst beim Einhängen, und `ResizeObserver`
  // liefert für jedes neu beobachtete Ziel von sich aus eine erste Meldung.
  // Verhalten bleibt damit gleich; bewiesen an `leser-v3-rahmen` (a)–(f2), die
  // ALLE eine gemessene Aufweitung voraussetzen und ohne sie rot werden.
  useEffect(() => {
    if (!el || typeof ResizeObserver === 'undefined') return;
    const haupt = el.closest('main');
    const eltern = el.parentElement;
    const ro = new ResizeObserver(() => uebernimm(el));
    if (haupt) ro.observe(haupt, { box: 'border-box' });
    if (eltern) ro.observe(eltern, { box: 'border-box' });
    return () => ro.disconnect();
  }, [el, uebernimm]);

  return { raum, raumRef };
}
