---
paths:
  - "src/**"
---
# §3 Schichtentrennung: Logik ≠ Darstellung

- **`src/lib/`** enthält die gesamte Rechtslogik und keine UI. Jede Rechtsregel
  lebt an genau **einer** Stelle.
- **`src/pages/`, `src/components/`** enthalten Darstellung, Navigation,
  Speicherung — und keine Rechtslogik: keine Fristberechnung, keine
  Schwellenwerte, keine Normtexte ausserhalb von Schema oder Engine.
- Verkleinerungen (Entdopplung, Hooks, generische Rahmen) finden deshalb in der
  Darstellungsschicht statt. Umbauten der Logikschicht laufen ausschliesslich
  über das Protokoll von §4/§6, nie beiläufig im Zuge einer UI-Verkleinerung.

## Minimalismus ausserhalb der Rechtsschicht

Für alles, was **weder Rechtslogik noch Rechtsdaten** trägt — UI, Navigation,
Speicherung, Infrastruktur-Code — gilt: **so wenig Code wie möglich.**
Bestehende Bausteine wiederverwenden statt neu bauen (§10); keine
spekulativen Props, Optionen oder Abstraktionen für Bedarf, der noch nicht
existiert; die kürzeste Fassung, die der Ist-Fall braucht; beim Anfassen
darf eine Stelle kleiner werden, nie beiläufig grösser. Löschen nur mit
Beweis, dass nichts mehr darauf zeigt.

**Harte Gegen-Grenze:** In der Rechtsschicht (`src/lib/` Rechtslogik,
Schemas, Norm-/Tarif-Daten) gilt das Prinzip NICHT — dort schlägt §1
Korrektheit jede Verkleinerung: lieber 50 Zeilen Duplikat als eine
Abstraktion, die zwei rechtlich verschiedene Fälle stillschweigend gleich
behandelt. Minimalismus ist ein Darstellungs-Prinzip, kein Rechtslogik-Ziel.
