# rectifies-Tor Runde 2 — drei Parser-Lücken + ein dritter Fedlex-Datenfehler (19.9.2026)

**Erstellt:** 19.9.2026 — Anlass: ROADMAP `QS-MONITOR-ROT`, Rot-Reproduktion des
rectifies-Tors auf dem #909-Datenstand; ergänzt um Nachzug R2b (Auflagen der Gegenprüfung
Opus, F1–F7).
**Status:** ZWEIFACH GEPRÜFT (Bau-Messung + Rot-Beweise + SPARQL-Belege, s. u.); fachliche
Abnahme durch David und Gegenprüfung durch den Orchestrator offen (§7/§8, Risikopfad).

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
oben. Nicht selbst nachgemessen (übernommen aus der Recherche, nicht amtlich nachgefetcht):
dass `eli/oc/2014/269` selbst weder «Syncytial»/«Synzytial» noch «RSV» enthält und nur Art. 12a
Bst. a, b, d, f, g, i, j, l ändert — diese Negativ-Prüfung erfordert den PDF-A-Volltext des
2014er Dokuments, der in diesem Bau nicht gegengelesen wurde (Offenlegung §7).

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

## Status

Bau-Runde 2 + Nachzug R2b abgeschlossen: drei Parser-Fixes, Klammer-Fenster strukturell
eingegrenzt (F1), Ausnahme-Konsumption dreistufig (F2), Text-Stale-Sicherung bei Mehrfach-AS
(F3), vier Ausnahme-Einträge (SKV/AIG/LRV/KLV, alle dieselbe Fehlerklasse «falsches
rectifies-Ziel»). Fachliche Abnahme (insb. der LRV/KLV-Einordnung als Fedlex-Fehler) David
offen — **Gegenprüfung durch den Orchestrator ausstehend (Risikopfad, Pflicht vor Merge).**
