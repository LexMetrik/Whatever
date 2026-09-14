/**
 * Fussnoten-Extraktor (Bund): liest die amtlichen Fussnoten je Artikel aus dem
 * Fedlex-Filestore-HTML — Änderungs-/Quellenhinweise («Fassung gemäss …, in Kraft
 * seit …», «Aufgehoben durch …») samt AS-/BBl-Verweisen und deren Links.
 *
 * Reine Präsentations-Anreicherung (§3): keine Normtext-Erzeugung, Snapshots
 * unberührt. Ergebnis fliesst in die Struktur-Sidecars (struktur-run.ts).
 *
 * HTML-Struktur (verifiziert or.html 17.6.2026):
 *  - Inline-Marker im Artikel: <sup><a href="#fn-XXX" id="fnbck-XXX">N</a></sup>
 *  - Definition: <div class="footnotes"><p id="fn-XXX"><sup><a href="#fnbck-XXX">N</a></sup>
 *    TEXT <a href="https://fedlex.data.admin.ch/eli/oc/…">AS …</a> …</p></div>
 *    (eli/oc = Amtliche Sammlung, eli/fga = Bundesblatt)
 */

import { findeDlEnde, findeDdEnde, ankerZuToken, parseArtikelInner } from './extrahiere-fedlex';
import { berechneFnPositionen, type FnPos } from './fussnoten-offsets';

export interface FnLink {
  label: string;
  url: string;
  /**
   * G-REF: bei einem amtlich verlinkten SR-Verweis (`<a data-rs-uri="…/eli/cc/…"
   * data-rs="943.03">SR 943.03</a>`) die maschinen-auflösbare SR-Nummer als
   * Zielidentität. Fedlex trägt den ELI-Deep-Link zum ZIEL-Erlass in `data-rs-uri`
   * (→ `url`), nicht im `href` (der zeigt auf eine Vokabular-Taxonomie-Seite, NICHT
   * auf die amtliche Fassung). Nur SR-Verweise tragen `rs`; AS-/BBl-Verweise nicht
   * (deren `href` ist bereits der amtliche eli/oc- bzw. eli/fga-Deep-Link).
   */
  rs?: string;
}
export interface Fussnote {
  nr: string; text: string; links: FnLink[];
  absatz?: string | null; item?: string | null;
  /** G11: geh\u00f6rt diese Fussnote zu einer \u00dcberschrift/einem Randtitel (section-
   *  heading-footnote), tr\u00e4gt `sektion` dessen Label \u2192 Marker am Sektions-Kopf. */
  sektion?: string;
  /** A31a: Marker in einem ABSATZLOSEN Fliesstext-Absatz (kein Absatz-<sup>N \u2014
   *  z. B. ZGB 798a \u00ab\u20261991<sup>667</sup>\u2026\u00bb). `absatz`/`item` k\u00f6nnen den Block dann
   *  nicht identifizieren (mehrere absatzlose Bl\u00f6cke tragen alle absatz=null); der
   *  0-basierte Index in die Snapshot-Bloecke (`e.bloecke`) verortet den Marker
   *  eindeutig im Fliesstext statt auf der Artikelebene. Nur gesetzt, wenn n\u00f6tig. */
  absatzIndex?: number;
  /** FN-5/M14: wortgenaue Marker-Position \u2014 Block-Index `b` in `e.bloecke`,
   *  optional Item-Index `it`, Zeichen-Offset `o` im finalen Text. Nur gesetzt,
   *  wenn die Platzhalter-Ausrichtung ZEICHENGENAU bewiesen ist
   *  (fussnoten-offsets.ts); fehlt `pos`, gilt das bisherige Verhalten
   *  (Marker am Absatz-/Item-Ende). */
  pos?: FnPos;
}

// G15: Hervorhebungen (fett/kursiv) im Fussnotentext bleiben erhalten \u2014 Fedlex
// setzt AS-/BBl-/SR-Nummern in <b> und Verweise teils in <i>. <b>/<i> werden auf
// bare Tags normalisiert (Attribute weg) und behalten, alle anderen Tags fallen.
// fnTextMitLinks (Lesesicht) rendert daraus Rich-Text; die Link-Label-Erkennung
// und die SR-Erkennung (M11) strippen die Tags wieder, bleiben also robust.
function clean(s: string): string {
  return s
    .replace(/<sup\b[\s\S]*?<\/sup>/gi, '')
    .replace(/<(b|i)\b[^>]*>/gi, (_m, t: string) => `<${t.toLowerCase()}>`)
    .replace(/<\/(b|i)\s*>/gi, (_m, t: string) => `</${t.toLowerCase()}>`)
    .replace(/<(?!\/?[bi]>)[^>]*>/g, '')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .replace(/<([bi])>\s*<\/\1>/gi, '') // leere Hervorhebungen (Fedlex-Artefakt)
    .trim();
}

