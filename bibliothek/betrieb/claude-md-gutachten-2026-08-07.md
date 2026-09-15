# CLAUDE.md-Gutachten 7.8.2026 (unbefangenes Fremd-Review)

**Erstellt:** 7.8.2026 — Auftrag David: CLAUDE.md unbefangen prüfen, «so als hättest du es
noch nie gesehen … ob regeln wirklich alle sinn ergeben».
**Status:** ERSTRECHERCHE

**Anlass:** Auftrag David 7.8.2026: «claude.md prüfen so als hättest du es noch
nie gesehen … ob regeln wirklich alle sinn ergeben». **Methode:** Frisch
gestarteter Prüf-Agent (Fable, spitze) ohne Session-Vorwissen und ohne Kenntnis
der parallelen Ent-Regulierungs-Analyse; Prüfobjekt war der Stand von `main`
(90df6d494, VOR den Änderungen dieses Tages); Behauptungen stichprobenartig am
Repo verifiziert (ESLint-§2-Durchsetzung, §-Anker, Skript-Existenz, 178
gemessene §-Verweise).

## Ergebnis

**Note: «gut mit Verbesserungen — nahe an optimal».** 15 von 18 Paragraphen:
unverändert behalten. Tragendes Lob: Die Regeln sind grossteils **maschinell
durchgesetzt statt nur behauptet** (§2 als Lint-Regel, >60 Tore, §14.7 durch
`check:dispatch-klausel` gewacht); die Schnittführung Invarianten ↔ Skills ist
konsequent; die wertvollste Einzelregel ist §6.7 («ein Tor, das nicht scheitern
kann, ist gefährlicher als keines»).

## Befunde und Umsetzung (alle fünf am 7.8.2026 umgesetzt, `53fb09e9d`)

1. **Defekt (mittel-hoch):** Skill `gegenpruefung` lag nur in `~/.claude/`
   (Davids Maschine) — der §9-Risikopfad-Prozess brach auf jeder anderen
   Maschine ins Leere. → Ins Repo eingecheckt. *Deckungsgleich mit dem
   Ent-Regulierungs-Befund desselben Tages — zwei unabhängige Prüfer,
   derselbe Spitzenfund.*
2. **Widerspruch §3↔§4:** «Die Logikschicht wird dabei nie berührt» kollidierte
   mit der §4-erlaubten Engine-Verschmelzung. → Präzisiert: Umbauten der
   Logikschicht ausschliesslich über das Protokoll §4/§6.
3. **Lücke:** Keine Geheimnisse-Invariante. → Neuer §18 (nie in Repo/Log/
   Agenten-Auftrag; committet = kompromittiert = rotieren; lädt nie lazy).
4. **Token-Ballast:** §17-Anekdote auf zwei Zeilen gestrafft (Detail: Skill
   `lehren`); §16 war am selben Tag bereits gekürzt; Intro-Doppelung entfernt.
5. **Prüfenswert, offen:** Sprachfestlegung fehlt im Projekt-Regelwerk (hängt
   heute an Davids globaler CLAUDE.md) — bewusst NICHT umgesetzt, da alle
   Sessions über Davids Konto laufen; Kandidat, falls je CI-/Fremd-Agenten
   direkt auf dem Repo arbeiten.

## Nicht beurteilt (Grenzen des Gutachtens)

Skill-Inhalte im Detail (nur 2 von 10 stichprobiert) · historische
§6.7-Erfüllung je Tor · fachjuristische Richtigkeit der Invarianten ·
inhaltliche Treffsicherheit aller 178 §-Verweise.

**Status: einfach belegt** (Fremd-Review + Umsetzungs-Commit; Zweitmeinung wäre
ein erneutes Review nach 6 Monaten — Cherny-Rhythmus, vgl.
[entregulierung-2026-08-07.md](entregulierung-2026-08-07.md)).
