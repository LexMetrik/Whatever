import { createContext, useContext, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import { FehlerBox, KopierButton, NormLink, Stepper } from './ui';
import { PruefBefund } from './PruefBefund';
import { befundZahl, sammleBefunde } from './seiteHelfer';
import { useZielSichtbar } from './useZielSichtbar';
import { PassendeRechner } from './PassendeRechner';
import { NormText } from '../NormText';
import { useLocale, fedlexLokalisiert } from '../locale';
import { usePaneKlasse } from '../layout/PaneKontext';
import { WerkzeugKopf } from '../layout/WerkzeugKopf';
import { dokumentAlsText } from '../../lib/vorlagen/vorlagenText';
import type { AssembleErgebnis } from '../../lib/vorlagen/engine';
import { AUSGABE_LABEL, MUSTER, rolleLabel, type AusgabeStil } from '../../lib/vorlagen/formatvorlagen';
import { VORSCHAU } from './vorschauStil';
import { useAusgabeStil, getAusgabeStil, setAusgabeStil } from './ausgabeStil';
import type { PdfBanner } from '../../lib/vorlagen/banner';

// ─── Generischer Vorlagen-Wizard-Rahmen ─────────────────────────────────────
//
// Der in allen Vorlagen identische Rahmen (CLAUDE.md §10): Kopf mit
// Rückweg/Normen/Badge, Stepper, zweispaltiges Layout (Formular-Karte mit
// Fehlerbox und Zurück/Weiter, Vorschau mobil einklappbar / Desktop klebend),
// dazu VorschauPanel («Papier» + Bausteinprotokoll) und ExportLeiste
// (PDF lazy, DOCX lazy, Text kopieren). Eine neue Vorlage liefert nur noch
// Schema, Schritte und Schritt-Inhalte – KEINE Fachlogik hier (§3).

// D5 (W2·24): Zahl der offenen Pflichtangaben. Der Befund entsteht im RAHMEN
// (nur er kennt alle Schritte), gebraucht wird er in der ExportLeiste, die jede
// Seite selbst rendert — der Kontext hält die Kopplung an EINER Stelle.
// Default 0 = «nichts bekannt» (ExportLeisten ausserhalb eines Wizards).
const OffeneAngabenContext = createContext(0);

/** V5 (W2·29-WERKBANK-VORLAGEN): EINE Nachfrage-Regel für alle
 *  Musterdaten-Knöpfe (Wizard-Seiten, AG-Wizard, Mappen). Hat die Person
 *  schon etwas eingegeben, wird vor dem Ersetzen gefragt; sonst wird sofort
 *  gefüllt. Reine Zustands-Hygiene, keine Fachlogik (§3). */
export function musterdatenAnwenden(eigeneEingaben: boolean, anwenden: () => void): void {
  if (eigeneEingaben && !window.confirm('Eigene Eingaben durch Musterdaten ersetzen?')) return;
  anwenden();
}

export function VorlagenWizardRahmen({
  // N0a: der Rückweg zeigt auf die Übersicht, die sein Label nennt.
  zurueckHref = '/vorlagen', overline, titel, intro, norms, badge,
  fussnote, zuruecksetzen, schritte, schritt, setSchritt, fehler, fehlerJeSchritt,
  weiterDeaktiviert, inhalt, vorschau, kopfSchalter, musterdaten,
}: {
  zurueckHref?: string;
  overline: string;
  titel: string;
  intro: ReactNode;
  norms: { label: string; url: string }[];
  badge: string;
  /** Eigener Speicher-Hinweis (z. B. «wird nicht gespeichert»); ersetzt den Standard-Hinweis. */
  fussnote?: ReactNode;
  /** Wenn gesetzt: sichtbarer «Eingaben zurücksetzen»-Button (mit Rückfrage) + Speicher-Hinweis. */
  zuruecksetzen?: () => void;
  schritte: readonly { id: string; label: string }[];
  schritt: number;
  setSchritt: Dispatch<SetStateAction<number>>;
  fehler?: string[];
  /** D5 (W2·24): dieselbe Auskunft wie `fehler`, aber für JEDEN Schritt —
   *  der letzte Schritt prüft damit, was die Eingabe-Schritte offen liessen.
   *  Keine neue Fachlogik (§3); welche Flächen sie führen müssen, hält der
   *  Wächter `wizard-pruefschritt-d5` fest. */
  fehlerJeSchritt?: (schritt: number) => string[];
  /** Default: fehler vorhanden. Überschreibbar (z. B. Stopp-Karten). */
  weiterDeaktiviert?: boolean;
  inhalt: ReactNode;
  vorschau: ReactNode;
  /** Optionaler Kopf-Schalter (Detailgrad/Untertyp, FAHRPLAN-VERTRAGS-VARIANTEN
   *  P0) – wird zwischen Kopf und Stepper gerendert. Reine Darstellung (§3). */
  kopfSchalter?: ReactNode;
  /** V5 (W2·29-WERKBANK-VORLAGEN): «Mit Musterdaten füllen» neben
   *  «Eingaben zurücksetzen». Die Seite liefert den Füller samt Nachfrage
   *  (`musterdatenAnwenden`); der Rahmen rendert nur den Knopf (§3). */
  musterdaten?: () => void;
}) {
  const { locale } = useLocale();
  const weiterAus = weiterDeaktiviert ?? (fehler != null && fehler.length > 0);
  // Grundsatz David (14.6.2026): kein Eingabefehler vor der ersten Eingabe —
  // die Fehlerbox erscheint erst «berührt»; «Weiter» bleibt trotzdem gesperrt.
  const [beruehrt, setBeruehrt] = useState(false);
  const merkeEingabe = () => { if (!beruehrt) setBeruehrt(true); };

  // D5: der «Prüfen»-Schritt prüft — nur im LETZTEN Schritt, OHNE
  // `beruehrt`-Vorbehalt (wer ihn aufruft, hat um die Prüfung gebeten; der
  // Grundsatz schützt den leeren Anfangszustand, nicht eine angeforderte
  // Prüfung). Kein useMemo: `fehlerJeSchritt` ist je Render eine neue Closure.
  const letzterSchrittIdx = schritte.length - 1;
  const imPruefSchritt = !!fehlerJeSchritt && schritt === letzterSchrittIdx;
  const befunde = imPruefSchritt ? sammleBefunde(schritte, fehlerJeSchritt!) : [];
  const offeneAngaben = befundZahl(befunde);
  // Sprung in den Schritt mit der Lücke: `beruehrt` setzen (sonst schweigt
  // dort die FehlerBox), Fokus auf die Schritt-Überschrift (der
  // `key={schritt}`-Remount lässt die Ref-Callback beim Ankommen feuern).
  const springFokus = useRef(false);
  const springeZuSchritt = (i: number) => { setBeruehrt(true); springFokus.current = true; setSchritt(i); };
  const titelRef = (el: HTMLHeadingElement | null) => {
    if (el && springFokus.current) { springFokus.current = false; el.focus(); }
  };
  // Split-View E: Formular‖Vorschau-Split nach PANE-Breite (md→@3xl/pane).
  const pk = usePaneKlasse();

  // Mobile Live-Vorschau (Redesign E6): steuerbar und automatisch offen im
  // Prüfen-Schritt (Render-Phasen-Abgleich statt Effect).
  const [vorschauOffen, setVorschauOffen] = useState(false);
  const [letzterSchritt, setLetzterSchritt] = useState(schritt);
  if (schritt !== letzterSchritt) {
    setLetzterSchritt(schritt);
    if (schritt === schritte.length - 1 && !vorschauOffen) setVorschauOffen(true);
  }
  // LM-084: der schwebende «Vorschau ↓»-Knopf blendet sich aus, sobald sein
  // Ziel im Bild ist — derselbe Haken wie an `ErgebnisSprung` (§5/§10).
  const vorschauImBild = useZielSichtbar('wizard-vorschau');
  const zurVorschau = () => {
    setVorschauOffen(true);
    const rm = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('wizard-vorschau')?.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    // D5: `inhalt`/`vorschau` werden HIER gerendert — der Kontext folgt dem
    // Render-Baum, die ExportLeiste der Seite liest die Zahl ohne Props.
    <OffeneAngabenContext.Provider value={offeneAngaben}>
    {/* pb-20 mobil (Auftrag David 25.6.2026): der schwebende «Vorschau ↓»-FAB
        (fixed bottom-4 right-4) deckte sonst die letzten Felder / den Weiter-
        Knopf zu — die Boden-Polsterung lässt sie frei darüber scrollen. */}
    {/* `space-y-4`: Kopf, Schalter, Reiterzeile und Arbeitsfläche rücken wie
        im Board zusammen (V1) — das Band kostet sonst die Luft über dem
        Dokument (qsui-hierarchie I8). */}
    <div className={`space-y-4 pb-20 ${pk('md:pb-0', '@3xl/pane:pb-0')}`}>
      {/* Kopf: Titelblatt-Band (`layout/WerkzeugKopf`). Die Formvorschrift
          steht als Etikett im Band — Tor-Griff `data-formgate`, warn-gefüllt
          und im ersten Viewport (§8, qsui-hierarchie I10). */}
      <WerkzeugKopf overline={overline} titel={titel}
        // Lange Komposita («Geheimhaltungsvereinbarung») sprengten bei 360 px
        // den Titel (12 px Seiten-Overflow, Befund David 25.6.2026): brechen.
        titelKlasse="[overflow-wrap:anywhere] hyphens-auto"
        etikett={<span data-formgate className="lc-badge lc-badge-warn">{badge}</span>}
        vorspann={(
          <Link to={zurueckHref} className="inline-flex items-center gap-2 no-underline text-body-s font-medium text-brass-700 hover:text-brass-600">
            <span aria-hidden className="inline-flex items-center justify-center w-7 h-7 border border-line bg-surface">←</span>
            Zurück zum Katalog
          </Link>
        )}
        intro={intro}
        normen={norms.map((n) => ({ artikel: n.label, href: fedlexLokalisiert(n.url, locale) }))}>
        {/* V6 (W2·10-UI-NAV): Weg zum passenden Rechner — rendert nur, wenn die
            Registry für DIESE Vorlage eine Rechner-Kante führt. */}
        <PassendeRechner />
        {(zuruecksetzen || fussnote || musterdaten) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
            {musterdaten && (
              <button type="button" onClick={musterdaten} className="lc-btn-outline lc-btn-sm">
                Mit Musterdaten füllen
              </button>
            )}
            {zuruecksetzen && (
              <button type="button"
                onClick={() => { if (window.confirm('Alle Eingaben dieser Vorlage zurücksetzen?')) { zuruecksetzen(); setBeruehrt(false); } }}
                className="lc-btn-outline lc-btn-sm">
                ↺ Eingaben zurücksetzen
              </button>
            )}
            {/* Feinschrift-Spalte `max-w-kleintext` statt `max-w-reading`:
                @1440 lief der Hinweis sonst mit 110 ch/Zeile über die
                WCAG-Decke SC 1.4.8 (LM-125). */}
            <p className="text-xs text-ink-500 max-w-kleintext">
              {fussnote ?? 'Ihre Eingaben verlassen den Browser nicht, werden aber lokal auf diesem Gerät zwischengespeichert und bleiben nach dem Schliessen erhalten — auf geteilten oder fremden Rechnern bitte «Eingaben zurücksetzen».'}
            </p>
          </div>
        )}
      </WerkzeugKopf>

      {/* Kopf-Schalter (Detailgrad/Untertyp) – optional, vor dem Stepper */}
      {kopfSchalter}

      {/* Stepper */}
      <Stepper schritte={schritte} aktiv={schritt} onWechsel={setSchritt} />

      {/* Zweispaltig: Formular links, klebende Vorschau rechts; mobil
          einspaltig mit einklappbarer Vorschau. `items-start`: die Karte
          schlägt oben an — die Zeilenhöhe bemisst die Formular-Spalte, nicht
          das Dokument (R5-F2/V1, Messung `abnahme/design-identitaet/R5-F2.md`). */}
      <div data-wizard-grid className={`grid grid-cols-1 items-start ${pk('md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]', '@3xl/pane:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]')} gap-6 ${pk('md:gap-8', '@3xl/pane:gap-8')}`}>
        <div className="flex min-w-0 flex-col">
        {/* Formularstrecke: Linien statt Kasten (R5-F2/V3) — 2 px `--rule`
            oben, 1 px `--rule-soft` unten. `data-formular-karte` = Messgriff. */}
        <div data-formular-karte className="border-t-2 border-b border-t-rule border-b-rule-soft pt-5 pb-6 space-y-5"
          onInput={merkeEingabe} onChange={merkeEingabe}>
          {/* key={schritt}: re-mountet den Schrittinhalt → dezenter Einblende-
              Fade beim Schrittwechsel (Redesign E8); Fehlerbox/Buttons bleiben ruhig. */}
          <div key={schritt} className="lc-route space-y-5">
            {/* tabIndex=-1: KEINE Tab-Station (die Überschrift bleibt aus der
                Reihenfolge), nur programmatisch fokussierbar — das Ziel des
                Sprungs aus dem Prüf-Befund (D5). */}
            <h2 ref={titelRef} tabIndex={-1} className="text-h3 font-serif font-semibold text-ink-900">{schritte[schritt].label}</h2>
            {/* D5: Der Befund steht VOR dem Schritt-Inhalt — er ist die
                Antwort auf «Prüfen», nicht eine Fussnote darunter. */}
            {imPruefSchritt && <PruefBefund befunde={befunde} onSpringe={springeZuSchritt} />}
            {inhalt}
          </div>

          {/* FAHRPLAN-DESIGN 2.2: vierte Fehlerbox-Variante entfernt —
              EIN Baustein (FehlerBox, role="alert") wie in den Rechner-Forms.
              Grundsatz David: erst nach erster Eingabe zeigen (beruehrt). */}
          {beruehrt && fehler != null && <FehlerBox fehler={fehler} />}

          <div className="flex items-end justify-between gap-3 pt-2 border-t border-line">
            {/* LM-094: Outline neben Primär — die beiden Navigationsknöpfe
                lesen sich als Paar, die Rangfolge bleibt. */}
            <button type="button" onClick={() => setSchritt((s) => Math.max(0, s - 1))}
              disabled={schritt === 0} className="lc-btn-outline">← Zurück</button>
            {schritt < schritte.length - 1 && (
              <div className="flex flex-col items-end gap-1">
                {/* Erklärt den ausgegrauten Weiter-Button (sonst wirkt er wie
                    ein Defekt) — immer sichtbar, nicht fehler-rot. */}
                {weiterAus && (
                  <p id="weiter-hinweis" className="text-xs text-ink-500">Bitte Pflichtfelder ausfüllen</p>
                )}
                <button type="button" onClick={() => setSchritt((s) => s + 1)}
                  disabled={weiterAus} aria-describedby={weiterAus ? 'weiter-hinweis' : undefined}
                  className="lc-btn-primary">
                  Weiter →
                </button>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Vorschau – mobil einklappbar, Desktop klebend; identischer Inhalt
            zweimal platziert (kein Remount, wie bisheriger Funktionsaufruf) */}
        <details id="wizard-vorschau" className={`${pk('md:hidden', '@3xl/pane:hidden')} bg-surface border border-line scroll-mt-24`}
          open={vorschauOffen} onToggle={(e) => setVorschauOffen((e.currentTarget as HTMLDetailsElement).open)}>
          {/* `data-dokument-platz`: auf schmalen Schirmen ist dieser Griff die
              STELLE des Dokuments (qsui-hierarchie I8: nie nichts). Die
              Klappmarke kommt allein aus der geteilten `summary::after`-Regel
              (LM-060: keine zweite Marke). */}
          <summary data-dokument-platz className="cursor-pointer select-none px-4 py-3 text-body-s font-medium text-ink-700">
            <span>Vorschau & Bausteinprotokoll</span>
          </summary>
          <div className="px-4 pb-4">{vorschau}</div>
        </details>
        {/* R5-F2/V1: die Vorschau-Zelle trägt ihren Inhalt ABSOLUT (zählt bei
            der Zeilenhöhe nicht mit; `min-h` gegen das Guckloch bei kurzen
            Schritten). Der innere Kasten klebt (`sticky`) und deckelt sich
            auf Bildschirm- ODER Zellenhöhe, mit eigenem Scroller —
            `tabIndex`/`aria-label`, weil ein Scroller erreichbar und benannt
            sein muss (axe `scrollable-region-focusable`). `print:` hebt die
            Mechanik auf, sonst druckte nur der Ausschnitt. Kein
            `lc-scrollrand-y`: das Blatt deckte dessen Verlauf zu. */}
        <div className={pk(
          'hidden md:block md:relative md:self-stretch md:min-h-[26rem]',
          'hidden @3xl/pane:block @3xl/pane:relative @3xl/pane:self-stretch @3xl/pane:min-h-[26rem]')}>
          <div className={pk('md:absolute md:inset-0 print:static', '@3xl/pane:absolute @3xl/pane:inset-0 print:static')}>
            <div tabIndex={0} aria-label="Dokument-Vorschau"
              className={pk(
                'md:sticky md:top-28 md:max-h-[min(calc(100dvh-8rem),100%)] md:overflow-y-auto md:overscroll-contain print:static print:max-h-none print:overflow-visible',
                '@3xl/pane:sticky @3xl/pane:top-28 @3xl/pane:max-h-[min(calc(100dvh-8rem),100%)] @3xl/pane:overflow-y-auto @3xl/pane:overscroll-contain print:static print:max-h-none print:overflow-visible')}>
              {vorschau}
            </div>
          </div>
        </div>
      </div>

      {/* Mobil: schwebender Sprung zur Live-Vorschau — gefülltes Pill, damit
          er nicht wie eine gewählte Kachel liest (Responsive-Audit D1).
          `data-verdikt-sprung`: derselbe Tor-Griff wie `ErgebnisSprung`.
          `print:hidden`: `fixed` läge im Ausdruck auf jeder Seite. */}
      {!vorschauImBild && (
        <button type="button" onClick={zurVorschau} data-verdikt-sprung
          className={`${pk('md:hidden', '@3xl/pane:hidden')} print:hidden fixed bottom-4 right-4 z-dropdown lc-btn-primary lc-btn-sm px-4 shadow-lg`}>
          Vorschau ↓
        </button>
      )}
    </div>
    </OffeneAngabenContext.Provider>
  );
}

// ── Werkgetreuer Absatz-Renderer der Vorschau ───────────────────────────────
// Interpretiert EXAKT dieselben Strukturen wie PDF und DOCX (MUSTER aus der
// Formatvorlagen-SSoT): hängende Einzüge für «1.»-Klauseln, doppelt
// eingezogene «–»-Unterpunkte, gezeichnete Unterschriftslinien, Betreff mit
// Haarlinie, Rubrum mit zentrierten Parteirollen und fettem «gegen».
// Reine Darstellung – keine Rechtslogik (§3).

function VorschauZeile({ zeile, dicht, striche }: { zeile: string; dicht?: boolean; striche?: boolean }) {
  // Strichzeilen-Lizenz wie PDF/DOCX (Ultra-Review MITTEL 7.6.2026):
  // nur rolle 'unterschrift' oder Schema-eigene Striche — nie Nutzertext.
  if (striche && MUSTER.STRICHE.test(zeile)) {
    // role="img": aria-label ist auf einem rollenlosen span unzulässig
    // (axe aria-prohibited-attr, 10.6.2026); als benanntes Grafik-Element
    // bleibt die Linie für Screenreader «Unterschriftslinie».
    return <span role="img" style={VORSCHAU.sigLinie} aria-label="Unterschriftslinie" />;
  }
  const num = zeile.match(MUSTER.NUMMER);
  if (num) {
    // Nummerierte Klausel/Begehren: scanbarer hängender Einzug (SSoT vorschauStil).
    return (
      <span style={VORSCHAU.pos}>
        <span style={VORSCHAU.posNr}>{num[1]}.</span>
        <span>{zeile.slice(num[0].length)}</span>
      </span>
    );
  }
  if (MUSTER.SUB.test(zeile)) {
    return (
      <span style={VORSCHAU.sub}>
        <span style={VORSCHAU.subDash}>–</span>
        <span>{zeile.slice(2)}</span>
      </span>
    );
  }
  return <span className={`block min-h-[1em] ${dicht ? 'leading-snug' : ''}`}>{zeile || '\u00a0'}</span>;
}

function VorschauAbsatz({ abs, stil }: { abs: AssembleErgebnis['dokument']['absaetze'][number]; stil: AusgabeStil }) {
  const zeilen = abs.text.split('\n');
  const striche = !!abs.stricheErlaubt; // Engine-Boolean (/simplify 7.6.2026)

  // Alle Masse/Stile aus der SSoT (vorschauStil.ts) – keine hartkodierten
  // Tailwind-Abstände mehr; Variante A «Dokument-Handwerk».
  switch (abs.rolle) {
    case 'absender':
    case 'adressat':
      return (
        <div style={abs.rolle === 'adressat' ? VORSCHAU.adressat : VORSCHAU.absender}>
          {zeilen.map((z, i) => <VorschauZeile key={i} zeile={z} dicht striche={striche} />)}
        </div>
      );
    case 'datumzeile':
      return <p style={VORSCHAU.datum}>{abs.text}</p>;
    case 'betreff':
      return (
        <div>
          <p style={{ ...VORSCHAU.betreff, lineHeight: 1.3, whiteSpace: 'pre-line' }}>{abs.text}</p>
          <span style={VORSCHAU.betreffLinie} aria-hidden />
        </div>
      );
    case 'rubrum':
      return (
        <div style={VORSCHAU.rubrum}>
          {zeilen.map((z, i) => {
            const t = z.trim();
            if (MUSTER.RUBRUM_ROLLE.test(t)) return stil === 'modern'
              ? <p key={i} style={VORSCHAU.rubrumRolle}>{rolleLabel(t)}</p>
              : <p key={i} style={VORSCHAU.rubrumRolleKlassisch}>{t}</p>;
            if (t === 'gegen') return <p key={i} style={stil === 'modern' ? VORSCHAU.rubrumGegen : VORSCHAU.rubrumGegenKlassisch}>gegen</p>;
            if (z === 'in Sachen') return <p key={i} style={VORSCHAU.insachen}>{z}</p>;
            if (z.startsWith('betreffend ')) return <p key={i} style={VORSCHAU.betreffend}>{z}</p>;
            return <p key={i} style={VORSCHAU.rubrumZeile}><VorschauZeile zeile={z} dicht={t !== ''} striche={striche} /></p>;
          })}
        </div>
      );
    case 'parteien':
      return (
        <div style={VORSCHAU.parteien}>
          {zeilen.map((z, i) => <VorschauZeile key={i} zeile={z} striche={striche} />)}
        </div>
      );
    case 'anrede':
      return <div style={VORSCHAU.anrede}>{zeilen.map((z, i) => <VorschauZeile key={i} zeile={z} striche={striche} />)}</div>;
    case 'schlussformel':
      return <p style={VORSCHAU.schlussformel}>{abs.text}</p>;
    case 'unterschrift':
      return (
        <div style={VORSCHAU.unterschrift}>
          {zeilen.map((z, i) => <VorschauZeile key={i} zeile={z} striche={striche} />)}
        </div>
      );
    default:
      return (
        <div style={VORSCHAU.block}>
          {abs.ueberschrift && <p style={VORSCHAU.blockTitel}>{abs.ueberschrift}</p>}
          {zeilen.map((z, i) => <VorschauZeile key={i} zeile={z} striche={striche} />)}
        </div>
      );
  }
}

// ── Geteilte Export-Aktion (PDF/DOCX lazy, Fehler sichtbar statt stiller
//    Unhandled Rejection) — genutzt von ExportLeiste und DirektExportZeile ───

function useExportAktion() {
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  // Während des Nachladens/Erzeugens (lazy jsPDF/docx + Dokumentbau) hält
  // `laeuft` die Knöpfe disabled und verhindert Mehrfachklicks/-downloads
  // (§13/F4) — analog PdfExportButton.
  const exportieren = async (aktion: () => Promise<void>, standardMeldung: string) => {
    if (laeuft) return;
    setFehler(null);
    setLaeuft(true);
    try {
      await aktion();
    } catch (e) {
      setFehler(e instanceof Error ? e.message : standardMeldung);
    } finally {
      setLaeuft(false);
    }
  };
  return { fehler, laeuft, exportieren };
}

// Der Ausgabe-Stil wird beim Klick aus dem geteilten Store gelesen (getAusgabeStil),
// damit Vorschau und beide Export-Knöpfe ohne Props-Plumbing denselben Stil nutzen.
const pdfExport = (ergebnis: AssembleErgebnis, ziel: ExportZiel) => async () =>
  (await import('../../lib/vorlagen/vorlagenPdf')).vorlagenPdfErzeugen(ergebnis, { banner: ziel.banner, dateiName: ziel.dateiName, stil: getAusgabeStil() });
const docxExport = (ergebnis: AssembleErgebnis, ziel: ExportZiel) => async () =>
  (await import('../../lib/vorlagen/vorlagenDocx')).vorlagenDocxErzeugen(ergebnis, { banner: ziel.banner, dateiName: ziel.dateiName, stil: getAusgabeStil() });

// ── Direkt-Export unter der Vorschau (Daueranweisung David 12.6.2026) ───────
//
// Jede Vorlage ist JEDERZEIT herunterladbar — auch unausgefüllt; leere
// Felder bleiben Ausfüll-Striche («________», Engine-Konvention). Nur
// FACHLICHE Blocker (das Dokument trüge eine falsche Rechtsaussage)
// sperren auch hier; fehlende Angaben sperren nie.

function DirektExportZeile({ ergebnis, pdf, docx, blocker }: {
  ergebnis: AssembleErgebnis; pdf: ExportZiel; docx?: ExportZiel; blocker?: string[];
}) {
  const { fehler, laeuft, exportieren } = useExportAktion();
  const gesperrt = (blocker?.length ?? 0) > 0;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-xs text-ink-500">
          Direkt herunterladen – auch unausgefüllt (leere Felder bleiben Ausfüll-Striche):
        </span>
        <button type="button" disabled={gesperrt || laeuft} aria-busy={laeuft}
          title={gesperrt ? blocker![0] : undefined}
          onClick={() => exportieren(pdfExport(ergebnis, pdf), 'Der PDF-Export ist fehlgeschlagen. Bitte erneut versuchen.')}
          className="lc-btn-outline lc-btn-sm">
          PDF
        </button>
        {docx && (
          <button type="button" disabled={gesperrt || laeuft} aria-busy={laeuft}
            title={gesperrt ? blocker![0] : undefined}
            onClick={() => exportieren(docxExport(ergebnis, docx), 'Der Word-Export ist fehlgeschlagen. Bitte erneut versuchen.')}
            className="lc-btn-outline lc-btn-sm">
            Word (DOCX)
          </button>
        )}
      </div>
      {fehler && <FehlerBox fehler={[fehler]} />}
    </div>
  );
}

