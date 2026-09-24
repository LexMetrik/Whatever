import { useState, memo } from 'react';
import { ArtikelBody, FnRef } from '../../../components/normtext/ArtikelBody';
import { type InternRefs } from '../../../components/NormText';
import {
  labelMitBereich, artikelLeerstellenStatus, LEERSTELLE_KURZ, LEERSTELLE_ERLAEUTERUNG,
} from '../../../lib/normtext/darstellung';
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
import { ArtikelBezuegeFuss, type ImBlattReiter } from './ArtikelLeser.bezuegeFuss';
import { ArtikelAktionen } from './ArtikelAktionen';
import { ArtikelNachbarn } from './ArtikelNachbarn';
import type { ArtikelNachbarn as NachbarnAmArtikel } from '../v3/nachbarArtikel';

// Ein Artikel im Lesefluss (Richtung A): zweispaltig wie die amtliche Druckfassung —
// links «Art. N» als ruhiger Anker mit den Randtiteln darunter (rechtsbündig, nur die
// gegenüber dem Vorartikel GEÄNDERTEN Stufen, `marg`), rechts der Serif-
// Bestimmungstext. Ersetzt den früheren fliegenden Standort-Tracker. Reine Darstellung.

export const ArtikelLeser = memo(function ArtikelLeser({ e, erlass, basisPfad, fussnoten, intern, marg, margBasis, imTreffer, onSpringe, leitfaelle, bezuege, bezuegeImFuss, materialien, onBezuegeOeffnen, onImBlatt, bezuegeLaedt, revision, historie, zaehler, nachbarn, nachbarnAdresse, fussForm, istAnhang = false }: {
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
   * W2·5m · Adress-Bauer der Nachbar-Pfeile (`../v3/einzelModus.einzelAdresse`).
   *
   * Im Einzelmodus ist der Nachbar die nächste SEITE und keine Stelle im selben
   * Dokument: ein blosser `#art-…`-Anker feuert kein `popstate`, react-router
   * bemerkt ihn nicht, und die Karte bliebe stehen. Gemessen am gebauten Stand
   * (14.9.2026, `e2e/leser-nachbar-rohdaten`): das KOPF-Paar rendete noch den
   * alten Anker, weil die Prop nur am Fuss-Paar hing — beide Paare müssen
   * dieselbe Adresse tragen, sonst blättert nur eines (B1).
   *
   * Ungesetzt bleibt alles wie bisher (Gesamtansicht, Golden byte-gleich).
   */
  nachbarnAdresse?: (token: string) => string;
  /**
   * W2·5m (Kap. 15.5) · die GESTALT der Rubriken am Artikelende. `undefined`
   * bzw. `'zeile'` ist die Funktionszeile der Gesamtansicht (unverändert),
   * `'dossier'` sind die gestapelten Blöcke des Einzelmodus.
   *
   * DURCHGEREICHT, nicht ausgewertet: die Weiche steht in
   * `./ArtikelLeser.bezuegeFuss.tsx`, wo auch die Marken gerechnet werden (§5).
   * Der Artikel-Körper darüber ist in beiden Fällen byte-gleich derselbe —
   * genau das misst das PX-Tor (Kap. 15.1, Grenze Hülle/Kern).
   *
   * S6 W1f (24.9.2026): die Funktionszeile ist gefallen. `'dossier'` rendert
   * weiter den Bezüge-Fuss; sonst steht am Artikelende nur die ruhige
   * Aktionszeile. Die Weiche steht seither HIER (unten am Fuss), weil der
   * Bezüge-Fuss nur noch eine Gestalt kennt.
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
  /** D35-F2 · «im Blatt öffnen ›» in den aufgeklappten Rubriken (Herleitung in
   *  `./ArtikelLeser.bezuegeFuss.tsx`). MUSS referenz-stabil sein — diese
   *  Komponente ist `memo`, und 1686 neue Funktionen je Render des Rahmens
   *  hoben die Schranke auf (§15, `../v3/panelModell.oeffne`). */
  onImBlatt?: (reiter: ImBlattReiter) => void;
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
  // Artikel ohne lebenden Wortlaut → dezent + standardmässig eingeklappt
  // (Auftrag David: «nicht so präsent», aufklappbar über den ▾/▸-Toggle).
  // W2·27 (15.9.2026): WAS der Leser dazu SAGT, hängt am Beleg, nicht am Befund
  // — `artikelLeerstellenStatus` trennt den amtlich belegten Fall
  // ('aufgehoben', e.aufgehoben) von der blossen Text-Heuristik
  // ('leer-ungeklaert'). Herleitung in `lib/normtext/darstellung.ts`.
  // Die FORM (Dämpfung, fehlendes Chevron, eingeklappt) ist für beide gleich:
  // in beiden Fällen gibt es nichts zu entfalten — nur die Statuszeile
  // unterscheidet, und genau das ist der §8-Punkt.
  const leerstelle = artikelLeerstellenStatus(e.bloecke, e.aufgehoben);
  const ganzAufgehoben = leerstelle === 'aufgehoben';
  const ohneWortlaut = leerstelle !== 'lebt';
  // Welche Fussnoten der Apparat zeigt und in welcher Reihenfolge:
  // `./ArtikelLeser.fussnoten` (§6.6-Split, Herleitung dort).
  const fussAnzeige: Fussnote[] = fussnotenAnzeige(e, fussnoten);
  const [artOffen, setArtOffen] = useState(!ohneWortlaut); // einzelner Artikel ein-/ausklappbar; ohne Wortlaut → zu
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
  // S6 W1f · die Aktionen: im Dossier Knöpfe (unverändert), sonst ruhige Textzeile.
  const aktionen = <ArtikelAktionen artikel={e.artikel} basisPfad={basisPfad}
    zitat={zitat} zitatVoll={zitatVoll} amtlich={amtlich} ruhig={fussForm !== 'dossier'} />;
  // Aufhebungsnotiz (G16/#3): die amtliche «Aufgehoben durch … (AS …)»-Notiz eines
  // voll aufgehobenen Artikels liegt als artikel-Ebene-Fussnote im Snapshot
  // (absatz/item = null). M2 (David 29.6.2026) / G2b: sie ist eine Fussnote und liegt
  // wie jede Fussnote IMMER im DOM (data-fn-apparat, per data-fussnoten-CSS dämpfbar,
  // R9); die Statuszeile «· aufgehoben» (Artikelzustand) bleibt davon unberührt
  // immer sichtbar. Wortlaut nie erfunden (§1).
  // W2·27 (15.9.2026): auch für 'leer-ungeklaert' — GERADE dort steht in der
  // Artikel-Fussnote die Auskunft, die der Leser braucht («Die Änderung kann
  // unter AS … konsultiert werden», «Tritt zu einem späteren Zeitpunkt in
  // Kraft»). Sie zu unterdrücken, weil kein Aufhebungsvermerk vorliegt, wäre
  // das Gegenteil von §8. Wortlaut nie erfunden (§1).
  const kopfNotiz: Fussnote[] = ohneWortlaut
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
  // D40 (David 7.9.2026): der Fassungs-Slot im Kopf ist ersatzlos gefallen;
  // die Auskunft ist die Rubrik «Fassung» der Funktionszeile am Artikelende
  // (`./ArtikelLeser.bezuegeFuss.tsx`), der Druck behält sie unten in
  // `[data-hist-druck]`. Der Randtitel ist seit W2·24-F ein Bauteil
  // (`./ArtikelLeser.kopfteile`); hier bleibt er ein Wert, weil jede
  // Satzspiegel-Form ihn an ihrer eigenen Stelle einsetzt.
  /** Trägt der Randtitel überhaupt etwas? Ohne das wäre der Artikelkopf der
   *  Breitform ein leerer Kasten (§8). In React entschieden, nicht per `:has()`
   *  (über 1686 Artikel eine Scroll-Bremse, W2·19-GLIEDERUNG/F1). Wertgleich
   *  mit der Null-Bedingung von `RandTitel`. */
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
      // S6 W1g: in der Breitform steht der Randtitel in der «Art. N»-Zeile (s. u.).
      style={{ containIntrinsicSize: `auto ${schaetzeArtikelHoehe(e, !kopfForm)}px` }}
      // W2·19-GLIEDERUNG/F1: das Hover-Spotlight («andere Artikel dimmen») ist
      // ersatzlos entfernt (Entscheid David 8.8.2026; Messung
      // `bibliothek/betrieb/gliederung-perf-diagnose-2026-08-08.md`: 1686
      // gleichzeitige Transitionen je Hover-Kippen, Frame-Median 33 → 17 ms).
      // `group` bleibt für den Aktions-Slot, `relative z-base` für die
      // Stapelordnung des Ruhezustands.
      className={`nt-art-cv group relative z-base nt-anker border-t ${istAnhang ? 'border-rule-struktur pt-9 mt-9' : 'border-rule-artikel pt-7 mt-7'} first:border-t-0 first:mt-0 first:pt-0`}>
      {/* DER ARTIKEL: KOPF · WORTLAUT · BEIWERK (W2·24-R6b, David 6.9.2026:
          die Randspuren links/rechts sind gefallen, ein Fluss). Zeilenform:
          Randtitel als Zeile über der Artikelnummer (Fedlex-Stil, David
          26.6.2026; auch bei eingeklapptem/aufgehobenem Artikel sichtbar),
          Beiwerk unter dem Wortlaut. */}
      {/* S6 W1g (24.9.2026): in der Breitform steht der Randtitel in der
          Artikelnummer-Zeile (s. u.); die Zeilenform (Handy, Pane, Treffer-
          liste) behält die Zeile darüber (Fedlex-Stil, David 26.6.2026). */}
      {!kopfForm && <div>{randTitel}</div>}
      {/* `.lr-text` ist Sonden-Anker (Textspalte, `leser-marken-geometrie`);
          `min-w-0`: ein langes Wort sprengt sonst das Raster. */}
      <div className="lr-text min-w-0">
        {/* BREITFORM (Inventar 2.3.3): der Randtitel über der Artikelnummer,
            seine Sachüberschrift (`.lr-blatt`) kursiv in der Lese-Serife —
            Familie und Schnitt kommen von hier, das Gewicht bleibt beim
            Randtitel (`margStufeStil`, eine Rolle, ein Gewicht, §5). Die
            Baseline-Zeile hält die gemessene Kopfhöhe. */}
        {/* S6 W1g (Wunsch David 24.9.2026, Board «Fliesstext-Blatt»): der
            Randtitel steht nicht mehr als eigene Zeile ÜBER «Art. N», sondern
            IN der Artikelnummer-Zeile dahinter («Art. 257d  4. Zahlungsrückstand
            des Mieters») — eine Zeile weniger je Artikel. Markup und Stimme
            unverändert (`RandTitel`, kursive Lese-Serife); nur der Ort. */}
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
            {ohneWortlaut
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
                  className="inline-flex w-4 shrink-0 justify-center text-micro text-ink-500 hover:text-ink-900">{artOffen ? '▾' : '▸'}</button>}
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
                  ? 'font-display text-h3 font-semibold text-ink-900 hover:text-ink-900 text-left'
                  : `num text-base font-semibold hover:text-ink-900 text-left ${ohneWortlaut ? 'text-ink-500 font-normal' : 'text-ink-900'}`}>{label}</button>
            ) : (
              <a href={`#art-${e.artikel}`} className={istAnhang
                ? 'font-display text-h3 font-semibold text-ink-900 hover:text-ink-900 no-underline'
                : `num text-base font-semibold hover:text-ink-900 no-underline ${ohneWortlaut ? 'text-ink-500 font-normal' : 'text-ink-900'}`}>{label}</a>
            )}{fnMarker}
            </span>
            {/* aufgehoben gedämpft, aber ink-500 (WCAG 4.5:1 hell+dunkel) statt
                ink-400 (3.2–3.6:1) — essentieller Link-Text, kein incidental. */}
            {ganzAufgehoben && <span {...{ [SUCH_META]: '' }} className="text-xs italic text-ink-500">· aufgehoben</span>}
            {kopfForm && randInhalt && (
              <div data-lr-randtitel-zeile className="min-w-0 [&_.lr-blatt]:font-serif [&_.lr-blatt]:italic [&>div]:mb-0">{randTitel}</div>
            )}
            {/* W2·27 (15.9.2026) · §8: NUR die Text-Heuristik greift — der
                Korpus weiss nicht, warum hier kein Wortlaut steht. Dieselbe
                Dämpfung (text-xs italic ink-500) wie «· aufgehoben»: es ist
                dieselbe Rolle (Artikelzustand), kein neuer Ton, keine neue
                Farbe (§13). Ersatztext, kein Wortlaut → data-such-meta. */}
            {leerstelle === 'leer-ungeklaert' && (
              <span {...{ [SUCH_META]: '' }} className="text-xs italic text-ink-500"
                title={LEERSTELLE_ERLAEUTERUNG}>· {LEERSTELLE_KURZ}</span>
            )}
            {/* ── W2·5m · NACHBAR-ARTIKEL «‹ Art. 89 · Art. 90a ›» ───────────
                Muster gesetze-im-internet/dejure/buzer, hier als Anker im
                selben Dokument (der Leser zeigt den ganzen Erlass auf EINER
                Seite — der Pfeil blättert, er lädt nicht nach).
                NICHT in der Suchsicht (`imTreffer`): dort ist die Lesespalte
                durch die Trefferliste ersetzt, `#art-…` zeigte ins Leere. Die
                Artikelnummer daneben trägt in diesem Modus aus demselben Grund
                schon einen `<button>` statt eines Ankers. */}
            {!imTreffer && nachbarn && <ArtikelNachbarn nachbarn={nachbarn} adresse={nachbarnAdresse} />}
            {/* D35-F1 (David 7.9.2026): die Aktionen «Zitat · Link · Amtliche
                Fassung ↗» stehen nicht mehr hier (dort unter `opacity-0`),
                sondern am Artikelende in der Funktionszeile. */}
            {/* Amtliche Aufhebungsnotiz (eigene Zeile, dezent eingerückt) — M2: erst
                auf Klick (hinter dem Fussnoten-Schalter), wie jede andere Fussnote.
                Die Statuszeile oben bleibt unabhängig immer sichtbar. */}
            {ohneWortlaut && kopfNotiz.length > 0 && (
              /* S2: `text-leser-fn` wie der Haupt-Apparat am Artikelfuss. Beide tragen
                 `data-fn-apparat`, sind also dieselbe Rolle — bis S2 lief dieser hier
                 auf `text-xs` (12 px) und der andere auf 11 px, zwei Grössen für eine
                 Sache (§5). Der eigene `leading-snug` fällt mit: die Zeilenhöhe kommt
                 aus der Stufe. */
              /* T3 (29.8.2026): dieselbe Feinschrift-Spalte wie der Haupt-Apparat
                 am Artikelfuss — es ist dieselbe Rolle (§5). */
              <span data-fn-apparat className="basis-full pl-6 max-w-kleintext text-leser-fn text-ink-500">
                {kopfNotiz.map((fn, i) => (
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
            /* W2·27: der amtliche Artikel-Beleg deckt auch die leeren Blöcke. */
            artikelAufgehoben={ganzAufgehoben}
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
          {/* D34/D40 (David 7.9.2026): Verweise, Entscheide, Materialien, Rechner
              und die Fassung stehen in BEIDEN Formen im EINEN Bezüge-Fuss unten
              (`ArtikelBezuegeFuss`), erst auf Aufklappen — der frühere zweite
              Artikelfuss der Zeilenform und der Fassungs-Slot samt Reserve
              (`min-h-beiwerk`) sind ersatzlos gefallen.
              DER DRUCK behält die Fassung: die Funktionszeile ist `print:hidden`,
              und ein Aktenstück braucht den Stand des Artikels (§8,
              `e2e/druck-fundstellen-z2`). Dieselbe Komponente mit denselben
              Daten, Bildschirm auf Klick, Papier immer — byte-gleich zum
              Druckstand vor D40 (nur das Badge, `zeitleiste` bleibt aus).
              `hidden print:block`: am Bildschirm kein Layout, keine Reserve. Die
              Dreier-Wahl `html[data-vermerke]` greift auch im Druck
              (`src/index.css`). KEIN `data-such-meta` mehr (Nachtrag S1,
              23.9.2026, zum Posten «Z. 621»: der Kommentar hier behauptete es
              noch seit D40; folgenlos, weil der Such-Walker `display:none`
              abschneidet). Die Belege des gefallenen Slots (Messungen 20.7. und
              17.8.2026, S1/S2/Ä26) stehen in der Versionsgeschichte dieser Datei. */}
          <div data-hist-druck className="hidden print:block">
            <ArtikelHistorieZeile historie={historie} />
          </div>
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
        {/* DER BEZÜGE-FUSS (D34, David 7.9.2026: «das mit den bezügen soll unten
            an den artikel»): unter dem letzten Absatz und dem Fussnoten-Apparat,
            EIN Baustein für beide Formen (§5). AUSSERHALB von `artOffen`: ein
            eingeklappter Artikel behält seine Zeile.
            S6 W1f (Entscheid David 24.9.2026, «die zeile soll ganz weg. infos
            sollen alle im blatt erscheinen»): in der Gesamtansicht steht hier
            nur noch die ruhige Aktionszeile («Klein am Artikel»); die Rubriken
            zeigt das Erlass-Blatt (`../v3/BlattArtikel.tsx`). Das Dossier des
            Einzelmodus bleibt unverändert (D-E4). */}
        {fussForm === 'dossier'
          ? (
            <ArtikelBezuegeFuss bezuege={bezuege} bezuegeImFuss={bezuegeImFuss}
              erlassKey={erlass?.key} artikel={e.artikel} snapshot={e}
              historie={historie} leitfaelle={leitfaelle} materialien={materialien} verweise={verweise}
              werkzeuge={werkzeuge} zaehler={zaehler} zitat={zitat} revision={revision}
              onOeffnen={onBezuegeOeffnen} onImBlatt={onImBlatt} laedt={bezuegeLaedt && !bezuege}
              aktionen={aktionen} />
          )
          : (
            <div data-artikel-aktionen className="mt-2 flex print:hidden" {...{ [SUCH_META]: '' }}>{aktionen}</div>
          )}
      </div>
    </article>
  );
});
