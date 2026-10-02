/**
 * Fedlex-Extraktor — Tag-/Fussnoten-Strip (Blatt-Modul, Split aus `extrahiere-fedlex.ts`,
 * W2·27-BUND-FERTIG PR 0, 2.10.2026). Code und Kommentare unverändert verschoben.
 */
import { dekodiereEntities } from '../html-entities.ts';

/**
 * Entfernt Fussnoten-Marker <sup><a …>NNN</a></sup> aus einem HTML-Fragment,
 * SAMT der Ziffer (sonst leakt «337» o.ä. in den Normtext). Robust gegen
 * Whitespace/&nbsp;/<inl>-Wrapper zwischen <sup> und <a> (Fedlex emittiert das
 * vereinzelt). Absatznummern-<sup> (nacktes <sup>N</sup> OHNE <a>) bleiben
 * unberührt — die werden separat als absatz erkannt.
 */
export function entferneFussnotenSups(html: string): string {
  return html.replace(
    /<sup\b[^>]*>(?:\s|&nbsp;|<\/?inl>)*<a\b[\s\S]*?<\/a>(?:\s|&nbsp;|<\/?inl>)*<\/sup>/gi,
    '',
  );
}

// Inline-Formatierungs-Tags rendern im Fliesstext OHNE Wortabstand
// (HTML setzt <i>/<sup>/<b>/<a> inline, ohne Leerzeichen). Sie werden darum
// beim Strippen durch '' ersetzt; Block-/Umbruch-Tags (<br>, <p>, <td>, …)
// trennen visuell → ' ', damit keine Wörter verkleben.
const INLINE_STRIP_TAGS = new Set([
  'i', 'b', 'em', 'strong', 'sup', 'sub', 'span', 'a', 'inl',
  'abbr', 'cite', 'u', 's', 'small', 'q', 'var', 'mark', 'wbr',
]);

/**
 * Entfernt alle HTML-Tags, dekodiert HTML-Entities (via dekodiereEntities)
 * und normalisiert Whitespace.
 *
 * N1-Fix (Bündel N, 1.7.2026): Inline-Formatierungs-Tags werden OHNE Leerzeichen
 * entfernt — die Quelle setzt den Artikelnummer-Buchstaben/das lat. Suffix inline
 * direkt an die Ziffer («329<i>g</i>», «1<sup>bis</sup>»); ein Leerzeichen an der
 * Tag-Grenze war UNSER Artefakt («329 g»). Kein blindes Zahl-Leer-Buchstabe-
 * Muster: echte «1 a)»-Aufzählungen tragen das Leerzeichen in der Quelle und
 * bleiben unangetastet (§1/§2). Block-/Umbruch-Tags trennen weiterhin mit ' '.
 * Fussnoten-Nummern in <sup><a>…</a></sup> sind an ALLEN Aufrufstellen schon vor
 * entferneTags getilgt (entferneFussnotenSups) — hier bleibt kein Marker, der
 * durch das leerzeichenlose Strippen in den Text leaken könnte.
 */
// Fedlex-Template-Platzhalter «<span data-message="…">[tab]</span>» (Abstandshalter
// in Tabellen/Formularen, z.B. SSV Anhang 1) als GANZES Element entfernen — sonst
// bliebe der literale «[tab]»-Text stehen. EINE Quelle für ALLE Strip-Pfade (entferne-
// Tags UND Marken-Extraktion), damit «marke-los» überall gleich beurteilt wird (sonst
// Dublette: Notiz + Item aus demselben <dt>[tab]</dt>) (Bündel Bilder&Formeln, 1.7.2026).
const TAB_PLATZHALTER = /<span\b[^>]*\bdata-message="[^"]*"[^>]*>\s*\[[a-z]+\]\s*<\/span>/gi;

// SVG-/Style-Leak-Strip (Backlog PR #150, W2·5b): Fedlex bettet Piktogramme im
// SSV-Signalkatalog als INLINE-<svg> ein; deren <style>-Blöcke tragen CSS-Text
// («.cls-1 { fill: #010101; }»). Der reine Tag-Strip unten entfernt nur die
// <style>/<svg>-TAGS, nicht den CSS-TEXT dazwischen → er leckte als sichtbarer
// Quelltext in den Normtext. <style>/<script>-Elemente tragen NIE sichtbaren
// Dokumenttext, darum GANZ (inkl. Inhalt) entfernen, bevor gestrippt wird.
const NICHT_TEXT_ELEMENTE = /<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi;

export function entferneTags(s: string): string {
  return dekodiereEntities(
    s
      .replace(NICHT_TEXT_ELEMENTE, '')
      .replace(TAB_PLATZHALTER, '')
      // Reine Ziffern-<sup>/<sub> (Exponent «m²», typografischer Bruch «133¹⁄₃»,
      // Absatz-Hochzahl «72³» im BV-Register, Tabellen-Fussnote «47/50¹») tragen
      // eine Bedeutung, die beim leerzeichenlosen Verkleben an eine Nachbarziffer
      // eine IRREFÜHRENDE grössere Zahl erzeugt («1331/3», «723»). Sie behalten
      // darum den trennenden Abstand (bisheriges Verhalten) — §1: nie zwei Ziffern
      // stillschweigend zu einer Zahl zusammenführen. NUR Buchstaben-Suffixe
      // (bis/ter/g …) und sonstige Inline-Formatierung werden verklebt (N1-Fix).
      .replace(
        /<sup\b[^>]*>\s*(\d[\d\s]*)\s*<\/sup>|<sub\b[^>]*>\s*(\d[\d\s]*)\s*<\/sub>/gi,
        (_m, a, b) => ` ${(a ?? b).trim()} `,
      )
      .replace(/<[^>]+>/g, (tag) => {
        // NAMENSRAUM MITLESEN (Befund QS-KORPUS 4.9.2026): Fedlex streut leere
        // Konversions-Marker der legi4ch-XSLT-/Word-Kette ein —
        // «<tmp:inl md="E" …></tmp:inl>», «<w:smartTag …>» — und zwar MITTEN IM
        // WORT. Der frühere Namens-Match `[a-zA-Z][a-zA-Z0-9]*` brach am
        // Doppelpunkt ab und lieferte «tmp» statt «tmp:inl»; «tmp» steht in
        // keiner Inline-Liste, also wurde der Marker durch ein LEERZEICHEN
        // ersetzt und zerriss den Text: «Zwischen produkten», «Erfah rung»,
        // «GMP-Kon trollsysteme», «werden ;» (AMBV Art. 6/11/12/14/21, §1).
        // HTML kennt keine Elemente mit Namensraum-Präfix — ein Tag mit ':' im
        // Namen ist ausnahmslos ein Rest der Konversion, nie ein Block-/Umbruch-
        // Element, das visuell trennt. Darum: Name mit ':' = inline (spurlos).
        // Messung über den gepinnten Filestore-Cache (229 Bund-HTMLs, 4.9.2026):
        // exakt vier solche Namen, alle inline — tmp:inl (680), w:smartTag (64),
        // w:moveFromRangeStart/-End (je 2).
        const name = tag.match(/^<\/?\s*([a-zA-Z][a-zA-Z0-9]*(?::[a-zA-Z0-9_.-]+)?)/);
        if (!name) return ' ';
        const n = name[1].toLowerCase();
        return n.includes(':') || INLINE_STRIP_TAGS.has(n) ? '' : ' ';
      }),
  )
    .replace(/\s+/g, ' ')
    .trim();
}
