# Skill-Diät 8.8.2026 (QS-SKILL-DIAET) — Konsolidierungs-Protokoll

**Erstellt:** 8.8.2026 — ROADMAP-Schritt `QS-SKILL-DIAET` (Entscheid David 7.8.2026):
vier Skills mit demselben Übergang Bau → Landung → Abschluss auf zwei konsolidieren.
**Status:** ERSTRECHERCHE

**Auftrag:** ROADMAP-Schritt `QS-SKILL-DIAET` (Entscheid David 7.8.2026;
leichter Pfad + Weiterbau-Regel: Entscheide David 8.8.2026). Vier Skills, die
denselben Übergang Bau → Landung → Abschluss regelten (`bauschritt`-D/E,
`landung`, `deploy-check`, `aufraeumen`), sind auf **zwei** konsolidiert —
**kein Regelverlust**, jede nicht wörtlich übernommene Zeile mit
Löschkriterium (unten).

**Mess-Korrektur:** Der Schritt schätzte «~1500 Z.»; der reale Bestand am
8.8.2026 war **663 Zeilen** (bauschritt 111 · landung 165 · deploy-check 203 ·
aufraeumen 184) — die Schätzung stammte offenbar aus einem älteren Stand oder
zählte Nachbartexte mit. Abweichung nach §7 offengelegt.

## Ziel-Struktur

| Vorher (4) | Nachher (2) |
|---|---|
| `bauschritt` (Session-Zyklus) | **`bauschritt`** — Zyklus A→E, neu mit Pfadwahl (leichter Pfad), Station W (Weiterbau) und `aufraeumen.md` als On-Demand-Referenzdatei |
| `aufraeumen` (Steuer-Doku-Rotation) | in `bauschritt/aufraeumen.md` aufgegangen (lädt nur bei gerissenem Budget, nicht in jeder Bau-Session — das ist die Diät) |
| `landung` (Merge-Mechanik, §12) | **`landung`** — trägt jetzt §12 UND §9: Merge- und Deploy-Disziplin in einem Text (jede Landung braucht beides) |
| `deploy-check` (§9-Deploy-Ritual) | in `landung` aufgegangen |

Grundsatz seither (Entscheid David 7.8.2026): **neue Regeln nur als Tor/Hook,
nie als Prosa.**

## Neu kodifiziert (Zuwachs, kein Umzug)

- **Leichter Pfad** (`bauschritt` ▶ Pfadwahl): sortenreine
  Nicht-Risiko-Fix-Batches fahren kurzen Einstieg (plan-Stand inkl.
  ready-now-STOPP-Regel + wip + Branch) und kurzen Abschluss (Karten-Zeile,
  Rotations-Check, plan:bild, Flächen abräumen, kurzer Klartext-Schluss);
  **Tore identisch in beiden Pfaden** — auch `struktur-rotieren.py --check`
  bleibt (Gegenprüfungs-Befunde 3/4). Ausdrücklich entfallen NUR Prosa-Posten:
  Grössen-Prosa, Spec-Slice (Checklisten-Zeile ist die Spec), volle
  Session-Karte, Memory-Hygiene-Durchsicht, ausführlicher Schlusssatz;
  §17 bleibt bedingt (Lehre aufgekommen ⇒ verankern).
- **Weiterbau-Regel** (`bauschritt` ▶ Station W): (a) selbe Dach-Checkliste ·
  (b) oberster ready-Schritt gleicher Risikoklasse im selben Wirkungsbereich ·
  (c) Abschluss; je Weiterbau wip + volle Sorgfalt + eigener Trailer, Schluss
  bevor der Kontext zur Neige geht. Der generierte Bau-Prompt trug die Regel
  interimistisch als Ziff. 7 (`scripts/plan/bildSeiten.ts`); mit dieser
  Landung ist die Interims-Klausel dort entfernt — der Skill ist die eine
  Quelle (§5). **Tor statt Prosa-Vertrauen** (Gegenprüfungs-Befund 7): ein
  Test in `src/tests/plan-bild-lage.test.ts` prüft positiv, dass Station W
  alle Regel-Elemente trägt — die Prompt-Streichung kann nicht mehr still
  zum Regelverlust werden.

