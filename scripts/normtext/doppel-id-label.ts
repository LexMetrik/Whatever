// ── W2·27 (15.9.2026): amtliches Label bei DOPPELTER Fedlex-«art_*»-id ───────
//
// Fedlex vergibt vereinzelt zwei <article> dieselbe id. Der Extraktor
// (extrahiere-fedlex.ts, alleArtikelTokens/alleSchlussteilAnker) hängt dem
// 2./3. Vorkommen darum einen Synthese-Suffix «__2»/«__3» an — ein EIGENER,
// amtlich nicht existierender Token. Bis W2·27 leitete der Snapshot-Generator
// das Label mechanisch aus dem Basis-Token ab; beide Artikel trugen dann
// dasselbe Label (Nebenfund Prüfer #851: KKV zeigte «Art. 126z» zweimal).
//
// §7-Beleg (gepinnter Cache /tmp/kkv.html, KKV SR 951.311, Konsolidierung
// 20251125): art_126_z steht zweimal, und das zweite Heading trägt das
// unterscheidende Ordinal SELBST:
//   1. Vorkommen: <b>Art. 126</b><i>z</i><i><sup></sup></i> <i><sup></sup></i>Anlagebeschränkungen …
//   2. Vorkommen: <b>Art. 126</b><i>z</i><sup></sup> <sup>tredecies</sup><sub></sub>Wesentliche Mängel
// Genau wie bei den Nachbarn art_126_z_bis … art_126_z_duodecies, deren id das
// Ordinal führt. Das Label ist also ABLEITBAR, nicht zu erfinden.
//
// Regel bewusst eng (§7 «nichts fabrizieren»): als Ordinal zählt nur ein <sup>
// im Artikel-Kopf, dessen Text nach Tag-Entfernung aus reinen Kleinbuchstaben
// (≥ 3) besteht — und es muss GENAU EINES übrig bleiben. Sonst bleibt das Label
// unverändert (Fallback = Verhalten vor W2·27).
//
// Empirie zur Regel (Sweep über alle 262 gepinnten Fedlex-HTML-Caches,
// 15.9.2026): in Artikel-Köpfen treten als reine Kleinbuchstaben-<sup>
// AUSSCHLIESSLICH die 12 Ordinalia bis · ter · quater · quinquies · sexies ·
// septies · octies · novies · decies · undecies · duodecies · tredecies auf —
// kein einziger Fehltreffer. Fussnoten-Marker sind <sup><a …>N</a></sup> und
// fallen über Ziffern/Tags heraus. Darum eine Form-Regel statt einer
// hartkodierten Wortliste: ein künftiges «quaterdecies» trägt sich selbst.

import { artikelRohHtml } from './artikel-vorkommen.ts';

/** Erstes Überschriften-Element (<h1>…<h6>) im rohen <article>-Inhalt. */
export function artikelKopfMarkup(artikelRoh: string): string | null {
  const m = artikelRoh.match(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/i);
  return m ? m[0] : null;
}

/**
 * Ordinal-Suffix («tredecies») aus dem Kopf-Markup — oder null, wenn der Kopf
 * keines oder mehrere unterscheidbare trägt (dann lieber kein Label-Eingriff).
 */
export function ordinalAusKopf(kopfMarkup: string): string | null {
  const treffer = new Set<string>();
  for (const m of kopfMarkup.matchAll(/<sup\b[^>]*>([\s\S]*?)<\/sup>/gi)) {
    // \u00a0 explizit: trim() entfernt das geschützte Leerzeichen nicht, ein
    // «tredecies\u00a0» fiele sonst durch die Kleinbuchstaben-Regel.
    const text = m[1].replace(/<[^>]+>/g, '').replace(/\u00a0/g, ' ').trim();
    if (/^[a-z]{3,}$/.test(text)) treffer.add(text);
  }
  return treffer.size === 1 ? [...treffer][0] : null;
}

/**
 * Label des N-ten Vorkommens einer doppelten id: Basis-Label + amtliches
 * Ordinal aus dem Kopf. null = nicht ableitbar → Aufrufer behält sein Label.
 *
 * @param artikelRoh  Roh-HTML des <article>-Elements (artikelRohHtml()).
 * @param basisLabel  Label aus dem Basis-Token, z. B. «Art. 126z».
 */
export function doppelIdLabel(artikelRoh: string | null, basisLabel: string): string | null {
  if (!artikelRoh) return null;
  const kopf = artikelKopfMarkup(artikelRoh);
  if (kopf === null) return null;
  const ordinal = ordinalAusKopf(kopf);
  return ordinal === null ? null : `${basisLabel}${ordinal}`;
}

/**
 * Amtliches Label zu `ankerRoh` für den Snapshot-Generator: bei Synthese-Suffix
 * «__N» aus dem Heading des N-ten Vorkommens, sonst — und wenn dort kein
 * Ordinal ableitbar ist — unverändert `basisLabel`. Der Suffix bleibt in
 * `id`/`artikel` (dort ist er der Schlüssel), nur das Label wird amtlich.
 */
export function labelFuerAnker(html: string, ankerRoh: string, basisLabel: string): string {
  if (!/__\d+$/.test(ankerRoh)) return basisLabel;
  return doppelIdLabel(artikelRohHtml(html, ankerRoh), basisLabel) ?? basisLabel;
}
