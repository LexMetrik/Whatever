// ═══ W2·19-GLIEDERUNG · S8 — Erlass-lokale Suche (pure Ableitung) ════════════
//
// Bau-Spec: fahrplaene/FAHRPLAN-W2-19-SEITENLEISTE.md §4 (4.1 Datenweg, 4.2
// Ranking, 4.3 Trefferliste, 4.4 findbar/malbar-Vertrag, 4.5 Highlighting),
// §9-S8. Davids Entscheid (c) vom 8.8.2026: Trefferliste MIT Textausschnitten in
// der Seitenleiste, die Lesespalte bleibt vollständig und springt.
//
// WAS DIESES MODUL IST. Eine reine, UI-freie Ableitung aus dem bereits geladenen
// Snapshot + Struktur-Sidecar. Kein React, kein DOM, kein Netz, kein
// `Date.now()` — gleiche Eingabe, gleiche Ausgabe (§2). Es liegt in
// `src/pages/`, weil es DARSTELLUNG ableitet (welche Artikel eine Trefferliste
// zeigt und in welcher Reihenfolge) und keine Rechtslogik trägt (§3).
//
// WARUM REIN LOKAL UND NICHT ÜBER DEN SUCH-INDEX (Spec §4.1). `public/such-
// index/artikel.json` ist 48.1 MB roh; das Perf-Tor misst gzip ≈ 9.96 MB gegen
// ein Budget von 10'400 KB (`scripts/check-perf-budget.ts:152`). Ihn für die
// In-Gesetz-Suche zu laden hiesse, für einen erlass-lokalen Handgriff den
// ganzen Korpus zu ziehen. Alles, was hier gebraucht wird, liegt bereits im
// Speicher: der Snapshot (Wortlaut, Label, Tabellen, `grundlage`) und das
// Sidecar (Marginalien, Gliederungspfad, Fussnoten).
//
// WAS DAMIT NEU FINDBAR WIRD. Die alte Filterregel (`passtAufSuche`, helpers)
// las AUSSCHLIESSLICH `artikelLabel` und `bloecke[].text`/`items[].text`. Vier
// Feldklassen waren damit unsichtbar, obwohl sie im Reader gerendert werden
// oder amtlicher Inhalt sind: Randtitel/Marginalien, Gliederungstitel,
// Tabellen + Bild-Alt + `grundlage`, Fussnoten. Genau sie kommen hier dazu.
//
// ─── §7-ABWEICHUNG VON DER SPEC, offengelegt statt still umgesetzt ───────────
// Spec §4.2 schreibt: «`sucherTerme()`-Normalisierung und `findeVorkommen()`
// werden wiederverwendet — keine zweite Tokenisierung (§5)». `findeVorkommen`
// wird wiederverwendet; `sucherTerme()` (src/lib/suche/artikelRanking.ts:103)
// wird BEWUSST NICHT benutzt. Grund, empirisch am Code geprüft: `sucherTerme`
// ist der Tokenizer des GLOBALEN Index — er wirft Terme unter zwei Zeichen weg
// und expandiert die Query um Vokabular-SYNONYME. Die In-Gesetz-Suche ist eine
// akzenttreue TEILSTRING-Suche, die ab dem ersten Zeichen greift, und genau
// diese Menge malt die Hervorhebung (`suchHighlight.ts`). Beide Semantiken zu
// mischen hiesse: der Zähler meldet Artikel, in denen der getippte Begriff
// buchstäblich nicht vorkommt (Synonym-Recall), und die Markierung malt dort
// nichts — die Anzeige löge über den Zustand (§8), und «EINE Treffer-Semantik»
// (§5) wäre gebrochen. Die zweite Tokenisierung, die §5 verbietet, entsteht
// hier auch nicht: es gibt gar keine — es wird ausschliesslich `findeVorkommen`
// gezählt.

import { findeVorkommen } from './suchHighlight';
import { ohneMarkup } from './helpers';
import { randtitelKnoten } from '../../lib/normtext/darstellung';
// W2·27 (Entscheid David 14.9.2026, Randtitel-Doppelmodell): die
// Sachtitel-Fallback-Kette (`marginalie` vor `titel`) lebt nur noch hier —
// vorher zweite Inline-Kopie derselben Regel wie im Gliederungs-Baum (§5).
import { artikelRandtitel } from './gliederungsArtikel';
import type { StrukturMap } from '../../lib/normtext/browse';
import type { NormSnapshot } from '../../lib/normtext/typen';

// ─── Felder in Index-Semantik (Spec §4.1) ───────────────────────────────────
/**
 * Die sechs Feldklassen des Generators (`scripts/such-index-generieren.ts`):
 * `t` Fliesstext+Items · `m` primäre Marginalie · `n` nachrangige Marginalie ·
 * `g` Gliederungspfad · `tb` Tabellen+Bild-Alt+`grundlage` · `f` Fussnoten.
 * Die Namen sind bewusst identisch — sie sind die semantische Brücke zum
 * Generator, der die Gewichtung `t > m > n > g > tb > f` konfiguriert.
 */
export type SuchFeld = 't' | 'm' | 'n' | 'g' | 'tb' | 'f';

