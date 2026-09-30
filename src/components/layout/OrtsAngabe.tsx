import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

// ─── A-4 (W2·19-DESIGN-KONSISTENZ, 31.8.2026) · EINE ORTSANGABE ─────────────
//
// BEFUND der Finder-Welle: die Frage «wo bin ich?» wurde in ZWEI Leisten
// beantwortet und in zwei Anatomien gesetzt — `InhaltsKopf` (Einzelansicht) und
// `PaneKopf` (Split-View). Gegenüberstellung des Vorzustands:
//
//   Merkmal              InhaltsKopf                 PaneKopf
//   ───────────────────────────────────────────────────────────────────────────
//   Schriftgrad          text-xs                     text-body-s
//   Landmark             <nav aria-label="Brotkrümel">  keiner
//   Overflow-Regel       Rücksprung «‹», führende     KEINE — jede Krume
//                        Krumen fallen als EINE       truncatete FÜR SICH
//                        Einheit                      («( ) )», genau der
//                                                     Befund ②, den der
//                                                     InhaltsKopf behoben hat
//   Artikel-Etikett      ohne das Kürzel, das die     volles Zitat — obwohl
//                        Krume daneben schon nennt    die Krume daneben steht
//   Stand-Farbe          ink-600 (F2: 11-px-Text      ink-500
//                        trägt ≥ 4.5:1)
//
// Die Steuerknöpfe bleiben pane-eigen (⠿ ◂ ▸ ⇱ ⧉ ✕ gehören dem FENSTER, nicht
// dem Ort); vereinheitlicht wird der IDENTITÄTS-Teil. Reine Darstellung (§3),
// Konsumenten ziehen auf den einen Baustein (§5/§10).
//
// ── DIE OVERFLOW-KASKADE MISST DAS ELEMENT, NICHT DEN VIEWPORT ──────────────
// Der InhaltsKopf schaltete auf `sm:` — im Split-View die falsche Zahl: eine
// 420-px-Pane in einem 1440-px-Fenster liest `sm:` als erfüllt und zeigt die
// volle Krumen-Kette, die dann zeichenweise truncatet. Dieselbe Herleitung wie
// in `pages/gesetz-leser/v3/kopfStufen.ts` (dort Z. 12–18): gemessen wird die
// Breite des ELEMENTS, damit in Einzelansicht, breitem und schmalem Pane
// dieselbe Regel aus derselben Quelle gilt — ohne `imPane`-Verzweigung.
//
// UMGESETZT ALS CONTAINER-QUERY, NICHT ALS ResizeObserver: diese Leiste steht
// im PRERENDER (anders als die V3-Leser-Hülle, R10). Ein JS-gemessener Modus
// startete beim ersten Client-Render aus `window.innerWidth` und wiche damit
// auf jedem Telefon vom vorgerenderten Markup ab (Hydrations-Abweichung + der
// Sprung, den §15.2 verbietet). Die Container-Query trifft dieselbe Aussage in
// CSS, ohne Skript und ohne Startwert.
//
// SCHWELLE `@md/ort` = 28 rem (448 px) — hergeleitet aus dem Vorzustand, nicht
// gewählt: die abgelöste Regel schaltete bei Viewport 640 px. Dort misst die
// Ort-Zone der Einzelansicht 640 − 48 (px-6) − 8 (gap) − ~127 (Stand-Angabe +
// ✕) ≈ 457 px. 448 px ist die nächstgelegene Stufe darunter; der Umschaltpunkt
// wandert damit um ~10 px Fensterbreite. Wo KEINE Stand-Angabe steht, ist die
// Zone breiter und die Kette hält länger — das ist der Gewinn, nicht der
// Fehler: die Regel folgt jetzt dem Platz statt dem Fenster.

export interface Krume {
  label: string;
  to?: string;
}

