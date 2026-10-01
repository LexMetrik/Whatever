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
import { reinText } from './struktur-extrahiere.ts';

/** Gliederungs-/Randtitel-Container des AKN-Baums, die ein `<heading>` tragen können. */
const CONTAINER = new Set(['part', 'title', 'chapter', 'section', 'subsection', 'level', 'transitional']);
const TAG = /<(\/?)([A-Za-z][\w:-]*)\b([^>]*?)(\/?)>/g;
const ID = /^(?:disp_u?\d+\/)?art_/;

interface Ebene { tag: string; role: string | null; num: string; label: string; kind: 'g' | 'm' | null }

/** Heading-Innenraum → Klartext: Fussnoten-Apparat (`authorialNote`) fällt weg, der Rest
 *  läuft durch dieselbe Text-Normalisierung wie der HTML-Pfad (`reinText`). */
function headingText(inner: string): string {
  return reinText(inner.replace(/<authorialNote\b[\s\S]*?<\/authorialNote>/gi, ''));
}

/** Extrahiert je Artikel-Token die Randtitel-Kette (aussen → innen) aus dem Fedlex-XML. */
export function extrahiereMarginalienXml(xml: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const ankerAnzahl = new Map<string, number>();
  const stack: Ebene[] = [];
  let cap: { art: 'heading' | 'num'; start: number; ziel: Ebene | null } | null = null;

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
        if (cap.ziel && cap.art === 'num') cap.ziel.num = roh;
        else if (cap.ziel) {
          // HTML-Label = «<num> <heading>» in einer Überschrift («A. Abschluss des Vertrages»).
          const label = headingText(`${cap.ziel.num} ${roh}`);
          if (label && !/^(?:Art\.|§)\s/.test(label)) {
            cap.ziel.label = label;
            cap.ziel.kind = cap.ziel.role === 'marginal' ? 'm' : 'g';
          }
        }
        cap = null;
      }
      continue;
    }
    if (selbst) continue;
    if (!schliesst) {
      if (tag === 'heading' || tag === 'num') {
        const eltern = stack[stack.length - 1];
        cap = { art: tag, start: ende, ziel: eltern && CONTAINER.has(eltern.tag) ? eltern : null };
        continue;
      }
      const role = attrs.match(/\bfedlex:role="([^"]*)"/)?.[1] ?? null;
      stack.push({ tag, role, num: '', label: '', kind: null });
      if (tag === 'article') {
        const id = attrs.match(/\beId="([^"]+)"/)?.[1];
        if (id && ID.test(id)) {
          const n = (ankerAnzahl.get(id) ?? 0) + 1;
          ankerAnzahl.set(id, n);
          const ctx = stack.filter((e) => e.kind !== null);
          const letztesG = ctx.map((e) => e.kind).lastIndexOf('g');
          result[ankerZuToken(n === 1 ? id : `${id}__${n}`)] =
            ctx.slice(letztesG + 1).filter((e) => e.kind === 'm').map((e) => e.label);
        }
      }
      continue;
    }
    // Schliess-Tag: Stack bis zum passenden Öffner zurück (XML ist wohlgeformt).
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].tag === tag) { stack.length = i; break; }
    }
  }
  return result;
}
