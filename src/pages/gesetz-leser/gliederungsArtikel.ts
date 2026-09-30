// ═══ Gliederungs-Modell · was die Leiste über einzelne ARTIKEL weiss ═════════
//
// W2·19-GLIEDERUNG/S3+S9 und W2·18-FEHLERBUCH (Artikel-Ebene, David 13.8.2026),
// aus `gliederungsModell.ts` herausgelöst, als dieses die §6.6-Schwelle riss
// (1047 Zeilen). Der Schnitt trennt zwei Fragen, die das Modell ohnehin
// getrennt beantwortet (§3):
//   · DIESE Datei: Ist ein Eintrag ein Anhang? Trägt er einen Randtitel? Wie
//     heisst seine Zeile, und wo hängt sie? — alles auf ARTIKEL-Ebene.
//   · `gliederungsModell.ts`: der Sektionsbaum, seine Zählwerte und die
//     Modus-Kette — alles auf BEREICHS-Ebene.
// Reine Funktionen, kein React, kein DOM, kein `Date.now()` (§2). Der
// Importpfad `./gliederungsModell` bleibt für alle Aufrufer gültig (Fassade).

import type { Sektion, StrukturMap } from '../../lib/normtext/browse';
import type { NormSnapshot } from '../../lib/normtext/typen';
import { artikelSachtitel } from '../../lib/normtext/darstellung';
import { istAnhangToken } from './berechnungen';
import type { GliederungsKnoten, ArtikelIndexZeile, ArtikelIndexGruppe } from './gliederungsTypen';

// ─── Artikel-Ebene (W2·18-FEHLERBUCH, Auftrag David 13.8.2026) ───────────────
/**
 * Ab dieser Deckung durch Randtitel-Blätter gilt der Baum als BEREITS
 * artikel-granular — dann wird keine Artikel-Ebene angehängt.
 *
 * WAS «DECKUNG» HIER MISST (`artikelBlattDeckung`): den Anteil der Artikel, die
 * schon heute eine eigene Baumzeile haben, weil ihr Randtitel als Blatt-Knoten
 * im Sidecar steht und genau DIESEN einen Artikel trägt. Für solche Artikel
 * wäre eine zusätzliche Artikel-Zeile eine wortgleiche Doppelung: die Zeile
 * trüge denselben Sachtitel wie ihr Elternknoten.
 *
 * WARUM 0.8 UND NICHT «GENAU OR/ZGB» (korpusweite Sonde 13.8.2026, 1458
 * Erlasse, alle B1-Fälle vermessen — §0-3 Verteilung statt Einzelwert):
 * unterhalb der Schwelle endet die Verteilung bei SO-614.11 0.793 / BL-331
 * 0.785 / PATG 0.774, oberhalb beginnt sie bei BS-730.120 0.800 / KOV 0.854 /
 * ZGB 0.881 / OR 0.919. Die Schwelle liegt also in einer echten Lücke, und die
 * beiden Erlasse, die der Auftrag ausdrücklich unverändert verlangt, haben
 * 8 bzw. 12 Prozentpunkte Luft — ein Snapshot-Nachzug kippt sie nicht. 20 von
 * 861 B1-Erlassen fallen damit in den Umfang `luecken` statt `voll`; die
 * namentliche Liste steht im Unit-Test (gliederung-artikel-ebene-w218,
 * «die 20 artikel-granularen Erlasse»), damit ein Korpus-Nachzug sie sichtbar
 * verschiebt statt still.
 *
 * NICHT als Dichte-Schwelle missverstehen: die Aufnahme hängt NICHT an der
 * Sachtitel-Dichte (der frühere Vorschlag) — David 13.8.2026: «in JEDEM Erlass
 * bis zum einzelnen Artikel aufklappbar». Diese Zahl schliesst allein die
 * Doppelung aus, sie ist kein Qualitätsfilter.
 */
export const ARTIKEL_EBENE_MAX_BLATT_DECKUNG = 0.8;

/**
 * Artikel-Zeile (unterste Klapp-Ebene). Präfix + Artikel-Token, damit die Id
 * im Erlass eindeutig ist und mit keiner `sek-N` kollidieren kann.
 */
