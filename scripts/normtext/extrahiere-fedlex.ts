/**
 * Fedlex-Artikel-Extraktor — extrahiert den Volltext eines Artikels aus einem
 * konsolidierten Fedlex-Filestore-HTML (z.B. /tmp/or.html).
 *
 * Verifizierte Markup-Struktur (SPIKE 16.6.2026, or.html/zpo.html):
 *   - Artikel: <article id="art_TOKEN">…</article>
 *   - Absatz-Container: <p class="absatz …">…</p>  (class enthält «absatz»)
 *   - Absatznummer: erstes <sup> im <p>, dessen Inhalt NUR Ziffern/[a-z]
 *     enthält und kein <a>-Kind hat (Fussnoten-<sup> enthalten immer <a>-Links)
 *   - Unterabsätze ohne Nummerierung haben kein führendes <sup>  → absatz: null
 *
 * Öffentliche Signatur ist stabil; Regex-Interna können sich anpassen, wenn
 * Fedlex das Markup ändert.
 */


import { artikelRohHtml } from './artikel-vorkommen.ts';
import { STERN_NOTE_ALTERNATIVE } from './stern-note.ts';
import { ZIFFER_TITEL_ALTERNATIVE, zifferTitelZu, ordneZiffern } from './ziffer-ebene.ts';
import { artikelTextMitAufhebung } from './aufhebung-signal.ts';
import { normalisiereTabelle } from './tabelle-normalisieren.ts';
import type { ArtikelText } from './fedlex/typen.ts';
import { entferneTags, entferneFussnotenSups } from './fedlex/text.ts';
import { findeDlEnde } from './fedlex/enden.ts';
import { parseDefinitionsListe, ergaenzeFortsetzungsTiefe } from './fedlex/listen.ts';
import { parseFedlexTabelle, parseRohTabelle } from './fedlex/tabellen.ts';
import { alleImgTags, bildAusImg, parseBildKacheln, ergaenzeFehlendeBilder, markiereFormeln } from './fedlex/bilder.ts';

// ─── Fassade (W2·27-BUND-FERTIG PR 0, 2.10.2026) ──────────────────────────────
// Split nach fachlicher Kohäsion in `./fedlex/*` — alle bisherigen Exporte bleiben unter
// diesem Pfad erreichbar (Importeure unverändert). Neue Logik gehört in das passende Modul.
export type { ArtikelText, BildRef, AnhangText } from './fedlex/typen.ts';
export { entferneFussnotenSups, entferneTags } from './fedlex/text.ts';
export { findeDlEnde, findeDdEnde, findeSectionEnde, findeTableEnde } from './fedlex/enden.ts';
export { alleArtikelTokens, alleSchlussteilAnker, ankerZuToken, schlussteilLabelSuffix } from './fedlex/anker.ts';
export {
  anhangContainerEId,
  alleAnhangAnker,
  extrahiereAnhang,
  anhangLabelVonAnker,
} from './fedlex/anhang.ts';

/**
 * Extrahiert einen einzelnen Artikel aus einem Fedlex-Filestore-HTML.
 *
 * @param html  - Volltext des heruntergeladenen HTML-Dokuments
 * @param token - Artikel-ID ohne Präfix «art_», z.B. «77», «335_c», «19_a»
 * @returns     ArtikelText mit Absatz-Blöcken, oder null wenn Anker fehlt
 */
export function extrahiereArtikel(html: string, token: string): ArtikelText | null {
  // Haupttext-Artikel: Anker = «art_<token>». Delegiert an die anker-basierte
  // Variante (byte-gleich; der Anker wird nur explizit benannt).
  return extrahiereArtikelAusAnker(html, `art_${token}`);
}

/**
 * Wie extrahiereArtikel, aber mit dem VOLLEN Anker statt nur der Artikel-Nr. —
 * z.B. «art_335_c» (Haupttext) ODER «disp_u1/art_1» (Schlusstitel/UeB, M13).
 * Die Block-Parserei darunter ist identisch; nur das gesuchte <article id="…">
 * unterscheidet sich. So fällt der Schlusstitel (eigenes Anker-Schema
 * `disp_uN/art_*`, von alleArtikelTokens digit-only nicht erfasst) nicht mehr
 * stumm weg (§7-Vollabdeckung), ohne den Haupttext-Pfad anzufassen.
 * @param ankerRoh - Voller Anker, optional mit Synthese-Suffix «__2» (N-tes
 *                   Vorkommen bei doppelter id, s. alleArtikelTokens/alleSchlussteilAnker).
 */
