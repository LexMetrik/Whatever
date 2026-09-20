/**
 * scripts/normtext/rectifies-berichtigung.ts — Rot-Beweis-Fundament für den Netz-Arm
 * `check:revisionen-rectifies` (Fehlerbuch W2·18: «Wächter ‹rectifies-Ziel vs.
 * Berichtigungstext›»).
 *
 * Befund (Gegenprüfung PR #827; §8-Marker `RevisionEintrag.plausibilitaet`
 * 'berichtigung-fremdes-as-dokument', s. revisionen-generieren.ts): Fedlex' `jolux:rectifies`
 * kann auf das FALSCHE AS-Dokument zeigen. Live-Beleg AS 2025 686 (SKV): das rectifies-Ziel
 * ist `eli/oc/2025/648` (TAFV 2, SR 741.413, Fundstelle «AS 2025 648»), der amtliche
 * Berichtigungstext selbst nennt aber wörtlich «SKV Änderung vom 15. Oktober 2025
 * (AS 2025 644; SR 741.013)» — ein belegter Fedlex-Datenfehler.
 *
 * Dieses Modul ist die REINE, testbare Hälfte (§2): Berichtigungstext (bereits geholt) →
 * Headline-Zitat(e) → Klasse. Der Netz-Teil (SPARQL-Auflösung + Fetch) ist injizierbar
 * (`FetchImpl`), damit `check-revisionen-rectifies.ts` ihn cachen kann (Determinismus,
 * Skill `scraping-swiss-official-sources` §Keep current cheaply — ein amtliches Berichtigungs-
 * dokument ist nach Publikation unveränderlich, der Cache also kein zweiter Wahrheits-Ort).
 *
 * ── Extraktion (Headline-Zitat, NICHT jede AS-/SR-Erwähnung) ──
 * Der amtliche Berichtigungstext nennt den korrigierten Erlass/die korrigierte Änderung
 * IMMER in der Form «<Erlasstitel> [Änderung(en)] vom <Tag>. <Monat> <Jahr> (AS <jjjj> <nnn>
 * [; SR <x.y>])» — live an ChemRRV/SKV/SSV/VVEA verifiziert. Eine BLOSSE «AS jjjj nnn»- oder
 * «SR x.y»-Suche (ohne das «vom <Datum> (…)»-Ankerformat) reisst beiläufige Fussnoten mit
 * herein (Gegenbeleg live an ELV/oc/2024/130: Fussnote «Ursprünglich Art. 1 (AS 2020 599)»
 * neben dem echten Ziel «(AS 2007 5155)» — hätte das Zwei-AS-Kriterium für Sammelberichtigung
 * fälschlich ausgelöst). Zwei Fedlex-HTML-Eigenheiten, beide live falsifiziert und in der
 * Regex abgefangen: (a) ein NBSP/Leerzeichen VOR der schliessenden Klammer («SR 741.21 )» —
 * ohne `\s*` vor `\)` verfehlt, s. SSV/oc/2024/144 Erst-Fassung dieses Reglers; (b) ein
 * Leerzeichen NACH der öffnenden Klammer («( AS 2019 1495; SR 814.81)») — ohne `\s*` nach
 * `\(` verfehlt, s. ChemRRV/oc/2026/394.
 *
 * Mehrere Headline-Zitate im selben Text (live an SSV/oc/2024/144: SSV UND NSV je mit
 * eigenem «vom … (AS …)»; VVEA/oc/2023/543: zwei unabhängige Änderungen) = eine echte
 * Sammelberichtigung — der Marker/das rectifies-Tripel bildet dann nur EINE der mehreren
 * betroffenen Fundstellen ab (§8-Ehrlichkeit, wie `baueOcZuRectifiesSr`).
 *
 * ── Ergänzung 12.9.2026, Gegenprüfung PR #834 (Auflage 1) ── (2b: ergänzt, nicht
 * nachgeführt — die Erst-Fassung oben bleibt der SKV-Beleg, unverändert)
 * ZWEITER belegter Fedlex-Datenfehler, live nachgemessen: AIG/oc/2025/342. Der amtliche
 * Berichtigungstext korrigiert ausdrücklich «Änderung vom 25. September 2015 (AS 2016
 * 3101)», Anhang Ziff. 1, AIG (SR 142.20) Art. 80 Abs. 1. Das rectifies-Ziel `eli/oc/2018/438`
 * (Fundstelle AS 2018 2855) ist dagegen NUR eine Inkraftsetzungsverordnung ohne eigenen
 * Normtext — ihr Volltext (PDF-A, verifiziert 12.9.2026) lautet vollständig: «Einziger
 * Artikel: Die Änderung vom 25. September 2015 des AsylG tritt am 1. März 2019
 * abschliessend in Kraft.» Sie kann die im Berichtigungstext zitierte Anhangs-Änderung
 * nicht selbst tragen — jolux:rectifies zeigt auf das falsche AS-Dokument. Beide Funde
 * jetzt in `bibliothek/normtext/rectifies-ausnahmen.json`.
 *
 * ── Falle c, 18.9.2026, Normen-Monitor-Lauf 35353185468 (Parser-Lücke, KEIN Fedlex-
 * Datenfehler) ── EINE Klammer kann MEHRERE komma-getrennte AS-Nummern DESSELBEN Jahrgangs
 * tragen: VTS/oc/2025/691 nennt «Änderung vom 15. Oktober 2025 (AS 2025 646, 665; SR
 * 741.41)» — Filestore-Beleg
 * https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/oc/2025/691/de/html/
 * fedlex-data-admin-ch-eli-oc-2025-691-de-html.html (Abruf 18.9.2026). AS 2025 665 ist
 * selbst eine frühere Berichtigung DERSELBEN Änderung (Genre 900, dateDocument 2025-10-30,
 * SPARQL `eli/oc/2025/665` — Abruf 18.9.2026), keine unabhängige zweite Änderung. Die
 * Erst-Fassung der Regex liess nach der ersten Nummer nur `;SR…` oder die schliessende
 * Klammer zu und verfehlte den Fall vollständig (0 Treffer). Fix: Gruppe 2 der Regex lässt
 * `(?:\s*,\s*\d+)*` weitere Nummern zu, `extrahiereHeadlineZitate` fügt jede einzeln der
 * `as`-Menge UND dem sie tragenden Block hinzu (s. unten, Ergänzung 18.9.2026).
 *
 * ── Ergänzung 18.9.2026, Gegenprüfung Opus (Auflagen B1 + B2) ── (2b: ergänzt, nicht
 * nachgeführt — der Falle-c-Befund oben bleibt unverändert stehen; die ERST-Fassung liess
 * die Klassifikation bewusst unverändert, «mehr als eine genannte Fundstelle bleibt
 * sammelberichtigung, exakt wie bei VVEA/oc/2023/543 und SSV/oc/2024/144» — DAS war falsch
 * und ist mit dieser Ergänzung korrigiert, s. u.). VTS/oc/2025/691 ist EINE korrigierte
 * Änderung mit zweiteiliger Fundstelle in EINEM Headline-Block, nicht zwei unabhängige
 * Änderungen (VVEA/SSV haben ZWEI separate «vom … (AS …)»-Blöcke, VTS nur EINEN mit zwei
 * komma-getrennten Nummern). Zwei Bugs folgten aus der Gleichbehandlung:
 * (B1) `zitate.as.length > 1` klassierte JEDE Mehrfach-Nennung unconditioniert als
 *      `sammelberichtigung`, ohne zu prüfen, ob das rectifies-Ziel überhaupt darunter ist —
 *      ein Text, der «AS 2025 646, 665» nennt, während das rectifies-Ziel auf ein FALSCHES
 *      Dokument (z. B. AS 2025 999) zeigt, wurde damit still grün statt rot (Schlupfloch,
 *      Repro Gegenprüfung 18.9.2026).
 * (B2) Sammelberichtigung ist eigentlich ein Aussage über BLÖCKE (unabhängige Änderungen),
 *      nicht über die rohe AS-Anzahl. `HeadlineZitate` trägt darum neu `bloecke` — ein
 *      `HeadlineBlock` je Headline-Zitat-Vorkommen (Regex-Treffer); `klassifiziereBerichtigung`
 *      unterscheidet jetzt: GENAU EIN Block ⇒ `uebereinstimmend`, wenn das Ziel in DIESEM
 *      Block liegt, sonst `abweichend` (schliesst B1). MEHR als ein Block ⇒
 *      `sammelberichtigung`, wenn das Ziel in der VEREINIGUNG aller Blöcke liegt, sonst
 *      `abweichend`. `as`/`sr` bleiben als flache, deduplizierte Listen für bestehende
 *      Konsumenten (Anzeige in `check-revisionen-rectifies.ts`) erhalten.
 *
 * ── Runde 2, 19.9.2026 (rectifies-Tor auf dem #909-Datenstand, ROADMAP QS-MONITOR-ROT) ──
 * Rot-Reproduktion auf origin/chore/fedlex-frische-2026-09-18 + origin/main (82 Kanten statt
 * 31): DREI weitere Parser-Lücken, live an KRK/oc-2026-314, OR/oc-2023-62, VZAE/oc-2026-170
 * belegt (Filestore-HTML je Abruf 19.9.2026, RECTIFIES_CACHE=netz) — keine davon ein
 * Fedlex-Datenfehler.
 * (c1) Staatsvertrags-Headline: bei einem Übereinkommen steht «vom <Datum>» im ERLASSTITEL
 *      (`<h1>Übereinkommen vom 20. November 1989 <br>über die Rechte des Kindes</h1>`), die
 *      AS-Klammer aber in einem SEPARATEN, nachfolgenden `<p>` OHNE eigenes «vom …» — die
 *      Erst-Fassung verlangte `\s*\(` direkt nach dem Jahr und verfehlte damit jeden
 *      Titel-Text dazwischen («über die Rechte des Kindes», 0 Treffer). Beleg KRK/oc-2026-314.
 *      Fix: `[^()]{0,120}?` statt `\s*` vor der öffnenden Klammer — bewusst NICHT `[^)]`, damit
 *      eine fremde, VORAUSGEHENDE Klammer (z. B. ein Klammer-Zusatz vor der echten AS-Klammer)
 *      den Treffer verhindert statt ihn falsch zu verschieben (§7: lieber 0 Treffer als ein
 *      geratener).
 * (c2) Leerzeichen vor dem Semikolon: Fedlex verteilt die Klammer oft über mehrere `<span>`
 *      (`3173</span><span>; SR</span>`) — das Tag-Entfernen macht daraus ein Leerzeichen VOR
 *      dem `;`, das die Erst-Fassung nicht zuliess (0 Treffer). Beleg VZAE/oc-2026-170:
 *      «(AS 2018 3173 ; SR 142.201 )». Fix: `\s*` zusätzlich vor `(?:;\s*SR…)` — dieselbe
 *      Tag-Fragmentierungs-Ursache wie die beiden bereits behobenen Fallen a/b oben, nur an
 *      einer dritten Stelle derselben Klammer.
 * (c3) Fussnotenzeichen UND Fussnoten-KÖRPER reissen die Extraktion, zwei getrennte Fallen:
 *      – Marker inline: «(AS 2020 4005<sup><a href="#fn-…">1</a></sup>; SR 220)» wird nach dem
 *        generischen Tag-Entfernen zu «4005 1 ; SR 220» — die nackte Fussnoten-ZAHL reisst die
 *        Zahlenfolge auseinander (0 Treffer). Beleg OR/oc-2023-62. Fix: `<sup><a
 *        href="#fn-…">…</a></sup>`-Marker werden VOR der generischen Tag-Entfernung ganz
 *        entfernt (nicht nur zu Leerzeichen — sie sitzen ohne Trenner an der Zahl).
 *      – Körper als Phantom-Treffer: der GEWEITETE Klammer-Abstand aus (c1) macht die
 *        Fussnoten-KÖRPER-Prosa («Diese Bestimmung wird mit Inkrafttreten der Änderung vom
 *        3. September 2025 der Bundespersonalverordnung vom 3. Juli 2001 (AS 2025 569) zu
 *        Absatz 5.») selbst treffbar — eigene Erst-Probe an BPV/oc-2026-324 hätte sonst einen
 *        FALSCHEN zusätzlichen Block «AS 2025 569» erzeugt (Skill `scraping-swiss-official-
 *        sources`, Falle «Footnote-leak», hier durch (c1) reaktiviert). Fix: der Text ab dem
 *        ERSTEN `<div class="footnotes"` wird VOR der Extraktion ganz abgeschnitten — jede
 *        Headline-Zitat-Stelle steht immer im Preamble, nie in einer Fussnote (live über alle
 *        62 zu diesem Zeitpunkt geladenen Filestore-HTML geprüft: 0 Fälle, in denen eine
 *        echte Headline-Klammer NACH der ersten Fussnoten-`<div>` beginnt).
 *
 * B1 erneut geprüft (Auflage aus Gegenprüfung #908, Runde 2): das im Auftrag genannte Beispiel
 * «(AS 2015 5699, 2022; SR …)» hat in den 62 fetch-baren Berichtigungstexten des #909-Bestands
 * KEIN Gegenstück — der einzige Mehrfach-Treffer im gesamten Korpus ist VTS/oc-2025-691 (AS
 * 2025 646, 665), beide Nummern amtlich derselbe Jahrgang. Die amtliche AS-Zitierkonvention
 * trägt IMMER genau einen Jahrgang pro Klammer (ein zweiter Jahrgang wird immer mit eigenem
 * «AS <Jahr>» wiederholt, nie nur als nackte Zahl nach Komma) — die im Auftrag beschriebene
 * Verwechslungsgefahr ist damit durch die amtliche Konvention selbst ausgeschlossen, nicht nur
 * durch fehlende Beispiele. Keine Code-Änderung (§7: kein Fix ohne Beleg einer echten
 * Fehlmessung) — offener Beobachtungspunkt, falls ein künftiger Fund das widerlegt.
 *
 * ── Nachzug R2b, 19.9.2026 (Auflagen unabhängige Opus-Gegenprüfung, Falsch-Grün-Risiko F1) ──
 * Das bis hierhin gültige `[^()]{0,120}?`-Fenster (Falle c1 oben) ist BREITER als amtlich
 * belegt und lässt zwei konstruierte Gegenbeispiele durch: (GB1) Fliesstext im `<main>`, KEINE
 * Fussnote, mit einer beiläufigen «vom … (AS …)»-Nennung — würde als zweiter, falscher Block
 * gewertet; (GB2) eine Satzgrenze im Fenster («vom 1. Januar 2020. Der Bundesrat hat … verweist
 * (AS 2024 999)») — das Fenster sollte NIE über einen Satzschluss hinwegspringen. Messung über
 * alle 62 zum damaligen Zeitpunkt geladenen Filestore-HTML (Skript im Bau-Bericht): 66 echte
 * Treffer, längste reale Lücke 28 Zeichen (KRK, s. Falle c1), 0 Satzgrenzen-Überspringer.
 * Doppelte Gegenmassnahme:
 * (R2b-1) STRUKTURELLES ANKERN, so weit es für alle 66 Treffer trägt (es trägt NICHT für alle —
 *   7 der 62 Dokumente (älteres Fedlex-Vorlagenformat, z. B. ChemV/oc-1988-560) haben ihren
 *   Erlassdatum-Absatz OHNE jede Klasse: nacktes `<p>vom … (AS …)</p>`. Reine Klassen-Filterung
 *   auf `erlassdatum`/`man-template-datum-aend`/`erlasstitel` verfehlt darum 7/62 Dokumente —
 *   das ist mit blossem Fenster+Satzgrenzen-Sperre allein NICHT zu unterscheiden, weil die
 *   Klasse schlicht fehlt, nicht weil ein anderes Signal fehlt). Fund UMGANGEN, nicht ignoriert:
 *   der Abschnitt VOR dem ersten `<main`-Tag (Kopf/`preface`/`preamble`) ist bei JEDEM der 62
 *   Dokumente ohnehin nur Titel+Kurztitel+Datum — strukturell viel enger als beliebiger
 *   `<main>`-Fliesstext — und wird darum VOLLSTÄNDIG verwendet (deckt die 7 unklassierten Fälle
 *   UND den KRK-Sonderfall, wo «vom …» im `erlasstitel` steht und die AS-Klammer erst im
 *   nachfolgenden `<p>` OHNE eigenes «vom» folgt — Falle c1). Der Teil AB dem ersten `<main`-Tag
 *   wird dagegen NUR durchsucht, soweit er innerhalb eines der drei Klassen-Elemente liegt (löst
 *   die drei belegten `<main>`-Zweit-Headlines SSV/oc-2024-144 «(AS 2007 5957)»,
 *   LRV/oc-2025-537, KLV/oc-2026-209 — alle drei tragen `erlassdatum`/`man-template-datum-aend`
 *   auch innerhalb `<main>`). `<main>`-FLIESSTEXT OHNE eine dieser Klassen (GB1) ist damit
 *   STRUKTURELL ausgeschlossen, nicht nur durch das Fenster begrenzt.
 * (R2b-2) Fenster von 120 auf 40 Zeichen verkürzt (deckt die reale Maximallücke 28 mit Reserve)
 *   UND eine Satzgrenzen-Sperre ergänzt (kein `. ` + Grossbuchstabe in der Lücke) — als
 *   zusätzliche, vom Klassen-Anker UNABHÄNGIGE Verteidigungslinie (greift auch, falls die
 *   Vorspann-Klammer einmal doch eine gefüllte Prosa-Lücke wie GB2 enthält).
 * Regressionsbeweis (Bau-Bericht): alle 62 Dokumente liefern mit dem neuen Code BYTE-GLEICHE
 * `as`/`sr`/`bloecke`-Ergebnisse wie zuvor (0 Abweichungen) — GB1 liefert nur noch den echten
 * ersten Block (keinen erfundenen zweiten aus Fliesstext), GB2 liefert 0 Blöcke.
 */