/** Artikel-Etikett ohne die Wiederholung des Erlass-Kürzels, das direkt davor
 *  in der Brotkrume steht («Art. 212 ZGB» → «Art. 212», wenn die Blatt-Krume
 *  «ZGB» heisst). Reine Anzeige-Ableitung: der Melde-Vertrag
 *  (`KopfDaten.artikel`) bleibt das volle Zitat. Greift nur bei exaktem
 *  Suffix-Treffer mit Wortgrenze; sonst bleibt das Etikett unangetastet.
 *  NICHT exportiert (`react-refresh/only-export-components`): geprüft wird sie
 *  am gerenderten Markup beider Leisten (`src/tests/ortsAngabe.test.tsx`) —
 *  ihre Wirkung, nicht ihre Signatur. */
function kuerzeArtikel(artikel: string | null | undefined, blatt: string | undefined): string | null {
  if (!artikel) return null;
  if (!blatt) return artikel;
  const suffix = ` ${blatt}`;
  return artikel.endsWith(suffix) ? artikel.slice(0, -suffix.length) : artikel;
}

/**
 * Die Stand-Angabe beider Leisten — EINE Anatomie, zwei Plätze.
 *
 * D1/§7: der Stand ist ein Rechtswert und bleibt in JEDER Breite ausgeschrieben
 * stehen; er wird leiser gesetzt (Micro), nie versteckt. `ink-600` statt
 * `ink-500`, weil 11-px-Text ≥ 4.5:1 tragen muss (Reglement F2) — die
 * Herleitung stand bis 31.8.2026 nur im `InhaltsKopf`, während der `PaneKopf`
 * daneben auf ink-500 lief.
 *
 * WO die Angabe steht, bleibt Sache der jeweiligen Leiste und ist darum KEIN
 * Merkmal dieses Bausteins: in der Einzelansicht sitzt sie im Griff-Riegel
 * rechts (dort ist sie die leiseste von vier Angaben), im Pane in der
 * Identitäts-Zone links (dort gibt es keinen Riegel, in den sie gehörte). Der
 * `trenner` ist das einzige, was diese zwei Plätze unterscheidet.
 */
export function StandAngabe({ stand, trenner }: { stand: string; trenner?: boolean }) {
  return (
    <span className="shrink-0 whitespace-nowrap text-micro text-ink-600">
      {trenner && <span aria-hidden className="mr-1 text-ink-300">·</span>}
      Stand <span className="num">{stand}</span>
    </span>
  );
}

function KrumeInhalt({ krume, blatt, aufKrume, mitLink, children }: {
  krume: Krume;
  blatt: boolean;
  aufKrume?: (to: string) => void;
  mitLink?: boolean;
  children?: ReactNode;
}) {
  const inhalt = children ?? krume.label;
  // PANE-LOKAL vs. global (David 1.7.2026): im Split-View geht der Klick über
  // `aufKrume` an den Pane-eigenen Navigator — nie ein globaler <Link>, der das
  // ganze Fenster wegnavigieren würde. Ohne beides (SSR/Prerender im Pane)
  // bleibt der Krümel statisch.
  if (krume.to && aufKrume) {
    return (
      <button type="button" onClick={() => aufKrume(krume.to!)}
        /* R8 (7.9.2026): die Krume kappt per `truncate` — dann MUSS der volle
           Wortlaut per `title` erreichbar bleiben. Gemessen ohne ihn: der
           Blatt-Krumen auf /materialien/ESTV-KS-DBG-49 @320 zeigte 242 von
           351 px («Kreisschreiben Nr. 49: Aufwand bei Ausland-Au…»), auf
           /gesetze/kanton/ZH-211.11 132 von 276 px — der Rest war nirgends
           abrufbar. Quelle ist `krume.label` (immer ein String), nicht
           `inhalt`: das kann ein ReactNode sein. */
        title={krume.label}
        /* Ring/Farbe kommen aus der globalen `:focus-visible`-Regel (index.css,
           Rolle --focus); NUR der Offset ist lokal: negativ, weil der Krümel in
           einer schmalen Kopfzeile sitzt und ein aussenliegender Ring dort
           geclippt würde. */
        className="truncate rounded-sm no-underline hover:text-brass-700 hover:underline focus-visible:-outline-offset-2">{inhalt}</button>
    );
  }
  if (krume.to && mitLink) {
    return <Link to={krume.to} title={krume.label} className="truncate no-underline hover:text-brass-700">{inhalt}</Link>;
  }
  return <span title={krume.label} className={`truncate ${blatt ? 'font-medium text-ink-800' : ''}`}>{inhalt}</span>;
}