/** Globale Fussnoten-Definitionen (id → {nr,text,links}) aus dem ganzen HTML —
 *  inkl. der «section-heading-footnote»-Definitionen. */
export function fnDefinitionen(html: string): Map<string, Fussnote> {
  const defs = new Map<string, Fussnote>();
  for (const m of html.matchAll(/<p[^>]*\bid="(fn-[^"]+)"[^>]*>([\s\S]*?)<\/p>/gi)) {
    const id = m[1];
    const roh = m[2];
    // FN-1: Nummer primär aus dem #fnbck-Back-Link (neue Fedlex-Generation, z. B.
    // OR/ZGB). 22 ältere Aspose-Dumps (VZG, ENTG, KOV, FZA, LugÜ …) tragen KEIN
    // fnbck, sondern definieren die Note als «<p id="fn-…"><sup>N</sup>TEXT» —
    // dann die führende <sup>-Ziffer als Fallback lesen (matcht 226/226 VZG). Der
    // Marker-<sup> wird ohnehin von clean() aus dem Text gestrippt (kein Zusatz-Strip).
    const nr = roh.match(/<a[^>]*href="#fnbck-[^"]*"[^>]*>(\d+[a-z]?)<\/a>/i)?.[1]
      ?? roh.match(/^\s*<sup[^>]*>(\d+[a-z]?)<\/sup>/i)?.[1]
      ?? '';
    // Links (AS/BBl/SR etc.) vor dem Tag-Strippen sammeln.
    // G-REF: SR-Verweise (`data-rs-uri` + `data-rs`) docken NICHT am `href` an —
    // dieses zeigt auf eine Vokabular-Taxonomie-Seite, nicht auf die amtliche
    // Fassung. Der amtliche ELI-Deep-Link zum Ziel-Erlass steht in `data-rs-uri`,
    // die SR-Nummer (Zielidentität) in `data-rs`. AS-/BBl-Verweise tragen kein
    // `data-rs`; ihr `href` IST bereits der amtliche eli/oc- bzw. eli/fga-Link
    // (unverändert übernommen). Fussnoten-Rück-/Inline-Marker (`href="#fnbck-…"`,
    // `href="#fn-…"`) haben weder eine http(s)-URL noch `data-rs` → werden wie
    // bisher NICHT als Link erfasst.
    const links: FnLink[] = [];
    for (const a of roh.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
      const attrs = a[1];
      const label = clean(a[2]);
      if (!label) continue;
      const rsUri = attrs.match(/\bdata-rs-uri="([^"]+)"/i)?.[1];
      const rs = attrs.match(/\bdata-rs="([^"]+)"/i)?.[1];
      if (rsUri && rs) { links.push({ label, url: rsUri, rs }); continue; }
      const href = attrs.match(/\bhref="(https?:\/\/[^"]+)"/i)?.[1];
      if (href) links.push({ label, url: href });
    }
    // Back-Marker (führende Nummer) vor dem Text entfernen, Rest als Text.
    const ohneBack = roh.replace(/<sup\b[^>]*>\s*<a[^>]*href="#fnbck-[^"]*"[\s\S]*?<\/sup>/i, '');
    defs.set(id, { nr, text: clean(ohneBack), links });
  }
  return defs;
}

