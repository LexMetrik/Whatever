---
paths:
  - "src/**"
---
# §3 Schichtentrennung: Logik ≠ Darstellung
<!-- @wiedervorlage: 2027-02-14 -->

<!-- Wortlaut unverändert aus CLAUDE.md §3 hierher verschoben (QS-HOOKS-AUSBAU
     14.8.2026). Lädt pfad-gescoped bei Berührung von src/** — Doku-Sessions
     tragen die Regel nicht mehr im Grundrauschen. §-Nummer bleibt vergeben. -->

- **`src/lib/`** enthält die gesamte Rechtslogik und keine UI. Jede Rechtsregel
  lebt an genau **einer** Stelle.
- **`src/pages/`, `src/components/`** enthalten Darstellung, Navigation,
  Speicherung — und keine Rechtslogik: keine Fristberechnung, keine
  Schwellenwerte, keine Normtexte ausserhalb von Schema oder Engine.
- Verkleinerungen (Entdopplung, Hooks, generische Rahmen) finden deshalb in der
  Darstellungsschicht statt. Umbauten der Logikschicht laufen ausschliesslich
  über das Protokoll von §4/§6, nie beiläufig im Zuge einer UI-Verkleinerung.

## Minimalismus-Prinzip ausserhalb der Rechtsschicht (Auftrag David 14.8.2026)
<!-- @wiedervorlage: 2027-08-14 -->

Für alles, was **weder Rechtslogik noch Rechtsdaten** trägt — UI, Navigation,
Speicherung, Infrastruktur-Code — gilt: **so wenig Code wie möglich.**
Konkret: bestehende Bausteine wiederverwenden statt neu bauen (Skill
`auftrag` Ziff. 8); keine spekulativen Props, Optionen oder Abstraktionen
für Bedarf, der noch nicht existiert; die kürzeste Fassung, die der Ist-Fall
braucht; beim Anfassen einer Stelle darf sie kleiner werden, nie beiläufig
grösser (Wächter: `check:schlankheit`; Löschen nach dem Streich-Massstab in
`bauschritt`/aufraeumen.md — Beweis vor Löschung).

**Harte Gegen-Grenze:** In der Rechtsschicht (`src/lib/` Rechtslogik,
Schemas, Norm-/Tarif-Daten) gilt das Prinzip NICHT — dort schlägt §1
Korrektheit jede Verkleinerung: lieber 50 Zeilen Duplikat als eine
Abstraktion, die zwei rechtlich verschiedene Fälle stillschweigend gleich
behandelt. Minimalismus ist ein Darstellungs-Prinzip, kein Rechtslogik-Ziel.