export function OrtsAngabe({ breadcrumb, blattLabel, artikel, aufKrume, mitLink, navLabel }: {
  breadcrumb?: Krume[];
  /** Fallback-Blatt, wenn keine Krume vorliegt (Pane: das Fenster-Label). */
  blattLabel?: string;
  /** Laufender Artikel («Art. 429 StPO»), live gemeldet. */
  artikel?: string | null;
  /** Split-View: Krümel-Klick pane-lokal. Gesetzt ⇒ <button> statt <Link>. */
  aufKrume?: (to: string) => void;
  /** Einzelansicht: Krümel als globaler <Link>. */
  mitLink?: boolean;
  /**
   * Name der Landmark. IMMER gesetzt, und je Leiste verschieden: der `PaneKopf`
   * trug bis 31.8.2026 gar keine — mit der Begründung, mehrere Panes erzeugten
   * eine «gleichnamige Landmark-Flut». Der Einwand galt der GLEICHNAMIGKEIT,
   * nicht der Landmark: ein Pane, dessen Ortsangabe «Brotkrümel «StPO»» heisst,
   * ist in der Landmark-Liste unterscheidbar und erstmals direkt anspringbar.
   */
  navLabel: string;
}) {
  const krumen = breadcrumb && breadcrumb.length > 0
    ? breadcrumb
    : blattLabel ? [{ label: blattLabel }] : [];
  const letzter = krumen.length - 1;
  const blatt = krumen[letzter];
  // Rücksprung-Ziel für schmale Zonen: die NÄCHSTGELEGENE klickbare Krume
  // oberhalb des Blatts. Bei Gesetzen ist das die Ebene-Krume («Bund» →
  // /gesetze, «Kanton BS» → /gesetze?ebene=kanton&kt=BS) — also dieselbe
  // Übersicht, auf die auch die Sektions-Krume führt: kein Ziel geht verloren.
  const eltern = krumen.slice(0, letzter).reverse().find((b) => b.to);
  const artikelKurz = kuerzeArtikel(artikel, blatt?.label);
  // HN-D6 (A11y-Übergabe DK-Bericht, 30.9.2026): auf den Vorlagen-Seiten meldet
  // der Kopf keine Krume (`ortsLeistenKrumen` → leer, kein Blatt-Fallback) und
  // keinen Artikel — die Zone blieb trotzdem ein `<nav aria-label="Brotkrümel">`,
  // eine LEERE Landmarke in der Screenreader-Liste (gemessen: 0 Kinder, 0 px
  // hoch auf /vorlagen/nda). Die Zone selbst bleibt als `flex-1`-Füller der
  // Leiste (die Griffe rechts behalten ihren Platz), nur die Rolle entfällt.
  const leer = krumen.length === 0 && !artikel;
  const Wurzel = leer ? 'div' : 'nav';
  return (
    // `@container/ort` — die Zone misst SICH SELBST (Herleitung im Kopf dieser
    // Datei). `min-w-0` + `overflow-hidden` machen sie zur einzigen schrumpfenden
    // Zone ihrer Leiste: die Griffe daneben behalten in jeder Breite ihre Plätze
    // (keine Umbruch-Wanderung, CLS 0 beim Einlaufen des Live-Artikels).
    <Wurzel aria-label={leer ? undefined : navLabel}
      className="@container/ort flex min-w-0 flex-1 items-center gap-1 overflow-hidden whitespace-nowrap text-xs text-ink-500">
      {/* In schmalen Zonen: EIN Rücksprung statt vier zerhackter Krumen. */}
      {eltern?.to && (
        <span className="shrink-0 @md/ort:hidden">
          <KrumeInhalt krume={eltern} blatt={false} aufKrume={aufKrume} mitLink={mitLink}>
            <span aria-label={`Zurück zu ${eltern.label}`} title={`Zurück zu ${eltern.label}`}>‹</span>
          </KrumeInhalt>
        </span>
      )}
      {krumen.map((b, i) => (
        <span key={`${i}-${b.label}`}
          // In schmalen Zonen bleibt nur die Blatt-Krume — und auch die nur,
          // solange KEIN Artikel läuft: sobald einer läuft, trägt sein volles
          // Zitat («Art. 212 ZGB») das Kürzel bereits mit sich. Zwei Angaben
          // desselben Erlasses auf 360 px wären die teuerste Dopplung der Leiste.
          className={`min-w-0 items-center gap-1 ${
            i < letzter || artikel ? 'hidden @md/ort:inline-flex' : 'inline-flex'
          }`}>
          {/* C5 (Design-Qualitäts-Pass 29.8.2026) · KRUMEN-TRENNER ink-400 statt
              ink-300: gemessen gegen `--paper` misst ink-300 hell 2.28:1 /
              dunkel 2.34:1 — der Trenner trägt die Gliederung der Ortsangabe und
              verschwand. ink-400 misst hell 3.30 / dunkel 3.65 (auf `--well`
              3.13 / 3.83) und hält die F2-Schwelle 3:1 in BEIDEN Themes. Bewusst
              NICHT ink-500 wie die Klapp-Dreiecke: die Krumen-Links selbst laufen
              auf ink-500 — ein gleich starker Trenner nähme ihnen die Hierarchie.
              Der Trenner ist Struktur, kein Bedienelement (aria-hidden). */}
          {i > 0 && <span aria-hidden className="hidden text-ink-400 @md/ort:inline">›</span>}
          <KrumeInhalt krume={b} blatt={i === letzter} aufKrume={aufKrume} mitLink={mitLink} />
        </span>
      ))}
      {/* Live-Artikel als feinste Stufe derselben Ortsangabe — Mono/Micro, damit
          er die Krumen nicht überstimmt. Zwei Fassungen desselben Werts (§5: eine
          Quelle, zwei Zuschnitte — nur je eine ist gerendert, die andere ist
          `display:none`):
           · in weiten Zonen ohne das Kürzel, das die Krume daneben schon nennt,
             und `shrink-0` — beim Engerwerden gibt die Krume nach, nicht die
             genauere Angabe;
           · in schmalen Zonen als VOLLES Zitat und truncatend: dort steht keine
             Krume mehr daneben, und wenn der Platz nicht reicht, soll die
             Erlass-Abkürzung am Ende abgeschnitten werden — nie die
             Artikelnummer am Anfang.
          `data-ort-artikel` (Ä1, LESER-V3 H2b) ist der Testanker der Ortsangabe
          (`e2e/leser-v3-ortsangabe.e2e.ts`); er ändert nichts an der Anzeige. */}
      {artikel && (
        <>
          <span data-ort-artikel title={artikel} className="num min-w-0 truncate text-micro font-medium text-ink-700 @md/ort:hidden">{artikel}</span>
          <span data-ort-artikel className="num hidden shrink-0 text-micro font-medium text-ink-700 @md/ort:inline">
            <span aria-hidden className="mr-1 text-ink-300">·</span>{artikelKurz}
          </span>
        </>
      )}
    </Wurzel>
  );
}
