// ─── Hydrations-Pin: EIN Schalter für den ersten Render gegen fremdes HTML ───
//
// QS-BASIS (15.9.2026). Seit `main.tsx` die prerenderten App-Routen mit
// `hydrateRoot` startet, muss der ERSTE Client-Render denselben Baum ergeben
// wie der Prerender — sonst verwirft React 19 die Hydration und rendert die
// ganze Seite neu (der Rückfall ist sicher, aber er verschenkt genau den
// Gewinn). Der Prerender läuft in Node OHNE `localStorage`; jeder Zustand aus
// dem Browser-Speicher ist dort also LEER.
//
// perf-Bauregel 2 sagt, was daraus folgt: «Client-Initialstate auf den
// Server-Zustand pinnen, Abweichung erst per `useEffect`.» Dieser Schalter ist
// die eine Stelle, an der gefragt wird, ob das gerade nötig ist —
// keine zweite Routenliste, kein `typeof window`-Zweig in der Darstellung.
//
// GEMESSEN, warum es ihn braucht (Preview aus `dist`, Chromium, 64 markierte
// Routen, je frischer Browser-Kontext):
//   · leerer Speicher            → 64/64 hydrieren fehlerfrei
//   · EIN offener Reiter im
//     Speicher (Wiederkehrer)    → 64/64 Mismatch, weil die Reiterleiste ihn
//                                  beim ersten Render schon zeichnete
// Mit Pin ist auch der zweite Fall sauber (Beleg im PR).
//
// LEBENSDAUER: gesetzt von `main.tsx` VOR dem ersten Render, gelöst im ersten
// `useEffect` des Lesers (`components/layout/useTabs`). Ein SPÄTERER Mount —
// etwa eine Pane, die der Nutzer aufzieht — liest damit wieder den echten
// Speicher und zeigt nichts eine Runde lang leer.
// Im Prerender/SSR (`renderToString`, `scripts/prerender.ts`) wird er NIE
// gesetzt; dort gilt unverändert der Speicher-Lesepfad (in Node = leer, in den
// SSR-Tests der geseedete Stand).
let aktiv = false;

/** Der Einstieg entscheidet sich für `hydrateRoot` (main.tsx). */
export function hydrationsPinSetzen(): void {
  aktiv = true;
}

/** Läuft der erste Client-Render gerade gegen prerendertes HTML? */
export function hydrationsPin(): boolean {
  return aktiv;
}

/** Nach dem ersten Commit gelöst — ab hier zählt wieder der echte Speicher. */
export function hydrationsPinLoesen(): void {
  aktiv = false;
}
