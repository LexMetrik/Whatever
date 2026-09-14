import { useId, useRef, useState, type ReactNode } from 'react';

// ═══ DIE FUNKTIONSZEILE AM ARTIKELENDE (Klassenpräfix `.lr7-bez`) ═══════════
//
// ── HERKUNFT DER DATEI (W2·26, 11.9.2026) ─────────────────────────────────
// Diese Datei hiess bis W2·26 `parts/BezuegeKopf.tsx`; der Name stammte aus
// D33, als die Zeile noch als KOPF unter der Artikelnummer stand und
// ausschliesslich BEZÜGE trug. Beides gilt seit D34/D40 nicht mehr: der Ort ist
// das Artikelende, und die Zeile trägt neben den Bezügen die Fassung (D40) und
// die Artikel-Aktionen (D35-F1). Der Name benannte damit weder den Ort noch den
// Inhalt — Umbenennung auf `Funktionszeile` (Komponente `Funktionszeile`).
// Der Typ `BezugsMarke` und die CSS-Klassen `.lr7-bez*` BLEIBEN: die Klassen
// sind der Vertrag zu Golden/Prerender und den Sonden, der Typ benennt weiterhin
// genau eine Rubrik-Marke. Die datierten Belege unten sind unverändert stehen
// geblieben (§0 Ziff. 2b) — sie beschreiben ihren Stand, nicht den Dateinamen.
//
// ── W2·24-D35-F1 (David 7.9.2026) · EINE ZEILE TRÄGT DEN ARTIKEL ───────────
// Entscheid: Variante A des D35-Vorschlags, mit dem Nachtrag «das alles soll
// dann nur auf klick aufklappbar sein». Die Zeile am Artikelende trägt LINKS
// die Rubriken dieses Artikels mit ihren Zahlen und RECHTS seine Aktionen:
//
//     Bezüge  11 Entscheide › · 2 Materialien › · 6 Verweise › · 1 Rechner ›
//                             Zitat · Link · Amtliche Fassung ↗
//
// (D44, David 7.9.2026: die vierte Aktion «⧉ Artikel daneben» ist ersatzlos
// gestrichen — Herleitung in `./ArtikelAktionen.tsx`.)
//
// DREI ÄNDERUNGEN GEGENÜBER D34, jede mit eigenem Grund:
//
// (1) JE RUBRIK EIN GRIFF, nicht mehr einer für alle. Bis D34 klappte EIN
//     `<details>` alle vier Rubriken gemeinsam auf; wer die Entscheide wollte,
//     bekam Materialien, Verweise und Rechner mit. Davids Nachtrag verlangt die
//     Wahl je Rubrik — also trägt jede Marke ihren eigenen `aria-expanded`.
//     Der `<summary>` fällt damit weg: er kann nur EINEN Zustand tragen, und
//     ein `<details>` je Rubrik liesse seinen Inhalt IN der Zeile aufgehen
//     statt unter ihr. Die Knöpfe sind darum echte `<button>` — Enter/Space,
//     Fokusring und `aria-expanded` bekommen sie vom Browser, nicht von Hand.
//
// (2) IMMER ZU BEIM LADEN. Der gemerkte Zustand (`lm.leser.bezuege-offen`,
//     einmal je Seitenaufruf aus dem `localStorage` gelesen) ist ERSATZLOS
//     gelöscht — kein Sitzungs-Ersatz, kein zweiter Speicher (§17-Gegengewicht:
//     wer etwas hinzufügt, streicht zuerst die Stelle, die dieselbe Sorge schon
//     trägt). Grund: mit vier Rubriken je Artikel wäre ein gemerktes «offen»
//     die Zusage, beim nächsten Aufruf 1686 Artikel mit vier offenen Blöcken zu
//     zeigen — und der Ladepfad dahinter (unten, `onOeffnen`) liefe dann ohne
//     Klick an. Der Nachtrag sagt «nur auf klick»; das ist der Bau dazu.
//
// (3) DIE AKTIONEN STEHEN DAUERHAFT. Rechts in derselben Zeile, ohne
//     `opacity-0`-Kette (Herleitung in `./ArtikelAktionen.tsx`). Sie erscheinen
//     auch dann, wenn der Artikel KEINE einzige Rubrik hat — deshalb fällt die
//     frühere Regel «ohne Zahl steht hier nichts» nicht weg, sondern gilt jetzt
//     genau für die Rubriken: eine Rubrik ohne echte Zahl erscheint nicht (§8),
//     die Zeile selbst steht, solange sie etwas zu tragen hat.
//
// ── W2·24-D40 (David 7.9.2026) · DIE FASSUNG IST DIE SECHSTE RUBRIK ───────
// Wörtlich: «und wieso ist fassung nicht auch unten am artikel?». Die Frage
// trifft: seit D34/D35 stand JEDE artikelbezogene Auskunft in dieser Zeile —
// nur die Fassungshistorie nicht, die hing weiter am Artikelkopf. Sie ist
// jetzt eine Rubrik wie die anderen, mit Zahl («3 Fassungen»), Griff und
// Menü-Schalter; der Kopf-Slot ist ersatzlos gefallen (§17-Gegengewicht — wer
// hinzufügt, streicht zuerst die Stelle, die dieselbe Sorge schon trägt).
//
// Die Zeile liest sich damit:
//
//     3 Fassungen ›   Bezüge  11 Entscheide › · 2 Materialien › · …
//                             Zitat · Link · Amtliche Fassung ↗ · ⧉ …
//
// Warum «Fassung» LINKS vom Wort «Bezüge» steht, warum sie den Registerstrich
// der Gesetze trägt und trotzdem einen eigenen Buchstaben hat: unten am Typ
// `BezugsMarke.reg` und an der Zustands-Rechnung.
//
// ── WAS UNVERÄNDERT BLEIBT ─────────────────────────────────────────────────
// Der ORT (Artikelende, seit D34), die Klassen (`.lr7-bez*` — sie sind der
// Vertrag zu den Sonden `e2e/leser-bezuege-*`, `popover-lesbar-d31`,
// `verweis-u`, `leser-links-p3`), die Registerfarben r/m/g/w, `print:hidden`
// und die Rechnung der Zahlen (sie steht in `./ArtikelLeser.bezuegeFuss.tsx`,
// nicht hier). Dateiname und Komponentenname bleiben ebenfalls: ein Umbenennen
// hätte datierte Belege «nachgeführt», statt sie stehenzulassen (§2b).
// [W2·26, 11.9.2026 — ERGÄNZUNG, nicht Nachführung: der Satz galt für D40, wo
//  die Umbenennung ein Nebenprodukt gewesen wäre. Sie ist mit W2·26 ein eigener,
//  verhaltensneutraler Schritt mit eigenem Commit; die Belege stehen unverändert.]
//
// ── WARUM DIE MARKEN `.lc-btn-mini` TRAGEN ─────────────────────────────────
// Ein Griff muss als Griff erkennbar sein (LM-091, gemessen 22×13 px ohne
// Rahmen = unter WCAG 2.5.8) — und die Zeile trägt rechts ohnehin die
// Mini-Aktionen. EIN Knopf-Rezept für EINE Zeile statt zweier Anatomien
// nebeneinander (§5/§10, B-K1): Haarlinie statt Fläche, `--tap-ziel` als
// Mindesthöhe, die Registerfarbe als kräftigere linke Kante. Die STIMME
// (Schriftgrad, Tintenstufe) bleibt die der Zeile.
// ═══ W2·26 (Mandat David 11.9.2026) · DIE ZEILE WIRD ÜBERARBEITET ══════════
//
// Wörtlich: «überarbeite insgesamt die Funktionszeile am Artikelende; Fassung
// soll nur ‹gilt seit XXX› zeigen, erst beim Aufklappen erscheinen die Angaben
// […] alles sauberer, übersichtlicher, besser bedienbar.»
//
// VIER ÄNDERUNGEN IN DIESER DATEI, jede mit eigenem Grund:
//
// (1) DAS WORT «BEZÜGE» IST ERSATZLOS GESTRICHEN (Z1). Es war eine Überschrift
//     über vier Marken, die ihren Gegenstand bereits im Wort tragen
//     («11 Entscheide», «2 Materialien»). Eine Überschrift, die nichts sagt,
//     was die Sache darunter nicht schon sagt, ist Lärm — und sie brauchte eine
//     eigene Anschalt-Regel über vier CSS-Zeilen plus das Attribut
//     `data-bez-marken`, nur damit sie nicht über einer leeren Liste stehen
//     blieb (§17-Gegengewicht: was eine Bewachung braucht, um nicht zu lügen,
//     wird gestrichen statt bewacht). Der GRUPPENNAME im Ansicht-Menü bleibt:
//     dort benennt er wirklich eine Gruppe von Schaltern.
//     `data-bez-marken` bleibt am Wurzel-Element stehen — es ist seit D35-F2
//     die maschinenlesbare Auskunft «welche Rubriken führt dieser Artikel»
//     und wird von den Sonden gelesen.
//
// (2) DIE FASSUNG ZEIGT ZUGEKLAPPT NUR IHREN STAND (Z2). Die Marke liest
//     «Gilt seit 1.1.2023 ›» statt «3 Fassungen ›» — die Zahl der
//     Änderungsstände ist die Auskunft der ZEITLEISTE, der Stand ist die
//     Auskunft, die man am Artikel sucht. Aufgeklappt steht die Zahl wieder da
//     («3 Fassungen»), denn dann ist die Zeitleiste der Gegenstand. Woher der
//     Stand kommt: `../fassungsEtikett.ts` — EINE Rechnung für die Marke hier
//     und das Schild im Block (§5), nicht zwei Formulierungen desselben Datums.
//
// (3) AKKORDEON STATT MEHRFACH-OFFEN (Z4). Bis W2·26 konnte JEDE Rubrik
//     gleichzeitig offen stehen (`Partial<Record<reg, boolean>>`); bei fünf
//     Rubriken wuchs der Artikel dann um fünf Blöcke, und der Leser verlor die
//     Zeile aus dem Blick. Jetzt trägt der Zustand GENAU EINE offene Rubrik
//     oder keine (`reg | null`) — Öffnen einer anderen schliesst die erste.
//     Escape schliesst und gibt den Fokus an den Griff zurück (er hat ihn nach
//     dem Klick ohnehin; nach einer Tastaturwanderung IN den Block ist die
//     Rückgabe der Unterschied zwischen «zu» und «verloren»).
//     `aria-controls` zeigt auf den Block, `aria-expanded` auf den Zustand.
//     UNVERÄNDERT: beim Laden ist alles zu (D35-F1 (2), kein localStorage).
//
// (4) DIE AKTIONEN WERDEN ERST GERENDERT, WENN SIE ERREICHBAR SIND (Z6, §15).
//     GEMESSEN 11.9.2026 am OR-Leser (`document.querySelectorAll('button').length`):
//     13 532 Knöpfe im DOM. 1686 Artikel × 3 Aktionen sind davon rund 5000 —
//     Knöpfe, die niemand sieht, solange die Maus woanders steht, und die jede
//     Rollen-Abfrage eines Screenreaders und jedes `getByRole` teuer machen
//     (Ä24: die Namensberechnung über 13 518 Knöpfe riss lokal unter Drossel
//     das 20-s-Budget einer Sonde).
//     LOGIKVERLUST-BEWERTUNG (§15, Pflicht): KEINER. Es ändert sich allein der
//     RENDER-ZEITPUNKT, kein Inhalt, kein Ziel, kein Wortlaut, keine Adresse.
//     Die Aktionen stehen, sobald der Artikel Hover oder Fokus hat oder eine
//     Rubrik offen ist — und auf Geräten OHNE Hover (`(hover: none)`, also
//     Telefon und Tablet) IMMER. Genau das ist der Befund D35-F1 (1), der die
//     Aktionen aus der `opacity-0`-Kopfzeile geholt hat: «eine Aktion, die man
//     nur per Hover findet, gibt es auf dem Telefon praktisch nicht». Auf dem
//     Telefon gibt es sie unverändert; auf dem Zeigegerät ist Hover die Geste,
//     mit der man ohnehin hinfährt, bevor man klickt.
//     DIE RUBRIK-GRIFFE BLEIBEN IMMER IM DOM — sie tragen die Zahlen, und eine
//     Zahl, die erst bei Hover erscheint, wäre keine Auskunft mehr (§8).
//
// ── DIE ABFRAGE `(hover: none)` STEHT EINMAL, NICHT 1686-MAL ───────────────
// Ein `useMediaQuery` je Artikel wären auf dem OR 1686 Abonnenten einer
// Medienabfrage — dieselbe Rechnung, an der schon der gemerkte Aufklapp-Zustand
// gefallen ist (D35-F1 (2)) und die Rubriken-Wahl in CSS statt React steht
// (`v3/LeserRubrikenWahl.tsx`). Die Eigenschaft «dieses Gerät hat keinen Hover»
// wechselt innerhalb einer Sitzung praktisch nie; sie wird darum EINMAL beim
// Laden des Moduls gelesen. Ohne `window` (Prerender, Tests ohne DOM) gilt
// «Gerät mit Hover» — im Prerender steht die Zeile ohnehin nicht (das
// ausgelieferte HTML trägt NULL `<button>`, `e2e/helpers/leserBereit.ts`).
const OHNE_HOVER: boolean = typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(hover: none)').matches;

