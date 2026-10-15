import { useId } from 'react';
import type { ZuletztEintrag } from '../../lib/zuletztVerwendet';
import type { MerkEintrag } from '../../lib/merkliste';
import { reiterKurzform } from '../../lib/tabs';
import { suchOptionId } from './suchOptionId';
import { RegisterMarke } from './RegisterMarke';
import { MERK_ALLE_HREF, MERK_IM_PANEL } from './SucheLeerzustandKontext';
import { MEHR_TREFFER_ID } from './trefferAuswahl';
import { artVonRoute } from './suchArt';
import { Leerzustand } from '../ui/Leerzustand';
import { VerlaufLeerenKnopf } from '../layout/VerlaufLeerenKnopf';

// ─── Leerzustand der Suche (⌘K / Fokus ohne Eingabe) — UI-NAV O1, Schritt 2 ──
//
// Erscheint, wenn das Suchfeld fokussiert, aber leer ist: die zuletzt geöffneten
// Inhalte (aus DERSELBEN Verlauf-Quelle wie Startseiten-Chips und Topbar-Verlauf,
// §5). Reine Darstellung/Navigation (§3).
//
// Synchron/CLS-frei: das Panel erscheint nur auf Fokus (Nutzer-Interaktion, nie im
// ersten Paint) → keine localStorage-/Hydration-Divergenz im Prerender (§15.2).
// `verlauf` kommt als Prop vom Aufrufer (EIN `useZuletzt()`-Aufruf, geteilt mit
// der Tastatur-Navigation — Cowork-Befund 38, 21.8.2026).
//
// `leerOptionen` (flache Options-Liste für die Tastatur-Navigation) steht in
// `SucheLeerzustandKontext.ts` (react-refresh/only-export-components — Muster
// wie `InhaltsKopfKontext.ts` neben `InhaltsKopf.tsx`).
//
// ── D23 (David 6.9.2026, Bild «Kopf-Suche im Leerzustand nach ‹+›») ──────────
// Wortlaut: «schau mal wie das aussieht mit der suche. sehr unästhetisch».
// Drei Dinge am Panel-INHALT, Punkt für Punkt:
//  · DAS ETIKETT STEHT ÜBER DER LISTE. «Zuletzt geöffnet» stand zwar oben, die
//    §8-Fussnote «Nur auf diesem Gerät» aber im selben Block und optisch als
//    zweites Etikett — im Bild las sich die Liste, als trüge sie GAR KEINE
//    Überschrift und darunter eine. Jetzt: Etikett oben (`.lc-overline`,
//    Archivo 12, ink-500), Liste, Fussnote als kleine Micro-Zeile darunter.
//  · DIE ZEILE TRÄGT DIE KURZFORM, NICHT DEN SEO-TITEL. `labelAusMeta` liefert
//    für die Übersichts-/Startseiten-Routen die Metadaten-Zeichenkette («Schweizer
//    Recht an einem Ort: …»); `lib/tabs.reiterKurzform` ist die kanonische
//    Kurzform derselben Routen (R3-F7, §5) — dieselbe Quelle wie die
//    Arbeitsleiste. Rechts daneben, ruhig in ink-500, die ART (Gesetz ·
//    Entscheid · Materialie · Rechner · Vorlage, `suchArt.ts`). Damit ist die
//    Liste sortierbar zu lesen, statt als Wortsalat («CEDAW/ZGB/BGE/OR/…»).
//  · «EINSTIEGE» IST ERSATZLOS GEFALLEN. Der Block wiederholte Zeile für Zeile
//    die Seitenleiste (Gesetze · Rechtsprechung · Materialien · Rechner ·
//    Vorlagen), die seit D17 auf JEDER Route steht — die Wiederholung war die
//    «Inkonsistenz», die David gerügt hat. Rückbau statt Bewachung
//    (§17-Gegengewicht): mit ihm fällt die Konstante `EINSTIEGE`.
//    NICHTS geht verloren: der Weg in die fünf Bereiche ist die Seitenleiste,
//    und die Suche selbst findet sie über den Namen.
// Der Registerstrich ist auf 3 px vereinheitlicht und wohnt jetzt in
// `RegisterMarke.tsx`, weil die TREFFER-Zeilen ihn seit D23 ebenfalls tragen.

