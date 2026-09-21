// ═══ W2·28-TREFFER-LANDKARTE · L-1 · DIE MASSE DES STREIFENS ════════════════
//
// Die Zahlen, aus denen der Streifen gezeichnet wird, und die eine Rechnung,
// die aus einer anteiligen Lage eine gezeichnete Höhe macht. Reine Zahlen,
// kein React, kein DOM — aber DARSTELLUNGSSCHICHT, nicht Rechenkern: sie
// sprechen in SVG-Koordinaten-Einheiten und in Pixeln. Der Rechenkern
// (`./landkarteModell`) kennt davon nichts und soll es nicht kennen (§3).
//
// ── WARUM EINE EIGENE DATEI (21.9.2026) ─────────────────────────────────────
// Die Masse standen bis zum Deckel-Nachzug in `./TrefferLandkarte.tsx`. Sie
// mussten heraus, als `markenHoehe` für sein Tor
// (`src/tests/leser-landkarte-w228.test.ts`, Block «B4») exportierbar werden
// musste: eine `.tsx`-Datei, die neben ihrer Komponente eine Funktion
// exportiert, bricht Fast Refresh, und `react-refresh/only-export-components`
// meldet das als FEHLER (gemessen `npx eslint .`, Exit 1). Der Lint-Hinweis
// nennt denselben Weg, der hier gegangen ist: «Use a new file to share
// constants or functions between components».

/**
 * Breite des Streifens in PIXELN — zugleich der Klickstreifen und die x-Achse
 * des SVG-Koordinatensystems. (Der Kommentar hier sagte bis zum Fertigbau
 * 21.9.2026 fälschlich «rem»; gemeint und gebaut waren immer px, `style.width`
 * setzt sie als solche.)
 *
 * 48 px = die Untergrenze des Richtwerts 48–64 px aus
 * `fahrplaene/FAHRPLAN-RECHERCHE-KOMFORT.md` §1/L-1. Sie kostet die Lesespalte
 * gemessen nichts: der Streifen ist `fixed` und liegt mit `right-3` (12 px) in
 * der 104 px breiten Randluft ab 1280 px Fensterbreite — 60 px belegt, 44 px
 * frei. Breiter zu werden hiesse, Platz zu verbrauchen, den die Landkarte für
 * drei Marken-Stufen nicht braucht (`markenBreite`).
 */
export const BREITE = 48;
/** Höhe des SVG-Koordinatensystems. Der Streifen wird auf die Elementhöhe
 *  gezogen (`preserveAspectRatio="none"`), die Zahl ist reine Rechenauflösung. */
export const HOEHE = 1000;
/** Mindesthöhe einer Marke in Koordinaten-Einheiten (≈ 2.5 px bei 600 px Höhe).
 *  Ohne sie verschwände ein kurzer Artikel in einem langen Erlass. */
