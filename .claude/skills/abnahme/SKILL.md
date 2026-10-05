---
name: abnahme
description: Verwenden, wenn ein Katalog-Eintrag fachlich abgenommen werden soll — Trigger «Abnahme», «abnehmen», «geprüft setzen», «verified:true», «Abnahme-Paket», «Protokoll nach SCHEMA.md» — oder bevor «geprüft»/verified:true an einer Engine oder Norm gesetzt wird. Argument: Karten-ID (aus startseiteConfig).
---

# Abnahme-Paket für David (fachkundige Person)

Ziel: Davids Review-Zeit ist der Engpass des Projekts («Bau-Rate ≤
Abnahme-Rate»). Dieser Skill legt ihm ein vollständiges, prüffertiges
Paket vor — er soll nur noch lesen und entscheiden, nichts suchen müssen.

Verbindlich: `abnahme/SCHEMA.md` (Pflichtteile, Regeln) und
`abnahme/VORLAGE.md` (Protokoll-Format). Das Gate
`src/tests/abnahmeGate.test.ts` bricht die Suite, wenn «geprüft»/
`verified:true` ohne Protokoll gesetzt wird — Reihenfolge daher immer:
erst Protokoll, dann Status.

## Phase 1 · Paket erstellen (ohne Davids Zutun)

Für die Karten-ID aus `src/lib/startseiteConfig.ts`:

1. **Bausteine wortwörtlich:** Bei Vorlagen jeden Text-Baustein verbatim
   auflisten (Muster: `npm run abnahme:ag` erzeugt die Liste bei Bedarf —
   sie liegt seit 14.8.2026 nicht mehr im Bestand, sondern ist gitignoriert;
   für andere Schemas analog generieren, nicht abtippen). Bei Rechnern:
   alle Ergebnis-Sätze, Warnungen, Annahmen-Zeilen und Hinweise der
   Engine (aus den Golden-Outputs ziehen, nicht aus der UI abschreiben).
2. **Normgrundlage als Tabelle:** jede tragende Norm mit ELI + Stand aus
   `scripts/fedlex-cache.sh`; je Norm den Fedlex-Link (Anker-Format
   `art_x`) DANEBEN, damit David direkt vergleichen kann. Vermerken, ob
   der Wortlaut in dieser Session gegen den Cache gelesen wurde
   (Anker-Count des Caches vorher prüfen — SPA-Shell-Falle).
3. **Golden-Referenzfälle:** vorhandene Akzeptanztests mit amtlichem
   Beleg auflisten (Testdatei nennen). Fehlt ein Fall mit amtlich
   belegtem Erwartungswert (BGE, Merkblatt, amtliches Beispiel), einen
   recherchieren und als Test ergänzen — ohne ihn ist das Protokoll
   nach SCHEMA.md Ziff. 3 unvollständig.
4. **Edge-Case-Checkliste** je Engine-Typ (SCHEMA.md Ziff. 4) mit dem
   Ist-Befund je Punkt (Test vorhanden / Sweep deckt ab / offen).
5. **Offene Annahmen & Known Limitations** aus Engine-Kommentaren,
   Dossiers (`bibliothek/`, `// Dossier:`-Kopf) und STRUKTUR.md sammeln
   — inklusive der als «fachliche Aussage Claude, Abnahme offen»
   markierten Entscheide, die diese Karte betreffen.
6. Paket als EINE Markdown-Datei ablegen: `.scratch/abnahme-paket-<id>.md`
   (nicht ins Repo committen — das committete Artefakt ist später das
   Protokoll). David den Pfad nennen und die 3–5 wichtigsten
   Entscheidpunkte im Chat zusammenfassen.

## Phase 2 · Davids Entscheid einarbeiten

**Gate — Phase 2 startet NUR, wenn David ein ausdrückliches Verdikt
(abgenommen / mit Auflagen / zurückgewiesen) zu GENAU dieser Karte
geliefert hat.** Kein Verdikt = Phase 1 ist der fertige, abgeschlossene
Stand; nicht warten, nicht erinnern, nicht drängen (David nimmt selbst ab —
unbefristete Daueranweisung; zusätzlich hat er bis 1.12.2026 keine
Abnahme-Zeit, fahrplaene/FAHRPLAN-LERNPHASE-2026.md). Selbstabnahme heisst: David
nimmt ohne Zweitperson ab — nie die Abnahme im Namen Davids oder als
Agent verfassen.

Nach seinem Verdikt (abgenommen / mit Auflagen / zurückgewiesen):

1. Auflagen/Befunde zuerst umsetzen (deklarierte fachliche Änderungen,
   CLAUDE.md §6: eigener Schritt mit Begründung; Golden danach neu
   deklariert).
2. Protokoll `abnahme/<karten-id>.md` nach VORLAGE.md ausfüllen —
   Prüfer David Graf (Jurist, Anwaltsprüfung BS), Abnahme-Art ehrlich
   (Selbstabnahme, Zweitprüfung ausstehend, sofern keine Zweitperson).
3. Erst dann Status heben: Karte auf `geprüft` in startseiteConfig,
   betroffene `verified:true` in den Norm-/Schema-Daten.
4. Tore: `npm test` (abnahmeGate!) · `npm run lint` · `npx tsc -b` ·
   `npm run golden:vergleich`.
5. Commit mit Pathspec.

## Regeln

- NIE `verified:true`/«geprüft» ohne Davids ausdrückliches Verdikt zu
  GENAU dieser Karte setzen (CLAUDE.md §7) — auch nicht teilweise.
- Red Flags — alle bedeuten: STOPP, Status NICHT setzen, Paket abliefern,
  auf Davids Verdikt warten (ohne zu drängen): «David sagte mach fertig»
  ist kein dokumentiertes Verdikt · «Selbstabnahme ist ja zulässig» → gilt
  für David, nicht für dich · «ich entblocke nur schnell / spare Davids
  Zeit» → Paket abliefern und stehen lassen · «teilweise geprüft reicht»
  → nein.
- Eine fachliche Änderung nach Abnahme macht das Protokoll ungültig
  (Status fällt auf `entwurf`, SCHEMA.md).
- Reihenfolge der Abnahme-Kandidaten: Rangliste in KATALOG-ROADMAP.md
  (G1-Priorisierung), sofern David nichts anderes verlangt.
