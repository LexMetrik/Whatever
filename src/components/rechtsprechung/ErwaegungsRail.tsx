import { memo, useState, type ReactNode } from 'react';
import { usePaneKlasse } from '../layout/PaneKontext';
import { erwaegungsWort } from '../../lib/rechtsprechung/abschnitte';

// ─── V5 · Erwägungs-Navigation im Entscheid-Leser (W2·10-UI-NAV) ─────────────
//
// «E. 4.5.2 in zwei Klicks» — Juristen navigieren einen Entscheid über
// Erwägungs-Nummern, nicht über den Scrollbalken. Der Reader trug bisher nur die
// vier groben Sprung-Chips (Regeste · Sachverhalt · Erwägungen · Dispositiv);
// innerhalb der Erwägungen gab es keine Navigation, obwohl JEDER Block seit dem
// Pin-Cite-Schnitt einen stabilen `#e-…`-Anker hat.
//
// ── WAS DIESE FLÄCHE IST — UND WAS NICHT (Auflage der Spec, VZUI §0/1d) ─────
// Der Rail ist NAVIGATION, keine Verzahnungs-Fläche. Die Fuss-Position der
// Verzahnungs-Blöcke (KontextPanel: zitierte Normen/Entscheide mit Wegen NACH
// AUSSEN) ist dokumentierter Entscheid und bleibt unangetastet. Die Normen-Chips
// hier führen ausschliesslich INNERHALB dieses Entscheids an die Stelle, an der
// die Norm wörtlich genannt wird — sie verlinken bewusst NICHT in die
// Gesetzessammlung; das tut der Fuss. Zwei verschiedene Fragen, zwei Orte.
//
// ── EINE ANKER-WAHRHEIT (§5) ───────────────────────────────────────────────
// Gliederung und Treffer kommen aus `erwaegungsGliederung` bzw.
// `trefferInErwaegungen`, beide über `gruppiereErwaegungen` — dieselbe
// Ankerbildung wie Body, Pin-Cite-Kopie und Fundstellen-Sprung. Ein Rail mit
// eigener Nummerierung wäre eine zweite Wahrheit und träfe die Ziele daneben.
//
// ── §8: nur echte Ziele ────────────────────────────────────────────────────
// Markenlose Erwägungen (unplausible/kantonale Daten) tragen keinen zitierfähigen
// Anker und erscheinen darum NICHT als Sprungziel. Die Trefferzahl der Suche
// nennt getrennt, wie viele Vorkommen es im ganzen Dokument gibt und wie viele
// davon anspringbar sind — sonst behauptete die Liste Vollständigkeit.
//
// ── §15: keine Layout-Verschiebung, keine Dauerrechnung ────────────────────
// Der Rail steht ab dem ersten Render (er hängt nur am bereits geladenen
// Snapshot) und ist auf Desktop `sticky` — er wächst nichts ein, CLS 0.
//
// REINER RENDERER (wie `BezuegeZeile`): Gliederung, Treffer und Normen-Anker
// rechnet der Reader EINMAL in `useMemo` und reicht sie durch (React Compiler
// ist AUS). Die Komponente selbst rechnet nichts — so kann kein zweiter
// Rechenweg entstehen, und die `memo`-Grenze greift wie gedacht.

/** Einrückung je Gliederungstiefe — Klassen statt Inline-Werten (§13). */
const EINZUG = ['pl-0', 'pl-3', 'pl-6', 'pl-9'] as const;

function Lupe() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M11 11l3.5 3.5" />
    </svg>
  );
}

/** Ein Sprungziel der Liste; `anzahl` nur in der Treffer-Sicht. */
export interface RailPunkt { anker: string; marke: string; tiefe: number; anzahl?: number }