/**
 * Feldgewicht in der Reihenfolge `t > m > n > g > tb > f` (Spec §4.2).
 *
 * SEMANTISCHE QUELLE ist die FlexSearch-Konfiguration von
 * `scripts/such-index-generieren.ts:145–233` — dort und nur dort lebt die
 * Gewichtung für den globalen Index. Sie wird hier NICHT importiert (das Script
 * läuft im Build, nicht im Browser), sondern als dieselbe Ordnung nachgebildet;
 * die Zahlen sind reine Ordnungsränge ohne eigene Bedeutung.
 *
 * WARUM NICHT `rangiere()` AUS `artikelRanking.ts` (Spec §4.2, [W:jurist]):
 * `rangiere` sortiert korpusweit — Kernerlass-Rang, Ebene (Bund vor Kanton),
 * dann Artikelnummer. Erlass-lokal sind Kernerlass und Ebene für ALLE
 * Kandidaten gleich; übrig bliebe «topischer Treffer, dann Artikelnummer». Die
 * Feldgewichtung, wegen der man `rangiere` überhaupt nähme, steckt gar nicht
 * darin. Eine eigene, hier vollständig sichtbare Ordnung ist damit nicht
 * Duplizierung, sondern die ehrliche Fassung.
 */
export const FELD_GEWICHT: Record<SuchFeld, number> = { t: 6, m: 5, n: 4, g: 3, tb: 2, f: 1 };

/**
 * Herkunft einer Fundstelle — feiner als das Feld, weil das Feld `tb` drei
 * verschiedene Dinge bündelt (Tabelle, Bild-Alt, Grundlage) und der Badge dem
 * Leser sagen soll, WARUM der Artikel trifft (Spec §4.3/§8). Das Feld steuert
 * die Sortierung, die Quelle den Badge.
 */
export type SuchQuelle =
  | 'Fliesstext' | 'Bestimmung' | 'Randtitel' | 'Überschrift'
  | 'Tabelle' | 'Bild' | 'Grundlage' | 'Fussnote';

/**
 * Wird dieser Textbaustein im Artikel der LESESPALTE gerendert — also: kann die
 * Fundstelle überhaupt gemalt werden (Spec §4.4)?
 *
 *  · `immer`     — der Baustein steht im `<article id="art-…">` und ist sichtbar.
 *  · `nie`       — er ist amtlicher Inhalt, erscheint aber nicht im Artikel
 *                  (Gliederungspfad: er steht als Sektionskopf ÜBER den
 *                  Artikeln; Bild-Alt: es ist ein Attribut, kein Textknoten;
 *                  nachrangige Randtitel: sie sind seit 6b eigene
 *                  Gliederungsknoten und werden am Artikel nicht wiederholt).
 *  · `aenderung` — eine als `kl:'A'` klassifizierte ÄNDERUNGS-Fussnote: sichtbar
 *                  genau in der Stellung «Fussnoten» der Änderungs-Wahl
 *                  (`html[data-vermerke="fassung"|"aus"]` ⇒ `display:none`,
 *                  index.css).
 *
 * ── D35-F3 (7.9.2026) · WARUM DER WERT `fussnoten` NICHT MEHR STIMMT ─────────
 * Bis hierher hiess der dritte Wert `fussnoten` und meinte «hängt am
 * Fussnoten-Schalter» — der schaltete den GANZEN Apparat, also trugen ihn alle
 * Fussnoten-Bausteine. Diesen Schalter gibt es nicht mehr (Entscheid David,
 * verlustfrei): eine Fussnote der Klasse V/G/Z/U und jede ohne Klasse ist in
 * ALLEN drei Stellungen sichtbar und damit `immer` malbar. Nur `kl:'A'` kann
 * überhaupt noch verschwinden. Den alten Wert stehen zu lassen, hätte den
 * Zusatz «(ausgeblendet)» an 96 ZPO-Verweis-Fussnoten gehängt, die dastehen —
 * eine Badge, die über den Zustand lügt (§8), also genau der Fehler, den die
 * Malbarkeit verhindern soll.
 *
 * Das ist die Zähl-Wahrheit aus Spec §4.4: der Zähler ist datenseitig und
 * unabhängig von Ansicht-Schaltern; die DOM-Hervorhebung malt nur, was malbar
 * ist. «Gemalte ≤ gezählte» ist damit KONSTRUKTIV wahr, nicht behauptet.
 */
export type Malbarkeit = 'immer' | 'nie' | 'aenderung';

interface Segment {
  feld: SuchFeld;
  quelle: SuchQuelle;
  malbar: Malbarkeit;
  text: string;
}

/** Ein durchsuchbarer Artikel-Record. */
export interface SuchArtikel {
  token: string;
  /** Amtliches Label («Art. 12», «§ 4», «Anhang 1»). */
  label: string;
  /** Dokument-Position (Index im Snapshot) — der letzte Tie-Break der Sortierung. */
  pos: number;
  /** Sachüberschrift für die Trefferzeile; `null`, wenn der Artikel keine trägt (§8). */
  randtitel: string | null;
  /** Oberster Gliederungstitel — Zwischenkopf der Trefferliste (Spec §4.3). */
  gruppe: string | null;
  segmente: Segment[];
}

export interface LeserSuchIndex {
  /** Erlass-Schlüssel — die Cache-Identität (Spec §4.1, EIN Eintrag je Pane). */
  key: string;
  artikel: SuchArtikel[];
}

