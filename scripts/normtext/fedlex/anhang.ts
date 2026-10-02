/**
 * Fedlex-Extraktor — Anhänge (annex_*) und Staatsvertrags-Sektionen (scope_ und decl_ Sektionen). Split aus
 * `extrahiere-fedlex.ts`, W2·27-BUND-FERTIG PR 0, 2.10.2026. Code und Kommentare unverändert
 * verschoben (Platz für die Folgepakete P4 Anhang-Fortsetzung / P8 Typografie).
 */
import { dekodiereEntities } from '../html-entities.ts';
import { anhangAmtlichesSignal } from '../aufhebung-signal.ts';
import { ohneFortsetzungen, bloeckeAusItems } from '../anhang-fortsetzung.ts';
import { normalisiereTabelle } from '../tabelle-normalisieren.ts';
import { entferneTags, entferneFussnotenSups } from './text.ts';
import { findeDlEnde, findeDdEnde, findeSectionEnde, findeTableEnde } from './enden.ts';
import { parseDefinitionsListe } from './listen.ts';
import { parseFedlexTabelle, parseRohTabelle } from './tabellen.ts';
import { alleImgTags, bildAusImg, parseBildKacheln, ergaenzeFehlendeBilder, markiereFormeln } from './bilder.ts';
import type { AnhangText, ArtikelText } from './typen.ts';

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
 * Marke-LOSE <dd>-Notizen einer Anhang-<dl> (Fedlex: <dl><dt></dt><dd>…</dd> als Einrückung/
 * Notiz). parseDefinitionsListe verwirft marke-lose Items (Artikel-Pfad, golden-fixiert) →
 * im Anhang ginge der Text stumm verloren (§1; FIDLEV/VTS/LRV hundertfach). Je marke-loser
 * <dd> der reine Notiztext VOR einer evtl. Unterliste (deren Items erfasst parseDefinitionsListe).
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
    // Marke-los-Bestimmung MUSS mit parseDefinitionsListe übereinstimmen (Roh-Tag-Strip,
    // der «[tab]» behält), sonst Text doppelt (Fix 1.7.2026: entferneTags strippt den
    // [tab]-Spacer für Tabellen). Nur Fussnoten-Sups vorher tilgen.
    const marke = dekodiereEntities(m[1].replace(/<sup[^>]*><a[\s\S]*?<\/a><\/sup>/gi, '').replace(/<[^>]+>/g, ''))
      .replace(/[.)]\s*$/, '').trim();
    const subDlIdx = ddRoh.search(/<dl\b[^>]*>/i);
    if (marke === '') {
      // marke-loses <dd>: der reine Notiztext (vor einer evtl. Unterliste).
      const ddText = entferneTags(entferneFussnotenSups(subDlIdx >= 0 ? ddRoh.slice(0, subDlIdx) : ddRoh)).trim();
      if (ddText) notizen.push(ddText);
    }
    // REKURSION: auch UNTER einem MARKIERTEN Eltern-Item kann eine Unterliste marke-loser
    // <dd> stecken (VTS Anhang 7 «Klasse 3: 2,9 m/s²»); parseDefinitionsListe verwirft sie
    // auf JEDER Ebene (§1) → in jede Unterliste absteigen (disjunkt, keine Dublette).
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
  // W2·27-BUND-FERTIG (30.9.2026): ein Deckblatt ist EINE Sektion. Dieselbe
  // unnummerierte id MEHRFACH = eigene Anhänge (VZV: drei annex_u1 «Beilage»,
  // «Anhänge 5 und 6», «Anhang 8 und 9»), nur Einzel-Ids fallen weg. Sweep 231
  // Caches: ausser VZV verliert nur ChemRRV annex_u1 (echtes Deckblatt).
  const hatNummerierte = records.some((k) => /^annex_\d/.test(k.id));
  const idAnzahl = new Map<string, number>();
  for (const k of records) idAnzahl.set(k.id, (idAnzahl.get(k.id) ?? 0) + 1);
  const echte = hatNummerierte
    ? records.filter((k) => !(/^(?:annex_u\d+|lvl_u\d+)$/.test(k.id) && idAnzahl.get(k.id) === 1))
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
      const absorbiert: string[] = [];
      // Marke-lose <dd>-Notizen (Fedlex-Einrückung) ZUERST als Prosa sichern (§1): sie
      // leiten i.d.R. ihre Unterliste EIN («… wie folgt gekennzeichnet:»); die Item-Liste
      // hängt sich an die letzte Notiz (Lead + Items = ein Block). Fortsetzungszeilen
      // stehen schon am Item (absorbiert) und fehlen hier.
      const items = parseDefinitionsListe(dlInner, 0, true, absorbiert);
      for (const notiz of ohneFortsetzungen(markeloseNotizen(dlInner), absorbiert)) bloecke.push({ absatz: null, text: notiz });
      // P4: Zwischen-Notizen (anhang-fortsetzung.ts) teilen die Item-Liste an ihrer Stelle.
      bloeckeAusItems(items).forEach((b, k) => {
        const vor = bloecke[bloecke.length - 1];
        // Die ERSTE Item-Gruppe an den vorausgehenden Einleitungs-Absatz/Notiz anhängen — NUR wenn der
        // ein reiner Text-Block ohne eigene Liste/Tabelle/Titel ist (sonst eigener Block).
        if (k === 0 && b.text === '' && vor && vor.text && vor.titel === undefined && !vor.items && !vor.mehrspaltig) {
          vor.items = b.items;
        } else {
          bloecke.push(b);
        }
      });
    }
  }

  // Leerer Anhang-Körper = AUFGEHOBENER Anhang (Fedlex rendert «Anhang N» + Aufhebungs-
  // Fussnote, oben gestrippt): wie beim aufgehobenen Artikel (extrahiereArtikelAusAnker)
  // als «aufgehoben»-Marker («…») behalten statt stumm zu verlieren (§8; Vollständigkeit/
  // Struktur konsistent mit dem Artikel-Pfad).
  if (bloecke.length === 0) {
    const signal = anhangAmtlichesSignal(innerRoh); // W2·27: amtlicher Kopf-Vermerk (aufgehoben | gegenstandslos)
    return { titel, bloecke: [{ absatz: null, text: '…' }], ...(signal ? { [signal]: true as const } : {}) };
  }
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
