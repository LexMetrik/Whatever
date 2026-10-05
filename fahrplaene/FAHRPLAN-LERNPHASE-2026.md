# Fahrplan Lernphase 2026 — Bauen ohne Davids Fachzeit (bis 1.12.2026)
<!-- @lagebild name: Prüfwerkzeuge schärfen · zweck: Gegenprüfung schneller melden, Tests stabiler, Beweis-Werkzeuge. -->

> **Eingefroren 5.10.2026:** Spezifikation, kein Bau-Stand; Fortschritts-Häkchen werden nicht mehr nachgeführt; Entscheidtabellen gelten unverändert.

**Heimat: ROADMAP-Schritte `LERNPHASE-AB` und `QS-GP`.**

## §0 · Zweck

Detailquelle zu `LERNPHASE-AB`/`QS-GP` — was ohne Davids fachliche Detail-Abnahme
gebaut werden kann, bis zur Anwaltsprüfung (harte Zeitsperre bis 1.12.2026, **keine
Vermeidung**: Abnahme bis dahin nicht proaktiv vorschlagen/drängen).

**Auftrag David (22.6.2026):** Bis zur Anwaltsprüfung (**läuft bis 1.12.2026**) hat David **keine
Zeit für die fachliche Detail-Abnahme**. Das ist eine harte Zeitsperre, **keine Vermeidung** —
Abnahme bis dahin NICHT proaktiv vorschlagen/drängen (vgl. Memory `lexmetrik-abnahme-zeitsperre`,
`abnahme-david-selbst`). Erste Kanzleigespräche **G1 = Februar 2027** (nach der Prüfung).

**Herleitung:** Zwei unabhängige Council-Läufe (DMAD, Sonnet- + Opus-Panel, 22.6.2026) kamen auf
denselben Kern: Der einzige verteidigbare Solo-Moat ist die **fachkundige Abnahme** (Moat C+D),
nicht die Breite (Code = ~6 Monate kopierbar). Davids Erst-Abnahme ist die einzige
nicht-delegierbare, nicht-parallelisierbare Ressource — und steht bis 1.12. faktisch bei ~0/Woche.
Daraus folgt: Die Spannung «weiter bauen vs. abnehmen» (STRATEGIE-PLATTFORM §0 Befund 3 vs.
Ausbau-Direktive 14.6.) löst sich auf der **Zeitachse** auf statt durch eine Entweder-oder-Wahl.

```
Jun 2026 ───────────────► 1. Dez 2026 ──────────────► Feb 2027
   Lernphase                  Abnahme-Welle               G1
   (Agenten bauen,            (David, Fristen zuerst,      (geprüfter
    kein Abnahme-Druck)        Infrastruktur steht)         Kern)
```

**Leitsatz der Lernphase:** Bis Dezember nur Arbeit, die (a) **keine** Davids-Fachzeit braucht und
(b) die spätere Abnahme-Welle **billiger/schneller** macht. Jeder Bau bleibt auf `entwurf`-Niveau;
§8-Ehrlichkeit bleibt. Keine neue Engine wird als `verified`/`geprüft` ausgegeben (das geht erst
ab Dezember durch David).

---

## §1 · ROADMAP-Spec LERNPHASE-AB (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «Strang A», «Strang B», «Strang C» und «Erster Schritt am 1. Dezember 2026» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

  trägt sichtbaren ehrlichen Status (`verified`/`entwurf`/`geplant`) + Stand; Golden-Abdeckung &
  Norm-Anker-Prüfung automatisieren. **Werkzeug-Andockung (Audit 1, 2.7.):** `fast-check`-Property-Tests
  für Staffel-/Bandgrenzen (`src/tests/tarifInvarianten.test.ts` — fängt Off-by-one; Dev-Dependency,
  seed-deterministisch §2) · **Gate-Kette parallelisieren** (`package.json`-`check` via Promise.all/spawn,
  ~9,6 s → ~2–3 s, Bordmittel) · Myers-`diff`-Package NUR als `golden:diff`-Diagnose — **das Gate selbst
  bleibt Byte-Vergleich.** Detail `BACKLOG-AUDIT-WERKZEUGE-2026-07.md`. **Stärkste zeitsperre-konforme Arbeit** — macht die
  Dez-Abnahme billig; dauerhaft begleitend. **Alle drei Werkzeug-Andockungen erfüllt 5.7.2026**
  (PR `feat/lernphase-verifikations-infra`). Detail: `ROADMAP-CHRONIK.md` → LERNPHASE-AB.
  **Status-Korrektur 20.7.2026 (§8):** Die drei Werkzeug-Andockungen sind **fertig** (`9da9a9d4` ·
  `c6b7eef0` · `0d104ab5`, Doku `445001e9`, alle 5.7.2026) — seither **kein** Commit mit
  `Roadmap: LERNPHASE-AB`, kein Worktree, kein offener PR. Der **Dach-Auftrag** ist damit NICHT erledigt:
  «jede Karte/Engine trägt sichtbaren ehrlichen Status + Stand» (Strang A) und «Golden-Abdeckung &
  Norm-Anker-Prüfung automatisieren» sind nirgends als erfüllt belegt. Der Schritt stand nur deshalb auf
  `wip`, weil das Etikett nach dem 5.7. nie zurückgesetzt wurde ⇒ **`ready`** (offen, baubar, niemand baut).