// ── Ausgabe-Stil-Umschalter (nüchtern ⇄ modern) ─────────────────────────────
// Wirkt zugleich auf Vorschau UND Export (geteilter Store, ausgabeStil.ts).
function StilUmschalter({ stil }: { stil: AusgabeStil }) {
  return (
    // Zwei Textknöpfe, die Wahl trägt der Unterstrich (R5-F2, §5).
    <div className="inline-flex shrink-0 items-center gap-3 text-xs" role="group" aria-label="Ausgabe-Stil">
      {(['nuechtern', 'modern'] as const).map((s) => (
        <button key={s} type="button"
          aria-pressed={stil === s}
          title={s === 'nuechtern' ? 'Klassisch-gerichtstauglich (traditionelles Rubrum mit Gedankenstrichen)' : 'Variante A «Dokument-Handwerk» (ruhige Versal-Labels)'}
          onClick={() => setAusgabeStil(s)}
          className={stil === s
            ? 'py-1 font-medium text-ink-900 underline decoration-2 underline-offset-4'
            : 'py-1 text-ink-600 underline decoration-transparent underline-offset-4 hover:text-ink-900 hover:decoration-line-strong'}>
          {s === 'nuechtern' ? 'Nüchtern' : 'Modern'}
        </button>
      ))}
    </div>
  );
}

