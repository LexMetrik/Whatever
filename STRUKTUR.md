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
## Session 17.9.2026 — Startseiten-Gruss pro Besuch + Sprachregionen (Buchung, 2 PRs)

- Gelandet: #899 Startseiten-Gruss wieder pro Besuch + Tageszeit (Inline-Skript vor Erstem Paint, CSP-Hash in `vercel.json`, StrictMode-/Suspense-fester Einmal-Verbrauch; `c18e65574`) · #900 88 neue Grüsse aus vier Sprachregionen, Rätoromanisch per Pledari Grond belegt (`e4189bed6`). Entscheid David 16.9.2026 «a» (Gruss pro Besuch) + Auftrag «mehr Grüsse aus allen Sprachregionen». Roadmap: `QS-PERF` (LCP-Messreihe, Suspense-Verdacht) / `QS-UI`.
- Lehren verankert (§17): Skill `perf` (Perf-Massnahme mit stiller Produkt-Rücknahme = wartet auf David, Wirkung vor Opfer nachmessen) · Skill `gegenpruefung` (Prüfer-Befund zu Render-/Lifecycle-Mechanismen braucht einen echten Repro-Test) · Skill `auftrag` Ziff. 6 (PR-Body-Trailer-Reihenfolge für Bau-Agenten explizit gemacht, landung Formregel 5). Details je Fundort.
- Nebenfunde gebucht (kein Bau, nur Steuer-Doku): `QS-PERF`-Checkliste (LCP-Ursache offen, CSP-Hash-Prüftiefe), `QS-BASIS` (Branch-Kollision `feat/qs-basis-hydrate`, `linkedom`-`window`-Leck), `QS-EFFIZIENZ` (`check:lizenzen` in node_modules-losen Worktrees).

## Session 15.9.2026 (4) — `W2·27-BUND-FERTIG` Weiterbau: vier Risikopfad-PRs + Gliederungs-Fix + Notizen-Prozess (7 PRs)

