# Steuerflächen-Diät 2.10.2026 — Belege aus `docs/token-oekonomie/dispatch-template.md`

Verschoben 2026-10-02 (QS-DOKU-DIAET, Auftrag David «räum die plan-doku auf», Spec `.claude/notizen/2026-10-02-steuerflaeche-diaet-spec.md`). Quelle: `docs/token-oekonomie/dispatch-template.md`.
Wortlaut der Passagen unverändert (Byte-Kopie der Spanne); am Ursprungsort bleiben Regel + Zeiger «Archiv §<Label>». Datierte Belege werden hier nie nachgeführt, nur ergänzt (Dispatch-§0 Ziff. 2b).

## §Zweck-T2-Baseline

Stelle: Kopf-Zitat «Zweck:» (vor §0)

>
> **Zweck:** Ein Sub-Agent-Auftrag verbraucht heute ~7–25k Tok, die sich vermeiden lassen —
> 5–15k Exploration (fremdes Suchen statt gezieltem Slice) + 2–9,5k Rückgabe (8k-Prosa statt
> 500-Tok-Return). Der Effekt ist **multiplikativ** über jede delegierte Einheit; laut T2-Baseline
> ist Typ **O** (orchestrierte Sessions) mit 99M Tok Mean / $113 pro Session der Pro-Session-
> Grossverbraucher — genau diese Sessions kappt sauberes Delegieren.

## §0a-Ersparnis

Stelle: §0a, Absatz «Ersparnis, gemessen 7.8.2026»

**Ersparnis, gemessen 7.8.2026** (Zeichen beider Fassungen über
`pflichtKlausel()`): Voll-Block 1 607 Zeichen / 23 Zeilen, Prüf-Block 920
Zeichen / 14 Zeilen — **Delta 687 Zeichen / 9 Zeilen ≈ 200 Token** je Prüf-
oder Recherche-Dispatch, und zwar frischer, ungecachter Input zum Vollpreis
(Bilanz weiter unten). Entscheid David 7.8.2026 (Ent-Regulierung,
`bibliothek/betrieb/entregulierung-2026-08-07.md` Punkt 4).

## §Arbeitsteilung-Langlaeufer

Stelle: Arbeitsteilung, Punkt «Langläufer bekommen einen Deckel»

 (Lehre 7.8.2026: ~1 h verwaiste
  Beweis-Schleifen, während die CI längst entschieden hatte)

## §Arbeitsteilung-Realfall

Stelle: Arbeitsteilung, Punkt «Gegenprüfung sofort dispatchen», Realfall

Realfall: 10 QS-CODE-PRs
  vom 4.8. blieben offen (4 davon ohne je dispatchte Gegenprüfung), die
  Nacht-Session musste Prüfung + Landung komplett nachholen (§17).

## §Bilanz

Stelle: «Was der Block kostet — ehrliche Bilanz (Korrektur 20.7.2026)», Rechnung + Messtabellen

PR #315 wies eine Netto-Bilanz von **«≈ −511 Token je Dispatch»** aus (aus
`CLAUDE.md` 27 557 → 25 718 Zeichen). Die *Messung* stimmt, die **Bezugsgrösse
nicht** — die adversariale Prüfung hat das aufgedeckt. Zwei unabhängige Fehler,
beide in dieselbe Richtung:

1. **Cache.** `CLAUDE.md` liegt im Prompt-Präfix, der zu ~95,8 % Cache-Read ist.
   Gecachter Input kostet rund ein Zehntel. Die Kürzung wirkt also **einmal je
   Session** mit ~−55 effektiven Token, nicht je Dispatch.
2. **Multiplizität.** **Sub-Agenten erhalten `CLAUDE.md` gar nicht** (verifiziert
   20.7.2026) — das ist die Kernprämisse dieses Templates. Ein Dispatch profitiert
   von der Kürzung um **exakt 0 Token**.

Dagegen ist der §0-Block **frischer, ungecachter Input bei jedem Dispatch, zum
Vollpreis**. Der Plan veranschlagte «~13 Zeilen ≈ 150 Token» — real ist es ein
Vielfaches.

**Zahlen nachgemessen am 7.8.2026** (die Fassung vom 20.7.2026 nannte 20 Zeilen /
1 397 Zeichen für den Block und 1 529–1 584 Zeichen für den Generator-Output;
beides ist seither gewachsen — nachrechnen, nicht abschreiben):

