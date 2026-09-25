// ─── Amtlicher BGE-Sammlungs-Auszug aus bger.ch clir (Konflations-Rückfall) ───
//
// Anlass (QS-KORPUS, 25.9.2026, Posten «BGE 152 I 2 mit amtlichem clir-Auszug
// aufnehmen»): OCLs Basis-Record für «152 I 2» ist vermischt — `full_text`,
// `docket_number_2` (1C_480/2025), `decision_date` (2026-02-27), `statutes`
// (LTF/CST/EIMP) und `cited_decisions` gehören zu «152 I 20»; eigene sind nur
// `regeste`, `chamber`, `citation_string_de` und `source_url` (Messung gegen
// mcp.opencaselaw.ch/api/decisions/152_I_2, 25.9.2026). Der Konflations-Guard
// (normtext-entscheide.ts, PR #1099) verwarf den BGE darum.
//
// Die amtliche clir-Seite derselben Fundstelle (search.bger.ch, ohnehin für
// Urteilskopf + Regeste geholt) trägt den eigenen Sammlungs-Auszug strukturiert:
// `id="sachverhalt"` / `id="erwaegungen"`-Anker, je Absatz `<div class="paraatf">`,
// Erwägungs-Marken `<span class="bold" id="consideration_4.1">4.1 </span>`,
// laufende Seitenköpfe `<div class="center pagebreak">BGE 152 I 2 S. 4</div>`
// (auch MITTEN im Satz), Ende des Auszugs vor `<div class="box_bottom_2ndline">`.
//
// Zwei reine Funktionen (§2, netzfrei, unit-testbar):
//  · parseClirAuszug — clir-HTML → `abschnitte` im Format des OCL-Pfads
//    (Sachverhalt über dieselbe `teileSachverhalt`, Erwägungen «E. n» mit `tiefe`
//    = Segmentzahl wie normalisiereErwaegung, Absätze einer Erwägung mit
//    Leerzeichen verbunden wie die OCL-Auszüge des Bestands; Seitenköpfe
//    entfernt). Fail-closed (§8): jede strukturelle Abweichung ⇒ null.
//  · ersetzeKonflatiertenAuszug — tauscht im OCL-Basis-Snapshot NUR DANN den
//    Body gegen den clir-Auszug, wenn der Basis-Body den laufenden Kopf eines
//    ANDEREN BGE desselben Bandes trägt; zugleich fallen alle aus dem vermischten
//    Record stammenden Felder weg (statutes, Rubrum, Dispositiv, Zitate). Ohne
//    Befund: dasselbe Objekt zurück (§6 byte-gleich für alle übrigen BGE).

import type {
  EntscheidAbschnitt, EntscheidBlock, EntscheidSnapshot, EntscheidSprache,
} from '../../src/lib/rechtsprechung/typen';
import { bereinigeFliesstext } from '../../src/lib/rechtsprechung/register';
import { teileSachverhalt } from '../../src/lib/rechtsprechung/sachverhalt';
import { inlineZuText } from './clir-regeste';
import { sha256EntscheidBloecke } from './sha-entscheide';
import { normKeysVonSnapshot } from './entscheide-mapping';
import { findeFremdeFundstelleImBody } from './entscheide-koerper-konflation';

const SEITENKOPF_DIV = /(?:<a name="page\d+"><\/a>\s*)?<div class="center pagebreak">([^<]*)<\/div>/g;
const SEITENKOPF_TEXT = /^\s*BGE\s+(\d{1,3}\s+[IVXLC]+[a-z]?\s+\d+)\s+S\.\s*\d+\s*$/;
const ABSATZ = /<div class="paraatf">([\s\S]*?)<\/div>/g;
const MARKE = /^\s*(?:<a name="[^"]*"><\/a>\s*)?<span class="bold" id="consideration_([0-9.]+)">([^<]*)<\/span>/;
// Einleitungszeile vor der ersten Marke (Auszug-Formel in der Verfahrenssprache).
const EINLEITUNG = /^(?:Aus den Erwägungen|Extrait des considérants|Estratto dei considerandi|Dai considerandi)\s*:?$/i;
// Was ausserhalb der Absätze im Auszug-Bereich stehen darf: nur die Anker-Überschrift.
const RAHMEN_ERLAUBT = /^(?:Sachverhalt|Erwägungen)?(?:\s*ab Seite \d+)?$/;