// ─── H2 · Suchbereich (FAHRPLAN-LESER-V3 Kap. 4b, Pos. 5) ───────────────────
/**
 * Welcher Teil des Erlasses durchsucht wird. Die vier Werte sind eine
 * GRUPPIERUNG der sechs Feldklassen oben, keine zweite Feldeinteilung (§5):
 *
 *  · `alles`     — alle sechs Felder (Vorgabe, entspricht dem Verhalten vor H2)
 *  · `titel`     — `m` + `n` + `g`: primäre und nachrangige Randtitel sowie der
 *                  Gliederungspfad. Für den Juristen ist das «wie heisst die
 *                  Bestimmung», nicht «was steht darin».
 *  · `text`      — `t` + `tb`: Fliesstext/Aufzählungen samt Tabellen, Bild-Alt
 *                  und `grundlage`. Alles, was zum Wortlaut selbst gehört.
 *  · `fussnoten` — `f`: der amtliche Fussnoten-Apparat.
 *
 * WAS DER BEREICH STEUERT UND WAS NICHT (§8, ehrlich statt bequem). Er steuert
 * die TREFFERLISTE, die Zähler und die ↑↓-Folge — also alles, was aus den Daten
 * kommt. Er steuert NICHT die Hervorhebung im Wortlaut: `sammleTrefferRanges`
 * malt jedes Vorkommen des Begriffs im sichtbaren Text, und das bleibt so. Beide
 * Zusagen sind für sich wahr und beantworten verschiedene Fragen («welche
 * Stellen führe ich auf» gegen «wo steht das Wort»); sie zu vermengen hiesse,
 * dem DOM-Walker eine Feldkenntnis anzudichten, die er nicht hat. Der Fahrplan
 * führt das als bewusste Grenze, nicht als offenen Rest.
 */
export type SuchBereich = 'alles' | 'titel' | 'text' | 'fussnoten';

/** Feldklassen je Bereich — die EINE Zuordnung, hier und nirgends sonst. */
const BEREICH_FELDER: Record<SuchBereich, ReadonlySet<SuchFeld>> = {
  alles: new Set<SuchFeld>(['t', 'm', 'n', 'g', 'tb', 'f']),
  titel: new Set<SuchFeld>(['m', 'n', 'g']),
  text: new Set<SuchFeld>(['t', 'tb']),
  fussnoten: new Set<SuchFeld>(['f']),
};

/** Gehört dieses Feld zum gewählten Bereich? */
export function imBereich(feld: SuchFeld, bereich: SuchBereich): boolean {
  return BEREICH_FELDER[bereich].has(feld);
}

// ─── Index-Aufbau ────────────────────────────────────────────────────────────

/** Nicht-leerer, markup-freier Text — leere Bausteine kosten sonst Schleifenzeit. */
function schiebe(ziel: Segment[], feld: SuchFeld, quelle: SuchQuelle, malbar: Malbarkeit, roh: string | undefined | null): void {
  if (!roh) return;
  // Fussnoten-Texte tragen amtliche Auszeichnung («SR <b>281.1</b>», G15) —
  // ungestrippt fände eine Suche nach «b» die Tags statt des Wortlauts, und der
  // Ausschnitt zeigte rohe spitze Klammern (§8). `ohneMarkup` ist dieselbe
  // Regel, die auch der `title`-Pfad der Fussnoten benutzt (§5).
  const text = ohneMarkup(roh).trim();
  if (text === '') return;
  ziel.push({ feld, quelle, malbar, text });
}

/**
 * Baut die Feld-Records eines Erlasses. Rein und deterministisch (§2); die
 * Reihenfolge der Segmente je Artikel folgt der DOKUMENT-Reihenfolge des
 * gerenderten Artikels (Randtitel → Label → Grundlage → Wortlaut → Tabellen →
 * Fussnoten), damit die n-te datenseitige Fundstelle eines Artikels im
 * Regelfall auch die n-te gemalte ist (Spec §4.5, Sprung-Zuordnung).
 *
 * KOSTEN, weil sie in §15 zählen: der Aufbau läuft EINMAL je Erlass und Pane,
 * beim ERSTEN Tastendruck (lazy, s. `inhalt-suchtreffer.tsx`) — nicht beim
 * Laden des Erlasses. Er kopiert keine Strings, sondern hält Referenzen auf die
 * ohnehin geladenen Snapshot-/Sidecar-Felder; nur markup-tragende Fussnoten
 * erzeugen eine gestrippte Kopie.
 */