## Zeilen-Konkordanz (Löschkriterium je Zeile)

Massstab: *verschoben* = wörtlich oder sinnerhaltend übernommen; *dedupliziert*
= Regel existiert im Zieltext genau einmal, zweite Fundstelle gestrichen;
*abgelöst* = Regel durch dokumentierten Entscheid ersetzt. Alles nicht
Aufgeführte ist 1:1 verschoben.

### `deploy-check/SKILL.md` (203 Z.) → `landung/SKILL.md`

| Quelle | Verbleib |
|---|---|
| Frontmatter/Trigger | in `landung`-description fusioniert |
| Kopf «Dieser Skill IST §9» + Altstand-Warnung | verschoben (jetzt «§12 UND §9», Altstand-Warnung um deploy-check-Erinnerung erweitert) |
| Kernmodell Weg 1 | verschoben (Kopf) |
| 0.1 `git status`/Pathspec/kein stash/kein amend | verschoben (Vorbedingung 1) — nach Gegenprüfungs-Befund 2 wieder **unbedingt** formuliert («NIE stash, NIE amend»), §12.2 (bedingte Fassung) ist das Minimum |
| 0.2 Review-Schrott · 0.3 untracked Ballast | verschoben (Vorbedingungen 2–3) |
| 1 Tore-Batterie samt vier Anmerkungen | verschoben (Abschnitt 1) — Lighthouse-Verweis «Schritt 4 Punkt 4» redaktionell auf «Nachkontrolle Punkt 4» angepasst |
| 2 Bug-Check §9 | verschoben (Abschnitt 2) |
| 3 Push-Freigabe, Live-Gang-Entscheid, --auto-Zünder, rote-PR-Verbot, main-Direktpush, Doppel-Deploy-Verbot, bewusste Grenze | verschoben (Schritt 7 der seriellen Landung) |
| 3 Befehlsblock «gh pr merge --auto --merge (Daueranweisung 30.6.)» | **abgelöst/versöhnt:** stand im dokumentierten Widerspruch zu landung-alt Schritt 7 «KEIN --auto, solange Required Checks nicht neu gesetzt» (Reglement-Audit 7.8.2026, Befund «Altstände»). Zieltext trägt beide Regeln mit Vorrang: manuell mergen, solange der David-Handschritt offen ist; wo --auto zulässig ist, gilt die Zünder-Regel unverändert. `gh pr create` (Gegenprüfungs-Befund 1) verschoben in Schritt 7 |
| Risiko-Pfad-Sperre + dreifache Rückendeckung + Vorfall #309 | verschoben (eigener Abschnitt); #309-Erzählung **dedupliziert** (stand doppelt: hier + landung-alt 6b) |
| Ausnahme manueller Deploy | verschoben |
| Rationalisierungen-Tabelle (8 Zeilen) | verschoben; +1 neue Zeile (deploy-check-Erinnerung = Altstand) |
| Red Flags (7) + Buchstabe=Geist | verschoben |
| 4 Nachkontrolle 1–6 | verschoben; 4.5 um landung-alt-Schritt-7-Aufräumsatz ergänzt (dedupliziert) |

### `landung/SKILL.md` alt (165 Z.) → `landung/SKILL.md` neu

| Quelle | Verbleib |
|---|---|
| Kopf «Deploy-Sorgfalt … (Skill deploy-check); dieser Skill ist die Merge-Mechanik davor» | **abgelöst:** die Zwei-Skill-Arbeitsteilung existiert nicht mehr; Sorgfalts-Regel selbst steht im Kernmodell |
| §12-Block (Regeln 1–4) | verschoben, unverändert; 3. «Skill deploy-check»-Verweis → «Ausnahme manueller Deploy unten» |
| Voraussetzung git-setup + «EIN Kommando aufs Mal» | verschoben (Vorbedingungen bzw. Abschnitt-3-Titel) |
| Schritte 1–6, 6b, 8, 9 | verschoben (Nummern erhalten); in 6b die #309-Fussnote **dedupliziert** (Verweis auf Risiko-Sperre-Abschnitt), Merge-Schutz-Satz dort |
| Schritt 4 Konfliktmatrix | verschoben, unverändert |
| Schritt 7 «Manuell mergen … KEIN --auto … Danach Worktree/Branch aufräumen» | Merge-Teil verschoben (Schritt 7, mit Zünder-Versöhnung s. o.); Aufräum-Teil **dedupliziert** in Nachkontrolle 5 |

