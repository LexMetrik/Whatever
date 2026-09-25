import { Suspense, type ReactNode } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { Ladeanzeige } from '../ui/Ladeanzeige';
import { usePaneKlasse } from './PaneKontext';
import { registerVonPfad } from './bereiche';

// ─── A-6 (W2·19-DESIGN-KONSISTENZ, 31.8.2026) · EINE ROUTEN-HÜLLE ───────────
//
// BEFUND der Finder-Welle: um den Routen-Baum lagen DREI Zusagen — Fade
// (`lc-route` an einem `key={pathname}`-Knoten), Suspense-Fallback MIT
// Höhenreservierung und `ErrorBoundary key={pathname}` (Selbstheilung beim
// Seitenwechsel). Alle drei standen NUR in `App.tsx`. Das sekundäre Pane
// (`layout/Pane.tsx`) rendert denselben `RouteSwitch` und hatte:
//   · keinen Fade (Routenwechsel im Pane sprang hart um),
//   · einen Fallback OHNE Höhenreservierung (der Ladeframe kollabierte den
//     Pane-Inhalt auf eine Zeile — genau der CLS-Fall, gegen den `min-h-screen`
//     in App.tsx gemessen eingezogen wurde),
//   · eine `ErrorBoundary` OHNE `key` (ein einmal fehlgeschlagener Lazy-Chunk
//     blieb im Pane bis zum manuellen Neuladen als Fehlanzeige stehen; im
//     Hauptfenster räumt ihn der nächste Seitenwechsel weg).
//
// Drei Zusagen an einer Stelle statt an zwei halben (§5/§10): die Hülle ist
// EIN Baustein, den beide Flächen konsumieren. Reine Darstellung (§3).
//
// ── WARUM DIE REIHENFOLGE GENAU SO IST (aus App.tsx übernommen, unverändert) ─
//   ErrorBoundary(key) ▸ Suspense(fallback) ▸ div(key, lc-route) ▸ children
// Die Boundary liegt AUSSEN, damit sie auch einen Fehler beim Auflösen des
// lazy-Chunks fängt; der `key` an ihr setzt die Fehlanzeige beim nächsten
// Seitenwechsel von selbst zurück. Der Fade-Knoten liegt INNEN, damit der
// Fallback selbst nicht mitfadet.
//
// ── DIE HÖHENRESERVIERUNG IST PANE-ABHÄNGIG, UND ZWAR GEMESSEN ──────────────
// In der Einzelansicht ist der Routen-Baum das Dokument: `min-h-screen`
// reserviert die Routenhöhe, damit der Ladeframe die Seite nicht auf eine Zeile
// kollabiert (§15/2, Herleitung stand bis 31.8.2026 in `App.tsx`). IM PANE ist
// `100vh` die falsche Zahl: die Pane-Spalte hat ihre Höhe bereits aus dem
// Flex-Layout (`flex-1 min-h-0` + `absolute inset-0`-Scrollfläche), eine
// Fenster-Höhe im Scroll-Container erzeugte nur eine Rollbalken-Blende, die
// nach dem Laden wieder verschwindet. Reserviert wird dort ein fester Block
// (24 rem) — genug, dass der Fallback den Inhalt nicht auf eine Zeile zieht,
// und ohne den Scroll-Container zu sprengen. Gewählt über `usePaneKlasse`
// (§5) statt über eine `imPane`-Verzweigung im Aufrufer.

/** Der eine Lade-Zustand einer Route: Ablesekante + ruhige Zeile
 *  (FAHRPLAN-DESIGN 5.3). Laden ist Aktivität, kein Fehler. */
function RouteLadeanzeige() {
  const pk = usePaneKlasse();
  return <Ladeanzeige text="Wird geladen …" className={`${pk('min-h-screen', 'min-h-[24rem]')} py-16`} />;
}

export function RouteHuelle({ schluessel, children }: {
  /** Identität der Route (Pfad OHNE Query): wechselt sie, faded der Inhalt neu
   *  ein UND die Fehlanzeige setzt sich zurück. Bewusst ohne `?…`: der
   *  Such-Parameter der Katalog-Seiten darf keinen Remount auslösen (App.tsx). */
  schluessel: string;
  children: ReactNode;
}) {
  return (
    <ErrorBoundary key={schluessel}>
      <Suspense fallback={<RouteLadeanzeige />}>
        {/* ── GB-1 (W2·24, Befund G1) · DIE REGISTERFARBE STEHT IN DER SEITE ──
            GEMESSEN 6./7.9.2026 (Gesamtprüfung §1, Zeile G1): ausserhalb von «/»
            trug im ERSTEN BILD fast nur noch der Reiter-Unterstrich Farbe —
            Erlass-Leser 2 Träger, /gesetze 3, «/» zum Vergleich 14; in 7 von 9
            Fällen war der einzige Träger `SPAN.absolute inset-x-0`, also die
            Arbeitsleiste, nicht die Seite. David 6.9.2026: «nicht trist».
            DIE FARBE WIRD HIER NICHT GEMALT, sondern nur ANGESAGT: die Hülle
            hängt das Register des Pfades als `data-reg` an, die Rezepte in
            `src/index.css` (§GB-1) lesen es. Ein Ort für die Ansage (§5) statt
            einer Farb-Prop an jedem Kopf, jedem Etikett, jedem Zähler — und
            jeder künftige Kopf-Baustein erbt sie, ohne davon zu wissen.
            Die Ableitung kommt aus der bestehenden SSoT `layout/bereiche`
            (`registerVonPfad`), nicht aus einer zweiten Tabelle. Kein Register
            (Start, Meta-Seiten) ⇒ kein Attribut ⇒ die Tinte bleibt Tinte;
            nie eine geratene Farbe (§8). */}
        <div key={schluessel} className="lc-route" data-reg={registerVonPfad(schluessel) ?? undefined}>{children}</div>
      </Suspense>
    </ErrorBoundary>
  );
}
