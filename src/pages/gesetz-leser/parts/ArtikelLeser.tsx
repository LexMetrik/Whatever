import { useState, memo } from 'react';
import { ArtikelBody, FnRef } from '../../../components/normtext/ArtikelBody';
import { type InternRefs } from '../../../components/NormText';
import { labelMitBereich, artikelGanzAufgehoben } from '../../../lib/normtext/darstellung';
import type { Fussnote } from '../../../lib/normtext/browse';
import type { LeitfallRef } from '../../../lib/rechtsprechung/norm-index';
import type { MaterialBezug } from '../../../lib/normtext/werkzeuge';
import type { ArtikelRevision } from '../../../lib/verzahnung/artikel-revisionen';
import type { BrowseErlass } from '../../../lib/normtext/browse-typen';
import type { NormSnapshot } from '../../../lib/normtext/typen';
import { verifizierLinkArtikel } from '../../../lib/normtext/verifikationslink';
import type { ArtikelHistorie } from '../../../lib/normtext/historie-laden';
import { fnTextMitLinks, baueZitat } from '../helpers';
import { SUCH_META } from '../suchHighlight';
import { schaetzeArtikelHoehe } from '../berechnungen';
import { fussnotenAnzeige, verteileFussnoten, sammleVerweise } from './ArtikelLeser.fussnoten';
import { useSatzspiegel } from '../v3/satzspiegel';
import type { ArtikelBezuege } from '../bezuegeLaden';
import { werkzeugeAmArtikel } from '../randNotizWerkzeuge';
import { RandTitel } from './ArtikelLeser.kopfteile';
import { ArtikelHistorieZeile } from './ArtikelHistorie';
import { ArtikelBezuegeFuss } from './ArtikelLeser.bezuegeFuss';
import { ArtikelAktionen } from './ArtikelAktionen';
import { ArtikelNachbarn } from './ArtikelNachbarn';
import type { ArtikelNachbarn as NachbarnAmArtikel } from '../v3/nachbarArtikel';

// Ein Artikel im Lesefluss (Richtung A): zweispaltig wie die amtliche Druckfassung —
// links «Art. N» als ruhiger Anker mit den Randtiteln darunter (rechtsbündig, nur die
// gegenüber dem Vorartikel GEÄNDERTEN Stufen, `marg`), rechts der Serif-
// Bestimmungstext. Ersetzt den früheren fliegenden Standort-Tracker. Reine Darstellung.

