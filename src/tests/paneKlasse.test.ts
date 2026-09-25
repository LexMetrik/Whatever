// Split-View B-1: paneKlasse ist die Verhaltensneutralitäts-Garantie. Bei
// imPane=false MUSS die zeichengleiche Viewport-Klasse zurückkommen — sonst
// driftet der Default-/Prerender-Pfad vom heutigen Verhalten ab (Golden-Bruch,
// Layout-Verschiebung). Die drei realen pane-fähigen Layout-Strings sind hier
// gepinnt: ändert ein Bau-Schritt sie versehentlich auf der Default-Seite,
// schlägt dieser Test an.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { paneKlasse } from '../components/layout/PaneKontext';

// Die heutigen (Viewport-)Layout-Klassen der paneKlasse-fähigen Stellen.
// (gesetz-leser nutzt KEINE paneKlasse-Grid-Umschaltung, sondern schaltet im Pane
//  per imPane-Toggle auf einspaltig+Drawer — daher hier nicht aufgeführt.)
const VIEWPORT = {
  rechtsprechung: 'lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-6',
  schnellrechner: 'grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start',
  schnellrechnerDivider: 'space-y-2 lg:border-l lg:border-line lg:pl-5',
} as const;

// Die Container-Query-Pendants (im Pane aktiv).
const CONTAINER = {
  rechtsprechung: '@3xl/pane:grid @3xl/pane:grid-cols-[14rem_minmax(0,1fr)] @3xl/pane:gap-6',
  schnellrechner: 'grid gap-5 @3xl/pane:grid-cols-[18rem_minmax(0,1fr)] @3xl/pane:items-start',
  schnellrechnerDivider: 'space-y-2 @3xl/pane:border-l @3xl/pane:border-line @3xl/pane:pl-5',
} as const;

describe('paneKlasse — Verhaltensneutralität des Default-Pfads', () => {
  it('gibt bei imPane=false ZEICHENGLEICH die Viewport-Klasse zurück', () => {
    for (const k of Object.keys(VIEWPORT) as (keyof typeof VIEWPORT)[]) {
      expect(paneKlasse(false, VIEWPORT[k], CONTAINER[k])).toBe(VIEWPORT[k]);
    }
  });

  it('gibt bei imPane=true die Container-Query-Klasse zurück', () => {
    for (const k of Object.keys(VIEWPORT) as (keyof typeof VIEWPORT)[]) {
      expect(paneKlasse(true, VIEWPORT[k], CONTAINER[k])).toBe(CONTAINER[k]);
    }
  });
});

// ═══ A-2-WURZEL · der Pane-Wrapper misst die Pane, nicht das Fenster ════════
//
// R2-A (31.8.2026, FAHRPLAN-DESIGN-KONSISTENZ §3 «Runde-2-Liste»): der
// Inhalts-Wrapper in `layout/Pane.tsx` polsterte mit `px-5 sm:px-6` — einer
// VIEWPORT-Klasse, mitten in einem `@container/pane`. Ein schmales Pane auf
// breitem Bildschirm bekam damit die weite Polsterung, ein breites Pane auf
// schmalem Gerät die enge. Aus genau dieser Wurzel sind die zwei deklarierten
// `sm:`-Ausnahmen des EntscheidLesers gewachsen (`entscheid-leser-b2.test.ts`,
// `AUSNAHMEN`): seine klebende Leiste zieht mit `-mx-…/px-…` an DIESELBE Kante.
//
// DIE SCHWELLE IST TEIL DER ZUSAGE, nicht Geschmack: `@xl/pane` ist die
// Haus-Abbildung von `sm:` (A-1/`ui/SeitenTitel`, gepinnt in `PAAR` derselben
// Sonde). Stünde hier eine andere Zahl, hätten Wrapper und klebende Leiste zwei
// Massstäbe für eine Kante — schlimmer als der alte Zustand.
describe('A-2-Wurzel — die Polsterung des Pane-Wrappers hängt an der Pane', () => {
  const PANE = readFileSync('src/components/layout/Pane.tsx', 'utf8');
  // W2·31-BILDSCHIRMBREITE B1a (25.9.2026): die Breite des Wrappers ist nicht
  // mehr das Literal `max-w-content`, sondern kommt aus der Seitenart-Tabelle
  // (`rahmenbreiteKlasse(loc, 'pane')`, `layout/seitenbreite.ts`; dass sie in
  // B1a für jede Art `max-w-content` liefert, pinnt `seitenbreite.test.ts`).
  // Der Anker folgt darum dem neuen Quelltext; die Zusage dieser Sonde — die
  // POLSTERUNG hängt an der Pane — ist unverändert.
  const WRAPPER = /<div className=\{`mx-auto w-full \$\{rahmenbreiteKlasse\(loc, 'pane'\)\} ([^`]*)py-6`\}>/;

  it('POSITIV-SONDE: der Wrapper steht überhaupt noch da', () => {
    expect(PANE).toMatch(WRAPPER);
    // …und er sitzt in einem Container — sonst greift jede @-Klasse ins Leere.
    expect(PANE).toContain('@container/pane');
  });

  it('polstert über die Container-Query, nicht über einen Viewport-Breakpoint', () => {
    const polsterung = PANE.match(WRAPPER)![1];
    expect(polsterung, 'Viewport-Breakpoint im Pane-Wrapper (Vorzustand: `px-5 sm:px-6`)')
      .not.toMatch(/\b(?:sm|md|lg|xl|2xl):/);
    expect(polsterung).toContain('@xl/pane:px-6');
  });

  it('NEGATIV-KONTROLLE: der Ausdruck findet den Vorzustand', () => {
    const vorher = "<div className={`mx-auto w-full ${rahmenbreiteKlasse(loc, 'pane')} px-5 sm:px-6 py-6`}>";
    expect(vorher.match(WRAPPER)![1]).toMatch(/\b(?:sm|md|lg|xl|2xl):/);
  });
});
