// ─── Hervorhebungs-Stellen für Suchtreffer (LM-187, W2·17-UI-BEFUNDE B18) ────
//
// Wo im angezeigten Text darf ein `<mark>` stehen? Genau dort, wo die SUCHE
// selbst getroffen hat — nicht irgendwo, wo die Buchstabenfolge zufällig
// vorkommt. Bis 5.9.2026 baute `SuchResultate.markiere()` ein eigenes
// Alternativ-Muster aus den Query-Wörtern («Wörter ab 2 Zeichen, regex-escaped,
// case-insensitiv») OHNE Wortanfangs-Anker. Der Index arbeitet aber mit
// FlexSearch `tokenize: 'forward'` (Präfix AB WORTANFANG, s. das frühere
// artikelVolltext.ts `trifftWortgrenze` — Browser-Index entfallen 7.10.2026). Folge, am Prod-Stand
// reproduziert (5.9.2026, `/rechner/zpo-fristen`, «OR 257d»): der Marker lag auf
// «or» mitten in «S·or·gfalt», auf «miete» in «Ver·miete·r», auf «lohn» in
// «Jahres·lohn·es» — die Hervorhebung behauptete eine Treffer-Begründung, die
// die Suche nie hatte (§8: nicht mehr behaupten, als gedeckt ist).
//
// Diese Datei ist die EINE Stelle, die diese Frage beantwortet (§5). Sie baut
// die Semantik nicht nach, sondern verwendet die Bausteine der Suche:
//   · `sucherTerme(q).orig` — dieselbe Tokenisierung, mit der die Suche rangiert
//     (normalisiert, an Nicht-Alphanumerischem getrennt, ab 2 Zeichen).
//   · `normalisiereBegriff` — dieselbe Normalisierung (lowercase, NFKD,
//     Diakritika gestrippt), mit der Index-Haystack und Terme gebildet werden.
//   · dieselbe Wortgrenzen-Definition wie `trifftWortgrenze`: das Zeichen VOR
//     dem Treffer darf kein `[a-z0-9]` sein.
// Sie liegt bei der Suche und nicht in der Komponente, weil sie eine Aussage
// über Treffer-Semantik trifft, nicht über Darstellung (§3) — die Komponente
// entscheidet nur noch, WIE eine Stelle aussieht.
//
// BEWUSST NICHT hervorgehoben: die Vokabular-Synonyme (`sucherTerme().syn`).
// Sie tragen den RECALL (ein Artikel darf über «geburt» gefunden werden, wenn
// «vaterschaftsurlaub» getippt wurde), aber ein Marker auf einem Wort, das
// niemand getippt hat, liest sich als Tippfehler der Anwendung. Dieselbe
// Trennung zieht artikelRanking.ts für die topischen Treffer («Topische Treffer
// NUR aus der getippten Query; Synonyme tragen allein den Recall»).
//
// §2: rein und deterministisch — gleiche Eingabe, gleiche Ausgabe, kein
// Date.now(), keine Heuristik.

import { sucherTerme } from './artikelRanking';
import { normalisiereBegriff } from './vokabular';

/** Halboffene Spanne [start, ende) in ORIGINAL-Zeichen-Indizes des Anzeigetexts. */
export interface HervorhebungsStelle {
  start: number;
  ende: number;
}

/** Wortzeichen-Klasse — wörtlich dieselbe wie in `trifftWortgrenze`
 *  (früher artikelVolltext.ts, entfallen 7.10.2026): was davor steht, entscheidet
 *  über den Wortanfang. */
const WORTZEICHEN = /[a-z0-9]/;

/** Hüll-Zeichen für die zeichenweise Normalisierung (s. `normalisiereMitKarte`).
 *  Muss ein Zeichen sein, das `normalisiereBegriff` unverändert lässt und das
 *  kein Leerraum ist — sonst würde `.trim()` am Rand zuschlagen. */
const HUELLE = 'x';