export function extrahiereArtikelAusAnker(html: string, ankerRoh: string): ArtikelText | null {
  const artikelRoh = artikelRohHtml(html, ankerRoh);
  if (artikelRoh === null) return null;

  // Fussnoten-Apparat (<div class="footnotes">…</div>) und Artikel-Überschrift
  // (<h6>…</h6>, trägt eine Heading-Fussnote) sind KEIN Normtext und werden vorab
  // entfernt — sonst leckt der Fallback-Pfad (unnummerierte plain-<p>-Artikel wie
  // BETMG/VStrR) den Fussnotentext + Marker in den Normtext (Bug-Check 23.6.2026).
  // Der Haupt-Loop matcht diese Elemente ohnehin nicht; nur der Fallback profitiert.
  const innerRoh = artikelRoh
    .replace(/<div\s+class="footnotes">[\s\S]*$/i, '') // Apparat steht am Artikelende
    .replace(/<h6\b[^>]*>[\s\S]*?<\/h6>/gi, '');

  // W2·27: G-AUFH-ART aus dem ROHEN Artikel-HTML (artikelRoh trägt <h…> + Fussnoten-Apparat, die innerRoh gerade verlor); Shape sonst unverändert.
  return artikelTextMitAufhebung(artikelRoh, parseArtikelInner(innerRoh));
}

/**
 * Wie {@link extrahiereArtikelAusAnker}, aber liefert je Snapshot-Block ZUSÄTZLICH
 * seinen Quell-HTML-Span (`quellen[i]`, deckungsgleich mit `bloecke[i]`). Damit
 * kann ein Aufrufer (Fussnoten-Positionierung, A31a) einen Marker seinem
 * AUTHENTISCHEN Snapshot-Block zuordnen — mit exakt derselben Absatz-Numerierung
 * wie der Snapshot, statt einer zweiten, driftenden Block-Parserei. `bloecke`
 * ist byte-gleich zum bisherigen Pfad (Golden-Tor beweist es). Der übergebene
 * `innerRoh` hat Kopf-<h6> + Fussnoten-Apparat bereits entfernt → ein
 * Kopf-/Marginalien-Marker liegt in KEINEM Block-Quelltext (`quellen`), bleibt
 * also Artikelebene. So wird der absatzlose Fliesstext-Marker (fn 667 in ZGB
 * 798a) vom Kopf-Marker (fn 666) unterscheidbar.
 */