import { sparqlSelect, type FetchImpl } from '../fedlex-sparql.ts';
import type { RectifiesInfo } from './revisionen-generieren.ts';

const LANG_DE = '<http://publications.europa.eu/resource/authority/language/DEU>';

/** Headline-Zitat: «vom <Tag>. <Monat> <Jahr> [Titel-Rest] ( AS <jjjj> <nnn>[, <mmm>[, …]]
 *  [; SR <x.y> ] )». `\s*` an drei Stellen innerhalb (s. Docstring, Fallen a/b/c2, alle live
 *  belegt). Vor der öffnenden Klammer (Nachzug R2b, Falsch-Grün-Risiko F1): `[^()]{0,40}?` MIT
 *  Satzgrenzen-Sperre (`(?!\.\s*\p{Lu})` vor jedem Lückenzeichen) statt des früheren blossen
 *  `[^()]{0,120}?` — 40 statt 120, weil die längste live gemessene reale Lücke 28 Zeichen ist
 *  (KRK/oc-2026-314, Titel-Rest «über die Rechte des Kindes»); die Satzgrenzen-Sperre verhindert
 *  zusätzlich, dass die Lücke über einen abgeschlossenen Satz hinwegspringt (Gegenbeispiel GB2,
 *  s. Docstring). Diese Regex wird NUR noch auf den strukturell vorgefilterten Text angewendet
 *  (s. `extrahiereHeadlineZitate`/`baueHeadlineSuchtext`) — das eigentliche Falsch-Grün-Risiko
 *  (Fliesstext-Prosa, GB1) schliesst der Struktur-Filter, nicht diese Regex allein. Gruppe 2
 *  kann mehrere komma-getrennte Nummern DESSELBEN Jahrgangs tragen (Falle c, s. Docstring) — die
 *  Aufsplittung passiert in `extrahiereHeadlineZitate`, nicht hier in der Regex. */
