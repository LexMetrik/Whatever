/**
 * Randtitel (Marginalien) aus dem AMTLICHEN Akoma-Ntoso-XML (`fedlex:role="marginal"`)
 * statt aus der HTML-Auszeichnung (`div.heading`) — Posten «Struktur-Extraktor liest
 * Randtitel aus HTML statt aus fedlex:role=marginal» (Nebenfund #923, 19.9.2026).
 *
 * Warum: das HTML ist eine Darstellung des XML; die Randtitel-Eigenschaft steht dort
 * als Attribut (`<level fedlex:role="marginal">`) und nicht als CSS-Klasse einer
 * Überschrift. Der HTML-Weg (struktur-extrahiere.ts) hängt an der h1–h5/div-Klassifikation
 * der Rendering-Schicht; der XML-Weg liest die Eigenschaft, die der Redaktor gesetzt hat.
 *
 * Reine Funktion (§2): gleiche Eingabe → gleiche Ausgabe, kein Netz. Liefert NUR die
 * Marginalien-Kette je Artikel-Token (`marginalie`); Gliederung, Fussnoten und Kopf
 * bleiben beim HTML-Pfad. Schlüssel IDENTISCH zu `extrahiereStruktur` (Token über
 * `ankerZuToken`, Doppel-eId-Zählung `__N`), damit der Join byte-gleich bleibt.
 */

import { ankerZuToken } from './extrahiere-fedlex.ts';
import { reinText, SACHTITEL_LEER } from './struktur-extrahiere.ts';

/** Gliederungs-/Randtitel-Container des AKN-Baums, die ein `<heading>` tragen können. */
const CONTAINER = new Set([
  'part', 'title', 'chapter', 'section', 'subsection', 'subdivision', 'subchapter', 'book', 'level', 'transitional',
]);
const TAG = /<(\/?)([A-Za-z][\w:-]*)\b([^>]*?)(\/?)>/g;
const ID = /^(?:disp_u?\d+\/)?art_/;

interface Ebene { tag: string; role: string | null; num: string; heading: string }

/** Heading-Innenraum → Klartext: Fussnoten-Apparat (`authorialNote`) fällt weg, der Rest
 *  läuft durch dieselbe Text-Normalisierung wie der HTML-Pfad (`reinText`). */
function headingText(inner: string): string {
  return reinText(inner.replace(/<authorialNote\b[\s\S]*?<\/authorialNote>/gi, ''));
}

/** Eine Container-Ebene als Überschrift: HTML-Label = «<num> <heading>» («A. Abschluss des
 *  Vertrages»; auch reine Nummer «4.» ohne Titel). Randtitel (`fedlex:role="marginal"`) = 'm',
 *  alles andere Gliederung 'g'. Leer oder «Art. …»/«§ …» = keine Überschrift (wie im HTML-Pfad). */
function klassiere(e: Ebene): { kind: 'g' | 'm'; label: string } | null {
  const label = headingText(`${e.num} ${e.heading}`);
  if (!label || /^(?:Art\.|§)\s/.test(label)) return null;
  return { kind: e.role === 'marginal' ? 'm' : 'g', label };
}

