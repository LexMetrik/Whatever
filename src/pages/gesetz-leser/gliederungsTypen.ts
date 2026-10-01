// ═══ Gliederungs-Modell · Typen ══════════════════════════════════════════════
//
// W2·19-GLIEDERUNG/S3 (Bau-Spec §3), aufgeteilt am 13.8.2026 (W2·18-FEHLERBUCH).
//
// WARUM EIGENE DATEI. Mit der Artikel-Ebene riss `gliederungsModell.ts` die
// §6.6-Schwelle von 800 Zeilen (1047). Der Schnitt folgt der Frage, nicht der
// Zeilenzahl: hier steht, WAS ein Gliederungs-Modell ist (reine Typen, kein
// Code), in `gliederungsArtikel.ts`, was die Leiste über einzelne ARTIKEL
// weiss, und in `gliederungsModell.ts` der Aufbau des Sektionsbaums samt
// Modus-Kette. Die Typen liegen zuunterst, damit die beiden anderen Module
// sie teilen können, ohne einander zu importieren (`check:zyklen`).
//
// IMPORTPFAD BLEIBT: `gliederungsModell.ts` re-exportiert alles hier
// Definierte. Bestehende Importe (SektionBaumTOC, inhalt-hooks, Tests) sind
// unverändert gültig — Fassaden-Muster, kein Aufruferwechsel.

import type { Sektion, StrukturMap } from '../../lib/normtext/browse';
import type { NormSnapshot } from '../../lib/normtext/typen';

export type GliederungsModus = 'b4-mini' | 'b3-leer' | 'b2-index' | 'b1-offen' | 'b1-kompakt';

/**
 * Wie weit reicht die Artikel-Ebene des Baums? (W2·18-FEHLERBUCH, David
 * 13.8.2026 «bis zum einzelnen Artikel in ALLEN Gesetzen».)
 *
 *  · `voll`     — jede Zeile mit eigenen Artikeln bekommt sie. Der Regelfall
 *                 der Baum-Modi: dort ist der Baum nicht artikel-granular, die
 *                 Artikel-Zeile trägt Nummer UND Sachtitel.
 *  · `luecken`  — nur dort, wo Artikel sonst UNERREICHBAR wären. Der Fall der
 *                 Erlasse, deren Randtitel-Blätter den Baum schon artikel-
 *                 granular machen (OR, ZGB, SchKG …): eine Zeile je Randtitel-
 *                 Blatt bleibt, aber wo ein Knoten mehrere Artikel trägt, ist
 *                 nur der erste anspringbar — die übrigen bekommen ihre Zeile.
 *  · `keine`    — der Modus zeigt die Artikel ohnehin flach (`artikelIndex`,
 *                 b2/b4) oder es gibt gar keine (b3).
 *
 * Die Unterscheidung ist KEIN Qualitätsurteil über den Erlass, sondern die
 * Antwort auf «wo fehlt noch ein Zugang»: Erreichbarkeit gilt überall, gedoppelt
 * wird nirgends (§5).
 */
export type ArtikelEbeneUmfang = 'voll' | 'luecken' | 'keine';