---

## §2 · ROADMAP-Spec QS-GP (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «Strang B — Verifikations-Infrastruktur» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

  erweitert die Verifikations-Infrastruktur. Der adversariale Zweitdurchgang (unabhängiger
  Opus-Agent, frischer Kontext, Auftrag: Output gegen die amtliche Quelle **widerlegen**) fing real
  die teuersten Bugs (Tabellen-Drop, Footnote-Leak, `bis`/`ter`-Verlust), hängt aber bisher an
  Session-Disziplin statt an einem Tor. **Design-Detailquelle:**
  [`docs/superpowers/specs/2026-07-01-gegenpruefung-gate-design.md`](../docs/superpowers/specs/2026-07-01-gegenpruefung-gate-design.md);
  Nachweis-Register [`bibliothek/register/gegenpruefung-register.md`](../bibliothek/register/gegenpruefung-register.md).
  **Stand 1.7.2026: Bausteine a+b+c gebaut, gemergt PR #67 (`252731bd`) + prod-live** (Tor
  `check:gegenpruefung` in `npm run gate`, Skill »gegenpruefung«, Register + Quittier-Helfer
  `npm run gegenpruefung:ok`); offen nur Baustein d (rückwirkende Kampagne).
  **Präzisierung 20.7.2026 (§8 — die alte Formel «offen nur d» verdeckte, dass d SELBST dreistufig ist):**
  von den drei Kampagnen-Stufen **Rechnen → extrahierte Normen → Rest** ist **nur Stufe 1 «Rechnen» gelaufen**
  (`58e8237e`, 2.7.2026, ~45 norm-belegte Korrekturen, Trailer `Gegenpruefung: bestanden (Opus, 7 Linsen) —
  45 confirmed/0 refuted`; Report `bibliothek/register/QS-GP-KAMPAGNE-2026-07-02.md`, 127 Rohbefunde/38 Dateien).
  **Offen bleiben Stufe 2 (extrahierte Normen), Stufe 3 (Rest) und die BGE-Korpus-Regenerierung.** Das Register
  führt bisher **keinen Kampagnen-Burn-down**, sondern nur Diff-gebundene Einzelquittungen aus laufender
  Bauarbeit — der rückwirkende Fortschritt ist also nicht messbar; ihn messbar zu machen gehört in Stufe 2.
  Status darum `ready` (niemand baut daran), nicht `wip`.
  Wortlaut der gebauten Bausteine a·b·c samt Glob-Hinweis verschoben — die **as-built**-Wahrheit
  steht in `scripts/gegenpruefung/kern.ts` + der Spec. Detail: `ROADMAP-CHRONIK.md` → QS-GP.
  Offen bleibt Baustein d:
  - **d · Rückwirkende Kampagne** *(Batches, Opus, `[OF]`)* — risiko-priorisiert: **Rechnen →
    extrahierte Normen → Rest**; enthält die **BGE-Korpus-Regenerierung** (Welle 2 · 6). Gegen
    amtliche Quelle verifizierbar; Verdikte ins Register (c). **Constraints:** reine Re-Verifikation
    öffnet **keinen** 26×-Slot; ein daraus folgender Daten-Bulklauf (Korpus neu ziehen) ist ein
    26×-Asset → nur bei freiem Slot, nie zwei parallel (Leitprinzip 4). Korrekturen aus der Kampagne
    sind verhaltensändernd → golden-gegated (§6) + Push/Deploy nur auf Davids Ja (§9).

---


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

7 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-LERNPHASE-2026.md`](../archiv/fahrplaene/FAHRPLAN-LERNPHASE-2026.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- Strang A — Ehrliche Status-Marker (haftungssicher ohne Abnahme)
- Strang B — Verifikations-Infrastruktur (der «Multiplikator danach»)
- Strang C — Fristen-Engines abnahmefertig aufreihen (Dezember-Welle vorbereiten)
- Erster Schritt am 1. Dezember 2026
- Tabu / Leitplanken (Lernphase)
- §3 · Gegenprüfungs- und Verifikations-Werkzeuge (§14-Intake 3.8.2026 + Nachbefunde, §3.1–§3.7)
- §4 · ROADMAP-Spec-Nachzug der §3-Kind-Schritte (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)
