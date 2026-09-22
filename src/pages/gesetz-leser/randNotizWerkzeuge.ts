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
// dieselbe, die `useArtikelKontext` (artikelKontext.ts) für das Panel bildet —
// Hauptnummer aus dem Token, dann die erste Kante, deren Bereich sie enthält.
// Sie steht hier nur EINMAL formuliert und wird von beiden gelesen.
//
// WARUM EIN CACHE: `artikelWerkzeugGruppen` filtert und sortiert die ganze
// Kantentabelle. Der Leser fragt EINMAL JE ARTIKEL — im OR also 1686-mal für
// denselben Erlass. Der Cache macht daraus einen Lauf; er ist rein
// (Eingabe = Erlass-Key, Tabelle ist eine Konstante) und darum über die
// Lebensdauer des Dokuments gültig.

import { artikelWerkzeugGruppen, type ArtikelWerkzeugGruppe, type Werkzeug } from '../../lib/normtext/werkzeuge';

const gruppenCache = new Map<string, ArtikelWerkzeugGruppe[]>();

/**
 * Haupt-Artikelnummer aus dem Anker-Token («336_c» → 336, «1» → 1).
 *
 * Wortgleich zur Ableitung in `artikelKontext.ts`; Sub-Artikel fallen auf ihre
 * Hauptnummer, weil die Kantentabelle so definiert ist (dort dokumentiert).
 */
function hauptNummer(token: string): number | null {
  const m = /^(\d+)/.exec(token);
  return m ? Number(m[1]) : null;
}

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
  const nr = hauptNummer(token);
  if (nr === null) return [];
  return gruppen.find((g) => nr >= g.von && nr <= g.bis)?.werkzeuge ?? [];
}
