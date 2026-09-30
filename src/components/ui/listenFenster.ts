// ─── Sitzungs-Fenster für gedeckelte Listen (neutraler Ort) ──────────────────
//
// Herkunft: `components/rechtsprechung/zustand.ts` (W2·10-UI-NAV/J1). Seit
// W2·31 (P10b, 30.9.2026) hier, weil auch /materialien (MaterialRaster) das
// Fenster nutzt — eine Materialien-Fläche, die aus `rechtsprechung/` importiert,
// hielte die Schichten falsch herum. Verhaltensneutraler Umzug (§6): Code und
// Kommentar wörtlich, nichts umbenannt.
//
// SITZUNGSSCHLÜSSEL BLEIBEN BYTE-GLEICH: Das Präfix `rsp:deckel:` (rsp =
// Rechtsprechung) bleibt auch für /materialien (`rsp:deckel:materialien:<Behörde>`)
// und darf NICHT in «listen:deckel:» o. ä. umbenannt werden. sessionStorage
// überlebt den Deploy im offenen Tab; ein anderes Präfix verlöre jedem Nutzer
// beim Deploy sein aufgeklapptes Fenster (Rückweg Treffer → Detail → zurück
// stünde wieder auf dem Grunddeckel). Der Name ist ein Speicher-Vertrag, kein Zierrat.

// ── NAVIGATION: sessionStorage (Listen-Deckel je Liste) ─────────────────────
//
// W2·10-UI-NAV/J1. Die dritte Zustands-Klasse dieser Seite, und sie gehört
// bewusst WEDER in die URL NOCH in localStorage:
//
//   · Nicht in die URL: wie viele Batches jemand nachgeladen hat, ist kein
//     Bestandteil dessen, was er verschickt. Ein geteilter Link soll die
//     Treffermenge tragen, nicht die Scroll-Historie des Absenders.
//   · Nicht in localStorage: die Zahl gilt für DIESEN Besuch dieser Liste.
//     Wer morgen wiederkommt, will oben anfangen, nicht bei Eintrag 900.
//
// Zweck ist ausschliesslich die WIEDERHERSTELLBARKEIT des Rückwegs
// (Fahrplan-Prüfpunkt J1: «Treffer → Detail → zurück darf nicht brechen»).
// Ohne sie stimmt die Scroll-Position zwar noch, aber die Liste ist wieder auf
// den Grunddeckel geschrumpft — die gespeicherte Position liegt dann jenseits
// des Dokumentendes und die zentrale Wiederherstellung in App.tsx landet
// zwangsläufig zu weit oben. Der Deckel muss darum schon beim ERSTEN Render
// nach der Rückkehr stehen (lazy useState-Initialisierung), nicht erst in einem
// Effekt — sonst ist das Dokument im entscheidenden Frame noch zu kurz.
//
// Reine Render-Menge, kein Logikverlust (§15): der Deckel begrenzt, wie viele
// Einträge im DOM stehen, nie welche Entscheide es gibt. Zähler und Facetten
// laufen unverändert über den Gesamtbestand.

export const DECKEL_PRAEFIX = 'rsp:deckel:';

/** sessionStorage fehlt beim Prerender (und in abgeschotteten Kontexten). */
function liesSitzung(key: string): string | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(key);
  } catch { return null; }
}

/**
 * Sichtfenster einer Liste: die Einträge [von, bis) werden gerendert.
 *
 * WARUM EIN FENSTER UND KEIN BLOSSER DECKEL (Gegenprüfungs-Befund B2, 8.8.2026):
 * Ein von 0 gemessener Deckel muss beim Sprung auf den ältesten Jahrgang bis zu
 * dessen Index wachsen — bei 3'765 BS-Einträgen also ~3'800 Zeilen in EINEM
 * Render, genau der DOM-Umfang, den LISTE_DECKEL laut axe-Timeout-Lektion
 * verhindern soll (und Richtung 195k wäre der Pfad unhaltbar). Das Fenster
 * verschiebt sich stattdessen MIT: der Sprung setzt es auf die Batch-Grenze um
 * das Ziel, oberhalb führt ein «Frühere anzeigen»-Anker zurück. Damit rendert
 * KEIN einzelner Klick mehr als eine Batch-Breite nach.
 */
export interface Fenster {
  /** Index des ersten gerenderten Eintrags (0 = Listenanfang). */
  von: number;
  /** Index NACH dem letzten gerenderten Eintrag. */
  bis: number;
}

/**
 * Gespeichertes Fenster lesen und PLAUSIBILISIEREN. `grund` ist die Batch-
 * Breite, `maxSpanne` die harte Obergrenze der gerenderten Zeilen.
 *
 * Die Plausibilisierung ist kein Zierrat: sessionStorage ist vom Nutzer (und
 * von fremdem Skript auf derselben Herkunft) schreibbar. Ohne Schranke liesse
 * sich über einen präparierten Wert ein beliebig grosses DOM erzwingen — genau
 * die Last, gegen die das Fenster gebaut ist. Unplausibles fällt darum still
 * auf den Grundzustand zurück, statt teilweise übernommen zu werden.
 */
export function leseFenster(key: string, grund: number, maxSpanne: number): Fenster {
  const grundFenster: Fenster = { von: 0, bis: grund };
  const roh = liesSitzung(DECKEL_PRAEFIX + key);
  if (roh === null) return grundFenster;
  const teile = roh.split(':');
  if (teile.length !== 2) return grundFenster;
  const von = Number.parseInt(teile[0], 10);
  const bis = Number.parseInt(teile[1], 10);
  if (!Number.isSafeInteger(von) || !Number.isSafeInteger(bis)) return grundFenster;
  if (von < 0 || bis <= von) return grundFenster;
  if (bis - von > maxSpanne) return grundFenster;
  return { von, bis };
}

export function schreibeFenster(key: string, f: Fenster): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(DECKEL_PRAEFIX + key, `${f.von}:${f.bis}`);
  } catch { /* Speicher voll oder gesperrt — das Fenster ist dann nur nicht wiederherstellbar */ }
}