export function parseArtikelInner(innerRoh: string): ArtikelText & { quellen: (string | null)[] } {
  // G23 (M8): Delegationsnorm-Verweis <p class="man-template-referenz">(Art. N ArG)</p>
  // direkt nach der Überschrift — bisher von keiner Block-Alternative erfasst und
  // stumm verloren (~7100 Verordnungs-Bestimmungen). Als artikel-level `grundlage`
  // erhalten (amtlicher Inhalt, §2/§8) und aus dem Body entfernen, damit er nicht
  // in den Fallback-Text leakt. Die Marke trägt vereinzelt einen Fussnoten-<sup>.
  //
  // P3 (W2·5b): 6 Verordnungen (ATSV/FZV/BankV/FINIV/FinfraV/ArGV5) tragen
  // DENSELBEN Trägernorm-Verweis unter der SCHLANKEN Klasse `class="referenz"`
  // statt `man-template-referenz` — 347 Bestimmungen, die die alte, eng
  // wortgebundene Regex still verwarf (korpusweite Klassen-Inventur 5.7.2026,
  // Beleg bibliothek/register/p3-drop-klassen-inventar-2026-07-05.md). Beide
  // Formen sind derselbe amtliche Inhalt → EIN word-gebundenes `referenz`
  // matcht beide (auch innerhalb «…-referenz» greift die \b-Grenze).
  const refRe = /<p\b[^>]*\bclass="[^"]*\breferenz\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i;
  const refMatch = innerRoh.match(refRe);
  const grundlage = refMatch ? entferneTags(entferneFussnotenSups(refMatch[1])) || undefined : undefined;
  const inner = innerRoh.replace(new RegExp(refRe.source, 'gi'), '');
  const mitGrundlage = grundlage ? { grundlage } : {};

  // <p>-Absätze UND <dl>-Aufzählungen in DOKUMENTREIHENFOLGE durchlaufen
  // (Geschwister im collapseable-div). Vier Alternativen:
  //  (1) <p class="…absatz…">                — Standard-Absatz neuerer Konsolidierungen.
  //  (2) <p> mit führendem <sup>N</sup>       — ältere Erlasse (IPRG/BetmG/VStrR)
  //      setzen die Absatznummer als nacktes <sup> OHNE absatz-Klasse.
  //  (3) <p> UNMITTELBAR vor einer <dl>       — Einleitungssatz/Label einer Liste
  //      ohne absatz-Klasse («…es sei denn:», «Erste Klasse»). Lookahead konsumiert
  //      die <dl> nicht → (4) hängt sie an genau diesen Block.
  //  (4) <dl>                                 — Aufzählung am vorausgehenden Block.
  // (2)/(3) tragen eine Einzel-<p>-Schranke ((?!</p>)) — sonst spannt der Match
  // über mehrere Absätze und verschmilzt z.B. SchKG art_219 Abs. 5 (Bug 23.6.2026).
  // Bestehende Gesetze (class="absatz"-Markup) treffen (1) zuerst → unberührt,
  // ausser sie tragen echte alte Listen-Labels (dann korrekt verbessert, §6-Re-Baseline).
  //  (5) <table> — Mehrspalten-Tabelle (Rententabellen u.ä.); wird als GANZES
  //      konsumiert, damit ihre Zellen-<p> nicht einzeln matchen, und als
  //      mehrspaltig-Block geführt (sonst kompletter Verlust, Bug 23.6.2026).
  const NICHT_P = '(?:(?!</p>)[\\s\\S])*?';
  // Die <dl>-Alternative matcht NUR den Öffnungs-Tag (match[4] === ''); ihr Ende
  // wird im Loop BALANCIERT bestimmt (findeDlEnde), weil Fedlex verschachtelte
  // <dl> in <dd> setzt (lit. → nummerierte Unterpunkte, z.B. MStG art_42, KVV
  // art_30). Ein non-greedy `[\s\S]*?</dl>` stoppte sonst am ERSTEN — also dem
  // INNEREN — </dl> und verlor lit-Ebene + Einleitung (Bug 25.6.2026, §1).
  const bloeckeUndListenRe = new RegExp(
    '<p[^>]*\\bclass="[^"]*\\babsatz\\b[^"]*"[^>]*>([\\s\\S]*?)</p>' +
      `|<p[^>]*>((?:\\s|&nbsp;|<\\/?inl>)*<sup\\b[^>]*>\\d+(?:bis|ter|quater|quinquies)?[a-z]?</sup>${NICHT_P})</p>` +
      `|<p[^>]*>(${NICHT_P})</p>(?=\\s*<dl)` +
      '|(<dl[^>]*>)' +
      '|<table[^>]*>([\\s\\S]*?)</table>' +
      // Bild-Absatz (Formel/Piktogramm als Standalone-<p> mit <img>) — bisher von
      // keiner Alternative erfasst → stumm verworfen. Kommt NACH den obigen, damit
      // Absatz/Tabelle Vorrang behalten (1.7.2026).
      '|<p[^>]*>((?:(?!</p>)[\\s\\S])*?<img\\b[^>]*>(?:(?!</p>)[\\s\\S])*?)</p>' +
      // P3 (W2·5b): STANDALONE <p class="…man-template-tab-krpr…"> — tabellen-artige Zeile AUSSERHALB
      // eines <table>: OR art_361/362 (Listen der (un)abdingbaren Vorschriften), VRV (redaktionelle
      // Verweis-Noten «* Vgl. Art. 18.»). Beides war stiller Normtext-Verlust (89 Zeilen OR + 8 VRV;
      // Inventur 5.7.2026). Steht ZULETZT: echte Tabellen (Alt 5) konsumieren ihre Zellen-<p> vorher,
      // Absatz/Bild behalten Vorrang. Beleg: p3-drop-klassen-inventar-2026-07-05.md.
      // Alt 8 (P3b, W2·27-BUND-FERTIG): dieselbe Note als absatz8pt (VRV ab 20261001) → stern-note.ts
      '|<p[^>]*\\bclass="[^"]*man-template-tab-krpr[^"]*"[^>]*>((?:(?!</p>)[\\s\\S])*?)</p>' + `|${STERN_NOTE_ALTERNATIVE}` + `|${ZIFFER_TITEL_ALTERNATIVE}`,
    'gi',
  );
  const bloecke: ArtikelText['bloecke'] = [];
  // A31a: je Block sein Quell-HTML-Span (deckungsgleich mit bloecke). Damit ordnet
  // die Fussnoten-Positionierung einen Marker seinem authentischen Block zu.
  const quellen: (string | null)[] = [];

  let match: RegExpExecArray | null;
  while ((match = bloeckeUndListenRe.exec(inner)) !== null) {
    // Leer-Match-Schutz: bei einem Null-Längen-Treffer (theoretisch) lastIndex
    // vorrücken, damit der Loop nicht hängt.
    if (match[0] === '') { bloeckeUndListenRe.lastIndex++; continue; }
    const vorBlockZahl = bloecke.length;
    // Quell-Span des Matches: für Absatz/Tabelle/Bild = match[0]; für <dl> nur der
    // Öffnungs-Tag → auf den balancierten Voll-<dl>-Bereich erweitern (unten gesetzt).
    let matchQuelle = match[0];
    if (match[5] !== undefined) {
      // ── Tabelle (<table><tr><th>…</th></tr><tr><td>…</td></tr></table>) ──────
      // M10: kanonisches spalten-Modell (rechteckig, Staffel verdichtet, T-B1).
      // Lässt sich keine wortlauttreue Rechteck-Form herstellen (ragged/Prosa),
      // bleibt der Alt-Parse {kopf,zeilen} erhalten — exakte Nicht-Regression,
      // der Renderer rendert Legacy weiter (T-E5); der Validator listet sie.
      // Reiner Piktogramm-Katalog (SSV Anhang 2 u.ä.) → flaches Kachel-Raster.
      const kacheln = parseBildKacheln(match[5]);
      if (kacheln) {
        bloecke.push({ absatz: null, text: '', bildKacheln: kacheln });
      } else {
        const norm = normalisiereTabelle(parseRohTabelle(match[5]));
        if (norm) {
          bloecke.push({ absatz: null, text: '', mehrspaltig: { spalten: norm.spalten, zeilen: norm.zeilen } });
        } else {
          const mehr = parseFedlexTabelle(match[5]);
          if (mehr.zeilen.length > 0) bloecke.push({ absatz: null, text: '', mehrspaltig: mehr });
        }
        // GEMISCHTE Tabelle mit Bildern (z.B. SSV Anhang 3 Illustration): Tabelle
        // bleibt Tabelle (§1), die Bilder werden dennoch erfasst (Containment) und
        // nach der Tabelle als eigene Bild-Blöcke angehängt.
        for (const img of alleImgTags(match[5])) {
          const b = bildAusImg(img);
          b.alt = 'Amtliche Abbildung';
          bloecke.push({ absatz: null, text: '', bild: b });
        }
      }
    } else if (match[1] !== undefined || match[2] !== undefined || match[3] !== undefined) {
      // ── Absatz (<p class="absatz"> | <p><sup>N</sup> | <p> vor <dl>) ──────
      const roh = match[1] ?? match[2] ?? match[3]!;

      // Absatznummer: erstes <sup>, das KEIN <a>-Kind enthält und nur Ziffern/[a-z] enthält.
      // Fussnoten-<sup> sehen so aus: <sup><a href="...">188</a></sup> → verwerfen.
      const supMatch = roh.match(/^(?:\s|&nbsp;|<\/?inl>)*<sup(?:[^>]*)>([\s\S]*?)<\/sup>/i);
      let absatz: string | null = null;
      // Regex, die die erkannte Absatz-Nummer (ein ODER — bei gespaltenem Suffix —
      // zwei <sup>) vom Roh-Text abtrennt. Default deckt den Ein-<sup>-Fall.
      let absatzNrStrip =
        /^(?:\s|&nbsp;|<\/?inl>)*<sup[^>]*>\d+(?:bis|ter|quater|quinquies)?[a-z]?<\/sup>(?:&nbsp;|\s|<\/?inl>)*/i;
      if (supMatch && !/<a[\s>]/i.test(supMatch[1])) {
        const supInhalt = supMatch[1].trim();
        // GESPALTENES Suffix ZUERST prüfen: Fedlex trennt Ziffer und lat. Suffix in
        // ZWEI benachbarte <sup> — «<sup>1</sup><sup>bis</sup>» statt «<sup>1bis</sup>»
        // (empirisch GEBV_SCHKG art_9, HMG art_9/67, KLV art_7, CO2_GESETZ art_16,
        // VRV art_67, AVIG). Der erste <sup> matcht sonst schon als solo-«1», und das
        // «bis» leakt als Text-Präfix in den nächsten Block. Nur verkleben, wenn das
        // ZWEITE <sup> ein Suffix-Wort oder ein einzelner Buchstabe ist — NIE eine
        // reine Ziffer, damit ein Exponent («72³», «133¹⁄₃») nie zur Nummer wird (§1).
        const split = /^\d+$/.test(supInhalt)
          ? roh.match(
              /^(?:\s|&nbsp;|<\/?inl>)*<sup[^>]*>\s*(\d+)\s*<\/sup>(?:&nbsp;|\s|<\/?inl>)*<sup[^>]*>\s*([^<]*?)\s*<\/sup>/i,
            )
          : null;
        // Nur LIVE-Absätze verkleben: folgt nach dem Suffix ein Konnektor / eine
        // Ellipsis / ein weiteres <sup> («2bis und 2ter …»), ist das ein AUFGEHOBENER
        // Absatz-Bereich (R7), kein Live-Absatz (AVIG art_13) — dann NICHT verkleben,
        // sonst leakt «und 2ter» in den Text. Solche Bereiche bleiben im Baseline-
        // Zustand und werden in der R7-Aufgehoben-Arbeit einheitlich behandelt.
        // Leerraum + Spacer-<sup> («<sup>&nbsp;</sup>», HMG art_67) vor dem Test
        // wegnormalisieren; ein Bereich zeigt sich an Konnektor/Ellipsis oder einem
        // NICHT-leeren Folge-<sup> («und 2ter …», AVIG art_13).
        const restNorm = (split ? roh.slice(split[0].length) : '').replace(
          /^(?:\s|&nbsp;|<sup[^>]*>(?:\s|&nbsp;)*<\/sup>)*/i,
          '',
        );
        const istBereich = /^(?:und\b|oder\b|sowie\b|,|;|\.|…|<sup)/i.test(restNorm);
        if (
          split &&
          !istBereich &&
          !/<a[\s>]/i.test(split[2]) &&
          /^(?:bis|ter|quater|quinquies|[a-z])$/i.test(split[2].trim())
        ) {
          absatz = split[1] + split[2].trim();
          absatzNrStrip =
            /^(?:\s|&nbsp;|<\/?inl>)*<sup[^>]*>\s*\d+\s*<\/sup>(?:&nbsp;|\s|<\/?inl>)*<sup[^>]*>\s*(?:bis|ter|quater|quinquies|[a-z])\s*<\/sup>(?:&nbsp;|\s|<\/?inl>)*/i;
        } else if (/^\d+(?:bis|ter|quater|quinquies)?[a-z]?$/.test(supInhalt)) {
          // Ein-<sup>-Fall (unverändert): «<sup>1bis</sup>» / «<sup>2</sup>».
          absatz = supInhalt;
        }
      }

      // Fussnoten-<sup><a ...>…</a></sup> entfernen, BEVOR entferneTags läuft —
      // sonst bleibt die Zahl (z.B. «188») als Text stehen.
      const ohneFootnotes = entferneFussnotenSups(roh);

      // Absatznummer-<sup>(s) aus dem Roh-Text entfernen, damit die Ziffer nicht
      // in den sichtbaren Text einfließt (bei gespaltenem Suffix beide <sup>).
      const ohneAbsatzNr = absatz ? ohneFootnotes.replace(absatzNrStrip, '') : ohneFootnotes;

      const text = entferneTags(ohneAbsatzNr).trim();
      if (text) {
        bloecke.push({ absatz, text });
      }
      // Bild im Absatz (selten, aber kein stiller Verlust — Containment): nach dem
      // Text als eigener Bild-Block. `<p class="bild">`-Standalone landet dagegen in
      // match[6]; hier nur Bilder, die IN einem Text-Absatz stecken.
      for (const img of alleImgTags(ohneAbsatzNr)) {
        const b = bildAusImg(img);
        b.alt = 'Amtliche Abbildung';
        bloecke.push({ absatz: null, text: '', bild: b });
      }
    } else if (match[4] !== undefined) {
      // ── Aufzählung (<dl><dt>marke.</dt><dd>text</dd>…</dl>) ───────────────
      // Balancierte <dl>…</dl>-Klammer: match[4] ist nur der Öffnungs-Tag; das
      // PASSENDE schliessende </dl> wird über die Tag-Tiefe gefunden, damit
      // verschachtelte <dl> (lit. → nummerierte Unterpunkte) komplett erfasst
      // werden (Bug 25.6.2026). dlInner = Inhalt OHNE äusseres <dl>/</dl>.
      const ende = findeDlEnde(inner, match.index);
      const dlInner = inner.slice(match.index + match[4].length, ende - '</dl>'.length);
      matchQuelle = inner.slice(match.index, ende); // voller <dl>…</dl>-Span (A31a-Quelle)
      bloeckeUndListenRe.lastIndex = ende; // verschachtelte <dl>/<dt> nicht erneut matchen
      const items = parseDefinitionsListe(dlInner);
      if (items.length > 0) {
        if (bloecke.length > 0) {
          // Befund 6 (26.7.2026): hängt die Liste an einem BILD-Block (Formel-<p>
          // hat eine verschachtelte Aufzählung unterbrochen) und beginnt sie
          // flach mit dem Ziffern-NACHFOLGER der unterbrochenen Unterliste,
          // erbt die führende Nachfolger-Kette deren Tiefe. Amtlich verifiziert
          // (DBG 22 «2.» nach image2 / STHG 7: PDF-Einrückung = Ziffern-Ebene).
          // ENG begrenzt: nur Bild-Blöcke, nur Ziffern, nur direkte Nachfolger —
          // sonst bleibt alles byte-gleich (§1: keine breite Heuristik).
          const ziel = bloecke[bloecke.length - 1] as { bild?: unknown; bildKacheln?: unknown[] };
          if (ziel.bild != null || (ziel.bildKacheln != null && ziel.bildKacheln.length > 0)) {
            ergaenzeFortsetzungsTiefe(bloecke, items);
          }
          bloecke[bloecke.length - 1].items = items;
        } else {
          // Liste ohne vorangehenden Absatz (selten) → eigener Block.
          bloecke.push({ absatz: null, text: '', items });
        }
      }
    } else if (match[6] !== undefined) {
      // ── Bild-Absatz (Formel/Piktogramm als Standalone-<p> mit <img>) ─────────
      // Der <p> kann NEBEN dem <img> echten Normtext tragen (Formel-/Bild-
      // Adjazenz): z.B. VTS art_123 Abs. 3 «…richtet sich nach folgender Formel:»
      // <img> gefolgt von «Türen zählen ebenfalls als Notausstiege. …». Bisher
      // wurde NUR das <img> erfasst und der (nach-/vor-)stehende Text stumm
      // verworfen (§1). Jetzt werden Text-Läufe und Bilder in Dokumentreihenfolge
      // als eigene Blöcke geführt. Für den Regelfall (reiner <p class="bild"> mit
      // nur einem <img>) bleibt das Ergebnis byte-gleich: leere Läufe erzeugen
      // keinen Block (§6). Fussnoten-<sup><a>…</a></sup> VOR entferneTags tilgen,
      // sonst leakt die Fussnoten-Ziffer in den Text.
      const innerBild = entferneFussnotenSups(match[6]);
      const imgReAdj = /<img\b[^>]*>/gi;
      let letzteAdj = 0;
      let imgM: RegExpExecArray | null;
      while ((imgM = imgReAdj.exec(innerBild)) !== null) {
        const vor = entferneTags(innerBild.slice(letzteAdj, imgM.index)).trim();
        if (vor) bloecke.push({ absatz: null, text: vor });
        const b = bildAusImg(imgM[0]);
        b.alt = 'Amtliche Abbildung';
        bloecke.push({ absatz: null, text: '', bild: b });
        letzteAdj = imgReAdj.lastIndex;
      }
      const nach = entferneTags(innerBild.slice(letzteAdj)).trim();
      if (nach) bloecke.push({ absatz: null, text: nach });
    } else if (match[7] !== undefined || match[8] !== undefined) {
      // ── Standalone-tab-krpr-Zeile (P3, W2·5b) ────────────────────────────
      // Nicht-Tabellen-<p class="…man-template-tab-krpr…"> = eine tabellen-artige
      // Aufzählungs-/Verweis-Zeile ausserhalb eines <table>. Verbatim als eigener
      // Text-Block (absatz:null) — faithful, kein Marke-Erfinden (§1/§8). Fussnoten
      // vor entferneTags tilgen (sonst leakt die Ziffer, vgl. Absatz-Pfad).
      const txt = entferneTags(entferneFussnotenSups(match[7] ?? match[8]!)).trim();
      if (txt) bloecke.push({ absatz: null, text: txt });
    } else if (match[9] !== undefined) zifferTitelZu(bloecke, entferneTags(entferneFussnotenSups(match[9]))); // P6
    // Alle in dieser Iteration erzeugten Blöcke tragen denselben Quell-Span (A31a).
    for (let qi = vorBlockZahl; qi < bloecke.length; qi++) quellen[qi] = matchQuelle;
  }

  // Fallback: kein einziger <p class="absatz"> gefunden → ganzen Artikel-Text zurückgeben.
  // WICHTIG (Bug-Befund 25.6.2026): auch hier die Fussnoten-<sup><a>…</a></sup>
  // entfernen, BEVOR entferneTags läuft — sonst leakt die Fussnoten-Ziffer in den
  // Normtext (z.B. DBG art_222 «…1995 337», VwVG art_17). Betrifft Artikel, deren
  // einziger Inhalt ein <p> mit Nicht-«absatz»-Klasse ist (class="inkrafttreten" u.ä.),
  // das keinen Block-Zweig trifft. Mehrfach-Leerzeichen (nach Marker-Entfernung
  // mitten im Satz) auf eines reduzieren.
  if (bloecke.length === 0) {
    const text = entferneTags(entferneFussnotenSups(inner)).replace(/^\s*Art\.\s*\S+\s*/, '').replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();
    if (text) return { ...mitGrundlage, bloecke: [{ absatz: null, text }], quellen: [inner] };
    // Leerer Artikel-Körper (Fedlex rendert aufgehobene, aber noch nummerierte
    // Artikel als blosse Überschrift mit leerem <div class="collapseable">, z.B.
    // SVG art_107): faithful als «aufgehoben»-Block darstellen (Konvention «…»,
    // NormPopover zeigt «aufgehoben»). So bleibt der Artikel in der
    // Vollständigkeit erfasst statt stumm zu fehlen (§8 Ehrlichkeit, kein
    // Aufweichen des Vollständigkeitstests).
    return { ...mitGrundlage, bloecke: [{ absatz: null, text: '…' }], quellen: [null] };
  }

  ordneZiffern(bloecke, quellen); ergaenzeFehlendeBilder(bloecke, inner);
  markiereFormeln(bloecke);
  // Nachträglich ergänzte reine Bild-Blöcke (ohne Quell-Span) längentreu auffüllen
  // (tragen nie einen Fussnoten-Marker) → quellen bleibt deckungsgleich mit bloecke.
  while (quellen.length < bloecke.length) quellen.push(null);
  return { ...mitGrundlage, bloecke, quellen };
}
