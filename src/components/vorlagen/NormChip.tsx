import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { FEDLEX, erkenneFedlexGesetz, fedlexLinkFuerArtikel } from '../../lib/fedlex';
import { useLocale, fedlexLokalisiert } from '../locale';
import { bundSnapshotRef } from '../../lib/normtext/bundRef';
import { artikelImErlass } from '../../lib/normtext/artikel-bestand';
import { ladeSnapshot } from '../../lib/normtext/laden';
import { ladeStruktur } from '../../lib/normtext/browse';
import { artikelSachtitel } from '../../lib/normtext/darstellung';
import { SchliessKnopf } from '../ui/SchliessKnopf';
import { naechsterFokus } from '../../lib/normtext/fokus';
import type { NormSnapshot } from '../../lib/normtext/typen';
import { NormPopover } from '../NormPopover';
import { QuellLink } from '../ui/QuellLink';
import { readerHrefFuerRef } from './chipZiel';
import { HOVER_OEFFNEN_MS, HOVER_SCHLIESSEN_MS, istHoverZeiger } from '../hoverVorschau';

// Geteilter Fedlex-Norm-Chip (Code-Review #6, 7.6.2026: Kopien dieses
// Musters haben den Locale-Bug im Fristenspiegel erzeugt — neue Rechner
// nutzen DIESE Komponente, keine lokalen NormPill-Varianten).
//
// Progressive Enhancement (16.6.2026): Der Chip bleibt der heutige
// <a target=_blank> auf Fedlex (Fallback + SSR/Prerender/PDF-Pfad
// UNVERÄNDERT — NULL Regression, §6). Existiert ein Bund-Snapshot-Bezug
// (bundSnapshotRef), öffnet ein Klick im Browser stattdessen die Volltext-
// Vorschau im Popover.
//
// onClick-Variante (kein Doppel-Öffnen, SSR-neutral):
//  - Kein ref  → kein preventDefault → der Link öffnet wie heute (Fallback).
//  - ref da    → preventDefault + Popover-Shell SOFORT öffnen, dann async
//    laden. Async-preventDefault wäre zu spät (Default ist da schon gefeuert);
//    darum synchron entscheiden. Liefert ladeSnapshot null, zeigt das Popover
//    «Volltext nicht verfügbar» + den Live-Link statt zu navigieren — so wird
//    nie doppelt geöffnet/navigiert.
// SSR/Prerender: offen=false initial, kein Effekt läuft, der erste Render ist
// byte-identisch zum heutigen <a> (Golden unverändert).
// Default-Styling des Chip-Links — der heutige Pillen-Look. Als Default-Wert von
// linkClass ausgelagert, damit alle Bestands-Aufrufe (ohne linkClass) dasselbe
// Markup teilen und nur der Inline-Auto-Linker (NormText) ein anderes,
// fliesstext-taugliches Styling übergibt.
// V2·C-3 (§4b-B, NormChip-Verweisfarbe): + hover:border-brass-400 — der NormChip
// war der EINZIGE Norm-Chip ohne den brass-Hover-Border (KantenChip 'norm',
// rechtsprechung/NormChip, MassgebendeGesetze, EntscheidLeser tragen ihn alle);
// jetzt komplette brass-Familie (Norm/Verweis) auf einer Hover-Anatomie.
// SSR-Assertion in normLinkSsr.test deklariert nachgezogen (§6.3).
//
// H-8/B21 (12.7.2026): reiner Move aus vorlagen/ui.tsx — löste den
// Komponenten-Wert-Zyklus NormText → ui → NormPopover → ArtikelBody →
// NormText auf (madge check:zyklen). Exakt gleicher Export-Name/Props,
// keine Gelegenheits-Umbenennung. NormPopoverOverlay/NormPopoverHuelle
// bleiben bewusst in ui.tsx (zweiter Konsument KantonQuelleLink.tsx,
// keine Zyklus-Beteiligung) und werden von hier importiert.
const CHIP_LINK_CLASS = 'lc-chip no-underline hover:text-brass-700 hover:border-brass-400';

