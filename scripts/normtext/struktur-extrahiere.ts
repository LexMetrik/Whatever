/**
 * Struktur-Extraktor (Bund): liest die amtliche GLIEDERUNG (Teil/Abteilung →
 * Titel → Abschnitt …) und die ARTIKEL-MARGINALIEN (Randtitel «A. / I. / 1. / a.»)
 * aus einem konsolidierten Fedlex-Filestore-HTML — je Artikel-Token.
 *
 * Reine Präsentations-Anreicherung (§3): erzeugt KEINEN Normtext, ändert die
 * Snapshots NICHT. Ergebnis landet als Sidecar (public/normtext/struktur/…),
 * das der Reader dazulädt. Golden/Generator bleiben unberührt.
 *
 * Verfahren (verifiziert an or.html, 17.6.2026): linearer Token-Lauf über
 * div/article-Öffnungen+Schliessungen (collapseable-Verschachtelung) plus
 * Überschrift-Erfassung. Jede <hN class="heading"> (N<6) ist eine Gliederungs-
 * stufe, jede <div class="heading"> eine Marginalien-stufe; beide «besitzen» die
 * unmittelbar folgende <div class="collapseable">, deren Inhalt (inkl. Artikel)
 * unter ihnen liegt. Ein Stack aus div/article (nur diese zählen fürs Nesting)
 * hält den aktuellen Gliederungs-/Marginalien-Kontext je Artikel.
 *
 * M13: erfasst auch die Schlusstitel-/UeB-Divisionen (`<article id="disp_uN/art_*">`,
 * gewickelt in `<div id="dispositions">`). Die Überschriften-Erfassung (h1/h2/
 * div.heading + section-heading-footnote) gilt dort unverändert; nur die ID-Regex
 * öffnet das disp-Anker-Schema. Der Sidecar-Schlüssel wird über ankerZuToken
 * IDENTISCH zum Snapshot-`artikel`-Token gebildet (sonst bräche der Join).
 */

import { ankerZuToken, alleAnhangAnker, extrahiereAnhang, anhangContainerEId } from './extrahiere-fedlex.ts';

export interface ArtikelStruktur {
  /** Amtliche Gliederung von aussen nach innen (Teil → Titel → Abschnitt …).
   *  EID-1 (W2·5d §12): `eId` = kumulative Fedlex-Container-eId der Ebene
   *  (`<section id="part_1/tit_1">`, AKN-Schema) — reine, bei jeder Regeneration
   *  neu erzeugte OUTBOUND-Daten für ELI-Deep-Links (`quelleUrl#<eId>`), NIE
   *  eigene persistente Anker (revisions-brüchige Pfade, §12.1/§12.4, K2/R8).
   *  W2·5d-ANNEX: auf dem Anhang-Pfad trägt die eine Stufe «Anhänge» statt einer
   *  Section-eId die Container-eId `annex` des `<div id="annex">` (s.
   *  `extrahiereAnhangStruktur`) — dieselbe Rolle, anderer amtlicher Knoten. */
  gliederung: Array<{ ebene: number; label: string; eId?: string }>;
  /** Marginalien-Kette (Randtitel) von aussen nach innen. */
  marginalie: string[];
  /** Fussnoten, die an einer Überschrift/einem Randtitel über diesem Artikel
   *  hängen (section-heading-footnote) — am ERSTEN Artikel unter der Überschrift.
   *  G11: die ASSOZIATION zur konkreten Überschrift (label + kind) bleibt erhalten,
   *  damit der Marker am richtigen Sektions-/Randtitel-Kopf gesetzt werden kann
   *  (statt anonym auf Artikelebene zu fallen). */
  randtitelFn?: Array<{ fnId: string; label: string; kind: 'g' | 'm' }>;
}

