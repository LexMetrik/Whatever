// ── Anker-Auflösung: welches <article> gehört zu welchem Token? ──────────────
//
// W2·27 (15.9.2026) aus extrahiere-fedlex.ts herausgezogen (§6.6: die Datei
// stand an ihrem Zeilen-Deckel; §5: die Auflösung soll EINE Wahrheit bleiben,
// nachdem neben dem Block-Parser nun auch die Label-Ableitung bei doppelter id
// (doppel-id-label.ts) denselben Artikel braucht). Inhaltlich unverändert
// übernommen — das Golden-Tor beweist die Verhaltensneutralität.

/**
 * Roh-Inhalt des <article id="…">-Elements zu `ankerRoh` — inkl. Kopf-<h6> und
 * Fussnoten-Apparat, ohne die <article>-Tags selbst. null = kein solcher Artikel.
 *
 * @param ankerRoh - Voller Anker, optional mit Synthese-Suffix «__2» (N-tes
 *                   Vorkommen bei doppelter id, s. alleArtikelTokens/alleSchlussteilAnker).
 */
export function artikelRohHtml(html: string, ankerRoh: string): string | null {
  // M9/G7: doppelte id. Ein Erlass kann ZWEI <article id="…"> mit identischem
  // Anker tragen (KKV art_126_z: «Anlagebeschränkungen» + «126z tredecies
  // Wesentliche Mängel»; betmg/vwvg/pavo: aufgehobene Bereichs-Artikel «15a–15c»).
  // alleArtikelTokens/alleSchlussteilAnker vergeben dem 2./3. Vorkommen einen
  // Synthese-Suffix «__2»/«__3»; hier extrahieren wir dann das N-te Vorkommen des
  // BASIS-Ankers. Ohne Suffix (Normalfall) = erstes Vorkommen, byte-gleich.
  const suffix = ankerRoh.match(/^(.*)__(\d+)$/);
  const basisAnker = suffix ? suffix[1] : ankerRoh;
  const nth = suffix ? Number(suffix[2]) : 1;
  // Escape des Ankers für die Regex (Unterstriche und «/» sind literal, kein
  // Sonderzeichen — der «/»-Trenner des disp-Schemas bleibt unberührt).
  const escapedToken = basisAnker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const articleRe = new RegExp(
    `<article[^>]*\\sid="${escapedToken}"[^>]*>([\\s\\S]*?)</article>`,
    'gi',
  );
  const treffer = [...html.matchAll(articleRe)];
  const articleMatch = treffer[nth - 1];
  return articleMatch ? articleMatch[1] : null;
}
