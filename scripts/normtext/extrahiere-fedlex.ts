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

export interface ArtikelText {
  /** G-AUFH-ART (W2·27) — GANZER Artikel amtlich aufgehoben. Regel + Belege + die Grenze «kein Signal ≠ gilt» (§7): `aufhebung-signal.ts`. */
  aufgehoben?: true;
  /** G23 (M8): Delegationsnorm-Verweis «(Art. N ArG)» aus
   *  <p class="man-template-referenz"> — die Trägergesetz-Grundlage, auf der eine
   *  Verordnungsbestimmung beruht. Steht in Fedlex direkt unter der Überschrift;
   *  wurde bisher von keiner Block-Alternative erfasst und stumm verworfen. */
  grundlage?: string;
  bloecke: Array<{
    absatz: string | null;
    text: string;
    /** M13-Annex: Unter-Überschrift INNERHALB eines Anhangs (Ziffer-Titel,
     *  h2–h6 der Anhang-Sektionen). Wert = Heading-Tiefe (2–6). Reiner
     *  Render-Hinweis (wie `absatz`), fliesst NICHT in den sha — der Titel-Text
     *  steht in `text` und ist dort abgedeckt. Nur Anhang-Einträge tragen das
     *  Feld; bestehende Artikel nie → golden-neutral (additiv). */
    titel?: number;
    items?: Array<{ marke: string; text: string; tiefe?: number; trenner?: string }>;
    /** Fedlex-<table> als Mehrspalten-Block (Bug-Fix 23.6.2026: Tabellen wurden
     *  zuvor komplett gedroppt — z.B. IVG art_28b Rententabelle, AHVG art_34bis).
     *  M10: kanonisches `spalten`-Modell (T-B1) statt rohem `{kopf,zeilen}`. */
    mehrspaltig?: {
      spalten?: Array<{ typ: 'bereich' | 'zahl' | 'text' | 'betrag'; titel: string }>;
      kopf?: string[];
      zeilen: string[][];
    };
    /** Bilder/Formeln (Bündel «Bilder & Formeln», 1.7.2026): Fedlex liefert
     *  Piktogramme (SSV/VTS/chem. Warnzeichen) UND Formeln als `<img>`. `entferneTags`
     *  verwarf sie bisher stumm. `bild` = EIN Standalone-Bild/Formel (`<p class="bild">
     *  <img>`); `bildKacheln` = flaches Karten-Raster aus einem reinen Piktogramm-Katalog
     *  (SSV Anhang 2). `datei` trägt nach der Extraktion die RELATIVE Quell-src
     *  («image/imageN.png»); der Generator (normtext-snapshot) rechnet sie zur amtlichen
     *  Filestore-URL, lädt herunter, setzt `datei` auf den lokalen Pfad + `sha`. */
    bild?: BildRef;
    bildKacheln?: Array<{ bild?: BildRef; nummer?: string; name?: string }>;
  }>;
}

export interface BildRef {
  /** Nach Extraktion: relative Quell-src («image/imageN.png»). Nach Generator-
   *  Lauf: lokaler Pfad («bilder/<erlass>/imageN.png»). */
  datei: string;
  alt: string;
  formel?: boolean;
  breite?: number;
  hoehe?: number;
  /** sha256 über die Bild-Bytes (§7-Drift) — vom Generator gesetzt. */
  sha?: string;
}

import { artikelTextMitAufhebung } from './aufhebung-signal.ts';
import { dekodiereEntities } from './html-entities.ts';
import { normalisiereTabelle, type RohTabelle, type RohZelle } from './tabelle-normalisieren.ts';

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
 * Roh-Inhalt des <article id="…">-Elements zu `ankerRoh` (ohne die
 * <article>-Tags selbst), inkl. Kopf-<h6> und Fussnoten-Apparat.
 *
 * W2·27 (15.9.2026) aus {@link extrahiereArtikelAusAnker} herausgezogen, damit
 * die Anker-Auflösung EINE Wahrheit bleibt (§5): Block-Parser und die
 * Label-Ableitung bei doppelter id (doppel-id-label.ts) greifen auf denselben
 * Artikel zu, statt die Vorkommens-Regex zweimal zu führen.
 *
 * @param ankerRoh - Voller Anker, optional mit Synthese-Suffix «__2» (N-tes
 *                   Vorkommen bei doppelter id, s. alleArtikelTokens/alleSchlussteilAnker).
 */
export function artikelRohHtml(html: string, ankerRoh: string): string | null {
  // M9/G7: doppelte id. Ein Erlass kann ZWEI <article id="…"> mit identischem
  // Anker tragen (KKV art_126_z: «Anlagebeschränkungen» + «126z tredecies
  // Wesentliche Mängel»; betmg/vwvg/pavo: aufgehobene Bereichs-Artikel «15a–15c»).
  // alleArtikelTokens/alleSchlussteilAnker vergeben dem 2./3. Vorkommen einen
  // Synthese-Suffix «__2»/«__3»; hier extrahieren wir dann das N-te Vorkommen des
  // BASIS-Ankers. Ohne Suffix (Normalfall) = erstes Vorkommen, byte-gleich.
  const suffix = ankerRoh.match(/^(.*)__(\d+)$/);
  const basisAnker = suffix ? suffix[1] : ankerRoh;
  const nth = suffix ? Number(suffix[2]) : 1;
  // Escape des Ankers für die Regex (Unterstriche und «/» sind literal, kein
  // Sonderzeichen — der «/»-Trenner des disp-Schemas bleibt unberührt).
  const escapedToken = basisAnker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const articleRe = new RegExp(
    `<article[^>]*\\sid="${escapedToken}"[^>]*>([\\s\\S]*?)</article>`,
    'gi',
  );
  const treffer = [...html.matchAll(articleRe)];
  const articleMatch = treffer[nth - 1];
  return articleMatch ? articleMatch[1] : null;
}

/**
 * Wie extrahiereArtikel, aber mit dem VOLLEN Anker statt nur der Artikel-Nr. —
 * z.B. «art_335_c» (Haupttext) ODER «disp_u1/art_1» (Schlusstitel/UeB, M13).
 * Die Block-Parserei darunter ist identisch; nur das gesuchte <article id="…">
 * unterscheidet sich. So fällt der Schlusstitel (eigenes Anker-Schema
 * `disp_uN/art_*`, von alleArtikelTokens digit-only nicht erfasst) nicht mehr
 * stumm weg (§7-Vollabdeckung), ohne den Haupttext-Pfad anzufassen.
 *
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
      // P3 (W2·5b): STANDALONE <p class="…man-template-tab-krpr…"> — eine
      // tabellen-artige Zeile, die NICHT in einem <table> steckt. Fedlex rendert
      // damit Aufzählungen ausserhalb echter Tabellen: OR art_361/362 listen so
      // die (un)abdingbaren Vorschriften («Artikel 321c: Absatz 1 …»), VRV führt
      // damit redaktionelle Verweis-Noten («* Vgl. Art. 18.»). Beides war stiller
      // Normtext-Verlust (89 Zeilen OR + 8 VRV; korpusweite Inventur 5.7.2026).
      // Steht ZULETZT: echte Tabellen (Alt 5) konsumieren ihre Zellen-<p> vorher,
      // Absatz/Bild behalten Vorrang. Beleg: p3-drop-klassen-inventar-2026-07-05.md.
      '|<p[^>]*\\bclass="[^"]*man-template-tab-krpr[^"]*"[^>]*>((?:(?!</p>)[\\s\\S])*?)</p>',
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
    } else if (match[7] !== undefined) {
      // ── Standalone-tab-krpr-Zeile (P3, W2·5b) ────────────────────────────
      // Nicht-Tabellen-<p class="…man-template-tab-krpr…"> = eine tabellen-artige
      // Aufzählungs-/Verweis-Zeile ausserhalb eines <table>. Verbatim als eigener
      // Text-Block (absatz:null) — faithful, kein Marke-Erfinden (§1/§8). Fussnoten
      // vor entferneTags tilgen (sonst leakt die Ziffer, vgl. Absatz-Pfad).
      const txt = entferneTags(entferneFussnotenSups(match[7])).trim();
      if (txt) bloecke.push({ absatz: null, text: txt });
    }
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

  ergaenzeFehlendeBilder(bloecke, inner);
  markiereFormeln(bloecke);
  // Nachträglich ergänzte reine Bild-Blöcke (ohne Quell-Span) längentreu auffüllen
  // (tragen nie einen Fussnoten-Marker) → quellen bleibt deckungsgleich mit bloecke.
  while (quellen.length < bloecke.length) quellen.push(null);
  return { ...mitGrundlage, bloecke, quellen };
}

/**
 * Fortsetzungs-Tiefe (Befund 6, 26.7.2026): Items, die an einen Bild-Block
 * angehängt werden, setzen eine vom Formelbild unterbrochene Unterliste fort,
 * wenn ihre führenden Marken die Ziffern-Sequenz der Unterliste DIREKT
 * weiterzählen. Dann erben genau diese führenden Items die Tiefe des letzten
 * Items der unterbrochenen Liste. Deterministisch und eng begrenzt (§1/§2):
 * nur reine Ziffern-Marken, nur der unmittelbare Nachfolger (n → n+1), Abbruch
 * an der ersten Nicht-Nachfolger-Marke oder an bereits struktur-vertiefter
 * Position. Amtlicher Beleg: DBG SR 642.11 Art. 22 (PDF 1.1.2026 S. 17) und
 * STHG SR 642.14 Art. 7 (PDF 1.1.2025 S. 6/7) — Fortsetzungs-«2.» steht auf
 * der Ziffern-Einrückung, nicht auf der lit.-Ebene.
 */
