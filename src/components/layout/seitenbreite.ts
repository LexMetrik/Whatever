import { matchPath, parsePath } from 'react-router-dom';

// ─── Breitenstufe je Seitenart (W2·31-BILDSCHIRMBREITE B1a, 25.9.2026) ───────
//
// Die Inhaltsbreite stand bis hier fünfmal hart als `max-w-content` in der
// Hülle (Shell-Hauptspalte, Shell-Mehrfenster, Pane, Footer ×2). Sie wird jetzt
// an EINER Stelle je Seitenart deklariert (`SEITENBREITE`); die Rahmen lesen
// ihre Klasse aus `rahmenbreiteKlasse`. Ein späterer Posten (B2–B12) schaltet
// eine Seitenart auf `weit`, indem er NUR ihre Zeile in der Tabelle ändert.
// B1a ist verhaltensneutral: alle Arten stehen auf `content`, die gerenderten
// Klassen sind byte-gleich zu vorher (Beweis im Commit, dist-Diff).
//
// `weit` (90rem, `tailwind.config.js`) ist nur für Raster und Tabellen gedacht,
// nie für Fliesstext — Herleitung dort. Reines Daten-/Funktionsmodul, kein JSX.

export type Breitenstufe = 'content' | 'weit';

export type Seitenart =
  | 'startseite' | 'rubrik' | 'rechner' | 'vorlage'
  | 'gesetze' | 'gesetz-leser' | 'rechtsprechung' | 'entscheid-leser'
  | 'materialien' | 'materialien-deckung' | 'material-leser'
  | 'info' | 'methodik' | 'abdeckung' | 'einstellungen' | 'suche' | 'fehlerseite';

/** Die EINE Deklaration. `beispielPfad`: eine prerenderte Route der Art, die
 *  auf sich selbst zurückklassifiziert (Unit-Test) und die der e2e-Breiten-
 *  wächter (B1c) je Art misst. Leser-Schlüssel aus `public/*\/register.json`. */
export const SEITENBREITE: Readonly<Record<Seitenart, { stufe: Breitenstufe; beispielPfad: string }>> = {
  startseite: { stufe: 'weit', beispielPfad: '/' }, // W2·31 (25.9.2026): Kachelspalte, Blätter, «Häufig gebraucht»
  rubrik: { stufe: 'content', beispielPfad: '/rechner' },
  rechner: { stufe: 'weit', beispielPfad: '/rechner/kuendigung' }, // B3 (25.9.2026): Eingabe ‖ Ergebnis
  vorlage: { stufe: 'content', beispielPfad: '/vorlagen/testament' },
  gesetze: { stufe: 'weit', beispielPfad: '/gesetze' }, // B4 (25.9.2026): Erlass-Register (Titel-Spur)
  'gesetz-leser': { stufe: 'content', beispielPfad: '/gesetze/bund/OR' },
  rechtsprechung: { stufe: 'weit', beispielPfad: '/rechtsprechung' },
  'entscheid-leser': { stufe: 'content', beispielPfad: '/rechtsprechung/bge_152_V_122' },
  materialien: { stufe: 'weit', beispielPfad: '/materialien' }, // B2 (25.9.2026): Karten-Raster
  'materialien-deckung': { stufe: 'weit', beispielPfad: '/materialien/deckung' }, // B2: Deckungstabelle
  'material-leser': { stufe: 'content', beispielPfad: '/materialien/ESTV-KS-DBG-5A' },
  info: { stufe: 'content', beispielPfad: '/ueber' },
  methodik: { stufe: 'content', beispielPfad: '/methodik' },
  abdeckung: { stufe: 'content', beispielPfad: '/abdeckung' },
  einstellungen: { stufe: 'content', beispielPfad: '/einstellungen' },
  suche: { stufe: 'content', beispielPfad: '/suche' },
  fehlerseite: { stufe: 'content', beispielPfad: '/gibt-es-nicht' },
};

