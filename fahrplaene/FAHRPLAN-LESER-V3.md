# FAHRPLAN-LESER-V3 — Gesetz-Leser V3 (Hülle neu, Kern unangetastet)

Endfassung 16.8.2026 nach Council-Review. Grundlage: Auftrag David 16.8.2026 (19 Positionen),
Ist-Inventar (main @ d6faa05c5), Referenz-/HIG-Recherche, Standausweis-Prüfung, Council-Antworten
A–E + R1–R3 + Advocatus, Council-Verdikt (Option III Hybrid, 14 Plan-Änderungen).
Entwurfsfassung liegt im Scratchpad (`04-plan-leser-v3.md`) und ist damit **abgelöst**.

> Roadmap-Zeiger: Dach-Schritt `W2·5m-LESER-V3` (ROADMAP.md, `fahrplan:` verlinkt). **Status 15.9.2026: `ready`, kein Blocker** — Davids Go (`david-go-leser-v3`) ist am 16.8.2026 erteilt und die Sperre damit erledigt; H1–H5 und S1–S4 sind vollzogen. Offen sind nur noch Deckel-/Schnitt-Posten, Einzelartikel E3 samt Rechtsprechungs-Block und der Fassungs-Diff-Tab (an M16 gekoppelt).

---

## Für David — Kurzfassung in Alltagssprache

**Was wir machen.** Der Gesetzestext selbst (Wortlaut, Fussnoten, Stand, Quelle) wird **nicht
angefasst**, neu gebaut wird nur das Drumherum — und zwar **neben** dem Alten: per Adresszusatz
`?leser=v3` schaltest du um und vergleichst. Erst auf dein «so ist es besser» wird umgestellt.

| Etappe | Du siehst … |
|---|---|
| **V-0** | **zuerst gar keine Software, sondern einen Klick-Prototyp** mit echtem StPO-Text in zwei Fassungen (mit und ohne «Ansicht»-Menü) — du klickst dich durch und sagst, welche gebaut wird. |
| H1 | eine aufgeräumte Kopfzeile (Ort · Artikel · ein Menü) und eine Seitenleiste mit **einem** Feld, in das du entweder ein Suchwort oder «Art. 429» tippst. |
| H2 | Suchtreffer in der Reihenfolge des Gesetzes statt kreuz und quer, gruppiert je Artikel — und das Schliessen der Suche wirft dich nicht mehr im Gesetz herum. |
| H3 | ein eigenes Fenster für Rechtsprechung mit Trefferzahl, statt Entscheid-Zeilen unter jedem Artikel. |
| H4/H5 | dasselbe wie H3, aber ohne Adresszusatz — die neue Ansicht ist ab jetzt die normale; danach verschwindet der alte Code (der eigentliche Aufräum-Gewinn). |
| S1 | den Schalter «Änderungsvermerke» wirkt endlich vollständig: bei «aus» bleibt keine Spur mehr im Lesetext. |
| S2 | den Gesetzestext in neuer Schriftgrösse und neuem Zeilenmass — und gleichmässige Abstände zwischen Artikeln, egal was ein-/ausgeblendet ist. |
| S3 | einen aufgeräumten Erlass-Kopf: Fakten, Stand, Warnung, Aktionen sauber getrennt und in verständlicher Sprache. |
| **E1–E3** *(NEU, Konzept 14.9.2026 — Kap. 15, **wartet auf deine Freigabe**)* | eine **Ansichtsoption**: entweder das ganze Gesetz wie bisher, oder **nur den einzelnen Artikel** — dann mit Blätter-Pfeilen und mehr Informationen in Blöcken darunter. Drei Fragen dazu stehen in Kap. 15.8. |

**Reihenfolge und erster Anblick.** V-0 (Prototyp) → H1 → H2 → H3 → H4 (Umstellung) → H5
(Löschung); die kleinen S-Etappen laufen dazwischen, sobald du die zugehörige Frage beantwortet
hast. Auf der echten Seite siehst du Neues ab dem **ersten** gelandeten PR (H1) über
`?leser=v3` — ohne diesen Zusatz sieht jeder andere exakt das Heutige; kein Zwischenzustand
geht je live.

**Zwei Vorarbeiten.** (1) Ein bekannter Darstellungsfehler wird zuerst repariert: manche
Farbflächen erscheinen heute unsichtbar, weil eine Schreibweise im Baukasten keine Regel erzeugt
(`DESIGN-D0`) — darauf lässt sich nichts Schönes bauen. (2) Gemessen wird ab jetzt **dein**
Aufwand: drei Aufgaben (Art. 429 aufschlagen · Entscheide dazu sehen · Stand und Warnung
erkennen) in **Klicks und Sekunden vorher/nachher**, als Tabelle in jedem Kontaktbogen —
«einfacher» heisst damit weniger Klicks, nicht weniger Codezeilen.

**Was du entscheiden musst** (Details Kap. 9; jede Etappe wartet auf ihre Frage):

| Frage | Dann sieht der Nutzer … | Empfehlung |
|---|---|---|
| F1 Den dritten Historie-Modus «Chronologie» streichen? | … nur noch «Änderungsvermerke: an/aus» statt drei Wahlmöglichkeiten für dieselbe Information. | **Ja** |
| F2 Den Schalter «Verweise» streichen? | … keinen Unterschied — der Schalter wirkt heute nur auf eine gepunktete Linie unter Querverweisen. **KORREKTUR S1-Nachzug 17.8.2026 (Ä25, §7):** der Satzteil «die erst beim Darüberfahren mit der Maus erscheint» war FALSCH — die Linie stand dauerhaft da. Der Entscheid «Ja» bleibt richtig (die Linie ist Zierde, nicht Funktion), aber er nahm dem Nutzer mehr weg als beschrieben. | **Ja** |
| F3 Schriftbild-Variante V1 oder V2? | … bei V1 grössere, luftigere Zeilen (19 px, kürzere Zeilen); bei V2 ein kompakteres, amtsnäheres Bild (17 px). Du entscheidest **nach** dem Bildvergleich. | **V1** |
| F4 Entscheide unter dem Artikel nur noch als Zähler («14 Entscheide») statt als Zeilen? | … einen ruhigen Gesetzestext; die Entscheide stehen einen Klick entfernt im Seitenfenster, keiner geht verloren. | **Ja** |
| F5 Standausweis-Wortlaut ändern? | … statt «geltend geprüft am 14.08.2026» neu «gegen Fedlex-Konsolidierung geprüft am 14.08.2026» plus einen Klartext-Satz, wenn Fedlex einer geltenden Änderung hinterherhinkt. | **Ja** |
| F6 Blätter-Pfeile zum nächsten Artikel? | … einen zusätzlichen Knopf — mehr Bedienung, nicht weniger. | **Nein, später** |
| F7 Kopfzeile **mit** «Ansicht»-Menü (A) oder **ohne** Menü (B, Einstellungen wandern ins Seitenfenster)? | … bei A ein Menü rechts oben wie heute; bei B eine Kopfzeile ganz ohne Menü — die Schalter liegen im Seitenfenster unter «Anzeige». **Du entscheidest am Prototyp**, nicht am Text. | **B** — aber mit Einschränkung, siehe Kap. 9 |

**Preis, ehrlich.** Rund **dreizehn** automatische Prüfungen müssen neu geschrieben werden (elf
für Bedienung und Layout, zwei für den Gesetzestext). Zwei Oberflächen bestehen im Umbaufenster
nebeneinander — **hart gedeckelt auf fünf PRs**, sonst Abbruch-Review statt Verlängerung.

**Was garantiert unangetastet bleibt.** Amtlicher Wortlaut, Fussnoten-Substanz, Stand- und
Quellenangaben, Rechenlogik, Datenprüfungen gegen Fedlex. Kein blosser Vorsatz: die Tore, die
sie bewachen (`golden`, `check:normtext`, `check:golden-normtext`, `check:fedlex-versionen`),
laufen bei **jedem** PR und liegen ausserhalb von allem, was hier gebaut wird.

---

## 1 · Zweck, Leitbild und die Grenze Hülle/Kern

1. Anspruch (David 16.8.): bestes und schönstes Gesetzes-Leseprodukt; Massstab sind die acht
   Apple-HIG-Prinzipien in der Fassung vom 8.6.2026 — **Purpose · Agency · Responsibility ·
   Familiarity · Flexibility · Simplicity · Craft · Delight**. Andere Begriffe (Deference,
   Clarity, Consistency, Feedback, Direct Manipulation, Depth) sind Apples **alte**
   iOS-7-Leitmotive und werden in diesem Fahrplan **nicht** verwendet (Council C/E).
2. **Unantastbar:** amtlicher Wortlaut · Fussnoten-Substanz · Stand/Quelle · Golden byte-gleich ·
   Rechtslogik (CLAUDE.md §1, §5, §7).
3. **Grenze Hülle/Kern — scharf gezogen** (Council B, Verdikt-Änderung 11):
   - *Hülle* (neu baubar): Kopfzeile, Seitenleiste, Suche-Bedienung, Menüs, Panels,
     Layout-Gerüst, Pane-Rahmen.
   - *Kern* (tor-gesichert): `normtext/ArtikelBody.tsx` (926 Z.), `parts/ArtikelLeser.tsx`
     (679 Z.), Datenlade- und Drift-Logik.
   - **Kern-Dateien werden ausschliesslich berührt durch (a) Tailwind-Token-Änderungen und
     (b) die Beiwerk-Zone in S2. Jede weitere Kern-Zeile ist eine deklarierte Ausnahme mit
     schriftlicher Begründung im PR** — nicht «unterwegs mitgemacht».
4. **Fokus Bund** (`/gesetze/bund/<SR>`); Kantons-Erlasse laufen durch dieselbe Fassade
   (`GesetzLeser.tsx` liest `ebene` aus der Route). Jede H-Etappe wird deshalb gegen **einen
   Bund- und einen Kantons-Erlass** unter Flag geprüft (Verdikt-Änderung 14).
5. **Split-View ist Pflicht-Dimension.** Sie ist heute nicht «versehentlich eingewoben»,
   sondern zu rund einem Drittel echte Zuständigkeit (Kap. 2) — der Fahrplan trennt beides.
6. Fachbegriffe (Erstnennung): *Hülle/Kern* wie oben · *Tor/Gate* = automatische Prüfung, die
   den Merge blockiert · *CLS* = sichtbares Nachspringen des Layouts · *Flag* = ein Schalter im
   Code, der eine neue Version nur für den zeigt, der sie ausdrücklich anfordert · *Fassade* =
   eine winzige Datei, die nur entscheidet, welche grosse Komponente geladen wird · *e2e-Test* =
   Prüfung, die einen echten Browser fernsteuert · *N-Test* = e2e-Test, der die Treue des
   Gesetzestexts am fertigen Bildschirm prüft · *B-Test* = e2e-Test für Bedienung und Layout ·
   *axe* = automatische Barrierefreiheits-Prüfung · *Disclosure* = ein Knopf, der einen Bereich
   auf-/zuklappt (im Gegensatz zu einem Menü mit Pfeiltasten-Bedienung).

---

## 6 · Vorarbeiten und Vorprobe — bevor irgendetwas gebaut wird

### V-0 · Klick-Prototyp (David entscheidet am Objekt, nicht am Text)

Statischer HTML-Prototyp, **kein Produkt-Code**, kein Build-Eingriff.
Ablage: `docs/ux-audit-2026-07/reader/leser-v3-prototyp/` (Ordner-Präzedenz:
`…/reader/linien-rueckbau-2026-08-16`).

| Merkmal | Vorgabe |
|---|---|
| Inhalt | echter StPO-Wortlaut aus dem Umfeld von **Art. 429** (aus dem Snapshot kopiert, unverändert) |
| Breiten | H (390) · D (1440) · S (720 = Pane) — je eine Datei oder ein Breiten-Umschalter |
| anklickbar | Such-/Sprungfeld (Eingabe «Art. 429» springt) · Gliederung auf/zu · Panel öffnen/schliessen |
| **Variante A** | Kopf **mit** «Ansicht ▾» und drei Schaltern (Fussnoten · Änderungsvermerke · Rechtsprechung im Text) |
| **Variante B** | Kopf **ohne** Menü — Schalter liegen im Panel-Reiter «Anzeige» |
| Ergebnis | **F7** (Kap. 9) entschieden; erst danach wird `LeserKopf` in H1 gebaut |
| HIG | **Craft** — «Experiment and iterate: früh prototypen, verwerfen, was nicht trägt» (02b Ziff. 7) |

### V-D0 · Vorbedingung DESIGN-D0 (eigener kleiner PR, **vor** H1)