/** Eine Rubrik der Zeile: Zahl, Wort, Registerfarbe — und was sie aufklappt. */
export interface BezugsMarke {
  /** Registerbuchstabe für die Farbe: r = Rechtsprechung, m = Materialien,
   *  g = Gesetze, w = Werkzeuge.
   *
   *  D40 · `f` = Fassung. Sie trägt den Registerstrich der GESETZE (`--reg-g`,
   *  `src/index.css`) — die Fassungshistorie ist Auskunft über den Erlass
   *  selbst, nicht über eine fremde Gattung; eine sechste Farbe für dieselbe
   *  Landkarte wäre eine zweite Legende (§5). Der BUCHSTABE bleibt trotzdem
   *  eigen: er ist der Schlüssel des Aufklapp-Zustands, der Menü-Wahl
   *  (`../leserOptionen`, `data-fuss-aus`) und der CSS-Regel — `g` doppelt
   *  vergeben hiesse, dass «Verweise» abwählen die Fassung mitnimmt. */
  reg: 'f' | 'r' | 'm' | 'g' | 'w';
  /** Anzahl — nur echte, gezählte Werte (§8: nie geschätzt, nie erfunden). */
  anzahl: number;
  /** Einzahl/Mehrzahl des Rubriknamens. */
  wort: [einzahl: string, mehrzahl: string];
  /**
   * W2·26/Z2 · Was die Marke ZUGEKLAPPT liest, wenn nicht «n Wort».
   *
   * Nur die Fassung hat das: ihr Gegenstand im Ruhezustand ist der STAND
   * («Gilt seit 1.1.2023»), nicht die Zahl der Änderungsstände. Aufgeklappt
   * steht die Zahl — dann ist die Zeitleiste der Gegenstand.
   *
   * Der Text kommt fertig vom Aufrufer (`./ArtikelLeser.bezuegeFuss.tsx` über
   * `../fassungsEtikett`); diese Datei formuliert nichts (§3).
   */
  etikett?: string;
  /**
   * W2·26/Z3 · Zusatz für den `title` der Marke — die Grundgesamtheit, wenn
   * die sichtbare Zahl eine GEFILTERTE ist.
   *
   * Davids Mandat verlangt EINE Zahl in der Zeile. Die Grundgesamtheit
   * verschwindet damit nicht (§8: eine Zahl ohne Bezugsgrösse wäre eine zweite
   * Wahrheit neben der Liste darunter) — sie steht im `title`, wie sie in der
   * Liste selbst im `title` der Statusgruppe steht (`./BezuegeZeile.tsx`).
   */
  titel?: string;
  /**
   * W2·5m · Der Klartext-Leerzustand, wenn `anzahl === 0` (§8, Kap. 15.5).
   *
   * Gesetzt NUR an Rubriken, deren Null gesichert ist — «Verweise» und
   * «Rechner» stehen aus der Struktur des Artikels sofort fest. Die
   * shard-abhängigen Rubriken (Fassung, Entscheide, Materialien) bekommen
   * KEINEN: ihre Null heisst vor dem Eintreffen «noch nicht bekannt», und ein
   * Satz darüber wäre eine Behauptung über Daten, die unterwegs sind.
   *
   * DIE ZEILE HIER WERTET DAS FELD NICHT AUS — sie filtert `anzahl > 0`
   * unverändert heraus (Verhalten der Gesamtansicht byte-gleich, §6). Gelesen
   * wird es allein vom Dossier des Einzelmodus (`./ArtikelDossier.tsx`), das
   * genug Platz für einen Satz hat, wo die Zeile nur einen Chip hätte.
   */
  leer?: string;
  /** Was beim Aufklappen GENAU DIESER Rubrik erscheint. */
  inhalt: ReactNode;
  /** Hängt der Inhalt an einem nachzuladenden Shard? Dann fragt das Aufklappen
   *  danach (`onOeffnen`) und zeigt bis dahin das Skelett. */
  brauchtDaten?: boolean;
  /**
   * D35-F2 · Ein Sekundär-Griff am FUSS des aufgeklappten Blocks.
   *
   * Entscheid David 7.9.2026 zur Frage «aufklappen ODER ins Blatt öffnen»:
   * BEIDES. Die Rubrik verhält sich unverändert (aufklappen + Ladepfad
   * armieren, D30/D35-F1), und wer die Liste lieber neben dem Text hat,
   * bekommt sie über diesen Griff. Er steht INNERHALB des aufgeklappten
   * Blocks, nicht in der Zeile: in der Zeile wäre er ein zweiter Knopf pro
   * Rubrik im Ruhezustand — und die Zeile trägt schon vier Rubriken und vier
   * Aktionen.
   *
   * WER ihn baut, entscheidet `./ArtikelLeser.bezuegeFuss.tsx`; diese Datei
   * rendert nur (§3).
   */
  nebenGriff?: ReactNode;
}

