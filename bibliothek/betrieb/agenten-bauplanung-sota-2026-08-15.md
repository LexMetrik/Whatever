# Agenten-Bauplanung — State of the Art (Recherche 15.8.2026)

**Erstellt:** 15.8.2026 — BAUPLAN-UMBAU (David 15.8.2026, QS-EFFIZIENZ): vor dem Umbau der
Plan-/Fahrplan-Steuerung erst Internet-Inspiration einholen.
**Status:** ERSTRECHERCHE

**Anlass:** BAUPLAN-UMBAU (David 15.8.2026, QS-EFFIZIENZ) — vor dem Umbau
der Plan-/Fahrplan-Steuerung erst Internet-Inspiration einholen.
**Quelle mit Stand:** Web-Recherche 15.8.2026 (Unteragent, Quellen unten).
**Abnahme-Status:** entwurf (Prozess-Recherche, keine Rechtslogik — keine
fachliche Abnahme nötig).

## Befunde

1. **Spec-driven Development (SDD):**
   - *GitHub Spec-Kit* (09/2025, v0.11 06/2026): versionierte
     `constitution.md` mit nicht-verhandelbaren Prinzipien; Drift-Schutz
     über erzwungene Konsistenz, schwergewichtig (~800 Zeilen/Change).
     https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/
   - *OpenSpec*: **Delta-Specs** (nur die Änderung wird beschrieben),
     Drei-Phasen-Modell proposal → apply → archive; die Spec wird beim
     Abschluss konsolidiert statt vorab gepflegt — direktester Treffer für
     «Spec folgt Ist». Leichtgewichtig (~250 Zeilen/Change).
     https://codemyspec.com/blog/openspec-vs-spec-kit
   - *Amazon Kiro* (re:Invent 2025): Specs als «living documentation»,
     Nachführung ereignisgetrieben (Agent Hooks) statt manuell.
     https://aws.amazon.com/documentation-overview/kiro/

2. **Task-Tracking für Agenten:** *Beads* (Yegge, git-versionierte
   Task-Graph-DB, Hash-IDs gegen Merge-Kollisionen) und *Backlog.md*
   (Tasks als Markdown im Repo, Metadaten-Konsistenz erzwungen). Trend:
   git-natives Klartext-Format, Status-Pflege durch den Agenten selbst als
   Teil des Task-Abschlusses, nicht als separate Doku-Pflicht.
   https://github.com/MrLesk/Backlog.md

3. **Arbeitspaket-Grösse:** «smart zone» ≈ erste ~100k Kontext-Tokens;
   Empfehlung vieler Quellen «ein Task pro Session» adressiert
   Kontext-Tokens, nicht fachliche Schrittgrösse — **kein belastbarer
   Konsens** zu optimaler fachlicher Paketgrösse. Robuste Systeme:
   Kompaktierung + externer Fortschritts-Speicher + Sub-Agenten mit
   kompakten Rückgaben. https://willness.dev/blog/one-session-per-task

4. **Doku-Minimalismus:** Empfehlung CLAUDE.md/AGENTS.md < 300 Zeilen
   (ideal < 100), Detail pfad-gescoped (progressive disclosure).
   Studienlage geteilt: JAWs/ICSE-2026-Paper misst −28,6 % Laufzeit /
   −16,6 % Output-Tokens durch AGENTS.md; ETH-Zürich-Studie findet, dass
   **nacherzählende** (v. a. LLM-generierte) Kontextdateien die
   Test-Pass-Rate verschlechtern — nur nicht-ableitbare, handgeschriebene
   Spezifika behalten. https://arxiv.org/abs/2601.20404

## Regel deterministisch (was daraus im Repo verankert wurde, 15.8.2026)

- **Lebendige Spec:** Ist-Abweichung ⇒ Spec sofort korrigieren (datiert),
  nie gegen veraltete Spec bauen — Banner in `scripts/fahrplan-slice.ts`
  (läuft mit jedem Slice aus) + Skill `bauschritt` Station B.
- **Fahrplan-§-Diät** (OpenSpec-Muster «archive on apply»): erledigte §§
  lebender Fahrpläne wandern wörtlich nach `archiv/…-erledigt.md`,
  Stub-Zeile hält den §-Anker — Skill `bauschritt`/aufraeumen.md §4b.
- **Kurzkarte als Session-Karten-Default** (ETH-Befund + eigene Messung
  51 % Doku-Commits seit 1.8. vs. 12,5 % Produkt-Code) — Skill
  `bauschritt` Station E.
- **Gross-Schnitt:** Etiketten-Konsolidierung 15.8. (14 → 5 Dächer),
  Chronik-Block gleichen Datums.

## Geltung/Ausnahmen

Prozess-Wissen, kein Rechtsinhalt. «Ein Task pro Session» wurde bewusst
NICHT übernommen (widerspricht Davids hochkalibriertem Massstab 15.8. —
orchestrierte Session landet mehrere M-Schritte; der Literatur-Punkt
betrifft Kontext-Ökonomie, die hier über Sub-Agenten-Delegation gelöst ist).

## Pflegebedarf

Keiner laufend; bei der nächsten Steuerungs-Grossrevision neu recherchieren
(Feld bewegt sich schnell, Stand 08/2026).