const HEADLINE_ZITAT =
  /vom\s+\d{1,2}\.\s*\p{L}+\s+\d{4}(?:(?!\.\s*\p{Lu})[^()]){0,40}?\(\s*AS\s+(\d{4})\s+(\d+(?:\s*,\s*\d+)*)\s*(?:;\s*SR\s+([\d.]+)\s*)?\)/gu;

/** Ein Element, dessen Text sicher zum Headline-Zitat gehören kann (Nachzug R2b, s. Docstring
 *  R2b-1): `erlassdatum`/`man-template-datum-aend` (Erlassdatum-Absatz) oder `erlasstitel`
 *  (trägt bei Staatsverträgen «vom …» selbst im Titel, Falle c1). NUR für den Textabschnitt AB
 *  dem ersten `<main`-Tag relevant — davor wird ohnehin der GESAMTE Text verwendet
 *  (`baueHeadlineSuchtext`). `h1|h2|h3|p`: alle live beobachteten Trägerelemente; keine
 *  verschachtelten Vorkommen dieser Tags innerhalb sich selbst beobachtet (§7: nicht raten,
 *  gegen alle 62 Filestore-HTML geprüft). */
const HEADLINE_KLASSEN_ELEMENT =
  /<(h1|h2|h3|p)\b[^>]*\bclass="[^"]*\b(?:erlassdatum|man-template-datum-aend|erlasstitel)\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g;

