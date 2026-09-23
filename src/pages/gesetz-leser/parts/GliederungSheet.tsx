import type { ReactNode, RefObject } from 'react';
import { SheetRahmen } from '../../../components/ui/SheetRahmen';

// ─── W2·10-UI-NAV/R2 · Mobile Gliederung als volles Bottom-Sheet ───────────────
//
// Fahrplan R2: «Sheet in voller Höhe (Daumenzone) · beim Öffnen Hierarchie zur
// aktuellen Leseposition aufgeklappt + markiert · Quickjump-Feld zuoberst».
// Von unten, bis knapp unter den Kopf, Bediengriffe ZUOBERST, Baum darunter.
//
// Aufbau (von oben nach unten):
//   1. Griffleiste + Titel + ✕ (`ui/SheetRahmen`)
//   2. Such-/Sprungfeld — DASSELBE Feld wie im Kopf-Block (A2/Ä18: das Feld ist
//      auf allen drei Breiten das oberste Element; der Dialog fängt den Fokus,
//      das Feld im Kopf wäre unerreichbar, WCAG 2.4.3)
//   3. «Sie sind hier» — Gliederungspfad + gelesener Artikel aus dem Scroll-Spy.
//      Reine Projektion bestehenden Zustands (§3/§5); ohne Pfad kein
//      «unbekannt»-Platzhalter, sondern die ehrliche Leerzeile (§8).
//   4. Gliederungsbaum (einziger Scroller, `overscroll-contain`)
//
// W2·29 S3 (23.9.2026): die Schalter `titel`/`ortAnzeigen`/`feldZuoberst`
// trugen die Anordnung der Ist-Hülle (FL-4); deren einziger Aufrufer ist seit
// H5 (21.8.2026) die V3-Leiste, die immer dieselben Werte setzte — sie sind
// darum die Anordnung selbst geworden. Trennlinien: 1 px `rule-soft` (F0.6).
//
// §15/2 CLS 0: das Sheet ist `fixed`/`absolute` und aus dem Fluss genommen; die
// Zonen haben feste bzw. flex-verteilte Höhen. §3: keine Rechtslogik.

export function GliederungSheet({
  sheetRef, inPane, onSchliessen, pfad, aktArtikelLabel, sprungFeld, baum,
}: {
  /** Fokus-/Dialog-Ref des Readers (useDialogFokus: Esc, Fokusfang, Rückgabe). */
  sheetRef: RefObject<HTMLDivElement | null>;
  /** Im Split-View-Pane: `absolute` in der Overlay-Schicht statt `fixed`. */
  inPane: boolean;
  onSchliessen: () => void;
  /** «Sie sind hier»: Gliederungspfad der aktuellen Leseposition (kann leer sein). */
  pfad: string[];
  /** «Sie sind hier»: Label des aktuell gelesenen Artikels (kann null sein). */
  aktArtikelLabel: string | null;
  /** Feld-Zone ZUOBERST; `undefined` = die Zone entfällt ganz (samt Linie) —
   *  ein leerer, linierter Streifen wäre eine Fläche ohne Inhalt. */
  sprungFeld?: ReactNode;
  baum: ReactNode;
}) {
  return (
    <>
      {/* F2-1: Farbe und Deckung des Scrims aus `.lc-scrim` (index.css) —
          `bg-ink-900/30` hellte im Dunkelmodus auf, weil `--ink-900` flippt. */}
      <div className={inPane ? 'lc-scrim pointer-events-auto absolute inset-0 z-overlay' : 'lc-scrim fixed inset-0 z-overlay'}
        onClick={onSchliessen} aria-hidden />
      {/* Rahmen, Griffleiste, Titelzeile, ✕ und Scroller aus dem EINEN
          Sheet-Baustein (F2-2). Anschlag aus `--leser-kopf-h` (GEMESSEN, nicht
          angenommen — W2·19-GLIEDERUNG/S2); der inPane-Zweig trägt keinen.
          `overflow-x-hidden` (W2·19/S9): kein waagrechtes Scrollen, lange
          Etikette brechen um — dieselbe Garantie wie in der Spalte. */}
      <SheetRahmen sheetRef={sheetRef} inPane={inPane} titel="Gliederung" onSchliessen={onSchliessen}
        anschlag="var(--leser-kopf-h)" daten="data-gliederung-sheet"
        scrollerDaten="data-gliederung-baum-scroll"
        scrollerKlassen="overflow-x-hidden px-3 py-2"
        zwischenZonen={<>
          {sprungFeld && (
            <div data-v3-blatt-feld className="shrink-0 border-b border-rule-soft px-4 py-2">{sprungFeld}</div>
          )}
          <div data-sie-sind-hier className="shrink-0 border-b border-rule-soft px-4 py-2">
            <p className="lc-overline mb-0.5">Sie sind hier</p>
            {pfad.length > 0 || aktArtikelLabel ? (
              <p className="text-micro leading-snug text-ink-600 [overflow-wrap:anywhere]">
                {pfad.map((l, i) => (
                  <span key={`${l}-${i}`}>
                    {i > 0 && <span aria-hidden className="mx-1 text-ink-400">›</span>}
                    {l}
                  </span>
                ))}
                {aktArtikelLabel && (
                  <>
                    {pfad.length > 0 && <span aria-hidden className="mx-1 text-ink-400">›</span>}
                    <span className="font-medium text-ink-900">{aktArtikelLabel}</span>
                  </>
                )}
              </p>
            ) : (
              // `ink-500` statt Deko-`ink-400` (axe color-contrast, PR #537).
              <p className="text-micro leading-snug text-ink-500">Noch keine Leseposition erfasst.</p>
            )}
          </div>
        </>}>
        {baum}
      </SheetRahmen>
    </>
  );
}
