/**
 * Fedlex-Extraktor — balancierte Ende-Finder für <dl>/<dd>/<section>/<table> (Blatt-Modul,
 * Split aus `extrahiere-fedlex.ts`, W2·27-BUND-FERTIG PR 0, 2.10.2026). Code und Kommentare
 * unverändert verschoben.
 */

/**
 * Findet zu einem <dl>-Öffnungs-Tag (an Position startIdx beginnend) den Index
 * NACH dem PASSENDEN schliessenden </dl>, indem die <dl>/</dl>-Tiefe gezählt wird.
 * Fedlex verschachtelt <dl> in <dd> (lit. → nummerierte Unterpunkte); ein
 * non-greedy Regex stoppte am falschen (inneren) </dl>. Fehlt das schliessende
 * Tag (malformed), wird das Stringende zurückgegeben (defensiv).
 */
export function findeDlEnde(html: string, startIdx: number): number {
  const tagRe = /<dl\b[^>]*>|<\/dl>/gi;
  tagRe.lastIndex = startIdx;
  let tiefe = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    if (m[0].toLowerCase().startsWith('</')) {
      tiefe--;
      if (tiefe === 0) return m.index + m[0].length;
    } else {
      tiefe++;
    }
  }
  return html.length;
}

/**
 * Findet zu einem <dd>-Inhalt (ab Position startIdx, NACH dem <dd…>-Öffnungs-Tag)
 * den Index des PASSENDEN schliessenden </dd>, balanciert über die <dd>-Tiefe.
 * Verschachtelte <dl><dt>…<dd>…</dd></dl> dürfen das <dd>-Ende nicht vortäuschen;
 * darum werden <dd>/</dd> gezählt (Start-Tiefe 1 für das offene <dd>).
 */
export function findeDdEnde(html: string, startIdx: number): number {
  const tagRe = /<dd\b[^>]*>|<\/dd>/gi;
  tagRe.lastIndex = startIdx;
  let tiefe = 1;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    if (m[0].toLowerCase().startsWith('</')) {
      tiefe--;
      if (tiefe === 0) return m.index;
    } else {
      tiefe++;
    }
  }
  return html.length;
}

/**
 * Findet zu einem <section>-Öffnungs-Tag (an Position startIdx beginnend) den
 * Index NACH dem PASSENDEN schliessenden </section> — balanciert über die
 * <section>/</section>-Tiefe (Anhänge schachteln lvl_*-Sektionen). Analog
 * findeDlEnde. Fehlt das schliessende Tag (malformed), Stringende (defensiv).
 */
export function findeSectionEnde(html: string, startIdx: number): number {
  const re = /<section\b[^>]*>|<\/section>/gi;
  re.lastIndex = startIdx;
  let tiefe = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[0].toLowerCase().startsWith('</')) {
      tiefe--;
      if (tiefe === 0) return m.index + m[0].length;
    } else {
      tiefe++;
    }
  }
  return html.length;
}

/**
 * Findet zu einem <table>-Öffnungs-Tag (an startIdx) den Index NACH dem PASSENDEN
 * schliessenden </table> — balanciert über die <table>/</table>-Tiefe. Fedlex legt
 * Layout-Tabellen (Bild-/Formel-Gitter) als <table> IN eine Zelle einer äusseren
 * <table> (z.B. SSV Anhang 2). Ein non-greedy `[\s\S]*?</table>` stoppte am
 * INNEREN </table> → die äussere Tabelle würde zerschnitten und Folgezeilen
 * (Signal-Legenden 4.78–4.95) gingen verloren (§1, Bug-Befund Gegenprüfung).
 */
export function findeTableEnde(html: string, startIdx: number): number {
  const re = /<table\b[^>]*>|<\/table>/gi;
  re.lastIndex = startIdx;
  let tiefe = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[0].toLowerCase().startsWith('</')) {
      tiefe--;
      if (tiefe === 0) return m.index + m[0].length;
    } else {
      tiefe++;
    }
  }
  return html.length;
}
