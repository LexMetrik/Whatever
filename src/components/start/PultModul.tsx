import { Suspense, useId, type ReactNode } from 'react';
import { usePaneKlasse } from '../layout/PaneKontext';
import type { Register } from '../../lib/startseiteModulTypen';

// ─── Der EINE Rahmen einer Modulzeile des Pults (W2·24-R10) ─────────────────
//
// Referenzbild `abnahme/design-identitaet/pult-freigegeben.html`, Marke `.modul`:
// links eine schmale Kopfspalte (3-px-Registerstrich · Titel · Schalter
// «Anzeigen/Ausblenden»), rechts der Inhalt. Kein Kasten, keine Haarlinie ausser
// der einen Zeilentrennung unten — David 6.9.2026 zum Vorgänger: «zu viel text
// und linien».
//
// WAS AN DIE STELLE DES SATZSPIEGELS TRITT. Bis R3 trug jede Zeile eine
// 150-px-MARGINALIE mit Bereich und Bestandszahl; `start/Satzspiegel` ist damit
// ersatzlos gestrichen (§17-Gegengewicht: die Zahl steht seit R10 EINMAL, in der
// Bereichs-Reihe oben — sie in jeder Modulzeile zu wiederholen war die zweite
// Wahrheit, die David als «zu viel Text» gesehen hat). Die Kopfspalte hier ist
// keine Marginalie: sie trägt keine Meta-Angabe, sondern die Bedienung.
//
// ZUGEKLAPPT HEISST `hidden`, NICHT «nicht gerendert» (§15 · CLS): der Prerender
// liefert die Werkseinstellung aus, der Client kennt die eigene Anordnung. Wären
// die Bäume verschieden gebaut, verwürfe React 19 die Hydration und renderte die
// ganze Seite neu — sichtbar als Sprung. So unterscheiden sich Server und Client
// nur in ATTRIBUTEN (`hidden`, `aria-expanded`, `style.order`) und im Wort auf
// dem Schalter; `useSyncExternalStore` (pages/Startseite) sorgt dafür, dass
// React sie nach der Hydration auch wirklich nachzieht.
//
// A11y: jede Zeile ist eine `<section aria-labelledby>` mit genau einer <h2>;
// der Schalter nennt SEIN Modul im Accessible Name (`aria-label`), weil «Ausblenden»
// fünfmal auf der Seite steht und allein nichts sagt. `aria-controls` zeigt auf
// den Inhalt, `aria-expanded` sagt den Zustand an.
// Reine Darstellung (§3).

export type { Register };

/** Registerstrich der Kopfzeile — die einzige Farbfläche einer Modulzeile.
 *  Als Tabelle, weil das Register als PROP kommt (Tailwind sieht nur ganze
 *  Klassennamen im Quelltext; ein zusammengesetzter Name wäre ein stiller No-op). */
const STRICH: Record<Register, string> = {
  g: 'bg-reg-g', r: 'bg-reg-r', m: 'bg-reg-m', w: 'bg-reg-w',
};