/** Fussnotenzeichen-Marker («<sup><a href="#fn-…">1</a></sup>», direkt an eine Zahl angehängt,
 *  KEIN Trenner) — vor der generischen Tag-Entfernung ganz entfernt (Falle c3, OR/oc-2023-62).
 *  Der Fussnoten-KÖRPER selbst (eigene `<div class="footnotes">`) wird separat abgeschnitten,
 *  s. `entferneFussnotenKoerper`. */
const FUSSNOTEN_MARKER = /<sup>\s*<a\s+href="#fn-[^"]*"[^>]*>[\s\S]*?<\/a>\s*<\/sup>/gi;

/** Schneidet den Fussnoten-Körper ab (alles ab der ERSTEN `<div class="footnotes"`).
 *  RICHTIGSTELLUNG (F6, Nachzug R2b): eine Headline-Zitat-Stelle steht NICHT «immer im
 *  Preamble» — 3 von 66 live gemessenen Treffern liegen in `<main>` (SSV/oc-2024-144
 *  «(AS 2007 5957)», LRV/oc-2025-537, KLV/oc-2026-209, alle drei in Elementen mit Klasse
 *  `erlassdatum`/`man-template-datum-aend`). Der Schnitt hier betrifft nur den FUSSNOTEN-Körper,
 *  nicht `<main>` allgemein — s. `baueHeadlineSuchtext` für die eigentliche Struktur-Eingrenzung.
 *  Ohne diesen Schnitt macht die geweitete Klammer-Distanz aus Falle c1 auch Fussnoten-Prosa
 *  treffbar (Skill `scraping-swiss-official-sources`, Falle «Footnote-leak»; Beleg
 *  BPV/oc-2026-324: «… Änderung vom 3. September 2025 der Bundespersonalverordnung vom
 *  3. Juli 2001 (AS 2025 569) …» in der Fussnote hätte sonst einen erfundenen zweiten Block
 *  erzeugt) — dieses Restrisiko (Fussnoten-KÖRPER-Prosa mit einer zufällig passenden
 *  «vom … (AS …)»-Nennung) bleibt für den Preamble-Teil bestehen, ist aber seit R2b für
 *  `<main>`-Fliesstext AUSSERHALB der drei Klassen strukturell ausgeschlossen (s. Docstring
 *  oben, Auflage R2b-1). Restrisiko (Nachzug R2c, C4, Beobachtungspunkt (c) im Dossier): der
 *  Schnitt greift nur `<div class="footnotes…` — ein künftiges Fedlex-Layout mit
 *  `<section class="footnotes">` würde daran vorbeilecken (gemessen: alle 17 heutigen
 *  Fussnoten-Container im 62er-Korpus sind `<div>`, kein Live-Fall). */
