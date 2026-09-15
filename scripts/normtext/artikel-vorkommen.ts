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

// ── W2·27 (15.9.2026, Gegenprüfung PR #890): amtlicher Anker des N-ten Vorkommens ──
//
// Befund: bei doppelter id schrieb der Generator als quelleUrl-Fragment den
// BASIS-Anker «#art_126_z» — das ist der Anker des ERSTEN Vorkommens, denn
// Browser lösen ein doppeltes `id` immer auf das erste Element auf. Der Leser
// landete also beim Artikel «Anlagebeschränkungen» statt bei «Wesentliche
// Mängel». Fedlex legt aber VOR jeden Artikel-Kopf einen eigenen amtlichen
// Namens-Anker <a name="…"></a>; beim 2. Vorkommen trägt er einen anderen Namen
// als beim 1. (KKV: «a126z» vs. «ta126z») und ist damit kollisionsfrei nutzbar.
//
// Empirie (Sweep über alle 269 gepinnten Fedlex-HTML-Caches, 15.9.2026):
// 25 880 <article> — ausnahmslos ALLE tragen vor ihrem Kopf-<h…> genau so einen
// <a name="…">. Doppelte ids mit N ≥ 2 gibt es zwei (KKV art_126_z → «ta126z»;
// b.html art_10 → «ta10», eine Botschaft ausserhalb des Korpus); in beiden
// Fällen ist der Name im Dokument eindeutig. Im gebauten Korpus existiert heute
// genau EIN «__N»-Token: KKV 126_z__2.
//
// Regel eng gehalten (§7 «nichts fabrizieren»): genutzt wird der Name nur, wenn
// er im ganzen Dokument genau einmal als name="…" und NIE als id="…" vorkommt —
// sonst schlüge die Fragment-Auflösung wieder auf ein fremdes Element um. Greift
// die Regel nicht, bleibt es beim Basis-Anker (= Verhalten vor diesem Fix, mit
// der bekannten Unschärfe «springt aufs erste Vorkommen», §8).

/** Erster amtlicher <a name="…"> VOR dem Kopf-<h…> im rohen <article>-Inhalt. */
export function namensAnkerVorKopf(artikelRoh: string): string | null {
  const kopf = artikelRoh.search(/<h[1-6]\b/i);
  const vorKopf = kopf === -1 ? artikelRoh : artikelRoh.slice(0, kopf);
  const m = vorKopf.match(/<a\s[^>]*\bname="([^"]+)"/i);
  return m ? m[1] : null;
}

/** Fragment-tauglich = genau 1× als name="…" und 0× als id="…" im Dokument. */
export function istFragmentEindeutig(html: string, fragment: string): boolean {
  const esc = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const zaehle = (attr: string) =>
    [...html.matchAll(new RegExp(`\\s${attr}="${esc}"`, 'gi'))].length;
  return zaehle('name') === 1 && zaehle('id') === 0;
}

/**
 * Anker-Fragment für die quelleUrl. Ohne Synthese-Suffix «__N» (Normalfall)
 * unverändert `ankerRoh` — byte-gleich zum Verhalten davor. Mit «__N» der
 * amtliche Namens-Anker des N-ten Vorkommens, sofern eindeutig; sonst der
 * Basis-Anker.
 */
export function amtlicherAnker(html: string, ankerRoh: string): string {
  const basisAnker = ankerRoh.replace(/__\d+$/, '');
  if (basisAnker === ankerRoh) return basisAnker;
  const artikelRoh = artikelRohHtml(html, ankerRoh);
  if (artikelRoh === null) return basisAnker;
  const name = namensAnkerVorKopf(artikelRoh);
  if (name === null || !istFragmentEindeutig(html, name)) return basisAnker;
  return name;
}