export function PultModul({ id, titel, reg, an, position, aufSchalten, children }: {
  /** Modul-Kürzel — steht als `data-pult-modul` am Knoten, damit Sonden die
   *  ANZEIGE-Reihenfolge (CSS `order`) am Modul selbst ablesen können, ohne sich
   *  an eine Klassenkette oder einen Titel-Wortlaut zu hängen. */
  id: string;
  titel: string;
  reg: Register;
  /** Aufgeklappt? Steuert `hidden` am Inhalt und das Wort auf dem Schalter. */
  an: boolean;
  /** Platz in der Anordnung (CSS `order`) — die DOM-Reihenfolge bleibt die des
   *  Registrys, damit Server- und Client-Baum deckungsgleich sind. */
  position: number;
  aufSchalten: () => void;
  children: ReactNode;
}) {
  const pk = usePaneKlasse();
  const titelId = useId();
  const inhaltId = useId();
  return (
    <section
      aria-labelledby={titelId}
      data-pult-modul={id}
      style={{ order: position }}
      suppressHydrationWarning
      className={`grid gap-x-7 gap-y-2 border-b border-rule-soft py-4 ${pk(
        'lg:grid-cols-[13rem_minmax(0,1fr)]', '@3xl/pane:grid-cols-[13rem_minmax(0,1fr)]',
      )}`}>
      {/* OBEN AUSGERICHTET, nicht mittig (gemessen 6.9.2026, Preview @1440):
          «Bundesrecht, systematische Ordnung» bricht in der 13-rem-Kopfspalte
          auf drei Zeilen; mittig gesetzt wanderten Registerstrich und Schalter
          dann in die Mitte des Blocks und verloren den Bezug zur ersten Zeile
          des Inhalts daneben. */}
      <div className="flex items-start gap-2.5 font-sans text-body-s">
        <span aria-hidden className={`mt-1 h-3.5 w-[3px] shrink-0 ${STRICH[reg]}`} />
        <h2 id={titelId} className="min-w-0 text-ink-900">{titel}</h2>
        <button
          type="button"
          onClick={aufSchalten}
          aria-expanded={an}
          aria-controls={inhaltId}
          aria-label={`${titel} ${an ? 'ausblenden' : 'anzeigen'}`}
          suppressHydrationWarning
          className="ml-auto shrink-0 border-b border-rule-soft pb-0.5 font-sans text-xs text-ink-500 hover:border-ink-900 hover:text-ink-900">
          {an ? 'Ausblenden' : 'Anzeigen'}
        </button>
      </div>
      <div id={inhaltId} hidden={!an} suppressHydrationWarning
        className="min-w-0 font-sans text-body-s text-ink-600">
        {/* ─── Mismatch-Grenze je Modul (QS-BASIS-Nachzug, 15.9.2026) ─────────
            Seit `main.tsx` die prerenderten Routen HYDRIERT, ist ein
            Markup-Unterschied zwischen Prerender und erstem Client-Render
            nicht mehr folgenlos: React verwirft dann den Teilbaum bis zur
            NÄCHSTEN Suspense-Grenze und baut ihn neu auf. Ohne diese Grenze
            hier wäre das die Grenze von `layout/RouteHuelle` — also die GANZE
            Route samt der <h1>, dem LCP-Element.
            DAS TRIFFT DAS PULT ZWANGSLÄUFIG: seine Module zeigen bewusst
            Besucher-Abhängiges, das der Prerender nicht kennen kann — der
            Schnellrechner rechnet ab HEUTE (`forms/EinfacheFristForm`), die
            Zeiterfassung und «Zuletzt verwendet» lesen den lokalen Speicher.
            GEMESSEN am 15.9.2026 an einem Stand, der den Routen-Chunk vor dem
            Hydrieren vorwärmte (also mit hydriertem Routen-Inhalt; Uhr auf den
            7.9. gestellt = die Lage jedes Besuchers nach dem Bautag):
            ohne diese Grenze überlebten 102 von 450 prerenderten Knoten, mit
            ihr 377. Das Vorwärmen ist wieder draussen (es kostete 1.05 s LCP,
            Herleitung im PR) — die Grenze bleibt, weil die drei genannten
            Quellen bleiben und die offenen Pins der Hülle (Seitenleisten-
            Gruppen, Sprache, `istMobil`) den Routen-Inhalt jederzeit wieder in
            die Hydration ziehen können.
            ZWEITE, HEUTE WIRKSAME FOLGE, und sie ist ehrlich als knapp zu
            benennen: die zusätzlichen Grenzen verschieben den Zeitpunkt, zu
            dem React den prerenderten Routen-Inhalt entfernt, von 26 ms auf
            51 ms nach `DOMContentLoaded` (gemessen, `requestAnimationFrame`-
            Probe auf `main h1`; das Loch schliesst sich in beiden Fällen bei
            ~258 ms). Diese 25 ms sind der Unterschied, mit dem die Messung in
            `e2e/d39-begruessung.e2e.ts` noch vor dem Loch fertig wird —
            ohne die Grenze ist jene Spec 3/3 rot, mit ihr 5/5 grün (und grün
            im vollen Lauf, 1231 Fälle). Das ist eine MARGE, keine Garantie;
            der robuste Weg wäre, jene Spec wie die übrigen auf
            `e2e/helpers/appGebootet` warten zu lassen (§17-Wurzelfix vom
            6.9.2026) — das gehört in einen eigenen Schritt.
            KEIN WEICHSPÜLER: die Grenze unterdrückt nichts und verändert
            nichts am Inhalt — sie sagt nur, WIE WEIT React zurückbauen darf.
            Der neu gebaute Teilbaum ist der Client-Baum, das angezeigte
            Fristende also das des BESUCHERS. Gemeldet wird ein Rückbau
            weiterhin über `onRecoverableError` (main.tsx). */}
        <Suspense>{children}</Suspense>
      </div>
    </section>
  );
}

/** Fuss-Zeile INNERHALB eines Moduls: Scope, Grenze, Verweis — nie ein Nutzenversprechen (§8).
 *  (Wortgleich aus `start/Satzspiegel` übernommen, das mit R10 entfällt.) */
export function ModulFuss({ children }: { children: ReactNode }) {
  return <p className="mt-3 max-w-reading font-sans text-xs leading-relaxed text-ink-500">{children}</p>;
}