export const ID_ARTIKEL = 'gm-art';

/**
 * Die artikel-eigene Sachüberschrift («Randtitel»), oder `null`.
 *
 * WARUM `artikelSachtitel`, NICHT `randtitelKnoten(…).blatt`: `blatt` ist
 * `null`, sobald die LETZTE Marginalien-Stufe selbst einen Aufzähler trägt
 * («1.») — dann wird sie im Baum zur (ggf. einzelartikligen) Ast-Zeile statt
 * zum Blatt (§3.4, Auftrag David 28.6.2026). Bei VwVG trifft das auf ALLE
 * 93 Artikel zu (empirisch geprüft, §7) — `blatt` wäre für den ganzen Erlass
 * durchgehend `null`, obwohl die Spec genau «Art. N — Randtitel» für VwVG
 * verlangt (§3.2/§8 T3). `artikelSachtitel` liefert IMMER die artikel-eigene
 * Sachüberschrift (letzte Marginalien-Stufe, Aufzähler gestrippt) — dieselbe
 * Quelle, die das Verweis-Popover (M11) für denselben Zweck nutzt. Der
 * `titel`-Zweig ist der Kantons-Fallback (LexWork `article_title`), dieselbe
 * Quelle wie in `hatRandtitel`.
 *
 * EINE Stelle für zwei Konsumenten (§5): der flache Artikel-Index (B2/B4) und
 * die Artikel-Ebene des Baums (B1) beantworten dieselbe Frage — sie dürfen sie
 * nie verschieden beantworten.
 */
export function artikelRandtitel(e: NormSnapshot, struktur: StrukturMap | null): string | null {
  return artikelSachtitel(struktur?.[e.artikel]?.marginalie ?? []) ?? (e.titel?.trim() || null);
}

// ─── Randtitel-Dichte ────────────────────────────────────────────────────────
/**
 * Trägt der Artikel einen Randtitel? Zwei Quellen, weil die beiden Korpora ihn
 * an verschiedenen Orten führen (empirisch geprüft, nicht angenommen):
 *  · BUND — im Struktur-Sidecar als `marginalie`-Kette (OR 99 %, VwVG 100 %,
 *    NHG 100 %); das Snapshot-Feld `titel` ist dort durchgehend leer.
 *  · KANTON — im Snapshot als `titel` (LexWork `article_title`; BS-211.100 22 %,
 *    BS-640.100 29 %); dort deckt sich der Sidecar-Wert exakt mit `titel`.
 * Die Spec nennt für VwVG «93/93 Randtitel» und für NHG «70/70» — beide Zahlen
 * ergeben sich NUR aus der Sidecar-Marginalie, nicht aus `titel`. Wer hier nur
 * `titel` läse, bekäme für den ganzen Bund 0 % und schöbe VwVG/NHG fälschlich
 * aus B2 heraus.
 */
export function hatRandtitel(e: NormSnapshot, struktur: StrukturMap | null): boolean {
  if ((struktur?.[e.artikel]?.marginalie ?? []).length > 0) return true;
  return (e.titel ?? '').trim().length > 0;
}

// ─── Anhang-Erkennung ────────────────────────────────────────────────────────
/**
 * Anhang-Eintrag? Drei Signale, in dieser Reihenfolge:
 *  1. Bund-Token-Namensraum (`annex_`/`lvl_`/`decl_`/`scope_`) — die bestehende,
 *     tor-geprüfte `istAnhangToken` aus `berechnungen.ts` (keine zweite Wahrheit).
 *  2. Kanton-Token `anhang_N` (ZH-243).
 *  3. Das amtliche `artikelLabel` beginnt mit dem Wort «Anhang» — Identitäts-
 *     Treffer mit Wortgrenze, kein Substring (§7). Das ist das ehrlichste der
 *     drei Signale: der Adapter hat «Anhang Ziff. 1.1.2.1» selbst geschrieben,
 *     wir raten nichts aus der Token-FORM. Genau daran hängen die beiden
 *     Zahlen, die die Spec nennt: ZH-243 132/150 = 88 %, SG-3849 590/607 = 97 %.
 * Die Erkennung steuert ausschliesslich die DARSTELLUNG (eigener Ast, Start-
 * Zustand) — sie klassifiziert nie rechtlich (§1/§3).
 */
