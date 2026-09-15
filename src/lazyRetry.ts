import { createElement, lazy, useState, type ComponentType } from 'react';

// Lazy-Import mit Wiederholung. Ein dynamischer import() einer Routen-Seite kann
// scheitern, (a) transient (Netzwerk-Blip, Dev-Server unter Last) oder (b) weil
// nach einem Deploy der Chunk-Hash wechselte und ein noch offener Tab auf einen
// nicht mehr existierenden Chunk zeigt. Ohne Auffang landet das in der
// ErrorBoundary → beim Seitenwechsel erscheint eine Fehlermeldung, erst ein
// manuelles Neuladen hilft. Hier: einige Male still neu versuchen; hält das
// Scheitern an, ist es fast immer ein veralteter Chunk → EINMAL automatisch neu
// laden (per sessionStorage gegen eine Endlosschleife abgesichert, beim ersten
// Erfolg zurückgesetzt). Reine Ladelogik (CLAUDE.md §3/§6.4) — kein Inhalt,
// keine Reihenfolge der Rechtslogik betroffen.
//
// ─── QS-BASIS-NACHZUG (15.9.2026): synchroner Modul-Cache ──────────────────
//
// `React.lazy` SUSPENDIERT auch dann, wenn das Modul längst geladen ist: der
// erste Render ruft den Loader, bekommt ein — bereits erfülltes — Versprechen
// und wirft es trotzdem; der Inhalt kommt erst im Nachlauf (die Auflösung
// fällt in einen Microtask). Für ein Kontextmenü kostet das eine spürbare
// Verzögerung (gemessen 13.9.2026, Herleitung in
// `components/layout/Reiterleiste.tsx`); bei der HYDRATION kostet es den
// prerenderten DOM: React kann einen suspendierten Teilbaum nicht übernehmen,
// es erzeugt ihn neu. GEMESSEN auf `/` am 15.9.2026: 101 von 449 prerenderten
// Knoten überlebten — alles hinter der `<Suspense>`-Grenze von `RouteHuelle`
// (der ganze Routen-Inhalt inklusive der `<h1>`) wurde ersetzt. Sichtbare
// Folge: `e2e/d39-begruessung.e2e.ts` mass an einem abgehängten Knoten
// (`getComputedStyle` liefert dort leere Zeichenketten) und war 5/5 rot.
//
// DIE ANTWORT ist dieselbe wie bei der Reiterleiste, nur allgemein: das
// Loader-Ergebnis wird gemerkt, und wer die Komponente mountet, NACHDEM das
// Modul da ist, rendert sie direkt — ohne `lazy`, ohne Suspense, im selben
// Commit. `main.tsx` ruft dafür vor `hydrateRoot` `vorwaermen()` der aktuellen
// Route auf. Ist das Modul noch nicht da, bleibt alles wie bisher (lazy +
// Suspense + Ladeanzeige); das Code-Splitting je Seite ist unberührt (§6.4 —
// jeder Eintrag bleibt ein eigener statischer `import()`), der Entry-Chunk
// wächst nicht.
const RELOAD_FLAG = 'lex-chunk-reload';

function schlummer(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** Der bisherige Ladeweg, Zeile für Zeile unverändert: bis zu drei Versuche,
 *  danach EINMAL automatisch neu laden (veralteter Chunk nach einem Deploy). */
async function hartnaeckigLaden<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): Promise<{ default: T }> {
  for (let versuch = 0; versuch < 3; versuch++) {
    try {
      const mod = await factory();
      try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* SSR/Prerender: kein sessionStorage */ }
      return mod;
    } catch (err) {
      if (versuch < 2) { await schlummer(250 * (versuch + 1)); continue; }
      // Mehrfach gescheitert → wahrscheinlich veralteter Chunk nach Deploy.
      try {
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
          // Der Reload übernimmt normalerweise die Anzeige, bevor dieser Timeout
          // greift. Falls der Reload NICHT durchkommt (beforeunload-Abbruch,
          // bfcache-Eigenheit), nicht ewig im Suspense-Fallback hängen, sondern
          // nach kurzer Frist den Fehler an die ErrorBoundary werfen.
          return await new Promise<{ default: T }>((_, reject) => setTimeout(() => reject(err), 4000));
        }
      } catch { /* sessionStorage nicht verfügbar → unten werfen */ }
      throw err;
    }
  }
  // unerreichbar, aber TS braucht einen Rückgabewert
  throw new Error('lazyRetry: unerreichbar');
}

/** Eine code-gesplittete Seite, die sich vorwärmen lässt. Routen-Seiten nehmen
 *  keine Props (der Baum in `RouteSwitch` rendert sie als `<Comp />`), darum
 *  bleibt der Typ hier bewusst prop-los statt generisch. */
export type VorwaermbareKomponente = ComponentType & {
  /** Den Chunk JETZT anfordern (höchstens einmal je Seitenleben). Ist das
   *  Versprechen erfüllt, rendert jeder danach BEGINNENDE Mount synchron. */
  vorwaermen: () => Promise<unknown>;
};

export function lazyRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): VorwaermbareKomponente {
  // Modul-Cache: EINE Ladung je Seitenleben, geteilt von `lazy` und `vorwaermen`.
  let geladen: { default: T } | undefined;
  let vorlauf: Promise<{ default: T }> | undefined;

  const laden = (): Promise<{ default: T }> => (vorlauf ??= hartnaeckigLaden(factory)
    .then((mod) => { geladen = mod; return mod; }));

  // Scheitert der Ladeweg endgültig, bleibt `vorlauf` ein abgelehntes
  // Versprechen — genau wie bisher, denn `React.lazy` merkt sich eine Ablehnung
  // ebenfalls und versucht es bei einem erneuten Mount nicht noch einmal.
  // Kein Verhaltensunterschied, nur eine Ebene tiefer gemerkt.
  const Lazy = lazy(laden);

  /** Die Entscheidung «synchron oder über Suspense» fällt EINMAL beim Mount und
   *  steht dann für dessen Lebensdauer. Fiele sie bei jedem Render neu, wechselte
   *  der Element-Typ an dieser Stelle in dem Moment, in dem ein lazy begonnener
   *  Mount fertig geladen ist — React bräche den Teilbaum ab und baute ihn neu
   *  auf und verlöre dabei allen Zustand der Seite (§1: ein halb ausgefülltes
   *  Formular ist Nutzerarbeit, kein Renderdetail). */
  const Seite = () => {
    const [synchron] = useState(() => geladen);
    return createElement((synchron?.default ?? Lazy) as ComponentType);
  };
  return Object.assign(Seite, { vorwaermen: laden });
}