export interface GliederungsKennzahlen {
  /** Artikel im Snapshot (inkl. Anhang-Einträge — es ist die Snapshot-Länge). */
  artikelAnzahl: number;
  /** Struktur-Sidecar vorhanden? `false` = die 42 Kantons-Snapshots ohne Sidecar (T10). */
  hatSidecar: boolean;
  /**
   * Baumzeilen bei Vollausklapp, OHNE die synthetischen Knoten (Vorspann/
   * Nachspann/Anhang-Wurzel) — das ist die Grösse, an der die Modus-Kette
   * entscheidet. Bewusst so geschnitten: die Spec verankert «AIG = 52 Zeilen»
   * (§3.2/§8), und AIG hat genau 52 Sektions-Knoten. Zählte man die
   * Anhang-Wurzel mit, verschöbe sich diese Referenz ohne fachlichen Grund.
   */
  zeilenVoll: number;
  /** Alle Zeilen inkl. der synthetischen Knoten — das, was wirklich gerendert wird. */
  zeilenGesamt: number;
  /** Knoten der AMTLICHEN Gliederung (ohne randtitel-promotete). VwVG 5, OR 171, ZGB 134. */
  amtlicheKnoten: number;
  /** Alle Knoten des Rohbaums (vor der Einzelkind-Verdichtung). */
  knotenGesamt: number;
  /** Anteil der Artikel mit Randtitel/Marginalie, 0…1 (§3.2 «Marginalien-Dichte»). */
  marginalienDichte: number;
  /**
   * Anteil der Artikel, die schon OHNE Artikel-Ebene eine eigene Baumzeile
   * haben — ihr Randtitel steht als Blatt-Knoten im Sidecar und trägt genau
   * diesen einen Artikel (OR 0.92, ZGB 0.88, ZPO 0.00). Massgeblich für
   * `artikelEbene`, s. ARTIKEL_EBENE_MAX_BLATT_DECKUNG.
   */
  artikelBlattDeckung: number;
  /** Anteil der Anhang-Einträge an allen Artikeln, 0…1 (ZH-243 0.88, SG-3849 0.97). */
  anhangAnteil: number;
  /** Artikel ohne Gliederungs-Zuordnung VOR dem ersten Baumartikel (T9: RBUE 47). */
  vorspannArtikel: number;
  /** Dieselben, aber NACH dem letzten Baumartikel (im Referenzbestand 0). */
  nachspannArtikel: number;
  /** Anhang-Einträge insgesamt. */
  anhangArtikel: number;
}

export interface GliederungsKnoten {
  /** Sektions-Id (`sek-N`) bzw. eine der synthetischen Ids. Der EINZIGE Schlüssel. */
  id: string;
  art: 'sektion' | 'vorspann' | 'nachspann' | 'mitte' | 'anhang' | 'artikel';
  /**
   * Alle Sektions-Ids, die diese EINE Zeile trägt — bei verdichteten
   * Einzelkind-Ketten mehr als eine (`[sek-7, sek-8, sek-9]`). Der Scroll-Spy
   * liefert einen Pfad aus Roh-Ids; eine Zeile ist aktiv, wenn der Pfad
   * IRGENDEINE ihrer Ids enthält. Ohne dieses Feld verlöre die verdichtete
   * Zeile ihre Aktiv-Erkennung.
   */
  ids: string[];
  /** Die verdichteten Einzel-Labels in Reihenfolge (`['§ 3', 'I.', '1.']`). */
  labelKette: string[];
  /** Anzeige-Label; bei Verdichtung `'§ 3 › I. › 1.'`. */
  label: string;
  /** Ebene der äussersten Sektion (aus dem Sidecar; synthetische Knoten: 0). */
  ebene: number;
  /** Renderer-Tiefe dieser ZEILE (verdichtete Stufen zählen als eine). */
  tiefe: number;
  /** true, wenn die äusserste Stufe randtitel-promotet ist (ruhige Serif-Stimme). */
  randtitel: boolean;
  /** Fedlex-Container-eId, wo vorhanden — reines Zusatzfeld, NIE Schlüssel, NIE Anker. */
  eId?: string;
  kinder: GliederungsKnoten[];
  /** Artikel im ganzen Teilbaum (inkl. der direkt am Knoten hängenden). */
  artikelAnzahl: number;
  /** Direkt am Knoten hängende Artikel (T8 gemischter Knoten: > 0 trotz Kindern). */
  eigeneArtikel: number;
  /** T8: Knoten ist Ordner UND Sprungziel zugleich. */
  gemischt: boolean;
  /** «Art. 1–40» — aus `berechneSektionMeta`, also aus den amtlichen `artikelLabel`. */
  bereich?: string;
  /** Token des ersten Artikels im Teilbaum (Sprungziel, Anker `art-<token>`). */
  ersterArtikel?: string;
  /** Alle Artikel des Teilbaums tragen `aufgehoben` — im Baum sichtbar zu machen. */
  aufgehoben: boolean;
  /** W2·27 (30.9.2026): der Artikel dieser BLATT-Zeile trägt amtlich «gegenstandslos» (nur die
   *  Artikel-Zeile; Sammel-Knoten aggregieren das Wort nicht). Fehlt, wo nicht zutreffend. */
  gegenstandslos?: boolean;
  /** Reiner Anhang-Teilbaum (kein «Bereich»-Badge, gehört unter die Anhang-Wurzel). */
  anhang: boolean;
  /**
   * Ausnahme-Vorgabe gegen die Tiefen-Regel. Zwei Setzer: die dominante
   * Anhang-Wurzel (`true`) und jeder Knoten, an dem eine Artikel-Ebene hängt
   * (`false` — Herleitung bei `haengeArtikelZeilen`).
   */
  startOffen?: boolean;
  /**
   * Nur an Artikel-Zeilen: die artikel-eigene Sachüberschrift, wo eine
   * existiert. Getrennt vom `label` geführt, weil die Zeile Etikett und
   * Sachtitel in zwei Stimmen setzt (wie der Artikel-Index) — der Renderer
   * soll den zusammengesetzten String nicht wieder auseinandernehmen müssen.
   */
  sachtitel?: string;
  /**
   * Artikel-Tokens, die DIESE Zeile unmittelbar deckt — nur an synthetischen
   * Zeilen (Vorspann/Nachspann/Anhang). Sektionszeilen brauchen es nicht: für
   * sie liefert `pfadZu` den Pfad aus dem Rohbaum.
   *
   * W2·19-GLIEDERUNG/S5: ohne dieses Feld kann der Scroll-Spy den Zustand «vor
   * dem ersten Knoten» (Spec §3.4) nicht melden. Beim RBUE liegen 47 von 49
   * Artikeln im Vorspann; `pfadZu` findet für sie nichts, die Leiste blieb
   * unmarkiert, während der Leser mitten im Text stand. Die Zuordnung gehört
   * ins Modell und nicht in den Hook — sonst entstünde eine zweite Wahrheit
   * darüber, welcher Artikel zu welcher Zeile gehört (§5).
   */
  tokens?: string[];
}