export function istAnhangEintrag(e: NormSnapshot): boolean {
  if (istAnhangToken(e.artikel)) return true;
  if (/^anhang[_.]/i.test(e.artikel)) return true;
  return /^Anhang\b/.test(e.artikelLabel ?? '');
}

/** Alle Artikel eines Teilbaums in Dokumentreihenfolge (bottom-up, einmalig). */
export function sammleArtikel(s: Sektion, aus: NormSnapshot[] = []): NormSnapshot[] {
  for (const a of s.artikel) aus.push(a);
  for (const k of s.kinder) sammleArtikel(k, aus);
  return aus;
}

/**
 * Baut den Artikel-Index für B2/B4 (§3.2). Rein, deterministisch — arbeitet
 * auf denselben Eingaben wie der Sektionsbaum, aber auf ARTIKEL-Ebene: die
 * `knoten`-Ableitung zählt nur Bereiche, nie einzelne Artikel (§3 — zwei
 * verschiedene Fragen, zwei Funktionen, keine gemeinsame Wahrheit erzwungen).
 * Anhang-Einträge bleiben aussen vor — sie stehen unter der Anhang-Wurzel des
 * Sektionsbaums (`knoten`), die der Renderer UNTER den Index hängt (§5: der
 * Index dupliziert die Anhang-Erkennung nicht neu).
 */
export function baueArtikelIndex(
  sektionen: Sektion[], ohneGliederung: NormSnapshot[], eintraege: NormSnapshot[], struktur: StrukturMap | null,
): ArtikelIndexGruppe[] {
  const randtitelVon = (e: NormSnapshot): string | null => artikelRandtitel(e, struktur);
  const zeileFuer = (e: NormSnapshot): ArtikelIndexZeile => ({
    token: e.artikel, label: e.artikelLabel, randtitel: randtitelVon(e), aufgehoben: e.aufgehoben === true,
    ...(e.gegenstandslos === true ? { gegenstandslos: true } : {}),
  });
  const gruppen: ArtikelIndexGruppe[] = [];
  if (sektionen.length > 0) {
    // Top-Level-Abschnitte als Zwischenköpfe; ihr GANZER Teilbaum (inkl. tiefer
    // randtitel-promoteter Untergruppen) liefert die Artikel dokumentlinear —
    // der Index zeigt die flache Liste, keine zweite Verschachtelung (§3.2).
    for (const s of sektionen) {
      const arts = sammleArtikel(s).filter((a) => !istAnhangEintrag(a));
      if (arts.length > 0) gruppen.push({ kopf: s.label, zeilen: arts.map(zeileFuer) });
    }
    const frei = ohneGliederung.filter((a) => !istAnhangEintrag(a));
    if (frei.length > 0) gruppen.push({ kopf: null, zeilen: frei.map(zeileFuer) });
  } else {
    const arts = eintraege.filter((a) => !istAnhangEintrag(a));
    if (arts.length > 0) gruppen.push({ kopf: null, zeilen: arts.map(zeileFuer) });
  }
  return gruppen;
}

/**
 * Was eine Baumzeile UNMITTELBAR an Artikeln trägt — die Grundlage der
 * Artikel-Ebene. Wird beim Bau der Zeile mitgeschrieben, weil sie danach nicht
 * mehr rekonstruierbar ist: nach der Einzelkind-Verdichtung stammen die
 * Artikel vom BLATT der Kette, die Zeilen-Id aber vom Kopf.
 */
export interface DirektArtikel {
  arts: NormSnapshot[];
  /** Trägt das Blatt der Kette einen Randtitel? (Dann IST sein Label der Sachtitel.) */
  randtitelBlatt: boolean;
  /** Hat das Blatt der Kette keine Untersektionen? */
  ohneKinder: boolean;
}