### `aufraeumen/SKILL.md` (184 Z.) → `bauschritt/aufraeumen.md`

| Quelle | Verbleib |
|---|---|
| Frontmatter/Trigger | in `bauschritt`-description fusioniert — nach Gegenprüfungs-Befund 5 vollständig, inkl. «ROADMAP zu gross» und «Steuer-Doku verschlanken»; Lade-Anlass zusätzlich im Datei-Kopf |
| Kopf, Abschnitte 1–5, Nachbar-Skills, Wann NICHT | verschoben, wörtlich; nur redaktionell: «dieser Skill» → «diese Datei», Abschnittstitel «Nachbar-Skills» → «Nachbar-Instrumente» |

### `bauschritt/SKILL.md` alt (111 Z.) → neu

| Quelle | Verbleib |
|---|---|
| «Eine Session = ein Arbeitspaket» | **abgelöst** durch Entscheid David 8.8.2026 (Weiterbau): jetzt «Eine Bau-Einheit = ein Schritt» + Station W |
| Station A 1–6 | verschoben; im Grössen-Check die versprengte Schätz-Satzstellung redaktionell geheilt (Satz stand mitten im «Zu klein»-Punkt) |
| Station B | verschoben; Nebenfund-Regel um Checklisten-Zeilen-Vorrang ergänzt (Entstückelung, Skill `auftrag` Ziff. 3 — Verweis, kein Duplikat) |
| Station C | verschoben, unverändert |
| Station D Status-schliessen-Block («Ein wip, das die Session überlebt …») | **dedupliziert:** Regel + Realfall-Beleg stehen in `landung` Schritt 9; Station D behält die Pflicht als Satz mit Verweis |
| Station E Checkliste | verschoben; Rotations-Posten zeigt auf `aufraeumen.md` statt Skill `aufraeumen` |
| Token-Regeln | verschoben, unverändert |

## Verweis-Nachzug (lebende Texte)

`CLAUDE.md` §9/§12 + «Wo der Rest steht» · `PROJEKTBESCHRIEB.md` ·
korpus-werkstatt (SKILL.md, review.md, methodology/normtext.md,
tools/normtext-pipeline.md, tools/rechtsprechung-pipeline.md,
tools/verifikation.md) · `scripts/check-perf-budget.ts` (Kommentar) ·
Fahrpläne PERFORMANCE/VERZAHNUNG-UI/MATERIALIEN-VERZAHNUNG/RECHTSPRECHUNG.
**Nicht** umgeschrieben: Chronik, `archiv/`, alte STRUKTUR-Session-Karten,
historische Audit-/Fund-Zitate (`fahrplanSlicerKern.ts`-Kommentar,
FAHRPLAN-TOKEN-OEKONOMIE §11.2, FAHRPLAN-GESAMTAUFBAU-Protokolle) — sie
beschreiben vergangene Stände; ein Treffer dort ist ein archivierter Verweis,
kein lebender (Analogie: Chronik-Regel in `bauschritt/aufraeumen.md` §4).

**Pflegebedarf:** keiner — die zwei Zieltexte sind die alleinige Quelle.
**Abnahme-Status:** einfach belegt — adversariale Gegenprüfung «kein
Regelverlust» (Opus, high, read-only) in derselben Session: Verdikt
**bestanden unter vier Auflagen**; alle sieben Befunde (4 Auflagen + 3
Kleinfunde) noch in der Session umgesetzt (dieser Stand). Toter
STRUKTUR-Zeiger auf Skill `aufraeumen` geheilt (Befund 6).
