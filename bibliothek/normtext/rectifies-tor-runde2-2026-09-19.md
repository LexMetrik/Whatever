# rectifies-Tor Runde 2 — drei Parser-Lücken + eine wiederkehrende Fedlex-Fehlerklasse mit vier belegten Fällen (19.9.2026)

**Erstellt:** 19.9.2026 — Anlass: ROADMAP `QS-MONITOR-ROT`, Rot-Reproduktion des
rectifies-Tors auf dem #909-Datenstand; ergänzt um Nachzug R2b (Auflagen der Gegenprüfung
Opus, F1–F7).
**Status (Nachzug R2c, C3 — richtiggestellt: «ZWEIFACH GEPRÜFT» war zum Zeitpunkt des
vorigen Commits überzeichnet, s. u.):** zweifach geprüft (Bau-Messung Sonnet + adversariale
Opus-Gegenprüfung 19.9.2026, inkl. unabhängiger Re-Derivation des KLV-Negativbefunds am
PDF-A oc/2014/269: 0 Treffer Syncytial/Synzytial/RSV, geändert nur Art. 12a Bst. a, b, d, f,
g, i, j, l) — fachliche Abnahme David offen. «Zweifach geprüft» ist der in
`bibliothek/INDEX.md` (Legende) definierte Bibliotheks-Status (Erstrecherche +
adversarialer Durchgang), NICHT die fachliche Abnahme (§7) — `verified: true`/Status
«geprüft» sind damit weiterhin nicht gesetzt.