// ─── Artikel-Ebene (W2·18-FEHLERBUCH, Auftrag David 13.8.2026) ───────────────
//
// AUFTRAG, wörtlich: «Die Gliederung muss in JEDEM Erlass bis zum einzelnen
// Artikel aufklappbar sein.» Bis hierher endete der Baum an der untersten
// AMTLICHEN Gliederungsstufe. Wo die Randtitel als Knoten im Sidecar stehen
// (OR, ZGB), fällt das nicht auf — dort IST die unterste Stufe der Artikel.
// Wo sie es nicht tun, endete er beim Kapitel: die ZPO hat 94 % Sachtitel, aber
// nur 138 Kapitel-Knoten für 430 Artikel; die Sachtitel standen ausschliesslich
// in der Lesespalte. Der Jurist konnte «Art. 404 — Weitergelten des bisherigen
// Rechts» in der Leiste weder sehen noch anspringen.
//
// WAS DIE EBENE IST: je Zeile, die Artikel unmittelbar trägt, eine Kind-Zeile
// pro Artikel — «Art. 1 — Gegenstand», bzw. schlicht «Art. 257», wo das Sidecar
// keinen artikel-eigenen Sachtitel führt (ZPO: 403 von 430 tragen einen; §8:
// der Rest bekommt kein erfundenes Etikett, sondern nur seine Nummer).
//
// WAS SIE NICHT IST: keine zweite Quelle. Etikett (`artikelLabel`) und
// Sachtitel (`artikelRandtitel`) kommen aus denselben Feldern wie der flache
// Artikel-Index (B2/B4) und die Lesespalte.
//
// ZWEI UMFÄNGE, EIN ZIEL (Nachtrag 13.8.2026 — s. `ArtikelEbeneUmfang`):
//  · `voll` — der Baum ist nicht artikel-granular: jede Zeile mit eigenen
//    Artikeln bekommt Kind-Zeilen. Ausgenommen bleibt allein das
//    Randtitel-Blatt mit genau EINEM Artikel: seine Zeile trägt schon dessen
//    Sachtitel, eine Kind-Zeile wäre dieselbe Zeile zweimal.
//  · `luecken` — der Baum ist bereits artikel-granular (OR 0.92, ZGB 0.88,
//    ARTIKEL_EBENE_MAX_BLATT_DECKUNG): hier entsteht eine Kind-Zeile NUR, wo
//    ein Artikel sonst gar nicht anspringbar wäre. Denn eine Zeile springt
//    immer zu genau EINEM Artikel (`ersterArtikel`) — trägt ein Knoten
//    mehrere, sind die übrigen über die Gliederung nicht erreichbar.
//    GEMESSEN am committeten Korpus: OR 83 von 1686 Artikeln, ZGB 122 von
//    1277, dazu LFG 17 · KOV 8 · SchKG 7 · ENTG 6 · IPRG 5 · VZG 5 · VSTG 4 ·
//    VSTV 1 · VSTRR 1. Diese Artikel standen bis zum 13.8.2026 in der Leiste
//    nicht zur Verfügung — Davids Vorgabe «bis zum einzelnen Artikel in ALLEN
//    Gesetzen» ist damit erst jetzt erfüllt.
//
// ANHANG-ZEILEN (`art: 'anhang'`) bekommen in KEINEM Umfang Kind-Zeilen:
// `baueAnhangAst` erzeugt je Anhang-Eintrag schon eine eigene. Die Anhang-
// SEKTIONEN (`art: 'sektion'`, `anhang: true`, z. B. AIG/ChemRRV) dagegen sehr
// wohl — ihre Artikel hingen sonst weiter unerreichbar am Kapitel.
// Vorspann-, Nachspann- und Mittelgruppen-Zeilen ebenso: dort liegt bei
// Staatsverträgen der Haupttext (RBUE 47 von 49 Artikeln), und eine Sammelzeile
// «Ohne Abschnitt (Art. 1–47)» ist kein Zugang zu Art. 23.