export function baueLeserSuchIndex(
  key: string,
  eintraege: readonly NormSnapshot[],
  struktur: StrukturMap | null,
): LeserSuchIndex {
  const artikel: SuchArtikel[] = eintraege.map((e, pos) => {
    const st = struktur?.[e.artikel];
    const marginalie = st?.marginalie ?? [];
    // `blatt` ist die artikel-EIGENE Sachüberschrift NUR dann, wenn die unterste
    // Stufe keinen Gliederungs-Aufzähler trägt — und genau dieses Blatt rendert
    // die Lesespalte am Artikel (`margAnzeige`, inhalt-ableitungen). Es
    // entscheidet hier deshalb die MALBARKEIT, nicht die Feldklasse.
    const { blatt } = randtitelKnoten(marginalie);
    // N1: fehlt eine Sidecar-Marginalie, trägt der Snapshot den amtlichen
    // Randtitel selbst (`titel`, LexWork article_title) — dieselbe Zwei-Quellen-
    // Regel wie `hatRandtitel` im Gliederungs-Modell (§5). Für die ANZEIGE der
    // Trefferzeile zählt die reine Sachüberschrift (Aufzähler abgestreift),
    // sonst hiesse die halbe VwVG-Trefferliste «1.» und «II.». `artikelRandtitel`
    // ist die EINE Stelle für diese Regel (W2·27, vorher zweite Inline-Kopie).
    const sachtitel = artikelRandtitel(e, struktur);
    const gliederung = st?.gliederung ?? [];

    const segmente: Segment[] = [];
    // 1 · Randtitel-Kette. Die Feldklassen folgen der Generator-Semantik
    //     (`scripts/such-index-generieren.ts:219–221`): `m` = die OBERSTE
    //     Marginalie-Stufe (Hauptthema), `n` = alle nachrangigen. Nicht dem
    //     Blatt/Ahnen-Schnitt der Darstellung — dieser Schnitt entscheidet nur,
    //     ob die Stufe am Artikel überhaupt gemalt wird (§5: EINE Semantik je
    //     Frage, nicht eine Semantik für beide Fragen).
    marginalie.forEach((stufe, i) => {
      schiebe(segmente, i === 0 ? 'm' : 'n', 'Randtitel',
        blatt !== null && stufe === blatt ? 'immer' : 'nie', stufe);
    });
    // Kantons-Snapshots ohne Sidecar-Marginalie: `titel` ist der amtliche
    // Randtitel und wird am Artikel gerendert (ArtikelLeser-Fallback). `sachtitel`
    // ist hier bereits genau dieser Wert (marginalie.length === 0 ⇒
    // `artikelRandtitel` reduziert sich auf den `titel`-Zweig) — zweite
    // Inline-Kopie entfernt (W2·27), keine neue Berechnung nötig.
    if (marginalie.length === 0) schiebe(segmente, 'm', 'Randtitel', 'immer', sachtitel);
    // 2 · Die Bestimmungs-Bezeichnung selbst. Sie steht im Artikelkopf und war
    //     schon in der alten Filterregel durchsuchbar («Art. 41»); sie zählt
    //     zum Feld `g`, weil sie eine Überschrift ist und kein Wortlaut.
    schiebe(segmente, 'g', 'Bestimmung', 'immer', e.artikelLabel);
    // 3 · Gliederungspfad: amtlich, aber am Artikel nie wiederholt.
    for (const g of gliederung) schiebe(segmente, 'g', 'Überschrift', 'nie', g.label);
    // 4 · Delegationsnorm-Grundlage (G23) — dezente Zeile unter dem Randtitel.
    schiebe(segmente, 'tb', 'Grundlage', 'immer', e.grundlage);
    // 5 · Wortlaut + Aufzählungspunkte, dann Tabellen und Bild-Alt desselben
    //     Blocks (so bleibt die Dokument-Reihenfolge erhalten).
    for (const b of e.bloecke) {
      // Absatz- und lit./Ziff.-MARKEN zählen zum Fliesstext: sie sind amtlicher
      // Bestandteil der Bestimmung («Abs. 2», «lit. a») und werden als hängende
      // Marke gerendert. Ohne sie zählte eine Ziffern-Suche weniger, als die
      // Lesespalte malt — der §4.4-Vertrag «gemalte ≤ gezählte» wäre für
      // genau diese Suchen gebrochen (am BGFA vor dieser Zeile gemessen:
      // «2» → 164 gezählt gegen 184 gemalt).
      schiebe(segmente, 't', 'Fliesstext', 'immer', b.absatz);
      schiebe(segmente, 't', 'Fliesstext', 'immer', b.text);
      for (const it of b.items ?? []) {
        schiebe(segmente, 't', 'Fliesstext', 'immer', it.marke);
        schiebe(segmente, 't', 'Fliesstext', 'immer', it.text);
      }
      for (const z of b.tabelle ?? []) {
        schiebe(segmente, 'tb', 'Tabelle', 'immer', z.beschreibung);
        schiebe(segmente, 'tb', 'Tabelle', 'immer', z.betrag);
      }
      const ms = b.mehrspaltig;
      if (ms) {
        for (const sp of ms.spalten ?? []) schiebe(segmente, 'tb', 'Tabelle', 'immer', sp.titel);
        for (const k of ms.kopf ?? []) schiebe(segmente, 'tb', 'Tabelle', 'immer', k);
        for (const zeile of ms.zeilen) for (const z of zeile) schiebe(segmente, 'tb', 'Tabelle', 'immer', z);
      }
      // Bild-/Kachel-Blöcke: der Alt-Text ist amtlicher Inhalt (Formeln,
      // Signaltafeln) und damit findbar — malbar ist er NIE, weil er als
      // Attribut und nicht als Textknoten im DOM steht. Genau dafür gibt es
      // den Badge (§8): der Leser sieht, warum der Artikel trifft, obwohl im
      // Wortlaut nichts leuchtet.
      const bb = b as NormSnapshot['bloecke'][number] & {
        bild?: { alt?: string };
        bildKacheln?: Array<{ bild?: { alt?: string }; nummer?: string; name?: string }>;
      };
      schiebe(segmente, 'tb', 'Bild', 'nie', bb.bild?.alt);
      for (const k of bb.bildKacheln ?? []) {
        schiebe(segmente, 'tb', 'Bild', 'nie', k.bild?.alt);
        schiebe(segmente, 'tb', 'Bild', 'nie', k.name);
      }
    }
    // 6 · Fussnoten-Apparat. Die NUMMER gehört mit in den Baustein: sie wird
    //     als `num`-Span vor dem Text gerendert, also ist sie gemalt — stünde
    //     sie nicht im Index, könnte die Markierung mehr zeigen als der Zähler
    //     zählt (§4.4).
    //     D35-F3: die MALBARKEIT hängt an der build-seitigen Klasse. Fehlt `kl`
    //     (alle Kanton-Sidecars), gilt die Fussnote als unklassifiziert und ist
    //     in jeder Stellung sichtbar — dieselbe konservative Richtung wie im
    //     Korpus selbst (`lib/normtext/browse.ts`: «eine fehlende Klasse blendet
    //     nie etwas aus»).
    for (const f of st?.fussnoten ?? []) {
      schiebe(segmente, 'f', 'Fussnote', f.kl === 'A' ? 'aenderung' : 'immer',
        f.nr ? `${f.nr} ${f.text}` : f.text);
    }

    return {
      token: e.artikel,
      label: e.artikelLabel,
      pos,
      randtitel: sachtitel,
      gruppe: gliederung.length > 0 ? gliederung[0].label : null,
      segmente,
    };
  });

  return { key, artikel };
}

