/**
 * Soll-Werte für korpusrelative Tests (QS-KORPUS, 25.9.2026, Einheit P).
 *
 * Wozu: Tests und e2e pinnten feste Korpuszahlen der Rechtsprechung («117»,
 * «weitere 16», «bge 1647») und rissen bei jedem Korpus-Zuwachs — jeder
 * Wochen-PR wäre rot, obwohl keine Aussage falsch wurde (Messbericht
 * urteils-automatik 25.9.2026, Teil A §1). Seither leiten sie den Soll-Wert aus
 * dem ausgelieferten Shard ab und prüfen dazu eine Invariante.
 *
 * Bewusst OHNE `src/lib/**` gerechnet — direkt auf dem rohen JSON. Die Tests,
 * die diese Helfer nutzen, prüfen `bezuegeFuerArtikel`, `klassenImShard`,
 * `waehleBezuege`, den Zeitfilter und die Zähler-Anzeige; ein Soll-Wert aus
 * derselben Funktion prüfte nur sich selbst.
 */
import { readFileSync } from 'node:fs';

interface RohKante { key: string }
interface RohKopf { datum: string; facetten: { status: string; kanton: string } }
export interface RohShard {
  proArtikel: Record<string, RohKante[]>;
  dokumente: Record<string, RohKopf>;
  gesamtProArtikel: Record<string, Record<string, number>>;
}

/** Der Shard eines Erlasses, wie er ausgeliefert wird (Pfad relativ zur Repo-Wurzel). */
export function rohShard(erlass: string): RohShard {
  return JSON.parse(readFileSync(`public/rechtsprechung/bezuege/${erlass}.json`, 'utf8')) as RohShard;
}

/** Kanten an EINEM Artikel mit Status (und optional Kanton), in Shard-Reihenfolge. */
export function sollKanten(
  s: RohShard, token: string, status: string, kanton?: string,
): Array<{ key: string; datum: string }> {
  const aus: Array<{ key: string; datum: string }> = [];
  for (const { key } of s.proArtikel[token] ?? []) {
    const kopf = s.dokumente[key];
    if (kopf?.facetten.status !== status) continue;
    if (kanton !== undefined && kopf.facetten.kanton !== kanton) continue;
    aus.push({ key, datum: kopf.datum });
  }
  return aus;
}

/** Je Klasse über den ganzen Shard: Kanten (Fundstellen) und verschiedene Entscheide. */
export function sollKlassen(s: RohShard): Record<string, { dokumente: number; kanten: number }> {
  const paare = Object.values(s.proArtikel).flat()
    .map((k) => [s.dokumente[k.key]?.facetten.status, k.key] as const)
    .filter((p): p is readonly [string, string] => p[0] !== undefined);
  const aus: Record<string, { dokumente: number; kanten: number }> = {};
  for (const status of new Set(paare.map((p) => p[0]))) {
    const keys = paare.filter((p) => p[0] === status).map((p) => p[1]);
    aus[status] = { dokumente: new Set(keys).size, kanten: keys.length };
  }
  return aus;
}

/**
 * Wie viele Daten im Fenster [von, bis] liegen (Grenzen inklusive, '' = offen).
 *
 * Nur für JAHRESgrenzen (von = JJJJ-01-01, bis = JJJJ-12-31): dort fällt der
 * Tagesvergleich mit dem Jahresvergleich zusammen, den die App für BGE mit
 * Bandjahr-Datum (JJJJ-01-01) anwendet — der Helfer muss die Präzisions-Regel
 * also nicht nachbauen. Ein Datum ohne ISO-Form bricht ab, statt still gezählt
 * zu werden: die App behielte es in jedem Fenster (§8), das hier nicht modelliert ist.
 */
export function sollImFenster(daten: readonly string[], von: string, bis: string): number {
  if (von !== '' && !/^\d{4}-01-01$/.test(von)) throw new Error(`von «${von}» ist keine Jahresgrenze`);
  if (bis !== '' && !/^\d{4}-12-31$/.test(bis)) throw new Error(`bis «${bis}» ist keine Jahresgrenze`);
  const kaputt = daten.filter((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d));
  if (kaputt.length > 0) throw new Error(`Datum ohne ISO-Form: ${kaputt.join(', ')}`);
  return daten.filter((d) => (von === '' || d >= von) && (bis === '' || d <= bis)).length;
}

/** Schweizer Tausendertrennung, wie sie der Leser zeigt («4'140»). */
export const tsd = (n: number): string => n.toLocaleString('de-CH');

/** Dieselbe Zeichenkette, wie sie im SSR-Markup steht (React maskiert «'»). */
export const imMarkup = (t: string): string => t.replace(/'/g, '&#x27;');