/** Extrahiert je Artikel-Token die Randtitel-Kette (aussen → innen) aus dem Fedlex-XML. */
export function extrahiereMarginalienXml(xml: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const ankerAnzahl = new Map<string, number>();
  const stack: Ebene[] = [];
  let cap: { art: 'heading' | 'num'; start: number; ziel: Ebene | null; artikel?: string } | null = null;
  let artToken: string | null = null; // aktuell offener Artikel (für dessen eigenes <heading>)

  for (const m of xml.matchAll(TAG)) {
    const schliesst = m[1] === '/';
    const tag = m[2];
    const attrs = m[3] ?? '';
    const selbst = m[4] === '/';
    const ende = (m.index ?? 0) + m[0].length;

    if (cap) {
      // Innerhalb eines <heading> zählt nur sein Schluss-Tag.
      if (schliesst && tag === cap.art) {
        const roh = xml.slice(cap.start, m.index);
        if (cap.artikel !== undefined) {
          // Artikel-eigenes <heading> (BV/ZPO/StPO-Manier «Art. 5 Grundsätze …»): Sachtitel
          // als Randtitel — nur wenn der Artikel sonst keinen Randtitel-Kontext hat.
          // Ein <sup> GANZ VORNE ist nicht Teil des Titels: Fedlex setzt im KKV das Ordinal
          // «tredecies» von Art. 126z^tredecies als <sup> an den Anfang der Überschrift.
          // Ein <sup> im Titel («Art. 16a Abs. 1<sup>bis</sup> RPG») bleibt dagegen Text — das
          // HTML-Pendant (`artikelSachtitel`) strippt ALLE <sup> und verliert so «bis».
          const titel = headingText(roh.replace(/^\s*<sup\b[\s\S]*?<\/sup>/i, ''));
          if (titel && !SACHTITEL_LEER.test(titel) && !/^(?:Art\.|§)\s/.test(titel) && result[cap.artikel]?.length === 0) {
            result[cap.artikel] = [titel];
          }
        } else if (cap.ziel) cap.ziel[cap.art] = roh;
        cap = null;
      }
      continue;
    }
    if (selbst) continue;
    if (!schliesst) {
      if (tag === 'heading' || tag === 'num') {
        const eltern = stack[stack.length - 1];
        cap = { art: tag, start: ende, ziel: eltern && CONTAINER.has(eltern.tag) ? eltern : null };
        if (tag === 'heading' && eltern?.tag === 'article' && artToken) cap.artikel = artToken;
        continue;
      }
      const role = attrs.match(/\bfedlex:role="([^"]*)"/)?.[1] ?? null;
      stack.push({ tag, role, num: '', heading: '' });
      if (tag === 'article') {
        const id = attrs.match(/\beId="([^"]+)"/)?.[1];
        if (id && ID.test(id)) {
          const n = (ankerAnzahl.get(id) ?? 0) + 1;
          ankerAnzahl.set(id, n);
          const ctx = stack.filter((e) => CONTAINER.has(e.tag)).map(klassiere).filter((k) => k !== null);
          const letztesG = ctx.map((k) => k.kind).lastIndexOf('g');
          artToken = ankerZuToken(n === 1 ? id : `${id}__${n}`);
          result[artToken] = ctx.slice(letztesG + 1).filter((k) => k.kind === 'm').map((k) => k.label);
        }
      }
      continue;
    }
    if (tag === 'article') artToken = null;
    // Schliess-Tag: Stack bis zum passenden Öffner zurück (XML ist wohlgeformt).
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].tag === tag) { stack.length = i; break; }
    }
  }
  return result;
}

/** Buchstaben und Ziffern, sonst nichts — Vergleichsform für «dieselben Zeichen, andere Typografie». */
const kern = (s: string): string => s.replace(/[^\p{L}\p{N}]/gu, '');

/**
 * Wählt je Kettenglied zwischen HTML- und XML-Schreibweise.
 *
 * Messung 1.10.2026 (alle 231 Bund-Pins, 25 190 Artikel-Token): das XML trägt den
 * RICHTIGEN Randtitel, wo das HTML Ordinal-Suffixe verliert («Artikel 1» statt
 * «Artikel 1a»), Artikelnummer-Reste vorne klebt («b Bezug …») oder einen Randtitel
 * auf Folgeartikel verschleppt (NHG «Zweck»). Umgekehrt verliert das XML Leerraum, den
 * das HTML als `<b> </b>` hält («Aktienund», «Bau- undUnterhalts…», 29 Token) — dort
 * ist das HTML richtig. Darum: stimmen beide in allen Buchstaben und Ziffern überein
 * (nur Leerraum/Trennstrich/Interpunktion verschieden), gilt die HTML-Schreibweise;
 * weicht der Inhalt ab, gilt das XML. Ungleiche Kettenlänge = Struktur-Abweichung →
 * die XML-Kette (die amtliche Rolle `marginal` entscheidet, was ein Randtitel ist).
 */
export function waehleRandtitel(html: readonly string[], xml: readonly string[]): string[] {
  if (html.length !== xml.length) return [...xml];
  return xml.map((x, i) => (kern(x) === kern(html[i]) ? html[i] : x));
}

/** Überlagert die HTML-Marginalien je Token mit der XML-Wahl (nur Token, die das XML kennt). */
export function ueberlagereMarginalien(
  struktur: Record<string, { marginalie: string[] }>,
  xmlMarginalien: Record<string, string[]>,
): void {
  for (const [tok, xml] of Object.entries(xmlMarginalien)) {
    if (struktur[tok]) struktur[tok].marginalie = waehleRandtitel(struktur[tok].marginalie, xml);
  }
}
