---
name: lehren
description: Verwenden, wenn etwas schiefgegangen ist und die Lehre bleiben soll — Trigger «das ist schon wieder passiert», «warum haben wir das nicht gemerkt», «Lehre festhalten», «Postmortem», «das darf nicht nochmal passieren» — oder wenn ein wiederkehrendes Fehlermuster auffällt. Auch bei §17-Prozessarbeit (CI, Merge, Doku, Werkzeug an der Wurzel beheben, verschlanken, löschen, automatisieren) und bei Rückbau. Enthält F1–F9-Register, Formregel, Gegengewicht und die Fünf-Schritte-Reihenfolge.
---

# Lehren — Fehlerklassen, Formregel, Rückbau

## Formregel

**Tor nur bei datiertem Fang in Rechtsdaten/-logik oder zweitem
Prozessvorfall; sonst Skill-Satz oder nichts.** Ein Satz, der den Sub-Agenten
vor der Arbeit erreichen muss, gehört in die Agent-Definitionen
(`.claude/agents/lex-*.md`); `CLAUDE.md` nur für immer gültige Invarianten.
Ein Tor zählt erst nach Sabotage-Beweis (einmal rot, einmal grün) und unter
der Nachwachs-Sperre (Skill `refactoring` Ziff. 7).

## Register der Fehlerklassen