export function NormChip({ artikel, anzeige, hrefOverride, title, linkClass = CHIP_LINK_CLASS, zielIntern = true }: {
  /** Norm-Text für die Snapshot-Auflösung (bundSnapshotRef) + Fallback-URL. */
  artikel: string;
  /** Anzeigetext im Chip (Default: artikel). */
  anzeige?: React.ReactNode;
  /** Bereits aufgelöste/lokalisierte **Fedlex-Fallback-URL**; wenn gesetzt,
   *  exakt diese nutzen (z. B. wenn die Strecke n.url aus den Schema-Daten
   *  kennt).
   *
   *  VORRANG (B5 der Gegenprüfung 7.8.2026 — bis dahin unausgesprochen): Der
   *  Wert überschreibt NUR die abgeleitete Fedlex-URL, NICHT das Chip-Ziel.
   *  Existiert ein Bund-Snapshot und ist `zielIntern` gesetzt, gewinnt der
   *  interne Reader-Pfad — genau das ist V4, und ein Aufrufer, der eine
   *  lokalisierte Fedlex-URL mitgibt, will damit die Sprachfassung des
   *  AMTLICHEN Zweitlinks bestimmen, nicht den Chip nach draussen zwingen.
   *  Wer wirklich nach Fedlex zeigen muss, setzt `zielIntern={false}`.
   *  Der übergebene Wert bleibt in beiden Fällen der Zweitlink der Hülle. */
  hrefOverride?: string;
  /** title-Attribut — NUR rendern, wenn gesetzt (SSR-Byte-Gleichheit der
   *  title-losen Einbaustellen). */
  title?: string;
  /** className des Link-<a>. Default = Pillen-Chip; NormText übergibt einen
   *  dezenten Inline-Stil (gleiche Popover-Logik, andere Darstellung). */
  linkClass?: string;
  /** V4 (W2·10-UI-NAV): `href` auf den eigenen Reader zeigen, wo ein Snapshot
   *  existiert. Default true = die Chip-Flächen (Rechner-/Vorlagen-Köpfe,
   *  Entscheid-Zitate) — dort ist der Prüfpunkt der Spec verankert.
   *
   *  Der Inline-Auto-Linker im Normtext (NormText) setzt bewusst `false`:
   *  Seine Fedlex-Deep-Links sind mit einer ganzen Klasse von Zusicherungen
   *  verzahnt, die «kein Self-Link» am href-ANKER festmachen (`#art_52` ja,
   *  `#art-52` nein). Ein interner Pfad trägt genau diesen `#art-52` legitim
   *  im Ziel-Erlass — die Wächter könnten den echten Self-Link-Bug dann nicht
   *  mehr von der Normallage unterscheiden (§6.7). Diese Umstellung braucht
   *  darum eine eigene, deklarierte Runde, in der die 16 Zusicherungen auf
   *  «Ziel-Erlass» statt «Anker-Schreibweise» umgestellt werden — nicht ein
   *  beiläufiges Mitziehen (offener Rest, an den Orchestrator gemeldet). */
  zielIntern?: boolean;
}) {
  const { locale } = useLocale();
  const inhalt = anzeige ?? artikel;

  // ── Z6c (W2·22): trägt der Zielerlass die zitierte Bestimmung überhaupt? ───
  //
  // Bis hierher entstand der Artikel-Anker allein aus Kürzel + Nummer. Gemessen
  // 14.9.2026 (V-1-Tor, `messwerte/verweis-inventar.json` → `toteFremdanker`):
  // 36 von 9 675 prüfbaren Fremd-Ankern zeigen auf eine Bestimmung, die es im
  // Snapshot des Zielerlasses nicht gibt — Art. 91a StGB (im JStG viermal
  // zitiert), Art. 341bis OR (ArG), Art. 882 ZGB (ZH-230) … Der Sprung landet
  // ins Leere. NACHGEMESSEN am selben Tag, nachdem auch die kantonale
  // V-3-Weiche in die Messung kam (Gegenprüfungs-Befund C): 39 von 10 254.
  // Die 36/9 675 bleiben als Stand des Bund-Zweigs stehen, sie sind nicht
  // falsch geworden — die Grundmenge ist gewachsen.
  //
  // Die drei Beispiele stehen in korrekter Zitierform, obwohl genau sie im
  // Korpus nicht auflösen. Bis zum 14.9.2026 standen sie hier als «ERLASS
  // Nummer» geschrieben, um `check:ui-normzitate` auszuweichen — eine verbogene
  // Notation, damit ein Tor schweigt. Das Tor ist jetzt an der Wurzel repariert
  // (es blendet Kommentare aus und prüft, was ausgeliefert wird); Prosa über
  // eine aufgehobene Bestimmung darf sie darum beim Namen nennen.
  // Vollständige Liste mit Fundstelle und amtlichem Beleg:
  // `messwerte/verweis-inventar.json` und der Unit-Test.
  //
  // Amtlich gegengeprüft am 14.9.2026 (Fedlex-SPARQL + AKN-XML, alle 26
  // verschiedenen Ziele): KEINES existiert in der geltenden Fassung als eigener
  // Artikel — der Snapshot hat recht, es ist keine Extraktionslücke. 19 davon
  // führt Fedlex als aufgehobene Nummer in einem SAMMEL-Anker («Art. 11–15
  // Aufgehoben», `id="art_11_15"`), 7 gibt es gar nicht (ZGB 89bis ist die
  // historische Bezeichnung des heutigen Art. 89a). Entscheidend für den
  // Rückfall: auch FEDLEX trägt in keinem der Fälle einen `id="art_<token>"` —
  // der Deep-Link ist dort ebenso tot wie bei uns. Der Anker wegzulassen nimmt
  // also keinem Nutzer einen funktionierenden Sprung weg.
  //
  // Also: Ziel-Token vorhanden ⇒ alles wie bisher. Ziel-Token fehlt ⇒ Rückfall
  // auf die FEDLEX-ERLASSSEITE (`FEDLEX[gesetz]`), ohne Anker-Fragment und ohne
  // Popover — kein geratener «nächster» Artikel (§1), keine falsche Ansage (§8).
  // Ist der Zielerlass nicht im Korpus, ist die Frage nicht entscheidbar
  // (`null`) und es bleibt beim bisherigen Verhalten.
  //
  // AUSDRÜCKLICH NICHT die eigene Lesesicht des Erlasses (Berichtigung
  // 14.9.2026, Gegenprüfungs-Befund F — diese Zeilen versprachen sie zuvor als
  // Alternative, der Code lieferte sie nie): `ref = null` unten schaltet den
  // internen Reader-Pfad (V4) mit ab, der Fallback zeigt darum IMMER nach
  // Fedlex. Das ist kein Versehen und wird hier auch nicht nachgeholt: den
  // korpus-internen Bundes-Fremdzielen eine interne Adresse zu geben, ist der
  // eigene Folge-Schritt V-4 aus FAHRPLAN-VERWEIS-SCHAERFE §1, weil daran 16
  // Wächter-Zusicherungen hängen, die «kein Self-Link» an der ANKER-Schreibweise
  // festmachen (`#art_52` ja, `#art-52` nein, s. `zielIntern` oben). Sie müssen
  // in einer deklarierten Runde auf «Ziel-Erlass» umgestellt werden — nebenbei
  // mitgezogen könnten sie den echten Self-Link-Bug nicht mehr von der
  // Normallage unterscheiden (§6.7).
  //
  // Die Prüfung läuft SYNCHRON aus einer generierten Projektion der Snapshots
  // (`artikel-bestand.generated.ts`) — darum entscheidet der Prerender genauso
  // wie der Browser, und der href flackert nach der Hydration nicht.
  const refRoh = bundSnapshotRef(artikel);
  const zielLebt = refRoh ? artikelImErlass(refRoh.quelle, refRoh.token) !== false : true;

  // Fallback-URL: explizite Override hat Vorrang, sonst aus dem Artikel
  // ableiten (wie das heutige NormLink). Z6c: bei totem Ziel die ERLASS-URL
  // statt des Artikel-Deep-Links — `hrefOverride` bleibt unangetastet, ein
  // Aufrufer, der eine URL ausdrücklich mitgibt, wird nicht überstimmt.
  const gesetz = hrefOverride ? null : erkenneFedlexGesetz(artikel);
  const roh = hrefOverride ? null
    : zielLebt ? fedlexLinkFuerArtikel(artikel)
    : gesetz ? FEDLEX[gesetz] : null;
  const url = hrefOverride ?? (roh ? fedlexLokalisiert(roh, locale) : null);

  const triggerRef = useRef<HTMLAnchorElement>(null);
  const [offen, setOffen] = useState(false);
  // 'laedt' | NormSnapshot (geladen) | null (Snapshot nicht verfügbar)
  const [snapshot, setSnapshot] = useState<NormSnapshot | 'laedt' | null>('laedt');
  // M11 (W2·5b): amtliche Sachüberschrift des Artikels für den Popover-Kopf,
  // lazy aus dem Struktur-Sidecar (§15: erst beim Öffnen). undefined = (noch) keine.
  const [sachtitel, setSachtitel] = useState<string | undefined>(undefined);
  // V2: Hover-Uhr (Öffnen/Nachlauf) + Merkung, ob DIESE Karte per Hover kam —
  // nur dann bleibt sie fokus- und scroll-neutral und schliesst beim Weg-Zeigen.
  // Beides in refs: kein React-Compiler im Projekt, also nie auf Memoisierung
  // verlassen; refs überleben jedes Re-Render (Projekt-Lektion 'React-Compiler aus').
  const uhr = useRef<number | undefined>(undefined);
  // «kam per Hover» wird IM Render gelesen (autoFokus/modal) — also State, nicht
  // ref: ein ref-Wert löst kein Re-Render aus und wäre beim ersten Paint der
  // Karte noch der alte (Lint-Regel react-hooks/refs, Fund im Tor 7.8.2026).
  const [perHover, setPerHover] = useState(false);
  const stoppUhr = () => {
    if (uhr.current !== undefined) { window.clearTimeout(uhr.current); uhr.current = undefined; }
  };
  // Timer beim Unmount abräumen (sonst feuert er in eine entfernte Komponente).
  useEffect(() => () => { if (uhr.current !== undefined) window.clearTimeout(uhr.current); }, []);

  // Keine Fallback-URL → exakt das heutige Verhalten (reiner span-Chip).
  if (!url) return <span className="lc-chip" title={title}>{inhalt}</span>;

  // Z6c: totes Ziel ⇒ wie «kein Snapshot-Bezug». Damit entfallen in EINEM Zug
  // der interne Artikel-Anker, das Popover (das ohnehin nur «Volltext nicht
  // verfügbar» zeigen könnte) und der preventDefault-Klickpfad; übrig bleibt
  // der ruhige Erlass-Link in derselben Chip-/Verweis-Klasse wie bisher.
  const ref = zielLebt ? refRoh : null;

  // ── V4 (W2·10-UI-NAV): `href` intern, wo ein Snapshot existiert ────────────
  // Der Klick öffnete schon bisher per preventDefault das interne Popover — der
  // href zeigte aber weiter auf Fedlex. Damit landeten genau die Gesten, die den
  // Handler UMGEHEN (Cmd-/Ctrl-Klick, Mittelklick, «Link kopieren», «in neuem Tab
  // öffnen»), ausserhalb der Plattform, obwohl der Volltext lokal vorliegt.
  // Jetzt trägt der Chip den eigenen Reader-Pfad; `target=_blank`/`rel` entfallen
  // dort, weil ein interner Pfad in derselben SPA navigiert. Die amtliche
  // Rückverfolgbarkeit (§7/§8) bleibt sichtbar: das Popover führt den Zweitlink
  // «↗ geltende Fassung» auf Fedlex, die Hülle ebenso. Ohne Snapshot bleibt der
  // Chip unverändert der Fedlex-<a> (Fallback, SSR/PDF-Pfad byte-gleich).
  const internHref = ref && zielIntern ? readerHrefFuerRef(ref) : null;
  const href = internHref ?? url;
  // §8-Ehrlichkeit: Bestands-Aufrufer geben «… auf Fedlex öffnen» als title mit.
  // Zeigt der Chip intern, wäre das eine falsche Ansage — dann sagt der Tooltip,
  // was wirklich passiert. Title-LOSE Aufrufstellen bleiben title-los (SSR-Byte-
  // Gleichheit ihrer Zeile, s. normLinkSsr (a)).
  const wirkTitle = internHref && title ? `${artikel} — Wortlaut anzeigen` : title;

  // Der EINE Öffnungs-Pfad (Klick wie Hover): Shell sofort zeigen, dann laden.
  const oeffne = (perZeiger: boolean) => {
    if (!ref) return;
    stoppUhr();
    setPerHover(perZeiger);
    setSnapshot('laedt');
    setSachtitel(undefined);
    setOffen(true);
    ladeSnapshot('bund', ref.quelle, ref.token).then((s) => setSnapshot(s));
    // M11: Sachüberschrift lazy nachladen (eigener, gecachter Sidecar-Fetch —
    // §15: kein eager-Korpus). Fehlt der Randtitel/schlägt der Fetch fehl, bleibt
    // sachtitel undefined → Popover-Kopf byte-gleich «Art. N ERLASS» (§8).
    ladeStruktur('bund', ref.quelle).then((m) => {
      setSachtitel(artikelSachtitel(m?.[ref.token]?.marginalie ?? []) ?? undefined);
    }).catch(() => setSachtitel(undefined));
  };

  const beimKlick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref) return; // kein Snapshot → normaler Link öffnet wie heute
    // Cmd-/Ctrl-/Shift-/Mittelklick NICHT abfangen (V4): diese Gesten sollen den
    // internen href in einem neuen Tab/Fenster landen lassen, nicht das Popover.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    oeffne(false);
  };

  // ── V2: Hover-Vorschau (Desktop) am SELBEN Popover ────────────────────────
  // Touch bleibt Klick (istHoverZeiger). Geladen wird erst, wenn der Zeiger
  // ruht (§15: kein Fetch beim Vorbeifahren). Beim Weg-Zeigen schliesst die
  // Karte mit Nachlauf, damit der Zeiger vom Chip hineinwandern kann.
  const beiZeigerRein = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!ref || offen || !istHoverZeiger(e.pointerType)) return;
    stoppUhr();
    uhr.current = window.setTimeout(() => oeffne(true), HOVER_OEFFNEN_MS);
  };
  const beiZeigerRaus = (e: React.PointerEvent<HTMLElement>) => {
    if (!istHoverZeiger(e.pointerType)) return;
    stoppUhr();
    // Vor dem Öffnen: nur die Uhr stoppen. Nach dem Öffnen: nur schliessen, wenn
    // die Karte per Hover kam — eine angeklickte Karte bleibt stehen.
    if (offen && perHover) uhr.current = window.setTimeout(() => setOffen(false), HOVER_SCHLIESSEN_MS);
  };
  const beiZeigerRueck = (e: React.PointerEvent<HTMLElement>) => {
    if (!istHoverZeiger(e.pointerType)) return;
    stoppUhr(); // Zeiger ist in der Karte angekommen → Schliess-Nachlauf abbrechen
  };

  const schliessen = () => {
    stoppUhr();
    setOffen(false);
    // Fokus nur zurückgeben, wenn er auch genommen wurde (Klick-Weg). Beim
    // Hover-Weg stand er nie im Dialog — ein focus() risse ihn dem Nutzer weg.
    if (!perHover) triggerRef.current?.focus();
    setPerHover(false);
  };

  return (
    <>
      <a
        ref={triggerRef}
        href={href}
        {...(internHref ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
        {...(wirkTitle ? { title: wirkTitle } : {})}
        className={linkClass}
        onClick={beimKlick}
        onPointerEnter={beiZeigerRein}
        onPointerLeave={beiZeigerRaus}
      >
        {inhalt}
      </a>
      {offen && (
        <NormPopoverOverlay onClose={schliessen} triggerRef={triggerRef}
          modal={!perHover}
          onZeigerRein={beiZeigerRueck} onZeigerRaus={beiZeigerRaus}>
          {snapshot && snapshot !== 'laedt'
            ? <NormPopover snapshot={snapshot} passus={{ absatz: ref?.absatz ?? null, lit: ref?.lit, ziff: ref?.ziff }} sachtitel={sachtitel} alsDialog={!perHover} onClose={schliessen} />
            : <NormPopoverHuelle zustand={snapshot === 'laedt' ? 'laedt' : 'fehlt'} url={url} artikel={artikel} alsDialog={!perHover} onClose={schliessen} />}
        </NormPopoverOverlay>
      )}
    </>
  );
}

// Overlay/Backdrop für die Norm-Vorschau. NormPopover liefert bewusst nur den
// Dialog-Inhalt (lc-card), nicht das Overlay — beides stellt dieser Rahmen:
// das Popover erscheint AM KLICKORT (am Trigger verankert, nicht mittig — Wunsch
// David), Klick auf den Backdrop schliesst. Rein clientseitig (nie im Prerender).
//
// Verankerung: fixe Koordinaten aus dem getBoundingClientRect des Triggers
// (unter dem Trigger, sonst darüber; horizontal in den Viewport geklemmt). Der
// Portal hängt am body → ausserhalb jedes `container-type`-Vorfahren, also
// Viewport-Koordinaten korrekt AUCH in einem Split-View-Pane (sonst läge das
// fixed-Popover am Pane-Container statt am Viewport — der eigentliche Bug).
// Ohne triggerRef (Altaufrufer) bleibt es mittig.
//
// PORTAL an document.body: Der Auslöser (Norm-Chip / «amtliche Quelle»-Link)
// steht teils in einem <p> (z. B. die Tarif-Quelle-Zeile). Würde das Overlay
// inline gerendert, läge der Dialog-<div>/<p>/<h2> IM <p> → ungültiges HTML +
// Hydration-Fehler. Der Portal hängt das Overlay ans body, ausserhalb des <p>.
//
// A11y (16.6.2026): Da der Dialog aria-modal="true" trägt, erwartet assistive
// Technik eine Fokus-Falle UND einen ruhenden Hintergrund. Beides wird hier
// verdrahtet — am gemeinsamen Overlay, das sowohl NormPopover als auch
// NormPopoverHuelle umschliesst:
//  (1) Fokus-Falle: Tab/Shift+Tab zyklisch zwischen erstem und letztem
//      fokussierbaren Element des Dialogs (reine Index-Logik in
//      lib/normtext/fokus.ts, hier nur die DOM-Verdrahtung).
//  (2) Body-Scroll-Lock: document.body overflow:hidden, solange offen; beim
//      Schliessen/Unmount exakt der vorherige Inline-Wert wiederhergestellt.
// Beides nur im useEffect (window/document) → SSR/Prerender unberührt; der
// Erst-Render bleibt byte-gleich (Overlay rendert ohnehin nur clientseitig).
// Der Fokus-Rückgabe auf den Trigger bleibt beim Aufrufer (triggerRef).
//
// H-8/B21 (12.7.2026): mit NormChip aus vorlagen/ui.tsx hierher gezogen (reiner
// Move) — NormPopoverOverlay/NormPopoverHuelle hatten nur zwei Konsumenten
// (NormChip hier + KantonQuelleLink.tsx), keine Zyklus-Beteiligung, aber ein
// Verbleib in ui.tsx hätte einen neuen NormChip.tsx↔ui.tsx-Zyklus erzeugt (ui.tsx
// importiert NormChip für NormLink). Exakt gleicher Export-Name/Props.
export function NormPopoverOverlay({ children, onClose, triggerRef, modal = true, onZeigerRein, onZeigerRaus }: {
  children: React.ReactNode;
  onClose: () => void;
  /** Trigger-Element → Popover wird daran verankert (sonst zentriert). */
  triggerRef?: RefObject<HTMLElement | null>;
  /** V2: false = Hover-Vorschau statt Dialog — ohne Fokus-Falle und ohne
   *  Body-Scroll-Lock. Beides ist für einen ANGEKLICKTEN Dialog richtig
   *  (aria-modal verlangt ruhenden Hintergrund), für eine Karte, die der
   *  Zeiger nur streift, aber feindlich: der Nutzer könnte plötzlich nicht
   *  mehr scrollen. Default true ⇒ Klick-Weg unverändert. */
  modal?: boolean;
  /** V2 (WCAG 1.4.13 «hoverable»): Zeiger-Ereignisse der Karte selbst — der
   *  Aufrufer bricht damit seinen Schliess-Nachlauf ab, sobald der Zeiger vom
   *  Chip in die Karte gewandert ist. Der Portal hängt am body, React leitet
   *  die Ereignisse aber dem REACT-Baum entlang zurück zum Aufrufer. */
  onZeigerRein?: (e: React.PointerEvent<HTMLElement>) => void;
  onZeigerRaus?: (e: React.PointerEvent<HTMLElement>) => void;
}) {
  const dialogContainerRef = useRef<HTMLDivElement>(null);
  // Verankerte Position (am Trigger). null = noch nicht berechnet/kein Trigger.
  const [pos, setPos] = useState<{ top: number; left: number; maxH?: number } | null>(null);

  // Position aus dem Trigger-Rect ableiten: bevorzugt UNTER dem Trigger, sonst
  // darüber; horizontal an den Viewport geklemmt. useLayoutEffect misst die
  // gerenderte Kartenhöhe und setzt die Position VOR dem Paint (kein Springen).
  //
  // Befund David 3.7.2026 («Popover soll dort aufgehen, wo der Link ist»):
  // Die Horizontal-Klemmung kollabierte auf left=8, weil der Container `w-full`
  // trug und der Inline-Style `maxWidth: calc(100vw - 16px)` das `max-w-xl` der
  // Klasse ÜBERSCHRIEB → offsetWidth = voller Viewport, `vw - kw - m` ≈ 8. Das
  // Popover öffnete darum bei jedem Link rechts der Mitte am LINKEN Fensterrand.
  // Fix: der verankerte Container erhält seine Breite als EINEN Inline-Wert
  // (min(36rem = max-w-xl, 100vw − 16px)) — die Messung stimmt, die Klemmung
  // platziert am Link. Zusätzlich folgt die Position dem Trigger beim Scrollen
  // (capture-Listener fängt auch innere Scroll-Container, z. B. Split-View-
  // Panes, die der Body-Scroll-Lock nicht sperrt).
  useLayoutEffect(() => {
    const trigger = triggerRef?.current;
    const karte = dialogContainerRef.current;
    if (trigger == null || karte == null) return;
    const berechne = () => {
      const t = trigger.getBoundingClientRect();
      const kw = karte.offsetWidth;
      const kh = karte.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const m = 8; // Sicherheitsabstand zum Rand
      const left = Math.min(Math.max(m, t.left), Math.max(m, vw - kw - m));
      if (!modal) {
        // HOVER-WEG: die Karte darf ihren eigenen Trigger NIEMALS überdecken.
        // Sonst ist der Chip nicht mehr anklickbar (Rest-Symptom von Blocker B1,
        // gemessen am 7.8.2026: die Karte kippte auf kurzen Viewports nach oben
        // und legte sich über den Chip — «Klick öffnet den Dialog» schlug fehl,
        // weil der Klick in der Karte landete). Der Klick-Weg behält seine
        // Platzierung unverändert (unten), er DARF überlappen: dort ist der
        // Trigger ohnehin gesperrt und der Backdrop fängt den Klick.
        // Regel: die grössere der beiden Lücken gewinnt, und die Karte wird auf
        // genau diese Lücke gedeckelt (sie scrollt dann in sich, statt zu
        // wandern). Kein Magic-Number-Zuwachs — `m`/6 sind die bestehenden Masse.
        const platzUnten = vh - t.bottom - 6 - m;
        const platzOben = t.top - 6 - m;
        if (platzUnten >= platzOben) {
          setPos({ top: t.bottom + 6, left, maxH: Math.max(0, platzUnten) });
        } else {
          const hoehe = Math.min(kh, Math.max(0, platzOben));
          setPos({ top: t.top - 6 - hoehe, left, maxH: Math.max(0, platzOben) });
        }
        return;
      }
      let top = t.bottom + 6;
      if (top + kh + m > vh) {
        const oben = t.top - kh - 6;
        top = oben >= m ? oben : Math.max(m, vh - kh - m);
      }
      setPos({ top, left });
    };
    berechne();
    // Scroll-Nachführung rAF-gedrosselt (Review 3.7.): das capture-Event feuert
    // auch beim Scrollen IM Popover — ungedrosselt wäre jeder Tick ein Re-Render.
    let raf = 0;
    const beiScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; berechne(); });
    };
    window.addEventListener('resize', berechne);
    window.addEventListener('scroll', beiScroll, true);
    return () => {
      window.removeEventListener('resize', berechne);
      window.removeEventListener('scroll', beiScroll, true);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [triggerRef, children, modal]);

  // Fokus-Falle: hält Tab/Shift+Tab innerhalb des Dialogs (zyklisch). Die reine
  // Index-Berechnung liegt in naechsterFokus (testbar); hier nur DOM-Zugriff.
  useEffect(() => {
    const wurzel = dialogContainerRef.current;
    if (wurzel == null || !modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      // Bei jedem Tab frisch einsammeln (Inhalt kann nachladen: Hülle → Volltext).
      const fokussierbar = Array.from(
        wurzel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (fokussierbar.length === 0) return;
      const aktiv = fokussierbar.indexOf(document.activeElement as HTMLElement);
      const ziel = naechsterFokus(fokussierbar.length, aktiv, e.shiftKey);
      if (ziel < 0) return;
      e.preventDefault();
      fokussierbar[ziel].focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  // Body-Scroll-Lock: Hintergrund ruhig stellen, solange das Overlay offen ist.
  // Der vorherige Inline-Wert wird gemerkt und beim Unmount exakt zurückgesetzt
  // (mehrere Overlays gleichzeitig sind nicht möglich — eins pro Chip).
  useEffect(() => {
    if (!modal) return; // Hover-Vorschau sperrt den Seiten-Scroll nicht (s. `modal`)
    const vorher = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = vorher; };
  }, [modal]);

  if (typeof document === 'undefined') return null; // SSR/Prerender: kein Overlay
  const verankert = triggerRef != null;

  // Die Karte selbst — in beiden Wegen dieselbe, verankert per fixen Koordinaten.
  const karte = (
    <div
      ref={dialogContainerRef}
      onClick={(e) => e.stopPropagation()}
      onPointerEnter={onZeigerRein}
      onPointerLeave={onZeigerRaus}
      style={verankert
        // Breite als EIN Inline-Wert (36rem = max-w-xl), damit offsetWidth die
        // echte Kartenbreite misst — s. Befund oben (sonst Klemmung auf left=8).
        // z-index nur auf dem Hover-Weg: dort trägt die Karte ihn selbst, weil
        // sie ohne den Backdrop-Rahmen im Portal steht (Blocker B1 unten).
        ? {
          position: 'fixed', top: pos?.top ?? 0, left: pos?.left ?? 0,
          width: 'min(36rem, calc(100vw - 16px))',
          visibility: pos ? 'visible' : 'hidden',
          // Hover-Weg: eigener z-index (kein Backdrop-Rahmen mehr) + Deckel auf
          // die verfügbare Lücke; der Inhalt scrollt darin, statt den Trigger
          // zu überdecken.
          ...(modal ? {} : { zIndex: 50, maxHeight: pos?.maxH, overflowY: 'auto' as const }),
        }
        : undefined}
      className="w-full max-w-xl"
    >
      {children}
    </div>
  );

  // ── BLOCKER B1 (Gegenprüfung 7.8.2026): KEIN Klick-Fänger auf dem Hover-Weg ─
  // Der verankerte Backdrop (`fixed inset-0 z-modal` + `onClick={onClose}`) ist auf
  // dem KLICK-Weg richtig: er schliesst den Dialog beim Danebenklicken. Auf dem
  // HOVER-Weg war er der Defekt — er legte sich über die ganze Seite, also auch
  // über den Chip. Zwei belegte Folgen: (1) der Chip verlor den Zeiger
  // (`pointerleave`) und die Karte schoss sich nach 180 ms selbst ab, um sofort
  // wieder aufzugehen — Flackern; (2) JEDER Klick traf den Backdrop, ein Klick
  // auf den Chip öffnete das Popover also nicht mehr (Spec «Klick-Verhalten
  // unverändert» verletzt). Der Hover-Weg rendert die Karte darum NACKT ins
  // Portal — genau die Bauart des V3-`RegestePopover`. Geschlossen wird dort
  // ausschliesslich über Chip-/Karten-Verlassen (der Aufrufer, s. `onZeigerRaus`).
  // Tor: `e2e/uinav-v2-v4-normchip.e2e.ts` (g) misst die Ursache — kein
  // viewport-füllendes, klick-empfangendes Fixed-Element, solange die Karte steht.
  if (!modal) return createPortal(karte, document.body);

  return createPortal(
    <div
      // Verankert: transparenter Klick-Fänger (kein Dim, Popover-Charakter).
      // Zentriert (Altpfad): gedimmter, mittig gestellter Modal-Backdrop.
      //
      // F2-1 (31.8.2026): das Dim war `bg-ink-900/40`. `--ink-900` flippt mit dem
      // Thema (dunkel `#E9E7E2`) — im Dunkelmodus hellte dieser «Scrim» auf,
      // statt abzudunkeln (Messung/Herleitung: `pages/gesetz-leser/v3/LeserScrim.tsx`,
      // B7-N1). `.lc-scrim-dialog` ist die Rolle «zentrierter modaler Dialog»
      // (src/index.css): schwarz statt Tinte, Deckung unverändert 40 %.
      className={verankert ? 'fixed inset-0 z-modal' : 'lc-scrim-dialog fixed inset-0 z-modal flex items-center justify-center p-4'}
      onClick={onClose}
    >
      {/* Klicks im Dialog dürfen nicht zum Backdrop durchschlagen. */}
      {karte}
    </div>,
    document.body,
  );
}

// Lade-/Fallback-Inhalt, wenn (noch) kein Snapshot vorliegt. Esc + Fokus wie im
// NormPopover; bei 'fehlt' der sichtbare Live-Link (§8) statt Volltext.
export function NormPopoverHuelle({ zustand, url, artikel, alsDialog = true, onClose }: {
  zustand: 'laedt' | 'fehlt'; url: string; artikel: string;
  /** V2: false = Hover-Vorschau statt Dialog (s. NormPopover.alsDialog) —
   *  kein Fokus-Griff, `role="group"` statt `dialog`/`aria-modal`. */
  alsDialog?: boolean;
  onClose: () => void;
}) {
  const schliessRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (alsDialog) schliessRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Esc') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, alsDialog]);
  return (
    <div data-norm-vorschau role={alsDialog ? 'dialog' : 'group'}
      {...(alsDialog ? { 'aria-modal': true as const, tabIndex: -1 } : {})}
      aria-label={`Norm-Vorschau ${artikel}`}
      className="lc-popover w-full max-w-xl p-0 text-left">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3">
        <div className="min-w-0">
          <p className="lc-overline text-brass-700">Norm-Vorschau</p>
          <h2 className="text-body-l font-semibold text-ink-900 truncate">{artikel}</h2>
        </div>
        {/* A3-1 (R3-β): EIN Schliess-✕ der App. Diese Fundstelle war die
            zeichengleiche Kopie der `NormPopover`-Fassung (dieselbe Kopfzeile,
            derselbe Knopf) — sie mitzuziehen war Pflicht, nicht Kür (§5). */}
        <SchliessKnopf ref={schliessRef} name="Norm-Vorschau schliessen"
          onClick={onClose} klasse="-mr-1" />
      </div>
      <div className="px-5 py-4">
        <p className="text-body-s text-ink-700">
          {zustand === 'laedt' ? 'Volltext wird geladen …' : 'Volltext nicht verfügbar.'}
        </p>
      </div>
      {/* B-1 (31.8.2026): hier stand «↗ geltende Fassung auf Fedlex» — die
          vierte Schreibweise desselben Ziels. Kanon Ä110 über den geteilten
          `QuellLink`; «auf Fedlex» fällt weg, weil der Zusatz nur die Quelle
          wiederholt, die dieser Fallback-Popover ohnehin ist (Ä121 gilt der
          Panel-LISTE, wo mehrere Sammlungen nebeneinander stehen). */}
      <div className="border-t border-line px-5 py-3">
        <QuellLink href={url} className="lc-chip no-underline hover:text-brass-700" />
      </div>
    </div>
  );
}
