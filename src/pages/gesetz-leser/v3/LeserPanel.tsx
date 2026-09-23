import { useRef, type ReactNode } from 'react';
import type { BestimmungsWort } from './erlassAnsicht';
import { OEFFNER_WORT, PANEL_REITER, normZitat, reiterTitel, type PanelReiter } from './panelModell';
import { SchliessKnopf } from '../../../components/ui/SchliessKnopf';

/** Register je Reiter (W2·29 S5): Entscheide = Rechtsprechung, Änderungen =
 *  Gesetze, Materialien = Materialien, Werkzeuge = Werkzeuge. Volle
 *  Klassen-Literale, damit Tailwind sie findet.
 *  S6: «Erläuterungen» trägt das Register `m` — es ist dasselbe Register wie
 *  die Rubrik «Materialien» des Hauses (`/materialien`), in der die
 *  Behördenpublikationen katalogisiert sind, und dieselbe Farbe wie ihre
 *  Rubrik am Artikelende (`data-reg="m"`). Ein fünftes Register gibt
 *  `design/tokens.json` nicht her, und eines zu erfinden wäre ein Token
 *  ausserhalb der Quelle. */
const REITER_REGISTER: Readonly<Record<PanelReiter, string>> = {
  entscheide: 'border-reg-r bg-reg-r-flaeche',
  aenderungen: 'border-reg-g bg-reg-g-flaeche',
  materialien: 'border-reg-m bg-reg-m-flaeche',
  erlaeuterungen: 'border-reg-m bg-reg-m-flaeche',
  werkzeuge: 'border-reg-w bg-reg-w-flaeche',
};

// ─── Das Panel selbst: EIN Ort, VIER Reiter (FAHRPLAN-LESER-V3 Kap. 4d, H3) ───
//
// WAS DAS ERSETZT: das `KontextPanel` (765 Z.) mit sechs bedingten Sektionen, die
// je nach Datenlage erschienen und verschwanden — Pos. 17 «Kontext-Panel
// überladen». Benannte Reiter sind vorhersagbar: der Nutzer weiss, WO er
// nachsieht, bevor er weiss, ob dort etwas steht.
//
// Diese Datei ist nur die HÜLLE: Kopf, Reiter-Leiste, Scroller, Fuss. Was in
// einem Reiter steht, wissen `PanelEntscheide` / `PanelAenderungen` /
// `PanelMaterialien` / `PanelAnwendung` — und nur die. Wer einen weiteren Reiter
// braucht, ergänzt `PANEL_REITER` und übergibt einen weiteren Eintrag in
// `inhalt`. H3 baute drei; der vierte («Anwendung») kam mit W2·7-VZUI dazu und
// hat genau diesen Weg genommen — die Hülle blieb dabei unverändert. S6
// (23.9.2026) teilte ihn in «Erläuterungen» und «Werkzeuge»: fünf Reiter,
// derselbe Weg (Tafeln: `PanelErlaeuterungen`, `PanelWerkzeuge`).
//
// ── ECHTE REITER, ALSO ECHTE PFEILTASTEN (W3C ARIA APG «Tabs») ──────────────
// Anders als bei den Dropdowns des Lesers (dort «ehrliche Disclosure», KEIN
// role=menu) ist `role="tablist"` hier die richtige Rolle — und sie verspricht
// Pfeiltasten-Navigation. Das Versprechen wird eingelöst (←/→/Home/End unten),
// sonst wäre es genau die Lüge, die die Dropdown-Entscheidung vermeidet (§8).
// Roving tabindex: nur der aktive Reiter ist in der Tab-Folge; ein Tab-Schritt
// führt von der Leiste in den Inhalt, nicht durch drei Knöpfe.
//
// ── DER FUSS IST LEER UND HAT EINEN NAMEN ───────────────────────────────────
// «Zitat-Export-Platz reservieren (nicht bauen)» (H3-Auftrag): der Fuss nimmt
// `fuss` entgegen und rendert OHNE Inhalt kein Element — kein Rahmen, keine
// Höhe, kein CLS. Reservierter Platz heisst hier ein benannter Anschluss, keine
// leere Fläche (dieselbe Regel wie bei den H1-Slots des Rahmens).

