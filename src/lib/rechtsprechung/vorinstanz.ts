// ─── Vorinstanz im Rubrum: Nominativ statt Genitiv (U-03) ───────────────────────────
//
// Das Rubrum eines BGE nennt die Vorinstanz im Satz «Beschwerde gegen den Entscheid DES
// Appellationsgerichts des Kantons Basel-Stadt, …». Die Extraktion schneidet nur die Floskel
// «den Entscheid des» ab, der Genitiv des ersten Worts blieb stehen («Appellationsgerichts des
// Kantons Basel-Stadt, Dreiergericht, vom 24. September 2020»). Das Feld «Vorinstanz» ist aber
// ein Name im Nominativ («Appellationsgericht des Kantons Basel-Stadt, …»).
//
// Nur das KOPFWORT der Behörde steht im Genitiv; was dahinter folgt («des Kantons …», «Abteilung
// I», «Beschwerdekammer des Bundesstrafgerichts» mit nominativem Kopfwort «Beschwerdekammer») bleibt.
// Darum ein enges Muster: Kopfwort (ggf. mit Adjektiv) auf -gerichts/-rats/-amts/-departements.
// Alles andere — fr./it. Namen, Datums- oder Satzreste, andere Köpfe — bleibt zeichengleich (§7,
// nichts raten). Rein, deterministisch, idempotent (§2).

/** Optionales Adjektiv (Genitiv) + Kopfwort; das Kopfwort wird unten auf die Endung geprüft. */
const KOPF = /^((?:(?:Kantonalen|Interkantonalen|Eidgenössischen|Grossen|Kleinen)\s+)?)(\p{Lu}[\p{L}-]*)(?=[\s,]|$)/u;
/** Genitiv-Endung → Geschlecht (steuert das Adjektiv: Neutrum «-es», Maskulinum «-er»). */
const ENDUNG = /(gerichts|departements|amts|rats)$/i;
const MASKULIN = /rats$/i;

export function vorinstanzNominativ(roh: string): string {
  // Silbentrennung im Kopfwort («Bundesverwaltungs- gerichts vom …»): zusammenziehen.
  let t = roh.replace(/^((?:\p{Lu}[\p{L}]*\s+)?\p{Lu}[\p{L}]*)- ([a-zäöü])/u, '$1$2');
  // Quell-Tippfehler «Versicherungsgerichtsdes Kantons …» (Leerzeichen fehlt).
  t = t.replace(/^(\p{Lu}[\p{L}-]*gerichts)(des|der)(?=\s)/u, '$1 $2');
  const m = KOPF.exec(t);
  if (!m || !ENDUNG.test(m[2])) return t;
  const [ganz, adj, wort] = m;
  const adjektiv = adj.trim() ? `${adj.trim().replace(/en$/, MASKULIN.test(wort) ? 'er' : 'es')} ` : '';
  return adjektiv + wort.slice(0, -1) + t.slice(ganz.length);   // -gerichts → -gericht, -rats → -rat …
}