| gemessen 7.8.2026 | Zeichen | Zeilen |
|---|---|---|
| §0-Block, Fassung `voll` | 1 607 | 23 |
| §0-Block, Fassung `pruefung` (§0a) | 920 | 14 |
| Generator-Output, schreibende Klassen | 1 775–1 993 | 26–27 |
| Generator-Output, read-only-Klassen | 1 052–1 072 | 17 |

| | wirkt | Häufigkeit | Preis |
|---|---|---|---|
| `CLAUDE.md` −1 839 Zeichen | Orchestrator | 1× je Session | ~10 % (Cache) → ≈ −55 Tok |
| §0-Block `voll` +1 607 Zeichen | schreibender Sub-Agent | N× je Session | 100 % (frisch) → ≈ +470 Tok |
| §0-Block `pruefung` +920 Zeichen | read-only-Sub-Agent | N× je Session | 100 % (frisch) → ≈ +270 Tok |

Token-Schätzung durchgehend mit ~3,4 Zeichen je Token für deutschen Fliesstext;
die Zeichenzahlen sind die harte, jederzeit nachrechenbare Grösse. Bei 20
Dispatches je Session liegt die reale Bilanz weiterhin bei **rund +8 000 bis
+9 000 frischen Token pro Session** — das **umgekehrte Vorzeichen** der
ursprünglichen Behauptung, und die §0a-Variante senkt den Posten nur dort, wo
die Punkte 4–6 ohnehin ins Leere greifen.

## §Warum-sechs

Stelle: «Warum genau diese sechs» — Fehlerklassen-Tabelle

**Warum genau diese sechs** (Fehlerklassen-Zuordnung, Vorfälle 18.–20.7.2026):