function entferneFussnotenKoerper(html: string): string {
  return html.split(/<div class="footnotes/)[0];
}

/** Ein EINZELNES Headline-Zitat-Vorkommen («vom … (AS … [, …] [; SR …])», EIN Regex-Treffer).
 *  Mehrere komma-getrennte Nummern IN DERSELBEN Klammer (VTS/oc/2025/691) landen im SELBEN
 *  Block; mehrere UNABHÄNGIGE Klammern (VVEA/oc/2023/543, SSV/oc/2024/144) ergeben mehrere
 *  Blöcke (Ergänzung 18.9.2026, Auflage B2). */
export interface HeadlineBlock {
  /** Distinkte «AS jjjj nnn»-Fundstellen DIESES Blocks, sortiert. */
  as: string[];
  /** SR-Notation dieses Blocks, falls im selben Zitat genannt. */
  sr?: string;
}

export interface HeadlineZitate {
  /** Distinkte «AS jjjj nnn»-Fundstellen über ALLE Blöcke, sortiert (flache Projektion für
   *  bestehende Konsumenten, z. B. die Anzeige in check-revisionen-rectifies.ts). */
  as: string[];
  /** Distinkte SR-Notationen über ALLE Blöcke, sortiert. */
  sr: string[];
  /** Je ein Eintrag pro Headline-Zitat-Vorkommen — Grundlage der Klassifikation (Auflage B2,
   *  s. `klassifiziereBerichtigung`). */
  bloecke: HeadlineBlock[];
}

/** Baut den Suchtext für die Headline-Regex (Nachzug R2b, s. Docstring R2b-1): der Abschnitt
 *  VOR dem ersten `<main`-Tag geht VOLLSTÄNDIG ein (Kopf/`preface`/`preamble` — bei allen 62
 *  live geprüften Dokumenten strukturell nur Titel/Kurztitel/Datum, unabhängig davon, ob der
 *  Erlassdatum-Absatz eine der drei Headline-Klassen trägt oder nicht, s. ChemV-Gegenbeleg).
 *  Der Abschnitt AB `<main` geht NUR ein, soweit er innerhalb eines `HEADLINE_KLASSEN_ELEMENT`
 *  liegt — das schliesst freien `<main>`-Fliesstext (Gegenbeispiel GB1) strukturell aus, ohne
 *  die drei belegten `<main>`-Zweit-Headlines zu verlieren (die tragen dieselben Klassen).
 *  Restrisiko (Nachzug R2c, C4, Beobachtungspunkt (b) im Dossier): der Struktur-Anker schützt
 *  nur GEGEN Fliesstext AUSSERHALB der drei Klassen — Prosa INNERHALB eines bereits klassierten
 *  Elements (z. B. ein längerer Titel-Zusatz vor der Datums-/AS-Nennung) bleibt ungeschützt und
 *  nur noch durch das 40-Zeichen-Fenster samt Satzgrenzen-Sperre begrenzt (kein Live-Fall im
 *  62er-Korpus bekannt). */
function baueHeadlineSuchtext(ohneFussnoten: string): string {
  const [vorMain, ...rest] = ohneFussnoten.split(/<main\b/);
  const nachMain = rest.join('<main');
  const klassenTeile = [...nachMain.matchAll(HEADLINE_KLASSEN_ELEMENT)].map((m) => m[2]);
  // Fugentrenner ' () ' statt ' § ' (Nachzug R2c, Auflage C1, Falsch-Grün-Risiko, Rot-Beweis
  // A5/A5b): `§` liegt in `[^()]` und ist damit für das Klammer-Fenster von HEADLINE_ZITAT
  // (`[^()]{0,40}?` zwischen «vom <Datum>» und der öffnenden Klammer) durchlässig — ein
  // «vom <Datum>» am ENDE eines Elements band dadurch über die Fuge hinweg an die AS-Klammer
  // des NÄCHSTEN Elements (Phantom-Block, der `abweichend` fälschlich zu `sammelberichtigung`
  // machen kann). Eine LEERE Klammer ist für dasselbe Fenster UNÜBERWINDBAR: `(` und `)` sind
  // aus `[^()]` ausdrücklich ausgeschlossen, das Fenster kann also nie über eine Fuge hinweg
  // an die nächste Klammer binden — unabhängig davon, wie viele Elemente verbunden werden.
  return [vorMain, ...klassenTeile].join(' () ');
}

/** Reine Extraktion (§2, kein Netz) — Fedlex-Filestore-HTML → Headline-Zitate.
 *  Reihenfolge: (1) Fussnoten-Körper abschneiden (Falle c3a), (2) Fussnoten-Marker entfernen
 *  (Falle c3b), (3) Struktur-Suchtext bauen (Nachzug R2b, `baueHeadlineSuchtext`), (4) generische
 *  Tags zu Leerzeichen — Fedlex verteilt ein Zitat oft über mehrere `<span>`, z. B.
 *  `<span>AS</span><span> </span>2016<span> 3101)</span>` — eine Regex über den rohen
 *  HTML-String verfehlt das systematisch, live an AIG/oc/2025/342 belegt). */
export function extrahiereHeadlineZitate(html: string): HeadlineZitate {
  const ohneFussnoten = entferneFussnotenKoerper(html).replace(FUSSNOTEN_MARKER, '');
  const text = baueHeadlineSuchtext(ohneFussnoten)
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const asSet = new Set<string>();
  const srSet = new Set<string>();
  const bloecke: HeadlineBlock[] = [];
  for (const m of text.matchAll(HEADLINE_ZITAT)) {
    const blockAsSet = new Set<string>();
    for (const nummer of m[2].split(',')) {
      const fundstelle = `AS ${m[1]} ${nummer.trim()}`;
      asSet.add(fundstelle);
      blockAsSet.add(fundstelle);
    }
    if (m[3]) srSet.add(m[3]);
    bloecke.push({ as: [...blockAsSet].sort(), sr: m[3] });
  }
  return { as: [...asSet].sort(), sr: [...srSet].sort(), bloecke };
}

/** Kanonische Text-Fundstelle für den Stale-Vergleich (Nachzug R2b, F3): ALLE im Berichtigungs-
 *  text genannten AS-Fundstellen, sortiert (bereits Sortierreihenfolge von `extrahiereHeadline-
 *  Zitate.as`), mit ` + ` verbunden. Bei GENAU EINER Fundstelle byte-gleich zur bisherigen Form
 *  (nur die Fundstelle selbst, kein Trenner) — die drei bestehenden Ausnahmeliste-Einträge
 *  (SKV/AIG/LRV, je genau eine Text-Fundstelle) bleiben damit unverändert gültig. Bei 0
 *  Fundstellen `undefined` (0-Treffer-Fall, s. `formatiereBefundDetail` — eine PARSER-Lücke,
 *  keine leere Text-Fundstelle im Sinne dieser Funktion).
 *  Befund (F3): die vorherige Fassung setzte die Text-Fundstelle in `check-revisionen-
 *  rectifies.ts` NUR bei `zitate.as.length === 1` — bei MEHREREN AS-Fundstellen blieb sie
 *  `undefined`, wodurch `ausnahmeGueltig` `'' === ''` verglich (Stale-Sicherung still
 *  ausgeschaltet, §6.7). */
export function kanonischeTextFundstelle(as: readonly string[]): string | undefined {
  return as.length === 0 ? undefined : [...as].sort().join(' + ');
}

export type RectifiesKlasse = 'uebereinstimmend' | 'abweichend' | 'sammelberichtigung';

/** Ein Eintrag in `bibliothek/normtext/rectifies-ausnahmen.json` (Gegenprüfung PR #834,
 *  Auflage 3, §6.7-Stale-Schutz): eine Ausnahme trägt NICHT nur die oc-Identität, sondern
 *  das PAAR, das sie ursprünglich belegt hat — welches Ziel das rectifies-Tripel nannte
 *  UND welche Fundstelle der Berichtigungstext selbst nannte. Ändert sich eines von beiden
 *  (Fedlex korrigiert das Tripel, oder ein neuer Text erscheint unter derselben oc), gilt
 *  die Ausnahme NICHT mehr automatisch weiter — sonst wäre sie ein stiller Freibrief, der
 *  nie wieder scheitern kann (§6.7 «ein Tor, das nicht scheitern kann, ist gefährlicher
 *  als keines»). */
export interface RectifiesAusnahme {
  oc: string;
  seit: string;
  belegUrl: string;
  begruendung: string;
  erwartetesZielOc: string;
  erwarteteZielFundstelle?: string;
  erwarteteTextFundstelle?: string;
}

/** Reine Prüfung (§2): passt die dokumentierte Ausnahme noch zur AKTUELL gemessenen
 *  Realität (frisches rectifies-Ziel + frisch extrahierte, kanonische Text-Fundstelle, s.
 *  `kanonischeTextFundstelle`)? `false` ⇒ die Ausnahme ist stale — der Aufrufer listet sie dann
 *  als eigene, rote Klasse statt sie stillschweigend weiter greifen zu lassen.
 *  F3-Sicherung (Nachzug R2b, §6.7): ein Eintrag OHNE `erwarteteTextFundstelle` ist NIE gültig
 *  — auch nicht, wenn `aktuell.textFundstelle` ebenfalls fehlt (0-Treffer-Fall). Die vorherige
 *  Fassung verglich beide Seiten über `?? ''` und liess «leer == leer» als Treffer durch; damit
 *  hätte ein Eintrag ohne dokumentierte Text-Fundstelle die Stale-Sicherung stillschweigend
 *  ausser Kraft gesetzt, sobald die Kante zufällig ebenfalls 0 Treffer lieferte (§6.7 «ein Tor,
 *  das nicht scheitern kann, ist gefährlicher als keines»). */
export function ausnahmeGueltig(
  ausnahme: Pick<RectifiesAusnahme, 'erwartetesZielOc' | 'erwarteteZielFundstelle' | 'erwarteteTextFundstelle'>,
  aktuell: { zielOc: string; zielFundstelle?: string; textFundstelle?: string },
): boolean {
  if (ausnahme.erwarteteTextFundstelle === undefined) return false;
  return ausnahme.erwartetesZielOc === aktuell.zielOc
    && (ausnahme.erwarteteZielFundstelle ?? '') === (aktuell.zielFundstelle ?? '')
    && ausnahme.erwarteteTextFundstelle === (aktuell.textFundstelle ?? '');
}

/** Baut die Stale-Meldung für `check-revisionen-rectifies.ts` (Nachzug R2c, C5): ein FEHLENDES
 *  Feld `erwarteteTextFundstelle` im Ausnahme-Eintrag (nie mit einer Text-Fundstelle belegt,
 *  s. `ausnahmeGueltig`) ist etwas ANDERES als eine leer GEMESSENE aktuelle Text-Fundstelle
 *  (`aktuell.textFundstelle === undefined`, 0-Treffer-Fall) — die Erst-Fassung zeigte beide
 *  Ursachen identisch als «Text ∅» an und liess sie in der Meldung nicht unterscheiden. Die
 *  eigene Formulierung macht das fehlende Feld sofort erkennbar. */
export function formatiereStaleDetail(
  ausnahme: Pick<RectifiesAusnahme, 'seit' | 'erwartetesZielOc' | 'erwarteteZielFundstelle' | 'erwarteteTextFundstelle'>,
  aktuell: { zielOc?: string; zielFundstelle?: string; textFundstelle?: string },
): string {
  const erwarteteTextAnzeige = ausnahme.erwarteteTextFundstelle === undefined
    ? 'Feld erwarteteTextFundstelle fehlt im Ausnahme-Eintrag'
    : `Text ${ausnahme.erwarteteTextFundstelle}`;
  return `Ausnahmeliste-Eintrag seit ${ausnahme.seit} passt NICHT MEHR zum frischen Mass `
    + `(erwartet Ziel ${ausnahme.erwartetesZielOc} / Fundstelle ${ausnahme.erwarteteZielFundstelle ?? '∅'} / `
    + `${erwarteteTextAnzeige}; aktuell Ziel ${aktuell.zielOc} / `
    + `Fundstelle ${aktuell.zielFundstelle ?? '∅'} / Text ${aktuell.textFundstelle ?? '∅'}) — neu einordnen.`;
}

/** Trifft dieser EINE Block das rectifies-Ziel? Fundstelle-Vergleich, oder — wenn
 *  `zielFundstelle` nicht ableitbar war — SR-Vergleich desselben Blocks. Geteilt zwischen
 *  `klassifiziereBerichtigung` und `findeTreffendenBlock` (Runde 2, Auflage B5): beide dürfen
 *  nie auseinanderlaufen, sonst könnte eine Meldung einen Block als „treffend“ zeigen, den die
 *  Klasse selbst nicht als Treffer zählt. */
function blockTrifftZu(block: HeadlineBlock, ziel: Pick<RectifiesInfo, 'fremdeSr' | 'zielFundstelle'>): boolean {
  return ziel.zielFundstelle ? block.as.includes(ziel.zielFundstelle) : block.sr === ziel.fremdeSr;
}

/** Reine Komposition (§2): Headline-Zitate + rectifies-Zielinfo → Klasse. Klassifiziert nach
 *  BLÖCKEN (Ergänzung 18.9.2026, Auflage B2 — nicht mehr nach roher AS-Anzahl, s. Docstring
 *  oben): ein «Treffer» heisst, das rectifies-Ziel liegt in einem Block (Fundstelle-Vergleich,
 *  oder — wenn `zielFundstelle` nicht ableitbar war — SR-Vergleich desselben Blocks).
 *  - GENAU EIN Block (oder keiner) ⇒ übereinstimmend gdw. Treffer, sonst abweichend (schliesst
 *    das Schlupfloch der Erst-Fassung: eine Mehrfach-Nennung IN EINEM Block war vorher
 *    unconditioniert `sammelberichtigung`, auch wenn das Ziel gar nicht genannt war — Auflage
 *    B1, Repro VTS/oc/2025/691 mit einem nicht genannten Ziel).
 *  - MEHR als ein Block ⇒ sammelberichtigung, wenn irgendein Block trifft (das rectifies-
 *    Tripel trägt dann nur EINEN der mehreren, §8-Ehrlichkeit — wie VVEA/oc/2023/543,
 *    SSV/oc/2024/144), sonst abweichend (Befund, NIE in Prosa übersetzt — §7/§17-Fehlerbuch
 *    W2·18). */
export function klassifiziereBerichtigung(
  zitate: Pick<HeadlineZitate, 'bloecke'>,
  ziel: Pick<RectifiesInfo, 'fremdeSr' | 'zielFundstelle'>,
): RectifiesKlasse {
  if (zitate.bloecke.length > 1) {
    return zitate.bloecke.some((b) => blockTrifftZu(b, ziel)) ? 'sammelberichtigung' : 'abweichend';
  }
  const block = zitate.bloecke[0];
  return block && blockTrifftZu(block, ziel) ? 'uebereinstimmend' : 'abweichend';
}

/** Reine Suche (§2, Runde 2 Auflage B5): welcher Block trifft das Ziel? `undefined`, wenn
 *  keiner trifft (dann ist die Klasse `abweichend`). Für `sammelberichtigung` ist das Ergebnis
 *  IMMER definiert (die Klasse wird nur gesetzt, wenn `.some(...)` bereits wahr war) — der
 *  Aufrufer (`formatiereBefundDetail`) zeigt damit den TREFFENDEN Block statt der Vereinigung
 *  aller Blöcke/SR, die bei mehreren unabhängigen Änderungen sonst irreführt (Befund
 *  Gegenprüfung Runde 2: eine Meldung «Text nennt A, B (SR X)» verschleiert, dass nur A das
 *  Ziel trägt). */
export function findeTreffendenBlock(
  bloecke: HeadlineBlock[],
  ziel: Pick<RectifiesInfo, 'fremdeSr' | 'zielFundstelle'>,
): HeadlineBlock | undefined {
  return bloecke.find((b) => blockTrifftZu(b, ziel));
}

/** Reine Formatierung (§2, Runde 2 Auflagen B2 + B5) der Detailzeile eines rectifies-Befunds.
 *  - `uebereinstimmend`: unverändert «Text: …».
 *  - 0 Treffer (`bloecke` leer): EIGENE, unmissverständliche Meldung statt des bisherigen
 *    «Text nennt ∅» — ein 0-Treffer-Fall ist fast immer eine PARSER-Lücke (Fallen a/b/c1/c2/c3
 *    oben), kein Fedlex-Datenfehler; genau diese Verwechslung legte am 18.9.2026 die falsche
 *    Fedlex-Fehler-Spur (Auflage B2, s. `check-revisionen-rectifies.ts`-Docstring).
 *  - `sammelberichtigung`: zeigt den TREFFENDEN Block statt der Vereinigung aller Blöcke/SR
 *    (Auflage B5) — bei zwei unabhängigen Änderungen ist «Text nennt A, B (SR …)» irreführend,
 *    wenn nur EINE davon das Ziel trägt; die übrigen Fundstellen bleiben als Kontext sichtbar.
 *  - `abweichend` mit ≥1 Block: unverändert, zeigt alles Erkannte gegen das Ziel. */
export function formatiereBefundDetail(
  zitate: Pick<HeadlineZitate, 'as' | 'sr' | 'bloecke'>,
  ziel: Pick<RectifiesInfo, 'fremdeSr' | 'zielFundstelle' | 'zielOc'>,
  klasse: RectifiesKlasse,
): string {
  const zielText = `${ziel.zielFundstelle ?? ziel.zielOc} (SR ${ziel.fremdeSr})`;
  if (klasse === 'uebereinstimmend') return `Text: ${zitate.as.join(', ') || '∅'}.`;
  if (zitate.bloecke.length === 0) {
    return 'KEINE Headline erkannt (0 Treffer) — zuerst den Parser prüfen (Auflage B2: ein '
      + '0-Treffer-Fall ist meist eine Parser-Lücke, nie zuerst die Ausnahmeliste), erst danach '
      + `eine Ausnahme erwägen. rectifies-Ziel ${zielText}.`;
  }
  if (klasse === 'sammelberichtigung') {
    const block = findeTreffendenBlock(zitate.bloecke, ziel);
    const blockText = block ? `${block.as.join(', ')}${block.sr ? ` (SR ${block.sr})` : ''}` : '∅';
    return `Treffender Block: ${blockText} — rectifies-Ziel ${zielText} (weitere im Text genannte `
      + `Fundstelle(n): ${zitate.as.join(', ') || '∅'}).`;
  }
  return `Text nennt ${zitate.as.join(', ') || '∅'} (SR ${zitate.sr.join(', ') || '∅'}) — `
    + `rectifies-Ziel ${zielText}.`;
}

/** Drei Stufen einer nicht (mehr) konsumierten Ausnahme (Nachzug R2b, F2 — löst die vorherige
 *  PAUSCHALE Rot-Einstufung ab, s. `findeNichtKonsumierteAusnahmen`):
 *  - `warnung`: das oc des Eintrags kommt im geprüften Kantenbestand GAR NICHT vor (Daten noch
 *    nicht geladen, oder die Kante ist bei Fedlex entfallen) — kein Rot, weil ein Eintrag für
 *    eine NICHT EXISTIERENDE Kante nichts verdecken kann (Ausnahmen wirken nur auf existierende
 *    Kanten mit passendem Erwartungswert), aber ein Hinweis zum Prüfen.
 *  - `hinweis`: die Kante existiert, ist aber (ausschliesslich) `nicht-abrufbar` — die Ausnahme
 *    ist zurzeit nicht überprüfbar, der Eintrag darf NICHT gelöscht werden (er könnte morgen
 *    wieder greifen, sobald die Kante abrufbar wird).
 *  - `rot`: die Kante existiert und ist (mindestens einmal) `uebereinstimmend`/
 *    `sammelberichtigung` — der Eintrag ist veraltet (wie bisher, §6.7 «ein Tor, das nicht
 *    scheitern kann, ist gefährlicher als keines»). */
export type NichtKonsumiertStufe = 'warnung' | 'hinweis' | 'rot';
export interface NichtKonsumierteAusnahme { ausnahme: RectifiesAusnahme; stufe: NichtKonsumiertStufe }

/** Reine Prüfung (§2, Runde 2 Auflage B3, dreistufig verschärft Nachzug R2b F2, §6.7): welche
 *  Ausnahmen greifen auf dem geprüften Bestand auf KEINE einzige nicht-grüne Kante mehr.
 *  `abweichend` UND `stale` zählen weiterhin als «konsumiert» (eine stale gewordene Ausnahme
 *  bekommt bereits ihre EIGENE, spezifischere Rot-Meldung, s. `main` in
 *  `check-revisionen-rectifies.ts`) — trägt IRGENDEINE Kante mit diesem oc eine dieser beiden
 *  Klassen, gilt die Ausnahme als konsumiert, selbst wenn derselbe oc noch unter einem anderen
 *  Erlass-Schlüssel zusätzlich auftritt. Sonst dreistufig (s. `NichtKonsumiertStufe`): KEINE
 *  Kante mit diesem oc ⇒ `warnung`; NUR `nicht-abrufbar`-Kanten ⇒ `hinweis`; mindestens eine
 *  `uebereinstimmend`/`sammelberichtigung`-Kante ⇒ `rot`. */
export function findeNichtKonsumierteAusnahmen(
  ausnahmen: Map<string, RectifiesAusnahme>,
  befunde: { oc: string; klasse: string }[],
): NichtKonsumierteAusnahme[] {
  const ergebnis: NichtKonsumierteAusnahme[] = [];
  for (const ausnahme of ausnahmen.values()) {
    const treffer = befunde.filter((b) => b.oc === ausnahme.oc);
    if (treffer.length === 0) { ergebnis.push({ ausnahme, stufe: 'warnung' }); continue; }
    if (treffer.some((b) => b.klasse === 'abweichend' || b.klasse === 'stale')) continue;
    if (treffer.every((b) => b.klasse === 'nicht-abrufbar')) { ergebnis.push({ ausnahme, stufe: 'hinweis' }); continue; }
    ergebnis.push({ ausnahme, stufe: 'rot' });
  }
  return ergebnis;
}

/** Löst die DE-HTML-Filestore-URL des berichtigenden oc via die amtliche
 *  `isRealizedBy → isEmbodiedBy(html) → isExemplifiedBy`-Kette auf (Skill
 *  `scraping-swiss-official-sources`, Rezept 2). `null`, wenn keine HTML-Manifestation
 *  existiert (live beobachtet bei Alt-Berichtigungen mit nur pdf-a/docx) — dann ist der
 *  Abruf eine LÜCKE, nicht zu erraten (Skill-Falle 3). */
export async function loeseBerichtigungsHtmlUrl(oc: string, fetchImpl: FetchImpl = fetch): Promise<string | null> {
  // Nachzug R2b F5: `ORDER BY` statt einer unspezifizierten Bindungsreihenfolge —
  // ohne sie war die Wahl von `bindings[0]` bei mehr als einer ?file-Bindung
  // nicht deterministisch (§2). Empirisch geprüft (19.9.2026, live SPARQL, alle
  // 62 gecachten Kanten aus Bau- und Probe-Worktree, RECTIFIES_CACHE=netz): KEIN
  // oc liefert heute mehr als eine ?file-Bindung — `bindings[0]` ist mit und ohne
  // `ORDER BY` identisch und deckt sich mit jeder Cache-Sidecar-URL. Die Änderung
  // ist also für den heutigen Datenstand verhaltensneutral und macht das
  // Verhalten für einen künftigen Mehrfach-Bindungs-Fall erst determiniert.
  const query = `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?file WHERE {
  <${oc}> jolux:isRealizedBy ?expr .
  ?expr jolux:language ${LANG_DE} ; jolux:isEmbodiedBy ?manif .
  ?manif jolux:isExemplifiedBy ?file ; jolux:userFormat <https://fedlex.data.admin.ch/vocabulary/user-format/html> .
} ORDER BY ?file`;
  const bindings = await sparqlSelect(query, fetchImpl);
  return bindings[0]?.file?.value ?? null;
}

/** Ein 200 kann die ~9 KB Casemates-Angular-Hülle sein statt des Dokuments (Skill-Falle 3,
 *  live verifiziert 12.9.2026: eine erratene/verwaiste Filestore-URL liefert HTTP 200,
 *  `Content-Type: text/html`, Titel «Casemates», OHNE `id="lawcontent"`). Content-Type
 *  allein trennt NICHT (die Hülle ist ebenfalls text/html) — massgeblich ist der Marker. */
export function istCasematesHuelle(html: string): boolean {
  return html.includes('<title>Casemates</title>') || !html.includes('id="lawcontent"');
}

/** Holt den Berichtigungstext; wirft bei Netz-/Format-Fehler oder Casemates-Hülle (NIE
 *  einen Fehler stumm als «kein Beleg» durchgehen lassen — der Aufrufer entscheidet, ob
 *  daraus eine Lücke wird). */
export async function holeBerichtigungstext(url: string, fetchImpl: FetchImpl = fetch): Promise<string> {
  const res = await fetchImpl(url);
  const typ = res.headers?.get?.('content-type') ?? null;
  const text = await res.text();
  if (!res.ok || (typ !== null && !typ.includes('html')) || istCasematesHuelle(text)) {
    throw new Error(`Berichtigungstext ${url} nicht abrufbar (Status ${res.status}, Content-Type «${typ}»).`);
  }
  return text;
}

/** Obergrenze der `nicht-abrufbar`-Klasse (Nachzug R2b, F4): heute (Messung 19.9.2026)
 *  20/82 auf dem #909-Datenstand bzw. 8/31 auf `main` — durchweg Berichtigungen aus 2021/22,
 *  die amtlich NUR als docx/pdf-a existieren (keine HTML-Manifestation, Skill-Falle 3). Diese
 *  Lücken sind bekannt und ungefährlich (Klasse bleibt grün, s. `check-revisionen-rectifies.ts`-
 *  Docstring) — SOLANGE ihre Zahl nicht weiter wächst. Ein STEIGENDER Wert bedeutet: eine NEUE
 *  Berichtigung ist ebenfalls nicht per HTML abrufbar und wird von diesem Tor mangels Text
 *  gar nicht erst geprüft — ein blinder Fleck, der nicht stillschweigend wachsen darf (§6.7).
 *  RICHTIGSTELLUNG (Nachzug R2c, C2): die Obergrenze liegt NICHT grosszügig über der
 *  Ist-Messung, sondern exakt AUF ihr — 20 ist die am 19.9.2026 gemessene Ist-Zahl auf dem
 *  #909-Datenstand (20/82); jeder weitere HTML-lose Fall macht das Tor darum sofort rot
 *  (gewollt, s. o.: der blinde Fleck darf nicht stillschweigend wachsen). Auf `main` (8/31,
 *  Stand 19.9.2026, vor #909) ist dieselbe Konstante entsprechend lasch — dort bleiben 12
 *  Fälle Luft, bis #909 gelandet ist. */
export const NICHT_ABRUFBAR_OBERGRENZE = 20;

/** Reine Prüfung (§2, Nachzug R2b F4): überschreitet die Anzahl `nicht-abrufbar`-Kanten die
 *  Obergrenze? `true` ⇒ der Aufrufer macht das Tor rot («neue Berichtigung ohne HTML —
 *  docx-Leser oder Einzelprüfung nötig»). */
export function nichtAbrufbarUeberObergrenze(anzahl: number, obergrenze: number = NICHT_ABRUFBAR_OBERGRENZE): boolean {
  return anzahl > obergrenze;
}
