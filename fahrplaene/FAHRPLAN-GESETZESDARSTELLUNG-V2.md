# FAHRPLAN-GESETZESDARSTELLUNG-V2 — Nützlicher, fehlerfreier, farbiger
<!-- @lagebild name: Norm-Zeitmaschine · zweck: Frühere Gesetzes-Fassungen ansehen, Fassungs-Unterschiede, Linien-Konzept. -->

> **Eingefroren 5.10.2026:** Spezifikation, kein Bau-Stand; Fortschritts-Häkchen werden nicht mehr nachgeführt; Entscheidtabellen gelten unverändert.

**Heimat: ROADMAP-Schritte `W2·5g-ZEIT` und `W2·5i-HIST-ANSICHT`.**

## §0 · Zweck

Detailquelle zu `W2·5g-ZEIT`/`W2·5i-HIST-ANSICHT` — Gesetzesdarstellung nützlicher,
fehlerfreier, farbiger (VZG-Fussnoten, Kopf, BGE-Filter, Liniengliederung, Farben).
**NUR PLAN — Einbau erst mit Davids Go.**

**Recherche 10.7.2026 (Ultracode, 17 Agenten, strikt read-only; kritische Verifikationen durch Fable).
NUR PLAN — Einbau erst mit Davids Go.** Auftrag Davids (wörtlich, 10.7.): VZG-Fussnoten nicht verklinkt · Kopf nützlicher + Fussnoten-Anwahl · BGE-Abwahl + «wie lange zurück»-Filter in Rubrik Ansicht · Liniengliederung «funktioniert praktisch nicht» · Präambel-Fussnoten unverlinkt · mehr Farben · generell nützlicher/fehlerfreier.

Methode-Hinweis: Die Phase-1-Erhebung «Farbsystem» lieferte einen Stub (bekannte Input-Schwäche); das Farb-Design F5 wurde dennoch eigenständig am Code belegt und adversarial verifiziert. Alle übrigen Zahlen/file:line-Angaben sind doppelt geprüft (Design-Agent + Fable-Verifikation am Code, an Prod und live gegen Fedlex).

---

> Erledigt-/Stand-Abschnitte vom 14.8.2026 nach `archiv/FAHRPLAN-ERLEDIGT-ABSCHNITTE.md` verschoben (QS-PLAN-EINFACH).

## §8 · ROADMAP-Spec W2·5g-ZEIT (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «§6 Norm-Zeitmaschine + Fassungs-Diff» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

  «Art. X, wie er am Tag Y galt» (verknüpft mit dem Entscheiddatum) + **visueller Diff zweier
  Konsolidierungen**. Konsolidiert die heute verstreute Planung in **eine** getrackte Einheit: **M16**
  «Point-in-Time» (freigeschaltet nach AKN-XML-Phase 1) + **G-HIST** als Daten-Unterbau.
  **Warum `dep: []` trotz dieser Vorbedingungen korrekt ist (§14.5, keine Schönung):** weder
  AKN-XML-Phase 1 noch G-HIST sind eigene getrackte ROADMAP-Schritte mit `@meta`-ID — sie leben als
  Strang-Detailblock/`FAHRPLAN-NORMTEXT-DARSTELLUNG.md §Intake`. Ein `dep` auf sie ist maschinell
  nicht formulierbar; die Reihenfolge wird darum **vollständig vom Blocker `zeit-historik-poc`
  getragen**, dessen Registereintrag beide Vorbedingungen ausdrücklich mitführt. Sobald eine der
  beiden ein eigener Schritt wird, wandert sie hier in `dep`.
  **Feasibility ehrlich getrennt — die zwei Hälften sind sehr ungleich (§8):**
  🟢 **Metadaten-Timeline** («gilt seit …» / «was änderte sich wann») ist aus dem Bestand baubar und
  **läuft bereits** als G-HIST-UI (`public/normtext/historie/*.json` mit `giltSeit` + `ereignisse[]`
  aus Datum/Absatz/AS-ELI) — **hier nicht duplizieren**.
  🟠 **Der eigentliche Wunsch — echter Alt-Volltext plus Alt-vs-Neu-Wortdiff — BRAUCHT ZUSATZDATEN und
  ist GROSS:** auf Platte liegt je Norm **nur die geltende Fassung** (ein `stand`/`fassungsToken`/
  `bloecke` je Artikel); die Historie liefert Änderungs-**Metadaten, nicht den historischen Text**. Die
  Fähigkeit ist vorhanden (Fedlex `jolux:Consolidation`/`dateApplicability` via SPARQL — `fedlex-versionen-pruefen.ts`
  fragt das bereits ab), aber es braucht einen **neuen historischen Extraktions-Durchlauf** (N Konsolidierungen
  × 227 Erlasse) samt neuem Speicher- und §7-Provenienz-Modell. Der Diff selbst ist danach
  trivial-deterministisch (String-Diff, §2) — **der Aufwand steckt vollständig in der Daten-Beschaffung.**
  **Etappe Z0 (blocker-auflösend, vor jedem Bau):** POC historische Konsolidierungs-Extraktion +
  Speicher-/Provenienz-Entwurf + **Bau-GO je Kandidat durch David** (analog zum bestehenden
  G-HIST-Intake-Vorbehalt). POC-Rahmen und Kostenschätzung:
  `bibliothek/recherche/norm-zeitmaschine-poc.md`. Timeline-Detail `FAHRPLAN-NORMTEXT-DARSTELLUNG.md §Intake`.
  **DoD:** POC-Verdikt + David-GO **vor** Bau · `check:normtext`/`check:normtext-netz` ·
  `check:gegenpruefung` · §7 a–d je Fassung · golden byte-gleich. Trailer `Roadmap: W2·5g-ZEIT`.

---


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

8 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-GESETZESDARSTELLUNG-V2.md`](../archiv/fahrplaene/FAHRPLAN-GESETZESDARSTELLUNG-V2.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- §1 Befund-Kern (Root-Causes, alle belegt)
- §2 Massnahmen (alle Fable-verifiziert, Korrekturen eingearbeitet)
- §3 Entscheidungsliste — Davids Entscheide 10.7.2026 (Chat) eingearbeitet
- §4 Reihenfolge, Kollisionen, Prozess
- §5 Restposten (bewusst ausserhalb der 5 Massnahmen)
- §6 Norm-Zeitmaschine + Fassungs-Diff (`W2·5g-ZEIT`, Ideen-Intake 20.7.2026)
- §7 Fassungshistorie an-/abwählbar + Fassungs-Fundament (`W2·5i-HIST-ANSICHT`, §14-Intake 20.7.2026)
- §9 · ROADMAP-Spec-Nachzug (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)