function ergaenzeFortsetzungsTiefe(
  bloecke: ArtikelText['bloecke'],
  items: Array<{ marke: string; text: string; tiefe?: number }>,
): void {
  // Die unterbrochene Liste = nächstvorheriger Block mit items.
  let vorItems: Array<{ marke: string; tiefe?: number }> | undefined;
  for (let k = bloecke.length - 1; k >= 0; k--) {
    const its = bloecke[k].items;
    if (its != null && its.length > 0) { vorItems = its; break; }
  }
  if (vorItems == null) return;
  const letztes = vorItems[vorItems.length - 1];
  if (letztes.tiefe == null || letztes.tiefe <= 0 || !/^\d+$/.test(letztes.marke)) return;
  let vorNr = parseInt(letztes.marke, 10);
  for (const it of items) {
    if (it.tiefe != null || !/^\d+$/.test(it.marke) || parseInt(it.marke, 10) !== vorNr + 1) break;
    it.tiefe = letztes.tiefe;
    vorNr += 1;
  }
}

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
 * Zerlegt eine Fedlex-<dl>-Aufzählung in lit./Ziff.-Items — REKURSIV über
 * verschachtelte <dl> (lit.-Buchstabe → nummerierte Unterpunkte).
 *
 * Reale Struktur (SPIKE 16.6.2026, OR art_336/art_77):
 *   <dl><dt>a. </dt><dd>…Text;</dd><dt>b. </dt><dd>…</dd>…</dl>
 * Verschachtelt (MStG art_42, KVV art_30, MWSTV 126/127):
 *   <dl><dt>a. </dt><dd>Einleitung:<dl><dt>1. </dt><dd>…</dd>…</dl></dd>…</dl>
 * Die <dt>-Marke ist «a. », «1. » o.ä.; einzelne <dt> tragen einen
 * Fussnoten-<sup><a>…</a></sup> (z.B. «e.<sup><a>199</a></sup> »).
 *
 * marke = Buchstabe/Ziffer OHNE Punkt und ohne Fussnote ('a','b','17').
 * text  = bereinigter <dd>-Inhalt (Fussnoten-<sup> entfernt, Entities dekodiert);
 *         bei verschachteltem <dl> nur der Einleitungstext VOR der Unterliste.
 *
 * AUSGABE-MODELL (flach, abwärtskompatibel): Unterpunkte werden als weitere
 * Items NACH ihrem Eltern-Item in DOKUMENTREIHENFOLGE angehängt. Jedes Item
 * trägt eine EXPLIZITE `tiefe` (0 = direkte Liste des Absatzes, +1 je
 * verschachtelter <dl>). Damit muss die Lesesicht (ArtikelBody) die
 * Verschachtelung NICHT mehr aus den Marken-Typen RATEN — das Raten erzeugte
 * falsche Zitate, wenn Fedlex die übliche Reihenfolge umkehrt (Ziff. → lit.
 * statt lit. → Ziff.): die geratene Stufe entnestete die lit. fälschlich auf
 * Absatzebene und die Fundstelle wurde falsch (§1-Bug G8, M6 28.6.2026).
 *
 * `tiefe` wird NUR emittiert, wenn > 0 (verschachtelt). Top-Level-Items
 * (tiefe 0) bleiben byte-gleich zum bisherigen Modell {marke,text} → keine
 * unnötige Snapshot-Re-Segnung für nicht verschachtelte Erlasse; nur Artikel
 * MIT echter Verschachtelung brechen den Daten-Index (bewusst, §7).
 *
 * ── `trenner`: DER AMTLICHE MARKEN-TRENNER WIRD MITGEFÜHRT (#679, 12.9.2026) ──
 * Fedlex legt ZWEI verschiedene Dinge in dieselbe <dl><dt>-Struktur und
 * unterscheidet sie AM TRENNER hinter der Marke:
 *   «a. » / «1. » / «a) »  → Ordinalmarke einer echten Aufzählung (lit./Ziff.)
 *   «A: » / «BE: »         → LABEL (amtliche Kategorie, Kolonnen-/Legendenschlüssel)
 *   «BAS »                 → Label OHNE Trenner (Formelgrösse, AsylV 2 Art. 23)
 * Dieser Trenner ist amtliche Information; bis hierher verwarf ihn der Parser
 * (er diente nur intern zur Label-Erkennung) und die Lesesicht musste die Art
 * aus der Marken-SCHREIBWEISE raten («beginnt gross ⇒ Label»,
 * ArtikelBody.helfer.ts). Das Raten ist bei kleingeschriebenen Labels falsch
 * («für Witwen und Witwer:», UVG Art. 31) und erfindet bei «a)»/«BAS» einen
 * Punkt, den die amtliche Fassung nicht setzt. Wurzel (§5/§1): der Extraktor
 * führt den Trenner mit, Anzeige UND Zitat lesen ihn statt zu raten.
 *
 * Emittiert wird `trenner` NUR, wenn das Item NICHT der Normalfall
 * «kanonische Ordinalmarke + Punkt» ist (37 403 der 44 674 <dt> im gepinnten
 * Cache) — genau wie `tiefe` nur bei echter Verschachtelung erscheint. Damit
 * bleibt jedes bisher korrekte Item byte-gleich und nur die Artikel mit
 * abweichendem Trenner brechen den Daten-Index (bewusst, §7).
 * Werte: ':' (Label), ')' (Ordinalmarke mit Klammer), '.' (Punkt bei
 * NICHT-kanonischer Marke, z.B. «B. 1.» GFK Art. 1), '' (kein Trenner).
 */
