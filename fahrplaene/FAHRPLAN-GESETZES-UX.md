# FAHRPLAN Gesetzes-UX — Darstellungs-Reglement, Leser-Kopf, Übersichten, Klassifikation
<!-- @lagebild name: Gesetze lesen · zweck: Der Gesetzes-Leser: Bundesrecht bequem lesen — Inhaltsverzeichnis, Suche im Gesetz, Anhänge, Druck. -->

> **Eingefroren 5.10.2026:** Spezifikation, kein Bau-Stand; Fortschritts-Häkchen werden nicht mehr nachgeführt; Entscheidtabellen gelten unverändert.

Stand: 4.7.2026 · Auftrag David «Gesetzesdarstellung & UX». Leitlinie: **User
Experience, State-of-the-Art-Webdesign — Fedlex ist die Mindestlatte, nicht die
Decke.** Methode David (wörtlich): «erruierst du was es für verschiedene
grundarten gibt, klassifizierst die erlasse und machst für jedes einzelne die
passende designvorschrift».

Diese Datei ist die **einzige Detailquelle** (§14) für den ROADMAP-Schritt
`W2·5d` (Abschnitt 8). Sie ist Bau-Spec: Opus baut ohne Rückfragen aus ihr. Das
Verbindliche ist der Code/die Daten; alle Werte binden an bestehende Tokens
(`src/index.css`, `tailwind.config.js`) — neue Tokens nur, wo heute ein
**untokenisierter/arbitrary** Wert steht (namentlich ausgewiesen und empirisch
belegt).

**Fahrplan-§-Diät 15.8.2026 (`aufraeumen.md` §4b):** die Ausführungsvermerke der §10-Einheiten
(§10.7) stehen im vollen, unveränderten Wortlaut in
[`archiv/FAHRPLAN-GESETZES-UX-erledigt.md`](../archiv/FAHRPLAN-GESETZES-UX-erledigt.md); im
Fahrplan hält eine Stub-Zeile den §-Anker. §11.10 (Ausführungsvermerke §11) blieb **bewusst
hier** — der offene Teilschritt `W2·5d-YC` (§18-Bereich, «`/international` Stufe 2») führt sie
als Detailquelle.

Evidenz-Anhang (nicht nochmal hier aufgeführt): Ist-Aufnahme + Fedlex-Messwerte
+ SotA-Patterns + Grundarten-Klassifikation liegen in
`docs/ux-audit-2026-07/` (`reader/`, `uebersichten/`, `fedlex/`,
`erlass-klassifikation.json`, `reader/measure.mjs`). Die Kritik-Runde
(Abschnitt 0) ist zusätzlich am Code verifiziert (Datei:Zeile in der Konsequenz-
Spalte).

---

## §18 · ROADMAP-Spec W2·5j-TABELLEN (wörtlich verschoben 31.7.2026)

*Nachzug 15.8.2026 (Etiketten-Konsolidierung BAUPLAN-UMBAU): Das Etikett `W2·5j-TABELLEN` ist
aufgegangen — bauender Schritt dieser Spec ist seither `W2·5g-ZEIT` (Dach Gesetzesdaten), die
Zeile «Tabellen in Gesetzen lesbar machen» steht dort als Checklisten-Eintrag. **Trailer also
`Roadmap: W2·5g-ZEIT`**, nicht der in den wörtlichen Blöcken unten zitierte Alt-Trailer.
Gegenstand, Risikopfad-Einstufung und die Grenze zu `W2·13-KANTONE-K7` unverändert.*

> **→ Bau-Spec: «14 · Tabellen in Gesetzen lesbar machen» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

  Beispiel `/gesetze/kanton/BS-154.810#art-29`. **Datenlage erhoben — die Daten sind GUT:** strukturiert als
  Block-Feld `mehrspaltig` mit `spalten[{typ,titel}]` + `zeilen[[…]]`. Es ist ein **reines Darstellungs-
  Problem**, keine Extraktions-Lücke — darum bewusst **nicht** mit `W2·13-KANTONE` (Extraktionstiefe)
  gebündelt: andere Risiko-Klasse (§14.2). **Fläche: 656 `mehrspaltig`-Blöcke in 137 Erlassen** (VTS 68 ·
  CHEMRRV 31 · VZV 30 · NBV 26 · VVV 25 · LRV 21). **Beim Bau zu beachten:** Lesespalte 42rem vs. breite
  Tarif-Tabellen · §15.1 (kein DOM-Entfernen; Ctrl+F und Print müssen vollständig bleiben) · Mobil @390.
  **Parkgrund, ehrlich:** kein technischer Blocker — David hat den Punkt am 20.7. ausdrücklich zurückgestellt.
  Umparken auf `ready` ist ein Einzeiler, sobald er ihn zieht. Trailer `Roadmap: W2·5j-TABELLEN`.