export function LeserPanel({
  panelId, titelId, artikelLabel, bestimmungsWort, erlassKuerzel, reiter, setReiter, inhalt, onSchliessen,
  fuss, panelRef, kopfExtra, steckbrief,
}: {
  panelId: string;
  /** Id der Überschrift — der Aufrufer setzt sie als `aria-labelledby` an die
   *  Fläche (Spalte: `role="region"`, Blatt: `role="dialog"`). */
  titelId: string;
  /** Auf welchen Artikel bezieht sich der Reiter «Entscheide»? `null`, solange
   *  der Scroll-Spy keine Leseposition kennt — dann steht dort nichts statt
   *  eines erfundenen «Art. 1» (§8). */
  artikelLabel: string | null;
  /** C1 (H3-Nachzug): Zähl-Substantiv des Erlasses — der Reiter-Titel sagt «zu
   *  diesem Artikel» bzw. «zu diesem Paragraphen». Kommt aus der EINEN Ableitung
   *  (`./erlassAnsicht`), wird hier nie abgeleitet (§5). */
  bestimmungsWort: BestimmungsWort;
  /**
   * Cowork-Befund 34 (18.8.2026): der Panel-Kopf trug in JEDEM Reiter dieselbe
   * Artikel-Angabe («· Art. 1») — in «Änderungen»/«Materialien» gilt der
   * Inhalt aber dem GANZEN Erlass, nicht dem gerade gelesenen Artikel (§8:
   * eine irreführende Ortsangabe ist keine ehrliche). Nur der Reiter
   * «Entscheide» zeigt darum weiter `artikelLabel`; die anderen beiden zeigen
   * stattdessen das Erlass-Kürzel.
   *
   * S6-W1b (Audit 23.9.2026, E-10): «· Art. 41» allein sagte nicht, WELCHES
   * Art. 41 — in einem Split mit zwei Erlassen ist das die offene Frage. Der
   * Entscheide-Reiter nennt seither Artikel UND Kürzel («· Art. 41 OR»), in
   * derselben Form wie das Kurz-Zitat des Fundstellen-Sprungs (`normZitat`).
   */
  erlassKuerzel: string;
  reiter: PanelReiter;
  setReiter: (r: PanelReiter) => void;
  inhalt: Readonly<Record<PanelReiter, ReactNode>>;
  onSchliessen: () => void;
  fuss?: ReactNode;
  panelRef: React.RefObject<HTMLDivElement | null>;
  /** Griffleiste des Blatt-Modus (Wisch-Griff) — im Spalten-Modus ungesetzt. */
  kopfExtra?: ReactNode;
  /**
   * Ä89 (H4-Nachzug 18.8.2026) · Der Erlass-STECKBRIEF als Zeile des Panels.
   *
   * Er stand bis hierher INNERHALB der aktiven Tafel — der Aufrufer wickelte ihn
   * um jeden Reiter-Inhalt (`LeserPanelZone.mitSteckbrief`) und schrieb den
   * Abstrich selbst dazu: «die saubere Stelle wäre zwischen Reiter-Leiste und
   * Scroller — das ist `LeserPanel.tsx` und bleibt als Rückgabe-Punkt offen».
   * Gemessen 18.8.2026 @1440 (StPO, Gliederung eingeklappt, Panel offen): die
   * Klappe lag bei y = 245, die Reiter-Leiste bei y = 208 — also UNTER den
   * Reitern, obwohl sie zu keinem gehört, und `[role=tabpanel]` enthielt sie
   * (`imTabpanel: true`). Das ist der Rückgabe-Punkt, hier eingelöst: der
   * Steckbrief steht jetzt zwischen Kopf und Reiter-Leiste — über den Reitern,
   * unter dem Paneltitel, wie es der Ästhetik-Befund Ä89 verlangt.
   *
   * Er bleibt damit genau EINMAL im DOM, unabhängig vom Reiterwechsel; die
   * Ä28-Zusage «die Warnung steht genau einmal» hängt nicht mehr daran, dass
   * nur die aktive Tafel gemountet ist.
   */
  steckbrief?: ReactNode;
}) {
  const leisteRef = useRef<HTMLDivElement>(null);

  function taste(e: React.KeyboardEvent<HTMLDivElement>): void {
    const i = PANEL_REITER.findIndex((r) => r.id === reiter);
    const letzte = PANEL_REITER.length - 1;
    const ziel = e.key === 'ArrowRight' ? (i === letzte ? 0 : i + 1)
      : e.key === 'ArrowLeft' ? (i === 0 ? letzte : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? letzte
      : -1;
    if (ziel < 0) return;
    e.preventDefault();
    const neu = PANEL_REITER[ziel];
    if (!neu) return;
    setReiter(neu.id);
    // Der Fokus folgt der Auswahl (APG «Tabs with automatic activation»):
    // sonst zeigte die Leiste einen anderen Reiter an als den, auf dem der
    // Fokus steht — zwei Wahrheiten in einer Leiste.
    leisteRef.current?.querySelector<HTMLElement>(`[data-v3-panel-reiter="${neu.id}"]`)?.focus();
  }

  return (
    // W2·29 S5 (Werkbank): eckig, flach (`.lc-schwebeflaeche` = Papier + Linie).
    <div ref={panelRef} tabIndex={-1} id={panelId} data-v3-panel
      className="lc-schwebeflaeche flex min-h-0 flex-col overflow-hidden">
      {kopfExtra}
      {/* ── Kopf: WAS ist das, WORAUF bezieht es sich, WEG damit ─────────────── */}
      <div className="flex shrink-0 items-baseline justify-between gap-2 border-b-2 border-ink-900 px-3 py-2">
        <p id={titelId} className="lc-overline min-w-0 truncate">
          {/* C-1/E-10 (S6-W1a, 23.9.2026): EIN Name — «Erlass-Blatt» wie am
              Öffner (`OEFFNER_WORT`); bis dahin «Rechtsprechung & Kontext». */}
          {OEFFNER_WORT}
          {/* Befund 34: nur «Entscheide» bezieht sich auf den Artikel — die
              anderen Reiter gelten dem Erlass, darum dessen Kürzel statt der
              (dort irreführenden) Artikel-Angabe. E-10: der Artikel steht als
              Zitat MIT Kürzel («Art. 41 OR», `normZitat`, §5). */}
          <span className="num ml-1 font-normal normal-case text-ink-600">
            · {reiter === 'entscheide' ? normZitat(artikelLabel, erlassKuerzel) : erlassKuerzel}
          </span>
        </p>
        <SchliessKnopf name={`${OEFFNER_WORT} schliessen`} onClick={onSchliessen}
          data-v3-panel-zu klasse="-mr-1 px-1.5 py-0.5" />
      </div>

      {/* ── Ä89 · Steckbrief-Zeile ÜBER den Reitern ──────────────────────────
          Sie gehört dem PANEL, nicht einer seiner Tafeln: wer den Reiter
          wechselt, soll sie nicht verlieren — und der Screenreader soll sie
          nicht als Teil von «Entscheide» vorgelesen bekommen. Ohne Inhalt
          rendert hier nichts: kein Rahmen, keine Höhe, kein CLS. */}
      {steckbrief && (
        <div data-v3-panel-steckbrief className="shrink-0 border-b border-line px-3 py-1">{steckbrief}</div>
      )}

      {/* ── Reiter-Leiste · Registerfläche (W2·29 S5, Board «Erlass-Blatt») ──
          Jedes Fach trägt sein Register (`REITER_REGISTER`): der aktive Reiter
          steht auf der getönten Fläche `reg-*-flaeche` mit der Registerkante
          unten, Tinte darauf (F0.2 i. d. F. 22.9.2026: Fläche nur über diese
          Token, nie die Registerfarbe als Text). Die Fächer wachsen (`grow`)
          auf die Zeilenbreite und schrumpfen nie (`shrink-0`).
          G11 (7.9.2026, gemessen am 22-rem-Blatt): vier Fächer müssen GANZ
          passen — weder Kürzen (Kanon-Etikett, Ä114) noch stummes Scrollen;
          darum `flex-wrap`. `overflow-x-auto` + `lc-scrollrand-x` bleiben für
          das Einzelfach, das breiter ist als die Zeile (200-%-Schriftskala).
          `px-1` statt `px-2` (gemessen 23.9.2026, OR @1440/1280/1024, Blatt
          380 px): mit `px-2` brach «Anwendung» allein in eine zweite Zeile.
          BEWACHT: `e2e/leser-w224-g.e2e.ts` (G11); rot: `flex-wrap` entfernen.
          S6-W1a (23.9.2026, Entscheid David: künftig FÜNF Reiter): gemessen am
          380-px-Blatt mit den Etiketten «Entscheide · Änderungen · Materialien ·
          Erläuterungen · Werkzeuge» — Schriftbreite 376 px in `text-body-s`
          gegen 354 px Zeile, also nie einzeilig; in `text-xs` 322 px, mit
          `px-0.5` 342 px ≤ 354 (@390 unten: ≤ 364). Darum `text-xs`/`px-0.5`;
          `grow` verteilt den Rest. @320 bricht die Leiste weiter um (G11). */}
      <div ref={leisteRef} role="tablist" aria-label={`Reiter des ${OEFFNER_WORT}s`} onKeyDown={taste}
        className="lc-scrollrand-x flex flex-wrap shrink-0 gap-y-0.5 overflow-x-auto overflow-y-hidden px-3 pt-2 [scrollbar-width:none]">
        {PANEL_REITER.map((r) => {
          const aktiv = r.id === reiter;
          return (
            <button key={r.id} type="button" role="tab" id={`${panelId}-tab-${r.id}`}
              data-v3-panel-reiter={r.id}
              // D-11 (S6-W1a): nur die AKTIVE Tafel ist im DOM (s. Scroller unten) —
              // `aria-controls` auf eine fehlende Id wäre eine tote Referenz.
              aria-selected={aktiv} aria-controls={aktiv ? `${panelId}-tafel-${r.id}` : undefined}
              tabIndex={aktiv ? 0 : -1} title={reiterTitel(r.id, bestimmungsWort)}
              onClick={() => setReiter(r.id)}
              className={`inline-flex grow shrink-0 items-center justify-center whitespace-nowrap border-b-2 px-0.5 py-1.5 text-xs transition-colors ${
                aktiv ? `${REITER_REGISTER[r.id]} font-semibold text-ink-900` : 'border-line text-ink-600 lc-hover-flaeche hover:text-ink-900'
              }`}>
              {r.label}
            </button>
          );
        })}
      </div>

      {/* ── Der EINE Scroller des Panels ──────────────────────────────────────
          `overscroll-contain`: Wischen im Panel zieht nicht die Seite dahinter
          mit (dieselbe Zusage wie im Gliederungs-Blatt). Nur die AKTIVE Tafel
          ist im DOM — drei gemountete Tafeln hätten alle drei Ladepfade
          gleichzeitig angestossen und damit das Nachladen ausgehebelt. */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:thin]">
        <div role="tabpanel" id={`${panelId}-tafel-${reiter}`} aria-labelledby={`${panelId}-tab-${reiter}`}>
          {inhalt[reiter]}
        </div>
      </div>

      {fuss && <div className="shrink-0 border-t border-line px-3 py-1.5">{fuss}</div>}
    </div>
  );
}
