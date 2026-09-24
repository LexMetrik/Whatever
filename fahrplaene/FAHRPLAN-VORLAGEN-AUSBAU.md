# FAHRPLAN VORLAGEN-AUSBAU — Verträge-Rahmen, P1-Vorlagen, Rechner-Erweiterungen
<!-- @lagebild name: Schriften-Baukasten · zweck: Vorlagen für Berufung, BGG-Beschwerde, Sistierung, Beweisverzeichnis. -->

*24.9.2026: `W2·8` ist in `W3-AUSBAU` aufgegangen — Posten dort (ROADMAP-CHRONIK.md, Fusionen 2026-09-24).*

**Heimat: ROADMAP-Schritt `W2·8`.** (Der separat genannte `ROADMAP-Anker: W3-AUSBAU`
unten — Zeile «Vorlagen-Breite», vormals `W3·13`, Etiketten-Konsolidierung 15.8.2026 —
betrifft nur die hier mitgeführte Bürgschaft/Ehevertrag/ABV-Planung, nicht
die Heimat dieser Datei selbst.)

> **§14-gebündelt (Phase 0, 2.7.2026):** **Einzige Planungs-Heimat für Bürgschaft/Ehevertrag/ABV**
> (V5/V6). Die entsprechenden `FAHRPLAN-VERTRAGS-VARIANTEN.md`-Punkte (F/H/I) sind nur Verweis.
> ROADMAP-Anker: `W3-AUSBAU`, Zeile «Vorlagen-Breite» (vormals `W3·13`,
> Etiketten-Konsolidierung 15.8.2026).

**Quelle:** Wettbewerbsanalyse 12.6.2026
(`bibliothek/recherche/wettbewerbsanalyse-rechtswissen-schweizer-vertraege.md`,
Auftrag David `PROMPT-wettbewerbsanalyse.md`). **Stand: IN ARBEIT**
(Abarbeitungs-Stand am Dokumentende) — jede Phase ist ein eigener, an
Claude Code übergebbarer Schritt. Davids P1-Abnahme der Analyse ist am
12.6.2026 erfolgt (`abnahme/wortlaute-2026-06/PAUSCHALABNAHME-2026-06-12.md`).

**Leitplanken (jede Phase):** Normentreue §7 (alle [VF]-Anker empirisch am
Fedlex-Cache, Unsicheres als `// VERIFY:`) · Determinismus §2 (kein LLM) ·
eine Engine pro Rechtsgebiet §4 (KEINE Fusion verschiedener Vertragstypen
in ein Schema; Varianten nur innerhalb desselben Typs) · SSoT §5 (Katalog
nur `startseiteConfig.ts`, Inhalt nur `src/lib/vorlagen/<schema>.ts`,
`ausgabeArt` NUR im Schema) · neue Einträge starten `geplant`, gebaut =
`entwurf`, NIE `geprüft` ohne Davids Abnahme · Form-Gate je Vorlage über
`ausgabeArt` (`fertig`/`abschrift`/`entwurf`) · Design R1–R12 bzw.
Wizard-Muster, neue Strings Halbgeviert/U+2019.

**Proof-Workflow vor JEDEM Commit (volle Ausgabe bei Rot):** `npx tsc -b` ·
`npm test` · `npm run golden:vergleich` · `npm run lint` · `npm run check`
(Routine grün: `npm run gate`). Golden-Erweiterungen (`npm run golden`) nur
mit Begründung im selben Commit. **Kein `git push`, kein Deploy ohne Davids
ausdrückliches frisches Ja (§9).**

**Reihenfolge-Begründung:** V1 zuerst (der Rubrik-Rahmen ist Voraussetzung,
damit neue Vorlagen sofort auffindbar einsortieren — Empfehlung des
Auftrags); dann V2 (kleinste P1-Vorlagen = schnelle Praxis-Treffer, testen
den BO-Baustein-Rahmen), dann V3 (Vertrags-Grundtypen, brauchen V1-Rubriken
4/7), dann V4 (Detailgrad-Schalter braucht gebaute Verträge als Pilot),
V5/V6 danach (Form-Weiche bzw. grosser Einzelposten), V7 unabhängig
(Rechner-Erweiterungen, jederzeit einschiebbar). Abhängigkeiten: V3→V1,
V4→V3 (Pilot Arbeitsvertrag geht schon nach V1), V5/V6→V1; V0 ist
Pflichtteil JEDER bauenden Phase.