/** Routenmuster → Seitenart. Die Muster stehen WÖRTLICH wie in
 *  `src/RouteSwitch.tsx`; der Unit-Test `seitenbreite.test.ts` verlangt für
 *  jede dortige Route einen Eintrag hier, damit keine neue Route still auf ein
 *  dynamisches Muster oder die Fehlerseite fällt. Erster Treffer gewinnt —
 *  darum stehen feste Pfade vor ihren `:param`-Geschwistern.
 *  Karten-Routen (ROUTEN_MANIFEST) fängt `/rechner/:slug` bzw. `/vorlagen/:slug`;
 *  Letzteres ist im Router kein eigenes Muster: ein unbekanntes
 *  `/vorlagen/<x>` zeigt dort die Fehlerseite, hier aber die Breite `vorlage`
 *  (bewusst, rein kosmetisch — der Router allein weiss, welche Karte existiert).
 *  Weiterleitungen tragen die Art ihres Ziels: sie rendern nur `<Navigate>`. */
const MUSTER: ReadonlyArray<readonly [string, Seitenart]> = [
  ['/', 'startseite'],
  ['/rechner', 'rubrik'],
  ['/vorlagen', 'rubrik'],
  ['/rechner/fristenspiegel', 'rechner'], // Weiterleitung auf einen Rechner
  ['/rechner/:slug', 'rechner'],
  ['/vorlagen/:slug', 'vorlage'],
  ['/gesetze', 'gesetze'],
  ['/gesetze/:ebene', 'gesetze'], // Weiterleitung auf /gesetze?ebene=…
  ['/gesetze/:ebene/:key', 'gesetz-leser'],
  ['/rechtsprechung', 'rechtsprechung'],
  ['/rechtsprechung/:key', 'entscheid-leser'],
  ['/materialien', 'materialien'],
  ['/materialien/deckung', 'materialien-deckung'],
  ['/materialien/:key', 'material-leser'],
  ['/methodik', 'methodik'],
  ['/ueber', 'info'],
  ['/kontakt', 'info'],
  ['/datenschutz', 'info'],
  ['/einstellungen', 'einstellungen'],
  ['/abdeckung', 'abdeckung'],
  ['/suche', 'suche'],
  ['/recherche', 'rubrik'], // Weiterleitung auf /rechner
  ['/pro', 'startseite'], // Alt-Routen → «/»
  ['/fachpersonen', 'startseite'],
  ['/international', 'gesetze'], // Weiterleitung auf /gesetze?ebene=international
];

/** Die deklarierten Muster (nur für den Deckungs-Test). */
export const SEITENART_MUSTER: readonly string[] = MUSTER.map(([m]) => m);

/** Seitenart eines Pfads (Query/Hash werden ignoriert). Kein Muster = der
 *  Catch-all `*` des Routers = `fehlerseite`. */
export function seitenartVon(pfad: string): Seitenart {
  const pathname = parsePath(pfad).pathname || '/';
  for (const [muster, art] of MUSTER) if (matchPath(muster, pathname)) return art;
  return 'fehlerseite';
}

/** Rahmenklasse der Inhaltsspalte. Die Strings stehen als vollständige
 *  Literale hier, weil Tailwind `src/**\/*.ts` nach Klassen durchsucht.
 *  `fenster`: Einzelfenster (Shell-Hauptspalte, Kopf, Footer) — `weit` greift
 *  erst ab `2xl` (1536 px Viewport). `pane`: ein Split-Pane ist selbst der
 *  Rahmen (`@container/pane`); dieselbe Schwelle 96rem (= `2xl`) wird darum
 *  am Pane gemessen, nicht am Viewport — das Muster der A-2-WURZEL in
 *  `Pane.tsx` (Polsterung am Container statt am Fenster). */
const KLASSE: Readonly<Record<Breitenstufe, { fenster: string; pane: string }>> = {
  content: { fenster: 'max-w-content', pane: 'max-w-content' },
  weit: { fenster: 'max-w-content 2xl:max-w-weit', pane: 'max-w-content @[96rem]/pane:max-w-weit' },
};

export function rahmenbreiteKlasse(pfad: string, ort: 'fenster' | 'pane'): string {
  return KLASSE[SEITENBREITE[seitenartVon(pfad)].stufe][ort];
}