// ── Vorschau-Spalte: Live-«Papier» + Bausteinprotokoll ──────────────────────

export function VorschauPanel({ ergebnis, kompakt, extra, nichtAufgenommen, direktExport, stil: stilOverride }: {
  ergebnis: AssembleErgebnis;
  /** Etwas kleinere Papier-Schrift (Schlichtungsgesuch). */
  kompakt?: boolean;
  /** Erzwingt einen Ausgabe-Stil (Tests/Snapshots); sonst aus dem geteilten Store. */
  stil?: AusgabeStil;
  /** Vorlagenspezifische Panels zwischen Papier und Protokoll (z. B. Pflichtteile). */
  extra?: ReactNode;
  /** Wenn übergeben: Protokoll-Zusammenfassung «aufgenommen · nicht aufgenommen» + Liste. */
  nichtAufgenommen?: { label: string; grund: string }[];
  /** Blanko-/Direkt-Download (Daueranweisung David 12.6.2026) — nur
      FACHLICHE Blocker übergeben, nie blosse Vollständigkeits-Mängel. */
  direktExport?: { pdf: ExportZiel; docx?: ExportZiel; blocker?: string[] };
}) {
  const stilStore = useAusgabeStil();
  const stil = stilOverride ?? stilStore;
  return (
    <div className="space-y-4">
      {/* Live-Vorschau als «Papier» — dieselben Formatvorlagen wie PDF und
          DOCX; das Blatt bleibt Blatt (Fläche + Kante), auch im Werkbank-Kleid.
          `data-dokument`: Tor-Griff (qsui-hierarchie I8/I9) — das Verdikt einer
          Vorlagen-Fläche ist das fertige Dokument. */}
      <section data-dokument aria-label="Vorschau" className="bg-paper-raised border border-line p-5 sm:p-9">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="lc-overline">
            Vorschau · aktualisiert sich live
            {AUSGABE_LABEL[ergebnis.dokument.ausgabeArt] && (
              <span className="ml-2 lc-chip normal-case tracking-normal">{AUSGABE_LABEL[ergebnis.dokument.ausgabeArt]}</span>
            )}
          </p>
          <StilUmschalter stil={stil} />
        </div>
        <div className="font-sans text-ink-900" style={{ ...VORSCHAU.papier, ...(kompakt ? { fontSize: 'var(--vorschau-fs-kompakt)', lineHeight: 1.55 } : { fontSize: 'var(--vorschau-fs)', lineHeight: 1.6 }) }}>
          {/* Eingaben tragen ihren Titel im fetten Betreff – kein Dokumenttitel;
              Verfügung/Vertrag: zentrierter Titel MIT Haarlinie (wie PDF/DOCX) */}
          {ergebnis.dokument.format !== 'eingabe' && (
            <div>
              <p style={VORSCHAU.titel}>{ergebnis.dokument.titel}</p>
              <span style={VORSCHAU.titelLinie} aria-hidden />
            </div>
          )}
          {ergebnis.dokument.absaetze.map((abs) => (
            <VorschauAbsatz key={abs.bausteinId + abs.text.slice(0, 12)} abs={abs} stil={stil} />
          ))}
        </div>
        <p className="text-micro text-ink-500 mt-6 pt-3 border-t border-line">{ergebnis.dokument.disclaimer}</p>
      </section>

      {direktExport && <DirektExportZeile ergebnis={ergebnis} {...direktExport} />}

      {extra}

      {/* Bausteinprotokoll */}
      <details className="lc-card p-4">
        <summary className="cursor-pointer text-body-s font-medium text-ink-700">
          Bausteinprotokoll ({nichtAufgenommen
            ? `${ergebnis.protokoll.length} aufgenommen · ${nichtAufgenommen.length} nicht aufgenommen`
            : `${ergebnis.protokoll.length} Bausteine`})
        </summary>
        <ul className="mt-3 space-y-2.5">
          {ergebnis.protokoll.map((p) => (
            <li key={p.bausteinId} className="text-body-s text-ink-600 space-y-1">
              <p><span className="num text-ink-500">{p.bausteinId}</span> – <NormText text={p.begruendung} /></p>
              {p.hinweis && <p className="text-xs text-warn-700">⚠ <NormText text={p.hinweis} /></p>}
              {p.norm && <p><NormLink artikel={p.norm} /></p>}
            </li>
          ))}
        </ul>
        {nichtAufgenommen && (
          <>
            <p className="lc-overline mt-4 mb-2">Nicht aufgenommen</p>
            <ul className="space-y-1">
              {nichtAufgenommen.map((n) => (
                <li key={n.label} className="text-xs text-ink-500">– {n.label}: {n.grund}</li>
              ))}
            </ul>
          </>
        )}
      </details>
    </div>
  );
}

