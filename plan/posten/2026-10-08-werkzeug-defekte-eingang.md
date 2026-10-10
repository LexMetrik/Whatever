<!-- @posten
dach: QS-TORE-DIAET
titel: Werkzeug- und Tor-Defekte aus dem EINGANG (5.–7.10.2026)
anlass: ROADMAP.md über 15 KB und EINGANG über 30 Zeilen (Regel 3), 8.10.2026 — fünf E3/E3·W-Zeilen ohne Go hierher gebündelt statt gestrichen
-->

Wortlaut der fünf EINGANG-Zeilen (Stand ROADMAP 7.10.2026), unverändert:

1. E3·W · 5.10. · Tore/Hooks: tor-schutz.py Quote-Split (Diff 5260e0118), gate-stopp.py, tor-paritaet (GP #1323), Streich-Runde nie fündiger Tore (Freigabe 22.9.) — QS-CPU, QS-TORE-DIAET
2. E3·W · 5.10. · Rückbau nach Umstieg (flaechenZeile, trendZeile, Rotation, ci.yml:70), Worktrees bleiben liegen, 8.10. CI-Sparplan nachmessen; PLAN_BUCHUNG_TOKEN gegenstandslos (David)
3. E3 · 7.10. · check-merge-schutz.ts:43 nutzt git diff mit Rename-Erkennung: Risiko-Datei, auf Nicht-Risiko-Pfad verschoben, fällt aus dem Tor — Wurzel-Fix --no-renames wie kern.ts — scripts/check-merge-schutz.ts
4. E3 · 7.10. · Daten-Cache-Bruch nach Deploy: Inhalts-Hash je public-Datei im Manifest statt Deploy-SHA-Parameter (#1349 verworfen, entwertet MB-Caches) — vercel.json, src/lib/ladeJson.ts
5. E3 · 7.10. · check:fachaenderung liest den PR-Titel aus dem Ereignis (prTitelAusEreignis): «Re-run» nach Titel-Korrektur bleibt rot, kostete einen CI-Zyklus (#1349) — Titel wie den Body live per API holen (holePrKoerperEcht) — scripts/check-fachaenderung.ts

Stand 8.10.2026 zu Ziff. 2: Worktree `nostalgic-pike-a7edae` samt Zweig `claude/nifty-feynman-86ce82` entfernt (gelandet, sauber); `e0-brandschutz` bleibt (A1-FUNDAMENT läuft). `PLAN_BUCHUNG_TOKEN` steht noch in den GitHub-Secrets (gesetzt 14.8.2026, von keinem Workflow gelesen) — Löschen ist Davids Handgriff.

Vorrang: Ziff. 3 ist eine Lücke im Merge-Schutz für Risiko-Pfade — zuerst.

## Nachtrag 10.10.2026 — StarNet-Sichtung (Go David 10.10.)

Herkunft: Sichtung `bibliothek/recherche/starnet-sichtung-2026-10-10.md`; David wählte im Chat alle drei
empfohlenen Punkte, Ablage «In Bestehendes» (Punkt 1 steht in ROADMAP JETZT 2).

6. **Faktenschutz beim Verdichten und Lektorieren** — `docs/token-oekonomie/dispatch-template.md` §0 Ziff. 2b
   um einen Satz erweitern (kein neuer Abschnitt): Wer Text kürzt, zusammenfasst oder glättet, ändert nie
   eine Zahl, ein Datum, eine Verneinung oder eine Modalität («hätte» ≠ «hat»); Zweifel ⇒ Wortlaut stehen
   lassen. Vorfall: #1310 (95c025591) machte aus Links, die ein Guard entfernt **hätte**, «371 falsche
   Selbstlinks» (Merkzettel `…-des-der-guard-…`, 31.8.; berichtigt 7.10.). Parallele aus StarNet-Praxistest:
   Stil-Lektorin strich inhaltlich «Im Sommer». Hinweis, kein Tor (Prozess-Entscheid 25.9.).
7. **Rückbau der toten Token-Messkette** (§17-Gegengewicht) — `.claude/settings.json` env
   `OTEL_METRICS_EXPORTER` + `CLAUDE_CODE_ENABLE_TELEMETRY`, `token_ablesen()` in
   `.claude/hooks/abschluss-wache.py` (Z. ~121–147; Docstring nennt das gelöschte `selbstopt:erheben`),
   gitignorte Spool `messwerte/token-spool.jsonl` (140 Zeilen, letzter Eintrag 25.9., kein Leser).
   Verbrauch misst `plan/posten/anhang/2026-09-21-verbrauch-summe.py` aus den Transkripten. Hook-Teil als
   Diff an David (Klassifizierer blockt Hook-Edits). Vorher klären: nutzt David Port 9464 privat?
   Schliesst die archivierten, unbehobenen Merkzettel `2026-09-20-hook-prosa-nennt-retro-17-…` und
   `2026-09-21-token-spool-jsonl-leser-pruefen`.
