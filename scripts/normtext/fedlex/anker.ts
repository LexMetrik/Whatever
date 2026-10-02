/**
 * Fedlex-Extraktor — Artikel-/Schlussteil-Anker und Token-Ableitung (Blatt-Modul). Split aus
 * `extrahiere-fedlex.ts`, W2·27-BUND-FERTIG PR 0, 2.10.2026. Code und Kommentare unverändert
 * verschoben.
 */

/**
 * Extrahiert alle Artikel-Token aus einem Fedlex-Filestore-HTML in HTML-Reihenfolge.
 *
 * Matcht: id="art_<TOKEN>" wobei TOKEN mit einer Ziffer beginnt (strukturelle
 * Nicht-Artikel-Anker wie «art_SchlusstitelUebergang» werden ausgeschlossen).
 *
 * M9/G7: Ein wiederholtes Token wird NICHT mehr verworfen (sonst ginge der zweite
 * Artikel stumm verloren, §8) — das N-te Vorkommen erhält einen Synthese-Suffix
 * «__2»/«__3». extrahiereArtikel löst diesen Suffix wieder auf das N-te Vorkommen
 * des Basis-Tokens auf. Reihenfolge wie im HTML.
 *
 * @param html - Volltext des Fedlex-Filestore-HTML
 * @returns Array der Token-Strings, z.B. ['1','2','335_c','126_z','126_z__2']
 */
export function alleArtikelTokens(html: string): string[] {
  const re = /id="art_(\d[\w]*)"/g;
  const anzahl = new Map<string, number>();
  const tokens: string[] = [];
  for (const m of html.matchAll(re)) {
    const basis = m[1];
    const n = (anzahl.get(basis) ?? 0) + 1;
    anzahl.set(basis, n);
    tokens.push(n === 1 ? basis : `${basis}__${n}`);
  }
  return tokens;
}

/**
 * M13 — Schlusstitel-/Übergangs-/Schlussbestimmungs-Artikel.
 *
 * Fedlex legt neu-nummerierte Schluss-Divisionen («Schlusstitel:
 * Anwendungs- und Einführungsbestimmungen» beim ZGB, «Schlussbestimmungen der
 * Änderung vom …», «Übergangsbestimmungen …») unter einem EIGENEN Anker-Schema
 * ab: `<article id="disp_uN/art_*">` (gewickelt in `<div id="dispositions">`,
 * ausserhalb von `<main>`). Diese Artikel beginnen MIT EIGENER Nummerierung neu
 * (Art. 1, 2 …) und kollidieren so mit dem Haupttext (art_1). alleArtikelTokens
 * (digit-only, Präfix `art_`) erfasst sie nicht → bis M13 fielen sie stumm weg
 * (ZGB: 178 Artikel, OR: 83, PatG/SchKG/SVG: 14).
 *
 * Liefert die VOLLEN Anker (`disp_u1/art_1`) in HTML-Reihenfolge. Doppelte Anker
 * erhalten — wie alleArtikelTokens — einen Synthese-Suffix «__2»/«__3»
 * (extrahiereArtikelAusAnker löst ihn auf). Der Generator/Struktur-Pfad bildet
 * daraus über ankerZuToken ein dateiweit EINDEUTIGES Token (`disp_u1_art_1`),
 * das nicht mit dem Haupttext-Token «1» kollidiert.
 *
 * @returns z.B. ['disp_u1/art_1','disp_u1/art_6_b_bis','disp_u2/art_178', …]
 */
export function alleSchlussteilAnker(html: string): string[] {
  // Fedlex nutzt ZWEI disp-Varianten: «disp_u1/art_…» (Normalfall) UND «disp_1/art_…»
  // OHNE «u» (z.B. VZG-Schlussbestimmungen art_135/136). Beide erfassen («u?»).
  const re = /<article[^>]*\sid="(disp_u?\d+\/art_\w+)"/gi;
  const anzahl = new Map<string, number>();
  const anker: string[] = [];
  for (const m of html.matchAll(re)) {
    const basis = m[1];
    const n = (anzahl.get(basis) ?? 0) + 1;
    anzahl.set(basis, n);
    anker.push(n === 1 ? basis : `${basis}__${n}`);
  }
  return anker;
}

/**
 * Bildet aus einem vollen Anker das dateiweit eindeutige, DOM-/URL-sichere Token
 * (= Wert des Snapshot-Felds `artikel`, zugleich Struktur-Sidecar-Schlüssel).
 * Beide Erzeuger — der Snapshot-Generator UND der Struktur-Extraktor — MÜSSEN
 * dieselbe Ableitung verwenden, sonst bricht der Sidecar-Join (gliederung/
 * marginalie fänden den Schlusstitel-Artikel nicht).
 *
 *   'art_335_c'        → '335_c'          (Haupttext, byte-gleich zu bisher)
 *   'disp_u1/art_1'    → 'disp_u1_art_1'  (Schlusstitel: «/» → «_», kollisionsfrei)
 *   'disp_u1/art_1__2' → 'disp_u1_art_1__2'
 */
export function ankerZuToken(anker: string): string {
  return anker.startsWith('art_') ? anker.slice(4) : anker.replace(/\//g, '_');
}

/** Die reine Artikel-Nummer aus einem Schlussteil-Anker, für das Label.
 *  'disp_u1/art_6_b_bis' → '6_b_bis'; 'disp_u1/art_31_32__2' → '31_32'. */
export function schlussteilLabelSuffix(anker: string): string {
  return anker.replace(/__\d+$/, '').replace(/^.*\/art_/, '');
}