const norm = (s: string) => s.trim().replace(/\s+/g, ' ');

/** Seitenköpfe entfernen; null, wenn einer NICHT die eigene Fundstelle trägt. */
function ohneSeitenkoepfe(roh: string, eigeneRef: string): string | null {
  let fremd = false;
  const out = roh.replace(SEITENKOPF_DIV, (_m, inner: string) => {
    const m = SEITENKOPF_TEXT.exec(String(inner));
    if (!m || norm(m[1]) !== eigeneRef) fremd = true;
    return ' ';
  });
  return fremd ? null : out;
}

/** Absatz-Innenleben eines Bereichs; null bei Verschachtelung oder Text ausserhalb der Absätze. */
function absaetze(bereich: string): string[] | null {
  const out: string[] = [];
  for (const m of bereich.matchAll(ABSATZ)) {
    if (/<div\b/i.test(m[1])) return null;   // unerwartet verschachtelt ⇒ nicht raten
    out.push(m[1]);
  }
  const rest = inlineZuText(bereich.replace(ABSATZ, ' '));
  return RAHMEN_ERLAUBT.test(rest) ? out : null;
}

/**
 * clir-HTML (DE-Seite, iso-8859-1-dekodiert) → Sammlungs-Auszug als `abschnitte`.
 * null ⇒ kein sicherer Auszug (Titel ≠ Fundstelle, Anker/Ende fehlen, fremder
 * Seitenkopf, keine/doppelte/unstimmige Erwägungs-Marken, Rest-Markup im Text).
 * Sachverhalt ist optional (Auszüge nur aus Erwägungen, z.B. BGE 152 I 61).
 */