/**
 * Die Funktionszeile am Artikelende.
 *
 * @param marken    Rubriken mit Zahl; Rubriken mit `anzahl === 0` fallen weg.
 * @param zitat     Normzitat für den Namen der Griffe (WCAG 4.1.2).
 * @param aktionen  Rechts stehende Artikel-Aktionen (`./ArtikelAktionen.tsx`).
 * @param onOeffnen Wird beim Aufklappen einer Rubrik gerufen, die Daten
 *                  braucht; armiert den bestehenden Ladepfad (s. u.).
 * @param laedt     Der Apparat ist unterwegs ⇒ Skelett statt Leere.
 */
export function Funktionszeile({ marken, zitat, aktionen, onOeffnen, laedt = false }: {
  marken: readonly BezugsMarke[];
  zitat: string;
  aktionen?: ReactNode;
  onOeffnen?: () => void;
  laedt?: boolean;
}) {
  // ── D35-F1 · DER ZUSTAND IST LOKAL, UND DAS IST DER PUNKT ─────────────────
  // R6b hatte den gemerkten Zustand bewusst NICHT reaktiv geführt: ein
  // geteilter Zustand müsste beim Klick auf EINE Zeile alle anderen mitziehen
  // — im OR 1686 Abonnenten und 1686 Neu-Renderings je Klick (§15). Diese
  // Rechnung gilt unverändert; die Antwort darauf ist jetzt nicht der Verzicht
  // auf React, sondern der Zuschnitt: der Zustand gehört GENAU EINEM Artikel
  // und lebt in seiner eigenen Zeile. Ein Klick rendert diesen einen Artikel
  // neu, keinen zweiten.
  //
  // W2·26/Z4 · AKKORDEON: der Zustand ist seither EIN Buchstabe oder `null`,
  // nicht mehr eine Menge. Das ist nicht nur weniger Zustand, es ist die Regel
  // selbst — «höchstens eine Rubrik offen» kann in dieser Form gar nicht
  // verletzt werden (§6.7-Denkart: lieber unmöglich als bewacht).
  const [offen, setOffen] = useState<BezugsMarke['reg'] | null>(null);
  // Z6 · «steht die Maus (oder der Fokus) an dieser Zeile?» — der einzige
  // Grund, warum diese Komponente überhaupt auf Hover reagiert. Auf Geräten
  // ohne Hover wird der Wert nie wahr und auch nie gebraucht (s. `zeigeAktionen`).
  const [nah, setNah] = useState(false);
  const blockId = useId();
  /** Die Griffe dieser Zeile, für die Fokus-Rückgabe bei Escape (Z4). */
  const griffe = useRef<Partial<Record<BezugsMarke['reg'], HTMLButtonElement | null>>>({});
  const sichtbar = marken.filter((m) => m.anzahl > 0);
  // ── D40 · DIE ZEILE HAT ZWEI HÄLFTEN ─────────────────────────────────────
  // «Fassung» ist die Auskunft über DIESEN Artikel; «Entscheide · Materialien ·
  // Verweise · Rechner» zeigen von ihm WEG. Die Trennung bleibt (die Fassung
  // steht vorn), das WORT dazwischen ist mit W2·26/Z1 gefallen — es ist
  // dieselbe Reihenfolge, nur ohne Überschrift.
  //
  // Es sind zwei `filter` und keine Sortier-Ordnung: die Reihenfolge INNERHALB
  // beider Hälften bleibt die des Aufrufers (`./ArtikelLeser.bezuegeFuss.tsx`,
  // §3 — diese Datei rendert, sie entscheidet nichts über den Bestand).
  const eigen = sichtbar.filter((m) => m.reg === 'f');
  const bezug = sichtbar.filter((m) => m.reg !== 'f');
  const offeneMarke = sichtbar.find((m) => m.reg === offen) ?? null;
  // Z6 · WANN DIE AKTIONEN IM DOM STEHEN. Drei Fälle, und jeder hat einen
  // Grund: ohne Hover-Gerät IMMER (sonst gäbe es sie dort nicht, D35-F1 (1));
  // bei Hover/Fokus an dieser Zeile (die Geste, mit der man hinfährt); und
  // solange eine Rubrik offen steht (wer liest, soll zitieren können, ohne die
  // Maus zu halten).
  const zeigeAktionen = OHNE_HOVER || nah || offen !== null;
  // Kein leerer Fuss ohne Deckung (§8): ohne Rubrik UND ohne Aktionen steht
  // hier nichts. Mit Aktionen steht die Zeile auch am Artikel ohne Bezüge —
  // «Zitat», «Link» und «Amtliche Fassung» gelten für jeden Artikel.
  if (sichtbar.length === 0 && !aktionen) return null;

  // ── D30 · DAS AUFKLAPPEN FRAGT NACH DEN DATEN ────────────────────────────
  // Befund D30, wörtlich: die Zeile «klappt auf, zeigt aber nur den
  // Rechnen-Block; die gezählten Entscheide (und Materialien) werden nicht
  // geladen/gerendert». `onOeffnen` ist die Frage danach — und sie geht an die
  // EINE Stelle, an der das Nachladen entschieden wird (`../v3/panelModell.ts`,
  // `weckeDaten`), nicht an einen zweiten Lader.
  // D35-F1: gefragt wird nur für Rubriken, die einen Shard BRAUCHEN. Verweise
  // und Rechner stehen aus der Struktur sofort da; für sie eine Ladung
  // anzustossen wäre Leitung ohne Gegenwert (§15).
  const schalte = (m: BezugsMarke) => {
    const jetzt = offen !== m.reg;
    setOffen(jetzt ? m.reg : null);
    if (jetzt && m.brauchtDaten) onOeffnen?.();
  };

  /** Der Griff EINER Rubrik. Lokale Funktion, kein Export: diese Datei darf nur
   *  Komponenten exportieren (Fast-Refresh-Regel, s. `./ArtikelLeser.kopfteile.tsx`),
   *  und zwei Aufrufstellen für dasselbe Markup wären zwei Anatomien (§5). */
  const griff = (m: BezugsMarke) => {
    const auf = offen === m.reg;
    const name = m.anzahl === 1 ? m.wort[0] : m.wort[1];
    // Z2 · ZUGEKLAPPT das Etikett (die Fassung liest «Gilt seit …»),
    // AUFGEKLAPPT immer die Zahl — dann ist die Liste der Gegenstand, und die
    // Zahl sagt, wie lang sie ist. Ohne Etikett bleibt alles wie bisher.
    // `\u00A0` (geschütztes Leerzeichen) statt eines gewöhnlichen: «11» und
    // «Entscheide» dürfen nicht umbrechen — das war seit D35-F1 das `&nbsp;`
    // im JSX und bleibt es, nur als Zeichen im String statt als Entität.
    const beschriftung = !auf && m.etikett ? m.etikett : `${m.anzahl}\u00A0${name}`;
    return (
      <button key={m.reg} type="button" className="lc-btn-mini lr7-bez-marke"
        ref={(el) => { griffe.current[m.reg] = el; }}
        data-reg={m.reg} aria-expanded={auf} aria-controls={auf ? blockId : undefined}
        // WCAG 4.1.2 · der Name nennt die Rubrik UND den Artikel: auf
        // einer Seite mit 1686 Artikeln ist «11 Entscheide» allein in der
        // Knopfliste eines Screenreaders nicht auffindbar. Den Zustand
        // trägt `aria-expanded`, nie das Wort (ARIA_ZUSTANDSNAME).
        // Z2 · die ZAHL steht auch dann im Namen, wenn die Zeile das Etikett
        // zeigt: «Gilt seit 1.1.2023» allein sagte nicht, dass sich dahinter
        // drei Änderungsstände auflisten lassen.
        aria-label={`${m.anzahl} ${name} zu ${zitat}`}
        title={m.titel}
        onClick={() => schalte(m)}>
        {beschriftung}
        <span aria-hidden className="lr7-bez-pfeil">›</span>
      </button>
    );
  };

  return (
    // `print:hidden`: im Ausdruck trägt der Artikelkopf den Randtitel, die
    // Funktionszeile ist Bedienung und gehört nicht aufs Papier.
    // D35-F2 · WELCHE Rubriken dieser Artikel überhaupt führt, als Buchstaben.
    // Der Artikel weiss das (er hat gerade gezählt), der Store weiss es nicht.
    // Die Angabe hatte bis W2·26 einen zweiten Leser — die Anschalt-Regel des
    // Wortes «Bezüge»; das Wort ist mit Z1 gefallen, das Attribut bleibt als
    // maschinenlesbarer Bestand für die Sonden (`e2e/w224-d35-f2-kopf`).
    <div className="lr7-bez print:hidden" data-bez-marken={sichtbar.map((m) => m.reg).join('')}
      // Z6 · Hover UND Fokus, beide an der Zeile: `onFocus`/`onBlur` blubbern in
      // React (anders als nativ) und wirken damit wie `:focus-within` — wer sich
      // mit der Tastatur auf einen Rubrik-Griff stellt, sieht die Aktionen
      // ebenso wie der, der mit der Maus hinfährt.
      // Auf Geräten ohne Hover sind die Aktionen ohnehin dauerhaft da;
      // dann kosten diese Handler nichts, weil `zeigeAktionen` sie nicht liest.
      onMouseEnter={() => setNah(true)} onMouseLeave={() => setNah(false)}
      onFocus={() => setNah(true)} onBlur={() => setNah(false)}
      // Z4 · Escape schliesst und gibt den Fokus an den Griff zurück. Der
      // Handler sitzt an der WURZEL, nicht am Block: nur so trifft er auch die
      // Taste, die im aufgeklappten Block gedrückt wird (Fokus wandert dorthin,
      // sobald der Leser weitertabt).
      onKeyDown={(ev) => {
        if (ev.key !== 'Escape' || offen === null) return;
        ev.stopPropagation();
        const zurueck = griffe.current[offen];
        setOffen(null);
        zurueck?.focus();
      }}>
      <div className="lr7-bez-zeile">
        {eigen.map(griff)}
        {bezug.map(griff)}
        {zeigeAktionen && aktionen}
      </div>
      {offeneMarke && (
        <div className="lr7-bez-inhalt">
          <div id={blockId} className="lr7-bez-block" data-reg={offeneMarke.reg}>
            {/* Das Skelett steht NUR in der Rubrik, die wartet — Verweise und
                Rechner brauchen keinen Shard und stehen sofort. Es reserviert
                eine Zeilenhöhe (`min-h-bez-skelett`, tailwind.config.js), damit der
                eintreffende Apparat reservierten Platz FÜLLT statt den Artikel
                darunter zu schieben; die Reservierung ist ein BODEN, nie mehr
                als der echte Inhalt — sonst schrumpfte der Block beim Laden
                und der Sprung wäre nur verlegt (Sonde `leser-d35-f1`). */}
            {offeneMarke.brauchtDaten && laedt && !offeneMarke.inhalt
              ? (
                <span className="lr7-bez-skelett min-h-bez-skelett">
                  <span className="lc-overline mr-1"><span className="lc-punkt" aria-hidden />{offeneMarke.wort[1]}</span>
                  <span className="text-body-s text-ink-500">lädt …</span>
                </span>
              )
              : offeneMarke.inhalt}
            {offeneMarke.nebenGriff}
          </div>
        </div>
      )}
    </div>
  );
}