// EID-1: `section` matcht zusätzlich, NUR um die Container-eId (`id="part_1/…"`)
// mitzuschneiden — Sektionen zählen weiterhin NICHT für das div/article-Nesting.
const TAG = /<(\/?)(div|article|h[1-6]|section)\b([^>]*)>/gi;
const CLASS = /\bclass="([^"]*)"/i;
// M13: Haupttext-Artikel «art_…» ODER Schlusstitel-/UeB-Artikel «disp_uN/art_…»
// (auch «disp_N/art_…» ohne «u», z.B. VZG). Strukturelle Anker (disp_u1/chap_1,
// …/lvl_A) tragen kein «art_» → ausgeschlossen.
const ID = /\bid="((?:disp_u?\d+\/)?art_[^"]+)"/i;

function hatKlasse(attrs: string, name: string): boolean {
  const m = attrs.match(CLASS);
  return m ? m[1].split(/\s+/).includes(name) : false;
}

// M12 (W2·5b, Gegenprüfung 24.7.): Wörter, vor denen ein Trennstrich ein LEGITIMES
// hängendes Divis (Ergänzungsstrich) ist und BLEIBEN muss — Konjunktionen
// («Hin- und Rückweg») und Präpositionen inkl. Verschmelzungen («Inhaber- in
// Namenaktien», «Geschäfts- ins Privatvermögen»). Jedes ANDERE kleingeschriebene
// Folgewort nach «Wort-<Umbruch>» ist eine Silbentrennung (zusammenfügen). Am
// gesamten Bund-Korpus belegt: die einzige Nicht-Konjunktions-/-Präpositions-Klasse
// ist echte Silbentrennung (keine Gegenbeispiele). Der Wächter check:verklebung
// (Klasse B) trägt dieselbe Liste — beide müssen synchron bleiben.
// HAENGEND-Härtung 24.7.2026 (Gegenprüfungs-R3-Nebenbefund + Prüfer-Kalibrierung):
// wie/samt/je/pro/per/statt/anstatt/trotz/ab/wider/als/noch/nebst ergänzt — eine
// FEHLENDE Konjunktion/Präposition erzeugt einen still kleingeschriebenen Fehl-Merge
// mit ERFUNDENEM Wort («Grundstück- samt» → «Grundstücksamt», §1/§7: nie fabrizieren).
// TRADE-OFF (§8, ehrlich): jedes Listen-Wort, das zugleich häufige deutsche End-Silbe
// ist, macht Tor-Klasse B auf einen echten Silbenriss blind («Werk- statt» bliebe
// stehen). Kalibrierung darum je Wort Nutzen (reale Konjunktions-/Präpositions-
// Verwendung in Randtiteln) gegen Silben-Risiko: «gen» bewusst NICHT gelistet
// (häufigste End-Silbe — Korpus-Beleg «Motorwa- gen» —, ~kein Titel-Nutzen);
// die gelisteten Wörter sind im Bund-Korpus als End-Silbe unbelegt (0 Treffer).
const HAENGEND = /^(?:und|oder|bzw\.?|sowie|resp\.?|bis|beziehungsweise|respektive|wie|samt|je|pro|per|statt|anstatt|trotz|ab|wider|als|noch|nebst|in|ins|im|zu|zum|zur|an|ans|am|auf|aus|bei|beim|mit|von|vom|vor|über|unter|nach|um|ums|für|gegen|durch|ohne)$/i;

/** Ein «Wort-<Trennung><Folgewort>» (Zeilenumbruch-Trennstrich) kontextabhängig
 *  auflösen: hängendes Divis vor Konjunktion/Präposition → «- » ; Kompositum vor
 *  Grossbuchstabe → «-» ohne Leerzeichen; Silbentrennung vor sonstigem Klein-
 *  buchstaben → nahtlos zusammenfügen. */
function loeseTrennung(folgewort: string): string {
  if (!folgewort) return ' ';                           // Umbruch am Ende → Leerzeichen
  if (HAENGEND.test(folgewort)) return `- ${folgewort}`; // hängendes Divis bleibt
  if (/^[A-ZÀ-ÖØ-Þ]/.test(folgewort)) return `-${folgewort}`; // Kompositum → Bindestrich, kein Leerzeichen
  return folgewort;                                      // Silbentrennung → zusammen
}

