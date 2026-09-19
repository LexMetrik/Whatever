# rectifies-Tor Runde 2 — drei Parser-Lücken + ein dritter Fedlex-Datenfehler (19.9.2026)

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

## KLV (eli/oc/2026/209) — Nebenfund, NICHT im Auftrag, bleibt ROT

Zwei unabhängige Headline-Blöcke: «Änderung vom 4. Juni 2025 (AS 2025 419; SR 832.112.31)» und
«Änderung vom 2. Dezember 2025 (AS 2025 851; SR 832.112.31)». `jolux:rectifies` zeigt auf
`eli/oc/2014/269` (AS 2014 1251) — WEDER 419 noch 851. Anders als bei LRV ist dies KEIN
Grunderlass-Fall: SPARQL zeigt `eli/oc/2014/269`, `eli/oc/2025/419` UND `eli/oc/2025/851` sind
alle drei `legalResourceGenre` 200 (reguläre Änderung), strukturell gleichrangig — 2014/269 ist
schlicht ein anderes, älteres, unabhängiges KLV-Änderungsdokument. Das sieht dem Muster von
SKV/AIG/LRV sehr ähnlich (reales, aber falsches Ziel), ist aber NICHT Teil dieses Auftrags und
wurde nicht amtlich zu Ende recherchiert (z. B. ob 2014/269 die betroffene Bestimmung Art. 12a
ursprünglich einführte). **Bleibt bewusst ROT** (§7 «im Zweifel rot lassen und mit Belegen
melden») — Entscheid über einen vierten Ausnahme-Eintrag liegt beim Orchestrator/David.

## B-1 (Phantom-Komma-Nummer) — geprüft, keine Code-Änderung

Das im Auftrag genannte Beispiel «(AS 2015 5699, 2022; SR …)» hat unter den 62 zum
Messzeitpunkt ladbaren Filestore-HTML KEIN Gegenstück; der einzige echte Mehrfach-Treffer ist
VTS/oc-2025-691 (AS 2025 646, 665 — belegt derselbe Jahrgang). Die amtliche AS-Zitierkonvention
trägt immer genau einen Jahrgang pro Klammer; ein zweiter Jahrgang wird stets mit eigenem
«AS `<Jahr>`» wiederholt, nie als nackte Zahl nach Komma. Kein Fix ohne Beleg einer echten
Fehlmessung (§7) — offener Beobachtungspunkt.

## Status

Bau-Runde 2 abgeschlossen, drei Parser-Fixes + ein Ausnahme-Eintrag umgesetzt, KLV bleibt rot.
Fachliche Abnahme (insb. der LRV-Einordnung als Fedlex-Fehler) David offen — **Gegenprüfung
durch den Orchestrator ausstehend (Risikopfad, Pflicht vor Merge).**