// ── LESER-NAV (David 15.10.2026, «Ja, in ⌘K zeigen») · DIE MERKLISTE ────────
// Steht ÜBER «Zuletzt geöffnet» (Reihenfolge wie im Topbar-Flyout), höchstens
// `MERK_IM_PANEL` Zeilen, danach die Option «Alle N auf der Startseite». Leere
// Merkliste: kein Merkliste-Abschnitt; «Zuletzt geöffnet» ist neu stets eine
// benannte Gruppe (sichtbar unverändert, Screenreader sagt die Gruppe an). Ist der
// Verlauf leer, die Merkliste aber nicht (z. B. nach «Verlauf leeren»), entfällt
// die Zeile «Noch nichts geöffnet.» — die Liste hat dann etwas zu zeigen. Beide
// Abschnitte sind `role=group` MIT Namen in derselben Listbox (Muster
// SuchResultate); die Zeilen sind role=option, per Pfeiltasten + Enter erreichbar
// (`leerOptionen`) — kein zusätzlicher Tab-Stopp (Befund 38).

const ZEILE_CLS = 'lc-hover-flaeche flex items-center gap-3 px-4 py-2 text-body-s text-ink-900 transition-colors cursor-pointer';

export function SucheLeerzustand({ verlauf, merkliste = [], listboxId, aktivId, onNavigate, onVerlaufGeleert, panelKlasse }: {
  /** Verlauf-Einträge (bereits auf 5 gekappt) — EIN geteilter useZuletzt()-Aufruf
   *  beim Aufrufer, damit Anzeige und Tastatur-Navigation (leerOptionen) exakt
   *  dieselbe Liste sehen. */
  verlauf: ZuletztEintrag[];
  /** Die gemerkten Stellen (ganze Liste, neueste zuerst; gezeigt werden `MERK_IM_PANEL`) —
   *  EIN `useMerkliste()`-Aufruf beim Aufrufer, wie `verlauf`, damit Anzeige und
   *  Tastatur-Navigation (`leerOptionen`) dieselbe Liste sehen. */
  merkliste?: readonly MerkEintrag[];
  /** ARIA-Listbox-ID des steuernden Felds (wie SuchResultate) — macht jede Zeile
   *  zu einer role=option statt eines eigenen Tab-Stopps (Befund 38). */
  listboxId: string;
  /** Options-ID des per Pfeiltasten hervorgehobenen Eintrags. */
  aktivId?: string;
  /** Maus/Touch-Navigation (Optionen sind keine `<a>` mehr, s. SuchResultate). */
  onNavigate: (href: string) => void;
  /** Nach «Verlauf leeren» (W2·31 P3): der Aufrufer gibt den Fokus zurück an das
   *  Suchfeld — der Knopf verlässt mit der Liste das DOM, der Fokus fiele sonst
   *  auf <body>. */
  onVerlaufGeleert?: () => void;
  /** Zusatzklassen an der Listbox (Kopf-Dropdown: Scroll-Kappung) — Herleitung
   *  bei `SuchResultate.panelKlasse` (axe `scrollable-region-focusable`). */
  panelKlasse?: string;
}) {
  const merkId = useId();
  const verlaufId = useId();
  const gemerkt = merkliste.slice(0, MERK_IM_PANEL);
  const zeigeVerlauf = verlauf.length > 0 || merkliste.length === 0;
  const merkMehrOid = suchOptionId(listboxId, 'merkliste', MEHR_TREFFER_ID);
  const listenName = merkliste.length === 0 ? 'Suche — zuletzt geöffnet'
    : zeigeVerlauf ? 'Suche — Merkliste und zuletzt geöffnet' : 'Suche — Merkliste';
  return (
    <>
    <div className={`lc-suchpanel${panelKlasse ? ` ${panelKlasse}` : ''}`} role="listbox" id={listboxId} aria-label={listenName}>
      {merkliste.length > 0 && (
        <div role="group" aria-labelledby={merkId}>
          <p id={merkId} className="lc-overline px-4 pt-3 pb-1.5">Merkliste</p>
          <ul role="none" className="pb-1">
            {gemerkt.map((e) => {
              const oid = suchOptionId(listboxId, 'merkliste', e.route);
              const art = artVonRoute(e.route);
              return (
                <li key={oid} role="option" id={oid} aria-selected={oid === aktivId}
                  onClick={() => onNavigate(e.route)}
                  className={`${ZEILE_CLS}${oid === aktivId ? ' hs-aktiv' : ''}`}>
                  <RegisterMarke route={e.route} />
                  <span className="min-w-0 flex-1 truncate" title={e.titel}>{e.titel}</span>
                  {art && <span className="shrink-0 text-xs text-ink-500">{art}</span>}
                </li>
              );
            })}
            {merkliste.length > MERK_IM_PANEL && (
              // Die Startseite führt die ganze Liste (`MerklisteFlaeche`); Wortlaut wie im Flyout.
              <li role="option" id={merkMehrOid} aria-selected={merkMehrOid === aktivId}
                onClick={() => onNavigate(MERK_ALLE_HREF)}
                className={`${ZEILE_CLS}${merkMehrOid === aktivId ? ' hs-aktiv' : ''}`}>
                <RegisterMarke route={MERK_ALLE_HREF} />
                <span className="min-w-0 flex-1 text-body-s font-medium text-ink-700 underline">{`Alle ${merkliste.length} auf der Startseite`}</span>
              </li>
            )}
          </ul>
        </div>
      )}
      {zeigeVerlauf && (
      <div role="group" aria-labelledby={verlaufId}>
      <p id={verlaufId} className="lc-overline px-4 pt-3 pb-1.5">Zuletzt geöffnet</p>
      {verlauf.length === 0
        // §8: ehrlich statt leer — der Verlauf ist noch keiner. KEINE Ersatz-Liste
        // (das wären die «Einstiege», die genau hier gefallen sind).
        //
        // C3-1 (R9-2, 6.9.2026): der Satz stand hier in der KANON-FORM des
        // Leerzustands, von Hand gezeichnet (`text-body-s text-ink-500`) — die
        // App-weite Sonde `leerzustand-d7.test.tsx` (3) sucht diese Rohform, griff
        // aber nur bei «Kein…»/«Keine…»/«Noch kein…» und lief an «Noch nichts…»
        // vorbei. Jetzt der Baustein: `art="bestand"`, weil der Zweig über den
        // VOLLEN Verlauf läuft und nicht hinter einer Sucheingabe hängt (R4-E:
        // die Art folgt der Lage, nicht dem Wortlaut) — es ist nichts DA, nichts
        // verdeckt, also kein erfundener Weiterweg (§8). Wortlaut unverändert.
        // Die Polsterung bleibt am UMSCHLAG: sie gehört zur Panel-Geometrie
        // (`px-4`, wie Überschrift und Fussnote darüber/darunter), nicht zum
        // Leerzustand — der Baustein nimmt bewusst keine Zusatzklassen.
        ? <div className="px-4 pb-3"><Leerzustand art="bestand" text="Noch nichts geöffnet." /></div>
        : (
          <ul role="none" className="pb-1">
              {verlauf.map((e) => {
                const oid = suchOptionId(listboxId, 'verlauf', e.route);
                const art = artVonRoute(e.route);
                return (
                  <li key={oid} role="option" id={oid} aria-selected={oid === aktivId}
                    onClick={() => onNavigate(e.route)}
                    className={`${ZEILE_CLS}${oid === aktivId ? ' hs-aktiv' : ''}`}>
                    <RegisterMarke route={e.route} />
                    <span className="min-w-0 flex-1 truncate" title={e.titel}>{reiterKurzform(e.route) ?? e.titel}</span>
                    {art && <span className="shrink-0 text-xs text-ink-500">{art}</span>}
                  </li>
                );
              })}
            </ul>
        )}
      </div>
      )}
    </div>
    {(verlauf.length > 0 || merkliste.length > 0) && (
      // §8: der Verlauf liegt nur lokal — als Fussnote UNTER der Liste, und mit ihr
      // «Verlauf leeren» (W2·31 P3): der Topbar-Knopf des Verlaufs fehlt unter 481 px
      // und bei grosser Schrift bis ~570 px, die Liste hier bleibt sichtbar. Die Zeile
      // steht als GESCHWISTER der Listbox (ein Knopf in `role=listbox` ist kein
      // erlaubtes Kind) und ausserhalb ihrer Scroll-Kappung: sie bleibt im Bild.
      <div className="flex items-center justify-between gap-2 px-4 pb-2.5">
        <p className="text-micro leading-snug text-ink-500">Nur auf diesem Gerät</p>
        {verlauf.length > 0 && <VerlaufLeerenKnopf onGeleert={onVerlaufGeleert} />}
      </div>
    )}
    </>
  );
}