function reinText(html: string): string {
  return html
    // Fussnoten-<sup> (mit <a>-Anker ODER Zahl) entfernen — sie kleben sonst als
    // Ziffern am Titel («Zehnter Titel:119 …»). ABER Ordinal-Suffixe «bis/ter …»
    // (<sup>bis</sup>, reine Buchstaben) BLEIBEN — sie gehören zum Titel
    // («Zweiter Titel» + «bis» = «Zweiter Titelbis», Art. 89a ff. ZGB).
    .replace(/<sup\b[^>]*>(?:(?!<\/sup>)[\s\S])*?<\/sup>/gi, (m) => (/(<a\b|\d)/i.test(m) ? '' : m))
    .replace(/<a\b[^>]*class="[^"]*footnote[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
    // M12 (W2·5b): Fedlex bricht mehrzeilige Randtitel/Überschriften am Zeilenende
    // um — als «<br>» ODER (Layout-Artefakt der Quelle) als literaler Trennstrich +
    // Leerzeichen. Der generische Tag-Strip unten entfernt Tags ERSATZLOS → ein
    // pauschales <br>→Leerzeichen zerreisst Silbentrennungen («Adoptions-<br>urlaub»
    // → «Adoptions- urlaub», Gegenprüfung 24.7.). Beide Umbruch-Kodierungen daher
    // KONTEXTABHÄNGIG über loeseTrennung() auflösen (Konjunktion/Präposition = Divis
    // bleibt; Grossbuchstabe = Kompositum-Bindestrich; sonst Silbentrennung
    // zusammenfügen). Empirisch am gesamten Bund-Korpus belegt (12 Silbentrennungs-/
    // Divis-Fälle klassifiziert, 0 Fehl-Zusammenfügungen).
    //  (a) Trennstrich AM WORTENDE (Buchstabe davor) + <br> + Folgewort:
    .replace(/([^\s<])-\s*<br\s*\/?>\s*([^\s<]*)/gi, (_m, vor: string, w: string) => vor + loeseTrennung(w))
    //  (b) übriges <br> ohne vorangehenden Trennstrich = echter Wort-Umbruch →
    //      Leerzeichen (OR «Wirkungen<br>eines» = «Wirkungen eines»).
    .replace(/<br\s*\/?>/gi, ' ')
    //  (c) literaler Trennstrich + Leerzeichen im Quelltext (kein <br>, PDF-Umbruch-
    //      Artefakt «Kassenobli- gationen»): NUR wenn ein Buchstabe direkt vor dem
    //      Trennstrich steht (kein freistehender Gedankenstrich «A - b») UND das
    //      Folgewort weder Konjunktion noch Präposition ist → Silbentrennung
    //      nahtlos zusammenfügen. Konjunktions-/Präpositions-Divis («Übergangs- und»,
    //      «Inhaber- in») und Grossbuchstaben-Komposita bleiben unberührt.
    .replace(/([^\s<])-\s+([a-zà-öø-ÿ][^\s<]*)/g, (m: string, vor: string, w: string) =>
      HAENGEND.test(w) ? m : vor + w,
    )
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Sachtitel aus einer Artikel-eigenen h6-Überschrift (BV/ZPO/StPO-Manier:
// «Art. 5 Grundsätze rechtsstaatlichen Handelns»). Fedlex setzt die ARTIKEL-
// NUMMER in <b>/<i> und Fussnoten in <sup>; der verbleibende Klartext ist der
// Sachtitel. Robuster als Text-Parsing: behält lowercase-Initialen
// («b»+«undesrechtliche»), Enumeratoren («b. Bei- und Austritt») und Titel
// nach kombinierten Nummern, verwirft aber reine Nummern-Fortsetzungen
// («Art. 370 und 371» → bleibt «und» → kein Titel) und «…»-Platzhalter.
// M12 (W2·5b, Gegenprüfung 24.7.): Fedlex nutzt <b>/<i> im h6 für DREI Dinge —
// (1) die Artikel-NUMMER («Art. 5», Bereich «a–», röm. «III»), die weg soll;
// (2) whitespace-tragende Abstandshalter («<b> </b>»), die ein Leerzeichen sind;
// (3) ECHTEN Titeltext (kursive Begriffe «Opting-out», «(Insurance Wrapper)»,
//     Binnen-Buchstabe «Cyber<i>s</i>pezialistinnen»), der ERHALTEN bleiben muss.
// Pauschales Strippen (auch → Leerzeichen) verlor (3) («Cyber pezialistinnen»,
// «( )»). Darum je <b>/<i>-Element klassifizieren. `vor` = letztes Nicht-Tag-
// Zeichen davor (unterscheidet Buchstaben-Suffix «86a» nach Ziffer [weg] vom
// Binnen-Buchstaben «Cybers» nach Buchstabe [bleibt]). Empirisch am gesamten
// Bund-Korpus belegt (93 Nicht-reine-Nummer-Fälle klassifiziert).
function biErsetzung(innerRoh: string, vor: string): string {
  const c = innerRoh
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
  if (c === '') return ' ';                                   // Abstandshalter → Leerzeichen
  if (/^(?:Art\.?|§)/.test(c)) return '';                     // «Art.»/«§» = Nummer-Wort
  if (/\d/.test(c)) return '';                                // enthält Ziffer = Nummer/Bereich
  if (/^[IVXLCDM]+$/.test(c)) return '';                      // römische Artikelnummer «III»
  if (/^[a-zà-öø-ÿ]?[–—−-]/i.test(c) && /\d/.test(vor)) return ''; // Bereichs-Suffix «a–»/«−» nach Ziffer
  if (/^[a-zà-öø-ÿ]$/i.test(c) && /\d/.test(vor)) return '';  // Buchstaben-Suffix «86a» nach Ziffer
  return innerRoh;                                            // ECHTER Titeltext → Inhalt behalten
}

function artikelSachtitel(roh: string): string | null {
  const titel = reinText(
    roh
      .replace(/<sup\b[\s\S]*?<\/sup>/gi, '')    // Fussnoten-Marker
      .replace(
        /<(b|i)\b[^>]*>([\s\S]*?)<\/\1>/gi,
        (_m, _tag: string, inner: string, offset: number, s: string) => {
          const vor = s.slice(0, offset).replace(/<[^>]+>/g, '').replace(/&nbsp;|\u00a0/g, ' ').slice(-1);
          return biErsetzung(inner, vor);
        },
      ),
  );
  if (!titel || /^(?:und|et|…|\.\.\.|[–-])$/i.test(titel)) return null;
  return titel;
}

interface Knoten { iscollaps: boolean; pushed: boolean }
interface Ktx { kind: 'g' | 'm'; ebene: number; label: string; fnIds: string[]; attached: boolean; eId?: string }

/** Extrahiert je Artikel-Token die Gliederung + Marginalie aus Fedlex-HTML. */
export function extrahiereStruktur(html: string): Record<string, ArtikelStruktur> {
  const result: Record<string, ArtikelStruktur> = {};
  // W2·27 (Doppel-id): Fedlex liefert vereinzelt ZWEI <article> mit IDENTISCHER id —
  // belegt an KKV (`id="art_126_z"` zweimal: Art. 126z «Anlagebeschränkungen und
  // Anlagetechniken» und Art. 126z^tredecies «Wesentliche Mängel», deren Ordinal-
  // Suffix Fedlex nicht in die eId schreibt). Der Snapshot-Generator vergibt dafür
  // seit M9/G7 den Synthese-Suffix «__2»/«__3» (alleArtikelTokens/alleSchlussteilAnker,
  // extrahiere-fedlex.ts); der Struktur-Extraktor tat es NICHT und keyte beide
  // Vorkommen auf denselben Schlüssel — das zweite überschrieb das erste. Folge war
  // kein blosser Fehlbestand, sondern FALSCHE Daten: Art. 126z KKV trug die Marginalie
  // und die Gliederung von Art. 126z^tredecies (§1/§7). Die Zählung läuft über den
  // ROHEN Anker und ist damit deckungsgleich mit beiden Snapshot-Zählern (Haupttext
  // `art_X` bzw. Schlussteil `disp_uN/art_X` zählen je für sich).
  const ankerAnzahl = new Map<string, number>();
  const divstack: Knoten[] = [];
  const context: Ktx[] = [];
  let pending: Ktx | null = null;
  let cap: { start: number; tag: string; eId?: string } | null = null;
  let artId: string | null = null; // aktuell offener Artikel (für die fusionierte h6-Marginalie)
  // EID-1: Container-eId der zuletzt geöffneten <section id="…">. Fedlex setzt das
  // Heading UNMITTELBAR nach der Section-Öffnung (korpusweit verifiziert 24.7.2026,
  // 17'307 Sektionen, 9 NHG-h7-Ausnahmen ohne sichtbares Heading). Jedes ANDERE
  // dazwischen gematchte Tag verwirft die pending-eId — sie darf nie auf ein
  // fremdes, späteres Heading leaken (Determinismus §2).
  let pendingEId: string | null = null;

  for (const m of html.matchAll(TAG)) {
    const ist_close = m[1] === '/';
    const tag = m[2].toLowerCase();
    const attrs = m[3] ?? '';
    const ende = (m.index ?? 0) + m[0].length;

    if (!ist_close) {
      const istHeading = hatKlasse(attrs, 'heading');
      if (tag === 'section') {
        const id = attrs.match(/\bid="([^"]+)"/i);
        pendingEId = id ? id[1] : null;
        continue; // Sektionen zählen nicht fürs div/article-Nesting
      }
      if (/^h[1-6]$/.test(tag) && istHeading) {
        cap = { start: ende, tag, ...(pendingEId ? { eId: pendingEId } : {}) }; // h nicht auf den div-Stack
        pendingEId = null;
        continue;
      }
      if (tag === 'div' || tag === 'article') {
        if (tag === 'article') {
          const id = attrs.match(ID);
          if (id) {
            // Section-heading-Fussnoten: am ERSTEN Artikel unter der Überschrift
            // anhängen (Vorfahren mit noch nicht zugeordneten fnIds). G11: jede
            // fnId behält ihr Quell-Heading (label + kind), damit der Marker später
            // am richtigen Kopf gesetzt werden kann.
            const rfn: Array<{ fnId: string; label: string; kind: 'g' | 'm' }> = [];
            for (const c of context) {
              if (c.fnIds.length && !c.attached) {
                for (const fnId of c.fnIds) rfn.push({ fnId, label: c.label, kind: c.kind });
                c.attached = true;
              }
            }
            const n = (ankerAnzahl.get(id[1]) ?? 0) + 1;
            ankerAnzahl.set(id[1], n);
            artId = ankerZuToken(n === 1 ? id[1] : `${id[1]}__${n}`);
            result[artId] = {
              // EID-1: `eId` additiv NACH den Bestandsfeldern (ebene/label bleiben
              // byte-gleich in Reihenfolge und Wert; Einträge ohne Section-Wrapper
              // tragen weiterhin KEIN eId-Feld).
              gliederung: context
                .filter((c) => c.kind === 'g')
                .map((c) => ({ ebene: c.ebene, label: c.label, ...(c.eId ? { eId: c.eId } : {}) })),
              // W2·5m-LESER-V3: ein Randtitel gilt nur bis zur ersten amtlichen
              // Gliederungsebene, die er umschliesst. Fedlex verpackt im SVG den
              // ganzen III. Titel in `tit_3/lvl_u1` «Grundregel» (= Randtitel von
              // Art. 26), die Abschnitte liegen darin; ohne diese Schranke erbten
              // Art. 27–57 «Grundregel». Massgeblich sind darum nur die Marginalien
              // NACH der innersten Gliederungsebene (Test: normtext-struktur-
              // randtitel-container.test.ts).
              marginalie: context.slice(context.map((c) => c.kind).lastIndexOf('g') + 1)
                .filter((c) => c.kind === 'm').map((c) => c.label),
              ...(rfn.length ? { randtitelFn: rfn } : {}),
            };
          }
        }
        if (istHeading) cap = { start: ende, tag: 'div', ...(pendingEId ? { eId: pendingEId } : {}) };
        pendingEId = null; // EID-1: eId bindet nur an das UNMITTELBAR folgende Heading
        const knoten: Knoten = { iscollaps: hatKlasse(attrs, 'collapseable'), pushed: false };
        if (knoten.iscollaps && pending) { context.push(pending); knoten.pushed = true; pending = null; }
        divstack.push(knoten);
      }
      continue;
    }

    // Schliess-Tag
    pendingEId = null; // EID-1: ein Schliess-Tag vor dem Heading → Section wickelt kein Heading
    if (cap && tag === cap.tag) {
      const roh = html.slice(cap.start, m.index);
      const label = reinText(roh);
      // Fussnoten-Marker AN der Überschrift (vor dem Strippen) erfassen.
      const fnIds = [...roh.matchAll(/href="#(fn-[^"]+)"/gi)].map((x) => x[1]);
      const capEId = cap.eId;
      cap = null;
      const hm = /^h([1-6])$/.exec(tag);
      if (label && !/^(Art\.|§)\s/.test(label)) {
        if (hm && Number(hm[1]) < 6) pending = { kind: 'g', ebene: Number(hm[1]), label, fnIds, attached: false, ...(capEId ? { eId: capEId } : {}) };
        else if (!hm) pending = { kind: 'm', ebene: 0, label, fnIds, attached: false, ...(capEId ? { eId: capEId } : {}) };
        else pending = null;
      } else {
        // Artikel-eigene h6-Überschrift («Art. N <Sachtitel>», BV/ZPO/StPO-Manier):
        // den Sachtitel strukturell aus dem h6-Markup ziehen und als Marginalie
        // dieses Artikels erfassen — nur wenn er sonst keine div.heading-Kontext-
        // Marginalie hat (OR/ZGB unberührt: deren h6 = nur «Art. N» → kein Titel).
        if (hm && Number(hm[1]) === 6 && artId && result[artId]?.marginalie.length === 0) {
          const titel = artikelSachtitel(roh);
          if (titel) result[artId].marginalie = [titel];
        }
        pending = null;
      }
    }
    if (tag === 'article') artId = null;
    if ((tag === 'div' || tag === 'article') && divstack.length) {
      const knoten = divstack.pop()!;
      if (knoten.pushed && context.length) context.pop();
    }
  }
  return result;
}

/**
 * M13-Annex: Struktur-Sidecar für die Anhänge. Jeder content-tragende Anhang
 * (slash-freie annex_*-Sektion mit Body) erhält die Gliederung «Anhänge», sodass
 * der Reader sie über `baueGliederungsbaum` von selbst zur eigenen Top-Sektion
 * gruppiert (analog «Schlusstitel» bei M13-disp) — 0 Renderer-Umbau.
 *
 * Die Anhang-Sektionen liegen ausserhalb des `<article>`-Schemas, das
 * extrahiereStruktur (div/article-Stack) abläuft; sie werden darum NICHT von der
 * Haupt-Walk erfasst, sondern hier ADDITIV ergänzt — der bestehende Struktur-
 * Output für Artikel/Schlusstitel bleibt damit byte-gleich.
 *
 * WICHTIG (Konsistenz-Tor): die Keys MÜSSEN exakt den Snapshot-Tokens
 * entsprechen, die der Generator behält. Beide nutzen denselben Keep-Prädikat
 * (extrahiereAnhang ≠ null) → reine Gruppen-Überschriften ohne Body erscheinen
 * weder als Snapshot-Eintrag noch als Struktur-Schlüssel (kein verwaister Key).
 *
 * W2·5d-ANNEX (3.8.2026): schliesst die in §12.5 dokumentierte EID-1-Grenze
 * «Annex-Sections noch ohne eId». EID-1 schnitt die Container-eIds NUR im
 * div/article-Lauf von extrahiereStruktur mit; dieser separate Anhang-Pfad warf
 * sie weg — messbar am Bestand vor dem Bau: 54 122 von 54 122 übrigen
 * Gliederungsknoten trugen eine eId, ALLE 402 «Anhänge»-Knoten (136 Erlasse)
 * keine. Der Zusatz ist rein additiv (EID-1-Muster): `ebene`/`label`/`marginalie`
 * behalten Wert UND Reihenfolge, es kommt ausschliesslich das optionale `eId`
 * hinzu. Herkunft und Auswahl-Begründung des Werts: `anhangContainerEId`.
 */
export function extrahiereAnhangStruktur(html: string): Record<string, ArtikelStruktur> {
  const result: Record<string, ArtikelStruktur> = {};
  const eId = anhangContainerEId(html);
  const anker = alleAnhangAnker(html);
  const label = gruppenLabel(eId, anker);
  for (const a of anker) {
    const ex = extrahiereAnhang(html, a);
    if (!ex || ex.bloecke.length === 0) continue;
    result[ankerZuToken(a)] = {
      gliederung: [{ ebene: 1, label, ...(eId ? { eId } : {}) }],
      marginalie: [],
    };
  }
  return result;
}

/**
 * QS-KORPUS-SCOPE (12.9.2026): Wie die EINE Gruppenstufe heisst.
 *
 * «Anhänge» überall dort, wo der Erlass einen amtlichen Anhang-Container trägt —
 * also unverändert für alle 136 Erlasse des Vorbestands, EINSCHLIESSLICH der 14
 * Staatsverträge, bei denen `scope_*`/`decl_*` mit unter diese Stufe fallen
 * (dokumentierte Unschärfe, s. `anhangContainerEId`).
 *
 * Bei den 12 Staatsverträgen OHNE Anhang-Container wäre «Anhänge» eine
 * FALSCHAUSSAGE (§8): diese Erlasse haben keinen einzigen Anhang, die Stufe
 * trägt ausschliesslich Geltungsbereich und CH-Erklärungen. Das Label benennt
 * darum, was tatsächlich darunter hängt — deterministisch aus den gefundenen
 * Ankern, nie geraten: nur `scope_*` → «Geltungsbereich»; zusätzlich `decl_*` →
 * «Geltungsbereich und Erklärungen» (Korpus 12.9.2026: 7-mal bzw. 5-mal).
 *
 * OFFENGELEGTE RESTUNSCHÄRFE (§8): die SYNTHETISCHE Wurzel des Lesers über
 * dieser Stufe heisst weiterhin «Anhänge» — sie entsteht darstellungsseitig aus
 * `istAnhangToken` (`scope_`/`decl_` zählen dort seit PR #195 mit) und nicht aus
 * diesem Label. Das zu ändern wäre ein Darstellungs-Schritt (§3), kein
 * Extraktions-Schritt, und bleibt darum bewusst ausserhalb dieses Bauschritts.
 */
function gruppenLabel(eId: string | undefined, anker: readonly string[]): string {
  if (eId !== 'scope') return 'Anhänge';
  return anker.some((a) => /^decl/.test(a)) ? 'Geltungsbereich und Erklärungen' : 'Geltungsbereich';
}