// ── Export-Leiste: PDF (lazy) · optional DOCX (lazy) · Text kopieren ────────

export type ExportZiel = { label: string; banner: PdfBanner; dateiName: string };

export function ExportLeiste({ ergebnis, deaktiviert, kopiert, onKopieren, pdf, docx }: {
  ergebnis: AssembleErgebnis;
  deaktiviert: boolean;
  kopiert: boolean;
  onKopieren: (text: string) => void;
  pdf: ExportZiel;
  /** Nur übergeben, wo die Formvorschrift DOCX zulässt (Form-Gate hat Vorrang). */
  docx?: ExportZiel;
}) {
  // Async-Export mit try/catch (useExportAktion): scheitert das Nachladen der
  // Renderer oder die Dokument-Erzeugung – etwa der bewusste Sperr-Wurf des
  // Word-Exports bei eigenhändigkeitspflichtigen Geschäften (vorlagenDocx.ts)
  // –, erscheint die Meldung sichtbar statt als stille Unhandled Rejection.
  const { fehler, laeuft, exportieren } = useExportAktion();
  // Der Kopier-Text hing zuvor am Klick; als Prop liefe die Serialisierung des
  // ganzen Dokuments sonst bei jedem Render mit (§15) — darum memoisiert.
  const kopierText = useMemo(() => dokumentAlsText(ergebnis), [ergebnis]);

  // D5: EINMAL nachfragen, nie sperren (Daueranweisung David 12.6.2026: jede
  // Vorlage ist jederzeit herunterladbar). Fehlen Pflichtangaben, fängt der
  // erste Klick die Aktion für eine Rückfrage ab; gesperrt bleibt nur
  // `deaktiviert` (fachliche Blocker / Bestätigung).
  const offen = useContext(OffeneAngabenContext);
  const [rueckfrage, setRueckfrage] = useState<null | (() => void)>(null);
  const [gefragt, setGefragt] = useState(false);
  const mitRueckfrage = (los: () => void) => {
    if (offen > 0 && !gefragt) { setRueckfrage(() => los); return; }
    los();
  };
  const pdfLos = () => exportieren(pdfExport(ergebnis, pdf), 'Der PDF-Export ist fehlgeschlagen. Bitte erneut versuchen.');
  const docxLos = () => docx && exportieren(docxExport(ergebnis, docx), 'Der Word-Export ist fehlgeschlagen. Bitte erneut versuchen.');
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={deaktiviert || laeuft} aria-busy={laeuft}
          onClick={() => mitRueckfrage(pdfLos)}
          className="lc-btn-primary">
          {pdf.label}
        </button>
        {docx && (
          <button type="button" disabled={deaktiviert || laeuft} aria-busy={laeuft}
            onClick={() => mitRueckfrage(docxLos)}
            className="lc-btn-outline">
            {docx.label}
          </button>
        )}
        {/* R2-E: der geteilte KopierButton, gesteuert (`useVorlage` hält
            `kopiert`); ohne `lc-btn-sm`, er hält die Höhe der Export-Knöpfe. */}
        <KopierButton text={kopierText} gegenstand="Text"
          className="lc-btn-outline" disabled={deaktiviert}
          kopiert={kopiert} onKopieren={onKopieren} />
      </div>
      {rueckfrage && (
        <div role="alert" data-export-rueckfrage className="lc-notice lc-notice-warn space-y-2">
          <p className="text-body-s">
            Es fehlen <span className="num">{offen}</span> {offen === 1 ? 'Pflichtangabe' : 'Pflichtangaben'} — trotzdem exportieren?
            Offene Stellen erscheinen im Dokument als Ausfüll-Striche («________»).
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="lc-btn-primary lc-btn-sm"
              onClick={() => { const los = rueckfrage; setRueckfrage(null); setGefragt(true); los(); }}>
              Trotzdem exportieren
            </button>
            <button type="button" className="lc-btn-outline lc-btn-sm" onClick={() => setRueckfrage(null)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
      {fehler && <FehlerBox fehler={[fehler]} />}
    </div>
  );
}
