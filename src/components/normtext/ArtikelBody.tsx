import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { NormSnapshot } from '../../lib/normtext/typen';
import { absatzNorm, bestimmePassusZiel, type PassusInfo } from '../../lib/normtext/passusZiel';
import {
  trenneAenderungshistorie, absatzMarke, gruppiereBetraege, istAufgehoben, LEERSTELLE_KURZ,
  LEERSTELLE_ERLAEUTERUNG,
} from '../../lib/normtext/darstellung';
import { NormText, type InternRefs } from '../NormText';
import { chapeauZielFremdgesetz } from '../../lib/fedlex';
import { BildFigur, BildKacheln } from './BildElemente';
import { WJ } from './wortverbinder';
import { StaffelTabelle, MehrspaltigeTabelle, TarifTabelle } from './ArtikelTabellen';
import { staffelZeilen, normalisiereTarifText } from './tarifText';
// B2 (Bug-Check §9 zu W2·19-S8): der Aufhebungs-Platzhalter ist BEDIENUNG, kein
// Wortlaut — er trägt darum dasselbe Meta-Attribut wie Zähler und Verweis-Chips.
// Die Konstante wird IMPORTIERT statt abgeschrieben: die Ausgrenzung lebt in
// `sammleTrefferRanges` und nur dort (§5). Ein `src/components`→`src/pages`-Import
// ist im Haus etabliert (RuecksprungChip, BezugFacettenWahl, BezugZeitWahl,
// ArtikelKontextGruppe) und erzeugt keinen Zyklus (check:zyklen).
import { SUCH_META } from '../../pages/gesetz-leser/suchHighlight';

import type { BildBlock, ZitierKontext, AusweisBasis } from './ArtikelBody.helfer';
import { FREMD_LEER, NOOP, markenAnzeige, markenZitat, stufenFuer, vglFnNr } from './ArtikelBody.helfer';
import { ZitierMarke } from './ArtikelBody.zitier';

export type { ZitierKontext };