`DESIGN-D0` (ROADMAP.md:283): Tailwind-Klassen mit Deckkraft-Zusatz (`bg-brass-100/70` u. ä.)
erzeugen **keine CSS-Regel** und rendern unsichtbar (belegt LM-156, unsichtbare Aktiv-Zeile der
Gesetzes-Gliederung, PR #472) — auf diesem Fundament setzte eine neue Hülle ihre Zustandsflächen
blind. Deshalb Repo-weiter Sweep + Wurzel-Fix in `tailwind.config.js` + Sichtprüfung als
**eigener PR vor H1**. **`DESIGN-D8a`** (ROADMAP.md:286) wird mitgezogen, weil der
Entscheid-Leser der Split-View-Partner ist und sonst zwei Farbwelten im selben Bild stehen.

### V-1 bis V-3 · Fassaden-Vorprobe

Ohne Produkt-Code zu belegen: die 8-Zeilen-Fassade trägt als Schaltpunkt für Einzelansicht
**und** beide Panes. Aufbau: Fassade liest Flag → `GesetzLeserInhalt` (Ist) oder
`GesetzLeserV3` (zunächst **leerer** Rahmen, der `ArtikelLeser` und die bestehenden Hooks
importiert); dazu das Playwright-Flag-Projekt.

| Schritt | Prüfung | Erwartung |
|---|---|---|
| **V-1 Nullprobe zuerst** | Flag **aus**: `bash scripts/gate.sh voll` + alle 41 Leser-/Gesetze-e2e + `golden:vergleich` + `split-view-a34` | **alles unverändert grün.** Rot hier ⇒ der Defekt liegt auf `main`, nicht am Vorhaben — Diagnose stoppt, bevor irgendetwas dem Umbau zugeschrieben wird |
| **V-2 Tor kann scheitern (§6.7)** | Flag **an**, drittes Playwright-Projekt `leser-v3` neben `schwer`/`chromium` (`playwright.config.ts:118,123`): dieselben 8 N-Tests gegen den V3-Rahmen | **mindestens einer muss zuerst ROT sein** (leerer Rahmen), dann grün, sobald `ArtikelLeser` eingehängt ist. Ohne diesen Rot-Beweis ist das Flag-Projekt ein Tor, das nicht scheitern kann — dann ist die gesamte Paritäts-Aussage wertlos |
| **V-3 Basisrate statt Schätzung** | Zwei Zahlen aus dem Repo-Verlauf holen: (a) wie viele «Rückbau-zuletzt»-Etappen bisheriger Fahrpläne tatsächlich gelandet sind (Streichquote), (b) wie viele Etappen bisherige Leser-Fahrpläne real pro Woche schafften | daran den **Deckel von 5 PRs kalibrieren**; weicht die Basisrate stark ab, wird der Deckel angepasst **bevor** gebaut wird, nicht während |

**Ohne V-0 (F7 entschieden), V-D0 (gelandet) und bestandene Vorprobe V-1…V-3 wird H1 nicht
begonnen.**

## 7 · Etappenplan — zwei Stränge

**Strang H** (Hülle, hinter Flag, sequenziell) · **Strang S** (geteilte Schicht, in place,
klein, je an eine David-Entscheidung gebunden; wirkt in **beiden** Hüllen).

**Regeln für jede Etappe:** 1 PR · sortenrein UI · Vorher/Nachher-Kontaktbogen ·
`gate voll` · `golden` byte-gleich · `check:linien-kanon` Teil A · `check:perf-budget` ·
axe-e2e · **N-e2e laufen im Flag-Projekt gegen V3 UND ohne Flag gegen den Ist-Stand** ·
**Split-View ist ein Test, kein Screenshot** (`leser-kopf-paritaet` prüft beide Panes) ·
**Kantons-Probe**: je ein Bund- und ein Kantons-Erlass unter Flag.

Dazu zwei Regeln, die den Erfolg **am Nutzer** und **am Bild** messen, nicht an Codezeilen:

| Regel | Inhalt |
|---|---|
| **NM · Nutzer-Massstab** (Abnahme-Kriterium **jeder** Etappe) | Drei Aufgaben, je Breite (H/D/S), **vorher und nachher** in **Klicks/Tastendrücken** und **Sekunden**: (1) «Art. 429 aufschlagen» · (2) «Entscheide zu Art. 429 sehen» · (3) «Stand und Warnung erkennen». Die Tabelle steht im Kontaktbogen. Eine Etappe, die keine der drei Zahlen senkt und keine als Preis für eine andere ausweist, ist **nicht abnahmefähig** — «einfacher» wird damit erstmals in Nutzer-Grössen belegt, nicht nur in Zeilen und DOM. |
| **Ästhetik-Review** (David 16.8.2026) | Vor dem Merge beurteilt ein SEPARATER Agent die Screens H/D/S in hell und dunkel gegen die Design-Grundlage und die acht HIG-Begriffe. Befunde gehen als Nachzug in dieselbe Etappe oder als benannte Position in die nächste — nie als «später mal». Grund für den eigenen Agenten: wer eine Fläche gebaut hat, sieht sie nicht mehr mit fremden Augen. |
| **Bund-Probe** (David 16.8.2026) | Je Etappe mindestens EIN Bundesgesetz + EINE Verordnung + EIN Staatsvertrag unter Flag prüfen — Kopf-Etikett, Übersichtsbox, Gliederung und Trefferliste müssen identisch aufgebaut sein. «Achte auf Einheitlichkeit, dass alle Verordnungen und Gesetze vom Bund gleich sind.» Abweichungen werden als Befund GEMELDET, nicht stillschweigend gefixt (ausser trivial). **Flip-Kriterium H4:** automatischer Sweep über alle Bundeserlasse auf identischen Aufbau. |
| **Drei Prüfer vor jedem Merge** (David 16.8.2026) | Vor jedem Merge laufen **drei unabhängige Prüfer**, gestartet vom Orchestrator, nie vom Bauenden. **(1) Bug-Check §9.** **(2) Ästhetik-Prüfer** — Screens H/D/S in hell und dunkel gegen die Design-Grundlage und die HIG-Begriffe; die Ästhetik-Checkliste **Ä1–Ä14 wird fortgeschrieben**, und jeder Punkt braucht eine **sinnvolle Umsetzung, nicht nur ein Häkchen** (präzisiert die Zeile «Ästhetik-Review» oben, ersetzt sie nicht — §5). **(3) Architektur- und Erlass-Neutralitäts-Prüfer**, zwingend mit einem **anderen Modell als dem bauenden**: derselbe Code trägt Bundesgesetz, Verordnung, Kantonserlass und Staatsvertrag **ohne Sonderpfade**, Unterschiede stammen ausschliesslich aus dem Datenmodell. Er prüft zusätzlich Abhängigkeitsrichtung (Hülle → Kern, nie umgekehrt), typisierten Vertrag, benannte Erweiterungspunkte, Dateigrösse gegen Verantwortung, Vitest je Komponente und die **Rückbaubarkeit der Ist-Hülle**. Probe je Etappe unter `?leser=v3` mit **je einem Erlass jeder Art**. |
| **PX · Pixelvergleich Textkörper** (zusätzliches Treue-Tor, ab H1) | Playwright `toHaveScreenshot()` auf die Region `.lc-leser article`, gleiche Artikel (StPO Art. 429, OR Art. 336c), gleiche Breite, V1 gegen V3. Der **Textkörper darf sich beim Hüllen-Umbau nicht um ein Pixel ändern** — das ist der schärfste verfügbare Beweis für «Kern unangetastet» und fängt, was DOM-Tests durchlassen (Abstände, Einzüge, Zeilenumbrüche). **Einzige zugelassene Ausnahme: S2**, wo die Baseline **einmalig und deklariert** neu gesetzt wird; die Neusetzung wird im PR begründet und der alte Screenshot als Vorher-Bild beigelegt (§6.3 — eine Baseline stillschweigend zu erneuern wäre ein Tor, das nicht scheitern kann). |

### Strang H

| E | Inhalt | Dateien (neu / entfernt / behalten) | Zeilenbilanz | B-Tests neu | Abnahme-Kriterium (ein Satz) | Aufwand |
|---|---|---|---|---|---|---|
| **H1** | **Fassaden-Flag + `LeserRahmenV3` + `LeserKopf` + Seitenleisten-Skelett mit Such-/Sprungfeld** — Pos. 1, 2, 4, 6, 7, 10, 15, 16; **sichtbar ab dem ersten PR** | neu: `GesetzLeserV3.tsx`, `LeserRahmenV3.tsx`, `LeserKopf.tsx`, `LeserSeitenleiste.tsx`, `SuchSprungFeld.tsx`, Playwright-Projekt `leser-v3` · entfernt: nichts (alter Baum eingefroren) · behalten: **alle Hooks unverändert importiert**, `ArtikelLeser`, `ArtikelBody`, `tocAutoZuklappen`, `leserSuche` | +900 / −0 | 4: `leser-kopf-paritaet` (beide Panes), `leser-v3-suche-sprung`, `leser-v3-seitenleiste-ordnung`, `leser-v3-umschalten` (FL-6) | Unter `?leser=v3` steht in beiden Panes derselbe Kopf, ein Feld sucht **und** springt, das Umschalten V1↔V3 hält die Leseposition — und ohne Flag ist der Ist-Stand bitgleich unverändert. | **L** |
| **H2** | **Suchverhalten** — Pos. 5 (UI-Seite), 14 | geändert: `TrefferListe`-Nachfolger in V3, Sprung-Offset gegen die Sticky-Höhe | +200 / −0 | 3: `leser-v3-treffer-reihenfolge`, `leser-v3-esc-ohne-sprung`, `leser-v3-treffer-mobil` | Treffer stehen in Erlass-Reihenfolge je Artikel gruppiert, und ✕/Esc bewegen den Scroll um 0 px. | **M** |
| **H2b** | **Ästhetik-Nachzug** — die Positionen des Ästhetik-Reviews H1, die H2 aus Deckelgründen liegen liess (s. Ä-Tabelle im Vollzugsvermerk H2). Inhalt: **Ä1** Leerzone unter der Krumen-Leiste schliessen + Krumen-Leiste zeigt im Split den falschen Artikel (**Wahrheitsproblem §7**, eine Ortsangabe aus EINER Scroll-Spy-Quelle) + **App-Seitenleiste im Leser eingeklappt starten** · **Ä5** Seitenleiste als drei gerahmte Kästen, hängendes «·», Durchschimmern unter dem klebenden Block · **Ä8** Hover auf lit. a füllt einen breiten beigen Block (Farbfläche ohne Bedeutung) · **Ä9** Schriftregler doppelt (App-Leiste UND Ansicht-Menü) — im Leser nur EINER · **Ä10** Handy-Sheet: «GLIEDERUNG» doppelt, Überlauf in der Übersicht, «···»-Popover öffnet links statt am Auslöser · **Ä14** Fokusring am Suchfeld doppelt/dick | **Ä1 berührt als einzige Position `src/components/layout/**`** (App-Seitenleiste, Krumen-Leiste) — bis hierher war die Fläche für alle H-Etappen TABU. Sie wird darum mit **deklarierter Whitelist** geöffnet: nur die Dateien, die den Seitenleisten-Default und die Krumen-Quelle tragen, jede mit Nennung im PR. Alles andere in `layout/` bleibt gesperrt. Übrige Positionen: `src/pages/gesetz-leser/v3/**`, `src/index.css` | +150 / −80 | keine neuen Tore nötig — die Positionen sind an den Ästhetik-Screens abzunehmen, nicht an Zusicherungen; Ausnahme **Ä1 Krumen-Wahrheit**: eigener Test, weil eine falsche Ortsangabe ein §7-Fehler ist und kein Geschmack | Die sechs Positionen sind **sinnvoll umgesetzt, nicht abgehakt** (Drei-Prüfer-Regel oben, Prüfer 2), die Krumen-Leiste nennt im Split denselben Artikel wie die Lesespalte, und ohne Flag ist der Ist-Stand unverändert. | **M** |
| **H3** ✅ | **Panel/Sheet für Rechtsprechung + Kontext** — Pos. 3, 12, 17; **Vorbedingung F4**. Enthält **Panel-Nachladen** (s. u.) | neu: `LeserPanel.tsx` (3 Reiter, vierter Filter «Sachgebiet» **vorgesehen**, Datenlogik dazu bleibt `W2·7-VZUI-SACHGEBIET`) · behalten: `bezuegeLaden`, `bezugAuswahl`, `bezugZeit`, `bezugPortion` (Datenlogik unverändert) | +450 / −0 | 4: `leser-v3-panel-facetten`, `leser-v3-panel-zaehler`, `leser-v3-kontext-cls`, `leser-v3-prerender-bezuege` | Jeder Entscheid, der heute unter einem Artikel erreichbar ist, ist über Zähler → Panel erreichbar, in beiden Panes, ohne dritte vertikale Fläche — und das prerenderte HTML trägt die Bezüge unverändert. *(Erfüllt; zwei Teile GEMESSEN ANDERS als vorgesehen: das prerenderte HTML trug nie Bezüge, und die 22-rem-SPALTE passt nicht in den 70-rem-Seitenrahmen — Rechnung, Ersatz und nötiger Entscheid im Vollzugsvermerk H3.)* | **L** |
| **H4** ✅ **VOLLZOGEN 18.8.2026** (Vermerk «H4 — DER FLIP» am Ende dieses Kapitels) | **Flip** — Flag-Default auf **an**; alte B-Tests gegen die alte Hülle löschen bzw. auf V3 umhängen | geändert: Fassade (Default), `leserFlag.ts`, `playwright.config.ts`, 14 Spec-Dateien | ±0 | **0 neu; 25 Bestands-Dateien berührt** — 10 umgehängt, 5 ganz + 9 fallweise auf die alte Hülle gepinnt, 2 Doppelungen gelöscht. Die Vorab-Schätzung «11 alte B-Tests» lag um mehr als das Doppelte zu tief; der Grund steht im Vermerk | Alle acht unveränderten N-Tests, `leser-kopf-paritaet`, CLS ≤ Ist-Stand und axe sind unter dem neuen Default grün, und David hat nach Kontaktbogen zugestimmt. | **M** |
| **H5** ✅ **VOLLZOGEN 21.8.2026** (Vermerk «Vollzugsvermerk H5» am Ende dieses Kapitels) | **Löschung der alten Hülle + Flag** — Pos. 9 | entfernt: alte Hüllen-Dateien ohne eingehende Referenz, `inhalt-kopfmeldung.tsx`, `data-such-bar`-Pfad, **`LeserAnsichtMenu.tsx` samt der darin definierten `OptSwitch`** (S1-Nachzug 17.8.2026, Architektur-Prüfer C3 — namentlich aufgeführt, weil `OptSwitch` die V1-KOPIE von `V3Switch` ist: gleiche Optik, gleiche ARIA-Mechanik, seit dem Ä27-Nachzug auch gleiche `hinweis`/`aria-describedby`-Logik. Sie darf H5 nicht überleben, sonst bleibt die Doppelung als zweite Wahrheit stehen, §5), `LeserMenuPaar`, `LeserRechtsprechungMenu`, Flag-Code, tote `data-linien`-Kommentare (`inhalt-zustand.tsx:365`, `leserOptionen.ts:9-15`) · ~~`components/kontext/KontextPanel.tsx` — und dann zwingend die Kante `v3/leserV3Modell` → `../inhalt-ansichten` → `KontextPanel` mitschneiden~~ **ABWEICHUNG im Vollzug: bleibt** — `EntscheidLeser.tsx`/`MaterialLeser.tsx` mounten sie eigenständig, Fehllöschung vermieden (Herleitung im Vollzugsvermerk). **NICHT auf die Liste** gehört `components/verzahnung/BezugFacettenWahl.tsx`: geteilter Baustein, den V3 im Panel selbst mountet (Korrektur H3-Nachzug 17.8.2026); ebenfalls **nicht** `gesetz-leser/berechnungen.ts` mit `bieteAenderungsvermerkeSchalter` — geteilte Quelle, die V1 UND V3 tragen (D1, H3-Nachzug 17.8.2026) · dazu die dann leere `v3/GesetzLeserV3.tsx`-Naht (in `GesetzLeser.tsx` aufgegangen) · `helpers/panelOeffnen.ts` — Fahrplan-Zeile war ungenau, s. Vollzugsvermerk | **−5 439 / +495** (Leser-Scope, gemessen nach Rebase auf `origin/main`/#559) | 0 neu | Jede gelöschte Datei hat den Nichttrage-Nachweis **vor** der Löschung, alle Tore sind grün bei byte-gleichem Golden, und im Repo existiert kein Flag-Code mehr. | **M** |

### Strang S (in place, wirkt in beiden Hüllen)

| E | Inhalt | Vorbedingung | Tests | Abnahme-Kriterium | Aufwand |
|---|---|---|---|---|---|
| **S1** ✅ **gebaut 17.8.2026** (PR #547, `2538dd356`) | Optionen-Rückbau: Historie zweiwertig, «Fassung»-Overline an denselben Schalter, «Verweise» streichen, Migration alter Werte (Pos. 8) | **F1 + F2 schriftlich «ja»** | **2 N neu**: `hist-ansicht-w25i`, `gesetze-historie-badge`; `leser-optionen` bleibt grün; Vitest-Migration | «Änderungsvermerke: aus» lässt keine Historie-Spur im Lesekörper zurück, und der DOM bleibt vollständig. | **S** |
| **S2** ✅ **gebaut 17.8.2026** (Vollzugsvermerk unten) | Artikel-Raster (Beiwerk-Zone) + Typografie-Tokens (Pos. 13, 19) | **F3 entschieden 17.8.2026: V2 + Fussnote hochgestellt** (Kap. 8) | 2: `leser-lesemass` (rein V3) + `leser-breite-a37` **teilweise** — **korrigierte Zuordnung 18.8.2026** (H4-Integration): `leser-breite-a37` ist **keine** V3-Spec. Zwei ihrer drei Fälle (Zitat-Link-Flucht, H-Overflow 390–1920) gelten hüllenneutral und laufen in beiden Projekten; der dritte, das **Spaltenmass**, misst die **784-px-Zelle des Zwei-Spalten-Layouts der ALTEN Hülle** und trägt darum seit H4 einen projekt-abhängigen `test.skip` (`nichtIstHuelle`, Datei in `V1_GEMISCHT`). Als S2-Nachweis zählt von dieser Datei also nur die hüllenneutrale Hälfte. | Der Satzspiegel entspricht der von David gewählten Variante (V2, gemessen 17 px / lh 1.55). — **Der erste Halbsatz «Umschalten aller drei Schalter erzeugt keinen Layout-Sprung» ist mit David-Entscheid A1 (5.7.2026) NICHT erfüllbar** und darum durch die verlustfreie Rundlauf-Zusage ersetzt; Herleitung und beide Zusagen im Vollzugsvermerk S2. | **M** |
| **S3** ✅ **gebaut 16.8.2026** (PR #540, `210ec466f`) | Erlass-Kopf + Standausweis-Wortlaut (Pos. 11, 18) | **F5 «ja»** | 3 Vitest + 1 e2e-Wortlaut; `aufhebung-kopf` bleibt grün | UI-Kopf und prerenderter SEO-Kopf tragen **denselben** neuen Wortlaut, und die Warnung erscheint genau bei den fünf betroffenen Erlassen. | **S/M** |
| **S4** ✅ | Sortierung der Suchtreffer auf Erlass-Reihenfolge — **erledigt 16.8.2026 mit H2** (PR #539, `19a989f93`). **Begriffskollision aufgelöst 15.9.2026 (§5):** die ROADMAP führte unter derselben Kennung eine «Kantons-Probe»; diese Bedeutung ist stillgelegt (der Nachweis liegt im H4-Kontaktbogen Ziff. 7), **S4 ist ab jetzt nur die Sortierung** (deklarierte Verhaltensänderung, wirkt in beiden Hüllen) | keine | Vitest an der Sortierfunktion; `leser-r1-r2`, `leser-suche-vertrag-b8` bleiben grün | Die Sortierfunktion liefert Dokumentreihenfolge als Primärschlüssel, bewiesen ohne Browser. | **S** |

### Panel-Nachladen (H3) — Startlast senken, ohne SEO zu verlieren

| Punkt | Regel |
|---|---|
| Was | Bezugs- und Kontext-Daten werden im Browser **erst beim Öffnen des Panels** geladen, nicht beim Seitenaufruf. Heute rendert `BezuegeZeile` unter **jedem** Artikel und zieht die Daten unbedingt (`bezuegeLaden.ts`). |
| Beweis | Die Ersparnis wird als **Zahl aus `check:perf-budget`** ausgewiesen (Daten-Nutzlast gzip, das Tor führt die Bezugs-Shards bereits als eigene Budget-Zeile) — vorher/nachher im PR, keine Behauptung. |
| **SEO-Prüfpunkt (harte Grenze)** | Der **Prerender behält die Bezüge serverseitig im HTML** — nur der Browser lädt nach. Grund: `scripts/prerender.ts` schreibt das SEO-HTML aus Manifesten und Snapshots, unabhängig von der Hülle; würde das Nachladen dort durchschlagen, verlöre jede Erlass-Seite ihre Verzahnung für Suchmaschinen. |
| Wächter | Neuer Test `leser-v3-prerender-bezuege`: das **prerenderte** HTML einer Erlass-Seite enthält die Bezüge weiterhin (Vitest gegen die Prerender-Ausgabe bzw. e2e mit deaktiviertem JS), zusätzlich `check:seo-index` grün. Ohne diesen Test wird H3 nicht abgenommen. |

### Fenster-Deckel und Flip-Kriterien

| Regel |
|---|
| ~~**Höchstens 5 H-PRs bis einschliesslich H4.**~~ **AUFGEHOBEN 18.8.2026 — Entscheid David** (Chat, wörtlich «pr deckel aufgehoben wenn sinnvoll»; im Bau übermittelt über den H4-Integrationsauftrag). Der Deckel war ein Mengen-Riegel gegen stille Verlängerung; er hat seinen Zweck erfüllt (H1–H4 samt Nachzügen sind gebaut, gemessen und dokumentiert). Ab hier zählt nicht mehr die **Zahl** der PRs, sondern ob der einzelne PR sinnvoll ist. **Was ausdrücklich NICHT gestrichen ist:** der Gedanke des **Abbruch-Reviews** (Rückbau des Flags, Rückfall auf In-Place-Etappen). Er ist ab sofort **Empfehlung, kein Zwang** — wer merkt, dass die Etappen einander nachlaufen statt zu konvergieren, führt ihn durch, statt weiterzubauen; ausgelöst wird er künftig durch diese Beobachtung, nicht durch eine PR-Zahl. |
| **Flip-Kriterien für H4 (alle, nicht auswählbar):** die acht unveränderten N-Tests grün unter Flag · `leser-kopf-paritaet` grün · Pixelvergleich PX grün · Nutzer-Massstab NM in keiner der drei Aufgaben verschlechtert · CLS ≤ Ist-Stand · axe grün · Kantons-Probe grün · die drei bekannten Flaker (s. Kap. 14) mit Wurzel-Fix statt Timeout · David-Go nach Kontaktbogen. |
| **H5 spätestens einen PR nach H4.** Die Löschung ist keine optionale Aufräumetappe, sondern die Bedingung, unter der (III) überhaupt gewählt wurde. **Zwei Auflagen vor bzw. mit H5 (Auftrag David 18.8.2026, Chat; im Bau übermittelt über den H4-Integrationsauftrag):** (1) eine **fundierte Ästhetik-Prüfung an der LIVE-Seite** — nicht am Screenshot und nicht am Testlauf: der Flip hat V3 zum Grundzustand gemacht, geprüft wurde er bis hierher aber überwiegend an Messwerten und Bildbögen; (2) eine **Benennungs-Säuberung**: UI-Texte, `aria`-Namen und die «V3»-Suffixe in Code, Dateinamen und Selektoren. «V3» war der Name einer *Bau-Etappe*, nicht der einer Sache — sobald V1 fällt, ist «der Leser» wieder der Leser, und jedes verbliebene `v3` im Markup ist eine Zeitangabe, die im Produkt nichts zu suchen hat. **H5-BLOCKER bleiben die Deckungslücken** aus Kontaktbogen H4 **§7b** (`docs/ux-audit-2026-07/reader/leser-v3-h4/README.md`, Abschnitt «7b · H5-Auflage: die Deckungslücken, an einer Stelle»): H5 löscht keine Ist-Hüllen-Datei, solange dort eine Zeile ohne `leser-v3-*`-Gegenstück steht. |
| **Streich-Massstab für H5** (`bauschritt`/`aufraeumen.md` §3, Auftrag David 14.8.2026): Eine Zeile/Datei fällt nur, wenn der Nachweis des Nichttragens **vor** der Löschung steht — (a) keine eingehenden Verweise, (b) alle Tore grün und golden byte-gleich nach dem Entfernen, (c) bei Rechtslogik zusätzlich §1-Blick. «Beweis vor Löschung, nie löschen-und-schauen.» |

### Positions-Abdeckung 1–19

| Pos. | Verdikt | Etappe | Pos. | Verdikt | Etappe |
|---|---|---|---|---|---|
| 1 Kopfzeile | Neu | H1 | 11 Standausweis-Widerspruch | Umbauen (Wortlaut) | S3 |
| 2 Dropdown-Konzept | Umbauen | H1 | 12 Entscheide im Fliesstext | Umbauen | H3 |
| 3 Rechtsprechung → Panel | Neu | H3 | 13 gleichmässige Abstände | Neu | S2 |
| 4 ein Such-/Sprungfeld | Umbauen | H1 | 14 ✕ springt nicht mehr | Umbauen | H2 |
| 5 Trefferliste ordnen | Umbauen | H2 (UI) + S4 (Sortierung) | 15 «Zum Anfang» | Neu | H1 |
| 6 Split-View einheitlich | Neu | H1 | 16 Gliederung ganz auf/zu | Neu | H1 |
| 7 Tab-Titel bleibt | Umbauen | H1 (`EntscheidLeser.tsx:409`) | 17 Kontext-Panel überladen | Neu (Ort) | H3 |
| 8 Änderungshistorie | Umbauen + Weg | S1 | 18 Meta-Zeile Erlass-Kopf | Neu | S3 |
| 9 Code simplifizieren | Umbauen | H5 | 19 Typografie | Umbauen | S2 |
| 10 Übersichtsbox | Neu | H1 | | | |

**Nachtrag S3 — drei Ästhetik-Positionen aus der Gegenprüfung (16.8.2026, Urteil
7/10 «Merge ja mit Nachzug»). Bewusst NICHT in S3 gebaut:** sie betreffen
Typografie und Titel-Anatomie, also die Fläche, über die **F3/S2** am Bildbogen
entscheidet — sie jetzt einzeln zu setzen, nähme diesem Entscheid vorweg.

| # | Befund | Heimat |
|---|---|---|
| (a) | Die Titel-Reservierung hält zwei Zeilen (`min-h-titel-2z`, 2.35em). Bei einzeiligem Titel — der Regelfall bei kurzen Kürzeln — steht darunter sichtbarer Leerraum, seit S3 stärker wahrnehmbar, weil der Kopf sonst ruhig geworden ist. Die Reservierung selbst ist CLS-Pflicht (Font-Swap) und darf nicht ersatzlos fallen; zu prüfen ist eine metrisch angeglichene Fallback-Schrift, die mit weniger Reserve auskommt | **S2** |
| (b) | Die Stand-Zeile mischt Datumsformen: `Stand 01.04.2025` läuft in der Ziffern-Mono-Auszeichnung (`.num`), das Datum im Standausweis proportional — dieselbe Grösse, zwei Anmutungen in einem Satz | **S2** |
| (d) | Bei Staatsverträgen mit sehr langem Volltitel steht das Kürzel am Ende einer dreizeiligen `<h1>` und ist damit schlecht auffindbar, obwohl es die Kennung ist, nach der gesucht wird. Betrifft die Titel-Anatomie, nicht den Standausweis | ✅ **erledigt in H2b** — die Kennung steht VOR dem Titel, sobald er über 80 Zeichen lang ist (`erlassAnsicht.titelKennung`, rein und unit-geprüft; optionale Prop am geteilten Kopf, Vorgabe = S3-Zitierform, die Ist-Hülle setzt sie nicht). LugÜ: «LugÜ · Übereinkommen vom 30. Oktober 2007 …» |

**Pos. 8 im Klartext.** «Chronologie» entfällt; der Schalter heisst «Änderungsvermerke: an/aus»,
und bei «aus» verschwinden Marker, Apparat-Zeile **und** «Fassung»-Overline gemeinsam. §8 ist
gewahrt: der Normtext bleibt unberührt, alle Historie-Texte bleiben im DOM (über «an» samt
Ctrl+F wiederherstellbar), und die Historie-Zeile ist im Repo ausdrücklich als *abgeleitete
Metadaten, kein Wortlaut* geführt (`ArtikelLeser.tsx:603-604`, `data-such-meta`). Präzedenz:
David-Entscheid A1 vom 5.7.2026.

**Pos. 11/18 im Klartext.** Kein Software-Fehler — alle drei heutigen Anzeigen sind für sich
wahr, aber «geprüft am 14.08.2026» liest sich für Laien wie «alles aktuell», obwohl ein Passus
fehlt. Neu: Chip «gegen Fedlex-Konsolidierung geprüft am …» plus Klartext-Warnzeile nur bei
`nichtKonsolidiert` mit `dateEntryInForce ≤ heute`. **§5-Pflicht:** derselbe Wortlaut steht an
zwei Stellen (`ErlassLeserKopf.tsx:79`, `seo-detail.ts:269`) — beide im **selben** PR; zusätzlich
die Kommentar-Referenzen `index.css:867,909`.

---

## 9 · Entscheide F1–F6 — als harte Vorbedingungen

> **Entscheide David 16.8.2026 (Chat, «go, empfehlungen übernehmen, bau den prototyp»):** F1 ja · F2 ja · F4 ja · F5 ja · F6 nein · ~~**F3 = V1 (19 px)**~~ **← ABGELÖST, s. nächster Absatz** · F7 = A (Kopf mit «Ansicht ▾») · F8 = Panel-Randlasche behalten; **Regel David 16.8.: Schalter «Rechtsprechung im Text» aus ⇒ Zähler UND Randlasche weg** (Panel bleibt über «Ansicht ▾»/Tastatur erreichbar; H3) — entschieden am Prototyp V-0, David 16.8.2026 («V1, a, Lasche behalten — weiter mit H1») · Design-Grundlage D-A Regler ja · D-B Dunkelmodus behalten (14 Rollen) · D-C Serif behalten. Blocker `david-go-leser-v3` gelöst; Schritt auf wip.

> **Entscheid David 17.8.2026 (am Bildbogen `docs/ux-audit-2026-07/reader/leser-v3-s2/bogen.html`),
> Wortlaut «v2 gefällt mir besser aber fussnoten hochgestellt»:
> F3 = V2 «amtsnah kompakt» (17 px / lh 1.55) + Fussnotenmarke HOCHGESTELLT,
> ohne Klammern.** Dieser Entscheid **löst die F3-Empfehlung «V1» vom 16.8.2026
> ab** — sie war ausdrücklich unverbindlich «bis nach dem 18-Bilder-Vergleich»
> (Kap. 8), und der Vergleich hat jetzt stattgefunden. Die alte Zeile bleibt oben
> durchgestrichen stehen, damit die Reihenfolge der Entscheide nachvollziehbar
> bleibt. Gebaut in **S2**; Nachweise, Messwerte und die eine Abweichung von der
> V2-Spalte im Vollzugsvermerk S2 (Kap. 7).

> **H4-Ja David 17.8.2026 (Chat, wörtlich «ja und c, mach so») — der Umschalter
> wird umgelegt.** Damit ist das letzte offene Flip-Kriterium (Kap. 7,
> «David-Go nach Kontaktbogen») erfüllt: V3 ist der Standard-Leser, V1 bleibt bis
> H5 unter `?leser=v1` erreichbar. Im selben Satz entschieden ist **Ä60 = (c)**
> — der Leser-Rahmen wird breiter, statt den Kopf-Zähler zu opfern oder das
> Beiwerk-Blatt die Zeilenenden verdecken zu lassen. Der Flip ist im PR
> «H4-Vorbereitung II» gebaut; (c) baut ein eigener PR auf derselben Basis.
> *(Ablage abweichend vom Auftrag: der Auftrag nannte «Kap. 8» für Entscheide —
> Kap. 8 trägt die Typografie-Varianten, die Entscheide stehen hier in Kap. 9.
> Eingetragen wurde dort, wo die übrigen David-Entscheide stehen.)*

> **CLS-Fall `leser-r1-r2` (A9-DoD) — entschieden 18.8.2026 vom Orchestrator nach
> Vorlage an David mit drei Wegen; David hat nicht widersprochen, Stopp-Recht
> steht.** Der Fall war der **eine offen rote** des H4-Standes: @390 unter 6×
> CPU-Drossel mass er **CLS 0.0202 gegen Budget 0**, weil die Such-Zone beim
> Suchstart um 24 px wächst (44 → 68 px) und die Lesespalte schiebt.
> **Gewählt ist Weg 3:** Das **Verhalten bleibt** — die Zone wächst beim Tippen
> weiter, als bewusstes Feedback (B9-Regel «die Zonen-Höhe hängt am
> Such-Zustand»). Geändert wird allein die **Geste im Test**: `click()` +
> `pressSequentially` statt `fill()`, also so, wie ein Nutzer tippt. **Das Budget
> bleibt 0** für jeden Sprung ohne `hadRecentInput` — keine Schwelle angehoben,
> kein `skip`.
> *Warum das keine Lockerung ist:* `fill()` setzt den Wert programmatisch, der
> Browser sieht keine Nutzereingabe und flaggt den Folge-Shift
> `hadRecentInput = false`; die CLS-Definition schliesst eingabe-nahe
> Verschiebungen aber ausdrücklich aus. Der Test mass also einen Wert, **den kein
> Nutzer je erzeugen kann**. Die **Grösse** des Sprungs bleibt bewacht — sie hängt
> an `leser-v3-suchfeld-ueberall` (e), das die Zonen-Höhen 44/68 px festnagelt.
> Arbeitsteilung: (e) bewacht die Geometrie, A9-DoD die Metrik.
> *Verworfen:* **Weg 1** (24 px Höhe dauerhaft reservieren) — nimmt jedem Leser,
> der nie sucht, Lesehöhe genau dort, wo der klebende Block das ganze Chrome ist,
> und stürzt die Zusage von `leser-v3-suchfeld-ueberall` (e). **Weg 2** (zweite
> Zeile immer zeigen, mit wechselndem Inhalt) — verlangt eine neue inhaltliche
> Zusage (Standort-Angabe im Ruhezustand), also echtes Design, das nicht in einen
> Landungs-PR gehört.
> *Zahlen (18.8.2026, `vite preview` aus `dist/`, Chromium, BV @390, Drossel 6×):*
> `fill()` 0.0202 → rot · echt getippt input-frei 0.0016 → grün · Nullprobe alte
> Hülle `?leser=v1`, dieselbe Geste, n=3: 0.5519. Herleitung, Rot-Beweis und die
> beiden verworfenen Wege als Bauanleitung: Kontaktbogen H4 §7c/§8.
> **Stopp-Recht:** Will David stattdessen Weg 1 oder 2, öffnet das den Fall
> wieder — dann wird die Geste zurückgebaut und die Reserve gebaut.

> **Ä75 und Ä81 — entschieden 18.8.2026 vom Orchestrator, David hat Stopp-Recht.**
> Beide standen seit dem 17.8. als «wartet auf David» und blockierten den
> H4-Nachzug. Sie sind hier entschieden, weil beide **keine Geschmacksfragen**
> sind, sondern Richtigkeits- und Dopplungsfragen mit einer messbaren Antwort —
> und weil ein Nachzug, der auf zwei solche Antworten wartet, den Flip-Stand mit
> zwei bekannten Fehlern stehen lässt. **Provenienz: Orchestrator 18.8.2026, im
> Nachzug-Brief so vergeben; David kann jederzeit stoppen, dann wird
> zurückgebaut.**
>
> **Ä75 = «SR» nur am Bundeserlass.** «SR» heisst Systematische Rechtssammlung
> DES BUNDES. Über BS-640.100 und ZH-211.11 stand es trotzdem — das ist keine
> Beschriftungs-Ungenauigkeit, sondern eine **falsche Fundstellenangabe** an einem
> Rechtstext (§7/§1). Die kantonale Nummer steht darum nackt. **Kein
> Ersatzkürzel**, und das ist der eigentliche Entscheid: naheliegend wäre «BS
> 640.100» gewesen — und es wäre erfunden. Die kantonalen Sammlungen führen eigene
> Siglen, die **nicht** das Kantonskürzel sind (Basel-Stadt «SG», Zürich «LS»,
> Aargau «SAR», Bern «BSG»); ein aus `erlass.kanton` gebautes Kürzel sähe amtlich
> aus und wäre es nicht, und eine 26-Zeilen-Tabelle im Code wäre die hart kodierte
> Kantonsliste, die die Erlass-Neutralität ausschliesst. Eine Nummer ohne
> Sammlungs-Angabe ist unvollständig; eine Nummer mit der **falschen** Sammlung
> ist falsch. Die Sigle ins Datenmodell zu nehmen (Feld im Register, Verifikation
> je Kanton) ist ein eigener Schritt — H5/Korpus.
>
> **Ä81 = nur der Kopf warnt; der «Stand» im Steckbrief bleibt.** Gemessen stand
> die Konsolidierungs-Warnung an der StPO @1440 **zweimal gleichzeitig sichtbar**
> (Leiste und Erlass-Kopf). Die Arbeitsteilung, die die Box sich selbst gegeben
> hat, entscheidet die Frage: Kopf = *welcher Erlass, wie aktuell, wo die amtliche
> Fassung*; Box = *woher er kommt und wie er gebaut ist*. Eine offene
> Konsolidierung ist «wie aktuell» — also Kopf. Der «Stand» dagegen **bleibt** in
> der Box: er ist dort Teil der Datums-KETTE (Erlass vom → In Kraft seit → Stand),
> also der Chronologie, für die man einen Steckbrief überhaupt aufklappt — das ist
> Fedlex' «Beschluss/Inkrafttreten»-Block und eine bewusste, benannte Dopplung.

Keine Etappe startet ohne ihre Vorbedingung. Fehlt der Entscheid, wartet die Etappe — sie wird
**nicht** «auf Verdacht nach Empfehlung» gebaut (Council A/D: sonst liegt ein fertiger
Test-Rewrite vor, den David kippen könnte).

| # | Frage in Alltagssprache | Konsequenz «dann sieht der Nutzer …» | Empfehlung | Blockiert |
|---|---|---|---|---|
| **F1** | Heute gibt es drei Einstellungen dafür, wie Änderungsvermerke im Gesetzestext erscheinen (aus / bei den Fussnoten / als datierte Liste). Auf zwei reduzieren? | … nur noch «Änderungsvermerke: an/aus». Die datierte Liste entfällt; die Information selbst geht nicht verloren, sie steht dann bei den Fussnoten. | **Ja** — dritter Modus für dieselbe Information; er kommt als eigener Schritt zurück, falls Bedarf entsteht | **S1** |
| **F2** | Der Schalter «Verweise» soll weg. | … keinen Unterschied im Alltag: der Schalter wirkt heute nur auf eine gepunktete Linie unter Querverweisen. Farbe, Klickbarkeit und Ctrl+F bleiben in jedem Fall. **KORREKTUR S1-Nachzug 17.8.2026 (Ä25, §7):** «die ohnehin erst beim Darüberfahren mit der Maus erscheint» war FALSCH; die Linie stand im Ruhezustand. David hat also auf einer zu harmlosen Beschreibung entschieden. Der Entscheid wird NICHT eigenmächtig umgedeutet: er bleibt in Kraft (die Linie ist Zierde), und die Frage «soll die Linie im Ruhezustand überhaupt stehen?» ist als eigener Punkt Ä25 geführt — sie ist eine Design-Frage, keine Rückbau-Frage. | **Ja** | **S1** |
| **F3** | Zwei Schriftbilder für den Gesetzestext stehen zur Wahl. | … bei **V1** grössere Schrift und kürzere Zeilen (ruhiger, mehr Weissraum); bei **V2** ein kompakteres Bild, näher am amtlichen Fedlex-Aussehen (mehr Text pro Bildschirm). | ~~**V1**~~ ⇒ **ENTSCHIEDEN 17.8.2026: V2** + Fussnote hochgestellt (am Bildbogen; die V1-Empfehlung war bis zum Bildvergleich unverbindlich) | **S2** ✅ gebaut |
| **F4** | Unter jedem Artikel stehen heute scrollbare Zeilen mit Gerichtsentscheiden. Ersetzen durch eine leise Zeile «⚖ 14 Entscheide →», die ein Seitenfenster öffnet? | … einen ruhigen Gesetzestext ohne Entscheid-Zeilen; ein Klick auf den Zähler öffnet das Fenster mit allen Entscheiden samt Filtern. Kein Entscheid wird unerreichbar. | **Ja** | **H3** |
| **F5** | Der Standausweis im Erlass-Kopf soll neu formuliert werden. | … statt «geltend geprüft am 14.08.2026 (maschinell)» neu «gegen Fedlex-Konsolidierung geprüft am 14.08.2026 (maschinell)» — und dort, wo es zutrifft, den Klartextsatz «Fedlex hat eine seit 01.07.2025 geltende Änderung noch nicht in den Text eingearbeitet». Heute betrifft das fünf Erlasse. | **Ja, beides** — der Chip sagt, *was* geprüft wurde, die Warnzeile, *was trotzdem fehlt* | **S3** |
| **F6** | Blätter-Pfeile «voriger/nächster Artikel» aufnehmen? | … einen zusätzlichen Knopf im Kopf oder am Artikelfuss — bequem beim Durchlesen, aber ein Element mehr statt weniger. | **Nein, nicht in V3** — nach der Landung als eigener kleiner Schritt bewerten | — |
| **F7** | Soll die Kopfzeile ein «Ansicht»-Menü haben (**A**) oder gar keines (**B**, Schalter wandern in den Panel-Reiter «Anzeige»)? Du entscheidest am **Klick-Prototyp** (V-0), nicht am Text. | … bei **A** rechts oben ein Menü wie heute, nur mit drei statt vier Schaltern. Bei **B** eine Kopfzeile aus vier Elementen ohne jedes Menü; wer etwas ein-/ausblenden will, öffnet das Seitenfenster. B ist die ruhigere Kopfzeile, kostet aber einen Klick mehr für jede Umschaltung — genau das misst der Nutzer-Massstab (NM) am Prototyp. | **B — mit einer Einschränkung** (nächster Absatz lesen) | **H1** (Kopf), **H3** (Reiter «Anzeige») |

**Zu F7, Variante B — geprüft und ehrlich berichtet.** Der Auftrag umschreibt Variante B mit
«Fussnoten immer an». Das ist mit der Präzedenz **nicht** vereinbar, und zwar nicht knapp:
Der G2b-Eintrag vom 4.7.2026 hält fest, es gebe «**EINE** Fussnoten-Bedienung: der
`data-fussnoten`-Options-Toggle», der frühere zweite Schalter sei **entfernt** worden; der
David-Entscheid **A1 vom 5.7.2026** regelt anschliessend, was «AUS» tut (verschwinden statt
dämpfen) — er **setzt einen AUS-Zustand voraus**. Beide stehen in
`DESIGN-REGLEMENT.md` §N-4c (U-KOPF-Nachtrag A1). Den Schalter ersatzlos zu streichen, hiesse einen
datierten David-Entscheid stillschweigend zu kassieren; das darf dieser Fahrplan nicht.

**Deshalb wird B in einer Fassung vorgeschlagen, die die Präzedenz wahrt:** Der Kopf verliert
sein Menü, **alle drei** Schalter — Fussnoten **eingeschlossen** — ziehen in den Panel-Reiter
«Anzeige». Die Bedienung bleibt damit vollständig erhalten (weiterhin genau **eine**
Fussnoten-Bedienung, nur an einem anderen Ort), nur der Kopf wird ruhig. Wer die Fussnoten
tatsächlich fest anschalten und den Schalter löschen will, braucht dafür einen **ausdrücklichen
neuen Entscheid Davids**, der A1/G2b aufhebt — der Prototyp V-0 zeigt beide Fassungen, damit
diese Frage am Bild und nicht am Text beantwortet wird.

---

## 14 · Verhältnis zu anderen offenen Roadmap-Schritten

> **Externe Referenzen (David 16.8.2026):** *legalviz.eu* (Maastricht Law & Tech, EU-Rechtsakte-Leser, React/Vite/Tailwind, GPLv3 — Code nicht übernehmbar, Ideen ja): ⌘K-Suche + Deep-Links und einklappbares Inhaltsverzeichnis (bereits im Plan), Rechtsprechung je Artikel (haben wir, Panel geht weiter), **Hervorhebung definierter Begriffe mit Legaldefinition** (Idee für später, nach H5; Extraktions-Risikopfad), **zweisprachiger Leser DE/FR** (später, hängt an FR/IT-Korpus W2·5g-ZEIT), PDF-Export ausgewählter Abschnitte (später, zu Zitat-Export). *eurlex2lexparency* (Python, MIT, EUR-Lex→Lexparency-Format): reines Daten-Konversionswerkzeug für Formex-XML — für Fedlex/Akoma-Ntoso nicht brauchbar, keine UI-Ideen. **Ergänzung 2 (David 16.8.2026) — *dejure.org*:** jede Vorschrift mit Querverweisen auf zugehörige Bestimmungen, die dazu ergangene Rechtsprechung und Literaturhinweise; Entscheid-Volltexte liegen NICHT auf der Plattform, sondern werden auf amtliche und nichtamtliche Quellen verlinkt. **Leitsatz für H3 und W2·6:** Nachweisdatenbank statt Volltextsammlung — das Panel zeigt Fundstellen (Gericht · Datum · Aktenzeichen · Regeste-Zeile) und verlinkt auf BGer/entscheidsuche.ch/kantonale Quelle; für ein kleines Projekt der einzig tragfähige Weg und lizenzrechtlich der saubere (vgl. Blocker `§4-lizenz`).

Sweep 16.8.2026 über `ROADMAP.md`. Alle IDs unten wurden im Plan verifiziert (Zeilennummern
angegeben). Zweck: V3 baut nicht neben laufenden Schritten her, und kein Schritt wird
stillschweigend doppelt gebaut (§17-Gegengewicht, Kollisionsregel).

### Absorbiert — diese Schritte werden von V3 miterledigt

| Schritt-ID | Bezug zu V3 | Etappe | Beim Bau abzuhaken |
|---|---|---|---|
| **`QS-UI-HIGHLIGHT`** (ROADMAP:210) — `::highlight()`-Registry je Leser-Instanz; heute löscht im Split-View das Rail-Suchfeld die Markierung des Nachbar-Panes | Genau der Defekt, den ein Suchfeld pro Pane erzeugt. V3 hat **ein** Suchfeld je Pane mit pane-eigener Registry | **H2** | Registry ist an die Pane-Wurzel gebunden (nicht global); e2e: Suche in Pane A löscht Markierung in Pane B **nicht**; danach `QS-UI-HIGHLIGHT` in ROADMAP als erledigt abhaken mit Zeiger hierher |
| **`W2·10-UI-NAV` / `B14`** (ROADMAP:434) — «Brotkrume, Kopfzeilen und Seitenmeta (K-19a)», 8 Befunde, davon 3 «hoch» | Deckungsgleich mit Pos. 1 (Kopfzeile) und Pos. 18 (Seitenmeta) | **H1** (Krume/Kopf) + **S3** (Seitenmeta) | Die **8 Befunde aus `FAHRPLAN-UI-BEFUNDE.md` §15 werden als Abnahme-Checkliste in den H1- bzw. S3-PR kopiert** *(Dateiname korrigiert 16.8.2026 beim S3-Bau: `FAHRPLAN-UI-NAVIGATION.md` hat kein §15 — die Befunde LM-181/183/184/188/197 stehen in UI-BEFUNDE)* und einzeln abgehakt — nicht «sinngemäss mitgemacht». Die 3 Hoch-Befunde sind Blocker der jeweiligen Etappe |
| **`W2·7-VZUI`** (ROADMAP:349) — Verzahnung sichtbar machen, Rest-Umfang am `KontextPanel` | H3 **ersetzt** das KontextPanel durch das V3-Panel für den Gesetzes-Leser | **H3, nachgeführt H5 (21.8.2026)** | ✅ Nachgeführt: ROADMAP-Kollisionspfad auf `v3/PanelMaterialien.tsx` korrigiert (die alte Zeile zeigte auf das inzwischen gelöschte `inhalt.tsx`), Rest-Umfang («Passende Werkzeuge»/`kontextSoftLaw`) dort vermerkt. **`KontextPanel.tsx` selbst bleibt im Repo** (H5-Vollzugsvermerk, Kap. 7) — die Komponente lebt weiter für Entscheid-/Material-Leser, nur der Gesetzes-Leser-Zweig ist mit V3 abgelöst |
| **`W2·7-VZUI-SACHGEBIET`** (ROADMAP:355) — Sachgebiet-Facette aus der BGE-Bandnummer | V3 sieht im Panel **den vierten Filter «Sachgebiet» baulich vor** (Platz, Reiter-Layout, Filterzeile) | **H3** (nur Hülle) | Filter-Platzhalter existiert und ist bei fehlenden Daten sauber ausgeblendet (kein leeres Steuerelement). **Die Datenlogik bleibt ausdrücklich `W2·7-VZUI-SACHGEBIET`** — Risikopfad mit Gegenprüfung, nicht Teil von V3 |
| **`QS-PERF`-Restposten** (ROADMAP:163) — Klickpfad Gliederungszeile **161 ms @4×**, Lese-Kadenz-TBT, langer Artikel-Index | Alle drei liegen in der Hülle, die V3 ohnehin neu setzt | **H1** (Messlatte) | Die 161 ms sind die **Messlatte, die H1 unterbieten muss — nicht nur halten**. Messung unter denselben Bedingungen (4× CPU-Drossel, kalt), Zahl im Kontaktbogen neben NM-1 |
| **Wording Anhang-Dominanz** — «N Artikel» im Erlass-Kopf ist falsch, wo Anhänge dominieren; richtig «Einträge» | Teil der Fakten-Zeile des neuen Erlass-Kopfs | **S3** | Kopf zählt und benennt korrekt; Wortlaut an **beiden** Stellen (`ErlassLeserKopf.tsx`, `seo-detail.ts`) — §5 wie beim Standausweis |
| **Flakes** `leser-weiterlesen-r4-r8`, `gesetze-historie-badge`, `leser-kontext-e4` | Alle drei prüfen Flächen, die V3 anfasst | **H4** (erste zwei) / **S1** (`gesetze-historie-badge`) | **Wurzel-Fix, kein Timeout und keine Retry-Erhöhung** (§17: dieselbe Störung darf keiner Folge-Session erneut Zeit kosten). Flip-Kriterium H4 nennt sie ausdrücklich |
| **Zitat-Export & Fussnoten-Ausgabe** | Braucht einen Ort in der Oberfläche | **nach H5** | Das V3-Panel **reserviert den Platz** (vierter Reiter oder Fusszeile im Reiter «Anzeige»), baut die Funktion aber nicht — Platz reservieren ist billig, Funktion nachrüsten teuer, umgekehrt nicht |

### Bewusst NICHT Teil von V3 — mit Begründung

| Schritt-ID | Warum draussen |
|---|---|
| **`W2·5g-ZEIT`** (ROADMAP:290) — Norm-Zeitmaschine + Fassungs-Diff | Kern und Extraktion, Risikopfad mit `QS-GP`; berührt `ArtikelBody.tsx` und die Snapshots. V3 ist Hülle — Vermischung würde die Treue-Tore in einen UI-PR ziehen |
| **`W2·5l-NORMTEXT-B2`** (ROADMAP:319) — Schlusstitel/UeB/Anhänge, wortgenaue Fussnoten | Ebenfalls Kern/Extraktion mit golden-Bindung |
| **`W2·13-KANTONE`** (ROADMAP:373) | **Nach H5.** V3 leistet jetzt nur die **Kantons-Probe** (jede H-Etappe gegen einen Kantons-Erlass), damit die neue Hülle kantonstauglich entsteht — der Ausbau selbst folgt auf der fertigen Hülle, nicht parallel dazu |
| **`W2·15-CLS`** (ROADMAP:408) — CLS-Defekt 0.109 @8× auf `/gesetze` | Betrifft die **Übersichtsseite** `/gesetze`, nicht den Leser (`src/pages/Gesetze.tsx`) — andere Fläche, eigener Schritt |
| **Leerfläche ~370 px am Ende von `/gesetze`** (ROADMAP:455) | Ebenfalls Übersichtsseite |

### Nebenfunde aus H2 (16.8.2026)

- **`Ä13` · Korpus-Datenqualität, NICHT V3.** Die VMWG-Gliederung zeigt
  «Art. 6b — b Bezug…» — der Randtitel-Buchstabe steht doppelt. Das ist ein
  Extraktions-/Datenbefund und gehört an **`QS-KORPUS`**, nicht in eine
  Hüllen-Etappe: V3 malt, was im Sidecar steht.
- **`QS-UI-HIGHLIGHT` ist mit H2 erledigt** — Registry-Buchführung je
  Leser-Instanz in `suchHighlight.ts`, Rot-Beweis in
  `src/tests/suchHighlight.test.ts`, Browser-Beweis in
  `e2e/leser-v3-highlight-split.e2e.ts`. **Rest, bewusst offen:** zwei
  ENTSCHEID-Panes teilen weiterhin eine Modul-Instanz (unverändert gegenüber dem
  Vorzustand, ausserhalb des gemeldeten Befunds).

- **`Ä24` · Shard-7-Rot auf dem OR ist KEIN H2-Defekt — die Wurzel liegt auf
  `main` und gehört an `QS-PERF`.** Gemessen 17.8.2026 (Diagnose-Auftrag zu
  PR #539); der Ausgangsverdacht lautete: «H2 hat die V1-Hülle auf dem grossen
  OR verlangsamt» (Kandidaten S4-Sortierung, Highlight-Registry, Trefferliste).

  **Symptom.** Im Projekt `chromium` (= OHNE Flag = eingefrorene V1-Hülle) fielen
  `e2e/leser-ohne-gliederungslinie.e2e.ts:71` (OR Art. 319, hart rot über alle
  drei Versuche) und `e2e/leser-r1-r2.e2e.ts:544` (OR-Suchmodus, flaky). **Beide
  scheiterten NICHT an ihrer Sachaussage**, sondern an der Bereitschaft der
  Seite: «element(s) not found» nach 20 s auf
  `getByRole('button', {name:'Ansicht'})` bzw. `[data-treffer-leiste]`. Die
  eigentlichen Aussagen (keine Gliederungslinie, kein Massen-Remount) wurden nie
  erreicht — das Tor fiel im Vorraum.

  **Nullprobe (§0 Ziff. 3a) — zwei unabhängige, beide negativ.**
  (i) *Gleiche Bytes, einmal grün, einmal rot:* Run `31973757595` auf `f54ff49aa`
  war vollständig grün, Run `31974377602` auf `eca91b2b2` auf Shard 7 rot.
  Zwischen beiden liegen **30 Zeilen `.claude/`-Doku und sonst nichts**
  (`git diff --stat f54ff49aa eca91b2b2`). So verhält sich kein deterministischer
  Code-Defekt.
  (ii) *Lokales A/B Branch gegen Merge-Base:* Zeit bis der «Ansicht»-Knopf auf
  `/gesetze/bund/OR#art-319` sichtbar ist, zwei getrennte `vite preview`-Server
  auf demselben Rechner, je 11 Messungen.

  **Verteilung (§0 Ziff. 3b) — der Messwert ist ZWEIGIPFLIG, und beide Gipfel
  stehen in beiden Armen:**

  | Arm | schneller Gipfel | langsamer Gipfel | Anteil langsam |
  |---|---|---|---|
  | Branch (H2) | 8.9–9.3 s, Median **9.19 s** | 14.9–16.5 s, Median **15.82 s** | 7/11 |
  | `main` (Merge-Base) | 8.4–9.5 s, Median **8.87 s** | 15.8–17.2 s, Median **15.97 s** | 5/11 |

  **Innerhalb desselben Gipfels sind die Arme ununterscheidbar:** +321 ms
  (+3.6 %) im schnellen, −148 ms (Branch SCHNELLER) im langsamen — die Vorzeichen
  widersprechen einander, was gegen jeden gerichteten Effekt spricht. Der
  Unterschied der Roh-Mediane entsteht allein daraus, wie oft der langsame
  Zustand eintrat; 7/11 gegen 5/11 ist bei dieser Stichprobe keine Aussage. Der
  Sprung zwischen den Gipfeln beträgt **~6.8 s**, rund das Zwanzigfache des
  grössten Arm-Unterschieds: **der Featureanteil verschwindet in der Streuung.**

  **Messbedingung (§0 Ziff. 3c).** macOS, Apple Silicon, `dist` aus
  `npm run build`, `vite preview`, je Messung ein frischer Browser-Kontext,
  ungedrosselt, Rechner unbelastet. Die erste Reihe lief mit beiden Armen
  GLEICHZEITIG und ist nur als Kontrolle geführt; die Tabelle poolt sie mit einer
  zweiten, streng sequenziellen Reihe — beide zeigen dieselben zwei Gipfel, mit
  vertauschten Anteilen. CI ist ein 2-Kern-Linux-Runner mit `workers: 1`.

  **Gegenprobe unter CI-naher Last (`Emulation.setCPUThrottlingRate: 4`, je n=3).**
  Sie zeigt den Ausfall direkt, statt ihn hochzurechnen: Branch **46,5–49,7 s**,
  `main` **32,8–47,4 s** — beide Arme reissen das 20-s-Budget um das 2,3- bis
  2,6-Fache, und die grösste Einzelstreuung steht auf `main`, nicht im Branch.
  Ohne Hash dasselbe Bild (Branch 45,2–46,3 s, `main` 50,2–52,0 s; hier ist `main`
  der langsamere Arm). Damit ist die Arm-Unabhängigkeit unter genau der Bedingung
  belegt, unter der CI rot wurde.

  **Wurzel.** Der Leser braucht auf dem OR (2038 Artikel) **8.4–17.2 s bis zur
  Bedienbarkeit — auf einem schnellen, unbelasteten Rechner**. Die Spec gewährt
  20 s. Der langsame Gipfel liegt damit schon lokal bei 86 % des Budgets; auf dem
  CI-Runner reisst er es. Das Tor misst folglich nicht mehr seine Sachaussage,
  sondern die Tagesform des Runners. Zwei Nebenbefunde: (a) die Hash-Form der
  Adresse ist NICHT die Ursache — `/gesetze/bund/OR` ohne `#art-319` zeigt
  dieselbe Zweigipfligkeit; (b) die grüne CI-Historie von `main` ist **kein**
  Gegenbeweis: in 5 der 7 letzten `main`-Läufe war Shard 7 nach 4 s fertig, weil
  die Diff-Klassierung ihn als `art=doku` übersprang.

  **Was daraus NICHT folgt.** Kein Timeout-Anheben und keine Test-Lockerung in
  H2 — beides maskierte genau die Zahl, die hier belegt ist. Die Ursache
  (Erst-Render/Hydration des OR und die Herkunft des ~6.8-s-Sprungs zwischen den
  Gipfeln) ist ein Perf-Thema der Ist-Hülle und liegt ausserhalb der H2-Fläche.

  **Übergabe.** Gehört an **`QS-PERF`** (Erst-Render OR) und schliesst den
  ausdrücklich offen gelassenen Punkt (b) von `QS-E2E-STABIL` — «`leser-r1-r2`-
  Wurzel per CI-Forensik, kein UI-Bau ins Blaue, nicht per Timeout maskieren».
  Die Forensik ist hiermit geliefert, der Bau steht aus.

### Kollisionshinweis für die Folge-Session

`W2·10-UI-NAV`, `W2·7-VZUI`, `W2·13-KANTONE` und `QS-PERF` führen `src/pages/gesetz-leser` bzw.
`GesetzLeser.tsx` in ihrer `kollision:`-Liste — solange V3 läuft, ist die Fläche belegt. Vor
jedem dieser Schritte gilt die Drei-Sonden-Prüfung (offene PRs · fremde Remote-Branches ·
Worktrees); im Zweifel wartet der andere Schritt.


---

## 15 · Einzelartikel-Ansicht (Ansichtsoption) — Konzept 14.9.2026

> **Status: E1+E2 GEBAUT (PR #869, 14.9.2026).** David hat die drei Fragen aus §15.8 am
> 14.9.2026 beantwortet — «ja zu allen drei, bau etappe 1 und 2 zusammen» (Buchung in §15.8).
> E3 (Druck, Export, Handy-Feinschliff) ist offen. Roadmap-Zeiger: `W2·5m-LESER-V3`.
> Alle Code-Angaben unten sind am Stand `origin/main` @ `d61193dbe` (14.9.2026) verifiziert;
> ungeprüfte Annahmen sind als solche gekennzeichnet. **Wo der Bau vom Konzept abweicht, steht
> die Korrektur direkt am betroffenen Punkt — datiert, den ursprünglichen Text ergänzend und
> nicht ersetzend (§0 Ziff. 2b); die Sammelstelle ist §15.9.**

### 15.1 · Zweck und Entscheide

Anlass ist PR #854 (Nachbar-Artikel-Pfeile im Artikelkopf). David dazu im Chat 14.9.2026, wörtlich:

| # | Wortlaut David (14.9.2026) | Was daraus folgt |
|---|---|---|
| D-E1 | «das bringt aber nur etwas wenn man einzeln einen artikel hat. wenn man einfach scrollen kann dann bringt das ja nichts» | Die Pfeile aus #854 sind in der Scroll-Ansicht **funktionslos** — dort ist Blättern schon durch Scrollen erledigt. Sie gehören in einen Modus, der wirklich nur einen Artikel zeigt. |
| D-E2 | «können wir als ansichtsoption bauen wo man nur den einzelnen artikel sieht und so sich weiterklicken kann?» | Kein neuer Leser, sondern eine **Option** neben der bestehenden Gesamtansicht. |
| D-E3 | «das wird ein grösserer umbau der gut geplant sein muss. man kann im ansichtsmenu wählen ob man das ganze gesetz sieht oder nur den jeweils einzelnen artikel. wenn man aber nur einen einzelnen artikel haben dann können wir mehr informationen anzeigen» | Umschalter sitzt im **Ansicht-Menü** (F7 = A, Kap. 9). Der gewonnene Platz wird für **mehr Kontext je Artikel** genutzt — das ist der eigentliche Gewinn, nicht das Blättern. |
| D-E4 | «blöcke unter dem artikel, panel im einzelmodus weg» | Der Kontext steht **unter** dem Artikel in Blöcken, nicht seitlich. Das Panel (`LeserPanelZone`) ist im Einzelmodus ausgeblendet. |
| D-E5 | «achte darauf dass wir eine gute und intuitive darstellung haben» | Eigener Abschnitt §15.4 mit prüfbaren Kriterien, nicht als Vorsatz. |
| D-E6 | «ich weiss nicht wie ich es anders sagen soll aber achte wirklich darauf, dass es ein mehrwert ist» | **Leitprinzip 2**, §15.2: jeder Block braucht einen belegten Mehrwert-Satz, sonst fällt er; E1 geht nicht allein live. |

**Zielbild-Bezug.** Phase 1 «Bund zuerst» (Mandat 14.9.2026); Dach-Schritt `W2·5m-LESER-V3`;
Anspruch aus Kap. 1 Ziff. 1 — bestes Gesetzes-Leseprodukt. Der Einzelmodus zahlt auf drei der acht
HIG-Begriffe ein: **Focus** (nur eine Norm im Blick), **Flexibility** (der Nutzer wählt die
Lesart), **Simplicity** (das Beiwerk verschwindet aus dem Lesefluss in benannte Blöcke).

**Grenze Hülle/Kern (Kap. 1 Ziff. 3) gilt unverändert.** `ArtikelBody.tsx` und die Datenlade-Logik
werden **nicht** angefasst; der Einzelmodus rendert denselben Artikel-Körper, nur in einer anderen
Umgebung. Golden byte-gleich ist Tor, nicht Zusage.

### 15.2 · Mehrwert-Test (Leitprinzip 2) — hartes Kriterium, kein Vorsatz

> **David 14.9.2026, wörtlich:** «ich weiss nicht wie ich es anders sagen soll aber achte wirklich
> darauf, dass es ein mehrwert ist».

Der Einzelmodus allein ist **kein** Mehrwert: einen Artikel einzeln lesen kann man auf Fedlex
auch, durch Scrollen. Der Mehrwert entsteht erst durch das, was **unter** dem Artikel steht
(D-E3: «wenn man aber nur einen einzelnen artikel haben dann können wir mehr informationen
anzeigen»). Darum gilt für dieses Kapitel eine Regel, die über den üblichen Toren steht.

**M1 · Jeder Block braucht einen belegten Mehrwert-Satz. Blöcke ohne einen fliegen raus** — es
gibt keine Platzhalter-Blöcke und kein «kommt später mit Inhalt».

| # | Block | Was bekommt ein Jurist hier, das Fedlex nicht bietet? | Beleg an den Daten (geprüft 14.9.2026) |
|---|---|---|---|
| 1 | **Historie / Fassung** | Die Änderungsereignisse des Artikels als **strukturierte Liste bis auf Absatz und Buchstabe**, jedes mit AS- und BBl-Quelle — statt einer Fussnotenzeile, aus der man die Zuordnung selbst erschliessen muss. | `public/normtext/historie/OR.json`, Eintrag `336_c`: `giltSeit: 2024-01-01`; Ereignis `1996-10-01` mit `absatz: "1"`, `item: "a"`, Quellen `AS 1996 1445` + `BBl 1994 III 1609` (beide mit Fedlex-ELI-Link). 209 Erlass-Shards. |
| 2 | **Verweise** | Die Verweise als **begehbare Kanten in beide Richtungen** — und zwar **korpusweit**, über den Erlass hinaus. | ausgehend heute: `src/components/NormText.tsx`. **Rückrichtung «zitiert von» fehlt noch** (`W2·22-VERWEIS-FEDLEX` Z4) — s. M2. |
| 3 | **Rechtsprechung** | Die **Leitentscheide zu genau diesem Artikel**, vorsortiert. Fedlex verlinkt keine Rechtsprechung. | `public/rechtsprechung/bezuege/OR.json`, `proArtikel`: `336c` → **11** Entscheide (u. a. BGE 152 III 23, BGE 150 III 78, BGE 148 III 126); zum Vergleich `41` → **51**, `18` → 35, `104` → 29. 469 OR-Artikel tragen Bezüge. |
| 4 | **Materialien / Entstehung** | Botschaft und Entstehungsgeschichte **je Artikel** statt je Erlass — die Stelle, an der man sonst eine BBl-Nummer im Volltext sucht. | `artikelMaterialienLaden.ts`; Deckung unvollständig und als solche ausgewiesen (`W2·6c`). |
| 5 | **Passende Werkzeuge** | Der **Rechner oder die Vorlage, die an genau dieser Norm hängt** — der Schritt von «was gilt» zu «was rechne ich». Das hat kein Gesetzesportal. | `src/lib/normtext/werkzeuge.ts:73-93`: artikel-scharfe Norm↔Werkzeug-Kanten, jede mit fachlichem Norm-Beleg (§7), Zweifelsfälle bewusst ausgelassen (§8). Beispiel im Dateikopf: «Art. 127 OR → Verjährung». |
| 6 | **Nachbarn-Vorschau** | **Kein eigener Mehrwert** — reine Navigation. Darum offene Frage F-E2 und nicht gesetzt. | — |

**M2 · Freigabe-Regel: Etappe 1 geht NICHT allein live.** Der Modus samt Blättern wird erst
zusammen mit den **ersten beiden Blöcken** ausgeliefert — Vorschlag **Historie + Verweise**, weil
beide ohne Vorbedingung verfügbar sind. Bis dahin bleibt E1 hinter dem Umschalter unveröffentlicht
bzw. ungemergt. *Begründung:* E1 allein liefert «ein Artikel statt vieler» — gegenüber
Fedlex-Scrollen ist das kein Gewinn, sondern nur eine andere Bedienung. Der Mehrwert beginnt bei
Block 1.

**M3 · Rechtsprechung erst nach dem Phantom-Filter.** Block 3 wird nicht ausgeliefert, solange die
Phantom-Kanten offen sind (ROADMAP:374, Fix-Tiefe unter `QS-KORPUS`). Ein prominenter Block mit
einem erheblichen Anteil falscher Kanten ist **negativer** Mehrwert: er kostet den Juristen die
Prüfung jeder einzelnen Fundstelle und beschädigt das Versprechen aus §1/§8 stärker, als ein
fehlender Block es je könnte.

**M4 · Messbarer Nutzen als Fertig-Kriterium.** Diese drei Fragen müssen im Einzelmodus in
**höchstens zwei Klicks** beantwortbar sein und auf Fedlex nicht. Sie werden im Abnahme-PR
**durchgeklickt und mit Klickzahl protokolliert** (Anschluss an die NM-Regel, Kap. 7) — eine
Etappe, die eine davon verfehlt, ist nicht abnahmefähig.

| # | Szenario (aus dem Korpus gewählt, Werte verifiziert) | Weg im Einzelmodus | Auf Fedlex |
|---|---|---|---|
| **N1** | **OR 336c** (Kündigung zur Unzeit) — «seit wann gilt Abs. 1 **lit. a** in der heutigen Fassung, und mit welcher Vorlage kam die Änderung?» | Block **Historie** aufklappen → Ereignis `1.10.1996`, absatz 1, lit. a, `AS 1996 1445` / `BBl 1994 III 1609`. **1 Klick.** *(GEMESSEN im Bau 14.9.2026: **0 Klicks** — die Fassung startet als erster Block offen, B6. Sonde `e2e/leser-einzelmodus.e2e.ts`.)* | Fussnotenzeile am Artikel; die Zuordnung «welche Fussnote gilt welchem Buchstaben» muss der Leser selbst herstellen, die BBl-Fundstelle separat suchen. |
| **N2** | **OR 336c** — «welche Bundesgerichtsentscheide gibt es zu diesem Artikel?» | Block **Rechtsprechung** aufklappen → **11** Entscheide, u. a. BGE 152 III 23, BGE 150 III 78, BGE 148 III 126. **1 Klick.** | Gar nicht — Fedlex führt keine Rechtsprechung. |
| **N3** | **OR 127** (Verjährung) — «welches Werkzeug rechnet mir die Frist aus?» | Block **Passende Werkzeuge** aufklappen → Verjährungs-Rechner, Kante mit Norm-Beleg. **1 Klick.** *(GEMESSEN im Bau 14.9.2026: **1 Klick**, wie veranschlagt.)* | Gar nicht. |

*Warum diese drei:* N1 prüft die Tiefe der eigenen Daten (Absatz-/Litera-Schärfe), N2 die Breite
(fremder Korpus, den die Amtsquelle nicht hat), N3 den Sprung von der Norm in die Anwendung — die
drei Richtungen, in die dieses Haus über ein Gesetzesportal hinausgeht. Alle drei Zahlen sind am
Repo-Stand `d61193dbe` geprüft, nicht geschätzt; wo der Bau sie anders vorfindet, gilt die Messung
und nicht dieser Text (§7).

### 15.3 · Bildschirmaufteilung

| Zone | Inhalt | Herkunft / Bauart |
|---|---|---|
| **Funktionszeile oben** | Umschalter **«Ganzer Erlass \| Einzelner Artikel»** im bestehenden Menü «Ansicht ▾» — **kein neues Chrome**, keine zusätzliche Leiste. | `v3/LeserRubrikenWahl.tsx` ist der Präzedenzfall für eine Wahl in diesem Menü; der Modus kommt als eigene Gruppe darüber. |
| **Gliederungspfad** | Buch › Titel › Abschnitt › Art. N — zugleich der Rückweg: ein Klick auf ein Glied springt in die **Gesamtansicht** an diese Stelle. | Die Krumen-Quelle existiert seit H2b (Ä1, eine Scroll-Spy-Quelle); im Einzelmodus ist sie **trivial wahr**, weil genau ein Artikel sichtbar ist — der §7-Wahrheitsfall aus Ä1 entfällt hier. |
| **Artikel-Karte · Kopf** | Artikelnummer, Marginalie/Randtitel, Blätter-Pfeile links/rechts. | `parts/ArtikelNachbarn.tsx:75` — **wiederverwenden**, nicht neu bauen. |
| **Artikel-Karte · Text** | Der amtliche Wortlaut, unverändert. | `normtext/ArtikelBody.tsx` — **Kern, TABU**. Kein Prop, kein Wrapper-Eingriff, keine neue Klasse am Textkörper (PX-Tor, Kap. 7). |
| **Artikel-Karte · Fusszeile** | «Gilt seit …» · Fedlex-Link (amtlich ↗) · Rohdaten-Link · Tastatur-Hinweis. | Die ersten drei sind die Aktionen aus `parts/ArtikelAktionen.tsx` (Zitat :95, Link :98, Amtlich :104) plus der Rohdaten-Link aus #854. |
| **Blöcke darunter** | §15.5 — Handy **eine** Spalte, Desktop **zwei**. | Aus den bestehenden Rubriken der Funktionszeile, s. u. |
| **Kontext-Panel** | **Im Einzelmodus ausgeblendet** (D-E4). In der Gesamtansicht unverändert. | `v3/LeserPanelZone.tsx` (407 Z.) wird nicht gelöscht, nur nicht gemountet. |

**Der Rückbau aus #854 (D-E1).** Die Pfeile werden in der Gesamtansicht entfernt und erscheinen
**nur** im Einzelmodus. Betroffen ist genau eine Zeile — `parts/ArtikelLeser.tsx:399`
(`{!imTreffer && nachbarn && <ArtikelNachbarn nachbarn={nachbarn} />}`); die Bedingung bekommt den
Modus dazu. Die Komponente selbst, ihre Selektoren (`data-artikel-nachbarn`,
`data-nachbar="vor"|"nach"`) und `v3/nachbarArtikel.ts` (`baueNachbarn`, Z. 74–84) bleiben
unverändert. **§4b-Pflicht:** vor dem Push alle Sonden auf `data-artikel-nachbarn` und
`data-nachbar` grepen und die Treffer-Specs gegen `dist` fahren — die Pfeile verschwinden aus einer
Fläche, die heute getestet wird.

### 15.4 · Darstellung und Bedienbarkeit (Auftrag David 14.9.2026, D-E5)

| # | Regel | Prüfbar woran |
|---|---|---|
| B1 | **Pfeile an festem Ort, klar sichtbar** — im **Kopf** und in der **Fusszeile** der Artikel-Karte, beide Male an derselben Stelle, unabhängig von der Artikellänge. Nie nur bei Hover. | Sichtprüfung + e2e: beide Pfeil-Paare vorhanden, bei langem (OR 336c) und kurzem Artikel an gleicher X-Position. |
| B2 | **Tastatur-Hinweis einmal sichtbar**, nicht in einem Hilfe-Dialog versteckt: eine ruhige Zeile in der Fusszeile («← → blättert»). Nicht je Block wiederholen. | Sichtprüfung; genau **ein** Vorkommen im DOM je Artikel. |
| B3 | **Umschalter klar beschriftet und im Zustand erkennbar** — «Ganzer Erlass» / «Einzelner Artikel» ausgeschrieben, aktiver Zustand sichtbar **und** per `aria-checked`/`aria-current` ausgezeichnet; nicht allein über Farbe. | axe (`e2e/a11y.e2e.ts`) + Sichtprüfung hell/dunkel; Kontrast ≥ 4.5. |
| B4 | **Gliederungspfad ist der Rückweg** — der Sprung zurück in die Gesamtansicht liegt in **beiden** Modi an derselben Stelle, damit der Nutzer ihn nicht sucht. | Sichtprüfung Desktop/Handy in beiden Modi. |
| B5 | **Blöcke mit sprechendem Titel und Zahl im Titel** («3 Entscheide», «2 Fassungen»). Ein Block ohne Inhalt erscheint **nicht** als leere Karte. | e2e: Block mit 0 Treffern ist nicht im DOM; Titel enthält die Zahl. |
| B6 | **Standardmässig eingeklappt bis auf den ersten** (Vorschlag: Historie/Fassung — die Angabe, die jeder Jurist zuerst braucht). Öffnen lädt nach (§15.5). | e2e: beim Laden genau ein `aria-expanded="true"`. |
| B7 | **Leerzustände in Klartext** — §8-ehrlich, s. §15.5 (Spalte «Leerzustand»). Nie «0» ohne Satz. | Wortlaut-Test je Block. |
| B8 | **Ruhige Typografie nach DESIGN-REGLEMENT**, Normtext-Körper **unverändert** (S2-Satzspiegel 17 px / lh 1.55). Block-Titel und Block-Inhalt liegen typografisch **unter** dem Normtext, nie darüber. | PX-Tor (Kap. 7): Textkörper-Region pixelgleich; `check:linien-kanon` Teil A. |
| B9 | **Handy: eine Spalte, Pfeile daumen-erreichbar unten** — das Fuss-Pfeilpaar ist auf ≤ 390 px die Hauptbedienung, das Kopf-Paar die Orientierung. | Sichtprüfung @390; e2e-Tap-Ziel ≥ 44 px. |
| **PRÜFWEISE** | **Sichtprüfung hell UND dunkel, Desktop UND Handy ist Fertig-Kriterium von E1 und E2** — nicht Nacharbeit. **Screenshots liegen im PR.** Dazu der Ästhetik-Prüfer der Drei-Prüfer-Regel (Kap. 7), der die Fläche nicht gebaut hat. | Vier Bilder je Etappe (hell/dunkel × Desktop/Handy) im PR-Text. |

### 15.5 · Die Blöcke (Reihenfolge = Vorschlag, David entscheidet — F-E1)

**Architektur-Befund, der den Umfang halbiert.** Die Blöcke existieren bereits — als **Rubriken der
Funktionszeile am Artikelende** (`parts/Funktionszeile.tsx`, ex `BezuegeKopf`; Rubriken-Kennungen
`f` Fassung · `r` Entscheide · `m` Materialien · `g` Verweise · `w` Rechner, definiert in
`leserOptionen.ts:122-124` als `FussRubrik`). Sie sind seit `W2·26-FUNKTIONSZEILE` (#788) bereits
**Akkordeon, beim Laden zu, on demand** (FAHRPLAN-DESIGN-IDENTITAET §9 Z2–Z4). Der Einzelmodus
**entfaltet dieselben Rubriken grosszügiger**, er erfindet sie nicht neu. **§5: kein zweites
Modul, keine Kopie** — wer im Bau eine `EinzelBlockEntscheide.tsx` anlegt, hat den Schritt verfehlt.

| # | Block | Datenquelle (verifiziert) | Heutiger Ort | Laden | Leerzustand (§8, Klartext) |
|---|---|---|---|---|---|
| 1 | **Historie / Fassung** | `public/normtext/historie/` (209 Shards, Stand 14.9.2026); Anzeige `parts/ArtikelHistorie.tsx` | Rubrik `f`; Panel-Reiter «Änderungen» (`v3/PanelAenderungen.tsx`, 140 Z.) | beim Aufklappen | «Für diesen Artikel ist keine Änderung erfasst.» — **nicht** «nie geändert» |
| 2 | **Verweise** — zitiert / zitiert von | ausgehend: `src/components/NormText.tsx` (782 Z.) | Rubrik `g` | beim Aufklappen | «Dieser Artikel verweist auf keine andere Bestimmung.» |
| | ⚠️ **«zitiert von» ist heute NICHT vorhanden** — im Code keine Rückrichtung gefunden. Sie ist ein eigener Schritt: `W2·22-VERWEIS-FEDLEX` **Z4** (ROADMAP:180, «Leser-Schicht ‹zitiert von›, Erlassebene, nur Bund — erst nach Z1–Z3 und Abnahme»). **Bis dahin zeigt der Block nur die ausgehende Richtung**, und zwar benannt («Verweist auf»), damit kein Nutzer die Rückrichtung für leer hält statt für fehlend. |
| 3 | **Rechtsprechung** | `bezuegeLaden.ts` (Kommentar Z. 8–14: «ON DEMAND, NIE EAGER») | Rubrik `r`; Panel-Reiter «Entscheide» (`v3/PanelEntscheide.tsx`, 272 Z.) | beim Aufklappen | «Zu diesem Artikel sind in unserem Korpus keine Entscheide erfasst.» — **nie** «es gibt keine Rechtsprechung» |
| | ⚠️ **Vorbedingung: Phantom-Kanten.** Der Bezüge-Korpus trägt Phantom-Zitate (ROADMAP:374, Befund Split-Bau 30.8.2026/PR #582; Fix-Tiefe geführt unter `QS-KORPUS`, ROADMAP:451). Im Panel sind sie eine Zeile unter vielen; als **eigener Block unter dem Artikel** bekommen sie Gewicht. **E2 wird für diesen Block nicht abgenommen, solange der Phantom-Filter offen ist** — sonst macht die Hülle einen Datenfehler prominent. |
| 4 | **Materialien / Entstehung** (Bund) | `artikelMaterialienLaden.ts` (Kommentar Z. 25–28: «ERST AUF WUNSCH») | Rubrik `m`; Panel-Reiter «Materialien» (`v3/PanelMaterialien.tsx`, 138 Z.) | beim Aufklappen | «Für diesen Artikel sind keine Materialien erfasst.» Deckung ist unvollständig (`W2·6c`) — der Satz sagt «erfasst», nicht «vorhanden» |
| 5 | **Passende Werkzeuge** | `kontextSoftLaw` / `v3/PanelAnwendung.tsx` (195 Z.), Panel-Reiter «Anwendung» | Rubrik `w` | beim Aufklappen | Block **entfällt** (B5: keine leere Karte) |
| 6 | **Nachbarn-Vorschau** — Nummer + Marginalie des Vor-/Folgeartikels als Vorschau-Zeile | `v3/nachbarArtikel.ts` (bereits geladen, **kein** neuer Request) | neu | — | entfällt am ersten/letzten Artikel | 

*Zur Reihenfolge:* 1–4 folgen der juristischen Lesefolge (Was gilt seit wann · Was hängt daran ·
Wie wurde es angewendet · Warum steht es so da); 5–6 sind Navigation, darum zuletzt. **Frage F-E2:
Block 6 ja oder nein** — er ist billig, aber er verdoppelt die Pfeil-Funktion.

**Perf (§15).** Alle Blöcke laden **nur aufgeklappt**. Da B6 genau einen Block offen startet, ist
die Startlast des Einzelmodus **höchstens ein Shard über** der heutigen Artikelansicht — und
deutlich darunter, wo heute die ganze Erlassseite rendert. Die Zahl wird aus `check:perf-budget`
vorher/nachher ausgewiesen, nicht behauptet (Präzedenz: Panel-Nachladen H3, Kap. 7).

### 15.6 · Verhalten

| Thema | Regel | Begründung / Beleg |
|---|---|---|
| **Adresse** | `?ansicht=artikel` zusätzlich zu `#art-…`, damit ein Link den Modus mitträgt. `?ansicht=erlass` ist der Vorgabewert und wird **nicht** geschrieben. | Im gesamten `gesetz-leser/`-Baum kommt heute **kein** `searchParams.get` vor (geprüft 14.9.2026) — dies wäre der erste Query-Parameter des Lesers. Darum eine einzige Lesestelle, typisiert, keine verstreuten Abfragen. |
| **Prerender/SEO** | Die prerenderten Seiten bleiben **Gesamtansicht**. Der Einzelmodus ist eine Client-Option, kein zweiter SEO-Zustand. | Sonst entstünde je Artikel eine zweite indexierbare Fassung desselben Wortlauts (Duplicate Content) — und `scripts/prerender.ts` müsste die Hülle kennen, was Kap. 7 «SEO-Prüfpunkt» ausdrücklich verbietet. |
| **Browser-Verlauf** | **`pushState` je geblättertem Artikel — nur im Einzelmodus.** «Zurück» blättert einen Artikel zurück. In der Gesamtansicht bleibt es **strikt bei `replaceState`**. | Heute gilt im Leser die Regel «`replaceState`, nie `pushState`» (`v3/leserV3Modell.ts:317`, Kommentar Z. 287–288) — richtig, weil dort der **Scroll-Spy** die Adresse führt und `pushState` pro gescrolltem Artikel einen History-Eintrag erzeugen würde (der Zurück-Knopf wäre unbrauchbar). Im Einzelmodus gibt es keinen Scroll-Spy: die Adresse ändert sich **nur** auf eine ausdrückliche Nutzer-Geste. Genau dann ist `pushState` das erwartete Verhalten. **Die Regel wird also nicht gebrochen, sondern an ihrer Bedingung präzisiert** — und der Kommentar an `leserV3Modell.ts:287` wird im selben PR ergänzt (§2b: die alte Begründung bleibt stehen, sie wird nur um den Modus erweitert). |
| **Tastatur** | **← → blättern** (Konflikt geprüft: frei, sobald das Panel im Einzelmodus nicht gemountet ist). **`j`/`k` bleiben unverändert** und brauchen **keine neue Belegung**. | `parts/LeserTastatur.tsx:195` belegt `j`/`k` bereits mit «nächster/voriger Artikel» — im Einzelmodus bedeutet das dasselbe wie die Pfeile, die Semantik trägt also schon. `←`/`→` sind heute der Reiter-Wechsel im Panel (`v3/LeserPanel.tsx:92-93`); da das Panel im Einzelmodus weg ist (D-E4), ist die Taste dort frei. **Belegt bleiben** `?` (Z. 140/150), `r` (Z. 156), `t` (Z. 165) — nicht anfassen. |
| **Präferenz** | Der gewählte Modus wird lokal gemerkt, als neues Feld in `leserOptionen.ts` (Key `lm.leser.optionen`, heute `vermerke` + `fussRubriken`). Migration alter Werte wie bei S1: fehlendes Feld ⇒ Vorgabe «Ganzer Erlass». | Eine Ansichtswahl, die jeder Seitenaufruf vergisst, ist keine Option. |
| **Vorrang** | Ein `?ansicht=`-Parameter in der Adresse **schlägt** die gemerkte Präferenz (ein geteilter Link zeigt, was der Absender meinte). | Sonst bricht das Teilen. |
| **Aufgehobene Artikel** | werden beim Blättern **nicht übersprungen**. | Bereits so gebaut und begründet: `v3/nachbarArtikel.ts` Z. 23–30 (§8) — ein übersprungener Artikel liesse den Nutzer glauben, es gäbe ihn nie. **Kein Bauaufwand, nur nicht kaputtmachen.** |
| **Suche / Treffer / Split-View** | unverändert. Ein Treffer-Klick führt in die **Gesamtansicht** (dort ist der Kontext der Trefferliste). | Der Einzelmodus ist eine Lese-, keine Such-Ansicht; `!imTreffer` steht schon heute an `ArtikelLeser.tsx:399`. |
| **Kantone** | identisch — kein Sonderpfad. | Kap. 1 Ziff. 4; der Architektur-Prüfer der Drei-Prüfer-Regel prüft genau das. |
| **Druck / Export** | Etappe 3. Der Einzelmodus ist die naheliegende Druckvorlage («ein Artikel mit seinem Kontext»), aber nicht Teil von E1/E2. | Platz reservieren ist billig (Kap. 14). |

### 15.7 · Etappen, Fertig-Kriterien, Tore

| E | Inhalt | Fertig, wenn | Tore |
|---|---|---|---|
| **E1 · Hülle** | Umschalter im Ansicht-Menü · Einzelmodus rendert **einen** Artikel · Blättern per Pfeil und Taste · Adresse `?ansicht=artikel` + `pushState` · Präferenz lokal · **Pfeile-Rückbau aus der Gesamtansicht** (#854). **Noch keine Blöcke.** | Der Umschalter wechselt verlustfrei hin und zurück, die Adresse ist teilbar, «Zurück» blättert einen Artikel zurück, und in der Gesamtansicht steht **kein** Pfeil mehr. **M2: E1 wird NICHT allein ausgeliefert** — der Merge nach `main` erfolgt erst zusammen mit den ersten zwei Blöcken aus E2 (Historie + Verweise); bis dahin ist E1 gebaut und geprüft, aber nicht live. Sichtprüfung B1–B4/B8/B9 hell+dunkel × Desktop+Handy, Bilder im PR. | `golden` **byte-gleich** · `check:perf-budget` · `check:linien-kanon` A · `check:schlankheit` · PX-Tor (Textkörper pixelgleich) · CLS 0 · axe (`e2e/a11y.e2e.ts`), Kontrast ≥ 4.5 · **neue e2e**: Blättern OR Art. 337b → 337d (deckt eine Suffix-Strecke ab, W2·22 Z6a) · §4b-Sonden-Sweep auf `data-artikel-nachbarn`/`data-nachbar` · R8-Sweep `e2e/kein-abschnitt.e2e.ts` @320/390 (die Funktionszeile ist ein geteilter Rahmen) |
| **E2 · Dossier-Blöcke** | Blöcke 1–5 aus den **bestehenden** Rubriken/Panel-Modulen, Akkordeon, on demand, Leerzustände, Zahl im Titel, erster Block offen. | Jeder Block zeigt dieselben Daten wie heute im Panel bzw. in der Funktionszeile — und **kein neues Datenmodul existiert**. Leerzustände im Wortlaut geprüft. Sichtprüfung wie E1. | **§5-Wächter: ein Test, der fehlschlägt, wenn ein Block seine Daten nicht aus dem bestehenden Modul zieht** (Rot-Beweis zeigen, §6.7) · `check:perf-budget` mit Vorher/Nachher-Zahl · übrige Tore wie E1 · **M3: Block 3 (Rechtsprechung) wird nicht ausgeliefert, solange der Phantom-Filter offen ist** · **M4: die drei Szenarien N1–N3 (§15.2) durchgeklickt, Klickzahl im PR protokolliert** · **M1: jeder gebaute Block trägt seinen belegten Mehrwert-Satz** |
| **E3 · Druck, Export, Handy-Feinschliff** | Druckbild des Einzelartikels · Zitat-/PDF-Anschluss · letzte Handy-Politur. | Ein gedruckter Einzelartikel trägt Wortlaut, Stand und Quelle vollständig. | wie E1; zusätzlich Druck-Sichtprüfung |

**Risiken.**

| Risiko | Gegenmittel |
|---|---|
| **Datei-Deckel.** Der Leser hat einen realen Tor-Konflikt: `leser-v3-fundament` deckelt `erlassAnsicht.ts` bei 420 Zeilen, die Datei steht bei 421 — offener ROADMAP-Punkt «Tor-Konflikt `erlassAnsicht.ts`-Deckel». Der Modus ist eine `.ebene`-nahe Ableitung und landet genau dort. | **Den Deckel-Punkt VOR E1 erledigen** (er ist ohnehin als §17-Wurzel-Fix gebucht), nicht umschiffen. Projektweit gilt zusätzlich `check:schlankheit` (800 Z., `scripts/check-schlankheit.ts:42`). *Korrektur zur Auftragsannahme: einen pauschalen 420-Zeilen-Deckel auf `v3/**` gibt es **nicht** — nur diesen einen auf `erlassAnsicht.ts`.* |
| **Prefetch-Kosten.** `src/leserPrefetch.ts` wärmt idle die Leser-Chunks. | Der Einzelmodus bekommt **keinen** eigenen Chunk-Prefetch; die Blöcke laden erst beim Aufklappen (B6). |
| **Phantom-Kanten** (s. Block 3). | E2-Abnahme gesperrt, bis `QS-KORPUS` geliefert hat. |
| **Zwei Wahrheiten Panel/Blöcke.** | §5-Wächter in E2; das Panel wird **nicht** kopiert, nur nicht gemountet. |

**Nicht-Ziele.** Keine neue Rechtsregel · keine neuen Daten · **kein Fassungs-Diff** (das ist
`W2·5g-ZEIT`/`W2·5l-NORMTEXT-B2` M16, Kern und Extraktion — Kap. 14 «Bewusst NICHT Teil von V3») ·
keine Legaldefinitions-Hervorhebung · keine Zweisprachigkeit.

### 15.8 · Die drei Fragen — **entschieden 14.9.2026: ja / ja / ja**

> **David, wörtlich (14.9.2026):** «ja zu allen drei, bau etappe 1 und 2 zusammen.»

| # | Frage | Empfehlung | Entscheid |
|---|---|---|---|
| **F-E1** | **Stimmt die Block-Reihenfolge?** Vorschlag: Historie/Fassung · Verweise · Rechtsprechung · Materialien · Passende Werkzeuge (· Nachbarn). | **Ja** — sie folgt der juristischen Prüffolge. Umstellen ist später billig, es ist nur eine Liste. | **Ja** (14.9.2026). Gebaut als `BLOCK_ORDNUNG` in `parts/ArtikelDossier.tsx`; der Rechtsprechungs-Block steht in der Reihenfolge, wird aber nach M3 nicht ausgeliefert. |
| **F-E2** | **Nachbarn-Vorschau (Block 6) bauen?** Zeigt Nummer und Randtitel des Vor-/Folgeartikels, bevor man klickt. | **Ja, aber erst in E2** — sie kostet keinen Request, verdoppelt aber die Pfeile; am fertigen Bild besser zu beurteilen als am Text. | **Ja** (14.9.2026), in E2 gebaut. Die Sorge «verdoppelt die Pfeile» hat sich am Bild BESTÄTIGT und ist behoben — s. Korrektur (c) in §15.9. |
| **F-E3** | **Bleibt «Ganzer Erlass» der Standard** für alle, die nichts umstellen? | **Ja.** Wer einen Link auf ein Gesetz öffnet, erwartet das Gesetz. Der Einzelmodus ist die bewusste Wahl — und wird ab der ersten Wahl gemerkt. | **Ja** (14.9.2026). `MODUS_VORGABE = 'erlass'` (`v3/leserModus.ts`); `?ansicht=erlass` wird nie in die Adresse geschrieben. |

### 15.9 · Was der Bau anders gemacht hat (E1+E2, 14.9.2026)

Sechs Abweichungen vom Konzept, jede mit ihrem Grund. Der ursprüngliche Text oben bleibt
unverändert stehen — er beschreibt den Planungsstand, nicht den Bau (§0 Ziff. 2b).

| # | Konzept sagte | Gebaut ist | Grund |
|---|---|---|---|
| **(a)** | §15.7-Risiken: «einen pauschalen 420-Zeilen-Deckel auf `v3/**` gibt es **nicht** — nur diesen einen auf `erlassAnsicht.ts`» | Den Deckel GIBT es pauschal für alle `v3/`-Dateien. | Gemessen an `src/tests/leser-v3-fundament.test.ts:502` (`MAX_ZEILEN = 420`, Schleife über `ALLE_DATEIEN`) plus der zweiten Regel «`leserV3Modell.ts` ist die grösste Datei» (419 Z.) — effektiv also 418 für jede andere. `LeserRahmenV3.tsx` lief beim Bau auf 443 und musste zurück auf 418. Die Konzept-Zeile war falsch; der Deckel-Wurzelfix (PR #868) bleibt davon unberührt richtig. |
| **(b)** | §15.3: «Blöcke darunter — Handy **eine** Spalte, Desktop **zwei**» | EINE Spalte auf jeder Breite. | Die Blöcke sind ein Akkordeon (B6, genau einer offen). Im Zweispalter bekäme der offene Inhalt entweder die halbe Lesebreite — die Entscheid-Liste mit Regesten wird dort unlesbar — oder er bräche über beide Spalten, also ein Layout-Sprung bei jedem Klick. |
| **(c)** | §15.5 Zeile 6: Nachbarn-Vorschau zeigt «Nummer + Marginalie» | Nummer + **spezifischste Gliederungsstufe** des Nachbarn, und nur, wenn sie von der eigenen abweicht; sonst entfällt die Karte. | GEMESSEN am ausgelieferten OR-Snapshot: `margAnzeige` führt für **0 von 1686** Artikeln einen Randtitel — die Marginalien sind zu Gliederungsstufen promotet (Auftrag 6b), stehen also im Baum. Mit blossen Nummern wäre die Vorschau exakt die Pfeil-Dopplung, die diese Zeile befürchtet, und fiele nach **M1**. Mit der Stufe sagt sie, worum es beim Nachbarn geht («Art. 336d › b. durch den Arbeitnehmer», «Art. 128 › 2. Fünf Jahre»). |
| **(d)** | §15.5: je Block ein Klartext-Leerzustand | Leerzustand nur bei **Verweise** und **Rechner**; die shard-abhängigen Rubriken (Fassung, Entscheide, Materialien) erscheinen weiterhin erst mit ihrer Zahl. | B5 («kein Block ohne Inhalt») und B7 («Leerzustand in Klartext») gehen nur zusammen, wenn man unterscheidet, woraus die Null kommt. `g`/`w` stehen aus der Struktur des Artikels sofort fest — dort heisst 0 gesichert «es gibt keine». `f`/`r`/`m` hängen an Shards; vor deren Eintreffen hiesse ein Leerzustands-Satz «ich behaupte etwas über Daten, die noch unterwegs sind» (§8). |
| **(e)** | §15.3 erwähnt die Erlass-Kopf-Zone nicht | Der **Ingress** (Eingangsspruch des Erlasses) wird im Einzelmodus nicht gerendert; der Erlass-**Kopf** (Titel, Kennung, Stand, amtliche Quelle) bleibt. | Sichtprüfung 14.9.2026: der Vorspann stand samt Ingress VOR der Bestimmung und füllte @390 den ersten Bildschirm. Der Ingress ist eine Auskunft über den ERLASS; im Einzelmodus ist der Gegenstand die eine Bestimmung (D-E3). Der Kopf bleibt, weil er der §7-Ausweis der gelesenen Fassung ist. |
| **(f)** | §15.3: Menü-Beschriftung «Einzelner Artikel» | «Einzelne **Bestimmung**». | An einem §-Erlass (ZH-211.11, BS-640.100) wäre «Artikel» falsch, und die Fundament-Sonde verbietet ein Zähl-Substantiv im `v3/`-Code ausserhalb von `erlassAnsicht.ts` (B8/C1); die Ableitung dorthin zu holen hiesse, jene Datei über ihren Deckel zu heben. «Bestimmung» ist der erlassneutrale Oberbegriff, den das Haus ohnehin führt. |

**Zwei Befunde, die der Bau nebenbei gehoben hat.** (1) Das KOPF-Pfeilpaar rendete zunächst
weiter einen In-Page-Anker `#art-…`; ein solcher feuert kein `popstate`, react-router bemerkt
ihn nicht — die Karte wäre stehen geblieben. Gefangen von `e2e/leser-nachbar-rohdaten`.
(2) Die Fassungs-Zeitleiste trug ihre AS-/BBl-Fundstellen auf `ink-400` = **3.3:1** im
Dunkelmodus (WCAG 1.4.3 verlangt 4.5:1). VORBESTAND — Nullprobe in der Gesamtansicht mit von
Hand aufgeklappter Rubrik «Fassung» zählte 14 Knoten; sichtbar wurde er erst, weil der
Fassungs-Block im Einzelmodus offen startet (B6). Behoben auf `ink-500`.

---

## §16 · Offene Unterpunkte aus ROADMAP.md — `W2·5m-LESER-V3` *(verlagert 20.9.2026)*

Herkunft: `ROADMAP.md`, Dach-Schritt `W2·5m-LESER-V3`. Der Plan riss am 20.9.2026 den
120-KB-Deckel; nach dem Entscheid David vom 20.9.2026 bleiben dort Ziel, Auflagen, Status
und der Zeiger, die Unterpunkt-Listen wandern in den verlinkten Fahrplan. **Wortlaut
byte-genau übernommen, nichts zusammengefasst** (~40 % Retrieval-Verlust). Belege altern
nicht: datierte Mess- und Reproduktionsangaben werden hier nie nachgeführt, nur ergänzt.

Die drei Deckel-/Schnitt-Posten, die das Fertig-Kriterium des Schrittes nennt, stehen als
erste drei offene Zeilen unten; die Gliederungs-Nebenfunde folgen als eingerückte Gruppe
unter ihrer Dach-Zeile (die Dach-Zeile selbst bleibt in `ROADMAP.md`, weil sie Davids Zitat
vom 15.9.2026 und den gemessenen Mehrwert-Satz trägt).

  - [x] **Erledigt:** D0 · S1 · S2 — ✅ Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026.
  - [x] **S4 · Trefferreihenfolge** — ✅ 16.8.2026 mit H2, PR #539 (`19a989f93`); die «Kantons-Probe», die #577 unter dieser Kennung führte, war ein Nachweis und ist erbracht (H4-Bogen Ziff. 7, PR #552). Wortlaut, Ursachen-Analyse und Kollisions-Auflösung aller vier Posten: ROADMAP-CHRONIK.md, Umschichtung 15.9.2026 (1).
  - [ ] **`leserV3Modell.ts` 420/420 und `uebersichtAngaben.ts` 418/420 schneiden** *(§17, offen nach #868)* — der v3-Deckel hat null Kopfraum; der Zukunftsfassungen-Hook (#863) musste deshalb nach `useZukunftsfassung.ts` ausweichen. Der Schnitt am Adapter ist laut Tor-Kommentar (16.8.2026) **verhaltenstragend** (Hook-Reihenfolge) ⇒ **eigener deklarierter Schritt** mit Rot-Beweis, kein Struktur-Umbau (§6.3). Dazu: der Satz «inzwischen in Kraft» gehört nach `src/lib/normtext/erlassKopfText.ts` (§5, heute zweite Heimat), `seo-detail.ts:354` trägt ihn unverlinkt. **ERGÄNZUNG 23.9.2026 (W2·29-WERKBANK-LESER S2):** `uebersichtAngaben.ts` geschnitten, 417 → 223 Zeilen (nur Kommentare; Herleitungen in der Geschichte ab `c9fc15513`). **Offen:** der Adapter `leserV3Modell.ts` (419/420, verhaltenstragend) und der Satz «inzwischen in Kraft» nach `src/lib/normtext/erlassKopfText.ts` — beide nicht S2 (eigener deklarierter Schritt bzw. Risikopfad `src/lib/**`).
  - [ ] **`ArtikelLeser.tsx` ca. Z. 621: Kommentar behauptet `data-such-meta` am «Gilt seit»-Block** *(Nebenfund 19.9.2026, PR #929)* — seit D40 (7.9.2026) trägt `[data-hist-druck]` das Attribut nicht mehr; folgenlos (der Such-Walker schneidet `display:none` ab), aber die Aussage ist falsch. Ein-Zeilen-Nachtrag.
  - [ ] **`NormText.tsx` 795/800 Zeilen** *(Messung 14.9.2026, `check:schlankheit`)* — fünf Zeilen Kopfraum: die nächste Änderung an der Datei lässt das Tor anschlagen. Erst schneiden (§6.6), dann ändern — kein Deckel-Anheben (§17). *(Nebenbefund der Jules-Suggestions-Sichtung 14.9.2026.)*
  - [x] **Erledigt:** Tor-Konflikt `erlassAnsicht.ts`-Deckel (§17-Wurzel-Fix) #868 (`892a6f0fb`) · Nachbar-Artikel-Pfeile + Rohdaten-Link je Erlass #854 (`7b0338916`) · Rohdaten-Zeiger ohne `fassungsToken` (#854 — §7 d verlangt Drift-**Erkennung**, keinen Hash-Abdruck im UI) · **Einzelartikel-Ansicht E1 + E2** #869 (`946cb155d`, David «merge»: Umschalter, Blättern, Dossier-Blöcke). Wortlaute: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (4)/(6) und 15.9.2026 (1).
    - [x] **Gliederung «noch schlecht» — Standort und unterste Ebene** *(Befund David 19.9.2026)* — ✅ 19.9.2026, Anzeige #924 + Daten #923. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 2026-09-20.
    - [x] **Erledigt 18.9.2026:** Mitlaufen beim Lesen · Standort-Fläche war ein Fehlalarm · Wächter auf Synchronität geschärft — PR #914 (`606b19066`) + #916. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 18.9.2026 (Leser-Mitlaufen).
    - [x] **Erledigt 19.9.2026:** Auf/Zu-Handling + Befund David 19.9. — ✅ `zeilenAnsicht`/`klappKarte.ts`, Wächter `gliederung-sichtbarkeit.test.ts`, Daten-Teil PR #923. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 2026-09-20.
    - [ ] **8 Artikel ohne eigene Gliederungszeile** *(Messung 19.9.2026)* — OR 748_750, 752, 858, ZGB disp_u1_art_39 u. a. (Umfang `luecken`) nur über die Abschnittszeile erreichbar; prüfen, ob gewollt.
    - [ ] **Struktur-Extraktor liest Randtitel aus HTML statt aus `fedlex:role="marginal"` (XML)** *(Nebenfund 19.9.2026, #923)* — Fix greift nur bei h1–h5-Auszeichnung der Gliederung; robuster wäre das amtliche XML-Attribut. Risikopfad.
    - [ ] **CLS-Flake `e2e/leser-funktionszeile-zaehler.e2e.ts:80`** *(Nebenfund 19.9.2026, #924)* — CLS konstant 0.04387 gegen 0.001, nur unter Parallel-Last (merge-base `135ec0cba` 8/20 rot, einzeln 0/8); Quelle unbekannt. Wurzel suchen (§17), nicht Budget anheben.
    - [ ] **Bezugslinien-Orakel liegt in zwei Specs** *(§5-Nebenfund 18.9.2026)* — die Regel «`scroll-margin-top` + 8, Zwischenraum» steht jetzt in `e2e/leser-marke-mitlaufen.e2e.ts` **und** `e2e/leser-spy-w25d.e2e.ts`; die Kopie trägt einen Querverweis auf die Herleitung. Sauber wäre ein Baustein unter `e2e/helpers/` — bewusst nicht im selben Schritt gezogen, weil er `leser-spy-w25d` mitverändert hätte (§6.3: eigener deklarierter Schritt).
    - [ ] **Empfindlichkeitsgrenze der Rückstands-Sonde** *(Messung 18.9.2026, kein Mangel — Dokumentation)* — eine auf **60 ms** verkürzte Entprellung liegt bei 51/59 = 86 % treu, reisst die 90-%-Schranke also nur knapp und die 5-%-Schranke gar nicht. Unterhalb des Frame-Intervalls des Runners ist eine Trailing-Entprellung prinzipiell nicht mehr von Synchronität unterscheidbar. Steht als Warnung im Test-Kommentar; **die 90 % nie blind hochschieben** (Ist-Stand unter 10× Drossel: 98 %).
    - [ ] **Akkordeon klappt nur bei Scroll-Ruhe tiefer auf** *(Nachzug Gegenprüfung 18.9.2026, P6 ii)* — bei pausenlosem Dauerzug bleibt die Marke auf Pfadtiefe 1 («Erste Abteilung …»), nach 1 s Ruhe Tiefe 5 («II. Grundsatz»); heute strikt binär «scrollt/ruht». Prüfen, ob langsames, aber nicht pausierendes Lesen früher aufklappen darf — Grenze ist der Reflow im Scroll (§15, a33-CLS-Wurzel nicht antasten).
    - [ ] **Stop-and-go-Wächter messen die eigene Messpause** *(§17-Nebenfund 18.9.2026)* — `e2e/leser-gliederung-a33.e2e.ts` (F1 «Highlight folgt») blieb grün, während die Funktion beim durchgehenden Lesen nie ansprang: er wartet nach jedem 120-px-Schritt 260 ms und lässt damit genau den Timer feuern, der beim echten Lesen verhungert. Regel verankert in `.claude/rules/webseiten-pruefung.md`; offen ist, F1 selbst auf eine pausenlose Strecke zu heben.
    - [ ] **`w224-d35-f2-kopf.e2e.ts:96` unter Last** *(Nebenfund 18.9.2026)* — riss einmalig im Vollauf (5 Worker) mit `element(s) not found`, isoliert 27/27 bzw. 9/9 grün, diff-fremd; im Gegenlauf riss stattdessen `leser-r1-r2.e2e.ts:420` (Byte-Längen-Drift). Indiz für Last-Flake, **kein Beweis** — lokal 10 vCPU gegen CI 2 vCPU. Bei Gelegenheit gedrosselt wiederholen.


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

9 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-LESER-V3.md`](../archiv/fahrplaene/FAHRPLAN-LESER-V3.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- 2 · Diagnose in Zahlen
- 3 · Grundentscheid: (B-hybrid)
- 4 · Skizze «Leser V3»
- 5 · Die Flag- und Umschalt-Regel (verbindlich)
- 8 · Typografie-Varianten (Pos. 19, entscheidet S2)
- 10 · Test-Preis, Treue-Grenze und Zielzahlen
- 11 · Risiken & Gegenmittel
- 12 · Abnahmekriterien H1 (die drei «5-Minuten-Punkte»)
- 13 · Was diese Fassung gegenüber dem Entwurf ändert