function parseDefinitionsListe(
  dlInner: string,
  tiefe = 0,
  // M13-Annex: nur im Anhang-Pfad die erweiterte Marken-Erkennung (mehrteilige
  // gepunktete Ziffern «1.1.1», beschreibende Legenden-Schlüssel). Der Haupttext-
  // /Schlusstitel-Pfad bleibt BYTE-GLEICH (default false) — die Anhang-Korrektur
  // re-segnet bewusst KEINE bestehenden Artikel-Snapshots (§6/§1; die identische
  // Garbling-Klasse im Haupttext — Staatsverträge i→ii, Abkürzungs-Legenden — ist
  // ein eigener, deklarierter Folgeschritt mit Artikel-Re-Bless).
  anhang = false,
): Array<{ marke: string; text: string; tiefe?: number; trenner?: string }> {
  const items: Array<{ marke: string; text: string; tiefe?: number; trenner?: string }> = [];
  // Iterativer Scan über die direkten <dt>…<dd>-Paare DIESER Ebene. Ein <dd>
  // kann eine verschachtelte <dl> enthalten; deren Ende wird balanciert bestimmt
  // (findeDlEnde), damit das <dd>-Ende nicht am inneren </dl> falsch erkannt wird.
  const dtRe = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>/gi;
  // Befund 6 (26.7.2026): Fedlex setzt bei bild-unterbrochenen Aufzählungen die
  // Fortsetzungs-Unterliste als ANONYME <dl> DIREKT in die <dl> («<dl><dl><dt>2.…»,
  // DBG art_22/STHG art_7 nach dem ersten Formelbild). Der reine dt/dd-Scan
  // flachte sie ab (Ziff. landete auf lit.-Ebene, amtliche Einrückung verloren —
  // PDF-Beleg: Ziffern-x-Position, nicht lit-x). Darum: liegt VOR dem nächsten
  // <dt> eine direkte Unter-<dl>, wird sie rekursiv eine Stufe tiefer zerlegt.
  const dlRe = /<dl\b[^>]*>/gi;
  let pos = 0;
  while (pos < dlInner.length) {
    dtRe.lastIndex = pos;
    const m = dtRe.exec(dlInner);
    dlRe.lastIndex = pos;
    const d = dlRe.exec(dlInner);
    if (d && (m == null || d.index < m.index)) {
      // Anonyme direkte Unter-<dl> (nicht in einem <dd> — die konsumiert der
      // dt/dd-Zweig unten mitsamt seinem <dd>): rekursiv, eine Stufe tiefer.
      const anonEnde = findeDlEnde(dlInner, d.index);
      const anonInner = dlInner.slice(d.index + d[0].length, anonEnde - '</dl>'.length);
      for (const sub of parseDefinitionsListe(anonInner, tiefe + 1, anhang)) items.push(sub);
      pos = anonEnde;
      continue;
    }
    if (m == null) break;
    const ddStart = dtRe.lastIndex; // direkt nach dem <dd…>-Öffnungs-Tag
    // ── Ende dieses <dd> finden (balanciert über <dd>/</dd>) ──────────────
    const ddEnde = findeDdEnde(dlInner, ddStart);
    const ddRoh = dlInner.slice(ddStart, ddEnde);
    pos = ddEnde + '</dd>'.length; // hinter dieses </dd> springen

    // Verschachtelte <dl> in DIESEM <dd> abtrennen: Einleitungstext = vor der
    // Unterliste; die Unterliste wird rekursiv zerlegt und NACH dem Eltern-Item
    // eingehängt.
    const subDlIdx = ddRoh.search(/<dl\b[^>]*>/i);

    // Fussnoten-<sup><a>…</a></sup> aus der <dt>-Marke tilgen.
    const dtOhneFn = m[1].replace(/<sup[^>]*><a[\s\S]*?<\/a><\/sup>/gi, '');
    // Marke-Tags OHNE Leerzeichen strippen: das lat. Suffix steht als <sup>bis</sup>
    // direkt am Buchstaben («c<sup>bis</sup>»); entferneTags würde es zu «c bis»
    // trennen und die Regex unten verstümmelte es zu «c» (Bug-Audit 19.6.2026).
    // Innen-Leerraum normalisieren wie in entferneTags: Fedlex trennt mehrteilige
    // Marken mit zwei &nbsp; («B.&nbsp;&nbsp;1.», GFK Art. 1) — als Marke ist das
    // EIN Abstand, sonst trüge der Snapshot einen Doppelabstand im Zitat.
    const markeRoh = dekodiereEntities(dtOhneFn.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    // ── Die Marke wird GELESEN, nicht nachnummeriert ─────────────────────────
    // «a.» / «17.» / «a)» → nackte Marke ohne Punkt/Klammer.
    // Bug-Audit 19.6.2026: lat. Suffix bis/ter/quater/quinquies erhalten (sonst
    // «cbis»→«c», «1bis»→«1b»). Suffix VOR optionalem Buchstaben (wie ABS-Regex).
    //
    // BEFUND QS-KORPUS 4.9.2026 (§1, Diskrepanz-Finder PR #650): Beide früheren
    // Regexe griffen als PRÄFIX-Match. Was nicht ins kanonische lit./Ziff.-Muster
    // passte, wurde damit auf dessen ERSTES Token GEKÜRZT statt gelesen — aus dem
    // amtlichen «BE:» wurde «b», aus «C1E:» «c», aus «ii)» «i», aus «asexies.»
    // «a», aus «BAS» «b». Zwei Folgen, beide fachlich falsch: die amtliche
    // Bezeichnung war weg (VZV Art. 3 zitiert «Kategorie BE», nicht «lit. b»),
    // und die gekürzten Marken kollidierten INNERHALB desselben Absatzes
    // (VZV Art. 3 Abs. 1: a,b,c,d,b,c,d — «B» und «BE» beide als «b»).
    //
    // Neue Regel, eine für beide Pfade:
    //  (1) Endet die <dt>-Marke auf ':', ist sie ein LABEL (amtliche Kategorie,
    //      Kolonnen-/Legenden-Schlüssel) — verbatim übernehmen, Grossschreibung
    //      erhalten. Empirisch (gepinnter Cache, 229 Bund-HTMLs, art_*-Körper):
    //      51 Vorkommen in genau 3 Erlassen — VZV (Ausweiskategorien A…D1E),
    //      VBB (B/F/G/V/W, «Kolonne 1»), UVG («für Witwen und Witwer») — und
    //      KEINE davon ist eine gewöhnliche lit.-Aufzählung. Fedlex trennt
    //      Ordinalmarken mit '.'/')' und Labels mit ':'.
    //  (2) Sonst nur dann normalisieren (klein schreiben), wenn die GANZE Marke
    //      — ohne den nachgestellten Trenner — eine kanonische Ordinalmarke ist.
    //      Trifft das nicht zu, bleibt die Marke verbatim stehen. Damit ist jede
    //      bisher korrekte Marke byte-gleich und keine wird mehr erfunden (§1/§6).
    // Die lat. Suffixe reichen bis `decies`: «asexies.»/«anovies.» (HMG Art. 9,
    // FINMA-GebV) wurden zuvor auf «a» gekürzt.
    // Der Anhang-Pfad behält seine mehrteiligen Ziffern «1.1.1»/«211.1»
    // (M13-Annex) — sie sind hier Teil des kanonischen Musters.
    const LAT_SUFFIX = 'bis|ter|quater|quinquies|sexies|septies|octies|novies|decies';
    const KANONISCHE_MARKE = anhang
      ? new RegExp(`^(?:[0-9]+(?:\\.[0-9]+)*(?:${LAT_SUFFIX})?[a-z]?|[a-z](?:${LAT_SUFFIX})?)$`, 'i')
      : new RegExp(`^(?:[0-9]+(?:${LAT_SUFFIX})?[a-z]?|[a-z](?:${LAT_SUFFIX})?)$`, 'i');
    // AMTLICHER TRENNER (#679, s. Funktions-Doku §`trenner`): das letzte Zeichen
    // der normalisierten <dt>-Marke, wenn es ein Fedlex-Marken-Trenner ist —
    // sonst '' (kein Trenner, z.B. «BAS»). markeRoh ist bereits getrimmt; das
    // `\s*$` deckt nur den theoretischen Rest ab. Die Label-Erkennung liest
    // jetzt DIESEN Wert (eine Stelle, §5) statt eine zweite Regex.
    const trenner = markeRoh.match(/([.):])\s*$/)?.[1] ?? '';
    const istLabel = trenner === ':';
    // Nachgestellten Trenner abstreifen — beim Label nur den ':' (der Rest ist
    // Bestandteil des Labels: «Kolonne 1»), sonst die Ordinal-Trenner.
    const markeKern = (
      istLabel ? markeRoh.replace(/\s*:\s*$/, '').trim() : markeRoh.replace(/[\s.)]+$/, '')
    )
      // EINE Schreibweise je Marke (§5): das lat. Suffix steht im Korpus als
      // «cbis» (Fedlex setzt «c<sup>bis</sup>»); BankG Art. 3 schreibt dieselbe
      // Marke als «c.<sup>bis</sup>» → «c.bis». Der Trennpunkt wird darum
      // eingezogen, sonst fände ein Zitat «lit. cbis» seine Fundstelle nicht.
      .replace(new RegExp(`^([a-z])\\.(${LAT_SUFFIX})$`, 'i'), '$1$2');
    const istKanonisch = !istLabel && KANONISCHE_MARKE.test(markeKern);
    let marke = istKanonisch ? markeKern.toLowerCase() : markeKern;
    // Emittiert wird der Trenner nur ABWEICHEND vom Normalfall «kanonische
    // Ordinalmarke + Punkt» — s. Funktions-Doku (§6/§7: bisher korrekte Items
    // bleiben byte-gleich). `undefined` = Normalfall, Feld fehlt im Snapshot.
    let trennerFeld: string | undefined =
      istKanonisch && trenner === '.' ? undefined : trenner;

    const ddVorListe = subDlIdx >= 0 ? ddRoh.slice(0, subDlIdx) : ddRoh;
    const ddOhneFn = ddVorListe.replace(/<sup[^>]*><a[\s\S]*?<\/a><\/sup>/gi, '');
    let text = entferneTags(ddOhneFn);

    // <dt>-EINGEBETTETER Text + LEERES <dd> (Fedlex-Sonderform, z.B. ZPO art_250
    // Ziff. 15, einige VStrR/StG/BV-Punkte): hier steht der Punkttext IM <dt>
    // hinter der Marke («<dt>15.<sup>fn</sup> Anordnung …</dt><dd></dd>») statt im
    // <dd>. Ohne Fallback ginge dieser Punkt stumm verloren (§1/§8). NUR greifen,
    // wenn das <dd> wirklich leer ist UND keine Unterliste vorliegt — sonst bleibt
    // alles byte-gleich (§6). Der Resttext nach der Marke wird tag-/fussnoten-
    // bereinigt übernommen.
    // Hier — und NUR hier — ist die Marke ein PRÄFIX des <dt> statt sein ganzer
    // Inhalt. Die Aufteilung greift deshalb nur bei leerem <dd> ohne Unterliste
    // UND nur, wenn das <dt> die Form «kanonische Marke + optionaler Trenner +
    // LEERRAUM + Text» hat. Ohne die Leerraum-Bedingung zerschnitte sie auch
    // marken-lose Legenden-Schlüssel («BAS» → «b» + «AS», ASYLV 2) — genau die
    // Kürzung, die oben abgestellt wurde (§1). Sie greift auch bei einem
    // Label-<dt> («4.3.1&nbsp;&nbsp;Name(n) des (der) Kläger(s):», LugÜ
    // Anhang V/VI): dort ist der Doppelpunkt Teil des Punkt-TEXTES, nicht
    // Marken-Trenner — ohne diesen Zweig verlöre der Anhang die Punkte stumm.
    if (!text && subDlIdx < 0 && !istKanonisch) {
      const KANON_QUELLE = anhang
        ? `[0-9]+(?:\\.[0-9]+)*(?:${LAT_SUFFIX})?[a-z]?|[a-z](?:${LAT_SUFFIX})?`
        : `[0-9]+(?:${LAT_SUFFIX})?[a-z]?|[a-z](?:${LAT_SUFFIX})?`;
      // Gruppe 2 = der Trenner DIESES Präfixes (#679). Hier ist die Marke ein
      // Präfix des <dt>, der Trenner steht also mitten im <dt>-Text und nicht
      // an seinem Ende — `trenner` von oben (Zeilen-Ende) wäre hier falsch.
      const praefix = markeRoh.match(new RegExp(`^(${KANON_QUELLE})\\s*([.)])?\\s+(?=\\S)`, 'i'));
      if (praefix) {
        // entferneTags: identische Bereinigung wie zuvor inline, aber inkl. N1-Fix
        // (Inline-Tags leerzeichenlos) — «14<i>a</i>» im <dt>-Text bleibt «14a».
        const dtTextRoh = entferneTags(dtOhneFn);
        const nachMarke = dtTextRoh
          .replace(new RegExp(`^(?:${KANON_QUELLE})\\s*[.)]?\\s*`, 'i'), '')
          .trim();
        if (nachMarke) {
          marke = praefix[1].toLowerCase();
          text = nachMarke;
          // Die Marke IST hier kanonisch (KANON_QUELLE) → Punkt = Normalfall
          // (Feld fehlt, byte-gleich); ')' oder kein Trenner wird emittiert.
          const pTrenner = praefix[2] ?? '';
          trennerFeld = pTrenner === '.' ? undefined : pTrenner;
        }
      }
    }

    // LEERES <dt> + Text-<dd> = Fortsetzungszeile des vorausgehenden Items
    // (Fedlex-Sonderform «<dt>a.</dt><dd>Label:</dd><dt></dt><dd>Beschreibung</dd>»,
    // z.B. SSV art_24: Signal-Namen im ersten <dd>, die verbindliche Beschreibung
    // im markenlosen Folge-<dd>). Ohne dies ging die Beschreibung stumm verloren,
    // weil ein markenloses Item unten verworfen wird (§1, Text-Adjazenz). An den
    // Text des letzten Items DIESER Ebene anhängen (Dokumentreihenfolge).
    // NUR im Haupttext-Pfad (!anhang): der Anhang-Pfad (extrahiereAnhang) erfasst
    // markenlose <dd>-Notizen bereits SEPARAT via markeloseNotizen() als eigene
    // Prosa-Blöcke VOR der Liste — dort würde ein zweites Anhängen die Notiz
    // DOPPELN (VTS-Anhang-Mess-Tabellen). Nur bei vorhandenem Vorgänger-Item
    // anhängen: ein FÜHRENDES markenloses <dd> (ohne Vorgänger) tritt im Haupttext
    // empirisch nicht auf (alle Haupt-Artikel-<dl> der betroffenen Erlasse starten
    // lettered/nummeriert; Fedlex-Chapeaus stehen als eigenes <p> vor der <dl>).
    // §6: greift nur bei zuvor VERLORENEM Text — additiv, keine Marke fabriziert.
    if (!anhang && !marke && text && subDlIdx < 0 && items.length > 0) {
      const vorheriges = items[items.length - 1];
      vorheriges.text = vorheriges.text ? `${vorheriges.text} ${text}` : text;
    } else if (marke && (text || subDlIdx >= 0)) {
      // Eltern-Item: auch ohne eigenen Text aufnehmen, WENN eine Unterliste folgt
      // (sonst ginge die lit-Ebene verloren — der eigentliche Bug). Andernfalls
      // wie bisher nur bei Text (leere Items werden verworfen).
      // tiefe NUR setzen, wenn verschachtelt (>0) → Top-Level byte-gleich (§7).
      // trenner NUR bei Abweichung vom Normalfall (#679) — Schlüssel-REIHENFOLGE
      // marke,text,tiefe,trenner ist Teil der Byte-Gleichheit (JSON-Serialisierung).
      items.push({
        marke,
        text,
        ...(tiefe > 0 ? { tiefe } : {}),
        ...(trennerFeld !== undefined ? { trenner: trennerFeld } : {}),
      });
    }

    // Unterliste rekursiv anhängen (in Dokumentreihenfolge nach dem Eltern-Item),
    // eine Stufe tiefer — die Stufe wird explizit geführt, nicht geraten.
    if (subDlIdx >= 0) {
      const subEnde = findeDlEnde(ddRoh, subDlIdx);
      const subOpenLen = ddRoh.slice(subDlIdx).match(/^<dl\b[^>]*>/i)![0].length;
      const subInner = ddRoh.slice(subDlIdx + subOpenLen, subEnde - '</dl>'.length);
      for (const sub of parseDefinitionsListe(subInner, tiefe + 1, anhang)) items.push(sub);
    }
  }
  return items;
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

