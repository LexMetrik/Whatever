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

// ── Hoch-/Tiefstellungen als Unicode (W2·27-BUND-FERTIG P8, 3.10.2026) ──────────
//
// Fedlex setzt Exponenten, Indizes und Ladungen als <sup>/<sub> («m<sup>2</sup>»,
// «CO<sub>2</sub>», «NO<sub>3</sub><sup>–</sup>», «10<sup>-9</sup>»). Der Plain-Text-Normtext
// kennt kein Markup; bis P8 wurde die reine Ziffer mit Leerzeichen eingerahmt
// («m/s 2», «M 2 , M 3», «400 m 2») — irreführend: «m/s 2» ist nicht «m/s²» (§1) — und ein
// Vorzeichen im <sup> ging verloren («10-9» las sich als Subtraktion).
//
// Regel (eng, §7 «nichts raten»): Besteht der Inhalt NUR aus Ziffern und/oder einem
// Vorzeichen (+ − – -) und HÄNGT das Element unmittelbar an einem Buchstaben, einer Ziffer
// oder einer Klammer davor (Exponent/Index/Ladung/Tabellen-Fussnotenmarke), wird er in die
// typografisch entsprechenden Unicode-Zeichen (² ³ ₂ ₃ ⁻ …) gewandelt — ohne Leerzeichen-
// Einschub. Ebenso der Zähler eines Bruchs «<sup>2</sup>/<sub>3</sub>» («²/₃»).
// Alles andere bleibt, wie es war:
//   · LOSE Ziffern (am Textanfang, nach Leerraum oder nach Satzzeichen: Absatz-Labels in
//     Bereichen «3 und 4 Aufgehoben», «anwendbar. 3 Zuständig», Massenzahlen «68 Ga»)
//     behalten den trennenden Abstand;
//   · ein Element mit Leerraum IM Inhalt («<sup>2 </sup>und», «<sup> 3</sup>») ist durch
//     die Quelle abgesetzt — ebenfalls Abstand wie bisher;
//   · Buchstaben-/Mehrzeichen-Inhalte («vmax», «Lrk», «2n+1», «a», «*») werden nicht
//     erraten — Unicode trägt nicht jeden Buchstaben —, sondern wie bisher verklebt.
// Die Tabelle ist die EINE Quelle (§5) für Artikel-, Listen-, Tabellen- und Anhang-Text
// (alle laufen durch entferneTags).
const HOCH: Readonly<Record<string, string>> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '–': '⁻', '−': '⁻', '‑': '⁻',
};
const TIEF: Readonly<Record<string, string>> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '–': '₋', '−': '₋', '‑': '₋',
};
// Vorzeichen: + · - · en-Strich (U+2013) · Minuszeichen (U+2212) · geschützter Bindestrich (U+2011).
const VORZEICHEN = '+\\-–−‑';
// Ziffern, Ziffern mit Vorzeichen davor/danach (Ladung «2+», Exponent «-9») oder ein Vorzeichen allein («NO3–»).
const WANDELBAR = new RegExp(`^(?:\\d+|[${VORZEICHEN}]\\d*|\\d+[${VORZEICHEN}])$`);
// Zeichen, an das ein Exponent/Index «hängt»: Buchstabe, Ziffer, schliessende/öffnende Klammer, Bruchstrich, %, °.
const TRAEGER = /[\p{L}\p{N})\]([%°/⁄]/u;
// Entity-Schreibweisen des geschützten Leerzeichens (die Strip-Kette dekodiert erst am Schluss).
const ENTITY_NBSP = /&nbsp;|&#0*160;|&#x0*a0;/gi;
const ENDET_AUF_ENTITY_NBSP = /(?:&nbsp;|&#0*160;|&#x0*a0;)$/i;
// Fussnoten-Platzhalter der Offset-Ausrichtung (fussnoten-offsets.ts): Private-Use-Zeichen.
const PLATZHALTER_ANFANG = String.fromCharCode(0xe000);
const PLATZHALTER_ENDE = String.fromCharCode(0xe001);

/** Wandelt den reinen Ziffern-/Vorzeichen-Inhalt in Unicode — null, wenn nicht eindeutig abbildbar. */
export function hochTiefUnicode(tag: 'sup' | 'sub', inhalt: string): string | null {
  const t = inhalt.replace(ENTITY_NBSP, ' ').trim();
  const tabelle = tag === 'sup' ? HOCH : TIEF;
  if (WANDELBAR.test(t)) return [...t].map((c) => tabelle[c]).join('');
  // Index mit angehängtem Komma («M<sub>3,</sub> N<sub>2</sub>»): die Ziffer wird Index, das Komma bleibt Satzzeichen.
  const mitKomma = tag === 'sub' ? t.match(/^(\d+),$/) : null;
  return mitKomma ? [...mitKomma[1]].map((c) => tabelle[c]).join('') + ',' : null;
}

/**
 * Hängt das Element bei `offset` unmittelbar an einem Trägerzeichen (Buchstabe, Ziffer, Klammer …)?
 * Läuft rückwärts über Inline-Tags (wie das Strippen: «tmp:inl», <i>, <span> … trennen nicht)
 * und Fussnoten-Platzhalter; Block-Tags, Textanfang, Leerraum, geschütztes Leerzeichen und
 * Satzzeichen (Punkt, Doppelpunkt, Strich …) gelten als Trennung.
 */
function haengtAnTraeger(ganz: string, offset: number): boolean {
  let i = offset;
  while (i > 0) {
    const c = ganz[i - 1];
    if (c === '>') {
      const lt = ganz.lastIndexOf('<', i - 1);
      if (lt < 0) return false;
      const name = ganz.slice(lt, i).match(/^<\/?\s*([a-zA-Z][a-zA-Z0-9]*(?::[a-zA-Z0-9_.-]+)?)/);
      if (!name) return false;
      const n = name[1].toLowerCase();
      if (!(n.includes(':') || INLINE_STRIP_TAGS.has(n))) return false; // Block-Tag trennt
      i = lt;
      continue;
    }
    if (c === PLATZHALTER_ENDE) {
      const anfang = ganz.lastIndexOf(PLATZHALTER_ANFANG, i - 1);
      if (anfang < 0) return false;
      i = anfang;
      continue;
    }
    if (c === ';' && ENDET_AUF_ENTITY_NBSP.test(ganz.slice(Math.max(0, i - 8), i))) return false;
    return TRAEGER.test(c);
  }
  return false;
}

// Bruch «<sup>2</sup>/<sub>3</sub>»: der Zähler steht auch nach Leerraum («mindestens ²/₃»), er ist kein Absatz-Label.
const BRUCH_NENNER = /^\s*[/⁄]\s*<sub\b[^>]*>\s*\d+\s*<\/sub>/i;

/** <sup>/<sub> im Rohtext: Unicode, Abstand-Ziffer (bisheriges Verhalten) oder unverändert (Tags fallen später). */
function ersetzeHochTief(m: string, tag: string, inhalt: string, offset: number, ganz: string): string {
  const art = tag.toLowerCase() as 'sup' | 'sub';
  // Leerraum im Inhalt = von der Quelle abgesetzt («<sup>2 </sup>und», «<sup> 3</sup>»): kein Exponent.
  const vorLeer = /^(?:\s|&nbsp;|&#0*160;|&#x0*a0;)/i.test(inhalt);
  const nachLeer = /(?:\s|&nbsp;|&#0*160;|&#x0*a0;)$/i.test(inhalt);
  if (!vorLeer) {
    const bruchZaehler = art === 'sup' && BRUCH_NENNER.test(ganz.slice(offset + m.length));
    if (bruchZaehler || haengtAnTraeger(ganz, offset)) {
      const u = hochTiefUnicode(art, inhalt);
      if (u !== null) return nachLeer ? `${u} ` : u;
    }
  }
  const ziffern = inhalt.match(/^\s*(\d[\d\s]*)\s*$/);
  return ziffern ? ` ${ziffern[1].trim()} ` : m;
}

export function entferneTags(s: string): string {
  return dekodiereEntities(
    s
      .replace(NICHT_TEXT_ELEMENTE, '')
      .replace(TAB_PLATZHALTER, '')
      // Ziffern-/Vorzeichen-<sup>/<sub>: angehängt (Exponent «m²», Index «CO₂», Ladung
      // «NO₃⁻», Bruch «133¹/₃») → Unicode, ohne Abstand (P8, s. hochTiefUnicode).
      // LOSE reine Ziffern (Absatz-Hochzahl «72³» im BV-Register, Label «3 und 4 Aufgehoben»)
      // behalten den trennenden Abstand (bisheriges Verhalten) — §1: nie zwei Ziffern
      // stillschweigend zu einer Zahl zusammenführen. Sonstiges (Buchstaben-Suffixe
      // bis/ter/g …, Mehrzeichen) wird wie bisher verklebt (N1-Fix).
      .replace(/<(sup|sub)\b[^>]*>([^<]*)<\/\1>/gi, ersetzeHochTief)
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