- Orchestrator Fable, Bau Opus/Sonnet, Prüfer stets anderes Modell. **Gelandet:** #888 `confidence.json`-Frische-Tor (`3202047ae`, GP af1d214a3; Neulauf 1567→1570 belegte die Staleness) · #889 Randtitel Phase-1-Schnitt (`d20e3f5d3`, GP 5a93ac060 — Bauer hatte nur eine der zwei ersetzten Stellen mit Rot-Probe belegt, nachgezogen 1fec26412) · #892 §8-Leerstellen «kein Text im Snapshot» (`674cc42ae`, GP dbe25de86) · #890 KKV-Label «Art. 126ztredecies» + amtlicher Anker `#ta126z` für `__N`-Token (GP zweimal: Fix `amtlicherAnker()` nach Prüfer-Befund «`#art_126_z` zeigt aufs erste Vorkommen», Live-Nachweis Playwright; Nachzug-Quittung a93c616c8; `682edb070`) · #894 Gliederung: Ast bleibt nach Artikel-Sprung offen, Klickziel 24 px, Marke 3-px-Strich + Fläche (`fb0ab0249`, Befund David) · #891 Session-Notizen-Datei (`9ffee0a04`, `plan:next` zeigt offene Posten).
- **Lehren verankert (§17):** Landekette liest nach Push den ALTEN mergeStateStatus (DIRTY) und lief nach drei BEHIND-Anläufen stumm aus (#892 brauchte 5 CI-Läufe wegen #893/#891/#895–#897) → `landung-kette.sh` fragt nach und meldet «halt»; Skill `landung` 3.4: GitHub kennt den union-Treiber nicht ⇒ nach jeder Risiko-Landung main lokal einmergen; Skill `auftrag` 6 g: Neuextraktion ⇒ `report:confidence --schreibe` + `datenhaltung:manifest` (das Frische-Tor aus #888 wurde in #890 prompt rot — Prüfer fand es, nicht der Bauer). Global: Kompaktierungs-Hook speist die Notizen-Datei wieder ein (Weisung David «mach das noch mit kompaktierungshook»).
- **Befund-Korrektur:** «19 Staatsverträge ohne Randtitel/Historie» = 17 + VBB/VG; Randtitel amtlich nicht vorhanden (kein Bug), LugÜ-Historie = Anhang-Fussnoten (M13), CMR ohne Datum; Rest ist eine «Erlass in Kraft seit»-Projektion (Spec liegt in der Übergabe). Nebenfund Prüfer #889 B3: `NormSnapshot.titel`-Zweig ist toter Code (Phase 2 rückbaubar).
- **Übergabe:** W2·27 bleibt `wip` (Restposten als Zeilen: Gegenstandslos-Signal, absatz-genau, `__N`-Deep-Link, Label-Drift-Tor, Umbenennungs-Lücke, Staatsverträge-Projektion); Chip «Weiterbau: W2·27-BUND-FERTIG Restposten». Wartet auf David: #867 Autopilot-Entwurf, Rückbau-Entscheid QS-EFFIZIENZ.

## Session 15.9.2026 (3) — Planung «Entstehung am Artikel Stufe 4» (3 PRs, kein Bau)

- Drei Live-Recherchen → `bibliothek/materialien/entstehung-2026-09-15/`; Leitprinzip 8; fünf
  Schritte `W2·6d-*` in `@queue`; K-7 + PDF-Kern; Fahrplan Materialien §12 (#893). Lehre: Host-Tausch
  versagt bei fga-`doc` < 2017. Offen `[D]`: Rangfolge, Personendaten.
- Nachlauf: #895 Hook-Hinweis PDF (Deckel riss), #896 dep-Chronik (Opus).
- Vorlauf ohne Karte §12: #888 Frische-Tor, #889 Randtitel, #891 Notizen-Datei.

## Session 15.9.2026 (2) — Dossier «Rekursive Selbstverbesserung» + `QS-BEWAEHRUNG` gebaut (6 PRs)

- Recherche-Auftrag David («recherchiere rekursive Selbstverbesserung bei Coding-Agenten, stell das unserem Prozess gegenüber»): Web-Recherche (Opus) + Repo-Karte (Sonnet) → Dossier `bibliothek/betrieb/rekursive-selbstverbesserung-gegenueberstellung-2026-09-15.md` (#881). Kernbefund: der §17-Kreislauf deckt die Schutzmechanismen der Literatur, hat aber kein Fitness-Signal für sich selbst — kein Tor und keine Regel wird je auf Bewährung gemessen.
- Davids Entscheid «ok einverstanden, auch vier, setz es direkt um» → Schritt `QS-BEWAEHRUNG` (#883), drei Bau-Agenten in eigenen Worktrees: **A** Tor-Bewährungs-Register + Auswerter `tor:bewaehrung` (219 importierte Belege, Einstufung 32 bewährt · 4 Rückbau-Kandidaten · 5 ungemessen · 46 jung) und Prozess-Kennzahlen `prozess:kennzahlen` mit Verlauf seit 1.7.2026 (#886); **B** `@wiedervorlage`-Marker an 49 Regeln (CLAUDE.md, rules, F1–F17) + Wächter `check:regel-wiedervorlage` in `gate` voll, fällig heute 0 (#885); **D** STANDARDS S1 gilt für `betrieb/`, Tor-Schleife erweitert, 9 Altdossiers nachgetragen (#884). Alle drei Tore je einmal rot gezeigt (§6.7).
- Nebenfund beim Dossier-Bau, an der Wurzel behoben: `check:bibliothek` S7.1 kannte `betrieb/` und `werkzeuge/` nicht — Tor, das für 19 Dossiers nicht scheitern konnte; Rot-Beweis, #882. Muster ist F2 (Tor prüft den gedachten statt den realen Bestand), kein neuer Register-Eintrag.
- Vorlauf ohne Karte (fremde Sessions 14./15.9.2026, §12): #873–#880 (Session-Ende-Buchung, Turso-Schreibvolumen, LCP-Diagnose, Landekette-Fix, PERF-REST, Chronik-Überführung) — Betreffzeilen sind die Karte, hier nicht erneut umgesetzt.
- Wartet auf David: Rückbau-Entscheid zu 4 Tor-Kandidaten und Hook-Log-Diff (`QS-EFFIZIENZ`-Zeile); Werkzeug-Befund `scripts/check-*.ts`-Deckel hat nach #885 noch 122 Bytes Luft.

## Session 14.9.2026 (2) — Jules-Suggestions gesichtet (76 → 3), Kanal abgeschaltet

- Proaktiven Jules-Kanal «Suggestions» am Code gesichtet (Opus, read-only, Repo-Stand `203a292e9`): **76 Vorschläge → 3 belastbar (~4 %)**, 0 gestartet; Kanal auf Davids Entscheid abgeschaltet (Wortlaut und Begründung: `fahrplaene/FAHRPLAN-FREMDAGENTEN.md` §6 D8, Messwerte §5, Datenpunkt zur Rückbau-Regel §3). Die drei Funde als Roadmap-Schritt **`QS-CODE-LFZ-GRENZE`** eingeordnet (Weisung: Jules-Vorschläge nie direkt starten, immer über den Roadmap-Eingang), Nebenbefund `NormText.tsx` 795/800 unter `W2·5m-LESER-V3` gebucht. Reiner Doku-PR, kein Code: PR #872 (`21846d038`, `269802a18`).
- **Werkzeug-Vorfall (§17, gehört in die nächste Lehren-Durchsicht):** der Arbeits-Worktree dieser Session wurde mitten im Lauf von aussen entfernt (`LexMetrik-wt-jules` samt Branch) — uncommittete Doku-Arbeit war verloren und musste neu geschrieben werden. Lehre: im Worktree sofort nach dem ersten Teilschritt committen und den Branch pushen, nicht erst am Ende (§0 Recovery, Skill `landung` Ziff. 5).

## Session 14.9.2026 — Phasen-Dekret «Bund zuerst» und die Phase-1-Welle (#846–#869)

**Rahmen.** Auftrag David 14.9.2026: drei Phasen (Bund → Kantone → mehr als Fedlex), Phase 1 wird
über die `@queue` abgearbeitet, «baue bis ich stop sage». Der Tag hat 17 PRs gelandet; sieben davon
liegen auf Risikopfaden und tragen je ein unabhängiges Gegenprüfungs-Verdikt.

**Risikopfad-Landungen mit Verdikt (Kurzform):**

- **#848** `confidence.json`-Neulauf (`90cb59fff`) — **bestanden.** Qualitätsbild 23.6. → 14.9.2026.
  Prüfer-Nebenfunde ins Fehlerbuch: `[N]`-Heuristik falsch-positiv (FIDLEV Anh. 9 führt amtlich
  «[1] Jahr»), auto-akzeptierte Tabellen-Verklebung VD-vd-106879 Art. 81 (0.95, nur weich), sowie
  §17: `erzeugt` wird von Hand gesetzt, kein Frische-Tor — darum alterte die Datei drei Monate.
- **#851** Fünf-Artefakte-Klammer (`6c4f9fa2f`) — **bestanden.** Sidecar trägt `stand`/`fassungsToken`
  (228/228, davon 215 substanz-byte-gleich = die Marke ist reproduziert, nicht behauptet);
  KKV-Token `126_z__2` als Quell-Effekt geklärt. Nebenfunde: `quelleUrl` zeigt auf einen amtlich
  nicht existierenden Anker (generisch für jeden `__N`-Token), KKV-Label wäre aus dem `<sup>`
  ableitbar, `__N`-Zählung in zwei Extraktoren über verschiedene Regex-Mengen.
- **#852** W2·22 Z6a Suffix-Grammatik (`4c38d316b`) — **bestanden.** 13 Stellen in 9 Bundeserlassen.
  Nebenfunde: 12. Handkopie der Suffix-Reihe in `KantonNormText.tsx:49`; die Kommentar-Zahl «vier
  Konsumenten» war falsch (sechs).
- **#856** W2·22 Z6c tote Anker (`40f2c2967`) — **Gegenprüfung hat den ersten Stand widerlegt**,
  sechs Befunde A–F, alle im PR gefixt; Endstand 39 tote Ziele von 10 276 prüfbaren.
  §17-Nebenfund: der Steuerdeckel auf `scripts/check-*.ts` ist durch Dateinamen-Wahl umgehbar.
- **#859** `aufgehoben` strukturell (`d16acf466`) — **bestanden mit Auflage.** 1 277/25 463,
  Golden byte-gleich, Wächter `check:leerstellen`. Auflage als offene ROADMAP-Zeile gebucht:
  §8-Anzeige der 98 Bund- und 481 Kanton-Leerstellen, die der Leser weiter als «aufgehoben» zeigt.
  Wortlaut-Regel des Prüfers: **nicht** «Anhänge ohne Signal» — das Signal ist da (KKV Anh. 1–3
  tragen den amtlichen Vermerk), das `<section>`-Schema erfasst der Artikel-Extraktor nicht.
- **#860** Kernerlasse EMRK/EÖBV/AVG (`6a67f01be`) — **mit Auflage bestanden**, Auflage im PR
  erfüllt. Status «entwurf», fachliche Abnahme bleibt bei David (§7). §17-Befund:
  `scripts/fedlex-eli-aufloesen.ts` liefert für 2 von 3 SR ein falsches ELI aus dem falschen
  Abstract (Repro-Kommando in der ROADMAP-Zeile).
- **#864** W2·20 V-7 Bund-Rest (`6fb37368b`) — **bestand im Kern, widerlegte die Vollständigkeit**;
  drei Befunde im PR nachgezogen. 197 belegte Stellen; darunter **97 «des Gesetzes»-Glieder, die
  bis zum 14.9.2026 FALSCHE Self-Links waren** (Link auf die Verordnung statt aufs Trägergesetz).

**§17-Lehren dieser Session:**

1. **«Reiner Daten-PR macht UI-Sonde rot» ist ein Ladezeit-Race, kein Test-Flake.** Die D16-Spec
   war 3/3 rot auf CI in #859 (reiner Daten-PR). Wurzel (#865, `a57e4698a`): die Reiterbeschriftung
   wächst beim Manifest-Nachladen zwischen `dragover` und `drop`, der Drop rechnete die Seite neu,
   statt die Marke zu vollziehen. Nebenwirkung: die Ablehnung von Jules-PR #855 stützt sich damit
   auf die vier Kommentar-Verfälschungen, nicht auf «Verhaltensänderung». Verankert als Zeile im
   Fehlerbuch-Kopf (FAHRPLAN-OFFENE-BEFUNDE §4); Tor existiert (`check:e2e-flake`).
2. **Kommentar-Bilanz zählen reicht nicht** (#862, `d61193dbe`): #855 baute die Summe nach einer
   Ablehnung exakt zurück (580 → 580) und verfälschte dabei trotzdem vier Zeilen. Regel 3b des
   Fremd-PR-Tors vergleicht seither die MULTIMENGE der getrimmten Kommentarzeilen.
3. **Ticket-Body nach `gh issue create` zurücklesen.** Ticket #858 trug nur die EN-Summary-Zeile —
   das `sed`-Kommando beim Ableiten aus der Vorlage war an Sonderzeichen gescheitert, die Datei war
   leer, `gh` nahm sie trotzdem. Jules konnte die Detailregeln nicht lesen; die Form-Abweichung in
   PR #861 ist insoweit **mein Fehler**, die Substanz-Ablehnung bleibt. Regel jetzt in
   `.claude/skills/landung/referenz-jules.md`, `docs/token-oekonomie/jules-ticket-vorlage.md` und
   FAHRPLAN-FREMDAGENTEN §5.
4. **Deckel an der Wurzel lösen, nicht kalibrieren** (#868, `892a6f0fb`): `erlassAnsicht.ts` wurde
   geschnitten (419 → 198 + neu `erlassWortlaut.ts` 267), der 420er-Deckel blieb unverändert scharf
   und gilt neu dem Paar. Offen bleibt `leserV3Modell.ts` 420/420 — dort ist der Schnitt laut
   Tor-Kommentar verhaltenstragend und braucht darum einen eigenen deklarierten Schritt (§6.3).

**Die übrigen Landungen (je eine Zeile):**

- **#846** (`a1dba46b5`) PLAN — Phasen-Dekret «Bund zuerst», FAHRPLAN-BUND-FERTIG mit Sollbild, `@queue` auf drei Phasen, VPS-Bestellung nach Phase 2.
- **#847** (`27e255f21`) PLAN — W2·20-Prosa nachgezogen (V-1–V-4 gebaut), Abhängigkeit W2·22 → W2·20 aufgelöst.
- **#853** (`e8ae590d9`) PLAN — Sollbild-Fragen entschieden: FR/IT nach Phase 1, Zukunftsfassungen-Hinweis in Phase 1, Randtitel = `struktur.marginalie`.
- **#854** (`7b0338916`) Leser — Nachbar-Artikel-Pfeile im Artikelkopf, Rohdaten-Link je Erlass. Entscheid: **kein `fassungsToken` im Zeiger** (§7 d verlangt Drift-Erkennung, keinen Hash-Abdruck). Kontrast-Falle `ink-400` (3,29:1) an den Pfeilen, vom a11y-Lauf gefangen, Vitest-Sonde eine Ebene tiefer verankert.
- **#862** (`d61193dbe`) Prüfstrasse — Fremd-PR-Tor Regel 3b (siehe §17-Lehre 2).
- **#863** (`7f5aa592e`) Leser — Zukunftsfassungen-Hinweis im Leserkopf («ab \<Datum\> gilt eine neue Fassung», amtlicher Link); 62 Erlasse, 93 künftige Inkrafttreten.
- **#865** (`a57e4698a`) E2E — D16-Wurzel behoben (siehe §17-Lehre 1).
- **#866** (`2535428ce`) PLAN — Konzept Einzelartikel-Ansicht (Auftrag David 14.9.2026), FAHRPLAN-LESER-V3 Kap. 15.
- **#868** (`892a6f0fb`) Leser — `erlassAnsicht.ts`-Deckel an der Wurzel gelöst (siehe §17-Lehre 4).
- **#869** Leser — Einzelartikel-Ansicht E1 + E2: Umschalter, Blättern, Dossier-Blöcke Historie/Verweise/Materialien/Werkzeuge. Rechtsprechung-Block im Artikel-Dossier bewusst hinter M3 / `QS-KORPUS`, E3 (Druck/Export) offen.

**Fremdagenten-Bilanz 14.9.2026:** drei Tickets (#849, #850, #858), drei Ablehnungen (#855, #857,
#861). Muster: **Jules generiert, statt zu verschieben.** Rückbau-Schwelle §3 zu prüfen;
Neuanlauf-Tickets gehören in die nächste Session. Messreihe: FAHRPLAN-FREMDAGENTEN §5.

**Wartet auf David:** fachliche Abnahme EMRK/EÖBV/AVG (Status «entwurf», Zeitsperre 1.12.2026) ·
PR #867 «ENTWURF (Autopilot) — retro:17-Vorschläge vom 14.9.2026»: Übernahme nur durch
David-/Session-Entscheid, sonst schliessen.

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
Ziff. 4b): Rollen-/Selektor-Wechsel wirkt repo-weit — alle Sonden greppen, R8-Sweep bei
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