/** Eine Artikel-Zeile. Blatt ohne Kinder — die Ebene ist immer die unterste. */
function baueArtikelZeile(e: NormSnapshot, tiefe: number, struktur: StrukturMap | null): GliederungsKnoten {
  const sachtitel = artikelRandtitel(e, struktur);
  return {
    id: `${ID_ARTIKEL}:${e.artikel}`,
    art: 'artikel',
    ids: [`${ID_ARTIKEL}:${e.artikel}`],
    labelKette: [e.artikelLabel],
    // Der zusammengesetzte Text ist das, was `title`/`aria-label` sprechen —
    // sichtbar setzt der Renderer Etikett und Sachtitel in zwei Stimmen.
    label: sachtitel ? `${e.artikelLabel} — ${sachtitel}` : e.artikelLabel,
    sachtitel: sachtitel ?? undefined,
    ebene: 0,
    tiefe,
    randtitel: false,
    kinder: [],
    tokens: [e.artikel],
    artikelAnzahl: 1,
    eigeneArtikel: 1,
    gemischt: false,
    ersterArtikel: e.artikel,
    // Aufgehobene Artikel behalten ihre Zeile (Platzhalter-Treue, §8): sie sind
    // Teil der amtlichen Zählung, und ihr Verschwinden aus der Gliederung
    // erzeugte eine Lücke, die es im Erlass nicht gibt.
    aufgehoben: e.aufgehoben === true,
    ...(e.gegenstandslos === true ? { gegenstandslos: true } : {}),
    anhang: istAnhangEintrag(e),
  };
}

/**
 * Trägt diese Zeile ihren einen Artikel bereits mit dessen SACHTITEL? Dann
 * wäre eine Kind-Zeile wortgleich (Umfang `voll`, Ausnahme oben) — und diese
 * Prüfung ist zugleich die Definition der Kennzahl `artikelBlattDeckung`.
 */
export function istSchonArtikelZeile(d: DirektArtikel): boolean {
  return d.randtitelBlatt && d.ohneKinder && d.arts.length === 1;
}

/**
 * Ist dieser Artikel über die Zeile, an der er hängt, ANSPRINGBAR? Eine Zeile
 * hat genau ein Sprungziel (`ersterArtikel`, s. SektionBaumTOC) — trägt sie
 * mehrere Artikel, erreicht sie nur einen davon. Massgeblich im Umfang
 * `luecken`: dort entsteht eine Kind-Zeile ausschliesslich für die anderen.
 *
 * Der Vergleich gegen `ersterArtikel` statt gegen «genau ein Artikel» ist
 * nicht Feinschliff, sondern der gemischte Knoten (T8): dessen Sprungziel ist
 * der erste Artikel des ganzen TEILBAUMS, also womöglich der eines Kindes —
 * sein eigener Artikel bliebe dann trotz `arts.length === 1` unerreichbar.
 */
function istAnspringbar(k: GliederungsKnoten, arts: NormSnapshot[]): boolean {
  return arts.length === 1 && k.ersterArtikel === arts[0].artikel;
}

/**
 * Hängt die Artikel-Ebene an. Mutiert die frisch gebauten Knoten in place —
 * sie sind bis hierher rein lokal, und ein zweiter, kopierender Durchgang über
 * bis zu 2 181 Zeilen (OR) wäre reine Allokation ohne Erkenntnisgewinn (§15).
 *
 * EINFÜGE-ORDNUNG: die Artikel-Zeilen werden nach DOKUMENTREIHENFOLGE zwischen
 * die bestehenden Kind-Zeilen gemischt, ohne deren Reihenfolge anzutasten. Ein
 * gemischter Knoten (T8) zeigt seine direkten Artikel damit dort, wo sie im
 * Text stehen — vor, zwischen oder nach seinen Untersektionen. Blosses Anhängen
 * hätte bei jedem T8-Knoten eine falsche Leseordnung behauptet (§8).
 *
 * STARTZUSTAND — und die Grenze, die der §9-Bug-Check gezogen hat (F1,
 * 13.8.2026): Die Artikel-Ebene darf beim Start nicht sichtbar sein (Auftrag
 * David: «VERFÜGBARKEIT beim Aufklappen, nicht Start-Sichtbarkeit»; ohne die
 * Klemme zeigte die BV statt 39 Zeilen deren 271). Aber die Klemme
 * `startOffen: false` wirkt auf die GANZE Zeile, also auch auf ihre
 * SEKTIONS-Kinder — und an gemischten Knoten (T8: eigene Artikel UND
 * Untersektionen) verschwanden damit ganze Teilbäume aus der Start-Sicht.
 * A/B am Korpus gemessen: 58 Erlasse verloren zusammen 257 Start-Zeilen
 * (BS-257.820 7 → 1, GR-210.370 16 → 3) — genau gegen Davids Entscheid vom
 * 8.8.2026, dass kleine Bäume offen starten.
 * Darum wird sie nur noch dort gesetzt, wo die Zeile AUSSCHLIESSLICH
 * Artikel-Kinder trägt. Am gemischten Knoten regelt die Sichtbarkeit der
 * Artikel-Zeilen `artikelKinderOffen` (gliederungsModell.ts): Sektions-Kinder
 * folgen der Start-Regel, Artikel-Kinder erst einem ausdrücklichen Öffnen.
 * Ein expliziter Wert gewinnt in `zeileIstOffen` gegen die Tiefen-Regel, ein
 * Klick und der Scroll-Spy gewinnen weiterhin gegen ihn.
 */