### §18-N · ROADMAP-Spec W2·5j-TABELLEN — Nachzug (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)

*Herkunft: `ROADMAP.md`, Welle 2, Schritt `W2·5j-TABELLEN` — AP-11 rückwirkend angewandt
(ROADMAP-Diät Welle 3, 4.8.2026). Der Wortlaut unten entstand nach Anlage von §18 (31.7.2026) und
hebt den dort noch dokumentierten Parkgrund auf. In der ROADMAP bleiben Titel, `@meta`, der
steuernde Kurzabsatz und der Pointer hierher. Steuert nicht — Spec-Heimat.
**→ Bau-Spec: §18 dieser Datei + die drei Detailquellen unten.***

  **Anlass der Entparkung:** der Blocker `david-spaeter-tabellen` war **kein technischer** — Daten und
  Weg sind seit 20.7.2026 geklärt (656 `mehrspaltig`-Blöcke in 137 Erlassen); er hing allein an Davids
  «später», und das ist am 3.8.2026 aufgehoben. Kein Bau-Vorlauf nötig.
  **Grenze zu `W2·13-KANTONE-K7` (PDF-Werkstatt):** dieser Schritt macht **erkannte
  `mehrspaltig`-Blöcke lesbar** (Tabellen-Semantik + Darstellung); K-7 repariert die **PDF-Extraktion
  davor** (Dehyphenations-Gate, VD/SZ/ZH). Wer an `adapter-pdf.ts` die Texterkennung ändert, ist in
  K-7, nicht hier.
  **Detailquellen (fertige Implementation Plans, gestuft):**
  [Stufe 1 · Füllpunkt-Zweispalter (SG)](../docs/superpowers/plans/2026-06-22-kantonale-tarif-tabellen.md) ·
  [Stufe 2 · Mehrspalten-Tarif-Tabellen (ZH § 4 x-geometrisch, Klasse A NW/BS/SO/VS)](../docs/superpowers/plans/2026-06-22-mehrspalten-tarif-tabellen.md) ·
  [Design-Spec (3 Defektklassen, Ansatz «Generator-Extrakt, gestuft» — von David gewählt)](../docs/superpowers/specs/2026-06-22-kantonale-tarif-tabellen-design.md).


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

18 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-GESETZES-UX.md`](../archiv/fahrplaene/FAHRPLAN-GESETZES-UX.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- 0 · Kritik-Einarbeitung (Council-/Review-Runde, verifiziert)
- 1 · Architektur-Entscheid: WOHIN das Reglement gehört
- 2 · Darstellungs-Reglement Gesetze
- 3 · Leser-Kopf: Options-Leiste
- 4 · Übersichten Bund + Kantone
- 5 · Klassifikation produktiv machen
- 6 · Etappierung (PR-grosse Schritte)
- 7 · Bewusst NICHT (Scope-Grenzen)
- 8 · ROADMAP-Schritt-Text (zum Einfügen in ROADMAP.md, Welle 2)
- 9 · Opus-Bauauftrag — erster PR (G0)
- 10 · Anmerkungs-Welle A1–A18 (David, 5.7.2026) — revidierte Bau-Spec
- 11 · Gesetze-Aufteilung Bund/Kantone V2 — «Erfassungsgrad-Staffel» (VERBINDLICHE Bau-Spec, 16.7.2026)
- 12 · Fedlex-eId-Anker & Verifizier-Deep-Links (Intake, Live-Verifikation 17.7.2026)
- 13 · Gesetzes-Webseite UX-Pass «8b» (`W2·5h-GESETZ-UI`, Ideen-Intake 20.7.2026)
- 14 · Tabellen in Gesetzen lesbar machen (`W2·5j-TABELLEN`, §14-Intake 20.7.2026)
- 15 · Gesetzes-Kopfzeile & Gliederungs-Default (`W2·5h-GESETZ-UI`, §14-Intake 24.7.2026)
- §16 · ROADMAP-Spec W2·5d (wörtlich verschoben 31.7.2026)
- §17 · ROADMAP-Spec W2·5h-GESETZ-UI (wörtlich verschoben 31.7.2026)