export interface GliederungsModell {
  modus: GliederungsModus;
  /** Der fertige Zeilenbaum. In `b3-leer` bewusst leer (die Leere IST das Ergebnis). */
  knoten: GliederungsKnoten[];
  /**
   * Bis zu welcher Tiefe Zeilen ohne Zutun offen starten (Zeilen mit
   * `tiefe < startOffeneTiefe`). 0 = alles zu (Entscheid David 5.8.2026);
   * `Infinity` = alles offen. Einzelne Knoten dürfen mit `startOffen` abweichen.
   */
  startOffeneTiefe: number;
  /** B4: die Leiste startet eingeklappt, die Lesespalte bekommt die volle Breite. */
  leisteStartetZu: boolean;
  /**
   * Rohpfad→Modellpfad, EINE Übersetzungsstelle (§5). Roh-Sektions-Id → Präfix
   * der synthetischen Zeilen, unter die ihr Ast im Modell umgehängt wurde
   * (heute ausschliesslich `['gm-anhang']`).
   *
   * WOZU: der Scroll-Spy bestimmt den aktiven Pfad über den ROHBAUM
   * (`pfadZu`) — er kennt das Modell nicht und soll es auch nicht nachbauen.
   * Ein reiner Anhang-Ast ist im Rohbaum Top-Level, im Modell aber Kind der
   * Wurzel «Anhänge». Ohne Übersetzung sucht die Marken-Suche den Roh-Id auf
   * der obersten Modell-Ebene, findet nichts und gibt auf: keine
   * Positionsmarke, kein `aria-current`, kein Mitscroll (Bug-Check 9.8.2026,
   * B4 — belegt an AIG/ASYLG/KKV, korpusweit 136 Erlasse mit Anhang-Ast).
   * Leer, solange nichts umgehängt wurde.
   */
  umhaengPraefix: Record<string, string[]>;
  /**
   * Wie weit reicht die Artikel-Ebene? (Herleitung bei `ArtikelEbeneUmfang`.)
   * `keine` heisst nie «hier fehlen Artikel», sondern «dieser Modus zeigt sie
   * anderswo» (flacher `artikelIndex`) bzw. «es gibt keine» (b3-leer).
   */
  artikelEbene: ArtikelEbeneUmfang;
  kennzahlen: GliederungsKennzahlen;
  /**
   * W2·19-GLIEDERUNG/S9 (Bau-Spec §3.2/§8, T3/T4-Fälle): der ARTIKEL-scharfe
   * Index für `b2-index` UND `b4-mini` — «Art. N — Randtitel», vorhandene
   * amtliche Abschnitte als nicht klappbare Zwischenköpfe (§3.2 B2-Zeile).
   * Leer in jedem anderen Modus (billig: nichts wird umsonst gebaut). Der
   * SEKTIONS-Baum (`knoten`) kennt keine einzelnen Artikel — nur er kann sie
   * liefern, darum eine eigene, zweite Ableitung statt eines Render-Tricks
   * über `knoten` (§3 Schichtentrennung: die Entscheidung, WELCHE Artikel wo
   * stehen, ist Modell, keine Darstellung).
   */
  artikelIndex: ArtikelIndexGruppe[];
}