export const ArtikelLeser = memo(function ArtikelLeser({ e, erlass, basisPfad, fussnoten, intern, marg, margBasis, imTreffer, onSpringe, leitfaelle, bezuege, bezuegeImFuss, materialien, onBezuegeOeffnen, onImBlatt, bezuegeLaedt, revision, historie, zaehler, nachbarn, fussForm, istAnhang = false }: {
  e: NormSnapshot; erlass: BrowseErlass; basisPfad: string; fussnoten?: Fussnote[]; intern?: InternRefs;
  marg?: string[];
  /** G-HIST-UI: Fassungshistorie dieses Artikels aus dem erlass-lokalen Shard
   *  (Reader lädt ihn einmal idle). undefined = kein Eintrag ⇒ kein Badge (§8). */
  historie?: ArtikelHistorie;
  /**
   * W2·24-R6c · die ZAHLEN der Bezüge-Zeile, buildseitig gezählt
   * (`../bezuegeZaehler`, Zähl-Datei je Erlass, ø 289 B). Sie sagen, WIE VIELE
   * Entscheide und Materialien an diesem Artikel hängen — nicht WELCHE. Damit
   * steht die Zeile vollständig da, bevor irgendein Shard geladen ist, und die
   * Rubrik «Materialie» wird überhaupt erst möglich: ihr Shard kommt im Leser
   * sonst gar nicht vor (§8 — bis hierher fehlte die Rubrik lieber ganz, als
   * eine Zusage ohne Deckung zu machen).
   * `undefined` = keine Datei oder noch nicht geladen ⇒ die Zeile fällt auf
   * das zurück, was der Artikel ohnehin führt.
   */
  zaehler?: { entscheide: number; materialien: number };
  /** W2·5d G3b (③/⑤): der Eintrag ist ein Anhang (`annex_*`) bzw. Staatsvertrags-
   *  Protokoll (`lvl_*`) — als eigenständig erkennbarer, klar abgesetzter Block
   *  rendern (Struktur-Trenner statt Artikel-Trenner, «Anhang N»/«Protokoll N» als
   *  Struktur-Überschrift statt Artikelnummer). Reine Darstellung (§3); Prosa
   *  byte-gleich, nur Markup/Klassen. Delimitation über Typo + Struktur-Trenner
   *  (Linien-Kanon «Ruhe durch Reduktion» — keine Farb-/Box-Sprache). */
  /** W2·5m · Vorgänger/Nachfolger DIESES Artikels in amtlicher Reihenfolge
   *  (`../v3/nachbarArtikel.ts`). REFERENZ-STABIL übergeben — diese Komponente
   *  ist `memo`, und ein je Render frisch gebautes Objekt höbe die Schranke
   *  über alle 1686 Artikel des OR auf (§15). `undefined` = die Hülle setzt
   *  keine Nachbarschaft (Test-Render, Einzel-Ausspielung) ⇒ keine Zeile. */
  nachbarn?: NachbarnAmArtikel;
  /**
   * W2·5m (Kap. 15.5) · die GESTALT der Rubriken am Artikelende. `undefined`
   * bzw. `'zeile'` ist die Funktionszeile der Gesamtansicht (unverändert),
   * `'dossier'` sind die gestapelten Blöcke des Einzelmodus.
   *
   * DURCHGEREICHT, nicht ausgewertet: die Weiche steht in
   * `./ArtikelLeser.bezuegeFuss.tsx`, wo auch die Marken gerechnet werden (§5).
   * Der Artikel-Körper darüber ist in beiden Fällen byte-gleich derselbe —
   * genau das misst das PX-Tor (Kap. 15.1, Grenze Hülle/Kern).
   */
  fussForm?: 'zeile' | 'dossier';
  istAnhang?: boolean;
  /** Leitfälle dieses Artikels (V1a-Form, flache BGE-Chip-Reihe).
   *
   *  W2·7-BEZUG/B4: DER READER SETZT DIESE PROP NICHT MEHR. Seit der Vorgabe
   *  David 28.7.2026 speist sich der Artikelfuss ausschliesslich aus `bezuege`
   *  (facettierte Auflistung; der Bezugs-Shard ist die Obermenge des schlanken
   *  Leitfall-Shards). Die Prop und `LeitfallZeile` bleiben als unveränderte
   *  Darstellungsform bestehen — sie werden weiterhin direkt konsumiert (u. a.
   *  vom Farbwörterbuch-Test) und sind kein toter Zweig, sondern ein nicht mehr
   *  vom Reader bedienter Eingang. */
  leitfaelle?: LeitfallRef[];
  /** W2·7-BEZUG/B4: facettierte Bezüge dieses Artikels, sobald der Nutzer die
   *  Facetten erweitert hat. Gesetzt ⇒ die `BezuegeZeile` tritt AN DIE STELLE
   *  der `LeitfallZeile` (der Bezugs-Shard ist deren Obermenge, §5 — nie beide
   *  nebeneinander, das wären zwei Wahrheiten am selben Artikel). */
  bezuege?: ArtikelBezuege;
  /**
   * D30 · der Inhalt der AUFGEKLAPPTEN Bezüge-Zeile. Sie hiess bis D33
   * `bezuegeImFuss` — die Zeile stand damals unter der Artikelnummer; seit D34
   * steht sie am Artikelfuss (Auftrag David 7.9.2026), und der Prop-Name folgt
   * dem Ort.
   *
   * BEWUSST NICHT `bezuege` (Nullprobe 7.9.2026, `leser-v3-kontext-cls` (b)):
   * `bezuege` speiste AUCH den unbedingten Artikelfuss der schmalen Form und
   * der Suchsicht (`!kopfForm`). Wer im V3-Leser `bezuege` setzte, brachte
   * damit Pos. 12 zurück — gemessen @390 an der StPO: das Öffnen des Panels lud
   * den Shard, und die Fuss-Zeile wuchs an JEDEM Artikel in den Lesekörper
   * hinein (Artikel-y 1385→1493, 1798→2013, 2461→2783). Genau das verbietet der
   * CLS-Fall.
   *
   * DER BELEG BLEIBT STEHEN, DIE STELLE IST WEG: D34 hat den unbedingten
   * Fuss-Zweig gelöscht — beide Props landen jetzt im selben `<details>`.
   * Zwei Props bleiben es trotzdem, weil es zwei LADEVERTRÄGE sind: `bezuege`
   * wird unbedingt gesetzt (Ist-Hülle, Tests, V1), diese hier erst, NACHDEM der
   * Leser eine Zeile aufgeklappt hat. Genau diese Grenze bewacht die H3-Sonde
   * in `src/tests/leser-v3-fundament.test.ts`; sie fiele mit einer
   * zusammengelegten Prop ersatzlos weg (§6.7).
   */
  bezuegeImFuss?: ArtikelBezuege;
  /** D30 (David 6.9.2026) · die Materialien DIESES Artikels, sobald der Leser
   *  die Bezüge-Zeile einmal aufgeklappt hat (`../artikelMaterialienLaden`).
   *  Bis dahin `undefined` — die Rubrik zeigt dann ihre gezählte Zahl aus der
   *  Zähl-Datei und noch keine Liste. Gleiche Quelle wie die Zahl (§5). */
  materialien?: MaterialBezug[];
  /** D30 · wird beim Aufklappen der Bezüge-Zeile gerufen und armiert den
   *  bestehenden Ladepfad (`v3/panelModell.ts` → `weckeDaten`). Ohne die Prop
   *  bleibt die Zeile, was sie war (Ist-Hülle, Tests, Druck). */
  onBezuegeOeffnen?: () => void;
  /** D35-F2 · «im Blatt öffnen ›» in der aufgeklappten Rubrik «Entscheide»
   *  (Herleitung in `./ArtikelLeser.bezuegeFuss.tsx`). MUSS referenz-stabil
   *  sein — diese Komponente ist `memo`, und 1686 neue Funktionen je Render des
   *  Rahmens hoben die Schranke auf (§15, `../v3/panelModell.oeffneEntscheide`). */
  onImBlatt?: () => void;
  /** D30 · der Apparat ist unterwegs ⇒ Skelett-Zeile «lädt …» statt Leere. */
  bezuegeLaedt?: boolean;
  /** Revision r(a) dieses Artikels (§V1c) — an die LeitfallZeile durchgereicht. */
  revision?: ArtikelRevision | null;
  // Absolute Tiefe der ERSTEN gezeigten Randtitel-Stufe (Delta-Offset). Damit
  // wird die Stufe einheitlich je absoluter Tiefe formatiert, auch wenn nur
  // die geänderten Stufen gezeigt werden. 0 (Default) = volle Kette (Suchsicht).
  margBasis?: number;
  // Treffer-Modus (Auftrag David): Klick auf die Artikelnummer springt in den
  // VOLLTEXT zu diesem Artikel und löscht die Suche, statt nur innerhalb der
  // Trefferliste zu ankern.
  imTreffer?: boolean; onSpringe?: (token: string) => void;
}) {
  // ── W2·24-D35-F1 · DIE KOPIER-MECHANIK WOHNT JETZT BEI IHREN KNÖPFEN ────
  // `useKopieren` (Marke), `usePaneKontext` (Rolle) und die ganze
  // `kopiere`-Funktion samt LM-202-Regel sind mit den drei Knöpfen nach
  // `./ArtikelAktionen.tsx` gezogen — WORT FÜR WORT, mitsamt ihren
  // Herleitungen. Diese Datei kannte den Zustand nur, weil die Knöpfe hier
  // standen; sie stehen jetzt am Artikelende (§6.6, und eine Datei weniger
  // gegen die 800er-Schwelle).
  const label = labelMitBereich(e.artikelLabel, e.artikel);
  // KURZ-Zitat («Art. 957 OR») — Fundstellen-Signal für den Entscheid-Sprung
  // (LeitfallZeile `normZitat` → ?norm=). MUSS knapp bleiben, sonst matcht der
  // EntscheidLeser die zitierende Erwägung nicht mehr.
  const zitat = `${label} ${erlass.kuerzel}`;
  // VOLL-Zitat (W2·5d G2b) für die Kopier-Aktion: Fundstelle + SR + Stand (§7 a–d).
  const zitatVoll = baueZitat(erlass, label);
  // EID-2 (W2·5d §12): Verifizier-Deep-Link «amtliche Fassung an genau dieser
  // Stelle» — die per-Artikel-ELI-URL des Snapshots (quelleUrl#art_…), validiert
  // im Builder (§5-SSoT; Kanton/aufgehoben/Synthese-Suffix ⇒ null = KEIN Link, §8).
  const amtlich = verifizierLinkArtikel(e, erlass);
  // Vollständig aufgehobener Artikel → dezent + standardmässig eingeklappt
  // (Auftrag David: «nicht so präsent», aufklappbar über den ▾/▸-Toggle).
  // G-AUFH-ART: e.aufgehoben (amtlich verifiziertes Adapter-Signal) hat Vorrang
  // vor der Text-Heuristik, falls gesetzt (s. artikelGanzAufgehoben-Doku).
  const ganzAufgehoben = artikelGanzAufgehoben(e.bloecke, e.aufgehoben);
  // Welche Fussnoten der Apparat zeigt und in welcher Reihenfolge:
  // `./ArtikelLeser.fussnoten` (§6.6-Split, Herleitung dort).
  const fussAnzeige: Fussnote[] = fussnotenAnzeige(e, fussnoten);
  const [artOffen, setArtOffen] = useState(!ganzAufgehoben); // einzelner Artikel ein-/ausklappbar; aufgehoben → zu
  // Marker-Verteilung (Absatz · Item · Randtitel · Artikelebene) samt Inline-
  // Positionen und Klassen: `./ArtikelLeser.fussnoten` (§6.6-Split, Namen
  // unveraendert).
  const {
    fnProAbsatz, fnProItem, fnArtikelEbene, fnProSektion, fnInlineAbsatz, fnInlineItem, fnKlasse,
  } = verteileFussnoten(fussAnzeige, e.bloecke);
  // Marker nur, wenn der Artikel offen ist (Ziel <p id=fn-…> lebt im artOffen-Block):
  // sonst öffnete der sichtbare Marker am eingeklappten Artikel ein leeres Popover
  // (toter Bedienpfad — typisch bei aufgehobenen Artikeln, Default eingeklappt).
  // W2·5d G2b (Fussnoten-Unifizierung): der Marker rendert jetzt IMMER (nur an
  // `artOffen` gebunden, nicht mehr am alten `fussnotenAuf`-React-Schalter) —
  // amtliche Substanz bleibt im DOM (R9/§8, Ctrl+F/Print/Screenreader). Die
  // Prominenz steuert allein der data-fussnoten-CSS-Toggle (index.css): «AUS»
  // DÄMPFT, versteckt nie. So gibt es EINE Fussnoten-Bedienung statt zweier.
  // A31 (David 16.7.2026): der Fussnoten-Marker klebt auf Fedlex DIREKT an der
  // Artikelnummer (kein Abstand). Darum KEIN `ml-0.5` mehr und der Marker sitzt im
  // selben Inline-Kontext wie das «Art. N»-Label (unten in whitespace-nowrap
  // gewickelt), nicht als eigenes flex-Kind mit gap-x-2.
  // W2·5i: `data-fn-klasse` sitzt am PER-NR-Wrapper, nicht (nur) am FnRef — sonst
  // bliebe beim Ausblenden eines A-Markers dessen Trenn-Komma stehen. Der Wrapper
  // trägt Komma UND Marker, verschwindet also als Ganzes.
  const fnMarker = artOffen && fnArtikelEbene.length > 0
    ? <span data-fn-marker>{fnArtikelEbene.map((nr, i) => (
        <span key={nr} data-fn-klasse={fnKlasse[nr]}>{i > 0 && <span className="align-super text-[length:var(--hochgestellt)] text-ink-500">,</span>}<FnRef artikel={e.artikel} nr={nr} /></span>
      ))}</span>
    : null;
  // VERWEISE: im Artikel genannte, aufloesbare (Bund-)Normverweise als Chips am
  // Fuss sammeln — Herleitung und Dedupe in `./ArtikelLeser.fussnoten` (§6.6-Split).
  const verweise: string[] = sammleVerweise(e.bloecke);
  // Aufhebungsnotiz (G16/#3): die amtliche «Aufgehoben durch … (AS …)»-Notiz eines
  // voll aufgehobenen Artikels liegt als artikel-Ebene-Fussnote im Snapshot
  // (absatz/item = null). M2 (David 29.6.2026) / G2b: sie ist eine Fussnote und liegt
  // wie jede Fussnote IMMER im DOM (data-fn-apparat, per data-fussnoten-CSS dämpfbar,
  // R9); die Statuszeile «· aufgehoben» (Artikelzustand) bleibt davon unberührt
  // immer sichtbar. Wortlaut nie erfunden (§1).
  const aufhebungNotiz: Fussnote[] = ganzAufgehoben
    ? fussAnzeige.filter((f) => f.absatz == null && f.item == null)
    : [];
  // ═══ W2·24-R6b · DIE FORM DES ARTIKELS ══════════════════════════════════
  // Der Rahmen (`v3/rahmenSpalten.ts`) hat gerechnet, wie viel die Lese-Zelle
  // trägt; hier wird daraus Markup. ZWEI Formen, EIN Baum:
  //   'zeile' — Ist-Form: Randtitel als Zeile über dem Artikel, Beiwerk
  //             darunter. Gilt im Pane, auf dem Handy, in der Trefferliste und
  //             ohne Provider (V1) — dort ändert sich nichts (§6).
  //   'breit' — Randtitel + Fassungsdatum IM ARTIKELKOPF, die Bezüge als EINE
  //             aufklappbare Zeile darunter. Keine Randspalten mehr.
  //
  // BIS R6 STANDEN HIER DREI FORMEN mit zwei Randspuren (Marginalie links 150 px,
  // Randnotizen rechts 210 px). Sie sind auf Davids Befund vom 6.9.2026 gefallen
  // — sie nahmen der Lese-Zelle 432 px. Wohin ihr Inhalt gewandert ist und warum:
  // `../v3/satzspiegel.ts`.
  const spiegel = useSatzspiegel();
  // In der TREFFERLISTE bleibt jeder Artikel in Zeilenform: sie steht in einer
  // eigenen, schmalen Fläche und soll den Treffer zeigen, nicht seinen Apparat.
  const kopfForm = spiegel === 'breit' && !imTreffer;
  // «Rechnen» in der Bezüge-Zeile (seit W2·24-R6): statische Kantentabelle, kein
  // Ladepfad — Herleitung in `randNotizWerkzeuge.ts`.
  // D34: nicht mehr an `kopfForm` gebunden. Seit die Bezüge-Zeile in BEIDEN
  // Formen am Artikelfuss steht, fragt auch die Zeilenform nach der Rubrik; die
  // frühere Form-Weiche (samt der geteilten Leerliste `LEERE_WERKZEUGE`, die
  // nur ihr Sonst-Zweig war) ist ersatzlos gefallen. Kein Ladepfad, kein Netz —
  // ein Nachschlag in einer statischen Tabelle je Artikel (§15).
  const werkzeuge = werkzeugeAmArtikel(erlass?.key, e.artikel);
  // ── W2·24-D40 (David 7.9.2026) · DER FASSUNGS-SLOT IM KOPF IST GEFALLEN ──
  // Wörtlich: «und wieso ist fassung nicht auch unten am artikel?». Hier stand
  // bis D40 `histImKopf`/`histSlot` — der Slot `[data-hist-slot]` mit «Gilt
  // seit … ▸», in der Breitform neben dem Randtitel (`.lr7-fassung`), in der
  // Zeilenform im Beiwerk. Beide Orte sind ERSATZLOS gelöscht, nicht bewacht
  // (§17-Gegengewicht): die Auskunft ist jetzt die Rubrik «Fassung» der
  // Funktionszeile am Artikelende, wo alle anderen artikelbezogenen Rubriken
  // seit D34/D35 stehen (`./ArtikelLeser.bezuegeFuss.tsx`, Marke `reg: 'f'`).
  //
  // MIT DEM SLOT FÄLLT SEINE RESERVE (`mt-4 min-h-beiwerk`, §15.2/Ä26, und die
  // `:empty`-Zeilenbox aus W2·24-CI). Sie fing einen idle eintreffenden Shard
  // ab, der jetzt nichts mehr im Lesekörper aufblendet: die Zeitleiste rendert
  // erst auf Klick, die Marke wächst in eine Zeile hinein, die ohnehin auf die
  // Zähl-Datei wartet. Eine Reservierung ohne Gegenstand wäre die Phantom-Lücke,
  // gegen die Ä26 sie überhaupt artikelweise gemacht hat (§8).
  //
  // WAS DER DRUCK BEHÄLT, steht unten in der Beiwerk-Zone (`[data-hist-druck]`).
  //
  // Der Randtitel steht seit dem §6.6-Split (W2·24-F) als Bauteil in
  // `./ArtikelLeser.kopfteile` — beide Satzspiegel-Formen zeigen DASSELBE
  // Markup an zwei verschiedenen Orten, und genau darum ist es ein Bauteil
  // (Herleitung dort). Hier bleibt er ein Wert, weil jede Form ihn an ihrer
  // eigenen Stelle einsetzt.
  /** Trägt die Randtitel-Zeile der ZEILENFORM überhaupt etwas? Ohne das stünde
   *  der Registerfarben-Strich als Balken über einer leeren Zeile — Lärm statt
   *  Gliederung. In React entschieden und nicht per `:has()`: eine
   *  `:has()`-Regel über 1686 Artikel ist genau die Bauart, die
   *  W2·19-GLIEDERUNG/F1 als Scroll-Bremse nachgewiesen hat.
   *  Wertgleich mit der Null-Bedingung von `RandTitel` — die Breitform prüft
   *  darum ebenfalls hiergegen (§6-Split W2·24-F, Herleitung dort). */
  const randInhalt = (marg != null && marg.length > 0) || !!e.titel;
  const randTitel = (
    <RandTitel marg={marg} margBasis={margBasis} titel={e.titel} artikel={e.artikel}
      markerOffen={artOffen} fnProSektion={fnProSektion} fnKlasse={fnKlasse} />
  );
  // W2·5d G3b (③/⑤): Anhang/Protokoll tragen einen kräftigeren Struktur-Trenner
  // (rule-struktur statt rule-artikel) + mehr Weissraum — so hebt sich jeder
  // Anhang-Block klar vom Normtext und vom Vor-Anhang ab (Linien-Kanon-Rolle
  // «Struktur-Trenner», wie oberste Sektionen/Ingress). Reine Darstellung (§3).
  return (
    <article id={`art-${e.artikel}`} data-normtext-linie data-anhang={istAnhang ? '' : undefined}
      // W2·5d U-POSITION/A2: inhalts-proportionale content-visibility-Platzhalter-
      // höhe (überschreibt den flachen 320px-Default der .nt-art-cv-Klasse) → der
      // Scrollbalken wird proportional. `content-visibility:auto` (Klasse) bleibt;
      // reiner Platzhalter-Schätzwert, kein DOM-/Inhalts-Eingriff (§15/1).
      style={{ containIntrinsicSize: `auto ${schaetzeArtikelHoehe(e)}px` }}
      // ─── W2·19-GLIEDERUNG / F1: Hover-Spotlight ERSATZLOS entfernt ──────────
      // WAR: `transition duration-200 group-has-[[data-lese]:hover]/lese:opacity-80
      //       has-[[data-lese]:hover]:!opacity-100 has-[[data-lese]:hover]:z-[5]`
      // (Commit 820db9dc1, 18.6.2026 — «andere Artikel dimmen», Davids Wunsch).
      //
      // WARUM WEG (Messung, bibliothek/betrieb/gliederung-perf-diagnose-2026-08-08.md):
      // die Kette hing an JEDEM der 1686 <article> des OR. Jedes Hover-Kippen beim
      // Scrollen startete 1686 gleichzeitige Opazitäts-Transitionen (4 Ereignisse je
      // Element) — gemessen 142 208 Transition-Ereignisse je 60-Schritt-Scroll,
      // React-Root-Dispatcher 284 499 Aufrufe/7 s. Anteil an der Blockierzeit ~78 %
      // (U1); die verbleibenden ~20 % (U2) sind die `:has()`-Invalidierung über die
      // ganze Lesespalte, die mit der Kette ebenfalls entfällt. Belegte Wirkung:
      // Frame-Median 33.3 → 16.7 ms (30 → 60 fps) @1×, TBT @4× 8845–9003 ms →
      // Boden 283–297 ms (Maus-am-Rand-Referenzmessung).
      //
      // ERSATZLOS auf Entscheid David 8.8.2026 abends: «der Dimm-Effekt kann auch weg
      // — Gliederung ist wichtiger». Damit entfällt auch der im Dossier aufgeschobene
      // Scrim-Ersatz (F1b); es wird KEIN anderes Mittel eingesetzt.
      //
      // WAS BLEIBT: `group` (der Aktions-Slot der Kopfzeile hängt mit
      // `group-hover:opacity-100` daran, s. u.), `relative z-base` (unveränderte
      // Stapelordnung des Ruhezustands — nur der Hover-Sprung auf z-[5] fällt weg;
      // `z-base` = C3-Rolle für den Wert 0, s. index.css bei --z-base).
      // §15-Logikverlust: keiner — reine Darstellung (§3), Normtext, Anker, Ctrl+F,
      // Druck und Golden-Ausgaben sind unberührt.
      className={`lr-satz nt-art-cv group relative z-base nt-anker border-t ${istAnhang ? 'border-rule-struktur pt-9 mt-9' : 'border-rule-artikel pt-7 mt-7'} first:border-t-0 first:mt-0 first:pt-0`}>
      {/* ═══ W2·24-R6b · DER ARTIKEL: KOPF · WORTLAUT · BEIWERK ═════════════
          Bis R6 lagen hier drei Grid-Spalten (Marginalie · Text · Randnotizen).
          Beide Randspuren sind gefallen (Auftrag David 6.9.2026, Herleitung in
          `../v3/satzspiegel.ts`); übrig bleibt der EINE Fluss, den die
          Zeilenform immer schon hatte — nur trägt der Artikelkopf in der
          Breitform jetzt den Randtitel, das Fassungsdatum und die Bezüge-Zeile.

          Die Zeilenform ist damit unverändert: Randtitel als Zeile über der
          Artikelnummer (Auftrag David 26.6.2026 — Fedlex-Stil; bleibt auch bei
          eingeklapptem/aufgehobenem Artikel sichtbar), Beiwerk unter dem
          Wortlaut. */}
      {!kopfForm && (
        <div className="lr-rand">
          {/* Registerfarben-Strich: ausserhalb der Randspalte 0 px hoch
              (`index.css`, `.lr-reg`) — er darf die Zeilenform nicht um eine
              Zeile verschieben. */}
          {randInhalt && <span aria-hidden className="lr-reg" />}
          {randTitel}
        </div>
      )}
      <div className="lr-text">
        {/* ── (a) BREITFORM: Randtitel + Fassungsdatum ÜBER der Artikelnummer ──
            Auftrag David 6.9.2026: der Randtitel als kursive Literata-Zeile im
            Artikelkopf, das Fassungsdatum klein daneben. Beides stand bis R6
            links in einer 150-px-Spalte, die dem Text die Breite nahm. Der
            Fassungs-Slot wandert MIT SEINER RESERVE (`min-h-beiwerk`), damit der
            späte Shard-Resolve weiter reservierten Platz füllt statt zu schieben
            (§15.2). */}
        {/* W2·24-F: `randInhalt` statt `randTitel` — seit dem §6.6-Split ist der
            Randtitel ein Bauteil und damit immer ein Element; die Frage «steht
            überhaupt etwas darin?» beantwortet der Wert, den die Zeilenform
            oben ohnehin schon bildet (wertgleich mit der Null-Bedingung von
            `RandTitel`). */}
        {/* D40: die Bedingung ist wieder die EINE Frage «trägt der Randtitel
            etwas?». Die beiden anderen Glieder (`fussAnzeige.length > 0 ||
            historie`) standen nur dafür da, den Fassungs-Slot daneben zu
            tragen — mit ihm sind sie gefallen; ohne Randtitel wäre der Kopf
            sonst ein leerer Kasten (§8/§13). */}
        {kopfForm && randInhalt && (
          <div className="lr7-kopf">
            <div className="lr7-kopf-titel">{randTitel}</div>
          </div>
        )}
        {/* Kopfzeile des Artikels: «Art. N» als Anker über dem Fliesstext. */}
        <div className="mb-1.5">
          {/* Artikelnummer-Zeile: «Art. N» als Anker; Zitat/Link rechtsbündig INLINE
              (ml-auto) statt als eigene Zeile darunter — schliesst den Abstand zum
              ersten Absatz (Auftrag David 26.6.2026, P8). */}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {/* M9: aufgehobener Artikel trägt kein Klapp-Chevron (nichts zu entfalten —
                der Wortlaut ist «…»), aber EINEN gleich breiten w-4-Platzhalter wie der
                Chevron-Knopf der aktiven Artikel → die «Art. N» fluchten bündig auf
                EINER Ebene (Art. 349–358 ZGB bündig zu Art. 348). Beide inline-flex
                w-4 justify-center, damit die Glyphe nicht die Spaltenbreite verschiebt. */}
            {ganzAufgehoben
              ? <span className="inline-flex w-4 shrink-0" aria-hidden />
              : <button type="button" onClick={() => setArtOffen((v) => !v)} aria-expanded={artOffen}
                  // WCAG 4.1.2 · konstanter, den Artikel BENENNENDER Name
                  // (QS-UI Folgeschritt, 5.9.2026; in Teilpass (e) noch
                  // zurückgestellt, weil er Test-Zeilen berührt).
                  // Vorher: `artOffen ? 'Artikel einklappen' : 'Artikel
                  // ausklappen'`. Gemessen an /gesetze/bund/GEBV_HREG: ZWÖLF
                  // Knöpfe mit wortgleichem Namen «Artikel einklappen» auf EINER
                  // Seite (auf dem OR 1598 bei derselben Erhebung über alle
                  // aria-expanded-Knöpfe der Artikel) — in der Knopf-Liste eines
                  // Screenreaders ununterscheidbar; dazu wechselte der Name beim
                  // Klick, worauf Sprachsteuerung ins Leere zielt. Jetzt trägt
                  // der Name den Artikel, den er klappt, den Zustand trägt
                  // allein `aria-expanded` — dasselbe Muster wie beim Zwilling
                  // `SektionBaumTOC.tsx` (dort steht die ausführliche
                  // Herleitung). Bewacht von `ARIA_ZUSTANDSNAME`
                  // (eslint.config.js); die Ausnahme aus Teilpass (e) ist
                  // ersatzlos weg, das Tor ist hier wieder scharf.
                  aria-label={`«${label}» auf- und zuklappen`}
                  // F3/C5 (29.8.2026): ink-300 → ink-500 — einzige Affordanz
                  // des Klapp-Knopfes, gemessen 2.28:1 hell / 2.34:1 dunkel
                  // gegen `--paper`, unter der F2-Schwelle 3:1 für Nicht-Text.
                  // Herleitung ausführlich am Zwilling in `SektionBaumTOC.tsx`.
                  className="inline-flex w-4 shrink-0 justify-center text-micro text-ink-500 hover:text-brass-700">{artOffen ? '▾' : '▸'}</button>}
            {/* Anhang/Protokoll (③/⑤): «Anhang N»/«Protokoll N …» als Struktur-
                Überschrift (font-display, Titel-Grösse) statt als Artikelnummer
                (num/bold) — es ist ein Block-Titel, keine zitierbare Bestimmung. */}
            {/* A31: «Art. N» + Fussnoten-Marker als EIN Inline-/flex-Kind (whitespace-
                nowrap) — der Marker klebt direkt an der Nummer (kein gap-x-2, kein
                Umbruch auf eine eigene Zeile), genau wie auf Fedlex. */}
            <span className="whitespace-nowrap">
            {imTreffer && onSpringe ? (
              <button type="button" onClick={() => onSpringe(e.artikel)}
                title="Im Volltext zu diesem Artikel springen"
                className={istAnhang
                  ? 'font-display text-h3 font-semibold text-ink-900 hover:text-brass-700 text-left'
                  : `num text-base font-bold tracking-wide hover:text-brass-700 text-left ${ganzAufgehoben ? 'text-ink-500 font-normal' : 'text-ink-900'}`}>{label}</button>
            ) : (
              <a href={`#art-${e.artikel}`} className={istAnhang
                ? 'font-display text-h3 font-semibold text-ink-900 hover:text-brass-700 no-underline'
                : `num text-base font-bold tracking-wide hover:text-brass-700 no-underline ${ganzAufgehoben ? 'text-ink-500 font-normal' : 'text-ink-900'}`}>{label}</a>
            )}{fnMarker}
            </span>
            {/* aufgehoben gedämpft, aber ink-500 (WCAG 4.5:1 hell+dunkel) statt
                ink-400 (3.2–3.6:1) — essentieller Link-Text, kein incidental. */}
            {ganzAufgehoben && <span {...{ [SUCH_META]: '' }} className="text-xs italic text-ink-500">· aufgehoben</span>}
            {/* ── W2·5m · NACHBAR-ARTIKEL «‹ Art. 89 · Art. 90a ›» ───────────
                Muster gesetze-im-internet/dejure/buzer, hier als Anker im
                selben Dokument (der Leser zeigt den ganzen Erlass auf EINER
                Seite — der Pfeil blättert, er lädt nicht nach).
                NICHT in der Suchsicht (`imTreffer`): dort ist die Lesespalte
                durch die Trefferliste ersetzt, `#art-…` zeigte ins Leere. Die
                Artikelnummer daneben trägt in diesem Modus aus demselben Grund
                schon einen `<button>` statt eines Ankers. */}
            {!imTreffer && nachbarn && <ArtikelNachbarn nachbarn={nachbarn} />}
            {/* ── W2·24-D35-F1 (David 7.9.2026) · HIER STANDEN DIE AKTIONEN ──
                «Zitat · Link · Amtliche Fassung ↗» sassen rechtsbündig in
                dieser Kopfzeile — und trugen `opacity-0` bis Hover, Fokus oder
                Touch (gemessen 7.9.2026: Deckkraft 0). Mit dem Variante-A-
                Entscheid stehen sie am ARTIKELENDE in der Funktionszeile,
                dauerhaft sichtbar (`./ArtikelAktionen.tsx`, eingehängt unten am
                `<ArtikelBezuegeFuss aktionen=…>`).

                ERSATZLOS gelöscht, nicht zusätzlich gebaut (§5/§17-Gegengewicht):
                zwei Orte für dieselbe Aktion wären genau die Dopplung, die D35
                abräumt. Mit der Zeile fällt auch ihr `data-such-meta`-Bedarf
                weg — die Suche kann in dieser Kopfzeile keine unsichtbaren
                Fundstellen mehr malen (Bug-Check B1, 4.8.2026), weil hier keine
                Bedienwörter mehr stehen. */}
            {/* Amtliche Aufhebungsnotiz (eigene Zeile, dezent eingerückt) — M2: erst
                auf Klick (hinter dem Fussnoten-Schalter), wie jede andere Fussnote.
                Die Statuszeile «· aufgehoben» oben bleibt unabhängig immer sichtbar. */}
            {ganzAufgehoben && aufhebungNotiz.length > 0 && (
              /* S2: `text-leser-fn` wie der Haupt-Apparat am Artikelfuss. Beide tragen
                 `data-fn-apparat`, sind also dieselbe Rolle — bis S2 lief dieser hier
                 auf `text-xs` (12 px) und der andere auf 11 px, zwei Grössen für eine
                 Sache (§5). Der eigene `leading-snug` fällt mit: die Zeilenhöhe kommt
                 aus der Stufe. */
              /* T3 (29.8.2026): dieselbe Feinschrift-Spalte wie der Haupt-Apparat
                 am Artikelfuss — es ist dieselbe Rolle (§5). */
              <span data-fn-apparat className="basis-full pl-6 max-w-kleintext text-leser-fn text-ink-500">
                {aufhebungNotiz.map((fn, i) => (
                  <span key={i}>{i > 0 && '; '}{fnTextMitLinks(fn)}</span>
                ))}
              </span>
            )}
          </div>
          {/* G23 (M8): Delegationsnorm-Grundlage «(Art. N ArG)» — Fedlex zeigt sie
              dezent unter der Überschrift; amtlicher Inhalt (§2), bisher verworfen.
              Immer sichtbar (auch eingeklappt), wie der Randtitel. */}
          {e.grundlage && (
            <div className="mt-0.5 text-xs italic leading-snug text-ink-500">{e.grundlage}</div>
          )}
        </div>
        {/* Rechte Lesespalte: grosse Serifenschrift, hängende Messing-Absatznummern.
            overflow-x-clip + min-w-0: bei geteiltem/schmalem Bildschirm darf der
            Artikel-Block (hängender Absatz-Einzug pl-9/-indent-9) NICHT über die
            Spalte hinausragen → sonst wurde Text rechts abgeschnitten (Befund David
            25.6.2026). Der Wortumbruch im Absatz (overflow-wrap:anywhere) bleibt. */}
        {artOffen && (
        <div className="max-w-normtext min-w-0 overflow-x-clip">
          <ArtikelBody bloecke={e.bloecke} artikel={e.artikel} passus={{ absatz: null }} autolink
            zitierKontext={{ artikelLabel: label, kuerzel: erlass.kuerzel, fassung: erlass.stand, permalinkBasis: `${basisPfad}#art-${e.artikel}` }}
            fnProAbsatz={fnProAbsatz} fnProItem={fnProItem}
            fnInlineAbsatz={fnInlineAbsatz} fnInlineItem={fnInlineItem}
            fnKlasse={fnKlasse}
            intern={intern}
            /* S2 (Pos. 19, F3 = V2 «amtsnah kompakt», David 17.8.2026 am Bildbogen):
               `text-leser-text` (17 px / lh 1.55) ERSETZT das Paar
               `text-body-l leading-[1.65]`. Der rohe Arbitrary-Override fällt damit
               weg — die Zeilenhöhe gehört zur Stufe (Design-Grundlage Kap. 8 Nr. 4:
               «kein fixer Leading-Wert über alle Grössen»); Wächter
               `src/tests/leser-typo-tokens.test.ts`. WCAG 1.4.8 gemessen @1440:
               lh 1.55 ≥ 1.5 und ≤ 80 ch (Lesemass `max-w-normtext` 42 rem
               unverändert).

               EINE ZAHL, EINE MESSUNG (Nachzug 17.8.2026, Arch-Prüfer 9): hier stand
               «53–58 ch», im Fahrplan «73 / 71 / 61 ch» — zwei Zahlen für dieselbe
               Sache. Massgeblich ist die Methode des Tors (`e2e/leser-lesemass.e2e.ts`:
               längster mehrzeiliger Fliesstext-Absatz, Textlänge / Zeilenkisten).
               Damit @1440 gemessen: ZGB 68 · OR 71 · StPO 73 · VMWG 74 · StGB 77 ch.
               Die 80-ch-Decke der WCAG hält überall; die engere HAUSdecke von 75 ch
               nicht mehr überall (StGB 77) — Notiz an der Schwelle im Tor und als
               offener Punkt im Vollzugsvermerk S2. */
            className="space-y-3.5 font-serif text-leser-text text-ink-800" />
          {/* ═══ BEIWERK-ZONE (S2 · Pos. 13, Fahrplan Kap. 4c / Grundlage Kap. 3) ═══
              EIN benannter Ort für alles, was unter dem Wortlaut steht: Verweis-Chips ·
              Rechtsprechung (ab H3 der leise Zähler «⚖ n Entscheide →») · Fassungs-
              Zeile · Fussnoten-Apparat. Vorher lagen die vier Blöcke unverbunden
              nebeneinander, jeder mit eigenem Abstand und der Historie-Slot mit einer
              EIGENEN Reservierung — es gab keine Zone, die man reservieren, messen oder
              per CSS greifen konnte. `data-beiwerk` ist der Vertrag (ein
              Daten-Attribut, kein Utility-Klassenname — Lehre aus der
              `.text-body-l`-Kopplung der Schriftskala, index.css).

              KEINE eigene Reservierung an der Zone, und das ist gemessen, nicht
              gespart: das einzige spät eintreffende, heute unreservierte Element ist
              die Rechtsprechungs-Zeile, und ihre Reservierung ist bewusst verworfen
              (§15.2 — sie zöge Weissraum in fast jeden Artikel; gemessen 17.8.2026
              @1440 tragen 326/480 Artikel der StPO und 376/1686 des OR eine solche
              Zeile). Die Reservierung sitzt darum weiterhin an dem Element, das der
              Schalter «Änderungsvermerke» mit ausblendet (`[data-hist-slot]`, S1) —
              eine Reservierung, die den Schalter überlebt, wäre die Phantom-Lücke,
              gegen die S1 sie überhaupt an den Slot gehängt hat.

              ABWEICHUNG ZUM ABNAHME-KRITERIUM DER ETAPPE, offengelegt (§7): «Das
              Umschalten aller drei Schalter erzeugt an keinem Artikel einen
              Layout-Sprung» ist mit dem David-Entscheid **A1 vom 5.7.2026** («AUS» =
              verschwinden statt dämpfen) nicht erfüllbar. Gemessen 17.8.2026 @1440
              trägt der Fussnoten-Apparat je Artikel 27–187 px; ihn höhenfest zu
              reservieren hiesse, bei «Fussnoten: aus» ein bis zu 187 px hohes leeres
              Loch stehen zu lassen — genau das Dämpfen, das A1 verboten hat. Eine
              feste Mindesthöhe kann nur Elemente auffangen, die KLEINER als der Boden
              sind. Erfüllt und gemessen ist deshalb die Zusage, die zählt: der
              Lade-Sprung (CLS) bleibt bei 0.004–0.016; das Umschalten ist
              klick-getrieben, liegt binnen 500 ms nach der Eingabe und ist damit per
              Definition kein unerwarteter Sprung. Zahlen im Vollzugsvermerk S2. */}
          <div data-beiwerk>
          {/* ── W2·24-D34 · WAS HIER NICHT MEHR STEHT ───────────────────────
              Bis D33 trug das Beiwerk der ZEILENFORM einen ZWEITEN Artikelfuss:
              eine offene Verweis-Chip-Reihe und daneben die unbedingte
              Rechtsprechungs-Zeile (`BezuegeZeile`, sonst `LeitfallZeile`).
              Derselbe Fachinhalt wie die Rubriken «Verweise» und «Entscheide»
              der Breitform — nur in anderer Gestalt, an anderem Ort und aus
              einer anderen Prop: zwei Wahrheiten am selben Artikel (§5).

              Beide Blöcke sind mit D34 ERSATZLOS gelöscht, nicht bewacht
              (§17-Gegengewicht). Verweise, Entscheide, Materialien und Rechner
              stehen in BEIDEN Formen im EINEN Bezüge-Fuss unter diesem Block
              (`ArtikelBezuegeFuss`, ganz unten) — und erst auf Aufklappen.

              NEBENWIRKUNG, ausdrücklich erwünscht: Pos. 12 kann es baulich
              nicht mehr geben. Die gelöschte Zeile war die Stelle, an der der
              eintreffende Bezugs-Shard @390 in den Lesekörper hineinwuchs
              (gemessen an der StPO, Artikel-y 1385→1493→…; `leser-v3-kontext-
              cls` (b)). Ein geschlossenes `<details>` legt seinen Inhalt nicht
              ins Layout — die Zusage hängt jetzt an der Bauart, nicht mehr an
              der Disziplin, eine Prop wegzulassen. */}
          {/* ═══ W2·24-D40 (David 7.9.2026) · WAS HIER NOCH STEHT: DER DRUCK ═══
              Wörtlich: «und wieso ist fassung nicht auch unten am artikel?».
              Auf dem BILDSCHIRM steht die Fassungs-Auskunft seither in der
              Funktionszeile am Artikelende, als Rubrik «3 Fassungen ›» neben den
              anderen (`./ArtikelLeser.bezuegeFuss.tsx`). Der reservierte Slot
              `[data-hist-slot]`, den die Absätze darunter beschreiben, gibt es
              nicht mehr — weder hier noch im Kopf.

              AUF DEM PAPIER ÄNDERT SICH NICHTS, und das ist der Grund für dieses
              Element. Die Funktionszeile ist `print:hidden` (sie ist Bedienung,
              `./Funktionszeile.tsx`); ihr die Fassung zu überlassen hiesse, dem
              Ausdruck den Stand des Artikels zu nehmen — die Auskunft, die ein
              Aktenstück am dringendsten braucht (§8, dieselbe Sorge wie die
              Stand-Zeile im Erlass-Kopf, `e2e/druck-fundstellen-z2`).

              KEINE ZWEITE WAHRHEIT (§5): es ist DIESELBE Komponente mit
              DENSELBEN Daten, nur eine zweite Projektion — Bildschirm auf Klick,
              Papier immer. Und es ist BYTE-GLEICH zu dem, was der Drucker bis
              D40 bekam: dort war die Zeitleiste zugeklappt, also stand auch nur
              das Badge «Fassung · Gilt seit …» auf dem Blatt (`zeitleiste`
              bleibt darum aus, §2b — der Druckstand wird gehalten, nicht
              nachgeführt).

              KOSTET NICHTS ZUSÄTZLICH: die Komponente wurde bis D40 an genau
              dieser Stelle für JEDEN Artikel gerendert. `hidden print:block` ist
              `display:none` am Bildschirm — kein Layout, kein Paint, keine
              Reserve (die 24-px-Reserve ist mit dem Slot gefallen, s. o.).
              Die Dreier-Wahl greift weiter (`html[data-vermerke]` auf
              `[data-hist-druck]`, `src/index.css`): sie stand schon bisher
              ausserhalb von `@media screen`, weil der Fassungs-Slot ABGELEITET
              ist und der Wahl auch im Druck folgt. */}
          <div data-hist-druck className="hidden print:block">
            <ArtikelHistorieZeile historie={historie} />
          </div>
          {/* ── WAS HIER BIS D40 STAND (§0 Ziff. 2b: ERGÄNZT, nicht ────────────
              nachgeführt). Die folgenden Absätze beschreiben den reservierten
              Fassungs-Slot und seine Messungen vom 20.7./17.8.2026. Sie bleiben
              Wort für Wort stehen: sie belegen, warum die Reserve gebaut wurde
              und was sie gemessen verhindert hat. Der Slot selbst ist mit D40
              gefallen (Herleitung oben), die Belege altern nicht. */}
          {/* G-HIST-UI: «Gilt seit»-Badge + aufklappbare Fassungs-Timeline dieses
              Artikels (aus dem erlass-lokalen Historie-Shard, idle geladen). Am
              Artikel-Fuss wie Verweise/Leitfälle. §15.2: der Slot steht ab dem
              ERSTEN Render und reserviert die eine Chip-Zeile (`min-h-beiwerk`,
              Token — gemessen exakt 24 px, deterministisch über alle Artikel), damit
              der idle-Shard-Resolve reservierten Platz FÜLLT statt sichtbare Artikel
              zu schieben (Messung 20.7.: sonst CLS 0.0227 statt 0.0002 unter 6×). Der
              Aussenabstand sitzt hier am Slot, nicht in der Zeile — sonst fallen
              reservierte und gefüllte Höhe auseinander. */}
          {/* S8: «Gilt seit»-Badge und Fassungs-Timeline sind abgeleitete
              Metadaten, kein Wortlaut (§4.4) — `data-such-meta`.

              S1 (Kap. 4f, Befund K4): der Slot trägt `data-hist-slot`, damit der
              Schalter «Änderungsvermerke» ihn MIT ausblenden kann. Bis S1 hing die
              «Fassung»-Zeile an gar keinem Schalter — bei «Änderungsvermerke aus»
              blieb die Fassungshistorie als einzige Historie-Spur im Lesetext
              stehen. Ausgeblendet wird der SLOT, nicht nur die Zeile darin: sonst
              bliebe seine reservierte Höhe (`mt-4 min-h-beiwerk` = 16+24 px) als
              Phantom-Lücke unter jedem Artikel zurück, und «aus» hätte doch eine
              Spur hinterlassen. Der Inhalt bleibt im DOM (A1-Mechanik, David
              5.7.2026: `display:none`, nie gelöscht) und «an» stellt ihn
              vollständig wieder her.

              S2 · Ä26 (Phantom-Lücke, Ästhetik-Prüfer 17.8.2026): die Reservierung
              stand bisher unter JEDEM Artikel JEDES Erlasses — auch dort, wo nie eine
              Fassungs-Zeile eintreffen kann (auf BS-640.100 sind das 292 von 292).
              Sie folgt jetzt dem Datenmodell, und zwar ARTIKELWEISE.

              DIE FRAGE, die die Reservierung stellen MUSS: «kann in DIESEM Slot je
              eine Fassungs-Zeile eintreffen?» Sie ist am Datenmodell exakt
              beantwortbar, weil der Erzeuger sie selbst so stellt:
              `scripts/normtext/historie-generieren.ts` baut die Shard-Einträge
              AUSSCHLIESSLICH aus den gespeicherten Fussnoten des jeweiligen Artikels
              (`artikel[<token>].fussnoten` → `baueArtikelHistorie`). Ein Artikel ohne
              Fussnote kann darum keinen Eintrag bekommen — das ist eine
              GENERATOR-INVARIANTE, keine Korpus-Zufälligkeit. Empirisch gegengeprüft
              (17.8.2026, alle 209 Shards gegen alle Struktur-Sidecars): 24 511
              Artikel, 13 093 mit Historie-Eintrag, davon **0** ohne Fussnote.

              KEINE EBENEN-WEICHE. Ein früherer S2-Zwischenstand hing die Reserve an
              `erlass.ebene === 'bund'`. Das traf den Korpus von heute (209 Shards,
              alle Bund — der Generator liest nur `struktur/bund`), war aber ein
              ERLASS-SONDERPFAD in einer Komponente, die erlass-neutral rendern soll:
              die Eigenschaft heisst «kann eine Fassungs-Zeile tragen», nicht «ist
              Bundesrecht». Genau diesen Fehler hat S1-B3 an derselben Mechanik schon
              einmal vermieden (`zaehleAenderungsvermerke`, berechnungen.ts: «das
              entscheidet das DATENMODELL, nicht die Herkunft»); wäre `ebene`
              stehengeblieben, hätte der Tag, an dem der Generator Kantonsrecht
              aufnimmt, eine stille Phantom-Lücke erzeugt statt eines Testfehlers.

              WARUM ARTIKELWEISE UND NICHT ERLASSWEISE: die Shard-Existenz (404 vs.
              Treffer) ist erst NACH dem idle-Fetch bekannt — also genau dann, wenn
              die Zeile schon eintrifft. Eine Reserve, die auf diese Antwort wartet,
              käme zu spät und müsste bei 404 wieder einfallen (ein Sprung nach oben,
              den es heute nicht gibt). Die Fussnoten dagegen kommen mit dem
              Struktur-Sidecar, aus dem auch der Apparat direkt darunter rendert
              (`fussAnzeige`, s. u.) — Reserve und Apparat erscheinen im SELBEN Paint,
              der spätere Shard-Resolve füllt nur noch. Die Reserve ist damit
              MONOTON: sie verschwindet nie wieder.

              `historie` steht als zweite Bedingung im ODER, obwohl die Invariante ihn
              überflüssig macht: träfe je ein Eintrag ohne Fussnote ein, bekäme der
              Slot trotzdem seinen Boden. Die Regel kann so nur überreservieren, nie
              einen Sprung durchlassen (§1 — lieber die Prüfung verdoppeln).

              WIRKUNG, gemessen (17.8.2026): korpusweit reservieren 17 547 statt
              25 403 Artikel (−31 %); auf BS-640.100 fallen 278 von 292 Slots weg
              (95 %), auf dem OR 1092 von 1686, auf der StPO 346 von 480.
              REST-ÜBERRESERVIERUNG, benannt statt versteckt: 4454 Artikel tragen
              Fussnoten, aber keinen Eintrag (25 % der reservierenden) — darunter die
              14 Fussnoten-Artikel von BS-640.100, für die es heute gar keinen Shard
              geben kann. Das enger zu ziehen bräuchte ein Shard-Manifest im
              Prerender-Pfad (eigener Schritt, Datenhaltung). VERWORFEN als engere
              Regel: «Artikel trägt eine `kl:'A'`-Fussnote» reserviert nur 13 046,
              verfehlt aber 182 Artikel MIT Eintrag (u. a. ZGB Art. 159, 181, 451) —
              unsound, das wären 182 echte Sprünge.

              Der Token heisst seit S2 `min-h-beiwerk` (Wert unverändert 1.5 rem = die
              gemessenen 24 px der einen Chip-Zeile): er reserviert den Boden der
              Beiwerk-Zone, nicht «eine Historie-Zeile». */}
          {/* Fussnoten (Änderungs-/Quellenhistorie, AS/BBl klickbar). W2·5d G2b:
              der Apparat liegt IMMER im DOM (Ctrl+F/Print/Screenreader, R9/§8);
              der data-fussnoten-CSS-Toggle dämpft ihn bei «AUS» (data-fn-apparat),
              versteckt ihn nie. Marker + Apparat = EINE Bedienung (Options-Leiste). */}
          {fussAnzeige.length > 0 && (
            /* D35-F3 (7.9.2026) · HIER STAND `data-fn-nur-a` — ERSATZLOS GESTRICHEN
               (W2·26/Z8, 11.9.2026). Das Attribut beantwortete die Frage «trägt
               dieser Apparat AUSSCHLIESSLICH Änderungs-Fussnoten?», damit die Wahl
               «Fassung»/«aus» den ganzen Kasten mitnehmen konnte, statt eine nackte
               Haarlinie über nichts stehen zu lassen. Seit Z8 nimmt diese Wahl den
               Apparat ohnehin als Ganzes (`src/index.css`), und die Frage hat keinen
               Leser mehr — was nicht mehr scheitern kann, wird gestrichen statt
               bewacht (§17-Gegengewicht). Die Herleitung (kein `:has()` über 1686
               Artikel, `undefined` statt `false`) bleibt als datierter Beleg im
               Git-Verlauf dieser Datei stehen (§0 Ziff. 2b).
               `data-fn-klasse` an den Einträgen BLEIBT: es ist die build-seitige
               Klassifikation im DOM, und `src/tests/fussnoten-toggle-huellenneutral.test.ts`
               belegt daran, dass KEIN Selektor mehr nach Klasse dämpft (H0-Auflage 1). */
            <div data-fn-apparat
              className="mt-3 border-t border-rule-artikel pt-2 space-y-1">
              {fussAnzeige.map((fn, i) => (
                <p key={i} id={fn.nr ? `fn-${e.artikel}-${fn.nr}` : undefined} data-fn-klasse={fn.kl}
                  /* S2 (V2-Spalte «Fussnoten-Body 0.6875 rem / lh 1.3»): `text-leser-fn`
                     ersetzt `text-xs leading-normal` (12 px / 1.5). Fahrplan Kap. 8
                     nennt als Ist-Zustand `text-micro` 0.6875/1.2 — am Code gemessen
                     war es `text-xs`; die Spalte gilt, der Ist-Vermerk war falsch (§7).

                     T3 (Design-Qualitäts-Pass 29.8.2026): der Apparat lief auf der
                     VOLLEN Lesespalte — gemessen @1440 am OR 640 px Kasten, längster
                     Eintrag 108 ch/Zeile (5.88 px/ch), Einzelzeilen bis 128 ch. Auf
                     11 px ist das keine lesbare Spalte mehr. `max-w-kleintext`
                     (26 rem, Herleitung am Token in `tailwind.config.js`) setzt die
                     Feinschrift auf ihr eigenes Mass; der Trenner darüber bleibt
                     bewusst über die volle Spalte (Linien-Kanon §4b: der
                     Artikel-Trenner trennt die SPALTE, nicht den Textblock). */
                  className="nt-anker max-w-kleintext text-leser-fn text-ink-500 target:bg-brass-100">
                  {/* WCAG-AA (§13): Fussnoten-Nummer ist semantischer Text (kein aria-hidden).
                      LM-153 (W2·17-UI-BEFUNDE-B4): die Marke im Fliesstext (FnRef,
                      ArtikelBody.tsx) ist hochgestellt UND brass-700; der Apparat-Eintrag
                      stand bisher als ink-500-Zahl auf der Grundlinie — andere Auszeichnung,
                      dieselbe Referenz. Baseline/Grösse bleiben (eine Liste aus hochgestellten
                      Mini-Ziffern wäre unlesbar), aber die FARBE wird auf dieselbe brass-700-
                      Familie gehoben — der Leser verbindet Marke↔Eintrag über die Farbe, wie
                      im Fliesstext. brass-700 ist bereits an der Marke selbst AA-geprüft
                      (kleinere Schrift, `--hochgestellt`) und trägt hier bei 11px erst recht
                      (S2: der Apparat läuft auf `text-leser-fn`). */}
                  {fn.nr && <span className="num mr-1 text-brass-700">{fn.nr}</span>}
                  {fnTextMitLinks(fn)}
                </p>
              ))}
            </div>
          )}
          </div>{/* /data-beiwerk */}
        </div>
        )}
        {/* ═══ W2·24-D34 · DER BEZÜGE-FUSS ═══════════════════════════════════
            Auftrag David 7.9.2026, wörtlich: «das mit den bezügen soll unten an
            den artikel und nicht direkt nach der artikel nummer». Die Zeile
            steht darum HIER: unter dem letzten Absatz und dem Fussnoten-Apparat,
            vor dem nächsten Artikel. Eine feine Trennlinie darüber (`.lr7-bez`,
            `--rule-soft`) sagt «gehört noch zu diesem Artikel, ist aber nicht
            mehr sein Wortlaut» — eine Linie, keine Fläche (F0.6).

            EIN Baustein für BEIDE Formen (§5). Bis D33 hatte die Breitform ihn
            unter dem Artikelkopf und die Zeilenform einen eigenen, anders
            gestalteten Fuss im Beiwerk; beide Stellen sind gelöscht, `kopfForm`
            entscheidet über die Bezüge nichts mehr.

            AUSSERHALB von `artOffen`, genau wie die Kopf-Variante vorher: der
            Apparat gehört zum Artikel, nicht zu seinem entfalteten Wortlaut —
            ein eingeklappter (typisch: aufgehobener) Artikel behält seine
            Bezüge-Zeile, und sie steht dann direkt unter dem Kopf, weil es
            dazwischen nichts gibt. Im Druck bleibt sie ausgeblendet
            (`print:hidden` in `Funktionszeile.tsx`). */}
        <ArtikelBezuegeFuss bezuege={bezuege} bezuegeImFuss={bezuegeImFuss}
          erlassKey={erlass?.key} artikel={e.artikel} snapshot={e}
          historie={historie} leitfaelle={leitfaelle} materialien={materialien} verweise={verweise}
          werkzeuge={werkzeuge} zaehler={zaehler} zitat={zitat} revision={revision}
          onOeffnen={onBezuegeOeffnen} onImBlatt={onImBlatt} laedt={bezuegeLaedt && !bezuege}
          form={fussForm}
          aktionen={<ArtikelAktionen artikel={e.artikel} basisPfad={basisPfad}
            zitat={zitat} zitatVoll={zitatVoll} amtlich={amtlich} />} />
      </div>
    </article>
  );
});
