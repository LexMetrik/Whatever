# LexMetrik — Struktur & aktueller Stand

**Verbindliche Grundprinzipien: `CLAUDE.md`** (§1 Logik vor allem; §6
Refactoring-Protokoll) — dieses Dokument hier beschreibt den Zustand.

**Dokument-Ordnung im Root (Aufräumung 10.6.2026, Auftrag David):** Im Root
liegen nur AKTIVE Steuerungsdokumente — CLAUDE/README/STRUKTUR/ROADMAP,
Projekt- und Strategie-Papiere (PROJEKTBESCHRIEB, STRATEGIE-PLATTFORM,
WACHSTUM-REGLEMENT, BETRIEB, KATALOG-ROADMAP). Die AG-Bausteinliste ist seit
dem 14.8.2026 (Entscheid David) **kein Bestand mehr**, sondern ein Erzeugnis:
`npm run abnahme:ag` schreibt sie bei Bedarf in <1 s ins Root, gitignoriert. Die
laufenden Fahrpläne liegen seit AP-8 der QS-TOK-Aufräumwelle (31.7.2026) NICHT
mehr im Root, sondern in **`fahrplaene/`** (Stand 3.8.2026: 27 Dateien —
NOTEBOOKLM-EINSATZ und OPENCASELAW-QUELLEN sind mit der Aufräumung 3.8.2026 nach
`archiv/` gewandert; Dateinamen unverändert, geführt über `ROADMAP.md` /
`npm run plan:next`; das Link-Tor `check:plan` scannt genau diesen Ordner). Aus der früheren Aufzählung
ist nur noch VORLAGEN-AUSBAU aktiv; GRUNDLAGEN, GMBH-GRUENDUNG, BGER-RECHTSWEG,
VERTRAGS-VARIANTEN und FUNDAMENT-UMBAU sind mit der Archiv-Welle 31.7.2026
nach `archiv/` gewandert, AG-GRUENDUNG schon am 7.6.2026. Abgeschlossene
Fahrpläne (DESIGN, RECHNER-DESIGN, VEREINHEITLICHUNG, TOKEN-DISZIPLIN — ins
Archiv 13.6.2026; die 11 verwaisten Fahrpläne der QS-TOK-Aufräumwelle —
31.7.2026) und historische Dokumente liegen in
**`archiv/`** (Index: `archiv/README.md`; Dateinamen unverändert, damit
Verweise in Code-Kommentaren per grep auffindbar bleiben). Wissens-Quellen
(PDF/DOCX, gitignored) in `bibliothek/quellen/` (`SICHTUNG.md`).

**Pflegeregel Session-Karten (Token-Disziplin 11.6.2026; mechanisiert 10.7.2026,
QS-TOK/T1):** Dieses Dokument ist Nachschlagewerk, keine Pflichtlektüre (T19;
die frühere Kopfzeile «wird in jeder Session gelesen» war seit der Entkopplung
falsch — korrigiert 30.8.2026). Karten abgeschlossener Sessions (älter als
~2 Arbeitstage) wandern BYTE-GENAU nach `archiv/STRUKTUR-SESSIONKARTEN.md`
(neue Blöcke oben anhängen); hier bleibt der Verweis-Abschnitt. Neue Karten
werden direkt unter dem KARTEN-Anker eingefügt (jüngste zuoberst).

<!-- KARTEN -->
## Session 13.9.2026 — Reiterleiste-Ausbau: drei Wellen `W2·18` + `W2·25` gelandet (4 PRs)

**Gelandet:** #842 (Welle 1, sechs stille Fehler + Nachzug R8-Sweep mobil), #843 (Welle 2:
roving tabindex, Alt+Q-MRU, Ring-Ordnung, Menü-Vorlauf 320→17 ms, 24-px-Griffe), #844 (Welle 3:
Kopf weicht am Anschlag, Rand-Schub beim Ziehen, Reiter als Links, Hover-Karte, Touch-Umordnen),
#845 (`W2·25-ARBEITSMAPPE`: Anheften mit D16-Nachweis, benannte Mappen, `?mappe=`-Adresse).
Specs: FAHRPLAN-OFFENE-BEFUNDE §4.R/§4.R2/§4.R3, FAHRPLAN-DESIGN-IDENTITAET §7. Entry-Chunk
54.4 → 58.0 KB gzip (Budget 60). Recherche-Grundlage (14 Quellen) im Session-Scratchpad,
Lückenkatalog abgearbeitet bis auf Peek-Tabs/«Geändert»-Punkt (bewusst nicht gebaut).

**Zwei CI-Rot-Runden, beide Bau-Lücken:** (1) Welle 1 setzte `.rl-reiter` auf `min-content`
→ 18 R8-Funde @320/390, vom Bau-Agenten nicht gesehen, weil der R8-Sweep nicht in seiner
Prüfliste stand; (2) Welle 3 machte den Reiter zum Link, eine Sonde in Shard 1
(`w224-l6-panekopf`) las weiter `button`. **§17-Lehre verankert** (Dispatch-§0 `lex-bau.md`
Ziff. 3b): Rollen-/Selektor-Wechsel wirkt repo-weit — alle Sonden greppen, R8-Sweep bei
geteilten Rahmen Pflicht.

**Prozessfund (§17, Fehlerbuch-Zeile):** Plan-Buchungs-Commit wirft wartende Auto-Merge-PRs
bei `strict` auf BEHIND — ein Rebase + CI-Lauf je Landung; Wurzel-Fix-Vorschlag im Fehlerbuch.

**Wartet auf David:** Meta-Routen mit Reiter (R14b bestätigen/kippen); Option+T / Option+Q am
Mac einmal selbst prüfen (Playwright bildet die Option-Belegung nicht ab).

## Session 12.9.2026 (7) — Abschluss: #838 gelandet, #840 in Landung, Session-Bilanz

**Gelandet:** #838 (Kopf `87db8a514`) `QS-KORPUS-SCOPE` — 23 scope/decl-Sektionen in 12
Staatsverträgen ingestiert (war in Karte (6) noch «landet gerade»); Gegenprüfung bestanden
(Sonnet, Bau Opus): eigener Census 228 Caches 136/26/14/12, 23/23 h1 == Label, 0 Drops,
Live-Stichprobe 3 Erlasse byte-gleich — keine Blocker. ROADMAP/FAHRPLAN-OFFENE-BEFUNDE/
FAHRPLAN-FEDLEX-PORTFOLIO §19 entsprechend abgehakt.

**In Landung (PR offen, nicht Teil dieser Landung):** #840 (Kopf `185cf141c`) — Leser-Wurzel
für scope/decl-Sektionen heisst synthetisch «Anhänge» statt eines eigenen Labels
(Nebenfund aus #838); ROADMAP-Zeile bleibt bewusst offen, bis gemergt.

**Session-Bilanz (12.9.2026, Fehlerbuch-Wellen 4–6 + Staatsverträge):** 18 PRs an einem Tag
gelandet; 11 Gegenprüfungen (Opus/Sonnet wechselseitig), davon 5 Bau-Behauptungen widerlegt
oder mit Auflagen versehen — `rectifies`-Ziel-Widerspruch 3 Nachbesserungs-Runden, #828 vier
Runden, #826/#832/#834 je mit Auflagen durchgekommen. Drei Fedlex-Datenfehler-Klassen amtlich
belegt: falsches `rectifies`-Ziel (SKV/AIG-Verwechslung), fehlende `dateApplicability` und
echte Sammelberichtigungen (ein `rectifies` für mehrere Erlasse). Rund 10 vermeidbare
CI-Läufe heute allein durch BEHIND-Nachzüge vor dem Merge.

**Offen für die nächste Session:** Fehlerbuch-Zeilen Tabellen-`<dt>`-Marken (ZPO art_250,
StG art_5 f., BV art_197), 216 Struktur-Sidecars ohne `stand`/`fassungsToken`, offene
doc/pdf-Berichtigungen aus der `rectifies`-Messung. David-Handgriffe unverändert: BE-Sprengel-
Abnahme, BS-Lizenz/Schlüssel, CC-BY-Nennung `data.bs.ch`, 114 BS-Kanten, Merge-Queue-
Repo-Setting.

## Session 12.9.2026 (6) — Fehlerbuch-Welle 6 `W2·18-FEHLERBUCH` (Opus-Bau + Sonnet-Prüfer)

**Ablauf:** Fortsetzung der Fehlerbuch-Runde auf dem Stand von Session 12.9.2026 (5) —
zwei Bau-Schritte gelandet, ein dritter landet gerade.

**Gelandet:** #836 `0f8981838` Fedlex-Trenner mitführen — `extrahiere-fedlex.ts` verwarf
den Trenner (`a. ` vs. `A: `) bisher; additiv `items[].trenner` (Opus-Bau, Sonnet-Gegenprüfung),
87 «:»-Labels/1447 «)»-Marken/2852 ohne Trenner erfasst, 227 Bund-Snapshots nur um das neue
Feld ergänzt (Skelett-Nullprobe: 0 Restdiff), Leser nutzt das Feld statt der bisherigen
Heuristik; löst Wurzel zu Issue #679 · #837 `8a7336e5a` OR-Leser-e2e auf 60-s-Budget gehärtet
— Wurzel gemessen (CDP-CPU-Drossel 10x: 10-s-Default 8/8 rot, 60 s 0/8 rot), zentraler Helfer
`e2e/helpers/orLeser.ts` (`OR_LESER_FRIST`/`warteOrGeladen()`), bare 10-s-Defaults in 6 Specs
ersetzt.