export const MARKE_MIN = 4;
/**
 * HÖCHSTHÖHE einer Marke in Koordinaten-Einheiten (≈ 8 px bei 664 px Streifen).
 *
 * ── ANLASS: DER STREIFEN WAR IM ENTSCHEID EINE FLÄCHE (Messung 21.9.2026) ───
 * Bis hierher war die Markenhöhe allein der ANTEIL ihres Bausteins am Dokument
 * (`(bis - von) * HOEHE`), nach oben unbegrenzt. Im GESETZ fällt das nicht auf:
 * beim OR ist ein Baustein einer von 1686 Artikeln, gemessen auf
 * `/gesetze/bund/OR` mit «Kündigung» sind alle 88 Marken 2.8–3.2 px hoch —
 * der Anteil liegt unter `MARKE_MIN`, die Untergrenze trägt sie alle.
 * Im ENTSCHEID ist ein Baustein eine ganze ERWÄGUNG. Gemessen auf
 * `/rechtsprechung/bge_152_V_52` mit «Beschwerde»: 7 Marken von 40.4 bis
 * 123.5 px, zusammen 495 px lückenlos aneinander in einem 664 px hohen
 * Streifen — 74.5 % der Spur ein durchgehender roter Block, in dem keine
 * einzelne Fundstelle mehr zu unterscheiden war. Das verletzt zweierlei:
 * `.claude/rules/design.md`, Handschrift 4 («Registerfarbe als Strich/Kante/
 * Marke, NIE Fläche») und den Zweck des Streifens selbst
 * (`fahrplaene/FAHRPLAN-RECHERCHE-KOMFORT.md` §1: «dicht behandelt oder nur
 * gestreift ist ohne Scrollen erkennbar») — ein Vollblock sagt nur «überall».
 *
 * ── WARUM EIN DECKEL UND NICHT EIN ZWEITER DATENPFAD ────────────────────────
 * Die Zusicherung «eine Marke je getroffenem Baustein» (§5,
 * `src/tests/leser-landkarte-w228.test.ts`) bleibt unangetastet: es wird keine
 * Marke zusammengefasst, weggelassen oder neu gezählt. Geändert ist allein die
 * GEZEICHNETE Höhe — und damit genau das, was der Befund betraf. Die LAGE
 * (`y = von * HOEHE`) bleibt unverändert der Anfang des Bausteins, also die
 * Stelle, an die der Klick auf den Streifen auch wirklich springt: eine Marke,
 * die woanders sässe als ihr Sprungziel, zeigte auf einen Ort, den man von ihr
 * aus nicht erreicht.
 *
 * ── WARUM 12 ────────────────────────────────────────────────────────────────
 * 12 Einheiten sind ≈ 8 px auf dem gemessenen 664-px-Streifen. Das ist halb so
 * hoch wie die SCHMALSTE Marke breit ist (16 px bei einer Fundstelle) und ein
 * Viertel der breitesten (36 px) — sie liest sich als Strich, nicht als
 * Kästchen. Die sieben Marken des Entscheids belegen damit 56 px statt 495 px
 * (8.4 % statt 74.5 %), und ihr kleinster Abstand wächst von 0 auf 35 px.
 * Nach unten bleibt `MARKE_MIN`; dazwischen bildet die Höhe weiterhin den
 * Umfang ab. Der Gesetz-Leser ist unberührt — dort greift der Deckel nie.
 *
 * Dicht beieinander liegende Treffer bleiben «dicht»: der Deckel kann eine
 * Marke nur SCHRUMPFEN, nie verschieben. Wo viele kurze Bausteine hintereinander
 * getroffen sind (OR, Art. 266/266a/266b liegen 0.2–0.5 px auseinander), stehen
 * ihre Marken unverändert Kante an Kante und lesen sich als Ballung.
 */
const MARKE_MAX = 12;
/** Seitliche Einfassung der Marken — die Kanten des Streifens bleiben sichtbar. */
export const MARKE_X = 6;

/**
 * Gezeichnete Höhe einer Marke: ihr Anteil am Dokument, geklemmt zwischen
 * `MARKE_MIN` (sichtbar bleiben) und `MARKE_MAX` (Marke bleiben).
 *
 * Die Klemmung ist eine ZEICHEN-Regel und steht darum hier und nicht in
 * `./landkarteModell` (§3: der Rechenkern kennt kein SVG und keine
 * Koordinaten-Einheiten). Sie ist zugleich rein und deterministisch (§2) und
 * damit ohne Browser prüfbar — das nutzt das Tor
 * `src/tests/leser-landkarte-w228.test.ts`, Block «B4».
 */
export function markenHoehe(von: number, bis: number): number {
  return Math.min(MARKE_MAX, Math.max(MARKE_MIN, (bis - von) * HOEHE));
}

/** Wie breit eine Marke gerät: drei Stufen nach Dichte (§8: die Stufe ist
 *  benannt, nicht stufenlos interpoliert — «viel» und «wenig» soll man
 *  unterscheiden können, nicht schätzen müssen). */
export function markenBreite(anzahl: number): number {
  const voll = BREITE - 2 * MARKE_X;
  if (anzahl >= 5) return voll;
  if (anzahl >= 2) return voll * 0.7;
  return voll * 0.45;
}