/** Extrahiert je Artikel-Token die Fussnoten (in Erst-Vorkommens-Reihenfolge). */
export function extrahiereFussnoten(html: string): Record<string, Fussnote[]> {
  const defs = fnDefinitionen(html);

  // 2) Je Artikel: Inline-Marker (#fn-…) in Dokumentreihenfolge auflösen und
  //    dem Absatz zuordnen, in dem der Marker steht. Absatz-Container =
  //    <p class="…absatz…">; dessen führendes <sup> ohne <a>-Kind und nur
  //    Ziffern/[a-z] ist die Absatznummer (gleiche Regel wie der Snapshot-
  //    Extraktor). Marker ausserhalb eines Absatz-<p> (Artikelkopf/Marginalie)
  //    → absatz: null (Artikelebene).
  const perArtikel: Record<string, Fussnote[]> = {};
  // Drop-Fix (M13): Haupttext-Artikel «art_…» UND Schlussbestimmungs-/UeB-Artikel
  // «disp_uN/art_…» (auch «disp_N/art_…» ohne «u», z. B. VZG). Die alte Regex
  // «id="art_…"» verfehlte die disp-IDs → deren Fussnoten-Marker fielen ganz weg
  // (17 VZG-Noten). ID-Schema + Token-Bildung IDENTISCH zu struktur-extrahiere.ts
  // (ankerZuToken), damit der Join in struktur-run.ts greift.
  // W2·27 (Doppel-id): identisch zu extrahiereStruktur — ein WIEDERHOLTER Anker
  // (Fedlex-Quellfehler, belegt an KKV `id="art_126_z"` zweimal) erhält den
  // Synthese-Suffix «__2»/«__3» wie im Snapshot-Generator. Ohne ihn kollidierten
  // beide Vorkommen auf einem Schlüssel und der Fussnoten-Apparat des zweiten
  // Artikels landete am ersten (§1/§7). Heute folgenlos (KKV Art. 126z trägt keine
  // Fussnoten), aber der Join in struktur-run.ts setzt Schlüsselgleichheit voraus.
  const ankerAnzahl = new Map<string, number>();
  for (const am of html.matchAll(/<article[^>]*\bid="((?:disp_u?\d+\/)?art_[^"]+)"[^>]*>([\s\S]*?)<\/article>/gi)) {
    const n = (ankerAnzahl.get(am[1]) ?? 0) + 1;
    ankerAnzahl.set(am[1], n);
    const token = ankerZuToken(n === 1 ? am[1] : `${am[1]}__${n}`);
    const body = am[2];
    // fn-id → Absatznummer (erstes Vorkommen). Absatz-<p> UND <dl>-Aufzählungen
    // in DOKUMENTREIHENFOLGE durchgehen (gleiche Logik wie der Snapshot-Extraktor,
    // der die <dl> dem vorausgehenden Absatz als items anhängt): Marker in einer
    // <dl> gehören zum zuletzt gesehenen Absatz, nicht zur Artikelebene.
    const fnAbsatz = new Map<string, string | null>();
    const fnItem = new Map<string, string | null>(); // lit/Ziff-Marke des Items, in dem der Marker steht
    let letzterAbsatz: string | null = null;
    const setze = (id: string, item: string | null) => {
      if (!fnAbsatz.has(id)) { fnAbsatz.set(id, letzterAbsatz); fnItem.set(id, item); }
    };
    // C1-4: <dl> BALANCIERT (findeDlEnde/findeDdEnde) statt non-greedy — sonst
    // stoppte der Block am inneren </dl> verschachtelter Listen (lit. -> Ziff.) und
    // die Marker der Eltern-Items NACH der Unterliste fielen auf die Artikelebene.
    // Marker im <dt>+Einleitungstext gehoeren zu DIESER Marke; verschachtelte
    // Unterlisten werden rekursiv der tieferen Marke zugeordnet.
    const MARKE = /^([0-9]+(?:bis|ter|quater|quinquies)?[a-z]?|[a-z](?:bis|ter|quater|quinquies)?)\s*[.)]?/i;
    const walkDl = (dlInner: string): number => {
      const dtRe = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>/gi;
      let dm: RegExpExecArray | null;
      let paare = 0;
      while ((dm = dtRe.exec(dlInner)) !== null) {
        paare++;
        const ddStart = dtRe.lastIndex;
        const ddEnde = findeDdEnde(dlInner, ddStart);
        const ddRoh = dlInner.slice(ddStart, ddEnde);
        dtRe.lastIndex = ddEnde + '</dd>'.length;
        const markeRoh = dm[1].replace(/<sup[^>]*><a[\s\S]*?<\/a><\/sup>/gi, '')
          .replace(/<[^>]+>/g, '').replace(/&nbsp;|\u00a0/g, ' ').trim();
        const mk = markeRoh.match(MARKE);
        const item = mk ? mk[1].toLowerCase() : null;
        const subDlIdx = ddRoh.search(/<dl\b[^>]*>/i);
        const ddVorListe = subDlIdx >= 0 ? ddRoh.slice(0, subDlIdx) : ddRoh;
        for (const fm of (dm[1] + ddVorListe).matchAll(/\bhref="#(fn-[^"]+)"/gi)) setze(fm[1], item);
        if (subDlIdx >= 0) {
          const subEnde = findeDlEnde(ddRoh, subDlIdx);
          const subOpenLen = ddRoh.slice(subDlIdx).match(/^<dl\b[^>]*>/i)![0].length;
          walkDl(ddRoh.slice(subDlIdx + subOpenLen, subEnde - '</dl>'.length));
        }
      }
      return paare;
    };
    // Block-Walk in DOKUMENTREIHENFOLGE: <p ...absatz...> ODER balancierte <dl>.
    const blockStart = /<p[^>]*\bclass="[^"]*\babsatz\b[^"]*"[^>]*>|<dl\b[^>]*>/gi;
    let bm: RegExpExecArray | null;
    while ((bm = blockStart.exec(body)) !== null) {
      if (bm[0].toLowerCase().startsWith('<p')) {
        const pEnd = body.indexOf('</p>', blockStart.lastIndex);
        const seg = body.slice(blockStart.lastIndex, pEnd < 0 ? body.length : pEnd);
        const supM = seg.match(/^(?:\s|&nbsp;)*<sup(?:[^>]*)>([\s\S]*?)<\/sup>/i);
        letzterAbsatz = supM && !/<a[\s>]/i.test(supM[1]) && /^\d+(?:bis|ter|quater|quinquies)?[a-z]?$/.test(supM[1].trim())
          ? supM[1].trim() : null;
        for (const fm of seg.matchAll(/\bhref="#(fn-[^"]+)"/gi)) setze(fm[1], null);
        if (pEnd >= 0) blockStart.lastIndex = pEnd + '</p>'.length;
      } else {
        const dlEnde = findeDlEnde(body, bm.index);
        const dlInner = body.slice(bm.index + bm[0].length, dlEnde - '</dl>'.length);
        if (!walkDl(dlInner)) for (const fm of dlInner.matchAll(/\bhref="#(fn-[^"]+)"/gi)) setze(fm[1], null);
        blockStart.lastIndex = dlEnde;
      }
    }
    // A31a: für die AMBIGEN Marker (Walk ordnet sie keinem Absatz/Item zu →
    // absatz=null/item=null: entweder Kopf-/Marginalien-Marker ODER absatzloser
    // Fliesstext-Marker) den AUTHENTISCHEN Snapshot-Block bestimmen. parseArtikelInner
    // liefert dieselben Bloecke wie der Snapshot-Extraktor (gleiche Absatz-Numerierung)
    // plus je Block seinen Quell-Span. Der Kopf-<h6> ist darin entfernt → ein
    // Kopf-Marker liegt in KEINEM Block-Quelltext (bleibt Artikelebene), ein
    // Fliesstext-Marker sehr wohl. So wird fn 667 (Fliesstext, ZGB 798a) von fn 666
    // (Marginalie) unterscheidbar. §1: echte Textposition statt Artikelebene.
    const innerRoh = body
      .replace(/<div\s+class="footnotes">[\s\S]*$/i, '')
      .replace(/<h6\b[^>]*>[\s\S]*?<\/h6>/gi, '');
    const { bloecke: sbBloecke, quellen: sbQuellen } = parseArtikelInner(innerRoh);
    // FN-5/M14: wortgenaue Marker-Positionen aus dem Platzhalter-Parse — nur
    // zeichengenau bewiesene Offsets (sonst Fallback Absatz-/Item-Ende).
    const fnPos = berechneFnPositionen(innerRoh, { bloecke: sbBloecke });
    const blockFuerMarker = (id: string): { absatz: string | null; index: number } | null => {
      for (let i = 0; i < sbBloecke.length; i++) {
        const q = sbQuellen[i];
        // Nur Text-/Item-tragende Blöcke (reine Bild-/Tabellen-Blöcke tragen keinen
        // Marker); der Voll-Anschluss `href="#<id>"` inkl. schliessendem " verhindert
        // Präfix-Kollisionen (fn-d1 vs fn-d10).
        if (q && q.includes(`href="#${id}"`) && (sbBloecke[i].text !== '' || (sbBloecke[i].items?.length ?? 0) > 0)) {
          return { absatz: sbBloecke[i].absatz, index: i };
        }
      }
      return null;
    };

    const gesehen = new Set<string>();
    const liste: Fussnote[] = [];
    for (const mm of body.matchAll(/\bhref="#(fn-[^"]+)"/gi)) {
      const id = mm[1];
      if (gesehen.has(id)) continue;
      gesehen.add(id);
      const def = defs.get(id);
      if (!def) continue;
      let absatz: string | null = fnAbsatz.has(id) ? fnAbsatz.get(id)! : null;
      const item: string | null = fnItem.get(id) ?? null;
      let absatzIndex: number | undefined;
      if (absatz == null && item == null) {
        const blk = blockFuerMarker(id);
        if (blk) {
          if (blk.absatz != null) absatz = blk.absatz;   // nummerierter Absatz (Numerierung wie Snapshot)
          else absatzIndex = blk.index;                  // absatzloser Fliesstext-Block → Position
        }
        // kein Block gefunden → Kopf/Marginalie → absatz bleibt null (Artikelebene)
      }
      const fn: Fussnote = { ...def, absatz, item };
      if (absatzIndex != null) fn.absatzIndex = absatzIndex;
      const p = fnPos.get(id);
      if (p) fn.pos = p;
      liste.push(fn);
    }
    if (liste.length) perArtikel[token] = liste;
  }
  return perArtikel;
}
