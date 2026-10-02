// Ziffer-Fragment (Form A, Entscheid David 2.10.2026, W2·27-BUND-FERTIG E2).
//
// Fedlex kennt unterhalb des Artikels keinen Anker; die Ziffer-Ebene (#1251, `Block.ziffer`)
// ist darum unsere eigene Adresse: ein SUFFIX am bestehenden Artikel-Anker.
//
//     /gesetze/bund/BV#art-197-ziff-12        Artikel-Token «197», Ziffer «12»
//     /gesetze/bund/StGB#art-187-ziff-1bis    Ziffer mit lat. Suffix
//     /gesetze/bund/OR#art-1_a-ziff-2         Token mit «_» wie bisher (`1_a`)
//
// KODIERUNG (Entscheid, im Bericht begründet): der Ziffer-Token ist `Block.ziffer` WORTGLEICH.
// Das Feld ist am Extraktor auf `\d+[a-z]*` (+ «_» für Sammel-Ziffern) beschränkt — im Korpus
// 19 verschiedene Werte («1»…«16», «1bis», «1_2», «2_3»), nie ein Punkt, nie ein Sonderzeichen.
// Eine mehrstufige Ziffer «1.1» gibt es als `ziffer` nicht (das ist der Anhang-Token `1.1`, ein
// ARTIKEL-Token); sie würde hier nicht kodiert, sondern als Ziffer nicht verankert (`istAnkerZiffer`).
// Der Trenner «-ziff-» ist kollisionsfrei: kein Artikel-Token des Korpus enthält ihn (Wächter:
// `src/tests/ziffer-anker.test.ts`, liest alle Bund-/Kanton-Snapshots), und die Zerlegung nimmt
// das LETZTE «-ziff-». Sammel-Ziffer «2_3» trägt das DOM unter `…-ziff-2_3`; die Einzelziffern
// «2» und «3» finden sie über `data-ziffer` (`zifferTeile`, dieselbe Auflösung wie «Art. 140 Ziff. 3»).
// Gross/Klein ist egal (`markeNorm`).

import type { NormSnapshot } from './typen';
import { markeNorm, zifferTeile } from './passusZiel';

type Block = NormSnapshot['bloecke'][number];

/** Trenner zwischen Artikel-Token und Ziffer im Anker (`art-<token>-ziff-<ziffer>`). */
export const ZIFFER_TRENNER = '-ziff-';

const ANKER_ZIFFER = /^[A-Za-z0-9_]+$/;
const ANKER_RE = /^(.+)-ziff-([A-Za-z0-9_]+)$/i;

/** Verankerbar ist nur, was in einer id und einem Attribut-Selektor ohne Kodierung steht. */
export const istAnkerZiffer = (ziffer: string): boolean => ANKER_ZIFFER.test(ziffer);

/**
 * Der Anker-Token (ohne «art-») eines Artikels mit optionaler Ziffer:
 * `("197", "12")` → `"197-ziff-12"`, `("197", null)` → `"197"`. Eine nicht verankerbare
 * Ziffer fällt auf den Artikel zurück (§8: lieber der Artikel als ein falscher Anker).
 */
export function zifferAnkerToken(artikel: string, ziffer?: string | null): string {
  return ziffer != null && istAnkerZiffer(ziffer) ? `${artikel}${ZIFFER_TRENNER}${ziffer}` : artikel;
}

/**
 * Zerlegt einen (bereits dekodierten) Anker-Token in Artikel-Token und Ziffer.
 * MUSS vor jeder Abbildung auf die Artikel-Token des Erlasses (`kanonischerAnkerToken`,
 * `artIndex`) laufen — «197-ziff-12» ist kein Artikel-Token (früherer Bug bei `#art-1a`:
 * ein Anker, der gegen die Token-Liste nichts trifft, öffnet nichts).
 * Ohne Suffix: `{ artikel: roh, ziffer: null }`, der Aufrufer verhält sich wie bisher.
 */
export function zerlegeZifferAnker(roh: string): { artikel: string; ziffer: string | null } {
  const m = ANKER_RE.exec(roh);
  return m ? { artikel: m[1], ziffer: m[2] } : { artikel: roh, ziffer: null };
}

/** DOM-Attribute des ersten Blocks einer Ziffer: die id (der Anker) und `data-ziffer` (die Einzelziffern). */
export interface ZifferAnkerAttr { id: string; 'data-ziffer': string }

/**
 * Die Anker-Attribute des ERSTEN Blocks jeder Ziffer, sonst `undefined` (Index = Block-Index im
 * Snapshot). Der erste Block ist bei Überschrift-Ziffern (BV 196/197, ParlG 173) die
 * Ziffer-Überschrift, bei Absatz-Ziffern (StGB …) der Absatz mit «N.». Eindeutig je Seite: ein
 * Artikel-Token kommt einmal vor, eine Ziffer einmal je Artikel.
 */
export function zifferAnkerAttribute(artikel: string, bloecke: readonly Block[]): (ZifferAnkerAttr | undefined)[] {
  const gesehen = new Set<string>();
  return bloecke.map((b) => {
    if (b.ziffer == null || !istAnkerZiffer(b.ziffer) || gesehen.has(b.ziffer)) return undefined;
    gesehen.add(b.ziffer);
    return { id: `art-${zifferAnkerToken(artikel, b.ziffer)}`, 'data-ziffer': zifferDatenWert(b.ziffer) };
  });
}

/** `data-ziffer`-Wert eines Ziffer-Blocks: die Einzelziffern, leerzeichengetrennt («2_3» → «2 3»). */
const zifferDatenWert = (ziffer: string): string => zifferTeile(ziffer).join(' ');

/** Normalform einer gesuchten Ziffer für `[data-ziffer~=…]`; `null` = nicht verankerbar. */
export function zifferSuchWert(ziffer: string): string | null {
  const n = markeNorm(ziffer);
  return n !== '' && istAnkerZiffer(n) ? n : null;
}