// ── A-2 (W2·19-DESIGN-KONSISTENZ · B2/BAU-4, 31.8.2026) · IMPORT-FOLGE ──────
//
// Der Rail hing an einer BOOLEAN-Prop `imPane`: gesetzt ⇒ «es gibt hier keine
// Spalte», also immer die aufklappbare Form. Das war richtig, solange der
// EntscheidLeser im Pane grundsätzlich einspaltig blieb. Seit derselbe Leser
// sein Zweispalten-Bild an der PANE-Breite ausrichtet (`@5xl/pane`, Herleitung
// in `pages/EntscheidLeser.tsx`), wäre die Boolean eine zweite, widersprechende
// Aussage: das Raster stellte eine zweite Spalte bereit, der Rail hielte sich
// weiter für spaltenlos, und beide Kinder landeten in Spalte 1 übereinander.
// Der Rail liest die Lage darum aus DERSELBEN Quelle wie sein Raster
// (`usePaneKlasse`, §5) — und die Prop entfällt ersatzlos (§17-Rückbau: sie
// trug keine Aussage mehr, die nicht der Kontext schon trägt).
export const ErwaegungsRail = memo(function ErwaegungsRail({
  gliederung, treffer, trefferGesamt, normen, suche, onSuche, springe, markenSchalter,
}: {
  /** Erwägungs-Gliederung der SICHTBAREN Fassung (`erwaegungsGliederung`). */
  gliederung: readonly RailPunkt[];
  /** Erwägungen mit Treffern des Suchbegriffs (`trefferInErwaegungen`). */
  treffer: readonly RailPunkt[];
  /** Vorkommen in der GANZEN sichtbaren Fassung (`zaehleTreffer`) — die
   *  Bezugsgrösse: was ausserhalb der Erwägungen liegt, ist nicht anspringbar. */
  trefferGesamt: number;
  /** Angewandte Normen MIT wörtlicher Fundstelle in einer Erwägung. */
  normen: readonly { zitat: string; anker: string }[];
  suche: string;
  onSuche: (v: string) => void;
  /** Sprung + Hash-Spiegelung — dieselbe Funktion wie die Abschnitts-Chips. */
  springe: (anker: string) => void;
  /** W2·28 · L-2 — Schalter «Hervorhebung und Treffer-Marken zusammen aus», als
   *  fertiges Element vom Leser (der Rail bleibt reiner Renderer). Er steht IM
   *  reservierten Auskunfts-Slot unter dem Feld, nimmt also keine zusätzliche
   *  Höhe und verschiebt das Verzeichnis darunter nicht (§15.2). */
  markenSchalter?: ReactNode;
}) {
  // Mobil (und in der schmalen Pane) eingeklappt starten: der Lesetext gehört
  // zuerst ans Auge. Ob die Spalte steht, entscheidet allein CSS — kein
  // Media-Query in JS, damit Server- und Client-Markup nicht auseinanderlaufen.
  const [offen, setOffen] = useState(false);
  const pk = usePaneKlasse();

  // Nichts zu navigieren ⇒ gar keine Fläche (kein leerer Kasten, §15.2/§13 F4).
  if (gliederung.length === 0 && normen.length === 0) return null;

  const trefferErw = treffer.reduce((n, t) => n + (t.anzahl ?? 0), 0);
  const liste: readonly RailPunkt[] | null = suche.trim() === '' ? null : treffer;

  return (
    <aside
      data-erw-rail
      className={pk(
        'order-1 min-w-0 xl:order-2 xl:col-start-2 xl:row-start-1 xl:sticky',
        'order-1 min-w-0 @5xl/pane:order-2 @5xl/pane:col-start-2 @5xl/pane:row-start-1 @5xl/pane:sticky',
      )}
      // `top` gilt nur, WENN die Spalte klebt — sonst ist es ein wirkungsloser
      // Wert. Es steht darum unbedingt da: eine zweite Weiche für dieselbe
      // Aussage wäre genau die Doppelung, die A-2 hier auflöst.
      style={{ top: 'calc(var(--rsp-stick, 7rem) + 0.5rem)' }}
      aria-label="Navigation im Entscheid"
    >
      {/* Mobil/Pane: ein Griff. Auf Desktop ist der Rail immer offen — der Griff
          verschwindet dort ganz (kein Steuerelement ohne Wirkung, §13 F4). */}
      <button type="button" data-erw-rail-griff
        onClick={() => setOffen((v) => !v)}
        aria-expanded={offen}
        className={pk('lc-chip w-full justify-between xl:hidden', 'lc-chip w-full justify-between @5xl/pane:hidden')}>
        {/* Wortwahl bewusst «Gliederung» statt «Erwägungen»: der Reader trägt
            bereits einen Abschnitts-Chip «Erwägungen» in der Sprungleiste; zwei
            gleichnamige Bedienelemente auf einer Seite sind für Screenreader und
            Tests nicht unterscheidbar. */}
        <span>Gliederung &amp; Suche</span>
        <span aria-hidden className="text-base leading-none">{offen ? '▾' : '▸'}</span>
      </button>

      <div className={`${offen ? 'mt-2 block' : 'hidden'} ${pk('xl:mt-0 xl:block', '@5xl/pane:mt-0 @5xl/pane:block')} space-y-3`}>
        {/* «Im Entscheid suchen» — Pendant zur In-Gesetz-Suche (A35). Das Feld
            markiert im Lesetext (Highlight-API, kein DOM-Eingriff) und listet
            hier die Erwägungen mit Treffern. */}
        <div>
          {/* Dasselbe Eingabe-Token wie die In-Gesetz-Suche (`lc-input`, §5/§13);
              der Fokus-Ring bleibt der globale `:focus-visible`-Outline (F3) —
              kein `outline-none`, sonst verschwände die Tastatur-Sichtbarkeit. */}
          <div className="flex items-center gap-1.5">
            <span aria-hidden className="shrink-0 text-ink-500"><Lupe /></span>
            <input type="search" value={suche} onChange={(e) => onSuche(e.target.value)}
              placeholder="Im Entscheid suchen …" aria-label="Im Entscheid suchen"
              data-erw-suche
              className="lc-input h-7 w-full min-w-0 px-2 py-0 text-xs" />
          </div>
          {/* §15.2 — RESERVIERTER SLOT statt einwachsender Zeile. Die Auskunfts-
              zeile erscheint erst beim Tippen; wüchse sie ein, schöbe sie das
              Verzeichnis darunter nach unten (gemessen 4.8.2026 unter 6×-Drossel:
              CLS 0.00023 statt 0). Der Slot steht ab dem ersten Render und wird
              GEFÜLLT, nicht eingeschoben — dasselbe Muster wie `min-h-beiwerk`
              am Artikelfuss. Zwei Zeilen `text-micro` passen in `min-h-8`; die
              längste Fassung («3 von 16 Treffer in 2 Erwägungen · übrige
              ausserhalb») bleibt bei 15 rem Railbreite darunter.
              W2·28 (18.9.2026): der Slot fasst jetzt AUCH den Schalter
              «Hervorhebung» und ist darum von `min-h-8` auf `min-h-12`
              gehoben — zwei Zeilen Auskunft (28 px) plus eine Schalterzeile
              (18 px) sind 46 px. Gehoben statt wachsen gelassen: die Zusage
              dieses Slots ist, dass er RESERVIERT ist, und ein Slot, der beim
              Tippen doch einwächst, wäre genau der gemessene Fehler von oben. */}
          <div className="mt-1 min-h-12">
          {suche.trim() !== '' && (
            // §8: BEIDE Zahlen, sobald sie auseinanderfallen. «16 Treffer»
            // allein verschwiege, dass fünf davon im Sachverhalt liegen und in
            // dieser Liste gar nicht anspringbar sind.
            <p aria-live="polite" data-erw-treffer className="text-micro text-ink-500">
              {trefferGesamt === 0
                ? 'Keine Treffer in dieser Fassung.'
                : (
                  <>
                    <span className="num">{trefferErw}</span>
                    {trefferErw < trefferGesamt && <> von <span className="num">{trefferGesamt}</span></>}
                    {' '}Treffer in <span className="num">{treffer.length}</span>
                    {/* Zählform aus `lib/rechtsprechung/abschnitte` — dieselbe
                        Quelle, aus der der Streifen daneben sein Wort zieht
                        (§5; bis 21.9.2026 stand hier ein eigenes Ternär und
                        dort «Abschnitten»). Ausgabe wortgleich wie zuvor. */}
                    {' '}{erwaegungsWort(treffer.length)}
                    {trefferErw < trefferGesamt && (
                      <span title="Vorkommen ausserhalb der Erwägungen (Regeste, Sachverhalt, Dispositiv) tragen keinen zitierfähigen Anker und sind darum kein Sprungziel.">
                        {' '}· übrige ausserhalb
                      </span>
                    )}
                  </>
                )}
            </p>
          )}
          {/* W2·28/L-2: der Schalter erscheint mit der Suche und geht mit ihr —
              und nur, wenn es überhaupt etwas hervorzuheben gibt (§13 F4: kein
              Steuerelement ohne Wirkung). */}
          {suche.trim() !== '' && trefferGesamt > 0 && markenSchalter}
          </div>
        </div>

        {/* Erwägungs-Inhaltsverzeichnis (bzw. die Treffer-Auswahl, sobald gesucht
            wird — dann ist das Verzeichnis die Ergebnisliste). */}
        {gliederung.length > 0 && (
          <nav aria-label="Erwägungen" className="max-h-[45vh] overflow-y-auto pr-1">
            <ul className="space-y-0.5">
              {(liste ?? gliederung).map((p) => (
                <li key={p.anker} className={EINZUG[Math.min(p.tiefe, EINZUG.length - 1)]}>
                  <a href={`#${p.anker}`}
                    onClick={(e) => {
                      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                      e.preventDefault();
                      springe(p.anker);
                    }}
                    className="num flex min-h-6 items-center gap-1.5 rounded px-1 text-xs text-ink-700 no-underline hover:bg-brass-100/40 hover:text-brass-700">
                    <span>{p.marke}</span>
                    {p.anzahl != null && (
                      <span className="ml-auto text-micro text-ink-500">{p.anzahl}</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
            {liste !== null && liste.length === 0 && (
              <p className="px-1 text-micro text-ink-500">Kein Treffer in den Erwägungen.</p>
            )}
          </nav>
        )}

        {/* Angewandte Normen — Sprung an die Stelle IM Entscheid (siehe Kopf). */}
        {normen.length > 0 && (
          <div>
            <p className="lc-overline" title="Im Entscheid wörtlich genannte Normen — der Chip springt an die Erwägung, nicht in die Gesetzessammlung (die steht im Fuss).">
              Angewandte Normen
            </p>
            <div data-erw-normen className="mt-1 flex flex-wrap gap-1">
              {normen.map((n) => (
                <a key={n.zitat} href={`#${n.anker}`}
                  onClick={(e) => {
                    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    e.preventDefault();
                    springe(n.anker);
                  }}
                  title={`Zur Erwägung mit ${n.zitat}`}
                  // Eigener zugänglicher Name, NICHT bloss «Art. 18 UVG»: derselbe
                  // Wortlaut steht als NormChip im Lesetext und öffnet dort die
                  // Norm-Vorschau. Zwei Links mit identischem Namen und völlig
                  // verschiedener Wirkung sind für Screenreader (und für jeden
                  // Rollen-Locator) nicht auseinanderzuhalten — der Name sagt hier
                  // darum, wohin es geht: an die Erwägung, nicht ins Gesetz.
                  aria-label={`Zur Erwägung mit ${n.zitat}`}
                  className="lc-chip no-underline hover:text-brass-700 hover:border-brass-400">
                  {n.zitat}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
});