/**
 * Normalisiert `text` ZEICHENWEISE und führt dabei eine Rückwärts-Karte mit:
 * `karte[i]` ist der Original-Index des Zeichens, aus dem das normalisierte
 * Zeichen `norm[i]` entstanden ist; `karte[norm.length]` ist `text.length`.
 *
 * Warum überhaupt eine Karte: `normalisiereBegriff` ist NICHT längentreu (NFKD
 * zerlegt «ü» in zwei Zeichen, das Diakritikum fällt weg; Ligaturen wie «ﬁ»
 * werden zu zwei Zeichen; `.trim()` kappt die Ränder). Ein im normalisierten
 * Text gefundener Index zeigt darum im Allgemeinen NICHT auf dieselbe Stelle im
 * Original — ohne Karte stünde der Marker verschoben.
 *
 * Warum die Hülle: `normalisiereBegriff` trimmt. Auf ein einzelnes Leerzeichen
 * angewandt gäbe es den leeren String zurück, die Wortgrenze verschwände und
 * «Sorgfalt und» würde zu «sorgfaltund» — «und» stünde plötzlich mitten im
 * Wort. Mit `x…x` kann `.trim()` nichts kappen; die beiden Hüllzeichen sind von
 * lowercase/NFKD/Strip unberührt und werden hinterher abgeschnitten. So bleibt
 * die SSoT-Funktion die einzige Wahrheit, statt ihre Schritte hier zu kopieren.
 */
function normalisiereMitKarte(text: string): { norm: string; karte: number[] } {
  const zeichen: string[] = [];
  const karte: number[] = [];
  let pos = 0;
  // Iteration nach CODEPUNKTEN (nicht Code-Units): Surrogatpaare bleiben ganz.
  for (const z of text) {
    // Schnellpfad für reines ASCII-Alphanumerisch (der Regelfall): lowercase
    // ist dort nachweislich das ganze Ergebnis — NFKD lässt diese Zeichen
    // unverändert, es gibt kein Diakritikum, und getrimmt wird nichts.
    // Bewiesen in `suche-markiere.test.ts` («zeichenweise Karte deckt sich mit
    // normalisiereBegriff über den ganzen Zeichenvorrat»).
    const n = /^[A-Za-z0-9]$/.test(z)
      ? z.toLowerCase()
      : entkleide(normalisiereBegriff(HUELLE + z + HUELLE));
    for (const c of n) {
      zeichen.push(c);
      karte.push(pos);
    }
    pos += z.length;
  }
  karte.push(text.length);
  return { norm: zeichen.join(''), karte };
}

function entkleide(mitHuelle: string): string {
  return mitHuelle.length >= 2 ? mitHuelle.slice(1, -1) : '';
}

/**
 * Liefert die Stellen in `text`, die als Suchtreffer hervorzuheben sind —
 * aufsteigend sortiert, überlappungsfrei (überlappende Terme werden zu einer
 * Spanne verschmolzen, damit kein `<mark>` in einem `<mark>` landet).
 *
 * Semantik: ein Term markiert genau dort, wo er im normalisierten Text an einem
 * WORTANFANG als Präfix steht — dieselbe Bedingung, unter der die Suche den
 * Kandidaten überhaupt behalten hat. Markiert wird der Präfix, nicht das ganze
 * Wort: «or» in «Ordnung» ist eine echte Treffer-Begründung, «Ordnung» als
 * Ganzes wäre mehr, als die Query hergibt.
 */
export function hervorhebungsStellen(text: string, q: string): HervorhebungsStelle[] {
  if (!text) return [];
  const { orig } = sucherTerme(q);
  if (orig.length === 0) return [];

  const { norm, karte } = normalisiereMitKarte(text);
  const roh: HervorhebungsStelle[] = [];
  for (const term of orig) {
    let i = norm.indexOf(term);
    while (i !== -1) {
      const davor = i === 0 ? '' : norm[i - 1];
      if (!WORTZEICHEN.test(davor)) {
        roh.push({ start: karte[i], ende: karte[i + term.length] });
      }
      i = norm.indexOf(term, i + 1);
    }
  }
  if (roh.length === 0) return [];

  roh.sort((a, b) => (a.start !== b.start ? a.start - b.start : a.ende - b.ende));
  const stellen: HervorhebungsStelle[] = [];
  for (const s of roh) {
    const letzte = stellen[stellen.length - 1];
    if (letzte && s.start <= letzte.ende) {
      if (s.ende > letzte.ende) letzte.ende = s.ende;
    } else if (s.ende > s.start) {
      stellen.push({ ...s });
    }
  }
  return stellen;
}