// ─── Treffer ─────────────────────────────────────────────────────────────────

export interface TrefferFeld {
  feld: SuchFeld;
  quelle: SuchQuelle;
  malbar: Malbarkeit;
  anzahl: number;
}

export interface Ausschnitt {
  /** Text vor der Fundstelle (ggf. mit führendem «…»). */
  vor: string;
  /** Der Begriff, wie er im amtlichen Text steht (Original-Schreibweise). */
  treffer: string;
  /** Text nach der Fundstelle (ggf. mit «…»). */
  nach: string;
  quelle: SuchQuelle;
}

export interface LeserTreffer {
  token: string;
  label: string;
  randtitel: string | null;
  gruppe: string | null;
  pos: number;
  /** DATENSEITIGE Fundstellen über ALLE Felder — die eine Wahrheit (§4.4 Ziff. 1). */
  fundstellen: number;
  /** Höchstes getroffenes Feldgewicht (erstes Sortierkriterium, §4.2). */
  topFeld: SuchFeld;
  /** Getroffene Felder in Feldgewicht-Reihenfolge, je mit Anzahl und Malbarkeit. */
  felder: TrefferFeld[];
  /** B5: Malbarkeit JE FUNDSTELLE, in Segment- und damit Dokument-Reihenfolge —
   *  Länge == `fundstellen`. `felder` taugt dafür nicht: es ist nach Feldgewicht
   *  sortiert und je Quelle aggregiert und verliert damit genau die Reihenfolge,
   *  in der `sammleTrefferRanges` die gemalten Stellen im DOM aufsammelt. */
  malbarkeiten: Malbarkeit[];
  /** Textausschnitt um die erste Fundstelle (Entscheid c). `null` nie im Normalfall. */
  ausschnitt: Ausschnitt | null;
}

/** Ausschnitt-Länge (Spec §4.3: «Snippet ≤ 120 Zeichen um die erste Fundstelle»). */
export const AUSSCHNITT_MAX = 120;

/**
 * Ä29 (H2b-Nachzug) — SCHNITT AN DER WORTGRENZE.
 *
 * BEFUND (Ästhetik-Prüfung 17.8.2026): Kontext-Ausschnitte begannen mitten im
 * Wort — «… on erhebt» statt «… Behörde erhebt». Ein angeschnittener Wortrest
 * liest sich wie ein Tippfehler und kostet genau den Kontext, für den der
 * Ausschnitt da ist (§8).
 *
 * Die beiden Funktionen rücken die Schnittkante auf die nächste Wortgrenze, und
 * zwar **nur nach innen**: der Ausschnitt wird dadurch höchstens kürzer, nie
 * länger als `AUSSCHNITT_MAX`. Ist in der Nähe keine Grenze (eine lange
 * Zahlen-/Zeichenkette ohne Leerraum), bleibt der harte Schnitt — ein Ausschnitt,
 * der auf eine Wortgrenze WARTET, verschluckte sonst die Fundstelle selbst.
 * `GRENZ_FENSTER` ist darum klein: es soll ein angeschnittenes Wort verwerfen,
 * nicht den Kontext neu zuschneiden.
 *
 * Rein und deterministisch (§2). GETEILTE WIRKUNG: `baueAusschnitt` speist die
 * Trefferlisten BEIDER Hüllen — der Befund ist heute live, der Fix wirkt in
 * beiden (deklariert wie Ä8).
 */
const GRENZ_FENSTER = 16;

function wortAnfangAb(text: string, roh: number, schranke: number): number {
  if (roh <= 0) return 0;
  if (/\s/.test(text[roh - 1] ?? '')) return roh; // Kante steht schon am Trenner
  for (let i = roh + 1; i <= Math.min(schranke, roh + GRENZ_FENSTER); i += 1) {
    if (/\s/.test(text[i - 1] ?? '')) return i;
  }
  return roh;
}

function wortEndeBis(text: string, roh: number, schranke: number): number {
  if (roh >= text.length) return text.length;
  if (/\s/.test(text[roh] ?? '')) return roh;
  for (let i = roh - 1; i >= Math.max(schranke, roh - GRENZ_FENSTER); i -= 1) {
    if (/\s/.test(text[i] ?? '')) return i;
  }
  return roh;
}