// Fussnoten-Verweis (hochgestellte Nummer). Klick zeigt den Fussnotentext in einem
// Popover DIREKT an der Stelle — ohne die Leseposition zu verschieben (früher
// sprang der Anker an den Artikelfuss). Quelle ist der gerenderte Fuss-Eintrag
// (#fn-artikel-nr); schliesst bei Klick ausserhalb / Esc.
export function FnRef({ artikel, nr, klasse, kl }: {
  artikel: string; nr: string; klasse?: string;
  /** W2·5i-HIST-ANSICHT: build-seitige Fussnoten-KLASSE ('A'|'V'|'G'|'Z'|'U', Sidecar-
   *  Feld `kl`) als `data-fn-klasse` am Marker-Träger. Steuert AUSSCHLIESSLICH die
   *  CSS-Sichtbarkeit des Schalters «Änderungsvermerke» (an/aus) — nur 'A' ist dort
   *  dämpfbar (H0-Auflage 1). Fehlt der Wert (Kanton-Sidecars), trägt der Marker kein
   *  Attribut und bleibt in JEDER Stellung sichtbar (konservativ).
   *
   *  NUR-KOMMENTAR-BERÜHRUNG DES KERNS (S1-Nachzug 17.8.2026, Architektur-Prüfer C1,
   *  ausdrücklich deklariert): hier stand «der Ansicht "Änderungshistorie: aus / als
   *  Chronologie"» — ein Vokabular, das S1 gestrichen hat (dreiwertig → zweiwertig,
   *  David F1). Verhalten, Attributname und Werte sind UNVERÄNDERT; geändert ist
   *  ausschliesslich dieser Satz. */
  kl?: string;
}) {
  const [auf, setAuf] = useState(false);
  const [html, setHtml] = useState('');
  // Popover-Position (viewport-fixiert). Das Popover wird per Portal an
  // document.body gerendert und ABSICHTLICH NICHT mehr absolut zum Anker
  // positioniert: der Lesecontainer (GesetzLeser) etabliert mit overflow-x-clip
  // einen Clip-Kontext für alle Nachfahren — ein absolutes Popover am rechten
  // Spaltenrand wurde dort horizontal abgeschnitten. Fixed + Portal entkommt dem
  // Clip (und der hover:-translate-Transform des Absatzes, die sonst den Fixed-
  // Bezug verschöbe). Links/rechts an den Viewport geklemmt (8px Rand).
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ankerRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLSpanElement>(null);
  const positioniere = () => {
    const a = ankerRef.current;
    if (a == null || typeof window === 'undefined') return;
    const r = a.getBoundingClientRect();
    const breite = Math.min(288, window.innerWidth * 0.78); // w-72 bzw. max-w-[78vw]
    const left = Math.max(8, Math.min(r.left, window.innerWidth - breite - 8));
    setPos({ top: r.bottom + 4, left });
  };
  useEffect(() => {
    if (!auf) return;
    positioniere();
    const zu = (e: Event) => {
      const t = e.target as Node;
      if (ankerRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setAuf(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAuf(false); };
    const neu = () => positioniere();
    document.addEventListener('mousedown', zu);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', neu, true);
    window.addEventListener('resize', neu);
    return () => {
      document.removeEventListener('mousedown', zu);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', neu, true);
      window.removeEventListener('resize', neu);
    };
  }, [auf]);
  const umschalten = () => {
    if (!auf) {
      const def = typeof document !== 'undefined' ? document.getElementById(`fn-${artikel}-${nr}`) : null;
      setHtml(def?.innerHTML ?? '');
    }
    setAuf((v) => !v);
  };
  return (
    // Ä62 · KEINE MARKEN-WAISE (S2-Nachzug 17.8.2026, Ästhetik-Prüfer):
    // `whitespace-nowrap` am Träger PLUS ein Wort-Verbinder INNERHALB des Trägers.
    //
    // BEFUND, gemessen @1440 (Waisen = Marke steht allein am Anfang der Folgezeile,
    // obwohl der Text davor noch Platz hatte): StGB 13 von 532 Marken (V3) bzw. 16
    // von 532 (V1), StPO 8 von 276 — vorbestehend, in BEIDEN Hüllen.
    //
    // WARUM DER BESTEHENDE WORT-VERBINDER NICHT REICHTE — und warum die zuerst
    // vermutete Ursache falsch war: die Diagnose lautete «`[data-fn-ref]` ist
    // `inline-block`, also eine Umbruch-Gelegenheit ⇒ auf `display:inline` stellen».
    // GEMESSEN ist das ein No-op (13 Waisen vor und nach der Umstellung): der
    // Marker ist ein `<button>`, und Blink erzwingt für Buttons unabhängig von der
    // CSS-Angabe eine atomare Inline-Box (`display` meldet weiter `inline-block`).
    // Der Gegenbeweis: ersetzt man die Buttons per DOM-Chirurgie durch echte
    // Inline-`<span>`s, fallen die Waisen auf 0 (532/532 bzw. 276/276 geprüft) —
    // die atomare Box IST der Umbruchpunkt, und ein A31-Wort-Verbinder VOR ihr
    // verhindert den Bruch nicht (UAX#14 LB11 greift auf die Zeichenkette, nicht
    // auf die Grenze zur atomaren Box).
    //
    // Die Umstellung auf `<span role="button">` wäre der DOM-/A11y-Weg gewesen;
    // gebaut ist der kleinere: der Träger wird zum Nicht-Umbruch-Kontext, und der
    // Verbinder wandert IN ihn hinein. Damit ist die Kette [Text][WJ][Marke] an
    // beiden Grenzen geschlossen — vor dem WJ verbietet LB11 den Bruch, innerhalb
    // des Trägers gibt es keine Umbruch-Gelegenheit mehr. Auch `overflow-wrap:
    // anywhere` (S13, langes Kompositum) wurde als Ursache geprüft und
    // ausgeschlossen: `break-word` und `normal` ändern die Waisen-Zahl nicht.
    // WIRKUNG, gemessen: 13 → 0 (StGB V3), 8 → 0 (StPO V3), 16 → 0 (StGB V1).
    // Der äussere `{WJ}` an den Marker-Aufrufstellen bleibt unberührt (A31); er ist
    // jetzt redundant, aber zeichen- und wirkungsneutral.
    <span ref={ankerRef} className="relative whitespace-nowrap" data-fn-klasse={kl}>
      {WJ}
      {/* `data-fn-ref` ist die MASCHINEN-Kennung des Fussnoten-Markers: eine
          CSS-Regel greift darüber und nie über den accessible name (Treuebruch
          16.8.2026 — die frühere Namensregel traf auch den Schalter «Fussnoten
          (N)» im Ansicht-Menü). Den `data-fussnoten`-Toggle, der sie damals
          benutzte, gibt es seit D35-F3 (7.9.2026) nicht mehr; die Kennung
          bleibt, weil sie der Nachweis der textfreien Adressierung ist.
          Wächter: `src/tests/fussnoten-toggle-huellenneutral.test.ts`. */}
      <button type="button" data-fn-ref onClick={umschalten} aria-expanded={auf} aria-label={`Fussnote ${nr}`}
        className={`num align-super text-[length:var(--hochgestellt)] font-medium text-brass-700 hover:text-brass-800 ${klasse ?? ''}`}>{nr}</button>
      {auf && html && pos && typeof document !== 'undefined' && createPortal(
        <span ref={popRef} role="note" dangerouslySetInnerHTML={{ __html: html }}
          style={{ top: pos.top, left: pos.left }}
          /* A3-2 (R3-β): Anatomie aus `.lc-schwebeflaeche` (Fläche · Rahmen ·
             Radius · Schatten). FIX dabei zweierlei: `--paper` statt der
             Ebene darüber (`--paper-raised`) und `rounded-md` als einziger
             Ausreisser unter acht Schwebeflächen. */
          className="lc-popover fixed z-dropdown block w-72 max-w-[78vw] cursor-auto p-2 text-left text-xs font-normal not-italic leading-normal text-ink-500 [&_a]:text-brass-700 [&_a]:underline" />,
        document.body,
      )}
    </span>
  );
}

// ArtikelBody: rendert die Absatz-/Item-Blöcke EINES Artikel-Snapshots im
// Fedlex-Stil (hochgestellte Absatznummer, lit./Ziff.-Items, hervorgehobene
// zitierte Stelle, aufgehobene Stellen gedämpft, Tarif-Staffeln zeilenweise).
// Reine Darstellung (§3) — kein Normtext wird erzeugt. Aus NormPopover.tsx
// extrahiert (verhaltensneutral, §6/§10), damit Popover UND die Gesetzes-
// Lesesicht (Rubrik V) EINE Darstellungswahrheit teilen. Default-Padding ist
// das des Popovers, damit dessen Markup byte-gleich bleibt; die Lesesicht
// übergibt eine eigene className.

// «aufgehoben»: faithful-Snapshot trägt für aufgehobene Stellen (§7) entweder
// nur das Auslassungszeichen «…» ODER das nackte Wort «Aufgehoben» (je nach
// Quelle uneinheitlich gross/klein). Rein Darstellung (§3): beide Formen werden
// zum gedämpften, einheitlichen «aufgehoben»; gilt für Absätze UND Items.

// M6 (Auftrag David): Erkennt einen Chapeau-Absatz, der die Bestimmungen eines
// FREMDEN Gesetzes für anwendbar erklärt — «… gelten … die folgenden Bestimmungen
// des … (BVG) … über:» (ZGB Art. 89a Abs. 6/7 → BVG). Die nachfolgenden Items
// zitieren BLOSSE Fremd-Artikel («Art. 52»); der interne Self-Sprunglink würde
// die dann FÄLSCHLICH auf den eigenen Erlass zeigen (ZGB statt BVG). Trifft das zu,
// wird in den Items das bare-Ref-Linking unterdrückt (lieber kein Link als ein
// plausibel-falscher — §1, M12-Philosophie/David 28.6.; das amtliche Kürzel im Text
// bleibt über NORM_IM_TEXT verlinkt). Selbst ein Fehl-Treffer DEGRADIERT nur
// (Link → Text), erzeugt NIE einen falschen Link.
function etabliertFremdgesetz(absatzText: string, eigenesKuerzel?: string): boolean {
  const t = absatzText.trim();
  if (!/:\s*$/.test(t)) return false; // führt eine Aufzählung ein (Doppelpunkt am Ende)
  if (!/\bBestimmungen\s+(?:des|der)\b/i.test(t)) return false; // «Bestimmungen des/der …»
  const eigen = (eigenesKuerzel ?? '').toUpperCase().replace(/[^A-ZÄÖÜ]/g, '');
  for (const m of t.matchAll(/\b([A-ZÄÖÜ]{2,8})\b/g)) {
    if (m[1].toUpperCase() !== eigen) return true; // ein fremdes Gesetzeskürzel (BVG/FZG ≠ ZGB)
  }
  return false;
}

export function ArtikelBody({ bloecke, artikel, passus, passusRef, className, autolink = false, zitierKontext, fnProAbsatz, fnProItem, fnInlineAbsatz, fnInlineItem, fnKlasse, intern, artikelAufgehoben = false }: {
  bloecke: NormSnapshot['bloecke'];
  /** Artikel-Token des Snapshots — steuert die Tarif-Darstellungs-Normalisierung. */
  artikel: string;
  /** Lesesicht: Fussnoten-Nummern je Block (Schlüssel = Block-Index) → Marker
   *  am Absatzende, verlinkt zum Fuss-Eintrag. */
  fnProAbsatz?: Record<number, string[]>;
  /** Lesesicht: Fussnoten-Nummern je lit/Ziff-Item (Schlüssel «<blockIndex>|<marke>»). */
  fnProItem?: Record<string, string[]>;
  /** FN-5/M14: wortgenau positionierte Marker je Block (Schlüssel = Block-Index;
   *  `o` = Zeichen-Offset in `bloecke[i].text`). Nur im plain-Text-Pfad inline
   *  gerendert; sonst (Tarif/Staffel/Tabelle, Offset im abgetrennten
   *  Historie-Teil) Fallback ans Absatz-Ende. */
  fnInlineAbsatz?: Record<number, Array<{ nr: string; o: number }>>;
  /** FN-5/M14: wortgenau positionierte Marker je Item (Schlüssel
   *  «<blockIndex>|<itemIndex>»; `o` = Offset in `items[j].text`). */
  fnInlineItem?: Record<string, Array<{ nr: string; o: number }>>;
  /** W2·5i-HIST-ANSICHT: Fussnoten-Nummer → build-seitige Klasse (`kl` aus dem
   *  Sidecar). EINE flache Abbildung für ALLE Marker-Pfade dieses Artikels
   *  (Absatz-, Item-, Inline-Marker) — die Klasse hängt an der Fussnote, nie an
   *  ihrer Position, also wäre sie in jeder der vier Marker-Strukturen dasselbe
   *  Duplikat (§5). Fehlt ein Eintrag, trägt der Marker kein `data-fn-klasse`
   *  und bleibt in jeder Ansicht sichtbar. Reine Darstellung (§3). */
  fnKlasse?: Record<string, string>;
  passus: PassusInfo;
  /** Ref auf die markierte Stelle (für Scroll-ins-Sichtfeld im Popover). */
  passusRef?: React.Ref<HTMLElement>;
  /** Container-Klassen; Default = Popover-Padding (Byte-Gleichheit). */
  className?: string;
  /** Querverweise/Rechtsprechung im Wortlaut verlinken (Lesesicht). Default
   *  AUS → das Popover bleibt zeichenidentisch (golden, §6). */
  autolink?: boolean;
  /** Lesesicht: macht Absatz-/lit.-/Ziff.-Marken zu Zitat-Knöpfen. Default aus
   *  → Popover byte-gleich (golden, §6).
   *
   *  ACHTUNG, ZWEITE WIRKUNG (S2-Nachzug 17.8.2026, Architektur-Prüfer 8): dieses
   *  Prop ist AUCH der Typografie-Schalter des Block-Wrappers. Ist es gesetzt,
   *  FÄLLT `leading-relaxed` (1.625) am Block — nur dann liefert der Leser die
   *  Zeilenhöhe seiner eigenen Stufe (`leser-text`, lh 1.55, Entscheid F3 = V2,
   *  David 17.8.2026). Ist es NICHT gesetzt (Popover/Vorschau), bleibt
   *  `leading-relaxed` unverändert stehen. Herleitung an der Stelle unten
   *  («Zeilenhöhe der Stufe»); wer das Prop künftig auch ausserhalb der Lesesicht
   *  setzt, ändert damit die Zeilenhöhe mit. */
  zitierKontext?: ZitierKontext;
  /** Lesesicht: bare Artikelverweise auf denselben Erlass als Sprung-Links. */
  intern?: InternRefs;
  /** W2·27 (15.9.2026): Der GANZE Artikel ist AMTLICH aufgehoben
   *  (`NormSnapshot.aufgehoben`). Nur dieser Beleg deckt einen LEEREN Block als
   *  «aufgehoben» — s. den Block «LEERER BLOCK ≠ AUFHEBUNG» unten. Default
   *  `false` hält Popover/Vorschau byte-gleich (golden, §6). */
  artikelAufgehoben?: boolean;
}) {
  const { passusMarke, zielItemKey } = bestimmePassusZiel(bloecke, passus);
  // Im Lesefluss zitierte Normen/Urteile klickbar machen (D2); sonst Klartext.
  // #9 (M10): verwaiste Leerzeichen VOR Punkt/Komma glätten — sie entstehen beim
  // Strippen eines Inline-Fussnoten-Markers (Fedlex «…sinngemäss<sup>2</sup>.» →
  // entferneTags ersetzt das Tag durch ' ' → «…sinngemäss .»). Reine Darstellung
  // (§1: kein Wortlaut, nur ein Extraktions-Artefakt geglättet); kein Sprachkonflikt
  // (weder DE noch FR/IT setzen ein Leerzeichen vor Punkt/Komma). NUR im Lese-Pfad
  // (autolink) — der Popover-Pfad (autolink=false) bleibt zeichenidentisch (§6 golden).
  const glaetteInterpunktion = (s: string) => s.replace(/ +([.,])/g, '$1');
  const verlinkt = (s: string) => (autolink ? <NormText text={glaetteInterpunktion(s)} intern={intern} /> : s);
  // M6: wie `verlinkt`, aber OHNE `intern` → keine bare-Self-Sprunglinks. Für Items
  // unter einem Fremdgesetz-Chapeau (etabliertFremdgesetz), wo «Art. N» NICHT auf
  // den eigenen Erlass zeigt. Amtliche Kürzel-Verweise (NORM_IM_TEXT) bleiben aktiv.
  const verlinktFremd = (s: string) => (autolink ? <NormText text={glaetteInterpunktion(s)} /> : s);
  const zk = zitierKontext;
  // B-6 (QS-BASIS): Stand-Ausweis-Basis EINMAL je Artikel bauen — an jede inline-
  // ZitierMarke durchgereicht (nur wenn der Reader die Permalink-Basis mitliefert).
  const ausweisBasis: AusweisBasis | undefined = zk?.permalinkBasis
    ? { fassung: zk.fassung, permalinkBasis: zk.permalinkBasis }
    : undefined;

  // FN-5: Segment-Splitter — Text an den Marker-Offsets teilen, jedes Segment
  // durch die bestehende Anzeige-Pipeline (`renderSeg`), Marker per Wort-
  // Verbinder (WJ) ans vorausgehende Segment geklebt — wie die End-Marker (A31).
  // Komponenten-Ebene, weil Absatz-Pfad UND Item-Pfad (itemListe) ihn teilen.
  const segmentiert = (
    text: string,
    marker: Array<{ nr: string; o: number }>,
    renderSeg: (s: string) => React.ReactNode,
  ): React.ReactNode => {
    const sortiert = [...marker].sort((a, b2) => a.o - b2.o);
    const teile: React.ReactNode[] = [];
    let von = 0;
    sortiert.forEach((p, k) => {
      if (p.o > von) teile.push(<React.Fragment key={`s${k}`}>{renderSeg(text.slice(von, p.o))}</React.Fragment>);
      // W2·5i H1: kl-Klassifikation an den Marker durchreichen (wie End-Marker).
      teile.push(<React.Fragment key={`f${p.nr}`}>{WJ}<FnRef artikel={artikel} nr={p.nr} kl={fnKlasse?.[p.nr]} /></React.Fragment>);
      von = p.o;
    });
    if (von < text.length) teile.push(<React.Fragment key="rest">{renderSeg(text.slice(von))}</React.Fragment>);
    return <>{teile}</>;
  };

  // Geteilter Item-Renderpfad (lit./Ziff.-Aufzählung eines Blocks) — EINE Stelle
  // für Prosa- UND Bild-Blöcke (§5). Bild-/Kachel-Blöcke können im Datenformat
  // ebenfalls `items` tragen (DBG Art. 22 / STHG Art. 7: die <dl> hängt am
  // Formelbild-Block); der frühere Early-Return verschluckte sie — amtliche
  // Substanz fehlte im Reader (§1/§8, FN-5-Gegenprüfung 26.7.2026). Liefert
  // null, wenn der Block keine items trägt.
  // `ohneZitierMarke` (Gegenprüfung 26.7., Befund 3): Items an absatz-losen
  // Bild-Blöcken sind Fortsetzungen des Vorgänger-Absatzes — ihre lit.-/Abs.-
  // Kette liegt in ANDEREN Blöcken. Ist die Kette über `vorKette` + Anker-
  // Absatz deterministisch herleitbar (Fortsetzungs-Tiefe-Bau 26.7.2026),
  // rendert die ZitierMarke mit der PRÄZISEN blockübergreifenden Fundstelle
  // («Art. 22 Abs. 3 lit. c Ziff. 2 DBG»); fehlt der Anker, bleibt die Marke
  // unterdrückt — §1: lieber keine Kopier-Marke als eine falsche.
  // `vorKette` = Items der unterbrochenen Liste aus den Vorgänger-Blöcken
  // (Anker-Absatz + dazwischenliegende Bild-Blöcke), nur fürs Zitat — die
  // block-lokale Einrückung (stufen) bleibt unberührt.
  const itemListe = (
    b: NormSnapshot['bloecke'][number],
    i: number,
    absMarke: string | null,
    ohneZitierMarke = false,
    vorKette?: NonNullable<NormSnapshot['bloecke'][number]['items']>,
  ) => {
    if (b.items == null || b.items.length === 0) return null;
    // M6: erklärt dieser Absatz die Bestimmungen eines Fremdgesetzes für
    // anwendbar, zitieren seine Items bloße Fremd-Artikel → bare-Ref-Linking
    // dort unterdrücken (kein falscher Self-Link, §1). `pruefeBlock`-Kontext = b.text.
    // M6-D (W2·5b): steht das Zielgesetz des Chapeaus DETERMINISTISCH fest
    // (chapeauZielFremdgesetz), werden die bare Item-Verweise TATSÄCHLICH auf
    // jenes Fremdgesetz aufgelöst (NormChip → In-Reader-Popover/Fedlex) statt nur
    // unterdrückt. Ist das Ziel mehrdeutig/unbekannt, bleibt es bei der reinen
    // M6-Unterdrückung (verlinktFremd, kein Self-Link) — §1: lieber kein Link.
    const fremdKey = autolink ? chapeauZielFremdgesetz(b.text, zk?.kuerzel) : null;
    const fremdItems = autolink && etabliertFremdgesetz(b.text, zk?.kuerzel);
    const fremdIntern: InternRefs | undefined = fremdKey
      ? { tokenMap: FREMD_LEER, basisPfad: '', springeZu: NOOP, fremdKuerzel: fremdKey }
      : undefined;
    const verlinkeItem = (s: string) =>
      fremdKey
        ? <NormText text={glaetteInterpunktion(s)} intern={fremdIntern} />
        : fremdItems ? verlinktFremd(s) : verlinkt(s);
    // Verschachtelungsstufe je Item (stufenFuer: explizite tiefe > Fallback-
    // Heuristik; EINE Stelle, §5) — block-lokal für Einrückung und Zitat.
    const stufen: number[] = stufenFuer(b.items!);
    return (
      <ul className={`mt-1.5 space-y-1 ${zk ? 'pl-8' : 'pl-1'}`}>
        {b.items!.map((it, j) => {
          // GENAU der eine global bestimmte (Block,Item)-Treffer (B1):
          // bei gleicher Marke in mehreren Blöcken nur der erste.
          const istItemZitiert = zielItemKey != null
            && zielItemKey.bi === i
            && zielItemKey.ji === j;
          // Gedankenstrich: ohne Punkt («–» statt «–.»).
          const istStrich = /^[–—-]$/.test(it.marke.trim());
          // FN-5: im Text-Pfad inline gesetzte Marker dieses Items —
          // erscheinen nicht mehr zusätzlich am Item-Ende.
          // INVARIANTE (wie im Absatz-Pfad, Gegenprüfung 26.7., B2/B5): der
          // Item-Text-Pfad unten muss VOR dem End-Marker-Fragment ausgewertet
          // werden (JSX-Kinder in Quelltext-Reihenfolge) — sonst rendern
          // inline gesetzte Marker doppelt. Bei einer Umsortierung der
          // <span>-Kinder diese Kopplung zuerst auflösen.
          const itemInlineGesetzt = new Set<string>();
          // QS-UI (Gegenprüfung PR #658): Beschriftung über markenAnzeige —
          // Aufzählungsmarke «a.»/«1.» unverändert, Label-Marke «BE:» statt
          // «BE.» (amtlicher <dt>-Doppelpunkt). Die Marke selbst bleibt «BE».
          // #679: `it.trenner` (amtlicher <dt>-Trenner) steuert Anzeige und Zitat,
          // wo der Snapshot ihn mitführt; fehlt er, greift die Marken-Heuristik.
          const markeAnzeige = markenAnzeige(it.marke, it.trenner);
          // Präzises Zitat inkl. Verschachtelung: eine Ziff. unter einer
          // Bst. wird «… lit. X Ziff. Y …». Eltern-Kette über die Stufen
          // rückwärts aufbauen (nächster Vorfahre je flacherer Stufe).
          // Mit `vorKette` (Bild-Block-Fortsetzung) läuft die Kette über die
          // VERSCHMOLZENE Liste (Vorgänger-Items + eigene Items bis j) — so
          // findet die Fortsetzungs-Ziff. ihren lit.-Vorfahren im
          // Vorgängerblock (DBG 22: «Abs. 3 lit. c Ziff. 2»). Ohne vorKette
          // bleibt der Pfad byte-identisch block-lokal.
          const itemZitat = zk ? (() => {
            const kette = vorKette != null && vorKette.length > 0
              ? [...vorKette, ...b.items!.slice(0, j + 1)]
              : b.items!.slice(0, j + 1);
            const kStufen = vorKette != null && vorKette.length > 0 ? stufenFuer(kette) : stufen;
            const seg: string[] = [];
            const jK = kette.length - 1;
            let lvl = kStufen[jK];
            for (let k = jK; k >= 0 && lvl >= 0; k--) {
              if (kStufen[k] === lvl && !/^[–—-]$/.test(kette[k].marke.trim())) {
                const m2 = kette[k].marke;
                // QS-UI: Label-Marken ohne «lit.»-Präfix (markenZitat) — «lit. BE»
                // ist in der VZV kein Zitat, die Kategorie heisst schlicht «BE».
                seg.unshift(markenZitat(m2, kette[k].trenner));
                lvl--;
              }
            }
            // Dieselbe normalisierte Absatzmarke wie das Absatz-Zitat
            // (absMarke aus absatzMarke/normalisiereAbsatzNummer) statt des
            // rohen b.absatz — sonst weichen die zwei Zitierknöpfe desselben
            // Absatzes bei Suffixen/Ziff.-Resten voneinander ab.
            return `${zk.artikelLabel}${absMarke != null ? ` Abs. ${absMarke}` : ''} ${seg.join(' ')} ${zk.kuerzel}`;
          })() : '';
          return (
            <li
              key={j}
              ref={istItemZitiert ? (passusRef as React.Ref<HTMLLIElement>) : undefined}
              {...(istItemZitiert ? { 'data-passus-item': 'true' } : {})}
              style={stufen[j] > 0 ? { marginLeft: `${stufen[j] * (zk ? 1.6 : 1.1)}rem` } : undefined}
              // ── Ä8 (LESER-V3 H2b) · LEISER HOVER · KERN-BERÜHRUNG ─────────────
              // Gemessen 17.8.2026 (StPO Art. 429, hell): der Hover auf einer
              // lit.-Zeile füllte 588 px Breite mit `brass-200/60` und hob die
              // Zeile zusätzlich um 2 px an. Zwei Verstösse in einer Zeile:
              // «keine Farbfläche ohne Bedeutung — Brass ist Signal, nicht
              // Tapete» (Design-Grundlage Kap. 8 Nr. 3) und «keine Animation ohne
              // Zustandswechsel» (Kap. 7 — ein Hover ist kein Zustand). Brass
              // trägt im Leser die Treffer-Hervorhebung und die aktive Zeile; auf
              // einem blossen Mauskontakt entwertet es beide.
              // NEU: `paper-sunken` — die Rolle `fill`/`bg-grouped` (Kap. 4), also
              // dieselbe ruhende Fläche, die jede andere Hover-Zeile des Lesers
              // benutzt. Die BEDEUTUNG bleibt: der Passus ist zitierbar, und das
              // zeigt er weiterhin — nur leise. Kein Transform mehr.
              // ERKLÄRTE KERN-BERÜHRUNG: diese Datei liegt im Kern und wirkt in
              // BEIDEN Hüllen (der Befund ist in beiden derselbe, er ist heute
              // live). Golden ist unberührt (Engines/Vorlagen), der
              // Pixelvergleich PX misst den RUHEZUSTAND und sieht keinen Hover.
              className={`flex items-baseline gap-2 rounded-md px-2 py-1 ${zk ? 'transition-colors lc-hover-flaeche' : ''} ${
                istItemZitiert
                  ? 'border-l-4 border-brass-500 bg-brass-100 text-ink-900'
                  : 'text-ink-700'
              }`}
            >
              {/* Ä61 · MARKEN-SPALTE: `min-w-6`, NICHT `w-6` (S2-Nachzug 17.8.2026,
                  Ästhetik-Prüfer). `w-6` ist eine FESTE Breite von 24 px; der
                  Marker ist rechts in ihr ausgerichtet und `shrink-0`. Eine Marke,
                  die breiter ist als 24 px, kann die Box damit nicht dehnen — ihre
                  Tinte läuft rechts aus der Box heraus, quer über den Item-Text.
                  GEMESSEN am gebauten Stand @1440 (OR Art. 336c, BEIDE Hüllen
                  identisch, also vorbestehend): `cbis.` und `cter.` ragen je 10 px
                  in den Text, `cquater.` 35.2 px, `cquinquies.` 60.41 px; AIG
                  Art. 5 `abis.` 10 px. Die einstelligen Marken (`a.`–`d.`) blieben
                  8 px VOR der Textkante — der Defekt trifft also genau die
                  Ordnungs-Suffixe des Schweizer Rechts (bis/ter/quater/quinquies).
                  `min-w-6` hält die 24-px-Spalte als MINDESTbreite: alle normalen
                  Marken bleiben an derselben Kante ausgerichtet wie bisher, und nur
                  die lange Marke schiebt IHREN eigenen Text um ihren Überschuss
                  nach rechts. Hängend, aber nie überlappend. */}
              {istStrich
                ? <span className="shrink-0 select-none text-ink-500">{markeAnzeige}</span>
                : zk && !ohneZitierMarke
                  ? <ZitierMarke klasse="shrink-0 min-w-6 text-right !font-medium !text-ink-500 text-body-s" zitat={itemZitat} ausweis={ausweisBasis}>{markeAnzeige}</ZitierMarke>
                  : zk
                    ? <span className="num shrink-0 min-w-6 text-right font-medium text-ink-500 text-body-s">{markeAnzeige}</span>
                    : <span className="num shrink-0 font-semibold text-ink-500">{markeAnzeige}</span>}
              <span className="min-w-0 [overflow-wrap:anywhere] hyphens-manual">
                {/* S13 (BS-Audit 23.6.2026): lange Komposita in Aufzählungen
                    sprengten auf schmalem Viewport (~390px) den Reader (≈25px
                    H-Overflow im Steuergesetz). min-w-0 lässt das Text-Span im
                    flex-Item schrumpfen, overflow-wrap/hyphens brechen das
                    Kompositum statt es überlaufen zu lassen. Reine Darstellung (§3). */}
                {/* S3 (BS-Audit 23.6.2026): aufgehobene lit. werden mit Marke
                    und LEEREM Text gespeichert (kein fabrizierter «Aufgehoben.»-
                    Text, §7). Leeren Item-Text wie eine Aufhebung gedämpft
                    zeigen — die Marke bleibt links sichtbar (Lücke geschlossen). */}
                {/* B2: Ersatztext, kein Wortlaut → `data-such-meta` (s. Import). */}
                {/* W2·27 (15.9.2026): LEERES Item ohne amtlichen Artikel-Beleg
                    sagt «kein Text im Snapshot», nicht «aufgehoben» — dieselbe
                    Grenze wie am Absatz unten (Block «LEERER BLOCK ≠ AUFHEBUNG»).
                    Der amtliche Wortlaut «Aufgehoben» (istAufgehoben) bleibt
                    unberührt: er ist Quelle, keine Heuristik. */}
                {it.text.trim() === '' && !artikelAufgehoben
                  ? <span {...{ [SUCH_META]: '' }} className="italic text-ink-500"
                      title={LEERSTELLE_ERLAEUTERUNG}>{LEERSTELLE_KURZ}</span>
                  : it.text.trim() === '' || istAufgehoben(it.text)
                  ? <span {...{ [SUCH_META]: '' }} className="italic text-ink-500">aufgehoben</span>
                  : (() => {
                      // Tarif-Staffel auch in Items als Tabelle (viele
                      // Notariats-/Grundbuchtarife stehen als lit./Ziff.).
                      // NUR wenn staffelZeilen matcht → Nicht-Tarif-Items
                      // bleiben byte-gleich (golden, §6).
                      const sz = staffelZeilen(it.text);
                      // Geld-Kontext-Tausender auch in Items (§3, FIX 2 — 22.6.2026).
                      // M6: in Fremdgesetz-Chapeau-Items ohne bare-Self-Link (verlinkeItem).
                      if (!sz) {
                        // FN-5/M14: Marker an der Wortstelle im Item-Text —
                        // Offsets beziehen sich direkt auf it.text (kein
                        // Marken-Delta); Segmentierung wie im Absatz-Pfad.
                        const kand = zk ? (fnInlineItem?.[`${i}|${j}`] ?? []) : [];
                        const platzierbar = kand.filter((k) => k.o >= 0 && k.o <= it.text.length);
                        if (platzierbar.length > 0) {
                          for (const p of platzierbar) itemInlineGesetzt.add(p.nr);
                          return segmentiert(it.text, platzierbar, (s) => verlinkeItem(gruppiereBetraege(s)));
                        }
                        return verlinkeItem(gruppiereBetraege(it.text));
                      }
                      return <StaffelTabelle zeilen={staffelZeilen(normalisiereTarifText(it.text)) ?? sz} />;
                    })()}
                {/* Fussnoten-Marker dieses lit/Ziff-Items (klickbar → Fuss).
                    A31: Marker klebt via WJ direkt an den Item-Text (kein
                    Abstand, kein Umbruch auf eine eigene Zeile). FN-5:
                    inline gesetzte Marker erscheinen hier nicht mehr;
                    nicht platzierbare Kandidaten fallen hierher zurück. */}
                {zk && (() => {
                  const kand = fnInlineItem?.[`${i}|${j}`] ?? [];
                  const rest = kand.filter((k) => !itemInlineGesetzt.has(k.nr)).map((k) => k.nr);
                  const alle = [...rest, ...(fnProItem?.[`${i}|${it.marke}`] ?? [])].sort(vglFnNr);
                  return alle.map((nr) => (
                    <React.Fragment key={nr}>{WJ}<FnRef artikel={artikel} nr={nr} kl={fnKlasse?.[nr]} /></React.Fragment>
                  ));
                })()}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div data-lese={zitierKontext ? '' : undefined}
      className={className ?? 'px-5 py-4 space-y-2.5'}>
      {bloecke.map((b, i) => {
        // M13-Annex: Unter-Überschrift innerhalb eines Anhangs (Ziffer-Titel,
        // h2–h6). Eigener Zwischentitel — kein Absatz/Item, keine Zitat-/Tabellen-
        // Logik. Tiefe (2 = Anhang-Hauptziffer … 6) steuert die Betonung. Reine
        // Darstellung (§3); golden-neutral, da bestehende Blöcke nie `titel` tragen.
        if (b.titel !== undefined) {
          const flach = b.titel <= 2;
          return (
            <p
              key={i}
              // W2·19-GLIEDERUNG/S9 (Bau-Spec §3.4/§6·2 «Anhang-Zwischentitel in
              // der Lesespalte erhalten Anker, damit der Ast hineinzielen
              // kann»): bis hierher war dieser Zwischentitel NICHT anspringbar
              // — bei ChemRRV tragen 40 von 69 Artikeln solche Titel-Blöcke
              // (empirisch geprüft, §7), viele mehrfach je Artikel. Die Anhang-
              // Ast-Zeilen der Leiste (gliederungsModell.ts) bleiben in DIESER
              // Slice auf Artikel-Granularität — der Anker macht die Zwischen-
              // titel-Ebene erreichbar (Deep-Link, Ctrl+F-Landung), OHNE die
              // Baum-Granularität zu erweitern (deklarierte Grenze). Nur im
              // eigentlichen Lese-Pfad (`!zitierKontext`, keine Zitat-Vorschau)
              // — im Popover wäre die Id doppelt vergeben (§7: kein Anker, der
              // zweimal im DOM steht). Index i ist die stabile Block-Position
              // im Snapshot (deterministisch, §2).
              id={zitierKontext ? undefined : `anh-${artikel}-${i}`}
              className={`${zitierKontext ? '' : 'text-body-s '}font-semibold text-ink-800 ${flach ? 'mt-3' : 'mt-2'} ${zk ? 'pl-9 [text-indent:0]' : ''}`}
            >
              {b.text}
            </p>
          );
        }
        // Bild-/Kachel-Blöcke (neu im Datenformat): eigenständige Abbildung, Formel
        // oder Signaltafel-Katalog — kein Absatz, keine Zitat-/Tabellen-Logik.
        // In der Lesesicht (zk) an die Prosa-Kante eingerückt (pl-9), das Popover
        // bleibt bündig (§3 reine Darstellung). Trägt der Block zusätzlich `items`
        // (DBG Art. 22 / STHG Art. 7: <dl> am Formelbild), rendern sie NACH dem
        // Bild über den geteilten Item-Pfad — der frühere Early-Return verschluckte
        // sie (amtliche Substanz fehlte im Reader, §1/§8; Fix 26.7.2026).
        const bb = b as BildBlock;
        if ((bb.bildKacheln && bb.bildKacheln.length > 0) || bb.bild) {
          const figur = bb.bildKacheln && bb.bildKacheln.length > 0
            ? <BildKacheln kacheln={bb.bildKacheln} />
            : <BildFigur bild={bb.bild!} />;
          // Fortsetzungs-Kette (26.7.2026): Items an Bild-Blöcken setzen die vom
          // Formelbild unterbrochene Aufzählung fort. Anker = nächstvorheriger
          // Nicht-Bild-Block; trägt er eine Absatznummer, liefert er «Abs. N»
          // und seine Items + die Items dazwischenliegender Bild-Blöcke bilden
          // die vorKette fürs blockübergreifende Zitat («Abs. 3 lit. c Ziff. 2»).
          // Ohne herleitbaren Anker bleibt die Zitier-Marke unterdrückt
          // (§1: lieber keine Kopier-Marke als eine falsche). Ein Bild-Block
          // MIT eigener Absatznummer bleibt sein eigener Anker (kettenlos).
          const eigeneMarke = absatzMarke(b.absatz, b.text).marke;
          let ankerMarke: string | null = eigeneMarke;
          const vorKette: NonNullable<typeof b.items> = [];
          if (eigeneMarke == null) {
            for (let k = i - 1; k >= 0; k--) {
              const vb = bloecke[k] as BildBlock;
              const vbIstBild = vb.bild != null || (vb.bildKacheln != null && vb.bildKacheln.length > 0);
              if (vbIstBild) {
                if (vb.items != null) vorKette.unshift(...vb.items);
                continue;
              }
              // Erster Nicht-Bild-Block: nur ein regulärer Absatz-Block mit
              // Nummer taugt als Anker (kein titel-/Tabellen-Block).
              if (vb.absatz != null && vb.titel === undefined && vb.mehrspaltig == null && (vb.tabelle == null || vb.tabelle.length === 0)) {
                ankerMarke = absatzMarke(vb.absatz, vb.text).marke;
                if (ankerMarke != null && vb.items != null) vorKette.unshift(...vb.items);
              }
              break;
            }
          }
          const items = itemListe(b, i, ankerMarke, ankerMarke == null, vorKette.length > 0 ? vorKette : undefined);
          // Itemloser Bild-Block: Markup exakt wie bisher (DOM-identisch).
          if (items == null) {
            return (
              <div key={i} className={zk ? 'pl-9 [text-indent:0]' : undefined}>
                {figur}
              </div>
            );
          }
          return (
            <div key={i}>
              <div className={zk ? 'pl-9 [text-indent:0]' : undefined}>{figur}</div>
              {items}
            </div>
          );
        }
        const istAbsatzZitiert = passus.absatz != null && absatzNorm(b.absatz) === absatzNorm(passus.absatz);
        // Starke Block-Hervorhebung nur, wenn KEIN Item zitiert ist; bei
        // zitiertem Item wird der Block dezent umrandet, das Item trägt die
        // starke Markierung.
        const blockStark = istAbsatzZitiert && passusMarke == null;
        const blockDezent = istAbsatzZitiert && passusMarke != null;
        // Absatznummern mit lat. Suffix («1bis», «2ter») hängend darstellen (§3).
        const { marke: absMarke, rest: rohtext } = absatzMarke(b.absatz, b.text);
        // FN-5/M14: wortgenau positionierbare Marker dieses Blocks (nur Lesesicht).
        // Der Text-Pfad unten setzt platzierbare Marker inline und trägt sie in
        // `inlineGesetzt` ein; nicht platzierte Kandidaten (Tarif-/Staffel-Pfad,
        // Offset im abgetrennten Historie-Teil) rendern wie bisher am Absatz-Ende.
        // INVARIANTE (Gegenprüfung 26.7., B2): der Text-Pfad muss VOR dem
        // End-Marker-Fragment ausgewertet werden (JSX-Kinder in Quelltext-
        // Reihenfolge) — sonst rendern inline gesetzte Marker doppelt. Bei
        // einer Umsortierung der Kinder diese Kopplung zuerst auflösen.
        const inlineKandidaten = zk ? (fnInlineAbsatz?.[i] ?? []) : [];
        const inlineGesetzt = new Set<string>();
        return (
          <div
            key={i}
            ref={blockStark ? (passusRef as React.Ref<HTMLDivElement>) : undefined}
            data-passus={blockStark ? 'true' : 'false'}
            /* S2 (F3 = V2, David 17.8.2026 am Bildbogen): im LESER trägt dieser
               Block-Wrapper KEINEN eigenen Zeilenabstand mehr. `leading-relaxed`
               (1.625) stand hier unbedingt und schlug damit die Zeilenhöhe der
               Fliesstext-Stufe — die Absätze liefen auf 1.625, nicht auf den 1.55
               des Entscheids (und vor S2 auf 1.625 statt der behaupteten 1.65 des
               Containers). Gemessen aufgefallen, nicht gelesen: der WCAG-Fall in
               `e2e/leser-lesemass.e2e.ts` blieb grün, als die Stufe versuchsweise
               auf lh 1.4 gesetzt wurde — ein Wert, der durchschlagen MÜSSTE.
               Genau das verbietet die Design-Grundlage Kap. 8 Nr. 4 («kein fixer
               Leading-Wert über alle Grössen»): der Zeilenabstand gehört zur Stufe.
               AUSSERHALB des Lesers bleibt alles unverändert (`text-body-s` hat
               lh 1.5 und braucht den lockereren Wert weiterhin) — die Änderung ist
               auf den Reader-Zweig gescopt, Vorschau/Popover sind byte-gleich. */
            className={`${zitierKontext ? '' : 'text-body-s leading-relaxed '}${
              blockStark
                ? 'border-l-4 border-brass-500 bg-brass-100 px-3 py-2 text-ink-900'
                : blockDezent
                  ? 'border-l-2 border-brass-300 bg-brass-100 px-3 py-2 text-ink-800'
                  : 'text-ink-700'
            }`}
          >
            {/* Lesesicht: Absatznummer als hängender, vollwertiger Messing-Marker
                in der linken Rinne (Hanging Indent). Auch ein absatzloser Artikel wird
                HÄNGEND eingerückt (pl-9 -indent-9) — Auftrag David 25.6.2026: erste Zeile
                bündig links, Folgezeilen eingerückt, exakt wie bei Absätzen (einheitliches
                Schriftbild). Popover (kein zk): hochgestellt/bündig wie bisher (golden §6). */}
            {/* Lange deutsche Komposita («Krankenversicherungsaufsichtsverordnung»)
                sprengten auf schmalem Viewport den negativ eingerückten Absatz
                (pl-9 -indent-9) → horizontaler Overflow des ganzen Readers (KVV
                u.a., ~360–414px). overflow-wrap/hyphens brechen das Kompositum,
                statt es überlaufen zu lassen — wie bereits beim Item-Text (S13).
                Nur in der Lesesicht (zk); das Popover (kein zk) bleibt byte-gleich. */}
            {/* Hängeeinzug: nummerierter Absatz → voller Hang (-indent-9), die
                Messing-Marke sitzt in der Rinne (x=0), der Prosatext beginnt bei
                pl-9 (Prosa-Kante). Absatzloser Artikel → KEIN Hang ([text-indent:0]):
                erste UND Folgezeile beginnen ebenfalls bei pl-9 — identische linke
                Textkante wie bei nummerierten Absätzen (Auftrag David 28.6.2026: der
                Einzug sprang sonst zwischen Artikeln mit/ohne Absatznummer). */}
            {/* Ä8 (LESER-V3 H2b): derselbe leise Hover wie an der lit.-Zeile
                oben — Herleitung dort. Ein Absatz und eine Aufzählungszeile sind
                dieselbe Geste und dürfen nicht zwei Farben tragen (§5). */}
            <p className={zk ? `[overflow-wrap:anywhere] hyphens-manual pl-9 transition-colors lc-hover-flaeche ${absMarke != null ? '-indent-9' : '[text-indent:0]'}` : undefined}>
              {absMarke != null && (
                zk
                  ? <ZitierMarke klasse="text-body-s inline-block w-9 text-left !font-medium !text-ink-500" zitat={`${zk.artikelLabel} Abs. ${absMarke} ${zk.kuerzel}`} ausweis={ausweisBasis}>{absMarke}</ZitierMarke>
                  : <sup className="num mr-1 font-semibold text-ink-500">{absMarke}</sup>
              )}
              {/* DARSTELLUNGS-NORMALISIERUNG (§3, Wortlaut unverändert): nur im
                  Tarif-/Anhang-Kontext (gepunkteter Ziffer-Token ODER Staffel)
                  werden vom PDF verschluckte Trenn-Leerzeichen ergänzt. Reguläre
                  Artikel (Bund/LexWork, sauber extrahiert) bleiben unberührt.
                  Aufgehobene Absätze («…») → gedämpftes «aufgehoben». */}
              {(() => {
                // Mehrspalten-Tabelle (Stufe 2) hat Vorrang vor Stufe 1 + Text.
                // Early-return NUR wenn mehrspaltig vorhanden UND mindestens eine Zeile.
                if (b.mehrspaltig && b.mehrspaltig.zeilen.length > 0)
                  return <MehrspaltigeTabelle spalten={b.mehrspaltig.spalten} kopf={b.mehrspaltig.kopf} zeilen={b.mehrspaltig.zeilen} />;
                // Strukturierte Tarif-Tabelle (Stufe 1) hat Vorrang vor der
                // Text-Heuristik. block.text (Vortext) bleibt leer (Task-2-Konvention:
                // bei tableisierten Blöcken ist text ''); nur TarifTabelle rendern.
                const tab = b.tabelle && b.tabelle.length > 0 ? b.tabelle : null;
                if (tab) return <TarifTabelle zeilen={tab} />;
                // Eingemischte Änderungshistorie (verdoppelte Fussnoten-Nr +
                // geleakter Label-Rest) aus dem Wortlaut-Block entfernen. Die
                // Historie selbst gehört an den Artikelfuss (Lesesicht zeigt sie
                // dort als Fussnote) — hier bleibt nur der reine Wortlaut.
                const { wortlaut } = trenneAenderungshistorie(rohtext);
                const tarifKontext = artikel.includes('.') || staffelZeilen(wortlaut) != null;
                const anzeige = tarifKontext ? normalisiereTarifText(wortlaut) : wortlaut;
                // Ganzkörper-Aufhebung (kein Wortlaut übrig) → gedämpftes «aufgehoben».
                // ABER NICHT, wenn der Block eine Aufzählung (items) trägt: dann ist der
                // leere Einleitungstext normal (die items SIND der Inhalt) — sonst würde
                // «aufgehoben» fälschlich über der Liste stehen (Bug 22.6., 232 Blöcke,
                // z.B. VWVG Art. 1). tabelle/mehrspaltig haben oben bereits Early-Return.
                const hatItems = b.items != null && b.items.length > 0;
                // ── W2·27 (15.9.2026) · LEERER BLOCK ≠ AUFHEBUNG (§8) ────────
                // Bis hierher galt beides als «aufgehoben»: der amtliche
                // Platzhalter «…»/«Aufgehoben» UND der buchstäblich LEERE Block.
                // Das sind zwei verschiedene Dinge.
                //   «…» / «Aufgehoben» ist ein Zeichen DER QUELLE. Bund: die
                //     Fedlex-Aufhebungsellipse (OR Art. 48). Kanton: LexWork
                //     setzt sie als eigene Klasse `abrogation_ellip`
                //     (adapter-lexwork.ts, `enthaeltEigeneAbrogationEllipse`) —
                //     eine amtliche Aufhebungsmarke. Sie bleibt «aufgehoben».
                //   LEER ist KEIN Zeichen der Quelle, sondern das Fehlen eines
                //     jeden — und nach den Frühausstiegen oben (titel, Bild,
                //     mehrspaltig, tabelle) auch kein weggefallener Inhalt, der
                //     woanders rendert.
                // GEMESSEN 15.9.2026 über den committeten Korpus, mit genau den
                // Bedingungen dieses Zweigs: BUND 0 Blöcke und 0 Items ändern
                // sich — jeder leere Bund-Block liegt in einem amtlich
                // markierten Artikel (1 283) oder trägt die Ellipse (1 100).
                // KANTON 109 Blöcke und 60 Items. Belegtes Beispiel für die
                // Items: BS-154.980 § 5 Abs. 1 lit. a — eine GELTENDE
                // Gebührenordnung («Für die nachstehend aufgeführten … werden
                // folgende Gebühren erhoben:»), deren Zwischentitel-Item beim
                // Extrahieren leer blieb. Der Leser schrieb daneben
                // «aufgehoben»: eine falsche Rechtsauskunft (§1), keine
                // Dämpfung. Die 109 Blöcke sind durchwegs Ein-Block-Artikel
                // (BS-153.100 § 53 «Änderung anderer Gesetze» u. a.) — dort
                // sagt schon die Statuszeile des Artikels dasselbe.
                // Der ARTIKEL-Beleg deckt seine Blöcke mit: ist der ganze
                // Artikel amtlich aufgehoben, ist es auch sein leerer Block.
                // NICHT gebaut: die absatz-genaue Aufhebung. Ihr Beleg existiert
                // (Bund: Historie-Shard, 872 Fälle; Kanton: `abrogation_ellip` je
                // <p>), liegt aber nicht in dieser Schicht — der Shard wird lazy
                // geholt (nicht prerendert ⇒ die Aussage flackerte), und der
                // Kanton hat gar keinen. Das gehört an die Bauzeit
                // (scripts/normtext/**) und ist als eigener Schritt vermerkt.
                // B2: Ersatztext, kein Wortlaut → `data-such-meta` (s. Import).
                if (!hatItems && !anzeige.trim() && !artikelAufgehoben)
                  return <span {...{ [SUCH_META]: '' }} className="italic text-ink-500"
                    title={LEERSTELLE_ERLAEUTERUNG}>{LEERSTELLE_KURZ}</span>;
                if ((!anzeige.trim() || istAufgehoben(anzeige)) && !hatItems) return <span {...{ [SUCH_META]: '' }} className="italic text-ink-500">aufgehoben</span>;
                if (!anzeige.trim()) return null;
                const zeilen = staffelZeilen(anzeige);
                // Tausender-Gruppierung NUR in Geld-Kontext (§3, FIX 2 — 22.6.2026):
                // «Fr. 12 000» → «Fr. 12'000»; Jahrzahlen «2011» bleiben unberührt.
                // Nicht auf Staffel-Tabellen (StaffelTabelle) — dort nur roher Text.
                if (zeilen) return <StaffelTabelle zeilen={zeilen} />;
                // FN-5/M14: Marker an der Wortstelle — nur im plain-Text-Pfad
                // (anzeige === wortlaut === unveränderter Zuschnitt von b.text) und
                // nur, wenn der Offset nach Marken-Delta im angezeigten Wortlaut
                // liegt. Segmentweise durch die bestehende Pipeline (verlinkt/
                // gruppiereBetraege) — der Wortlaut selbst bleibt unverändert (§1).
                if (!tarifKontext && inlineKandidaten.length > 0) {
                  const delta = b.text.length - rohtext.length;
                  const platzierbar = inlineKandidaten
                    .map((k) => ({ nr: k.nr, o: k.o - delta }))
                    .filter((k) => k.o >= 0 && k.o <= anzeige.length);
                  if (platzierbar.length > 0) {
                    for (const p of platzierbar) inlineGesetzt.add(p.nr);
                    return segmentiert(anzeige, platzierbar, (s) => verlinkt(gruppiereBetraege(s)));
                  }
                }
                return verlinkt(gruppiereBetraege(anzeige));
              })()}
              {/* Fussnoten-Marker dieses Absatzes (klickbar → Fuss-Eintrag), damit
                  klar ist, worauf sich die Fussnote bezieht. A31 (David 16.7.2026):
                  Marker klebt via Wort-Verbinder (WJ) DIREKT an den Absatztext (kein
                  ml-0.5-Abstand, kein Umbruch auf eine eigene Zeile) — wie auf Fedlex.
                  FN-5: inline gesetzte Marker (oben, Wortstelle) erscheinen hier
                  nicht mehr; nicht platzierbare Kandidaten fallen hierher zurück. */}
              {zk && (() => {
                const rest = inlineKandidaten.filter((k) => !inlineGesetzt.has(k.nr)).map((k) => k.nr);
                const alle = [...rest, ...(fnProAbsatz?.[i] ?? [])].sort(vglFnNr);
                return alle.map((nr) => (
                  <React.Fragment key={nr}>{WJ}<FnRef artikel={artikel} nr={nr} kl={fnKlasse?.[nr]} /></React.Fragment>
                ));
              })()}
            </p>
            {/* Aufzählungs-Items (lit. bei Bund, Ziff. bei Kanton). EINHEITLICH:
                identisches Markup/Styling, nur die Marke unterscheidet sich
                (Daten). Das zitierte Item wird stark hervorgehoben. Rendert über
                den geteilten Item-Pfad (itemListe, §5) — derselbe wie bei
                Bild-Blöcken mit items. */}
            {itemListe(b, i, absMarke)}
          </div>
        );
      })}
    </div>
  );
}