**Kontext:** ROADMAP `QS-MONITOR-ROT`, Einheit «rectifies-Tor Runde 2». Rot-Reproduktion von
`npm run check:revisionen-rectifies` auf dem Datenstand des Automatik-PR #909
(`origin/chore/fedlex-frische-2026-09-18` + `origin/main` gemergt, 82 rectifies-Kanten statt
31 auf `main`). Vorläufer: `revisionen-2026-07-10.md`, Docstrings in
`scripts/normtext/rectifies-berichtigung.ts` / `check-revisionen-rectifies.ts` (Gegenprüfung
PR #827/#834/#908/Opus 18.9.2026).

## Reproduktion (kein spekulativer Fix, §7)

`RECTIFIES_CACHE=netz npm run check:revisionen-rectifies` im Probe-Worktree, Exit 1, 5 statt
der im Auftrag genannten 4 `abweichend`-Kanten:

```
Klassen: {"uebereinstimmend":52,"abweichend":7,"nicht-abrufbar":20,"sammelberichtigung":3}
...
check:revisionen-rectifies ROT: 5 unbelegte/veraltete Abweichung(en):
  - KLV https://fedlex.data.admin.ch/eli/oc/2026/209 (abweichend): Text nennt AS 2025 419, AS 2025 851 (SR 832.112.31) — rectifies-Ziel AS 2014 1251 (SR 832.112.31).
  - KRK https://fedlex.data.admin.ch/eli/oc/2026/314 (abweichend): Text nennt ∅ (SR ∅) — rectifies-Ziel AS 2026 214 (SR 0.107).
  - LRV https://fedlex.data.admin.ch/eli/oc/2025/448 (abweichend): Text nennt AS 1992 124 (SR 814.318.142.1) — rectifies-Ziel AS 1986 208 (SR 814.318.142.1).
  - OR https://fedlex.data.admin.ch/eli/oc/2023/62 (abweichend): Text nennt ∅ (SR ∅) — rectifies-Ziel AS 2020 4005 (SR 220).
  - VZAE https://fedlex.data.admin.ch/eli/oc/2026/170 (abweichend): Text nennt ∅ (SR ∅) — rectifies-Ziel https://fedlex.data.admin.ch/eli/cc/2007/759 (SR 142.201).
```

**Zählgrösse sauber (Nachzug R2b, F6):** die Klassenzeile zeigt `"abweichend":7`, die ROT-Zeile
nennt 5 — kein Widerspruch, zwei verschiedene Grössen. 7 ist die volle `abweichend`-Klasse
(alle Kanten, deren Text eine andere Fundstelle nennt als das rectifies-Ziel); davon sind SKV
(oc-2025-686) und AIG (oc-2025-342) bereits durch bestehende Ausnahmeliste-Einträge grün — die
verbleibenden 5 (KLV, KRK, LRV, OR, VZAE) sind ROT, weil ihnen noch kein (gültiger)
Ausnahmeliste-Eintrag entspricht. Nach dem Nachzug R2b sind KRK/OR/VZAE Parser-Fixes
(`uebereinstimmend`), LRV und KLV vierter/dritter Ausnahme-Eintrag — die `abweichend`-Klasse
bleibt bei 4 (SKV, AIG, LRV, KLV), alle vier durch die Ausnahmeliste konsumiert (s. `npm run
check:revisionen-rectifies`-Lauf am Ende dieses Dossiers).

KLV war im Auftrag NICHT genannt (§7-Abweichung, unten dokumentiert).

## Drei Parser-Lücken (KRK/OR/VZAE) — je live an genau einem Fall belegt

Alle drei sind reine Extraktionslücken derselben Regex `HEADLINE_ZITAT`
(`rectifies-berichtigung.ts`), keine Fedlex-Datenfehler:

1. **Staatsvertrags-Headline (KRK, eli/oc/2026/314).** Filestore-HTML: `<h1>Übereinkommen vom
   20. November 1989 <br>über die Rechte des Kindes</h1>` — «vom `<Datum>`» steht im Erlasstitel,
   die AS-Klammer folgt erst in einem SEPARATEN `<p>` ohne eigenes «vom …». Die Erst-Fassung
   verlangte `\s*\(` direkt nach dem Jahr → 0 Treffer. Fix: `[^()]{0,120}?` statt `\s*` vor der
   Klammer (bewusst begrenzt und ohne Klammern, s. Code-Docstring).
2. **Leerzeichen vor dem Semikolon (VZAE, eli/oc/2026/170).** `(AS 2018 3173 ; SR 142.201 )` —
   Tag-Fragmentierung (`<span>3173</span><span>; SR</span>`) erzeugt ein Leerzeichen vor `;`, das
   die Erst-Fassung nicht zuliess. Fix: zusätzliches `\s*` vor `(?:;\s*SR…)`.
3. **Fussnotenzeichen (OR, eli/oc/2023/62).** `(AS 2020 4005<sup><a href="#fn-…">1</a></sup>;
   SR 220)` wird nach generischem Tag-Entfernen zu «4005 1 ; SR 220» — die Fussnoten-Ziffer
   reisst die Zahl auseinander. Fix: `<sup><a href="#fn-…">…</a></sup>`-Marker werden vor der
   generischen Tag-Entfernung ganz entfernt.

**Eigene Nebenfalle beim Bau von Fix 1:** die geweitete Klammer-Distanz macht auch
Fussnoten-KÖRPER-Prosa treffbar (Skill `scraping-swiss-official-sources`, Falle «Footnote-leak»)
— live an BPV/eli/oc/2026/324 aufgefallen (Fussnote nennt beiläufig «Änderung vom
3. September 2025 der Bundespersonalverordnung vom 3. Juli 2001 (AS 2025 569)», was ohne
Gegenmassnahme einen erfundenen zweiten Block erzeugt hätte). Fix: der Text ab der ersten
`<div class="footnotes"` wird vor der Extraktion abgeschnitten. Vollständiger Diff-Beweis (alle
62 zum Messzeitpunkt ladbaren Filestore-HTML, alt vs. neu): genau 3 Kanten ändern sich
(KRK/OR/VZAE), keine sonst — s. Bau-Bericht.

Alle drei werden nach dem Fix `uebereinstimmend` (KRK/OR: Fundstelle deckt sich; VZAE: Ziel ist
ein `cc`-Abstract ohne eigene Fundstelle, SR-Fallback trifft).

## LRV (eli/oc/2025/448) — dritter amtlich belegter Fedlex-Datenfehler

Der Berichtigungstext korrigiert wörtlich «Änderung vom 20. November 1991 (AS 1992 124;
SR 814.318.142.1)», Anhang 3 Ziff. 511/522
(https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/oc/2025/448/de/html/fedlex-data-admin-ch-eli-oc-2025-448-de-html.html,
Abruf 19.9.2026). `jolux:rectifies` zeigt aber auf `eli/oc/1986/208_208_208` — das ist NICHT die
1991er Änderung, sondern der URSPRÜNGLICHE Grunderlass der LRV selbst (SPARQL-Beleg:
`legalResourceGenre` 100, `dateDocument` 1985-12-16, `historicalId` «RO 1986 208», gegen
`https://fedlex.data.admin.ch/sparqlendpoint`, Abruf 19.9.2026).

Die im Text zitierte Änderung existiert amtlich als EIGENES Dokument:
`eli/oc/1992/124_124_124` — `historicalId` «RO 1992 124», `dateDocument` 1991-11-20, Titel (DE)
«Luftreinhalte-Verordnung, Änderung», (FR) «Ordonnance sur la protection de l'air (OPair),
Modification» (SPARQL, Abruf 19.9.2026). Datum, Fundstelle UND Titel decken sich exakt mit dem
Berichtigungstext — dieses Dokument, nicht der Grunderlass, ist der korrekte Zielkandidat.
Auffällig: `eli/oc/1992/124_124_124` trägt KEINE `jolux:classifiedByTaxonomyEntry` (SR-Klassierung)
— das erklärt vermutlich, weshalb es in der lokal aus SPARQL gebauten Kantenliste (`bBindings`
in `bibliothek/normtext/revisionen-raw/LRV.json`) nicht auftaucht und der Fehler bislang
unentdeckt blieb.

**Einordnung nach Spec-Optionen (i/ii/iii):** NICHT (i) — die Vermutung «Änderungserlass ohne
eigenes oc» trifft nicht zu, das Dokument existiert (nur ohne SR-Klassierung). Eingeordnet als
**(ii) amtlich belegter Fedlex-Fehler**, strukturell identisch mit den Präzedenzfällen
SKV/oc-2025-686 und AIG/oc-2025-342 (ein real existierendes, aber falsches Ziel). Dritter
Ausnahme-Eintrag in `bibliothek/normtext/rectifies-ausnahmen.json` (seit 2026-09-19).

## KLV (eli/oc/2026/209) — Nachzug R2b F7: vierter amtlich belegter Fedlex-Datenfehler

**Revidiert 19.9.2026 (Nachzug R2b, F7, Weisung Orchestrator nach eigener Recherche + eigener
Gegenlese):** die Erst-Fassung dieses Abschnitts liess KLV bewusst rot und offen; eine
Recherche hat die Einordnung inzwischen amtlich abgeschlossen. Zwei unabhängige Headline-
Blöcke: «Änderung vom 4. Juni 2025 (AS 2025 419; SR 832.112.31)» (Art. 12a Abs. 1 Bst. r) und
«Änderung vom 2. Dezember 2025 (AS 2025 851; SR 832.112.31)» (Art. 12a Abs. 1 Bst. t) — beide
betreffen die Aufnahme der RSV-Impfung (Respiratorische Syncytial-Viren) in Art. 12a.
`jolux:rectifies` zeigt auf `eli/oc/2014/269` (AS 2014 1251, KLV-Änderung vom 16. Mai 2014) —
WEDER 419 noch 851. Unabhängig nachgemessen (dieser Bau, an den committeten `revisionen-raw`-
Rohdaten und dem realen Cache-HTML): `rectifiesInfoProOc["…/oc/2026/209"]` trägt exakt
`zielOc=…/oc/2014/269`, `zielFundstelle=AS 2014 1251`, `fremdeSr=832.112.31`
(`bibliothek/normtext/revisionen-raw/KLV.json`); das Cache-HTML nennt wörtlich beide Blöcke wie
oben. **Nachzug R2c (C3), ZWEIFACH nachgemessen** — einmal durch die adversariale
Opus-Gegenprüfung 19.9.2026, ein zweites Mal unabhängig durch diesen Bau (Sonnet) direkt am
amtlichen PDF-A-Volltext (nicht nur aus der Erstrecherche übernommen), Abruf 19.9.2026:
`https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/oc/2014/269/de/pdf-a/fedlex-data-admin-ch-eli-oc-2014-269-de-pdf-a.pdf`.
Der Volltext (12 Seiten inkl. Anhang 1) enthält 0 Treffer für «Syncytial», «Synzytial» oder
«RSV» und ändert laut eigener Überschrift ausschliesslich «Art. 12a Bst. a, b, d, f, g, i, j
und l» (wörtlich, S. 1252/AS 2014 1253) — weder 419 (Bst. r) noch 851 (Bst. t) sind darunter.
Die Negativ-Prüfung ist damit nicht mehr nur aus einer Recherche übernommen, sondern am
Originaldokument bestätigt.

Anders als bei LRV ist dies KEIN Grunderlass-Fall: SPARQL zeigt `eli/oc/2014/269`,
`eli/oc/2025/419` UND `eli/oc/2025/851` sind alle drei `legalResourceGenre` 200 (reguläre
Änderung), strukturell gleichrangig — 2014/269 ist schlicht ein anderes, älteres, unabhängiges
KLV-Änderungsdokument. Eingeordnet als vierter Fall derselben Fehlerklasse **«falsches
rectifies-Ziel»** (real existierendes, aber falsches Ziel-Dokument) wie SKV/oc-2025-686,
AIG/oc-2025-342 und LRV/oc-2025-448. Vierter Ausnahme-Eintrag in
`bibliothek/normtext/rectifies-ausnahmen.json` (seit 2026-09-19), kanonische Text-Fundstelle
(Nachzug R2b F3) `AS 2025 419 + AS 2025 851`.

Ein weiterer, ausserhalb dieses Korpus liegender Beleg derselben Fehlerklasse (nicht Teil
dieses Auftrags, nur zur Einordnung der Häufigkeit): `oc/2025/227` → fälschlich verknüpft mit
`oc/1984/889_889_889` (SPARQL, Abruf 19.9.2026). Gegenbelege korrekter Verknüpfung (dieselbe
Fehlerklasse tritt NICHT systematisch auf): `oc/2026/181`, `oc/2023/257`, `oc/2026/448`,
`oc/2025/537`.

## B-1 (Phantom-Komma-Nummer) — geprüft, keine Code-Änderung

Das im Auftrag genannte Beispiel «(AS 2015 5699, 2022; SR …)» hat unter den 62 zum
Messzeitpunkt ladbaren Filestore-HTML KEIN Gegenstück; der einzige echte Mehrfach-Treffer ist
VTS/oc-2025-691 (AS 2025 646, 665 — belegt derselbe Jahrgang). **Gemessener Gegenbeleg (Nachzug
R2b, F6):** VVEA/oc-2023-543 selbst — der Präzedenzfall für «zwei unabhängige Blöcke» — trägt
laut Filestore-HTML ZWEI GETRENNTE Klammern, nie eine gemeinsame: «vom 4. Dezember 2015
(AS 2015 5699; SR 814.600)» im ersten `<p class="erlassdatum">` und, in einem eigenen,
späteren `<p class="man-template-datum-aend">`, «Änderung vom 23. Februar 2022 (AS 2022 161;
SR 814.600)». Eine Klammer der Auftrags-Form «(AS 2015 5699, 2022; SR 814.600)» existiert damit
amtlich nicht — die amtliche AS-Zitierkonvention trägt immer genau einen Jahrgang pro Klammer;
ein zweiter Jahrgang wird stets mit eigenem «AS `<Jahr>`» in einer EIGENEN Klammer wiederholt,
nie als nackte Zahl nach Komma in derselben. **Wäre** eine solche Eingabe dennoch amtlich
aufgetaucht, ist die Phantom-Mechanik real: Gruppe 2 der Regex liest `\d+(?:\s*,\s*\d+)*` als
weitere Nummern DESSELBEN Jahrgangs (Falle c, VTS-Fix) — «(AS 2015 5699, 2022; SR …)» würde
also als EIN Block mit den beiden Fundstellen `AS 2015 5699` und `AS 2015 2022` (nicht
`AS 2022 2022`!) gelesen, eine erfundene Fundstelle, die so nie existiert. Kein Fix ohne Beleg
einer echten Fehlmessung (§7) — offener Beobachtungspunkt; ein dokumentierender Test (der
dieses Verhalten festhält, ohne es als Bug zu werten) ist nicht angelegt, da kein amtlicher
Fall bekannt ist, der ihn rechtfertigt.

## Bekannte Grenzen des Tors (Nachzug R2b, F6)

- **DE-only:** Extraktion und Klassifikation laufen ausschliesslich über die DE-Filestore-HTML
  (`loeseBerichtigungsHtmlUrl` filtert explizit auf `LANG_DE`). Eine Abweichung, die NUR in der
  FR- oder IT-Fassung auftritt (z. B. ein Übersetzungsfehler oder ein rectifies-Fehler, der nur
  eine Sprachfassung betrifft), bleibt für dieses Tor unsichtbar.
- **`FUSSNOTEN_MARKER` greift nur `#fn-`:** der Marker-Regex verlangt `href="#fn-…"`
  (Fussnotenzeichen im Fliesstext). Ein `#fnbck-`-Anker (Rücksprung-Anker, der VOM
  Fussnotenkörper zurück ins Fliesstext zeigt) wird nicht behandelt — das ist unschädlich,
  weil `#fnbck-` heute ausschliesslich im bereits durch `entferneFussnotenKoerper`
  abgeschnittenen Fussnotenkörper selbst vorkommt (nie im Preamble/Main-Teil, der in die
  Extraktion eingeht), aber ein künftiges Fedlex-Layout, das `#fnbck-` auch ausserhalb des
  Fussnotenkörpers verwendet, würde diesen Marker nicht abfangen.

## Beobachtungspunkte/Restrisiken (Nachzug R2c, C3 — adversariale Opus-Nach-Prüfung 19.9.2026)

Drei zusätzliche, NICHT behobene Restrisiken der jetzigen Fassung — dokumentiert, weil §7
Unsicherheiten sichtbar hält statt sie wegzuglätten, aber (jeweils begründet) OHNE Code-Änderung
in diesem Commit:

- **(a) Satzgrenzen-Sperre verliert «… vom <Datum> Ziff. I/II (AS …)»:** die Sperre
  `(?!\.\s*\p{Lu})` im Klammer-Fenster blockt jede Lücke, die einen abgeschlossenen Satz
  («. Grossbuchstabe») überspringt — träfe das auf eine echte Ziffern-Gliederung wie
  «… 2025 Ziff. I (AS …)» zu, würde ein amtlich gültiger Block verloren gehen. Nachgemessen
  (alle 62 Cache-HTML im Probe-Worktree; Zählung der Opus-Nach-Prüfung 19.9.2026, Regex
  `Ziff\.\s*I{1,2}(?![IVX])` über den Klartext — der Bau hatte 5 gezählt): 7 Vorkommen von
  «Ziff. I»/«Ziff. II» in 4 Dokumenten, AUSNAHMSLOS NACH der jeweiligen «(AS …)»-Klammer (nicht in der Lücke davor) — kein
  Live-Fall. Die Ausfallrichtung ist zudem sicher: träfe der Fall doch ein, macht die Regex 0
  Treffer statt eines falschen (ROT mit «KEINE Headline erkannt», nie ein stiller Falsch-Grün-Fall
  wie C1). Mögliche Lockerung, falls künftig ein Live-Fall auftritt:
  `(?!\.\s+\p{Lu}\p{Ll})` (verlangt nach dem Punkt einen KLEINBUCHSTABEN im zweiten Wortzeichen,
  eine Ziffern-Gliederung wie «Ziff. I» hat dort keinen — nicht umgesetzt, da kein amtlicher Fall
  sie rechtfertigt).
- **(b) Prosa INNERHALB eines Klassenelements umgeht den Struktur-Anker:** der Struktur-Filter
  (`HEADLINE_KLASSEN_ELEMENT`) schliesst nur Fliesstext AUSSERHALB der drei Klassen aus — Prosa,
  die INNERHALB eines bereits klassierten Elements steht (z. B. ein längerer Erlasstitel-Zusatz
  vor der eigentlichen Datums-/AS-Nennung), bleibt vom Struktur-Anker ungeschützt und ist nur noch
  durch das 40-Zeichen-Fenster samt Satzgrenzen-Sperre begrenzt. Nachgemessen (Opus-Nach-Prüfung
  19.9.2026, alle 62 Cache-HTML): 3 Klassenelemente im `<main>`-Teil, grösste KLARTEXTLÄNGE 61
  Zeichen («Änderung vom 11. April 2018 (AS 2018 1687; SR 814.318.142.1)», LRV oc/2025/537; KLV
  oc/2026/209: 59). Die Zahl misst die Länge der Elemente, NICHT eine Prosa-Lücke vor der Klammer
  — die reale Lücke «vom <Datum>» → «(AS» ist im ganzen Korpus 65× genau 1 Zeichen und einmal 28
  («über die Rechte des Kindes», KRK), also weit unter dem 40er-Fenster. Richtigstellung (§7): der
  Bau R2c hatte die Zahl als «nicht reproduzierbar» vermerkt, weil er sie als Lücken-Mass las. Die
  qualitative Aussage (Struktur-Anker schützt nicht gegen Prosa INNERHALB einer Klasse) bleibt
  offener Beobachtungspunkt; kein Fix ohne belegten Live-Fall.
- **(c) `entferneFussnotenKoerper` schneidet nur `<div class="footnotes…`:** ein künftiges
  Fedlex-Layout mit `<section class="footnotes">` (statt `<div>`) würde am Schnitt vorbeilecken.
  Nachgemessen (dieser Bau, alle 62 Cache-HTML im Probe-Worktree): alle 17 vorkommenden
  Fussnoten-Container sind `<div>` — kein Live-Fall, aber ein struktureller blinder Fleck, falls
  Fedlex das Markup künftig ändert.

## Status

Bau-Runde 2 + Nachzug R2b + Nachzug R2c abgeschlossen: drei Parser-Fixes, Klammer-Fenster
strukturell eingegrenzt (F1/C1), Ausnahme-Konsumption dreistufig (F2), Text-Stale-Sicherung
bei Mehrfach-AS (F3), vier Ausnahme-Einträge (SKV/AIG/LRV/KLV, alle dieselbe Fehlerklasse
«falsches rectifies-Ziel»). **Status: zweifach geprüft** (Bau-Messung Sonnet + adversariale
Opus-Gegenprüfung 19.9.2026, inkl. unabhängiger Re-Derivation des KLV-Negativbefunds am
PDF-A oc/2014/269: 0 Treffer Syncytial/Synzytial/RSV, geändert nur Art. 12a Bst. a, b, d, f,
g, i, j, l) — fachliche Abnahme David offen (insb. der LRV/KLV-Einordnung als Fedlex-Fehler).
«Zweifach geprüft» ist der Bibliotheks-Status aus `bibliothek/INDEX.md` (Legende), NICHT die
fachliche Abnahme (§7) — **Gegenprüfung durch den Orchestrator ausstehend (Risikopfad, Pflicht
vor Merge).**