function baueAusschnitt(text: string, von: number, bis: number, quelle: SuchQuelle): Ausschnitt {
  const treffer = text.slice(von, bis);
  const rest = Math.max(0, AUSSCHNITT_MAX - treffer.length);
  // Etwa ein Drittel des Kontexts vor, zwei Drittel nach der Fundstelle: was
  // NACH dem Begriff steht, trägt die Aussage meist weiter.
  const vorLaenge = Math.floor(rest / 3);
  const nachLaenge = rest - vorLaenge;
  // Ä29: erst hart rechnen, dann nach innen auf die Wortgrenze rücken. Die
  // Fundstelle (`von`/`bis`) ist die Schranke — sie wird nie angetastet.
  const abVor = wortAnfangAb(text, Math.max(0, von - vorLaenge), von);
  const bisNach = wortEndeBis(text, Math.min(text.length, bis + nachLaenge), bis);
  return {
    vor: (abVor > 0 ? '… ' : '') + text.slice(abVor, von),
    treffer,
    nach: text.slice(bis, bisNach) + (bisNach < text.length ? ' …' : ''),
    quelle,
  };
}

/**
 * Erlass-lokale Suche über alle Felder.
 *
 * SORTIERUNG — **Dokument-Reihenfolge**, vollständig hier und nirgends sonst:
 * aufsteigend nach `pos`, der Artikel-Position im Erlass. EINE Stufe, total und
 * deterministisch (§2): `pos` ist der Laufindex über `eintraege` (Aufbau des
 * Index oben, Z. 167) und darum je Artikel eindeutig — es gibt keinen
 * Gleichstand, den eine zweite Stufe brechen könnte.
 *
 * ─── S4 · DEKLARIERTE VERHALTENSÄNDERUNG (FAHRPLAN-LESER-V3 Kap. 7, Strang S) ─
 *
 * Bis hierher galt eine dreistufige RANGFOLGE: (1) höchstes getroffenes
 * Feldgewicht `t > m > n > g > tb > f`, (2) Fundstellenzahl absteigend, (3)
 * Dokument-Position. Die Liste war damit nach Relevanz geordnet — und das ist
 * für ein VERZEICHNIS NEBEN dem vollständigen Wortlaut die falsche Ordnung.
 * Drei Folgen, alle drei am Bestand belegt:
 *
 *  ① Das Verzeichnis konnte seinem Text nicht folgen. Seit S8 bleibt die
 *    Lesespalte vollständig; die Trefferliste steht daneben und soll sagen, wo
 *    im Erlass die Stellen liegen. In der Rangfolge stand OR Art. 336c
 *    irgendwo zwischen Art. 41 und Art. 962 — die Liste hatte keine Richtung,
 *    der man mit dem Finger folgen kann.
 *  ② Die Gruppenköpfe logen der Form nach. Die Liste setzt einen Zwischenkopf
 *    bei jedem Wechsel des Top-Kapitels; in der Rangfolge sprang das Kapitel
 *    hin und her, dasselbe Kapitel erschien mehrfach. Erst in
 *    Dokument-Reihenfolge ist ein Gruppenkopf das, wonach er aussieht: die
 *    einmalige Überschrift über einem zusammenhängenden Abschnitt.
 *  ③ Die ↑↓-Navigation lief gegen die Leserichtung. `fundstellenFolge` baut die
 *    flache Folge in LISTEN-Reihenfolge; «nächste Fundstelle» sprang darum im
 *    Erlass vor und zurück. Jetzt heisst «nächste» das, was der Jurist erwartet:
 *    die nächste weiter unten im Gesetz.
 *
 * WAS DIE RANGFOLGE GELEISTET HAT, GEHT NICHT VERLOREN — es wechselt den Ort:
 * das getroffene Feld steht weiter an jedem Treffer (`topFeld`, `felder`) und
 * wird als Herkunfts-Badge SICHTBAR angezeigt (`badgesFuer`), statt sich
 * unsichtbar in einer Listenposition auszudrücken; der Ausschnitt kommt
 * unverändert aus dem stärksten getroffenen Feld. Wer nach Relevanz sucht statt
 * zu blättern, ist beim GLOBALEN Suchindex richtig — der rangiert weiterhin
 * (`src/lib/suche/artikelRanking.ts`), und genau diese Arbeitsteilung war der
 * Grund, hier nie `sucherTerme()` zu übernehmen (§7-Abweichung oben).
 *
 * B11-ERBE. Der frühere Kommentar hielt fest, dass die alte Stufe 3 von keinem
 * Black-Box-Test getötet werden kann, weil die Artikel ohnehin in
 * Dokument-Reihenfolge aus dem Index kommen. Das gilt jetzt umgekehrt und
 * schärfer: die Ordnung IST die Index-Ordnung, und der `sort` nagelt sie
 * unabhängig von einer Engine-Zusage zur Sortierstabilität fest (bewusste
 * §2-Redundanz). Die beiden alten Stufen sind GESTRICHEN, nicht auskommentiert
 * und nicht als Rückfall behalten: bei eindeutigem `pos` könnte kein Test sie je
 * erreichen, und was nicht scheitern kann, wird gestrichen statt bewacht
 * (§17-Gegengewicht).
 */