| Nr. | Fehlerklasse | Beleg |
|---|---|---|
| 1 | F4 Bericht als Wahrheit | 1× fabrizierter Erfolgsbericht bei 0 Tool-Calls, 1× Injection-Versuch |
| 2 | F2d Substring-Beleg | `check-besetzung` belegte Richter:innen per `includes()` → 11 Phantome (#309) |
| 3 | F3 Diagnose ohne Verteilung | 4× an einem Tag Rauschen als Feature-Regression gedeutet |
| 4 | F5 verlorene Arbeit | ~6 Agenten-Tode, einmal ~2 h Arbeit fast verloren |
| 5 | F6 Doppelarbeit | 2 Sessions bauten denselben CLS-Fix in `SuchResultate.tsx` |
| 6 | F1 Merge vor Prüfung | #309: Merge-Erlaubnis stand im Bau-Auftrag; maschinell heute `check:merge-schutz` |

## §Kaveat-mechanisch

Stelle: §2, «Kaveat mechanisch (Vorfall 4.8.2026)»

ein Haiku-Lauf schnitt ROADMAP-Prosa aus, ohne das Chronik-Gegenstück
anzulegen (stille Prosa-Vernichtung, Branch verworfen)

## §Anhang-A

Stelle: Anhang A · Probe-Dispatches (DoD T4/T15), gesamter Text

Zehn Muster-Dispatch-Köpfe über die realen Auftragsklassen. **Jeder** trägt `model`+`effort`
explizit (DoD T15: Stichprobe 10/10 = 100 % explizit) und hält das Schema aus §1/§3.
*(Beispiele vom Juli 2026, vor der Stufen-Umstellung: `opus` lies als Stufe stark, `sonnet`
als mittel, `haiku` als klein — massgeblich ist `PALETTE`. Heute laufen dieselben Aufträge
bevorzugt über die Agent-Typen `lex-*`, §0.)*

1. **UI-Bau** — Reader-Randtitel-Fix.
   `model=opus effort=high` · §-Slice `fahrplan -- FAHRPLAN-GESETZES-UX §10` ·
   Whitelist `src/components/gesetz-leser/**` · TABU Datenfläche (`public/normtext/*.json` nur via
   `npm run zeige`) · Rückgabe §3 · golden byte-gleich IM Agenten.
2. **Extraktion** — neuen Bund-Erlass generieren.
   `model=opus effort=high` (Risikopfad) · §-Slice `fahrplan -- FAHRPLAN-NORMTEXT-DARSTELLUNG §M13` ·
   Whitelist `scripts/normtext/**` + Generator-Output via Lauf · TABU Hand-Edit der JSONs ·
   Rückgabe §3 **inkl. Gegenprüfungs-Verdikt/Linsen/Befunde** (K2).
3. **Gegenprüfung** — Zweitdurchgang Tarif-Diff.
   `model=opus effort=high` (fix) · Beschaffung: gepinnter Filestore-HTML + Scope-Anker (T11) ·
   Prüf-Agent macht Currency-Check selbst · Re-Derivation aus der Norm vollständig · Rückgabe:
   Verdikt + Beleg (Norm/§/Link/Stand), Befunde ungekürzt.
4. **Recherche/Sweep** — „wo lebt Symbol X?".
   `model=sonnet effort=medium` · Navigation ast-grep/LSP zuerst · Whitelist keine (read-only) ·
   Rückgabe: Pfade + Fundstellen, keine Datei-Dumps.
5. **Mechanisch** — Erledigt-Prosa in `ROADMAP-CHRONIK.md` verschieben.
   `model=haiku effort=low` · deterministische Verschiebung, Byte-Diff prüfbar · Whitelist
   `ROADMAP.md`, `ROADMAP-CHRONIK.md` · Rückgabe: Pfade + Zeilenzahl-Delta.
6. **Synthese** — Session-Handoff schreiben.
   `model=sonnet effort=medium` (mind. Sonnet, steuert Folge-Sessions) · Whitelist `STRUKTUR.md` ·
   Rückgabe: Karte-Kern + Pointer, kein Detailspeicher (§14.6).
7. **Log-Diät** — roten CI-Run extrahieren.
   `model=haiku effort=low` · `npm run ci:log [-- <run-id>]` (T12 Stufe 1: ent-präfixt +
   gruppiert, Fails vollständig) · read-only · Rückgabe: Fail-Block + Job-Name.
8. **Perf-Bau** — CLS-Mindesthöhe an einer Komponente.
   `model=opus effort=medium` · §-Slice `fahrplan -- FAHRPLAN-PERFORMANCE §…` · Whitelist die
   eine Komponente · golden + `check:perf-budget` IM Agenten · Rückgabe §3.
9. **Fakt-Check UI** — „steht der Wert im DOM?".
   `model=sonnet effort=low` · **DOM-Assertion** (T18-Positivliste: Textinhalt), **kein
   Screenshot** · Rückgabe: gefunden ja/nein + Selektor.
10. **Visueller Check** — „ist der Randtitel abgeschnitten?".
    `model=opus effort=medium` · **Screenshot-pflichtig** (T18: Clipping/Geometrie) — DOM
    genügt hier nicht · Rückgabe: Befund + Bildverweis.

**DoD-Beweis:** 10/10 Köpfe tragen `model`+`effort` explizit; keiner routet eine Synthese
(#6) oder einen Risikopfad/Gegenprüfung (#2,#3,#8,#10) unter das jeweilige Minimum; #9 nutzt
DOM nur für einen Fakt (Positivliste), #10 bleibt Screenshot.

## §7-Offen

Stelle: §7 «Offen / abhängig», erster Punkt (T19)

- **T19 Warn-Injektions-Entfernung** — ✅ **erledigt** (11.7.2026, nach T1/#176). Die git-zustands-
  abhängige (byte-instabile) SessionStart-Injektion aus `.claude/hooks/struktur-aktuell.py` ist aus
  der SessionStart-Kette (`.claude/settings.json`) entfernt → Präfix byte-stabil. Die Schutzfunktion
  trägt jetzt mechanisch `struktur-rotieren.py` (T1-Rotation rückt die Basis nach + Re-Akkumulations-
  Wächter, size-basiert = stabil); das Lag-Audit bleibt als On-Demand-Werkzeug `npm run struktur:aktuell`.

## §2-Wirkung

Stelle: §2, Absatz «model und effort sind in JEDEM Task-Call explizit gesetzt», Wirkungs-Zahlen

Wirkung: bis
−48…−76 % Output auf effort-gesenkten Schritten; die Klein-Stufe ≈ 1/5 des Preises der
Stark-Stufe. Output ist laut T2-Baseline der eigentliche $-Hebel (Stark-Output ≈ 5× Input,
in Typ-O-Sessions 494k Tok/Session) — hier wirkt Effort-Senkung direkt.
