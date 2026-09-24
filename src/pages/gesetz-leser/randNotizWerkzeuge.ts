// ═══ W2·24-R6 · «RECHNEN» IN DER RANDNOTIZ ══════════════════════════════════
//
// Das Referenzbild (`abnahme/design-identitaet/vorschlag-freigegeben.html`,
// Seite «Gesetzesleser») nennt vier Rubriken am Rand: Entscheide · Materialien ·
// Verweise · Rechnen. R4 hat zwei davon gebaut (Entscheide, Verweise) und die
// beiden anderen ausdrücklich offengelassen, weil sie im Panel aus SHARDS
// kommen und der Artikel sie nicht führt (ein zweiter Ladepfad ⇒ TABU).
//
// FÜR «RECHNEN» GILT DAS NICHT, und darum steht diese Datei hier: die
// Norm↔Werkzeug-Kanten (`ARTIKEL_WERKZEUGE`, `lib/normtext/werkzeuge.ts`) sind
// eine STATISCHE, belegte Tabelle im Bundle — kein Fetch, kein Shard, kein
// Netzweg. Die Rubrik kostet damit nichts ausser der Suche in einer Liste, die
// je Erlass zweistellig kurz ist (OR: 22 Kanten).
//
// KEINE ZWEITE WAHRHEIT (§5): die Zuordnung «Artikelnummer → Werkzeuge» ist
// dieselbe, die die Panels (`v3/PanelAnwendung.tsx`, `KontextPanel.tsx`) über
// `artikelWerkzeugGruppen` (lib/normtext/werkzeuge.ts) bilden — Hauptnummer aus
// dem Token, dann die erste Kante, deren Bereich sie enthält. (Der frühere
// Zweitleser `useArtikelKontext` fiel 23.9.2026 ohne Aufrufer weg, W2·29-WERKBANK-EXPORTE.)
// [Ergänzt 24.9.2026, Nachzug #1016 (S6-D6): seit die Kanten exakte Suffix-
// Grenzen tragen, gilt nicht mehr die Hauptnummer, sondern `trifftArtikel`
// (dieselbe Datei) — 324 trifft «Art. 324a–324b» nicht, 8a trifft «Art. 8a».
// Regressionsfall: src/tests/randnotiz-werkzeuge-suffix.test.ts.]
//
// WARUM EIN CACHE: `artikelWerkzeugGruppen` filtert und sortiert die ganze
// Kantentabelle. Der Leser fragt EINMAL JE ARTIKEL — im OR also 1686-mal für
// denselben Erlass. Der Cache macht daraus einen Lauf; er ist rein
// (Eingabe = Erlass-Key, Tabelle ist eine Konstante) und darum über die
// Lebensdauer des Dokuments gültig.

import { artikelWerkzeugGruppen, trifftArtikel, type ArtikelWerkzeugGruppe, type Werkzeug } from '../../lib/normtext/werkzeuge';

const gruppenCache = new Map<string, ArtikelWerkzeugGruppe[]>();

/**
 * Die Werkzeuge, die dieser Artikel trägt — leer, wenn keine Kante greift.
 *
 * @param erlassKey Register-Key des Erlasses («OR»); ohne ihn gibt es nichts.
 * @param token     Anker-Token des Artikels («336_c»).
 */
export function werkzeugeAmArtikel(erlassKey: string | undefined | null, token: string): readonly Werkzeug[] {
  if (!erlassKey) return [];
  let gruppen = gruppenCache.get(erlassKey);
  if (!gruppen) { gruppen = artikelWerkzeugGruppen(erlassKey); gruppenCache.set(erlassKey, gruppen); }
  if (gruppen.length === 0) return [];
  return gruppen.find((g) => trifftArtikel(g, token))?.werkzeuge ?? [];
}