| # | Klasse · Muster | Gegenmittel — Ort |
|---|---|---|
| F1 | **Merge vor Prüfung** — Merge-Erlaubnis stand im Bau-Auftrag, Erfundenes ging live (#309) | `tor-schutz.py` blockt `gh pr merge` → `check:merge-schutz`; Skill `landung` |
| F2 | **Tor, das lügt** — prüft gegen eigene Ladung, läuft in CI nicht, `cancelled` gilt als grün, Substring-Beleg, kann nie grün werden, prüft Container statt Inhalt, rot nur durch Render-Timing, Wächter wartet stumm, Retry maskiert Erstrot, Prüfung gegen altes Bundle (#960) | Skill `refactoring` Ziff. 7 (a)–(d); `check:tor-paritaet`, `check:ci-laeufe`; e2e mit `reducedMotion`, nie `waitForTimeout`; Wächter meldet Stillstand nach 2 Runden; Playwright-`webServer` baut vor dem Preview |
| F3 | **Diagnose ohne Verteilung** — Messrauschen als Regression gedeutet; Sperre gegen den gedachten statt den realen Bestand gebaut | Agent-Definitionen: Nullprobe zuerst, Streuung gegen Schwelle, Stichprobe und Messbedingung nennen — auch beim Bau einer Sperre |
| F4 | **Bericht als Wahrheit** — erfundener Erfolgsbericht, ungeprüft übernommene Zahl, Bauer quittiert sich selbst (#616) | CLAUDE.md §14.7 + Vertrauensgrenze in jeder Agent-Definition; Skill `gegenpruefung` Regel 5 |
| F5 | **Verlorene Agenten-Arbeit** — Agent stirbt uncommittet oder wartet auf etwas, das nie kommt | Agent-Definitionen: WIP-Commit je Teilschritt, nie mit «wartet auf …» enden; Sub-Agenten spawnen keine Gegenprüfung |
| F6 | **Doppelarbeit** — zwei Sessions bauen dasselbe (#397) | Kollisions-Sonden (PRs, Remote-Zweige, Worktrees) + Zweig vor dem Detailplan pushen; Skill `bauschritt` Station A |
| F7 | **Zustandsspiegel nur vorwärts getestet** — History-Back verlor `?q=` | auch rückwärts testen (Back, Forward, geteilte URL, Reload); an `src/components/suche/useSucheAusUrl.ts` andocken |
| F8 | **Beleg ans Tor angepasst** — datierte Repro-Kommentare auf neuen Stand umgeschrieben | Agent-Definitionen: datierte Belege nur ergänzen, nie nachführen |
| F9 | **Stand-Leser nimmt Zukunft** — Ankündigungsdatum als Stand gelesen | Tor `stand ≤ heute` über alle Snapshots + Adapter schliesst künftige Daten aus |
| F10 | **Doku-Klassierung überspringt das Tor** — Hand-Edit an Agent-Definitionen lief als «doku» ohne Tore-Job (#619) | `scripts/ci/diff-klassieren.ts`: `.claude/agents/**` und Hook-/Tor-Dateien zählen als Code; `check:tor-paritaet` |
| F11 | **Additiver Refresh überschreibt Bestandsdaten** — Regeste-Refresh löschte `regeste.sprachfassungen` bei 6 von 1259 BGE (#816) | `mergeB1Ergebnis()` in `scripts/normtext/entscheide-b1-merge.ts` behält additive Altfelder; Delta-Prüfung vor jedem Korpus-Refresh |

Offene Ursache: endet ein Push-Lauf auf main «cancelled», bleibt der Stand
unausgeliefert (Skill `landung` Nachkontrolle 1). Historische Klassen F10–F17
und Vorfallsprosa: `git show 3fd5db8f9:.claude/skills/lehren/SKILL.md`.

## Eine neue Lehre ablegen

1. **Klasse bestimmen.** Passt der Vorfall in eine Klasse, dort das
   Gegenmittel verschärfen statt eine Regel daneben zu legen.
2. **Form nach der Formregel.**
3. **Neue Klasse** nur mit Vorfall (PR, Schaden) — ohne Vorfall ist sie
   Vermutung.
4. **Zweimal trotz Gegenmittel** ⇒ das Gegenmittel greift nicht; Form
   eskalieren (Skill-Satz → Agent-Definition → Tor).

## Gegengewicht — Rückbau gehört dazu

1. Wer etwas hinzufügt, ersetzt zuerst die Stelle, die dieselbe Sorge trägt —
   oder sagt, dass es keine gibt.
2. Was nicht scheitern kann, wird gestrichen statt bewacht — auch Tests und
   Tore, die weder Rechtslogik noch Rechtsdaten decken und nie etwas gefangen
   haben (Beweis vor Löschung: Skill `bauschritt` «Plan-Pflege und Rückbau»).
   Prüftiefe auf Rechtslogik und Rechtsdaten bleibt.
3. Eine Regel, deren Anlass sich nicht benennen lässt (git log,
   `plan/ENTSCHEIDE.md`), ist Rückbau-Kandidat.
4. Der Plan bildet Kapazität ab, nicht Absicht.

Bei Konflikt gewinnt der Rückbau — ausser die Stelle hat einen belegten
Vorfall verhindert. §1 bleibt unberührt. Den Umfang begrenzt `check:deckel`.

**Streich-Prüfung je Satz:** (a) handelte der Agent ohne ihn anders? Nein ⇒
streichen. (b) steht es schon in Datei, Konfiguration oder `--help`? ⇒
Verweis statt Wortlaut. (c) dieselbe Aufzählung an mehreren Orten ⇒ ein
Leitwort. Trägt ein Satz einen offenen Auftrag, wird er vor dem Streichen
ausgeführt oder als EINGANG-Zeile angelegt. Rechtsschutz-Text bleibt aussen
vor.

## §17-Prozessarbeit: fünf Schritte

Nur Prozess (CI, Tore, Merge- und Plan-Prozess, Steuer-Doku,
Werkstatt-Skripte), nie Produkt — Rechtslogik folgt Skill `refactoring`. Die
Reihenfolge ist nicht verhandelbar:

1. **Anforderung hinterfragen** (Chesterton): Anlass klären; fällt erst, wenn
   er entfallen ist.
2. **Löschen**, was den Zweck nicht mehr erfüllt — nicht umschiffen.
3. **Vereinfachen**, was das Löschen überlebt hat.
4. **Beschleunigen** erst nach Stabilisierung, mit Nullprobe (F3).
5. **Automatisieren** zuletzt und nur Stabiles — ein automatisierter kaputter
   Prozess zementiert den Fehler.

## Diagnose-Heuristiken

- Playwright: `××F` hart rot, `×±` flaky; `getByRole({name})` sucht den
  Accessible Name.
- `git mv` per Pathspec-Commit: `--stat` muss `R… old -> new` zeigen, nicht
  `create mode`.
- «Failed to fetch dynamically imported module» nach Build: zuerst
  `git status` (Parallel-Session).
- `vite preview` sendet keine CSP-Header — CSP dort weder belegt noch
  widerlegt.
- CI-«failure» nach 3–4 s mit Zahlungs-Annotation = Billing-Sperre, kein
  Code-Fehler.
- SessionStart-Texte nur byte-konstant (sonst bricht der Prompt-Cache).