/** Tag-/Fussnoten-bereinigter Inhalt einer Tabellen-Zelle. */
function zellText(c: string): string {
  return entferneTags(c.replace(/<sup[^>]*><a[\s\S]*?<\/a><\/sup>/gi, ''));
}

/**
 * Zerlegt die Zellen einer <tr> (Tag `td` oder `th`) zu einem Spalten-Array und
 * EXPANDIERT colspan: eine Zelle mit colspan=N belegt N Spalten — der Text steht
 * in der ersten, die übrigen (N-1) sind leer. So bleibt die Spaltenzahl von Kopf
 * und Daten konsistent, wenn NUR der Kopf gruppierte (colspan-)Zellen hat
 * (GebV SchKG art_30: Kopf 2 colspan-Zellen über 6 Datenspalten). Minimal — kein
 * Zell-Merge/rowspan (David-Entscheid 28.6.: «minimal colspan→Kopf-Padding»).
 */
function zeileMitColspan(rowHtml: string, tag: 'td' | 'th'): string[] {
  const zellen: string[] = [];
  const re = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, 'gi');
  for (const c of rowHtml.matchAll(re)) {
    const span = Number(c[1].match(/\bcolspan=["']?(\d+)/i)?.[1] ?? '1') || 1;
    zellen.push(zellText(c[2]));
    for (let k = 1; k < span; k++) zellen.push('');
  }
  return zellen;
}

/**
 * Zerlegt eine Fedlex-<table> in einen mehrspaltig-Block {kopf, zeilen}.
 *
 * ZWEI Markup-Varianten:
 *  (A) <th>-Tabellen (IVG art_28b, AHVV/BVG-Tarife): erste/letzte <th>-Zeile =
 *      Kopf, <td>-Zeilen = Daten — colspan wird (wie bisher) IGNORIERT, weil dort
 *      Kopf UND Daten dieselben colspan tragen und so konsistent ausgerichtet
 *      sind (Audit «colspan widerlegt» trifft für <th>-Tabellen zu). UNVERÄNDERT
 *      → byte-gleich.
 *  (B) kpf-als-<td>-Tabellen (GebV SchKG art_30): KEIN <th>, der Kopf steht als
 *      <td><p class="man-template-tab-kpf">…</p></td> — bisher als Datenzeile
 *      verkannt (G20) und ohne colspan-Expansion gegen die Daten verschoben.
 *      Hier: Kopf-Zeilen erkennen, colspan KONSISTENT (Kopf + Daten dieser
 *      Tabelle) expandieren, mehrere Kopfzeilen spaltenweise zusammenführen
 *      (G19: obere Kopfzeile ging sonst verloren).
 * Reale Struktur: <tr><td colspan="4"><p class="man-template-tab-kpf">…</p></td>…</tr>.
 */
function parseFedlexTabelle(tableInner: string, anhang = false): { kopf?: string[]; zeilen: string[][] } {
  const hatTh = /<th\b/i.test(tableInner);
  const istKpfStil = !hatTh && /man-template-tab-kpf/i.test(tableInner);

  if (!istKpfStil) {
    // ── Variante (A) + plain-<td>: bestehender Pfad, byte-gleich ──────────────
    let kopf: string[] = [];
    const zeilen: string[][] = [];
    for (const r of tableInner.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const ths = [...r[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((c) => zellText(c[1]));
      if (ths.length > 0) {
        if (!ths.some((x) => x !== '')) continue;
        // M13-Annex (Gegenprüfung), NUR im Anhang-Pfad: <th>-DATEN-Zeile (Klasse
        // krpr/utit) ist KEIN Kopf — sonst überschriebe eine reine <th>-Tabelle
        // (LRV Anhang 3) ihren Kopf zeilenweise und verlöre ALLE Datenzeilen (§1).
        // Haupttext-Pfad UNVERÄNDERT (jede nicht-leere <th>-Zeile = Kopf, byte-gleich).
        if (anhang && /man-template-tab-(?:krpr|utit)/i.test(r[1])) zeilen.push(ths);
        else kopf = ths;
        continue;
      }
      const tds = [...r[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => zellText(c[1]));
      if (tds.some((x) => x !== '')) zeilen.push(tds);
    }
    return kopf.length > 0 ? { kopf, zeilen } : { zeilen };
  }

  // ── Variante (B): kpf-als-<td> — Kopf-Erkennung + colspan-Padding (G19/G20) ──
  const kopfZeilen: string[][] = [];
  const zeilen: string[][] = [];
  for (const r of tableInner.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const zellenRoh = [...r[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)];
    // Kopfzeile: jede nicht-leere Zelle trägt die tab-kpf-Klasse (keine Datenzelle).
    const istKopf =
      zellenRoh.some((c) => /man-template-tab-kpf/i.test(c[1])) &&
      zellenRoh.every((c) => /man-template-tab-kpf/i.test(c[1]) || zellText(c[1]) === '');
    const zellen = zeileMitColspan(r[1], 'td');
    if (istKopf) kopfZeilen.push(zellen);
    else if (zellen.some((x) => x !== '')) zeilen.push(zellen);
  }
  // Mehrere Kopfzeilen spaltenweise zusammenführen (G19): je Spalte die nicht-
  // leeren Texte der Kopfzeilen mit ' ' verbinden — nichts geht verloren (§8).
  const breite = Math.max(0, ...kopfZeilen.map((z) => z.length));
  const kopf: string[] = [];
  for (let c = 0; c < breite; c++) {
    kopf.push(kopfZeilen.map((z) => z[c] ?? '').filter(Boolean).join(' '));
  }
  return kopf.some((x) => x !== '') ? { kopf, zeilen } : { zeilen };
}

/** Roh-Zellen einer <tr> (tag `td`|`th`) MIT colspan — Text via zellText
 *  (fussnoten-/tag-bereinigt). Keine colspan-Expansion hier; die macht der
 *  reine Normalisierer (T-A2). */
function rohZellen(rowHtml: string, tag: 'td' | 'th'): RohZelle[] {
  const out: RohZelle[] = [];
  const re = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, 'gi');
  for (const c of rowHtml.matchAll(re)) {
    const span = Number(c[1].match(/\bcolspan=["']?(\d+)/i)?.[1] ?? '1') || 1;
    out.push({ text: zellText(c[2]), colspan: span });
  }
  return out;
}

/**
 * Zerlegt eine Fedlex-<table> in roh geparste Kopf-/Datenzeilen (mit colspan),
 * OHNE zu normalisieren — Eingabe für `normalisiereTabelle` (M10, T-F8).
 * Kopf-Erkennung beide Markup-Welten: (A) `<th>`-Zeile; (B) `<td>`-Zeile, deren
 * nicht-leere Zellen ALLE die `man-template-tab-kpf`-Klasse tragen. MEHRERE
 * Kopfzeilen werden gesammelt (T-A5-Merge geschieht im Normalisierer; der
 * Alt-Pfad behielt nur die letzte → G19-Caption-Verlust, z.B. AHVV Art. 21).
 */
function parseRohTabelle(tableInner: string, anhang = false): RohTabelle {
  const kopfZeilen: RohZelle[][] = [];
  const datenZeilen: RohZelle[][] = [];
  for (const r of tableInner.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = r[1];
    if (/<th\b/i.test(rowHtml)) {
      const ths = rohZellen(rowHtml, 'th');
      // M13-Annex (Gegenprüfung), NUR im Anhang-Pfad: Fedlex rendert manche DATEN-
      // Zeilen ebenfalls als <th> und unterscheidet sie NUR über die Klasse
      // (`man-template-tab-krpr`/`-utit` = Daten, `-kpf` = Kopf). Eine Tabelle, deren
      // Datenrumpf komplett aus <th class="…-krpr"> besteht (LRV Anhang 3 Grenzwerte,
      // VTS Anhang 9 Sitzmasse), wurde sonst KOMPLETT als Kopf gelesen → Datenzeilen
      // verloren (§1). Haupttext-Pfad UNVERÄNDERT (jede <th>-Zeile = Kopf, byte-gleich).
      if (anhang) {
        if (ths.every((z) => z.text === '')) continue;
        if (/man-template-tab-(?:krpr|utit)/i.test(rowHtml)) datenZeilen.push(ths);
        else kopfZeilen.push(ths);
      } else if (ths.some((z) => z.text !== '')) {
        kopfZeilen.push(ths);
      }
      continue;
    }
    const tds = rohZellen(rowHtml, 'td');
    const istKpf =
      /man-template-tab-kpf/i.test(rowHtml) &&
      [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].every(
        (m) => /man-template-tab-kpf/i.test(m[1]) || zellText(m[1]) === '',
      );
    if (istKpf) {
      if (tds.some((z) => z.text !== '')) kopfZeilen.push(tds);
    } else if (tds.some((z) => z.text !== '')) {
      datenZeilen.push(tds);
    }
  }
  return { kopfZeilen, datenZeilen };
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

// ─── Bilder & Formeln (1.7.2026) ────────────────────────────────────────────
// Fedlex liefert Piktogramme (SSV/VTS/chem.) und Formeln als <img src="image/…png">.
// Der Extraktor erfasst die RELATIVE src (kein Netz); der Generator lädt herunter.

/** Ein einzelnes <img>-Tag → BildRef (datei = relative src, Masse aus data-scaled-*). */
function bildAusImg(imgTag: string): BildRef {
  const zahl = (re: RegExp): number | undefined => Number(imgTag.match(re)?.[1] ?? '') || undefined;
  return {
    datei: imgTag.match(/\bsrc="([^"]*)"/i)?.[1] ?? '',
    alt: entferneTags(imgTag.match(/\balt="([^"]*)"/i)?.[1] ?? ''),
    breite: zahl(/\bdata-scaled-width="(\d+)"/i) ?? zahl(/\bwidth="(\d+)"/i),
    hoehe: zahl(/\bdata-scaled-height="(\d+)"/i) ?? zahl(/\bheight="(\d+)"/i),
  };
}

/** Alle <img>-Tags eines HTML-Fragments (für Containment + Nicht-Katalog-Zellen). */
function alleImgTags(html: string): string[] {
  return [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
}

/**
 * Reiner Piktogramm-Katalog? → flache Kachel-Liste, sonst null (dann bleibt es eine
 * normale Tabelle). Katalog NUR, wenn genug Bild-Zellen UND (fast) jede nicht-leere
 * Zelle ein Bild trägt — so bleibt eine GEMISCHTE Datentabelle (SSV Anhang 3:
 * Zeit-Tabelle + Illustration) eine Tabelle (§1) und verliert ihre Daten nicht.
 */
function parseBildKacheln(tableInner: string): Array<{ bild?: BildRef; nummer?: string; name?: string }> | null {
  const zellen = [...tableInner.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => m[1]);
  const nichtLeer = zellen.filter((z) => entferneTags(z) !== '' || /<img\b/i.test(z));
  const mitBild = nichtLeer.filter((z) => /<img\b/i.test(z));
  if (mitBild.length < 3 || mitBild.length < nichtLeer.length * 0.8) return null;
  const kacheln: Array<{ bild?: BildRef; nummer?: string; name?: string }> = [];
  for (const z of nichtLeer) {
    const imgs = alleImgTags(z);
    // ALLE <dt>/<dd>-Paare der Zelle (eine Zelle kann EIN Bild + MEHRERE Signale
    // tragen, z.B. «6.10 Haltelinie / 6.11 Stop / 6.12 …» — sonst Textverlust §1).
    const paare = [...z.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)]
      .map((m) => ({
        nummer: entferneTags(entferneFussnotenSups(m[1])) || undefined,
        name: entferneTags(entferneFussnotenSups(m[2])) || undefined,
      }));
    // Kein <dt>/<dd> → ganzer bildloser Zelltext als ein Name (nichts verlieren).
    // Fussnoten-<sup><a>…</a></sup> VOR entferneTags tilgen — sonst leakt die
    // Fussnoten-Ziffer in den Namen (SSV 4.77.1 «…(Art. 59)379», §1); analog zum
    // Absatz-Pfad (Zeile 270) und dem <dt>/<dd>-Weg unten.
    if (paare.length === 0) {
      const rest = entferneTags(entferneFussnotenSups(z.replace(/<img\b[^>]*>/gi, '')));
      if (rest) paare.push({ nummer: undefined, name: rest });
    }
    // Bilder und Paare index-weise zu Kacheln zusammenführen: keine Zeile verliert
    // ihr Bild, kein Bild verliert seinen Text; Überzahl auf einer Seite → eigene Kachel.
    const anzahl = Math.max(imgs.length, paare.length, 1);
    for (let i = 0; i < anzahl; i++) {
      const p = paare[i] ?? {};
      const bild = imgs[i] ? bildAusImg(imgs[i]) : undefined;
      // alt aus der amtlichen Bezeichnung ableiten (§8: keine Erfindung, nur die Quelle).
      if (bild) bild.alt = p.name ? `Signal: ${p.name}` : 'Amtliche Abbildung';
      kacheln.push({ ...(bild ? { bild } : {}), nummer: p.nummer, name: p.name });
    }
  }
  return kacheln.length ? kacheln : null;
}

/**
 * Containment-Sicherheitsnetz: hängt jedes QUELL-Bild, das die Block-Parser nicht
 * erfasst haben (z.B. Formel-Variablen als <img> in <dt>/<dd> oder inline <sub>),
 * als eigenen Bild-Block an — so geht KEIN amtliches Bild still verloren (§1/§8).
 * Platzierung am Ende statt inline ist eine bewusste, dokumentierte Vereinfachung
 * (Formel-Symbol-Inline = eigener Folgeschritt); Vollständigkeit hat Vorrang.
 */
// Ein Standalone-Bild ist eine FORMEL, wenn der nächste vorausgehende Text-Block
// eine Rechen-Einleitung ist («Formel …», «… wie folgt:», «… umgerechnet:»). §8-
// konservativ: Piktogramme (Signale/Warnzeichen) stehen NIE nach so einem Lead-in
// (sie folgen normalen Sätzen/Überschriften), werden also nicht fälschlich als
// Formel etikettiert. Kachel-Signale (bildKacheln) sind ausgenommen.
const FORMEL_KONTEXT = /\bFormeln?\b|\bGleichung\b|(?:berechnet|ermittelt|errechnet|umgerechnet|umzurechnen|bestimmt sich|wie folgt)\s*:?\s*$/i;

function markiereFormeln(bloecke: ArtikelText['bloecke']): void {
  bloecke.forEach((b, i) => {
    if (!b.bild) return;
    for (let j = i - 1; j >= 0; j--) {
      const t = bloecke[j].text;
      if (t) {
        if (FORMEL_KONTEXT.test(t)) b.bild.formel = true;
        break;
      }
    }
  });
}

function ergaenzeFehlendeBilder(bloecke: ArtikelText['bloecke'], quellHtml: string): void {
  const erfasst = new Set<string>();
  for (const b of bloecke) {
    if (b.bild) erfasst.add(b.bild.datei);
    for (const k of b.bildKacheln ?? []) if (k.bild) erfasst.add(k.bild.datei);
  }
  for (const img of alleImgTags(quellHtml)) {
    const b = bildAusImg(img);
    if (b.datei && !erfasst.has(b.datei)) {
      b.alt = 'Amtliche Abbildung';
      bloecke.push({ absatz: null, text: '', bild: b });
      erfasst.add(b.datei);
    }
  }
}

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

// ─── M13-Annex: Anhänge (annex_*) ────────────────────────────────────────────
//
// Fedlex legt die Anhänge in einen EIGENEN Container <div id="annex"> (Geschwister
// von <main>, nach <div id="dispositions">). Jeder Anhang ist eine FLACHE
// <section id="annex_N" | "annex_N_N" | "annex_N_a"> (slash-frei); ihr Teilbaum
// enthält ausschliesslich lvl_*-Untersektionen, NIE eine weitere annex_*-Sektion
// (die sind Geschwister — verifiziert chemrrv: annex_1 schliesst VOR annex_1_1).
// Darum doppelt das Extrahieren der ganzen Sektion keinen Geschwister-Anhang.
//
// Anders als Haupttext (<article id="art_*">) und Schlusstitel (<article
// id="disp_uN/art_*">) sind Anhänge KEINE <article> und tragen KEINE
// art_-Nummerierung → eigener Anker-/Extraktionspfad. Inhalt ist heterogen:
// <p class="absatz">, KLASSENLOSE <p> (FIDLEV-Anhänge sind komplett klassenlos),
// <dl>-Listen, echte <table> (inkl. man-template-tab-kpf/krpr-Zellen) und
// Unter-Überschriften (h2–h6 = Ziffern). Der dedizierte Extraktor erfasst all
// das in Dokumentreihenfolge; die Unter-Überschriften werden als `titel`-Blöcke
// (Tiefe = Heading-Level) erhalten, damit die Ziffern-Struktur im Lesefluss
// nicht verloren geht.

/** Der amtliche Anhang-Container. EINE Wahrheit (§5) für beide Nutzungen: die
 *  Anker-Suche in `alleAnhangAnker` UND die Container-eId in `anhangContainerEId`
 *  — sonst könnten Fundort und mitgeschnittene eId auseinanderlaufen.
 *
 *  N1-Härtung (12.9.2026, Nebenbefund der Gegenprüfung zu #425): LITERAL, ohne
 *  `i`-Flag. Die Capture-Gruppe speist eine eId, die im Browser per
 *  `getElementById` aufgelöst wird — und das ist case-SENSITIV. Ein gross
 *  geschriebenes `<div ID="ANNEX">` hätte vorher `annex` als eId geliefert
 *  (Blindgänger-Link, §8). Korpus heute 0 Varianten: 136/136 Caches tragen den
 *  Container literal als `<div id="annex">` (Vollerhebung 228 Caches 12.9.2026)
 *  — reine Robustheit, kein Verhaltens-Fix. */
const ANNEX_CONTAINER = /<div\s+id="(annex)"\s*>/;

/** Der amtliche Container der Staatsvertrags-Sektionen `scope_*` (Geltungsbereich)
 *  und `decl_*` (Erklärungen und Vorbehalte der Schweiz).
 *
 *  QS-KORPUS-SCOPE (12.9.2026, Nebenbefund N2 der Gegenprüfung zu #425): 12
 *  Staatsverträge tragen KEINEN annex-Container — ihr Geltungsbereich und die
 *  CH-Erklärungen stehen ausschliesslich in diesem eigenen `<div id="scope">`.
 *  `alleAnhangAnker` begann am annex-Container und lieferte für sie darum ein
 *  leeres Array: 23 amtliche Sektionen fehlten vollständig in Snapshot und
 *  Sidecar. Vollerhebung 228 Caches (12.9.2026): 136 HTMLs mit annex-Container,
 *  26 mit scope-Container — 14 davon mit BEIDEN (LUGUE-Klasse, scope NIE vor
 *  annex), 12 nur mit scope; im scope-Container stehen ausnahmslos
 *  `scope_*`/`decl_*`-Sektionen, keine fremden. Literal wie ANNEX_CONTAINER. */
const SCOPE_CONTAINER = /<div\s+id="(scope)"\s*>/;

export interface AnhangText {
  /** Echter Fedlex-Titel des Anhangs («Anhang 1», «Anhang 1.1», «Anhang 4a»),
   *  aus der ersten <hN class="heading"> der Sektion. */
  titel: string;
  bloecke: ArtikelText['bloecke'];
}

/**
 * W2·5d-ANNEX (EID-1-Nachzug): die Container-eId des Anhang-Blocks — das
 * Fragment, das auf der amtlichen ELI-Fassung genau an den Anfang der Anhänge
 * springt (`quelleUrl#annex`).
 *
 * Warum GENAU dieser Knoten und kein anderer: Der Anhang-Pfad erzeugt im Sidecar
 * eine EINZIGE Gliederungsstufe «Anhänge», unter der alle Anhänge eines Erlasses
 * als Blätter hängen. Ihr amtliches Gegenstück ist der Container <div id="annex">,
 * nicht ein einzelner Anhang: eine Anhang-eigene eId (annex_1) am Gruppen-Knoten
 * zeigte für alle übrigen Anhänge auf die falsche Stelle (§8: lieber kein Link
 * als ein unpräziser). Die eIds der EINZELNEN Anhänge sind kein Verlust — sie
 * stehen bereits als Fragment in der per-Eintrag-`quelleUrl` des Snapshots
 * (`…/de#annex_1`, SSoT §5) und speisen dort den Artikel-Verifizierlink (EID-2).
 *
 * Korpusweit verifiziert (227 Bund-Caches, 3.8.2026): 143 HTMLs tragen den
 * Container, ausnahmslos in der Form `<div id="annex">` — keine Variante. Ein
 * Erlass ohne Anhänge liefert `undefined` (kein Feld, nichts fabrizieren §7).
 *
 * Der ChemRRV-Fall zeigt, warum NICHT die Deckblatt-Sektion genommen wird: dort
 * heisst `<section id="annex_u1">` selbst «Anhänge», existiert aber nur in einem
 * Teil der Erlasse (GSchV/VZV/AIG/ASYLG beginnen direkt mit annex_1) — der
 * Container ist der einzige korpusweit einheitliche Knoten.
 *
 * OFFENGELEGTE UNSCHÄRFE (§8, nicht wegglätten). `alleAnhangAnker` sammelt ab
 * dem Container bis zum Dokumentende und fasst deshalb bei 14 Staatsverträgen
 * auch `scope_u*`/`decl_u*` (Geltungsbereich, CH-Erklärungen) unter «Anhänge» —
 * korpusweit 21 Sektionen, die als GESCHWISTER NACH `</div>` liegen, nicht darin
 * (belegt 3.8.2026: apostille, cmr, gfk, haue, heue, hksue96, hkue, hzue, icao,
 * istanbul, lugue, rbue, staatenlose, vrk). Der Gruppen-Link springt dort an den
 * Anfang des Anhang-Blocks, der diesen Sektionen im Dokument unmittelbar
 * VORAUSGEHT — er zeigt also auf den Beginn der Region, nie auf eine fremde
 * Bestimmung. Punktgenau bleiben diese Einträge über ihren EIGENEN Artikel-Link
 * erreichbar (`quelleUrl#scope_u1`, EID-2, aus dem Snapshot). Bewusst NICHT
 * per-Eintrag unterdrückt: der Reader vergibt je Gliederungsknoten genau EINEN
 * Link (browse.ts «erste vorhandene eId gewinnt»), die Unterscheidung wäre für
 * den Nutzer unsichtbar und kostete im Risiko-Pfad zusätzliche Parser-Logik.
 */
export function anhangContainerEId(html: string): string | undefined {
  // QS-KORPUS-SCOPE: ohne annex-Container ist der scope-Container der amtliche
  // Knoten der Gruppe (12 Staatsverträge). Reihenfolge annex → scope, weil bei
  // den 14 Erlassen mit BEIDEN Containern der Anhang-Block zuerst kommt und der
  // Gruppen-Link an den Anfang der Region springen soll (Vorbestand unverändert).
  const m = ANNEX_CONTAINER.exec(html) ?? SCOPE_CONTAINER.exec(html);
  return m ? m[1] : undefined;
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

/**
 * Marke-LOSE <dd>-Notizen einer Anhang-<dl> (Fedlex nutzt <dl><dt></dt><dd>…</dd>
 * auch als reine Einrückung/Notiz, ohne lit./Ziff.-Marke). parseDefinitionsListe
 * verwirft marke-lose Items (Artikel-Pfad, golden-fixiert) → im Anhang ginge der
 * <dd>-Notiztext stumm verloren (§1; FIDLEV/VTS/LRV-Anhänge nutzen das hundertfach).
 * Liefert je marke-loser Top-Level-<dd> den reinen Notiztext (VOR einer evtl.
 * Unterliste — deren markierte Items erfasst parseDefinitionsListe separat).
 */
function markeloseNotizen(dlInner: string): string[] {
  const notizen: string[] = [];
  const dtRe = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = dtRe.exec(dlInner)) !== null) {
    const ddStart = dtRe.lastIndex;
    const ddEnde = findeDdEnde(dlInner, ddStart);
    const ddRoh = dlInner.slice(ddStart, ddEnde);
    dtRe.lastIndex = ddEnde + '</dd>'.length;
    // Marke-los-Bestimmung MUSS mit parseDefinitionsListe übereinstimmen (Roh-Tag-
    // Strip, der «[tab]» behält) — sonst hielte markeloseNotizen ein «<dt>[tab]</dt>»
    // für marke-los (Notiz) UND parseDefinitionsListe für ein Item → Text doppelt
    // (Fix 1.7.2026: entferneTags strippt den [tab]-Spacer für Tabellen, darf hier
    // aber die Disjunktheit nicht kippen). Nur Fussnoten-Sups vorher tilgen.
    const marke = dekodiereEntities(m[1].replace(/<sup[^>]*><a[\s\S]*?<\/a><\/sup>/gi, '').replace(/<[^>]+>/g, ''))
      .replace(/[.)]\s*$/, '').trim();
    const subDlIdx = ddRoh.search(/<dl\b[^>]*>/i);
    if (marke === '') {
      // marke-loses <dd>: der reine Notiztext (vor einer evtl. Unterliste).
      const ddText = entferneTags(entferneFussnotenSups(subDlIdx >= 0 ? ddRoh.slice(0, subDlIdx) : ddRoh)).trim();
      if (ddText) notizen.push(ddText);
    }
    // REKURSION: auch UNTER einem MARKIERTEN Eltern-Item kann eine ganze Unterliste
    // marke-loser <dd> stecken (z.B. VTS Anhang 7 Bremsverzögerungen «Klasse 3: 2,9
    // m/s²»). parseDefinitionsListe verwirft marke-lose Items auf JEDER Ebene → der
    // Top-Level-Scan allein verlöre verschachtelte Notizen (§1). Daher in jede
    // Unterliste absteigen (marke-los vs. marke-tragend bleibt disjunkt → keine Dublette).
    if (subDlIdx >= 0) {
      const subEnde = findeDlEnde(ddRoh, subDlIdx);
      const subOpen = ddRoh.slice(subDlIdx).match(/^<dl\b[^>]*>/i);
      if (subOpen) {
        const subInner = ddRoh.slice(subDlIdx + subOpen[0].length, subEnde - '</dl>'.length);
        notizen.push(...markeloseNotizen(subInner));
      }
    }
  }
  return notizen;
}

/** Sichtbarer Text einer Anhang-Überschrift: der <a>-Text ohne Icons/Fussnoten.
 *  «<span class="display-icon"></span>…<a href="#annex_1">Anhang 1 </a>» → «Anhang 1».
 *
 * F-f (QS-OPT, 28.7.2026) — DEKLARIERTE fachliche Änderung: Der frühere PAUSCHALE
 * Strip `<sup>…</sup>` warf auch das lateinische Ordinal-Suffix weg, das TEIL DER
 * NUMMER ist («6.6<sup>bis</sup> Rückerstattung der Gebühr» → «6.6 Rückerstattung
 * der Gebühr»). Damit trugen zwei rechtlich VERSCHIEDENE Ziffern dieselbe Nummer —
 * ChemRRV Anh. 2.15 zweimal «6.6», VZV zweimal «Anhang 1» (annex_1 UND annex_1_bis),
 * GSchV Anh. 4 zweimal «221». Ein Zitat auf die verstümmelte Nummer trifft die
 * falsche Bestimmung (§1/§7).
 *
 * Jetzt exakt das ARTIKEL-Muster (§5, eine Mechanik für alle Pfade):
 *   (1) `entferneFussnotenSups` tilgt NUR die redaktionellen Marker
 *       `<sup><a href="#fn-…">N</a></sup>` samt Ziffer;
 *   (2) `entferneTags` klebt das verbleibende Buchstaben-<sup> leerzeichenlos an
 *       die Nummer (N1-Fix) — dieselbe Regel, die «Art. 335bis»/«art_N_bis» und
 *       die Gliederungs-Sidecars (struktur-extrahiere.ts `reinText`) erzeugen.
 * Empirisch abgesichert (alle 227 Bund-Caches): nach Schritt (1) verbleiben in
 * Anhang-Überschriften AUSSCHLIESSLICH lat. Ordinale (27× bis, 9× ter) und leere
 * <sup> — kein Ziffern-<sup>, das entferneTags als Exponent beabstanden würde.
 */
function anhangUeberschrift(hInner: string): string {
  const ohneZier = entferneFussnotenSups(
    hInner.replace(/<span\s+class="(?:display-icon|external-link-icon)"[^>]*>[\s\S]*?<\/span>/gi, ''),
  );
  return entferneTags(ohneZier);
}

/**
 * Alle Anhang-Anker eines Erlasses in HTML-Reihenfolge — die OBERSTEN Anhang-
 * Sektionen im <div id="annex">-Container.
 *
 * Kandidaten sind die SLASH-FREIEN <section id="…">, deren id mit «annex»/«lvl»
 * beginnt (genestete Stufen tragen einen «/», z.B. annex_1/lvl_u1 → kein Match,
 * weil nach `[^"/]*` das schliessende «"» fehlt). Das erfasst ALLE realen
 * Varianten: nummeriert (annex_1, annex_1_1, annex_4_a — ChemRRV/GSchV/FIDLEV),
 * EINZELNER unnummerierter «Anhang» (annex_uN — BVG/KVG/IPRG/VAG/AHVG) und der
 * Sonderfall OHNE annex-Präfix (lvl_uN — KAG/FIDLEG).
 *
 * P1-a/b-Nachzug (11.7.2026): zusätzlich «scope»/«decl» — die kanonischen
 * isExemplifiedBy-Fassungen der Staatsverträge (SR 0.*: LugÜ/GFK/HZÜ/VRK/… —
 * 14 Erlasse) tragen Geltungsbereich (<section id="scope_uN">) und Erklärungen/
 * Vorbehalte der Schweiz (<section id="decl_uN">) als EIGENE Sektionen im
 * annex-Container; die alten Alias-Dumps exponierten denselben Inhalt als
 * generierte lvl_dXeY-Sektionen (wurden erfasst). Ohne diese Präfixe verlöre
 * die kanonische Regeneration die CH-Erklärungen (LUGUE: 2 Blöcke, ex
 * lvl_d1141e136/137). Rein additiv: Erlasse ohne solche Sektionen unverändert.
 *
 * RECORD = ein Kandidat, der KEINEN anderen Kandidaten umschliesst (Blatt im
 * Anhang-Baum). Damit fällt die Deckblatt-Sektion («Anhänge», umschliesst die
 * nummerierten annex_N als Geschwister, z.B. ChemRRV annex_u1) automatisch weg —
 * ihre Kinder sind die Einträge —, während der EINZELNE «Anhang» (annex_uN/lvl_uN,
 * enthält nur lvl_*-Unterstufen mit «/») korrekt als ein Eintrag erhalten bleibt.
 * Doppelte ids erhalten — wie alleArtikelTokens — einen Synthese-Suffix «__2».
 */
export function alleAnhangAnker(html: string): string[] {
  // QS-KORPUS-SCOPE (12.9.2026): Startpunkt ist der ERSTE der beiden amtlichen
  // Container. Bei den 14 Erlassen mit annex UND scope ist das unverändert der
  // annex-Container (scope liegt korpusweit NIE davor — 228 Caches geprüft), bei
  // den 12 Staatsverträgen ohne Anhänge der scope-Container. Rein additiv:
  // Erlasse ohne beide Container liefern weiterhin [].
  const kandidatenStarts = [html.search(ANNEX_CONTAINER), html.search(SCOPE_CONTAINER)]
    .filter((i) => i >= 0);
  if (kandidatenStarts.length === 0) return [];
  const divStart = Math.min(...kandidatenStarts);
  const seg = html.slice(divStart);
  const re = /<section[^>]*\sid="((?:annex|lvl|scope|decl)[^"/]*)"/gi;
  const kandidaten: Array<{ id: string; start: number; end: number }> = [];
  for (const m of seg.matchAll(re)) {
    if (m[1] === 'annex') continue; // (die Container-id ist ein <div>, kein <section>; defensiv)
    const s = m.index ?? 0;
    kandidaten.push({ id: m[1], start: s, end: findeSectionEnde(seg, s) });
  }
  const records = kandidaten.filter(
    (k) => !kandidaten.some((o) => o !== k && o.start > k.start && o.start < k.end),
  );
  // Deckblatt-Auschluss: Tragen die Records NUMMERIERTE Anhänge (annex_1, annex_2…),
  // dann ist eine zusätzliche UNNUMMERIERTE Sektion (annex_uN/lvl_uN) das Deckblatt
  // «Anhänge» — eine reine Inhaltsübersicht (listet die Anhang-Titel, ChemRRV) und
  // KEIN eigener Anhang → ausschliessen (sonst Dublette zur Gliederung «Anhänge»).
  // Fehlt jede Nummerierung (BVG/KVG/KAG/FIDLEG: ein einziger «Anhang»), IST die
  // unnummerierte Sektion der Anhang → behalten.
  const hatNummerierte = records.some((k) => /^annex_\d/.test(k.id));
  const echte = hatNummerierte
    ? records.filter((k) => !/^(?:annex_u\d+|lvl_u\d+)$/.test(k.id))
    : records;
  const anzahl = new Map<string, number>();
  const anker: string[] = [];
  for (const k of echte) {
    const n = (anzahl.get(k.id) ?? 0) + 1;
    anzahl.set(k.id, n);
    anker.push(n === 1 ? k.id : `${k.id}__${n}`);
  }
  return anker;
}

/**
 * Extrahiert einen ganzen Anhang (eine slash-freie annex_*-Sektion) als Block-
 * Liste in Dokumentreihenfolge. Erfasst: Unter-Überschriften (h2–h6 → `titel`-
 * Block), <p> (mit ODER ohne Klasse — FIDLEV-Anhänge sind klassenlos), <dl>-
 * Listen, echte <table>. Die ERSTE Überschrift der Sektion ist der Anhang-Titel
 * (→ `titel`-Feld, NICHT in den Body) und wird vom Body-Lauf ausgenommen.
 *
 * Inline-Bild-Glyphen (image/imageN.png, Formelbilder) werden von entferneTags
 * verworfen — bewusst (eigener Bild-Pass nach M13-Annex, §8 offengelegt).
 *
 * @returns AnhangText, oder null wenn die Sektion fehlt ODER keinen Block trägt
 *          (reine Gruppen-Überschrift wie chemrrv annex_1 → kein eigener Eintrag).
 */
export function extrahiereAnhang(html: string, ankerRoh: string): AnhangText | null {
  const suffix = ankerRoh.match(/^(.*)__(\d+)$/);
  const basisAnker = suffix ? suffix[1] : ankerRoh;
  const nth = suffix ? Number(suffix[2]) : 1;
  const escaped = basisAnker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const openRe = new RegExp(`<section[^>]*\\sid="${escaped}"[^>]*>`, 'gi');
  const opens = [...html.matchAll(openRe)];
  const open = opens[nth - 1];
  if (!open) return null;
  const start = open.index ?? 0;
  const innerStart = start + open[0].length;
  const ende = findeSectionEnde(html, start);
  const innerRoh = html.slice(innerStart, ende - '</section>'.length);

  // Fussnoten-Apparat je (Unter-)Sektion entfernen — sonst leckt der Apparat-Text
  // (Änderungs-/Aufhebungs-Historie) in den Anhang-Body. Anders als beim Artikel
  // (Apparat am Ende → bis Stringende strippen) können Anhang-Fussnoten je
  // Untersektion auftreten, darum jeden Apparat-<div> EINZELN (non-greedy) tilgen.
  // WICHTIG: die Klasse ist NICHT immer nackt «footnotes» — Sektions-Überschriften
  // tragen «footnotes section-heading-footnote» (69 Stellen/14 Erlasse, z.B. VTS).
  // Daher KLASSE-ENTHÄLT-footnotes matchen, nicht exakt-gleich (sonst leckte die
  // Änderungshistorie als Normtext, §1/§8). Apparat enthält nur <p> (kein
  // verschachteltes <div>) → das erste </div> ist sein Schliess-Tag.
  const inner = innerRoh.replace(/<div\b[^>]*\bclass="[^"]*\bfootnotes\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  // Titel = erste Überschrift der Sektion; aus dem Body-Lauf ausnehmen.
  const titelMatch = inner.match(/<h[1-6][^>]*\bclass="[^"]*\bheading\b[^"]*"[^>]*>([\s\S]*?)<\/h[1-6]>/i);
  const titel = titelMatch ? anhangUeberschrift(titelMatch[1]) : basisAnker;
  const koerper = titelMatch ? inner.replace(titelMatch[0], '') : inner;

  const NICHT_P = '(?:(?!</p>)[\\s\\S])*?';
  // Reihenfolge ist bedeutsam: die Tabellen-Alternative steht VOR der generischen
  // <p>-Alternative, weil Fedlex Anhang-Tabellen in einen <p>-Wrapper legt
  // (`<p><div class="table"><table>…</table></div></p>`, invalides HTML, aber so
  // ausgeliefert). Stünde <p> zuerst, schluckte sie die ganze Tabelle und
  // entferneTags plättete sie zu Text (Tabellen-Totalverlust, Bug-Befund). Die
  // optionalen Wrapper-Präfixe (<p> / <div class="table">) fallen daher in die
  // Tabellen-Alternative; ein Wrapper ohne folgendes <table> lässt sie scheitern
  // → Backtrack auf die <p>-Prosa-Alternative an derselben Stelle.
  const re = new RegExp(
    '<h([2-6])[^>]*\\bclass="[^"]*\\bheading\\b[^"]*"[^>]*>([\\s\\S]*?)</h\\1>' +                       // (1)/(2) Unter-Überschrift
      '|(?:<p>\\s*)?(?:<div\\b[^>]*\\bclass="[^"]*\\btable\\b[^"]*"[^>]*>\\s*)?(<table[^>]*>)' +         // (3) Tabellen-Öffnung (ggf. <p>/<div class="table">-umwickelt); Ende balanciert
      `|<p[^>]*>(${NICHT_P})</p>` +                                                                     // (4) Absatz (klassenlos ok)
      '|(<dl[^>]*>)',                                                                                   // (5) Liste
    'gi',
  );

  const bloecke: ArtikelText['bloecke'] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(koerper)) !== null) {
    if (match[0] === '') { re.lastIndex++; continue; }
    if (match[1] !== undefined) {
      // ── Unter-Überschrift (Ziffer) ───────────────────────────────────────
      const text = anhangUeberschrift(match[2]);
      if (text) bloecke.push({ absatz: null, text, titel: Number(match[1]) });
    } else if (match[3] !== undefined) {
      // ── Tabelle <table> (ggf. <p>/<div class="table">-umwickelt) ─────────
      // BALANCIERTES Ende (findeTableEnde): Fedlex schachtelt Layout-Tabellen
      // (Bild-Gitter) in Zellen → ein non-greedy </table> verlöre die Folgezeilen
      // der ÄUSSEREN Tabelle (SSV-Signal-Legenden, §1). Der Tabellen-Anfang liegt
      // hinter dem optionalen <p>/<div>-Präfix: match[3] ist der <table>-Öffner.
      const tableStart = match.index + (match[0].length - match[3].length);
      const tableEnde = findeTableEnde(koerper, tableStart);
      const tableInner = koerper.slice(tableStart + match[3].length, tableEnde - '</table>'.length);
      re.lastIndex = tableEnde;
      // Reiner Piktogramm-Katalog (SSV Anhang 2 Signal-Legenden) → Kachel-Raster.
      const kacheln = parseBildKacheln(tableInner);
      if (kacheln) {
        bloecke.push({ absatz: null, text: '', bildKacheln: kacheln });
        continue;
      }
      const norm = normalisiereTabelle(parseRohTabelle(tableInner, true));
      if (norm && norm.zeilen.length > 0) {
        bloecke.push({ absatz: null, text: '', mehrspaltig: { spalten: norm.spalten, zeilen: norm.zeilen } });
      } else {
        const mehr = parseFedlexTabelle(tableInner, true);
        if (mehr.zeilen.length > 0) {
          bloecke.push({ absatz: null, text: '', mehrspaltig: mehr });
        } else if ((mehr.kopf?.length ?? 0) > 0) {
          // KOPF-ONLY-Tabelle: Fedlex rendert die Spalten-Legende (z.B. «Name |
          // EINECS | CAS | Beschränkungen») als 1-Zeilen-Tabelle, die eigentlichen
          // Daten folgen in <dl>/<p>. Eine zeilenlose mehrspaltig-Tabelle würde
          // nicht rendern (Reader verlangt zeilen.length>0) und triggerte den
          // Leerblock-Sanity. Faithful als Text-Zeile (Spaltentitel · -getrennt)
          // behalten — so geht die Legende nicht verloren (§1).
          const legende = (mehr.kopf ?? []).filter(Boolean).join(' · ');
          if (legende) bloecke.push({ absatz: null, text: legende });
        }
      }
      // Gemischte Anhang-Tabelle mit Bildern (kein reiner Katalog): Tabelle bleibt,
      // Bilder werden dennoch als eigene Blöcke erfasst (Containment, §1).
      for (const img of alleImgTags(tableInner)) {
        const b = bildAusImg(img);
        b.alt = 'Amtliche Abbildung';
        bloecke.push({ absatz: null, text: '', bild: b });
      }
    } else if (match[4] !== undefined) {
      // ── Absatz <p> (mit oder ohne Klasse) ────────────────────────────────
      const roh = match[4];
      // Absatznummer: führendes nacktes <sup>N</sup> (ohne <a>-Kind).
      const supMatch = roh.match(/^(?:\s|&nbsp;|<\/?inl>)*<sup(?:[^>]*)>([\s\S]*?)<\/sup>/i);
      let absatz: string | null = null;
      if (supMatch && !/<a[\s>]/i.test(supMatch[1]) && /^\d+(?:bis|ter|quater|quinquies)?[a-z]?$/.test(supMatch[1].trim())) {
        absatz = supMatch[1].trim();
      }
      const ohneFootnotes = entferneFussnotenSups(roh);
      const ohneAbsatzNr = absatz
        ? ohneFootnotes.replace(/^(?:\s|&nbsp;|<\/?inl>)*<sup[^>]*>\d+(?:bis|ter|quater|quinquies)?[a-z]?<\/sup>(?:&nbsp;|\s|<\/?inl>)*/i, '')
        : ohneFootnotes;
      const text = entferneTags(ohneAbsatzNr).replace(/\s+([.,;:])/g, '$1').trim();
      if (text) bloecke.push({ absatz, text });
      for (const img of alleImgTags(ohneAbsatzNr)) {
        const b = bildAusImg(img);
        b.alt = 'Amtliche Abbildung';
        bloecke.push({ absatz: null, text: '', bild: b });
      }
    } else if (match[5] !== undefined) {
      // ── Liste <dl> (balanciert) ──────────────────────────────────────────
      const dlEnde = findeDlEnde(koerper, match.index);
      const dlInner = koerper.slice(match.index + match[5].length, dlEnde - '</dl>'.length);
      re.lastIndex = dlEnde;
      // Marke-lose <dd>-Notizen (leeres <dt>, Fedlex-Einrückung) ZUERST als Prosa
      // sichern — sonst Textverlust (§1) UND falsche Lesereihenfolge: die Notiz
      // leitet i.d.R. ihre Unterliste EIN («… wie folgt gekennzeichnet:» vor a/b/c).
      // Die nachfolgende Item-Liste hängt sich dann an die letzte Notiz an (Lead +
      // Items = ein Block), statt VOR ihr zu stehen.
      for (const notiz of markeloseNotizen(dlInner)) bloecke.push({ absatz: null, text: notiz });
      const items = parseDefinitionsListe(dlInner, 0, true);
      if (items.length > 0) {
        const vor = bloecke[bloecke.length - 1];
        // An den vorausgehenden Einleitungs-Absatz/Notiz anhängen — NUR wenn der ein
        // reiner Text-Block ohne eigene Liste/Tabelle/Titel ist (sonst eigener Block).
        if (vor && vor.text && vor.titel === undefined && !vor.items && !vor.mehrspaltig) {
          vor.items = items;
        } else {
          bloecke.push({ absatz: null, text: '', items });
        }
      }
    }
  }

  // Leerer Anhang-Körper: in der Praxis ein AUFGEHOBENER Anhang (Fedlex rendert
  // «Anhang N» + Aufhebungs-Fussnote, sonst nichts — die Fussnote ist oben
  // gestrippt). Wie beim aufgehobenen Artikel (s. extrahiereArtikelAusAnker)
  // faithful als «aufgehoben»-Marker («…») behalten statt stumm zu verlieren
  // (§8 Ehrlichkeit; der Reader zeigt «aufgehoben»). So bleibt der Anhang in der
  // Vollständigkeit/Struktur erfasst und konsistent mit dem Artikel-Pfad.
  if (bloecke.length === 0) return { titel, bloecke: [{ absatz: null, text: '…' }] };
  ergaenzeFehlendeBilder(bloecke, koerper);
  markiereFormeln(bloecke);
  return { titel, bloecke };
}

/** Fallback-Label aus dem Anker, wenn die Sektion keinen Titel trägt.
 *  'annex_1' → «Anhang 1»; 'annex_1_1' → «Anhang 1.1»; 'annex_4_a' → «Anhang 4a». */
export function anhangLabelVonAnker(anker: string): string {
  const basis = anker.replace(/__\d+$/, '');
  // P1-a/b-Nachzug: sprechende Fallback-Labels für die Staatsvertrags-Sektionen
  // Geltungsbereich (scope_*) und Erklärungen/Vorbehalte (decl_*). Greift nur,
  // wenn die Sektion keine eigene Überschrift trägt (extrahiereAnhang.titel leer).
  if (/^scope/.test(basis)) return 'Geltungsbereich';
  if (/^decl/.test(basis)) return 'Erklärungen und Vorbehalte';
  const roh = basis.replace(/^annex_/, '');
  return 'Anhang ' + roh.replace(/_(?=\d)/g, '.').replace(/_/g, '');
}