export function sucheImErlass(
  index: LeserSuchIndex | null,
  begriff: string,
  bereich: SuchBereich = 'alles',
): LeserTreffer[] {
  const b = begriff.trim();
  if (!index || b === '') return [];

  const treffer: LeserTreffer[] = [];
  for (const a of index.artikel) {
    // Feld → (Quelle → Anzahl). Zwei Ebenen, weil `tb` mehrere Quellen bündelt
    // und der Badge die Quelle nennt, die Sortierung aber das Feld braucht.
    const proQuelle = new Map<string, TrefferFeld>();
    let gesamt = 0;
    // B5: eine Marke JE Fundstelle, in Segment-Reihenfolge — das ist zugleich
    // die Dokument-Reihenfolge (s. Aufbau der Segmente oben).
    const malbarkeiten: Malbarkeit[] = [];
    let ausschnitt: Ausschnitt | null = null;
    let ausschnittGewicht = -1;

    for (const seg of a.segmente) {
      // H2: der Bereich filtert VOR dem Zählen, nicht danach. Nur so bleiben
      // `fundstellen`, `malbarkeiten` und damit die ganze ↑↓-Folge auf
      // derselben Menge — ein Nachfilter über `felder` verlöre die Zuordnung
      // Fundstelle → Rang, an der schon B5 einmal gebrochen ist.
      if (!imBereich(seg.feld, bereich)) continue;
      const stellen = findeVorkommen(seg.text, b);
      if (stellen.length === 0) continue;
      gesamt += stellen.length;
      for (let i = 0; i < stellen.length; i++) malbarkeiten.push(seg.malbar);
      const schluessel = `${seg.feld}|${seg.quelle}`;
      const vorhanden = proQuelle.get(schluessel);
      if (vorhanden) vorhanden.anzahl += stellen.length;
      else proQuelle.set(schluessel, { feld: seg.feld, quelle: seg.quelle, malbar: seg.malbar, anzahl: stellen.length });
      // Der Ausschnitt kommt aus dem STÄRKSTEN getroffenen Feld, nicht aus dem
      // ersten: sonst zeigte ein Artikel, der im Wortlaut zwanzigmal trifft,
      // seinen Gliederungstitel als Beleg. Bei Gleichstand gewinnt das frühere
      // Segment (Dokument-Reihenfolge).
      if (FELD_GEWICHT[seg.feld] > ausschnittGewicht) {
        ausschnittGewicht = FELD_GEWICHT[seg.feld];
        ausschnitt = baueAusschnitt(seg.text, stellen[0][0], stellen[0][1], seg.quelle);
      }
    }
    if (gesamt === 0) continue;

    const felder = [...proQuelle.values()].sort((x, y) => FELD_GEWICHT[y.feld] - FELD_GEWICHT[x.feld]);
    treffer.push({
      token: a.token, label: a.label, randtitel: a.randtitel, gruppe: a.gruppe, pos: a.pos,
      fundstellen: gesamt, topFeld: felder[0].feld, felder, malbarkeiten, ausschnitt,
    });
  }

  treffer.sort((x, y) => x.pos - y.pos);
  return treffer;
}

/**
 * Eine einzelne Fundstelle EINES Artikels, fertig für die Anzeige (H2).
 *
 * `rang` ist derselbe 0-basierte Rang, den `fundstellenFolge` je Artikel vergibt
 * — die Zeile in der Trefferliste und der Schritt der ↑↓-Navigation sind damit
 * dieselbe Sache und nicht zwei Zählungen nebeneinander (§5).
 */
export interface ArtikelFundstelle {
  rang: number;
  feld: SuchFeld;
  quelle: SuchQuelle;
  malbar: Malbarkeit;
  ausschnitt: Ausschnitt;
}

/**
 * Die Fundstellen EINES Artikels mit je eigenem Kontext-Ausschnitt (H2).
 *
 * WARUM EINZELN UND NICHT IN `sucheImErlass`. Ein Ausschnitt je Fundstelle ist
 * genau das, was die V3-Trefferliste unter dem Artikelkopf zeigt — aber ihn für
 * ALLE Treffer im Voraus zu bauen wäre die teuerste Zeile des Lesers: «der» im
 * OR ergibt rund 1146 Treffer-Artikel mit zusammen einigen zehntausend
 * Fundstellen, und das bei JEDEM Tastendruck. `LeserTreffer` trägt darum
 * weiterhin genau EINEN Ausschnitt (den aus dem stärksten Feld) für die
 * Artikelzeile; die Einzelstellen holt die Liste hier nach, und zwar nur für
 * den Artikel, den sie gerade aufklappt. Der Lauf kostet ein Artikel-Segment-Set.
 *
 * REIHENFOLGE-VERTRAG: die Schleife läuft über dieselben Segmente in derselben
 * Ordnung wie `sucheImErlass`, mit demselben Bereichs-Filter. Nur deshalb ist
 * `rang` hier und dort dieselbe Zahl. Wer eine der beiden Schleifen umbaut,
 * muss die andere mit umbauen — `src/tests/leser-suche-w219.test.ts` hält den
 * Vertrag fest, statt ihn nur zu behaupten.
 */