export function haengeArtikelZeilen(
  knoten: GliederungsKnoten[],
  /** Zeilen-Id → unmittelbar getragene Artikel (nur Sektionszeilen). */
  direkt: Map<string, DirektArtikel>,
  /** Artikel-Token → Position im Snapshot (Dokumentreihenfolge). */
  artPos: Map<string, number>,
  /** Artikel-Token → Snapshot-Eintrag (für die synthetischen Zeilen). */
  artNach: Map<string, NormSnapshot>,
  struktur: StrukturMap | null,
  /** `voll` = überall, `luecken` = nur wo sonst unerreichbar (s. o.). */
  umfang: 'voll' | 'luecken',
): void {
  for (const k of knoten) {
    haengeArtikelZeilen(k.kinder, direkt, artPos, artNach, struktur, umfang);
    if (k.art === 'artikel' || k.art === 'anhang') continue; // s. o.: schon je Eintrag eine Zeile
    let arts: NormSnapshot[];
    if (k.art === 'sektion') {
      const d = direkt.get(k.id);
      if (!d) continue;
      arts = d.arts;
      if (umfang === 'voll' && istSchonArtikelZeile(d)) continue;
    } else {
      // Vorspann/Nachspann/Mittelgruppe: ihre Artikel stehen in `tokens`.
      arts = (k.tokens ?? []).map((t) => artNach.get(t)).filter((e): e is NormSnapshot => e !== undefined);
    }
    // `luecken`: was die Zeile selbst anspringt, bleibt wie es ist.
    if (umfang === 'luecken' && istAnspringbar(k, arts)) continue;
    if (arts.length === 0) continue;
    const zeilen = arts.map((e) => baueArtikelZeile(e, k.tiefe + 1, struktur));
    const posVon = (kind: GliederungsKnoten): number =>
      kind.ersterArtikel !== undefined ? artPos.get(kind.ersterArtikel) ?? Infinity : Infinity;
    const gemischt: GliederungsKnoten[] = [];
    let i = 0;
    for (const z of zeilen) {
      const p = posVon(z);
      while (i < k.kinder.length && posVon(k.kinder[i]) < p) gemischt.push(k.kinder[i++]);
      gemischt.push(z);
    }
    while (i < k.kinder.length) gemischt.push(k.kinder[i++]);
    k.kinder = gemischt;
    // `gemischt`/`eigeneArtikel` bleiben unangetastet: sie beschreiben den
    // AUFBAU des Erlasses (Knoten ist Ordner und Sprungziel zugleich), nicht
    // die Zahl der gerenderten Zeilen. Die Erlass-Übersicht rechnet mit ihnen.
    //
    // F1 (§9-Bug-Check 13.8.2026): die Klemme NUR an Zeilen, die nichts als
    // Artikel tragen — sonst nähme sie den gemischten Knoten ihre
    // Sektions-Kinder mit (Herleitung oben).
    if (gemischt.every((kk) => kk.art === 'artikel')) k.startOffen ??= false;
  }
}