export function parseClirAuszug(html: string, bgeReferenz: string | null | undefined): EntscheidAbschnitt[] | null {
  const ref = norm(String(bgeReferenz ?? ''));
  if (!ref) return null;
  const titel = /<title>([^<]*)<\/title>/i.exec(html);
  if (!titel || norm(titel[1]) !== ref) return null;
  const iE = html.indexOf('id="erwaegungen"');
  if (iE < 0) return null;
  const iS = html.indexOf('id="sachverhalt"');
  if (iS > iE) return null;
  const iEnde = html.indexOf('<div class="box_bottom_2ndline">', iE);
  if (iEnde < 0) return null;
  // Bereiche ab dem Ende des Anker-Tags; die Anker-Überschrift selbst ist Rahmen.
  const svRoh = iS >= 0 ? ohneSeitenkoepfe(html.slice(html.indexOf('>', iS) + 1, iE), ref) : '';
  const erRoh = ohneSeitenkoepfe(html.slice(html.indexOf('>', iE) + 1, iEnde), ref);
  if (svRoh === null || erRoh === null) return null;
  // Der Sachverhalt-Bereich endet im offenen Tag des Erwägungs-Ankers («<span class="big bold" ») — abschneiden.
  const svAbs = absaetze(svRoh.replace(/<[^>]*$/, ''));
  const erAbs = absaetze(erRoh);
  if (!svAbs || !erAbs) return null;

  const abschnitte: EntscheidAbschnitt[] = [];
  const svText = svAbs.map(inlineZuText).filter(Boolean).join(' ');
  if (svText) abschnitte.push({ typ: 'sachverhalt', vollstaendig: true, bloecke: teileSachverhalt(bereinigeFliesstext(svText)) });

  const bloecke: { nr: string; teile: string[] }[] = [];
  for (const inner of erAbs) {
    const m = MARKE.exec(inner);
    if (m) {
      const nr = m[1].replace(/\.$/, '');
      // Sichtbare Marke muss dem Anker entsprechen («4.» / «4.1»), sonst nicht raten.
      if (!/^\d+(?:\.\d+)*$/.test(nr) || norm(m[2]).replace(/\.$/, '') !== nr) return null;
      if (bloecke.some((b) => b.nr === nr)) return null;
      bloecke.push({ nr, teile: [inlineZuText(inner.slice(m[0].length))] });
      continue;
    }
    const text = inlineZuText(inner);
    if (!text) continue;
    if (!bloecke.length) { if (EINLEITUNG.test(text)) continue; return null; }
    bloecke[bloecke.length - 1].teile.push(text);
  }
  const erw: EntscheidBlock[] = bloecke
    .map((b): EntscheidBlock => ({ marke: `E. ${b.nr}`, tiefe: b.nr.split('.').length, text: bereinigeFliesstext(b.teile.filter(Boolean).join(' ')) }))
    .filter((b) => b.text);
  if (!erw.length) return null;
  abschnitte.push({ typ: 'erwaegung', bloecke: erw });

  // Leck-Fallen: kein Rest-Markup/Entity, keine Fehl-Dekodierung, kein Seitenkopf (eigener oder fremder desselben Bandes).
  const alles = abschnitte.flatMap((a) => a.bloecke.map((b) => b.text)).join('\n');
  if (/<\/?[a-z][^>]*>|&[a-z]+;|&#\d+;/i.test(alles)) return null;
  // Falsche Dekodierung (Seite deklariert utf-8, liefert iso-8859-1): Ersatzzeichen/Mojibake ⇒ nicht raten.
  if (/\uFFFD|Ã[\u0080-\u00BF]/.test(alles)) return null;
  if (findeFremdeFundstelleImBody(alles, ref)) return null;
  if (new RegExp(`\\bBGE\\s+${ref.replace(/\s+/g, '\\s+')}\\s+S\\.\\s*\\d+`).test(alles)) return null;
  return abschnitte;
}

/**
 * Konflations-Rückfall: trägt der OCL-Basis-Body (Sammlungs-Auszug) den laufenden
 * Kopf eines ANDEREN BGE desselben Bandes und liegt ein sauberer clir-Auszug vor,
 * wird der Body durch diesen ersetzt; alle Felder, die aus dem vermischten Record
 * stammen, fallen weg (statutes → normKeys neu aus Regeste + clir-Text). Ohne
 * Befund oder ohne clir-Auszug: dasselbe Objekt (Guard beim Nachzug verwirft dann).
 * `spracheAusBody` wird injiziert (kein Import-Zyklus mit dem Adapter).
 */
export function ersetzeKonflatiertenAuszug(
  basis: EntscheidSnapshot | null,
  clirAuszug: EntscheidAbschnitt[] | null | undefined,
  spracheAusBody: (a: EntscheidAbschnitt[]) => EntscheidSprache | null,
): EntscheidSnapshot | null {
  if (!basis || !clirAuszug?.length) return basis;
  const text = basis.abschnitte.flatMap((a) => a.bloecke.map((b) => b.text)).join('\n');
  if (!findeFremdeFundstelleImBody(text, basis.bgeReferenz)) return basis;
  const sprache = spracheAusBody(clirAuszug);
  if (!sprache) return basis;
  const neu: EntscheidSnapshot = {
    ...basis,
    abschnitte: clirAuszug,
    sprache,
    rubrum: null,
    dispositivOrders: [],
    zitierteNormen: [],
    zitierteEntscheide: [],
    normKeys: [],
    sha: sha256EntscheidBloecke(clirAuszug),
  };
  neu.normKeys = normKeysVonSnapshot(neu);
  return neu;
}