export function artikelFundstellen(
  index: LeserSuchIndex | null,
  token: string,
  begriff: string,
  bereich: SuchBereich = 'alles',
): ArtikelFundstelle[] {
  const b = begriff.trim();
  if (!index || b === '') return [];
  const a = index.artikel.find((x) => x.token === token);
  if (!a) return [];
  const out: ArtikelFundstelle[] = [];
  let rang = 0;
  for (const seg of a.segmente) {
    if (!imBereich(seg.feld, bereich)) continue;
    for (const [von, bis] of findeVorkommen(seg.text, b)) {
      out.push({
        rang: rang++,
        feld: seg.feld,
        quelle: seg.quelle,
        malbar: seg.malbar,
        ausschnitt: baueAusschnitt(seg.text, von, bis, seg.quelle),
      });
    }
  }
  return out;
}

/** Datenseitiger Kopf-Zähler «N Artikel · M Fundstellen» (§4.4 Ziff. 1). */
export function zaehleTreffer(treffer: readonly LeserTreffer[]): { artikel: number; fundstellen: number } {
  let fundstellen = 0;
  for (const t of treffer) fundstellen += t.fundstellen;
  return { artikel: treffer.length, fundstellen };
}

/**
 * Herkunfts-Badges eines Treffers (Spec §4.3/§4.4 Ziff. 2).
 *
 * Gezeigt werden NUR Nicht-Fliesstext-Quellen — bei einem Fliesstext-Treffer
 * ist der Ausschnitt selbst die Erklärung. Eine ÄNDERUNGS-Fussnote trägt in den
 * Stellungen «Fassung» und «aus» den Zusatz «(ausgeblendet)»: der Leser sieht,
 * dass der Sprung ihn zwar zum Artikel bringt, die Stelle aber in der aktuellen
 * Ansicht nicht leuchtet — statt dass die Ansicht beim Sprung still umgeschaltet
 * würde (§8).
 *
 * D35-F3: der Parameter heisst nach dem, was er wirklich meint. `fussnotenAus`
 * hätte nach dem Wegfall des Apparat-Schalters eine Stellung benannt, die es
 * nicht mehr gibt.
 */
export function badgesFuer(t: LeserTreffer, aenderungenAus: boolean): string[] {
  const out: string[] = [];
  for (const f of t.felder) {
    if (f.quelle === 'Fliesstext') continue;
    const text = f.malbar === 'aenderung' && aenderungenAus ? `${f.quelle} (ausgeblendet)` : f.quelle;
    if (!out.includes(text)) out.push(text);
  }
  return out;
}

/** Ein Schritt der ↑↓-Navigation. */
export interface FundstellenSchritt {
  token: string;
  /** 0-basierter Rang unter ALLEN Fundstellen dieses Artikels (der Zähler). */
  rang: number;
  /** B5: 0-basierter Rang unter den MALBAREN Stellen desselben Artikels — der
   *  Index in die Range-Liste von `sammleTrefferRanges`. `null`, wenn diese
   *  Fundstelle im DOM gar nicht erscheint. */
  malRang: number | null;
}

/**
 * Flache Fundstellen-Folge über alle Treffer, in Listen-Reihenfolge — die
 * Grundlage der ↑↓-Navigation (Spec §4.3 «Position x/M»).
 *
 * Jeder Eintrag nennt den Artikel und ZWEI Ränge, weil es zwei Mengen gibt: den
 * datenseitigen Rang (`rang`, er trägt die Anzeige «x/M») und den malbaren Rang
 * (`malRang`, er trägt den Sprung ins DOM).
 *
 * B5 (Bug-Check §9 zu S8) — WARUM DAS NICHT DIESELBE ZAHL IST. Der Sprung
 * indexierte die gemalten Ranges mit dem datenseitigen Rang. Das geht auf,
 * solange JEDE Fundstelle eines Artikels malbar ist; der Kommentar an der
 * Sprungstelle nannte das den «Regelfall», und genau das ist empirisch falsch
 * (im OR betrifft es 235+ Artikel). Trägt ein Artikel eine nie malbare
 * Fundstelle — Gliederungspfad, Bild-Alt —, verschiebt sich die Zuordnung um
 * deren Zahl, und der Sprung landet auf einer anderen Stelle als der gezählten.
 * Sichtbar wurde das bisher kaum, weil je Artikel dieselbe MULTIMENGE besucht
 * wird; mit B1/B2 ziehen gemalte und gezählte Menge aber auseinander, und dann
 * bricht auch diese Deckung.
 *
 * `aenderungenAus` gehört in die Rechnung, nicht daneben: sind die
 * Änderungs-Fussnoten gedämpft, überspringt `sammleTrefferRanges` sie
 * (`istGerendert`) — ihre Stellen sind dann NICHT malbar, und ein Rang, der sie
 * mitzählte, verschöbe die Zuordnung um genau sie. Rein und deterministisch
 * (§2): gleiche Treffer + gleiche Stellung ⇒ gleiche Folge.
 *
 * Ohne malbare Entsprechung bleibt es beim Artikel — nie wird ein Sprung an eine
 * erfundene Stelle behauptet (§8).
 */
export function fundstellenFolge(
  treffer: readonly LeserTreffer[],
  aenderungenAus: boolean,
): FundstellenSchritt[] {
  const out: FundstellenSchritt[] = [];
  for (const t of treffer) {
    let malbarBisher = 0;
    for (let i = 0; i < t.fundstellen; i++) {
      const mb = t.malbarkeiten[i];
      const malbar = mb === 'immer' || (mb === 'aenderung' && !aenderungenAus);
      out.push({ token: t.token, rang: i, malRang: malbar ? malbarBisher++ : null });
    }
  }
  return out;
}