---

> Erledigt-/Stand-Abschnitte vom 14.8.2026 nach `archiv/FAHRPLAN-ERLEDIGT-ABSCHNITTE.md` verschoben (QS-PLAN-EINFACH).

## §0 · Zweck

Detailquelle zu `W2·8` — Verträge-Rahmen, P1-Vorlagen und Rechner-Erweiterungen
nach Wettbewerbsanalyse 12.6.2026. Leitplanken (jede Phase): Normentreue §7 ·
Determinismus §2 (kein LLM) · eine Engine pro Rechtsgebiet §4 · SSoT §5 · neue
Einträge starten `geplant`, gebaut = `entwurf`, nie `geprüft` ohne Davids Abnahme.

---

## §1 · ROADMAP-Spec W2·8 (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «V8 — Zitat-Export & Fussnoten-Ausgabe» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

    Ein-Klick-Zitat in korrekter amtlicher Form (`BGE 148 III 1 E. 2.3` · `BGer 5A_691/2023 vom …`)
    plus **Word-Fussnoten-Export** einer gesammelten Zitatliste. **Baut auf** fertigem Bestand:
    `src/lib/gerichtszitat.ts` (deterministischer BGE/BGer-Formatierer),
    `src/lib/rechtsprechung/ecli.ts` (ECLI-Minting), `src/lib/rechtsprechung/zitat-extraktion.ts`,
    `src/components/useKopieren.ts`, `src/lib/vorlagen/vorlagenDocx.ts` (produktiver docx-Renderer, `docx ^9.7.1`) und dem
    bereits gebauten Gerichts-Baustein-Set aus `W2·7` (Zitierer + Rubrum). **Feasibility 🟢
    aus-Bestand:** nur ein **dünner Renderer** (docx-Fussnoten über die vorhandenen
    `gerichtszitat`/`ecli`-Ausgaben) + Verdrahtung an Entscheid- und Norm-Ansichten — keine neue
    Abhängigkeit, kein neues Fundament. Detail in `FAHRPLAN-VORLAGEN-AUSBAU.md`. **DoD:** golden
    byte-gleich · Zitierform stichprobenweise gegen die amtliche Fundstelle geprüft · Tore grün.
    Trailer `Roadmap: W2·8`.

---


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

12 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-VORLAGEN-AUSBAU.md`](../archiv/fahrplaene/FAHRPLAN-VORLAGEN-AUSBAU.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- V0 (Pflicht-Vorschritt jeder Phase) — Normrecherche
- V1 — Verträge-Rubriken + Form-Gate-Anzeige (Rahmen, Ziel C)
- V2 — Kleine P1-Erklärungen & Eingaben (4 Stück)
- V3 — Vertrags-Grundtypen (Auftrag · Werkvertrag · NDA · Konkubinat)
- V4 — Detaillierungsgrad-Schalter (Pilot)
- V5 — Form-Weichen-Vorlagen (P2-Start: Bürgschaft, Ehevertrag)
- V6 — Aktionärbindungsvertrag (grosser Einzelposten, Sektion IV)
- V7 — Rechner-Erweiterungen (unabhängig einschiebbar)
- Aufträge David 12.6.2026 (im Chat, nach Plan-Erstellung — eingeschoben)
- Davids Entscheide vor Start (Entscheidvorlage)
- V8 — Zitat-Export & Fussnoten-Ausgabe (`W2·8`, Ideen-Intake 20.7.2026)
- V9 — Vorsorgeauftrag-Ausbau (Nachtlauf 2./3.8.2026, unter `W2·8`)