/** Eine Zeile des Artikel-Index (§3.2 B2): «Art. N — Randtitel». */
export interface ArtikelIndexZeile {
  /** Artikel-Token — Sprungziel (`onSprungArtikel`) und React-Key. */
  token: string;
  /** Amtliches Etikett («Art. 7», «§ 12»), nie geraten (`artikelLabel`). */
  label: string;
  /** Artikel-eigene Sachüberschrift (Randtitel-Blatt) oder `titel` (Kanton-
   *  Fallback, dieselbe Quelle wie `hatRandtitel`) — `null` = keine vorhanden. */
  randtitel: string | null;
  aufgehoben: boolean;
  /** W2·27 (30.9.2026): amtlich «gegenstandslos» (`NormSnapshot.gegenstandslos`) — eigenes Wort,
   *  nie «aufgehoben» (§1/§8). Fehlt, wenn der Artikel den Vermerk nicht trägt. */
  gegenstandslos?: boolean;
}

/**
 * Eine Gruppe des Artikel-Index: `kopf` ist die nicht klappbare amtliche
 * Abschnitts-Überschrift (Spec §3.2 «vorhandene Abschnitte als Zwischenköpfe»)
 * — `null`, wo der Erlass gar keine hat (T4: NHG/VMWG) oder wo Artikel
 * ausserhalb jedes Abschnitts liegen (dieselbe Ehrlichkeit wie Vor-/Nachspann,
 * §3.4 — nichts wird stillschweigend einer Überschrift zugeschlagen, zu der
 * es amtlich nicht gehört).
 */
export interface ArtikelIndexGruppe {
  kopf: string | null;
  zeilen: ArtikelIndexZeile[];
}

export interface ModellEingabe {
  /** Ausgabe von `baueGliederungsbaum` — bereits kuratiert (`kuratiereTocSektionen`). */
  sektionen: Sektion[];
  /** Ausgabe von `baueGliederungsbaum` — Artikel ohne Gliederungs-Zuordnung. */
  ohneGliederung: NormSnapshot[];
  /** Der volle Snapshot in Dokumentreihenfolge. */
  eintraege: NormSnapshot[];
  /** Struktur-Sidecar oder `null` (= keines vorhanden, T10). */
  struktur: StrukturMap | null;
  /**
   * §11 Frage 1 / §3.2 «Achtung Konflikt mit Davids 5.8.-Entscheid ‹alles zu›»:
   * B1 offen startet erst dann wirklich sichtbar, wenn dieser Schalter gesetzt
   * ist. Default `false` = der 5.8.-Entscheid gilt unverändert, B1 offen
   * verhält sich wie B1 kompakt. Der Modus selbst bleibt in BEIDEN Fällen
   * `b1-offen` — er beschreibt, was der Erlass IST; der Schalter beschreibt nur,
   * was die Leiste beim Öffnen TUT. So bleibt das Modell auch nach dem Go
   * dieselbe Wahrheit (§8).
   */
  startSichtbarGo?: boolean;
}