**Landet gerade (nicht Teil dieser Landung, PR offen):** #838 (Kopf `ade48cac9`)
QS-KORPUS-SCOPE — 23 scope/decl-Sektionen in 12 Staatsverträgen ingestiert; Gegenprüfung läuft,
ROADMAP-Zeile bleibt darum bewusst offen stehen, bis gemergt.

**Lehre dieser Session:** CPU-Drossel-Messung (CDP throttling, nicht blosses Wiederholen) ist
die belastbare Beweisform für e2e-Timeout-Ursachen — #837 zeigt am selben Test 8/8 rot bei
10 s vs. 0/8 rot bei 60 s unter 10x-Drosselung, statt nur eine höhere Zahl zu raten.

**Nachfunde dieser Session (noch nicht gebaut, als ROADMAP-Zeilen unter `W2·18-FEHLERBUCH`
vermerkt):**
1. Tabellen-`<dt>`-Marken («–»/[tab]) werden in ZPO art_250, StG art_5 f., BV art_197 als
   Aufzählungsmarken extrahiert — Extraktions-Altlast (Nebenfund #836); Fix gehört in den
   Extraktor (Tabellen-`<dt>` von Aufzählungs-`<dt>` trennen), nie in die Daten geflickt.
2. 216 Struktur-Sidecars tragen `stand`/`fassungsToken` noch nicht (additiver Alt-Rollout aus
   #824) — nur die 12 Sidecars aus #838 haben die Felder bereits; eigener Regenerations-Schritt
   aus dem Cache mit Skelett-Nullprobe.
3. Die Leser-Wurzel für scope/decl-Sektionen (Geltungsbereich, CH-Erklärungen/Vorbehalte) heisst
   synthetisch «Anhänge» — uneinheitlich bei 14 LUGUE-Verträgen und den 12 aus #838;
   Empfehlung der Gegenprüfung zu #838 abwarten, bevor gebaut wird.

## Session 12.9.2026 (5) — Fehlerbuch-Welle 5 `W2·18-FEHLERBUCH` (Einzel-Fixer + Opus-Prüfer)

**Ablauf:** Fortsetzung der Fehlerbuch-Runde auf dem Stand von Session 12.9.2026 (4) —
zwei Fixer plus eine Netz-Arm-Gegenprüfung, letztere noch offen.

**Gelandet:** #833 `5b4aa17a7` Falscher Freund «BMV» im Kanton-Pfad — `KUERZEL_NUR_BUND`
griff am primären `NORM_IM_TEXT`-Anker nicht (Guard-Lücke, zweistufige Root Cause), betraf
neben SG-3849 (Gebührentarif, BMV↔Schutzbautenverordnung) auch StG-Fehlverlinkungen in
AR-621.111/AR-625.21/AI-640.000; korpusweites Delta StG 25 + BMV 10 in 4 Dateien, §1-Grundsatz
«kein Link statt falscher Link» durchgesetzt (Opus-GP bestanden, Rot-Beweise Art. 9 BMV 1→0
und Art. 35 StG 1→0) · #832 `66c7d74be` Kontext-Panel zeigt bei FZA/AS 2021 12 beide Daten
(Finding-4b, Gegenprüfung #820) — Fedlex-Graph liefert kein `dateApplicability`, `dateDocument`
ist kein Proxy (Vollerhebung 757 Marker-Fälle, 240 Korpus-Caches: «angewendet ab» nur bei FZA);
darum amtlich belegte Whitelist `dateInKraftFuerCh` statt Heuristik, Zeile «in Kraft für die
Schweiz seit 15.12.2020 · angewendet ab 1.1.2021», neuer Hausbegriff `IN_KRAFT_FUER_CH_LABEL`.

**Landet gerade (nicht Teil dieser Landung, PR offen):** #834 (Kopf `d5e57a0a7`) Netz-Arm
`check:revisionen-rectifies` — Gegenprüfung von 25 `rectifies`-Kanten: 14 übereinstimmend,
2 abweichend (SKV `oc/2025/686` + AIG `oc/2025/342`, als belegte Fedlex-Datenfehler in
`bibliothek/normtext/rectifies-ausnahmen.json` verankert), 2 Sammelberichtigungen, 7 nicht
abrufbar (Fedlex führt sie nur als doc/pdf-a). Ausnahmen sind an ihr erwartetes Ziel gebunden
— weicht der Wert künftig ab, wird der Wächter rot (Stale-Bindung). **#834 ist zum Zeitpunkt
dieser Karte OPEN** (geprüft via `gh pr view 834`) — die ROADMAP-Zeile «Wächter rectifies-Ziel
vs. Berichtigungstext» bleibt darum bewusst offen stehen, bis gemergt.

**Nachfunde dieser Session (noch nicht gebaut, als ROADMAP-Zeilen unter `W2·18-FEHLERBUCH`
vermerkt):**
1. Der rectifies-Wächter ist für 7/25 Berichtigungen blind, weil Fedlex sie nur als
   doc/pdf-a führt, nicht als HTML — Konvertierung ist machbar (`textutil -convert txt` auf
   macOS, sonst PyMuPDF), Tor müsste die doc-Manifestation mit abdecken, damit die Klasse
   «nicht abrufbar» auf 0 sinkt (Gegenprüfung #834).
2. Der Bund-Pfad löst «Art. 9 BMV» weiterhin auf die per 1.3.2026 aufgehobene Fassung
   `cc/2009/423` auf (`src/lib/fedlex/tabelle.ts`), obwohl `aufhebungen.ts` die Nachfolge
   kennt — die in #823 gebaute Fassungs-Reihe (`normKeyFuerAbk` mit Datum) ist bisher nur im
   Aufnahme-Pfad wirksam, nicht im Verweis-Resolver (Gegenprüfung #833).

## Session 12.9.2026 (4) — Fehlerbuch-Welle 4 `W2·18-FEHLERBUCH` (Einzel-Fixer + Opus/Sonnet-Prüfer)

**Ablauf:** Fortsetzung der Fehlerbuch-Runde auf dem Stand von Session 12.9.2026 (3) —
vier weitere Einzelbauten (§8-Marker-Semantik, Steuer-Doku der Wellen 2+3, Prerender-Kopf
aufgehobener Erlasse, BMV_2025-Aufnahme) plus eine noch offene Gegenprüfungsrunde
(Kanton-Fremd-Drift AR/BS).

**Gelandet:** #827 `d7d4bbca1` §8-Marker `berichtigung-fremdes-as-dokument` für
`jolux:rectifies`-Kanten (18 Einträge, 14 Erlasse), Tor-Prüfung (8b) mit Rot-Beweis,
deterministische Ziel-Wahl (3 Prüfrunden Opus — Runde 1 falsifizierte die ursprüngliche
Lesart «Fedlex-interner Widerspruch» amtlich: `jolux:rectifies` benennt das AS-Dokument
der Erstpublikation/Anhangs-Änderung, `classifiedByTaxonomyEntry` den betroffenen
SR-Erlass, kein Widerspruch; Runde 2 fand einen echten Fedlex-Datenfehler im Marker-Text
— Provenienz-Satz «erstpubliziert» bei AS 2025 686/SKV falsch, `rectifies`-Ziel 648 statt
amtlich 644; Runde 3 bestanden, Marker-Text gibt nur noch das Tripel wieder) · #825
`eeb1c2c96` Steuer-Doku Wellen 2+3 + drei Fehlerbuch-Zeilen (Session-Karte (3)) · #826
`3d2c97d75` Prerender-Kopf aufgehobener Erlasse — «Amtliche (aufgehobene) Fassung ·
aufgehoben per … · Totalrevision in Kraft seit …» statt «(geltend)», belegtes
`nachfolger.inKraftSeit` aus SPARQL `dateApplicability` (Opus, 2 Runden; A1
Nachfolger-SR-Selbstverweis bei Totalrevision über belegtes Feld gelöst, A2 Reader nutzt
dasselbe Feld, A3 Benennungs-Kanon, A4 Beleg patv/vgvp) · #823 `fbe82c2f2` BMV_2025 ins
Korpus (SR 412.103.1, Totalrevision 1.3.2026; Sonnet, 2 Runden — CI-Rot 1: verworfenes
Wort «geltende Fassung» im Link-Text ⇒ Benennungs-Wächter; CI-Rot 2: Kürzel-Kollision
BMV/BMV_2025 auf derselben SR ⇒ «Fassungs-Reihe» `normKeyFuerAbk(abk, datum)`, 0
betroffene Entscheide, Bibliothek `bmv-totalrevision-2026-09-12.md`; CI-Rot 3:
Verweis-Basislinie).

**Landet gerade (nicht Teil dieser Landung, PR offen):** #828 (Kopf `2ebadd940`)
Kanton-Drift AR/BS — Drift-Tor sah nur 69 von 1189 LexWork-Kanton-Snapshots als
tarif-zitiert (§6.7-Lücke), Vollinventar 1185→1189 Gruppen korrigiert, 26 AR/BS-Erlasse
nachgeführt, fr-Stand-Regex («en vigueur depuis: …») korrigierte 3 VS-Stände (173.8-fr,
178.104, 211.611); 4 Prüfrunden Opus (A1 `lawId`-Suffix-404-Warngruppen, B2/D1
`erlassNr`-Verlust im `--nur`-Pfad — Mehrheits-Heuristik durch 1:1-Übernahme ersetzt,
der Wächter selbst war nicht scheiterfähig: er hätte 267 Verlust-Kandidaten zeigen
müssen, mass 0). **#828 ist zum Zeitpunkt dieser Karte OPEN** (geprüft via
`gh pr view 828`) — die zugehörige ROADMAP-Zeile «Kanton-Drift» bleibt darum bewusst
offen stehen, bis gemergt.

**Lehren dieser Session:**
1. **Fixer nie in einen Worktree schicken, in dem eine Gegenprüfung noch läuft** — der
   Prüfer meldete dort fremdes, uncommittetes WIP (§12/§14.7). Verankert als
   Orchestrator-Falle (f) in Skill `auftrag` §6.
2. **Nach jeder Register-Regeneration gehört `check:verweis-inventar -- --schreiben`
   NEBEN `gen:zaehler` in die Projektions-Kaskade**, sonst kostet die Lücke jeden
   Folgelauf einen eigenen CI-Durchgang (drei CI-Läufe verloren, #827). Kaskaden-Liste
   in Skill `auftrag` §6 (Punkt g) ergänzt.
3. **Landereihenfolge spielt keine Rolle — jede Landung macht die übrigen offenen PRs
   `BEHIND`**; Merge Queue bleibt David-Setting. Nicht neu verankert: Skill `landung`
   (Abschnitt „Serielle Landung“, Schritt 2) dokumentiert die `BEHIND`-Nachkontrolle
   bereits — kein Netto-Zuwachs (Chesterton, §17-Gegengewicht).
4. **Marker-Semantik aus einem einzelnen RDF-Tripel ist eine Tatsachenbehauptung, keine
   Wiedergabe, wenn sie ungeprüft in Prosa übersetzt wird** (#827, erst Runde 3 neutral).
   Neue Klasse F16 in Skill `lehren`.
5. **Ein Wächter-Test mit UND-verknüpften Bedingungen kann still 0 messen, statt zu
   scheitern** (#828 Runde D1: der Vollabdeckungs-Wächter im `--nur`-Pfad hätte 267
   Verlust-Kandidaten zeigen müssen, zeigte 0). Gehört inhaltlich zu §6.7 (Skill
   `refactoring`) — ausserhalb der Whitelist dieser Session; darum nur als ROADMAP-Zeile
   unter `W2·18-FEHLERBUCH` vermerkt, Verankerung in Skill `refactoring` als eigener
   Schritt offen.

**Nachtrag:** #828 `bc3e65eb8` und #830 `a115a27cf` gelandet, alle Worktrees geräumt.

## Session 12.9.2026 (3) — Fehlerbuch-Wellen 2+3 `W2·18-FEHLERBUCH` (je Einzel-Fixer + Opus/Sonnet-Prüfer)

**Ablauf:** Fortsetzung der Fehlerbuch-Runde aus Session 12.9.2026 (2) — Welle 2 und
Welle 3, wieder je ein Einzel-Fixer-Agent im eigenen Worktree, je Prüfrunde Opus oder
Sonnet als Gegenprüfer.

**Gelandet:** Welle 2 — #818 Bestandszahl-Sperre gegen stillen Korpus-Abgang bei
Offline-Refresh (`9df548fb4`; Prüfer-Blocker aus Runde 1: die erste Fassung feuerte auf
dem VOLLSTÄNDIGEN Korpus, weil `altManifest.entscheide.length` abgeleitete
`__voll`-Verweis-Einträge mitzählte, `auswahl.length` aber nicht — Nullprobe auf dem
echten Bestand 5093/6341 belegt) · #819 Reparatur-Arm um `normtext:revisionen` ergänzt
(`0fe6bdb7a`) · #820 FZA-`nichtKonsolidiert`-Marker («angewendet ab» als Konsolidiert-
Beleg, Vollerhebung 87→34 prüfbare Marker, genau 1 Treffer) (`8aa845bb0`).
Welle 3 — #821 `standRechtsprechung` aus max(abgerufen) statt Register-Erzeugungsdatum
(`f63c51c81`) · #824 (Neuaufsetzung von #822, byte-gleich zum geprüften Kopf `5c8b825dc`,
Historie-Rewrite war gesperrt) — `normtext:struktur --nur=<KEY>`, Churn-Fix, Cache-Pin-
Sonde mit Bestandssperre, D1 Cache-Pflicht nur bei tatsächlichem Fetch (`6aca2901e`;
drei Gegenprüfungsrunden Opus: B1 Pin-Skip machte Tore zu No-ops, C1 CI-Lage ohne
`/tmp`-Cache lief unbemerkt grün durch, D1 Frische-Arm-Deadlock).
**Offen (nicht Teil dieser Landung):** #823 BMV_2025 im Korpus (SR 412.103.1,
`cc/2025/408`, neuer Register-Key neben dem historischen `BMV`) + §17-Wurzelfix SR-
Kollision im Revisionen-Generator (`lesePinsMitSr()` auf Register-Key statt SR
umgestellt) — PR offen, Auflage «Nachfolge-Link intern» aus der Gegenprüfung noch nicht
eingebaut, nicht mergen.

**Lehren dieser Session:**
1. **Ein Sperren-/Wächter-Bau ohne Nullprobe gegen die reale Korpus-/CI-Lage blockiert
   Nachtläufe (Deadlock), statt sie zu schützen** — dreimal an einem Tag: #815 (A4,
   Welle 1) verlangte Kanten auch für bereits ENTLISTETE Dokumente und brach beim
   nächsten legitimen Entlistungslauf ab; #818 (B1) feuerte die erste
   Bestandszahl-Sperren-Fassung auf dem unveränderten, vollständigen Korpus; #824
   (C1/D1) nahm einen `/tmp`-Cache als gegeben an — in der CI-Umgebung ohne diesen Cache
   lief das Tor unbemerkt grün durch, statt den fehlenden Fetch zu melden. Neue Klasse
   F15 in Skill `lehren`.
2. **CI-Skip-Marker nie wörtlich in einer Commit-MESSAGE zitieren — auch nicht im
   Nachbesserungs-Commit** (#822 → #824): weil der Marker schon einmal im Verlauf
   stand, war Historie-Rewrite (Amend/Rebase-Squash) gesperrt und #822 musste komplett
   neu aufgesetzt werden (byte-gleicher Inhalt, neuer Commit ohne den Marker im Wortlaut)
   statt nur nachgebessert zu werden. Ein Fixer-Prompt muss diese Regel selbst tragen —
   ein Nachbesserer erbt sie nicht automatisch vom Erstversuch.
3. **Nach jedem main-Nachzug in einem PR die volle Projektions-Kaskade fahren, nicht
   nur das nächstliegende Artefakt** (#820): der Rebase auf `main` (`8aa845bb0`) verlangte
   mehr als das Manifest — `lesePinsMitSr()` musste sowohl das `konsKompakt`-Feld aus
   #820 als auch die Zwei-Schlüssel-Struktur des eigenen PR zusammenführen; ein Nachzug,
   der nur das Manifest neu erzeugt, hätte die stille Rückkehr des behobenen Fehlers
   riskiert.
4. **Die SR-Nummer ist bei Totalrevisionen kein stabiler Erlass-Schlüssel** (#823):
   SR 412.103.1 trägt seit 1.3.2026 zwei Erlasse (historisch `cc/2009/423`, geltend
   `cc/2025/408`) — eine reine SR-Keyung in `lesePinsMitSr()` hätte der nächsten
   Vollregeneration den ELI und Korpus-Stand der Nachfolgerin auf den historischen
   Erlass übertragen (Rot-Beweis geführt: SR-Map lieferte für Register-Key `BMV` die
   Daten von `BMV_2025`). Gegenmittel: Lookup nach Register-Key (== Pin-Name), SR nur als
   Rückfall.

## Session 12.9.2026 (2) — Fehlerbuch-Runde `W2·18-FEHLERBUCH` (Finder → 5 Einzel-Fixer → Opus-Prüfer)

**Ablauf:** ein Finder sammelte fünf Fund-Zeilen aus `FAHRPLAN-OFFENE-BEFUNDE.md`/`FAHRPLAN-UI-BEFUNDE.md`,
je ein eigener Einzel-Fixer-Agent (Prinzip `einzelne-spezialisierte-agenten`) baute isoliert im eigenen
Worktree, ein Opus-Prüfer lief gegen jeden Bau gegen.

**Gelandet:** #812 LM-187 (Teil 2 war bereits seit PR #681 gebaut, nur die Fund-Zeile hinkte nach —
reine Doku-Korrektur, kein Code) · #813 LexWork-Adapter: Laufzeit-Validierung `validiereTextOfLaw()`
statt Compile-Cast, inkl. `annex_documents`-Elemente (Gegenprüfungs-Auflage A1 nachgebessert) · #814
Register-`sha` stand-frei (`shaEintrag()` ohne `r.stand`, Duplikat `shaVernehmlassung()` gelöscht — eine
Formel, §5) · #815 `check:materialien`-Vollständigkeitswache (Dokumente **und** Kanten, nur gelistete
IDs, stempel-neutraler Shard-Vergleich, Schreib-Wache vor dem projizierenden Lauf, Blindzähler «0
Kanten/Downgrades» gestrichen statt umformuliert — vier Gegenprüfungs-Runden A1–A4).

**Landet gerade** (fünf Prüfrunden, Gegenprüfung bestanden — Opus, bger.ch-clir-Abruf 12.9.2026,
noch nicht gemergt): #816 BGE 151 II 475 Datumsfehler (1999→2025, Wurzel im B1-Refresh-Zweig von
`scripts/normtext-entscheide.ts`, nicht im Adapter) + vier weitere Datums-Hebungen aus der
Gegenprüfungs-Auflage A2 (151 I 73, 151 II 710, 151 III 336, 152 V 20). Dabei zwei tiefere Funde:
(1) derselbe B1-Zweig hatte bei 6/1259 BGE die `regeste.sprachfassungen` beim additiven Refresh
stillschweigend verworfen (`entscheide-b1-merge.ts` mergt sie jetzt, statt zu ersetzen; neuer
`check:entscheide`-Ast: Regeste ohne Sprachfassungen ⇒ FEHLER); (2) OCLs eigener Basis-Record für
`bge_152_V_2` ist bei `full_text`/`docket_number_2`/`decision_date` mit `bge_152_V_20` konfliert —
auf den ehrlichen Bandjahr-Platzhalter zurückgestuft, `abschnitte`/`rubrum`/`zitierteNormen`/
`dispositivOrders` genullt, neues Feld `quarantaene` + sichtbarer UI-Hinweis («… ist in der Quelle
mit BGE 152 V 20 vermischt …»), neuer Konflations-Wächter (`findeFremdeFundstelleImBody`, Prüfmenge
6/1259 BGE mit band-gleichem Seitenkopf, 0,5 %). Content-Korrektur des kontaminierten Records bleibt
bewusst offener Befund (kein bestehender Mechanismus deckt eine Verunreinigung des OCL-Basis-Records
selbst ab). PR-Bodies (`gh pr view 812..816`) tragen die Tor-Listen/Stichproben vollständig.

**Lehren dieser Session:**
1. **Ein Auszug-only-Refresh darf einen Bestandseintrag nie ersetzen, nur mergen** (#816): der
   B1-Zweig übernahm ein frisch geholtes Auszug-only-Ergebnis komplett und liess dabei über zwei
   additive Nachpflege-Läufe (5.7./28.7.2026) bei 6 BGE die Sprachfassungen unter den Tisch fallen —
   kein Tor prüfte Regeste-Vollständigkeit, gefangen hat es erst der Prüfer. Jetzt Tor-Ebene
   (`mergeB1Ergebnis` + `check:entscheide`-Ast) — Registerzeile F14 in Skill `lehren`.
2. **Bei Datenkorrekturen die VOLLE Vitest-Suite fahren, gezielte Dateien übersehen Zahlen-Pins**
   (#816, D1+D2): die BGG-Bezüge-Zähler-Pins (`bezuege-facetten.test.ts`) verschoben sich als
   notwendige Folge der Konflations-Bereinigung (Kanten 10'559→10'604, Dokumente 1253→1254) — nur der
   volle Lauf (482 Dateien/7851 Tests) fing das, ein gezielter Testdatei-Lauf hätte es nicht gesehen.
3. **Prüfer-Auflagen können falsch sein — Bauer-Abweichung mit Quellort-Beleg (§7) ist erwünscht**
   (#816): die Auftrags-Whitelist nannte `scripts/rechtsprechung/**`; das Bund/BGE-Korpus wird
   tatsächlich von `scripts/normtext-entscheide.ts` erzeugt (`scripts/rechtsprechung/**` ist
   ausschliesslich der BS-Kantonsimport) — die Wurzel liegt zwingend im erstgenannten Pfad, offengelegt
   statt stillschweigend der falschen Whitelist gefolgt.
4. **Wächter-Reichweite immer mit Prüfmenge angeben** (#816, D2-Korrektur): der neue
   Konflations-Wächter deckt 6/1259 BGE mit band-gleichem Seitenkopf-Marker (0,5 %) ab — die erste
   Formulierung nannte «26 BGE mit irgendeiner Zitierung» und zählte auch legitime Alt-Band-Zitate
   mit; eine Prüfmenge ohne Nenner verschleiert, wie schmal ein Wächter tatsächlich greift.

## Ältere Session-Karten und Chroniken — rotiert ins Archiv

Verbatim verschoben nach `archiv/STRUKTUR-SESSIONKARTEN.md`
(FAHRPLAN-TOKEN-DISZIPLIN.md T-4): **13.6.2026** alle sieben 11.6.-Karten
(früher Abend · später Nachmittag · abends · nachmittags · vormittags ·
über Nacht · Tag «Schlichtung fertig + Vollerhebungen») · **11.6.2026**
Sessions 10.6. abends (STRUKTUR-UMBAU S-1–S-6) und nachmittags
(Fristen-Einheit FE-1–FE-6) · 7.6. abends (Betreibungsamt-Finder) und
nachts (Plan 9b Volldokumente) · 6.6. abends und nachmittags ·
Verschlankung 5.6.2026 · Session-Abschluss 6.6.2026 · **10.7.2026** alle
139 Session-Karten datiert 12.6.2026–3.7.2026 (Rotations-Auftrag «Karten
≤3.7.2026 ins Archiv»; neuester Block liegt jetzt zuoberst im Archiv,
Reihenfolge unverändert). · **10.7.2026 (QS-TOK/T1, mechanisiert):** 34 Karten
≤6.7.2026 byte-genau ins Archiv rotiert (nur die drei 10.7.-Karten bleiben);
Byte-Bilanz bestätigt (kein Inhaltsverlust), Rotation läuft künftig automatisch.

## Verifikationsstand (eine Zeile)

Stand 11.6.2026: Build + 38 Prerender-Routen ✓ · Lint 0/0 ✓ · Suite 1404
grün + 2 skipped (78 Dateien) ✓ · tsc STRICT · Golden 104/104 byte-gleich ✓
· Logik-Sweep 14'448 Kombinationen ✓ — Workflow: **`npm run gate`** (bzw.
`gate:schnell` pro Iteration; leise bei Grün, volle Ausgabe nur für rote
Tore, CLAUDE.md §6 Ziff. 1/5); `npm run check` für die Offline-Checks,
`npm run check:netz` für Fedlex; vor Deploys unabhängige Review-Agents
(Skill `landung`).

**Informationsbibliothek: `bibliothek/INDEX.md`** — Quellen-Register
(verifizierte Fedlex-Stände inkl. ZPO-Revision 2025), Parameter-
Verfallsregister, Recherche-Dossiers (Schlichtungsbehörden 26 Kantone),
ZPO-Normtexte für die Zuständigkeitsengine.

**Zuständigkeitsengine (`src/lib/zustaendigkeit.ts`, Phase 1 — entwurf):**
Bundesrechtsschicht nach ZUSTAENDIGKEIT-AUFTRAG.md (Spezifikation im
Repo-Root): Verfahrensart (Art. 243 inkl. Abs.-3-Vorbehalt), Schlichtung
(197–200), Entscheidkompetenz (210/212, Revision 2025: 10'000),
Gerichtsstände (10/32–35), HG-/Direktklage-Weichen (6/8). 30 Tests mit
beidseitigen Schwellen-Grenzwerten. **Phase 2 erledigt:** Kantonsschicht
`data/zustaendigkeitKantone.ts` (BS-Pilot, Stellen-Auflösung über
behoerden.ts, GOG-Schwelle bewusst null/offen) + SG_SCHWELLEN beziehen
die Zuständigkeits-Schwellen aus ZPO_SCHWELLEN (SSoT §5, golden-bewiesen
byte-gleich). **Phase 3 erledigt:** /rechner/zustaendigkeit (Form §3-rein,
Eckdaten-Tiles, Stelle mit Adresse/Quelle, Weichen offen, PDF-Bericht);
Katalogkarte `zustaendigkeit` (pro/entwurf) ersetzt die drei geplanten
Karten gerichtsstand/verfahrensart/schlichtung. **Phase 4 erledigt:**
Prefill-CTA → Schlichtungsgesuch BS (sgPrefillKodieren/Lesen; nur bei
ordentlicher Behörde + erfasster Stelle; Golden byte-gleich) — MVP
end-to-end. OFFEN: weitere Kantone (nach Dossier-Abnahme), weitere
Ziel-Vorlagen. Davids fachliche Abnahme steht aus.

## Informationsarchitektur (Stand EINE Hauptseite 7.6.2026)

**EINE Hauptseite (FAHRPLAN-EINE-HAUPTSEITE.md, Auftrag David 7.6.2026 —
hebt die Free/Pro-Zweiteilung vom 5.6. wieder auf):** `/` trägt den
VOLLSTÄNDIGEN Katalog (Gebiets-Kacheln, Suche `?q=`, Panel `?gebiet=`,
Anliegen-Zeile, «Zuletzt verwendet») hinter einem kompakten Hero
(Free-Nutzen-Headline in h2-Höhe; Kennzahlen OHNE Preisaussage bis
Monetarisierungs-Entscheid G1). Davor eine kuratierte Chip-Zeile
**«Häufig gebraucht»** (`lib/haeufigGebraucht.ts`, Nachfolger der
Free-Kachelwand-Kuratierung; nur Verfügbare erscheinen). `tier`-Feld,
`PAYWALL_ACTIVE`, `lib/proSession.ts` (Pseudo-Login) und der
Header-Pro-Button sind ENTFERNT (D-3; Stand vor dem Rückbau: Git-Historie
bis `2e80daf`). `/pro`, `/fachpersonen`, `/rechner` → DAUERHAFTE Redirects
auf `/` mit erhaltenem Suchstring (Permalink-/.ics-Link-Erbe). Mobil erbt
die Hauptseite den vorbestehenden 390px-Overflow des Katalogs
(FAHRPLAN-DESIGN Etappe 4, offener Strang).

**Katalog-Gliederung: primär nach RECHTSGEBIET** (17 kanonische Sektionen
in fester Auftrags-Reihenfolge, `RECHTSGEBIET_SEKTIONEN`), darunter je die
Untergruppen **Rechner** und **Vorlagen** (nur nicht-leere). Output-Typ
(Rechner) und Dokument-Typ (Vorlagen) sind FILTER; Rechtsbereich-Filter und
Suche bleiben. **Der frühere Modus-Umschalter (Primärweiche Rechner |
Vorlagen) ist damit abgelöst und entfernt**; `?modus=`-Links bleiben
harmlos; die Alt-Gliederungen ('art'/'bereich') sind aus dem Code
entfernt. Header = Zwei-Zonen (Logo links, Aktionscluster rechts:
Sprache · Methodik — Pro-Button entfernt 7.6.2026, Methodik seither auch
mobil), Mitte leer; Utility-Bar nur Pflichthinweis rechts, mobil
ausgeblendet.

**Design-Tokens (Feinschliff 5.6.2026, single source tailwind.config +
index.css):** Typo-Skala GESCHLOSSEN — micro 11 · overline 11 · xs 12 ·
body-s 14 · base 16 · body-l 18 · h3 20 · h2 25.6 (auch Ergebnis-Hauptwerte
mit `leading-none`) · h1 32 · display 36/44 (Heroes). **`text-sm`/`text-lg`
sind verboten** (Tailwind-lh weicht ab; body-s/body-l verwenden). Radien
komplett tokenisiert (--radius-sm…2xl). Status-Hintergründe nach EINEM
Rezept (`color-mix --status-tint 10%` auf Papier; AA geprüft). Motion:
--dur-fast/base/slow + --ease, Default-Easing global. Komponenten-Anatomie:
`lc-tile` (Ergebnis-Kachel) · `lc-notice[-warn|-danger]` eigenständig (kein
Inline-Padding!) · `lc-btn-sm` (36px) · disabled steckt in den
lc-btn-Klassen (keine disabled:-Utilities) · ein Aktions-Akzent
(lc-btn-primary; lc-btn-brass entfernt).

**Layout:** Inhaltsspalte einheitlich `max-w-content` = **70rem (~1120px)**
(Token in tailwind.config); 8-px-Skala `--space-1…24`, `--control-h` 44px,
`--pill-h` 36px. Hero text-geführt einspaltig (keine Deko-Grafik, bewusst
nicht animiert), Untertext ≤ 58ch; Determinismus-Claim genau EINMAL (Hero).
Kartenraster `repeat(auto-fill, minmax(340px, 1fr))`; Titel ohne Silben-
trennung (`text-balance`); Pills im Inhaltsblock, nur CTA per `mt-auto`
unten. Keine Ziffern in Sektionsköpfen/Sidebar (konsistent nirgends).

**Pro-Katalog = KACHEL-KATALOG (Umbau 6.6.2026 nachts, Live-Auftrag David;
Roadmap + Entscheide: FAHRPLAN-KATALOG-UI.md):** Die 17 Rechtsgebiete sind
kompakte Kacheln unter den 5 Obergruppen (Name · Zähler «X verfügbar · Y in
Vorbereitung» · verfügbare Werkzeug-Titel, geklemmt). Klick öffnet das
Gebiet als Panel in voller Breite unter der Kachel-Zeile (`?gebiet=` in der
URL, teilbar; nur ein Panel zugleich); die Disclosure-Sektionen samt
Scrollspy sind entfernt. Darüber: Anliegen-Zeile (lib/anliegen.ts, 8
situative Einstiege — ENTWURF, Abnahme David offen) + «Zuletzt verwendet».

**Suche:** EIN kompaktes Suchfeld in der Katalog-Seitenleiste (Desktop)
bzw. im Filter-Drawer (mobil) — filtert den Katalog live. Die frühere
⌘K-Befehlspalette ist entfernt (Entscheid David 5.6.2026). Seit 6.6.2026:
Suche/Filter aktiv → flache, gerankte Trefferliste statt Kacheln (Rang:
Titel > Keyword exakt > Keyword > Norm > Gebiet; lib/katalogSuche.ts —
dieselbe Logik testet die Suchbegriff-Goldliste katalogSuche.test.ts,
48 Paare Laie/Fach/Norm); `?q=` in der URL; «/» fokussiert das Feld;
Keywords kompakt verglichen wie Normen («Art.311» = «311 ZPO»).
Metadaten-Inventur: `npx vite-node scripts/katalog-inventur.ts`.

**Sprachen:** Umschalter sichtbar (Header); EN/FR/IT «in Bearbeitung» mit
DE-Fallback + persistentem Banner; KEINE maschinelle Übersetzung (fachkundige
Person später). `<html lang>` folgt der Locale; Fedlex-Links ebenfalls
(fr/it amtlich — Anker stichprobenverifiziert sprachunabhängig; en → de).

## Status-Modell (ehrlich, drei Zustände)

`entwurf` (oranger Top-Rand `--warn-500` + Outline-Badge «Entwurf»
(`.lc-badge-entwurf`), Tooltip «erstellt, fachlich noch nicht geprüft»;
dazu EINE Status-Legende über der Startseiten-Kachelwand statt lauter
Einzel-Badges — Design-Review 6.6.2026, Freigabe David) = gebaut, ungeprüft ·
`geprüft` (Goldrand, KEIN Wort-Badge) = fachlich geprüft — **aktuell
nirgends vergeben** · `geplant` (gedämpft, AA-konform ohne Opacity) =
«In Vorbereitung», ohne Norm-Pills/Artikel-/Tagesangaben.
**Alle NormRefs tragen `verified: false`**, bis David sie fachkundig gegen
Fedlex prüft (Anker selbst sind build-verifiziert, Format `art_335_c`).
Form-Gates der Vorlagen bleiben im Entwurf-Status voll funktional.
Status-Filter heisst «Nur verfügbare» (= nicht geplant).

## Katalog (Quelle: src/lib/startseiteConfig.ts — Single Source of Truth)

**111 Einträge: 64 Rechner + 47 Vorlagen** (Katalog-Ausbau 5.6.2026: +59
geplante Karten gemäss KATALOG-ROADMAP.md; Soll-Inventar dort gepflegt).
Felder: modus, art, rechtsgebiet (kanonisch, 17 Werte),
**rechtsbereich** (privat/oeffentlich/straf/uebergreifend), status, norms
(NormRef mit verified), href, schemaId/formvorschrift/output (Vorlagen),
szenarien (konsolidierte Rechner), related (modusübergreifend), keywords
(**tier entfernt 7.6.2026**, FAHRPLAN-EINE-HAUPTSEITE). VorlageArt um
**korrespondenz** («Schreiben & Erklärungen») erweitert. Neue geplante
Karten: norms [], kein href, neutrale Beschreibungen (Normentreue);
Roadmap-«[Gerüst]» als «Strukturiertes Gerüst …» im Text.

**Konsolidierung (43→34):** 9 Einzelkarten absorbiert — Klagebewilligung +
Fristwiederherstellung → ZPO-Fristen; Rechtsöffnung/Aberkennung/Kollokation
+ Arrest → SchKG-Phasen; missbräuchl. Kündigung + Massenentlassung →
«Arbeitsrecht — Fristen»; Miet-Anfechtung → «Mietrecht — Fristen»;
Verzugszins-vertieft → Verzugszins; SV-Leistungsverwirkung → ATSG-Karte.
`RechnerCard.szenarien` zeigt abgedeckte/geplante Szenarien auf der Karte.

**Spät-Session 7.6.2026 (Kurzspiegel; Details ROADMAP.md A.0):**
Daueranweisungen §0 Mehrwert-Test + §0a Perfektion-vor-Neubau · Roadmap
−7 geplante Karten (verifiziert) · AG-Programm fertig inkl. Notariats-
tarif-Korrekturen (ZH-Rahmen 123! SG floor!) · Startseite: leere Gebiete
als «In Vorbereitung»-Zeile, Rubrik einzeilig · Vereinheitlichung Runde 1
(Tagerechner-Hash/geteilter Teilen-Button, 7 Titel-Paare + Invariante) ·
Dossiers neu: gmbh-deltas-g0, gmbh-qualifizierte-gruendung,
ag-kapitalkategorien (Bau gesperrt), BGerR-Verifikation (35/35a-Split).

**Konsolidierung Runde 2 (7.6.2026, FAHRPLAN-KATALOG-KONSOLIDIERUNG,
Auftrag David «simplifizieren — ein Einstieg pro Rechtsfrage»):** Katalog
gesamt 115→112, verfügbar 35→32 gebaut, davon **28 sichtbar**. (a) GELÖSCHT
die 3 reinen Hash-Deep-Link-Karten: untermietvertrag → Karte «Mietvertrag
(Wohnen · Geschäft · Untermiete)»; schkg-/straf-zustaendigkeit → EINE Karte
«Zuständigkeit (Zivilprozess · Betreibung · Strafverfahren)» mit szenarien
(kehrt den Katalog-Split vom 6.6. um — Davids Delegation 7.6.). (b) NEU
`imKatalog:false` (BaseItem) + `KATALOG_KARTEN`: die 4 Kündigungs-Masken
(AN/AG/Mieter/Vermieter-Checkliste) behalten ihre Karten als SSoT der
Masken-Seiten (`karte(id)`!), erscheinen aber nicht mehr im Register/Suche —
ihre Auffindbarkeit tragen die Themen-Einstiege «Kündigung & Fristen im
Arbeitsverhältnis» (ex «Arbeitsrecht – Fristen») und «… im Mietverhältnis»
(ex «Mietrecht – Fristen»), deren Rechner-Seiten die Masken direkt verlinken.
(c) Kachel-Overline zeigt jetzt `Gebiet · Rechner/Vorlage` (Funktions-
Kennzeichen, EIN Template-Literal wegen SSR-Marker). Ausdrücklich NICHT
gemergt: GmbH-/AG-Gründung (zwei Werkzeuge, echte Rechtsform-Entscheidung),
Tagerechner↔ZPO/SchKG (gewollter Laien-/Fach-Doppeleinstieg), Rechner↔
Vorlage-Paare (§5: eine Engine, zwei Ausgabeformen). Goldliste deklariert
nachgezogen (misst jetzt KATALOG_KARTEN); Davids Abnahme der neuen
Titel-Wortlaute offen.

**Gliederung (seit Katalog-Ausbau):** beide Seiten = Rechtsgebiet-Sektionen
(GebietSektion, feste §4-Reihenfolge OHNE Relevanz-Sortierung) mit
Untergruppen Rechner/Vorlagen; innerhalb der Gruppen verfügbare vor
geplanten (sortiereKarten). Filter: Status («Nur verfügbare») · auf /pro
zusätzlich Rechtsbereich · Output-Typ (Rechner) · Dokument-Typ (Vorlagen);
Suche in der Seitenleiste. Grenzfall Vorlage «Einsprache»: straf
(Strafbefehl häufiger), Verwaltungsbefehl via Keywords.

## Rechner (Engines in src/lib/, alle rein/deterministisch, kein LLM)

Gebaut (entwurf): zpo-fristen, schkg-fristen, kuendigung-sperrfristen
(inkl. **Sperrtage-Zähler**: Kontingent 30/90/180 je DJ, beansprucht nach
Art.-77-Zählung, verbleibend, Rückfall-Zeilen — Komponente
SperrtageZaehler, auch in der kombinierten Ansicht), mietrecht,
verjaehrung (Zwei-Fristen, Stillstand-Union), gewaehrleistung (Zwei-Regime
1.1.2026), verzugszins (Segmente, Art. 85-Anrechnung), lohnfortzahlung
(Skalen; Engine-Guard AUF 1–100 %), erbteilung, **allgemeineFrist**
(Free-Tagerechner, Auftrag 5.6.2026: dünne Engine auf fristenEngine/
zpoFeiertage — dies a quo IDENTISCH zu zpoFristen, Systemtest AF-14;
getrennte Wochenend-/Feiertags-Toggles, Tage-zwischen-Hilfsmittel;
SR 173.110.3 als Gesetzes-Seiten-Pill, ELI SPARQL-verifiziert).
Feiertage algorithmisch (Computus) — keine Jahres-Klippe.

## Vorlagen-Plattform (src/lib/vorlagen/)

Generische Engine: `assemble(schema, antworten)` rein/deterministisch
(Bedingungs-Algebra eq/in/nichtLeer/and/or/not; wiederholeUeber; nummeriert
mit Leerlisten-Guard; Interpolation; Bausteinprotokoll). Renderer aus EINER
Quelle: vorlagenPdf (jsPDF, Banner-API, WinAnsi-Sicherung) + vorlagenDocx
(docx-Lib, lazy geladen, Word-Formatvorlagen; XLSX architektonisch
vorbereitet, nirgends ausgeliefert). Geteilte Wizard-UI:
components/vorlagen/ui.tsx (Field, NormLink locale-bewusst, Stepper).

**8 gebaute Vorlagen (alle entwurf):**
1. **Testament** (/vorlagen/testament) — eigenhändig: Abschreib-Mustertext,
   Pflichtteils-Panel, Gates 467/505/481/472. KEIN DOCX (Eigenhändigkeit).
2. **Patientenverfügung** (/vorlagen/patientenverfuegung) — Schriftform;
   Konsistenz-Engine R1/R2, harter Sterbehilfe-Block R6 (Art. 114/115 StGB);
   PDF + DOCX (Pilot Mehrformat).
3. **Vorsorgeauftrag** (/vorlagen/vorsorgeauftrag) — formMode-Weiche
   eigenhändig (Mustertext) / beurkundet (Entwurf, DOCX nur hier);
   Eligibility-Gate Art. 13; Grundstück-Sondervollmacht erzwungen.
4. **Schlichtungsgesuch Basel-Stadt** (/vorlagen/schlichtungsgesuch-bs,
   tier experte) — Routing mit Stopp-Karten (Miete/GlG → eigene Stellen,
   Art. 198), Mängelliste mit Schritt-Sprung, SG_SCHWELLEN hart codiert,
   Behörden-Stammdaten BS, Form-Gate (Exemplare = 1+Beklagte), PDF+DOCX,
   BEWUSST ohne localStorage (Anweisung); 12 Akzeptanztests.
5. **Einzelarbeitsvertrag** (/vorlagen/arbeitsvertrag) — ERSTE Vorlage auf
   dem generischen Wizard-Rahmen. Grundlage: normverifiziertes Gutachten
   Art. 319 ff. OR (5.6.2026); Validierungskern = Matrix absolut/relativ
   zwingend (Art. 361/362) + Schriftform-Klauseln (durch beidseitige
   Unterschrift erfüllt) + Disclosure (BGE 145 III 365, 149 III 202,
   129 III 276). Harte Gates: Probezeit ≤ 3 Mte, Frist ≥ 1 Mt (bei
   Befristung neutralisiert), Ferien ≥ 4/5 Wochen, Ferienabgeltung bei
   Vollzeit gesperrt, KV nur mit Ort/Zeit/Gegenstand + Einblicks-
   Bestätigung. Kantonale Mindestlöhne als DATIERTE Parameter
   (AV_MINDESTLOEHNE, jährlich verifikationspflichtig!). ArG in fedlex.ts
   ergänzt (Anker art_9/12/13/46 empirisch verifiziert). PDF+DOCX;
   16 Akzeptanztests. Deklarierte Gutachten-Abweichung: einheitliche
   Frist < Staffel zulässig per Art. 335c Abs. 2 (Hinweis statt Verbot).
6. **Mietvertrag Wohn-/Geschäftsräume** (/vorlagen/mietvertrag, Karte
   mietvertrag-wohnen) — Gutachten Art. 253 ff. OR/VMWG (5.6.2026).
   Zentrale Weiche objektTyp + Kanton. Gates: Kaution ≤ 3 Monatszinse
   (nur Wohnraum), Fristen 3/6 Mte, Index ≥ 5 J/LIK + Staffel ≥ 3 J
   (beide am Fedlex-WORTLAUT verifiziert), NK-Einzelausweis, MWST nur
   Geschäftsraum. DATIERTE Parameter: Referenzzins 1.25 % (1.6.2026,
   quartalsweise!), MWST 8.1 %, Formularpflicht-Kantone (BWO 4.2.2026,
   BE-Diskrepanz offengelegt, dynamisch per 1.11.). PDF+DOCX; 14 Tests.
7. **Vollmacht** (/vorlagen/vollmacht, Karte `vollmacht`) — EINE Maske mit
   Typ-Schalter Anwalts-/General-/Spezialvollmacht (Entscheid David
   5.6.2026 statt zweier Vorlagen; Grundlagen-Bericht «Vollmachten»,
   Downloads). Formfrei (Art. 11 OR) → ausgabeArt `fertig`, PDF+DOCX.
   Gemeinsamer OR-AT-Kern (Parteien natürlich/juristisch, mehrere
   Bevollmächtigte einzeln/gemeinsam, Substitution, Widerruf Art. 34,
   Befristung, transmortale Klausel Art. 35); besondere Ermächtigungen
   als Katalog wortlautnah zu Art. 396 Abs. 3 OR. Deterministische
   Form-Gates: Bürgschaft = SPERRE (Art. 493 Abs. 6 OR), Grundstück =
   Warnung (Art. 216 OR / Art. 86 GBV / Formfrage offen BGE 112 II 330),
   Bank = bankeigene Formulare, Prozess-Bereich = Art. 68 ZPO-Warnung,
   Vorsorgefall = Weiche zu Vorsorgeauftrag/PV (Gesundheits-Bereich
   bewusst NICHT wählbar). Ersetzt die geplanten Karten generalvollmacht/
   bankvollmacht. StPO/VwVG in fedlex.ts ergänzt (Anker art_129/art_11
   empirisch verifiziert). 20 Akzeptanztests.
8. **Klage im vereinfachten Verfahren – BS** (/vorlagen/klage-vereinfacht,
   Karte `klage-vereinfacht`) — zweite BS-Eingabe der SG-Familie
   (normverifizierter Auftrag 5.6.2026). Deterministisches BS-Routing:
   Arbeit ≤30k → Arbeitsgericht (§§ 73 f. GOG), GlG/Mitwirkung →
   Dreiergericht, Gewaltschutz/DSG/Miete-Kern → Einzelgericht (§ 71 GOG);
   ehrliche Stopps (>30k ohne Abs.-2-Materie → ordentlich; Arbeit >30k →
   § 73 Abs. 2-Hinweis; KVG-Zusatz → Sozialversicherungsgericht).
   Schwellen aus ZPO_SCHWELLEN (SSoT); Klagefrist Art. 209 Abs. 3/4 über
   die zpoFristen-Engine ('klagefrist_klagebewilligung', Gerichtsferien).
   ABWEICHUNG vom Auftrag offengelegt: Art. 114 ZPO kennt KEINE Miete-
   Position (lit. d = Mitwirkungsgesetz) → Miete im Entscheidverfahren
   nicht kostenfrei. Begründung = freiwilliger strukturierter Platzhalter
   (Behauptungs-Liste + Beweismittel) mit Verzichts-Baustein (Art. 245
   Abs. 1); Begehren beziffert/unbeziffert (Art. 84/85), Rechtsöffnungs-
   Antrag, Beilagen-Automatik (KB/Ausnahme/Vollmacht/Urkunden), Doppel-
   Hinweis Art. 131. SG-Parteitypen wiederverwendet (parteiZeilen & Co.
   exportiert). PDF+DOCX, ohne localStorage (wie SG). 20 Akzeptanztests.

Wizards 1–3 und 7 mit localStorage (`lexmetrik.vorlage.*.v1`, Hydration
array-gesichert); Vorschau als Funktionsaufruf (kein Remount). Eingaben
(4, 8) bewusst OHNE localStorage.

## PDF-Rechenbericht (src/lib/pdf/)

**Abend-Paket (5.6.2026):** Formulierungskonventionen (lib/konventionen.ts
SSoT + Linter-Test über echte Textausgabe; — → – plattformweit, «5 %»,
SG-Floskeln, Golden-Diff programmatisch als rein konventionell bewiesen).
Free-KACHELWAND (flach, FREE_REIHENFOLGE, Hero neu «Schweizer Recht,
berechenbar.»; Katalog.tsx pro-only). Versimplung: ui/Tabs + ui/
SelectionGrid (14+3 Stellen entdoppelt, SSR-byte-identisch), chf()
kanonisch, tote Katalog-Props raus (netto −175 Z.). Pro: Sektionen
starten EINGEKLAPPT, Zivilprozess & Vollstreckung zuerst. KOMBINIERTER
FRISTENRECHNER free (/rechner/tagerechner: Verfahrens-Tabs Allgemein/
ZPO/SchKG → bestehende Forms; §4 unangetastet; Trennungs-Querschnitt-
Test). Mobile-Check: Tabs-Overflow gefixt (overflow-x-auto), Grids
mobil-Basis. PROJEKTBESCHRIEB.md neu geschrieben.

**Pro-Katalog-Umbau (5.6.2026, Auftrag):** Tabs Verfügbar(17)/Gesamt(111)
(?ansicht=, Default Verfügbar), juristische Obergruppen als Super-Trenner
(lib/rechtsbereichGruppen.ts, 5er-Modell, 4er-Fallback per GRUPPEN_MODELL),
gruppierte Scrollspy-Seitenleiste (Rechtsbereich-Filter+Direkteinstieg
entfernt), Schnellzugriff ★Favoriten+Zuletzt (lib/schnellzugriff.ts,
localStorage, Stern nie auf geplant), istVerfuegbar()-Prädikat, Hero «17
sofort verfügbar». Free unverändert. BetragsFeld: Tausender-Apostroph in
22 CHF-Feldern. Visual-Checks (2 Agenten) GRÜN; P1–P3 gefixt.

**Teuerungsrechner (5.6.2026, /rechner/teuerung, Free):** LIK-Indexierung
mit amtlicher BFS-Reihe (src/data/likReihe.ts, generiert via scripts/
lik-reihe-generieren.py aus cc-d-05.02.08; 10 Originalbasen 1966–Mai 2026;
OPEN-BY). Basis-AUTO wie BFS-Rechner; Modi Indexmiete (Art. 17 VMWG
wortlaut-verifiziert, Senkungspflicht)/Unterhalt (286/128 ZGB)/generisch.
VMWG neu in fedlex.ts. MONATLICHE PFLEGE: Reihe nach BFS-Publikation
regenerieren. Eingaben: Behörden-Registry +Miete/Diskriminierung BS
(Staatskalender 5.6.2026); SG-Forum-Häkchen entfernt (Kantonswahl).

**Logik-Nachrechnung + Versimplung (5.6.2026):** 4 Cluster unabhängig vom
Code aus dem Gesetz nachgerechnet (100+ Handfälle, 6912er-Erbrecht-Gitter,
576er-ZPO≡Allgemein-Gitter): KEINE Berechnungsfehler. Offen für Davids
Entscheid: Sperrtage-ANZEIGE-Konvention (beansprucht Art.-77 vs.
Kalendertage; Endtermine identisch). Versimplung golden-bewiesen
(scripts/golden-outputs.ts, 53 Fälle byte-gleich): naechsterWerktag/
dauerTageInklusiv kanonisch, fmt/iso ×7 dedupliziert, Vorlagen-Helfer
zentral, Rückwärts-Spiegelung direkt.

**Tagerechner-P1 (5.6.2026, Auftrag «Verbesserung Fristenrechner»):**
Rückwärtsmodus (spätester Handlungstag; Verschiebung defensiv «keine»,
Vorverlegung nur mit Ungeklärt-Vorbehalt), Zustell-Helfer (rein informativ:
7-Tage-Fiktion, A-Post Plus Art. 142 Abs. 1bis ZPO), .ics-Export (RFC-5545
inkl. Folding, deterministisch) + Permalink (validiert), Validierung/A11y;
BGE 150 III 367 nachgeführt. AV/MV-Schemas: v1.1.0 (Vertiefungs-Gutachten).
Golden-Output-Protokoll: scripts/golden-outputs.ts (53 Fälle, vergleich-Modus).

**Formatvorlagen-SSoT (5.6.2026, `formatvorlagen.ts` — drei Grundlagen-
Berichte):** Typografie je Format + AUSGABE_REGELN je AusgabeArt
(abschrift = DOCX hart gesperrt · entwurf = PDF-Wasserzeichen «ENTWURF»
[VA beurkundet] · fertig). Eingaben mit Korrekturrand 3.5 cm rechts,
Anrede/Schlussformel/«im Doppel» (Rollen anrede/schlussformel);
Verträge mit Ausfertigungs-Vermerk + QES-Hinweis (Art. 14 Abs. 2bis OR).
Pro-SITZUNG (lib/proSession.ts): Pro betreten = eingeloggt (localStorage,
Reload-fest, «/»→/pro), Header «Ausloggen»; Andockpunkt Zahlungs-Gate (System offen).
Einzeilen-Heros Free+Pro; Gebiets-Titel in Sans.

**Formatvorlagen der Vorlagen-Renderer (5.6.2026, Referenz-Layouts):**
Schemas deklarieren `format` (verfuegung·vertrag·eingabe) + Absatz-`rolle`n
(absender/adressat/datumzeile/betreff/rubrum/parteien/unterschrift); PDF,
DOCX UND Live-Vorschau interpretieren beide aus EINER Quelle. Arial/
Helvetica 11, Haarlinien unter Titel/Betreff, hängende Einzüge (1./–),
gezeichnete Unterschriftslinien, Fusszeile je Seite, Disclaimer 8pt am
Ende; Eingaben OHNE Dokumenttitel (Betreff trägt ihn), langes Datum.
Engine-Konvention: Platzhalter auf …Satz/…Zeile verschwinden leer
ersatzlos (sonst «________»-Vorschau-Strich). Visuell verifiziert via
`.scratch/pdf-beispiele.ts` + qlmanage-Thumbnails.

pdfModel (reines Block-Modell: kopf/hero/tabelle/schritt/hinweisbox/norm)
+ pdfRender mit **eingebetteten Markenschriften** (Fraunces/Geist/GeistMono
als Base64-TTF, ~0.4 MB NUR im lazy Klick-Chunk). Hero-Hauptkennzahl,
Eingaben-Tabelle (Mono rechtsbündig), unzerreissbare Schritte mit
klickbaren Norm-Pills (Vormessung inkl. Pill-Umbrüchen), sichtbare URLs,
Status «Berechnung vollständig». Verzugszins + Kündigung liefern hero.
Visuelle Prüfung: qlmanage-Thumbnails + Swift-PDFKit-Split.

## Oberste Ebene: vier Output-Typen

| Sektion (`art`) | Inhalt |
|---|---|
| Fristen (`frist`) | Prozessuale und materielle Fristen |
| Beträge & Quoten (`betrag`) | Geldansprüche, Zinsen, Kosten, Quoten |
| Zuständigkeit & Einordnung (`zuordnung`) | Gericht, Recht, Verfahrensart |
| Werkzeuge (`werkzeug`) | Rechtsgebietsübergreifende Hilfsrechner |

## Grossausbau 5./6.6.2026 — Zuständigkeits-Plattform (Kurzkarte)

**Drei Rechtswege live** im Zuständigkeitsrechner (je EIGENE Engine, §4):
- **Zivil** (`lib/zustaendigkeit.ts`): 9 Streitsachen · Fahrplan + kantonale
  Kosten-Rahmen (alle 26, `data/zustaendigkeitKosten.ts`) · Art.-113-Kosten-
  freiheit · konkrete Schlichtungsstelle aller 26 Kantone
  (`data/schlichtungsstellen.ts`) mit **PLZ→Gemeinde→Amt** gemeindescharf in
  ZH/AG/SG/TG/FR/ZG/AI (`data/schlichtung/*`, amtliches swisstopo/BFS-Register,
  Generator `scripts/plz-generieren.ts`) · **Handelsgerichte** ZH/BE/AG/SG ·
  **Rechtsmittel-Modus**: Berufung/Beschwerde-Weiche (308/319 ZPO) + obere
  Instanz aller 26 Kantone (`data/obereInstanzen.ts`) + BGer-Schwellen
  (Art. 74 BGG, BGG-Cache verifiziert).
- **SchKG** (`lib/schkgZustaendigkeit.ts`): Betreibungsort-Kaskade 46–55,
  11 Anliegen (Rechtsöffnung/Aberkennung/Widerspruch/Kollokation/Arrest/
  Konkurs/Aufsichtsbeschwerde) mit Verwirkungsfristen-Badges; Gebühr
  Zahlungsbefehl nach Art. 16 GebV SchKG (Stand 1.1.2022, 2026-Vorbehalt
  im Verfallsregister); BJ-Betreibungsämter-Verzeichnis verlinkt.
- **Straf** (`lib/strafZustaendigkeit.ts`): StPO-Decision-Tree (Spezialforen
  35–37 → Tatort 31 → Kaskade 32; Weichen 33/34/38/40/41/42); Anzeige-
  Fahrplan (301; Strafantrag 3 Mt., Art. 31 StGB); zentrale StA aller
  26 Kantone + Bundesanwaltschaft (`data/staatsanwaltschaften.ts`).

**Vorlage Schlichtungsgesuch kantonsübergreifend:** Behörden-Auflösung für
alle 26 Kantone (`components/vorlagen/SgBehoerdenWahl.tsx`; Adressat-Kette
Hand > BS-Registry > Recherche > Platzhalter). **UX-Programm** (9 Etappen-
Commits) + Design-Konsistenz-Sweep abgeschlossen. **Bibliothek:** 21 Dossiers
(4 Regelwerke ZPO/SchKG/StPO/Erbrecht; Behörden Zivil/Straf/Erbgang; Kosten)
— Status je Dossier in bibliothek/INDEX.md (SSoT-Karte dort).

## Offene Punkte (nächste Session)

1. **Fachliche Abnahme durch David** (er ist die «fachkundige Person»):
   **Erste Sichtung aller 4 Vorlagen am 5.6.2026 erfolgt** (Bausteine,
   Gates, Schwellen vorläufig für gut befunden). SEIN ENTSCHEID: **alles
   bleibt `entwurf` / `verified: false`** bis zur Wort-für-Wort-
   Detailüberarbeitung («wir überarbeiten alles später»). Erst danach
   NormRefs auf verified:true und Einträge einzeln auf «geprüft» (Goldrand).
2. **Seine Antworten ausstehend:** redundante Tageszählungs-Hinweise im
   Verzugszins-Bericht kürzen? · DOCX-Standardannahmen ok (Testament ohne,
   VA nur beurkundet)? · Bausteinprotokoll in PDF/DOCX-Exporte aufnehmen?
3. ~~Phase 4: Experten-Gating als Wrapper um /fachpersonen~~ → **entfällt
   ersatzlos** (Aufhebung der Free/Pro-Zweiteilung, Auftrag David
   7.6.2026); eine spätere Monetarisierung bekäme einen neuen,
   funktionsbezogenen Zuschnitt (STRATEGIE-PLATTFORM, Gate G1).
4. **Schlichtungsgesuch:** offene Verifikationen (kantonale §§ GOG/EG ZPO/
   GGR, PLZ 4001/4051, Art.-135-Randtitel) — in der UI offengelegt.
5. Kleineres: Detailseiten-Titel (calculators.ts) an neue Katalog-Titel
   angleichen? · Datepicker-Pfeiltasten (A11y-Kür) · Markenschriften auch
   für Vorlagen-PDFs · ggf. sichtbare Rechtsgebiet-Zwischentitel in den
   Untergruppen.
6. ~~Verschlankung Stufe 2~~ → **erledigt 5.6.2026** (generischer Rahmen
   in components/vorlagen/wizard.tsx, s. oben). Optional verbleibend:
   Form-Gate-Sektion (brass-Box mit Checkliste) als vierte geteilte
   Komponente — Texte sind je Vorlage fachlich verschieden, daher bewusst
   zurückgestellt.

## Backlog (bewusst NICHT gerendert)

Aufnahme nur bei klar regelbasiertem, deterministischem Umfang — sonst
Widerspruch zu «feste Rechenregeln, keine Schätzung»: Konsumkredit-Widerruf
(Anwendungsbereich klären) · Schadenersatz/Genugtuung · Unterhalt ·
Tagessatz · Mietzinsherabsetzung · Konkurrenzverbot (alle wertend/Ermessen).
